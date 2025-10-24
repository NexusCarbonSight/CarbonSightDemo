import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage';
import CompanyDashboard from './pages/CompanyDashboard';
import PublicDashboard from './pages/PublicDashboard';
import RegulatorDashboard from './pages/RegulatorDashboard';
import './App.css';

import CompanySignIn from './pages/CompanySignIn';
import RegulatorSignIn from './pages/RegulatorSignIn';

function RequireCompanyAuth({ children }) {
  const location = useLocation();
  const authed = sessionStorage.getItem('company_authed') === 'true';
  return authed ? children : <Navigate to="/company-signin" replace state={{ from: location.pathname }} />;
}

function RequireRegulatorAuth({ children }) {
  const location = useLocation();
  const authed = sessionStorage.getItem('regulator_authed') === 'true';
  return authed ? children : <Navigate to="/regulator-signin" replace state={{ from: location.pathname }} />;
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
              <RequireCompanyAuth>
                <CompanyDashboard />
              </RequireCompanyAuth>
            }
          />
          <Route
            path="/regulator"
            element={
              <RequireRegulatorAuth>
                <RegulatorDashboard />
              </RequireRegulatorAuth>
            }
          />

          <Route path="/public" element={<PublicDashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}
