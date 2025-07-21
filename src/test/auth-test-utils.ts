/**
 * Authentication Testing Utilities
 * 
 * Comprehensive test utilities and mock factories for authentication testing
 * across unit, integration, and E2E tests. Provides consistent test data,
 * mock implementations, and testing helpers for all authentication scenarios.
 */

import { vi } from 'vitest';
import type { 
  SupabaseAuthUser, 
  SupabaseAuthSession, 
  Profile, 
  ProfileInsert, 
  Coach,
  CoachInsert,
  UserRole 
} from '../types/database';
import type { AuthState, SignUpData, SignInData, CoachApplicationData } from '../services/auth.service';

// Test data generation utilities
export class AuthTestDataFactory {
  /**
   * Generate realistic test user data with customizable properties
   */
  static createUser(overrides: Partial<SupabaseAuthUser> = {}): SupabaseAuthUser {
    const baseUser: SupabaseAuthUser = {
      id: `user-${Math.random().toString(36).substr(2, 9)}`,
      email: `test.user${Math.random().toString(36).substr(2, 5)}@example.com`,
      email_confirmed_at: new Date().toISOString(),
      phone: null,
      confirmed_at: new Date().toISOString(),
      last_sign_in_at: new Date().toISOString(),
      app_metadata: {
        provider: 'email',
        providers: ['email'],
      },
      user_metadata: {
        full_name: 'Test User',
        role: 'client',
      },
      aud: 'authenticated',
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
      updated_at: new Date().toISOString(),
      is_anonymous: false,
      ...overrides,
    };
    return baseUser;
  }

  /**
   * Generate profile data matching user data
   */
  static createProfile(userId?: string, overrides: Partial<Profile> = {}): Profile {
    const id = userId || `user-${Math.random().toString(36).substr(2, 9)}`;
    const baseProfile: Profile = {
      id,
      full_name: 'Test User',
      phone: '+1-555-0123',
      timezone: 'America/New_York',
      bio: 'A dedicated professional seeking personal growth.',
      avatar_url: null,
      location: 'New York, NY',
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
      ...overrides,
    };
    return baseProfile;
  }

  /**
   * Generate coach data with iPEC certification details
   */
  static createCoach(userId?: string, overrides: Partial<Coach> = {}): Coach {
    const id = userId || `user-${Math.random().toString(36).substr(2, 9)}`;
    const baseCoach: Coach = {
      id,
      ipec_certification_number: `IPEC-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
      certification_level: 'Professional',
      certification_date: '2020-06-15',
      specializations: ['Life Coaching', 'Career Coaching', 'Leadership Development'],
      hourly_rate: 150,
      experience_years: 5,
      languages: ['English', 'Spanish'],
      bio: 'Certified iPEC coach with 5+ years of experience helping clients achieve their goals.',
      is_active: true,
      rating: 4.8,
      total_sessions: 247,
      created_at: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(), // 6 months ago
      updated_at: new Date().toISOString(),
      ...overrides,
    };
    return baseCoach;
  }

  /**
   * Generate session data for authenticated users
   */
  static createSession(user?: SupabaseAuthUser, overrides: Partial<SupabaseAuthSession> = {}): SupabaseAuthSession {
    const sessionUser = user || this.createUser();
    const baseSession: SupabaseAuthSession = {
      access_token: `jwt.${Math.random().toString(36).substr(2, 32)}.signature`,
      refresh_token: `rt_${Math.random().toString(36).substr(2, 40)}`,
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      token_type: 'bearer',
      user: sessionUser,
      ...overrides,
    };
    return baseSession;
  }

  /**
   * Generate complete auth state for testing
   */
  static createAuthState(
    role: UserRole = 'client',
    isAuthenticated: boolean = true,
    overrides: Partial<AuthState> = {}
  ): AuthState {
    if (!isAuthenticated) {
      return {
        user: null,
        session: null,
        profile: null,
        coach: null,
        role: null,
        isLoading: false,
        isAuthenticated: false,
        ...overrides,
      };
    }

    const user = this.createUser();
    const profile = this.createProfile(user.id);
    const coach = role === 'coach' ? this.createCoach(user.id) : null;
    const session = this.createSession(user);

    return {
      user,
      session,
      profile,
      coach,
      role,
      isLoading: false,
      isAuthenticated: true,
      ...overrides,
    };
  }

  /**
   * Generate sign up data with validation
   */
  static createSignUpData(overrides: Partial<SignUpData> = {}): SignUpData {
    return {
      email: `test.user${Math.random().toString(36).substr(2, 5)}@example.com`,
      password: 'SecurePassword123!',
      fullName: 'Test User',
      role: 'client',
      phone: '+1-555-0123',
      timezone: 'America/New_York',
      ...overrides,
    };
  }

  /**
   * Generate sign in data
   */
  static createSignInData(overrides: Partial<SignInData> = {}): SignInData {
    return {
      email: 'test.user@example.com',
      password: 'SecurePassword123!',
      ...overrides,
    };
  }

  /**
   * Generate coach application data
   */
  static createCoachApplicationData(overrides: Partial<CoachApplicationData> = {}): CoachApplicationData {
    return {
      ipecCertificationNumber: `IPEC-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
      certificationLevel: 'Professional',
      certificationDate: '2020-06-15',
      specializations: ['Life Coaching', 'Career Coaching'],
      hourlyRate: 150,
      experienceYears: 5,
      languages: ['English'],
      bio: 'Experienced iPEC certified coach passionate about helping others achieve their potential.',
      ...overrides,
    };
  }

  /**
   * Generate invalid data for negative testing
   */
  static createInvalidSignUpData(): Partial<SignUpData>[] {
    return [
      { email: 'invalid-email' }, // Invalid email format
      { email: '', password: 'password' }, // Empty email
      { email: 'test@example.com', password: '123' }, // Weak password
      { email: 'test@example.com', password: '', fullName: 'Test' }, // Empty password
      { email: 'test@example.com', password: 'password', fullName: '' }, // Empty name
      { email: 'test@example.com', password: 'password', fullName: 'Test', role: 'invalid' as any }, // Invalid role
    ];
  }
}

// Mock implementations for testing
export class AuthTestMocks {
  /**
   * Create comprehensive Supabase auth mock
   */
  static createSupabaseAuthMock() {
    return {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
      onAuthStateChange: vi.fn(),
      verifyOtp: vi.fn(),
      getUser: vi.fn(),
      getSession: vi.fn(),
      refreshSession: vi.fn(),
      setSession: vi.fn(),
    };
  }

  /**
   * Create Supabase database client mock
   */
  static createSupabaseFromMock() {
    const createQueryMock = () => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      like: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      contains: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn(),
      maybeSingle: vi.fn(),
    });

    return vi.fn(() => createQueryMock());
  }

  /**
   * Create auth state change callback mock
   */
  static createAuthStateChangeMock() {
    let callback: ((event: string, session: any) => void) | null = null;
    
    const mock = vi.fn((cb) => {
      callback = cb;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    return {
      mock,
      triggerAuthStateChange: (event: string, session: any) => {
        if (callback) {
          callback(event, session);
        }
      },
    };
  }

  /**
   * Setup comprehensive mocks for auth service testing
   */
  static setupAuthServiceMocks() {
    const authMock = this.createSupabaseAuthMock();
    const fromMock = this.createSupabaseFromMock();
    const { mock: authStateChangeMock, triggerAuthStateChange } = this.createAuthStateChangeMock();
    
    authMock.onAuthStateChange.mockImplementation(authStateChangeMock);

    const supabaseUtilsMock = {
      getCurrentSession: vi.fn(),
      getCurrentUser: vi.fn(),
    };

    const handleSupabaseErrorMock = vi.fn((error) => {
      if (error?.name === 'SupabaseError') return error;
      return new Error(error?.message || 'Unknown error');
    });

    return {
      supabaseAuth: authMock,
      supabaseFrom: fromMock,
      supabaseUtils: supabaseUtilsMock,
      handleSupabaseError: handleSupabaseErrorMock,
      triggerAuthStateChange,
    };
  }
}

// Testing helpers for common scenarios
export class AuthTestHelpers {
  /**
   * Wait for auth state to update
   */
  static async waitForAuthState(
    authService: any,
    predicate: (state: AuthState) => boolean,
    timeout: number = 5000
  ): Promise<AuthState> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Auth state condition not met within ${timeout}ms`));
      }, timeout);

      const unsubscribe = authService.onStateChange((state: AuthState) => {
        if (predicate(state)) {
          clearTimeout(timeoutId);
          unsubscribe();
          resolve(state);
        }
      });
    });
  }

  /**
   * Simulate network delay for async operations
   */
  static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Assert authentication state properties
   */
  static assertAuthState(
    state: AuthState,
    expected: Partial<AuthState>,
    message?: string
  ) {
    const prefix = message ? `${message}: ` : '';
    
    if (expected.isAuthenticated !== undefined) {
      expect(state.isAuthenticated, `${prefix}isAuthenticated mismatch`).toBe(expected.isAuthenticated);
    }
    if (expected.isLoading !== undefined) {
      expect(state.isLoading, `${prefix}isLoading mismatch`).toBe(expected.isLoading);
    }
    if (expected.role !== undefined) {
      expect(state.role, `${prefix}role mismatch`).toBe(expected.role);
    }
    if (expected.user !== undefined) {
      if (expected.user === null) {
        expect(state.user, `${prefix}user should be null`).toBeNull();
      } else {
        expect(state.user, `${prefix}user should exist`).toBeTruthy();
        expect(state.user?.id, `${prefix}user ID mismatch`).toBe(expected.user.id);
      }
    }
  }

  /**
   * Create test environment for authentication flows
   */
  static createTestEnvironment() {
    const mocks = AuthTestMocks.setupAuthServiceMocks();
    const factory = AuthTestDataFactory;
    const originalLocation = window.location;

    // Mock window.location
    delete (window as any).location;
    window.location = {
      ...originalLocation,
      origin: 'http://localhost:3000',
      href: 'http://localhost:3000/',
    } as Location;

    return {
      mocks,
      factory,
      cleanup: () => {
        window.location = originalLocation;
        vi.clearAllMocks();
      },
    };
  }

  /**
   * Validate error handling scenarios
   */
  static async testErrorScenario(
    operation: () => Promise<any>,
    expectedErrorMessage: string | RegExp,
    description: string
  ) {
    try {
      const result = await operation();
      if (result.error) {
        if (typeof expectedErrorMessage === 'string') {
          expect(result.error.message).toBe(expectedErrorMessage);
        } else {
          expect(result.error.message).toMatch(expectedErrorMessage);
        }
      } else {
        throw new Error(`Expected error in ${description} but operation succeeded`);
      }
    } catch (error) {
      if (typeof expectedErrorMessage === 'string') {
        expect((error as Error).message).toBe(expectedErrorMessage);
      } else {
        expect((error as Error).message).toMatch(expectedErrorMessage);
      }
    }
  }

  /**
   * Generate performance test data
   */
  static generatePerformanceTestData(count: number) {
    const users: SupabaseAuthUser[] = [];
    const profiles: Profile[] = [];
    const coaches: Coach[] = [];

    for (let i = 0; i < count; i++) {
      const user = AuthTestDataFactory.createUser({ 
        email: `perf.test.${i}@example.com`,
        user_metadata: { full_name: `Performance Test User ${i}` }
      });
      users.push(user);
      
      profiles.push(AuthTestDataFactory.createProfile(user.id, {
        full_name: `Performance Test User ${i}`
      }));

      if (i % 3 === 0) { // Every third user is a coach
        coaches.push(AuthTestDataFactory.createCoach(user.id));
      }
    }

    return { users, profiles, coaches };
  }

  /**
   * Validate security requirements
   */
  static validateSecurityRequirements(authService: any) {
    const state = authService.getState();
    
    // Ensure sensitive data is not exposed
    expect(state.session?.access_token).toBeDefined();
    expect(state.session?.refresh_token).toBeDefined();
    
    // Validate permission boundaries
    if (state.role === 'client') {
      expect(authService.hasPermission('canAccessAdminPanel')).toBe(false);
      expect(authService.hasPermission('canModerateContent')).toBe(false);
    }
    
    if (state.role === 'coach' && state.coach?.is_active === false) {
      expect(authService.hasPermission('canCreateSessions')).toBe(false);
    }
  }
}

// Test constants for consistent testing
export const AUTH_TEST_CONSTANTS = {
  TIMEOUTS: {
    FAST: 100,
    NORMAL: 1000,
    SLOW: 5000,
  },
  
  VALID_PASSWORDS: [
    'SecurePassword123!',
    'MyP@ssw0rd2024',
    'Test!ng1234567',
  ],
  
  INVALID_PASSWORDS: [
    '123',          // Too short
    'password',     // No numbers/symbols
    'PASSWORD',     // No lowercase
    '12345678',     // No letters
  ],
  
  VALID_EMAILS: [
    'test@example.com',
    'user.name@domain.co.uk',
    'valid+email@test-domain.org',
  ],
  
  INVALID_EMAILS: [
    'invalid-email',
    '@domain.com',
    'user@',
    '',
  ],
  
  CERTIFICATION_LEVELS: ['Associate', 'Professional', 'Master'] as const,
  
  SPECIALIZATIONS: [
    'Life Coaching',
    'Career Coaching',
    'Leadership Development',
    'Executive Coaching',
    'Relationship Coaching',
    'Health & Wellness Coaching',
  ],
  
  LANGUAGES: ['English', 'Spanish', 'French', 'German', 'Mandarin', 'Japanese'],
  
  TIMEZONES: [
    'America/New_York',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Asia/Tokyo',
    'Australia/Sydney',
  ],
};

export default {
  AuthTestDataFactory,
  AuthTestMocks,
  AuthTestHelpers,
  AUTH_TEST_CONSTANTS,
};