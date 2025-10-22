import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './PublicDashboard.css';

function PublicDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // Sample data for charts
  const emissionsData = [
    { year: '2020', Agriculture: 5, Buildings: 105, Total: 110 },
    { year: '2021', Agriculture: 5.5, Buildings: 110, Total: 115.5 },
    { year: '2022', Agriculture: 5, Buildings: 115, Total: 120 },
    { year: '2023', Agriculture: 5, Buildings: 120, Total: 125 },
    { year: '2024', Agriculture: 4, Buildings: 115, Total: 119 },
    { year: '2025', Agriculture: 3, Buildings: 70, Total: 73 }
  ];

  const sectorData = [
    { name: 'Buildings', value: 86, color: '#34d3fd' },
    { name: 'Agriculture', value: 4, color: '#a78bfa' }
  ];

  const regionalData = [
    { region: 'Baton Rouge', emissions: 45, facilities: 12 },
    { region: 'Lake Charles', emissions: 35, facilities: 10 },
    { region: 'New Orleans', emissions: 30, facilities: 8 },
    { region: 'Lafayette', emissions: 27, facilities: 8 },
    { region: 'Shreveport', emissions: 15, facilities: 4 }
  ];

  useEffect(() => {
    setTimeout(() => setLoading(false), 800);
  }, []);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="public-dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate('/')}>
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2"/>
            </svg>
            Back to Home
          </button>
          <div className="logo-icon">CS</div>
          <h2>Public Dashboard</h2>
        </div>
      </header>

      <div className="dashboard-content">
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-label">Total Emissions 2024</span>
              <svg className="metric-icon" viewBox="0 0 24 24" fill="none">
                <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <div className="metric-value">126.5M</div>
            <div className="metric-change negative">↑ 1% vs 2023</div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-label">Active Facilities</span>
              <svg className="metric-icon" viewBox="0 0 24 24" fill="none">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <div className="metric-value">158</div>
            <div className="metric-subtitle">Across Louisiana</div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-label">Compliance Rate</span>
              <svg className="metric-icon" viewBox="0 0 24 24" fill="none">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2"/>
                <polyline points="22 4 12 14.01 9 11.01" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <div className="metric-value">96%</div>
            <div className="metric-change positive">↑ 3% improvement</div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-label">Regions</span>
              <svg className="metric-icon" viewBox="0 0 24 24" fill="none">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <div className="metric-value">5</div>
            <div className="metric-subtitle">Major hubs</div>
          </div>
        </div>

        <div className="charts-row">
          <div className="chart-card large">
            <h3>Annual Emissions Trend (Million Tons CO₂)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={emissionsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a3351" />
                <XAxis dataKey="year" stroke="#8892b0" />
                <YAxis stroke="#8892b0" domain={[0, 140]} />
                <Tooltip 
                  contentStyle={{ 
                    background: '#1a1f3a', 
                    border: '1px solid #34d3fd',
                    borderRadius: '8px',
                    color: '#fff'
                  }} 
                />
                <Legend />
                <Line type="monotone" dataKey="Agriculture" stroke="#a78bfa" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Buildings" stroke="#34d3fd" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Total" stroke="#10b981" strokeWidth={3} dot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card small">
            <h3>Emissions by Sector</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sectorData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {sectorData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    background: '#1a1f3a', 
                    border: '1px solid #34d3fd',
                    borderRadius: '8px'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="legend-custom">
              {sectorData.map((entry, index) => (
                <div key={index} className="legend-item">
                  <div className="legend-color" style={{ background: entry.color }}></div>
                  <span className="legend-label">{entry.name}</span>
                  <span className="legend-value">{entry.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="chart-card full">
          <h3>Regional Breakdown</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={regionalData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a3351" />
              <XAxis dataKey="region" stroke="#8892b0" />
              <YAxis yAxisId="left" stroke="#8892b0" label={{ value: 'Emissions (M Tons)', angle: -90, position: 'insideLeft', fill: '#8892b0' }} />
              <YAxis yAxisId="right" orientation="right" stroke="#8892b0" label={{ value: 'Facilities', angle: 90, position: 'insideRight', fill: '#8892b0' }} />
              <Tooltip 
                contentStyle={{ 
                  background: '#1a1f3a', 
                  border: '1px solid #34d3fd',
                  borderRadius: '8px',
                  color: '#fff'
                }} 
              />
              <Legend />
              <Bar yAxisId="left" dataKey="emissions" fill="#34d3fd" name="Emissions (M Tons)" radius={[8, 8, 0, 0]} />
              <Bar yAxisId="right" dataKey="facilities" fill="#a78bfa" name="Facilities" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default PublicDashboard;
