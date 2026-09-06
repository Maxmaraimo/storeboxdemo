from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from apps.dashboard import views as dashboard_views
from apps.core import views as core_views

urlpatterns = [
    path('admin/', admin.site.urls),

    # Language Switcher
    path('lang/<str:lang>/', core_views.switch_language_view, name='switch_language'),

    # Auth & Onboarding
    path('register/', dashboard_views.register_view, name='register'),
    path('login/', dashboard_views.login_view, name='login'),
    path('auth/login/', dashboard_views.login_view, name='auth_login'),
    path('accounts/login/', dashboard_views.login_view, name='accounts_login'),
    path('logout/', dashboard_views.logout_view, name='logout'),
    path('onboarding/', dashboard_views.onboarding_wizard_view, name='onboarding'),

    # Merchant Dashboard
    path('dashboard/', include('apps.dashboard.urls')),

    # Payment Gateways (Click, Payme, Uzum Pay)
    path('payments/', include('apps.payments.urls')),

    # Core platform landing & i18n
    path('platform/', include('apps.core.urls')),

    # Telegram Bot & Webhook
    path('telegram/', include('apps.telegram_bot.urls')),

    # Public Storefront & TMA (includes root fallback)
    path('', include('apps.storefront.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
