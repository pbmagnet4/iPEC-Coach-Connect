/**
 * Services Index for iPEC Coach Connect
 * 
 * Centralized export of all services with organized structure and convenience exports.
 * This file provides the main entry point for accessing all application services.
 */

// Core infrastructure services
export { default as supabase } from '../lib/supabase';
export { supabaseUtils, connectionMonitor, subscriptions } from '../lib/supabase';
export { errorHandler, handleError, getUserFriendlyMessage } from '../lib/error-handling';

// Type exports
export type {
  Profile,
  Coach,
  Session,
  Notification,
  CoachWithProfile,
  SessionWithDetails,
  ApiResponse,
  PaginatedResponse,
  UserRole,
} from '../types/database';

// Authentication services
export { authService } from './auth.service';
export type {
  AuthState,
  SignUpData,
  SignInData,
  CoachApplicationData,
} from './auth.service';

// Core API services
export { apiService, profileService, coachService, sessionService, notificationService, subscriptionService } from './api.service';
export type {
  PaginationOptions,
  CoachFilters,
  SessionFilters,
} from './api.service';

// Profile management services
export { userProfileService } from './profile.service';
export type {
  ProfileData,
  ProfileSettings,
  ProfileUpdateData,
  ProfileValidationResult,
} from './profile.service';

// Coach management services
export { coachManagementService } from './coach.service';
export type {
  CoachProfile,
  CoachAvailabilitySlot,
  CoachSchedule,
  CoachApplication,
  CoachVerificationData,
  CoachSearchFilters,
  CoachAnalytics,
} from './coach.service';

// Booking and session services
export { bookingService } from './booking.service';
export type {
  BookingRequest,
  BookingResponse,
  AvailableSlot,
  SessionRescheduleRequest,
  SessionCancellationRequest,
  SessionCompletionData,
  BookingFilters,
} from './booking.service';

// Messaging and notification services
export { messagingService, notificationManagementService } from './messaging.service';
export type {
  Message,
  Conversation,
  ConversationWithDetails,
  SendMessageRequest,
  NotificationPreferences,
  TypingIndicator,
} from './messaging.service';

// Convenience service collections
export const services = {
  // Authentication
  auth: authService,
  
  // Core API
  api: apiService,
  profiles: profileService,
  coaches: coachService,
  sessions: sessionService,
  notifications: notificationService,
  subscriptions: subscriptionService,
  
  // High-level services
  userProfile: userProfileService,
  coachManagement: coachManagementService,
  booking: bookingService,
  messaging: messagingService,
  notificationManagement: notificationManagementService,
  
  // Infrastructure
  error: errorHandler,
} as const;

// Utility functions for common operations
export const serviceUtils = {
  /**
   * Initialize all services for the application
   */
  async initialize() {
    try {
      // Services auto-initialize, but we can add any startup logic here
      console.log('🚀 iPEC Coach Connect services initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize services:', error);
      return false;
    }
  },

  /**
   * Check if user is authenticated across all services
   */
  isAuthenticated(): boolean {
    return authService.getState().isAuthenticated;
  },

  /**
   * Get current user information
   */
  getCurrentUser() {
    const authState = authService.getState();
    return {
      user: authState.user,
      profile: authState.profile,
      coach: authState.coach,
      role: authState.role,
      isAuthenticated: authState.isAuthenticated,
    };
  },

  /**
   * Check if current user has a specific permission
   */
  hasPermission(permission: string): boolean {
    return authService.hasPermission(permission as any);
  },

  /**
   * Clean up all service subscriptions
   */
  cleanup() {
    subscriptionService.unsubscribeAll();
    console.log('🧹 Services cleaned up');
  },

  /**
   * Get connection status across all services
   */
  getConnectionStatus() {
    return connectionMonitor.getStatus();
  },

  /**
   * Handle service errors consistently
   */
  handleServiceError(error: any, context?: Record<string, any>) {
    return errorHandler.handleError(error, context);
  },

  /**
   * Batch multiple service operations
   */
  async batchOperations<T>(operations: (() => Promise<T>)[]): Promise<T[]> {
    try {
      return await Promise.all(operations.map(op => op()));
    } catch (error) {
      throw errorHandler.handleError(error, { context: 'batch_operations' });
    }
  },

  /**
   * Retry a service operation with exponential backoff
   */
  async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    baseDelay = 1000
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries) {
          break;
        }
        
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw errorHandler.handleError(lastError, { 
      context: 'retry_operation',
      maxRetries,
      baseDelay,
    });
  },

  /**
   * Cache service results with TTL
   */
  cache: (() => {
    const cache = new Map<string, { data: any; expires: number }>();
    
    return {
      get<T>(key: string): T | null {
        const item = cache.get(key);
        if (!item || Date.now() > item.expires) {
          cache.delete(key);
          return null;
        }
        return item.data;
      },
      
      set<T>(key: string, data: T, ttlMs = 300000): void {
        cache.set(key, {
          data,
          expires: Date.now() + ttlMs,
        });
      },
      
      delete(key: string): void {
        cache.delete(key);
      },
      
      clear(): void {
        cache.clear();
      },
      
      size(): number {
        return cache.size;
      },
    };
  })(),
} as const;

// React hooks for service integration (if using React)
export const serviceHooks = {
  /**
   * Hook for using authentication state
   */
  useAuth() {
    // This would be implemented as a React hook in a React-specific file
    // For now, just return the current state
    return authService.getState();
  },

  /**
   * Hook for using connection status
   */
  useConnectionStatus() {
    // This would be implemented as a React hook
    return connectionMonitor.getStatus();
  },

  /**
   * Hook for using notification count
   */
  useNotificationCount() {
    // This would be implemented as a React hook
    return 0; // Placeholder
  },
} as const;

// Service health check utilities
export const serviceHealth = {
  /**
   * Check health of all critical services
   */
  async checkHealth() {
    const checks = {
      database: false,
      authentication: false,
      storage: false,
      realtime: false,
    };

    try {
      // Database health check
      checks.database = await supabaseUtils.db.healthCheck();

      // Authentication health check
      checks.authentication = await supabaseUtils.isAuthenticated();

      // Storage health check (try to get a public URL)
      try {
        await supabaseUtils.storage.getPublicUrl('test', 'test.txt');
        checks.storage = true;
      } catch {
        checks.storage = false;
      }

      // Real-time health check
      checks.realtime = connectionMonitor.getStatus().isConnected;

      return {
        healthy: Object.values(checks).every(Boolean),
        checks,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        healthy: false,
        checks,
        error: errorHandler.handleError(error),
        timestamp: new Date().toISOString(),
      };
    }
  },

  /**
   * Get service performance metrics
   */
  getMetrics() {
    const metrics = {
      cacheSize: serviceUtils.cache.size(),
      connectionStatus: connectionMonitor.getStatus(),
      subscriptionCount: 0, // Would track active subscriptions
      errorCount: 0, // Would track recent errors
      lastHealthCheck: new Date().toISOString(),
    };

    return metrics;
  },
} as const;

// Default export for convenience
export default services;

// Development utilities
if (import.meta.env.VITE_ENABLE_DEBUG_MODE === 'true') {
  // Expose services to window for debugging
  (window as any).services = services;
  (window as any).serviceUtils = serviceUtils;
  (window as any).serviceHealth = serviceHealth;
  
  console.log('🔧 Services exposed to window for debugging');
  console.log('🔧 Available: window.services, window.serviceUtils, window.serviceHealth');
}