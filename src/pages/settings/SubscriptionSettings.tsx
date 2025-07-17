import React from 'react';
import { Container } from '../../components/ui/Container';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { 
  CreditCard,
  Clock,
  Download,
  AlertCircle,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

const plans = [
  {
    name: 'Basic',
    price: 99,
    interval: 'month',
    features: [
      '5 coaching sessions per month',
      'Basic resource library access',
      'Community forum access',
      'Email support',
    ],
  },
  {
    name: 'Professional',
    price: 199,
    interval: 'month',
    features: [
      '10 coaching sessions per month',
      'Full resource library access',
      'Priority community support',
      '24/7 email and phone support',
      'Custom session scheduling',
    ],
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 399,
    interval: 'month',
    features: [
      'Unlimited coaching sessions',
      'Full platform access',
      'Dedicated account manager',
      'Custom integration options',
      'Advanced analytics',
      'Team management tools',
    ],
  },
];

export function SubscriptionSettings() {
  const [currentPlan, setCurrentPlan] = React.useState('Professional');
  const [billingInterval, setBillingInterval] = React.useState('month');

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Container size="sm">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Subscription Settings</h1>
            <p className="text-gray-600 mt-2">
              Manage your subscription plan and billing preferences
            </p>
          </div>

          <Card>
            <Card.Header>
              <h2 className="text-xl font-semibold">Current Plan</h2>
            </Card.Header>
            <Card.Body>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-xl">Professional Plan</h3>
                    <p className="text-gray-600">
                      $199/month • Renews on April 1, 2024
                    </p>
                  </div>
                  <Badge variant="success">Active</Badge>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CreditCard className="h-4 w-4" />
                  <span>Next payment: $199 on April 1, 2024</span>
                </div>

                <div className="p-4 bg-brand-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-brand-600" />
                    <div>
                      <p className="font-medium text-brand-600">
                        Session Credits
                      </p>
                      <p className="text-sm text-brand-600">
                        7 sessions remaining this month
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <h2 className="text-xl font-semibold">Available Plans</h2>
            </Card.Header>
            <Card.Body>
              <div className="space-y-4">
                <div className="flex justify-center mb-8">
                  <div className="bg-gray-100 p-1 rounded-lg inline-flex">
                    <button
                      className={`px-4 py-2 rounded-md ${
                        billingInterval === 'month'
                          ? 'bg-white shadow-sm'
                          : 'text-gray-600'
                      }`}
                      onClick={() => setBillingInterval('month')}
                    >
                      Monthly
                    </button>
                    <button
                      className={`px-4 py-2 rounded-md ${
                        billingInterval === 'year'
                          ? 'bg-white shadow-sm'
                          : 'text-gray-600'
                      }`}
                      onClick={() => setBillingInterval('year')}
                    >
                      Yearly
                      <span className="ml-1 text-xs text-green-600">Save 20%</span>
                    </button>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  {plans.map((plan) => (
                    <div
                      key={plan.name}
                      className={`relative border rounded-xl p-6 ${
                        plan.popular
                          ? 'border-brand-500 shadow-lg'
                          : 'border-gray-200'
                      }`}
                    >
                      {plan.popular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <span className="bg-brand-500 text-white text-sm px-3 py-1 rounded-full">
                            Most Popular
                          </span>
                        </div>
                      )}
                      <div className="text-center mb-6">
                        <h3 className="text-xl font-semibold mb-2">
                          {plan.name}
                        </h3>
                        <div className="text-3xl font-bold">
                          ${plan.price}
                          <span className="text-gray-500 text-base font-normal">
                            /{billingInterval}
                          </span>
                        </div>
                      </div>
                      <ul className="space-y-3 mb-6">
                        {plan.features.map((feature) => (
                          <li
                            key={feature}
                            className="flex items-center gap-2 text-sm"
                          >
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Button
                        variant={
                          currentPlan === plan.name ? 'outline' : 'gradient'
                        }
                        className="w-full"
                      >
                        {currentPlan === plan.name
                          ? 'Current Plan'
                          : 'Upgrade Plan'}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <h2 className="text-xl font-semibold">Billing History</h2>
            </Card.Header>
            <Card.Body>
              <div className="space-y-4">
                {[
                  {
                    date: 'March 1, 2024',
                    amount: 199,
                    status: 'paid',
                    invoice: 'INV-2024-003',
                  },
                  {
                    date: 'February 1, 2024',
                    amount: 199,
                    status: 'paid',
                    invoice: 'INV-2024-002',
                  },
                  {
                    date: 'January 1, 2024',
                    amount: 199,
                    status: 'paid',
                    invoice: 'INV-2024-001',
                  },
                ].map((payment) => (
                  <div
                    key={payment.invoice}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{payment.date}</p>
                      <p className="text-sm text-gray-600">
                        {payment.invoice} • ${payment.amount}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<Download className="h-4 w-4" />}
                    >
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <h2 className="text-xl font-semibold">Cancel Subscription</h2>
            </Card.Header>
            <Card.Body>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-red-50 text-red-600 rounded-lg">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">
                      Are you sure you want to cancel your subscription?
                    </p>
                    <p className="text-sm mt-1">
                      Your subscription will remain active until the end of your
                      current billing period. After that, you will lose access to
                      premium features.
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  Cancel Subscription
                </Button>
              </div>
            </Card.Body>
          </Card>
        </div>
      </Container>
    </div>
  );
}