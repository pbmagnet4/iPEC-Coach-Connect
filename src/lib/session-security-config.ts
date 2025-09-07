/**
 * Session Security Configuration for iPEC Coach Connect
 * 
 * Centralized configuration for session security features including:
 * - Session timeout and refresh settings
 * - Security headers and CSP configuration
 * - Fingerprinting and validation settings
 * - Rate limiting and monitoring configuration
 * - Environment-specific security policies
 */

import type { SessionSecurityConfig } from './session-security';
import type { SessionMiddlewareConfig } from './session-security-middleware';

// Environment detection
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

// Security levels
export type SecurityLevel = 'minimal' | 'standard' | 'enhanced' | 'enterprise';

// Session security configuration by environment
export const SESSION_SECURITY_CONFIG: Record<string, SessionSecurityConfig> = {
  development: {
    sessionTimeout: 480, // 8 hours for development
    refreshThreshold: 60, // 1 hour
    maxConcurrentSessions: 10,
    fingerprintingEnabled: true,
    encryptionEnabled: true,
    securityHeaders: false, // Disabled to avoid dev issues
    activityMonitoring: true,
    cleanupInterval: 120, // 2 hours
  },
  
  test: {
    sessionTimeout: 60, // 1 hour for testing
    refreshThreshold: 15, // 15 minutes
    maxConcurrentSessions: 3,
    fingerprintingEnabled: false, // Disabled for test stability
    encryptionEnabled: true,
    securityHeaders: false,
    activityMonitoring: false,
    cleanupInterval: 30, // 30 minutes
  },
  
  production: {
    sessionTimeout: 120, // 2 hours
    refreshThreshold: 30, // 30 minutes
    maxConcurrentSessions: 5,
    fingerprintingEnabled: true,
    encryptionEnabled: true,
    securityHeaders: true,
    activityMonitoring: true,
    cleanupInterval: 60, // 1 hour
  },
  
  enterprise: {
    sessionTimeout: 60, // 1 hour
    refreshThreshold: 15, // 15 minutes
    maxConcurrentSessions: 3,
    fingerprintingEnabled: true,
    encryptionEnabled: true,
    securityHeaders: true,
    activityMonitoring: true,
    cleanupInterval: 30, // 30 minutes
  }
};

// Middleware configuration by environment
export const SESSION_MIDDLEWARE_CONFIG: Record<string, SessionMiddlewareConfig> = {
  development: {
    autoRefresh: true,
    securityViolationAction: 'warn',
    sessionTimeoutWarning: 30, // 30 minutes
    activityTracking: true,
    rateLimitBypass: true,
  },
  
  test: {
    autoRefresh: false, // Manual control in tests
    securityViolationAction: 'warn',
    sessionTimeoutWarning: 5, // 5 minutes
    activityTracking: false,
    rateLimitBypass: true,
  },
  
  production: {
    autoRefresh: true,
    securityViolationAction: 'block',
    sessionTimeoutWarning: 10, // 10 minutes
    activityTracking: true,
    rateLimitBypass: false,
  },
  
  enterprise: {
    autoRefresh: true,
    securityViolationAction: 'logout',
    sessionTimeoutWarning: 5, // 5 minutes
    activityTracking: true,
    rateLimitBypass: false,
  }
};

// Content Security Policy configuration
export const CSP_CONFIG = {
  development: {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'",
      "'unsafe-eval'",
      'https://accounts.google.com',
      'https://www.gstatic.com',
      'http://localhost:*'
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'",
      'https://fonts.googleapis.com'
    ],
    'font-src': [
      "'self'",
      'https://fonts.gstatic.com'
    ],
    'img-src': [
      "'self'",
      'data:',
      'https:',
      'blob:',
      'http://localhost:*'
    ],
    'connect-src': [
      "'self'",
      'https://*.supabase.co',
      'https://accounts.google.com',
      'ws://localhost:*',
      'http://localhost:*'
    ],
    'frame-src': [
      'https://accounts.google.com'
    ],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'upgrade-insecure-requests': null
  },
  
  production: {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'", // Required for some React features
      'https://accounts.google.com',
      'https://www.gstatic.com'
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'",
      'https://fonts.googleapis.com'
    ],
    'font-src': [
      "'self'",
      'https://fonts.gstatic.com'
    ],
    'img-src': [
      "'self'",
      'data:',
      'https:',
      'blob:'
    ],
    'connect-src': [
      "'self'",
      'https://*.supabase.co',
      'https://accounts.google.com'
    ],
    'frame-src': [
      'https://accounts.google.com'
    ],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'upgrade-insecure-requests': []
  },
  
  enterprise: {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      'https://accounts.google.com',
      'https://www.gstatic.com'
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'",
      'https://fonts.googleapis.com'
    ],
    'font-src': [
      "'self'",
      'https://fonts.gstatic.com'
    ],
    'img-src': [
      "'self'",
      'data:',
      'https:',
      'blob:'
    ],
    'connect-src': [
      "'self'",
      'https://*.supabase.co',
      'https://accounts.google.com'
    ],
    'frame-src': [
      'https://accounts.google.com'
    ],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'upgrade-insecure-requests': [],
    'require-trusted-types-for': ["'script'"]
  }
};

// Security headers configuration
export const SECURITY_HEADERS = {
  development: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  },
  
  production: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Expect-CT': 'max-age=86400, enforce',
  },
  
  enterprise: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'no-referrer',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=(), usb=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'Expect-CT': 'max-age=86400, enforce',
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
  }
};

// Session validation rules
export const SESSION_VALIDATION_RULES = {
  fingerprint: {
    userAgent: { weight: 30, critical: true },
    screenResolution: { weight: 25, critical: true },
    timezone: { weight: 20, critical: false },
    language: { weight: 15, critical: false },
    platform: { weight: 25, critical: true },
    webgl: { weight: 20, critical: false },
    canvas: { weight: 15, critical: false },
  },
  
  riskThresholds: {
    low: 0,
    medium: 25,
    high: 50,
    critical: 70,
  },
  
  actions: {
    low: 'allow',
    medium: 'warn',
    high: 'challenge',
    critical: 'invalidate',
  }
};

// Rate limiting configuration for session operations
export const SESSION_RATE_LIMITS = {
  development: {
    sessionCreate: { maxAttempts: 50, windowMs: 60000 },
    sessionValidate: { maxAttempts: 200, windowMs: 60000 },
    sessionRefresh: { maxAttempts: 100, windowMs: 60000 },
    fingerprintGeneration: { maxAttempts: 20, windowMs: 60000 },
  },
  
  production: {
    sessionCreate: { maxAttempts: 10, windowMs: 60000 },
    sessionValidate: { maxAttempts: 100, windowMs: 60000 },
    sessionRefresh: { maxAttempts: 20, windowMs: 60000 },
    fingerprintGeneration: { maxAttempts: 5, windowMs: 60000 },
  },
  
  enterprise: {
    sessionCreate: { maxAttempts: 5, windowMs: 60000 },
    sessionValidate: { maxAttempts: 50, windowMs: 60000 },
    sessionRefresh: { maxAttempts: 10, windowMs: 60000 },
    fingerprintGeneration: { maxAttempts: 3, windowMs: 60000 },
  }
};

// Configuration getters
export function getSessionSecurityConfig(environment?: string): SessionSecurityConfig {
  const env = environment || process.env.NODE_ENV || 'development';
  return SESSION_SECURITY_CONFIG[env] || SESSION_SECURITY_CONFIG.development;
}

export function getSessionMiddlewareConfig(environment?: string): SessionMiddlewareConfig {
  const env = environment || process.env.NODE_ENV || 'development';
  return SESSION_MIDDLEWARE_CONFIG[env] || SESSION_MIDDLEWARE_CONFIG.development;
}

export function getCSPConfig(environment?: string): Record<string, string[] | null> {
  const env = environment || process.env.NODE_ENV || 'development';
  return CSP_CONFIG[env as keyof typeof CSP_CONFIG] || CSP_CONFIG.development;
}

export function getSecurityHeaders(environment?: string): Record<string, string> {
  const env = environment || process.env.NODE_ENV || 'development';
  return SECURITY_HEADERS[env as keyof typeof SECURITY_HEADERS] || SECURITY_HEADERS.development;
}

export function getSessionRateLimits(environment?: string): Record<string, any> {
  const env = environment || process.env.NODE_ENV || 'development';
  return SESSION_RATE_LIMITS[env as keyof typeof SESSION_RATE_LIMITS] || SESSION_RATE_LIMITS.development;
}

// CSP string builder
export function buildCSPString(environment?: string): string {
  const cspConfig = getCSPConfig(environment);
  const directives = Object.entries(cspConfig)
    .filter(([_, value]) => value !== null)
    .map(([directive, sources]) => {
      if (Array.isArray(sources) && sources.length > 0) {
        return `${directive} ${sources.join(' ')}`;
      } else if (sources === null) {
        return directive;
      }
      return '';
    })
    .filter(Boolean);
  
  return directives.join('; ');
}

// Security level detector
export function detectSecurityLevel(): SecurityLevel {
  const {hostname} = window.location;
  const {protocol} = window.location;
  
  // Enterprise detection
  if (hostname.includes('enterprise') || hostname.includes('corp')) {
    return 'enterprise';
  }
  
  // Production detection
  if (protocol === 'https:' && !hostname.includes('localhost') && !hostname.includes('127.0.0.1')) {
    return 'enhanced';
  }
  
  // Development detection
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1') || isDevelopment) {
    return 'minimal';
  }
  
  return 'standard';
}

// Configuration validator
export function validateSessionConfig(config: SessionSecurityConfig): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Validate session timeout
  if (config.sessionTimeout < 15) {
  void errors.push('Session timeout must be at least 15 minutes');
  }
  if (config.sessionTimeout > 1440) {
  void warnings.push('Session timeout longer than 24 hours may impact security');
  }
  
  // Validate refresh threshold
  if (config.refreshThreshold >= config.sessionTimeout) {
  void errors.push('Refresh threshold must be less than session timeout');
  }
  
  // Validate concurrent sessions
  if (config.maxConcurrentSessions < 1) {
  void errors.push('Max concurrent sessions must be at least 1');
  }
  if (config.maxConcurrentSessions > 10) {
  void warnings.push('High concurrent session limit may impact security');
  }
  
  // Validate cleanup interval
  if (config.cleanupInterval < 15) {
  void warnings.push('Cleanup interval less than 15 minutes may impact performance');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// Export current environment configuration
export const currentSessionConfig = getSessionSecurityConfig();
export const currentMiddlewareConfig = getSessionMiddlewareConfig();
export const currentCSPConfig = getCSPConfig();
export const currentSecurityHeaders = getSecurityHeaders();
export const currentRateLimits = getSessionRateLimits();
export const currentSecurityLevel = detectSecurityLevel();

// Export CSP string for current environment
export const currentCSPString = buildCSPString();

// Validation result for current config
export const configValidation = validateSessionConfig(currentSessionConfig);

// Log configuration on import (development only)
if (isDevelopment) {
  console.log('Session Security Configuration Loaded:', {
    environment: process.env.NODE_ENV,
    securityLevel: currentSecurityLevel,
    sessionTimeout: currentSessionConfig.sessionTimeout,
    maxConcurrentSessions: currentSessionConfig.maxConcurrentSessions,
    fingerprintingEnabled: currentSessionConfig.fingerprintingEnabled,
    encryptionEnabled: currentSessionConfig.encryptionEnabled,
    configValidation
  });
}