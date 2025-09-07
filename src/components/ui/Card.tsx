import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'glass' | 'gradient';
  hover?: boolean;
}

const _cardVariants = {
  initial: { y: 0 },
  hover: { y: -8 },
};

export function Card({ 
  children, 
  className,
  variant = 'default',
  hover = false,
}: CardProps) {
  const _variants = {
    default: "bg-white",
    glass: "glass-card",
    gradient: "bg-gradient-to-br from-brand-500/10 to-blue-500/10",
  };

  const _Component = hover ? motion.div : 'div';
  const _motionProps = hover ? {
    initial: "initial",
    whileHover: "hover",
    variants: cardVariants,
    transition: { type: "spring", stiffness: 300, damping: 20 }
  } : {};

  return (
    <Component
      className={cn(
        "rounded-xl shadow-sm overflow-hidden",
        variants[variant],
        "transition-shadow duration-300 hover:shadow-lg",
        className
      )}
      {...motionProps}
    >
      {children}
    </Component>
  );
}

Card.Header = function CardHeader({ children, className }: Omit<CardProps, 'variant' | 'hover'>) {
  return (
    <div className={cn(
      "p-6 border-b border-gray-100",
      "bg-gradient-to-r from-transparent via-gray-50 to-transparent",
      className
    )}>
      {children}
    </div>
  );
};

Card.Body = function CardBody({ children, className }: Omit<CardProps, 'variant' | 'hover'>) {
  return (
    <div className={cn("p-6", className)}>
      {children}
    </div>
  );
};

Card.Footer = function CardFooter({ children, className }: Omit<CardProps, 'variant' | 'hover'>) {
  return (
    <div className={cn(
      "p-6 border-t border-gray-100",
      "bg-gradient-to-r from-transparent via-gray-50 to-transparent",
      className
    )}>
      {children}
    </div>
  );
};

// Export alternative names for consistency with analytics components
export const _CardHeader = Card.Header;
export const _CardContent = Card.Body;
export function CardTitle({ children, className }: Omit<CardProps, 'variant' | 'hover'>) {
  return (
    <h3 className={cn("text-lg font-semibold text-gray-900", className)}>
      {children}
    </h3>
  );
}