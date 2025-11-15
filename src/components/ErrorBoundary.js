import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console and optionally to error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // TODO: Send error to error tracking service (e.g., Sentry)
    // Example: Sentry.captureException(error, { contexts: { react: errorInfo } });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <div className="error-boundary-icon">⚠️</div>
            <h1 className="error-boundary-title">¡Oops! Algo salió mal</h1>
            <p className="error-boundary-message">
              Lo sentimos, ocurrió un error inesperado. Por favor, intenta recargar la página.
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="error-boundary-details">
                <summary>Detalles del error (solo en desarrollo)</summary>
                <pre className="error-boundary-stack">
                  {this.state.error.toString()}
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}

            <div className="error-boundary-actions">
              <button 
                onClick={this.handleReset}
                className="error-boundary-btn error-boundary-btn-primary"
              >
                Volver al Inicio
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="error-boundary-btn error-boundary-btn-secondary"
              >
                Recargar Página
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

