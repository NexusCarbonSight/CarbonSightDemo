from django.contrib import admin
from .models import EmissionData, Activity

@admin.register(EmissionData)
class EmissionDataAdmin(admin.ModelAdmin):
    list_display = ['company', 'date', 'tons_co2_per_day', 'measurement_type']
    list_filter = ['measurement_type', 'date']
    search_fields = ['company__name']

@admin.register(Activity)
class ActivityAdmin(admin.ModelAdmin):
    list_display = ['company', 'title', 'activity_type', 'timestamp']
    list_filter = ['activity_type', 'timestamp']
    search_fields = ['company__name', 'title']
