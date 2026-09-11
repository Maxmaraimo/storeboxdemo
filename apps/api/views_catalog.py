import random
from decimal import Decimal
from django.db.models import Q
from django.utils.text import slugify
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.catalog.models import Product, Category
from .views_auth import get_merchant_store
from .serializers import ProductSerializer, CategorySerializer, normalize_unit


def _get_unique_slug(model_cls, store, name, exclude_id=None):
    base_slug = slugify(name) or f"item-{random.randint(100, 999)}"
    candidate = base_slug
    idx = 1
    qs = model_cls.objects.filter(store=store)
    if exclude_id:
        qs = qs.exclude(id=exclude_id)
    while qs.filter(slug=candidate).exists():
        candidate = f"{base_slug}-{idx}"
        idx += 1
    return candidate


# -----------------------------------------------------------------
# PRODUCTS CRUD
# -----------------------------------------------------------------

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def products_list_create_view(request):
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Do'kon topilmadi"}, status=404)

    if request.method == "POST":
        data = request.data.copy()
        data["store"] = store.id
        name = data.get("name_uz") or data.get("name_ru") or "Yangi mahsulot"
        if not data.get("slug"):
            data["slug"] = _get_unique_slug(Product, store, name)
        if data.get("category") in ["", "null", "undefined", None]:
            data["category"] = None
        if data.get("cost_price") in ["", "null", "undefined", None]:
            data["cost_price"] = 0
        if data.get("stock") in ["", "null", "undefined", None]:
            data["stock"] = 0
        if "unit" in data:
            data["unit"] = normalize_unit(data.get("unit"))

        serializer = ProductSerializer(data=data)
        if serializer.is_valid():
            product = serializer.save(store=store)
            return Response(ProductSerializer(product).data, status=201)
        return Response(serializer.errors, status=400)

    category_id = request.GET.get("category")
    query = request.GET.get("q", "").strip()

    qs = Product.objects.filter(store=store).select_related("category").order_by("-created_at", "-id")

    if category_id:
        qs = qs.filter(category_id=category_id)

    if query:
        qs = qs.filter(
            Q(name_uz__icontains=query) |
            Q(name_ru__icontains=query) |
            Q(name_en__icontains=query) |
            Q(barcode__icontains=query) |
            Q(ikpu_code__icontains=query)
        )

    return Response({
        "products": ProductSerializer(qs[:150], many=True).data,
        "total": qs.count()
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def product_create_view(request):
    return products_list_create_view(request)


@api_view(["GET", "PUT", "PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def product_detail_update_delete_view(request, product_id):
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Do'kon topilmadi"}, status=404)

    product = Product.objects.filter(id=product_id, store=store).first()
    if not product:
        return Response({"error": "Mahsulot topilmadi"}, status=404)

    if request.method == "GET":
        return Response(ProductSerializer(product).data)

    if request.method in ["PUT", "PATCH"]:
        data = request.data.copy()
        if "category" in data and data.get("category") in ["", "null", "undefined", None]:
            data["category"] = None
        if "cost_price" in data and data.get("cost_price") in ["", "null", "undefined", None]:
            data["cost_price"] = 0
        if "stock" in data and data.get("stock") in ["", "null", "undefined", None]:
            data["stock"] = 0
        if "unit" in data:
            data["unit"] = normalize_unit(data.get("unit"))
        if "name_uz" in data and not data.get("slug"):
            data["slug"] = _get_unique_slug(Product, store, data.get("name_uz"), exclude_id=product.id)

        serializer = ProductSerializer(product, data=data, partial=True)
        if serializer.is_valid():
            updated = serializer.save()
            return Response(ProductSerializer(updated).data)
        return Response(serializer.errors, status=400)

    if request.method == "DELETE":
        product.delete()
        return Response({"message": "Mahsulot muvaffaqiyatli o'chirildi"})


# -----------------------------------------------------------------
# CATEGORIES CRUD
# -----------------------------------------------------------------

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def categories_list_create_view(request):
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Do'kon topilmadi"}, status=404)

    if request.method == "POST":
        data = request.data.copy()
        data["store"] = store.id
        name = data.get("name_uz") or data.get("name_ru") or "Kategoriya"
        if not data.get("slug"):
            data["slug"] = _get_unique_slug(Category, store, name)

        serializer = CategorySerializer(data=data)
        if serializer.is_valid():
            cat = serializer.save(store=store)
            return Response(CategorySerializer(cat).data, status=201)
        return Response(serializer.errors, status=400)

    categories = Category.objects.filter(store=store).prefetch_related("products").order_by("sort_order", "id")
    return Response({
        "categories": CategorySerializer(categories, many=True).data,
        "total": categories.count()
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def category_create_view(request):
    return categories_list_create_view(request)


@api_view(["GET", "PUT", "PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def category_detail_update_delete_view(request, category_id):
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Do'kon topilmadi"}, status=404)

    category = Category.objects.filter(id=category_id, store=store).first()
    if not category:
        return Response({"error": "Kategoriya topilmadi"}, status=404)

    if request.method == "GET":
        return Response(CategorySerializer(category).data)

    if request.method in ["PUT", "PATCH"]:
        data = request.data.copy()
        if "name_uz" in data and not data.get("slug"):
            data["slug"] = _get_unique_slug(Category, store, data.get("name_uz"), exclude_id=category.id)
        serializer = CategorySerializer(category, data=data, partial=True)
        if serializer.is_valid():
            updated = serializer.save()
            return Response(CategorySerializer(updated).data)
        return Response(serializer.errors, status=400)

    if request.method == "DELETE":
        category.delete()
        return Response({"message": "Kategoriya o'chirildi"})


@api_view(["PATCH", "POST"])
@permission_classes([IsAuthenticated])
def category_toggle_active_view(request, category_id):
    store = get_merchant_store(request)
    category = Category.objects.filter(id=category_id, store=store).first()
    if not category:
        return Response({"error": "Kategoriya topilmadi"}, status=404)

    category.is_active = not category.is_active
    category.save(update_fields=["is_active"])

    return Response({
        "message": "Kategoriya holati yangilandi",
        "is_active": category.is_active,
        "category": CategorySerializer(category).data
    })


# -----------------------------------------------------------------
# WAREHOUSE STOCK ADJUSTMENT
# -----------------------------------------------------------------

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def warehouse_stock_adjust_view(request):
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Do'kon topilmadi"}, status=404)

    product_id = request.data.get("product_id")
    stock_delta = request.data.get("delta")
    new_stock = request.data.get("stock")
    cost_price = request.data.get("cost_price")

    product = Product.objects.filter(id=product_id, store=store).first()
    if not product:
        return Response({"error": "Mahsulot topilmadi"}, status=404)

    if new_stock is not None:
        try:
            product.stock = max(0, int(new_stock))
        except (ValueError, TypeError):
            return Response({"error": "Noto'g'ri qoldiq miqdori"}, status=400)
    elif stock_delta is not None:
        try:
            product.stock = max(0, product.stock + int(stock_delta))
        except (ValueError, TypeError):
            return Response({"error": "Noto'g'ri o'zgarish miqdori"}, status=400)

    if cost_price is not None:
        try:
            product.cost_price = Decimal(str(cost_price))
        except Exception:
            pass

    product.save(update_fields=["stock", "cost_price", "updated_at"])

    return Response({
        "success": True,
        "message": f"'{product.name_uz}' qoldig'i {product.stock} ga yangilandi",
        "product": ProductSerializer(product).data
    })


# -----------------------------------------------------------------
# YES POS STATUS
# -----------------------------------------------------------------

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def yespos_status_view(request):
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Dokon topilmadi"}, status=404)
    from apps.catalog.models import YesPosConnection, YesPosProductLink
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
