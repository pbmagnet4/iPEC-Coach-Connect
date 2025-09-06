/**
 * Stripe Service - Core Payment Integration
 * 
 * This service provides the main interface to Stripe's APIs including:
 * - Customer management
 * - Payment intent processing
 * - Setup intent handling
 * - Payment method management
 * - Subscription lifecycle management
 * - Product and price management
 * 
 * Following Stripe best practices for React/TypeScript integration
 */

import Stripe from 'stripe';
import type { StripeElementsOptions } from '@stripe/stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import type {
  CreatePaymentCustomerData,
  CreatePaymentIntentData,
  CreateSubscriptionData,
  Invoice,
  PaymentCustomer,
  PaymentIntent,
  PaymentMethod,
  PaymentMethodSetupData,
  PaymentPrice,
  PaymentProcessingResult,
  PaymentProduct,
  SetupIntent,
  Subscription,
  SubscriptionCreationResult,
  SubscriptionPlan,
} from '../types/database';
import { errorHandler } from '../lib/error-handling';
import { supabase } from '../lib/supabase';

// Environment variables
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const STRIPE_SECRET_KEY = import.meta.env.VITE_STRIPE_SECRET_KEY;

if (!STRIPE_PUBLISHABLE_KEY) {
  throw new Error('Missing VITE_STRIPE_PUBLISHABLE_KEY environment variable');
}

// Initialize Stripe instances
export const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

// Server-side Stripe instance (for secure operations)
let stripeServerInstance: Stripe | null = null;
const getStripeServer = (): Stripe => {
  if (!stripeServerInstance) {
    if (!STRIPE_SECRET_KEY) {
      throw new Error('Missing VITE_STRIPE_SECRET_KEY environment variable');
    }
    stripeServerInstance = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2024-11-20.acacia',
      typescript: true,
    });
  }
  return stripeServerInstance;
};

/**
 * Customer Management Operations
 */
export const customerService = {
  /**
   * Create or retrieve a Stripe customer for a user
   */
  async createOrGetCustomer(userId: string, email: string, name?: string): Promise<PaymentCustomer> {
    try {
      // Check if customer already exists in our database
      const { data: existingCustomer } = await supabase
        .from('payment_customers')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (existingCustomer) {
        return existingCustomer;
      }

      // Create new Stripe customer
      const stripe = getStripeServer();
      const stripeCustomer = await stripe.customers.create({
        email,
        name,
        metadata: {
          user_id: userId,
          created_by: 'ipec_coach_connect'
        }
      });

      // Store customer in our database
      const customerData: CreatePaymentCustomerData = {
        user_id: userId,
        stripe_customer_id: stripeCustomer.id,
        email: stripeCustomer.email || email,
        invoice_settings: stripeCustomer.invoice_settings || {},
        metadata: stripeCustomer.metadata || {}
      };

      const { data: newCustomer, error } = await supabase
        .from('payment_customers')
        .insert([customerData])
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create customer record: ${error.message}`);
      }

      return newCustomer;
    } catch (error) {
      throw errorHandler.handleError(error, {
        context: 'customer_creation',
        userId,
        email
      });
    }
  },

  /**
   * Update customer information
   */
  async updateCustomer(customerId: string, updates: {
    email?: string;
    name?: string;
    phone?: string;
    address?: Stripe.AddressParam;
  }): Promise<PaymentCustomer> {
    try {
      const { data: customer } = await supabase
        .from('payment_customers')
        .select('stripe_customer_id')
        .eq('id', customerId)
        .single();

      if (!customer) {
        throw new Error('Customer not found');
      }

      // Update Stripe customer
      const stripe = getStripeServer();
      const updatedStripeCustomer = await stripe.customers.update(
        customer.stripe_customer_id,
        updates
      );

      // Update our database
      const { data: updatedCustomer, error } = await supabase
        .from('payment_customers')
        .update({
          email: updatedStripeCustomer.email,
          invoice_settings: updatedStripeCustomer.invoice_settings,
          metadata: updatedStripeCustomer.metadata
        })
        .eq('id', customerId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update customer: ${error.message}`);
      }

      return updatedCustomer;
    } catch (error) {
      throw errorHandler.handleError(error, {
        context: 'customer_update',
        customerId
      });
    }
  },

  /**
   * Get customer by user ID
   */
  async getCustomerByUserId(userId: string): Promise<PaymentCustomer | null> {
    try {
      const { data: customer, error } = await supabase
        .from('payment_customers')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return customer;
    } catch (error) {
      throw errorHandler.handleError(error, {
        context: 'get_customer_by_user_id',
        userId
      });
    }
  }
};

/**
 * Payment Method Management
 */
export const paymentMethodService = {
  /**
   * Create a setup intent for saving payment methods
   */
  async createSetupIntent(data: PaymentMethodSetupData): Promise<{ 
    setup_intent: SetupIntent; 
    client_secret: string;
  }> {
    try {
      const { data: customer } = await supabase
        .from('payment_customers')
        .select('stripe_customer_id')
        .eq('id', data.customer_id)
        .single();

      if (!customer) {
        throw new Error('Customer not found');
      }

      const stripe = getStripeServer();
      const setupIntent = await stripe.setupIntents.create({
        customer: customer.stripe_customer_id,
        payment_method_types: [data.payment_method_type],
        usage: data.usage,
        metadata: {
          customer_id: data.customer_id
        }
      });

      // Store setup intent in our database
      const { data: newSetupIntent, error } = await supabase
        .from('setup_intents')
        .insert([{
          customer_id: data.customer_id,
          stripe_setup_intent_id: setupIntent.id,
          status: setupIntent.status,
          usage: data.usage,
          metadata: setupIntent.metadata || {}
        }])
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create setup intent record: ${error.message}`);
      }

      return {
        setup_intent: newSetupIntent,
        client_secret: setupIntent.client_secret || ''
      };
    } catch (error) {
      throw errorHandler.handleError(error, {
        context: 'setup_intent_creation',
        data
      });
    }
  },

  /**
   * List customer payment methods
   */
  async listPaymentMethods(customerId: string): Promise<PaymentMethod[]> {
    try {
      const { data: methods, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('customer_id', customerId)
        .eq('is_active', true)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return methods || [];
    } catch (error) {
      throw errorHandler.handleError(error, {
        context: 'list_payment_methods',
        customerId
      });
    }
  },

  /**
   * Set default payment method
   */
  async setDefaultPaymentMethod(customerId: string, paymentMethodId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('payment_methods')
        .update({ is_default: true })
        .eq('customer_id', customerId)
        .eq('id', paymentMethodId);

      if (error) {
        throw error;
      }
    } catch (error) {
      throw errorHandler.handleError(error, {
        context: 'set_default_payment_method',
        customerId,
        paymentMethodId
      });
    }
  },

  /**
   * Delete payment method
   */
  async deletePaymentMethod(paymentMethodId: string): Promise<void> {
    try {
      const { data: method } = await supabase
        .from('payment_methods')
        .select('stripe_payment_method_id')
        .eq('id', paymentMethodId)
        .single();

      if (!method) {
        throw new Error('Payment method not found');
      }

      // Detach from Stripe
      const stripe = getStripeServer();
      await stripe.paymentMethods.detach(method.stripe_payment_method_id);

      // Deactivate in our database
      const { error } = await supabase
        .from('payment_methods')
        .update({ is_active: false })
        .eq('id', paymentMethodId);

      if (error) {
        throw error;
      }
    } catch (error) {
      throw errorHandler.handleError(error, {
        context: 'delete_payment_method',
        paymentMethodId
      });
    }
  }
};

/**
 * Payment Processing Operations
 */
export const paymentService = {
  /**
   * Create a payment intent for one-time payments
   */
  async createPaymentIntent(data: CreatePaymentIntentData): Promise<PaymentProcessingResult> {
    try {
      const { data: customer } = await supabase
        .from('payment_customers')
        .select('stripe_customer_id, default_payment_method_id')
        .eq('id', data.customer_id)
        .single();

      if (!customer) {
        throw new Error('Customer not found');
      }

      const stripe = getStripeServer();
      const paymentIntent = await stripe.paymentIntents.create({
        amount: data.amount,
        currency: data.currency,
        customer: customer.stripe_customer_id,
        payment_method: data.payment_method_id || customer.default_payment_method_id,
        description: data.description,
        receipt_email: data.receipt_email,
        confirmation_method: 'manual',
        confirm: false,
        metadata: {
          ...data.metadata,
          entity_type: data.entity_type,
          entity_id: data.entity_id
        }
      });

      // Store payment intent in our database
      const { data: newPaymentIntent, error } = await supabase
        .from('payment_intents')
        .insert([{
          ...data,
          stripe_payment_intent_id: paymentIntent.id,
          status: paymentIntent.status
        }])
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create payment intent record: ${error.message}`);
      }

      return {
        success: true,
        payment_intent: newPaymentIntent,
        client_secret: paymentIntent.client_secret || '',
        requires_action: paymentIntent.status === 'requires_action'
      };
    } catch (error) {
      const handledError = errorHandler.handleError(error, {
        context: 'payment_intent_creation',
        data
      });
      
      return {
        success: false,
        error: {
          code: handledError.code || 'payment_intent_failed',
          message: handledError.message,
          type: 'payment_error'
        }
      };
    }
  },

  /**
   * Confirm a payment intent
   */
  async confirmPaymentIntent(paymentIntentId: string): Promise<PaymentProcessingResult> {
    try {
      const { data: paymentIntent } = await supabase
        .from('payment_intents')
        .select('stripe_payment_intent_id')
        .eq('id', paymentIntentId)
        .single();

      if (!paymentIntent) {
        throw new Error('Payment intent not found');
      }

      const stripe = getStripeServer();
      const confirmed = await stripe.paymentIntents.confirm(
        paymentIntent.stripe_payment_intent_id
      );

      // Update our database
      const { data: updatedPaymentIntent, error } = await supabase
        .from('payment_intents')
        .update({
          status: confirmed.status,
          charges: confirmed.charges as any,
          succeeded_at: confirmed.status === 'succeeded' ? new Date().toISOString() : null
        })
        .eq('id', paymentIntentId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return {
        success: confirmed.status === 'succeeded',
        payment_intent: updatedPaymentIntent,
        requires_action: confirmed.status === 'requires_action',
        client_secret: confirmed.client_secret || ''
      };
    } catch (error) {
      const handledError = errorHandler.handleError(error, {
        context: 'payment_intent_confirmation',
        paymentIntentId
      });
      
      return {
        success: false,
        error: {
          code: handledError.code || 'confirmation_failed',
          message: handledError.message,
          type: 'payment_error'
        }
      };
    }
  },

  /**
   * Get payment intent by ID
   */
  async getPaymentIntent(paymentIntentId: string): Promise<PaymentIntent | null> {
    try {
      const { data: paymentIntent, error } = await supabase
        .from('payment_intents')
        .select('*')
        .eq('id', paymentIntentId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return paymentIntent;
    } catch (error) {
      throw errorHandler.handleError(error, {
        context: 'get_payment_intent',
        paymentIntentId
      });
    }
  }
};

/**
 * Subscription Management Operations
 */
export const subscriptionService = {
  /**
   * Create a new subscription
   */
  async createSubscription(data: CreateSubscriptionData): Promise<SubscriptionCreationResult> {
    try {
      const { data: customer } = await supabase
        .from('payment_customers')
        .select('stripe_customer_id, default_payment_method_id')
        .eq('id', data.customer_id)
        .single();

      if (!customer) {
        throw new Error('Customer not found');
      }

      const { data: plan } = await supabase
        .from('subscription_plans')
        .select('price_id')
        .eq('id', data.plan_id)
        .single();

      if (!plan) {
        throw new Error('Subscription plan not found');
      }

      const { data: price } = await supabase
        .from('payment_prices')
        .select('stripe_price_id')
        .eq('id', plan.price_id)
        .single();

      if (!price) {
        throw new Error('Price not found');
      }

      const stripe = getStripeServer();
      const subscription = await stripe.subscriptions.create({
        customer: customer.stripe_customer_id,
        items: [{ price: price.stripe_price_id }],
        payment_behavior: 'default_incomplete',
        payment_settings: {
          save_default_payment_method: 'on_subscription',
          payment_method_types: ['card']
        },
        expand: ['latest_invoice.payment_intent'],
        metadata: data.metadata || {}
      });

      // Store subscription in our database
      const { data: newSubscription, error } = await supabase
        .from('subscriptions')
        .insert([{
          ...data,
          stripe_subscription_id: subscription.id,
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
          trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null
        }])
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create subscription record: ${error.message}`);
      }

      const result: SubscriptionCreationResult = {
        success: true,
        subscription: newSubscription
      };

      // Handle incomplete subscriptions that require payment
      if (subscription.status === 'incomplete') {
        const invoice = subscription.latest_invoice as Stripe.Invoice;
        const paymentIntent = invoice?.payment_intent as Stripe.PaymentIntent;
        
        if (paymentIntent) {
          result.client_secret = paymentIntent.client_secret || '';
          result.requires_payment_method = paymentIntent.status === 'requires_payment_method';
        }
      }

      return result;
    } catch (error) {
      const handledError = errorHandler.handleError(error, {
        context: 'subscription_creation',
        data
      });
      
      return {
        success: false,
        error: {
          code: handledError.code || 'subscription_failed',
          message: handledError.message,
          type: 'subscription_error'
        }
      };
    }
  },

  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId: string, cancelAtPeriodEnd = true): Promise<Subscription> {
    try {
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('stripe_subscription_id')
        .eq('id', subscriptionId)
        .single();

      if (!subscription) {
        throw new Error('Subscription not found');
      }

      const stripe = getStripeServer();
      const canceledSubscription = await stripe.subscriptions.update(
        subscription.stripe_subscription_id,
        { cancel_at_period_end: cancelAtPeriodEnd }
      );

      // Update our database
      const { data: updatedSubscription, error } = await supabase
        .from('subscriptions')
        .update({
          status: canceledSubscription.status,
          cancel_at: canceledSubscription.cancel_at ? new Date(canceledSubscription.cancel_at * 1000).toISOString() : null,
          canceled_at: canceledSubscription.canceled_at ? new Date(canceledSubscription.canceled_at * 1000).toISOString() : null
        })
        .eq('id', subscriptionId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return updatedSubscription;
    } catch (error) {
      throw errorHandler.handleError(error, {
        context: 'subscription_cancellation',
        subscriptionId
      });
    }
  },

  /**
   * Get subscription with details
   */
  async getSubscription(subscriptionId: string): Promise<Subscription | null> {
    try {
      const { data: subscription, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('id', subscriptionId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return subscription;
    } catch (error) {
      throw errorHandler.handleError(error, {
        context: 'get_subscription',
        subscriptionId
      });
    }
  },

  /**
   * List customer subscriptions
   */
  async listCustomerSubscriptions(customerId: string): Promise<Subscription[]> {
    try {
      const { data: subscriptions, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return subscriptions || [];
    } catch (error) {
      throw errorHandler.handleError(error, {
        context: 'list_customer_subscriptions',
        customerId
      });
    }
  }
};

/**
 * Product and Pricing Management
 */
export const productService = {
  /**
   * Get active subscription plans
   */
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    try {
      const { data: plans, error } = await supabase
        .from('subscription_plans')
        .select(`
          *,
          price:payment_prices(*)
        `)
        .eq('is_active', true)
        .order('sort_order');

      if (error) {
        throw error;
      }

      return plans || [];
    } catch (error) {
      throw errorHandler.handleError(error, {
        context: 'get_subscription_plans'
      });
    }
  },

  /**
   * Get payment products
   */
  async getPaymentProducts(type?: string): Promise<PaymentProduct[]> {
    try {
      let query = supabase
        .from('payment_products')
        .select('*')
        .eq('is_active', true);

      if (type) {
        query = query.eq('type', type);
      }

      const { data: products, error } = await query.order('name');

      if (error) {
        throw error;
      }

      return products || [];
    } catch (error) {
      throw errorHandler.handleError(error, {
        context: 'get_payment_products',
        type
      });
    }
  }
};

/**
 * Stripe Elements configuration
 */
export const getStripeElementsOptions = (clientSecret: string): StripeElementsOptions => ({
  clientSecret,
  appearance: {
    theme: 'stripe',
    variables: {
      colorPrimary: '#0066cc',
      colorBackground: '#ffffff',
      colorText: '#1a1a1a',
      colorDanger: '#df1b41',
      fontFamily: 'Inter, system-ui, sans-serif',
      spacingUnit: '4px',
      borderRadius: '8px'
    }
  }
});

/**
 * Utility functions
 */
export const stripeUtils = {
  /**
   * Format amount in cents to display currency
   */
  formatAmount(amountInCents: number, currency = 'usd'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amountInCents / 100);
  },

  /**
   * Convert dollar amount to cents
   */
  dollarsToStripeAmount(dollars: number): number {
    return Math.round(dollars * 100);
  },

  /**
   * Convert Stripe amount (cents) to dollars
   */
  stripeAmountToDollars(cents: number): number {
    return cents / 100;
  },

  /**
   * Validate card number using Luhn algorithm
   */
  validateCardNumber(cardNumber: string): boolean {
    const num = cardNumber.replace(/\D/g, '');
    let sum = 0;
    let isEven = false;
    
    for (let i = num.length - 1; i >= 0; i--) {
      let digit = parseInt(num[i]);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0;
  },

  /**
   * Get card brand from number
   */
  getCardBrand(cardNumber: string): string {
    const num = cardNumber.replace(/\D/g, '');
    
    if (/^4/.test(num)) return 'visa';
    if (/^5[1-5]/.test(num) || /^2[2-7]/.test(num)) return 'mastercard';
    if (/^3[47]/.test(num)) return 'amex';
    if (/^6/.test(num)) return 'discover';
    
    return 'unknown';
  }
};

// Export everything as a cohesive service
export const stripeService = {
  customer: customerService,
  paymentMethod: paymentMethodService,
  payment: paymentService,
  subscription: subscriptionService,
  product: productService,
  utils: stripeUtils
};

export default stripeService;