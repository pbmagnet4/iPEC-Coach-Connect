import React from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowRight,
  Award,
  Calendar,
  CheckCircle,
  ChevronRight,
  Compass,
  MessageSquare,
  Play,
  Search,
  Star,
  Target,
  Users
} from 'lucide-react';
import { Container } from '../components/ui/Container';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

const steps = [
  {
    icon: Search,
    title: 'Find Your Perfect Coach',
    description: 'Browse our network of certified iPEC coaches and find the perfect match for your goals.',
    details: [
      'Advanced matching algorithm',
      'Filter by specialty and experience',
      'Read verified reviews',
      'Compare coaching styles',
    ],
  },
  {
    icon: Calendar,
    title: 'Schedule a Session',
    description: 'Book your first session at a time that works for you, with flexible scheduling options.',
    details: [
      'Easy online booking',
      'Multiple time zones supported',
      'Free initial consultation',
      'Flexible rescheduling',
    ],
  },
  {
    icon: Target,
    title: 'Set Your Goals',
    description: 'Work with your coach to define clear objectives and create an actionable plan.',
    details: [
      'Personalized goal setting',
      'Progress tracking',
      'Regular check-ins',
      'Adjustable milestones',
    ],
  },
  {
    icon: MessageSquare,
    title: 'Begin Your Journey',
    description: 'Start your transformation with regular coaching sessions and ongoing support.',
    details: [
      'Virtual or in-person sessions',
      'Secure communication',
      'Resource library access',
      'Community support',
    ],
  },
];

const features = [
  {
    icon: Users,
    title: 'Expert Coaches',
    description: 'All our coaches are certified through iPEC\'s comprehensive training program.',
  },
  {
    icon: Star,
    title: 'Quality Assurance',
    description: 'We maintain high standards through regular coach evaluations and client feedback.',
  },
  {
    icon: Award,
    title: 'Proven Results',
    description: 'Our coaching methodology is backed by research and proven success stories.',
  },
  {
    icon: Compass,
    title: 'Guided Journey',
    description: 'We support you every step of the way with resources and tools for success.',
  },
];

export function HowItWorks() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative bg-white overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&q=80"
            alt="Coaching background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-900/95 to-brand-800/95" />
        </div>
        
        <Container className="relative py-20">
          <div className="max-w-2xl">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">
              Your Path to Growth and Success
            </h1>
            <p className="text-xl text-brand-50 mb-8 leading-relaxed">
              Discover how iPEC Coach Connect helps you achieve your goals through our proven coaching process.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button
                variant="gradient"
                size="lg"
                href="/get-started"
                icon={<ArrowRight className="h-5 w-5" />}
              >
                Get Started
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="text-white border-white hover:bg-white/10"
                icon={<Play className="h-5 w-5" />}
              >
                Watch Video
              </Button>
            </div>
          </div>
        </Container>
      </div>

      {/* Process Steps */}
      <Container className="py-20">
        <div className="text-center mb-16">
          <Badge variant="default" className="mb-4">Our Process</Badge>
          <h2 className="text-3xl font-bold mb-4">How iPEC Coach Connect Works</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Our simple four-step process makes it easy to find the right coach and start your journey towards achieving your goals.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
              >
                <Card hover>
                  <Card.Body className="p-8">
                    <div className="flex items-start gap-6">
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-blue-500 flex items-center justify-center text-white">
                          <Icon className="h-8 w-8" />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-4 mb-2">
                          <span className="text-4xl font-bold text-brand-600/20">
                            0{index + 1}
                          </span>
                          <h3 className="text-xl font-bold">{step.title}</h3>
                        </div>
                        <p className="text-gray-600 mb-4">{step.description}</p>
                        <ul className="space-y-2">
                          {step.details.map((detail) => (
                            <li key={detail} className="flex items-center gap-2 text-gray-600">
                              <CheckCircle className="h-5 w-5 text-green-500" />
                              <span>{detail}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </Container>

      {/* Features */}
      <div className="bg-white py-20">
        <Container>
          <div className="text-center mb-16">
            <Badge variant="default" className="mb-4">Why Choose Us</Badge>
            <h2 className="text-3xl font-bold mb-4">The iPEC Advantage</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our platform combines expert coaches, proven methodologies, and comprehensive support to ensure your success.
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
                      <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center mx-auto mb-4">
                        <Icon className="h-8 w-8 text-brand-600" />
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

      {/* CTA Section */}
      <Container className="py-20">
        <Card className="bg-gradient-to-br from-brand-600 to-blue-600 text-white">
          <Card.Body className="p-12">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4">
                Ready to Start Your Journey?
              </h2>
              <p className="text-brand-50 mb-8">
                Take the first step towards achieving your goals with iPEC Coach Connect.
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
                  href="/coaches"
                  className="text-white border-white hover:bg-white/10"
                  icon={<ChevronRight className="h-5 w-5" />}
                >
                  Browse Coaches
                </Button>
              </div>
            </div>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}