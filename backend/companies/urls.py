from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CompanyViewSet, FacilityViewSet

router = DefaultRouter()
router.register(r'', CompanyViewSet)
router.register(r'facilities', FacilityViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
