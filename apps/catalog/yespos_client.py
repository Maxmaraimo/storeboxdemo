import os
import hashlib
import requests
import logging
from django.conf import settings
from django.core.cache import cache
from services.yespos_sync import YesPosService, download_and_attach_product_image

logger = logging.getLogger(__name__)

DEFAULT_YESPOS_API_BASE_URL = 'https://marketplace.yestask.uz'
DEFAULT_YESPOS_MEDIA_HOST = 'http://app.yespos.uz:8263'

_yp_session = None

def get_yespos_session():
    """Returns a requests.Session configured for YES POS calls."""
    global _yp_session
    if _yp_session is None:
        _yp_session = requests.Session()
    return _yp_session


class YesPosClient:
    """
    Official YES POS Client powered by YesPosService.
    All data is retrieved live from the official API https://marketplace.yestask.uz.
    No hardcoded mocks, snapshots, or dummy data.
    """
    def __init__(self, base_url=None):
        self.base_url = (base_url or DEFAULT_YESPOS_API_BASE_URL).rstrip('/')

    def get_branches(self, api_key, force_refresh=False):
        if not api_key:
            return []
        service = YesPosService(api_key=api_key)
        return service.get_branches()

    def get_catalog(self, api_key, branch_id=None, force_refresh=False, store=None):
        if not api_key:
            return []
        clean_branch = str(branch_id or '1').strip()
        key_hash = hashlib.md5(f"{api_key.strip()}_{clean_branch}".encode()).hexdigest()
        cache_key = f"yp_catalog_{key_hash}"

        if not force_refresh:
            cached = cache.get(cache_key)
            if cached:
                return cached

        service = YesPosService(api_key=api_key, branch_id=clean_branch)
        catalog = service.fetch_full_catalog()
        if catalog:
            cache.set(cache_key, catalog, 600)
        return catalog or []

    def get_remote_image_url(self, image_path):
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
        if not image_path:
            return ''
        image_str = str(image_path).strip()
        if not image_str or image_str.lower().startswith('parent_'):
            return ''
        if image_str.startswith('http://') or image_str.startswith('https://'):
            return image_str
        clean_path = image_str.lstrip('/')
        return f"/dashboard/api/yespos/image/?path={clean_path}"

    def import_products(self, store, selected_items=None):
        from apps.catalog.models import YesPosConnection
        conn = YesPosConnection.objects.filter(store=store).first()
        service = YesPosService(
            api_key=conn.api_key if conn else '',
            branch_id=conn.branch_id if conn else '1'
        )
        if selected_items is None:
            return service.sync_to_store(store)
        return service.import_items(store, selected_items)

    def sync_store_products(self, store):
        from apps.catalog.models import YesPosConnection
        conn = YesPosConnection.objects.filter(store=store).first()
        if not conn or not conn.is_active:
            raise ValueError("YES POS ulanmagan")
        service = YesPosService(api_key=conn.api_key, branch_id=conn.branch_id)
        return service.sync_to_store(store)
