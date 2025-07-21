import React from 'react';
import { SkeletonVariant } from '../../../types/loading';

export interface BaseSkeletonProps extends SkeletonVariant {
  loading: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  delay?: number;
  minDisplayTime?: number;
  'data-testid'?: string;
  'aria-label'?: string;
}

// Base skeleton animation styles
const skeletonBaseClasses = "bg-gray-200 rounded animate-pulse";
const shimmerClasses = "relative overflow-hidden bg-gray-200 before:absolute before:inset-0 before:-translate-x-full before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:animate-[shimmer_2s_infinite]";

// Define the shimmer animation in CSS
const shimmerKeyframes = `
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
`;

// Inject styles if not already present
if (typeof document !== 'undefined' && !document.getElementById('skeleton-styles')) {
  const style = document.createElement('style');
  style.id = 'skeleton-styles';
  style.textContent = shimmerKeyframes;
  document.head.appendChild(style);
}

export const BaseSkeleton: React.FC<BaseSkeletonProps> = ({
  loading,
  children,
  type = 'custom',
  count = 1,
  height,
  width,
  className = '',
  animated = true,
  pulse = true,
  fallback,
  delay = 200,
  minDisplayTime = 500,
  'data-testid': testId,
  'aria-label': ariaLabel
}) => {
  const [showSkeleton, setShowSkeleton] = React.useState(false);
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  
  const delayTimeoutRef = React.useRef<NodeJS.Timeout>();
  const minTimeoutRef = React.useRef<NodeJS.Timeout>();
  const startTimeRef = React.useRef<number>(0);

  React.useEffect(() => {
    if (loading) {
      // Add delay before showing skeleton to avoid flash for fast loads
      delayTimeoutRef.current = setTimeout(() => {
        setShowSkeleton(true);
        setIsTransitioning(true);
        startTimeRef.current = Date.now();
        
        // Complete transition
        setTimeout(() => setIsTransitioning(false), 150);
      }, delay);
    } else {
      // Clear delay timeout if loading finished quickly
      if (delayTimeoutRef.current) {
        clearTimeout(delayTimeoutRef.current);
      }

      // Ensure minimum display time if skeleton was shown
      if (showSkeleton) {
        const elapsedTime = Date.now() - startTimeRef.current;
        const remainingTime = Math.max(0, minDisplayTime - elapsedTime);
        
        setIsTransitioning(true);
        minTimeoutRef.current = setTimeout(() => {
          setShowSkeleton(false);
          setTimeout(() => setIsTransitioning(false), 150);
        }, remainingTime);
      }
    }

    return () => {
      if (delayTimeoutRef.current) clearTimeout(delayTimeoutRef.current);
      if (minTimeoutRef.current) clearTimeout(minTimeoutRef.current);
    };
  }, [loading, delay, minDisplayTime, showSkeleton]);

  // Generate skeleton styles based on type and props
  const getSkeletonStyles = (): React.CSSProperties => {
    const styles: React.CSSProperties = {};
    
    if (height) {
      styles.height = typeof height === 'number' ? `${height}px` : height;
    }
    
    if (width) {
      styles.width = typeof width === 'number' ? `${width}px` : width;
    }
    
    return styles;
  };

  // Generate skeleton classes
  const getSkeletonClasses = (): string => {
    const baseClasses = animated && pulse ? shimmerClasses : skeletonBaseClasses;
    const customClasses = className;
    
    return `${baseClasses} ${customClasses}`.trim();
  };

  // Generate individual skeleton element
  const renderSkeletonElement = (index: number) => {
    const key = `skeleton-${type}-${index}`;
    const styles = getSkeletonStyles();
    const classes = getSkeletonClasses();
    
    return (
      <div
        key={key}
        className={classes}
        style={styles}
        data-testid={testId ? `${testId}-${index}` : undefined}
        aria-label={ariaLabel || `Loading ${type} content`}
        role="status"
        aria-live="polite"
      />
    );
  };

  // Render multiple skeleton elements if count > 1
  const renderSkeletons = () => {
    if (count === 1) {
      return renderSkeletonElement(0);
    }
    
    return (
      <div className="space-y-2" data-testid={testId}>
        {Array.from({ length: count }, (_, index) => renderSkeletonElement(index))}
      </div>
    );
  };

  // If not loading and skeleton is not shown, render children
  if (!loading && !showSkeleton) {
    return <>{children}</>;
  }

  // If loading or showing skeleton, render skeleton with transition
  const transitionClasses = isTransitioning 
    ? 'transition-opacity duration-150 opacity-50' 
    : 'transition-opacity duration-150 opacity-100';

  return (
    <div className={transitionClasses}>
      {showSkeleton ? renderSkeletons() : (fallback || null)}
    </div>
  );
};

// Predefined skeleton variants for common use cases
export const TextSkeleton: React.FC<Omit<BaseSkeletonProps, 'type'>> = (props) => (
  <BaseSkeleton
    {...props}
    type="text"
    height={props.height || 16}
    className={`rounded ${props.className || ''}`}
  />
);

export const ImageSkeleton: React.FC<Omit<BaseSkeletonProps, 'type'>> = (props) => (
  <BaseSkeleton
    {...props}
    type="image"
    height={props.height || 200}
    width={props.width || '100%'}
    className={`rounded-lg ${props.className || ''}`}
  />
);

export const ButtonSkeleton: React.FC<Omit<BaseSkeletonProps, 'type'>> = (props) => (
  <BaseSkeleton
    {...props}
    type="button"
    height={props.height || 40}
    width={props.width || 120}
    className={`rounded-md ${props.className || ''}`}
  />
);

export const AvatarSkeleton: React.FC<Omit<BaseSkeletonProps, 'type'> & { size?: 'sm' | 'md' | 'lg' | 'xl' }> = ({ 
  size = 'md', 
  ...props 
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  return (
    <BaseSkeleton
      {...props}
      type="avatar"
      className={`rounded-full ${sizeClasses[size]} ${props.className || ''}`}
    />
  );
};