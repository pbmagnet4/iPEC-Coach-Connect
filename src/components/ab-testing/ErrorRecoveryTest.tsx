/**
 * Error Recovery A/B Test Components
 * Tests different error message and recovery flow approaches to reduce user frustration and improve conversion
 */

import React from 'react';
import { useExperiment } from '../../hooks/useExperiment';
import { AlertTriangle, ArrowRight, HelpCircle, Mail, MessageCircle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';

interface ErrorRecoveryTestProps {
  error: string;
  onRetry?: () => void;
  onContact?: () => void;
  className?: string;
}

/**
 * Registration Error Recovery Test
 * Tests different approaches to handle registration errors and guide users to successful completion
 */
export function RegistrationErrorRecoveryTest({ error, onRetry, className = '' }: ErrorRecoveryTestProps) {
  const { variant, trackConversion } = useExperiment('registration_error_recovery_test');

  const handleRetryClick = () => {
    trackConversion('error_retry_clicked');
    onRetry?.();
  };

  const handleContactSupport = () => {
    trackConversion('error_contact_clicked');
    // Open support chat or contact form
  };

  const handleAlternativeAction = (action: string) => {
    trackConversion('error_alternative_clicked', 1, { action });
  };

  if (!variant) {
    // Fallback - basic error message
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center">
          <AlertTriangle className="w-5 h-5 text-red-600 mr-3" />
          <div>
            <h3 className="text-red-800 font-medium">Registration Failed</h3>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        </div>
        {onRetry && (
          <Button 
            variant="secondary" 
            size="sm" 
            className="mt-3"
            onClick={handleRetryClick}
          >
            Try Again
          </Button>
        )}
      </div>
    );
  }

  switch (variant.name) {
    case 'helpful_guidance':
      return (
        <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
          <div className="flex">
            <HelpCircle className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-blue-800 font-medium">Let's fix this together</h3>
              <p className="text-blue-700 text-sm mt-1">
                {getHelpfulErrorMessage(error)}
              </p>
              
              <div className="mt-3 space-y-2">
                <Button 
                  variant="primary" 
                  size="sm"
                  onClick={handleRetryClick}
                  className="mr-2"
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Try Again
                </Button>
                
                <button
                  onClick={() => handleAlternativeAction('step_by_step_guide')}
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Show me step-by-step guidance →
                </button>
              </div>

              <div className="mt-3 text-xs text-blue-600">
                💡 Tip: Make sure your password has at least 8 characters with numbers and symbols
              </div>
            </div>
          </div>
        </div>
      );

    case 'empathetic_support':
      return (
        <div className={`bg-purple-50 border border-purple-200 rounded-lg p-4 ${className}`}>
          <div className="text-center">
            <div className="text-3xl mb-2">😊</div>
            <h3 className="text-purple-800 font-medium mb-2">Oops! Something went wrong</h3>
            <p className="text-purple-700 text-sm mb-3">
              Don't worry - this happens sometimes. We're here to help you get registered quickly.
            </p>
            
            <div className="space-y-2">
              <Button 
                variant="primary" 
                size="sm"
                onClick={handleRetryClick}
                className="w-full"
              >
                Let's Try Again
              </Button>
              
              <button
                onClick={handleContactSupport}
                className="w-full bg-purple-100 hover:bg-purple-200 text-purple-800 py-2 px-4 rounded text-sm"
              >
                <MessageCircle className="w-4 h-4 inline mr-1" />
                Chat with our friendly support team
              </button>
            </div>

            <p className="text-xs text-purple-600 mt-3">
              Average response time: Under 2 minutes
            </p>
          </div>
        </div>
      );

    case 'alternative_options':
      return (
        <div className={`bg-orange-50 border border-orange-200 rounded-lg p-4 ${className}`}>
          <div className="flex">
            <AlertTriangle className="w-5 h-5 text-orange-600 mr-3 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-orange-800 font-medium">Having trouble with registration?</h3>
              <p className="text-orange-700 text-sm mt-1">{error}</p>
              
              <div className="mt-4">
                <h4 className="text-sm font-medium text-orange-800 mb-2">Try these alternatives:</h4>
                <div className="space-y-2">
                  <button
                    onClick={() => handleAlternativeAction('google_signup')}
                    className="flex items-center w-full bg-white border border-orange-200 rounded px-3 py-2 text-sm text-orange-800 hover:bg-orange-50"
                  >
                    <div className="w-5 h-5 mr-2 bg-red-500 rounded"></div>
                    Sign up with Google instead
                    <ArrowRight className="w-4 h-4 ml-auto" />
                  </button>
                  
                  <button
                    onClick={() => handleAlternativeAction('phone_signup')}
                    className="flex items-center w-full bg-white border border-orange-200 rounded px-3 py-2 text-sm text-orange-800 hover:bg-orange-50"
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Get help via phone call
                    <ArrowRight className="w-4 h-4 ml-auto" />
                  </button>
                  
                  <button
                    onClick={handleRetryClick}
                    className="flex items-center w-full bg-orange-100 border border-orange-200 rounded px-3 py-2 text-sm text-orange-800 hover:bg-orange-200"
                  >
                    <RefreshCw className="w-5 h-5 mr-2" />
                    Try the original form again
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );

    case 'incentive_recovery':
      return (
        <div className={`bg-green-50 border border-green-200 rounded-lg p-4 ${className}`}>
          <div className="text-center">
            <h3 className="text-green-800 font-medium mb-2">We'd hate to lose you!</h3>
            <p className="text-green-700 text-sm mb-3">
              Complete your registration in the next 5 minutes and get:
            </p>
            
            <div className="bg-white border border-green-200 rounded-lg p-3 mb-4">
              <div className="text-lg font-bold text-green-600">🎁 Special Welcome Bonus</div>
              <ul className="text-sm text-green-700 mt-2 space-y-1">
                <li>✓ Free 15-minute consultation</li>
                <li>✓ Personal coach matching</li>
                <li>✓ Access to exclusive resources</li>
              </ul>
            </div>

            <Button 
              variant="primary" 
              size="sm"
              onClick={handleRetryClick}
              className="w-full mb-2"
            >
              Claim My Bonus & Complete Registration
            </Button>
            
            <p className="text-xs text-green-600">
              Offer expires in 5 minutes • One-time bonus
            </p>
          </div>
        </div>
      );

    case 'progressive_disclosure':
      return (
        <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
          <div className="space-y-4">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-amber-600 mr-3" />
              <div>
                <h3 className="text-gray-800 font-medium">Registration Incomplete</h3>
                <p className="text-gray-600 text-sm">{error}</p>
              </div>
            </div>

            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <h4 className="text-sm font-medium text-gray-800 mb-2">Quick Solutions:</h4>
              <div className="space-y-1 text-sm">
                <details className="cursor-pointer">
                  <summary className="text-blue-600 hover:text-blue-800">Password requirements</summary>
                  <div className="mt-1 ml-4 text-gray-600">
                    • At least 8 characters<br />
                    • Include numbers and symbols<br />
                    • Mix of upper and lowercase
                  </div>
                </details>
                
                <details className="cursor-pointer">
                  <summary className="text-blue-600 hover:text-blue-800">Email format issues</summary>
                  <div className="mt-1 ml-4 text-gray-600">
                    Make sure your email includes @ and a domain (like .com)
                  </div>
                </details>
                
                <details className="cursor-pointer">
                  <summary className="text-blue-600 hover:text-blue-800">Still having trouble?</summary>
                  <div className="mt-1 ml-4 text-gray-600">
                    <button 
                      onClick={handleContactSupport}
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      Contact our support team
                    </button>
                  </div>
                </details>
              </div>
            </div>

            <Button 
              variant="primary" 
              size="sm"
              onClick={handleRetryClick}
            >
              Try Again with These Tips
            </Button>
          </div>
        </div>
      );

    default:
      return (
        <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-3" />
            <div>
              <h3 className="text-red-800 font-medium">Registration Failed</h3>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
          {onRetry && (
            <Button 
              variant="secondary" 
              size="sm" 
              className="mt-3"
              onClick={handleRetryClick}
            >
              Try Again
            </Button>
          )}
        </div>
      );
  }
}

/**
 * Booking Error Recovery Test
 * Tests different approaches to handle booking errors and guide users to successful session booking
 */
export function BookingErrorRecoveryTest({ error, onRetry, onContact, className = '' }: ErrorRecoveryTestProps) {
  const { variant, trackConversion } = useExperiment('booking_error_recovery_test');

  const handleRetryClick = () => {
    trackConversion('booking_retry_clicked');
    onRetry?.();
  };

  const handleContactClick = () => {
    trackConversion('booking_contact_clicked');
    onContact?.();
  };

  if (!variant) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center">
          <AlertTriangle className="w-5 h-5 text-red-600 mr-3" />
          <div>
            <h3 className="text-red-800 font-medium">Booking Failed</h3>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        </div>
        <div className="mt-3 space-x-2">
          <Button variant="secondary" size="sm" onClick={handleRetryClick}>
            Try Again
          </Button>
          <Button variant="ghost" size="sm" onClick={handleContactClick}>
            Contact Support
          </Button>
        </div>
      </div>
    );
  }

  switch (variant.name) {
    case 'reassurance_focused':
      return (
        <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
          <div className="text-center">
            <h3 className="text-blue-800 font-medium mb-2">Your session is still available!</h3>
            <p className="text-blue-700 text-sm mb-3">
              Don't worry - we've reserved your time slot. Let's get this booking completed.
            </p>
            
            <div className="bg-white border border-blue-200 rounded p-2 mb-4">
              <div className="text-sm text-blue-800">
                <strong>Reserved:</strong> 60-minute session with Sarah Johnson<br />
                <strong>Time:</strong> Tomorrow at 2:00 PM EST
              </div>
            </div>

            <Button variant="primary" size="sm" onClick={handleRetryClick} className="mb-2">
              Complete My Booking
            </Button>
            
            <p className="text-xs text-blue-600">
              Slot reserved for 10 minutes • No payment until confirmed
            </p>
          </div>
        </div>
      );

    case 'alternative_slots':
      return (
        <div className={`bg-purple-50 border border-purple-200 rounded-lg p-4 ${className}`}>
          <h3 className="text-purple-800 font-medium mb-2">This time slot just got booked</h3>
          <p className="text-purple-700 text-sm mb-3">
            But don't worry! Sarah has other times available this week:
          </p>
          
          <div className="space-y-2 mb-4">
            {[
              { day: 'Tomorrow', time: '10:00 AM', available: true },
              { day: 'Wednesday', time: '2:00 PM', available: true },
              { day: 'Thursday', time: '4:00 PM', available: false }
            ].map((slot, index) => (
              <button
                key={index}
                disabled={!slot.available}
                onClick={() => trackConversion('alternative_slot_clicked', 1, { slot: `${slot.day} ${slot.time}` })}
                className={`w-full p-2 rounded border text-left text-sm ${
                  slot.available 
                    ? 'bg-white border-purple-200 text-purple-800 hover:bg-purple-50' 
                    : 'bg-gray-100 border-gray-200 text-gray-500'
                }`}
              >
                {slot.day} at {slot.time} {!slot.available && '(Booked)'}
              </button>
            ))}
          </div>

          <Button variant="secondary" size="sm" onClick={handleRetryClick}>
            Try Original Time Again
          </Button>
        </div>
      );

    default:
      return (
        <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-3" />
            <div>
              <h3 className="text-red-800 font-medium">Booking Failed</h3>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
          <div className="mt-3 space-x-2">
            <Button variant="secondary" size="sm" onClick={handleRetryClick}>
              Try Again
            </Button>
            <Button variant="ghost" size="sm" onClick={handleContactClick}>
              Contact Support
            </Button>
          </div>
        </div>
      );
  }
}

// Helper function to provide contextual error guidance
function getHelpfulErrorMessage(error: string): string {
  if (error.toLowerCase().includes('password')) {
    return 'It looks like there might be an issue with your password. Make sure it meets our security requirements.';
  }
  if (error.toLowerCase().includes('email')) {
    return 'Please check that your email address is entered correctly and try again.';
  }
  if (error.toLowerCase().includes('network')) {
    return 'This might be a temporary connection issue. Please check your internet and try again.';
  }
  return 'This is usually a quick fix. Let\'s try again and get you registered.';
}