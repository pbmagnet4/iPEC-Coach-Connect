/**
 * React Hook for Cache Integration
 * 
 * Provides easy-to-use React hooks for integrating with the multi-level
 * caching system. These hooks handle caching, invalidation, and performance
 * monitoring in React components.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { cacheIntegrationService } from '../cache-integration.service';
import { CacheLevel, CachePriority } from '../cache.service';
import { logPerformance } from '../secure-logger';

export interface UseCacheOptions {
  ttl?: number;
  priority?: CachePriority;
  levels?: CacheLevel[];
  enableRefresh?: boolean;
  refreshInterval?: number;
  onError?: (error: Error) => void;
  onSuccess?: (data: any) => void;
  onCacheHit?: (data: any) => void;
  onCacheMiss?: () => void;
}

export interface CacheState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  isFromCache: boolean;
  lastUpdated: number | null;
  cacheStats: {
    hits: number;
    misses: number;
    hitRate: number;
  };
}

export interface CacheActions {
  refresh: () => Promise<void>;
  invalidate: () => Promise<void>;
  warmCache: () => Promise<void>;
  clearCache: () => Promise<void>;
  getCacheStats: () => any;
}

/**
 * Main caching hook with automatic cache management
 */
export function useCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: UseCacheOptions = {}
): [CacheState<T>, CacheActions] {
  const [state, setState] = useState<CacheState<T>>({
    data: null,
    loading: true,
    error: null,
    isFromCache: false,
    lastUpdated: null,
    cacheStats: {
      hits: 0,
      misses: 0,
      hitRate: 0
    }
  });

  const fetchPromiseRef = useRef<Promise<T> | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const {
    ttl = 15 * 60 * 1000, // 15 minutes default
    priority = CachePriority.MEDIUM,
    levels = [CacheLevel.L1_MEMORY],
    enableRefresh = false,
    refreshInterval = 5 * 60 * 1000, // 5 minutes default
    onError,
    onSuccess,
    onCacheHit,
    onCacheMiss
  } = options;

  // Fetch data with caching
  const fetchData = useCallback(async (forceRefresh = false): Promise<void> => {
    const startTime = performance.now();
    
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      let data: T;
      let isFromCache = false;

      if (!forceRefresh) {
        // Try to get from cache first
        const cachedData = await getCachedData(key);
        if (cachedData !== null) {
          data = cachedData;
          isFromCache = true;
          onCacheHit?.(data);
          logPerformance('useCache cache hit', performance.now() - startTime, { key });
        } else {
          onCacheMiss?.();
        }
      }

      if (!isFromCache || forceRefresh) {
        // Prevent multiple simultaneous fetches
        if (fetchPromiseRef.current) {
          data = await fetchPromiseRef.current;
        } else {
          fetchPromiseRef.current = fetchFn();
          data = await fetchPromiseRef.current;
          fetchPromiseRef.current = null;

          // Cache the fetched data
          await setCachedData(key, data, ttl, priority, levels);
        }

        logPerformance('useCache fetch completed', performance.now() - startTime, { key });
      }

      setState(prev => ({
        ...prev,
        data,
        loading: false,
        isFromCache,
        lastUpdated: Date.now(),
        cacheStats: {
          hits: prev.cacheStats.hits + (isFromCache ? 1 : 0),
          misses: prev.cacheStats.misses + (isFromCache ? 0 : 1),
          hitRate: 0 // Will be calculated below
        }
      }));

      // Calculate hit rate
      setState(prev => ({
        ...prev,
        cacheStats: {
          ...prev.cacheStats,
          hitRate: (prev.cacheStats.hits + prev.cacheStats.misses) > 0 ?
            prev.cacheStats.hits / (prev.cacheStats.hits + prev.cacheStats.misses) : 0
        }
      }));

      onSuccess?.(data);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      setState(prev => ({
        ...prev,
        loading: false,
        error: err,
        cacheStats: {
          ...prev.cacheStats,
          misses: prev.cacheStats.misses + 1,
          hitRate: prev.cacheStats.hits / (prev.cacheStats.hits + prev.cacheStats.misses + 1)
        }
      }));

      onError?.(err);
      logPerformance('useCache fetch error', performance.now() - startTime, { key, error: err.message });
    }
  }, [key, fetchFn, ttl, priority, levels, onError, onSuccess, onCacheHit, onCacheMiss]);

  // Cache actions
  const refresh = useCallback(async (): Promise<void> => {
    await fetchData(true);
  }, [fetchData]);

  const invalidate = useCallback(async (): Promise<void> => {
    await invalidateCachedData(key);
    await fetchData(true);
  }, [key, fetchData]);

  const warmCache = useCallback(async (): Promise<void> => {
    await fetchData(false);
  }, [fetchData]);

  const clearCache = useCallback(async (): Promise<void> => {
    await invalidateCachedData(key);
    setState(prev => ({
      ...prev,
      data: null,
      isFromCache: false,
      lastUpdated: null
    }));
  }, [key]);

  const getCacheStats = useCallback(() => {
    return {
      key,
      ...state.cacheStats,
      lastUpdated: state.lastUpdated,
      isFromCache: state.isFromCache
    };
  }, [key, state]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Setup refresh interval
  useEffect(() => {
    if (enableRefresh && refreshInterval > 0) {
      refreshIntervalRef.current = setInterval(() => {
        fetchData(true);
      }, refreshInterval);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [enableRefresh, refreshInterval, fetchData]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  return [state, { refresh, invalidate, warmCache, clearCache, getCacheStats }];
}

/**
 * Hook for user profile caching
 */
export function useUserProfileCache(
  userId: string,
  fetchFn: () => Promise<any>,
  options: Omit<UseCacheOptions, 'levels' | 'priority'> = {}
) {
  const key = `user_profile:${userId}`;
  
  return useCache(key, fetchFn, {
    ...options,
    levels: [CacheLevel.L1_MEMORY, CacheLevel.L2_LOCALSTORAGE],
    priority: CachePriority.CRITICAL,
    ttl: options.ttl || 15 * 60 * 1000, // 15 minutes
  });
}

/**
 * Hook for coach data caching
 */
export function useCoachDataCache(
  coachId: string,
  fetchFn: () => Promise<any>,
  options: Omit<UseCacheOptions, 'levels' | 'priority'> = {}
) {
  const key = `coach_data:${coachId}`;
  
  return useCache(key, fetchFn, {
    ...options,
    levels: [CacheLevel.L1_MEMORY, CacheLevel.L2_LOCALSTORAGE, CacheLevel.L3_INDEXEDDB],
    priority: CachePriority.HIGH,
    ttl: options.ttl || 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Hook for search results caching
 */
export function useSearchResultsCache(
  query: string,
  filters: any,
  fetchFn: () => Promise<any>,
  options: Omit<UseCacheOptions, 'levels' | 'priority'> = {}
) {
  const key = `search_results:${query}:${btoa(JSON.stringify(filters)).slice(0, 10)}`;
  
  return useCache(key, fetchFn, {
    ...options,
    levels: [CacheLevel.L1_MEMORY],
    priority: CachePriority.MEDIUM,
    ttl: options.ttl || 15 * 60 * 1000, // 15 minutes
  });
}

/**
 * Hook for learning resources caching
 */
export function useLearningResourcesCache(
  resourceId: string,
  fetchFn: () => Promise<any>,
  options: Omit<UseCacheOptions, 'levels' | 'priority'> = {}
) {
  const key = `learning_resource:${resourceId}`;
  
  return useCache(key, fetchFn, {
    ...options,
    levels: [CacheLevel.L1_MEMORY, CacheLevel.L3_INDEXEDDB],
    priority: CachePriority.LOW,
    ttl: options.ttl || 4 * 60 * 60 * 1000, // 4 hours
  });
}

/**
 * Hook for session data caching
 */
export function useSessionDataCache(
  sessionId: string,
  fetchFn: () => Promise<any>,
  options: Omit<UseCacheOptions, 'levels' | 'priority'> = {}
) {
  const key = `session_data:${sessionId}`;
  
  return useCache(key, fetchFn, {
    ...options,
    levels: [CacheLevel.L1_MEMORY],
    priority: CachePriority.HIGH,
    ttl: options.ttl || 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for community posts caching
 */
export function useCommunityPostsCache(
  postId: string,
  fetchFn: () => Promise<any>,
  options: Omit<UseCacheOptions, 'levels' | 'priority'> = {}
) {
  const key = `community_post:${postId}`;
  
  return useCache(key, fetchFn, {
    ...options,
    levels: [CacheLevel.L1_MEMORY, CacheLevel.L2_LOCALSTORAGE],
    priority: CachePriority.MEDIUM,
    ttl: options.ttl || 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Hook for cache performance monitoring
 */
export function useCachePerformance() {
  const [performance, setPerformance] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const refreshPerformance = useCallback(async () => {
    setLoading(true);
    try {
      const stats = await cacheIntegrationService.getCacheStats();
      setPerformance(stats);
    } catch (error) {
  void console.error('Failed to get cache performance:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshPerformance();
    
    // Refresh every 30 seconds
    const interval = setInterval(refreshPerformance, 30000);
    
    return () => clearInterval(interval);
  }, [refreshPerformance]);

  return {
    performance,
    loading,
    refresh: refreshPerformance
  };
}

/**
 * Hook for cache debugging
 */
export function useCacheDebug() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const refreshDebugInfo = useCallback(async () => {
    setLoading(true);
    try {
      const info = await cacheIntegrationService.getDebugInfo();
      setDebugInfo(info);
    } catch (error) {
  void console.error('Failed to get cache debug info:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshDebugInfo();
  }, [refreshDebugInfo]);

  return {
    debugInfo,
    loading,
    refresh: refreshDebugInfo
  };
}

/**
 * Utility functions for cache operations
 */
async function getCachedData(key: string): Promise<any> {
  try {
    // Try different cache levels based on key type
    if (key.includes('user_profile:')) {
      return await cacheIntegrationService.getUserProfile(key.split(':')[1]);
    } else if (key.includes('coach_data:')) {
      return await cacheIntegrationService.getCoachData(key.split(':')[1]);
    } else if (key.includes('search_results:')) {
      const parts = key.split(':');
      return await cacheIntegrationService.getSearchResults(parts[1], {});
    } else if (key.includes('learning_resource:')) {
      return await cacheIntegrationService.getLearningResource(key.split(':')[1]);
    }
    
    return null;
  } catch (error) {
  void console.error('Error getting cached data:', error);
    return null;
  }
}

async function setCachedData(
  key: string,
  data: any,
  ttl: number,
  priority: CachePriority,
  levels: CacheLevel[]
): Promise<void> {
  try {
    // Cache data using appropriate service method
    if (key.includes('user_profile:')) {
      await cacheIntegrationService.cacheUserProfile(key.split(':')[1], data);
    } else if (key.includes('coach_data:')) {
      await cacheIntegrationService.cacheCoachData(key.split(':')[1], data);
    } else if (key.includes('search_results:')) {
      const parts = key.split(':');
      await cacheIntegrationService.cacheSearchResults(parts[1], {}, data);
    } else if (key.includes('learning_resource:')) {
      await cacheIntegrationService.cacheLearningResource(key.split(':')[1], data);
    }
  } catch (error) {
  void console.error('Error setting cached data:', error);
  }
}

async function invalidateCachedData(key: string): Promise<void> {
  try {
    if (key.includes('user_profile:')) {
      await cacheIntegrationService.invalidateUserCache(key.split(':')[1]);
    } else if (key.includes('coach_data:')) {
      await cacheIntegrationService.invalidateCoachCache(key.split(':')[1]);
    } else if (key.includes('search_results:')) {
      await cacheIntegrationService.invalidateSearchCache();
    }
  } catch (error) {
  void console.error('Error invalidating cached data:', error);
  }
}

// Export all hooks and utilities
export default {
  useCache,
  useUserProfileCache,
  useCoachDataCache,
  useSearchResultsCache,
  useLearningResourcesCache,
  useSessionDataCache,
  useCommunityPostsCache,
  useCachePerformance,
  useCacheDebug
};