import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface MobileButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'gradient';
  size?: 'sm' | 'md' | 'lg' | 'touch' | 'thumb';
  isLoading?: boolean;
  href?: string;
  icon?: React.ReactNode;
  touchOptimized?: boolean;
  'aria-label'?: string;
  touchFeedback?: 'haptic' | 'visual' | 'both' | 'none';
}

const buttonVariants = {
  initial: { scale: 1 },
  hover: { scale: 1.02 },
  tap: { scale: 0.96 },
  focus: { scale: 1.01 },
};

export function MobileButton({
  children,
  className,
  variant = 'primary',
  size = 'touch',
  isLoading,
  href,
  icon,
  disabled,
  touchOptimized = true,
  touchFeedback = 'both',
  'aria-label': ariaLabel,
  ...props
}: MobileButtonProps) {
  const baseStyles = cn(
    "inline-flex items-center justify-center font-semibold transition-all duration-200",
    "focus:outline-none focus:ring-4 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
    "relative active:scale-95 transform-gpu", // Hardware acceleration for smooth animations
    touchOptimized && "touch-manipulation select-none", // Optimize for touch
    // Enhanced focus for mobile/keyboard users
    "focus-visible:ring-4 focus-visible:ring-blue-500/50",
    // High contrast mode support
    "@media (prefers-contrast: high) { border: 2px solid }"
  );
  
  const variants = {
    primary: cn(
      "bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800",
      "focus:ring-brand-500 focus-visible:ring-brand-500",
      "@media (prefers-contrast: high) { border-color: transparent }"
    ),
    secondary: cn(
      "bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300",
      "focus:ring-gray-500 focus-visible:ring-gray-500"
    ),
    outline: cn(
      "border-2 border-brand-600 text-brand-600 hover:bg-brand-50 active:bg-brand-100",
      "focus:ring-brand-500 focus-visible:ring-brand-500"
    ),
    ghost: cn(
      "text-gray-700 hover:bg-gray-100 active:bg-gray-200",
      "focus:ring-gray-500 focus-visible:ring-gray-500"
    ),
    gradient: cn(
      "bg-gradient-to-r from-brand-600 to-blue-600 text-white",
      "hover:from-brand-700 hover:to-blue-700 active:from-brand-800 active:to-blue-800",
      "focus:ring-brand-500 focus-visible:ring-brand-500"
    ),
  };

  // Mobile-optimized sizes with 44px minimum touch targets
  const sizes = {
    sm: "px-4 py-3 text-sm rounded-lg min-h-[44px] min-w-[44px]", // 44px minimum
    md: "px-6 py-4 rounded-lg min-h-[48px] min-w-[48px]", // 48px comfortable
    lg: "px-8 py-4 text-lg rounded-lg min-h-[52px] min-w-[52px]", // 52px large
    touch: "px-6 py-4 rounded-xl min-h-[44px] min-w-[44px]", // WCAG AA minimum
    thumb: "px-8 py-6 rounded-xl min-h-[56px] min-w-[56px] text-lg", // Apple recommended
  };

  const classes = cn(
    baseStyles,
    variants[variant],
    sizes[size],
    isLoading && "opacity-50 pointer-events-none",
    className
  );

  // Enhanced haptic feedback for supported devices
  const handleTouchStart = () => {
    if (touchFeedback === 'haptic' || touchFeedback === 'both') {
      // Haptic feedback for supported devices
      if ('vibrate' in navigator) {
        navigator.vibrate(10); // Light haptic feedback
      }
    }
  };

  const content = (
    <>
      {isLoading ? (
        <div className="flex items-center gap-2">
          <svg 
            className="animate-spin h-5 w-5" 
            fill="none" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4" 
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" 
            />
          </svg>
          <span className="sr-only">Loading...</span>
        </div>
      ) : (
        <>
          {icon && (
            <span className={cn("flex-shrink-0", children && "mr-2")} aria-hidden="true">
              {icon}
            </span>
          )}
          {children && <span className="flex-grow text-center">{children}</span>}
        </>
      )}
    </>
  );

  const buttonProps = {
    className: classes,
    disabled: disabled || isLoading,
    onTouchStart: handleTouchStart,
    'aria-label': ariaLabel || (typeof children === 'string' ? children : undefined),
    'aria-disabled': disabled || isLoading,
    ...props,
  };

  if (href) {
    return (
      <Link to={href} className="inline-block">
        <motion.span
          initial="initial"
          whileHover="hover"
          whileTap="tap"
          whileFocus="focus"
          variants={buttonVariants}
          className={classes}
          onTouchStart={handleTouchStart}
          role="button"
          tabIndex={0}
          aria-label={ariaLabel}
        >
          {content}
        </motion.span>
      </Link>
    );
  }

  return (
    <motion.button
      initial="initial"
      whileHover="hover"
      whileTap="tap"
      whileFocus="focus"
      variants={buttonVariants}
      {...buttonProps}
    >
      {content}
    </motion.button>
  );
}

// Touch target verification hook for development
export function useTouchTargetValidation(ref: React.RefObject<HTMLElement>) {
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development' && ref.current) {
      const element = ref.current;
      const rect = element.getBoundingClientRect();
      const minSize = 44; // WCAG AA minimum
      
      if (rect.width < minSize || rect.height < minSize) {
        console.warn(
          `Touch target too small: ${rect.width}×${rect.height}px. Minimum: ${minSize}×${minSize}px`,
          element
        );
      }
    }
  }, [ref]);
}