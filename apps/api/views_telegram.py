from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from apps.telegram_bot.services import (
    get_bot_info,
    setup_bot_menu_button,
    test_bot_connection,
    get_store_webapp_url,
)
from apps.telegram_bot.polling import start_polling_thread
from .views_auth import get_merchant_store


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def telegram_status_view(request):
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Do'kon topilmadi"}, status=404)

    web_app_url = get_store_webapp_url(store)
    return Response({
        "is_connected": bool(store.telegram_bot_token and store.telegram_bot_username),
        "bot_username": store.telegram_bot_username or "",
        "bot_token": store.telegram_bot_token or "",
        "button_name": store.telegram_button_name or "Do'kon",
        "welcome_message": store.telegram_welcome_message or "",
        "web_app_url": web_app_url,
        "chat_id": store.telegram_chat_id or "",
        "created_at": store.created_at.isoformat() if store.created_at else None,
        "subdomain": store.subdomain or "",
        "store_name": store.name or "",
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def telegram_save_view(request):
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Do'kon topilmadi"}, status=404)

    token = request.data.get("telegram_bot_token", "").strip()
    button_name = request.data.get("telegram_button_name", "Do'kon").strip() or "Do'kon"
    welcome_message = request.data.get("telegram_welcome_message", "").strip()

    if not token:
        return Response({"error": "Iltimos, @BotFather dan olingan bot tokenini kiriting!"}, status=400)

    ok, bot_res = get_bot_info(token)
    if ok and isinstance(bot_res, dict):
        detected_username = bot_res.get("username", "").lstrip("@")
    else:
        # Check standard Telegram bot token syntax: numbers + ':' + secret
        if ":" in token and token.split(":")[0].isdigit() and len(token) > 20:
            clean_sub = store.subdomain.replace("-", "_").lower()
            custom_u = request.data.get("telegram_bot_username", "").strip().lstrip("@")
            detected_username = custom_u or f"{clean_sub}_bot"
        else:
            err_desc = str(bot_res) if not ok else "Token formati noto'g'ri"
            return Response({
                "success": False,
                "error": f"Bot tokeni yaroqsiz yoki Telegram API xatoligi: {err_desc}"
            }, status=400)

    # Ensure this token is exclusively associated with this store
    from apps.stores.models import Store
    Store.objects.filter(telegram_bot_token=token).exclude(id=store.id).update(telegram_bot_token='')

    store.telegram_bot_username = detected_username
    store.telegram_bot_token = token
    store.telegram_button_name = button_name
    if welcome_message:
        store.telegram_welcome_message = welcome_message
    store.save(update_fields=['telegram_bot_username', 'telegram_bot_token', 'telegram_button_name', 'telegram_welcome_message', 'updated_at'])

    # Automatically setup menu button if possible
    web_app_url = get_store_webapp_url(store)
    try:
        setup_bot_menu_button(token, web_app_url, button_name)
    except Exception:
        pass

    # Start background polling
    try:
        start_polling_thread()
    except Exception:
        pass

    return Response({
        "success": True,
        "message": f"Telegram bot @{store.telegram_bot_username} muvaffaqiyatli saqlandi va Web App ishga tushirildi!",
        "bot_username": store.telegram_bot_username,
        "web_app_url": web_app_url,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def telegram_disconnect_view(request):
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Do'kon topilmadi"}, status=404)

    store.telegram_bot_token = ""
    store.telegram_bot_username = ""
    store.save()
    try:
        from apps.telegram_bot.polling import notify_polling_changed
        notify_polling_changed()
    except Exception:
        pass
    return Response({
        "success": True,
        "message": "Telegram bot uzildi. Endi boshqa botni ulashingiz mumkin!"
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def telegram_setup_menu_view(request):
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Do'kon topilmadi"}, status=404)

    if not store.telegram_bot_token:
        return Response({"error": "Bot tokeni ulanmagan"}, status=400)

    web_app_url = get_store_webapp_url(store)
    button_name = store.telegram_button_name or "Do'kon"
    ok, msg = setup_bot_menu_button(store.telegram_bot_token, web_app_url, button_name)
    if ok:
        return Response({"success": True, "message": msg})
    return Response({"success": False, "error": msg}, status=400)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def telegram_test_view(request):
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Do'kon topilmadi"}, status=404)

    if not store.telegram_bot_token:
        return Response({"error": "Bot tokeni ulanmagan"}, status=400)

    ok, bot_res = get_bot_info(store.telegram_bot_token)
    if ok:
        store.telegram_bot_username = bot_res.get('username', store.telegram_bot_username)
        store.save(update_fields=['telegram_bot_username'])
        return Response({
            "success": True,
            "message": f"Aloqa o'rnatilgan! Bot: @{store.telegram_bot_username}"
        })
    
    if "Unauthorized" in str(bot_res):
        msg = (
            "Telegram bu tokenni qabul qilmadi (401 Unauthorized). "
            "@BotFather ga kiring, /mybots -> Botingizni tanlang -> API Token tugmasini bosing "
            "va yangi tokenni nusxalab bu yerga kiriting."
        )
    else:
        msg = f"Aloqa xatoligi: {bot_res}"

    return Response({"success": False, "error": msg}, status=400)
