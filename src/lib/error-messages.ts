/**
 * Comprehensive Error Messaging System for iPEC Coach Connect
 * 
 * Provides user-friendly error messages with recovery guidance,
 * contextual help, and actionable next steps for common issues.
 */

import { logSecurity } from './secure-logger';

export interface ErrorMessage {
  title: string;
  message: string;
  recoverySteps?: string[];
  helpLinks?: { label: string; url: string }[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'auth' | 'network' | 'validation' | 'permission' | 'system' | 'booking' | 'payment';
  showSupport?: boolean;
  autoRetry?: boolean;
  retryDelay?: number;
  suggestions?: string[];
  smartCorrection?: {
    field?: string;
    suggestion?: string;
    action?: () => void;
  };
  progressiveDetails?: {
    technical?: string;
    moreInfo?: string[];
  };
  quickActions?: {
    label: string;
    action: () => void;
    variant?: 'primary' | 'secondary' | 'ghost';
  }[];
}

export interface ErrorContext {
  operation?: string;
  userId?: string;
  timestamp?: string;
  userAgent?: string;
  location?: string;
  previousErrors?: string[];
  fieldValue?: string;
  fieldName?: string;
  attemptCount?: number;
  browserInfo?: {
    name: string;
    version: string;
    isMobile: boolean;
  };
  networkInfo?: {
    online: boolean;
    connectionType?: string;
    effectiveType?: string;
  };
}

class ErrorMessageService {
  private errorHistory = new Map<string, number>();
  private readonly MAX_HISTORY_SIZE = 100;

  /**
   * Get comprehensive error message with recovery guidance
   */
  getErrorMessage(error: any, context?: ErrorContext): ErrorMessage {
    const errorCode = this.extractErrorCode(error);
    const errorType = this.categorizeError(error);
    
    // Track error frequency
    this.trackError(errorCode);
    
    // Get base error message
    const baseMessage = this.getBaseErrorMessage(errorCode, errorType);
    
    // Enhance with context-specific information
    const enhancedMessage = this.enhanceWithContext(baseMessage, context);
    
    // Add recovery steps based on error pattern
    const finalMessage = this.addRecoveryGuidance(enhancedMessage, errorCode, context);
    
    // Log error for analysis
    this.logErrorForAnalysis(error, finalMessage, context);
    
    return finalMessage;
  }

  /**
   * Extract standardized error code from various error types
   */
  private extractErrorCode(error: any): string {
    if (typeof error === 'string') return error;
    if (error?.code) return error.code;
    if (error?.message) {
      // Map common error messages to codes
      const message = error.message.toLowerCase();
      
      if (message.includes('rate limit')) return 'RATE_LIMITED';
      if (message.includes('invalid login') || message.includes('wrong password')) return 'INVALID_CREDENTIALS';
      if (message.includes('user not found')) return 'USER_NOT_FOUND';
      if (message.includes('email already') || message.includes('already registered')) return 'EMAIL_ALREADY_EXISTS';
      if (message.includes('network') || message.includes('fetch')) return 'NETWORK_ERROR';
      if (message.includes('timeout')) return 'REQUEST_TIMEOUT';
      if (message.includes('unauthorized')) return 'UNAUTHORIZED';
      if (message.includes('forbidden')) return 'FORBIDDEN';
      if (message.includes('not found')) return 'NOT_FOUND';
      if (message.includes('server error')) return 'SERVER_ERROR';
      if (message.includes('validation')) return 'VALIDATION_ERROR';
      if (message.includes('csrf') || message.includes('token')) return 'SECURITY_ERROR';
      if (message.includes('account locked')) return 'ACCOUNT_LOCKED';
      if (message.includes('not verified') || message.includes('verify email')) return 'EMAIL_NOT_VERIFIED';
      if (message.includes('offline') || message.includes('no connection')) return 'OFFLINE';
      if (message.includes('invalid format')) return 'INVALID_FORMAT';
      if (message.includes('required') || message.includes('missing')) return 'MISSING_FIELD';
      if (message.includes('permission')) return 'INSUFFICIENT_PERMISSIONS';
    }
    
    return 'UNKNOWN_ERROR';
  }

  /**
   * Categorize error for appropriate handling
   */
  private categorizeError(error: any): ErrorMessage['category'] {
    const code = this.extractErrorCode(error);
    const message = error?.message?.toLowerCase() || '';
    
    if (['INVALID_CREDENTIALS', 'USER_NOT_FOUND', 'EMAIL_ALREADY_EXISTS', 'RATE_LIMITED', 'UNAUTHORIZED', 'ACCOUNT_LOCKED', 'EMAIL_NOT_VERIFIED'].includes(code)) {
      return 'auth';
    }
    if (['NETWORK_ERROR', 'REQUEST_TIMEOUT', 'SERVER_ERROR', 'OFFLINE'].includes(code)) {
      return 'network';
    }
    if (['VALIDATION_ERROR', 'INVALID_FORMAT', 'MISSING_FIELD'].includes(code)) {
      return 'validation';
    }
    if (['FORBIDDEN', 'SECURITY_ERROR', 'INSUFFICIENT_PERMISSIONS'].includes(code)) {
      return 'permission';
    }
    if (message.includes('booking') || message.includes('appointment') || message.includes('schedule')) {
      return 'booking';
    }
    if (message.includes('payment') || message.includes('stripe') || message.includes('card')) {
      return 'payment';
    }
    
    return 'system';
  }

  /**
   * Get base error message for error code
   */
  private getBaseErrorMessage(errorCode: string, category: ErrorMessage['category']): ErrorMessage {
    const errorMessages: Record<string, Omit<ErrorMessage, 'category'>> = {
      // Authentication Errors
      INVALID_CREDENTIALS: {
        title: 'Sign In Failed',
        message: 'The email or password you entered is incorrect. Please check your credentials and try again.',
        severity: 'medium',
        recoverySteps: [
          'Double-check your email address for typos',
          'Ensure your password is entered correctly',
          'Try using the "Forgot Password" option if you can\'t remember your password',
          'Contact support if you continue to have issues'
        ],
        helpLinks: [
          { label: 'Reset Password', url: '/auth/reset' },
          { label: 'Login Help', url: '/help/login' }
        ],
        showSupport: true
      },

      USER_NOT_FOUND: {
        title: 'Account Not Found',
        message: 'We couldn\'t find an account with that email address.',
        severity: 'medium',
        recoverySteps: [
          'Check that you entered the correct email address',
          'Try signing up for a new account if you haven\'t registered yet',
          'Contact support if you believe this is an error'
        ],
        helpLinks: [
          { label: 'Sign Up', url: '/auth/signup' },
          { label: 'Account Help', url: '/help/account' }
        ],
        showSupport: true
      },

      EMAIL_ALREADY_EXISTS: {
        title: 'Account Already Exists',
        message: 'An account with this email address already exists. Try signing in instead.',
        severity: 'low',
        recoverySteps: [
          'Try signing in with your existing credentials',
          'Use the "Forgot Password" option if you can\'t remember your password',
          'Contact support if you need help accessing your account'
        ],
        helpLinks: [
          { label: 'Sign In', url: '/auth/signin' },
          { label: 'Reset Password', url: '/auth/reset' }
        ]
      },

      RATE_LIMITED: {
        title: 'Too Many Attempts',
        message: 'You\'ve made too many attempts. Please wait before trying again.',
        severity: 'high',
        recoverySteps: [
          'Wait for the specified time before trying again',
          'Ensure you\'re using the correct credentials',
          'Consider resetting your password if you\'re unsure',
          'Contact support if you need immediate assistance'
        ],
        helpLinks: [
          { label: 'Reset Password', url: '/auth/reset' },
          { label: 'Security Help', url: '/help/security' }
        ],
        showSupport: true,
        autoRetry: false
      },

      // Network Errors
      NETWORK_ERROR: {
        title: 'Connection Problem',
        message: 'Unable to connect to our servers. Please check your internet connection and try again.',
        severity: 'medium',
        recoverySteps: [
          'Check your internet connection',
          'Try refreshing the page',
          'Disable any VPN or proxy if you\'re using one',
          'Try again in a few moments'
        ],
        helpLinks: [
          { label: 'Connection Help', url: '/help/connection' }
        ],
        autoRetry: true,
        retryDelay: 3000
      },

      REQUEST_TIMEOUT: {
        title: 'Request Timed Out',
        message: 'The request took too long to complete. This might be due to a slow connection.',
        severity: 'medium',
        recoverySteps: [
          'Check your internet connection speed',
          'Try again with a more stable connection',
          'Clear your browser cache and cookies',
          'Try using a different browser or device'
        ],
        autoRetry: true,
        retryDelay: 5000
      },

      SERVER_ERROR: {
        title: 'Server Error',
        message: 'We\'re experiencing technical difficulties. Our team has been notified.',
        severity: 'high',
        recoverySteps: [
          'Try again in a few minutes',
          'Check our status page for any known issues',
          'Contact support if the problem persists'
        ],
        helpLinks: [
          { label: 'Status Page', url: '/status' },
          { label: 'System Health', url: '/help/system-status' }
        ],
        showSupport: true,
        autoRetry: true,
        retryDelay: 10000
      },

      // Permission Errors
      UNAUTHORIZED: {
        title: 'Authentication Required',
        message: 'You need to sign in to access this feature.',
        severity: 'medium',
        recoverySteps: [
          'Sign in to your account',
          'Create a new account if you don\'t have one',
          'Contact support if you\'re having trouble signing in'
        ],
        helpLinks: [
          { label: 'Sign In', url: '/auth/signin' },
          { label: 'Sign Up', url: '/auth/signup' }
        ]
      },

      FORBIDDEN: {
        title: 'Access Denied',
        message: 'You don\'t have permission to perform this action.',
        severity: 'medium',
        recoverySteps: [
          'Contact your administrator for access',
          'Verify you\'re signed in to the correct account',
          'Check if your account permissions have changed'
        ],
        helpLinks: [
          { label: 'Account Settings', url: '/settings/account' },
          { label: 'Permissions Help', url: '/help/permissions' }
        ],
        showSupport: true
      },

      // Validation Errors
      VALIDATION_ERROR: {
        title: 'Invalid Information',
        message: 'Please check the information you entered and try again.',
        severity: 'low',
        recoverySteps: [
          'Review all required fields',
          'Ensure email addresses are in the correct format',
          'Check that passwords meet the requirements',
          'Remove any special characters that might cause issues'
        ],
        helpLinks: [
          { label: 'Data Format Help', url: '/help/data-formats' }
        ]
      },

      // Security Errors
      SECURITY_ERROR: {
        title: 'Security Verification Failed',
        message: 'This request failed security validation. Please try again.',
        severity: 'high',
        recoverySteps: [
          'Refresh the page and try again',
          'Clear your browser cache and cookies',
          'Ensure you\'re not using any browser extensions that might interfere',
          'Contact support if the problem continues'
        ],
        helpLinks: [
          { label: 'Security Help', url: '/help/security' },
          { label: 'Browser Support', url: '/help/browsers' }
        ],
        showSupport: true
      },

      // Account-specific Errors
      ACCOUNT_LOCKED: {
        title: 'Account Temporarily Locked',
        message: 'Your account has been temporarily locked due to multiple failed login attempts.',
        severity: 'high',
        recoverySteps: [
          'Wait 30 minutes before trying again',
          'Reset your password using the "Forgot Password" option',
          'Contact support for immediate assistance'
        ],
        helpLinks: [
          { label: 'Reset Password', url: '/auth/reset' },
          { label: 'Account Recovery', url: '/help/account-recovery' }
        ],
        showSupport: true,
        progressiveDetails: {
          technical: 'Account locked for security after 5 failed attempts',
          moreInfo: [
            'Lock duration: 30 minutes',
            'Failed attempts reset after successful login',
            'Password reset bypasses lock'
          ]
        }
      },

      EMAIL_NOT_VERIFIED: {
        title: 'Email Verification Required',
        message: 'Please verify your email address before signing in.',
        severity: 'medium',
        recoverySteps: [
          'Check your email for the verification link',
          'Click the link to verify your account',
          'Request a new verification email if needed'
        ],
        helpLinks: [
          { label: 'Resend Verification', url: '/auth/resend-verification' },
          { label: 'Email Help', url: '/help/email-verification' }
        ],
        quickActions: [
          { 
            label: 'Resend Email', 
            action: () => console.log('Resend verification'),
            variant: 'primary'
          }
        ]
      },

      // Network-specific Errors
      OFFLINE: {
        title: 'No Internet Connection',
        message: 'You appear to be offline. Please check your internet connection.',
        severity: 'high',
        recoverySteps: [
          'Check your WiFi or mobile data connection',
          'Try moving to an area with better signal',
          'Restart your router or device',
          'Contact your internet service provider if issues persist'
        ],
        autoRetry: true,
        retryDelay: 5000,
        progressiveDetails: {
          technical: 'Network connectivity lost',
          moreInfo: [
            'Some features may work offline',
            'Data will sync when connection is restored',
            'Cached content may still be available'
          ]
        }
      },

      // Validation-specific Errors
      INVALID_FORMAT: {
        title: 'Invalid Format',
        message: 'The information you entered is not in the correct format.',
        severity: 'low',
        recoverySteps: [
          'Check the field requirements',
          'Remove any special characters',
          'Follow the example format shown'
        ],
        suggestions: [
          'Email format: user@example.com',
          'Phone format: (555) 123-4567',
          'Date format: MM/DD/YYYY'
        ]
      },

      MISSING_FIELD: {
        title: 'Required Information Missing',
        message: 'Please fill in all required fields.',
        severity: 'low',
        recoverySteps: [
          'Look for fields marked with an asterisk (*)',
          'Complete all highlighted fields',
          'Review the form before submitting'
        ]
      },

      // Permission Errors
      INSUFFICIENT_PERMISSIONS: {
        title: 'Insufficient Permissions',
        message: 'You don\'t have the required permissions for this action.',
        severity: 'medium',
        recoverySteps: [
          'Verify you\'re logged into the correct account',
          'Check if your subscription level includes this feature',
          'Contact your administrator for access',
          'Upgrade your account if needed'
        ],
        helpLinks: [
          { label: 'Subscription Plans', url: '/pricing' },
          { label: 'Permission Guide', url: '/help/permissions' }
        ],
        showSupport: true
      },

      // Default/Unknown Errors
      UNKNOWN_ERROR: {
        title: 'Unexpected Error',
        message: 'Something unexpected happened. Please try again.',
        severity: 'medium',
        recoverySteps: [
          'Try refreshing the page',
          'Clear your browser cache',
          'Try again in a few minutes',
          'Contact support if the problem persists'
        ],
        showSupport: true,
        progressiveDetails: {
          technical: 'An unhandled exception occurred',
          moreInfo: [
            'Error has been logged for investigation',
            'Your data is safe',
            'Try using a different browser if issue persists'
          ]
        }
      }
    };

    const baseMessage = errorMessages[errorCode] || errorMessages.UNKNOWN_ERROR;
    return { ...baseMessage, category };
  }

  /**
   * Get smart suggestions based on error and context
   */
  private getSmartSuggestions(errorCode: string, context?: ErrorContext): ErrorMessage['suggestions'] {
    const suggestions: string[] = [];

    // Email-specific suggestions
    if (context?.fieldName === 'email' && context?.fieldValue) {
      const email = context.fieldValue.toLowerCase();
      
      // Common email typos
      if (email.includes('@gmial.com') || email.includes('@gmai.com')) {
        suggestions.push('Did you mean @gmail.com?');
      }
      if (email.includes('@yahooo.com') || email.includes('@yaho.com')) {
        suggestions.push('Did you mean @yahoo.com?');
      }
      if (email.includes('@hotmial.com') || email.includes('@hotmai.com')) {
        suggestions.push('Did you mean @hotmail.com?');
      }
      if (email.includes('@outlok.com')) {
        suggestions.push('Did you mean @outlook.com?');
      }
      
      // Missing TLD
      if (!email.includes('.') && email.includes('@')) {
        suggestions.push('Email addresses need a domain extension (e.g., .com, .org)');
      }
    }

    // Password suggestions
    if (errorCode === 'INVALID_CREDENTIALS' && context?.attemptCount) {
      if (context.attemptCount >= 2) {
        suggestions.push('Check if Caps Lock is on');
        suggestions.push('Try copying and pasting your password');
      }
      if (context.attemptCount >= 3) {
        suggestions.push('Consider resetting your password');
      }
    }

    // Browser-specific suggestions
    if (context?.browserInfo) {
      if (context.browserInfo.name === 'Safari' && errorCode === 'SECURITY_ERROR') {
        suggestions.push('Try disabling "Prevent Cross-Site Tracking" in Safari settings');
      }
      if (context.browserInfo.isMobile && errorCode === 'NETWORK_ERROR') {
        suggestions.push('Try switching between WiFi and mobile data');
      }
    }

    // Network suggestions
    if (context?.networkInfo && !context.networkInfo.online) {
      suggestions.push('Check if airplane mode is turned off');
      suggestions.push('Try restarting your device');
    }

    return suggestions.length > 0 ? suggestions : undefined;
  }

  /**
   * Get smart correction options
   */
  private getSmartCorrection(errorCode: string, context?: ErrorContext): ErrorMessage['smartCorrection'] {
    // Email corrections
    if (context?.fieldName === 'email' && context?.fieldValue) {
      const email = context.fieldValue.toLowerCase();
      
      // Common domain corrections
      const corrections: Record<string, string> = {
        '@gmial.com': '@gmail.com',
        '@gmai.com': '@gmail.com',
        '@yahooo.com': '@yahoo.com',
        '@yaho.com': '@yahoo.com',
        '@hotmial.com': '@hotmail.com',
        '@hotmai.com': '@hotmail.com',
        '@outlok.com': '@outlook.com'
      };

      for (const [typo, correction] of Object.entries(corrections)) {
        if (email.includes(typo)) {
          return {
            field: 'email',
            suggestion: email.replace(typo, correction),
            action: () => console.log('Apply correction:', correction)
          };
        }
      }
    }

    return undefined;
  }

  /**
   * Enhance error message with context-specific information
   */
  private enhanceWithContext(message: ErrorMessage, context?: ErrorContext): ErrorMessage {
    if (!context) return message;

    const enhancedMessage = { ...message };

    // Add operation-specific context
    if (context.operation) {
      const operationContext = this.getOperationContext(context.operation);
      if (operationContext) {
        enhancedMessage.message = `${enhancedMessage.message} ${operationContext}`;
      }
    }

    // Add smart suggestions
    const suggestions = this.getSmartSuggestions(this.extractErrorCode(message), context);
    if (suggestions) {
      enhancedMessage.suggestions = suggestions;
    }

    // Add smart corrections
    const smartCorrection = this.getSmartCorrection(this.extractErrorCode(message), context);
    if (smartCorrection) {
      enhancedMessage.smartCorrection = smartCorrection;
    }

    // Add browser-specific help
    if (context.browserInfo && enhancedMessage.progressiveDetails) {
      enhancedMessage.progressiveDetails.moreInfo = [
        ...enhancedMessage.progressiveDetails.moreInfo || [],
        `Browser: ${context.browserInfo.name} ${context.browserInfo.version}`,
        context.browserInfo.isMobile ? 'Device: Mobile' : 'Device: Desktop'
      ];
    }

    // Add user-specific guidance
    if (context.userId) {
      enhancedMessage.recoverySteps = [
        ...enhancedMessage.recoverySteps || [],
        'Your user ID can help our support team assist you faster'
      ];
    }

    // Add location-specific help
    if (context.location) {
      const locationHelp = this.getLocationSpecificHelp(context.location);
      if (locationHelp) {
        enhancedMessage.helpLinks = [
          ...enhancedMessage.helpLinks || [],
          locationHelp
        ];
      }
    }

    return enhancedMessage;
  }

  /**
   * Add recovery guidance based on error patterns
   */
  private addRecoveryGuidance(message: ErrorMessage, errorCode: string, context?: ErrorContext): ErrorMessage {
    const errorCount = this.errorHistory.get(errorCode) || 0;
    
    // If this is a repeated error, add escalated guidance
    if (errorCount > 2) {
      return {
        ...message,
        title: `Persistent ${message.title}`,
        message: `${message.message} We notice you've encountered this issue multiple times.`,
        recoverySteps: [
          ...message.recoverySteps || [],
          'Consider trying a different browser or device',
          'Contact our support team for personalized assistance'
        ],
        showSupport: true,
        severity: message.severity === 'low' ? 'medium' : 'high'
      };
    }

    // Add context-based recovery steps
    if (context?.previousErrors?.length) {
      return {
        ...message,
        recoverySteps: [
          'Clear your browser data (cache, cookies, local storage)',
          ...message.recoverySteps || [],
          'If you continue to have issues, note the exact steps that led to this error when contacting support'
        ]
      };
    }

    return message;
  }

  /**
   * Get operation-specific context
   */
  private getOperationContext(operation: string): string | null {
    const contexts: Record<string, string> = {
      'signin': 'This happened while trying to sign in.',
      'signup': 'This happened during account registration.',
      'reset_password': 'This happened while resetting your password.',
      'update_profile': 'This happened while updating your profile.',
      'oauth_google': 'This happened during Google sign-in.',
      'logout': 'This happened while signing out.',
      'booking_create': 'This happened while creating a booking.',
      'booking_cancel': 'This happened while canceling a booking.',
      'payment_process': 'This happened during payment processing.',
      'coach_search': 'This happened while searching for coaches.',
      'session_start': 'This happened while starting a coaching session.',
      'message_send': 'This happened while sending a message.'
    };

    return contexts[operation] || null;
  }

  /**
   * Get location-specific help
   */
  private getLocationSpecificHelp(location: string): { label: string; url: string } | null {
    if (location.includes('/auth/')) {
      return { label: 'Authentication Help', url: '/help/authentication' };
    }
    if (location.includes('/profile/')) {
      return { label: 'Profile Help', url: '/help/profile' };
    }
    if (location.includes('/dashboard/')) {
      return { label: 'Dashboard Help', url: '/help/dashboard' };
    }
    
    return null;
  }

  /**
   * Track error frequency for pattern analysis
   */
  private trackError(errorCode: string): void {
    const currentCount = this.errorHistory.get(errorCode) || 0;
    this.errorHistory.set(errorCode, currentCount + 1);

    // Limit history size
    if (this.errorHistory.size > this.MAX_HISTORY_SIZE) {
      const firstKey = this.errorHistory.keys().next().value;
      this.errorHistory.delete(firstKey);
    }
  }

  /**
   * Log error for analysis and monitoring
   */
  private logErrorForAnalysis(
    originalError: any, 
    processedMessage: ErrorMessage, 
    context?: ErrorContext
  ): void {
    logSecurity('User error processed', processedMessage.severity, {
      errorType: this.extractErrorCode(originalError),
      category: processedMessage.category,
      operation: context?.operation,
      location: context?.location,
      frequency: this.errorHistory.get(this.extractErrorCode(originalError)) || 1,
      hasRecoverySteps: !!processedMessage.recoverySteps?.length,
      hasHelpLinks: !!processedMessage.helpLinks?.length
    });
  }

  /**
   * Get error statistics for debugging
   */
  getErrorStats(): Record<string, number> {
    return Object.fromEntries(this.errorHistory);
  }

  /**
   * Clear error history
   */
  clearHistory(): void {
    this.errorHistory.clear();
  }
}

// Export singleton instance
export const errorMessageService = new ErrorMessageService();

// Export convenience functions
export const getErrorMessage = (error: any, context?: ErrorContext): ErrorMessage => {
  return errorMessageService.getErrorMessage(error, context);
};

export const getErrorStats = (): Record<string, number> => {
  return errorMessageService.getErrorStats();
};

export const clearErrorHistory = (): void => {
  errorMessageService.clearHistory();
};

export default errorMessageService;