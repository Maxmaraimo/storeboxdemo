from decimal import Decimal
from django.db import models
from django.conf import settings
from django.utils import timezone


class Partner(models.Model):
    name = models.CharField(max_length=150, verbose_name='Наименование партнера / компании')
    code = models.CharField(max_length=50, unique=True, db_index=True, verbose_name='Код партнера')
    contact_person = models.CharField(max_length=120, blank=True, verbose_name='Контактное лицо')
    phone = models.CharField(max_length=50, blank=True, verbose_name='Телефон')
    email = models.EmailField(blank=True, verbose_name='Email')
    commission_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=15.00,
        verbose_name='Комиссионная ставка (%)'
    )
    balance = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=0,
        verbose_name='Баланс вознаграждений (UZS)'
    )
    notes = models.TextField(blank=True, verbose_name='Заметки / Условия')
    is_active = models.BooleanField(default=True, verbose_name='Активен')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата подключения')
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Партнер / Селлер'
        verbose_name_plural = 'Партнеры / Селлеры'
        ordering = ['name']

    def __str__(self):
        return f"{self.name} [{self.code}]"

    @property
    def linked_stores_count(self):
        return self.stores.count()

    @property
    def active_stores_count(self):
        return self.stores.filter(is_active=True).count()


class BillingDocument(models.Model):
    class DocTypes(models.TextChoices):
        INVOICE = 'INVOICE', 'Счет на оплату'
        ACT = 'ACT', 'Акт сверки / выполненных работ'
        CONTRACT = 'CONTRACT', 'Договор подписки'
        RECONCILIATION = 'RECONCILIATION', 'Акт взаиморасчетов'

    class Statuses(models.TextChoices):
        PAID = 'PAID', 'Оплачен'
        PENDING = 'PENDING', 'Ожидает оплаты'
        OVERDUE = 'OVERDUE', 'Просрочен'
        CANCELLED = 'CANCELLED', 'Аннулирован'

    doc_number = models.CharField(max_length=60, unique=True, db_index=True, verbose_name='Номер документа')
    doc_type = models.CharField(max_length=30, choices=DocTypes.choices, default=DocTypes.INVOICE, verbose_name='Тип документа')
    store = models.ForeignKey(
        'stores.Store',
        on_delete=models.CASCADE,
        related_name='billing_documents',
        verbose_name='Магазин / Сервер'
    )
    partner = models.ForeignKey(
        Partner,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='billing_documents',
        verbose_name='Партнер'
    )
    amount = models.DecimalField(max_digits=14, decimal_places=2, default=0, verbose_name='Сумма (UZS)')
    status = models.CharField(max_length=20, choices=Statuses.choices, default=Statuses.PENDING, verbose_name='Статус')
    issue_date = models.DateField(default=timezone.now, verbose_name='Дата выставления')
    due_date = models.DateField(null=True, blank=True, verbose_name='Срок оплаты')
    description = models.TextField(blank=True, verbose_name='Назначение платежа / Комментарий')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Биллинг документ'
        verbose_name_plural = 'Биллинг документы'
        ordering = ['-issue_date', '-id']

    def __str__(self):
        return f"{self.get_doc_type_display()} #{self.doc_number} ({self.store.name})"


class ReconciliationEntry(models.Model):
    class OperationTypes(models.TextChoices):
        LICENSE = 'LICENSE', 'Покупка / продление лицензии'
        TOPUP = 'TOPUP', 'Пополнение баланса мерчантом'
        SMS = 'SMS', 'Списание за отправку SMS'
        COMMISSION = 'COMMISSION', 'Комиссия платформы'
        ADJUSTMENT = 'ADJUSTMENT', 'Корректировка администратором'
        REFUND = 'REFUND', 'Возврат средств'

    store = models.ForeignKey(
        'stores.Store',
        on_delete=models.CASCADE,
        related_name='reconciliation_entries',
        verbose_name='Магазин / Сервер'
    )
    operation_type = models.CharField(
        max_length=30,
        choices=OperationTypes.choices,
        default=OperationTypes.LICENSE,
        verbose_name='Тип операции'
    )
    debit = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=0,
        verbose_name='Дебет (Списание) UZS'
    )
    credit = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=0,
        verbose_name='Кредит (Пополнение) UZS'
    )
    balance_after = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=0,
        verbose_name='Баланс после операции UZS'
    )
    description = models.CharField(max_length=255, verbose_name='Описание / Основание')
    reference_doc = models.ForeignKey(
        BillingDocument,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        verbose_name='Связанный документ'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата и время')

    class Meta:
        verbose_name = 'Запись сверки (Акт)'
        verbose_name_plural = 'Записи сверки (Акты)'
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.store.subdomain}] {self.get_operation_type_display()}: -{self.debit:,.0f} / +{self.credit:,.0f} UZS"


class TenantAdminNote(models.Model):
    store = models.ForeignKey(
        'stores.Store',
        on_delete=models.CASCADE,
        related_name='admin_notes',
        verbose_name='Магазин / Сервер'
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tenant_admin_notes',
        verbose_name='Автор (Администратор)'
    )
    note_text = models.TextField(verbose_name='Текст служебной заметки')
    is_pinned = models.BooleanField(default=False, verbose_name='Закрепить сверху')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Создано')
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Заметка администратора'
        verbose_name_plural = 'Заметки администратора'
        ordering = ['-is_pinned', '-created_at']

    def __str__(self):
        return f"Заметка для {self.store.name} от {self.author}"


class TenantAuditLog(models.Model):
    store = models.ForeignKey(
        'stores.Store',
        on_delete=models.CASCADE,
        related_name='audit_logs',
        verbose_name='Магазин / Сервер'
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tenant_audit_logs',
        verbose_name='Пользователь'
    )
    actor_name = models.CharField(max_length=120, blank=True, verbose_name='Имя пользователя')
    action = models.CharField(max_length=120, verbose_name='Действие / Событие')
    details = models.TextField(blank=True, verbose_name='Детали / Изменения')
    ip_address = models.CharField(max_length=50, default='127.0.0.1', verbose_name='IP-адрес')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Время события')

    class Meta:
        verbose_name = 'Лог аудита тенанта'
        verbose_name_plural = 'Логи аудита тенантов'
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.store.subdomain}] {self.action} ({self.created_at:%d.%m.%Y %H:%M})"


class TenantSmsLog(models.Model):
    class SmsTypes(models.TextChoices):
        AUTH = 'AUTH', 'Код авторизации (OTP)'
        ORDER = 'ORDER', 'Статус заказа'
        DELIVERY = 'DELIVERY', 'Уведомление доставки'
        SYSTEM = 'SYSTEM', 'Системное оповещение'

    class Statuses(models.TextChoices):
        DELIVERED = 'DELIVERED', 'Доставлено'
        SENT = 'SENT', 'Отправлено оператору'
        FAILED = 'FAILED', 'Ошибка отправки'

    store = models.ForeignKey(
        'stores.Store',
        on_delete=models.CASCADE,
        related_name='sms_logs',
        verbose_name='Магазин / Сервер'
    )
    recipient = models.CharField(max_length=40, db_index=True, verbose_name='Номер получателя (+998)')
    message_text = models.TextField(verbose_name='Текст SMS')
    sms_type = models.CharField(max_length=20, choices=SmsTypes.choices, default=SmsTypes.AUTH, verbose_name='Тип SMS')
    status = models.CharField(max_length=20, choices=Statuses.choices, default=Statuses.DELIVERED, verbose_name='Статус доставки')
    cost = models.DecimalField(max_digits=8, decimal_places=2, default=45.00, verbose_name='Стоимость (UZS)')
    sent_at = models.DateTimeField(auto_now_add=True, verbose_name='Время отправки')

    class Meta:
        verbose_name = 'Лог SMS'
        verbose_name_plural = 'Логи SMS'
        ordering = ['-sent_at']

    def __str__(self):
        return f"SMS to {self.recipient} [{self.status}]"
