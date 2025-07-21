/**
 * Trust Components - Comprehensive trust signal system
 * 
 * Exports all trust-related components for building user confidence
 * and reducing friction throughout the iPEC Coach Connect platform.
 */

// Core trust components
export { TrustSignal } from './TrustSignal';
export { SecurityBadge, SecurityBadgeCollection, SecurityTrustBar } from './SecurityBadge';
export { VerificationBadge, CoachVerificationPanel } from './VerificationBadge';
export { 
  SocialProof, 
  LiveActivityFeed, 
  PlatformStats, 
  TestimonialCarousel, 
  SuccessStories, 
  CommunityTrustIndicators 
} from './SocialProof';

// Context-specific trust components
export { AuthTrustSignals, QuickAuthTrustFooter } from './AuthTrustSignals';
export { 
  BookingTrustSignals, 
  QuickBookingTrustFooter, 
  BookingTrustBanner 
} from './BookingTrustSignals';

// Trust microcopy and messaging
export { 
  TrustMicrocopy, 
  TrustMicrocopyCollection, 
  SmartTrustMicrocopy,
  EmailInputTrust,
  PaymentTrust,
  CoachSelectionTrust,
  BookingGuarantee,
  PrivacyAssurance,
  CommunityWelcome,
  getFormTrustMicrocopy
} from './TrustMicrocopy';

// Trust signal types and utilities
export type { TrustSignalType, TrustSignalVariant } from './types';

// Trust signal configurations
export const TRUST_SIGNAL_CONFIGS = {
  // Security trust signals
  security: {
    ssl: 'SSL Secured',
    encryption: '256-bit Encryption',
    gdpr: 'GDPR Compliant',
    privacy: 'Privacy Protected'
  },
  
  // Verification trust signals
  verification: {
    ipec: 'iPEC Certified',
    background: 'Background Checked',
    verified: 'Identity Verified',
    elite: 'Elite Coach'
  },
  
  // Social proof metrics
  social: {
    userCount: '15,000+ Users',
    successRate: '94% Success Rate',
    avgRating: '4.9 Average Rating',
    activeSessions: '1,342 Active Today'
  },
  
  // Guarantee and support
  guarantee: {
    moneyBack: '30-Day Money-Back Guarantee',
    freeReschedule: 'Free Rescheduling',
    support: '24/7 Support',
    cancelAnytime: 'Cancel Anytime'
  }
} as const;

// Trust signal placement recommendations
export const TRUST_SIGNAL_PLACEMENT = {
  homepage: ['social', 'verification', 'security'],
  auth: ['security', 'social'],
  coachSelection: ['verification', 'social', 'guarantee'],
  booking: ['guarantee', 'security', 'social'],
  payment: ['security', 'guarantee'],
  profile: ['security', 'verification'],
  community: ['social', 'verification']
} as const;

// Pre-configured trust signal sets
export const TRUST_SIGNAL_SETS = {
  auth: {
    primary: ['ssl', 'encryption', 'gdpr'],
    secondary: ['userCount', 'successRate'],
    footer: ['privacy', 'moneyBack']
  },
  
  booking: {
    primary: ['ipec', 'background', 'verified'],
    secondary: ['successRate', 'avgRating'],
    footer: ['moneyBack', 'freeReschedule', 'support']
  },
  
  payment: {
    primary: ['ssl', 'encryption', 'privacy'],
    secondary: ['moneyBack', 'support'],
    footer: ['cancelAnytime', 'freeReschedule']
  },
  
  community: {
    primary: ['userCount', 'activeSessions'],
    secondary: ['verified', 'successRate'],
    footer: ['support', 'privacy']
  }
} as const;