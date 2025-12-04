import React from 'react';
import './ErrorBoundary.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', {
      error: error,
      errorInfo: errorInfo,
      message: error?.message,
      stack: error?.stack
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-container">
            <h2>Something went wrong</h2>
            <p>An error occurred during authentication. Please try again.</p>
            <details>
              <summary>Error Details</summary>
              <pre>{this.state.error?.message || 'Unknown error'}</pre>
            </details>
            <button onClick={() => window.location.href = '/'}>
              Go to Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;