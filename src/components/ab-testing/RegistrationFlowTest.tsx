/**
 * Registration Flow A/B Test
 * Tests different registration approaches to optimize conversion rates
 */

import React from 'react';
import { useExperiment } from '../../hooks/useExperiment';
import { MultiStepRegistration } from '../auth/MultiStepRegistration';
import { EnhancedAuthForm } from '../auth/EnhancedAuthForm';
import { AuthTrustSignals } from '../trust/AuthTrustSignals';

export function RegistrationFlowTest() {
  const { variant, isActive, trackConversion } = useExperiment('registration_flow_optimization', {
    fallbackVariant: {
      id: 'control',
      name: 'single_step',
      description: 'Traditional single-step registration',
      type: 'control',
      traffic_weight: 50,
      config: {},
      is_control: true
    }
  });

  const handleRegistrationStart = () => {
    trackConversion('registration_started');
  };

  const handleRegistrationStep = (step: number) => {
    trackConversion('registration_step_completed', step);
  };

  const handleRegistrationSuccess = () => {
    trackConversion('registration_completed', 1);
    trackConversion('user_signup', 1); // Primary conversion metric
  };

  const handleRegistrationError = (error: string) => {
    trackConversion('registration_error', 1, { error_type: error });
  };

  if (!isActive || !variant) {
    // Fallback to control variant
    return (
      <div className="space-y-6">
        <AuthTrustSignals variant="compact" />
        <EnhancedAuthForm
          mode="register"
          onSuccess={handleRegistrationSuccess}
          onError={handleRegistrationError}
        />
      </div>
    );
  }

  switch (variant.name) {
    case 'multi_step':
      return (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Join iPEC Coach Connect
            </h2>
            <p className="text-gray-600">
              Get started with your coaching journey in just 3 easy steps
            </p>
          </div>
          
          <AuthTrustSignals variant="full" />
          
          <MultiStepRegistration
            onStepStart={handleRegistrationStart}
            onStepComplete={handleRegistrationStep}
            onSuccess={handleRegistrationSuccess}
            onError={handleRegistrationError}
          />
        </div>
      );

    case 'trust_focused':
      return (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Join 10,000+ Successful Coaching Connections
            </h2>
            <p className="text-gray-600">
              Trusted by clients and certified iPEC coaches worldwide
            </p>
          </div>
          
          {/* Enhanced trust signals */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-center space-x-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">10,000+</div>
                <div className="text-sm text-green-700">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">95%</div>
                <div className="text-sm text-green-700">Success Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">24/7</div>
                <div className="text-sm text-green-700">Support</div>
              </div>
            </div>
          </div>

          <AuthTrustSignals variant="comprehensive" />
          
          <EnhancedAuthForm
            mode="register"
            onSuccess={handleRegistrationSuccess}
            onError={handleRegistrationError}
            trustSignalsEnabled={true}
          />
        </div>
      );

    case 'social_proof':
      return (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Start Your Coaching Journey Today
            </h2>
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
              <div className="flex -space-x-1">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="w-6 h-6 bg-blue-500 rounded-full border-2 border-white"></div>
                ))}
              </div>
              <span>Sarah and 127 others signed up today</span>
            </div>
          </div>

          {/* Testimonial */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <blockquote className="text-center">
              <p className="text-blue-900 italic">
                "iPEC Coach Connect transformed my life. The perfect coach match made all the difference."
              </p>
              <footer className="mt-2 text-sm text-blue-700">
                - Jennifer M., Life Coach Client
              </footer>
            </blockquote>
          </div>
          
          <EnhancedAuthForm
            mode="register"
            onSuccess={handleRegistrationSuccess}
            onError={handleRegistrationError}
          />

          {/* Urgency element */}
          <div className="text-center text-sm text-orange-600 bg-orange-50 p-2 rounded">
            🔥 Limited spots available - Join now to secure your coaching match
          </div>
        </div>
      );

    case 'simplified':
      return (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Get Started
            </h2>
            <p className="text-lg text-gray-600">
              Find your perfect coach in under 2 minutes
            </p>
          </div>
          
          {/* Minimal trust signals */}
          <div className="text-center text-sm text-gray-500">
            ✓ Certified iPEC Coaches ✓ Secure & Private ✓ No Hidden Fees
          </div>
          
          <EnhancedAuthForm
            mode="register"
            onSuccess={handleRegistrationSuccess}
            onError={handleRegistrationError}
            simplified={true}
          />
        </div>
      );

    default:
      // Control variant - single step registration
      return (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Create Your Account
            </h2>
            <p className="text-gray-600">
              Join iPEC Coach Connect and find your ideal coach
            </p>
          </div>
          
          <AuthTrustSignals variant="compact" />
          
          <EnhancedAuthForm
            mode="register"
            onSuccess={handleRegistrationSuccess}
            onError={handleRegistrationError}
          />
        </div>
      );
  }
}

/**
 * Registration CTA Button A/B Test
 * Tests different button text and styles to optimize click-through rates
 */
export function RegistrationCTATest({ className = '' }: { className?: string }) {
  const { variant, trackConversion } = useExperiment('registration_cta_optimization');

  const handleClick = () => {
    trackConversion('cta_clicked');
    // Navigate to registration
    window.location.href = '/register';
  };

  if (!variant) {
    // Fallback
    return (
      <button 
        onClick={handleClick}
        className={`bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold ${className}`}
      >
        Get Started
      </button>
    );
  }

  switch (variant.name) {
    case 'urgency':
      return (
        <button 
          onClick={handleClick}
          className={`bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold ${className}`}
        >
          Start Today - Limited Spots!
        </button>
      );

    case 'benefit_focused':
      return (
        <button 
          onClick={handleClick}
          className={`bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold ${className}`}
        >
          Find My Perfect Coach
        </button>
      );

    case 'social_proof':
      return (
        <button 
          onClick={handleClick}
          className={`bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold relative ${className}`}
        >
          Join 10,000+ Success Stories
          <span className="absolute -top-1 -right-1 bg-orange-400 text-white text-xs px-2 py-1 rounded-full">
            Hot
          </span>
        </button>
      );

    case 'free_emphasis':
      return (
        <button 
          onClick={handleClick}
          className={`bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold ${className}`}
        >
          Start Free Trial
          <span className="block text-xs opacity-90">No credit card required</span>
        </button>
      );

    case 'action_oriented':
      return (
        <button 
          onClick={handleClick}
          className={`bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-lg font-bold text-lg ${className}`}
        >
          Transform Your Life Now →
        </button>
      );

    default:
      return (
        <button 
          onClick={handleClick}
          className={`bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold ${className}`}
        >
          Get Started
        </button>
      );
  }
}

/**
 * Registration Value Proposition Test
 * Tests different value propositions to optimize conversion rates
 */
export function RegistrationValuePropTest() {
  const { variant, trackConversion } = useExperiment('registration_value_prop_test');

  const handleLearnMore = () => {
    trackConversion('learn_more_clicked');
  };

  if (!variant) {
    return (
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Connect with Certified iPEC Coaches
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
          Professional coaching to help you achieve your personal and professional goals
        </p>
        <RegistrationCTATest />
      </div>
    );
  }

  switch (variant.name) {
    case 'transformation_focused':
      return (
        <div className="text-center py-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Transform Your Life in 90 Days
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-6">
            Join thousands who've achieved breakthrough results with our certified iPEC coaches
          </p>
          <div className="flex justify-center items-center space-x-8 mb-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">90%</div>
              <div className="text-sm text-gray-600">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">30 Days</div>
              <div className="text-sm text-gray-600">Average to Results</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">500+</div>
              <div className="text-sm text-gray-600">Certified Coaches</div>
            </div>
          </div>
          <RegistrationCTATest />
        </div>
      );

    case 'problem_solution':
      return (
        <div className="text-center py-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Stuck in Life? We Have the Solution.
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-6">
            Break through barriers and achieve the life you've always wanted with expert iPEC coaching
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto mb-8">
            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="font-semibold text-red-800 mb-2">Feeling Stuck?</h3>
              <p className="text-sm text-red-700">Career plateau, relationship issues, lack of direction</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-semibold text-yellow-800 mb-2">Need Clarity?</h3>
              <p className="text-sm text-yellow-700">Uncertain about next steps, overwhelmed by options</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">Want Growth?</h3>
              <p className="text-sm text-green-700">Ready to breakthrough and achieve your potential</p>
            </div>
          </div>
          <RegistrationCTATest />
        </div>
      );

    case 'social_validation':
      return (
        <div className="text-center py-12">
          <div className="inline-flex items-center bg-blue-100 px-4 py-2 rounded-full mb-6">
            <span className="text-blue-800 font-semibold">#1 Coaching Platform</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Join 10,000+ People Who Found Their Perfect Coach
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-6">
            Trusted by professionals, executives, and individuals seeking personal transformation
          </p>
          
          {/* Testimonial carousel or static testimonial */}
          <div className="bg-gray-50 p-6 rounded-lg max-w-2xl mx-auto mb-8">
            <blockquote className="text-lg italic text-gray-900 mb-4">
              "My iPEC coach helped me double my income and find work-life balance I never thought possible."
            </blockquote>
            <div className="flex items-center justify-center">
              <div className="w-10 h-10 bg-blue-500 rounded-full mr-3"></div>
              <div className="text-left">
                <div className="font-semibold">Michael Rodriguez</div>
                <div className="text-sm text-gray-600">Executive Director</div>
              </div>
            </div>
          </div>
          
          <RegistrationCTATest />
        </div>
      );

    case 'guarantee_focused':
      return (
        <div className="text-center py-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Get Results or Your Money Back
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-6">
            We're so confident in our iPEC coaches, we guarantee your satisfaction
          </p>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 max-w-md mx-auto mb-8">
            <div className="text-green-800 font-semibold mb-2">✓ 30-Day Money Back Guarantee</div>
            <div className="text-green-700 text-sm mb-2">✓ Certified iPEC Professionals Only</div>
            <div className="text-green-700 text-sm mb-2">✓ Personalized Coach Matching</div>
            <div className="text-green-700 text-sm">✓ 24/7 Customer Support</div>
          </div>
          
          <RegistrationCTATest />
        </div>
      );

    default:
      return (
        <div className="text-center py-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Connect with Certified iPEC Coaches
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Professional coaching to help you achieve your personal and professional goals
          </p>
          <RegistrationCTATest />
        </div>
      );
  }
}