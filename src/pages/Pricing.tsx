import React from 'react';
import { motion } from 'framer-motion';
import { 
  Check,
  Star,
  Shield,
  Clock,
  Users,
  ArrowRight,
  HelpCircle,
  Calendar,
  MessageSquare,
  Video,
  FileText,
  Award,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { Container } from '../components/ui/Container';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

const coachPlans = [
  {
    name: 'Basic',
    description: 'Perfect for new coaches starting their practice',
    price: 29,
    interval: 'month',
    features: [
      'Profile creation',
      'Basic client management tools',
      'Up to 10 bookings per month',
      'Standard support',
    ],
    limitations: [
      'Limited analytics',
      'No featured placement',
      'Basic resource access',
    ],
    cta: 'Start Free Trial',
    popular: false,
  },
  {
    name: 'Professional',
    description: 'Ideal for growing coaching practices',
    price: 79,
    interval: 'month',
    features: [
      'All Basic features',
      'Unlimited bookings',
      'Advanced analytics dashboard',
      'Priority support',
      'Community forum access',
      'Marketing tools',
      'Custom scheduling',
    ],
    cta: 'Select Plan',
    popular: true,
  },
  {
    name: 'Premium',
    description: 'For established coaches and practices',
    price: 149,
    interval: 'month',
    features: [
      'All Professional features',
      'Featured placement',
      'Custom branding',
      'API access',
      'Dedicated account manager',
      '1-on-1 business coaching',
      'Advanced integrations',
    ],
    cta: 'Select Plan',
    popular: false,
  },
];

const clientPlans = [
  {
    name: 'Pay Per Session',
    description: 'Flexible coaching on your terms',
    price: 'Varies',
    features: [
      'Book sessions with any coach',
      'No monthly commitment',
      'Access to basic resources',
      'Community access',
    ],
    cta: 'Get Started',
  },
  {
    name: 'Membership',
    description: 'Best value for regular coaching',
    price: 9.99,
    interval: 'month',
    features: [
      'Discounted session rates',
      'Unlimited coach matching',
      'Full resource library access',
      'Priority support',
      'Exclusive content',
      'Group coaching sessions',
    ],
    popular: true,
    cta: 'Start Free Trial',
  },
];

const testimonials = [
  {
    id: 1,
    name: 'Sarah Miller',
    role: 'Executive Coach',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80',
    quote: 'iPEC Coach Connect has transformed my coaching practice. The platform makes it easy to manage clients and grow my business.',
    rating: 5,
  },
  {
    id: 2,
    name: 'Michael Chen',
    role: 'Leadership Coach',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80',
    quote: 'The professional plan provides everything I need to run my coaching practice efficiently. The ROI has been exceptional.',
    rating: 5,
  },
];

const features = [
  {
    icon: Shield,
    title: 'Secure Platform',
    description: 'Enterprise-grade security for all your coaching sessions and data',
  },
  {
    icon: Clock,
    title: 'Flexible Scheduling',
    description: 'Easy booking system that works across all time zones',
  },
  {
    icon: Users,
    title: 'Growing Community',
    description: 'Join a network of certified coaches and motivated clients',
  },
  {
    icon: Award,
    title: 'Quality Assurance',
    description: 'All coaches are certified and regularly evaluated',
  },
];

const faqs = [
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards, PayPal, and bank transfers. All payments are processed securely through our payment partners.',
  },
  {
    question: 'Can I change plans later?',
    answer: 'Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.',
  },
  {
    question: 'Is there a contract or commitment?',
    answer: 'No long-term contracts required. All plans are month-to-month and can be cancelled at any time.',
  },
  {
    question: 'What happens if I need to cancel?',
    answer: "You can cancel your subscription at any time. You'll continue to have access until the end of your current billing period.",
  },
];

export function Pricing() {
  const [selectedTab, setSelectedTab] = React.useState<'coach' | 'client'>('coach');
  const [billingInterval, setBillingInterval] = React.useState<'month' | 'year'>('month');
  const [expandedFaq, setExpandedFaq] = React.useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <Container className="py-16">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
            <p className="text-xl text-gray-600 mb-8">
              Choose the perfect plan for your coaching journey
            </p>

            {/* Plan Type Selector */}
            <div className="inline-flex p-1 bg-gray-100 rounded-lg">
              <button
                className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedTab === 'coach'
                    ? 'bg-white shadow-sm text-gray-900'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => setSelectedTab('coach')}
              >
                For Coaches
              </button>
              <button
                className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedTab === 'client'
                    ? 'bg-white shadow-sm text-gray-900'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => setSelectedTab('client')}
              >
                For Clients
              </button>
            </div>

            {/* Billing Interval Toggle */}
            {selectedTab === 'coach' && (
              <div className="mt-8 flex justify-center items-center gap-4">
                <span className={`text-sm ${billingInterval === 'month' ? 'text-gray-900' : 'text-gray-500'}`}>
                  Monthly billing
                </span>
                <button
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    billingInterval === 'year' ? 'bg-brand-600' : 'bg-gray-200'
                  }`}
                  onClick={() => setBillingInterval(prev => prev === 'month' ? 'year' : 'month')}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      billingInterval === 'year' ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className={`text-sm ${billingInterval === 'year' ? 'text-gray-900' : 'text-gray-500'}`}>
                  Annual billing
                  <span className="ml-1.5 text-green-600">Save 20%</span>
                </span>
              </div>
            )}
          </div>
        </Container>
      </div>

      {/* Pricing Plans */}
      <Container className="py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {(selectedTab === 'coach' ? coachPlans : clientPlans).map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className={`relative ${plan.popular ? 'border-2 border-brand-500' : ''}`}
                hover
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="success">Most Popular</Badge>
                  </div>
                )}
                <Card.Body className="p-8">
                  <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-6">{plan.description}</p>
                  
                  <div className="mb-6">
                    {typeof plan.price === 'number' ? (
                      <div className="flex items-baseline">
                        <span className="text-4xl font-bold">
                          ${billingInterval === 'year' ? Math.round(plan.price * 0.8) : plan.price}
                        </span>
                        <span className="text-gray-600 ml-2">/{plan.interval}</span>
                      </div>
                    ) : (
                      <div className="text-4xl font-bold">{plan.price}</div>
                    )}
                  </div>

                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                    {plan.limitations?.map((limitation) => (
                      <li key={limitation} className="flex items-start gap-3 text-gray-500">
                        <Check className="h-5 w-5 flex-shrink-0 mt-0.5 opacity-50" />
                        <span>{limitation}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    variant={plan.popular ? 'gradient' : 'outline'}
                    className="w-full"
                    icon={<ArrowRight className="h-5 w-5" />}
                  >
                    {plan.cta}
                  </Button>
                </Card.Body>
              </Card>
            </motion.div>
          ))}
        </div>
      </Container>

      {/* Features */}
      <div className="bg-white py-16">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Everything You Need</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our platform provides all the tools and features you need for a successful coaching practice
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card hover className="text-center h-full">
                    <Card.Body className="p-6">
                      <div className="w-12 h-12 rounded-lg bg-brand-50 flex items-center justify-center mx-auto mb-4">
                        <Icon className="h-6 w-6 text-brand-600" />
                      </div>
                      <h3 className="font-semibold mb-2">{feature.title}</h3>
                      <p className="text-gray-600">{feature.description}</p>
                    </Card.Body>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </Container>
      </div>

      {/* Testimonials */}
      <Container className="py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">What Our Users Say</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Join thousands of satisfied coaches and clients on our platform
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card hover>
                <Card.Body className="p-8">
                  <div className="flex items-center gap-4 mb-4">
                    <img
                      src={testimonial.image}
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="font-semibold">{testimonial.name}</h3>
                      <p className="text-gray-600">{testimonial.role}</p>
                    </div>
                  </div>
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-5 w-5 text-yellow-400 fill-current"
                      />
                    ))}
                  </div>
                  <p className="text-gray-600 italic">"{testimonial.quote}"</p>
                </Card.Body>
              </Card>
            </motion.div>
          ))}
        </div>
      </Container>

      {/* FAQs */}
      <div className="bg-white py-16">
        <Container size="sm">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-gray-600">
              Find answers to common questions about our pricing and plans
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <Card
                key={index}
                hover
                className="cursor-pointer"
                onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
              >
                <Card.Body className="p-6">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold">{faq.question}</h3>
                    <button className="text-gray-500">
                      {expandedFaq === index ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {expandedFaq === index && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="text-gray-600 mt-4"
                    >
                      {faq.answer}
                    </motion.p>
                  )}
                </Card.Body>
              </Card>
            ))}
          </div>
        </Container>
      </div>

      {/* CTA */}
      <Container className="py-16">
        <Card className="bg-gradient-to-br from-brand-600 to-blue-600 text-white">
          <Card.Body className="p-12">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-brand-50 mb-8">
                Join iPEC Coach Connect today and take your coaching journey to the next level
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button
                  variant="gradient"
                  size="lg"
                  href="/get-started"
                  icon={<ArrowRight className="h-5 w-5" />}
                >
                  Get Started Now
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  href="/contact"
                  className="text-white border-white hover:bg-white/10"
                >
                  Contact Sales
                </Button>
              </div>
            </div>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}