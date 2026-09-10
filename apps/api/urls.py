from django.urls import path
from apps.dashboard import views as old_views
from . import views_auth, views_dashboard, views_orders, views_catalog, views_customers, views_settings, views_design, views_operations

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
    path("dashboard/stats/", views_dashboard.dashboard_summary_view, name="dashboard_stats"),

    # Orders
    path("orders/", views_orders.orders_list_view, name="orders_list"),
    path("orders/<int:order_id>/", views_orders.order_detail_view, name="order_detail"),
    path("orders/<int:order_id>/status/", views_orders.update_order_status_view, name="order_update_status"),

    # Customers
    path("customers/", views_customers.customers_list_view, name="customers_list"),
    path("customers/adjust-bonus/", views_customers.adjust_bonus_view, name="customers_adjust_bonus"),

    # Catalog & Products CRUD
    path("products/", views_catalog.products_list_create_view, name="products_list_create"),
    path("products/create/", views_catalog.product_create_view, name="product_create"),
    path("products/<int:product_id>/", views_catalog.product_detail_update_delete_view, name="product_detail_update_delete"),
    
    # Categories CRUD
    path("categories/", views_catalog.categories_list_create_view, name="categories_list_create"),
    path("categories/create/", views_catalog.category_create_view, name="category_create"),
    path("categories/<int:category_id>/", views_catalog.category_detail_update_delete_view, name="category_detail_update_delete"),
    path("categories/<int:category_id>/toggle-active/", views_catalog.category_toggle_active_view, name="category_toggle_active"),

    # Warehouse
    path("warehouse/adjust-stock/", views_catalog.warehouse_stock_adjust_view, name="warehouse_stock_adjust"),

    # Promo Codes CRUD
    path("promocodes/", views_operations.promocodes_list_create_view, name="promocodes_list_create"),
    path("promocodes/<int:pk>/", views_operations.promocode_detail_update_delete_view, name="promocode_detail_update_delete"),

    # Branches CRUD
    path("branches/", views_operations.branches_list_create_view, name="branches_list_create"),
    path("branches/<int:pk>/", views_operations.branch_detail_update_delete_view, name="branch_detail_update_delete"),

    # Staff CRUD
    path("staff/", views_operations.staff_list_create_view, name="staff_list_create"),
    path("staff/<int:pk>/", views_operations.staff_detail_update_delete_view, name="staff_detail_update_delete"),

    # Settings: Store, Delivery, Payments
    path("settings/store/", views_settings.store_settings_view, name="store_settings"),
    path("settings/delivery/", views_operations.store_delivery_settings_view, name="store_delivery_settings"),
    path("settings/payments/", views_operations.store_payments_view, name="store_payments"),
    path("translations/<str:lang_code>/", views_settings.translations_view, name="translations"),

    # Chats & Messages
    path("chats/", views_operations.chats_list_view, name="chats_list"),
    path("chats/<str:customer_phone>/messages/", views_operations.chat_messages_view, name="chat_messages"),
    path("chats/<str:customer_phone>/send/", views_operations.chat_send_message_view, name="chat_send_message"),

    # Marketing Campaigns
    path("marketing/campaigns/", views_operations.marketing_campaigns_list_create_view, name="marketing_campaigns"),
    path("marketing/broadcast/", views_operations.marketing_campaigns_list_create_view, name="marketing_broadcast"),

    # AI Design Studio, Banners & QR Catalog
    path("design/theme/", views_design.design_theme_get_view, name="design_theme_get"),
    path("design/theme/save/", views_design.design_theme_save_view, name="design_theme_save"),
    path("design/logo/upload/", views_design.design_logo_upload_view, name="design_logo_upload"),
    path("design/logo/delete/", views_design.design_logo_delete_view, name="design_logo_delete"),
    path("design/banners/", views_design.design_banners_list_create_view, name="design_banners_list_create"),
    path("design/banners/reorder/", views_design.design_banners_reorder_view, name="design_banners_reorder"),
    path("design/banners/<int:banner_id>/", views_design.design_banner_detail_view, name="design_banner_detail"),
    path("design/banner/upload/", views_design.design_banner_upload_view, name="design_banner_upload"),
    path("design/ai-suggest/", views_design.design_ai_suggest_view, name="design_ai_suggest"),
    path("design/apply-niche/", views_design.design_apply_niche_view, name="design_apply_niche"),
    path("platforms/qr/", views_design.qr_catalog_settings_view, name="qr_catalog_settings"),

    # YES POS Integration endpoints
    path("yespos/status/", views_catalog.yespos_status_view, name="yespos_status"),
    path("yespos/test/", old_views.yespos_test_api, name="yespos_test"),
    path("yespos/connect/", old_views.yespos_connect_api, name="yespos_connect"),
    path("yespos/disconnect/", old_views.yespos_disconnect_api, name="yespos_disconnect"),
    path("yespos/catalog/", old_views.yespos_catalog_api, name="yespos_catalog"),
    path("yespos/import/", old_views.yespos_import_api, name="yespos_import"),
    path("yespos/sync/", old_views.yespos_sync_api, name="yespos_sync"),
]
