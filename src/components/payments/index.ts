/**
 * Payment Components Index
 * 
 * Centralized exports for all payment-related components in the iPEC Coach Connect platform.
 * This includes forms, managers, viewers, and complete checkout flows for secure payment processing.
 */

// Core payment components
export { default as PaymentForm } from './PaymentForm';
export { default as PaymentMethodManager } from './PaymentMethodManager';
export { default as SubscriptionManager } from './SubscriptionManager';
export { default as CheckoutFlow } from './CheckoutFlow';
export { default as InvoiceViewer } from './InvoiceViewer';

// Export types for checkout flow
export type { CheckoutItem } from './CheckoutFlow';

// Re-export payment-related types from database types
export type {
  PaymentCustomer,
  PaymentMethod,
  PaymentIntent,
  SetupIntent,
  Subscription,
  SubscriptionPlan,
  SubscriptionPlanWithPrice,
  PaymentProduct,
  PaymentPrice,
  Invoice,
  InvoiceWithDetails,
  InvoiceLineItem,
  RevenueRecord,
  Refund,
  PaymentProcessingResult,
  SubscriptionCreationResult,
  PaymentMethodSetupData,
  PaymentSummary,
  CoachPayoutSummary
} from '../../types/database';

// Component combinations for common use cases
export const PaymentComponents = {
  // For complete checkout experience
  CheckoutFlow,
  
  // For payment method management in settings
  PaymentMethodManager,
  
  // For subscription management dashboard
  SubscriptionManager,
  
  // For billing and invoice history
  InvoiceViewer,
  
  // For custom payment forms
  PaymentForm
};

// Utility exports from services
export { stripePromise, stripeService } from '../../services/stripe.service';
export { default as iPECPaymentService } from '../../services/payment.service';
export { default as webhookService } from '../../services/webhook.service';

// Constants for common use
export const PAYMENT_CONSTANTS = {
  CURRENCIES: {
    USD: 'usd',
    EUR: 'eur',
    GBP: 'gbp',
    CAD: 'cad'
  },
  
  PAYMENT_METHOD_TYPES: {
    CARD: 'card',
    BANK_ACCOUNT: 'bank_account',
    SEPA_DEBIT: 'sepa_debit',
    IDEAL: 'ideal',
    PAYPAL: 'paypal'
  },
  
  PAYMENT_INTENT_STATUSES: {
    REQUIRES_PAYMENT_METHOD: 'requires_payment_method',
    REQUIRES_CONFIRMATION: 'requires_confirmation',
    REQUIRES_ACTION: 'requires_action',
    PROCESSING: 'processing',
    REQUIRES_CAPTURE: 'requires_capture',
    CANCELED: 'canceled',
    SUCCEEDED: 'succeeded'
  },
  
  SUBSCRIPTION_STATUSES: {
    TRIALING: 'trialing',
    ACTIVE: 'active',
    INCOMPLETE: 'incomplete',
    INCOMPLETE_EXPIRED: 'incomplete_expired',
    PAST_DUE: 'past_due',
    CANCELED: 'canceled',
    UNPAID: 'unpaid',
    PAUSED: 'paused'
  },
  
  INVOICE_STATUSES: {
    DRAFT: 'draft',
    OPEN: 'open',
    PAID: 'paid',
    VOID: 'void',
    UNCOLLECTIBLE: 'uncollectible'
  }
} as const;