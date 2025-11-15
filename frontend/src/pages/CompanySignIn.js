import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './SignIn.css';
import { useAuth } from '../context/AuthContext';

function CompanySignIn() {
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

      if (updatedProfile && updatedProfile.role !== 'company' && updatedProfile.role !== 'admin') {
        setError('This account does not have company access. Contact an administrator.');
        return;
      }

      const redirectPath = location.state?.from || '/company';
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
        <h2>Company Sign In</h2>
        <p>Access your CarbonSight dashboard</p>
        <form onSubmit={handleSubmit} className="signin-form">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="company.user@example.com"
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
            Need an account? Invite users via Supabase Auth and assign them the <code>company</code> role in the
            <code>profiles</code> table.
          </p>
        </div>

        <button className="back-btn" onClick={() => navigate('/')}>
          ← Back to Home
        </button>
      </div>
    </div>
  );
}

export default CompanySignIn;
