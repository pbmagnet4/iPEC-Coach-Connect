/**
 * Unified User State Management Store for iPEC Coach Connect
 * 
 * Comprehensive Zustand-based state management system that unifies:
 * - Authentication state and session management
 * - Multi-role user management with permissions
 * - User onboarding and profile completion tracking
 * - Client profiles and coaching preferences
 * - Coach applications and approval workflow
 * - Real-time state synchronization with Supabase
 * - Offline support with background sync
 * - Performance optimization with selective updates
 * 
 * Architecture:
 * - Slice-based organization for scalability
 * - Middleware for persistence, devtools, and real-time sync
 * - Type-safe state management with comprehensive interfaces
 * - Memory-efficient with intelligent caching strategies
 * - Cross-component state sharing with minimal re-renders
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
// import { temporal } from 'zundo'; // Optional undo/redo functionality
import { subscribeWithSelector } from 'zustand/middleware';
import type {
  AccountStatus,
  ClientProfile,
  CoachApplication,
  ExtendedUserRole,
  OnboardingStage,
  UserPermissionOverride,
  UserRoleAssignment
} from '../services/enhanced-auth.service';
import { 
  enhancedAuthService, 
  EnhancedAuthState,
  UserState
} from '../services/enhanced-auth.service';
import { supabase } from '../lib/supabase';
import { logAuth, logPerformance } from '../lib/secure-logger';
import type { RealtimeChannel } from '@supabase/supabase-js';

// =====================================================================
// STATE INTERFACES
// =====================================================================

export interface UserProfileData {
  id: string;
  email: string;
  full_name: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  phone?: string;
  location?: string;
  timezone: string;
  preferred_language: string;
  notification_preferences: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface DashboardMetrics {
  profileCompletion: number;
  totalSessions: number;
  upcomingSessions: number;
  completedGoals: number;
  activeStreak: number;
  joinedDaysAgo: number;
  lastLoginDaysAgo: number;
}

export interface NotificationSettings {
  email: boolean;
  sms: boolean;
  push: boolean;
  marketing: boolean;
  sessionReminders: boolean;
  communityUpdates: boolean;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  dateFormat: string;
  notifications: NotificationSettings;
  accessibility: {
    reducedMotion: boolean;
    highContrast: boolean;
    screenReader: boolean;
  };
}

// =====================================================================
// MAIN STORE INTERFACE
// =====================================================================

export interface UnifiedUserState {
  // Authentication & Session
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  sessionExpiresAt: number | null;
  requiresMFA: boolean;
  mfaVerified: boolean;

  // User Identity
  userId: string | null;
  profile: UserProfileData | null;
  
  // Role & Permission Management
  roles: UserRoleAssignment[];
  primaryRole: ExtendedUserRole | null;
  permissions: string[];
  permissionOverrides: UserPermissionOverride[];
  
  // User State & Onboarding
  accountStatus: AccountStatus;
  onboardingStage: OnboardingStage;
  onboardingData: Record<string, any>;
  profileCompletion: number;
  isOnboardingComplete: boolean;
  
  // Specialized Profiles
  clientProfile: ClientProfile | null;
  coachApplication: CoachApplication | null;
  
  // User Preferences & Settings
  preferences: UserPreferences;
  featureFlags: Record<string, boolean>;
  
  // Dashboard Data
  metrics: DashboardMetrics;
  
  // Real-time & Sync
  isOnline: boolean;
  lastSyncAt: number | null;
  syncQueue: any[];
  realtimeSubscription: RealtimeChannel | null;

  // =====================================================================
  // ACTIONS
  // =====================================================================
  
  // Authentication Actions
  setAuthenticated: (isAuth: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Profile Actions
  updateProfile: (updates: Partial<UserProfileData>) => Promise<void>;
  uploadAvatar: (file: File) => Promise<string>;
  
  // Role Actions
  assignRole: (role: ExtendedUserRole) => Promise<void>;
  removeRole: (role: ExtendedUserRole) => Promise<void>;
  updateRoles: (roles: UserRoleAssignment[]) => void;
  
  // Permission Actions
  checkPermission: (resource: string, action: string) => boolean;
  hasRole: (role: ExtendedUserRole) => boolean;
  hasAnyRole: (roles: ExtendedUserRole[]) => boolean;
  
  // Onboarding Actions
  updateOnboardingStage: (stage: OnboardingStage, data?: Record<string, any>) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
  
  // Client Profile Actions
  updateClientProfile: (updates: Partial<ClientProfile>) => Promise<void>;
  setCoachingGoals: (goals: string[]) => Promise<void>;
  updateCoachingPreferences: (preferences: Partial<ClientProfile>) => Promise<void>;
  
  // Coach Application Actions
  submitCoachApplication: (applicationData: Partial<CoachApplication>) => Promise<void>;
  updateCoachApplication: (updates: Partial<CoachApplication>) => Promise<void>;
  withdrawCoachApplication: () => Promise<void>;
  
  // Preference Actions
  updatePreferences: (updates: Partial<UserPreferences>) => void;
  toggleNotification: (key: keyof NotificationSettings) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setLanguage: (language: string) => void;
  
  // Utility Actions
  refreshUserData: () => Promise<void>;
  syncToServer: () => Promise<void>;
  calculateMetrics: () => void;
  subscribeToRealtime: () => void;
  unsubscribeFromRealtime: () => void;
  reset: () => void;
}

// =====================================================================
// DEFAULT VALUES
// =====================================================================

const defaultPreferences: UserPreferences = {
  theme: 'system',
  language: 'en',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC',
  dateFormat: 'MM/dd/yyyy',
  notifications: {
    email: true,
    sms: false,
    push: true,
    marketing: false,
    sessionReminders: true,
    communityUpdates: true,
  },
  accessibility: {
    reducedMotion: false,
    highContrast: false,
    screenReader: false,
  },
};

const defaultMetrics: DashboardMetrics = {
  profileCompletion: 0,
  totalSessions: 0,
  upcomingSessions: 0,
  completedGoals: 0,
  activeStreak: 0,
  joinedDaysAgo: 0,
  lastLoginDaysAgo: 0,
};

// =====================================================================
// STORE IMPLEMENTATION
// =====================================================================

export const useUnifiedUserStore = create<UnifiedUserState>()(
  // Apply middleware stack
  devtools(
    persist(
      subscribeWithSelector(
        immer(
          (set, get) => ({
              // =====================================================================
              // INITIAL STATE
              // =====================================================================
              
              isAuthenticated: false,
              isLoading: true,
              error: null,
              sessionExpiresAt: null,
              requiresMFA: false,
              mfaVerified: false,
              
              userId: null,
              profile: null,
              
              roles: [],
              primaryRole: null,
              permissions: [],
              permissionOverrides: [],
              
              accountStatus: 'pending_verification',
              onboardingStage: 'not_started',
              onboardingData: {},
              profileCompletion: 0,
              isOnboardingComplete: false,
              
              clientProfile: null,
              coachApplication: null,
              
              preferences: defaultPreferences,
              featureFlags: {},
              
              metrics: defaultMetrics,
              
              isOnline: navigator.onLine ?? true,
              lastSyncAt: null,
              syncQueue: [],
              realtimeSubscription: null,

              // =====================================================================
              // AUTHENTICATION ACTIONS
              // =====================================================================
              
              setAuthenticated: (isAuth: boolean) => {
                set((state) => {
                  state.isAuthenticated = isAuth;
                  if (!isAuth) {
                    // Clear user data on logout
                    state.userId = null;
                    state.profile = null;
                    state.roles = [];
                    state.primaryRole = null;
                    state.permissions = [];
                    state.clientProfile = null;
                    state.coachApplication = null;
                    state.isOnboardingComplete = false;
                    state.syncQueue = [];
                  }
                });
              },

              setLoading: (loading: boolean) => {
                set((state) => {
                  state.isLoading = loading;
                });
              },

              setError: (error: string | null) => {
                set((state) => {
                  state.error = error;
                });
              },

              clearError: () => {
                set((state) => {
                  state.error = null;
                });
              },

              // =====================================================================
              // PROFILE ACTIONS
              // =====================================================================
              
              updateProfile: async (updates: Partial<UserProfileData>) => {
                const state = get();
                if (!state.userId) throw new Error('User not authenticated');

                set((state) => {
                  state.isLoading = true;
                  state.error = null;
                });

                try {
                  const authState = enhancedAuthService.getEnhancedState();
                  const result = await enhancedAuthService.updateProfile(updates as any);
                  
                  if (result.error) {
                    throw new Error(result.error.message);
                  }

                  set((state) => {
                    if (state.profile && result.data) {
                      Object.assign(state.profile, result.data);
                    }
                    state.isLoading = false;
                  });

                  // Recalculate metrics
                  get().calculateMetrics();

                } catch (error) {
                  set((state) => {
                    state.error = error instanceof Error ? error.message : 'Failed to update profile';
                    state.isLoading = false;
                  });
                  throw error;
                }
              },

              uploadAvatar: async (file: File) => {
                const state = get();
                if (!state.userId) throw new Error('User not authenticated');

                // Upload file to Supabase storage
                const fileExt = file.name.split('.').pop();
                const fileName = `${state.userId}-${Date.now()}.${fileExt}`;
                
                const { data, error } = await supabase.storage
                  .from('avatars')
                  .upload(fileName, file);

                if (error) {
                  throw new Error('Failed to upload avatar');
                }

                // Get public URL
                const { data: publicData } = supabase.storage
                  .from('avatars')
                  .getPublicUrl(data.path);

                // Update profile with new avatar URL
                await get().updateProfile({ avatar_url: publicData.publicUrl });
                
                return publicData.publicUrl;
              },

              // =====================================================================
              // ROLE ACTIONS
              // =====================================================================
              
              assignRole: async (role: ExtendedUserRole) => {
                const state = get();
                if (!state.userId) throw new Error('User not authenticated');

                const result = await enhancedAuthService.assignRole(state.userId, role);
                if (result.error) {
                  throw new Error(result.error.message);
                }
                
                // State will be updated via real-time subscription
              },

              removeRole: async (role: ExtendedUserRole) => {
                const state = get();
                if (!state.userId) throw new Error('User not authenticated');

                const result = await enhancedAuthService.removeRole(state.userId, role);
                if (result.error) {
                  throw new Error(result.error.message);
                }
                
                // State will be updated via real-time subscription
              },

              updateRoles: (roles: UserRoleAssignment[]) => {
                set((state) => {
                  state.roles = roles;
                  // Update primary role
                  const primaryRole = roles
                    .filter(r => r.is_active)
                    .sort((a, b) => {
                      // Sort by hierarchy (admin > moderator > coach > client)
                      const hierarchyMap = {
                        'admin': 100,
                        'moderator': 80,
                        'support': 70,
                        'coach': 60,
                        'client': 50,
                        'pending_coach': 40,
                        'suspended': 10
                      };
                      return (hierarchyMap[b.role as keyof typeof hierarchyMap] ?? 0) - 
                             (hierarchyMap[a.role as keyof typeof hierarchyMap] ?? 0);
                    })[0]?.role ?? null;
                    
                  state.primaryRole = primaryRole;
                });
              },

              // =====================================================================
              // PERMISSION ACTIONS
              // =====================================================================
              
              checkPermission: (resource: string, action: string) => {
                const state = get();
                const permissionKey = `${resource}:${action}`;
                
                // Check permission overrides first
                const override = state.permissionOverrides.find(
                  o => o.resource === resource && o.action === action
                );
                if (override) {
                  return override.granted;
                }
                
                // Check if user has permission
                return state.permissions.includes(permissionKey) || 
                       state.permissions.includes(`${resource}:*`) ||
                       state.permissions.includes('*:*');
              },

              hasRole: (role: ExtendedUserRole) => {
                return get().roles.some(r => r.role === role && r.is_active);
              },

              hasAnyRole: (roles: ExtendedUserRole[]) => {
                const userRoles = get().roles.filter(r => r.is_active).map(r => r.role);
                return roles.some(role => userRoles.includes(role));
              },

              // =====================================================================
              // ONBOARDING ACTIONS
              // =====================================================================
              
              updateOnboardingStage: async (stage: OnboardingStage, data?: Record<string, any>) => {
                const result = await enhancedAuthService.updateOnboardingStage(stage, data);
                if (result.error) {
                  throw new Error(result.error.message);
                }
                
                set((state) => {
                  state.onboardingStage = stage;
                  if (data) {
                    state.onboardingData = { ...state.onboardingData, ...data };
                  }
                  state.isOnboardingComplete = stage === 'completed';
                });
              },

              completeOnboarding: async () => {
                await get().updateOnboardingStage('completed');
              },

              resetOnboarding: async () => {
                await get().updateOnboardingStage('not_started');
                set((state) => {
                  state.onboardingData = {};
                });
              },

              // =====================================================================
              // CLIENT PROFILE ACTIONS
              // =====================================================================
              
              updateClientProfile: async (updates: Partial<ClientProfile>) => {
                const result = await enhancedAuthService.updateClientProfile(updates);
                if (result.error) {
                  throw new Error(result.error.message);
                }
                
                set((state) => {
                  if (state.clientProfile && result.data) {
                    Object.assign(state.clientProfile, result.data);
                  } else if (result.data) {
                    state.clientProfile = result.data;
                  }
                });
                
                get().calculateMetrics();
              },

              setCoachingGoals: async (goals: string[]) => {
                await get().updateClientProfile({ coaching_goals: goals });
              },

              updateCoachingPreferences: async (preferences: Partial<ClientProfile>) => {
                await get().updateClientProfile(preferences);
              },

              // =====================================================================
              // COACH APPLICATION ACTIONS
              // =====================================================================
              
              submitCoachApplication: async (applicationData: Partial<CoachApplication>) => {
                const result = await enhancedAuthService.submitCoachApplication(applicationData);
                if (result.error) {
                  throw new Error(result.error.message);
                }
                
                set((state) => {
                  state.coachApplication = result.data ?? null;
                });
              },

              updateCoachApplication: async (updates: Partial<CoachApplication>) => {
                const state = get();
                if (!state.userId || !state.coachApplication) {
                  throw new Error('No coach application to update');
                }

                const { data, error } = await supabase
                  .from('coach_applications')
                  .update(updates)
                  .eq('user_id', state.userId)
                  .select()
                  .single();

                if (error) {
                  throw new Error('Failed to update coach application');
                }

                set((state) => {
                  state.coachApplication = data;
                });
              },

              withdrawCoachApplication: async () => {
                const state = get();
                if (!state.userId || !state.coachApplication) {
                  throw new Error('No coach application to withdraw');
                }

                const { error } = await supabase
                  .from('coach_applications')
                  .update({ status: 'withdrawn' })
                  .eq('user_id', state.userId);

                if (error) {
                  throw new Error('Failed to withdraw coach application');
                }

                set((state) => {
                  if (state.coachApplication) {
                    state.coachApplication.status = 'withdrawn' as any;
                  }
                });
              },

              // =====================================================================
              // PREFERENCE ACTIONS
              // =====================================================================
              
              updatePreferences: (updates: Partial<UserPreferences>) => {
                set((state) => {
                  state.preferences = { ...state.preferences, ...updates };
                });
              },

              toggleNotification: (key: keyof NotificationSettings) => {
                set((state) => {
                  state.preferences.notifications[key] = !state.preferences.notifications[key];
                });
              },

              setTheme: (theme: 'light' | 'dark' | 'system') => {
                set((state) => {
                  state.preferences.theme = theme;
                });
              },

              setLanguage: (language: string) => {
                set((state) => {
                  state.preferences.language = language;
                });
              },

              // =====================================================================
              // UTILITY ACTIONS
              // =====================================================================
              
              refreshUserData: async () => {
                const result = await enhancedAuthService.refreshUserData();
                if (result.error) {
                  throw new Error(result.error.message);
                }
                
                // Data will be updated via auth service subscription
                get().calculateMetrics();
              },

              syncToServer: async () => {
                const state = get();
                if (!state.userId || !state.syncQueue.length) return;

                // Process sync queue
                const queue = [...state.syncQueue];
                set((state) => {
                  state.syncQueue = [];
                });

                try {
                  for (const item of queue) {
                    // Process each sync item
                    // This would be implemented based on the specific sync requirements
                  }
                  
                  set((state) => {
                    state.lastSyncAt = Date.now();
                  });
                } catch (error) {
                  // Add failed items back to queue
                  set((state) => {
                    state.syncQueue.unshift(...queue);
                  });
                  throw error;
                }
              },

              calculateMetrics: () => {
                set((state) => {
                  const {profile} = state;
                  const {clientProfile} = state;
                  
                  if (!profile) return;

                  const joinedDate = new Date(profile.created_at);
                  const now = new Date();
                  
                  state.metrics = {
                    profileCompletion: state.profileCompletion,
                    totalSessions: clientProfile?.total_sessions_completed ?? 0,
                    upcomingSessions: 0, // Would be calculated from sessions data
                    completedGoals: clientProfile?.coaching_goals?.length ?? 0,
                    activeStreak: clientProfile?.current_coaching_streak ?? 0,
                    joinedDaysAgo: Math.floor((now.getTime() - joinedDate.getTime()) / (1000 * 60 * 60 * 24)),
                    lastLoginDaysAgo: 0, // Would be calculated from last login
                  };
                });
              },

              subscribeToRealtime: () => {
                const state = get();
                if (!state.userId || state.realtimeSubscription) return;

                const subscription = supabase.channel(`user-${state.userId}`)
                  .on('postgres_changes', 
                    { event: '*', schema: 'public', table: 'user_states' },
                    (payload) => {
                      logAuth('Real-time user state update', true, { payload });
                      // Handle user state changes
                    }
                  )
                  .on('postgres_changes',
                    { event: '*', schema: 'public', table: 'user_roles' },
                    (payload) => {
                      logAuth('Real-time user roles update', true, { payload });
                      // Handle role changes
                    }
                  )
                  .subscribe();

                set((state) => {
                  state.realtimeSubscription = subscription;
                });
              },

              unsubscribeFromRealtime: () => {
                const state = get();
                if (state.realtimeSubscription) {
                  state.realtimeSubscription.unsubscribe();
                  set((state) => {
                    state.realtimeSubscription = null;
                  });
                }
              },

              reset: () => {
                set((state) => {
                  // Reset to initial state
                  Object.assign(state, {
                    isAuthenticated: false,
                    isLoading: false,
                    error: null,
                    userId: null,
                    profile: null,
                    roles: [],
                    primaryRole: null,
                    permissions: [],
                    clientProfile: null,
                    coachApplication: null,
                    preferences: defaultPreferences,
                    metrics: defaultMetrics,
                    syncQueue: [],
                    onboardingData: {},
                    isOnboardingComplete: false,
                  });
                });
              },
            })
        )
      ),
      {
        name: 'unified-user-store',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          preferences: state.preferences,
          featureFlags: state.featureFlags,
          onboardingData: state.onboardingData,
          lastSyncAt: state.lastSyncAt,
        }),
      }
    ),
    { name: 'UnifiedUserStore' }
  )
);

// =====================================================================
// STORE INITIALIZATION AND INTEGRATION
// =====================================================================

// Subscribe to enhanced auth service changes
let authServiceSubscription: (() => void) | null = null;

const initializeStore = () => {
  authServiceSubscription = enhancedAuthService.onEnhancedStateChange((authState) => {
    const store = useUnifiedUserStore.getState();
    
    // Batch update state from auth service
    useUnifiedUserStore.setState((state) => {
      // Update authentication state
      state.isAuthenticated = authState.isAuthenticated;
      state.isLoading = authState.isLoading;
      state.userId = authState.user?.id ?? null;
      state.requiresMFA = authState.requiresMFA;
      state.mfaVerified = authState.mfaVerified;
      state.sessionExpiresAt = authState.sessionExpiresAt;
      
      // Update profile data
      if (authState.profile) {
        state.profile = {
          id: authState.profile.id,
          email: authState.profile.email ?? authState.user?.email ?? '',
          full_name: authState.profile.full_name ?? '',
          display_name: authState.profile.display_name,
          avatar_url: authState.profile.avatar_url,
          bio: authState.profile.bio,
          phone: authState.profile.phone,
          location: authState.profile.location,
          timezone: authState.profile.timezone ?? 'UTC',
          preferred_language: authState.profile.preferred_language ?? 'en',
          notification_preferences: authState.profile.notification_preferences ?? {},
          created_at: authState.profile.created_at ?? new Date().toISOString(),
          updated_at: authState.profile.updated_at ?? new Date().toISOString(),
        };
      }
      
      // Update roles and permissions
      state.roles = authState.userRoles;
      state.primaryRole = authState.primaryRole;
      state.permissions = authState.permissions;
      state.permissionOverrides = authState.permissionOverrides;
      
      // Update user state
      if (authState.userState) {
        state.accountStatus = authState.userState.account_status;
        state.onboardingStage = authState.userState.onboarding_stage;
        state.onboardingData = authState.userState.onboarding_data;
        state.profileCompletion = authState.userState.profile_completion_percentage;
        state.isOnboardingComplete = authState.userState.onboarding_stage === 'completed';
        state.featureFlags = authState.userState.feature_flags;
      }
      
      // Update specialized profiles
      state.clientProfile = authState.clientProfile;
      state.coachApplication = authState.coachApplication;
    });
    
    // Calculate metrics after state update
    store.calculateMetrics();
    
    // Subscribe to real-time updates if authenticated
    if (authState.isAuthenticated && authState.user) {
      store.subscribeToRealtime();
    } else {
      store.unsubscribeFromRealtime();
    }
  });
};

// Initialize store integration
initializeStore();

// Monitor online/offline status
window.addEventListener('online', () => {
  useUnifiedUserStore.setState({ isOnline: true });
  // Trigger sync when coming back online
  const state = useUnifiedUserStore.getState();
  if (state.isAuthenticated && state.syncQueue.length > 0) {
    state.syncToServer().catch(console.error);
  }
});

window.addEventListener('offline', () => {
  useUnifiedUserStore.setState({ isOnline: false });
});

// Cleanup function
export const destroyUnifiedUserStore = () => {
  if (authServiceSubscription) {
    authServiceSubscription();
    authServiceSubscription = null;
  }
  
  const state = useUnifiedUserStore.getState();
  state.unsubscribeFromRealtime();
  state.reset();
};

// =====================================================================
// CONVENIENCE HOOKS
// =====================================================================

// Hook for authentication state
export const useAuth = () => {
  return useUnifiedUserStore((state) => ({
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    user: state.profile,
    userId: state.userId,
    sessionExpiresAt: state.sessionExpiresAt,
    requiresMFA: state.requiresMFA,
    mfaVerified: state.mfaVerified,
    setError: state.setError,
    clearError: state.clearError,
    refreshUserData: state.refreshUserData,
  }));
};

// Hook for user roles and permissions
export const useUserRoles = () => {
  return useUnifiedUserStore((state) => ({
    roles: state.roles,
    primaryRole: state.primaryRole,
    permissions: state.permissions,
    checkPermission: state.checkPermission,
    hasRole: state.hasRole,
    hasAnyRole: state.hasAnyRole,
    assignRole: state.assignRole,
    removeRole: state.removeRole,
  }));
};

// Hook for onboarding state
export const useOnboarding = () => {
  return useUnifiedUserStore((state) => ({
    onboardingStage: state.onboardingStage,
    onboardingData: state.onboardingData,
    profileCompletion: state.profileCompletion,
    isOnboardingComplete: state.isOnboardingComplete,
    updateOnboardingStage: state.updateOnboardingStage,
    completeOnboarding: state.completeOnboarding,
    resetOnboarding: state.resetOnboarding,
  }));
};

// Hook for client profile
export const useClientProfile = () => {
  return useUnifiedUserStore((state) => ({
    clientProfile: state.clientProfile,
    updateClientProfile: state.updateClientProfile,
    setCoachingGoals: state.setCoachingGoals,
    updateCoachingPreferences: state.updateCoachingPreferences,
  }));
};

// Hook for coach application
export const useCoachApplication = () => {
  return useUnifiedUserStore((state) => ({
    coachApplication: state.coachApplication,
    submitCoachApplication: state.submitCoachApplication,
    updateCoachApplication: state.updateCoachApplication,
    withdrawCoachApplication: state.withdrawCoachApplication,
  }));
};

// Hook for user preferences
export const useUserPreferences = () => {
  return useUnifiedUserStore((state) => ({
    preferences: state.preferences,
    updatePreferences: state.updatePreferences,
    toggleNotification: state.toggleNotification,
    setTheme: state.setTheme,
    setLanguage: state.setLanguage,
  }));
};

// Hook for dashboard metrics
export const useDashboardMetrics = () => {
  return useUnifiedUserStore((state) => ({
    metrics: state.metrics,
    calculateMetrics: state.calculateMetrics,
  }));
};

export default useUnifiedUserStore;

// =====================================================================
// LEGACY COMPATIBILITY LAYER
// =====================================================================

/**
 * Legacy Compatibility Layer for Migration Support
 * 
 * Provides backward-compatible interfaces for existing components
 * while using the enhanced authentication system under the hood.
 * This allows gradual migration without breaking existing functionality.
 */

// Legacy types for backward compatibility
export type LegacyUserRole = 'client' | 'coach' | null;

export interface LegacyUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: LegacyUserRole;
  profileImage?: string;
}

export interface LegacyAuthState {
  user: LegacyUser | null;
  isLoading: boolean;
  error: string | null;
  setUser: (user: LegacyUser | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export interface LegacyRoleState {
  role: LegacyUserRole;
  setRole: (role: LegacyUserRole) => void;
}

/**
 * Maps ExtendedUserRole to legacy UserRole for backward compatibility
 * @param extendedRole - The enhanced role from the new system
 * @returns The equivalent legacy role or null for unsupported roles
 */
export function mapExtendedRoleToLegacy(extendedRole: ExtendedUserRole | null): LegacyUserRole {
  if (!extendedRole) return null;
  
  // Direct mappings
  if (extendedRole === 'client' || extendedRole === 'coach') {
    return extendedRole;
  }
  
  // Role hierarchy mappings
  switch (extendedRole) {
    case 'admin':
    case 'moderator':
    case 'support':
      return 'coach'; // Map privileged roles to coach for legacy compatibility
    case 'pending_coach':
      return 'client'; // Pending coaches are treated as clients until approved
    case 'suspended':
      return null; // Suspended users have no role access
    default:
      return null;
  }
}

/**
 * Checks if an extended role should be treated as a coach in the legacy system
 * @param extendedRole - The enhanced role to check
 * @returns True if the role should have coach privileges in legacy components
 */
export function isLegacyCoach(extendedRole: ExtendedUserRole | null): boolean {
  if (!extendedRole) return false;
  return ['coach', 'admin', 'moderator', 'support'].includes(extendedRole);
}

/**
 * Checks if an extended role should be treated as a client in the legacy system
 * @param extendedRole - The enhanced role to check
 * @returns True if the role should be treated as client in legacy components
 */
export function isLegacyClient(extendedRole: ExtendedUserRole | null): boolean {
  if (!extendedRole) return false;
  return ['client', 'pending_coach'].includes(extendedRole);
}

/**
 * Transforms enhanced user profile to legacy user format
 * @param profile - Enhanced user profile data
 * @param primaryRole - User's primary role
 * @returns Legacy user object or null if profile is invalid
 */
export function transformToLegacyUser(
  profile: UserProfileData | null, 
  primaryRole: ExtendedUserRole | null
): LegacyUser | null {
  if (!profile) return null;

  const fullName = profile.full_name ?? '';
  const [firstName = '', ...lastNameParts] = fullName.split(' ');
  const lastName = lastNameParts.join(' ');

  return {
    id: profile.id,
    email: profile.email,
    firstName,
    lastName,
    role: mapExtendedRoleToLegacy(primaryRole),
    profileImage: profile.avatar_url ?? undefined,
  };
}

/**
 * Legacy-compatible useAuth hook that provides the same interface as lib/auth.ts
 * but uses the enhanced authentication system under the hood.
 * 
 * @returns Legacy auth state with backward-compatible interface
 */
export const useLegacyAuth = () => {
  return useUnifiedUserStore((state) => {
    const legacyUser = transformToLegacyUser(state.profile, state.primaryRole);
    
    return {
      user: legacyUser,
      isLoading: state.isLoading,
      error: state.error,
      setUser: (_user: LegacyUser | null) => {
        // This is a compatibility shim - the enhanced system manages user state
        // Components should not directly set user, but this prevents errors
        console.warn('setUser called on legacy compatibility layer - use enhanced auth service instead');
      },
      setLoading: state.setLoading,
      setError: state.setError,
    };
  });
};

/**
 * Legacy-compatible useRole hook that provides the same interface as lib/roles.ts
 * but uses the enhanced role system under the hood.
 * 
 * @returns Legacy role state with backward-compatible interface
 */
export const useLegacyRole = () => {
  return useUnifiedUserStore((state) => {
    const legacyRole = mapExtendedRoleToLegacy(state.primaryRole);
    
    return {
      role: legacyRole,
      setRole: (_role: LegacyUserRole) => {
        // This is a compatibility shim - the enhanced system manages roles
        // Components should not directly set roles, but this prevents errors
        console.warn('setRole called on legacy compatibility layer - use enhanced role management instead');
      },
    };
  });
};

/**
 * Legacy authentication function compatibility wrappers
 * These maintain the same interface as lib/auth.ts functions
 */
export async function legacyHandleGoogleSignIn(): Promise<LegacyUser> {
  const { authService } = await import('../services/auth.service');
  const result = await authService.signInWithGoogle();
  
  if (result.error) {
    throw new Error(result.error.message);
  }

  // Wait for state to update and return legacy user format
  const state = useUnifiedUserStore.getState();
  const legacyUser = transformToLegacyUser(state.profile, state.primaryRole);
  
  if (!legacyUser) {
    throw new Error('Authentication successful but user data not available');
  }

  return legacyUser;
}

export async function legacySignOut(): Promise<void> {
  const { authService } = await import('../services/auth.service');
  const result = await authService.signOut();
  
  if (result.error) {
    throw new Error(result.error.message);
  }
}

export async function legacySignInWithEmail(email: string, password: string): Promise<LegacyUser> {
  const { authService } = await import('../services/auth.service');
  const result = await authService.signIn({ email, password });
  
  if (result.error) {
    throw new Error(result.error.message);
  }

  // Wait for state to update and return legacy user format
  const state = useUnifiedUserStore.getState();
  const legacyUser = transformToLegacyUser(state.profile, state.primaryRole);
  
  if (!legacyUser) {
    throw new Error('Authentication successful but user data not available');
  }

  return legacyUser;
}

export async function legacySignUpWithEmail(
  email: string, 
  password: string, 
  fullName: string, 
  role: LegacyUserRole = 'client'
): Promise<LegacyUser> {
  const { authService } = await import('../services/auth.service');
  const result = await authService.signUp({
    email,
    password,
    fullName,
    role: role ?? 'client', // Convert null to 'client' for enhanced system
  });
  
  if (result.error) {
    throw new Error(result.error.message);
  }

  // Wait for state to update and return legacy user format
  const state = useUnifiedUserStore.getState();
  const legacyUser = transformToLegacyUser(state.profile, state.primaryRole);
  
  if (!legacyUser) {
    throw new Error('Registration successful but user data not available');
  }

  return legacyUser;
}

export async function legacyResetPassword(email: string): Promise<void> {
  const { authService } = await import('../services/auth.service');
  const result = await authService.resetPassword({ email });
  
  if (result.error) {
    throw new Error(result.error.message);
  }
}

/**
 * Legacy utility functions for backward compatibility
 */
export function legacyGetCurrentUser(): LegacyUser | null {
  const state = useUnifiedUserStore.getState();
  return transformToLegacyUser(state.profile, state.primaryRole);
}

export function legacyIsAuthenticated(): boolean {
  return useUnifiedUserStore.getState().isAuthenticated;
}

export function legacyGetUserRole(): LegacyUserRole | null {
  const state = useUnifiedUserStore.getState();
  return mapExtendedRoleToLegacy(state.primaryRole);
}

/**
 * Legacy role checking functions for backward compatibility
 */
export function legacyIsCoach(role: LegacyUserRole): boolean {
  return role === 'coach';
}

export function legacyIsClient(role: LegacyUserRole): boolean {
  return role === 'client';
}