import random
import datetime
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.accounts.models import User
from apps.stores.models import Store, Branch, MerchantBalance, MerchantCard
from apps.catalog.models import Category, Product, ProductVariation, ProductImage
from apps.orders.models import (
    Order, OrderItem, PromoCode, Customer, ChatMessage,
    MarketingCampaign, MarketingBanner, StoreStaff
)
from apps.payments.models import StorePaymentSetting


class Command(BaseCommand):
    help = 'Заполняет базу данных расширенным демо-магазином "Gold Lavash" (StoreBox 100% replica)'

    def handle(self, *args, **options):
        self.stdout.write("Инициализация полной реплики StoreBox...")

        # 1. Superadmin user
        admin_user, _ = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@storebox.uz',
                'phone': '+998 90 000 00 00',
                'role': User.Roles.SUPERADMIN,
                'is_staff': True,
                'is_superuser': True
            }
        )
        admin_user.set_password('admin123')
        admin_user.save()

        # 2. Merchant user
        merchant_user, _ = User.objects.get_or_create(
            username='998901234567',
            defaults={
                'email': 'merchant@storebox.uz',
                'phone': '+998 90 123 45 67',
                'role': User.Roles.MERCHANT,
            }
        )
        merchant_user.set_password('admin123')
        merchant_user.save()

        # 3. Store "Gold Lavash"
        schedule = {
            'mon': {'open': '09:00', 'close': '23:30', 'closed': False},
            'tue': {'open': '09:00', 'close': '23:30', 'closed': False},
            'wed': {'open': '09:00', 'close': '23:30', 'closed': False},
            'thu': {'open': '09:00', 'close': '23:30', 'closed': False},
            'fri': {'open': '09:00', 'close': '23:30', 'closed': False},
            'sat': {'open': '10:00', 'close': '00:00', 'closed': False},
            'sun': {'open': '10:00', 'close': '00:00', 'closed': False},
        }

        store, _ = Store.objects.get_or_create(
            subdomain='goldlavash',
            defaults={
                'owner': merchant_user,
                'name': 'Gold Lavash & Burger',
                'business_type': Store.BusinessTypes.RESTAURANT,
                'platform_type': Store.PlatformTypes.ALL,
                'country': Store.Countries.UZ,
                'business_category': Store.BusinessCategories.FOOD,
                'description_ru': 'Сеть сочного фастфуда в Ташкенте. Настоящий хрустящий лаваш из тандыра и премиум бургеры.',
                'description_uz': 'Toshkentdagi eng mazzali lavash va burgerlar tarmog’i. Tezkor yetkazib berish!',
                'description_en': 'The crispiest lavash and juicy gourmet burgers in Tashkent. Fast delivery!',
                'about_us_ru': 'Gold Lavash — сеть быстрого питания номер 1 в Ташкенте.',
                'about_us_uz': 'Gold Lavash — Toshkentdagi 1-raqamli tezkor taomlar tarmog’i. Biz faqat yangi go’sht va tabiiy mahsulotlardan foydalanamiz.',
                'delivery_terms_ru': 'Доставка курьером осуществляется по всему Ташкенту за 30-45 минут.',
                'delivery_terms_uz': 'Toshkent shahri bo’ylab 30-45 daqiqa ichida issiq holatda yetkazib beramiz.',
                'return_terms_uz': 'Agar taom sizga ma’qul kelmasa, 30 daqiqa ichida to’liq almashtirib beramiz.',
                'primary_color': '#10B981',
                'phone': '+998 90 123 45 67',
                'instagram_username': 'goldlavash.uz',
                'telegram_channel': 'goldlavash_uz',
                'facebook': 'goldlavash.official',
                'youtube': 'goldlavash_tashkent',
                'tiktok': 'goldlavash',
                'whatsapp': '+998901234567',
                'address': 'г. Ташкент, Чиланзар-9, ул. Катартал, 28',
                'delivery_price': Decimal('20000'),
                'free_delivery_threshold': Decimal('150000'),
                'delivery_time_estimate': '30-45 мин',
                'working_hours': schedule,
                'active_languages': ['uz', 'ru', 'en'],
                'currency': 'UZS',
                'is_active': True
            }
        )

        # 4. Merchant Balance & Card
        bal, _ = MerchantBalance.objects.get_or_create(store=store)
        bal.balance = Decimal('150000')
        bal.trial_days_left = 7
        bal.save()

        MerchantCard.objects.filter(store=store).delete()
        MerchantCard.objects.create(store=store, card_number='8600 1234 5678 9988', expiry='12/28', is_main=True)

        # 5. Branches
        Branch.objects.filter(store=store).delete()
        b1 = Branch.objects.create(
            store=store,
            name='Филиал Чиланзар (Главный)',
            address='г. Ташкент, Чиланзар-9, ул. Катартал, 28',
            latitude=41.2858,
            longitude=69.2035,
            phone='+998 71 200 11 22',
            working_hours='09:00 - 23:30',
            is_main=True
        )
        b2 = Branch.objects.create(
            store=store,
            name='Филиал Центр (Сквер Амира Темура)',
            address='г. Ташкент, проспект Амира Темура, 12',
            latitude=41.3111,
            longitude=69.2797,
            phone='+998 71 200 33 44',
            working_hours='09:00 - 00:00',
            is_main=False
        )

        # 6. Payment Settings
        pay_setting, _ = StorePaymentSetting.objects.get_or_create(store=store)
        pay_setting.click_enabled = True
        pay_setting.payme_enabled = True
        pay_setting.uzum_enabled = True
        pay_setting.cash_on_delivery_enabled = True
        pay_setting.terminal_on_delivery_enabled = True
        pay_setting.save()

        # 7. Categories
        Category.objects.filter(store=store).delete()
        cat_lavash = Category.objects.create(store=store, name_ru='Лаваши', name_uz='Lavashlar', name_en='Lavash Wraps', slug='lavash', icon='utensils', sort_order=1)
        cat_burgers = Category.objects.create(store=store, name_ru='Бургеры', name_uz='Burgerlar', name_en='Burgers', slug='burgers', icon='sandwich', sort_order=2)
        cat_combo = Category.objects.create(store=store, name_ru='Комбо сеты', name_uz='Kombo to’plamlar', name_en='Combo Sets', slug='combo', icon='sparkles', sort_order=3)
        cat_drinks = Category.objects.create(store=store, name_ru='Напитки', name_uz='Ichimliklar', name_en='Drinks', slug='drinks', icon='coffee', sort_order=4)

        # 8. Products with Warehouse Fields (Kirish narxi, Marja, IKPU)
        Product.objects.filter(store=store).delete()

        # Product 1
        p1 = Product.objects.create(
            store=store, category=cat_lavash,
            name_ru='Говяжий лаваш Classic', name_uz='Mol go’shtli klassik lavash', name_en='Classic Beef Lavash',
            slug='beef-lavash-classic',
            description_ru='Сочное мясо на углях, свежие помидоры, хрустящие огурчики и фирменный белый соус.',
            description_uz='Ko’mirda pishgan lahm go’sht, qarsildoq bodring, yangi pomidor va mayin sous.',
            description_en='Charcoal grilled tender beef, fresh tomatoes, crunchy pickles and house garlic sauce.',
            price=Decimal('36000'), old_price=Decimal('42000'), cost_price=Decimal('22000'), margin=Decimal('63.6'),
            ikpu_code='01101001001000000', package_code='796', unit=Product.Units.DONA,
            rating=Decimal('4.9'), reviews_count=48, stock=50, track_stock=True, is_featured=True
        )

        # Product 2
        p2 = Product.objects.create(
            store=store, category=cat_burgers,
            name_ru='Двойной Смэш Чизбургер', name_uz='Ikki qavatli chizburger', name_en='Double Smash Cheeseburger',
            slug='double-smash-burger',
            description_ru='Две сочные котлеты из 100% мраморной говядины, сыр Чеддер и карамелизованный лук.',
            description_uz='Ikki qavat marmar mol go’shti kotleti, erigan Chedder pishlog’i va shirin piyoz.',
            description_en='Two crispy smashed beef patties, melted double cheddar and caramelized onions.',
            price=Decimal('48000'), old_price=Decimal('55000'), cost_price=Decimal('28000'), margin=Decimal('71.4'),
            ikpu_code='01101001001000000', package_code='796', unit=Product.Units.DONA,
            rating=Decimal('5.0'), reviews_count=32, stock=40, track_stock=True, is_featured=True
        )

        # Product 3
        p3 = Product.objects.create(
            store=store, category=cat_combo,
            name_ru='Голд Комбо Сет #1', name_uz='Gold Kombo Toplam #1', name_en='Gold Combo Meal #1',
            slug='gold-combo-1',
            description_ru='Большой говяжий лаваш с сыром + золотистый картофель фри + Coca-Cola 0.5L.',
            description_uz='Katta pishloqli lavash + qarsildoq fri kartoshkasi + Coca-Cola 0.5L.',
            description_en='Large cheese beef lavash + golden crispy french fries + Coca-Cola 0.5L.',
            price=Decimal('59000'), old_price=Decimal('72000'), cost_price=Decimal('35000'), margin=Decimal('68.5'),
            ikpu_code='01101001001000000', package_code='796', unit=Product.Units.PORTSIYA,
            rating=Decimal('4.8'), reviews_count=19, stock=35, track_stock=True, is_featured=True
        )

        # 9. Customers CRM & Bonuses
        Customer.objects.filter(store=store).delete()
        Customer.objects.create(store=store, name='Ozodbek', phone='+998953580709', bonus_balance=25000, total_spent=Decimal('450000'), orders_count=5, last_order_at=timezone.now())
        Customer.objects.create(store=store, name='Алишер Усманов', phone='+998 90 987 65 43', bonus_balance=15000, total_spent=Decimal('340000'), orders_count=4, last_order_at=timezone.now() - timezone.timedelta(days=1))

        # 10. Chat Messages
        ChatMessage.objects.filter(store=store).delete()
        ChatMessage.objects.create(store=store, customer_phone='+998953580709', customer_name='Ozodbek', sender=ChatMessage.Senders.CUSTOMER, message='Salom, yetkazib berish qancha vaqt oladi?')
        ChatMessage.objects.create(store=store, customer_phone='+998953580709', customer_name='Ozodbek', sender=ChatMessage.Senders.MERCHANT, message='Assalomu alaykum! Buyurtmangiz 35 daqiqa ichida issiq holda yetkaziladi.')

        # 11. Banners
        MarketingBanner.objects.filter(store=store).delete()
        MarketingBanner.objects.create(
            store=store,
            title='Bepul yetkazib berish 150 000 UZS dan',
            subtitle="Issiq taomlar 35 daqiqada to'g'ridan-to'g'ri eshigingizgacha",
            link='/',
            is_active=True
        )

        # 12. Promo Codes
        PromoCode.objects.filter(store=store).delete()
        PromoCode.objects.create(store=store, code='ROBO10', discount_type=PromoCode.DiscountTypes.PERCENT, discount_value=Decimal('10'), min_order_amount=Decimal('50000'))

        self.stdout.write(self.style.SUCCESS("🎉 StoreBox 100% to'liq platformasi muvaffaqiyatli yangilandi!"))
