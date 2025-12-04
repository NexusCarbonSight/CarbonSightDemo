import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage';
import CompanyDashboard from './pages/CompanyDashboard';
import PublicDashboard from './pages/PublicDashboard';
import RegulatorDashboard from './pages/RegulatorDashboard';
import './App.css';

import CompanySignIn from './pages/CompanySignIn';
import RegulatorSignIn from './pages/RegulatorSignIn';
import AuthCallback from './pages/AuthCallback';
import ErrorBoundary from './components/ErrorBoundary';
import { useAuth } from './context/AuthContext';

function CompanyRoute({ children }) {
  const location = useLocation();
  const { user, profile, loading, grantedAccess, grantAccess } = useAuth();

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

  if (grantedAccess === 'company') {
    console.log('CompanyRoute: KEEPING PREVIOUS COMPANY ACCESS GRANT');
    return children;
  }

  const intendedRole = sessionStorage.getItem('intended_role');
  
  if (profile?.role === 'company' || profile?.role === 'admin' || intendedRole === 'company') {
    console.log('CompanyRoute: ✅ ACCESS GRANTED - role:', profile?.role, 'intended:', intendedRole);
    grantAccess('company');
    if (intendedRole === 'company') {
      console.log('CompanyRoute: Clearing intended role after granting access');
      sessionStorage.removeItem('intended_role');
    }
    return children;
  }

  if (profile?.role === 'regulator') {
    return <Navigate to="/regulator" replace />;
  }
  
  return <Navigate to="/public" replace />;
}

function RegulatorRoute({ children }) {
  const location = useLocation();
  const { user, profile, loading, grantedAccess, grantAccess } = useAuth();

  console.log('RegulatorRoute: Checking access');
  console.log('RegulatorRoute: User:', !!user);
  console.log('RegulatorRoute: Profile role:', profile?.role);
  console.log('RegulatorRoute: Loading:', loading);
  console.log('RegulatorRoute: Previously granted access:', grantedAccess);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user) {
    console.log('RegulatorRoute: No user, redirecting to sign-in');
    return <Navigate to="/regulator-signin" replace state={{ from: location.pathname }} />;
  }

  if (grantedAccess === 'regulator') {
    console.log('RegulatorRoute: KEEPING PREVIOUS REGULATOR ACCESS GRANT');
    return children;
  }

  const intendedRole = sessionStorage.getItem('intended_role');
  console.log('RegulatorRoute: Intended role from sessionStorage:', intendedRole);
  
  if (profile?.role === 'regulator' || profile?.role === 'admin' || intendedRole === 'regulator') {
    console.log('RegulatorRoute: ✅ ACCESS GRANTED - role:', profile?.role, 'intended:', intendedRole);
    grantAccess('regulator');
    if (intendedRole === 'regulator') {
      console.log('RegulatorRoute: Clearing intended role after granting access');
      sessionStorage.removeItem('intended_role');
    }
    return children;
  }

  if (profile?.role === 'company') {
    console.log('RegulatorRoute: User has company role, redirecting to company dashboard');
    return <Navigate to="/company" replace />;
  }
  
  console.log('RegulatorRoute: No proper access, redirecting to public dashboard');
  return <Navigate to="/public" replace />;
}

export default function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />

          <Route path="/company-signin" element={<CompanySignIn />} />
          <Route path="/regulator-signin" element={<RegulatorSignIn />} />
          <Route path="/auth/callback" element={
            <ErrorBoundary>
              <AuthCallback />
            </ErrorBoundary>
          } />

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
