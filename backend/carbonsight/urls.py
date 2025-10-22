"""
URL configuration for CarbonSight project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import climate_trace_views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/users/', include('users.urls')),
    path('api/companies/', include('companies.urls')),
    path('api/emissions/', include('emissions.urls')),
    path('api/compliance/', include('compliance.urls')),
    path('api/ai/', include('ai_insights.urls')),
    
    # Climate Trace API endpoints
    path('api/climate-trace/benchmarks/', climate_trace_views.get_industry_benchmarks, name='climate_trace_benchmarks'),
    path('api/climate-trace/regional/', climate_trace_views.get_regional_context, name='climate_trace_regional'),
    path('api/climate-trace/facility-insights/', climate_trace_views.get_facility_insights, name='climate_trace_facility'),
    path('api/climate-trace/sector-analysis/', climate_trace_views.get_sector_analysis, name='climate_trace_sectors'),
    path('api/climate-trace/public-data/', climate_trace_views.get_public_emissions_data, name='climate_trace_public'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
