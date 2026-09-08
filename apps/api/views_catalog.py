from django.db.models import Q
from django.utils.text import slugify
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from apps.catalog.models import Product, Category
from .views_auth import get_merchant_store
from .serializers import ProductSerializer, CategorySerializer

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def products_list_view(request):
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Dokon topilmadi"}, status=404)

    category_id = request.GET.get("category")
    query = request.GET.get("q", "").strip()

    qs = Product.objects.filter(store=store).select_related("category").order_by("-id")

    if category_id:
        qs = qs.filter(category_id=category_id)

    if query:
        qs = qs.filter(
            Q(name_uz__icontains=query) |
            Q(name_ru__icontains=query) |
            Q(name_en__icontains=query)
        )

    return Response({
        "products": ProductSerializer(qs[:100], many=True).data,
        "total": qs.count()
    })

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def product_create_view(request):
    store = get_merchant_store(request)
    data = request.data.copy()
    data["store"] = store.id
    serializer = ProductSerializer(data=data)
    if serializer.is_valid():
        product = serializer.save(store=store)
        return Response(ProductSerializer(product).data, status=201)
    return Response(serializer.errors, status=400)

@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def product_delete_view(request, product_id):
    store = get_merchant_store(request)
    product = Product.objects.filter(id=product_id, store=store).first()
    if not product:
        return Response({"error": "Mahsulot topilmadi"}, status=404)
    product.delete()
    return Response({"message": "Mahsulot ochirildi"})

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def categories_list_view(request):
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Dokon topilmadi"}, status=404)

    categories = Category.objects.filter(store=store).prefetch_related("products").order_by("sort_order", "id")
    return Response({
        "categories": CategorySerializer(categories, many=True).data,
        "total": categories.count()
    })

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
