from django.urls import path
from . import views

app_name = 'super_admin'

urlpatterns = [
    path('', views.root_redirect_view, name='root'),
    
    # 1. Servers / Stores Registry
    path('servers/', views.servers_list_view, name='servers_list'),
    path('servers/export/', views.export_servers_csv, name='servers_export_csv'),
    path('servers/create/', views.create_server_api, name='server_create'),
    path('servers/<int:store_id>/', views.server_detail_view, name='server_detail'),
    path('servers/<int:store_id>/calculate/', views.calculate_tariff_api, name='server_calculate_tariff'),
    path('servers/<int:store_id>/renew/', views.renew_license_api, name='server_renew_license'),
    path('servers/<int:store_id>/send-reminder/', views.send_tariff_reminder_api, name='server_send_reminder'),
    path('servers/<int:store_id>/toggle-status/', views.toggle_server_status_api, name='server_toggle_status'),
    path('servers/<int:store_id>/update/', views.update_server_api, name='server_update'),
    path('servers/<int:store_id>/delete/', views.delete_server_api, name='server_delete'),
    path('servers/<int:store_id>/cancel-subscription/', views.cancel_subscription_api, name='server_cancel_subscription'),
    path('servers/<int:store_id>/notes/add/', views.add_tenant_note_api, name='server_add_note'),
    path('servers/<int:store_id>/notes/<int:note_id>/delete/', views.delete_tenant_note_api, name='server_delete_note'),

    # 1.1 Tariff Requests & Inquiries
    path('tariff-requests/', views.tariff_requests_list_view, name='tariff_requests_list'),
    path('tariff-requests/<int:request_id>/approve/', views.approve_tariff_request_api, name='tariff_request_approve'),
    path('tariff-requests/<int:request_id>/reject/', views.reject_tariff_request_api, name='tariff_request_reject'),
    
    # 2. Partners Management
    path('partners/', views.partners_list_view, name='partners_list'),
    path('partners/create/', views.create_partner_api, name='partner_create'),
    path('partners/<int:partner_id>/detail/', views.partner_detail_api, name='partner_detail_api'),
    path('partners/<int:partner_id>/update/', views.update_partner_api, name='partner_update'),
    path('partners/<int:partner_id>/delete/', views.delete_partner_api, name='partner_delete'),
    path('partners/<int:partner_id>/toggle-status/', views.toggle_partner_status_api, name='partner_toggle_status'),

    # 3. Documents (Invoices, Acts, Contracts)
    path('documents/', views.documents_list_view, name='documents_list'),
    path('documents/<int:doc_id>/download/', views.document_download_view, name='document_download'),

    # 4. Global SaaS Reports & Analytics
    path('reports/', views.reports_view, name='reports'),
]
