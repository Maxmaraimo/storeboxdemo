from functools import wraps
from urllib.parse import urlencode

from django.shortcuts import redirect
from django.http import HttpResponseForbidden
from django.conf import settings
from apps.accounts.models import User


def superadmin_required(view_func):
    """
    Decorator for views that checks that the user is logged in and is a platform super-admin.
    """
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        if not request.user.is_authenticated:
            query = urlencode({'next': request.build_absolute_uri()})
            return redirect(f"{settings.APP_SITE_URL}/dashboard/login/?{query}")
        
        is_super = (
            request.user.is_superuser or
            request.user.is_staff or
            getattr(request.user, 'role', None) == User.Roles.SUPERADMIN or
            getattr(request.user, 'is_platform_admin', False)
        )
        if not is_super:
            return HttpResponseForbidden(
                "<h1>403 Доступ запрещен</h1>"
                "<p>Данный раздел предназначен исключительно для супер-администраторов платформы StoreBox.</p>"
                f"<p><a href='{settings.APP_SITE_URL}/dashboard/'>Вернуться в панель управления магазином</a></p>"
            )
        return view_func(request, *args, **kwargs)
    return _wrapped_view
