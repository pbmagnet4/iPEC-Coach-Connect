/**
 * Authentication Service for iPEC Coach Connect
 * 
 * Comprehensive authentication service built on Supabase Auth with:
 * - Email/password authentication
 * - Google OAuth integration
 * - Session management
 * - Profile creation and management
 * - Password reset functionality
 * - Real-time auth state monitoring
 * - Error handling and validation
 */

import { handleSupabaseError, supabase, SupabaseError, supabaseUtils } from '../lib/supabase';
import { logAuth, logPerformance, logSecurity } from '../lib/secure-logger';
import { 
  addAdminOverride, 
  addVerifiedUser, 
  checkRateLimit,
  getRateLimitStatus,
  recordAuthAttempt,
  unlockAccount
} from '../lib/rate-limiter-enhanced';
import { clearCSRFTokens, generateOAuthState } from '../lib/csrf-protection';
import { clearAllSecureData, getSecureData, removeSecureData, setSecureData } from '../lib/secure-session';
import { 
  createSecureSession, 
  getConcurrentSessions, 
  invalidateAllOtherSessions, 
  invalidateSession, 
  refreshSession,
  type SecureSessionData,
  sessionSecurity,
  type SessionValidationResult,
  validateSession 
} from '../lib/session-security';
import { mfaService } from './mfa.service';
import type { MFASettings } from './mfa.service';
import { cacheUtils, userProfileCache } from '../lib/cache';
import { memoryManager } from '../lib/memory-manager';
import type { 
  Coach, 
  CoachInsert, 
  Profile, 
  ProfileInsert, 
  ProfileUpdate,
  SupabaseAuthSession,
  SupabaseAuthUser,
  UserRole 
} from '../types/database';

// Auth state interface
export interface AuthState {
  user: SupabaseAuthUser | null;
  session: SupabaseAuthSession | null;
  profile: Profile | null;
  coach: Coach | null;
  role: UserRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  secureSession: SecureSessionData | null;
  sessionValidation: SessionValidationResult | null;
  concurrentSessions: number;
  sessionExpiresAt: number | null;
  requiresRefresh: boolean;
  mfaSettings: MFASettings | null;
  requiresMFA: boolean;
  mfaVerified: boolean;
}

// Auth operation result types
export interface AuthResult<T = any> {
  data?: T;
  error?: SupabaseError;
}

export interface SignUpData {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  phone?: string;
  timezone?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface ResetPasswordData {
  email: string;
}

export interface UpdatePasswordData {
  password: string;
  newPassword: string;
}

export interface CoachApplicationData {
  ipecCertificationNumber: string;
  certificationLevel: 'Associate' | 'Professional' | 'Master';
  certificationDate: string;
  specializations: string[];
  hourlyRate: number;
  experienceYears: number;
  languages: string[];
  bio: string;
}

class AuthService {
  private listeners: ((state: AuthState) => void)[] = [];
  private currentState: AuthState = {
    user: null,
    session: null,
    profile: null,
    coach: null,
    role: null,
    isLoading: true,
    isAuthenticated: false,
    secureSession: null,
    sessionValidation: null,
    concurrentSessions: 0,
    sessionExpiresAt: null,
    requiresRefresh: false,
    mfaSettings: null,
    requiresMFA: false,
    mfaVerified: false,
  };

  // Memory management
  private supabaseAuthSubscription: (() => void) | null = null;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private sessionValidationInterval: NodeJS.Timeout | null = null;
  private isDestroyed = false;

  constructor() {
  void his.initializeAuth();
  void his.setupSecureSessionCleanup();
  void his.setupSessionValidation();
  }

  /**
   * Initialize authentication monitoring
   */
  private async initializeAuth() {
    try {
      // Get initial session
      const session = await supabaseUtils.getCurrentSession();
      if (session?.user) {
        await this.loadUserData(session.user);
      } else {
  void his.updateState({ isLoading: false });
      }

      // Monitor auth state changes with memory management
      const { data: authSubscription } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (this.isDestroyed) return; // Skip if service is destroyed

        logAuth(event, !!session?.user, { sessionId: session?.access_token ? '[TOKEN_PRESENT]' : 'no_token' });

        if (event === 'SIGNED_IN' && session?.user) {
          await this.loadUserData(session.user);
          // Check if MFA is required after successful login
          await this.checkMFARequirement(session.user);
        } else if (event === 'SIGNED_OUT') {
          // Clear cache and secure session data on sign out
          const currentUser = this.currentState.user;
          const currentSecureSession = this.currentState.secureSession;
          
          if (currentUser) {
  void his.invalidateUserCache(currentUser.id);
          }
          
          // Invalidate secure session
          if (currentSecureSession) {
            try {
              await invalidateSession(currentSecureSession.sessionId, 'user_logout');
            } catch (error) {
              logSecurity('Failed to invalidate secure session on logout', 'medium', {
                userId: currentUser?.id,
                error: error instanceof Error ? error.message : 'Unknown error'
              });
            }
          }
          
          await this.clearSecureAuthData();
          
          this.updateState({
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
          });
        } else if (event === 'TOKEN_REFRESHED' && session) {
          // Refresh secure session as well
          const currentSecureSession = this.currentState.secureSession;
          if (currentSecureSession) {
            try {
              const refreshedSecureSession = await refreshSession(currentSecureSession.sessionId);
              this.updateState({ 
                session, 
                secureSession: refreshedSecureSession,
                sessionExpiresAt: refreshedSecureSession.expiresAt,
                requiresRefresh: false
              });
            } catch (error) {
              logSecurity('Failed to refresh secure session', 'medium', {
                userId: this.currentState.user?.id,
                error: error instanceof Error ? error.message : 'Unknown error'
              });
  void his.updateState({ session });
            }
          } else {
  void his.updateState({ session });
          }
        }
      });

      // Register subscription with memory manager
      this.supabaseAuthSubscription = authSubscription.subscription.unsubscribe;
      memoryManager.registerSubscription(
        'auth_service_supabase',
        authSubscription.subscription,
        this
      );
    } catch (error) {
  void console.error('Failed to initialize auth:', error);
  void his.updateState({ isLoading: false });
    }
  }

  /**
   * Load user profile and coach data with ultra-optimized single query
   * Features: Specific field selection, enhanced caching, performance monitoring
   */
  private async loadUserData(user: SupabaseAuthUser) {
    try {
  void his.updateState({ user, isLoading: true });

      // Enhanced cache strategy with multiple cache levels
      const cacheKey = cacheUtils.getUserProfileKey(user.id);
      const sessionCacheKey = `${cacheKey}_session`;
      
      // Check L1 cache (session-level, faster)
      let profileWithCoach = userProfileCache.get(sessionCacheKey);
      let cacheLevel = 'none';
      
      if (!profileWithCoach) {
        // Check L2 cache (persistent, longer TTL)
        profileWithCoach = userProfileCache.get(cacheKey);
        cacheLevel = profileWithCoach ? 'L2' : 'none';
      } else {
        cacheLevel = 'L1';
      }
      
      if (!profileWithCoach) {
        // Cache miss - execute ultra-optimized database query
        const startTime = performance.now();
        
        // Ultra-optimized query with specific field selection
        const { data, error: profileError } = await supabase
          .from('profiles')
          .select(`
            id,
            full_name,
            email,
            phone,
            avatar_url,
            bio,
            timezone,
            is_active,
            created_at,
            updated_at,
            coaches (
              id,
              ipec_certification_number,
              certification_level,
              certification_date,
              specializations,
              hourly_rate,
              experience_years,
              languages,
              is_active,
              is_verified,
              average_rating,
              total_sessions,
              created_at,
              updated_at
            )
          `)
          .eq('id', user.id)
          .single();
        
        const queryTime = performance.now() - startTime;
        
        // Enhanced performance logging with query plan insights
        logPerformance('loadUserData ultra-optimized query', queryTime, {
          userId: user.id,
          optimizedQuery: true,
          specificFields: true,
          cacheHit: false,
          cacheLevel: 'none',
          queryComplexity: 'low',
          indexUsed: true, // Assumes primary key index
          connectionPooled: true
        });
        
        // Enhanced error handling with granular error types
        if (profileError) {
          if (profileError.code === 'PGRST116') {
            // No profile found - this is expected for new users
            logPerformance('loadUserData no profile found', queryTime, {
              userId: user.id,
              newUser: true
            });
          } else {
            // Log specific error types for better debugging
            logPerformance('loadUserData query error', queryTime, {
              userId: user.id,
              errorCode: profileError.code,
              errorMessage: profileError.message,
              queryFailed: true
            });
            throw handleSupabaseError(profileError);
          }
        }
        
        profileWithCoach = data;
        
        // Multi-level caching strategy for optimal performance
        if (profileWithCoach) {
          // L1 cache: Session-level (5 minutes, faster access)
  void userProfileCache.set(sessionCacheKey, profileWithCoach, 5 * 60 * 1000);
          
          // L2 cache: Persistent (30 minutes, longer retention)
  void userProfileCache.set(cacheKey, profileWithCoach, 30 * 60 * 1000);
          
          // Cache warming: Pre-populate related data if coach
          if (profileWithCoach.coaches && profileWithCoach.coaches.length > 0) {
            const coachCacheKey = `coach_${user.id}`;
  void userProfileCache.set(coachCacheKey, profileWithCoach.coaches[0], 30 * 60 * 1000);
          }
        }
      } else {
        // Cache hit - log performance metrics
        logPerformance('loadUserData cache hit', 0, {
          userId: user.id,
          cacheHit: true,
          cacheLevel,
          performanceGain: 'high'
        });
      }

      // Type-safe data extraction with enhanced validation
      let profile: Profile | null = null;
      let coach: Coach | null = null;
      let role: UserRole = 'client';

      if (profileWithCoach) {
        // Type-safe destructuring with runtime validation
        const { coaches, ...profileData } = profileWithCoach;
        
        // Validate profile data structure
        if (this.validateProfileData(profileData)) {
          profile = profileData as Profile;
        } else {
          logPerformance('loadUserData invalid profile data', 0, {
            userId: user.id,
            dataCorruption: true
          });
          // Clear corrupted cache
  void userProfileCache.delete(cacheKey);
  void userProfileCache.delete(sessionCacheKey);
        }
        
        // Type-safe coach data extraction
        if (coaches && Array.isArray(coaches) && coaches.length > 0) {
          const coachData = coaches[0];
          if (this.validateCoachData(coachData)) {
            coach = coachData as Coach;
            role = coach.is_active ? 'coach' : 'client';
          } else {
            logPerformance('loadUserData invalid coach data', 0, {
              userId: user.id,
              coachDataCorruption: true
            });
          }
        }
      }

      const session = await supabaseUtils.getCurrentSession();

      // Load MFA settings
      let mfaSettings: MFASettings | null = null;
      let requiresMFA = false;
      let mfaVerified = false;
      
      try {
        mfaSettings = await mfaService.getMFASettings(user.id);
        if (mfaSettings?.mfa_enabled) {
          requiresMFA = true;
          // Check if device is trusted to bypass MFA
          const deviceTrusted = await mfaService.isDeviceTrusted(user.id);
          mfaVerified = deviceTrusted;
        }
      } catch (error) {
        logSecurity('Failed to load MFA settings', 'medium', {
          userId: user.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
      
      // Store sensitive data securely
      await this.storeSecureAuthData({ user, profile, coach, role, mfaSettings });
      
      // Create secure session
      let secureSession: SecureSessionData | null = null;
      let sessionValidation: SessionValidationResult | null = null;
      let concurrentSessions = 0;
      let sessionExpiresAt: number | null = null;
      let requiresRefresh = false;

      try {
        if (session) {
          secureSession = await createSecureSession(user, session, {
            role: role || 'client',
            permissions: this.getUserPermissions(role, coach)
          });
          
          sessionValidation = await validateSession(secureSession.sessionId);
          concurrentSessions = (await getConcurrentSessions(user.id)).length;
          sessionExpiresAt = secureSession.expiresAt;
          requiresRefresh = sessionValidation.requiresRefresh || false;
        }
      } catch (error) {
        logSecurity('Failed to create secure session', 'medium', {
          userId: user.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
      
      this.updateState({
        user,
        session,
        profile,
        coach,
        role,
        isLoading: false,
        isAuthenticated: true,
        secureSession,
        sessionValidation,
        concurrentSessions,
        sessionExpiresAt,
        requiresRefresh,
        mfaSettings,
        requiresMFA,
        mfaVerified,
      });
    } catch (error) {
  void console.error('Failed to load user data:', error);
      this.updateState({ 
        isLoading: false,
        isAuthenticated: false 
      });
    }
  }

  /**
   * Update auth state and notify listeners
   */
  private updateState(updates: Partial<AuthState>) {
    this.currentState = { ...this.currentState, ...updates };
  void his.notifyListeners();
  }

  /**
   * Notify all state listeners
   */
  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.currentState));
  }

  /**
   * Get current auth state
   */
  public getState(): AuthState {
    return { ...this.currentState };
  }

  /**
   * Subscribe to auth state changes
   */
  public onStateChange(listener: (state: AuthState) => void): () => void {
    this.listeners.push(listener);
    
    // Immediately call with current state
    listener(this.currentState);
    
    // Return unsubscribe function with memory management
    const unsubscribe = () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };

    // Register with memory manager
  void memoryManager.registerListener('auth_service_listener', unsubscribe);
    
    return unsubscribe;
  }

  /**
   * Sign up with email and password
   */
  public async signUp(data: SignUpData): Promise<AuthResult<SupabaseAuthUser>> {
    try {
      // Check rate limiting
      const rateLimitCheck = checkRateLimit('auth.signup', data.email);
      if (!rateLimitCheck.allowed) {
        const error = new SupabaseError(
          `Too many signup attempts. Please try again ${rateLimitCheck.blockExpires ? `after ${  new Date(rateLimitCheck.blockExpires).toLocaleTimeString()}` : 'later'}.`,
          'RATE_LIMITED'
        );
        recordAuthAttempt('auth.signup', false, data.email);
        return { error };
      }

  void his.updateState({ isLoading: true });

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            role: data.role,
          },
        },
      });

      if (authError) {
        throw handleSupabaseError(authError);
      }

      if (!authData.user) {
        throw new SupabaseError('User creation failed');
      }

      // Create profile (handled by database trigger, but we can update it)
      if (authData.user) {
        const profileData: ProfileInsert = {
          id: authData.user.id,
          full_name: data.fullName,
          phone: data.phone,
          timezone: data.timezone || 'UTC',
        };

        const { error: profileError } = await supabase
          .from('profiles')
          .upsert(profileData);

        if (profileError) {
  void console.warn('Profile creation warning:', profileError);
        }
      }

      // Record successful signup
      recordAuthAttempt('auth.signup', true, data.email);
      return { data: authData.user };
    } catch (error) {
      const supabaseError = error instanceof SupabaseError 
        ? error 
        : handleSupabaseError(error);
      
      // Record failed signup attempt (unless it was a rate limit error)
      if (supabaseError.code !== 'RATE_LIMITED') {
        recordAuthAttempt('auth.signup', false, data.email);
      }
      
  void his.updateState({ isLoading: false });
      return { error: supabaseError };
    }
  }

  /**
   * Sign in with email and password
   */
  public async signIn(data: SignInData): Promise<AuthResult<SupabaseAuthUser>> {
    try {
      // Check rate limiting with enhanced options
      const rateLimitCheck = await checkRateLimit('auth.signin', {
        clientIdentifier: data.email,
        ipAddress: this.getClientIpAddress(),
        userAgent: navigator.userAgent
      });
      
      if (!rateLimitCheck.allowed) {
        const error = new SupabaseError(
          rateLimitCheck.accountLocked
            ? `Account locked due to excessive failed attempts. Please contact support.`
            : `Too many signin attempts. Please try again ${rateLimitCheck.blockExpires ? `after ${  new Date(rateLimitCheck.blockExpires).toLocaleTimeString()}` : 'later'}.`,
          rateLimitCheck.accountLocked ? 'ACCOUNT_LOCKED' : 'RATE_LIMITED'
        );
        
        await recordAuthAttempt('auth.signin', false, {
          clientIdentifier: data.email,
          ipAddress: this.getClientIpAddress(),
          userAgent: navigator.userAgent
        });
        
        return { error };
      }
      
      // Apply progressive delay if needed
      if (rateLimitCheck.delay) {
        await this.applyProgressiveDelay(rateLimitCheck.delay);
      }

  void his.updateState({ isLoading: true });

      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        throw handleSupabaseError(error);
      }

      if (!authData.user) {
        throw new SupabaseError('Sign in failed');
      }

      // Record successful signin and mark user as verified
      await recordAuthAttempt('auth.signin', true, {
        clientIdentifier: data.email,
        ipAddress: this.getClientIpAddress(),
        userId: authData.user.id,
        userAgent: navigator.userAgent
      });
      
      // Mark user as verified after successful login
      if (authData.user.email_confirmed_at) {
        addVerifiedUser(authData.user.id);
      }
      
      return { data: authData.user };
    } catch (error) {
      const supabaseError = error instanceof SupabaseError 
        ? error 
        : handleSupabaseError(error);
      
      // Record failed signin attempt (unless it was a rate limit error)
      if (supabaseError.code !== 'RATE_LIMITED' && supabaseError.code !== 'ACCOUNT_LOCKED') {
        await recordAuthAttempt('auth.signin', false, {
          clientIdentifier: data.email,
          ipAddress: this.getClientIpAddress(),
          userAgent: navigator.userAgent
        });
      }
      
  void his.updateState({ isLoading: false });
      return { error: supabaseError };
    }
  }

  /**
   * Sign in with Google OAuth
   */
  public async signInWithGoogle(): Promise<AuthResult<void>> {
    try {
      // Check rate limiting for OAuth
      const rateLimitCheck = checkRateLimit('auth.oauth');
      if (!rateLimitCheck.allowed) {
        const error = new SupabaseError(
          `Too many OAuth attempts. Please try again ${rateLimitCheck.blockExpires ? `after ${  new Date(rateLimitCheck.blockExpires).toLocaleTimeString()}` : 'later'}.`,
          'RATE_LIMITED'
        );
        recordAuthAttempt('auth.oauth', false);
        return { error };
      }

  void his.updateState({ isLoading: true });

      // Generate CSRF-protected state parameter
      const state = generateOAuthState('/dashboard');
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            state
          }
        },
      });

      if (error) {
        throw handleSupabaseError(error);
      }

      return { data: undefined };
    } catch (error) {
      const supabaseError = error instanceof SupabaseError 
        ? error 
        : handleSupabaseError(error);
      
  void his.updateState({ isLoading: false });
      return { error: supabaseError };
    }
  }

  /**
   * Sign out
   */
  public async signOut(): Promise<AuthResult<void>> {
    try {
  void his.updateState({ isLoading: true });

      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw handleSupabaseError(error);
      }

      // Clear CSRF tokens on successful sign out
      clearCSRFTokens();
      
      return { data: undefined };
    } catch (error) {
      const supabaseError = error instanceof SupabaseError 
        ? error 
        : handleSupabaseError(error);
      
      return { error: supabaseError };
    }
  }

  /**
   * Request password reset
   */
  public async resetPassword(data: ResetPasswordData): Promise<AuthResult<void>> {
    try {
      // Check rate limiting for password reset
      const rateLimitCheck = checkRateLimit('auth.password_reset', data.email);
      if (!rateLimitCheck.allowed) {
        const error = new SupabaseError(
          `Too many password reset attempts. Please try again ${rateLimitCheck.blockExpires ? `after ${  new Date(rateLimitCheck.blockExpires).toLocaleTimeString()}` : 'later'}.`,
          'RATE_LIMITED'
        );
        recordAuthAttempt('auth.password_reset', false, data.email);
        return { error };
      }

      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        await recordAuthAttempt('auth.password_reset', false, {
          clientIdentifier: data.email,
          ipAddress: this.getClientIpAddress(),
          userAgent: navigator.userAgent
        });
        throw handleSupabaseError(error);
      }

      // Record successful password reset request
      recordAuthAttempt('auth.password_reset', true, data.email);
      return { data: undefined };
    } catch (error) {
      const supabaseError = error instanceof SupabaseError 
        ? error 
        : handleSupabaseError(error);
      
      // Record failed password reset attempt if not already recorded
      if (supabaseError.code !== 'RATE_LIMITED') {
        recordAuthAttempt('auth.password_reset', false, data.email);
      }
      
      return { error: supabaseError };
    }
  }

  /**
   * Update password
   */
  public async updatePassword(data: UpdatePasswordData): Promise<AuthResult<void>> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.newPassword,
      });

      if (error) {
        throw handleSupabaseError(error);
      }

      return { data: undefined };
    } catch (error) {
      const supabaseError = error instanceof SupabaseError 
        ? error 
        : handleSupabaseError(error);
      
      return { error: supabaseError };
    }
  }

  /**
   * Update user profile
   */
  public async updateProfile(updates: ProfileUpdate): Promise<AuthResult<Profile>> {
    try {
      const { user } = this.currentState;
      if (!user) {
        throw new SupabaseError('User not authenticated');
      }

      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        throw handleSupabaseError(error);
      }

      // Invalidate all cache levels since profile was updated
  void his.invalidateUserCache(user.id);
      
      // Update local state
  void his.updateState({ profile: data });

      return { data };
    } catch (error) {
      const supabaseError = error instanceof SupabaseError 
        ? error 
        : handleSupabaseError(error);
      
      return { error: supabaseError };
    }
  }

  /**
   * Apply to become a coach
   */
  public async applyAsCoach(data: CoachApplicationData): Promise<AuthResult<Coach>> {
    try {
      const { user, profile } = this.currentState;
      if (!user || !profile) {
        throw new SupabaseError('User not authenticated');
      }

      // Update profile with bio
      await this.updateProfile({ bio: data.bio });

      // Create coach record
      const coachData: CoachInsert = {
        id: user.id,
        ipec_certification_number: data.ipecCertificationNumber,
        certification_level: data.certificationLevel,
        certification_date: data.certificationDate,
        specializations: data.specializations,
        hourly_rate: data.hourlyRate,
        experience_years: data.experienceYears,
        languages: data.languages,
        is_active: false, // Requires verification
      };

      const { data: coach, error } = await supabase
        .from('coaches')
        .insert(coachData)
        .select()
        .single();

      if (error) {
        throw handleSupabaseError(error);
      }

      // Invalidate all cache levels since user became a coach (major role change)
  void his.invalidateUserCache(user.id);
      
      // Update local state
      this.updateState({ 
        coach,
        role: 'coach' 
      });

      return { data: coach };
    } catch (error) {
      const supabaseError = error instanceof SupabaseError 
        ? error 
        : handleSupabaseError(error);
      
      return { error: supabaseError };
    }
  }

  /**
   * Check if user has required permissions
   */
  public hasPermission(permission: keyof import('../types/database').UserPermissions): boolean {
    const { role, coach } = this.currentState;
    
    switch (permission) {
      case 'canCreateSessions':
        return role === 'coach' && coach?.is_active === true;
      case 'canManageCoachProfile':
        return role === 'coach';
      case 'canAccessAdminPanel':
        return role === 'admin';
      case 'canModerateContent':
        return role === 'admin' || role === 'coach';
      case 'canViewAnalytics':
        return role === 'coach' || role === 'admin';
      default:
        return false;
    }
  }

  /**
   * Refresh current user data
   */
  public async refreshUserData(): Promise<AuthResult<void>> {
    try {
      const { user } = this.currentState;
      if (!user) {
        throw new SupabaseError('User not authenticated');
      }

      await this.loadUserData(user);
      return { data: undefined };
    } catch (error) {
      const supabaseError = error instanceof SupabaseError 
        ? error 
        : handleSupabaseError(error);
      
      return { error: supabaseError };
    }
  }

  /**
   * Verify email address
   */
  public async verifyEmail(token: string, type: string): Promise<AuthResult<void>> {
    try {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: type as any,
      });

      if (error) {
        throw handleSupabaseError(error);
      }

      return { data: undefined };
    } catch (error) {
      const supabaseError = error instanceof SupabaseError 
        ? error 
        : handleSupabaseError(error);
      
      return { error: supabaseError };
    }
  }

  /**
   * Check MFA requirement after login
   */
  private async checkMFARequirement(user: SupabaseAuthUser): Promise<void> {
    try {
      const mfaSettings = await mfaService.getMFASettings(user.id);
      if (mfaSettings?.mfa_enabled) {
        const deviceTrusted = await mfaService.isDeviceTrusted(user.id);
        
        this.updateState({
          mfaSettings,
          requiresMFA: true,
          mfaVerified: deviceTrusted
        });
        
        if (!deviceTrusted) {
          logAuth('MFA verification required', true, {
            userId: user.id,
            deviceTrusted: false
          });
        }
      }
    } catch (error) {
      logSecurity('MFA requirement check failed', 'medium', {
        userId: user.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Verify MFA code and complete authentication
   */
  public async verifyMFA(code: string, trustDevice?: boolean): Promise<AuthResult<void>> {
    try {
      const { user } = this.currentState;
      if (!user) {
        throw new SupabaseError('User not authenticated');
      }
      
      const result = await mfaService.verifyMFALogin(user.id, code);
      
      if (result.success) {
        // Handle device trust if requested
        if (trustDevice && result.requiresDeviceTrust) {
          try {
            await mfaService.trustDevice(user.id, 'Current Device');
          } catch (trustError) {
            // Continue even if device trust fails
  void console.warn('Device trust failed:', trustError);
          }
        }
        
        this.updateState({
          mfaVerified: true,
          requiresMFA: false
        });
        
        logAuth('MFA verification successful', true, {
          userId: user.id
        });
        
        return { data: undefined };
      } else {
        throw new SupabaseError('Invalid MFA code');
      }
    } catch (error) {
      const supabaseError = error instanceof SupabaseError 
        ? error 
        : handleSupabaseError(error);
      
      logAuth('MFA verification failed', false, {
        userId: this.currentState.user?.id,
        error: supabaseError.message
      });
      
      return { error: supabaseError };
    }
  }

  /**
   * Get MFA settings for current user
   */
  public async getMFASettings(): Promise<AuthResult<MFASettings>> {
    try {
      const { user } = this.currentState;
      if (!user) {
        throw new SupabaseError('User not authenticated');
      }
      
      const mfaSettings = await mfaService.getMFASettings(user.id);
      
      if (mfaSettings) {
  void his.updateState({ mfaSettings });
        return { data: mfaSettings };
      } else {
        throw new SupabaseError('MFA settings not found');
      }
    } catch (error) {
      const supabaseError = error instanceof SupabaseError 
        ? error 
        : handleSupabaseError(error);
      
      return { error: supabaseError };
    }
  }

  /**
   * Initialize MFA setup
   */
  public async initializeMFA(): Promise<AuthResult<any>> {
    try {
      const { user } = this.currentState;
      if (!user) {
        throw new SupabaseError('User not authenticated');
      }
      
      const enrollmentData = await mfaService.initializeMFA(user.id);
      
      return { data: enrollmentData };
    } catch (error) {
      const supabaseError = error instanceof SupabaseError 
        ? error 
        : handleSupabaseError(error);
      
      return { error: supabaseError };
    }
  }

  /**
   * Complete MFA enrollment
   */
  public async completeMFAEnrollment(code: string, deviceName?: string): Promise<AuthResult<void>> {
    try {
      const { user } = this.currentState;
      if (!user) {
        throw new SupabaseError('User not authenticated');
      }
      
      const result = await mfaService.verifyAndEnableMFA(user.id, code, deviceName);
      
      if (result.success) {
        // Reload MFA settings
        const mfaSettings = await mfaService.getMFASettings(user.id);
        this.updateState({ 
          mfaSettings,
          requiresMFA: true,
          mfaVerified: true
        });
        
        return { data: undefined };
      } else {
        throw new SupabaseError('Invalid verification code');
      }
    } catch (error) {
      const supabaseError = error instanceof SupabaseError 
        ? error 
        : handleSupabaseError(error);
      
      return { error: supabaseError };
    }
  }

  /**
   * Disable MFA
   */
  public async disableMFA(verificationCode: string): Promise<AuthResult<void>> {
    try {
      const { user } = this.currentState;
      if (!user) {
        throw new SupabaseError('User not authenticated');
      }
      
      await mfaService.disableMFA(user.id, verificationCode);
      
      this.updateState({
        mfaSettings: null,
        requiresMFA: false,
        mfaVerified: false
      });
      
      return { data: undefined };
    } catch (error) {
      const supabaseError = error instanceof SupabaseError 
        ? error 
        : handleSupabaseError(error);
      
      return { error: supabaseError };
    }
  }

  /**
   * Store sensitive auth data securely
   */
  private async storeSecureAuthData(data: {
    user: SupabaseAuthUser;
    profile: Profile | null;
    coach: Coach | null;
    role: UserRole | null;
    mfaSettings?: MFASettings | null;
  }): Promise<void> {
    try {
      // Store sensitive user data with encryption
      await setSecureData('auth_user_data', {
        userId: data.user.id,
        email: data.user.email,
        profileId: data.profile?.id,
        role: data.role,
        lastLogin: new Date().toISOString(),
        permissions: this.getUserPermissions(data.role, data.coach),
        mfaEnabled: data.mfaSettings?.mfa_enabled || false
      });

      logSecurity('Secure auth data stored', 'low', {
        userId: data.user.id,
        role: data.role,
        hasProfile: !!data.profile,
        hasCoach: !!data.coach
      });
    } catch (error) {
      logSecurity('Failed to store secure auth data', 'medium', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: data.user.id
      });
    }
  }

  /**
   * Retrieve secure auth data
   */
  private async getSecureAuthData(): Promise<any> {
    try {
      return await getSecureData('auth_user_data');
    } catch (error) {
      logSecurity('Failed to retrieve secure auth data', 'medium', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  /**
   * Clear secure auth data
   */
  private async clearSecureAuthData(): Promise<void> {
    try {
      await removeSecureData('auth_user_data');
      logSecurity('Secure auth data cleared', 'low');
    } catch (error) {
      logSecurity('Failed to clear secure auth data', 'low', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get user permissions for secure storage
   */
  private getUserPermissions(role: UserRole | null, coach: Coach | null): string[] {
    const permissions: string[] = [];
    
    if (role === 'coach' && coach?.is_active) {
  void permissions.push('canCreateSessions', 'canManageCoachProfile', 'canViewAnalytics');
    }
    if (role === 'admin') {
  void permissions.push('canAccessAdminPanel', 'canModerateContent', 'canViewAnalytics');
    }
    if (role === 'coach') {
  void permissions.push('canManageCoachProfile', 'canModerateContent');
    }
    
    return permissions;
  }

  /**
   * Get client IP address (best effort)
   */
  private getClientIpAddress(): string | undefined {
    // In a real production environment, this would come from the server
    // For now, we'll use a placeholder that could be replaced with a real IP
    // from headers like X-Forwarded-For, X-Real-IP, etc.
    return undefined; // Will trigger browser fingerprinting fallback
  }
  
  /**
   * Apply progressive delay to slow down brute force attempts
   */
  private async applyProgressiveDelay(delayMs: number): Promise<void> {
    if (delayMs > 0) {
      logSecurity('Applying progressive delay', 'low', {
        delayMs,
        delaySeconds: (delayMs / 1000).toFixed(1)
      });
      
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  /**
   * Get rate limit status for a user
   */
  public async getRateLimitInfo(email: string): Promise<any> {
    const {user} = this.currentState;
    
    return getRateLimitStatus('auth.signin', {
      clientIdentifier: email,
      ipAddress: this.getClientIpAddress(),
      userId: user?.id,
      userAgent: navigator.userAgent
    });
  }
  
  /**
   * Unlock a user account (admin function)
   */
  public async unlockUserAccount(userId: string): Promise<AuthResult<void>> {
    try {
      // Check if current user has admin permissions
      if (!this.hasPermission('canAccessAdminPanel')) {
        throw new SupabaseError('Unauthorized: Admin access required', 'UNAUTHORIZED');
      }
      
      await unlockAccount(userId);
      
      logSecurity('Admin unlocked user account', 'medium', {
        adminId: this.currentState.user?.id,
        unlockedUserId: userId
      });
      
      return { data: undefined };
    } catch (error) {
      const supabaseError = error instanceof SupabaseError 
        ? error 
        : handleSupabaseError(error);
      
      return { error: supabaseError };
    }
  }
  
  /**
   * Setup secure session cleanup
   */
  private setupSecureSessionCleanup(): void {
    // Clean up expired secure sessions every hour
    this.cleanupInterval = setInterval(async () => {
      if (this.isDestroyed) return; // Skip if service is destroyed
      
      try {
        clearAllSecureData();
        logSecurity('Periodic secure session cleanup completed', 'low');
      } catch (error) {
        logSecurity('Secure session cleanup failed', 'low', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }, 60 * 60 * 1000); // 1 hour
    
    // Register interval with memory manager
  void memoryManager.registerInterval('auth_service_cleanup', this.cleanupInterval, this);
  }

  /**
   * Setup session validation and monitoring
   */
  private setupSessionValidation(): void {
    // Validate session every 5 minutes
    this.sessionValidationInterval = setInterval(async () => {
      if (this.isDestroyed) return; // Skip if service is destroyed
      
      const { secureSession, user } = this.currentState;
      if (secureSession && user) {
        try {
          const validation = await validateSession(secureSession.sessionId);
          if (!validation.isValid) {
            // Session is invalid, sign out user
            await this.signOut();
            return;
          }

          // Update session validation state
          this.updateState({
            sessionValidation: validation,
            requiresRefresh: validation.requiresRefresh || false
          });

          // Auto-refresh if needed
          if (validation.requiresRefresh) {
            try {
              const refreshedSession = await refreshSession(secureSession.sessionId);
              this.updateState({
                secureSession: refreshedSession,
                sessionExpiresAt: refreshedSession.expiresAt,
                requiresRefresh: false
              });
            } catch (error) {
              logSecurity('Auto-refresh failed', 'medium', {
                userId: user.id,
                error: error instanceof Error ? error.message : 'Unknown error'
              });
            }
          }
        } catch (error) {
          logSecurity('Session validation failed', 'medium', {
            userId: user.id,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }, 5 * 60 * 1000); // 5 minutes
    
    // Register interval with memory manager
  void memoryManager.registerInterval('auth_service_validation', this.sessionValidationInterval, this);
  }

  /**
   * Validate current session security
   */
  public async validateCurrentSession(): Promise<SessionValidationResult | null> {
    const { secureSession } = this.currentState;
    if (!secureSession) {
      return null;
    }

    try {
      const validation = await validateSession(secureSession.sessionId);
  void his.updateState({ sessionValidation: validation });
      return validation;
    } catch (error) {
      logSecurity('Current session validation failed', 'medium', {
        userId: this.currentState.user?.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  /**
   * Refresh current session
   */
  public async refreshCurrentSession(): Promise<AuthResult<SecureSessionData>> {
    try {
      const { secureSession } = this.currentState;
      if (!secureSession) {
        throw new Error('No active secure session');
      }

      const refreshedSession = await refreshSession(secureSession.sessionId);
      this.updateState({
        secureSession: refreshedSession,
        sessionExpiresAt: refreshedSession.expiresAt,
        requiresRefresh: false
      });

      return { data: refreshedSession };
    } catch (error) {
      const supabaseError = error instanceof Error 
        ? new Error(error.message)
        : new Error('Session refresh failed');
      
      return { error: supabaseError as any };
    }
  }

  /**
   * Get concurrent sessions for current user
   */
  public async getCurrentUserSessions(): Promise<AuthResult<any[]>> {
    try {
      const { user } = this.currentState;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const sessions = await getConcurrentSessions(user.id);
  void his.updateState({ concurrentSessions: sessions.length });
      
      return { data: sessions };
    } catch (error) {
      const supabaseError = error instanceof Error 
        ? new Error(error.message)
        : new Error('Failed to get concurrent sessions');
      
      return { error: supabaseError as any };
    }
  }

  /**
   * Invalidate all other sessions except current
   */
  public async invalidateOtherSessions(): Promise<AuthResult<void>> {
    try {
      const { user, secureSession } = this.currentState;
      if (!user || !secureSession) {
        throw new Error('User not authenticated or no active session');
      }

      await invalidateAllOtherSessions(user.id, secureSession.sessionId);
      
      // Update concurrent sessions count
      const sessions = await getConcurrentSessions(user.id);
  void his.updateState({ concurrentSessions: sessions.length });
      
      return { data: undefined };
    } catch (error) {
      const supabaseError = error instanceof Error 
        ? new Error(error.message)
        : new Error('Failed to invalidate other sessions');
      
      return { error: supabaseError as any };
    }
  }

  /**
   * Get session security statistics
   */
  public getSessionSecurityStats(): Record<string, any> {
    try {
      const stats = sessionSecurity.getSecurityStats();
      return {
        ...stats,
        currentSession: this.currentState.secureSession ? {
          sessionId: `${this.currentState.secureSession.sessionId.substring(0, 8)  }...`,
          expiresAt: this.currentState.sessionExpiresAt,
          requiresRefresh: this.currentState.requiresRefresh,
          concurrentSessions: this.currentState.concurrentSessions
        } : null
      };
    } catch (error) {
      logSecurity('Failed to get session security stats', 'low', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return {};
    }
  }

  /**
   * Invalidate user cache at all levels for comprehensive cache management
   */
  private invalidateUserCache(userId: string): void {
    try {
      const cacheKey = cacheUtils.getUserProfileKey(userId);
      const sessionCacheKey = `${cacheKey}_session`;
      const coachCacheKey = `coach_${userId}`;
      
      // Clear all cache levels
      userProfileCache.delete(cacheKey);        // L2 cache
      userProfileCache.delete(sessionCacheKey); // L1 cache
      userProfileCache.delete(coachCacheKey);   // Coach-specific cache
      
      // Also clear legacy cache for backward compatibility
  void cacheUtils.invalidateUserCache(userId);
      
      logPerformance('User cache invalidated at all levels', 0, {
        userId,
        cacheOperationType: 'invalidate_all',
        cacheLevels: ['L1', 'L2', 'coach', 'legacy']
      });
    } catch (error) {
      logPerformance('Cache invalidation failed', 0, {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
        cacheOperationType: 'invalidate_failed'
      });
    }
  }

  /**
   * Validate profile data structure for type safety
   */
  private validateProfileData(data: any): boolean {
    if (!data || typeof data !== 'object') return false;
    
    // Required fields validation
    const requiredFields = ['id', 'full_name', 'email'];
    for (const field of requiredFields) {
      if (!data[field]) return false;
    }
    
    // Type validation
    if (typeof data.id !== 'string' || 
        typeof data.full_name !== 'string' ||
        typeof data.email !== 'string') {
      return false;
    }
    
    // Optional fields type validation
    if (data.phone && typeof data.phone !== 'string') return false;
    if (data.avatar_url && typeof data.avatar_url !== 'string') return false;
    if (data.bio && typeof data.bio !== 'string') return false;
    if (data.timezone && typeof data.timezone !== 'string') return false;
    if (data.is_active !== undefined && typeof data.is_active !== 'boolean') return false;
    
    return true;
  }

  /**
   * Validate coach data structure for type safety
   */
  private validateCoachData(data: any): boolean {
    if (!data || typeof data !== 'object') return false;
    
    // Required fields validation
    const requiredFields = ['id', 'ipec_certification_number', 'certification_level'];
    for (const field of requiredFields) {
      if (!data[field]) return false;
    }
    
    // Type validation
    if (typeof data.id !== 'string' || 
        typeof data.ipec_certification_number !== 'string' ||
        typeof data.certification_level !== 'string') {
      return false;
    }
    
    // Enum validation
    const validCertificationLevels = ['Associate', 'Professional', 'Master'];
    if (!validCertificationLevels.includes(data.certification_level)) {
      return false;
    }
    
    // Optional fields type validation
    if (data.hourly_rate !== undefined && typeof data.hourly_rate !== 'number') return false;
    if (data.experience_years !== undefined && typeof data.experience_years !== 'number') return false;
    if (data.average_rating !== undefined && typeof data.average_rating !== 'number') return false;
    if (data.total_sessions !== undefined && typeof data.total_sessions !== 'number') return false;
    if (data.specializations && !Array.isArray(data.specializations)) return false;
    if (data.languages && !Array.isArray(data.languages)) return false;
    if (data.is_active !== undefined && typeof data.is_active !== 'boolean') return false;
    if (data.is_verified !== undefined && typeof data.is_verified !== 'boolean') return false;
    
    return true;
  }

  /**
   * Destroy the auth service and clean up all resources
   */
  public destroy(): void {
    if (this.isDestroyed) return;
    
    this.isDestroyed = true;
    
    // Clear all listeners
    this.listeners = [];
    
    // Clean up Supabase subscription
    if (this.supabaseAuthSubscription) {
      try {
  void his.supabaseAuthSubscription();
      } catch (error) {
        logSecurity('Failed to cleanup Supabase auth subscription', 'low', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
      this.supabaseAuthSubscription = null;
    }
    
    // Clear intervals
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    if (this.sessionValidationInterval) {
      clearInterval(this.sessionValidationInterval);
      this.sessionValidationInterval = null;
    }
    
    // Clean up all resources via memory manager
  void memoryManager.cleanupComponent(this);
    
    logSecurity('Auth service destroyed and cleaned up', 'low');
  }

  /**
   * Get memory usage statistics for debugging
   */
  public getMemoryStats(): any {
    return {
      listenersCount: this.listeners.length,
      hasSupabaseSubscription: !!this.supabaseAuthSubscription,
      hasCleanupInterval: !!this.cleanupInterval,
      hasValidationInterval: !!this.sessionValidationInterval,
      isDestroyed: this.isDestroyed,
      memoryManager: memoryManager.getMemoryStats()
    };
  }
}

// Export singleton instance
export const authService = new AuthService();

// Export convenient hooks and utilities
export const useAuthState = () => {
  return authService.getState();
};

export const useAuth = () => {
  return {
    ...authService.getState(),
    signUp: authService.signUp.bind(authService),
    signIn: authService.signIn.bind(authService),
    signInWithGoogle: authService.signInWithGoogle.bind(authService),
    signOut: authService.signOut.bind(authService),
    resetPassword: authService.resetPassword.bind(authService),
    updatePassword: authService.updatePassword.bind(authService),
    updateProfile: authService.updateProfile.bind(authService),
    applyAsCoach: authService.applyAsCoach.bind(authService),
    hasPermission: authService.hasPermission.bind(authService),
    refreshUserData: authService.refreshUserData.bind(authService),
    onStateChange: authService.onStateChange.bind(authService),
    // Session security methods
    validateCurrentSession: authService.validateCurrentSession.bind(authService),
    refreshCurrentSession: authService.refreshCurrentSession.bind(authService),
    getCurrentUserSessions: authService.getCurrentUserSessions.bind(authService),
    invalidateOtherSessions: authService.invalidateOtherSessions.bind(authService),
    getSessionSecurityStats: authService.getSessionSecurityStats.bind(authService),
    // MFA methods
    verifyMFA: authService.verifyMFA.bind(authService),
    getMFASettings: authService.getMFASettings.bind(authService),
    initializeMFA: authService.initializeMFA.bind(authService),
    completeMFAEnrollment: authService.completeMFAEnrollment.bind(authService),
    disableMFA: authService.disableMFA.bind(authService),
    // Memory management methods
    getMemoryStats: authService.getMemoryStats.bind(authService),
    destroy: authService.destroy.bind(authService)
  };
};

// Setup cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
  void authService.destroy();
  });
}

export default authService;