import React, { createContext, useCallback, useContext, useEffect, useReducer, useRef } from 'react';
import type { 
  GlobalLoadingState, 
  LoadingAnalytics, 
  LoadingContext, 
  LoadingPriority, 
  LoadingProviderProps,
  NetworkQuality 
} from '../../../types/loading';

// Loading React context (renamed to avoid conflict with LoadingContext interface)
const ProgressiveLoadingContext = createContext<{
  state: GlobalLoadingState;
  registerLoader: (id: string, context: LoadingContext) => void;
  unregisterLoader: (id: string) => void;
  updateLoader: (id: string, updates: Partial<LoadingContext>) => void;
  getNetworkQuality: () => NetworkQuality;
  isOnline: boolean;
  getActiveLoadersCount: () => number;
  getLoadingPriority: () => LoadingPriority;
  addAnalytics: (analytics: LoadingAnalytics) => void;
  clearAnalytics: () => void;
  getPerformanceMetrics: () => any;
} | null>(null);

// Actions for the loading reducer
type LoadingAction = 
  | { type: 'REGISTER_LOADER'; payload: { id: string; context: LoadingContext } }
  | { type: 'UNREGISTER_LOADER'; payload: { id: string } }
  | { type: 'UPDATE_LOADER'; payload: { id: string; updates: Partial<LoadingContext> } }
  | { type: 'SET_NETWORK_QUALITY'; payload: { quality: NetworkQuality } }
  | { type: 'SET_ONLINE_STATUS'; payload: { isOnline: boolean } }
  | { type: 'SET_GLOBAL_PRIORITY'; payload: { priority: LoadingPriority } }
  | { type: 'ADD_ANALYTICS'; payload: { analytics: LoadingAnalytics } }
  | { type: 'CLEAR_ANALYTICS' };

// Initial state
const initialState: GlobalLoadingState = {
  activeLoaders: new Map(),
  networkQuality: 'unknown',
  isOnline: true,
  globalPriority: 'normal',
  analytics: []
};

// Reducer
function loadingReducer(state: GlobalLoadingState, action: LoadingAction): GlobalLoadingState {
  switch (action.type) {
    case 'REGISTER_LOADER':
      const newActiveLoaders = new Map(state.activeLoaders);
  void newActiveLoaders.set(action.payload.id, action.payload.context);
      return {
        ...state,
        activeLoaders: newActiveLoaders
      };

    case 'UNREGISTER_LOADER':
      const updatedActiveLoaders = new Map(state.activeLoaders);
  void updatedActiveLoaders.delete(action.payload.id);
      return {
        ...state,
        activeLoaders: updatedActiveLoaders
      };

    case 'UPDATE_LOADER':
      const currentLoader = state.activeLoaders.get(action.payload.id);
      if (currentLoader) {
        const updatedLoader = { ...currentLoader, ...action.payload.updates };
        const newLoaders = new Map(state.activeLoaders);
  void newLoaders.set(action.payload.id, updatedLoader);
        return {
          ...state,
          activeLoaders: newLoaders
        };
      }
      return state;

    case 'SET_NETWORK_QUALITY':
      return {
        ...state,
        networkQuality: action.payload.quality
      };

    case 'SET_ONLINE_STATUS':
      return {
        ...state,
        isOnline: action.payload.isOnline
      };

    case 'SET_GLOBAL_PRIORITY':
      return {
        ...state,
        globalPriority: action.payload.priority
      };

    case 'ADD_ANALYTICS':
      return {
        ...state,
        analytics: [...state.analytics.slice(-99), action.payload.analytics] // Keep last 100
      };

    case 'CLEAR_ANALYTICS':
      return {
        ...state,
        analytics: []
      };

    default:
      return state;
  }
}

// Network quality detection
const detectNetworkQuality = (): NetworkQuality => {
  if (typeof navigator === 'undefined') return 'unknown';
  
  const connection = (navigator as any).connection || 
                    (navigator as any).mozConnection || 
                    (navigator as any).webkitConnection;
  
  if (!connection) return 'unknown';
  
  const {effectiveType} = connection;
  const {downlink} = connection;
  const {rtt} = connection;
  
  // Enhanced network quality detection
  if (effectiveType === '4g' && downlink > 10 && rtt < 100) return 'fast';
  if (effectiveType === '4g' || (effectiveType === '3g' && downlink > 1.5)) return 'good';
  if (effectiveType === '2g' || rtt > 1000) return 'slow';
  
  return 'good'; // Default fallback
};

// Performance monitoring
const createPerformanceMonitor = () => {
  const metrics = {
    totalLoaders: 0,
    successfulLoads: 0,
    failedLoads: 0,
    averageLoadTime: 0,
    networkQualityChanges: 0,
    cacheHits: 0
  };

  const updateMetrics = (analytics: LoadingAnalytics) => {
    metrics.totalLoaders++;
    
    if (analytics.success) {
      metrics.successfulLoads++;
    } else {
      metrics.failedLoads++;
    }
    
    if (analytics.duration) {
      const totalTime = metrics.averageLoadTime * (metrics.totalLoaders - 1) + analytics.duration;
      metrics.averageLoadTime = totalTime / metrics.totalLoaders;
    }
    
    if (analytics.cacheHit) {
      metrics.cacheHits++;
    }
  };

  return { metrics, updateMetrics };
};

// Main provider component
export const LoadingProvider: React.FC<LoadingProviderProps> = ({
  children,
  defaultNetworkQuality = 'unknown',
  enableAnalytics = true,
  maxConcurrentLoaders = 10
}) => {
  const [state, dispatch] = useReducer(loadingReducer, {
    ...initialState,
    networkQuality: defaultNetworkQuality
  });

  const performanceMonitor = useRef(createPerformanceMonitor());
  const networkCheckInterval = useRef<NodeJS.Timeout>();

  // Network quality monitoring
  useEffect(() => {
    const updateNetworkQuality = () => {
      const quality = detectNetworkQuality();
      if (quality !== state.networkQuality) {
        dispatch({ type: 'SET_NETWORK_QUALITY', payload: { quality } });
        performanceMonitor.current.metrics.networkQualityChanges++;
      }
    };

    // Initial detection
    updateNetworkQuality();

    // Set up periodic checking
    networkCheckInterval.current = setInterval(updateNetworkQuality, 30000); // Check every 30s

    // Listen for connection changes
    const {connection} = (navigator as any);
    if (connection) {
  void connection.addEventListener('change', updateNetworkQuality);
    }

    return () => {
      if (networkCheckInterval.current) {
        clearInterval(networkCheckInterval.current);
      }
      if (connection) {
  void connection.removeEventListener('change', updateNetworkQuality);
      }
    };
  }, [state.networkQuality]);

  // Online/offline monitoring
  useEffect(() => {
    const handleOnline = () => dispatch({ type: 'SET_ONLINE_STATUS', payload: { isOnline: true } });
    const handleOffline = () => dispatch({ type: 'SET_ONLINE_STATUS', payload: { isOnline: false } });

  void window.addEventListener('online', handleOnline);
  void window.addEventListener('offline', handleOffline);

    return () => {
  void window.removeEventListener('online', handleOnline);
  void window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Adaptive priority management
  useEffect(() => {
    const activeCount = state.activeLoaders.size;
    let newPriority: LoadingPriority = 'normal';

    if (activeCount >= maxConcurrentLoaders) {
      newPriority = 'low';
    } else if (activeCount >= maxConcurrentLoaders * 0.7) {
      newPriority = 'normal';
    } else if (state.networkQuality === 'slow') {
      newPriority = 'high';
    } else {
      newPriority = 'normal';
    }

    if (newPriority !== state.globalPriority) {
      dispatch({ type: 'SET_GLOBAL_PRIORITY', payload: { priority: newPriority } });
    }
  }, [state.activeLoaders.size, state.networkQuality, maxConcurrentLoaders, state.globalPriority]);

  // Context methods
  const registerLoader = useCallback((id: string, context: LoadingContext) => {
    dispatch({ type: 'REGISTER_LOADER', payload: { id, context } });
  }, []);

  const unregisterLoader = useCallback((id: string) => {
    dispatch({ type: 'UNREGISTER_LOADER', payload: { id } });
  }, []);

  const updateLoader = useCallback((id: string, updates: Partial<LoadingContext>) => {
    dispatch({ type: 'UPDATE_LOADER', payload: { id, updates } });
  }, []);

  const getNetworkQuality = useCallback((): NetworkQuality => {
    return state.networkQuality;
  }, [state.networkQuality]);

  const getActiveLoadersCount = useCallback((): number => {
    return state.activeLoaders.size;
  }, [state.activeLoaders.size]);

  const getLoadingPriority = useCallback((): LoadingPriority => {
    return state.globalPriority;
  }, [state.globalPriority]);

  const addAnalytics = useCallback((analytics: LoadingAnalytics) => {
    if (enableAnalytics) {
      dispatch({ type: 'ADD_ANALYTICS', payload: { analytics } });
      performanceMonitor.current.updateMetrics(analytics);
    }
  }, [enableAnalytics]);

  const clearAnalytics = useCallback(() => {
    dispatch({ type: 'CLEAR_ANALYTICS' });
  }, []);

  const getPerformanceMetrics = useCallback(() => {
    return {
      ...performanceMonitor.current.metrics,
      activeLoaders: state.activeLoaders.size,
      networkQuality: state.networkQuality,
      isOnline: state.isOnline,
      recentAnalytics: state.analytics.slice(-10)
    };
  }, [state]);

  // Listen for analytics events from hooks
  useEffect(() => {
    const handleAnalyticsEvent = (event: CustomEvent<LoadingAnalytics>) => {
      addAnalytics(event.detail);
    };

  void window.addEventListener('loadingAnalytics', handleAnalyticsEvent as EventListener);
    
    return () => {
  void window.removeEventListener('loadingAnalytics', handleAnalyticsEvent as EventListener);
    };
  }, [addAnalytics]);

  const contextValue = {
    state,
    registerLoader,
    unregisterLoader,
    updateLoader,
    getNetworkQuality,
    isOnline: state.isOnline,
    getActiveLoadersCount,
    getLoadingPriority,
    addAnalytics,
    clearAnalytics,
    getPerformanceMetrics
  };

  return (
    <ProgressiveLoadingContext.Provider value={contextValue}>
      {children}
    </ProgressiveLoadingContext.Provider>
  );
};

// Hook to use the loading context
export const useLoadingContext = () => {
  const context = useContext(ProgressiveLoadingContext);
  if (!context) {
    throw new Error('useLoadingContext must be used within a LoadingProvider');
  }
  return context;
};

// Hook for network-aware loading
export const useNetworkAwareLoading = () => {
  const { getNetworkQuality, isOnline, getLoadingPriority } = useLoadingContext();
  
  const getOptimalBatchSize = useCallback((baseSize: number): number => {
    const quality = getNetworkQuality();
    const priority = getLoadingPriority();
    
    let multiplier = 1;
    
    // Adjust based on network quality
    switch (quality) {
      case 'fast': multiplier *= 1.5; break;
      case 'good': multiplier *= 1.0; break;
      case 'slow': multiplier *= 0.5; break;
      default: multiplier *= 0.8; break;
    }
    
    // Adjust based on priority
    switch (priority) {
      case 'critical': multiplier *= 1.2; break;
      case 'high': multiplier *= 1.0; break;
      case 'normal': multiplier *= 0.8; break;
      case 'low': multiplier *= 0.6; break;
    }
    
    return Math.max(1, Math.round(baseSize * multiplier));
  }, [getNetworkQuality, getLoadingPriority]);

  const getOptimalTimeout = useCallback((baseTimeout: number): number => {
    const quality = getNetworkQuality();
    
    switch (quality) {
      case 'fast': return baseTimeout * 0.7;
      case 'good': return baseTimeout;
      case 'slow': return baseTimeout * 2;
      default: return baseTimeout * 1.5;
    }
  }, [getNetworkQuality]);

  return {
    networkQuality: getNetworkQuality(),
    isOnline,
    priority: getLoadingPriority(),
    getOptimalBatchSize,
    getOptimalTimeout
  };
};