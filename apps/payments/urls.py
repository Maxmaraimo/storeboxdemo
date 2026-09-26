from django.urls import path
from apps.payments import views

app_name = 'payments'

urlpatterns = [
    path('click/prepare/', views.click_prepare_view, name='click_prepare'),
    path('click/complete/', views.click_complete_view, name='click_complete'),
    path('payme/', views.payme_jsonrpc_view, name='payme_jsonrpc'),
    path('uzum/', views.uzum_webhook_view, name='uzum_short'),
    path('uzum/webhook/', views.uzum_webhook_view, name='uzum_webhook'),
    path('multicard/callback/', views.multicard_callback_view, name='multicard_callback'),
    path('multicard/pay-card/', views.multicard_init_card_pay_view, name='multicard_init_card_pay'),
    path('multicard/confirm-otp/', views.multicard_confirm_otp_view, name='multicard_confirm_otp'),
    path('multicard/checkout/<str:order_number>/', views.multicard_checkout_page_view, name='multicard_checkout_page'),
    path('simulate/<str:order_number>/', views.simulate_payment_view, name='simulate_payment'),
]
