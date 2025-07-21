/**
 * Rate Limiter Configuration for iPEC Coach Connect
 * 
 * Environment-based configuration and setup utilities for the rate limiter.
 */

import { EnhancedRateLimiter, RateLimitStore } from './rate-limiter-enhanced';
import { RedisRateLimitStore, createRedisRateLimitStore, RedisClient } from './redis-rate-limit-store';
import { logSecurity } from './secure-logger';

// Configuration interface for rate limiter setup
export interface RateLimiterSetupConfig {
  storageType: 'memory' | 'redis';
  redisConfig?: {
    client: RedisClient;
    keyPrefix?: string;
    testConnection?: boolean;
  };
  initialVerifiedUsers?: string[];
  initialAdminOverrides?: string[];
  enableMetrics?: boolean;
  metricsInterval?: number;
}

// Environment configuration parser
export class RateLimiterConfig {
  /**
   * Parse configuration from environment variables
   */
  static getConfigFromEnv(): RateLimiterSetupConfig {
    const storageType = (import.meta.env.VITE_RATE_LIMIT_STORAGE_TYPE || 'memory') as 'memory' | 'redis';
    
    return {
      storageType,
      enableMetrics: import.meta.env.VITE_RATE_LIMIT_ENABLE_METRICS === 'true',
      metricsInterval: parseInt(import.meta.env.VITE_RATE_LIMIT_METRICS_INTERVAL || '300000', 10), // 5 minutes
    };
  }
  
  /**
   * Validate environment configuration
   */
  static validateConfig(config: RateLimiterSetupConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Validate storage type
    if (!['memory', 'redis'].includes(config.storageType)) {
      errors.push('Invalid storage type. Must be "memory" or "redis"');
    }
    
    // Validate Redis configuration if using Redis
    if (config.storageType === 'redis' && !config.redisConfig?.client) {
      errors.push('Redis client is required when using Redis storage');
    }
    
    // Validate metrics interval
    if (config.enableMetrics && config.metricsInterval && config.metricsInterval < 60000) {
      errors.push('Metrics interval must be at least 60 seconds');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Get default rate limit configurations
   */
  static getDefaultRateLimitConfigs() {
    return {
      'auth.signin': {
        maxAttempts: parseInt(import.meta.env.VITE_RATE_LIMIT_LOGIN_MAX_ATTEMPTS || '5', 10),
        windowMs: parseInt(import.meta.env.VITE_RATE_LIMIT_LOGIN_WINDOW_MS || '900000', 10),
        blockDurationMs: parseInt(import.meta.env.VITE_RATE_LIMIT_LOGIN_BLOCK_DURATION_MS || '1800000', 10),
        skipSuccessfulAttempts: true,
        progressiveDelay: {
          enabled: import.meta.env.VITE_RATE_LIMIT_PROGRESSIVE_DELAY_ENABLED === 'true',
          baseDelayMs: parseInt(import.meta.env.VITE_RATE_LIMIT_PROGRESSIVE_DELAY_BASE_MS || '1000', 10),
          maxDelayMs: parseInt(import.meta.env.VITE_RATE_LIMIT_PROGRESSIVE_DELAY_MAX_MS || '10000', 10),
          multiplier: 2
        }
      },
      'auth.signup': {
        maxAttempts: parseInt(import.meta.env.VITE_RATE_LIMIT_SIGNUP_MAX_ATTEMPTS || '3', 10),
        windowMs: parseInt(import.meta.env.VITE_RATE_LIMIT_SIGNUP_WINDOW_MS || '3600000', 10),
        blockDurationMs: parseInt(import.meta.env.VITE_RATE_LIMIT_SIGNUP_BLOCK_DURATION_MS || '3600000', 10),
        skipSuccessfulAttempts: true,
        progressiveDelay: {
          enabled: import.meta.env.VITE_RATE_LIMIT_PROGRESSIVE_DELAY_ENABLED === 'true',
          baseDelayMs: parseInt(import.meta.env.VITE_RATE_LIMIT_PROGRESSIVE_DELAY_BASE_MS || '1000', 10) * 2,
          maxDelayMs: parseInt(import.meta.env.VITE_RATE_LIMIT_PROGRESSIVE_DELAY_MAX_MS || '10000', 10),
          multiplier: 1.5
        }
      },
      'auth.password_reset': {
        maxAttempts: parseInt(import.meta.env.VITE_RATE_LIMIT_PASSWORD_RESET_MAX_ATTEMPTS || '3', 10),
        windowMs: parseInt(import.meta.env.VITE_RATE_LIMIT_PASSWORD_RESET_WINDOW_MS || '3600000', 10),
        blockDurationMs: parseInt(import.meta.env.VITE_RATE_LIMIT_PASSWORD_RESET_BLOCK_DURATION_MS || '3600000', 10),
        skipSuccessfulAttempts: false,
        progressiveDelay: {
          enabled: import.meta.env.VITE_RATE_LIMIT_PROGRESSIVE_DELAY_ENABLED === 'true',
          baseDelayMs: parseInt(import.meta.env.VITE_RATE_LIMIT_PROGRESSIVE_DELAY_BASE_MS || '1000', 10) * 3,
          maxDelayMs: parseInt(import.meta.env.VITE_RATE_LIMIT_PROGRESSIVE_DELAY_MAX_MS || '10000', 10),
          multiplier: 1.5
        }
      },
      'auth.oauth': {
        maxAttempts: 10,
        windowMs: 10 * 60 * 1000, // 10 minutes
        blockDurationMs: 20 * 60 * 1000, // 20 minutes
        skipSuccessfulAttempts: true
      }
    };
  }
}

// Rate limiter factory
export class RateLimiterFactory {
  /**
   * Create rate limiter with automatic configuration
   */
  static async createRateLimiter(config?: RateLimiterSetupConfig): Promise<EnhancedRateLimiter> {
    const finalConfig = config || RateLimiterConfig.getConfigFromEnv();
    
    // Validate configuration
    const validation = RateLimiterConfig.validateConfig(finalConfig);
    if (!validation.valid) {
      throw new Error(`Invalid rate limiter configuration: ${validation.errors.join(', ')}`);
    }
    
    // Create storage
    const store = await this.createStore(finalConfig);
    
    // Create rate limiter
    const rateLimiter = new EnhancedRateLimiter(store);
    
    // Setup initial configurations
    const defaultConfigs = RateLimiterConfig.getDefaultRateLimitConfigs();
    Object.entries(defaultConfigs).forEach(([operationType, config]) => {
      rateLimiter.setConfig(operationType, config);
    });
    
    // Add initial verified users and admin overrides
    if (finalConfig.initialVerifiedUsers) {
      finalConfig.initialVerifiedUsers.forEach(userId => {
        rateLimiter.addVerifiedUser(userId);
      });
    }
    
    if (finalConfig.initialAdminOverrides) {
      finalConfig.initialAdminOverrides.forEach(userId => {
        rateLimiter.addAdminOverride(userId);
      });
    }
    
    // Setup metrics collection if enabled
    if (finalConfig.enableMetrics) {
      this.setupMetricsCollection(rateLimiter, finalConfig.metricsInterval || 300000);
    }
    
    logSecurity('Rate limiter created successfully', 'low', {
      storageType: finalConfig.storageType,
      metricsEnabled: finalConfig.enableMetrics,
      verifiedUsers: finalConfig.initialVerifiedUsers?.length || 0,
      adminOverrides: finalConfig.initialAdminOverrides?.length || 0
    });
    
    return rateLimiter;
  }
  
  /**
   * Create storage based on configuration
   */
  private static async createStore(config: RateLimiterSetupConfig): Promise<RateLimitStore> {
    switch (config.storageType) {
      case 'redis':
        if (!config.redisConfig?.client) {
          throw new Error('Redis client is required for Redis storage');
        }
        
        return await createRedisRateLimitStore(config.redisConfig.client, {
          keyPrefix: config.redisConfig.keyPrefix || 'rate_limit:',
          testConnection: config.redisConfig.testConnection !== false
        });
      
      case 'memory':
      default:
        // Import and create in-memory store
        const { InMemoryRateLimitStore } = await import('./rate-limiter-enhanced');
        return new (InMemoryRateLimitStore as any)();
    }
  }
  
  /**
   * Setup metrics collection
   */
  private static setupMetricsCollection(rateLimiter: EnhancedRateLimiter, interval: number): void {
    setInterval(async () => {
      try {
        const metrics = await rateLimiter.getMetrics();
        
        logSecurity('Rate limiter metrics', 'low', {
          timestamp: new Date().toISOString(),
          ...metrics
        });
        
        // In a real production environment, you might want to send these metrics
        // to a monitoring service like Prometheus, DataDog, etc.
        // Example: await sendToMonitoringService(metrics);
        
      } catch (error) {
        logSecurity('Failed to collect rate limiter metrics', 'medium', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }, interval);
  }
}

// Configuration presets for different environments
export const RATE_LIMITER_PRESETS = {
  development: {
    storageType: 'memory' as const,
    enableMetrics: true,
    metricsInterval: 60000 // 1 minute for development
  },
  
  staging: {
    storageType: 'redis' as const,
    enableMetrics: true,
    metricsInterval: 300000 // 5 minutes
  },
  
  production: {
    storageType: 'redis' as const,
    enableMetrics: true,
    metricsInterval: 300000 // 5 minutes
  }
};

// Helper function to get preset by environment
export function getPresetByEnvironment(env: string = 'development'): RateLimiterSetupConfig {
  return RATE_LIMITER_PRESETS[env as keyof typeof RATE_LIMITER_PRESETS] || RATE_LIMITER_PRESETS.development;
}

// Export utility functions
export const rateLimiterUtils = {
  createRateLimiter: RateLimiterFactory.createRateLimiter,
  getConfigFromEnv: RateLimiterConfig.getConfigFromEnv,
  validateConfig: RateLimiterConfig.validateConfig,
  getPresetByEnvironment
};

export default RateLimiterFactory;