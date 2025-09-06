/**
 * Supabase Subscription Cleanup Patterns
 * 
 * Provides utilities for managing Supabase subscriptions with automatic cleanup
 * and memory management integration to prevent memory leaks.
 */

import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { memoryManager } from './memory-manager';
import { logPerformance, logSecurity } from './secure-logger';

// Subscription management interfaces
interface SupabaseSubscription {
  id: string;
  channel: RealtimeChannel;
  table: string;
  filter?: string;
  event?: string;
  callback: (payload: RealtimePostgresChangesPayload<any>) => void;
  createdAt: number;
  component?: any;
  cleanupId?: string;
}

interface SubscriptionConfig {
  table: string;
  filter?: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  callback: (payload: RealtimePostgresChangesPayload<any>) => void;
  component?: any;
  autoCleanup?: boolean;
  maxAge?: number; // Maximum age in milliseconds
}

interface SubscriptionStats {
  totalSubscriptions: number;
  activeChannels: number;
  oldestSubscription: number;
  newestSubscription: number;
  memoryUsage: number;
}

/**
 * Supabase Subscription Manager
 * 
 * Centralized management of Supabase realtime subscriptions with automatic cleanup
 */
class SupabaseSubscriptionManager {
  private static instance: SupabaseSubscriptionManager;
  private subscriptions = new Map<string, SupabaseSubscription>();
  private channelReferences = new Map<string, Set<string>>();
  private componentSubscriptions = new WeakMap<any, Set<string>>();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private isDestroyed = false;

  private constructor() {
    this.initializeCleanup();
  }

  static getInstance(): SupabaseSubscriptionManager {
    if (!SupabaseSubscriptionManager.instance) {
      SupabaseSubscriptionManager.instance = new SupabaseSubscriptionManager();
    }
    return SupabaseSubscriptionManager.instance;
  }

  /**
   * Create a new Supabase subscription with automatic cleanup
   */
  subscribe(config: SubscriptionConfig): string {
    if (this.isDestroyed) {
      throw new Error('SupabaseSubscriptionManager is destroyed');
    }

    const subscriptionId = this.generateSubscriptionId(config);
    const channelName = this.getChannelName(config.table, config.filter);

    try {
      // Create or reuse channel
      const channel = this.getOrCreateChannel(channelName);
      
      // Create subscription
      const subscription: SupabaseSubscription = {
        id: subscriptionId,
        channel,
        table: config.table,
        filter: config.filter,
        event: config.event,
        callback: config.callback,
        createdAt: Date.now(),
        component: config.component
      };

      // Setup the subscription
      channel.on(
        'postgres_changes',
        {
          event: config.event || '*',
          schema: 'public',
          table: config.table,
          filter: config.filter
        },
        (payload) => {
          if (this.subscriptions.has(subscriptionId)) {
            try {
              config.callback(payload);
            } catch (error) {
              logSecurity('Supabase subscription callback error', 'low', {
                subscriptionId,
                table: config.table,
                error: error instanceof Error ? error.message : 'Unknown error'
              });
            }
          }
        }
      );

      // Subscribe to channel if not already subscribed
      if (channel.state === 'closed') {
        channel.subscribe();
      }

      // Store subscription
      this.subscriptions.set(subscriptionId, subscription);

      // Track channel reference
      if (!this.channelReferences.has(channelName)) {
        this.channelReferences.set(channelName, new Set());
      }
      this.channelReferences.get(channelName)!.add(subscriptionId);

      // Track component subscription
      if (config.component) {
        if (!this.componentSubscriptions.has(config.component)) {
          this.componentSubscriptions.set(config.component, new Set());
        }
        this.componentSubscriptions.get(config.component)!.add(subscriptionId);
      }

      // Register with memory manager
      const cleanupId = memoryManager.registerSubscription(
        `supabase_${subscriptionId}`,
        { unsubscribe: () => this.unsubscribe(subscriptionId) },
        config.component
      );

      subscription.cleanupId = cleanupId;

      logPerformance('Supabase subscription created', 0, {
        subscriptionId,
        table: config.table,
        channelName,
        totalSubscriptions: this.subscriptions.size
      });

      return subscriptionId;
    } catch (error) {
      logSecurity('Failed to create Supabase subscription', 'medium', {
        table: config.table,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Unsubscribe from a specific subscription
   */
  unsubscribe(subscriptionId: string): boolean {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      return false;
    }

    try {
      // Remove from subscriptions
      this.subscriptions.delete(subscriptionId);

      // Clean up channel reference
      const channelName = this.getChannelName(subscription.table, subscription.filter);
      const channelRefs = this.channelReferences.get(channelName);
      if (channelRefs) {
        channelRefs.delete(subscriptionId);
        
        // If no more references, unsubscribe from channel
        if (channelRefs.size === 0) {
          subscription.channel.unsubscribe();
          this.channelReferences.delete(channelName);
        }
      }

      // Clean up component reference
      if (subscription.component) {
        const componentSubs = this.componentSubscriptions.get(subscription.component);
        if (componentSubs) {
          componentSubs.delete(subscriptionId);
          if (componentSubs.size === 0) {
            this.componentSubscriptions.delete(subscription.component);
          }
        }
      }

      // Clean up memory manager registration
      if (subscription.cleanupId) {
        memoryManager.cleanup(subscription.cleanupId);
      }

      logPerformance('Supabase subscription removed', 0, {
        subscriptionId,
        table: subscription.table,
        totalSubscriptions: this.subscriptions.size
      });

      return true;
    } catch (error) {
      logSecurity('Failed to unsubscribe from Supabase subscription', 'medium', {
        subscriptionId,
        table: subscription.table,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  /**
   * Unsubscribe all subscriptions for a component
   */
  unsubscribeComponent(component: any): number {
    const subscriptionIds = this.componentSubscriptions.get(component);
    if (!subscriptionIds || subscriptionIds.size === 0) {
      return 0;
    }

    let unsubscribed = 0;
    const subscriptionIdArray = Array.from(subscriptionIds);

    for (const subscriptionId of subscriptionIdArray) {
      if (this.unsubscribe(subscriptionId)) {
        unsubscribed++;
      }
    }

    logPerformance('Component subscriptions cleaned up', 0, {
      component: component.constructor?.name || 'unknown',
      unsubscribed,
      totalSubscriptions: this.subscriptions.size
    });

    return unsubscribed;
  }

  /**
   * Unsubscribe all subscriptions for a table
   */
  unsubscribeTable(table: string): number {
    const subscriptionsToRemove = Array.from(this.subscriptions.values())
      .filter(sub => sub.table === table)
      .map(sub => sub.id);

    let unsubscribed = 0;
    for (const subscriptionId of subscriptionsToRemove) {
      if (this.unsubscribe(subscriptionId)) {
        unsubscribed++;
      }
    }

    logPerformance('Table subscriptions cleaned up', 0, {
      table,
      unsubscribed,
      totalSubscriptions: this.subscriptions.size
    });

    return unsubscribed;
  }

  /**
   * Unsubscribe all subscriptions
   */
  unsubscribeAll(): number {
    const subscriptionIds = Array.from(this.subscriptions.keys());
    let unsubscribed = 0;

    for (const subscriptionId of subscriptionIds) {
      if (this.unsubscribe(subscriptionId)) {
        unsubscribed++;
      }
    }

    logPerformance('All Supabase subscriptions cleaned up', 0, {
      unsubscribed
    });

    return unsubscribed;
  }

  /**
   * Get subscription statistics
   */
  getStats(): SubscriptionStats {
    const subscriptions = Array.from(this.subscriptions.values());
    const now = Date.now();
    
    return {
      totalSubscriptions: subscriptions.length,
      activeChannels: this.channelReferences.size,
      oldestSubscription: subscriptions.length > 0 
        ? now - Math.min(...subscriptions.map(s => s.createdAt))
        : 0,
      newestSubscription: subscriptions.length > 0
        ? now - Math.max(...subscriptions.map(s => s.createdAt))
        : 0,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  /**
   * Get subscription details
   */
  getSubscriptionDetails(subscriptionId: string): SupabaseSubscription | null {
    return this.subscriptions.get(subscriptionId) || null;
  }

  /**
   * Get all subscriptions for a component
   */
  getComponentSubscriptions(component: any): SupabaseSubscription[] {
    const subscriptionIds = this.componentSubscriptions.get(component);
    if (!subscriptionIds) return [];

    return Array.from(subscriptionIds)
      .map(id => this.subscriptions.get(id))
      .filter(sub => sub !== undefined);
  }

  /**
   * Get all subscriptions for a table
   */
  getTableSubscriptions(table: string): SupabaseSubscription[] {
    return Array.from(this.subscriptions.values())
      .filter(sub => sub.table === table);
  }

  /**
   * Check if a subscription exists
   */
  hasSubscription(subscriptionId: string): boolean {
    return this.subscriptions.has(subscriptionId);
  }

  /**
   * Destroy the subscription manager
   */
  destroy(): void {
    if (this.isDestroyed) return;

    this.isDestroyed = true;

    // Unsubscribe from all subscriptions
    this.unsubscribeAll();

    // Clear cleanup interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    // Clear all maps
    this.subscriptions.clear();
    this.channelReferences.clear();

    logSecurity('SupabaseSubscriptionManager destroyed', 'low');
  }

  /**
   * Generate unique subscription ID
   */
  private generateSubscriptionId(config: SubscriptionConfig): string {
    const base = `${config.table}_${config.event || 'all'}_${config.filter || 'none'}`;
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `${base}_${timestamp}_${random}`;
  }

  /**
   * Get channel name for table and filter
   */
  private getChannelName(table: string, filter?: string): string {
    return `${table}_${filter || 'all'}`;
  }

  /**
   * Get or create channel
   */
  private getOrCreateChannel(channelName: string): RealtimeChannel {
    // Check if channel already exists
    const existingChannel = supabase.channel(channelName);
    if (existingChannel.state !== 'closed') {
      return existingChannel;
    }

    // Create new channel
    return supabase.channel(channelName);
  }

  /**
   * Initialize cleanup process
   */
  private initializeCleanup(): void {
    // Clean up old subscriptions every 5 minutes
    this.cleanupInterval = setInterval(() => {
      if (this.isDestroyed) return;

      const now = Date.now();
      const maxAge = 60 * 60 * 1000; // 1 hour
      const oldSubscriptions: string[] = [];

      // Find old subscriptions
      for (const [id, subscription] of this.subscriptions) {
        if (now - subscription.createdAt > maxAge) {
          oldSubscriptions.push(id);
        }
      }

      // Remove old subscriptions
      for (const id of oldSubscriptions) {
        this.unsubscribe(id);
      }

      if (oldSubscriptions.length > 0) {
        logPerformance('Old Supabase subscriptions cleaned up', 0, {
          cleaned: oldSubscriptions.length,
          remaining: this.subscriptions.size
        });
      }
    }, 5 * 60 * 1000); // 5 minutes

    // Register cleanup interval with memory manager
    memoryManager.registerInterval('supabase_cleanup', this.cleanupInterval, this);
  }

  /**
   * Estimate memory usage
   */
  private estimateMemoryUsage(): number {
    let estimate = 0;
    
    // Base overhead
    estimate += 1024; // 1KB base
    
    // Subscriptions
    estimate += this.subscriptions.size * 500; // ~500 bytes per subscription
    
    // Channel references
    estimate += this.channelReferences.size * 200; // ~200 bytes per channel
    
    // Component subscriptions (WeakMap doesn't count)
    estimate += this.componentSubscriptions.size * 100; // ~100 bytes per component
    
    return estimate;
  }
}

// Export singleton instance
export const supabaseSubscriptionManager = SupabaseSubscriptionManager.getInstance();

// Utility functions for easier use
export const {
  subscribe: createSupabaseSubscription,
  unsubscribe: removeSupabaseSubscription,
  unsubscribeComponent: cleanupComponentSubscriptions,
  unsubscribeTable: cleanupTableSubscriptions,
  unsubscribeAll: cleanupAllSubscriptions,
  getStats: getSubscriptionStats,
  getSubscriptionDetails,
  getComponentSubscriptions,
  getTableSubscriptions,
  hasSubscription,
  destroy: destroySubscriptionManager
} = supabaseSubscriptionManager;

// Enhanced subscription hooks for React components
export interface UseSupabaseSubscriptionOptions {
  table: string;
  filter?: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  enabled?: boolean;
  onError?: (error: Error) => void;
}

/**
 * React hook for Supabase subscriptions with automatic cleanup
 */
export function useSupabaseSubscription<T = any>(
  options: UseSupabaseSubscriptionOptions,
  callback: (payload: RealtimePostgresChangesPayload<T>) => void
): {
  subscriptionId: string | null;
  isSubscribed: boolean;
  error: Error | null;
  resubscribe: () => void;
  unsubscribe: () => void;
} {
  const [subscriptionId, setSubscriptionId] = React.useState<string | null>(null);
  const [isSubscribed, setIsSubscribed] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const componentRef = React.useRef<any>();

  const { table, filter, event, enabled = true, onError } = options;

  const subscribe = React.useCallback(() => {
    if (!enabled) return;

    try {
      const id = supabaseSubscriptionManager.subscribe({
        table,
        filter,
        event,
        callback: (payload) => {
          try {
            callback(payload);
          } catch (err) {
            const error = err instanceof Error ? err : new Error('Callback error');
            setError(error);
            onError?.(error);
          }
        },
        component: componentRef.current
      });

      setSubscriptionId(id);
      setIsSubscribed(true);
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Subscription error');
      setError(error);
      onError?.(error);
    }
  }, [table, filter, event, enabled, callback, onError]);

  const unsubscribe = React.useCallback(() => {
    if (subscriptionId) {
      supabaseSubscriptionManager.unsubscribe(subscriptionId);
      setSubscriptionId(null);
      setIsSubscribed(false);
    }
  }, [subscriptionId]);

  const resubscribe = React.useCallback(() => {
    unsubscribe();
    subscribe();
  }, [unsubscribe, subscribe]);

  React.useEffect(() => {
    componentRef.current = {};
    subscribe();

    return () => {
      unsubscribe();
    };
  }, [subscribe, unsubscribe]);

  return {
    subscriptionId,
    isSubscribed,
    error,
    resubscribe,
    unsubscribe
  };
}

/**
 * React hook for multiple Supabase subscriptions
 */
export function useSupabaseSubscriptions<T = any>(
  subscriptions: UseSupabaseSubscriptionOptions[],
  callbacks: ((payload: RealtimePostgresChangesPayload<T>) => void)[]
): {
  subscriptionIds: string[];
  allSubscribed: boolean;
  errors: (Error | null)[];
  resubscribeAll: () => void;
  unsubscribeAll: () => void;
} {
  const [subscriptionIds, setSubscriptionIds] = React.useState<string[]>([]);
  const [errors, setErrors] = React.useState<(Error | null)[]>([]);
  const componentRef = React.useRef<any>();

  const subscribe = React.useCallback(() => {
    const ids: string[] = [];
    const errs: (Error | null)[] = [];

    subscriptions.forEach((options, index) => {
      if (!options.enabled) {
        ids.push('');
        errs.push(null);
        return;
      }

      try {
        const id = supabaseSubscriptionManager.subscribe({
          ...options,
          callback: callbacks[index],
          component: componentRef.current
        });

        ids.push(id);
        errs.push(null);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Subscription error');
        ids.push('');
        errs.push(error);
        options.onError?.(error);
      }
    });

    setSubscriptionIds(ids);
    setErrors(errs);
  }, [subscriptions, callbacks]);

  const unsubscribe = React.useCallback(() => {
    subscriptionIds.forEach(id => {
      if (id) {
        supabaseSubscriptionManager.unsubscribe(id);
      }
    });
    setSubscriptionIds([]);
    setErrors([]);
  }, [subscriptionIds]);

  const resubscribeAll = React.useCallback(() => {
    unsubscribe();
    subscribe();
  }, [unsubscribe, subscribe]);

  React.useEffect(() => {
    componentRef.current = {};
    subscribe();

    return () => {
      unsubscribe();
    };
  }, [subscribe, unsubscribe]);

  return {
    subscriptionIds,
    allSubscribed: subscriptionIds.every(id => id !== ''),
    errors,
    resubscribeAll,
    unsubscribeAll: unsubscribe
  };
}

// Auto-cleanup on page unload
if (typeof window !== 'undefined') {
  const handleUnload = () => {
    supabaseSubscriptionManager.destroy();
  };

  window.addEventListener('beforeunload', handleUnload);
  window.addEventListener('unload', handleUnload);
  
  // Register with memory manager
  memoryManager.registerEventListener('supabase_manager_unload', window, 'beforeunload', handleUnload);
  memoryManager.registerEventListener('supabase_manager_unload', window, 'unload', handleUnload);
}

// Export types
export type {
  SupabaseSubscription,
  SubscriptionConfig,
  SubscriptionStats,
  UseSupabaseSubscriptionOptions
};

// Import React for hooks
import React from 'react';

export default supabaseSubscriptionManager;