# iPEC Coach Connect - Production Deployment Guide

## Overview
This guide provides step-by-step instructions for deploying the iPEC Coach Connect application to Vercel for production use.

## Prerequisites

### 1. Required Accounts
- [ ] Vercel account with team/pro plan (recommended for production)
- [ ] Supabase project (production database)
- [ ] Stripe account with live keys
- [ ] GitHub repository access

### 2. Required Information
- [ ] Production domain name
- [ ] Supabase production URL and anon key
- [ ] Stripe live publishable key
- [ ] SSL certificate (handled by Vercel)

## Pre-Deployment Checklist

### 1. Code Quality
```bash
# Run all quality checks
npm run lint
npm run typecheck
npm run test:unit
npm run test:e2e
```

### 2. Production Build Test
```bash
# Test production build locally
npm run build:production
npm run preview

# Verify build output
ls -la dist/
du -sh dist/
```

### 3. Security Review
- [ ] All console.log statements removed from production
- [ ] Environment variables properly configured
- [ ] CSP headers configured for production domains
- [ ] Authentication flows tested
- [ ] Payment integration tested in Stripe test mode

## Vercel Setup

### 1. Create Vercel Project
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Link project (run from project root)
vercel link
```

### 2. Configure Environment Variables

**In Vercel Dashboard:**
1. Go to Settings → Environment Variables
2. Add the following variables for **Production** environment:

#### Required Variables
```
VITE_SUPABASE_URL = https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY = your_production_anon_key
VITE_STRIPE_PUBLISHABLE_KEY = pk_live_your_stripe_key
NODE_ENV = production
VITE_APP_ENV = production
```

#### Optional Variables
```
VITE_APP_URL = https://your-production-domain.com
VITE_ENABLE_ANALYTICS = true
VITE_ENABLE_ERROR_REPORTING = true
VITE_ENABLE_PERFORMANCE_MONITORING = true
VITE_DEBUG = false
VITE_LOG_LEVEL = error
```

### 3. Configure Custom Domain
1. Go to Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed by Vercel
4. Wait for SSL certificate provisioning

## Deployment Process

### 1. Preview Deployment
```bash
# Deploy to preview URL for testing
npm run deploy:preview
```

### 2. Production Deployment
```bash
# Deploy to production
npm run deploy:production
```

### 3. Verify Deployment
- [ ] Application loads correctly
- [ ] Authentication works
- [ ] Database connections established
- [ ] Payment flow functional (test with small amount)
- [ ] All routes accessible
- [ ] Performance metrics acceptable

## Post-Deployment Configuration

### 1. Configure Supabase
Update Supabase settings:
- Add production URL to allowed origins
- Configure RLS policies for production
- Set up production database backups
- Configure email templates for production domain

### 2. Configure Stripe
- Switch to live mode
- Add production webhook endpoint
- Test payment flows
- Set up monitoring and alerts

### 3. Performance Monitoring
```bash
# Check Core Web Vitals
npm run test:performance

# Monitor bundle size
npm run bundle:size
```

## Production Health Checks

### 1. Automated Checks
```bash
# Run health check script
npm run health-check
```

### 2. Manual Verification
- [ ] Page load times < 3 seconds
- [ ] All critical user flows working
- [ ] Error rates < 0.1%
- [ ] Security headers present
- [ ] SSL certificate valid

## Monitoring and Maintenance

### 1. Set Up Monitoring
- [ ] Configure Vercel Analytics
- [ ] Set up uptime monitoring
- [ ] Configure error alerting
- [ ] Monitor performance metrics

### 2. Regular Maintenance
- [ ] Weekly dependency updates
- [ ] Monthly security scans
- [ ] Quarterly performance reviews
- [ ] Database maintenance

## Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clear cache and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build:production
```

#### Environment Variable Issues
- Check Vercel dashboard environment variables
- Ensure variables are set for correct environment (Production)
- Verify variable names match exactly (case sensitive)

#### Performance Issues
```bash
# Analyze bundle size
npm run bundle:analyze

# Check for console.log statements
grep -r "console\." src/ --exclude-dir=node_modules
```

#### Security Header Issues
- Verify CSP policies in vercel.json
- Check browser developer tools for CSP violations
- Ensure all external domains are whitelisted

## Rollback Procedure

### 1. Quick Rollback
```bash
# Rollback to previous deployment
vercel --prod --rollback
```

### 2. Manual Rollback
1. Go to Vercel Dashboard
2. Select Deployments tab
3. Find last known good deployment
4. Click \"Promote to Production\"

## Support and Resources

### Documentation
- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Stripe Documentation](https://stripe.com/docs)

### Emergency Contacts
- Development Team: [your-team@email.com]
- DevOps: [devops@email.com]
- Vercel Support: [vercel.com/support]

## Security Considerations

### 1. Environment Variables
- Never commit .env files to version control
- Use Vercel's environment variable encryption
- Rotate keys regularly
- Use different keys for staging/production

### 2. CSP Configuration
The production CSP is configured to:
- Block inline scripts (except for necessary ones)
- Allow connections only to trusted domains
- Prevent clickjacking attacks
- Disable dangerous features

### 3. HTTPS/HSTS
- All traffic redirected to HTTPS
- HSTS headers prevent downgrade attacks
- SSL certificates auto-renewed by Vercel

## Performance Optimization

### 1. Bundle Optimization
- Chunks optimized to prevent empty files
- Critical resources prioritized
- Lazy loading implemented for non-critical code

### 2. Caching Strategy
- Static assets cached for 1 year
- HTML cached for 24 hours
- API responses cached appropriately

### 3. CDN Configuration
- Global edge network via Vercel
- Assets served from closest location
- Automatic compression (gzip/brotli)

## Final Checklist

Before going live:
- [ ] All environment variables configured
- [ ] Custom domain configured and SSL active
- [ ] Database migrations run on production
- [ ] Payment processing tested
- [ ] Monitoring and alerting set up
- [ ] Team notified of go-live
- [ ] Rollback procedure tested
- [ ] Documentation updated

---

**Last Updated:** $(date)
**Version:** 1.0.0
**Maintained by:** Development Team