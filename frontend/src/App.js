import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import CompanyDashboard from './pages/CompanyDashboard';
import PublicDashboard from './pages/PublicDashboard';
import RegulatorDashboard from './pages/RegulatorDashboard';
import './App.css';


import CompanySignIn from './pages/CompanySignIn';
import RegulatorSignIn from './pages/RegulatorSignIn';


function RequireCompanyAuth({ children }) {
  const authed = localStorage.getItem('company_authed') === 'true';
  return authed ? children : <Navigate to="/company-signin" replace />;
}

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />

          
          <Route path="/company-signin" element={<CompanySignIn />} />
          <Route path="/regulator-signin" element={<RegulatorSignIn />} />

        
          <Route
            path="/company"
            element={
              <RequireCompanyAuth>
                <CompanyDashboard />
              </RequireCompanyAuth>
            }
          />

          <Route path="/public" element={<PublicDashboard />} />
          <Route path="/regulator" element={<RegulatorDashboard />} />

        
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
