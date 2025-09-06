/**
 * Trust Signals A/B Test Components
 * Tests different trust signal variations to optimize user confidence and conversion rates
 */

import React from 'react';
import { useExperiment } from '../../hooks/useExperiment';
import { Shield, Award, Users, Clock, CheckCircle, Star, Lock, Zap } from 'lucide-react';

/**
 * Hero Trust Signals A/B Test
 * Tests different trust signal presentations on the homepage hero section
 */
export function HeroTrustSignalsTest() {
  const { variant, trackConversion } = useExperiment('hero_trust_signals_test');

  const handleTrustSignalClick = (signalType: string) => {
    trackConversion('trust_signal_clicked', 1, { signal_type: signalType });
  };

  if (!variant) {
    // Fallback - minimal trust signals
    return (
      <div className="flex items-center justify-center space-x-8 py-4">
        <div className="flex items-center text-sm text-gray-600">
          <Shield className="w-4 h-4 mr-2" />
          Secure & Private
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <Award className="w-4 h-4 mr-2" />
          Certified Coaches
        </div>
      </div>
    );
  }

  switch (variant.name) {
    case 'stats_heavy':
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 my-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center cursor-pointer" onClick={() => handleTrustSignalClick('active_users')}>
              <div className="text-2xl font-bold text-blue-600">10,000+</div>
              <div className="text-sm text-blue-800">Active Users</div>
            </div>
            <div className="text-center cursor-pointer" onClick={() => handleTrustSignalClick('success_rate')}>
              <div className="text-2xl font-bold text-green-600">95%</div>
              <div className="text-sm text-green-800">Success Rate</div>
            </div>
            <div className="text-center cursor-pointer" onClick={() => handleTrustSignalClick('certified_coaches')}>
              <div className="text-2xl font-bold text-purple-600">500+</div>
              <div className="text-sm text-purple-800">Certified Coaches</div>
            </div>
            <div className="text-center cursor-pointer" onClick={() => handleTrustSignalClick('satisfaction')}>
              <div className="text-2xl font-bold text-orange-600">4.9/5</div>
              <div className="text-sm text-orange-800">Client Satisfaction</div>
            </div>
          </div>
        </div>
      );

    case 'badge_focused':
      return (
        <div className="flex items-center justify-center space-x-6 py-6">
          <div 
            className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleTrustSignalClick('ipec_certified')}
          >
            <div className="flex items-center">
              <Award className="w-6 h-6 text-blue-600 mr-2" />
              <div>
                <div className="font-semibold text-gray-900">iPEC Certified</div>
                <div className="text-xs text-gray-600">Official Certification</div>
              </div>
            </div>
          </div>
          
          <div 
            className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleTrustSignalClick('secure_platform')}
          >
            <div className="flex items-center">
              <Lock className="w-6 h-6 text-green-600 mr-2" />
              <div>
                <div className="font-semibold text-gray-900">Bank-Level Security</div>
                <div className="text-xs text-gray-600">SSL Encrypted</div>
              </div>
            </div>
          </div>
          
          <div 
            className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleTrustSignalClick('money_back')}
          >
            <div className="flex items-center">
              <Shield className="w-6 h-6 text-purple-600 mr-2" />
              <div>
                <div className="font-semibold text-gray-900">Money-Back Guarantee</div>
                <div className="text-xs text-gray-600">30-Day Promise</div>
              </div>
            </div>
          </div>
        </div>
      );

    case 'testimonial_focused':
      return (
        <div className="bg-gray-50 rounded-lg p-6 my-8">
          <div className="text-center mb-4">
            <div className="flex items-center justify-center space-x-1 mb-2">
              {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <blockquote className="text-lg italic text-gray-900">
              "iPEC Coach Connect transformed my career. The perfect match with my coach made all the difference."
            </blockquote>
            <cite className="text-sm text-gray-600 mt-2 block">
              - Jennifer Martinez, Marketing Executive
            </cite>
          </div>
          
          <div 
            className="text-center text-sm text-blue-600 cursor-pointer hover:text-blue-800"
            onClick={() => handleTrustSignalClick('read_more_testimonials')}
          >
            Read more success stories →
          </div>
        </div>
      );

    case 'security_focused':
      return (
        <div className="border border-gray-200 rounded-lg p-4 my-6">
          <div className="flex items-center justify-center space-x-8">
            <div 
              className="flex items-center text-sm text-gray-700 cursor-pointer"
              onClick={() => handleTrustSignalClick('hipaa_compliant')}
            >
              <Lock className="w-4 h-4 mr-2 text-green-600" />
              HIPAA Compliant
            </div>
            <div 
              className="flex items-center text-sm text-gray-700 cursor-pointer"
              onClick={() => handleTrustSignalClick('ssl_secure')}
            >
              <Shield className="w-4 h-4 mr-2 text-blue-600" />
              SSL Secured
            </div>
            <div 
              className="flex items-center text-sm text-gray-700 cursor-pointer"
              onClick={() => handleTrustSignalClick('data_protected')}
            >
              <CheckCircle className="w-4 h-4 mr-2 text-purple-600" />
              Data Protected
            </div>
            <div 
              className="flex items-center text-sm text-gray-700 cursor-pointer"
              onClick={() => handleTrustSignalClick('gdpr_compliant')}
            >
              <Award className="w-4 h-4 mr-2 text-orange-600" />
              GDPR Compliant
            </div>
          </div>
        </div>
      );

    case 'urgency_social':
      return (
        <div className="space-y-4 my-6">
          {/* Live activity indicator */}
          <div 
            className="bg-green-50 border border-green-200 rounded-lg p-3 cursor-pointer"
            onClick={() => handleTrustSignalClick('live_activity')}
          >
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              <span className="text-sm text-green-800">
                <strong>Sarah M.</strong> just booked a session with a Life Coach
              </span>
            </div>
          </div>
          
          {/* Recent signups */}
          <div 
            className="flex items-center justify-center space-x-2 text-sm text-gray-600 cursor-pointer"
            onClick={() => handleTrustSignalClick('recent_signups')}
          >
            <div className="flex -space-x-1">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-6 h-6 bg-blue-500 rounded-full border-2 border-white"></div>
              ))}
            </div>
            <span>127 people signed up this week</span>
          </div>
        </div>
      );

    case 'media_mentions':
      return (
        <div className="py-6">
          <div className="text-center text-sm text-gray-600 mb-4">As featured in:</div>
          <div className="flex items-center justify-center space-x-8 opacity-60">
            <div 
              className="font-serif font-bold cursor-pointer hover:opacity-80"
              onClick={() => handleTrustSignalClick('forbes_mention')}
            >
              FORBES
            </div>
            <div 
              className="font-serif font-bold cursor-pointer hover:opacity-80"
              onClick={() => handleTrustSignalClick('entrepreneur_mention')}
            >
              Entrepreneur
            </div>
            <div 
              className="font-serif font-bold cursor-pointer hover:opacity-80"
              onClick={() => handleTrustSignalClick('inc_mention')}
            >
              Inc.
            </div>
            <div 
              className="font-serif font-bold cursor-pointer hover:opacity-80"
              onClick={() => handleTrustSignalClick('fastcompany_mention')}
            >
              Fast Company
            </div>
          </div>
        </div>
      );

    default:
      return (
        <div className="flex items-center justify-center space-x-8 py-4">
          <div className="flex items-center text-sm text-gray-600">
            <Shield className="w-4 h-4 mr-2" />
            Secure & Private
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Award className="w-4 h-4 mr-2" />
            Certified Coaches
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Users className="w-4 h-4 mr-2" />
            10,000+ Users
          </div>
        </div>
      );
  }
}

/**
 * Coach Profile Trust Signals Test
 * Tests different trust signal presentations on coach profile pages
 */
export function CoachProfileTrustSignalsTest({ coachData }: { coachData: any }) {
  const { variant, trackConversion } = useExperiment('coach_profile_trust_test');

  const handleVerificationClick = () => {
    trackConversion('verification_clicked');
  };

  const handleReviewsClick = () => {
    trackConversion('reviews_clicked');
  };

  if (!variant) {
    return (
      <div className="space-y-3">
        <div className="flex items-center text-sm text-green-600">
          <CheckCircle className="w-4 h-4 mr-2" />
          iPEC Certified Coach
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <Star className="w-4 h-4 mr-2 fill-yellow-400 text-yellow-400" />
          4.9 (127 reviews)
        </div>
      </div>
    );
  }

  switch (variant.name) {
    case 'detailed_credentials':
      return (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-800 mb-2">✓ Verified Credentials</h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• iPEC Certified Professional Coach</li>
              <li>• 500+ Hours Training Completed</li>
              <li>• Background Check Verified</li>
              <li>• Active ICF Membership</li>
            </ul>
            <button 
              onClick={handleVerificationClick}
              className="text-xs text-green-600 hover:text-green-800 mt-2"
            >
              View certification →
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              ))}
              <span className="ml-2 text-sm font-medium">4.9</span>
            </div>
            <button 
              onClick={handleReviewsClick}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              127 reviews →
            </button>
          </div>
        </div>
      );

    case 'social_proof_heavy':
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex -space-x-1 mr-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-6 h-6 bg-blue-400 rounded-full border-2 border-white"></div>
                ))}
              </div>
              <span className="text-sm text-gray-600">89 clients this year</span>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-green-600">95%</div>
              <div className="text-xs text-gray-600">Success Rate</div>
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-sm text-blue-800 font-medium mb-1">
              Recently Helped Clients With:
            </div>
            <div className="flex flex-wrap gap-1">
              {['Career Change', 'Leadership', 'Work-Life Balance', 'Confidence'].map(tag => (
                <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center text-sm">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
            <span className="font-medium">4.9</span>
            <span className="text-gray-600 ml-1">(127 reviews)</span>
            <button 
              onClick={handleReviewsClick}
              className="ml-2 text-blue-600 hover:text-blue-800"
            >
              Read reviews →
            </button>
          </div>
        </div>
      );

    case 'guarantee_focused':
      return (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <Shield className="w-5 h-5 text-green-600 mr-2" />
              <span className="font-semibold text-green-800">Satisfaction Guaranteed</span>
            </div>
            <p className="text-sm text-green-700 mb-2">
              Not happy with your first session? Get a full refund, no questions asked.
            </p>
            <div className="text-xs text-green-600">
              ✓ 30-day money-back guarantee
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm">
              <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
              iPEC Certified
            </div>
            <div className="flex items-center text-sm">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
              4.9 (127 reviews)
            </div>
          </div>
        </div>
      );

    case 'urgency_availability':
      return (
        <div className="space-y-4">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Clock className="w-4 h-4 text-orange-600 mr-2" />
                <span className="text-sm text-orange-800 font-medium">High Demand Coach</span>
              </div>
              <div className="text-xs text-orange-600">3 spots left this week</div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm">
              <Zap className="w-4 h-4 text-yellow-500 mr-2" />
              <span>Usually responds within 2 hours</span>
            </div>
            <div className="text-sm text-green-600 font-medium">Available Now</div>
          </div>

          <div className="flex items-center text-sm">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
            <span className="font-medium">4.9</span>
            <span className="text-gray-600 ml-1">(127 reviews)</span>
          </div>
        </div>
      );

    default:
      return (
        <div className="space-y-3">
          <div className="flex items-center text-sm text-green-600">
            <CheckCircle className="w-4 h-4 mr-2" />
            iPEC Certified Coach
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Star className="w-4 h-4 mr-2 fill-yellow-400 text-yellow-400" />
            4.9 (127 reviews)
          </div>
        </div>
      );
  }
}

/**
 * Booking Trust Signals Test
 * Tests different trust signal presentations during the booking process
 */
export function BookingTrustSignalsTest() {
  const { variant, trackConversion } = useExperiment('booking_trust_signals_test');

  const handleSecurityClick = () => {
    trackConversion('security_info_clicked');
  };

  if (!variant) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center text-sm text-gray-600">
          <Lock className="w-4 h-4 mr-2" />
          Your information is secure and encrypted
        </div>
      </div>
    );
  }

  switch (variant.name) {
    case 'payment_security':
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2">🔒 Secure Booking Process</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center text-blue-700">
              <CheckCircle className="w-4 h-4 mr-2" />
              SSL Encrypted
            </div>
            <div className="flex items-center text-blue-700">
              <CheckCircle className="w-4 h-4 mr-2" />
              PCI Compliant
            </div>
            <div className="flex items-center text-blue-700">
              <CheckCircle className="w-4 h-4 mr-2" />
              No Hidden Fees
            </div>
            <div className="flex items-center text-blue-700">
              <CheckCircle className="w-4 h-4 mr-2" />
              Cancel Anytime
            </div>
          </div>
        </div>
      );

    case 'money_back':
      return (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-center">
            <Shield className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <h4 className="font-semibold text-green-800 mb-1">Risk-Free Booking</h4>
            <p className="text-sm text-green-700 mb-2">
              Not satisfied with your session? Get your money back.
            </p>
            <div className="text-xs text-green-600">
              30-day satisfaction guarantee • No questions asked
            </div>
          </div>
        </div>
      );

    case 'testimonial_inline':
      return (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <blockquote className="text-sm italic text-purple-900 mb-2">
            "The booking process was so simple and secure. I felt confident from start to finish."
          </blockquote>
          <cite className="text-xs text-purple-700">- Maria S., Recent Client</cite>
          <div className="flex items-center mt-2">
            {[1, 2, 3, 4, 5].map(i => (
              <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            ))}
            <span className="ml-2 text-xs text-purple-700">Rated 4.9/5 for booking experience</span>
          </div>
        </div>
      );

    default:
      return (
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center text-sm text-gray-600">
            <Lock className="w-4 h-4 mr-2" />
            Your information is secure and encrypted
          </div>
        </div>
      );
  }
}