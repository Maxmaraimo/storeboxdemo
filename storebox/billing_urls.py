from django.urls import include, path


urlpatterns = [
    path('', include('apps.super_admin.urls')),
]
