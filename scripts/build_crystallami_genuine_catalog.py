import os
import sys
import json
import time
import base64
import socket
import io
import urllib.parse
from PIL import Image
import requests
import urllib3.util.connection

urllib3.util.connection.allowed_gai_family = lambda: socket.AF_INET

# Django setup
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'storebox.settings')
import django
django.setup()

from django.utils.text import slugify
from apps.stores.models import Store
from apps.catalog.models import Category, Product, ProductImage, ProductVariation
from apps.orders.models import MarketingBanner

# Load API keys from .env
GEMINI_API_KEY = ""
POLLINATIONS_API_KEY = "sk_YCfYsnTkM1HHC5hUR222zY78u2RyExm1"

if os.path.exists('.env'):
    with open('.env') as f:
        for line in f:
            if line.startswith('GEMINI_API_KEY='):
                GEMINI_API_KEY = line.strip().split('=', 1)[1].strip('"\'')
            elif line.startswith('POLLINATIONS_API_KEY='):
                POLLINATIONS_API_KEY = line.strip().split('=', 1)[1].strip('"\'')

CAT_CONFIG = {
    'ветровка': {'slug': 'outerwear', 'name_ru': 'Верхняя одежда', 'name_uz': 'Ustki kiyimlar', 'sort': 1, 'sizes': ['S (42)', 'M (44)', 'L (46)']},
    'платья': {'slug': 'dresses', 'name_ru': 'Платья', 'name_uz': 'Ko‘ylaklar', 'sort': 2, 'sizes': ['XS (40)', 'S (42)', 'M (44)', 'L (46)']},
    'кофта': {'slug': 'knitwear', 'name_ru': 'Кофты и кардиганы', 'name_uz': 'Koftalar va kardiganlar', 'sort': 3, 'sizes': ['S (42)', 'M (44)', 'L (46)']},
    'брюки': {'slug': 'pants', 'name_ru': 'Брюки', 'name_uz': 'Shimlar', 'sort': 4, 'sizes': ['S (42)', 'M (44)', 'L (46)']},
    'обувь': {'slug': 'shoes', 'name_ru': 'Обувь', 'name_uz': 'Poyabzal', 'sort': 5, 'sizes': ['36', '37', '38', '39', '40']},
    'кросовки': {'slug': 'sneakers', 'name_ru': 'Кроссовки', 'name_uz': 'Krossovkalar', 'sort': 6, 'sizes': ['36', '37', '38', '39', '40']},
    'сумки': {'slug': 'bags', 'name_ru': 'Сумки', 'name_uz': 'Sumkalar', 'sort': 7, 'sizes': ['ONE SIZE']},
    'Клатч': {'slug': 'clutches', 'name_ru': 'Клатчи', 'name_uz': 'Klatchlar', 'sort': 8, 'sizes': ['ONE SIZE']},
    'духи': {'slug': 'perfume', 'name_ru': 'Парфюмерия', 'name_uz': 'Parfyumeriya', 'sort': 9, 'sizes': ['50 ml', '100 ml']},
    'лосьоны': {'slug': 'bodycare', 'name_ru': 'Уход и лосьоны', 'name_uz': 'Tana parvarishi', 'sort': 10, 'sizes': ['200 ml', '300 ml']},
    'Шляпа': {'slug': 'hats', 'name_ru': 'Шляпы', 'name_uz': 'Shlyapalar', 'sort': 11, 'sizes': ['ONE SIZE']},
    'Кепка': {'slug': 'caps', 'name_ru': 'Кепки', 'name_uz': 'Kepkalar', 'sort': 12, 'sizes': ['ONE SIZE']},
    'ремишки': {'slug': 'accessories', 'name_ru': 'Ремни и аксессуары', 'name_uz': 'Kamarlar va aksessuarlar', 'sort': 13, 'sizes': ['85 cm', '95 cm', '105 cm']},
}

def analyze_photo_with_gemini(img_path, cat_ru):
    try:
        with Image.open(img_path) as im:
            im = im.convert('RGB')
            im.thumbnail((800, 800))
            buf = io.BytesIO()
            im.save(buf, format='JPEG', quality=85)
            b64_data = base64.b64encode(buf.getvalue()).decode('utf-8')

        prompt_text = (
            f"You are a luxury fashion catalog expert. The photo shows an authentic women's boutique item in category '{cat_ru}'.\n"
            "Analyze the item and return a JSON object with EXACTLY these keys:\n"
            '{\n'
            '  "name_ru": "Elegant and specific Russian product name matching the item details (e.g. \'Кружевной бомбер «Blush Lace»\', \'Ботильоны под змеиную кожу на шпильке\', \'Парфюм Bvlgari Le Gemme Tygar\')",\n'
            '  "name_uz": "Accurate Uzbek translation of product name",\n'
            '  "description_ru": "2-sentence luxury boutique description in Russian describing the exact materials, colors, silhouette and details shown in the photo.",\n'
            '  "description_uz": "Uzbek translation of description",\n'
            '  "price": integer price in UZS between 750000 and 3200000,\n'
            '  "visual_prompt": "A highly specific, realistic visual description of this exact item in English for a commercial 8k product photography packshot on a pure seamless white background (#FFFFFF) with professional studio lighting. Must preserve the exact color, pattern, silhouette, and details of the item in the photo without changing its look."\n'
            '}\n'
            "Return valid JSON only, without markdown fences."
        )

        payload = {
            'contents': [{
                'parts': [
                    {'text': prompt_text},
                    {'inline_data': {'mime_type': 'image/jpeg', 'data': b64_data}}
                ]
            }],
            'generationConfig': {'response_mime_type': 'application/json'}
        }

        url = f'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key={GEMINI_API_KEY}'
        r = requests.post(url, json=payload, timeout=20)
        if r.status_code == 200:
            txt = r.json()['candidates'][0]['content']['parts'][0]['text'].strip()
            if txt.startswith('```'):
                txt = txt.split('\n', 1)[1].rsplit('```', 1)[0].strip()
            return json.loads(txt)
    except Exception as e:
        print(f"Gemini analysis warning: {e}")

    # Fallback default metadata if API misses
    return {
        "name_ru": f"{cat_ru.capitalize()} CRYSTALL AMI",
        "name_uz": f"CRYSTALL AMI {cat_ru}",
        "description_ru": f"Премиальная авторская модель из коллекции CRYSTALL AMI. Высокое качество исполнения и безупречный стиль.",
        "description_uz": f"CRYSTALL AMI kolleksiyasidan premium sifatli eksklyuziv model.",
        "price": 1450000,
        "visual_prompt": f"A luxury {cat_ru} product, commercial 8k product photography, pure seamless white background (#FFFFFF), professional studio lighting, hyperrealistic, sharp focus, high details"
    }

def generate_studio_packshot(visual_prompt, out_path, seed=42100):
    if os.path.exists(out_path) and os.path.getsize(out_path) > 20000:
        return True

    full_prompt = f"{visual_prompt}, commercial 8k product photography, pure seamless white background (#FFFFFF), professional studio lighting, hyperrealistic, sharp focus, luxury catalog packshot"
    encoded = urllib.parse.quote(full_prompt)
    url = f"https://gen.pollinations.ai/image/{encoded}?width=1024&height=1024&model=flux&nologo=true&seed={seed}&key={POLLINATIONS_API_KEY}"

    for attempt in range(3):
        try:
            r = requests.get(url, timeout=35)
            if r.status_code == 200 and len(r.content) > 10000:
                with open(out_path, 'wb') as f:
                    f.write(r.content)
                return True
        except Exception as e:
            print(f"  Attempt {attempt+1} failed: {e}")
            time.sleep(2)
    return False

def run_catalog_builder(limit=None):
    base_dir = 'clothescrystallami'
    store = Store.objects.filter(subdomain='crystallami').first()
    if not store:
        print("Store 'crystallami' not found!")
        return

    print(f"Building Genuine Catalog for Store: {store.name} (ID: {store.id})")

    # Step 1: Ensure Categories exist
    cat_objs = {}
    for folder_name, cfg in CAT_CONFIG.items():
        cat, _ = Category.objects.get_or_create(
            store=store,
            slug=cfg['slug'],
            defaults={
                'name_ru': cfg['name_ru'],
                'name_uz': cfg['name_uz'],
                'sort_order': cfg['sort'],
                'is_active': True,
            }
        )
        cat_objs[folder_name] = cat

    # Step 2: Discover all catalog items
    catalog_entries = []
    for entry in sorted(os.listdir(base_dir)):
        p = os.path.join(base_dir, entry)
        if not os.path.isdir(p) or entry.startswith('.'):
            continue
        cfg = CAT_CONFIG.get(entry)
        if not cfg:
            continue

        subdirs = sorted([s for s in os.listdir(p) if os.path.isdir(os.path.join(p, s)) and not s.startswith('.')])
        if subdirs:
            for s in subdirs:
                sp = os.path.join(p, s)
                files = sorted([f for f in os.listdir(sp) if f.lower().endswith(('.jpg', '.jpeg', '.png')) and not f.startswith('.')])
                if files:
                    catalog_entries.append({
                        'cat_name': entry,
                        'cfg': cfg,
                        'item_id': s,
                        'folder': sp,
                        'images': [os.path.join(sp, f) for f in files]
                    })
        else:
            files = sorted([f for f in os.listdir(p) if f.lower().endswith(('.jpg', '.jpeg', '.png')) and not f.startswith('.')])
            if files:
                catalog_entries.append({
                    'cat_name': entry,
                    'cfg': cfg,
                    'item_id': 'default',
                    'folder': p,
                    'images': [os.path.join(p, f) for f in files]
                })

    print(f"Found {len(catalog_entries)} genuine products across all categories.")
    if limit:
        catalog_entries = catalog_entries[:limit]
        print(f"Limiting to first {limit} items for this run.")

    created_prods = []
    for idx, entry in enumerate(catalog_entries):
        cat_slug = entry['cfg']['slug']
        item_id = entry['item_id']
        first_img = entry['images'][0]
        slug = f"crystallami-{cat_slug}-{item_id}"

        print(f"\n[{idx+1}/{len(catalog_entries)}] Processing {entry['cat_name']} #{item_id}...")

        studio_filename = f"studio_{cat_slug}_{item_id}.jpg"
        real_filename = f"real_{cat_slug}_{item_id}.jpg"
        studio_path = os.path.join('media/products/crystallami', studio_filename)
        real_path = os.path.join('media/products/crystallami', real_filename)

        # 1. Copy real showroom image
        if not os.path.exists(real_path) or os.path.getsize(real_path) < 5000:
            with Image.open(first_img) as im:
                im = im.convert('RGB')
                im.thumbnail((1200, 1200))
                im.save(real_path, format='JPEG', quality=90)
            print(f"  Saved real showroom photo -> {real_path}")

        # 2. Get metadata from Gemini
        meta = analyze_photo_with_gemini(first_img, entry['cat_name'])
        print(f"  Identified: {meta.get('name_ru')}")

        # 3. Generate Studio Packshot
        seed = 100000 + (idx * 3137) % 800000
        success = generate_studio_packshot(meta.get('visual_prompt', ''), studio_path, seed=seed)
        if success:
            print(f"  Studio packshot ready -> {studio_path}")
        else:
            print(f"  Warning: using real photo as studio fallback")
            studio_path = real_path
            studio_filename = real_filename

        # 4. Save to Django Database
        price = meta.get('price', 1450000)
        old_price = int(price * 1.18)

        prod, created = Product.objects.get_or_create(
            store=store,
            slug=slug,
            defaults={
                'category': cat_objs[entry['cat_name']],
                'name_ru': meta.get('name_ru', f"{entry['cat_name']} CRYSTALL AMI"),
                'name_uz': meta.get('name_uz', meta.get('name_ru', '')),
                'description_ru': meta.get('description_ru', ''),
                'description_uz': meta.get('description_uz', ''),
                'price': price,
                'old_price': old_price,
                'stock': 15,
                'is_active': True,
                'is_featured': (idx < 8),
                'image_url': f"/media/products/crystallami/{studio_filename}"
            }
        )

        if not created:
            prod.category = cat_objs[entry['cat_name']]
            prod.name_ru = meta.get('name_ru')
            prod.name_uz = meta.get('name_uz')
            prod.description_ru = meta.get('description_ru')
            prod.description_uz = meta.get('description_uz')
            prod.price = price
            prod.old_price = old_price
            prod.is_active = True
            prod.image_url = f"/media/products/crystallami/{studio_filename}"
            prod.save()

        # Setup Product Images
        prod.images.all().delete()
        ProductImage.objects.create(
            product=prod,
            image=f"products/crystallami/{studio_filename}",
            is_primary=True,
            sort_order=0
        )
        ProductImage.objects.create(
            product=prod,
            image=f"products/crystallami/{real_filename}",
            is_primary=False,
            sort_order=1
        )

        # Setup Variations / Sizes
        prod.variations.all().delete()
        sizes = entry['cfg'].get('sizes', ['ONE SIZE'])
        for v_idx, sz in enumerate(sizes):
            ProductVariation.objects.create(
                product=prod,
                name_ru=sz,
                name_uz=sz,
                price=price,
                stock=5,
                is_active=True,
                sort_order=v_idx
            )

        created_prods.append(prod)

    # Clean up old demo products not starting with 'crystallami-'
    old_deleted = Product.objects.filter(store=store).exclude(slug__startswith='crystallami-').delete()
    print(f"\nCleanup: Deleted {old_deleted[0]} obsolete placeholder products.")
    print(f"Successfully configured {len(created_prods)} genuine CRYSTALL AMI products!")

if __name__ == '__main__':
    limit_arg = int(sys.argv[1]) if len(sys.argv) > 1 else None
    run_catalog_builder(limit=limit_arg)
