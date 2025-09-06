import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Mail } from 'lucide-react';
import { Button } from './Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Generate unique error ID for tracking
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details for monitoring
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Report to error tracking service
    this.reportError(error, errorInfo);
    
    // Call optional error handler
    this.props.onError?.(error, errorInfo);
  }

  reportError = (error: Error, errorInfo: React.ErrorInfo) => {
    // In production, report to error tracking service (Sentry, LogRocket, etc.)
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error, { contexts: { react: errorInfo } });
      console.error('Production error reported:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        errorId: this.state.errorId
      });
    }
  };

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorId: ''
    });
  };

  handleReportIssue = () => {
    const subject = encodeURIComponent(`Bug Report - ${this.state.errorId}`);
    const body = encodeURIComponent(`
Error ID: ${this.state.errorId}
Error Message: ${this.state.error?.message || 'Unknown error'}
User Agent: ${navigator.userAgent}
URL: ${window.location.href}
Timestamp: ${new Date().toISOString()}

Please describe what you were doing when this error occurred:
[Your description here]
    `.trim());
    
    window.open(`mailto:support@ipeccoachconnect.com?subject=${subject}&body=${body}`);
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div 
          className="min-h-screen bg-gray-50 flex items-center justify-center px-4"
          role="alert"
          aria-live="assertive"
        >
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mb-6">
              <AlertTriangle 
                className="h-16 w-16 text-red-500 mx-auto mb-4" 
                aria-hidden="true"
              />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Something went wrong
              </h1>
              <p className="text-gray-600 mb-4">
                We apologize for the inconvenience. An unexpected error has occurred.
              </p>
              
              {/* Error ID for support */}
              <div className="bg-gray-100 rounded-md p-3 mb-6">
                <p className="text-sm text-gray-600 mb-1">Error ID:</p>
                <code className="text-xs font-mono text-gray-800 select-all">
                  {this.state.errorId}
                </code>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={this.handleRetry}
                variant="primary"
                size="lg"
                className="w-full"
                icon={<RefreshCw className="h-4 w-4" />}
              >
                Try Again
              </Button>
              
              <Button
                href="/"
                variant="outline"
                size="lg"
                className="w-full"
                icon={<Home className="h-4 w-4" />}
              >
                Go to Homepage
              </Button>
              
              <Button
                onClick={this.handleReportIssue}
                variant="ghost"
                size="sm"
                className="w-full text-gray-600"
                icon={<Mail className="h-4 w-4" />}
              >
                Report Issue
              </Button>
            </div>

            {/* Development mode: Show error details */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
                  Error Details (Development Only)
                </summary>
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm font-medium text-red-800 mb-2">
                    {this.state.error.message}
                  </p>
                  <pre className="text-xs text-red-700 whitespace-pre-wrap overflow-auto max-h-32">
                    {this.state.error.stack}
                  </pre>
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook-based error boundary for functional components
export function useErrorHandler() {
  return (error: Error, errorInfo?: { componentStack?: string }) => {
    console.error('Error caught by useErrorHandler:', error, errorInfo);
    
    // In a real app, report to error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error, { extra: errorInfo });
    }
  };
}

// Higher-order component for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}