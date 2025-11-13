import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './PublicDashboard.css';

function PublicDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState('All Regions');
  const [selectedSector, setSelectedSector] = useState('All Sectors');

  // Comprehensive hardcoded emissions data - anonymized with generic facility names
  // Based on Climate TRACE data structure for Louisiana emissions
  const completeEmissionsData = [
    // Baton Rouge - Manufacturing Hub
    { year: '2020', region: 'Baton Rouge', sector: 'Manufacturing', emissions: 18.5, facilities: 4, facilityList: ['Industrial Complex A', 'Chemical Plant 1', 'Facility B', 'Manufacturing Site C'] },
    { year: '2020', region: 'Baton Rouge', sector: 'Energy', emissions: 12.2, facilities: 2, facilityList: ['Power Station 1', 'Energy Facility A'] },
    { year: '2020', region: 'Baton Rouge', sector: 'Transportation', emissions: 8.3, facilities: 3, facilityList: ['Transport Hub A', 'Logistics Center 1', 'Distribution Point B'] },
    { year: '2020', region: 'Baton Rouge', sector: 'Buildings', emissions: 4.5, facilities: 2, facilityList: ['Commercial Complex A', 'Industrial Building 1'] },
    { year: '2020', region: 'Baton Rouge', sector: 'Agriculture', emissions: 1.5, facilities: 1, facilityList: ['Agricultural Facility A'] },

    // Lake Charles - Petrochemical Region
    { year: '2020', region: 'Lake Charles', sector: 'Manufacturing', emissions: 22.8, facilities: 5, facilityList: ['Petrochemical Complex A', 'Industrial Facility 1', 'Chemical Plant 2', 'Processing Site A', 'Facility D'] },
    { year: '2020', region: 'Lake Charles', sector: 'Energy', emissions: 8.5, facilities: 2, facilityList: ['Power Plant A', 'Energy Complex 1'] },
    { year: '2020', region: 'Lake Charles', sector: 'Transportation', emissions: 2.7, facilities: 2, facilityList: ['Port Facility A', 'Transport Center 1'] },
    { year: '2020', region: 'Lake Charles', sector: 'Buildings', emissions: 0.8, facilities: 1, facilityList: ['Office Complex A'] },
    { year: '2020', region: 'Lake Charles', sector: 'Agriculture', emissions: 0.2, facilities: 0, facilityList: [] },

    // New Orleans - Mixed Use
    { year: '2020', region: 'New Orleans', sector: 'Transportation', emissions: 12.5, facilities: 3, facilityList: ['Port of Entry A', 'Logistics Hub 1', 'Transportation Center B'] },
    { year: '2020', region: 'New Orleans', sector: 'Buildings', emissions: 9.8, facilities: 2, facilityList: ['Downtown Complex A', 'Commercial District 1'] },
    { year: '2020', region: 'New Orleans', sector: 'Manufacturing', emissions: 4.2, facilities: 1, facilityList: ['Industrial Site A'] },
    { year: '2020', region: 'New Orleans', sector: 'Energy', emissions: 2.5, facilities: 1, facilityList: ['Power Facility 1'] },
    { year: '2020', region: 'New Orleans', sector: 'Agriculture', emissions: 1.0, facilities: 1, facilityList: ['Farm Complex A'] },

    // Lafayette - Agriculture and Energy
    { year: '2020', region: 'Lafayette', sector: 'Agriculture', emissions: 11.3, facilities: 3, facilityList: ['Agricultural Complex A', 'Farm Facility 1', 'Crop Processing Site B'] },
    { year: '2020', region: 'Lafayette', sector: 'Energy', emissions: 8.7, facilities: 2, facilityList: ['Natural Gas Facility A', 'Energy Plant 1'] },
    { year: '2020', region: 'Lafayette', sector: 'Manufacturing', emissions: 4.5, facilities: 2, facilityList: ['Processing Plant A', 'Industrial Facility 2'] },
    { year: '2020', region: 'Lafayette', sector: 'Transportation', emissions: 2.0, facilities: 1, facilityList: ['Distribution Center A'] },
    { year: '2020', region: 'Lafayette', sector: 'Buildings', emissions: 0.5, facilities: 1, facilityList: ['Commercial Building A'] },

    // Shreveport - Energy Focus
    { year: '2020', region: 'Shreveport', sector: 'Energy', emissions: 7.8, facilities: 2, facilityList: ['Power Generation A', 'Energy Facility 2'] },
    { year: '2020', region: 'Shreveport', sector: 'Manufacturing', emissions: 3.5, facilities: 1, facilityList: ['Industrial Plant A'] },
    { year: '2020', region: 'Shreveport', sector: 'Transportation', emissions: 2.2, facilities: 1, facilityList: ['Transport Facility A'] },
    { year: '2020', region: 'Shreveport', sector: 'Agriculture', emissions: 1.0, facilities: 1, facilityList: ['Agricultural Site A'] },
    { year: '2020', region: 'Shreveport', sector: 'Buildings', emissions: 0.5, facilities: 0, facilityList: [] },
  ];

  // Generate data for years 2021-2024 with realistic trends
  const allEmissionsData = useMemo(() => {
    const generateYearData = (baseData, year, growthRate) => {
      return baseData.map(item => ({
        ...item,
        year: year.toString(),
        emissions: parseFloat((item.emissions * growthRate).toFixed(2))
      }));
    };

    return [
      ...completeEmissionsData,
      ...generateYearData(completeEmissionsData, 2021, 1.03),
      ...generateYearData(completeEmissionsData, 2022, 1.05),
      ...generateYearData(completeEmissionsData, 2023, 1.02),
      ...generateYearData(completeEmissionsData, 2024, 0.98),
    ];
  }, [completeEmissionsData]);

  // Filter data based on selected region and sector
  const filteredData = useMemo(() => {
    return allEmissionsData.filter(item => {
      const regionMatch = selectedRegion === 'All Regions' || item.region === selectedRegion;
      const sectorMatch = selectedSector === 'All Sectors' || item.sector === selectedSector;
      return regionMatch && sectorMatch;
    });
  }, [allEmissionsData, selectedRegion, selectedSector]);

  // Compute metrics based on filtered data
  const metrics = useMemo(() => {
    const data2024 = filteredData.filter(item => item.year === '2024');
    const data2023 = filteredData.filter(item => item.year === '2023');

    const totalEmissions2024 = data2024.reduce((sum, item) => sum + item.emissions, 0);
    const totalEmissions2023 = data2023.reduce((sum, item) => sum + item.emissions, 0);
    const changePercent = ((totalEmissions2024 - totalEmissions2023) / totalEmissions2023 * 100).toFixed(1);

    const uniqueFacilities = new Set();
    data2024.forEach(item => {
      item.facilityList?.forEach(facility => uniqueFacilities.add(facility));
    });

    const uniqueRegions = new Set(data2024.map(item => item.region));

    return {
      totalEmissions: totalEmissions2024.toFixed(1),
      changePercent: parseFloat(changePercent),
      facilities: uniqueFacilities.size,
      regions: uniqueRegions.size
    };
  }, [filteredData]);

  // Prepare data for trend chart (grouped by year and sector)
  const trendData = useMemo(() => {
    const years = ['2020', '2021', '2022', '2023', '2024'];
    return years.map(year => {
      const yearData = filteredData.filter(item => item.year === year);
      const dataPoint = { year };

      // Group by sector
      const sectors = ['Manufacturing', 'Energy', 'Transportation', 'Buildings', 'Agriculture'];
      sectors.forEach(sector => {
        const sectorTotal = yearData
          .filter(item => item.sector === sector)
          .reduce((sum, item) => sum + item.emissions, 0);
        dataPoint[sector] = parseFloat(sectorTotal.toFixed(2));
      });

      dataPoint.Total = parseFloat(Object.values(dataPoint)
        .filter(v => typeof v === 'number')
        .reduce((sum, val) => sum + val, 0).toFixed(2));

      return dataPoint;
    });
  }, [filteredData]);

  // Prepare data for sector pie chart (2024 only)
  const sectorData = useMemo(() => {
    const data2024 = filteredData.filter(item => item.year === '2024');
    const sectorTotals = {};

    data2024.forEach(item => {
      sectorTotals[item.sector] = (sectorTotals[item.sector] || 0) + item.emissions;
    });

    const total = Object.values(sectorTotals).reduce((sum, val) => sum + val, 0);
    const colors = {
      Manufacturing: '#34d3fd',
      Energy: '#a78bfa',
      Transportation: '#10b981',
      Buildings: '#f59e0b',
      Agriculture: '#ef4444'
    };

    return Object.entries(sectorTotals)
      .map(([name, value]) => ({
        name,
        value: parseFloat(((value / total) * 100).toFixed(1)),
        absoluteValue: parseFloat(value.toFixed(2)),
        color: colors[name]
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredData]);

  // Prepare data for regional bar chart (2024 only)
  const regionalData = useMemo(() => {
    const data2024 = filteredData.filter(item => item.year === '2024');
    const regionTotals = {};
    const regionFacilities = {};

    data2024.forEach(item => {
      if (!regionTotals[item.region]) {
        regionTotals[item.region] = 0;
        regionFacilities[item.region] = new Set();
      }
      regionTotals[item.region] += item.emissions;
      item.facilityList?.forEach(facility => regionFacilities[item.region].add(facility));
    });

    return Object.keys(regionTotals)
      .map(region => ({
        region,
        emissions: parseFloat(regionTotals[region].toFixed(2)),
        facilities: regionFacilities[region].size
      }))
      .sort((a, b) => b.emissions - a.emissions);
  }, [filteredData]);

  const regions = ['All Regions', 'Baton Rouge', 'Lake Charles', 'New Orleans', 'Lafayette', 'Shreveport'];
  const sectors = ['All Sectors', 'Manufacturing', 'Energy', 'Transportation', 'Buildings', 'Agriculture'];

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
          <img src="/logo.png" alt="Logo" className="logo-icon" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
          <h2>Public Dashboard</h2>
        </div>
      </header>

      <div className="dashboard-content">
        {/* Filter Section */}
        <div className="filters-section">
          <div className="filter-group">
            <label className="filter-label">
              <svg viewBox="0 0 24 24" fill="none" className="filter-icon">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="currentColor" strokeWidth="2"/>
              </svg>
              Region
            </label>
            <div className="filter-buttons">
              {regions.map(region => (
                <button
                  key={region}
                  className={`filter-btn ${selectedRegion === region ? 'active' : ''}`}
                  onClick={() => setSelectedRegion(region)}
                >
                  {region}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <label className="filter-label">
              <svg viewBox="0 0 24 24" fill="none" className="filter-icon">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2"/>
              </svg>
              Sector
            </label>
            <div className="filter-buttons">
              {sectors.map(sector => (
                <button
                  key={sector}
                  className={`filter-btn ${selectedSector === sector ? 'active' : ''}`}
                  onClick={() => setSelectedSector(sector)}
                >
                  {sector}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-label">Total Emissions 2024</span>
              <svg className="metric-icon" viewBox="0 0 24 24" fill="none">
                <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <div className="metric-value">{metrics.totalEmissions}M</div>
            <div className={`metric-change ${metrics.changePercent < 0 ? 'positive' : 'negative'}`}>
              {metrics.changePercent > 0 ? '↑' : '↓'} {Math.abs(metrics.changePercent)}% vs 2023
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-label">Active Facilities</span>
              <svg className="metric-icon" viewBox="0 0 24 24" fill="none">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <div className="metric-value">{metrics.facilities}</div>
            <div className="metric-subtitle">
              {selectedRegion === 'All Regions' ? 'Across Louisiana' : `In ${selectedRegion}`}
            </div>
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
            <div className="metric-value">{metrics.regions}</div>
            <div className="metric-subtitle">
              {selectedRegion === 'All Regions' ? 'Major hubs' : 'Selected'}
            </div>
          </div>
        </div>

        <div className="charts-row">
          <div className="chart-card large">
            <h3>Annual Emissions Trend (Million Tons CO₂)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a3351" />
                <XAxis dataKey="year" stroke="#8892b0" />
                <YAxis stroke="#8892b0" />
                <Tooltip
                  contentStyle={{
                    background: '#1a1f3a',
                    border: '1px solid #34d3fd',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  formatter={(value) => value.toFixed(2)}
                />
                <Legend />
                {selectedSector === 'All Sectors' ? (
                  <>
                    <Line type="monotone" dataKey="Manufacturing" stroke="#34d3fd" strokeWidth={2} dot={{ r: 4 }} animationDuration={500} />
                    <Line type="monotone" dataKey="Energy" stroke="#a78bfa" strokeWidth={2} dot={{ r: 4 }} animationDuration={500} />
                    <Line type="monotone" dataKey="Transportation" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} animationDuration={500} />
                    <Line type="monotone" dataKey="Buildings" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} animationDuration={500} />
                    <Line type="monotone" dataKey="Agriculture" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} animationDuration={500} />
                    <Line type="monotone" dataKey="Total" stroke="#10b981" strokeWidth={3} dot={{ r: 5 }} animationDuration={500} />
                  </>
                ) : (
                  <Line type="monotone" dataKey={selectedSector} stroke="#34d3fd" strokeWidth={3} dot={{ r: 5 }} animationDuration={500} />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card small">
            <h3>Emissions by Sector (2024)</h3>
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
                  animationDuration={500}
                >
                  {sectorData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: '#1a1f3a',
                    border: '1px solid #34d3fd',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  formatter={(value, name, props) => [`${value}% (${props.payload.absoluteValue}M tons)`, name]}
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
          <h3>Regional Breakdown (2024)</h3>
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
              <Bar yAxisId="left" dataKey="emissions" fill="#34d3fd" name="Emissions (M Tons)" radius={[8, 8, 0, 0]} animationDuration={500} />
              <Bar yAxisId="right" dataKey="facilities" fill="#a78bfa" name="Facilities" radius={[8, 8, 0, 0]} animationDuration={500} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default PublicDashboard;
