/**
 * Booking Trust Signals Component
 * 
 * Provides trust signals specifically for the booking flow to reduce
 * friction and build confidence during the coach selection and booking process.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  RefreshCw, 
  Calendar, 
  CreditCard, 
  MessageCircle, 
  Clock,
  CheckCircle,
  Award,
  Users,
  Heart,
  DollarSign,
  Lock
} from 'lucide-react';
import { TrustSignal } from './TrustSignal';
import { SecurityBadge } from './SecurityBadge';
import { cn } from '../../lib/utils';

interface BookingTrustSignalsProps {
  context: 'selection' | 'booking' | 'payment' | 'confirmation';
  variant?: 'sidebar' | 'footer' | 'inline' | 'prominent';
  className?: string;
}

/**
 * Coach Selection Trust Signals - Build confidence in coach quality
 */
function CoachSelectionTrustSignals({ variant, className }: Omit<BookingTrustSignalsProps, 'context'>) {
  if (variant === 'sidebar') {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            All Coaches Are Verified
          </h3>
          <p className="text-sm text-gray-600">
            Rigorous screening ensures quality coaching
          </p>
        </div>
        
        <div className="space-y-4">
          <TrustSignal
            type="verification"
            variant="card"
            title="iPEC Certification"
            description="All coaches hold official iPEC certification"
            icon={Award}
          />
          
          <TrustSignal
            type="security"
            variant="card"
            title="Background Checked"
            description="Comprehensive background verification"
            icon={Shield}
          />
          
          <TrustSignal
            type="success"
            variant="card"
            title="94% Success Rate"
            description="Coaches help clients achieve goals"
            icon={CheckCircle}
          />
        </div>
        
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            <Heart className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-blue-900">Perfect Match guarantee</span>
          </div>
          <p className="text-sm text-blue-700">
            Not satisfied with your coach? We'll find you a better match within 30 days, guaranteed.
          </p>
        </div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={cn('flex flex-wrap gap-2 justify-center', className)}>
        <TrustSignal
          type="verification"
          variant="badge"
          title="iPEC Certified"
          size="sm"
          icon={Award}
        />
        <TrustSignal
          type="security"
          variant="badge"
          title="Background Checked"
          size="sm"
          icon={Shield}
        />
        <TrustSignal
          type="success"
          variant="badge"
          title="94% Success Rate"
          size="sm"
          icon={CheckCircle}
        />
      </div>
    );
  }

  return null;
}

/**
 * Booking Process Trust Signals - Reduce booking friction
 */
function BookingProcessTrustSignals({ variant, className }: Omit<BookingTrustSignalsProps, 'context'>) {
  if (variant === 'sidebar') {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Flexible & Risk-Free
          </h3>
          <p className="text-sm text-gray-600">
            Book with confidence - we've got you covered
          </p>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
            <RefreshCw className="h-5 w-5 text-green-600 flex-shrink-0" />
            <div>
              <div className="font-medium text-green-900">Free Rescheduling</div>
              <div className="text-sm text-green-700">Change your session anytime</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
            <Calendar className="h-5 w-5 text-blue-600 flex-shrink-0" />
            <div>
              <div className="font-medium text-blue-900">Instant Booking</div>
              <div className="text-sm text-blue-700">Secure your preferred time slots</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
            <MessageCircle className="h-5 w-5 text-purple-600 flex-shrink-0" />
            <div>
              <div className="font-medium text-purple-900">Direct Communication</div>
              <div className="text-sm text-purple-700">Connect with your coach instantly</div>
            </div>
          </div>
        </div>
        
        <div className="p-4 bg-orange-50 rounded-lg border-l-4 border-orange-400">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-5 w-5 text-orange-600" />
            <span className="font-medium text-orange-900">30-Day Money-Back Guarantee</span>
          </div>
          <p className="text-sm text-orange-700">
            Not satisfied with your first session? Get a full refund, no questions asked.
          </p>
        </div>
      </div>
    );
  }

  if (variant === 'footer') {
    return (
      <div className={cn('space-y-3', className)}>
        <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <RefreshCw className="h-4 w-4 text-green-600" />
            <span>Free rescheduling</span>
          </div>
          <div className="flex items-center gap-1">
            <DollarSign className="h-4 w-4 text-orange-600" />
            <span>30-day guarantee</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4 text-blue-600" />
            <span>Instant booking</span>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

/**
 * Payment Trust Signals - Build confidence during payment
 */
function PaymentTrustSignals({ variant, className }: Omit<BookingTrustSignalsProps, 'context'>) {
  if (variant === 'sidebar') {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Secure Payment Processing
          </h3>
          <p className="text-sm text-gray-600">
            Your payment information is completely secure
          </p>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
            <Lock className="h-5 w-5 text-green-600 flex-shrink-0" />
            <div>
              <div className="font-medium text-green-900">256-bit SSL Encryption</div>
              <div className="text-sm text-green-700">Bank-level security for your data</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
            <CreditCard className="h-5 w-5 text-blue-600 flex-shrink-0" />
            <div>
              <div className="font-medium text-blue-900">Stripe Payment Processing</div>
              <div className="text-sm text-blue-700">Trusted by millions worldwide</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
            <Shield className="h-5 w-5 text-purple-600 flex-shrink-0" />
            <div>
              <div className="font-medium text-purple-900">PCI DSS Compliant</div>
              <div className="text-sm text-purple-700">Highest security standards</div>
            </div>
          </div>
        </div>
        
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="font-medium text-gray-900">Payment Protection</span>
          </div>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• Your card details are never stored</li>
            <li>• Automatic fraud detection</li>
            <li>• Instant refund processing</li>
            <li>• 24/7 payment support</li>
          </ul>
        </div>
      </div>
    );
  }

  if (variant === 'footer') {
    return (
      <div className={cn('space-y-3', className)}>
        <div className="flex items-center justify-center gap-4">
          <SecurityBadge type="ssl" size="sm" showText={false} />
          <SecurityBadge type="encryption" size="sm" showText={false} />
          <div className="flex items-center gap-1">
            <CreditCard className="h-4 w-4 text-blue-600" />
            <span className="text-xs text-blue-600">Stripe Secure</span>
          </div>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-600">
            Your payment is protected by bank-level encryption
          </p>
        </div>
      </div>
    );
  }

  return null;
}

/**
 * Booking Confirmation Trust Signals - Reinforce confidence post-booking
 */
function ConfirmationTrustSignals({ variant, className }: Omit<BookingTrustSignalsProps, 'context'>) {
  if (variant === 'sidebar' || variant === 'footer') {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Your Booking is Confirmed!
          </h3>
          <p className="text-sm text-gray-600">
            You're all set for your coaching journey
          </p>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
            <div>
              <div className="font-medium text-green-900">Booking Confirmed</div>
              <div className="text-sm text-green-700">Your session is secured and scheduled</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
            <MessageCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
            <div>
              <div className="font-medium text-blue-900">Coach Notified</div>
              <div className="text-sm text-blue-700">Your coach will reach out soon</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
            <Calendar className="h-5 w-5 text-purple-600 flex-shrink-0" />
            <div>
              <div className="font-medium text-purple-900">Calendar Reminder</div>
              <div className="text-sm text-purple-700">We'll send you a reminder 24 hours before</div>
            </div>
          </div>
        </div>
        
        <div className="p-4 bg-orange-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="h-5 w-5 text-orange-600" />
            <span className="font-medium text-orange-900">Still Protected</span>
          </div>
          <p className="text-sm text-orange-700">
            Remember: You have 30 days to request a refund if you're not completely satisfied.
          </p>
        </div>
      </div>
    );
  }

  return null;
}

/**
 * Main Booking Trust Signals Component
 */
export function BookingTrustSignals({ context, variant = 'sidebar', className }: BookingTrustSignalsProps) {
  switch (context) {
    case 'selection':
      return <CoachSelectionTrustSignals variant={variant} className={className} />;
    case 'booking':
      return <BookingProcessTrustSignals variant={variant} className={className} />;
    case 'payment':
      return <PaymentTrustSignals variant={variant} className={className} />;
    case 'confirmation':
      return <ConfirmationTrustSignals variant={variant} className={className} />;
    default:
      return null;
  }
}

/**
 * Quick Booking Trust Footer - Minimal trust signals for any booking step
 */
export function QuickBookingTrustFooter({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center gap-4 py-3', className)}>
      <div className="flex items-center gap-1">
        <RefreshCw className="h-3 w-3 text-green-600" />
        <span className="text-xs text-green-600">Free reschedule</span>
      </div>
      <div className="flex items-center gap-1">
        <DollarSign className="h-3 w-3 text-orange-600" />
        <span className="text-xs text-orange-600">30-day guarantee</span>
      </div>
      <div className="flex items-center gap-1">
        <Shield className="h-3 w-3 text-blue-600" />
        <span className="text-xs text-blue-600">Secure payment</span>
      </div>
    </div>
  );
}

/**
 * Booking Trust Banner - Prominent trust display
 */
export function BookingTrustBanner({ className }: { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        'p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-green-600" />
          <div>
            <div className="font-semibold text-gray-900">Risk-Free Booking</div>
            <div className="text-sm text-gray-600">30-day money-back guarantee</div>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-green-700">Verified coaches</span>
          </div>
          <div className="flex items-center gap-1">
            <Lock className="h-4 w-4 text-blue-600" />
            <span className="text-blue-700">Secure payment</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}