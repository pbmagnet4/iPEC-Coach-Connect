/**
 * Enhanced Authentication Service for iPEC Coach Connect
 * 
 * Extends the existing auth service with comprehensive user state management,
 * multi-role support, onboarding tracking, and enhanced permission system.
 * 
 * Features:
 * - Multi-role user management (client, coach, admin, moderator, etc.)
 * - Comprehensive user state tracking and onboarding progress
 * - Enhanced permission system with role-based and user-specific overrides
 * - Client profile management with coaching preferences
 * - Coach application workflow with approval process
 * - Profile completion tracking and automated calculations
 * - Backward compatibility with existing auth service
 */

import { handleSupabaseError, supabase, SupabaseError, supabaseUtils } from '../lib/supabase';
import { logAuth, logPerformance, logSecurity } from '../lib/secure-logger';
import type { AuthResult, AuthState } from './auth.service';
import { authService } from './auth.service';
import type { 
  Profile, 
  ProfileUpdate, 
  SupabaseAuthUser,
  UserRole 
} from '../types/database';

// Enhanced types for our new role and state management system
export type ExtendedUserRole = 'client' | 'coach' | 'admin' | 'moderator' | 'support' | 'pending_coach' | 'suspended';

export type AccountStatus = 'active' | 'pending_verification' | 'pending_approval' | 'suspended' | 'deactivated' | 'banned';

export type OnboardingStage = 
  | 'not_started' 
  | 'profile_setup' 
  | 'role_selection' 
  | 'verification' 
  | 'coach_application' 
  | 'goal_setting' 
  | 'coach_matching' 
  | 'payment_setup' 
  | 'completed';

export interface UserRoleAssignment {
  id: string;
  user_id: string;
  role: ExtendedUserRole;
  assigned_at: string;
  assigned_by: string | null;
  is_active: boolean;
  expires_at: string | null;
  metadata: Record<string, any>;
}

export interface UserState {
  id: string;
  user_id: string;
  account_status: AccountStatus;
  onboarding_stage: OnboardingStage;
  profile_completion_percentage: number;
  email_verified_at: string | null;
  phone_verified_at: string | null;
  identity_verified_at: string | null;
  onboarding_data: Record<string, any>;
  onboarding_completed_at: string | null;
  feature_flags: Record<string, any>;
  preferences: Record<string, any>;
  last_active_at: string;
  last_login_at: string;
  login_count: number;
  created_at: string;
  updated_at: string;
}

export interface RolePermission {
  id: string;
  role: ExtendedUserRole;
  resource: string;
  action: string;
  conditions: Record<string, any>;
}

export interface UserPermissionOverride {
  id: string;
  user_id: string;
  resource: string;
  action: string;
  granted: boolean;
  reason: string | null;
  expires_at: string | null;
  created_by: string | null;
}

export interface ClientProfile {
  id: string;
  coaching_goals: string[];
  preferred_coaching_style: string[];
  focus_areas: string[];
  preferred_coach_gender: string | null;
  preferred_session_duration: number;
  preferred_time_slots: Record<string, any>;
  budget_range: Record<string, any>;
  total_sessions_completed: number;
  current_coaching_streak: number;
  longest_coaching_streak: number;
  assessment_completed_at: string | null;
  goals_set_at: string | null;
  first_coach_matched_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CoachApplication {
  id: string;
  user_id: string;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'resubmission_required';
  application_data: Record<string, any>;
  certification_number: string | null;
  certification_level: 'Associate' | 'Professional' | 'Master' | null;
  certification_date: string | null;
  certification_documents: string[];
  experience_years: number | null;
  previous_coaching_experience: string | null;
  education_background: string | null;
  specializations: string[];
  languages: string[];
  desired_hourly_rate: number | null;
  availability_timezone: string;
  why_coaching: string | null;
  coaching_philosophy: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  approval_decision_reason: string | null;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

// Extended auth state that includes our enhanced user management
export interface EnhancedAuthState extends AuthState {
  userRoles: UserRoleAssignment[];
  primaryRole: ExtendedUserRole | null;
  userState: UserState | null;
  clientProfile: ClientProfile | null;
  coachApplication: CoachApplication | null;
  permissions: string[];
  permissionOverrides: UserPermissionOverride[];
  canAccessResource: (resource: string, action: string) => boolean;
}

class EnhancedAuthService {
  private currentEnhancedState: Partial<EnhancedAuthState> = {
    userRoles: [],
    primaryRole: null,
    userState: null,
    clientProfile: null,
    coachApplication: null,
    permissions: [],
    permissionOverrides: [],
  };

  private enhancedListeners: ((state: EnhancedAuthState) => void)[] = [];
  private authServiceSubscription: (() => void) | null = null;
  private rolePermissionsCache = new Map<string, RolePermission[]>();

  constructor() {
    this.initializeEnhancedAuth();
  }

  /**
   * Initialize enhanced authentication with existing auth service integration
   */
  private async initializeEnhancedAuth() {
    // Subscribe to base auth service changes
    this.authServiceSubscription = authService.onStateChange(async (baseAuthState) => {
      if (baseAuthState.user && baseAuthState.isAuthenticated) {
        await this.loadEnhancedUserData(baseAuthState.user);
      } else {
        await this.clearEnhancedState();
      }
    });
  }

  /**
   * Load enhanced user data including roles, state, and profiles
   */
  private async loadEnhancedUserData(user: SupabaseAuthUser) {
    try {
      logAuth('Loading enhanced user data', true, { userId: user.id });

      // Load user roles
      const userRoles = await this.loadUserRoles(user.id);
      
      // Load user state
      const userState = await this.loadUserState(user.id);
      
      // Load client profile if user has client role
      let clientProfile: ClientProfile | null = null;
      if (userRoles.some(role => role.role === 'client' && role.is_active)) {
        clientProfile = await this.loadClientProfile(user.id);
      }
      
      // Load coach application if user has coach-related roles
      let coachApplication: CoachApplication | null = null;
      if (userRoles.some(role => ['coach', 'pending_coach'].includes(role.role) && role.is_active)) {
        coachApplication = await this.loadCoachApplication(user.id);
      }
      
      // Calculate user permissions
      const permissions = await this.calculateUserPermissions(user.id, userRoles);
      
      // Load permission overrides
      const permissionOverrides = await this.loadPermissionOverrides(user.id);
      
      // Determine primary role
      const primaryRole = this.determinePrimaryRole(userRoles);
      
      // Update profile completion percentage
      if (userState) {
        const completionPercentage = await this.calculateProfileCompletion(user.id);
        await this.updateProfileCompletion(user.id, completionPercentage);
        userState.profile_completion_percentage = completionPercentage;
      }
      
      // Update enhanced state
      this.updateEnhancedState({
        userRoles,
        primaryRole,
        userState,
        clientProfile,
        coachApplication,
        permissions,
        permissionOverrides,
        canAccessResource: (resource: string, action: string) => 
          this.checkResourceAccess(resource, action, permissions, permissionOverrides)
      });

      logAuth('Enhanced user data loaded successfully', true, {
        userId: user.id,
        roles: userRoles.map(r => r.role),
        primaryRole,
        onboardingStage: userState?.onboarding_stage
      });

    } catch (error) {
      logSecurity('Failed to load enhanced user data', 'medium', {
        userId: user.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Load user roles from database
   */
  private async loadUserRoles(userId: string): Promise<UserRoleAssignment[]> {
    const { data, error } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('assigned_at', { ascending: false });

    if (error) {
      throw handleSupabaseError(error);
    }

    return data || [];
  }

  /**
   * Load user state from database
   */
  private async loadUserState(userId: string): Promise<UserState | null> {
    const { data, error } = await supabase
      .from('user_states')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No user state found - create one
        return await this.createUserState(userId);
      }
      throw handleSupabaseError(error);
    }

    return data;
  }

  /**
   * Create initial user state
   */
  private async createUserState(userId: string): Promise<UserState> {
    const { data, error } = await supabase
      .from('user_states')
      .insert({
        user_id: userId,
        account_status: 'pending_verification',
        onboarding_stage: 'not_started',
        profile_completion_percentage: 0
      })
      .select()
      .single();

    if (error) {
      throw handleSupabaseError(error);
    }

    return data;
  }

  /**
   * Load client profile from database
   */
  private async loadClientProfile(userId: string): Promise<ClientProfile | null> {
    const { data, error } = await supabase
      .from('client_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No client profile yet
      }
      throw handleSupabaseError(error);
    }

    return data;
  }

  /**
   * Load coach application from database
   */
  private async loadCoachApplication(userId: string): Promise<CoachApplication | null> {
    const { data, error } = await supabase
      .from('coach_applications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No coach application yet
      }
      throw handleSupabaseError(error);
    }

    return data;
  }

  /**
   * Calculate user permissions based on roles
   */
  private async calculateUserPermissions(userId: string, roles: UserRoleAssignment[]): Promise<string[]> {
    const allPermissions = new Set<string>();

    for (const roleAssignment of roles) {
      if (!roleAssignment.is_active) continue;

      // Get permissions for this role from cache or database
      let rolePermissions = this.rolePermissionsCache.get(roleAssignment.role);
      
      if (!rolePermissions) {
        const { data, error } = await supabase
          .from('role_permissions')
          .select('*')
          .eq('role', roleAssignment.role);

        if (error) {
          logSecurity('Failed to load role permissions', 'medium', {
            userId,
            role: roleAssignment.role,
            error: error.message
          });
          continue;
        }

        rolePermissions = data || [];
        this.rolePermissionsCache.set(roleAssignment.role, rolePermissions);
      }

      // Add all permissions for this role
      for (const permission of rolePermissions) {
        allPermissions.add(`${permission.resource}:${permission.action}`);
      }
    }

    return Array.from(allPermissions);
  }

  /**
   * Load permission overrides for user
   */
  private async loadPermissionOverrides(userId: string): Promise<UserPermissionOverride[]> {
    const { data, error } = await supabase
      .from('user_permission_overrides')
      .select('*')
      .eq('user_id', userId)
      .or('expires_at.is.null,expires_at.gt.now()'); // Not expired

    if (error) {
      throw handleSupabaseError(error);
    }

    return data || [];
  }

  /**
   * Determine primary role based on role hierarchy
   */
  private determinePrimaryRole(roles: UserRoleAssignment[]): ExtendedUserRole | null {
    if (!roles.length) return null;

    // Role hierarchy (higher index = higher priority)
    const roleHierarchy: ExtendedUserRole[] = [
      'suspended',
      'client',
      'pending_coach',
      'support',
      'coach',
      'moderator',
      'admin'
    ];

    const activeRoles = roles.filter(r => r.is_active).map(r => r.role);
    
    // Find highest priority role
    for (let i = roleHierarchy.length - 1; i >= 0; i--) {
      if (activeRoles.includes(roleHierarchy[i])) {
        return roleHierarchy[i];
      }
    }

    return activeRoles[0] || null;
  }

  /**
   * Calculate profile completion percentage
   */
  private async calculateProfileCompletion(userId: string): Promise<number> {
    const { data, error } = await supabase.rpc('calculate_profile_completion', {
      user_id: userId
    });

    if (error) {
      logSecurity('Profile completion calculation failed', 'low', {
        userId,
        error: error.message
      });
      return 0;
    }

    return data || 0;
  }

  /**
   * Update profile completion percentage
   */
  private async updateProfileCompletion(userId: string, percentage: number): Promise<void> {
    const { error } = await supabase
      .from('user_states')
      .update({ 
        profile_completion_percentage: percentage,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (error) {
      logSecurity('Failed to update profile completion', 'low', {
        userId,
        percentage,
        error: error.message
      });
    }
  }

  /**
   * Check if user has access to a specific resource and action
   */
  private checkResourceAccess(
    resource: string,
    action: string,
    permissions: string[],
    overrides: UserPermissionOverride[]
  ): boolean {
    const permissionKey = `${resource}:${action}`;
    
    // Check for explicit override first
    const override = overrides.find(o => o.resource === resource && o.action === action);
    if (override) {
      return override.granted;
    }
    
    // Check role-based permissions
    return permissions.includes(permissionKey);
  }

  /**
   * Update enhanced state and notify listeners
   */
  private updateEnhancedState(updates: Partial<EnhancedAuthState>) {
    this.currentEnhancedState = { ...this.currentEnhancedState, ...updates };
    this.notifyEnhancedListeners();
  }

  /**
   * Clear enhanced state on logout
   */
  private async clearEnhancedState() {
    this.currentEnhancedState = {
      userRoles: [],
      primaryRole: null,
      userState: null,
      clientProfile: null,
      coachApplication: null,
      permissions: [],
      permissionOverrides: [],
    };
    this.notifyEnhancedListeners();
  }

  /**
   * Notify all enhanced state listeners
   */
  private notifyEnhancedListeners() {
    const fullState = this.getEnhancedState();
    this.enhancedListeners.forEach(listener => listener(fullState));
  }

  /**
   * Get complete enhanced auth state
   */
  public getEnhancedState(): EnhancedAuthState {
    const baseState = authService.getState();
    return {
      ...baseState,
      ...this.currentEnhancedState,
      canAccessResource: this.currentEnhancedState.canAccessResource || (() => false)
    } as EnhancedAuthState;
  }

  /**
   * Subscribe to enhanced auth state changes
   */
  public onEnhancedStateChange(listener: (state: EnhancedAuthState) => void): () => void {
    this.enhancedListeners.push(listener);
    
    // Immediately call with current state
    listener(this.getEnhancedState());
    
    // Return unsubscribe function
    return () => {
      const index = this.enhancedListeners.indexOf(listener);
      if (index > -1) {
        this.enhancedListeners.splice(index, 1);
      }
    };
  }

  /**
   * Assign role to user
   */
  public async assignRole(userId: string, role: ExtendedUserRole, assignedBy?: string): Promise<AuthResult<UserRoleAssignment>> {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role,
          assigned_by: assignedBy || userId,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        throw handleSupabaseError(error);
      }

      // Reload user data to reflect changes
      if (userId === authService.getState().user?.id) {
        await this.loadEnhancedUserData(authService.getState().user);
      }

      logAuth('Role assigned', true, { userId, role, assignedBy });
      return { data };
    } catch (error) {
      const supabaseError = error instanceof SupabaseError ? error : handleSupabaseError(error);
      return { error: supabaseError };
    }
  }

  /**
   * Remove role from user
   */
  public async removeRole(userId: string, role: ExtendedUserRole): Promise<AuthResult<void>> {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('role', role);

      if (error) {
        throw handleSupabaseError(error);
      }

      // Reload user data to reflect changes
      if (userId === authService.getState().user?.id) {
        await this.loadEnhancedUserData(authService.getState().user);
      }

      logAuth('Role removed', true, { userId, role });
      return { data: undefined };
    } catch (error) {
      const supabaseError = error instanceof SupabaseError ? error : handleSupabaseError(error);
      return { error: supabaseError };
    }
  }

  /**
   * Update user onboarding stage
   */
  public async updateOnboardingStage(stage: OnboardingStage, data?: Record<string, any>): Promise<AuthResult<UserState>> {
    try {
      const {user} = authService.getState();
      if (!user) {
        throw new SupabaseError('User not authenticated');
      }

      const updateData: any = {
        onboarding_stage: stage,
        updated_at: new Date().toISOString()
      };

      // If completing onboarding
      if (stage === 'completed') {
        updateData.onboarding_completed_at = new Date().toISOString();
      }

      // Merge onboarding data
      if (data) {
        const currentState = this.getEnhancedState().userState;
        updateData.onboarding_data = {
          ...currentState?.onboarding_data,
          ...data
        };
      }

      const { data: updatedState, error } = await supabase
        .from('user_states')
        .update(updateData)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        throw handleSupabaseError(error);
      }

      // Update local state
      this.updateEnhancedState({ userState: updatedState });

      logAuth('Onboarding stage updated', true, {
        userId: user.id,
        stage,
        hasData: !!data
      });

      return { data: updatedState };
    } catch (error) {
      const supabaseError = error instanceof SupabaseError ? error : handleSupabaseError(error);
      return { error: supabaseError };
    }
  }

  /**
   * Create or update client profile
   */
  public async updateClientProfile(updates: Partial<ClientProfile>): Promise<AuthResult<ClientProfile>> {
    try {
      const {user} = authService.getState();
      if (!user) {
        throw new SupabaseError('User not authenticated');
      }

      const { data, error } = await supabase
        .from('client_profiles')
        .upsert({
          id: user.id,
          ...updates,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw handleSupabaseError(error);
      }

      // Update local state
      this.updateEnhancedState({ clientProfile: data });

      // Recalculate profile completion
      const completionPercentage = await this.calculateProfileCompletion(user.id);
      await this.updateProfileCompletion(user.id, completionPercentage);

      logAuth('Client profile updated', true, { userId: user.id });
      return { data };
    } catch (error) {
      const supabaseError = error instanceof SupabaseError ? error : handleSupabaseError(error);
      return { error: supabaseError };
    }
  }

  /**
   * Submit coach application
   */
  public async submitCoachApplication(applicationData: Partial<CoachApplication>): Promise<AuthResult<CoachApplication>> {
    try {
      const {user} = authService.getState();
      if (!user) {
        throw new SupabaseError('User not authenticated');
      }

      const { data, error } = await supabase
        .from('coach_applications')
        .insert({
          user_id: user.id,
          status: 'submitted',
          submitted_at: new Date().toISOString(),
          ...applicationData
        })
        .select()
        .single();

      if (error) {
        throw handleSupabaseError(error);
      }

      // Assign pending_coach role
      await this.assignRole(user.id, 'pending_coach');

      // Update onboarding stage
      await this.updateOnboardingStage('coach_application');

      // Update local state
      this.updateEnhancedState({ coachApplication: data });

      logAuth('Coach application submitted', true, { userId: user.id });
      return { data };
    } catch (error) {
      const supabaseError = error instanceof SupabaseError ? error : handleSupabaseError(error);
      return { error: supabaseError };
    }
  }

  /**
   * Check if user has specific permission
   */
  public hasPermission(resource: string, action: string): boolean {
    const state = this.getEnhancedState();
    return state.canAccessResource(resource, action);
  }

  /**
   * Check if user has any of the specified roles
   */
  public hasAnyRole(roles: ExtendedUserRole[]): boolean {
    const state = this.getEnhancedState();
    return state.userRoles.some(role => 
      role.is_active && roles.includes(role.role)
    );
  }

  /**
   * Get user's active roles
   */
  public getActiveRoles(): ExtendedUserRole[] {
    const state = this.getEnhancedState();
    return state.userRoles
      .filter(role => role.is_active)
      .map(role => role.role);
  }

  /**
   * Check if onboarding is completed
   */
  public isOnboardingCompleted(): boolean {
    const state = this.getEnhancedState();
    return state.userState?.onboarding_stage === 'completed';
  }

  /**
   * Get profile completion percentage
   */
  public getProfileCompletionPercentage(): number {
    const state = this.getEnhancedState();
    return state.userState?.profile_completion_percentage || 0;
  }

  /**
   * Destroy enhanced auth service and cleanup
   */
  public destroy(): void {
    if (this.authServiceSubscription) {
      this.authServiceSubscription();
      this.authServiceSubscription = null;
    }
    
    this.enhancedListeners = [];
    this.rolePermissionsCache.clear();
    this.currentEnhancedState = {
      userRoles: [],
      primaryRole: null,
      userState: null,
      clientProfile: null,
      coachApplication: null,
      permissions: [],
      permissionOverrides: []
    };

    logAuth('Enhanced auth service destroyed', true);
  }
}

// Export singleton instance
export const enhancedAuthService = new EnhancedAuthService();

// Export convenience hook for React components
export const useEnhancedAuth = () => {
  const baseAuth = authService.getState();
  const enhancedState = enhancedAuthService.getEnhancedState();
  
  return {
    ...baseAuth,
    ...enhancedState,
    // Enhanced methods
    assignRole: enhancedAuthService.assignRole.bind(enhancedAuthService),
    removeRole: enhancedAuthService.removeRole.bind(enhancedAuthService),
    updateOnboardingStage: enhancedAuthService.updateOnboardingStage.bind(enhancedAuthService),
    updateClientProfile: enhancedAuthService.updateClientProfile.bind(enhancedAuthService),
    submitCoachApplication: enhancedAuthService.submitCoachApplication.bind(enhancedAuthService),
    hasPermission: enhancedAuthService.hasPermission.bind(enhancedAuthService),
    hasAnyRole: enhancedAuthService.hasAnyRole.bind(enhancedAuthService),
    getActiveRoles: enhancedAuthService.getActiveRoles.bind(enhancedAuthService),
    isOnboardingCompleted: enhancedAuthService.isOnboardingCompleted.bind(enhancedAuthService),
    getProfileCompletionPercentage: enhancedAuthService.getProfileCompletionPercentage.bind(enhancedAuthService),
    onEnhancedStateChange: enhancedAuthService.onEnhancedStateChange.bind(enhancedAuthService)
  };
};

export default enhancedAuthService;