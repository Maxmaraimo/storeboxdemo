import random
from decimal import Decimal
from django.db import models
from django.utils import timezone
from apps.stores.models import Store, Branch
from apps.catalog.models import Product, ProductVariation


class PromoCode(models.Model):
    class DiscountTypes(models.TextChoices):
        PERCENT = 'PERCENT', 'Процент (%)'
        FIXED = 'FIXED', 'Фиксированная сумма (UZS)'

    store = models.ForeignKey(
        Store,
        on_delete=models.CASCADE,
        related_name='promo_codes',
        verbose_name='Магазин'
    )
    code = models.CharField(max_length=50, db_index=True, verbose_name='Промокод')
    discount_type = models.CharField(
        max_length=20,
        choices=DiscountTypes.choices,
        default=DiscountTypes.PERCENT,
        verbose_name='Тип скидки'
    )
    discount_value = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name='Размер скидки (% или UZS)'
    )
    min_order_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        verbose_name='Минимальная сумма заказа (UZS)'
    )
    max_uses = models.PositiveIntegerField(
        default=100,
        verbose_name='Максимальное кол-во использований'
    )
    times_used = models.PositiveIntegerField(
        default=0,
        verbose_name='Использовано раз'
    )
    valid_from = models.DateTimeField(null=True, blank=True, verbose_name='Действует с')
    valid_until = models.DateTimeField(null=True, blank=True, verbose_name='Действует до')
    is_active = models.BooleanField(default=True, verbose_name='Активен')

    class Meta:
        verbose_name = 'Промокод'
        verbose_name_plural = 'Промокоды'
        unique_together = ('store', 'code')

    def __str__(self):
        return f"{self.code} ({self.store.name})"

    def is_valid(self, subtotal=0):
        if not self.is_active:
            return False, 'Промокод не активен'
        now = timezone.now()
        if self.valid_from and now < self.valid_from:
            return False, 'Срок действия промокода еще не начался'
        if self.valid_until and now > self.valid_until:
            return False, 'Срок действия промокода истек'
        if self.times_used >= self.max_uses:
            return False, 'Лимит использований промокода исчерпан'
        if Decimal(str(subtotal)) < self.min_order_amount:
            return False, f'Минимальная сумма для промокода: {int(self.min_order_amount):,} UZS'
        return True, 'Промокод активен'

    def calculate_discount(self, subtotal):
        subtotal = Decimal(str(subtotal))
        valid, msg = self.is_valid(subtotal)
        if not valid:
            return Decimal('0')
        if self.discount_type == self.DiscountTypes.PERCENT:
            discount = (subtotal * self.discount_value) / Decimal('100')
        else:
            discount = min(self.discount_value, subtotal)
        return round(discount, 2)


class Order(models.Model):
    class DeliveryMethods(models.TextChoices):
        COURIER = 'COURIER', 'Доставка курьером'
        PICKUP = 'PICKUP', 'Самовывоз из филиала'

    class PaymentMethods(models.TextChoices):
        CLICK = 'CLICK', 'Click'
        PAYME = 'PAYME', 'Payme'
        UZUM = 'UZUM', 'Uzum Pay'
        CASH = 'CASH', 'Наличными при получении'
        TERMINAL = 'TERMINAL', 'Картой курьеру (терминал)'

    class PaymentStatuses(models.TextChoices):
        PENDING = 'PENDING', 'Ожидает оплаты'
        PAID = 'PAID', 'Оплачено'
        FAILED = 'FAILED', 'Ошибка оплаты'
        REFUNDED = 'REFUNDED', 'Возврат'

    class OrderStatuses(models.TextChoices):
        NEW = 'NEW', 'Новый'
        PROCESSING = 'PROCESSING', 'В процессе'
        READY = 'READY', 'Готов к выдаче'
        IN_DELIVERY = 'IN_DELIVERY', 'Доставляется'
        COMPLETED = 'COMPLETED', 'Выполнен'
        CANCELLED = 'CANCELLED', 'Отменен'

    class Sources(models.TextChoices):
        WEB = 'WEB', 'Веб-витрина'
        TELEGRAM_MINI_APP = 'TMA', 'Telegram Mini App'
        INSTAGRAM = 'INSTAGRAM', 'Instagram'

    store = models.ForeignKey(
        Store,
        on_delete=models.CASCADE,
        related_name='orders',
        verbose_name='Магазин'
    )
    branch = models.ForeignKey(
        Branch,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='orders',
        verbose_name='Филиал'
    )
    order_number = models.CharField(
        max_length=30,
        unique=True,
        db_index=True,
        verbose_name='Номер заказа'
    )
    customer_name = models.CharField(max_length=120, verbose_name='Имя клиента')
    customer_phone = models.CharField(max_length=30, verbose_name='Телефон (+998)')
    customer = models.ForeignKey(
        'Customer',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='orders',
        verbose_name='Клиент'
    )

    delivery_method = models.CharField(
        max_length=20,
        choices=DeliveryMethods.choices,
        default=DeliveryMethods.COURIER,
        verbose_name='Способ доставки'
    )
    delivery_city = models.CharField(max_length=100, default='Ташкент', verbose_name='Город/Регион')
    delivery_address = models.TextField(blank=True, verbose_name='Адрес доставки')
    delivery_lat = models.FloatField(null=True, blank=True, verbose_name='Широта доставки')
    delivery_lng = models.FloatField(null=True, blank=True, verbose_name='Долгота доставки')
    delivery_fee = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        verbose_name='Стоимость доставки (UZS)'
    )
    notes = models.TextField(blank=True, verbose_name='Комментарий к заказу')

    promo_code = models.ForeignKey(
        PromoCode,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='orders',
        verbose_name='Промокод'
    )
    discount_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        verbose_name='Скидка по промокоду (UZS)'
    )
    bonus_spent = models.PositiveIntegerField(
        default=0,
        verbose_name='Списано бонусов'
    )
    subtotal = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        verbose_name='Сумма товаров (UZS)'
    )
    total_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        verbose_name='Итоговая сумма (UZS)'
    )

    payment_method = models.CharField(
        max_length=20,
        choices=PaymentMethods.choices,
        default=PaymentMethods.CASH,
        verbose_name='Способ оплаты'
    )
    payment_status = models.CharField(
        max_length=20,
        choices=PaymentStatuses.choices,
        default=PaymentStatuses.PENDING,
        verbose_name='Статус оплаты'
    )
    status = models.CharField(
        max_length=20,
        choices=OrderStatuses.choices,
        default=OrderStatuses.NEW,
        verbose_name='Статус заказа'
    )

    telegram_user_id = models.BigIntegerField(
        null=True,
        blank=True,
        verbose_name='Telegram User ID'
    )
    source = models.CharField(
        max_length=20,
        choices=Sources.choices,
        default=Sources.WEB,
        verbose_name='Источник заказа'
    )

    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Создан')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Обновлен')

    class Meta:
        verbose_name = 'Заказ'
        verbose_name_plural = 'Заказы'
        ordering = ['-created_at']

    def __str__(self):
        return f"#{self.order_number} - {self.customer_name} ({self.total_amount:,.0f} UZS)"

    @classmethod
    def generate_order_number(cls):
        prefix = 'RB'
        num = random.randint(1000, 99999)
        candidate = f"{prefix}-{num}"
        while cls.objects.filter(order_number=candidate).exists():
            num = random.randint(1000, 99999)
            candidate = f"{prefix}-{num}"
        return candidate


class OrderItem(models.Model):
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name='items',
        verbose_name='Заказ'
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='order_items',
        verbose_name='Товар'
    )
    variation = models.ForeignKey(
        ProductVariation,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name='Вариант'
    )
    product_name = models.CharField(max_length=200, verbose_name='Название товара (снапшот)')
    variation_name = models.CharField(max_length=100, blank=True, verbose_name='Вариант (снапшот)')
    unit_price = models.DecimalField(max_digits=12, decimal_places=2, verbose_name='Цена за единицу (UZS)')
    quantity = models.PositiveIntegerField(default=1, verbose_name='Количество')
    total_price = models.DecimalField(max_digits=12, decimal_places=2, verbose_name='Итого (UZS)')

    class Meta:
        verbose_name = 'Позиция заказа'
        verbose_name_plural = 'Позиции заказа'

    def __str__(self):
        return f"{self.product_name} x {self.quantity}"


class Customer(models.Model):
    store = models.ForeignKey(
        Store,
        on_delete=models.CASCADE,
        related_name='customers',
        verbose_name='Магазин'
    )
    name = models.CharField(max_length=120, verbose_name='Имя клиента')
    phone = models.CharField(max_length=30, db_index=True, verbose_name='Телефон (+998)')
    bonus_balance = models.PositiveIntegerField(default=0, verbose_name='Бонусный баланс (баллы)')
    total_spent = models.DecimalField(max_digits=14, decimal_places=2, default=0, verbose_name='Всего потрачено (UZS)')
    orders_count = models.PositiveIntegerField(default=0, verbose_name='Количество заказов')
    last_order_at = models.DateTimeField(null=True, blank=True, verbose_name='Дата последнего заказа')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата регистрации')
    telegram_chat_id = models.CharField(max_length=50, blank=True, null=True, db_index=True, verbose_name='Telegram Chat ID')
    telegram_username = models.CharField(max_length=100, blank=True, null=True, verbose_name='Telegram Username')

    class Meta:
        verbose_name = 'Клиент'
        verbose_name_plural = 'Клиенты'
        unique_together = ('store', 'phone')
        ordering = ['-total_spent']

    def __str__(self):
        return f"{self.name} ({self.phone}) - {self.total_spent:,.0f} UZS"


class ChatMessage(models.Model):
    class Senders(models.TextChoices):
        CUSTOMER = 'CUSTOMER', 'Покупатель'
        MERCHANT = 'MERCHANT', 'Мерчант / Магазин'

    store = models.ForeignKey(
        Store,
        on_delete=models.CASCADE,
        related_name='chat_messages',
        verbose_name='Магазин'
    )
    customer_phone = models.CharField(max_length=30, db_index=True, verbose_name='Телефон клиента')
    customer_name = models.CharField(max_length=120, default='Покупатель', verbose_name='Имя клиента')
    telegram_chat_id = models.CharField(max_length=50, blank=True, null=True, db_index=True, verbose_name='Telegram Chat ID')
    sender = models.CharField(max_length=20, choices=Senders.choices, default=Senders.CUSTOMER)
    message = models.TextField(verbose_name='Текст сообщения')
    is_read = models.BooleanField(default=False, verbose_name='Прочитано')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Время отправки')

    class Meta:
        verbose_name = 'Сообщение в чате'
        verbose_name_plural = 'Сообщения в чате'
        ordering = ['created_at']

    def __str__(self):
        return f"[{self.sender}] {self.customer_phone}: {self.message[:30]}"


class MarketingCampaign(models.Model):
    class Channels(models.TextChoices):
        SMS = 'SMS', 'SMS-сообщение'
        TELEGRAM = 'TELEGRAM', 'Telegram-рассылка'

    class Statuses(models.TextChoices):
        DRAFT = 'DRAFT', 'Черновик'
        SENT = 'SENT', 'Отправлено'

    store = models.ForeignKey(
        Store,
        on_delete=models.CASCADE,
        related_name='marketing_campaigns',
        verbose_name='Магазин'
    )
    title = models.CharField(max_length=150, verbose_name='Название рассылки')
    channel = models.CharField(max_length=20, choices=Channels.choices, default=Channels.TELEGRAM)
    message = models.TextField(verbose_name='Текст сообщения рассылки')
    sent_count = models.PositiveIntegerField(default=0, verbose_name='Отправлено получателям')
    status = models.CharField(max_length=20, choices=Statuses.choices, default=Statuses.SENT)
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Создана')

    class Meta:
        verbose_name = 'Маркетинговая рассылка'
        verbose_name_plural = 'Маркетинговые рассылки'
        ordering = ['-created_at']


class MarketingBanner(models.Model):
    store = models.ForeignKey(
        Store,
        on_delete=models.CASCADE,
        related_name='banners',
        verbose_name='Магазин'
    )
    title = models.CharField(max_length=150, verbose_name='Заголовок баннера')
    subtitle = models.CharField(max_length=200, blank=True, verbose_name='Подзаголовок / Оффер')
    image = models.ImageField(upload_to='banners/', blank=True, null=True, verbose_name='Картинка баннера')
    image_url = models.URLField(max_length=500, blank=True, verbose_name='Или прямая ссылка на изображение')
    link = models.CharField(max_length=255, blank=True, default='/', verbose_name='Ссылка для перехода')
    is_active = models.BooleanField(default=True, verbose_name='Активен')
    sort_order = models.PositiveIntegerField(default=0, verbose_name='Порядок')

    class Meta:
        verbose_name = 'Промо-баннер витрины'
        verbose_name_plural = 'Промо-баннеры витрины'
        ordering = ['sort_order', 'id']


class StoreStaff(models.Model):
    class Roles(models.TextChoices):
        ADMIN = 'ADMIN', 'Администратор магазина'
        MANAGER = 'MANAGER', 'Менеджер заказов'
        COURIER = 'COURIER', 'Курьер доставки'
        CASHIER = 'CASHIER', 'Кассир / Оператор'

    store = models.ForeignKey(
        Store,
        on_delete=models.CASCADE,
        related_name='staff_members',
        verbose_name='Магазин'
    )
    name = models.CharField(max_length=120, verbose_name='ФИО сотрудника')
    phone = models.CharField(max_length=30, verbose_name='Телефон (+998)')
    role = models.CharField(max_length=20, choices=Roles.choices, default=Roles.MANAGER, verbose_name='Должность')
    is_active = models.BooleanField(default=True, verbose_name='Активен')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Сотрудник'
        verbose_name_plural = 'Сотрудники'
        ordering = ['role', 'name']
