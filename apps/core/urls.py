from django.urls import path
from apps.core import views

app_name = 'core'

urlpatterns = [
    path('', views.landing_view, name='landing'),
    path('lang/<str:lang>/', views.switch_language_view, name='switch_language'),
    path('api/lead/', views.lead_inquiry_api, name='lead_api'),
    path('api/lead-inquiry/', views.lead_inquiry_api, name='lead_inquiry_api'),
]
