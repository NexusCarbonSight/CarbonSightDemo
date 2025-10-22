from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.http import JsonResponse
from companies.models import Company, Facility
from emissions.models import EmissionData
from compliance.models import ComplianceReport
from carbonsight.ai_service import CarbonSightAI
import logging

logger = logging.getLogger(__name__)

class CompanyAIRecommendationsView(APIView):
    """Generate AI-powered recommendations for a specific company"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, company_id=None):
        try:
            # Get company data
            if company_id:
                try:
                    company = Company.objects.get(id=company_id)
                except Company.DoesNotExist:
                    return Response(
                        {'error': 'Company not found'}, 
                        status=status.HTTP_404_NOT_FOUND
                    )
            else:
                # Get user's company if no specific company requested
                if hasattr(request.user, 'company') and request.user.company:
                    company = request.user.company
                else:
                    return Response(
                        {'error': 'No company specified and user not associated with company'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Prepare company data for AI analysis
            company_data = {
                'name': company.name,
                'industry': company.industry,
                'total_emissions': company.total_emissions,
                'facility_count': company.facility_set.count(),
                'compliance_rate': company.compliance_rate,
                'trend': 'increasing'  # This could be calculated from recent emissions data
            }
            
            # Generate AI recommendations
            ai_service = CarbonSightAI()
            recommendations = ai_service.generate_company_recommendations(company_data)
            
            return Response({
                'company': {
                    'id': company.id,
                    'name': company.name,
                    'industry': company.industry
                },
                'recommendations': recommendations,
                'generated_at': '2024-12-20T10:00:00Z'
            })
            
        except Exception as e:
            logger.error(f"Error generating AI recommendations: {str(e)}")
            return Response(
                {'error': 'Failed to generate recommendations'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class EmissionsTrendAnalysisView(APIView):
    """Analyze emissions trends using AI"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, company_id=None):
        try:
            # Get company
            if company_id:
                try:
                    company = Company.objects.get(id=company_id)
                except Company.DoesNotExist:
                    return Response(
                        {'error': 'Company not found'}, 
                        status=status.HTTP_404_NOT_FOUND
                    )
            else:
                if hasattr(request.user, 'company') and request.user.company:
                    company = request.user.company
                else:
                    return Response(
                        {'error': 'No company specified'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Get emissions data for the last 12 months
            emissions_data = EmissionData.objects.filter(
                company=company
            ).order_by('-date')[:365].values('date', 'co2_emissions', 'methane_emissions', 'other_emissions')
            
            # Format data for AI analysis
            formatted_data = []
            for emission in emissions_data:
                formatted_data.append({
                    'date': emission['date'].strftime('%Y-%m-%d'),
                    'total_emissions': (emission['co2_emissions'] or 0) + 
                                    (emission['methane_emissions'] or 0) + 
                                    (emission['other_emissions'] or 0)
                })
            
            # Generate AI analysis
            ai_service = CarbonSightAI()
            analysis = ai_service.analyze_emissions_trends(formatted_data)
            
            return Response({
                'company': {
                    'id': company.id,
                    'name': company.name
                },
                'analysis': analysis,
                'data_points': len(formatted_data),
                'generated_at': '2024-12-20T10:00:00Z'
            })
            
        except Exception as e:
            logger.error(f"Error analyzing emissions trends: {str(e)}")
            return Response(
                {'error': 'Failed to analyze emissions trends'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class QuickAIInsightsView(APIView):
    """Get quick AI insights for dashboard (public endpoint for demo)"""
    
    def get(self, request):
        """Return sample AI insights for demo purposes"""
        try:
            ai_service = CarbonSightAI()
            
            # Generate sample recommendations
            sample_company_data = {
                'name': 'Demo Company',
                'industry': 'Manufacturing',
                'total_emissions': 15000,
                'facility_count': 3,
                'compliance_rate': 85,
                'trend': 'stable'
            }
            
            recommendations = ai_service.generate_company_recommendations(sample_company_data)
            
            # Sample emissions analysis
            sample_emissions = [
                {'date': '2024-01-01', 'total_emissions': 1200},
                {'date': '2024-02-01', 'total_emissions': 1150},
                {'date': '2024-03-01', 'total_emissions': 1300}
            ]
            
            analysis = ai_service.analyze_emissions_trends(sample_emissions)
            
            return Response({
                'recommendations': recommendations[:3],  # Top 3 recommendations
                'trend_analysis': analysis.get('trend_analysis', ''),
                'key_insights': analysis.get('key_insights', [])[:2],  # Top 2 insights
                'ai_status': 'active',
                'generated_at': '2024-12-20T10:00:00Z'
            })
            
        except Exception as e:
            logger.error(f"Error generating quick AI insights: {str(e)}")
            return Response(
                {'error': 'Failed to generate AI insights'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
