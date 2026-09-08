from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from apps.orders.models import MarketingBanner
from apps.stores.ai_designer import NICHE_PRESETS, generate_ai_theme, apply_niche_catalog_to_store, get_random_banner_image
from .views_auth import get_merchant_store

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def design_theme_get_view(request):
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Dokon topilmadi"}, status=404)

    banner = MarketingBanner.objects.filter(store=store).first()
    banner_data = {
        "title": banner.title if banner else f"«{store.name}»",
        "subtitle": banner.subtitle if banner else "",
        "image_url": banner.image_url if banner else (banner.image.url if banner and banner.image else "")
    }

    niches = [
        {"id": n_id, "name": n_info.get("name_uz", n_id), "emoji": n_info.get("emoji", "✨")}
        for n_id, n_info in NICHE_PRESETS.items()
    ]

    return Response({
        "primary_color": store.primary_color or "#10B981",
        "theme_bg_color": store.theme_bg_color or "#F8FAFC",
        "theme_card_style": store.theme_card_style or "modern",
        "theme_card_radius": store.theme_card_radius or "3xl",
        "theme_image_aspect": store.theme_image_aspect or "portrait",
        "theme_button_style": store.theme_button_style or "solid",
        "theme_business_niche": store.theme_business_niche or "flowers",
        "banner": banner_data,
        "store_name": store.name,
        "subdomain": store.subdomain,
        "storefront_url": f"/store/{store.subdomain}/",
        "niches": niches
    })

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def design_theme_save_view(request):
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Dokon topilmadi"}, status=404)

    data = request.data
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
    if "theme_business_niche" in data:
        store.theme_business_niche = data["theme_business_niche"]
    store.save()

    # Banner updates
    banner_img = data.get("banner_image_url")
    banner_title = data.get("banner_title")
    banner_subtitle = data.get("banner_subtitle")

    banner = MarketingBanner.objects.filter(store=store).first()
    if not banner and (banner_img or banner_title or banner_subtitle):
        banner = MarketingBanner(store=store)

    if banner:
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

    return Response({
        "success": True,
        "message": "Dizayn va mavzu sozlamalari muvaffaqiyatli saqlandi!"
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
        store.save()
        return Response({"success": True, "message": "QR katalog sozlamalari muvaffaqiyatli saqlandi!"})

    # GET
    store_url = f"https://{store.subdomain}.storebox.uz"
    logo_url = store.logo.url if store.logo else ""

    return Response({
        "store_name": store.name,
        "subdomain": store.subdomain,
        "store_url": store_url,
        "logo_url": logo_url,
        "qr_paper_size": store.qr_paper_size or "A5",
        "qr_bg_color": store.qr_bg_color or "#FFFFFF",
        "qr_code_color": store.qr_code_color or "#0F172A",
        "qr_main_text": store.qr_main_text or store.name,
        "qr_main_text_size": store.qr_main_text_size or 24,
        "qr_main_text_color": store.qr_main_text_color or "#0F172A",
        "qr_sub_text": store.qr_sub_text or "Online buyurtma va menyu",
        "qr_sub_text_size": store.qr_sub_text_size or 12,
        "qr_sub_text_color": store.qr_sub_text_color or "#64748B"
    })
