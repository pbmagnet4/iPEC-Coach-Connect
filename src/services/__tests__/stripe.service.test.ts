/**
 * Stripe Service Tests
 * 
 * Comprehensive unit tests for the Stripe service integration including:
 * - Customer management operations
 * - Payment method handling
 * - Payment intent processing
 * - Subscription lifecycle management
 * - Error handling and edge cases
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { stripeService, stripeUtils } from '../stripe.service';
import { supabase } from '../../lib/supabase';
import type { PaymentCustomer, PaymentIntent, PaymentMethod } from '../../types/database';

// Mock Stripe
const mockStripe = {
  customers: {
    create: vi.fn(),
    update: vi.fn(),
  },
  paymentIntents: {
    create: vi.fn(),
    confirm: vi.fn(),
  },
  setupIntents: {
    create: vi.fn(),
  },
  subscriptions: {
    create: vi.fn(),
    update: vi.fn(),
  },
  paymentMethods: {
    detach: vi.fn(),
  },
  webhooks: {
    constructEvent: vi.fn(),
  },
};

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      order: vi.fn().mockReturnThis(),
    })),
  },
}));

// Mock environment variables
vi.stubEnv('VITE_STRIPE_PUBLISHABLE_KEY', 'pk_test_123');
vi.stubEnv('VITE_STRIPE_SECRET_KEY', 'sk_test_123');

describe('StripeService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('Customer Service', () => {
    const mockCustomerData = {
      id: 'cust_123',
      user_id: 'user_123',
      stripe_customer_id: 'cus_stripe_123',
      email: 'test@example.com',
      invoice_settings: {},
      metadata: {},
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    describe('createOrGetCustomer', () => {
      it('should return existing customer if found', async () => {
        const mockSupabaseResponse = { data: mockCustomerData, error: null };
        (supabase.from as any)().select().eq().single.mockResolvedValue(mockSupabaseResponse);

        const result = await stripeService.customer.createOrGetCustomer(
          'user_123',
          'test@example.com',
          'Test User'
        );

        expect(result).toEqual(mockCustomerData);
        expect(supabase.from).toHaveBeenCalledWith('payment_customers');
      });

      it('should create new customer if not found', async () => {
        // Mock no existing customer
        (supabase.from as any)().select().eq().single
          .mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });

        // Mock Stripe customer creation
        const stripeCustomer = {
          id: 'cus_stripe_123',
          email: 'test@example.com',
          name: 'Test User',
          metadata: { user_id: 'user_123', created_by: 'ipec_coach_connect' },
        };
        mockStripe.customers.create.mockResolvedValue(stripeCustomer);

        // Mock database insertion
        (supabase.from as any)().insert().select().single
          .mockResolvedValue({ data: mockCustomerData, error: null });

        const result = await stripeService.customer.createOrGetCustomer(
          'user_123',
          'test@example.com',
          'Test User'
        );

        expect(mockStripe.customers.create).toHaveBeenCalledWith({
          email: 'test@example.com',
          name: 'Test User',
          metadata: {
            user_id: 'user_123',
            created_by: 'ipec_coach_connect'
          }
        });
        expect(result).toEqual(mockCustomerData);
      });

      it('should throw error on customer creation failure', async () => {
        (supabase.from as any)().select().eq().single
          .mockResolvedValue({ data: null, error: { code: 'PGRST116' } });

        mockStripe.customers.create.mockRejectedValue(new Error('Stripe error'));

        await expect(
          stripeService.customer.createOrGetCustomer('user_123', 'test@example.com')
        ).rejects.toThrow();
      });
    });

    describe('updateCustomer', () => {
      it('should update customer successfully', async () => {
        const updates = {
          email: 'newemail@example.com',
          name: 'New Name',
        };

        // Mock customer lookup
        (supabase.from as any)().select().eq().single
          .mockResolvedValueOnce({ data: { stripe_customer_id: 'cus_stripe_123' }, error: null });

        // Mock Stripe update
        const updatedStripeCustomer = {
          id: 'cus_stripe_123',
          email: 'newemail@example.com',
          invoice_settings: {},
          metadata: {},
        };
        mockStripe.customers.update.mockResolvedValue(updatedStripeCustomer);

        // Mock database update
        const updatedCustomer = { ...mockCustomerData, email: 'newemail@example.com' };
        (supabase.from as any)().update().eq().select().single
          .mockResolvedValue({ data: updatedCustomer, error: null });

        const result = await stripeService.customer.updateCustomer('cust_123', updates);

        expect(mockStripe.customers.update).toHaveBeenCalledWith('cus_stripe_123', updates);
        expect(result.email).toBe('newemail@example.com');
      });

      it('should throw error if customer not found', async () => {
        (supabase.from as any)().select().eq().single
          .mockResolvedValue({ data: null, error: null });

        await expect(
          stripeService.customer.updateCustomer('nonexistent', {})
        ).rejects.toThrow('Customer not found');
      });
    });
  });

  describe('Payment Method Service', () => {
    const mockPaymentMethod = {
      id: 'pm_123',
      customer_id: 'cust_123',
      stripe_payment_method_id: 'pm_stripe_123',
      type: 'card' as const,
      card_info: {
        last4: '4242',
        brand: 'visa',
        exp_month: 12,
        exp_year: 2025,
        country: 'US',
        fingerprint: 'fingerprint_123'
      },
      is_default: false,
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    describe('createSetupIntent', () => {
      it('should create setup intent successfully', async () => {
        // Mock customer lookup
        (supabase.from as any)().select().eq().single
          .mockResolvedValue({ data: { stripe_customer_id: 'cus_stripe_123' }, error: null });

        // Mock Stripe setup intent creation
        const stripeSetupIntent = {
          id: 'seti_123',
          customer: 'cus_stripe_123',
          status: 'requires_payment_method',
          client_secret: 'seti_123_secret',
          metadata: { customer_id: 'cust_123' },
        };
        mockStripe.setupIntents.create.mockResolvedValue(stripeSetupIntent);

        // Mock database insertion
        const setupIntentData = {
          id: 'setup_123',
          customer_id: 'cust_123',
          stripe_setup_intent_id: 'seti_123',
          status: 'requires_payment_method',
          usage: 'off_session',
          metadata: { customer_id: 'cust_123' },
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        };
        (supabase.from as any)().insert().select().single
          .mockResolvedValue({ data: setupIntentData, error: null });

        const result = await stripeService.paymentMethod.createSetupIntent({
          customer_id: 'cust_123',
          payment_method_type: 'card',
          return_url: 'https://example.com/return',
          usage: 'off_session',
        });

        expect(result.setup_intent).toEqual(setupIntentData);
        expect(result.client_secret).toBe('seti_123_secret');
      });
    });

    describe('listPaymentMethods', () => {
      it('should list payment methods for customer', async () => {
        const mockMethods = [mockPaymentMethod];
        (supabase.from as any)().select().eq().eq().order().order
          .mockResolvedValue({ data: mockMethods, error: null });

        const result = await stripeService.paymentMethod.listPaymentMethods('cust_123');

        expect(result).toEqual(mockMethods);
        expect(supabase.from).toHaveBeenCalledWith('payment_methods');
      });
    });

    describe('deletePaymentMethod', () => {
      it('should delete payment method successfully', async () => {
        // Mock payment method lookup
        (supabase.from as any)().select().eq().single
          .mockResolvedValue({ data: { stripe_payment_method_id: 'pm_stripe_123' }, error: null });

        // Mock Stripe detach
        mockStripe.paymentMethods.detach.mockResolvedValue({});

        // Mock database update
        (supabase.from as any)().update().eq
          .mockResolvedValue({ error: null });

        await stripeService.paymentMethod.deletePaymentMethod('pm_123');

        expect(mockStripe.paymentMethods.detach).toHaveBeenCalledWith('pm_stripe_123');
      });
    });
  });

  describe('Payment Service', () => {
    describe('createPaymentIntent', () => {
      it('should create payment intent successfully', async () => {
        // Mock customer lookup
        (supabase.from as any)().select().eq().single
          .mockResolvedValueOnce({
            data: { 
              stripe_customer_id: 'cus_stripe_123',
              default_payment_method_id: 'pm_default_123'
            },
            error: null
          });

        // Mock Stripe payment intent creation
        const stripePaymentIntent = {
          id: 'pi_123',
          amount: 2000,
          currency: 'usd',
          customer: 'cus_stripe_123',
          status: 'requires_confirmation',
          client_secret: 'pi_123_secret',
          metadata: {},
        };
        mockStripe.paymentIntents.create.mockResolvedValue(stripePaymentIntent);

        // Mock database insertion
        const paymentIntentData = {
          id: 'pi_db_123',
          customer_id: 'cust_123',
          stripe_payment_intent_id: 'pi_123',
          amount: 2000,
          currency: 'usd',
          status: 'requires_confirmation',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        };
        (supabase.from as any)().insert().select().single
          .mockResolvedValue({ data: paymentIntentData, error: null });

        const result = await stripeService.payment.createPaymentIntent({
          customer_id: 'cust_123',
          amount: 2000,
          currency: 'usd',
          description: 'Test payment',
          metadata: {},
        });

        expect(result.success).toBe(true);
        expect(result.payment_intent).toEqual(paymentIntentData);
        expect(result.client_secret).toBe('pi_123_secret');
      });

      it('should handle payment intent creation errors', async () => {
        (supabase.from as any)().select().eq().single
          .mockResolvedValue({ data: null, error: null });

        const result = await stripeService.payment.createPaymentIntent({
          customer_id: 'nonexistent',
          amount: 2000,
          currency: 'usd',
          description: 'Test payment',
          metadata: {},
        });

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      });
    });
  });

  describe('Subscription Service', () => {
    describe('createSubscription', () => {
      it('should create subscription successfully', async () => {
        // Mock customer lookup
        (supabase.from as any)().select().eq().single
          .mockResolvedValueOnce({
            data: { 
              stripe_customer_id: 'cus_stripe_123',
              default_payment_method_id: 'pm_default_123'
            },
            error: null
          })
          // Mock plan lookup
          .mockResolvedValueOnce({
            data: { price_id: 'price_123' },
            error: null
          })
          // Mock price lookup
          .mockResolvedValueOnce({
            data: { stripe_price_id: 'price_stripe_123' },
            error: null
          });

        // Mock Stripe subscription creation
        const stripeSubscription = {
          id: 'sub_123',
          customer: 'cus_stripe_123',
          status: 'active',
          current_period_start: Math.floor(Date.now() / 1000),
          current_period_end: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
          items: { data: [{ price: { id: 'price_stripe_123' } }] },
          latest_invoice: null,
          metadata: {},
        };
        mockStripe.subscriptions.create.mockResolvedValue(stripeSubscription);

        // Mock database insertion
        const subscriptionData = {
          id: 'sub_db_123',
          customer_id: 'cust_123',
          stripe_subscription_id: 'sub_123',
          plan_id: 'plan_123',
          status: 'active',
          current_period_start: '2024-01-01T00:00:00Z',
          current_period_end: '2024-01-31T00:00:00Z',
          sessions_used: 0,
          metadata: {},
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        };
        (supabase.from as any)().insert().select().single
          .mockResolvedValue({ data: subscriptionData, error: null });

        const result = await stripeService.subscription.createSubscription({
          customer_id: 'cust_123',
          plan_id: 'plan_123',
          status: 'active',
          current_period_start: '2024-01-01T00:00:00Z',
          current_period_end: '2024-01-31T00:00:00Z',
          sessions_used: 0,
          metadata: {},
        });

        expect(result.success).toBe(true);
        expect(result.subscription).toEqual(subscriptionData);
      });
    });
  });

  describe('Utils', () => {
    describe('formatAmount', () => {
      it('should format USD amounts correctly', () => {
        expect(stripeUtils.formatAmount(2000, 'usd')).toBe('$20.00');
        expect(stripeUtils.formatAmount(1050, 'usd')).toBe('$10.50');
        expect(stripeUtils.formatAmount(100, 'usd')).toBe('$1.00');
      });

      it('should format other currencies correctly', () => {
        expect(stripeUtils.formatAmount(2000, 'eur')).toBe('€20.00');
        expect(stripeUtils.formatAmount(2000, 'gbp')).toBe('£20.00');
      });
    });

    describe('dollarsToStripeAmount', () => {
      it('should convert dollars to cents correctly', () => {
        expect(stripeUtils.dollarsToStripeAmount(20.00)).toBe(2000);
        expect(stripeUtils.dollarsToStripeAmount(10.50)).toBe(1050);
        expect(stripeUtils.dollarsToStripeAmount(1.23)).toBe(123);
      });

      it('should handle floating point precision issues', () => {
        expect(stripeUtils.dollarsToStripeAmount(9.99)).toBe(999);
        expect(stripeUtils.dollarsToStripeAmount(0.01)).toBe(1);
      });
    });

    describe('stripeAmountToDollars', () => {
      it('should convert cents to dollars correctly', () => {
        expect(stripeUtils.stripeAmountToDollars(2000)).toBe(20.00);
        expect(stripeUtils.stripeAmountToDollars(1050)).toBe(10.50);
        expect(stripeUtils.stripeAmountToDollars(123)).toBe(1.23);
      });
    });

    describe('validateCardNumber', () => {
      it('should validate valid card numbers', () => {
        // Visa test card
        expect(stripeUtils.validateCardNumber('4242424242424242')).toBe(true);
        // With spaces
        expect(stripeUtils.validateCardNumber('4242 4242 4242 4242')).toBe(true);
        // With dashes
        expect(stripeUtils.validateCardNumber('4242-4242-4242-4242')).toBe(true);
      });

      it('should reject invalid card numbers', () => {
        expect(stripeUtils.validateCardNumber('1234567890123456')).toBe(false);
        expect(stripeUtils.validateCardNumber('4242424242424241')).toBe(false);
        expect(stripeUtils.validateCardNumber('')).toBe(false);
      });
    });

    describe('getCardBrand', () => {
      it('should identify card brands correctly', () => {
        expect(stripeUtils.getCardBrand('4242424242424242')).toBe('visa');
        expect(stripeUtils.getCardBrand('5555555555554444')).toBe('mastercard');
        expect(stripeUtils.getCardBrand('378282246310005')).toBe('amex');
        expect(stripeUtils.getCardBrand('6011111111111117')).toBe('discover');
        expect(stripeUtils.getCardBrand('1234567890123456')).toBe('unknown');
      });
    });
  });
});