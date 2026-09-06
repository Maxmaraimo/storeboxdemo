from apps.core.translations import get_translations


def tenant_context(request):
    store = getattr(request, 'store', None)
    is_platform_root = getattr(request, 'is_platform_root', False)
    session = getattr(request, 'session', {})
    session_get = session.get if hasattr(session, 'get') else (lambda k, d=None: d)
    current_lang = getattr(request, 'language', None) or session_get('lang') or request.COOKIES.get('django_language') or 'uz'
    cart = session_get('cart', {})
    cart_count = sum(item.get('quantity', 0) for item in cart.values())

    return {
        'tenant_store': store,
        'is_platform_root': is_platform_root,
        'current_lang': current_lang,
        't': get_translations(current_lang),
        'cart_count': cart_count,
        'cart_items': cart,
    }
