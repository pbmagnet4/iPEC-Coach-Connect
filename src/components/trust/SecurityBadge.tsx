/**
 * Security Badge Component
 * 
 * Displays security and encryption indicators to build user confidence
 * in data protection and platform security.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Eye, CheckCircle, Globe, Database } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SecurityBadgeProps {
  type: 'ssl' | 'encryption' | 'gdpr' | 'privacy' | 'secure' | 'verified';
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
  animate?: boolean;
}

const securityTypes = {
  ssl: {
    icon: Lock,
    title: 'SSL Secured',
    description: 'Bank-level encryption',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  encryption: {
    icon: Shield,
    title: '256-bit Encryption',
    description: 'Military-grade security',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  gdpr: {
    icon: Eye,
    title: 'GDPR Compliant',
    description: 'European privacy standards',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  },
  privacy: {
    icon: Database,
    title: 'Privacy Protected',
    description: 'Your data stays private',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200'
  },
  secure: {
    icon: CheckCircle,
    title: 'Secure Platform',
    description: 'Trusted by thousands',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200'
  },
  verified: {
    icon: Globe,
    title: 'Verified Secure',
    description: 'Third-party audited',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200'
  }
};

const sizeStyles = {
  sm: {
    container: 'text-xs px-2 py-1',
    icon: 'h-3 w-3',
    text: 'text-xs'
  },
  md: {
    container: 'text-sm px-3 py-2',
    icon: 'h-4 w-4',
    text: 'text-sm'
  },
  lg: {
    container: 'text-base px-4 py-3',
    icon: 'h-5 w-5',
    text: 'text-base'
  }
};

export function SecurityBadge({
  type,
  size = 'md',
  showText = true,
  className,
  animate = true
}: SecurityBadgeProps) {
  const config = securityTypes[type];
  const Icon = config.icon;
  const styles = sizeStyles[size];

  const badge = (
    <div className={cn(
      'inline-flex items-center gap-2 rounded-full border font-medium transition-all',
      'hover:shadow-sm cursor-help',
      config.bgColor,
      config.borderColor,
      config.color,
      styles.container,
      className
    )}>
      <Icon className={cn('flex-shrink-0', styles.icon)} />
      {showText && (
        <div className="flex flex-col">
          <span className="font-semibold">{config.title}</span>
          <span className={cn('opacity-75', styles.text)}>
            {config.description}
          </span>
        </div>
      )}
    </div>
  );

  return animate ? (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      title={`${config.title}: ${config.description}`}
    >
      {badge}
    </motion.div>
  ) : (
    <div title={`${config.title}: ${config.description}`}>
      {badge}
    </div>
  );
}

/**
 * Security Badge Collection Component
 * 
 * Displays multiple security badges in a consistent layout
 */
interface SecurityBadgeCollectionProps {
  badges: SecurityBadgeProps['type'][];
  layout?: 'horizontal' | 'vertical' | 'grid';
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export function SecurityBadgeCollection({
  badges,
  layout = 'horizontal',
  size = 'md',
  showText = true,
  className
}: SecurityBadgeCollectionProps) {
  const layoutStyles = {
    horizontal: 'flex flex-wrap gap-2',
    vertical: 'flex flex-col gap-2',
    grid: 'grid grid-cols-2 gap-2'
  };

  return (
    <div className={cn(layoutStyles[layout], className)}>
      {badges.map((badge, index) => (
        <SecurityBadge
          key={badge}
          type={badge}
          size={size}
          showText={showText}
          animate={true}
        />
      ))}
    </div>
  );
}

/**
 * Security Trust Bar Component
 * 
 * Displays a prominent security trust bar with multiple indicators
 */
interface SecurityTrustBarProps {
  className?: string;
  variant?: 'default' | 'compact' | 'prominent';
}

export function SecurityTrustBar({ 
  className,
  variant = 'default'
}: SecurityTrustBarProps) {
  const variants = {
    default: 'p-4 bg-gray-50 border rounded-lg',
    compact: 'p-2 bg-white border-t',
    prominent: 'p-6 bg-gradient-to-r from-blue-50 to-green-50 border-2 border-green-200 rounded-xl'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(variants[variant], className)}
    >
      <div className="flex flex-col items-center gap-3">
        <div className="text-center">
          <h3 className="font-semibold text-gray-900 mb-1">
            Your Security & Privacy Matter
          </h3>
          <p className="text-sm text-gray-600">
            Bank-level encryption protects your data
          </p>
        </div>
        <SecurityBadgeCollection
          badges={['ssl', 'encryption', 'gdpr', 'privacy']}
          layout="horizontal"
          size="sm"
          showText={false}
        />
      </div>
    </motion.div>
  );
}