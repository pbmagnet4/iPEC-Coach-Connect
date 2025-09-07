/**
 * Development Tools Component
 * 
 * Collection of development utilities including memory monitoring,
 * performance profiling, and debugging tools. Only renders in development mode.
 */

import React, { useEffect, useState } from 'react';
import { Activity, Bug, Database, EyeOff, Settings, Wifi, Zap } from 'lucide-react';
import { MemoryMonitor } from './MemoryMonitor';
import { memoryManager } from '../lib/memory-manager';
import { authService } from '../services/auth.service';
import { cacheUtils } from '../lib/cache';
import type { MemoryInfo, NavigationTiming, PerformanceEntry, SafeRecord } from '../types/common';

interface DevToolsProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  showMemoryMonitor?: boolean;
  showPerformanceStats?: boolean;
  showCacheStats?: boolean;
  showAuthStats?: boolean;
  showNetworkStats?: boolean;
  className?: string;
}

interface PerformanceStats {
  navigation: NavigationTiming | Record<string, unknown>;
  memory: MemoryInfo | Record<string, unknown>;
  timing: Record<string, unknown>;
  now: number;
}

interface CacheStatEntry {
  hitRate: number;
  size: number;
  hits: number;
  misses: number;
}

interface AuthStatEntry {
  listenersCount: number;
  hasSupabaseSubscription: boolean;
  hasCleanupInterval: boolean;
  hasValidationInterval: boolean;
  isDestroyed: boolean;
}

interface NetworkStats {
  totalRequests: number;
  totalSize: number;
  avgResponseTime: number;
  slowRequests: number;
  failedRequests: number;
}

export function DevTools({
  position = 'top-right',
  showMemoryMonitor = true,
  showPerformanceStats = true,
  showCacheStats = true,
  showAuthStats = true,
  showNetworkStats = true,
  className = ''
}: DevToolsProps) {
  // All hooks must be called at the top level
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<'memory' | 'performance' | 'cache' | 'auth' | 'network' | null>(null);
  const [performanceStats, setPerformanceStats] = useState<PerformanceStats>({
    navigation: {},
    memory: {},
    timing: {},
    now: 0
  });
  const [cacheStats, setCacheStats] = useState<SafeRecord<CacheStatEntry>>({});
  const [authStats, setAuthStats] = useState<AuthStatEntry>({
    listenersCount: 0,
    hasSupabaseSubscription: false,
    hasCleanupInterval: false,
    hasValidationInterval: false,
    isDestroyed: false
  });
  const [networkStats, setNetworkStats] = useState<NetworkStats>({
    totalRequests: 0,
    totalSize: 0,
    avgResponseTime: 0,
    slowRequests: 0,
    failedRequests: 0
  });

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  };

  // Update stats periodically
  useEffect(() => {
    const updateStats = () => {
      if (showPerformanceStats) {
        const perfMemory = (performance as unknown as { memory?: MemoryInfo }).memory;
        setPerformanceStats({
          navigation: performance.getEntriesByType('navigation')[0] || {},
          memory: perfMemory || {},
          timing: (performance as unknown as { timing?: Record<string, unknown> }).timing || {},
          now: performance.now()
        });
      }

      if (showCacheStats) {
        setCacheStats(cacheUtils.getAllStats() as SafeRecord<CacheStatEntry>);
      }

      if (showAuthStats) {
        setAuthStats(authService.getMemoryStats() as AuthStatEntry);
      }

      if (showNetworkStats) {
        const resources = performance.getEntriesByType('resource') as PerformanceEntry[];
        const safeResources = resources.map(r => r as PerformanceEntry & {
          transferSize?: number;
          responseStatus?: number;
        });
        
        setNetworkStats({
          totalRequests: resources.length,
          totalSize: safeResources.reduce((sum, resource) => sum + (resource.transferSize ?? 0), 0),
          avgResponseTime: resources.length > 0 
            ? safeResources.reduce((sum, resource) => sum + resource.duration, 0) / resources.length 
            : 0,
          slowRequests: safeResources.filter((resource) => resource.duration > 1000).length,
          failedRequests: safeResources.filter((resource) => (resource.responseStatus ?? 0) >= 400).length
        });
      }
    };

    updateStats();
    const interval = setInterval(updateStats, 2000);
    return () => clearInterval(interval);
  }, [showPerformanceStats, showCacheStats, showAuthStats, showNetworkStats]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))  } ${  sizes[i]}`;
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const getPerformanceColor = (value: number, thresholds: number[]): string => {
    if (value <= thresholds[0]) return 'text-green-600';
    if (value <= thresholds[1]) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleToolSelect = (tool: 'memory' | 'performance' | 'cache' | 'auth' | 'network') => {
    setSelectedTool(selectedTool === tool ? null : tool);
  };

  const handleMemoryCleanup = async () => {
    await memoryManager.cleanupAll();
    console.warn('DevTools: Memory cleanup completed');
  };

  const handleCacheClear = async () => {
    await cacheUtils.clearAllCaches();
    console.warn('DevTools: Cache cleared');
  };

  const handleAuthReset = () => {
    authService.destroy();
    console.warn('DevTools: Auth service reset');
  };

  // Only render in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  if (!isOpen) {
    return (
      <div className={`fixed ${positionClasses[position]} z-50 ${className}`}>
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
          title="Open DevTools"
        >
          <Settings className="h-5 w-5" />
        </button>
      </div>
    );
  }

  return (
    <div className={`fixed ${positionClasses[position]} z-50 ${className}`}>
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 w-96 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            <h3 className="text-sm font-semibold">DevTools</h3>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <EyeOff className="h-4 w-4" />
          </button>
        </div>

        {/* Tool Buttons */}
        <div className="p-4 border-b border-gray-200">
          <div className="grid grid-cols-2 gap-2">
            {showMemoryMonitor && (
              <button
                onClick={() => handleToolSelect('memory')}
                className={`flex items-center gap-2 p-2 rounded text-sm transition-colors ${
                  selectedTool === 'memory' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Activity className="h-4 w-4" />
                Memory
              </button>
            )}
            {showPerformanceStats && (
              <button
                onClick={() => handleToolSelect('performance')}
                className={`flex items-center gap-2 p-2 rounded text-sm transition-colors ${
                  selectedTool === 'performance' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Zap className="h-4 w-4" />
                Performance
              </button>
            )}
            {showCacheStats && (
              <button
                onClick={() => handleToolSelect('cache')}
                className={`flex items-center gap-2 p-2 rounded text-sm transition-colors ${
                  selectedTool === 'cache' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Database className="h-4 w-4" />
                Cache
              </button>
            )}
            {showAuthStats && (
              <button
                onClick={() => handleToolSelect('auth')}
                className={`flex items-center gap-2 p-2 rounded text-sm transition-colors ${
                  selectedTool === 'auth' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Bug className="h-4 w-4" />
                Auth
              </button>
            )}
            {showNetworkStats && (
              <button
                onClick={() => handleToolSelect('network')}
                className={`flex items-center gap-2 p-2 rounded text-sm transition-colors ${
                  selectedTool === 'network' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Wifi className="h-4 w-4" />
                Network
              </button>
            )}
          </div>
        </div>

        {/* Tool Content */}
        <div className="p-4 max-h-64 overflow-y-auto">
          {selectedTool === 'memory' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-medium text-gray-900">Memory Management</h4>
                <button
                  onClick={handleMemoryCleanup}
                  className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded hover:bg-red-200"
                >
                  Cleanup All
                </button>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Health:</span>
                  <span className={memoryManager.isMemoryHealthy() ? 'text-green-600' : 'text-red-600'}>
                    {memoryManager.isMemoryHealthy() ? 'Healthy' : 'Issues Detected'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total Memory:</span>
                  <span>{formatBytes(memoryManager.getMemoryStats().estimatedMemoryUsage)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Listeners:</span>
                  <span>{memoryManager.getMemoryStats().totalListeners}</span>
                </div>
                <div className="flex justify-between">
                  <span>Subscriptions:</span>
                  <span>{memoryManager.getMemoryStats().totalSubscriptions}</span>
                </div>
                <div className="flex justify-between">
                  <span>Leaks:</span>
                  <span className={memoryManager.getMemoryLeaks().length > 0 ? 'text-red-600' : 'text-green-600'}>
                    {memoryManager.getMemoryLeaks().length}
                  </span>
                </div>
              </div>
            </div>
          )}

          {selectedTool === 'performance' && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Performance Metrics</h4>
              <div className="space-y-2 text-sm">
                {performanceStats.memory && (
                  <>
                    <div className="flex justify-between">
                      <span>Used JS Heap:</span>
                      <span className={getPerformanceColor(performanceStats.memory.usedJSHeapSize / 1024 / 1024, [50, 100])}>
                        {formatBytes(performanceStats.memory.usedJSHeapSize)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>JS Heap Limit:</span>
                      <span>{formatBytes(performanceStats.memory.jsHeapSizeLimit)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between">
                  <span>Runtime:</span>
                  <span>{formatDuration(performanceStats.now)}</span>
                </div>
                {performanceStats.navigation && (
                  <div className="flex justify-between">
                    <span>Load Time:</span>
                    <span className={getPerformanceColor(performanceStats.navigation.loadEventEnd - performanceStats.navigation.navigationStart, [2000, 5000])}>
                      {formatDuration(performanceStats.navigation.loadEventEnd - performanceStats.navigation.navigationStart)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {selectedTool === 'cache' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-medium text-gray-900">Cache Statistics</h4>
                <button
                  onClick={handleCacheClear}
                  className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded hover:bg-red-200"
                >
                  Clear All
                </button>
              </div>
              <div className="space-y-2 text-sm">
                {Object.entries(cacheStats).map(([cacheName, stats]: [string, any]) => (
                  <div key={cacheName} className="border rounded p-2">
                    <div className="font-medium text-gray-700 mb-1">{cacheName}</div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span>Hit Rate:</span>
                        <span className={getPerformanceColor(100 - (stats.hitRate * 100), [10, 30])}>
                          {(stats.hitRate * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Size:</span>
                        <span>{stats.size}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Hits:</span>
                        <span>{stats.hits}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Misses:</span>
                        <span>{stats.misses}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedTool === 'auth' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-medium text-gray-900">Auth Service</h4>
                <button
                  onClick={handleAuthReset}
                  className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded hover:bg-red-200"
                >
                  Reset
                </button>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Listeners:</span>
                  <span>{authStats.listenersCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Supabase Sub:</span>
                  <span className={authStats.hasSupabaseSubscription ? 'text-green-600' : 'text-red-600'}>
                    {authStats.hasSupabaseSubscription ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Cleanup Interval:</span>
                  <span className={authStats.hasCleanupInterval ? 'text-green-600' : 'text-red-600'}>
                    {authStats.hasCleanupInterval ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Validation Interval:</span>
                  <span className={authStats.hasValidationInterval ? 'text-green-600' : 'text-red-600'}>
                    {authStats.hasValidationInterval ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className={authStats.isDestroyed ? 'text-red-600' : 'text-green-600'}>
                    {authStats.isDestroyed ? 'Destroyed' : 'Active'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {selectedTool === 'network' && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Network Statistics</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total Requests:</span>
                  <span>{networkStats.totalRequests}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Size:</span>
                  <span>{formatBytes(networkStats.totalSize)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Avg Response Time:</span>
                  <span className={getPerformanceColor(networkStats.avgResponseTime, [500, 1000])}>
                    {formatDuration(networkStats.avgResponseTime)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Slow Requests:</span>
                  <span className={networkStats.slowRequests > 0 ? 'text-yellow-600' : 'text-green-600'}>
                    {networkStats.slowRequests}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Failed Requests:</span>
                  <span className={networkStats.failedRequests > 0 ? 'text-red-600' : 'text-green-600'}>
                    {networkStats.failedRequests}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Memory Monitor as separate component */}
      {showMemoryMonitor && selectedTool === 'memory' && (
        <MemoryMonitor
          position={position === 'top-right' ? 'top-left' : 'top-right'}
          className="transform translate-x-[-100px]"
        />
      )}
    </div>
  );
}

export default DevTools;