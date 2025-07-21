/**
 * Trust Components Types
 * 
 * Type definitions for the trust signal system
 */

export type TrustSignalType = 
  | 'security' 
  | 'verification' 
  | 'social' 
  | 'guarantee' 
  | 'success' 
  | 'community';

export type TrustSignalVariant = 
  | 'badge' 
  | 'card' 
  | 'inline' 
  | 'banner';

export type TrustSignalSize = 'sm' | 'md' | 'lg';

export type SecurityBadgeType = 
  | 'ssl' 
  | 'encryption' 
  | 'gdpr' 
  | 'privacy' 
  | 'secure' 
  | 'verified';

export type VerificationBadgeType = 
  | 'ipec' 
  | 'certified' 
  | 'verified' 
  | 'background' 
  | 'elite' 
  | 'featured' 
  | 'experienced' 
  | 'top_rated';

export type VerificationLevel = 
  | 'bronze' 
  | 'silver' 
  | 'gold' 
  | 'platinum';

export type SocialProofType = 
  | 'activity' 
  | 'stats' 
  | 'testimonial' 
  | 'success' 
  | 'community';

export type AuthContext = 
  | 'signup' 
  | 'login' 
  | 'reset' 
  | 'verification';

export type BookingContext = 
  | 'selection' 
  | 'booking' 
  | 'payment' 
  | 'confirmation';

export type TrustMicrocopyContext = 
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

export type TrustMicrocopyVariant = 
  | 'tooltip' 
  | 'helper' 
  | 'inline' 
  | 'banner';

export interface TrustSignalConfig {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

export interface SecurityBadgeConfig {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

export interface VerificationBadgeConfig {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

export interface SocialProofMetrics {
  totalUsers: number;
  activeToday: number;
  sessionsThisWeek: number;
  successRate: number;
  avgRating: number;
  coachCount: number;
}

export interface TestimonialData {
  name: string;
  role: string;
  content: string;
  rating: number;
  image?: string;
}

export interface ActivityData {
  name: string;
  action: string;
  coach?: string;
  type?: string;
  time: string;
}

export interface SuccessStoryData {
  category: string;
  count: number;
  icon: React.ComponentType<{ className?: string }>;
}

export interface TrustSignalPlacement {
  homepage: TrustSignalType[];
  auth: TrustSignalType[];
  coachSelection: TrustSignalType[];
  booking: TrustSignalType[];
  payment: TrustSignalType[];
  profile: TrustSignalType[];
  community: TrustSignalType[];
}

export interface TrustSignalSet {
  primary: string[];
  secondary: string[];
  footer: string[];
}

export interface TrustSignalSets {
  auth: TrustSignalSet;
  booking: TrustSignalSet;
  payment: TrustSignalSet;
  community: TrustSignalSet;
}