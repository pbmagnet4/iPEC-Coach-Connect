/**
 * PaymentForm Component
 * 
 * A comprehensive payment form using Stripe Payment Element for secure payment processing.
 * Supports both one-time payments and subscription setup with:
 * - Modern Stripe Payment Element integration
 * - Comprehensive error handling and validation
 * - Loading states and user feedback
 * - Accessibility features
 * - Mobile-optimized design
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe
} from '@stripe/react-stripe-js';
import { getStripeElementsOptions, stripePromise } from '../../services/stripe.service';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ErrorMessage } from '../ui/ErrorMessage';
import type { PaymentIntent, PaymentProcessingResult } from '../../types/database';

interface PaymentFormProps {
  clientSecret: string;
  amount: number;
  currency?: string;
  description?: string;
  onSuccess: (result: PaymentProcessingResult) => void;
  onError: (error: string) => void;
  onCancel?: () => void;
  className?: string;
  submitButtonText?: string;
  showCancelButton?: boolean;
  disabled?: boolean;
  metadata?: Record<string, string>;
}

const PaymentFormContent: React.FC<Omit<PaymentFormProps, 'clientSecret'>> = ({
  amount,
  currency = 'usd',
  description,
  onSuccess,
  onError,
  onCancel,
  className = '',
  submitButtonText = 'Pay Now',
  showCancelButton = false,
  disabled = false,
  metadata = {}
}) => {
  const stripe = useStripe();
  const elements = useElements();
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isElementsReady, setIsElementsReady] = useState(false);

  // Check if Stripe and Elements are ready
  useEffect(() => {
    if (stripe && elements) {
      setIsElementsReady(true);
    }
  }, [stripe, elements]);

  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setErrorMessage('Payment system not ready. Please try again.');
      return;
    }

    if (disabled) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      // Trigger form validation and wallet collection
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setErrorMessage(submitError.message || 'Payment submission failed');
        setIsLoading(false);
        return;
      }

      // Confirm the payment
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
        confirmParams: {
          return_url: `${window.location.origin}/payment/success`,
          payment_method_data: {
            metadata
          }
        }
      });

      if (error) {
        setErrorMessage(error.message || 'Payment failed');
        onError(error.message || 'Payment failed');
      } else if (paymentIntent) {
        // Payment succeeded
        const result: PaymentProcessingResult = {
          success: true,
          payment_intent: {
            stripe_payment_intent_id: paymentIntent.id,
            status: paymentIntent.status,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency
          } as PaymentIntent,
          requires_action: paymentIntent.status === 'requires_action'
        };
        
        onSuccess(result);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An unexpected error occurred';
      setErrorMessage(errorMsg);
      onError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [stripe, elements, disabled, metadata, onSuccess, onError]);

  const handleCancel = useCallback(() => {
    if (onCancel && !isLoading) {
      onCancel();
    }
  }, [onCancel, isLoading]);

  const formatAmount = (amountInCents: number, curr: string): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: curr.toUpperCase()
    }).format(amountInCents / 100);
  };

  if (!isElementsReady) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="lg" />
          <span className="ml-3 text-lg">Loading payment form...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${className}`}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Payment Summary */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Total Amount:</span>
            <span className="text-lg font-bold text-gray-900">
              {formatAmount(amount, currency)}
            </span>
          </div>
          {description && (
            <p className="text-sm text-gray-600 mt-2">{description}</p>
          )}
        </div>

        {/* Error Message */}
        {errorMessage && (
          <ErrorMessage 
            message={errorMessage} 
            className="mb-4"
            onDismiss={() => setErrorMessage(null)}
          />
        )}

        {/* Payment Element */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            Payment Information
          </label>
          <div className="p-4 border border-gray-200 rounded-lg bg-white">
            <PaymentElement 
              options={{
                layout: 'tabs',
                paymentMethodOrder: ['card', 'apple_pay', 'google_pay']
              }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
          {showCancelButton && (
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
              className="sm:order-1"
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={!stripe || !elements || isLoading || disabled}
            className="sm:order-2 min-w-[160px]"
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Processing...
              </>
            ) : (
              submitButtonText
            )}
          </Button>
        </div>

        {/* Security Notice */}
        <div className="flex items-center justify-center pt-4 border-t border-gray-100">
          <div className="flex items-center text-sm text-gray-500">
            <svg
              className="w-4 h-4 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                clipRule="evenodd"
              />
            </svg>
            Your payment information is secure and encrypted
          </div>
        </div>
      </form>
    </Card>
  );
};

export const PaymentForm: React.FC<PaymentFormProps> = ({ 
  clientSecret, 
  ...props 
}) => {
  if (!clientSecret) {
    return (
      <Card className={`p-6 ${props.className || ''}`}>
        <ErrorMessage message="Payment session not initialized. Please try again." />
      </Card>
    );
  }

  const elementsOptions = getStripeElementsOptions(clientSecret);

  return (
    <Elements stripe={stripePromise} options={elementsOptions}>
      <PaymentFormContent {...props} />
    </Elements>
  );
};

export default PaymentForm;