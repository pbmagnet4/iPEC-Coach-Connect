/**
 * Enhanced Authentication Form Component
 * 
 * Provides a comprehensive authentication experience with:
 * - Multi-step registration flow with progress indication
 * - Enhanced error messaging with recovery guidance
 * - Improved accessibility and mobile optimization
 * - Trust signals and security messaging
 * - Real-time validation feedback
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  Lock, 
  User, 
  Phone, 
  MapPin, 
  Shield, 
  CheckCircle, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ArrowLeft,
  Loader2,
  AlertTriangle,
  Info
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { GoogleSignInButton } from '../GoogleSignInButton';
import { authService } from '../../services/auth.service';
import { getRateLimitStatus } from '../../lib/rate-limiter';
import { logSecurity } from '../../lib/secure-logger';
import type { LegacyUserRole } from '../../stores/unified-user-store';
import { AuthTrustSignals, QuickAuthTrustFooter } from '../trust/AuthTrustSignals';
import { EmailInputTrust, PrivacyAssurance } from '../trust/TrustMicrocopy';

interface AuthFormProps {
  mode: 'signin' | 'signup' | 'reset';
  onModeChange: (mode: 'signin' | 'signup' | 'reset') => void;
  onSuccess?: () => void;
  redirectTo?: string;
}

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  phone: string;
  role: LegacyUserRole;
  agreeToTerms: boolean;
}

interface FormErrors {
  [key: string]: string;
}

interface PasswordRequirement {
  label: string;
  check: (password: string) => boolean;
}

const passwordRequirements: PasswordRequirement[] = [
  { label: 'At least 8 characters', check: (p) => p.length >= 8 },
  { label: 'Contains uppercase letter', check: (p) => /[A-Z]/.test(p) },
  { label: 'Contains lowercase letter', check: (p) => /[a-z]/.test(p) },
  { label: 'Contains number', check: (p) => /\d/.test(p) },
  { label: 'Contains special character', check: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) }
];

const signupSteps = [
  { id: 'basic', title: 'Basic Information', description: 'Email and password' },
  { id: 'profile', title: 'Profile Details', description: 'Name and contact info' },
  { id: 'preferences', title: 'Account Setup', description: 'Role and preferences' },
  { id: 'verification', title: 'Verification', description: 'Email confirmation' }
];

export function EnhancedAuthForm({ mode, onModeChange, onSuccess, redirectTo }: AuthFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
    role: 'client',
    agreeToTerms: false
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string>('');
  const [rateLimitInfo, setRateLimitInfo] = useState<any>(null);

  // Check rate limit status on mount
  useEffect(() => {
    const operationType = mode === 'signin' ? 'auth.signin' : 'auth.signup';
    const status = getRateLimitStatus(operationType, formData.email);
    setRateLimitInfo(status);
  }, [mode, formData.email]);

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'email':
        if (!value) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email address';
        return '';
      
      case 'password':
        if (!value) return 'Password is required';
        if (mode === 'signup') {
          const failedRequirements = passwordRequirements.filter(req => !req.check(value));
          if (failedRequirements.length > 0) {
            return `Password must meet all security requirements`;
          }
        } else {
          if (value.length < 6) return 'Password must be at least 6 characters';
        }
        return '';
      
      case 'confirmPassword':
        if (mode === 'signup') {
          if (!value) return 'Please confirm your password';
          if (value !== formData.password) return 'Passwords do not match';
        }
        return '';
      
      case 'fullName':
        if (mode === 'signup') {
          if (!value) return 'Full name is required';
          if (value.trim().length < 2) return 'Please enter your full name';
        }
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
    }
  };

  const validateCurrentStep = (): boolean => {
    const stepFields = getStepFields(currentStep);
    const stepErrors: FormErrors = {};
    
    stepFields.forEach(field => {
      const error = validateField(field, formData[field as keyof FormData] as string);
      if (error) stepErrors[field] = error;
    });

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const getStepFields = (step: number): string[] => {
    switch (step) {
      case 0: return ['email', 'password', 'confirmPassword'];
      case 1: return ['fullName', 'phone'];
      case 2: return ['role'];
      default: return [];
    }
  };

  const handleNextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, signupSteps.length - 1));
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === 'signup' && !validateCurrentStep()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      let result;
      
      if (mode === 'signin') {
        result = await authService.signIn({
          email: formData.email,
          password: formData.password
        });
      } else if (mode === 'signup') {
        result = await authService.signUp({
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          role: formData.role,
          phone: formData.phone || undefined
        });
      } else {
        result = await authService.resetPassword({
          email: formData.email
        });
      }

      if (result.error) {
        if (result.error.code === 'RATE_LIMITED') {
          setErrors({ form: result.error.message });
          logSecurity('Rate limited auth attempt', 'medium', {
            operation: mode,
            email: formData.email
          });
        } else {
          setErrors({ form: getErrorMessage(result.error.message) });
        }
      } else {
        if (mode === 'signup') {
          setCurrentStep(3); // Verification step
        } else {
          onSuccess?.();
        }
      }
    } catch (error) {
      setErrors({ form: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const getErrorMessage = (error: string): string => {
    const errorMap: { [key: string]: string } = {
      'Invalid login credentials': 'The email or password you entered is incorrect. Please check your credentials and try again.',
      'User already registered': 'An account with this email already exists. Try signing in instead, or use the password reset option if you\'ve forgotten your password.',
      'Signup requires a valid password': 'Please ensure your password meets all security requirements.',
      'Email not confirmed': 'Please check your email and click the confirmation link before signing in.'
    };

    return errorMap[error] || error;
  };

  const getPasswordStrength = (password: string): { strength: number; label: string; color: string } => {
    const passedRequirements = passwordRequirements.filter(req => req.check(password)).length;
    const strength = (passedRequirements / passwordRequirements.length) * 100;
    
    if (strength < 40) return { strength, label: 'Weak', color: 'bg-red-500' };
    if (strength < 80) return { strength, label: 'Fair', color: 'bg-yellow-500' };
    if (strength < 100) return { strength, label: 'Good', color: 'bg-blue-500' };
    return { strength, label: 'Strong', color: 'bg-green-500' };
  };

  const renderSignupStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <Input
              type="email"
              label="Email Address"
              value={formData.email}
              onChange={(e) => updateField('email', e.target.value)}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField('')}
              placeholder="Enter your email"
              icon={<Mail className="h-5 w-5" />}
              error={errors.email}
              required
              autoComplete="email"
            />

            <div className="space-y-2">
              <Input
                type={showPassword ? 'text' : 'password'}
                label="Password"
                value={formData.password}
                onChange={(e) => updateField('password', e.target.value)}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField('')}
                placeholder="Create a secure password"
                icon={<Lock className="h-5 w-5" />}
                error={errors.password}
                required
                autoComplete="new-password"
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                }
              />

              {/* Password strength indicator */}
              {formData.password && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Password strength:</span>
                    <span className={`font-medium ${getPasswordStrength(formData.password).strength >= 80 ? 'text-green-600' : 'text-gray-600'}`}>
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
                  <div className="grid grid-cols-1 gap-1 text-xs">
                    {passwordRequirements.map((req, index) => {
                      const isValid = req.check(formData.password);
                      return (
                        <div key={index} className={`flex items-center gap-1 ${isValid ? 'text-green-600' : 'text-gray-500'}`}>
                          {isValid ? <CheckCircle className="h-3 w-3" /> : <div className="h-3 w-3 rounded-full border border-gray-300" />}
                          <span>{req.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <Input
              type={showConfirmPassword ? 'text' : 'password'}
              label="Confirm Password"
              value={formData.confirmPassword}
              onChange={(e) => updateField('confirmPassword', e.target.value)}
              placeholder="Confirm your password"
              icon={<Lock className="h-5 w-5" />}
              error={errors.confirmPassword}
              required
              autoComplete="new-password"
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              }
            />
          </motion.div>
        );

      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
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
            />

            <Input
              type="tel"
              label="Phone Number (Optional)"
              value={formData.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              placeholder="+1 (555) 123-4567"
              icon={<Phone className="h-5 w-5" />}
              error={errors.phone}
              autoComplete="tel"
            />
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                I am looking to:
              </label>
              <div className="space-y-3">
                <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    value="client"
                    checked={formData.role === 'client'}
                    onChange={(e) => updateField('role', e.target.value)}
                    className="mr-3 text-brand-600 focus:ring-brand-500"
                  />
                  <div>
                    <div className="font-medium">Find a Coach</div>
                    <div className="text-sm text-gray-600">Connect with certified iPEC coaches for personal development</div>
                  </div>
                </label>
                <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    value="coach"
                    checked={formData.role === 'coach'}
                    onChange={(e) => updateField('role', e.target.value)}
                    className="mr-3 text-brand-600 focus:ring-brand-500"
                  />
                  <div>
                    <div className="font-medium">Become a Coach</div>
                    <div className="text-sm text-gray-600">Join our network as a certified iPEC coach</div>
                  </div>
                </label>
              </div>
            </div>

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
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6"
          >
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <Mail className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Check Your Email</h3>
              <p className="text-gray-600">
                We've sent a verification link to <strong>{formData.email}</strong>. 
                Please check your email and click the link to complete your registration.
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Didn't receive the email?</p>
                  <p>Check your spam folder or contact support if you need assistance.</p>
                </div>
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  const renderProgressBar = () => {
    if (mode !== 'signup') return null;

    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Step {currentStep + 1} of {signupSteps.length}
          </span>
          <span className="text-sm text-gray-500">
            {signupSteps[currentStep]?.title}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-brand-600 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${((currentStep + 1) / signupSteps.length) * 100}%` }}
          />
        </div>
        <div className="flex justify-between mt-2">
          {signupSteps.map((step, index) => (
            <div
              key={step.id}
              className={`text-xs ${index <= currentStep ? 'text-brand-600' : 'text-gray-400'}`}
            >
              {step.title}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderRateLimitWarning = () => {
    if (!rateLimitInfo || rateLimitInfo.attempts === 0) return null;

    const isNearLimit = rateLimitInfo.attempts >= rateLimitInfo.maxAttempts * 0.8;
    
    if (isNearLimit) {
      return (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <p className="text-sm text-yellow-800">
              {rateLimitInfo.attempts}/{rateLimitInfo.maxAttempts} attempts used. 
              Please be careful with your credentials.
            </p>
          </div>
        </div>
      );
    }

    return null;
  };

  const renderTrustSignals = () => {
    const authContext = mode === 'signup' ? 'signup' : 
                       mode === 'signin' ? 'login' : 
                       mode === 'reset' ? 'reset' : 'verification';
    
    return (
      <div className="mt-6 space-y-4">
        {/* Main trust signals for current context */}
        <AuthTrustSignals 
          context={authContext}
          variant="footer" 
        />
        
        {/* Context-specific trust microcopy */}
        {focusedField === 'email' && (
          <EmailInputTrust />
        )}
        
        {mode === 'signup' && currentStep === 2 && (
          <PrivacyAssurance />
        )}
        
        {/* Quick trust footer for all modes */}
        <QuickAuthTrustFooter />
      </div>
    );
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {renderProgressBar()}
      {renderRateLimitWarning()}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error display */}
        {errors.form && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <p className="text-sm text-red-800">{errors.form}</p>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {mode === 'signup' ? (
            <div key={currentStep}>
              {renderSignupStep()}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <Input
                type="email"
                label="Email Address"
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="Enter your email"
                icon={<Mail className="h-5 w-5" />}
                error={errors.email}
                required
                autoComplete="email"
              />

              {mode === 'signin' && (
                <Input
                  type={showPassword ? 'text' : 'password'}
                  label="Password"
                  value={formData.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  placeholder="Enter your password"
                  icon={<Lock className="h-5 w-5" />}
                  error={errors.password}
                  required
                  autoComplete="current-password"
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  }
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation buttons for signup */}
        {mode === 'signup' && currentStep < 3 && (
          <div className="flex gap-3">
            {currentStep > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevStep}
                className="flex-1"
                icon={<ArrowLeft className="h-4 w-4" />}
              >
                Back
              </Button>
            )}
            
            {currentStep < 2 ? (
              <Button
                type="button"
                variant="gradient"
                onClick={handleNextStep}
                className="flex-1"
                icon={<ArrowRight className="h-4 w-4" />}
                disabled={!validateCurrentStep()}
              >
                Next
              </Button>
            ) : (
              <Button
                type="submit"
                variant="gradient"
                className="flex-1"
                isLoading={isLoading}
                disabled={!formData.agreeToTerms}
                icon={<CheckCircle className="h-4 w-4" />}
              >
                Create Account
              </Button>
            )}
          </div>
        )}

        {/* Submit button for signin and reset */}
        {mode !== 'signup' && (
          <Button
            type="submit"
            variant="gradient"
            className="w-full"
            isLoading={isLoading}
            icon={mode === 'signin' ? <ArrowRight className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
          >
            {mode === 'signin' ? 'Sign In' : 'Send Reset Link'}
          </Button>
        )}

        {/* OAuth options for signin/signup */}
        {mode !== 'reset' && currentStep === 0 && (
          <>
            <div className="relative my-6">
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
              onError={(error) => {
                setErrors({ form: error.message || 'Google sign-in failed. Please try again.' });
              }}
              redirectTo={redirectTo}
            />
          </>
        )}
      </form>

      {renderTrustSignals()}

      {/* Mode switching links */}
      <div className="mt-6 text-center space-y-2">
        {mode === 'signin' && (
          <>
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <button
                onClick={() => onModeChange('signup')}
                className="text-brand-600 hover:text-brand-700 font-medium"
              >
                Sign up
              </button>
            </p>
            <p className="text-sm">
              <button
                onClick={() => onModeChange('reset')}
                className="text-gray-500 hover:text-gray-700"
              >
                Forgot your password?
              </button>
            </p>
          </>
        )}

        {mode === 'signup' && currentStep < 3 && (
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <button
              onClick={() => onModeChange('signin')}
              className="text-brand-600 hover:text-brand-700 font-medium"
            >
              Sign in
            </button>
          </p>
        )}

        {mode === 'reset' && (
          <p className="text-sm text-gray-600">
            Remember your password?{' '}
            <button
              onClick={() => onModeChange('signin')}
              className="text-brand-600 hover:text-brand-700 font-medium"
            >
              Sign in
            </button>
          </p>
        )}
      </div>

      {/* Recovery Flow Modal - TODO: Implement when error recovery system is complete */}
    </div>
  );
}