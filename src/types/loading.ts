// Comprehensive loading state types for the iPEC Coach Connect platform

export type LoadingState = 
  | 'idle'
  | 'loading'
  | 'success'
  | 'error'
  | 'timeout'
  | 'offline';

export type LoadingPriority = 'low' | 'normal' | 'high' | 'critical';

export type LoadingStrategy = 
  | 'immediate'
  | 'progressive'
  | 'lazy'
  | 'ondemand'
  | 'background';

export type NetworkQuality = 'slow' | 'good' | 'fast' | 'unknown';

export interface LoadingOptions {
  priority: LoadingPriority;
  strategy: LoadingStrategy;
  timeout?: number;
  retryCount?: number;
  showSkeleton?: boolean;
  showProgress?: boolean;
  networkAware?: boolean;
  cacheKey?: string;
}

export interface LoadingContext {
  state: LoadingState;
  progress?: number;
  error?: Error | null;
  startTime?: number;
  duration?: number;
  retryCount: number;
  networkQuality: NetworkQuality;
}

export interface SkeletonVariant {
  type: 'text' | 'image' | 'card' | 'list' | 'form' | 'button' | 'avatar' | 'custom';
  count?: number;
  height?: string | number;
  width?: string | number;
  className?: string;
  animated?: boolean;
  pulse?: boolean;
}

export interface ProgressiveLoadingConfig {
  itemsPerBatch: number;
  batchDelay: number;
  useIntersectionObserver: boolean;
  rootMargin?: string;
  threshold?: number;
}

export interface ImageLoadingConfig {
  blurDataURL?: string;
  placeholder?: 'blur' | 'empty' | 'skeleton';
  quality?: number;
  sizes?: string;
  priority?: boolean;
  fadeInDuration?: number;
}

export interface LoadingAnalytics {
  loadingId: string;
  type: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  success: boolean;
  errorMessage?: string;
  networkQuality: NetworkQuality;
  cacheHit?: boolean;
  retryCount: number;
}

export interface GlobalLoadingState {
  activeLoaders: Map<string, LoadingContext>;
  networkQuality: NetworkQuality;
  isOnline: boolean;
  globalPriority: LoadingPriority;
  analytics: LoadingAnalytics[];
}

// Hook return types
export interface UseLoadingReturn<T = any> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  progress: number;
  networkQuality: NetworkQuality;
  retry: () => void;
  cancel: () => void;
  refresh: () => void;
}

export interface UseSkeletonReturn {
  showSkeleton: boolean;
  skeletonProps: SkeletonVariant;
  transition: 'entering' | 'entered' | 'exiting' | 'exited';
}

export interface UseProgressiveLoadingReturn<T = any> {
  items: T[];
  loading: boolean;
  hasMore: boolean;
  loadMore: () => void;
  reset: () => void;
  containerRef: React.RefObject<HTMLElement>;
}

export interface UseImageLoadingReturn {
  src: string;
  loading: boolean;
  error: boolean;
  loaded: boolean;
  progress: number;
  imageRef: React.RefObject<HTMLImageElement>;
}

// Component prop types
export interface LoadingProviderProps {
  children: React.ReactNode;
  defaultNetworkQuality?: NetworkQuality;
  enableAnalytics?: boolean;
  maxConcurrentLoaders?: number;
}

export interface SkeletonComponentProps extends SkeletonVariant {
  loading: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  delay?: number;
  minDisplayTime?: number;
}

export interface ProgressBarProps {
  progress: number;
  variant?: 'linear' | 'circular' | 'step';
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  showPercentage?: boolean;
  animated?: boolean;
  className?: string;
}

export interface LoadingOverlayProps {
  show: boolean;
  type?: 'page' | 'section' | 'inline';
  message?: string;
  progress?: number;
  onCancel?: () => void;
  backdrop?: boolean;
  zIndex?: number;
  className?: string;
}