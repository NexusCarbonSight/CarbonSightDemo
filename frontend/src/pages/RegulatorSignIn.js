import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './SignIn.css';
import { useAuth } from '../context/AuthContext';

function RegulatorSignIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signInWithPassword, refreshProfile } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const { data } = await signInWithPassword({ email, password });

      if (!data?.session?.user) {
        throw new Error('Authentication failed. Check your credentials.');
      }

      const updatedProfile = await refreshProfile();

      if (updatedProfile && updatedProfile.role !== 'regulator' && updatedProfile.role !== 'admin') {
        setError('This account does not have regulator access. Contact an administrator.');
        return;
      }

      const redirectPath = location.state?.from || '/regulator';
      navigate(redirectPath, { replace: true });
    } catch (authError) {
      setError(authError.message ?? 'Unable to sign in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="signin-page">
      <div className="signin-container">
        <h2>Regulator Sign In</h2>
        <p>Access your monitoring and compliance dashboard</p>
        <form onSubmit={handleSubmit} className="signin-form">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="regulator@example.com"
            autoComplete="email"
            required
          />
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            autoComplete="current-password"
            required
          />
          {error && <div className="error">{error}</div>}
          <button type="submit" className="signin-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Signing In…' : 'Sign In'}
          </button>
        </form>

        <div className="signin-hint">
          <p>
            Regulator accounts must have the <code>regulator</code> role in the <code>profiles</code> table. Update via
            Supabase admin if needed.
          </p>
        </div>

        <button className="back-btn" onClick={() => navigate('/')}>
          ← Back to Home
        </button>
      </div>
    </div>
  );
}

export default RegulatorSignIn;