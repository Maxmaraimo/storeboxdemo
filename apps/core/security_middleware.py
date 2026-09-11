import time
import logging
from django.core.cache import cache
from django.http import HttpResponse, JsonResponse
from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger(__name__)


class RateLimitDdosMiddleware(MiddlewareMixin):
    """
    Intelligent rate-limiting middleware to protect StoreBox against DDoS attacks,
    brute-force credential stuffing, and automated scraping abuse.
    
    Limits:
    - Auth & Login endpoints: max 25 requests per minute per IP.
    - Sensitive mutating endpoints (POST/PUT/PATCH/DELETE): max 120 requests per minute per IP.
    - General read endpoints: max 400 requests per minute per IP.
    """

    AUTH_PREFIXES = (
        '/login',
        '/register',
        '/api/v1/auth/login',
        '/auth/login',
        '/admin/login',
        '/accounts/login',
    )

    EXEMPT_PREFIXES = (
        '/static/',
        '/media/',
        '/favicon.ico',
    )

    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR', '127.0.0.1')
        return ip

    def process_request(self, request):
        path = request.path

        # Fast exit for static assets
        for exempt in self.EXEMPT_PREFIXES:
            if path.startswith(exempt):
                return None

        # Basic path traversal & null byte injection check
        from urllib.parse import unquote
        raw_query = request.META.get('QUERY_STRING', '')
        unquoted_path = unquote(path)
        unquoted_query = unquote(raw_query)

        if ('\x00' in unquoted_path or '\x00' in unquoted_query or '%00' in raw_query or '%00' in path or
            '../..' in unquoted_path or '../..' in unquoted_query):
            logger.warning(f"Blocked potential path traversal / null byte injection from {self.get_client_ip(request)}")
            return HttpResponse("Bad Request", status=400)

        client_ip = self.get_client_ip(request)
        current_minute = int(time.time() // 60)

        # Determine threshold
        is_auth = any(path.startswith(prefix) for prefix in self.AUTH_PREFIXES)
        if is_auth:
            limit = 25  # max 25 attempts/min on auth endpoints
            cache_key = f"ratelimit:auth:{client_ip}:{current_minute}"
        elif request.method in ('POST', 'PUT', 'PATCH', 'DELETE'):
            limit = 120  # max 120 mutations/min
            cache_key = f"ratelimit:mutate:{client_ip}:{current_minute}"
        else:
            limit = 400  # max 400 requests/min general traffic
            cache_key = f"ratelimit:general:{client_ip}:{current_minute}"

        try:
            # Increment request counter in cache with 120s TTL
            req_count = cache.get(cache_key, 0)
            if req_count is None:
                req_count = 0
            req_count += 1
            cache.set(cache_key, req_count, timeout=120)

            if req_count > limit:
                logger.warning(f"Rate limit exceeded for IP {client_ip} on {path} ({req_count}/{limit})")
                retry_after = 60 - int(time.time() % 60)
                
                if request.headers.get('x-requested-with') == 'XMLHttpRequest' or path.startswith('/api/'):
                    response = JsonResponse({
                        'error': 'Too Many Requests',
                        'message': 'Juda ko`p so`rov yuborildi. Iltimos, birozdan so`ng qayta urinib ko`ring.',
                        'retry_after': retry_after
                    }, status=429)
                else:
                    html_content = (
                        "<!DOCTYPE html><html><head><meta charset='utf-8'><title>429 Too Many Requests</title>"
                        "<style>body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#0f172a;color:#f8fafc;"
                        "display:flex;align-items:center;justify-content:center;height:100vh;margin:0;}"
                        ".box{background:#1e293b;padding:32px;border-radius:16px;box-shadow:0 10px 25px rgba(0,0,0,0.5);"
                        "max-width:440px;text-align:center;border:1px solid #334155;}"
                        "h1{color:#ef4444;font-size:24px;margin-bottom:12px;}p{font-size:14px;color:#94a3b8;line-height:1.6;}"
                        ".time{font-family:monospace;background:#0f172a;padding:4px 8px;border-radius:6px;color:#38bdf8;}"
                        "</style></head><body><div class='box'>"
                        "<h1>429 — Juda ko'p so'rov yuborildi</h1>"
                        "<p>Xavfsizlik tizimi yuqori yuklamani aniqladi. Iltimos, <span class='time'>" + str(retry_after) + " soniya</span> kutib, qayta urining.</p>"
                        "</div></body></html>"
                    )
                    response = HttpResponse(html_content, status=429, content_type='text/html; charset=utf-8')
                
                response['Retry-After'] = str(retry_after)
                return response
        except Exception as e:
            # Never break production traffic if cache backend encounters an internal issue
            logger.error(f"RateLimit middleware cache error: {e}")

        return None


class SecurityHeadersMiddleware(MiddlewareMixin):
    """
    Injects enterprise security headers into all responses:
    - X-Content-Type-Options: nosniff
    - X-XSS-Protection: 1; mode=block
    - Referrer-Policy: strict-origin-when-cross-origin
    - X-Frame-Options: DENY for admin & super-admin pages to prevent clickjacking
    """

    def process_response(self, request, response):
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'

        path = getattr(request, 'path', '')
        # Strictly prohibit framing/embedding for admin and super-admin panels
        if path.startswith('/super-admin') or path.startswith('/admin') or path.startswith('/django-admin'):
            response['X-Frame-Options'] = 'DENY'
        elif not response.has_header('X-Frame-Options'):
            response['X-Frame-Options'] = 'SAMEORIGIN'

        return response
