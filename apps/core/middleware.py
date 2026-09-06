import re
from django.conf import settings
from django.shortcuts import render
from apps.stores.models import Store


class SubdomainTenantMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # 1. Language resolution
        query_lang = request.GET.get('lang')
        if query_lang in ['ru', 'uz', 'en', 'tr']:
            request.session['lang'] = query_lang
            request.session['_language'] = query_lang

        stored_lang = request.session.get('lang') or request.COOKIES.get('django_language') or request.COOKIES.get('storebox_lang')
        if stored_lang in ['ru', 'uz', 'en', 'tr']:
            request.language = stored_lang
        else:
            request.language = 'uz'

        # 2. Host and subdomain resolution
        host = request.get_host().split(':')[0].lower()
        platform_domains = [
            getattr(settings, 'PLATFORM_DOMAIN', 'storebox.uz').lower(),
            'storebox.uz',
            'platform.uz'
        ]

        # Path exclusions (static, media, admin, merchant dashboard)
        path = request.path
        is_system_path = (
            path.startswith('/static/') or 
            path.startswith('/media/') or 
            path.startswith('/django-admin/')
        )

        request.store = None
        request.is_platform_root = True

        tunnel_domains = [
            'trycloudflare.com',
            'lhr.life',
            'loca.lt',
            'ngrok.io',
            'ngrok-free.app',
        ]
        is_tunnel = any(host.endswith('.' + t_dom) or host == t_dom for t_dom in tunnel_domains)

        if not is_system_path:
            subdomain = None
            # Check subdomain from host (only if NOT a public tunnel domain)
            if not is_tunnel and host != 'localhost' and host != '127.0.0.1' and host not in platform_domains and not host.startswith('www.'):
                matched = False
                for p_dom in platform_domains:
                    if host.endswith('.' + p_dom):
                        subdomain = host[:-len('.' + p_dom)]
                        matched = True
                        break
                if not matched:
                    if host.endswith('.localhost'):
                        subdomain = host[:-len('.localhost')]

            # Query param override for convenient local development & demos: ?store=goldlavash
            param_store = request.GET.get('store')
            if param_store:
                subdomain = param_store

            # If user is in /store/<subdomain>/ URL path fallback for ultra-flexible routing
            if path.startswith('/store/'):
                parts = path.strip('/').split('/')
                if len(parts) >= 2:
                    subdomain = parts[1]
                    request.session['current_store_subdomain'] = subdomain
            elif not subdomain and request.session.get('current_store_subdomain'):
                subdomain = request.session.get('current_store_subdomain')

            if subdomain and subdomain not in ['www', 'api', 'app', 'admin']:
                try:
                    store = Store.objects.filter(subdomain__iexact=subdomain, is_active=True).first()
                    if store:
                        request.store = store
                        request.is_platform_root = False
                    else:
                        # Unknown store - only show 404 on actual store pages, not system/order/auth paths
                        safe_prefixes = (
                            '/dashboard', '/login', '/register', '/logout', '/accounts',
                            '/order', '/profile', '/cart', '/checkout', '/auth',
                            '/platform', '/payments', '/telegram', '/api'
                        )
                        if not any(path.startswith(prefix) for prefix in safe_prefixes):
                            return render(request, 'storefront/store_not_found.html', {'subdomain': subdomain}, status=404)
                except Exception:
                    # During early migrations or DB init
                    pass

        response = self.get_response(request)
        if query_lang in ['ru', 'uz', 'en', 'tr']:
            response.set_cookie('storebox_lang', query_lang, max_age=365*24*3600, path='/')
            response.set_cookie('django_language', query_lang, max_age=365*24*3600, path='/')
        return response
