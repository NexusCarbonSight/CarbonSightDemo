import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './RegulatorDashboard.css';
import ClimateTraceData from '../components/ClimateTraceData';

function RegulatorDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { type: 'ai', text: 'Hello! I\'m your regulatory AI assistant. I can help with compliance monitoring, alert analysis, and regulatory insights. How can I assist you today?' }
  ]);
  const [chatInput, setChatInput] = useState('');

  const complianceData = [
    { month: 'Jun', rate: 90 },
    { month: 'Jul', rate: 92 },
    { month: 'Aug', rate: 93 },
    { month: 'Sep', rate: 94 },
    { month: 'Oct', rate: 96 },
    { month: 'Nov', rate: 98 }
  ];

  const emissionsData = [
    { month: 'Jun', emissions: 370000 },
    { month: 'Jul', emissions: 360000 },
    { month: 'Aug', emissions: 350000 },
    { month: 'Sep', emissions: 390000 },
    { month: 'Oct', emissions: 370000 },
    { month: 'Nov', emissions: 380000 }
  ];

  useEffect(() => {
    setTimeout(() => setLoading(false), 800);
  }, []);

  // Handle alert actions
  const handleAlertAction = (alert) => {
    alert(`Reviewing alert: ${alert.company}\n${alert.message}\n\nThis would normally open a detailed investigation interface.`);
  };

  // Handle document review
  const handleDocumentReview = (submission) => {
    alert(`Reviewing document: ${submission.document}\nCompany: ${submission.company}\nType: ${submission.type}\n\nThis would normally open a document viewer and review interface.`);
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
      const aiResponse = generateRegulatoryAIResponse(userMessage);
      setChatMessages(prev => [...prev, { type: 'ai', text: aiResponse }]);
    }, 1000);
  };

  const generateRegulatoryAIResponse = (userInput) => {
    const input = userInput.toLowerCase();
    if (input.includes('compliance') || input.includes('violation')) {
      return 'Current statewide compliance rate is 92% (up 2%). Delta Refining Co. needs attention with 88% compliance. Their Q3 report is 2 days overdue - I recommend immediate follow-up.';
    } else if (input.includes('alert') || input.includes('priority')) {
      return 'You have 3 active alerts: 1 high priority (Delta Refining overdue report), 1 medium (Coastal Petrochemical emissions spike), and 1 low priority notification. Shall I prioritize your review workflow?';
    } else if (input.includes('emission') || input.includes('trend')) {
      return 'Statewide emissions are trending positive with an overall reduction of 15% since 2023. However, watch for seasonal spikes in Q4. Current daily average is 373K tons CO₂.';
    } else {
      return 'I can help with compliance monitoring, alert prioritization, emissions trend analysis, and regulatory guidance. What would you like to review?';
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="regulator-dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <div className="logo-icon">CS</div>
          <div className="header-info">
            <h2>Regulator Dashboard</h2>
            <p>Louisiana Department of Environmental Quality</p>
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
              <span className="metric-label">Total Companies</span>
              <svg className="metric-icon" viewBox="0 0 24 24" fill="none">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <div className="metric-value">5</div>
            <div className="metric-subtitle">12 facilities</div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-label">Total Emissions 2024</span>
              <svg className="metric-icon" viewBox="0 0 24 24" fill="none">
                <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <div className="metric-value">126.5M</div>
            <div className="metric-subtitle">Tons CO₂ annually</div>
          </div>

          <div className="metric-card success">
            <div className="metric-header">
              <span className="metric-label">Avg Compliance</span>
              <svg className="metric-icon" viewBox="0 0 24 24" fill="none">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2"/>
                <polyline points="22 4 12 14.01 9 11.01" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <div className="metric-value">92%</div>
            <div className="metric-change positive">↑ 2% improvement</div>
          </div>

          <div className="metric-card warning">
            <div className="metric-header">
              <span className="metric-label">Active Alerts</span>
              <svg className="metric-icon" viewBox="0 0 24 24" fill="none">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" strokeWidth="2"/>
                <line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="2"/>
                <line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <div className="metric-value">3</div>
            <div className="metric-alert">2 need attention</div>
          </div>
        </div>

        <div className="tabs-nav">
          <button 
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`tab-btn ${activeTab === 'companies' ? 'active' : ''}`}
            onClick={() => setActiveTab('companies')}
          >
            Companies
          </button>
          <button 
            className={`tab-btn ${activeTab === 'submissions' ? 'active' : ''}`}
            onClick={() => setActiveTab('submissions')}
          >
            Submissions
          </button>
          <button 
            className={`tab-btn ${activeTab === 'alerts' ? 'active' : ''}`}
            onClick={() => setActiveTab('alerts')}
          >
            Alerts
          </button>
          <button 
            className={`tab-btn ${activeTab === 'climate-data' ? 'active' : ''}`}
            onClick={() => setActiveTab('climate-data')}
          >
            External Data
          </button>
        </div>

        <div className="charts-section">
          <div className="chart-card">
            <h3>Statewide Compliance Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={complianceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a3351" />
                <XAxis dataKey="month" stroke="#8892b0" />
                <YAxis stroke="#8892b0" domain={[75, 100]} />
                <Tooltip 
                  contentStyle={{ 
                    background: '#1a1f3a', 
                    border: '1px solid #a78bfa',
                    borderRadius: '8px',
                    color: '#fff'
                  }} 
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="rate" 
                  name="Compliance Rate %" 
                  stroke="#a78bfa" 
                  strokeWidth={3} 
                  dot={{ r: 5, fill: '#a78bfa' }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h3>Total Emissions Trend (Tons/day)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={emissionsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a3351" />
                <XAxis dataKey="month" stroke="#8892b0" />
                <YAxis stroke="#8892b0" />
                <Tooltip 
                  contentStyle={{ 
                    background: '#1a1f3a', 
                    border: '1px solid #34d3fd',
                    borderRadius: '8px',
                    color: '#fff'
                  }} 
                />
                <Legend />
                <Bar 
                  dataKey="emissions" 
                  fill="#34d3fd" 
                  name="Daily Emissions" 
                  radius={[8, 8, 0, 0]} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {activeTab === 'overview' && (
          <div className="overview-section">
            <div className="companies-list">
              <h3>Registered Companies</h3>
              <div className="company-items">
                {[
                  { name: 'Tiger Industries', compliance: 94, emissions: '360,333', status: 'compliant' },
                  { name: 'Coastal Petrochemical', compliance: 91, emissions: '420,500', status: 'compliant' },
                  { name: 'Delta Refining Co.', compliance: 88, emissions: '385,200', status: 'attention' },
                  { name: 'Louisiana Carbon Solutions', compliance: 96, emissions: '310,800', status: 'compliant' },
                  { name: 'Gulf Coast Manufacturing', compliance: 93, emissions: '395,100', status: 'compliant' }
                ].map((company, index) => (
                  <div key={index} className="company-item">
                    <div className="company-info">
                      <h4>{company.name}</h4>
                      <p>{company.emissions} tons CO₂/day</p>
                    </div>
                    <div className="company-stats">
                      <div className="compliance-stat">
                        <span className="stat-label">Compliance</span>
                        <span className="stat-value">{company.compliance}%</span>
                      </div>
                      <span className={`status-badge ${company.status}`}>
                        {company.status === 'compliant' ? '✓ Compliant' : '⚠ Needs Attention'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'companies' && (
          <div className="companies-section">
            <h3>Company Management</h3>
            <div className="companies-grid">
              {[
                { name: 'Tiger Industries', compliance: 94, emissions: '360,333', lastReport: '2 days ago', status: 'compliant' },
                { name: 'Coastal Petrochemical', compliance: 91, emissions: '420,500', lastReport: '1 week ago', status: 'compliant' },
                { name: 'Delta Refining Co.', compliance: 88, emissions: '385,200', lastReport: 'Overdue', status: 'attention' },
                { name: 'Louisiana Carbon Solutions', compliance: 96, emissions: '310,800', lastReport: '1 day ago', status: 'compliant' },
                { name: 'Gulf Coast Manufacturing', compliance: 93, emissions: '395,100', lastReport: '3 days ago', status: 'compliant' }
              ].map((company, index) => (
                <div key={index} className="company-detail-card">
                  <div className="company-header">
                    <h4>{company.name}</h4>
                    <span className={`status-badge ${company.status}`}>
                      {company.status === 'compliant' ? '✓' : '⚠'}
                    </span>
                  </div>
                  <div className="company-metrics">
                    <div className="metric">
                      <span className="metric-label">Compliance</span>
                      <span className="metric-value">{company.compliance}%</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Daily Emissions</span>
                      <span className="metric-value">{company.emissions}</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Last Report</span>
                      <span className={`metric-value ${company.lastReport === 'Overdue' ? 'overdue' : ''}`}>
                        {company.lastReport}
                      </span>
                    </div>
                  </div>
                  <button className="company-action-btn">View Details</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'submissions' && (
          <div className="submissions-section">
            <h3>Recent Submissions</h3>
            <div className="submissions-list">
              {[
                { company: 'Tiger Industries', type: 'Quarterly Report', date: '2024-10-19', status: 'approved' },
                { company: 'Louisiana Carbon Solutions', type: 'Monthly Data', date: '2024-10-18', status: 'approved' },
                { company: 'Gulf Coast Manufacturing', type: 'Incident Report', date: '2024-10-17', status: 'under_review' },
                { company: 'Coastal Petrochemical', type: 'Maintenance Notice', date: '2024-10-16', status: 'approved' },
                { company: 'Delta Refining Co.', type: 'Quarterly Report', date: 'Pending', status: 'overdue' }
              ].map((submission, index) => (
                <div key={index} className={`submission-item ${submission.status}`}>
                  <div className="submission-info">
                    <h4>{submission.company}</h4>
                    <p>{submission.type}</p>
                    <span className="submission-date">{submission.date}</span>
                  </div>
                  <span className={`submission-status ${submission.status}`}>
                    {submission.status.replace('_', ' ').toUpperCase()}
                  </span>
                  <button className="submission-action-btn">Review</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'companies' && (
          <div className="companies-section">
            <h3>Registered Companies</h3>
            <div className="companies-grid">
              {[
                { name: 'Tiger Industries', compliance: 94, emissions: '360,333', status: 'compliant', documents: 3, lastSubmission: '2024-10-15' },
                { name: 'Coastal Petrochemical', compliance: 91, emissions: '420,500', status: 'compliant', documents: 2, lastSubmission: '2024-10-12' },
                { name: 'Delta Refining Co.', compliance: 88, emissions: '385,200', status: 'attention', documents: 1, lastSubmission: '2024-09-28' },
                { name: 'Louisiana Carbon Solutions', compliance: 96, emissions: '310,800', status: 'compliant', documents: 4, lastSubmission: '2024-10-18' },
                { name: 'Gulf Coast Manufacturing', compliance: 93, emissions: '395,100', status: 'compliant', documents: 2, lastSubmission: '2024-10-16' }
              ].map((company, index) => (
                <div key={index} className="company-detail-card">
                  <div className="company-header">
                    <h4>{company.name}</h4>
                    <span className={`status-badge ${company.status}`}>
                      {company.status === 'compliant' ? '✓ Compliant' : '⚠ Needs Attention'}
                    </span>
                  </div>
                  <div className="company-metrics">
                    <div className="metric">
                      <span className="metric-label">Compliance</span>
                      <span className="metric-value">{company.compliance}%</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Emissions</span>
                      <span className="metric-value">{company.emissions} t/day</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Documents</span>
                      <span className="metric-value">{company.documents} files</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Last Submission</span>
                      <span className={`metric-value ${company.status === 'attention' ? 'overdue' : ''}`}>
                        {company.lastSubmission}
                      </span>
                    </div>
                  </div>
                  <button 
                    className="company-action-btn"
                    onClick={() => setActiveTab('submissions')}
                  >
                    View Documents
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'submissions' && (
          <div className="submissions-section">
            <h3>Document Submissions</h3>
            <div className="submissions-list">
              {[
                { 
                  company: 'Tiger Industries', 
                  document: 'Q3_Emissions_Report.pdf', 
                  type: 'Quarterly Report', 
                  submitted: '2024-10-15', 
                  status: 'approved',
                  reviewer: 'J. Smith'
                },
                { 
                  company: 'Louisiana Carbon Solutions', 
                  document: 'Plant_Efficiency_Analysis.xlsx', 
                  type: 'Efficiency Report', 
                  submitted: '2024-10-18', 
                  status: 'under_review',
                  reviewer: 'Pending'
                },
                { 
                  company: 'Gulf Coast Manufacturing', 
                  document: 'Safety_Protocol_Update.pdf', 
                  type: 'Safety Documentation', 
                  submitted: '2024-10-16', 
                  status: 'under_review',
                  reviewer: 'A. Johnson'
                },
                { 
                  company: 'Coastal Petrochemical', 
                  document: 'Emissions_Monitoring_Data.csv', 
                  type: 'Monitoring Data', 
                  submitted: '2024-10-12', 
                  status: 'approved',
                  reviewer: 'M. Davis'
                },
                { 
                  company: 'Delta Refining Co.', 
                  document: 'Q3_Compliance_Report.pdf', 
                  type: 'Quarterly Report', 
                  submitted: '2024-09-28', 
                  status: 'overdue',
                  reviewer: 'Required'
                }
              ].map((submission, index) => (
                <div key={index} className={`submission-item ${submission.status}`}>
                  <div className="submission-info">
                    <h4>{submission.company}</h4>
                    <p><strong>{submission.document}</strong> • {submission.type}</p>
                    <span className="submission-date">Submitted: {submission.submitted}</span>
                  </div>
                  <div className="submission-meta">
                    <span className={`submission-status ${submission.status}`}>
                      {submission.status === 'approved' ? 'Approved' : 
                       submission.status === 'under_review' ? 'Under Review' : 
                       'Action Required'}
                    </span>
                    <span className="reviewer">Reviewer: {submission.reviewer}</span>
                  </div>
                  <button 
                    className="submission-action-btn"
                    onClick={() => handleDocumentReview(submission)}
                  >
                    {submission.status === 'approved' ? 'View' : 'Review'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="alerts-section">
            <h3>Active Alerts</h3>
            <div className="alert-items">
              {[
                { company: 'Delta Refining Co.', message: 'Q3 compliance report overdue', severity: 'high', date: '2 days ago' },
                { company: 'Coastal Petrochemical', message: 'Emissions spike detected in monitoring data', severity: 'medium', date: '1 week ago' },
                { company: 'Tiger Industries', message: 'Upcoming maintenance window notification', severity: 'low', date: '3 days ago' }
              ].map((alert, index) => (
                <div key={index} className={`alert-item ${alert.severity}`}>
                  <div className={`alert-icon ${alert.severity}`}>
                    {alert.severity === 'high' && '⚠️'}
                    {alert.severity === 'medium' && '🔔'}
                    {alert.severity === 'low' && 'ℹ️'}
                  </div>
                  <div className="alert-content">
                    <h4>{alert.company}</h4>
                    <p>{alert.message}</p>
                    <span className="alert-date">{alert.date}</span>
                  </div>
                  <button className="alert-action-btn" onClick={() => handleAlertAction(alert)}>Review</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'climate-data' && (
          <ClimateTraceData user={{ company: 'Louisiana Regulatory Authority' }} />
        )}
        
      </div>

      <div className="chat-button" onClick={() => setShowChat(!showChat)}>
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2"/>
        </svg>
      </div>

      {showChat && (
        <div className="chat-modal">
          <div className="chat-header">
            <h3>Regulatory AI Assistant</h3>
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
              placeholder="Ask about compliance, alerts, or regulatory insights..."
              className="chat-input"
            />
            <button type="submit" className="chat-send">Send</button>
          </form>
        </div>
      )}
    </div>
  );
}

export default RegulatorDashboard;
