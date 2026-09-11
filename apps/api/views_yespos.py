import hashlib
import logging
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from django.core.cache import cache

from apps.catalog.models import YesPosConnection, YesPosProductLink
from apps.catalog.yespos_client import YesPosClient
from .views_auth import get_merchant_store

logger = logging.getLogger(__name__)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def yespos_status_view(request):
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Do'kon topilmadi"}, status=404)

    conn = YesPosConnection.objects.filter(store=store).first()
    linked_count = YesPosProductLink.objects.filter(store=store).count()
    if not conn:
        return Response({
            "is_connected": False,
            "linked_products_count": linked_count
        })

    return Response({
        "is_connected": conn.is_active,
        "branch_id": conn.branch_id,
        "branch_name": conn.branch_name,
        "last_sync_at": conn.last_sync_at.isoformat() if conn.last_sync_at else None,
        "api_key_masked": (conn.api_key[:4] + "****" + conn.api_key[-4:]) if len(conn.api_key) > 8 else "****",
        "linked_products_count": linked_count
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def yespos_test_view(request):
    api_key = request.data.get("api_key", "").strip()
    if not api_key:
        return Response({"success": False, "error": "API kalit kiritilmagan"}, status=400)

    try:
        client = YesPosClient()
        branches = client.get_branches(api_key)
        return Response({
            "success": True,
            "branches": branches
        })
    except Exception as e:
        logger.warning(f"YES POS test error: {e}")
        return Response({
            "success": False,
            "error": str(e)
        }, status=400)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def yespos_connect_view(request):
    store = get_merchant_store(request)
    if not store:
        return Response({"success": False, "error": "Do'kon topilmadi"}, status=404)

    api_key = request.data.get("api_key", "").strip()
    branch_id = str(request.data.get("branch_id", "")).strip()
    branch_name = request.data.get("branch_name", "").strip()

    if not api_key or not branch_id:
        return Response({"success": False, "error": "API kalit va filial tanlanishi shart"}, status=400)

    connection, _ = YesPosConnection.objects.update_or_create(
        store=store,
        defaults={
            "api_key": api_key,
            "branch_id": branch_id,
            "branch_name": branch_name,
            "is_active": True,
            "last_sync_at": timezone.now()
        }
    )

    return Response({
        "success": True,
        "message": f"YES POS muvaffaqiyatli ulandi: {branch_name or branch_id}",
        "branch_name": connection.branch_name,
        "branch_id": connection.branch_id
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def yespos_disconnect_view(request):
    store = get_merchant_store(request)
    if not store:
        return Response({"success": False, "error": "Do'kon topilmadi"}, status=404)

    connection = YesPosConnection.objects.filter(store=store).first()
    if connection:
        connection.delete()

    return Response({
        "success": True,
        "message": "YES POS ulanishi uzildi"
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def yespos_catalog_view(request):
    store = get_merchant_store(request)
    if not store:
        return Response({"success": False, "error": "Do'kon topilmadi"}, status=404)

    connection = YesPosConnection.objects.filter(store=store).first()
    api_key = connection.api_key if connection else request.GET.get("api_key", "").strip()
    branch_id = connection.branch_id if connection else request.GET.get("branch_id", "").strip()

    if not api_key:
        return Response({"success": False, "error": "YES POS API kaliti topilmadi"}, status=400)

    force_refresh = request.GET.get("force") == "1"
    cat_lock_key = f"yp_catalog_lock_{store.id}"
    if force_refresh:
        if not cache.add(cat_lock_key, True, timeout=15):
            force_refresh = False

    try:
        client = YesPosClient()
        catalog = client.get_catalog(api_key, branch_id, force_refresh=force_refresh, store=store)
    except Exception as e:
        logger.warning(f"YES POS catalog error for store {store.id}: {e}")
        return Response({"success": False, "error": f"YES POS xatosi: {str(e)}"}, status=400)
    finally:
        if force_refresh:
            cache.delete(cat_lock_key)

    linked_ids = set(
        YesPosProductLink.objects.filter(store=store).values_list("remote_product_id", flat=True)
    )

    for cat in catalog:
        for p in cat.get("products", []):
            p["is_linked"] = str(p.get("id")) in linked_ids

    return Response({
        "success": True,
        "categories": catalog
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def yespos_import_view(request):
    store = get_merchant_store(request)
    if not store:
        return Response({"success": False, "error": "Do'kon topilmadi"}, status=404)

    items = request.data.get("items", [])
    if not items:
        return Response({"success": False, "error": "Import qilish uchun tovarlar tanlanmadi"}, status=400)

    import_lock_key = f"yp_import_inflight_{store.id}"
    if not cache.add(import_lock_key, True, timeout=60):
        return Response({
            "success": False,
            "error": "Import jarayoni allaqachon bajarilmoqda. Iltimos, kuting."
        }, status=429)

    try:
        client = YesPosClient()
        result = client.import_products(store, items)
        return Response({
            "success": True,
            "created": result["created"],
            "updated": result["updated"],
            "total": result["total"],
            "message": f"Muvaffaqiyatli import qilindi: {result['created']} yangi tovar, {result['updated']} yangilandi."
        })
    except Exception as e:
        logger.warning(f"Error during yespos_import_view for store {store.id}: {e}")
        return Response({"success": False, "error": str(e)}, status=400)
    finally:
        cache.delete(import_lock_key)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def yespos_sync_view(request):
    store = get_merchant_store(request)
    if not store:
        return Response({"success": False, "error": "Do'kon topilmadi"}, status=404)

    connection = YesPosConnection.objects.filter(store=store).first()
    if not connection or not connection.is_active:
        return Response({"success": False, "error": "YES POS ulanmagan"}, status=400)

    sync_lock_key = f"yp_sync_inflight_{store.id}"
    if not cache.add(sync_lock_key, True, timeout=30):
        return Response({
            "success": False,
            "error": "Sinxronizatsiya allaqachon bajarilmoqda. Iltimos, kuting."
        }, status=429)

    try:
        sync_cooldown_key = f"yp_sync_cooldown_{store.id}"
        if cache.get(sync_cooldown_key):
            return Response({
                "success": True,
                "updated": 0,
                "message": "Ma'lumotlar yaqinda yangilangan. Serverni asrash uchun keyingi yangilash 15 soniyadan so'ng."
            })

        client = YesPosClient()
        result = client.sync_store_products(store)
        cache.set(sync_cooldown_key, True, 15)
        return Response({
            "success": True,
            "updated": result["updated"],
            "message": f"{result['updated']} ta tovar narxlari va qoldiqlari muvaffaqiyatli yangilandi."
        })
    except Exception as e:
        logger.warning(f"Error during yespos_sync_view for store {store.id}: {e}")
        return Response({
            "success": False,
            "error": str(e)
        }, status=400)
    finally:
        cache.delete(sync_lock_key)
