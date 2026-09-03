from django.urls import path
from apps.storefront import views

app_name = 'storefront'

urlpatterns = [
    path('', views.storefront_home_view, name='home'),
    path('store/<slug:subdomain>/', views.storefront_home_view, name='store_subdomain'),
    path('api/product/<int:product_id>/', views.product_detail_json_view, name='product_detail_json'),
    path('cart/add/', views.cart_add_view, name='cart_add'),
    path('cart/update/', views.cart_update_view, name='cart_update'),
    path('cart/clear/', views.cart_clear_view, name='cart_clear'),
    path('cart/apply-promo/', views.apply_promo_view, name='apply_promo'),
    path('checkout/', views.checkout_view, name='checkout'),
    path('store/<slug:subdomain>/checkout/', views.checkout_view, name='store_checkout'),
    path('order/<str:order_number>/success/', views.order_success_view, name='order_success'),

    # Customer Profile & Orders API
    path('api/customer/login/', views.customer_login_api, name='customer_login_api'),
    path('store/<slug:subdomain>/api/customer/login/', views.customer_login_api, name='store_customer_login_api'),
    path('api/customer/orders/', views.customer_orders_api, name='customer_orders_api'),
    path('store/<slug:subdomain>/api/customer/orders/', views.customer_orders_api, name='store_customer_orders_api'),
    path('api/customer/logout/', views.customer_logout_api, name='customer_logout_api'),
    path('store/<slug:subdomain>/api/customer/logout/', views.customer_logout_api, name='store_customer_logout_api'),
]
