import os
import sys
from django.apps import AppConfig


class TelegramBotConfig(AppConfig):
    name = 'apps.telegram_bot'

    def ready(self):
        # Auto-start polling thread ONLY in the actual runserver worker process
        # NEVER in StatReloader parent watcher, NEVER in migrate/shell/test/collectstatic
        if 'runserver' in sys.argv and os.environ.get('RUN_MAIN') == 'true':
            try:
                from apps.telegram_bot.polling import start_polling_thread
                start_polling_thread()
            except Exception:
                pass

