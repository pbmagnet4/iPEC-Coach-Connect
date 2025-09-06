import React from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  CheckCircle, 
  Compass, 
  Heart,
  Star,
  Target,
  Users
} from 'lucide-react';
import { Container } from '../../components/ui/Container';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

const coachingBenefits = [
  {
    icon: Target,
    title: 'Clarity & Focus',
    description: 'Gain clarity on your goals and develop laser focus on what matters most to you.',
  },
  {
    icon: Users,
    title: 'Personal Growth',
    description: 'Unlock your potential and develop the skills needed to create lasting change.',
  },
  {
    icon: Compass,
    title: 'Direction & Purpose',
    description: 'Discover your true purpose and create a roadmap to achieve your vision.',
  },
  {
    icon: Heart,
    title: 'Work-Life Balance',
    description: 'Learn to balance your professional and personal life for greater fulfillment.',
  },
];

const coachingProcess = [
  {
    step: 1,
    title: 'Discovery',
    description: 'Explore your current situation, challenges, and desired outcomes.',
  },
  {
    step: 2,
    title: 'Goal Setting',
    description: 'Define clear, actionable goals that align with your values and vision.',
  },
  {
    step: 3,
    title: 'Action Planning',
    description: 'Create a structured plan with specific steps to achieve your goals.',
  },
  {
    step: 4,
    title: 'Support & Growth',
    description: 'Receive ongoing support, accountability, and guidance on your journey.',
  },
];

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'Executive',
    content: 'Coaching helped me gain the confidence to pursue my leadership goals and create better work-life balance.',
    rating: 5,
  },
  {
    name: 'Michael Chen',
    role: 'Entrepreneur',
    content: 'The clarity and focus I gained through coaching was instrumental in growing my business.',
    rating: 5,
  },
  {
    name: 'Emily Rodriguez',
    role: 'Manager',
    content: 'I discovered my authentic leadership style and learned to navigate challenging conversations.',
    rating: 5,
  },
];

export function AboutCoaching() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Container>
        {/* Header */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold mb-4">About Professional Coaching</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover how professional coaching can transform your personal and professional life. 
            Our certified iPEC coaches are here to guide you on your journey to success.
          </p>
        </motion.div>

        {/* What is Coaching */}
        <motion.div 
          className="mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Card>
            <Card.Body className="text-center p-8">
              <h2 className="text-3xl font-bold mb-6">What is Professional Coaching?</h2>
              <p className="text-lg text-gray-600 max-w-4xl mx-auto mb-8">
                Professional coaching is a collaborative partnership between you and a certified coach 
                designed to help you unlock your potential, achieve your goals, and create positive change 
                in your life. Unlike therapy, which often focuses on the past, coaching is forward-looking 
                and action-oriented, helping you bridge the gap between where you are now and where you want to be.
              </p>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="text-left">
                  <h3 className="text-xl font-semibold mb-4">Coaching Focuses On:</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Goal achievement and action planning</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Personal and professional development</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Overcoming obstacles and limiting beliefs</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Building confidence and self-awareness</span>
                    </li>
                  </ul>
                </div>
                <div className="text-left">
                  <h3 className="text-xl font-semibold mb-4">Common Coaching Areas:</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>Leadership and executive development</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>Career transitions and advancement</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>Work-life balance and wellness</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>Communication and relationship skills</span>
                    </li>
                  </ul>
                </div>
              </div>
            </Card.Body>
          </Card>
        </motion.div>

        {/* Benefits */}
        <motion.div 
          className="mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Benefits of Professional Coaching</h2>
            <p className="text-lg text-gray-600">
              Discover how coaching can transform your personal and professional life
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {coachingBenefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
              >
                <Card hover className="text-center h-full">
                  <Card.Body className="p-6">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-lg w-fit mx-auto mb-4">
                      <benefit.icon className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">{benefit.title}</h3>
                    <p className="text-gray-600">{benefit.description}</p>
                  </Card.Body>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Coaching Process */}
        <motion.div 
          className="mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Card>
            <Card.Body className="p-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-4">The Coaching Process</h2>
                <p className="text-lg text-gray-600">
                  A structured approach to help you achieve your goals
                </p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {coachingProcess.map((step, index) => (
                  <div key={step.step} className="text-center">
                    <div className="relative mb-4">
                      <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg mx-auto">
                        {step.step}
                      </div>
                      {index < coachingProcess.length - 1 && (
                        <ArrowRight className="hidden lg:block absolute top-1/2 -translate-y-1/2 left-full ml-4 h-6 w-6 text-gray-400" />
                      )}
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                    <p className="text-gray-600">{step.description}</p>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </motion.div>

        {/* Testimonials */}
        <motion.div 
          className="mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">What Our Clients Say</h2>
            <p className="text-lg text-gray-600">
              Real stories from people who have transformed their lives through coaching
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
              >
                <Card hover className="h-full">
                  <Card.Body className="p-6">
                    <div className="flex mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <p className="text-gray-600 mb-4 italic">"{testimonial.content}"</p>
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-gray-500">{testimonial.role}</div>
                    </div>
                  </Card.Body>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <Card>
            <Card.Body className="p-8">
              <h2 className="text-3xl font-bold mb-4">Ready to Start Your Coaching Journey?</h2>
              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                Connect with one of our certified iPEC coaches and take the first step 
                toward achieving your personal and professional goals.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  variant="gradient" 
                  size="lg"
                  href="/coaches"
                >
                  Find Your Coach
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  href="/coaching-resources"
                >
                  Explore Resources
                </Button>
              </div>
            </Card.Body>
          </Card>
        </motion.div>
      </Container>
    </div>
  );
}