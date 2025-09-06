/**
 * Cache Integration Service for iPEC Coach Connect
 * 
 * Provides high-level integration between the application services and the
 * multi-level caching system. This service acts as a bridge between the
 * existing services and the new caching infrastructure.
 * 
 * Features:
 * - Automatic cache strategy selection based on data type
 * - Intelligent cache warming for user login
 * - Cache invalidation on data mutations
 * - Performance monitoring and analytics
 * - Offline support coordination
 * - Service worker integration
 */

import {
  userProfileCache,
  coachDataCache,
  searchResultsCache,
  learningResourcesCache,
  sessionDataCache,
  communityPostsCache,
  cacheUtils,
  CachePriority,
  CacheLevel,
  CACHE_STRATEGIES
} from './cache.service';
import { logPerformance, logSecurity } from './secure-logger';
import type { Profile, Coach, ProfileData, CoachProfile } from '../types/database';

export interface CacheIntegrationConfig {
  enableServiceWorker: boolean;
  enableCacheWarming: boolean;
  enablePerformanceMonitoring: boolean;
  enableOfflineSupport: boolean;
  warmingDelay: number;
  monitoringInterval: number;
}

export interface CacheWarmingPlan {
  userId: string;
  userRole: 'client' | 'coach' | 'admin';
  priority: CachePriority;
  resources: Array<{
    type: 'profile' | 'coach' | 'sessions' | 'learning' | 'community';
    key: string;
    fetchFn: () => Promise<any>;
    ttl?: number;
  }>;
}

export interface CacheInvalidationPlan {
  trigger: 'profile_update' | 'coach_update' | 'session_update' | 'role_change' | 'logout';
  patterns: string[];
  cascadeRules: { [key: string]: string[] };
}

export interface CachePerformanceReport {
  timestamp: number;
  overall: {
    totalHits: number;
    totalMisses: number;
    hitRate: number;
    avgResponseTime: number;
    memoryUsage: number;
  };
  byCache: {
    [cacheName: string]: {
      hits: number;
      misses: number;
      hitRate: number;
      size: number;
      efficiency: number;
    };
  };
  recommendations: string[];
}

/**
 * Cache Integration Service
 */
class CacheIntegrationService {
  private config: CacheIntegrationConfig;
  private serviceWorker: ServiceWorkerRegistration | null = null;
  private performanceMonitor: NodeJS.Timeout | null = null;
  private warmingPlans: Map<string, CacheWarmingPlan> = new Map();

  constructor(config: Partial<CacheIntegrationConfig> = {}) {
    this.config = {
      enableServiceWorker: config.enableServiceWorker ?? true,
      enableCacheWarming: config.enableCacheWarming ?? true,
      enablePerformanceMonitoring: config.enablePerformanceMonitoring ?? true,
      enableOfflineSupport: config.enableOfflineSupport ?? true,
      warmingDelay: config.warmingDelay ?? 1000,
      monitoringInterval: config.monitoringInterval ?? 60000
    };

    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Register service worker if enabled
      if (this.config.enableServiceWorker && 'serviceWorker' in navigator) {
        await this.registerServiceWorker();
      }

      // Start performance monitoring
      if (this.config.enablePerformanceMonitoring) {
        this.startPerformanceMonitoring();
      }

      logPerformance('Cache integration service initialized', 0, {
        config: this.config
      });
    } catch (error) {
      logSecurity('Cache integration initialization failed', { error });
    }
  }

  private async registerServiceWorker(): Promise<void> {
    try {
      this.serviceWorker = await navigator.serviceWorker.register('/sw-cache.js');
      
      // Listen for service worker messages
      navigator.serviceWorker.addEventListener('message', (event) => {
        this.handleServiceWorkerMessage(event);
      });

      logPerformance('Service worker registered', 0, {
        scope: this.serviceWorker.scope
      });
    } catch (error) {
      logSecurity('Service worker registration failed', { error });
    }
  }

  private handleServiceWorkerMessage(event: MessageEvent): void {
    const { type, data } = event.data;
    
    switch (type) {
      case 'PROFILE_SYNC_SUCCESS':
        this.handleProfileSyncSuccess(data);
        break;
      case 'COACH_DATA_SYNC_SUCCESS':
        this.handleCoachDataSyncSuccess(data);
        break;
      case 'SESSION_DATA_SYNC_SUCCESS':
        this.handleSessionDataSyncSuccess(data);
        break;
      default:
        logPerformance('Unknown service worker message', 0, { type });
    }
  }

  private handleProfileSyncSuccess(data: any): void {
    // Update local cache with synced data
    const key = cacheUtils.getUserProfileKey(data.data.id);
    userProfileCache.set(key, data.data, undefined, CachePriority.HIGH);
    
    logPerformance('Profile sync success handled', 0, {
      userId: data.data.id
    });
  }

  private handleCoachDataSyncSuccess(data: any): void {
    // Update local cache with synced data
    const key = cacheUtils.getCoachDataKey(data.data.id);
    coachDataCache.set(key, data.data, undefined, CachePriority.HIGH);
    
    logPerformance('Coach data sync success handled', 0, {
      coachId: data.data.id
    });
  }

  private handleSessionDataSyncSuccess(data: any): void {
    // Update local cache with synced data
    const key = cacheUtils.getSessionDataKey(data.data.id);
    sessionDataCache.set(key, data.data, undefined, CachePriority.HIGH);
    
    logPerformance('Session data sync success handled', 0, {
      sessionId: data.data.id
    });
  }

  /**
   * User Profile Caching Methods
   */
  async cacheUserProfile(userId: string, profile: ProfileData): Promise<void> {
    const key = cacheUtils.getUserProfileKey(userId);
    const strategy = CACHE_STRATEGIES.USER_PROFILE;
    
    try {
      // Cache in memory (L1) and localStorage (L2)
      await userProfileCache.set(key, profile, strategy.ttlByLevel[CacheLevel.L1_MEMORY], strategy.priority);
      
      // Cache in service worker for offline support
      if (this.serviceWorker) {
        navigator.serviceWorker.controller?.postMessage({
          type: 'CACHE_USER_DATA',
          data: { userId, ...profile }
        });
      }
      
      logPerformance('User profile cached', 0, {
        userId,
        strategy: 'USER_PROFILE'
      });
    } catch (error) {
      logSecurity('User profile caching failed', { userId, error });
    }
  }

  async getUserProfile(userId: string): Promise<ProfileData | null> {
    const key = cacheUtils.getUserProfileKey(userId);
    
    try {
      const cached = await userProfileCache.get<ProfileData>(key);
      
      if (cached) {
        logPerformance('User profile cache hit', 0, { userId });
        return cached;
      }
      
      logPerformance('User profile cache miss', 0, { userId });
      return null;
    } catch (error) {
      logSecurity('User profile retrieval failed', { userId, error });
      return null;
    }
  }

  async getUserProfileWithFallback(
    userId: string,
    fetchFn: () => Promise<ProfileData>
  ): Promise<ProfileData> {
    const key = cacheUtils.getUserProfileKey(userId);
    const strategy = CACHE_STRATEGIES.USER_PROFILE;
    
    return userProfileCache.getOrSet(
      key,
      fetchFn,
      strategy.ttlByLevel[CacheLevel.L1_MEMORY],
      strategy.priority
    );
  }

  /**
   * Coach Data Caching Methods
   */
  async cacheCoachData(coachId: string, coach: CoachProfile): Promise<void> {
    const key = cacheUtils.getCoachDataKey(coachId);
    const strategy = CACHE_STRATEGIES.COACH_DATA;
    
    try {
      // Cache in all levels (L1, L2, L3)
      await coachDataCache.set(
        key,
        coach,
        strategy.ttlByLevel[CacheLevel.L1_MEMORY],
        strategy.priority,
        strategy.levels
      );
      
      // Cache in service worker for offline support
      if (this.serviceWorker) {
        navigator.serviceWorker.controller?.postMessage({
          type: 'CACHE_COACH_DATA',
          data: { coachId, ...coach }
        });
      }
      
      logPerformance('Coach data cached', 0, {
        coachId,
        strategy: 'COACH_DATA'
      });
    } catch (error) {
      logSecurity('Coach data caching failed', { coachId, error });
    }
  }

  async getCoachData(coachId: string): Promise<CoachProfile | null> {
    const key = cacheUtils.getCoachDataKey(coachId);
    
    try {
      const cached = await coachDataCache.get<CoachProfile>(key, CacheLevel.L3_INDEXEDDB);
      
      if (cached) {
        logPerformance('Coach data cache hit', 0, { coachId });
        return cached;
      }
      
      logPerformance('Coach data cache miss', 0, { coachId });
      return null;
    } catch (error) {
      logSecurity('Coach data retrieval failed', { coachId, error });
      return null;
    }
  }

  async getCoachDataWithFallback(
    coachId: string,
    fetchFn: () => Promise<CoachProfile>
  ): Promise<CoachProfile> {
    const key = cacheUtils.getCoachDataKey(coachId);
    const strategy = CACHE_STRATEGIES.COACH_DATA;
    
    return coachDataCache.getOrSet(
      key,
      fetchFn,
      strategy.ttlByLevel[CacheLevel.L1_MEMORY],
      strategy.priority
    );
  }

  /**
   * Search Results Caching Methods
   */
  async cacheSearchResults(query: string, filters: any, results: any[]): Promise<void> {
    const key = cacheUtils.getSearchResultsKey(query, filters);
    const strategy = CACHE_STRATEGIES.SEARCH_RESULTS;
    
    try {
      await searchResultsCache.set(
        key,
        results,
        strategy.ttlByLevel[CacheLevel.L1_MEMORY],
        strategy.priority
      );
      
      logPerformance('Search results cached', 0, {
        query,
        resultCount: results.length,
        strategy: 'SEARCH_RESULTS'
      });
    } catch (error) {
      logSecurity('Search results caching failed', { query, error });
    }
  }

  async getSearchResults(query: string, filters: any): Promise<any[] | null> {
    const key = cacheUtils.getSearchResultsKey(query, filters);
    
    try {
      const cached = await searchResultsCache.get<any[]>(key);
      
      if (cached) {
        logPerformance('Search results cache hit', 0, { query });
        return cached;
      }
      
      logPerformance('Search results cache miss', 0, { query });
      return null;
    } catch (error) {
      logSecurity('Search results retrieval failed', { query, error });
      return null;
    }
  }

  /**
   * Learning Resources Caching Methods
   */
  async cacheLearningResource(resourceId: string, resource: any): Promise<void> {
    const key = cacheUtils.getLearningResourceKey(resourceId);
    const strategy = CACHE_STRATEGIES.LEARNING_RESOURCES;
    
    try {
      await learningResourcesCache.set(
        key,
        resource,
        strategy.ttlByLevel[CacheLevel.L1_MEMORY],
        strategy.priority,
        strategy.levels
      );
      
      logPerformance('Learning resource cached', 0, {
        resourceId,
        strategy: 'LEARNING_RESOURCES'
      });
    } catch (error) {
      logSecurity('Learning resource caching failed', { resourceId, error });
    }
  }

  async getLearningResource(resourceId: string): Promise<any | null> {
    const key = cacheUtils.getLearningResourceKey(resourceId);
    
    try {
      const cached = await learningResourcesCache.get<any>(key, CacheLevel.L3_INDEXEDDB);
      
      if (cached) {
        logPerformance('Learning resource cache hit', 0, { resourceId });
        return cached;
      }
      
      logPerformance('Learning resource cache miss', 0, { resourceId });
      return null;
    } catch (error) {
      logSecurity('Learning resource retrieval failed', { resourceId, error });
      return null;
    }
  }

  /**
   * Cache Warming Methods
   */
  async warmUserCache(userId: string, userRole: 'client' | 'coach' | 'admin'): Promise<void> {
    if (!this.config.enableCacheWarming) return;
    
    try {
      // Delay warming to avoid blocking initial page load
      setTimeout(async () => {
        const plan = this.createWarmingPlan(userId, userRole);
        await this.executeWarmingPlan(plan);
      }, this.config.warmingDelay);
    } catch (error) {
      logSecurity('Cache warming failed', { userId, error });
    }
  }

  private createWarmingPlan(userId: string, userRole: 'client' | 'coach' | 'admin'): CacheWarmingPlan {
    const plan: CacheWarmingPlan = {
      userId,
      userRole,
      priority: CachePriority.HIGH,
      resources: []
    };

    // Always warm user profile
    plan.resources.push({
      type: 'profile',
      key: cacheUtils.getUserProfileKey(userId),
      fetchFn: async () => {
        // This would be replaced with actual service call
        return fetch(`/api/profiles/${userId}`).then(res => res.json());
      },
      ttl: CACHE_STRATEGIES.USER_PROFILE.ttlByLevel[CacheLevel.L1_MEMORY]
    });

    // Warm coach data if user is a coach
    if (userRole === 'coach') {
      plan.resources.push({
        type: 'coach',
        key: cacheUtils.getCoachDataKey(userId),
        fetchFn: async () => {
          return fetch(`/api/coaches/${userId}`).then(res => res.json());
        },
        ttl: CACHE_STRATEGIES.COACH_DATA.ttlByLevel[CacheLevel.L1_MEMORY]
      });
    }

    // Warm learning resources for all users
    plan.resources.push({
      type: 'learning',
      key: 'learning_resources_popular',
      fetchFn: async () => {
        return fetch('/api/coaching-resources?popular=true').then(res => res.json());
      },
      ttl: CACHE_STRATEGIES.LEARNING_RESOURCES.ttlByLevel[CacheLevel.L1_MEMORY]
    });

    return plan;
  }

  private async executeWarmingPlan(plan: CacheWarmingPlan): Promise<void> {
    try {
      const warmingPromises = plan.resources.map(async (resource) => {
        try {
          const data = await resource.fetchFn();
          
          switch (resource.type) {
            case 'profile':
              await this.cacheUserProfile(plan.userId, data);
              break;
            case 'coach':
              await this.cacheCoachData(plan.userId, data);
              break;
            case 'learning':
              await learningResourcesCache.set(resource.key, data, resource.ttl, plan.priority);
              break;
          }
        } catch (error) {
          logSecurity('Warming resource failed', { type: resource.type, key: resource.key, error });
        }
      });

      await Promise.all(warmingPromises);
      
      logPerformance('Cache warming completed', 0, {
        userId: plan.userId,
        userRole: plan.userRole,
        resourceCount: plan.resources.length
      });
    } catch (error) {
      logSecurity('Cache warming plan execution failed', { userId: plan.userId, error });
    }
  }

  /**
   * Cache Invalidation Methods
   */
  async invalidateUserCache(userId: string, trigger?: string): Promise<void> {
    try {
      await cacheUtils.invalidateUserCache(userId);
      
      // Invalidate in service worker
      if (this.serviceWorker) {
        navigator.serviceWorker.controller?.postMessage({
          type: 'INVALIDATE_CACHE',
          data: {
            pattern: `user.*:${userId}`,
            cacheTypes: ['ipec-cache-v1-user-data']
          }
        });
      }
      
      logPerformance('User cache invalidated', 0, {
        userId,
        trigger: trigger || 'manual'
      });
    } catch (error) {
      logSecurity('User cache invalidation failed', { userId, error });
    }
  }

  async invalidateCoachCache(coachId: string, trigger?: string): Promise<void> {
    try {
      await cacheUtils.invalidateCoachCache(coachId);
      
      // Invalidate in service worker
      if (this.serviceWorker) {
        navigator.serviceWorker.controller?.postMessage({
          type: 'INVALIDATE_CACHE',
          data: {
            pattern: `coach.*:${coachId}`,
            cacheTypes: ['ipec-cache-v1-coach-data']
          }
        });
      }
      
      logPerformance('Coach cache invalidated', 0, {
        coachId,
        trigger: trigger || 'manual'
      });
    } catch (error) {
      logSecurity('Coach cache invalidation failed', { coachId, error });
    }
  }

  async invalidateSearchCache(): Promise<void> {
    try {
      await searchResultsCache.clear();
      
      logPerformance('Search cache cleared', 0, {});
    } catch (error) {
      logSecurity('Search cache invalidation failed', { error });
    }
  }

  /**
   * Performance Monitoring Methods
   */
  private startPerformanceMonitoring(): void {
    this.performanceMonitor = setInterval(() => {
      this.generatePerformanceReport();
    }, this.config.monitoringInterval);
  }

  private async generatePerformanceReport(): Promise<CachePerformanceReport> {
    try {
      const allStats = cacheUtils.getAllStats();
      const allPerfMetrics = cacheUtils.getAllPerformanceMetrics();
      
      const report: CachePerformanceReport = {
        timestamp: Date.now(),
        overall: {
          totalHits: 0,
          totalMisses: 0,
          hitRate: 0,
          avgResponseTime: 0,
          memoryUsage: 0
        },
        byCache: {},
        recommendations: []
      };

      // Aggregate statistics
      for (const [cacheName, stats] of Object.entries(allStats)) {
        report.overall.totalHits += stats.hits;
        report.overall.totalMisses += stats.misses;
        report.overall.memoryUsage += stats.memoryUsage;
        
        const perfMetrics = allPerfMetrics[cacheName];
        report.overall.avgResponseTime += perfMetrics?.avgAccessTime || 0;
        
        report.byCache[cacheName] = {
          hits: stats.hits,
          misses: stats.misses,
          hitRate: stats.hitRate,
          size: stats.size,
          efficiency: this.calculateCacheEfficiency(stats, perfMetrics)
        };
      }

      // Calculate overall metrics
      const totalRequests = report.overall.totalHits + report.overall.totalMisses;
      report.overall.hitRate = totalRequests > 0 ? report.overall.totalHits / totalRequests : 0;
      report.overall.avgResponseTime = report.overall.avgResponseTime / Object.keys(allStats).length;

      // Generate recommendations
      report.recommendations = this.generateRecommendations(report);

      // Log performance report
      logPerformance('Cache performance report generated', 0, {
        hitRate: report.overall.hitRate,
        memoryUsage: report.overall.memoryUsage,
        recommendationCount: report.recommendations.length
      });

      return report;
    } catch (error) {
      logSecurity('Performance report generation failed', { error });
      throw error;
    }
  }

  private calculateCacheEfficiency(stats: any, perfMetrics: any): number {
    if (!stats || !perfMetrics) return 0;
    
    const hitRateWeight = 0.4;
    const speedWeight = 0.3;
    const memoryWeight = 0.3;
    
    const hitRateScore = stats.hitRate * 100;
    const speedScore = perfMetrics.avgAccessTime < 10 ? 100 : Math.max(0, 100 - perfMetrics.avgAccessTime);
    const memoryScore = stats.memoryUsage < 10 * 1024 * 1024 ? 100 : Math.max(0, 100 - (stats.memoryUsage / (1024 * 1024)));
    
    return hitRateWeight * hitRateScore + speedWeight * speedScore + memoryWeight * memoryScore;
  }

  private generateRecommendations(report: CachePerformanceReport): string[] {
    const recommendations: string[] = [];
    
    // Overall hit rate recommendations
    if (report.overall.hitRate < 0.7) {
      recommendations.push('Consider increasing cache TTL or improving cache warming strategy');
    }
    
    // Memory usage recommendations
    if (report.overall.memoryUsage > 100 * 1024 * 1024) {
      recommendations.push('High memory usage detected - consider enabling compression or reducing cache sizes');
    }
    
    // Per-cache recommendations
    for (const [cacheName, stats] of Object.entries(report.byCache)) {
      if (stats.hitRate < 0.5) {
        recommendations.push(`${cacheName}: Low hit rate detected - review caching strategy`);
      }
      
      if (stats.efficiency < 50) {
        recommendations.push(`${cacheName}: Low efficiency - consider optimization`);
      }
    }
    
    return recommendations;
  }

  /**
   * Utility Methods
   */
  async getCacheStats(): Promise<any> {
    const stats = cacheUtils.getAllStats();
    const perfMetrics = cacheUtils.getAllPerformanceMetrics();
    
    return {
      caches: stats,
      performance: perfMetrics,
      serviceWorker: this.serviceWorker ? 'active' : 'inactive',
      config: this.config
    };
  }

  async clearAllCaches(): Promise<void> {
    try {
      await cacheUtils.clearAllCaches();
      
      // Clear service worker caches
      if (this.serviceWorker) {
        navigator.serviceWorker.controller?.postMessage({
          type: 'CLEAR_ALL_CACHES'
        });
      }
      
      logPerformance('All caches cleared', 0, {});
    } catch (error) {
      logSecurity('Clear all caches failed', { error });
    }
  }

  async getDebugInfo(): Promise<any> {
    return {
      cacheDebugInfo: cacheUtils.getDebugInfo(),
      serviceWorkerStats: await this.getServiceWorkerStats(),
      config: this.config,
      warmingPlans: Array.from(this.warmingPlans.entries()),
      performanceReport: await this.generatePerformanceReport()
    };
  }

  private async getServiceWorkerStats(): Promise<any> {
    if (!this.serviceWorker) return null;
    
    try {
      return new Promise((resolve) => {
        const messageChannel = new MessageChannel();
        
        messageChannel.port1.onmessage = (event) => {
          resolve(event.data);
        };
        
        navigator.serviceWorker.controller?.postMessage({
          type: 'GET_CACHE_STATS'
        }, [messageChannel.port2]);
        
        // Timeout after 5 seconds
        setTimeout(() => resolve(null), 5000);
      });
    } catch (error) {
      logSecurity('Service worker stats retrieval failed', { error });
      return null;
    }
  }

  /**
   * Cleanup Methods
   */
  dispose(): void {
    if (this.performanceMonitor) {
      clearInterval(this.performanceMonitor);
      this.performanceMonitor = null;
    }
    
    this.warmingPlans.clear();
    
    logPerformance('Cache integration service disposed', 0, {});
  }
}

// Export singleton instance
export const cacheIntegrationService = new CacheIntegrationService();

// Export for use in services
export default cacheIntegrationService;