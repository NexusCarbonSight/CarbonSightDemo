import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './CompanyDashboard.css';

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

  // Sample data - in production this would come from API
  const dashboardData = {
    company: 'Tiger Industries',
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
    activities: [
      { title: 'Quarterly emissions report submitted', time: '2 hours ago', type: 'success' },
      { title: 'Area B-12 monitoring data uploaded', time: '5 hours ago', type: 'info' },
      { title: 'Compliance checklist updated', time: '1 day ago', type: 'info' },
      { title: 'New regulatory deadline added', time: '2 days ago', type: 'warning' }
    ],
    tasks: [
      { 
        id: 1, 
        title: 'Submit Q4 Emissions Report', 
        description: 'Quarterly emissions report due January 15th', 
        priority: 'urgent', 
        due: 'Jan 15, 2025',
        status: 'pending',
        category: 'compliance'
      },
      { 
        id: 2, 
        title: 'Plant C Sensor Calibration', 
        description: 'Annual calibration required for monitoring equipment', 
        priority: 'urgent', 
        due: 'Nov 5, 2024',
        status: 'pending',
        category: 'maintenance'
      },
      { 
        id: 3, 
        title: 'Review New EPA Guidelines', 
        description: 'Updated carbon capture standards effective Q1 2025', 
        priority: 'normal', 
        due: 'Dec 1, 2024',
        status: 'pending',
        category: 'compliance'
      },
      { 
        id: 4, 
        title: 'Optimize Plant B Operations', 
        description: 'Implement efficiency improvements identified in audit', 
        priority: 'normal', 
        due: 'Nov 30, 2024',
        status: 'pending',
        category: 'optimization'
      },
      { 
        id: 5, 
        title: 'Employee Safety Training', 
        description: 'Annual carbon capture safety protocol training', 
        priority: 'normal', 
        due: 'Dec 15, 2024',
        status: 'pending',
        category: 'training'
      }
    ],
    recommendations: [
      {
        title: 'Optimize Plant C Operations',
        description: 'Current ops report shows Plant C is operating at 70% capacity with higher than normal emissions per unit. Consider adjusting process parameters or scheduling maintenance.',
        impact: 'high',
        category: 'Efficiency',
        action: '12% emission reduction'
      },
      {
        title: 'Schedule Preventive Maintenance',
        description: 'Sensor calibration in Plant C is within 14 days. Early scheduling can prevent compliance issues and improve data accuracy.',
        impact: 'medium',
        category: 'Compliance',
        action: 'Avoid violations'
      },
      {
        title: 'Update Q4 Targets',
        description: 'Current performance is 12% better than target. Consider setting more ambitious goals to maximize environmental impact and potential incentives.',
        impact: 'medium',
        category: 'Planning',
        action: 'Enhanced credits'
      }
    ]
  };

  // Fetch AI recommendations
  const fetchAIInsights = async () => {
    setAiLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000/api'}/ai/quick-insights/`);
      if (response.ok) {
        const data = await response.json();
        setAiRecommendations(data.recommendations || []);
        setAiInsights({
          trendAnalysis: data.trend_analysis,
          keyInsights: data.key_insights || []
        });
      }
    } catch (error) {
      console.error('Failed to fetch AI insights:', error);
      // Fallback to existing static recommendations
      setAiRecommendations(dashboardData.recommendations);
    } finally {
      setAiLoading(false);
    }
  };

  // Handle recommendation action
  const handleRecommendationAction = (recommendation, index) => {
    alert(`Taking action on: ${recommendation.title}\n\nThis would normally open a detailed action plan or workflow.`);
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
        <div className="metrics-grid">
          <div className="metric-card">
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

          <div className="metric-card">
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

          <div className="metric-card">
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

          <div className="metric-card">
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
                    <button className="rec-action-btn" onClick={() => handleRecommendationAction(rec, index)}>
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
                <button className="upload-btn">Choose Files</button>
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
                  <button className="document-action-btn">View</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

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
                <button className="upload-btn-modal">Select Document</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="activity-section" style={{display: activeTab === 'overview' ? 'block' : 'none'}}>
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
      </div>

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
