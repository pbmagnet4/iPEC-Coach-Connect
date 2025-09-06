/**
 * Comprehensive Error Handling System for iPEC Coach Connect
 * 
 * Centralized error handling with:
 * - Custom error types and error boundaries
 * - Logging and monitoring integration
 * - User-friendly error messages
 * - Error recovery strategies
 * - Performance monitoring
 * - Debug information in development
 */

import { SupabaseError } from './supabase';

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Error categories for better classification
export enum ErrorCategory {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  NETWORK = 'network',
  DATABASE = 'database',
  PAYMENT = 'payment',
  FILE_UPLOAD = 'file_upload',
  REAL_TIME = 'real_time',
  UNKNOWN = 'unknown',
}

// Base error interface
export interface AppError {
  id: string;
  message: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  code?: string;
  details?: any;
  timestamp: string;
  userId?: string;
  context?: Record<string, any>;
  stack?: string;
}

// Custom error classes
export class AppErrorBase extends Error {
  public readonly id: string;
  public readonly category: ErrorCategory;
  public readonly severity: ErrorSeverity;
  public readonly code?: string;
  public readonly details?: any;
  public readonly timestamp: string;
  public readonly userId?: string;
  public readonly context?: Record<string, any>;

  constructor(
    message: string,
    category: ErrorCategory,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    code?: string,
    details?: any,
    context?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.id = this.generateErrorId();
    this.category = category;
    this.severity = severity;
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.context = context;

    // Set userId if available
    if (typeof window !== 'undefined') {
      try {
        const authStorage = localStorage.getItem('auth-storage');
        if (authStorage) {
          const auth = JSON.parse(authStorage);
          this.userId = auth.state?.user?.id;
        }
      } catch {
        // Ignore errors when accessing auth storage
      }
    }

    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  toJSON(): AppError {
    return {
      id: this.id,
      message: this.message,
      category: this.category,
      severity: this.severity,
      code: this.code,
      details: this.details,
      timestamp: this.timestamp,
      userId: this.userId,
      context: this.context,
      stack: this.stack,
    };
  }
}

// Specific error types
export class AuthenticationError extends AppErrorBase {
  constructor(message = 'Authentication failed', code?: string, details?: any) {
    super(message, ErrorCategory.AUTHENTICATION, ErrorSeverity.HIGH, code, details);
  }
}

export class AuthorizationError extends AppErrorBase {
  constructor(message = 'Access denied', code?: string, details?: any) {
    super(message, ErrorCategory.AUTHORIZATION, ErrorSeverity.HIGH, code, details);
  }
}

export class ValidationError extends AppErrorBase {
  constructor(message: string, fields?: Record<string, string[]>, code?: string) {
    super(message, ErrorCategory.VALIDATION, ErrorSeverity.MEDIUM, code, { fields });
  }
}

export class NetworkError extends AppErrorBase {
  constructor(message = 'Network request failed', code?: string, details?: any) {
    super(message, ErrorCategory.NETWORK, ErrorSeverity.MEDIUM, code, details);
  }
}

export class DatabaseError extends AppErrorBase {
  constructor(message = 'Database operation failed', code?: string, details?: any) {
    super(message, ErrorCategory.DATABASE, ErrorSeverity.HIGH, code, details);
  }
}

export class PaymentError extends AppErrorBase {
  constructor(message = 'Payment processing failed', code?: string, details?: any) {
    super(message, ErrorCategory.PAYMENT, ErrorSeverity.HIGH, code, details);
  }
}

export class FileUploadError extends AppErrorBase {
  constructor(message = 'File upload failed', code?: string, details?: any) {
    super(message, ErrorCategory.FILE_UPLOAD, ErrorSeverity.MEDIUM, code, details);
  }
}

export class RealTimeError extends AppErrorBase {
  constructor(message = 'Real-time connection failed', code?: string, details?: any) {
    super(message, ErrorCategory.REAL_TIME, ErrorSeverity.MEDIUM, code, details);
  }
}

// Error recovery strategies
export interface ErrorRecoveryStrategy {
  canRecover: (error: AppError) => boolean;
  recover: (error: AppError) => Promise<void>;
  description: string;
}

// User-friendly error messages
const ERROR_MESSAGES: Record<string, string> = {
  // Authentication errors
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/user-disabled': 'This account has been disabled. Please contact support.',
  'auth/user-not-found': 'No account found with this email address.',
  'auth/wrong-password': 'Incorrect password. Please try again.',
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/weak-password': 'Password is too weak. Please choose a stronger password.',
  'auth/too-many-requests': 'Too many failed attempts. Please try again later.',

  // Network errors
  'network/offline': 'You appear to be offline. Please check your internet connection.',
  'network/timeout': 'Request timed out. Please try again.',
  'network/server-error': 'Server error. Please try again later.',

  // Database errors
  'database/connection-failed': 'Unable to connect to the database. Please try again.',
  'database/constraint-violation': 'This operation would violate data constraints.',
  'database/not-found': 'The requested resource was not found.',

  // Payment errors
  'payment/card-declined': 'Your card was declined. Please try a different payment method.',
  'payment/insufficient-funds': 'Insufficient funds. Please use a different payment method.',
  'payment/expired-card': 'Your card has expired. Please update your payment information.',
  'payment/invalid-cvc': 'Invalid security code. Please check your card details.',

  // File upload errors
  'upload/file-too-large': 'File is too large. Please choose a smaller file.',
  'upload/invalid-file-type': 'File type not supported. Please choose a different file.',
  'upload/upload-failed': 'File upload failed. Please try again.',

  // Validation errors
  'validation/required-field': 'This field is required.',
  'validation/invalid-format': 'Please enter a valid format.',
  'validation/email-format': 'Please enter a valid email address.',
  'validation/phone-format': 'Please enter a valid phone number.',

  // Generic errors
  'generic/unexpected-error': 'An unexpected error occurred. Please try again.',
  'generic/session-expired': 'Your session has expired. Please log in again.',
  'generic/rate-limited': 'Too many requests. Please slow down.',
};

/**
 * Error Handler Class
 */
class ErrorHandler {
  private recoveryStrategies: ErrorRecoveryStrategy[] = [];
  private errorListeners: ((error: AppError) => void)[] = [];

  constructor() {
    this.initializeRecoveryStrategies();
    this.setupGlobalErrorHandlers();
  }

  /**
   * Handle any error and transform it to AppError
   */
  handleError(error: any, context?: Record<string, any>): AppError {
    let appError: AppError;

    if (error instanceof AppErrorBase) {
      appError = error.toJSON();
    } else if (error instanceof SupabaseError) {
      appError = this.transformSupabaseError(error, context);
    } else if (error instanceof Error) {
      appError = this.transformGenericError(error, context);
    } else {
      appError = this.createUnknownError(error, context);
    }

    // Log the error
    this.logError(appError);

    // Notify listeners
    this.notifyListeners(appError);

    // Attempt recovery
    this.attemptRecovery(appError);

    return appError;
  }

  /**
   * Get user-friendly error message
   */
  getUserFriendlyMessage(error: AppError): string {
    const codeMessage = error.code ? ERROR_MESSAGES[error.code] : undefined;
    const categoryMessage = this.getCategoryMessage(error.category);
    
    return codeMessage || categoryMessage || error.message || ERROR_MESSAGES['generic/unexpected-error'];
  }

  /**
   * Check if error can be recovered
   */
  canRecover(error: AppError): boolean {
    return this.recoveryStrategies.some(strategy => strategy.canRecover(error));
  }

  /**
   * Attempt to recover from error
   */
  async attemptRecovery(error: AppError): Promise<boolean> {
    const strategy = this.recoveryStrategies.find(s => s.canRecover(error));
    
    if (strategy) {
      try {
        await strategy.recover(error);
        return true;
      } catch (recoveryError) {
        console.error('Error recovery failed:', recoveryError);
        return false;
      }
    }
    
    return false;
  }

  /**
   * Add error listener
   */
  onError(listener: (error: AppError) => void): () => void {
    this.errorListeners.push(listener);
    
    return () => {
      const index = this.errorListeners.indexOf(listener);
      if (index > -1) {
        this.errorListeners.splice(index, 1);
      }
    };
  }

  /**
   * Add recovery strategy
   */
  addRecoveryStrategy(strategy: ErrorRecoveryStrategy): void {
    this.recoveryStrategies.push(strategy);
  }

  // Private methods

  private transformSupabaseError(error: SupabaseError, context?: Record<string, any>): AppError {
    let category = ErrorCategory.DATABASE;
    let severity = ErrorSeverity.MEDIUM;

    // Categorize based on error code or message
    if (error.message.includes('auth')) {
      category = ErrorCategory.AUTHENTICATION;
      severity = ErrorSeverity.HIGH;
    } else if (error.message.includes('permission') || error.message.includes('access')) {
      category = ErrorCategory.AUTHORIZATION;
      severity = ErrorSeverity.HIGH;
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      category = ErrorCategory.NETWORK;
      severity = ErrorSeverity.MEDIUM;
    }

    return {
      id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      message: error.message,
      category,
      severity,
      code: error.code,
      details: error.details,
      timestamp: new Date().toISOString(),
      context,
      stack: error.stack,
    };
  }

  private transformGenericError(error: Error, context?: Record<string, any>): AppError {
    let category = ErrorCategory.UNKNOWN;
    const severity = ErrorSeverity.MEDIUM;

    // Try to categorize based on error message
    const message = error.message.toLowerCase();
    if (message.includes('network') || message.includes('fetch')) {
      category = ErrorCategory.NETWORK;
    } else if (message.includes('validation') || message.includes('invalid')) {
      category = ErrorCategory.VALIDATION;
    }

    return {
      id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      message: error.message,
      category,
      severity,
      timestamp: new Date().toISOString(),
      context,
      stack: error.stack,
    };
  }

  private createUnknownError(error: any, context?: Record<string, any>): AppError {
    return {
      id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      message: typeof error === 'string' ? error : 'An unknown error occurred',
      category: ErrorCategory.UNKNOWN,
      severity: ErrorSeverity.MEDIUM,
      timestamp: new Date().toISOString(),
      context,
      details: error,
    };
  }

  private getCategoryMessage(category: ErrorCategory): string {
    switch (category) {
      case ErrorCategory.AUTHENTICATION:
        return 'Authentication failed. Please log in again.';
      case ErrorCategory.AUTHORIZATION:
        return 'You do not have permission to perform this action.';
      case ErrorCategory.VALIDATION:
        return 'Please check your input and try again.';
      case ErrorCategory.NETWORK:
        return 'Network error. Please check your connection and try again.';
      case ErrorCategory.DATABASE:
        return 'Data operation failed. Please try again.';
      case ErrorCategory.PAYMENT:
        return 'Payment processing failed. Please try again.';
      case ErrorCategory.FILE_UPLOAD:
        return 'File upload failed. Please try again.';
      case ErrorCategory.REAL_TIME:
        return 'Real-time connection failed. Some features may not work properly.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  private logError(error: AppError): void {
    const isProduction = import.meta.env.VITE_APP_ENVIRONMENT === 'production';
    const isDevelopment = import.meta.env.VITE_ENABLE_DEBUG_MODE === 'true';

    if (isDevelopment) {
      console.group(`🚨 ${error.category.toUpperCase()} ERROR`);
      console.error('Message:', error.message);
      console.error('ID:', error.id);
      console.error('Severity:', error.severity);
      console.error('Code:', error.code);
      console.error('Details:', error.details);
      console.error('Context:', error.context);
      console.error('Stack:', error.stack);
      console.groupEnd();
    }

    // In production, send to monitoring service
    if (isProduction && error.severity !== ErrorSeverity.LOW) {
      this.sendToMonitoring(error);
    }
  }

  private sendToMonitoring(error: AppError): void {
    // Integration with monitoring services like Sentry, LogRocket, etc.
    // This would be configured based on the chosen monitoring solution
    
    if (import.meta.env.VITE_SENTRY_DSN) {
      // Send to Sentry
      try {
        (window as any).Sentry?.captureException(new Error(error.message), {
          tags: {
            category: error.category,
            severity: error.severity,
            errorId: error.id,
          },
          extra: {
            code: error.code,
            details: error.details,
            context: error.context,
            userId: error.userId,
          },
        });
      } catch {
        // Ignore monitoring errors
      }
    }
  }

  private notifyListeners(error: AppError): void {
    this.errorListeners.forEach(listener => {
      try {
        listener(error);
      } catch {
        // Ignore listener errors
      }
    });
  }

  private initializeRecoveryStrategies(): void {
    // Session expired recovery
    this.addRecoveryStrategy({
      canRecover: (error) => 
        error.category === ErrorCategory.AUTHENTICATION && 
        error.code === 'auth/session-expired',
      recover: async () => {
        // Redirect to login
        window.location.href = '/auth/login';
      },
      description: 'Redirect to login when session expires',
    });

    // Network retry strategy
    this.addRecoveryStrategy({
      canRecover: (error) => 
        error.category === ErrorCategory.NETWORK,
      recover: async (error) => {
        // Retry the operation after a delay
        if (error.context?.retryCallback) {
          setTimeout(() => {
            error.context.retryCallback();
          }, 2000);
        }
      },
      description: 'Retry network operations after delay',
    });

    // Real-time reconnection
    this.addRecoveryStrategy({
      canRecover: (error) => 
        error.category === ErrorCategory.REAL_TIME,
      recover: async () => {
        // Attempt to reconnect real-time subscriptions
        // This would be implemented based on the specific real-time system
      },
      description: 'Reconnect real-time subscriptions',
    });
  }

  private setupGlobalErrorHandlers(): void {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const error = this.handleError(event.reason, { type: 'unhandledrejection' });
      if (error.severity === ErrorSeverity.CRITICAL) {
        event.preventDefault(); // Prevent default browser error handling
      }
    });

    // Handle global JavaScript errors
    window.addEventListener('error', (event) => {
      const error = this.handleError(event.error, { 
        type: 'globalerror',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
      
      if (error.severity === ErrorSeverity.CRITICAL) {
        event.preventDefault(); // Prevent default browser error handling
      }
    });
  }
}

// Export singleton instance
export const errorHandler = new ErrorHandler();

// Convenience function for handling errors
export function handleError(error: any, context?: Record<string, any>): AppError {
  return errorHandler.handleError(error, context);
}

// Convenience function for getting user-friendly messages
export function getUserFriendlyMessage(error: AppError): string {
  return errorHandler.getUserFriendlyMessage(error);
}

export default errorHandler;