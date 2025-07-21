# Session Security System Usage Guide

## Overview

The iPEC Coach Connect session security system provides enterprise-grade session management with comprehensive security features including:

- **Secure Session Tokens**: HttpOnly, Secure, SameSite flags
- **Session Fingerprinting**: Device and browser fingerprinting for hijacking detection
- **Concurrent Session Management**: Limit and manage multiple sessions per user
- **AES-256 Encryption**: Strong encryption for session storage
- **Automatic Refresh**: Seamless session renewal before expiration
- **Security Violation Detection**: Real-time monitoring and response
- **CSP and Security Headers**: Comprehensive security header configuration
- **Session Activity Monitoring**: Track and log session activities

## Quick Start

### 1. Basic Usage

The session security system is automatically integrated with the existing auth service:

```typescript
import { useAuth } from '../services/auth.service';

function MyComponent() {
  const {
    user,
    secureSession,
    sessionExpiresAt,
    requiresRefresh,
    concurrentSessions,
    // Session security methods
    validateCurrentSession,
    refreshCurrentSession,
    getCurrentUserSessions,
    invalidateOtherSessions
  } = useAuth();

  // Session automatically validated and managed
  if (user && secureSession) {
    // User is authenticated with secure session
    console.log('Session expires at:', new Date(sessionExpiresAt));
    console.log('Concurrent sessions:', concurrentSessions);
  }
}
```

### 2. Manual Session Operations

```typescript
import { useAuth } from '../services/auth.service';

function SessionManager() {
  const auth = useAuth();

  const handleRefreshSession = async () => {
    const result = await auth.refreshCurrentSession();
    if (result.error) {
      console.error('Session refresh failed:', result.error);
    } else {
      console.log('Session refreshed successfully');
    }
  };

  const handleValidateSession = async () => {
    const validation = await auth.validateCurrentSession();
    if (validation) {
      console.log('Session validation:', validation);
    }
  };

  const handleViewSessions = async () => {
    const result = await auth.getCurrentUserSessions();
    if (result.data) {
      console.log('User sessions:', result.data);
    }
  };

  const handleInvalidateOtherSessions = async () => {
    const result = await auth.invalidateOtherSessions();
    if (result.error) {
      console.error('Failed to invalidate sessions:', result.error);
    } else {
      console.log('Other sessions invalidated');
    }
  };

  return (
    <div>
      <button onClick={handleRefreshSession}>Refresh Session</button>
      <button onClick={handleValidateSession}>Validate Session</button>
      <button onClick={handleViewSessions}>View Sessions</button>
      <button onClick={handleInvalidateOtherSessions}>
        Invalidate Other Sessions
      </button>
    </div>
  );
}
```

## Core Components

### 1. Session Security Manager (`session-security.ts`)

The main session security engine that handles:
- Session creation with fingerprinting
- Session validation and security checks
- Concurrent session management
- Session cleanup and maintenance

```typescript
import { 
  createSecureSession, 
  validateSession, 
  refreshSession, 
  invalidateSession 
} from '../lib/session-security';

// Create secure session (automatically done by auth service)
const secureSession = await createSecureSession(user, supabaseSession, {
  role: 'client',
  permissions: ['read', 'write']
});

// Validate session
const validation = await validateSession(sessionId);
if (!validation.isValid) {
  // Handle invalid session
}

// Refresh session
const refreshedSession = await refreshSession(sessionId);

// Invalidate session
await invalidateSession(sessionId, 'user_logout');
```

### 2. Session Security Middleware (`session-security-middleware.ts`)

Middleware for API calls and authenticated operations:

```typescript
import { 
  sessionMiddleware, 
  validateRequest, 
  secureApiCall,
  axiosRequestInterceptor,
  fetchRequestInterceptor
} from '../lib/session-security-middleware';

// Axios integration
import axios from 'axios';
axios.interceptors.request.use(axiosRequestInterceptor);

// Fetch integration
const originalFetch = window.fetch;
window.fetch = async (url, options) => {
  const enhancedOptions = await fetchRequestInterceptor(url, options);
  return originalFetch(url, enhancedOptions);
};

// Secure API call wrapper
const result = await secureApiCall(
  () => api.getUserProfile(),
  sessionMiddleware.createRequestContext('/api/profile', 'GET')
);
```

### 3. Session Security Configuration (`session-security-config.ts`)

Environment-specific configuration:

```typescript
import { 
  getSessionSecurityConfig, 
  getSessionMiddlewareConfig,
  currentSessionConfig,
  currentCSPString
} from '../lib/session-security-config';

// Get configuration for current environment
const config = getSessionSecurityConfig();
console.log('Session timeout:', config.sessionTimeout);
console.log('Max concurrent sessions:', config.maxConcurrentSessions);

// Get CSP string for current environment
console.log('CSP Policy:', currentCSPString);
```

## Advanced Features

### 1. Session Fingerprinting

The system automatically generates device fingerprints to detect session hijacking:

```typescript
// Fingerprint includes:
// - User agent
// - Screen resolution
// - Timezone
// - Language
// - Platform
// - WebGL renderer
// - Canvas fingerprint

// Risk levels:
// - low: Normal session usage
// - medium: Some device characteristics changed
// - high: Significant device changes
// - critical: Major security violation detected
```

### 2. Concurrent Session Management

```typescript
// Get all user sessions
const sessions = await auth.getCurrentUserSessions();

sessions.data.forEach(session => {
  console.log({
    sessionId: session.sessionId,
    deviceType: session.deviceType,
    browser: session.browser,
    lastActivity: session.lastActivity,
    isCurrentSession: session.isCurrentSession
  });
});

// Limit concurrent sessions (configured per environment)
// - Development: 10 sessions
// - Production: 5 sessions
// - Enterprise: 3 sessions
```

### 3. Security Violation Handling

```typescript
// Automatic handling based on environment:
// - Development: 'warn' - Log violations but allow access
// - Production: 'block' - Block requests with violations
// - Enterprise: 'logout' - Force logout on violations

// Custom violation handling
import { sessionMiddleware } from '../lib/session-security-middleware';

const customMiddleware = new SessionSecurityMiddleware({
  securityViolationAction: 'block',
  sessionTimeoutWarning: 5, // 5 minutes
  autoRefresh: true
});
```

### 4. Session Monitoring and Logging

```typescript
// Listen for session warnings
window.addEventListener('sessionWarning', (event) => {
  const { timeUntilExpiry, message } = event.detail;
  showSessionWarning(message);
});

// Get session statistics
const stats = auth.getSessionSecurityStats();
console.log('Session stats:', stats);

// Monitor session status
const status = sessionMiddleware.getSessionStatus();
console.log('Session status:', {
  isValid: status.isValid,
  timeUntilExpiry: status.timeUntilExpiry,
  requiresRefresh: status.requiresRefresh,
  securityRisk: status.securityRisk
});
```

## Security Headers and CSP

### 1. Content Security Policy

The system automatically configures CSP based on environment:

```typescript
// Development CSP (more permissive)
const devCSP = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  connect-src 'self' https://*.supabase.co wss://localhost:*;
`;

// Production CSP (strict)
const prodCSP = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://accounts.google.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  connect-src 'self' https://*.supabase.co;
  upgrade-insecure-requests;
`;

// Enterprise CSP (most strict)
const enterpriseCSP = `
  default-src 'self';
  script-src 'self' https://accounts.google.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  require-trusted-types-for 'script';
`;
```

### 2. Security Headers

```typescript
// Automatically applied security headers:
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
};
```

## Session Lifecycle

### 1. Session Creation

```typescript
// Automatic session creation on login
const session = await auth.signIn({ email, password });

// Session created with:
// - Unique session ID
// - Device fingerprint
// - Expiration timestamp
// - Security events log
// - Encrypted storage
```

### 2. Session Validation

```typescript
// Automatic validation every 5 minutes
// Manual validation
const validation = await auth.validateCurrentSession();

// Validation checks:
// - Session expiration
// - Fingerprint matching
// - Security violations
// - Concurrent session limits
```

### 3. Session Refresh

```typescript
// Automatic refresh when needed
// Manual refresh
await auth.refreshCurrentSession();

// Refresh triggers:
// - 30 minutes before expiration
// - Security validation requirements
// - Token refresh events
```

### 4. Session Invalidation

```typescript
// Automatic invalidation on:
// - User logout
// - Security violations
// - Session expiration
// - Concurrent session limits exceeded

// Manual invalidation
await auth.invalidateOtherSessions();
```

## Error Handling

### 1. Session Validation Errors

```typescript
const validation = await auth.validateCurrentSession();

if (!validation?.isValid) {
  switch (validation?.action) {
    case 'block':
      // Block the request
      showError('Session security violation detected');
      break;
    case 'invalidate':
      // Force logout
      await auth.signOut();
      break;
    case 'refresh':
      // Refresh session
      await auth.refreshCurrentSession();
      break;
  }
}
```

### 2. API Call Errors

```typescript
try {
  const response = await secureApiCall(
    () => api.getData(),
    sessionMiddleware.createRequestContext('/api/data')
  );
} catch (error) {
  if (error.message.includes('Session validation failed')) {
    // Handle session error
    await auth.signOut();
  }
}
```

### 3. Fingerprint Mismatches

```typescript
// Automatic handling based on risk level:
// - Low: Allow with logging
// - Medium: Warn user
// - High: Challenge user
// - Critical: Invalidate session

// Custom handling
window.addEventListener('sessionWarning', (event) => {
  if (event.detail.type === 'fingerprint_mismatch') {
    showSecurityWarning('Unusual activity detected');
  }
});
```

## Best Practices

### 1. Session Management

```typescript
// DO: Let the system handle session lifecycle automatically
const auth = useAuth();
// Session is automatically created, validated, and refreshed

// DON'T: Manually manage session tokens
// Avoid direct token manipulation
```

### 2. Security Monitoring

```typescript
// DO: Monitor session warnings
window.addEventListener('sessionWarning', handleSessionWarning);

// DO: Check session status in sensitive operations
const status = sessionMiddleware.getSessionStatus();
if (status.securityRisk === 'high') {
  requireAdditionalAuth();
}
```

### 3. API Integration

```typescript
// DO: Use middleware for API calls
const response = await secureApiCall(apiOperation, context);

// DO: Handle middleware errors gracefully
try {
  const result = await secureApiCall(operation, context);
} catch (error) {
  handleSessionError(error);
}
```

### 4. Configuration

```typescript
// DO: Use environment-specific configurations
const config = getSessionSecurityConfig();

// DO: Validate configuration
const validation = validateSessionConfig(config);
if (!validation.isValid) {
  console.error('Invalid session config:', validation.errors);
}
```

## Testing

### 1. Development Testing

```typescript
// Test session creation
const testSession = await createSecureSession(mockUser, mockSupabaseSession, {
  role: 'client',
  permissions: ['read']
});

// Test session validation
const validation = await validateSession(testSession.sessionId);
expect(validation.isValid).toBe(true);

// Test concurrent sessions
const sessions = await getConcurrentSessions(mockUser.id);
expect(sessions.length).toBeLessThanOrEqual(5);
```

### 2. Security Testing

```typescript
// Test fingerprint changes
const originalFingerprint = await generateSessionFingerprint();
// Simulate device change
const newFingerprint = { ...originalFingerprint, userAgent: 'different' };
const risk = await analyzeFingerprintRisk(originalFingerprint, newFingerprint);
expect(risk).toBe('high');

// Test session timeout
const expiredSession = { ...testSession, expiresAt: Date.now() - 1000 };
const validation = await validateSession(expiredSession.sessionId);
expect(validation.isValid).toBe(false);
```

## Troubleshooting

### 1. Common Issues

```typescript
// Issue: Session not creating
// Solution: Check auth service integration
const authState = useAuth();
console.log('Auth state:', authState);

// Issue: Fingerprint mismatches
// Solution: Check browser settings
const fingerprint = await generateSessionFingerprint();
console.log('Current fingerprint:', fingerprint);

// Issue: CSP violations
// Solution: Check environment configuration
console.log('CSP config:', currentCSPString);
```

### 2. Debug Information

```typescript
// Get session statistics
const stats = auth.getSessionSecurityStats();
console.log('Session stats:', stats);

// Get middleware status
const status = sessionMiddleware.getSessionStatus();
console.log('Middleware status:', status);

// Check configuration
const config = getSessionSecurityConfig();
console.log('Session config:', config);
```

## Migration Guide

### 1. Existing Applications

```typescript
// Before: Basic session management
const { user, session } = useAuth();

// After: Enhanced session security
const { 
  user, 
  session, 
  secureSession, 
  sessionExpiresAt,
  concurrentSessions,
  validateCurrentSession,
  refreshCurrentSession
} = useAuth();
```

### 2. API Integration

```typescript
// Before: Direct API calls
const response = await fetch('/api/data');

// After: Secure API calls
const response = await secureApiCall(
  () => fetch('/api/data'),
  sessionMiddleware.createRequestContext('/api/data')
);
```

## Performance Considerations

### 1. Optimization

- Session validation occurs every 5 minutes (configurable)
- Fingerprint generation is cached for performance
- Encryption uses Web Crypto API for optimal performance
- Session cleanup runs hourly to prevent memory leaks

### 2. Monitoring

```typescript
// Monitor session performance
const stats = auth.getSessionSecurityStats();
console.log('Performance metrics:', {
  activeSessions: stats.activeSessions,
  securityEvents: stats.securityEvents,
  memoryUsage: stats.memoryUsage
});
```

## Support

For issues or questions about the session security system:

1. Check the troubleshooting section
2. Review the error logs in the browser console
3. Verify environment configuration
4. Test with different security levels

The system provides comprehensive logging to help diagnose issues and maintain security.