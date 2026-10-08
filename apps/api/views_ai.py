import os
import uuid
import logging
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from django.conf import settings
from django.core.files.storage import default_storage

from apps.api.views_auth import get_merchant_store
from apps.catalog.models import Product, ProductImage
from .services_ai import SidekickAgent, check_ollama_available, remove_image_background

logger = logging.getLogger(__name__)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def ai_chat_view(request):
    """
    Main Sidekick AI Chat endpoint.
    Accepts: { message: str, lang?: str }
    Returns: { text: str, action_type: str, action_data: dict, suggestions: list }
    """
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Магазин не найден"}, status=404)

    data = request.data or {}
    message = (data.get("message") or "").strip()
    lang = data.get("lang") or request.GET.get("lang") or "ru"

    agent = SidekickAgent(store=store, lang=lang)
    result = agent.process_message(message)

    return Response({
        "success": True,
        "store": {
            "id": store.id,
            "name": store.name,
            "subdomain": store.subdomain,
        },
        **result
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def ai_status_view(request):
    """
    Returns AI Engine health status, local Ollama models, and rembg availability.
    """
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Магазин не найден"}, status=404)

    ollama_ok, models = check_ollama_available()

    rembg_ready = False
    try:
        import rembg
        rembg_ready = True
    except ImportError:
        pass

    agent = SidekickAgent(store=store)
    ctx = agent.get_store_context()

    return Response({
        "status": "online",
        "provider": "Ollama (Local LLM)" if ollama_ok else "StoreBox Deterministic AI Engine (Zero Cost)",
        "ollama": {
            "available": ollama_ok,
            "models": models,
            "active_model": models[0] if models else None,
        },
        "rembg_ready": rembg_ready,
        "store_context": ctx,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def ai_remove_background_view(request):
    """
    Removes background from an uploaded file or an existing product image via rembg.
    """
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Магазин не найден"}, status=404)

    product_id = request.data.get("product_id")
    image_file = request.FILES.get("image")

    target_product = None
    if product_id:
        target_product = Product.objects.filter(store=store, id=product_id).first()

    try:
        if image_file:
            input_bytes = image_file.read()
        elif target_product and target_product.primary_image:
            with open(target_product.primary_image.path, "rb") as f:
                input_bytes = f.read()
        else:
            return Response({"error": "Изображение или товар не предоставлены"}, status=400)

        output_bytes = remove_image_background(input_bytes)

        rel_path = f"products/ai_rembg_{uuid.uuid4().hex[:8]}.png"
        full_path = os.path.join(settings.MEDIA_ROOT, rel_path)
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, "wb") as f:
            f.write(output_bytes)

        new_url = f"{settings.MEDIA_URL}{rel_path}"

        if target_product:
            pi = ProductImage.objects.create(
                product=target_product,
                image=rel_path,
                is_primary=True,
                sort_order=0
            )
            target_product.images.exclude(id=pi.id).update(is_primary=False)
            target_product.image_url = new_url
            target_product.save(update_fields=["image_url"])

        return Response({
            "success": True,
            "image_url": new_url,
            "product_id": target_product.id if target_product else None,
            "message": "Фон успешно удален"
        })
    except Exception as e:
        logger.error(f"Background removal failed: {e}")
        return Response({"error": f"Ошибка обработки: {str(e)}"}, status=500)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def ai_generate_description_view(request):
    """
    Generates marketing description and SEO tags for a product.
    """
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Магазин не найден"}, status=404)

    product_id = request.data.get("product_id")
    product_name = request.data.get("name")
    lang = request.data.get("lang", "ru")

    target_product = None
    if product_id:
        target_product = Product.objects.filter(store=store, id=product_id).first()

    agent = SidekickAgent(store=store, lang=lang)
    query = f"Сгенерируй описание для {target_product.name_ru if target_product else product_name}"
    res = agent.handle_generate_description(query)

    return Response({
        "success": True,
        **res
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def ai_generate_image_view(request):
    """
    Dedicated endpoint to generate a studio product image.
    Accepts: { name?: str, theme?: str, lang?: str }
    """
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Магазин не найден"}, status=404)

    prompt = request.data.get("name") or request.data.get("prompt") or "Премиальный товар"
    theme = request.data.get("theme", "dark_luxury")
    lang = request.data.get("lang", "ru")

    agent = SidekickAgent(store=store, lang=lang)
    style_keyword = "в светлом стиле" if theme == "clean_white" else "в темном стиле"
    res = agent.handle_image_generation(f"Сгенерируй изображение для {prompt} {style_keyword}")

    return Response({
        "success": True,
        **res
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def ai_quick_actions_view(request):
    """
    Returns quick action suggestions based on current store context.
    """
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Магазин не найден"}, status=404)

    agent = SidekickAgent(store=store)
    ctx = agent.get_store_context()

    actions = [
        {
            "id": "sales_report",
            "title": "Отчет по продажам за неделю",
            "prompt": "Покажи отчет по продажам за неделю",
            "icon": "BarChart3",
            "badge": f"{int(ctx['today_revenue']):,} UZS сегодня"
        },
        {
            "id": "check_stock",
            "title": "Проверить остатки на складе",
            "prompt": "Какие товары заканчиваются на складе?",
            "icon": "AlertTriangle" if ctx["low_stock_count"] > 0 else "Package",
            "badge": f"{ctx['low_stock_count']} с низким остатком" if ctx["low_stock_count"] > 0 else "Норма"
        },
        {
            "id": "create_promocode",
            "title": "Создать промокод на скидку",
            "prompt": "Создай промокод на скидку 15%",
            "icon": "BadgePercent",
            "badge": "Маркетинг"
        },
        {
            "id": "recent_orders",
            "title": "Найти последние заказы",
            "prompt": "Покажи последние заказы",
            "icon": "ShoppingCart",
            "badge": f"{ctx['total_orders']} всего"
        },
        {
            "id": "clean_bg",
            "title": "Удалить фон с фото товара",
            "prompt": "Удали фон с фото товара",
            "icon": "Sparkles",
            "badge": "rembg AI"
        },
        {
            "id": "bulk_discount",
            "title": "Скидка 10% на все товары",
            "prompt": "Сделай скидку 10% на все товары",
            "icon": "Zap",
            "badge": "Каталог"
        }
    ]

    return Response({
        "actions": actions,
        "store": ctx
    })
