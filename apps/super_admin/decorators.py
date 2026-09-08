from functools import wraps
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
            return redirect(f"{settings.LOGIN_URL}?next={request.get_full_path()}")
        
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
                "<p><a href='/dashboard/'>Вернуться в панель управления магазином</a></p>"
            )
        return view_func(request, *args, **kwargs)
    return _wrapped_view
