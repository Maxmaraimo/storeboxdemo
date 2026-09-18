import datetime
from decimal import Decimal
from django.db import models
from django.conf import settings
from django.utils import timezone


class Store(models.Model):
    class BusinessTypes(models.TextChoices):
        STORE = 'STORE', "Onlayn do'kon"
        RESTAURANT = 'RESTAURANT', 'Restoran'
        SERVICES = 'SERVICES', 'Xizmatlar'

    class PlatformTypes(models.TextChoices):
        ALL = 'ALL', 'Telegram va Veb-sayt'
        WEB = 'WEB', 'Veb-sayt'
        TELEGRAM = 'TELEGRAM', 'Telegram'

    class Countries(models.TextChoices):
        UZ = 'UZ', "O'zbekiston"
        KZ = 'KZ', "Qozog'iston"
        TR = 'TR', 'Turkiya'
        RU = 'RU', 'Rossiya'
        KG = 'KG', "Qirg'iziston"
        OTHER = 'OTHER', 'Boshqa'

    class BusinessCategories(models.TextChoices):
        ACCESSORIES = 'ACCESSORIES', 'Aksessuarlar'
        AUTO = 'AUTO', 'Avto ehtiyot qismlar'
        ELECTRONICS = 'ELECTRONICS', 'Elektronika'
        BEAUTY = 'BEAUTY', "Go'zallik va parvarish"
        PETS = 'PETS', 'Hayvonlar uchun mahsulotlar'
        DRINKS = 'DRINKS', 'Ichimliklar'
        BOOKS = 'BOOKS', 'Kitoblar va ofis anjomlari'
        CLOTHES = 'CLOTHES', 'Kiyim-kechak'
        APPLIANCES = 'APPLIANCES', 'Maishiy texnika'
        FOOD = 'FOOD', 'Oziq-ovqat'
        SHOES = 'SHOES', 'Poyabzal'
        SPORT = 'SPORT', 'Sport anjomlari'
        HOME = 'HOME', 'Uy jihozlari'
        OTHER = 'OTHER', 'Boshqa'

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='stores',
        verbose_name='Владелец (Мерчант)'
    )
    name = models.CharField(max_length=120, verbose_name='Название магазина')
    subdomain = models.SlugField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Поддомен (.storebox.uz)'
    )
    business_type = models.CharField(
        max_length=20,
        choices=BusinessTypes.choices,
        default=BusinessTypes.STORE,
        verbose_name='Тип бизнеса'
    )
    platform_type = models.CharField(
        max_length=20,
        choices=PlatformTypes.choices,
        default=PlatformTypes.ALL,
        verbose_name='Каналы продаж'
    )
    country = models.CharField(
        max_length=10,
        choices=Countries.choices,
        default=Countries.UZ,
        verbose_name='Страна'
    )
    business_category = models.CharField(
        max_length=30,
        choices=BusinessCategories.choices,
        default=BusinessCategories.FOOD,
        verbose_name='Категория бизнеса'
    )

    description_ru = models.TextField(blank=True, verbose_name='Описание (RU)')
    description_uz = models.TextField(blank=True, verbose_name='Описание (UZ)')
    description_en = models.TextField(blank=True, verbose_name='Описание (EN)')

    # Informational / Legal pages
    about_us_ru = models.TextField(blank=True, verbose_name='О нас (RU)')
    about_us_uz = models.TextField(blank=True, verbose_name='О нас (UZ)')
    delivery_terms_ru = models.TextField(blank=True, verbose_name='Условия доставки (RU)')
    delivery_terms_uz = models.TextField(blank=True, verbose_name='Условия доставки (UZ)')
    return_terms_ru = models.TextField(blank=True, verbose_name='Условия возврата (RU)')
    return_terms_uz = models.TextField(blank=True, verbose_name='Условия возврата (UZ)')

    logo = models.ImageField(upload_to='stores/logos/', blank=True, null=True, verbose_name='Логотип')
    banner = models.ImageField(upload_to='stores/banners/', blank=True, null=True, verbose_name='Баннер / Обложка')
    primary_color = models.CharField(
        max_length=20,
        default='#10B981',
        verbose_name='Основной цвет бренда (HEX)'
    )
    theme_card_style = models.CharField(
        max_length=30,
        default='modern',
        verbose_name='Стиль карточек товаров'
    )  # 'modern', 'minimal', 'bold', 'compact'
    theme_card_radius = models.CharField(
        max_length=20,
        default='3xl',
        verbose_name='Скругление карточек'
    )  # 'none', 'lg', '2xl', '3xl', 'full'
    theme_image_aspect = models.CharField(
        max_length=20,
        default='portrait',
        verbose_name='Соотношение фото'
    )  # 'square' (1/1), 'portrait' (3/4), 'landscape' (4/3)
    theme_button_style = models.CharField(
        max_length=30,
        default='solid',
        verbose_name='Стиль кнопок'
    )  # 'solid', 'outline', 'soft'
    theme_bg_color = models.CharField(
        max_length=20,
        default='#F8FAFC',
        verbose_name='Цвет фона сайта'
    )
    class ThemeTemplates(models.TextChoices):
        RESTAURANT = 'restaurant', 'Restoran & Yetkazib berish'
        UNIVERSAL = 'universal', "Universal do'kon"
        BOUTIQUE = 'boutique', 'Vizual Butik & Moda'

    theme_template = models.CharField(
        max_length=30,
        choices=ThemeTemplates.choices,
        default=ThemeTemplates.UNIVERSAL,
        verbose_name='Шаблон витрины'
    )
    theme_business_niche = models.CharField(
        max_length=50,
        blank=True,
        default='',
        verbose_name='Ниша магазина для ИИ'
    )

    phone = models.CharField(max_length=30, blank=True, verbose_name='Телефон (+998)')
    
    # 6 Social Networks from Video
    instagram_username = models.CharField(max_length=100, blank=True, verbose_name='Instagram')
    telegram_channel = models.CharField(max_length=100, blank=True, verbose_name='Telegram')
    facebook = models.CharField(max_length=100, blank=True, verbose_name='Facebook')
    youtube = models.CharField(max_length=100, blank=True, verbose_name='YouTube')
    tiktok = models.CharField(max_length=100, blank=True, verbose_name='TikTok')
    whatsapp = models.CharField(max_length=100, blank=True, verbose_name='WhatsApp')

    # Telegram Bot Integration
    telegram_bot_token = models.CharField(max_length=200, blank=True, verbose_name='Токен бота')
    telegram_chat_id = models.CharField(max_length=100, blank=True, verbose_name='ID Telegram-чата')
    telegram_bot_username = models.CharField(max_length=100, blank=True, verbose_name='Bot Username')
    telegram_button_name = models.CharField(max_length=50, default="Do'kon", verbose_name='Tugma nomi')
    telegram_welcome_message = models.TextField(
        blank=True,
        default="Assalomu alaykum! Do'konimizga xush kelibsiz. Quyidagi tugma orqali menyu bilan tanishishingiz va buyurtma berishingiz mumkin.",
        verbose_name='Приветственное сообщение бота'
    )

    # Website Settings & Analytics (from Video birinchi.mov 07:15 - 07:46)
    seo_description = models.TextField(blank=True, verbose_name='SEO ta\'rif')
    custom_domain = models.CharField(max_length=100, blank=True, verbose_name='Shaxsiy domen')
    google_analytics_id = models.CharField(max_length=50, blank=True, verbose_name='Google Analytics ID')
    google_tag_manager_id = models.CharField(max_length=50, blank=True, verbose_name='Google Tag Manager ID')
    facebook_pixel_id = models.CharField(max_length=50, blank=True, verbose_name='Facebook Pixel ID')
    yandex_metrika_id = models.CharField(max_length=50, blank=True, verbose_name='Yandex Metrika ID')

    # Delivery & Pickup settings
    address = models.CharField(max_length=255, blank=True, verbose_name='Адрес филиала')
    pickup_enabled = models.BooleanField(default=True, verbose_name='Самовывоз')
    courier_enabled = models.BooleanField(default=True, verbose_name='Курьерская доставка')
    delivery_price = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name='Цена доставки (UZS)')
    free_delivery_threshold = models.DecimalField(max_digits=12, decimal_places=2, default=150000, verbose_name='Бесплатная от (UZS)')
    delivery_time_estimate = models.CharField(max_length=50, default='30-45 мин', verbose_name='Время доставки')

    # Schedule: e.g. {"mon": {"open": "00:00", "close": "23:59", "closed": False}, ...}
    working_hours = models.JSONField(default=dict, blank=True, verbose_name='Расписание')

    # Languages & Currency
    default_language = models.CharField(max_length=5, default='uz', verbose_name='Основной язык')
    active_languages = models.JSONField(default=list, blank=True, verbose_name='Активные языки')
    currency = models.CharField(max_length=10, default='UZS', verbose_name='Валюта')

    # Designer QR Catalog Settings (from Video 09:24)
    qr_paper_size = models.CharField(max_length=10, default='A5', choices=[('A5', "A5 qog'oz"), ('A6', "A6 qog'oz")])
    qr_bg_color = models.CharField(max_length=20, default='#FFFFFF', verbose_name='Fon rangi')
    qr_code_color = models.CharField(max_length=20, default='#000000', verbose_name='QR kod rangi')
    qr_main_text = models.CharField(max_length=100, default='Online buyurtma', verbose_name='Asosiy matn')
    qr_main_text_size = models.PositiveIntegerField(default=24, verbose_name='Matn hajmi')
    qr_main_text_color = models.CharField(max_length=20, default='#000000', verbose_name='Matn rangi')
    qr_sub_text = models.CharField(max_length=200, default='Menyuni ochish uchun qr kodni skanerlang', verbose_name='Ikkilamchi matn')
    qr_sub_text_size = models.PositiveIntegerField(default=8, verbose_name='Ikkilamchi matn hajmi')
    qr_sub_text_color = models.CharField(max_length=20, default='#64748B', verbose_name='Ikkilamchi matn rangi')

    is_active = models.BooleanField(default=True, verbose_name='Активен')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Enterprise Billing & iBox Sync fields
    company_name = models.CharField(max_length=200, blank=True, default='', verbose_name='Юр. лицо / Компания')
    partner = models.ForeignKey(
        'super_admin.Partner',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='stores',
        verbose_name='Партнер / Селлер'
    )
    license_plan = models.CharField(
        max_length=30,
        default='STANDARD',
        choices=[
            ('START', 'Старт'),
            ('STANDARD', 'Стандарт'),
            ('PRO', 'Профессиональный'),
            ('ENTERPRISE', 'Корпоративный'),
        ],
        verbose_name='Тарифный план'
    )
    license_expires_at = models.DateTimeField(null=True, blank=True, verbose_name='Окончание лицензии')
    admin_comment = models.TextField(blank=True, default='', verbose_name='Служебный комментарий')

    class Meta:
        verbose_name = 'Магазин'
        verbose_name_plural = 'Магазины'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.subdomain})"

    def save(self, *args, **kwargs):
        if not self.pk and not self.license_expires_at:
            # 7 days free trial on store registration
            self.license_expires_at = timezone.now() + datetime.timedelta(days=7)
        super().save(*args, **kwargs)

    TARIFF_RATES = {
        'START': Decimal('99000.00'),        # ~3 300 UZS/день
        'STANDARD': Decimal('199000.00'),    # ~6 633 UZS/день
        'PRO': Decimal('399000.00'),         # ~13 300 UZS/день
        'ENTERPRISE': Decimal('799000.00'),  # ~26 633 UZS/день
    }

    @classmethod
    def get_plan_daily_rate(cls, plan):
        monthly = cls.TARIFF_RATES.get(plan, Decimal('199000.00'))
        return monthly / Decimal('30.00')

    def calculate_extension(self, plan=None, amount=None, days=None, months=None, target_date=None):
        """
        Intelligent tariff calculator:
        - By amount (e.g. 500 000 UZS) -> calculates days & new expiry
        - By months (1, 3, 6 -10%, 12 -20%) -> calculates total amount & new expiry
        - By days -> calculates amount & new expiry
        - By target_date -> calculates required amount
        """
        now = timezone.now()
        base_date = self.license_expires_at if (self.license_expires_at and self.license_expires_at > now) else now
        plan = plan or self.license_plan or 'STANDARD'
        monthly_rate = self.TARIFF_RATES.get(plan, Decimal('500000.00'))
        daily_rate = monthly_rate / Decimal('30.00')

        calc_days = 30
        calc_amount = monthly_rate

        if amount is not None and Decimal(str(amount)) > 0:
            amt = Decimal(str(amount))
            calc_days = max(1, int((amt * Decimal('30')) / monthly_rate))
            calc_amount = amt
        elif target_date is not None:
            if isinstance(target_date, str):
                target_dt = datetime.datetime.strptime(target_date, '%Y-%m-%d')
                target_dt = timezone.make_aware(target_dt) if timezone.is_naive(target_dt) else target_dt
            else:
                target_dt = target_date
            diff_days = (target_dt - base_date).days
            calc_days = max(1, diff_days)
            calc_amount = round(daily_rate * Decimal(calc_days), 2)
        elif months is not None:
            m = int(months)
            calc_days = m * 30
            raw_amt = monthly_rate * Decimal(m)
            if m == 6:
                raw_amt = raw_amt * Decimal('0.90')
            elif m >= 12:
                raw_amt = raw_amt * Decimal('0.80')
            calc_amount = round(raw_amt, 2)
        elif days is not None:
            calc_days = int(days)
            calc_amount = round(daily_rate * Decimal(calc_days), 2)

        new_expiry = base_date + datetime.timedelta(days=calc_days)

        plan_display = dict(self._meta.get_field('license_plan').choices).get(plan, plan)

        return {
            'plan': plan,
            'plan_display': plan_display,
            'days': calc_days,
            'amount': float(calc_amount),
            'daily_rate': float(daily_rate),
            'monthly_rate': float(monthly_rate),
            'current_expiry': self.license_expires_at.strftime('%d.%m.%Y %H:%M') if self.license_expires_at else 'Нет',
            'new_expiry': new_expiry.strftime('%d.%m.%Y %H:%M'),
            'new_expiry_iso': new_expiry.isoformat(),
        }

    def apply_tariff(self, plan, days=None, amount=None, months=None, payment_status='PAID', payment_method='Оплата онлайн', notes='', admin_user=None):
        """
        Applies extension, updates MerchantBalance, creates Invoice and ReconciliationEntry.
        """
        calc = self.calculate_extension(plan=plan, amount=amount, days=days, months=months)
        new_expiry = datetime.datetime.fromisoformat(calc['new_expiry_iso'])
        actual_amount = Decimal(str(calc['amount']))

        self.license_plan = plan
        self.license_expires_at = new_expiry
        self.is_active = True
        self.save(update_fields=['license_plan', 'license_expires_at', 'is_active', 'updated_at'])

        # Update merchant balance & trial counter
        now = timezone.now()
        merch_bal, _ = MerchantBalance.objects.get_or_create(store=self)
        merch_bal.trial_days_left = max(0, calc['days'])
        # Credit balance by payment amount if paid via external method (Top-up)
        if payment_method != 'BALANCE' and payment_status == 'PAID' and actual_amount > 0:
            merch_bal.balance += actual_amount
            merch_bal.save(update_fields=['balance', 'trial_days_left'])
        else:
            merch_bal.save(update_fields=['trial_days_left'])

        # Create Invoice
        from apps.super_admin.models import BillingDocument, ReconciliationEntry, TenantAuditLog
        doc_count = BillingDocument.objects.count() + 1
        doc_num = f"INV-{now.strftime('%Y%m')}-{self.id:04d}-{doc_count}"
        doc = BillingDocument.objects.create(
            doc_number=doc_num,
            doc_type=BillingDocument.DocTypes.INVOICE,
            store=self,
            partner=self.partner,
            amount=actual_amount,
            status=payment_status,
            issue_date=now.date(),
            description=f"Продление тарифа {self.get_license_plan_display()} на {calc['days']} дн. ({payment_method}) {notes}".strip()
        )

        # Create Reconciliation Entry
        if payment_method == 'BALANCE':
            ReconciliationEntry.objects.create(
                store=self,
                operation_type=ReconciliationEntry.OperationTypes.LICENSE,
                debit=actual_amount,
                credit=0,
                balance_after=merch_bal.balance,
                description=f"Списание с баланса: тариф {self.get_license_plan_display()} (+{calc['days']} дн.)",
                reference_doc=doc
            )
        else:
            ReconciliationEntry.objects.create(
                store=self,
                operation_type=ReconciliationEntry.OperationTypes.TOPUP,
                debit=0,
                credit=actual_amount,
                balance_after=merch_bal.balance,
                description=f"Поступление оплаты ({payment_method}): тариф {self.get_license_plan_display()} (+{calc['days']} дн.)",
                reference_doc=doc
            )

        # Audit log
        TenantAuditLog.objects.create(
            store=self,
            actor=admin_user if admin_user and getattr(admin_user, 'is_authenticated', False) else None,
            actor_name=str(admin_user) if admin_user else 'Система (Billing)',
            action='Продление тарифа',
            details=f"Тариф: {self.get_license_plan_display()}, Дней: +{calc['days']}, Сумма: {actual_amount:,.0f} UZS ({payment_method}), Окончание: {new_expiry:%d.%m.%Y %H:%M}"
        )

        return calc

    def cancel_subscription(self, days_to_deduct=None, admin_user=None, reason=''):
        """
        Cancels or rolls back subscription days, marks status or adjustments in Reconciliation.
        """
        now = timezone.now()
        from apps.super_admin.models import BillingDocument, ReconciliationEntry, TenantAuditLog
        
        merch_bal, _ = MerchantBalance.objects.get_or_create(store=self)
        current_expiry = self.license_expires_at or now
        
        if days_to_deduct:
            new_expiry = max(now - datetime.timedelta(days=1), current_expiry - datetime.timedelta(days=int(days_to_deduct)))
        else:
            # Expire immediately
            new_expiry = now - datetime.timedelta(hours=1)
            
        self.license_expires_at = new_expiry
        self.save(update_fields=['license_expires_at', 'updated_at'])
        
        # Calculate refund / adjustment amount based on daily rate
        daily_rate = self.get_plan_daily_rate(self.license_plan)
        revoked_days = int(days_to_deduct) if days_to_deduct else max(1, (current_expiry - now).days)
        adj_amount = Decimal(str(revoked_days)) * daily_rate
        
        # Deduct / adjust balance
        merch_bal.balance = max(Decimal('0.00'), merch_bal.balance - adj_amount)
        merch_bal.trial_days_left = 0
        merch_bal.save(update_fields=['balance', 'trial_days_left'])
        
        # Record cancellation in ReconciliationEntry
        ReconciliationEntry.objects.create(
            store=self,
            operation_type=ReconciliationEntry.OperationTypes.ADJUSTMENT,
            debit=adj_amount,
            credit=0,
            balance_after=merch_bal.balance,
            description=f"Отмена / отзыв подписки ({reason or 'Решение администратора'})",
        )
        
        # Cancel latest invoice if applicable
        latest_inv = self.billing_documents.filter(doc_type=BillingDocument.DocTypes.INVOICE).first()
        if latest_inv and latest_inv.status in ['PAID', 'PENDING']:
            latest_inv.status = BillingDocument.Statuses.CANCELLED
            latest_inv.description += f" [ОТМЕНЕН: {reason}]"
            latest_inv.save(update_fields=['status', 'description'])
            
        TenantAuditLog.objects.create(
            store=self,
            actor=admin_user if admin_user and getattr(admin_user, 'is_authenticated', False) else None,
            actor_name=str(admin_user) if admin_user else 'Администратор',
            action='Отмена подписки',
            details=f"Отозвано {revoked_days} дн. Тариф: {self.get_license_plan_display()}. Причина: {reason or 'Не указана'}. Баланс: {merch_bal.balance:,.0f} UZS"
        )
        return {
            'new_expiry': new_expiry.strftime('%d.%m.%Y %H:%M'),
            'revoked_days': revoked_days,
            'balance': float(merch_bal.balance)
        }

    @property
    def is_expired(self):
        if not self.license_expires_at:
            return False
        return self.license_expires_at < timezone.now()

    @property
    def license_days_left(self):
        if not self.license_expires_at:
            return None
        diff = self.license_expires_at - timezone.now()
        if diff.total_seconds() <= 0:
            return 0
        return diff.days + 1

    @property
    def license_status(self):
        if not self.license_expires_at:
            return 'LIFETIME'
        if self.is_expired:
            return 'EXPIRED'
        days = self.license_days_left
        if days is not None and days <= 7:
            return 'EXPIRING'
        return 'ACTIVE'

    @property
    def owner_display_name(self):
        if self.owner:
            name = f"{self.owner.first_name} {self.owner.last_name}".strip()
            return name if name else self.owner.username
        return "—"

    @property
    def contact_phone(self):
        return self.phone or (self.owner.phone if self.owner else '') or ''

    @contact_phone.setter
    def contact_phone(self, value):
        self.phone = value or ''

    def get_full_domain(self):
        platform_domain = getattr(settings, 'PLATFORM_DOMAIN', 'storebox.uz')
        return f"{self.subdomain}.{platform_domain}"

    def get_storefront_url(self):
        custom_domain = (self.custom_domain or '').strip().rstrip('/')
        if custom_domain:
            if custom_domain.startswith(('http://', 'https://')):
                return custom_domain
            return f"https://{custom_domain}"

        if getattr(settings, 'STOREFRONT_SUBDOMAIN_URLS', True):
            return f"https://{self.get_full_domain()}"
        return f"{settings.PLATFORM_SITE_URL}/store/{self.subdomain}"

    def is_currently_open(self, lang=None):
        l = lang or getattr(self, '_current_lang', 'uz')
        status_labels = {
            'uz': {'open': "Ochiq", 'open_until': "Ochiq ({time} gacha)", 'closed': "Hozir yopiq", 'day_off': "Dam olish kuni"},
            'ru': {'open': "Открыто", 'open_until': "Открыто (до {time})", 'closed': "Сейчас закрыто", 'day_off': "Выходной"},
            'en': {'open': "Open", 'open_until': "Open (until {time})", 'closed': "Currently closed", 'day_off': "Day off"},
            'tr': {'open': "Açık", 'open_until': "Açık ({time}'a kadar)", 'closed': "Şu anda kapalı", 'day_off': "Tatil günü"},
        }
        lbls = status_labels.get(l, status_labels['uz'])

        if not self.working_hours:
            return True, lbls['open']
        now = timezone.localtime(timezone.now())
        weekday_keys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
        today_key = weekday_keys[now.weekday()]
        day_info = self.working_hours.get(today_key)
        if not day_info or day_info.get('closed'):
            return False, lbls['day_off']

        try:
            open_time = datetime.datetime.strptime(day_info.get('open', '00:00'), '%H:%M').time()
            close_time = datetime.datetime.strptime(day_info.get('close', '23:59'), '%H:%M').time()
            cur_time = now.time()
            if open_time <= cur_time <= close_time:
                return True, lbls['open_until'].format(time=day_info.get('close', '23:59'))
            return False, lbls['closed']
        except Exception:
            return True, lbls['open']


class Branch(models.Model):
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='branches')
    name = models.CharField(max_length=120, verbose_name='Filial nomi')
    address = models.CharField(max_length=255, verbose_name='Manzil')
    latitude = models.FloatField(default=41.2995, verbose_name='Lat')
    longitude = models.FloatField(default=69.2401, verbose_name='Lng')
    phone = models.CharField(max_length=30, blank=True, verbose_name='Telefon')
    working_hours = models.CharField(max_length=100, default='09:00 - 23:59')
    is_main = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Филиал'
        verbose_name_plural = 'Филиалы'
        ordering = ['-is_main', 'name']

    def __str__(self):
        return f"{self.name} ({self.store.name})"


class MerchantBalance(models.Model):
    store = models.OneToOneField(Store, on_delete=models.CASCADE, related_name='merchant_balance')
    balance = models.DecimalField(max_digits=14, decimal_places=2, default=0, verbose_name='Balans (UZS)')
    trial_days_left = models.PositiveIntegerField(default=7, verbose_name='Kunlik bepul sinov')

    def __str__(self):
        return f"{self.store.name} — {self.balance:,.0f} UZS"


class MerchantCard(models.Model):
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='merchant_cards')
    card_number = models.CharField(max_length=20, verbose_name='Karta raqami')
    expiry = models.CharField(max_length=10, verbose_name='MM/YY')
    is_main = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"•••• {self.card_number[-4:]} ({self.store.name})"
