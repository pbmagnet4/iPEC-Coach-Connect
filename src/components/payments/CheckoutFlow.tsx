/**
 * CheckoutFlow Component
 * 
 * Complete checkout flow for session bookings, course purchases, and event registrations.
 * Provides a step-by-step checkout process with:
 * - Order summary and details
 * - Payment method selection/addition
 * - Secure payment processing
 * - Confirmation and receipt
 * - Error handling and recovery
 */

import React, { useState, useEffect, useCallback } from 'react';
import { authService } from '../../services/auth.service';
import iPECPaymentService from '../../services/payment.service';
import { stripeService } from '../../services/stripe.service';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ErrorMessage } from '../ui/ErrorMessage';
import { Badge } from '../ui/Badge';
import PaymentForm from './PaymentForm';
import PaymentMethodManager from './PaymentMethodManager';
import type {
  PaymentMethod,
  PaymentCustomer,
  PaymentProcessingResult,
  SessionWithDetails,
  CoachWithProfile
} from '../../types/database';

export type CheckoutItem = {
  id: string;
  type: 'session' | 'course' | 'event' | 'package';
  name: string;
  description?: string;
  price: number;
  currency?: string;
  metadata?: Record<string, any>;
};

interface CheckoutFlowProps {
  items: CheckoutItem[];
  onSuccess: (result: { payment_intent?: string; session?: SessionWithDetails; receipt_url?: string }) => void;
  onCancel: () => void;
  className?: string;
  // For session booking specific props
  sessionData?: {
    coach_id: string;
    session_type_id: string;
    scheduled_at: string;
    duration_minutes: number;
    notes?: string;
  };
}

interface OrderSummaryProps {
  items: CheckoutItem[];
  subtotal: number;
  taxes: number;
  total: number;
  currency: string;
}

interface PaymentMethodSelectorProps {
  customer: PaymentCustomer;
  selectedMethodId: string | null;
  onMethodSelect: (methodId: string | null) => void;
  onMethodAdded: (method: PaymentMethod) => void;
  loading: boolean;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({
  items,
  subtotal,
  taxes,
  total,
  currency
}) => {
  const formatAmount = (amount: number, curr: string) => 
    stripeService.utils.formatAmount(amount * 100, curr);

  return (
    <Card className="p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h3>
      
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex justify-between items-start">
            <div className="flex-1">
              <div className="font-medium text-gray-900">{item.name}</div>
              {item.description && (
                <div className="text-sm text-gray-600">{item.description}</div>
              )}
              <Badge color="blue" className="mt-1">
                {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
              </Badge>
            </div>
            <div className="font-medium text-gray-900 ml-4">
              {formatAmount(item.price, item.currency || currency)}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-200 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal</span>
          <span className="text-gray-900">{formatAmount(subtotal, currency)}</span>
        </div>
        
        {taxes > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Taxes</span>
            <span className="text-gray-900">{formatAmount(taxes, currency)}</span>
          </div>
        )}
        
        <div className="flex justify-between text-lg font-medium pt-2 border-t border-gray-200">
          <span className="text-gray-900">Total</span>
          <span className="text-gray-900">{formatAmount(total, currency)}</span>
        </div>
      </div>
    </Card>
  );
};

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  customer,
  selectedMethodId,
  onMethodSelect,
  onMethodAdded,
  loading
}) => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [methodsLoading, setMethodsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPaymentMethods = useCallback(async () => {
    try {
      setMethodsLoading(true);
      const methods = await stripeService.paymentMethod.listPaymentMethods(customer.id);
      setPaymentMethods(methods);
      
      // Auto-select default payment method
      const defaultMethod = methods.find(method => method.is_default);
      if (defaultMethod && !selectedMethodId) {
        onMethodSelect(defaultMethod.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payment methods');
    } finally {
      setMethodsLoading(false);
    }
  }, [customer.id, selectedMethodId, onMethodSelect]);

  useEffect(() => {
    loadPaymentMethods();
  }, [loadPaymentMethods]);

  const handleMethodAdded = (method: PaymentMethod) => {
    setPaymentMethods(prev => [...prev, method]);
    onMethodAdded(method);
    onMethodSelect(method.id); // Auto-select newly added method
  };

  if (methodsLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-6">
          <LoadingSpinner size="lg" />
          <span className="ml-3">Loading payment methods...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Payment Method</h3>
      
      {error && (
        <ErrorMessage message={error} onDismiss={() => setError(null)} />
      )}

      {paymentMethods.length > 0 ? (
        <Card className="p-4">
          <div className="space-y-3">
            <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="payment_method"
                value="new"
                checked={selectedMethodId === null}
                onChange={() => onMethodSelect(null)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                disabled={loading}
              />
              <span className="ml-3 text-sm font-medium text-gray-900">
                Use a new payment method
              </span>
            </label>
            
            {paymentMethods.map((method) => (
              <label
                key={method.id}
                className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
              >
                <input
                  type="radio"
                  name="payment_method"
                  value={method.id}
                  checked={selectedMethodId === method.id}
                  onChange={() => onMethodSelect(method.id)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  disabled={loading}
                />
                <div className="ml-3 flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    {method.card_info?.brand?.toUpperCase()} •••• {method.card_info?.last4}
                  </div>
                  <div className="text-xs text-gray-500">
                    Expires {method.card_info?.exp_month?.toString().padStart(2, '0')}/
                    {method.card_info?.exp_year?.toString().slice(-2)}
                  </div>
                </div>
                {method.is_default && (
                  <Badge color="blue" size="sm">Default</Badge>
                )}
              </label>
            ))}
          </div>
        </Card>
      ) : (
        <div className="text-center py-6">
          <p className="text-gray-600">No saved payment methods. A new payment method will be required.</p>
        </div>
      )}

      <PaymentMethodManager
        customerId={customer.id}
        onPaymentMethodAdded={handleMethodAdded}
        className="border-t pt-4"
      />
    </div>
  );
};

export const CheckoutFlow: React.FC<CheckoutFlowProps> = ({
  items,
  onSuccess,
  onCancel,
  className = '',
  sessionData
}) => {
  const [step, setStep] = useState<'summary' | 'payment' | 'processing' | 'complete'>('summary');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customer, setCustomer] = useState<PaymentCustomer | null>(null);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string | null>(null);
  const [paymentIntent, setPaymentIntent] = useState<{ 
    client_secret: string; 
    id: string; 
  } | null>(null);

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  const taxes = 0; // Could be calculated based on location
  const total = subtotal + taxes;
  const currency = items[0]?.currency || 'usd';

  useEffect(() => {
    initializeCheckout();
  }, []);

  const initializeCheckout = async () => {
    try {
      setLoading(true);
      const currentUser = authService.getState().user;
      
      if (!currentUser) {
        throw new Error('User must be authenticated to checkout');
      }

      // Get or create customer
      const customerData = await stripeService.customer.createOrGetCustomer(
        currentUser.id,
        currentUser.email || '',
        currentUser.user_metadata?.full_name
      );

      setCustomer(customerData);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize checkout');
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToPayment = async () => {
    if (!customer) return;

    try {
      setLoading(true);
      setError(null);

      // For session booking, use the specialized booking service
      if (sessionData && items.length === 1 && items[0].type === 'session') {
        const result = await iPECPaymentService.booking.bookSessionWithPayment({
          ...sessionData,
          payment_method_id: selectedPaymentMethodId || undefined
        });

        if (!result.success) {
          throw new Error(result.error);
        }

        if (result.client_secret) {
          setPaymentIntent({
            client_secret: result.client_secret,
            id: result.payment_intent?.id || ''
          });
          setStep('payment');
        } else {
          // Payment succeeded without additional confirmation
          onSuccess({
            session: result.session,
            payment_intent: result.payment_intent?.id
          });
        }
      } else {
        // For other purchases, create a payment intent
        const totalAmountCents = Math.round(total * 100);
        const description = items.length === 1 
          ? items[0].name 
          : `${items.length} items from iPEC Coach Connect`;

        const result = await stripeService.payment.createPaymentIntent({
          customer_id: customer.id,
          amount: totalAmountCents,
          currency,
          description,
          receipt_email: authService.getState().user?.email,
          payment_method_id: selectedPaymentMethodId || undefined,
          entity_type: items[0].type,
          entity_id: items[0].id,
          metadata: {
            item_count: items.length.toString(),
            item_types: items.map(item => item.type).join(',')
          }
        });

        if (!result.success || !result.payment_intent || !result.client_secret) {
          throw new Error(result.error?.message || 'Failed to create payment intent');
        }

        setPaymentIntent({
          client_secret: result.client_secret,
          id: result.payment_intent.id
        });
        setStep('payment');
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process checkout');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (result: PaymentProcessingResult) => {
    setStep('complete');
    onSuccess({
      payment_intent: result.payment_intent?.id,
      receipt_url: result.payment_intent?.charges?.data?.[0]?.receipt_url
    });
  };

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage);
    setStep('summary'); // Go back to summary to try again
  };

  const renderStepContent = () => {
    switch (step) {
      case 'summary':
        return (
          <div className="space-y-6">
            <OrderSummary
              items={items}
              subtotal={subtotal}
              taxes={taxes}
              total={total}
              currency={currency}
            />

            {customer && (
              <PaymentMethodSelector
                customer={customer}
                selectedMethodId={selectedPaymentMethodId}
                onMethodSelect={setSelectedPaymentMethodId}
                onMethodAdded={() => {}} // Handle if needed
                loading={loading}
              />
            )}

            {error && (
              <ErrorMessage message={error} onDismiss={() => setError(null)} />
            )}

            <div className="flex space-x-4">
              <Button
                variant="outline"
                onClick={onCancel}
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleProceedToPayment}
                disabled={loading || !customer}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Processing...
                  </>
                ) : (
                  `Pay ${stripeService.utils.formatAmount(Math.round(total * 100), currency)}`
                )}
              </Button>
            </div>
          </div>
        );

      case 'payment':
        if (!paymentIntent) {
          return (
            <div className="text-center py-8">
              <LoadingSpinner size="lg" />
              <p className="mt-4">Setting up payment...</p>
            </div>
          );
        }

        return (
          <PaymentForm
            clientSecret={paymentIntent.client_secret}
            amount={Math.round(total * 100)}
            currency={currency}
            description={`Order #${paymentIntent.id.slice(-8)}`}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
            onCancel={() => setStep('summary')}
            showCancelButton
            submitButtonText={`Pay ${stripeService.utils.formatAmount(Math.round(total * 100), currency)}`}
          />
        );

      case 'complete':
        return (
          <Card className="p-8 text-center">
            <div className="text-green-600 mb-4">
              <svg
                className="mx-auto h-16 w-16"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              Payment Successful!
            </h3>
            <p className="text-gray-600">
              Your order has been processed successfully. You will receive a confirmation email shortly.
            </p>
          </Card>
        );

      default:
        return null;
    }
  };

  const getStepIndicator = () => {
    const steps = ['Summary', 'Payment', 'Complete'];
    const currentStepIndex = ['summary', 'payment', 'complete'].indexOf(step);

    return (
      <div className="mb-8">
        <div className="flex items-center justify-center space-x-4">
          {steps.map((stepName, index) => (
            <React.Fragment key={stepName}>
              <div className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    index <= currentStepIndex
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {index + 1}
                </div>
                <span
                  className={`ml-2 text-sm font-medium ${
                    index <= currentStepIndex ? 'text-blue-600' : 'text-gray-500'
                  }`}
                >
                  {stepName}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-8 h-px ${
                    index < currentStepIndex ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  if (!customer && !error) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
          <span className="ml-3 text-lg">Initializing checkout...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-2xl mx-auto ${className}`}>
      {getStepIndicator()}
      {renderStepContent()}
    </div>
  );
};

export default CheckoutFlow;