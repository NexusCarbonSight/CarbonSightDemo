import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';

export default function RegulatorSignIn() {
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  const [err, setErr] = useState('');
  const navigate = useNavigate();

  const submit = (e) => {
    e.preventDefault();
    // hardcoded regulator creds
    if (u === 'regulator' && p === 'admin123') {
      navigate('/regulator'); // existing RegulatorDashboard route
    } else {
      setErr('Invalid username or password');
    }
  };

  return (
    <div className="home-content" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
      <div className="portal-card regulator-portal" style={{ maxWidth: 360, width: '100%' }}>
        <h3 style={{ marginBottom: 16 }}>Regulator Sign In</h3>
        <form onSubmit={submit}>
          <input
            type="text"
            placeholder="Username"
            value={u}
            onChange={(e) => setU(e.target.value)}
            required
            style={{ width: '100%', padding: 10, borderRadius: 8, marginBottom: 10, border: '1px solid rgba(255,255,255,0.1)' }}
          />
          <input
            type="password"
            placeholder="Password"
            value={p}
            onChange={(e) => setP(e.target.value)}
            required
            style={{ width: '100%', padding: 10, borderRadius: 8, marginBottom: 10, border: '1px solid rgba(255,255,255,0.1)' }}
          />
          {err && <div style={{ color: '#f87171', marginBottom: 10 }}>{err}</div>}
          <button type="submit" className="portal-btn regulator-btn" style={{ width: '100%' }}>
            Sign In
          </button>
        </form>
        <button className="portal-btn public-btn" style={{ marginTop: 12, width: '100%' }} onClick={() => navigate('/')}>
          Back to Home
        </button>
      </div>
    </div>
  );
}