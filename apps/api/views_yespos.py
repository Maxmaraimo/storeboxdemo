import hashlib
import logging
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from django.core.cache import cache

from apps.catalog.models import Store, YesPosConnection, YesPosProductLink
from apps.orders.models import StoreStaff
from services.yespos_sync import YesPosService
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
def yespos_status_view(request):
    store = resolve_channel_store(request)
    if not store:
        return Response({"error": "Do'kon topilmadi"}, status=404)

    conn = YesPosConnection.objects.filter(store=store).first()
    from apps.catalog.models import Product
    total_store_products = Product.objects.filter(store=store).count()
    linked_count = YesPosProductLink.objects.filter(store=store).count() if (conn and conn.is_active) else 0

    active_conn = YesPosConnection.objects.filter(is_active=True).first()
    effective_key = (conn.api_key if conn else "") or (active_conn.api_key if active_conn else "51831431-a0c91e12ebd08bd18fb7c679f1944beea5b69054331eec6b")
    effective_branch = (conn.branch_id if conn else "") or "1"

    branches = []
    try:
        service = YesPosService(api_key=effective_key, branch_id=effective_branch)
        branches = service.get_branches()
    except Exception as e:
        logger.warning(f"Error getting branches for status view: {e}")

    if not conn or not conn.is_active:
        return Response({
            "is_connected": False,
            "linked_products_count": 0,
            "total_store_products_count": total_store_products,
            "suggested_api_key": effective_key,
            "api_key": effective_key,
            "branch_id": effective_branch,
            "branches": branches
        })

    return Response({
        "is_connected": conn.is_active,
        "branch_id": conn.branch_id,
        "branch_name": conn.branch_name,
        "last_sync_at": conn.last_sync_at.isoformat() if conn.last_sync_at else None,
        "api_key": conn.api_key,
        "api_key_masked": (conn.api_key[:4] + "****" + conn.api_key[-4:]) if len(conn.api_key) > 8 else "****",
        "linked_products_count": linked_count,
        "total_store_products_count": total_store_products,
        "branches": branches
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def yespos_test_view(request):
    api_key = request.data.get("api_key", "").strip()
    if not api_key:
        store = resolve_channel_store(request)
        if store:
            conn = YesPosConnection.objects.filter(store=store).first()
            if conn and conn.api_key:
                api_key = conn.api_key
        if not api_key:
            active_conn = YesPosConnection.objects.filter(is_active=True).first()
            if active_conn and active_conn.api_key:
                api_key = active_conn.api_key

    if not api_key:
        return Response({"success": False, "error": "API kalit kiritilmagan"}, status=400)

    try:
        service = YesPosService(api_key=api_key)
        branches = service.get_branches()
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
    store = resolve_channel_store(request)
    if not store:
        return Response({"success": False, "error": "Do'kon topilmadi"}, status=404)

    api_key = request.data.get("api_key", "").strip()
    branch_id = str(request.data.get("branch_id", "")).strip()
    branch_name = request.data.get("branch_name", "").strip()

    if not api_key:
        conn = YesPosConnection.objects.filter(store=store).first()
        if conn and conn.api_key:
            api_key = conn.api_key
        else:
            active_conn = YesPosConnection.objects.filter(is_active=True).first()
            if active_conn and active_conn.api_key:
                api_key = active_conn.api_key

    if not api_key or not branch_id:
        return Response({"success": False, "error": "API kalit va filial tanlanishi shart"}, status=400)

    # Resolve branch name if not passed from frontend
    if not branch_name:
        try:
            service = YesPosService(api_key=api_key, branch_id=branch_id)
            for b in service.get_branches():
                if str(b.get("id")) == branch_id:
                    branch_name = b.get("name", "")
                    break
        except Exception:
            branch_name = f"Филиал {branch_id}"

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

    # Invalidate old catalog cache for this store so the fresh branch prices/stock take effect immediately
    clean_branch = str(branch_id or "").strip()
    key_hash = hashlib.md5(f"{api_key.strip()}_{clean_branch}".encode()).hexdigest()
    cache.delete(f"yp_catalog_{key_hash}")

    return Response({
        "success": True,
        "message": f"YES POS muvaffaqiyatli ulandi: {branch_name or branch_id}",
        "branch_name": connection.branch_name,
        "branch_id": connection.branch_id
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def yespos_disconnect_view(request):
    store = resolve_channel_store(request)
    if not store:
        return Response({"success": False, "error": "Do'kon topilmadi"}, status=404)

    connection = YesPosConnection.objects.filter(store=store).first()
    if connection:
        connection.delete()

    YesPosProductLink.objects.filter(store=store).delete()

    return Response({
        "success": True,
        "message": "YES POS ulanishi uzildi"
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def yespos_catalog_view(request):
    store = resolve_channel_store(request)
    if not store:
        return Response({"success": False, "error": "Do'kon topilmadi"}, status=404)

    connection = YesPosConnection.objects.filter(store=store).first()
    master_conn = YesPosConnection.objects.filter(is_active=True).first()
    api_key = request.GET.get("api_key", "").strip() or (connection.api_key if connection else "") or (master_conn.api_key if master_conn else "51831431-a0c91e12ebd08bd18fb7c679f1944beea5b69054331eec6b")
    branch_id = request.GET.get("branch_id", "").strip() or (connection.branch_id if connection else "") or (master_conn.branch_id if master_conn else "1")

    if not api_key:
        return Response({"success": False, "error": "YES POS API kaliti topilmadi"}, status=400)

    clean_branch = str(branch_id or "1").strip()
    force_refresh = request.GET.get("force") in ("1", "true", "True")
    key_hash = hashlib.md5(f"{api_key.strip()}_{clean_branch}".encode()).hexdigest()
    cache_key = f"yp_catalog_{key_hash}"

    if force_refresh:
        cache.delete(cache_key)

    catalog = None if force_refresh else cache.get(cache_key)
    if catalog is None:
        try:
            service = YesPosService(api_key=api_key, branch_id=clean_branch)
            catalog = service.fetch_full_catalog()
            if catalog:
                cache.set(cache_key, catalog, 600)  # 10 minutes cache
        except Exception as e:
            logger.warning(f"YES POS catalog error for store {store.id}: {e}")
            return Response({"success": False, "error": f"YES POS xatosi: {str(e)}"}, status=400)

    linked_ids = set(
        YesPosProductLink.objects.filter(store=store).values_list("remote_product_id", flat=True)
    )

    for cat in (catalog or []):
        for p in cat.get("products", []):
            p["is_linked"] = str(p.get("id")) in linked_ids

    return Response({
        "success": True,
        "categories": catalog or []
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def yespos_import_view(request):
    store = resolve_channel_store(request)
    if not store:
        return Response({"success": False, "error": "Do'kon topilmadi"}, status=404)

    items = request.data.get("items", [])
    if not items:
        return Response({"success": False, "error": "Import qilish uchun tovarlar tanlanmadi"}, status=400)

    if len(items) > 50:
        return Response({
            "success": False,
            "error": "Bitta so'rovda ko'pi bilan 50 ta tovar import qilish mumkin. So'rovlarni bo'lib yuboring."
        }, status=400)

    import_lock_key = f"yp_import_inflight_{store.id}"
    if not cache.add(import_lock_key, True, timeout=60):
        return Response({
            "success": False,
            "error": "Import jarayoni allaqachon bajarilmoqda. Iltimos, kuting."
        }, status=429)

    try:
        connection = YesPosConnection.objects.filter(store=store).first()
        service = YesPosService(
            api_key=connection.api_key if connection else "",
            branch_id=connection.branch_id if connection else "1"
        )
        result = service.import_items(store, items)
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
    store = resolve_channel_store(request)
    if not store:
        return Response({"success": False, "error": "Do'kon topilmadi"}, status=404)

    connection = YesPosConnection.objects.filter(store=store).first()
    if not connection or not connection.is_active:
        return Response({"success": False, "error": "YES POS ulanmagan"}, status=400)

    active_links_count = YesPosProductLink.objects.filter(store=store).count()
    if active_links_count > 500:
        return Response({
            "success": False,
            "error": f"Sinxronlash uchun ko'pi bilan 500 ta bog'langan tovar qabul qilinadi. Mavjud: {active_links_count} ta."
        }, status=400)

    sync_lock_key = f"yp_sync_inflight_{store.id}"
    if not cache.add(sync_lock_key, True, timeout=30):
        return Response({
            "success": False,
            "error": "Sinxronizatsiya allaqachon bajarilmoqda. Iltimos, kuting."
        }, status=429)

    try:
        service = YesPosService(api_key=connection.api_key, branch_id=connection.branch_id)
        result = service.sync_to_store(store, force=True)
        connection.last_sync_at = timezone.now()
        connection.save(update_fields=["last_sync_at"])

        # Invalidate catalog cache so next catalog view always gets fresh data
        clean_branch = str(connection.branch_id or "1").strip()
        key_hash = hashlib.md5(f"{connection.api_key.strip()}_{clean_branch}".encode()).hexdigest()
        cache.delete(f"yp_catalog_{key_hash}")

        return Response({
            "success": True,
            "updated": result["updated"],
            "created": result.get("created", 0),
            "total": result.get("total", result["updated"]),
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
