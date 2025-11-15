import React, { useState, useEffect } from 'react';
import '../styles/ClimateTraceData.css';
import { supabase } from '../lib/supabaseClient';

const defaultBenchmark = {
  sector: 'oil-and-gas',
  year: new Date().getFullYear(),
  comparison: {
    rank: 15,
    percentile: 75,
    industry_average: 180000,
    company_emissions: 50000,
    total_companies: 25,
  },
  top_sources: [],
};

const defaultRegional = {
  regional_context: {
    total_sources: 3,
    total_emissions: 360333,
    average_emissions: 120111,
  },
  louisiana_sources: [],
};

const defaultSector = {
  total_emissions: 360333,
  sector_breakdown: [
    { sector: 'chemical manufacturing', emissions: 180500, percentage: 50 },
    { sector: 'petrochemicals', emissions: 145200, percentage: 40.3 },
    { sector: 'sulfur processing', emissions: 34633, percentage: 9.7 },
  ],
};

const ClimateTraceData = ({ user }) => {
  const [benchmarkData, setBenchmarkData] = useState(defaultBenchmark);
  const [regionalData, setRegionalData] = useState(defaultRegional);
  const [sectorData, setSectorData] = useState(defaultSector);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('benchmarks');

  useEffect(() => {
    fetchClimateTraceData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.orgId]);

  const fetchClimateTraceData = async () => {
    try {
      setLoading(true);
      setError(null);

      const orgId = user?.orgId ?? null;

      const { data: scorecard, error: scorecardError } = await supabase
        .from('public_scorecards')
        .select('org_id, summary, published_at')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (scorecardError) {
        throw scorecardError;
      }

      const summary = scorecard?.summary ?? {};

      setBenchmarkData({
        sector: summary.focus_sector ?? defaultBenchmark.sector,
        year: summary.year ?? defaultBenchmark.year,
        comparison: {
          rank: summary.rank ?? defaultBenchmark.comparison.rank,
          percentile: summary.percentile ?? defaultBenchmark.comparison.percentile,
          industry_average: summary.industry_average ?? defaultBenchmark.comparison.industry_average,
          company_emissions: summary.daily_emissions_avg ?? defaultBenchmark.comparison.company_emissions,
          total_companies: summary.total_companies ?? defaultBenchmark.comparison.total_companies,
        },
        top_sources: summary.top_sources ?? defaultBenchmark.top_sources,
      });

      setRegionalData({
        regional_context: {
          total_sources: summary.total_sources ?? defaultRegional.regional_context.total_sources,
          total_emissions: summary.total_emissions ?? defaultRegional.regional_context.total_emissions,
          average_emissions:
            summary.average_emissions ??
            summary.daily_emissions_avg ??
            defaultRegional.regional_context.average_emissions,
        },
        louisiana_sources: summary.louisiana_sources ?? defaultRegional.louisiana_sources,
      });

      setSectorData({
        total_emissions: summary.total_emissions ?? defaultSector.total_emissions,
        sector_breakdown: summary.sector_breakdown ?? defaultSector.sector_breakdown,
      });
    } catch (err) {
      console.error('Failed to load Climate TRACE data', err);
      setError(err.message ?? 'Unable to load Climate TRACE insights from Supabase.');
      setBenchmarkData(defaultBenchmark);
      setRegionalData(defaultRegional);
      setSectorData(defaultSector);
    } finally {
      setLoading(false);
    }
  };

  const formatEmissions = (value = 0) => {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M tons CO₂e`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K tons CO₂e`;
    return `${Number(value).toFixed(1)} tons CO₂e`;
  };

  const renderBenchmarks = () => {
    const { comparison, top_sources } = benchmarkData ?? {};
    return (
      <div className="climate-trace-section">
        <h3>Louisiana Industry Benchmarks</h3>
        <div className="louisiana-focus-note">
          <p>📊 Comparing your performance against Louisiana and Gulf Coast industrial facilities.</p>
        </div>

        {comparison && (
          <div className="benchmark-comparison">
            <div className="comparison-card">
              <h4>Your Position in Industry</h4>
              <div className="position-indicator">
                <span className="position-rank">
                  Rank: {comparison.rank ?? '–'} / {comparison.total_companies ?? '–'}
                </span>
                <div className="percentile">
                  {comparison.percentile ? `${comparison.percentile}th percentile` : 'Data pending'}
                </div>
              </div>
              <div className="industry-stats">
                <div className="stat">
                  <label>Industry Average:</label>
                  <span>{formatEmissions(comparison.industry_average)}</span>
                </div>
                <div className="stat">
                  <label>Your Emissions:</label>
                  <span>{formatEmissions(comparison.company_emissions)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="top-sources">
          <h4>Top Emitters in Your Sector</h4>
          <div className="sources-list">
            {(top_sources ?? []).slice(0, 5).map((source, index) => (
              <div key={source?.id ?? index} className="source-item">
                <div className="source-rank">#{index + 1}</div>
                <div className="source-info">
                  <div className="source-name">{source?.name ?? source?.sourceName ?? 'Unknown'}</div>
                  <div className="source-location">{source?.location ?? 'Louisiana, USA'}</div>
                </div>
                <div className="source-emissions">{formatEmissions(source?.emissionsQuantity)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderRegional = () => {
    const { regional_context, louisiana_sources } = regionalData ?? {};
    return (
      <div className="climate-trace-section">
        <h3>Louisiana Regional Context</h3>
        <div className="louisiana-focus-note">
          <p>📍 Emissions sources from Louisiana and the Gulf Coast region.</p>
        </div>

        {regional_context && (
          <div className="regional-overview">
            <div className="regional-stats">
              <div className="stat-card">
                <h4>Total Louisiana Sources</h4>
                <span className="stat-value">{regional_context.total_sources ?? 0}</span>
              </div>
              <div className="stat-card">
                <h4>Total Emissions</h4>
                <span className="stat-value">{formatEmissions(regional_context.total_emissions)}</span>
              </div>
              <div className="stat-card">
                <h4>Average per Source</h4>
                <span className="stat-value">{formatEmissions(regional_context.average_emissions)}</span>
              </div>
            </div>
          </div>
        )}

        <div className="louisiana-sources">
          <h4>Major Louisiana Emission Sources</h4>
          <div className="sources-grid">
            {(louisiana_sources ?? []).slice(0, 6).map((source, index) => (
              <div key={source?.id ?? index} className="source-card">
                <div className="source-header">
                  <h5>{source?.name ?? source?.sourceName ?? 'Unknown Source'}</h5>
                  <span className="source-sector">{source?.sector ?? 'industrial'}</span>
                </div>
                <div className="source-details">
                  <div className="detail">
                    <label>Emissions:</label>
                    <span>{formatEmissions(source?.emissionsQuantity)}</span>
                  </div>
                  <div className="detail">
                    <label>Location:</label>
                    <span>{source?.location ?? 'Louisiana, USA'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderSectors = () => {
    const breakdown = sectorData?.sector_breakdown ?? [];
    const total = breakdown.reduce((sum, item) => sum + (item.emissions ?? 0), 0);
    return (
      <div className="climate-trace-section">
        <h3>Sector Analysis</h3>
        <div className="sectors-overview">
          {breakdown.map((item, index) => (
            <div key={item.sector ?? index} className="sector-card">
              <div className="sector-header">
                <h4>{(item.sector ?? 'Unknown Sector').toUpperCase()}</h4>
                <span className="source-count">
                  {(item.percentage ?? (total ? (item.emissions / total) * 100 : 0)).toFixed(1)}% of total
                </span>
              </div>
              <div className="sector-stats">
                <div className="stat-row">
                  <label>Estimated Emissions:</label>
                  <span>{formatEmissions(item.emissions)}</span>
                </div>
                <div className="stat-row">
                  <label>Relative Impact:</label>
                  <span>{item.percentage?.toFixed?.(1) ?? 0}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="climate-trace-loading">
        <div className="loading-spinner"></div>
        <p>Loading real-world emissions data…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="climate-trace-error">
        <h3>⚠️ Climate TRACE data unavailable</h3>
        <p>{error}</p>
        <button onClick={fetchClimateTraceData}>Retry</button>
      </div>
    );
  }

  return (
    <div className="climate-trace-container">
      <div className="climate-trace-header">
        <h2>Louisiana Emissions Intelligence</h2>
        <p>Supabase-powered snapshot derived from Climate TRACE insights.</p>
      </div>

      <div className="climate-trace-tabs">
        <button className={activeTab === 'benchmarks' ? 'tab active' : 'tab'} onClick={() => setActiveTab('benchmarks')}>
          Industry Benchmarks
        </button>
        <button className={activeTab === 'regional' ? 'tab active' : 'tab'} onClick={() => setActiveTab('regional')}>
          Regional Context
        </button>
        <button className={activeTab === 'sectors' ? 'tab active' : 'tab'} onClick={() => setActiveTab('sectors')}>
          Sector Analysis
        </button>
      </div>

      <div className="climate-trace-content">
        {activeTab === 'benchmarks' && renderBenchmarks()}
        {activeTab === 'regional' && renderRegional()}
        {activeTab === 'sectors' && renderSectors()}
      </div>

      <div className="climate-trace-footer">
        <p>
          <strong>Data Source:</strong> Supabase `public_scorecards` (climate trace-derived)<br />
          <small>Last refreshed: {new Date().toLocaleDateString()}</small>
        </p>
      </div>
    </div>
  );
};

export default ClimateTraceData;