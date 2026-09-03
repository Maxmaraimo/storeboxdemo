from django.urls import path
from apps.storefront import views

app_name = 'storefront'

urlpatterns = [
    path('', views.storefront_home_view, name='home'),
    path('store/<slug:subdomain>/', views.storefront_home_view, name='store_subdomain'),
    path('api/product/<int:product_id>/', views.product_detail_json_view, name='product_detail_json'),
    path('cart/add/', views.cart_add_view, name='cart_add'),
    path('store/<slug:subdomain>/cart/add/', views.cart_add_view, name='store_cart_add'),
    path('cart/update/', views.cart_update_view, name='cart_update'),
    path('store/<slug:subdomain>/cart/update/', views.cart_update_view, name='store_cart_update'),
    path('cart/clear/', views.cart_clear_view, name='cart_clear'),
    path('store/<slug:subdomain>/cart/clear/', views.cart_clear_view, name='store_cart_clear'),
    path('cart/apply-promo/', views.apply_promo_view, name='apply_promo'),
    path('store/<slug:subdomain>/cart/apply-promo/', views.apply_promo_view, name='store_apply_promo'),
    path('checkout/', views.checkout_view, name='checkout'),
    path('store/<slug:subdomain>/checkout/', views.checkout_view, name='store_checkout'),
    path('order/<str:order_number>/success/', views.order_success_view, name='order_success'),

    # Dedicated Product Detail Page
    path('product/<int:product_id>/', views.product_detail_page_view, name='product_detail'),
    path('store/<slug:subdomain>/product/<int:product_id>/', views.product_detail_page_view, name='store_product_detail'),

    # Dedicated Customer Profile & Orders Page
    path('profile/', views.customer_profile_page_view, name='customer_profile'),
    path('store/<slug:subdomain>/profile/', views.customer_profile_page_view, name='store_customer_profile'),
    path('orders/', views.customer_profile_page_view, name='customer_orders'),
    path('store/<slug:subdomain>/orders/', views.customer_profile_page_view, name='store_customer_orders'),

    # Reorder API
    path('api/order/<str:order_number>/reorder/', views.reorder_api, name='reorder_api'),
    path('store/<slug:subdomain>/api/order/<str:order_number>/reorder/', views.reorder_api, name='store_reorder_api'),

    # Customer Profile & Orders API
    path('api/customer/login/', views.customer_login_api, name='customer_login_api'),
    path('store/<slug:subdomain>/api/customer/login/', views.customer_login_api, name='store_customer_login_api'),
    path('api/customer/orders/', views.customer_orders_api, name='customer_orders_api'),
    path('store/<slug:subdomain>/api/customer/orders/', views.customer_orders_api, name='store_customer_orders_api'),
    path('api/customer/logout/', views.customer_logout_api, name='customer_logout_api'),
    path('store/<slug:subdomain>/api/customer/logout/', views.customer_logout_api, name='store_customer_logout_api'),
]
