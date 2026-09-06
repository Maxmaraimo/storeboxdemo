# StoreBox Multilingual Translations Dictionary
# Supports: Uzbek (uz), Russian (ru), English (en)

class TranslationDict(dict):
    """
    A dictionary wrapper that allows attribute access (t.dashboard)
    and falls back to Russian, then Uzbek, then the key itself.
    Never raises KeyError or AttributeError.
    """
    def __init__(self, current_dict, fallback_dict=None):
        super().__init__(current_dict or {})
        self.fallback_dict = fallback_dict or {}

    def __getattr__(self, name):
        if name in self:
            return self[name]
        if name in self.fallback_dict:
            return self.fallback_dict[name]
        return name

    def __getitem__(self, name):
        if name in self:
            return super().__getitem__(name)
        if name in self.fallback_dict:
            return self.fallback_dict[name]
        return name

    def get(self, key, default=None):
        if key in self:
            return self[key]
        if key in self.fallback_dict:
            return self.fallback_dict[key]
        return default if default is not None else key


TRANSLATIONS_DATA = {
    'uz': {
        # Navigation
        'dashboard': 'Boshqaruv paneli',
        'orders': 'Buyurtmalar',
        'customers': 'Mijozlar',
        'chat': 'Chat',
        'products': 'Mahsulotlar',
        'categories': 'Kategoriyalar',
        'all_products': 'Barcha mahsulotlar',
        'discounts': 'Chegirma',
        'ikpu': 'IKPU',
        'warehouse': 'Omborxona',
        'marketing': 'Marketing',
        'broadcast': 'Rassilka',
        'promocodes': 'Promokod',
        'sources': 'Manbalar',
        'sms_broadcast': 'SMS rassilka',
        'channel_post': 'Kanal uchun post',
        'banner': 'Banner',
        'reviews': 'Sharhlar',
        'platforms': 'Platformalar',
        'telegram_bot': 'Telegram bot',
        'website': 'Veb-sayt',
        'qr_catalog': 'QR katalog',
        'yespos_import': 'YES POS dan import',
        'payment_methods': "To'lov turi",
        'delivery': 'Yetkazib berish',
        'branches': 'Filiallar',
        'staff': 'Xodimlar',
        'tariffs': 'Tarif rejasi',
        'storebox_market': 'StoreBox market',
        'settings': 'Sozlamalar',

        # Header & Topbar
        'view_site': "Saytni ko'rish",
        'add_store': "Yangi do'kon qo'shish",
        'add_business': "Biznes qo'shish",
        'balance_text': 'Sizning hisobingizda',
        'trial_banner': 'Sizning hisobingizda 7 kunlik bepul sinov ishlayapti',
        'trial_days_left': 'Bepul tarif rejasi: 7 kun qoldi',
        'edit_profile': 'Profilni tahrirlash',
        'my_cards': 'Mening kartalarim',
        'logout': 'Chiqish',
        'support': "Qo'llab-quvvatlash",
        'telegram_support': "Telegram orqali bog'lanish",

        # Language dropdown
        'lang_label': "🇺🇿 O'zb",
        'uzbek': "O'zbek",
        'russian': "Русский",
        'english': "English",

        # Modals & Forms
        'topup_title': "Hisobingizni to'ldiring",
        'current_balance': 'Joriy balans',
        'select_amount': 'Summani tanlang yoki kiriting (UZS)',
        'topup_btn': "Hisobni to'ldirish",
        'modal_next': 'Oldinga',
        'country': 'Mamlakat',
        'business_category': 'Biznes toifasi',
        'store_name': "Do'kon nomi",
        'subdomain': 'Subdomen',
        'notifications': 'Bildirishnomalar',
        'no_notifications': "Hozircha yangi bildirishnomalar yo'q",

        # YES POS
        'yespos_title': 'YES POS dan tovarlarni import qilish',
        'yespos_subtitle': 'Integratsiyani ulang, YES POS filialini tanlang, tovarlar katalogini yuklang va qoldiqlarni narxlar bilan yangilang.',
        'yespos_linked_products': 'bog\'langan tovarlar',
        'yespos_connect_btn': 'YES POS ni ulash',
        'yespos_connection': 'Ulanish',
        'yespos_not_connected': 'Ulangan emas',
        'yespos_connected': 'Ulangan',
        'yespos_connection_not_set': 'Ulanish hali sozlanmagan',
        'yespos_connection_not_set_desc': 'YES POS API-kalitini kiriting va katalog bilan qoldiqlarni yuklash kerak bo\'lgan filialni tanlang.',
        'yespos_start_connect': 'Ulanishni boshlash',
        'yespos_import_readiness': 'Importga tayyorgarlik',
        'yespos_import_readiness_desc': 'Import va sinxronizatsiyani boshlashdan oldin majburiy shartlarni tekshiring.',
        'yespos_server_encryption': 'Serverda ulanish ma\'lumotlarini shifrlash',
        'yespos_server_encryption_desc': 'API-kalit xavfsiz saqlanadi va faqat YES POS xizmat so\'rovlariga uzatiladi.',
        'yespos_branch_connected': 'YES POS va filial ulangan',
        'yespos_branch_connected_desc': 'Katalog importi va qoldiqlarni tekshirish uchun YES POS tizimida faol filial talab qilinadi.',
        'yespos_currency_uzs': 'Do\'kon valyutasi UZS',
        'yespos_currency_uzs_desc': 'YES POS katalogi StoreBox vitrinasi valyutasi (UZS) bilan moslashtiriladi.',
        'yespos_open_catalog': 'Katalogni ochish va import qilish',
        'yespos_sync_now': 'Qoldiqlarni sinxronlash',
        'yespos_reconnect': 'Qayta sozlash',
    },

    'ru': {
        # Navigation
        'dashboard': 'Панель управления',
        'orders': 'Заказы',
        'customers': 'Клиенты',
        'chat': 'Чат',
        'products': 'Товары',
        'categories': 'Категории',
        'all_products': 'Все товары',
        'discounts': 'Скидки',
        'ikpu': 'ИКПУ',
        'warehouse': 'Склад',
        'marketing': 'Маркетинг',
        'broadcast': 'Рассылка',
        'promocodes': 'Промокоды',
        'sources': 'Источники',
        'sms_broadcast': 'SMS рассылка',
        'channel_post': 'Пост для канала',
        'banner': 'Баннеры',
        'reviews': 'Отзывы',
        'platforms': 'Платформы',
        'telegram_bot': 'Telegram-бот',
        'website': 'Веб-сайт',
        'qr_catalog': 'QR-каталог',
        'yespos_import': 'Импорт из YES POS',
        'payment_methods': 'Способы оплаты',
        'delivery': 'Доставка',
        'branches': 'Филиалы',
        'staff': 'Сотрудники',
        'tariffs': 'Тарифный план',
        'storebox_market': 'Маркет StoreBox',
        'settings': 'Настройки',

        # Header & Topbar
        'view_site': 'Просмотр сайта',
        'add_store': 'Добавить новый магазин',
        'add_business': 'Добавить бизнес',
        'balance_text': 'На вашем балансе',
        'trial_banner': 'На вашем аккаунте действует 7 дней бесплатного пробного периода',
        'trial_days_left': 'Бесплатный тариф: осталось 7 дней',
        'edit_profile': 'Редактировать профиль',
        'my_cards': 'Мои карты',
        'logout': 'Выйти',
        'support': 'Поддержка',
        'telegram_support': 'Связаться через Telegram',

        # Language dropdown
        'lang_label': '🇷🇺 Рус',
        'uzbek': "O'zbek",
        'russian': 'Русский',
        'english': 'English',

        # Modals & Forms
        'topup_title': 'Пополнить баланс',
        'current_balance': 'Текущий баланс',
        'select_amount': 'Выберите или введите сумму (UZS)',
        'topup_btn': 'Пополнить баланс',
        'modal_next': 'Далее',
        'country': 'Страна',
        'business_category': 'Категория бизнеса',
        'store_name': 'Название магазина',
        'subdomain': 'Поддомен',
        'notifications': 'Уведомления',
        'no_notifications': 'Пока нет новых уведомлений',

        # YES POS
        'yespos_title': 'Импорт товаров из YES POS',
        'yespos_subtitle': 'Подключите интеграцию, чтобы связать филиал YES POS, загрузить каталог товаров и обновлять остатки с ценами в StoreBox.',
        'yespos_linked_products': 'связано товаров',
        'yespos_connect_btn': 'Подключить YES POS',
        'yespos_connection': 'Подключение',
        'yespos_not_connected': 'Не подключено',
        'yespos_connected': 'Подключено',
        'yespos_connection_not_set': 'Подключение ещё не настроено',
        'yespos_connection_not_set_desc': 'Укажите API-ключ YES POS и выберите филиал, из которого нужно загружать каталог и остатки.',
        'yespos_start_connect': 'Начать подключение',
        'yespos_import_readiness': 'Готовность импорта',
        'yespos_import_readiness_desc': 'Проверьте обязательные условия перед запуском импорта и синхронизации.',
        'yespos_server_encryption': 'Серверное шифрование данных подключения',
        'yespos_server_encryption_desc': 'API-ключ хранится безопасно и передается только в служебных запросах к YES POS.',
        'yespos_branch_connected': 'YES POS и филиал подключены',
        'yespos_branch_connected_desc': 'Для импорта и сверки остатков требуется активный филиал в YES POS.',
        'yespos_currency_uzs': 'Валюта магазина UZS',
        'yespos_currency_uzs_desc': 'Каталог YES POS сопоставляется с валютой витрины StoreBox (UZS).',
        'yespos_open_catalog': 'Открыть каталог и импортировать',
        'yespos_sync_now': 'Синхронизировать остатки',
        'yespos_reconnect': 'Перенастроить',
    },

    'en': {
        # Navigation
        'dashboard': 'Dashboard',
        'orders': 'Orders',
        'customers': 'Customers',
        'chat': 'Chat',
        'products': 'Products',
        'categories': 'Categories',
        'all_products': 'All Products',
        'discounts': 'Discounts',
        'ikpu': 'IKPU',
        'warehouse': 'Warehouse',
        'marketing': 'Marketing',
        'broadcast': 'Broadcast',
        'promocodes': 'Promo codes',
        'sources': 'Traffic sources',
        'sms_broadcast': 'SMS broadcast',
        'channel_post': 'Channel post',
        'banner': 'Banners',
        'reviews': 'Reviews',
        'platforms': 'Platforms',
        'telegram_bot': 'Telegram Bot',
        'website': 'Website',
        'qr_catalog': 'QR Catalog',
        'yespos_import': 'Import from YES POS',
        'payment_methods': 'Payment Methods',
        'delivery': 'Delivery',
        'branches': 'Branches',
        'staff': 'Staff',
        'tariffs': 'Pricing Plans',
        'storebox_market': 'StoreBox Market',
        'settings': 'Settings',

        # Header & Topbar
        'view_site': 'View Store',
        'add_store': 'Add New Store',
        'add_business': 'Add Business',
        'balance_text': 'Your balance',
        'trial_banner': 'You have a 7-day free trial active on your account',
        'trial_days_left': 'Free trial: 7 days remaining',
        'edit_profile': 'Edit Profile',
        'my_cards': 'My Cards',
        'logout': 'Log Out',
        'support': 'Support',
        'telegram_support': 'Contact via Telegram',

        # Language dropdown
        'lang_label': '🇺🇸 Eng',
        'uzbek': "O'zbek",
        'russian': 'Русский',
        'english': 'English',

        # Modals & Forms
        'topup_title': 'Top up Balance',
        'current_balance': 'Current balance',
        'select_amount': 'Select or enter amount (UZS)',
        'topup_btn': 'Top up balance',
        'modal_next': 'Next',
        'country': 'Country',
        'business_category': 'Business Category',
        'store_name': 'Store Name',
        'subdomain': 'Subdomain',
        'notifications': 'Notifications',
        'no_notifications': 'No notifications yet',

        # YES POS
        'yespos_title': 'Import Products from YES POS',
        'yespos_subtitle': 'Connect integration to link YES POS branch, import product catalog, and update stock with prices in StoreBox.',
        'yespos_linked_products': 'linked products',
        'yespos_connect_btn': 'Connect YES POS',
        'yespos_connection': 'Connection',
        'yespos_not_connected': 'Not connected',
        'yespos_connected': 'Connected',
        'yespos_connection_not_set': 'Connection not yet configured',
        'yespos_connection_not_set_desc': 'Provide YES POS API key and choose the branch to sync catalog and stock from.',
        'yespos_start_connect': 'Start Connection',
        'yespos_import_readiness': 'Import Readiness',
        'yespos_import_readiness_desc': 'Check required conditions before starting import and sync.',
        'yespos_server_encryption': 'Server-side Encryption',
        'yespos_server_encryption_desc': 'API key is safely encrypted and used only for internal YES POS requests.',
        'yespos_branch_connected': 'YES POS & Branch Connected',
        'yespos_branch_connected_desc': 'An active branch in YES POS is required for importing and stock syncing.',
        'yespos_currency_uzs': 'Store Currency UZS',
        'yespos_currency_uzs_desc': 'YES POS catalog is aligned with StoreBox storefront currency (UZS).',
        'yespos_open_catalog': 'Open Catalog and Import',
        'yespos_sync_now': 'Sync Stock',
        'yespos_reconnect': 'Reconfigure',
    }
}


def get_translations(lang_code='uz'):
    """Returns a TranslationDict for the given language code, falling back gracefully."""
    code = (lang_code or 'uz').lower().strip()
    if code not in TRANSLATIONS_DATA:
        code = 'uz'
    fallback = TRANSLATIONS_DATA.get('ru', {})
    return TranslationDict(TRANSLATIONS_DATA[code], fallback)
