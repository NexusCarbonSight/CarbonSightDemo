// HuggingFace Inference API service for AI-powered compliance recommendations

const HF_API_URL = 'https://api-inference.huggingface.co/models/';
const DEFAULT_MODEL = 'mistralai/Mistral-7B-Instruct-v0.2';

class HuggingFaceService {
  constructor(apiKey) {
    this.apiKey = apiKey || process.env.REACT_APP_HUGGINGFACE_API_KEY;
    this.model = process.env.REACT_APP_HF_MODEL || DEFAULT_MODEL;
  }

  async generateComplianceRecommendations(emissionsData, complianceTasks, facilities) {
    if (!this.apiKey) {
      console.warn('HuggingFace API key not configured');
      return this.getFallbackRecommendations(emissionsData);
    }

    try {
      const prompt = this.buildCompliancePrompt(emissionsData, complianceTasks, facilities);
      const response = await this.queryModel(prompt);
      return this.parseRecommendations(response);
    } catch (error) {
      console.error('HuggingFace API error:', error);
      return this.getFallbackRecommendations(emissionsData);
    }
  }

  buildCompliancePrompt(emissionsData, complianceTasks, facilities) {
    const totalEmissions = emissionsData?.reduce((sum, e) => sum + (e.tons_co2 || 0), 0) || 0;
    const avgEmissions = emissionsData?.length ? totalEmissions / emissionsData.length : 0;
    const pendingTasks = complianceTasks?.filter(t => t.status === 'pending' || t.status === 'in_progress').length || 0;
    const facilityCount = facilities?.length || 0;

    return `You are an expert environmental compliance advisor for industrial facilities in Louisiana. Based on the following data, provide 3 specific, actionable compliance recommendations:

Current Status:
- Average daily emissions: ${avgEmissions.toFixed(2)} tons CO2
- Total facilities: ${facilityCount}
- Pending compliance tasks: ${pendingTasks}
- Recent emissions trend: ${emissionsData?.length > 1 ? this.calculateTrend(emissionsData) : 'stable'}

Requirements:
1. Each recommendation must address specific Louisiana environmental regulations
2. Include estimated emissions reduction potential
3. Provide concrete implementation steps
4. Consider cost-effectiveness and timeline

Format each recommendation as:
TITLE: [Brief title]
IMPACT: [high/medium/low]
DESCRIPTION: [2-3 sentences describing the action and benefits]
REDUCTION: [Estimated tons CO2 reduction per year]
TIMELINE: [Implementation timeframe]
---

Generate 3 recommendations now:`;
  }

  calculateTrend(emissionsData) {
    if (!emissionsData || emissionsData.length < 2) return 'stable';
    const sorted = [...emissionsData].sort((a, b) => 
      new Date(a.measurement_date) - new Date(b.measurement_date)
    );
    const recent = sorted.slice(-5);
    const older = sorted.slice(-10, -5);
    
    const recentAvg = recent.reduce((sum, e) => sum + (e.tons_co2 || 0), 0) / recent.length;
    const olderAvg = older.length ? older.reduce((sum, e) => sum + (e.tons_co2 || 0), 0) / older.length : recentAvg;
    
    const change = ((recentAvg - olderAvg) / olderAvg) * 100;
    
    if (change > 5) return 'increasing';
    if (change < -5) return 'decreasing';
    return 'stable';
  }

  async queryModel(prompt, options = {}) {
    const response = await fetch(`${HF_API_URL}${this.model}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 800,
          temperature: 0.7,
          top_p: 0.95,
          do_sample: true,
          return_full_text: false,
          ...options
        }
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `HuggingFace API error: ${response.status}`);
    }

    const result = await response.json();
    return Array.isArray(result) ? result[0]?.generated_text : result.generated_text;
  }

  parseRecommendations(text) {
    if (!text) return this.getFallbackRecommendations();

    const recommendations = [];
    const blocks = text.split('---').filter(b => b.trim());

    blocks.forEach((block, idx) => {
      const lines = block.trim().split('\n').filter(l => l.trim());
      const rec = {
        id: `ai-rec-${Date.now()}-${idx}`,
        is_ai_generated: true,
        created_at: new Date().toISOString()
      };

      lines.forEach(line => {
        const [key, ...valueParts] = line.split(':');
        const value = valueParts.join(':').trim();
        
        switch (key.trim().toUpperCase()) {
          case 'TITLE':
            rec.title = value;
            break;
          case 'IMPACT':
            rec.impact = value.toLowerCase();
            break;
          case 'DESCRIPTION':
            rec.description = value;
            break;
          case 'REDUCTION':
            rec.estimated_reduction = parseFloat(value.replace(/[^0-9.]/g, '')) || null;
            break;
          case 'TIMELINE':
            rec.timeline = value;
            break;
          default:
            if (!rec.description && value) {
              rec.description = (rec.description || '') + ' ' + value;
            }
        }
      });

      if (rec.title && rec.description) {
        rec.category = this.categorizeRecommendation(rec);
        recommendations.push(rec);
      }
    });

    return recommendations.length > 0 ? recommendations : this.getFallbackRecommendations();
  }

  categorizeRecommendation(rec) {
    const text = (rec.title + ' ' + rec.description).toLowerCase();
    
    if (text.includes('energy') || text.includes('fuel') || text.includes('renewable')) {
      return 'Energy Efficiency';
    }
    if (text.includes('monitor') || text.includes('sensor') || text.includes('measure')) {
      return 'Monitoring';
    }
    if (text.includes('process') || text.includes('operation') || text.includes('optimize')) {
      return 'Process Optimization';
    }
    if (text.includes('report') || text.includes('compliance') || text.includes('regulatory')) {
      return 'Compliance';
    }
    return 'Operational';
  }

  getFallbackRecommendations(emissionsData = null) {
    return [
      {
        id: 'fallback-1',
        title: 'Implement Continuous Emissions Monitoring System (CEMS)',
        description: 'Deploy automated monitoring equipment to track real-time emissions and ensure compliance with Louisiana DEQ requirements. This provides accurate data for regulatory reporting and helps identify optimization opportunities.',
        impact: 'high',
        category: 'Monitoring',
        estimated_reduction: 500,
        timeline: '6-9 months',
        compliance_impact: 'Ensures compliance with LA DEQ Title V permit requirements',
        is_ai_generated: false
      },
      {
        id: 'fallback-2',
        title: 'Optimize Combustion Efficiency',
        description: 'Conduct regular tuning of combustion equipment and implement advanced control systems to reduce fuel consumption and emissions while maintaining production levels.',
        impact: 'medium',
        category: 'Process Optimization',
        estimated_reduction: 850,
        estimated_cost: 75000,
        timeline: '3-6 months',
        environmental_benefit: 'Reduces CO2 and criteria pollutants',
        is_ai_generated: false
      },
      {
        id: 'fallback-3',
        title: 'Schedule Preventive Maintenance Program',
        description: 'Establish a comprehensive maintenance schedule to prevent equipment degradation that can lead to increased emissions and potential compliance violations.',
        impact: 'medium',
        category: 'Operational',
        estimated_reduction: 300,
        timeline: '1-3 months',
        compliance_impact: 'Prevents excess emissions events and potential violations',
        is_ai_generated: false
      }
    ];
  }

  async generateChatResponse(message, context = {}) {
    if (!this.apiKey) {
      return this.getFallbackChatResponse(message, context);
    }

    try {
      const prompt = this.buildChatPrompt(message, context);
      const response = await this.queryModel(prompt, { max_new_tokens: 300 });
      return response || this.getFallbackChatResponse(message, context);
    } catch (error) {
      console.error('Chat generation error:', error);
      return this.getFallbackChatResponse(message, context);
    }
  }

  buildChatPrompt(message, context) {
    const {
      companyName = 'your company',
      emissionsRate,
      emissionsChange,
      facilities = [],
      complianceStatus,
      complianceTasks = [],
      recentActivities = [],
      recommendations = []
    } = context;

    // Build facility summary
    const facilitySummary = facilities.map(f => 
      `${f.name} (${f.emissionsPerDay?.toLocaleString() || 'N/A'} tons CO2/day, status: ${f.status})`
    ).join('; ');

    // Build task summary
    const taskSummary = complianceTasks.map(t => 
      `${t.title} (due: ${t.dueDate}, status: ${t.status})`
    ).join('; ');

    return `You are an AI compliance advisor for ${companyName}, an industrial facility in Louisiana. Answer the user's question based on their current operational data.

Company Data:
- Total emissions: ${emissionsRate?.toLocaleString() || 'N/A'} tons CO2/day (${emissionsChange > 0 ? '+' : ''}${emissionsChange}% vs target)
- Facilities: ${facilities.length} (${facilitySummary || 'No facilities'})
- Compliance rate: ${complianceStatus}%
- Active compliance tasks: ${complianceTasks.length} (${taskSummary || 'None'})
- AI recommendations active: ${recommendations.length}

User question: "${message}"

Provide a helpful, accurate response based on the company's actual data. Be specific with numbers and facility names. Keep response to 2-4 sentences.

Response:`;
  }

  getFallbackChatResponse(message, context = {}) {
    const lowerMsg = message.toLowerCase();
    const {
      companyName = 'your company',
      emissionsRate,
      emissionsChange,
      facilities = [],
      complianceStatus,
      complianceTasks = []
    } = context;
    
    if (lowerMsg.includes('emission') || lowerMsg.includes('co2')) {
      if (emissionsRate) {
        return `${companyName} is currently emitting ${emissionsRate.toLocaleString()} tons CO₂/day, which is ${Math.abs(emissionsChange)}% ${emissionsChange > 0 ? 'above' : 'below'} target. ${facilities.length > 0 ? `Your highest emitting facility is ${facilities[0].name} at ${facilities[0].emissionsPerDay?.toLocaleString()} tons/day.` : ''} I recommend focusing on process optimization and continuous monitoring.`;
      }
      return 'Based on your current data, I recommend focusing on process optimization and continuous monitoring to maintain compliance with Louisiana environmental regulations.';
    }
    
    if (lowerMsg.includes('compliance') || lowerMsg.includes('regulation') || lowerMsg.includes('deadline')) {
      if (complianceStatus && complianceTasks.length > 0) {
        const nextTask = complianceTasks[0];
        return `Your compliance rate is ${complianceStatus}%. You have ${complianceTasks.length} active tasks. Next deadline: ${nextTask.title} due ${nextTask.dueDate}. ${complianceTasks.filter(t => t.priority === 'urgent').length > 0 ? 'You have urgent tasks requiring immediate attention.' : ''}`;
      }
      return 'Your facility should ensure timely submission of required reports to Louisiana DEQ and maintain accurate emissions records. I can help identify upcoming deadlines and requirements.';
    }
    
    if (lowerMsg.includes('facility') || lowerMsg.includes('plant') || lowerMsg.includes('site')) {
      if (facilities.length > 0) {
        const optimal = facilities.filter(f => f.status === 'optimal').length;
        const needsAttention = facilities.filter(f => f.status !== 'optimal').length;
        const facilitiesList = facilities.map(f => `${f.name} (${f.status})`).join(', ');
        return `${companyName} operates ${facilities.length} facilities: ${facilitiesList}. ${optimal > 0 ? `${optimal} are performing optimally.` : ''} ${needsAttention > 0 ? `${needsAttention} need attention.` : ''}`;
      }
      return 'I can provide information about your facilities once the data is loaded.';
    }
    
    if (lowerMsg.includes('reduce') || lowerMsg.includes('optimize') || lowerMsg.includes('improve')) {
      return 'Consider implementing energy efficiency measures and optimizing combustion processes. These typically offer the best return on investment for emissions reduction. Review the AI-powered recommendations on your dashboard for specific actions tailored to your facilities.';
    }
    
    if (lowerMsg.includes('recommendation') || lowerMsg.includes('suggest')) {
      return 'Check the AI-Powered Recommendations section on your dashboard for specific, actionable recommendations based on your current emissions data and compliance status. Each recommendation includes estimated CO₂ reduction potential and implementation timeline.';
    }
    
    return `I can help you with emissions analysis, compliance tracking, facility performance, and operational recommendations for ${companyName}. What specific aspect would you like to explore?`;
  }
}

// Singleton instance
let hfServiceInstance = null;

export const getHuggingFaceService = () => {
  if (!hfServiceInstance) {
    hfServiceInstance = new HuggingFaceService();
  }
  return hfServiceInstance;
};

export default HuggingFaceService;
