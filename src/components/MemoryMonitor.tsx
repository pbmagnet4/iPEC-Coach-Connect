/**
 * Memory Monitor Component
 * 
 * Development tool for monitoring memory usage and detecting memory leaks
 * in real-time. Only renders in development mode.
 */

import React, { useEffect, useState } from 'react';
import { Activity, AlertTriangle, BarChart3, CheckCircle, Settings, Trash2, XCircle } from 'lucide-react';
import { memoryManager } from '../lib/memory-manager';
import { useMemoryMonitoring } from '../hooks/useMemoryCleanup';
import type { MemoryAlert, MemoryLeak, MemoryStats } from '../lib/memory-manager';

interface MemoryMonitorProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  minimizable?: boolean;
  updateInterval?: number;
  showAlerts?: boolean;
  showStats?: boolean;
  showLeaks?: boolean;
  className?: string;
}

export function MemoryMonitor({
  position = 'bottom-right',
  minimizable = true,
  updateInterval = 1000,
  showAlerts = true,
  showStats = true,
  showLeaks = true,
  className = ''
}: MemoryMonitorProps) {
  // Only render in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'stats' | 'leaks' | 'alerts'>('stats');
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  const { memoryStats, memoryLeaks, memoryAlerts, isHealthy } = useMemoryMonitoring(autoRefresh);

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))  } ${  sizes[i]}`;
  };

  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'error': return 'text-red-500 bg-red-50';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'medium': return 'text-orange-500 bg-orange-50';
      case 'high': return 'text-red-500 bg-red-50';
      case 'low': return 'text-blue-500 bg-blue-50';
      default: return 'text-gray-500 bg-gray-50';
    }
  };

  const getHealthStatus = (): { color: string; icon: React.ReactNode; text: string } => {
    if (isHealthy) {
      return {
        color: 'text-green-600',
        icon: <CheckCircle className="h-4 w-4" />,
        text: 'Healthy'
      };
    }
    
    const criticalAlerts = memoryAlerts.filter(alert => alert.severity === 'critical').length;
    const errorAlerts = memoryAlerts.filter(alert => alert.severity === 'error').length;
    
    if (criticalAlerts > 0) {
      return {
        color: 'text-red-600',
        icon: <XCircle className="h-4 w-4" />,
        text: 'Critical'
      };
    }
    
    if (errorAlerts > 0 || memoryLeaks.length > 0) {
      return {
        color: 'text-orange-600',
        icon: <AlertTriangle className="h-4 w-4" />,
        text: 'Warning'
      };
    }
    
    return {
      color: 'text-yellow-600',
      icon: <AlertTriangle className="h-4 w-4" />,
      text: 'Monitor'
    };
  };

  const handleForceGC = () => {
    memoryManager.forceGarbageCollection();
  };

  const handleClearAlerts = () => {
    // Clear old alerts (keep last 5)
    const alerts = memoryManager.getMemoryAlerts();
    if (alerts.length > 5) {
      alerts.splice(0, alerts.length - 5);
    }
  };

  const healthStatus = getHealthStatus();

  if (isMinimized) {
    return (
      <div className={`fixed ${positionClasses[position]} z-50 ${className}`}>
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-2">
          <button
            onClick={() => setIsMinimized(false)}
            className={`flex items-center gap-2 px-3 py-1 rounded text-sm font-medium transition-colors ${healthStatus.color} hover:bg-gray-100`}
          >
            <Activity className="h-4 w-4" />
            {healthStatus.icon}
            <span>Memory</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed ${positionClasses[position]} z-50 ${className}`}>
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 w-80 max-h-96 overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-gray-700" />
              <h3 className="text-sm font-semibold text-gray-900">Memory Monitor</h3>
              <div className={`flex items-center gap-1 ${healthStatus.color}`}>
                {healthStatus.icon}
                <span className="text-xs font-medium">{healthStatus.text}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`p-1 rounded ${autoRefresh ? 'text-green-600' : 'text-gray-400'} hover:bg-gray-200 transition-colors`}
                title={autoRefresh ? 'Auto-refresh enabled' : 'Auto-refresh disabled'}
              >
                <Activity className="h-4 w-4" />
              </button>
              <button
                onClick={handleForceGC}
                className="p-1 rounded text-gray-600 hover:bg-gray-200 transition-colors"
                title="Force garbage collection"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              {minimizable && (
                <button
                  onClick={() => setIsMinimized(true)}
                  className="p-1 rounded text-gray-600 hover:bg-gray-200 transition-colors"
                  title="Minimize"
                >
                  <Settings className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {showStats && (
            <button
              onClick={() => setSelectedTab('stats')}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                selectedTab === 'stats'
                  ? 'text-blue-600 bg-blue-50 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BarChart3 className="inline h-4 w-4 mr-1" />
              Stats
            </button>
          )}
          {showLeaks && (
            <button
              onClick={() => setSelectedTab('leaks')}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                selectedTab === 'leaks'
                  ? 'text-blue-600 bg-blue-50 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <AlertTriangle className="inline h-4 w-4 mr-1" />
              Leaks ({memoryLeaks.length})
            </button>
          )}
          {showAlerts && (
            <button
              onClick={() => setSelectedTab('alerts')}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                selectedTab === 'alerts'
                  ? 'text-blue-600 bg-blue-50 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <XCircle className="inline h-4 w-4 mr-1" />
              Alerts ({memoryAlerts.length})
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-4 max-h-64 overflow-y-auto">
          {selectedTab === 'stats' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-blue-50 p-2 rounded">
                  <div className="text-blue-600 font-medium">Listeners</div>
                  <div className="text-blue-800 text-lg font-semibold">
                    {formatNumber(memoryStats.totalListeners || 0)}
                  </div>
                </div>
                <div className="bg-green-50 p-2 rounded">
                  <div className="text-green-600 font-medium">Subscriptions</div>
                  <div className="text-green-800 text-lg font-semibold">
                    {formatNumber(memoryStats.totalSubscriptions || 0)}
                  </div>
                </div>
                <div className="bg-yellow-50 p-2 rounded">
                  <div className="text-yellow-600 font-medium">Intervals</div>
                  <div className="text-yellow-800 text-lg font-semibold">
                    {formatNumber(memoryStats.totalIntervals || 0)}
                  </div>
                </div>
                <div className="bg-purple-50 p-2 rounded">
                  <div className="text-purple-600 font-medium">Observers</div>
                  <div className="text-purple-800 text-lg font-semibold">
                    {formatNumber(memoryStats.totalObservers || 0)}
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-3 rounded">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Memory Usage</span>
                  <span className="text-sm text-gray-600">
                    {formatBytes(memoryStats.estimatedMemoryUsage || 0)}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  Active Components: {formatNumber(memoryStats.activeComponents || 0)}
                </div>
                <div className="text-xs text-gray-500">
                  Cleanup Callbacks: {formatNumber(memoryStats.cleanupCallbacks || 0)}
                </div>
                <div className="text-xs text-gray-500">
                  Last Cleanup: {memoryStats.lastCleanup ? new Date(memoryStats.lastCleanup).toLocaleTimeString() : 'Never'}
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'leaks' && (
            <div className="space-y-2">
              {memoryLeaks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p className="text-sm">No memory leaks detected</p>
                </div>
              ) : (
                memoryLeaks.slice(0, 10).map((leak, index) => (
                  <div key={index} className="bg-red-50 border border-red-200 rounded p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`inline-block w-2 h-2 rounded-full ${getSeverityColor(leak.severity).replace('text-', 'bg-').replace('bg-', 'bg-')}`} />
                          <span className="text-sm font-medium text-red-800">{leak.type}</span>
                          <span className="text-xs text-red-600">{leak.severity}</span>
                        </div>
                        <div className="text-sm text-red-700 mt-1">{leak.source}</div>
                        <div className="text-xs text-red-600 mt-1">
                          {new Date(leak.timestamp).toLocaleTimeString()}
                        </div>
                        {leak.details && (
                          <div className="text-xs text-red-500 mt-1">
                            {leak.details.component && `Component: ${leak.details.component}`}
                            {leak.details.age && ` | Age: ${Math.round(leak.details.age / 1000 / 60)}m`}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {selectedTab === 'alerts' && (
            <div className="space-y-2">
              {memoryAlerts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p className="text-sm">No memory alerts</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Recent Alerts</span>
                    <button
                      onClick={handleClearAlerts}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Clear
                    </button>
                  </div>
                  {memoryAlerts.slice(0, 10).map((alert, index) => (
                    <div key={index} className={`border rounded p-3 ${getSeverityColor(alert.severity)}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{alert.type}</span>
                            <span className="text-xs">{alert.severity}</span>
                          </div>
                          <div className="text-sm mt-1">{alert.message}</div>
                          <div className="text-xs mt-1">
                            {new Date(alert.timestamp).toLocaleTimeString()}
                          </div>
                          {alert.data && (
                            <div className="text-xs mt-1 opacity-75">
                              {typeof alert.data === 'object' 
                                ? JSON.stringify(alert.data, null, 2).substring(0, 100) + (JSON.stringify(alert.data).length > 100 ? '...' : '')
                                : String(alert.data)
                              }
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}