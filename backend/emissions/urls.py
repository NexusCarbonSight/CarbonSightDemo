from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EmissionDataViewSet, ActivityViewSet

router = DefaultRouter()
router.register(r'data', EmissionDataViewSet)
router.register(r'activities', ActivityViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
