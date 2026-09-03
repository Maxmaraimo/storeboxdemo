import re
from django.conf import settings
from django.shortcuts import render
from apps.stores.models import Store


class SubdomainTenantMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # 1. Language resolution
        lang = request.GET.get('lang')
        if lang in ['ru', 'uz']:
            request.session['lang'] = lang
        request.language = request.session.get('lang', 'ru')

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

        if not is_system_path:
            subdomain = None
            # Check subdomain from host
            # Examples: goldlavash.storebox.uz, goldlavash.platform.uz, goldlavash.localhost
            if host != 'localhost' and host != '127.0.0.1' and host not in platform_domains and not host.startswith('www.'):
                matched = False
                for p_dom in platform_domains:
                    if host.endswith('.' + p_dom):
                        subdomain = host[:-len('.' + p_dom)]
                        matched = True
                        break
                if not matched:
                    if host.endswith('.localhost'):
                        subdomain = host[:-len('.localhost')]
                    elif '.' in host:
                        subdomain = host.split('.')[0]

            # Query param override for convenient local development & demos: ?store=goldlavash
            param_store = request.GET.get('store')
            if param_store:
                subdomain = param_store

            # If user is in /store/<subdomain>/ URL path fallback for ultra-flexible routing
            if path.startswith('/store/'):
                parts = path.strip('/').split('/')
                if len(parts) >= 2:
                    subdomain = parts[1]

            if subdomain and subdomain not in ['www', 'api', 'app', 'admin']:
                try:
                    store = Store.objects.filter(subdomain__iexact=subdomain, is_active=True).first()
                    if store:
                        request.store = store
                        request.is_platform_root = False
                    else:
                        # Unknown store
                        if not path.startswith('/dashboard') and not path.startswith('/login') and not path.startswith('/register'):
                            return render(request, 'storefront/store_not_found.html', {'subdomain': subdomain}, status=404)
                except Exception:
                    # During early migrations or DB init
                    pass

        response = self.get_response(request)
        return response
