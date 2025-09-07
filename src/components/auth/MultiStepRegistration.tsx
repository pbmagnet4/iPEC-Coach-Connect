/**
 * Multi-Step Registration Flow - Conversion Optimized
 * 
 * Four-step registration process designed to maximize completion rates:
 * 1. Role & Email (30 seconds) - Minimal friction entry point
 * 2. Secure Your Account (45 seconds) - Password creation with trust signals
 * 3. Complete Profile (60 seconds) - Progressive disclosure with skip options
 * 4. Welcome & Next Steps (instant) - Immediate gratification and guidance
 * 
 * Conversion optimization features:
 * - Progress indicators with completion percentages
 * - Trust signals and security messaging
 * - Social proof elements
 * - Exit intent detection
 * - Mobile-first responsive design
 * - Analytics tracking for each step
 * - Smart field validation with helpful feedback
 */

import React, { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  AlertCircle, 
  ArrowLeft, 
  ArrowRight, 
  Award, 
  Check, 
  CheckCircle, 
  Clock, 
  Crown, 
  Eye, 
  EyeOff, 
  Heart,
  Info,
  Loader2,
  Lock,
  Mail,
  MessageSquare,
  Phone,
  Shield,
  Sparkles,
  Star,
  Target,
  Timer,
  TrendingUp,
  User,
  Users,
  Zap
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { GoogleSignInButton } from '../GoogleSignInButton';
import { authService } from '../../services/auth.service';
import { logSecurity } from '../../lib/secure-logger';
import type { UserRole } from '../../types/database';

interface MultiStepRegistrationProps {
  onSuccess?: () => void;
  onStepChange?: (step: number, data: any) => void;
  redirectTo?: string;
  initialData?: Partial<RegistrationData>;
  showProgressBar?: boolean;
  enableAnalytics?: boolean;
}

interface RegistrationData {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  role: UserRole;
  source: string;
  agreeToTerms: boolean;
  marketingConsent: boolean;
}

type FormErrors = Record<string, string>;

interface StepConfig {
  id: string;
  title: string;
  subtitle: string;
  duration: number;
  icon: React.ComponentType<any>;
  completionMessage: string;
  trustSignal: string;
}

const stepConfigs: StepConfig[] = [
  {
    id: 'role-email',
    title: 'Get Started',
    subtitle: 'Choose your path and enter your email',
    duration: 30,
    icon: Mail,
    completionMessage: 'Great choice! Let\'s secure your account.',
    trustSignal: 'Join 10,000+ coaches and clients worldwide'
  },
  {
    id: 'secure-account',
    title: 'Secure Your Account',
    subtitle: 'Create a strong password to protect your data',
    duration: 45,
    icon: Shield,
    completionMessage: 'Perfect! Your account is secure.',
    trustSignal: 'Bank-level encryption protects your information'
  },
  {
    id: 'complete-profile',
    title: 'Complete Your Profile',
    subtitle: 'Help us personalize your experience',
    duration: 60,
    icon: User,
    completionMessage: 'Almost done! Just one more step.',
    trustSignal: 'Verified profiles get 3x more engagement'
  },
  {
    id: 'welcome',
    title: 'Welcome Aboard!',
    subtitle: 'Your coaching journey begins now',
    duration: 0,
    icon: Sparkles,
    completionMessage: 'Welcome to iPEC Coach Connect!',
    trustSignal: 'You\'re now part of the world\'s largest coaching community'
  }
];

const socialProofStats = [
  { number: '10,000+', label: 'Verified Coaches', icon: Users },
  { number: '98%', label: 'Success Rate', icon: TrendingUp },
  { number: '4.9/5', label: 'Average Rating', icon: Star },
  { number: '50,000+', label: 'Sessions Completed', icon: Heart }
];

const passwordRequirements = [
  { label: 'At least 8 characters', check: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter', check: (p: string) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter', check: (p: string) => /[a-z]/.test(p) },
  { label: 'One number', check: (p: string) => /\d/.test(p) },
  { label: 'One special character', check: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p) }
];

const roleOptions = [
  {
    value: 'client',
    title: 'Find a Coach',
    description: 'Connect with certified iPEC coaches for personal growth',
    icon: Target,
    benefits: ['Personalized coaching', 'Proven frameworks', 'Flexible scheduling'],
    popular: true
  },
  {
    value: 'coach',
    title: 'Become a Coach',
    description: 'Join our network of certified coaching professionals',
    icon: Crown,
    benefits: ['Build your practice', 'Verified credentials', 'Marketing support'],
    popular: false
  }
];

export function MultiStepRegistration({ 
  onSuccess, 
  onStepChange, 
  redirectTo = '/dashboard',
  initialData = {},
  showProgressBar = true,
  enableAnalytics = true
}: MultiStepRegistrationProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<RegistrationData>({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    role: 'client',
    source: 'direct',
    agreeToTerms: false,
    marketingConsent: false,
    ...initialData
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [stepStartTime, setStepStartTime] = useState(Date.now());
  const [completedSteps, setCompletedSteps] = useState<boolean[]>([false, false, false, false]);
  const [isExitIntentActive, setIsExitIntentActive] = useState(false);
  const [showUrgencyMessage, setShowUrgencyMessage] = useState(false);

  // Analytics tracking
  const trackEvent = useCallback((event: string, data: any = {}) => {
    if (!enableAnalytics) return;
    
    // Track with analytics service (would be implemented)
    console.log('Analytics Event:', event, {
      step: currentStep,
      stepId: stepConfigs[currentStep]?.id,
      timeOnStep: Date.now() - stepStartTime,
      ...data
    });
  }, [currentStep, stepStartTime, enableAnalytics]);

  // Exit intent detection
  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && currentStep > 0 && currentStep < 3) {
        setIsExitIntentActive(true);
        trackEvent('exit_intent_detected', { step: currentStep });
      }
    };

  void document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [currentStep, trackEvent]);

  // Urgency messaging
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentStep === 0 && !formData.email) {
        setShowUrgencyMessage(true);
      }
    }, 15000); // Show after 15 seconds of inactivity

    return () => clearTimeout(timer);
  }, [currentStep, formData.email]);

  // Step change tracking
  useEffect(() => {
    setStepStartTime(Date.now());
    trackEvent('step_viewed', { stepId: stepConfigs[currentStep]?.id });
    onStepChange?.(currentStep, formData);
  }, [currentStep, trackEvent, onStepChange, formData]);

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'email':
        if (!value) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email address';
        return '';
      
      case 'password':
        if (!value) return 'Password is required';
        const failedRequirements = passwordRequirements.filter(req => !req.check(value));
        if (failedRequirements.length > 0) {
          return `Password must meet all security requirements`;
        }
        return '';
      
      case 'fullName':
        if (!value) return 'Full name is required';
        if (value.trim().length < 2) return 'Please enter your full name';
        if (!/^[a-zA-Z\s]+$/.test(value)) return 'Please enter a valid name';
        return '';
      
      case 'phone':
        if (value && !/^\+?[\d\s\-\(\)]+$/.test(value)) {
          return 'Please enter a valid phone number';
        }
        return '';
      
      default:
        return '';
    }
  };

  const updateField = (name: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (typeof value === 'string') {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
      
      // Track field interactions
      if (value) {
        trackEvent('field_completed', { field: name, hasError: !!error });
      }
    }
  };

  const validateCurrentStep = (): boolean => {
    const stepFields = getStepFields(currentStep);
    const stepErrors: FormErrors = {};
    
    stepFields.forEach(field => {
      const value = formData[field as keyof RegistrationData];
      const error = validateField(field, value as string);
      if (error) stepErrors[field] = error;
    });

    // Additional validations per step
    if (currentStep === 0 && !formData.role) {
      stepErrors.role = 'Please select your role';
    }
    
    if (currentStep === 2 && !formData.agreeToTerms) {
      stepErrors.agreeToTerms = 'Please accept the terms of service';
    }

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const getStepFields = (step: number): string[] => {
    switch (step) {
      case 0: return ['email', 'role'];
      case 1: return ['password'];
      case 2: return ['fullName'];
      default: return [];
    }
  };

  const getPasswordStrength = (password: string): { strength: number; label: string; color: string } => {
    const passedRequirements = passwordRequirements.filter(req => req.check(password)).length;
    const strength = (passedRequirements / passwordRequirements.length) * 100;
    
    if (strength < 40) return { strength, label: 'Weak', color: 'bg-red-500' };
    if (strength < 80) return { strength, label: 'Fair', color: 'bg-yellow-500' };
    if (strength < 100) return { strength, label: 'Good', color: 'bg-blue-500' };
    return { strength, label: 'Strong', color: 'bg-green-500' };
  };

  const handleNextStep = async () => {
    if (!validateCurrentStep()) {
      trackEvent('validation_failed', { step: currentStep });
      return;
    }

    const timeOnStep = Date.now() - stepStartTime;
    trackEvent('step_completed', { 
      stepId: stepConfigs[currentStep]?.id, 
      timeSpent: timeOnStep,
      expectedTime: stepConfigs[currentStep]?.duration * 1000
    });

    // Mark step as completed
    setCompletedSteps(prev => {
      const newCompleted = [...prev];
      newCompleted[currentStep] = true;
      return newCompleted;
    });

    if (currentStep < stepConfigs.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Final step - create account
      await handleSubmit();
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      trackEvent('step_back', { fromStep: currentStep });
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setErrors({});

    try {
      trackEvent('registration_attempt');
      
      const result = await authService.signUp({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        role: formData.role,
        phone: formData.phone || undefined
      });

      if (result.error) {
        setErrors({ form: result.error.message });
        trackEvent('registration_failed', { error: result.error.message });
      } else {
        trackEvent('registration_successful');
        setCurrentStep(3); // Welcome step
        
        // User will manually proceed using the "Continue" button
        // No automatic redirect - gives user full control
      }
    } catch (error) {
      setErrors({ form: 'An unexpected error occurred. Please try again.' });
      trackEvent('registration_error', { error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                I'm here to:
              </label>
              <div className="space-y-3">
                {roleOptions.map((option) => (
                  <label
                    key={option.value}
                    className={`
                      relative flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all
                      ${formData.role === option.value 
                        ? 'border-brand-500 bg-brand-50' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }
                    `}
                  >
                    <input
                      type="radio"
                      value={option.value}
                      checked={formData.role === option.value}
                      onChange={(e) => updateField('role', e.target.value)}
                      className="sr-only"
                    />
                    <div className="flex items-center gap-3 w-full">
                      <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center
                        ${formData.role === option.value ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-600'}
                      `}>
                        <option.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold text-gray-900">{option.title}</div>
                          {option.popular && (
                            <span className="px-2 py-1 text-xs bg-brand-100 text-brand-700 rounded-full">
                              Most Popular
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">{option.description}</div>
                        <div className="flex items-center gap-4 mt-2">
                          {option.benefits.map((benefit, index) => (
                            <div key={index} className="flex items-center gap-1 text-xs text-gray-500">
                              <Check className="h-3 w-3 text-green-500" />
                              {benefit}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    {formData.role === option.value && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle className="h-5 w-5 text-brand-500" />
                      </div>
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Email Input */}
            <div>
              <Input
                type="email"
                label="Email Address"
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="Enter your email address"
                icon={<Mail className="h-5 w-5" />}
                error={errors.email}
                required
                autoComplete="email"
                className="text-lg"
              />
              {formData.email && !errors.email && (
                <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>Email looks good!</span>
                </div>
              )}
            </div>

            {/* Google Sign-In Option */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-4 text-sm text-gray-500">
                  Or continue with
                </span>
              </div>
            </div>

            <GoogleSignInButton
              onError={(error) => setErrors({ form: error.message })}
              redirectTo={redirectTo}
            />

            {/* Trust Signal */}
            <div className="text-center text-sm text-gray-500">
              <Shield className="h-4 w-4 inline mr-1" />
              {stepConfigs[currentStep].trustSignal}
            </div>
          </motion.div>
        );

      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Security messaging */}
            <div className="text-center bg-green-50 border border-green-200 rounded-lg p-4">
              <Shield className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm text-green-800 font-medium">
                Your data is protected with bank-level encryption
              </p>
            </div>

            {/* Password Input */}
            <div className="space-y-4">
              <Input
                type={showPassword ? 'text' : 'password'}
                label="Create Password"
                value={formData.password}
                onChange={(e) => updateField('password', e.target.value)}
                placeholder="Create a strong password"
                icon={<Lock className="h-5 w-5" />}
                error={errors.password}
                required
                autoComplete="new-password"
                className="text-lg"
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-600 p-1"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                }
              />

              {/* Password strength indicator */}
              {formData.password && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Password strength:</span>
                    <span className={`text-sm font-medium ${
                      getPasswordStrength(formData.password).strength >= 80 ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      {getPasswordStrength(formData.password).label}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrength(formData.password).color}`}
                      style={{ width: `${getPasswordStrength(formData.password).strength}%` }}
                    />
                  </div>
                  
                  {/* Password requirements */}
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    {passwordRequirements.map((req, index) => {
                      const isValid = req.check(formData.password);
                      return (
                        <div key={index} className={`flex items-center gap-2 ${isValid ? 'text-green-600' : 'text-gray-500'}`}>
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            isValid ? 'bg-green-500 border-green-500' : 'border-gray-300'
                          }`}>
                            {isValid && <Check className="h-3 w-3 text-white" />}
                          </div>
                          <span>{req.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Security features */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3 text-sm text-blue-800">
                <Info className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">Your password is secure</p>
                  <p>We use AES-256 encryption and never store passwords in plain text.</p>
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Profile completion benefits */}
            <div className="text-center bg-gradient-to-r from-brand-50 to-purple-50 border border-brand-200 rounded-lg p-4">
              <TrendingUp className="h-8 w-8 text-brand-600 mx-auto mb-2" />
              <p className="text-sm text-brand-800 font-medium">
                Complete profiles get 3x more engagement
              </p>
            </div>

            {/* Full Name */}
            <Input
              type="text"
              label="Full Name"
              value={formData.fullName}
              onChange={(e) => updateField('fullName', e.target.value)}
              placeholder="Enter your full name"
              icon={<User className="h-5 w-5" />}
              error={errors.fullName}
              required
              autoComplete="name"
              className="text-lg"
            />

            {/* Phone Number */}
            <div>
              <Input
                type="tel"
                label="Phone Number (Optional)"
                value={formData.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                placeholder="+1 (555) 123-4567"
                icon={<Phone className="h-5 w-5" />}
                error={errors.phone}
                autoComplete="tel"
                className="text-lg"
              />
              <p className="mt-2 text-sm text-gray-500">
                <Clock className="h-4 w-4 inline mr-1" />
                Optional but helps with scheduling and reminders
              </p>
            </div>

            {/* Terms and Marketing */}
            <div className="space-y-4">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={formData.agreeToTerms}
                  onChange={(e) => updateField('agreeToTerms', e.target.checked)}
                  className="mt-1 text-brand-600 focus:ring-brand-500 rounded"
                  required
                />
                <span className="text-sm text-gray-600">
                  I agree to the{' '}
                  <a href="/terms" className="text-brand-600 hover:text-brand-700 underline">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="/privacy" className="text-brand-600 hover:text-brand-700 underline">
                    Privacy Policy
                  </a>
                </span>
              </label>

              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={formData.marketingConsent}
                  onChange={(e) => updateField('marketingConsent', e.target.checked)}
                  className="mt-1 text-brand-600 focus:ring-brand-500 rounded"
                />
                <span className="text-sm text-gray-600">
                  I'd like to receive helpful tips and updates about coaching (optional)
                </span>
              </label>
            </div>

            {/* Final step encouragement */}
            <div className="text-center bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center justify-center gap-2 text-sm text-yellow-800">
                <Zap className="h-4 w-4" />
                <span>You're almost done! Just one click away from joining thousands of coaches and clients.</span>
              </div>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6"
          >
            <div className="mx-auto w-20 h-20 bg-gradient-to-r from-brand-500 to-purple-500 rounded-full flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-white" />
            </div>
            
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome to iPEC Coach Connect!
              </h3>
              <p className="text-lg text-gray-600 mb-4">
                Your account has been created successfully.
              </p>
              <p className="text-sm text-gray-500">
                We've sent a verification email to <strong>{formData.email}</strong>
              </p>
            </div>

            {/* Next steps */}
            <div className="bg-gradient-to-r from-brand-50 to-purple-50 border border-brand-200 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-4">What's next?</h4>
              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-brand-500 text-white rounded-full flex items-center justify-center text-xs">1</div>
                  <span>Check your email and verify your account</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-brand-500 text-white rounded-full flex items-center justify-center text-xs">2</div>
                  <span>{formData.role === 'client' ? 'Browse and connect with coaches' : 'Complete your coach profile'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-brand-500 text-white rounded-full flex items-center justify-center text-xs">3</div>
                  <span>Start your coaching journey!</span>
                </div>
              </div>
            </div>

            {/* Social proof */}
            <div className="grid grid-cols-2 gap-4">
              {socialProofStats.slice(0, 2).map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-2xl font-bold text-brand-600">{stat.number}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Manual continue button */}
            <div className="pt-4">
              <Button
                onClick={() => onSuccess?.()}
                className="w-full"
                size="lg"
              >
                Continue to Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <p className="text-xs text-gray-500 mt-2">
                Don't forget to check your email to verify your account!
              </p>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  const renderProgressBar = () => {
    if (!showProgressBar) return null;

    const progress = ((currentStep + 1) / stepConfigs.length) * 100;
    const isCompleted = currentStep === stepConfigs.length - 1;

    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Step {currentStep + 1} of {stepConfigs.length}
          </span>
          <span className="text-sm text-gray-500">
            {isCompleted ? 'Complete!' : `${Math.round(progress)}% complete`}
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ease-out ${
              isCompleted ? 'bg-green-500' : 'bg-gradient-to-r from-brand-500 to-purple-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <div className="flex justify-between">
          {stepConfigs.map((step, index) => (
            <div
              key={step.id}
              className={`text-xs transition-colors ${
                index <= currentStep ? 'text-brand-600 font-medium' : 'text-gray-400'
              }`}
            >
              <div className="flex items-center gap-1">
                {completedSteps[index] && index < currentStep && (
                  <CheckCircle className="h-3 w-3 text-green-500" />
                )}
                {step.title}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderExitIntentModal = () => {
    if (!isExitIntentActive) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-lg p-6 max-w-sm mx-4"
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Timer className="h-8 w-8 text-yellow-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Wait! You're almost done
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              You're just {stepConfigs.length - currentStep - 1} step{stepConfigs.length - currentStep - 1 !== 1 ? 's' : ''} away from 
              joining thousands of coaches and clients. Don't lose your progress!
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setIsExitIntentActive(false)}
                className="flex-1"
              >
                Continue
              </Button>
              <Button
                variant="ghost"
                onClick={() => window.location.href = '/'}
                className="flex-1"
              >
                Leave
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      {renderProgressBar()}
      
      {errors.form && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-800">{errors.form}</p>
          </div>
        </div>
      )}

      {showUrgencyMessage && currentStep === 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
        >
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-600" />
            <p className="text-sm text-yellow-800">
              <strong>Limited time:</strong> Join now and get premium features for free during your first month!
            </p>
          </div>
        </motion.div>
      )}

      <div className="space-y-6">
        {/* Step header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            {React.createElement(stepConfigs[currentStep].icon, { className: "h-6 w-6 text-brand-600" })}
            <h2 className="text-2xl font-bold text-gray-900">
              {stepConfigs[currentStep].title}
            </h2>
          </div>
          <p className="text-gray-600">
            {stepConfigs[currentStep].subtitle}
          </p>
          {stepConfigs[currentStep].duration > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              <Clock className="h-4 w-4 inline mr-1" />
              Takes about {stepConfigs[currentStep].duration} seconds
            </p>
          )}
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <div key={currentStep}>
            {renderStepContent()}
          </div>
        </AnimatePresence>

        {/* Navigation */}
        {currentStep < 3 && (
          <div className="flex gap-3">
            {currentStep > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevStep}
                icon={<ArrowLeft className="h-4 w-4" />}
                className="flex-1"
              >
                Back
              </Button>
            )}
            
            <Button
              type="button"
              variant="gradient"
              onClick={handleNextStep}
              disabled={!validateCurrentStep() || isLoading}
              isLoading={isLoading && currentStep === 2}
              icon={currentStep === 2 ? <Sparkles className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
              className="flex-1"
            >
              {currentStep === 2 ? 'Create Account' : 'Continue'}
            </Button>
          </div>
        )}

        {/* Social proof */}
        {currentStep < 3 && (
          <div className="pt-6 border-t border-gray-200">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-3">Trusted by professionals worldwide</p>
              <div className="flex justify-center gap-6">
                {socialProofStats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="flex items-center gap-1 text-sm font-semibold text-brand-600">
                      <stat.icon className="h-4 w-4" />
                      {stat.number}
                    </div>
                    <div className="text-xs text-gray-500">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {renderExitIntentModal()}
    </div>
  );
}