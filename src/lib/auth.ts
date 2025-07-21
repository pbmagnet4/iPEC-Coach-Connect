/**
 * Legacy Auth Integration
 * 
 * This file provides backward compatibility for the existing codebase
 * while integrating with the new Supabase-based authentication service.
 * 
 * It maintains the same interface as the original auth system but
 * delegates to the real authentication service under the hood.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserRole, useRole } from './roles';
import { authService } from '../services/auth.service';
import { compareAuthUsers, comparisonPerformance } from './utils';
import { memoryManager } from './memory-manager';
import type { Profile, Coach } from '../types/database';

// Legacy user interface for backward compatibility
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  profileImage?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

// Transform Supabase auth state to legacy format
function transformAuthState(authState: ReturnType<typeof authService.getState>): User | null {
  if (!authState.user || !authState.profile) {
    return null;
  }

  const fullName = authState.profile.full_name || '';
  const [firstName = '', lastName = ''] = fullName.split(' ');

  return {
    id: authState.user.id,
    email: authState.user.email || '',
    firstName,
    lastName,
    role: authState.role || 'client',
    profileImage: authState.profile.avatar_url || undefined,
  };
}

// Create Zustand store that syncs with auth service
export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: true,
      error: null,
      setUser: (user: User | null) => {
        set({ user });
        // Update role when user changes
        useRole.getState().setRole(user?.role || null);
      },
      setLoading: (isLoading: boolean) => set({ isLoading }),
      setError: (error: string | null) => set({ error }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }),
    }
  )
);

// Initialize auth service subscription after store is created
const initializeAuthSubscription = () => {
  const unsubscribe = authService.onStateChange((authState) => {
    const user = transformAuthState(authState);
    const currentUser = useAuth.getState().user;
    
    // Only update if user has changed to prevent unnecessary re-renders
    // Using optimized comparison instead of inefficient JSON.stringify
    if (!compareAuthUsers(user, currentUser)) {
      useAuth.getState().setUser(user);
      useAuth.setState({ 
        isLoading: authState.isLoading,
        error: null 
      });
    }
  });

  // Register with memory manager instead of global window reference
  const cleanupId = memoryManager.registerListener(
    'legacy_auth_subscription',
    unsubscribe
  );
  
  // Store cleanup function for manual cleanup if needed
  (window as any).__authCleanupId = cleanupId;
  
  return unsubscribe;
};

// Initialize subscription after store is created
const authUnsubscribe = initializeAuthSubscription();

// Development mode: Log performance stats periodically
if (process.env.NODE_ENV === 'development') {
  // Log comparison performance every 30 seconds in development
  const perfInterval = setInterval(() => {
    const metrics = comparisonPerformance.getMetrics();
    if (metrics.totalComparisons > 0) {
      console.log(`🔄 Auth Comparison Stats: ${metrics.totalComparisons} comparisons, ${metrics.cacheHits} cache hits (${((metrics.cacheHits / metrics.totalComparisons) * 100).toFixed(1)}% hit rate)`);
    }
  }, 30000);
  
  // Register interval with memory manager
  memoryManager.registerInterval('auth_performance_logging', perfInterval);
}

/**
 * Handle Google Sign-In using real Supabase authentication
 */
export async function handleGoogleSignIn(): Promise<User> {
  const auth = useAuth.getState();
  auth.setLoading(true);
  auth.setError(null);

  try {
    const result = await authService.signInWithGoogle();
    
    if (result.error) {
      throw new Error(result.error.message);
    }

    // Wait for auth state to update
    const authState = authService.getState();
    const user = transformAuthState(authState);
    
    if (!user) {
      throw new Error('Authentication successful but user data not available');
    }

    return user;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to sign in with Google';
    auth.setError(errorMessage);
    throw new Error(errorMessage);
  } finally {
    auth.setLoading(false);
  }
}

/**
 * Sign out using real Supabase authentication
 */
export async function signOut(): Promise<void> {
  const auth = useAuth.getState();
  auth.setLoading(true);
  auth.setError(null);

  try {
    const result = await authService.signOut();
    
    if (result.error) {
      throw new Error(result.error.message);
    }

    // State will be updated automatically via auth service subscription
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to sign out';
    auth.setError(errorMessage);
    throw new Error(errorMessage);
  } finally {
    auth.setLoading(false);
  }
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(email: string, password: string): Promise<User> {
  const auth = useAuth.getState();
  auth.setLoading(true);
  auth.setError(null);

  try {
    const result = await authService.signIn({ email, password });
    
    if (result.error) {
      throw new Error(result.error.message);
    }

    // Wait for auth state to update
    const authState = authService.getState();
    const user = transformAuthState(authState);
    
    if (!user) {
      throw new Error('Authentication successful but user data not available');
    }

    return user;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to sign in';
    auth.setError(errorMessage);
    throw new Error(errorMessage);
  } finally {
    auth.setLoading(false);
  }
}

/**
 * Sign up with email and password
 */
export async function signUpWithEmail(
  email: string, 
  password: string, 
  fullName: string, 
  role: UserRole = 'client'
): Promise<User> {
  const auth = useAuth.getState();
  auth.setLoading(true);
  auth.setError(null);

  try {
    const result = await authService.signUp({
      email,
      password,
      fullName,
      role,
    });
    
    if (result.error) {
      throw new Error(result.error.message);
    }

    // Wait for auth state to update
    const authState = authService.getState();
    const user = transformAuthState(authState);
    
    if (!user) {
      throw new Error('Registration successful but user data not available');
    }

    return user;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to sign up';
    auth.setError(errorMessage);
    throw new Error(errorMessage);
  } finally {
    auth.setLoading(false);
  }
}

/**
 * Reset password
 */
export async function resetPassword(email: string): Promise<void> {
  const auth = useAuth.getState();
  auth.setError(null);

  try {
    const result = await authService.resetPassword({ email });
    
    if (result.error) {
      throw new Error(result.error.message);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to reset password';
    auth.setError(errorMessage);
    throw new Error(errorMessage);
  }
}

/**
 * Get current authenticated user
 */
export function getCurrentUser(): User | null {
  return useAuth.getState().user;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!useAuth.getState().user;
}

/**
 * Get user's role
 */
export function getUserRole(): UserRole | null {
  return useAuth.getState().user?.role || null;
}

// Cleanup function for auth subscription
if (typeof window !== 'undefined') {
  const handleUnload = () => {
    // Clean up via memory manager
    const cleanupId = (window as any).__authCleanupId;
    if (cleanupId) {
      memoryManager.cleanup(cleanupId);
    }
    
    // Fallback cleanup
    if (authUnsubscribe) {
      authUnsubscribe();
    }
  };
  
  // Register unload handler with memory manager
  memoryManager.registerEventListener(
    'legacy_auth_unload',
    window,
    'beforeunload',
    handleUnload
  );
}