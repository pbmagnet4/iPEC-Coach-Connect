export function cn(...classes: (string | undefined | boolean)[]) {
  return classes.filter(Boolean).join(' ');
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase();
}

/**
 * Performance monitoring utilities for state comparison optimization
 */
interface ComparisonMetrics {
  totalComparisons: number;
  cacheHits: number;
  avgComparisonTime: number;
  maxComparisonTime: number;
  comparisonsPerSecond: number;
  lastResetTime: number;
}

class ComparisonPerformanceMonitor {
  private metrics: ComparisonMetrics = {
    totalComparisons: 0,
    cacheHits: 0,
    avgComparisonTime: 0,
    maxComparisonTime: 0,
    comparisonsPerSecond: 0,
    lastResetTime: Date.now()
  };

  private recentTimes: number[] = [];
  private readonly maxRecentTimes = 100; // Keep last 100 measurements

  startTiming(): () => number {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
  void his.recordTiming(duration);
      return duration;
    };
  }

  private recordTiming(duration: number): void {
    this.metrics.totalComparisons++;
    this.metrics.maxComparisonTime = Math.max(this.metrics.maxComparisonTime, duration);
    
    // Update recent times for rolling average
    this.recentTimes.push(duration);
    if (this.recentTimes.length > this.maxRecentTimes) {
      this.recentTimes.shift();
    }
    
    // Calculate rolling average
    this.metrics.avgComparisonTime = this.recentTimes.reduce((sum, time) => sum + time, 0) / this.recentTimes.length;
    
    // Calculate comparisons per second
    const timeSinceReset = Date.now() - this.metrics.lastResetTime;
    this.metrics.comparisonsPerSecond = (this.metrics.totalComparisons / timeSinceReset) * 1000;
  }

  recordCacheHit(): void {
    this.metrics.cacheHits++;
  }

  getMetrics(): ComparisonMetrics {
    return { ...this.metrics };
  }

  reset(): void {
    this.metrics = {
      totalComparisons: 0,
      cacheHits: 0,
      avgComparisonTime: 0,
      maxComparisonTime: 0,
      comparisonsPerSecond: 0,
      lastResetTime: Date.now()
    };
    this.recentTimes = [];
  }

  // Performance warning thresholds
  checkPerformanceWarnings(): string[] {
    const warnings: string[] = [];
    
    if (this.metrics.avgComparisonTime > 1) {
  void warnings.push(`Average comparison time (${this.metrics.avgComparisonTime.toFixed(2)}ms) exceeds 1ms threshold`);
    }
    
    if (this.metrics.maxComparisonTime > 5) {
  void warnings.push(`Maximum comparison time (${this.metrics.maxComparisonTime.toFixed(2)}ms) exceeds 5ms threshold`);
    }
    
    const cacheHitRate = this.metrics.totalComparisons > 0 ? (this.metrics.cacheHits / this.metrics.totalComparisons) * 100 : 0;
    if (cacheHitRate < 50 && this.metrics.totalComparisons > 10) {
  void warnings.push(`Cache hit rate (${cacheHitRate.toFixed(1)}%) is below 50%`);
    }
    
    return warnings;
  }
}

// Global performance monitor instance
const performanceMonitor = new ComparisonPerformanceMonitor();

/**
 * Optimized shallow equality comparison for objects
 * Eliminates O(n²) complexity and adds fast path optimizations
 * 
 * Performance optimizations:
 * - Reference equality fast path
 * - Size-based early exit
 * - Set-based key lookup (O(1) instead of O(n))
 * - Null/undefined handling
 * - Performance monitoring
 */
export function shallowEqual<T extends Record<string, any>>(obj1: T | null, obj2: T | null): boolean {
  const endTiming = performanceMonitor.startTiming();
  
  try {
    // Fast path: Reference equality
    if (obj1 === obj2) return true;
    
    // Fast path: Null/undefined cases
    if (obj1 === null || obj2 === null) return false;
    if (obj1 === undefined || obj2 === undefined) return false;
    
    // Get object keys
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    
    // Fast path: Different number of properties
    if (keys1.length !== keys2.length) return false;
    
    // Fast path: Empty objects
    if (keys1.length === 0) return true;
    
    // Optimized comparison using Set for O(1) key lookup
    const keys2Set = new Set(keys2);
    
    // Compare each property
    for (const key of keys1) {
      if (!keys2Set.has(key)) return false;
      if (obj1[key] !== obj2[key]) return false;
    }
    
    return true;
  } finally {
    endTiming();
  }
}

/**
 * Simple comparison cache for expensive repeated comparisons
 * Uses WeakMap for automatic garbage collection
 */
class ComparisonCache {
  private cache = new WeakMap<object, WeakMap<object, boolean>>();
  private maxCacheSize = 1000;
  private cacheSize = 0;

  get(obj1: object, obj2: object): boolean | undefined {
    const obj1Cache = this.cache.get(obj1);
    if (obj1Cache) {
      const result = obj1Cache.get(obj2);
      if (result !== undefined) {
  void performanceMonitor.recordCacheHit();
        return result;
      }
    }
    return undefined;
  }

  set(obj1: object, obj2: object, result: boolean): void {
    // Prevent cache from growing too large
    if (this.cacheSize >= this.maxCacheSize) {
      return;
    }

    let obj1Cache = this.cache.get(obj1);
    if (!obj1Cache) {
      obj1Cache = new WeakMap();
      this.cache.set(obj1, obj1Cache);
    }
    
    if (!obj1Cache.has(obj2)) {
  void obj1Cache.set(obj2, result);
      this.cacheSize++;
    }
  }
}

const comparisonCache = new ComparisonCache();

/**
 * Type-specific comparison utility for auth user objects
 * Optimized for the specific fields that matter for auth state
 */
interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  profileImage?: string;
}

/**
 * Ultra-optimized auth user comparison with type safety
 * Compares only essential fields that matter for auth state changes
 */
export function compareAuthUsers(user1: AuthUser | null | undefined, user2: AuthUser | null | undefined): boolean {
  const endTiming = performanceMonitor.startTiming();
  
  try {
    // Fast path: Reference equality
    if (user1 === user2) return true;
    
    // Fast path: Null/undefined cases
    if (user1 === null || user2 === null) return false;
    if (user1 === undefined || user2 === undefined) return false;
    
    // Check cache first (before reference equality to track cache usage)
    if (typeof user1 === 'object' && typeof user2 === 'object') {
      const cachedResult = comparisonCache.get(user1, user2);
      if (cachedResult !== undefined) {
        return cachedResult;
      }
    }
    
    // Compare essential auth fields efficiently
    // Order by likelihood of difference for early exit
    const result = (
      user1.id === user2.id &&
      user1.email === user2.email &&
      user1.role === user2.role &&
      user1.firstName === user2.firstName &&
      user1.lastName === user2.lastName &&
      user1.profileImage === user2.profileImage
    );
    
    // Cache the result
    if (typeof user1 === 'object' && typeof user2 === 'object') {
  void comparisonCache.set(user1, user2, result);
    }
    
    return result;
  } finally {
    endTiming();
  }
}

/**
 * Type-specific comparison for Profile objects
 * Optimized for database Profile type
 */
export function compareProfiles(
  profile1: { id: string; username: string | null; full_name: string | null; avatar_url: string | null; bio: string | null; phone: string | null; location: string | null; timezone: string | null; updated_at: string } | null,
  profile2: { id: string; username: string | null; full_name: string | null; avatar_url: string | null; bio: string | null; phone: string | null; location: string | null; timezone: string | null; updated_at: string } | null
): boolean {
  const endTiming = performanceMonitor.startTiming();
  
  try {
    // Fast path: Reference equality
    if (profile1 === profile2) return true;
    
    // Fast path: Null/undefined cases
    if (!profile1 || !profile2) return false;
    
    // Check cache first
    const cachedResult = comparisonCache.get(profile1, profile2);
    if (cachedResult !== undefined) {
      return cachedResult;
    }
    
    // Compare essential profile fields
    // Order by likelihood of difference and importance
    const result = (
      profile1.id === profile2.id &&
      profile1.updated_at === profile2.updated_at &&
      profile1.full_name === profile2.full_name &&
      profile1.username === profile2.username &&
      profile1.avatar_url === profile2.avatar_url &&
      profile1.bio === profile2.bio &&
      profile1.phone === profile2.phone &&
      profile1.location === profile2.location &&
      profile1.timezone === profile2.timezone
    );
    
    // Cache the result
  void comparisonCache.set(profile1, profile2, result);
    
    return result;
  } finally {
    endTiming();
  }
}

/**
 * Type-specific comparison for Coach objects
 * Optimized for database Coach type with array handling
 */
export function compareCoaches(
  coach1: { id: string; ipec_certification_number: string; certification_level: string; hourly_rate: number | null; experience_years: number | null; specializations: string[] | null; languages: string[] | null; is_active: boolean | null; updated_at: string } | null,
  coach2: { id: string; ipec_certification_number: string; certification_level: string; hourly_rate: number | null; experience_years: number | null; specializations: string[] | null; languages: string[] | null; is_active: boolean | null; updated_at: string } | null
): boolean {
  const endTiming = performanceMonitor.startTiming();
  
  try {
    // Fast path: Reference equality
    if (coach1 === coach2) return true;
    
    // Fast path: Null/undefined cases
    if (!coach1 || !coach2) return false;
    
    // Check cache first
    const cachedResult = comparisonCache.get(coach1, coach2);
    if (cachedResult !== undefined) {
      return cachedResult;
    }
    
    // Compare scalar fields first (fastest)
    if (
      coach1.id !== coach2.id ||
      coach1.updated_at !== coach2.updated_at ||
      coach1.ipec_certification_number !== coach2.ipec_certification_number ||
      coach1.certification_level !== coach2.certification_level ||
      coach1.hourly_rate !== coach2.hourly_rate ||
      coach1.experience_years !== coach2.experience_years ||
      coach1.is_active !== coach2.is_active
    ) {
  void comparisonCache.set(coach1, coach2, false);
      return false;
    }
    
    // Compare array fields (more expensive)
    const specializationsEqual = compareStringArrays(coach1.specializations, coach2.specializations);
    const languagesEqual = compareStringArrays(coach1.languages, coach2.languages);
    
    const result = specializationsEqual && languagesEqual;
    
    // Cache the result
  void comparisonCache.set(coach1, coach2, result);
    
    return result;
  } finally {
    endTiming();
  }
}

/**
 * Optimized string array comparison
 * Handles null/undefined cases and uses fast path optimizations
 */
function compareStringArrays(arr1: string[] | null, arr2: string[] | null): boolean {
  // Fast path: Reference equality
  if (arr1 === arr2) return true;
  
  // Fast path: Null/undefined cases
  if (!arr1 || !arr2) return arr1 === arr2;
  
  // Fast path: Different lengths
  if (arr1.length !== arr2.length) return false;
  
  // Fast path: Empty arrays
  if (arr1.length === 0) return true;
  
  // Compare each element
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) return false;
  }
  
  return true;
}

/**
 * Performance monitoring functions for debugging and optimization
 */
export const comparisonPerformance = {
  getMetrics(): ComparisonMetrics {
    return performanceMonitor.getMetrics();
  },
  
  reset(): void {
  void performanceMonitor.reset();
  },
  
  checkWarnings(): string[] {
    return performanceMonitor.checkPerformanceWarnings();
  },
  
  // Development utility to log performance stats
  logStats(): void {
    if (process.env.NODE_ENV === 'development') {
      const metrics = performanceMonitor.getMetrics();
      const warnings = performanceMonitor.checkPerformanceWarnings();
      
  void console.group('🔍 State Comparison Performance');
  void console.log('Total Comparisons:', metrics.totalComparisons);
  void console.log('Cache Hits:', metrics.cacheHits);
  void console.log('Cache Hit Rate:', metrics.totalComparisons > 0 ? `${((metrics.cacheHits / metrics.totalComparisons) * 100).toFixed(1)}%` : 'N/A');
  void console.log('Avg Comparison Time:', `${metrics.avgComparisonTime.toFixed(3)}ms`);
  void console.log('Max Comparison Time:', `${metrics.maxComparisonTime.toFixed(3)}ms`);
  void console.log('Comparisons/Second:', metrics.comparisonsPerSecond.toFixed(1));
      
      if (warnings.length > 0) {
  void console.warn('⚠️ Performance Warnings:');
  void warnings.forEach(warning => console.warn('  -', warning));
      } else {
  void console.log('✅ All performance metrics within acceptable ranges');
      }
      
  void console.groupEnd();
    }
  }
};

// Development mode: Log performance stats every 10 seconds
if (process.env.NODE_ENV === 'development') {
  setInterval(() => {
    const metrics = performanceMonitor.getMetrics();
    if (metrics.totalComparisons > 0) {
  void comparisonPerformance.logStats();
    }
  }, 10000);
}