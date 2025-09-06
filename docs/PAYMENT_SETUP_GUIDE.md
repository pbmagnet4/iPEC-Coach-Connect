# Payment System Quick Setup Guide

## Overview

This guide will help you set up the iPEC Coach Connect payment system in under 30 minutes. Follow these steps to get payments working in your development environment.

## Prerequisites

- Node.js 18+ installed
- Supabase project set up
- Stripe account (can be created during setup)

## Step 1: Create Stripe Account

1. Go to [stripe.com](https://stripe.com) and sign up
2. Verify your email address
3. Navigate to **Developers** → **API keys**
4. Copy your **Publishable key** and **Secret key** (test mode)

## Step 2: Configure Environment

1. Copy the environment template:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` with your Stripe keys:
   ```bash
   # Required Stripe Configuration
   VITE_STRIPE_PUBLISHABLE_KEY_TEST=pk_test_your_key_here
   STRIPE_SECRET_KEY_TEST=sk_test_your_key_here
   STRIPE_TEST_MODE=true
   
   # Payment Configuration (use defaults)
   COACH_REVENUE_PERCENTAGE=70
   PLATFORM_FEE_PERCENTAGE=30
   ```

## Step 3: Set Up Database

1. Apply the payment system migration:
   ```bash
   npx supabase db push
   ```

2. Verify tables were created:
   ```bash
   npx supabase db list
   ```

   You should see these new tables:
   - `payment_customers`
   - `payment_methods` 
   - `payment_intents`
   - `subscriptions`
   - `invoices`
   - `revenue_records`
   - `webhook_events`

## Step 4: Create Stripe Products

1. In Stripe Dashboard, go to **Products**
2. Click **Add product**

### Create Coaching Session Product
- **Name**: "Coaching Session"
- **Description**: "One-time coaching session"
- **Pricing model**: "One time"
- **Price**: Leave blank (will be set per coach)
- Copy the **Price ID** for later use

### Create Subscription Product
- **Name**: "Premium Coaching Plan" 
- **Description**: "Monthly access to premium coaching features"
- **Pricing model**: "Recurring"
- **Price**: $99.00 per month
- Copy the **Price ID** for later use

## Step 5: Set Up Webhooks

1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. **Endpoint URL**: `http://localhost:3000/api/webhooks/stripe` (update for your setup)
4. **Events to send**: Select these events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `setup_intent.succeeded`

5. Copy the **Signing secret** and add to your `.env.local`:
   ```bash
   STRIPE_WEBHOOK_ENDPOINT_SECRET_TEST=whsec_your_webhook_secret
   ```

## Step 6: Test the Integration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Open your browser to `http://localhost:5173`

3. Test with Stripe test cards:
   - **Success**: `4242424242424242`
   - **Declined**: `4000000000000002`
   - **Requires Auth**: `4000002760003184`

## Step 7: Test Payment Components

### Test Payment Form
```typescript
import { PaymentForm } from '@/components/payments';

// Add to any page for testing
<PaymentForm
  amount={5000} // $50.00
  currency="usd"
  onSuccess={(paymentIntent) => {
    console.log('Payment successful!', paymentIntent);
  }}
  onError={(error) => {
    console.error('Payment failed:', error);
  }}
/>
```

### Test Checkout Flow
```typescript
import { CheckoutFlow } from '@/components/payments';

const testItems = [
  {
    name: 'Test Coaching Session',
    description: '60-minute test session',
    amount: 15000, // $150.00
    quantity: 1
  }
];

<CheckoutFlow
  items={testItems}
  onSuccess={(result) => {
    console.log('Checkout completed!', result);
  }}
/>
```

## Step 8: Verify Webhook Processing

1. Install Stripe CLI for local testing:
   ```bash
   brew install stripe/stripe-cli/stripe
   ```

2. Login to your Stripe account:
   ```bash
   stripe login
   ```

3. Forward webhooks to your local server:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

4. Trigger a test event:
   ```bash
   stripe trigger payment_intent.succeeded
   ```

5. Check your application logs to verify the webhook was processed.

## Common Issues & Solutions

### Issue: "Invalid publishable key"
**Solution**: Make sure you're using the test key (starts with `pk_test_`)

### Issue: Webhook not receiving events  
**Solution**: 
1. Ensure your webhook URL is publicly accessible
2. Use ngrok for local development: `ngrok http 3000`
3. Update webhook URL in Stripe Dashboard

### Issue: Payment form not loading
**Solution**:
1. Check browser console for errors
2. Verify Stripe publishable key is correct
3. Ensure internet connectivity

### Issue: Database connection errors
**Solution**:
1. Verify Supabase URL and keys in `.env.local`
2. Check if migration was applied: `npx supabase db list`

## Testing Checklist

Before going to production, test these scenarios:

- [ ] **Successful payment**: Use card `4242424242424242`
- [ ] **Declined payment**: Use card `4000000000000002`  
- [ ] **Insufficient funds**: Use card `4000000000009995`
- [ ] **Authentication required**: Use card `4000002760003184`
- [ ] **Webhook processing**: Trigger events with Stripe CLI
- [ ] **Subscription creation**: Test monthly subscription signup
- [ ] **Payment method saving**: Save and reuse payment methods
- [ ] **Error handling**: Test various error scenarios

## Next Steps

Once basic functionality is working:

1. **Customize UI**: Style payment components to match your design
2. **Add Features**: Implement subscriptions, payment method management
3. **Set Up Monitoring**: Add logging and error tracking
4. **Production Setup**: Get SSL certificate, production Stripe keys
5. **Security Review**: Verify webhook signatures, audit access controls

## Production Deployment

When ready for production:

1. **Update Environment Variables**:
   ```bash
   VITE_STRIPE_PUBLISHABLE_KEY_LIVE=pk_live_your_live_key
   STRIPE_SECRET_KEY_LIVE=sk_live_your_live_secret
   STRIPE_TEST_MODE=false
   ```

2. **Update Webhook URL**: Use your production domain
3. **SSL Certificate**: Ensure HTTPS is properly configured
4. **Test Everything**: Run through all payment flows again

## Support

If you run into issues:

1. **Check Documentation**: Review the full implementation guide
2. **Stripe Dashboard**: Check for errors in the Stripe Dashboard
3. **Application Logs**: Review server and browser console logs
4. **Stripe Support**: Contact Stripe support for platform issues

## Resources

- [Full Implementation Guide](./PAYMENT_SYSTEM_IMPLEMENTATION.md)
- [Webhook API Documentation](./WEBHOOK_API_DOCUMENTATION.md)  
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Test Cards](https://stripe.com/docs/testing#cards)

---

**Estimated Setup Time**: 20-30 minutes  
**Difficulty Level**: Intermediate  
**Prerequisites**: Basic React/TypeScript knowledge