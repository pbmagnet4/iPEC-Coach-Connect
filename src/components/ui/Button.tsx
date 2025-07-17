import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  href?: string;
  icon?: React.ReactNode;
}

const buttonVariants = {
  initial: { scale: 1 },
  hover: { scale: 1.02 },
  tap: { scale: 0.98 },
};

export function Button({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading,
  href,
  icon,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    primary: "bg-brand-600 text-white hover:bg-brand-700 focus:ring-brand-500",
    secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500",
    outline: "border-2 border-brand-600 text-brand-600 hover:bg-brand-50 focus:ring-brand-500",
    ghost: "text-gray-700 hover:bg-gray-100 focus:ring-gray-500",
    gradient: "bg-gradient-to-r from-brand-600 to-blue-600 text-white hover:from-brand-700 hover:to-blue-700 focus:ring-brand-500",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm rounded-lg",
    md: "px-4 py-2 rounded-lg",
    lg: "px-6 py-3 text-lg rounded-lg",
  };

  const classes = cn(
    baseStyles,
    variants[variant],
    sizes[size],
    isLoading && "opacity-50 pointer-events-none",
    className
  );

  const content = (
    <>
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : icon ? (
        <span className="mr-2">{icon}</span>
      ) : null}
      {children}
    </>
  );

  if (href) {
    return (
      <Link to={href} className={classes}>
        <motion.span
          initial="initial"
          whileHover="hover"
          whileTap="tap"
          variants={buttonVariants}
          className="inline-flex items-center"
        >
          {content}
        </motion.span>
      </Link>
    );
  }

  return (
    <motion.button
      className={classes}
      disabled={disabled || isLoading}
      initial="initial"
      whileHover="hover"
      whileTap="tap"
      variants={buttonVariants}
      {...props}
    >
      {content}
    </motion.button>
  );
}