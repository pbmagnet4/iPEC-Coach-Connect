import type { ComponentType, ReactElement } from 'react';
import React, { lazy, Suspense } from 'react';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { ErrorBoundary } from './ErrorBoundary';

// Enhanced lazy loading wrapper with intelligent loading strategies
interface LazyLoadingWrapperProps {
  children: ReactElement;
  fallback?: ReactElement;
  errorFallback?: ReactElement;
  preload?: boolean;
  priority?: 'high' | 'medium' | 'low';
  loadingStrategy?: 'eager' | 'lazy' | 'hover' | 'viewport';
  minLoadingTime?: number; // Minimum loading time to prevent flash
}

// Higher-order component for lazy loading with advanced features
export const withLazyLoading = <P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  options: {
    fallback?: ReactElement;
    errorFallback?: ReactElement;
    preload?: boolean;
    priority?: 'high' | 'medium' | 'low';
    loadingStrategy?: 'eager' | 'lazy' | 'hover' | 'viewport';
    minLoadingTime?: number;
  } = {}
) => {
  const LazyComponent = lazy(importFn);
  
  return (props: P) => {
    const [isLoading, setIsLoading] = React.useState(true);
    const [startTime] = React.useState(Date.now());
    const minLoadingTime = options.minLoadingTime || 300; // 300ms minimum
    
    React.useEffect(() => {
      const timer = setTimeout(() => {
        const elapsed = Date.now() - startTime;
        if (elapsed >= minLoadingTime) {
          setIsLoading(false);
        } else {
          setTimeout(() => setIsLoading(false), minLoadingTime - elapsed);
        }
      }, 0);
      
      return () => clearTimeout(timer);
    }, [startTime, minLoadingTime]);
    
    const fallback = options.fallback || <LoadingSpinner />;
    const errorFallback = options.errorFallback || (
      <div className="p-4 text-center text-red-600">
        Failed to load component. Please try again.
      </div>
    );
    
    return (
      <ErrorBoundary fallback={errorFallback}>
        <Suspense fallback={isLoading ? fallback : null}>
          <LazyComponent {...props} />
        </Suspense>
      </ErrorBoundary>
    );
  };
};

// Smart preloading based on user interactions
export const useSmartPreloading = () => {
  const [preloadedComponents, setPreloadedComponents] = React.useState<Set<string>>(new Set());
  
  const preloadComponent = React.useCallback((
    componentName: string,
    importFn: () => Promise<any>
  ) => {
    if (preloadedComponents.has(componentName)) {
      return;
    }
    
    // Check network conditions
    const {connection} = (navigator as any);
    if (connection?.saveData) {
      return; // Skip preloading on data saver mode
    }
    
    importFn().then(() => {
      setPreloadedComponents(prev => new Set(prev).add(componentName));
    }).catch(error => {
  void console.warn(`Failed to preload ${componentName}:`, error);
    });
  }, [preloadedComponents]);
  
  const preloadOnHover = React.useCallback((
    componentName: string,
    importFn: () => Promise<any>
  ) => {
    return {
      onMouseEnter: () => preloadComponent(componentName, importFn),
      onTouchStart: () => preloadComponent(componentName, importFn),
    };
  }, [preloadComponent]);
  
  const preloadOnViewport = React.useCallback((
    componentName: string,
    importFn: () => Promise<any>
  ) => {
    React.useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            preloadComponent(componentName, importFn);
  void observer.disconnect();
          }
        },
        { rootMargin: '100px' }
      );
      
      const trigger = document.getElementById(`preload-trigger-${componentName}`);
      if (trigger) {
  void observer.observe(trigger);
      }
      
      return () => observer.disconnect();
    }, [componentName, importFn]);
  }, [preloadComponent]);
  
  return {
    preloadComponent,
    preloadOnHover,
    preloadOnViewport,
    preloadedComponents
  };
};

// Context for managing loading states globally
interface LoadingContextType {
  loadingStates: Record<string, boolean>;
  setLoadingState: (key: string, loading: boolean) => void;
  globalLoading: boolean;
}

const LoadingContext = React.createContext<LoadingContextType>({
  loadingStates: {},
  setLoadingState: () => {},
  globalLoading: false
});

export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loadingStates, setLoadingStates] = React.useState<Record<string, boolean>>({});
  
  const setLoadingState = React.useCallback((key: string, loading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: loading
    }));
  }, []);
  
  const globalLoading = React.useMemo(() => {
    return Object.values(loadingStates).some(loading => loading);
  }, [loadingStates]);
  
  return (
    <LoadingContext.Provider value={{ loadingStates, setLoadingState, globalLoading }}>
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const context = React.useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

// Lazy loading wrapper component
export const LazyLoadingWrapper: React.FC<LazyLoadingWrapperProps> = ({
  children,
  fallback = <LoadingSpinner />,
  errorFallback = <div className="p-4 text-center text-red-600">Failed to load component</div>,
  preload = false,
  priority = 'medium',
  loadingStrategy = 'lazy',
  minLoadingTime = 300
}) => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [startTime] = React.useState(Date.now());
  const { setLoadingState } = useLoading();
  
  React.useEffect(() => {
    const componentKey = `lazy-${Date.now()}`;
    setLoadingState(componentKey, true);
    
    const timer = setTimeout(() => {
      const elapsed = Date.now() - startTime;
      if (elapsed >= minLoadingTime) {
        setIsLoading(false);
        setLoadingState(componentKey, false);
      } else {
        setTimeout(() => {
          setIsLoading(false);
          setLoadingState(componentKey, false);
        }, minLoadingTime - elapsed);
      }
    }, 0);
    
    return () => {
      clearTimeout(timer);
      setLoadingState(componentKey, false);
    };
  }, [startTime, minLoadingTime, setLoadingState]);
  
  if (isLoading) {
    return fallback;
  }
  
  return (
    <ErrorBoundary fallback={errorFallback}>
      <Suspense fallback={fallback}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
};

// Pre-built lazy components for heavy libraries
export const LazyFramerMotion = withLazyLoading(
  () => import('framer-motion').then(module => ({ default: module.motion.div })),
  {
    priority: 'low',
    loadingStrategy: 'hover',
    minLoadingTime: 200
  }
);

export const LazyEmblaCarousel = withLazyLoading(
  () => import('embla-carousel-react').then(module => ({ default: module.default })),
  {
    priority: 'medium',
    loadingStrategy: 'viewport',
    minLoadingTime: 300
  }
);

// Chart components with fallback (react-chartjs-2 not installed)
export const LazyChart = withLazyLoading(
  () => {
    // Return fallback component since react-chartjs-2 is not installed
    return Promise.resolve({
      default: ({ data, options, ...props }: any) => (
        <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 border-2 border-dashed border-gray-300">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Chart Unavailable</h3>
            <p className="mt-1 text-sm text-gray-500">Install react-chartjs-2 to enable charts</p>
          </div>
        </div>
      )
    });
  },
  {
    priority: 'low',
    loadingStrategy: 'viewport',
    minLoadingTime: 500
  }
);

// Rich text editor with fallback (@tiptap/react not installed)
export const LazyRichTextEditor = withLazyLoading(
  () => {
    // Return fallback component since @tiptap/react is not installed
    return Promise.resolve({
      default: ({ content, onChange, ...props }: any) => (
        <div className="w-full min-h-32 p-3 border border-gray-300 rounded-md bg-gray-50 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            <p className="mt-1 text-sm text-gray-500">Rich Text Editor Unavailable</p>
            <p className="text-xs text-gray-400">Install @tiptap/react to enable rich text editing</p>
          </div>
        </div>
      )
    });
  },
  {
    priority: 'medium',
    loadingStrategy: 'hover',
    minLoadingTime: 400
  }
);

export default LazyLoadingWrapper;