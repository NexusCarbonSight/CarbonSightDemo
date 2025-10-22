from django.contrib import admin
from .models import Company, Facility

@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ['name', 'industry_sector', 'region', 'is_active', 'created_at']
    list_filter = ['industry_sector', 'region', 'is_active']
    search_fields = ['name', 'description']

@admin.register(Facility)
class FacilityAdmin(admin.ModelAdmin):
    list_display = ['name', 'company', 'facility_type', 'is_active']
    list_filter = ['facility_type', 'is_active']
    search_fields = ['name', 'company__name']
