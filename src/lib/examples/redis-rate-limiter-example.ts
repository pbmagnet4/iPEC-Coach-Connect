/**
 * Redis Rate Limiter Example
 * 
 * Example implementation showing how to set up the enhanced rate limiter
 * with Redis for production use.
 */

import Redis from 'ioredis';
import { EnhancedRateLimiter } from '../rate-limiter-enhanced';
import { createRedisRateLimitStore } from '../redis-rate-limit-store';
import { RateLimiterFactory } from '../rate-limiter-config';
import { logSecurity } from '../secure-logger';

// Example: Setting up Redis rate limiter for production
export async function setupProductionRateLimiter() {
  try {
    // Create Redis client with production settings
    const redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      
      // Connection settings
      connectTimeout: 10000,
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      
      // Cluster support (if using Redis Cluster)
      enableOfflineQueue: false,
      
      // Health check
      keepAlive: 30000,
      
      // Error handling
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    });

    // Wait for connection
    await redis.connect();
    
    // Create rate limiter with Redis store
    const rateLimiter = await RateLimiterFactory.createRateLimiter({
      storageType: 'redis',
      redisConfig: {
        client: redis,
        keyPrefix: 'ipec:rate_limit:',
        testConnection: true
      },
      enableMetrics: true,
      metricsInterval: 300000 // 5 minutes
    });

    // Add initial verified users from environment
    const verifiedUsers = process.env.INITIAL_VERIFIED_USERS?.split(',') || [];
    verifiedUsers.forEach(userId => {
      rateLimiter.addVerifiedUser(userId.trim());
    });

    // Add admin overrides from environment
    const adminOverrides = process.env.INITIAL_ADMIN_OVERRIDES?.split(',') || [];
    adminOverrides.forEach(userId => {
      rateLimiter.addAdminOverride(userId.trim());
    });

    logSecurity('Production rate limiter initialized', 'low', {
      storageType: 'redis',
      verifiedUsers: verifiedUsers.length,
      adminOverrides: adminOverrides.length
    });

    return rateLimiter;
  } catch (error) {
    logSecurity('Failed to initialize production rate limiter', 'critical', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

// Example: Advanced Redis configuration with clustering
export async function setupClusteredRateLimiter() {
  try {
    // Redis Cluster configuration
    const redis = new Redis.Cluster([
      {
        host: process.env.REDIS_NODE1_HOST || 'localhost',
        port: parseInt(process.env.REDIS_NODE1_PORT || '7000')
      },
      {
        host: process.env.REDIS_NODE2_HOST || 'localhost',
        port: parseInt(process.env.REDIS_NODE2_PORT || '7001')
      },
      {
        host: process.env.REDIS_NODE3_HOST || 'localhost',
        port: parseInt(process.env.REDIS_NODE3_PORT || '7002')
      }
    ], {
      redisOptions: {
        password: process.env.REDIS_PASSWORD,
        connectTimeout: 10000,
        lazyConnect: true
      },
      enableOfflineQueue: false,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      scaleReads: 'slave'
    });

    // Create store with clustering
    const store = await createRedisRateLimitStore(redis, {
      keyPrefix: 'ipec:cluster:rate_limit:',
      testConnection: true
    });

    const rateLimiter = new EnhancedRateLimiter(store);

    logSecurity('Clustered rate limiter initialized', 'low', {
      storageType: 'redis-cluster',
      nodes: 3
    });

    return rateLimiter;
  } catch (error) {
    logSecurity('Failed to initialize clustered rate limiter', 'critical', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

// Example: Rate limiter with health monitoring
export async function setupMonitoredRateLimiter() {
  const rateLimiter = await setupProductionRateLimiter();

  // Set up health monitoring
  const healthCheckInterval = setInterval(async () => {
    try {
      const metrics = await rateLimiter.getMetrics();
      
      // Check for concerning metrics
      const concerningMetrics = {
        highBlockedRecords: metrics.blockedRecords > 100,
        highLockedAccounts: metrics.lockedAccounts > 50,
        highTotalRecords: metrics.totalRecords > 10000
      };

      if (Object.values(concerningMetrics).some(Boolean)) {
        logSecurity('Rate limiter health concern detected', 'medium', {
          metrics,
          concerns: concerningMetrics
        });
      }

      // Log regular health status
      logSecurity('Rate limiter health check', 'low', {
        timestamp: new Date().toISOString(),
        ...metrics
      });

    } catch (error) {
      logSecurity('Rate limiter health check failed', 'medium', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }, 5 * 60 * 1000); // Every 5 minutes

  // Cleanup on process exit
  process.on('SIGINT', () => {
    clearInterval(healthCheckInterval);
    process.exit(0);
  });

  return rateLimiter;
}

// Example: Complete authentication flow with rate limiting
export async function authenticateWithRateLimiting(
  rateLimiter: EnhancedRateLimiter,
  email: string,
  password: string,
  request: {
    ip?: string;
    userAgent?: string;
    userId?: string;
  }
) {
  try {
    // Check rate limit before authentication
    const rateLimitResult = await rateLimiter.isAllowed('auth.signin', {
      clientIdentifier: email,
      ipAddress: request.ip,
      userId: request.userId,
      userAgent: request.userAgent
    });

    if (!rateLimitResult.allowed) {
      // Record failed attempt for rate limiting
      await rateLimiter.recordAttempt('auth.signin', false, {
        clientIdentifier: email,
        ipAddress: request.ip,
        userId: request.userId,
        userAgent: request.userAgent
      });

      const error = rateLimitResult.accountLocked
        ? 'Account locked due to excessive failed attempts. Please contact support.'
        : `Too many signin attempts. Please try again in ${Math.ceil((rateLimitResult.blockExpires! - Date.now()) / 1000 / 60)} minutes.`;

      return {
        success: false,
        error,
        rateLimited: true,
        accountLocked: rateLimitResult.accountLocked
      };
    }

    // Apply progressive delay if needed
    if (rateLimitResult.delay) {
      await new Promise(resolve => setTimeout(resolve, rateLimitResult.delay));
    }

    // Perform actual authentication (mock)
    const authResult = await performAuthentication(email, password);

    // Record the attempt
    await rateLimiter.recordAttempt('auth.signin', authResult.success, {
      clientIdentifier: email,
      ipAddress: request.ip,
      userId: authResult.userId,
      userAgent: request.userAgent
    });

    if (authResult.success) {
      // Add to verified users if email is confirmed
      if (authResult.emailConfirmed) {
        rateLimiter.addVerifiedUser(authResult.userId);
      }

      return {
        success: true,
        userId: authResult.userId,
        rateLimited: false
      };
    } else {
      return {
        success: false,
        error: 'Invalid credentials',
        rateLimited: false
      };
    }

  } catch (error) {
    logSecurity('Authentication with rate limiting failed', 'high', {
      email,
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: request.ip
    });

    return {
      success: false,
      error: 'Authentication failed',
      rateLimited: false
    };
  }
}

// Mock authentication function
async function performAuthentication(email: string, password: string) {
  // Mock authentication logic
  const isValid = email === 'user@example.com' && password === 'correct-password';
  
  return {
    success: isValid,
    userId: isValid ? 'user123' : null,
    emailConfirmed: isValid ? true : false
  };
}

// Example: Bulk operations with rate limiting
export async function bulkOperationWithRateLimiting(
  rateLimiter: EnhancedRateLimiter,
  operations: Array<{
    email: string;
    operation: 'signin' | 'signup' | 'password_reset';
    ip?: string;
  }>
) {
  const results = [];

  for (const op of operations) {
    const rateLimitResult = await rateLimiter.isAllowed(`auth.${op.operation}`, {
      clientIdentifier: op.email,
      ipAddress: op.ip
    });

    if (!rateLimitResult.allowed) {
      results.push({
        email: op.email,
        operation: op.operation,
        blocked: true,
        reason: rateLimitResult.accountLocked ? 'account_locked' : 'rate_limited'
      });
    } else {
      results.push({
        email: op.email,
        operation: op.operation,
        blocked: false,
        delay: rateLimitResult.delay || 0
      });
    }
  }

  return results;
}

// Example: Admin dashboard functions
export async function getAdminRateLimitDashboard(rateLimiter: EnhancedRateLimiter) {
  try {
    const metrics = await rateLimiter.getMetrics();
    
    return {
      overview: {
        totalRecords: metrics.totalRecords,
        blockedRecords: metrics.blockedRecords,
        lockedAccounts: metrics.lockedAccounts,
        verifiedUsers: metrics.verifiedUsers,
        adminOverrides: metrics.adminOverrides
      },
      performance: {
        averageDelays: metrics.averageDelays
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logSecurity('Failed to get admin rate limit dashboard', 'medium', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

// Example: Emergency unlock function for admins
export async function emergencyUnlockAccount(
  rateLimiter: EnhancedRateLimiter,
  userId: string,
  adminId: string
) {
  try {
    // Verify admin permissions (this would check against your permission system)
    const isAdmin = await verifyAdminPermissions(adminId);
    if (!isAdmin) {
      throw new Error('Unauthorized: Admin access required');
    }

    // Unlock the account
    await rateLimiter.unlockAccount(userId);

    logSecurity('Emergency account unlock performed', 'high', {
      unlockedUserId: userId,
      adminId,
      timestamp: new Date().toISOString()
    });

    return {
      success: true,
      message: 'Account unlocked successfully'
    };
  } catch (error) {
    logSecurity('Emergency account unlock failed', 'high', {
      userId,
      adminId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

// Mock admin verification function
async function verifyAdminPermissions(adminId: string): Promise<boolean> {
  // Mock admin verification logic
  return adminId === 'admin123';
}

// Export for use in other modules
export default {
  setupProductionRateLimiter,
  setupClusteredRateLimiter,
  setupMonitoredRateLimiter,
  authenticateWithRateLimiting,
  bulkOperationWithRateLimiting,
  getAdminRateLimitDashboard,
  emergencyUnlockAccount
};