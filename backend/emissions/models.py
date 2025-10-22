from django.db import models
from companies.models import Company, Facility

class EmissionData(models.Model):
    """Daily emissions data for companies"""
    
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='emissions')
    facility = models.ForeignKey(Facility, on_delete=models.CASCADE, null=True, blank=True, related_name='emissions')
    date = models.DateField()
    tons_co2_per_day = models.DecimalField(max_digits=12, decimal_places=2)
    measurement_type = models.CharField(max_length=50, default='actual')  # actual, estimated
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name_plural = 'Emission Data'
        ordering = ['-date']
        unique_together = ['company', 'date']
    
    def __str__(self):
        return f"{self.company.name} - {self.date}: {self.tons_co2_per_day} tons"


class Activity(models.Model):
    """Activity log for tracking company actions"""
    
    ACTIVITY_TYPES = [
        ('report_submitted', 'Report Submitted'),
        ('data_uploaded', 'Data Uploaded'),
        ('compliance_updated', 'Compliance Updated'),
        ('deadline_added', 'Deadline Added'),
        ('maintenance_scheduled', 'Maintenance Scheduled'),
    ]
    
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='activities')
    user = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True)
    activity_type = models.CharField(max_length=50, choices=ACTIVITY_TYPES)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name_plural = 'Activities'
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.company.name} - {self.title}"
