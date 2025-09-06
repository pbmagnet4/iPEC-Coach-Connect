/**
 * Enhanced Rate Limiter Tests
 * 
 * Comprehensive tests for the enhanced rate limiting functionality.
 */

import { afterEach, beforeEach, describe, expect, it, Mock, vi } from 'vitest';
import type { AccountLockoutRecord, AttemptRecord, RateLimitStore } from '../rate-limiter-enhanced';
import { EnhancedRateLimiter } from '../rate-limiter-enhanced';
import { logSecurity } from '../secure-logger';

// Mock the secure logger
vi.mock('../secure-logger', () => ({
  logSecurity: vi.fn()
}));

// Mock implementation of RateLimitStore for testing
class MockRateLimitStore implements RateLimitStore {
  private attempts = new Map<string, AttemptRecord>();
  private lockouts = new Map<string, AccountLockoutRecord>();
  
  async get(key: string): Promise<AttemptRecord | null> {
    const record = this.attempts.get(key);
    return record ? { ...record, ipAddresses: new Set(record.ipAddresses) } : null;
  }
  
  async set(key: string, value: AttemptRecord): Promise<void> {
    this.attempts.set(key, { ...value, ipAddresses: new Set(value.ipAddresses) });
  }
  
  async delete(key: string): Promise<void> {
    this.attempts.delete(key);
  }
  
  async clear(): Promise<void> {
    this.attempts.clear();
    this.lockouts.clear();
  }
  
  async getAccountLockout(userId: string): Promise<AccountLockoutRecord | null> {
    const record = this.lockouts.get(userId);
    if (!record) return null;
    
    // Check if expired
    if (Date.now() > record.lockExpires) {
      this.lockouts.delete(userId);
      return null;
    }
    
    return { ...record, ipAddresses: new Set(record.ipAddresses) };
  }
  
  async setAccountLockout(userId: string, record: AccountLockoutRecord): Promise<void> {
    this.lockouts.set(userId, { ...record, ipAddresses: new Set(record.ipAddresses) });
  }
  
  async deleteAccountLockout(userId: string): Promise<void> {
    this.lockouts.delete(userId);
  }
  
  async getAllKeys(): Promise<string[]> {
    return Array.from(this.attempts.keys());
  }
  
  // Test utility methods
  getAttemptCount(): number {
    return this.attempts.size;
  }
  
  getLockoutCount(): number {
    return this.lockouts.size;
  }
}

describe('EnhancedRateLimiter', () => {
  let rateLimiter: EnhancedRateLimiter;
  let mockStore: MockRateLimitStore;
  const originalEnv = import.meta.env;
  
  beforeEach(() => {
    // Reset environment variables
    import.meta.env = {
      ...originalEnv,
      VITE_RATE_LIMIT_LOGIN_MAX_ATTEMPTS: '5',
      VITE_RATE_LIMIT_LOGIN_WINDOW_MS: '900000',
      VITE_RATE_LIMIT_LOGIN_BLOCK_DURATION_MS: '1800000',
      VITE_RATE_LIMIT_PROGRESSIVE_DELAY_ENABLED: 'true',
      VITE_RATE_LIMIT_PROGRESSIVE_DELAY_BASE_MS: '1000',
      VITE_RATE_LIMIT_PROGRESSIVE_DELAY_MAX_MS: '10000',
      VITE_RATE_LIMIT_ACCOUNT_LOCKOUT_THRESHOLD: '10',
      VITE_RATE_LIMIT_ACCOUNT_LOCKOUT_DURATION_MS: '86400000'
    };
    
    mockStore = new MockRateLimitStore();
    rateLimiter = new EnhancedRateLimiter(mockStore);
    
    // Clear any existing mock calls
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    import.meta.env = originalEnv;
  });
  
  describe('Basic Rate Limiting', () => {
    it('should allow requests within limit', async () => {
      const options = { clientIdentifier: 'test@example.com' };
      
      // First request should be allowed
      const result1 = await rateLimiter.isAllowed('auth.signin', options);
      expect(result1.allowed).toBe(true);
      expect(result1.remainingAttempts).toBe(4);
      
      // Record the attempt
      await rateLimiter.recordAttempt('auth.signin', false, options);
      
      // Second request should still be allowed
      const result2 = await rateLimiter.isAllowed('auth.signin', options);
      expect(result2.allowed).toBe(true);
      expect(result2.remainingAttempts).toBe(3);
    });
    
    it('should block requests after exceeding limit', async () => {
      const options = { clientIdentifier: 'test@example.com' };
      
      // Exhaust the limit (5 attempts)
      for (let i = 0; i < 5; i++) {
        await rateLimiter.isAllowed('auth.signin', options);
        await rateLimiter.recordAttempt('auth.signin', false, options);
      }
      
      // Next request should be blocked
      const result = await rateLimiter.isAllowed('auth.signin', options);
      expect(result.allowed).toBe(false);
      expect(result.remainingAttempts).toBe(0);
      expect(result.blockExpires).toBeDefined();
    });
    
    it('should reset on successful attempt when configured', async () => {
      const options = { clientIdentifier: 'test@example.com' };
      
      // Make a failed attempt
      await rateLimiter.recordAttempt('auth.signin', false, options);
      
      // Check that we have an attempt recorded
      let result = await rateLimiter.isAllowed('auth.signin', options);
      expect(result.remainingAttempts).toBe(3);
      
      // Make a successful attempt
      await rateLimiter.recordAttempt('auth.signin', true, options);
      
      // Check that the counter was reset
      result = await rateLimiter.isAllowed('auth.signin', options);
      expect(result.remainingAttempts).toBe(4);
    });
  });
  
  describe('Progressive Delays', () => {
    it('should calculate progressive delays correctly', async () => {
      const options = { clientIdentifier: 'test@example.com' };
      
      // First attempt - no delay
      let result = await rateLimiter.isAllowed('auth.signin', options);
      expect(result.delay).toBeUndefined();
      
      await rateLimiter.recordAttempt('auth.signin', false, options);
      
      // Second attempt - base delay
      result = await rateLimiter.isAllowed('auth.signin', options);
      expect(result.delay).toBeGreaterThan(0);
      expect(result.delay).toBeLessThanOrEqual(1100); // Base 1000ms + 10% jitter
      
      await rateLimiter.recordAttempt('auth.signin', false, options);
      
      // Third attempt - increased delay
      result = await rateLimiter.isAllowed('auth.signin', options);
      expect(result.delay).toBeGreaterThan(1000);
      expect(result.delay).toBeLessThanOrEqual(2200); // 2000ms + 10% jitter
    });
    
    it('should cap delays at maximum value', async () => {
      const options = { clientIdentifier: 'test@example.com' };
      
      // Make many attempts to reach max delay
      for (let i = 0; i < 10; i++) {
        await rateLimiter.recordAttempt('auth.signin', false, options);
      }
      
      const result = await rateLimiter.isAllowed('auth.signin', options);
      expect(result.delay).toBeLessThanOrEqual(11000); // Max 10000ms + 10% jitter
    });
  });
  
  describe('Account Lockout', () => {
    it('should lock account after excessive failures', async () => {
      const userId = 'user123';
      const options = { clientIdentifier: 'test@example.com', userId };
      
      // Simulate many failed attempts across different operations
      for (let i = 0; i < 12; i++) {
        await rateLimiter.recordAttempt('auth.signin', false, options);
      }
      
      // Check if account is locked
      const result = await rateLimiter.isAllowed('auth.signin', options);
      expect(result.accountLocked).toBe(true);
      expect(result.accountLockExpires).toBeDefined();
    });
    
    it('should allow manual account unlock', async () => {
      const userId = 'user123';
      const options = { clientIdentifier: 'test@example.com', userId };
      
      // Lock the account first
      for (let i = 0; i < 12; i++) {
        await rateLimiter.recordAttempt('auth.signin', false, options);
      }
      
      // Verify account is locked
      let result = await rateLimiter.isAllowed('auth.signin', options);
      expect(result.accountLocked).toBe(true);
      
      // Unlock the account
      await rateLimiter.unlockAccount(userId);
      
      // Verify account is unlocked
      result = await rateLimiter.isAllowed('auth.signin', options);
      expect(result.accountLocked).toBe(false);
    });
  });
  
  describe('Verified Users and Admin Overrides', () => {
    it('should give verified users increased limits', async () => {
      const userId = 'user123';
      const options = { clientIdentifier: 'test@example.com', userId };
      
      // Add user to verified list
      rateLimiter.addVerifiedUser(userId);
      
      // Verified users should get 2x the limit (10 instead of 5)
      const result = await rateLimiter.isAllowed('auth.signin', options);
      expect(result.allowed).toBe(true);
      expect(result.remainingAttempts).toBe(9); // 10 - 1
    });
    
    it('should bypass all limits for admin overrides', async () => {
      const userId = 'admin123';
      const options = { clientIdentifier: 'test@example.com', userId };
      
      // Add admin override
      rateLimiter.addAdminOverride(userId);
      
      // Admin should always be allowed
      const result = await rateLimiter.isAllowed('auth.signin', options);
      expect(result.allowed).toBe(true);
      expect(result.remainingAttempts).toBe(Infinity);
    });
  });
  
  describe('IP Address Tracking', () => {
    it('should track IP addresses in attempt records', async () => {
      const options = { 
        clientIdentifier: 'test@example.com', 
        ipAddress: '192.168.1.1' 
      };
      
      await rateLimiter.recordAttempt('auth.signin', false, options);
      
      const status = await rateLimiter.getStatus('auth.signin', options);
      expect(status).toBeDefined();
      expect(status!.attempts).toBe(1);
    });
    
    it('should handle multiple IP addresses for same user', async () => {
      const baseOptions = { clientIdentifier: 'test@example.com' };
      
      // Record from different IPs
      await rateLimiter.recordAttempt('auth.signin', false, { 
        ...baseOptions, 
        ipAddress: '192.168.1.1' 
      });
      
      await rateLimiter.recordAttempt('auth.signin', false, { 
        ...baseOptions, 
        ipAddress: '192.168.1.2' 
      });
      
      // Both should be tracked separately
      const status1 = await rateLimiter.getStatus('auth.signin', { 
        ...baseOptions, 
        ipAddress: '192.168.1.1' 
      });
      
      const status2 = await rateLimiter.getStatus('auth.signin', { 
        ...baseOptions, 
        ipAddress: '192.168.1.2' 
      });
      
      expect(status1!.attempts).toBe(1);
      expect(status2!.attempts).toBe(1);
    });
  });
  
  describe('Configuration', () => {
    it('should use custom configuration', async () => {
      // Set custom config
      rateLimiter.setConfig('custom.operation', {
        maxAttempts: 3,
        windowMs: 60000,
        blockDurationMs: 120000,
        skipSuccessfulAttempts: false
      });
      
      const options = { clientIdentifier: 'test@example.com' };
      
      // Should allow 3 attempts
      const result1 = await rateLimiter.isAllowed('custom.operation', options);
      expect(result1.allowed).toBe(true);
      expect(result1.remainingAttempts).toBe(2);
      
      // After 3 attempts, should block
      await rateLimiter.recordAttempt('custom.operation', false, options);
      await rateLimiter.recordAttempt('custom.operation', false, options);
      await rateLimiter.recordAttempt('custom.operation', false, options);
      
      const result2 = await rateLimiter.isAllowed('custom.operation', options);
      expect(result2.allowed).toBe(false);
    });
  });
  
  describe('Metrics and Status', () => {
    it('should provide accurate metrics', async () => {
      const options = { clientIdentifier: 'test@example.com' };
      
      // Record some attempts
      await rateLimiter.recordAttempt('auth.signin', false, options);
      await rateLimiter.recordAttempt('auth.signin', false, options);
      
      const metrics = await rateLimiter.getMetrics();
      expect(metrics.totalRecords).toBe(1);
      expect(metrics.blockedRecords).toBe(0);
      expect(metrics.verifiedUsers).toBe(0);
      expect(metrics.adminOverrides).toBe(0);
    });
    
    it('should provide status information', async () => {
      const options = { clientIdentifier: 'test@example.com' };
      
      // Record an attempt
      await rateLimiter.recordAttempt('auth.signin', false, options);
      
      const status = await rateLimiter.getStatus('auth.signin', options);
      expect(status).toBeDefined();
      expect(status!.attempts).toBe(1);
      expect(status!.maxAttempts).toBe(5);
      expect(status!.isBlocked).toBe(false);
      expect(status!.isVerified).toBe(false);
      expect(status!.hasAdminOverride).toBe(false);
    });
  });
  
  describe('Error Handling', () => {
    it('should handle store errors gracefully', async () => {
      // Create a failing store
      const failingStore: RateLimitStore = {
        get: vi.fn().mockRejectedValue(new Error('Store error')),
        set: vi.fn().mockRejectedValue(new Error('Store error')),
        delete: vi.fn().mockRejectedValue(new Error('Store error')),
        clear: vi.fn().mockRejectedValue(new Error('Store error')),
        getAccountLockout: vi.fn().mockRejectedValue(new Error('Store error')),
        setAccountLockout: vi.fn().mockRejectedValue(new Error('Store error')),
        deleteAccountLockout: vi.fn().mockRejectedValue(new Error('Store error')),
        getAllKeys: vi.fn().mockResolvedValue([])
      };
      
      const failingRateLimiter = new EnhancedRateLimiter(failingStore);
      
      // Should handle errors gracefully
      const result = await failingRateLimiter.isAllowed('auth.signin', { 
        clientIdentifier: 'test@example.com' 
      });
      
      // Should allow by default when store fails
      expect(result.allowed).toBe(true);
      expect(result.remainingAttempts).toBe(4);
    });
  });
  
  describe('Security Logging', () => {
    it('should log security events', async () => {
      const options = { clientIdentifier: 'test@example.com' };
      
      // Trigger a rate limit
      for (let i = 0; i < 6; i++) {
        await rateLimiter.recordAttempt('auth.signin', false, options);
      }
      
      await rateLimiter.isAllowed('auth.signin', options);
      
      // Check that security events were logged
      expect(logSecurity).toHaveBeenCalledWith(
        'Rate limit exceeded',
        'high',
        expect.objectContaining({
          operationType: 'auth.signin'
        })
      );
    });
  });
});

// Integration tests with realistic scenarios
describe('EnhancedRateLimiter Integration', () => {
  let rateLimiter: EnhancedRateLimiter;
  let mockStore: MockRateLimitStore;
  
  beforeEach(() => {
    mockStore = new MockRateLimitStore();
    rateLimiter = new EnhancedRateLimiter(mockStore);
  });
  
  it('should handle a realistic brute force scenario', async () => {
    const attackerOptions = { 
      clientIdentifier: 'victim@example.com',
      ipAddress: '192.168.1.100',
      userAgent: 'AttackerBot/1.0'
    };
    
    let isBlocked = false;
    let attempts = 0;
    
    // Simulate brute force attack
    while (!isBlocked && attempts < 20) {
      const result = await rateLimiter.isAllowed('auth.signin', attackerOptions);
      
      if (!result.allowed) {
        isBlocked = true;
        break;
      }
      
      // Apply delay if required
      if (result.delay) {
        // In real scenario, attacker would wait or be delayed
        await new Promise(resolve => setTimeout(resolve, Math.min(result.delay, 100)));
      }
      
      await rateLimiter.recordAttempt('auth.signin', false, attackerOptions);
      attempts++;
    }
    
    expect(isBlocked).toBe(true);
    expect(attempts).toBe(5); // Should be blocked after 5 attempts
    
    // Verify that the attacker can't continue
    const finalResult = await rateLimiter.isAllowed('auth.signin', attackerOptions);
    expect(finalResult.allowed).toBe(false);
    expect(finalResult.blockExpires).toBeDefined();
  });
  
  it('should handle legitimate user after successful login', async () => {
    const userOptions = { 
      clientIdentifier: 'user@example.com',
      userId: 'user123',
      ipAddress: '192.168.1.50'
    };
    
    // User makes a few failed attempts (typos, etc.)
    await rateLimiter.recordAttempt('auth.signin', false, userOptions);
    await rateLimiter.recordAttempt('auth.signin', false, userOptions);
    
    // Check they still have attempts left
    let result = await rateLimiter.isAllowed('auth.signin', userOptions);
    expect(result.allowed).toBe(true);
    expect(result.remainingAttempts).toBe(2);
    
    // User successfully logs in
    await rateLimiter.recordAttempt('auth.signin', true, userOptions);
    
    // Counter should be reset
    result = await rateLimiter.isAllowed('auth.signin', userOptions);
    expect(result.allowed).toBe(true);
    expect(result.remainingAttempts).toBe(4);
  });
});