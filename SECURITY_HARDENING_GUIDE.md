# Security Hardening Guide for Production Deployment

## 🛡️ Critical Security Issues

### 1. Content Security Policy (CSP) - HIGH PRIORITY

**Current Issue**: The CSP in `vercel.json` is overly permissive:
```json
"default-src 'self' 'unsafe-inline' 'unsafe-eval' https: data: blob:"
```

**Production-Ready CSP**:
```json
{
  "key": "Content-Security-Policy",
  "value": "default-src 'self'; script-src 'self' 'wasm-unsafe-eval' https://js.stripe.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https: *.supabase.co; font-src 'self' https://fonts.gstatic.com data:; connect-src 'self' https://*.supabase.co https://api.stripe.com https://www.google-analytics.com wss://*.supabase.co; media-src 'self' https: *.supabase.co; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';"
}
```

### 2. Console Statements - HIGH PRIORITY

**Issue**: 30+ console statements in production code expose sensitive information.

**Locations to Fix**:
- `src/services/analytics.service.ts` - 16 console statements
- `src/services/auth.service.ts` - 4 console statements  
- `src/services/feature-flags.service.ts` - 3 console statements
- `src/services/index.ts` - 5 console statements

**Fix**: Update `vite.config.ts` terser config:
```typescript
terserOptions: {
  compress: {
    drop_console: isProduction,
    drop_debugger: isProduction,
    pure_funcs: isProduction ? ['console.log', 'console.info', 'console.warn', 'console.debug'] : [],
    passes: 2
  }
}
```

### 3. Environment Variable Security

**Create Production Environment Setup**:

```bash
# Vercel Environment Variables (Required)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_production_anon_key
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_key
VITE_APP_ENVIRONMENT=production
VITE_ENABLE_DEBUG_MODE=false
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project
VITE_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
```

## 🔒 Security Headers Configuration

### Required Headers for Production

Update `vercel.json` headers section:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options", 
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains; preload"
        },
        {
          "key": "Permissions-Policy",
          "value": "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'wasm-unsafe-eval' https://js.stripe.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https: *.supabase.co; font-src 'self' https://fonts.gstatic.com data:; connect-src 'self' https://*.supabase.co https://api.stripe.com https://www.google-analytics.com wss://*.supabase.co; media-src 'self' https: *.supabase.co; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';"
        }
      ]
    },
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "https://your-production-domain.com"
        },
        {
          "key": "Access-Control-Allow-Methods", 
          "value": "GET,POST,PUT,DELETE,OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "Content-Type, Authorization, X-Requested-With"
        },
        {
          "key": "Access-Control-Max-Age",
          "value": "86400"
        }
      ]
    }
  ]
}
```

## 🔐 Authentication & Authorization Security

### Current Security Features (Well Implemented)
✅ **Rate Limiting**: Comprehensive rate limiting system  
✅ **Session Security**: Fingerprinting and monitoring  
✅ **CSRF Protection**: Token-based CSRF protection  
✅ **MFA Support**: TOTP multi-factor authentication  
✅ **Enhanced Roles**: Granular permission system  

### Production Rate Limiting Configuration

```bash
# Stricter production settings
VITE_RATE_LIMIT_LOGIN_MAX_ATTEMPTS=3
VITE_RATE_LIMIT_LOGIN_WINDOW_MS=900000
VITE_RATE_LIMIT_LOGIN_BLOCK_DURATION_MS=3600000

VITE_RATE_LIMIT_SIGNUP_MAX_ATTEMPTS=2  
VITE_RATE_LIMIT_SIGNUP_WINDOW_MS=7200000
VITE_RATE_LIMIT_SIGNUP_BLOCK_DURATION_MS=7200000

# Account lockout (production)
VITE_RATE_LIMIT_ACCOUNT_LOCKOUT_THRESHOLD=5
VITE_RATE_LIMIT_ACCOUNT_LOCKOUT_DURATION_MS=172800000  # 48 hours

# Redis required for production
VITE_RATE_LIMIT_STORAGE_TYPE=redis
VITE_REDIS_URL=rediss://default:password@your-redis-host:port
```

## 🔍 Security Monitoring & Logging

### Error Tracking Setup

1. **Configure Sentry**:
```bash
npm install @sentry/react @sentry/tracing
```

2. **Initialize in `main.tsx`**:
```typescript
import * as Sentry from "@sentry/react";

if (import.meta.env.VITE_SENTRY_DSN && import.meta.env.VITE_APP_ENVIRONMENT === 'production') {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.VITE_APP_ENVIRONMENT,
    tracesSampleRate: 0.1,
    beforeSend(event) {
      // Filter out sensitive information
      return event;
    }
  });
}
```

### Security Event Monitoring

The application already includes comprehensive security logging:
- **Authentication Events**: Login/logout, failed attempts
- **Authorization Events**: Permission violations, role changes
- **Session Events**: Session creation, expiration, hijacking detection
- **Rate Limiting**: Rate limit violations, account lockouts

## 🗄️ Database Security

### Supabase Security Configuration

1. **Row Level Security (RLS)**:
   - Verify all tables have RLS enabled
   - Review and test all RLS policies
   - Ensure proper user isolation

2. **API Key Security**:
   - Use separate keys for development/production
   - Regularly rotate anon keys
   - Monitor API key usage

3. **Connection Security**:
   - Enable SSL enforcement
   - Configure connection pooling limits
   - Set up database monitoring

## 🌐 Third-Party Integration Security

### Stripe Security
- Use live publishable keys in production
- Configure webhook endpoint security
- Validate webhook signatures
- Monitor payment transactions

### Google OAuth Security  
- Configure authorized redirect URIs
- Use production client credentials
- Enable security monitoring
- Regular access token rotation

## 📋 Security Audit Checklist

### Pre-Deployment Security Audit

#### Code Security Review
- [ ] Remove all console.log statements
- [ ] Verify CSP headers implementation
- [ ] Check for hardcoded secrets
- [ ] Validate input sanitization
- [ ] Review error message exposure

#### Configuration Security
- [ ] Production environment variables configured
- [ ] Debug mode disabled in production
- [ ] CORS configured for production domain
- [ ] Security headers properly configured
- [ ] Rate limiting properly configured

#### Authentication & Authorization
- [ ] MFA enforced for admin accounts
- [ ] Session security properly configured
- [ ] Password policies enforced
- [ ] Account lockout mechanisms active
- [ ] Permission boundaries tested

#### Infrastructure Security
- [ ] SSL/TLS certificates configured
- [ ] Domain security properly configured
- [ ] CDN security headers configured
- [ ] Database security reviewed
- [ ] Backup security verified

#### Monitoring & Logging
- [ ] Security event logging active
- [ ] Error tracking configured
- [ ] Security alerting configured
- [ ] Log rotation and retention configured
- [ ] Incident response procedures documented

### Security Testing Requirements

#### Automated Security Testing
```bash
# Security audit
npm audit --audit-level moderate

# Dependency vulnerability scan
npm run security:scan

# OWASP ZAP security scan (configure for your domain)
npm run security:zap
```

#### Manual Security Testing
- [ ] **Authentication Testing**: Test login/logout, session management
- [ ] **Authorization Testing**: Verify role-based access controls
- [ ] **Input Validation**: Test XSS, SQL injection protection
- [ ] **CSRF Protection**: Verify CSRF token validation
- [ ] **Rate Limiting**: Test rate limiting effectiveness

## 🚨 Security Incident Response

### Incident Response Plan

1. **Detection**: Monitor security alerts and logs
2. **Assessment**: Determine severity and impact
3. **Containment**: Isolate affected systems
4. **Eradication**: Remove security threats
5. **Recovery**: Restore normal operations
6. **Lessons Learned**: Document and improve

### Emergency Contacts
- Security Team Lead: [Contact Info]
- Infrastructure Team: [Contact Info]
- Legal/Compliance: [Contact Info]

### Security Monitoring Dashboards
- **Real-time Security Events**: Monitor authentication failures, rate limiting
- **Error Tracking**: Monitor application errors and exceptions
- **Performance Impact**: Monitor security feature performance impact
- **Compliance Reporting**: Generate security compliance reports

## 📈 Security Metrics & KPIs

### Key Security Metrics
- **Authentication Success Rate**: > 99%
- **Failed Login Rate**: < 1%
- **Account Lockout Rate**: < 0.1%
- **Security Incident Count**: 0
- **Vulnerability Resolution Time**: < 24 hours

### Regular Security Reviews
- **Weekly**: Security log review, incident analysis
- **Monthly**: Vulnerability assessment, dependency audit
- **Quarterly**: Penetration testing, security architecture review
- **Annually**: Comprehensive security audit, compliance review

## ✅ Security Approval Checklist

**Security Team Sign-off Required**:
- [ ] All critical security issues resolved
- [ ] Security headers properly configured
- [ ] Authentication and authorization tested
- [ ] Security monitoring operational
- [ ] Incident response procedures in place
- [ ] Compliance requirements met

**Final Security Validation**:
- [ ] Penetration testing completed
- [ ] Security audit passed
- [ ] All security documentation complete
- [ ] Team trained on security procedures
- [ ] Security monitoring dashboards operational