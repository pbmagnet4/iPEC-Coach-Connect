/**
 * Redis Rate Limit Store for iPEC Coach Connect
 * 
 * Redis implementation of RateLimitStore for distributed rate limiting
 * in production environments.
 */

import { RateLimitStore, AttemptRecord, AccountLockoutRecord } from './rate-limiter-enhanced';
import { logSecurity } from './secure-logger';

// Redis client interface (compatible with ioredis, redis, etc.)
export interface RedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ex?: number): Promise<'OK'>;
  setex(key: string, seconds: number, value: string): Promise<'OK'>;
  del(key: string): Promise<number>;
  keys(pattern: string): Promise<string[]>;
  flushdb(): Promise<'OK'>;
  ping(): Promise<'PONG'>;
}

export class RedisRateLimitStore implements RateLimitStore {
  private redis: RedisClient;
  private keyPrefix: string;
  
  constructor(redisClient: RedisClient, keyPrefix: string = 'rate_limit:') {
    this.redis = redisClient;
    this.keyPrefix = keyPrefix;
  }
  
  private getKey(key: string): string {
    return `${this.keyPrefix}${key}`;
  }
  
  private getAccountLockoutKey(userId: string): string {
    return `${this.keyPrefix}lockout:${userId}`;
  }
  
  private serializeRecord(record: AttemptRecord): string {
    return JSON.stringify({
      ...record,
      ipAddresses: Array.from(record.ipAddresses)
    });
  }
  
  private deserializeRecord(data: string): AttemptRecord {
    const parsed = JSON.parse(data);
    return {
      ...parsed,
      ipAddresses: new Set(parsed.ipAddresses)
    };
  }
  
  private serializeAccountLockout(record: AccountLockoutRecord): string {
    return JSON.stringify({
      ...record,
      ipAddresses: Array.from(record.ipAddresses)
    });
  }
  
  private deserializeAccountLockout(data: string): AccountLockoutRecord {
    const parsed = JSON.parse(data);
    return {
      ...parsed,
      ipAddresses: new Set(parsed.ipAddresses)
    };
  }
  
  async get(key: string): Promise<AttemptRecord | null> {
    try {
      const data = await this.redis.get(this.getKey(key));
      if (!data) return null;
      
      return this.deserializeRecord(data);
    } catch (error) {
      logSecurity('Redis get failed', 'medium', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }
  
  async set(key: string, value: AttemptRecord, ttlMs?: number): Promise<void> {
    try {
      const serialized = this.serializeRecord(value);
      const redisKey = this.getKey(key);
      
      if (ttlMs && ttlMs > 0) {
        const ttlSeconds = Math.ceil(ttlMs / 1000);
        await this.redis.setex(redisKey, ttlSeconds, serialized);
      } else {
        await this.redis.set(redisKey, serialized);
      }
    } catch (error) {
      logSecurity('Redis set failed', 'medium', {
        key,
        ttlMs,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }
  
  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(this.getKey(key));
    } catch (error) {
      logSecurity('Redis delete failed', 'medium', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }
  
  async clear(): Promise<void> {
    try {
      const keys = await this.redis.keys(`${this.keyPrefix}*`);
      if (keys.length > 0) {
        await Promise.all(keys.map(key => this.redis.del(key)));
      }
    } catch (error) {
      logSecurity('Redis clear failed', 'medium', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }
  
  async getAccountLockout(userId: string): Promise<AccountLockoutRecord | null> {
    try {
      const data = await this.redis.get(this.getAccountLockoutKey(userId));
      if (!data) return null;
      
      const record = this.deserializeAccountLockout(data);
      
      // Check if lockout has expired
      if (Date.now() > record.lockExpires) {
        await this.deleteAccountLockout(userId);
        return null;
      }
      
      return record;
    } catch (error) {
      logSecurity('Redis getAccountLockout failed', 'medium', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }
  
  async setAccountLockout(userId: string, record: AccountLockoutRecord): Promise<void> {
    try {
      const serialized = this.serializeAccountLockout(record);
      const ttlSeconds = Math.ceil((record.lockExpires - Date.now()) / 1000);
      
      if (ttlSeconds > 0) {
        await this.redis.setex(this.getAccountLockoutKey(userId), ttlSeconds, serialized);
      }
    } catch (error) {
      logSecurity('Redis setAccountLockout failed', 'medium', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }
  
  async deleteAccountLockout(userId: string): Promise<void> {
    try {
      await this.redis.del(this.getAccountLockoutKey(userId));
    } catch (error) {
      logSecurity('Redis deleteAccountLockout failed', 'medium', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }
  
  async getAllKeys(pattern?: string): Promise<string[]> {
    try {
      const searchPattern = pattern 
        ? `${this.keyPrefix}${pattern}`
        : `${this.keyPrefix}*`;
      
      const keys = await this.redis.keys(searchPattern);
      
      // Remove prefix from keys
      return keys.map(key => key.replace(this.keyPrefix, ''));
    } catch (error) {
      logSecurity('Redis getAllKeys failed', 'medium', {
        pattern,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return [];
    }
  }
  
  /**
   * Health check for Redis connection
   */
  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.redis.ping();
      return result === 'PONG';
    } catch (error) {
      logSecurity('Redis health check failed', 'medium', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }
  
  /**
   * Get Redis connection statistics
   */
  async getStats(): Promise<{
    totalKeys: number;
    rateLimitKeys: number;
    lockoutKeys: number;
    healthy: boolean;
  }> {
    try {
      const healthy = await this.healthCheck();
      const allKeys = await this.redis.keys(`${this.keyPrefix}*`);
      const lockoutKeys = await this.redis.keys(`${this.keyPrefix}lockout:*`);
      
      return {
        totalKeys: allKeys.length,
        rateLimitKeys: allKeys.length - lockoutKeys.length,
        lockoutKeys: lockoutKeys.length,
        healthy
      };
    } catch (error) {
      logSecurity('Redis getStats failed', 'medium', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return {
        totalKeys: 0,
        rateLimitKeys: 0,
        lockoutKeys: 0,
        healthy: false
      };
    }
  }
}

/**
 * Factory function to create Redis rate limit store
 */
export function createRedisRateLimitStore(
  redisClient: RedisClient,
  options?: {
    keyPrefix?: string;
    testConnection?: boolean;
  }
): Promise<RedisRateLimitStore> {
  return new Promise(async (resolve, reject) => {
    try {
      const store = new RedisRateLimitStore(
        redisClient,
        options?.keyPrefix || 'rate_limit:'
      );
      
      // Test connection if requested
      if (options?.testConnection !== false) {
        const healthy = await store.healthCheck();
        if (!healthy) {
          throw new Error('Redis connection health check failed');
        }
      }
      
      logSecurity('Redis rate limit store initialized', 'low', {
        keyPrefix: options?.keyPrefix || 'rate_limit:',
        testConnection: options?.testConnection !== false
      });
      
      resolve(store);
    } catch (error) {
      logSecurity('Redis rate limit store initialization failed', 'high', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      reject(error);
    }
  });
}

// Export types for external use
export type { RedisClient };
export default RedisRateLimitStore;