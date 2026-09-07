import random
import datetime
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.accounts.models import User
from apps.stores.models import Store, MerchantBalance
from apps.orders.models import Order
from apps.super_admin.models import (
    Partner, BillingDocument, ReconciliationEntry,
    TenantAdminNote, TenantAuditLog, TenantSmsLog
)


class Command(BaseCommand):
    help = 'Seeds initial partners and backfills stores with realistic billing, reconciliation, notes and logs data'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Seeding Partners..."))
        
        partners_data = [
            {
                'name': 'StoreBox Direct Sales',
                'code': 'PTN-DIRECT',
                'contact_person': 'Alisher Usmanov',
                'phone': '+998 90 123 45 67',
                'email': 'sales@storebox.uz',
                'commission_rate': Decimal('0.00'),
                'notes': 'Прямые продажи StoreBox HQ',
            },
            {
                'name': 'Smart Retail Technologies LLC',
                'code': 'PTN-SMART',
                'contact_person': 'Bobur Mirzayev',
                'phone': '+998 97 765 43 21',
                'email': 'partner@smartretail.uz',
                'commission_rate': Decimal('15.00'),
                'notes': 'Крупнейший реселлер в Ташкенте и Самарканде',
            },
            {
                'name': 'IT Partner Asia Digital Agency',
                'code': 'PTN-ASIA',
                'contact_person': 'Dilshod Rahmatov',
                'phone': '+998 93 555 12 34',
                'email': 'contact@itpartner.uz',
                'commission_rate': Decimal('20.00'),
                'notes': 'Партнер по автоматизации ресторанов и ритейла',
            },
        ]

        partners = []
        for p_data in partners_data:
            p, _ = Partner.objects.get_or_create(code=p_data['code'], defaults=p_data)
            partners.append(p)

        admin_user = User.objects.filter(is_superuser=True).first()
        if not admin_user:
            admin_user = User.objects.first()

        self.stdout.write(self.style.NOTICE("Backfilling existing stores with billing info..."))
        now = timezone.now()
        stores = Store.objects.all()

        companies = [
            'OOO "GLOBAL FOOD DELIVERY"',
            'ChP "SULTAN SWEETS"',
            'OOO "FASHION HOUSE TASHKENT"',
            'OOO "FAST LOGISTICS SERVICE"',
            'ChP "GOLD LAVASH GROUP"',
            'OOO "PHARMA PLUS UZ"',
            'OOO "SMART ELECTRONICS TRADE"',
            'OOO "UZBEK TASTE DELIGHT"',
            'ChP "MODERN APPAREL"',
        ]

        plans = ['START', 'STANDARD', 'PRO', 'ENTERPRISE']

        for idx, store in enumerate(stores):
            # Assign partner
            assigned_partner = partners[idx % len(partners)]
            store.partner = assigned_partner

            # Company name
            if not store.company_name:
                store.company_name = companies[idx % len(companies)]

            # License dates:
            # First 2 stores: Expiring soon (3 to 6 days) to test warning badges!
            # Next 1 store: Expired (-3 days) to test expired badge!
            # Other stores: Active (30 to 180 days)
            if idx == 0:
                store.license_expires_at = now + datetime.timedelta(days=3, hours=14)
                store.license_plan = 'STANDARD'
                store.admin_comment = 'Требуется напомнить о пролонгации. Мерчант ждет звонка.'
            elif idx == 1:
                store.license_expires_at = now + datetime.timedelta(days=6, hours=8)
                store.license_plan = 'PRO'
                store.admin_comment = 'Планирует переход на корпоративный годовой тариф.'
            elif idx == 2:
                store.license_expires_at = now - datetime.timedelta(days=2, hours=5)
                store.license_plan = 'START'
                store.admin_comment = 'Лицензия истекла 2 дня назад. Ожидает счет на оплату.'
            else:
                days_ahead = random.choice([25, 45, 60, 90, 120, 180])
                store.license_expires_at = now + datetime.timedelta(days=days_ahead)
                store.license_plan = random.choice(plans)
                if not store.admin_comment:
                    store.admin_comment = 'Активный тенант. Замечаний по работе платформы нет.'

            store.save()

            # Ensure MerchantBalance
            merch_bal, _ = MerchantBalance.objects.get_or_create(store=store)
            if merch_bal.balance == 0:
                merch_bal.balance = Decimal(random.choice([150000, 320000, 750000, 1200000, 2450000]))
                merch_bal.save()

            # Seed sample BillingDocument & ReconciliationEntry
            if not store.billing_documents.exists():
                doc1 = BillingDocument.objects.create(
                    doc_number=f"INV-2026-08{store.id:02d}",
                    doc_type=BillingDocument.DocTypes.INVOICE,
                    store=store,
                    partner=assigned_partner,
                    amount=Decimal('199000.00'),
                    status=BillingDocument.Statuses.PAID,
                    issue_date=(now - datetime.timedelta(days=40)).date(),
                    due_date=(now - datetime.timedelta(days=35)).date(),
                    description=f"Оплата тарифа {store.get_license_plan_display()} на 1 месяц"
                )
                ReconciliationEntry.objects.create(
                    store=store,
                    operation_type=ReconciliationEntry.OperationTypes.TOPUP,
                    debit=0,
                    credit=Decimal('500000.00'),
                    balance_after=Decimal('500000.00'),
                    description="Пополнение баланса мерчантом через Payme",
                    reference_doc=doc1,
                    created_at=now - datetime.timedelta(days=45)
                )
                ReconciliationEntry.objects.create(
                    store=store,
                    operation_type=ReconciliationEntry.OperationTypes.LICENSE,
                    debit=Decimal('199000.00'),
                    credit=0,
                    balance_after=Decimal('301000.00'),
                    description=f"Списание за продление лицензии ({store.get_license_plan_display()})",
                    reference_doc=doc1,
                    created_at=now - datetime.timedelta(days=40)
                )

            # Seed Admin notes if empty
            if not store.admin_notes.exists():
                TenantAdminNote.objects.create(
                    store=store,
                    author=admin_user,
                    note_text="Тенант успешно прошел верификацию. Интеграция с Telegram ботом настроена.",
                    is_pinned=True,
                    created_at=now - datetime.timedelta(days=15)
                )

            # Seed Audit logs if empty
            if not store.audit_logs.exists():
                TenantAuditLog.objects.create(
                    store=store,
                    actor=admin_user,
                    actor_name="SuperAdmin",
                    action="Регистрация сервера",
                    details=f"Магазин {store.name} зарегистрирован в системе на домене {store.subdomain}.storebox.uz",
                    created_at=store.created_at
                )
                TenantAuditLog.objects.create(
                    store=store,
                    actor=admin_user,
                    actor_name="SuperAdmin",
                    action="Активация лицензии",
                    details=f"Установлен тарифный план {store.license_plan}. Срок действия до {store.license_expires_at:%d.%m.%Y}",
                    created_at=now - datetime.timedelta(days=10)
                )

            # Seed SMS logs if empty
            if not store.sms_logs.exists():
                TenantSmsLog.objects.create(
                    store=store,
                    recipient=store.phone or "+998901234567",
                    message_text=f"Vash kod podtverzhdeniya StoreBox: {random.randint(1000, 9999)}. Nikomu ne soobshayte.",
                    sms_type=TenantSmsLog.SmsTypes.AUTH,
                    status=TenantSmsLog.Statuses.DELIVERED,
                    cost=Decimal('45.00'),
                    sent_at=now - datetime.timedelta(days=12)
                )
                TenantSmsLog.objects.create(
                    store=store,
                    recipient=store.phone or "+998901234567",
                    message_text=f"Vash zakaz #{random.randint(101, 199)} prinyat magazinom {store.name}. Ozhidayte dostavku!",
                    sms_type=TenantSmsLog.SmsTypes.ORDER,
                    status=TenantSmsLog.Statuses.DELIVERED,
                    cost=Decimal('45.00'),
                    sent_at=now - datetime.timedelta(days=5)
                )

        self.stdout.write(self.style.SUCCESS(f"Successfully seeded billing data for {stores.count()} stores!"))
