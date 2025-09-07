/**
 * Performance Analytics Dashboard
 * Real-time performance metrics visualization and monitoring system
 */

import React, { useEffect, useState } from 'react';
import { 
  Activity, 
  AlertTriangle, 
  BarChart3, 
  Calendar, 
  CheckCircle, 
  Clock,
  Download,
  Eye,
  MousePointer,
  PieChart,
  RefreshCw,
  TrendingUp,
  Users,
  Zap
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { performanceAnalyticsService } from '../../services/performance-analytics.service';
import { WebVitalsChart } from './WebVitalsChart';
import { UserBehaviorChart } from './UserBehaviorChart';
import { ConversionFunnelChart } from './ConversionFunnelChart';
import { SystemHealthChart } from './SystemHealthChart';

interface PerformanceMetrics {
  overview: {
    totalUsers: number;
    activeUsers: number;
    pageViews: number;
    conversionRate: number;
    averageLoadTime: number;
    errorRate: number;
  };
  webVitals: {
    lcp: number;
    fid: number;
    cls: number;
    fcp: number;
    ttfb: number;
  };
  userBehavior: {
    sessionDuration: number;
    bounceRate: number;
    pagesPerSession: number;
    topPages: { path: string; views: number; avgTime: number }[];
  };
  conversions: {
    registrations: number;
    bookings: number;
    subscriptions: number;
    funnel: { stage: string; users: number; rate: number }[];
  };
  systemHealth: {
    uptime: number;
    memoryUsage: number;
    cpuUsage: number;
    responseTime: number;
    errors: { type: string; count: number; trend: number }[];
  };
}

interface PerformanceAnalyticsDashboardProps {
  timeRange?: '1h' | '24h' | '7d' | '30d';
  refreshInterval?: number;
}

export function PerformanceAnalyticsDashboard({ 
  timeRange = '24h', 
  refreshInterval = 30000 
}: PerformanceAnalyticsDashboardProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, [selectedTimeRange]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadMetrics(true);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, selectedTimeRange]);

  const loadMetrics = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    
    try {
      const data = await performanceAnalyticsService.getMetrics(selectedTimeRange);
      setMetrics(data);
      setLastUpdated(new Date());
    } catch (error) {
  void console.error('Failed to load performance metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportData = async () => {
    try {
      await performanceAnalyticsService.exportMetrics(selectedTimeRange);
    } catch (error) {
  void console.error('Failed to export metrics:', error);
    }
  };

  const getStatusColor = (value: number, thresholds: { good: number; poor: number }) => {
    if (value <= thresholds.good) return 'text-green-600';
    if (value <= thresholds.poor) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusIcon = (value: number, thresholds: { good: number; poor: number }) => {
    if (value <= thresholds.good) return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (value <= thresholds.poor) return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
    return <AlertTriangle className="w-4 h-4 text-red-600" />;
  };

  if (loading && !metrics) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-lg">Loading performance metrics...</span>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Metrics</h3>
        <p className="text-gray-600 mb-4">Unable to retrieve performance data</p>
        <Button onClick={() => loadMetrics()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance Analytics</h1>
          <p className="text-gray-600">
            Real-time monitoring and performance insights • 
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Time Range Selector */}
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value as any)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>

          {/* Auto-refresh Toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center px-3 py-2 text-sm rounded-lg ${
              autoRefresh 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            <Activity className={`w-4 h-4 mr-1 ${autoRefresh ? 'animate-pulse' : ''}`} />
            {autoRefresh ? 'Live' : 'Paused'}
          </button>

          {/* Export Button */}
          <Button variant="secondary" onClick={exportData}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>

          {/* Manual Refresh */}
          <Button 
            variant="secondary" 
            onClick={() => loadMetrics(true)}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold">{metrics.overview.totalUsers.toLocaleString()}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Users</p>
                <p className="text-2xl font-bold">{metrics.overview.activeUsers.toLocaleString()}</p>
              </div>
              <Activity className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Page Views</p>
                <p className="text-2xl font-bold">{metrics.overview.pageViews.toLocaleString()}</p>
              </div>
              <Eye className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold">{metrics.overview.conversionRate.toFixed(1)}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Load Time</p>
                <p className={`text-2xl font-bold ${getStatusColor(metrics.overview.averageLoadTime, { good: 2000, poor: 4000 })}`}>
                  {(metrics.overview.averageLoadTime / 1000).toFixed(1)}s
                </p>
              </div>
              <Clock className="w-8 h-8 text-indigo-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Error Rate</p>
                <p className={`text-2xl font-bold ${getStatusColor(metrics.overview.errorRate, { good: 1, poor: 5 })}`}>
                  {metrics.overview.errorRate.toFixed(2)}%
                </p>
              </div>
              {getStatusIcon(metrics.overview.errorRate, { good: 1, poor: 5 })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Core Web Vitals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="w-5 h-5 mr-2" />
            Core Web Vitals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">LCP (Largest Contentful Paint)</div>
              <div className={`text-2xl font-bold ${getStatusColor(metrics.webVitals.lcp, { good: 2500, poor: 4000 })}`}>
                {(metrics.webVitals.lcp / 1000).toFixed(1)}s
              </div>
              <div className="text-xs text-gray-500">Good: ≤2.5s</div>
            </div>
            
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">FID (First Input Delay)</div>
              <div className={`text-2xl font-bold ${getStatusColor(metrics.webVitals.fid, { good: 100, poor: 300 })}`}>
                {metrics.webVitals.fid.toFixed(0)}ms
              </div>
              <div className="text-xs text-gray-500">Good: ≤100ms</div>
            </div>
            
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">CLS (Cumulative Layout Shift)</div>
              <div className={`text-2xl font-bold ${getStatusColor(metrics.webVitals.cls, { good: 0.1, poor: 0.25 })}`}>
                {metrics.webVitals.cls.toFixed(3)}
              </div>
              <div className="text-xs text-gray-500">Good: ≤0.1</div>
            </div>
            
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">FCP (First Contentful Paint)</div>
              <div className={`text-2xl font-bold ${getStatusColor(metrics.webVitals.fcp, { good: 1800, poor: 3000 })}`}>
                {(metrics.webVitals.fcp / 1000).toFixed(1)}s
              </div>
              <div className="text-xs text-gray-500">Good: ≤1.8s</div>
            </div>
            
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">TTFB (Time to First Byte)</div>
              <div className={`text-2xl font-bold ${getStatusColor(metrics.webVitals.ttfb, { good: 800, poor: 1800 })}`}>
                {metrics.webVitals.ttfb.toFixed(0)}ms
              </div>
              <div className="text-xs text-gray-500">Good: ≤800ms</div>
            </div>
          </div>
          
          <div className="mt-6">
            <WebVitalsChart data={metrics.webVitals} timeRange={selectedTimeRange} />
          </div>
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Behavior */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MousePointer className="w-5 h-5 mr-2" />
              User Behavior
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-sm text-gray-600">Session Duration</div>
                <div className="text-xl font-bold">{Math.round(metrics.userBehavior.sessionDuration / 60)}m</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600">Bounce Rate</div>
                <div className="text-xl font-bold">{metrics.userBehavior.bounceRate.toFixed(1)}%</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600">Pages/Session</div>
                <div className="text-xl font-bold">{metrics.userBehavior.pagesPerSession.toFixed(1)}</div>
              </div>
            </div>
            <UserBehaviorChart data={metrics.userBehavior} timeRange={selectedTimeRange} />
          </CardContent>
        </Card>

        {/* Conversion Funnel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Conversion Funnel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-sm text-gray-600">Registrations</div>
                <div className="text-xl font-bold">{metrics.conversions.registrations}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600">Bookings</div>
                <div className="text-xl font-bold">{metrics.conversions.bookings}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600">Subscriptions</div>
                <div className="text-xl font-bold">{metrics.conversions.subscriptions}</div>
              </div>
            </div>
            <ConversionFunnelChart data={metrics.conversions.funnel} />
          </CardContent>
        </Card>
      </div>

      {/* System Health and Top Pages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center">
                <div className="text-sm text-gray-600">Uptime</div>
                <div className="text-xl font-bold text-green-600">{metrics.systemHealth.uptime.toFixed(2)}%</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600">Response Time</div>
                <div className="text-xl font-bold">{metrics.systemHealth.responseTime.toFixed(0)}ms</div>
              </div>
            </div>
            <SystemHealthChart data={metrics.systemHealth} timeRange={selectedTimeRange} />
          </CardContent>
        </Card>

        {/* Top Pages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="w-5 h-5 mr-2" />
              Top Pages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.userBehavior.topPages.map((page, index) => (
                <div key={page.path} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{page.path}</div>
                    <div className="text-xs text-gray-600">
                      Avg. time: {Math.round(page.avgTime / 1000)}s
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{page.views.toLocaleString()}</div>
                    <div className="text-xs text-gray-600">views</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Errors Summary */}
      {metrics.systemHealth.errors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
              Error Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {metrics.systemHealth.errors.map((error, index) => (
                <div key={error.type} className="p-4 border border-red-200 rounded-lg bg-red-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-red-800">{error.type}</div>
                    <div className={`text-sm ${error.trend > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {error.trend > 0 ? '↑' : '↓'} {Math.abs(error.trend)}%
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-red-900">{error.count}</div>
                  <div className="text-xs text-red-700">occurrences</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default PerformanceAnalyticsDashboard;