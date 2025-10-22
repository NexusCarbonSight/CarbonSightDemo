import React from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';

function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      <nav className="home-nav">
        <div className="nav-brand">
          <div className="logo-icon">CS</div>
          <span className="brand-name">CarbonSight</span>
        </div>
        <div className="nav-links">
          <a href="#contact" onClick={(e) => {e.preventDefault(); alert('Contact: CarbonSight Support\nEmail: support@carbonsight.la.gov\nPhone: (225) 555-0123');}}>Contact</a>
          <a href="#about" onClick={(e) => {e.preventDefault(); alert('CarbonSight is Louisiana\'s premier carbon tracking platform for industrial facilities. We help companies monitor emissions, ensure compliance, and contribute to a sustainable future.');}}>About</a>
        </div>
      </nav>

      <div className="home-content">
        <div className="hero-section">
          <h1 className="hero-title">
            <span className="carbon">Carbon</span>
            <span className="sight">Sight</span>
          </h1>
          <p className="hero-subtitle">Tracking Environmental Impact Together</p>
          <p className="hero-description">
            Carbon dioxide tracking and reporting platform for Louisiana's industrial facilities.
            <br />
            Monitor emissions, ensure compliance, and contribute to a sustainable future.
          </p>
        </div>

        <div className="portal-cards">
          <div className="portal-card company-portal">
            <div className="portal-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 22V12H15V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3>Company Sign In</h3>
            <p>Access your compliance dashboard, track emissions, and manage regulatory requirements.</p>
            <button className="portal-btn company-btn" onClick={() => navigate('/company')}>
              Company Portal
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          <div className="portal-card public-portal">
            <div className="portal-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3>Public Access</h3>
            <p>View public compliance data, environmental reports, and industry trends.</p>
            <button className="portal-btn public-btn" onClick={() => navigate('/public')}>
              View Public Data
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          <div className="portal-card regulator-portal">
            <div className="portal-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3>Regulator Sign In</h3>
            <p>Monitor compliance across industries, review submissions, and enforce regulations.</p>
            <button className="portal-btn regulator-btn" onClick={() => navigate('/regulator')}>
              Regulator Portal
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <footer className="home-footer">
        <p>© 2025 Louisiana CCUS Tracker. Leading the clean energy future.</p>
      </footer>
    </div>
  );
}

export default HomePage;
