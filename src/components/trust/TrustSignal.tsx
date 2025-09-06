/**
 * Universal Trust Signal Component
 * 
 * Provides flexible trust signal display with consistent styling
 * and accessibility features for building user confidence.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Award, 
  CheckCircle, 
  Clock, 
  Eye, 
  Heart, 
  Lock, 
  type LucideIcon, 
  MessageCircle,
  Shield,
  Star,
  Target,
  TrendingUp,
  Users
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface TrustSignalProps {
  type: 'security' | 'verification' | 'social' | 'guarantee' | 'success' | 'community';
  variant?: 'badge' | 'card' | 'inline' | 'banner';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  title: string;
  description?: string;
  value?: string | number;
  className?: string;
  animate?: boolean;
}

const iconMap: Record<string, LucideIcon> = {
  security: Shield,
  verification: CheckCircle,
  social: Users,
  guarantee: Award,
  success: TrendingUp,
  community: MessageCircle,
  lock: Lock,
  eye: Eye,
  clock: Clock,
  heart: Heart,
  star: Star,
  target: Target
};

const typeStyles = {
  security: 'bg-green-50 text-green-800 border-green-200',
  verification: 'bg-blue-50 text-blue-800 border-blue-200',
  social: 'bg-purple-50 text-purple-800 border-purple-200',
  guarantee: 'bg-orange-50 text-orange-800 border-orange-200',
  success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  community: 'bg-pink-50 text-pink-800 border-pink-200'
};

const sizeStyles = {
  sm: 'text-xs px-2 py-1',
  md: 'text-sm px-3 py-2',
  lg: 'text-base px-4 py-3'
};

export function TrustSignal({
  type,
  variant = 'badge',
  size = 'md',
  icon,
  title,
  description,
  value,
  className,
  animate = true
}: TrustSignalProps) {
  const Icon = icon || iconMap[type];
  
  const baseClasses = cn(
    'inline-flex items-center gap-2 rounded-lg border font-medium transition-all',
    typeStyles[type],
    sizeStyles[size],
    className
  );

  const content = (
    <>
      <Icon className={cn(
        'flex-shrink-0',
        size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-4 w-4' : 'h-5 w-5'
      )} />
      <div className="flex flex-col">
        <span className="font-medium">{title}</span>
        {description && (
          <span className={cn(
            'text-xs opacity-75',
            size === 'lg' ? 'text-sm' : 'text-xs'
          )}>
            {description}
          </span>
        )}
      </div>
      {value && (
        <span className="ml-auto font-bold">
          {value}
        </span>
      )}
    </>
  );

  if (variant === 'badge') {
    return animate ? (
      <motion.span
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className={baseClasses}
      >
        {content}
      </motion.span>
    ) : (
      <span className={baseClasses}>
        {content}
      </span>
    );
  }

  if (variant === 'card') {
    return (
      <motion.div
        initial={animate ? { opacity: 0, y: 20 } : {}}
        animate={animate ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.4 }}
        className={cn(
          'p-6 rounded-xl border bg-white shadow-sm',
          'hover:shadow-md transition-shadow',
          className
        )}
      >
        <div className="flex items-start gap-4">
          <div className={cn(
            'flex-shrink-0 p-2 rounded-lg',
            typeStyles[type]
          )}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
            {description && (
              <p className="text-sm text-gray-600">{description}</p>
            )}
            {value && (
              <p className="text-lg font-bold text-gray-900 mt-2">{value}</p>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  if (variant === 'inline') {
    return (
      <span className={cn(
        'inline-flex items-center gap-1 text-sm',
        typeStyles[type].replace('bg-', 'text-').replace('border-', ''),
        className
      )}>
        <Icon className="h-4 w-4" />
        {title}
        {value && <span className="font-semibold">({value})</span>}
      </span>
    );
  }

  if (variant === 'banner') {
    return (
      <motion.div
        initial={animate ? { opacity: 0, y: -20 } : {}}
        animate={animate ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.3 }}
        className={cn(
          'w-full p-4 rounded-lg border',
          typeStyles[type],
          className
        )}
      >
        <div className="flex items-center justify-center gap-3">
          <Icon className="h-5 w-5 flex-shrink-0" />
          <div className="text-center">
            <div className="font-semibold">{title}</div>
            {description && (
              <div className="text-sm opacity-75">{description}</div>
            )}
          </div>
          {value && (
            <div className="font-bold text-lg">{value}</div>
          )}
        </div>
      </motion.div>
    );
  }

  return null;
}