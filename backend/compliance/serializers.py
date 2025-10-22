from rest_framework import serializers
from .models import ComplianceReport, Alert, Recommendation

class ComplianceReportSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True)
    
    class Meta:
        model = ComplianceReport
        fields = '__all__'

class AlertSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True)
    
    class Meta:
        model = Alert
        fields = '__all__'

class RecommendationSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True)
    
    class Meta:
        model = Recommendation
        fields = '__all__'
