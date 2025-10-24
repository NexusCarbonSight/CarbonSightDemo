import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SignIn.css';

function RegulatorSignIn() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // ✅ Demo credentials
    if (username === 'regulator' && password === 'admin2004') {
      sessionStorage.setItem('regulator_authed', 'true'); // session flag
      navigate('/regulator'); // protected route
    } else {
      setError('Invalid credentials. Please try again.');
    }
  };

  return (
    <div className="signin-page">
      <div className="signin-container">
        <h2>Regulator Sign In</h2>
        <p>Access your monitoring and compliance dashboard</p>
        <form onSubmit={handleSubmit} className="signin-form">
          <label>Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter regulator username"
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

export default RegulatorSignIn;
