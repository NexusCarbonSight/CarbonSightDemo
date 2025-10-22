from django.db import models

class Company(models.Model):
    """Industrial facility/company model"""
    
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    industry_sector = models.CharField(max_length=100)
    address = models.TextField()
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=2, default='LA')
    zip_code = models.CharField(max_length=10)
    region = models.CharField(max_length=100)  # e.g., Baton Rouge, Lake Charles
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    website = models.URLField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name_plural = 'Companies'
        ordering = ['name']
    
    def __str__(self):
        return self.name
    
    @property
    def total_emissions(self):
        """Calculate total emissions for the company"""
        from emissions.models import EmissionData
        total = EmissionData.objects.filter(company=self).aggregate(
            models.Sum('tons_co2_per_day')
        )['tons_co2_per_day__sum']
        return total or 0
    
    @property
    def compliance_rate(self):
        """Calculate compliance rate percentage"""
        from compliance.models import ComplianceReport
        reports = ComplianceReport.objects.filter(company=self)
        if not reports.exists():
            return 100
        compliant = reports.filter(status='compliant').count()
        return round((compliant / reports.count()) * 100, 2)


class Facility(models.Model):
    """Individual facility belonging to a company"""
    
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='facilities')
    name = models.CharField(max_length=255)
    facility_type = models.CharField(max_length=100)  # e.g., Plant, Refinery
    capacity = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    capacity_unit = models.CharField(max_length=50, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name_plural = 'Facilities'
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} - {self.company.name}"
