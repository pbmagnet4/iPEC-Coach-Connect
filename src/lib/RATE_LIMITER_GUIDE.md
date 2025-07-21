# Enhanced Rate Limiter Guide

## Overview

The Enhanced Rate Limiter provides comprehensive protection against brute force attacks and abuse for authentication endpoints in the iPEC Coach Connect application. It implements a sliding window algorithm with progressive delays, account lockout, and bypass mechanisms for verified users.

## Features

### 🔒 Core Security Features
- **Sliding Window Algorithm**: Time-based rate limiting with configurable windows
- **Progressive Delays**: Exponential backoff to slow down attackers
- **Account Lockout**: Automatic account lockout after excessive failures
- **IP Address Tracking**: Multi-factor identification combining client and IP
- **Thread-Safe Operations**: Concurrent request handling

### 🚀 Advanced Features
- **Verified User Bypass**: Relaxed limits for verified users (2x normal limit)
- **Admin Override**: Complete bypass for admin users
- **Redis-Ready**: Distributed rate limiting for production environments
- **Comprehensive Logging**: Security event logging with detailed context
- **Metrics Collection**: Built-in monitoring and reporting

### ⚙️ Configuration Options
- **Environment-Based**: Full configuration via environment variables
- **Operation-Specific**: Different limits for login, signup, password reset
- **Progressive Delays**: Configurable base delay, max delay, and multiplier
- **Account Lockout**: Configurable thresholds and duration

## Quick Start

### Basic Usage

```typescript
import { 
  checkRateLimit, 
  recordAuthAttempt, 
  addVerifiedUser,
  unlockAccount 
} from '../lib/rate-limiter-enhanced';

// Check if operation is allowed
const result = await checkRateLimit('auth.signin', {
  clientIdentifier: 'user@example.com',
  ipAddress: '192.168.1.1',
  userId: 'user123',
  userAgent: 'Mozilla/5.0...'
});

if (!result.allowed) {
  if (result.accountLocked) {
    throw new Error('Account locked. Please contact support.');
  } else {
    throw new Error(`Too many attempts. Try again in ${result.blockExpires}`);
  }
}

// Apply progressive delay if needed
if (result.delay) {
  await new Promise(resolve => setTimeout(resolve, result.delay));
}

// Record the attempt after authentication
await recordAuthAttempt('auth.signin', authSuccessful, {
  clientIdentifier: 'user@example.com',
  ipAddress: '192.168.1.1',
  userId: 'user123',
  userAgent: 'Mozilla/5.0...'
});
```

### Advanced Configuration

```typescript
import { RateLimiterFactory } from '../lib/rate-limiter-config';

// Create with custom configuration
const rateLimiter = await RateLimiterFactory.createRateLimiter({
  storageType: 'redis',
  redisConfig: {
    client: redisClient,
    keyPrefix: 'myapp:rate_limit:',
    testConnection: true
  },
  initialVerifiedUsers: ['verified-user-1', 'verified-user-2'],
  initialAdminOverrides: ['admin-user-1'],
  enableMetrics: true,
  metricsInterval: 300000 // 5 minutes
});
```

## Configuration Reference

### Environment Variables

```bash
# Rate Limiting Configuration
VITE_RATE_LIMIT_LOGIN_MAX_ATTEMPTS=5
VITE_RATE_LIMIT_LOGIN_WINDOW_MS=900000  # 15 minutes
VITE_RATE_LIMIT_LOGIN_BLOCK_DURATION_MS=1800000  # 30 minutes

VITE_RATE_LIMIT_SIGNUP_MAX_ATTEMPTS=3
VITE_RATE_LIMIT_SIGNUP_WINDOW_MS=3600000  # 1 hour
VITE_RATE_LIMIT_SIGNUP_BLOCK_DURATION_MS=3600000  # 1 hour

VITE_RATE_LIMIT_PASSWORD_RESET_MAX_ATTEMPTS=3
VITE_RATE_LIMIT_PASSWORD_RESET_WINDOW_MS=3600000  # 1 hour
VITE_RATE_LIMIT_PASSWORD_RESET_BLOCK_DURATION_MS=3600000  # 1 hour

# Progressive Delay Configuration
VITE_RATE_LIMIT_PROGRESSIVE_DELAY_ENABLED=true
VITE_RATE_LIMIT_PROGRESSIVE_DELAY_BASE_MS=1000  # 1 second
VITE_RATE_LIMIT_PROGRESSIVE_DELAY_MAX_MS=10000  # 10 seconds

# Account Lockout Configuration
VITE_RATE_LIMIT_ACCOUNT_LOCKOUT_THRESHOLD=10
VITE_RATE_LIMIT_ACCOUNT_LOCKOUT_DURATION_MS=86400000  # 24 hours

# Storage Configuration
VITE_RATE_LIMIT_STORAGE_TYPE=memory  # Options: memory, redis
VITE_REDIS_URL=redis://localhost:6379
```

### Operation Types

| Operation | Default Limits | Description |
|-----------|---------------|-------------|
| `auth.signin` | 5 attempts / 15 min | Email/password login |
| `auth.signup` | 3 attempts / 1 hour | User registration |
| `auth.password_reset` | 3 attempts / 1 hour | Password reset requests |
| `auth.oauth` | 10 attempts / 10 min | OAuth authentication |

## Integration with Auth Service

The enhanced rate limiter is fully integrated with the auth service:

```typescript
// In auth.service.ts
public async signIn(data: SignInData): Promise<AuthResult<SupabaseAuthUser>> {
  try {
    // Check rate limiting with enhanced options
    const rateLimitCheck = await checkRateLimit('auth.signin', {
      clientIdentifier: data.email,
      ipAddress: this.getClientIpAddress(),
      userAgent: navigator.userAgent
    });
    
    if (!rateLimitCheck.allowed) {
      const error = new SupabaseError(
        rateLimitCheck.accountLocked
          ? 'Account locked due to excessive failed attempts. Please contact support.'
          : `Too many signin attempts. Please try again after ${new Date(rateLimitCheck.blockExpires).toLocaleTimeString()}.`,
        rateLimitCheck.accountLocked ? 'ACCOUNT_LOCKED' : 'RATE_LIMITED'
      );
      
      return { error };
    }
    
    // Apply progressive delay if needed
    if (rateLimitCheck.delay) {
      await this.applyProgressiveDelay(rateLimitCheck.delay);
    }
    
    // ... authentication logic ...
    
    // Record successful/failed attempt
    await recordAuthAttempt('auth.signin', authSuccessful, {
      clientIdentifier: data.email,
      ipAddress: this.getClientIpAddress(),
      userId: authData?.user?.id,
      userAgent: navigator.userAgent
    });
    
    return { data: authData.user };
  } catch (error) {
    // Handle errors...
  }
}
```

## Progressive Delays

The progressive delay system implements exponential backoff:

```typescript
// Delay calculation: base * (multiplier ^ (attempts - 1))
// With jitter: ±10% randomization to prevent thundering herd

// Example progression for login (base: 1000ms, multiplier: 2):
// Attempt 1: 0ms (no delay)
// Attempt 2: ~1000ms (1000 * 2^0 ± 10%)
// Attempt 3: ~2000ms (1000 * 2^1 ± 10%)
// Attempt 4: ~4000ms (1000 * 2^2 ± 10%)
// Attempt 5: ~8000ms (1000 * 2^3 ± 10%)
// Attempt 6+: ~10000ms (capped at max)
```

## Account Lockout

Account lockout provides an additional layer of protection:

- **Threshold**: After 10 failed attempts (configurable)
- **Duration**: 24 hours (configurable)
- **Scope**: Account-wide, not just per client/IP
- **Manual Unlock**: Admins can unlock accounts manually

```typescript
// Check if account is locked
const result = await checkRateLimit('auth.signin', {
  clientIdentifier: 'user@example.com',
  userId: 'user123'
});

if (result.accountLocked) {
  // Handle account lockout
  console.log(`Account locked until: ${new Date(result.accountLockExpires)}`);
}

// Admin can unlock account
await unlockAccount('user123');
```

## Verified Users and Admin Overrides

### Verified Users
- Get 2x the normal rate limit
- Automatically added after successful email-verified login
- Can be manually managed

```typescript
// Add verified user (gets 2x limits)
addVerifiedUser('user123');

// Remove verified user
removeVerifiedUser('user123');
```

### Admin Overrides
- Complete bypass of all rate limits
- Should be used sparingly and logged
- Automatically applied to Master-level coaches with 10+ years experience

```typescript
// Add admin override (bypasses all limits)
addAdminOverride('admin123');

// Remove admin override
removeAdminOverride('admin123');
```

## Redis Setup for Production

For production environments, use Redis for distributed rate limiting:

```typescript
import Redis from 'ioredis';
import { createRedisRateLimitStore } from '../lib/redis-rate-limit-store';

// Create Redis client
const redis = new Redis({
  host: 'localhost',
  port: 6379,
  password: 'your-redis-password',
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3
});

// Create Redis store
const redisStore = await createRedisRateLimitStore(redis, {
  keyPrefix: 'ipec:rate_limit:',
  testConnection: true
});

// Use with rate limiter
const rateLimiter = new EnhancedRateLimiter(redisStore);
```

## Monitoring and Metrics

### Built-in Metrics

```typescript
// Get comprehensive metrics
const metrics = await rateLimiter.getMetrics();
console.log({
  totalRecords: metrics.totalRecords,
  blockedRecords: metrics.blockedRecords,
  lockedAccounts: metrics.lockedAccounts,
  verifiedUsers: metrics.verifiedUsers,
  adminOverrides: metrics.adminOverrides,
  averageDelays: metrics.averageDelays
});
```

### Security Logging

All security events are logged with context:

```typescript
// Automatic security logging for:
// - Rate limit violations
// - Account lockouts
// - Admin actions
// - Progressive delays
// - Bypass activations

// Example log entry:
{
  event: 'Rate limit exceeded',
  level: 'high',
  context: {
    operationType: 'auth.signin',
    identifier: 'auth.signin:user@example.com',
    attemptCount: 5,
    blockExpires: '2023-12-01T15:30:00Z',
    ipAddresses: ['192.168.1.1', '192.168.1.2'],
    userAgent: 'Mozilla/5.0...'
  }
}
```

## Testing

Comprehensive test suite available:

```bash
# Run rate limiter tests
npm test src/lib/__tests__/rate-limiter-enhanced.test.ts

# Test specific scenarios
npm test -- --grep "Progressive Delays"
npm test -- --grep "Account Lockout"
npm test -- --grep "Redis Integration"
```

## Error Handling

The rate limiter is designed to fail safely:

```typescript
try {
  const result = await checkRateLimit('auth.signin', options);
  // Handle normally
} catch (error) {
  // Rate limiter errors should not block legitimate users
  console.error('Rate limiter error:', error);
  // Allow operation with basic validation
}
```

## Best Practices

### 1. Always Check Before Acting
```typescript
// ✅ Good: Check rate limit before expensive operations
const result = await checkRateLimit('auth.signin', options);
if (!result.allowed) {
  return { error: 'Rate limited' };
}

// Proceed with authentication...
```

### 2. Record All Attempts
```typescript
// ✅ Good: Record both successful and failed attempts
await recordAuthAttempt('auth.signin', authSuccessful, options);
```

### 3. Apply Progressive Delays
```typescript
// ✅ Good: Apply delays to slow down attackers
if (result.delay) {
  await new Promise(resolve => setTimeout(resolve, result.delay));
}
```

### 4. Use Proper Error Messages
```typescript
// ✅ Good: Security-conscious error messages
const message = result.accountLocked
  ? 'Account locked. Please contact support.'
  : 'Too many attempts. Please try again later.';

// ❌ Bad: Revealing implementation details
const message = `Rate limited. Try again in ${result.blockExpires}`;
```

### 5. Monitor and Alert
```typescript
// ✅ Good: Monitor rate limiting metrics
const metrics = await rateLimiter.getMetrics();
if (metrics.blockedRecords > threshold) {
  await alertSecurityTeam(metrics);
}
```

## Security Considerations

1. **IP Address Spoofing**: Use multiple identification factors
2. **Distributed Attacks**: Monitor across multiple IPs
3. **Timing Attacks**: Add jitter to prevent timing analysis
4. **Storage Security**: Encrypt sensitive data in Redis
5. **Monitoring**: Alert on suspicious patterns

## Performance Considerations

1. **Memory Usage**: In-memory store scales with active users
2. **Redis Performance**: Use Redis clustering for high load
3. **Network Latency**: Consider Redis location for response times
4. **Cleanup**: Automatic cleanup prevents memory leaks

## Troubleshooting

### Common Issues

1. **Rate Limiter Not Working**
   - Check environment variables
   - Verify store connection (Redis)
   - Check client identification

2. **Users Getting Locked Out**
   - Review rate limit thresholds
   - Check for legitimate usage patterns
   - Consider increasing limits for verified users

3. **Performance Issues**
   - Monitor Redis performance
   - Check network latency
   - Consider local caching

### Debug Information

```typescript
// Get debug information
const status = await rateLimiter.getStatus('auth.signin', options);
console.log('Debug info:', status);

// Get comprehensive metrics
const metrics = await rateLimiter.getMetrics();
console.log('Metrics:', metrics);
```

## Migration Guide

### From Basic Rate Limiter

1. Update imports:
```typescript
// Old
import { checkRateLimit } from '../lib/rate-limiter';

// New
import { checkRateLimit } from '../lib/rate-limiter-enhanced';
```

2. Update function calls:
```typescript
// Old
const result = checkRateLimit('auth.signin', 'user@example.com');

// New
const result = await checkRateLimit('auth.signin', {
  clientIdentifier: 'user@example.com',
  ipAddress: getClientIpAddress(),
  userId: 'user123'
});
```

3. Handle new response format:
```typescript
// New response includes more information
if (!result.allowed) {
  if (result.accountLocked) {
    // Handle account lockout
  } else {
    // Handle rate limiting
  }
}
```

## Support

For questions or issues:

1. Check the test suite for examples
2. Review security logs for detailed information
3. Monitor metrics for performance insights
4. Contact the development team for advanced configuration

---

*This guide covers the Enhanced Rate Limiter implementation for iPEC Coach Connect. For additional security measures, refer to the main security documentation.*