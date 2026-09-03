from django.urls import path
from apps.payments import views

app_name = 'payments'

urlpatterns = [
    path('click/prepare/', views.click_prepare_view, name='click_prepare'),
    path('click/complete/', views.click_complete_view, name='click_complete'),
    path('payme/', views.payme_jsonrpc_view, name='payme_jsonrpc'),
    path('uzum/webhook/', views.uzum_webhook_view, name='uzum_webhook'),
    path('simulate/<str:order_number>/', views.simulate_payment_view, name='simulate_payment'),
]
