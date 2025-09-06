import { useCallback, useEffect, useRef, useState } from 'react';
import type { 
  LoadingAnalytics, 
  LoadingOptions, 
  LoadingState, 
  NetworkQuality,
  UseLoadingReturn 
} from '../types/loading';
import { 
  LoadingContext 
} from '../types/loading';

// Network quality detection
const detectNetworkQuality = (): NetworkQuality => {
  if (typeof navigator === 'undefined') return 'unknown';
  
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  
  if (!connection) return 'unknown';
  
  const {effectiveType} = connection;
  const {downlink} = connection;
  
  if (effectiveType === '4g' && downlink > 10) return 'fast';
  if (effectiveType === '4g' || (effectiveType === '3g' && downlink > 1.5)) return 'good';
  return 'slow';
};

// Enhanced loading state hook with network awareness
export function useLoadingState<T = any>(
  loadingFunction: () => Promise<T>,
  options: Partial<LoadingOptions> = {}
): UseLoadingReturn<T> {
  const defaultOptions: LoadingOptions = {
    priority: 'normal',
    strategy: 'immediate',
    timeout: 30000,
    retryCount: 3,
    showSkeleton: true,
    showProgress: false,
    networkAware: true,
    ...options
  };

  const [state, setState] = useState<LoadingState>('idle');
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [networkQuality, setNetworkQuality] = useState<NetworkQuality>('unknown');
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const startTimeRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Network quality monitoring
  useEffect(() => {
    if (!defaultOptions.networkAware) return;

    const updateNetworkQuality = () => {
      setNetworkQuality(detectNetworkQuality());
    };

    updateNetworkQuality();
    
    const {connection} = (navigator as any);
    if (connection) {
      connection.addEventListener('change', updateNetworkQuality);
      return () => connection.removeEventListener('change', updateNetworkQuality);
    }
  }, [defaultOptions.networkAware]);

  // Adjust timeout based on network quality
  const getAdjustedTimeout = useCallback(() => {
    if (!defaultOptions.networkAware) return defaultOptions.timeout!;
    
    const baseTimeout = defaultOptions.timeout!;
    switch (networkQuality) {
      case 'slow': return baseTimeout * 2;
      case 'good': return baseTimeout;
      case 'fast': return baseTimeout * 0.7;
      default: return baseTimeout;
    }
  }, [networkQuality, defaultOptions.timeout, defaultOptions.networkAware]);

  // Execute loading with retry logic
  const executeLoading = useCallback(async (isRetry = false) => {
    if (!isRetry) {
      setRetryCount(0);
    }

    setState('loading');
    setError(null);
    setProgress(0);
    startTimeRef.current = Date.now();

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();

    // Set timeout
    const adjustedTimeout = getAdjustedTimeout();
    timeoutRef.current = setTimeout(() => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        setState('timeout');
        setError(new Error('Request timed out'));
      }
    }, adjustedTimeout);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + Math.random() * 20, 90));
      }, 200);

      const result = await loadingFunction();
      
      clearInterval(progressInterval);
      setProgress(100);
      setData(result);
      setState('success');

      // Track analytics
      const analytics: LoadingAnalytics = {
        loadingId: `loading-${Date.now()}`,
        type: 'data-fetch',
        startTime: startTimeRef.current,
        endTime: Date.now(),
        duration: Date.now() - startTimeRef.current,
        success: true,
        networkQuality,
        retryCount
      };

      // Emit analytics event
      window.dispatchEvent(new CustomEvent('loadingAnalytics', { detail: analytics }));

    } catch (err) {
      const error = err as Error;
      
      // Handle different error types
      if (error.name === 'AbortError') {
        setState('timeout');
      } else if (!navigator.onLine) {
        setState('offline');
      } else {
        setState('error');
      }

      setError(error);
      setProgress(0);

      // Track failed analytics
      const analytics: LoadingAnalytics = {
        loadingId: `loading-${Date.now()}`,
        type: 'data-fetch',
        startTime: startTimeRef.current,
        endTime: Date.now(),
        duration: Date.now() - startTimeRef.current,
        success: false,
        errorMessage: error.message,
        networkQuality,
        retryCount
      };

      window.dispatchEvent(new CustomEvent('loadingAnalytics', { detail: analytics }));
    } finally {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    }
  }, [loadingFunction, getAdjustedTimeout, networkQuality, retryCount]);

  // Retry function
  const retry = useCallback(() => {
    if (retryCount < defaultOptions.retryCount!) {
      setRetryCount(prev => prev + 1);
      
      // Exponential backoff for retries
      const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
      
      setTimeout(() => {
        executeLoading(true);
      }, delay);
    }
  }, [retryCount, defaultOptions.retryCount, executeLoading]);

  // Cancel function
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setState('idle');
    setProgress(0);
  }, []);

  // Refresh function
  const refresh = useCallback(() => {
    setRetryCount(0);
    executeLoading(false);
  }, [executeLoading]);

  // Auto-execute based on strategy
  useEffect(() => {
    if (defaultOptions.strategy === 'immediate') {
      executeLoading();
    }
  }, [defaultOptions.strategy]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  return {
    data,
    loading: state === 'loading',
    error,
    progress,
    networkQuality,
    retry,
    cancel,
    refresh
  };
}

// Hook for skeleton loading states
export function useSkeletonLoading(loading: boolean, options: { delay?: number; minDisplayTime?: number } = {}) {
  const { delay = 200, minDisplayTime = 500 } = options;
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [transition, setTransition] = useState<'entering' | 'entered' | 'exiting' | 'exited'>('exited');
  
  const delayTimeoutRef = useRef<NodeJS.Timeout>();
  const minTimeoutRef = useRef<NodeJS.Timeout>();
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (loading) {
      // Add delay before showing skeleton
      delayTimeoutRef.current = setTimeout(() => {
        setShowSkeleton(true);
        setTransition('entering');
        startTimeRef.current = Date.now();
        
        // Transition to entered state
        setTimeout(() => setTransition('entered'), 150);
      }, delay);
    } else {
      // Clear delay timeout if loading finished quickly
      if (delayTimeoutRef.current) {
        clearTimeout(delayTimeoutRef.current);
      }

      // Ensure minimum display time if skeleton was shown
      if (showSkeleton) {
        const elapsedTime = Date.now() - startTimeRef.current;
        const remainingTime = Math.max(0, minDisplayTime - elapsedTime);
        
        minTimeoutRef.current = setTimeout(() => {
          setTransition('exiting');
          setTimeout(() => {
            setShowSkeleton(false);
            setTransition('exited');
          }, 150);
        }, remainingTime);
      }
    }

    return () => {
      if (delayTimeoutRef.current) clearTimeout(delayTimeoutRef.current);
      if (minTimeoutRef.current) clearTimeout(minTimeoutRef.current);
    };
  }, [loading, delay, minDisplayTime, showSkeleton]);

  return { showSkeleton, transition };
}

// Hook for progressive loading with intersection observer
export function useProgressiveLoading<T>(
  loadFunction: (page: number, limit: number) => Promise<T[]>,
  options: {
    itemsPerPage?: number;
    threshold?: number;
    rootMargin?: string;
    enabled?: boolean;
  } = {}
) {
  const {
    itemsPerPage = 20,
    threshold = 0.1,
    rootMargin = '50px',
    enabled = true
  } = options;

  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const observerRef = useRef<IntersectionObserver>();
  const containerRef = useRef<HTMLElement>(null);
  const sentinelRef = useRef<HTMLElement>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore || !enabled) return;

    setLoading(true);
    setError(null);

    try {
      const newItems = await loadFunction(page, itemsPerPage);
      
      if (newItems.length === 0) {
        setHasMore(false);
      } else {
        setItems(prev => [...prev, ...newItems]);
        setPage(prev => prev + 1);
        
        if (newItems.length < itemsPerPage) {
          setHasMore(false);
        }
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [page, itemsPerPage, loading, hasMore, enabled, loadFunction]);

  // Set up intersection observer
  useEffect(() => {
    if (!enabled || !sentinelRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      {
        threshold,
        rootMargin,
        root: containerRef.current
      }
    );

    observerRef.current.observe(sentinelRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loading, loadMore, threshold, rootMargin, enabled]);

  // Initial load
  useEffect(() => {
    if (enabled && items.length === 0 && !loading) {
      loadMore();
    }
  }, [enabled]);

  const reset = useCallback(() => {
    setItems([]);
    setPage(0);
    setHasMore(true);
    setError(null);
  }, []);

  // Create sentinel element for intersection observer
  const createSentinel = useCallback(() => {
    if (!sentinelRef.current) {
      const sentinel = document.createElement('div');
      sentinel.style.height = '1px';
      sentinel.style.visibility = 'hidden';
      sentinelRef.current = sentinel;
    }
    return sentinelRef.current;
  }, []);

  return {
    items,
    loading,
    hasMore,
    error,
    loadMore,
    reset,
    containerRef,
    createSentinel
  };
}