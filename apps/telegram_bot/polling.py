import os
import json
import time
import fcntl
import logging
import threading
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from django.conf import settings
from django.db import close_old_connections

logger = logging.getLogger(__name__)

# Control flags and tracking
_SUPERVISOR_ACTIVE = True
_SUPERVISOR_THREAD = None
_SUPERVISOR_WAKEUP = threading.Event()
_LOCK_FILE = None

# Active workers: {token: {'thread': Thread, 'stop_event': Event, 'store_id': int}}
_ACTIVE_WORKERS = {}
_WORKERS_LOCK = threading.Lock()
_INVALID_TOKENS = set()  # Tokens that returned 401/404

# Persistence paths
OFFSET_FILE = os.path.join(settings.BASE_DIR, '.bot_offsets.json')
PROCESSED_UPDATES_FILE = os.path.join(settings.BASE_DIR, '.processed_updates.json')
LOCK_FILE_PATH = os.path.join(settings.BASE_DIR, '.telegram_polling.lock')

_OFFSET_CACHE = {}
_PROCESSED_UPDATES = set()
_LAST_START_TIMES = {}  # chat_id -> timestamp
_STATE_LOCK = threading.Lock()


def _load_persisted_state():
    """Load offsets and processed update IDs from disk"""
    global _OFFSET_CACHE, _PROCESSED_UPDATES
    if os.path.exists(OFFSET_FILE):
        try:
            with open(OFFSET_FILE, 'r') as f:
                _OFFSET_CACHE.update(json.load(f))
        except Exception as e:
            logger.debug(f"Could not load bot offsets: {e}")

    if os.path.exists(PROCESSED_UPDATES_FILE):
        try:
            with open(PROCESSED_UPDATES_FILE, 'r') as f:
                saved_ids = json.load(f)
                if isinstance(saved_ids, list):
                    _PROCESSED_UPDATES.update(saved_ids[-5000:])
        except Exception as e:
            logger.debug(f"Could not load processed updates: {e}")


def _save_persisted_state():
    """Save offsets and processed update IDs to disk safely"""
    with _STATE_LOCK:
        try:
            with open(OFFSET_FILE, 'w') as f:
                json.dump(_OFFSET_CACHE, f)
        except Exception as e:
            logger.debug(f"Could not save bot offsets: {e}")

        try:
            with open(PROCESSED_UPDATES_FILE, 'w') as f:
                json.dump(list(_PROCESSED_UPDATES)[-5000:], f)
        except Exception as e:
            logger.debug(f"Could not save processed updates: {e}")


_load_persisted_state()


def ensure_clean_webhook(session, token):
    """Delete any existing webhook so long-polling receives updates immediately"""
    try:
        res = session.post(
            f"https://api.telegram.org/bot{token}/deleteWebhook",
            json={'drop_pending_updates': False},
            timeout=5
        )
        return res.status_code == 200
    except Exception as e:
        logger.debug(f"deleteWebhook check error: {e}")
        return False


def bot_polling_worker(token, store_id, stop_event):
    """Dedicated long-polling thread for a single bot token.
    Uses Telegram long-polling (timeout=20) with HTTP Keep-Alive.
    Yields updates in under 20ms the moment a user sends any message.
    """
    token_suffix = token[-6:] if len(token) >= 6 else token
    logger.info(f"[BotWorker ...{token_suffix}] Started polling for store ID {store_id}")

    session = requests.Session()
    adapter = HTTPAdapter(pool_connections=5, pool_maxsize=10, max_retries=Retry(total=2, backoff_factor=0.2))
    session.mount("https://", adapter)
    session.mount("http://", adapter)

    # Make sure webhook is removed so getUpdates works cleanly
    ensure_clean_webhook(session, token)

    consecutive_errors = 0

    while not stop_event.is_set():
        try:
            offset = _OFFSET_CACHE.get(token, None)
            url = f"https://api.telegram.org/bot{token}/getUpdates"
            params = {
                'timeout': 20,    # Telegram long-poll wait time on server
                'limit': 30,
            }
            if offset:
                params['offset'] = offset

            # HTTP timeout is slightly larger than Telegram long-poll timeout
            res = session.get(url, params=params, timeout=25)

            if res.status_code == 200:
                consecutive_errors = 0
                try:
                    data = res.json()
                except Exception:
                    continue

                if not data.get('ok'):
                    continue

                updates = data.get('result', [])
                if not updates:
                    continue

                # Fetch fresh store instance from DB
                close_old_connections()
                from apps.stores.models import Store
                try:
                    store = Store.objects.filter(id=store_id, is_active=True).first()
                    if not store:
                        store = Store.objects.filter(telegram_bot_token=token, is_active=True).first()
                        if not store:
                            logger.info(f"[BotWorker ...{token_suffix}] Store not found or inactive. Exiting worker.")
                            break
                except Exception as e:
                    logger.error(f"[BotWorker ...{token_suffix}] DB error: {e}")
                    time.sleep(0.5)
                    continue

                from apps.telegram_bot.services import process_telegram_update

                highest_update_id = offset or 0
                state_changed = False

                for update in updates:
                    update_id = update.get('update_id')
                    if update_id is None:
                        continue

                    if update_id >= highest_update_id:
                        highest_update_id = update_id + 1

                    # 1. Deduplication
                    if update_id in _PROCESSED_UPDATES:
                        continue

                    # 2. Debounce duplicate /start spam within 1 second
                    message = update.get('message') or {}
                    chat_id = message.get('chat', {}).get('id')
                    msg_text = (message.get('text') or '').strip().lower()

                    if chat_id and (msg_text.startswith('/start') or msg_text.startswith('/menu')):
                        now = time.time()
                        last_time = _LAST_START_TIMES.get(chat_id, 0)
                        if (now - last_time) < 1.0:
                            _PROCESSED_UPDATES.add(update_id)
                            state_changed = True
                            continue
                        _LAST_START_TIMES[chat_id] = now

                    _PROCESSED_UPDATES.add(update_id)
                    state_changed = True

                    # 3. Process update immediately!
                    t_proc = time.time()
                    try:
                        process_telegram_update(store, update)
                        proc_ms = (time.time() - t_proc) * 1000
                        logger.info(f"[BotWorker ...{token_suffix}] ⚡ Update {update_id} processed in {proc_ms:.1f}ms")
                    except Exception as e:
                        logger.error(f"[BotWorker ...{token_suffix}] Error in process_telegram_update: {e}", exc_info=True)

                if highest_update_id > (offset or 0):
                    _OFFSET_CACHE[token] = highest_update_id
                    state_changed = True

                if state_changed:
                    _save_persisted_state()

            elif res.status_code == 409:
                consecutive_errors += 1
                wait_time = min(15.0, 1.5 * consecutive_errors)
                logger.warning(f"[BotWorker ...{token_suffix}] 409 Conflict from Telegram. Waiting {wait_time:.1f}s...")
                stop_event.wait(wait_time)
            elif res.status_code in (401, 404):
                logger.error(f"[BotWorker ...{token_suffix}] Invalid token (HTTP {res.status_code}). Terminating worker.")
                _INVALID_TOKENS.add(token)
                break
            else:
                logger.warning(f"[BotWorker ...{token_suffix}] Unexpected HTTP {res.status_code}")
                stop_event.wait(1.0)

        except requests.exceptions.Timeout:
            # Standard long-polling cycle completed without new updates; loop immediately
            consecutive_errors = 0
            continue
        except requests.exceptions.ConnectionError:
            consecutive_errors += 1
            delay = min(5.0, 0.5 * consecutive_errors)
            stop_event.wait(delay)
        except Exception as e:
            logger.debug(f"[BotWorker ...{token_suffix}] Exception: {e}")
            stop_event.wait(1.0)

    session.close()
    logger.info(f"[BotWorker ...{token_suffix}] Stopped.")


def acquire_polling_lock():
    """Acquire a non-blocking inter-process file lock so only ONE supervisor runs"""
    global _LOCK_FILE
    try:
        _LOCK_FILE = open(LOCK_FILE_PATH, 'w')
        fcntl.flock(_LOCK_FILE, fcntl.LOCK_EX | fcntl.LOCK_NB)
        _LOCK_FILE.write(f"pid={os.getpid()}\ntime={time.time()}\n")
        _LOCK_FILE.flush()
        logger.info(f"Acquired Telegram Polling Process Lock (PID: {os.getpid()})")
        return True
    except (BlockingIOError, IOError):
        logger.warning(f"Another process already holds Telegram polling lock. Skipping polling in PID {os.getpid()}.")
        return False
    except Exception as e:
        logger.warning(f"Could not acquire polling file lock: {e}")
        return True


def release_polling_lock():
    """Release file lock when supervisor terminates"""
    global _LOCK_FILE
    if _LOCK_FILE:
        try:
            fcntl.flock(_LOCK_FILE, fcntl.LOCK_UN)
            _LOCK_FILE.close()
        except Exception:
            pass
        _LOCK_FILE = None


def supervisor_loop():
    """Supervisor thread: manages dedicated worker threads per unique bot token"""
    global _SUPERVISOR_ACTIVE

    if not acquire_polling_lock():
        return

    logger.info("StoreBox Telegram Supervisor started.")

    try:
        while _SUPERVISOR_ACTIVE:
            try:
                close_old_connections()
                from apps.stores.models import Store

                # Group active stores by unique token
                stores = list(Store.objects.filter(is_active=True).exclude(telegram_bot_token='').order_by('-updated_at'))
                active_tokens_map = {}
                for s in stores:
                    tok = (s.telegram_bot_token or '').strip()
                    if tok and tok not in active_tokens_map and tok not in _INVALID_TOKENS:
                        active_tokens_map[tok] = s.id

                with _WORKERS_LOCK:
                    # 1. Stop workers for removed tokens
                    for tok in list(_ACTIVE_WORKERS.keys()):
                        if tok not in active_tokens_map:
                            info = _ACTIVE_WORKERS.pop(tok)
                            info['stop_event'].set()

                    # 2. Clean up terminated worker threads
                    for tok in list(_ACTIVE_WORKERS.keys()):
                        t = _ACTIVE_WORKERS[tok]['thread']
                        if not t.is_alive():
                            _ACTIVE_WORKERS.pop(tok, None)

                    # 3. Start workers for new tokens
                    for tok, store_id in active_tokens_map.items():
                        if tok not in _ACTIVE_WORKERS:
                            stop_ev = threading.Event()
                            worker_t = threading.Thread(
                                target=bot_polling_worker,
                                args=(tok, store_id, stop_ev),
                                daemon=True,
                                name=f"BotWorker-{tok[-6:]}"
                            )
                            _ACTIVE_WORKERS[tok] = {
                                'thread': worker_t,
                                'stop_event': stop_ev,
                                'store_id': store_id
                            }
                            worker_t.start()

                # Sleep until woken up or 5 seconds pass
                _SUPERVISOR_WAKEUP.wait(5.0)
                _SUPERVISOR_WAKEUP.clear()

            except Exception as e:
                logger.error(f"Error in supervisor_loop: {e}")
                time.sleep(2.0)

    finally:
        with _WORKERS_LOCK:
            for tok, info in _ACTIVE_WORKERS.items():
                info['stop_event'].set()
            _ACTIVE_WORKERS.clear()
        release_polling_lock()
        logger.info("StoreBox Telegram Supervisor released lock and stopped.")


def notify_polling_changed():
    """Wake up supervisor immediately (e.g. after a bot token is saved)"""
    _SUPERVISOR_WAKEUP.set()


def start_polling_thread():
    """Start supervisor loop in a background daemon thread if not already running"""
    global _SUPERVISOR_THREAD, _SUPERVISOR_ACTIVE
    if _SUPERVISOR_THREAD and _SUPERVISOR_THREAD.is_alive():
        notify_polling_changed()
        return _SUPERVISOR_THREAD

    _SUPERVISOR_ACTIVE = True
    _SUPERVISOR_THREAD = threading.Thread(target=supervisor_loop, daemon=True, name="TelegramSupervisor")
    _SUPERVISOR_THREAD.start()
    logger.info("Telegram Polling Supervisor thread spawned.")
    return _SUPERVISOR_THREAD


def stop_polling_thread():
    """Stop the supervisor and all active bot workers"""
    global _SUPERVISOR_ACTIVE
    _SUPERVISOR_ACTIVE = False
    _SUPERVISOR_WAKEUP.set()
    release_polling_lock()

