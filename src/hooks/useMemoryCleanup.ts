/**
 * React Memory Management Hooks
 * 
 * Provides automatic cleanup hooks for React components that integrate
 * with the memory management system to prevent memory leaks.
 */

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { memoryManager } from '../lib/memory-manager';

/**
 * Hook for automatic cleanup of event listeners
 */
export function useEventListener<T extends EventTarget>(
  target: T | null,
  event: string,
  handler: (event: Event) => void,
  options?: AddEventListenerOptions
): void {
  const savedHandler = useRef<(event: Event) => void>();
  const componentRef = useRef<any>();

  // Update ref.current value if handler changes
  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!target) return;

    const eventListener = (event: Event) => savedHandler.current?.(event);
    
    // Register with memory manager
    const cleanupId = memoryManager.registerEventListener(
      `event_${event}`,
      target,
      event,
      eventListener,
      options,
      componentRef.current
    );

    return () => {
      memoryManager.cleanup(cleanupId);
    };
  }, [target, event, options]);
}

/**
 * Hook for automatic cleanup of intervals
 */
export function useInterval(
  callback: () => void,
  delay: number | null,
  immediate = false
): void {
  const savedCallback = useRef<() => void>();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const componentRef = useRef<any>();

  // Update ref.current value if callback changes
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;

    const tick = () => savedCallback.current?.();

    if (immediate) {
      tick();
    }

    intervalRef.current = setInterval(tick, delay);

    // Register with memory manager
    const cleanupId = memoryManager.registerInterval(
      'interval',
      intervalRef.current,
      componentRef.current
    );

    return () => {
      memoryManager.cleanup(cleanupId);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [delay, immediate]);
}

/**
 * Hook for automatic cleanup of timeouts
 */
export function useTimeout(
  callback: () => void,
  delay: number | null
): void {
  const savedCallback = useRef<() => void>();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update ref.current value if callback changes
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;

    timeoutRef.current = setTimeout(() => savedCallback.current?.(), delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [delay]);
}

/**
 * Hook for automatic cleanup of observers (ResizeObserver, IntersectionObserver, etc.)
 */
export function useObserver<T extends { disconnect: () => void }>(
  createObserver: () => T,
  deps: any[] = []
): T | null {
  const observerRef = useRef<T | null>(null);
  const componentRef = useRef<any>();

  useEffect(() => {
    const observer = createObserver();
    observerRef.current = observer;

    // Register with memory manager
    const cleanupId = memoryManager.registerObserver(
      'observer',
      observer,
      () => observer.disconnect(),
      componentRef.current
    );

    return () => {
      memoryManager.cleanup(cleanupId);
      observer.disconnect();
      observerRef.current = null;
    };
  }, deps);

  return observerRef.current;
}

/**
 * Hook for automatic cleanup of resize observer
 */
export function useResizeObserver(
  callback: (entries: ResizeObserverEntry[]) => void,
  element: Element | null
): void {
  const savedCallback = useRef<(entries: ResizeObserverEntry[]) => void>();
  const componentRef = useRef<any>();

  // Update ref.current value if callback changes
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!element || !ResizeObserver) return;

    const observer = new ResizeObserver((entries) => {
      savedCallback.current?.(entries);
    });

    observer.observe(element);

    // Register with memory manager
    const cleanupId = memoryManager.registerObserver(
      'resize_observer',
      observer,
      () => observer.disconnect(),
      componentRef.current
    );

    return () => {
      memoryManager.cleanup(cleanupId);
      observer.disconnect();
    };
  }, [element]);
}

/**
 * Hook for automatic cleanup of intersection observer
 */
export function useIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  element: Element | null,
  options?: IntersectionObserverInit
): void {
  const savedCallback = useRef<(entries: IntersectionObserverEntry[]) => void>();
  const componentRef = useRef<any>();

  // Update ref.current value if callback changes
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!element || !IntersectionObserver) return;

    const observer = new IntersectionObserver((entries) => {
      savedCallback.current?.(entries);
    }, options);

    observer.observe(element);

    // Register with memory manager
    const cleanupId = memoryManager.registerObserver(
      'intersection_observer',
      observer,
      () => observer.disconnect(),
      componentRef.current
    );

    return () => {
      memoryManager.cleanup(cleanupId);
      observer.disconnect();
    };
  }, [element, options]);
}

/**
 * Hook for automatic cleanup of mutation observer
 */
export function useMutationObserver(
  callback: (mutations: MutationRecord[]) => void,
  element: Element | null,
  options?: MutationObserverInit
): void {
  const savedCallback = useRef<(mutations: MutationRecord[]) => void>();
  const componentRef = useRef<any>();

  // Update ref.current value if callback changes
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!element || !MutationObserver) return;

    const observer = new MutationObserver((mutations) => {
      savedCallback.current?.(mutations);
    });

    observer.observe(element, options);

    // Register with memory manager
    const cleanupId = memoryManager.registerObserver(
      'mutation_observer',
      observer,
      () => observer.disconnect(),
      componentRef.current
    );

    return () => {
      memoryManager.cleanup(cleanupId);
      observer.disconnect();
    };
  }, [element, options]);
}

/**
 * Hook for automatic cleanup of subscriptions
 */
export function useSubscription<T>(
  subscribe: () => { unsubscribe: () => void; data?: T },
  deps: any[] = []
): T | undefined {
  const subscriptionRef = useRef<{ unsubscribe: () => void; data?: T } | null>(null);
  const componentRef = useRef<any>();

  useEffect(() => {
    const subscription = subscribe();
    subscriptionRef.current = subscription;

    // Register with memory manager
    const cleanupId = memoryManager.registerSubscription(
      'subscription',
      subscription,
      componentRef.current
    );

    return () => {
      memoryManager.cleanup(cleanupId);
      subscription.unsubscribe();
      subscriptionRef.current = null;
    };
  }, deps);

  return subscriptionRef.current?.data;
}

/**
 * Hook for automatic cleanup of auth state subscriptions
 */
export function useAuthStateSubscription(
  onStateChange: (state: any) => void
): void {
  const savedCallback = useRef<(state: any) => void>();
  const componentRef = useRef<any>();

  // Update ref.current value if callback changes
  useEffect(() => {
    savedCallback.current = onStateChange;
  }, [onStateChange]);

  useEffect(() => {
    // Import auth service dynamically to avoid circular dependencies
    import('../services/auth.service').then(({ authService }) => {
      const unsubscribe = authService.onStateChange((state) => {
        savedCallback.current?.(state);
      });

      // Register with memory manager
      const cleanupId = memoryManager.registerListener(
        'auth_state_subscription',
        unsubscribe,
        componentRef.current
      );

      return () => {
        memoryManager.cleanup(cleanupId);
        unsubscribe();
      };
    });
  }, []);
}

/**
 * Hook for automatic cleanup of Supabase subscriptions
 */
export function useSupabaseSubscription<T>(
  subscriptionFn: () => Promise<{ data: T; error: any; unsubscribe: () => void } | null>,
  deps: any[] = []
): { data: T | null; error: any | null; loading: boolean } {
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);
  const componentRef = useRef<any>();
  const [state, setState] = useState<{ data: T | null; error: any | null; loading: boolean }>({
    data: null,
    error: null,
    loading: true
  });

  useEffect(() => {
    let cancelled = false;

    const setupSubscription = async () => {
      try {
        const result = await subscriptionFn();
        
        if (cancelled || !result) {
          setState({ data: null, error: null, loading: false });
          return;
        }

        subscriptionRef.current = result;
        setState({ data: result.data, error: result.error, loading: false });

        // Register with memory manager
        const cleanupId = memoryManager.registerSubscription(
          'supabase_subscription',
          { unsubscribe: result.unsubscribe },
          componentRef.current
        );

        return () => {
          memoryManager.cleanup(cleanupId);
          result.unsubscribe();
        };
      } catch (error) {
        if (!cancelled) {
          setState({ data: null, error, loading: false });
        }
      }
    };

    setupSubscription();

    return () => {
      cancelled = true;
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, deps);

  return state;
}

/**
 * Hook for automatic cleanup of component on unmount
 */
export function useComponentCleanup(): void {
  const componentRef = useRef<any>();

  useEffect(() => {
    componentRef.current = {};

    return () => {
      // Clean up all resources associated with this component
      memoryManager.cleanupComponent(componentRef.current);
    };
  }, []);
}

/**
 * Hook for memory monitoring and debugging
 */
export function useMemoryMonitoring(enabled = process.env.NODE_ENV === 'development'): {
  memoryStats: any;
  memoryLeaks: any[];
  memoryAlerts: any[];
  isHealthy: boolean;
} {
  const [memoryInfo, setMemoryInfo] = useState({
    memoryStats: {},
    memoryLeaks: [],
    memoryAlerts: [],
    isHealthy: true
  });

  useInterval(() => {
    if (enabled) {
      setMemoryInfo({
        memoryStats: memoryManager.getMemoryStats(),
        memoryLeaks: memoryManager.getMemoryLeaks(),
        memoryAlerts: memoryManager.getMemoryAlerts(),
        isHealthy: memoryManager.isMemoryHealthy()
      });
    }
  }, 5000); // Update every 5 seconds

  return memoryInfo;
}

/**
 * Hook for async effect cleanup
 */
export function useAsyncEffect(
  effect: () => Promise<void | (() => void)>,
  deps: any[]
): void {
  const mountedRef = useRef(true);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const runEffect = async () => {
      try {
        const cleanup = await effect();
        if (mountedRef.current && typeof cleanup === 'function') {
          cleanupRef.current = cleanup;
        }
      } catch (error) {
        if (mountedRef.current) {
          console.error('Async effect error:', error);
        }
      }
    };

    runEffect();

    return () => {
      mountedRef.current = false;
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, deps);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);
}

/**
 * Hook for automatic cleanup of multiple resources
 */
export function useCleanupManager(): {
  registerCleanup: (id: string, cleanupFn: () => void) => void;
  cleanup: (id: string) => void;
  cleanupAll: () => void;
} {
  const cleanupCallbacks = useRef<Map<string, () => void>>(new Map());

  const registerCleanup = useCallback((id: string, cleanupFn: () => void) => {
    cleanupCallbacks.current.set(id, cleanupFn);
  }, []);

  const cleanup = useCallback((id: string) => {
    const cleanupFn = cleanupCallbacks.current.get(id);
    if (cleanupFn) {
      cleanupFn();
      cleanupCallbacks.current.delete(id);
    }
  }, []);

  const cleanupAll = useCallback(() => {
    cleanupCallbacks.current.forEach((cleanupFn) => {
      try {
        cleanupFn();
      } catch (error) {
        console.error('Cleanup error:', error);
      }
    });
    cleanupCallbacks.current.clear();
  }, []);

  useEffect(() => {
    return () => {
      cleanupAll();
    };
  }, [cleanupAll]);

  return { registerCleanup, cleanup, cleanupAll };
}

// Import useState for useSupabaseSubscription
import { useState } from 'react';

/**
 * Hook for debounced cleanup
 */
export function useDebouncedCleanup(
  cleanupFn: () => void,
  delay: number,
  deps: any[]
): void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(cleanupFn, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, deps);
}

/**
 * Hook for throttled cleanup
 */
export function useThrottledCleanup(
  cleanupFn: () => void,
  delay: number,
  deps: any[]
): void {
  const lastRunRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const now = Date.now();
    const timeSinceLastRun = now - lastRunRef.current;

    if (timeSinceLastRun >= delay) {
      cleanupFn();
      lastRunRef.current = now;
    } else {
      const remainingTime = delay - timeSinceLastRun;
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        cleanupFn();
        lastRunRef.current = Date.now();
      }, remainingTime);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, deps);
}

/**
 * Hook for preventing memory leaks in async operations
 */
export function useAbortableEffect(
  effect: (abortSignal: AbortSignal) => Promise<void>,
  deps: any[]
): void {
  useEffect(() => {
    const abortController = new AbortController();

    const runEffect = async () => {
      try {
        await effect(abortController.signal);
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Abortable effect error:', error);
        }
      }
    };

    runEffect();

    return () => {
      abortController.abort();
    };
  }, deps);
}

/**
 * Hook for safe state updates (prevents state updates after unmount)
 */
export function useSafeState<T>(
  initialState: T
): [T, (value: T | ((prevState: T) => T)) => void] {
  const [state, setState] = useState<T>(initialState);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const safeSetState = useCallback((value: T | ((prevState: T) => T)) => {
    if (mountedRef.current) {
      setState(value);
    }
  }, []);

  return [state, safeSetState];
}

/**
 * Hook for automatic cleanup of WebSocket connections
 */
export function useWebSocket(
  url: string,
  options: {
    onOpen?: (event: Event) => void;
    onMessage?: (event: MessageEvent) => void;
    onError?: (event: Event) => void;
    onClose?: (event: CloseEvent) => void;
    reconnectAttempts?: number;
    reconnectDelay?: number;
  } = {}
): {
  socket: WebSocket | null;
  send: (data: string | ArrayBuffer | Blob) => void;
  close: () => void;
  readyState: number;
} {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [readyState, setReadyState] = useState<number>(WebSocket.CONNECTING);
  const componentRef = useRef<any>();
  const reconnectCount = useRef<number>(0);

  const {
    onOpen,
    onMessage,
    onError,
    onClose,
    reconnectAttempts = 3,
    reconnectDelay = 1000
  } = options;

  useEffect(() => {
    const connectWebSocket = () => {
      const ws = new WebSocket(url);
      setSocket(ws);

      ws.onopen = (event) => {
        setReadyState(WebSocket.OPEN);
        reconnectCount.current = 0;
        onOpen?.(event);
      };

      ws.onmessage = (event) => {
        onMessage?.(event);
      };

      ws.onerror = (event) => {
        setReadyState(WebSocket.CLOSED);
        onError?.(event);
      };

      ws.onclose = (event) => {
        setReadyState(WebSocket.CLOSED);
        onClose?.(event);

        // Attempt to reconnect
        if (reconnectCount.current < reconnectAttempts) {
          reconnectCount.current++;
          setTimeout(connectWebSocket, reconnectDelay);
        }
      };

      // Register with memory manager
      const cleanupId = memoryManager.registerListener(
        'websocket',
        () => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.close();
          }
        },
        componentRef.current
      );

      return () => {
        memoryManager.cleanup(cleanupId);
        ws.close();
      };
    };

    const cleanup = connectWebSocket();

    return cleanup;
  }, [url, onOpen, onMessage, onError, onClose, reconnectAttempts, reconnectDelay]);

  const send = useCallback((data: string | ArrayBuffer | Blob) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(data);
    }
  }, [socket]);

  const close = useCallback(() => {
    if (socket) {
      socket.close();
    }
  }, [socket]);

  return { socket, send, close, readyState };
}

/**
 * Hook for automatic cleanup of window/document event listeners
 */
export function useWindowEventListener(
  event: string,
  handler: (event: Event) => void,
  options?: AddEventListenerOptions
): void {
  useEventListener(typeof window !== 'undefined' ? window : null, event, handler, options);
}

/**
 * Hook for automatic cleanup of document event listeners
 */
export function useDocumentEventListener(
  event: string,
  handler: (event: Event) => void,
  options?: AddEventListenerOptions
): void {
  useEventListener(typeof document !== 'undefined' ? document : null, event, handler, options);
}

/**
 * Hook for memory-efficient memoization
 */
export function useMemoryEfficientMemo<T>(
  factory: () => T,
  deps: any[],
  maxAge = 5 * 60 * 1000 // 5 minutes
): T {
  const cacheRef = useRef<{ value: T; timestamp: number; deps: any[] } | null>(null);

  return useMemo(() => {
    const now = Date.now();
    const cache = cacheRef.current;

    // Check if cache is valid
    if (cache && 
        now - cache.timestamp < maxAge &&
        cache.deps.length === deps.length &&
        cache.deps.every((dep, index) => dep === deps[index])) {
      return cache.value;
    }

    // Create new value and cache it
    const value = factory();
    cacheRef.current = {
      value,
      timestamp: now,
      deps: [...deps]
    };

    return value;
  }, deps);
}

/**
 * Hook for component performance monitoring
 */
export function usePerformanceMonitoring(
  componentName: string,
  enabled = process.env.NODE_ENV === 'development'
): void {
  const renderCountRef = useRef<number>(0);
  const mountTimeRef = useRef<number>(0);

  useEffect(() => {
    if (enabled) {
      mountTimeRef.current = performance.now();
      console.log(`[Performance] ${componentName} mounted`);
    }

    return () => {
      if (enabled) {
        const lifespan = performance.now() - mountTimeRef.current;
        console.log(`[Performance] ${componentName} unmounted after ${lifespan.toFixed(2)}ms, ${renderCountRef.current} renders`);
      }
    };
  }, [componentName, enabled]);

  useEffect(() => {
    if (enabled) {
      renderCountRef.current++;
    }
  });
}

export default {
  useEventListener,
  useInterval,
  useTimeout,
  useObserver,
  useResizeObserver,
  useIntersectionObserver,
  useMutationObserver,
  useSubscription,
  useAuthStateSubscription,
  useSupabaseSubscription,
  useComponentCleanup,
  useMemoryMonitoring,
  useAsyncEffect,
  useCleanupManager,
  useDebouncedCleanup,
  useThrottledCleanup,
  useAbortableEffect,
  useSafeState,
  useWebSocket,
  useWindowEventListener,
  useDocumentEventListener,
  useMemoryEfficientMemo,
  usePerformanceMonitoring
};