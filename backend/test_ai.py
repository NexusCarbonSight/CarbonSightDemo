#!/usr/bin/env python3
"""
Test script for CarbonSight AI Integration
Tests the fallback chain: Ollama -> OpenAI -> Demo
"""

import os
import sys
import django
from pathlib import Path

# Add the backend directory to the Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'carbonsight.settings')
django.setup()

from carbonsight.ai_service import CarbonSightAI

def test_ai_service():
    print("🤖 Testing CarbonSight AI Service")
    print("=" * 50)
    
    ai = CarbonSightAI()
    
    # Test company recommendations
    print("\n📊 Testing Company Recommendations...")
    sample_company = {
        'name': 'Test Manufacturing Co',
        'industry': 'Manufacturing',
        'total_emissions': 15000,
        'facility_count': 3,
        'compliance_rate': 85,
        'trend': 'increasing'
    }
    
    try:
        recommendations = ai.generate_company_recommendations(sample_company)
        print(f"✅ Generated {len(recommendations)} recommendations")
        
        if recommendations:
            print(f"\n📋 Sample Recommendation:")
            rec = recommendations[0]
            print(f"  Title: {rec.get('title', 'N/A')}")
            print(f"  Impact: {rec.get('impact', 'N/A')}")
            print(f"  Description: {rec.get('description', 'N/A')[:100]}...")
        
    except Exception as e:
        print(f"❌ Error generating recommendations: {e}")
    
    # Test emissions analysis
    print(f"\n📈 Testing Emissions Analysis...")
    sample_emissions = [
        {'date': '2024-01-01', 'total_emissions': 1200},
        {'date': '2024-02-01', 'total_emissions': 1150},
        {'date': '2024-03-01', 'total_emissions': 1300}
    ]
    
    try:
        analysis = ai.analyze_emissions_trends(sample_emissions)
        print(f"✅ Generated emissions analysis")
        
        if analysis.get('trend_analysis'):
            print(f"  Trend: {analysis['trend_analysis'][:100]}...")
        
        if analysis.get('key_insights'):
            print(f"  Insights: {len(analysis['key_insights'])} key points")
            
    except Exception as e:
        print(f"❌ Error analyzing emissions: {e}")
    
    print(f"\n🎯 AI Provider Status:")
    print(f"  Ollama URL: {ai.ollama_url}")
    print(f"  Ollama Model: {ai.ollama_model}")
    print(f"  OpenAI Client: {'✅ Available' if ai.openai_client else '❌ Not configured'}")
    
    # Test Ollama connectivity
    import requests
    try:
        response = requests.get(f"{ai.ollama_url}/", timeout=2)
        print(f"  Ollama Server: {'✅ Running' if response.status_code == 200 else '❌ Not responding'}")
    except:
        print(f"  Ollama Server: ❌ Not running (start with 'ollama serve')")
    
    print(f"\n" + "=" * 50)
    print(f"🎉 AI Service Test Complete!")

if __name__ == "__main__":
    test_ai_service()