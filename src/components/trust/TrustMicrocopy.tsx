/**
 * Trust Microcopy Component
 * 
 * Provides contextual trust-building microcopy and messaging
 * throughout the platform to reduce friction and build confidence.
 */

import React from 'react';
import { 
  AlertCircle, 
  Award, 
  CheckCircle, 
  Clock, 
  Eye, 
  Heart, 
  Info,
  Lock,
  MessageCircle,
  Shield,
  Users
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface TrustMicrocopyProps {
  context: 
    | 'email_input' 
    | 'password_input' 
    | 'payment_form' 
    | 'profile_data' 
    | 'coach_selection' 
    | 'booking_flow' 
    | 'community_join' 
    | 'data_sharing' 
    | 'subscription'
    | 'contact_form'
    | 'feedback_form'
    | 'goal_setting'
    | 'session_notes';
  variant?: 'tooltip' | 'helper' | 'inline' | 'banner';
  className?: string;
}

interface MicrocopyConfig {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
  subtext?: string;
  color: string;
  bgColor: string;
}

const microcopyConfig: Record<TrustMicrocopyProps['context'], MicrocopyConfig> = {
  email_input: {
    icon: Shield,
    text: 'Your email is secure with us',
    subtext: 'We use bank-level encryption and never share your information',
    color: 'text-green-600',
    bgColor: 'bg-green-50'
  },
  password_input: {
    icon: Lock,
    text: 'Protected by 256-bit encryption',
    subtext: 'Your password is encrypted and never stored in plain text',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  },
  payment_form: {
    icon: Shield,
    text: 'Your payment is 100% secure',
    subtext: 'Powered by Stripe with PCI DSS compliance',
    color: 'text-green-600',
    bgColor: 'bg-green-50'
  },
  profile_data: {
    icon: Eye,
    text: 'Your privacy is protected',
    subtext: 'Profile data is only shared with your chosen coaches',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50'
  },
  coach_selection: {
    icon: Award,
    text: 'All coaches are iPEC certified',
    subtext: 'Background checked and verified by our team',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  },
  booking_flow: {
    icon: CheckCircle,
    text: '30-day money-back guarantee',
    subtext: 'Not satisfied? Get a full refund, no questions asked',
    color: 'text-green-600',
    bgColor: 'bg-green-50'
  },
  community_join: {
    icon: Users,
    text: 'Join 15,000+ coaching professionals',
    subtext: 'A supportive community focused on growth and success',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  },
  data_sharing: {
    icon: Lock,
    text: 'We never sell your data',
    subtext: 'Your information stays private and secure',
    color: 'text-green-600',
    bgColor: 'bg-green-50'
  },
  subscription: {
    icon: Clock,
    text: 'Cancel anytime, hassle-free',
    subtext: 'No long-term commitments or hidden fees',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50'
  },
  contact_form: {
    icon: MessageCircle,
    text: 'We respond within 24 hours',
    subtext: 'Your message goes directly to our support team',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  },
  feedback_form: {
    icon: Heart,
    text: 'Your feedback shapes our platform',
    subtext: 'Anonymous feedback helps us improve for everyone',
    color: 'text-pink-600',
    bgColor: 'bg-pink-50'
  },
  goal_setting: {
    icon: CheckCircle,
    text: '94% of users achieve their goals',
    subtext: 'Our proven coaching methodology gets results',
    color: 'text-green-600',
    bgColor: 'bg-green-50'
  },
  session_notes: {
    icon: Lock,
    text: 'Session notes are private and secure',
    subtext: 'Only you and your coach can access this information',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50'
  }
};

export function TrustMicrocopy({ 
  context, 
  variant = 'helper', 
  className 
}: TrustMicrocopyProps) {
  const config = microcopyConfig[context];
  const Icon = config.icon;

  if (variant === 'tooltip') {
    return (
      <div className={cn(
        'inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
        config.color,
        config.bgColor,
        className
      )}>
        <Icon className="h-4 w-4 flex-shrink-0" />
        <span>{config.text}</span>
      </div>
    );
  }

  if (variant === 'helper') {
    return (
      <div className={cn('flex items-start gap-3 p-3 rounded-lg', config.bgColor, className)}>
        <Icon className={cn('h-5 w-5 flex-shrink-0 mt-0.5', config.color)} />
        <div>
          <div className={cn('font-medium', config.color)}>{config.text}</div>
          {config.subtext && (
            <div className="text-sm text-gray-600 mt-1">{config.subtext}</div>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={cn('flex items-center gap-2 text-sm', config.color, className)}>
        <Icon className="h-4 w-4 flex-shrink-0" />
        <span>{config.text}</span>
      </div>
    );
  }

  if (variant === 'banner') {
    return (
      <div className={cn(
        'flex items-center justify-center gap-3 p-4 rounded-lg',
        config.bgColor,
        className
      )}>
        <Icon className={cn('h-6 w-6 flex-shrink-0', config.color)} />
        <div className="text-center">
          <div className={cn('font-semibold', config.color)}>{config.text}</div>
          {config.subtext && (
            <div className="text-sm text-gray-600 mt-1">{config.subtext}</div>
          )}
        </div>
      </div>
    );
  }

  return null;
}

/**
 * Trust Microcopy Collection - Multiple trust messages in one component
 */
interface TrustMicrocopyCollectionProps {
  contexts: TrustMicrocopyProps['context'][];
  variant?: TrustMicrocopyProps['variant'];
  layout?: 'stack' | 'grid' | 'carousel';
  className?: string;
}

export function TrustMicrocopyCollection({
  contexts,
  variant = 'helper',
  layout = 'stack',
  className
}: TrustMicrocopyCollectionProps) {
  const layoutClasses = {
    stack: 'space-y-4',
    grid: 'grid grid-cols-1 md:grid-cols-2 gap-4',
    carousel: 'flex gap-4 overflow-x-auto'
  };

  return (
    <div className={cn(layoutClasses[layout], className)}>
      {contexts.map((context) => (
        <TrustMicrocopy
          key={context}
          context={context}
          variant={variant}
        />
      ))}
    </div>
  );
}

/**
 * Context-specific trust microcopy hooks
 */
export function getFormTrustMicrocopy(formType: 'auth' | 'payment' | 'profile' | 'contact') {
  const contextMap = {
    auth: ['email_input', 'password_input', 'data_sharing'],
    payment: ['payment_form', 'booking_flow', 'subscription'],
    profile: ['profile_data', 'data_sharing', 'coach_selection'],
    contact: ['contact_form', 'feedback_form', 'data_sharing']
  };

  return contextMap[formType] as TrustMicrocopyProps['context'][];
}

/**
 * Smart Trust Microcopy - Context-aware trust messaging
 */
interface SmartTrustMicrocopyProps {
  trigger: 'form_focus' | 'button_hover' | 'page_load' | 'error_state';
  formType?: 'auth' | 'payment' | 'profile' | 'contact';
  className?: string;
}

export function SmartTrustMicrocopy({ 
  trigger, 
  formType = 'auth', 
  className 
}: SmartTrustMicrocopyProps) {
  const getContextForTrigger = () => {
    switch (trigger) {
      case 'form_focus':
        return formType === 'auth' ? 'email_input' : 
               formType === 'payment' ? 'payment_form' : 
               formType === 'profile' ? 'profile_data' : 'contact_form';
      case 'button_hover':
        return formType === 'payment' ? 'booking_flow' : 'data_sharing';
      case 'page_load':
        return 'community_join';
      case 'error_state':
        return 'contact_form';
      default:
        return 'data_sharing';
    }
  };

  return (
    <TrustMicrocopy
      context={getContextForTrigger()}
      variant="inline"
      className={className}
    />
  );
}

/**
 * Trust Microcopy for specific use cases
 */
export function EmailInputTrust({ className }: { className?: string }) {
  return (
    <TrustMicrocopy
      context="email_input"
      variant="helper"
      className={className}
    />
  );
}

export function PaymentTrust({ className }: { className?: string }) {
  return (
    <TrustMicrocopy
      context="payment_form"
      variant="helper"
      className={className}
    />
  );
}

export function CoachSelectionTrust({ className }: { className?: string }) {
  return (
    <TrustMicrocopy
      context="coach_selection"
      variant="helper"
      className={className}
    />
  );
}

export function BookingGuarantee({ className }: { className?: string }) {
  return (
    <TrustMicrocopy
      context="booking_flow"
      variant="banner"
      className={className}
    />
  );
}

export function PrivacyAssurance({ className }: { className?: string }) {
  return (
    <TrustMicrocopy
      context="data_sharing"
      variant="helper"
      className={className}
    />
  );
}

export function CommunityWelcome({ className }: { className?: string }) {
  return (
    <TrustMicrocopy
      context="community_join"
      variant="banner"
      className={className}
    />
  );
}