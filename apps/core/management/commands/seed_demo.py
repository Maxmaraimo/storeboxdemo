from django.core.management import call_command
from django.core.management.base import BaseCommand

class Command(BaseCommand):
    help = 'Seeds full demo store data with real Django model instances'

    def handle(self, *args, **options):
        self.stdout.write("Seeding StoreBox demo data...")
        call_command('setup_demo_store')
        self.stdout.write(self.style.SUCCESS("Demo data seeded successfully!"))
