from django.contrib import admin
from apps.core.models import LeadInquiry


@admin.register(LeadInquiry)
class LeadInquiryAdmin(admin.ModelAdmin):
    list_display = ('name', 'phone', 'company', 'status', 'source', 'created_at')
    list_filter = ('status', 'source', 'created_at')
    search_fields = ('name', 'phone', 'company', 'message')
    list_editable = ('status',)
    readonly_fields = ('created_at',)
