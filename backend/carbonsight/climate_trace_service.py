"""
Climate Trace API Integration Service
Provides real-world emissions data from Climate TRACE for benchmarking and analysis
"""
import requests
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any

# Simple in-memory cache for development
_cache = {}

logger = logging.getLogger(__name__)

class ClimateTraceAPI:
    """Service for integrating with Climate Trace API"""
    
    BASE_URL = "https://api.climatetrace.org/v7"
    CACHE_TIMEOUT = 3600  # 1 hour cache
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'CarbonSight-App/1.0',
            'Accept': 'application/json'
        })
    
    def _make_request(self, endpoint: str, params: Dict[str, Any] = None) -> Optional[Dict]:
        """Make HTTP request to Climate TRACE API with caching"""
        cache_key = self._generate_cache_key(endpoint, params)
        cached_result = _cache.get(cache_key)
        
        if cached_result:
            logger.info(f"Cache hit for {endpoint}")
            return cached_result
        
        try:
            url = f"{self.BASE_URL}/{endpoint}"
            response = self.session.get(url, params=params or {}, timeout=30)
            response.raise_for_status()
            
            result = response.json()
            _cache[cache_key] = result
            logger.info(f"Successfully fetched and cached data from {endpoint}")
            return result
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Climate TRACE API request failed: {e}")
            return None
    
    def _generate_cache_key(self, endpoint: str, params: Dict[str, Any] = None) -> str:
        """Generate cache key for API request"""
        if params:
            param_str = "&".join([f"{k}={v}" for k, v in sorted(params.items())])
            return f"climate_trace_{endpoint.replace('/', '_')}_{param_str}"
        return f"climate_trace_{endpoint.replace('/', '_')}"
    
    def get_top_emissions_sources(self, 
                                year: int = 2024, 
                                gas: str = "co2e_100yr",
                                sectors: List[str] = None,
                                country_group: str = None,
                                limit: int = 100) -> List[Dict]:
        """Get top emissions sources ranked by emissions"""
        params = {
            'year': year,
            'gas': gas,
            'limit': limit,
            'offset': 0
        }
        
        if sectors:
            params['sectors'] = ','.join(sectors)
        if country_group:
            params['countryGroup'] = country_group
            
        result = self._make_request('sources', params)
        return result if result else []
    
    def get_source_details(self, 
                          source_id: int,
                          start_year: str = "2024",
                          end_year: str = "2024",
                          time_granularity: str = "year",
                          gas: str = "co2e_100yr") -> Optional[Dict]:
        """Get detailed data for a specific emissions source"""
        params = {
            'start': start_year,
            'end': end_year,
            'timeGranularity': time_granularity,
            'gas': gas
        }
        
        return self._make_request(f'sources/{source_id}', params)
    
    def get_louisiana_sources(self, year: int = 2024, limit: int = 50) -> List[Dict]:
        """Get emissions sources specifically for Louisiana"""
        # Get USA sources and filter for Louisiana-related facilities
        usa_sources = self.get_top_emissions_sources(
            year=year,
            country_group="USA",
            sectors=["oil-and-gas", "power", "manufacturing", "chemicals"],
            limit=200  # Get more sources to filter from
        )
        
        # Filter for Louisiana-specific sources
        louisiana_keywords = [
            "gulf coast", "louisiana", "baton rouge", "new orleans", 
            "lafayette", "shreveport", "lake charles", "monroe"
        ]
        
        louisiana_sources = []
        for source in usa_sources:
            name_lower = source.get('name', '').lower()
            if any(keyword in name_lower for keyword in louisiana_keywords):
                louisiana_sources.append(source)
        
        # If we don't find enough Louisiana-specific sources, 
        # include Gulf Coast sources as they include Louisiana facilities
        if len(louisiana_sources) < limit:
            for source in usa_sources:
                if len(louisiana_sources) >= limit:
                    break
                name_lower = source.get('name', '').lower()
                if 'gulf' in name_lower and source not in louisiana_sources:
                    louisiana_sources.append(source)
        
        return louisiana_sources[:limit]
    
    def get_sector_emissions(self, 
                           sectors: List[str],
                           year: int = 2024,
                           limit: int = 50) -> Dict[str, List[Dict]]:
        """Get emissions data organized by sector"""
        sector_data = {}
        
        for sector in sectors:
            sources = self.get_top_emissions_sources(
                year=year,
                sectors=[sector],
                limit=limit
            )
            sector_data[sector] = sources
            
        return sector_data
    
    def get_comparative_data(self, 
                           company_emissions: float,
                           sector: str = "oil-and-gas",
                           year: int = 2024) -> Dict:
        """Compare company emissions to industry benchmarks"""
        sources = self.get_top_emissions_sources(
            year=year,
            sectors=[sector],
            limit=100
        )
        
        if not sources:
            return {
                'rank': None,
                'percentile': None,
                'sector_average': None,
                'total_sources': 0
            }
        
        emissions_values = [s.get('emissionsQuantity', 0) for s in sources]
        emissions_values.sort(reverse=True)
        
        # Find where company would rank
        rank = 1
        for emission in emissions_values:
            if company_emissions >= emission:
                break
            rank += 1
        
        sector_average = sum(emissions_values) / len(emissions_values) if emissions_values else 0
        percentile = (len(emissions_values) - rank + 1) / len(emissions_values) * 100
        
        return {
            'rank': rank,
            'percentile': round(percentile, 1),
            'sector_average': round(sector_average, 2),
            'total_sources': len(sources),
            'top_10_average': sum(emissions_values[:10]) / 10 if len(emissions_values) >= 10 else sector_average
        }
    
    def get_regional_context(self, year: int = 2024) -> Dict:
        """Get regional emissions context for Louisiana/USA Gulf Coast"""
        # Get Louisiana-specific sources
        louisiana_sources = self.get_louisiana_sources(year=year, limit=50)
        
        # Also get broader USA context for comparison
        usa_sources = self.get_top_emissions_sources(
            year=year,
            country_group="USA",
            limit=100
        )
        
        if not louisiana_sources and not usa_sources:
            return {
                'total_sources': 0,
                'total_emissions': 0, 
                'average_emissions': 0,
                'louisiana_sources': [],
                'usa_context': {}
            }
        
        # Calculate Louisiana statistics
        la_total_emissions = sum(source.get('emissionsQuantity', 0) for source in louisiana_sources)
        la_avg_emissions = la_total_emissions / len(louisiana_sources) if louisiana_sources else 0
        
        # Calculate USA context for comparison
        usa_total_emissions = sum(source.get('emissionsQuantity', 0) for source in usa_sources)
        usa_avg_emissions = usa_total_emissions / len(usa_sources) if usa_sources else 0
        
        # Aggregate Louisiana sources by sector
        la_sectors = {}
        for source in louisiana_sources:
            sector = source.get('sector', 'unknown')
            emissions = source.get('emissionsQuantity', 0)
            
            if sector not in la_sectors:
                la_sectors[sector] = {'count': 0, 'total_emissions': 0}
            
            la_sectors[sector]['count'] += 1
            la_sectors[sector]['total_emissions'] += emissions
        
        return {
            'total_sources': len(louisiana_sources),
            'total_emissions': round(la_total_emissions, 2),
            'average_emissions': round(la_avg_emissions, 2),
            'louisiana_sources': louisiana_sources[:10],  # Top 10 for display
            'louisiana_sectors': la_sectors,
            'usa_context': {
                'total_sources': len(usa_sources),
                'total_emissions': round(usa_total_emissions, 2),
                'average_emissions': round(usa_avg_emissions, 2)
            },
            'year': year
        }
    
    def search_similar_facilities(self, 
                                facility_name: str,
                                sector: str = None,
                                limit: int = 10) -> List[Dict]:
        """Find facilities with similar names or characteristics"""
        params = {
            'limit': limit * 3,  # Get more results to filter
            'year': 2024
        }
        
        if sector:
            params['sectors'] = sector
            
        sources = self._make_request('sources', params)
        if not sources:
            return []
        
        # Simple name matching (in production, use more sophisticated matching)
        facility_words = facility_name.lower().split()
        matched_sources = []
        
        for source in sources:
            source_name = source.get('name', '').lower()
            # Check if any words from facility name appear in source name
            if any(word in source_name for word in facility_words):
                matched_sources.append(source)
                
        return matched_sources[:limit]


# Global instance
climate_trace_api = ClimateTraceAPI()