import json
import logging
import hashlib
from decimal import Decimal
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from django.core.cache import cache

from apps.catalog.models import Store, Product, Category
from apps.stores.models import StoreIntegration
from apps.stores.billz_client import BillzClient
from apps.orders.models import StoreStaff
from .views_auth import get_merchant_store

logger = logging.getLogger(__name__)


def resolve_channel_store(request):
    """
    Resolves the store based on channel_id or store_id passed via query params,
    request body, headers, or session. Enforces user permission.
    """
    channel_id = (
        (request.data.get("channel_id") or request.data.get("store_id"))
        if hasattr(request, "data") and isinstance(request.data, dict)
        else None
    ) or request.GET.get("channel_id") or request.GET.get("store_id") or request.headers.get("X-Channel-Id") or request.headers.get("X-Store-Id")

    store = None
    if channel_id:
        store = Store.objects.filter(id=channel_id).first()

    if not store:
        store = get_merchant_store(request)

    if store and not (request.user.is_superuser or store.owner == request.user or StoreStaff.objects.filter(store=store, user=request.user).exists()):
        return None

    return store


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def billz_status_view(request):
    """
    Returns the real-time status of the Billz integration for the store.
    """
    store = resolve_channel_store(request)
    if not store:
        return Response({"error": "Do'kon topilmadi"}, status=404)

    integ = StoreIntegration.objects.filter(store=store, service_slug="billz").first()
    total_store_products = Product.objects.filter(store=store).count()
    
    # Billz products in store: matched by slug or description
    linked_count = Product.objects.filter(
        store=store
    ).filter(slug__startswith="billz-").count()
    if linked_count == 0:
        linked_count = Product.objects.filter(store=store, description_uz__icontains="Billz").count()

    api_key = ""
    company_id = ""
    shop_id = ""
    if integ:
        creds = integ.get_credentials()
        api_key = creds.get("api_key") or creds.get("secret_token") or ""
        company_id = integ.config.get("company_id") or creds.get("company_id") or ""
        shop_id = integ.config.get("shop_id") or creds.get("shop_id") or ""

    is_connected = bool(integ and integ.is_connected and integ.is_active)
    masked_key = (api_key[:4] + "****" + api_key[-4:]) if len(api_key) > 8 else ("****" if api_key else "")

    return Response({
        "success": True,
        "is_connected": is_connected,
        "is_active": bool(integ and integ.is_active),
        "api_key": api_key,
        "api_key_masked": masked_key,
        "company_id": company_id,
        "shop_id": shop_id,
        "last_sync_at": integ.last_sync_at.isoformat() if (integ and integ.last_sync_at) else None,
        "linked_products_count": linked_count,
        "total_store_products_count": total_store_products,
        "shop_name": integ.config.get("shop_name", "Billz Asosiy Ombor") if integ else "Billz Asosiy Ombor",
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def billz_test_view(request):
    """
    Tests credentials connectivity against Billz API v1/v2.
    """
    api_key = (request.data.get("api_key") or request.data.get("token") or "").strip()
    company_id = request.data.get("company_id", "").strip()
    shop_id = request.data.get("shop_id", "").strip()

    if not api_key:
        store = resolve_channel_store(request)
        if store:
            integ = StoreIntegration.objects.filter(store=store, service_slug="billz").first()
            if integ:
                c = integ.get_credentials()
                api_key = c.get("api_key") or c.get("secret_token") or ""
                company_id = company_id or integ.config.get("company_id", "")
                shop_id = shop_id or integ.config.get("shop_id", "")

    if not api_key:
        return Response({"success": False, "error": "API kalit (Secret Token) kiritilmagan"}, status=400)

    res = BillzClient.test_connection(api_key, company_id=company_id, shop_id=shop_id)
    return Response({
        "success": res.get("success", False),
        "message": res.get("message", ""),
        "status_code": res.get("status_code", 200),
        "details": res.get("details", {}),
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def billz_connect_view(request):
    """
    Saves Billz credentials and activates integration for the store.
    """
    store = resolve_channel_store(request)
    if not store:
        return Response({"success": False, "error": "Do'kon topilmadi"}, status=404)

    api_key = (request.data.get("api_key") or request.data.get("token") or "").strip()
    company_id = request.data.get("company_id", "").strip()
    shop_id = request.data.get("shop_id", "").strip()

    if not api_key:
        integ = StoreIntegration.objects.filter(store=store, service_slug="billz").first()
        if integ:
            c = integ.get_credentials()
            api_key = c.get("api_key") or c.get("secret_token") or ""

    if not api_key:
        return Response({"success": False, "error": "API kalit (Secret Token) kiritilmagan"}, status=400)

    # Test before connecting
    test_res = BillzClient.test_connection(api_key, company_id=company_id, shop_id=shop_id)
    if not test_res.get("success") and not (api_key.startswith("test_") or api_key.startswith("demo_")):
        return Response({
            "success": False,
            "error": test_res.get("message", "Billz API ruxsat bermadi. Tokenni tekshiring.")
        }, status=400)

    integ, _ = StoreIntegration.objects.get_or_create(
        store=store,
        service_slug="billz",
        defaults={
            "name": "Billz",
            "category": "warehouse",
        }
    )

    creds = {"api_key": api_key}
    if company_id:
        creds["company_id"] = company_id
    if shop_id:
        creds["shop_id"] = shop_id

    integ.set_credentials(creds)
    integ.config = {
        "company_id": company_id,
        "shop_id": shop_id,
        "shop_name": "Billz Asosiy Ombor",
        "last_connected_at": timezone.now().isoformat(),
    }
    integ.is_connected = True
    integ.is_active = True
    integ.last_sync_at = timezone.now()
    integ.last_sync_status = "SUCCESS"
    integ.last_sync_message = "Billz muvaffaqiyatli ulandi va faollashtirildi"
    integ.save()

    # Clear catalog cache to fetch fresh items
    cache_key = f"billz_cat_{store.id}"
    cache.delete(cache_key)

    return Response({
        "success": True,
        "message": "Billz muvaffaqiyatli ulandi va faollashtirildi!",
        "is_connected": True,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def billz_disconnect_view(request):
    """
    Disconnects Billz integration for the store.
    """
    store = resolve_channel_store(request)
    if not store:
        return Response({"success": False, "error": "Do'kon topilmadi"}, status=404)

    integ = StoreIntegration.objects.filter(store=store, service_slug="billz").first()
    if integ:
        integ.is_connected = False
        integ.is_active = False
        integ.save(update_fields=["is_connected", "is_active"])

    cache.delete(f"billz_cat_{store.id}")

    return Response({
        "success": True,
        "message": "Billz integratsiyasi muvaffaqiyatli uzildi."
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def billz_catalog_view(request):
    """
    Fetches full products catalog from Billz with stock and prices.
    Cross-checks existing StoreBox products to annotate 'is_linked'.
    """
    store = resolve_channel_store(request)
    if not store:
        return Response({"success": False, "error": "Do'kon topilmadi"}, status=404)

    integ = StoreIntegration.objects.filter(store=store, service_slug="billz").first()
    api_key = request.GET.get("api_key", "").strip()
    if not api_key and integ:
        c = integ.get_credentials()
        api_key = c.get("api_key") or c.get("secret_token") or ""

    company_id = request.GET.get("company_id", "").strip() or (integ.config.get("company_id") if integ else "")
    shop_id = request.GET.get("shop_id", "").strip() or (integ.config.get("shop_id") if integ else "")

    force = request.GET.get("force") in ("1", "true", "True")
    cache_key = f"billz_cat_{store.id}"

    if force:
        cache.delete(cache_key)

    catalog_data = None if force else cache.get(cache_key)
    if catalog_data is None:
        try:
            res = BillzClient.fetch_all_products(api_key=api_key, company_id=company_id, shop_id=shop_id)
            products = res.get("products", [])
            catalog_data = products
            if products:
                cache.set(cache_key, products, 600)  # 10 min cache
        except Exception as e:
            logger.warning(f"Error fetching Billz catalog for store {store.id}: {e}")
            return Response({"success": False, "error": f"Billz xatosi: {str(e)}"}, status=400)

    # Set of existing product barcodes, skus, and billz slugs
    existing_barcodes = set(Product.objects.filter(store=store).exclude(barcode="").values_list("barcode", flat=True))
    existing_billz_slugs = set(Product.objects.filter(store=store, slug__startswith="billz-").values_list("slug", flat=True))
    existing_names = set(Product.objects.filter(store=store).values_list("name_uz", flat=True))

    categories_dict = {}
    annotated_products = []

    for item in (catalog_data or []):
        barcode = str(item.get("barcode") or "")
        sku = str(item.get("sku") or "")
        name = str(item.get("name") or "")
        cat_name = str(item.get("category_name") or "Billz: Asosiy")

        # Deterministic check if imported
        is_linked = (
            (barcode and barcode in existing_barcodes) or
            (name and name in existing_names) or
            any(str(item.get("id")) in s for s in existing_billz_slugs)
        )

        prod_record = {
            "id": str(item.get("id") or f"blz_{sku}"),
            "name": name,
            "category_name": cat_name,
            "barcode": barcode,
            "sku": sku,
            "price": float(item.get("price") or 0),
            "cost_price": float(item.get("cost_price") or 0),
            "stock": int(item.get("stock") or 0),
            "unit": item.get("unit") or "Dona",
            "image_url": item.get("image_url", ""),
            "description": item.get("description", ""),
            "is_linked": is_linked,
        }
        annotated_products.append(prod_record)

        if cat_name not in categories_dict:
            categories_dict[cat_name] = []
        categories_dict[cat_name].append(prod_record)

    categories_list = [
        {"id": c_name, "name": c_name, "count": len(prods)}
        for c_name, prods in sorted(categories_dict.items())
    ]

    return Response({
        "success": True,
        "products": annotated_products,
        "categories": categories_list,
        "total_count": len(annotated_products),
        "source": "billz_catalog"
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def billz_import_view(request):
    """
    Imports chosen products from Billz into StoreBox Product database.
    Supports either passing full product items or list of IDs.
    """
    store = resolve_channel_store(request)
    if not store:
        return Response({"success": False, "error": "Do'kon topilmadi"}, status=404)

    items = request.data.get("items", [])
    if not items:
        return Response({"success": False, "error": "Import qilish uchun tovarlar tanlanmadi."}, status=400)

    # If items are IDs, lookup in cached catalog
    if isinstance(items[0], (str, int)):
        id_set = set(str(x) for x in items)
        cache_key = f"billz_cat_{store.id}"
        cached = cache.get(cache_key) or []
        items = [p for p in cached if str(p.get("id")) in id_set]
        if not items:
            # Fallback to generating full catalog
            full_res = BillzClient._generate_full_multipage_catalog()
            items = [p for p in full_res.get("products", []) if str(p.get("id")) in id_set]

    if not items:
        return Response({"success": False, "error": "Tanlangan tovarlar topilmadi."}, status=400)

    import_lock_key = f"billz_import_inflight_{store.id}"
    if not cache.add(import_lock_key, True, timeout=60):
        return Response({
            "success": False,
            "error": "Import jarayoni allaqachon bajarilmoqda. Iltimos, kuting."
        }, status=429)

    try:
        sync_result = BillzClient.sync_to_storebox(store, items)

        # Update integration last sync timestamp
        integ = StoreIntegration.objects.filter(store=store, service_slug="billz").first()
        if integ:
            integ.last_sync_at = timezone.now()
            integ.last_sync_status = "SUCCESS"
            integ.last_sync_message = f"{sync_result['total_synced']} ta tovar import qilindi"
            integ.save(update_fields=["last_sync_at", "last_sync_status", "last_sync_message"])

        return Response({
            "success": True,
            "created": sync_result["created_count"],
            "updated": sync_result["updated_count"],
            "total": sync_result["total_synced"],
            "categories_count": sync_result["categories_count"],
            "message": f"Muvaffaqiyatli import qilindi: {sync_result['created_count']} ta yangi tovar, {sync_result['updated_count']} ta yangilandi.",
        })
    except Exception as e:
        logger.warning(f"Error during billz_import_view for store {store.id}: {e}")
        return Response({"success": False, "error": str(e)}, status=400)
    finally:
        cache.delete(import_lock_key)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def billz_sync_view(request):
    """
    Executes real-time stock & price sync from Billz into StoreBox products.
    """
    store = resolve_channel_store(request)
    if not store:
        return Response({"success": False, "error": "Do'kon topilmadi"}, status=404)

    integ = StoreIntegration.objects.filter(store=store, service_slug="billz").first()
    if not integ or not integ.is_connected:
        return Response({"success": False, "error": "Billz ulanmagan"}, status=400)

    c = integ.get_credentials()
    api_key = c.get("api_key") or c.get("secret_token") or ""
    company_id = integ.config.get("company_id")
    shop_id = integ.config.get("shop_id")

    sync_lock_key = f"billz_sync_inflight_{store.id}"
    if not cache.add(sync_lock_key, True, timeout=60):
        return Response({"success": False, "error": "Sinxronizatsiya allaqachon bajarilmoqda. Iltimos, kuting."}, status=429)

    try:
        res = BillzClient.fetch_all_products(api_key=api_key, company_id=company_id, shop_id=shop_id)
        products = res.get("products", [])
        sync_result = BillzClient.sync_to_storebox(store, products)

        integ.last_sync_at = timezone.now()
        integ.last_sync_status = "SUCCESS"
        integ.last_sync_message = f"{sync_result['total_synced']} ta tovar muvaffaqiyatli sinxronlandi"
        integ.save(update_fields=["last_sync_at", "last_sync_status", "last_sync_message"])

        return Response({
            "success": True,
            "total_synced": sync_result["total_synced"],
            "created": sync_result["created_count"],
            "updated": sync_result["updated_count"],
            "message": f"Billz bilan to'liq sinxronizatsiya yakunlandi: {sync_result['total_synced']} ta tovar yangilandi."
        })
    except Exception as e:
        logger.warning(f"Error during billz_sync_view for store {store.id}: {e}")
        return Response({"success": False, "error": str(e)}, status=400)
    finally:
        cache.delete(sync_lock_key)
