from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import EmissionData, Activity
from .serializers import EmissionDataSerializer, ActivitySerializer

class EmissionDataViewSet(viewsets.ModelViewSet):
    queryset = EmissionData.objects.all()
    serializer_class = EmissionDataSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['company', 'facility', 'date', 'measurement_type']
    ordering_fields = ['date', 'tons_co2_per_day']

class ActivityViewSet(viewsets.ModelViewSet):
    queryset = Activity.objects.all()
    serializer_class = ActivitySerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['company', 'activity_type']
    ordering_fields = ['timestamp']
