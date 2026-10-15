import os
import sys
import json
import socket
from decimal import Decimal
from concurrent.futures import ThreadPoolExecutor
import requests
import urllib3
import urllib3.util.connection

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
urllib3.util.connection.allowed_gai_family = lambda: socket.AF_INET

sys.path.insert(0, os.path.abspath('.'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'storebox.settings')
import django
django.setup()

import apps.catalog.translations
apps.catalog.translations.auto_translate_text = lambda text, *a, **k: text or ''

from apps.stores.models import Store
from apps.catalog.models import Product, Category, ProductImage, ProductVariation
from apps.orders.models import MarketingBanner

STORE_SUBDOMAIN = 'store-000002'
MEDIA_DIR = os.path.join('media', 'products', 'crystallami')
os.makedirs(MEDIA_DIR, exist_ok=True)

SESSION = requests.Session()
SESSION.trust_env = False
HEADERS = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'}


def download_single_image(args):
    url, dest_filename = args
    local_path = os.path.join(MEDIA_DIR, dest_filename)
    if os.path.exists(local_path) and os.path.getsize(local_path) > 2048:
        return dest_filename, f"products/crystallami/{dest_filename}"

    clean_url = url.replace('http://109.172.36.219:9000/photos/', 'https://psihclothes.com/photos/')
    if not clean_url.startswith('http'):
        clean_url = f"https://psihclothes.com{clean_url}"

    try:
        resp = SESSION.get(clean_url, headers=HEADERS, timeout=12, verify=False)
        if resp.status_code == 200 and len(resp.content) > 1000:
            with open(local_path, 'wb') as f:
                f.write(resp.content)
            return dest_filename, f"products/crystallami/{dest_filename}"
    except Exception as e:
        print(f"Error downloading {clean_url}: {e}")
    return dest_filename, ""


def main():
    store = Store.objects.filter(subdomain=STORE_SUBDOMAIN).first()
    if not store:
        print(f"Store {STORE_SUBDOMAIN} not found!")
        return

    print(f"Configuring store: {store.name} (ID: {store.id})")
    store.name = "CRYSTAL LAMI"
    store.theme_template = "streetwear"
    store.default_language = "ru"
    store.currency = "UZS"
    store.save()

    # 1. Marketing Campaign Banner
    banner_img_path = "products/crystallami/hero_banner_women.jpg"
    MarketingBanner.objects.filter(store=store).delete()
    MarketingBanner.objects.create(
        store=store,
        title="CRYSTAL LAMI — WOMEN COLLECTION",
        subtitle="АВТОРСКИЙ СТРИТВИР И ЛЮКСОВЫЕ СИЛУЭТЫ",
        image=banner_img_path,
        is_active=True,
        sort_order=0
    )
    print("Created Campaign Banner: hero_banner_women.jpg")

    # 2. Setup Categories (Strictly Women's)
    cat_defs = [
        {"slug": "clothing", "ru": "Одежда", "en": "Clothing", "uz": "Kiyimlar", "order": 1},
        {"slug": "shoes", "ru": "Обувь", "en": "Shoes & Boots", "uz": "Poyabzallar", "order": 2},
        {"slug": "sneakers", "ru": "Кроссовки", "en": "Sneakers", "uz": "Krossovkalar", "order": 3},
        {"slug": "bags", "ru": "Сумки", "en": "Bags & Clutches", "uz": "Sumkalar", "order": 4},
        {"slug": "accessories", "ru": "Аксессуары", "en": "Accessories", "uz": "Aksessuarlar", "order": 5},
        {"slug": "fragrance", "ru": "Парфюмерия и уход", "en": "Fragrance & Care", "uz": "Atirlar va parvarish", "order": 6},
    ]

    categories = {}
    for cd in cat_defs:
        c, _ = Category.objects.get_or_create(
            store=store,
            slug=cd["slug"],
            defaults={
                "name_ru": cd["ru"],
                "name_en": cd["en"],
                "name_uz": cd["uz"],
                "sort_order": cd["order"],
                "is_active": True
            }
        )
        c.name_ru = cd["ru"]
        c.name_en = cd["en"]
        c.name_uz = cd["uz"]
        c.sort_order = cd["order"]
        c.is_active = True
        c.save()
        categories[cd["slug"]] = c

    Category.objects.filter(store=store).exclude(slug__in=categories.keys()).update(is_active=False)

    # 3. Clean existing products for Store 83
    Product.objects.filter(store=store).delete()
    print("Cleared old products for clean catalog rebuild.")

    created_count = 0

    # 4. Import 30 Women's Lookbook items from Psihclothes
    with open('scratch/all_psihclothes_products.json', encoding='utf-8') as f:
        psih_products = json.load(f)

    clothing_candidates = []
    for p in psih_products:
        imgs = p.get('images', [])
        w_imgs = [i['file'] for i in imgs if i.get('gender') == 'women']
        m_imgs = [i['file'] for i in imgs if i.get('gender') is None or i.get('gender') == 'women']
        if len(w_imgs) >= 1 and len(m_imgs) >= 1:
            clothing_candidates.append((p, w_imgs, m_imgs))

    download_tasks = []
    product_specs = []
    for p, w_imgs, m_imgs in clothing_candidates[:30]:
        model_url = w_imgs[0]
        mockup_url = m_imgs[0] if m_imgs[0] != model_url else (m_imgs[1] if len(m_imgs) > 1 else m_imgs[0])
        model_name = f"{p['slug']}_model.jpg"
        mockup_name = f"{p['slug']}_mockup.jpg"

        download_tasks.append((model_url, model_name))
        download_tasks.append((mockup_url, mockup_name))

        gal_names = []
        for g_idx, extra_url in enumerate(w_imgs[1:3]):
            if extra_url not in [model_url, mockup_url]:
                g_name = f"{p['slug']}_gal_{g_idx+2}.jpg"
                download_tasks.append((extra_url, g_name))
                gal_names.append(g_name)

        product_specs.append((p, model_name, mockup_name, gal_names))

    downloaded_map = {}
    with ThreadPoolExecutor(max_workers=10) as executor:
        results = executor.map(download_single_image, download_tasks)
        for dest_fn, path in results:
            if path:
                downloaded_map[dest_fn] = path

    for p, model_name, mockup_name, gal_names in product_specs:
        model_path = downloaded_map.get(model_name)
        mockup_path = downloaded_map.get(mockup_name)
        if not model_path or not mockup_path:
            continue

        p_slug = f"{p['slug']}-{store.id}"
        price_rub = float(p.get('price', 6000))
        price_uzs = int(round(price_rub * 140, -4))
        old_price_rub = float(p.get('discount_price') or price_rub * 1.25)
        old_price_uzs = int(round(old_price_rub * 160, -4)) if old_price_rub > price_rub else None

        desc = p.get('description') or ''
        custom_sec = p.get('custom_sections', [])
        for cs in custom_sec:
            desc += f"\n\n**{cs.get('title', '').strip().upper()}**:\n{cs.get('content', '').strip()}"

        title = p['title'].upper().strip()
        prod = Product.objects.create(
            store=store,
            category=categories['clothing'],
            name_ru=title,
            name_en=title,
            name_uz=title,
            name_tr=title,
            slug=p_slug,
            description_ru=desc,
            description_en=p.get('description_en') or desc,
            description_uz=desc,
            description_tr=desc,
            price=Decimal(str(price_uzs)),
            old_price=Decimal(str(old_price_uzs)) if old_price_uzs else None,
            stock=100,
            is_active=True,
            is_featured=created_count < 4,
        )

        ProductImage.objects.create(product=prod, image=model_path, is_primary=True, sort_order=0)
        ProductImage.objects.create(product=prod, image=mockup_path, is_primary=False, sort_order=1)

        for g_idx, g_name in enumerate(gal_names):
            g_path = downloaded_map.get(g_name)
            if g_path:
                ProductImage.objects.create(product=prod, image=g_path, is_primary=False, sort_order=g_idx+2)

        sizes = ['XS', 'S', 'M', 'L', 'XL']
        if p.get('sizes'):
            p_sizes = [s['size'] for s in p['sizes'] if s.get('size')]
            if p_sizes:
                sizes = p_sizes

        for s_idx, sz in enumerate(sizes):
            ProductVariation.objects.create(
                product=prod,
                name_ru=sz,
                name_en=sz,
                name_uz=sz,
                name_tr=sz,
                price=prod.price,
                stock=25,
                is_active=True,
                sort_order=s_idx
            )

        created_count += 1

    print(f"Created {created_count} lookbook clothing products.")

    # 5. Boutique Apparel & Dresses (7 items)
    boutique_apparel = [
        {
            "slug": "dress_1",
            "title": "OFF-SHOULDER ROSETTE MAXI DRESS",
            "price": 3450000,
            "old_price": 4100000,
            "desc": "Вечернее платье макси с открытыми плечами, скульптурным цветочным элементом ручной работы и струящимися рукавами из шифона.\n\n**СОСТАВ**:\n100% шелковый шифон, подкладка 100% шелк.\n\n**УХОД**:\nСухая чистка.",
            "sizes": ["XS", "S", "M", "L"]
        },
        {
            "slug": "dress_2",
            "title": "ASYMMETRIC TAILORED BLAZER DRESS",
            "price": 2890000,
            "old_price": 3350000,
            "desc": "Асимметричное платье-жакет в чисто-белом оттенке со строгим лацканом и кристальными акцентными пуговицами.\n\n**СОСТАВ**:\nКостюмная шерсть с шелком 70/30.\n\n**УХОД**:\nСухая чистка.",
            "sizes": ["XS", "S", "M", "L"]
        },
        {
            "slug": "dress_3",
            "title": "PLUSH FAUX-FUR BOMBER JACKET",
            "price": 2650000,
            "old_price": 3150000,
            "desc": "Укороченный объемный бомбер из нежнейшего белоснежного эко-меха с высоким воротником-стойкой на молнии.\n\n**СОСТАВ**:\nПремиальный эко-мех под норку, подкладка 100% шелк.",
            "sizes": ["S", "M", "L"]
        },
        {
            "slug": "dress_4",
            "title": "MAGENTA SATIN DRAPED MAXI GOWN",
            "price": 3200000,
            "old_price": 3850000,
            "desc": "Вечернее струящееся шелковое платье в оттенке фуксия с драпированным силуэтом и открытой спиной.\n\n**СОСТАВ**:\n100% натуральный шелк сатин.",
            "sizes": ["XS", "S", "M", "L"]
        },
        {
            "slug": "apparel_windbreaker",
            "title": "SHEER FLORAL ORGANZA BOMBER",
            "price": 1980000,
            "old_price": 2400000,
            "desc": "Прозрачная ветровка-бомбер из шелковой органзы с флористической вышивкой и трикотажными манжетами.\n\n**СОСТАВ**:\n100% органза.",
            "sizes": ["S", "M", "L"]
        },
        {
            "slug": "apparel_blouse",
            "title": "POLKA DOT RETRO CHIFFON BLOUSE",
            "price": 1450000,
            "old_price": 1750000,
            "desc": "Шелковая блуза в винтажный горошек с пышными рукавами-буфами и акцентным воротником.\n\n**СОСТАВ**:\n100% шелковый шифон.",
            "sizes": ["XS", "S", "M", "L"]
        },
        {
            "slug": "apparel_jeans",
            "title": "DISTRESSED WIDE-LEG BOYFRIEND JEANS",
            "price": 1650000,
            "old_price": 1990000,
            "desc": "Свободные широкие джинсы из плотного японского денима с ручными потертостями и необработанным краем.\n\n**СОСТАВ**:\n100% органический хлопок 14 oz.",
            "sizes": ["26", "27", "28", "29", "30"]
        },
    ]

    for item in boutique_apparel:
        slug = item["slug"]
        model_img = f"products/crystallami/{slug}_model.jpg"
        mockup_img = f"products/crystallami/{slug}_mockup.jpg"
        prod = Product.objects.create(
            store=store,
            category=categories['clothing'],
            name_ru=item['title'],
            name_en=item['title'],
            name_uz=item['title'],
            name_tr=item['title'],
            slug=f"{slug}-{store.id}",
            description_ru=item['desc'],
            description_en=item['desc'],
            description_uz=item['desc'],
            description_tr=item['desc'],
            price=Decimal(str(item['price'])),
            old_price=Decimal(str(item['old_price'])),
            stock=50,
            is_active=True,
            is_featured=True,
        )
        ProductImage.objects.create(product=prod, image=model_img, is_primary=True, sort_order=0)
        ProductImage.objects.create(product=prod, image=mockup_img, is_primary=False, sort_order=1)

        for s_idx, sz in enumerate(item["sizes"]):
            ProductVariation.objects.create(
                product=prod,
                name_ru=sz,
                name_en=sz,
                name_uz=sz,
                name_tr=sz,
                price=prod.price,
                stock=15,
                is_active=True,
                sort_order=s_idx
            )
        created_count += 1

    print("Added 7 Boutique Apparel & Dresses.")

    # 6. Shoes (11 Distinct Footwear Models)
    shoes_data = [
        {"slug": "shoe_1", "title": "PYTHON LEATHER STILETTO ANKLE BOOTS", "price": 2750000, "old_price": 3250000, "desc": "Остроносые ботильоны из фактурной змеиной кожи на изящной шпильке.\n\n**СОСТАВ**:\n100% натуральная кожа с тиснением под питона, подошва кожа.\n\n**РАЗМЕРЫ**:\nИдут размер в размер."},
        {"slug": "shoe_2", "title": "CLEAR VINYL MULES (NOIR INSOLE)", "price": 1850000, "old_price": 2250000, "desc": "Мюли из прозрачного мягкого винила с черной кожаной стелькой на устойчивом геометричном каблуке.\n\n**СОСТАВ**:\nПрозрачный полимер TPU, натуральная кожа."},
        {"slug": "shoe_3", "title": "CLEAR VINYL MULES (IVORY INSOLE)", "price": 1850000, "old_price": 2250000, "desc": "Прозрачные мюли со светлой стелькой цвета слоновой кости на прозрачном монолитном каблуке.\n\n**СОСТАВ**:\nПрозрачный полимер TPU, натуральная кожа Nappa."},
        {"slug": "shoe_4", "title": "NUDE PATENT PLEATED SLINGBACK PUMPS", "price": 2150000, "old_price": 2590000, "desc": "Элегантные нюдовые лакированные туфли с открытой пяткой и плиссированным мысом на тонкой шпильке.\n\n**СОСТАВ**:\n100% лакированная телячья кожа."},
        {"slug": "shoe_5", "title": "BURGUNDY SLINGBACKS WITH GOLD TOE CAP", "price": 2350000, "old_price": 2800000, "desc": "Остроносые слингбэки в винном бордовом лаке с полированным золотым металлическим мыском.\n\n**СОСТАВ**:\nЛакированная кожа, фурнитура из ювелирной латуни."},
        {"slug": "shoe_6", "title": "NOIR PATENT POINTED STILETTO PUMPS", "price": 2290000, "old_price": 2750000, "desc": "Классические безупречные лодочки из глубокого черного лака на идеальной 10-сантиметровой шпильке.\n\n**СОСТАВ**:\n100% премиальная лаковая кожа Box Calf."},
        {"slug": "shoe_7", "title": "TAUPE SUEDE TWISTED KNOT MULES", "price": 1790000, "old_price": 2150000, "desc": "Плоские мюли-шлепанцы из бархатистой замши оттенка тауп с объемным декоративным узлом.\n\n**СОСТАВ**:\n100% итальянская замша шевро, стелька из мягкой кожи."},
        {"slug": "shoe_8", "title": "IVORY CROC-EMBOSSED GOLD-HEEL PUMPS", "price": 2490000, "old_price": 2990000, "desc": "Туфли цвета слоновой кости с тиснением под крокодила и архитектурным золотым зеркальным каблуком.\n\n**СОСТАВ**:\nНатуральная тисненая кожа, металлический каблук."},
        {"slug": "shoe_9", "title": "MONOGRAM LEATHER SLIDE SANDALS", "price": 1950000, "old_price": 2350000, "desc": "Летние кожаные шлепанцы с монограммным ремешком и золотой гравированной пряжкой.\n\n**СОСТАВ**:\n100% телячья кожа, анатомическая стелька."},
        {"slug": "shoe_10", "title": "BLACK PATENT CRISS-CROSS SLINGBACKS", "price": 2390000, "old_price": 2890000, "desc": "Глянцевые черные лаковые туфли с тонкими перекрестными ремешками на щиколотке и золотыми пряжками.\n\n**СОСТАВ**:\n100% лакированная кожа."},
        {"slug": "shoe_11", "title": "SCULPTED HOURGLASS GOLD-CAP SLINGBACKS", "price": 2590000, "old_price": 3100000, "desc": "Авангардные черные слингбэки с расклешенным каблуком «песочные часы» и скульптурным золотым носком.\n\n**СОСТАВ**:\nЛакированная кожа Nappa, гальванизированный металл."},
    ]

    for s_idx, sh in enumerate(shoes_data):
        slug = sh['slug']
        prod = Product.objects.create(
            store=store,
            category=categories['shoes'],
            name_ru=sh['title'],
            name_en=sh['title'],
            name_uz=sh['title'],
            name_tr=sh['title'],
            slug=f"shoe-{s_idx+1}-{store.id}",
            description_ru=sh['desc'],
            description_en=sh['desc'],
            description_uz=sh['desc'],
            description_tr=sh['desc'],
            price=Decimal(str(sh['price'])),
            old_price=Decimal(str(sh['old_price'])),
            stock=40,
            is_active=True,
            is_featured=s_idx < 3,
        )
        ProductImage.objects.create(product=prod, image=f"products/crystallami/{slug}_model.jpg", is_primary=True, sort_order=0)
        ProductImage.objects.create(product=prod, image=f"products/crystallami/{slug}_mockup.jpg", is_primary=False, sort_order=1)

        for sz in ['36', '37', '38', '39', '40']:
            ProductVariation.objects.create(
                product=prod,
                name_ru=f"Размер {sz}",
                name_en=f"Size {sz}",
                name_uz=f"{sz}-o'lcham",
                name_tr=f"Beden {sz}",
                price=prod.price,
                stock=10,
                is_active=True
            )
        created_count += 1

    print("Created 11 Shoes products.")

    # 7. Sneakers (5 Distinct Models)
    sneakers_data = [
        {"slug": "sneaker_1", "title": "NOIR SUEDE & SHEARLING WINTER SNEAKERS", "price": 2190000, "old_price": 2650000, "desc": "Зимние кроссовки из кожи и замши с подкладкой из натуральной овчины на массивной подошве.\n\n**СОСТАВ**:\n100% телячья кожа, овчина shearling, подошва EVA."},
        {"slug": "sneaker_2", "title": "CHOCOLATE SUEDE SHEARLING SNEAKERS", "price": 2190000, "old_price": 2650000, "desc": "Теплые кроссовки из благородной шоколадной замши с меховой отделкой и прочной подошвой.\n\n**СОСТАВ**:\nНатуральная замша, натуральный мех."},
        {"slug": "sneaker_3", "title": "SMOKE GREY FUR & SNAKESKIN SNEAKERS", "price": 2290000, "old_price": 2750000, "desc": "Фактурные кроссовки из серой замши и кожи рептилии с мягким меховым кантом.\n\n**СОСТАВ**:\nКожа с тиснением, натуральная замша, мех."},
        {"slug": "sneaker_4", "title": "IVORY CALFSKIN CHUNKY SNEAKER-BOOTS", "price": 2450000, "old_price": 2950000, "desc": "Высокие кроссовки-ботинки цвета слоновой кости с золотистой пряжкой-цепочкой.\n\n**СОСТАВ**:\n100% гладкая кожа, металлическая фурнитура."},
        {"slug": "sneaker_5", "title": "BOUNCING MESH & LEATHER RUNNERS", "price": 2100000, "old_price": 2550000, "desc": "Люксовые кроссовки-раннеры из комбинации дышащей сетки и кожи на контрастной платформе.\n\n**СОСТАВ**:\nТелячья кожа, технический текстиль mesh, резина."},
    ]

    for sn_idx, sn in enumerate(sneakers_data):
        slug = sn['slug']
        prod = Product.objects.create(
            store=store,
            category=categories['sneakers'],
            name_ru=sn['title'],
            name_en=sn['title'],
            name_uz=sn['title'],
            name_tr=sn['title'],
            slug=f"sneaker-{sn_idx+1}-{store.id}",
            description_ru=sn['desc'],
            description_en=sn['desc'],
            description_uz=sn['desc'],
            description_tr=sn['desc'],
            price=Decimal(str(sn['price'])),
            old_price=Decimal(str(sn['old_price'])),
            stock=30,
            is_active=True,
            is_featured=sn_idx < 2,
        )
        ProductImage.objects.create(product=prod, image=f"products/crystallami/{slug}_model.jpg", is_primary=True, sort_order=0)
        ProductImage.objects.create(product=prod, image=f"products/crystallami/{slug}_mockup.jpg", is_primary=False, sort_order=1)

        for sz in ['36', '37', '38', '39', '40']:
            ProductVariation.objects.create(
                product=prod,
                name_ru=f"Размер {sz}",
                name_en=f"Size {sz}",
                name_uz=f"{sz}-o'lcham",
                name_tr=f"Beden {sz}",
                price=prod.price,
                stock=10,
                is_active=True
            )
        created_count += 1

    print("Created 5 Sneakers products.")

    # 8. Bags & Clutches (16 Distinct Models)
    bags_data = [
        {"slug": "bag_1", "title": "MONOGRAM VANITY CASE TOP-HANDLE BAG", "price": 2350000, "old_price": 2850000, "desc": "Сумка-бокс в фирменной канве с монограммой, кожаной ручкой и круговой золотой молнией.\n\n**СОСТАВ**:\nКанва с покрытием, отделка натуральной кожей."},
        {"slug": "bag_2", "title": "SAFFIANO LEATHER STRUCTURED TOTE", "price": 2890000, "old_price": 3450000, "desc": "Вместительная структурированная сумка-тоут из сафьяновой кожи нейтрального бежевого оттенка.\n\n**СОСТАВ**:\n100% кожа Saffiano, фурнитура золото."},
        {"slug": "bag_3", "title": "MINI KELLY WITH SILK TWILLY SCARF", "price": 3190000, "old_price": 3890000, "desc": "Культовая мини-сумка в коже оттенка тауп с шелковым платком твилли на ручке и замком.\n\n**СОСТАВ**:\nКожа Epsom, шелк 100%."},
        {"slug": "bag_4", "title": "CANVAS & LEATHER CRESCENT HOBO BAG", "price": 2450000, "old_price": 2950000, "desc": "Сумка-полумесяц из плотной светлой парусины и бежевой кожи на широком ремне кроссбоди.\n\n**СОСТАВ**:\nХлопковый канвас, натуральная кожа."},
        {"slug": "bag_5", "title": "BEIGE QUILTED CAVIAR CLASSIC FLAP BAG", "price": 3290000, "old_price": 3950000, "desc": "Стеганая сумка на плечо из зернистой кожи Caviar с цепочкой, переплетенной кожей.\n\n**СОСТАВ**:\nЗернистая телячья кожа Caviar."},
        {"slug": "bag_6", "title": "BLACK QUILTED CHEVRON VANITY CASE", "price": 2650000, "old_price": 3150000, "desc": "Цилиндрическая сумка-бьюти кейс из стеганой кожи с золотой монограммой и ручкой.\n\n**СОСТАВ**:\n100% мягкая кожа ягненка."},
        {"slug": "bag_7", "title": "BICOLOR KELLY 25 IN DOVE & CHOCOLATE", "price": 3450000, "old_price": 4150000, "desc": "Двухцветная сумка Kelly 25 из зернистой кожи в серо-шоколадном сочетании с поворотным замком.\n\n**СОСТАВ**:\nКожа Clemence."},
        {"slug": "bag_8", "title": "ARCHITECTURAL CURVED CALFSKIN HOBO", "price": 2550000, "old_price": 3050000, "desc": "Минималистичная изогнутая сумка на плечо из шелковистой кожи теленка в светло-сером цвете.\n\n**СОСТАВ**:\n100% гладкая кожа Box Calf."},
        {"slug": "bag_9", "title": "DIONYSUS GG SUPREME MINI SHOULDER BAG", "price": 2750000, "old_price": 3300000, "desc": "Мини-сумка на плечо в черной канве GG Supreme с фактурной металлической пряжкой-подковой.\n\n**СОСТАВ**:\nКанва GG Supreme, посеребренная латунь."},
        {"slug": "bag_10", "title": "EMERALD VLOGO MINI TOP-HANDLE BAG", "price": 2690000, "old_price": 3250000, "desc": "Изумрудно-зеленая компактная сумка с жесткой верхней ручкой и выразительным золотым логотипом.\n\n**СОСТАВ**:\n100% кожа теленка."},
        {"slug": "bag_11", "title": "RHINESTONE HOURGLASS EVENING BAG", "price": 2990000, "old_price": 3600000, "desc": "Вечерняя сияющая сумка силуэта «песочные часы», усыпанная кристаллами страз.\n\n**СОСТАВ**:\nКристаллы Strass, металлическая основа."},
        {"slug": "bag_12", "title": "MATTE BLACK EMBOSSED LEATHER BOOK TOTE", "price": 3150000, "old_price": 3750000, "desc": "Вместительная сумка-шоппер из матовой черной тисненой кожи с прочными ручками.\n\n**СОСТАВ**:\n100% тисненая телячья кожа."},
        {"slug": "bag_13", "title": "OPHIDIA GG MONOGRAM CANVAS ZIP CLUTCH", "price": 1890000, "old_price": 2290000, "desc": "Плоский клатч на молнии в монограммной канве с фирменной красно-зеленой лентой Web.\n\n**СОСТАВ**:\nКанва с монограммой, текстиль, кожа."},
        {"slug": "bag_14", "title": "DENIM JACQUARD LOVE BIRDS FLAP BAG", "price": 2250000, "old_price": 2690000, "desc": "Джинсовая сумка с клапаном из жаккардового денима с металлической пряжкой Love Birds.\n\n**СОСТАВ**:\nЖаккардовый деним, античная бронза."},
        {"slug": "bag_15", "title": "NAVY CALFSKIN MINIMALIST SATCHEL", "price": 2390000, "old_price": 2890000, "desc": "Элегантная темно-синяя сумка из гладкой кожи с тонкими регулируемыми ручками.\n\n**СОСТАВ**:\n100% натуральная кожа Nappa."},
        {"slug": "bag_16", "title": "VALENTINO CRISTALLO EVENING CLUTCH", "price": 2190000, "old_price": 2650000, "desc": "Жесткий вечерний клатч из черного сатина, инкрустированный кристаллами с золотым акцентом.\n\n**СОСТАВ**:\nШелковый сатин, кристаллы, латунь."},
    ]

    for b_idx, bg in enumerate(bags_data):
        slug = bg['slug']
        prod = Product.objects.create(
            store=store,
            category=categories['bags'],
            name_ru=bg['title'],
            name_en=bg['title'],
            name_uz=bg['title'],
            name_tr=bg['title'],
            slug=f"bag-{b_idx+1}-{store.id}",
            description_ru=bg['desc'],
            description_en=bg['desc'],
            description_uz=bg['desc'],
            description_tr=bg['desc'],
            price=Decimal(str(bg['price'])),
            old_price=Decimal(str(bg['old_price'])),
            stock=25,
            is_active=True,
            is_featured=b_idx < 3,
        )
        ProductImage.objects.create(product=prod, image=f"products/crystallami/{slug}_model.jpg", is_primary=True, sort_order=0)
        ProductImage.objects.create(product=prod, image=f"products/crystallami/{slug}_mockup.jpg", is_primary=False, sort_order=1)
        ProductVariation.objects.create(product=prod, name_ru="ONE SIZE", name_en="ONE SIZE", name_uz="Yagona o'lcham", name_tr="Standart Beden", price=prod.price, stock=25, is_active=True)
        created_count += 1

    print("Created 16 Bags products.")

    # 9. Accessories & Headwear (7 Distinct Models)
    acc_data = [
        {"slug": "cap_1", "title": "MONOGRAM JACQUARD MAUVE BASEBALL CAP", "price": 690000, "old_price": 890000, "desc": "Бейсболка из жаккардового монограммного полотна в пыльно-розовом оттенке.\n\n**СОСТАВ**:\nЖаккардовый хлопок."},
        {"slug": "cap_2", "title": "PRISTINE WHITE EMBROIDERED LOGO CAP", "price": 650000, "old_price": 850000, "desc": "Белоснежная кепка из плотного твила с контрастной вышивкой логотипа.\n\n**СОСТАВ**:\n100% хлопок твил."},
        {"slug": "cap_3", "title": "PASTEL PINK TRIOMPHE BASEBALL CAP", "price": 690000, "old_price": 890000, "desc": "Нежно-розовая бейсболка с вышитой эмблемой Triomphe и регулируемым ремешком.\n\n**СОСТАВ**:\n100% органический хлопок."},
        {"slug": "hat_1", "title": "IVORY STRAW SUN HAT WITH SATIN BOW", "price": 950000, "old_price": 1200000, "desc": "Летняя соломенная шляпа молочного цвета с атласным бантом и жемчужной брошью.\n\n**СОСТАВ**:\n100% натуральная соломка токилья, атлас."},
        {"slug": "hat_2", "title": "BLACK WOVEN STRAW BUCKET HAT WITH PEARLS", "price": 990000, "old_price": 1250000, "desc": "Черная плетеная панама с отделкой из белых жемчужин и цветком камелии.\n\n**СОСТАВ**:\nНатуральная плетеная соломка, искусственный жемчуг."},
        {"slug": "hat_3", "title": "NATURAL STRAW CLOCHE WITH GROSGRAIN BAND", "price": 920000, "old_price": 1150000, "desc": "Шляпа-клош теплого соломенного оттенка с черной репсовой лентой.\n\n**СОСТАВ**:\n100% натуральная соломка."},
        {"slug": "belt_1", "title": "BLACK CALFSKIN KELLY TURN-LOCK BELT", "price": 850000, "old_price": 1100000, "desc": "Ремень из черной кожи теленка с поворотной золотистой застежкой Kelly.\n\n**СОСТАВ**:\n100% гладкая кожа, пряжка латунь."},
    ]

    for a_idx, ac in enumerate(acc_data):
        slug = ac['slug']
        prod = Product.objects.create(
            store=store,
            category=categories['accessories'],
            name_ru=ac['title'],
            name_en=ac['title'],
            name_uz=ac['title'],
            name_tr=ac['title'],
            slug=f"acc-{a_idx+1}-{store.id}",
            description_ru=ac['desc'],
            description_en=ac['desc'],
            description_uz=ac['desc'],
            description_tr=ac['desc'],
            price=Decimal(str(ac['price'])),
            old_price=Decimal(str(ac['old_price'])),
            stock=45,
            is_active=True,
            is_featured=a_idx < 2,
        )
        ProductImage.objects.create(product=prod, image=f"products/crystallami/{slug}_model.jpg", is_primary=True, sort_order=0)
        ProductImage.objects.create(product=prod, image=f"products/crystallami/{slug}_mockup.jpg", is_primary=False, sort_order=1)
        ProductVariation.objects.create(product=prod, name_ru="ONE SIZE", name_en="ONE SIZE", name_uz="Yagona o'lcham", name_tr="Standart Beden", price=prod.price, stock=45, is_active=True)
        created_count += 1

    print("Created 7 Accessories products.")

    # 10. Perfumery & Care (15 Distinct Models)
    frag_data = [
        {"slug": "perfume_1", "title": "BVLGARI LE GEMME TYGAR (100ML)", "price": 2100000, "old_price": 2500000, "desc": "Глубокий древесно-цитрусовый селективный аромат: грейпфрут, амброксан и ценные древесные породы.", "vol": "100 ml"},
        {"slug": "perfume_2", "title": "VALENTINO DONNA BORN IN ROMA (100ML)", "price": 1950000, "old_price": 2350000, "desc": "Кутюрный цветочно-амбровый аромат: жасмин, розовая смородина и бурбонская ваниль.", "vol": "100 ml"},
        {"slug": "perfume_3", "title": "YSL LIBRE LE PARFUM (90ML)", "price": 1980000, "old_price": 2400000, "desc": "Пряная теплая композиция с лавандой, цветком апельсина, шафраном и медовой ванилью.", "vol": "90 ml"},
        {"slug": "perfume_4", "title": "VILHELM PARFUMERIE MANGO SKIN (100ML)", "price": 1890000, "old_price": 2250000, "desc": "Сочный тропический шлейф: спелое манго, ежевика, черный лотос и пачули.", "vol": "100 ml"},
        {"slug": "perfume_5", "title": "TOM FORD SOLEIL NEIGE (100ML)", "price": 2450000, "old_price": 2950000, "desc": "Искрящийся морозный аромат зимнего солнца: белые цветы, бергамот, семена моркови и смола бензоин.", "vol": "100 ml"},
        {"slug": "perfume_6", "title": "MFK 724 EAU DE PARFUM (70ML)", "price": 2250000, "old_price": 2700000, "desc": "Светлая городская свежесть: альдегиды, калабрийский бергамот, египетский жасмин и белый мускус.", "vol": "70 ml"},
        {"slug": "perfume_7", "title": "MARC-ANTOINE BARROIS GANYMEDE (100ML)", "price": 1950000, "old_price": 2350000, "desc": "Знаковый минерально-кожаный аромат с нотами замши, бессмертника, мандарина и акигалавуда.", "vol": "100 ml"},
        {"slug": "perfume_8", "title": "CREED AVENTUS FOR HER (75ML)", "price": 2650000, "old_price": 3150000, "desc": "Королевский цветочно-фруктовый аромат: зеленое яблоко, розовый перец, калабрийский бергамот и роза.", "vol": "75 ml"},
        {"slug": "perfume_9", "title": "LOUIS VUITTON LES EXTRAITS SYMPHONY (100ML)", "price": 2950000, "old_price": 3500000, "desc": "Возвышенный сверкающий концентрат: грейпфрут, бергамот и имбирь в скульптурном хрустальном флаконе.", "vol": "100 ml"},
        {"slug": "lotion_1", "title": "HFC PARIS VELVET FRAGRANCE BODY LOTION (250ML)", "price": 750000, "old_price": 950000, "desc": "Увлажняющий парфюмированный лосьон для тела с бархатистой текстурой и роскошным шлейфом.", "vol": "250 ml"},
        {"slug": "lotion_2", "title": "VICTORIA'S SECRET VELVET PETALS SHIMMER (236ML)", "price": 490000, "old_price": 650000, "desc": "Мерцающий крем-лосьон для тела с ароматом сладкого миндаля и бархатных цветочных лепестков.", "vol": "236 ml"},
        {"slug": "lotion_3", "title": "SOL DE JANEIRO BRAZILIAN BUM BUM CREAM (240ML)", "price": 680000, "old_price": 850000, "desc": "Подтягивающий крем для тела с экстрактом гуараны и ароматом фисташки и соленой карамели Cheirosa 62.", "vol": "240 ml"},
        {"slug": "lotion_4", "title": "BYREDO BLANCHE HYDRATING BODY LOTION (225ML)", "price": 790000, "old_price": 990000, "desc": "Утонченный увлажняющий лосьон с чистым ароматом белой розы, нероли и сандалового дерева.", "vol": "225 ml"},
        {"slug": "lotion_5", "title": "JO MALONE ENGLISH PEAR & FREESIA LOTION (250ML)", "price": 850000, "old_price": 1050000, "desc": "Легкий тающий крем для тела с ароматом спелой груши, белой фрезии и пачули.", "vol": "250 ml"},
        {"slug": "lotion_6", "title": "MOLECULE 02 BEAUTIFUL BODY LOTION (250ML)", "price": 690000, "old_price": 890000, "desc": "Нежный крем-лосьон с чистой нотой амброксана, мгновенно впитывающийся и смягчающий кожу.", "vol": "250 ml"},
    ]

    for f_idx, fg in enumerate(frag_data):
        slug = fg['slug']
        prod = Product.objects.create(
            store=store,
            category=categories['fragrance'],
            name_ru=fg['title'],
            name_en=fg['title'],
            name_uz=fg['title'],
            name_tr=fg['title'],
            slug=f"frag-{f_idx+1}-{store.id}",
            description_ru=fg['desc'],
            description_en=fg['desc'],
            description_uz=fg['desc'],
            description_tr=fg['desc'],
            price=Decimal(str(fg['price'])),
            old_price=Decimal(str(fg.get('old_price') or fg['price'] * 1.25)),
            stock=50,
            is_active=True,
            is_featured=f_idx < 2,
        )
        ProductImage.objects.create(product=prod, image=f"products/crystallami/{slug}_model.jpg", is_primary=True, sort_order=0)
        ProductImage.objects.create(product=prod, image=f"products/crystallami/{slug}_mockup.jpg", is_primary=False, sort_order=1)
        ProductVariation.objects.create(product=prod, name_ru=fg['vol'], name_en=fg['vol'], name_uz=fg['vol'], name_tr=fg['vol'], price=prod.price, stock=50, is_active=True)
        created_count += 1

    print("Created 15 Perfumery & Care products.")
    print(f"\n==========================================")
    print(f"CATALOG BUILD COMPLETE! Total products: {created_count}")
    print(f"Store: {store.name} ({store.subdomain})")
    print(f"==========================================")


if __name__ == "__main__":
    main()
