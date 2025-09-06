# Vercel Deployment Guide for iPEC Coach Connect

## Project Configuration
- **Project ID**: `prj_1AFX76fPmjT6rkb5C6mLjuueI2Qo`
- **GitHub Repository**: https://github.com/pbmagnet4/iPEC-Coach-Connect
- **Framework**: Vite + React + TypeScript

## Required Environment Variables

### 1. In Vercel Dashboard → Project Settings → Environment Variables

Set these as **Production** environment variables:

#### Supabase Configuration (REQUIRED)
```
Name: VITE_SUPABASE_URL
Value: https://lqzzlnnzkedugafbqvhv.supabase.co
Environment: Production, Preview, Development
```

```
Name: VITE_SUPABASE_ANON_KEY  
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxxenpsbm56a2VkdWdhZmJxdmh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzUwNTEsImV4cCI6MjA3Mjc1MTA1MX0.-QGVGpa7u0Lyf4HyrFtWEtIfw2Tg-d6gZw2YEnf8bY4
Environment: Production, Preview, Development
```

#### Stripe Configuration (when ready)
```
Name: VITE_STRIPE_PUBLISHABLE_KEY
Value: pk_live_your_actual_stripe_key (replace with your key)
Environment: Production
```

```
Name: VITE_STRIPE_PUBLISHABLE_KEY
Value: pk_test_your_test_stripe_key (replace with test key)
Environment: Preview, Development
```

### 2. Additional Configuration Variables

#### Application Settings
```
Name: NODE_ENV
Value: production
Environment: Production
```

```
Name: VITE_APP_ENV
Value: production
Environment: Production
```

#### Performance Optimizations
```
Name: VITE_BUILD_SOURCEMAP
Value: false
Environment: Production
```

```
Name: VITE_BUILD_MINIFY
Value: true
Environment: Production
```

#### Feature Flags
```
Name: VITE_ENABLE_ANALYTICS
Value: true
Environment: Production
```

```
Name: VITE_ENABLE_PERFORMANCE_MONITORING
Value: true
Environment: Production
```

## Deployment Steps

### Step 1: Connect to Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import from GitHub: `pbmagnet4/iPEC-Coach-Connect`
4. Vercel will detect it as a Vite project automatically

### Step 2: Configure Build Settings
These should be automatically detected from `vercel.json`:
- **Framework Preset**: Vite
- **Build Command**: `npm run build:production`
- **Output Directory**: `dist`
- **Install Command**: `npm ci`

### Step 3: Set Environment Variables
1. Go to Project Settings → Environment Variables
2. Add all the variables listed above
3. Make sure to set the correct environment scope (Production/Preview/Development)

### Step 4: Deploy
1. Click "Deploy" or push to main branch
2. Vercel will automatically build and deploy
3. Check deployment logs for any issues

## Build Commands

The project includes these build scripts in `package.json`:

```json
{
  "build": "vite build",
  "build:production": "NODE_ENV=production vite build",
  "preview": "vite preview"
}
```

## Domain Configuration

### Default Vercel Domain
Your app will be available at: `https://i-pec-coach-connect.vercel.app`

### Custom Domain (Optional)
1. Go to Project Settings → Domains
2. Add your custom domain
3. Configure DNS according to Vercel's instructions

## Security Headers

The `vercel.json` includes comprehensive security headers:
- Content Security Policy (CSP)
- Strict Transport Security (HSTS)
- X-Frame-Options
- X-Content-Type-Options
- Referrer Policy
- Permissions Policy

## Monitoring & Analytics

### Built-in Vercel Analytics
- Go to Project → Analytics tab
- Enable Web Vitals monitoring
- Monitor Core Web Vitals performance

### Custom Analytics
If you want to add Google Analytics or other services:
1. Add the tracking ID as an environment variable
2. Configure in your React application
3. Ensure CSP headers allow the analytics domain

## Troubleshooting

### Common Issues:

#### Build Failures
- Check environment variables are set correctly
- Verify all dependencies are in package.json
- Check build logs in Vercel dashboard

#### Runtime Errors
- Check browser console for errors
- Verify Supabase connection in network tab
- Check environment variables are available at runtime

#### Performance Issues
- Enable Web Vitals monitoring
- Check bundle size in build logs
- Use Vercel's built-in performance insights

## Database Setup

### Supabase Migrations
Before deployment, ensure your Supabase database is set up:

```bash
# Run locally first to test
npx supabase migration up

# Or manually run each migration in Supabase Dashboard
```

### Required Tables
The application expects these tables to exist:
- user_profiles
- coaches
- bookings
- community_posts
- (see migration files for complete schema)

## Support & Maintenance

### Monitoring
- Set up Vercel alerts for deployment failures
- Monitor Web Vitals and Core Performance metrics
- Check error rates in Vercel Functions (if using)

### Updates
- All updates push automatically from GitHub main branch
- Use preview deployments for testing branches
- Roll back through Vercel dashboard if needed

---

## Quick Deploy Checklist

- [ ] GitHub repository connected
- [ ] Vercel project created with ID: `prj_1AFX76fPmjT6rkb5C6mLjuueI2Qo`
- [ ] Environment variables configured
- [ ] Supabase database set up with migrations
- [ ] First deployment successful
- [ ] Custom domain configured (optional)
- [ ] Analytics and monitoring enabled
- [ ] Security headers verified

For questions or issues, check the Vercel deployment logs and Supabase dashboard.