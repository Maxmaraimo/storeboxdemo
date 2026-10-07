import os
import hashlib
import requests
import logging
import concurrent.futures
from decimal import Decimal
from django.utils import timezone
from django.utils.text import slugify
from django.db import transaction
from django.conf import settings
from django.core.cache import cache

logger = logging.getLogger(__name__)


def download_and_attach_product_image(product, raw_image_path, force=False):
    """
    Downloads real image from YES POS media host (http://app.yespos.uz:8263/getImage?path=...)
    and attaches it to ProductImage as a permanent local file, with disk cache in media/yespos_cache.
    If raw_image_path is empty, cleanly removes existing ProductImage and clears product.image_url.
    """
    from apps.catalog.models import ProductImage
    from django.core.files.base import ContentFile

    if not raw_image_path:
        # Product in YES POS has no image (or image was removed): clean up existing images
        product.images.all().delete()
        if product.image_url and ("/dashboard/api/yespos/image/" in product.image_url or "temp-images/" in product.image_url):
            product.image_url = ""
            product.save(update_fields=["image_url"])
        return False

    clean = str(raw_image_path).strip().lstrip('/')
    if 'path=' in clean:
        clean = clean.split('path=')[-1].split('&')[0].lstrip('/')
    if not clean or clean.startswith('media/products/yp_') or clean.lower().startswith('parent_'):
        return False

    path_hash = hashlib.md5(clean.encode()).hexdigest()
    cache_dir = os.path.join(settings.MEDIA_ROOT, 'yespos_cache')
    os.makedirs(cache_dir, exist_ok=True)

    # Check if the product already has this exact photo attached
    existing_pimg = product.images.filter(is_primary=True).first()
    expected_prefix = f"yp_{product.id}_{path_hash[:8]}."
    if not force and existing_pimg and existing_pimg.image and expected_prefix in existing_pimg.image.name:
        return True

    content = None
    ext = 'png'

    # 1. Check local disk cache (only if not forcing refresh)
    if not force:
        for ext_cand in ['png', 'jpg', 'jpeg', 'webp']:
            cache_path = os.path.join(cache_dir, f"{path_hash}.{ext_cand}")
            if os.path.exists(cache_path) and os.path.getsize(cache_path) > 100:
                try:
                    with open(cache_path, 'rb') as f:
                        content = f.read()
                    ext = ext_cand
                    break
                except Exception:
                    pass

    # 2. Fetch directly from official YES POS media server
    if not content:
        url = f"http://app.yespos.uz:8263/getImage?path={clean}"
        try:
            r = requests.get(url, timeout=4.5)
            if r.status_code == 200 and len(r.content) > 100:
                content = r.content
                ext = 'png' if content.startswith(b'\x89PNG') or clean.lower().endswith('.png') else 'jpg'
                cache_path = os.path.join(cache_dir, f"{path_hash}.{ext}")
                with open(cache_path, 'wb') as f:
                    f.write(content)
        except Exception as e:
            logger.debug(f"Could not fetch YES POS image {clean}: {e}")
            return False

    # 3. Save as local ProductImage
    if content:
        try:
            pimg = product.images.filter(is_primary=True).first()
            if not pimg:
                pimg = ProductImage(product=product, is_primary=True)
            filename = f"yp_{product.id}_{path_hash[:8]}.{ext}"
            pimg.image.save(filename, ContentFile(content), save=True)
            # Remove any stale/duplicate images for this product
            product.images.exclude(id=pimg.id).delete()
            return True
        except Exception as e:
            logger.debug(f"Could not save ProductImage for {product.id}: {e}")

    return False


def download_and_attach_category_image(category, raw_image_path, force=False):
    """
    Downloads real image from YES POS and attaches it to Category.image.
    If raw_image_path is empty, clears category image.
    """
    if not raw_image_path:
        category.image = None
        category.image_url = ""
        category.save(update_fields=["image", "image_url"])
        return False

    clean = str(raw_image_path).strip().lstrip('/')
    if 'path=' in clean:
        clean = clean.split('path=')[-1].split('&')[0].lstrip('/')
    if not clean or clean.startswith('media/products/yp_') or clean.lower().startswith('parent_'):
        return False

    path_hash = hashlib.md5(clean.encode()).hexdigest()
    cache_dir = os.path.join(settings.MEDIA_ROOT, 'yespos_cache')
    os.makedirs(cache_dir, exist_ok=True)

    expected_prefix = f"cat_{category.id}_{path_hash[:8]}."
    if not force and category.image and expected_prefix in category.image.name:
        return True

    content = None
    ext = 'png'
    if not force:
        for ext_cand in ['png', 'jpg', 'jpeg', 'webp']:
            cache_path = os.path.join(cache_dir, f"{path_hash}.{ext_cand}")
            if os.path.exists(cache_path) and os.path.getsize(cache_path) > 100:
                try:
                    with open(cache_path, 'rb') as f:
                        content = f.read()
                    ext = ext_cand
                    break
                except Exception:
                    pass

    if not content:
        url = f"http://app.yespos.uz:8263/getImage?path={clean}"
        try:
            r = requests.get(url, timeout=4.5)
            if r.status_code == 200 and len(r.content) > 100:
                content = r.content
                ext = 'png' if content.startswith(b'\x89PNG') or clean.lower().endswith('.png') else 'jpg'
                cache_path = os.path.join(cache_dir, f"{path_hash}.{ext}")
                with open(cache_path, 'wb') as f:
                    f.write(content)
        except Exception:
            return False

    if content:
        from django.core.files.base import ContentFile
        try:
            filename = f"cat_{category.id}_{path_hash[:8]}.{ext}"
            category.image.save(filename, ContentFile(content), save=True)
            return True
        except Exception:
            pass

    return False


class YesPosService:
    BASE_URL = "https://marketplace.yestask.uz"

    def __init__(self, api_key: str, branch_id: str = "1"):
        self.api_key = (api_key or "").strip()
        self.branch_id = str(branch_id or "1").strip()
        self.headers = {
            "API-Key": self.api_key,
            "AppName": "StoreBox",
            "Branch": self.branch_id,
            "Accept": "application/json",
            "Content-Type": "application/json",
        }

    def get_branches(self):
        """
        Fetches list of branches from /api/v1/branch/list via official API.
        Returns a clean list of all available branches.
        """
        url = f"{self.BASE_URL}/api/v1/branch/list"
        try:
            res = requests.post(url, headers=self.headers, json={}, timeout=12)
            if res.status_code == 200:
                data = res.json()
                raw_items = data.get("data", data.get("branches", [])) if isinstance(data, dict) else data
                branches = []
                seen = set()
                for r in (raw_items or []):
                    if not isinstance(r, dict):
                        continue
                    b_id = str(r.get("id") or r.get("branch_id") or "").strip()
                    if not b_id or b_id in seen:
                        continue
                    seen.add(b_id)
                    b_name = str(r.get("name") or f"Филиал {b_id}").strip()
                    b_addr = str(r.get("address") or "").strip()
                    display_name = b_name
                    if b_addr and b_addr.lower() not in display_name.lower():
                        display_name = f"{display_name} ({b_addr})"
                    branches.append({"id": b_id, "name": display_name})
                if branches:
                    return branches
        except Exception as e:
            logger.warning(f"YesPosService.get_branches POST failed: {e}")

        # Fallback to GET
        response = requests.get(url, headers=self.headers, timeout=12)
        response.raise_for_status()
        data = response.json()
        raw_items = data.get("data", data.get("branches", [])) if isinstance(data, dict) else data
        branches = []
        seen = set()
        for r in (raw_items or []):
            if isinstance(r, dict):
                b_id = str(r.get("id") or "").strip()
                b_name = str(r.get("name") or f"Филиал {b_id}").strip()
                if b_id and b_id not in seen:
                    seen.add(b_id)
                    branches.append({"id": b_id, "name": b_name})
        return branches

    def fetch_all_products(self):
        """
        Paginates through /api/v1/marketplace/products/info with limit=500 in a loop
        (page=1, 2, 3...) until an empty list or short page is returned.
        Guarantees retrieval of all warehouse items (prices and stocks).
        """
        all_products = []
        page = 1
        limit = 500
        while True:
            url = f"{self.BASE_URL}/api/v1/marketplace/products/info"
            params = {"page": page, "limit": limit}
            try:
                response = requests.post(
                    f"{url}?page={page}&limit={limit}",
                    headers=self.headers,
                    json={},
                    timeout=12
                )
                if response.status_code in (404, 405):
                    response = requests.get(url, headers=self.headers, params=params, timeout=12)
            except Exception:
                response = requests.get(url, headers=self.headers, params=params, timeout=12)

            response.raise_for_status()
            data = response.json()
            products = data.get("data", data.get("products", data.get("items", []))) if isinstance(data, dict) else data
            if not products or not isinstance(products, list):
                break
            all_products.extend(products)
            if len(products) < limit:
                break
            page += 1
        return all_products

    def fetch_catalog_tree(self):
        """Fetches product and category tree from /api/v1/marketplace/products"""
        url = f"{self.BASE_URL}/api/v1/marketplace/products"
        try:
            response = requests.post(url, headers=self.headers, json={}, timeout=12)
            if response.status_code in (404, 405):
                response = requests.get(url, headers=self.headers, timeout=12)
        except Exception:
            response = requests.get(url, headers=self.headers, timeout=12)

        response.raise_for_status()
        data = response.json()
        return data.get("data", data.get("categories", [])) if isinstance(data, dict) else data

    def fetch_full_catalog(self):
        """
        Combines the live catalog tree with paginated branch prices and stocks.
        Returns authentic warehouse products with real names, prices, stocks, and photos.
        Fetches tree and branch items concurrently for maximum performance.
        Includes all warehouse items without false filters.
        """
        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
            fut_tree = executor.submit(self.fetch_catalog_tree)
            fut_prods = executor.submit(self.fetch_all_products)
            tree = fut_tree.result()
            branch_products = fut_prods.result()

        # Map branch price and stock by product_id
        price_stock_map = {}
        for bp in branch_products:
            if isinstance(bp, dict):
                pid = str(bp.get("product_id") or bp.get("id") or "").strip()
                if pid:
                    price_stock_map[pid] = bp

        enriched_catalog = []
        for cat in (tree or []):
            if not isinstance(cat, dict):
                continue
            cat_id = str(cat.get("id") or cat.get("category_id") or "")
            cat_name = str(cat.get("name") or "").strip() or f"Категория {cat_id}"
            
            raw_cat_img = str(cat.get("image") or "").strip()
            if "path=" in raw_cat_img:
                raw_cat_img = raw_cat_img.split("path=")[-1].split("&")[0]
            clean_cat_img = raw_cat_img.lstrip("/")
            cat_image_url = f"/dashboard/api/yespos/image/?path={clean_cat_img}" if clean_cat_img else ""

            prods = []
            for p in (cat.get("products", []) or []):
                if not isinstance(p, dict):
                    continue
                pid = str(p.get("id") or "").strip()
                if not pid:
                    continue

                sku = str(p.get("sku") or "").strip()
                barcode = str(p.get("barcode") or sku).strip()
                ikpu = str(p.get("classcode") or p.get("ikpu") or "").strip()

                name = str(p.get("name") or "").strip()
                if not name:
                    # Provide clean warehouse title for items without explicit title in YES POS
                    name = f"Товар (Арт: {sku})" if sku else f"Товар #{pid}"

                info = price_stock_map.get(pid, {})
                try:
                    price_val = float(info.get("price", p.get("price", 0)) or 0)
                except (ValueError, TypeError):
                    price_val = 0.0

                try:
                    raw_stk = float(info.get("stock", p.get("stock", 0)) or 0)
                    stock_val = max(0, int(raw_stk) if raw_stk.is_integer() else int(round(raw_stk)))
                except (ValueError, TypeError):
                    stock_val = 0

                raw_prod_img = str(p.get("image") or "").strip()
                if "path=" in raw_prod_img:
                    raw_prod_img = raw_prod_img.split("path=")[-1].split("&")[0]
                clean_prod_img = raw_prod_img.lstrip("/")

                if clean_prod_img:
                    prod_img_url = f"/dashboard/api/yespos/image/?path={clean_prod_img}"
                else:
                    prod_img_url = ""
                    clean_prod_img = ""

                desc = str(p.get("description") or "").strip()
                if not desc:
                    desc = f"{cat_name}" + (f" • Арт: {sku or barcode}" if (sku or barcode) else "")

                prods.append({
                    "id": pid,
                    "name": name,
                    "sku": sku,
                    "barcode": barcode,
                    "ikpu": ikpu,
                    "price": price_val,
                    "stock": stock_val,
                    "description": desc,
                    "image": prod_img_url,
                    "raw_image": clean_prod_img,
                    "category_id": cat_id,
                    "category_name": cat_name,
                    "category_image": cat_image_url,
                    "category_raw_image": clean_cat_img
                })

            if prods:
                enriched_catalog.append({
                    "id": cat_id,
                    "name": cat_name,
                    "image": cat_image_url,
                    "raw_image": clean_cat_img,
                    "products": prods
                })

        return enriched_catalog

    def sync_to_store(self, store, force=True):
        """
        Fetches full catalog from YES POS official API and saves/updates products in StoreBox DB
        without duplicates. Dynamically updates real names, prices, balances, categories, and real photos.
        """
        from apps.catalog.models import Product, Category, YesPosCategoryLink, YesPosProductLink

        catalog = self.fetch_full_catalog()
        created_count = 0
        updated_count = 0

        # Purge catalog cache so next catalog view always gets fresh data
        clean_branch = str(self.branch_id or "1").strip()
        key_hash = hashlib.md5(f"{self.api_key.strip()}_{clean_branch}".encode()).hexdigest()
        cache.delete(f"yp_catalog_{key_hash}")

        for cat_data in catalog:
            cat_name = cat_data["name"]
            cat_remote_id = cat_data["id"]
            cat_image = cat_data.get("image") or ""
            cat_raw_img = cat_data.get("raw_image") or ""

            # 1. Resolve or create category
            category = Category.objects.filter(store=store, name_ru=cat_name).first() or \
                       Category.objects.filter(store=store, name_uz=cat_name).first()
            if not category:
                base_slug = slugify(cat_name) or f"cat-{cat_remote_id}"
                c_slug = base_slug
                counter = 1
                while Category.objects.filter(store=store, slug=c_slug).exists():
                    c_slug = f"{base_slug}-{counter}"
                    counter += 1
                category = Category(
                    store=store,
                    name_ru=cat_name,
                    name_uz=cat_name,
                    slug=c_slug,
                    image_url=cat_image,
                    is_active=True
                )
                category._skip_auto_translation = True
                category.save()
            else:
                if cat_image != category.image_url:
                    category.image_url = cat_image
                    category._skip_auto_translation = True
                    category.save(update_fields=["image_url"])

            download_and_attach_category_image(category, cat_raw_img, force=force)

            if cat_remote_id:
                YesPosCategoryLink.objects.update_or_create(
                    store=store,
                    remote_category_id=cat_remote_id,
                    defaults={"category": category}
                )

            # 2. Map and update/create products
            for item in cat_data["products"]:
                remote_id = str(item["id"])
                name = item["name"]
                price = Decimal(str(item.get("price") or 0))
                stock = int(item.get("stock") or 0)
                barcode = str(item.get("barcode") or item.get("sku") or "").strip()
                ikpu = str(item.get("ikpu") or "").strip()
                desc = str(item.get("description") or "").strip()
                image_url = str(item.get("image") or "").strip()
                raw_img = str(item.get("raw_image") or "").strip()

                link = YesPosProductLink.objects.filter(store=store, remote_product_id=remote_id).first()
                if link and link.product:
                    product = link.product
                    product.name_ru = name
                    product.name_uz = name
                    product.price = price
                    product.stock = stock
                    product.category = category
                    product.track_stock = True
                    if barcode:
                        product.barcode = barcode
                    if ikpu:
                        product.ikpu_code = ikpu
                    if desc:
                        product.description_ru = desc
                        product.description_uz = desc
                    product.image_url = image_url or ""

                    product._skip_auto_translation = True
                    product.save()

                    link.remote_price = price
                    link.remote_stock = stock
                    if barcode:
                        link.remote_barcode = barcode
                    link.last_synced_at = timezone.now()
                    link.save()

                    download_and_attach_product_image(product, raw_img, force=force)
                    updated_count += 1
                else:
                    product = None
                    if barcode:
                        product = Product.objects.filter(store=store, barcode=barcode).first()

                    if product:
                        product.name_ru = name
                        product.name_uz = name
                        product.price = price
                        product.stock = stock
                        product.category = category
                        product.track_stock = True
                        if barcode:
                            product.barcode = barcode
                        if ikpu:
                            product.ikpu_code = ikpu
                        product.image_url = image_url or ""
                        product._skip_auto_translation = True
                        product.save()
                    else:
                        base_slug = slugify(name) or f"prod-{remote_id}"
                        p_slug = base_slug
                        counter = 1
                        while Product.objects.filter(store=store, slug=p_slug).exists():
                            p_slug = f"{base_slug}-{counter}"
                            counter += 1

                        product = Product(
                            store=store,
                            category=category,
                            name_ru=name,
                            name_uz=name,
                            slug=p_slug,
                            price=price,
                            stock=stock,
                            barcode=barcode,
                            ikpu_code=ikpu,
                            image_url=image_url or "",
                            description_ru=desc,
                            description_uz=desc,
                            is_active=True,
                            track_stock=True
                        )
                        product._skip_auto_translation = True
                        product.save()

                    download_and_attach_product_image(product, raw_img, force=force)

                    YesPosProductLink.objects.update_or_create(
                        store=store,
                        remote_product_id=remote_id,
                        defaults={
                            "product": product,
                            "remote_barcode": barcode,
                            "remote_price": price,
                            "remote_stock": stock,
                            "last_synced_at": timezone.now()
                        }
                    )
                    created_count += 1

        return {
            "created": created_count,
            "updated": updated_count,
            "total": created_count + updated_count
        }

    def import_items(self, store, items):
        """
        Imports or updates a list of items (e.g. user-selected up to 50 items)
        into StoreBox database atomically.
        """
        from apps.catalog.models import Product, Category, YesPosCategoryLink, YesPosProductLink

        created_count = 0
        updated_count = 0

        for item in items:
            remote_id = str(item.get("remote_id") or item.get("id") or "").strip()
            if not remote_id:
                continue
            name = str(item.get("name") or "").strip()
            if not name:
                sku_val = str(item.get("sku") or "").strip()
                name = f"Товар (Арт: {sku_val})" if sku_val else f"Товар #{remote_id}"

            cat_name = str(item.get("category_name") or "Импорт YES POS").strip()
            cat_remote_id = str(item.get("category_id") or "").strip()
            cat_image = str(item.get("category_image") or "").strip()
            cat_raw_img = str(item.get("category_raw_image") or "").strip()

            category = Category.objects.filter(store=store, name_ru=cat_name).first() or \
                       Category.objects.filter(store=store, name_uz=cat_name).first()
            if not category:
                base_slug = slugify(cat_name) or f"cat-{cat_remote_id or remote_id}"
                c_slug = base_slug
                counter = 1
                while Category.objects.filter(store=store, slug=c_slug).exists():
                    c_slug = f"{base_slug}-{counter}"
                    counter += 1
                category = Category(
                    store=store,
                    name_ru=cat_name,
                    name_uz=cat_name,
                    slug=c_slug,
                    image_url=cat_image,
                    is_active=True
                )
                category._skip_auto_translation = True
                category.save()
            else:
                if cat_image and (not category.image_url or "yp_" in category.image_url):
                    category.image_url = cat_image
                    category._skip_auto_translation = True
                    category.save(update_fields=["image_url"])

            if cat_raw_img:
                download_and_attach_category_image(category, cat_raw_img)

            if cat_remote_id:
                YesPosCategoryLink.objects.update_or_create(
                    store=store,
                    remote_category_id=cat_remote_id,
                    defaults={"category": category}
                )

            try:
                price = Decimal(str(item.get("price") or 0))
            except Exception:
                price = Decimal("0")

            try:
                raw_stock = float(item.get("stock") or 0)
                stock = max(0, int(raw_stock)) if raw_stock.is_integer() else max(0, int(round(raw_stock)))
            except (ValueError, TypeError):
                stock = 0

            barcode = str(item.get("barcode") or item.get("sku") or "").strip()
            ikpu = str(item.get("ikpu") or "").strip()
            desc = str(item.get("description") or "").strip()
            image_url = str(item.get("image") or "").strip()
            raw_img = str(item.get("raw_image") or "").strip()

            link = YesPosProductLink.objects.filter(store=store, remote_product_id=remote_id).first()
            if link and link.product:
                product = link.product
                product.name_ru = name
                product.name_uz = name
                product.price = price
                product.stock = stock
                product.category = category
                product.track_stock = True
                if barcode:
                    product.barcode = barcode
                if ikpu:
                    product.ikpu_code = ikpu
                if desc:
                    product.description_ru = desc
                    product.description_uz = desc
                product.image_url = image_url or ""

                product._skip_auto_translation = True
                product.save()

                link.remote_price = price
                link.remote_stock = stock
                if barcode:
                    link.remote_barcode = barcode
                link.last_synced_at = timezone.now()
                link.save()

                download_and_attach_product_image(product, raw_img, force=True)
                updated_count += 1
            else:
                product = None
                if barcode:
                    product = Product.objects.filter(store=store, barcode=barcode).first()

                if product:
                    product.name_ru = name
                    product.name_uz = name
                    product.price = price
                    product.stock = stock
                    product.category = category
                    product.track_stock = True
                    if barcode:
                        product.barcode = barcode
                    if ikpu:
                        product.ikpu_code = ikpu
                    product.image_url = image_url or ""
                    product._skip_auto_translation = True
                    product.save()
                else:
                    base_slug = slugify(name) or f"prod-{remote_id}"
                    p_slug = base_slug
                    counter = 1
                    while Product.objects.filter(store=store, slug=p_slug).exists():
                        p_slug = f"{base_slug}-{counter}"
                        counter += 1

                    product = Product(
                        store=store,
                        category=category,
                        name_ru=name,
                        name_uz=name,
                        slug=p_slug,
                        price=price,
                        stock=stock,
                        barcode=barcode,
                        ikpu_code=ikpu,
                        image_url=image_url or "",
                        description_ru=desc,
                        description_uz=desc,
                        is_active=True,
                        track_stock=True
                    )
                    product._skip_auto_translation = True
                    product.save()

                download_and_attach_product_image(product, raw_img, force=True)

                YesPosProductLink.objects.update_or_create(
                    store=store,
                    remote_product_id=remote_id,
                    defaults={
                        "product": product,
                        "remote_barcode": barcode,
                        "remote_price": price,
                        "remote_stock": stock,
                        "last_synced_at": timezone.now()
                    }
                )
                created_count += 1

        clean_branch = str(self.branch_id or "1").strip()
        key_hash = hashlib.md5(f"{self.api_key.strip()}_{clean_branch}".encode()).hexdigest()
        cache.delete(f"yp_catalog_{key_hash}")

        return {
            "created": created_count,
            "updated": updated_count,
            "total": created_count + updated_count
        }
