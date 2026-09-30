import os
from decimal import Decimal
from django.utils.text import slugify
from apps.stores.models import Store
from apps.catalog.models import Category, Product, ProductImage, ProductVariation

def seed():
    store = Store.objects.get(subdomain='crystall-ami')
    print(f"Seeding products for store: {store.name} (ID: {store.id})")

    # Categories setup
    cats_data = [
        {
            'name_uz': "Oqshom liboslari",
            'name_ru': "Вечерние платья & Образы",
            'slug': "oqshom-liboslari",
            'icon': 'sparkles',
            'sort_order': 1
        },
        {
            'name_uz': "Kostyumlar & Kundalik kiyimlar",
            'name_ru': "Костюмы & Повседневная одежда",
            'slug': "kostyumlar",
            'icon': 'shirt',
            'sort_order': 2
        },
        {
            'name_uz': "Selektiv parfyumeriya",
            'name_ru': "Селективная парфюмерия",
            'slug': "selektiv-parfyumeriya",
            'icon': 'flame',
            'sort_order': 3
        },
        {
            'name_uz': "Sovg'a bokslari & To'plamlar",
            'name_ru': "Подарочные Luxe-боксы",
            'slug': "sovga-bokslari",
            'icon': 'gift',
            'sort_order': 4
        },
        {
            'name_uz': "Sumkalar & Aksessuarlar",
            'name_ru': "Сумки & Аксессуары",
            'slug': "sumkalar-aksessuarlar",
            'icon': 'shopping-bag',
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
                'sort_order': c_data['sort_order'],
                'is_active': True
            }
        )
        categories[c_data['slug']] = cat

    # Products list
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
            'image_rel': 'products/crystall_dress_red.jpg',
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
            'image_rel': 'products/crystall_evening_black.jpg',
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
            'description_uz': "Fransuzcha nafis uslubdagi qizil polka-dot libos. Qavariq yenglari va o'yilgan oq yoqasi bilan bejirim ko'rinish beradi.",
            'description_ru': "Французский винтажный стиль: красное платье в мелкий горошек с фигурным белым воротником, акцентными пуговицами и пышными рукавами.",
            'price': Decimal('690000'),
            'old_price': Decimal('780000'),
            'cost_price': Decimal('400000'),
            'image_rel': 'products/crystall_vintage_dress.jpg',
            'is_featured': True,
            'stock': 12,
            'variations': [
                {'name_uz': 'S (42-44)', 'name_ru': 'S (42-44)', 'price': Decimal('690000'), 'stock': 6},
                {'name_uz': 'M (44-46)', 'name_ru': 'M (44-46)', 'price': Decimal('690000'), 'stock': 6},
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

        # --- 2. Kostyumlar ---
        {
            'category_slug': 'kostyumlar',
            'slug': 'ayollar-kostyum-dvoyka-premium',
            'name_uz': "Ayollar nafis kostyum-dvojkasi (Jaket + Shim)",
            'name_ru': "Женский элегантный костюм-двойка (жакет + брюки)",
            'description_uz': "Mukammal bichimdagi zamonaviy ayollar kostyumi: qomatga yarashuvchi jaket va keng to'kiluvchi palazzo shimi. Ofis va uchrashuvlar uchun ideal.",
            'description_ru': "Стильный женский костюм-двойка: приталенный жакет и струящиеся брюки палаццо. Идеален как для деловых встреч, так и для праздников.",
            'price': Decimal('950000'),
            'old_price': Decimal('1150000'),
            'cost_price': Decimal('550000'),
            'image_rel': 'products/tg_crystal_prod_3.jpg',
            'is_featured': True,
            'stock': 12,
            'variations': [
                {'name_uz': 'Bej rang / S', 'name_ru': 'Бежевый / S', 'price': Decimal('950000'), 'stock': 4},
                {'name_uz': 'Pushti / M', 'name_ru': 'Нежно-розовый / M', 'price': Decimal('950000'), 'stock': 4},
                {'name_uz': 'Moviy / L', 'name_ru': 'Небесно-голубой / L', 'price': Decimal('950000'), 'stock': 4},
            ]
        },

        # --- 3. Selektiv parfyumeriya ---
        {
            'category_slug': 'selektiv-parfyumeriya',
            'slug': 'clive-christian-luxe-original',
            'name_uz': "Clive Christian Luxe (Original)",
            'name_ru': "Clive Christian Luxe (Original)",
            'description_uz': "Qirollik darajasidagi hashamatli Clive Christian Luxe parfyumi. To'liq komplektatsiyada, cheklangan maxsus chegirma bilan!",
            'description_ru': "Королевский аромат Clive Christian Luxe в полной премиальной комплектации. Эксклюзивная скидка на оригинальный флакон!",
            'price': Decimal('730000'),
            'old_price': Decimal('950000'),
            'cost_price': Decimal('450000'),
            'image_rel': 'products/tg_crystal_prod_12.jpg',
            'is_featured': True,
            'stock': 5,
        },
        {
            'category_slug': 'selektiv-parfyumeriya',
            'slug': 'vilhelm-parfumerie-niche',
            'name_uz': "Vilhelm Parfumerie (Niche)",
            'name_ru': "Vilhelm Parfumerie (Niche)",
            'description_uz': "Mashhur Vilhelm Parfumerie selektiv ifori. Uzoq vaqt saqlanuvchi, jozibador va unutilmas shleyf.",
            'description_ru': "Знаменитый нишевый селективный аромат Vilhelm Parfumerie с невероятной стойкостью и богатым шлейфом.",
            'price': Decimal('690000'),
            'old_price': Decimal('820000'),
            'cost_price': Decimal('420000'),
            'image_rel': 'products/tg_crystal_prod_11.jpg',
            'is_featured': True,
            'stock': 7,
        },
        {
            'category_slug': 'selektiv-parfyumeriya',
            'slug': 'kilian-angels-share',
            'name_uz': "Kilian Angels' Share",
            'name_ru': "Kilian Angels' Share",
            'description_uz': "Konyak essensiyasi, dolchin, eman va praline shirinligi bilan boyitilgan afsonaviy iliq ifor.",
            'description_ru': "Культовый аромат с теплыми нотами коньяка, корицы, пралине и дубовой бочки. Настоящий хит осени и зимы.",
            'price': Decimal('590000'),
            'old_price': Decimal('720000'),
            'cost_price': Decimal('380000'),
            'image_rel': 'products/tg_crystal_prod_8.jpg',
            'is_featured': True,
            'stock': 8,
        },
        {
            'category_slug': 'selektiv-parfyumeriya',
            'slug': 'yves-saint-laurent-libre',
            'name_uz': "Yves Saint Laurent Libre",
            'name_ru': "Yves Saint Laurent Libre",
            'description_uz': "Fransuzcha lavanda va Marokash apelsin guli uyg'unlashgan erkin va betakror ayollar parfyumi.",
            'description_ru': "Яркий и манящий цветочный аромат с марокканским апельсиновым цветом и лавандой. Символ свободы и уверенности.",
            'price': Decimal('595000'),
            'old_price': Decimal('700000'),
            'cost_price': Decimal('370000'),
            'image_rel': 'products/tg_crystal_prod_10.jpg',
            'is_featured': False,
            'stock': 9,
        },
        {
            'category_slug': 'selektiv-parfyumeriya',
            'slug': 'marc-antoine-barrois-ganymede',
            'name_uz': "Marc-Antoine Barrois Ganymede",
            'name_ru': "Marc-Antoine Barrois Ganymede",
            'description_uz': "Zamonaviy zamonning eng ko'p muhokama qilinadigan mineral-charm ifori. Akigalawood va mandarin bilan jilolangan.",
            'description_ru': "Один из самых востребованных нишевых ароматов мира: минерально-кожаный аккорд с нотами фиалки и замши.",
            'price': Decimal('490000'),
            'old_price': Decimal('600000'),
            'cost_price': Decimal('320000'),
            'image_rel': 'products/tg_crystal_prod_5.jpg',
            'is_featured': True,
            'stock': 10,
        },
        {
            'category_slug': 'selektiv-parfyumeriya',
            'slug': 'bvlgari-rose-goldea',
            'name_uz': "Bvlgari Rose Goldea",
            'name_ru': "Bvlgari Rose Goldea",
            'description_uz': "Damashq atirguli, anor va oq mushk notalaridan iborat nozik, nazokatli va nafis atir.",
            'description_ru': "Нежный и утонченный цветочный эликсир с нотами дамасской розы, граната и чувственного мускуса.",
            'price': Decimal('550000'),
            'old_price': Decimal('650000'),
            'cost_price': Decimal('350000'),
            'image_rel': 'products/tg_crystal_prod_4.jpg',
            'is_featured': False,
            'stock': 8,
        },
        {
            'category_slug': 'selektiv-parfyumeriya',
            'slug': 'essential-parfums-bois-imperial',
            'name_uz': "Bois Impérial by Quentin Bisch",
            'name_ru': "Bois Impérial by Quentin Bisch",
            'description_uz': "Parfyumer Kventin Bishning mashhur asari. Yangi maydalangan rayhon va yog'ochli akordlar bilan 24 soatdan ortiq saqlanadi.",
            'description_ru': "Бестселлер нишевой парфюмерии: свежий древесный аккорд с нотами тайского базилика и гаитянского ветивера.",
            'price': Decimal('650000'),
            'old_price': Decimal('780000'),
            'cost_price': Decimal('400000'),
            'image_rel': 'products/tg_crystal_prod_2.jpg',
            'is_featured': False,
            'stock': 12,
        },
        {
            'category_slug': 'selektiv-parfyumeriya',
            'slug': 'amouage-luxury-fragrance',
            'name_uz': "Amouage Luxury Fragrance",
            'name_ru': "Amouage Luxury Fragrance",
            'description_uz': "Ummon sultonligining qirollik parfyumeriyasi. Noyob va qimmatbaho smolalar, sharqona boy kompozitsiya.",
            'description_ru': "Роскошная оманская парфюмерия высочайшего класса. Глубокий, восточный, гипнотический шлейф.",
            'price': Decimal('520000'),
            'old_price': Decimal('620000'),
            'cost_price': Decimal('330000'),
            'image_rel': 'products/tg_crystal_prod_6.jpg',
            'is_featured': False,
            'stock': 6,
        },
        {
            'category_slug': 'selektiv-parfyumeriya',
            'slug': 'miss-dior-blooming-bouquet-mini',
            'name_uz': "Miss Dior Mini: Blooming Bouquet (38 ml)",
            'name_ru': "Miss Dior Mini: Blooming Bouquet (38 мл)",
            'description_uz': "Mashhur Miss Dior guldastasining qulay 38 ml mini formati. Shuningdek sumkada olib yurish va sovg'a uchun qulay.",
            'description_ru': "Компактный мини-флакон 38 мл легендарного аромата Blooming Bouquet. Идеально помещается в женской сумочке.",
            'price': Decimal('185000'),
            'old_price': Decimal('240000'),
            'cost_price': Decimal('110000'),
            'image_rel': 'products/tg_crystal_prod_19.jpg',
            'is_featured': False,
            'stock': 20,
        },

        # --- 4. Sovg'a bokslari ---
        {
            'category_slug': 'sovga-bokslari',
            'slug': 'luxe-box-dior-backstage-sol-de-janeiro',
            'name_uz': "Luxe Box \"Dior Backstage & Sol de Janeiro\"",
            'name_ru': "Luxe Box \"Dior Backstage & Sol de Janeiro\"",
            'description_uz': "Eksklyuziv bayramona sovg'a savati: Dior Backstage paletkasi, Sol de Janeiro 59 va 87 tana parfyumlari, Sheglam kosmetikasi va atlas qizil lenta bilan bezatilgan shohona to'plam.",
            'description_ru': "Роскошная подарочная корзина с атласным бантом: оригинальная палетка Dior Backstage, ароматические мисты Sol de Janeiro 59/87, косметика Sheglam и уходовые средства.",
            'price': Decimal('890000'),
            'old_price': Decimal('1100000'),
            'cost_price': Decimal('550000'),
            'image_rel': 'products/crystall_gift_box.jpg',
            'is_featured': True,
            'stock': 6,
        },
        {
            'category_slug': 'sovga-bokslari',
            'slug': 'zielinski-rozen-nabor-6',
            'name_uz': "Zielinski & Rozen Miniatures Set (6 ta mini atir)",
            'name_ru': "Zielinski & Rozen Набор из 6 миниатюр",
            'description_uz': "6 xil eng xaridorgir Zielinski & Rozen iforlaridan iborat hashamatli to'plam. Har kuni yangi kayfiyat va obraz uchun!",
            'description_ru': "Стильный подарочный набор из 6 культовых миниатюр Zielinski & Rozen в фирменной упаковке. Идеальный подарок для ценителей ниши.",
            'price': Decimal('490000'),
            'old_price': Decimal('580000'),
            'cost_price': Decimal('300000'),
            'image_rel': 'products/tg_crystal_prod_14.jpg',
            'is_featured': True,
            'stock': 10,
        },
        {
            'category_slug': 'sovga-bokslari',
            'slug': 'zielinski-rozen-trio-nabor',
            'name_uz': "Zielinski & Rozen Trio Set (3 ta atir + Deodorant)",
            'name_ru': "Zielinski & Rozen Подарочное Трио",
            'description_uz': "Zielinski & Rozen trio to'plami: eng mashhur 3 ta kompozitsiya va parvarishlovchi deodorant.",
            'description_ru': "Подарочное трио Zielinski & Rozen с парфюмированным уходом и дезодорантом. Компактно и изысканно.",
            'price': Decimal('390000'),
            'old_price': Decimal('470000'),
            'cost_price': Decimal('230000'),
            'image_rel': 'products/tg_crystal_prod_15.jpg',
            'is_featured': False,
            'stock': 12,
        },
        {
            'category_slug': 'sovga-bokslari',
            'slug': 'qizil-atirgullar-yuragi-kompozitsiya',
            'name_uz': "\"Qizil Atirgullar Yuragi\" ulkan guldastasi",
            'name_ru': "Цветочная композиция \"Сердце из роз\"",
            'description_uz': "101 ta yangi qizil va oq atirgullardan tashkil topgan ulkan yurak kompozitsiyasi va bayramona geliy sharlar to'plami. Sevgi va hurmat ifodasi.",
            'description_ru': "Грандиозное сердце из 101 свежей розы с персональной буквой из белых лепестков и фольгированными шарами. Незабываемый сюрприз к любому празднику.",
            'price': Decimal('1100000'),
            'old_price': Decimal('1350000'),
            'cost_price': Decimal('650000'),
            'image_rel': 'products/crystall_rose_heart.jpg',
            'is_featured': True,
            'stock': 4,
        },

        # --- 5. Sumkalar & Aksessuarlar ---
        {
            'category_slug': 'sumkalar-aksessuarlar',
            'slug': 'klassik-ayollar-charm-sumkasi-baget',
            'name_uz': "Klassik ayollar charm sumkasi \"Crystall Baget\"",
            'name_ru': "Элегантная сумка-багет из мягкой эко-кожи",
            'description_uz': "Oltin rangli metall furniturali, zamonaviy va bejirim ayollar sumkasi. Yelkada qulay taqiladi, qimmatbaho ko'rinish beradi.",
            'description_ru': "Элегантная женская сумка через плечо с металлической фурнитурой под золото. Удобная форма багет, вместительное внутреннее отделение.",
            'price': Decimal('420000'),
            'old_price': Decimal('510000'),
            'cost_price': Decimal('240000'),
            'image_rel': 'products/crystal_leopard_dress.jpg',
            'is_featured': False,
            'stock': 15,
            'variations': [
                {'name_uz': 'Bej (Krem)', 'name_ru': 'Бежевый (Крем)', 'price': Decimal('420000'), 'stock': 5},
                {'name_uz': 'Klassik qora', 'name_ru': 'Классический черный', 'price': Decimal('420000'), 'stock': 5},
                {'name_uz': 'Qizil', 'name_ru': 'Насыщенный красный', 'price': Decimal('420000'), 'stock': 5},
            ]
        }
    ]

    for p_info in products_data:
        cat = categories[p_info['category_slug']]
        prod, _ = Product.objects.update_or_create(
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
            }
        )

        # Ensure ProductImage entry exists
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

        print(f"  + Product saved: {prod.name_ru} ({prod.price:,.0f} UZS)")

    print(f"\nAll products and categories seeded successfully for {store.name}!")

if __name__ == '__main__':
    seed()
