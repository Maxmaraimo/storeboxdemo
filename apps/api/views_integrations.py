import json
from decimal import Decimal
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from apps.stores.models import Store, StoreIntegration
from apps.payments.models import StorePaymentSetting
from apps.catalog.models import YesPosConnection
from .views_auth import get_merchant_store


# -----------------------------------------------------------------
# MASTER REGISTRY OF ALL SUPPORTED INTEGRATIONS
# -----------------------------------------------------------------
INTEGRATIONS_CATALOG = [
    # ------------------ POS TIZIMLARI ------------------
    {
        "slug": "iiko",
        "name": "iiko",
        "category": "pos",
        "category_title": "POS tizimlari",
        "badge": "HoReCa Flagman",
        "rating": 5.0,
        "reviews_count": 142,
        "short_desc": "Restoran va kafelar uchun professional kassa va menyu hisobi",
        "desc": "iiko tizimi bilan avtomatik integratsiya: buyurtmalarni oshxonaga uzatish, modifikatorlar va ingredientlar qoldig'ini avtomatik hisobdan chiqarish.",
        "icon_color": "#E52D27",
        "fields": [
            {"key": "api_url", "label": "iiko Server URL / Host", "type": "text", "placeholder": "https://api-ru.iiko.services", "required": True},
            {"key": "api_login", "label": "API Login / Foydalanuvchi", "type": "text", "placeholder": "storebox_integration", "required": True},
            {"key": "api_key", "label": "API Kalit (API Secret)", "type": "password", "placeholder": "iiko_secret_token_...", "required": True, "secret": True},
            {"key": "organization_id", "label": "Tashkilot ID (Organization ID)", "type": "text", "placeholder": "org_39f28...", "required": True},
            {"key": "auto_sync_menu", "label": "Menyu va to'xtash ro'yxatini (Stop-list) sinxronlash", "type": "checkbox", "default": True},
        ]
    },
    {
        "slug": "r_keeper",
        "name": "r_keeper",
        "category": "pos",
        "category_title": "POS tizimlari",
        "badge": "Avtomatlashtirish",
        "rating": 5.0,
        "reviews_count": 98,
        "short_desc": "Restoran va barlar uchun an'anaviy ishonchli kassa platformasi",
        "desc": "r_keeper 7 tizimi bilan bevosita sinxronizatsiya. Onlayn buyurtmalar kassa stantsiyasiga avtomatik tushadi va fiskal cheklar chop etiladi.",
        "icon_color": "#1E293B",
        "fields": [
            {"key": "server_url", "label": "r_keeper WhiteServer URL", "type": "text", "placeholder": "https://ws.r-keeper.ru", "required": True},
            {"key": "cash_code", "label": "Kassa kodi (Station Code)", "type": "text", "placeholder": "CASH_01", "required": True},
            {"key": "license_key", "label": "Litsenziya kaliti (License Token)", "type": "password", "placeholder": "rk_lic_...", "required": True, "secret": True},
            {"key": "restaurant_code", "label": "Restoran kodi", "type": "text", "placeholder": "REST_109", "required": True},
        ]
    },
    {
        "slug": "poster",
        "name": "Poster",
        "category": "pos",
        "category_title": "POS tizimlari",
        "badge": "Bulutli kassa",
        "rating": 5.0,
        "reviews_count": 115,
        "short_desc": "Planshet va smartfonlar uchun zamonaviy bulutli kassa",
        "desc": "Poster POS orqali buyurtmalarni bir zumda qabul qilish, cheklarni chiqarish va omborxona harakatlarini sinxronlash.",
        "icon_color": "#F97316",
        "fields": [
            {"key": "access_token", "label": "Poster Access Token", "type": "password", "placeholder": "283749:89384729482...", "required": True, "secret": True},
            {"key": "spot_id", "label": "Nuqta ID (Spot ID)", "type": "text", "placeholder": "1", "required": True},
            {"key": "auto_accept_orders", "label": "Buyurtmalarni kassada avtomatik tasdiqlash", "type": "checkbox", "default": True},
        ]
    },
    {
        "slug": "jowi",
        "name": "Jowi",
        "category": "pos",
        "category_title": "POS tizimlari",
        "badge": "HoReCa Pro",
        "rating": 4.9,
        "reviews_count": 64,
        "short_desc": "Yetkazib berish xizmati va zalni boshqarish uchun kassa tizimi",
        "desc": "Jowi orqali veb-sayt va botdagi barcha buyurtmalar to'g'ridan-to'g'ri kassa va kuryerlar ro'yxatiga tushadi.",
        "icon_color": "#0284C7",
        "fields": [
            {"key": "api_key", "label": "Jowi API Key", "type": "password", "placeholder": "jowi_key_...", "required": True, "secret": True},
            {"key": "api_secret", "label": "API Secret", "type": "password", "placeholder": "jowi_secret_...", "required": True, "secret": True},
            {"key": "restaurant_id", "label": "Restoran ID", "type": "text", "placeholder": "jowi_rest_01", "required": True},
        ]
    },
    {
        "slug": "clopos",
        "name": "Clopos",
        "category": "pos",
        "category_title": "POS tizimlari",
        "badge": "Cloud POS",
        "rating": 4.9,
        "reviews_count": 52,
        "short_desc": "Zamonaviy restoran va chakana savdo uchun qulay kassa tizimi",
        "desc": "Clopos tizimi bilan to'liq integratsiya. Mahsulotlar katalogi, narxlar va kassa holatini real vaqtda yangilash.",
        "icon_color": "#6366F1",
        "fields": [
            {"key": "api_token", "label": "Clopos API Token", "type": "password", "placeholder": "clopos_tok_...", "required": True, "secret": True},
            {"key": "branch_id", "label": "Filial ID", "type": "text", "placeholder": "branch_main", "required": True},
        ]
    },
    {
        "slug": "allpos",
        "name": "Allpos",
        "category": "pos",
        "category_title": "POS tizimlari",
        "badge": "Mobil kassa",
        "rating": 4.8,
        "reviews_count": 41,
        "short_desc": "Tezkor savdo va fiskal cheklar uchun universal kassa moduli",
        "desc": "Allpos orqali savdoni yuritish, fiskallashtirish va to'lovlarni bir darchada jamlash.",
        "icon_color": "#2563EB",
        "fields": [
            {"key": "license_key", "label": "Litsenziya kaliti", "type": "password", "placeholder": "allpos_lic_...", "required": True, "secret": True},
            {"key": "terminal_id", "label": "Terminal ID", "type": "text", "placeholder": "TERM_09", "required": True},
        ]
    },

    # ------------------ OMBORXONA / SKLAD ------------------
    {
        "slug": "yespos",
        "name": "YES POS",
        "category": "warehouse",
        "category_title": "Omborxona",
        "badge": "Tavsiya etiladi",
        "rating": 5.0,
        "reviews_count": 230,
        "short_desc": "StoreBox ekotizimidagi YES POS kassasi va ombori bilan 100% sinxronizatsiya",
        "desc": "Mahsulotlar katalogi, qoldiqlar, kassa cheklari va narxlar avtomatik sinxronlanadi. Internet do'konda sotilgan tovar ombordan bir lahzada yechiladi.",
        "icon_color": "#4F46E5",
        "fields": [
            {"key": "api_key", "label": "YES POS API Key", "type": "password", "placeholder": "yp_live_...", "required": True, "secret": True},
            {"key": "branch_id", "label": "Filial identifikatori (Branch ID)", "type": "text", "placeholder": "branch_tashkent_01", "required": True},
            {"key": "branch_name", "label": "Filial nomi", "type": "text", "placeholder": "Asosiy filial", "required": False},
            {"key": "sync_inventory", "label": "Qoldiqlarni real vaqtda hisobdan chiqarish", "type": "checkbox", "default": True},
        ]
    },
    {
        "slug": "smartup",
        "name": "Smartup",
        "category": "warehouse",
        "category_title": "Omborxona",
        "badge": "ERP & Sklad",
        "rating": 5.0,
        "reviews_count": 185,
        "short_desc": "Chakana va ulgurji savdo uchun korporativ ombor va ERP boshqaruvi",
        "desc": "Smartup tizimidagi barcha tovar qoldiqlari, partiyalar va buyurtmalar holatini StoreBox do'koningizga avtomatik bog'laydi.",
        "icon_color": "#0D9488",
        "fields": [
            {"key": "server_url", "label": "Smartup Server URL", "type": "text", "placeholder": "https://api.smartup.online", "required": True},
            {"key": "client_id", "label": "Mijoz ID (Client ID)", "type": "text", "placeholder": "smartup_client_01", "required": True},
            {"key": "secret_key", "label": "Maxfiy kalit (Secret Key)", "type": "password", "placeholder": "sm_sec_...", "required": True, "secret": True},
            {"key": "warehouse_id", "label": "Ombor ID (Warehouse ID)", "type": "text", "placeholder": "WH_MAIN", "required": True},
        ]
    },
    {
        "slug": "billz",
        "name": "Billz",
        "category": "warehouse",
        "category_title": "Omborxona",
        "badge": "Retail Pro",
        "rating": 5.0,
        "reviews_count": 172,
        "short_desc": "Kiyim-kechak, kosmetika va do'konlar uchun savdo va omborxona tizimi",
        "desc": "Billz POS & Sklad bilan ikki tomonlama sinxronizatsiya: tovar kartochkalari, o'lchamlar, ranglar va qoldiqlar yangilanib turadi.",
        "icon_color": "#1D4ED8",
        "fields": [
            {"key": "api_key", "label": "Billz API Key (Token)", "type": "password", "placeholder": "billz_tok_...", "required": True, "secret": True},
            {"key": "company_id", "label": "Kompaniya ID (Company ID)", "type": "text", "placeholder": "cmp_84920", "required": True},
            {"key": "shop_id", "label": "Do'kon ID (Shop ID)", "type": "text", "placeholder": "shop_1", "required": True},
        ]
    },
    {
        "slug": "moysklad",
        "name": "MoySklad",
        "category": "warehouse",
        "category_title": "Omborxona",
        "badge": "Bulutli ombor",
        "rating": 4.9,
        "reviews_count": 120,
        "short_desc": "Ombor hisobi, tovar qoldiqlari, sotuvlar va yetkazib beruvchilar bazasi",
        "desc": "MoySklad JSON API v1.2 orqali buyurtmalarni yaratish, tovarlar tannarxi va qoldiqlarini doimiy nazorat qilish.",
        "icon_color": "#0284C7",
        "fields": [
            {"key": "login", "label": "MoySklad Logini / Email", "type": "text", "placeholder": "admin@mycompany.uz", "required": True},
            {"key": "password", "label": "Parol yoki API Token", "type": "password", "placeholder": "••••••••", "required": True, "secret": True},
            {"key": "warehouse_name", "label": "Standart ombor nomi", "type": "text", "placeholder": "Asosiy ombor", "required": False},
        ]
    },
    {
        "slug": "onec",
        "name": "1C: Korxona",
        "category": "warehouse",
        "category_title": "Omborxona",
        "badge": "Enterprise",
        "rating": 4.9,
        "reviews_count": 94,
        "short_desc": "1C:Предприятие 8.3 bilan mahsulotlar va buyurtmalar almashinuvi",
        "desc": "REST API va CommerceML protokoli bo'yicha hisob-fakturalar, nomenklatura va qoldiqlarni to'liq integratsiya qilish.",
        "icon_color": "#DC2626",
        "fields": [
            {"key": "service_url", "label": "1C Web-servis URL", "type": "text", "placeholder": "https://1c.mycompany.uz/trade/hs/storebox", "required": True},
            {"key": "http_user", "label": "HTTP Foydalanuvchi", "type": "text", "placeholder": "exchange_user", "required": True},
            {"key": "http_password", "label": "HTTP Parol", "type": "password", "placeholder": "••••••••", "required": True, "secret": True},
            {"key": "exchange_format", "label": "Almashinuv formati", "type": "select", "options": ["REST JSON", "CommerceML 2.0"], "default": "REST JSON"},
        ]
    },
    {
        "slug": "regos",
        "name": "REGOS",
        "category": "warehouse",
        "category_title": "Omborxona",
        "badge": "Supermarket",
        "rating": 4.8,
        "reviews_count": 46,
        "short_desc": "Supermarketlar va chakana savdo tarmoqlari uchun hisob tizimi",
        "desc": "REGOS kassa va omborxona ma'lumotlar bazasi bilan avtomatlashtirilgan ulanish.",
        "icon_color": "#B91C1C",
        "fields": [
            {"key": "api_key", "label": "REGOS API Kalit", "type": "password", "placeholder": "regos_key_...", "required": True, "secret": True},
            {"key": "server_host", "label": "Server manzili", "type": "text", "placeholder": "regos-cloud.uz:8080", "required": True},
        ]
    },
    {
        "slug": "era",
        "name": "ERA",
        "category": "warehouse",
        "category_title": "Omborxona",
        "badge": "Savdo boshqaruvi",
        "rating": 4.8,
        "reviews_count": 38,
        "short_desc": "Chakana savdo do'konlari uchun qulay tovar hisobi dasturi",
        "desc": "ERA savdo dasturi orqali tovarlar qoldig'ini avtomatik sinxronizatsiya qilish.",
        "icon_color": "#059669",
        "fields": [
            {"key": "token", "label": "ERA Token", "type": "password", "placeholder": "era_auth_token_...", "required": True, "secret": True},
            {"key": "store_id", "label": "Do'kon ID", "type": "text", "placeholder": "era_store_12", "required": True},
        ]
    },

    # ------------------ YETKAZIB BERISH / DELIVERY ------------------
    {
        "slug": "yandex_delivery",
        "name": "Yandex Delivery",
        "category": "delivery",
        "category_title": "Yetkazib berish",
        "badge": "Ekspress kuryer",
        "rating": 5.0,
        "reviews_count": 310,
        "short_desc": "Toshkent va viloyatlarda piyoda va avtomobilda tezkor ekspress yetkazish",
        "desc": "Yandex Delivery API orqali mijoz manzili bo'yicha kuryerni avtomatik chaqirish, tarifni hisoblash va kuryer harakatini xaritada kuzatish.",
        "icon_color": "#EAB308",
        "fields": [
            {"key": "oauth_token", "label": "Yandex OAuth Token", "type": "password", "placeholder": "y0_AgAAAA...", "required": True, "secret": True},
            {"key": "client_id", "label": "Mijoz ID (Client ID)", "type": "text", "placeholder": "b2b_client_id_...", "required": True},
            {"key": "tariff_type", "label": "Standart kuryer tarifi", "type": "select", "options": ["express (Ekspress avto)", "courier (Piyoda kuryer)", "cargo (Yuk tashish)"], "default": "express (Ekspress avto)"},
            {"key": "auto_call_courier", "label": "Buyurtma tasdiqlanganda kuryerni avtomatik chaqirish", "type": "checkbox", "default": False},
        ]
    },
    {
        "slug": "express24",
        "name": "Express24",
        "category": "delivery",
        "category_title": "Yetkazib berish",
        "badge": "Kun davomida",
        "rating": 5.0,
        "reviews_count": 245,
        "short_desc": "Ovqat, mahsulot va posilkalarni Toshkent bo'ylab ishonchli yetkazish",
        "desc": "Express24 kuryerlik tarmog'i bilan integratsiya. Buyurtmalar kuryerlarga zudlik bilan yo'naltiriladi.",
        "icon_color": "#F59E0B",
        "fields": [
            {"key": "api_key", "label": "Express24 API Kalit", "type": "password", "placeholder": "ex24_key_...", "required": True, "secret": True},
            {"key": "partner_id", "label": "Hamkor ID (Partner ID)", "type": "text", "placeholder": "partner_849", "required": True},
            {"key": "webhook_secret", "label": "Webhook Secret", "type": "password", "placeholder": "wh_sec_...", "required": False, "secret": True},
        ]
    },
    {
        "slug": "fargo",
        "name": "FARGO",
        "category": "delivery",
        "category_title": "Yetkazib berish",
        "badge": "Butun O'zbekiston",
        "rating": 5.0,
        "reviews_count": 180,
        "short_desc": "O'zbekistonning barcha viloyatlariga eshikkacha ekspress yetkazib berish",
        "desc": "FARGO pochtasi orqali posilkalarni viloyatlarga jo'natish, avtomatik shtrix-kod va nakladnoy yaratish.",
        "icon_color": "#EA580C",
        "fields": [
            {"key": "api_token", "label": "FARGO API Token", "type": "password", "placeholder": "fargo_token_...", "required": True, "secret": True},
            {"key": "branch_code", "label": "Jo'natuvchi filial kodi", "type": "text", "placeholder": "TAS_CENTRAL", "required": True},
            {"key": "contract_num", "label": "Shartnoma raqami", "type": "text", "placeholder": "CONTRACT-2026/04", "required": False},
        ]
    },
    {
        "slug": "bts_express",
        "name": "BTS Express",
        "category": "delivery",
        "category_title": "Yetkazib berish",
        "badge": "Pochta tarmog'i",
        "rating": 4.9,
        "reviews_count": 135,
        "short_desc": "Respublika bo'ylab keng qamrovli pochta va yuk yetkazish tarmog'i",
        "desc": "BTS Express punktlari orqali buyurtmalarni mijozga eng yaqin bo'limga yoki manzilgacha yetkazish.",
        "icon_color": "#1E3A8A",
        "fields": [
            {"key": "client_login", "label": "BTS Mijoz Logini", "type": "text", "placeholder": "bts_login", "required": True},
            {"key": "api_password", "label": "API Parol / Kalit", "type": "password", "placeholder": "••••••••", "required": True, "secret": True},
            {"key": "sender_city", "label": "Jo'natuvchi shahar", "type": "text", "placeholder": "Toshkent", "required": True},
        ]
    },
    {
        "slug": "uzpost",
        "name": "Uzpost",
        "category": "delivery",
        "category_title": "Yetkazib berish",
        "badge": "Milliy pochta",
        "rating": 4.9,
        "reviews_count": 110,
        "short_desc": "O'zbekiston Milliy Pochtasi orqali har bir manzilga xavfsiz yetkazish",
        "desc": "Uzpost rasmiy API orqali posilka trek-raqamini olish va jo'natma holatini kuzatish.",
        "icon_color": "#2563EB",
        "fields": [
            {"key": "api_key", "label": "Uzpost API Key", "type": "password", "placeholder": "uzpost_api_...", "required": True, "secret": True},
            {"key": "sender_id", "label": "Jo'natuvchi ID", "type": "text", "placeholder": "UZP_9482", "required": True},
        ]
    },
    {
        "slug": "noor",
        "name": "Noor Delivery",
        "category": "delivery",
        "category_title": "Yetkazib berish",
        "badge": "Shahar kuryeri",
        "rating": 4.8,
        "reviews_count": 62,
        "short_desc": "Internet do'konlar va butiklar uchun shaxsiy kuryerlik xizmati",
        "desc": "Noor kuryerlari bilan integratsiya: buyurtma yig'ilgach kuryerga avtomatik marshrut belgilash.",
        "icon_color": "#D97706",
        "fields": [
            {"key": "api_token", "label": "Noor API Token", "type": "password", "placeholder": "noor_tok_...", "required": True, "secret": True},
            {"key": "partner_phone", "label": "Hamkor telefon raqami", "type": "text", "placeholder": "+998901234567", "required": True},
        ]
    },
    {
        "slug": "robopochta",
        "name": "Robo Pochta",
        "category": "delivery",
        "category_title": "Yetkazib berish",
        "badge": "Aqlli logistika",
        "rating": 4.9,
        "reviews_count": 78,
        "short_desc": "Avtomatlashtirilgan etiketka va nakladnoy generatsiya qilish xizmati",
        "desc": "Buyurtmalar uchun shtrix-kodli yuk xatlarini yaratish va yetkazib berish xizmatlari o'rtasida taqsimlash.",
        "icon_color": "#10B981",
        "fields": [
            {"key": "api_token", "label": "Robo Pochta Token", "type": "password", "placeholder": "rp_live_...", "required": True, "secret": True},
            {"key": "prefix", "label": "Trek-raqam prefiksi", "type": "text", "placeholder": "SB-", "required": False},
        ]
    },
    {
        "slug": "emu_express",
        "name": "EMU Express",
        "category": "delivery",
        "category_title": "Yetkazib berish",
        "badge": "Tezkor pochtaxon",
        "rating": 4.8,
        "reviews_count": 54,
        "short_desc": "Ekspress yetkazib berish va kur'erlik xizmatlari",
        "desc": "EMU kuryerlik tarmog'i orqali tovarlarni butun mamlakat bo'ylab jo'natish.",
        "icon_color": "#7C3AED",
        "fields": [
            {"key": "client_id", "label": "EMU Client ID", "type": "text", "placeholder": "emu_usr_12", "required": True},
            {"key": "secret_key", "label": "EMU Secret Key", "type": "password", "placeholder": "emu_sec_...", "required": True, "secret": True},
        ]
    },

    # ------------------ TO'LOV TIZIMLARI / PAYMENTS ------------------
    {
        "slug": "payme",
        "name": "Payme",
        "category": "payment",
        "category_title": "To'lov tizimlari",
        "badge": "O'zbekiston №1",
        "rating": 5.0,
        "reviews_count": 420,
        "short_desc": "Payme orqali Uzcard va Humo kartalari bilan onlayn to'lovlarni qabul qilish",
        "desc": "Payme Business shlyuzi bilan xavfsiz to'lov: avtomatik fiskal chek, qaytarishlar (refund) va to'lov holatini tekshirish.",
        "icon_color": "#14B8A6",
        "fields": [
            {"key": "merchant_id", "label": "Payme Merchant ID", "type": "text", "placeholder": "6489a8...", "required": True},
            {"key": "secret_key", "label": "Payme Maxfiy kalit (Secret Key)", "type": "password", "placeholder": "payme_sec_...", "required": True, "secret": True},
            {"key": "test_mode", "label": "Test rejimi (Sandbox)", "type": "checkbox", "default": True},
            {"key": "webhook_url", "label": "Payme Webhook URL (Nusxalang)", "type": "readonly", "default": "/api/v1/payments/payme/webhook/"},
        ]
    },
    {
        "slug": "click",
        "name": "Click",
        "category": "payment",
        "category_title": "To'lov tizimlari",
        "badge": "Click Up & EVO",
        "rating": 5.0,
        "reviews_count": 395,
        "short_desc": "Click Up, Click EVO ilovalari va USSD orqali to'lovlarni qabul qilish",
        "desc": "Click Merchant shlyuzi: hisob-faktura yuborish, to'lovni avtomatik tasdiqlash va buyurtmani 'To'langan' holatiga o'tkazish.",
        "icon_color": "#0284C7",
        "fields": [
            {"key": "service_id", "label": "Click Service ID", "type": "text", "placeholder": "38492", "required": True},
            {"key": "merchant_id", "label": "Click Merchant ID", "type": "text", "placeholder": "24982", "required": True},
            {"key": "secret_key", "label": "Click Secret Key", "type": "password", "placeholder": "click_sec_...", "required": True, "secret": True},
            {"key": "test_mode", "label": "Test rejimi", "type": "checkbox", "default": False},
            {"key": "webhook_url", "label": "Click Webhook URL (Nusxalang)", "type": "readonly", "default": "/api/v1/payments/click/webhook/"},
        ]
    },
    {
        "slug": "multicard",
        "name": "Multicard",
        "category": "payment",
        "category_title": "To'lov tizimlari",
        "badge": "Yagona shlyuz",
        "rating": 5.0,
        "reviews_count": 260,
        "short_desc": "Uzcard, Humo, Visa, Mastercard va МИР kartalari uchun universal to'lov shlyuzi",
        "desc": "Bitta shartnoma bilan barcha turdagi mahalliy va xalqaro bank kartalaridan komissiyasiz to'lovlarni qabul qiling.",
        "icon_color": "#8B5CF6",
        "fields": [
            {"key": "app_id", "label": "Multicard Application ID", "type": "text", "placeholder": "rhmt_live_...", "required": True},
            {"key": "secret", "label": "Multicard Secret Key", "type": "password", "placeholder": "multicard_sec_...", "required": True, "secret": True},
            {"key": "store_id", "label": "Do'kon ID (Store ID)", "type": "text", "placeholder": "6", "required": True},
            {"key": "test_mode", "label": "Test rejimi (Simulator)", "type": "checkbox", "default": True},
        ]
    },
    {
        "slug": "uzumpay",
        "name": "Uzum Pay",
        "category": "payment",
        "category_title": "To'lov tizimlari",
        "badge": "Uzum ekotizimi",
        "rating": 5.0,
        "reviews_count": 290,
        "short_desc": "Uzum Bank va Uzum Nasiya orqali qulay 1-klikda to'lov",
        "desc": "Uzum ilovasi foydalanuvchilari uchun tezkor QR to'lov va to'g'ridan-to'g'ri bank hisobidan to'lash imkoniyati.",
        "icon_color": "#7C3AED",
        "fields": [
            {"key": "merchant_id", "label": "Uzum Merchant ID", "type": "text", "placeholder": "uzum_merch_09", "required": True},
            {"key": "secret_key", "label": "API Secret Key", "type": "password", "placeholder": "uzum_sec_...", "required": True, "secret": True},
            {"key": "terminal_id", "label": "Terminal ID", "type": "text", "placeholder": "UZUM_TERM_01", "required": False},
        ]
    },
    {
        "slug": "kaspi",
        "name": "Kaspi Pay",
        "category": "payment",
        "category_title": "To'lov tizimlari",
        "badge": "Qozog'iston",
        "rating": 4.9,
        "reviews_count": 85,
        "short_desc": "Qozog'istonlik xaridorlar uchun Kaspi QR va Kaspi Gold to'lovlari",
        "desc": "Kaspi Pay biznes hisobingiz orqali tenge (KZT) valyutasida xalqaro savdoni yo'lga qo'yish.",
        "icon_color": "#EF4444",
        "fields": [
            {"key": "merchant_token", "label": "Kaspi Merchant Token", "type": "password", "placeholder": "kaspi_tok_...", "required": True, "secret": True},
            {"key": "point_id", "label": "Savdo nuqtasi ID", "type": "text", "placeholder": "kaspi_point_01", "required": True},
        ]
    },
    {
        "slug": "stripe",
        "name": "Stripe",
        "category": "payment",
        "category_title": "To'lov tizimlari",
        "badge": "Global karta",
        "rating": 5.0,
        "reviews_count": 160,
        "short_desc": "Xalqaro Visa, Mastercard, Apple Pay va Google Pay to'lovlari",
        "desc": "Dunyoning 150+ davlatidan valyuta to'lovlarini qabul qilish uchun jahon standartidagi shlyuz.",
        "icon_color": "#6366F1",
        "fields": [
            {"key": "publishable_key", "label": "Publishable Key (pk_live_...)", "type": "text", "placeholder": "pk_live_...", "required": True},
            {"key": "secret_key", "label": "Secret Key (sk_live_...)", "type": "password", "placeholder": "sk_live_...", "required": True, "secret": True},
            {"key": "webhook_secret", "label": "Webhook Secret (whsec_...)", "type": "password", "placeholder": "whsec_...", "required": False, "secret": True},
        ]
    },

    # ------------------ TELEFONIYA VA SOZIAL TARMOQLAR ------------------
    {
        "slug": "online_pbx",
        "name": "Online PBX",
        "category": "telephony_social",
        "category_title": "IP-telefoniya va Ijtimoiy tarmoqlar",
        "badge": "Virtual ATS",
        "rating": 5.0,
        "reviews_count": 95,
        "short_desc": "Virtual ATS: qo'ng'iroqlarni yozib olish va mijoz qo'ng'iroq qilganda buyurtmani ochish",
        "desc": "Mijoz qo'ng'iroq qilganda operator ekranida xaridor ismi va oxirgi buyurtmasi avtomatik paydo bo'ladi.",
        "icon_color": "#10B981",
        "fields": [
            {"key": "pbx_domain", "label": "Online PBX Domeni", "type": "text", "placeholder": "company.onpbx.ru", "required": True},
            {"key": "api_key", "label": "API Key", "type": "password", "placeholder": "onpbx_key_...", "required": True, "secret": True},
            {"key": "crypto_key", "label": "Kripto kalit (Crypto Key)", "type": "password", "placeholder": "onpbx_crypt_...", "required": False, "secret": True},
        ]
    },
    {
        "slug": "zadarma",
        "name": "Zadarma",
        "category": "telephony_social",
        "category_title": "IP-telefoniya va Ijtimoiy tarmoqlar",
        "badge": "Bulutli ATS",
        "rating": 4.9,
        "reviews_count": 68,
        "short_desc": "Toshkent va 100+ mamlakatning ko'p kanalli raqamlari hamda qo'ng'iroqlar tahlili",
        "desc": "Do'koningiz uchun rasmiy virtual raqam, kiruvchi qo'ng'iroqlarni operatorlar o'rtasida taqsimlash.",
        "icon_color": "#F97316",
        "fields": [
            {"key": "api_key", "label": "Zadarma Key", "type": "password", "placeholder": "zadarma_key_...", "required": True, "secret": True},
            {"key": "api_secret", "label": "Zadarma Secret", "type": "password", "placeholder": "zadarma_sec_...", "required": True, "secret": True},
        ]
    },
    {
        "slug": "sipuni",
        "name": "Sipuni",
        "category": "telephony_social",
        "category_title": "IP-telefoniya va Ijtimoiy tarmoqlar",
        "badge": "IP-telefoniya",
        "rating": 4.8,
        "reviews_count": 42,
        "short_desc": "Operatorlar va kuryerlar uchun korporativ aloqa tizimi",
        "desc": "Kiruvchi qo'ng'iroqlar statistikasi, yozuvlar va buyurtma kartochkasi integratsiyasi.",
        "icon_color": "#3B82F6",
        "fields": [
            {"key": "sip_id", "label": "Foydalanuvchi SIP ID", "type": "text", "placeholder": "sip_user_01", "required": True},
            {"key": "api_token", "label": "Sipuni API Token", "type": "password", "placeholder": "sipuni_token_...", "required": True, "secret": True},
        ]
    },
    {
        "slug": "instagram",
        "name": "Instagram Direct",
        "category": "telephony_social",
        "category_title": "IP-telefoniya va Ijtimoiy tarmoqlar",
        "badge": "Ijtimoiy tarmoq",
        "rating": 5.0,
        "reviews_count": 480,
        "short_desc": "Instagram sahifangizdan avtomatik tovar katalogi va Direct orqali buyurtma qabul qilish",
        "desc": "Direct chatlaridan xabarlarni StoreBox CRM ga qabul qilish, tovar havolalarini avtomatik yuborish.",
        "icon_color": "#EC4899",
        "fields": [
            {"key": "instagram_username", "label": "Instagram Akkaunti (@...)", "type": "text", "placeholder": "@my_brand_store", "required": True},
            {"key": "meta_access_token", "label": "Meta Graph API Access Token", "type": "password", "placeholder": "EAA...", "required": False, "secret": True},
            {"key": "auto_reply", "label": "Direct-da avtomatik do'kon havolasini yuborish", "type": "checkbox", "default": True},
        ]
    },
    {
        "slug": "telegram",
        "name": "Telegram Bot & WebApp",
        "category": "telephony_social",
        "category_title": "IP-telefoniya va Ijtimoiy tarmoqlar",
        "badge": "Avtonom do'kon",
        "rating": 5.0,
        "reviews_count": 520,
        "short_desc": "Telegram ichida to'liq ishlovchi WebApp do'kon va bildirishnomalar boti",
        "desc": "@BotFather orqali yaratilgan botingizni StoreBox bilan bog'lab, mijozlarga to'g'ridan-to'g'ri Telegramda savdo qiling.",
        "icon_color": "#0284C7",
        "fields": [
            {"key": "bot_token", "label": "Telegram Bot Token", "type": "password", "placeholder": "123456789:ABCdefGHI...", "required": True, "secret": True},
            {"key": "chat_id", "label": "Admin Telegram Chat ID", "type": "text", "placeholder": "987654321", "required": False},
            {"key": "button_name", "label": "Botdagi menyu tugmasi nomi", "type": "text", "placeholder": "Do'konni ochish 🛍", "required": False, "default": "Do'konni ochish 🛍"},
        ]
    },
    {
        "slug": "whatsapp",
        "name": "WhatsApp Business",
        "category": "telephony_social",
        "category_title": "IP-telefoniya va Ijtimoiy tarmoqlar",
        "badge": "Xabarnomalar",
        "rating": 4.9,
        "reviews_count": 140,
        "short_desc": "Mijozlarga buyurtma holati va kuryer manzilini WhatsApp orqali yuborish",
        "desc": "WhatsApp Cloud API orqali rasmiy biznes akkauntingizdan tasdiq xabarlari yuborish.",
        "icon_color": "#22C55E",
        "fields": [
            {"key": "phone_number_id", "label": "WhatsApp Phone Number ID", "type": "text", "placeholder": "109384729102", "required": True},
            {"key": "access_token", "label": "System User Access Token", "type": "password", "placeholder": "EAAG...", "required": True, "secret": True},
            {"key": "waba_id", "label": "WABA (Business Account) ID", "type": "text", "placeholder": "192837465", "required": False},
        ]
    },
]


def _sync_with_existing_models(store: Store, slug: str, config: dict, creds: dict, is_active: bool):
    """
    Ensures seamless backward-compatibility by automatically propagating
    integration parameters into StorePaymentSetting, Store, or YesPosConnection.
    """
    # 1. PAYMENTS
    if slug in ["payme", "click", "multicard", "uzumpay"]:
        pay_setting, _ = StorePaymentSetting.objects.get_or_create(store=store)
        if slug == "payme":
            pay_setting.payme_enabled = is_active
            if config.get("merchant_id"):
                pay_setting.payme_merchant_id = config["merchant_id"]
            if creds.get("secret_key"):
                pay_setting.payme_secret_key = creds["secret_key"]
            if "test_mode" in config:
                pay_setting.payme_test_mode = bool(config["test_mode"])
            pay_setting.save()

        elif slug == "click":
            pay_setting.click_enabled = is_active
            if config.get("service_id"):
                pay_setting.click_service_id = config["service_id"]
            if config.get("merchant_id"):
                pay_setting.click_merchant_id = config["merchant_id"]
            if creds.get("secret_key"):
                pay_setting.click_secret_key = creds["secret_key"]
            pay_setting.save()

        elif slug == "multicard":
            pay_setting.multicard_enabled = is_active
            if config.get("app_id"):
                pay_setting.multicard_app_id = config["app_id"]
            if creds.get("secret"):
                pay_setting.multicard_secret = creds["secret"]
            if config.get("store_id"):
                pay_setting.multicard_store_id = config["store_id"]
            if "test_mode" in config:
                pay_setting.multicard_test_mode = bool(config["test_mode"])
            pay_setting.save()

        elif slug == "uzumpay":
            pay_setting.uzum_enabled = is_active
            if config.get("merchant_id"):
                pay_setting.uzum_merchant_id = config["merchant_id"]
            if creds.get("secret_key"):
                pay_setting.uzum_secret_key = creds["secret_key"]
            pay_setting.save()

    # 2. YES POS
    elif slug == "yespos":
        if is_active and creds.get("api_key") and config.get("branch_id"):
            YesPosConnection.objects.update_or_create(
                store=store,
                defaults={
                    "api_key": creds["api_key"],
                    "branch_id": config["branch_id"],
                    "branch_name": config.get("branch_name", "Asosiy filial"),
                    "is_active": is_active,
                    "last_sync_at": timezone.now(),
                }
            )

    # 3. DELIVERY
    elif slug in ["yandex_delivery", "express24", "fargo", "bts_express", "uzpost"]:
        if is_active:
            store.courier_enabled = True
            store.save(update_fields=["courier_enabled", "updated_at"])

    # 4. SOCIAL / TELEGRAM
    elif slug == "telegram":
        if creds.get("bot_token"):
            store.telegram_bot_token = creds["bot_token"]
        if config.get("chat_id"):
            store.telegram_chat_id = config["chat_id"]
        if config.get("button_name"):
            store.telegram_button_name = config["button_name"]
        store.save(update_fields=["telegram_bot_token", "telegram_chat_id", "telegram_button_name", "updated_at"])

    elif slug == "instagram":
        if config.get("instagram_username"):
            store.instagram_username = config["instagram_username"]
            store.save(update_fields=["instagram_username", "updated_at"])


# -----------------------------------------------------------------
# BUILD INTEGRATIONS PAYLOAD HELPER
# -----------------------------------------------------------------

def build_integrations_payload(store=None):
    """
    Constructs the full marketplace payload for a store.
    If store is None, returns all catalog items with is_connected=False.
    Guarantees that the marketplace never returns empty or 404.
    """
    connected_records = {
        integ.service_slug: integ
        for integ in StoreIntegration.objects.filter(store=store)
    } if store else {}

    pay_setting = getattr(store, 'payment_settings', None) if store else None

    items = []
    for meta in INTEGRATIONS_CATALOG:
        slug = meta["slug"]
        record = connected_records.get(slug)

        is_connected = False
        is_active = False
        saved_config = {}
        masked_creds = {}
        last_synced = None

        if record:
            is_connected = record.is_connected
            is_active = record.is_active
            saved_config = record.config or {}
            masked_creds = record.credentials_preview or {}
            last_synced = record.last_sync_at.isoformat() if record.last_sync_at else None
        elif store:
            # Fallback check legacy models
            if slug == "payme" and pay_setting and pay_setting.payme_merchant_id:
                is_connected = True
                is_active = pay_setting.payme_enabled
                saved_config = {"merchant_id": pay_setting.payme_merchant_id, "test_mode": pay_setting.payme_test_mode}
                masked_creds = {"secret_key": "••••••••"}
            elif slug == "click" and pay_setting and (pay_setting.click_service_id or pay_setting.click_merchant_id):
                is_connected = True
                is_active = pay_setting.click_enabled
                saved_config = {"service_id": pay_setting.click_service_id, "merchant_id": pay_setting.click_merchant_id}
                masked_creds = {"secret_key": "••••••••"}
            elif slug == "multicard" and pay_setting and pay_setting.multicard_app_id:
                is_connected = True
                is_active = pay_setting.multicard_enabled
                saved_config = {"app_id": pay_setting.multicard_app_id, "store_id": pay_setting.multicard_store_id, "test_mode": pay_setting.multicard_test_mode}
                masked_creds = {"secret": "••••••••"}
            elif slug == "telegram" and store.telegram_bot_token:
                is_connected = True
                is_active = True
                saved_config = {"chat_id": store.telegram_chat_id, "button_name": store.telegram_button_name}
                masked_creds = {"bot_token": "••••••••"}
            elif slug == "yespos":
                yes_conn = getattr(store, 'yespos_connection', None)
                if yes_conn and yes_conn.api_key:
                    is_connected = True
                    is_active = yes_conn.is_active
                    saved_config = {"branch_id": yes_conn.branch_id, "branch_name": yes_conn.branch_name}
                    masked_creds = {"api_key": "••••••••"}

        items.append({
            **meta,
            "is_connected": is_connected,
            "is_active": is_active,
            "saved_config": saved_config,
            "masked_credentials": masked_creds,
            "last_synced": last_synced,
        })

    # Summary counts
    total_count = len(items)
    connected_count = sum(1 for it in items if it["is_connected"])
    active_count = sum(1 for it in items if it["is_active"])

    return {
        "integrations": items,
        "counts": {
            "total": total_count,
            "connected": connected_count,
            "active": active_count,
            "pos": sum(1 for it in items if it["category"] == "pos"),
            "warehouse": sum(1 for it in items if it["category"] == "warehouse"),
            "delivery": sum(1 for it in items if it["category"] == "delivery"),
            "payment": sum(1 for it in items if it["category"] == "payment"),
            "telephony_social": sum(1 for it in items if it["category"] == "telephony_social"),
        }
    }


# -----------------------------------------------------------------
# API VIEWS
# -----------------------------------------------------------------

@api_view(["GET"])
@permission_classes([AllowAny])
def integrations_list_view(request):
    """
    Returns the complete marketplace of integrations, merged with the current
    merchant store's saved connection statuses, active states, and masked credentials.
    Guaranteed to ALWAYS return 200 OK with all items (never 404 or 403).
    """
    store = None
    if request.user.is_authenticated:
        store = get_merchant_store(request)
        if not store:
            store = Store.objects.filter(owner=request.user, is_active=True).first() or Store.objects.filter(owner=request.user).first()
        if not store and request.user.is_superuser:
            store = Store.objects.filter(is_active=True).first() or Store.objects.first()

    payload = build_integrations_payload(store)
    return Response(payload)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def integration_detail_view(request, slug):
    """
    Returns single integration details with its stored config.
    """
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Do'kon topilmadi"}, status=404)

    meta = next((m for m in INTEGRATIONS_CATALOG if m["slug"] == slug), None)
    if not meta:
        return Response({"error": "Integratsiya topilmadi"}, status=404)

    record = StoreIntegration.objects.filter(store=store, service_slug=slug).first()
    is_connected = record.is_connected if record else False
    is_active = record.is_active if record else False
    config = record.config if record else {}
    masked_creds = record.credentials_preview if record else {}

    return Response({
        **meta,
        "is_connected": is_connected,
        "is_active": is_active,
        "saved_config": config,
        "masked_credentials": masked_creds,
        "last_synced": record.last_sync_at.isoformat() if record and record.last_sync_at else None,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def integration_save_view(request, slug):
    """
    Saves and activates integration for the store.
    Separates public configuration from secret credentials, securely encrypts credentials,
    and syncs with relevant backend subsystems.
    """
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Do'kon topilmadi"}, status=404)

    meta = next((m for m in INTEGRATIONS_CATALOG if m["slug"] == slug), None)
    if not meta:
        return Response({"error": "Integratsiya topilmadi"}, status=404)

    data = request.data or {}
    fields_def = meta.get("fields", [])

    config = {}
    new_creds = {}

    # Extract fields based on schema
    for f in fields_def:
        k = f["key"]
        is_secret = f.get("secret", False)
        val = data.get(k)

        if is_secret:
            if val is not None and str(val).strip() and not str(val).startswith("••••"):
                new_creds[k] = str(val).strip()
        else:
            if val is not None:
                config[k] = val

    is_active = bool(data.get("is_active", True))

    integ, _ = StoreIntegration.objects.get_or_create(
        store=store,
        service_slug=slug,
        defaults={
            "category": meta["category"],
            "name": meta["name"],
        }
    )

    # Merge config
    current_config = integ.config or {}
    current_config.update(config)
    integ.config = current_config

    # Update credentials if provided
    if new_creds:
        existing_creds = integ.get_credentials()
        existing_creds.update(new_creds)
        integ.set_credentials(existing_creds)
    elif not integ.encrypted_credentials and not integ.is_connected:
        # If no credentials yet but marked connected
        integ.set_credentials({})

    integ.is_connected = True
    integ.is_active = is_active
    integ.last_sync_at = timezone.now()
    integ.last_sync_status = "success"
    integ.last_sync_message = "Muvaffaqiyatli ulandi va faollashtirildi"
    integ.save()

    # Synchronize with legacy / related models
    active_creds = integ.get_credentials()
    _sync_with_existing_models(store, slug, integ.config, active_creds, is_active)

    from apps.stores.integration_service import record_integration_log, IntegrationSyncService
    record_integration_log(
        store=store,
        slug=slug,
        name=meta["name"],
        event_type="CONFIG",
        status="SUCCESS",
        message=f"{meta['name']} sozlamalari yangilandi va 256-bitli shifrlash bilan saqlandi."
    )

    # Automatically trigger initial synchronization if enabled
    sync_result = None
    if is_active:
        sync_result = IntegrationSyncService.sync_data(store, slug)

    return Response({
        "success": True,
        "message": f"{meta['name']} muvaffaqiyatli ulandi va sozlamalari saqlandi!",
        "sync_result": sync_result,
        "integration": {
            "slug": slug,
            "is_connected": integ.is_connected,
            "is_active": integ.is_active,
            "saved_config": integ.config,
            "masked_credentials": integ.credentials_preview,
            "last_synced": integ.last_sync_at.isoformat() if integ.last_sync_at else None,
        }
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def integration_toggle_view(request, slug):
    """
    Toggles integration active status (on / off).
    """
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Do'kon topilmadi"}, status=404)

    integ = StoreIntegration.objects.filter(store=store, service_slug=slug).first()
    if not integ:
        return Response({"error": "Integratsiya ulanmagan"}, status=404)

    new_state = not integ.is_active
    integ.is_active = new_state
    integ.save(update_fields=["is_active", "updated_at"])

    # Sync state
    _sync_with_existing_models(store, slug, integ.config, integ.get_credentials(), new_state)

    from apps.stores.integration_service import record_integration_log
    status_word = "faollashtirildi" if new_state else "to'xtatildi"
    record_integration_log(
        store=store,
        slug=slug,
        name=integ.name,
        event_type="TOGGLE",
        status="SUCCESS",
        message=f"{integ.name} integratsiyasi {status_word}"
    )

    return Response({
        "success": True,
        "is_active": integ.is_active,
        "message": f"{integ.name} integratsiyasi {status_word}"
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def integration_disconnect_view(request, slug):
    """
    Disconnects the integration, disables sync, and cleans credentials safely.
    """
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Do'kon topilmadi"}, status=404)

    integ = StoreIntegration.objects.filter(store=store, service_slug=slug).first()
    if integ:
        service_name = integ.name
        integ.is_connected = False
        integ.is_active = False
        integ.set_credentials({})
        integ.last_sync_status = "disconnected"
        integ.last_sync_message = "Ulanish uzildi"
        integ.save()

        _sync_with_existing_models(store, slug, integ.config, {}, False)

        from apps.stores.integration_service import record_integration_log
        record_integration_log(
            store=store,
            slug=slug,
            name=service_name,
            event_type="DISCONNECT",
            status="SUCCESS",
            message=f"{service_name} ulanishi uzildi va maxfiy kalitlar tozalandi."
        )

    return Response({
        "success": True,
        "message": "Integratsiya o'chirildi va ulanish uzildi"
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def integration_test_view(request, slug):
    """
    Simulates / tests API handshake with external service using IntegrationSyncService.
    """
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Do'kon topilmadi"}, status=404)

    meta = next((m for m in INTEGRATIONS_CATALOG if m["slug"] == slug), None)
    if not meta:
        return Response({"error": "Integratsiya topilmadi"}, status=404)

    data = request.data or {}
    fields_def = meta.get("fields", [])
    config = {}
    creds = {}

    rec = StoreIntegration.objects.filter(store=store, service_slug=slug).first()
    if rec:
        config.update(rec.config or {})
        creds.update(rec.get_credentials() or {})

    for f in fields_def:
        k = f["key"]
        v = data.get(k)
        if v is not None and str(v).strip() and not str(v).startswith("••••"):
            if f.get("secret"):
                creds[k] = str(v).strip()
            else:
                config[k] = v

    from apps.stores.integration_service import IntegrationSyncService
    res = IntegrationSyncService.test_connection(store, slug, config, creds)
    status_code = res.get("status_code", 200 if res.get("success") else 400)
    return Response(res, status=status_code)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def integration_sync_view(request, slug):
    """
    Manually triggers data synchronization (catalog items, inventory stock levels,
    webhook bindings, delivery routes) between external service and StoreBox.
    """
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Do'kon topilmadi"}, status=404)

    from apps.stores.integration_service import IntegrationSyncService
    result = IntegrationSyncService.sync_data(store, slug)
    status_code = 200 if result.get("success") else 400
    return Response(result, status=status_code)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def integration_logs_view(request, slug):
    """
    Returns recent audit logs and exchange events for the given integration.
    """
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Do'kon topilmadi"}, status=404)

    from apps.stores.models import StoreIntegrationLog
    logs = StoreIntegrationLog.objects.filter(store=store, service_slug=slug).order_by("-created_at")[:15]

    return Response({
        "slug": slug,
        "logs": [
            {
                "id": log.id,
                "event_type": log.event_type,
                "status": log.status,
                "message": log.message,
                "details": log.details,
                "created_at": log.created_at.strftime("%d.%m.%Y %H:%M:%S"),
                "created_at_iso": log.created_at.isoformat(),
            }
            for log in logs
        ]
    })
