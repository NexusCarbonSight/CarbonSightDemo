from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import ComplianceReport, Alert, Recommendation
from .serializers import ComplianceReportSerializer, AlertSerializer, RecommendationSerializer

class ComplianceReportViewSet(viewsets.ModelViewSet):
    queryset = ComplianceReport.objects.all()
    serializer_class = ComplianceReportSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['company', 'status']
    ordering_fields = ['submitted_date', 'reviewed_date']

class AlertViewSet(viewsets.ModelViewSet):
    queryset = Alert.objects.all()
    serializer_class = AlertSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['company', 'severity', 'is_resolved']
    ordering_fields = ['created_at', 'deadline']

class RecommendationViewSet(viewsets.ModelViewSet):
    queryset = Recommendation.objects.all()
    serializer_class = RecommendationSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['company', 'impact', 'category', 'is_implemented']
    ordering_fields = ['created_at']
