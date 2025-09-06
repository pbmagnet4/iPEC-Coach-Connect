# Payment System Implementation Guide

## Overview

The iPEC Coach Connect payment system provides a comprehensive, secure, and scalable solution for processing payments in the coaching marketplace. Built with Stripe integration, it supports session bookings, subscriptions, payment method management, and revenue splitting between coaches and the platform.

## Architecture Overview

### System Components

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend UI   │    │  Backend Services │    │     Stripe      │
│                 │    │                  │    │                 │
│ • Payment Form  │◄──►│ • Payment Service│◄──►│ • Payment API   │
│ • Checkout Flow │    │ • Stripe Service │    │ • Webhooks      │
│ • Subscriptions │    │ • Webhook Service│    │ • Dashboard     │
│ • Invoices      │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
        │                        │
        ▼                        ▼
┌─────────────────────────────────────────────┐
│              Supabase Database              │
│                                             │
│ • Payment Records    • Revenue Tracking    │
│ • Customer Data      • Subscription State  │
│ • Webhook Events     • Audit Logs          │
└─────────────────────────────────────────────┘
```

### Key Principles

1. **Stripe as Source of Truth**: Minimal database records, Stripe holds canonical payment data
2. **Idempotent Operations**: Webhook processing handles duplicate events gracefully
3. **Revenue Splitting**: Automatic calculation and tracking of coach vs platform revenue
4. **Security First**: PCI compliance through Stripe Elements, secure webhook verification
5. **Mobile Optimized**: Responsive payment UI for all device types

## Setup Guide

### 1. Environment Configuration

Copy `.env.example` to `.env.local` and configure the following:

#### Required Stripe Configuration

```bash
# Test Environment
VITE_STRIPE_PUBLISHABLE_KEY_TEST=pk_test_...
STRIPE_SECRET_KEY_TEST=sk_test_...
STRIPE_WEBHOOK_ENDPOINT_SECRET_TEST=whsec_...
STRIPE_TEST_MODE=true

# Production Environment (when ready)
VITE_STRIPE_PUBLISHABLE_KEY_LIVE=pk_live_...
STRIPE_SECRET_KEY_LIVE=sk_live_...
STRIPE_WEBHOOK_ENDPOINT_SECRET_LIVE=whsec_...
STRIPE_TEST_MODE=false
```

#### Payment Configuration

```bash
# Revenue split (percentage that goes to coaches)
COACH_REVENUE_PERCENTAGE=70
PLATFORM_FEE_PERCENTAGE=30

# Minimum amounts in cents
MINIMUM_SESSION_PRICE=5000  # $50.00
MINIMUM_SUBSCRIPTION_PRICE=2000  # $20.00
```

### 2. Database Setup

Run the payment system migration:

```bash
# Apply the payment schema migration
npx supabase db push

# Verify tables were created
npx supabase db list
```

### 3. Stripe Dashboard Setup

#### Create Products and Prices

1. **Coaching Sessions**
   - Product: "Coaching Session"
   - Price: Variable (set per coach)
   - Type: One-time payment

2. **Subscription Plans**
   - Product: "Premium Coaching Plan"
   - Price: Monthly/Annual recurring
   - Type: Subscription

#### Configure Webhooks

Add webhook endpoint in Stripe Dashboard:
- **URL**: `https://your-domain.com/api/webhooks/stripe`
- **Events**: 
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`
  - `setup_intent.succeeded`

### 4. Test the Integration

Use Stripe test cards for development:

```typescript
// Successful payment
const testCard = '4242424242424242';

// Declined payment
const declinedCard = '4000000000000002';

// Insufficient funds
const insufficientFundsCard = '4000000000009995';

// Requires authentication
const authenticationCard = '4000002760003184';
```

## Usage Patterns

### 1. Session Booking with Payment

```typescript
import { iPECPaymentService } from '@/services/payment.service';
import { CheckoutFlow } from '@/components/payments';

// Book and pay for a coaching session
const handleSessionBooking = async () => {
  try {
    const result = await iPECPaymentService.createSessionPayment({
      coachId: 'coach-uuid',
      sessionDate: new Date('2024-01-15T10:00:00Z'),
      duration: 60,
      amount: 15000, // $150.00 in cents
      paymentMethodId: 'pm_1234567890'
    });

    if (result.success) {
      // Session booked and paid for
      console.log('Booking confirmed:', result.session);
    }
  } catch (error) {
    console.error('Booking failed:', error);
  }
};

// Use the checkout flow component
<CheckoutFlow
  items={[{
    name: 'Coaching Session with John Doe',
    description: '60-minute coaching session',
    amount: 15000,
    quantity: 1
  }]}
  onSuccess={handleSessionBooking}
  onError={(error) => console.error(error)}
/>
```

### 2. Subscription Management

```typescript
import { SubscriptionManager } from '@/components/payments';

// Subscribe to a coaching plan
const handleSubscription = async (priceId: string) => {
  try {
    const result = await iPECPaymentService.createSubscription({
      customerId: 'cus_customer_id',
      priceId: priceId,
      trialPeriodDays: 7
    });

    if (result.success) {
      console.log('Subscription created:', result.subscription);
    }
  } catch (error) {
    console.error('Subscription failed:', error);
  }
};

// Use the subscription manager component
<SubscriptionManager
  customerId={user.stripeCustomerId}
  onSubscriptionChange={(subscription) => {
    console.log('Subscription updated:', subscription);
  }}
/>
```

### 3. Payment Method Management

```typescript
import { PaymentMethodManager } from '@/components/payments';

// Save a new payment method
const handleSavePaymentMethod = async () => {
  try {
    const result = await stripeService.paymentMethod.attach({
      paymentMethodId: 'pm_1234567890',
      customerId: 'cus_customer_id'
    });

    console.log('Payment method saved:', result.paymentMethod);
  } catch (error) {
    console.error('Failed to save payment method:', error);
  }
};

// Use the payment method manager
<PaymentMethodManager
  customerId={user.stripeCustomerId}
  onPaymentMethodAdded={(paymentMethod) => {
    console.log('New payment method:', paymentMethod);
  }}
/>
```

### 4. Invoice and Receipt Handling

```typescript
import { InvoiceViewer } from '@/components/payments';

// View customer invoices
<InvoiceViewer
  customerId={user.stripeCustomerId}
  onInvoiceDownload={(invoice) => {
    // Handle PDF download
    window.open(invoice.invoice_pdf, '_blank');
  }}
/>
```

## Integration Details

### Service Architecture

#### 1. Stripe Service (`stripe.service.ts`)
- Direct Stripe API integration
- Customer, payment method, payment intent management
- Low-level Stripe operations

```typescript
import { stripeService } from '@/services/stripe.service';

// Create a payment intent
const paymentIntent = await stripeService.payment.createPaymentIntent({
  amount: 15000,
  currency: 'usd',
  customerId: 'cus_customer_id'
});
```

#### 2. Payment Service (`payment.service.ts`)
- Business logic layer
- Session booking, subscription management
- Revenue calculations and tracking

```typescript
import iPECPaymentService from '@/services/payment.service';

// Book a session with automatic revenue splitting
const booking = await iPECPaymentService.createSessionPayment({
  coachId: 'coach-uuid',
  sessionDate: new Date(),
  duration: 60,
  amount: 15000
});
```

#### 3. Webhook Service (`webhook.service.ts`)
- Secure webhook processing
- Event verification and routing
- Idempotent event handling

```typescript
import webhookService from '@/services/webhook.service';

// Process incoming webhook (in your API endpoint)
const result = await webhookService.processWebhookEvent(
  request.body,
  request.headers['stripe-signature']
);
```

### Component Integration

#### Payment Form Component

```typescript
import { PaymentForm } from '@/components/payments';

<PaymentForm
  amount={15000}
  currency="usd"
  customerId="cus_customer_id"
  onSuccess={(paymentIntent) => {
    console.log('Payment successful:', paymentIntent);
  }}
  onError={(error) => {
    console.error('Payment failed:', error);
  }}
  className="custom-payment-form"
/>
```

#### Checkout Flow Component

```typescript
import { CheckoutFlow, type CheckoutItem } from '@/components/payments';

const items: CheckoutItem[] = [
  {
    name: 'Coaching Session',
    description: '60-minute session with John Doe',
    amount: 15000,
    quantity: 1
  }
];

<CheckoutFlow
  items={items}
  customerId="cus_customer_id"
  onSuccess={(result) => {
    // Handle successful payment
  }}
  onError={(error) => {
    // Handle payment error
  }}
/>
```

## Security Considerations

### 1. PCI Compliance
- **Stripe Elements**: All payment data handled securely by Stripe
- **No Card Data Storage**: Never store card information in your database
- **Secure Transmission**: All communication over HTTPS

### 2. Webhook Security
- **Signature Verification**: All webhooks verified using Stripe signatures
- **Idempotent Processing**: Duplicate events handled gracefully
- **Event Validation**: Only process expected event types

### 3. Data Protection
- **Row Level Security**: Database access controlled by RLS policies
- **User Isolation**: Users can only access their own payment data
- **Audit Logging**: All payment operations logged for compliance

## Error Handling

### Common Error Scenarios

#### 1. Payment Declined

```typescript
try {
  const result = await iPECPaymentService.createSessionPayment(data);
} catch (error) {
  if (error.type === 'StripeCardError') {
    // Show user-friendly message
    setError('Your card was declined. Please try a different payment method.');
  }
}
```

#### 2. Insufficient Funds

```typescript
if (error.code === 'insufficient_funds') {
  setError('Your card has insufficient funds. Please try a different card.');
}
```

#### 3. Authentication Required

```typescript
if (error.code === 'authentication_required') {
  // Handle 3D Secure authentication
  const { error: confirmError } = await stripe.confirmCardPayment(
    paymentIntent.client_secret
  );
}
```

### Error Recovery Patterns

1. **Retry Logic**: Automatic retry for transient failures
2. **Fallback Options**: Alternative payment methods when primary fails
3. **User Guidance**: Clear error messages with actionable steps
4. **Logging**: Comprehensive error logging for debugging

## Testing

### Unit Tests

Run the payment service tests:

```bash
npm run test src/services/__tests__/payment.service.test.ts
npm run test src/services/__tests__/stripe.service.test.ts
```

### End-to-End Tests

Run the payment flow E2E tests:

```bash
npm run test:e2e tests/e2e/payment-flows.spec.ts
```

### Test Data

Use Stripe test cards for different scenarios:

```typescript
export const TEST_CARDS = {
  SUCCESS: '4242424242424242',
  DECLINED: '4000000000000002',
  INSUFFICIENT_FUNDS: '4000000000009995',
  AUTHENTICATION: '4000002760003184',
  PROCESSING_ERROR: '4000000000000119'
};
```

## Performance Optimization

### 1. Caching Strategy
- **Payment Methods**: Cache user payment methods
- **Subscription Status**: Cache subscription state
- **Invoice Data**: Cache invoice lists

### 2. Loading States
- **Payment Form**: Show loading during payment processing
- **Subscription Updates**: Indicate status changes
- **Invoice Generation**: Progress indicators for PDF generation

### 3. Preloading
- **Stripe Scripts**: Preload Stripe.js for faster initialization
- **Payment Data**: Prefetch user payment information

## Monitoring and Analytics

### Key Metrics to Track

1. **Payment Success Rate**: Percentage of successful payments
2. **Revenue Growth**: Monthly recurring revenue trends
3. **Churn Rate**: Subscription cancellation rates
4. **Payment Method Adoption**: Usage of different payment types

### Logging

All payment operations are logged with:

```typescript
{
  event: 'payment_processed',
  userId: 'user-uuid',
  amount: 15000,
  currency: 'usd',
  status: 'succeeded',
  timestamp: '2024-01-15T10:00:00Z'
}
```

## Troubleshooting

### Common Issues

#### 1. Webhook Not Receiving Events

**Symptoms**: Payments succeed in Stripe but not reflected in app

**Solutions**:
1. Verify webhook URL is correct
2. Check webhook endpoint secret
3. Ensure proper event types are selected
4. Test webhook endpoint accessibility

#### 2. Payment Form Not Loading

**Symptoms**: Stripe Elements not rendering

**Solutions**:
1. Check Stripe publishable key
2. Verify network connectivity
3. Check browser console for errors
4. Ensure proper initialization

#### 3. Revenue Split Incorrect

**Symptoms**: Coach payments don't match expected amounts

**Solutions**:
1. Verify `COACH_REVENUE_PERCENTAGE` setting
2. Check revenue calculation logic
3. Review timing rules for refunds
4. Audit payment records in database

### Debug Mode

Enable debug logging:

```bash
VITE_ENABLE_DEBUG_MODE=true
```

This will expose additional logging and debugging tools in the browser console.

## Production Deployment

### Pre-deployment Checklist

- [ ] All environment variables configured for production
- [ ] Stripe webhook endpoint updated for production URL
- [ ] SSL certificate installed and verified
- [ ] Database migration applied
- [ ] Payment flows tested with test cards
- [ ] Error handling tested
- [ ] Monitoring and alerting configured

### Go-Live Process

1. **Switch to Live Mode**: Set `STRIPE_TEST_MODE=false`
2. **Update API Keys**: Use live Stripe keys
3. **Verify Webhooks**: Test production webhook endpoint
4. **Monitor Closely**: Watch for any issues in first 24 hours
5. **Backup Plan**: Keep rollback procedure ready

## Support and Maintenance

### Regular Tasks

1. **Monitor Payment Success Rates**: Weekly review
2. **Update Test Cards**: As Stripe updates test scenarios  
3. **Review Error Logs**: Daily monitoring of payment errors
4. **Security Updates**: Keep Stripe SDK and dependencies updated

### Escalation Process

1. **Level 1**: Check logs and common troubleshooting
2. **Level 2**: Review Stripe Dashboard for detailed error info
3. **Level 3**: Contact Stripe support for platform issues

---

## Additional Resources

- [Stripe API Documentation](https://stripe.com/docs/api)
- [Stripe Elements Guide](https://stripe.com/docs/stripe-js)
- [Webhook Best Practices](https://stripe.com/docs/webhooks/best-practices)
- [PCI Compliance Guide](https://stripe.com/docs/security)