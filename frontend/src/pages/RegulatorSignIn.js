import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './SignIn.css';
import './GoogleAuth.css';
import { useAuth } from '../context/AuthContext';

function RegulatorSignIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signInWithPassword, signInWithGoogle, refreshProfile } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSignIn, setIsGoogleSignIn] = useState(false);

  const handleSubmit = async (event) => {
  event.preventDefault();
  setError('');
  setIsSubmitting(true);

  try {
    await signInWithPassword({ email, password });

    sessionStorage.setItem('intended_role', 'regulator');
    await refreshProfile();

    const redirectPath = location.state?.from || '/regulator';
    navigate(redirectPath, { replace: true });
  } catch (authError) {
    setError(authError.message ?? 'Unable to sign in. Please try again.');
  } finally {
    setIsSubmitting(false);
  }
};


  const handleGoogleSignIn = async () => {
    setError('');
    setIsGoogleSignIn(true);

    try {
      sessionStorage.setItem('intended_role', 'regulator');
      await signInWithGoogle();
    } catch (authError) {
      console.error('RegulatorSignIn: Google sign-in error:', authError);
      setError(authError.message ?? 'Google authentication failed. Please try again.');
      setIsGoogleSignIn(false);
      sessionStorage.removeItem('intended_role');
    }
  };

  return (
    <div className="signin-page">
      <div className="signin-container">
        <div className="signin-header">
          <img src="/logo.png" alt="CarbonSight Logo" className="signin-logo" />
          <h2>Regulatory Portal</h2>
          <p>Access monitoring, compliance oversight, and regulatory tools</p>
        </div>

        <div className="auth-options">
          <button
            type="button"
            className="google-signin-btn"
            onClick={handleGoogleSignIn}
            disabled={isGoogleSignIn || isSubmitting}
          >
            <svg viewBox="0 0 24 24" className="google-icon">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {isGoogleSignIn ? 'Signing in with Google...' : 'Sign in with Google'}
          </button>

          <div className="divider">
            <span>or</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="signin-form">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="regulator.user@example.com"
            required
          />

          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />

          {error && <div className="error">{error}</div>}

          <button
            className="signin-btn"
            type="submit"
            disabled={isSubmitting || !email || !password}
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default RegulatorSignIn;
