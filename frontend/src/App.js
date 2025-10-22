import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import CompanyDashboard from './pages/CompanyDashboard';
import PublicDashboard from './pages/PublicDashboard';
import RegulatorDashboard from './pages/RegulatorDashboard';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/company" element={<CompanyDashboard />} />
          <Route path="/public" element={<PublicDashboard />} />
          <Route path="/regulator" element={<RegulatorDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
