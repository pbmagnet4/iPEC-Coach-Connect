/**
 * PaymentMethodManager Component
 * 
 * Comprehensive payment method management component that allows users to:
 * - View saved payment methods
 * - Add new payment methods
 * - Set default payment method
 * - Delete payment methods
 * - Update billing information
 * 
 * Uses Stripe Setup Intents for secure payment method collection
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe
} from '@stripe/react-stripe-js';
import { getStripeElementsOptions, stripePromise, stripeService } from '../../services/stripe.service';
import { authService } from '../../services/auth.service';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ErrorMessage } from '../ui/ErrorMessage';
import { Modal } from '../ui/Modal';
import type { PaymentCustomer, PaymentMethod, SetupIntent } from '../../types/database';

interface PaymentMethodManagerProps {
  customerId?: string;
  onPaymentMethodAdded?: (paymentMethod: PaymentMethod) => void;
  onPaymentMethodDeleted?: (paymentMethodId: string) => void;
  className?: string;
}

interface PaymentMethodCardProps {
  paymentMethod: PaymentMethod;
  isDefault: boolean;
  onSetDefault: (paymentMethodId: string) => Promise<void>;
  onDelete: (paymentMethodId: string) => Promise<void>;
  loading: boolean;
}

const PaymentMethodCard: React.FC<PaymentMethodCardProps> = ({
  paymentMethod,
  isDefault,
  onSetDefault,
  onDelete,
  loading
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSettingDefault, setIsSettingDefault] = useState(false);

  const handleSetDefault = async () => {
    if (isDefault || loading) return;
    
    setIsSettingDefault(true);
    try {
      await onSetDefault(paymentMethod.id);
    } finally {
      setIsSettingDefault(false);
    }
  };

  const handleDelete = async () => {
    if (loading || isDefault) return;
    
    const confirmed = window.confirm('Are you sure you want to delete this payment method?');
    if (!confirmed) return;
    
    setIsDeleting(true);
    try {
      await onDelete(paymentMethod.id);
    } finally {
      setIsDeleting(false);
    }
  };

  const getCardIcon = (brand: string) => {
    switch (brand?.toLowerCase()) {
      case 'visa':
        return '💳 Visa';
      case 'mastercard':
        return '💳 Mastercard';
      case 'amex':
        return '💳 American Express';
      case 'discover':
        return '💳 Discover';
      default:
        return '💳 Card';
    }
  };

  const formatExpiryDate = (expMonth: number, expYear: number) => {
    return `${expMonth.toString().padStart(2, '0')}/${expYear.toString().slice(-2)}`;
  };

  return (
    <Card className={`p-4 ${isDefault ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">
            {getCardIcon(paymentMethod.card_info?.brand || '')}
          </div>
          <div>
            <div className="font-medium text-gray-900">
              {getCardIcon(paymentMethod.card_info?.brand || '').split(' ')[1]} •••• {paymentMethod.card_info?.last4}
            </div>
            <div className="text-sm text-gray-500">
              Expires {formatExpiryDate(
                paymentMethod.card_info?.exp_month || 0,
                paymentMethod.card_info?.exp_year || 0
              )}
            </div>
            {isDefault && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                Default
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {!isDefault && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSetDefault}
              disabled={loading || isSettingDefault}
            >
              {isSettingDefault ? (
                <LoadingSpinner size="sm" />
              ) : (
                'Set Default'
              )}
            </Button>
          )}
          
          {!isDefault && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={loading || isDeleting}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              {isDeleting ? (
                <LoadingSpinner size="sm" />
              ) : (
                'Delete'
              )}
            </Button>
          )}
        </div>
      </div>
      
      {paymentMethod.billing_details?.name && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            <div>{paymentMethod.billing_details.name}</div>
            {paymentMethod.billing_details.email && (
              <div>{paymentMethod.billing_details.email}</div>
            )}
            {paymentMethod.billing_details.address && (
              <div className="mt-1">
                {paymentMethod.billing_details.address.line1}
                {paymentMethod.billing_details.address.line2 && (
                  <><br />{paymentMethod.billing_details.address.line2}</>
                )}
                <br />
                {paymentMethod.billing_details.address.city}, {paymentMethod.billing_details.address.state} {paymentMethod.billing_details.address.postal_code}
                {paymentMethod.billing_details.address.country && (
                  <><br />{paymentMethod.billing_details.address.country}</>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

interface AddPaymentMethodFormProps {
  clientSecret: string;
  onSuccess: (setupIntent: SetupIntent) => void;
  onCancel: () => void;
}

const AddPaymentMethodForm: React.FC<AddPaymentMethodFormProps> = ({
  clientSecret,
  onSuccess,
  onCancel
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
  void event.preventDefault();

    if (!stripe || !elements) {
      setErrorMessage('Payment system not ready. Please try again.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const { error, setupIntent } = await stripe.confirmSetup({
        elements,
        redirect: 'if_required',
        confirmParams: {
          return_url: `${window.location.origin}/settings/payments`
        }
      });

      if (error) {
        setErrorMessage(error.message || 'Failed to save payment method');
      } else if (setupIntent) {
        // Payment method saved successfully
        onSuccess({
          stripe_setup_intent_id: setupIntent.id,
          status: setupIntent.status
        } as SetupIntent);
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMessage && (
        <ErrorMessage 
          message={errorMessage} 
          onDismiss={() => setErrorMessage(null)}
        />
      )}

      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Payment Method Information
        </label>
        <div className="p-4 border border-gray-200 rounded-lg bg-white">
          <PaymentElement
            options={{
              layout: 'tabs',
              paymentMethodOrder: ['card']
            }}
          />
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!stripe || !elements || isLoading}
        >
          {isLoading ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Saving...
            </>
          ) : (
            'Save Payment Method'
          )}
        </Button>
      </div>
    </form>
  );
};

export const PaymentMethodManager: React.FC<PaymentMethodManagerProps> = ({
  customerId,
  onPaymentMethodAdded,
  onPaymentMethodDeleted,
  className = ''
}) => {
  const [customer, setCustomer] = useState<PaymentCustomer | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [setupIntent, setSetupIntent] = useState<{
    setup_intent: SetupIntent;
    client_secret: string;
  } | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const currentUser = authService.getState().user;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // Get or create customer
      const customerData = customerId 
        ? await stripeService.customer.getCustomerByUserId(currentUser.id)
        : await stripeService.customer.createOrGetCustomer(
            currentUser.id,
            currentUser.email || '',
            currentUser.user_metadata?.full_name
          );

      if (!customerData) {
        throw new Error('Unable to load customer data');
      }

      setCustomer(customerData);

      // Load payment methods
      const methods = await stripeService.paymentMethod.listPaymentMethods(customerData.id);
      setPaymentMethods(methods);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddPaymentMethod = async () => {
    if (!customer) return;

    try {
      setLoading(true);
      const setupData = await stripeService.paymentMethod.createSetupIntent({
        customer_id: customer.id,
        payment_method_type: 'card',
        return_url: `${window.location.origin}/settings/payments`,
        usage: 'off_session'
      });

      setSetupIntent(setupData);
      setShowAddForm(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize payment method setup');
    } finally {
      setLoading(false);
    }
  };

  const handleSetupSuccess = async (completedSetupIntent: SetupIntent) => {
    setShowAddForm(false);
    setSetupIntent(null);
    
    // Reload payment methods
    await loadData();
    
    if (onPaymentMethodAdded && customer) {
      // Find the newly added payment method
      const updatedMethods = await stripeService.paymentMethod.listPaymentMethods(customer.id);
      const newMethod = updatedMethods.find(method => 
        !paymentMethods.find(existing => existing.id === method.id)
      );
      if (newMethod) {
        onPaymentMethodAdded(newMethod);
      }
    }
  };

  const handleSetDefault = async (paymentMethodId: string) => {
    if (!customer) return;

    try {
      await stripeService.paymentMethod.setDefaultPaymentMethod(customer.id, paymentMethodId);
      await loadData(); // Reload to update default status
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set default payment method');
    }
  };

  const handleDelete = async (paymentMethodId: string) => {
    try {
      await stripeService.paymentMethod.deletePaymentMethod(paymentMethodId);
      setPaymentMethods(methods => methods.filter(method => method.id !== paymentMethodId));
      
      if (onPaymentMethodDeleted) {
        onPaymentMethodDeleted(paymentMethodId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete payment method');
    }
  };

  if (loading && !showAddForm) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="lg" />
          <span className="ml-3">Loading payment methods...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Payment Methods</h3>
        <Button onClick={handleAddPaymentMethod} disabled={loading}>
          Add Payment Method
        </Button>
      </div>

      {error && (
        <ErrorMessage 
          message={error} 
          onDismiss={() => setError(null)}
        />
      )}

      <div className="space-y-4">
        {paymentMethods.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="text-gray-500">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M34 40h10v-4a6 6 0 00-10.712-3.714M34 40H14m20 0v-4a9.971 9.971 0 00-.712-3.714M14 40H4v-4a6 6 0 0110.713-3.714M14 40v-4c0-1.313.253-2.566.713-3.714m0 0A9.971 9.971 0 0124 24c5.523 0 10 4.477 10 10.001v.001"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <h4 className="mt-4 text-lg font-medium text-gray-900">No payment methods</h4>
              <p className="mt-2 text-sm text-gray-500">
                Add a payment method to make purchases and manage subscriptions.
              </p>
            </div>
          </Card>
        ) : (
          paymentMethods.map((method) => (
            <PaymentMethodCard
              key={method.id}
              paymentMethod={method}
              isDefault={method.is_default}
              onSetDefault={handleSetDefault}
              onDelete={handleDelete}
              loading={loading}
            />
          ))
        )}
      </div>

      {/* Add Payment Method Modal */}
      <Modal
        isOpen={showAddForm}
        onClose={() => {
          setShowAddForm(false);
          setSetupIntent(null);
        }}
        title="Add Payment Method"
        size="lg"
      >
        {setupIntent ? (
          <Elements 
            stripe={stripePromise} 
            options={getStripeElementsOptions(setupIntent.client_secret)}
          >
            <AddPaymentMethodForm
              clientSecret={setupIntent.client_secret}
              onSuccess={handleSetupSuccess}
              onCancel={() => {
                setShowAddForm(false);
                setSetupIntent(null);
              }}
            />
          </Elements>
        ) : (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="lg" />
            <span className="ml-3">Setting up payment form...</span>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PaymentMethodManager;