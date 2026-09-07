import os
import json
import time
import fcntl
import logging
import threading
import requests
from django.conf import settings
from django.db import close_old_connections

logger = logging.getLogger(__name__)

# Global flag to manage the polling worker
_POLLING_ACTIVE = True
_POLLING_THREAD = None
_LOCK_FILE = None

# In-memory caches with persistent backing
OFFSET_FILE = os.path.join(settings.BASE_DIR, '.bot_offsets.json')
PROCESSED_UPDATES_FILE = os.path.join(settings.BASE_DIR, '.processed_updates.json')
LOCK_FILE_PATH = os.path.join(settings.BASE_DIR, '.telegram_polling.lock')

_OFFSET_CACHE = {}
_PROCESSED_UPDATES = set()
_LAST_START_TIMES = {}  # chat_id -> timestamp
_CHECKED_WEBHOOKS = set()


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
    """Save offsets and processed update IDs to disk"""
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


# Initialize state on module load
_load_persisted_state()


def ensure_clean_webhook(token):
    """Delete any pending webhook so long-polling receives all updates cleanly"""
    if token in _CHECKED_WEBHOOKS:
        return
    try:
        res = requests.post(f"https://api.telegram.org/bot{token}/deleteWebhook", json={'drop_pending_updates': False}, timeout=5)
        if res.status_code == 200:
            _CHECKED_WEBHOOKS.add(token)
            logger.info(f"Verified clean webhook status for bot token ...{token[-6:]}")
    except Exception as e:
        logger.debug(f"deleteWebhook check: {e}")


def poll_store_bot(store):
    """Poll updates for a single store bot with strict deduplication and persistent offset"""
    token = (store.telegram_bot_token or '').strip()
    if not token:
        return

    ensure_clean_webhook(token)

    offset = _OFFSET_CACHE.get(token, None)
    url = f"https://api.telegram.org/bot{token}/getUpdates"
    params = {'timeout': 3, 'limit': 25}
    if offset:
        params['offset'] = offset

    try:
        res = requests.get(url, params=params, timeout=7)
        if res.status_code == 200:
            data = res.json()
            if data.get('ok'):
                updates = data.get('result', [])
                if not updates:
                    return

                from apps.telegram_bot.services import process_telegram_update

                highest_update_id = offset or 0
                state_changed = False

                for update in updates:
                    update_id = update.get('update_id')
                    if update_id is None:
                        continue

                    if update_id >= highest_update_id:
                        highest_update_id = update_id + 1

                    # 1. Deduplication check: ignore if already processed
                    if update_id in _PROCESSED_UPDATES:
                        logger.debug(f"Skipping duplicate update {update_id} for store {store.name}")
                        continue

                    # 2. Debounce repeated /start commands from same user within 2 seconds
                    message = update.get('message') or {}
                    chat_id = message.get('chat', {}).get('id')
                    msg_text = (message.get('text') or '').strip().lower()

                    if chat_id and (msg_text.startswith('/start') or msg_text.startswith('/menu')):
                        now = time.time()
                        last_time = _LAST_START_TIMES.get(chat_id, 0)
                        if (now - last_time) < 2.0:
                            logger.info(f"Debounced duplicate /start from chat {chat_id} within {now - last_time:.2f}s")
                            _PROCESSED_UPDATES.add(update_id)
                            state_changed = True
                            continue
                        _LAST_START_TIMES[chat_id] = now

                    # 3. Mark update as processed
                    _PROCESSED_UPDATES.add(update_id)
                    state_changed = True

                    try:
                        process_telegram_update(store, update)
                    except Exception as e:
                        logger.error(f"Error processing update {update_id} for store {store.name}: {e}", exc_info=True)

                # Update and persist offset
                if highest_update_id > (offset or 0):
                    _OFFSET_CACHE[token] = highest_update_id
                    state_changed = True

                if state_changed:
                    _save_persisted_state()

        elif res.status_code == 409:
            logger.warning(f"Telegram 409 Conflict for store {store.name}. Another process might be polling.")
            time.sleep(1)
    except requests.exceptions.Timeout:
        pass
    except Exception as e:
        logger.debug(f"Polling error for store {store.name}: {e}")


def acquire_polling_lock():
    """Acquire a non-blocking inter-process file lock so only ONE worker polls Telegram"""
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
    """Release file lock when polling worker terminates"""
    global _LOCK_FILE
    if _LOCK_FILE:
        try:
            fcntl.flock(_LOCK_FILE, fcntl.LOCK_UN)
            _LOCK_FILE.close()
        except Exception:
            pass
        _LOCK_FILE = None


def telegram_polling_loop():
    """Main polling loop running over all active store bots"""
    global _POLLING_ACTIVE
    
    if not acquire_polling_lock():
        return

    logger.info("StoreBox Telegram Polling Worker started successfully.")

    try:
        while _POLLING_ACTIVE:
            try:
                close_old_connections()
                from apps.stores.models import Store
                stores_with_bots = Store.objects.filter(is_active=True).exclude(telegram_bot_token='')

                for store in stores_with_bots:
                    poll_store_bot(store)
                    time.sleep(0.05)

                time.sleep(0.5)
            except Exception as e:
                logger.error(f"Error in telegram_polling_loop: {e}")
                time.sleep(2)
    finally:
        release_polling_lock()
        logger.info("StoreBox Telegram Polling Worker terminated and released lock.")


def start_polling_thread():
    """Start polling loop in a background daemon thread if not already running"""
    global _POLLING_THREAD, _POLLING_ACTIVE
    if _POLLING_THREAD and _POLLING_THREAD.is_alive():
        return _POLLING_THREAD

    _POLLING_ACTIVE = True
    _POLLING_THREAD = threading.Thread(target=telegram_polling_loop, daemon=True, name="TelegramPollingWorker")
    _POLLING_THREAD.start()
    logger.info("Telegram Polling Worker thread spawned.")
    return _POLLING_THREAD


def stop_polling_thread():
    """Stop the background polling worker"""
    global _POLLING_ACTIVE
    _POLLING_ACTIVE = False
    release_polling_lock()

