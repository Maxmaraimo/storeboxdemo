import re

from django.conf import settings
from django.http import HttpResponseRedirect


class PlatformDomainRoutingMiddleware:
    """Keep the public site, merchant app, and billing panel on canonical hosts."""

    AUTH_ALIASES = {
        '/login/': '/dashboard/login/',
        '/register/': '/dashboard/register/',
        '/auth/login/': '/dashboard/login/',
        '/accounts/login/': '/dashboard/login/',
    }

    def __init__(self, get_response):
        self.get_response = get_response

    @staticmethod
    def _normalized_path(path):
        if path == '/':
            return path
        return path if path.endswith('/') else f'{path}/'

    @staticmethod
    def _redirect(request, host, path):
        query = request.META.get('QUERY_STRING', '')
        target = f'https://{host}{path}'
        if query:
            target = f'{target}?{query}'
        response = HttpResponseRedirect(target)
        if request.method not in ('GET', 'HEAD'):
            response.status_code = 307
        return response

    def __call__(self, request):
        host = request.get_host().split(':', 1)[0].lower()
        path = request.path
        normalized_path = self._normalized_path(path)

        platform_domain = settings.PLATFORM_DOMAIN.lower()
        app_domain = settings.APP_DOMAIN.lower()
        billing_domain = settings.BILLING_DOMAIN.lower()
        public_hosts = {platform_domain, f'www.{platform_domain}'}

        legacy_store_path = re.match(r'^/store/([-a-z0-9]+)(/.*)?$', path, re.IGNORECASE)
        is_storebox_host = host in public_hosts or host == app_domain or host.endswith(f'.{platform_domain}')
        if settings.STOREFRONT_SUBDOMAIN_URLS and is_storebox_host and legacy_store_path:
            store_subdomain = legacy_store_path.group(1).lower()
            storefront_path = legacy_store_path.group(2) or '/'
            return self._redirect(
                request,
                f'{store_subdomain}.{platform_domain}',
                storefront_path,
            )

        if host == billing_domain:
            if normalized_path in self.AUTH_ALIASES or normalized_path in {
                '/dashboard/login/',
                '/dashboard/register/',
            }:
                canonical_path = self.AUTH_ALIASES.get(normalized_path, normalized_path)
                return self._redirect(request, app_domain, canonical_path)

            if path == '/super-admin' or path.startswith('/super-admin/'):
                canonical_path = path[len('/super-admin'):] or '/'
                return self._redirect(request, billing_domain, canonical_path)

            request.urlconf = 'storebox.billing_urls'
            request.is_billing_admin = True
            return self.get_response(request)

        if host == app_domain:
            if path == '/':
                return self._redirect(request, app_domain, '/dashboard/')
            if normalized_path in self.AUTH_ALIASES:
                return self._redirect(request, app_domain, self.AUTH_ALIASES[normalized_path])
            if path == '/super-admin' or path.startswith('/super-admin/'):
                canonical_path = path[len('/super-admin'):] or '/'
                return self._redirect(request, billing_domain, canonical_path)

        if host in public_hosts:
            if normalized_path in self.AUTH_ALIASES:
                return self._redirect(request, app_domain, self.AUTH_ALIASES[normalized_path])
            if path == '/dashboard' or path.startswith('/dashboard/'):
                return self._redirect(request, app_domain, '/dashboard/' if path == '/dashboard' else path)
            if path == '/super-admin' or path.startswith('/super-admin/'):
                canonical_path = path[len('/super-admin'):] or '/'
                return self._redirect(request, billing_domain, canonical_path)

        return self.get_response(request)
