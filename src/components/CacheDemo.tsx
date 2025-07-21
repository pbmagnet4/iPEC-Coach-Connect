/**
 * Cache System Demonstration Component
 * 
 * This component demonstrates the comprehensive caching system features:
 * - Multi-level caching (L1, L2, L3, Service Worker)
 * - Cache performance monitoring
 * - Cache debugging and statistics
 * - Cache invalidation and warming
 * - Offline support
 * - Real-time cache metrics
 */

import React, { useState, useEffect } from 'react';
import {
  useUserProfileCache,
  useCoachDataCache,
  useSearchResultsCache,
  useCachePerformance,
  useCacheDebug
} from '../lib/hooks/useCache';
import { cacheIntegrationService } from '../lib/cache-integration.service';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';

interface CacheDemoProps {
  userId?: string;
  coachId?: string;
}

export const CacheDemo: React.FC<CacheDemoProps> = ({ 
  userId = 'demo-user-123', 
  coachId = 'demo-coach-456' 
}) => {
  const [activeTab, setActiveTab] = useState<'examples' | 'performance' | 'debug'>('examples');
  const [notifications, setNotifications] = useState<Array<{ id: string; message: string; type: 'success' | 'error' | 'info' }>>([]);

  // Cache hooks demonstrations
  const [userProfileState, userProfileActions] = useUserProfileCache(
    userId,
    async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        id: userId,
        name: 'Demo User',
        email: 'demo@example.com',
        avatar: '/demo-avatar.jpg',
        bio: 'This is a demo user profile fetched from the API',
        lastLogin: new Date().toISOString()
      };
    },
    {
      enableRefresh: true,
      refreshInterval: 30000, // 30 seconds
      onCacheHit: (data) => addNotification('Cache hit for user profile!', 'success'),
      onCacheMiss: () => addNotification('Cache miss - fetching user profile from API', 'info'),
      onError: (error) => addNotification(`Error: ${error.message}`, 'error')
    }
  );

  const [coachDataState, coachDataActions] = useCoachDataCache(
    coachId,
    async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      return {
        id: coachId,
        name: 'Demo Coach',
        title: 'Senior Life Coach',
        rating: 4.8,
        reviewCount: 127,
        specializations: ['Leadership', 'Career Development', 'Life Transitions'],
        hourlyRate: 150,
        bio: 'Experienced coach with 10+ years helping clients achieve their goals',
        availability: 'Available this week'
      };
    },
    {
      onCacheHit: (data) => addNotification('Cache hit for coach data!', 'success'),
      onCacheMiss: () => addNotification('Cache miss - fetching coach data from API', 'info'),
      onError: (error) => addNotification(`Error: ${error.message}`, 'error')
    }
  );

  const [searchResultsState, searchResultsActions] = useSearchResultsCache(
    'life coaching',
    { location: 'New York', rating: 4.5 },
    async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      return [
        { id: 1, name: 'Coach A', rating: 4.9, location: 'New York' },
        { id: 2, name: 'Coach B', rating: 4.7, location: 'New York' },
        { id: 3, name: 'Coach C', rating: 4.6, location: 'New York' }
      ];
    },
    {
      onCacheHit: (data) => addNotification('Cache hit for search results!', 'success'),
      onCacheMiss: () => addNotification('Cache miss - fetching search results from API', 'info'),
      onError: (error) => addNotification(`Error: ${error.message}`, 'error')
    }
  );

  // Performance monitoring
  const { performance, loading: perfLoading, refresh: refreshPerformance } = useCachePerformance();

  // Debug information
  const { debugInfo, loading: debugLoading, refresh: refreshDebug } = useCacheDebug();

  // Helper functions
  const addNotification = (message: string, type: 'success' | 'error' | 'info') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const handleClearAllCaches = async () => {
    try {
      await cacheIntegrationService.clearAllCaches();
      addNotification('All caches cleared successfully!', 'success');
    } catch (error) {
      addNotification('Failed to clear caches', 'error');
    }
  };

  const handleWarmCaches = async () => {
    try {
      await cacheIntegrationService.warmUserCache(userId, 'client');
      addNotification('Cache warming completed!', 'success');
    } catch (error) {
      addNotification('Failed to warm caches', 'error');
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(1)}%`;
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Cache System Demo</h1>
        <p className="text-lg text-gray-600">
          Comprehensive multi-level caching with performance monitoring and offline support
        </p>
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`px-4 py-2 rounded-md shadow-lg ${
                notification.type === 'success' ? 'bg-green-100 text-green-800' :
                notification.type === 'error' ? 'bg-red-100 text-red-800' :
                'bg-blue-100 text-blue-800'
              }`}
            >
              {notification.message}
            </div>
          ))}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'examples', label: 'Cache Examples', icon: '📦' },
            { id: 'performance', label: 'Performance', icon: '⚡' },
            { id: 'debug', label: 'Debug Info', icon: '🔍' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Cache Controls */}
      <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg">
        <Button onClick={handleWarmCaches} variant="primary" size="sm">
          🔥 Warm Caches
        </Button>
        <Button onClick={handleClearAllCaches} variant="secondary" size="sm">
          🧹 Clear All Caches
        </Button>
        <Button onClick={refreshPerformance} variant="secondary" size="sm">
          📊 Refresh Performance
        </Button>
        <Button onClick={refreshDebug} variant="secondary" size="sm">
          🔍 Refresh Debug Info
        </Button>
      </div>

      {/* Tab Content */}
      {activeTab === 'examples' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* User Profile Cache */}
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">User Profile Cache</h3>
                <Badge variant={userProfileState.isFromCache ? 'success' : 'secondary'}>
                  {userProfileState.isFromCache ? 'Cached' : 'Fresh'}
                </Badge>
              </div>
              
              {userProfileState.loading && (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              )}
              
              {userProfileState.error && (
                <div className="text-red-600 text-sm mb-4">
                  Error: {userProfileState.error.message}
                </div>
              )}
              
              {userProfileState.data && (
                <div className="space-y-3">
                  <div>
                    <p className="font-medium">{userProfileState.data.name}</p>
                    <p className="text-sm text-gray-600">{userProfileState.data.email}</p>
                  </div>
                  <p className="text-sm text-gray-700">{userProfileState.data.bio}</p>
                  <div className="text-xs text-gray-500">
                    Last updated: {userProfileState.lastUpdated ? 
                      new Date(userProfileState.lastUpdated).toLocaleTimeString() : 'Never'}
                  </div>
                </div>
              )}
              
              <div className="mt-4 flex gap-2">
                <Button onClick={userProfileActions.refresh} size="sm" variant="secondary">
                  🔄 Refresh
                </Button>
                <Button onClick={userProfileActions.invalidate} size="sm" variant="secondary">
                  ❌ Invalidate
                </Button>
              </div>
              
              <div className="mt-4 text-xs text-gray-500">
                Hit Rate: {formatPercentage(userProfileState.cacheStats.hitRate)} 
                ({userProfileState.cacheStats.hits} hits, {userProfileState.cacheStats.misses} misses)
              </div>
            </div>
          </Card>

          {/* Coach Data Cache */}
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Coach Data Cache</h3>
                <Badge variant={coachDataState.isFromCache ? 'success' : 'secondary'}>
                  {coachDataState.isFromCache ? 'Cached' : 'Fresh'}
                </Badge>
              </div>
              
              {coachDataState.loading && (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                </div>
              )}
              
              {coachDataState.error && (
                <div className="text-red-600 text-sm mb-4">
                  Error: {coachDataState.error.message}
                </div>
              )}
              
              {coachDataState.data && (
                <div className="space-y-3">
                  <div>
                    <p className="font-medium">{coachDataState.data.name}</p>
                    <p className="text-sm text-gray-600">{coachDataState.data.title}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-500">⭐</span>
                    <span className="text-sm">{coachDataState.data.rating}</span>
                    <span className="text-sm text-gray-500">({coachDataState.data.reviewCount} reviews)</span>
                  </div>
                  <p className="text-sm text-gray-700">{coachDataState.data.bio}</p>
                  <div className="text-xs text-gray-500">
                    Last updated: {coachDataState.lastUpdated ? 
                      new Date(coachDataState.lastUpdated).toLocaleTimeString() : 'Never'}
                  </div>
                </div>
              )}
              
              <div className="mt-4 flex gap-2">
                <Button onClick={coachDataActions.refresh} size="sm" variant="secondary">
                  🔄 Refresh
                </Button>
                <Button onClick={coachDataActions.invalidate} size="sm" variant="secondary">
                  ❌ Invalidate
                </Button>
              </div>
              
              <div className="mt-4 text-xs text-gray-500">
                Hit Rate: {formatPercentage(coachDataState.cacheStats.hitRate)} 
                ({coachDataState.cacheStats.hits} hits, {coachDataState.cacheStats.misses} misses)
              </div>
            </div>
          </Card>

          {/* Search Results Cache */}
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Search Results Cache</h3>
                <Badge variant={searchResultsState.isFromCache ? 'success' : 'secondary'}>
                  {searchResultsState.isFromCache ? 'Cached' : 'Fresh'}
                </Badge>
              </div>
              
              {searchResultsState.loading && (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                </div>
              )}
              
              {searchResultsState.error && (
                <div className="text-red-600 text-sm mb-4">
                  Error: {searchResultsState.error.message}
                </div>
              )}
              
              {searchResultsState.data && (
                <div className="space-y-3">
                  <p className="text-sm font-medium">Results for "life coaching"</p>
                  <div className="space-y-2">
                    {searchResultsState.data.map((result: any) => (
                      <div key={result.id} className="flex justify-between items-center text-sm">
                        <span>{result.name}</span>
                        <span className="text-yellow-500">⭐ {result.rating}</span>
                      </div>
                    ))}
                  </div>
                  <div className="text-xs text-gray-500">
                    Last updated: {searchResultsState.lastUpdated ? 
                      new Date(searchResultsState.lastUpdated).toLocaleTimeString() : 'Never'}
                  </div>
                </div>
              )}
              
              <div className="mt-4 flex gap-2">
                <Button onClick={searchResultsActions.refresh} size="sm" variant="secondary">
                  🔄 Refresh
                </Button>
                <Button onClick={searchResultsActions.invalidate} size="sm" variant="secondary">
                  ❌ Invalidate
                </Button>
              </div>
              
              <div className="mt-4 text-xs text-gray-500">
                Hit Rate: {formatPercentage(searchResultsState.cacheStats.hitRate)} 
                ({searchResultsState.cacheStats.hits} hits, {searchResultsState.cacheStats.misses} misses)
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'performance' && (
        <div className="space-y-6">
          {perfLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : performance ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Overall Performance */}
              <Card>
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Overall Performance</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Hit Rate:</span>
                      <span className="font-medium">{formatPercentage(performance.overall?.hitRate || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Memory Usage:</span>
                      <span className="font-medium">{formatBytes(performance.overall?.memoryUsage || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Avg Response Time:</span>
                      <span className="font-medium">{(performance.overall?.avgResponseTime || 0).toFixed(2)}ms</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Cache-specific Performance */}
              {performance.enhanced && Object.entries(performance.enhanced).map(([cacheName, stats]: [string, any]) => (
                <Card key={cacheName}>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold mb-4 capitalize">{cacheName} Cache</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Hit Rate:</span>
                        <span className="font-medium">{formatPercentage(stats.hitRate || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Size:</span>
                        <span className="font-medium">{stats.size || 0} entries</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Memory:</span>
                        <span className="font-medium">{formatBytes(stats.memoryUsage || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Compression:</span>
                        <span className="font-medium">{formatPercentage(stats.compressionRatio || 0)}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500">
              Performance data not available
            </div>
          )}
        </div>
      )}

      {activeTab === 'debug' && (
        <div className="space-y-6">
          {debugLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : debugInfo ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Configuration */}
              <Card>
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Configuration</h3>
                  <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto">
                    {JSON.stringify(debugInfo.config, null, 2)}
                  </pre>
                </div>
              </Card>

              {/* Service Worker Stats */}
              <Card>
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Service Worker</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Status:</span>
                      <Badge variant={debugInfo.serviceWorkerStats ? 'success' : 'secondary'}>
                        {debugInfo.serviceWorkerStats ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    {debugInfo.serviceWorkerStats && (
                      <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto">
                        {JSON.stringify(debugInfo.serviceWorkerStats, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              </Card>

              {/* Performance Report */}
              <Card>
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Performance Report</h3>
                  {debugInfo.performanceReport && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Hit Rate</p>
                          <p className="text-lg font-semibold">{formatPercentage(debugInfo.performanceReport.overall.hitRate)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Memory Usage</p>
                          <p className="text-lg font-semibold">{formatBytes(debugInfo.performanceReport.overall.memoryUsage)}</p>
                        </div>
                      </div>
                      {debugInfo.performanceReport.recommendations.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2">Recommendations:</p>
                          <ul className="text-sm space-y-1">
                            {debugInfo.performanceReport.recommendations.map((rec: string, index: number) => (
                              <li key={index} className="text-gray-700">• {rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Card>

              {/* Cache Debug Info */}
              <Card>
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Cache Debug Info</h3>
                  <div className="max-h-96 overflow-auto">
                    <pre className="text-xs bg-gray-50 p-3 rounded">
                      {JSON.stringify(debugInfo.cacheDebugInfo, null, 2)}
                    </pre>
                  </div>
                </div>
              </Card>
            </div>
          ) : (
            <div className="text-center text-gray-500">
              Debug information not available
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CacheDemo;