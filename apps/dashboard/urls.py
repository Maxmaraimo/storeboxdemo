from django.urls import path
from apps.dashboard import views

app_name = 'dashboard'

urlpatterns = [
    path('', views.dashboard_home_view, name='home'),
    path('onboarding/', views.onboarding_wizard_view, name='onboarding'),
    
    # APIs
    path('api/check-subdomain/', views.check_subdomain_api, name='check_subdomain'),
    path('api/translate/', views.translate_api, name='translate_api'),
    path('api/ai-desc/', views.ai_desc_api, name='ai_desc_api'),
    path('api/topup-balance/', views.topup_balance_api, name='topup_balance_api'),
        path('api/add-card/', views.add_card_api, name='add_card_api'),
    path('api/toggle-payment/', views.toggle_payment_api, name='toggle_payment_api'),
    path('api/update-order-status/', views.update_order_status_api, name='update_order_status_api'),
    path('api/adjust-bonus/', views.adjust_bonus_api, name='adjust_bonus_api'),
    path('api/branch-action/', views.branch_action_api, name='branch_action_api'),
    path('api/staff-action/', views.staff_action_api, name='staff_action_api'),
    path('api/send-chat/', views.send_chat_api, name='send_chat_api'),
    path('api/quick-create-store/', views.quick_create_store_api, name='quick_create_store_api'),
    path('api/switch-store/<int:store_id>/', views.switch_store_api, name='switch_store_api'),
    path('orders/export/', views.export_orders_csv, name='export_orders_csv'),

    # Catalog & Warehouse (from Video)
    path('products/', views.products_list_view, name='products'),
    path('products/new/', views.product_create_or_edit_view, name='product_create'),
    path('products/create/', views.product_create_or_edit_view, name='product_create_alias'),
    path('products/<int:product_id>/edit/', views.product_create_or_edit_view, name='product_edit'),
    path('products/<int:product_id>/delete/', views.product_delete_view, name='product_delete'),
    path('categories/', views.categories_list_view, name='categories'),
    path('warehouse/', views.warehouse_view, name='warehouse'),
    path('ikpu/', views.ikpu_view, name='ikpu'),
    path('discounts/', views.discounts_view, name='discounts'),

    # Orders
    path('orders/', views.orders_list_view, name='orders'),
    path('orders/<int:order_id>/', views.order_detail_view, name='order_detail'),

    # Customers & Chats
    path('customers/', views.customers_list_view, name='customers'),
    path('chats/', views.chats_view, name='chats'),

    # Marketing & Platforms (QR Catalog, Telegram, Website)
    path('marketing/', views.marketing_view, name='marketing'),
    path('platforms/', views.platforms_view, name='platforms'),

    # Settings & Integrations
    path('settings/', views.settings_general_view, name='settings_general'),
    path('settings/branches/', views.settings_branches_view, name='settings_branches'),
    path('settings/staff/', views.settings_staff_view, name='settings_staff'),
    path('settings/tariffs/', views.settings_tariffs_view, name='settings_tariffs'),
    path('settings/telegram/', views.settings_telegram_view, name='settings_telegram'),
    path('settings/delivery/', views.settings_delivery_view, name='settings_delivery'),
    path('settings/payments/', views.settings_payments_view, name='settings_payments'),
    path('robo-market/', views.robo_market_view, name='robo_market'),
]
