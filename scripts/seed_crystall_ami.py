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
            'subtitle': 'Crystall Ami — Samarqand, Makon Mall. Eksklyuziv liboslar va nish parfyumeriya.',
            'image': 'stores/banners/crystall_banner_1.jpg',
            'image_url': '/media/stores/banners/crystall_banner_1.jpg',
            'link': '?cat=selektiv-parfyumeriya',
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
            'title': 'Eksklyuziv Kiyimlar & Oqshom Liboslari',
            'subtitle': 'Yorqin va unutilmas lahzalar uchun hashamatli liboslar va kiyimlar kolleksiyasi.',
            'image': 'stores/banners/crystall_banner_3.jpg',
            'image_url': '/media/stores/banners/crystall_banner_3.jpg',
            'link': '?cat=kiyimlar',
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
            'slug': "selektiv-parfyumeriya",
            'name_uz': "Selektiv parfyumeriya",
            'name_ru': "Селективная парфюмерия",
            'icon': 'sparkles',
            'primary_image_url': '/media/products/packshots/perfume_ganymede.jpg',
            'sort_order': 1
        },
        {
            'slug': "sovga-bokslari",
            'name_uz': "Sovg'a to'plamlari & Bokslar",
            'name_ru': "Подарочные Luxe-боксы",
            'icon': 'gift',
            'primary_image_url': '/media/products/packshots/gift_zielinski_coffret.jpg',
            'sort_order': 2
        },
        {
            'slug': "kiyimlar",
            'name_uz': "Kiyimlar & Liboslar",
            'name_ru': "Одежда & Наряды",
            'icon': 'shirt',
            'primary_image_url': '/media/products/packshots/clothing_red_dress.jpg',
            'sort_order': 3
        }
    ]

    # Delete old stale categories for this store that are not in cats_data
    Category.objects.filter(store=store).exclude(slug__in=[c['slug'] for c in cats_data]).delete()

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
        # ==============================================================
        # 1. СЕЛЕКТИВНАЯ ПАРФЮМЕРИЯ (21 items - Pure White Studio Packshots)
        # ==============================================================
        {
            'category_slug': 'selektiv-parfyumeriya',
            'slug': 'marc-antoine-barrois-ganymede',
            'name_uz': "Marc-Antoine Barrois Ganymede (100 ml)",
            'name_ru': "Marc-Antoine Barrois Ganymede (100 мл)",
            'description_uz': "Kosmik mineral va zamonaviy charmli nish ifor. O'zgacha joziba, uzoq davom etuvchi shleyf va qimmatbaho kompozitsiya.",
            'description_ru': "Культовый селективный аромат: минеральные аккорды, замша, бессмертник и мандарин. Невероятный шлейф и стойкость.",
            'price': Decimal('490000'),
            'old_price': Decimal('600000'),
            'cost_price': Decimal('300000'),
            'image_rel': 'products/packshots/perfume_ganymede.jpg',
            'is_featured': True,
            'stock': 20,
        },
        {
            'category_slug': 'selektiv-parfyumeriya',
            'slug': 'kilian-angels-share',
            'name_uz': "Kilian Angels' Share (50 ml)",
            'name_ru': "Kilian Angels' Share (50 мл)",
            'description_uz': "Konyak bochkalari, dolchin, vanil va eman daraxti notalari mujassamlashgan afsonaviy nish atir. Haqiqiy aristokratik hashamat.",
            'description_ru': "Коньячный аккорд, дубовые бочки, корица, бобы тонка и пралине. Роскошный хрустальный флакон в форме бокала для коньяка.",
            'price': Decimal('590000'),
            'old_price': Decimal('720000'),
            'cost_price': Decimal('360000'),
            'image_rel': 'products/packshots/perfume_angels_share.jpg',
            'is_featured': True,
            'stock': 15,
        },
        {
            'category_slug': 'selektiv-parfyumeriya',
            'slug': 'mfk-baccarat-rouge-540',
            'name_uz': "Maison Francis Kurkdjian Baccarat Rouge 540 (70 ml)",
            'name_ru': "MFK Baccarat Rouge 540 (70 мл)",
            'description_uz': "Zamonaviy parfyumeriyaning eng mashhur durdonasi. Zafarron, qahrabo va sadr daraxtining tengsiz jozibasi.",
            'description_ru': "Легендарный аромат роскоши: амбра, шафран, жасмин и кедр. Магнетический, яркий и бесконечно стойкий шлейф.",
            'price': Decimal('690000'),
            'old_price': Decimal('850000'),
            'cost_price': Decimal('420000'),
            'image_rel': 'products/packshots/perfume_baccarat_rouge.jpg',
            'is_featured': True,
            'stock': 18,
        },
        {
            'category_slug': 'selektiv-parfyumeriya',
            'slug': 'parfums-de-marly-delina',
            'name_uz': "Parfums de Marly Delina (75 ml)",
            'name_ru': "Parfums de Marly Delina (75 мл)",
            'description_uz': "Nafis turk atirguli, lichi va vanilning jozibali guldastasi. Aristokratik pushti flakondagi ayollik simvolasi.",
            'description_ru': "Чувственный цветочный букет: турецкая роза, ландыш, пион, сочный личи и мускус. Флакон из пастельно-розового фарфора.",
            'price': Decimal('680000'),
            'old_price': Decimal('820000'),
            'cost_price': Decimal('400000'),
            'image_rel': 'products/packshots/perfume_delina.jpg',
            'is_featured': True,
            'stock': 12,
        },
        {
            'category_slug': 'selektiv-parfyumeriya',
            'slug': 'bois-imperial-by-quentin-bisch',
            'name_uz': "Essential Parfums Bois Impérial by Quentin Bisch (100 ml)",
            'name_ru': "Bois Impérial by Quentin Bisch (100 мл)",
            'description_uz': "Zamonamizning eng ommabop nish atiri. Yangi rayhon, vetiver va akigalawood yog'ochining hayratlanarli uyg'unligi.",
            'description_ru': "Хит современной ниши: свежий базилик, перец тимут, гаитянский ветивер и молекула акигалавуд. Сверхстойкий древесный шлейф.",
            'price': Decimal('650000'),
            'old_price': Decimal('780000'),
            'cost_price': Decimal('390000'),
            'image_rel': 'products/packshots/perfume_bois_imperial.jpg',
            'is_featured': True,
            'stock': 22,
        },
        {
            'category_slug': 'selektiv-parfyumeriya',
            'slug': 'yves-saint-laurent-libre',
            'name_uz': "Yves Saint Laurent Libre Eau de Parfum (90 ml)",
            'name_ru': "Yves Saint Laurent Libre (90 мл)",
            'description_uz': "Fransuz lavandasi va Marokash apelsin gulining erkin va o'ziga ishongan ayollar uchun yorqin uyg'unligi.",
            'description_ru': "Культовый цветочный аромат свободы с нотами лаванды, флердоранжа и мадагаскарской ванили. Флакон с золотым логотипом Cassandre.",
            'price': Decimal('595000'),
            'old_price': Decimal('720000'),
            'cost_price': Decimal('360000'),
            'image_rel': 'products/packshots/perfume_ysl_libre.jpg',
            'is_featured': False,
            'stock': 16,
        },
        {
            'category_slug': 'selektiv-parfyumeriya',
            'slug': 'bvlgari-rose-goldea',
            'name_uz': "Bvlgari Rose Goldea (90 ml)",
            'name_ru': "Bvlgari Rose Goldea (90 мл)",
            'description_uz': "Damashq atirgulining xushbo'y ifori va oq mushk. Ayollik, nafosat va sevgining timsoli.",
            'description_ru': "Чувственный цветочный аромат, посвященный красоте дамасской розы и сиянию золота. Нежный, манящий и женственный.",
            'price': Decimal('550000'),
            'old_price': Decimal('670000'),
            'cost_price': Decimal('340000'),
            'image_rel': 'products/packshots/perfume_rose_goldea.jpg',
            'is_featured': False,
            'stock': 14,
        },
        {
            'category_slug': 'selektiv-parfyumeriya',
            'slug': 'orto-parisi-megamare',
            'name_uz': "Orto Parisi Megamare (50 ml)",
            'name_ru': "Orto Parisi Megamare (50 мл)",
            'description_uz': "Dengiz tubi tubsizligi va cheksiz okean kuchi. Alessandro Gualtieridan o'ta kuchli va uzoq davom etuvchi mineral-akvatik ifor.",
            'description_ru': "Бесконечная мощь штормового океана, морские минералы, йод и водоросли. Один из самых стойких и гипнотических ароматов мира.",
            'price': Decimal('550000'),
            'old_price': Decimal('690000'),
            'cost_price': Decimal('350000'),
            'image_rel': 'products/packshots/perfume_megamare.jpg',
            'is_featured': False,
            'stock': 10,
        },
        {
            'category_slug': 'selektiv-parfyumeriya',
            'slug': 'chanel-coco-mademoiselle',
            'name_uz': "Chanel Coco Mademoiselle Eau de Parfum (100 ml)",
            'name_ru': "Chanel Coco Mademoiselle (100 мл)",
            'description_uz': "Fransuz nafisligining cho'qqisi. Yangi apelsin, atirgul, paquli va oq mushk uyg'unligi.",
            'description_ru': "Абсолютная классика парижского шика: свежий апельсин, жасмин, роза, пачули и ветивер. Неповторимый женственный шлейф.",
            'price': Decimal('490000'),
            'old_price': Decimal('620000'),
            'cost_price': Decimal('310000'),
            'image_rel': 'products/packshots/perfume_coco_mademoiselle.jpg',
            'is_featured': False,
            'stock': 15,
        },
        {
            'category_slug': 'selektiv-parfyumeriya',
            'slug': 'chanel-allure-homme-sport',
            'name_uz': "Chanel Allure Homme Sport (100 ml)",
            'name_ru': "Chanel Allure Homme Sport (100 мл)",
            'description_uz': "Dinamik, toza va baquvvat erkaklar uchun klassik sport ifori. Mandaring, dengiz shabbodasi va sadr daraxti.",
            'description_ru': "Свежий, бодрящий и чувственный древесно-пряный аромат: мандарин, морской бриз, кедр, белый мускус и бобы тонка.",
            'price': Decimal('470000'),
            'old_price': Decimal('580000'),
            'cost_price': Decimal('290000'),
            'image_rel': 'products/packshots/perfume_allure_homme_sport.jpg',
            'is_featured': False,
            'stock': 12,
        },
        {
            'category_slug': 'selektiv-parfyumeriya',
            'slug': 'dolce-gabbana-light-blue-intense',
            'name_uz': "Dolce & Gabbana Light Blue Eau Intense (100 ml)",
            'name_ru': "Dolce & Gabbana Light Blue Eau Intense (100 мл)",
            'description_uz': "O'rta er dengizi shabadasi, limon va olma yangiligi bilan to'yingan sevimli yozgi ifor.",
            'description_ru': "Искрящаяся средиземноморская свежесть: лимон, зеленое яблоко «Гренни Смит», бархатцы, жасмин и древесный янтарь.",
            'price': Decimal('550000'),
            'old_price': Decimal('660000'),
            'cost_price': Decimal('330000'),
            'image_rel': 'products/packshots/perfume_dg_light_blue.jpg',
            'is_featured': False,
            'stock': 14,
        },
        {
            'category_slug': 'selektiv-parfyumeriya',
            'slug': 'dolce-gabbana-q',
            'name_uz': "Dolce & Gabbana Q Eau de Parfum (100 ml)",
            'name_ru': "Dolce & Gabbana Q (100 мл)",
            'description_uz': "Qirolichalarga xos ifor. Qizil gilos, sitruslar va sadr daraxti bilan boyitilgan qirollik tojli flakon.",
            'description_ru': "Королевский аромат страсти и женственности: сочная вишня, сицилийский лимон, гелиотроп и благородный кедр под золотой короной.",
            'price': Decimal('490000'),
            'old_price': Decimal('600000'),
            'cost_price': Decimal('300000'),
            'image_rel': 'products/packshots/perfume_dg_q.jpg',
            'is_featured': False,
            'stock': 11,
        },
        {
            'category_slug': 'selektiv-parfyumeriya',
            'slug': 'le-labo-santal-33',
            'name_uz': "Le Labo Santal 33 (100 ml)",
            'name_ru': "Le Labo Santal 33 (100 мл)",
            'description_uz': "Kultoviy Nyu-York nish atiri. Qimmatbaho sandal daraxti, charm, kardamon va iris notalari.",
            'description_ru': "Культовый нишевый аромат Манхэттена: австралийский сандал, кедр, кардамон, фиалка, папирус и кожаный шлейф.",
            'price': Decimal('490000'),
            'old_price': Decimal('620000'),
            'cost_price': Decimal('310000'),
            'image_rel': 'products/packshots/perfume_santal_33.jpg',
            'is_featured': False,
            'stock': 16,
        },
        {
            'category_slug': 'selektiv-parfyumeriya',
            'slug': 'le-labo-another-13',
            'name_uz': "Le Labo Another 13 (100 ml)",
            'name_ru': "Le Labo Another 13 (100 мл)",
            'description_uz': "AnOther jurnali bilan hamkorlikda yaratilgan gipnotik molekulyar ifor. Ambroksan, nok va yasmin.",
            'description_ru': "Гипнотический молекулярный аромат чистоты и интимной привлекательности: амброксан, сочная груша, мускус и мох.",
            'price': Decimal('490000'),
            'old_price': Decimal('620000'),
            'cost_price': Decimal('310000'),
            'image_rel': 'products/packshots/perfume_another_13.jpg',
            'is_featured': False,
            'stock': 14,
        },
        {
            'category_slug': 'selektiv-parfyumeriya',
            'slug': 'amouage-guidance',
            'name_uz': "Amouage Guidance Eau de Parfum (100 ml)",
            'name_ru': "Amouage Guidance (100 мл)",
            'description_uz': "Ummon sultonligining shohona nish asari. Nok, frankinsens, findiq, osmantus va sandal yog'ochi.",
            'description_ru': "Роскошный шедевр восточной ниши от Квентина Биша: спелая груша, ладан, фундук, османтус, роза и драгоценная амбра.",
            'price': Decimal('520000'),
            'old_price': Decimal('680000'),
            'cost_price': Decimal('330000'),
            'image_rel': 'products/packshots/perfume_amouage_guidance.jpg',
            'is_featured': False,
            'stock': 12,
        },
        {
            'category_slug': 'selektiv-parfyumeriya',
            'slug': 'dior-sauvage-edp',
            'name_uz': "Dior Sauvage Eau de Parfum (100 ml)",
            'name_ru': "Dior Sauvage Eau de Parfum (100 мл)",
            'description_uz': "Dunyoning eng mashhur erkaklar ifori. Kalabriya bergamoti, xushbo'y qalampir va vanil ambrasi.",
            'description_ru': "Магический вечерний аромат дикой природы: калабрийский бергамот, сычуаньский перец, лаванда, звездчатый анис и теплая ваниль.",
            'price': Decimal('550000'),
            'old_price': Decimal('680000'),
            'cost_price': Decimal('340000'),
            'image_rel': 'products/packshots/perfume_dior_sauvage.jpg',
            'is_featured': False,
            'stock': 18,
        },
        {
            'category_slug': 'selektiv-parfyumeriya',
            'slug': 'bleu-de-chanel-parfum',
            'name_uz': "Bleu de Chanel Parfum (100 ml)",
            'name_ru': "Bleu de Chanel Parfum (100 мл)",
            'description_uz': "Chanel uyining eng boy va konsentratsiyalangan erkaklar parfyumi. Sandal daraxti va sadr akkordi.",
            'description_ru': "Чистая роскошь и уверенность: глубокий аккорд благородного сандалового дерева из Новой Каледонии и кедра.",
            'price': Decimal('550000'),
            'old_price': Decimal('690000'),
            'cost_price': Decimal('350000'),
            'image_rel': 'products/packshots/perfume_bleu_de_chanel.jpg',
            'is_featured': False,
            'stock': 15,
        },
        {
            'category_slug': 'selektiv-parfyumeriya',
            'slug': 'marc-antoine-barrois-encelade',
            'name_uz': "Marc-Antoine Barrois Encelade (100 ml)",
            'name_ru': "Marc-Antoine Barrois Encelade (100 мл)",
            'description_uz': "Rabarbar, tutunli vetiver, sadr va charmdan iborat g'ayritabiiy yashil-vulkanik kompozitsiya.",
            'description_ru': "Вулканический зеленый шедевр: сочный ревень, дымный ветивер, кедр, сандал и кожа. Аромат вечной энергии и природы.",
            'price': Decimal('530000'),
            'old_price': Decimal('670000'),
            'cost_price': Decimal('330000'),
            'image_rel': 'products/packshots/perfume_encelade.jpg',
            'is_featured': False,
            'stock': 10,
        },
        {
            'category_slug': 'selektiv-parfyumeriya',
            'slug': 'tiziana-terenzi-kirke',
            'name_uz': "Tiziana Terenzi Kirke Extrait de Parfum (100 ml)",
            'name_ru': "Tiziana Terenzi Kirke (100 мл)",
            'description_uz': "Maftunkor ma'buda ifori. Shaftoli, ehtiros mevasi (marakuya), malina va iliq mushk simfoniyasi.",
            'description_ru': "Гипнотический фруктово-шипровый экстракт: маракуйя, персик, малина, черная смородина, ландыш и манящий мускус.",
            'price': Decimal('664000'),
            'old_price': Decimal('820000'),
            'cost_price': Decimal('400000'),
            'image_rel': 'products/packshots/perfume_kirke.jpg',
            'is_featured': False,
            'stock': 12,
        },
        {
            'category_slug': 'selektiv-parfyumeriya',
            'slug': 'miss-dior-blooming-bouquet-mini',
            'name_uz': "Miss Dior Mini: Blooming Bouquet (38 ml)",
            'name_ru': "Miss Dior Mini: Blooming Bouquet (38 мл)",
            'description_uz': "Pion va bahoriy atirgullar guldastasi. Yengil, nafis va romantik shahar qizlari uchun ajoyib format.",
            'description_ru': "Нежный букет весенних цветов: пион, дамасская роза и белый мускус в удобном компактном флаконе.",
            'price': Decimal('185000'),
            'old_price': Decimal('230000'),
            'cost_price': Decimal('100000'),
            'image_rel': 'products/packshots/perfume_miss_dior.jpg',
            'is_featured': False,
            'stock': 25,
        },
        {
            'category_slug': 'selektiv-parfyumeriya',
            'slug': 'armani-prive-vert-malachite',
            'name_uz': "Armani Privé Vert Malachite (100 ml)",
            'name_ru': "Armani Privé Vert Malachite (100 мл)",
            'description_uz': "Yashil malaxit toshidan ilhomlangan qimmatbaho ifor. Oq liliya, achchiq apelsin va pushti qalampir.",
            'description_ru': "Кутюрная коллекция Giorgio Armani: благородная белая лилия, иланг-иланг, горький апельсин и бензоин в флаконе из малахита.",
            'price': Decimal('650000'),
            'old_price': Decimal('800000'),
            'cost_price': Decimal('390000'),
            'image_rel': 'products/packshots/perfume_vert_malachite.jpg',
            'is_featured': False,
            'stock': 9,
        },

        # ==============================================================
        # 2. ПОДАРОЧНЫЕ LUXE-БОКСЫ & НАБОРЫ (6 items)
        # ==============================================================
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
            'image_rel': 'products/packshots/gift_zielinski_coffret.jpg',
            'is_featured': True,
            'stock': 50,
            'has_constructor': True,
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
            'image_rel': 'products/packshots/gift_zielinski_6.jpg',
            'is_featured': True,
            'stock': 14,
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
            'image_rel': 'products/packshots/gift_zielinski_trio.jpg',
            'is_featured': True,
            'stock': 16,
        },
        {
            'category_slug': 'sovga-bokslari',
            'slug': 'zielinski-rozen-collection-coffret',
            'name_uz': "Zielinski & Rozen Kolleksion Sovg'a Boksi",
            'name_ru': "Zielinski & Rozen Коллекционный набор с дезодорантом",
            'description_uz': "Zielinski & Rozen to'liq parvarish to'plami: dush geli, krem va parfyum qutisi.",
            'description_ru': "Премиальный сет Zielinski & Rozen в фирменной деревянной шкатулке с крафтовым наполнением.",
            'price': Decimal('450000'),
            'old_price': Decimal('550000'),
            'cost_price': Decimal('280000'),
            'image_rel': 'products/packshots/gift_zielinski_coffret.jpg',
            'is_featured': False,
            'stock': 12,
        },
        {
            'category_slug': 'sovga-bokslari',
            'slug': 'amouage-guidance-lineage-coffret',
            'name_uz': "Amouage Guidance & Lineage Sovg'a To'plami",
            'name_ru': "Amouage Guidance & Lineage Подарочный набор",
            'description_uz': "Amouage uyining ikkita bestseller iforidan iborat eksklyuziv sovg'a qutisi.",
            'description_ru': "Роскошный подарочный кофр с двумя бестселлерами Amouage (Guidance и Lineage) в элегантном оформлении Crystall Ami.",
            'price': Decimal('520000'),
            'old_price': Decimal('640000'),
            'cost_price': Decimal('320000'),
            'image_rel': 'products/packshots/gift_amouage_coffret.jpg',
            'is_featured': False,
            'stock': 8,
        },
        {
            'category_slug': 'sovga-bokslari',
            'slug': 'le-labo-zielinski-premium-box',
            'name_uz': "Le Labo & Zielinski Premium Sovg'a To'plami",
            'name_ru': "Le Labo & Zielinski Премиум бокс",
            'description_uz': "Le Labo Santal 33 va Zielinski & Rozen mahsulotlarining hashamatli sovg'a uyg'unligi.",
            'description_ru': "Премиальный подарочный бокс с парфюмерией Le Labo и бестселлерами Zielinski & Rozen в черной бархатной коробке.",
            'price': Decimal('490000'),
            'old_price': Decimal('610000'),
            'cost_price': Decimal('300000'),
            'image_rel': 'products/packshots/gift_lelabo_box.jpg',
            'is_featured': False,
            'stock': 10,
        },

        # ==============================================================
        # 3. ОДЕЖДА & НАРЯДЫ (5 items - Pure White Studio Packshots / Ghost Mannequin / Hanger)
        # ==============================================================
        {
            'category_slug': 'kiyimlar',
            'slug': 'qizil-ipak-oqshom-koylagi',
            'name_uz': "Qizil ipak oqshom ko'ylagi",
            'name_ru': "Красное шелковое вечернее платье в пол",
            'description_uz': "Crystall Ami kolleksiyasidan nafis qizil oqshom libosi. Yelkasi ochiq, qomatga mukammal o'tiruvchi qirqim. Tantanali oqshomlar, to'y va fotosessiyalar uchun eng sara tanlov. Premium mato.",
            'description_ru': "Роскошное красное вечернее платье с открытыми плечами из коллекции Crystall Ami. Идеальная посадка по фигуре, струящийся премиальный атласный шелк. Прекрасный выбор для торжеств.",
            'price': Decimal('850000'),
            'old_price': Decimal('1050000'),
            'cost_price': Decimal('500000'),
            'image_rel': 'products/packshots/clothing_red_dress.jpg',
            'is_featured': True,
            'stock': 15,
            'variations': [
                {'name_uz': 'S (42-44)', 'name_ru': 'S (42-44)', 'price': Decimal('850000'), 'stock': 5},
                {'name_uz': 'M (44-46)', 'name_ru': 'M (44-46)', 'price': Decimal('850000'), 'stock': 6},
                {'name_uz': 'L (46-48)', 'name_ru': 'L (46-48)', 'price': Decimal('850000'), 'stock': 4},
            ]
        },
        {
            'category_slug': 'kiyimlar',
            'slug': 'kichik-qora-oqshom-libosi',
            'name_uz': "Kichik qora oqshom libosi",
            'name_ru': "Элегантное черное вечернее платье",
            'description_uz': "Klassik qora oqshom libosi. Qomatni nozik ko'rsatuvchi siluet va beg'ubor tikuv sifati. Har qanday tantanali tadbir uchun tengsiz.",
            'description_ru': "Безупречное маленькое черное платье из плотной костюмной ткани с выверенным кроем. Идеально садится по фигуре, создавая утонченный силуэт.",
            'price': Decimal('750000'),
            'old_price': Decimal('920000'),
            'cost_price': Decimal('420000'),
            'image_rel': 'products/packshots/clothing_black_dress.jpg',
            'is_featured': True,
            'stock': 12,
            'variations': [
                {'name_uz': 'S (42-44)', 'name_ru': 'S (42-44)', 'price': Decimal('750000'), 'stock': 4},
                {'name_uz': 'M (44-46)', 'name_ru': 'M (44-46)', 'price': Decimal('750000'), 'stock': 5},
                {'name_uz': 'L (46-48)', 'name_ru': 'L (46-48)', 'price': Decimal('750000'), 'stock': 3},
            ]
        },
        {
            'category_slug': 'kiyimlar',
            'slug': 'adidas-klassik-sport-kostyumi',
            'name_uz': "Adidas klassik sport kostyumi (Jaket + Shim)",
            'name_ru': "Спортивный костюм Adidas (жакет + брюки)",
            'description_uz': "Crystall Ami kolleksiyasidagi original Adidas ikki qismli sport to'plami. Yuqori sifatli paxta trikotaji, zamonaviy qora chiziqlar va o'ta qulay bichim.",
            'description_ru': "Стильный спортивный костюм-двойка Adidas молочного цвета с контрастными полосами. Мягкий дышащий хлопковый трикотаж, премиальная фурнитура.",
            'price': Decimal('650000'),
            'old_price': Decimal('790000'),
            'cost_price': Decimal('380000'),
            'image_rel': 'products/packshots/clothing_adidas_tracksuit.jpg',
            'is_featured': True,
            'stock': 16,
            'variations': [
                {'name_uz': 'S (42)', 'name_ru': 'S (42)', 'price': Decimal('650000'), 'stock': 4},
                {'name_uz': 'M (44)', 'name_ru': 'M (44)', 'price': Decimal('650000'), 'stock': 6},
                {'name_uz': 'L (46)', 'name_ru': 'L (46)', 'price': Decimal('650000'), 'stock': 4},
                {'name_uz': 'XL (48)', 'name_ru': 'XL (48)', 'price': Decimal('650000'), 'stock': 2},
            ]
        },
        {
            'category_slug': 'kiyimlar',
            'slug': 'dolce-gabbana-dizaynerlik-jaketi',
            'name_uz': "Dolce & Gabbana dizaynerlik jaketi",
            'name_ru': "Дизайнерская куртка-бомбер Dolce & Gabbana",
            'description_uz': "Italiya uslubidagi eksklyuziv jaket-bomber. D&G metall logotipi, qulay elastik jiyaklar va hashamatli qora jilo.",
            'description_ru': "Эксклюзивная демисезонная куртка-бомбер в стиле Dolce & Gabbana. Премиальная ветрозащитная ткань, фирменная металлическая плакетка и стильный силуэт.",
            'price': Decimal('980000'),
            'old_price': Decimal('1200000'),
            'cost_price': Decimal('560000'),
            'image_rel': 'products/packshots/clothing_dg_jacket.jpg',
            'is_featured': False,
            'stock': 8,
            'variations': [
                {'name_uz': 'M (44-46)', 'name_ru': 'M (44-46)', 'price': Decimal('980000'), 'stock': 3},
                {'name_uz': 'L (46-48)', 'name_ru': 'L (46-48)', 'price': Decimal('980000'), 'stock': 3},
                {'name_uz': 'XL (48-50)', 'name_ru': 'XL (48-50)', 'price': Decimal('980000'), 'stock': 2},
            ]
        },
        {
            'category_slug': 'kiyimlar',
            'slug': 'zara-eko-moynali-kalta-postin',
            'name_uz': "Zara eko-mo'ynali hashamatli kalta po'stin",
            'name_ru': "Укороченная эко-шуба Zara с капюшоном",
            'description_uz': "Trenddagi eng yumshoq va issiq eko-mo'yna po'stin. Qulay kapyushon va zamonaviy bej-sutli tus.",
            'description_ru': "Хит сезона: нежнейшая укороченная эко-шуба из мягкого плюшевого меха с капюшоном. Теплая, невесомая и невероятно тактильная.",
            'price': Decimal('890000'),
            'old_price': Decimal('1100000'),
            'cost_price': Decimal('520000'),
            'image_rel': 'products/packshots/clothing_zara_jacket.jpg',
            'is_featured': False,
            'stock': 10,
            'variations': [
                {'name_uz': 'S (42-44)', 'name_ru': 'S (42-44)', 'price': Decimal('890000'), 'stock': 4},
                {'name_uz': 'M (44-46)', 'name_ru': 'M (44-46)', 'price': Decimal('890000'), 'stock': 4},
                {'name_uz': 'L (46-48)', 'name_ru': 'L (46-48)', 'price': Decimal('890000'), 'stock': 2},
            ]
        },
    ]

    # Delete existing products for this store that are not in products_data
    valid_slugs = [p['slug'] for p in products_data]
    deleted_count, _ = Product.objects.filter(store=store).exclude(slug__in=valid_slugs).delete()
    if deleted_count > 0:
        print(f"Removed {deleted_count} stale/outdated products.")

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

    print(f"\nAll {len(products_data)} products, categories, banners and constructor seeded successfully for {store.name}!")

if __name__ == '__main__':
    seed()
