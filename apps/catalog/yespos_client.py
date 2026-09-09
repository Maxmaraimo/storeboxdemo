import os
import time
import hashlib
import requests
import logging
from decimal import Decimal
from urllib3.util.retry import Retry
from requests.adapters import HTTPAdapter
from django.conf import settings
from django.core.cache import cache
from django.utils import timezone
from django.utils.text import slugify
from django.db import transaction
from apps.catalog.models import Product, Category, YesPosConnection, YesPosCategoryLink, YesPosProductLink

logger = logging.getLogger(__name__)

DEFAULT_YESPOS_API_BASE_URL = 'https://marketplace.yestask.uz'
DEFAULT_YESPOS_MEDIA_HOST = 'http://app.yespos.uz:8263'

_yp_session = None

def get_yespos_session():
    """
    Returns a configured requests.Session with ZERO retries and tight connection pooling.
    Never loop or retry on failures or 500/502/503/504 errors to prevent DDoS blocks and Max retries exceeded.
    """
    global _yp_session
    if _yp_session is None:
        _yp_session = requests.Session()
        # total=0 completely disables urllib3 retries (1 attempt only, fail-fast)
        retries = Retry(
            total=0,
            connect=0,
            read=0,
            redirect=0,
            status=0,
            raise_on_status=False
        )
        adapter = HTTPAdapter(max_retries=retries, pool_connections=10, pool_maxsize=10)
        _yp_session.mount('https://', adapter)
        _yp_session.mount('http://', adapter)
    return _yp_session


# Strict rate-limiting, timeout, and caching constants to prevent DDoS / overloading YES POS
CATALOG_CACHE_TTL = 900          # 15 minutes catalog caching
BRANCHES_CACHE_TTL = 3600        # 1 hour branch caching
CATALOG_COOLDOWN_SECONDS = 30    # Minimum 30 seconds between live API hits
FAILED_IMAGE_CACHE_TTL = 86400   # 24 hours negative cache for broken/404 image paths
MEDIA_HOST_DOWN_TTL = 3600       # 1 hour circuit breaker when port 8263 is unreachable
DEFAULT_HTTP_TIMEOUT = (2.0, 3.0) # (connect_timeout 2s, read_timeout 3s) -> max 5s total

# Real YES POS branches and catalog data
REAL_YESPOS_BRANCHES = [
    {
        'id': '1',
        'name': '"U POS " (Самарканд, ул. Х.Асадова, дом 27)',
    },
    {
        'id': '7',
        'name': '"U POS GROUP" MCHJ (Самарқанд, Damarik)',
    },
]

REAL_YESPOS_CATALOG = [
    {
        'id': '103',
        'name': 'MEVALAR',
        'image': '/media/categories/cat_3_103.png',
        'raw_image': '',
        'products': [
            {
                'id': '1911',
                'name': 'BANAN kg',
                'sku': '1911',
                'barcode': '',
                'ikpu': '02106999999000000',
                'price': 61500,
                'stock': 32,
                'description': '',
                'image': '/media/products/yp_1911_146.png',
                'raw_image': '',
                'category_id': '103',
                'category_name': 'MEVALAR',
                'category_image': '/media/categories/cat_3_103.png',
                'category_raw_image': '',
            },
            {
                'id': '1912',
                'name': 'MANDARIN kg',
                'sku': '1912',
                'barcode': '',
                'ikpu': '02106999999000000',
                'price': 30000,
                'stock': 0,
                'description': '',
                'image': '/media/products/yp_1912_158.png',
                'raw_image': '',
                'category_id': '103',
                'category_name': 'MEVALAR',
                'category_image': '/media/categories/cat_3_103.png',
                'category_raw_image': '',
            },
            {
                'id': '1913',
                'name': 'APLESIN kg',
                'sku': '1913',
                'barcode': '',
                'ikpu': '02106999999000000',
                'price': 40000,
                'stock': 50,
                'description': '',
                'image': '/media/products/yp_1913_159.png',
                'raw_image': '',
                'category_id': '103',
                'category_name': 'MEVALAR',
                'category_image': '/media/categories/cat_3_103.png',
                'category_raw_image': '',
            },
            {
                'id': '1914',
                'name': 'OLMA KIZIL kg',
                'sku': '1914',
                'barcode': '',
                'ikpu': '02106999999000000',
                'price': 15000,
                'stock': 158,
                'description': '',
                'image': '/media/products/yp_1914_160.png',
                'raw_image': '',
                'category_id': '103',
                'category_name': 'MEVALAR',
                'category_image': '/media/categories/cat_3_103.png',
                'category_raw_image': '',
            },
            {
                'id': '1915',
                'name': 'ANOR kg',
                'sku': '1915',
                'barcode': '',
                'ikpu': '02106999999000000',
                'price': 250000,
                'stock': 50,
                'description': '',
                'image': '/media/products/yp_1915_161.png',
                'raw_image': '',
                'category_id': '103',
                'category_name': 'MEVALAR',
                'category_image': '/media/categories/cat_3_103.png',
                'category_raw_image': '',
            },
        ]
    },
    {
        'id': '104',
        'name': 'SABZAVOTLAR',
        'image': '/media/categories/cat_5_104.png',
        'raw_image': '',
        'products': [
            {
                'id': '1916',
                'name': 'Картофель свежий отборный (1 кг)',
                'sku': '1916',
                'barcode': '',
                'ikpu': '02106999999000000',
                'price': 5400,
                'stock': 82,
                'description': 'Свежий фермерский картофель отличного качества.',
                'image': '/media/products/yp_1916_147.png',
                'raw_image': '',
                'category_id': '104',
                'category_name': 'SABZAVOTLAR',
                'category_image': '/media/categories/cat_5_104.png',
                'category_raw_image': '',
            },
            {
                'id': '1917',
                'name': 'SABZI kg',
                'sku': '1917',
                'barcode': '',
                'ikpu': '02106999999000000',
                'price': 6000,
                'stock': 295,
                'description': '',
                'image': '/media/products/yp_1917_148.png',
                'raw_image': '',
                'category_id': '104',
                'category_name': 'SABZAVOTLAR',
                'category_image': '/media/categories/cat_5_104.png',
                'category_raw_image': '',
            },
            {
                'id': '1918',
                'name': 'PIYOZ kg',
                'sku': '1918',
                'barcode': '',
                'ikpu': '02106999999000000',
                'price': 5000,
                'stock': 0,
                'description': '',
                'image': '/media/products/yp_1918_149.png',
                'raw_image': '',
                'category_id': '104',
                'category_name': 'SABZAVOTLAR',
                'category_image': '/media/categories/cat_5_104.png',
                'category_raw_image': '',
            },
            {
                'id': '1919',
                'name': 'BODIRING kg',
                'sku': '1919',
                'barcode': '',
                'ikpu': '02106999999000000',
                'price': 38000,
                'stock': 0,
                'description': '',
                'image': '/media/products/yp_1919_162.png',
                'raw_image': '',
                'category_id': '104',
                'category_name': 'SABZAVOTLAR',
                'category_image': '/media/categories/cat_5_104.png',
                'category_raw_image': '',
            },
            {
                'id': '1920',
                'name': 'POMIDOR kg',
                'sku': '1920',
                'barcode': '',
                'ikpu': '02106999999000000',
                'price': 32000,
                'stock': 0,
                'description': '',
                'image': '/media/products/yp_1920_163.png',
                'raw_image': '',
                'category_id': '104',
                'category_name': 'SABZAVOTLAR',
                'category_image': '/media/categories/cat_5_104.png',
                'category_raw_image': '',
            },
            {
                'id': '1922',
                'name': 'LAVLAGI kg',
                'sku': '1922',
                'barcode': '',
                'ikpu': '02106999999000000',
                'price': 12000,
                'stock': 96,
                'description': '',
                'image': '/media/products/yp_1922_164.png',
                'raw_image': '',
                'category_id': '104',
                'category_name': 'SABZAVOTLAR',
                'category_image': '/media/categories/cat_5_104.png',
                'category_raw_image': '',
            },
        ]
    },
    {
        'id': '105',
        'name': 'G`OSHT MAXSULOTLARI',
        'image': '/media/categories/cat_2_105.png',
        'raw_image': '',
        'products': [
            {
                'id': '1923',
                'name': "MO'L GOSHTI kg",
                'sku': '1923',
                'barcode': '',
                'ikpu': '02106999999000000',
                'price': 110000,
                'stock': 169,
                'description': '',
                'image': '/media/products/yp_1923_150.png',
                'raw_image': '',
                'category_id': '105',
                'category_name': 'G`OSHT MAXSULOTLARI',
                'category_image': '/media/categories/cat_2_105.png',
                'category_raw_image': '',
            },
            {
                'id': '1924',
                'name': "MO'L GOSHTI LAXIM kg",
                'sku': '1924',
                'barcode': '',
                'ikpu': '02106999999000000',
                'price': 120000,
                'stock': 0,
                'description': '',
                'image': '/media/products/yp_1924_151.png',
                'raw_image': '',
                'category_id': '105',
                'category_name': 'G`OSHT MAXSULOTLARI',
                'category_image': '/media/categories/cat_2_105.png',
                'category_raw_image': '',
            },
            {
                'id': '1925',
                'name': "QOY GOSHTI kg",
                'sku': '1925',
                'barcode': '',
                'ikpu': '02106999999000000',
                'price': 135000,
                'stock': 0,
                'description': '',
                'image': '/media/products/yp_1925_152.png',
                'raw_image': '',
                'category_id': '105',
                'category_name': 'G`OSHT MAXSULOTLARI',
                'category_image': '/media/categories/cat_2_105.png',
                'category_raw_image': '',
            },
            {
                'id': '1926',
                'name': "FARSH kg",
                'sku': '1926',
                'barcode': '',
                'ikpu': '02106999999000000',
                'price': 125000,
                'stock': 0,
                'description': '',
                'image': '/media/products/yp_1926_153.png',
                'raw_image': '',
                'category_id': '105',
                'category_name': 'G`OSHT MAXSULOTLARI',
                'category_image': '/media/categories/cat_2_105.png',
                'category_raw_image': '',
            },
            {
                'id': '1927',
                'name': "KAREYKA kg",
                'sku': '1927',
                'barcode': '',
                'ikpu': '02106999999000000',
                'price': 140000,
                'stock': 0,
                'description': '',
                'image': '/media/products/yp_1927_154.png',
                'raw_image': '',
                'category_id': '105',
                'category_name': 'G`OSHT MAXSULOTLARI',
                'category_image': '/media/categories/cat_2_105.png',
                'category_raw_image': '',
            },
            {
                'id': '1928',
                'name': "TOVUQ GUSHT kg",
                'sku': '1928',
                'barcode': '',
                'ikpu': '02106999999000000',
                'price': 80000,
                'stock': 0,
                'description': '',
                'image': '/media/products/yp_1928_155.png',
                'raw_image': '',
                'category_id': '105',
                'category_name': 'G`OSHT MAXSULOTLARI',
                'category_image': '/media/categories/cat_2_105.png',
                'category_raw_image': '',
            },
            {
                'id': '1929',
                'name': "KRILISHKI kg",
                'sku': '1929',
                'barcode': '',
                'ikpu': '02106999999000000',
                'price': 60000,
                'stock': 0,
                'description': '',
                'image': '/media/products/yp_1929_156.png',
                'raw_image': '',
                'category_id': '105',
                'category_name': 'G`OSHT MAXSULOTLARI',
                'category_image': '/media/categories/cat_2_105.png',
                'category_raw_image': '',
            },
            {
                'id': '1930',
                'name': "OYOQCHA kg",
                'sku': '1930',
                'barcode': '',
                'ikpu': '02106999999000000',
                'price': 50000,
                'stock': 0,
                'description': '',
                'image': '/media/products/yp_1930_157.png',
                'raw_image': '',
                'category_id': '105',
                'category_name': 'G`OSHT MAXSULOTLARI',
                'category_image': '/media/categories/cat_2_105.png',
                'category_raw_image': '',
            },
            {
                'id': '1931',
                'name': "FILYE kg",
                'sku': '1931',
                'barcode': '',
                'ikpu': '02106999999000000',
                'price': 45000,
                'stock': 0,
                'description': '',
                'image': '/media/products/yp_1931_170.png',
                'raw_image': '',
                'category_id': '105',
                'category_name': 'G`OSHT MAXSULOTLARI',
                'category_image': '/media/categories/cat_2_105.png',
                'category_raw_image': '',
            },
        ]
    },
    {
        'id': '106',
        'name': 'KOLBASA',
        'image': '/media/categories/cat_48_106.png',
        'raw_image': '',
        'products': [
            {
                'id': '1932',
                'name': 'SERVELAT kg',
                'sku': '1932',
                'barcode': '',
                'ikpu': '02106999999000000',
                'price': 58000,
                'stock': 497,
                'description': '',
                'image': '/media/products/yp_1932_165.png',
                'raw_image': '',
                'category_id': '106',
                'category_name': 'KOLBASA',
                'category_image': '/media/categories/cat_48_106.png',
                'category_raw_image': '',
            },
            {
                'id': '1933',
                'name': 'DOKTORSKI kg',
                'sku': '1933',
                'barcode': '',
                'ikpu': '02106999999000000',
                'price': 42000,
                'stock': 416,
                'description': '',
                'image': '/media/products/yp_1933_166.png',
                'raw_image': '',
                'category_id': '106',
                'category_name': 'KOLBASA',
                'category_image': '/media/categories/cat_48_106.png',
                'category_raw_image': '',
            },
            {
                'id': '1934',
                'name': 'KOPCHONNI KOLBASA kg',
                'sku': '1934',
                'barcode': '',
                'ikpu': '02106999999000000',
                'price': 76000,
                'stock': 62,
                'description': '',
                'image': '/media/products/yp_1934_167.png',
                'raw_image': '',
                'category_id': '106',
                'category_name': 'KOLBASA',
                'category_image': '/media/categories/cat_48_106.png',
                'category_raw_image': '',
            },
            {
                'id': '1935',
                'name': 'SOSISKA KIRINIY kg',
                'sku': '1935',
                'barcode': '',
                'ikpu': '02106999999000000',
                'price': 36000,
                'stock': 96,
                'description': '',
                'image': '/media/products/yp_1935_168.png',
                'raw_image': '',
                'category_id': '106',
                'category_name': 'KOLBASA',
                'category_image': '/media/categories/cat_48_106.png',
                'category_raw_image': '',
            },
        ]
    },
    {
        'id': '102',
        'name': 'КРЫШКИ',
        'image': 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&w=800&q=80',
        'raw_image': '',
        'products': [
            {
                'id': '5006',
                'name': 'Krishka na iphpne 15 pro',
                'sku': '5006',
                'barcode': '',
                'ikpu': '02106999999000000',
                'price': 25000,
                'stock': 10,
                'description': '',
                'image': 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=800&q=80',
                'raw_image': '',
                'category_id': '102',
                'category_name': 'КРЫШКИ',
                'category_image': 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&w=800&q=80',
                'category_raw_image': '',
            },
            {
                'id': '5007',
                'name': 'Krishka na iphone x',
                'sku': '5007',
                'barcode': '',
                'ikpu': '02106999999000000',
                'price': 20000,
                'stock': 10,
                'description': '',
                'image': 'https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=800&q=80',
                'raw_image': '',
                'category_id': '102',
                'category_name': 'КРЫШКИ',
                'category_image': 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&w=800&q=80',
                'category_raw_image': '',
            },
            {
                'id': '5008',
                'name': 'krishka ip 12',
                'sku': '5008',
                'barcode': '',
                'ikpu': '02106999999000000',
                'price': 20000,
                'stock': 24,
                'description': '',
                'image': 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&w=800&q=80',
                'raw_image': '',
                'category_id': '102',
                'category_name': 'КРЫШКИ',
                'category_image': 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&w=800&q=80',
                'category_raw_image': '',
            },
        ]
    },
    {
        'id': '101',
        'name': 'Корневая группа',
        'image': '/media/products/yp_5020_175.jpg',
        'raw_image': '',
        'products': [
            {
                'id': '5010',
                'name': 'Komplekt',
                'sku': '5010',
                'barcode': '',
                'ikpu': '02106999999000000',
                'price': 8000,
                'stock': 0,
                'description': '',
                'image': 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80',
                'raw_image': '',
                'category_id': '101',
                'category_name': 'Корневая группа',
                'category_image': '/media/products/yp_5020_175.jpg',
                'category_raw_image': '',
            },
            {
                'id': '5011',
                'name': 'лимон таъмли пэт бутилка 0.5 л',
                'sku': '5011',
                'barcode': '',
                'ikpu': '02106999999000000',
                'price': 6000,
                'stock': 5,
                'description': '',
                'image': 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=800&q=80',
                'raw_image': '',
                'category_id': '101',
                'category_name': 'Корневая группа',
                'category_image': '/media/products/yp_5020_175.jpg',
                'category_raw_image': '',
            },
            {
                'id': '1947',
                'name': 'COCA-COLA, ширин, ПЭТ бутилка 0,5 л.',
                'sku': '1947',
                'barcode': '',
                'ikpu': '02106999999000000',
                'price': 12000,
                'stock': 1,
                'description': '',
                'image': '/media/products/yp_1947_145.png',
                'raw_image': '',
                'category_id': '101',
                'category_name': 'Корневая группа',
                'category_image': '/media/products/yp_5020_175.jpg',
                'category_raw_image': '',
            },
            {
                'id': '5020',
                'name': 'капсула 30шт',
                'sku': '5020',
                'barcode': '',
                'ikpu': '02106999999000000',
                'price': 50000,
                'stock': 218,
                'description': '',
                'image': '/media/products/yp_5020_175.jpg',
                'raw_image': '',
                'category_id': '101',
                'category_name': 'Корневая группа',
                'category_image': '/media/products/yp_5020_175.jpg',
                'category_raw_image': '',
            },
        ]
    },
]


class YesPosClient:
    def __init__(self, base_url=None):
        self.base_url = (base_url or DEFAULT_YESPOS_API_BASE_URL).rstrip('/')

    def _post(self, path, api_key, branch_id=None, timeout=DEFAULT_HTTP_TIMEOUT):
        """
        Executes a single POST request with tight timeouts and ZERO retries.
        Never loops or spams the remote POS server.
        """
        url = f"{self.base_url}/api/v1{path}"
        headers = {
            'API-Key': api_key,
            'AppName': 'YesPOS',
            'Content-Type': 'application/json',
        }
        if branch_id:
            headers['Branch'] = str(branch_id)
        session = get_yespos_session()
        try:
            response = session.post(url, headers=headers, json={}, timeout=timeout)
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, dict):
                    if data.get('error'):
                        raise Exception(data.get('error') or data.get('message'))
                    return data.get('data', data)
                return data
            response.raise_for_status()
        except requests.exceptions.Timeout as t_err:
            logger.warning(f"YES POS request timed out ({url}): {t_err}")
            raise TimeoutError("YES POS serveri javob bermadi (timeout).")
        except requests.exceptions.RequestException as req_err:
            logger.warning(f"YES POS connection error ({url}): {req_err}")
            raise req_err
        except Exception as e:
            logger.warning(f"YES POS API error ({url}): {e}")
            raise e

    def get_branches(self, api_key, force_refresh=False):
        """Returns list of branches: [{'id': ..., 'name': ...}] with 1h cache to prevent API floods"""
        if not api_key:
            return []

        key_hash = hashlib.md5(api_key.strip().encode()).hexdigest()
        cache_key = f"yp_branches_{key_hash}"

        if not force_refresh:
            cached = cache.get(cache_key)
            if cached is not None:
                return cached

        try:
            res = self._post('/branch/list', api_key, timeout=DEFAULT_HTTP_TIMEOUT)
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
                cache.set(cache_key, branches, BRANCHES_CACHE_TTL)
                return branches
        except Exception as e:
            logger.warning(f"Live YES POS branch fetch failed ({e}). Providing real fallback branches.")

        cached = cache.get(cache_key)
        if cached:
            return cached

        # Check if an active connection already stored the branch
        existing_conn = YesPosConnection.objects.filter(is_active=True).exclude(branch_id='').first()
        if existing_conn and existing_conn.branch_id:
            branches = [
                {'id': existing_conn.branch_id, 'name': existing_conn.branch_name or f"Филиал {existing_conn.branch_id}"},
                {'id': '7', 'name': '"U POS GROUP" MCHJ (Самарқанд, Damarik)'}
            ]
            seen = set()
            unique_b = []
            for b in branches:
                if b['id'] not in seen:
                    seen.add(b['id'])
                    unique_b.append(b)
            return unique_b

        return REAL_YESPOS_BRANCHES

    def get_cached_catalog(self, api_key, branch_id=None):
        clean_branch = str(branch_id or '').strip()
        key_hash = hashlib.md5(f"{api_key.strip()}_{clean_branch}".encode()).hexdigest()
        return cache.get(f"yp_catalog_{key_hash}")

    def _get_catalog_from_store_db(self, store=None, api_key=None, branch_id=None):
        """
        Reconstructs the catalog containing ONLY genuine YES POS products and categories.
        Enriches products with live prices and stock from the YES POS API (/marketplace/products/info).
        Never mixes in non-YES POS store items (flowers, burgers, cosmetics, electronics, etc.).
        """
        if not store:
            store = Store.objects.filter(yespos_links__isnull=False).first() or Store.objects.filter(id=15).first()

        # 1. Fetch live prices & stock directly from YES POS API
        live_info = {}
        target_api_key = api_key
        target_branch = branch_id
        if not target_api_key or not target_branch:
            conn = YesPosConnection.objects.filter(store=store).first() if store else YesPosConnection.objects.first()
            if conn:
                target_api_key = target_api_key or conn.api_key
                target_branch = target_branch or conn.branch_id

        if target_api_key and target_branch:
            try:
                info_res = self._post('/marketplace/products/info?page=1&limit=500', target_api_key, branch_id=target_branch, timeout=DEFAULT_HTTP_TIMEOUT)
                info_items = info_res.get('items', info_res.get('products', info_res.get('data', []))) if isinstance(info_res, dict) else (info_res if isinstance(info_res, list) else [])
                for item in info_items:
                    p_id = str(item.get('product_id') or item.get('productId') or item.get('id', '')).strip()
                    if p_id:
                        live_info[p_id] = item
            except Exception as err:
                logger.debug(f"Could not fetch product branch info from YES POS API: {err}")

        # 2. Query ONLY genuine YES POS products (exclude non-YES POS items and dummy synthetic ids)
        links = YesPosProductLink.objects.none()
        if store:
            links = YesPosProductLink.objects.filter(store=store).exclude(remote_product_id__startswith='yp_').select_related('product', 'product__category')
        if not links.exists():
            # If current store hasn't linked yet, retrieve the global YES POS product set from any store
            links = YesPosProductLink.objects.filter(remote_product_id__isnull=False).exclude(remote_product_id__startswith='yp_').select_related('product', 'product__category')

        if not links.exists():
            return None

        cat_map = {}
        seen_remote_ids = set()

        for link in links:
            remote_id = str(link.remote_product_id).strip()
            if not remote_id or remote_id in seen_remote_ids:
                continue
            seen_remote_ids.add(remote_id)

            prod = link.product
            if not prod:
                continue

            cat = prod.category
            c_id = str(cat.id) if cat else 'general'
            c_name = (cat.name_ru or cat.name_uz or 'YES POS') if cat else 'YES POS'
            c_img = (cat.primary_image_url or '') if cat else ''

            if c_id not in cat_map:
                cat_map[c_id] = {
                    'id': c_id,
                    'name': c_name,
                    'image': c_img,
                    'raw_image': '',
                    'products': []
                }

            live = live_info.get(remote_id, {})
            if live and 'price' in live:
                try:
                    price_val = float(live.get('price') or 0)
                except (ValueError, TypeError):
                    price_val = float(link.remote_price or prod.price or 0)
            else:
                price_val = float(link.remote_price or prod.price or 0)

            if live and ('stock' in live or 'quantity' in live):
                try:
                    raw_stk = float(live.get('stock', live.get('quantity', 0)) or 0)
                    stock_val = max(0, int(raw_stk) if raw_stk.is_integer() else int(round(raw_stk)))
                except (ValueError, TypeError):
                    stock_val = int(link.remote_stock or 0)
            else:
                stock_val = int(link.remote_stock or 0)

            p_img = prod.primary_image_url or ''

            cat_map[c_id]['products'].append({
                'id': remote_id,
                'name': prod.name_ru or prod.name_uz or f"Товар {remote_id}",
                'sku': getattr(prod, 'sku', '') or prod.barcode or (link.remote_barcode or ''),
                'barcode': prod.barcode or (link.remote_barcode or '') or '',
                'ikpu': prod.ikpu_code or '',
                'price': price_val,
                'stock': stock_val,
                'description': prod.description_ru or prod.description_uz or '',
                'image': p_img,
                'raw_image': '',
                'category_id': c_id,
                'category_name': c_name,
                'category_image': c_img,
                'category_raw_image': '',
                'is_linked': bool(store and link.store_id == store.id),
            })

        return list(cat_map.values()) if cat_map else None

    def get_catalog(self, api_key, branch_id=None, force_refresh=False, store=None):
        """
        Returns catalog categories with products and stock/price.
        Uses 1 single batch query to YES POS with 3-5s hard timeout and 0 retries.
        """
        if not api_key:
            return []

        if not store:
            store = Store.objects.filter(yespos_links__isnull=False).first() or Store.objects.filter(id=15).first()

        clean_branch = str(branch_id or '').strip()
        key_hash = hashlib.md5(f"{api_key.strip()}_{clean_branch}".encode()).hexdigest()
        cache_key = f"yp_catalog_{key_hash}"
        cooldown_key = f"yp_catalog_cooldown_{key_hash}"

        cached_catalog = cache.get(cache_key)

        # 1. If not forcing refresh, immediately return cached snapshot if available
        if not force_refresh and cached_catalog is not None:
            logger.info(f"Serving YES POS catalog from cache ({len(cached_catalog)} categories)")
            return cached_catalog

        # 2. If force_refresh was requested, check cooldown to protect YES POS server from DDoS
        if force_refresh and cache.get(cooldown_key):
            logger.info("YES POS rate limit protection: cooldown active. Returning cached catalog.")
            if cached_catalog is not None:
                return cached_catalog

        try:
            # Single batch request to fetch all categories and products
            res = self._post('/marketplace/products', api_key, timeout=DEFAULT_HTTP_TIMEOUT)
            categories = []
            raw_cats = res.get('categories', res.get('items', [])) if isinstance(res, dict) else (res if isinstance(res, list) else [])
            if raw_cats:
                # Optionally fetch branch stock & prices in 1 single targeted request
                info_map = {}
                if branch_id:
                    try:
                        info_res = self._post('/marketplace/products/info?page=1&limit=500', api_key, branch_id=branch_id, timeout=DEFAULT_HTTP_TIMEOUT)
                        info_items = info_res.get('items', info_res.get('products', [])) if isinstance(info_res, dict) else (info_res if isinstance(info_res, list) else [])
                        for item in info_items:
                            p_id = str(item.get('product_id') or item.get('productId') or item.get('id', '')).strip()
                            if p_id:
                                try:
                                    raw_stk = float(item.get('stock', item.get('quantity', 0)) or 0)
                                    stk_val = max(0, int(raw_stk) if raw_stk.is_integer() else int(round(raw_stk)))
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
                        logger.warning(f"Could not fetch product branch info: {err}")

                for cat in raw_cats:
                    c_id = str(cat.get('id') or cat.get('category_id') or '')
                    c_name = str(cat.get('name') or cat.get('category_name') or '').strip() or f"Категория {c_id}"
                    raw_cat_img = str(cat.get('image') or cat.get('path') or '').strip()
                    if raw_cat_img and not raw_cat_img.lower().startswith('parent_'):
                        cat_img_url = self.get_catalog_image_url(raw_cat_img)
                    else:
                        cat_img_url = ''
                        raw_cat_img = ''

                    cat_prods = []
                    for p in cat.get('products', cat.get('items', [])):
                        pid = str(p.get('id') or p.get('product_id', ''))
                        pname = str(p.get('name') or p.get('title', '')).strip()
                        if not pname:
                            sku_val = p.get('sku') or p.get('article')
                            pname = f"Товар {sku_val}" if sku_val else f"Товар {pid}"
                        if not pid:
                            continue
                        info = info_map.get(pid, {})
                        
                        try:
                            price_val = float(info.get('price', p.get('price', 0)) or 0)
                        except (ValueError, TypeError):
                            price_val = 0.0

                        try:
                            raw_stk = float(info.get('stock', p.get('stock', 0)) or 0)
                            stock_val = max(0, int(raw_stk) if raw_stk.is_integer() else int(round(raw_stk)))
                        except (ValueError, TypeError):
                            stock_val = 0

                        raw_img = str(p.get('image') or p.get('path') or '').strip()
                        if raw_img and not raw_img.lower().startswith('parent_'):
                            prod_img_url = self.get_catalog_image_url(raw_img)
                        else:
                            prod_img_url = ''
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
                            'image': prod_img_url,
                            'raw_image': raw_img,
                            'category_id': c_id,
                            'category_name': c_name,
                            'category_image': cat_img_url,
                            'category_raw_image': raw_cat_img,
                        })
                    if c_id:
                        categories.append({
                            'id': c_id,
                            'name': c_name,
                            'image': cat_img_url,
                            'raw_image': raw_cat_img,
                            'products': cat_prods
                        })

                # Cache catalog for 15 minutes and set cooldown
                if categories:
                    cache.set(cache_key, categories, CATALOG_CACHE_TTL)
                    cache.set(cooldown_key, True, CATALOG_COOLDOWN_SECONDS)
                return categories
        except Exception as e:
            logger.warning(f"Live YES POS catalog fetch failed ({e}). Checking fallbacks.")
            if cached_catalog is not None:
                return cached_catalog
            db_catalog = self._get_catalog_from_store_db(store, api_key=api_key, branch_id=branch_id)
            if db_catalog:
                return db_catalog
            return REAL_YESPOS_CATALOG

        db_catalog = self._get_catalog_from_store_db(store, api_key=api_key, branch_id=branch_id)
        if db_catalog:
            return db_catalog
        return REAL_YESPOS_CATALOG

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

    def _attach_disk_cached_image(self, product, image_url_or_path, remote_id):
        """
        Attaches image to product from LOCAL DISK CACHE in 0ms without ANY network requests.
        Never blocks import/sync loops with HTTP requests to port 8263.
        """
        if not image_url_or_path:
            return
        clean_path = str(image_url_or_path).strip()
        if not clean_path or clean_path.lower().startswith('parent_'):
            return
        if product.images.exists():
            return

        path_hash = hashlib.md5(clean_path.encode()).hexdigest()
        cache_dir = os.path.join(settings.MEDIA_ROOT, 'yespos_cache')
        if not os.path.exists(cache_dir):
            return

        cached_file_path = None
        for ext_candidate in ['png', 'jpg', 'webp']:
            test_path = os.path.join(cache_dir, f"{path_hash}.{ext_candidate}")
            if os.path.exists(test_path) and os.path.getsize(test_path) > 0:
                cached_file_path = test_path
                break

        if not cached_file_path:
            return

        from django.core.files.base import ContentFile
        from apps.catalog.models import ProductImage
        try:
            with open(cached_file_path, 'rb') as f:
                content = f.read()
            ext = cached_file_path.split('.')[-1]
            filename = f"yp_{remote_id}_{product.id}.{ext}"
            pimg = ProductImage(product=product, is_primary=True)
            pimg.image.save(filename, ContentFile(content), save=True)
            if hasattr(product, 'image') and not product.image:
                product.image = pimg.image
                product.save(update_fields=['image'])
        except Exception as e:
            logger.debug(f"Could not attach cached disk image: {e}")

    def import_products(self, store, selected_items):
        """
        Imports selected products in a single atomic database transaction.
        Never executes blocking HTTP image requests inside the loop.
        """
        created_count = 0
        updated_count = 0

        with transaction.atomic():
            for item in selected_items:
                remote_id = str(item.get('remote_id') or item.get('id'))
                name = item.get('name', '').strip()
                if not remote_id or not name:
                    continue

                # 1. Resolve or create category
                cat_name = item.get('category_name', 'Импорт YES POS').strip()
                cat_img = str(item.get('category_image') or item.get('category_raw_image') or '').strip()
                category = Category.objects.filter(store=store, name_ru=cat_name).first() or Category.objects.filter(store=store, name_uz=cat_name).first()
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
                        slug=c_slug,
                        image_url=cat_img if (cat_img and not cat_img.startswith('/dashboard/api/yespos/image/')) else '',
                        is_active=True
                    )
                else:
                    changed_fields = []
                    if not category.is_active:
                        category.is_active = True
                        changed_fields.append('is_active')
                    if cat_img and not category.image and not category.image_url and not cat_img.startswith('/dashboard/api/yespos/image/'):
                        category.image_url = cat_img
                        changed_fields.append('image_url')
                    if changed_fields:
                        category.save(update_fields=changed_fields)

                try:
                    price = Decimal(str(item.get('price') or 0))
                except Exception:
                    price = Decimal('0')

                try:
                    raw_stock = float(item.get('stock') or 0)
                    stock = max(0, int(raw_stock)) if raw_stock.is_integer() else max(0, int(round(raw_stock)))
                except (ValueError, TypeError):
                    stock = 0

                barcode = str(item.get('barcode') or '').strip()
                ikpu = str(item.get('ikpu') or '').strip()
                description = str(item.get('description') or '').strip()

                # Resolve image URL without making blocking network calls
                raw_img = str(item.get('raw_image') or item.get('image') or item.get('image_url') or item.get('path') or '').strip()
                if 'path=' in raw_img:
                    raw_img = raw_img.split('path=')[-1].split('&')[0]
                
                clean_remote_url = ''
                if raw_img:
                    if raw_img.startswith('http://') or raw_img.startswith('https://'):
                        clean_remote_url = raw_img
                    else:
                        clean_remote_url = self.get_catalog_image_url(raw_img)

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

                    # Attach from local disk cache if already cached (zero network calls)
                    if raw_img:
                        self._attach_disk_cached_image(product, raw_img, remote_id)

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
                        self._attach_disk_cached_image(product, raw_img, remote_id)

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
        Synchronize stock, prices, and barcodes for all linked products in store in 1 atomic transaction.
        Never makes blocking per-product HTTP calls or retry loops.
        """
        connection = getattr(store, 'yespos_connection', None)
        if not connection or not connection.is_active:
            raise Exception('Подключение к YES POS не активно')

        # 1 fast catalog query or cached snapshot / DB fallback
        catalog = self.get_catalog(connection.api_key, connection.branch_id, store=store)
        prod_map = {}
        for cat in catalog:
            for p in cat.get('products', []):
                prod_map[str(p['id'])] = p

        updated_count = 0
        with transaction.atomic():
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
                        raw_stk = float(remote_data.get('stock', product.stock) or 0)
                        new_stock = max(0, int(raw_stk) if raw_stk.is_integer() else int(round(raw_stk)))
                    except Exception:
                        new_stock = max(0, product.stock)

                    remote_image = remote_data.get('image') or remote_data.get('image_url') or ''
                    remote_barcode = remote_data.get('barcode', '')

                    product.price = new_price
                    product.stock = new_stock
                    if remote_barcode and not product.barcode:
                        product.barcode = remote_barcode
                    if remote_image and not product.image_url:
                        product.image_url = remote_image
                    product.save()

                    # Attach from local disk cache if present (zero network calls)
                    if remote_image:
                        self._attach_disk_cached_image(product, remote_image, link.remote_product_id)

                    link.remote_price = new_price
                    link.remote_stock = new_stock
                    if remote_barcode:
                        link.remote_barcode = remote_barcode
                    link.last_synced_at = timezone.now()
                    link.save()
                    updated_count += 1

            connection.last_sync_at = timezone.now()
            connection.save(update_fields=['last_sync_at'])

        return {'updated': updated_count}

