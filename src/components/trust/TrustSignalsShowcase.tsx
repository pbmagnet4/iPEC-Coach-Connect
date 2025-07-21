/**
 * Trust Signals Showcase Component
 * 
 * Demonstrates the comprehensive trust signal system throughout
 * the iPEC Coach Connect platform with all variations and use cases.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Eye, 
  EyeOff, 
  Settings,
  CheckCircle,
  Users,
  Shield,
  Award,
  Star,
  TrendingUp,
  Heart,
  MessageCircle,
  Lock
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

// Trust Signal Components
import { TrustSignal } from './TrustSignal';
import { SecurityBadge, SecurityBadgeCollection, SecurityTrustBar } from './SecurityBadge';
import { VerificationBadge, CoachVerificationPanel } from './VerificationBadge';
import { 
  SocialProof, 
  LiveActivityFeed, 
  PlatformStats, 
  TestimonialCarousel, 
  SuccessStories,
  CommunityTrustIndicators 
} from './SocialProof';
import { AuthTrustSignals, QuickAuthTrustFooter } from './AuthTrustSignals';
import { BookingTrustSignals, QuickBookingTrustFooter, BookingTrustBanner } from './BookingTrustSignals';
import { 
  TrustMicrocopy, 
  TrustMicrocopyCollection,
  EmailInputTrust,
  PaymentTrust,
  CoachSelectionTrust,
  BookingGuarantee,
  PrivacyAssurance,
  CommunityWelcome 
} from './TrustMicrocopy';

import { cn } from '../../lib/utils';

interface TrustSignalsShowcaseProps {
  className?: string;
}

export function TrustSignalsShowcase({ className }: TrustSignalsShowcaseProps) {
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [showCode, setShowCode] = useState(false);
  const [animationPlaying, setAnimationPlaying] = useState(true);

  const sections = [
    { id: 'overview', title: 'Overview', icon: Eye },
    { id: 'security', title: 'Security Badges', icon: Shield },
    { id: 'verification', title: 'Verification', icon: CheckCircle },
    { id: 'social', title: 'Social Proof', icon: Users },
    { id: 'auth', title: 'Authentication', icon: Lock },
    { id: 'booking', title: 'Booking Flow', icon: Award },
    { id: 'microcopy', title: 'Microcopy', icon: MessageCircle },
    { id: 'mobile', title: 'Mobile View', icon: Settings }
  ];

  const renderOverviewSection = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Trust Signal System Overview
        </h2>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          A comprehensive trust-building system designed to reduce friction and build confidence 
          throughout the coaching platform experience.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <TrustSignal
          type="security"
          variant="card"
          title="Bank-Level Security"
          description="256-bit encryption protects all data"
          icon={Shield}
        />
        
        <TrustSignal
          type="verification"
          variant="card"
          title="Verified Coaches"
          description="All coaches are iPEC certified"
          icon={CheckCircle}
        />
        
        <TrustSignal
          type="social"
          variant="card"
          title="15,000+ Users"
          description="Trusted by professionals worldwide"
          icon={Users}
        />
        
        <TrustSignal
          type="guarantee"
          variant="card"
          title="30-Day Guarantee"
          description="Risk-free coaching experience"
          icon={Award}
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-gray-900">Live Social Proof</h3>
          <LiveActivityFeed />
          <CommunityTrustIndicators />
        </div>
        
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-gray-900">Platform Statistics</h3>
          <PlatformStats />
        </div>
      </div>
      
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-gray-900">User Testimonials</h3>
        <TestimonialCarousel />
      </div>
    </div>
  );

  const renderSecuritySection = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Security & Privacy Trust Signals
        </h2>
        <p className="text-gray-600">
          Building confidence through transparent security practices
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Individual Security Badges</h3>
          <div className="space-y-4">
            <SecurityBadge type="ssl" size="md" />
            <SecurityBadge type="encryption" size="md" />
            <SecurityBadge type="gdpr" size="md" />
            <SecurityBadge type="privacy" size="md" />
          </div>
        </div>
        
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Security Badge Collections</h3>
          <SecurityBadgeCollection
            badges={['ssl', 'encryption', 'gdpr', 'privacy']}
            layout="vertical"
            size="sm"
          />
        </div>
      </div>
      
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Security Trust Bars</h3>
        <SecurityTrustBar variant="default" />
        <SecurityTrustBar variant="compact" />
        <SecurityTrustBar variant="prominent" />
      </div>
    </div>
  );

  const renderVerificationSection = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Coach Verification & Credibility
        </h2>
        <p className="text-gray-600">
          Showcasing coach qualifications and trustworthiness
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Verification Badges</h3>
          <div className="space-y-4">
            <VerificationBadge type="ipec" level="gold" size="md" />
            <VerificationBadge type="certified" level="silver" size="md" />
            <VerificationBadge type="background" size="md" />
            <VerificationBadge type="elite" level="platinum" size="md" />
          </div>
        </div>
        
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Verification Panel</h3>
          <CoachVerificationPanel
            verifications={[
              { type: 'ipec', level: 'gold', verified: true, date: '2023-01-15' },
              { type: 'certified', level: 'silver', verified: true, date: '2023-02-20' },
              { type: 'background', verified: true, date: '2023-03-10' },
              { type: 'elite', level: 'platinum', verified: true, date: '2023-06-01' }
            ]}
            variant="detailed"
          />
        </div>
      </div>
    </div>
  );

  const renderSocialSection = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Social Proof & Community Trust
        </h2>
        <p className="text-gray-600">
          Leveraging community engagement to build trust
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Real-Time Activity</h3>
          <LiveActivityFeed />
          
          <h3 className="text-lg font-semibold text-gray-900">Community Trust</h3>
          <CommunityTrustIndicators />
        </div>
        
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Platform Statistics</h3>
          <PlatformStats />
          
          <h3 className="text-lg font-semibold text-gray-900">Success Stories</h3>
          <SuccessStories />
        </div>
      </div>
      
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Testimonials</h3>
        <TestimonialCarousel />
      </div>
    </div>
  );

  const renderAuthSection = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Authentication Trust Signals
        </h2>
        <p className="text-gray-600">
          Reducing friction in the signup and login experience
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Signup Trust Signals</h3>
          <div className="p-6 bg-gray-50 rounded-lg">
            <AuthTrustSignals context="signup" variant="sidebar" />
          </div>
        </div>
        
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Login Trust Signals</h3>
          <div className="p-6 bg-gray-50 rounded-lg">
            <AuthTrustSignals context="login" variant="sidebar" />
          </div>
        </div>
      </div>
      
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Trust Microcopy</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <EmailInputTrust />
          <PrivacyAssurance />
        </div>
      </div>
      
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Footer Trust Signals</h3>
        <div className="p-4 bg-gray-50 rounded-lg">
          <QuickAuthTrustFooter />
        </div>
      </div>
    </div>
  );

  const renderBookingSection = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Booking Flow Trust Signals
        </h2>
        <p className="text-gray-600">
          Building confidence throughout the booking process
        </p>
      </div>
      
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Booking Trust Banner</h3>
        <BookingTrustBanner />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Coach Selection</h3>
          <div className="p-6 bg-gray-50 rounded-lg">
            <BookingTrustSignals context="selection" variant="sidebar" />
          </div>
        </div>
        
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Payment Security</h3>
          <div className="p-6 bg-gray-50 rounded-lg">
            <BookingTrustSignals context="payment" variant="sidebar" />
          </div>
        </div>
      </div>
      
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Trust Microcopy</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CoachSelectionTrust />
          <PaymentTrust />
        </div>
      </div>
      
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Booking Guarantee</h3>
        <BookingGuarantee />
      </div>
    </div>
  );

  const renderMicrocopySection = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Trust Microcopy & Messaging
        </h2>
        <p className="text-gray-600">
          Contextual trust messaging throughout the platform
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Helper Variants</h3>
          <div className="space-y-4">
            <TrustMicrocopy context="email_input" variant="helper" />
            <TrustMicrocopy context="payment_form" variant="helper" />
            <TrustMicrocopy context="coach_selection" variant="helper" />
          </div>
        </div>
        
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Inline & Tooltip</h3>
          <div className="space-y-4">
            <TrustMicrocopy context="data_sharing" variant="inline" />
            <TrustMicrocopy context="subscription" variant="tooltip" />
            <TrustMicrocopy context="goal_setting" variant="inline" />
          </div>
        </div>
      </div>
      
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Banner Messages</h3>
        <div className="space-y-4">
          <TrustMicrocopy context="community_join" variant="banner" />
          <TrustMicrocopy context="booking_flow" variant="banner" />
        </div>
      </div>
      
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Contextual Collections</h3>
        <TrustMicrocopyCollection
          contexts={['email_input', 'password_input', 'data_sharing']}
          variant="helper"
          layout="grid"
        />
      </div>
    </div>
  );

  const renderMobileSection = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Mobile-Optimized Trust Signals
        </h2>
        <p className="text-gray-600">
          Responsive design ensuring trust signals work on all devices
        </p>
      </div>
      
      <div className="max-w-sm mx-auto bg-gray-900 rounded-3xl p-2">
        <div className="bg-white rounded-2xl p-4 space-y-4">
          <div className="text-center">
            <h3 className="font-semibold text-gray-900">Mobile View</h3>
          </div>
          
          <SecurityBadgeCollection
            badges={['ssl', 'encryption', 'gdpr']}
            layout="horizontal"
            size="sm"
            showText={false}
          />
          
          <div className="text-center">
            <QuickAuthTrustFooter />
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3">
            <LiveActivityFeed />
          </div>
          
          <div className="text-center">
            <QuickBookingTrustFooter />
          </div>
        </div>
      </div>
      
      <div className="text-center">
        <p className="text-sm text-gray-600">
          All trust signals are fully responsive and optimized for mobile devices
        </p>
      </div>
    </div>
  );

  const renderCurrentSection = () => {
    switch (activeSection) {
      case 'overview':
        return renderOverviewSection();
      case 'security':
        return renderSecuritySection();
      case 'verification':
        return renderVerificationSection();
      case 'social':
        return renderSocialSection();
      case 'auth':
        return renderAuthSection();
      case 'booking':
        return renderBookingSection();
      case 'microcopy':
        return renderMicrocopySection();
      case 'mobile':
        return renderMobileSection();
      default:
        return renderOverviewSection();
    }
  };

  return (
    <div className={cn('min-h-screen bg-gray-50', className)}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Trust Signals Showcase
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Comprehensive trust-building system for the iPEC Coach Connect platform
          </p>
          
          <div className="flex items-center justify-center gap-4 mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAnimationPlaying(!animationPlaying)}
              icon={animationPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            >
              {animationPlaying ? 'Pause' : 'Play'} Animations
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCode(!showCode)}
              icon={showCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            >
              {showCode ? 'Hide' : 'Show'} Code
            </Button>
          </div>
        </div>
        
        {/* Navigation */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {sections.map((section) => (
            <Button
              key={section.id}
              variant={activeSection === section.id ? 'gradient' : 'outline'}
              size="sm"
              onClick={() => setActiveSection(section.id)}
              icon={<section.icon className="h-4 w-4" />}
            >
              {section.title}
            </Button>
          ))}
        </div>
        
        {/* Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-8">
            {renderCurrentSection()}
          </div>
        </div>
      </div>
    </div>
  );
}