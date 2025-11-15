import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage';
import CompanyDashboard from './pages/CompanyDashboard';
import PublicDashboard from './pages/PublicDashboard';
import RegulatorDashboard from './pages/RegulatorDashboard';
import './App.css';

import CompanySignIn from './pages/CompanySignIn';
import RegulatorSignIn from './pages/RegulatorSignIn';
import { useAuth } from './context/AuthContext';

function CompanyRoute({ children }) {
  const location = useLocation();
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/company-signin" replace state={{ from: location.pathname }} />;
  }

  if (profile?.role !== 'company' && profile?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
}

function RegulatorRoute({ children }) {
  const location = useLocation();
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/regulator-signin" replace state={{ from: location.pathname }} />;
  }

  if (profile?.role !== 'regulator' && profile?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />

          {/* Sign-in pages */}
          <Route path="/company-signin" element={<CompanySignIn />} />
          <Route path="/regulator-signin" element={<RegulatorSignIn />} />

          {/* Protected dashboards */}
          <Route
            path="/company"
            element={
              <CompanyRoute>
                <CompanyDashboard />
              </CompanyRoute>
            }
          />
          <Route
            path="/regulator"
            element={
              <RegulatorRoute>
                <RegulatorDashboard />
              </RegulatorRoute>
            }
          />

          <Route path="/public" element={<PublicDashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}
