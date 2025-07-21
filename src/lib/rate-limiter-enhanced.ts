/**
 * Enhanced Rate Limiting Service for iPEC Coach Connect
 * 
 * Production-ready rate limiting with:
 * - Progressive delays (exponential backoff)
 * - Account-level lockout after repeated failures
 * - Redis-ready interface for distributed rate limiting
 * - Bypass for verified users and admin override
 * - Environment-based configuration
 * - Thread-safe implementation for concurrent requests
 * - Enhanced security logging and metrics
 */

import { logSecurity } from './secure-logger';

// Rate limit configuration interface
export interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  blockDurationMs?: number;
  skipSuccessfulAttempts?: boolean;
  progressiveDelay?: {
    enabled: boolean;
    baseDelayMs: number;
    maxDelayMs: number;
    multiplier: number;
  };
}

// Attempt record with enhanced tracking
export interface AttemptRecord {
  count: number;
  firstAttempt: number;
  lastAttempt: number;
  isBlocked: boolean;
  blockExpires?: number;
  consecutiveFailures: number;
  delays: number[];
  ipAddresses: Set<string>;
  userAgent?: string;
}

// Account lockout record
export interface AccountLockoutRecord {
  userId: string;
  email: string;
  totalFailedAttempts: number;
  lockedAt: number;
  lockExpires: number;
  reason: string;
  ipAddresses: Set<string>;
}

// Result interface for rate limit checks
export interface RateLimitCheckResult {
  allowed: boolean;
  remainingAttempts: number;
  resetTime: number;
  blockExpires?: number;
  delay?: number; // Progressive delay in milliseconds
  accountLocked?: boolean;
  accountLockExpires?: number;
}

// Abstract storage interface for Redis compatibility
export interface RateLimitStore {
  get(key: string): Promise<AttemptRecord | null>;
  set(key: string, value: AttemptRecord, ttlMs?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  getAccountLockout(userId: string): Promise<AccountLockoutRecord | null>;
  setAccountLockout(userId: string, record: AccountLockoutRecord): Promise<void>;
  deleteAccountLockout(userId: string): Promise<void>;
  getAllKeys(pattern?: string): Promise<string[]>;
}

// In-memory storage implementation
class InMemoryRateLimitStore implements RateLimitStore {
  private attempts = new Map<string, AttemptRecord>();
  private accountLockouts = new Map<string, AccountLockoutRecord>();
  private timers = new Map<string, NodeJS.Timeout>();
  
  async get(key: string): Promise<AttemptRecord | null> {
    const record = this.attempts.get(key);
    if (!record) return null;
    
    // Deep clone to prevent external modifications
    return {
      ...record,
      ipAddresses: new Set(record.ipAddresses),
      delays: [...record.delays]
    };
  }
  
  async set(key: string, value: AttemptRecord, ttlMs?: number): Promise<void> {
    // Clear existing timer if any
    const existingTimer = this.timers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
      this.timers.delete(key);
    }
    
    // Deep clone to prevent external modifications
    this.attempts.set(key, {
      ...value,
      ipAddresses: new Set(value.ipAddresses),
      delays: [...value.delays]
    });
    
    // Set TTL if provided
    if (ttlMs && ttlMs > 0) {
      const timer = setTimeout(() => {
        this.attempts.delete(key);
        this.timers.delete(key);
      }, ttlMs);
      this.timers.set(key, timer);
    }
  }
  
  async delete(key: string): Promise<void> {
    this.attempts.delete(key);
    const timer = this.timers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(key);
    }
  }
  
  async clear(): Promise<void> {
    this.attempts.clear();
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
    this.accountLockouts.clear();
  }
  
  async getAccountLockout(userId: string): Promise<AccountLockoutRecord | null> {
    const record = this.accountLockouts.get(userId);
    if (!record) return null;
    
    // Check if lockout has expired
    if (Date.now() > record.lockExpires) {
      this.accountLockouts.delete(userId);
      return null;
    }
    
    // Deep clone
    return {
      ...record,
      ipAddresses: new Set(record.ipAddresses)
    };
  }
  
  async setAccountLockout(userId: string, record: AccountLockoutRecord): Promise<void> {
    this.accountLockouts.set(userId, {
      ...record,
      ipAddresses: new Set(record.ipAddresses)
    });
    
    // Auto-cleanup after expiry
    setTimeout(() => {
      this.accountLockouts.delete(userId);
    }, record.lockExpires - Date.now());
  }
  
  async deleteAccountLockout(userId: string): Promise<void> {
    this.accountLockouts.delete(userId);
  }
  
  async getAllKeys(pattern?: string): Promise<string[]> {
    const keys = Array.from(this.attempts.keys());
    if (!pattern) return keys;
    
    // Simple pattern matching (supports * wildcard)
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return keys.filter(key => regex.test(key));
  }
}

// Enhanced Rate Limiter class
export class EnhancedRateLimiter {
  private store: RateLimitStore;
  private configs: Map<string, RateLimitConfig> = new Map();
  private verifiedUsers = new Set<string>();
  private adminOverrides = new Set<string>();
  private accountFailures = new Map<string, number>();
  
  constructor(store?: RateLimitStore) {
    this.store = store || new InMemoryRateLimitStore();
    this.initializeConfigurations();
    this.setupCleanupInterval();
  }
  
  /**
   * Initialize rate limit configurations from environment variables
   */
  private initializeConfigurations(): void {
    // Helper to parse environment variables
    const getEnvNumber = (key: string, defaultValue: number): number => {
      const value = import.meta.env[key];
      return value ? parseInt(value, 10) : defaultValue;
    };
    
    const getEnvBoolean = (key: string, defaultValue: boolean): boolean => {
      const value = import.meta.env[key];
      return value ? value === 'true' : defaultValue;
    };
    
    // Progressive delay configuration
    const progressiveDelayEnabled = getEnvBoolean('VITE_RATE_LIMIT_PROGRESSIVE_DELAY_ENABLED', true);
    const progressiveDelayBase = getEnvNumber('VITE_RATE_LIMIT_PROGRESSIVE_DELAY_BASE_MS', 1000);
    const progressiveDelayMax = getEnvNumber('VITE_RATE_LIMIT_PROGRESSIVE_DELAY_MAX_MS', 10000);
    
    // Login configuration
    this.setConfig('auth.signin', {
      maxAttempts: getEnvNumber('VITE_RATE_LIMIT_LOGIN_MAX_ATTEMPTS', 5),
      windowMs: getEnvNumber('VITE_RATE_LIMIT_LOGIN_WINDOW_MS', 15 * 60 * 1000),
      blockDurationMs: getEnvNumber('VITE_RATE_LIMIT_LOGIN_BLOCK_DURATION_MS', 30 * 60 * 1000),
      skipSuccessfulAttempts: true,
      progressiveDelay: {
        enabled: progressiveDelayEnabled,
        baseDelayMs: progressiveDelayBase,
        maxDelayMs: progressiveDelayMax,
        multiplier: 2
      }
    });
    
    // Signup configuration
    this.setConfig('auth.signup', {
      maxAttempts: getEnvNumber('VITE_RATE_LIMIT_SIGNUP_MAX_ATTEMPTS', 3),
      windowMs: getEnvNumber('VITE_RATE_LIMIT_SIGNUP_WINDOW_MS', 60 * 60 * 1000),
      blockDurationMs: getEnvNumber('VITE_RATE_LIMIT_SIGNUP_BLOCK_DURATION_MS', 60 * 60 * 1000),
      skipSuccessfulAttempts: true,
      progressiveDelay: {
        enabled: progressiveDelayEnabled,
        baseDelayMs: progressiveDelayBase * 2,
        maxDelayMs: progressiveDelayMax,
        multiplier: 1.5
      }
    });
    
    // Password reset configuration
    this.setConfig('auth.password_reset', {
      maxAttempts: getEnvNumber('VITE_RATE_LIMIT_PASSWORD_RESET_MAX_ATTEMPTS', 3),
      windowMs: getEnvNumber('VITE_RATE_LIMIT_PASSWORD_RESET_WINDOW_MS', 60 * 60 * 1000),
      blockDurationMs: getEnvNumber('VITE_RATE_LIMIT_PASSWORD_RESET_BLOCK_DURATION_MS', 60 * 60 * 1000),
      skipSuccessfulAttempts: false,
      progressiveDelay: {
        enabled: progressiveDelayEnabled,
        baseDelayMs: progressiveDelayBase * 3,
        maxDelayMs: progressiveDelayMax,
        multiplier: 1.5
      }
    });
    
    // OAuth configuration
    this.setConfig('auth.oauth', {
      maxAttempts: 10,
      windowMs: 10 * 60 * 1000,
      blockDurationMs: 20 * 60 * 1000,
      skipSuccessfulAttempts: true
    });
  }
  
  /**
   * Set or update configuration for an operation type
   */
  public setConfig(operationType: string, config: RateLimitConfig): void {
    this.configs.set(operationType, config);
  }
  
  /**
   * Get identifier for rate limiting
   */
  private getIdentifier(
    operationType: string, 
    clientIdentifier?: string,
    ipAddress?: string
  ): string {
    const parts = [operationType];
    
    if (clientIdentifier) {
      parts.push(clientIdentifier);
    }
    
    if (ipAddress) {
      parts.push(ipAddress);
    }
    
    // If no identifiers provided, use browser fingerprint
    if (!clientIdentifier && !ipAddress) {
      parts.push(this.getBrowserFingerprint());
    }
    
    return parts.join(':');
  }
  
  /**
   * Generate browser fingerprint for client identification
   */
  private getBrowserFingerprint(): string {
    if (typeof window === 'undefined') {
      return 'server';
    }
    
    const components = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      screen.colorDepth,
      new Date().getTimezoneOffset(),
      navigator.hardwareConcurrency || 0,
      navigator.maxTouchPoints || 0
    ];
    
    // Canvas fingerprinting
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillStyle = '#f60';
        ctx.fillRect(125, 1, 62, 20);
        ctx.fillStyle = '#069';
        ctx.fillText('Browser fingerprint', 2, 15);
        components.push(canvas.toDataURL());
      }
    } catch (e) {
      // Canvas API might be blocked
    }
    
    // Simple hash function
    const fingerprint = components.join('|');
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    return Math.abs(hash).toString(36);
  }
  
  /**
   * Calculate progressive delay based on attempt count
   */
  private calculateProgressiveDelay(
    attemptCount: number,
    config: RateLimitConfig
  ): number {
    if (!config.progressiveDelay?.enabled) {
      return 0;
    }
    
    const { baseDelayMs, maxDelayMs, multiplier } = config.progressiveDelay;
    
    // Exponential backoff: delay = base * (multiplier ^ (attempts - 1))
    const delay = Math.min(
      baseDelayMs * Math.pow(multiplier, Math.max(0, attemptCount - 1)),
      maxDelayMs
    );
    
    // Add jitter (±10%) to prevent thundering herd
    const jitter = delay * 0.1 * (Math.random() * 2 - 1);
    
    return Math.round(delay + jitter);
  }
  
  /**
   * Check if an operation is allowed
   */
  public async isAllowed(
    operationType: string,
    options?: {
      clientIdentifier?: string;
      ipAddress?: string;
      userId?: string;
      userAgent?: string;
    }
  ): Promise<RateLimitCheckResult> {
    const config = this.configs.get(operationType);
    if (!config) {
      return {
        allowed: true,
        remainingAttempts: Infinity,
        resetTime: 0
      };
    }
    
    // Check admin override
    if (options?.userId && this.adminOverrides.has(options.userId)) {
      logSecurity('Rate limit bypassed for admin', 'low', {
        operationType,
        userId: options.userId
      });
      return {
        allowed: true,
        remainingAttempts: Infinity,
        resetTime: 0
      };
    }
    
    // Check verified user bypass
    if (options?.userId && this.verifiedUsers.has(options.userId)) {
      // Verified users get 2x the limit
      const verifiedConfig = {
        ...config,
        maxAttempts: config.maxAttempts * 2
      };
      return this.checkRateLimitInternal(operationType, verifiedConfig, options);
    }
    
    // Check account lockout
    if (options?.userId) {
      const lockout = await this.store.getAccountLockout(options.userId);
      if (lockout && Date.now() < lockout.lockExpires) {
        logSecurity('Account lockout active', 'high', {
          operationType,
          userId: options.userId,
          lockExpires: new Date(lockout.lockExpires).toISOString()
        });
        
        return {
          allowed: false,
          remainingAttempts: 0,
          resetTime: lockout.lockExpires,
          accountLocked: true,
          accountLockExpires: lockout.lockExpires
        };
      }
    }
    
    return this.checkRateLimitInternal(operationType, config, options);
  }
  
  /**
   * Internal rate limit check logic
   */
  private async checkRateLimitInternal(
    operationType: string,
    config: RateLimitConfig,
    options?: {
      clientIdentifier?: string;
      ipAddress?: string;
      userId?: string;
      userAgent?: string;
    }
  ): Promise<RateLimitCheckResult> {
    const identifier = this.getIdentifier(
      operationType,
      options?.clientIdentifier,
      options?.ipAddress
    );
    
    const now = Date.now();
    const record = await this.store.get(identifier);
    
    // No previous attempts
    if (!record) {
      return {
        allowed: true,
        remainingAttempts: config.maxAttempts - 1,
        resetTime: now + config.windowMs
      };
    }
    
    // Check if currently blocked
    if (record.isBlocked && record.blockExpires && now < record.blockExpires) {
      logSecurity('Rate limit block active', 'medium', {
        operationType,
        identifier,
        blockExpires: new Date(record.blockExpires).toISOString(),
        ipAddresses: Array.from(record.ipAddresses)
      });
      
      return {
        allowed: false,
        remainingAttempts: 0,
        resetTime: record.blockExpires,
        blockExpires: record.blockExpires
      };
    }
    
    // Check if window has expired
    if (now - record.firstAttempt > config.windowMs) {
      // Window expired, allow but track new window
      await this.store.delete(identifier);
      return {
        allowed: true,
        remainingAttempts: config.maxAttempts - 1,
        resetTime: now + config.windowMs
      };
    }
    
    // Check if limit exceeded
    if (record.count >= config.maxAttempts) {
      const blockExpires = config.blockDurationMs
        ? now + config.blockDurationMs
        : record.firstAttempt + config.windowMs;
      
      // Update record to blocked state
      const updatedRecord = {
        ...record,
        isBlocked: true,
        blockExpires
      };
      
      await this.store.set(identifier, updatedRecord, blockExpires - now);
      
      logSecurity('Rate limit exceeded', 'high', {
        operationType,
        identifier,
        attemptCount: record.count,
        blockExpires: new Date(blockExpires).toISOString(),
        ipAddresses: Array.from(record.ipAddresses),
        userAgent: record.userAgent
      });
      
      return {
        allowed: false,
        remainingAttempts: 0,
        resetTime: blockExpires,
        blockExpires
      };
    }
    
    // Calculate progressive delay
    const delay = this.calculateProgressiveDelay(record.count + 1, config);
    
    // Allow the attempt with possible delay
    return {
      allowed: true,
      remainingAttempts: config.maxAttempts - record.count - 1,
      resetTime: record.firstAttempt + config.windowMs,
      delay
    };
  }
  
  /**
   * Record an attempt for rate limiting
   */
  public async recordAttempt(
    operationType: string,
    success: boolean,
    options?: {
      clientIdentifier?: string;
      ipAddress?: string;
      userId?: string;
      userAgent?: string;
    }
  ): Promise<void> {
    const config = this.configs.get(operationType);
    if (!config) {
      return;
    }
    
    const identifier = this.getIdentifier(
      operationType,
      options?.clientIdentifier,
      options?.ipAddress
    );
    
    const now = Date.now();
    const record = await this.store.get(identifier);
    
    // Handle successful attempts
    if (success && config.skipSuccessfulAttempts) {
      if (record) {
        await this.store.delete(identifier);
      }
      
      // Reset account failure count on successful login
      if (options?.userId) {
        this.accountFailures.delete(options.userId);
      }
      
      return;
    }
    
    // Handle failed attempts
    if (!success && options?.userId) {
      await this.trackAccountFailure(options.userId, operationType, options.ipAddress);
    }
    
    // Update or create attempt record
    if (!record) {
      const newRecord: AttemptRecord = {
        count: 1,
        firstAttempt: now,
        lastAttempt: now,
        isBlocked: false,
        consecutiveFailures: success ? 0 : 1,
        delays: [],
        ipAddresses: new Set(options?.ipAddress ? [options.ipAddress] : []),
        userAgent: options?.userAgent
      };
      
      await this.store.set(
        identifier,
        newRecord,
        config.windowMs + (config.blockDurationMs || 0)
      );
    } else {
      const updatedRecord: AttemptRecord = {
        ...record,
        count: record.count + 1,
        lastAttempt: now,
        consecutiveFailures: success ? 0 : record.consecutiveFailures + 1,
        ipAddresses: options?.ipAddress 
          ? new Set([...record.ipAddresses, options.ipAddress])
          : record.ipAddresses,
        userAgent: options?.userAgent || record.userAgent
      };
      
      // Track delays for metrics
      const delay = this.calculateProgressiveDelay(updatedRecord.count, config);
      if (delay > 0) {
        updatedRecord.delays.push(delay);
      }
      
      await this.store.set(
        identifier,
        updatedRecord,
        config.windowMs + (config.blockDurationMs || 0)
      );
    }
    
    logSecurity('Authentication attempt recorded', 'low', {
      operationType,
      success,
      attemptCount: (record?.count || 0) + 1,
      maxAttempts: config.maxAttempts,
      ipAddress: options?.ipAddress,
      userId: options?.userId
    });
  }
  
  /**
   * Track account-level failures for lockout
   */
  private async trackAccountFailure(
    userId: string,
    operationType: string,
    ipAddress?: string
  ): Promise<void> {
    const currentFailures = this.accountFailures.get(userId) || 0;
    const newFailures = currentFailures + 1;
    this.accountFailures.set(userId, newFailures);
    
    const lockoutThreshold = parseInt(
      import.meta.env.VITE_RATE_LIMIT_ACCOUNT_LOCKOUT_THRESHOLD || '10',
      10
    );
    
    if (newFailures >= lockoutThreshold) {
      const lockoutDuration = parseInt(
        import.meta.env.VITE_RATE_LIMIT_ACCOUNT_LOCKOUT_DURATION_MS || '86400000',
        10
      );
      
      const lockoutRecord: AccountLockoutRecord = {
        userId,
        email: '',
        totalFailedAttempts: newFailures,
        lockedAt: Date.now(),
        lockExpires: Date.now() + lockoutDuration,
        reason: `Exceeded ${lockoutThreshold} failed login attempts`,
        ipAddresses: new Set(ipAddress ? [ipAddress] : [])
      };
      
      await this.store.setAccountLockout(userId, lockoutRecord);
      this.accountFailures.delete(userId);
      
      logSecurity('Account locked due to excessive failures', 'critical', {
        userId,
        totalFailures: newFailures,
        lockDuration: lockoutDuration,
        operationType
      });
    }
  }
  
  /**
   * Add user to verified list (gets relaxed limits)
   */
  public addVerifiedUser(userId: string): void {
    this.verifiedUsers.add(userId);
    logSecurity('User added to verified list', 'low', { userId });
  }
  
  /**
   * Remove user from verified list
   */
  public removeVerifiedUser(userId: string): void {
    this.verifiedUsers.delete(userId);
    logSecurity('User removed from verified list', 'low', { userId });
  }
  
  /**
   * Add admin override (bypasses all rate limits)
   */
  public addAdminOverride(userId: string): void {
    this.adminOverrides.add(userId);
    logSecurity('Admin override added', 'medium', { userId });
  }
  
  /**
   * Remove admin override
   */
  public removeAdminOverride(userId: string): void {
    this.adminOverrides.delete(userId);
    logSecurity('Admin override removed', 'medium', { userId });
  }
  
  /**
   * Manually unlock an account
   */
  public async unlockAccount(userId: string): Promise<void> {
    await this.store.deleteAccountLockout(userId);
    this.accountFailures.delete(userId);
    logSecurity('Account manually unlocked', 'medium', { userId });
  }
  
  /**
   * Reset rate limiting for specific operation and client
   */
  public async reset(
    operationType: string,
    options?: {
      clientIdentifier?: string;
      ipAddress?: string;
    }
  ): Promise<void> {
    const identifier = this.getIdentifier(
      operationType,
      options?.clientIdentifier,
      options?.ipAddress
    );
    
    await this.store.delete(identifier);
    
    logSecurity('Rate limit reset', 'low', {
      operationType,
      identifier
    });
  }
  
  /**
   * Get current status for debugging and monitoring
   */
  public async getStatus(
    operationType: string,
    options?: {
      clientIdentifier?: string;
      ipAddress?: string;
      userId?: string;
    }
  ): Promise<{
    attempts: number;
    maxAttempts: number;
    isBlocked: boolean;
    blockExpires?: number;
    windowExpires: number;
    isVerified: boolean;
    hasAdminOverride: boolean;
    accountLocked: boolean;
    accountLockExpires?: number;
  } | null> {
    const config = this.configs.get(operationType);
    if (!config) {
      return null;
    }
    
    const identifier = this.getIdentifier(
      operationType,
      options?.clientIdentifier,
      options?.ipAddress
    );
    
    const record = await this.store.get(identifier);
    const accountLockout = options?.userId 
      ? await this.store.getAccountLockout(options.userId)
      : null;
    
    return {
      attempts: record?.count || 0,
      maxAttempts: config.maxAttempts,
      isBlocked: record?.isBlocked || false,
      blockExpires: record?.blockExpires,
      windowExpires: record ? record.firstAttempt + config.windowMs : 0,
      isVerified: options?.userId ? this.verifiedUsers.has(options.userId) : false,
      hasAdminOverride: options?.userId ? this.adminOverrides.has(options.userId) : false,
      accountLocked: !!accountLockout && Date.now() < accountLockout.lockExpires,
      accountLockExpires: accountLockout?.lockExpires
    };
  }
  
  /**
   * Get metrics for monitoring
   */
  public async getMetrics(): Promise<{
    totalRecords: number;
    blockedRecords: number;
    lockedAccounts: number;
    verifiedUsers: number;
    adminOverrides: number;
    averageDelays: { [operationType: string]: number };
  }> {
    const allKeys = await this.store.getAllKeys();
    let blockedCount = 0;
    const delays: { [operationType: string]: number[] } = {};
    
    for (const key of allKeys) {
      const record = await this.store.get(key);
      if (record?.isBlocked) {
        blockedCount++;
      }
      
      if (record?.delays.length) {
        const [operationType] = key.split(':');
        if (!delays[operationType]) {
          delays[operationType] = [];
        }
        delays[operationType].push(...record.delays);
      }
    }
    
    const averageDelays: { [operationType: string]: number } = {};
    for (const [op, delayList] of Object.entries(delays)) {
      averageDelays[op] = delayList.reduce((a, b) => a + b, 0) / delayList.length;
    }
    
    return {
      totalRecords: allKeys.length,
      blockedRecords: blockedCount,
      lockedAccounts: this.accountFailures.size,
      verifiedUsers: this.verifiedUsers.size,
      adminOverrides: this.adminOverrides.size,
      averageDelays
    };
  }
  
  /**
   * Setup periodic cleanup of expired records
   */
  private setupCleanupInterval(): void {
    // Cleanup every 5 minutes
    setInterval(async () => {
      await this.cleanup();
    }, 5 * 60 * 1000);
  }
  
  /**
   * Clean up expired records
   */
  private async cleanup(): Promise<void> {
    const now = Date.now();
    const allKeys = await this.store.getAllKeys();
    let cleanedCount = 0;
    
    for (const key of allKeys) {
      const record = await this.store.get(key);
      if (!record) continue;
      
      const [operationType] = key.split(':');
      const config = this.configs.get(operationType);
      if (!config) {
        await this.store.delete(key);
        cleanedCount++;
        continue;
      }
      
      // Remove if window has expired and not blocked, or if block has expired
      const windowExpired = now - record.firstAttempt > config.windowMs;
      const blockExpired = record.blockExpires && now > record.blockExpires;
      
      if ((windowExpired && !record.isBlocked) || blockExpired) {
        await this.store.delete(key);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      logSecurity('Rate limiter cleanup completed', 'low', {
        recordsCleaned: cleanedCount,
        totalRecords: allKeys.length
      });
    }
  }
}

// Create singleton instance with environment-based storage
let store: RateLimitStore;

if (import.meta.env.VITE_RATE_LIMIT_STORAGE_TYPE === 'redis') {
  // TODO: Implement RedisRateLimitStore when Redis is configured
  console.warn('Redis rate limit storage requested but not implemented, falling back to memory');
  store = new InMemoryRateLimitStore();
} else {
  store = new InMemoryRateLimitStore();
}

export const enhancedRateLimiter = new EnhancedRateLimiter(store);

// Export convenience functions
export const checkRateLimit = enhancedRateLimiter.isAllowed.bind(enhancedRateLimiter);
export const recordAuthAttempt = enhancedRateLimiter.recordAttempt.bind(enhancedRateLimiter);
export const resetRateLimit = enhancedRateLimiter.reset.bind(enhancedRateLimiter);
export const getRateLimitStatus = enhancedRateLimiter.getStatus.bind(enhancedRateLimiter);
export const unlockAccount = enhancedRateLimiter.unlockAccount.bind(enhancedRateLimiter);
export const addVerifiedUser = enhancedRateLimiter.addVerifiedUser.bind(enhancedRateLimiter);
export const addAdminOverride = enhancedRateLimiter.addAdminOverride.bind(enhancedRateLimiter);

export default enhancedRateLimiter;