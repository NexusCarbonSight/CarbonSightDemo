from rest_framework import serializers
from .models import Company, Facility

class FacilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Facility
        fields = '__all__'

class CompanySerializer(serializers.ModelSerializer):
    facilities = FacilitySerializer(many=True, read_only=True)
    total_emissions = serializers.ReadOnlyField()
    compliance_rate = serializers.ReadOnlyField()
    
    class Meta:
        model = Company
        fields = [
            'id', 'name', 'description', 'industry_sector', 'address',
            'city', 'state', 'zip_code', 'region', 'phone', 'email',
            'website', 'is_active', 'facilities', 'total_emissions',
            'compliance_rate', 'created_at', 'updated_at'
        ]
