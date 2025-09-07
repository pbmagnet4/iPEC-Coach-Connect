/**
 * Session Security Middleware for iPEC Coach Connect
 * 
 * Middleware for API calls and authenticated operations that:
 * - Validates session security before requests
 * - Handles session refresh automatically
 * - Detects and responds to security violations
 * - Provides session timeout warnings
 * - Manages session activity tracking
 */

import { logSecurity } from './secure-logger';
import { invalidateSession, refreshSession, validateSession } from './session-security';
import { authService } from '../services/auth.service';
import type { SessionValidationResult } from './session-security';

// Middleware configuration
export interface SessionMiddlewareConfig {
  autoRefresh: boolean;
  securityViolationAction: 'warn' | 'block' | 'logout';
  sessionTimeoutWarning: number; // minutes before expiry
  activityTracking: boolean;
  rateLimitBypass: boolean;
}

// Middleware result
export interface SessionMiddlewareResult {
  allowed: boolean;
  sessionValid: boolean;
  error?: string;
  warningMessage?: string;
  securityViolation?: boolean;
  requiresRefresh?: boolean;
  timeUntilExpiry?: number;
  action?: 'allow' | 'refresh' | 'warn' | 'block' | 'logout';
}

// Request context for session validation
export interface RequestContext {
  url: string;
  method: string;
  headers?: Record<string, string>;
  userAgent?: string;
  ipAddress?: string;
  timestamp: number;
  userId?: string;
  sessionId?: string;
}

class SessionSecurityMiddleware {
  private config: SessionMiddlewareConfig;
  private sessionWarnings = new Map<string, number>();
  private activityTracker = new Map<string, number>();

  constructor(config: Partial<SessionMiddlewareConfig> = {}) {
    this.config = {
      autoRefresh: config.autoRefresh ?? true,
      securityViolationAction: config.securityViolationAction || 'warn',
      sessionTimeoutWarning: config.sessionTimeoutWarning || 10, // 10 minutes
      activityTracking: config.activityTracking ?? true,
      rateLimitBypass: config.rateLimitBypass ?? false,
    };
  }

  /**
   * Validate session before API request
   */
  async validateRequest(context: RequestContext): Promise<SessionMiddlewareResult> {
    try {
      const authState = authService.getState();
      const { secureSession, user } = authState;

      // Check if user is authenticated
      if (!user || !secureSession) {
        return {
          allowed: false,
          sessionValid: false,
          error: 'User not authenticated',
          action: 'block'
        };
      }

      // Validate session security
      const validation = await validateSession(secureSession.sessionId);
      
      if (!validation.isValid) {
        const result = await this.handleInvalidSession(validation, context);
        return result;
      }

      // Check for security violations
      if (validation.securityRisk && validation.securityRisk !== 'low') {
        const result = await this.handleSecurityViolation(validation, context);
        if (!result.allowed) {
          return result;
        }
      }

      // Check session timeout warning
      const timeUntilExpiry = secureSession.expiresAt - Date.now();
      const warningThreshold = this.config.sessionTimeoutWarning * 60 * 1000;
      let warningMessage: string | undefined;

      if (timeUntilExpiry < warningThreshold) {
        warningMessage = `Session expires in ${Math.ceil(timeUntilExpiry / 60000)} minutes`;
  void his.trackSessionWarning(secureSession.sessionId, timeUntilExpiry);
      }

      // Handle auto-refresh
      if (this.config.autoRefresh && validation.requiresRefresh) {
        try {
          await authService.refreshCurrentSession();
          logSecurity('Session auto-refreshed', 'low', {
            userId: user.id,
            sessionId: `${secureSession.sessionId.substring(0, 8)  }...`,
            context: context.url
          });
        } catch (error) {
          logSecurity('Auto-refresh failed', 'medium', {
            userId: user.id,
            error: error instanceof Error ? error.message : 'Unknown error',
            context: context.url
          });
        }
      }

      // Track activity
      if (this.config.activityTracking) {
  void his.trackSessionActivity(secureSession.sessionId, context);
      }

      return {
        allowed: true,
        sessionValid: true,
        warningMessage,
        requiresRefresh: validation.requiresRefresh,
        timeUntilExpiry: Math.ceil(timeUntilExpiry / 60000),
        action: 'allow'
      };
    } catch (error) {
      logSecurity('Session validation middleware error', 'medium', {
        error: error instanceof Error ? error.message : 'Unknown error',
        context: context.url
      });

      return {
        allowed: false,
        sessionValid: false,
        error: 'Session validation failed',
        action: 'block'
      };
    }
  }

  /**
   * Handle invalid session
   */
  private async handleInvalidSession(
    validation: SessionValidationResult,
    context: RequestContext
  ): Promise<SessionMiddlewareResult> {
    const authState = authService.getState();
    const { user, secureSession } = authState;

    logSecurity('Invalid session detected', 'high', {
      userId: user?.id,
      sessionId: `${secureSession?.sessionId?.substring(0, 8)  }...`,
      error: validation.error,
      context: context.url
    });

    // Determine action based on validation result
    if (validation.action === 'invalidate' || validation.securityRisk === 'critical') {
      // Force logout for critical security violations
      try {
        await authService.signOut();
      } catch (error) {
        logSecurity('Failed to sign out user during security violation', 'high', {
          userId: user?.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      return {
        allowed: false,
        sessionValid: false,
        error: 'Session invalidated due to security violation',
        securityViolation: true,
        action: 'logout'
      };
    }

    return {
      allowed: false,
      sessionValid: false,
      error: validation.error || 'Session invalid',
      action: 'block'
    };
  }

  /**
   * Handle security violation
   */
  private async handleSecurityViolation(
    validation: SessionValidationResult,
    context: RequestContext
  ): Promise<SessionMiddlewareResult> {
    const authState = authService.getState();
    const { user, secureSession } = authState;

    logSecurity('Security violation detected', validation.securityRisk || 'medium', {
      userId: user?.id,
      sessionId: `${secureSession?.sessionId?.substring(0, 8)  }...`,
      riskLevel: validation.securityRisk,
      context: context.url,
      action: validation.action
    });

    // Handle based on configuration
    switch (this.config.securityViolationAction) {
      case 'logout':
        try {
          await authService.signOut();
        } catch (error) {
          logSecurity('Failed to sign out user during security violation', 'high', {
            userId: user?.id,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
        return {
          allowed: false,
          sessionValid: false,
          error: 'Session terminated due to security violation',
          securityViolation: true,
          action: 'logout'
        };

      case 'block':
        return {
          allowed: false,
          sessionValid: false,
          error: 'Request blocked due to security violation',
          securityViolation: true,
          action: 'block'
        };

      case 'warn':
      default:
        return {
          allowed: true,
          sessionValid: true,
          warningMessage: `Security risk detected: ${validation.securityRisk}`,
          securityViolation: true,
          action: 'warn'
        };
    }
  }

  /**
   * Track session warning
   */
  private trackSessionWarning(sessionId: string, timeUntilExpiry: number): void {
    const lastWarning = this.sessionWarnings.get(sessionId) || 0;
    const now = Date.now();
    
    // Only warn once per 5 minutes
    if (now - lastWarning > 5 * 60 * 1000) {
      this.sessionWarnings.set(sessionId, now);
      
      // Emit warning event (could be used by UI components)
  void his.emitSessionWarning(sessionId, timeUntilExpiry);
    }
  }

  /**
   * Track session activity
   */
  private trackSessionActivity(sessionId: string, context: RequestContext): void {
    const key = `${sessionId}_activity`;
    this.activityTracker.set(key, Date.now());

    // Log activity for security monitoring
    logSecurity('Session activity tracked', 'low', {
      sessionId: `${sessionId.substring(0, 8)  }...`,
      url: context.url,
      method: context.method,
      userAgent: `${context.userAgent?.substring(0, 50)  }...`
    });
  }

  /**
   * Emit session warning event
   */
  private emitSessionWarning(sessionId: string, timeUntilExpiry: number): void {
    try {
      const event = new CustomEvent('sessionWarning', {
        detail: {
          sessionId: `${sessionId.substring(0, 8)  }...`,
          timeUntilExpiry: Math.ceil(timeUntilExpiry / 60000),
          message: `Session expires in ${Math.ceil(timeUntilExpiry / 60000)} minutes`
        }
      });
      
  void window.dispatchEvent(event);
    } catch (error) {
      // Ignore errors in event emission
    }
  }

  /**
   * Create request context from current environment
   */
  createRequestContext(url: string, method = 'GET'): RequestContext {
    return {
      url,
      method,
      headers: {},
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
      userId: authService.getState().user?.id,
      sessionId: authService.getState().secureSession?.sessionId
    };
  }

  /**
   * Axios request interceptor
   */
  axiosRequestInterceptor = async (config: any) => {
    const context = this.createRequestContext(
      config.url || '',
      config.method?.toUpperCase() || 'GET'
    );

    const validation = await this.validateRequest(context);
    
    if (!validation.allowed) {
      throw new Error(validation.error || 'Session validation failed');
    }

    // Add session warning header if applicable
    if (validation.warningMessage) {
      config.headers['X-Session-Warning'] = validation.warningMessage;
    }

    return config;
  };

  /**
   * Fetch request interceptor
   */
  fetchRequestInterceptor = async (url: string, options: RequestInit = {}): Promise<RequestInit> => {
    const context = this.createRequestContext(url, options.method || 'GET');
    const validation = await this.validateRequest(context);
    
    if (!validation.allowed) {
      throw new Error(validation.error || 'Session validation failed');
    }

    // Add session warning header if applicable
    if (validation.warningMessage) {
      options.headers = {
        ...options.headers,
        'X-Session-Warning': validation.warningMessage
      };
    }

    return options;
  };

  /**
   * Generic API call wrapper
   */
  async secureApiCall<T>(
    apiCall: () => Promise<T>,
    context: RequestContext
  ): Promise<T> {
    const validation = await this.validateRequest(context);
    
    if (!validation.allowed) {
      throw new Error(validation.error || 'Session validation failed');
    }

    try {
      const result = await apiCall();
      
      // Track successful API call
      if (this.config.activityTracking) {
  void his.trackSessionActivity(context.sessionId || '', context);
      }
      
      return result;
    } catch (error) {
      // Log API call failure
      logSecurity('Secure API call failed', 'low', {
        context: context.url,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Check if session needs refresh
   */
  shouldRefreshSession(): boolean {
    const authState = authService.getState();
    const { secureSession } = authState;
    
    if (!secureSession) {
      return false;
    }

    const timeUntilExpiry = secureSession.expiresAt - Date.now();
    const refreshThreshold = 30 * 60 * 1000; // 30 minutes
    
    return timeUntilExpiry < refreshThreshold;
  }

  /**
   * Get session security status
   */
  getSessionStatus(): {
    isValid: boolean;
    timeUntilExpiry: number;
    requiresRefresh: boolean;
    securityRisk: string;
    concurrentSessions: number;
  } {
    const authState = authService.getState();
    const { secureSession, sessionValidation, concurrentSessions } = authState;
    
    if (!secureSession) {
      return {
        isValid: false,
        timeUntilExpiry: 0,
        requiresRefresh: false,
        securityRisk: 'critical',
        concurrentSessions: 0
      };
    }

    const timeUntilExpiry = Math.max(0, secureSession.expiresAt - Date.now());
    
    return {
      isValid: sessionValidation?.isValid ?? false,
      timeUntilExpiry: Math.ceil(timeUntilExpiry / 60000),
      requiresRefresh: sessionValidation?.requiresRefresh ?? false,
      securityRisk: sessionValidation?.securityRisk ?? 'unknown',
      concurrentSessions: concurrentSessions || 0
    };
  }

  /**
   * Cleanup middleware resources
   */
  cleanup(): void {
    this.sessionWarnings.clear();
    this.activityTracker.clear();
  }
}

// Export singleton instance
export const sessionMiddleware = new SessionSecurityMiddleware();

// Export convenience functions
export const validateRequest = sessionMiddleware.validateRequest.bind(sessionMiddleware);
export const createRequestContext = sessionMiddleware.createRequestContext.bind(sessionMiddleware);
export const secureApiCall = sessionMiddleware.secureApiCall.bind(sessionMiddleware);
export const shouldRefreshSession = sessionMiddleware.shouldRefreshSession.bind(sessionMiddleware);
export const getSessionStatus = sessionMiddleware.getSessionStatus.bind(sessionMiddleware);

// Export interceptors
export const {axiosRequestInterceptor} = sessionMiddleware;
export const {fetchRequestInterceptor} = sessionMiddleware;

export default sessionMiddleware;