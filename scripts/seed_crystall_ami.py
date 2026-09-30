import os
from decimal import Decimal
from django.utils.text import slugify
from apps.stores.models import Store
from apps.payments.models import StorePaymentSetting
from apps.catalog.models import Category, Product, ProductImage, ProductVariation, ConstructorGroup, ConstructorItem
from apps.orders.models import MarketingBanner

def seed():
    store = Store.objects.get(subdomain='crystall-ami')
    print(f"Seeding Crystall Ami boutique store: {store.name} (ID: {store.id})")

    # 1. Update store settings
    store.theme_template = 'boutique'
    store.primary_color = '#D946EF'
    store.theme_card_style = 'minimal'
    store.theme_card_radius = '2xl'
    store.theme_image_aspect = 'portrait'
    store.banner = 'stores/banners/crystall_banner_1.jpg'
    store.save()

    # 2. Marketing Banners (multi-banner luxury carousel)
    MarketingBanner.objects.filter(store=store).delete()
    banners_data = [
        {
            'title': 'Yangi To\'plam 2026',
            'subtitle': 'Crystall Ami — Samarqand, Makon Mall. Eksklyuziv oqshom liboslari va parfyumeriya.',
            'image': 'stores/banners/crystall_banner_1.jpg',
            'image_url': '/media/stores/banners/crystall_banner_1.jpg',
            'link': '?cat=oqshom-liboslari',
            'sort_order': 1
        },
        {
            'title': 'Luxe Box & Selektiv Parfyumeriya',
            'subtitle': 'Sevimli insoningiz uchun hashamatli sovg\'a to\'plamlari va xushbo\'y iforlar.',
            'image': 'stores/banners/crystall_banner_2.jpg',
            'image_url': '/media/stores/banners/crystall_banner_2.jpg',
            'link': '?cat=sovga-bokslari',
            'sort_order': 2
        },
        {
            'title': 'Couture Oqshom Liboslari',
            'subtitle': 'Yorqin va unutilmas lahzalar uchun hashamatli liboslar kolleksiyasi.',
            'image': 'stores/banners/crystall_banner_3.jpg',
            'image_url': '/media/stores/banners/crystall_banner_3.jpg',
            'link': '?cat=oqshom-liboslari',
            'sort_order': 3
        }
    ]
    for b_data in banners_data:
        MarketingBanner.objects.create(
            store=store,
            title=b_data['title'],
            subtitle=b_data['subtitle'],
            image=b_data['image'],
            image_url=b_data['image_url'],
            link=b_data['link'],
            is_active=True,
            sort_order=b_data['sort_order']
        )
    print(f"Created {len(banners_data)} luxury marketing banners.")

    # 3. Categories setup
    cats_data = [
        {
            'name_uz': "Oqshom liboslari",
            'name_ru': "Вечерние платья & Образы",
            'slug': "oqshom-liboslari",
            'icon': 'sparkles',
            'primary_image_url': '/media/products/crystall_dress_red_hd.jpg',
            'sort_order': 1
        },
        {
            'name_uz': "Kostyumlar & Kundalik kiyimlar",
            'name_ru': "Костюмы & Повседневная одежда",
            'slug': "kostyumlar",
            'icon': 'shirt',
            'primary_image_url': '/media/products/crystall_suit_white_hd.jpg',
            'sort_order': 2
        },
        {
            'name_uz': "Selektiv parfyumeriya",
            'name_ru': "Селективная парфюмерия",
            'slug': "selektiv-parfyumeriya",
            'icon': 'flame',
            'primary_image_url': '/media/products/crystall_perfume_ganymede_hd.jpg',
            'sort_order': 3
        },
        {
            'name_uz': "Sovg'a bokslari & To'plamlar",
            'name_ru': "Подарочные Luxe-боксы",
            'slug': "sovga-bokslari",
            'icon': 'gift',
            'primary_image_url': '/media/products/crystall_box_dior_hd.jpg',
            'sort_order': 4
        },
        {
            'name_uz': "Sumkalar & Aksessuarlar",
            'name_ru': "Сумки & Аксессуары",
            'slug': "sumkalar-aksessuarlar",
            'icon': 'shopping-bag',
            'primary_image_url': '/media/products/crystall_box_builder_hd.jpg',
            'sort_order': 5
        }
    ]

    categories = {}
    for c_data in cats_data:
        cat, _ = Category.objects.update_or_create(
            store=store,
            slug=c_data['slug'],
            defaults={
                'name_uz': c_data['name_uz'],
                'name_ru': c_data['name_ru'],
                'icon': c_data['icon'],
                'image_url': c_data.get('primary_image_url', ''),
                'sort_order': c_data['sort_order'],
                'is_active': True
            }
        )
        categories[c_data['slug']] = cat

    # 4. Products list
    products_data = [
        # --- 1. Oqshom liboslari ---
        {
            'category_slug': 'oqshom-liboslari',
            'slug': 'qizil-oqshom-koylagi-get-ready',
            'name_uz': "Qizil oqshom ko'ylagi \"Get Ready With Me\"",
            'name_ru': "Красное вечернее платье с открытыми плечами",
            'description_uz': "Crystall Ami kolleksiyasidan nafis qizil oqshom libosi. Yelkasi ochiq, qomatga mukammal o'tiruvchi qirqim. Tantanali oqshomlar, to'y va fotosessiyalar uchun eng sara tanlov. Premium mato.",
            'description_ru': "Роскошное красное вечернее платье с открытыми плечами из коллекции Crystall Ami. Идеальная посадка по фигуре, подчеркивающая силуэт. Прекрасный выбор для торжеств и особых вечеров.",
            'price': Decimal('850000'),
            'old_price': Decimal('1050000'),
            'cost_price': Decimal('500000'),
            'image_rel': 'products/crystall_dress_red_hd.jpg',
            'is_featured': True,
            'stock': 15,
            'variations': [
                {'name_uz': 'S (42-44)', 'name_ru': 'S (42-44)', 'price': Decimal('850000'), 'stock': 5},
                {'name_uz': 'M (44-46)', 'name_ru': 'M (44-46)', 'price': Decimal('850000'), 'stock': 6},
                {'name_uz': 'L (46-48)', 'name_ru': 'L (46-48)', 'price': Decimal('850000'), 'stock': 4},
            ]
        },
        {
            'category_slug': 'oqshom-liboslari',
            'slug': 'qora-oqshom-koylagi-ah-glamour',
            'name_uz': "Qora oqshom ko'ylagi \"A&H Glamour\"",
            'name_ru': "Вечернее платье макси со стразами \"A&H Glamour\"",
            'description_uz': "Hashamatli qora oqshom libosi. Yaltiroq toshlar bilan nozik bezatilgan. Qomatni nozik ko'rsatuvchi siluet va beg'ubor tikuv sifati.",
            'description_ru': "Элегантное черное вечернее платье макси с мерцающими стразами. Премиальный пошив и эксклюзивный дизайн для незабываемых вечерних выходов.",
            'price': Decimal('1200000'),
            'old_price': Decimal('1450000'),
            'cost_price': Decimal('700000'),
            'image_rel': 'products/crystall_evening_black_hd.jpg',
            'is_featured': True,
            'stock': 10,
            'variations': [
                {'name_uz': 'S (42-44)', 'name_ru': 'S (42-44)', 'price': Decimal('1200000'), 'stock': 3},
                {'name_uz': 'M (44-46)', 'name_ru': 'M (44-46)', 'price': Decimal('1200000'), 'stock': 4},
                {'name_uz': 'L (46-48)', 'name_ru': 'L (46-48)', 'price': Decimal('1200000'), 'stock': 3},
            ]
        },
        {
            'category_slug': 'oqshom-liboslari',
            'slug': 'oq-yoqali-retro-koylak',
            'name_uz': "Klassik oq yoqali retro ko'ylak",
            'name_ru': "Винтажное платье в горошек с белым воротником",
            'description_uz': "Fransuzcha nafis uslubdagi polka-dot libos. Qavariq yenglari va o'yilgan oq yoqasi bilan bejirim ko'rinish beradi.",
            'description_ru': "Французский винтажный стиль: элегантное платье в мелкий горошек с фигурным белым воротником, акцентными пуговицами и поясом.",
            'price': Decimal('690000'),
            'old_price': Decimal('780000'),
            'cost_price': Decimal('400000'),
            'image_rel': 'products/crystall_vintage_dress_hd.jpg',
            'is_featured': True,
            'stock': 12,
            'variations': [
                {'name_uz': 'S (42-44)', 'name_ru': 'S (42-44)', 'price': Decimal('690000'), 'stock': 6},
                {'name_uz': 'M (44-46)', 'name_ru': 'M (44-46)', 'price': Decimal('690000'), 'stock': 6},
            ]
        },
        {
            'category_slug': 'oqshom-liboslari',
            'slug': 'zumrad-atlas-oqshom-koylagi',
            'name_uz': "Zumrad rangli atlas oqshom ko'ylagi",
            'name_ru': "Изумрудное атласное вечернее платье с корсетом",
            'description_uz': "Chuqur zumrad tusli hashamatli atlas oqshom ko'ylagi. Korset qirqimi, kristalli yelka tasmalari va jozibador kesimi bilan oqshomning eng yorqin yulduzi bo'ling.",
            'description_ru': "Роскошное вечернее платье из благородного изумрудного атласа с акцентным корсетным лифом, кристальными бретелями и элегантным разрезом.",
            'price': Decimal('1100000'),
            'old_price': Decimal('1350000'),
            'cost_price': Decimal('620000'),
            'image_rel': 'products/crystall_dress_emerald_hd.jpg',
            'is_featured': True,
            'stock': 8,
            'variations': [
                {'name_uz': 'S', 'name_ru': 'S', 'price': Decimal('1100000'), 'stock': 3},
                {'name_uz': 'M', 'name_ru': 'M', 'price': Decimal('1100000'), 'stock': 3},
                {'name_uz': 'L', 'name_ru': 'L', 'price': Decimal('1100000'), 'stock': 2},
            ]
        },
        {
            'category_slug': 'oqshom-liboslari',
            'slug': 'leopard-naqshli-ipak-koylak',
            'name_uz': "Leopard naqshli ipak midi ko'ylak",
            'name_ru': "Шелковое платье-миди с леопардовым принтом",
            'description_uz': "Trenddagi leopard naqshli, engil va nozik ipak matodan tayyorlangan midi ko'ylak. Kundalik va tantanali uchrashuvlar uchun mukammal.",
            'description_ru': "Трендовое шелковое платье-миди с выразительным леопардовым принтом. Легкая струящаяся ткань и комфортный крой.",
            'price': Decimal('720000'),
            'old_price': Decimal('850000'),
            'cost_price': Decimal('420000'),
            'image_rel': 'products/crystall_leopard_dress.jpg',
            'is_featured': False,
            'stock': 14,
            'variations': [
                {'name_uz': 'S', 'name_ru': 'S', 'price': Decimal('720000'), 'stock': 5},
                {'name_uz': 'M', 'name_ru': 'M', 'price': Decimal('720000'), 'stock': 5},
                {'name_uz': 'L', 'name_ru': 'L', 'price': Decimal('720000'), 'stock': 4},
            ]
        },
        {
            'category_slug': 'oqshom-liboslari',
            'slug': 'shampan-ipak-ochiq-orqa-koylak',
            'name_uz': "Shampan rangli ipak oqshom ko'ylagi",
            'name_ru': "Атласное вечернее платье с открытой спиной «Champagne»",
            'description_uz': "Nozik shampan tusidagi ipak oqshom libosi. Ochiq orqa dizayni va oqib turuvchi mato sizga tengsiz go'zallik bag'ishlaydi.",
            'description_ru': "Струящееся платье оттенка шампань из премиального шелкового сатина с изящно открытой спиной. Воплощение нежности и элегантности.",
            'price': Decimal('890000'),
            'old_price': Decimal('1080000'),
            'cost_price': Decimal('480000'),
            'image_rel': 'products/crystall_dress_red_hd.jpg',
            'is_featured': False,
            'stock': 7,
            'variations': [
                {'name_uz': 'S', 'name_ru': 'S', 'price': Decimal('890000'), 'stock': 4},
                {'name_uz': 'M', 'name_ru': 'M', 'price': Decimal('890000'), 'stock': 3},
            ]
        },

        # --- 2. Kostyumlar & Kundalik kiyimlar ---
        {
            'category_slug': 'kostyumlar',
            'slug': 'ayollar-oq-shik-kostyumi',
            'name_uz': "Ayollar oq klassik kostyum-shimi (Jaket + Shim)",
            'name_ru': "Женский элегантный костюм-двойка (жакет + брюки)",
            'description_uz': "Klassik ikki qismli ayollar kostyumi. Oq rangli, marvarid tugmali jaket va qomatni baland ko'rsatuvchi to'g'ri bichimdagi shimlar.",
            'description_ru': "Безупречный белый брючный костюм-двойка. Приталенный жакет с акцентными пуговицами и прямые брюки с идеальной посадкой.",
            'price': Decimal('950000'),
            'old_price': Decimal('1150000'),
            'cost_price': Decimal('550000'),
            'image_rel': 'products/crystall_suit_white_hd.jpg',
            'is_featured': True,
            'stock': 12,
            'variations': [
                {'name_uz': 'S (42)', 'name_ru': 'S (42)', 'price': Decimal('950000'), 'stock': 4},
                {'name_uz': 'M (44)', 'name_ru': 'M (44)', 'price': Decimal('950000'), 'stock': 5},
                {'name_uz': 'L (46)', 'name_ru': 'L (46)', 'price': Decimal('950000'), 'stock': 3},
            ]
        },
        {
            'category_slug': 'kostyumlar',
            'slug': 'fransuz-tvid-kostyumi',
            'name_uz': "Fransuz tvid kostyumi (Jaket + Yubka)",
            'name_ru': "Французский твидовый костюм (жакет + юбка)",
            'description_uz': "Chanel uslubidagi hashamatli sut-pushti rangli tvid to'plami. Tillarang iplar va nafis tugmalar bilan boyitilgan premium qiyofa.",
            'description_ru': "Утонченный костюм в стиле парижского шика из плотного фактурного твида с золотыми пуговицами. Укороченный жакет и элегантная мини-юбка.",
            'price': Decimal('980000'),
            'old_price': Decimal('1200000'),
            'cost_price': Decimal('560000'),
            'image_rel': 'products/crystall_vintage_dress_hd.jpg',
            'is_featured': True,
            'stock': 9,
            'variations': [
                {'name_uz': 'S (42)', 'name_ru': 'S (42)', 'price': Decimal('980000'), 'stock': 5},
                {'name_uz': 'M (44)', 'name_ru': 'M (44)', 'price': Decimal('980000'), 'stock': 4},
            ]
        },

        # --- 3. Selektiv parfyumeriya ---
        {
            'category_slug': 'selektiv-parfyumeriya',
            'slug': 'marc-antoine-barrois-ganymede',
            'name_uz': "Marc-Antoine Barrois Ganymede (100 ml)",
            'name_ru': "Marc-Antoine Barrois Ganymede",
            'description_uz': "Kosmik mineral va zamonaviy charmli nish ifor. O'zgacha joziba, uzoq davom etuvchi poezd va qimmatbaho kompozitsiya.",
            'description_ru': "Один из самых востребованных селективных ароматов: минеральные аккорды, замша, бессмертник и мандарин. Невероятный шлейф и стойкость.",
            'price': Decimal('490000'),
            'old_price': Decimal('600000'),
            'cost_price': Decimal('300000'),
            'image_rel': 'products/crystall_perfume_ganymede_hd.jpg',
            'is_featured': True,
            'stock': 20,
        },
        {
            'category_slug': 'selektiv-parfyumeriya',
            'slug': 'kilian-angels-share',
            'name_uz': "Kilian Angels' Share (50 ml)",
            'name_ru': "Kilian Angels' Share",
            'description_uz': "Konyak bochkalari, dolchin, vanil va eman daraxti notalari mujassamlashgan afsonaviy nish atir. Haqiqiy aristokratik hashamat.",
            'description_ru': "Коньячный аккорд, дубовые бочки, корица, бобы тонка и пралине. Роскошный хрустальный флакон в форме бокала для коньяка.",
            'price': Decimal('590000'),
            'old_price': Decimal('720000'),
            'cost_price': Decimal('360000'),
            'image_rel': 'products/crystall_perfume_angels_hd.jpg',
            'is_featured': True,
            'stock': 15,
        },
        {
            'category_slug': 'selektiv-parfyumeriya',
            'slug': 'clive-christian-luxe',
            'name_uz': "Clive Christian Luxe (Original)",
            'name_ru': "Clive Christian Luxe (Original)",
            'description_uz': "Qirollik darajasidagi xushbo'y ifor. Qimmatbaho toshlar va elita ingredientlari asosida yaratilgan eng nufuzli atir.",
            'description_ru': "Британская корона в мире селективной парфюмерии. Статусный, глубокий и стойкий шлейфовый аромат абсолютной роскоши.",
            'price': Decimal('730000'),
            'old_price': Decimal('890000'),
            'cost_price': Decimal('450000'),
            'image_rel': 'products/tg_crystal_prod_1.jpg',
            'is_featured': True,
            'stock': 8,
        },
        {
            'category_slug': 'selektiv-parfyumeriya',
            'slug': 'vilhelm-parfumerie-niche',
            'name_uz': "Vilhelm Parfumerie (Niche)",
            'name_ru': "Vilhelm Parfumerie (Niche)",
            'description_uz': "Nyu-York va Parij ruhiyatini birlashtirgan nish parfyum uyi. Mango Skin, Room Service va boshqa mashhur kompozitsiyalar.",
            'description_ru': "Нишевый бренд с ярким характером. Сочные фруктовые ноты, амбра и замша, создающие незабываемое шлейфовое облако.",
            'price': Decimal('690000'),
            'old_price': Decimal('800000'),
            'cost_price': Decimal('420000'),
            'image_rel': 'products/tg_crystal_prod_2.jpg',
            'is_featured': True,
            'stock': 12,
        },
        {
            'category_slug': 'selektiv-parfyumeriya',
            'slug': 'yves-saint-laurent-libre',
            'name_uz': "Yves Saint Laurent Libre",
            'name_ru': "Yves Saint Laurent Libre",
            'description_uz': "Fransuz lavandasi va Marokash apelsin gulining erkin va o'ziga ishongan ayollar uchun yorqin uyg'unligi.",
            'description_ru': "Культовый цветочный аромат свободы с нотами лаванды, флердоранжа и мадагаскарской ванили. Флакон с кутюрным золотым логотипом.",
            'price': Decimal('595000'),
            'old_price': Decimal('720000'),
            'cost_price': Decimal('360000'),
            'image_rel': 'products/tg_crystal_prod_4.jpg',
            'is_featured': False,
            'stock': 18,
        },
        {
            'category_slug': 'selektiv-parfyumeriya',
            'slug': 'bois-imperial-by-quentin-bisch',
            'name_uz': "Bois Impérial by Quentin Bisch",
            'name_ru': "Bois Impérial by Quentin Bisch",
            'description_uz': "Zamonaviy parfyumeriyaning eng mashhur durdonasi. Akigalawood daraxti, rayhon va vetiver notalari.",
            'description_ru': "Хит современной ниши: свежий базилик, перец тимут, ветивер и молекула акигалавуд. Сверхстойкий свеже-древесный шлейф.",
            'price': Decimal('650000'),
            'old_price': Decimal('780000'),
            'cost_price': Decimal('390000'),
            'image_rel': 'products/tg_crystal_prod_6.jpg',
            'is_featured': False,
            'stock': 16,
        },
        {
            'category_slug': 'selektiv-parfyumeriya',
            'slug': 'bvlgari-rose-goldea',
            'name_uz': "Bvlgari Rose Goldea",
            'name_ru': "Bvlgari Rose Goldea",
            'description_uz': "Damashq atirgulining xushbo'y ifori va oq mushk. Ayollik, nafosat va sevgining timsoli.",
            'description_ru': "Чувственный цветочный аромат, посвященный красоте дамасской розы и сиянию золота. Нежный, манящий и женственный.",
            'price': Decimal('550000'),
            'old_price': Decimal('670000'),
            'cost_price': Decimal('340000'),
            'image_rel': 'products/tg_crystal_prod_5.jpg',
            'is_featured': False,
            'stock': 11,
        },
        {
            'category_slug': 'selektiv-parfyumeriya',
            'slug': 'amouage-luxury-fragrance',
            'name_uz': "Amouage Luxury Fragrance",
            'name_ru': "Amouage Luxury Fragrance",
            'description_uz': "Ummon sultonligining hashamatli ifori. Qimmatbaho ladan, mirra va sharqona ziravorlar.",
            'description_ru': "Шедевр восточно-европейской ниши с благородным ладаном, редкими смолами и драгоценными цветочными маслами.",
            'price': Decimal('520000'),
            'old_price': Decimal('650000'),
            'cost_price': Decimal('320000'),
            'image_rel': 'products/tg_crystal_prod_7.jpg',
            'is_featured': False,
            'stock': 10,
        },
        {
            'category_slug': 'selektiv-parfyumeriya',
            'slug': 'miss-dior-mini-blooming-bouquet',
            'name_uz': "Miss Dior Mini: Blooming Bouquet (38 ml)",
            'name_ru': "Miss Dior Mini: Blooming Bouquet (38 мл)",
            'description_uz': "Pion va bahoriy atirgullar guldastasi. Yengil, nafis va romantik shahar qizlari uchun ajoyib format.",
            'description_ru': "Нежный букет весенних цветов: пион, дамасская роза и белый мускус в удобном компактном флаконе.",
            'price': Decimal('185000'),
            'old_price': Decimal('230000'),
            'cost_price': Decimal('100000'),
            'image_rel': 'products/tg_crystal_prod_8.jpg',
            'is_featured': False,
            'stock': 25,
        },

        # --- 4. Sovg'a bokslari & To'plamlar ---
        {
            'category_slug': 'sovga-bokslari',
            'slug': 'custom-luxe-box',
            'name_uz': "O'z Luxe Boksingizni yig'ing (Konstruktor)",
            'name_ru': "Собери свой Luxe-бокс (Конструктор подарка)",
            'description_uz': "Eksklyuziv sovg'a to'plami: hashamatli quti, selektiv parfyum, parvarish vositalari va maxsus tabriknoma.",
            'description_ru': "Создайте персональный подарочный набор: выберите премиальную коробку, селективный парфюм, уходовую косметику и открытку.",
            'price': Decimal('350000'),
            'old_price': Decimal('420000'),
            'cost_price': Decimal('200000'),
            'image_rel': 'products/crystall_box_builder_hd.jpg',
            'is_featured': True,
            'stock': 50,
            'has_constructor': True,
        },
        {
            'category_slug': 'sovga-bokslari',
            'slug': 'luxe-box-dior-backstage-sol-de-janeiro',
            'name_uz': "Luxe Box \"Dior Backstage & Sol de Janeiro\"",
            'name_ru': "Luxe Box \"Dior Backstage & Sol de Janeiro\"",
            'description_uz': "Hashamatli sovg'a savati: Dior Backstage mahsulotlari, Sol de Janeiro parfyumlangan tana spreyi, ipak lenta va qizil tasmali eksklyuziv quti.",
            'description_ru': "Роскошная подарочная корзина с культовыми бестселлерами: палетка Dior Backstage, мист Sol de Janeiro, ароматическая свеча и нежная лента.",
            'price': Decimal('890000'),
            'old_price': Decimal('1100000'),
            'cost_price': Decimal('550000'),
            'image_rel': 'products/crystall_box_dior_hd.jpg',
            'is_featured': True,
            'stock': 8,
        },
        {
            'category_slug': 'sovga-bokslari',
            'slug': 'gul-kompozitsiyasi-yurak-atirgullar',
            'name_uz': "Gul kompozitsiyasi \"Atirgulli Yurak\" (101 atirgul)",
            'name_ru': "Цветочная композиция \"Сердце из роз\" (101 роза)",
            'description_uz': "Grandioz yurak shaklidagi sovg'a qutisi. 101 dona sara yangi qizil atirgullar va oq atirgulli maxsus harf monogrammasi bilan.",
            'description_ru': "Грандиозное бархатное сердце из 101 свежайшей алой розы с изящной белой монограммой «A» (Crystall Ami) в центре.",
            'price': Decimal('1100000'),
            'old_price': Decimal('1350000'),
            'cost_price': Decimal('700000'),
            'image_rel': 'products/crystall_box_roses_hd.jpg',
            'is_featured': True,
            'stock': 5,
        },
        {
            'category_slug': 'sovga-bokslari',
            'slug': 'zielinski-rozen-6-mini-toplam',
            'name_uz': "Zielinski & Rozen 6 ta mini-atir to'plami",
            'name_ru': "Zielinski & Rozen Набор из 6 миниатюр",
            'description_uz': "Brend qutisida Zielinski & Rozen eng sevimli iforlarining 6 ta sayohat formatidagi to'plami.",
            'description_ru': "Стильный подарочный набор из 6 культовых ароматов Zielinski & Rozen (Black Pepper & Amber, Vanilla Blend, Oakmoss и др.).",
            'price': Decimal('490000'),
            'old_price': Decimal('580000'),
            'cost_price': Decimal('300000'),
            'image_rel': 'products/tg_crystal_prod_9.jpg',
            'is_featured': False,
            'stock': 12,
        },
        {
            'category_slug': 'sovga-bokslari',
            'slug': 'zielinski-rozen-trio-gift-box',
            'name_uz': "Zielinski & Rozen Sovg'a Triosi",
            'name_ru': "Zielinski & Rozen Подарочное Трио",
            'description_uz': "Parfyum, qo'l kremi va xushbo'y shamdan iborat mukammal g'amxo'rlik to'plami.",
            'description_ru': "Универсальный и стильный набор: духи 10 мл, питательный крем для рук и ароматическая свеча в крафтовом подарочном оформлении.",
            'price': Decimal('390000'),
            'old_price': Decimal('480000'),
            'cost_price': Decimal('240000'),
            'image_rel': 'products/tg_crystal_prod_10.jpg',
            'is_featured': False,
            'stock': 14,
        },

        # --- 5. Sumkalar & Aksessuarlar ---
        {
            'category_slug': 'sumkalar-aksessuarlar',
            'slug': 'sumka-baget-eko-teri',
            'name_uz': "Nafis baget sumkasi yumshoq eko-teridan",
            'name_ru': "Элегантная сумка-багет из мягкой эко-кожи",
            'description_uz': "Trenddagi zamonaviy ayollar sumkasi. Qulay yelka tasmasi, sifatli furnitura va har qanday kiyimga mos tushuvchi minimalist dizayn.",
            'description_ru': "Универсальная стильная сумка-багет. Премиальная мягкая фактурная эко-кожа, надежная золотистая фурнитура и удобный ремень.",
            'price': Decimal('420000'),
            'old_price': Decimal('520000'),
            'cost_price': Decimal('240000'),
            'image_rel': 'products/crystall_box_builder_hd.jpg',
            'is_featured': True,
            'stock': 15,
            'variations': [
                {'name_uz': "Qora (Black)", 'name_ru': "Черный (Black)", 'price': Decimal('420000'), 'stock': 5},
                {'name_uz': "Sutli oq (Milk)", 'name_ru': "Молочный (Milk)", 'price': Decimal('420000'), 'stock': 5},
                {'name_uz': "Bej (Beige)", 'name_ru': "Бежевый (Beige)", 'price': Decimal('420000'), 'stock': 5},
            ]
        },
        {
            'category_slug': 'sumkalar-aksessuarlar',
            'slug': 'kristalli-kechki-klatch',
            'name_uz': "Yaltiroq kristall kechki klatch sumkasi",
            'name_ru': "Вечерний клатч с сияющими кристаллами",
            'description_uz': "Tantanali kechalar, to'ylar va bayramlar uchun yaltiroq kristallik klatch. Yechiladigan tillarang zanjir tasmasi mavjud.",
            'description_ru': "Ослепительный вечерний клатч, усыпанный сверкающими кристаллами. Съемная цепочка на плечо и удобный надежный замок.",
            'price': Decimal('480000'),
            'old_price': Decimal('590000'),
            'cost_price': Decimal('280000'),
            'image_rel': 'products/crystall_evening_black_hd.jpg',
            'is_featured': False,
            'stock': 8,
        },
        {
            'category_slug': 'sumkalar-aksessuarlar',
            'slug': 'dizaynerlik-ipak-twilly-romoli',
            'name_uz': "Dizaynerlik ipak twilly ro'moli va broshka to'plami",
            'name_ru': "Шелковый платок-твилли с дизайнерским принтом",
            'description_uz': "100% tabiiy ipakdan tayyorlangan nafis twilly ro'molchasi. Bo'yinga, bilakka yoki sumka dastasiga bog'lash uchun ideal.",
            'description_ru': "Элегантный узкий платок-твилли из натурального шелка с изысканным принтом. Идеален для акцента на шее или ручке сумки.",
            'price': Decimal('190000'),
            'old_price': Decimal('240000'),
            'cost_price': Decimal('90000'),
            'image_rel': 'products/crystall_vintage_dress_hd.jpg',
            'is_featured': False,
            'stock': 20,
        },
    ]

    for p_info in products_data:
        cat = categories.get(p_info['category_slug'])
        prod, created = Product.objects.update_or_create(
            store=store,
            slug=p_info['slug'],
            defaults={
                'category': cat,
                'name_uz': p_info['name_uz'],
                'name_ru': p_info['name_ru'],
                'description_uz': p_info['description_uz'],
                'description_ru': p_info['description_ru'],
                'price': p_info['price'],
                'old_price': p_info.get('old_price'),
                'cost_price': p_info.get('cost_price', Decimal('0')),
                'image_url': f"/media/{p_info['image_rel']}",
                'stock': p_info.get('stock', 10),
                'track_stock': True,
                'is_active': True,
                'is_featured': p_info.get('is_featured', False),
                'has_constructor': p_info.get('has_constructor', False),
            }
        )

        # Update primary ProductImage
        ProductImage.objects.filter(product=prod).delete()
        ProductImage.objects.create(
            product=prod,
            image=p_info['image_rel'],
            is_primary=True,
            sort_order=0
        )

        # Variations
        ProductVariation.objects.filter(product=prod).delete()
        if 'variations' in p_info:
            for v_idx, v in enumerate(p_info['variations']):
                ProductVariation.objects.create(
                    product=prod,
                    name_uz=v['name_uz'],
                    name_ru=v['name_ru'],
                    price=v['price'],
                    stock=v['stock'],
                    sort_order=v_idx,
                    is_active=True
                )

        print(f"  + Product: {prod.name_ru} ({prod.price:,.0f} UZS)")

    # 5. Seed constructor groups for custom-luxe-box
    box_prod = Product.objects.filter(store=store, slug='custom-luxe-box').first()
    if box_prod:
        from apps.api.views_constructor import PRESETS
        preset = PRESETS.get('luxe_box')
        if preset:
            box_prod.constructor_groups.all().delete()
            for g_data in preset['groups']:
                grp = ConstructorGroup.objects.create(
                    store=store,
                    product=box_prod,
                    name_ru=g_data['name_ru'],
                    name_uz=g_data['name_uz'],
                    group_type=g_data['group_type'],
                    is_required=g_data['is_required'],
                    min_required=g_data['min_required'],
                    max_allowed=g_data['max_allowed'],
                    sort_order=g_data['sort_order']
                )
                for it_idx, it_data in enumerate(g_data['items'], 1):
                    ConstructorItem.objects.create(
                        group=grp,
                        name_ru=it_data['name_ru'],
                        name_uz=it_data['name_uz'],
                        price=it_data['price'],
                        is_default=it_data.get('is_default', False),
                        image_url=it_data.get('image_url', ''),
                        sort_order=it_idx
                    )
            print(f"Configured constructor groups for {box_prod.name_ru}")

    print(f"\nAll products, banners and constructor seeded successfully for {store.name}!")

if __name__ == '__main__':
    seed()
