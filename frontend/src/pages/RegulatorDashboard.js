import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './RegulatorDashboard.css';
import { useAuth } from '../context/AuthContext';
import { useRegulatorDashboardData } from '../hooks/useRegulatorDashboardData';
import { supabase } from '../lib/supabaseClient';

const DOCUMENT_BUCKET = 'documents';

function RegulatorDashboard() {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const {
    loading: dataLoading,
    error: dataError,
    complianceTrend,
    emissionsTrend,
    companies: initialCompanies = [],
    submissions: initialSubmissions = [],
    alerts: initialAlerts = [],
  } = useRegulatorDashboardData();
  const [companies, setCompanies] = useState(initialCompanies);
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [alerts, setAlerts] = useState(initialAlerts);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { type: 'ai', text: 'Hello! I\'m your regulatory AI assistant. I can help with compliance monitoring, alert analysis, and regulatory insights. How can I assist you today?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  
  useEffect(() => setCompanies(initialCompanies), [initialCompanies]);
  useEffect(() => setSubmissions(initialSubmissions), [initialSubmissions]);
  useEffect(() => setAlerts(initialAlerts), [initialAlerts]);
  
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [showEnforcementModal, setShowEnforcementModal] = useState(false);
  const [reviewComment, setReviewComment] = useState('');
  const [inspectionDate, setInspectionDate] = useState('');
  const [enforcementAction, setEnforcementAction] = useState('');
  const [companySearchTerm, setCompanySearchTerm] = useState('');
  const [submissionSearchTerm, setSubmissionSearchTerm] = useState('');
  const [alertSearchTerm, setAlertSearchTerm] = useState('');
  
  const [companyStatusFilter, setCompanyStatusFilter] = useState('all');
  const [submissionStatusFilter, setSubmissionStatusFilter] = useState('all');
  const [alertStatusFilter, setAlertStatusFilter] = useState('all');
  const [alertSeverityFilter, setAlertSeverityFilter] = useState('all');
  const [documentActionLoading, setDocumentActionLoading] = useState(false);

  const logRegulatorAlert = async ({ orgId, severity, status, title, description, metadata = {} }) => {
    const { data, error } = await supabase
      .from('alerts')
      .insert([{ org_id: orgId, severity, status, title, description, metadata }])
      .select('id, org_id, severity, status, detected_at, title, description')
      .single();

    if (error) {
      throw error;
    }

    const companyName = companies.find((company) => company.id === orgId)?.name || selectedCompany?.name || 'Unknown';
    const newAlert = {
      id: data.id,
      company: companyName,
      type: data.title,
      severity: data.severity,
      status: data.status,
      timestamp: data.detected_at,
      description: data.description || '',
    };

    setAlerts((prev) => [newAlert, ...prev]);

    setSelectedCompany((prev) => {
      if (!prev || prev.id !== orgId) {
        return prev;
      }
      return {
        ...prev,
        violations: [
          ...(prev.violations || []),
          {
            id: newAlert.id,
            type: newAlert.type,
            date: newAlert.timestamp,
            severity: newAlert.severity,
            resolved: newAlert.status === 'resolved',
          },
        ],
      };
    });
  };

  const filteredCompanies = (companies || []).filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(companySearchTerm.toLowerCase()) ||
      company.status?.toLowerCase().includes(companySearchTerm.toLowerCase()) ||
      company.emissions?.toString().includes(companySearchTerm);
    const matchesStatus = companyStatusFilter === 'all' || company.status === companyStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredSubmissions = (submissions || []).filter(submission => {
    const matchesSearch = submission.company.toLowerCase().includes(submissionSearchTerm.toLowerCase()) ||
      submission.document.toLowerCase().includes(submissionSearchTerm.toLowerCase()) ||
      submission.type.toLowerCase().includes(submissionSearchTerm.toLowerCase()) ||
      submission.status.toLowerCase().includes(submissionSearchTerm.toLowerCase());
    const matchesStatus = submissionStatusFilter === 'all' || submission.status === submissionStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredAlerts = (alerts || []).filter(alert => {
    const matchesSearch = alert.company.toLowerCase().includes(alertSearchTerm.toLowerCase()) ||
      alert.type.toLowerCase().includes(alertSearchTerm.toLowerCase()) ||
      alert.description.toLowerCase().includes(alertSearchTerm.toLowerCase()) ||
      alert.severity.toLowerCase().includes(alertSearchTerm.toLowerCase());
    const matchesStatus = alertStatusFilter === 'all' || alert.status === alertStatusFilter;
    const matchesSeverity = alertSeverityFilter === 'all' || alert.severity === alertSeverityFilter;
    return matchesSearch && matchesStatus && matchesSeverity;
  });

  useEffect(() => {
    if (!dataLoading) {
      const timeout = setTimeout(() => setLoading(false), 500);
      return () => clearTimeout(timeout);
    }
  }, [dataLoading]);

  const totalCompanies = companies?.length ?? 0;
  const totalEmissions = useMemo(() => {
    if (!companies?.length) return '0';
    return companies
      .map(company => Number(String(company.emissions).replace(/,/g, '')))
      .filter(value => !Number.isNaN(value))
      .reduce((sum, value) => sum + value, 0)
      .toLocaleString();
  }, [companies]);

  const averageCompliance = useMemo(() => {
    if (!companies?.length) return 0;
    const total = companies.reduce((sum, company) => sum + Number(company.compliance ?? 0), 0);
    return Math.round(total / companies.length);
  }, [companies]);

  const activeAlertsCount = alerts?.filter(alert => alert.status === 'active' || alert.status === 'pending').length ?? 0;

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleCompanyClick = (company) => {
    setSelectedCompany({
      ...company,
      facilities: company.facilities || [],
      recentDocuments: company.recentDocuments || [],
      violations: company.violations || [],
    });
  };

  const handleDocumentReview = (submission) => {
    const metadata = submission.metadata ?? {};
    setReviewComment('');
    setSelectedSubmission({
      ...submission,
      orgId: submission.orgId ?? submission.org_id,
      storagePath: submission.storagePath ?? submission.storage_object_path,
      details: {
        fileSize: metadata.file_size ?? metadata.fileSize ?? 'N/A',
        pages: metadata.page_count ?? metadata.pages ?? null,
        submittedBy: metadata.submitted_by ?? metadata.submittedBy ?? 'Unknown submitter',
        reviewDeadline: metadata.review_deadline ?? metadata.reviewDeadline ?? submission.submitted,
        complianceIssues: metadata.issues ?? metadata.complianceIssues ?? [],
      }
    });
  };

  const updateDocumentState = (updatedDoc) => {
    setSubmissions((prev) =>
      prev.map((submission) =>
        submission.id === updatedDoc.id
          ? {
              ...submission,
              status: updatedDoc.status?.toLowerCase() || 'pending',
              metadata: updatedDoc.metadata || {},
              storagePath: updatedDoc.storage_object_path || submission.storagePath,
              submitted: updatedDoc.uploaded_at,
            }
          : submission
      )
    );

    setCompanies((prev) =>
      prev.map((company) => {
        if (company.id !== updatedDoc.org_id) {
          return company;
        }
        const nextRecentDocs = [
          {
            id: updatedDoc.id,
            name: updatedDoc.name,
            date: updatedDoc.uploaded_at,
            status: updatedDoc.status || 'Pending',
            storagePath: updatedDoc.storage_object_path,
          },
          ...(company.recentDocuments || []).filter((doc) => doc.id !== updatedDoc.id),
        ].slice(0, 5);

        return {
          ...company,
          recentDocuments: nextRecentDocs,
        };
      })
    );

    setSelectedCompany((prev) => {
      if (!prev || prev.id !== updatedDoc.org_id) {
        return prev;
      }

      const nextRecentDocs = [
        {
          id: updatedDoc.id,
          name: updatedDoc.name,
          date: updatedDoc.uploaded_at,
          status: updatedDoc.status || 'Pending',
          storagePath: updatedDoc.storage_object_path,
        },
        ...(prev.recentDocuments || []).filter((doc) => doc.id !== updatedDoc.id),
      ].slice(0, 5);

      return {
        ...prev,
        recentDocuments: nextRecentDocs,
      };
    });
  };

  const handlePreviewDocument = async () => {
    if (!selectedSubmission?.storagePath) {
      alert('No file is attached to this submission yet.');
      return;
    }

    try {
      const { data, error } = await supabase.storage
        .from(DOCUMENT_BUCKET)
        .createSignedUrl(selectedSubmission.storagePath, 120);
      if (error) {
        throw error;
      }

      const url = data?.signedUrl;
      if (!url) {
        throw new Error('Failed to retrieve preview URL.');
      }

      window.open(url, '_blank', 'noopener');
    } catch (err) {
      console.error('Document preview failed', err);
      alert('Unable to open the document preview. Please try again.');
    }
  };

  const handleAlertAction = (alert) => {
    setSelectedAlert({
      ...alert,
      details: {
        reportedBy: 'Automated Monitoring System',
        affectedFacilities: alert.severity === 'high' ? 2 : 1,
        estimatedImpact: alert.severity === 'high' ? 'High' : 'Medium',
        recommendedActions: [
          'Immediate compliance review',
          'Schedule facility inspection',
          'Request corrective action plan'
        ]
      }
    });
  };

  const handleDocumentStatusChange = async (nextStatus) => {
    if (!selectedSubmission) {
      return;
    }

    if (!reviewComment.trim()) {
      const message =
        nextStatus === 'approved'
          ? 'Please provide review comments before approving.'
          : 'Please provide reasons for rejection.';
      alert(message);
      return;
    }

    setDocumentActionLoading(true);
    try {
      const mergedMetadata = {
        ...(selectedSubmission.metadata || {}),
        review_comment: reviewComment,
        review_comment_author: profile?.display_name || profile?.email || profile?.id,
        review_comment_at: new Date().toISOString(),
        review_status: nextStatus,
      };

      const { data, error } = await supabase
        .from('documents')
        .update({
          status: nextStatus,
          metadata: mergedMetadata,
        })
        .eq('id', selectedSubmission.id)
        .select('id, org_id, name, document_type, uploaded_at, status, metadata, storage_object_path')
        .single();

      if (error) {
        throw error;
      }

      updateDocumentState(data);
      alert(`Document ${nextStatus} for ${selectedSubmission.company}.`);
      setSelectedSubmission(null);
      setReviewComment('');
    } catch (err) {
      console.error('Document status update failed', err);
      alert('Failed to update the document. Please try again.');
    } finally {
      setDocumentActionLoading(false);
    }
  };

  const handleApproveDocument = () => handleDocumentStatusChange('approved');
  const handleRejectDocument = () => handleDocumentStatusChange('rejected');

  const handleScheduleInspection = async () => {
    if (!inspectionDate) {
      alert('Please select an inspection date.');
      return;
    }

    try {
      await logRegulatorAlert({
        orgId: selectedCompany.id,
        severity: 'medium',
        status: 'scheduled',
        title: 'Inspection Scheduled',
        description: `Inspection scheduled for ${inspectionDate}`,
        metadata: {
          inspection_date: inspectionDate,
          initiated_by: profile?.display_name || profile?.email || 'Regulator',
        },
      });

      alert(`Inspection scheduled for ${selectedCompany.name} on ${inspectionDate}`);
      setShowInspectionModal(false);
      setSelectedCompany(null);
      setInspectionDate('');
    } catch (err) {
      console.error('Schedule inspection error', err);
      alert('Failed to schedule inspection. Please try again.');
    }
  };

  const handleEnforcementAction = async () => {
    if (!enforcementAction.trim()) {
      alert('Please specify enforcement action details.');
      return;
    }

    try {
      await logRegulatorAlert({
        orgId: selectedCompany.id,
        severity: 'high',
        status: 'active',
        title: 'Enforcement Action Initiated',
        description: enforcementAction,
        metadata: {
          initiated_by: profile?.display_name || profile?.email || 'Regulator',
        },
      });

      alert(`Enforcement action initiated for ${selectedCompany.name}\nAction: ${enforcementAction}`);
      setShowEnforcementModal(false);
      setSelectedCompany(null);
      setEnforcementAction('');
    } catch (err) {
      console.error('Enforcement action error', err);
      alert('Failed to submit enforcement action. Please try again.');
    }
  };

  const handleSendNotice = async () => {
    try {
      await logRegulatorAlert({
        orgId: selectedCompany.id,
        severity: 'low',
        status: 'pending',
        title: 'Compliance Notice Issued',
        description: `Compliance notice sent to ${selectedCompany.name}`,
        metadata: {
          issued_by: profile?.display_name || profile?.email || 'Regulator',
        },
      });

      alert(`Compliance notice sent to ${selectedCompany.name}`);
      setSelectedCompany(null);
    } catch (err) {
      console.error('Send notice error', err);
      alert('Failed to send compliance notice. Please try again.');
    }
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { type: 'user', text: userMessage }]);

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

  if (dataError) {
    return (
      <div className="loading">
        <p className="error">Unable to load regulator data: {dataError.message}</p>
        <button className="sign-out-btn" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="regulator-dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <img src="/logo.png" alt="Logo" className="logo-icon" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
          <div className="header-info">
            <h2>Regulator Dashboard</h2>
            <p>Louisiana Department of Environmental Quality</p>
            <span className="role-badge regulator">Regulatory Portal</span>
          </div>
        </div>
        <div className="header-right">
          <div className="user-info">
            <span className="user-email">{profile?.display_name || 'Regulator'}</span>
          </div>
          <button className="sign-out-btn" onClick={handleSignOut}>
            Sign Out
          </button>
        </div>
      </header>

      <div className="dashboard-content">
        <div className="metrics-grid">
          <div className="metric-card clickable-card" onClick={() => setActiveTab('companies')}>
            <div className="metric-header">
              <span className="metric-label">Total Companies</span>
              <svg className="metric-icon" viewBox="0 0 24 24" fill="none">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <div className="metric-value">{totalCompanies}</div>
            <div className="metric-subtitle">Click to view organisations</div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-label">Total Emissions 2024</span>
              <svg className="metric-icon" viewBox="0 0 24 24" fill="none">
                <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <div className="metric-value">{totalEmissions}</div>
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
            <div className="metric-value">{averageCompliance}%</div>
            <div className="metric-change positive">↑ 2% improvement</div>
          </div>

          <div className="metric-card warning clickable-card" onClick={() => setActiveTab('alerts')}>
            <div className="metric-header">
              <span className="metric-label">Active Alerts</span>
              <svg className="metric-icon" viewBox="0 0 24 24" fill="none">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" strokeWidth="2"/>
                <line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="2"/>
                <line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <div className="metric-value">{activeAlertsCount}</div>
            <div className="metric-alert">Click to review</div>
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
        </div>


        {activeTab === 'overview' && (
          <div className="overview-section">
            <div className="companies-list">
              <h3>Companies</h3>
              <div className="company-items">
                {[
                  ...(companies || [])
                ].map((company, index) => (
                  <div key={index} className="company-item clickable-item" onClick={() => handleCompanyClick(company)}>
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
                    <div className="click-hint">Click for details</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ height: '50px' }}></div>
            
            <div className="charts-section">
              <div className="chart-card">
                <h3>Statewide Compliance Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={complianceTrend}>
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
                  <BarChart data={emissionsTrend}>
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
          </div>
        )}

        {activeTab === 'companies' && (
          <div className="companies-section">
            <div className="companies-header">
              <h3>Registered Companies</h3>
              <div className="header-controls">
                <div className="filter-container">
                  <select
                    value={companyStatusFilter}
                    onChange={(e) => setCompanyStatusFilter(e.target.value)}
                    className="status-filter"
                  >
                    <option value="all">All Status</option>
                    <option value="compliant">Compliant</option>
                    <option value="attention">Needs Attention</option>
                  </select>
                </div>
                <div className="search-container">
                  <input
                    type="text"
                    placeholder="Search"
                    value={companySearchTerm}
                    onChange={(e) => setCompanySearchTerm(e.target.value)}
                    className="company-search-input"
                  />
                  <span className="search-icon">🔍</span>
                </div>
              </div>
            </div>
            {filteredCompanies.length === 0 && companySearchTerm && (
              <div className="no-results">
                <p>No companies found matching "{companySearchTerm}"</p>
                <p className="search-hint">Try searching by company name, compliance status, or emissions data</p>
              </div>
            )}
            <div className="companies-grid">
              {filteredCompanies.map((company, index) => (
                <div key={company.id ?? index} className="company-detail-card">
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
                      <span className="metric-label">Daily Emissions</span>
                      <span className="metric-value">{company.emissions} t/day</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Documents</span>
                      <span className="metric-value">{company.documents} files</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Last Report</span>
                      <span className={`metric-value ${company.lastReport === 'Overdue' ? 'overdue' : ''}`}>
                        {company.lastReport}
                      </span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Last Submission</span>
                      <span className={`metric-value ${company.status === 'attention' ? 'overdue' : ''}`}>
                        {company.lastSubmission}
                      </span>
                    </div>
                  </div>
                  <div className="company-actions">
                    <button className="company-action-btn primary" onClick={(e) => {
                      e.stopPropagation();
                      handleCompanyClick(company);
                    }}>
                      View Details
                    </button>
                    <button className="company-action-btn secondary" onClick={() => setActiveTab('submissions')}>
                      View Documents
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'submissions' && (
          <div className="submissions-section">
            <div className="submissions-header">
              <h3>Document Submissions</h3>
              <div className="header-controls">
                <div className="filter-container">
                  <select
                    value={submissionStatusFilter}
                    onChange={(e) => setSubmissionStatusFilter(e.target.value)}
                    className="status-filter"
                  >
                    <option value="all">All Status</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="under_review">Under Review</option>
                    <option value="pending">Pending</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
                <div className="search-container">
                  <input
                    type="text"
                    placeholder="Search"
                    value={submissionSearchTerm}
                    onChange={(e) => setSubmissionSearchTerm(e.target.value)}
                    className="submission-search-input"
                  />
                  <span className="search-icon">🔍</span>
                </div>
              </div>
            </div>
            {filteredSubmissions.length === 0 && submissionSearchTerm && (
              <div className="no-results">
                <p>No submissions found matching "{submissionSearchTerm}"</p>
                <p className="search-hint">Try searching by company name, document name, type, or status</p>
              </div>
            )}
            <div className="submissions-list">
              {filteredSubmissions.map((submission, index) => (
                <div key={`${submission.company}-${submission.document}-${index}`} className={`submission-item ${submission.status}`}>
                  <div className="submission-info">
                    <h4>{submission.company}</h4>
                    <p><strong>{submission.document}</strong> • {submission.type}</p>
                    <span className="submission-date">Submitted: {submission.submitted}</span>
                  </div>
                  <div className="submission-meta">
                    <span className={`submission-status ${submission.status}`}>
                      {submission.status === 'approved'
                        ? 'Approved'
                        : submission.status === 'rejected'
                          ? 'Rejected'
                          : submission.status === 'under_review'
                            ? 'Under Review'
                            : submission.status === 'pending'
                              ? 'Pending Review'
                              : 'Action Required'}
                    </span>
                    <div style={{ marginTop: '8px' }}>
                      <span className="reviewer">Reviewer: {submission.reviewer}</span>
                    </div>
                  </div>
                  <button 
                    className="submission-action-btn"
                    onClick={() => handleDocumentReview(submission)}
                  >
                    {submission.status === 'approved' || submission.status === 'rejected' ? 'View' : 'Review'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="alerts-section">
            <div className="alerts-header">
              <h3>Active Alerts</h3>
              <div className="header-controls">
                <div className="filter-container">
                  <select
                    value={alertStatusFilter}
                    onChange={(e) => setAlertStatusFilter(e.target.value)}
                    className="status-filter"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="scheduled">Scheduled</option>
                  </select>
                  <select
                    value={alertSeverityFilter}
                    onChange={(e) => setAlertSeverityFilter(e.target.value)}
                    className="severity-filter"
                  >
                    <option value="all">All Severity</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div className="search-container">
                  <input
                    type="text"
                    placeholder="Search"
                    value={alertSearchTerm}
                    onChange={(e) => setAlertSearchTerm(e.target.value)}
                    className="alert-search-input"
                  />
                  <span className="search-icon">🔍</span>
                </div>
              </div>
            </div>
            {filteredAlerts.length === 0 && alertSearchTerm && (
              <div className="no-results">
                <p>No alerts found matching "{alertSearchTerm}"</p>
                <p className="search-hint">Try searching by company name, alert type, severity, or description</p>
              </div>
            )}
            <div className="alert-items">
              {filteredAlerts.map((alert) => (
                <div key={alert.id} className={`alert-item ${alert.severity}`}>
                  <div className={`alert-icon ${alert.severity}`}>
                    {alert.severity === 'high' && '⚠️'}
                    {alert.severity === 'medium' && '🔔'}
                    {alert.severity === 'low' && 'ℹ️'}
                  </div>
                  <div className="alert-content">
                    <h4>{alert.company}</h4>
                    <p><strong>{alert.type}:</strong> {alert.description}</p>
                    <span className="alert-date">{alert.timestamp}</span>
                  </div>
                  <div className="alert-status-badge">
                    <span className={`status-indicator ${alert.status}`}>
                      {alert.status.toUpperCase()}
                    </span>
                  </div>
                  <button className="alert-action-btn" onClick={() => handleAlertAction(alert)}>
                    {alert.status === 'active' ? 'Resolve' : alert.status === 'pending' ? 'Review' : 'View'}
                  </button>
                </div>
              ))}
            </div>
          </div>
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

      {selectedCompany && (
        <div className="modal-overlay" onClick={() => setSelectedCompany(null)}>
          <div className="modal-content company-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedCompany.name} - Detailed View</h2>
              <button className="modal-close" onClick={() => setSelectedCompany(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="company-overview">
                <div className="overview-stats">
                  <div className="stat-item">
                    <span className="stat-label">Compliance Rate</span>
                    <span className={`stat-value ${selectedCompany.compliance < 90 ? 'warning' : 'success'}`}>
                      {selectedCompany.compliance}%
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Daily Emissions</span>
                    <span className="stat-value">{selectedCompany.emissions} tons CO₂</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Status</span>
                    <span className={`stat-value ${selectedCompany.status}`}>
                      {selectedCompany.status === 'compliant' ? '✓ Compliant' : '⚠ Needs Attention'}
                    </span>
                  </div>
                </div>

                <div className="facilities-section">
                  <h3>Facilities</h3>
                  {selectedCompany.facilities?.map((facility, idx) => (
                    <div key={idx} className="facility-item">
                      <div className="facility-info">
                        <h4>{facility.name}</h4>
                        <p>{facility.location}</p>
                      </div>
                      <div className="facility-stats">
                        <span>{facility.emissions} tons CO₂/day</span>
                        <span className={`facility-status ${facility.status.toLowerCase()}`}>{facility.status}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="documents-section">
                  <h3>Recent Documents</h3>
                  {selectedCompany.recentDocuments?.map((doc, idx) => (
                    <div key={idx} className="document-item">
                      <div className="document-info">
                        <h4>{doc.name}</h4>
                        <p>Submitted: {doc.date}</p>
                      </div>
                      <span className={`document-status ${doc.status.toLowerCase().replace(' ', '-')}`}>
                        {doc.status}
                      </span>
                    </div>
                  ))}
                </div>

                {selectedCompany.violations?.length > 0 && (
                  <div className="violations-section">
                    <h3>Compliance Issues</h3>
                    {selectedCompany.violations.map((violation, idx) => (
                      <div key={idx} className={`violation-item ${violation.severity.toLowerCase()}`}>
                        <div className="violation-info">
                          <h4>{violation.type}</h4>
                          <p>{violation.date} • {violation.severity} Severity</p>
                        </div>
                        <span className={`violation-status ${violation.resolved ? 'resolved' : 'pending'}`}>
                          {violation.resolved ? '✓ Resolved' : '⚠ Pending'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="action-btn secondary" onClick={() => setShowInspectionModal(true)}>
                Schedule Inspection
              </button>
              <button className="action-btn primary" onClick={() => setShowEnforcementModal(true)}>
                Enforcement Action
              </button>
              <button className="action-btn warning" onClick={handleSendNotice}>
                Send Notice
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedSubmission && (
        <div className="modal-overlay" onClick={() => setSelectedSubmission(null)}>
          <div className="modal-content document-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Document Review - {selectedSubmission.company}</h2>
              <button className="modal-close" onClick={() => setSelectedSubmission(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="document-details">
                <div className="document-info">
                  <h3>{selectedSubmission.document || selectedSubmission.type}</h3>
                  <div className="document-meta">
                    <p><strong>Submitted:</strong> {selectedSubmission.submitted || selectedSubmission.date}</p>
                    <p><strong>File Size:</strong> {selectedSubmission.details?.fileSize}</p>
                    <p><strong>Pages:</strong> {selectedSubmission.details?.pages}</p>
                    <p><strong>Submitted By:</strong> {selectedSubmission.details?.submittedBy}</p>
                    <p><strong>Review Deadline:</strong> {selectedSubmission.details?.reviewDeadline}</p>
                  </div>
                </div>

                {selectedSubmission.details?.complianceIssues?.length > 0 && (
                  <div className="compliance-issues">
                    <h4>Identified Issues:</h4>
                    <ul>
                      {selectedSubmission.details.complianceIssues.map((issue, idx) => (
                        <li key={idx} className="issue-item">{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="review-section">
                  <label htmlFor="reviewComment">Review Comments:</label>
                  <textarea
                    id="reviewComment"
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Enter your review comments, feedback, or reasons for approval/rejection..."
                    rows="4"
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="action-btn secondary" onClick={handlePreviewDocument}>
                Preview Document
              </button>
              <button
                className="action-btn danger"
                onClick={handleRejectDocument}
                disabled={documentActionLoading}
              >
                Reject
              </button>
              <button
                className="action-btn success"
                onClick={handleApproveDocument}
                disabled={documentActionLoading}
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedAlert && (
        <div className="modal-overlay" onClick={() => setSelectedAlert(null)}>
          <div className="modal-content alert-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Alert Details - {selectedAlert.company}</h2>
              <button className="modal-close" onClick={() => setSelectedAlert(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="alert-details">
                <div className={`alert-status ${selectedAlert.severity}`}>
                  <span className="severity-badge">{selectedAlert.severity.toUpperCase()} PRIORITY</span>
                  <h3>{selectedAlert.message}</h3>
                  <p>Reported: {selectedAlert.date}</p>
                </div>

                <div className="alert-info">
                  <h4>Additional Information:</h4>
                  <div className="info-grid">
                    <div className="info-item">
                      <span className="info-label">Reported By:</span>
                      <span>{selectedAlert.details?.reportedBy}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Affected Facilities:</span>
                      <span>{selectedAlert.details?.affectedFacilities}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Estimated Impact:</span>
                      <span>{selectedAlert.details?.estimatedImpact}</span>
                    </div>
                  </div>
                </div>

                <div className="recommended-actions">
                  <h4>Recommended Actions:</h4>
                  <ul>
                    {selectedAlert.details?.recommendedActions?.map((action, idx) => (
                      <li key={idx}>{action}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="action-btn secondary" onClick={() => {
                alert(`Investigation initiated for ${selectedAlert.company}`);
                setSelectedAlert(null);
              }}>
                Start Investigation
              </button>
              <button className="action-btn primary" onClick={() => {
                alert(`Alert escalated to supervisor for ${selectedAlert.company}`);
                setSelectedAlert(null);
              }}>
                Escalate
              </button>
              <button className="action-btn success" onClick={() => {
                alert(`Alert resolved for ${selectedAlert.company}`);
                setSelectedAlert(null);
              }}>
                Mark Resolved
              </button>
            </div>
          </div>
        </div>
      )}

      {showInspectionModal && (
        <div className="modal-overlay" onClick={() => setShowInspectionModal(false)}>
          <div className="modal-content inspection-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Schedule Inspection - {selectedCompany?.name}</h2>
              <button className="modal-close" onClick={() => setShowInspectionModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="inspection-form">
                <div className="form-group">
                  <label htmlFor="inspectionDate">Inspection Date:</label>
                  <input
                    type="date"
                    id="inspectionDate"
                    value={inspectionDate}
                    onChange={(e) => setInspectionDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="form-group">
                  <label>Inspection Type:</label>
                  <select defaultValue="routine">
                    <option value="routine">Routine Compliance Check</option>
                    <option value="follow-up">Follow-up Inspection</option>
                    <option value="complaint">Complaint Investigation</option>
                    <option value="emergency">Emergency Response</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Priority Level:</label>
                  <select defaultValue="normal">
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="action-btn secondary" onClick={() => setShowInspectionModal(false)}>
                Cancel
              </button>
              <button className="action-btn primary" onClick={handleScheduleInspection}>
                Schedule Inspection
              </button>
            </div>
          </div>
        </div>
      )}

      {showEnforcementModal && (
        <div className="modal-overlay" onClick={() => setShowEnforcementModal(false)}>
          <div className="modal-content enforcement-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Enforcement Action - {selectedCompany?.name}</h2>
              <button className="modal-close" onClick={() => setShowEnforcementModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="enforcement-form">
                <div className="form-group">
                  <label>Action Type:</label>
                  <select defaultValue="">
                    <option value="">Select Action Type</option>
                    <option value="warning">Official Warning</option>
                    <option value="fine">Monetary Fine</option>
                    <option value="suspension">License Suspension</option>
                    <option value="remediation">Mandatory Remediation</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="enforcementAction">Action Details:</label>
                  <textarea
                    id="enforcementAction"
                    value={enforcementAction}
                    onChange={(e) => setEnforcementAction(e.target.value)}
                    placeholder="Describe the enforcement action, violations found, and required corrective measures..."
                    rows="4"
                  />
                </div>
                <div className="form-group">
                  <label>Compliance Deadline:</label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="action-btn secondary" onClick={() => setShowEnforcementModal(false)}>
                Cancel
              </button>
              <button className="action-btn danger" onClick={handleEnforcementAction}>
                Issue Enforcement Action
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RegulatorDashboard;
