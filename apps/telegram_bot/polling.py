import time
import logging
import threading
import requests
from django.db import close_old_connections

logger = logging.getLogger(__name__)

# Global flag to manage the polling worker
_POLLING_ACTIVE = True
_POLLING_THREAD = None
_OFFSET_CACHE = {}


def poll_store_bot(store):
    """Poll updates for a single store bot"""
    token = (store.telegram_bot_token or '').strip()
    if not token:
        return

    offset = _OFFSET_CACHE.get(token, None)
    url = f"https://api.telegram.org/bot{token}/getUpdates"
    params = {'timeout': 3, 'limit': 20}
    if offset:
        params['offset'] = offset

    try:
        res = requests.get(url, params=params, timeout=6)
        if res.status_code == 200:
            data = res.json()
            if data.get('ok'):
                updates = data.get('result', [])
                from apps.telegram_bot.services import process_telegram_update
                for update in updates:
                    update_id = update.get('update_id')
                    _OFFSET_CACHE[token] = update_id + 1
                    try:
                        process_telegram_update(store, update)
                    except Exception as e:
                        logger.error(f"Error processing update {update_id} for store {store.name}: {e}")
    except Exception as e:
        logger.debug(f"Polling timeout or error for store {store.name}: {e}")


def telegram_polling_loop():
    """Main polling loop running over all active store bots"""
    global _POLLING_ACTIVE
    logger.info("StoreBox Telegram Polling Worker started.")

    while _POLLING_ACTIVE:
        try:
            close_old_connections()
            from apps.stores.models import Store
            stores_with_bots = Store.objects.filter(is_active=True).exclude(telegram_bot_token='')

            for store in stores_with_bots:
                poll_store_bot(store)
                time.sleep(0.1)

            time.sleep(1)
        except Exception as e:
            logger.error(f"Error in telegram_polling_loop: {e}")
            time.sleep(3)


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
