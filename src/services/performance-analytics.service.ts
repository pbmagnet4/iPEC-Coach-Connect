/**
 * Performance Analytics Service
 * Collects, processes, and provides real-time performance metrics and insights
 */

import { supabase } from '../lib/supabase';
import { cacheService } from '../lib/cache.service';

export interface PerformanceMetrics {
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

export interface WebVitalMeasurement {
  id: string;
  metric_name: 'LCP' | 'FID' | 'CLS' | 'FCP' | 'TTFB';
  value: number;
  url: string;
  user_agent: string;
  connection_type?: string;
  timestamp: string;
  session_id: string;
  user_id?: string;
}

export interface UserBehaviorEvent {
  id: string;
  event_type: 'page_view' | 'session_start' | 'session_end' | 'click' | 'scroll' | 'form_interaction';
  url: string;
  duration?: number;
  properties: Record<string, any>;
  timestamp: string;
  session_id: string;
  user_id?: string;
}

export interface ConversionEvent {
  id: string;
  event_type: 'registration' | 'booking' | 'subscription' | 'payment';
  value?: number;
  properties: Record<string, any>;
  timestamp: string;
  session_id: string;
  user_id?: string;
  funnel_stage: string;
}

export interface SystemMetric {
  id: string;
  metric_type: 'response_time' | 'memory_usage' | 'cpu_usage' | 'error_rate' | 'uptime';
  value: number;
  endpoint?: string;
  timestamp: string;
  additional_data?: Record<string, any>;
}

class PerformanceAnalyticsService {
  private readonly CACHE_TTL = 60000; // 1 minute
  private readonly BATCH_SIZE = 100;
  private pendingEvents: (WebVitalMeasurement | UserBehaviorEvent | ConversionEvent | SystemMetric)[] = [];
  private batchTimer: NodeJS.Timeout | null = null;

  /**
   * Initialize the performance analytics service
   */
  async initialize(): Promise<void> {
    try {
      // Create tables if they don't exist
      await this.createTables();
      
      // Start batch processing
      this.startBatchProcessing();
      
      // Set up Web Vitals collection
      this.setupWebVitalsCollection();
      
      // Set up user behavior tracking
      this.setupUserBehaviorTracking();

      console.log('Performance Analytics Service initialized');
    } catch (error) {
      console.error('Failed to initialize Performance Analytics Service:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive performance metrics
   */
  async getMetrics(timeRange: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<PerformanceMetrics> {
    const cacheKey = `performance_metrics_${timeRange}`;
    
    // Try to get from cache first
    const cached = cacheService.get(cacheKey);
    if (cached) {
      return cached as PerformanceMetrics;
    }

    try {
      const endTime = new Date();
      const startTime = new Date();
      
      switch (timeRange) {
        case '1h':
          startTime.setHours(endTime.getHours() - 1);
          break;
        case '24h':
          startTime.setDate(endTime.getDate() - 1);
          break;
        case '7d':
          startTime.setDate(endTime.getDate() - 7);
          break;
        case '30d':
          startTime.setDate(endTime.getDate() - 30);
          break;
      }

      const [overview, webVitals, userBehavior, conversions, systemHealth] = await Promise.all([
        this.getOverviewMetrics(startTime, endTime),
        this.getWebVitalsMetrics(startTime, endTime),
        this.getUserBehaviorMetrics(startTime, endTime),
        this.getConversionMetrics(startTime, endTime),
        this.getSystemHealthMetrics(startTime, endTime)
      ]);

      const metrics: PerformanceMetrics = {
        overview,
        webVitals,
        userBehavior,
        conversions,
        systemHealth
      };

      // Cache the results
      cacheService.set(cacheKey, metrics, this.CACHE_TTL);

      return metrics;
    } catch (error) {
      console.error('Failed to get performance metrics:', error);
      throw error;
    }
  }

  /**
   * Track Web Vitals measurements
   */
  async trackWebVital(measurement: Omit<WebVitalMeasurement, 'id' | 'timestamp'>): Promise<void> {
    const event: WebVitalMeasurement = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      ...measurement
    };

    this.addToBatch(event);
  }

  /**
   * Track user behavior events
   */
  async trackUserBehavior(event: Omit<UserBehaviorEvent, 'id' | 'timestamp'>): Promise<void> {
    const behaviorEvent: UserBehaviorEvent = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      ...event
    };

    this.addToBatch(behaviorEvent);
  }

  /**
   * Track conversion events
   */
  async trackConversion(event: Omit<ConversionEvent, 'id' | 'timestamp'>): Promise<void> {
    const conversionEvent: ConversionEvent = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      ...event
    };

    this.addToBatch(conversionEvent);
  }

  /**
   * Track system metrics
   */
  async trackSystemMetric(metric: Omit<SystemMetric, 'id' | 'timestamp'>): Promise<void> {
    const systemMetric: SystemMetric = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      ...metric
    };

    this.addToBatch(systemMetric);
  }

  /**
   * Export metrics data
   */
  async exportMetrics(timeRange: '1h' | '24h' | '7d' | '30d' = '24h', format: 'csv' | 'json' = 'csv'): Promise<void> {
    try {
      const metrics = await this.getMetrics(timeRange);
      
      if (format === 'csv') {
        this.exportToCSV(metrics, timeRange);
      } else {
        this.exportToJSON(metrics, timeRange);
      }
    } catch (error) {
      console.error('Failed to export metrics:', error);
      throw error;
    }
  }

  // Private methods

  private async createTables(): Promise<void> {
    const tables = [
      // Web Vitals table
      `
        CREATE TABLE IF NOT EXISTS web_vitals (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          metric_name TEXT NOT NULL,
          value NUMERIC NOT NULL,
          url TEXT NOT NULL,
          user_agent TEXT,
          connection_type TEXT,
          timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          session_id TEXT NOT NULL,
          user_id UUID REFERENCES auth.users(id)
        );
        CREATE INDEX IF NOT EXISTS idx_web_vitals_timestamp ON web_vitals(timestamp);
        CREATE INDEX IF NOT EXISTS idx_web_vitals_metric_name ON web_vitals(metric_name);
      `,
      // User Behavior table
      `
        CREATE TABLE IF NOT EXISTS user_behavior_events (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          event_type TEXT NOT NULL,
          url TEXT NOT NULL,
          duration INTEGER,
          properties JSONB DEFAULT '{}',
          timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          session_id TEXT NOT NULL,
          user_id UUID REFERENCES auth.users(id)
        );
        CREATE INDEX IF NOT EXISTS idx_user_behavior_timestamp ON user_behavior_events(timestamp);
        CREATE INDEX IF NOT EXISTS idx_user_behavior_event_type ON user_behavior_events(event_type);
      `,
      // Conversion Events table
      `
        CREATE TABLE IF NOT EXISTS conversion_events (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          event_type TEXT NOT NULL,
          value NUMERIC,
          properties JSONB DEFAULT '{}',
          timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          session_id TEXT NOT NULL,
          user_id UUID REFERENCES auth.users(id),
          funnel_stage TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_conversion_events_timestamp ON conversion_events(timestamp);
        CREATE INDEX IF NOT EXISTS idx_conversion_events_type ON conversion_events(event_type);
      `,
      // System Metrics table
      `
        CREATE TABLE IF NOT EXISTS system_metrics (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          metric_type TEXT NOT NULL,
          value NUMERIC NOT NULL,
          endpoint TEXT,
          timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          additional_data JSONB DEFAULT '{}'
        );
        CREATE INDEX IF NOT EXISTS idx_system_metrics_timestamp ON system_metrics(timestamp);
        CREATE INDEX IF NOT EXISTS idx_system_metrics_type ON system_metrics(metric_type);
      `
    ];

    for (const sql of tables) {
      await supabase.rpc('exec_sql', { sql });
    }
  }

  private async getOverviewMetrics(startTime: Date, endTime: Date) {
    const { data: userStats } = await supabase
      .from('user_behavior_events')
      .select('user_id, session_id')
      .gte('timestamp', startTime.toISOString())
      .lte('timestamp', endTime.toISOString());

    const { data: pageViews } = await supabase
      .from('user_behavior_events')
      .select('*')
      .eq('event_type', 'page_view')
      .gte('timestamp', startTime.toISOString())
      .lte('timestamp', endTime.toISOString());

    const { data: conversions } = await supabase
      .from('conversion_events')
      .select('*')
      .gte('timestamp', startTime.toISOString())
      .lte('timestamp', endTime.toISOString());

    const { data: loadTimes } = await supabase
      .from('web_vitals')
      .select('value')
      .eq('metric_name', 'LCP')
      .gte('timestamp', startTime.toISOString())
      .lte('timestamp', endTime.toISOString());

    const { data: errors } = await supabase
      .from('system_metrics')
      .select('*')
      .eq('metric_type', 'error_rate')
      .gte('timestamp', startTime.toISOString())
      .lte('timestamp', endTime.toISOString());

    const uniqueUsers = new Set(userStats?.map(s => s.user_id) || []).size;
    const uniqueSessions = new Set(userStats?.map(s => s.session_id) || []).size;
    const totalPageViews = pageViews?.length || 0;
    const totalConversions = conversions?.length || 0;
    const avgLoadTime = loadTimes?.reduce((sum, t) => sum + (t.value || 0), 0) / (loadTimes?.length || 1);
    const avgErrorRate = errors?.reduce((sum, e) => sum + (e.value || 0), 0) / (errors?.length || 1);

    return {
      totalUsers: uniqueUsers,
      activeUsers: uniqueSessions,
      pageViews: totalPageViews,
      conversionRate: totalPageViews > 0 ? (totalConversions / totalPageViews) * 100 : 0,
      averageLoadTime: avgLoadTime,
      errorRate: avgErrorRate
    };
  }

  private async getWebVitalsMetrics(startTime: Date, endTime: Date) {
    const { data } = await supabase
      .from('web_vitals')
      .select('metric_name, value')
      .gte('timestamp', startTime.toISOString())
      .lte('timestamp', endTime.toISOString());

    const metrics = data?.reduce((acc, item) => {
      if (!acc[item.metric_name]) acc[item.metric_name] = [];
      acc[item.metric_name].push(item.value);
      return acc;
    }, {} as Record<string, number[]>) || {};

    const getAverage = (values: number[]) => 
      values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;

    return {
      lcp: getAverage(metrics.LCP || []),
      fid: getAverage(metrics.FID || []),
      cls: getAverage(metrics.CLS || []),
      fcp: getAverage(metrics.FCP || []),
      ttfb: getAverage(metrics.TTFB || [])
    };
  }

  private async getUserBehaviorMetrics(startTime: Date, endTime: Date) {
    const { data: sessions } = await supabase
      .from('user_behavior_events')
      .select('session_id, event_type, duration, url')
      .gte('timestamp', startTime.toISOString())
      .lte('timestamp', endTime.toISOString());

    const sessionMap = new Map<string, any>();
    const pageCounts = new Map<string, { views: number; totalTime: number }>();

    sessions?.forEach(event => {
      if (!sessionMap.has(event.session_id)) {
        sessionMap.set(event.session_id, { events: [], duration: 0, pages: 0 });
      }
      
      const session = sessionMap.get(event.session_id);
      session.events.push(event);
      
      if (event.event_type === 'page_view') {
        session.pages++;
        
        const current = pageCounts.get(event.url) || { views: 0, totalTime: 0 };
        current.views++;
        current.totalTime += event.duration || 0;
        pageCounts.set(event.url, current);
      }
      
      if (event.duration) {
        session.duration += event.duration;
      }
    });

    const sessionValues = Array.from(sessionMap.values());
    const avgDuration = sessionValues.reduce((sum, s) => sum + s.duration, 0) / sessionValues.length;
    const avgPages = sessionValues.reduce((sum, s) => sum + s.pages, 0) / sessionValues.length;
    const bounceRate = sessionValues.filter(s => s.pages === 1).length / sessionValues.length * 100;

    const topPages = Array.from(pageCounts.entries())
      .map(([path, data]) => ({
        path,
        views: data.views,
        avgTime: data.totalTime / data.views
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    return {
      sessionDuration: avgDuration,
      bounceRate,
      pagesPerSession: avgPages,
      topPages
    };
  }

  private async getConversionMetrics(startTime: Date, endTime: Date) {
    const { data } = await supabase
      .from('conversion_events')
      .select('event_type, funnel_stage')
      .gte('timestamp', startTime.toISOString())
      .lte('timestamp', endTime.toISOString());

    const conversions = data?.reduce((acc, event) => {
      acc[event.event_type] = (acc[event.event_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const funnelStages = data?.reduce((acc, event) => {
      acc[event.funnel_stage] = (acc[event.funnel_stage] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const funnel = Object.entries(funnelStages).map(([stage, users]) => ({
      stage,
      users,
      rate: users / (Object.values(funnelStages).reduce((sum, count) => sum + count, 0)) * 100
    }));

    return {
      registrations: conversions.registration || 0,
      bookings: conversions.booking || 0,
      subscriptions: conversions.subscription || 0,
      funnel
    };
  }

  private async getSystemHealthMetrics(startTime: Date, endTime: Date) {
    const { data } = await supabase
      .from('system_metrics')
      .select('metric_type, value')
      .gte('timestamp', startTime.toISOString())
      .lte('timestamp', endTime.toISOString());

    const metrics = data?.reduce((acc, item) => {
      if (!acc[item.metric_type]) acc[item.metric_type] = [];
      acc[item.metric_type].push(item.value);
      return acc;
    }, {} as Record<string, number[]>) || {};

    const getAverage = (values: number[]) => 
      values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;

    return {
      uptime: getAverage(metrics.uptime || []),
      memoryUsage: getAverage(metrics.memory_usage || []),
      cpuUsage: getAverage(metrics.cpu_usage || []),
      responseTime: getAverage(metrics.response_time || []),
      errors: [
        { type: 'Client Errors', count: 0, trend: 0 },
        { type: 'Server Errors', count: 0, trend: 0 },
        { type: 'Network Errors', count: 0, trend: 0 }
      ]
    };
  }

  private addToBatch(event: WebVitalMeasurement | UserBehaviorEvent | ConversionEvent | SystemMetric): void {
    this.pendingEvents.push(event);

    if (this.pendingEvents.length >= this.BATCH_SIZE) {
      this.processBatch();
    }
  }

  private startBatchProcessing(): void {
    this.batchTimer = setInterval(() => {
      if (this.pendingEvents.length > 0) {
        this.processBatch();
      }
    }, 5000); // Process every 5 seconds
  }

  private async processBatch(): Promise<void> {
    if (this.pendingEvents.length === 0) return;

    const events = [...this.pendingEvents];
    this.pendingEvents = [];

    try {
      const webVitals = events.filter(e => 'metric_name' in e);
      const userBehavior = events.filter(e => 'event_type' in e && 'url' in e);
      const conversions = events.filter(e => 'event_type' in e && 'funnel_stage' in e);
      const systemMetrics = events.filter(e => 'metric_type' in e);

      const promises: Promise<any>[] = [];

      if (webVitals.length > 0) {
        promises.push(supabase.from('web_vitals').insert(webVitals));
      }

      if (userBehavior.length > 0) {
        promises.push(supabase.from('user_behavior_events').insert(userBehavior));
      }

      if (conversions.length > 0) {
        promises.push(supabase.from('conversion_events').insert(conversions));
      }

      if (systemMetrics.length > 0) {
        promises.push(supabase.from('system_metrics').insert(systemMetrics));
      }

      await Promise.all(promises);
    } catch (error) {
      console.error('Failed to process analytics batch:', error);
      // Re-add events to retry later
      this.pendingEvents.unshift(...events);
    }
  }

  private setupWebVitalsCollection(): void {
    if (typeof window === 'undefined') return;

    // Check if web-vitals library is available
    if ('web-vitals' in window || typeof (window as any).webVitals !== 'undefined') {
      this.collectWebVitals();
    } else {
      // Fallback: Manual performance measurements
      this.collectManualWebVitals();
    }
  }

  private collectWebVitals(): void {
    try {
      // This would use the web-vitals library if available
      // For now, we'll use the manual approach
      this.collectManualWebVitals();
    } catch (error) {
      console.error('Failed to collect web vitals:', error);
    }
  }

  private collectManualWebVitals(): void {
    if (typeof window === 'undefined') return;

    const sessionId = this.getSessionId();
    
    // Collect FCP and LCP
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.entryType === 'paint') {
              if (entry.name === 'first-contentful-paint') {
                this.trackWebVital({
                  metric_name: 'FCP',
                  value: entry.startTime,
                  url: window.location.href,
                  user_agent: navigator.userAgent,
                  session_id: sessionId
                });
              }
            } else if (entry.entryType === 'largest-contentful-paint') {
              this.trackWebVital({
                metric_name: 'LCP',
                value: entry.startTime,
                url: window.location.href,
                user_agent: navigator.userAgent,
                session_id: sessionId
              });
            }
          });
        });

        observer.observe({ entryTypes: ['paint', 'largest-contentful-paint'] });
      } catch (error) {
        console.error('Failed to set up performance observer:', error);
      }
    }
  }

  private setupUserBehaviorTracking(): void {
    if (typeof window === 'undefined') return;

    const sessionId = this.getSessionId();

    // Track page views
    this.trackUserBehavior({
      event_type: 'page_view',
      url: window.location.href,
      session_id: sessionId,
      properties: {
        referrer: document.referrer,
        user_agent: navigator.userAgent
      }
    });

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      this.trackUserBehavior({
        event_type: document.hidden ? 'page_hidden' : 'page_visible',
        url: window.location.href,
        session_id: sessionId,
        properties: {}
      } as UserBehaviorEvent);
    });
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  }

  private exportToCSV(metrics: PerformanceMetrics, timeRange: string): void {
    const csvData = [
      ['Metric', 'Value', 'Time Range'],
      ['Total Users', metrics.overview.totalUsers.toString(), timeRange],
      ['Active Users', metrics.overview.activeUsers.toString(), timeRange],
      ['Page Views', metrics.overview.pageViews.toString(), timeRange],
      ['Conversion Rate', `${metrics.overview.conversionRate.toFixed(2)}%`, timeRange],
      ['Average Load Time', `${(metrics.overview.averageLoadTime / 1000).toFixed(2)}s`, timeRange],
      ['Error Rate', `${metrics.overview.errorRate.toFixed(2)}%`, timeRange],
      ['LCP', `${(metrics.webVitals.lcp / 1000).toFixed(2)}s`, timeRange],
      ['FID', `${metrics.webVitals.fid.toFixed(0)}ms`, timeRange],
      ['CLS', metrics.webVitals.cls.toFixed(3), timeRange]
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `performance-metrics-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  private exportToJSON(metrics: PerformanceMetrics, timeRange: string): void {
    const jsonContent = JSON.stringify({
      timeRange,
      exportedAt: new Date().toISOString(),
      metrics
    }, null, 2);

    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `performance-metrics-${timeRange}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }
}

export const performanceAnalyticsService = new PerformanceAnalyticsService();