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
    lang = (lang or '').lower().strip()
    if lang in ['uz', 'ru', 'en']:
        request.session['lang'] = lang
        request.session['_language'] = lang
        from django.utils import translation
        translation.activate(lang)

    next_url = request.GET.get('next') or request.META.get('HTTP_REFERER') or '/dashboard/'
    if '#' in next_url:
        next_url = next_url.split('#')[0]
    if not next_url.strip():
        next_url = '/dashboard/'

    response = redirect(next_url)
    if lang in ['uz', 'ru', 'en']:
        response.set_cookie('django_language', lang, max_age=365*24*60*60, samesite='Lax')
        response.set_cookie('storebox_lang', lang, max_age=365*24*60*60, samesite='Lax')
    return response
