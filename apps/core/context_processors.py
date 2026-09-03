def tenant_context(request):
    store = getattr(request, 'store', None)
    is_platform_root = getattr(request, 'is_platform_root', False)
    current_lang = getattr(request, 'language', 'ru')
    cart = request.session.get('cart', {})
    cart_count = sum(item.get('quantity', 0) for item in cart.values())

    return {
        'tenant_store': store,
        'is_platform_root': is_platform_root,
        'current_lang': current_lang,
        'cart_count': cart_count,
        'cart_items': cart,
    }
