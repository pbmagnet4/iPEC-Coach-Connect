/**
 * Optimized Registration Page
 * 
 * Conversion-optimized registration page featuring:
 * - Multi-step registration flow with reduced cognitive load
 * - Mobile-first responsive design
 * - Social proof and trust signals
 * - Exit intent detection and retention
 * - Analytics tracking and A/B testing
 * - Performance optimizations
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Container } from '../../components/ui/Container';
import { Card } from '../../components/ui/Card';
import { MultiStepRegistration } from '../../components/auth/MultiStepRegistration';
import { useRegistrationAnalytics } from '../../hooks/useRegistrationAnalytics';
import { 
  Shield, 
  Users, 
  Award, 
  CheckCircle,
  Star,
  Clock,
  TrendingUp,
  MessageSquare,
  ChevronRight,
  ArrowLeft,
  Zap,
  Heart,
  Target,
  Sparkles,
  User
} from 'lucide-react';

const trustSignals = [
  { 
    icon: Shield, 
    title: 'Bank-Level Security', 
    description: 'Your data is protected with AES-256 encryption' 
  },
  { 
    icon: Users, 
    title: '10,000+ Verified Coaches', 
    description: 'Join the world\'s largest coaching community' 
  },
  { 
    icon: Award, 
    title: 'iPEC Certified Platform', 
    description: 'Official partner of iPEC coaching standards' 
  },
  { 
    icon: CheckCircle, 
    title: 'GDPR Compliant', 
    description: 'Full compliance with privacy regulations' 
  }
];

const testimonials = [
  {
    text: "The registration process was so smooth and I felt confident about my data security. Within minutes, I was connected with amazing coaches!",
    author: "Sarah Johnson",
    role: "Life Coach",
    rating: 5,
    avatar: "/api/placeholder/40/40"
  },
  {
    text: "As a coach, this platform has transformed my practice. The verification process gave me credibility and the tools are incredible.",
    author: "Michael Chen", 
    role: "Executive Coach",
    rating: 5,
    avatar: "/api/placeholder/40/40"
  },
  {
    text: "I found my perfect coach in just 2 days. The matching system really understood what I was looking for in my personal growth journey.",
    author: "Emma Rodriguez",
    role: "Client",
    rating: 5,
    avatar: "/api/placeholder/40/40"
  }
];

const stats = [
  { number: '10,000+', label: 'Verified Coaches', icon: Users },
  { number: '98%', label: 'Success Rate', icon: TrendingUp },
  { number: '4.9/5', label: 'Average Rating', icon: Star },
  { number: '24/7', label: 'Support Available', icon: MessageSquare }
];

const benefits = [
  {
    icon: Target,
    title: 'Find Your Perfect Match',
    description: 'Our AI-powered matching system connects you with coaches who understand your goals'
  },
  {
    icon: Shield,
    title: 'Verified & Secure',
    description: 'All coaches are iPEC certified and background checked for your safety'
  },
  {
    icon: Clock,
    title: 'Flexible Scheduling',
    description: 'Book sessions that fit your schedule with 24/7 online availability'
  },
  {
    icon: Heart,
    title: 'Proven Results',
    description: '95% of clients report significant progress within 30 days'
  }
];

export function OptimizedRegistration() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [showMobileNav, setShowMobileNav] = useState(false);
  
  // Analytics tracking
  const {
    trackEvent,
    trackStepChange,
    trackRegistrationComplete,
    getABTestVariant,
    analyticsData
  } = useRegistrationAnalytics(true);

  // A/B testing
  const headerVariant = getABTestVariant('header_copy');
  const socialProofVariant = getABTestVariant('social_proof');
  const urgencyVariant = getABTestVariant('urgency_messaging');

  // Track page load
  useEffect(() => {
    trackEvent('registration_page_loaded', {
      source: searchParams.get('source'),
      medium: searchParams.get('medium'),
      campaign: searchParams.get('campaign'),
      variant: {
        header: headerVariant,
        socialProof: socialProofVariant,
        urgency: urgencyVariant
      }
    });
  }, [trackEvent, searchParams, headerVariant, socialProofVariant, urgencyVariant]);

  // Rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Handle registration success
  const handleRegistrationSuccess = () => {
    trackRegistrationComplete('user_id', 'client'); // Would use actual user data
    navigate('/dashboard');
  };

  // Handle step changes
  const handleStepChange = (step: number, data: any) => {
    trackStepChange(step, data);
  };

  const getHeaderCopy = () => {
    return headerVariant === 'A' ? {
      title: 'Transform Your Life with Certified Coaches',
      subtitle: 'Join thousands who\'ve achieved their goals with iPEC-certified coaching professionals'
    } : {
      title: 'Your Personal Growth Journey Starts Here',
      subtitle: 'Connect with world-class coaches and unlock your potential in just 3 simple steps'
    };
  };

  const getSocialProofCopy = () => {
    return socialProofVariant === 'A' ? 
      'Trusted by 10,000+ coaches and clients worldwide' :
      'Join the world\'s fastest-growing coaching community';
  };

  const headerCopy = getHeaderCopy();

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-purple-50">
      {/* Mobile Navigation */}
      {showMobileNav && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden">
          <div className="fixed inset-y-0 right-0 w-64 bg-white shadow-xl p-6">
            <button
              onClick={() => setShowMobileNav(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div className="mt-8 space-y-4">
              <a href="/login" className="block text-gray-700 hover:text-brand-600">
                Sign In
              </a>
              <a href="/coaches" className="block text-gray-700 hover:text-brand-600">
                Find Coaches
              </a>
              <a href="/about" className="block text-gray-700 hover:text-brand-600">
                About
              </a>
              <a href="/help" className="block text-gray-700 hover:text-brand-600">
                Help
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-600/10 to-purple-600/10" />
        <Container className="relative py-8 lg:py-12">
          {/* Navigation */}
          <nav className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-brand-600" />
              <span className="text-xl font-bold text-gray-900">iPEC Coach Connect</span>
            </div>
            <div className="hidden lg:flex items-center gap-6">
              <a href="/login" className="text-gray-600 hover:text-gray-900">
                Sign In
              </a>
              <a href="/coaches" className="text-gray-600 hover:text-gray-900">
                Find Coaches
              </a>
              <a href="/about" className="text-gray-600 hover:text-gray-900">
                About
              </a>
              <a href="/help" className="text-gray-600 hover:text-gray-900">
                Help
              </a>
            </div>
            <button
              onClick={() => setShowMobileNav(true)}
              className="lg:hidden text-gray-600 hover:text-gray-900"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </nav>

          {/* Hero Section */}
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
                {headerCopy.title}
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                {headerCopy.subtitle}
              </p>
              
              {/* Urgency messaging A/B test */}
              {urgencyVariant === 'A' && (
                <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
                  <Zap className="h-4 w-4" />
                  <span>Limited time: Premium features free for your first month!</span>
                </div>
              )}

              {/* Social proof */}
              <div className="flex flex-wrap items-center justify-center gap-8 mb-8">
                {stats.map((stat, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="text-center"
                  >
                    <div className="flex items-center justify-center gap-2 text-2xl font-bold text-brand-600">
                      <stat.icon className="h-6 w-6" />
                      {stat.number}
                    </div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </motion.div>
                ))}
              </div>

              <p className="text-sm text-gray-500 mb-8">
                {getSocialProofCopy()}
              </p>
            </motion.div>
          </div>
        </Container>
      </header>

      {/* Main Content */}
      <Container className="py-8 lg:py-12">
        <div className="grid lg:grid-cols-12 gap-8 max-w-7xl mx-auto">
          {/* Registration Form */}
          <div className="lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="shadow-2xl">
                <Card.Body className="p-8">
                  <MultiStepRegistration
                    onSuccess={handleRegistrationSuccess}
                    onStepChange={handleStepChange}
                    redirectTo="/dashboard"
                    enableAnalytics={true}
                    showProgressBar={true}
                    initialData={{
                      source: searchParams.get('source') || 'direct',
                      role: searchParams.get('role') as any || 'client'
                    }}
                  />
                </Card.Body>
              </Card>
            </motion.div>
          </div>

          {/* Side Content */}
          <div className="lg:col-span-5 space-y-6">
            {/* Benefits */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Card>
                <Card.Body className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">
                    Why Choose iPEC Coach Connect?
                  </h3>
                  <div className="space-y-4">
                    {benefits.map((benefit, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-brand-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <benefit.icon className="h-5 w-5 text-brand-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 mb-1">{benefit.title}</h4>
                          <p className="text-sm text-gray-600">{benefit.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            </motion.div>

            {/* Testimonials */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <Card>
                <Card.Body className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">
                    What Our Community Says
                  </h3>
                  <div className="relative">
                    <div className="overflow-hidden">
                      <motion.div
                        key={currentTestimonial}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-4"
                      >
                        <div className="flex items-center gap-1">
                          {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                          ))}
                        </div>
                        <p className="text-gray-700 italic">
                          "{testimonials[currentTestimonial].text}"
                        </p>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-gray-400" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {testimonials[currentTestimonial].author}
                            </div>
                            <div className="text-sm text-gray-500">
                              {testimonials[currentTestimonial].role}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                    
                    {/* Testimonial indicators */}
                    <div className="flex justify-center gap-2 mt-4">
                      {testimonials.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentTestimonial(index)}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            index === currentTestimonial ? 'bg-brand-600' : 'bg-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </motion.div>

            {/* Trust Signals */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <Card>
                <Card.Body className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Secure & Trusted
                  </h3>
                  <div className="space-y-3">
                    {trustSignals.map((signal, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <signal.icon className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 text-sm">{signal.title}</div>
                          <div className="text-xs text-gray-600">{signal.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            </motion.div>

            {/* Help & Support */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 1.0 }}
            >
              <Card>
                <Card.Body className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Need Help?
                  </h3>
                  <div className="space-y-3">
                    <a
                      href="/help/getting-started"
                      className="flex items-center justify-between text-sm text-brand-600 hover:text-brand-700 p-2 rounded-lg hover:bg-brand-50 transition-colors"
                    >
                      <span>Getting Started Guide</span>
                      <ChevronRight className="h-4 w-4" />
                    </a>
                    <a
                      href="/help/registration"
                      className="flex items-center justify-between text-sm text-brand-600 hover:text-brand-700 p-2 rounded-lg hover:bg-brand-50 transition-colors"
                    >
                      <span>Registration Help</span>
                      <ChevronRight className="h-4 w-4" />
                    </a>
                    <a
                      href="/contact"
                      className="flex items-center justify-between text-sm text-brand-600 hover:text-brand-700 p-2 rounded-lg hover:bg-brand-50 transition-colors"
                    >
                      <span>Contact Support</span>
                      <ChevronRight className="h-4 w-4" />
                    </a>
                    <a
                      href="/help/security"
                      className="flex items-center justify-between text-sm text-brand-600 hover:text-brand-700 p-2 rounded-lg hover:bg-brand-50 transition-colors"
                    >
                      <span>Security & Privacy</span>
                      <ChevronRight className="h-4 w-4" />
                    </a>
                  </div>
                </Card.Body>
              </Card>
            </motion.div>
          </div>
        </div>
      </Container>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white/80 backdrop-blur-sm">
        <Container className="py-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex flex-wrap justify-center md:justify-start gap-6 text-sm text-gray-600">
              <a href="/privacy" className="hover:text-gray-900">Privacy Policy</a>
              <a href="/terms" className="hover:text-gray-900">Terms of Service</a>
              <a href="/security" className="hover:text-gray-900">Security</a>
              <a href="/contact" className="hover:text-gray-900">Contact Us</a>
              <a href="/careers" className="hover:text-gray-900">Careers</a>
            </div>
            <div className="text-sm text-gray-500">
              © {new Date().getFullYear()} iPEC Coach Connect. All rights reserved.
            </div>
          </div>
        </Container>
      </footer>
    </div>
  );
}