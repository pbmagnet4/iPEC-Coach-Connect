# Webhook API Documentation

## Overview

The iPEC Coach Connect webhook system handles asynchronous events from Stripe, ensuring that payment status changes, subscription updates, and other critical events are properly synchronized with the application database.

## Webhook Endpoint

### Base URL
```
POST /api/webhooks/stripe
```

### Security

All webhook requests must include a valid Stripe signature in the `Stripe-Signature` header. The webhook service automatically verifies signatures using the configured webhook secret.

```typescript
// Automatic signature verification
const isValid = await webhookService.verifySignature(
  requestBody,
  stripeSignatureHeader,
  webhookSecret
);
```

## Supported Events

### Payment Events

#### `payment_intent.succeeded`
Triggered when a payment is successfully processed.

**Event Data:**
```json
{
  "id": "evt_1234567890",
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_1234567890",
      "amount": 15000,
      "currency": "usd",
      "status": "succeeded",
      "customer": "cus_customer_id",
      "metadata": {
        "coach_id": "coach-uuid",
        "session_id": "session-uuid"
      }
    }
  }
}
```

**Processing Actions:**
1. Create revenue record in database
2. Calculate coach and platform splits
3. Update session booking status
4. Send confirmation notifications

#### `payment_intent.payment_failed`
Triggered when a payment fails.

**Event Data:**
```json
{
  "id": "evt_1234567890",
  "type": "payment_intent.payment_failed",
  "data": {
    "object": {
      "id": "pi_1234567890",
      "amount": 15000,
      "currency": "usd",
      "status": "requires_payment_method",
      "customer": "cus_customer_id",
      "last_payment_error": {
        "code": "card_declined",
        "decline_code": "insufficient_funds",
        "message": "Your card has insufficient funds."
      }
    }
  }
}
```

**Processing Actions:**
1. Update payment intent status
2. Log failure reason
3. Send failure notification to user
4. Release reserved session slot

### Subscription Events

#### `customer.subscription.created`
Triggered when a new subscription is created.

**Event Data:**
```json
{
  "id": "evt_1234567890",
  "type": "customer.subscription.created",
  "data": {
    "object": {
      "id": "sub_1234567890",
      "customer": "cus_customer_id",
      "status": "active",
      "current_period_start": 1642190400,
      "current_period_end": 1644868800,
      "items": {
        "data": [
          {
            "price": {
              "id": "price_premium_monthly",
              "unit_amount": 9900,
              "currency": "usd"
            }
          }
        ]
      }
    }
  }
}
```

**Processing Actions:**
1. Create subscription record in database
2. Update user's subscription status
3. Send welcome email
4. Activate premium features

#### `customer.subscription.updated`
Triggered when a subscription is modified.

**Event Data:**
```json
{
  "id": "evt_1234567890",
  "type": "customer.subscription.updated",
  "data": {
    "object": {
      "id": "sub_1234567890",
      "customer": "cus_customer_id",
      "status": "past_due",
      "current_period_start": 1642190400,
      "current_period_end": 1644868800
    }
  }
}
```

**Processing Actions:**
1. Update subscription status in database
2. Handle status-specific logic (past_due, canceled, etc.)
3. Send appropriate notifications
4. Adjust feature access

#### `customer.subscription.deleted`
Triggered when a subscription is canceled.

**Event Data:**
```json
{
  "id": "evt_1234567890",
  "type": "customer.subscription.deleted",
  "data": {
    "object": {
      "id": "sub_1234567890",
      "customer": "cus_customer_id",
      "status": "canceled",
      "canceled_at": 1642190400
    }
  }
}
```

**Processing Actions:**
1. Mark subscription as canceled in database
2. Schedule feature downgrade
3. Send cancellation confirmation
4. Trigger retention campaign (if applicable)

### Invoice Events

#### `invoice.payment_succeeded`
Triggered when an invoice payment is successful.

**Event Data:**
```json
{
  "id": "evt_1234567890",
  "type": "invoice.payment_succeeded",
  "data": {
    "object": {
      "id": "in_1234567890",
      "customer": "cus_customer_id",
      "subscription": "sub_1234567890",
      "amount_paid": 9900,
      "currency": "usd",
      "status": "paid",
      "lines": {
        "data": [
          {
            "description": "Premium Coaching Plan",
            "amount": 9900
          }
        ]
      }
    }
  }
}
```

**Processing Actions:**
1. Create invoice record in database
2. Update subscription billing status
3. Send receipt to customer
4. Process revenue sharing

#### `invoice.payment_failed`
Triggered when an invoice payment fails.

**Event Data:**
```json
{
  "id": "evt_1234567890",
  "type": "invoice.payment_failed",
  "data": {
    "object": {
      "id": "in_1234567890",
      "customer": "cus_customer_id",
      "subscription": "sub_1234567890",
      "amount_due": 9900,
      "status": "open",
      "next_payment_attempt": 1642363200
    }
  }
}
```

**Processing Actions:**
1. Update invoice status
2. Log payment failure
3. Send payment failure notification
4. Initiate dunning process

### Setup Intent Events

#### `setup_intent.succeeded`
Triggered when a payment method is successfully saved.

**Event Data:**
```json
{
  "id": "evt_1234567890",
  "type": "setup_intent.succeeded",
  "data": {
    "object": {
      "id": "seti_1234567890",
      "customer": "cus_customer_id",
      "payment_method": "pm_1234567890",
      "status": "succeeded"
    }
  }
}
```

**Processing Actions:**
1. Confirm payment method attachment
2. Update user's saved payment methods
3. Send confirmation notification

## Webhook Processing Flow

### 1. Request Validation

```typescript
export async function POST(request: Request) {
  try {
    // Get raw body and signature
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');
    
    if (!signature) {
      return new Response('Missing signature', { status: 400 });
    }
    
    // Verify webhook signature
    const event = await webhookService.verifyWebhook(body, signature);
    
    // Process the event
    await webhookService.processEvent(event);
    
    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response('Webhook error', { status: 400 });
  }
}
```

### 2. Event Processing

```typescript
// Event routing based on type
const processEvent = async (event: Stripe.Event) => {
  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
      break;
      
    case 'customer.subscription.created':
      await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
      break;
      
    // ... other event types
      
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
};
```

### 3. Idempotency Handling

All webhook events are processed idempotently using the Stripe event ID:

```typescript
const handlePaymentSuccess = async (paymentIntent: Stripe.PaymentIntent) => {
  // Check if we've already processed this event
  const existingRecord = await supabase
    .from('webhook_events')
    .select('id')
    .eq('stripe_event_id', paymentIntent.id)
    .single();
    
  if (existingRecord.data) {
    console.log('Event already processed');
    return;
  }
  
  // Process the event and record it
  await processPaymentSuccess(paymentIntent);
  
  await supabase
    .from('webhook_events')
    .insert({
      stripe_event_id: paymentIntent.id,
      event_type: 'payment_intent.succeeded',
      processed_at: new Date().toISOString()
    });
};
```

## Error Handling

### Retry Logic

Webhooks implement exponential backoff retry logic:

```typescript
const processWithRetry = async (event: Stripe.Event, maxRetries: number = 3) => {
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      await processEvent(event);
      return;
    } catch (error) {
      attempt++;
      
      if (attempt >= maxRetries) {
        // Log error and alert administrators
        await logCriticalError(error, event);
        throw error;
      }
      
      // Exponential backoff
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};
```

### Error Responses

#### Success Response
```
HTTP/1.1 200 OK
Content-Type: text/plain

OK
```

#### Validation Error
```
HTTP/1.1 400 Bad Request
Content-Type: text/plain

Invalid signature
```

#### Processing Error
```
HTTP/1.1 500 Internal Server Error
Content-Type: text/plain

Processing failed
```

## Database Schema

### Webhook Events Table

```sql
CREATE TABLE webhook_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_event_id VARCHAR(255) UNIQUE NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Revenue Records Table

```sql
CREATE TABLE revenue_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_intent_id VARCHAR(255) UNIQUE NOT NULL,
  gross_amount INTEGER NOT NULL,
  platform_fee INTEGER NOT NULL,
  coach_amount INTEGER NOT NULL,
  coach_id UUID REFERENCES coaches(id),
  session_id UUID REFERENCES sessions(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Monitoring and Alerting

### Key Metrics

1. **Webhook Success Rate**: Percentage of successfully processed webhooks
2. **Processing Latency**: Time to process webhook events
3. **Retry Rate**: Percentage of webhooks requiring retries
4. **Error Rate**: Failed webhook processing rate

### Alerting Rules

```typescript
// Alert on high error rate
if (errorRate > 5) {
  await sendAlert({
    type: 'webhook_error_rate_high',
    message: `Webhook error rate is ${errorRate}%`,
    severity: 'critical'
  });
}

// Alert on processing delays
if (processingLatency > 30000) { // 30 seconds
  await sendAlert({
    type: 'webhook_processing_slow',
    message: `Webhook processing taking ${processingLatency}ms`,
    severity: 'warning'
  });
}
```

## Testing Webhooks

### Local Testing with Stripe CLI

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to your Stripe account
stripe login

# Forward webhooks to local endpoint
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Trigger test events
stripe trigger payment_intent.succeeded
stripe trigger customer.subscription.created
```

### Test Event Payloads

Use these test payloads for unit testing:

```typescript
export const TEST_WEBHOOK_EVENTS = {
  PAYMENT_SUCCESS: {
    id: 'evt_test_payment_success',
    type: 'payment_intent.succeeded',
    data: {
      object: {
        id: 'pi_test_success',
        amount: 15000,
        currency: 'usd',
        status: 'succeeded',
        customer: 'cus_test_customer'
      }
    }
  },
  
  SUBSCRIPTION_CREATED: {
    id: 'evt_test_subscription_created',
    type: 'customer.subscription.created',
    data: {
      object: {
        id: 'sub_test_subscription',
        customer: 'cus_test_customer',
        status: 'active',
        current_period_start: 1642190400,
        current_period_end: 1644868800
      }
    }
  }
};
```

## Security Best Practices

### 1. Signature Verification
Always verify webhook signatures to ensure requests come from Stripe:

```typescript
const verifyWebhook = (body: string, signature: string): Stripe.Event => {
  try {
    return stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    throw new Error('Invalid webhook signature');
  }
};
```

### 2. Idempotency
Store processed event IDs to prevent duplicate processing:

```typescript
const isEventProcessed = async (eventId: string): Promise<boolean> => {
  const { data } = await supabase
    .from('webhook_events')
    .select('id')
    .eq('stripe_event_id', eventId)
    .single();
    
  return !!data;
};
```

### 3. Rate Limiting
Implement rate limiting to prevent abuse:

```typescript
// Limit to 100 requests per minute per IP
const rateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: 'Too many webhook requests'
});
```

## Troubleshooting

### Common Issues

#### 1. Webhook Not Receiving Events

**Symptoms**: 
- Events visible in Stripe Dashboard but not processed
- No webhook logs in application

**Solutions**:
1. Verify webhook URL is publicly accessible
2. Check SSL certificate validity
3. Confirm webhook endpoint secret is correct
4. Test endpoint with curl or Stripe CLI

```bash
# Test webhook endpoint
curl -X POST https://your-domain.com/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: test" \
  -d '{"test": true}'
```

#### 2. Signature Verification Failures

**Symptoms**:
- All webhooks return 400 "Invalid signature"
- Webhook events not being processed

**Solutions**:
1. Verify webhook endpoint secret matches Stripe Dashboard
2. Ensure raw request body is used for verification
3. Check for middleware that modifies request body
4. Validate timestamp tolerance

#### 3. Duplicate Event Processing

**Symptoms**:
- Same event processed multiple times
- Duplicate database records

**Solutions**:
1. Implement proper idempotency checks
2. Use database constraints on event IDs
3. Add retry logic with exponential backoff
4. Monitor for race conditions

### Debug Mode

Enable webhook debugging:

```bash
# Environment variable
WEBHOOK_DEBUG=true

# This will log all incoming webhook events
```

## Performance Optimization

### 1. Async Processing
Process webhooks asynchronously to respond quickly:

```typescript
export async function POST(request: Request) {
  // Verify signature first
  const event = await verifyWebhook(body, signature);
  
  // Respond immediately
  const response = new Response('OK', { status: 200 });
  
  // Process asynchronously
  processEventAsync(event).catch(error => {
    console.error('Async processing failed:', error);
  });
  
  return response;
}
```

### 2. Batch Processing
Process multiple events together when possible:

```typescript
const processBatch = async (events: Stripe.Event[]) => {
  const paymentEvents = events.filter(e => e.type.startsWith('payment_intent'));
  const subscriptionEvents = events.filter(e => e.type.startsWith('customer.subscription'));
  
  await Promise.all([
    processPaymentEvents(paymentEvents),
    processSubscriptionEvents(subscriptionEvents)
  ]);
};
```

### 3. Caching
Cache frequently accessed data:

```typescript
// Cache customer data to avoid repeated lookups
const customerCache = new Map();

const getCachedCustomer = async (customerId: string) => {
  if (customerCache.has(customerId)) {
    return customerCache.get(customerId);
  }
  
  const customer = await stripeService.customer.get(customerId);
  customerCache.set(customerId, customer);
  
  return customer;
};
```

---

## Support

For webhook-related issues:

1. Check Stripe Dashboard webhook logs
2. Review application error logs
3. Use Stripe CLI for local testing
4. Contact Stripe support for platform issues

## References

- [Stripe Webhook Documentation](https://stripe.com/docs/webhooks)
- [Webhook Best Practices](https://stripe.com/docs/webhooks/best-practices)
- [Event Types Reference](https://stripe.com/docs/api/events/types)