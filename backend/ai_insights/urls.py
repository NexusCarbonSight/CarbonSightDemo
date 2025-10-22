from django.urls import path
from . import views

app_name = 'ai_insights'

urlpatterns = [
    # AI Recommendations
    path('recommendations/', views.CompanyAIRecommendationsView.as_view(), name='company-recommendations'),
    path('recommendations/<int:company_id>/', views.CompanyAIRecommendationsView.as_view(), name='company-recommendations-by-id'),
    
    # Emissions Analysis
    path('emissions-analysis/', views.EmissionsTrendAnalysisView.as_view(), name='emissions-analysis'),
    path('emissions-analysis/<int:company_id>/', views.EmissionsTrendAnalysisView.as_view(), name='emissions-analysis-by-id'),
    
    # Quick AI Insights (for demo)
    path('quick-insights/', views.QuickAIInsightsView.as_view(), name='quick-insights'),
]