# iPEC Coach Connect - Payment System Documentation

Welcome to the payment system documentation for iPEC Coach Connect. This directory contains comprehensive guides and references for implementing, configuring, and maintaining the Stripe-based payment system.

## 📋 Documentation Index

### Quick Start
- **[Payment Setup Guide](./PAYMENT_SETUP_GUIDE.md)** - Get payments working in 30 minutes
  - Environment configuration
  - Database setup  
  - Stripe configuration
  - Testing checklist
  - Common troubleshooting

### Implementation Reference
- **[Payment System Implementation Guide](./PAYMENT_SYSTEM_IMPLEMENTATION.md)** - Complete implementation reference
  - Architecture overview
  - Service layer details
  - Component integration
  - Security considerations
  - Performance optimization
  - Monitoring and analytics

### API Documentation  
- **[Webhook API Documentation](./WEBHOOK_API_DOCUMENTATION.md)** - Webhook processing reference
  - Supported webhook events
  - Processing flow
  - Error handling
  - Security best practices
  - Testing and debugging

## 🚀 Getting Started

If you're new to the payment system, follow this recommended path:

### For Developers
1. **Start Here**: [Payment Setup Guide](./PAYMENT_SETUP_GUIDE.md) (30 min)
2. **Learn More**: [Implementation Guide](./PAYMENT_SYSTEM_IMPLEMENTATION.md) (1-2 hours)
3. **Webhook Setup**: [Webhook API Documentation](./WEBHOOK_API_DOCUMENTATION.md) (30 min)

### For DevOps/Infrastructure
1. **Setup**: [Payment Setup Guide](./PAYMENT_SETUP_GUIDE.md) - Environment configuration
2. **Security**: [Implementation Guide](./PAYMENT_SYSTEM_IMPLEMENTATION.md) - Security section
3. **Monitoring**: [Webhook API Documentation](./WEBHOOK_API_DOCUMENTATION.md) - Monitoring section

### For QA/Testing
1. **Test Setup**: [Payment Setup Guide](./PAYMENT_SETUP_GUIDE.md) - Testing section
2. **Test Scenarios**: [Implementation Guide](./PAYMENT_SYSTEM_IMPLEMENTATION.md) - Testing section
3. **Error Testing**: [Webhook API Documentation](./WEBHOOK_API_DOCUMENTATION.md) - Error handling

## 🏗️ System Architecture

The payment system consists of several integrated components:

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

## 🔧 Core Features

### Payment Processing
- **Session Bookings**: One-time payments for coaching sessions
- **Subscriptions**: Recurring monthly/annual plans
- **Payment Methods**: Save and manage customer payment methods
- **Refunds**: Automated refund processing with coach revenue adjustments

### Revenue Management
- **Revenue Splitting**: Automatic 70/30 split between coaches and platform
- **Tracking**: Comprehensive revenue reporting and analytics  
- **Invoicing**: Automated invoice generation and PDF receipts

### Security & Compliance
- **PCI Compliance**: Stripe Elements for secure card handling
- **Webhook Verification**: Cryptographic signature validation
- **Data Protection**: Row-level security and user isolation
- **Audit Logging**: Complete audit trail for all transactions

### Integration Features
- **React Components**: Pre-built payment UI components
- **TypeScript Support**: Full type safety across the system
- **Mobile Optimization**: Responsive design for all screen sizes
- **Error Handling**: Comprehensive error recovery and user guidance

## 📁 File Structure

```
src/
├── components/payments/          # React payment components
│   ├── PaymentForm.tsx          # Payment form with Stripe Elements
│   ├── CheckoutFlow.tsx         # Multi-step checkout process
│   ├── SubscriptionManager.tsx  # Subscription management UI
│   ├── PaymentMethodManager.tsx # Payment method CRUD operations
│   ├── InvoiceViewer.tsx        # Invoice display and download
│   └── index.ts                 # Component exports
├── services/                    # Backend services
│   ├── stripe.service.ts        # Stripe API integration
│   ├── payment.service.ts       # Business logic layer
│   ├── webhook.service.ts       # Webhook processing
│   └── index.ts                 # Service exports
├── api/webhooks/               # API endpoints
│   └── stripe.ts               # Webhook endpoint implementation
└── types/database.ts           # TypeScript type definitions

supabase/migrations/
└── 20250101000000_payment_system_schema.sql  # Database schema

tests/
├── e2e/payment-flows.spec.ts   # End-to-end payment tests
└── services/__tests__/         # Unit tests for services
```

## 🧪 Testing

### Test Cards (Development)
```typescript
// Use these Stripe test cards in development:
const TEST_CARDS = {
  SUCCESS: '4242424242424242',           // Successful payment
  DECLINED: '4000000000000002',          // Declined payment  
  INSUFFICIENT_FUNDS: '4000000000009995', // Insufficient funds
  AUTHENTICATION: '4000002760003184',     // Requires 3D Secure
  PROCESSING_ERROR: '4000000000000119'    // Processing error
};
```

### Testing Commands
```bash
# Run unit tests
npm test src/services/__tests__/

# Run E2E tests  
npm run test:e2e tests/e2e/payment-flows.spec.ts

# Run all payment tests
npm run test:payments
```

## 🔒 Security Checklist

Before going to production, ensure:

- [ ] **Environment Variables**: All secrets properly configured
- [ ] **HTTPS**: SSL certificate installed and validated
- [ ] **Webhook Security**: Signature verification enabled
- [ ] **Database Security**: Row-level security policies active
- [ ] **Error Handling**: No sensitive data exposed in errors
- [ ] **Rate Limiting**: Webhook endpoint rate limiting configured
- [ ] **Monitoring**: Error tracking and alerting set up

## 🚨 Common Issues & Solutions

### Payment Form Not Loading
```bash
# Check Stripe publishable key
echo $VITE_STRIPE_PUBLISHABLE_KEY_TEST

# Verify network connectivity
curl -I https://js.stripe.com/v3/
```

### Webhook Not Receiving Events
```bash
# Test webhook endpoint
curl -X POST https://your-domain.com/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# Use Stripe CLI for local testing
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### Database Connection Issues
```bash
# Check Supabase connection
npx supabase status

# Verify migration applied
npx supabase db list
```

## 📊 Monitoring

### Key Metrics to Track
- **Payment Success Rate**: >95% target
- **Webhook Processing Time**: <5 seconds target
- **Error Rate**: <1% target
- **Subscription Churn**: Monthly tracking

### Logging Levels
- **Info**: Successful payments and webhook processing
- **Warning**: Retry attempts and recoverable errors
- **Error**: Failed payments and processing errors
- **Critical**: System failures requiring immediate attention

## 🤝 Contributing

When contributing to the payment system:

1. **Follow Security Guidelines**: Never log sensitive payment data
2. **Test Thoroughly**: Use provided test cards and scenarios
3. **Update Documentation**: Keep docs in sync with code changes
4. **Review Carefully**: Payment code requires extra scrutiny

## 📞 Support

### Internal Support
- **Code Issues**: Check implementation guides and test procedures
- **Configuration**: Review environment setup in setup guide
- **Debugging**: Enable debug mode and check logs

### External Support  
- **Stripe Issues**: Contact Stripe support through dashboard
- **Platform Problems**: Check Stripe status page
- **Integration Questions**: Stripe documentation and community

## 📚 Additional Resources

### External Documentation
- [Stripe API Documentation](https://stripe.com/docs/api)
- [Stripe Elements Guide](https://stripe.com/docs/stripe-js)
- [Webhook Best Practices](https://stripe.com/docs/webhooks/best-practices)
- [PCI Compliance Guide](https://stripe.com/docs/security)

### Related iPEC Documentation
- [Authentication System](../README.md#authentication)
- [Database Schema](../supabase/README.md)
- [Frontend Components](../src/components/README.md)
- [API Reference](../src/api/README.md)

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Maintained By**: iPEC Coach Connect Development Team