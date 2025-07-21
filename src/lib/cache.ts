/**
 * Legacy Cache Interface for Backward Compatibility
 * 
 * This file now imports and re-exports the enhanced caching system
 * while maintaining backward compatibility with existing code.
 * 
 * The new caching system provides:
 * - Multi-level caching (L1, L2, L3, Service Worker)
 * - Intelligent cache warming and invalidation
 * - Performance monitoring and analytics
 * - Encryption for sensitive data
 * - Cross-tab synchronization
 * - Offline support
 */

import { logPerformance, logSecurity } from './secure-logger';
import {
  userProfileCache as enhancedUserProfileCache,
  sessionCache as enhancedSessionCache,
  generalCache as enhancedGeneralCache,
  cacheUtils as enhancedCacheUtils,
  CachePriority,
  CacheLevel
} from './cache.service';

// Legacy interfaces for backward compatibility
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  accessCount: number;
  lastAccessed: number;
}

interface CacheConfig {
  maxSize: number;
  defaultTTL: number; // Time to live in milliseconds
  maxMemoryUsage: number; // Max memory usage in bytes
  enableMetrics: boolean;
}

interface CacheMetrics {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
  memoryUsage: number;
  hitRate: number;
}

/**
 * Legacy Memory Cache Wrapper
 * 
 * Wraps the enhanced caching system to provide backward compatibility
 * with the existing MemoryCache interface while utilizing the new
 * multi-level caching capabilities under the hood.
 */
class MemoryCache {
  private enhancedCache: any;
  private config: CacheConfig;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: config.maxSize || 1000,
      defaultTTL: config.defaultTTL || 15 * 60 * 1000, // 15 minutes
      maxMemoryUsage: config.maxMemoryUsage || 50 * 1024 * 1024, // 50MB
      enableMetrics: config.enableMetrics ?? true
    };

    // Use the appropriate enhanced cache based on configuration
    if (config.maxSize === 500) {
      this.enhancedCache = enhancedUserProfileCache;
    } else if (config.maxSize === 100) {
      this.enhancedCache = enhancedSessionCache;
    } else {
      this.enhancedCache = enhancedGeneralCache;
    }
  }

  /**
   * Get data from cache
   */
  get<T>(key: string): T | null {
    try {
      // Use async method synchronously for backward compatibility
      const cached = this.enhancedCache.getFromL1 ? 
        this.enhancedCache.getFromL1(key) : 
        this.enhancedCache.get(key);
      
      return cached;
    } catch (error) {
      logSecurity('Legacy cache get error', { key: key.substring(0, 20), error });
      return null;
    }
  }

  /**
   * Set data in cache
   */
  set<T>(key: string, data: T, ttl?: number): void {
    try {
      const finalTTL = ttl || this.config.defaultTTL;
      const priority = this.determinePriority(key);
      
      // Use the enhanced cache set method
      this.enhancedCache.set(key, data, finalTTL, priority);
      
      if (this.config.enableMetrics) {
        logPerformance('Legacy cache set', 0, {
          key: key.substring(0, 20) + '...',
          ttl: finalTTL
        });
      }
    } catch (error) {
      logSecurity('Legacy cache set error', { key: key.substring(0, 20), error });
    }
  }

  /**
   * Check if key exists in cache
   */
  has(key: string): boolean {
    return this.enhancedCache.has(key);
  }

  /**
   * Delete specific key from cache
   */
  delete(key: string): boolean {
    return this.enhancedCache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.enhancedCache.clear();
    
    logPerformance('Legacy cache cleared', 0, {
      reason: 'manual_clear'
    });
  }

  /**
   * Get data with fallback function
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    return this.enhancedCache.getOrSet(key, fetchFn, ttl, this.determinePriority(key));
  }

  /**
   * Invalidate cache entries by pattern
   */
  invalidateByPattern(pattern: RegExp): number {
    try {
      return this.enhancedCache.invalidateByPattern(pattern);
    } catch (error) {
      logSecurity('Legacy cache pattern invalidation error', { pattern: pattern.toString(), error });
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheMetrics {
    const enhancedStats = this.enhancedCache.getStats();
    
    // Convert enhanced stats to legacy format
    return {
      hits: enhancedStats.hits || 0,
      misses: enhancedStats.misses || 0,
      evictions: enhancedStats.evictions || 0,
      size: enhancedStats.size || 0,
      memoryUsage: enhancedStats.memoryUsage || 0,
      hitRate: enhancedStats.hitRate || 0
    };
  }

  /**
   * Get debug information
   */
  getDebugInfo(): { [key: string]: any } {
    const enhancedDebugInfo = this.enhancedCache.getDebugInfo();
    
    return {
      config: this.config,
      metrics: this.getStats(),
      enhancedCacheInfo: enhancedDebugInfo,
      legacyWrapper: true
    };
  }

  /**
   * Determine cache priority based on key pattern
   */
  private determinePriority(key: string): any {
    if (key.includes('user_profile:') || key.includes('session:')) {
      return CachePriority.CRITICAL;
    } else if (key.includes('coach_data:')) {
      return CachePriority.HIGH;
    } else if (key.includes('search_results:')) {
      return CachePriority.MEDIUM;
    } else {
      return CachePriority.LOW;
    }
  }
}

// Create specialized cache instances with legacy compatibility
export const userProfileCache = new MemoryCache({
  maxSize: 500,
  defaultTTL: 15 * 60 * 1000, // 15 minutes
  maxMemoryUsage: 10 * 1024 * 1024, // 10MB
  enableMetrics: true
});

export const sessionCache = new MemoryCache({
  maxSize: 100,
  defaultTTL: 60 * 60 * 1000, // 1 hour
  maxMemoryUsage: 5 * 1024 * 1024, // 5MB
  enableMetrics: true
});

export const generalCache = new MemoryCache({
  maxSize: 1000,
  defaultTTL: 30 * 60 * 1000, // 30 minutes
  maxMemoryUsage: 20 * 1024 * 1024, // 20MB
  enableMetrics: true
});

// Enhanced cache utility functions with backward compatibility
export const cacheUtils = {
  /**
   * Generate cache key for user profile
   */
  getUserProfileKey: (userId: string): string => enhancedCacheUtils.getUserProfileKey(userId),
  
  /**
   * Generate cache key for coach data
   */
  getCoachDataKey: (userId: string): string => enhancedCacheUtils.getCoachDataKey(userId),
  
  /**
   * Generate cache key for user permissions
   */
  getUserPermissionsKey: (userId: string): string => enhancedCacheUtils.getUserPermissionsKey(userId),
  
  /**
   * Generate cache key for search results
   */
  getSearchResultsKey: (query: string, filters: any): string => 
    enhancedCacheUtils.getSearchResultsKey(query, filters),
  
  /**
   * Generate cache key for learning resources
   */
  getLearningResourceKey: (resourceId: string): string => 
    enhancedCacheUtils.getLearningResourceKey(resourceId),
  
  /**
   * Generate cache key for session data
   */
  getSessionDataKey: (sessionId: string): string => 
    enhancedCacheUtils.getSessionDataKey(sessionId),
  
  /**
   * Generate cache key for community posts
   */
  getCommunityPostKey: (postId: string): string => 
    enhancedCacheUtils.getCommunityPostKey(postId),
  
  /**
   * Invalidate all user-related cache entries
   */
  invalidateUserCache: async (userId: string): Promise<void> => {
    await enhancedCacheUtils.invalidateUserCache(userId);
    
    // Also invalidate legacy cache instances
    const userPattern = new RegExp(`^user.*:${userId}`);
    userProfileCache.invalidateByPattern(userPattern);
    sessionCache.invalidateByPattern(userPattern);
  },
  
  /**
   * Invalidate all coach-related cache entries
   */
  invalidateCoachCache: async (coachId: string): Promise<void> => {
    await enhancedCacheUtils.invalidateCoachCache(coachId);
  },
  
  /**
   * Warm critical cache data
   */
  warmCriticalData: async (userId: string): Promise<void> => {
    await enhancedCacheUtils.warmCriticalData(userId);
  },
  
  /**
   * Get cache statistics for all instances
   */
  getAllStats: (): { [key: string]: CacheMetrics } => {
    const enhancedStats = enhancedCacheUtils.getAllStats();
    
    return {
      userProfile: userProfileCache.getStats(),
      session: sessionCache.getStats(),
      general: generalCache.getStats(),
      enhanced: enhancedStats
    };
  },
  
  /**
   * Get performance metrics for all instances
   */
  getAllPerformanceMetrics: (): any => {
    return enhancedCacheUtils.getAllPerformanceMetrics();
  },
  
  /**
   * Clear all caches
   */
  clearAllCaches: async (): Promise<void> => {
    await enhancedCacheUtils.clearAllCaches();
    
    // Also clear legacy cache instances
    userProfileCache.clear();
    sessionCache.clear();
    generalCache.clear();
  },
  
  /**
   * Get comprehensive debug information
   */
  getDebugInfo: (): { [key: string]: any } => {
    const enhancedDebugInfo = enhancedCacheUtils.getDebugInfo();
    
    return {
      legacy: {
        userProfile: userProfileCache.getDebugInfo(),
        session: sessionCache.getDebugInfo(),
        general: generalCache.getDebugInfo()
      },
      enhanced: enhancedDebugInfo
    };
  }
};

// Export for backward compatibility
export default { 
  userProfileCache, 
  sessionCache, 
  generalCache, 
  cacheUtils,
  
  // Export enhanced cache types for advanced usage
  CachePriority,
  CacheLevel,
  
  // Export enhanced cache instances for direct access
  enhancedUserProfileCache,
  enhancedSessionCache,
  enhancedGeneralCache,
  
  // Enhanced cache utilities
  enhancedCacheUtils
};