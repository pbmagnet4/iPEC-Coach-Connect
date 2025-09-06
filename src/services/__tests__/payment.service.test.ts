/**
 * Payment Service Tests
 * 
 * Comprehensive unit tests for the payment business logic service including:
 * - Session booking with payment processing
 * - Session cancellation and refund handling
 * - Subscription management operations
 * - Revenue tracking and calculations
 * - Error handling and edge cases
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import iPECPaymentService from '../payment.service';
import { stripeService } from '../stripe.service';
import { authService } from '../auth.service';
import { supabase } from '../../lib/supabase';

// Mock dependencies
vi.mock('../stripe.service');
vi.mock('../auth.service');
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      order: vi.fn().mockReturnThis(),
    })),
  },
}));

describe('Payment Service', () => {
  const mockUser = {
    id: 'user_123',
    email: 'test@example.com',
    user_metadata: { full_name: 'Test User' }
  };

  const mockCustomer = {
    id: 'cust_123',
    user_id: 'user_123',
    stripe_customer_id: 'cus_stripe_123',
    email: 'test@example.com',
    invoice_settings: {},
    metadata: {},
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const mockSessionType = {
    id: 'st_123',
    name: 'Regular Session',
    description: 'Standard coaching session',
    duration_minutes: 60,
    price: 150,
    created_at: '2024-01-01T00:00:00Z',
  };

  const mockSession = {
    id: 'session_123',
    coach_id: 'coach_123',
    client_id: 'user_123',
    session_type_id: 'st_123',
    scheduled_at: '2024-02-01T10:00:00Z',
    duration_minutes: 60,
    status: 'scheduled' as const,
    amount_paid: 150,
    stripe_payment_intent_id: 'pi_123',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    coach: {
      id: 'coach_123',
      profile: { full_name: 'Coach Test' }
    },
    client: { full_name: 'Test User' },
    session_type: mockSessionType,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock auth service
    vi.mocked(authService.getState).mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
    } as any);
  });

  describe('Session Booking Service', () => {
    describe('bookSessionWithPayment', () => {
      const sessionData = {
        coach_id: 'coach_123',
        session_type_id: 'st_123',
        scheduled_at: '2024-02-01T10:00:00Z',
        duration_minutes: 60,
        notes: 'Test session',
      };

      it('should book session with payment successfully', async () => {
        // Mock session type lookup
        (supabase.from as any)().select().eq().single
          .mockResolvedValueOnce({ data: mockSessionType, error: null });

        // Mock customer creation
        vi.mocked(stripeService.customer.createOrGetCustomer)
          .mockResolvedValue(mockCustomer);

        // Mock session creation
        (supabase.from as any)().insert().select
          .mockResolvedValueOnce({ data: [mockSession], error: null });

        // Mock payment intent creation
        vi.mocked(stripeService.payment.createPaymentIntent).mockResolvedValue({
          success: true,
          payment_intent: {
            id: 'pi_db_123',
            stripe_payment_intent_id: 'pi_123',
            amount: 15000,
            currency: 'usd',
            status: 'requires_confirmation',
          } as any,
          client_secret: 'pi_123_secret',
        });

        // Mock session update
        (supabase.from as any)().update().eq
          .mockResolvedValue({ error: null });

        // Mock payment logging
        (supabase.from as any)().insert
          .mockResolvedValue({ error: null });

        const result = await iPECPaymentService.booking.bookSessionWithPayment(sessionData);

        expect(result.success).toBe(true);
        expect(result.session).toEqual(mockSession);
        expect(result.client_secret).toBe('pi_123_secret');
        expect(stripeService.customer.createOrGetCustomer).toHaveBeenCalledWith(
          'user_123',
          'test@example.com',
          'Test User'
        );
      });

      it('should handle session creation failure', async () => {
        // Mock session type lookup
        (supabase.from as any)().select().eq().single
          .mockResolvedValueOnce({ data: mockSessionType, error: null });

        // Mock customer creation
        vi.mocked(stripeService.customer.createOrGetCustomer)
          .mockResolvedValue(mockCustomer);

        // Mock session creation failure
        (supabase.from as any)().insert().select
          .mockResolvedValueOnce({ data: null, error: { message: 'Database error' } });

        const result = await iPECPaymentService.booking.bookSessionWithPayment(sessionData);

        expect(result.success).toBe(false);
        expect(result.error).toContain('Failed to create session');
      });

      it('should handle payment failure and cleanup session', async () => {
        // Mock session type lookup
        (supabase.from as any)().select().eq().single
          .mockResolvedValueOnce({ data: mockSessionType, error: null });

        // Mock customer creation
        vi.mocked(stripeService.customer.createOrGetCustomer)
          .mockResolvedValue(mockCustomer);

        // Mock session creation
        (supabase.from as any)().insert().select
          .mockResolvedValueOnce({ data: [mockSession], error: null });

        // Mock payment intent failure
        vi.mocked(stripeService.payment.createPaymentIntent).mockResolvedValue({
          success: false,
          error: {
            code: 'card_declined',
            message: 'Your card was declined',
            type: 'card_error'
          }
        });

        // Mock session cleanup
        (supabase.from as any)().delete().eq
          .mockResolvedValue({ error: null });

        const result = await iPECPaymentService.booking.bookSessionWithPayment(sessionData);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Your card was declined');
        // Should clean up session
        expect(supabase.from).toHaveBeenCalledWith('sessions');
      });

      it('should require authenticated user', async () => {
        vi.mocked(authService.getState).mockReturnValue({
          user: null,
          isAuthenticated: false,
        } as any);

        const result = await iPECPaymentService.booking.bookSessionWithPayment(sessionData);

        expect(result.success).toBe(false);
        expect(result.error).toBe('User must be authenticated to book sessions');
      });
    });

    describe('cancelSessionWithRefund', () => {
      const sessionId = 'session_123';

      it('should cancel session and process full refund', async () => {
        const sessionWithPayment = {
          ...mockSession,
          scheduled_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 48 hours from now
          stripe_payment_intent_id: 'pi_123',
        };

        // Mock session lookup
        (supabase.from as any)().select().eq().single
          .mockResolvedValueOnce({ data: sessionWithPayment, error: null });

        // Mock session update
        (supabase.from as any)().update().eq
          .mockResolvedValue({ error: null });

        // Mock payment intent lookup
        (supabase.from as any)().select().eq().single
          .mockResolvedValueOnce({
            data: {
              id: 'pi_db_123',
              amount: 15000,
              status: 'succeeded',
            },
            error: null
          });

        // Mock refund processing
        const mockRefund = {
          id: 'ref_123',
          payment_intent_id: 'pi_db_123',
          amount: 15000,
          status: 'succeeded',
          created_at: '2024-01-01T00:00:00Z',
        };

        vi.mocked(iPECPaymentService.core.processRefund).mockResolvedValue(mockRefund as any);

        // Mock payment logging
        (supabase.from as any)().insert
          .mockResolvedValue({ error: null });

        const result = await iPECPaymentService.booking.cancelSessionWithRefund(sessionId, 'User requested');

        expect(result.success).toBe(true);
        expect(result.refund).toEqual(mockRefund);
      });

      it('should cancel session with partial refund within 24 hours', async () => {
        const sessionWithPayment = {
          ...mockSession,
          scheduled_at: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(), // 12 hours from now
          stripe_payment_intent_id: 'pi_123',
        };

        // Mock session lookup
        (supabase.from as any)().select().eq().single
          .mockResolvedValueOnce({ data: sessionWithPayment, error: null });

        // Mock session update
        (supabase.from as any)().update().eq
          .mockResolvedValue({ error: null });

        // Mock payment intent lookup
        (supabase.from as any)().select().eq().single
          .mockResolvedValueOnce({
            data: {
              id: 'pi_db_123',
              amount: 15000,
              status: 'succeeded',
            },
            error: null
          });

        // Mock refund processing (50% refund)
        const mockRefund = {
          id: 'ref_123',
          payment_intent_id: 'pi_db_123',
          amount: 7500, // 50% refund
          status: 'succeeded',
          created_at: '2024-01-01T00:00:00Z',
        };

        vi.mocked(iPECPaymentService.core.processRefund).mockResolvedValue(mockRefund as any);

        const result = await iPECPaymentService.booking.cancelSessionWithRefund(sessionId);

        expect(result.success).toBe(true);
        expect(result.refund?.amount).toBe(7500); // 50% refund
      });

      it('should not process refund within 2 hours of session', async () => {
        const sessionWithPayment = {
          ...mockSession,
          scheduled_at: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(), // 1 hour from now
          stripe_payment_intent_id: 'pi_123',
        };

        // Mock session lookup
        (supabase.from as any)().select().eq().single
          .mockResolvedValueOnce({ data: sessionWithPayment, error: null });

        // Mock session update
        (supabase.from as any)().update().eq
          .mockResolvedValue({ error: null });

        // Mock payment intent lookup
        (supabase.from as any)().select().eq().single
          .mockResolvedValueOnce({
            data: {
              id: 'pi_db_123',
              amount: 15000,
              status: 'succeeded',
            },
            error: null
          });

        const result = await iPECPaymentService.booking.cancelSessionWithRefund(sessionId);

        expect(result.success).toBe(true);
        expect(result.refund).toBeUndefined(); // No refund processed
      });

      it('should handle unauthorized cancellation attempt', async () => {
        const unauthorizedSession = {
          ...mockSession,
          client_id: 'other_user_123', // Different user
        };

        // Mock session lookup
        (supabase.from as any)().select().eq().single
          .mockResolvedValueOnce({ data: unauthorizedSession, error: null });

        const result = await iPECPaymentService.booking.cancelSessionWithRefund(sessionId);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Unauthorized to cancel this session');
      });

      it('should handle already cancelled session', async () => {
        const cancelledSession = {
          ...mockSession,
          status: 'cancelled' as const,
        };

        // Mock session lookup
        (supabase.from as any)().select().eq().single
          .mockResolvedValueOnce({ data: cancelledSession, error: null });

        const result = await iPECPaymentService.booking.cancelSessionWithRefund(sessionId);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Session is already cancelled');
      });
    });
  });

  describe('Subscription Management Service', () => {
    describe('createSubscription', () => {
      const planId = 'plan_123';

      it('should create subscription successfully', async () => {
        // Mock customer creation
        vi.mocked(stripeService.customer.createOrGetCustomer)
          .mockResolvedValue(mockCustomer);

        // Mock plan lookup
        const mockPlan = {
          id: 'plan_123',
          name: 'Premium Plan',
          max_sessions: 8,
          is_active: true,
        };
        (supabase.from as any)().select().eq().eq().single
          .mockResolvedValueOnce({ data: mockPlan, error: null });

        // Mock subscription creation
        const subscriptionResult = {
          success: true,
          subscription: {
            id: 'sub_db_123',
            customer_id: 'cust_123',
            plan_id: 'plan_123',
            status: 'active',
            created_at: '2024-01-01T00:00:00Z',
          }
        };
        vi.mocked(stripeService.subscription.createSubscription)
          .mockResolvedValue(subscriptionResult as any);

        // Mock payment logging
        (supabase.from as any)().insert
          .mockResolvedValue({ error: null });

        const result = await iPECPaymentService.subscription.createSubscription(planId);

        expect(result.success).toBe(true);
        expect(result.subscription?.plan_id).toBe(planId);
        expect(stripeService.customer.createOrGetCustomer).toHaveBeenCalledWith(
          'user_123',
          'test@example.com',
          'Test User'
        );
      });

      it('should handle invalid plan', async () => {
        // Mock customer creation
        vi.mocked(stripeService.customer.createOrGetCustomer)
          .mockResolvedValue(mockCustomer);

        // Mock plan lookup failure
        (supabase.from as any)().select().eq().eq().single
          .mockResolvedValueOnce({ data: null, error: null });

        const result = await iPECPaymentService.subscription.createSubscription('invalid_plan');

        expect(result.success).toBe(false);
        expect(result.error?.message).toBe('Invalid subscription plan');
      });

      it('should require authentication', async () => {
        vi.mocked(authService.getState).mockReturnValue({
          user: null,
          isAuthenticated: false,
        } as any);

        const result = await iPECPaymentService.subscription.createSubscription(planId);

        expect(result.success).toBe(false);
        expect(result.error?.message).toBe('User must be authenticated to subscribe');
      });
    });

    describe('cancelSubscription', () => {
      const subscriptionId = 'sub_123';

      it('should cancel subscription successfully', async () => {
        // Mock customer lookup
        (supabase.from as any)().select().eq().single
          .mockResolvedValueOnce({ data: { id: 'cust_123' }, error: null });

        // Mock subscription lookup
        const mockSubscription = {
          id: 'sub_123',
          customer_id: 'cust_123',
          status: 'active',
        };
        (supabase.from as any)().select().eq().eq().single
          .mockResolvedValueOnce({ data: mockSubscription, error: null });

        // Mock subscription cancellation
        const cancelledSubscription = {
          ...mockSubscription,
          status: 'canceled',
          canceled_at: '2024-01-15T00:00:00Z',
        };
        vi.mocked(stripeService.subscription.cancelSubscription)
          .mockResolvedValue(cancelledSubscription as any);

        // Mock payment logging
        (supabase.from as any)().insert
          .mockResolvedValue({ error: null });

        const result = await iPECPaymentService.subscription.cancelSubscription(subscriptionId);

        expect(result.success).toBe(true);
        expect(result.subscription?.status).toBe('canceled');
      });

      it('should handle unauthorized cancellation', async () => {
        // Mock customer lookup
        (supabase.from as any)().select().eq().single
          .mockResolvedValueOnce({ data: { id: 'cust_123' }, error: null });

        // Mock subscription lookup (not found for this customer)
        (supabase.from as any)().select().eq().eq().single
          .mockResolvedValueOnce({ data: null, error: null });

        const result = await iPECPaymentService.subscription.cancelSubscription(subscriptionId);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Subscription not found or unauthorized');
      });
    });

    describe('getUserActiveSubscription', () => {
      it('should return active subscription', async () => {
        // Mock customer lookup
        (supabase.from as any)().select().eq().single
          .mockResolvedValueOnce({ data: { id: 'cust_123' }, error: null });

        // Mock subscription lookup
        const activeSubscription = {
          id: 'sub_123',
          customer_id: 'cust_123',
          status: 'active',
        };
        (supabase.from as any)().select().eq().in().single
          .mockResolvedValueOnce({ data: activeSubscription, error: null });

        const result = await iPECPaymentService.subscription.getUserActiveSubscription();

        expect(result).toEqual(activeSubscription);
      });

      it('should return null for unauthenticated user', async () => {
        vi.mocked(authService.getState).mockReturnValue({
          user: null,
          isAuthenticated: false,
        } as any);

        const result = await iPECPaymentService.subscription.getUserActiveSubscription();

        expect(result).toBeNull();
      });
    });
  });

  describe('Core Payment Service', () => {
    describe('processRefund', () => {
      it('should process refund successfully', async () => {
        const paymentIntentId = 'pi_db_123';
        const refundData = {
          amount: 7500,
          reason: 'requested_by_customer' as const,
          metadata: { reason: 'User requested cancellation' }
        };

        // Mock payment intent lookup
        const paymentIntent = {
          id: 'pi_db_123',
          stripe_payment_intent_id: 'pi_123',
          amount: 15000,
          entity_type: 'session',
          entity_id: 'session_123',
        };
        (supabase.from as any)().select().eq().single
          .mockResolvedValueOnce({ data: paymentIntent, error: null });

        // Mock revenue record lookup
        (supabase.from as any)().select().eq().single
          .mockResolvedValueOnce({ data: { coach_amount: 12000 }, error: null });

        // Mock Stripe refund (would be mocked in actual Stripe service)
        const stripeRefund = {
          id: 're_123',
          amount: 7500,
          currency: 'usd',
          reason: 'requested_by_customer',
          status: 'succeeded',
          charge: 'ch_123',
          receipt_number: 'receipt_123',
          metadata: refundData.metadata,
        };

        // Mock database insertion
        const refundRecord = {
          id: 'ref_db_123',
          payment_intent_id: paymentIntentId,
          stripe_refund_id: 're_123',
          amount: 7500,
          currency: 'usd',
          reason: 'requested_by_customer',
          status: 'succeeded',
          coach_adjustment: 6000,
          metadata: refundData.metadata,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        };
        (supabase.from as any)().insert().select().single
          .mockResolvedValueOnce({ data: refundRecord, error: null });

        const result = await iPECPaymentService.core.processRefund(paymentIntentId, refundData);

        expect(result).toEqual(refundRecord);
      });
    });

    describe('getPaymentSummary', () => {
      it('should calculate payment summary correctly', async () => {
        const userId = 'user_123';
        const periodStart = '2024-01-01T00:00:00Z';
        const periodEnd = '2024-01-31T23:59:59Z';

        // Mock customer lookup
        (supabase.from as any)().select().eq().single
          .mockResolvedValueOnce({ data: { id: 'cust_123' }, error: null });

        // Mock payment intents
        const paymentIntents = [
          { id: 'pi_1', amount: 15000, status: 'succeeded', created_at: '2024-01-15T00:00:00Z' },
          { id: 'pi_2', amount: 20000, status: 'succeeded', created_at: '2024-01-20T00:00:00Z' },
          { id: 'pi_3', amount: 10000, status: 'failed', created_at: '2024-01-25T00:00:00Z' },
        ];
        (supabase.from as any)().select().eq().gte().lte
          .mockResolvedValueOnce({ data: paymentIntents, error: null });

        // Mock refunds
        const refunds = [
          { amount: 5000 },
        ];
        (supabase.from as any)().select().in().eq
          .mockResolvedValueOnce({ data: refunds, error: null });

        const result = await iPECPaymentService.core.getPaymentSummary(userId, periodStart, periodEnd);

        expect(result.total_payments).toBe(3);
        expect(result.successful_payments).toBe(2);
        expect(result.failed_payments).toBe(1);
        expect(result.total_amount).toBe(35000); // 15000 + 20000
        expect(result.total_refunds).toBe(5000);
        expect(result.net_revenue).toBe(30000); // 35000 - 5000
      });
    });
  });
});