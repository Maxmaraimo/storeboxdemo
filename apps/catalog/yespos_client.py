import requests
import logging
from decimal import Decimal
from django.utils import timezone
from django.utils.text import slugify
from apps.catalog.models import Product, Category, YesPosConnection, YesPosCategoryLink, YesPosProductLink

logger = logging.getLogger(__name__)

DEFAULT_YESPOS_API_BASE_URL = 'https://marketplace.yestask.uz'
DEFAULT_YESPOS_MEDIA_HOST = 'http://app.yespos.uz:8263'

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

    def _post(self, path, api_key, branch_id=None, timeout=15):
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
        if any(k in (api_key or '').lower() for k in ['demo', 'mock']):
            return MOCK_BRANCHES
        try:
            res = self._post('/branch/list', api_key, timeout=15)
            branches = []
            rows = res.get('branches', res.get('items', [])) if isinstance(res, dict) else (res if isinstance(res, list) else [])
            for r in rows:
                b_id = str(r.get('id') or r.get('branch_id') or r.get('branchId', '')).strip()
                b_name = str(r.get('name') or r.get('branch_name', '')).strip()
                b_addr = str(r.get('address') or '').strip()
                if b_id:
                    display_name = b_name or f"Филиал {b_id}"
                    if b_addr:
                        display_name = f"{display_name} ({b_addr})"
                    branches.append({'id': b_id, 'name': display_name})
            if branches:
                return branches
            return []
        except Exception as e:
            logger.error(f"Live YES POS branch fetch failed: {e}")
            raise e

    def get_catalog(self, api_key, branch_id=None):
        """Returns catalog categories with products and stock/price"""
        if any(k in (api_key or '').lower() for k in ['demo', 'mock']):
            return MOCK_CATALOG
        try:
            res = self._post('/marketplace/products', api_key, timeout=15)
            categories = []
            # Extract categories from response
            raw_cats = res.get('categories', res.get('items', [])) if isinstance(res, dict) else (res if isinstance(res, list) else [])
            if raw_cats:
                # Also fetch stock & prices from /marketplace/products/info
                info_map = {}
                if branch_id:
                    try:
                        info_res = self._post('/marketplace/products/info?page=1&limit=500', api_key, branch_id=branch_id, timeout=20)
                        info_items = info_res.get('items', info_res.get('products', [])) if isinstance(info_res, dict) else (info_res if isinstance(info_res, list) else [])
                        for item in info_items:
                            p_id = str(item.get('product_id') or item.get('productId') or item.get('id', '')).strip()
                            if p_id:
                                try:
                                    raw_stk = float(item.get('stock', item.get('quantity', 0)) or 0)
                                    stk_val = int(raw_stk) if raw_stk.is_integer() else round(raw_stk, 3)
                                except (ValueError, TypeError):
                                    stk_val = 0
                                try:
                                    prc_val = float(item.get('price', 0) or 0)
                                except (ValueError, TypeError):
                                    prc_val = 0.0
                                info_map[p_id] = {
                                    'price': prc_val,
                                    'stock': stk_val
                                }
                    except Exception as err:
                        logger.warning(f"Could not fetch product info: {err}")

                for cat in raw_cats:
                    c_id = str(cat.get('id') or cat.get('category_id') or '')
                    c_name = str(cat.get('name') or cat.get('category_name') or '').strip() or f"Категория {c_id}"
                    cat_prods = []
                    for p in cat.get('products', cat.get('items', [])):
                        pid = str(p.get('id') or p.get('product_id', ''))
                        pname = str(p.get('name') or p.get('title', '')).strip()
                        if not pname:
                            sku_val = p.get('sku') or p.get('article')
                            if sku_val:
                                pname = f"Товар {sku_val}"
                            else:
                                pname = f"Товар {pid}"
                        if not pid:
                            continue
                        info = info_map.get(pid, {})
                        
                        try:
                            price_val = float(info.get('price', p.get('price', 0)) or 0)
                        except (ValueError, TypeError):
                            price_val = 0.0

                        try:
                            raw_stk = float(info.get('stock', p.get('stock', 0)) or 0)
                            stock_val = int(raw_stk) if raw_stk.is_integer() else round(raw_stk, 3)
                        except (ValueError, TypeError):
                            stock_val = 0

                        raw_img = str(p.get('image') or p.get('path') or '').strip()
                        if raw_img and not raw_img.lower().startswith('parent_'):
                            cat_img_url = self.get_catalog_image_url(raw_img)
                        else:
                            cat_img_url = ''
                            raw_img = ''

                        cat_prods.append({
                            'id': pid,
                            'name': pname,
                            'sku': str(p.get('sku') or p.get('article') or ''),
                            'barcode': str(p.get('barcode') or ''),
                            'ikpu': str(p.get('classcode') or p.get('ikpu') or ''),
                            'price': price_val,
                            'stock': stock_val,
                            'description': str(p.get('description') or ''),
                            'image': cat_img_url,
                            'raw_image': raw_img,
                        })
                    if c_id:
                        categories.append({
                            'id': c_id,
                            'name': c_name,
                            'products': cat_prods
                        })
                return categories
        except Exception as e:
            logger.error(f"Live YES POS catalog fetch failed: {e}")
            raise e
        return []

    def get_remote_image_url(self, image_path):
        """Converts raw image path (e.g. temp-images/upload-123.png) to direct downloadable URL"""
        if not image_path:
            return ''
        image_str = str(image_path).strip()
        if not image_str or image_str.lower().startswith('parent_'):
            return ''
        if image_str.startswith('http://') or image_str.startswith('https://'):
            return image_str
        clean_path = image_str.lstrip('/')
        return f"{DEFAULT_YESPOS_MEDIA_HOST}/getImage?path={clean_path}"

    def get_catalog_image_url(self, image_path):
        """Converts raw image path to StoreBox proxy URL for browser display"""
        if not image_path:
            return ''
        image_str = str(image_path).strip()
        if not image_str or image_str.lower().startswith('parent_'):
            return ''
        if image_str.startswith('http://') or image_str.startswith('https://'):
            return image_str
        clean_path = image_str.lstrip('/')
        return f"/dashboard/api/yespos/image/?path={clean_path}"

    def _save_product_image(self, product, image_url_or_path, remote_id):
        """Download image from remote URL or raw path and save as ProductImage"""
        if not image_url_or_path:
            return
        remote_url = self.get_remote_image_url(image_url_or_path)
        if not remote_url:
            return
        try:
            from django.core.files.base import ContentFile
            from apps.catalog.models import ProductImage

            if not product.images.exists():
                resp = requests.get(remote_url, timeout=10)
                if resp.status_code == 200 and resp.content:
                    ext = 'jpg'
                    if resp.content.startswith(b'\x89PNG') or '.png' in remote_url.lower():
                        ext = 'png'
                    elif resp.content.startswith(b'RIFF') and b'WEBP' in resp.content[:16]:
                        ext = 'webp'
                    elif '.webp' in remote_url.lower():
                        ext = 'webp'
                    filename = f"yp_{remote_id}_{product.id}.{ext}"
                    pimg = ProductImage(product=product, is_primary=True)
                    pimg.image.save(filename, ContentFile(resp.content), save=True)
                    # Also set primary image url on product
                    if hasattr(product, 'image') and not product.image:
                        product.image = pimg.image
                        product.save(update_fields=['image'])
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
            category = Category.objects.filter(store=store, name_ru=cat_name).first()
            if not category:
                base_slug = slugify(cat_name) or f'category-{remote_id}'
                c_slug = base_slug
                counter = 1
                while Category.objects.filter(store=store, slug=c_slug).exists():
                    c_slug = f'{base_slug}-{counter}'
                    counter += 1
                category = Category.objects.create(
                    store=store,
                    name_ru=cat_name,
                    name_uz=cat_name,
                    slug=c_slug
                )

            try:
                price = Decimal(str(item.get('price') or 0))
            except Exception:
                price = Decimal('0')

            try:
                stock = int(float(item.get('stock') or 0))
            except (ValueError, TypeError):
                stock = 0

            barcode = str(item.get('barcode') or '').strip()
            ikpu = str(item.get('ikpu') or '').strip()
            description = str(item.get('description') or '').strip()

            # Resolve image URL
            raw_img = str(item.get('raw_image') or item.get('image') or item.get('image_url') or item.get('path') or '').strip()
            if 'path=' in raw_img:
                raw_img = raw_img.split('path=')[-1].split('&')[0]
            clean_remote_url = self.get_remote_image_url(raw_img) if raw_img else ''

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
                if clean_remote_url and not product.image_url:
                    product.image_url = clean_remote_url
                product.save()

                if raw_img and not product.images.exists():
                    self._save_product_image(product, raw_img, remote_id)

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
                    image_url=clean_remote_url,
                    description_ru=description,
                    description_uz=description,
                    is_active=True,
                    track_stock=True
                )

                if raw_img:
                    self._save_product_image(product, raw_img, remote_id)

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
                try:
                    new_price = Decimal(str(remote_data.get('price', product.price) or 0))
                except Exception:
                    new_price = product.price

                try:
                    new_stock = int(float(remote_data.get('stock', product.stock) or 0))
                except Exception:
                    new_stock = product.stock

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

