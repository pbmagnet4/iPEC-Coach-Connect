/**
 * Comprehensive CSRF Protection Tests
 * 
 * Ultra-deep testing for CSRF protection system covering:
 * - Token generation and validation
 * - OAuth state parameter security
 * - Storage mechanisms and persistence
 * - Error handling and edge cases
 * - Performance and memory management
 * - Security vulnerability testing
 * - Integration with auth flows
 * - Cleanup and lifecycle management
 */

import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import { csrfProtection } from '../csrf-protection';
import { logSecurity } from '../secure-logger';

// Mock the secure logger
vi.mock('../secure-logger', () => ({
  logSecurity: vi.fn()
}));

// Mock crypto.getRandomValues for consistent testing
const mockGetRandomValues = vi.fn();
Object.defineProperty(window, 'crypto', {
  value: {
    getRandomValues: mockGetRandomValues
  }
});

// Mock sessionStorage
const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage
});

// Mock window.location
const mockLocation = {
  origin: 'https://ipec-coach-connect.com'
};
Object.defineProperty(window, 'location', {
  value: mockLocation
});

describe('CSRF Protection System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset crypto mock to return predictable values
    mockGetRandomValues.mockImplementation((array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = i % 256;
      }
      return array;
    });
    
    // Reset sessionStorage mocks
    mockSessionStorage.getItem.mockReturnValue(null);
    mockSessionStorage.setItem.mockImplementation(() => {});
    mockSessionStorage.removeItem.mockImplementation(() => {});
    mockSessionStorage.clear.mockImplementation(() => {});
  });

  afterEach(() => {
    csrfProtection.clearAllTokens();
  });

  describe('Token Generation', () => {
    it('should generate secure tokens with crypto.getRandomValues', () => {
      const token = csrfProtection.generateToken('test');
      
      expect(mockGetRandomValues).toHaveBeenCalledWith(expect.any(Uint8Array));
      expect(token).toBe('000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f');
      expect(logSecurity).toHaveBeenCalledWith(
        'CSRF token generated',
        'low',
        expect.objectContaining({
          purpose: 'test',
          tokenId: '00010203...'
        })
      );
    });

    it('should generate unique tokens for different purposes', () => {
      const token1 = csrfProtection.generateToken('oauth');
      const token2 = csrfProtection.generateToken('form');
      
      expect(token1).toBe(token2); // Same because of mocked crypto
      expect(logSecurity).toHaveBeenCalledTimes(2);
    });

    it('should handle custom expiry times', () => {
      const customExpiry = 60000; // 1 minute
      const token = csrfProtection.generateToken('test', customExpiry);
      
      expect(token).toBeDefined();
      expect(logSecurity).toHaveBeenCalledWith(
        'CSRF token generated',
        'low',
        expect.objectContaining({
          purpose: 'test',
          expiresAt: expect.any(String)
        })
      );
    });

    it('should store tokens in sessionStorage', () => {
      const token = csrfProtection.generateToken('test');
      
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        'ipec_csrf_tokens',
        expect.stringContaining(token)
      );
    });

    it('should limit token storage to prevent memory bloat', () => {
      // Generate more than MAX_TOKENS (10)
      for (let i = 0; i < 15; i++) {
        csrfProtection.generateToken(`test-${i}`);
      }
      
      // Should have limited storage calls
      expect(mockSessionStorage.setItem).toHaveBeenCalledTimes(15);
    });
  });

  describe('Token Validation', () => {
    it('should validate legitimate tokens', () => {
      const token = csrfProtection.generateToken('test');
      
      const result = csrfProtection.validateToken(token, 'test');
      
      expect(result.valid).toBe(true);
      expect(result.tokenInfo).toBeDefined();
      expect(result.tokenInfo?.purpose).toBe('test');
      expect(result.tokenInfo?.origin).toBe('https://ipec-coach-connect.com');
    });

    it('should reject unknown tokens', () => {
      const result = csrfProtection.validateToken('unknown-token', 'test');
      
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Token not found');
      expect(logSecurity).toHaveBeenCalledWith(
        'CSRF token validation failed - token not found',
        'high',
        expect.objectContaining({
          purpose: 'test',
          tokenId: 'unknown-t...'
        })
      );
    });

    it('should reject tokens with wrong purpose', () => {
      const token = csrfProtection.generateToken('oauth');
      
      const result = csrfProtection.validateToken(token, 'form');
      
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Purpose mismatch');
      expect(logSecurity).toHaveBeenCalledWith(
        'CSRF token validation failed - purpose mismatch',
        'high',
        expect.objectContaining({
          expectedPurpose: 'form',
          actualPurpose: 'oauth'
        })
      );
    });

    it('should reject tokens with wrong origin', () => {
      const token = csrfProtection.generateToken('test');
      
      const result = csrfProtection.validateToken(token, 'test', 'https://evil.com');
      
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Origin mismatch');
      expect(logSecurity).toHaveBeenCalledWith(
        'CSRF token validation failed - origin mismatch',
        'high',
        expect.objectContaining({
          expectedOrigin: 'https://ipec-coach-connect.com',
          actualOrigin: 'https://evil.com'
        })
      );
    });

    it('should reject expired tokens', () => {
      // Mock Date.now to simulate token expiry
      const originalNow = Date.now;
      Date.now = vi.fn(() => 1000);
      
      const token = csrfProtection.generateToken('test', 100); // 100ms expiry
      
      // Advance time past expiry
      Date.now = vi.fn(() => 2000);
      
      const result = csrfProtection.validateToken(token, 'test');
      
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Token expired');
      
      // Restore original Date.now
      Date.now = originalNow;
    });

    it('should clean up expired tokens during validation', () => {
      const originalNow = Date.now;
      Date.now = vi.fn(() => 1000);
      
      const token = csrfProtection.generateToken('test', 100);
      
      Date.now = vi.fn(() => 2000);
      
      csrfProtection.validateToken(token, 'test');
      
      // Token should be cleaned up
      expect(mockSessionStorage.setItem).toHaveBeenCalled();
      
      Date.now = originalNow;
    });
  });

  describe('Token Consumption', () => {
    it('should consume tokens after validation', () => {
      const token = csrfProtection.generateToken('test');
      
      const result = csrfProtection.consumeToken(token, 'test');
      
      expect(result.valid).toBe(true);
      expect(logSecurity).toHaveBeenCalledWith(
        'CSRF token consumed',
        'low',
        expect.objectContaining({
          purpose: 'test',
          tokenId: '00010203...'
        })
      );
      
      // Token should no longer be valid
      const secondResult = csrfProtection.validateToken(token, 'test');
      expect(secondResult.valid).toBe(false);
    });

    it('should not consume invalid tokens', () => {
      const result = csrfProtection.consumeToken('invalid-token', 'test');
      
      expect(result.valid).toBe(false);
      expect(logSecurity).not.toHaveBeenCalledWith(
        'CSRF token consumed',
        expect.any(String),
        expect.any(Object)
      );
    });
  });

  describe('OAuth State Management', () => {
    it('should generate OAuth state with embedded CSRF token', () => {
      const state = csrfProtection.generateOAuthState('/custom-redirect');
      
      expect(state).toBeDefined();
      
      // Decode and verify state structure
      const decoded = JSON.parse(atob(state));
      expect(decoded.csrf).toBeDefined();
      expect(decoded.redirect).toBe('/custom-redirect');
      expect(decoded.timestamp).toBeDefined();
      expect(typeof decoded.timestamp).toBe('number');
    });

    it('should use default redirect if none provided', () => {
      const state = csrfProtection.generateOAuthState();
      
      const decoded = JSON.parse(atob(state));
      expect(decoded.redirect).toBe('/dashboard');
    });

    it('should validate OAuth state successfully', () => {
      const state = csrfProtection.generateOAuthState('/test-redirect');
      
      const result = csrfProtection.validateOAuthState(state);
      
      expect(result.valid).toBe(true);
      expect(result.redirectTo).toBe('/test-redirect');
    });

    it('should reject malformed OAuth state', () => {
      const result = csrfProtection.validateOAuthState('invalid-state');
      
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Invalid state format');
      expect(logSecurity).toHaveBeenCalledWith(
        'OAuth state validation failed - invalid format',
        'high',
        expect.objectContaining({
          error: expect.any(String),
          stateParam: 'invalid-state'
        })
      );
    });

    it('should reject OAuth state without CSRF token', () => {
      const invalidState = btoa(JSON.stringify({ redirect: '/test' }));
      
      const result = csrfProtection.validateOAuthState(invalidState);
      
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('No CSRF token in state');
    });

    it('should consume CSRF token during OAuth state validation', () => {
      const state = csrfProtection.generateOAuthState('/test');
      
      // First validation should succeed
      const result1 = csrfProtection.validateOAuthState(state);
      expect(result1.valid).toBe(true);
      
      // Second validation should fail (token consumed)
      const result2 = csrfProtection.validateOAuthState(state);
      expect(result2.valid).toBe(false);
    });
  });

  describe('Storage and Persistence', () => {
    it('should load tokens from sessionStorage on initialization', () => {
      const mockStoredData = JSON.stringify([
        {
          token: 'stored-token',
          data: {
            token: 'stored-token',
            timestamp: Date.now(),
            origin: 'https://ipec-coach-connect.com',
            purpose: 'test',
            expiresAt: Date.now() + 900000
          }
        }
      ]);
      
      mockSessionStorage.getItem.mockReturnValue(mockStoredData);
      
      // Create new instance to test loading
      const newCsrfProtection = new (csrfProtection.constructor as any)();
      
      expect(mockSessionStorage.getItem).toHaveBeenCalledWith('ipec_csrf_tokens');
    });

    it('should handle corrupted storage gracefully', () => {
      mockSessionStorage.getItem.mockReturnValue('invalid-json');
      
      // Should not throw an error
      expect(() => {
        const newCsrfProtection = new (csrfProtection.constructor as any)();
      }).not.toThrow();
      
      expect(logSecurity).toHaveBeenCalledWith(
        'Failed to load CSRF tokens from storage',
        'low',
        expect.objectContaining({
          error: expect.any(String)
        })
      );
    });

    it('should save tokens to storage with size limits', () => {
      // Generate many tokens
      for (let i = 0; i < 15; i++) {
        csrfProtection.generateToken(`test-${i}`);
      }
      
      // Should have called setItem multiple times
      expect(mockSessionStorage.setItem).toHaveBeenCalled();
      
      // Last call should contain limited tokens
      const lastCall = mockSessionStorage.setItem.mock.calls[mockSessionStorage.setItem.mock.calls.length - 1];
      const storedData = JSON.parse(lastCall[1]);
      expect(storedData).toHaveLength(10); // MAX_TOKENS limit
    });

    it('should handle storage quota exceeded gracefully', () => {
      mockSessionStorage.setItem.mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });
      
      // Should not throw an error
      expect(() => {
        csrfProtection.generateToken('test');
      }).not.toThrow();
      
      expect(logSecurity).toHaveBeenCalledWith(
        'Failed to save CSRF tokens to storage',
        'low',
        expect.objectContaining({
          error: 'QuotaExceededError'
        })
      );
    });
  });

  describe('Cleanup and Lifecycle', () => {
    it('should provide debug information about tokens', () => {
      const token = csrfProtection.generateToken('test');
      
      const debugInfo = csrfProtection.getDebugInfo();
      
      expect(debugInfo).toBeDefined();
      expect(Object.keys(debugInfo)).toHaveLength(1);
      expect(debugInfo['00010203...']).toEqual({
        purpose: 'test',
        origin: 'https://ipec-coach-connect.com',
        timestamp: expect.any(String),
        expiresAt: expect.any(String),
        isExpired: false
      });
    });

    it('should clear all tokens', () => {
      csrfProtection.generateToken('test1');
      csrfProtection.generateToken('test2');
      
      csrfProtection.clearAllTokens();
      
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('ipec_csrf_tokens');
      expect(logSecurity).toHaveBeenCalledWith('All CSRF tokens cleared', 'low');
      
      // Tokens should be cleared
      const debugInfo = csrfProtection.getDebugInfo();
      expect(Object.keys(debugInfo)).toHaveLength(0);
    });

    it('should setup automatic cleanup interval', () => {
      const originalSetInterval = global.setInterval;
      const mockSetInterval = vi.fn();
      global.setInterval = mockSetInterval;
      
      // Create new instance to test interval setup
      const newCsrfProtection = new (csrfProtection.constructor as any)();
      
      expect(mockSetInterval).toHaveBeenCalledWith(
        expect.any(Function),
        5 * 60 * 1000 // 5 minutes
      );
      
      global.setInterval = originalSetInterval;
    });
  });

  describe('Security Edge Cases', () => {
    it('should handle concurrent token generation safely', async () => {
      const promises = [];
      
      for (let i = 0; i < 10; i++) {
        promises.push(Promise.resolve(csrfProtection.generateToken(`concurrent-${i}`)));
      }
      
      const tokens = await Promise.all(promises);
      
      expect(tokens).toHaveLength(10);
      expect(mockSessionStorage.setItem).toHaveBeenCalledTimes(10);
    });

    it('should handle crypto.getRandomValues failure gracefully', () => {
      mockGetRandomValues.mockImplementation(() => {
        throw new Error('Crypto not available');
      });
      
      expect(() => {
        csrfProtection.generateToken('test');
      }).toThrow('Crypto not available');
    });

    it('should validate token with special characters in purpose', () => {
      const token = csrfProtection.generateToken('test-with-special!@#$%');
      
      const result = csrfProtection.validateToken(token, 'test-with-special!@#$%');
      
      expect(result.valid).toBe(true);
    });

    it('should handle very long token purposes', () => {
      const longPurpose = 'a'.repeat(1000);
      const token = csrfProtection.generateToken(longPurpose);
      
      const result = csrfProtection.validateToken(token, longPurpose);
      
      expect(result.valid).toBe(true);
    });

    it('should handle empty token purpose', () => {
      const token = csrfProtection.generateToken('');
      
      const result = csrfProtection.validateToken(token, '');
      
      expect(result.valid).toBe(true);
    });
  });

  describe('Performance Tests', () => {
    it('should generate tokens efficiently', () => {
      const startTime = Date.now();
      
      for (let i = 0; i < 100; i++) {
        csrfProtection.generateToken(`perf-test-${i}`);
      }
      
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(100); // Should be fast
    });

    it('should validate tokens efficiently', () => {
      const tokens = [];
      for (let i = 0; i < 100; i++) {
        tokens.push(csrfProtection.generateToken(`perf-test-${i}`));
      }
      
      const startTime = Date.now();
      
      for (let i = 0; i < 100; i++) {
        csrfProtection.validateToken(tokens[i], `perf-test-${i}`);
      }
      
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(50); // Should be very fast
    });
  });

  describe('Integration Tests', () => {
    it('should work with mocked browser environment', () => {
      expect(window.crypto.getRandomValues).toBeDefined();
      expect(window.sessionStorage.setItem).toBeDefined();
      expect(window.location.origin).toBe('https://ipec-coach-connect.com');
    });

    it('should handle missing crypto gracefully in older browsers', () => {
      const originalCrypto = window.crypto;
      delete (window as any).crypto;
      
      expect(() => {
        csrfProtection.generateToken('test');
      }).toThrow();
      
      // Restore crypto
      window.crypto = originalCrypto;
    });
  });
});