import React from 'react';
import { cn } from '../../lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  className,
  onClick
}: BadgeProps) {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-blue-100 text-blue-800',
    secondary: 'bg-gray-100 text-gray-600',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm'
  };

  const Component = onClick ? 'button' : 'span';

  return (
    <Component
      onClick={onClick}
      className={cn(
        'inline-flex items-center rounded-full font-medium transition-colors',
        variants[variant],
        sizes[size],
        onClick && 'hover:opacity-80 cursor-pointer',
        className
      )}
    >
      {children}
    </Component>
  );
}