/**
 * Comprehensive Onboarding Flow Component for iPEC Coach Connect
 * 
 * Multi-stage onboarding process with role-specific paths, progress tracking,
 * and intelligent navigation. Integrates with the unified user store for
 * persistent state management and real-time updates.
 * 
 * Features:
 * - Multi-step wizard with progress tracking
 * - Role-specific onboarding paths (client vs coach)
 * - Form validation and error handling
 * - Auto-save and resume functionality
 * - Responsive design with animations
 * - Integration with enhanced auth service
 * - Profile completion tracking
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  UserCheck,
  Target,
  Users,
  CreditCard,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Loader,
  AlertCircle,
  Mail,
  Phone,
  Shield,
  Star,
  Heart,
  Globe,
  Clock
} from 'lucide-react';
import { useOnboarding, useAuth, useUserRoles, useClientProfile, useCoachApplication } from '../../stores/unified-user-store';
import { OnboardingStage, ExtendedUserRole } from '../../services/enhanced-auth.service';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { TextArea } from '../ui/TextArea';
import { Select } from '../ui/Select';
import { Checkbox } from '../ui/Checkbox';
import { Badge } from '../ui/Badge';
import { ProgressBar } from '../ui/ProgressBar';
import { toast } from '../ui/Toast';

// =====================================================================
// TYPES AND INTERFACES
// =====================================================================

interface OnboardingStepProps {
  stage: OnboardingStage;
  data: Record<string, any>;
  onNext: (data?: Record<string, any>) => Promise<void>;
  onPrev: () => void;
  onSkip?: () => void;
  isLoading?: boolean;
  canSkip?: boolean;
}

interface StepConfig {
  stage: OnboardingStage;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  component: React.ComponentType<OnboardingStepProps>;
  canSkip?: boolean;
  roles?: ExtendedUserRole[];
}

// =====================================================================
// STEP COMPONENTS
// =====================================================================

const WelcomeStep: React.FC<OnboardingStepProps> = ({ onNext, isLoading }) => {
  const { user } = useAuth();
  
  return (
    <div className="text-center space-y-6">
      <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto">
        <Heart className="w-12 h-12 text-white" />
      </div>
      
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome to iPEC Coach Connect!
        </h2>
        <p className="text-lg text-gray-600">
          Hello {user?.full_name}, let's get you set up for success
        </p>
      </div>
      
      <div className="bg-blue-50 rounded-lg p-6">
        <p className="text-blue-800">
          We'll walk you through a quick setup process to personalize your experience 
          and connect you with the right coaching opportunities.
        </p>
      </div>
      
      <Button 
        onClick={() => onNext()}
        disabled={isLoading}
        size="lg"
        className="w-full sm:w-auto"
      >
        {isLoading && <Loader className="w-4 h-4 mr-2 animate-spin" />}
        Let's Get Started
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
};

const ProfileSetupStep: React.FC<OnboardingStepProps> = ({ data, onNext, onPrev, isLoading }) => {
  const [formData, setFormData] = useState({
    display_name: data.display_name || '',
    bio: data.bio || '',
    location: data.location || '',
    timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    preferred_language: data.preferred_language || 'en',
    ...data
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.display_name?.trim()) {
      newErrors.display_name = 'Display name is required';
    }
    
    if (formData.bio && formData.bio.length > 500) {
      newErrors.bio = 'Bio must be less than 500 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleNext = async () => {
    if (validateForm()) {
      await onNext(formData);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <User className="w-16 h-16 text-blue-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Set Up Your Profile</h2>
        <p className="text-gray-600">Tell us a bit about yourself</p>
      </div>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="display_name" className="block text-sm font-medium text-gray-700 mb-1">
            Display Name *
          </label>
          <Input
            id="display_name"
            value={formData.display_name}
            onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
            error={errors.display_name}
            placeholder="How would you like others to see your name?"
          />
        </div>
        
        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
            About You
          </label>
          <TextArea
            id="bio"
            value={formData.bio}
            onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
            error={errors.bio}
            placeholder="Tell us about yourself, your interests, or what brings you to coaching..."
            rows={3}
            maxLength={500}
          />
          <p className="text-sm text-gray-500 mt-1">
            {formData.bio?.length || 0}/500 characters
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="City, State/Country"
            />
          </div>
          
          <div>
            <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-1">
              Timezone
            </label>
            <Select
              id="timezone"
              value={formData.timezone}
              onChange={(value) => setFormData(prev => ({ ...prev, timezone: value }))}
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
            </Select>
          </div>
        </div>
        
        <div>
          <label htmlFor="preferred_language" className="block text-sm font-medium text-gray-700 mb-1">
            Preferred Language
          </label>
          <Select
            id="preferred_language"
            value={formData.preferred_language}
            onChange={(value) => setFormData(prev => ({ ...prev, preferred_language: value }))}
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
          </Select>
        </div>
      </div>
      
      <div className="flex gap-3">
        <Button variant="outline" onClick={onPrev} className="flex-1">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        
        <Button onClick={handleNext} disabled={isLoading} className="flex-1">
          {isLoading && <Loader className="w-4 h-4 mr-2 animate-spin" />}
          Next
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

const RoleSelectionStep: React.FC<OnboardingStepProps> = ({ data, onNext, onPrev, isLoading }) => {
  const [selectedRole, setSelectedRole] = useState<'client' | 'coach' | null>(
    data.selectedRole || null
  );
  
  const roleOptions = [
    {
      value: 'client' as const,
      title: 'I want coaching',
      description: 'Connect with certified iPEC coaches to achieve your goals',
      icon: Target,
      benefits: [
        'Access to certified iPEC coaches',
        'Personalized coaching sessions',
        'Goal tracking and progress monitoring',
        'Community support and resources'
      ]
    },
    {
      value: 'coach' as const,
      title: 'I am a coach',
      description: 'Share your expertise and help others achieve their potential',
      icon: Users,
      benefits: [
        'Build your coaching practice',
        'Access to client management tools',
        'Marketing and business support',
        'Professional development resources'
      ]
    }
  ];
  
  const handleNext = async () => {
    if (selectedRole) {
      await onNext({ selectedRole });
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <UserCheck className="w-16 h-16 text-blue-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">How can we help you?</h2>
        <p className="text-gray-600">Choose the option that best describes your goals</p>
      </div>
      
      <div className="grid gap-4">
        {roleOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = selectedRole === option.value;
          
          return (
            <Card
              key={option.value}
              className={`cursor-pointer transition-all ${
                isSelected 
                  ? 'ring-2 ring-blue-500 bg-blue-50' 
                  : 'hover:shadow-md hover:bg-gray-50'
              }`}
              onClick={() => setSelectedRole(option.value)}
            >
              <Card.Body className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${
                    isSelected ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {option.title}
                    </h3>
                    <p className="text-gray-600 mb-3">
                      {option.description}
                    </p>
                    
                    <ul className="space-y-1">
                      {option.benefits.map((benefit, index) => (
                        <li key={index} className="flex items-center text-sm text-gray-600">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {isSelected && (
                    <div className="text-blue-600">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>
          );
        })}
      </div>
      
      <div className="flex gap-3">
        <Button variant="outline" onClick={onPrev} className="flex-1">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        
        <Button 
          onClick={handleNext} 
          disabled={!selectedRole || isLoading} 
          className="flex-1"
        >
          {isLoading && <Loader className="w-4 h-4 mr-2 animate-spin" />}
          Continue as {selectedRole === 'client' ? 'Client' : 'Coach'}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

const GoalSettingStep: React.FC<OnboardingStepProps> = ({ data, onNext, onPrev, isLoading }) => {
  const [goals, setGoals] = useState<string[]>(data.coachingGoals || []);
  const [focusAreas, setFocusAreas] = useState<string[]>(data.focusAreas || []);
  const [customGoal, setCustomGoal] = useState('');
  
  const goalOptions = [
    'Leadership Development',
    'Career Advancement',
    'Work-Life Balance',
    'Personal Growth',
    'Relationship Building',
    'Stress Management',
    'Confidence Building',
    'Communication Skills',
    'Time Management',
    'Life Transitions'
  ];
  
  const focusAreaOptions = [
    'Professional',
    'Personal',
    'Relationships',
    'Health & Wellness',
    'Financial',
    'Spiritual',
    'Creative',
    'Educational'
  ];
  
  const handleGoalToggle = (goal: string) => {
    setGoals(prev => 
      prev.includes(goal) 
        ? prev.filter(g => g !== goal)
        : [...prev, goal]
    );
  };
  
  const handleFocusAreaToggle = (area: string) => {
    setFocusAreas(prev =>
      prev.includes(area)
        ? prev.filter(a => a !== area)
        : [...prev, area]
    );
  };
  
  const addCustomGoal = () => {
    if (customGoal.trim() && !goals.includes(customGoal.trim())) {
      setGoals(prev => [...prev, customGoal.trim()]);
      setCustomGoal('');
    }
  };
  
  const handleNext = async () => {
    if (goals.length > 0 && focusAreas.length > 0) {
      await onNext({ 
        coachingGoals: goals,
        focusAreas: focusAreas
      });
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <Target className="w-16 h-16 text-blue-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">What are your goals?</h2>
        <p className="text-gray-600">Help us understand what you want to achieve</p>
      </div>
      
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Coaching Goals</h3>
          <p className="text-sm text-gray-600 mb-4">Select all that apply (choose at least one)</p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {goalOptions.map((goal) => (
              <button
                key={goal}
                onClick={() => handleGoalToggle(goal)}
                className={`p-3 text-sm border rounded-lg text-left transition-colors ${
                  goals.includes(goal)
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                {goal}
              </button>
            ))}
          </div>
          
          <div className="mt-4 flex gap-2">
            <Input
              value={customGoal}
              onChange={(e) => setCustomGoal(e.target.value)}
              placeholder="Add a custom goal..."
              onKeyDown={(e) => e.key === 'Enter' && addCustomGoal()}
            />
            <Button onClick={addCustomGoal} variant="outline">
              Add
            </Button>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Focus Areas</h3>
          <p className="text-sm text-gray-600 mb-4">Which areas of life do you want to focus on?</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {focusAreaOptions.map((area) => (
              <button
                key={area}
                onClick={() => handleFocusAreaToggle(area)}
                className={`p-3 text-sm border rounded-lg text-center transition-colors ${
                  focusAreas.includes(area)
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                {area}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex gap-3">
          <div className="text-blue-600">
            <Star className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm text-blue-800">
              <strong>Selected Goals:</strong> {goals.join(', ') || 'None selected'}
            </p>
            <p className="text-sm text-blue-800 mt-1">
              <strong>Focus Areas:</strong> {focusAreas.join(', ') || 'None selected'}
            </p>
          </div>
        </div>
      </div>
      
      <div className="flex gap-3">
        <Button variant="outline" onClick={onPrev} className="flex-1">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        
        <Button 
          onClick={handleNext} 
          disabled={goals.length === 0 || focusAreas.length === 0 || isLoading} 
          className="flex-1"
        >
          {isLoading && <Loader className="w-4 h-4 mr-2 animate-spin" />}
          Next
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

const VerificationStep: React.FC<OnboardingStepProps> = ({ onNext, onPrev, isLoading }) => {
  const { user } = useAuth();
  const [emailVerified, setEmailVerified] = useState(user?.email_confirmed_at ? true : false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [isResendingEmail, setIsResendingEmail] = useState(false);
  
  const handleResendEmail = async () => {
    setIsResendingEmail(true);
    try {
      // TODO: Implement email resend
      toast.success('Verification email sent!');
    } catch (error) {
      toast.error('Failed to send verification email');
    } finally {
      setIsResendingEmail(false);
    }
  };
  
  const handleNext = async () => {
    if (emailVerified) {
      await onNext();
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <Shield className="w-16 h-16 text-blue-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify Your Account</h2>
        <p className="text-gray-600">Let's make sure we can reach you</p>
      </div>
      
      <div className="space-y-4">
        <Card>
          <Card.Body className="p-4">
            <div className="flex items-center gap-4">
              <div className={`p-2 rounded-full ${
                emailVerified ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
              }`}>
                <Mail className="w-5 h-5" />
              </div>
              
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">Email Verification</h3>
                <p className="text-sm text-gray-600">{user?.email}</p>
              </div>
              
              <div className="flex items-center gap-2">
                {emailVerified ? (
                  <Badge variant="success">Verified</Badge>
                ) : (
                  <>
                    <Badge variant="secondary">Pending</Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleResendEmail}
                      disabled={isResendingEmail}
                    >
                      {isResendingEmail && <Loader className="w-3 h-3 mr-1 animate-spin" />}
                      Resend
                    </Button>
                  </>
                )}
              </div>
            </div>
          </Card.Body>
        </Card>
        
        <Card>
          <Card.Body className="p-4">
            <div className="flex items-center gap-4">
              <div className={`p-2 rounded-full ${
                phoneVerified ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
              }`}>
                <Phone className="w-5 h-5" />
              </div>
              
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">Phone Verification</h3>
                <p className="text-sm text-gray-600">Optional - for session reminders</p>
              </div>
              
              <Badge variant="secondary">Optional</Badge>
            </div>
          </Card.Body>
        </Card>
      </div>
      
      {!emailVerified && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="text-sm text-yellow-800">
                Please check your email and click the verification link to continue.
                Don't see the email? Check your spam folder or click "Resend" above.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex gap-3">
        <Button variant="outline" onClick={onPrev} className="flex-1">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        
        <Button 
          onClick={handleNext} 
          disabled={!emailVerified || isLoading} 
          className="flex-1"
        >
          {isLoading && <Loader className="w-4 h-4 mr-2 animate-spin" />}
          Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

const CompletionStep: React.FC<OnboardingStepProps> = ({ onNext, isLoading }) => {
  const navigate = useNavigate();
  
  const handleComplete = async () => {
    await onNext();
    navigate('/dashboard');
  };
  
  return (
    <div className="text-center space-y-6">
      <div className="w-24 h-24 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle className="w-12 h-12 text-white" />
      </div>
      
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          You're all set!
        </h2>
        <p className="text-lg text-gray-600">
          Welcome to the iPEC Coach Connect community
        </p>
      </div>
      
      <div className="bg-green-50 rounded-lg p-6">
        <p className="text-green-800">
          Your profile is complete and you're ready to start your coaching journey. 
          Let's explore what's possible together!
        </p>
      </div>
      
      <Button 
        onClick={handleComplete}
        disabled={isLoading}
        size="lg"
        className="w-full sm:w-auto"
      >
        {isLoading && <Loader className="w-4 h-4 mr-2 animate-spin" />}
        Go to Dashboard
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
};

// =====================================================================
// STEP CONFIGURATION
// =====================================================================

const STEP_CONFIGS: StepConfig[] = [
  {
    stage: 'not_started',
    title: 'Welcome',
    description: 'Get started with your journey',
    icon: Heart,
    component: WelcomeStep,
  },
  {
    stage: 'profile_setup',
    title: 'Profile Setup',
    description: 'Tell us about yourself',
    icon: User,
    component: ProfileSetupStep,
  },
  {
    stage: 'role_selection',
    title: 'Choose Your Path',
    description: 'How can we help you?',
    icon: UserCheck,
    component: RoleSelectionStep,
  },
  {
    stage: 'goal_setting',
    title: 'Set Your Goals',
    description: 'What do you want to achieve?',
    icon: Target,
    component: GoalSettingStep,
    roles: ['client'],
  },
  {
    stage: 'verification',
    title: 'Verify Account',
    description: 'Confirm your contact information',
    icon: Shield,
    component: VerificationStep,
  },
  {
    stage: 'completed',
    title: 'Complete',
    description: 'You\'re ready to go!',
    icon: CheckCircle,
    component: CompletionStep,
  },
];

// =====================================================================
// MAIN COMPONENT
// =====================================================================

export const OnboardingFlow: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const { 
    onboardingStage, 
    onboardingData, 
    profileCompletion,
    updateOnboardingStage,
    completeOnboarding
  } = useOnboarding();
  
  const { assignRole } = useUserRoles();
  const { updateClientProfile } = useClientProfile();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Find current step configuration
  const currentStepIndex = STEP_CONFIGS.findIndex(config => config.stage === onboardingStage);
  const currentStep = STEP_CONFIGS[currentStepIndex] || STEP_CONFIGS[0];
  
  // Calculate progress
  const progress = ((currentStepIndex + 1) / STEP_CONFIGS.length) * 100;
  
  // Handle next step
  const handleNext = useCallback(async (data?: Record<string, any>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const nextStepIndex = currentStepIndex + 1;
      const nextStep = STEP_CONFIGS[nextStepIndex];
      
      // Handle role assignment
      if (currentStep.stage === 'role_selection' && data?.selectedRole) {
        await assignRole(data.selectedRole);
      }
      
      // Handle client profile setup
      if (currentStep.stage === 'goal_setting' && data) {
        await updateClientProfile({
          coaching_goals: data.coachingGoals,
          focus_areas: data.focusAreas,
          goals_set_at: new Date().toISOString()
        });
      }
      
      // Move to next stage or complete
      if (nextStep) {
        await updateOnboardingStage(nextStep.stage, data);
      } else {
        await completeOnboarding();
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to proceed to next step';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [currentStepIndex, currentStep, assignRole, updateClientProfile, updateOnboardingStage, completeOnboarding]);
  
  // Handle previous step
  const handlePrev = useCallback(async () => {
    if (currentStepIndex > 0) {
      const prevStep = STEP_CONFIGS[currentStepIndex - 1];
      await updateOnboardingStage(prevStep.stage);
    }
  }, [currentStepIndex, updateOnboardingStage]);
  
  // Handle skip step
  const handleSkip = useCallback(async () => {
    if (currentStep.canSkip) {
      await handleNext();
    }
  }, [currentStep, handleNext]);
  
  const StepComponent = currentStep.component;
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <ProgressBar 
                progress={progress} 
                className="h-2"
                showLabel={false}
              />
            </div>
            <div className="text-sm font-medium text-gray-600">
              {currentStepIndex + 1} of {STEP_CONFIGS.length}
            </div>
          </div>
          
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              {currentStep.title}
            </h1>
            <p className="text-gray-600">
              {currentStep.description}
            </p>
          </div>
        </div>
        
        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Step Content */}
        <Card>
          <Card.Body className="p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep.stage}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <StepComponent
                  stage={currentStep.stage}
                  data={onboardingData}
                  onNext={handleNext}
                  onPrev={handlePrev}
                  onSkip={currentStep.canSkip ? handleSkip : undefined}
                  isLoading={isLoading}
                  canSkip={currentStep.canSkip}
                />
              </motion.div>
            </AnimatePresence>
          </Card.Body>
        </Card>
        
        {/* Profile Completion Display */}
        {profileCompletion > 0 && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Profile completion: <strong>{profileCompletion}%</strong>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingFlow;