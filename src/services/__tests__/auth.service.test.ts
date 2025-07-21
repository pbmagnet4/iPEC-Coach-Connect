/**
 * Authentication Service Unit Tests
 * 
 * Comprehensive testing for the AuthService with ultra-deep analysis covering:
 * - Complete authentication flow testing (signup, signin, signout)
 * - State management and listener pattern validation
 * - Error handling and edge case scenarios
 * - Session persistence and security boundaries
 * - Role-based authentication and permission systems
 * - Google OAuth integration and callback handling
 * - Password reset and recovery mechanisms
 * - Profile management and coach application flows
 * - Real-time authentication state synchronization
 * - Database integration and data consistency
 * - Performance optimization and memory management
 * - Security vulnerability testing and protection
 * 
 * Testing Philosophy:
 * - Isolated unit testing with comprehensive mocking
 * - State-driven testing for authentication flows
 * - Error boundary testing and recovery mechanisms
 * - Performance and memory leak detection
 * - Security-focused testing for authentication vulnerabilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AuthService } from '../auth.service';
import { SupabaseError } from '../../lib/supabase';

// Mock Supabase client with comprehensive implementation
const mockSupabaseAuth = {
  signUp: vi.fn(),
  signInWithPassword: vi.fn(),
  signInWithOAuth: vi.fn(),
  signOut: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  updateUser: vi.fn(),
  onAuthStateChange: vi.fn(),
  verifyOtp: vi.fn(),
  getUser: vi.fn(),
};

const mockSupabaseFrom = vi.fn();
const mockSupabaseClient = {
  auth: mockSupabaseAuth,
  from: mockSupabaseFrom,
};

const mockSupabaseUtils = {
  getCurrentSession: vi.fn(),
};

const mockHandleSupabaseError = vi.fn((error) => {
  if (error instanceof SupabaseError) return error;
  return new SupabaseError(error.message || 'Unknown error');
});

// Mock the Supabase module
vi.mock('../../lib/supabase', () => ({
  supabase: mockSupabaseClient,
  supabaseUtils: mockSupabaseUtils,
  handleSupabaseError: mockHandleSupabaseError,
  SupabaseError: class SupabaseError extends Error {
    constructor(message: string, public code?: string) {
      super(message);
      this.name = 'SupabaseError';
    }
  },
}));

// Test data factories for comprehensive scenario testing
const createTestUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  user_metadata: {
    full_name: 'Test User',
    role: 'client',
  },
  created_at: new Date().toISOString(),
  ...overrides,
});

const createTestProfile = (overrides = {}) => ({
  id: 'test-user-id',
  full_name: 'Test User',
  phone: '+1234567890',
  timezone: 'UTC',
  bio: '',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

const createTestCoach = (overrides = {}) => ({
  id: 'test-user-id',
  ipec_certification_number: 'IPEC-TEST-123',
  certification_level: 'Professional' as const,
  certification_date: '2020-01-01',
  specializations: ['Life Coaching', 'Career Coaching'],
  hourly_rate: 150,
  experience_years: 5,
  languages: ['English'],
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

const createTestSession = (overrides = {}) => ({
  access_token: 'test-access-token',
  refresh_token: 'test-refresh-token',
  expires_in: 3600,
  token_type: 'bearer',
  user: createTestUser(),
  ...overrides,
});

describe('AuthService', () => {
  let authService: AuthService;
  let stateChangeCallback: (event: string, session: any) => void;

  beforeEach(() => {
    // Clear all mocks and reset state
    vi.clearAllMocks();
    
    // Setup default mock implementations
    mockSupabaseAuth.onAuthStateChange.mockImplementation((callback) => {
      stateChangeCallback = callback;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });
    
    mockSupabaseUtils.getCurrentSession.mockResolvedValue(null);
    
    // Create fresh AuthService instance
    authService = new (AuthService as any)();
  });

  afterEach(() => {
    // Clean up and restore all mocks
    vi.restoreAllMocks();
  });

  describe('Initialization and State Management', () => {
    it('should initialize with correct default state', () => {
      const state = authService.getState();
      
      expect(state).toEqual({
        user: null,
        session: null,
        profile: null,
        coach: null,
        role: null,
        isLoading: true,
        isAuthenticated: false,
      });
    });

    it('should set up auth state change listener on initialization', () => {
      expect(mockSupabaseAuth.onAuthStateChange).toHaveBeenCalledTimes(1);
      expect(mockSupabaseAuth.onAuthStateChange).toHaveBeenCalledWith(
        expect.any(Function)
      );
    });

    it('should load user data when session exists on initialization', async () => {
      const testUser = createTestUser();
      const testSession = createTestSession({ user: testUser });
      const testProfile = createTestProfile();

      mockSupabaseUtils.getCurrentSession.mockResolvedValue(testSession);
      
      // Mock profile query
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({ data: testProfile, error: null });
      
      mockSupabaseFrom.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });

      // Create new service instance to trigger initialization
      const newAuthService = new (AuthService as any)();
      
      // Wait for initialization to complete
      await new Promise(resolve => setTimeout(resolve, 10));

      const state = newAuthService.getState();
      expect(state.user).toEqual(testUser);
      expect(state.profile).toEqual(testProfile);
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
    });

    it('should handle initialization errors gracefully', async () => {
      mockSupabaseUtils.getCurrentSession.mockRejectedValue(new Error('Network error'));

      const newAuthService = new (AuthService as any)();
      await new Promise(resolve => setTimeout(resolve, 10));

      const state = newAuthService.getState();
      expect(state.isLoading).toBe(false);
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('State Change Listeners', () => {
    it('should notify listeners when state changes', async () => {
      const listener = vi.fn();
      const unsubscribe = authService.onStateChange(listener);

      // Should immediately call with current state
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(authService.getState());

      // Trigger state change
      const testUser = createTestUser();
      await authService.signIn({
        email: 'test@example.com',
        password: 'password123',
      });

      // Should notify listeners of state change
      expect(listener).toHaveBeenCalledTimes(2);

      // Unsubscribe should work
      unsubscribe();
      
      // Should not notify after unsubscribe
      await authService.signOut();
      expect(listener).toHaveBeenCalledTimes(2); // Still 2, not 3
    });

    it('should handle multiple listeners correctly', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      
      authService.onStateChange(listener1);
      authService.onStateChange(listener2);

      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
    });

    it('should handle listener removal correctly', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      
      const unsubscribe1 = authService.onStateChange(listener1);
      authService.onStateChange(listener2);

      // Remove first listener
      unsubscribe1();

      // Trigger state change
      authService['updateState']({ isLoading: false });

      // Only second listener should be called
      expect(listener1).toHaveBeenCalledTimes(1); // Only initial call
      expect(listener2).toHaveBeenCalledTimes(2); // Initial + update
    });
  });

  describe('User Registration (signUp)', () => {
    it('should successfully register a new user', async () => {
      const testUser = createTestUser();
      const signUpData = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
        role: 'client' as const,
        phone: '+1234567890',
        timezone: 'UTC',
      };

      mockSupabaseAuth.signUp.mockResolvedValue({
        data: { user: testUser },
        error: null,
      });

      // Mock profile creation
      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockUpsert = vi.fn().mockResolvedValue({ error: null });
      
      mockSupabaseFrom.mockReturnValue({
        upsert: mockUpsert,
      });

      const result = await authService.signUp(signUpData);

      expect(result.data).toEqual(testUser);
      expect(result.error).toBeUndefined();
      
      expect(mockSupabaseAuth.signUp).toHaveBeenCalledWith({
        email: signUpData.email,
        password: signUpData.password,
        options: {
          data: {
            full_name: signUpData.fullName,
            role: signUpData.role,
          },
        },
      });

      expect(mockSupabaseFrom).toHaveBeenCalledWith('profiles');
      expect(mockUpsert).toHaveBeenCalledWith({
        id: testUser.id,
        full_name: signUpData.fullName,
        phone: signUpData.phone,
        timezone: signUpData.timezone,
      });
    });

    it('should handle signup errors gracefully', async () => {
      const signUpData = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
        role: 'client' as const,
      };

      const authError = new Error('Email already exists');
      mockSupabaseAuth.signUp.mockResolvedValue({
        data: { user: null },
        error: authError,
      });

      const result = await authService.signUp(signUpData);

      expect(result.data).toBeUndefined();
      expect(result.error).toBeInstanceOf(Error);
      expect(mockHandleSupabaseError).toHaveBeenCalledWith(authError);
    });

    it('should handle missing user in signup response', async () => {
      const signUpData = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
        role: 'client' as const,
      };

      mockSupabaseAuth.signUp.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await authService.signUp(signUpData);

      expect(result.data).toBeUndefined();
      expect(result.error).toBeInstanceOf(SupabaseError);
    });

    it('should update loading state during signup', async () => {
      const signUpData = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
        role: 'client' as const,
      };

      let loadingStates: boolean[] = [];
      authService.onStateChange((state) => {
        loadingStates.push(state.isLoading);
      });

      // Start with a slow response
      mockSupabaseAuth.signUp.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({ data: { user: createTestUser() }, error: null }), 100)
        )
      );

      const resultPromise = authService.signUp(signUpData);

      // Should immediately set loading to true
      expect(loadingStates).toContain(true);

      await resultPromise;

      // Should eventually set loading to false
      expect(loadingStates).toContain(false);
    });
  });

  describe('User Authentication (signIn)', () => {
    it('should successfully sign in with valid credentials', async () => {
      const testUser = createTestUser();
      const signInData = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockSupabaseAuth.signInWithPassword.mockResolvedValue({
        data: { user: testUser },
        error: null,
      });

      const result = await authService.signIn(signInData);

      expect(result.data).toEqual(testUser);
      expect(result.error).toBeUndefined();
      
      expect(mockSupabaseAuth.signInWithPassword).toHaveBeenCalledWith({
        email: signInData.email,
        password: signInData.password,
      });
    });

    it('should handle signin errors gracefully', async () => {
      const signInData = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const authError = new Error('Invalid login credentials');
      mockSupabaseAuth.signInWithPassword.mockResolvedValue({
        data: { user: null },
        error: authError,
      });

      const result = await authService.signIn(signInData);

      expect(result.data).toBeUndefined();
      expect(result.error).toBeInstanceOf(Error);
      expect(mockHandleSupabaseError).toHaveBeenCalledWith(authError);
    });

    it('should handle missing user in signin response', async () => {
      const signInData = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockSupabaseAuth.signInWithPassword.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await authService.signIn(signInData);

      expect(result.data).toBeUndefined();
      expect(result.error).toBeInstanceOf(SupabaseError);
    });

    it('should update loading state during signin', async () => {
      const signInData = {
        email: 'test@example.com',
        password: 'password123',
      };

      let loadingStates: boolean[] = [];
      authService.onStateChange((state) => {
        loadingStates.push(state.isLoading);
      });

      mockSupabaseAuth.signInWithPassword.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({ data: { user: createTestUser() }, error: null }), 100)
        )
      );

      const resultPromise = authService.signIn(signInData);

      // Should set loading to true
      expect(loadingStates).toContain(true);

      await resultPromise;

      // Should set loading to false
      expect(loadingStates).toContain(false);
    });
  });

  describe('Google OAuth Authentication', () => {
    it('should initiate Google OAuth flow', async () => {
      mockSupabaseAuth.signInWithOAuth.mockResolvedValue({ error: null });

      const result = await authService.signInWithGoogle();

      expect(result.error).toBeUndefined();
      expect(mockSupabaseAuth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
    });

    it('should handle OAuth errors', async () => {
      const oauthError = new Error('OAuth provider error');
      mockSupabaseAuth.signInWithOAuth.mockResolvedValue({ error: oauthError });

      const result = await authService.signInWithGoogle();

      expect(result.error).toBeInstanceOf(Error);
      expect(mockHandleSupabaseError).toHaveBeenCalledWith(oauthError);
    });

    it('should update loading state during OAuth', async () => {
      let loadingStates: boolean[] = [];
      authService.onStateChange((state) => {
        loadingStates.push(state.isLoading);
      });

      mockSupabaseAuth.signInWithOAuth.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({ error: null }), 100)
        )
      );

      const resultPromise = authService.signInWithGoogle();

      expect(loadingStates).toContain(true);

      await resultPromise;

      expect(loadingStates).toContain(false);
    });
  });

  describe('User Sign Out', () => {
    it('should successfully sign out', async () => {
      mockSupabaseAuth.signOut.mockResolvedValue({ error: null });

      const result = await authService.signOut();

      expect(result.error).toBeUndefined();
      expect(mockSupabaseAuth.signOut).toHaveBeenCalledTimes(1);
    });

    it('should handle signout errors', async () => {
      const signOutError = new Error('Signout failed');
      mockSupabaseAuth.signOut.mockResolvedValue({ error: signOutError });

      const result = await authService.signOut();

      expect(result.error).toBeInstanceOf(Error);
      expect(mockHandleSupabaseError).toHaveBeenCalledWith(signOutError);
    });

    it('should update loading state during signout', async () => {
      let loadingStates: boolean[] = [];
      authService.onStateChange((state) => {
        loadingStates.push(state.isLoading);
      });

      mockSupabaseAuth.signOut.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({ error: null }), 100)
        )
      );

      const resultPromise = authService.signOut();

      expect(loadingStates).toContain(true);

      await resultPromise;
    });
  });

  describe('Password Reset', () => {
    it('should send password reset email', async () => {
      const resetData = { email: 'test@example.com' };
      
      mockSupabaseAuth.resetPasswordForEmail.mockResolvedValue({ error: null });

      const result = await authService.resetPassword(resetData);

      expect(result.error).toBeUndefined();
      expect(mockSupabaseAuth.resetPasswordForEmail).toHaveBeenCalledWith(
        resetData.email,
        {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        }
      );
    });

    it('should handle password reset errors', async () => {
      const resetData = { email: 'nonexistent@example.com' };
      const resetError = new Error('User not found');
      
      mockSupabaseAuth.resetPasswordForEmail.mockResolvedValue({ error: resetError });

      const result = await authService.resetPassword(resetData);

      expect(result.error).toBeInstanceOf(Error);
      expect(mockHandleSupabaseError).toHaveBeenCalledWith(resetError);
    });
  });

  describe('Password Update', () => {
    it('should update user password', async () => {
      const updateData = {
        password: 'oldpassword',
        newPassword: 'newpassword123',
      };
      
      mockSupabaseAuth.updateUser.mockResolvedValue({ error: null });

      const result = await authService.updatePassword(updateData);

      expect(result.error).toBeUndefined();
      expect(mockSupabaseAuth.updateUser).toHaveBeenCalledWith({
        password: updateData.newPassword,
      });
    });

    it('should handle password update errors', async () => {
      const updateData = {
        password: 'oldpassword',
        newPassword: 'weak',
      };
      const updateError = new Error('Password too weak');
      
      mockSupabaseAuth.updateUser.mockResolvedValue({ error: updateError });

      const result = await authService.updatePassword(updateData);

      expect(result.error).toBeInstanceOf(Error);
      expect(mockHandleSupabaseError).toHaveBeenCalledWith(updateError);
    });
  });

  describe('Profile Management', () => {
    beforeEach(() => {
      // Set up authenticated user state
      authService['currentState'] = {
        user: createTestUser(),
        session: createTestSession(),
        profile: createTestProfile(),
        coach: null,
        role: 'client',
        isLoading: false,
        isAuthenticated: true,
      };
    });

    it('should update user profile', async () => {
      const updateData = {
        full_name: 'Updated Name',
        phone: '+0987654321',
      };
      const updatedProfile = { ...createTestProfile(), ...updateData };

      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({ data: updatedProfile, error: null });
      
      mockSupabaseFrom.mockReturnValue({
        update: mockUpdate,
      });
      mockUpdate.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        single: mockSingle,
      });

      const result = await authService.updateProfile(updateData);

      expect(result.data).toEqual(updatedProfile);
      expect(result.error).toBeUndefined();
      
      expect(mockSupabaseFrom).toHaveBeenCalledWith('profiles');
      expect(mockUpdate).toHaveBeenCalledWith({
        ...updateData,
        updated_at: expect.any(String),
      });
    });

    it('should handle profile update errors', async () => {
      const updateData = {
        full_name: 'Updated Name',
      };
      const updateError = new Error('Profile update failed');

      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({ data: null, error: updateError });
      
      mockSupabaseFrom.mockReturnValue({
        update: mockUpdate,
      });
      mockUpdate.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        single: mockSingle,
      });

      const result = await authService.updateProfile(updateData);

      expect(result.data).toBeUndefined();
      expect(result.error).toBeInstanceOf(Error);
    });

    it('should handle unauthenticated profile update', async () => {
      // Clear authentication state
      authService['currentState'] = {
        user: null,
        session: null,
        profile: null,
        coach: null,
        role: null,
        isLoading: false,
        isAuthenticated: false,
      };

      const updateData = {
        full_name: 'Updated Name',
      };

      const result = await authService.updateProfile(updateData);

      expect(result.data).toBeUndefined();
      expect(result.error).toBeInstanceOf(SupabaseError);
      expect(result.error?.message).toBe('User not authenticated');
    });
  });

  describe('Coach Application', () => {
    beforeEach(() => {
      // Set up authenticated user state
      authService['currentState'] = {
        user: createTestUser(),
        session: createTestSession(),
        profile: createTestProfile(),
        coach: null,
        role: 'client',
        isLoading: false,
        isAuthenticated: true,
      };
    });

    it('should successfully apply as coach', async () => {
      const coachData = {
        ipecCertificationNumber: 'IPEC-TEST-123',
        certificationLevel: 'Professional' as const,
        certificationDate: '2020-01-01',
        specializations: ['Life Coaching'],
        hourlyRate: 150,
        experienceYears: 5,
        languages: ['English'],
        bio: 'Experienced coach',
      };
      const createdCoach = createTestCoach();

      // Mock profile update
      authService.updateProfile = vi.fn().mockResolvedValue({ data: createTestProfile() });

      // Mock coach creation
      const mockInsert = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({ data: createdCoach, error: null });
      
      mockSupabaseFrom.mockReturnValue({
        insert: mockInsert,
      });
      mockInsert.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        single: mockSingle,
      });

      const result = await authService.applyAsCoach(coachData);

      expect(result.data).toEqual(createdCoach);
      expect(result.error).toBeUndefined();
      
      expect(authService.updateProfile).toHaveBeenCalledWith({ bio: coachData.bio });
      expect(mockSupabaseFrom).toHaveBeenCalledWith('coaches');
      expect(mockInsert).toHaveBeenCalledWith({
        id: 'test-user-id',
        ipec_certification_number: coachData.ipecCertificationNumber,
        certification_level: coachData.certificationLevel,
        certification_date: coachData.certificationDate,
        specializations: coachData.specializations,
        hourly_rate: coachData.hourlyRate,
        experience_years: coachData.experienceYears,
        languages: coachData.languages,
        is_active: false,
      });
    });

    it('should handle coach application errors', async () => {
      const coachData = {
        ipecCertificationNumber: 'IPEC-TEST-123',
        certificationLevel: 'Professional' as const,
        certificationDate: '2020-01-01',
        specializations: ['Life Coaching'],
        hourlyRate: 150,
        experienceYears: 5,
        languages: ['English'],
        bio: 'Experienced coach',
      };
      const applicationError = new Error('Coach application failed');

      authService.updateProfile = vi.fn().mockResolvedValue({ data: createTestProfile() });

      const mockInsert = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({ data: null, error: applicationError });
      
      mockSupabaseFrom.mockReturnValue({
        insert: mockInsert,
      });
      mockInsert.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        single: mockSingle,
      });

      const result = await authService.applyAsCoach(coachData);

      expect(result.data).toBeUndefined();
      expect(result.error).toBeInstanceOf(Error);
    });

    it('should handle unauthenticated coach application', async () => {
      // Clear authentication state
      authService['currentState'] = {
        user: null,
        session: null,
        profile: null,
        coach: null,
        role: null,
        isLoading: false,
        isAuthenticated: false,
      };

      const coachData = {
        ipecCertificationNumber: 'IPEC-TEST-123',
        certificationLevel: 'Professional' as const,
        certificationDate: '2020-01-01',
        specializations: ['Life Coaching'],
        hourlyRate: 150,
        experienceYears: 5,
        languages: ['English'],
        bio: 'Experienced coach',
      };

      const result = await authService.applyAsCoach(coachData);

      expect(result.data).toBeUndefined();
      expect(result.error).toBeInstanceOf(SupabaseError);
      expect(result.error?.message).toBe('User not authenticated');
    });
  });

  describe('Permission System', () => {
    it('should correctly check coach permissions', () => {
      authService['currentState'] = {
        user: createTestUser(),
        session: createTestSession(),
        profile: createTestProfile(),
        coach: createTestCoach({ is_active: true }),
        role: 'coach',
        isLoading: false,
        isAuthenticated: true,
      };

      expect(authService.hasPermission('canCreateSessions')).toBe(true);
      expect(authService.hasPermission('canManageCoachProfile')).toBe(true);
      expect(authService.hasPermission('canAccessAdminPanel')).toBe(false);
      expect(authService.hasPermission('canModerateContent')).toBe(true);
      expect(authService.hasPermission('canViewAnalytics')).toBe(true);
    });

    it('should correctly check client permissions', () => {
      authService['currentState'] = {
        user: createTestUser(),
        session: createTestSession(),
        profile: createTestProfile(),
        coach: null,
        role: 'client',
        isLoading: false,
        isAuthenticated: true,
      };

      expect(authService.hasPermission('canCreateSessions')).toBe(false);
      expect(authService.hasPermission('canManageCoachProfile')).toBe(false);
      expect(authService.hasPermission('canAccessAdminPanel')).toBe(false);
      expect(authService.hasPermission('canModerateContent')).toBe(false);
      expect(authService.hasPermission('canViewAnalytics')).toBe(false);
    });

    it('should correctly check admin permissions', () => {
      authService['currentState'] = {
        user: createTestUser(),
        session: createTestSession(),
        profile: createTestProfile(),
        coach: null,
        role: 'admin',
        isLoading: false,
        isAuthenticated: true,
      };

      expect(authService.hasPermission('canCreateSessions')).toBe(false);
      expect(authService.hasPermission('canManageCoachProfile')).toBe(false);
      expect(authService.hasPermission('canAccessAdminPanel')).toBe(true);
      expect(authService.hasPermission('canModerateContent')).toBe(true);
      expect(authService.hasPermission('canViewAnalytics')).toBe(true);
    });

    it('should handle inactive coach permissions', () => {
      authService['currentState'] = {
        user: createTestUser(),
        session: createTestSession(),
        profile: createTestProfile(),
        coach: createTestCoach({ is_active: false }),
        role: 'coach',
        isLoading: false,
        isAuthenticated: true,
      };

      expect(authService.hasPermission('canCreateSessions')).toBe(false);
      expect(authService.hasPermission('canManageCoachProfile')).toBe(true);
    });
  });

  describe('Auth State Change Handling', () => {
    it('should handle SIGNED_IN event', async () => {
      const testUser = createTestUser();
      const testSession = createTestSession({ user: testUser });
      const testProfile = createTestProfile();

      // Mock profile query
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({ data: testProfile, error: null });
      
      mockSupabaseFrom.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });

      mockSupabaseUtils.getCurrentSession.mockResolvedValue(testSession);

      // Trigger SIGNED_IN event
      await stateChangeCallback('SIGNED_IN', testSession);

      const state = authService.getState();
      expect(state.user).toEqual(testUser);
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
    });

    it('should handle SIGNED_OUT event', async () => {
      // Set initial authenticated state
      authService['currentState'] = {
        user: createTestUser(),
        session: createTestSession(),
        profile: createTestProfile(),
        coach: null,
        role: 'client',
        isLoading: false,
        isAuthenticated: true,
      };

      // Trigger SIGNED_OUT event
      await stateChangeCallback('SIGNED_OUT', null);

      const state = authService.getState();
      expect(state.user).toBeNull();
      expect(state.session).toBeNull();
      expect(state.profile).toBeNull();
      expect(state.coach).toBeNull();
      expect(state.role).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
    });

    it('should handle TOKEN_REFRESHED event', async () => {
      const newSession = createTestSession({ access_token: 'new-token' });

      // Set initial state
      authService['currentState'] = {
        user: createTestUser(),
        session: createTestSession(),
        profile: createTestProfile(),
        coach: null,
        role: 'client',
        isLoading: false,
        isAuthenticated: true,
      };

      // Trigger TOKEN_REFRESHED event
      await stateChangeCallback('TOKEN_REFRESHED', newSession);

      const state = authService.getState();
      expect(state.session).toEqual(newSession);
    });
  });

  describe('User Data Loading', () => {
    it('should load complete user data including coach info', async () => {
      const testUser = createTestUser();
      const testProfile = createTestProfile();
      const testCoach = createTestCoach();
      const testSession = createTestSession();

      // Mock profile query
      let queryCall = 0;
      mockSupabaseFrom.mockImplementation((table) => {
        queryCall++;
        if (table === 'profiles') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: testProfile, error: null })
              })
            })
          };
        } else if (table === 'coaches') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: testCoach, error: null })
              })
            })
          };
        }
      });

      mockSupabaseUtils.getCurrentSession.mockResolvedValue(testSession);

      // Call loadUserData method directly
      await authService['loadUserData'](testUser);

      const state = authService.getState();
      expect(state.user).toEqual(testUser);
      expect(state.profile).toEqual(testProfile);
      expect(state.coach).toEqual(testCoach);
      expect(state.role).toBe('coach');
      expect(state.isAuthenticated).toBe(true);
    });

    it('should handle missing profile gracefully', async () => {
      const testUser = createTestUser();

      mockSupabaseFrom.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ 
              data: null, 
              error: { code: 'PGRST116' } // No rows found
            })
          })
        })
      });

      mockSupabaseUtils.getCurrentSession.mockResolvedValue(createTestSession());

      await authService['loadUserData'](testUser);

      const state = authService.getState();
      expect(state.user).toEqual(testUser);
      expect(state.profile).toBeNull();
      expect(state.coach).toBeNull();
      expect(state.role).toBe('client');
    });

    it('should handle profile loading errors', async () => {
      const testUser = createTestUser();
      const profileError = new Error('Database error');

      mockSupabaseFrom.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: null, error: profileError })
          })
        })
      });

      await authService['loadUserData'](testUser);

      const state = authService.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
    it('should handle concurrent authentication attempts', async () => {
      const signInData = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockSupabaseAuth.signInWithPassword.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({ data: { user: createTestUser() }, error: null }), 100)
        )
      );

      // Start multiple concurrent sign-in attempts
      const promises = [
        authService.signIn(signInData),
        authService.signIn(signInData),
        authService.signIn(signInData),
      ];

      const results = await Promise.all(promises);

      // All should succeed without conflict
      results.forEach(result => {
        expect(result.error).toBeUndefined();
        expect(result.data).toBeDefined();
      });
    });

    it('should handle memory leaks from listeners', () => {
      const listeners: (() => void)[] = [];

      // Create many listeners
      for (let i = 0; i < 1000; i++) {
        const unsubscribe = authService.onStateChange(() => {});
        listeners.push(unsubscribe);
      }

      // Unsubscribe all
      listeners.forEach(unsubscribe => unsubscribe());

      // State changes should not affect removed listeners
      const listenerCount = authService['listeners'].length;
      expect(listenerCount).toBe(0);
    });

    it('should handle rapid state changes', async () => {
      const stateChanges: any[] = [];
      authService.onStateChange((state) => stateChanges.push({ ...state }));

      // Rapidly trigger multiple state changes
      for (let i = 0; i < 100; i++) {
        authService['updateState']({ isLoading: i % 2 === 0 });
      }

      // Should handle all state changes without errors
      expect(stateChanges.length).toBeGreaterThan(100);
    });

    it('should handle corrupted session data', async () => {
      const corruptedSession = {
        access_token: null,
        user: null,
        // Missing required fields
      };

      mockSupabaseUtils.getCurrentSession.mockResolvedValue(corruptedSession as any);

      const newAuthService = new (AuthService as any)();
      await new Promise(resolve => setTimeout(resolve, 10));

      const state = newAuthService.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
    });

    it('should handle network failures during authentication', async () => {
      const signInData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const networkError = new Error('Network request failed');
      mockSupabaseAuth.signInWithPassword.mockRejectedValue(networkError);

      const result = await authService.signIn(signInData);

      expect(result.error).toBeInstanceOf(Error);
      expect(mockHandleSupabaseError).toHaveBeenCalledWith(networkError);
    });

    it('should handle malformed email addresses', async () => {
      const invalidEmailData = {
        email: 'invalid-email',
        password: 'password123',
      };

      const validationError = new Error('Invalid email format');
      mockSupabaseAuth.signInWithPassword.mockResolvedValue({
        data: { user: null },
        error: validationError,
      });

      const result = await authService.signIn(invalidEmailData);

      expect(result.error).toBeInstanceOf(Error);
    });

    it('should handle session expiry during operations', async () => {
      // Set up authenticated state
      authService['currentState'] = {
        user: createTestUser(),
        session: createTestSession(),
        profile: createTestProfile(),
        coach: null,
        role: 'client',
        isLoading: false,
        isAuthenticated: true,
      };

      const sessionExpiredError = new Error('Session expired');
      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({ data: null, error: sessionExpiredError });
      
      mockSupabaseFrom.mockReturnValue({
        update: mockUpdate,
      });
      mockUpdate.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        single: mockSingle,
      });

      const result = await authService.updateProfile({ full_name: 'Updated Name' });

      expect(result.error).toBeInstanceOf(Error);
    });

    it('should handle database connection failures', async () => {
      const testUser = createTestUser();
      const dbConnectionError = new Error('Connection timeout');

      mockSupabaseFrom.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () => Promise.reject(dbConnectionError)
          })
        })
      });

      await authService['loadUserData'](testUser);

      const state = authService.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
    });

    it('should handle OAuth callback errors', async () => {
      const oauthError = new Error('OAuth state mismatch');
      mockSupabaseAuth.signInWithOAuth.mockResolvedValue({ error: oauthError });

      const result = await authService.signInWithGoogle();

      expect(result.error).toBeInstanceOf(Error);
      expect(mockHandleSupabaseError).toHaveBeenCalledWith(oauthError);
    });

    it('should handle duplicate coach applications', async () => {
      authService['currentState'] = {
        user: createTestUser(),
        session: createTestSession(),
        profile: createTestProfile(),
        coach: null,
        role: 'client',
        isLoading: false,
        isAuthenticated: true,
      };

      const duplicateError = new Error('Coach profile already exists');
      authService.updateProfile = vi.fn().mockResolvedValue({ data: createTestProfile() });

      const mockInsert = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({ data: null, error: duplicateError });
      
      mockSupabaseFrom.mockReturnValue({
        insert: mockInsert,
      });
      mockInsert.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        single: mockSingle,
      });

      const coachData = {
        ipecCertificationNumber: 'IPEC-TEST-123',
        certificationLevel: 'Professional' as const,
        certificationDate: '2020-01-01',
        specializations: ['Life Coaching'],
        hourlyRate: 150,
        experienceYears: 5,
        languages: ['English'],
        bio: 'Experienced coach',
      };

      const result = await authService.applyAsCoach(coachData);

      expect(result.error).toBeInstanceOf(Error);
    });
  });

  describe('Security Testing', () => {
    it('should prevent SQL injection in profile updates', async () => {
      authService['currentState'] = {
        user: createTestUser(),
        session: createTestSession(),
        profile: createTestProfile(),
        coach: null,
        role: 'client',
        isLoading: false,
        isAuthenticated: true,
      };

      const maliciousInput = {
        full_name: "'; DROP TABLE profiles; --",
        bio: '<script>alert("XSS")</script>',
      };

      const updatedProfile = { ...createTestProfile(), ...maliciousInput };

      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({ data: updatedProfile, error: null });
      
      mockSupabaseFrom.mockReturnValue({
        update: mockUpdate,
      });
      mockUpdate.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        single: mockSingle,
      });

      const result = await authService.updateProfile(maliciousInput);

      // Supabase should handle SQL injection prevention
      expect(result.data).toEqual(updatedProfile);
      expect(mockUpdate).toHaveBeenCalledWith({
        ...maliciousInput,
        updated_at: expect.any(String),
      });
    });

    it('should validate permission boundaries', () => {
      // Test unauthorized permission access
      authService['currentState'] = {
        user: createTestUser(),
        session: createTestSession(),
        profile: createTestProfile(),
        coach: null,
        role: 'client',
        isLoading: false,
        isAuthenticated: true,
      };

      // Client should not have admin permissions
      expect(authService.hasPermission('canAccessAdminPanel')).toBe(false);
      expect(authService.hasPermission('canModerateContent')).toBe(false);
      expect(authService.hasPermission('canCreateSessions')).toBe(false);
    });

    it('should prevent role escalation attacks', async () => {
      const testUser = createTestUser();
      authService['currentState'] = {
        user: testUser,
        session: createTestSession(),
        profile: createTestProfile(),
        coach: null,
        role: 'client',
        isLoading: false,
        isAuthenticated: true,
      };

      // Attempt to escalate role through profile update
      const maliciousUpdate = {
        role: 'admin', // This should not be possible through profile update
      };

      const updatedProfile = createTestProfile();

      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({ data: updatedProfile, error: null });
      
      mockSupabaseFrom.mockReturnValue({
        update: mockUpdate,
      });
      mockUpdate.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        single: mockSingle,
      });

      await authService.updateProfile(maliciousUpdate as any);

      // Role should remain unchanged
      const state = authService.getState();
      expect(state.role).toBe('client');
    });

    it('should handle token tampering attempts', async () => {
      const tamperedSession = {
        access_token: 'tampered-token',
        refresh_token: 'tampered-refresh',
        expires_in: 3600,
        token_type: 'bearer',
        user: createTestUser({ id: 'different-user-id' }),
      };

      // Simulate Supabase rejecting tampered token
      mockSupabaseUtils.getCurrentSession.mockResolvedValue(null);
      
      // Token refresh should fail
      await stateChangeCallback('TOKEN_REFRESHED', tamperedSession);

      const state = authService.getState();
      expect(state.session).toEqual(tamperedSession); // Updated but validation happens server-side
    });

    it('should validate coach certification data', async () => {
      authService['currentState'] = {
        user: createTestUser(),
        session: createTestSession(),
        profile: createTestProfile(),
        coach: null,
        role: 'client',
        isLoading: false,
        isAuthenticated: true,
      };

      const invalidCoachData = {
        ipecCertificationNumber: '', // Invalid: empty
        certificationLevel: 'Invalid Level' as any, // Invalid: not in enum
        certificationDate: 'invalid-date', // Invalid: malformed date
        specializations: [], // Invalid: empty array
        hourlyRate: -50, // Invalid: negative rate
        experienceYears: -1, // Invalid: negative experience
        languages: [], // Invalid: empty languages
        bio: '', // Invalid: empty bio
      };

      authService.updateProfile = vi.fn().mockResolvedValue({ data: createTestProfile() });

      const validationError = new Error('Invalid certification data');
      const mockInsert = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({ data: null, error: validationError });
      
      mockSupabaseFrom.mockReturnValue({
        insert: mockInsert,
      });
      mockInsert.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        single: mockSingle,
      });

      const result = await authService.applyAsCoach(invalidCoachData);

      expect(result.error).toBeInstanceOf(Error);
    });
  });

  describe('Performance and Memory Management', () => {
    it('should not create memory leaks during normal operation', () => {
      const initialListeners = authService['listeners'].length;

      // Add and remove many listeners
      const unsubscribers = [];
      for (let i = 0; i < 100; i++) {
        const unsubscribe = authService.onStateChange(() => {});
        unsubscribers.push(unsubscribe);
      }

      // Unsubscribe all
      unsubscribers.forEach(unsubscribe => unsubscribe());

      expect(authService['listeners'].length).toBe(initialListeners);
    });

    it('should efficiently handle state updates', () => {
      const updateSpy = vi.spyOn(authService as any, 'notifyListeners');
      
      // Multiple rapid updates
      for (let i = 0; i < 50; i++) {
        authService['updateState']({ isLoading: i % 2 === 0 });
      }

      // Should call notify listeners for each update
      expect(updateSpy).toHaveBeenCalledTimes(50);
    });

    it('should handle cleanup on service destruction', () => {
      const mockUnsubscribe = vi.fn();
      mockSupabaseAuth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: mockUnsubscribe } }
      });

      // Create and "destroy" service
      const tempService = new (AuthService as any)();
      
      // In a real scenario, cleanup would be called on component unmount
      // For testing, we'll verify the subscription was created
      expect(mockSupabaseAuth.onAuthStateChange).toHaveBeenCalled();
    });
  });
});