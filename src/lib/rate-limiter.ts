/**
 * Rate Limiting Service for iPEC Coach Connect
 * 
 * ⚠️ DEPRECATED: This basic rate limiter is deprecated in favor of the enhanced version.
 * Please use 'rate-limiter-enhanced.ts' for new implementations.
 * 
 * Enhanced features include:
 * - Progressive delays (exponential backoff)
 * - Account-level lockout
 * - Redis-ready distributed rate limiting
 * - Bypass for verified users and admin override
 * - Enhanced security logging
 * - Thread-safe concurrent operations
 * 
 * @deprecated Use rate-limiter-enhanced.ts instead
 * 
 * Implements client-side rate limiting with configurable limits for different
 * types of operations to prevent abuse and enhance security.
 */

import { logSecurity } from './secure-logger';

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number; // Time window in milliseconds
  blockDurationMs?: number; // How long to block after limit exceeded
  skipSuccessfulAttempts?: boolean; // Reset counter on successful attempts
}

interface AttemptRecord {
  count: number;
  firstAttempt: number;
  lastAttempt: number;
  isBlocked: boolean;
  blockExpires?: number;
}

class RateLimiter {
  private attempts: Map<string, AttemptRecord> = new Map();
  private configs: Map<string, RateLimitConfig> = new Map();

  constructor() {
    // Default configurations for different operation types
    this.setConfig('auth.signin', {
      maxAttempts: 5,
      windowMs: 15 * 60 * 1000, // 15 minutes
      blockDurationMs: 30 * 60 * 1000, // 30 minutes
      skipSuccessfulAttempts: true
    });

    this.setConfig('auth.signup', {
      maxAttempts: 3,
      windowMs: 60 * 60 * 1000, // 1 hour
      blockDurationMs: 60 * 60 * 1000, // 1 hour
      skipSuccessfulAttempts: true
    });

    this.setConfig('auth.password_reset', {
      maxAttempts: 3,
      windowMs: 60 * 60 * 1000, // 1 hour
      blockDurationMs: 60 * 60 * 1000, // 1 hour
      skipSuccessfulAttempts: false
    });

    this.setConfig('auth.oauth', {
      maxAttempts: 10,
      windowMs: 10 * 60 * 1000, // 10 minutes
      blockDurationMs: 20 * 60 * 1000, // 20 minutes
      skipSuccessfulAttempts: true
    });

    // Cleanup expired records every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Set rate limit configuration for an operation type
   */
  setConfig(operationType: string, config: RateLimitConfig): void {
    this.configs.set(operationType, config);
  }

  /**
   * Get identifier for rate limiting (combines operation type and client info)
   */
  private getIdentifier(operationType: string, clientIdentifier?: string): string {
    // Use client identifier if provided, otherwise use a browser fingerprint
    const client = clientIdentifier || this.getBrowserFingerprint();
    return `${operationType}:${client}`;
  }

  /**
   * Generate a simple browser fingerprint for rate limiting
   */
  private getBrowserFingerprint(): string {
    if (typeof window === 'undefined') {
      return 'server';
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx!.textBaseline = 'top';
    ctx!.font = '14px Arial';
    ctx!.fillText('Browser fingerprint', 2, 2);
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL()
    ].join('|');

    // Simple hash function
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return Math.abs(hash).toString(36);
  }

  /**
   * Check if an operation is allowed
   */
  isAllowed(operationType: string, clientIdentifier?: string): {
    allowed: boolean;
    remainingAttempts: number;
    resetTime: number;
    blockExpires?: number;
  } {
    const config = this.configs.get(operationType);
    if (!config) {
      // No rate limiting configured for this operation
      return {
        allowed: true,
        remainingAttempts: Infinity,
        resetTime: 0
      };
    }

    const identifier = this.getIdentifier(operationType, clientIdentifier);
    const now = Date.now();
    const record = this.attempts.get(identifier);

    // No previous attempts
    if (!record) {
      return {
        allowed: true,
        remainingAttempts: config.maxAttempts - 1,
        resetTime: now + config.windowMs
      };
    }

    // Check if currently blocked
    if (record.isBlocked && record.blockExpires && now < record.blockExpires) {
      logSecurity('Rate limit block active', 'medium', {
        operationType,
        clientIdentifier: identifier,
        blockExpires: new Date(record.blockExpires).toISOString()
      });

      return {
        allowed: false,
        remainingAttempts: 0,
        resetTime: record.blockExpires,
        blockExpires: record.blockExpires
      };
    }

    // Check if window has expired
    if (now - record.firstAttempt > config.windowMs) {
      // Window expired, reset the record
      this.attempts.delete(identifier);
      return {
        allowed: true,
        remainingAttempts: config.maxAttempts - 1,
        resetTime: now + config.windowMs
      };
    }

    // Check if limit exceeded
    if (record.count >= config.maxAttempts) {
      const blockExpires = config.blockDurationMs 
        ? now + config.blockDurationMs 
        : record.firstAttempt + config.windowMs;

      // Update record to blocked state
      this.attempts.set(identifier, {
        ...record,
        isBlocked: true,
        blockExpires
      });

      logSecurity('Rate limit exceeded', 'high', {
        operationType,
        clientIdentifier: identifier,
        attemptCount: record.count,
        blockExpires: new Date(blockExpires).toISOString()
      });

      return {
        allowed: false,
        remainingAttempts: 0,
        resetTime: blockExpires,
        blockExpires
      };
    }

    // Allow the attempt
    return {
      allowed: true,
      remainingAttempts: config.maxAttempts - record.count - 1,
      resetTime: record.firstAttempt + config.windowMs
    };
  }

  /**
   * Record an attempt for rate limiting
   */
  recordAttempt(operationType: string, success: boolean, clientIdentifier?: string): void {
    const config = this.configs.get(operationType);
    if (!config) {
      return; // No rate limiting configured
    }

    const identifier = this.getIdentifier(operationType, clientIdentifier);
    const now = Date.now();
    const record = this.attempts.get(identifier);

    // If successful and we should skip successful attempts, reset or don't record
    if (success && config.skipSuccessfulAttempts) {
      if (record) {
        this.attempts.delete(identifier);
      }
      return;
    }

    if (!record) {
      // First attempt
      this.attempts.set(identifier, {
        count: 1,
        firstAttempt: now,
        lastAttempt: now,
        isBlocked: false
      });
    } else {
      // Subsequent attempt
      this.attempts.set(identifier, {
        ...record,
        count: record.count + 1,
        lastAttempt: now
      });
    }

    logSecurity('Authentication attempt recorded', 'low', {
      operationType,
      success,
      attemptCount: (record?.count || 0) + 1,
      maxAttempts: config.maxAttempts
    });
  }

  /**
   * Get current status for an operation type and client
   */
  getStatus(operationType: string, clientIdentifier?: string): {
    attempts: number;
    maxAttempts: number;
    isBlocked: boolean;
    blockExpires?: number;
    windowExpires: number;
  } | null {
    const config = this.configs.get(operationType);
    if (!config) {
      return null;
    }

    const identifier = this.getIdentifier(operationType, clientIdentifier);
    const record = this.attempts.get(identifier);

    if (!record) {
      return {
        attempts: 0,
        maxAttempts: config.maxAttempts,
        isBlocked: false,
        windowExpires: 0
      };
    }

    return {
      attempts: record.count,
      maxAttempts: config.maxAttempts,
      isBlocked: record.isBlocked,
      blockExpires: record.blockExpires,
      windowExpires: record.firstAttempt + config.windowMs
    };
  }

  /**
   * Reset rate limiting for a specific operation and client
   */
  reset(operationType: string, clientIdentifier?: string): void {
    const identifier = this.getIdentifier(operationType, clientIdentifier);
    this.attempts.delete(identifier);

    logSecurity('Rate limit reset', 'low', {
      operationType,
      clientIdentifier: identifier
    });
  }

  /**
   * Clean up expired records
   */
  private cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [identifier, record] of this.attempts.entries()) {
      const [operationType] = identifier.split(':');
      const config = this.configs.get(operationType);
      
      if (!config) {
        this.attempts.delete(identifier);
        cleanedCount++;
        continue;
      }

      // Remove if window has expired and not blocked, or if block has expired
      const windowExpired = now - record.firstAttempt > config.windowMs;
      const blockExpired = record.blockExpires && now > record.blockExpires;

      if ((windowExpired && !record.isBlocked) || blockExpired) {
        this.attempts.delete(identifier);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logSecurity('Rate limiter cleanup completed', 'low', {
        recordsCleaned: cleanedCount,
        totalRecords: this.attempts.size
      });
    }
  }

  /**
   * Get all current rate limit records (for debugging)
   */
  getDebugInfo(): { [key: string]: any } {
    const debugInfo: { [key: string]: any } = {};
    
    for (const [identifier, record] of this.attempts.entries()) {
      debugInfo[identifier] = {
        ...record,
        firstAttemptDate: new Date(record.firstAttempt).toISOString(),
        lastAttemptDate: new Date(record.lastAttempt).toISOString(),
        blockExpiresDate: record.blockExpires ? new Date(record.blockExpires).toISOString() : null
      };
    }

    return debugInfo;
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter();

// Export convenience functions
export const checkRateLimit = rateLimiter.isAllowed.bind(rateLimiter);
export const recordAuthAttempt = rateLimiter.recordAttempt.bind(rateLimiter);
export const resetRateLimit = rateLimiter.reset.bind(rateLimiter);
export const getRateLimitStatus = rateLimiter.getStatus.bind(rateLimiter);

export default rateLimiter;