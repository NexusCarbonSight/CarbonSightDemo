import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './CompanyDashboard.css';
import ClimateTraceData from '../components/ClimateTraceData';

function CompanyDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [aiInsights, setAiInsights] = useState({});
  const [aiLoading, setAiLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { type: 'ai', text: 'Hello! I\'m your AI assistant. I can help you with emissions analysis, compliance recommendations, and operational insights. What would you like to know?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([
    { name: 'Q3_Emissions_Report.pdf', type: 'compliance', date: '2024-10-15', status: 'approved' },
    { name: 'Plant_C_Maintenance_Log.xlsx', type: 'maintenance', date: '2024-10-18', status: 'under_review' }
  ]);
  const [activeTab, setActiveTab] = useState('overview');
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);

  // Louisiana-specific hardcoded data for Sasol Chemicals
  const dashboardData = {
    company: 'Sasol Chemicals (Louisiana)',
    location: 'Lake Charles, Louisiana',
    industry: 'Chemical Manufacturing / Petrochemicals',
    emissionsRate: 360333,
    emissionsChange: 12,
    areasAffected: 3,
    optimalFacilities: 2,
    attentionFacilities: 1,
    complianceStatus: 94,
    complianceDeadline: 'Jan 15',
    activeTasks: 7,
    urgentTasks: 2,
    normalTasks: 5,

    // Louisiana Facilities Data
    facilities: [
      {
        id: 1,
        name: 'Lake Charles Complex',
        location: 'Westlake, LA 70669',
        address: '1 Sasol Place, Westlake, LA 70669',
        parish: 'Calcasieu',
        lat: 30.2488,
        lng: -93.2652,
        emissionsPerDay: 180500,
        emissionsChange: -8,
        status: 'optimal',
        employees: 1200,
        operationalSince: 2014,
        primaryProducts: ['Ethylene', 'Propylene', 'Mixed Alcohols'],
        capacity: '1.5M tons/year',
        nearbyZipCodes: ['70669', '70611', '70605'],
        environmentalImpact: 'Moderate - Active monitoring of nearby communities',
        airQualityIndex: 45
      },
      {
        id: 2,
        name: 'Westlake Facility',
        location: 'Westlake, LA 70669',
        address: '3350 Highway 108, Westlake, LA 70669',
        parish: 'Calcasieu',
        lat: 30.2350,
        lng: -93.2700,
        emissionsPerDay: 145200,
        emissionsChange: -15,
        status: 'optimal',
        employees: 850,
        operationalSince: 2016,
        primaryProducts: ['Linear Alpha Olefins', 'Detergent Alcohols'],
        capacity: '1.2M tons/year',
        nearbyZipCodes: ['70669', '70615'],
        environmentalImpact: 'Low - Best-in-class emissions control',
        airQualityIndex: 38
      },
      {
        id: 3,
        name: 'Sulfur Operations',
        location: 'Westlake, LA 70669',
        address: '1 Sulfur Road, Westlake, LA 70669',
        parish: 'Calcasieu',
        lat: 30.2400,
        lng: -93.2600,
        emissionsPerDay: 34633,
        emissionsChange: 5,
        status: 'needs_attention',
        employees: 320,
        operationalSince: 2015,
        primaryProducts: ['Sulfur', 'Sulfuric Acid'],
        capacity: '500K tons/year',
        nearbyZipCodes: ['70669'],
        environmentalImpact: 'Elevated - Recent increase requires investigation',
        airQualityIndex: 62
      }
    ],

    // Louisiana Compliance Tasks
    complianceTasks: [
      {
        id: 1,
        title: 'Q4 2024 Air Emissions Report',
        regulation: 'Louisiana DEQ - LAC 33:III.Chapter 5',
        dueDate: 'Jan 15, 2025',
        status: 'in_progress',
        priority: 'urgent',
        assignedTo: 'Environmental Compliance Team',
        completionPercent: 75,
        requirements: ['Emissions data compilation', 'Third-party verification', 'DEQ submission portal upload']
      },
      {
        id: 2,
        title: 'Title V Operating Permit Renewal',
        regulation: 'EPA Clean Air Act Title V',
        dueDate: 'Feb 1, 2025',
        status: 'in_progress',
        priority: 'urgent',
        assignedTo: 'Regulatory Affairs',
        completionPercent: 60,
        requirements: ['Updated facility diagrams', 'Emissions modeling report', 'Public notice documentation']
      },
      {
        id: 3,
        title: 'Louisiana DEQ Annual Operating Fee',
        regulation: 'LAC 33:III.502',
        dueDate: 'Mar 31, 2025',
        status: 'pending',
        priority: 'normal',
        assignedTo: 'Finance Department',
        completionPercent: 0,
        requirements: ['Fee calculation worksheet', 'Payment authorization', 'Proof of payment']
      },
      {
        id: 4,
        title: 'EPA Greenhouse Gas Reporting',
        regulation: '40 CFR Part 98',
        dueDate: 'Mar 31, 2025',
        status: 'pending',
        priority: 'normal',
        assignedTo: 'Environmental Compliance Team',
        completionPercent: 25,
        requirements: ['GHG emissions calculation', 'e-GGRT system entry', 'XML file submission']
      },
      {
        id: 5,
        title: 'Sulfur Operations Stack Testing',
        regulation: 'Louisiana DEQ Air Permit Condition 4.2',
        dueDate: 'Apr 15, 2025',
        status: 'scheduled',
        priority: 'normal',
        assignedTo: 'Sulfur Operations Manager',
        completionPercent: 10,
        requirements: ['Third-party testing contractor', 'Pre-test protocol', 'Stack test report']
      },
      {
        id: 6,
        title: 'Stormwater Pollution Prevention Plan Update',
        regulation: 'Louisiana Pollutant Discharge Elimination System',
        dueDate: 'May 1, 2025',
        status: 'pending',
        priority: 'normal',
        assignedTo: 'EHS Team',
        completionPercent: 0,
        requirements: ['Site inspection', 'SWPPP revision', 'Training documentation']
      }
    ],

    activities: [
      { title: 'Lake Charles Complex emissions data uploaded to Louisiana DEQ portal', time: '2 hours ago', type: 'success' },
      { title: 'Westlake Facility - Monthly monitoring report approved', time: '5 hours ago', type: 'success' },
      { title: 'Title V permit renewal documentation submitted', time: '1 day ago', type: 'info' },
      { title: 'Sulfur Operations - Elevated emissions alert triggered', time: '2 days ago', type: 'warning' },
      { title: 'EPA Region 6 inspection scheduled for Lake Charles Complex', time: '3 days ago', type: 'info' }
    ],

    tasks: [
      {
        id: 1,
        title: 'Submit Q4 2024 Emissions Report to Louisiana DEQ',
        description: 'Quarterly air emissions report required under LAC 33:III.Chapter 5',
        priority: 'urgent',
        due: 'Jan 15, 2025',
        status: 'pending',
        category: 'compliance',
        facility: 'All Facilities'
      },
      {
        id: 2,
        title: 'Sulfur Operations Emissions Investigation',
        description: 'Investigate 5% increase in emissions at Sulfur Operations facility',
        priority: 'urgent',
        due: 'Nov 10, 2024',
        status: 'pending',
        category: 'maintenance',
        facility: 'Sulfur Operations'
      },
      {
        id: 3,
        title: 'Review EPA Region 6 Guidance Update',
        description: 'New EPA guidance for petrochemical facilities in Louisiana',
        priority: 'normal',
        due: 'Dec 1, 2024',
        status: 'pending',
        category: 'compliance',
        facility: 'All Facilities'
      },
      {
        id: 4,
        title: 'Lake Charles Complex Efficiency Audit',
        description: 'Implement recommendations from recent energy efficiency audit',
        priority: 'normal',
        due: 'Nov 30, 2024',
        status: 'pending',
        category: 'optimization',
        facility: 'Lake Charles Complex'
      },
      {
        id: 5,
        title: 'Hurricane Season Emergency Response Training',
        description: 'Annual Gulf Coast hurricane preparedness and emergency response training',
        priority: 'normal',
        due: 'Dec 15, 2024',
        status: 'pending',
        category: 'training',
        facility: 'All Facilities'
      },
      {
        id: 6,
        title: 'Westlake Facility Sensor Calibration',
        description: 'Quarterly calibration of CEMS (Continuous Emissions Monitoring System)',
        priority: 'normal',
        due: 'Dec 20, 2024',
        status: 'pending',
        category: 'maintenance',
        facility: 'Westlake Facility'
      },
      {
        id: 7,
        title: 'Community Engagement Meeting - Calcasieu Parish',
        description: 'Quarterly community meeting with local residents and parish officials',
        priority: 'normal',
        due: 'Jan 5, 2025',
        status: 'pending',
        category: 'community',
        facility: 'All Facilities'
      }
    ],

    recommendations: [
      {
        title: 'Optimize Transportation Fleet',
        description: 'Transition to hybrid and electric vehicles for on-site transportation and material delivery. Analysis shows significant potential for emissions reduction through fleet modernization, including replacing diesel trucks with electric alternatives and implementing route optimization software.',
        impact: 'high',
        category: 'Transportation',
        action: '1,200 tons CO₂/year',
        facility: 'All Facilities',
        detailedSteps: [
          'Conduct comprehensive fleet audit to identify high-emission vehicles for replacement',
          'Evaluate electric and hybrid vehicle options suitable for chemical facility operations',
          'Install EV charging infrastructure at Lake Charles Complex and Westlake Facility',
          'Implement route optimization software to reduce fuel consumption',
          'Train drivers on eco-driving techniques and new vehicle technology',
          'Establish partnership with local EV dealers for maintenance support'
        ],
        timeline: '6-12 months',
        estimatedCost: '$150,000 - $300,000',
        expectedBenefit: '40% reduction in fleet emissions',
        complianceImpact: 'This initiative directly supports Louisiana\'s Clean Energy Initiative and positions Sasol Chemicals as a leader in sustainable operations. The fleet modernization will contribute to meeting EPA greenhouse gas reporting requirements under 40 CFR Part 98, potentially qualifying the company for state-level green energy incentives. Additionally, reduced emissions from transportation will help maintain compliance with Louisiana DEQ air quality standards in Calcasieu Parish, demonstrating corporate responsibility to local communities and regulators.',
        environmentalBenefit: 'Fleet optimization will eliminate approximately 1,200 tons of CO₂ emissions annually, equivalent to removing 260 passenger vehicles from the road. Beyond carbon reduction, the transition to electric vehicles will significantly decrease nitrogen oxide (NOx) and particulate matter emissions in the Lake Charles area, improving local air quality for nearby communities in ZIP codes 70669, 70611, and 70605. This initiative also reduces noise pollution and demonstrates Sasol\'s commitment to environmental stewardship in the Gulf Coast region.'
      },
      {
        title: 'Implement Energy Management System',
        description: 'Deploy an advanced Energy Management System (EMS) with real-time monitoring and AI-powered optimization across all facilities. The system will identify energy waste, optimize equipment scheduling, and provide actionable insights for reducing electricity and natural gas consumption.',
        impact: 'medium',
        category: 'Energy Efficiency',
        action: '800 tons CO₂/year',
        facility: 'Lake Charles Complex',
        detailedSteps: [
          'Select and procure enterprise-grade Energy Management System platform',
          'Install IoT sensors and smart meters across critical equipment and processes',
          'Integrate EMS with existing SCADA and plant control systems',
          'Configure AI algorithms for predictive energy optimization',
          'Establish baseline energy consumption metrics for all operations',
          'Train operations and maintenance staff on EMS dashboard and analytics',
          'Implement automated alerts for energy anomalies and optimization opportunities'
        ],
        timeline: '8-10 months',
        estimatedCost: '$200,000 - $400,000',
        expectedBenefit: '12-15% reduction in energy costs',
        complianceImpact: 'Implementation of an Energy Management System aligns with EPA Energy Star certification requirements and supports compliance with Louisiana Act 517 promoting industrial energy efficiency. The EMS will provide detailed documentation of energy consumption patterns, which is valuable for regulatory reporting under Louisiana DEQ\'s emissions inventory requirements. Real-time monitoring capabilities will enable faster response to potential permit exceedances, reducing the risk of violations and demonstrating proactive environmental management to state and federal regulators.',
        environmentalBenefit: 'The Energy Management System will reduce annual CO₂ emissions by approximately 800 tons through optimized energy consumption and reduced waste. By identifying and eliminating inefficiencies in steam generation, compressed air systems, and process heating, the facility will significantly decrease its carbon footprint while lowering operational costs. The system\'s predictive capabilities will prevent energy spikes that contribute to grid stress during peak demand periods, supporting regional energy stability. This initiative showcases how technology-driven solutions can achieve both environmental and economic benefits in petrochemical operations.'
      },
      {
        title: 'Renewable Energy Transition',
        description: 'Develop on-site renewable energy generation through solar panel installation and explore partnership opportunities for wind energy procurement. This comprehensive approach includes rooftop and ground-mounted solar arrays, combined with renewable energy credits (RECs) to offset remaining fossil fuel consumption.',
        impact: 'high',
        category: 'Renewable Energy',
        action: '2,100 tons CO₂/year',
        facility: 'Westlake Facility',
        detailedSteps: [
          'Conduct solar feasibility study for available roof and land space at Westlake Facility',
          'Engage renewable energy consultants to design optimal solar array configuration',
          'Secure permits and approvals from Louisiana Public Service Commission',
          'Install 2MW solar photovoltaic system on warehouse rooftops and available land',
          'Establish power purchase agreement (PPA) with regional wind energy provider',
          'Integrate renewable energy sources with existing electrical infrastructure',
          'Implement battery storage system for energy resilience during grid disruptions',
          'Monitor and report renewable energy generation through dedicated dashboard'
        ],
        timeline: '12-18 months',
        estimatedCost: '$1,500,000 - $2,200,000',
        expectedBenefit: '18% of facility energy from renewables',
        complianceImpact: 'The renewable energy transition strongly supports Louisiana\'s commitment to the Climate Action Plan and positions Sasol Chemicals favorably for future carbon pricing mechanisms. Installation of on-site solar generation demonstrates compliance with evolving corporate sustainability reporting standards (GRI, CDP, TCFD) increasingly required by investors and stakeholders. This initiative may qualify the facility for federal Investment Tax Credits (ITC) and Louisiana\'s renewable energy incentive programs, while also contributing to the company\'s Scope 2 emissions reduction targets under EPA greenhouse gas reporting requirements. The project enhances regulatory standing and builds goodwill with Louisiana DEQ.',
        environmentalBenefit: 'Renewable energy implementation will eliminate approximately 2,100 tons of CO₂ emissions annually, representing the largest single carbon reduction initiative among the three recommendations. The 2MW solar installation will generate clean electricity equivalent to powering 300 homes, while reducing reliance on fossil fuel-based grid power during Louisiana\'s peak summer months. This transition supports regional air quality improvements by decreasing demand on natural gas power plants, which are significant sources of NOx and SO₂ emissions. Furthermore, the project demonstrates industrial leadership in renewable energy adoption and serves as a model for other petrochemical facilities in the Gulf Coast region, contributing to broader climate change mitigation efforts.'
      }
    ]
  };

  // Fetch AI recommendations
  const fetchAIInsights = async () => {
    setAiLoading(true);
    try {
      // Use hardcoded recommendations instead of API call
      // This ensures all modal data (timeline, cost, benefit, compliance, environmental) is populated
      setAiRecommendations(dashboardData.recommendations);
      setAiInsights({
        trendAnalysis: null,
        keyInsights: []
      });
    } catch (error) {
      console.error('Failed to fetch AI insights:', error);
      // Fallback to existing static recommendations
      setAiRecommendations(dashboardData.recommendations);
    } finally {
      setAiLoading(false);
    }
  };

  // Handle recommendation action - opens detailed modal
  const handleRecommendationAction = (recommendation) => {
    setSelectedRecommendation(recommendation);
  };

  // Handle metric card clicks for navigation
  const handleEmissionsClick = () => {
    setCurrentView('emissions');
  };

  const handleFacilitiesClick = () => {
    setCurrentView('facilities');
  };

  const handleComplianceClick = () => {
    setCurrentView('compliance');
  };

  const handleTasksClick = () => {
    setActiveTab('tasks');
    setCurrentView('dashboard');
  };

  // Handle task actions
  const handleTaskAction = (task) => {
    if (task.category === 'compliance') {
      setShowDocumentUpload(true);
    } else {
      alert(`Working on task: ${task.title}\n\nThis would normally open a detailed task workflow.`);
    }
  };

  const handleCompleteTask = (taskId) => {
    alert(`Task ${taskId} marked as complete!\n\nThis would normally update the task status in the database.`);
  };

  // Handle document upload
  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const newFiles = files.map(file => ({
      name: file.name,
      type: 'compliance',
      date: new Date().toISOString().split('T')[0],
      status: 'pending'
    }));
    setUploadedFiles(prev => [...prev, ...newFiles]);
    alert(`${files.length} file(s) uploaded successfully!`);
  };

  // Handle chat functionality
  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { type: 'user', text: userMessage }]);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = generateAIResponse(userMessage);
      setChatMessages(prev => [...prev, { type: 'ai', text: aiResponse }]);
    }, 1000);
  };

  const generateAIResponse = (userInput) => {
    const input = userInput.toLowerCase();
    if (input.includes('emission') || input.includes('co2')) {
      return 'Based on your current emissions rate of 360,333 tons CO₂/day, you\'re performing 12% better than target. Consider implementing the Plant C optimization I recommended to achieve further reductions.';
    } else if (input.includes('compliance') || input.includes('regulation')) {
      return 'Your compliance status is at 94% with the next deadline on Jan 15. I recommend prioritizing the sensor calibration in Plant C to maintain this excellent rate.';
    } else if (input.includes('recommend') || input.includes('suggest')) {
      return 'My top recommendation is optimizing Plant C operations. This could reduce emissions by 12% while improving efficiency. Would you like a detailed implementation plan?';
    } else {
      return 'I can help you with emissions analysis, compliance tracking, operational optimization, and regulatory guidance. What specific area would you like to explore?';
    }
  };

  useEffect(() => {
    // Simulate loading and fetch AI data
    const loadData = async () => {
      await fetchAIInsights();
      setTimeout(() => setLoading(false), 800);
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="company-dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <div className="logo-icon">CS</div>
          <div className="header-info">
            <h2>Welcome back, {dashboardData.company}</h2>
            <p>Your Carbon Capture Dashboard</p>
          </div>
        </div>
        <button className="sign-out-btn" onClick={() => navigate('/')}>
          Sign Out
        </button>
      </header>

      <div className="dashboard-content">
        {currentView === 'dashboard' && (
          <>
            <div className="metrics-grid">
              <div className="metric-card clickable" onClick={handleEmissionsClick}>
                <div className="metric-header">
                  <span className="metric-label">Emissions Rate</span>
                  <svg className="metric-icon" viewBox="0 0 24 24" fill="none">
                    <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <div className="metric-value">{dashboardData.emissionsRate.toLocaleString()}</div>
                <div className="metric-subtitle">Tons CO₂/day</div>
                <div className="metric-change positive">↓ {dashboardData.emissionsChange}% vs target</div>
              </div>

              <div className="metric-card clickable" onClick={handleFacilitiesClick}>
                <div className="metric-header">
                  <span className="metric-label">Areas Affected</span>
                  <svg className="metric-icon" viewBox="0 0 24 24" fill="none">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <div className="metric-value">{dashboardData.areasAffected}</div>
                <div className="metric-subtitle">Active facilities</div>
                <div className="metric-facilities">
                  <span className="facility-badge optimal">{dashboardData.optimalFacilities} optimal</span>
                  <span className="facility-badge attention">{dashboardData.attentionFacilities} needs attention</span>
                </div>
              </div>

              <div className="metric-card clickable" onClick={handleComplianceClick}>
                <div className="metric-header">
                  <span className="metric-label">Compliance Status</span>
                  <svg className="metric-icon" viewBox="0 0 24 24" fill="none">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2"/>
                    <polyline points="22 4 12 14.01 9 11.01" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <div className="metric-value">{dashboardData.complianceStatus}%</div>
                <div className="metric-subtitle">On track</div>
                <div className="metric-deadline">Next deadline: {dashboardData.complianceDeadline}</div>
              </div>

              <div className="metric-card clickable" onClick={handleTasksClick}>
                <div className="metric-header">
                  <span className="metric-label">Active Tasks</span>
                  <svg className="metric-icon" viewBox="0 0 24 24" fill="none">
                    <path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="2"/>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <div className="metric-value">{dashboardData.activeTasks}</div>
                <div className="metric-subtitle">Pending items</div>
                <div className="metric-tasks">
                  <span className="task-badge urgent">{dashboardData.urgentTasks} urgent</span>
                  <span className="task-badge normal">{dashboardData.normalTasks} normal</span>
                </div>
              </div>
            </div>

        <div className="recommendations-section">
          <div className="section-header">
            <div className="section-title">
              <svg viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24" stroke="currentColor" strokeWidth="2"/>
              </svg>
              <span>AI-Powered Recommendations</span>
            </div>
            <p>Based on your recent activity and performance data</p>
          </div>

          {aiLoading ? (
            <div className="ai-loading">
              <div className="spinner"></div>
              <p>Generating AI recommendations...</p>
            </div>
          ) : (
            <div className="recommendations-grid">
              {(aiRecommendations.length > 0 ? aiRecommendations : dashboardData.recommendations).map((rec, index) => (
                <div key={index} className={`recommendation-card ${rec.impact}-impact`}>
                  <div className="rec-header">
                    <div className="rec-icon">
                      {rec.impact === 'high' && '⚠️'}
                      {rec.impact === 'medium' && '🎯'}
                      {rec.impact === 'low' && '💡'}
                    </div>
                    <span className={`impact-badge ${rec.impact}`}>
                      {rec.impact} impact
                    </span>
                    {aiRecommendations.length > 0 && (
                      <span className="ai-badge">✨ AI</span>
                    )}
                  </div>
                  <h4>{rec.title}</h4>
                  <p>{rec.description}</p>
                  <div className="rec-footer">
                    <div className="rec-category">
                      <span className="category-label">
                        {rec.category || `Priority ${rec.priority || 1}`}
                      </span>
                      <span className="action-label">
                        {rec.action || rec.estimated_reduction || 'Take action'}
                      </span>
                    </div>
                    <button className="rec-action-btn" onClick={() => handleRecommendationAction(rec)}>
                      <svg viewBox="0 0 24 24" fill="none">
                        <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="tabs-nav">
          <button 
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
            onClick={() => setActiveTab('tasks')}
          >
            Tasks ({dashboardData.activeTasks})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'documents' ? 'active' : ''}`}
            onClick={() => setActiveTab('documents')}
          >
            Documents
          </button>
          <button 
            className={`tab-btn ${activeTab === 'climate-data' ? 'active' : ''}`}
            onClick={() => setActiveTab('climate-data')}
          >
            Real-World Data
          </button>
        </div>

        {activeTab === 'overview' && (
          <div className="activity-section">
            <h3>Recent Activity</h3>
            <div className="activity-list">
              {dashboardData.activities.map((activity, index) => (
                <div key={index} className={`activity-item ${activity.type}`}>
                  <div className={`activity-dot ${activity.type}`}></div>
                  <div className="activity-content">
                    <p className="activity-title">{activity.title}</p>
                    <span className="activity-time">{activity.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="tasks-section">
            <div className="section-header">
              <h3>Active Tasks</h3>
              <p>Manage your compliance and operational tasks</p>
            </div>
            <div className="tasks-grid">
              {dashboardData.tasks.map((task) => (
                <div key={task.id} className={`task-card ${task.priority}`}>
                  <div className="task-header">
                    <div className="task-priority">
                      <span className={`priority-badge ${task.priority}`}>
                        {task.priority === 'urgent' ? '🔥' : '📋'} {task.priority}
                      </span>
                      <span className={`category-badge ${task.category}`}>
                        {task.category}
                      </span>
                    </div>
                    <div className="task-due">Due: {task.due}</div>
                  </div>
                  <h4>{task.title}</h4>
                  <p>{task.description}</p>
                  <div className="task-actions">
                    <button 
                      className="task-action-btn primary"
                      onClick={() => handleTaskAction(task)}
                    >
                      {task.category === 'compliance' ? 'Submit Document' : 'Start Task'}
                    </button>
                    <button 
                      className="task-action-btn secondary"
                      onClick={() => handleCompleteTask(task.id)}
                    >
                      Mark Complete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="documents-section">
            <div className="section-header">
              <h3>Document Management</h3>
              <p>Upload and manage compliance documents</p>
            </div>
            
            <div className="upload-area">
              <div className="upload-zone">
                <svg viewBox="0 0 24 24" fill="none" className="upload-icon">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="2"/>
                </svg>
                <h4>Upload Documents</h4>
                <p>Drag and drop files here, or click to select</p>
                <input 
                  type="file" 
                  multiple 
                  accept=".pdf,.doc,.docx,.xlsx,.xls" 
                  onChange={handleFileUpload}
                  className="file-input"
                />
                <button className="upload-btn" onClick={() => document.querySelector('.file-input').click()}>Choose Files</button>
              </div>
            </div>

            <div className="documents-list">
              <h4>Uploaded Documents</h4>
              {uploadedFiles.map((file, index) => (
                <div key={index} className="document-item">
                  <div className="document-icon">
                    {file.name.endsWith('.pdf') ? '📄' : '📊'}
                  </div>
                  <div className="document-info">
                    <h5>{file.name}</h5>
                    <p>Type: {file.type} • Uploaded: {file.date}</p>
                  </div>
                  <span className={`document-status ${file.status}`}>
                    {file.status === 'approved' ? '✅ Approved' : 
                     file.status === 'under_review' ? '🔍 Under Review' : 
                     '⏳ Pending'}
                  </span>
                  <button className="document-action-btn" onClick={() => alert(`Viewing document: ${file.name}\n\nThis would normally open a document viewer.`)}>View</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'climate-data' && (
          <ClimateTraceData user={dashboardData} />
        )}
          </>
        )}

        {/* Emissions by Facility View */}
        {currentView === 'emissions' && (
          <div className="view-container">
            <button className="back-button" onClick={() => setCurrentView('dashboard')}>
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2"/>
              </svg>
              Back to Dashboard
            </button>
            <div className="view-header">
              <h2>Emissions by Facility</h2>
              <p>Breakdown of CO₂ emissions across all Louisiana facilities</p>
            </div>
            <div className="facilities-emissions-grid">
              {dashboardData.facilities?.map((facility) => (
                <div key={facility.id} className="facility-emissions-card">
                  <div className="facility-emissions-header">
                    <h3>{facility.name}</h3>
                    <span className={`status-badge ${facility.status}`}>
                      {facility.status === 'optimal' ? '✓ Optimal' : '⚠ Needs Attention'}
                    </span>
                  </div>
                  <div className="facility-location">
                    <svg viewBox="0 0 24 24" fill="none" className="location-icon">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    {facility.location} • {facility.parish} Parish
                  </div>
                  <div className="emissions-stat">
                    <div className="stat-value">{facility.emissionsPerDay.toLocaleString()}</div>
                    <div className="stat-label">Tons CO₂/day</div>
                    <div className={`stat-change ${facility.emissionsChange < 0 ? 'positive' : 'negative'}`}>
                      {facility.emissionsChange > 0 ? '↑' : '↓'} {Math.abs(facility.emissionsChange)}% vs last month
                    </div>
                  </div>
                  <div className="facility-details">
                    <div className="detail-item">
                      <span className="detail-label">Capacity:</span>
                      <span className="detail-value">{facility.capacity}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Employees:</span>
                      <span className="detail-value">{facility.employees}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Products:</span>
                      <span className="detail-value">{facility.primaryProducts?.join(', ') || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="emissions-summary">
              <h3>Total Emissions Summary</h3>
              <div className="summary-stats">
                <div className="summary-item">
                  <div className="summary-value">{dashboardData.emissionsRate.toLocaleString()}</div>
                  <div className="summary-label">Total CO₂/day</div>
                </div>
                <div className="summary-item">
                  <div className="summary-value">{dashboardData.facilities?.length || 0}</div>
                  <div className="summary-label">Active Facilities</div>
                </div>
                <div className="summary-item">
                  <div className="summary-value">{dashboardData.facilities?.length ? (dashboardData.emissionsRate / dashboardData.facilities.length).toFixed(0).toLocaleString() : '0'}</div>
                  <div className="summary-label">Avg CO₂/day per facility</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Facility Locations View */}
        {currentView === 'facilities' && (
          <div className="view-container">
            <button className="back-button" onClick={() => setCurrentView('dashboard')}>
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2"/>
              </svg>
              Back to Dashboard
            </button>
            <div className="view-header">
              <h2>Facility Locations</h2>
              <p>Sasol Chemicals Louisiana facilities and environmental impact</p>
            </div>
            <div className="facilities-list">
              {dashboardData.facilities?.map((facility) => (
                <div key={facility.id} className="facility-location-card">
                  <div className="facility-card-header">
                    <div className="facility-info">
                      <h3>{facility.name}</h3>
                      <div className="facility-address">
                        <svg viewBox="0 0 24 24" fill="none" className="icon-small">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        {facility.address}
                      </div>
                    </div>
                    <span className={`status-badge-large ${facility.status}`}>
                      {facility.status === 'optimal' ? '✓ Optimal' : '⚠ Needs Attention'}
                    </span>
                  </div>

                  <div className="facility-grid">
                    <div className="facility-metric">
                      <div className="metric-label-small">Operational Since</div>
                      <div className="metric-value-small">{facility.operationalSince}</div>
                    </div>
                    <div className="facility-metric">
                      <div className="metric-label-small">Employees</div>
                      <div className="metric-value-small">{facility.employees}</div>
                    </div>
                    <div className="facility-metric">
                      <div className="metric-label-small">Air Quality Index</div>
                      <div className="metric-value-small">{facility.airQualityIndex}</div>
                    </div>
                    <div className="facility-metric">
                      <div className="metric-label-small">Parish</div>
                      <div className="metric-value-small">{facility.parish}</div>
                    </div>
                  </div>

                  <div className="environmental-impact">
                    <h4>Environmental Impact</h4>
                    <p>{facility.environmentalImpact}</p>
                    <div className="nearby-communities">
                      <span className="label">Nearby ZIP Codes:</span>
                      <span className="value">{facility.nearbyZipCodes?.join(', ') || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="facility-products">
                    <h4>Primary Products</h4>
                    <div className="product-tags">
                      {facility.primaryProducts?.map((product, idx) => (
                        <span key={idx} className="product-tag">{product}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Compliance Tasks View */}
        {currentView === 'compliance' && (
          <div className="view-container">
            <button className="back-button" onClick={() => setCurrentView('dashboard')}>
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2"/>
              </svg>
              Back to Dashboard
            </button>
            <div className="view-header">
              <h2>Compliance Tasks & Deadlines</h2>
              <p>Louisiana DEQ and EPA regulatory requirements</p>
            </div>
            <div className="compliance-tasks-list">
              {dashboardData.complianceTasks?.map((task) => (
                <div key={task.id} className="compliance-task-card">
                  <div className="compliance-task-header">
                    <div className="task-title-section">
                      <h3>{task.title}</h3>
                      <div className="task-regulation">{task.regulation}</div>
                    </div>
                    <div className="task-badges">
                      <span className={`priority-badge-large ${task.priority}`}>
                        {task.priority === 'urgent' ? '🔥 Urgent' : '📋 Normal'}
                      </span>
                      <span className={`status-badge-compliance ${task.status}`}>
                        {task.status === 'in_progress' ? '⚙️ In Progress' :
                         task.status === 'scheduled' ? '📅 Scheduled' : '⏳ Pending'}
                      </span>
                    </div>
                  </div>

                  <div className="compliance-task-meta">
                    <div className="meta-item">
                      <svg viewBox="0 0 24 24" fill="none" className="icon-small">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                        <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      <span>Due: {task.dueDate}</span>
                    </div>
                    <div className="meta-item">
                      <svg viewBox="0 0 24 24" fill="none" className="icon-small">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2"/>
                        <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      <span>{task.assignedTo}</span>
                    </div>
                  </div>

                  <div className="compliance-progress">
                    <div className="progress-header">
                      <span>Progress</span>
                      <span className="progress-percent">{task.completionPercent}%</span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${task.completionPercent}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="compliance-requirements">
                    <h4>Requirements:</h4>
                    <ul>
                      {task.requirements?.map((req, idx) => (
                        <li key={idx}>{req}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recommendation Detail Modal */}
      {selectedRecommendation && (
        <div className="modal-overlay" onClick={() => setSelectedRecommendation(null)}>
          <div className="recommendation-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedRecommendation.title}</h3>
              <button className="modal-close" onClick={() => setSelectedRecommendation(null)}>×</button>
            </div>
            <div className="modal-content">
              <div className="recommendation-detail-header">
                <span className={`impact-badge-large ${selectedRecommendation.impact}`}>
                  {selectedRecommendation.impact === 'high' && '⚠️'}
                  {selectedRecommendation.impact === 'medium' && '🎯'}
                  {selectedRecommendation.impact === 'low' && '💡'}
                  {selectedRecommendation.impact} impact
                </span>
                <span className="facility-badge-modal">{selectedRecommendation.facility}</span>
              </div>

              <div className="recommendation-description">
                <p>{selectedRecommendation.description}</p>
              </div>

              <div className="recommendation-action-plan">
                <h4>Action Plan</h4>
                <ol className="action-steps">
                  {selectedRecommendation.detailedSteps?.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ol>
              </div>

              <div className="recommendation-details-grid">
                <div className="detail-box">
                  <div className="detail-box-label">Timeline</div>
                  <div className="detail-box-value">{selectedRecommendation.timeline}</div>
                </div>
                <div className="detail-box">
                  <div className="detail-box-label">Estimated Cost</div>
                  <div className="detail-box-value">{selectedRecommendation.estimatedCost}</div>
                </div>
                <div className="detail-box">
                  <div className="detail-box-label">Expected Benefit</div>
                  <div className="detail-box-value">{selectedRecommendation.expectedBenefit || selectedRecommendation.action}</div>
                </div>
              </div>

              <div className="recommendation-impact-section">
                <div className="impact-item">
                  <h4>Compliance Impact</h4>
                  <p>{selectedRecommendation.complianceImpact}</p>
                </div>
                <div className="impact-item">
                  <h4>Environmental Benefit</h4>
                  <p>{selectedRecommendation.environmentalBenefit}</p>
                </div>
              </div>

              <div className="recommendation-actions">
                <button className="btn-primary" onClick={() => {
                  alert('Implementation workflow initiated!\n\nThis would normally create tasks and assign team members.');
                  setSelectedRecommendation(null);
                }}>
                  Implement Recommendation
                </button>
                <button className="btn-secondary" onClick={() => setSelectedRecommendation(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDocumentUpload && (
        <div className="modal-overlay" onClick={() => setShowDocumentUpload(false)}>
          <div className="upload-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Submit Compliance Document</h3>
              <button className="modal-close" onClick={() => setShowDocumentUpload(false)}>×</button>
            </div>
            <div className="modal-content">
              <p>Upload your compliance document for review by regulators.</p>
              <div className="upload-zone-modal">
                <input 
                  type="file" 
                  accept=".pdf,.doc,.docx,.xlsx,.xls" 
                  onChange={handleFileUpload}
                  className="file-input"
                />
                <button className="upload-btn-modal" onClick={() => document.querySelector('.upload-zone-modal .file-input').click()}>Select Document</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="chat-button" onClick={() => setShowChat(!showChat)}>
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2"/>
        </svg>
      </div>

      {showChat && (
        <div className="chat-modal">
          <div className="chat-header">
            <h3>AI Assistant</h3>
            <button className="chat-close" onClick={() => setShowChat(false)}>×</button>
          </div>
          <div className="chat-messages">
            {chatMessages.map((msg, index) => (
              <div key={index} className={`chat-message ${msg.type}`}>
                <div className="message-avatar">
                  {msg.type === 'ai' ? '🤖' : '👤'}
                </div>
                <div className="message-text">{msg.text}</div>
              </div>
            ))}
          </div>
          <form className="chat-input-form" onSubmit={handleChatSubmit}>
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask me about your emissions, compliance, or optimizations..."
              className="chat-input"
            />
            <button type="submit" className="chat-send">Send</button>
          </form>
        </div>
      )}
    </div>
  );
}

export default CompanyDashboard;