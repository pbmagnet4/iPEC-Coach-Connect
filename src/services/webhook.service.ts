/**
 * Webhook Service - Stripe Webhook Processing
 * 
 * This service handles incoming Stripe webhook events with:
 * - Secure signature verification
 * - Idempotent event processing
 * - Comprehensive error handling and retry logic
 * - Database synchronization with Stripe state
 * - Revenue tracking and coach payout calculations
 * 
 * Follows Stripe webhook security best practices
 */

import Stripe from 'stripe';
import type {
  WebhookEvent,
  PaymentIntent,
  Subscription,
  PaymentCustomer,
  PaymentMethod,
  Invoice,
  RevenueRecord,
  WebhookProcessingResult,
  CreateWebhookEventData,
  CreatePaymentProcessingLogData,
  CreateRevenueRecordData
} from '../types/database';
import { supabase } from '../lib/supabase';
import { errorHandler } from '../lib/error-handling';

// Stripe webhook endpoint secret
const WEBHOOK_SECRET = import.meta.env.VITE_STRIPE_WEBHOOK_SECRET;

if (!WEBHOOK_SECRET) {
  throw new Error('Missing VITE_STRIPE_WEBHOOK_SECRET environment variable');
}

// Stripe instance for webhook processing
const stripe = new Stripe(import.meta.env.VITE_STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia',
  typescript: true,
});

/**
 * Core Webhook Processing Functions
 */
export const webhookProcessor = {
  /**
   * Verify webhook signature and construct event
   */
  constructEvent(payload: string, signature: string): Stripe.Event {
    try {
      return stripe.webhooks.constructEvent(payload, signature, WEBHOOK_SECRET);
    } catch (error) {
      throw new Error(`Webhook signature verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Store webhook event for processing
   */
  async storeWebhookEvent(stripeEvent: Stripe.Event): Promise<WebhookEvent> {
    try {
      const webhookData: CreateWebhookEventData = {
        stripe_event_id: stripeEvent.id,
        event_type: stripeEvent.type,
        api_version: stripeEvent.api_version,
        livemode: stripeEvent.livemode,
        data: stripeEvent.data as any,
        request_id: stripeEvent.request?.id,
        idempotency_key: stripeEvent.request?.idempotency_key
      };

      const { data: webhookEvent, error } = await supabase
        .from('webhook_events')
        .upsert([webhookData], { 
          onConflict: 'stripe_event_id',
          ignoreDuplicates: true 
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to store webhook event: ${error.message}`);
      }

      return webhookEvent;
    } catch (error) {
      throw errorHandler.handleError(error, {
        context: 'store_webhook_event',
        stripeEventId: stripeEvent.id,
        eventType: stripeEvent.type
      });
    }
  },

  /**
   * Mark webhook event as processed
   */
  async markEventProcessed(eventId: string, error?: string): Promise<void> {
    try {
      await supabase
        .from('webhook_events')
        .update({
          processed: !error,
          processed_at: new Date().toISOString(),
          processing_error: error || null,
          retry_count: error ? { increment: 1 } as any : 0
        })
        .eq('id', eventId);
    } catch (err) {
      console.error('Failed to mark event as processed:', err);
    }
  }
};

/**
 * Event Handlers for Different Stripe Events
 */
export const eventHandlers = {
  /**
   * Handle payment intent events
   */
  async handlePaymentIntentEvent(event: Stripe.Event): Promise<WebhookProcessingResult> {
    try {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      
      // Find our payment intent record
      const { data: localPaymentIntent, error } = await supabase
        .from('payment_intents')
        .select('*')
        .eq('stripe_payment_intent_id', paymentIntent.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!localPaymentIntent) {
        console.warn(`Payment intent ${paymentIntent.id} not found in local database`);
        return { success: true, processed: false };
      }

      // Update payment intent status
      const updates: any = {
        status: paymentIntent.status,
        charges: paymentIntent.charges as any,
        metadata: paymentIntent.metadata
      };

      if (paymentIntent.status === 'succeeded') {
        updates.succeeded_at = new Date(paymentIntent.created * 1000).toISOString();
        
        // Create revenue record for successful payments
        await eventHandlers.createRevenueRecord(localPaymentIntent, paymentIntent);
        
        // Update related entity (session, etc.)
        if (localPaymentIntent.entity_type === 'session') {
          await supabase
            .from('sessions')
            .update({ 
              status: 'scheduled',
              amount_paid: paymentIntent.amount / 100 // Convert from cents
            })
            .eq('id', localPaymentIntent.entity_id);
        }
      } else if (paymentIntent.status === 'canceled') {
        updates.canceled_at = new Date().toISOString();
        
        // Update related entity
        if (localPaymentIntent.entity_type === 'session') {
          await supabase
            .from('sessions')
            .update({ status: 'cancelled' })
            .eq('id', localPaymentIntent.entity_id);
        }
      }

      await supabase
        .from('payment_intents')
        .update(updates)
        .eq('id', localPaymentIntent.id);

      // Log the event
      await eventHandlers.logWebhookEvent({
        payment_intent_id: localPaymentIntent.id,
        event_type: event.type,
        status: 'success',
        message: `Payment intent ${paymentIntent.status}`,
        stripe_event_id: event.id
      });

      return {
        success: true,
        processed: true,
        updated_entities: {
          payment_intents: [localPaymentIntent.id]
        }
      };

    } catch (error) {
      const handledError = errorHandler.handleError(error, {
        context: 'payment_intent_webhook',
        eventType: event.type,
        paymentIntentId: (event.data.object as Stripe.PaymentIntent).id
      });

      await eventHandlers.logWebhookEvent({
        event_type: event.type,
        status: 'error',
        message: handledError.message,
        stripe_event_id: event.id,
        error_data: { error: handledError }
      });

      return {
        success: false,
        processed: false,
        error: handledError.message
      };
    }
  },

  /**
   * Handle subscription events
   */
  async handleSubscriptionEvent(event: Stripe.Event): Promise<WebhookProcessingResult> {
    try {
      const subscription = event.data.object as Stripe.Subscription;
      
      // Find our subscription record
      const { data: localSubscription, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('stripe_subscription_id', subscription.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!localSubscription) {
        console.warn(`Subscription ${subscription.id} not found in local database`);
        return { success: true, processed: false };
      }

      // Update subscription status and periods
      const updates: any = {
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
        trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
        cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null,
        canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
        ended_at: subscription.ended_at ? new Date(subscription.ended_at * 1000).toISOString() : null,
        metadata: subscription.metadata
      };

      // Reset session usage on new billing period
      if (event.type === 'invoice.payment_succeeded') {
        updates.sessions_used = 0;
      }

      await supabase
        .from('subscriptions')
        .update(updates)
        .eq('id', localSubscription.id);

      // Log the event
      await eventHandlers.logWebhookEvent({
        subscription_id: localSubscription.id,
        event_type: event.type,
        status: 'success',
        message: `Subscription ${subscription.status}`,
        stripe_event_id: event.id
      });

      return {
        success: true,
        processed: true,
        updated_entities: {
          subscriptions: [localSubscription.id]
        }
      };

    } catch (error) {
      const handledError = errorHandler.handleError(error, {
        context: 'subscription_webhook',
        eventType: event.type,
        subscriptionId: (event.data.object as Stripe.Subscription).id
      });

      await eventHandlers.logWebhookEvent({
        event_type: event.type,
        status: 'error',
        message: handledError.message,
        stripe_event_id: event.id,
        error_data: { error: handledError }
      });

      return {
        success: false,
        processed: false,
        error: handledError.message
      };
    }
  },

  /**
   * Handle customer events
   */
  async handleCustomerEvent(event: Stripe.Event): Promise<WebhookProcessingResult> {
    try {
      const customer = event.data.object as Stripe.Customer;
      
      // Find our customer record
      const { data: localCustomer, error } = await supabase
        .from('payment_customers')
        .select('*')
        .eq('stripe_customer_id', customer.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!localCustomer) {
        console.warn(`Customer ${customer.id} not found in local database`);
        return { success: true, processed: false };
      }

      // Update customer information
      await supabase
        .from('payment_customers')
        .update({
          email: customer.email,
          default_payment_method_id: customer.invoice_settings.default_payment_method,
          invoice_settings: customer.invoice_settings as any,
          metadata: customer.metadata
        })
        .eq('id', localCustomer.id);

      return {
        success: true,
        processed: true,
        updated_entities: {
          customers: [localCustomer.id]
        }
      };

    } catch (error) {
      const handledError = errorHandler.handleError(error, {
        context: 'customer_webhook',
        eventType: event.type,
        customerId: (event.data.object as Stripe.Customer).id
      });

      return {
        success: false,
        processed: false,
        error: handledError.message
      };
    }
  },

  /**
   * Handle payment method events
   */
  async handlePaymentMethodEvent(event: Stripe.Event): Promise<WebhookProcessingResult> {
    try {
      const paymentMethod = event.data.object as Stripe.PaymentMethod;
      
      if (event.type === 'payment_method.attached') {
        // Store new payment method
        const { data: customer } = await supabase
          .from('payment_customers')
          .select('id')
          .eq('stripe_customer_id', paymentMethod.customer as string)
          .single();

        if (customer) {
          await supabase
            .from('payment_methods')
            .upsert([{
              customer_id: customer.id,
              stripe_payment_method_id: paymentMethod.id,
              type: paymentMethod.type as any,
              card_info: paymentMethod.card ? {
                last4: paymentMethod.card.last4,
                brand: paymentMethod.card.brand,
                exp_month: paymentMethod.card.exp_month,
                exp_year: paymentMethod.card.exp_year,
                country: paymentMethod.card.country,
                fingerprint: paymentMethod.card.fingerprint
              } : undefined,
              billing_details: paymentMethod.billing_details as any,
              is_default: false,
              is_active: true
            }], { 
              onConflict: 'stripe_payment_method_id',
              ignoreDuplicates: false 
            });
        }
      }

      return {
        success: true,
        processed: true
      };

    } catch (error) {
      const handledError = errorHandler.handleError(error, {
        context: 'payment_method_webhook',
        eventType: event.type,
        paymentMethodId: (event.data.object as Stripe.PaymentMethod).id
      });

      return {
        success: false,
        processed: false,
        error: handledError.message
      };
    }
  },

  /**
   * Handle invoice events
   */
  async handleInvoiceEvent(event: Stripe.Event): Promise<WebhookProcessingResult> {
    try {
      const invoice = event.data.object as Stripe.Invoice;
      
      // Store or update invoice
      await supabase
        .from('invoices')
        .upsert([{
          stripe_invoice_id: invoice.id,
          customer_id: '', // We'll need to resolve this from the stripe customer ID
          subscription_id: invoice.subscription ? '' : null, // Resolve subscription ID
          invoice_number: invoice.number,
          status: invoice.status,
          subtotal: invoice.subtotal,
          tax: invoice.tax || 0,
          total: invoice.total,
          amount_paid: invoice.amount_paid,
          amount_due: invoice.amount_due,
          currency: invoice.currency,
          due_date: invoice.due_date ? new Date(invoice.due_date * 1000).toISOString() : null,
          period_start: invoice.period_start ? new Date(invoice.period_start * 1000).toISOString() : null,
          period_end: invoice.period_end ? new Date(invoice.period_end * 1000).toISOString() : null,
          paid_at: invoice.status_transitions.paid_at ? new Date(invoice.status_transitions.paid_at * 1000).toISOString() : null,
          voided_at: invoice.status_transitions.voided_at ? new Date(invoice.status_transitions.voided_at * 1000).toISOString() : null,
          hosted_invoice_url: invoice.hosted_invoice_url,
          invoice_pdf: invoice.invoice_pdf,
          receipt_number: invoice.receipt_number,
          metadata: invoice.metadata
        }], { 
          onConflict: 'stripe_invoice_id',
          ignoreDuplicates: false 
        });

      return {
        success: true,
        processed: true
      };

    } catch (error) {
      const handledError = errorHandler.handleError(error, {
        context: 'invoice_webhook',
        eventType: event.type,
        invoiceId: (event.data.object as Stripe.Invoice).id
      });

      return {
        success: false,
        processed: false,
        error: handledError.message
      };
    }
  },

  /**
   * Create revenue record for successful payment
   */
  async createRevenueRecord(paymentIntent: PaymentIntent, stripePaymentIntent: Stripe.PaymentIntent): Promise<void> {
    try {
      // Get coach revenue share based on entity type
      let coachRevenueShare = 80.00; // Default
      let coachId: string | null = null;

      if (paymentIntent.entity_type === 'session') {
        const { data: session } = await supabase
          .from('sessions')
          .select('coach_id')
          .eq('id', paymentIntent.entity_id)
          .single();
        
        if (session) {
          coachId = session.coach_id;
        }
      }

      // Calculate revenue split
      const grossAmount = stripePaymentIntent.amount;
      const stripeFee = Math.round(grossAmount * 0.029) + 30; // Stripe fee: 2.9% + $0.30
      const netAmount = grossAmount - stripeFee;
      const coachAmount = Math.round(netAmount * (coachRevenueShare / 100));
      const platformFee = netAmount - coachAmount;

      const revenueData: CreateRevenueRecordData = {
        payment_intent_id: paymentIntent.id,
        gross_amount: grossAmount,
        platform_fee: platformFee,
        coach_amount: coachAmount,
        stripe_fee: stripeFee,
        net_amount: platformFee,
        coach_id: coachId,
        coach_payout_status: 'pending',
        entity_type: paymentIntent.entity_type || 'unknown',
        entity_id: paymentIntent.entity_id || '',
        currency: stripePaymentIntent.currency
      };

      await supabase
        .from('revenue_records')
        .insert([revenueData]);

    } catch (error) {
      console.error('Failed to create revenue record:', error);
      // Don't throw - this shouldn't break the webhook processing
    }
  },

  /**
   * Log webhook processing events
   */
  async logWebhookEvent(logData: CreatePaymentProcessingLogData): Promise<void> {
    try {
      await supabase
        .from('payment_processing_log')
        .insert([logData]);
    } catch (error) {
      console.error('Failed to log webhook event:', error);
      // Don't throw - logging failures shouldn't break webhook processing
    }
  }
};

/**
 * Main Webhook Processing Function
 */
export const processWebhook = async (
  payload: string,
  signature: string
): Promise<WebhookProcessingResult> => {
  let webhookEvent: WebhookEvent | null = null;
  
  try {
    // Verify and construct the Stripe event
    const stripeEvent = webhookProcessor.constructEvent(payload, signature);
    
    // Store webhook event
    webhookEvent = await webhookProcessor.storeWebhookEvent(stripeEvent);
    
    // Check if event was already processed
    if (webhookEvent.processed) {
      return {
        success: true,
        processed: true,
        error: 'Event already processed (idempotent)'
      };
    }
    
    let result: WebhookProcessingResult;
    
    // Route to appropriate handler based on event type
    switch (stripeEvent.type) {
      // Payment Intent events
      case 'payment_intent.succeeded':
      case 'payment_intent.payment_failed':
      case 'payment_intent.canceled':
        result = await eventHandlers.handlePaymentIntentEvent(stripeEvent);
        break;
      
      // Subscription events
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
      case 'invoice.payment_succeeded':
      case 'invoice.payment_failed':
        result = await eventHandlers.handleSubscriptionEvent(stripeEvent);
        break;
      
      // Customer events
      case 'customer.updated':
      case 'customer.deleted':
        result = await eventHandlers.handleCustomerEvent(stripeEvent);
        break;
      
      // Payment Method events
      case 'payment_method.attached':
      case 'payment_method.detached':
        result = await eventHandlers.handlePaymentMethodEvent(stripeEvent);
        break;
      
      // Invoice events
      case 'invoice.created':
      case 'invoice.finalized':
      case 'invoice.paid':
      case 'invoice.voided':
        result = await eventHandlers.handleInvoiceEvent(stripeEvent);
        break;
      
      default:
        console.log(`Unhandled webhook event type: ${stripeEvent.type}`);
        result = {
          success: true,
          processed: false,
          error: `Unhandled event type: ${stripeEvent.type}`
        };
    }
    
    // Mark event as processed
    await webhookProcessor.markEventProcessed(
      webhookEvent.id,
      result.success ? undefined : result.error
    );
    
    return result;
    
  } catch (error) {
    const handledError = errorHandler.handleError(error, {
      context: 'webhook_processing',
      payload: payload.substring(0, 200) // Log first 200 chars of payload
    });
    
    if (webhookEvent) {
      await webhookProcessor.markEventProcessed(webhookEvent.id, handledError.message);
    }
    
    return {
      success: false,
      processed: false,
      error: handledError.message
    };
  }
};

/**
 * Retry failed webhook events
 */
export const retryFailedWebhooks = async (): Promise<{
  processed: number;
  failed: number;
}> => {
  try {
    // Get failed webhook events
    const { data: failedEvents } = await supabase
      .from('webhook_events')
      .select('*')
      .eq('processed', false)
      .lt('retry_count', 3)
      .lt('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // At least 5 minutes old
      .order('created_at')
      .limit(50);

    if (!failedEvents || failedEvents.length === 0) {
      return { processed: 0, failed: 0 };
    }

    let processed = 0;
    let failed = 0;

    for (const event of failedEvents) {
      try {
        // Reconstruct Stripe event from stored data
        const stripeEvent: Stripe.Event = {
          id: event.stripe_event_id,
          type: event.event_type as any,
          api_version: event.api_version,
          livemode: event.livemode,
          data: event.data,
          request: event.request_id ? { id: event.request_id, idempotency_key: event.idempotency_key } : undefined,
          created: Math.floor(new Date(event.created_at).getTime() / 1000),
          object: 'event'
        } as Stripe.Event;

        // Process the event (skip signature verification for retries)
        let result: WebhookProcessingResult;
        
        switch (stripeEvent.type) {
          case 'payment_intent.succeeded':
          case 'payment_intent.payment_failed':
          case 'payment_intent.canceled':
            result = await eventHandlers.handlePaymentIntentEvent(stripeEvent);
            break;
          default:
            result = { success: true, processed: false, error: 'Event type not supported for retry' };
        }

        await webhookProcessor.markEventProcessed(
          event.id,
          result.success ? undefined : result.error
        );

        if (result.success) {
          processed++;
        } else {
          failed++;
        }

      } catch (retryError) {
        await webhookProcessor.markEventProcessed(event.id, `Retry failed: ${retryError}`);
        failed++;
      }
    }

    return { processed, failed };

  } catch (error) {
    console.error('Failed to retry webhook events:', error);
    return { processed: 0, failed: 0 };
  }
};

// Export the main webhook service
export const webhookService = {
  process: processWebhook,
  retry: retryFailedWebhooks,
  handlers: eventHandlers,
  processor: webhookProcessor
};

export default webhookService;