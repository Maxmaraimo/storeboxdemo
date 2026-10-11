import os
import re
import uuid
import logging
from decimal import Decimal
from django.conf import settings
from django.utils.text import slugify
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response

from apps.api.views_auth import get_merchant_store
from apps.catalog.models import Product, Category, ProductImage
from services.ai_sidekick import SidekickBrain
from services.tts_service import synthesize_voice
from .services_ai import remove_image_background

logger = logging.getLogger(__name__)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def ai_assistant_chat_view(request):
    """
    Official StoreBox Sidekick Endpoint: POST `/api/v1/ai/assistant/chat/` (and `/api/v1/ai/chat/`).
    Accepts:
      {
        "message": "текст запроса",
        "voice_enabled": true | false,
        "history": [...]
      }
    Verifies current user permissions and active tenant (`store = get_merchant_store(request)`).
    Invokes Gemini (`services/ai_sidekick.py`) with Function Calling tools:
      - navigate_to(route)
      - get_metrics(timeframe)
      - search_orders(query)
      - generate_product_data(prompt)
    When `voice_enabled=True`, synthesizes neural speech via Microsoft Azure Speech Services (`services/tts_service.py`)
    and returns `audio_base64`.
    """
    store = get_merchant_store(request)
    if not store:
        return Response(
            {"status": "error", "error": "Активный магазин не найден или нет прав доступа."},
            status=404,
        )

    data = request.data or {}
    message = (data.get("message") or "").strip()
    lang = data.get("lang") or request.GET.get("lang") or "auto"
    raw_voice = data.get("voice_enabled", False)
    if isinstance(raw_voice, str):
        voice_enabled = raw_voice.strip().lower() in ("true", "1", "yes")
    else:
        voice_enabled = bool(raw_voice)

    history = data.get("history")
    if isinstance(history, str):
        import json
        try:
            history = json.loads(history)
        except Exception:
            history = []

    # Optional image attachment handling if seller uploads a product photo
    image_file = request.FILES.get("image")
    image_url_param = data.get("image_url")
    if image_file or image_url_param:
        input_bytes = None
        if image_file:
            input_bytes = image_file.read()
        elif image_url_param:
            rel = image_url_param.replace(settings.MEDIA_URL, "").lstrip("/")
            full_p = os.path.join(settings.MEDIA_ROOT, rel)
            if os.path.exists(full_p):
                with open(full_p, "rb") as f:
                    input_bytes = f.read()

        if input_bytes:
            from .services_krea import run_krea_image_to_image
            prompt = message or "Помести товар на деревянный стол и добавь студийный свет"
            res = run_krea_image_to_image(
                image_bytes=input_bytes,
                prompt=prompt,
                product_name=data.get("product_name") or "Товар",
                store=store,
            )
            reply_text = f"Готово! Фото товара обработано в студийном стиле ({res.get('theme_title', 'Студия')})."
            audio_b64 = synthesize_voice(reply_text, language=lang) if voice_enabled else None
            return Response({
                "status": "success",
                "text": reply_text,
                "action": None,
                "data_card": {
                    "type": "image_studio",
                    "title": res.get("theme_title", "Студийное фото"),
                    "image_url": res.get("image_url"),
                    "product_name": data.get("product_name") or "Товар",
                },
                "audio_base64": audio_b64,
                "use_browser_tts": False,
                "store": {"id": store.id, "name": store.name, "subdomain": store.subdomain},
            })

    # Core Gemini + Function Calling Brain
    brain = SidekickBrain(store=store, lang=lang if lang != "auto" else "ru")
    result = brain.process_chat(message=message, history=history)

    # Microsoft Azure Neural TTS synthesis when voice_enabled=True
    if voice_enabled and result.get("text"):
        audio_base64 = synthesize_voice(result["text"], language=lang)
    else:
        audio_base64 = None

    response_payload = {
        "status": "success",
        "text": result.get("text", ""),
        "action": result.get("action"),
        "data_card": result.get("data_card"),
        "audio_base64": audio_base64,
        "use_browser_tts": False,
        "store": {
            "id": store.id,
            "name": store.name,
            "subdomain": store.subdomain,
        },
    }

    return Response(response_payload)


# Alias for backward compatibility
ai_chat_view = ai_assistant_chat_view


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def ai_status_view(request):
    """
    Returns Gemini + Microsoft Azure Speech Services status for the current store tenant.
    """
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Магазин не найден"}, status=404)

    has_gemini = bool(getattr(settings, "GEMINI_API_KEY", ""))
    has_azure_speech = bool(getattr(settings, "AZURE_SPEECH_KEY", ""))
    brain = SidekickBrain(store=store)
    metrics = brain.get_store_metrics("30d")["data_card"]

    return Response({
        "status": "online",
        "provider": "Google Gemini 2.5 Flash + Microsoft Azure Speech Services",
        "gemini": {
            "available": has_gemini,
            "model": getattr(settings, "GEMINI_MODEL", "gemini-2.5-flash"),
        },
        "azure_speech": {
            "available": has_azure_speech,
            "region": getattr(settings, "AZURE_SPEECH_REGION", "eastus"),
            "voices": {
                "uz": "uz-UZ-MadinaNeural",
                "ru": "ru-RU-DmitryNeural",
                "en": "en-US-BrianMultilingualNeural",
            },
        },
        "store_context": metrics,
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def ai_quick_actions_view(request):
    """
    Returns contextual quick action suggestions for the active tenant.
    """
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Магазин не найден"}, status=404)

    brain = SidekickBrain(store=store)
    metrics = brain.get_store_metrics("30d")["data_card"]

    actions = [
        {
            "id": "metrics_30d",
            "title": "Аналитика за 30 дней",
            "prompt": "Перейди в аналитику и покажи выручку за 30 дней",
            "badge": metrics["revenue"],
        },
        {
            "id": "search_orders",
            "title": "Последние заказы",
            "prompt": "Покажи последние заказы магазина",
            "badge": f"{metrics['orders_count']} заказов",
        },
        {
            "id": "generate_product",
            "title": "Создать карточку товара",
            "prompt": "Сгенерируй карточку товара для нового хита продаж",
            "badge": "AI Контент",
        },
        {
            "id": "nav_customers",
            "title": "Открыть базу клиентов",
            "prompt": "Перейди в раздел клиенты",
            "badge": f"{metrics['customers_count']} клиентов",
        },
    ]
    return Response({"actions": actions, "store": metrics})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def ai_remove_background_view(request):
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Магазин не найден"}, status=404)

    product_id = request.data.get("product_id")
    image_file = request.FILES.get("image")
    target_product = Product.objects.filter(store=store, id=product_id).first() if product_id else None

    try:
        if image_file:
            input_bytes = image_file.read()
        elif target_product and target_product.primary_image:
            with open(target_product.primary_image.path, "rb") as f:
                input_bytes = f.read()
        else:
            return Response({"error": "Изображение не предоставлено"}, status=400)

        output_bytes = remove_image_background(input_bytes)
        rel_path = f"products/ai_rembg_{uuid.uuid4().hex[:8]}.png"
        full_path = os.path.join(settings.MEDIA_ROOT, rel_path)
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, "wb") as f:
            f.write(output_bytes)

        new_url = f"{settings.MEDIA_URL}{rel_path}"
        if target_product:
            pi = ProductImage.objects.create(product=target_product, image=rel_path, is_primary=True, sort_order=0)
            target_product.images.exclude(id=pi.id).update(is_primary=False)
            target_product.image_url = new_url
            target_product.save(update_fields=["image_url"])

        return Response({
            "success": True,
            "image_url": new_url,
            "product_id": target_product.id if target_product else None,
            "message": "Фон успешно удален",
        })
    except Exception as e:
        logger.error("Background removal failed: %s", e)
        return Response({"error": f"Ошибка обработки: {str(e)}"}, status=500)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def ai_image_to_image_view(request):
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Магазин не найден"}, status=404)

    prompt = request.data.get("prompt") or request.data.get("message") or "Сделай красивый студийный свет и фон"
    product_name = request.data.get("product_name") or "Товар"
    image_file = request.FILES.get("image")
    image_url_param = request.data.get("image_url")

    input_bytes = None
    if image_file:
        input_bytes = image_file.read()
    elif image_url_param:
        rel = image_url_param.replace(settings.MEDIA_URL, "").lstrip("/")
        full_p = os.path.join(settings.MEDIA_ROOT, rel)
        if os.path.exists(full_p):
            with open(full_p, "rb") as f:
                input_bytes = f.read()

    if not input_bytes:
        return Response({"error": "Пожалуйста, прикрепите фото товара."}, status=400)

    try:
        from .services_krea import run_krea_image_to_image
        res = run_krea_image_to_image(image_bytes=input_bytes, prompt=prompt, product_name=product_name, store=store)
        return Response(res)
    except Exception as e:
        logger.error("Image-to-Image failed: %s", e)
        return Response({"error": str(e)}, status=500)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def ai_save_to_catalog_view(request):
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Магазин не найден"}, status=404)

    name = (request.data.get("name") or "Новый товар").strip()
    description = (request.data.get("description") or "").strip()
    price = request.data.get("price") or 250000
    stock = request.data.get("stock") or 25
    image_url = request.data.get("image_url") or ""

    first_cat = Category.objects.filter(store=store, is_active=True).first()
    slug = f"{slugify(name) or 'item'}-{uuid.uuid4().hex[:4]}"

    product = Product.objects.create(
        store=store,
        category=first_cat,
        name_ru=name,
        name_uz=name,
        name_en=name,
        description_ru=description,
        description_uz=description,
        slug=slug,
        price=Decimal(str(price)),
        stock=int(stock),
        track_stock=True,
        is_active=True,
        image_url=image_url,
        unit=Product.Units.DONA,
    )

    if image_url:
        rel_path = image_url.replace(settings.MEDIA_URL, "").lstrip("/")
        if os.path.exists(os.path.join(settings.MEDIA_ROOT, rel_path)):
            ProductImage.objects.create(product=product, image=rel_path, is_primary=True, sort_order=0)

    return Response({
        "success": True,
        "product": {
            "id": product.id,
            "name": product.name_ru,
            "price": float(product.price),
            "stock": product.stock,
            "image_url": product.image_url,
        },
        "message": f"Товар «{name}» успешно сохранен в каталог магазина!",
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def ai_generate_description_view(request):
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Магазин не найден"}, status=404)

    product_name = request.data.get("name") or request.data.get("prompt") or "Товар"
    lang = request.data.get("lang", "ru")
    brain = SidekickBrain(store=store, lang=lang)
    res = brain.generate_product_data(product_name)
    dc = res["data_card"]
    return Response({
        "success": True,
        "title": dc["product_name"],
        "description": dc["description"],
        "category": dc["category"],
        "data_card": dc,
    })
