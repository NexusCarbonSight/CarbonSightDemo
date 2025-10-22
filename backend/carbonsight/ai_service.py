"""
AI Service for CarbonSight - Multi-provider AI integration (Ollama, OpenAI, Hugging Face)
Supports local models like Mistral 7B for free, offline AI recommendations
"""

import openai
import requests
from django.conf import settings
from decouple import config
import json
import logging
from typing import Dict, List, Any, Optional

logger = logging.getLogger(__name__)

class CarbonSightAI:
    def __init__(self):
        # AI Provider priority: Ollama (local) -> OpenAI -> Demo
        self.ollama_url = config('OLLAMA_URL', default='http://localhost:11434')
        self.ollama_model = config('OLLAMA_MODEL', default='mistral:7b')
        self.openai_client = None
        self.hf_api_key = config('HUGGINGFACE_API_KEY', default=None)
        
        # Initialize OpenAI if API key is available
        openai_key = config('OPENAI_API_KEY', default=None)
        if openai_key and openai_key != 'demo-key-not-set':
            self.openai_client = openai.OpenAI(api_key=openai_key)
            self.openai_model = "gpt-3.5-turbo"
    
    def _make_ollama_request(self, prompt: str) -> Optional[str]:
        """Make request to local Ollama (Mistral 7B)"""
        try:
            response = requests.post(
                f"{self.ollama_url}/api/generate",
                json={
                    "model": self.ollama_model,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.7,
                        "top_p": 0.9
                    }
                },
                timeout=30
            )
            if response.status_code == 200:
                result = response.json()
                return result.get('response', '')
            else:
                logger.warning(f"Ollama request failed with status {response.status_code}")
                return None
        except requests.exceptions.RequestException as e:
            logger.info(f"Ollama not available: {e}")
            return None
        except Exception as e:
            logger.warning(f"Ollama request failed: {e}")
            return None

    def _make_openai_request(self, messages: List[Dict], max_tokens: int = 800) -> Optional[str]:
        """Make request to OpenAI"""
        try:
            if not self.openai_client:
                return None
            
            response = self.openai_client.chat.completions.create(
                model=self.openai_model,
                messages=messages,
                max_tokens=max_tokens,
                temperature=0.7
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.warning(f"OpenAI API request failed: {e}")
            return None

    def _make_safe_request(self, messages: List[Dict], max_tokens: int = 800) -> Optional[str]:
        """Make AI request with fallback chain: Ollama -> OpenAI -> Demo"""
        prompt = messages[0].get('content', '') if messages else ''
        
        # Try Ollama (Mistral 7B) first - completely free and local!
        result = self._make_ollama_request(prompt)
        if result:
            logger.info("✅ Using Ollama (Mistral 7B) for AI response")
            return result
        
        # Fallback to OpenAI if available
        result = self._make_openai_request(messages, max_tokens)
        if result:
            logger.info("✅ Using OpenAI for AI response")
            return result
        
        # Final fallback to demo response
        logger.info("✅ Using demo response (no AI providers available)")
        return self._get_demo_response(prompt)
    
    def _get_demo_response(self, prompt: str) -> str:
        """Return demo responses when OpenAI API is not available"""
        if 'recommendations' in prompt.lower():
            return json.dumps([
                {
                    "title": "Optimize Transportation Fleet",
                    "description": "Switch to electric or hybrid vehicles for company fleet operations. This could reduce transportation emissions by up to 40%.",
                    "impact": "high",
                    "estimated_reduction": "1,200 tons CO2/year",
                    "implementation_time": "6-12 months",
                    "priority": 1
                },
                {
                    "title": "Implement Energy Management System",
                    "description": "Install smart energy monitoring across all facilities to identify and eliminate energy waste patterns.",
                    "impact": "medium",
                    "estimated_reduction": "800 tons CO2/year",
                    "implementation_time": "3-6 months",
                    "priority": 2
                },
                {
                    "title": "Renewable Energy Transition",
                    "description": "Switch to solar or wind energy sources for 60% of electricity needs at main facilities.",
                    "impact": "high",
                    "estimated_reduction": "2,100 tons CO2/year",
                    "implementation_time": "12-18 months",
                    "priority": 3
                }
            ])
        elif 'analysis' in prompt.lower():
            return json.dumps({
                "trend_analysis": "Emissions have increased by 12% over the past quarter, primarily due to increased production demand. However, efficiency per unit has improved by 8%.",
                "key_insights": [
                    "Peak emissions occur during Q2 and Q4 production cycles",
                    "Facility A contributes 45% of total emissions but only 30% of output",
                    "Energy consumption patterns show potential for 20% optimization"
                ],
                "recommendations": [
                    "Focus on Facility A efficiency improvements",
                    "Implement load balancing during peak periods",
                    "Consider carbon offset programs for unavoidable emissions"
                ],
                "risk_level": "medium",
                "compliance_status": "On track to meet 2024 targets with current improvements"
            })
        else:
            return json.dumps({
                "message": "AI analysis complete",
                "status": "success",
                "data": "Demo response - configure OPENAI_API_KEY for live AI insights"
            })
    
    def generate_company_recommendations(self, company_data: Dict) -> List[Dict]:
        """Generate AI-powered recommendations for a specific company"""
        prompt = f"""
        As an AI sustainability expert, analyze this company's emissions data and provide 3-5 specific, actionable recommendations to reduce carbon emissions.

        Company Data:
        - Company: {company_data.get('name', 'Unknown')}
        - Industry: {company_data.get('industry', 'General')}
        - Total Annual Emissions: {company_data.get('total_emissions', 0)} tons CO2
        - Number of Facilities: {company_data.get('facility_count', 0)}
        - Recent Emissions Trend: {company_data.get('trend', 'stable')}
        - Current Compliance Rate: {company_data.get('compliance_rate', 0)}%

        Provide recommendations in this JSON format:
        [{{
            "title": "Brief recommendation title",
            "description": "Detailed explanation of the recommendation",
            "impact": "high/medium/low",
            "estimated_reduction": "X tons CO2/year",
            "implementation_time": "timeframe",
            "priority": 1-5
        }}]

        Focus on practical, industry-specific solutions with measurable impact.
        """
        
        messages = [{"role": "user", "content": prompt}]
        response = self._make_safe_request(messages)
        
        try:
            recommendations = json.loads(response)
            return recommendations if isinstance(recommendations, list) else []
        except (json.JSONDecodeError, TypeError):
            logger.error(f"Failed to parse AI recommendations response: {response}")
            return json.loads(self._get_demo_response('recommendations'))
    
    def analyze_emissions_trends(self, emissions_data: List[Dict]) -> Dict:
        """Analyze emissions trends and provide insights"""
        prompt = f"""
        As an AI environmental analyst, analyze this emissions data and provide insights.

        Emissions Data (last 12 months):
        {json.dumps(emissions_data[-12:], indent=2)}

        Provide analysis in this JSON format:
        {{
            "trend_analysis": "Overall trend description",
            "key_insights": ["insight 1", "insight 2", "insight 3"],
            "recommendations": ["recommendation 1", "recommendation 2"],
            "risk_level": "low/medium/high",
            "compliance_status": "status description"
        }}

        Focus on trends, seasonality, risks, and opportunities for improvement.
        """
        
        messages = [{"role": "user", "content": prompt}]
        response = self._make_safe_request(messages)
        
        try:
            analysis = json.loads(response)
            return analysis if isinstance(analysis, dict) else {}
        except (json.JSONDecodeError, TypeError):
            logger.error(f"Failed to parse AI analysis response: {response}")
            return json.loads(self._get_demo_response('analysis'))
    
    def generate_compliance_insights(self, company_id: int, compliance_data: Dict) -> Dict:
        """Generate AI insights for compliance reporting"""
        prompt = f"""
        As an AI compliance expert, analyze this company's compliance data and provide insights.

        Compliance Data:
        - Compliance Rate: {compliance_data.get('compliance_rate', 0)}%
        - Recent Reports: {compliance_data.get('recent_reports', 0)}
        - Outstanding Issues: {compliance_data.get('issues', 0)}
        - Regulatory Framework: {compliance_data.get('framework', 'Standard')}

        Provide insights in JSON format:
        {{
            "compliance_score": 1-100,
            "risk_areas": ["area 1", "area 2"],
            "action_items": ["action 1", "action 2"],
            "next_deadlines": ["deadline 1", "deadline 2"],
            "recommendations": "Overall compliance recommendations"
        }}
        """
        
        messages = [{"role": "user", "content": prompt}]
        response = self._make_safe_request(messages)
        
        try:
            insights = json.loads(response)
            return insights if isinstance(insights, dict) else {}
        except (json.JSONDecodeError, TypeError):
            logger.error(f"Failed to parse AI compliance insights: {response}")
            return {
                "compliance_score": 85,
                "risk_areas": ["Quarterly reporting", "Facility monitoring"],
                "action_items": ["Submit Q4 report", "Update monitoring systems"],
                "next_deadlines": ["Dec 31, 2024", "Jan 15, 2025"],
                "recommendations": "Overall compliance is good. Focus on timely reporting and facility monitoring improvements."
            }