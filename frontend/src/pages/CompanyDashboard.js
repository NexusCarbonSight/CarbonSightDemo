import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './CompanyDashboard.css';
import ClimateTraceData from '../components/ClimateTraceData';
import { useAuth } from '../context/AuthContext';
import { useCompanyDashboardData } from '../hooks/useCompanyDashboardData';
import { getHuggingFaceService } from '../services/huggingfaceService';
import { supabase } from '../lib/supabaseClient';

const DOCUMENT_BUCKET = 'documents';

function CompanyDashboard() {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const { data: dashboardData, loading: dataLoading, error: dataError } = useCompanyDashboardData(profile);
  const [pageLoading, setPageLoading] = useState(true);
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [dismissedRecs, setDismissedRecs] = useState([]);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { type: 'ai', text: 'Hello! I\'m your AI assistant. I can help you with emissions analysis, compliance recommendations, and operational insights. What would you like to know?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentsError, setDocumentsError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const uploadInputRef = useRef(null);
  const modalUploadInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);

  // NEW: scraped regulatory deadlines state
  const [deadlines, setDeadlines] = useState([]);
  const [deadlinesLoading, setDeadlinesLoading] = useState(true);
  const [deadlinesError, setDeadlinesError] = useState(null);

  // Fetch AI recommendations using HuggingFace
  const fetchAIInsights = useCallback(async () => {
    if (!dashboardData?.orgId) return;
    
    setAiLoading(true);
    try {
      const hfService = getHuggingFaceService();
      
      // Get existing recommendations from database
      const { data: existingRecs } = await supabase
        .from('recommendations')
        .select('*')
        .eq('org_id', dashboardData.orgId)
        .eq('is_implemented', false)
        .order('created_at', { ascending: false });
      
      // If we have existing AI recommendations less than 24 hours old, use them
      const recentAiRecs = existingRecs?.filter(rec => {
        const isRecent = new Date(rec.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000);
        return rec.is_ai_generated && isRecent;
      }) || [];
      
      let aiRecs = [];
      
      // Only generate new recommendations if we don't have recent ones
      if (recentAiRecs.length === 0) {
        aiRecs = await hfService.generateComplianceRecommendations(
          dashboardData?.emissionsData || [],
          dashboardData?.complianceTasks || [],
          dashboardData?.facilities || []
        );
        
        // Save new AI recommendations to database
        if (aiRecs.length > 0) {
          const recsToInsert = aiRecs.map(rec => ({
            org_id: dashboardData.orgId,
            title: rec.title,
            description: rec.description,
            impact: rec.impact,
            category: rec.category,
            estimated_reduction: rec.estimated_reduction,
            timeline: rec.timeline,
            is_ai_generated: true,
            is_implemented: false,
            metadata: {}
          }));
          
          const { data: inserted, error: insertError } = await supabase
            .from('recommendations')
            .insert(recsToInsert)
            .select();
          
          if (insertError) {
            console.error('Failed to save AI recommendations:', insertError);
          } else {
            aiRecs = inserted;
          }
        }
      } else {
        aiRecs = recentAiRecs;
      }
      
      // aiRecs already contains all database recommendations, no need to merge
      const allRecs = aiRecs.filter(rec => !dismissedRecs.includes(rec.id));
      
      setAiRecommendations(allRecs);
    } catch (error) {
      console.error('Failed to fetch AI insights:', error);
      setAiRecommendations(dashboardData?.recommendations || []);
    } finally {
      setAiLoading(false);
    }
  }, [dashboardData?.orgId, dashboardData?.recommendations, dashboardData?.emissionsData, dashboardData?.complianceTasks, dashboardData?.facilities, dismissedRecs]);

  const fetchDocuments = useCallback(async () => {
    if (!dashboardData?.orgId) return;

    setDocumentsLoading(true);
    setDocumentsError(null);
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('id, name, document_type, status, storage_object_path, uploaded_at, metadata')
        .eq('org_id', dashboardData.orgId)
        .order('uploaded_at', { ascending: false })
        .limit(50);

      if (error) {
        throw error;
      }

      const normalized = (data || []).map((doc) => ({
        id: doc.id,
        name: doc.name,
        type: doc.document_type,
        status: doc.status,
        date: doc.uploaded_at
          ? new Date(doc.uploaded_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
          : 'Just now',
        storagePath: doc.storage_object_path,
        metadata: doc.metadata,
      }));

      setUploadedFiles(normalized);
    } catch (err) {
      console.error('Failed to load documents', err);
      setDocumentsError(err);
    } finally {
      setDocumentsLoading(false);
    }
  }, [dashboardData?.orgId]);

  // NEW: helper to format deadline dates from deadlines.json
  const formatDeadlineDate = (dateStr) => {
    if (!dateStr) return 'Date TBA';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // NEW: load scraped deadlines from public/deadlines.json
  useEffect(() => {
    const loadDeadlines = async () => {
      try {
        setDeadlinesLoading(true);
        setDeadlinesError(null);

        const res = await fetch('/deadlines.json');
        if (!res.ok) {
          throw new Error(`Failed to load deadlines.json (status ${res.status})`);
        }
        const raw = await res.json();

        // Handle your structure: { generated_at, count, deadlines: [ ... ] }
        const list = Array.isArray(raw)
          ? raw
          : (Array.isArray(raw.deadlines) ? raw.deadlines : []);

        const normalized = list
          .map((d, idx) => ({
            id: d.id || idx,
            source: d.source || 'Unknown source',
            jurisdiction: d.jurisdiction || 'Unknown',
            title: d.title || 'Untitled deadline',
            // Prefer the human-friendly text if present
            description: d.deadline_text || d.raw_line || '',
            // Use ISO date when present so we can sort + format
            deadline: d.deadline_date || null,
            url: d.source_url || null,
            _dateObj: d.deadline_date ? new Date(d.deadline_date) : null
          }))
          .sort((a, b) => {
            if (!a._dateObj && !b._dateObj) return 0;
            if (!a._dateObj) return 1;
            if (!b._dateObj) return -1;
            return a._dateObj - b._dateObj;
          });

        setDeadlines(normalized);
      } catch (err) {
        console.error('Error loading scraped deadlines:', err);
        setDeadlinesError(err);
        setDeadlines([]);
      } finally {
        setDeadlinesLoading(false);
      }
    };

    loadDeadlines();
  }, []);

  // Handle recommendation action - opens detailed modal
  const handleRecommendationAction = (recommendation) => {
    setSelectedRecommendation(recommendation);
  };

  // Dismiss a recommendation
  const handleDismissRecommendation = async (recId, e) => {
    e.stopPropagation();
    
    try {
      // Delete from database
      const { error } = await supabase
        .from('recommendations')
        .delete()
        .eq('id', recId);
      
      if (error) throw error;
      
      // Update local state
      setDismissedRecs(prev => [...prev, recId]);
      setAiRecommendations(prev => prev.filter(rec => rec.id !== recId));
    } catch (error) {
      console.error('Failed to dismiss recommendation:', error);
    }
  };

  // Mark recommendation as complete/implemented
  const handleCompleteRecommendation = async (recId, e) => {
    if (e) e.stopPropagation();
    
    try {
      const { error } = await supabase
        .from('recommendations')
        .update({ is_implemented: true })
        .eq('id', recId);
      
      if (error) throw error;
      
      setAiRecommendations(prev => prev.filter(rec => rec.id !== recId));
      setSelectedRecommendation(null);
    } catch (error) {
      console.error('Failed to mark recommendation as complete:', error);
    }
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

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    if (!dashboardData?.orgId) {
      alert('Organisation context not ready yet. Please wait a moment and try again.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      for (const file of files) {
        const safeName = file.name.replace(/\s+/g, '_');
        const uniqueId = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Date.now().toString();
        const storagePath = `${dashboardData.orgId}/${uniqueId}-${safeName}`;

        const { data: uploadData, error: uploadError } = await supabase
          .storage
          .from(DOCUMENT_BUCKET)
          .upload(storagePath, file, {
            upsert: false,
            contentType: file.type || 'application/octet-stream',
          });

        if (uploadError) {
          throw uploadError;
        }

        const { error: insertError } = await supabase
          .from('documents')
          .insert({
            org_id: dashboardData.orgId,
            name: file.name,
            document_type: 'compliance',
            status: 'pending',
            storage_object_path: uploadData?.path || storagePath,
            metadata: {
              size: file.size,
              uploaded_from: 'company_dashboard',
            },
          });

        if (insertError) {
          throw insertError;
        }
      }

      await fetchDocuments();
      alert(`${files.length} document(s) uploaded successfully.`);
      setShowDocumentUpload(false);
    } catch (err) {
      console.error('File upload failed', err);
      setUploadError(err);
      alert(`Upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
      if (event?.target) {
        event.target.value = '';
      }
    }
  };

  const handleDocumentView = async (file) => {
    if (!file?.storagePath) {
      alert('This document does not have a stored file yet.');
      return;
    }

    try {
      const { data, error } = await supabase
        .storage
        .from(DOCUMENT_BUCKET)
        .createSignedUrl(file.storagePath, 60);

      if (error) {
        throw error;
      }

      window.open(data.signedUrl, '_blank', 'noopener');
    } catch (err) {
      console.error('Failed to open document', err);
      alert(`Unable to open document: ${err.message}`);
    }
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { type: 'user', text: userMessage }]);

    // Generate AI response using HuggingFace with comprehensive company context
    try {
      const hfService = getHuggingFaceService();
      const context = {
        companyName: dashboardData?.company,
        emissionsRate: dashboardData?.emissionsRate,
        emissionsChange: dashboardData?.emissionsChange,
        facilities: dashboardData?.facilities || [],
        complianceStatus: dashboardData?.complianceStatus,
        complianceTasks: dashboardData?.complianceTasks || [],
        recentActivities: dashboardData?.activities?.slice(0, 5) || [],
        recommendations: aiRecommendations.slice(0, 3)
      };
      
      const aiResponse = await hfService.generateChatResponse(userMessage, context);
      setChatMessages(prev => [...prev, { type: 'ai', text: aiResponse }]);
    } catch (error) {
      console.error('Chat error:', error);
      const fallbackResponse = generateAIResponse(userMessage);
      setChatMessages(prev => [...prev, { type: 'ai', text: fallbackResponse }]);
    }
  };

  const generateAIResponse = (userInput) => {
    const hfService = getHuggingFaceService();
    const context = {
      companyName: dashboardData?.company,
      emissionsRate: dashboardData?.emissionsRate,
      emissionsChange: dashboardData?.emissionsChange,
      facilities: dashboardData?.facilities || [],
      complianceStatus: dashboardData?.complianceStatus,
      complianceTasks: dashboardData?.complianceTasks || []
    };
    return hfService.getFallbackChatResponse(userInput, context);
  };

  useEffect(() => {
    if (!dataLoading) {
      fetchAIInsights();
      const timeout = setTimeout(() => setPageLoading(false), 500);
      return () => clearTimeout(timeout);
    }
  }, [dataLoading, fetchAIInsights]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const isLoading = pageLoading || dataLoading;

  if (isLoading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (dataError) {
    return (
      <div className="loading">
        <p className="error">Unable to load dashboard data: {dataError.message}</p>
        <button className="sign-out-btn" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="company-dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <img src="/logo.png" alt="Logo" className="logo-icon" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
          <div className="header-info">
            <h2>Company Dashboard</h2>
            <p>Welcome, {profile?.display_name || dashboardData.company}</p>
            <span className="role-badge">Company Portal</span>
          </div>
        </div>
        <div className="header-right">
        <div className="user-info">
          <span className="user-email">
            {profile?.metadata?.company_name
              || dashboardData?.company
              || profile?.display_name
              || profile?.metadata?.email
              || 'Company'}
          </span>
        </div>
          <button className="sign-out-btn" onClick={handleSignOut}>
            Sign Out
          </button>
        </div>
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
                    <div key={rec.id || index} className={`recommendation-card ${rec.impact}-impact`}>
                      <div className="rec-header">
                        <div className="rec-icon">
                          {rec.impact === 'high' && '⚠️'}
                          {rec.impact === 'medium' && '🎯'}
                          {rec.impact === 'low' && '💡'}
                        </div>
                        <span className={`impact-badge ${rec.impact}`}>
                          {rec.impact} impact
                        </span>
                        {rec.is_ai_generated && (
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
                            {rec.estimated_reduction ? `${rec.estimated_reduction} tons CO₂/year` : (rec.action || 'Take action')}
                          </span>
                        </div>
                        <div className="rec-actions">
                          <button 
                            className="rec-dismiss-btn"
                            onClick={(e) => handleDismissRecommendation(rec.id, e)}
                            title="Dismiss recommendation"
                          >
                            Dismiss
                          </button>
                          <button className="rec-action-btn" onClick={() => handleRecommendationAction(rec)}>
                            <svg viewBox="0 0 24 24" fill="none">
                              <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2"/>
                            </svg>
                          </button>
                        </div>
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
                      ref={uploadInputRef}
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.xlsx,.xls"
                      onChange={handleFileUpload}
                      className="file-input"
                      disabled={isUploading}
                    />
                    <button
                      className="upload-btn"
                      onClick={() => uploadInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      {isUploading ? 'Uploading…' : 'Choose Files'}
                    </button>
                    {uploadError && (
                      <p className="upload-error">Upload failed: {uploadError.message}</p>
                    )}
                  </div>
                </div>

                <div className="documents-list">
                  <h4>Uploaded Documents</h4>
                  {documentsError && (
                    <p className="document-error">Unable to load documents: {documentsError.message}</p>
                  )}
                  {documentsLoading ? (
                    <p className="document-status">Loading documents…</p>
                  ) : uploadedFiles.length === 0 ? (
                    <p className="document-status">No documents uploaded yet.</p>
                  ) : (
                    uploadedFiles.map((file) => (
                      <div key={file.id || file.name} className="document-item">
                        <div className="document-icon">
                          {file.name?.toLowerCase().endsWith('.pdf') ? '📄' : '📊'}
                        </div>
                        <div className="document-info">
                          <h5>{file.name}</h5>
                          <p>Type: {file.type || 'compliance'} • Uploaded: {file.date || 'Just now'}</p>
                        </div>
                        <span className={`document-status ${file.status}`}>
                          {file.status === 'approved' ? '✅ Approved' :
                           file.status === 'under_review' ? '🔍 Under Review' :
                           file.status === 'rejected' ? '⚠ Rejected' : '⏳ Pending'}
                        </span>
                        <button
                          className="document-action-btn"
                          onClick={() => handleDocumentView(file)}
                          disabled={!file.storagePath}
                        >
                          View
                        </button>
                      </div>
                    ))
                  )}
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
<p>Company facilities and environmental impact across your locations</p>
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

            {/* NEW: scraped regulatory deadlines section below the tasks */}
            <div className="deadlines-section">
              <div className="deadlines-header">
                <h3>Regulatory Deadlines (Extra)</h3>
                <p>
                  Live filing and reporting deadlines from Louisiana and national
                  climate / air regulations
                </p>
              </div>

              {deadlinesLoading && (
                <div className="deadlines-loading">Loading deadlines…</div>
              )}

              {deadlinesError && !deadlinesLoading && (
                <p className="deadlines-error">
                  Couldn&apos;t load scraped deadlines: {deadlinesError.message}
                </p>
              )}

              {!deadlinesLoading && !deadlinesError && deadlines.length === 0 && (
                <p className="deadlines-empty">
                  No deadlines found in <code>deadlines.json</code>. Run the scraper
                  to populate this list.
                </p>
              )}

              {!deadlinesLoading && !deadlinesError && deadlines.length > 0 && (
                <div className="deadlines-grid">
                  {deadlines.map((d) => (
                    <div key={d.id} className="deadline-card">
                      <div className="deadline-top-row">
                        <span className="deadline-title">{d.title}</span>
                        <span className="deadline-date">
                          {formatDeadlineDate(d.deadline)}
                        </span>
                      </div>
                      <div className="deadline-meta-row">
                        <span className="deadline-jurisdiction">{d.jurisdiction}</span>
                        <span className="deadline-source">{d.source}</span>
                      </div>
                      {d.description && (
                        <p className="deadline-description">{d.description}</p>
                      )}
                      {d.url && (
                        <a
                          href={d.url}
                          target="_blank"
                          rel="noreferrer"
                          className="deadline-link"
                        >
                          View source
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
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
                <button className="btn-primary" onClick={() => handleCompleteRecommendation(selectedRecommendation.id)}>
                  ✓ Mark as Complete
                </button>
                <button className="btn-secondary" onClick={() => setSelectedRecommendation(null)}>
                  Close
                </button>
                {uploadError && (
                  <p className="upload-error">Upload failed: {uploadError.message}</p>
                )}
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
                  ref={modalUploadInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.xlsx,.xls"
                  onChange={handleFileUpload}
                  className="file-input"
                  disabled={isUploading}
                />
                <button
                  className="upload-btn-modal"
                  onClick={() => modalUploadInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? 'Uploading…' : 'Select Document'}
                </button>
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


