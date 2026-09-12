from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from apps.orders.models import MarketingBanner
from apps.stores.ai_designer import NICHE_PRESETS, generate_ai_theme, apply_niche_catalog_to_store, get_random_banner_image
from .views_auth import get_merchant_store

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def design_theme_get_view(request):
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Dokon topilmadi"}, status=404)

    if request.method == "POST":
        return _handle_theme_save(store, request.data, request)

    banners_qs = MarketingBanner.objects.filter(store=store).order_by('sort_order', 'id')
    banners_list = [
        {
            "id": b.id,
            "title": b.title,
            "subtitle": b.subtitle,
            "image_url": b.display_image_url,
            "link": b.link or "/",
            "is_active": b.is_active,
            "sort_order": b.sort_order,
        }
        for b in banners_qs
    ]

    primary_banner = banners_qs.first()
    banner_data = {
        "title": primary_banner.title if primary_banner else f"«{store.name}»",
        "subtitle": primary_banner.subtitle if primary_banner else "",
        "image_url": primary_banner.display_image_url if primary_banner else ""
    }

    niches = [
        {
            "id": n_id,
            "name": n_info.get("name_uz", n_id),
            "name_ru": n_info.get("name_ru", n_id),
            "emoji": n_info.get("emoji", "✨"),
            "primary_color": n_info.get("primary_color", "#7C3AED"),
            "bg_color": n_info.get("bg_color", "#F8FAFC"),
            "card_style": n_info.get("card_style", "modern"),
            "banner_images": n_info.get("banner_images", []),
            "titles": n_info.get("titles", {}),
            "subtitles": n_info.get("subtitles", {})
        }
        for n_id, n_info in NICHE_PRESETS.items()
    ]

    templates = [
        {
            "id": "restaurant",
            "name": "Restoran & Yetkazib berish",
            "name_ru": "Ресторан и Доставка",
            "name_en": "Restaurant & Delivery",
            "description": "Taomlar, yetkazib berish va kafe uchun maxsus menyu formati",
            "description_ru": "Специальный формат меню для еды, кафе и быстрой доставки",
            "badge": "Food & Delivery",
            "icon": "utensils"
        },
        {
            "id": "universal",
            "name": "Universal do'kon",
            "name_ru": "Универсальный магазин",
            "name_en": "Universal Store",
            "description": "Klassik e-commerce vitrina, bannerlar, chegirmalar va qidiruv",
            "description_ru": "Классическая витрина с промо-слайдером, категориями и фильтрами",
            "badge": "E-Commerce",
            "icon": "shopping-bag"
        },
        {
            "id": "boutique",
            "name": "Vizual Butik & Moda",
            "name_ru": "Визуальный бутик и мода",
            "name_en": "Visual Boutique & Fashion",
            "description": "Kiyim-kechak, kosmetika va aksessuarlar uchun estetik lookbook",
            "description_ru": "Эстетичный лукбук с портретными карточками 3:4 для моды и красоты",
            "badge": "Fashion & Visual",
            "icon": "sparkles"
        }
    ]

    return Response({
        "success": True,
        "primary_color": store.primary_color or "#7C3AED",
        "theme_bg_color": store.theme_bg_color or "#F8FAFC",
        "theme_card_style": store.theme_card_style or "modern",
        "theme_card_radius": store.theme_card_radius or "3xl",
        "theme_image_aspect": store.theme_image_aspect or "portrait",
        "theme_button_style": store.theme_button_style or "solid",
        "theme_template": store.theme_template or "universal",
        "theme_business_niche": store.theme_business_niche or "flowers",
        "logo_url": store.logo.url if store.logo else "",
        "banner": banner_data,
        "banners": banners_list,
        "templates": templates,
        "store_name": store.name,
        "subdomain": store.subdomain,
        "storefront_url": store.get_storefront_url(),
        "niches": niches
    })

def _handle_theme_save(store, data, request):
    if "primary_color" in data:
        store.primary_color = data["primary_color"]
    if "theme_bg_color" in data:
        store.theme_bg_color = data["theme_bg_color"]
    if "theme_card_style" in data:
        store.theme_card_style = data["theme_card_style"]
    if "theme_card_radius" in data:
        store.theme_card_radius = data["theme_card_radius"]
    if "theme_image_aspect" in data:
        store.theme_image_aspect = data["theme_image_aspect"]
    if "theme_button_style" in data:
        store.theme_button_style = data["theme_button_style"]
    if "theme_template" in data and data["theme_template"]:
        store.theme_template = data["theme_template"]
    if "theme_business_niche" in data:
        store.theme_business_niche = data["theme_business_niche"]
    store.save()

    # Legacy banner single update if provided
    banner_img = data.get("banner_image_url")
    banner_title = data.get("banner_title")
    banner_subtitle = data.get("banner_subtitle")

    if banner_img or banner_title or banner_subtitle:
        banner = MarketingBanner.objects.filter(store=store).first()
        if not banner:
            banner = MarketingBanner(store=store)
        if banner_title is not None:
            banner.title = banner_title
        if banner_subtitle is not None:
            banner.subtitle = banner_subtitle
        if banner_img is not None:
            banner.image_url = banner_img
            if banner.image:
                banner.image = None
        banner.is_active = True
        banner.save()

    # Optional: apply niche catalog if requested
    if data.get("generate_catalog"):
        lang = getattr(request, "language", "uz")
        apply_niche_catalog_to_store(store, store.theme_business_niche or "restaurant", lang=lang)

    # Store Name update
    if "store_name" in data and str(data["store_name"]).strip():
        store.name = str(data["store_name"]).strip()
        store.save(update_fields=["name"])

    return Response({
        "success": True,
        "theme_template": store.theme_template,
        "message": "Dizayn va mavzu sozlamalari muvaffaqiyatli saqlandi!"
    })

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def design_theme_save_view(request):
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Dokon topilmadi"}, status=404)
    return _handle_theme_save(store, request.data, request)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def design_logo_upload_view(request):
    """Uploads store logo image directly from merchant device."""
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Dokon topilmadi"}, status=404)

    logo_file = request.FILES.get("logo") or request.FILES.get("image") or request.FILES.get("file")
    if not logo_file:
        return Response({"error": "Logotip fayli tanlanmadi"}, status=400)

    store.logo = logo_file
    store.save(update_fields=["logo"])
    return Response({
        "success": True,
        "logo_url": store.logo.url,
        "message": "Logotip muvaffaqiyatli yuklandi!"
    })

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def design_logo_delete_view(request):
    """Removes the store logo."""
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Dokon topilmadi"}, status=404)

    if store.logo:
        store.logo.delete(save=False)
        store.logo = None
        store.save(update_fields=["logo"])
    return Response({
        "success": True,
        "message": "Logotip olib tashlandi."
    })

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def design_banners_list_create_view(request):
    """List or create promotional banners for storefront slider."""
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Dokon topilmadi"}, status=404)

    if request.method == "GET":
        banners = MarketingBanner.objects.filter(store=store).order_by('sort_order', 'id')
        data = [
            {
                "id": b.id,
                "title": b.title,
                "subtitle": b.subtitle,
                "image_url": b.display_image_url,
                "link": b.link or "/",
                "is_active": b.is_active,
                "sort_order": b.sort_order,
            }
            for b in banners
        ]
        return Response({"success": True, "banners": data})

    title = request.data.get("title", "").strip() or f"«{store.name}»"
    subtitle = request.data.get("subtitle", "").strip()
    image_url = request.data.get("image_url", "").strip()
    link = request.data.get("link", "/").strip() or "/"
    is_active = request.data.get("is_active", True)
    if isinstance(is_active, str):
        is_active = is_active.lower() not in ("false", "0", "no")

    banner_file = request.FILES.get("image") or request.FILES.get("banner_file") or request.FILES.get("file")
    max_order = MarketingBanner.objects.filter(store=store).count()

    banner = MarketingBanner(
        store=store,
        title=title,
        subtitle=subtitle,
        link=link,
        is_active=is_active,
        sort_order=max_order
    )
    if banner_file:
        banner.image = banner_file
    elif image_url:
        banner.image_url = image_url
    else:
        banner.image_url = get_random_banner_image(store.theme_business_niche or "restaurant")

    banner.save()
    return Response({
        "success": True,
        "banner": {
            "id": banner.id,
            "title": banner.title,
            "subtitle": banner.subtitle,
            "image_url": banner.display_image_url,
            "link": banner.link,
            "is_active": banner.is_active,
            "sort_order": banner.sort_order
        },
        "message": "Banner muvaffaqiyatli qo'shildi!"
    }, status=201)

@api_view(["GET", "POST", "PUT", "PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def design_banner_detail_view(request, banner_id):
    """Retrieve, update or delete a single promotional banner."""
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Dokon topilmadi"}, status=404)

    banner = MarketingBanner.objects.filter(store=store, id=banner_id).first()
    if not banner:
        return Response({"error": "Banner topilmadi"}, status=404)

    if request.method == "GET":
        return Response({
            "id": banner.id,
            "title": banner.title,
            "subtitle": banner.subtitle,
            "image_url": banner.display_image_url,
            "link": banner.link or "/",
            "is_active": banner.is_active,
            "sort_order": banner.sort_order
        })

    if request.method == "DELETE":
        banner.delete()
        return Response({"success": True, "message": "Banner o'chirildi."})

    data = request.data
    if "title" in data:
        banner.title = str(data["title"]).strip()
    if "subtitle" in data:
        banner.subtitle = str(data["subtitle"]).strip()
    if "link" in data:
        banner.link = str(data["link"]).strip() or "/"
    if "is_active" in data:
        val = data["is_active"]
        banner.is_active = val if isinstance(val, bool) else (str(val).lower() not in ("false", "0", "no"))
    if "sort_order" in data:
        try:
            banner.sort_order = int(data["sort_order"])
        except (ValueError, TypeError):
            pass

    banner_file = request.FILES.get("image") or request.FILES.get("banner_file") or request.FILES.get("file")
    if banner_file:
        banner.image = banner_file
        banner.image_url = ""
    elif "image_url" in data and data["image_url"]:
        banner.image_url = data["image_url"]
        if banner.image:
            banner.image = None

    banner.save()
    return Response({
        "success": True,
        "banner": {
            "id": banner.id,
            "title": banner.title,
            "subtitle": banner.subtitle,
            "image_url": banner.display_image_url,
            "link": banner.link,
            "is_active": banner.is_active,
            "sort_order": banner.sort_order
        },
        "message": "Banner ma'lumotlari yangilandi!"
    })

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def design_banners_reorder_view(request):
    """Reorders banners according to an ordered array of banner IDs."""
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Dokon topilmadi"}, status=404)

    banner_ids = request.data.get("banner_ids", [])
    if not isinstance(banner_ids, list):
        return Response({"error": "banner_ids ro'yxat bo'lishi kerak"}, status=400)

    for idx, b_id in enumerate(banner_ids):
        MarketingBanner.objects.filter(store=store, id=b_id).update(sort_order=idx)

    return Response({"success": True, "message": "Bannerlar tartibi saqlandi!"})

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def design_banner_upload_view(request):
    """Uploads custom banner image directly from merchant device."""
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Dokon topilmadi"}, status=404)

    banner_file = request.FILES.get("banner_file") or request.FILES.get("image") or request.FILES.get("file")
    if not banner_file:
        return Response({"error": "Banner fayli tanlanmadi"}, status=400)

    banner_id = request.data.get("banner_id")
    target_banner = None
    if banner_id:
        target_banner = MarketingBanner.objects.filter(store=store, id=banner_id).first()

    if not target_banner:
        # Check if creating new or updating first
        create_new = request.data.get("create_new") in ("1", "true", True)
        if create_new:
            max_order = MarketingBanner.objects.filter(store=store).count()
            target_banner = MarketingBanner(store=store, title=f"«{store.name}»", sort_order=max_order)
        else:
            target_banner = MarketingBanner.objects.filter(store=store).first()
            if not target_banner:
                target_banner = MarketingBanner(store=store, title=f"«{store.name}»")

    target_banner.image = banner_file
    target_banner.image_url = ""
    target_banner.is_active = True
    target_banner.save()

    return Response({
        "success": True,
        "image_url": target_banner.image.url,
        "banner_id": target_banner.id,
        "message": "Banner rasmi muvaffaqiyatli yuklandi!"
    })

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def design_ai_suggest_view(request):
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Dokon topilmadi"}, status=404)

    niche = request.data.get("niche", "flowers")
    custom_prompt = request.data.get("custom_prompt", "")
    theme = generate_ai_theme(store.name, niche_key=niche, custom_prompt=custom_prompt)
    return Response(theme)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def design_apply_niche_view(request):
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Dokon topilmadi"}, status=404)

    niche = request.data.get("niche", "restaurant")
    custom_prompt = request.data.get("custom_prompt", "")
    lang = getattr(request, "language", "uz")
    result = apply_niche_catalog_to_store(store, niche, custom_prompt=custom_prompt, lang=lang)
    return Response(result)

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def qr_catalog_settings_view(request):
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Dokon topilmadi"}, status=404)

    if request.method == "POST":
        data = request.data
        if "qr_paper_size" in data:
            store.qr_paper_size = data["qr_paper_size"]
        if "qr_bg_color" in data:
            store.qr_bg_color = data["qr_bg_color"]
        if "qr_code_color" in data:
            store.qr_code_color = data["qr_code_color"]
        if "qr_main_text" in data:
            store.qr_main_text = data["qr_main_text"]
        if "qr_main_text_size" in data:
            try:
                store.qr_main_text_size = int(data["qr_main_text_size"])
            except (ValueError, TypeError):
                pass
        if "qr_main_text_color" in data:
            store.qr_main_text_color = data["qr_main_text_color"]
        if "qr_sub_text" in data:
            store.qr_sub_text = data["qr_sub_text"]
        if "qr_sub_text_size" in data:
            try:
                store.qr_sub_text_size = int(data["qr_sub_text_size"])
            except (ValueError, TypeError):
                pass
        if "qr_sub_text_color" in data:
            store.qr_sub_text_color = data["qr_sub_text_color"]

        # Support direct logo upload from QR page
        logo_file = request.FILES.get("logo") or request.FILES.get("file")
        if logo_file:
            store.logo = logo_file

        store.save()
        return Response({
            "success": True,
            "logo_url": store.logo.url if store.logo else "",
            "message": "QR katalog sozlamalari muvaffaqiyatli saqlandi!"
        })

    # GET
    store_url = store.get_storefront_url()
    logo_url = store.logo.url if store.logo else ""

    return Response({
        "store_name": store.name,
        "subdomain": store.subdomain,
        "store_url": store_url,
        "logo_url": logo_url,
        "qr_paper_size": store.qr_paper_size or "A5",
        "qr_bg_color": store.qr_bg_color or "#FFFFFF",
        "qr_code_color": store.qr_code_color or "#0F172A",
        "qr_main_text": store.qr_main_text or "Online buyurtma",
        "qr_main_text_size": store.qr_main_text_size or 24,
        "qr_main_text_color": store.qr_main_text_color or "#0F172A",
        "qr_sub_text": store.qr_sub_text or "Menyuni ko'rish uchun QR kodni skanerlang",
        "qr_sub_text_size": store.qr_sub_text_size or 13,
        "qr_sub_text_color": store.qr_sub_text_color or "#64748B"
    })
