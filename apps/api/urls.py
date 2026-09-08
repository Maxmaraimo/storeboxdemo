from django.urls import path
from apps.dashboard import views as old_views
from . import views_auth, views_dashboard, views_orders, views_catalog, views_customers, views_settings

app_name = "api_v1"

urlpatterns = [
    # Auth
    path("auth/csrf/", views_auth.csrf_view, name="auth_csrf"),
    path("auth/login/", views_auth.login_view, name="auth_login"),
    path("auth/me/", views_auth.me_view, name="auth_me"),
    path("auth/logout/", views_auth.logout_view, name="auth_logout"),
    path("auth/switch-store/<int:store_id>/", views_auth.switch_store_view, name="auth_switch_store"),

    # Dashboard Summary & Charts
    path("dashboard/summary/", views_dashboard.dashboard_summary_view, name="dashboard_summary"),

    # Orders
    path("orders/", views_orders.orders_list_view, name="orders_list"),
    path("orders/<int:order_id>/", views_orders.order_detail_view, name="order_detail"),
    path("orders/<int:order_id>/status/", views_orders.update_order_status_view, name="order_update_status"),

    # Catalog & Warehouse
    path("products/", views_catalog.products_list_view, name="products_list"),
    path("products/create/", views_catalog.product_create_view, name="product_create"),
    path("products/<int:product_id>/", views_catalog.product_delete_view, name="product_delete"),
    path("categories/", views_catalog.categories_list_view, name="categories_list"),
    path("categories/<int:category_id>/toggle-active/", views_catalog.category_toggle_active_view, name="category_toggle_active"),

    # Customers
    path("customers/", views_customers.customers_list_view, name="customers_list"),
    path("customers/adjust-bonus/", views_customers.adjust_bonus_view, name="customer_adjust_bonus"),

    # Settings & Translations
    path("settings/store/", views_settings.store_settings_view, name="store_settings"),
    path("translations/<str:lang_code>/", views_settings.translations_view, name="translations"),

    # YES POS Integration endpoints
    path("yespos/test/", old_views.yespos_test_api, name="yespos_test"),
    path("yespos/connect/", old_views.yespos_connect_api, name="yespos_connect"),
    path("yespos/disconnect/", old_views.yespos_disconnect_api, name="yespos_disconnect"),
    path("yespos/catalog/", old_views.yespos_catalog_api, name="yespos_catalog"),
    path("yespos/import/", old_views.yespos_import_api, name="yespos_import"),
    path("yespos/sync/", old_views.yespos_sync_api, name="yespos_sync"),
]
