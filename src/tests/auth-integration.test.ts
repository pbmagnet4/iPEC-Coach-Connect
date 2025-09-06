/**
 * Authentication Integration Test Suite
 * 
 * Comprehensive tests to verify authentication flows, state management,
 * and security features in the iPEC Coach Connect application.
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import React from 'react';

// Import auth services and components
import { authService } from '../services/auth.service';
import { useUnifiedUserStore, useLegacyAuth } from '../stores/unified-user-store';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { GoogleSignInButton } from '../components/GoogleSignInButton';
import { mfaService } from '../services/mfa.service';

// Mock Supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ 
        data: { subscription: { unsubscribe: vi.fn() } } 
      })),
      getSession: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
        upsert: vi.fn(),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(),
            })),
          })),
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(),
          })),
        })),
      })),
    })),
  },
  supabaseUtils: {
    getCurrentSession: vi.fn(),
  },
  handleSupabaseError: vi.fn((error) => error),
  SupabaseError: class extends Error {
    code: string;
    constructor(message: string, code?: string) {
      super(message);
      this.code = code || 'UNKNOWN';
    }
  }
}));

// Mock external dependencies
vi.mock('../lib/rate-limiter-enhanced', () => ({
  checkRateLimit: vi.fn(() => ({ allowed: true })),
  recordAuthAttempt: vi.fn(),
  getRateLimitStatus: vi.fn(() => ({})),
}));

vi.mock('../lib/csrf-protection', () => ({
  generateOAuthState: vi.fn(() => 'mock-state'),
  clearCSRFTokens: vi.fn(),
}));

vi.mock('../lib/secure-session', () => ({
  setSecureData: vi.fn(),
  getSecureData: vi.fn(),
  removeSecureData: vi.fn(),
  clearAllSecureData: vi.fn(),
}));

vi.mock('../lib/session-security', () => ({
  sessionSecurity: {
    getSecurityStats: vi.fn(() => ({})),
  },
  createSecureSession: vi.fn(() => ({
    sessionId: 'mock-session-id',
    expiresAt: Date.now() + 3600000,
  })),
  validateSession: vi.fn(() => ({
    isValid: true,
    requiresRefresh: false,
  })),
  refreshSession: vi.fn(),
  invalidateSession: vi.fn(),
  getConcurrentSessions: vi.fn(() => []),
  invalidateAllOtherSessions: vi.fn(),
}));

describe('Authentication Integration Tests', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Reset auth service state
    authService.destroy();
  });

  afterEach(() => {
    // Cleanup after each test
    vi.clearAllMocks();
  });

  describe('AuthService Core Functionality', () => {
    test('should initialize with correct default state', () => {
      const state = authService.getState();
      
      expect(state.user).toBeNull();
      expect(state.session).toBeNull();
      expect(state.profile).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(true); // Initially loading
    });

    test('should handle successful sign up', async () => {
      // Mock successful Supabase response
      const mockUser = { id: 'user-id', email: 'test@example.com' };
      const { supabase } = await import('../lib/supabase');
      
      vi.mocked(supabase.auth.signUp).mockResolvedValueOnce({
        data: { user: mockUser, session: null },
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        upsert: vi.fn().mockResolvedValue({ error: null }),
      } as any);

      const result = await authService.signUp({
        email: 'test@example.com',
        password: 'Test123!@#',
        fullName: 'Test User',
        role: 'client',
      });

      expect(result.error).toBeUndefined();
      expect(result.data).toEqual(mockUser);
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'Test123!@#',
        options: {
          data: {
            full_name: 'Test User',
            role: 'client',
          },
        },
      });
    });

    test('should handle successful sign in', async () => {
      const mockUser = { id: 'user-id', email: 'test@example.com' };
      const mockSession = { access_token: 'token', user: mockUser };
      const { supabase } = await import('../lib/supabase');

      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      const result = await authService.signIn({
        email: 'test@example.com',
        password: 'Test123!@#',
      });

      expect(result.error).toBeUndefined();
      expect(result.data).toEqual(mockUser);
    });

    test('should handle sign in errors', async () => {
      const { supabase, SupabaseError } = await import('../lib/supabase');

      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
        data: { user: null, session: null },
        error: new Error('Invalid credentials'),
      });

      const result = await authService.signIn({
        email: 'invalid@example.com',
        password: 'wrongpassword',
      });

      expect(result.error).toBeTruthy();
      expect(result.data).toBeUndefined();
    });

    test('should handle Google OAuth sign in', async () => {
      const { supabase } = await import('../lib/supabase');

      vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValueOnce({
        data: { provider: 'google', url: 'https://oauth-url' },
        error: null,
      });

      const result = await authService.signInWithGoogle();

      expect(result.error).toBeUndefined();
      expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: expect.objectContaining({
          redirectTo: expect.stringContaining('/auth/callback'),
          queryParams: {
            state: 'mock-state',
          },
        }),
      });
    });

    test('should handle sign out', async () => {
      const { supabase } = await import('../lib/supabase');

      vi.mocked(supabase.auth.signOut).mockResolvedValueOnce({
        error: null,
      });

      const result = await authService.signOut();

      expect(result.error).toBeUndefined();
      expect(supabase.auth.signOut).toHaveBeenCalled();
    });

    test('should handle password reset', async () => {
      const { supabase } = await import('../lib/supabase');

      vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValueOnce({
        data: {},
        error: null,
      });

      const result = await authService.resetPassword({
        email: 'test@example.com',
      });

      expect(result.error).toBeUndefined();
      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        {
          redirectTo: expect.stringContaining('/auth/reset-password'),
        }
      );
    });
  });

  describe('State Management Integration', () => {
    test('should sync auth state with unified user store', async () => {
      // Mock successful authentication
      const mockUser = { 
        id: 'user-id', 
        email: 'test@example.com',
        email_confirmed_at: new Date().toISOString(),
      };
      
      // Simulate auth state change
      const state = authService.getState();
      expect(state.isAuthenticated).toBe(false);

      // Mock profile data loading
      const { supabase } = await import('../lib/supabase');
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'user-id',
                full_name: 'Test User',
                email: 'test@example.com',
                coaches: [],
              },
              error: null,
            }),
          })),
        })),
      } as any);

      // Load user data
      await (authService as any).loadUserData(mockUser);

      const updatedState = authService.getState();
      expect(updatedState.user).toEqual(mockUser);
      expect(updatedState.isAuthenticated).toBe(true);
      expect(updatedState.profile).toBeTruthy();
    });

    test('should provide legacy compatibility layer', () => {
      const legacyAuth = useLegacyAuth();
      
      expect(legacyAuth).toHaveProperty('user');
      expect(legacyAuth).toHaveProperty('isLoading');
      expect(legacyAuth).toHaveProperty('error');
      expect(legacyAuth).toHaveProperty('setUser');
      expect(legacyAuth).toHaveProperty('setLoading');
      expect(legacyAuth).toHaveProperty('setError');
    });
  });

  describe('Protected Route Integration', () => {
    const TestComponent = () => <div>Protected Content</div>;
    const LoginComponent = () => <div>Login Page</div>;

    test('should redirect unauthenticated users to login', () => {
      // Mock unauthenticated state
      const mockStore = {
        isAuthenticated: false,
        isLoading: false,
        userId: null,
        profile: null,
        primaryRole: null,
        roles: [],
        permissions: [],
        accountStatus: 'active',
        onboardingStage: 'profile_setup',
        isOnboardingComplete: false,
        checkPermission: vi.fn(() => false),
        hasRole: vi.fn(() => false),
        hasAnyRole: vi.fn(() => false),
      };

      vi.mocked(useUnifiedUserStore).mockReturnValue(mockStore as any);

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute requiresAuth={true}>
                  <TestComponent />
                </ProtectedRoute>
              } 
            />
            <Route path="/login" element={<LoginComponent />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('Login Page')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    test('should allow authenticated users to access protected routes', () => {
      // Mock authenticated state
      const mockStore = {
        isAuthenticated: true,
        isLoading: false,
        userId: 'user-id',
        profile: { id: 'user-id', full_name: 'Test User' },
        primaryRole: 'client',
        roles: ['client'],
        permissions: [],
        accountStatus: 'active',
        onboardingStage: 'completed',
        isOnboardingComplete: true,
        checkPermission: vi.fn(() => true),
        hasRole: vi.fn(() => true),
        hasAnyRole: vi.fn(() => true),
      };

      vi.mocked(useUnifiedUserStore).mockReturnValue(mockStore as any);

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute requiresAuth={true}>
                  <TestComponent />
                </ProtectedRoute>
              } 
            />
            <Route path="/login" element={<LoginComponent />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
      expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
    });

    test('should enforce role-based access control', () => {
      // Mock client user trying to access coach route
      const mockStore = {
        isAuthenticated: true,
        isLoading: false,
        userId: 'user-id',
        profile: { id: 'user-id', full_name: 'Test User' },
        primaryRole: 'client',
        roles: ['client'],
        permissions: [],
        accountStatus: 'active',
        onboardingStage: 'completed',
        isOnboardingComplete: true,
        checkPermission: vi.fn(() => false),
        hasRole: vi.fn((role: string) => role === 'client'),
        hasAnyRole: vi.fn((roles: string[]) => roles.includes('client')),
      };

      vi.mocked(useUnifiedUserStore).mockReturnValue(mockStore as any);

      render(
        <MemoryRouter initialEntries={['/coach-dashboard']}>
          <Routes>
            <Route 
              path="/coach-dashboard" 
              element={
                <ProtectedRoute 
                  requiresAuth={true}
                  allowedRoles={['coach', 'admin']}
                >
                  <div>Coach Dashboard</div>
                </ProtectedRoute>
              } 
            />
            <Route path="/unauthorized" element={<div>Unauthorized</div>} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('Access denied: Insufficient permissions')).toBeInTheDocument();
      expect(screen.queryByText('Coach Dashboard')).not.toBeInTheDocument();
    });
  });

  describe('Security Features', () => {
    test('should apply rate limiting on multiple failed attempts', async () => {
      const { checkRateLimit } = await import('../lib/rate-limiter-enhanced');
      
      // First few attempts should be allowed
      vi.mocked(checkRateLimit).mockReturnValue({ allowed: true });
      
      let result = await authService.signIn({
        email: 'test@example.com',
        password: 'wrongpassword',
      });
      
      expect(checkRateLimit).toHaveBeenCalled();

      // Simulate rate limit after multiple attempts
      vi.mocked(checkRateLimit).mockReturnValue({ 
        allowed: false,
        blockExpires: Date.now() + 60000,
      });

      result = await authService.signIn({
        email: 'test@example.com',
        password: 'wrongpassword',
      });

      expect(result.error?.code).toBe('RATE_LIMITED');
    });

    test('should handle MFA verification flow', async () => {
      const mockUser = { id: 'user-id', email: 'test@example.com' };
      
      // Mock MFA settings
      vi.spyOn(mfaService, 'getMFASettings').mockResolvedValue({
        mfa_enabled: true,
        secret_key: 'mock-secret',
        backup_codes: [],
      } as any);

      vi.spyOn(mfaService, 'isDeviceTrusted').mockResolvedValue(false);
      vi.spyOn(mfaService, 'verifyMFALogin').mockResolvedValue({
        success: true,
        requiresDeviceTrust: false,
      });

      // Sign in should set MFA requirement
      await (authService as any).loadUserData(mockUser);
      
      let state = authService.getState();
      expect(state.requiresMFA).toBe(true);
      expect(state.mfaVerified).toBe(false);

      // Verify MFA code
      const mfaResult = await authService.verifyMFA('123456');
      
      expect(mfaResult.error).toBeUndefined();
      
      state = authService.getState();
      expect(state.mfaVerified).toBe(true);
      expect(state.requiresMFA).toBe(false);
    });

    test('should validate CSRF protection for OAuth', async () => {
      const { generateOAuthState } = await import('../lib/csrf-protection');
      
      await authService.signInWithGoogle();
      
      expect(generateOAuthState).toHaveBeenCalledWith('/dashboard');
    });
  });

  describe('Component Integration', () => {
    test('should integrate with GoogleSignInButton component', async () => {
      const mockOnSuccess = vi.fn();
      const mockOnError = vi.fn();

      // Mock successful Google sign-in
      vi.spyOn(authService, 'signInWithGoogle').mockResolvedValue({
        data: undefined,
      });

      render(
        <MemoryRouter>
          <GoogleSignInButton
            onSuccess={mockOnSuccess}
            onError={mockOnError}
          />
        </MemoryRouter>
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(authService.signInWithGoogle).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      const { supabase } = await import('../lib/supabase');
      
      vi.mocked(supabase.auth.signInWithPassword).mockRejectedValue(
        new Error('Network error')
      );

      const result = await authService.signIn({
        email: 'test@example.com',
        password: 'Test123!@#',
      });

      expect(result.error).toBeTruthy();
      expect(result.error?.message).toContain('Network error');
    });

    test('should handle malformed data gracefully', async () => {
      const { supabase } = await import('../lib/supabase');
      
      // Mock malformed response
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: { id: 'user-id' }, // Missing required fields
              error: null,
            }),
          })),
        })),
      } as any);

      const mockUser = { id: 'user-id', email: 'test@example.com' };
      
      // Should handle invalid profile data
      await (authService as any).loadUserData(mockUser);
      
      const state = authService.getState();
      expect(state.profile).toBeNull(); // Should be null due to validation failure
    });
  });

  describe('Memory Management', () => {
    test('should clean up resources on destroy', () => {
      const memoryStats = authService.getMemoryStats();
      expect(memoryStats.isDestroyed).toBe(false);
      
      authService.destroy();
      
      const statsAfterDestroy = authService.getMemoryStats();
      expect(statsAfterDestroy.isDestroyed).toBe(true);
      expect(statsAfterDestroy.listenersCount).toBe(0);
    });

    test('should handle subscription cleanup', () => {
      const unsubscribeSpy = vi.fn();
      
      // Mock Supabase subscription
      const { supabase } = vi.mocked(await import('../lib/supabase'));
      vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
        data: {
          subscription: {
            unsubscribe: unsubscribeSpy,
          },
        },
      } as any);

      // Initialize new auth service instance
      const newAuthService = new (authService.constructor as any)();
      
      // Destroy should call unsubscribe
      newAuthService.destroy();
      
      expect(unsubscribeSpy).toHaveBeenCalled();
    });
  });
});

// Helper function to create mock auth state
export function createMockAuthState(overrides: any = {}) {
  return {
    user: null,
    session: null,
    profile: null,
    coach: null,
    role: null,
    isLoading: false,
    isAuthenticated: false,
    secureSession: null,
    sessionValidation: null,
    concurrentSessions: 0,
    sessionExpiresAt: null,
    requiresRefresh: false,
    mfaSettings: null,
    requiresMFA: false,
    mfaVerified: false,
    ...overrides,
  };
}

// Helper function to mock authenticated user
export function mockAuthenticatedUser(userOverrides: any = {}) {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    email_confirmed_at: new Date().toISOString(),
    ...userOverrides,
  };

  const mockProfile = {
    id: 'test-user-id',
    full_name: 'Test User',
    email: 'test@example.com',
    ...userOverrides.profile,
  };

  return {
    user: mockUser,
    profile: mockProfile,
    isAuthenticated: true,
    isLoading: false,
    role: 'client',
    ...userOverrides,
  };
}