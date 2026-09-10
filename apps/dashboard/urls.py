from django.urls import path
from apps.dashboard import views
from apps.core import views as core_views
from apps.api import views_dashboard

app_name = 'dashboard'

urlpatterns = [
    # Modern React 19 SPA routes
    path('', views.dashboard_spa_view, name='home'),
    path('orders/', views.dashboard_spa_view, name='orders'),
    path('products/', views.dashboard_spa_view, name='products'),
    path('categories/', views.dashboard_spa_view, name='categories'),
    path('customers/', views.dashboard_spa_view, name='customers'),
    path('chats/', views.dashboard_spa_view, name='chats'),
    path('warehouse/', views.dashboard_spa_view, name='warehouse'),
    path('discounts/', views.dashboard_spa_view, name='discounts'),
    path('ikpu/', views.dashboard_spa_view, name='ikpu'),
    path('marketing/', views.dashboard_spa_view, name='marketing'),
    path('platforms/', views.dashboard_spa_view, name='platforms'),
    path('platforms/qr/', views.dashboard_spa_view, name='platforms_qr'),
    path('qr/', views.dashboard_spa_view, name='qr'),
    path('design/', views.dashboard_spa_view, name='design'),
    path('yespos/', views.dashboard_spa_view, name='yespos'),
    path('settings/', views.dashboard_spa_view, name='settings_general'),
    path('settings/<path:subpath>/', views.dashboard_spa_view, name='settings_sub'),
    path('robo-market/', views.dashboard_spa_view, name='robo_market'),

    # Async Dashboard Stats / Summary APIs (pure JSON, <50ms response)
    path('summary/', views_dashboard.dashboard_summary_view, name='summary_alias'),
    path('stats/', views_dashboard.dashboard_summary_view, name='stats_alias'),
    path('api/dashboard/stats/', views_dashboard.dashboard_summary_view, name='api_dashboard_stats'),
    path('api/dashboard/summary/', views_dashboard.dashboard_summary_view, name='api_dashboard_summary'),

    path('lang/<str:lang>/', core_views.switch_language_view, name='dashboard_switch_language'),
    path('onboarding/', views.onboarding_wizard_view, name='onboarding'),
    path('dev-login/', views.dev_login_view, name='dev_login'),
    
    # APIs
    path('api/check-subdomain/', views.check_subdomain_api, name='check_subdomain'),
    path('api/translate/', views.translate_api, name='translate_api'),
    path('api/ai-desc/', views.ai_desc_api, name='ai_desc_api'),
    path('api/ai-designer/', views.ai_designer_api, name='ai_designer_api'),
    path('api/ai-apply-niche/', views.ai_apply_niche_api, name='ai_apply_niche_api'),
    path('api/ai-banner-regenerate/', views.ai_banner_regenerate_api, name='ai_banner_regenerate_api'),
    path('api/upload-banner/', views.upload_banner_api, name='upload_banner_api'),
    path('api/geo-search/', views.geo_search_api, name='api_geo_search'),
    path('api/geo-reverse/', views.geo_reverse_api, name='api_geo_reverse'),
    path('api/topup-balance/', views.topup_balance_api, name='topup_balance_api'),
    path('api/add-card/', views.add_card_api, name='add_card_api'),
    path('api/toggle-payment/', views.toggle_payment_api, name='toggle_payment_api'),
    path('api/update-order-status/', views.update_order_status_api, name='update_order_status_api'),
    path('api/orders/<int:order_id>/', views.order_detail_api, name='order_detail_api'),
    path('api/adjust-bonus/', views.adjust_bonus_api, name='adjust_bonus_api'),
    path('api/branch-action/', views.branch_action_api, name='branch_action_api'),
    path('api/staff-action/', views.staff_action_api, name='staff_action_api'),
    path('api/send-chat/', views.send_chat_api, name='send_chat_api'),
    path('api/get-chat/', views.get_chat_messages_api, name='get_chat_messages_api'),
    path('api/quick-create-store/', views.quick_create_store_api, name='quick_create_store_api'),
    path('api/switch-store/<int:store_id>/', views.switch_store_api, name='switch_store_api'),
    path('orders/export/', views.export_orders_csv, name='export_orders_csv'),

    # Product/category modification endpoints
    path('products/new/', views.product_create_or_edit_view, name='product_create'),
    path('products/create/', views.product_create_or_edit_view, name='product_create_alias'),
    path('products/<int:product_id>/edit/', views.product_create_or_edit_view, name='product_edit'),
    path('products/<int:product_id>/delete/', views.product_delete_view, name='product_delete'),
    path('api/categories/<int:category_id>/products/', views.category_products_api, name='category_products_api'),
    path('api/categories/toggle-active/', views.category_toggle_active_api, name='category_toggle_active_api'),
    path('api/categories/quick-add-product/', views.category_quick_add_product_api, name='category_quick_add_product_api'),
    path('orders/<int:order_id>/', views.order_detail_view, name='order_detail'),

    # Legacy views (accessible under /dashboard/legacy/)
    path('legacy/', views.dashboard_home_view, name='legacy_home'),
    path('legacy/products/', views.products_list_view, name='legacy_products'),
    path('legacy/categories/', views.categories_list_view, name='legacy_categories'),
    path('legacy/warehouse/', views.warehouse_view, name='legacy_warehouse'),
    path('legacy/ikpu/', views.ikpu_view, name='legacy_ikpu'),
    path('legacy/discounts/', views.discounts_view, name='legacy_discounts'),
    path('legacy/orders/', views.orders_list_view, name='legacy_orders'),
    path('legacy/customers/', views.customers_list_view, name='legacy_customers'),
    path('legacy/chats/', views.chats_view, name='legacy_chats'),
    path('legacy/marketing/', views.marketing_view, name='legacy_marketing'),
    path('legacy/platforms/', views.platforms_view, name='legacy_platforms'),
    path('legacy/settings/', views.settings_general_view, name='legacy_settings_general'),
    path('legacy/settings/branches/', views.settings_branches_view, name='legacy_settings_branches'),
    path('legacy/settings/staff/', views.settings_staff_view, name='legacy_settings_staff'),
    path('legacy/settings/tariffs/', views.settings_tariffs_view, name='legacy_settings_tariffs'),
    path('legacy/settings/telegram/', views.settings_telegram_view, name='legacy_settings_telegram'),
    path('legacy/settings/delivery/', views.settings_delivery_view, name='legacy_settings_delivery'),
    path('legacy/settings/payments/', views.settings_payments_view, name='legacy_settings_payments'),
    path('legacy/robo-market/', views.robo_market_view, name='legacy_robo_market'),
    path('legacy/yespos/', views.yespos_view, name='legacy_yespos'),

    # YES POS API
    path('api/yespos/test/', views.yespos_test_api, name='yespos_test_api'),
    path('api/yespos/connect/', views.yespos_connect_api, name='yespos_connect_api'),
    path('api/yespos/disconnect/', views.yespos_disconnect_api, name='yespos_disconnect_api'),
    path('api/yespos/catalog/', views.yespos_catalog_api, name='yespos_catalog_api'),
    path('api/yespos/image/', views.yespos_image_proxy, name='yespos_image_proxy'),
    path('api/yespos/import/', views.yespos_import_api, name='yespos_import_api'),
    path('api/yespos/sync/', views.yespos_sync_api, name='yespos_sync_api'),
]
