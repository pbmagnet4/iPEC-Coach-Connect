/**
 * Payment Service - Business Logic Layer
 * 
 * This service provides high-level payment operations for the iPEC Coach Connect platform:
 * - Session booking with payment processing
 * - Subscription management and billing
 * - Revenue tracking and coach payouts
 * - Refund processing
 * - Payment analytics and reporting
 * 
 * Integrates with Stripe service for actual payment processing
 */

import type {
  PaymentCustomer,
  PaymentIntent,
  Subscription,
  SubscriptionPlan,
  RevenueRecord,
  Refund,
  PaymentSummary,
  CoachPayoutSummary,
  PaymentProcessingResult,
  SubscriptionCreationResult,
  SessionWithDetails,
  CoachWithProfile,
  CreatePaymentProcessingLogData
} from '../types/database';
import { stripeService } from './stripe.service';
import { authService } from './auth.service';
import { supabase } from '../lib/supabase';
import { errorHandler } from '../lib/error-handling';

/**
 * Session Booking and Payment Operations
 */
export const sessionBookingService = {
  /**
   * Book a coaching session with payment processing
   */
  async bookSessionWithPayment(sessionData: {
    coach_id: string;
    session_type_id: string;
    scheduled_at: string;
    duration_minutes: number;
    notes?: string;
    payment_method_id?: string;
  }): Promise<{
    success: boolean;
    session?: SessionWithDetails;
    payment_intent?: PaymentIntent;
    client_secret?: string;
    error?: string;
  }> {
    try {
      const currentUser = authService.getState().user;
      if (!currentUser) {
        throw new Error('User must be authenticated to book sessions');
      }

      // Get session type and pricing
      const { data: sessionType, error: sessionTypeError } = await supabase
        .from('session_types')
        .select('*')
        .eq('id', sessionData.session_type_id)
        .single();

      if (sessionTypeError || !sessionType) {
        throw new Error('Invalid session type');
      }

      // Create or get customer
      const customer = await stripeService.customer.createOrGetCustomer(
        currentUser.id,
        currentUser.email || '',
        currentUser.user_metadata?.full_name
      );

      // Create the session record first
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .insert([{
          coach_id: sessionData.coach_id,
          client_id: currentUser.id,
          session_type_id: sessionData.session_type_id,
          scheduled_at: sessionData.scheduled_at,
          duration_minutes: sessionData.duration_minutes,
          notes: sessionData.notes,
          status: 'scheduled',
          amount_paid: sessionType.price
        }])
        .select(`
          *,
          coach:coaches(
            *,
            profile:profiles(*)
          ),
          client:profiles(*),
          session_type:session_types(*)
        `)
        .single();

      if (sessionError) {
        throw new Error(`Failed to create session: ${sessionError.message}`);
      }

      // Process payment
      const paymentResult = await stripeService.payment.createPaymentIntent({
        customer_id: customer.id,
        amount: stripeService.utils.dollarsToStripeAmount(sessionType.price),
        currency: 'usd',
        description: `Coaching Session: ${sessionType.name}`,
        receipt_email: currentUser.email,
        entity_type: 'session',
        entity_id: session.id,
        payment_method_id: sessionData.payment_method_id,
        metadata: {
          coach_id: sessionData.coach_id,
          client_id: currentUser.id,
          session_type: sessionType.name
        }
      });

      if (!paymentResult.success) {
        // Clean up the session if payment failed
        await supabase
          .from('sessions')
          .delete()
          .eq('id', session.id);

        return {
          success: false,
          error: paymentResult.error?.message || 'Payment processing failed'
        };
      }

      // Update session with payment intent ID
      if (paymentResult.payment_intent) {
        await supabase
          .from('sessions')
          .update({
            stripe_payment_intent_id: paymentResult.payment_intent.stripe_payment_intent_id
          })
          .eq('id', session.id);
      }

      // Log the payment processing
      await paymentService.logPaymentEvent({
        payment_intent_id: paymentResult.payment_intent?.id,
        event_type: 'session_booking_payment_created',
        status: 'success',
        message: 'Payment intent created for session booking',
        user_id: currentUser.id,
        request_data: sessionData
      });

      return {
        success: true,
        session: session as SessionWithDetails,
        payment_intent: paymentResult.payment_intent,
        client_secret: paymentResult.client_secret
      };

    } catch (error) {
      const handledError = errorHandler.handleError(error, {
        context: 'session_booking_payment',
        sessionData
      });

      return {
        success: false,
        error: handledError.message
      };
    }
  },

  /**
   * Cancel a session and process refund if applicable
   */
  async cancelSessionWithRefund(sessionId: string, refundReason?: string): Promise<{
    success: boolean;
    refund?: Refund;
    error?: string;
  }> {
    try {
      const currentUser = authService.getState().user;
      if (!currentUser) {
        throw new Error('User must be authenticated');
      }

      // Get session with payment details
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .select(`
          *,
          coach:coaches(*),
          client:profiles(*)
        `)
        .eq('id', sessionId)
        .single();

      if (sessionError || !session) {
        throw new Error('Session not found');
      }

      // Check if user can cancel this session
      if (session.client_id !== currentUser.id && session.coach_id !== currentUser.id) {
        throw new Error('Unauthorized to cancel this session');
      }

      // Check if session can be cancelled (e.g., not already completed)
      if (session.status === 'completed') {
        throw new Error('Cannot cancel a completed session');
      }

      if (session.status === 'cancelled') {
        throw new Error('Session is already cancelled');
      }

      // Update session status
      await supabase
        .from('sessions')
        .update({
          status: 'cancelled',
          notes: `${session.notes || ''}\nCancelled: ${new Date().toISOString()}`
        })
        .eq('id', sessionId);

      // Process refund if payment was made
      let refund: Refund | undefined;
      if (session.stripe_payment_intent_id) {
        const { data: paymentIntent } = await supabase
          .from('payment_intents')
          .select('*')
          .eq('stripe_payment_intent_id', session.stripe_payment_intent_id)
          .single();

        if (paymentIntent && paymentIntent.status === 'succeeded') {
          // Calculate refund amount based on cancellation timing
          const sessionDate = new Date(session.scheduled_at);
          const now = new Date();
          const hoursUntilSession = (sessionDate.getTime() - now.getTime()) / (1000 * 60 * 60);

          let refundAmount = paymentIntent.amount;
          if (hoursUntilSession < 24) {
            // 50% refund for cancellations within 24 hours
            refundAmount = Math.round(paymentIntent.amount * 0.5);
          }

          if (hoursUntilSession < 2) {
            // No refund for cancellations within 2 hours
            refundAmount = 0;
          }

          if (refundAmount > 0) {
            refund = await paymentService.processRefund(paymentIntent.id, {
              amount: refundAmount,
              reason: 'requested_by_customer',
              metadata: {
                session_id: sessionId,
                cancellation_reason: refundReason || 'Session cancelled by user'
              }
            });
          }
        }
      }

      // Log the cancellation
      await paymentService.logPaymentEvent({
        event_type: 'session_cancelled',
        status: 'success',
        message: `Session cancelled by ${currentUser.id === session.client_id ? 'client' : 'coach'}`,
        user_id: currentUser.id,
        request_data: { sessionId, refundReason }
      });

      return {
        success: true,
        refund
      };

    } catch (error) {
      const handledError = errorHandler.handleError(error, {
        context: 'session_cancellation',
        sessionId,
        refundReason
      });

      return {
        success: false,
        error: handledError.message
      };
    }
  }
};

/**
 * Subscription Management Operations
 */
export const subscriptionManagementService = {
  /**
   * Subscribe user to a coaching plan
   */
  async createSubscription(planId: string, paymentMethodId?: string): Promise<SubscriptionCreationResult> {
    try {
      const currentUser = authService.getState().user;
      if (!currentUser) {
        throw new Error('User must be authenticated to subscribe');
      }

      // Get or create customer
      const customer = await stripeService.customer.createOrGetCustomer(
        currentUser.id,
        currentUser.email || '',
        currentUser.user_metadata?.full_name
      );

      // Get subscription plan
      const { data: plan, error: planError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', planId)
        .eq('is_active', true)
        .single();

      if (planError || !plan) {
        throw new Error('Invalid subscription plan');
      }

      // Create subscription
      const result = await stripeService.subscription.createSubscription({
        customer_id: customer.id,
        plan_id: planId,
        status: 'incomplete',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        sessions_used: 0,
        sessions_limit: plan.max_sessions,
        metadata: {
          plan_name: plan.name,
          user_id: currentUser.id
        }
      });

      if (result.success) {
        await paymentService.logPaymentEvent({
          subscription_id: result.subscription?.id,
          event_type: 'subscription_created',
          status: 'success',
          message: `User subscribed to ${plan.name}`,
          user_id: currentUser.id,
          request_data: { planId, paymentMethodId }
        });
      }

      return result;

    } catch (error) {
      const handledError = errorHandler.handleError(error, {
        context: 'subscription_creation',
        planId,
        paymentMethodId
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
   * Cancel user subscription
   */
  async cancelSubscription(subscriptionId: string, cancelAtPeriodEnd: boolean = true): Promise<{
    success: boolean;
    subscription?: Subscription;
    error?: string;
  }> {
    try {
      const currentUser = authService.getState().user;
      if (!currentUser) {
        throw new Error('User must be authenticated');
      }

      // Verify user owns this subscription
      const { data: customer } = await supabase
        .from('payment_customers')
        .select('id')
        .eq('user_id', currentUser.id)
        .single();

      if (!customer) {
        throw new Error('Customer not found');
      }

      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('id', subscriptionId)
        .eq('customer_id', customer.id)
        .single();

      if (!subscription) {
        throw new Error('Subscription not found or unauthorized');
      }

      const updatedSubscription = await stripeService.subscription.cancelSubscription(
        subscriptionId,
        cancelAtPeriodEnd
      );

      await paymentService.logPaymentEvent({
        subscription_id: subscriptionId,
        event_type: 'subscription_cancelled',
        status: 'success',
        message: `Subscription cancelled (at period end: ${cancelAtPeriodEnd})`,
        user_id: currentUser.id,
        request_data: { subscriptionId, cancelAtPeriodEnd }
      });

      return {
        success: true,
        subscription: updatedSubscription
      };

    } catch (error) {
      const handledError = errorHandler.handleError(error, {
        context: 'subscription_cancellation',
        subscriptionId,
        cancelAtPeriodEnd
      });

      return {
        success: false,
        error: handledError.message
      };
    }
  },

  /**
   * Get user's active subscription
   */
  async getUserActiveSubscription(): Promise<Subscription | null> {
    try {
      const currentUser = authService.getState().user;
      if (!currentUser) {
        return null;
      }

      const { data: customer } = await supabase
        .from('payment_customers')
        .select('id')
        .eq('user_id', currentUser.id)
        .single();

      if (!customer) {
        return null;
      }

      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('customer_id', customer.id)
        .in('status', ['active', 'trialing'])
        .single();

      return subscription;

    } catch (error) {
      errorHandler.handleError(error, {
        context: 'get_user_active_subscription'
      });
      return null;
    }
  }
};

/**
 * Core Payment Service Operations
 */
export const paymentService = {
  /**
   * Process a refund
   */
  async processRefund(paymentIntentId: string, refundData: {
    amount?: number;
    reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
    metadata?: Record<string, any>;
  }): Promise<Refund> {
    try {
      const { data: paymentIntent } = await supabase
        .from('payment_intents')
        .select('*')
        .eq('id', paymentIntentId)
        .single();

      if (!paymentIntent) {
        throw new Error('Payment intent not found');
      }

      // Create refund in Stripe
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntent.stripe_payment_intent_id,
        amount: refundData.amount,
        reason: refundData.reason,
        metadata: refundData.metadata
      });

      // Calculate coach adjustment
      let coachAdjustment = 0;
      if (paymentIntent.entity_type === 'session') {
        const { data: revenueRecord } = await supabase
          .from('revenue_records')
          .select('coach_amount')
          .eq('payment_intent_id', paymentIntentId)
          .single();

        if (revenueRecord) {
          const refundRatio = (refundData.amount || paymentIntent.amount) / paymentIntent.amount;
          coachAdjustment = Math.round(revenueRecord.coach_amount * refundRatio);
        }
      }

      // Store refund in our database
      const { data: newRefund, error } = await supabase
        .from('refunds')
        .insert([{
          payment_intent_id: paymentIntentId,
          stripe_refund_id: refund.id,
          amount: refund.amount,
          currency: refund.currency,
          reason: refund.reason,
          status: refund.status,
          charge_id: refund.charge,
          receipt_number: refund.receipt_number,
          coach_adjustment: coachAdjustment,
          metadata: refund.metadata || {}
        }])
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create refund record: ${error.message}`);
      }

      return newRefund;

    } catch (error) {
      throw errorHandler.handleError(error, {
        context: 'refund_processing',
        paymentIntentId,
        refundData
      });
    }
  },

  /**
   * Log payment-related events
   */
  async logPaymentEvent(logData: CreatePaymentProcessingLogData): Promise<void> {
    try {
      await supabase
        .from('payment_processing_log')
        .insert([logData]);
    } catch (error) {
      // Don't throw errors for logging failures to avoid breaking payment flows
      console.error('Failed to log payment event:', error);
    }
  },

  /**
   * Get payment summary for a user
   */
  async getPaymentSummary(userId: string, periodStart: string, periodEnd: string): Promise<PaymentSummary> {
    try {
      const { data: customer } = await supabase
        .from('payment_customers')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (!customer) {
        throw new Error('Customer not found');
      }

      const { data: paymentIntents } = await supabase
        .from('payment_intents')
        .select('amount, status, created_at')
        .eq('customer_id', customer.id)
        .gte('created_at', periodStart)
        .lte('created_at', periodEnd);

      const { data: refunds } = await supabase
        .from('refunds')
        .select('amount')
        .in('payment_intent_id', (paymentIntents || []).map(p => p.id))
        .eq('status', 'succeeded');

      const totalPayments = paymentIntents?.length || 0;
      const successfulPayments = paymentIntents?.filter(p => p.status === 'succeeded').length || 0;
      const failedPayments = totalPayments - successfulPayments;
      const totalAmount = paymentIntents?.filter(p => p.status === 'succeeded').reduce((sum, p) => sum + p.amount, 0) || 0;
      const totalRefunds = refunds?.reduce((sum, r) => sum + r.amount, 0) || 0;

      return {
        total_payments: totalPayments,
        successful_payments: successfulPayments,
        failed_payments: failedPayments,
        total_amount: totalAmount,
        total_refunds: totalRefunds,
        net_revenue: totalAmount - totalRefunds,
        currency: 'usd',
        period_start: periodStart,
        period_end: periodEnd
      };

    } catch (error) {
      throw errorHandler.handleError(error, {
        context: 'get_payment_summary',
        userId,
        periodStart,
        periodEnd
      });
    }
  },

  /**
   * Get coach payout summary
   */
  async getCoachPayoutSummary(coachId: string, periodStart: string, periodEnd: string): Promise<CoachPayoutSummary> {
    try {
      const { data: revenueRecords } = await supabase
        .from('revenue_records')
        .select('*')
        .eq('coach_id', coachId)
        .gte('processed_at', periodStart)
        .lte('processed_at', periodEnd);

      if (!revenueRecords) {
        return {
          coach_id: coachId,
          pending_amount: 0,
          processing_amount: 0,
          paid_amount: 0,
          total_sessions: 0,
          total_revenue: 0,
          currency: 'usd',
          period_start: periodStart,
          period_end: periodEnd
        };
      }

      const pendingAmount = revenueRecords
        .filter(r => r.coach_payout_status === 'pending')
        .reduce((sum, r) => sum + r.coach_amount, 0);

      const processingAmount = revenueRecords
        .filter(r => r.coach_payout_status === 'processing')
        .reduce((sum, r) => sum + r.coach_amount, 0);

      const paidAmount = revenueRecords
        .filter(r => r.coach_payout_status === 'paid')
        .reduce((sum, r) => sum + r.coach_amount, 0);

      const totalRevenue = revenueRecords.reduce((sum, r) => sum + r.coach_amount, 0);

      return {
        coach_id: coachId,
        pending_amount: pendingAmount,
        processing_amount: processingAmount,
        paid_amount: paidAmount,
        total_sessions: revenueRecords.length,
        total_revenue: totalRevenue,
        currency: 'usd',
        period_start: periodStart,
        period_end: periodEnd
      };

    } catch (error) {
      throw errorHandler.handleError(error, {
        context: 'get_coach_payout_summary',
        coachId,
        periodStart,
        periodEnd
      });
    }
  }
};

// Main payment service export
export const iPECPaymentService = {
  booking: sessionBookingService,
  subscription: subscriptionManagementService,
  core: paymentService
};

export default iPECPaymentService;