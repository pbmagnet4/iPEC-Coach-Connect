# A/B Testing Framework for iPEC Coach Connect

A comprehensive, production-ready A/B testing framework designed to optimize conversion rates and user experience through data-driven experimentation.

## 🎯 Overview

This framework provides:

- **Feature Flag System**: Dynamic feature toggling without deployments
- **Experiment Management**: Multi-variant testing with statistical significance
- **User Experience Testing**: Component-level A/B testing capabilities
- **Analytics Integration**: Real-time experiment performance and conversion tracking
- **Statistical Engine**: Automatic winner detection with configurable confidence levels
- **Visual Dashboard**: Experiment configuration and monitoring interface

## 🏗️ Architecture

### Core Components

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   React Hooks   │  │   Components    │  │   Dashboard     │
│                 │  │                 │  │                 │
│ • useExperiment │  │ • Registration  │  │ • Experiment    │
│ • useFeatureFlag│  │ • Trust Signals │  │   Management    │
│ • useUserContext│  │ • Error Recovery│  │ • Analytics     │
└─────────────────┘  └─────────────────┘  └─────────────────┘
         │                     │                     │
         └─────────────────────┼─────────────────────┘
                               │
┌─────────────────────────────────────────────────────────────┐
│                     Core Services                           │
│                                                             │
│ • abTestingService     • featureFlagsService               │
│ • analyticsService     • userContextService                │
└─────────────────────────────────────────────────────────────┘
                               │
┌─────────────────────────────────────────────────────────────┐
│                     Database Layer                          │
│                                                             │
│ • Experiments          • Assignments                       │
│ • Feature Flags        • Conversions                       │
│ • Analytics Events     • Results Cache                     │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### 1. Database Setup

Run the migration to create the A/B testing schema:

```sql
-- Apply the migration
psql -f supabase/migrations/20240721_create_ab_testing_schema.sql
```

### 2. Initialize Services

```typescript
// In your app initialization
import { abTestingService } from './services/ab-testing.service';
import { featureFlagsService } from './services/feature-flags.service';

// Initialize services
await abTestingService.initialize();
await featureFlagsService.initialize();
```

### 3. Basic A/B Test Setup

```typescript
import { useExperiment } from './hooks/useExperiment';

function LoginButton() {
  const { variant, isActive, trackConversion } = useExperiment('login_cta_test');
  
  const handleClick = () => {
    trackConversion('button_clicked');
    // Navigate to login
  };
  
  if (variant?.name === 'green_button') {
    return (
      <button className="bg-green-500 text-white" onClick={handleClick}>
        {variant.config.buttonText || 'Sign In'}
      </button>
    );
  }
  
  // Control variant
  return (
    <button className="bg-blue-500 text-white" onClick={handleClick}>
      Login
    </button>
  );
}
```

### 4. Feature Flag Usage

```typescript
import { useBooleanFlag } from './hooks/useFeatureFlag';

function Dashboard() {
  const showNewUI = useBooleanFlag('new_dashboard_ui');
  
  return showNewUI ? <NewDashboard /> : <LegacyDashboard />;
}
```

## 📊 Creating Experiments

### Via Dashboard

1. Navigate to `/admin/ab-testing`
2. Click "New Experiment"
3. Configure experiment settings:
   - **Name & Description**: Clear experiment identification
   - **Feature Key**: Unique identifier for the experiment
   - **Variants**: Define control and test variations
   - **Success Metrics**: Primary and secondary conversion goals
   - **Targeting Rules**: User segmentation and traffic allocation
   - **Statistical Configuration**: Confidence levels and sample size

### Programmatically

```typescript
import { abTestingService } from './services/ab-testing.service';

const experiment = await abTestingService.createExperiment({
  name: 'Registration Flow Optimization',
  description: 'Testing multi-step vs single-step registration',
  hypothesis: 'Multi-step registration will reduce form abandonment',
  feature_key: 'registration_flow_test',
  variants: [
    {
      name: 'single_step',
      description: 'Traditional single-step form',
      type: 'control',
      traffic_weight: 50,
      config: { steps: 1 },
      is_control: true
    },
    {
      name: 'multi_step',
      description: 'Progressive multi-step form',
      type: 'variant',
      traffic_weight: 50,
      config: { steps: 3 },
      is_control: false
    }
  ],
  metrics: [
    {
      name: 'registration_completed',
      goal: 'registration',
      description: 'User completes registration',
      is_primary: true,
      target_improvement: 15
    }
  ],
  targeting: [
    {
      criteria: 'new_users',
      conditions: { device_type: 'desktop' }
    }
  ],
  traffic_allocation: 100,
  statistical_config: {
    confidence_level: 0.95,
    power: 0.8,
    minimum_sample_size: 1000,
    minimum_runtime_hours: 168,
    maximum_runtime_days: 30,
    early_stopping: true,
    bayesian_analysis: false
  },
  business_justification: 'Registration is our primary conversion funnel',
  tags: ['registration', 'ux', 'conversion-optimization']
});

// Start the experiment
await abTestingService.startExperiment(experiment.id);
```

## 🎨 Built-in Testing Scenarios

### Registration Flow Optimization

```typescript
import { RegistrationFlowTest } from './components/ab-testing/RegistrationFlowTest';

// Tests: single-step, multi-step, trust-focused, social-proof, simplified
function RegistrationPage() {
  return <RegistrationFlowTest />;
}
```

**Available Variants:**
- `single_step`: Traditional one-page registration
- `multi_step`: Progressive 3-step registration
- `trust_focused`: Enhanced trust signals with guarantees
- `social_proof`: Testimonials and user counts
- `simplified`: Minimal friction approach

### CTA Button Testing

```typescript
import { RegistrationCTATest } from './components/ab-testing/RegistrationFlowTest';

// Tests different button styles and messaging
function HeroSection() {
  return (
    <div className="text-center">
      <h1>Transform Your Life with iPEC Coaching</h1>
      <RegistrationCTATest className="mt-6" />
    </div>
  );
}
```

**Available Variants:**
- `control`: Standard "Get Started" button
- `urgency`: "Start Today - Limited Spots!"
- `benefit_focused`: "Find My Perfect Coach"
- `social_proof`: "Join 10,000+ Success Stories"
- `free_emphasis`: "Start Free Trial"

### Trust Signals Testing

```typescript
import { HeroTrustSignalsTest } from './components/ab-testing/TrustSignalsTest';

// Tests different trust signal presentations
function HomePage() {
  return (
    <div>
      <HeroSection />
      <HeroTrustSignalsTest />
      <FeaturedCoaches />
    </div>
  );
}
```

**Available Variants:**
- `stats_heavy`: Numbers and statistics focus
- `badge_focused`: Certification and security badges
- `testimonial_focused`: Customer testimonials
- `security_focused`: Privacy and compliance emphasis
- `media_mentions`: Press and media features

### Error Recovery Testing

```typescript
import { RegistrationErrorRecoveryTest } from './components/ab-testing/ErrorRecoveryTest';

function RegistrationForm() {
  const [error, setError] = useState(null);
  
  return (
    <div>
      <form onSubmit={handleSubmit}>
        {/* Form fields */}
      </form>
      
      {error && (
        <RegistrationErrorRecoveryTest 
          error={error}
          onRetry={() => setError(null)}
        />
      )}
    </div>
  );
}
```

**Available Variants:**
- `helpful_guidance`: Contextual help and tips
- `empathetic_support`: Friendly tone with support options
- `alternative_options`: Multiple recovery paths
- `incentive_recovery`: Special offers to continue
- `progressive_disclosure`: Expandable help sections

## 🔧 Advanced Usage

### Custom Experiments with Typed Variants

```typescript
type CheckoutVariant = 'single_page' | 'multi_step' | 'express_checkout';

function CheckoutFlow() {
  const { variant, trackConversion } = useTypedExperiment<CheckoutVariant>('checkout_optimization');
  
  const handlePurchase = (amount: number) => {
    trackConversion('purchase_completed', amount);
  };
  
  switch (variant) {
    case 'express_checkout':
      return <ExpressCheckout onPurchase={handlePurchase} />;
    case 'multi_step':
      return <MultiStepCheckout onPurchase={handlePurchase} />;
    default:
      return <StandardCheckout onPurchase={handlePurchase} />;
  }
}
```

### Multiple Flag Evaluation

```typescript
import { useMultipleFlags } from './hooks/useFeatureFlag';

function Dashboard() {
  const flags = useMultipleFlags({
    newUI: { key: 'new_dashboard_ui', defaultValue: false },
    darkMode: { key: 'dark_mode', defaultValue: false },
    analytics: { key: 'advanced_analytics', defaultValue: false }
  });
  
  return (
    <div className={flags.darkMode ? 'dark-theme' : 'light-theme'}>
      {flags.newUI ? (
        <NewDashboard showAnalytics={flags.analytics} />
      ) : (
        <LegacyDashboard />
      )}
    </div>
  );
}
```

### Winner Auto-Detection

```typescript
import { useOptimizedExperiment } from './hooks/useExperiment';

function OptimizedComponent() {
  const { variant, isWinnerDeclared, winnerVariant } = useOptimizedExperiment('pricing_test');
  
  // Once winner is declared, all users see the winning variant
  if (isWinnerDeclared) {
    return <WinnerComponent variant={winnerVariant} />;
  }
  
  return <TestComponent variant={variant} />;
}
```

## 📈 Analytics & Monitoring

### Conversion Tracking

```typescript
const { trackConversion } = useExperiment('onboarding_flow');

// Simple conversion
trackConversion('step_completed');

// Conversion with value
trackConversion('purchase', 99.99);

// Conversion with properties
trackConversion('form_submitted', 1, {
  form_type: 'contact',
  field_count: 5,
  completion_time: 45
});
```

### Funnel Analysis

```typescript
import { analyticsService } from './services/analytics.service';

// Track funnel progression
analyticsService.trackFunnelStep(
  'registration_funnel',
  'email_entered',
  1,
  userContext,
  { experimentId: 'reg_test', variantId: 'multi_step' }
);
```

### Statistical Monitoring

```typescript
// Get experiment summary with recommendations
const summary = await abTestingService.getExperimentSummary('experiment_id');

console.log('Status:', summary.status);
console.log('Results:', summary.results);
console.log('Recommendation:', summary.recommendations);

if (summary.status.significance_achieved) {
  console.log('Winner:', summary.status.winner_variant_id);
}
```

## 🎯 User Targeting

### Segment Configuration

```typescript
const targetingRules = [
  {
    criteria: 'new_users',
    conditions: {
      device_type: 'mobile',
      location: ['US', 'CA', 'UK']
    }
  },
  {
    criteria: 'premium_users',
    conditions: {
      subscription_tier: 'premium',
      custom_attributes: {
        engagement_score: { gte: 80 }
      }
    }
  }
];
```

### Custom User Context

```typescript
import { useUserContext } from './hooks/useUserContext';

function CustomExperiment() {
  const userContext = useUserContext();
  
  // Override user context for testing
  const customContext = {
    ...userContext,
    user_properties: {
      ...userContext.user_properties,
      subscription_tier: 'premium'
    }
  };
  
  const { variant } = useExperiment('premium_features_test', {
    userContext: customContext
  });
  
  return <PremiumFeatures variant={variant} />;
}
```

## 📱 Device & Platform Testing

### Responsive Experiments

```typescript
function ResponsiveTest() {
  const { variant } = useExperiment('mobile_navigation_test');
  const { isMobileUser } = useUserSegments();
  
  if (isMobileUser && variant?.name === 'bottom_nav') {
    return <BottomNavigation />;
  }
  
  return <TopNavigation />;
}
```

### Platform-Specific Variants

```typescript
// Target mobile users specifically
const mobileExperiment = await abTestingService.createExperiment({
  // ... other config
  targeting: [
    {
      criteria: 'mobile_users',
      conditions: { device_type: 'mobile' }
    }
  ]
});
```

## 🔒 Security & Privacy

### Data Protection

- **User Consent**: Respect user privacy preferences
- **Data Anonymization**: Personal data is anonymized in analytics
- **GDPR Compliance**: Right to erasure and data portability
- **Secure Storage**: All data encrypted at rest and in transit

### Access Control

```sql
-- Admin access to all experiments
GRANT ALL ON ab_experiments TO admin_role;

-- Read-only access for analysts
GRANT SELECT ON experiment_performance TO analyst_role;

-- Service role for automated systems
GRANT INSERT ON ab_analytics_events TO service_role;
```

## 🚦 Performance Considerations

### Caching Strategy

- **Experiment Cache**: 5-minute TTL for active experiments
- **Assignment Cache**: Session-based caching for user assignments
- **Feature Flag Cache**: 3-minute TTL with real-time updates
- **Results Cache**: Pre-calculated statistical results

### Optimization Tips

1. **Minimize API Calls**: Batch flag evaluations when possible
2. **Use Fallbacks**: Always provide default values
3. **Async Loading**: Load experiments asynchronously
4. **Database Indexing**: Ensure proper indexes for queries

```typescript
// Batch evaluation for better performance
const flags = await featureFlagsService.evaluateFlags([
  'new_ui', 'dark_mode', 'premium_features'
], userContext);
```

## 📊 Best Practices

### Experiment Design

1. **Clear Hypothesis**: State specific, measurable predictions
2. **Single Variable**: Test one change at a time
3. **Sufficient Sample Size**: Ensure statistical power
4. **Runtime Duration**: Allow for weekly patterns
5. **Success Metrics**: Define primary and secondary goals

### Implementation Guidelines

1. **Graceful Fallbacks**: Handle service failures gracefully
2. **Performance Impact**: Minimize loading time impact
3. **User Experience**: Avoid jarring variant switches
4. **Error Handling**: Provide helpful error messages
5. **Analytics Integration**: Track meaningful conversion events

### Statistical Rigor

1. **Pre-experiment Planning**: Calculate required sample sizes
2. **Avoid P-hacking**: Don't stop tests early without cause
3. **Multiple Testing**: Adjust for multiple comparisons
4. **Practical Significance**: Consider business impact, not just statistical significance

## 🔍 Troubleshooting

### Common Issues

**Experiment not starting:**
```typescript
// Check experiment status and configuration
const experiment = await abTestingService.getExperiment('experiment_id');
console.log('Status:', experiment.status);
console.log('Variants:', experiment.variants);
```

**Users not being assigned:**
```typescript
// Debug user assignment
const assignment = await abTestingService.getAssignment('experiment_id', userContext);
console.log('Assignment:', assignment);

// Check targeting rules
const matchesTargeting = experiment.targeting.every(rule => {
  // Debug targeting logic
});
```

**Conversions not tracking:**
```typescript
// Verify user assignment before tracking
if (assignment) {
  trackConversion('conversion_name', value, properties);
} else {
  console.warn('User not in experiment, conversion not tracked');
}
```

### Debug Mode

```typescript
// Enable debug logging
const { variant } = useExperiment('test_experiment', {
  debug: true // Logs assignment and conversion events
});
```

## 📚 API Reference

### Core Services

- [`abTestingService`](./src/services/ab-testing.service.ts) - Experiment management and user assignment
- [`featureFlagsService`](./src/services/feature-flags.service.ts) - Feature flag evaluation and management
- [`analyticsService`](./src/services/analytics.service.ts) - Event tracking and conversion analytics

### React Hooks

- [`useExperiment`](./src/hooks/useExperiment.ts) - A/B test variant assignment and tracking
- [`useFeatureFlag`](./src/hooks/useFeatureFlag.ts) - Feature flag evaluation
- [`useUserContext`](./src/hooks/useUserContext.ts) - User context for targeting and segmentation

### Components

- [`ExperimentDashboard`](./src/components/ab-testing/ExperimentDashboard.tsx) - Admin interface for experiment management
- [`RegistrationFlowTest`](./src/components/ab-testing/RegistrationFlowTest.tsx) - Pre-built registration optimization tests
- [`TrustSignalsTest`](./src/components/ab-testing/TrustSignalsTest.tsx) - Trust signal optimization components
- [`ErrorRecoveryTest`](./src/components/ab-testing/ErrorRecoveryTest.tsx) - Error message and recovery flow tests

### Database Schema

- [`ab_experiments`](./supabase/migrations/20240721_create_ab_testing_schema.sql) - Experiment definitions and configuration
- [`ab_assignments`](./supabase/migrations/20240721_create_ab_testing_schema.sql) - User-to-variant assignments
- [`ab_conversions`](./supabase/migrations/20240721_create_ab_testing_schema.sql) - Conversion event tracking
- [`feature_flags`](./supabase/migrations/20240721_create_ab_testing_schema.sql) - Feature flag definitions and values

## 🎉 Success Metrics

The framework is designed to help optimize key iPEC Coach Connect metrics:

### Primary Conversions
- **User Registration**: Sign-up completion rate
- **Coach Booking**: Session booking conversion
- **Profile Completion**: User onboarding completion
- **Subscription**: Premium tier upgrades

### Secondary Metrics
- **User Engagement**: Session duration, page views
- **Trust Indicators**: Trust signal interaction rates
- **Error Recovery**: Error-to-success conversion rates
- **Feature Adoption**: New feature usage rates

### Business Impact
- **Customer Acquisition Cost (CAC)**: Reduced through better conversion
- **Lifetime Value (LTV)**: Increased through better onboarding
- **Retention Rates**: Improved through optimized user experience
- **Support Requests**: Reduced through better error handling

---

Built with ❤️ for iPEC Coach Connect - Transforming lives through data-driven optimization.