import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AuthCallback.css';

function AuthCallback() {
  const navigate = useNavigate();
  const { loading, refreshProfile } = useAuth();

  useEffect(() => {
    const handleAuth = async () => {
      try {
        console.log('=== AUTH CALLBACK STARTED ===');
        console.log('URL:', window.location.href);

        const updatedProfile = await refreshProfile();
        console.log('AuthCallback: updatedProfile:', updatedProfile);

        const urlParams = new URLSearchParams(window.location.search);
        const urlRole = urlParams.get('role');
        const storedRole = sessionStorage.getItem('intended_role');
        const effectiveRole = updatedProfile?.role || storedRole || urlRole || 'public';

        console.log('AuthCallback: effectiveRole:', effectiveRole);

        sessionStorage.removeItem('intended_role');

        if (!updatedProfile && effectiveRole === 'public') {
          console.log('AuthCallback: no profile and public role → go home');
          navigate('/', { replace: true });
          return;
        }

        if (effectiveRole === 'regulator') {
          navigate('/regulator', { replace: true });
        } else if (effectiveRole === 'company') {
          navigate('/company', { replace: true });
        } else {
          navigate('/public', { replace: true });
        }
      } catch (err) {
        console.error('AuthCallback error:', err);
        navigate('/company-signin', { replace: true });
      }
    };

    if (!loading) {
      handleAuth();
    }
  }, [loading, navigate, refreshProfile]);

  return (
    <div className="auth-callback">
      <div className="callback-container">
        <div className="spinner"></div>
        <h2>Signing you in...</h2>
        <p>Please wait while we complete your authentication.</p>
      </div>
    </div>
  );
}

export default AuthCallback;
