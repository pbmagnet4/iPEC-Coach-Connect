import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  message = 'Loading...',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className={`flex flex-col items-center justify-center min-h-64 ${className}`}>
      <div className={`animate-spin rounded-full border-b-2 border-brand-600 ${sizeClasses[size]}`}></div>
      {message && (
        <p className="mt-4 text-sm text-gray-600 animate-pulse">{message}</p>
      )}
    </div>
  );
};

// Page-level loading spinner with full screen coverage
export const PageLoadingSpinner: React.FC<{ message?: string }> = ({ 
  message = 'Loading page...' 
}) => {
  return (
    <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brand-600"></div>
        <p className="mt-4 text-lg text-gray-700 animate-pulse">{message}</p>
      </div>
    </div>
  );
};

// Inline loading spinner for components
export const InlineLoadingSpinner: React.FC<{ message?: string }> = ({ 
  message = 'Loading...' 
}) => {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-600 mr-3"></div>
      <span className="text-sm text-gray-600">{message}</span>
    </div>
  );
};