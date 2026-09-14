from urllib.parse import urlencode

from django.conf import settings
from django.shortcuts import redirect
from django.urls import include, path


def legacy_billing_login_redirect(request):
    query = urlencode({"next": f"https://{settings.BILLING_DOMAIN}/"})
    return redirect(f"{settings.APP_SITE_URL}/dashboard/login/?{query}")


def legacy_billing_dashboard_redirect(request, legacy_path=""):
    return redirect("/")


urlpatterns = [
    path("dashboard/login", legacy_billing_login_redirect),
    path("dashboard/login/", legacy_billing_login_redirect),
    path("dashboard/", legacy_billing_dashboard_redirect),
    path("dashboard/<path:legacy_path>", legacy_billing_dashboard_redirect),
    path("storebox/billing", legacy_billing_dashboard_redirect),
    path("storebox/billing/", legacy_billing_dashboard_redirect),
    path('', include('apps.super_admin.urls')),
]
