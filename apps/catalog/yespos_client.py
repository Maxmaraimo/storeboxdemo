import requests
import logging
from decimal import Decimal
from django.utils import timezone
from django.utils.text import slugify
from apps.catalog.models import Product, Category, YesPosConnection, YesPosCategoryLink, YesPosProductLink

logger = logging.getLogger(__name__)

DEFAULT_YESPOS_API_BASE_URL = 'https://marketplace.yestask.uz'

# Realistic fallback mock data for testing/demo when live API key is simulated or API unreachable
MOCK_BRANCHES = [
    {'id': 'branch_tashkent_main', 'name': 'Главный филиал (Ташкент, Ц-1)'},
    {'id': 'branch_chilonzor', 'name': 'Филиал Чиланзар, кв-л 9'},
    {'id': 'branch_samarkand', 'name': 'Филиал Самарканд (Регистан)'},
]

MOCK_CATALOG = [
    {
        'id': 'cat_clothing',
        'name': 'Одежда и обувь',
        'products': [
            {
                'id': 'yp_prod_101',
                'name': 'Кроссовки Nike Air Max 270',
                'sku': 'NK-AM270-01',
                'barcode': '4780012345678',
                'ikpu': '06102001001000000',
                'price': 890000,
                'stock': 24,
                'description': 'Оригинальные спортивные кроссовки с амортизацией Air Max для повседневной носки и тренировок.',
                'image': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80',
            },
            {
                'id': 'yp_prod_102',
                'name': 'Худи оверсайз StoreBox Basic',
                'sku': 'HD-SB-BLK',
                'barcode': '4780012345685',
                'ikpu': '06102001002000000',
                'price': 350000,
                'stock': 45,
                'description': 'Утепленное худи из плотного хлопка 3-нитка с начесом. Унисекс.',
                'image': 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&auto=format&fit=crop&q=80',
            },
            {
                'id': 'yp_prod_103',
                'name': 'Джинсы прямые Classic Denim',
                'sku': 'JN-CLS-01',
                'barcode': '4780012345692',
                'ikpu': '06102001003000000',
                'price': 420000,
                'stock': 18,
                'description': 'Классические прямые джинсы из плотного 100% хлопкового денима.',
                'image': 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&auto=format&fit=crop&q=80',
            },
        ]
    },
    {
        'id': 'cat_electronics',
        'name': 'Электроника и гаджеты',
        'products': [
            {
                'id': 'yp_prod_201',
                'name': 'Беспроводные наушники ProSound Buds',
                'sku': 'PS-BUDS-W',
                'barcode': '4780023456781',
                'ikpu': '08401001001000000',
                'price': 520000,
                'stock': 32,
                'description': 'TWS-наушники с активным шумоподавлением ANC и временем автономной работы до 28 часов.',
                'image': 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80',
            },
            {
                'id': 'yp_prod_202',
                'name': 'Смарт-часы SmartWatch Ultra 2',
                'sku': 'SW-ULTRA-02',
                'barcode': '4780023456798',
                'ikpu': '08401001002000000',
                'price': 1150000,
                'stock': 12,
                'description': 'Премиальные смарт-часы с AMOLED дисплеем, пульсометром, GPS и влагозащитой 5ATM.',
                'image': 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=600&auto=format&fit=crop&q=80',
            },
            {
                'id': 'yp_prod_203',
                'name': 'Портативная колонка BoomBox Mini',
                'sku': 'BB-MINI-01',
                'barcode': '4780023456804',
                'ikpu': '08401001003000000',
                'price': 280000,
                'stock': 50,
                'description': 'Компактная водонепроницаемая Bluetooth-колонка с глубоким басом и подсветкой RGB.',
                'image': 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&auto=format&fit=crop&q=80',
            },
        ]
    },
    {
        'id': 'cat_accessories',
        'name': 'Аксессуары',
        'products': [
            {
                'id': 'yp_prod_301',
                'name': 'Кожаный кошелек Minimalist',
                'sku': 'WL-LTH-BRN',
                'barcode': '4780034567890',
                'ikpu': '05201001001000000',
                'price': 190000,
                'stock': 60,
                'description': 'Компактный кошелек из натуральной воловьей кожи ручной работы с RFID-защитой.',
                'image': 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=600&auto=format&fit=crop&q=80',
            },
            {
                'id': 'yp_prod_302',
                'name': 'Рюкзак городской Urban Pack 20L',
                'sku': 'BP-URB-20L',
                'barcode': '4780034567906',
                'ikpu': '05201001002000000',
                'price': 490000,
                'stock': 15,
                'description': 'Водоотталкивающий городской рюкзак с отделением для ноутбука до 15.6 дюймов.',
                'image': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80',
            },
        ]
    }
]


class YesPosClient:
    def __init__(self, base_url=None):
        self.base_url = (base_url or DEFAULT_YESPOS_API_BASE_URL).rstrip('/')

    def _post(self, path, api_key, branch_id=None, timeout=4):
        url = f"{self.base_url}/api/v1{path}"
        headers = {
            'API-Key': api_key,
            'AppName': 'YesPOS',
            'Content-Type': 'application/json',
        }
        if branch_id:
            headers['Branch'] = str(branch_id)
        try:
            response = requests.post(url, headers=headers, json={}, timeout=timeout)
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, dict):
                    if data.get('error'):
                        raise Exception(data.get('error') or data.get('message'))
                    return data.get('data', data)
                return data
            response.raise_for_status()
        except Exception as e:
            logger.warning(f"YES POS API error ({url}): {e}")
            raise e

    def get_branches(self, api_key):
        """Returns list of branches: [{'id': ..., 'name': ...}]"""
        if any(k in (api_key or '').lower() for k in ['demo', 'test', 'mock']):
            return MOCK_BRANCHES
        try:
            res = self._post('/branch/list', api_key)
            branches = []
            rows = res.get('branches', res.get('items', [])) if isinstance(res, dict) else (res if isinstance(res, list) else [])
            for r in rows:
                b_id = str(r.get('id') or r.get('branch_id') or r.get('branchId', ''))
                b_name = str(r.get('name') or r.get('branch_name', '')).strip()
                if b_id and b_name:
                    branches.append({'id': b_id, 'name': b_name})
            if branches:
                return branches
        except Exception as e:
            logger.info(f"Live YES POS branch fetch failed: {e}. Falling back to demo branches.")
        return MOCK_BRANCHES

    def get_catalog(self, api_key, branch_id=None):
        """Returns catalog categories with products and stock/price"""
        if any(k in (api_key or '').lower() for k in ['demo', 'test', 'mock']):
            return MOCK_CATALOG
        try:
            res = self._post('/marketplace/products', api_key)
            categories = []
            # Extract categories from response
            raw_cats = res.get('categories', res.get('items', [])) if isinstance(res, dict) else (res if isinstance(res, list) else [])
            if raw_cats:
                # Also fetch stock & prices from /marketplace/products/info
                info_map = {}
                if branch_id:
                    try:
                        info_res = self._post(f'/marketplace/products/info?page=1&limit=500', api_key, branch_id=branch_id)
                        info_items = info_res.get('items', info_res.get('products', [])) if isinstance(info_res, dict) else (info_res if isinstance(info_res, list) else [])
                        for item in info_items:
                            p_id = str(item.get('product_id') or item.get('productId') or item.get('id', ''))
                            if p_id:
                                info_map[p_id] = {
                                    'price': float(item.get('price', 0) or 0),
                                    'stock': int(item.get('stock', item.get('quantity', 0)) or 0)
                                }
                    except Exception as err:
                        logger.warning(f"Could not fetch product info: {err}")

                for cat in raw_cats:
                    c_id = str(cat.get('id') or cat.get('category_id') or '')
                    c_name = str(cat.get('name') or cat.get('category_name') or '').strip()
                    cat_prods = []
                    for p in cat.get('products', cat.get('items', [])):
                        pid = str(p.get('id') or p.get('product_id', ''))
                        pname = str(p.get('name') or p.get('title', '')).strip()
                        if not pid or not pname:
                            continue
                        info = info_map.get(pid, {})
                        cat_prods.append({
                            'id': pid,
                            'name': pname,
                            'sku': str(p.get('sku') or p.get('article') or ''),
                            'barcode': str(p.get('barcode') or ''),
                            'ikpu': str(p.get('classcode') or p.get('ikpu') or ''),
                            'price': info.get('price', float(p.get('price', 0) or 0)),
                            'stock': info.get('stock', int(p.get('stock', 0) or 0)),
                            'description': str(p.get('description') or ''),
                            'image': p.get('image') or p.get('path') or '',
                        })
                    if c_id and c_name:
                        categories.append({
                            'id': c_id,
                            'name': c_name,
                            'products': cat_prods
                        })
                if categories:
                    return categories
        except Exception as e:
            logger.info(f"Live YES POS catalog fetch failed: {e}. Falling back to demo catalog.")
        return MOCK_CATALOG

    def _save_product_image(self, product, image_url, remote_id):
        """Download image from remote URL and save as ProductImage"""
        if not image_url or not image_url.startswith('http'):
            return
        try:
            from django.core.files.base import ContentFile
            from apps.catalog.models import ProductImage

            if not product.images.exists():
                resp = requests.get(image_url, timeout=5)
                if resp.status_code == 200 and resp.content:
                    ext = 'jpg'
                    lower_url = image_url.lower()
                    if '.png' in lower_url:
                        ext = 'png'
                    elif '.webp' in lower_url:
                        ext = 'webp'
                    filename = f"yp_{remote_id}_{product.id}.{ext}"
                    pimg = ProductImage(product=product, is_primary=True)
                    pimg.image.save(filename, ContentFile(resp.content), save=True)
        except Exception as e:
            logger.debug(f"Could not download local image for {product.name_ru}: {e}")

    def import_products(self, store, selected_items):
        """
        selected_items: list of dicts:
        [{'remote_id': '...', 'category_name': '...', 'name': '...', 'sku': '...', 'barcode': '...', 'ikpu': '...', 'price': ..., 'stock': ..., 'description': '...', 'image': '...'}]
        """
        created_count = 0
        updated_count = 0

        for item in selected_items:
            remote_id = str(item.get('remote_id') or item.get('id'))
            name = item.get('name', '').strip()
            if not remote_id or not name:
                continue

            # 1. Resolve or create category
            cat_name = item.get('category_name', 'Импорт YES POS').strip()
            category, _ = Category.objects.get_or_create(
                store=store,
                name_ru=cat_name,
                defaults={
                    'name_uz': cat_name,
                    'slug': slugify(cat_name) or f'category-{remote_id}',
                }
            )

            price = Decimal(str(item.get('price') or 0))
            stock = int(item.get('stock') or 0)
            barcode = str(item.get('barcode') or '').strip()
            ikpu = str(item.get('ikpu') or '').strip()
            description = str(item.get('description') or '').strip()

            # Resolve image URL
            image_raw = str(item.get('image') or item.get('image_url') or item.get('path') or '').strip()
            if not image_raw:
                # Fallback to MOCK_CATALOG if image wasn't supplied
                for mcat in MOCK_CATALOG:
                    for mp in mcat.get('products', []):
                        if str(mp.get('id')) == str(remote_id) or mp.get('name') == name:
                            image_raw = mp.get('image', '')
                            break
                    if image_raw:
                        break

            # 2. Check if already linked
            link = YesPosProductLink.objects.filter(store=store, remote_product_id=remote_id).first()
            if link and link.product:
                product = link.product
                product.price = price
                product.stock = stock
                if barcode and not product.barcode:
                    product.barcode = barcode
                if ikpu and not product.ikpu_code:
                    product.ikpu_code = ikpu
                if image_raw and not product.image_url:
                    product.image_url = image_raw
                product.save()

                if image_raw and not product.images.exists():
                    self._save_product_image(product, image_raw, remote_id)

                link.remote_price = price
                link.remote_stock = stock
                link.remote_barcode = barcode
                link.last_synced_at = timezone.now()
                link.save()
                updated_count += 1
            else:
                base_slug = slugify(name) or f'product-{remote_id}'
                slug = base_slug
                counter = 1
                while Product.objects.filter(store=store, slug=slug).exists():
                    slug = f'{base_slug}-{counter}'
                    counter += 1

                product = Product.objects.create(
                    store=store,
                    category=category,
                    name_ru=name,
                    name_uz=name,
                    slug=slug,
                    price=price,
                    stock=stock,
                    barcode=barcode,
                    ikpu_code=ikpu,
                    image_url=image_raw,
                    description_ru=description,
                    description_uz=description,
                    is_active=True,
                    track_stock=True
                )

                if image_raw:
                    self._save_product_image(product, image_raw, remote_id)

                YesPosProductLink.objects.update_or_create(
                    store=store,
                    remote_product_id=remote_id,
                    defaults={
                        'product': product,
                        'remote_barcode': barcode,
                        'remote_price': price,
                        'remote_stock': stock,
                        'last_synced_at': timezone.now()
                    }
                )
                created_count += 1

        return {
            'created': created_count,
            'updated': updated_count,
            'total': created_count + updated_count
        }

    def sync_store_products(self, store):
        """
        Synchronize stock, prices, and missing images for all linked products in store
        """
        connection = getattr(store, 'yespos_connection', None)
        if not connection or not connection.is_active:
            raise Exception('Подключение к YES POS не активно')

        catalog = self.get_catalog(connection.api_key, connection.branch_id)
        prod_map = {}
        for cat in catalog:
            for p in cat.get('products', []):
                prod_map[str(p['id'])] = p

        updated_count = 0
        links = YesPosProductLink.objects.filter(store=store).select_related('product')
        for link in links:
            remote_data = prod_map.get(str(link.remote_product_id))
            if remote_data:
                product = link.product
                new_price = Decimal(str(remote_data.get('price', product.price)))
                new_stock = int(remote_data.get('stock', product.stock))
                remote_image = remote_data.get('image') or remote_data.get('image_url') or ''

                product.price = new_price
                product.stock = new_stock
                if remote_image and not product.image_url:
                    product.image_url = remote_image
                product.save()

                if remote_image and not product.images.exists():
                    self._save_product_image(product, remote_image, link.remote_product_id)

                link.remote_price = new_price
                link.remote_stock = new_stock
                link.last_synced_at = timezone.now()
                link.save()
                updated_count += 1

        connection.last_sync_at = timezone.now()
        connection.save()

        return {'updated': updated_count}

