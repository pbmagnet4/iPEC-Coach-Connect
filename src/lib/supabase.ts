/**
 * Supabase Client Configuration for iPEC Coach Connect
 * 
 * This module provides a comprehensive Supabase client setup with:
 * - TypeScript support and type safety
 * - Authentication management
 * - Database operations with RLS
 * - Real-time subscriptions
 * - File storage capabilities
 * - Error handling and logging
 * - Connection monitoring
 */

import { createClient, SupabaseClient, AuthSession, AuthUser, AuthError } from '@supabase/supabase-js';
import { Database } from '../types/database';
import { logAuth, logDatabase, secureLogger } from './secure-logger';

// Environment validation
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Use placeholder values for development if real credentials are not provided
const isDevelopment = import.meta.env.DEV;
const hasValidCredentials = supabaseUrl && supabaseAnonKey && 
  !supabaseUrl.includes('your-project') && 
  !supabaseAnonKey.includes('your-anon-key');

if (!hasValidCredentials && !isDevelopment) {
  throw new Error(
    'Missing Supabase environment variables. Please check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
  );
}

// Use fallback values for development
const finalUrl = hasValidCredentials ? supabaseUrl : 'https://placeholder.supabase.co';
const finalKey = hasValidCredentials ? supabaseAnonKey : 'placeholder-key';

// Supabase client configuration with optimized settings
export const supabase: SupabaseClient<Database> = createClient<Database>(
  finalUrl,
  finalKey,
  {
    auth: {
      // Persist session in localStorage
      storage: localStorage,
      // Auto refresh tokens before expiry
      autoRefreshToken: true,
      // Persist user session across tabs
      persistSession: true,
      // Detect session in URL hash
      detectSessionInUrl: true,
      // Custom redirect URL for OAuth providers
      redirectTo: window.location.origin,
    },
    realtime: {
      // Enable real-time features
      params: {
        eventsPerSecond: 10,
      },
    },
    db: {
      // Database connection options
      schema: 'public',
    },
    global: {
      headers: {
        'X-Client-Info': 'ipec-coach-connect@1.0.0',
      },
    },
  }
);

// Type definitions for better TypeScript support
export type SupabaseAuthUser = AuthUser;
export type SupabaseAuthSession = AuthSession;
export type SupabaseAuthError = AuthError;

// Database table type helpers
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export type Coach = Database['public']['Tables']['coaches']['Row'];
export type CoachInsert = Database['public']['Tables']['coaches']['Insert'];
export type CoachUpdate = Database['public']['Tables']['coaches']['Update'];

export type Session = Database['public']['Tables']['sessions']['Row'];
export type SessionInsert = Database['public']['Tables']['sessions']['Insert'];
export type SessionUpdate = Database['public']['Tables']['sessions']['Update'];

export type Notification = Database['public']['Tables']['notifications']['Row'];
export type NotificationInsert = Database['public']['Tables']['notifications']['Insert'];
export type NotificationUpdate = Database['public']['Tables']['notifications']['Update'];

// Connection status monitoring
export interface ConnectionStatus {
  isConnected: boolean;
  isAuthenticated: boolean;
  lastChecked: Date;
  error?: string;
}

class SupabaseConnectionMonitor {
  private status: ConnectionStatus = {
    isConnected: false,
    isAuthenticated: false,
    lastChecked: new Date(),
  };

  private listeners: ((status: ConnectionStatus) => void)[] = [];

  constructor() {
    this.initializeMonitoring();
  }

  private async initializeMonitoring() {
    // Check initial connection status
    await this.checkConnection();

    // Monitor auth state changes
    supabase.auth.onAuthStateChange((event, session) => {
      this.updateAuthStatus(!!session);
      logAuth(event, !!session?.user, { connectionMonitor: true });
    });

    // Periodic connection checks
    setInterval(() => {
      this.checkConnection();
    }, 30000); // Check every 30 seconds
  }

  private async checkConnection(): Promise<void> {
    try {
      // Skip connection check in development with placeholder credentials
      if (!hasValidCredentials && isDevelopment) {
        this.updateStatus({
          isConnected: false,
          lastChecked: new Date(),
          error: 'Development mode - Supabase credentials not configured',
        });
        return;
      }

      const { data, error } = await supabase.from('profiles').select('id').limit(1);
      
      this.updateStatus({
        isConnected: !error,
        lastChecked: new Date(),
        error: error?.message,
      });
    } catch (error) {
      this.updateStatus({
        isConnected: false,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Unknown connection error',
      });
    }
  }

  private updateAuthStatus(isAuthenticated: boolean) {
    this.updateStatus({ isAuthenticated });
  }

  private updateStatus(updates: Partial<ConnectionStatus>) {
    this.status = { ...this.status, ...updates };
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.status));
  }

  public getStatus(): ConnectionStatus {
    return { ...this.status };
  }

  public onStatusChange(listener: (status: ConnectionStatus) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }
}

// Export connection monitor instance
export const connectionMonitor = new SupabaseConnectionMonitor();

// Utility functions for common operations
export const supabaseUtils = {
  /**
   * Get current authenticated user
   */
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error('Error getting current user:', error);
      return null;
    }
    return user;
  },

  /**
   * Get current session
   */
  async getCurrentSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Error getting current session:', error);
      return null;
    }
    return session;
  },

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const session = await this.getCurrentSession();
    return !!session;
  },

  /**
   * Sign out current user
   */
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  },

  /**
   * Handle storage operations with error handling
   */
  storage: {
    async upload(bucket: string, path: string, file: File) {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) {
        console.error(`Error uploading to ${bucket}/${path}:`, error);
        throw error;
      }
      
      return data;
    },

    async getPublicUrl(bucket: string, path: string) {
      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);
      
      return data.publicUrl;
    },

    async delete(bucket: string, paths: string[]) {
      const { data, error } = await supabase.storage
        .from(bucket)
        .remove(paths);
      
      if (error) {
        console.error(`Error deleting from ${bucket}:`, error);
        throw error;
      }
      
      return data;
    }
  },

  /**
   * Database query helpers with error handling
   */
  db: {
    async safeQuery<T>(queryFn: () => Promise<{ data: T; error: any }>) {
      try {
        const { data, error } = await queryFn();
        
        if (error) {
          console.error('Database query error:', error);
          throw new Error(error.message || 'Database query failed');
        }
        
        return data;
      } catch (error) {
        console.error('Query execution error:', error);
        throw error;
      }
    },

    async healthCheck(): Promise<boolean> {
      try {
        const { error } = await supabase.from('profiles').select('id').limit(1);
        return !error;
      } catch {
        return false;
      }
    }
  }
};

// Error handling utilities
export class SupabaseError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'SupabaseError';
  }
}

export function handleSupabaseError(error: any): SupabaseError {
  if (error?.message) {
    return new SupabaseError(
      error.message,
      error.code,
      error.details
    );
  }
  
  return new SupabaseError('An unknown Supabase error occurred');
}

// Real-time subscription helpers
export const subscriptions = {
  /**
   * Subscribe to table changes with error handling
   */
  subscribeToTable<T>(
    table: string,
    callback: (payload: any) => void,
    filter?: string
  ) {
    const channel = supabase
      .channel(`${table}_changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter
        },
        (payload) => {
          if (import.meta.env.VITE_ENABLE_DEBUG_MODE === 'true') {
            console.log(`📡 ${table} change:`, payload);
          }
          callback(payload);
        }
      )
      .subscribe((status) => {
        if (import.meta.env.VITE_ENABLE_DEBUG_MODE === 'true') {
          console.log(`📡 ${table} subscription status:`, status);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  },

  /**
   * Subscribe to user-specific changes
   */
  subscribeToUserChanges(userId: string, callback: (payload: any) => void) {
    return this.subscribeToTable(
      'profiles',
      callback,
      `id=eq.${userId}`
    );
  },

  /**
   * Subscribe to notifications for a user
   */
  subscribeToNotifications(userId: string, callback: (payload: any) => void) {
    return this.subscribeToTable(
      'notifications',
      callback,
      `user_id=eq.${userId}`
    );
  }
};

// Development utilities
if (import.meta.env.VITE_ENABLE_DEBUG_MODE === 'true') {
  // Expose supabase client to window for debugging
  (window as any).supabase = supabase;
  (window as any).supabaseUtils = supabaseUtils;
  
  secureLogger.debug('🔧 Supabase client initialized for iPEC Coach Connect');
  secureLogger.debug('🔧 Debug mode enabled - supabase client available on window');
}

export default supabase;