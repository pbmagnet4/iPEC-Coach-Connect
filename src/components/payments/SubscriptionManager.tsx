/**
 * SubscriptionManager Component
 * 
 * Comprehensive subscription management component that provides:
 * - View active subscriptions
 * - Subscription plan comparison and selection
 * - Subscription creation with payment processing
 * - Subscription cancellation and modification
 * - Usage tracking and limits
 * - Billing history and invoices
 */

import React, { useState, useEffect, useCallback } from 'react';
import { authService } from '../../services/auth.service';
import iPECPaymentService from '../../services/payment.service';
import { stripeService } from '../../services/stripe.service';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ErrorMessage } from '../ui/ErrorMessage';
import { Modal } from '../ui/Modal';
import { ProgressBar } from '../ui/ProgressBar';
import PaymentForm from './PaymentForm';
import type {
  Subscription,
  SubscriptionPlan,
  SubscriptionPlanWithPrice,
  Invoice,
  PaymentCustomer,
  SubscriptionCreationResult
} from '../../types/database';

interface SubscriptionManagerProps {
  className?: string;
  onSubscriptionChange?: (subscription: Subscription | null) => void;
}

interface SubscriptionCardProps {
  subscription: Subscription;
  plan: SubscriptionPlanWithPrice;
  onCancel: (subscriptionId: string) => Promise<void>;
  onReactivate?: (subscriptionId: string) => Promise<void>;
  loading: boolean;
}

interface PlanComparisonProps {
  plans: SubscriptionPlanWithPrice[];
  currentPlan?: SubscriptionPlan;
  onSelectPlan: (planId: string) => void;
  loading: boolean;
}

const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
  subscription,
  plan,
  onCancel,
  onReactivate,
  loading
}) => {
  const [isCancelling, setIsCancelling] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);

  const handleCancel = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to cancel your subscription? You will still have access until the end of your billing period.'
    );
    
    if (!confirmed) return;
    
    setIsCancelling(true);
    try {
      await onCancel(subscription.id);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleReactivate = async () => {
    if (!onReactivate) return;
    
    setIsReactivating(true);
    try {
      await onReactivate(subscription.id);
    } finally {
      setIsReactivating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: 'green' as const, label: 'Active' },
      trialing: { color: 'blue' as const, label: 'Trial' },
      past_due: { color: 'yellow' as const, label: 'Past Due' },
      canceled: { color: 'gray' as const, label: 'Canceled' },
      incomplete: { color: 'red' as const, label: 'Incomplete' },
      incomplete_expired: { color: 'red' as const, label: 'Expired' },
      unpaid: { color: 'red' as const, label: 'Unpaid' },
      paused: { color: 'gray' as const, label: 'Paused' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || 
      { color: 'gray' as const, label: status };

    return <Badge color={config.color}>{config.label}</Badge>;
  };

  const getUsagePercentage = () => {
    if (!subscription.sessions_limit) return 0;
    return (subscription.sessions_used / subscription.sessions_limit) * 100;
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'red';
    if (percentage >= 75) return 'yellow';
    return 'blue';
  };

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">{plan.name}</h3>
          <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusBadge(subscription.status)}
        </div>
      </div>

      {/* Subscription Details */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Current Period</label>
            <p className="text-sm text-gray-900">
              {formatDate(subscription.current_period_start)} - {formatDate(subscription.current_period_end)}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Amount</label>
            <p className="text-sm text-gray-900">
              {stripeService.utils.formatAmount(plan.price.unit_amount, plan.price.currency)}
              {plan.price.recurring_interval && ` / ${plan.price.recurring_interval}`}
            </p>
          </div>
        </div>

        {/* Usage Tracking */}
        {subscription.sessions_limit && (
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Session Usage
              </label>
              <span className="text-sm text-gray-600">
                {subscription.sessions_used} / {subscription.sessions_limit} sessions
              </span>
            </div>
            <ProgressBar
              progress={getUsagePercentage()}
              color={getUsageColor(getUsagePercentage())}
              className="h-2"
            />
            {getUsagePercentage() >= 90 && (
              <p className="text-sm text-amber-600 mt-2">
                You're approaching your session limit. Consider upgrading your plan.
              </p>
            )}
          </div>
        )}

        {/* Cancellation Notice */}
        {subscription.cancel_at && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex">
              <svg
                className="h-5 w-5 text-yellow-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="ml-3">
                <p className="text-sm text-yellow-800">
                  Your subscription will be canceled on {formatDate(subscription.cancel_at)}.
                  You'll continue to have access until then.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Features List */}
        {plan.features && plan.features.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Plan Features
            </label>
            <ul className="text-sm text-gray-600 space-y-1">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center">
                  <svg
                    className="h-4 w-4 text-green-500 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex space-x-3">
          {subscription.status === 'active' && !subscription.cancel_at && (
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={loading || isCancelling}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              {isCancelling ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Cancelling...
                </>
              ) : (
                'Cancel Subscription'
              )}
            </Button>
          )}
          
          {subscription.cancel_at && onReactivate && (
            <Button
              onClick={handleReactivate}
              disabled={loading || isReactivating}
            >
              {isReactivating ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Reactivating...
                </>
              ) : (
                'Reactivate Subscription'
              )}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

const PlanComparison: React.FC<PlanComparisonProps> = ({
  plans,
  currentPlan,
  onSelectPlan,
  loading
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {plans.map((plan) => {
        const isCurrentPlan = currentPlan?.id === plan.id;
        const isPopular = plan.name.toLowerCase().includes('professional');
        
        return (
          <Card key={plan.id} className={`p-6 relative ${isPopular ? 'ring-2 ring-blue-500' : ''}`}>
            {isPopular && (
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <Badge color="blue">Most Popular</Badge>
              </div>
            )}
            
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900">{plan.name}</h3>
              {plan.description && (
                <p className="text-sm text-gray-600 mt-2">{plan.description}</p>
              )}
              
              <div className="mt-4">
                <span className="text-3xl font-bold text-gray-900">
                  {stripeService.utils.formatAmount(plan.price.unit_amount, plan.price.currency)}
                </span>
                {plan.price.recurring_interval && (
                  <span className="text-gray-600">/{plan.price.recurring_interval}</span>
                )}
              </div>
              
              {plan.max_sessions && (
                <p className="text-sm text-gray-600 mt-2">
                  Up to {plan.max_sessions} sessions per {plan.price.recurring_interval || 'month'}
                </p>
              )}
            </div>
            
            {/* Features */}
            {plan.features && plan.features.length > 0 && (
              <ul className="mt-6 space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <svg
                      className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-sm text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>
            )}
            
            <div className="mt-8">
              <Button
                onClick={() => onSelectPlan(plan.id)}
                disabled={loading || isCurrentPlan}
                className="w-full"
                variant={isCurrentPlan ? 'outline' : 'default'}
              >
                {isCurrentPlan ? 'Current Plan' : 'Select Plan'}
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export const SubscriptionManager: React.FC<SubscriptionManagerProps> = ({
  className = '',
  onSubscriptionChange
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlanWithPrice | null>(null);
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlanWithPrice[]>([]);
  const [showPlanSelection, setShowPlanSelection] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanWithPrice | null>(null);
  const [subscriptionResult, setSubscriptionResult] = useState<SubscriptionCreationResult | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load current subscription
      const subscription = await iPECPaymentService.subscription.getUserActiveSubscription();
      setCurrentSubscription(subscription);

      if (subscription) {
        // Load current plan details
        const plans = await stripeService.product.getSubscriptionPlans();
        const plan = plans.find(p => p.id === subscription.plan_id) as SubscriptionPlanWithPrice;
        setCurrentPlan(plan);
      }

      // Load available plans
      const allPlans = await stripeService.product.getSubscriptionPlans() as SubscriptionPlanWithPrice[];
      setAvailablePlans(allPlans);

      if (onSubscriptionChange) {
        onSubscriptionChange(subscription);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  }, [onSubscriptionChange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCancelSubscription = async (subscriptionId: string) => {
    try {
      setLoading(true);
      const result = await iPECPaymentService.subscription.cancelSubscription(subscriptionId, true);
      
      if (result.success && result.subscription) {
        setCurrentSubscription(result.subscription);
        if (onSubscriptionChange) {
          onSubscriptionChange(result.subscription);
        }
      } else {
        setError(result.error || 'Failed to cancel subscription');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel subscription');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async (planId: string) => {
    const plan = availablePlans.find(p => p.id === planId);
    if (!plan) return;

    setSelectedPlan(plan);
    
    try {
      const result = await iPECPaymentService.subscription.createSubscription(planId);
      setSubscriptionResult(result);
      
      if (result.success && !result.requires_payment_method) {
        // Subscription created successfully without additional payment
        await loadData();
        setShowPlanSelection(false);
      }
      // If requires payment, the PaymentForm will be shown
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create subscription');
    }
  };

  const handlePaymentSuccess = async () => {
    setSubscriptionResult(null);
    setSelectedPlan(null);
    setShowPlanSelection(false);
    await loadData();
  };

  const handlePaymentError = (error: string) => {
    setError(error);
    setSubscriptionResult(null);
  };

  if (loading && !showPlanSelection) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
          <span className="ml-3 text-lg">Loading subscription data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Subscription Management</h2>
        {!currentSubscription && (
          <Button onClick={() => setShowPlanSelection(true)}>
            Choose Plan
          </Button>
        )}
      </div>

      {error && (
        <ErrorMessage 
          message={error} 
          onDismiss={() => setError(null)}
        />
      )}

      {/* Current Subscription */}
      {currentSubscription && currentPlan ? (
        <SubscriptionCard
          subscription={currentSubscription}
          plan={currentPlan}
          onCancel={handleCancelSubscription}
          loading={loading}
        />
      ) : (
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
            <h3 className="mt-4 text-lg font-medium text-gray-900">No Active Subscription</h3>
            <p className="mt-2 text-sm text-gray-500">
              Choose a subscription plan to access coaching sessions and premium features.
            </p>
            <Button
              onClick={() => setShowPlanSelection(true)}
              className="mt-4"
            >
              View Plans
            </Button>
          </div>
        </Card>
      )}

      {/* Plan Selection Modal */}
      <Modal
        isOpen={showPlanSelection}
        onClose={() => {
          setShowPlanSelection(false);
          setSelectedPlan(null);
          setSubscriptionResult(null);
        }}
        title="Choose Your Plan"
        size="xl"
      >
        <div className="space-y-6">
          {subscriptionResult?.requires_payment_method && subscriptionResult.client_secret ? (
            <PaymentForm
              clientSecret={subscriptionResult.client_secret}
              amount={selectedPlan?.price.unit_amount || 0}
              currency={selectedPlan?.price.currency || 'usd'}
              description={`Subscription: ${selectedPlan?.name}`}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              submitButtonText="Complete Subscription"
              showCancelButton
              onCancel={() => {
                setSubscriptionResult(null);
                setSelectedPlan(null);
              }}
            />
          ) : (
            <PlanComparison
              plans={availablePlans}
              currentPlan={currentPlan || undefined}
              onSelectPlan={handleSelectPlan}
              loading={loading}
            />
          )}
        </div>
      </Modal>
    </div>
  );
};

export default SubscriptionManager;