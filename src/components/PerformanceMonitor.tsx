import React, { useEffect, useRef, useState } from 'react';
import { initPerformanceMonitoring } from '../utils/preload';

// Core Web Vitals and performance monitoring component
interface PerformanceMetrics {
  // Core Web Vitals
  lcp: number | null; // Largest Contentful Paint
  fid: number | null; // First Input Delay
  cls: number | null; // Cumulative Layout Shift
  fcp: number | null; // First Contentful Paint
  ttfb: number | null; // Time to First Byte
  
  // Additional metrics
  domContentLoaded: number | null;
  loadComplete: number | null;
  memoryUsed: number | null;
  
  // Network information
  connectionType: string | null;
  effectiveType: string | null;
  saveData: boolean;
  
  // Bundle performance
  jsLoadTime: number | null;
  cssLoadTime: number | null;
  totalResourcesLoaded: number;
  
  // User experience metrics
  pageLoadTime: number | null;
  timeToInteractive: number | null;
}

interface PerformanceThresholds {
  lcp: { good: number; needsImprovement: number };
  fid: { good: number; needsImprovement: number };
  cls: { good: number; needsImprovement: number };
  fcp: { good: number; needsImprovement: number };
  ttfb: { good: number; needsImprovement: number };
}

// Performance thresholds based on Core Web Vitals
const PERFORMANCE_THRESHOLDS: PerformanceThresholds = {
  lcp: { good: 2500, needsImprovement: 4000 },
  fid: { good: 100, needsImprovement: 300 },
  cls: { good: 0.1, needsImprovement: 0.25 },
  fcp: { good: 1800, needsImprovement: 3000 },
  ttfb: { good: 800, needsImprovement: 1800 }
};

// Performance monitoring hook
export const usePerformanceMonitoring = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    lcp: null,
    fid: null,
    cls: null,
    fcp: null,
    ttfb: null,
    domContentLoaded: null,
    loadComplete: null,
    memoryUsed: null,
    connectionType: null,
    effectiveType: null,
    saveData: false,
    jsLoadTime: null,
    cssLoadTime: null,
    totalResourcesLoaded: 0,
    pageLoadTime: null,
    timeToInteractive: null
  });
  
  const [isMonitoring, setIsMonitoring] = useState(false);
  const observerRef = useRef<PerformanceObserver | null>(null);
  
  // Initialize performance monitoring
  useEffect(() => {
    if (typeof window === 'undefined' || isMonitoring) return;
    
    setIsMonitoring(true);
    
    // Initialize core monitoring
    initPerformanceMonitoring();
    
    // Collect initial metrics
    collectInitialMetrics();
    
    // Set up Core Web Vitals monitoring
    setupCoreWebVitalsMonitoring();
    
    // Set up resource monitoring
    setupResourceMonitoring();
    
    // Set up memory monitoring
    setupMemoryMonitoring();
    
    // Set up network monitoring
    setupNetworkMonitoring();
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [isMonitoring]);
  
  // Collect initial performance metrics
  const collectInitialMetrics = () => {
    if (!window.performance) return;
    
    const navigation = window.performance.getEntriesByType('navigation')[0];
    if (navigation) {
      const domContentLoaded = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart;
      const loadComplete = navigation.loadEventEnd - navigation.loadEventStart;
      const ttfb = navigation.responseStart - navigation.requestStart;
      
      setMetrics(prev => ({
        ...prev,
        domContentLoaded,
        loadComplete,
        ttfb,
        pageLoadTime: navigation.loadEventEnd - navigation.navigationStart
      }));
    }
  };
  
  // Set up Core Web Vitals monitoring with fallback to native APIs
  const setupCoreWebVitalsMonitoring = async () => {
    try {
      // Safe dynamic import with proper error handling
      const { getCLS, getFID, getFCP, getLCP, getTTFB } = await import('web-vitals');
      
      getCLS((metric) => {
        setMetrics(prev => ({ ...prev, cls: metric.value }));
        reportMetric('CLS', metric.value, PERFORMANCE_THRESHOLDS.cls);
      });
      
      getFID((metric) => {
        setMetrics(prev => ({ ...prev, fid: metric.value }));
        reportMetric('FID', metric.value, PERFORMANCE_THRESHOLDS.fid);
      });
      
      getFCP((metric) => {
        setMetrics(prev => ({ ...prev, fcp: metric.value }));
        reportMetric('FCP', metric.value, PERFORMANCE_THRESHOLDS.fcp);
      });
      
      getLCP((metric) => {
        setMetrics(prev => ({ ...prev, lcp: metric.value }));
        reportMetric('LCP', metric.value, PERFORMANCE_THRESHOLDS.lcp);
      });
      
      getTTFB((metric) => {
        setMetrics(prev => ({ ...prev, ttfb: metric.value }));
        reportMetric('TTFB', metric.value, PERFORMANCE_THRESHOLDS.ttfb);
      });
      
    } catch (error) {
      console.info('Web Vitals library not available, using fallback performance monitoring');
      // Fallback to basic performance API measurements
      setupFallbackWebVitalsMonitoring();
    }
  };

  // Fallback Core Web Vitals monitoring using native Performance API
  const setupFallbackWebVitalsMonitoring = () => {
    if (!window.performance) return;

    // Fallback FCP measurement
    const paintEntries = window.performance.getEntriesByType('paint');
    const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    if (fcpEntry) {
      setMetrics(prev => ({ ...prev, fcp: fcpEntry.startTime }));
      reportMetric('FCP', fcpEntry.startTime, PERFORMANCE_THRESHOLDS.fcp);
    }

    // Fallback TTFB from navigation timing
    const navigationEntries = window.performance.getEntriesByType('navigation');
    if (navigationEntries.length > 0) {
      const nav = navigationEntries[0];
      const ttfb = nav.responseStart - nav.requestStart;
      setMetrics(prev => ({ ...prev, ttfb }));
      reportMetric('TTFB', ttfb, PERFORMANCE_THRESHOLDS.ttfb);
    }

    console.info('Using fallback performance monitoring - consider installing web-vitals package for enhanced metrics');
  };
  
  // Set up resource monitoring
  const setupResourceMonitoring = () => {
    if (!window.PerformanceObserver) return;
    
    observerRef.current = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      let jsLoadTime = 0;
      let cssLoadTime = 0;
      let totalResources = 0;
      
      entries.forEach((entry) => {
        if (entry.entryType === 'resource') {
          const resourceEntry = entry as PerformanceResourceTiming;
          totalResources++;
          
          if (resourceEntry.name.endsWith('.js')) {
            jsLoadTime += resourceEntry.duration;
          } else if (resourceEntry.name.endsWith('.css')) {
            cssLoadTime += resourceEntry.duration;
          }
        }
      });
      
      setMetrics(prev => ({
        ...prev,
        jsLoadTime: prev.jsLoadTime ? prev.jsLoadTime + jsLoadTime : jsLoadTime,
        cssLoadTime: prev.cssLoadTime ? prev.cssLoadTime + cssLoadTime : cssLoadTime,
        totalResourcesLoaded: prev.totalResourcesLoaded + totalResources
      }));
    });
    
    observerRef.current.observe({ entryTypes: ['resource'] });
  };
  
  // Set up memory monitoring
  const setupMemoryMonitoring = () => {
    if (!('memory' in window.performance)) return;
    
    const updateMemoryUsage = () => {
      const {memory} = (window.performance as any);
      if (memory) {
        setMetrics(prev => ({
          ...prev,
          memoryUsed: memory.usedJSHeapSize
        }));
      }
    };
    
    // Update memory usage every 5 seconds
    const interval = setInterval(updateMemoryUsage, 5000);
    updateMemoryUsage(); // Initial update
    
    return () => clearInterval(interval);
  };
  
  // Set up network monitoring
  const setupNetworkMonitoring = () => {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    if (connection) {
      setMetrics(prev => ({
        ...prev,
        connectionType: connection.type || 'unknown',
        effectiveType: connection.effectiveType || 'unknown',
        saveData: connection.saveData || false
      }));
      
      // Listen for connection changes
      connection.addEventListener('change', () => {
        setMetrics(prev => ({
          ...prev,
          connectionType: connection.type || 'unknown',
          effectiveType: connection.effectiveType || 'unknown',
          saveData: connection.saveData || false
        }));
      });
    }
  };
  
  // Report metric to analytics/monitoring service
  const reportMetric = (
    name: string,
    value: number,
    thresholds: { good: number; needsImprovement: number }
  ) => {
    let rating: 'good' | 'needs-improvement' | 'poor';
    
    if (value <= thresholds.good) {
      rating = 'good';
    } else if (value <= thresholds.needsImprovement) {
      rating = 'needs-improvement';
    } else {
      rating = 'poor';
    }
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`${name}: ${value}ms (${rating})`);
    }
    
    // Send to analytics service (implement based on your needs)
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'web_vitals', {
        event_category: 'Performance',
        event_label: name,
        value: Math.round(value),
        custom_map: { metric_rating: rating }
      });
    }
    
    // Send to monitoring service (skip in development)
    if (navigator.sendBeacon && process.env.NODE_ENV === 'production') {
      const data = JSON.stringify({
        metric: name,
        value,
        rating,
        timestamp: Date.now(),
        url: window.location.href
      });
      
      navigator.sendBeacon('/api/metrics', data);
    }
  };
  
  // Get performance score
  const getPerformanceScore = (): number => {
    const { lcp, fid, cls, fcp, ttfb } = metrics;
    
    if (!lcp || !fid || !cls || !fcp || !ttfb) return 0;
    
    let score = 0;
    let count = 0;
    
    // LCP score (25% weight)
    if (lcp <= PERFORMANCE_THRESHOLDS.lcp.good) score += 25;
    else if (lcp <= PERFORMANCE_THRESHOLDS.lcp.needsImprovement) score += 15;
    count++;
    
    // FID score (25% weight)
    if (fid <= PERFORMANCE_THRESHOLDS.fid.good) score += 25;
    else if (fid <= PERFORMANCE_THRESHOLDS.fid.needsImprovement) score += 15;
    count++;
    
    // CLS score (25% weight)
    if (cls <= PERFORMANCE_THRESHOLDS.cls.good) score += 25;
    else if (cls <= PERFORMANCE_THRESHOLDS.cls.needsImprovement) score += 15;
    count++;
    
    // FCP score (15% weight)
    if (fcp <= PERFORMANCE_THRESHOLDS.fcp.good) score += 15;
    else if (fcp <= PERFORMANCE_THRESHOLDS.fcp.needsImprovement) score += 10;
    count++;
    
    // TTFB score (10% weight)
    if (ttfb <= PERFORMANCE_THRESHOLDS.ttfb.good) score += 10;
    else if (ttfb <= PERFORMANCE_THRESHOLDS.ttfb.needsImprovement) score += 5;
    count++;
    
    return Math.round(score);
  };
  
  return {
    metrics,
    isMonitoring,
    performanceScore: getPerformanceScore(),
    reportMetric
  };
};

// Performance monitoring component
export const PerformanceMonitor: React.FC<{
  showInDevelopment?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}> = ({ 
  showInDevelopment = true, 
  position = 'bottom-right' 
}) => {
  const { metrics, performanceScore, isMonitoring } = usePerformanceMonitoring();
  const [isVisible, setIsVisible] = useState(false);
  
  // Only show in development by default
  const shouldShow = process.env.NODE_ENV === 'development' && showInDevelopment;
  
  if (!shouldShow || !isMonitoring) return null;
  
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  };
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  const formatValue = (value: number | null, unit = 'ms') => {
    if (value === null) return 'N/A';
    return `${Math.round(value)}${unit}`;
  };
  
  return (
    <div className={`fixed ${positionClasses[position]} z-50`}>
      <div className="bg-white shadow-lg rounded-lg p-2 border border-gray-200 max-w-xs">
        <button
          onClick={() => setIsVisible(!isVisible)}
          className="w-full text-left text-sm font-medium text-gray-700 hover:text-gray-900"
        >
          Performance: <span className={getScoreColor(performanceScore)}>{performanceScore}/100</span>
        </button>
        
        {isVisible && (
          <div className="mt-2 text-xs text-gray-600 space-y-1">
            <div>LCP: {formatValue(metrics.lcp)}</div>
            <div>FID: {formatValue(metrics.fid)}</div>
            <div>CLS: {formatValue(metrics.cls, '')}</div>
            <div>FCP: {formatValue(metrics.fcp)}</div>
            <div>TTFB: {formatValue(metrics.ttfb)}</div>
            <div>Memory: {formatValue(metrics.memoryUsed ? metrics.memoryUsed / 1024 / 1024 : null, 'MB')}</div>
            <div>Resources: {metrics.totalResourcesLoaded}</div>
            {metrics.effectiveType && (
              <div>Network: {metrics.effectiveType}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Export for use in App.tsx
export default PerformanceMonitor;