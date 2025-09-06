/**
 * Verification Badge Component
 * 
 * Displays coach verification and certification indicators to build
 * credibility and trust in coach qualifications.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Award, 
  BadgeCheck, 
  Certificate, 
  CheckCircle, 
  Clock, 
  Medal,
  Shield,
  Star,
  TrendingUp,
  Users
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface VerificationBadgeProps {
  type: 'ipec' | 'certified' | 'verified' | 'background' | 'elite' | 'featured' | 'experienced' | 'top_rated';
  level?: 'bronze' | 'silver' | 'gold' | 'platinum';
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
  animate?: boolean;
}

const verificationTypes = {
  ipec: {
    icon: Award,
    title: 'iPEC Certified',
    description: 'Official iPEC certification',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  certified: {
    icon: Certificate,
    title: 'Certified Coach',
    description: 'Professionally certified',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  verified: {
    icon: BadgeCheck,
    title: 'Verified',
    description: 'Identity & credentials verified',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200'
  },
  background: {
    icon: Shield,
    title: 'Background Checked',
    description: 'Background verification complete',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200'
  },
  elite: {
    icon: Medal,
    title: 'Elite Coach',
    description: 'Top 5% of coaches',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  },
  featured: {
    icon: Star,
    title: 'Featured Coach',
    description: 'Recommended by iPEC',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200'
  },
  experienced: {
    icon: Clock,
    title: 'Experienced',
    description: '500+ coaching hours',
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-200'
  },
  top_rated: {
    icon: TrendingUp,
    title: 'Top Rated',
    description: '4.9+ star rating',
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-200'
  }
};

const levelStyles = {
  bronze: {
    accent: 'text-amber-600',
    ring: 'ring-amber-200',
    gradient: 'from-amber-50 to-yellow-50'
  },
  silver: {
    accent: 'text-gray-600',
    ring: 'ring-gray-200',
    gradient: 'from-gray-50 to-slate-50'
  },
  gold: {
    accent: 'text-yellow-600',
    ring: 'ring-yellow-200',
    gradient: 'from-yellow-50 to-amber-50'
  },
  platinum: {
    accent: 'text-violet-600',
    ring: 'ring-violet-200',
    gradient: 'from-violet-50 to-purple-50'
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

export function VerificationBadge({
  type,
  level,
  size = 'md',
  showText = true,
  className,
  animate = true
}: VerificationBadgeProps) {
  const config = verificationTypes[type];
  const Icon = config.icon;
  const styles = sizeStyles[size];
  const levelConfig = level ? levelStyles[level] : null;

  const badge = (
    <div className={cn(
      'inline-flex items-center gap-2 rounded-full border font-medium transition-all',
      'hover:shadow-sm cursor-help',
      config.bgColor,
      config.borderColor,
      config.color,
      styles.container,
      levelConfig && [
        'ring-2',
        levelConfig.ring,
        `bg-gradient-to-r ${levelConfig.gradient}`
      ],
      className
    )}>
      <Icon className={cn(
        'flex-shrink-0',
        styles.icon,
        levelConfig && levelConfig.accent
      )} />
      {showText && (
        <div className="flex flex-col">
          <span className="font-semibold">
            {config.title}
            {level && (
              <span className={cn('ml-1 capitalize', levelConfig?.accent)}>
                {level}
              </span>
            )}
          </span>
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
 * Coach Verification Panel Component
 * 
 * Displays comprehensive coach verification information
 */
interface CoachVerificationPanelProps {
  verifications: {
    type: VerificationBadgeProps['type'];
    level?: VerificationBadgeProps['level'];
    verified?: boolean;
    date?: string;
  }[];
  className?: string;
  variant?: 'card' | 'inline' | 'detailed';
}

export function CoachVerificationPanel({
  verifications,
  className,
  variant = 'card'
}: CoachVerificationPanelProps) {
  if (variant === 'inline') {
    return (
      <div className={cn('flex flex-wrap gap-2', className)}>
        {verifications.map((verification, index) => (
          <VerificationBadge
            key={index}
            type={verification.type}
            level={verification.level}
            size="sm"
            showText={false}
            animate={true}
          />
        ))}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={cn(
          'p-6 bg-white rounded-xl border border-gray-200 shadow-sm',
          className
        )}
      >
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-5 w-5 text-green-600" />
          <h3 className="font-semibold text-gray-900">
            Verified Credentials
          </h3>
        </div>
        <div className="space-y-3">
          {verifications.map((verification, index) => (
            <div key={index} className="flex items-center justify-between">
              <VerificationBadge
                type={verification.type}
                level={verification.level}
                size="sm"
                showText={true}
                animate={false}
              />
              {verification.verified && (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  if (variant === 'detailed') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={cn(
          'p-6 bg-gradient-to-r from-blue-50 to-green-50 rounded-xl border-2 border-green-200',
          className
        )}
      >
        <div className="text-center mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            Fully Verified Coach
          </h3>
          <p className="text-sm text-gray-600">
            This coach has completed our comprehensive verification process
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {verifications.map((verification, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 bg-white rounded-lg border"
            >
              <VerificationBadge
                type={verification.type}
                level={verification.level}
                size="md"
                showText={true}
                animate={false}
              />
              <div className="flex-1">
                {verification.date && (
                  <div className="text-xs text-gray-500">
                    Verified {verification.date}
                  </div>
                )}
              </div>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  return null;
}