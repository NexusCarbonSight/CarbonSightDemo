from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ComplianceReportViewSet, AlertViewSet, RecommendationViewSet

router = DefaultRouter()
router.register(r'reports', ComplianceReportViewSet)
router.register(r'alerts', AlertViewSet)
router.register(r'recommendations', RecommendationViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
