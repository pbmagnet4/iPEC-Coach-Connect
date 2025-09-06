/**
 * Error Recovery Flow Component
 * 
 * Provides guided workflows to help users recover from errors
 * with step-by-step instructions and progress tracking.
 */

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  AlertCircle, 
  ArrowLeft,
  ArrowRight, 
  CheckCircle,
  ChevronRight,
  CreditCard,
  ExternalLink,
  FileText,
  HelpCircle,
  Loader2,
  Lock,
  Mail,
  MessageCircle,
  Phone,
  RefreshCw,
  Shield,
  User,
  Wifi
} from 'lucide-react';
import { Button } from './Button';

export interface RecoveryStep {
  id: string;
  title: string;
  description: string;
  action?: {
    label: string;
    handler: () => Promise<void> | void;
    variant?: 'primary' | 'secondary' | 'ghost';
  };
  validation?: () => Promise<boolean> | boolean;
  skipLabel?: string;
  icon?: React.ElementType;
  helpText?: string;
  externalLink?: {
    label: string;
    url: string;
  };
}

export interface RecoveryFlow {
  id: string;
  title: string;
  description: string;
  steps: RecoveryStep[];
  onComplete?: () => void;
  onCancel?: () => void;
}

interface ErrorRecoveryFlowProps {
  flow: RecoveryFlow;
  onComplete?: () => void;
  onCancel?: () => void;
  className?: string;
}

// Pre-defined recovery flows for common errors
export const commonRecoveryFlows: Record<string, RecoveryFlow> = {
  forgotPassword: {
    id: 'forgot-password',
    title: 'Reset Your Password',
    description: 'We\'ll help you regain access to your account',
    steps: [
      {
        id: 'email',
        title: 'Enter Your Email',
        description: 'We\'ll send password reset instructions to your email address.',
        icon: Mail,
        action: {
          label: 'Send Reset Link',
          handler: async () => {
            // API call to send reset email
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      },
      {
        id: 'check-email',
        title: 'Check Your Email',
        description: 'We\'ve sent you a password reset link. It may take a few minutes to arrive.',
        icon: Mail,
        helpText: 'Can\'t find the email? Check your spam folder or click below to resend.',
        action: {
          label: 'Resend Email',
          handler: async () => {
            await new Promise(resolve => setTimeout(resolve, 1000));
          },
          variant: 'secondary'
        }
      },
      {
        id: 'reset',
        title: 'Create New Password',
        description: 'Choose a strong password that you haven\'t used before.',
        icon: Lock,
        action: {
          label: 'Update Password',
          handler: async () => {
            await new Promise(resolve => setTimeout(resolve, 1500));
          }
        }
      }
    ]
  },
  
  accountLocked: {
    id: 'account-locked',
    title: 'Unlock Your Account',
    description: 'Your account was locked for security. Let\'s get you back in.',
    steps: [
      {
        id: 'verify-identity',
        title: 'Verify Your Identity',
        description: 'We need to confirm it\'s really you before unlocking your account.',
        icon: Shield,
        action: {
          label: 'Send Verification Code',
          handler: async () => {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      },
      {
        id: 'enter-code',
        title: 'Enter Verification Code',
        description: 'Enter the 6-digit code we sent to your email or phone.',
        icon: Shield,
        helpText: 'Code expires in 10 minutes',
        action: {
          label: 'Verify Code',
          handler: async () => {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      },
      {
        id: 'reset-password',
        title: 'Reset Your Password',
        description: 'For security, please create a new password.',
        icon: Lock,
        action: {
          label: 'Set New Password',
          handler: async () => {
            await new Promise(resolve => setTimeout(resolve, 1500));
          }
        }
      }
    ]
  },
  
  paymentFailed: {
    id: 'payment-failed',
    title: 'Payment Issue Resolution',
    description: 'Let\'s resolve the payment issue together',
    steps: [
      {
        id: 'check-details',
        title: 'Verify Payment Details',
        description: 'Please check that your card details are entered correctly.',
        icon: CreditCard,
        helpText: 'Common issues: expired card, incorrect CVV, billing address mismatch',
        action: {
          label: 'Update Payment Info',
          handler: async () => {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      },
      {
        id: 'contact-bank',
        title: 'Contact Your Bank',
        description: 'Your bank may have blocked the transaction for security reasons.',
        icon: Phone,
        externalLink: {
          label: 'Find Bank Contact',
          url: '/help/bank-contacts'
        },
        skipLabel: 'I\'ve contacted my bank'
      },
      {
        id: 'alternative-payment',
        title: 'Try Alternative Payment',
        description: 'You can use a different card or payment method.',
        icon: CreditCard,
        action: {
          label: 'Choose Different Payment',
          handler: async () => {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
    ]
  },
  
  connectionIssue: {
    id: 'connection-issue',
    title: 'Fix Connection Problems',
    description: 'Let\'s troubleshoot your internet connection',
    steps: [
      {
        id: 'check-connection',
        title: 'Check Internet Connection',
        description: 'Ensure you\'re connected to WiFi or mobile data.',
        icon: Wifi,
        action: {
          label: 'Test Connection',
          handler: async () => {
            const online = navigator.onLine;
            if (!online) throw new Error('Still offline');
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      },
      {
        id: 'clear-cache',
        title: 'Clear Browser Cache',
        description: 'Clearing cache can resolve many connection issues.',
        icon: RefreshCw,
        helpText: 'Settings > Privacy > Clear browsing data',
        action: {
          label: 'I\'ve Cleared Cache',
          handler: async () => {
            await new Promise(resolve => setTimeout(resolve, 500));
          },
          variant: 'secondary'
        }
      },
      {
        id: 'try-different',
        title: 'Try Different Network',
        description: 'Switch between WiFi and mobile data, or try a different browser.',
        icon: Wifi,
        skipLabel: 'Skip this step'
      }
    ]
  }
};

export function ErrorRecoveryFlow({
  flow,
  onComplete,
  onCancel,
  className = ''
}: ErrorRecoveryFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);
  
  const currentStepData = flow.steps[currentStep];
  const isLastStep = currentStep === flow.steps.length - 1;
  const StepIcon = currentStepData?.icon || HelpCircle;
  
  const handleStepAction = async () => {
    if (!currentStepData?.action) return;
    
    setIsProcessing(true);
    setStepError(null);
    
    try {
      await currentStepData.action.handler();
      
      // Run validation if provided
      if (currentStepData.validation) {
        const isValid = await currentStepData.validation();
        if (!isValid) {
          throw new Error('Validation failed. Please try again.');
        }
      }
      
      // Mark step as completed
      setCompletedSteps(prev => new Set(prev).add(currentStepData.id));
      
      // Move to next step or complete
      if (isLastStep) {
        handleComplete();
      } else {
        setCurrentStep(prev => prev + 1);
      }
    } catch (error) {
      setStepError(error instanceof Error ? error.message : 'An error occurred. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleSkip = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };
  
  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      setStepError(null);
    }
  };
  
  const handleComplete = () => {
    flow.onComplete?.();
    onComplete?.();
  };
  
  const handleCancel = () => {
    flow.onCancel?.();
    onCancel?.();
  };
  
  return (
    <div className={`bg-white rounded-lg shadow-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-600 to-brand-700 px-6 py-4">
        <h2 className="text-xl font-semibold text-white">{flow.title}</h2>
        <p className="text-brand-100 text-sm mt-1">{flow.description}</p>
      </div>
      
      {/* Progress indicator */}
      <div className="px-6 py-3 bg-gray-50 border-b">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Step {currentStep + 1} of {flow.steps.length}
          </span>
          <span className="text-sm text-gray-500">
            {Math.round(((currentStep + 1) / flow.steps.length) * 100)}% complete
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            className="bg-brand-600 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${((currentStep + 1) / flow.steps.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>
      
      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="p-6"
        >
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center flex-shrink-0">
              <StepIcon className="h-6 w-6 text-brand-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {currentStepData.title}
              </h3>
              <p className="text-gray-600">
                {currentStepData.description}
              </p>
              
              {currentStepData.helpText && (
                <div className="mt-3 p-3 bg-blue-50 rounded-md">
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">Tip:</span> {currentStepData.helpText}
                  </p>
                </div>
              )}
              
              {currentStepData.externalLink && (
                <a
                  href={currentStepData.externalLink.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700"
                >
                  {currentStepData.externalLink.label}
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
          
          {/* Error message */}
          {stepError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <p className="text-sm text-red-800">{stepError}</p>
              </div>
            </div>
          )}
          
          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  disabled={isProcessing}
                  icon={<ArrowLeft className="h-4 w-4" />}
                >
                  Back
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                disabled={isProcessing}
              >
                Cancel
              </Button>
            </div>
            
            <div className="flex gap-2">
              {currentStepData.skipLabel && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkip}
                  disabled={isProcessing}
                >
                  {currentStepData.skipLabel}
                </Button>
              )}
              
              {currentStepData.action && (
                <Button
                  variant={currentStepData.action.variant === 'secondary' ? 'outline' : 'gradient'}
                  size="sm"
                  onClick={handleStepAction}
                  disabled={isProcessing}
                  isLoading={isProcessing}
                  icon={isLastStep ? <CheckCircle className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                >
                  {currentStepData.action.label}
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
      
      {/* Step indicators */}
      <div className="px-6 pb-6">
        <div className="flex items-center justify-center gap-2">
          {flow.steps.map((step, index) => {
            const isCompleted = completedSteps.has(step.id);
            const isCurrent = index === currentStep;
            const isPast = index < currentStep;
            
            return (
              <div
                key={step.id}
                className={`w-2 h-2 rounded-full transition-all ${
                  isCompleted ? 'bg-green-500 w-8' :
                  isCurrent ? 'bg-brand-600 w-8' :
                  isPast ? 'bg-brand-300' :
                  'bg-gray-300'
                }`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Hook for managing error recovery flows
 */
export function useErrorRecoveryFlow() {
  const [activeFlow, setActiveFlow] = useState<RecoveryFlow | null>(null);
  
  const startFlow = (flowId: string) => {
    const flow = commonRecoveryFlows[flowId];
    if (flow) {
      setActiveFlow(flow);
    }
  };
  
  const startCustomFlow = (flow: RecoveryFlow) => {
    setActiveFlow(flow);
  };
  
  const endFlow = () => {
    setActiveFlow(null);
  };
  
  return {
    activeFlow,
    startFlow,
    startCustomFlow,
    endFlow
  };
}