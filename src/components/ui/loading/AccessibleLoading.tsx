import React, { useEffect, useRef, useState } from 'react';
import { useAccessibility } from '../../../hooks/useAccessibility';

export interface AccessibleLoadingProps {
  loading: boolean;
  children: React.ReactNode;
  loadingText?: string;
  completedText?: string;
  errorText?: string;
  error?: Error | null;
  announceChanges?: boolean;
  focusOnComplete?: boolean;
  role?: 'status' | 'alert' | 'progressbar';
  'aria-label'?: string;
  'aria-describedby'?: string;
  className?: string;
  'data-testid'?: string;
}

// Main accessible loading wrapper
export const AccessibleLoading: React.FC<AccessibleLoadingProps> = ({
  loading,
  children,
  loadingText = 'Loading content',
  completedText = 'Content loaded successfully',
  errorText = 'Failed to load content',
  error = null,
  announceChanges = true,
  focusOnComplete = false,
  role = 'status',
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  className = '',
  'data-testid': testId
}) => {
  const [previousLoading, setPreviousLoading] = useState(loading);
  const [announced, setAnnounced] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const { announceToScreenReader, manageFocus } = useAccessibility();

  // Track loading state changes
  useEffect(() => {
    if (previousLoading !== loading) {
      setPreviousLoading(loading);
      setAnnounced(false);
    }
  }, [loading, previousLoading]);

  // Announce loading state changes
  useEffect(() => {
    if (!announceChanges || announced) return;

    let message = '';
    if (loading) {
      message = loadingText;
    } else if (error) {
      message = errorText;
    } else {
      message = completedText;
    }

    if (message) {
      announceToScreenReader(message, role === 'alert' ? 'assertive' : 'polite');
      setAnnounced(true);
    }
  }, [loading, error, loadingText, completedText, errorText, announceChanges, announced, announceToScreenReader, role]);

  // Focus management
  useEffect(() => {
    if (!loading && focusOnComplete && contentRef.current) {
      manageFocus(contentRef.current);
    }
  }, [loading, focusOnComplete, manageFocus]);

  // Generate accessibility attributes
  const accessibilityProps = {
    role,
    'aria-label': ariaLabel || (loading ? loadingText : error ? errorText : completedText),
    'aria-describedby': ariaDescribedBy,
    'aria-live': role === 'alert' ? 'assertive' as const : 'polite' as const,
    'aria-busy': loading,
    'data-testid': testId
  };

  return (
    <div className={className} {...accessibilityProps}>
      <div ref={contentRef} tabIndex={focusOnComplete ? -1 : undefined}>
        {children}
      </div>
    </div>
  );
};

// Screen reader optimized loading announcer
export interface LoadingAnnouncerProps {
  loading: boolean;
  progress?: number;
  message?: string;
  polite?: boolean;
  includeProgress?: boolean;
  className?: string;
}

export const LoadingAnnouncer: React.FC<LoadingAnnouncerProps> = ({
  loading,
  progress,
  message = 'Loading',
  polite = true,
  includeProgress = false,
  className = 'sr-only'
}) => {
  const [lastAnnouncement, setLastAnnouncement] = useState('');
  const { announceToScreenReader } = useAccessibility();

  useEffect(() => {
    if (!loading) return;

    let announcement = message;
    
    if (includeProgress && typeof progress === 'number') {
      announcement += ` ${Math.round(progress)}% complete`;
    }

    // Only announce if the message has changed significantly
    if (announcement !== lastAnnouncement) {
      announceToScreenReader(announcement, polite ? 'polite' : 'assertive');
      setLastAnnouncement(announcement);
    }
  }, [loading, progress, message, includeProgress, polite, lastAnnouncement, announceToScreenReader]);

  return (
    <div 
      className={className}
      aria-live={polite ? 'polite' : 'assertive'}
      aria-atomic="true"
      role="status"
    >
      {loading && (
        <span>
          {message}
          {includeProgress && typeof progress === 'number' && ` ${Math.round(progress)}% complete`}
        </span>
      )}
    </div>
  );
};

// Keyboard accessible loading skip link
export interface LoadingSkipLinkProps {
  loading: boolean;
  targetId: string;
  skipText?: string;
  className?: string;
}

export const LoadingSkipLink: React.FC<LoadingSkipLinkProps> = ({
  loading,
  targetId,
  skipText = 'Skip to content',
  className = 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-white border border-gray-300 rounded px-3 py-2 text-sm font-medium text-gray-900 z-50'
}) => {
  if (!loading) return null;

  return (
    <a
      href={`#${targetId}`}
      className={className}
      onClick={(e) => {
        e.preventDefault();
        const target = document.getElementById(targetId);
        if (target) {
          target.focus();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }}
    >
      {skipText}
    </a>
  );
};

// Accessible progress indicator
export interface AccessibleProgressProps {
  progress: number;
  label?: string;
  description?: string;
  showPercentage?: boolean;
  announceProgress?: boolean;
  announceThreshold?: number;
  className?: string;
  'data-testid'?: string;
}

export const AccessibleProgress: React.FC<AccessibleProgressProps> = ({
  progress,
  label = 'Loading progress',
  description,
  showPercentage = true,
  announceProgress = true,
  announceThreshold = 10,
  className = '',
  'data-testid': testId
}) => {
  const [lastAnnouncedProgress, setLastAnnouncedProgress] = useState(0);
  const { announceToScreenReader } = useAccessibility();
  const progressId = useRef(`progress-${Math.random().toString(36).substr(2, 9)}`);
  const descriptionId = useRef(`progress-desc-${Math.random().toString(36).substr(2, 9)}`);

  const clampedProgress = Math.max(0, Math.min(100, progress));

  // Announce progress at intervals
  useEffect(() => {
    if (!announceProgress) return;

    const progressDiff = Math.abs(clampedProgress - lastAnnouncedProgress);
    const shouldAnnounce = progressDiff >= announceThreshold || clampedProgress === 100;

    if (shouldAnnounce) {
      const message = clampedProgress === 100 
        ? `${label} completed` 
        : `${label} ${Math.round(clampedProgress)} percent complete`;
      
      announceToScreenReader(message, 'polite');
      setLastAnnouncedProgress(clampedProgress);
    }
  }, [clampedProgress, lastAnnouncedProgress, announceThreshold, announceProgress, label, announceToScreenReader]);

  return (
    <div className={className} data-testid={testId}>
      {/* Progress label */}
      <div className="flex justify-between items-center mb-2">
        <span id={progressId.current} className="text-sm font-medium text-gray-700">
          {label}
        </span>
        {showPercentage && (
          <span className="text-sm text-gray-600" aria-live="polite">
            {Math.round(clampedProgress)}%
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div 
        className="w-full bg-gray-200 rounded-full h-2"
        role="progressbar"
        aria-valuenow={clampedProgress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-labelledby={progressId.current}
        aria-describedby={description ? descriptionId.current : undefined}
      >
        <div
          className="bg-brand-600 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>

      {/* Description */}
      {description && (
        <p id={descriptionId.current} className="text-xs text-gray-500 mt-1">
          {description}
        </p>
      )}
    </div>
  );
};

// High contrast loading indicator for accessibility
export interface HighContrastLoadingProps {
  loading: boolean;
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  showMessage?: boolean;
  className?: string;
}

export const HighContrastLoading: React.FC<HighContrastLoadingProps> = ({
  loading,
  size = 'md',
  message = 'Loading',
  showMessage = true,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  if (!loading) return null;

  return (
    <div 
      className={`flex items-center justify-center space-x-3 ${className}`}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      {/* High contrast spinner */}
      <div 
        className={`${sizeClasses[size]} border-4 border-black border-t-transparent rounded-full animate-spin`}
        aria-hidden="true"
      />
      
      {/* Message with high contrast */}
      {showMessage && (
        <span className="text-black font-semibold">
          {message}
        </span>
      )}
    </div>
  );
};

// Reduced motion loading indicator
export interface ReducedMotionLoadingProps {
  loading: boolean;
  message?: string;
  useAnimation?: boolean;
  className?: string;
}

export const ReducedMotionLoading: React.FC<ReducedMotionLoadingProps> = ({
  loading,
  message = 'Loading',
  useAnimation = true,
  className = ''
}) => {
  const [dots, setDots] = useState('');

  // Simple text-based animation for reduced motion
  useEffect(() => {
    if (!loading || !useAnimation) return;

    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : `${prev  }.`);
    }, 500);

    return () => clearInterval(interval);
  }, [loading, useAnimation]);

  // Check for reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!loading) return null;

  return (
    <div 
      className={`text-center ${className}`}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <div className="inline-flex items-center space-x-2">
        {/* Static indicator for reduced motion */}
        {prefersReducedMotion ? (
          <div className="w-4 h-4 bg-brand-600 rounded-full" aria-hidden="true" />
        ) : (
          <div className="w-4 h-4 bg-brand-600 rounded-full animate-pulse" aria-hidden="true" />
        )}
        
        <span className="text-gray-700">
          {message}
          {useAnimation && !prefersReducedMotion && dots}
        </span>
      </div>
    </div>
  );
};