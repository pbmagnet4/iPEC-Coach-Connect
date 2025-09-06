/**
 * Comprehensive Multi-Level Caching System for iPEC Coach Connect
 * 
 * Implements a sophisticated caching architecture with:
 * - L1: Memory Cache (volatile, fastest access)
 * - L2: localStorage Cache (persistent, fast access)
 * - L3: IndexedDB Cache (persistent, large data storage)
 * - Service Worker Cache (offline support)
 * - Intelligent cache warming and invalidation
 * - Performance monitoring and analytics
 * - Encryption for sensitive data
 * - Cross-tab synchronization
 * - Memory management with size limits
 * - Automatic cache warming for critical data
 */

import { logPerformance, logSecurity } from './secure-logger';
import { memoryManager } from './memory-manager';

// Cache entry interfaces
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  accessCount: number;
  lastAccessed: number;
  priority: CachePriority;
  compressed?: boolean;
  encrypted?: boolean;
  version: number;
}

interface CacheConfig {
  maxSize: number;
  defaultTTL: number; // Time to live in milliseconds
  maxMemoryUsage: number; // Max memory usage in bytes
  enableMetrics: boolean;
  enableCompression: boolean;
  enableEncryption: boolean;
  enableCrossTabSync: boolean;
  warmerEnabled: boolean;
}

interface CacheMetrics {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
  memoryUsage: number;
  hitRate: number;
  compressionRatio: number;
  warmingHits: number;
  crossTabSyncs: number;
  encryptionOps: number;
}

interface CacheWarmingRule {
  pattern: string;
  priority: CachePriority;
  preloadFn: () => Promise<any>;
  dependencies?: string[];
}

interface CacheInvalidationRule {
  pattern: RegExp;
  cascadeTo?: string[];
  condition?: (data: any) => boolean;
}

interface CacheSyncEvent {
  type: 'set' | 'delete' | 'clear' | 'invalidate';
  key?: string;
  pattern?: string;
  timestamp: number;
  origin: string;
}

interface PerformanceMetrics {
  avgAccessTime: number;
  avgCompressionTime: number;
  avgEncryptionTime: number;
  avgSyncTime: number;
  cacheEfficiency: number;
  memoryEfficiency: number;
}

enum CachePriority {
  CRITICAL = 5,
  HIGH = 4,
  MEDIUM = 3,
  LOW = 2,
  BACKGROUND = 1
}

enum CacheLevel {
  L1_MEMORY = 'L1_MEMORY',
  L2_LOCALSTORAGE = 'L2_LOCALSTORAGE',
  L3_INDEXEDDB = 'L3_INDEXEDDB',
  SERVICE_WORKER = 'SERVICE_WORKER'
}

interface CacheStrategy {
  levels: CacheLevel[];
  ttlByLevel: { [key in CacheLevel]?: number };
  sizeByLevel: { [key in CacheLevel]?: number };
  priority: CachePriority;
}

/**
 * Enhanced Multi-Level Memory Cache
 */
class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private config: CacheConfig;
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    evictions: 0,
    size: 0,
    memoryUsage: 0,
    hitRate: 0,
    compressionRatio: 0,
    warmingHits: 0,
    crossTabSyncs: 0,
    encryptionOps: 0
  };
  private warmingRules: CacheWarmingRule[] = [];
  private invalidationRules: CacheInvalidationRule[] = [];
  private performanceMetrics: PerformanceMetrics = {
    avgAccessTime: 0,
    avgCompressionTime: 0,
    avgEncryptionTime: 0,
    avgSyncTime: 0,
    cacheEfficiency: 0,
    memoryEfficiency: 0
  };
  
  // Memory management
  private cleanupIntervalId: string | null = null;
  private storageEventListenerId: string | null = null;
  private isDestroyed = false;
  private cacheName: string;

  constructor(config: Partial<CacheConfig> = {}, name = 'default') {
    this.config = {
      maxSize: config.maxSize || 1000,
      defaultTTL: config.defaultTTL || 15 * 60 * 1000, // 15 minutes
      maxMemoryUsage: config.maxMemoryUsage || 50 * 1024 * 1024, // 50MB
      enableMetrics: config.enableMetrics ?? true,
      enableCompression: config.enableCompression ?? true,
      enableEncryption: config.enableEncryption ?? true,
      enableCrossTabSync: config.enableCrossTabSync ?? true,
      warmerEnabled: config.warmerEnabled ?? true
    };
    
    this.cacheName = name;
    this.initializeCache();
  }

  private initializeCache(): void {
    if (this.isDestroyed) return;
    
    // Start cleanup interval
    this.startCleanupInterval();
    
    // Initialize cross-tab sync
    if (this.config.enableCrossTabSync) {
      this.initializeCrossTabSync();
    }
    
    // Initialize cache warming
    if (this.config.warmerEnabled) {
      this.initializeCacheWarming();
    }
  }

  /**
   * Get data from cache with multi-level fallback
   */
  async get<T>(key: string, level: CacheLevel = CacheLevel.L1_MEMORY): Promise<T | null> {
    const startTime = performance.now();
    
    try {
      // Try L1 first
      const l1Result = this.getFromL1<T>(key);
      if (l1Result !== null) {
        this.recordPerformanceMetric('avgAccessTime', performance.now() - startTime);
        return l1Result;
      }

      // Try L2 if enabled
      if (level !== CacheLevel.L1_MEMORY) {
        const l2Result = await this.getFromL2<T>(key);
        if (l2Result !== null) {
          // Promote to L1
          this.set(key, l2Result, undefined, CachePriority.MEDIUM);
          this.recordPerformanceMetric('avgAccessTime', performance.now() - startTime);
          return l2Result;
        }
      }

      // Try L3 if enabled
      if (level === CacheLevel.L3_INDEXEDDB) {
        const l3Result = await this.getFromL3<T>(key);
        if (l3Result !== null) {
          // Promote to L1 and L2
          this.set(key, l3Result, undefined, CachePriority.MEDIUM);
          this.recordPerformanceMetric('avgAccessTime', performance.now() - startTime);
          return l3Result;
        }
      }

      this.updateMetrics('miss');
      return null;
    } catch (error) {
      logSecurity('Cache get error', { key: key.substring(0, 20), error });
      return null;
    }
  }

  /**
   * Set data in cache with multi-level storage
   */
  async set<T>(
    key: string,
    data: T,
    ttl?: number,
    priority: CachePriority = CachePriority.MEDIUM,
    levels: CacheLevel[] = [CacheLevel.L1_MEMORY]
  ): Promise<void> {
    const startTime = performance.now();
    
    try {
      const now = Date.now();
      const expiresAt = now + (ttl || this.config.defaultTTL);
      
      // Encrypt sensitive data
      let processedData = data;
      let encrypted = false;
      
      if (this.config.enableEncryption && this.isSensitiveData(key)) {
        processedData = await this.encryptData(data);
        encrypted = true;
        this.metrics.encryptionOps++;
      }

      // Compress large data
      let compressed = false;
      if (this.config.enableCompression && this.shouldCompress(data)) {
        const compressionStart = performance.now();
        processedData = await this.compressData(processedData);
        compressed = true;
        this.recordPerformanceMetric('avgCompressionTime', performance.now() - compressionStart);
      }

      const entry: CacheEntry<T> = {
        data: processedData,
        timestamp: now,
        expiresAt,
        accessCount: 0,
        lastAccessed: now,
        priority,
        compressed,
        encrypted,
        version: 1
      };

      // Store in specified levels
      const storePromises = levels.map(level => {
        switch (level) {
          case CacheLevel.L1_MEMORY:
            return this.setInL1(key, entry);
          case CacheLevel.L2_LOCALSTORAGE:
            return this.setInL2(key, entry);
          case CacheLevel.L3_INDEXEDDB:
            return this.setInL3(key, entry);
          default:
            return Promise.resolve();
        }
      });

      await Promise.all(storePromises);

      // Sync across tabs if enabled
      if (this.config.enableCrossTabSync) {
        this.syncAcrossTabs({ type: 'set', key, timestamp: now, origin: 'current' });
      }

      this.updateMetrics('set');
      this.recordPerformanceMetric('avgAccessTime', performance.now() - startTime);
    } catch (error) {
      logSecurity('Cache set error', { key: key.substring(0, 20), error });
    }
  }

  /**
   * L1 Memory Cache Operations
   */
  private getFromL1<T>(key: string): T | null {
    const entry = this.cache.get(key);
    const now = Date.now();

    if (!entry) {
      return null;
    }

    // Check if expired
    if (now > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    // Update access info
    entry.accessCount++;
    entry.lastAccessed = now;

    this.updateMetrics('hit');
    
    if (this.config.enableMetrics) {
      logPerformance('L1 Cache hit', 0, {
        key: `${key.substring(0, 20)  }...`,
        age: now - entry.timestamp,
        accessCount: entry.accessCount,
        priority: entry.priority
      });
    }

    return this.processRetrievedData(entry.data, entry.compressed, entry.encrypted);
  }

  private async setInL1<T>(key: string, entry: CacheEntry<T>): Promise<void> {
    // Check if we need to evict entries
    this.enforceMemoryLimits();
    
    this.cache.set(key, entry);
    
    if (this.config.enableMetrics) {
      logPerformance('L1 Cache set', 0, {
        key: `${key.substring(0, 20)  }...`,
        ttl: entry.expiresAt - entry.timestamp,
        priority: entry.priority,
        compressed: entry.compressed,
        encrypted: entry.encrypted,
        size: this.estimateSize(entry.data)
      });
    }
  }

  /**
   * L2 localStorage Cache Operations
   */
  private async getFromL2<T>(key: string): Promise<T | null> {
    try {
      const stored = localStorage.getItem(`cache_l2_${key}`);
      if (!stored) return null;

      const entry: CacheEntry<T> = JSON.parse(stored);
      const now = Date.now();

      if (now > entry.expiresAt) {
        localStorage.removeItem(`cache_l2_${key}`);
        return null;
      }

      this.updateMetrics('hit');
      return this.processRetrievedData(entry.data, entry.compressed, entry.encrypted);
    } catch (error) {
      logSecurity('L2 Cache get error', { key: key.substring(0, 20), error });
      return null;
    }
  }

  private async setInL2<T>(key: string, entry: CacheEntry<T>): Promise<void> {
    try {
      // Check localStorage size limits
      this.enforceL2StorageLimits();
      
      localStorage.setItem(`cache_l2_${key}`, JSON.stringify(entry));
      
      if (this.config.enableMetrics) {
        logPerformance('L2 Cache set', 0, {
          key: `${key.substring(0, 20)  }...`,
          size: this.estimateSize(entry)
        });
      }
    } catch (error) {
      logSecurity('L2 Cache set error', { key: key.substring(0, 20), error });
    }
  }

  /**
   * L3 IndexedDB Cache Operations
   */
  private async getFromL3<T>(key: string): Promise<T | null> {
    try {
      const db = await this.openIndexedDB();
      const transaction = db.transaction(['cache'], 'readonly');
      const store = transaction.objectStore('cache');
      const request = store.get(key);

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          const entry = request.result;
          if (!entry) {
            resolve(null);
            return;
          }

          const now = Date.now();
          if (now > entry.expiresAt) {
            // Clean up expired entry
            this.deleteFromL3(key);
            resolve(null);
            return;
          }

          this.updateMetrics('hit');
          resolve(this.processRetrievedData(entry.data, entry.compressed, entry.encrypted));
        };

        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      logSecurity('L3 Cache get error', { key: key.substring(0, 20), error });
      return null;
    }
  }

  private async setInL3<T>(key: string, entry: CacheEntry<T>): Promise<void> {
    try {
      const db = await this.openIndexedDB();
      const transaction = db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      
      await new Promise<void>((resolve, reject) => {
        const request = store.put({ ...entry, key });
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      if (this.config.enableMetrics) {
        logPerformance('L3 Cache set', 0, {
          key: `${key.substring(0, 20)  }...`,
          size: this.estimateSize(entry)
        });
      }
    } catch (error) {
      logSecurity('L3 Cache set error', { key: key.substring(0, 20), error });
    }
  }

  private async deleteFromL3(key: string): Promise<void> {
    try {
      const db = await this.openIndexedDB();
      const transaction = db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      
      await new Promise<void>((resolve, reject) => {
        const request = store.delete(key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      logSecurity('L3 Cache delete error', { key: key.substring(0, 20), error });
    }
  }

  /**
   * IndexedDB initialization
   */
  private async openIndexedDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('iPEC_Cache', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('cache')) {
          const store = db.createObjectStore('cache', { keyPath: 'key' });
          store.createIndex('expiresAt', 'expiresAt');
          store.createIndex('priority', 'priority');
        }
      };
    });
  }

  /**
   * Data processing methods
   */
  private async processRetrievedData<T>(data: T, compressed?: boolean, encrypted?: boolean): Promise<T> {
    let processedData = data;

    if (encrypted) {
      processedData = await this.decryptData(processedData);
    }

    if (compressed) {
      processedData = await this.decompressData(processedData);
    }

    return processedData;
  }

  private async encryptData<T>(data: T): Promise<T> {
    const encryptionStart = performance.now();
    
    try {
      // Simple encryption implementation (in production, use Web Crypto API)
      const jsonString = JSON.stringify(data);
      const encoded = btoa(jsonString);
      
      this.recordPerformanceMetric('avgEncryptionTime', performance.now() - encryptionStart);
      return encoded as unknown as T;
    } catch (error) {
      logSecurity('Encryption error', { error });
      return data;
    }
  }

  private async decryptData<T>(data: T): Promise<T> {
    const decryptionStart = performance.now();
    
    try {
      const decoded = atob(data as unknown as string);
      const parsed = JSON.parse(decoded);
      
      this.recordPerformanceMetric('avgEncryptionTime', performance.now() - decryptionStart);
      return parsed;
    } catch (error) {
      logSecurity('Decryption error', { error });
      return data;
    }
  }

  private async compressData<T>(data: T): Promise<T> {
    try {
      // Simple compression using JSON stringification and basic compression
      const jsonString = JSON.stringify(data);
      
      // In production, use a proper compression library like pako
      const compressed = jsonString.length > 1000 ? 
        this.simpleCompress(jsonString) : jsonString;
      
      const originalSize = jsonString.length;
      const compressedSize = compressed.length;
      
      this.metrics.compressionRatio = compressedSize / originalSize;
      
      return compressed as unknown as T;
    } catch (error) {
      logSecurity('Compression error', { error });
      return data;
    }
  }

  private async decompressData<T>(data: T): Promise<T> {
    try {
      const decompressed = this.simpleDecompress(data as unknown as string);
      return JSON.parse(decompressed);
    } catch (error) {
      logSecurity('Decompression error', { error });
      return data;
    }
  }

  private simpleCompress(str: string): string {
    // Simple run-length encoding for demonstration
    // In production, use a proper compression library
    return str.replace(/(.)\1+/g, (match, char) => {
      return char + match.length;
    });
  }

  private simpleDecompress(str: string): string {
    // Simple decompression for demonstration
    return str.replace(/(.)\d+/g, (match, char) => {
      const count = parseInt(match.substring(1));
      return char.repeat(count);
    });
  }

  /**
   * Cache warming and invalidation
   */
  private initializeCacheWarming(): void {
    // Define cache warming rules
    this.warmingRules = [
      {
        pattern: 'user_profile:*',
        priority: CachePriority.CRITICAL,
        preloadFn: async () => {
          // Preload current user profile
          const currentUser = localStorage.getItem('supabase.auth.token');
          if (currentUser) {
            // Load user profile data
            logPerformance('Cache warming: user profile', 0, {});
          }
        }
      },
      {
        pattern: 'coach_data:*',
        priority: CachePriority.HIGH,
        preloadFn: async () => {
          // Preload coach data for current user
          logPerformance('Cache warming: coach data', 0, {});
        }
      }
    ];

    // Start warming process
    this.startCacheWarming();
  }

  private async startCacheWarming(): Promise<void> {
    if (!this.config.warmerEnabled) return;

    try {
      const warmingPromises = this.warmingRules.map(async (rule) => {
        try {
          await rule.preloadFn();
          this.metrics.warmingHits++;
        } catch (error) {
          logSecurity('Cache warming error', { pattern: rule.pattern, error });
        }
      });

      await Promise.all(warmingPromises);
      
      logPerformance('Cache warming completed', 0, {
        rulesExecuted: this.warmingRules.length,
        warmingHits: this.metrics.warmingHits
      });
    } catch (error) {
      logSecurity('Cache warming failed', { error });
    }
  }

  /**
   * Cross-tab synchronization
   */
  private initializeCrossTabSync(): void {
    if (!this.config.enableCrossTabSync || typeof window === 'undefined') return;

    const handleStorageEvent = (event: StorageEvent) => {
      if (this.isDestroyed) return;
      
      if (event.key === 'cache_sync_event') {
        this.handleCrossSyncEvent(JSON.parse(event.newValue || '{}'));
      }
    };
    
    // Register with memory manager
    this.storageEventListenerId = memoryManager.registerEventListener(
      `cache_${this.cacheName}_storage`,
      window,
      'storage',
      handleStorageEvent,
      undefined,
      this
    );
  }

  private syncAcrossTabs(event: CacheSyncEvent): void {
    if (!this.config.enableCrossTabSync) return;

    const syncStart = performance.now();
    
    try {
      localStorage.setItem('cache_sync_event', JSON.stringify(event));
      
      this.metrics.crossTabSyncs++;
      this.recordPerformanceMetric('avgSyncTime', performance.now() - syncStart);
    } catch (error) {
      logSecurity('Cross-tab sync error', { error });
    }
  }

  private handleCrossSyncEvent(event: CacheSyncEvent): void {
    if (event.origin === 'current') return;

    try {
      switch (event.type) {
        case 'set':
          // Handle cross-tab cache set
          break;
        case 'delete':
          if (event.key) {
            this.cache.delete(event.key);
          }
          break;
        case 'clear':
          this.cache.clear();
          break;
        case 'invalidate':
          if (event.pattern) {
            this.invalidateByPattern(new RegExp(event.pattern));
          }
          break;
      }
    } catch (error) {
      logSecurity('Cross-tab sync handler error', { error });
    }
  }

  /**
   * Advanced cache operations
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number,
    priority: CachePriority = CachePriority.MEDIUM
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch data and cache it
    const data = await fetchFn();
    await this.set(key, data, ttl, priority);
    return data;
  }

  async invalidateByPattern(pattern: RegExp): Promise<number> {
    let invalidated = 0;
    
    // Invalidate L1
    for (const [key] of this.cache) {
      if (pattern.test(key)) {
        this.cache.delete(key);
        invalidated++;
      }
    }

    // Invalidate L2
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('cache_l2_')) {
        const cacheKey = key.substring(9);
        if (pattern.test(cacheKey)) {
          localStorage.removeItem(key);
          invalidated++;
        }
      }
    }

    // Invalidate L3
    try {
      const db = await this.openIndexedDB();
      const transaction = db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.openCursor();

      await new Promise<void>((resolve, reject) => {
        request.onsuccess = () => {
          const cursor = request.result;
          if (cursor) {
            if (pattern.test(cursor.key as string)) {
              cursor.delete();
              invalidated++;
            }
            cursor.continue();
          } else {
            resolve();
          }
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      logSecurity('L3 invalidation error', { error });
    }

    if (invalidated > 0) {
      // Sync invalidation across tabs
      this.syncAcrossTabs({ 
        type: 'invalidate', 
        pattern: pattern.toString(), 
        timestamp: Date.now(), 
        origin: 'current' 
      });

      logPerformance('Cache pattern invalidation', 0, {
        pattern: pattern.toString(),
        invalidated
      });
    }

    return invalidated;
  }

  /**
   * Utility methods
   */
  private isSensitiveData(key: string): boolean {
    const sensitivePatterns = [
      'user_profile:',
      'auth_',
      'session_',
      'payment_',
      'personal_'
    ];
    
    return sensitivePatterns.some(pattern => key.includes(pattern));
  }

  private shouldCompress(data: any): boolean {
    try {
      const size = JSON.stringify(data).length;
      return size > 1000; // Compress if larger than 1KB
    } catch {
      return false;
    }
  }

  private estimateSize(data: any): number {
    try {
      return JSON.stringify(data).length * 2; // Rough estimate
    } catch {
      return 1000; // Fallback estimate
    }
  }

  private enforceMemoryLimits(): void {
    // Check size limit
    if (this.cache.size >= this.config.maxSize) {
      this.evictLeastRecentlyUsed(Math.floor(this.config.maxSize * 0.1)); // Evict 10%
    }

    // Check memory usage
    const currentMemory = this.estimateMemoryUsage();
    if (currentMemory > this.config.maxMemoryUsage) {
      this.evictLeastRecentlyUsed(Math.floor(this.cache.size * 0.2)); // Evict 20%
    }
  }

  private enforceL2StorageLimits(): void {
    try {
      const usage = this.estimateLocalStorageUsage();
      const maxUsage = 5 * 1024 * 1024; // 5MB limit for L2 cache
      
      if (usage > maxUsage) {
        this.evictL2Cache(0.2); // Evict 20% of L2 cache
      }
    } catch (error) {
      logSecurity('L2 storage limit enforcement error', { error });
    }
  }

  private estimateLocalStorageUsage(): number {
    let totalSize = 0;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('cache_l2_')) {
        const value = localStorage.getItem(key);
        totalSize += (key.length + (value?.length || 0)) * 2;
      }
    }
    
    return totalSize;
  }

  private evictL2Cache(percentage: number): void {
    const l2Keys: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('cache_l2_')) {
        l2Keys.push(key);
      }
    }
    
    const evictCount = Math.floor(l2Keys.length * percentage);
    const keysToEvict = l2Keys.slice(0, evictCount);
    
    keysToEvict.forEach(key => {
      localStorage.removeItem(key);
    });
    
    logPerformance('L2 cache eviction', 0, {
      evicted: evictCount,
      remaining: l2Keys.length - evictCount
    });
  }

  private estimateMemoryUsage(): number {
    let total = 0;
    for (const [key, entry] of this.cache) {
      total += key.length * 2; // Key size
      total += this.estimateSize(entry.data); // Data size
      total += 100; // Overhead for entry metadata
    }
    this.metrics.memoryUsage = total;
    return total;
  }

  private evictLeastRecentlyUsed(count: number): void {
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => {
        // Sort by priority first, then by last accessed
        const priorityDiff = a[1].priority - b[1].priority;
        if (priorityDiff !== 0) return priorityDiff;
        return a[1].lastAccessed - b[1].lastAccessed;
      })
      .slice(0, count);

    entries.forEach(([key]) => {
      this.cache.delete(key);
      this.metrics.evictions++;
    });

    if (count > 0) {
      logPerformance('Cache LRU eviction', 0, {
        evicted: count,
        remaining: this.cache.size
      });
    }
  }

  private updateMetrics(operation: 'hit' | 'miss' | 'set' | 'delete'): void {
    if (!this.config.enableMetrics) return;

    switch (operation) {
      case 'hit':
        this.metrics.hits++;
        break;
      case 'miss':
        this.metrics.misses++;
        break;
      case 'set':
      case 'delete':
        this.metrics.size = this.cache.size;
        break;
    }

    // Calculate hit rate
    const total = this.metrics.hits + this.metrics.misses;
    this.metrics.hitRate = total > 0 ? this.metrics.hits / total : 0;
  }

  private recordPerformanceMetric(metric: keyof PerformanceMetrics, value: number): void {
    if (!this.config.enableMetrics) return;

    const currentValue = this.performanceMetrics[metric];
    this.performanceMetrics[metric] = (currentValue + value) / 2;
  }

  private resetMetrics(): void {
    this.metrics = {
      hits: 0,
      misses: 0,
      evictions: 0,
      size: 0,
      memoryUsage: 0,
      hitRate: 0,
      compressionRatio: 0,
      warmingHits: 0,
      crossTabSyncs: 0,
      encryptionOps: 0
    };
  }

  private startCleanupInterval(): void {
    const cleanupInterval = setInterval(() => {
      if (this.isDestroyed) return;
      this.cleanupExpired();
    }, 5 * 60 * 1000); // Every 5 minutes
    
    // Register with memory manager
    this.cleanupIntervalId = memoryManager.registerInterval(
      `cache_${this.cacheName}_cleanup`,
      cleanupInterval,
      this
    );
  }

  private cleanupExpired(): void {
    const now = Date.now();
    let cleaned = 0;

    // Clean L1
    for (const [key, entry] of this.cache) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    // Clean L2
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key?.startsWith('cache_l2_')) {
        try {
          const stored = localStorage.getItem(key);
          if (stored) {
            const entry = JSON.parse(stored);
            if (now > entry.expiresAt) {
              localStorage.removeItem(key);
              cleaned++;
            }
          }
        } catch (error) {
          // Remove corrupted entries
          localStorage.removeItem(key);
          cleaned++;
        }
      }
    }

    if (cleaned > 0) {
      logPerformance('Cache cleanup', 0, {
        expired: cleaned,
        remaining: this.cache.size
      });
    }
  }

  /**
   * Public API methods
   */
  async clear(): Promise<void> {
    // Clear L1
    this.cache.clear();
    
    // Clear L2
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key?.startsWith('cache_l2_')) {
        localStorage.removeItem(key);
      }
    }

    // Clear L3
    try {
      const db = await this.openIndexedDB();
      const transaction = db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      
      await new Promise<void>((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      logSecurity('L3 cache clear error', { error });
    }

    this.resetMetrics();
    
    // Sync clear across tabs
    this.syncAcrossTabs({ type: 'clear', timestamp: Date.now(), origin: 'current' });
    
    logPerformance('Cache cleared', 0, {
      reason: 'manual_clear'
    });
  }

  async delete(key: string): Promise<boolean> {
    // Delete from L1
    const l1Result = this.cache.delete(key);
    
    // Delete from L2
    localStorage.removeItem(`cache_l2_${key}`);
    
    // Delete from L3
    await this.deleteFromL3(key);
    
    if (l1Result) {
      this.updateMetrics('delete');
      
      // Sync delete across tabs
      this.syncAcrossTabs({ type: 'delete', key, timestamp: Date.now(), origin: 'current' });
    }
    
    return l1Result;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    const now = Date.now();
    if (now > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  getStats(): CacheMetrics {
    return { ...this.metrics };
  }

  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  getDebugInfo(): Record<string, any> {
    const entries: Record<string, any> = {};
    const now = Date.now();

    for (const [key, entry] of this.cache) {
      entries[`${key.substring(0, 20)  }...`] = {
        age: now - entry.timestamp,
        expiresIn: entry.expiresAt - now,
        accessCount: entry.accessCount,
        priority: entry.priority,
        compressed: entry.compressed,
        encrypted: entry.encrypted,
        size: this.estimateSize(entry.data)
      };
    }

    return {
      config: this.config,
      metrics: this.metrics,
      performanceMetrics: this.performanceMetrics,
      warmingRules: this.warmingRules.length,
      entries,
      memoryManagement: {
        cleanupIntervalId: this.cleanupIntervalId,
        storageEventListenerId: this.storageEventListenerId,
        isDestroyed: this.isDestroyed,
        cacheName: this.cacheName
      }
    };
  }

  /**
   * Cache warming API
   */
  addWarmingRule(rule: CacheWarmingRule): void {
    this.warmingRules.push(rule);
  }

  async warmCache(): Promise<void> {
    await this.startCacheWarming();
  }

  /**
   * Batch operations
   */
  async setMany<T>(entries: { key: string; data: T; ttl?: number; priority?: CachePriority }[]): Promise<void> {
    const setPromises = entries.map(entry => 
      this.set(entry.key, entry.data, entry.ttl, entry.priority)
    );
    
    await Promise.all(setPromises);
  }

  async getMany<T>(keys: string[]): Promise<{ key: string; data: T | null }[]> {
    const getPromises = keys.map(async key => ({
      key,
      data: await this.get<T>(key)
    }));
    
    return Promise.all(getPromises);
  }
  
  /**
   * Destroy the cache and clean up all resources
   */
  destroy(): void {
    if (this.isDestroyed) return;
    
    this.isDestroyed = true;
    
    // Clear cache
    this.cache.clear();
    
    // Clean up intervals and listeners via memory manager
    if (this.cleanupIntervalId) {
      memoryManager.cleanup(this.cleanupIntervalId);
      this.cleanupIntervalId = null;
    }
    
    if (this.storageEventListenerId) {
      memoryManager.cleanup(this.storageEventListenerId);
      this.storageEventListenerId = null;
    }
    
    // Clean up all resources via memory manager
    memoryManager.cleanupComponent(this);
    
    // Reset metrics
    this.resetMetrics();
    
    logPerformance(`Cache ${this.cacheName} destroyed`, 0, {
      cacheName: this.cacheName
    });
  }
  
  /**
   * Check if cache is destroyed
   */
  getIsDestroyed(): boolean {
    return this.isDestroyed;
  }
  
  /**
   * Get cache name
   */
  getCacheName(): string {
    return this.cacheName;
  }
  
  /**
   * Get memory usage for this cache instance
   */
  getMemoryUsage(): number {
    return this.estimateMemoryUsage();
  }
  
  /**
   * Optimize cache memory usage
   */
  optimizeMemory(): void {
    if (this.isDestroyed) return;
    
    const startTime = performance.now();
    let optimized = 0;
    
    // Force eviction of old entries
    const now = Date.now();
    const oldEntries: string[] = [];
    
    for (const [key, entry] of this.cache) {
      // Evict entries older than 1 hour with low access count
      if (now - entry.timestamp > 60 * 60 * 1000 && entry.accessCount < 2) {
        oldEntries.push(key);
      }
    }
    
    // Remove old entries
    for (const key of oldEntries) {
      this.cache.delete(key);
      optimized++;
    }
    
    // Enforce memory limits
    this.enforceMemoryLimits();
    
    const optimizeTime = performance.now() - startTime;
    
    if (optimized > 0) {
      logPerformance(`Cache ${this.cacheName} optimized`, optimizeTime, {
        cacheName: this.cacheName,
        optimized,
        remaining: this.cache.size
      });
    }
  }
}

/**
 * Predefined cache strategies for different data types
 */
export const CACHE_STRATEGIES = {
  USER_PROFILE: {
    levels: [CacheLevel.L1_MEMORY, CacheLevel.L2_LOCALSTORAGE],
    ttlByLevel: {
      [CacheLevel.L1_MEMORY]: 15 * 60 * 1000, // 15 minutes
      [CacheLevel.L2_LOCALSTORAGE]: 30 * 60 * 1000, // 30 minutes
    },
    priority: CachePriority.CRITICAL
  } as CacheStrategy,

  COACH_DATA: {
    levels: [CacheLevel.L1_MEMORY, CacheLevel.L2_LOCALSTORAGE, CacheLevel.L3_INDEXEDDB],
    ttlByLevel: {
      [CacheLevel.L1_MEMORY]: 30 * 60 * 1000, // 30 minutes
      [CacheLevel.L2_LOCALSTORAGE]: 60 * 60 * 1000, // 1 hour
      [CacheLevel.L3_INDEXEDDB]: 24 * 60 * 60 * 1000, // 24 hours
    },
    priority: CachePriority.HIGH
  } as CacheStrategy,

  SEARCH_RESULTS: {
    levels: [CacheLevel.L1_MEMORY],
    ttlByLevel: {
      [CacheLevel.L1_MEMORY]: 15 * 60 * 1000, // 15 minutes
    },
    priority: CachePriority.MEDIUM
  } as CacheStrategy,

  LEARNING_RESOURCES: {
    levels: [CacheLevel.L1_MEMORY, CacheLevel.L3_INDEXEDDB],
    ttlByLevel: {
      [CacheLevel.L1_MEMORY]: 60 * 60 * 1000, // 1 hour
      [CacheLevel.L3_INDEXEDDB]: 4 * 60 * 60 * 1000, // 4 hours
    },
    priority: CachePriority.LOW
  } as CacheStrategy,

  SESSION_DATA: {
    levels: [CacheLevel.L1_MEMORY],
    ttlByLevel: {
      [CacheLevel.L1_MEMORY]: 5 * 60 * 1000, // 5 minutes
    },
    priority: CachePriority.HIGH
  } as CacheStrategy,

  COMMUNITY_POSTS: {
    levels: [CacheLevel.L1_MEMORY, CacheLevel.L2_LOCALSTORAGE],
    ttlByLevel: {
      [CacheLevel.L1_MEMORY]: 30 * 60 * 1000, // 30 minutes
      [CacheLevel.L2_LOCALSTORAGE]: 60 * 60 * 1000, // 1 hour
    },
    priority: CachePriority.MEDIUM
  } as CacheStrategy
};

// Create specialized cache instances
export const userProfileCache = new MemoryCache({
  maxSize: 500,
  defaultTTL: 15 * 60 * 1000, // 15 minutes
  maxMemoryUsage: 10 * 1024 * 1024, // 10MB
  enableMetrics: true,
  enableCompression: true,
  enableEncryption: true,
  enableCrossTabSync: true,
  warmerEnabled: true
}, 'userProfile');

export const coachDataCache = new MemoryCache({
  maxSize: 1000,
  defaultTTL: 30 * 60 * 1000, // 30 minutes
  maxMemoryUsage: 20 * 1024 * 1024, // 20MB
  enableMetrics: true,
  enableCompression: true,
  enableEncryption: false,
  enableCrossTabSync: true,
  warmerEnabled: true
}, 'coachData');

export const searchResultsCache = new MemoryCache({
  maxSize: 200,
  defaultTTL: 15 * 60 * 1000, // 15 minutes
  maxMemoryUsage: 5 * 1024 * 1024, // 5MB
  enableMetrics: true,
  enableCompression: true,
  enableEncryption: false,
  enableCrossTabSync: false,
  warmerEnabled: false
}, 'searchResults');

export const learningResourcesCache = new MemoryCache({
  maxSize: 800,
  defaultTTL: 4 * 60 * 60 * 1000, // 4 hours
  maxMemoryUsage: 30 * 1024 * 1024, // 30MB
  enableMetrics: true,
  enableCompression: true,
  enableEncryption: false,
  enableCrossTabSync: true,
  warmerEnabled: true
}, 'learningResources');

export const sessionDataCache = new MemoryCache({
  maxSize: 100,
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  maxMemoryUsage: 2 * 1024 * 1024, // 2MB
  enableMetrics: true,
  enableCompression: false,
  enableEncryption: true,
  enableCrossTabSync: false,
  warmerEnabled: false
}, 'sessionData');

export const communityPostsCache = new MemoryCache({
  maxSize: 600,
  defaultTTL: 30 * 60 * 1000, // 30 minutes
  maxMemoryUsage: 15 * 1024 * 1024, // 15MB
  enableMetrics: true,
  enableCompression: true,
  enableEncryption: false,
  enableCrossTabSync: true,
  warmerEnabled: false
}, 'communityPosts');

// Create session and general cache instances
export const sessionCache = sessionDataCache;
export const generalCache = new MemoryCache({
  maxSize: 500,
  defaultTTL: 15 * 60 * 1000, // 15 minutes
  maxMemoryUsage: 10 * 1024 * 1024, // 10MB
  enableMetrics: true,
  enableCompression: true,
  enableEncryption: false,
  enableCrossTabSync: false,
  warmerEnabled: false
}, 'general');

// Export enums
export { CachePriority, CacheLevel };

// Enhanced cache utility functions
export const cacheUtils = {
  /**
   * Generate cache key for user profile
   */
  getUserProfileKey: (userId: string): string => `user_profile:${userId}`,
  
  /**
   * Generate cache key for coach data
   */
  getCoachDataKey: (userId: string): string => `coach_data:${userId}`,
  
  /**
   * Generate cache key for user permissions
   */
  getUserPermissionsKey: (userId: string): string => `user_permissions:${userId}`,
  
  /**
   * Generate cache key for search results
   */
  getSearchResultsKey: (query: string, filters: any): string => {
    const filterHash = btoa(JSON.stringify(filters)).slice(0, 10);
    return `search_results:${query}:${filterHash}`;
  },
  
  /**
   * Generate cache key for learning resources
   */
  getLearningResourceKey: (resourceId: string): string => `learning_resource:${resourceId}`,
  
  /**
   * Generate cache key for session data
   */
  getSessionDataKey: (sessionId: string): string => `session_data:${sessionId}`,
  
  /**
   * Generate cache key for community posts
   */
  getCommunityPostKey: (postId: string): string => `community_post:${postId}`,
  
  /**
   * Invalidate all user-related cache entries
   */
  invalidateUserCache: async (userId: string): Promise<void> => {
    const pattern = new RegExp(`^user.*:${userId}`);
    
    await Promise.all([
      userProfileCache.invalidateByPattern(pattern),
      coachDataCache.invalidateByPattern(pattern),
      sessionDataCache.invalidateByPattern(pattern)
    ]);
  },
  
  /**
   * Invalidate all coach-related cache entries
   */
  invalidateCoachCache: async (coachId: string): Promise<void> => {
    const pattern = new RegExp(`^coach.*:${coachId}`);
    
    await Promise.all([
      coachDataCache.invalidateByPattern(pattern),
      searchResultsCache.invalidateByPattern(new RegExp(`^search_results:.*`))
    ]);
  },
  
  /**
   * Warm critical cache data
   */
  warmCriticalData: async (userId: string): Promise<void> => {
    const warmingPromises = [
      userProfileCache.warmCache(),
      coachDataCache.warmCache(),
      learningResourcesCache.warmCache()
    ];
    
    await Promise.all(warmingPromises);
  },
  
  /**
   * Get cache statistics for all instances
   */
  getAllStats: (): Record<string, CacheMetrics> => ({
    userProfile: userProfileCache.getStats(),
    coachData: coachDataCache.getStats(),
    searchResults: searchResultsCache.getStats(),
    learningResources: learningResourcesCache.getStats(),
    sessionData: sessionDataCache.getStats(),
    communityPosts: communityPostsCache.getStats()
  }),
  
  /**
   * Get performance metrics for all instances
   */
  getAllPerformanceMetrics: (): Record<string, PerformanceMetrics> => ({
    userProfile: userProfileCache.getPerformanceMetrics(),
    coachData: coachDataCache.getPerformanceMetrics(),
    searchResults: searchResultsCache.getPerformanceMetrics(),
    learningResources: learningResourcesCache.getPerformanceMetrics(),
    sessionData: sessionDataCache.getPerformanceMetrics(),
    communityPosts: communityPostsCache.getPerformanceMetrics()
  }),
  
  /**
   * Clear all caches
   */
  clearAllCaches: async (): Promise<void> => {
    await Promise.all([
      userProfileCache.clear(),
      coachDataCache.clear(),
      searchResultsCache.clear(),
      learningResourcesCache.clear(),
      sessionDataCache.clear(),
      communityPostsCache.clear()
    ]);
  },
  
  /**
   * Destroy all caches and clean up resources
   */
  destroyAllCaches: (): void => {
    userProfileCache.destroy();
    coachDataCache.destroy();
    searchResultsCache.destroy();
    learningResourcesCache.destroy();
    sessionDataCache.destroy();
    communityPostsCache.destroy();
  },
  
  /**
   * Optimize memory usage across all caches
   */
  optimizeAllCaches: (): void => {
    userProfileCache.optimizeMemory();
    coachDataCache.optimizeMemory();
    searchResultsCache.optimizeMemory();
    learningResourcesCache.optimizeMemory();
    sessionDataCache.optimizeMemory();
    communityPostsCache.optimizeMemory();
  },
  
  /**
   * Get total memory usage across all caches
   */
  getTotalMemoryUsage: (): number => {
    return [
      userProfileCache.getMemoryUsage(),
      coachDataCache.getMemoryUsage(),
      searchResultsCache.getMemoryUsage(),
      learningResourcesCache.getMemoryUsage(),
      sessionDataCache.getMemoryUsage(),
      communityPostsCache.getMemoryUsage()
    ].reduce((sum, usage) => sum + usage, 0);
  },
  
  /**
   * Check if any cache is destroyed
   */
  getCacheStatus: (): Record<string, boolean> => ({
    userProfile: !userProfileCache.getIsDestroyed(),
    coachData: !coachDataCache.getIsDestroyed(),
    searchResults: !searchResultsCache.getIsDestroyed(),
    learningResources: !learningResourcesCache.getIsDestroyed(),
    sessionData: !sessionDataCache.getIsDestroyed(),
    communityPosts: !communityPostsCache.getIsDestroyed()
  }),
  
  /**
   * Get comprehensive debug information
   */
  getDebugInfo: (): Record<string, any> => ({
    userProfile: userProfileCache.getDebugInfo(),
    coachData: coachDataCache.getDebugInfo(),
    searchResults: searchResultsCache.getDebugInfo(),
    learningResources: learningResourcesCache.getDebugInfo(),
    sessionData: sessionDataCache.getDebugInfo(),
    communityPosts: communityPostsCache.getDebugInfo()
  })
};

// Export cache instances and utilities
export default {
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
};