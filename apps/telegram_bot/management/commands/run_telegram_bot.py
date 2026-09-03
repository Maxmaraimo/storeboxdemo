from django.core.management.base import BaseCommand
from apps.telegram_bot.polling import telegram_polling_loop


class Command(BaseCommand):
    help = 'Run the Telegram Long-Polling background worker for all merchant bots'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS("Starting StoreBox Telegram Bot Polling Worker..."))
        try:
            telegram_polling_loop()
        except KeyboardInterrupt:
            self.stdout.write(self.style.WARNING("Telegram Bot Polling Worker stopped by user."))
