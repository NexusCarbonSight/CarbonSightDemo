from django.db import models
from companies.models import Company

class ComplianceReport(models.Model):
    """Compliance reports submitted by companies"""
    
    STATUS_CHOICES = [
        ('compliant', 'Compliant'),
        ('needs_attention', 'Needs Attention'),
        ('non_compliant', 'Non-Compliant'),
        ('pending', 'Pending Review'),
    ]
    
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='compliance_reports')
    title = models.CharField(max_length=255)
    reporting_period_start = models.DateField()
    reporting_period_end = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    submitted_date = models.DateTimeField(auto_now_add=True)
    reviewed_date = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)
    document = models.FileField(upload_to='compliance_docs/', null=True, blank=True)
    
    class Meta:
        ordering = ['-submitted_date']
    
    def __str__(self):
        return f"{self.company.name} - {self.title}"


class Alert(models.Model):
    """Alerts for compliance issues or deadlines"""
    
    SEVERITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]
    
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='alerts')
    title = models.CharField(max_length=255)
    description = models.TextField()
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES)
    is_resolved = models.BooleanField(default=False)
    deadline = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.severity.upper()}: {self.title}"


class Recommendation(models.Model):
    """AI-powered recommendations for companies"""
    
    IMPACT_CHOICES = [
        ('low', 'Low Impact'),
        ('medium', 'Medium Impact'),
        ('high', 'High Impact'),
    ]
    
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='recommendations')
    title = models.CharField(max_length=255)
    description = models.TextField()
    impact = models.CharField(max_length=20, choices=IMPACT_CHOICES)
    category = models.CharField(max_length=100)  # e.g., "Efficiency", "Compliance", "Planning"
    action_text = models.CharField(max_length=255)
    is_implemented = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title
