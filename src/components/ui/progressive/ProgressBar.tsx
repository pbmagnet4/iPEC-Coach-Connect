import React from 'react';
import type { LoadingOverlayProps, ProgressBarProps } from '../../../types/loading';

// Enhanced Progress Bar Component
export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  variant = 'linear',
  size = 'md',
  color = 'primary',
  showPercentage = false,
  animated = true,
  className = '',
  ...props
}) => {
  // Clamp progress between 0 and 100
  const clampedProgress = Math.max(0, Math.min(100, progress));
  
  // Size classes
  const sizeClasses = {
    linear: {
      sm: 'h-1',
      md: 'h-2',
      lg: 'h-3'
    },
    circular: {
      sm: 'w-8 h-8',
      md: 'w-12 h-12',
      lg: 'w-16 h-16'
    }
  };

  // Color classes
  const colorClasses = {
    primary: 'bg-brand-600',
    secondary: 'bg-gray-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
    error: 'bg-red-600'
  };

  const backgroundColorClasses = {
    primary: 'bg-brand-100',
    secondary: 'bg-gray-100',
    success: 'bg-green-100',
    warning: 'bg-yellow-100',
    error: 'bg-red-100'
  };

  if (variant === 'circular') {
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (clampedProgress / 100) * circumference;
    
    return (
      <div className={`relative inline-flex items-center justify-center ${sizeClasses.circular[size]} ${className}`} {...props}>
        <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className={`${backgroundColorClasses[color]} opacity-20`}
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={`${colorClasses[color]} ${animated ? 'transition-all duration-300 ease-out' : ''}`}
          />
        </svg>
        
        {showPercentage && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-semibold text-gray-700">
              {Math.round(clampedProgress)}%
            </span>
          </div>
        )}
      </div>
    );
  }

  if (variant === 'step') {
    const steps = Array.from({ length: 10 }, (_, i) => i + 1);
    const activeSteps = Math.floor(clampedProgress / 10);
    
    return (
      <div className={`flex space-x-1 ${className}`} {...props}>
        {steps.map((step) => (
          <div
            key={step}
            className={`flex-1 ${sizeClasses.linear[size]} rounded-full ${
              step <= activeSteps ? colorClasses[color] : backgroundColorClasses[color]
            } ${animated ? 'transition-colors duration-200' : ''}`}
          />
        ))}
        
        {showPercentage && (
          <span className="ml-2 text-sm font-medium text-gray-700">
            {Math.round(clampedProgress)}%
          </span>
        )}
      </div>
    );
  }

  // Linear variant
  return (
    <div className={`w-full ${className}`} {...props}>
      <div className={`w-full ${backgroundColorClasses[color]} rounded-full ${sizeClasses.linear[size]} overflow-hidden`}>
        <div
          className={`${colorClasses[color]} ${sizeClasses.linear[size]} rounded-full ${
            animated ? 'transition-all duration-300 ease-out' : ''
          }`}
          style={{ width: `${clampedProgress}%` }}
          role="progressbar"
          aria-valuenow={clampedProgress}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      
      {showPercentage && (
        <div className="flex justify-between text-sm text-gray-600 mt-1">
          <span>0%</span>
          <span className="font-medium">{Math.round(clampedProgress)}%</span>
          <span>100%</span>
        </div>
      )}
    </div>
  );
};

// Enhanced Loading Overlay Component
export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  show,
  type = 'page',
  message = 'Loading...',
  progress,
  onCancel,
  backdrop = true,
  zIndex = 50,
  className = ''
}) => {
  if (!show) return null;

  const overlayClasses = {
    page: 'fixed inset-0',
    section: 'absolute inset-0',
    inline: 'relative'
  };

  const backgroundClasses = backdrop 
    ? 'bg-white bg-opacity-75 backdrop-blur-sm' 
    : 'bg-transparent';

  return (
    <div 
      className={`${overlayClasses[type]} flex items-center justify-center ${backgroundClasses} ${className}`}
      style={{ zIndex }}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full mx-4">
        {/* Loading spinner */}
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
          
          {/* Message */}
          <p className="text-lg font-medium text-gray-900 text-center">{message}</p>
          
          {/* Progress bar */}
          {typeof progress === 'number' && (
            <div className="w-full">
              <ProgressBar
                progress={progress}
                showPercentage={true}
                animated={true}
                size="md"
                color="primary"
              />
            </div>
          )}
          
          {/* Cancel button */}
          {onCancel && (
            <button
              onClick={onCancel}
              className="mt-4 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Specialized loading overlays
export const PageLoadingOverlay: React.FC<Omit<LoadingOverlayProps, 'type'>> = (props) => (
  <LoadingOverlay {...props} type="page" />
);

export const SectionLoadingOverlay: React.FC<Omit<LoadingOverlayProps, 'type'>> = (props) => (
  <LoadingOverlay {...props} type="section" />
);

export const InlineLoadingOverlay: React.FC<Omit<LoadingOverlayProps, 'type'>> = (props) => (
  <LoadingOverlay {...props} type="inline" backdrop={false} />
);

// Loading states for different scenarios
export interface LoadingStatesProps {
  loading: boolean;
  error?: Error | null;
  empty?: boolean;
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  onRetry?: () => void;
  className?: string;
}

export const LoadingStates: React.FC<LoadingStatesProps> = ({
  loading,
  error,
  empty = false,
  children,
  loadingComponent,
  errorComponent,
  emptyComponent,
  onRetry,
  className = ''
}) => {
  // Loading state
  if (loading) {
    return (
      <div className={className}>
        {loadingComponent || (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading...</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={className}>
        {errorComponent || (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="text-red-500 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" 
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Something went wrong</h3>
              <p className="text-gray-600 mb-4">{error.message}</p>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="px-4 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700 transition-colors"
                >
                  Try Again
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Empty state
  if (empty) {
    return (
      <div className={className}>
        {emptyComponent || (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="text-gray-400 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" 
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
              <p className="text-gray-600">There are no items to display at the moment.</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Success state - render children
  return <div className={className}>{children}</div>;
};