"""
Climate Trace API Views
Expose Climate Trace data through Django REST API endpoints
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .climate_trace_service import climate_trace_api
import logging

logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_industry_benchmarks(request):
    """Get industry benchmark data for comparison"""
    try:
        # Get company's sector from request or default
        sector = request.GET.get('sector', 'oil-and-gas')
        year = int(request.GET.get('year', 2024))
        company_emissions = float(request.GET.get('emissions', 0))
        
        # Get top sources in sector
        top_sources = climate_trace_api.get_top_emissions_sources(
            year=year,
            sectors=[sector],
            limit=50
        )
        
        # Get comparative analysis
        comparison = climate_trace_api.get_comparative_data(
            company_emissions=company_emissions,
            sector=sector,
            year=year
        )
        
        return Response({
            'sector': sector,
            'year': year,
            'comparison': comparison,
            'top_sources': top_sources[:10],  # Return top 10 for display
            'total_sources_analyzed': len(top_sources)
        })
        
    except Exception as e:
        logger.error(f"Error fetching industry benchmarks: {e}")
        return Response(
            {'error': 'Failed to fetch industry benchmark data'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_regional_context(request):
    """Get regional emissions context for Louisiana/USA"""
    try:
        year = int(request.GET.get('year', 2024))
        regional_data = climate_trace_api.get_regional_context(year=year)
        
        return Response({
            'regional_context': regional_data,
            'louisiana_sources': climate_trace_api.get_louisiana_sources(year=year, limit=20)
        })
        
    except Exception as e:
        logger.error(f"Error fetching regional context: {e}")
        return Response(
            {'error': 'Failed to fetch regional context data'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_facility_insights(request):
    """Get insights about specific facility or find similar facilities"""
    try:
        facility_name = request.GET.get('name', '')
        sector = request.GET.get('sector', 'oil-and-gas')
        
        if not facility_name:
            return Response(
                {'error': 'Facility name is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Find similar facilities
        similar_facilities = climate_trace_api.search_similar_facilities(
            facility_name=facility_name,
            sector=sector,
            limit=10
        )
        
        return Response({
            'facility_name': facility_name,
            'similar_facilities': similar_facilities,
            'sector': sector
        })
        
    except Exception as e:
        logger.error(f"Error fetching facility insights: {e}")
        return Response(
            {'error': 'Failed to fetch facility insights'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_sector_analysis(request):
    """Get comprehensive sector analysis"""
    try:
        sectors = request.GET.getlist('sectors') or ['oil-and-gas', 'power', 'manufacturing', 'chemicals']
        year = int(request.GET.get('year', 2024))
        
        sector_data = climate_trace_api.get_sector_emissions(
            sectors=sectors,
            year=year,
            limit=20
        )
        
        # Calculate sector statistics
        sector_stats = {}
        for sector, sources in sector_data.items():
            if sources:
                emissions = [s.get('emissionsQuantity', 0) for s in sources]
                sector_stats[sector] = {
                    'total_sources': len(sources),
                    'total_emissions': sum(emissions),
                    'average_emissions': sum(emissions) / len(emissions) if emissions else 0,
                    'max_emissions': max(emissions) if emissions else 0,
                    'top_emitter': sources[0] if sources else None
                }
            else:
                sector_stats[sector] = {
                    'total_sources': 0,
                    'total_emissions': 0,
                    'average_emissions': 0,
                    'max_emissions': 0,
                    'top_emitter': None
                }
        
        return Response({
            'sectors': sectors,
            'year': year,
            'sector_data': sector_data,
            'sector_statistics': sector_stats
        })
        
    except Exception as e:
        logger.error(f"Error fetching sector analysis: {e}")
        return Response(
            {'error': 'Failed to fetch sector analysis'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
def get_public_emissions_data(request):
    """Get public emissions data (no authentication required)"""
    try:
        year = int(request.GET.get('year', 2024))
        limit = min(int(request.GET.get('limit', 20)), 100)  # Max 100
        
        # Get top USA sources for public display
        top_sources = climate_trace_api.get_top_emissions_sources(
            year=year,
            country_group="USA",
            limit=limit
        )
        
        return Response({
            'year': year,
            'top_sources': top_sources,
            'data_source': 'Climate TRACE',
            'description': 'Top emissions sources in the United States'
        })
        
    except Exception as e:
        logger.error(f"Error fetching public emissions data: {e}")
        return Response(
            {'error': 'Failed to fetch emissions data'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )