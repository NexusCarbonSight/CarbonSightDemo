import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SignIn.css';

function CompanySignIn() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // ✅ Demo credentials
    if (username === 'sasolla' && password === 'industries123') {
      sessionStorage.setItem('company_authed', 'true'); // session flag
      navigate('/company'); // protected route
    } else {
      setError('Invalid credentials. Please try again.');
    }
  };

  return (
    <div className="signin-page">
      <div className="signin-container">
        <h2>Company Sign In</h2>
        <p>Access your CarbonSense dashboard</p>
        <form onSubmit={handleSubmit} className="signin-form">
          <label>Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your company username"
            required
          />
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
          />
          {error && <div className="error">{error}</div>}
          <button type="submit" className="signin-btn">
            Sign In
          </button>
        </form>

        <button className="back-btn" onClick={() => navigate('/')}>
          ← Back to Home
        </button>
      </div>
    </div>
  );
}

export default CompanySignIn;
