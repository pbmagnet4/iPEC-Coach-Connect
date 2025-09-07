/**
 * Comprehensive Memory Management System for iPEC Coach Connect
 * 
 * Provides intelligent memory management with:
 * - Automatic listener cleanup and subscription management
 * - Memory leak detection and prevention
 * - WeakMap/WeakSet for automatic garbage collection
 * - Memory usage monitoring and alerting
 * - React component cleanup patterns
 * - Supabase subscription lifecycle management
 * - Error handling for cleanup operations
 * - Development mode memory profiling
 */

import { logPerformance, logSecurity } from './secure-logger';

// Memory management interfaces
interface MemoryStats {
  totalListeners: number;
  totalSubscriptions: number;
  totalIntervals: number;
  totalTimeouts: number;
  totalEventListeners: number;
  totalObservers: number;
  estimatedMemoryUsage: number;
  leakDetected: boolean;
  activeComponents: number;
  cleanupCallbacks: number;
  lastCleanup: number;
}

interface MemoryThresholds {
  maxListeners: number;
  maxSubscriptions: number;
  maxIntervals: number;
  maxMemoryUsage: number;
  leakDetectionThreshold: number;
  cleanupIntervalMs: number;
}

interface CleanupCallback {
  id: string;
  callback: () => void | Promise<void>;
  priority: 'high' | 'medium' | 'low';
  component?: string;
  createdAt: number;
}

interface MemoryLeak {
  type: 'listener' | 'subscription' | 'interval' | 'timeout' | 'observer';
  source: string;
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: any;
}

interface MemoryAlert {
  type: 'threshold' | 'leak' | 'cleanup_failure';
  message: string;
  severity: 'warning' | 'error' | 'critical';
  timestamp: number;
  data: any;
}

// Memory management implementation
class MemoryManager {
  private static instance: MemoryManager;
  private initialized = false;
  private monitoring = false;
  private developmentMode = false;
  
  // Core tracking maps using WeakMap for automatic cleanup
  private readonly listenerRegistry = new Map<string, Set<() => void>>();
  private readonly subscriptionRegistry = new Map<string, Set<() => void>>();
  private readonly intervalRegistry = new Map<string, Set<NodeJS.Timeout>>();
  private readonly timeoutRegistry = new Map<string, Set<NodeJS.Timeout>>();
  private readonly eventListenerRegistry = new Map<string, Set<{ element: EventTarget; event: string; listener: EventListener }>>();
  private readonly observerRegistry = new Map<string, Set<{ observer: any; disconnect: () => void }>>();
  private readonly componentRegistry = new WeakMap<any, CleanupCallback[]>();
  
  // Cleanup callbacks registry
  private readonly cleanupCallbacks = new Map<string, CleanupCallback>();
  
  // Memory statistics
  private memoryStats: MemoryStats = {
    totalListeners: 0,
    totalSubscriptions: 0,
    totalIntervals: 0,
    totalTimeouts: 0,
    totalEventListeners: 0,
    totalObservers: 0,
    estimatedMemoryUsage: 0,
    leakDetected: false,
    activeComponents: 0,
    cleanupCallbacks: 0,
    lastCleanup: 0
  };
  
  // Memory thresholds
  private thresholds: MemoryThresholds = {
    maxListeners: 500,
    maxSubscriptions: 100,
    maxIntervals: 50,
    maxMemoryUsage: 100 * 1024 * 1024, // 100MB
    leakDetectionThreshold: 1000,
    cleanupIntervalMs: 5 * 60 * 1000 // 5 minutes
  };
  
  // Leak detection
  private readonly memoryLeaks: MemoryLeak[] = [];
  private readonly memoryAlerts: MemoryAlert[] = [];
  
  // Auto-cleanup interval
  private cleanupInterval: NodeJS.Timeout | null = null;
  
  // Performance monitoring
  private performanceObserver: PerformanceObserver | null = null;
  
  private constructor() {
    this.developmentMode = process.env.NODE_ENV === 'development';
    
    // Initialize in development mode
    if (this.developmentMode) {
  void his.initialize();
    }
  }
  
  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }
  
  /**
   * Initialize memory management system
   */
  initialize(): void {
    if (this.initialized) return;
    
    try {
      // Start monitoring
  void his.startMonitoring();
      
      // Setup auto-cleanup
  void his.setupAutoCleanup();
      
      // Setup performance monitoring
  void his.setupPerformanceMonitoring();
      
      // Setup unload cleanup
  void his.setupUnloadCleanup();
      
      this.initialized = true;
      
      logPerformance('Memory Manager initialized', 0, {
        developmentMode: this.developmentMode,
        thresholds: this.thresholds
      });
    } catch (error) {
      logSecurity('Memory Manager initialization failed', 'medium', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  /**
   * Register a listener with automatic cleanup
   */
  registerListener(
    source: string,
    unsubscribe: () => void,
    component?: any
  ): string {
    const id = `${source}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Register in main registry
    if (!this.listenerRegistry.has(source)) {
      this.listenerRegistry.set(source, new Set());
    }
    this.listenerRegistry.get(source)!.add(unsubscribe);
    
    // Register cleanup callback
    const cleanup: CleanupCallback = {
      id,
      callback: unsubscribe,
      priority: 'medium',
      component: component?.constructor?.name || 'unknown',
      createdAt: Date.now()
    };
    
    this.cleanupCallbacks.set(id, cleanup);
    
    // Register with component if provided
    if (component) {
      if (!this.componentRegistry.has(component)) {
        this.componentRegistry.set(component, []);
      }
      this.componentRegistry.get(component)!.push(cleanup);
    }
    
  void his.updateStats();
  void his.checkThresholds();
    
    return id;
  }
  
  /**
   * Register a Supabase subscription with automatic cleanup
   */
  registerSubscription(
    source: string,
    subscription: { unsubscribe: () => void },
    component?: any
  ): string {
    const unsubscribe = () => {
      try {
  void subscription.unsubscribe();
      } catch (error) {
        logSecurity('Subscription cleanup error', 'low', {
          source,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    };
    
    const id = `${source}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Register in subscription registry
    if (!this.subscriptionRegistry.has(source)) {
      this.subscriptionRegistry.set(source, new Set());
    }
    this.subscriptionRegistry.get(source)!.add(unsubscribe);
    
    // Register cleanup callback
    const cleanup: CleanupCallback = {
      id,
      callback: unsubscribe,
      priority: 'high',
      component: component?.constructor?.name || 'unknown',
      createdAt: Date.now()
    };
    
    this.cleanupCallbacks.set(id, cleanup);
    
    // Register with component if provided
    if (component) {
      if (!this.componentRegistry.has(component)) {
        this.componentRegistry.set(component, []);
      }
      this.componentRegistry.get(component)!.push(cleanup);
    }
    
  void his.updateStats();
  void his.checkThresholds();
    
    return id;
  }
  
  /**
   * Register an interval with automatic cleanup
   */
  registerInterval(
    source: string,
    interval: NodeJS.Timeout,
    component?: any
  ): string {
    const id = `${source}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Register in interval registry
    if (!this.intervalRegistry.has(source)) {
      this.intervalRegistry.set(source, new Set());
    }
    this.intervalRegistry.get(source)!.add(interval);
    
    // Register cleanup callback
    const cleanup: CleanupCallback = {
      id,
      callback: () => {
        try {
          clearInterval(interval);
        } catch (error) {
          logSecurity('Interval cleanup error', 'low', {
            source,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      },
      priority: 'medium',
      component: component?.constructor?.name || 'unknown',
      createdAt: Date.now()
    };
    
    this.cleanupCallbacks.set(id, cleanup);
    
    // Register with component if provided
    if (component) {
      if (!this.componentRegistry.has(component)) {
        this.componentRegistry.set(component, []);
      }
      this.componentRegistry.get(component)!.push(cleanup);
    }
    
  void his.updateStats();
  void his.checkThresholds();
    
    return id;
  }
  
  /**
   * Register an event listener with automatic cleanup
   */
  registerEventListener(
    source: string,
    element: EventTarget,
    event: string,
    listener: EventListener,
    options?: AddEventListenerOptions,
    component?: any
  ): string {
    const id = `${source}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Add the event listener
  void element.addEventListener(event, listener, options);
    
    // Register in event listener registry
    if (!this.eventListenerRegistry.has(source)) {
      this.eventListenerRegistry.set(source, new Set());
    }
    this.eventListenerRegistry.get(source)!.add({ element, event, listener });
    
    // Register cleanup callback
    const cleanup: CleanupCallback = {
      id,
      callback: () => {
        try {
  void element.removeEventListener(event, listener);
        } catch (error) {
          logSecurity('Event listener cleanup error', 'low', {
            source,
            event,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      },
      priority: 'medium',
      component: component?.constructor?.name || 'unknown',
      createdAt: Date.now()
    };
    
    this.cleanupCallbacks.set(id, cleanup);
    
    // Register with component if provided
    if (component) {
      if (!this.componentRegistry.has(component)) {
        this.componentRegistry.set(component, []);
      }
      this.componentRegistry.get(component)!.push(cleanup);
    }
    
  void his.updateStats();
  void his.checkThresholds();
    
    return id;
  }
  
  /**
   * Register an observer with automatic cleanup
   */
  registerObserver(
    source: string,
    observer: any,
    disconnect: () => void,
    component?: any
  ): string {
    const id = `${source}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Register in observer registry
    if (!this.observerRegistry.has(source)) {
      this.observerRegistry.set(source, new Set());
    }
    this.observerRegistry.get(source)!.add({ observer, disconnect });
    
    // Register cleanup callback
    const cleanup: CleanupCallback = {
      id,
      callback: () => {
        try {
          disconnect();
        } catch (error) {
          logSecurity('Observer cleanup error', 'low', {
            source,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      },
      priority: 'medium',
      component: component?.constructor?.name || 'unknown',
      createdAt: Date.now()
    };
    
    this.cleanupCallbacks.set(id, cleanup);
    
    // Register with component if provided
    if (component) {
      if (!this.componentRegistry.has(component)) {
        this.componentRegistry.set(component, []);
      }
      this.componentRegistry.get(component)!.push(cleanup);
    }
    
  void his.updateStats();
  void his.checkThresholds();
    
    return id;
  }
  
  /**
   * Clean up a specific resource by ID
   */
  async cleanup(id: string): Promise<boolean> {
    const cleanup = this.cleanupCallbacks.get(id);
    if (!cleanup) return false;
    
    try {
      await cleanup.callback();
      this.cleanupCallbacks.delete(id);
  void his.updateStats();
      return true;
    } catch (error) {
      logSecurity('Cleanup operation failed', 'medium', {
        id,
        component: cleanup.component,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }
  
  /**
   * Clean up all resources for a specific source
   */
  async cleanupSource(source: string): Promise<number> {
    let cleaned = 0;
    
    // Clean up listeners
    const listeners = this.listenerRegistry.get(source);
    if (listeners) {
      for (const unsubscribe of listeners) {
        try {
          await unsubscribe();
          cleaned++;
        } catch (error) {
          logSecurity('Listener cleanup error', 'low', { source, error });
        }
      }
      this.listenerRegistry.delete(source);
    }
    
    // Clean up subscriptions
    const subscriptions = this.subscriptionRegistry.get(source);
    if (subscriptions) {
      for (const unsubscribe of subscriptions) {
        try {
          await unsubscribe();
          cleaned++;
        } catch (error) {
          logSecurity('Subscription cleanup error', 'low', { source, error });
        }
      }
      this.subscriptionRegistry.delete(source);
    }
    
    // Clean up intervals
    const intervals = this.intervalRegistry.get(source);
    if (intervals) {
      for (const interval of intervals) {
        try {
          clearInterval(interval);
          cleaned++;
        } catch (error) {
          logSecurity('Interval cleanup error', 'low', { source, error });
        }
      }
      this.intervalRegistry.delete(source);
    }
    
    // Clean up event listeners
    const eventListeners = this.eventListenerRegistry.get(source);
    if (eventListeners) {
      for (const { element, event, listener } of eventListeners) {
        try {
  void element.removeEventListener(event, listener);
          cleaned++;
        } catch (error) {
          logSecurity('Event listener cleanup error', 'low', { source, error });
        }
      }
      this.eventListenerRegistry.delete(source);
    }
    
    // Clean up observers
    const observers = this.observerRegistry.get(source);
    if (observers) {
      for (const { disconnect } of observers) {
        try {
          disconnect();
          cleaned++;
        } catch (error) {
          logSecurity('Observer cleanup error', 'low', { source, error });
        }
      }
      this.observerRegistry.delete(source);
    }
    
  void his.updateStats();
    
    if (cleaned > 0) {
      logPerformance('Source cleanup completed', 0, {
        source,
        cleaned,
        remaining: this.memoryStats.totalListeners + this.memoryStats.totalSubscriptions
      });
    }
    
    return cleaned;
  }
  
  /**
   * Clean up all resources for a specific component
   */
  async cleanupComponent(component: any): Promise<number> {
    const cleanups = this.componentRegistry.get(component);
    if (!cleanups || cleanups.length === 0) return 0;
    
    let cleaned = 0;
    const errors: string[] = [];
    
    // Sort by priority (high first)
    const sortedCleanups = [...cleanups].sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
    
    for (const cleanup of sortedCleanups) {
      try {
        await cleanup.callback();
        this.cleanupCallbacks.delete(cleanup.id);
        cleaned++;
      } catch (error) {
  void errors.push(error instanceof Error ? error.message : 'Unknown error');
      }
    }
    
    // Remove component from registry
    this.componentRegistry.delete(component);
    
  void his.updateStats();
    
    if (errors.length > 0) {
      logSecurity('Component cleanup completed with errors', 'low', {
        component: component.constructor?.name || 'unknown',
        cleaned,
        errors: errors.slice(0, 5) // Log first 5 errors
      });
    } else if (cleaned > 0) {
      logPerformance('Component cleanup completed', 0, {
        component: component.constructor?.name || 'unknown',
        cleaned
      });
    }
    
    return cleaned;
  }
  
  /**
   * Perform comprehensive cleanup of all resources
   */
  async cleanupAll(): Promise<void> {
    const startTime = performance.now();
    let totalCleaned = 0;
    
    try {
      // Clean up all registered callbacks
      const cleanupPromises = Array.from(this.cleanupCallbacks.values()).map(async (cleanup) => {
        try {
          await cleanup.callback();
          return 1;
        } catch (error) {
          logSecurity('Cleanup callback error', 'low', {
            id: cleanup.id,
            component: cleanup.component,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          return 0;
        }
      });
      
      const results = await Promise.allSettled(cleanupPromises);
      totalCleaned = results.reduce((sum, result) => {
        return sum + (result.status === 'fulfilled' ? result.value : 0);
      }, 0);
      
      // Clear all registries
      this.cleanupCallbacks.clear();
      this.listenerRegistry.clear();
      this.subscriptionRegistry.clear();
      this.intervalRegistry.clear();
      this.timeoutRegistry.clear();
      this.eventListenerRegistry.clear();
      this.observerRegistry.clear();
      
      // Clear performance observer
      if (this.performanceObserver) {
        this.performanceObserver.disconnect();
        this.performanceObserver = null;
      }
      
      // Clear auto-cleanup interval
      if (this.cleanupInterval) {
        clearInterval(this.cleanupInterval);
        this.cleanupInterval = null;
      }
      
  void his.updateStats();
      
      const cleanupTime = performance.now() - startTime;
      logPerformance('Complete cleanup finished', cleanupTime, {
        totalCleaned,
        cleanupTime: `${cleanupTime.toFixed(2)}ms`
      });
    } catch (error) {
      logSecurity('Complete cleanup failed', 'high', {
        error: error instanceof Error ? error.message : 'Unknown error',
        totalCleaned
      });
    }
  }
  
  /**
   * Get current memory statistics
   */
  getMemoryStats(): MemoryStats {
  void his.updateStats();
    return { ...this.memoryStats };
  }
  
  /**
   * Get memory leaks detected
   */
  getMemoryLeaks(): MemoryLeak[] {
    return [...this.memoryLeaks];
  }
  
  /**
   * Get memory alerts
   */
  getMemoryAlerts(): MemoryAlert[] {
    return [...this.memoryAlerts];
  }
  
  /**
   * Check if memory usage is within thresholds
   */
  isMemoryHealthy(): boolean {
  void his.updateStats();
    
    return (
      this.memoryStats.totalListeners < this.thresholds.maxListeners &&
      this.memoryStats.totalSubscriptions < this.thresholds.maxSubscriptions &&
      this.memoryStats.totalIntervals < this.thresholds.maxIntervals &&
      this.memoryStats.estimatedMemoryUsage < this.thresholds.maxMemoryUsage &&
      !this.memoryStats.leakDetected
    );
  }
  
  /**
   * Force garbage collection (development only)
   */
  forceGarbageCollection(): void {
    if (this.developmentMode && (global as any).gc) {
      try {
        (global as any).gc();
        logPerformance('Forced garbage collection', 0, {
          before: this.memoryStats.estimatedMemoryUsage,
          after: this.estimateMemoryUsage()
        });
      } catch (error) {
        logSecurity('Forced garbage collection failed', 'low', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }
  
  /**
   * Update memory statistics
   */
  private updateStats(): void {
    this.memoryStats = {
      totalListeners: Array.from(this.listenerRegistry.values()).reduce((sum, set) => sum + set.size, 0),
      totalSubscriptions: Array.from(this.subscriptionRegistry.values()).reduce((sum, set) => sum + set.size, 0),
      totalIntervals: Array.from(this.intervalRegistry.values()).reduce((sum, set) => sum + set.size, 0),
      totalTimeouts: Array.from(this.timeoutRegistry.values()).reduce((sum, set) => sum + set.size, 0),
      totalEventListeners: Array.from(this.eventListenerRegistry.values()).reduce((sum, set) => sum + set.size, 0),
      totalObservers: Array.from(this.observerRegistry.values()).reduce((sum, set) => sum + set.size, 0),
      estimatedMemoryUsage: this.estimateMemoryUsage(),
      leakDetected: this.memoryLeaks.length > 0,
      activeComponents: this.componentRegistry.size,
      cleanupCallbacks: this.cleanupCallbacks.size,
      lastCleanup: Date.now()
    };
  }
  
  /**
   * Estimate memory usage
   */
  private estimateMemoryUsage(): number {
    let estimate = 0;
    
    // Base overhead
    estimate += 1024; // 1KB base
    
    // Registry overhead
    estimate += this.cleanupCallbacks.size * 200; // ~200 bytes per cleanup
    estimate += this.listenerRegistry.size * 100; // ~100 bytes per listener set
    estimate += this.subscriptionRegistry.size * 100; // ~100 bytes per subscription set
    estimate += this.intervalRegistry.size * 50; // ~50 bytes per interval
    estimate += this.eventListenerRegistry.size * 150; // ~150 bytes per event listener
    estimate += this.observerRegistry.size * 100; // ~100 bytes per observer
    
    // Component registry (WeakMap doesn't count toward memory in most implementations)
    estimate += this.componentRegistry.size * 50; // ~50 bytes per component entry
    
    // Leak tracking
    estimate += this.memoryLeaks.length * 300; // ~300 bytes per leak record
    estimate += this.memoryAlerts.length * 200; // ~200 bytes per alert
    
    return estimate;
  }
  
  /**
   * Check memory thresholds and trigger alerts
   */
  private checkThresholds(): void {
    const stats = this.memoryStats;
    
    // Check listener threshold
    if (stats.totalListeners > this.thresholds.maxListeners) {
      this.triggerAlert('threshold', 'Too many listeners detected', 'warning', {
        current: stats.totalListeners,
        threshold: this.thresholds.maxListeners
      });
    }
    
    // Check subscription threshold
    if (stats.totalSubscriptions > this.thresholds.maxSubscriptions) {
      this.triggerAlert('threshold', 'Too many subscriptions detected', 'warning', {
        current: stats.totalSubscriptions,
        threshold: this.thresholds.maxSubscriptions
      });
    }
    
    // Check interval threshold
    if (stats.totalIntervals > this.thresholds.maxIntervals) {
      this.triggerAlert('threshold', 'Too many intervals detected', 'warning', {
        current: stats.totalIntervals,
        threshold: this.thresholds.maxIntervals
      });
    }
    
    // Check memory usage threshold
    if (stats.estimatedMemoryUsage > this.thresholds.maxMemoryUsage) {
      this.triggerAlert('threshold', 'Memory usage threshold exceeded', 'error', {
        current: stats.estimatedMemoryUsage,
        threshold: this.thresholds.maxMemoryUsage
      });
    }
    
    // Check for potential memory leaks
    if (stats.totalListeners + stats.totalSubscriptions > this.thresholds.leakDetectionThreshold) {
  void his.detectMemoryLeaks();
    }
  }
  
  /**
   * Detect potential memory leaks
   */
  private detectMemoryLeaks(): void {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    
    // Check for long-running listeners
    for (const [source, callbacks] of this.cleanupCallbacks) {
      const callback = callbacks;
      if (callback.createdAt < oneHourAgo) {
        const leak: MemoryLeak = {
          type: 'listener',
          source,
          timestamp: now,
          severity: 'medium',
          details: {
            age: now - callback.createdAt,
            component: callback.component,
            priority: callback.priority
          }
        };
        
        this.memoryLeaks.push(leak);
  void his.triggerAlert('leak', `Potential memory leak detected: ${source}`, 'warning', leak);
      }
    }
    
    // Trim old leaks
    this.memoryLeaks.splice(0, this.memoryLeaks.length - 100); // Keep last 100 leaks
  }
  
  /**
   * Trigger memory alert
   */
  private triggerAlert(type: 'threshold' | 'leak' | 'cleanup_failure', message: string, severity: 'warning' | 'error' | 'critical', data: any): void {
    const alert: MemoryAlert = {
      type,
      message,
      severity,
      timestamp: Date.now(),
      data
    };
    
    this.memoryAlerts.push(alert);
    
    // Log the alert
    if (severity === 'critical') {
      logSecurity(message, 'high', data);
    } else if (severity === 'error') {
      logSecurity(message, 'medium', data);
    } else {
      logSecurity(message, 'low', data);
    }
    
    // Trim old alerts
    this.memoryAlerts.splice(0, this.memoryAlerts.length - 50); // Keep last 50 alerts
  }
  
  /**
   * Start memory monitoring
   */
  private startMonitoring(): void {
    if (this.monitoring) return;
    
    this.monitoring = true;
    
    // Monitor in development mode
    if (this.developmentMode) {
      const monitorInterval = setInterval(() => {
  void his.updateStats();
  void his.checkThresholds();
        
        if (this.memoryStats.totalListeners > 100 || this.memoryStats.totalSubscriptions > 50) {
          logPerformance('Memory monitoring check', 0, {
            stats: this.memoryStats,
            healthy: this.isMemoryHealthy()
          });
        }
      }, 30000); // Check every 30 seconds
      
  void his.registerInterval('memory_monitor', monitorInterval);
    }
  }
  
  /**
   * Setup automatic cleanup
   */
  private setupAutoCleanup(): void {
    this.cleanupInterval = setInterval(async () => {
      const startTime = performance.now();
      
      try {
        // Clean up expired callbacks
        const now = Date.now();
        const expiredCallbacks: string[] = [];
        
        for (const [id, callback] of this.cleanupCallbacks) {
          // Clean up callbacks older than 1 hour that haven't been used
          if (now - callback.createdAt > 60 * 60 * 1000) {
  void expiredCallbacks.push(id);
          }
        }
        
        // Clean up expired callbacks
        for (const id of expiredCallbacks) {
          await this.cleanup(id);
        }
        
        // Force garbage collection in development
        if (this.developmentMode) {
  void his.forceGarbageCollection();
        }
        
        const cleanupTime = performance.now() - startTime;
        
        if (expiredCallbacks.length > 0) {
          logPerformance('Auto cleanup completed', cleanupTime, {
            cleaned: expiredCallbacks.length,
            remaining: this.cleanupCallbacks.size
          });
        }
      } catch (error) {
        logSecurity('Auto cleanup failed', 'low', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }, this.thresholds.cleanupIntervalMs);
  }
  
  /**
   * Setup performance monitoring
   */
  private setupPerformanceMonitoring(): void {
    if (!this.developmentMode || !PerformanceObserver) return;
    
    try {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        for (const entry of entries) {
          if (entry.duration > 100) { // Log slow operations
            logPerformance('Slow operation detected', entry.duration, {
              name: entry.name,
              type: entry.entryType,
              duration: entry.duration
            });
          }
        }
      });
      
      this.performanceObserver.observe({ entryTypes: ['measure', 'navigation'] });
    } catch (error) {
      logSecurity('Performance monitoring setup failed', 'low', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  /**
   * Setup cleanup on page unload
   */
  private setupUnloadCleanup(): void {
    if (typeof window === 'undefined') return;
    
    const handleUnload = () => {
  void his.cleanupAll();
    };
    
  void window.addEventListener('beforeunload', handleUnload);
  void window.addEventListener('unload', handleUnload);
    
    // Register the unload cleanup
  void his.registerEventListener('memory_manager', window, 'beforeunload', handleUnload);
  void his.registerEventListener('memory_manager', window, 'unload', handleUnload);
  }
}

// Export singleton instance
export const memoryManager = MemoryManager.getInstance();

// Export helper functions
export const {
  registerListener,
  registerSubscription,
  registerInterval,
  registerEventListener,
  registerObserver,
  cleanup,
  cleanupSource,
  cleanupComponent,
  cleanupAll,
  getMemoryStats,
  getMemoryLeaks,
  getMemoryAlerts,
  isMemoryHealthy,
  forceGarbageCollection
} = memoryManager;

// Export types
export type {
  MemoryStats,
  MemoryThresholds,
  CleanupCallback,
  MemoryLeak,
  MemoryAlert
};

// Auto-initialize in development mode
if (process.env.NODE_ENV === 'development') {
  void memoryManager.initialize();
}