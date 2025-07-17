import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, ToggleLeft as Google, ChevronRight, User, AlertCircle, CheckCircle } from 'lucide-react';
import { Container } from '../../components/ui/Container';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { GoogleSignInButton } from '../../components/GoogleSignInButton';

export function GetStarted() {
  const navigate = useNavigate();
  const [userType, setUserType] = useState<'client' | 'coach'>('client');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
    terms?: string;
  }>({});

  const validateForm = () => {
    const newErrors: typeof errors = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/.test(formData.password)) {
      newErrors.password = 'Password must include uppercase, lowercase, and numbers';
    }

    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Terms validation
    if (!formData.agreeToTerms) {
      newErrors.terms = 'You must agree to the Terms of Service';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      // Here you would typically make an API call to create the account
      // For now, we'll simulate success and redirect
      navigate('/onboarding');
    } catch (error) {
      setErrors({
        ...errors,
        email: 'An error occurred. Please try again.',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-blue-50 py-12">
      <Container size="sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Get Started with iPEC Coach Connect</h1>
          <p className="text-gray-600">
            Join our community of coaches and clients
          </p>
        </div>

        <Card>
          <Card.Body className="p-8">
            <div className="flex gap-4 mb-8">
              <Button
                variant={userType === 'client' ? 'gradient' : 'outline'}
                className="flex-1"
                onClick={() => setUserType('client')}
              >
                I'm Looking for a Coach
              </Button>
              <Button
                variant={userType === 'coach' ? 'gradient' : 'outline'}
                className="flex-1"
                onClick={() => setUserType('coach')}
              >
                I'm a Coach
              </Button>
            </div>

            <div className="mb-6">
              <GoogleSignInButton
                label={`Sign up with Google as ${userType === 'coach' ? 'a Coach' : 'a Client'}`}
                onError={(error) => setErrors({ ...errors, email: error.message })}
                redirectTo="/onboarding"
              />
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-4 text-sm text-gray-500">
                  Or continue with email
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                type="email"
                label="Email Address"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                error={errors.email}
                icon={<Mail className="h-5 w-5" />}
                placeholder="Enter your email"
                required
              />

              <Input
                type="password"
                label="Password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                error={errors.password}
                icon={<Lock className="h-5 w-5" />}
                placeholder="Create a password"
                required
              />

              <Input
                type="password"
                label="Confirm Password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                error={errors.confirmPassword}
                icon={<Lock className="h-5 w-5" />}
                placeholder="Re-enter your password"
                required
              />

              <div className="space-y-2">
                <label className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={formData.agreeToTerms}
                    onChange={(e) => setFormData(prev => ({ ...prev, agreeToTerms: e.target.checked }))}
                    className="mt-1 rounded text-brand-600 focus:ring-brand-500"
                  />
                  <span className="text-sm text-gray-600">
                    I agree to the{' '}
                    <a href="/terms" className="text-brand-600 hover:text-brand-700">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="/privacy" className="text-brand-600 hover:text-brand-700">
                      Privacy Policy
                    </a>
                  </span>
                </label>
                {errors.terms && (
                  <p className="text-sm text-red-500">{errors.terms}</p>
                )}
              </div>

              <Button
                type="submit"
                variant="gradient"
                className="w-full"
                icon={<ChevronRight className="h-5 w-5" />}
              >
                Create Account
              </Button>
            </form>

            <p className="text-center mt-6 text-sm text-gray-600">
              Already have an account?{' '}
              <a
                href="/login"
                className="text-brand-600 hover:text-brand-700 font-medium"
              >
                Log In
              </a>
            </p>

            <div className="mt-8 flex items-center gap-2 text-sm text-gray-600">
              <AlertCircle className="h-4 w-4" />
              <span>Need help? <a href="/support" className="text-brand-600 hover:text-brand-700">Contact Support</a></span>
            </div>
          </Card.Body>
        </Card>

        <div className="mt-8 text-center space-y-2">
          <div className="flex justify-center space-x-4 text-sm text-gray-600">
            <a href="/privacy" className="hover:text-gray-900">
              Privacy Policy
            </a>
            <a href="/terms" className="hover:text-gray-900">
              Terms of Service
            </a>
            <a href="/contact" className="hover:text-gray-900">
              Contact Us
            </a>
          </div>
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} iPEC Coach Connect. All rights reserved.
          </p>
        </div>
      </Container>
    </div>
  );
}