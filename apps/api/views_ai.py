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
@parser_classes([MultiPartParser, FormParser, JSONParser])
def ai_chat_view(request):
    """
    Main Sidekick AI Chat endpoint.
    Accepts:
      - text: { message: str, lang?: str }
      - slash command: e.g. "/photo белая футболка на деревянном столе"
      - image attachment: multipart "image" file or "image_url"
    Returns: { text: str, action_type: str, action_data: dict, suggestions: list }
    """
    import re
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Магазин не найден"}, status=404)

    data = request.data or {}
    message = (data.get("message") or "").strip()
    lang = data.get("lang") or request.GET.get("lang") or "ru"
    image_file = request.FILES.get("image")
    image_url_param = data.get("image_url")

    # 1. Direct Image Attachment in Chat (Image-to-Image / Inpaint from chat input)
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
            clean_prompt = re.sub(r'^\/(?:photo|image|foto|img|rasm)\s*', '', message, flags=re.IGNORECASE).strip()
            if re.search(r'(?:удали\w*\s+фон|прозрачн\w*|tozala|remove\s+bg|remove\s+background)', clean_prompt, re.IGNORECASE):
                from .services_ai import remove_image_background
                cutout_bytes = remove_image_background(input_bytes)
                rel_path = f"products/ai_rembg_{uuid.uuid4().hex[:8]}.png"
                full_path = os.path.join(settings.MEDIA_ROOT, rel_path)
                os.makedirs(os.path.dirname(full_path), exist_ok=True)
                with open(full_path, "wb") as f:
                    f.write(cutout_bytes)
                new_url = f"{settings.MEDIA_URL}{rel_path}"
                clean_name = data.get("product_name") or "Товар"
                return Response({
                    "success": True,
                    "store": {"id": store.id, "name": store.name, "subdomain": store.subdomain},
                    "text": (
                        "✨ **Фон у фото успешно удален (rembg AI)!**\n\n"
                        "• Объект аккуратно изолирован с сохранением четких краев.\n"
                        "• Прозрачный студийный PNG готов для каталога."
                    ),
                    "action_type": "image_processed",
                    "action_data": {
                        "new_image_url": new_url,
                        "product_name": clean_name
                    },
                    "suggestions": [
                        "🪵 Помести на деревянный стол",
                        "🏛️ Помести на белый мрамор",
                        "📸 Сделай студийный свет и фон"
                    ]
                })

            from .services_fooocus import process_image_to_image
            prompt = clean_prompt or "Помести товар на деревянный стол и добавь студийный свет"
            res = process_image_to_image(
                image_bytes=input_bytes,
                prompt=prompt,
                product_name=data.get("product_name") or "Товар",
                store=store
            )

            theme_title = res.get("theme_title", "Студийный снимок")
            engine = res.get("engine", "Neural Inpaint Studio M2")
            exec_time = res.get("execution_time", "0.6s")

            if lang == "uz":
                reply_text = (
                    f"📸 **«{prompt}» bo'yicha studiya fotosi tayyorlandi!**\n\n"
                    f"• **Rejim:** Image-to-Image / Inpaint ({theme_title})\n"
                    f"• **AI Dvigatel:** {engine} ({exec_time})\n"
                    f"• **Effektlar:** Fon tozalash (rembg), kontakt soyalar (AO) va studiya nuri."
                )
            elif lang == "en":
                reply_text = (
                    f"📸 **Studio visual generated for «{prompt}»!**\n\n"
                    f"• **Mode:** Image-to-Image / Inpaint ({theme_title})\n"
                    f"• **AI Engine:** {engine} ({exec_time})\n"
                    f"• **Effects:** Background removal (rembg), contact shadows (AO), and studio lighting."
                )
            else:
                reply_text = (
                    f"📸 **Студийное фото по запросу «{prompt}» готово!**\n\n"
                    f"• **Режим:** Image-to-Image / Inpaint ({theme_title})\n"
                    f"• **Движок:** {engine} ({exec_time})\n"
                    f"• **Эффекты:** Удаление исходного фона (rembg), прорисовка контактных теней (AO) и направленный свет."
                )

            return Response({
                "success": True,
                "store": {
                    "id": store.id,
                    "name": store.name,
                    "subdomain": store.subdomain,
                },
                "text": reply_text,
                "action_type": "image_to_image",
                "action_data": res,
                "suggestions": res.get("suggestions", [
                    "🪵 Помести на деревянный стол",
                    "🏛️ Белый мрамор",
                    "📸 Студийный свет циклорама",
                    "Сохранить в каталог"
                ])
            })

    # 2. Slash Command /photo, /image, /img, /foto, /rasm in Chat
    if re.match(r'^\/(?:photo|image|foto|img|rasm)\b', message, flags=re.IGNORECASE):
        clean_prompt = re.sub(r'^\/(?:photo|image|foto|img|rasm)\s*', '', message, flags=re.IGNORECASE).strip()
        agent = SidekickAgent(store=store, lang=lang)

        if clean_prompt:
            result = agent.handle_image_generation(clean_prompt)
        else:
            result = {
                "thought": "Справка по команде /photo",
                "text": (
                    "📸 **Команда генерации фото StoreBox (/photo)**\n\n"
                    "Вы можете мгновенно создать фото товара прямо в чате:\n"
                    "• Напишите: `/photo Белая футболка на деревянном столе`\n"
                    "• Напишите: `/photo Сочный бургер BBQ со студийным светом`\n"
                    "• Или прикрепите фото через скрепку 📎 и напишите пожелание (например: *«Помести на деревянный стол»*)!"
                ),
                "action_type": "clarify_image",
                "suggestions": [
                    "/photo Белая рубашка на деревянном столе",
                    "/photo Черное оверсайз худи",
                    "/photo Сочный бургер BBQ",
                    "/photo Студийные кроссовки на мраморе"
                ]
            }

        return Response({
            "success": True,
            "store": {
                "id": store.id,
                "name": store.name,
                "subdomain": store.subdomain,
            },
            **result
        })

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
@parser_classes([MultiPartParser, FormParser, JSONParser])
def ai_image_to_image_view(request):
    """
    Image-to-Image & Inpaint Studio endpoint (Fooocus SDXL / Neural Inpaint Studio M2).
    """
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Магазин не найден"}, status=404)

    prompt = request.data.get("prompt") or request.data.get("message") or "Сделай красивый студийный свет и фон"
    product_name = request.data.get("product_name") or "Товар"
    product_id = request.data.get("product_id")
    image_file = request.FILES.get("image")
    image_url_param = request.data.get("image_url")

    target_product = None
    if product_id:
        target_product = Product.objects.filter(store=store, id=product_id).first()
        if target_product and not request.data.get("product_name"):
            product_name = target_product.name_ru or target_product.name_uz

    input_bytes = None
    if image_file:
        input_bytes = image_file.read()
    elif image_url_param:
        rel = image_url_param.replace(settings.MEDIA_URL, "").lstrip("/")
        full_p = os.path.join(settings.MEDIA_ROOT, rel)
        if os.path.exists(full_p):
            with open(full_p, "rb") as f:
                input_bytes = f.read()
    elif target_product and target_product.primary_image:
        if os.path.exists(target_product.primary_image.path):
            with open(target_product.primary_image.path, "rb") as f:
                input_bytes = f.read()

    if not input_bytes:
        return Response({"error": "Изображение товара не предоставлено. Пожалуйста, прикрепите фото."}, status=400)

    try:
        from .services_fooocus import process_image_to_image
        res = process_image_to_image(
            image_bytes=input_bytes,
            prompt=prompt,
            product_name=product_name,
            store=store
        )

        if target_product and res.get("image_url"):
            rel_path = res["image_url"].replace(settings.MEDIA_URL, "").lstrip("/")
            pi = ProductImage.objects.create(
                product=target_product,
                image=rel_path,
                is_primary=True,
                sort_order=0
            )
            target_product.images.exclude(id=pi.id).update(is_primary=False)
            target_product.image_url = res["image_url"]
            target_product.save(update_fields=["image_url"])
            res["attached_to_product_id"] = target_product.id

        return Response(res)
    except Exception as e:
        logger.error(f"Image-to-Image inpaint failed: {e}", exc_info=True)
        return Response({"error": f"Ошибка обработки Image-to-Image: {str(e)}"}, status=500)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def ai_save_to_catalog_view(request):
    """
    Saves generated studio artwork directly into the merchant catalog as a ready product.
    """
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Магазин не найден"}, status=404)

    image_url = request.data.get("image_url")
    name = request.data.get("name") or "Премиальный товар (AI Studio)"
    price = request.data.get("price") or 250000
    stock = request.data.get("stock") or 25

    if not image_url:
        return Response({"error": "URL изображения обязателен"}, status=400)

    from decimal import Decimal
    from django.utils.text import slugify
    from apps.catalog.models import Category

    first_cat = Category.objects.filter(store=store, is_active=True).first()
    slug = f"{slugify(name) or 'item'}-{uuid.uuid4().hex[:4]}"

    product = Product.objects.create(
        store=store,
        category=first_cat,
        name_ru=name,
        name_uz=name,
        name_en=name,
        slug=slug,
        price=Decimal(str(price)),
        stock=int(stock),
        track_stock=True,
        is_active=True,
        image_url=image_url,
        unit=Product.Units.DONA
    )

    rel_path = image_url.replace(settings.MEDIA_URL, "").lstrip("/")
    if os.path.exists(os.path.join(settings.MEDIA_ROOT, rel_path)):
        ProductImage.objects.create(
            product=product,
            image=rel_path,
            is_primary=True,
            sort_order=0
        )

    return Response({
        "success": True,
        "product": {
            "id": product.id,
            "name": product.name_ru,
            "price": float(product.price),
            "stock": product.stock,
            "image_url": product.image_url
        },
        "message": f"Товар «{name}» успешно сохранен в каталог магазина!"
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def ai_fooocus_status_view(request):
    """
    Returns live connectivity status of Fooocus & SDXL Inpaint engines.
    """
    from .services_fooocus import check_fooocus_status
    status = check_fooocus_status()
    return Response({
        "success": True,
        **status
    })


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


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def ai_generate_banner_view(request):
    """
    Dedicated endpoint to generate an advertising promo banner.
    Accepts: { headline?: str, product_name?: str, badge?: str, theme?: str, lang?: str }
    """
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Магазин не найден"}, status=404)

    prompt = request.data.get("headline") or request.data.get("product_name") or "Скидка на товары"
    theme = request.data.get("theme", "dark_luxury")
    lang = request.data.get("lang", "ru")

    agent = SidekickAgent(store=store, lang=lang)
    res = agent.handle_banner_generation(f"Создай рекламный баннер {prompt} в теме {theme}")

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
