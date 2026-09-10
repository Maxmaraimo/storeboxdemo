from apps.core.translations import get_translations


def tenant_context(request):
    store = getattr(request, 'store', None)
    is_platform_root = getattr(request, 'is_platform_root', False)
    session = getattr(request, 'session', {})
    session_get = session.get if hasattr(session, 'get') else (lambda k, d=None: d)
    current_lang = getattr(request, 'language', None) or session_get('lang') or request.COOKIES.get('django_language') or 'uz'
    cart = session_get('cart', {})
    cart_count = sum(item.get('quantity', 0) for item in cart.values())

    unread_notifs_count = 0
    new_orders_count = 0
    unread_chats_count = 0
    if store and hasattr(request, 'user') and request.user.is_authenticated:
        try:
            from apps.orders.models import Order, ChatMessage
            new_orders_count = Order.objects.filter(store=store, status=Order.OrderStatuses.NEW).count()
            unread_chats_count = ChatMessage.objects.filter(
                store=store,
                sender=ChatMessage.Senders.CUSTOMER,
                is_read=False
            ).count()
            unread_notifs_count = new_orders_count + unread_chats_count
        except Exception:
            pass

    return {
        'tenant_store': store,
        'is_platform_root': is_platform_root,
        'current_lang': current_lang,
        't': get_translations(current_lang),
        'cart_count': cart_count,
        'cart_items': cart,
        'unread_notifs_count': unread_notifs_count,
        'new_orders_count': new_orders_count,
        'unread_chats_count': unread_chats_count,
    }
