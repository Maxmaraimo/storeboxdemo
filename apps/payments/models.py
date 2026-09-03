from django.db import models
from apps.stores.models import Store
from apps.orders.models import Order


class StorePaymentSetting(models.Model):
    store = models.OneToOneField(
        Store,
        on_delete=models.CASCADE,
        related_name='payment_settings',
        verbose_name='Магазин'
    )
    # Click
    click_enabled = models.BooleanField(default=True, verbose_name='Включить Click')
    click_service_id = models.CharField(max_length=60, blank=True, default='TEST_SERVICE_ID', verbose_name='Click Service ID')
    click_merchant_id = models.CharField(max_length=60, blank=True, default='TEST_MERCHANT_ID', verbose_name='Click Merchant ID')
    click_secret_key = models.CharField(max_length=100, blank=True, default='TEST_SECRET_KEY', verbose_name='Click Secret Key')

    # Payme
    payme_enabled = models.BooleanField(default=True, verbose_name='Включить Payme')
    payme_merchant_id = models.CharField(max_length=60, blank=True, default='TEST_PAYME_ID', verbose_name='Payme Merchant ID')
    payme_secret_key = models.CharField(max_length=100, blank=True, default='TEST_SECRET_KEY', verbose_name='Payme Secret Key')
    payme_test_mode = models.BooleanField(default=True, verbose_name='Payme Тестовый режим')

    # Uzum Pay
    uzum_enabled = models.BooleanField(default=True, verbose_name='Включить Uzum Pay')
    uzum_merchant_id = models.CharField(max_length=60, blank=True, default='TEST_UZUM_ID', verbose_name='Uzum Merchant ID')
    uzum_secret_key = models.CharField(max_length=100, blank=True, default='TEST_SECRET_KEY', verbose_name='Uzum Secret Key')

    # Cash / Terminal
    cash_on_delivery_enabled = models.BooleanField(default=True, verbose_name='Наличными при получении')
    terminal_on_delivery_enabled = models.BooleanField(default=True, verbose_name='Картой курьеру (терминал)')
    test_simulator_enabled = models.BooleanField(
        default=True,
        verbose_name='Разрешить быстрый тестовый платеж (Симулятор для демонстрации)'
    )

    class Meta:
        verbose_name = 'Настройки платежей'
        verbose_name_plural = 'Настройки платежей'

    def __str__(self):
        return f"Платежные настройки: {self.store.name}"


class PaymentTransaction(models.Model):
    class Providers(models.TextChoices):
        CLICK = 'CLICK', 'Click'
        PAYME = 'PAYME', 'Payme'
        UZUM = 'UZUM', 'Uzum Pay'
        SIMULATOR = 'SIMULATOR', 'Тестовый симулятор'

    class States(models.TextChoices):
        INIT = 'INIT', 'Инициализирован'
        PREPARED = 'PREPARED', 'Подготовлен (зарезервирован)'
        COMPLETED = 'COMPLETED', 'Успешно завершен'
        CANCELLED = 'CANCELLED', 'Отменен'

    store = models.ForeignKey(
        Store,
        on_delete=models.CASCADE,
        related_name='transactions',
        verbose_name='Магазин'
    )
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name='transactions',
        verbose_name='Заказ'
    )
    provider = models.CharField(
        max_length=20,
        choices=Providers.choices,
        verbose_name='Платежный шлюз'
    )
    transaction_id = models.CharField(
        max_length=100,
        blank=True,
        db_index=True,
        verbose_name='ID транзакции шлюза'
    )
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name='Сумма транзакции (UZS)'
    )
    state = models.CharField(
        max_length=20,
        choices=States.choices,
        default=States.INIT,
        verbose_name='Статус'
    )
    payme_time = models.BigIntegerField(null=True, blank=True, verbose_name='Время Payme (timestamp)')
    raw_payload = models.JSONField(default=dict, blank=True, verbose_name='Лог запроса шлюза')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Дата обновления')

    class Meta:
        verbose_name = 'Платежная транзакция'
        verbose_name_plural = 'Платежные транзакции'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.provider} #{self.transaction_id or self.id} ({self.amount:,.0f} UZS) - {self.state}"
