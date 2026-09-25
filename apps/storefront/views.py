import json
from decimal import Decimal
from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse, Http404
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.clickjacking import xframe_options_exempt
from django.db.models import Q
from django.utils import timezone

from apps.stores.models import Store, Branch
from apps.catalog.models import Category, Product, ProductVariation
from apps.orders.models import Order, OrderItem, PromoCode, Customer, ChatMessage
from apps.payments.models import StorePaymentSetting
from apps.telegram_bot.services import send_telegram_notification, format_order_telegram_message


from apps.catalog.translations import auto_translate_text


def get_current_store(request, subdomain=None):
    """Helper to get active store from request.store or subdomain param"""
    store = getattr(request, 'store', None)
    if not store and subdomain:
        store = Store.objects.filter(subdomain__iexact=subdomain, is_active=True).first()
    return store


def get_storefront_lang(request, store=None):
    """
    Get current storefront language from request.
    Priority:
    1. GET param ?lang=
    2. request.language (from middleware)
    3. request.session['lang'] / request.session['customer_lang']
    4. Cookies: 'storebox_lang', 'django_language'
    5. store.default_language
    6. 'uz'
    """
    q_lang = request.GET.get('lang')
    if q_lang in ['uz', 'ru', 'en', 'tr']:
        if hasattr(request, 'session'):
            request.session['lang'] = q_lang
            request.session['customer_lang'] = q_lang
        request.language = q_lang
        return q_lang

    req_lang = getattr(request, 'language', None)
    if req_lang in ['uz', 'ru', 'en', 'tr']:
        if hasattr(request, 'session'):
            request.session['lang'] = req_lang
            request.session['customer_lang'] = req_lang
        return req_lang

    s_lang = (
        (request.session.get('lang') if hasattr(request, 'session') else None) or
        (request.session.get('customer_lang') if hasattr(request, 'session') else None) or
        request.COOKIES.get('storebox_lang') or
        request.COOKIES.get('django_language') or
        (store.default_language if store else None) or
        'uz'
    )
    if s_lang in ['uz', 'ru', 'en', 'tr']:
        if hasattr(request, 'session'):
            request.session['lang'] = s_lang
            request.session['customer_lang'] = s_lang
        request.language = s_lang
        return s_lang

    return 'uz'


UI_TRANSLATIONS = {
    'uz': {
        'search_placeholder': "Mahsulotlar va toifalarni qidirish",
        'favorites': "Sevimlilar",
        'cart': "Savat",
        'login': "Kirish",
        'buy': "Sotib olish",
        'buy_now': "Buyurtma berish",
        'add': "Qo'shish",
        'about_us': "Biz haqimizda",
        'branches': "Do'kon filiallari",
        'delivery_terms': "Yetkazib berish shartlari",
        'return_terms': "Qaytarish va almashtirish",
        'contact_us': "Biz bilan bog'lanish",
        'empty_products': "Hozircha mahsulotlar mavjud emas",
        'work_hours': "Ish vaqti",
        'address': "Manzil",
        'contacts': "Kontaktlar",
        'day_off': "Dam olish kuni",
        'currently_closed': "Hozir yopiq",
        'open_until': "Ochiq",
        'open_now': "Ochiq",
        'all_categories': "Barcha mahsulotlar",
        'all': "Barchasi",
        'products_count': "ta mahsulot",
        'sale': "Aksiya",
        'add_to_cart': "Savatchaga",
        'about_product': "Mahsulot haqida",
        'seller_chat': "Do'kon bilan chat",
        'home': "Asosiy",
        'no_reviews': "Sharhlar mavjud emas",
        'view_on_map': "Xaritada ko'rish",
        'our_socials': "Ijtimoiy tarmoqlarimiz",
        'reviews': "sharhlar",
        'welcome_back': "Xush kelibsiz,",
        'categories': "Katalog",
        'new_arrivals': "Yangi mahsulotlar",
        'see_all': "Barchasi",
        'similar_products': "O'xshash mahsulotlar",
        'back': "Orqaga",
        'clear_cart': "Tozalash",
        'clear_cart_confirm': "Savatni tozalashni tasdiqlaysizmi?",
        'total_payment': "Jami to'lov:",
        'proceed_to_checkout': "To'lovga o'tish",
        'cart_empty': "Savatingiz hozircha bo'sh",
        'popular': "Ommabop Mahsulotlar",
        'popular_subtitle': "Eng sara va ommabop mahsulotlar to'plami",
        'restaurant_menu': "Taomlar Menyusi",
        'restaurant_menu_subtitle': "Issiq va yangi tayyorlangan sara taomlar to'plami",
        'restaurant_sections': "Taomlar Bo'limlari",
        'more': "ko'proq",
        'items_unit': "ta",
        'in_stock': "Mavjud",
        'out_of_stock': "Tugagan",
        'not_available_now': "Hozirda sotuvda mavjud emas",
        'vat_included': "QQS bilan birga",
        'per_unit': "1 dona uchun",
        'sku': "Artikul",
        'choice': "Tanlov:",
        'fast_delivery_title': "1 kunda yetkazish",
        'fast_delivery_sub': "Tezkor xarid",
        'quality_title': "100% Sifat",
        'quality_sub': "Asl mahsulot",
        'payment_title': "Qulay to'lov",
        'payment_sub': "Click, Payme, Naqd",
        'return_title': "Oson qaytarish",
        'return_sub': "14 kun ichida",
        'tab_description': "Tavsif",
        'tab_specs': "Xususiyatlar",
        'tab_reviews': "Sharhlar",
        'tab_delivery': "Yetkazib berish",
        'unit_measure': "O'lchov birligi:",
        'barcode': "Shtrix-kod:",
        'ikpu_code': "IKPU kodi:",
        'category_label': "Kategoriya:",
        'order_now': "Buyurtma berish",
        'quick_buy': "Tezkor xarid",
        'information': "Ma'lumotlar",
        'language': "Til",
        'delivery_address': "Yetkazib berish manzili",
        'select_delivery_address': "Yetkazib berish manzilini tanlang",
        'profile': "Profil",
        'my_orders': "Buyurtmalarim",
        'enter_phone': "Telefon raqamingizni kiriting",
        'name': "Ismingiz",
        'save': "Saqlash",
        'close': "Yopish",
        'logout': "Chiqish",
        'back_to_menu': "Menyuga qaytish",
        'step_checkout': "2-qadam: To'lov va yetkazish",
        'ordered_products': "Buyurtma qilinayotgan tovarlar",
        'edit': "O'zgartirish",
        'items_count_and_sum': "Tovarlar soni va jami:",
        'contact_data': "Aloqa ma'lumotlari",
        'phone_number': "Telefon raqami",
        'fulfillment_method': "Buyurtmani qabul qilish usuli",
        'courier_delivery': "Kuryer orqali yetkazish",
        'to_your_door': "Xaridor eshigigacha",
        'pickup': "Olib ketish (Samovivoz)",
        'from_branch': "Filialdan bepul (0 UZS)",
        'delivery_address_and_map': "Yetkazib berish manzili va xarita",
        'map_hint': "Xaritadan tanlang, qidiring yoki geolokatsiyani yoqing",
        'my_location': "Mening joylashuvim",
        'locating': "Aniqlanmoqda...",
        'city_region': "Shahar / Viloyat",
        'search_street_orientir': "Ko'cha yoki mo'ljalni qidirish",
        'or_select_on_map': "yoki xaritadan tanlang",
        'street_number': "Ko'cha, uy raqami",
        'entrance': "Podezd",
        'floor': "Qavat",
        'apartment': "Xonadon / Ofis",
        'intercom': "Domofon kodi",
        'landmark': "Mo'ljal (orientir)",
        'delivery_fee_label': "Yetkazib berish narxi:",
        'free': "Bepul 🎉",
        'order_comment': "Buyurtmaga izoh (ixtiyoriy)",
        'order_comment_placeholder': "Domofon, qo'ng'iroq qilish, tezroq...",
        'payment_method_label': "To'lov usuli",
        'cash': "Naqd pul",
        'cash_desc': "Qabul qilinganda to'lov",
        'terminal': "Kuryerga terminal orqali",
        'terminal_desc': "Uzcard/Humo karta orqali",
        'order_summary': "Yakuniy hisob-kitob",
        'have_promo': "Promokod bormi?",
        'apply': "Qo'llash",
        'products_sum': "Tovarlar summasi:",
        'discount_label': "Promokod bo'yicha chegirma:",
        'confirm_order': "Buyurtmani tasdiqlash",
        'active': "Faol",
        'delivered': "Yetkazildi",
    },
    'ru': {
        'search_placeholder': "Поиск товаров и категорий",
        'favorites': "Избранное",
        'cart': "Корзина",
        'login': "Войти",
        'buy': "Купить",
        'buy_now': "Заказать сейчас",
        'add': "Добавить",
        'about_us': "О нас",
        'branches': "Филиалы магазина",
        'delivery_terms': "Условия доставки",
        'return_terms': "Условия возврата и обмена",
        'contact_us': "Связаться с нами",
        'empty_products': "Пока нет товаров",
        'work_hours': "Время работы",
        'address': "Адрес",
        'contacts': "Контакты",
        'day_off': "Выходной",
        'currently_closed': "Сейчас закрыто",
        'open_until': "Открыто",
        'open_now': "Открыто",
        'all_categories': "Все товары",
        'all': "Все",
        'products_count': "товаров",
        'sale': "Акция",
        'add_to_cart': "В корзину",
        'about_product': "О товаре",
        'seller_chat': "Чат с продавцом",
        'home': "Главная",
        'no_reviews': "Нет отзывов",
        'view_on_map': "Посмотреть на карте",
        'our_socials': "Наши соцсети",
        'reviews': "отзывов",
        'welcome_back': "С возвращением,",
        'categories': "Каталог",
        'new_arrivals': "Новинки",
        'see_all': "Все",
        'similar_products': "Похожие товары",
        'back': "Назад",
        'clear_cart': "Очистить",
        'clear_cart_confirm': "Очистить корзину?",
        'total_payment': "Итого к оплате:",
        'proceed_to_checkout': "Перейти к оформлению",
        'cart_empty': "Ваша корзина пуста",
        'popular': "Популярные товары",
        'popular_subtitle': "Подборка лучших и популярных товаров",
        'restaurant_menu': "Меню ресторана",
        'restaurant_menu_subtitle': "Горячие и свежие фирменные блюда",
        'restaurant_sections': "Разделы меню",
        'more': "ещё",
        'items_unit': "шт",
        'in_stock': "В наличии",
        'out_of_stock': "Нет в наличии",
        'not_available_now': "Временно недоступно для заказа",
        'vat_included': "Включая НДС",
        'per_unit': "за 1 шт",
        'sku': "Артикул",
        'choice': "Выбор:",
        'fast_delivery_title': "Доставка за 1 день",
        'fast_delivery_sub': "Быстрый заказ",
        'quality_title': "100% Качество",
        'quality_sub': "Оригинальный товар",
        'payment_title': "Удобная оплата",
        'payment_sub': "Click, Payme, Наличные",
        'return_title': "Легкий возврат",
        'return_sub': "В течение 14 дней",
        'tab_description': "Описание",
        'tab_specs': "Характеристики",
        'tab_reviews': "Отзывы",
        'tab_delivery': "Доставка",
        'unit_measure': "Единица измерения:",
        'barcode': "Штрихкод:",
        'ikpu_code': "Код ИКПУ:",
        'category_label': "Категория:",
        'order_now': "Заказать",
        'quick_buy': "Купить в 1 клик",
        'information': "Информация",
        'language': "Язык",
        'delivery_address': "Адрес доставки",
        'select_delivery_address': "Выберите адрес доставки",
        'profile': "Профиль",
        'my_orders': "Мои заказы",
        'enter_phone': "Введите номер телефона",
        'name': "Ваше имя",
        'save': "Сохранить",
        'close': "Закрыть",
        'logout': "Выйти",
        'back_to_menu': "Вернуться в меню",
        'step_checkout': "Шаг 2: Доставка и оплата",
        'ordered_products': "Заказываемые товары",
        'edit': "Изменить",
        'items_count_and_sum': "Кол-во товаров и сумма:",
        'contact_data': "Контактные данные",
        'phone_number': "Номер телефона",
        'fulfillment_method': "Способ получения заказа",
        'courier_delivery': "Курьерская доставка",
        'to_your_door': "До двери покупателя",
        'pickup': "Самовывоз",
        'from_branch': "Из филиала (0 UZS)",
        'delivery_address_and_map': "Адрес доставки и карта",
        'map_hint': "Укажите на карте, найдите через поиск или включите геолокацию",
        'my_location': "Мое местоположение",
        'locating': "Определение...",
        'city_region': "Город / Регион",
        'search_street_orientir': "Поиск улицы или ориентира",
        'or_select_on_map': "или укажите на карте",
        'street_number': "Улица, номер дома",
        'entrance': "Подъезд",
        'floor': "Этаж",
        'apartment': "Кв. / Офис",
        'intercom': "Домофон",
        'landmark': "Ориентир для курьера",
        'delivery_fee_label': "Стоимость доставки:",
        'free': "Бесплатно 🎉",
        'order_comment': "Комментарий к заказу (необязательно)",
        'order_comment_placeholder': "Домофон, без лука, позвонить заранее...",
        'payment_method_label': "Способ оплаты",
        'cash': "Наличными",
        'cash_desc': "Оплата при получении",
        'terminal': "Терминалом курьеру",
        'terminal_desc': "Картой Uzcard/Humo курьеру",
        'order_summary': "Итоговый расчет",
        'have_promo': "Есть промокод?",
        'apply': "Применить",
        'products_sum': "Сумма товаров:",
        'discount_label': "Скидка по промокоду:",
        'confirm_order': "Подтвердить заказ",
        'active': "Активные",
        'delivered': "Доставленные",
    },
    'en': {
        'search_placeholder': "Search products and categories",
        'favorites': "Favorites",
        'cart': "Cart",
        'login': "Login",
        'buy': "Buy",
        'buy_now': "Order Now",
        'add': "Add",
        'about_us': "About us",
        'branches': "Store Branches",
        'delivery_terms': "Delivery Terms",
        'return_terms': "Return & Exchange Policy",
        'contact_us': "Contact Us",
        'empty_products': "No products found",
        'work_hours': "Working hours",
        'address': "Address",
        'contacts': "Contacts",
        'day_off': "Day off",
        'currently_closed': "Currently closed",
        'open_until': "Open",
        'open_now': "Open",
        'all_categories': "All products",
        'all': "All",
        'products_count': "items",
        'sale': "Sale",
        'add_to_cart': "Add to Cart",
        'about_product': "About product",
        'seller_chat': "Chat with seller",
        'home': "Home",
        'no_reviews': "No reviews",
        'view_on_map': "View on map",
        'our_socials': "Our social media",
        'reviews': "reviews",
        'welcome_back': "Welcome back,",
        'categories': "Catalog",
        'new_arrivals': "New arrivals",
        'see_all': "See all",
        'similar_products': "Similar products",
        'back': "Back",
        'clear_cart': "Clear",
        'clear_cart_confirm': "Are you sure you want to clear your cart?",
        'total_payment': "Total payment:",
        'proceed_to_checkout': "Proceed to Checkout",
        'cart_empty': "Your cart is currently empty",
        'popular': "Popular Products",
        'popular_subtitle': "Selection of top and popular products",
        'restaurant_menu': "Restaurant Menu",
        'restaurant_menu_subtitle': "Freshly prepared signature hot dishes",
        'restaurant_sections': "Menu Sections",
        'more': "more",
        'items_unit': "pcs",
        'in_stock': "In stock",
        'out_of_stock': "Out of stock",
        'not_available_now': "Currently unavailable",
        'vat_included': "VAT included",
        'per_unit': "per 1 item",
        'sku': "SKU",
        'choice': "Choice:",
        'fast_delivery_title': "1-day delivery",
        'fast_delivery_sub': "Fast checkout",
        'quality_title': "100% Quality",
        'quality_sub': "Original item",
        'payment_title': "Easy payment",
        'payment_sub': "Click, Payme, Cash",
        'return_title': "Easy return",
        'return_sub': "Within 14 days",
        'tab_description': "Description",
        'tab_specs': "Specifications",
        'tab_reviews': "Reviews",
        'tab_delivery': "Delivery",
        'unit_measure': "Unit of measure:",
        'barcode': "Barcode:",
        'ikpu_code': "IKPU Code:",
        'category_label': "Category:",
        'order_now': "Order Now",
        'quick_buy': "Quick Buy",
        'information': "Information",
        'language': "Language",
        'delivery_address': "Delivery Address",
        'select_delivery_address': "Select delivery address",
        'profile': "Profile",
        'my_orders': "My Orders",
        'enter_phone': "Enter your phone number",
        'name': "Your name",
        'save': "Save",
        'close': "Close",
        'logout': "Log out",
        'back_to_menu': "Back to menu",
        'step_checkout': "Step 2: Delivery & Payment",
        'ordered_products': "Ordered Products",
        'edit': "Edit",
        'items_count_and_sum': "Items count & total:",
        'contact_data': "Contact Details",
        'phone_number': "Phone Number",
        'fulfillment_method': "Order Fulfillment Method",
        'courier_delivery': "Courier Delivery",
        'to_your_door': "Directly to your door",
        'pickup': "Self-Pickup",
        'from_branch': "From store branch (0 UZS)",
        'delivery_address_and_map': "Delivery Address & Map",
        'map_hint': "Choose on the map, search street or enable geolocation",
        'my_location': "My Location",
        'locating': "Locating...",
        'city_region': "City / Region",
        'search_street_orientir': "Search street or landmark",
        'or_select_on_map': "or select on the map",
        'street_number': "Street, house number",
        'entrance': "Entrance",
        'floor': "Floor",
        'apartment': "Apt / Office",
        'intercom': "Intercom code",
        'landmark': "Landmark for courier",
        'delivery_fee_label': "Delivery fee:",
        'free': "Free 🎉",
        'order_comment': "Order comment (optional)",
        'order_comment_placeholder': "Intercom code, no onions, call in advance...",
        'payment_method_label': "Payment Method",
        'cash': "Cash on delivery",
        'cash_desc': "Pay upon receiving order",
        'terminal': "Card to courier (Terminal)",
        'terminal_desc': "Uzcard/Humo card terminal",
        'order_summary': "Order Summary",
        'have_promo': "Have a promo code?",
        'apply': "Apply",
        'products_sum': "Items subtotal:",
        'discount_label': "Promo discount:",
        'confirm_order': "Confirm Order",
        'active': "Active",
        'delivered': "Delivered",
    },
    'tr': {
        'search_placeholder': "Ürün veya kategori ara",
        'favorites': "Favoriler",
        'cart': "Sepet",
        'login': "Giriş",
        'buy': "Satın Al",
        'buy_now': "Sipariş Ver",
        'add': "Ekle",
        'about_us': "Hakkımızda",
        'branches': "Şubelerimiz",
        'delivery_terms': "Teslimat Koşulları",
        'return_terms': "İade ve Değişim",
        'contact_us': "İletişim",
        'empty_products': "Henüz ürün eklenmedi",
        'work_hours': "Çalışma saatleri",
        'address': "Adres",
        'contacts': "İletişim",
        'day_off': "Tatil günü",
        'currently_closed': "Şu anda kapalı",
        'open_until': "Açık",
        'open_now': "Açık",
        'all_categories': "Tüm ürünler",
        'all': "Tümü",
        'products_count': "ürün",
        'sale': "İndirim",
        'add_to_cart': "Sepete Ekle",
        'about_product': "Ürün hakkında",
        'seller_chat': "Satıcıyla Sohbet",
        'home': "Ana Sayfa",
        'no_reviews': "Yorum yok",
        'view_on_map': "Haritada gör",
        'our_socials': "Sosyal medya hesaplarımız",
        'reviews': "yorum",
        'welcome_back': "Tekrar hoş geldiniz,",
        'categories': "Katalog",
        'new_arrivals': "Yeni Gelenler",
        'see_all': "Tümü",
        'similar_products': "Benzer ürünler",
        'back': "Geri",
        'clear_cart': "Temizle",
        'clear_cart_confirm': "Sepeti temizlemek istiyor musunuz?",
        'total_payment': "Toplam tutar:",
        'proceed_to_checkout': "Ödemeye Geç",
        'cart_empty': "Sepetiniz henüz boş",
        'popular': "Popüler Ürünler",
        'popular_subtitle': "En iyi ve popüler ürünler seçkisi",
        'restaurant_menu': "Restoran Menüsü",
        'restaurant_menu_subtitle': "Taze ve sıcak spesiyal yemekler",
        'restaurant_sections': "Menü Bölümleri",
        'more': "daha fazla",
        'items_unit': "adet",
        'in_stock': "Stokta var",
        'out_of_stock': "Tükendi",
        'not_available_now': "Şu anda satışta değil",
        'vat_included': "KDV dahil",
        'per_unit': "1 adet için",
        'sku': "Ürün Kodu",
        'choice': "Seçim:",
        'fast_delivery_title': "1 günde teslimat",
        'fast_delivery_sub': "Hızlı sipariş",
        'quality_title': "%100 Kalite",
        'quality_sub': "Orijinal ürün",
        'payment_title': "Kolay ödeme",
        'payment_sub': "Click, Payme, Nakit",
        'return_title': "Kolay iade",
        'return_sub': "14 gün içinde",
        'tab_description': "Açıklama",
        'tab_specs': "Özellikler",
        'tab_reviews': "Yorumlar",
        'tab_delivery': "Teslimat",
        'unit_measure': "Birim:",
        'barcode': "Barkod:",
        'ikpu_code': "İKPU Kodu:",
        'category_label': "Kategori:",
        'order_now': "Sipariş ver",
        'quick_buy': "Hemen Al",
        'information': "Bilgiler",
        'language': "Dil",
        'delivery_address': "Teslimat Adresi",
        'select_delivery_address': "Teslimat adresini seçin",
        'profile': "Profil",
        'my_orders': "Siparişlerim",
        'enter_phone': "Telefon numaranızı girin",
        'name': "Adınız",
        'save': "Kaydet",
        'close': "Kapat",
        'logout': "Çıkış Yap",
        'back_to_menu': "Menüye dön",
        'step_checkout': "2. Adım: Teslimat ve Ödeme",
        'ordered_products': "Sipariş Edilen Ürünler",
        'edit': "Değiştir",
        'items_count_and_sum': "Ürün adedi ve toplam:",
        'contact_data': "İletişim Bilgileri",
        'phone_number': "Telefon Numarası",
        'fulfillment_method': "Sipariş Teslim Alma Yöntemi",
        'courier_delivery': "Kurye ile Teslimat",
        'to_your_door': "Kapınıza kadar",
        'pickup': "Gel Al (Şubeden)",
        'from_branch': "Şubeden teslim al (0 UZS)",
        'delivery_address_and_map': "Teslimat Adresi ve Harita",
        'map_hint': "Haritadan seçin, sokak arayın veya konumu açın",
        'my_location': "Konumum",
        'locating': "Belirleniyor...",
        'city_region': "Şehir / Bölge",
        'search_street_orientir': "Sokak veya bilinen yer ara",
        'or_select_on_map': "veya haritadan seçin",
        'street_number': "Sokak, bina no",
        'entrance': "Bina Girişi",
        'floor': "Kat",
        'apartment': "Daire / Ofis",
        'intercom': "Diyafon kodu",
        'landmark': "Kurye için tarif",
        'delivery_fee_label': "Teslimat ücreti:",
        'free': "Ücretsiz 🎉",
        'order_comment': "Sipariş notu (isteğe bağlı)",
        'order_comment_placeholder': "Diyafon kodu, soğansız olsun, önceden arayın...",
        'payment_method_label': "Ödeme Yöntemi",
        'cash': "Kapıda Nakit",
        'cash_desc': "Teslim alırken nakit ödeme",
        'terminal': "Kuryeye Kartla",
        'terminal_desc': "Uzcard/Humo kart terminali",
        'order_summary': "Sipariş Özeti",
        'have_promo': "Promosyon kodunuz var mı?",
        'apply': "Uygula",
        'products_sum': "Ürünler tutarı:",
        'discount_label': "Promosyon indirimi:",
        'confirm_order': "Siparişi Onayla",
        'active': "Aktif",
        'delivered': "Teslim Edildi",
    }
}


# -----------------------------------------------------------------
# STOREFRONT HOME & CATALOG
# -----------------------------------------------------------------

@xframe_options_exempt
def storefront_home_view(request, subdomain=None):
    store = get_current_store(request, subdomain)
    if not store:
        # If on platform root without store, render platform landing directly
        if getattr(request, 'is_platform_root', False):
            from apps.core.views import landing_view
            return landing_view(request)
        raise Http404('Магазин не найден')

    lang = get_storefront_lang(request, store)
    store._current_lang = lang

    categories = Category.objects.filter(store=store, is_active=True).order_by('sort_order', 'id')
    products = Product.objects.filter(store=store, is_active=True).prefetch_related('images', 'variations')
    total_products_count = products.count()

    # Category filter
    cat_slug = request.GET.get('cat') or request.GET.get('category')
    selected_category = None
    if cat_slug:
        selected_category = categories.filter(slug=cat_slug).first()
        if selected_category:
            products = products.filter(category=selected_category)

    # Search filter
    search_q = request.GET.get('q', '').strip()
    if search_q:
        products = products.filter(
            Q(name_ru__icontains=search_q) |
            Q(name_uz__icontains=search_q) |
            Q(description_ru__icontains=search_q) |
            Q(description_uz__icontains=search_q)
        )

    # Sorting
    sort = request.GET.get('sort', 'default')
    if sort == 'price_asc':
        products = products.order_by('price')
    elif sort == 'price_desc':
        products = products.order_by('-price')
    elif sort == 'newest':
        products = products.order_by('-created_at')
    else:
        products = products.order_by('-is_featured', '-created_at')

    # Telegram Mini App detection
    is_tma = bool(request.GET.get('tma') == '1' or request.session.get('telegram_user_id'))

    from apps.orders.models import MarketingBanner
    banners = MarketingBanner.objects.filter(store=store, is_active=True).order_by('sort_order', 'id')

    # Template override (for direct testing and preview)
    req_template = request.GET.get('template')
    if req_template in ['restaurant', 'universal', 'boutique']:
        store.theme_template = req_template

    # Live Preview overrides for interactive dashboard design customizer
    if request.GET.get('preview') == '1' or request.GET.get('card_style') or request.GET.get('primary_color'):
        if request.GET.get('primary_color'):
            store.primary_color = request.GET.get('primary_color').strip()
        if request.GET.get('card_style'):
            store.theme_card_style = request.GET.get('card_style').strip()
        if request.GET.get('card_radius'):
            store.theme_card_radius = request.GET.get('card_radius').strip()
        if request.GET.get('image_aspect'):
            store.theme_image_aspect = request.GET.get('image_aspect').strip()
        if request.GET.get('button_style'):
            store.theme_button_style = request.GET.get('button_style').strip()
        if request.GET.get('bg_color'):
            store.theme_bg_color = request.GET.get('bg_color').strip()

    # Determine effective card style for layout rendering
    req_card_style = request.GET.get('card_style')
    if req_card_style in ['modern', 'minimal', 'compact']:
        effective_card_style = req_card_style
    elif req_template in ['restaurant', 'boutique', 'universal']:
        if req_template == 'restaurant':
            effective_card_style = 'compact'
        elif req_template == 'boutique':
            effective_card_style = 'minimal'
        else:
            effective_card_style = 'modern'
    elif store.theme_template == 'restaurant':
        effective_card_style = 'compact'
    elif store.theme_template == 'boutique':
        effective_card_style = 'minimal'
    else:
        effective_card_style = store.theme_card_style or 'modern'

    # Preview Banner
    p_title = request.GET.get('preview_banner_title', '').strip()
    p_sub = request.GET.get('preview_banner_subtitle', '').strip()
    p_img = request.GET.get('preview_banner_image', '').strip()
    if p_title or p_img:
        class MockBanner:
            def __init__(self, title, subtitle, image_url):
                self.title = title
                self.subtitle = subtitle
                self.image_url = image_url
                self.image = None

            @property
            def display_image_url(self):
                return self.image_url
        banners = [MockBanner(p_title or f"«{store.name}»", p_sub, p_img)]

    # Preview Niche Products & Categories with real photos
    preview_niche = request.GET.get('preview_niche', '').strip()
    if preview_niche:
        NICHE_ALIASES = {
            'clothes': 'fashion',
            'cosmetics': 'beauty',
            'electronics': 'tech',
            'sweets': 'coffee',
            'supermarket': 'grocery',
            'fastfood': 'restaurant',
            'cafe': 'coffee'
        }
        preview_niche = NICHE_ALIASES.get(preview_niche, preview_niche)
        from apps.stores.ai_designer import NICHE_PRESETS
        niche_data = NICHE_PRESETS.get(preview_niche)
        if niche_data:
            # If banner not explicitly passed, auto-use the niche's promotional banner
            if not (p_title or p_img) and niche_data.get('banner_images'):
                n_title = niche_data.get('titles', {}).get('uz', f"«{store.name}»").format(store_name=store.name)
                n_sub = niche_data.get('subtitles', {}).get('uz', '')
                n_img = niche_data.get('banner_images', [''])[0]
                class MockBanner:
                    def __init__(self, title, subtitle, image_url):
                        self.title = title
                        self.subtitle = subtitle
                        self.image_url = image_url
                        self.image = None

                    @property
                    def display_image_url(self):
                        return self.image_url
                banners = [MockBanner(n_title, n_sub, n_img)]

            # Mock Categories for preview niche only if store has no active categories
            if niche_data.get('categories') and not categories.exists():
                class MockCategory:
                    def __init__(self, c_dict, idx):
                        self.id = 8000 + idx
                        self.name_uz = c_dict['name_uz']
                        self.name_ru = c_dict.get('name_ru', c_dict['name_uz'])
                        self.name_en = c_dict.get('name_en', c_dict['name_uz'])
                        self.slug = c_dict.get('slug', f'cat-{idx}')
                        self.icon = c_dict.get('icon', 'tag')
                        self.image = None
                        self.image_url = c_dict.get('image_url')
                        self.primary_image_url = c_dict.get('image_url')
                        self.active_products_count = c_dict.get('products_count', 6)
                        self.products_count = c_dict.get('products_count', 6)
                        self.products = type('MockQuerySet', (), {
                            'count': lambda self: 6,
                            'filter': lambda self, *a, **k: type('MockQS', (), {'count': lambda s: 6})()
                        })()
                    def get_name(self, l='uz'):
                        if l == 'ru' and self.name_ru:
                            return self.name_ru
                        elif l == 'en' and self.name_en:
                            return self.name_en
                        return self.name_uz

                categories = [MockCategory(c, i) for i, c in enumerate(niche_data['categories'])]
                if cat_slug:
                    selected_category = next((c for c in categories if c.slug == cat_slug), None)

            # Mock Products for preview niche only if store has no active products
            if niche_data.get('products') and (request.GET.get('force_preview') == '1' or not products.exists()):
                if not products.exists() or request.GET.get('force_preview') == '1':
                    class MockProduct:
                        def __init__(self, p_dict, idx):
                            self.id = 9000 + idx
                            self.name_uz = p_dict['name_uz']
                            self.name_ru = p_dict.get('name_ru', p_dict['name_uz'])
                            self.name_en = p_dict.get('name_en', p_dict['name_uz'])
                            self.description_uz = p_dict.get('description_uz', '')
                            self.description_ru = p_dict.get('description_ru', '')
                            self.description_en = p_dict.get('description_en', '')
                            self.category_slug = p_dict.get('category_slug', '')
                            self.price = p_dict['price']
                            self.old_price = p_dict.get('old_price')
                            self.primary_image_url = p_dict.get('image_url')
                            self.discount_percent = int(round(((self.old_price - self.price) / self.old_price) * 100)) if self.old_price and self.old_price > self.price else None
                            self.rating = 5.0
                            self.reviews_count = 8 + (idx * 3)
                            self.stock = 25
                            self.is_in_stock = True
                            self.variations = type('EmptyVars', (), {'filter': lambda *a, **k: []})()
                        def get_name(self, l='uz'):
                            if l == 'ru' and self.name_ru:
                                return self.name_ru
                            elif l == 'en' and self.name_en:
                                return self.name_en
                            return self.name_uz
                        def get_description(self, l='uz'):
                            if l == 'ru' and self.description_ru:
                                return self.description_ru
                            elif l == 'en' and self.description_en:
                                return self.description_en
                            return self.description_uz

                    preview_prods = [MockProduct(p, i) for i, p in enumerate(niche_data['products'])]
                    total_products_count = len(preview_prods)
                    if cat_slug:
                        filtered = [p for p in preview_prods if p.category_slug == cat_slug]
                        products = filtered if filtered else preview_prods
                    else:
                        products = preview_prods

    for p in products:
        p.display_name = p.get_name(lang) if hasattr(p, 'get_name') else (getattr(p, f'name_{lang}', None) or getattr(p, 'name_uz', '') or getattr(p, 'name_ru', ''))
        p.display_description = p.get_description(lang) if hasattr(p, 'get_description') else (getattr(p, f'description_{lang}', None) or getattr(p, 'description_uz', '') or getattr(p, 'description_ru', ''))
        p.display_unit = p.get_unit_name(lang) if hasattr(p, 'get_unit_name') else (p.get_unit_display() if hasattr(p, 'get_unit_display') else '')

    for c in categories:
        c.display_name = c.get_name(lang) if hasattr(c, 'get_name') else (getattr(c, f'name_{lang}', None) or getattr(c, 'name_uz', '') or getattr(c, 'name_ru', ''))

    for b in banners:
        b_title = getattr(b, f'title_{lang}', None) or b.title
        b_sub = getattr(b, f'subtitle_{lang}', None) or b.subtitle
        b.display_title = auto_translate_text(b_title, target_lang=lang) if b_title else ''
        b.display_subtitle = auto_translate_text(b_sub, target_lang=lang) if b_sub else ''

    cart = request.session.get('cart', {}) if hasattr(request, 'session') else {}
    cart_count = sum(item.get('quantity', 1) for item in cart.values())
    subtotal = sum(item.get('total_price', 0) for item in cart.values())

    t = UI_TRANSLATIONS.get(lang, UI_TRANSLATIONS['uz'])
    context = {
        'store': store,
        'effective_card_style': effective_card_style,
        'banners': banners,
        'categories': categories,
        'products': products,
        'total_products_count': total_products_count,
        'selected_category': selected_category,
        'current_category': selected_category,
        'search_q': search_q,
        'sort': sort,
        'lang': lang,
        'current_lang': lang,
        't': t,
        'is_tma': is_tma,
        'cart': cart,
        'cart_count': cart_count,
        'cart_subtotal': subtotal,
        'cart_json': json.dumps(cart),
    }
    return render(request, 'storefront/home.html', context)


def product_detail_json_view(request, product_id):
    """API endpoint for instant product modal details & variations"""
    product = get_object_or_404(Product, id=product_id, is_active=True)
    lang = getattr(request, 'language', 'ru')

    variations_data = []
    for v in product.variations.filter(is_active=True):
        variations_data.append({
            'id': v.id,
            'name': v.get_name(lang),
            'price': float(v.price),
            'stock': v.stock,
            'in_stock': v.stock > 0
        })

    images_data = [img.image.url for img in product.images.all() if img.image]
    if not images_data and product.primary_image_url:
        images_data = [product.primary_image_url]

    data = {
        'id': product.id,
        'name': product.get_name(lang),
        'description': product.get_description(lang),
        'price': float(product.price),
        'old_price': float(product.old_price) if product.old_price else None,
        'discount_percent': product.discount_percent,
        'in_stock': product.is_in_stock,
        'images': images_data,
        'variations': variations_data,
    }
    return JsonResponse(data)


def wishlist_products_api(request, subdomain=None):
    """API endpoint returning product cards for requested IDs in wishlist"""
    store = get_current_store(request, subdomain)
    if not store:
        return JsonResponse({'error': "Do'kon topilmadi"}, status=404)

    raw_ids = request.GET.get('ids', '')
    if not raw_ids:
        return JsonResponse({'products': []})

    try:
        id_list = [int(x.strip()) for x in raw_ids.split(',') if x.strip().isdigit()]
    except Exception:
        id_list = []

    if not id_list:
        return JsonResponse({'products': []})

    lang = getattr(request, 'language', 'uz')
    products = Product.objects.filter(store=store, id__in=id_list, is_active=True)
    product_map = {p.id: p for p in products}

    result = []
    for pid in id_list:
        p = product_map.get(pid)
        if not p:
            continue
        result.append({
            'id': p.id,
            'name': p.get_name(lang),
            'price': float(p.price),
            'old_price': float(p.old_price) if p.old_price else None,
            'discount_percent': p.discount_percent,
            'image': p.primary_image_url or '',
            'in_stock': p.is_in_stock,
            'url': f"/store/{store.subdomain}/product/{p.id}/" if store.subdomain else f"/product/{p.id}/",
        })

    return JsonResponse({'products': result})


# -----------------------------------------------------------------
# CART SESSION OPERATIONS
# -----------------------------------------------------------------

@csrf_exempt
def cart_add_view(request, subdomain=None):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=400)

    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        data = request.POST

    product_id = data.get('product_id')
    variation_id = data.get('variation_id')
    quantity = int(data.get('quantity', 1))

    product = get_object_or_404(Product, id=product_id, is_active=True)
    variation = None
    if variation_id:
        variation = product.variations.filter(id=variation_id, is_active=True).first()

    cart = request.session.get('cart', {})
    item_key = f"{product.id}_{variation.id if variation else 0}"

    unit_price = float(variation.price if variation else product.price)
    lang = getattr(request, 'language', 'ru')
    name = product.get_name(lang)
    var_name = variation.get_name(lang) if variation else ''

    if item_key in cart:
        cart[item_key]['quantity'] += quantity
        cart[item_key]['total_price'] = cart[item_key]['quantity'] * unit_price
        cart[item_key]['price'] = unit_price
        cart[item_key]['unit_price'] = unit_price
    else:
        cart[item_key] = {
            'product_id': product.id,
            'variation_id': variation.id if variation else None,
            'name': name,
            'variation_name': var_name,
            'unit_price': unit_price,
            'price': unit_price,
            'quantity': quantity,
            'total_price': quantity * unit_price,
            'image': product.primary_image_url or '',
            'image_url': product.primary_image_url or '',
        }

    request.session['cart'] = cart
    request.session.modified = True

    total_count = sum(item['quantity'] for item in cart.values())
    subtotal = sum(item['total_price'] for item in cart.values())

    return JsonResponse({
        'success': True,
        'cart_count': total_count,
        'subtotal': subtotal,
        'cart': cart
    })


@csrf_exempt
def cart_update_view(request, subdomain=None):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=400)

    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        data = request.POST

    item_key = data.get('item_key')
    action = data.get('action') # 'increase', 'decrease', 'remove'
    quantity = data.get('quantity')

    cart = request.session.get('cart', {})
    if item_key in cart:
        unit_p = float(cart[item_key].get('unit_price') or cart[item_key].get('price') or 0)
        if quantity is not None:
            try:
                qty = int(quantity)
                if qty <= 0:
                    del cart[item_key]
                else:
                    cart[item_key]['quantity'] = qty
                    cart[item_key]['unit_price'] = unit_p
                    cart[item_key]['price'] = unit_p
                    cart[item_key]['total_price'] = qty * unit_p
            except (ValueError, TypeError):
                pass
        elif action in ['increase', 'increment']:
            cart[item_key]['quantity'] += 1
            cart[item_key]['unit_price'] = unit_p
            cart[item_key]['price'] = unit_p
            cart[item_key]['total_price'] = cart[item_key]['quantity'] * unit_p
        elif action in ['decrease', 'decrement']:
            cart[item_key]['quantity'] -= 1
            if cart[item_key]['quantity'] <= 0:
                del cart[item_key]
            else:
                cart[item_key]['unit_price'] = unit_p
                cart[item_key]['price'] = unit_p
                cart[item_key]['total_price'] = cart[item_key]['quantity'] * unit_p
        elif action == 'remove':
            del cart[item_key]

    request.session['cart'] = cart
    request.session.modified = True

    total_count = sum(item['quantity'] for item in cart.values())
    subtotal = sum(item['total_price'] for item in cart.values())

    return JsonResponse({
        'success': True,
        'cart_count': total_count,
        'subtotal': subtotal,
        'cart': cart
    })


@csrf_exempt
def cart_clear_view(request, subdomain=None):
    request.session['cart'] = {}
    request.session.modified = True
    return JsonResponse({'success': True, 'cart_count': 0, 'subtotal': 0, 'cart': {}})


def apply_promo_view(request, subdomain=None):
    store = getattr(request, 'store', None)
    if not store:
        subdomain = request.GET.get('subdomain') or request.session.get('current_store_subdomain')
        if subdomain:
            store = Store.objects.filter(subdomain__iexact=subdomain, is_active=True).first()
    if not store:
        return JsonResponse({'success': False, 'message': 'Магазин не найден'})

    code = request.GET.get('code', '').strip().upper()
    cart = request.session.get('cart', {})
    subtotal = sum(item['total_price'] for item in cart.values())

    promo = PromoCode.objects.filter(store=store, code=code).first()
    if not promo:
        return JsonResponse({'success': False, 'message': 'Промокод не найден'})

    is_valid, msg = promo.is_valid(subtotal)
    if not is_valid:
        return JsonResponse({'success': False, 'message': msg})

    discount = promo.calculate_discount(subtotal)
    return JsonResponse({
        'success': True,
        'discount': float(discount),
        'code': promo.code,
        'message': f'Промокод применен: скидка {int(discount):,} UZS'
    })


# -----------------------------------------------------------------
# CHECKOUT & ORDER PLACEMENT
# -----------------------------------------------------------------

@xframe_options_exempt
def checkout_view(request, subdomain=None):
    store = get_current_store(request, subdomain)
    if not store:
        raise Http404('Магазин не найден')

    cart = request.session.get('cart', {})
    subtotal = Decimal(str(sum(item['total_price'] for item in cart.values()))) if cart else Decimal('0')
    error = None

    pay_settings, _ = StorePaymentSetting.objects.get_or_create(store=store)
    lang = get_storefront_lang(request, store)
    store._current_lang = lang
    t = UI_TRANSLATIONS.get(lang, UI_TRANSLATIONS['uz'])

    # Calculate default delivery fee
    if subtotal >= store.free_delivery_threshold:
        default_delivery_fee = Decimal('0')
    else:
        default_delivery_fee = store.delivery_price

    if request.method == 'POST':
        customer_name = request.POST.get('customer_name', '').strip()
        customer_phone = request.POST.get('customer_phone', '').strip()
        delivery_method = request.POST.get('delivery_method', Order.DeliveryMethods.COURIER)
        delivery_city = request.POST.get('delivery_city', 'Ташкент').strip()
        delivery_address = request.POST.get('delivery_address', '').strip()
        delivery_street = request.POST.get('delivery_street', '').strip()
        delivery_entrance = request.POST.get('delivery_entrance', '').strip()
        delivery_floor = request.POST.get('delivery_floor', '').strip()
        delivery_apartment = request.POST.get('delivery_apartment', '').strip()
        delivery_domofon = request.POST.get('delivery_domofon', '').strip()
        delivery_landmark = request.POST.get('delivery_landmark', '').strip()

        if delivery_street:
            full_addr = delivery_street
            details = []
            if delivery_entrance: details.append(f"podezd {delivery_entrance}")
            if delivery_floor: details.append(f"etaj {delivery_floor}")
            if delivery_apartment: details.append(f"kv. {delivery_apartment}")
            if delivery_domofon: details.append(f"domofon: {delivery_domofon}")
            if delivery_landmark: details.append(f"mo'ljal: {delivery_landmark}")
            if details:
                full_addr += f" ({', '.join(details)})"
            delivery_address = full_addr

        payment_method = request.POST.get('payment_method', Order.PaymentMethods.CASH)
        notes = request.POST.get('notes', '').strip()
        promo_code_str = request.POST.get('promo_code', '').strip().upper()
        telegram_user_id = request.POST.get('telegram_user_id')

        if not customer_name or not customer_phone:
            error = 'Пожалуйста, укажите ваше имя и номер телефона'
        elif delivery_method == Order.DeliveryMethods.COURIER and not delivery_address:
            error = 'Пожалуйста, укажите адрес доставки на карте или в поле ввода'
        else:
            # Promo calculation
            discount_amount = Decimal('0')
            promo_obj = None
            if promo_code_str:
                promo_candidate = PromoCode.objects.filter(store=store, code=promo_code_str).first()
                if promo_candidate:
                    valid, _ = promo_candidate.is_valid(subtotal)
                    if valid:
                        discount_amount = promo_candidate.calculate_discount(subtotal)
                        promo_obj = promo_candidate
                        promo_candidate.times_used += 1
                        promo_candidate.save()

            # Delivery fee calculation
            if delivery_method == Order.DeliveryMethods.PICKUP:
                delivery_fee = Decimal('0')
            else:
                if subtotal >= store.free_delivery_threshold:
                    delivery_fee = Decimal('0')
                else:
                    delivery_fee = store.delivery_price

            total_amount = max(Decimal('0'), subtotal - discount_amount + delivery_fee)

            # Detect source: Telegram Mini App vs Web
            # Only genuine Telegram users (with non-empty telegram_user_id) are marked as TMA; all web browser visits are WEB
            telegram_user_id = request.POST.get('telegram_user_id')
            is_from_telegram = bool(
                telegram_user_id and str(telegram_user_id).strip() not in ['', 'None', 'null', 'undefined', '0']
            ) or (request.POST.get('is_tma') == '1' and bool(request.session.get('telegram_user_id')))
            source = Order.Sources.TELEGRAM_MINI_APP if is_from_telegram else Order.Sources.WEB

            branch_id = request.POST.get('branch_id')
            branch = Branch.objects.filter(id=branch_id, store=store).first() if branch_id else None
            delivery_lat = float(request.POST.get('delivery_lat')) if request.POST.get('delivery_lat') else None
            delivery_lng = float(request.POST.get('delivery_lng')) if request.POST.get('delivery_lng') else None

            order_number = Order.generate_order_number()
            order = Order.objects.create(
                store=store,
                branch=branch,
                order_number=order_number,
                customer_name=customer_name,
                customer_phone=customer_phone,
                delivery_method=delivery_method,
                delivery_city=delivery_city,
                delivery_address=delivery_address,
                delivery_lat=delivery_lat,
                delivery_lng=delivery_lng,
                delivery_fee=delivery_fee,
                notes=notes,
                promo_code=promo_obj,
                discount_amount=discount_amount,
                subtotal=subtotal,
                total_amount=total_amount,
                payment_method=payment_method,
                payment_status=Order.PaymentStatuses.PENDING,
                status=Order.OrderStatuses.NEW,
                telegram_user_id=int(telegram_user_id) if telegram_user_id and telegram_user_id.isdigit() else None,
                source=source
            )

            # Update or create Customer CRM record
            customer, _ = Customer.objects.get_or_create(
                store=store,
                phone=customer_phone,
                defaults={'name': customer_name}
            )
            customer.name = customer_name
            customer.orders_count += 1
            customer.total_spent += total_amount
            customer.last_order_at = timezone.now()
            # 3% cashback bonus accrual
            customer.bonus_balance += int(total_amount * Decimal('0.03'))
            customer.save()

            order.customer = customer
            order.save(update_fields=['customer'])

            # Create OrderItems and decrease inventory stock
            for item in cart.values():
                p_id = item.get('product_id')
                v_id = item.get('variation_id')
                qty = item.get('quantity', 1)
                u_price = Decimal(str(item.get('unit_price', 0)))
                t_price = Decimal(str(item.get('total_price', 0)))

                product = Product.objects.filter(id=p_id).first()
                variation = ProductVariation.objects.filter(id=v_id).first() if v_id else None

                OrderItem.objects.create(
                    order=order,
                    product=product,
                    variation=variation,
                    product_name=item.get('name', 'Товар'),
                    variation_name=item.get('variation_name', ''),
                    unit_price=u_price,
                    quantity=qty,
                    total_price=t_price
                )

                # Inventory decrement
                if variation:
                    variation.stock = max(0, variation.stock - qty)
                    variation.save()
                elif product and product.track_stock:
                    product.stock = max(0, product.stock - qty)
                    product.save()

            # Clear cart and remember customer
            request.session['cart'] = {}
            request.session['customer_phone'] = customer_phone
            request.session['customer_name'] = customer_name
            request.session.modified = True

            # Send Telegram Alert to Merchant
            tg_message = format_order_telegram_message(order)
            send_telegram_notification(store, tg_message)

            if store and store.subdomain:
                return redirect(f'/store/{store.subdomain}/order/{order.order_number}/success/')
            return redirect(f'/order/{order.order_number}/success/')

    is_tma = bool(request.GET.get('tma') == '1' or request.session.get('telegram_user_id'))
    branches = store.branches.filter(is_active=True)
    saved_phone = request.session.get('customer_phone', '')
    saved_name = request.session.get('customer_name', '')
    return render(request, 'storefront/checkout.html', {
        'store': store,
        'cart': cart,
        'subtotal': subtotal,
        'delivery_price': store.delivery_price,
        'free_delivery_threshold': store.free_delivery_threshold,
        'default_delivery_fee': default_delivery_fee,
        'pay_settings': pay_settings,
        'branches': branches,
        'error': error,
        'lang': lang,
        'current_lang': lang,
        't': t,
        'is_tma': is_tma,
        'saved_phone': saved_phone,
        'saved_name': saved_name
    })


@xframe_options_exempt
def order_success_view(request, order_number, subdomain=None):
    order = get_object_or_404(Order, order_number=order_number)
    store = order.store
    pay_settings, _ = StorePaymentSetting.objects.get_or_create(store=store)
    lang = get_storefront_lang(request, store)
    store._current_lang = lang
    t = UI_TRANSLATIONS.get(lang, UI_TRANSLATIONS['uz'])

    return render(request, 'storefront/order_success.html', {
        'order': order,
        'store': store,
        'pay_settings': pay_settings,
        'is_just_paid': request.GET.get('paid') == '1',
        'lang': lang,
        'current_lang': lang,
        't': t,
    })


@csrf_exempt
def order_live_tracking_api(request, order_number, subdomain=None):
    """
    Public live tracking API for customer storefront.
    Returns:
    - Real-time courier position (lat, lng)
    - Customer destination coordinates (dest_lat, dest_lng)
    - Order status, courier phone and name
    """
    order = get_object_or_404(Order, order_number=order_number)
    courier_data = None
    if order.courier and order.courier.is_courier:
        last_seen = None
        if order.courier.last_location_update:
            last_seen = int((timezone.now() - order.courier.last_location_update).total_seconds())
        courier_data = {
            'id': order.courier.id,
            'name': order.courier.name,
            'phone': order.courier.phone,
            'lat': float(order.courier.current_lat) if order.courier.current_lat else None,
            'lng': float(order.courier.current_lng) if order.courier.current_lng else None,
            'last_seen_seconds_ago': last_seen,
            'is_online': last_seen is not None and last_seen < 300,
        }

    dest_lat = float(order.delivery_lat) if order.delivery_lat else 41.311081
    dest_lng = float(order.delivery_lng) if order.delivery_lng else 69.240562

    return JsonResponse({
        'success': True,
        'order_number': order.order_number,
        'status': order.status,
        'status_display': order.get_status_display(),
        'customer_name': order.customer_name,
        'delivery_address': order.delivery_address or 'Toshkent shahri',
        'dest_lat': dest_lat,
        'dest_lng': dest_lng,
        'courier': courier_data
    })


# -----------------------------------------------------------------
# CUSTOMER PROFILE & ORDERS API (Video ikkinchi.mov 00:37 - 00:55)
# -----------------------------------------------------------------

@csrf_exempt
def customer_login_api(request, subdomain=None):
    """Log in customer by phone number, create/fetch CRM record and session"""
    store = get_current_store(request, subdomain)
    if not store:
        return JsonResponse({'success': False, 'error': 'Do\'kon topilmadi'}, status=404)

    if request.method == 'POST':
        try:
            data = json.loads(request.body.decode('utf-8')) if request.body else request.POST
        except Exception:
            data = request.POST

        phone = (data.get('phone') or '').strip()
        name = (data.get('name') or '').strip()

        if not phone:
            return JsonResponse({'success': False, 'error': 'Telefon raqamini kiriting'}, status=400)

        # Normalize phone
        clean_phone = phone.replace(' ', '').replace('-', '')
        if not clean_phone.startswith('+'):
            if clean_phone.startswith('998'):
                clean_phone = '+' + clean_phone
            elif len(clean_phone) == 9:
                clean_phone = '+998' + clean_phone

        customer, created = Customer.objects.get_or_create(
            store=store,
            phone=clean_phone,
            defaults={'name': name or 'Xaridor'}
        )
        if name and customer.name != name:
            customer.name = name
            customer.save(update_fields=['name'])

        request.session['customer_phone'] = clean_phone
        request.session['customer_name'] = customer.name
        request.session.modified = True

        orders = Order.objects.filter(store=store).filter(
            Q(customer_phone=phone) | Q(customer_phone=clean_phone) | Q(customer=customer)
        )
        return JsonResponse({
            'success': True,
            'customer': {
                'id': customer.id,
                'name': customer.name,
                'phone': customer.phone,
                'orders_count': orders.count(),
                'bonus_balance': customer.bonus_balance
            }
        })
    return JsonResponse({'success': False, 'error': 'Method not allowed'}, status=405)


def customer_orders_api(request, subdomain=None):
    """Fetch order history for customer by phone or session"""
    store = get_current_store(request, subdomain)
    if not store:
        return JsonResponse({'success': False, 'error': 'Do\'kon topilmadi'}, status=404)

    phone = request.GET.get('phone', '').strip() or request.session.get('customer_phone', '').strip()
    if not phone:
        return JsonResponse({'success': True, 'orders': [], 'count': 0})

    clean_phone = phone.replace(' ', '').replace('-', '')
    orders_qs = Order.objects.filter(
        store=store
    ).filter(
        Q(customer_phone=phone) | Q(customer_phone=clean_phone) | Q(customer__phone=clean_phone)
    ).prefetch_related('items', 'items__product', 'items__product__images').order_by('-created_at')

    status_colors = {
        'NEW': 'amber',
        'PROCESSING': 'blue',
        'READY': 'cyan',
        'IN_DELIVERY': 'purple',
        'COMPLETED': 'emerald',
        'CANCELLED': 'rose'
    }

    orders_data = []
    for o in orders_qs:
        items_list = []
        for it in o.items.all():
            img_url = None
            if it.product and it.product.images.exists():
                img_url = it.product.images.first().image.url
            items_list.append({
                'product_name': it.product_name,
                'variation_name': it.variation_name,
                'quantity': it.quantity,
                'unit_price': float(it.unit_price),
                'total_price': float(it.total_price),
                'image': img_url
            })

        orders_data.append({
            'id': o.id,
            'order_number': o.order_number,
            'status': o.status,
            'status_display': o.get_status_display(),
            'status_color': status_colors.get(o.status, 'slate'),
            'total_amount': float(o.total_amount),
            'items_count': o.items.count(),
            'delivery_method_display': o.get_delivery_method_display(),
            'delivery_city': o.delivery_city,
            'delivery_address': o.delivery_address,
            'payment_method_display': o.get_payment_method_display(),
            'payment_status_display': o.get_payment_status_display(),
            'created_at': o.created_at.strftime('%d.%m.%Y, %H:%M'),
            'notes': o.notes,
            'items': items_list
        })

    return JsonResponse({
        'success': True,
        'orders': orders_data,
        'count': len(orders_data)
    })


@csrf_exempt
def customer_logout_api(request, subdomain=None):
    """Log out customer from storefront session"""
    request.session.pop('customer_phone', None)
    request.session.pop('customer_name', None)
    request.session.modified = True
    return JsonResponse({'success': True})


# -----------------------------------------------------------------
# DEDICATED CART PAGE (Uzum Market Style)
# -----------------------------------------------------------------

@xframe_options_exempt
def cart_page_view(request, subdomain=None):
    store = get_current_store(request, subdomain)
    if not store:
        raise Http404("Do'kon topilmadi")

    lang = get_storefront_lang(request, store)
    store._current_lang = lang

    cart = request.session.get('cart', {})
    cart_count = sum(item.get('quantity', 1) for item in cart.values())
    subtotal = sum(item.get('total_price', 0) for item in cart.values())

    # Recommended products for cart upsell & empty state
    recommended_products = Product.objects.filter(store=store, is_active=True).order_by('-is_featured', '-rating', '-id')[:12]
    for p in recommended_products:
        p.display_name = p.get_name(lang) if hasattr(p, 'get_name') else (getattr(p, f'name_{lang}', None) or getattr(p, 'name_uz', '') or getattr(p, 'name_ru', ''))

    # Delivery calculation
    delivery_fee = float(store.delivery_price or 0)
    if store.free_delivery_threshold and subtotal >= float(store.free_delivery_threshold):
        delivery_fee = 0.0

    total = float(subtotal) + (delivery_fee if cart else 0.0)

    # Promo discount if any
    promo_code = request.session.get('promo_code')
    promo_discount = float(request.session.get('promo_discount', 0) or 0)
    if promo_discount:
        total = max(0.0, total - promo_discount)

    t = UI_TRANSLATIONS.get(lang, UI_TRANSLATIONS['uz'])

    context = {
        'store': store,
        'cart': cart,
        'cart_count': cart_count,
        'cart_subtotal': subtotal,
        'subtotal': subtotal,
        'cart_json': json.dumps(cart),
        'delivery_fee': delivery_fee,
        'total': total,
        'promo_code': promo_code,
        'promo_discount': promo_discount,
        'recommended_products': recommended_products,
        'lang': lang,
        'current_lang': lang,
        't': t,
        'is_tma': request.GET.get('tma') == '1' or getattr(request, 'is_tma', False),
    }
    return render(request, 'storefront/cart.html', context)


# -----------------------------------------------------------------
# DEDICATED PRODUCT DETAIL PAGE (Full e-commerce experience)
# -----------------------------------------------------------------

@xframe_options_exempt
def product_detail_page_view(request, product_id, subdomain=None):
    store = get_current_store(request, subdomain)
    if not store:
        raise Http404("Магазин не найден")

    product = get_object_or_404(Product, id=product_id, store=store, is_active=True)
    lang = get_storefront_lang(request, store)
    store._current_lang = lang

    product.display_name = product.get_name(lang) if hasattr(product, 'get_name') else (getattr(product, f'name_{lang}', None) or getattr(product, 'name_uz', '') or getattr(product, 'name_ru', ''))
    product.display_description = product.get_description(lang) if hasattr(product, 'get_description') else (getattr(product, f'description_{lang}', None) or getattr(product, 'description_uz', '') or getattr(product, 'description_ru', ''))
    product.display_unit = product.get_unit_name(lang) if hasattr(product, 'get_unit_name') else (product.get_unit_display() if hasattr(product, 'get_unit_display') else '')

    # Cart context
    cart = request.session.get('cart', {})
    cart_count = sum(item.get('quantity', 1) for item in cart.values())
    subtotal = sum(item.get('total_price', 0) for item in cart.values())

    # Check if this product is already in cart
    in_cart_qty = 0
    for k, item in cart.items():
        if item.get('product_id') == product.id and not item.get('variation_id'):
            in_cart_qty = item.get('quantity', 0)
            break

    # Related products from same category or store
    related_products = []
    if product.category:
        related_products = Product.objects.filter(
            store=store,
            category=product.category,
            is_active=True
        ).exclude(id=product.id)[:8]
    if not related_products:
        related_products = Product.objects.filter(
            store=store,
            is_active=True
        ).exclude(id=product.id)[:8]

    for rp in related_products:
        rp.display_name = rp.get_name(lang) if hasattr(rp, 'get_name') else (getattr(rp, f'name_{lang}', None) or getattr(rp, 'name_uz', '') or getattr(rp, 'name_ru', ''))
        rp.display_unit = rp.get_unit_name(lang) if hasattr(rp, 'get_unit_name') else (rp.get_unit_display() if hasattr(rp, 'get_unit_display') else '')

    if product.category:
        product.category.display_name = product.category.get_name(lang) if hasattr(product.category, 'get_name') else (getattr(product.category, f'name_{lang}', None) or getattr(product.category, 'name_uz', ''))

    variations = list(product.variations.filter(is_active=True))
    for v in variations:
        v.display_name = v.get_name(lang) if hasattr(v, 'get_name') else (getattr(v, f'name_{lang}', None) or getattr(v, 'name_uz', ''))

    # Payment & branches settings
    pay_settings, _ = StorePaymentSetting.objects.get_or_create(store=store)
    branches = store.branches.filter(is_active=True)

    # Customer Reviews
    from apps.catalog.models import ProductReview
    reviews = list(product.reviews.filter(is_approved=True))
    if not reviews:
        sample_reviews = [
            ProductReview.objects.create(
                product=product,
                author_name="Azizbek R.",
                rating=5,
                comment="Juda ajoyib mahsulot, sifati kutilganidan a'lo chiqdi! Qadoqlanishi ham puxta. Rahmat do'konga.",
                is_verified_buyer=True,
                is_approved=True
            ),
            ProductReview.objects.create(
                product=product,
                author_name="Malika T.",
                rating=5,
                comment="Kuryer tez yetkazib berdi, 40 daqiqada yetib keldi. Aynan rasmdagi kabi original tovar.",
                is_verified_buyer=True,
                is_approved=True
            ),
            ProductReview.objects.create(
                product=product,
                author_name="Dostonbek K.",
                rating=4,
                comment="Narxiga arziydi, barchaga tavsiya qilaman. Ishlatishga juda qulay.",
                is_verified_buyer=True,
                is_approved=True
            ),
        ]
        reviews = sample_reviews

    reviews_count = len(reviews)
    avg_rating = round(sum(r.rating for r in reviews) / reviews_count, 1) if reviews_count > 0 else 5.0

    t = UI_TRANSLATIONS.get(lang, UI_TRANSLATIONS['uz'])

    context = {
        'store': store,
        'product': product,
        'related_products': related_products,
        'variations': variations,
        'images': product.images.all(),
        'in_cart_qty': in_cart_qty,
        'cart': cart,
        'cart_count': cart_count,
        'cart_subtotal': subtotal,
        'cart_json': json.dumps(cart),
        'reviews': reviews,
        'reviews_count': reviews_count,
        'avg_rating': avg_rating,
        'pay_settings': pay_settings,
        'branches': branches,
        'lang': lang,
        'current_lang': lang,
        't': t,
        'is_tma': request.GET.get('tma') == '1' or getattr(request, 'is_tma', False),
    }
    return render(request, 'storefront/product_detail.html', context)


@csrf_exempt
def submit_product_review_api(request, product_id, subdomain=None):
    store = get_current_store(request, subdomain)
    if not store:
        return JsonResponse({'success': False, 'error': "Do'kon topilmadi"}, status=404)

    product = get_object_or_404(Product, id=product_id, store=store)
    if request.method == 'POST':
        try:
            data = json.loads(request.body.decode('utf-8'))
        except Exception:
            data = request.POST

        name = (data.get('author_name') or '').strip() or 'Mijoz'
        try:
            rating = int(data.get('rating') or 5)
        except (ValueError, TypeError):
            rating = 5
        comment = (data.get('comment') or '').strip()

        if not comment:
            return JsonResponse({'success': False, 'error': "Sharh matnini kiriting"}, status=400)

        from apps.catalog.models import ProductReview
        review = ProductReview.objects.create(
            product=product,
            author_name=name,
            author_phone=request.session.get('customer_phone', ''),
            rating=max(1, min(5, rating)),
            comment=comment,
            is_verified_buyer=True,
            is_approved=True
        )

        return JsonResponse({
            'success': True,
            'review': {
                'id': review.id,
                'author_name': review.author_name,
                'rating': review.rating,
                'comment': review.comment,
                'created_at': review.created_at.strftime('%d.%m.%Y'),
            }
        })
    return JsonResponse({'success': False, 'error': 'Method not allowed'}, status=405)


# -----------------------------------------------------------------
# DEDICATED CUSTOMER PROFILE & ORDERS PAGE
# -----------------------------------------------------------------

@xframe_options_exempt
def customer_profile_page_view(request, subdomain=None):
    store = get_current_store(request, subdomain)
    if not store:
        raise Http404("Магазин не найден")

    # Handle login POST from profile page if guest
    if request.method == 'POST':
        action = request.POST.get('action')
        if action == 'login':
            phone = request.POST.get('phone', '').strip()
            name = request.POST.get('name', '').strip()
            if phone:
                request.session['customer_phone'] = phone
                if name:
                    request.session['customer_name'] = name
                request.session.modified = True
                customer, _ = Customer.objects.get_or_create(
                    store=store,
                    phone=phone,
                    defaults={'name': name or 'Xaridor'}
                )
                if name and not customer.name:
                    customer.name = name
                    customer.save(update_fields=['name'])
        elif action == 'logout':
            request.session.pop('customer_phone', None)
            request.session.pop('customer_name', None)
            request.session.modified = True

    customer_phone = request.session.get('customer_phone')
    customer_name = request.session.get('customer_name')
    customer = None
    orders = []

    if customer_phone:
        customer = Customer.objects.filter(store=store, phone=customer_phone).first()
        if customer:
            orders = Order.objects.filter(store=store, customer=customer).prefetch_related('items').order_by('-created_at')
            if not customer_name:
                customer_name = customer.name
        else:
            orders = Order.objects.filter(store=store, customer_phone=customer_phone).prefetch_related('items').order_by('-created_at')

    # Cart context
    cart = request.session.get('cart', {})
    cart_count = sum(item.get('quantity', 1) for item in cart.values())
    subtotal = sum(item.get('total_price', 0) for item in cart.values())

    # Translations & Lang
    current_lang = get_storefront_lang(request, store)
    store._current_lang = current_lang
    t = UI_TRANSLATIONS.get(current_lang, UI_TRANSLATIONS['uz'])

    context = {
        'store': store,
        'customer': customer,
        'customer_phone': customer_phone,
        'customer_name': customer_name or 'Xaridor',
        'orders': orders,
        'orders_count': len(orders),
        'cart': cart,
        'cart_count': cart_count,
        'cart_subtotal': subtotal,
        'cart_json': json.dumps(cart),
        'is_tma': request.GET.get('tma') == '1' or getattr(request, 'is_tma', False),
        'lang': current_lang,
        'current_lang': current_lang,
        't': t,
    }
    return render(request, 'storefront/customer_profile.html', context)


@csrf_exempt
def reorder_api(request, order_number, subdomain=None):
    """Reorder items from an existing order into session cart"""
    store = get_current_store(request, subdomain)
    if not store:
        return JsonResponse({'success': False, 'message': 'Магазин не найден'})

    order = get_object_or_404(Order, order_number=order_number, store=store)
    cart = request.session.get('cart', {})

    for item in order.items.all():
        item_key = f"p_{item.product_id}_v_{item.variation_id or 0}"
        u_price = float(item.unit_price)
        qty = item.quantity
        img_url = item.product.primary_image_url if item.product else None

        cart[item_key] = {
            'product_id': item.product_id,
            'variation_id': item.variation_id,
            'name': item.product_name,
            'variation_name': item.variation_name,
            'unit_price': u_price,
            'quantity': qty,
            'total_price': u_price * qty,
            'image_url': img_url
        }

    request.session['cart'] = cart
    request.session.modified = True

    redirect_url = f'/store/{store.subdomain}/checkout/' if subdomain else '/checkout/'
    return JsonResponse({
        'success': True,
        'redirect_url': redirect_url,
        'cart_count': sum(i['quantity'] for i in cart.values()),
        'subtotal': sum(i['total_price'] for i in cart.values())
    })


@csrf_exempt
def storefront_send_chat_api(request, subdomain=None):
    """Customer sends a live chat message directly to merchant dashboard /dashboard/chats/"""
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=400)

    store = get_current_store(request, subdomain)
    if not store:
        return JsonResponse({'error': 'Do\'kon topilmadi'}, status=404)

    try:
        data = json.loads(request.body.decode('utf-8')) if request.body else request.POST
    except Exception:
        data = request.POST

    phone = (data.get('phone') or request.session.get('customer_phone') or '').strip()
    name = (data.get('name') or request.session.get('customer_name') or 'Mijoz').strip()
    message_text = (data.get('message') or '').strip()

    if not message_text:
        return JsonResponse({'error': 'Xabar matni bo\'sh bo\'lishi mumkin emas'}, status=400)

    if not phone or phone == '+998':
        session_id = request.session.session_key
        if not session_id:
            request.session.save()
            session_id = request.session.session_key
        phone = f"+998 (Mehmon {session_id[-4:] if session_id else '0000'})"

    request.session['customer_phone'] = phone
    request.session['customer_name'] = name
    request.session.modified = True

    clean_phone = phone.replace(' ', '').replace('+', '').strip()
    canonical_phone = f"+{clean_phone}" if (len(clean_phone) >= 7 and 'Mehmon' not in phone) else phone
    cust = None
    if len(clean_phone) >= 7 and 'Mehmon' not in phone:
        cust = Customer.objects.filter(store=store).filter(
            Q(phone__icontains=clean_phone) | Q(phone__icontains=phone)
        ).first()
        if not cust:
            cust = Customer.objects.create(store=store, phone=canonical_phone, name=name)
        elif name and name != 'Mijoz' and cust.name in ['Mijoz', 'Покупатель', '']:
            cust.name = name
            cust.save(update_fields=['name'])

    tg_chat_id = cust.telegram_chat_id if cust and cust.telegram_chat_id else None

    chat_msg = ChatMessage.objects.create(
        store=store,
        customer_phone=canonical_phone,
        customer_name=name,
        telegram_chat_id=tg_chat_id,
        sender=ChatMessage.Senders.CUSTOMER,
        message=message_text,
        is_read=False
    )

    return JsonResponse({
        'success': True,
        'message': {
            'id': chat_msg.id,
            'sender': chat_msg.sender,
            'message': chat_msg.message,
            'time': chat_msg.created_at.strftime('%H:%M')
        }
    })


def storefront_get_chat_messages_api(request, subdomain=None):
    """Retrieve chat history between current customer and store merchant"""
    store = get_current_store(request, subdomain)
    if not store:
        return JsonResponse({'error': 'Do\'kon topilmadi'}, status=404)

    phone = (request.GET.get('phone') or request.session.get('customer_phone') or '').strip()
    if not phone:
        return JsonResponse({'messages': []})

    clean_phone = phone.replace(' ', '').replace('+', '').strip()
    if clean_phone and len(clean_phone) >= 7:
        msg_filter = Q(customer_phone__icontains=clean_phone) | Q(customer_phone=phone)
    else:
        msg_filter = Q(customer_phone=phone)

    messages = ChatMessage.objects.filter(store=store).filter(msg_filter).order_by('created_at')

    data = [
        {
            'id': m.id,
            'sender': m.sender,
            'message': m.message,
            'time': m.created_at.strftime('%H:%M')
        }
        for m in messages
    ]

    return JsonResponse({'messages': data})


