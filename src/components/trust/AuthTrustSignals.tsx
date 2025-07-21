/**
 * Auth Trust Signals Component
 * 
 * Provides context-specific trust messaging for authentication flows
 * to reduce friction and build confidence during signup/login.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Eye, CheckCircle, Users, Award, Clock } from 'lucide-react';
import { SecurityBadge, SecurityTrustBar } from './SecurityBadge';
import { SocialProof } from './SocialProof';
import { TrustSignal } from './TrustSignal';
import { cn } from '../../lib/utils';

interface AuthTrustSignalsProps {
  context: 'signup' | 'login' | 'reset' | 'verification';
  variant?: 'sidebar' | 'footer' | 'inline' | 'prominent';
  className?: string;
}

/**
 * Signup Trust Signals - Build confidence for new users
 */
function SignupTrustSignals({ variant, className }: Omit<AuthTrustSignalsProps, 'context'>) {
  if (variant === 'sidebar') {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Join 15,000+ Professionals
          </h3>
          <p className="text-sm text-gray-600">
            Trusted by leaders from top companies worldwide
          </p>
        </div>
        
        <div className="space-y-4">
          <TrustSignal
            type="security"
            variant="card"
            title="Bank-Level Security"
            description="Your data is protected with 256-bit encryption"
            icon={Shield}
          />
          
          <TrustSignal
            type="social"
            variant="card"
            title="Active Community"
            description="1,342 members online right now"
            icon={Users}
          />
          
          <TrustSignal
            type="success"
            variant="card"
            title="94% Success Rate"
            description="Members achieve their coaching goals"
            icon={Award}
          />
        </div>
        
        <div className="pt-4 border-t">
          <SocialProof type="activity" />
        </div>
      </div>
    );
  }

  if (variant === 'footer') {
    return (
      <div className={cn('space-y-4', className)}>
        <SecurityTrustBar variant="compact" />
        <div className="text-center">
          <p className="text-xs text-gray-600">
            By signing up, you agree to our Terms of Service and Privacy Policy.
            <br />
            Your information is secure and will never be shared.
          </p>
        </div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={cn('flex flex-wrap gap-2 justify-center', className)}>
        <TrustSignal
          type="security"
          variant="badge"
          title="SSL Secured"
          size="sm"
          icon={Lock}
        />
        <TrustSignal
          type="social"
          variant="badge"
          title="15,000+ Users"
          size="sm"
          icon={Users}
        />
        <TrustSignal
          type="verification"
          variant="badge"
          title="iPEC Verified"
          size="sm"
          icon={CheckCircle}
        />
      </div>
    );
  }

  if (variant === 'prominent') {
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
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Start Your Coaching Journey Today
          </h3>
          <p className="text-gray-600">
            Join thousands who've transformed their lives with iPEC coaching
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Shield className="h-6 w-6 text-green-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">Secure & Private</h4>
            <p className="text-sm text-gray-600">Bank-level encryption protects your data</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Award className="h-6 w-6 text-blue-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">Certified Coaches</h4>
            <p className="text-sm text-gray-600">All coaches are iPEC certified</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">Proven Results</h4>
            <p className="text-sm text-gray-600">94% of users achieve their goals</p>
          </div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
            <span>✓ 30-day money-back guarantee</span>
            <span>✓ Cancel anytime</span>
            <span>✓ 24/7 support</span>
          </div>
        </div>
      </motion.div>
    );
  }

  return null;
}

/**
 * Login Trust Signals - Reassure returning users
 */
function LoginTrustSignals({ variant, className }: Omit<AuthTrustSignalsProps, 'context'>) {
  if (variant === 'sidebar') {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Welcome Back
          </h3>
          <p className="text-sm text-gray-600">
            Your secure coaching platform
          </p>
        </div>
        
        <SocialProof type="community" />
        
        <div className="pt-4 border-t">
          <div className="flex items-center justify-center gap-2">
            <Lock className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-600">Secure login</span>
          </div>
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
          <SecurityBadge type="gdpr" size="sm" showText={false} />
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-600">
            Your login is protected by bank-level security
          </p>
        </div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={cn('flex items-center justify-center gap-2', className)}>
        <Shield className="h-4 w-4 text-green-600" />
        <span className="text-sm text-green-600">Secure & encrypted</span>
      </div>
    );
  }

  return null;
}

/**
 * Password Reset Trust Signals - Build confidence during vulnerable moment
 */
function PasswordResetTrustSignals({ variant, className }: Omit<AuthTrustSignalsProps, 'context'>) {
  if (variant === 'sidebar' || variant === 'footer') {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Account Recovery
          </h3>
          <p className="text-sm text-gray-600">
            We'll help you regain access securely
          </p>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
            <Shield className="h-5 w-5 text-blue-600 flex-shrink-0" />
            <div>
              <div className="font-medium text-blue-900">Secure Process</div>
              <div className="text-sm text-blue-700">Identity verification required</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
            <Eye className="h-5 w-5 text-green-600 flex-shrink-0" />
            <div>
              <div className="font-medium text-green-900">Privacy Protected</div>
              <div className="text-sm text-green-700">Your data remains secure</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
            <Clock className="h-5 w-5 text-purple-600 flex-shrink-0" />
            <div>
              <div className="font-medium text-purple-900">Quick Recovery</div>
              <div className="text-sm text-purple-700">Back to coaching in minutes</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

/**
 * Email Verification Trust Signals - Maintain trust during verification
 */
function VerificationTrustSignals({ variant, className }: Omit<AuthTrustSignalsProps, 'context'>) {
  if (variant === 'sidebar' || variant === 'footer') {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Almost There!
          </h3>
          <p className="text-sm text-gray-600">
            Check your email to verify your account
          </p>
        </div>
        
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-blue-900">Verification Benefits</span>
          </div>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Access to all coaching features</li>
            <li>• Secure account protection</li>
            <li>• Direct coach messaging</li>
            <li>• Community participation</li>
          </ul>
        </div>
        
        <div className="text-center">
          <p className="text-xs text-gray-600">
            Didn't receive an email? Check your spam folder or
            <br />
            <button className="text-blue-600 hover:text-blue-700 underline">
              resend verification
            </button>
          </p>
        </div>
      </div>
    );
  }

  return null;
}

/**
 * Main Auth Trust Signals Component
 */
export function AuthTrustSignals({ context, variant = 'sidebar', className }: AuthTrustSignalsProps) {
  switch (context) {
    case 'signup':
      return <SignupTrustSignals variant={variant} className={className} />;
    case 'login':
      return <LoginTrustSignals variant={variant} className={className} />;
    case 'reset':
      return <PasswordResetTrustSignals variant={variant} className={className} />;
    case 'verification':
      return <VerificationTrustSignals variant={variant} className={className} />;
    default:
      return null;
  }
}

/**
 * Quick Auth Trust Footer - Minimal trust signals for any auth form
 */
export function QuickAuthTrustFooter({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center gap-4 py-3', className)}>
      <div className="flex items-center gap-1">
        <Lock className="h-3 w-3 text-green-600" />
        <span className="text-xs text-green-600">SSL Secured</span>
      </div>
      <div className="flex items-center gap-1">
        <Users className="h-3 w-3 text-blue-600" />
        <span className="text-xs text-blue-600">15,000+ Users</span>
      </div>
      <div className="flex items-center gap-1">
        <Award className="h-3 w-3 text-purple-600" />
        <span className="text-xs text-purple-600">iPEC Certified</span>
      </div>
    </div>
  );
}