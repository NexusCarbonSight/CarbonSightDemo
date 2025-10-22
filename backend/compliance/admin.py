from django.contrib import admin
from .models import ComplianceReport, Alert, Recommendation

@admin.register(ComplianceReport)
class ComplianceReportAdmin(admin.ModelAdmin):
    list_display = ['company', 'title', 'status', 'submitted_date']
    list_filter = ['status', 'submitted_date']
    search_fields = ['company__name', 'title']

@admin.register(Alert)
class AlertAdmin(admin.ModelAdmin):
    list_display = ['company', 'title', 'severity', 'is_resolved', 'deadline']
    list_filter = ['severity', 'is_resolved']
    search_fields = ['company__name', 'title']

@admin.register(Recommendation)
class RecommendationAdmin(admin.ModelAdmin):
    list_display = ['company', 'title', 'impact', 'category', 'is_implemented']
    list_filter = ['impact', 'category', 'is_implemented']
    search_fields = ['company__name', 'title']
