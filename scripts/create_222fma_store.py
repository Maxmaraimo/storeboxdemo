import os
import sys
import django

sys.path.insert(0, '/Users/ozodbekmahmarayimov/Desktop/cd/storeboxdemo')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'storebox.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.stores.models import Store, Branch
from apps.catalog.models import Category, Product, ProductImage, ProductVariation
from apps.orders.models import MarketingBanner, StoreStaff
from apps.payments.models import StorePaymentSetting

User = get_user_model()
u = User.objects.get(id=1)
print(f"Creating 4th store for user: {u.username} ({u.email})")

store, created = Store.objects.get_or_create(
    subdomain='222-fma',
    defaults={
        'owner': u,
        'name': '222 FMA',
        'business_type': 'CLOTHES',
        'business_category': 'fashion',
        'theme_template': 'streetwear',
        'primary_color': '#C8FF6A',
        'theme_bg_color': '#0C0D0B',
        'theme_card_style': 'minimal',
        'theme_card_radius': '2xl',
        'theme_image_aspect': 'portrait',
        'theme_button_style': 'solid',
        'phone': '+998 (90) 222-00-22',
        'address': "Toshkent sh., Chilonzor tumani, Muqimiy ko'chasi 20A",
        'instagram_username': '222_fma',
        'telegram_channel': 'fma222_official',
        'description_uz': "222 FMA — Toshkentdagi premium ko'cha kiyimlari brendi. Og'ir vaznli tabiiy paxta, qulay bichim va zamonaviy obrazlar.",
        'description_ru': "222 FMA — премиальный бренд уличной одежды в Ташкенте. Тяжелый хлопок, оверсайз крой и готовые стильные капсулы.",
        'working_hours': '10:00 — 23:00',
        'delivery_price': 25000,
        'free_delivery_threshold': 500000,
        'is_active': True,
    }
)

store.owner = u
store.name = '222 FMA'
store.business_type = 'CLOTHES'
store.business_category = 'fashion'
store.theme_template = 'streetwear'
store.primary_color = '#C8FF6A'
store.theme_bg_color = '#0C0D0B'
store.theme_card_style = 'minimal'
store.theme_card_radius = '2xl'
store.theme_image_aspect = 'portrait'
store.theme_button_style = 'solid'
store.phone = '+998 (90) 222-00-22'
store.address = "Toshkent sh., Chilonzor tumani, Muqimiy ko'chasi 20A"
store.instagram_username = '222_fma'
store.telegram_channel = 'fma222_official'
store.description_uz = "222 FMA — Toshkentdagi premium ko'cha kiyimlari brendi. Og'ir vaznli tabiiy paxta, qulay bichim va zamonaviy obrazlar."
store.description_ru = "222 FMA — премиальный бренд уличной одежды в Ташкенте. Тяжелый хлопок, оверсайз крой и готовые стильные капсулы."
store.working_hours = '10:00 — 23:00'
store.delivery_price = 25000
store.free_delivery_threshold = 500000
store.is_active = True

# Attach logo and banner
logo_path = 'media/stores/222fma/logo.svg'
if os.path.exists(logo_path):
    store.logo.name = 'stores/222fma/logo.svg'

banner_path = 'media/stores/222fma/hero_banner.jpg'
if os.path.exists(banner_path):
    store.banner.name = 'stores/222fma/hero_banner.jpg'

store.save()
print(f"Store saved: ID={store.id}, name={store.name}, subdomain={store.subdomain}, template={store.theme_template}")

# Branch
branch, _ = Branch.objects.get_or_create(
    store=store,
    name="Chilonzor Flagship",
    defaults={
        'address': "Toshkent sh., Chilonzor tumani, Muqimiy ko'chasi 20A",
        'phone': '+998 (90) 222-00-22',
        'is_main': True,
        'is_active': True,
    }
)

# Payment Settings
StorePaymentSetting.objects.get_or_create(
    store=store,
    defaults={
        'cash_on_delivery_enabled': True,
        'terminal_on_delivery_enabled': True,
        'click_enabled': True,
        'payme_enabled': True,
    }
)

# StoreStaff
StoreStaff.objects.get_or_create(
    store=store,
    user=u,
    defaults={
        'name': u.get_full_name() or u.username,
        'phone': getattr(u, 'phone', ''),
        'role': 'ADMIN',
        'is_active': True
    }
)

# Categories
cat_tops, _ = Category.objects.get_or_create(
    store=store, slug='tops',
    defaults={
        'name_uz': 'Yuqori qism',
        'name_ru': 'Верх',
        'name_en': 'Tops',
        'icon': 'shirt',
        'sort_order': 1,
        'is_active': True
    }
)
cat_tops.name_ru = 'Верх'
cat_tops.name_uz = 'Yuqori qism'
cat_tops.save()

cat_bottoms, _ = Category.objects.get_or_create(
    store=store, slug='bottoms',
    defaults={
        'name_uz': 'Shimlar',
        'name_ru': 'Брюки',
        'name_en': 'Bottoms',
        'icon': 'scissors',
        'sort_order': 2,
        'is_active': True
    }
)
cat_bottoms.name_ru = 'Брюки'
cat_bottoms.name_uz = 'Shimlar'
cat_bottoms.save()

cat_outer, _ = Category.objects.get_or_create(
    store=store, slug='outerwear',
    defaults={
        'name_uz': 'Ustki kiyimlar',
        'name_ru': 'Верхняя одежда',
        'name_en': 'Outerwear',
        'icon': 'shield',
        'sort_order': 3,
        'is_active': True
    }
)
cat_outer.name_ru = 'Верхняя одежда'
cat_outer.name_uz = 'Ustki kiyimlar'
cat_outer.save()

cat_shoes, _ = Category.objects.get_or_create(
    store=store, slug='shoes',
    defaults={
        'name_uz': 'Poyabzallar',
        'name_ru': 'Обувь',
        'name_en': 'Footwear',
        'icon': 'footprints',
        'sort_order': 4,
        'is_active': True
    }
)
cat_shoes.name_ru = 'Обувь'
cat_shoes.name_uz = 'Poyabzallar'
cat_shoes.save()

# Marketing Banner
MarketingBanner.objects.filter(store=store).delete()
MarketingBanner.objects.create(
    store=store,
    title="222 FMA • NEW DROP",
    subtitle="Eksklyuziv ko'cha kiyimlari va interaktiv obrazlar konstruktori",
    image='stores/222fma/hero_banner.jpg',
    image_url='/media/stores/222fma/hero_banner.jpg',
    link='#outfit-builder',
    is_active=True,
    sort_order=1
)

# Product list definition
products_data = [
    {
        'category': cat_tops,
        'slug': 'hoodie-222-darkness',
        'name_ru': 'Oversized Hoodie "222 Darkness" 460GSM',
        'name_uz': 'Oversized Xudi "222 Darkness" 460GSM',
        'name_en': 'Oversized Hoodie "222 Darkness" 460GSM',
        'desc_ru': 'Тяжелый премиальный хлопок плотностью 460 г/м². Глубокий анатомический капюшон, спущенная линия плеч, фактурная вышивка 222 на рукаве и спине. Идеальная посадка оверсайз.',
        'desc_uz': "460 g/m² zichlikdagi og'ir premium paxta. Chuqur kapyushon, tushirilgan yelka chizig'i, yeng va orqa qismida bo'rtma 222 kashtasi. Qulay va zamonaviy erkin bichim.",
        'price': 680000,
        'old_price': 790000,
        'img': 'products/222fma/hoodie_black.jpg',
        'sizes': ['S', 'M', 'L', 'XL'],
        'barcode': '222-HD-001',
        'is_featured': True,
    },
    {
        'category': cat_bottoms,
        'slug': 'cargo-utility-black',
        'name_ru': 'Tactical Cargo Pants "222 Utility Black"',
        'name_uz': 'Taktik Kargo Shimlari "222 Utility Black"',
        'name_en': 'Tactical Cargo Pants "222 Utility Black"',
        'desc_ru': 'Объемные карго из плотного влагостойкого твила. 8 эргономичных карманов, утяжки на щиколотках, премиальная японская фурнитура YKK. Свободный уличный крой.',
        'desc_uz': "Zich va namlikka chidamli tvil matodan tikilgan keng kargo shimlar. 8 ta qulay cho'ntak, pastki qismida bog'ichlar, YKK yapon furniturasi. Erkin stritver bichimi.",
        'price': 620000,
        'old_price': 720000,
        'img': 'products/222fma/cargo_pants.jpg',
        'sizes': ['S', 'M', 'L', 'XL'],
        'barcode': '222-CR-002',
        'is_featured': True,
    },
    {
        'category': cat_shoes,
        'slug': 'sneaker-neo-tashkent-v2',
        'name_ru': 'Chunky Sneaker "Neo-Tashkent V2"',
        'name_uz': 'Massiv Krossovka "Neo-Tashkent V2"',
        'name_en': 'Chunky Sneaker "Neo-Tashkent V2"',
        'desc_ru': 'Футуристичные массивные кроссовки на скульптурной многослойной подошве. Натуральная замша, дышащий неопрен, анатомическая амортизация EVA. Неоновые акценты.',
        'desc_uz': "Ko'p qatlamli skulptur taglikdagi zamonaviy massiv krossovkalar. Tabiiy zamsh, nafas oluvchi neopren, anatomik EVA amortizatsiyasi. Neon aksentlar.",
        'price': 1150000,
        'old_price': 1350000,
        'img': 'products/222fma/sneakers_chunky.jpg',
        'sizes': ['40', '41', '42', '43', '44'],
        'barcode': '222-SN-003',
        'is_featured': True,
    },
    {
        'category': cat_outer,
        'slug': 'bomber-matrix-satin',
        'name_ru': 'Cropped Bomber Jacket "Matrix Satin"',
        'name_uz': 'Kalta Bomber Kurtkasi "Matrix Satin"',
        'name_en': 'Cropped Bomber Jacket "Matrix Satin"',
        'desc_ru': 'Укороченный оверсайз бомбер из шелковистого матового нейлона. Плотный утеплитель 150г, массивная серебряная молния, контрастный сигнальный подклад.',
        'desc_uz': "Ipaksimon mat neylondan tikilgan kalta o'lchamli bomber. 150g zich izolyatsiya, massiv kumushrang zamok, kontrast signal astar.",
        'price': 950000,
        'old_price': 1100000,
        'img': 'products/222fma/bomber_jacket.jpg',
        'sizes': ['S', 'M', 'L', 'XL'],
        'barcode': '222-BM-004',
        'is_featured': True,
    },
    {
        'category': cat_tops,
        'slug': 'tshirt-mannopov-heritage',
        'name_ru': 'Acid-Wash Tee "Mannopov 222 Heritage"',
        'name_uz': 'Vintaj Futbolka "Mannopov 222 Heritage"',
        'name_en': 'Acid-Wash Tee "Mannopov 222 Heritage"',
        'desc_ru': 'Винтажная кислотная варка, плотный хлопок 280 г/м². Свободный силуэт, необработанные швы, концептуальный принт 222 FMA. Посвящено Farhod Mannopov.',
        'desc_uz': "Vintaj kislotali ishlov, 280 g/m² zich paxta. Erkin siluet, xom choklar, konseptual 222 FMA printi. Farhod Mannopov xotirasiga bag'ishlanadi.",
        'price': 420000,
        'old_price': 490000,
        'img': 'products/222fma/tshirt_acid.jpg',
        'sizes': ['S', 'M', 'L', 'XL'],
        'barcode': '222-TS-005',
        'is_featured': True,
    },
    {
        'category': cat_bottoms,
        'slug': 'denim-smoky-wash',
        'name_ru': 'Wide-Leg Relaxed Denim "Smoky Wash"',
        'name_uz': 'Keng Djinsi Shimlari "Smoky Wash"',
        'name_en': 'Wide-Leg Relaxed Denim "Smoky Wash"',
        'desc_ru': 'Прямые широкие джинсы из плотного 14oz хлопкового денима. Мягкая винтажная стирка, аутентичный дымчато-серый оттенок, комфортная глубокая посадка.',
        'desc_uz': "14oz zich paxta denim matosidan tikilgan to'g'ri keng jinsilar. Yumshoq vintaj yuvish effekti, tutunsimon kulrang rang, qulay chuqur bichim.",
        'price': 650000,
        'old_price': 750000,
        'img': 'products/222fma/wide_denim.jpg',
        'sizes': ['30', '31', '32', '33', '34'],
        'barcode': '222-DN-006',
        'is_featured': False,
    },
    {
        'category': cat_shoes,
        'slug': 'loafers-midnight-black',
        'name_ru': 'Chunky Calfskin Loafers "Midnight Black"',
        'name_uz': 'Traktor Taglikli Lofer "Midnight Black"',
        'name_en': 'Chunky Calfskin Loafers "Midnight Black"',
        'desc_ru': 'Премиальные уличные лоферы на тракторной подошве. Натуральная телячья кожа, прошитый рант, металлическая монограмма 222. Сочетание строгой классики и стритвира.',
        'desc_uz': "Traktor taglikdagi premium shahar loferlari. Tabiiy buzoq terisi, tikilgan qirra, 222 metall monogrammasi. Klassika va stritver uyg'unligi.",
        'price': 1050000,
        'old_price': 1200000,
        'img': 'products/222fma/loafers_leather.jpg',
        'sizes': ['40', '41', '42', '43', '44'],
        'barcode': '222-LF-007',
        'is_featured': False,
    },
]

print("Populating products...")
for p_data in products_data:
    prod, p_created = Product.objects.get_or_create(
        store=store,
        slug=p_data['slug'],
        defaults={
            'category': p_data['category'],
            'name_ru': p_data['name_ru'],
            'name_uz': p_data['name_uz'],
            'name_en': p_data['name_en'],
            'description_ru': p_data['desc_ru'],
            'description_uz': p_data['desc_uz'],
            'description_en': p_data['desc_ru'],
            'price': p_data['price'],
            'old_price': p_data['old_price'],
            'cost_price': p_data['price'] * 0.4,
            'barcode': p_data['barcode'],
            'stock': 45,
            'is_active': True,
            'is_featured': p_data.get('is_featured', False),
            'rating': 5.0,
            'reviews_count': 18,
        }
    )
    prod.category = p_data['category']
    prod.name_ru = p_data['name_ru']
    prod.name_uz = p_data['name_uz']
    prod.name_en = p_data['name_en']
    prod.description_ru = p_data['desc_ru']
    prod.description_uz = p_data['desc_uz']
    prod.price = p_data['price']
    prod.old_price = p_data['old_price']
    prod.is_active = True
    prod.stock = 45
    prod.save()

    # Image
    ProductImage.objects.filter(product=prod).delete()
    ProductImage.objects.create(
        product=prod,
        image=p_data['img'],
        is_primary=True,
        sort_order=0
    )

    # Size Variations
    ProductVariation.objects.filter(product=prod).delete()
    for idx, s in enumerate(p_data['sizes']):
        ProductVariation.objects.create(
            product=prod,
            name_uz=s,
            name_ru=s,
            name_en=s,
            price=prod.price,
            stock=12,
            is_active=True,
            sort_order=idx
        )
    print(f"  + Product '{prod.name_ru}' saved with {len(p_data['sizes'])} size variations.")

print("\n--- Summary ---")
print(f"Store: {store.name} (Subdomain: {store.subdomain})")
print(f"Products count: {store.products.count()}")
print(f"Owner stores count: {u.stores.count()}")
print("Done!")
