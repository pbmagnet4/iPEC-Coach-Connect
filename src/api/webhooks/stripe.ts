/**
 * Stripe Webhook API Endpoint
 * 
 * Handles incoming webhook events from Stripe to synchronize payment status,
 * subscription changes, and other critical events with the application database.
 * 
 * Security: All requests are verified using Stripe webhook signatures
 * Idempotency: Events are processed only once using event ID tracking
 * Retry Logic: Failed events are retried with exponential backoff
 */

import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { webhookService } from '../../services/webhook.service';
import { errorHandler } from '../../lib/error-handling';
import { secureLogger } from '../../lib/secure-logger';

// Initialize Stripe with the secret key
const _stripe = new Stripe(process.env.STRIPE_SECRET_KEY_TEST ?? process.env.STRIPE_SECRET_KEY_LIVE ?? '', {
  apiVersion: '2024-11-20.acacia',
});

/**
 * Webhook endpoint configuration
 */
const WEBHOOK_CONFIG = {
  // Maximum request body size (Stripe recommends 1MB)
  maxBodySize: 1024 * 1024,
  
  // Supported webhook events
  supportedEvents: [
    'payment_intent.succeeded',
    'payment_intent.payment_failed',
    'customer.subscription.created',
    'customer.subscription.updated', 
    'customer.subscription.deleted',
    'invoice.payment_succeeded',
    'invoice.payment_failed',
    'setup_intent.succeeded'
  ],
  
  // Rate limiting (requests per minute)
  rateLimit: 100,
  
  // Retry configuration
  maxRetries: 3,
  retryDelayBase: 1000 // Base delay in milliseconds
};

/**
 * POST /api/webhooks/stripe
 * 
 * Processes incoming Stripe webhook events with comprehensive error handling,
 * signature verification, and idempotent processing.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestId = generateRequestId();
  const startTime = Date.now();

  try {
    // Log incoming webhook
    secureLogger.info('Processing Stripe webhook', { requestId });

    // Validate request headers
    const signature = request.headers.get('stripe-signature');
    if (!signature) {
      secureLogger.error('Missing Stripe signature header', { requestId });
      return new NextResponse('Missing Stripe signature', { status: 400 });
    }

    // Get raw request body
    const body = await request.text();
    if (!body) {
      secureLogger.error('Empty request body', { requestId });
      return new NextResponse('Empty request body', { status: 400 });
    }

    // Check body size
    if (body.length > WEBHOOK_CONFIG.maxBodySize) {
      secureLogger.error('Request body too large', { requestId, bodySize: body.length });
      return new NextResponse('Request body too large', { status: 413 });
    }

    // Verify webhook signature and construct event
    let event: Stripe.Event;
    try {
      event = await webhookService.verifyWebhook(body, signature);
      secureLogger.info('Verified Stripe event', { requestId, eventType: event.type, eventId: event.id });
    } catch (error) {
      secureLogger.error('Signature verification failed', { requestId, error: error instanceof Error ? error.message : String(error) });
      return new NextResponse('Invalid signature', { status: 400 });
    }

    // Check if event type is supported
    if (!WEBHOOK_CONFIG.supportedEvents.includes(event.type)) {
      secureLogger.info('Unsupported event type', { requestId, eventType: event.type });
      return new NextResponse('Event type not supported', { status: 200 });
    }

    // Check if event was already processed (idempotency)
    const isProcessed = await webhookService.isEventProcessed(event.id);
    if (isProcessed) {
      secureLogger.info('Event already processed', { requestId, eventId: event.id });
      return new NextResponse('Event already processed', { status: 200 });
    }

    // Process the event with retry logic
    await processEventWithRetry(event, requestId);

    // Record successful processing
    await webhookService.recordEventProcessed(event.id, event.type);

    const processingTime = Date.now() - startTime;
    secureLogger.info('Successfully processed webhook', { requestId, eventType: event.type, processingTime });

    return new NextResponse('OK', { status: 200 });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    secureLogger.error('Error processing webhook', { requestId, processingTime, error: error instanceof Error ? error.message : String(error) });

    // Log error for monitoring
    await logWebhookError(requestId, error, request);

    // Return appropriate error response
    if (error instanceof Stripe.errors.StripeError) {
      return new NextResponse('Stripe error', { status: 400 });
    }

    return new NextResponse('Internal server error', { status: 500 });
  }
}

/**
 * Process webhook event with exponential backoff retry logic
 */
async function processEventWithRetry(
  event: Stripe.Event,
  requestId: string,
  attempt = 1
): Promise<void> {
  try {
    await webhookService.processEvent(event);
    secureLogger.info('Event processed successfully', { requestId, attempt });
  } catch (error) {
    secureLogger.error('Processing failed on attempt', { requestId, attempt, error: error instanceof Error ? error.message : String(error) });

    if (attempt >= WEBHOOK_CONFIG.maxRetries) {
      secureLogger.error('Max retries exceeded for event', { requestId, eventId: event.id });
      
      // Log critical error for manual intervention
      await logCriticalWebhookError(requestId, event, error);
      throw error;
    }

    // Calculate exponential backoff delay
    const delay = WEBHOOK_CONFIG.retryDelayBase * Math.pow(2, attempt - 1);
    secureLogger.info('Retrying webhook processing', { requestId, delay, nextAttempt: attempt + 1 });

    // Wait before retry
    await new Promise(resolve => setTimeout(resolve, delay));

    // Retry with incremented attempt count
    await processEventWithRetry(event, requestId, attempt + 1);
  }
}

/**
 * Generate unique request ID for tracking
 */
function generateRequestId(): string {
  return `wh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Log webhook processing error
 */
async function logWebhookError(
  requestId: string,
  error: Error | unknown,
  request: NextRequest
): Promise<void> {
  const errorLog = {
    requestId,
    error: errorHandler.handleError(error),
    timestamp: new Date().toISOString(),
    userAgent: request.headers.get('user-agent'),
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
    contentType: request.headers.get('content-type'),
    contentLength: request.headers.get('content-length')
  };

  secureLogger.error('Webhook processing error', errorLog);

  // In production, you might want to send this to a monitoring service
  // await sendToMonitoringService(errorLog);
}

/**
 * Log critical webhook error that requires manual intervention
 */
async function logCriticalWebhookError(
  requestId: string,
  event: Stripe.Event,
  error: Error | unknown
): Promise<void> {
  const criticalError = {
    requestId,
    eventId: event.id,
    eventType: event.type,
    error: errorHandler.handleError(error),
    timestamp: new Date().toISOString(),
    severity: 'critical',
    requiresManualIntervention: true
  };

  secureLogger.error('Critical webhook error requiring manual intervention', criticalError);

  // In production, you should alert your team immediately
  // await sendCriticalAlert(criticalError);
  
  // Store in database for manual review
  try {
    await webhookService.recordFailedEvent(event.id, event.type, error);
  } catch (dbError) {
    secureLogger.error('Failed to record critical error in database', { error: dbError instanceof Error ? dbError.message : String(dbError) });
  }
}

/**
 * GET /api/webhooks/stripe
 * 
 * Health check endpoint to verify webhook configuration
 */
export async function GET(): Promise<NextResponse> {
  try {
    // Check if webhook service is properly configured
    const isConfigured = await webhookService.healthCheck();
    
    if (!isConfigured) {
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Webhook service not properly configured' 
        },
        { status: 500 }
      );
    }

    // Return health status
    return NextResponse.json({
      status: 'ok',
      service: 'stripe-webhook',
      timestamp: new Date().toISOString(),
      configuration: {
        supportedEvents: WEBHOOK_CONFIG.supportedEvents,
        maxBodySize: WEBHOOK_CONFIG.maxBodySize,
        rateLimit: WEBHOOK_CONFIG.rateLimit,
        testMode: process.env.STRIPE_TEST_MODE === 'true'
      }
    });

  } catch (error) {
    secureLogger.error('Webhook health check failed', { error: error instanceof Error ? error.message : String(error) });
    
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Health check failed',
        error: errorHandler.handleError(error)
      },
      { status: 500 }
    );
  }
}

/**
 * Handle unsupported HTTP methods
 */
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse('Method not allowed', { status: 405 });
}

export async function PUT(): Promise<NextResponse> {
  return new NextResponse('Method not allowed', { status: 405 });
}

export async function DELETE(): Promise<NextResponse> {
  return new NextResponse('Method not allowed', { status: 405 });
}

export async function PATCH(): Promise<NextResponse> {
  return new NextResponse('Method not allowed', { status: 405 });
}