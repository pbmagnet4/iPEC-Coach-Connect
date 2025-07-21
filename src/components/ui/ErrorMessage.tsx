/**
 * Enhanced Error Message Component
 * 
 * Displays comprehensive error messages with recovery guidance,
 * help links, and actionable next steps.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertCircle, 
  AlertTriangle, 
  XCircle, 
  Info, 
  RefreshCw, 
  ExternalLink, 
  ChevronDown, 
  ChevronUp, 
  MessageCircle,
  X,
  CheckCircle,
  LightbulbIcon,
  Sparkles,
  FileText,
  Wifi,
  WifiOff
} from 'lucide-react';
import { Button } from './Button';
import type { ErrorMessage as ErrorMessageType } from '../../lib/error-messages';

interface ErrorMessageProps {
  error: ErrorMessageType;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
  autoRetryCountdown?: number;
}

const severityConfig = {
  low: {
    icon: Info,
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    iconColor: 'text-blue-600',
    textColor: 'text-blue-800'
  },
  medium: {
    icon: AlertTriangle,
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    iconColor: 'text-yellow-600',
    textColor: 'text-yellow-800'
  },
  high: {
    icon: AlertCircle,
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    iconColor: 'text-orange-600',
    textColor: 'text-orange-800'
  },
  critical: {
    icon: XCircle,
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    iconColor: 'text-red-600',
    textColor: 'text-red-800'
  }
};

export function ErrorMessage({ 
  error, 
  onRetry, 
  onDismiss, 
  className = '',
  autoRetryCountdown 
}: ErrorMessageProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [countdown, setCountdown] = useState(autoRetryCountdown || 0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [correctionApplied, setCorrectionApplied] = useState(false);

  const config = severityConfig[error.severity];
  const IconComponent = config.icon;
  const hasRecoverySteps = error.recoverySteps && error.recoverySteps.length > 0;
  const hasHelpLinks = error.helpLinks && error.helpLinks.length > 0;
  const hasSuggestions = error.suggestions && error.suggestions.length > 0;
  const hasSmartCorrection = !!error.smartCorrection;
  const hasQuickActions = error.quickActions && error.quickActions.length > 0;
  const hasProgressiveDetails = !!error.progressiveDetails;
  const hasAdditionalInfo = hasRecoverySteps || hasHelpLinks || hasSuggestions || hasProgressiveDetails;

  // Handle auto-retry countdown
  useEffect(() => {
    if (countdown > 0 && error.autoRetry) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && error.autoRetry && onRetry) {
      handleRetry();
    }
  }, [countdown, error.autoRetry, onRetry]);

  const handleRetry = async () => {
    if (!onRetry) return;
    
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  const handleContactSupport = () => {
    const supportUrl = '/contact';
    const subject = encodeURIComponent(`Help with: ${error.title}`);
    const body = encodeURIComponent(
      `I'm experiencing the following issue:\n\n` +
      `Error: ${error.title}\n` +
      `Description: ${error.message}\n` +
      `Time: ${new Date().toISOString()}\n\n` +
      `Please help me resolve this issue.`
    );
    
    window.open(`${supportUrl}?subject=${subject}&body=${body}`, '_blank');
  };

  const handleApplyCorrection = () => {
    if (error.smartCorrection?.action) {
      error.smartCorrection.action();
      setCorrectionApplied(true);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`rounded-lg border ${config.bgColor} ${config.borderColor} ${className}`}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <IconComponent className={`h-5 w-5 mt-0.5 ${config.iconColor} flex-shrink-0`} />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className={`font-medium ${config.textColor}`}>
                  {error.title}
                </h3>
                <p className={`mt-1 text-sm ${config.textColor} opacity-90`}>
                  {error.message}
                </p>

                {/* Smart correction suggestion */}
                {hasSmartCorrection && !correctionApplied && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 flex items-center gap-2 p-2 bg-blue-50 rounded-md"
                  >
                    <Sparkles className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-blue-800">
                      Did you mean: <strong>{error.smartCorrection?.suggestion}</strong>?
                    </span>
                    <button
                      onClick={handleApplyCorrection}
                      className="ml-auto text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      Apply
                    </button>
                  </motion.div>
                )}

                {/* Smart suggestions */}
                {hasSuggestions && (
                  <div className="mt-2 space-y-1">
                    {error.suggestions!.map((suggestion, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm">
                        <LightbulbIcon className="h-4 w-4 text-yellow-500 mt-0.5" />
                        <span className={`${config.textColor} opacity-80`}>{suggestion}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className={`ml-2 ${config.iconColor} hover:opacity-75 flex-shrink-0`}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Action buttons */}
            <div className="mt-3 flex flex-wrap gap-2">
              {onRetry && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRetry}
                  disabled={isRetrying || countdown > 0}
                  icon={<RefreshCw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />}
                >
                  {countdown > 0 ? `Retry in ${countdown}s` : isRetrying ? 'Retrying...' : 'Try Again'}
                </Button>
              )}

              {hasAdditionalInfo && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsExpanded(!isExpanded)}
                  icon={isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                >
                  {isExpanded ? 'Hide Details' : 'Show Help'}
                </Button>
              )}

              {/* Quick actions */}
              {hasQuickActions && error.quickActions!.map((action, index) => (
                <Button
                  key={index}
                  size="sm"
                  variant={action.variant || 'ghost'}
                  onClick={action.action}
                >
                  {action.label}
                </Button>
              ))}

              {error.showSupport && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleContactSupport}
                  icon={<MessageCircle className="h-4 w-4" />}
                >
                  Contact Support
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Expandable recovery guidance */}
        <AnimatePresence>
          {isExpanded && hasAdditionalInfo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-4 pt-4 border-t border-current border-opacity-20"
            >
              {/* Recovery steps */}
              {hasRecoverySteps && (
                <div className="mb-4">
                  <h4 className={`font-medium text-sm ${config.textColor} mb-2`}>
                    How to fix this:
                  </h4>
                  <ol className={`text-sm ${config.textColor} opacity-90 space-y-1`}>
                    {error.recoverySteps!.map((step, index) => (
                      <li key={index} className="flex gap-2">
                        <span className="font-medium min-w-0 flex-shrink-0">
                          {index + 1}.
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Help links */}
              {hasHelpLinks && (
                <div>
                  <h4 className={`font-medium text-sm ${config.textColor} mb-2`}>
                    Helpful resources:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {error.helpLinks!.map((link, index) => (
                      <a
                        key={index}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-1 text-sm ${config.textColor} hover:opacity-75 underline`}
                      >
                        {link.label}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Progressive details */}
              {hasProgressiveDetails && (
                <div className="space-y-2">
                  {!showTechnicalDetails && (
                    <button
                      onClick={() => setShowTechnicalDetails(true)}
                      className={`text-sm ${config.textColor} opacity-70 hover:opacity-100 flex items-center gap-1`}
                    >
                      <FileText className="h-4 w-4" />
                      Show technical details
                    </button>
                  )}
                  
                  {showTechnicalDetails && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2"
                    >
                      {error.progressiveDetails?.technical && (
                        <div className="p-3 bg-gray-100 rounded-md">
                          <h5 className="text-xs font-mono font-medium text-gray-700 mb-1">Technical Details:</h5>
                          <p className="text-xs font-mono text-gray-600">{error.progressiveDetails.technical}</p>
                        </div>
                      )}
                      
                      {error.progressiveDetails?.moreInfo && (
                        <div className="space-y-1">
                          <h5 className={`text-xs font-medium ${config.textColor} opacity-70`}>Additional Information:</h5>
                          {error.progressiveDetails.moreInfo.map((info, index) => (
                            <div key={index} className="flex items-start gap-2">
                              <div className="h-1.5 w-1.5 rounded-full bg-current mt-1.5 opacity-40" />
                              <span className={`text-xs ${config.textColor} opacity-70`}>{info}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <button
                        onClick={() => setShowTechnicalDetails(false)}
                        className={`text-xs ${config.textColor} opacity-50 hover:opacity-70`}
                      >
                        Hide technical details
                      </button>
                    </motion.div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/**
 * Hook for managing error messages with automatic retry
 */
export function useErrorMessage() {
  const [error, setError] = useState<ErrorMessageType | null>(null);
  const [retryFunction, setRetryFunction] = useState<(() => Promise<void>) | null>(null);

  const showError = (errorMessage: ErrorMessageType, retryFn?: () => Promise<void>) => {
    setError(errorMessage);
    if (retryFn) {
      setRetryFunction(() => retryFn);
    }
  };

  const clearError = () => {
    setError(null);
    setRetryFunction(null);
  };

  const retry = async () => {
    if (retryFunction) {
      try {
        await retryFunction();
        clearError();
      } catch (err) {
        // Error will be handled by the calling function
      }
    }
  };

  return {
    error,
    showError,
    clearError,
    retry: retryFunction ? retry : undefined
  };
}

/**
 * Global error boundary component
 */
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  retry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback;
      
      if (FallbackComponent) {
        return <FallbackComponent error={this.state.error!} retry={this.retry} />;
      }

      return (
        <div className="min-h-[200px] flex items-center justify-center p-4">
          <ErrorMessage
            error={{
              title: 'Something went wrong',
              message: 'An unexpected error occurred. Please try refreshing the page.',
              severity: 'high',
              category: 'system',
              recoverySteps: [
                'Refresh the page',
                'Clear your browser cache',
                'Try again in a few minutes',
                'Contact support if the problem persists'
              ],
              showSupport: true
            }}
            onRetry={this.retry}
          />
        </div>
      );
    }

    return this.props.children;
  }
}