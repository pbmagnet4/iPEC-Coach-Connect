/**
 * Common TypeScript type definitions to eliminate unsafe any usage
 * 
 * This file provides comprehensive type definitions that can be imported
 * throughout the codebase to replace unsafe `any` types with proper
 * TypeScript interfaces.
 */

// Error handling types
export interface SafeError {
  message: string;
  code?: string | number;
  details?: Record<string, unknown>;
  stack?: string;
}

// API Response types
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: SafeError;
  success: boolean;
  message?: string;
}

// Cache-related types
export interface CacheStats {
  hitRate: number;
  hits: number;
  misses: number;
  size: number;
  memoryUsage: number;
  compressionRatio?: number;
}

export interface CacheState<T> {
  data: T | null;
  loading: boolean;
  error: SafeError | null;
  lastUpdated: string | null;
  isFromCache: boolean;
  cacheStats: CacheStats;
}

export interface CacheActions {
  refresh: () => Promise<void>;
  invalidate: () => void;
  clear?: () => void;
}

// Performance monitoring types
export interface PerformanceMetrics {
  overall: {
    hitRate: number;
    memoryUsage: number;
    avgResponseTime: number;
  };
  enhanced: Record<string, CacheStats & { compressionRatio: number }>;
}

// Debug information types
export interface DebugInfo {
  config: Record<string, unknown>;
  serviceWorkerStats: Record<string, unknown> | null;
  performanceReport: {
    overall: {
      hitRate: number;
      memoryUsage: number;
    };
    recommendations: string[];
  } | null;
  cacheDebugInfo: Record<string, unknown>;
}

// Browser/DOM types for performance monitoring
export interface PerformanceEntry {
  name: string;
  duration: number;
  startTime: number;
  entryType: string;
}

export interface MemoryInfo {
  used: number;
  total: number;
  jsHeapSizeLimit: number;
}

export interface NavigationTiming {
  domContentLoadedEventEnd: number;
  domContentLoadedEventStart: number;
  loadEventEnd: number;
  loadEventStart: number;
  responseEnd: number;
  responseStart: number;
}

// Event handler types
export type SafeEventHandler<T = Event> = (event: T) => void;
export type SafeAsyncEventHandler<T = Event> = (event: T) => Promise<void>;

// Form-related types
export interface FormState<T = Record<string, unknown>> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isValid: boolean;
}

export interface FormActions<T = Record<string, unknown>> {
  setFieldValue: (field: keyof T, value: T[keyof T]) => void;
  setFieldError: (field: keyof T, error: string) => void;
  setFieldTouched: (field: keyof T, touched?: boolean) => void;
  resetForm: () => void;
  handleSubmit: () => (event: Event) => Promise<void>;
  getFieldProps: (field: keyof T) => {
    value: T[keyof T];
    onChange: SafeEventHandler;
    onBlur: SafeEventHandler;
    'aria-invalid': boolean;
  };
}

// Storage types
export interface StorageItem<T = unknown> {
  value: T;
  expiry?: number;
  metadata?: Record<string, unknown>;
}

// HTTP request types
export interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: string | FormData | Record<string, unknown>;
  timeout?: number;
  retries?: number;
}

export interface SafeResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  ok: boolean;
}

// Generic utility types
export type SafeRecord<K extends string | number | symbol = string, V = unknown> = Record<K, V>;
export type SafeArray<T = unknown> = T[];
export type SafeFunction<TArgs extends unknown[] = unknown[], TReturn = unknown> = (...args: TArgs) => TReturn;
export type SafeAsyncFunction<TArgs extends unknown[] = unknown[], TReturn = unknown> = (...args: TArgs) => Promise<TReturn>;

// Component prop types
export interface BaseComponentProps {
  className?: string;
  id?: string;
  'data-testid'?: string;
  children?: React.ReactNode;
}

// Hook return types
export type HookReturn<T, A = Record<string, SafeFunction>> = [T, A];

// Type guards
export const _isError = (value: unknown): value is Error => {
  return value instanceof Error;
};

export const _isSafeError = (value: unknown): value is SafeError => {
  return typeof value === 'object' && value !== null && 'message' in value;
};

export const _isRecord = (value: unknown): value is SafeRecord => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

export const _isArray = <T>(value: unknown): value is SafeArray<T> => {
  return Array.isArray(value);
};

export const _isFunction = (value: unknown): value is SafeFunction => {
  return typeof value === 'function';
};

export const _isAsyncFunction = (value: unknown): value is SafeAsyncFunction => {
  return typeof value === 'function';
};

// Utility functions for safe operations
export const _safeStringify = (value: unknown): string => {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

export const _safeParse = <T = unknown>(value: string): T | null => {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

export const _safeNumber = (value: unknown): number => {
  const _num = Number(value);
  return isNaN(num) ? 0 : num;
};

export const _safeString = (value: unknown): string => {
  return String(value ?? '');
};

export const _safeArray = <T>(value: unknown): T[] => {
  return isArray<T>(value) ? value : [];
};

export const _safeRecord = (value: unknown): SafeRecord => {
  return isRecord(value) ? value : {};
};