/**
 * Secure Logger for iPEC Coach Connect
 * 
 * Provides secure logging that prevents PII exposure in debug mode while
 * maintaining useful debugging information for development.
 */

type LogContext = Record<string, any>;

interface SecureLogOptions {
  enableConsoleLogging?: boolean;
  enablePerformanceLogging?: boolean;
  sensitiveFields?: string[];
  maxLogLevel?: 'debug' | 'info' | 'warn' | 'error';
}

class SecureLogger {
  private options: Required<SecureLogOptions>;
  private isDebugMode: boolean;
  private isProduction: boolean;

  // Default sensitive fields that should never be logged
  private defaultSensitiveFields = [
    'email',
    'password',
    'token',
    'secret',
    'key',
    'auth',
    'session_token',
    'access_token',
    'refresh_token',
    'phone',
    'ssn',
    'credit_card',
    'cvv',
    'personal_info'
  ];

  constructor(options: SecureLogOptions = {}) {
    this.isDebugMode = import.meta.env.VITE_ENABLE_DEBUG_MODE === 'true';
    this.isProduction = import.meta.env.VITE_APP_ENVIRONMENT === 'production';
    
    this.options = {
      enableConsoleLogging: options.enableConsoleLogging ?? this.isDebugMode,
      enablePerformanceLogging: options.enablePerformanceLogging ?? this.isDebugMode,
      sensitiveFields: [...this.defaultSensitiveFields, ...(options.sensitiveFields || [])],
      maxLogLevel: options.maxLogLevel ?? 'debug'
    };
  }

  /**
   * Sanitize data by removing or masking sensitive fields
   */
  private sanitizeData(data: any): any {
    if (data === null || data === undefined) {
      return data;
    }

    if (typeof data === 'string') {
      // Check if string might be an email or sensitive data
      if (this.containsSensitiveData(data)) {
        return this.maskSensitiveString(data);
      }
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeData(item));
    }

    if (typeof data === 'object') {
      const sanitized: any = {};
      
      for (const [key, value] of Object.entries(data)) {
        const lowercaseKey = key.toLowerCase();
        
        if (this.options.sensitiveFields.some(field => lowercaseKey.includes(field))) {
          sanitized[key] = this.maskValue(value);
        } else {
          sanitized[key] = this.sanitizeData(value);
        }
      }
      
      return sanitized;
    }

    return data;
  }

  /**
   * Check if a string contains sensitive data patterns
   */
  private containsSensitiveData(str: string): boolean {
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const tokenPattern = /[a-zA-Z0-9]{20,}/; // Generic token pattern
    
    return emailPattern.test(str) || tokenPattern.test(str);
  }

  /**
   * Mask sensitive string data while preserving useful info for debugging
   */
  private maskSensitiveString(str: string): string {
    if (str.includes('@')) {
      // Email masking: show first char and domain
      const [local, domain] = str.split('@');
      return `${local.charAt(0)}***@${domain}`;
    }
    
    // Generic masking for tokens/keys
    if (str.length > 8) {
      return `${str.substring(0, 4)}***${str.substring(str.length - 4)}`;
    }
    
    return '***';
  }

  /**
   * Mask any value type
   */
  private maskValue(value: any): string {
    if (typeof value === 'string') {
      return this.maskSensitiveString(value);
    }
    return '[REDACTED]';
  }

  /**
   * Format log message with timestamp and context
   */
  private formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | Context: ${JSON.stringify(this.sanitizeData(context))}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`;
  }

  /**
   * Check if logging is enabled for the given level
   */
  private shouldLog(level: string): boolean {
    if (this.isProduction && level === 'debug') {
      return false;
    }

    const levels = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.options.maxLogLevel);
    const requestedLevelIndex = levels.indexOf(level);
    
    return requestedLevelIndex >= currentLevelIndex && this.options.enableConsoleLogging;
  }

  /**
   * Debug level logging
   */
  debug(message: string, context?: LogContext): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  /**
   * Info level logging
   */
  info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message, context));
    }
  }

  /**
   * Warning level logging
   */
  warn(message: string, context?: LogContext): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, context));
    }
  }

  /**
   * Error level logging
   */
  error(message: string, context?: LogContext): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, context));
    }
  }

  /**
   * Auth-specific logging with enhanced security
   */
  authEvent(event: string, hasUser: boolean, context?: LogContext): void {
    const safeContext = {
      ...context,
      userStatus: hasUser ? 'authenticated' : 'unauthenticated',
      timestamp: new Date().toISOString()
    };
    
    this.debug(`🔐 Auth event: ${event}`, safeContext);
  }

  /**
   * Performance logging
   */
  performance(operation: string, duration: number, context?: LogContext): void {
    if (this.options.enablePerformanceLogging) {
      this.debug(`⚡ Performance: ${operation} took ${duration}ms`, context);
    }
  }

  /**
   * Database operation logging
   */
  database(operation: string, table: string, context?: LogContext): void {
    const safeContext = { 
      operation, 
      table, 
      ...this.sanitizeData(context) 
    };
    this.debug(`📊 Database: ${operation} on ${table}`, safeContext);
  }

  /**
   * Security event logging
   */
  security(event: string, severity: 'low' | 'medium' | 'high' | 'critical', context?: LogContext): void {
    const logLevel = severity === 'critical' || severity === 'high' ? 'error' : 'warn';
    const safeContext = { 
      severity, 
      securityEvent: true,
      ...this.sanitizeData(context) 
    };
    
    if (logLevel === 'error') {
      this.error(`🛡️ Security: ${event}`, safeContext);
    } else {
      this.warn(`🛡️ Security: ${event}`, safeContext);
    }
  }
}

// Export singleton instance
export const secureLogger = new SecureLogger();

// Export convenient logging functions
export const logAuth = secureLogger.authEvent.bind(secureLogger);
export const logPerformance = secureLogger.performance.bind(secureLogger);
export const logDatabase = secureLogger.database.bind(secureLogger);
export const logSecurity = secureLogger.security.bind(secureLogger);

export default secureLogger;