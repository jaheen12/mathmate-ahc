import React from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Generate unique error ID for tracking
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return { 
      hasError: true, 
      error: error,
      errorId: errorId
    };
  }

  componentDidCatch(error, errorInfo) {
    // Enhanced error logging
    const errorData = {
      error: error.toString(),
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      errorId: this.state.errorId,
      retryCount: this.state.retryCount,
      props: this.props.logProps ? this.props : '[Props logging disabled]'
    };

    // Log to console with better formatting
    console.group('🚨 Error Boundary Caught An Error');
    console.error('Error ID:', this.state.errorId);
    console.error('Error:', error);
    console.error('Component Stack:', errorInfo.componentStack);
    console.error('Full Error Data:', errorData);
    console.groupEnd();

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo, errorData);
    }

    // Store error info in state for display
    this.setState({ errorInfo });

    // Optional: Send to error tracking service
    if (this.props.errorReportingService) {
      try {
        this.props.errorReportingService(errorData);
      } catch (reportingError) {
        console.error('Failed to report error:', reportingError);
      }
    }
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  handleGoHome = () => {
    if (this.props.onGoHome) {
      this.props.onGoHome();
    } else {
      window.location.href = '/';
    }
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return React.isValidElement(this.props.fallback) 
          ? this.props.fallback 
          : this.props.fallback(this.state.error, this.state.errorInfo, this.handleRetry);
      }

      // Default enhanced fallback UI
      return (
        <div style={{ 
          padding: '24px', 
          margin: '20px', 
          border: '2px solid #ef4444', 
          borderRadius: '12px', 
          backgroundColor: '#fef2f2',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          maxWidth: '800px',
          marginLeft: 'auto',
          marginRight: 'auto'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
            <AlertTriangle size={24} color="#ef4444" style={{ marginRight: '8px' }} />
            <h2 style={{ margin: 0, color: '#dc2626', fontSize: '20px' }}>
              {this.props.title || 'Something went wrong'}
            </h2>
          </div>
          
          <p style={{ color: '#7f1d1d', marginBottom: '16px', lineHeight: '1.5' }}>
            {this.props.description || 
             'An unexpected error occurred in this part of the application. You can try refreshing or go back to the home page.'}
          </p>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <button
              onClick={this.handleRetry}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#dc2626'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#ef4444'}
            >
              <RefreshCw size={16} />
              Try Again {this.state.retryCount > 0 && `(${this.state.retryCount + 1})`}
            </button>
            
            <button
              onClick={this.handleGoHome}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#4b5563'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#6b7280'}
            >
              <Home size={16} />
              Go Home
            </button>
          </div>

          {/* Error details (collapsible) */}
          {(this.props.showDetails !== false) && (
            <details style={{ marginTop: '16px' }}>
              <summary style={{ 
                cursor: 'pointer', 
                color: '#dc2626', 
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <Bug size={16} />
                Technical Details
              </summary>
              <div style={{ 
                marginTop: '12px', 
                padding: '12px', 
                backgroundColor: '#fee2e2', 
                borderRadius: '6px',
                border: '1px solid #fecaca'
              }}>
                <div style={{ marginBottom: '8px' }}>
                  <strong>Error ID:</strong> <code>{this.state.errorId}</code>
                </div>
                {this.state.error && (
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Error Message:</strong>
                    <pre style={{ 
                      whiteSpace: 'pre-wrap', 
                      color: '#991b1b', 
                      margin: '4px 0',
                      fontSize: '13px',
                      fontFamily: 'Monaco, Consolas, monospace'
                    }}>
                      {this.state.error.toString()}
                    </pre>
                  </div>
                )}
                {this.state.error?.stack && (
                  <div>
                    <strong>Stack Trace:</strong>
                    <pre style={{ 
                      whiteSpace: 'pre-wrap', 
                      color: '#991b1b', 
                      margin: '4px 0',
                      fontSize: '11px',
                      fontFamily: 'Monaco, Consolas, monospace',
                      maxHeight: '200px',
                      overflow: 'auto',
                      padding: '8px',
                      backgroundColor: '#fff',
                      border: '1px solid #fca5a5',
                      borderRadius: '4px'
                    }}>
                      {this.state.error.stack}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.defaultProps = {
  showDetails: true,
  logProps: false
};

export default ErrorBoundary;