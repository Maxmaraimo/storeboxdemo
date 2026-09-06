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

    class Meta:
        verbose_name = 'Магазин'
        verbose_name_plural = 'Магазины'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.subdomain})"

    def get_full_domain(self):
        platform_domain = getattr(settings, 'PLATFORM_DOMAIN', 'storebox.uz')
        return f"{self.subdomain}.{platform_domain}"

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
