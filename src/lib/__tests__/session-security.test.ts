/**
 * Session Security System Tests
 * 
 * Tests for the comprehensive session security system including:
 * - Session creation and validation
 * - Fingerprinting and security checks
 * - Concurrent session management
 * - Security violation handling
 * - Configuration validation
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { 
  createSecureSession, 
  getConcurrentSessions, 
  invalidateSession, 
  refreshSession,
  type SecureSessionData,
  sessionSecurity,
  type SessionValidationResult,
  validateSession
} from '../session-security';
import { 
  createRequestContext,
  getSessionStatus,
  sessionMiddleware,
  validateRequest
} from '../session-security-middleware';
import { 
  buildCSPString,
  detectSecurityLevel,
  getSessionSecurityConfig,
  validateSessionConfig
} from '../session-security-config';

// Mock data
const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  email_confirmed_at: new Date().toISOString(),
  last_sign_in_at: new Date().toISOString(),
  role: 'authenticated',
  aud: 'authenticated',
  confirmation_sent_at: null,
  recovery_sent_at: null,
  email_change_sent_at: null,
  new_email: null,
  invited_at: null,
  action_link: null,
  user_metadata: {},
  app_metadata: {}
};

const mockSupabaseSession = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  expires_at: Date.now() + 3600000,
  token_type: 'bearer',
  user: mockUser
};

// Mock browser APIs
Object.defineProperty(window, 'crypto', {
  value: {
    getRandomValues: vi.fn((arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    }),
    subtle: {
      digest: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
      importKey: vi.fn().mockResolvedValue({}),
      deriveKey: vi.fn().mockResolvedValue({}),
      encrypt: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
      decrypt: vi.fn().mockResolvedValue(new ArrayBuffer(32))
    }
  }
});

Object.defineProperty(window, 'navigator', {
  value: {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    language: 'en-US',
    platform: 'Win32',
    doNotTrack: '0',
    cookieEnabled: true
  }
});

Object.defineProperty(window, 'screen', {
  value: {
    width: 1920,
    height: 1080
  }
});

// Mock canvas and WebGL
HTMLCanvasElement.prototype.getContext = vi.fn().mockImplementation((type) => {
  if (type === '2d') {
    return {
      fillText: vi.fn(),
      fillRect: vi.fn(),
      toDataURL: vi.fn().mockReturnValue('data:image/png;base64,mock-canvas-data')
    };
  }
  if (type === 'webgl' || type === 'experimental-webgl') {
    return {
      getParameter: vi.fn().mockImplementation((param) => {
        if (param === 'RENDERER') return 'Mock WebGL Renderer';
        if (param === 'VENDOR') return 'Mock WebGL Vendor';
        return 'Mock WebGL';
      })
    };
  }
  return null;
});

describe('Session Security System', () => {
  let testSession: SecureSessionData;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Session Creation', () => {
    it('should create secure session with all required fields', async () => {
      const session = await createSecureSession(mockUser, mockSupabaseSession, {
        role: 'client',
        permissions: ['read', 'write']
      });

      expect(session).toMatchObject({
        sessionId: expect.any(String),
        userId: mockUser.id,
        email: mockUser.email,
        role: 'client',
        createdAt: expect.any(Number),
        lastActivity: expect.any(Number),
        expiresAt: expect.any(Number),
        fingerprint: expect.any(Object),
        isActive: true,
        deviceInfo: expect.any(Object),
        securityEvents: expect.any(Array),
        permissions: ['read', 'write']
      });

      expect(session.sessionId).toHaveLength(64); // 32 bytes * 2 hex chars
      expect(session.expiresAt).toBeGreaterThan(Date.now());
      expect(session.fingerprint.hash).toBeDefined();
      expect(session.securityEvents).toHaveLength(1);
      expect(session.securityEvents[0].type).toBe('login');

      testSession = session;
    });

    it('should generate unique session IDs', async () => {
      const session1 = await createSecureSession(mockUser, mockSupabaseSession, {
        role: 'client',
        permissions: ['read']
      });

      const session2 = await createSecureSession(mockUser, mockSupabaseSession, {
        role: 'client',
        permissions: ['read']
      });

      expect(session1.sessionId).not.toBe(session2.sessionId);
    });

    it('should create device fingerprint with required fields', async () => {
      const session = await createSecureSession(mockUser, mockSupabaseSession, {
        role: 'client',
        permissions: ['read']
      });

      expect(session.fingerprint).toMatchObject({
        userAgent: expect.any(String),
        screenResolution: expect.any(String),
        timezone: expect.any(String),
        language: expect.any(String),
        platform: expect.any(String),
        doNotTrack: expect.any(Boolean),
        cookieEnabled: expect.any(Boolean),
        webgl: expect.any(String),
        canvas: expect.any(String),
        createdAt: expect.any(Number),
        hash: expect.any(String)
      });
    });
  });

  describe('Session Validation', () => {
    beforeEach(async () => {
      testSession = await createSecureSession(mockUser, mockSupabaseSession, {
        role: 'client',
        permissions: ['read', 'write']
      });
    });

    it('should validate active session', async () => {
      const validation = await validateSession(testSession.sessionId);

      expect(validation).toMatchObject({
        isValid: true,
        session: expect.any(Object),
        securityRisk: 'low',
        action: 'allow'
      });
    });

    it('should reject expired session', async () => {
      // Create expired session
      const expiredSession = {
        ...testSession,
        expiresAt: Date.now() - 1000
      };

      // Mock storage to return expired session
      localStorage.setItem(
        `ipec_session_${expiredSession.sessionId}`,
        btoa(JSON.stringify(expiredSession))
      );

      const validation = await validateSession(expiredSession.sessionId);

      expect(validation).toMatchObject({
        isValid: false,
        error: 'Session expired',
        action: 'block'
      });
    });

    it('should reject non-existent session', async () => {
      const validation = await validateSession('non-existent-session');

      expect(validation).toMatchObject({
        isValid: false,
        error: 'Session not found',
        action: 'block'
      });
    });

    it('should detect session refresh requirement', async () => {
      // Create session that needs refresh
      const sessionNeedingRefresh = {
        ...testSession,
        expiresAt: Date.now() + (25 * 60 * 1000) // 25 minutes from now
      };

      // Mock storage
      localStorage.setItem(
        `ipec_session_${sessionNeedingRefresh.sessionId}`,
        btoa(JSON.stringify(sessionNeedingRefresh))
      );

      const validation = await validateSession(sessionNeedingRefresh.sessionId);

      expect(validation).toMatchObject({
        isValid: true,
        requiresRefresh: true,
        action: 'allow'
      });
    });
  });

  describe('Session Refresh', () => {
    beforeEach(async () => {
      testSession = await createSecureSession(mockUser, mockSupabaseSession, {
        role: 'client',
        permissions: ['read', 'write']
      });
    });

    it('should refresh session successfully', async () => {
      const originalExpiresAt = testSession.expiresAt;
      
      // Wait a bit to ensure timestamps are different
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const refreshedSession = await refreshSession(testSession.sessionId);

      expect(refreshedSession.expiresAt).toBeGreaterThan(originalExpiresAt);
      expect(refreshedSession.lastActivity).toBeGreaterThan(testSession.lastActivity);
      expect(refreshedSession.securityEvents).toHaveLength(2);
      expect(refreshedSession.securityEvents[1].type).toBe('refresh');
    });

    it('should fail to refresh non-existent session', async () => {
      await expect(refreshSession('non-existent-session')).rejects.toThrow();
    });
  });

  describe('Session Invalidation', () => {
    beforeEach(async () => {
      testSession = await createSecureSession(mockUser, mockSupabaseSession, {
        role: 'client',
        permissions: ['read', 'write']
      });
    });

    it('should invalidate session successfully', async () => {
      await invalidateSession(testSession.sessionId, 'user_logout');

      // Session should no longer exist in storage
      const stored = localStorage.getItem(`ipec_session_${testSession.sessionId}`);
      expect(stored).toBeNull();
    });

    it('should handle invalidation of non-existent session', async () => {
      // Should not throw error
      await expect(invalidateSession('non-existent-session', 'test')).resolves.not.toThrow();
    });
  });

  describe('Concurrent Session Management', () => {
    it('should track concurrent sessions', async () => {
      const session1 = await createSecureSession(mockUser, mockSupabaseSession, {
        role: 'client',
        permissions: ['read']
      });

      const session2 = await createSecureSession(mockUser, mockSupabaseSession, {
        role: 'client',
        permissions: ['read']
      });

      const sessions = await getConcurrentSessions(mockUser.id);

      expect(sessions).toHaveLength(2);
      expect(sessions[0]).toMatchObject({
        sessionId: expect.any(String),
        deviceType: expect.any(String),
        browser: expect.any(String),
        os: expect.any(String),
        createdAt: expect.any(Number),
        lastActivity: expect.any(Number),
        isCurrentSession: false
      });
    });

    it('should return empty array for user with no sessions', async () => {
      const sessions = await getConcurrentSessions('non-existent-user');
      expect(sessions).toHaveLength(0);
    });
  });

  describe('Security Middleware', () => {
    beforeEach(async () => {
      testSession = await createSecureSession(mockUser, mockSupabaseSession, {
        role: 'client',
        permissions: ['read', 'write']
      });
    });

    it('should create request context', () => {
      const context = createRequestContext('/api/test', 'GET');

      expect(context).toMatchObject({
        url: '/api/test',
        method: 'GET',
        headers: {},
        userAgent: expect.any(String),
        timestamp: expect.any(Number)
      });
    });

    it('should validate valid request', async () => {
      const context = createRequestContext('/api/test', 'GET');
      
      // Mock auth service state
      vi.spyOn(require('../../services/auth.service'), 'authService').mockReturnValue({
        getState: () => ({
          user: mockUser,
          secureSession: testSession,
          isAuthenticated: true
        })
      });

      const result = await validateRequest(context);

      expect(result).toMatchObject({
        allowed: true,
        sessionValid: true,
        action: 'allow'
      });
    });

    it('should reject request without authentication', async () => {
      const context = createRequestContext('/api/test', 'GET');
      
      // Mock auth service state with no user
      vi.spyOn(require('../../services/auth.service'), 'authService').mockReturnValue({
        getState: () => ({
          user: null,
          secureSession: null,
          isAuthenticated: false
        })
      });

      const result = await validateRequest(context);

      expect(result).toMatchObject({
        allowed: false,
        sessionValid: false,
        error: 'User not authenticated',
        action: 'block'
      });
    });

    it('should provide session status', () => {
      // Mock auth service state
      vi.spyOn(require('../../services/auth.service'), 'authService').mockReturnValue({
        getState: () => ({
          secureSession: testSession,
          sessionValidation: {
            isValid: true,
            requiresRefresh: false,
            securityRisk: 'low'
          },
          concurrentSessions: 2
        })
      });

      const status = getSessionStatus();

      expect(status).toMatchObject({
        isValid: true,
        timeUntilExpiry: expect.any(Number),
        requiresRefresh: false,
        securityRisk: 'low',
        concurrentSessions: 2
      });
    });
  });

  describe('Configuration', () => {
    it('should get session security config', () => {
      const config = getSessionSecurityConfig('test');

      expect(config).toMatchObject({
        sessionTimeout: expect.any(Number),
        refreshThreshold: expect.any(Number),
        maxConcurrentSessions: expect.any(Number),
        fingerprintingEnabled: expect.any(Boolean),
        encryptionEnabled: expect.any(Boolean),
        securityHeaders: expect.any(Boolean),
        activityMonitoring: expect.any(Boolean),
        cleanupInterval: expect.any(Number)
      });
    });

    it('should validate session config', () => {
      const validConfig = getSessionSecurityConfig('test');
      const validation = validateSessionConfig(validConfig);

      expect(validation).toMatchObject({
        isValid: true,
        errors: [],
        warnings: expect.any(Array)
      });
    });

    it('should detect invalid config', () => {
      const invalidConfig = {
        sessionTimeout: 5, // Too low
        refreshThreshold: 20, // Greater than timeout
        maxConcurrentSessions: 0, // Too low
        fingerprintingEnabled: true,
        encryptionEnabled: true,
        securityHeaders: true,
        activityMonitoring: true,
        cleanupInterval: 60
      };

      const validation = validateSessionConfig(invalidConfig);

      expect(validation).toMatchObject({
        isValid: false,
        errors: expect.arrayContaining([
          expect.stringContaining('Session timeout must be at least 15 minutes'),
          expect.stringContaining('Refresh threshold must be less than session timeout'),
          expect.stringContaining('Max concurrent sessions must be at least 1')
        ])
      });
    });

    it('should build CSP string', () => {
      const csp = buildCSPString('production');

      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("script-src 'self'");
      expect(csp).toContain("object-src 'none'");
      expect(csp).toContain('upgrade-insecure-requests');
    });

    it('should detect security level', () => {
      // Mock window.location for testing
      Object.defineProperty(window, 'location', {
        value: {
          hostname: 'localhost',
          protocol: 'http:'
        }
      });

      const level = detectSecurityLevel();
      expect(level).toBe('minimal');
    });
  });

  describe('Session Statistics', () => {
    it('should provide session statistics', () => {
      const stats = sessionSecurity.getSecurityStats();

      expect(stats).toMatchObject({
        totalSessions: expect.any(Number),
        activeSessions: expect.any(Number),
        expiredSessions: expect.any(Number),
        userSessions: expect.any(Number),
        securityEvents: expect.any(Number),
        riskLevels: expect.any(Object)
      });
    });
  });
});

describe('Integration Tests', () => {
  it('should handle complete authentication flow', async () => {
    // Create session
    const session = await createSecureSession(mockUser, mockSupabaseSession, {
      role: 'client',
      permissions: ['read', 'write']
    });

    // Validate session
    const validation = await validateSession(session.sessionId);
    expect(validation.isValid).toBe(true);

    // Refresh session
    const refreshed = await refreshSession(session.sessionId);
    expect(refreshed.expiresAt).toBeGreaterThan(session.expiresAt);

    // Check concurrent sessions
    const sessions = await getConcurrentSessions(mockUser.id);
    expect(sessions).toHaveLength(1);

    // Invalidate session
    await invalidateSession(session.sessionId, 'test_complete');

    // Verify session is gone
    const finalValidation = await validateSession(session.sessionId);
    expect(finalValidation.isValid).toBe(false);
  });

  it('should handle session security violations', async () => {
    const session = await createSecureSession(mockUser, mockSupabaseSession, {
      role: 'client',
      permissions: ['read']
    });

    // Simulate fingerprint change (security violation)
    const modifiedSession = {
      ...session,
      fingerprint: {
        ...session.fingerprint,
        userAgent: 'completely-different-browser',
        screenResolution: '800x600',
        platform: 'Linux'
      }
    };

    // Store modified session
    localStorage.setItem(
      `ipec_session_${modifiedSession.sessionId}`,
      btoa(JSON.stringify(modifiedSession))
    );

    // Validation should detect the violation
    const validation = await validateSession(modifiedSession.sessionId);
    expect(validation.securityRisk).toBe('critical');
  });
});

describe('Error Handling', () => {
  it('should handle storage errors gracefully', async () => {
    // Mock localStorage to throw error
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = vi.fn().mockImplementation(() => {
      throw new Error('Storage error');
    });

    await expect(createSecureSession(mockUser, mockSupabaseSession, {
      role: 'client',
      permissions: ['read']
    })).rejects.toThrow();

    // Restore original method
    localStorage.setItem = originalSetItem;
  });

  it('should handle crypto API errors', async () => {
    // Mock crypto.subtle to throw error
    const originalSubtle = window.crypto.subtle;
    window.crypto.subtle = {
      ...originalSubtle,
      digest: vi.fn().mockRejectedValue(new Error('Crypto error'))
    };

    // Should still work with fallback
    const session = await createSecureSession(mockUser, mockSupabaseSession, {
      role: 'client',
      permissions: ['read']
    });

    expect(session.fingerprint.hash).toBeDefined();

    // Restore original method
    window.crypto.subtle = originalSubtle;
  });
});