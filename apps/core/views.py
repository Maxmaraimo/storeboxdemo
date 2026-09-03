from django.shortcuts import render, redirect
from apps.stores.models import Store


def landing_view(request):
    """Главная страница платформы StoreBox (Аналог RoboSell для Узбекистана)"""
    # If the request arrived on a store subdomain, route directly to that store!
    if getattr(request, 'store', None):
        from apps.storefront.views import storefront_home_view
        return storefront_home_view(request)

    # Get sample demo stores
    demo_stores = Store.objects.filter(is_active=True)[:4]
    lang = getattr(request, 'language', 'ru')

    return render(request, 'core/landing.html', {
        'demo_stores': demo_stores,
        'lang': lang,
    })


def switch_language_view(request, lang):
    if lang in ['ru', 'uz']:
        request.session['lang'] = lang
    next_url = request.META.get('HTTP_REFERER', '/')
    return redirect(next_url)
