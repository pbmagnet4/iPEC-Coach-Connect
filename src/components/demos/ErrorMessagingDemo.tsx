/**
 * Error Messaging Demo Component
 * 
 * Comprehensive demonstration of the enhanced error messaging system
 * showcasing all features and capabilities.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  AlertCircle, 
  BarChart3, 
  CheckCircle, 
  CreditCard,
  Lightbulb,
  Lock,
  Mail,
  Play,
  RefreshCw,
  Settings,
  Shield,
  Wifi
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ErrorMessage } from '../ui/ErrorMessage';
import { InlineErrorFeedback } from '../ui/InlineErrorFeedback';
import { commonRecoveryFlows, ErrorRecoveryFlow, useErrorRecoveryFlow } from '../ui/ErrorRecoveryFlow';
import type { ErrorContext } from '../../lib/error-messages';
import { getErrorMessage } from '../../lib/error-messages';
import { getErrorInsights, getErrorSummary, trackError, trackRecoveryAttempt } from '../../lib/error-analytics';

interface DemoScenario {
  id: string;
  title: string;
  description: string;
  errorCode: string;
  context?: ErrorContext;
  icon: React.ElementType;
  category: 'auth' | 'network' | 'validation' | 'payment' | 'system';
}

const demoScenarios: DemoScenario[] = [
  {
    id: 'invalid-credentials',
    title: 'Invalid Login Credentials',
    description: 'User enters wrong email or password',
    errorCode: 'INVALID_CREDENTIALS',
    context: {
      operation: 'signin',
      attemptCount: 3,
      fieldName: 'password'
    },
    icon: Lock,
    category: 'auth'
  },
  {
    id: 'email-typo',
    title: 'Email with Common Typo',
    description: 'User makes a common mistake in email domain',
    errorCode: 'VALIDATION_ERROR',
    context: {
      operation: 'signup',
      fieldName: 'email',
      fieldValue: 'user@gmial.com'
    },
    icon: Mail,
    category: 'validation'
  },
  {
    id: 'account-locked',
    title: 'Account Temporarily Locked',
    description: 'Too many failed login attempts',
    errorCode: 'ACCOUNT_LOCKED',
    context: {
      operation: 'signin',
      attemptCount: 5
    },
    icon: Shield,
    category: 'auth'
  },
  {
    id: 'network-offline',
    title: 'Connection Lost',
    description: 'User goes offline during operation',
    errorCode: 'OFFLINE',
    context: {
      operation: 'booking_create',
      networkInfo: {
        online: false,
        connectionType: 'none'
      }
    },
    icon: Wifi,
    category: 'network'
  },
  {
    id: 'payment-failed',
    title: 'Payment Processing Failed',
    description: 'Credit card payment declined',
    errorCode: 'PAYMENT_DECLINED',
    context: {
      operation: 'payment_process',
      fieldName: 'card'
    },
    icon: CreditCard,
    category: 'payment'
  }
];

export function ErrorMessagingDemo() {
  const [selectedScenario, setSelectedScenario] = useState<DemoScenario | null>(null);
  const [currentError, setCurrentError] = useState<any>(null);
  const [showInlineDemo, setShowInlineDemo] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [testField, setTestField] = useState('');
  const { activeFlow, startFlow, endFlow } = useErrorRecoveryFlow();

  const handleDemoScenario = (scenario: DemoScenario) => {
    setSelectedScenario(scenario);
    
    // Create error message
    const errorMessage = getErrorMessage(scenario.errorCode, scenario.context);
    setCurrentError(errorMessage);
    
    // Track the error for analytics
    trackError(errorMessage, scenario.context, { code: scenario.errorCode });
  };

  const handleRetry = async () => {
    if (!selectedScenario) return;
    
    // Simulate retry attempt
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Track recovery attempt
    const success = Math.random() > 0.3; // 70% success rate for demo
    trackRecoveryAttempt(selectedScenario.errorCode, success, 1500);
    
    if (success) {
      setCurrentError(null);
      setSelectedScenario(null);
    }
  };

  const handleStartRecoveryFlow = (flowId: string) => {
    startFlow(flowId);
  };

  const clearError = () => {
    setCurrentError(null);
    setSelectedScenario(null);
  };

  const insights = getErrorInsights();
  const summary = getErrorSummary();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Enhanced Error Messaging System
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Interactive demonstration of iPEC Coach Connect's comprehensive error handling system 
          featuring smart suggestions, progressive disclosure, and guided recovery workflows.
        </p>
      </div>

      {/* Demo Controls */}
      <Card>
        <Card.Header>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Play className="h-5 w-5" />
            Try Error Scenarios
          </h2>
          <p className="text-sm text-gray-600">
            Click any scenario below to see the enhanced error messaging in action
          </p>
        </Card.Header>
        <Card.Body>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {demoScenarios.map(scenario => {
              const IconComponent = scenario.icon;
              return (
                <motion.button
                  key={scenario.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleDemoScenario(scenario)}
                  className="p-4 border rounded-lg text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <IconComponent className="h-5 w-5 text-red-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900">{scenario.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{scenario.description}</p>
                      <span className="inline-block mt-2 px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-700">
                        {scenario.category}
                      </span>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </Card.Body>
      </Card>

      {/* Current Error Display */}
      {currentError && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <Card>
            <Card.Header>
              <h3 className="text-lg font-semibold">Error Message Result</h3>
              <p className="text-sm text-gray-600">
                Enhanced error message with smart suggestions and recovery guidance
              </p>
            </Card.Header>
            <Card.Body>
              <ErrorMessage
                error={currentError}
                onRetry={handleRetry}
                onDismiss={clearError}
              />
              
              {/* Recovery flow triggers */}
              <div className="mt-6 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStartRecoveryFlow('forgotPassword')}
                >
                  Start Password Recovery
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStartRecoveryFlow('accountLocked')}
                >
                  Unlock Account
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStartRecoveryFlow('connectionIssue')}
                >
                  Fix Connection
                </Button>
              </div>
            </Card.Body>
          </Card>
        </motion.div>
      )}

      {/* Inline Validation Demo */}
      <Card>
        <Card.Header>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Inline Validation Demo
          </h3>
          <p className="text-sm text-gray-600">
            Real-time validation with smart suggestions
          </p>
        </Card.Header>
        <Card.Body>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Try typing an email address
              </label>
              <input
                type="email"
                value={testField}
                onChange={(e) => setTestField(e.target.value)}
                placeholder="Enter your email..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            
            <InlineErrorFeedback
              value={testField}
              fieldType="email"
              showAllRules={showInlineDemo}
              onSuggestion={(suggestion) => {
  void console.log('Suggestion clicked:', suggestion);
              }}
            />
            
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowInlineDemo(!showInlineDemo)}
            >
              {showInlineDemo ? 'Hide' : 'Show'} Requirements
            </Button>
          </div>
        </Card.Body>
      </Card>

      {/* Analytics Dashboard */}
      <Card>
        <Card.Header>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Error Analytics Dashboard
          </h3>
          <p className="text-sm text-gray-600">
            Real-time insights into error patterns and recovery success rates
          </p>
        </Card.Header>
        <Card.Body>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Summary Stats */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Summary Statistics</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Errors:</span>
                  <span className="font-medium">{summary.totalErrors}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Unique Error Types:</span>
                  <span className="font-medium">{summary.uniqueErrors}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Success Rate:</span>
                  <span className="font-medium text-green-600">
                    {Math.round(summary.avgSuccessRate * 100)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Avg Resolution:</span>
                  <span className="font-medium">
                    {Math.round(summary.avgResolutionTime / 1000)}s
                  </span>
                </div>
              </div>
            </div>

            {/* Top Errors */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Most Common Errors</h4>
              <div className="space-y-2">
                {summary.topErrors.map((error, index) => (
                  <div key={error.code} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 truncate">{error.code}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{error.frequency}</span>
                      <div className={`w-2 h-2 rounded-full ${
                        error.successRate > 0.7 ? 'bg-green-500' : 
                        error.successRate > 0.4 ? 'bg-yellow-500' : 'bg-red-500'
                      }`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Insights */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Key Insights</h4>
              <div className="space-y-2">
                {insights.slice(0, 3).map((insight, index) => (
                  <div key={index} className="p-2 bg-blue-50 rounded text-sm">
                    <div className="flex items-start gap-2">
                      <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-blue-900">{insight.title}</p>
                        <p className="text-blue-700 text-xs mt-1">{insight.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAnalytics(!showAnalytics)}
              icon={<Settings className="h-4 w-4" />}
            >
              {showAnalytics ? 'Hide' : 'Show'} Detailed Analytics
            </Button>
          </div>

          {showAnalytics && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 p-4 bg-gray-50 rounded-lg"
            >
              <pre className="text-xs text-gray-600 overflow-auto">
                {JSON.stringify(insights, null, 2)}
              </pre>
            </motion.div>
          )}
        </Card.Body>
      </Card>

      {/* Recovery Flow Modal */}
      {activeFlow && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="max-w-lg w-full">
            <ErrorRecoveryFlow
              flow={activeFlow}
              onComplete={endFlow}
              onCancel={endFlow}
            />
          </div>
        </div>
      )}

      {/* Feature Overview */}
      <Card>
        <Card.Header>
          <h3 className="text-lg font-semibold">System Features</h3>
          <p className="text-sm text-gray-600">
            Comprehensive overview of enhanced error messaging capabilities
          </p>
        </Card.Header>
        <Card.Body>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Core Features</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Context-specific error messages
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Smart error detection and correction
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Progressive error disclosure
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Guided recovery workflows
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Real-time validation feedback
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Advanced Capabilities</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Error pattern analytics
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Success rate tracking
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Automatic retry mechanisms
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Accessibility compliance
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Multi-language support ready
                </li>
              </ul>
            </div>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}