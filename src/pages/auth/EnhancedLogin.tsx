/**
 * Enhanced Login Page for iPEC Coach Connect
 * 
 * Provides a comprehensive authentication experience with:
 * - Enhanced UI with progress indication and better UX
 * - Comprehensive error handling with recovery guidance
 * - Security features and trust signals
 * - Mobile-optimized responsive design
 * - Accessibility improvements
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Container } from '../../components/ui/Container';
import { Card } from '../../components/ui/Card';
import { EnhancedAuthForm } from '../../components/auth/EnhancedAuthForm';
import { 
  Award, 
  CheckCircle, 
  LogIn, 
  Shield,
  Star,
  Users 
} from 'lucide-react';

type AuthMode = 'signin' | 'signup' | 'reset';

const trustSignals = [
  { icon: Shield, text: 'Bank-level security' },
  { icon: Users, text: '10,000+ verified coaches' },
  { icon: Award, text: 'iPEC certified platform' },
  { icon: CheckCircle, text: 'GDPR compliant' }
];

const testimonials = [
  {
    text: "iPEC Coach Connect transformed my coaching practice. The platform is intuitive and my clients love the experience.",
    author: "Sarah Johnson",
    role: "Professional Coach",
    rating: 5
  },
  {
    text: "Finding the right coach was so easy. The matching system really understood what I was looking for.",
    author: "Michael Chen",
    role: "Client",
    rating: 5
  }
];

export function EnhancedLogin() {
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState<AuthMode>('signin');

  const handleAuthSuccess = () => {
    navigate('/dashboard');
  };

  const getPageTitle = () => {
    switch (authMode) {
      case 'signin': return 'Welcome Back';
      case 'signup': return 'Join iPEC Coach Connect';
      case 'reset': return 'Reset Your Password';
      default: return 'Authentication';
    }
  };

  const getPageDescription = () => {
    switch (authMode) {
      case 'signin': return 'Sign in to access your coaching dashboard';
      case 'signup': return 'Start your coaching journey with us today';
      case 'reset': return 'We\'ll send you instructions to reset your password';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-blue-50">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-600/10 to-blue-600/10" />
        <Container className="relative py-12">
          <div className="text-center mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <LogIn className="h-12 w-12 text-brand-600 mx-auto mb-4" />
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                {getPageTitle()}
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                {getPageDescription()}
              </p>
            </motion.div>
          </div>
        </Container>
      </div>

      {/* Main Content */}
      <Container className="py-8">
        <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Authentication Form */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="shadow-xl">
                <Card.Body className="p-8">
                  <EnhancedAuthForm
                    mode={authMode}
                    onModeChange={setAuthMode}
                    onSuccess={handleAuthSuccess}
                    redirectTo="/dashboard"
                  />
                </Card.Body>
              </Card>
            </motion.div>
          </div>

          {/* Side Content */}
          <div className="space-y-6">
            {/* Trust Signals */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Card>
                <Card.Body className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Trusted by Thousands
                  </h3>
                  <div className="space-y-3">
                    {trustSignals.map((signal, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <signal.icon className="h-4 w-4 text-green-600" />
                        </div>
                        <span className="text-sm text-gray-700">{signal.text}</span>
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
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    What Our Users Say
                  </h3>
                  <div className="space-y-6">
                    {testimonials.map((testimonial, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center gap-1">
                          {[...Array(testimonial.rating)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                          ))}
                        </div>
                        <p className="text-sm text-gray-700 italic">
                          "{testimonial.text}"
                        </p>
                        <div className="text-xs text-gray-500">
                          <div className="font-medium">{testimonial.author}</div>
                          <div>{testimonial.role}</div>
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
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <Card>
                <Card.Body className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Need Help?
                  </h3>
                  <div className="space-y-3 text-sm">
                    <a
                      href="/help/getting-started"
                      className="block text-brand-600 hover:text-brand-700"
                    >
                      Getting Started Guide
                    </a>
                    <a
                      href="/help/troubleshooting"
                      className="block text-brand-600 hover:text-brand-700"
                    >
                      Login Troubleshooting
                    </a>
                    <a
                      href="/contact"
                      className="block text-brand-600 hover:text-brand-700"
                    >
                      Contact Support
                    </a>
                    <a
                      href="/help/security"
                      className="block text-brand-600 hover:text-brand-700"
                    >
                      Security & Privacy
                    </a>
                  </div>
                </Card.Body>
              </Card>
            </motion.div>
          </div>
        </div>
      </Container>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white/50 backdrop-blur-sm">
        <Container className="py-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex space-x-6 text-sm text-gray-600">
              <a href="/privacy" className="hover:text-gray-900">
                Privacy Policy
              </a>
              <a href="/terms" className="hover:text-gray-900">
                Terms of Service
              </a>
              <a href="/security" className="hover:text-gray-900">
                Security
              </a>
              <a href="/contact" className="hover:text-gray-900">
                Contact Us
              </a>
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