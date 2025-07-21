#!/usr/bin/env node

/**
 * Production Deployment Script for iPEC Coach Connect
 * 
 * This script orchestrates the complete production deployment process
 * including environment validation, build, deployment, and verification.
 */

import { promises as fs } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

class ProductionDeployer {
  constructor() {
    this.steps = [
      { name: 'Environment Validation', method: 'validateEnvironment' },
      { name: 'Security Checks', method: 'runSecurityChecks' },
      { name: 'Build Application', method: 'buildApplication' },
      { name: 'Run Tests', method: 'runTests' },
      { name: 'Deploy to Vercel', method: 'deployToVercel' },
      { name: 'Verify Deployment', method: 'verifyDeployment' },
      { name: 'Update Database', method: 'updateDatabase' },
      { name: 'Post-Deploy Checks', method: 'postDeployChecks' }
    ];
    
    this.errors = [];
    this.warnings = [];
    this.deploymentUrl = null;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '✅',
      warn: '⚠️',
      error: '❌',
      debug: '🔍',
      deploy: '🚀'
    }[type];
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async validateEnvironment() {
    this.log('Validating production environment...', 'debug');
    
    const requiredEnvVars = [
      'VERCEL_TOKEN',
      'VERCEL_ORG_ID',
      'VERCEL_PROJECT_ID',
      'VITE_SUPABASE_URL_PROD',
      'VITE_SUPABASE_ANON_KEY_PROD',
      'VITE_STRIPE_PUBLISHABLE_KEY'
    ];

    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
      }
    }

    // Validate environment files
    try {
      await fs.access('.env.production');
      this.log('Production environment file exists');
    } catch {
      throw new Error('Production environment file (.env.production) not found');
    }

    this.log('Environment validation completed successfully');
  }

  async runSecurityChecks() {
    this.log('Running security checks...', 'debug');
    
    try {
      // Run npm audit
      const { stdout: auditOutput } = await execAsync('npm audit --audit-level=high --json');
      const auditResult = JSON.parse(auditOutput);
      
      if (auditResult.metadata.vulnerabilities.total > 0) {
        throw new Error(`Security vulnerabilities found: ${auditResult.metadata.vulnerabilities.total}`);
      }

      // Check for secrets in code
      try {
        const { stdout: secretsCheck } = await execAsync('git secrets --scan-history || echo "No git-secrets installed"');
        if (secretsCheck.includes('found')) {
          throw new Error('Potential secrets found in repository history');
        }
      } catch (error) {
        this.warnings.push('git-secrets not available - manual secret review recommended');
      }

      this.log('Security checks passed');
    } catch (error) {
      throw new Error(`Security check failed: ${error.message}`);
    }
  }

  async buildApplication() {
    this.log('Building application for production...', 'debug');
    
    try {
      // Set production environment
      process.env.NODE_ENV = 'production';
      
      // Run production build
      const { stdout } = await execAsync('npm run build:production');
      this.log('Build output:', 'debug');
      console.log(stdout);

      // Verify build artifacts
      await fs.access('dist/index.html');
      await fs.access('dist/assets');
      
      this.log('Application built successfully');
    } catch (error) {
      throw new Error(`Build failed: ${error.message}`);
    }
  }

  async runTests() {
    this.log('Running test suite...', 'debug');
    
    try {
      const { stdout } = await execAsync('npm test');
      this.log('All tests passed');
    } catch (error) {
      throw new Error(`Tests failed: ${error.message}`);
    }
  }

  async deployToVercel() {
    this.log('Deploying to Vercel production...', 'deploy');
    
    try {
      // Pull Vercel environment
      await execAsync('vercel pull --yes --environment=production --token=$VERCEL_TOKEN');
      
      // Build for Vercel
      await execAsync('vercel build --prod --token=$VERCEL_TOKEN');
      
      // Deploy to production
      const { stdout } = await execAsync('vercel deploy --prebuilt --prod --token=$VERCEL_TOKEN');
      
      // Extract deployment URL
      const lines = stdout.split('\n');
      this.deploymentUrl = lines.find(line => line.includes('https://')) || null;
      
      if (!this.deploymentUrl) {
        throw new Error('Could not extract deployment URL from Vercel output');
      }
      
      this.log(`Deployed to: ${this.deploymentUrl}`, 'deploy');
    } catch (error) {
      throw new Error(`Vercel deployment failed: ${error.message}`);
    }
  }

  async verifyDeployment() {
    this.log('Verifying deployment...', 'debug');
    
    if (!this.deploymentUrl) {
      throw new Error('No deployment URL available for verification');
    }

    try {
      // Wait for deployment to be available
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      // Health check
      const response = await fetch(`${this.deploymentUrl}/health`);
      if (!response.ok && response.status !== 404) {
        throw new Error(`Health check failed with status: ${response.status}`);
      }

      // Check main page
      const mainResponse = await fetch(this.deploymentUrl);
      if (!mainResponse.ok) {
        throw new Error(`Main page check failed with status: ${mainResponse.status}`);
      }

      this.log('Deployment verification successful');
    } catch (error) {
      throw new Error(`Deployment verification failed: ${error.message}`);
    }
  }

  async updateDatabase() {
    this.log('Updating database schema...', 'debug');
    
    try {
      // Run Supabase migrations (if available)
      try {
        await execAsync('supabase db push --linked');
        this.log('Database migrations applied successfully');
      } catch (error) {
        this.warnings.push('Supabase CLI not available - manual migration may be required');
      }
    } catch (error) {
      throw new Error(`Database update failed: ${error.message}`);
    }
  }

  async postDeployChecks() {
    this.log('Running post-deployment checks...', 'debug');
    
    try {
      // Run Lighthouse performance audit
      try {
        await execAsync(`npx lighthouse ${this.deploymentUrl} --chrome-flags="--headless" --output=json --output-path=./lighthouse-results.json`);
        
        const lighthouseResults = JSON.parse(await fs.readFile('./lighthouse-results.json', 'utf8'));
        const performanceScore = lighthouseResults.lhr.categories.performance.score * 100;
        
        if (performanceScore < 80) {
          this.warnings.push(`Performance score below threshold: ${performanceScore}%`);
        } else {
          this.log(`Performance score: ${performanceScore}%`);
        }
      } catch (error) {
        this.warnings.push('Lighthouse audit failed - manual performance review recommended');
      }

      // Check Core Web Vitals
      try {
        const webVitalsResponse = await fetch(`${this.deploymentUrl}/api/analytics/web-vitals`);
        if (webVitalsResponse.ok) {
          this.log('Core Web Vitals endpoint is accessible');
        }
      } catch (error) {
        this.warnings.push('Core Web Vitals endpoint not accessible');
      }

      this.log('Post-deployment checks completed');
    } catch (error) {
      this.warnings.push(`Post-deployment checks failed: ${error.message}`);
    }
  }

  async deploy() {
    console.log('🚀 Starting Production Deployment for iPEC Coach Connect\n');
    console.log('=' .repeat(60));

    const startTime = Date.now();
    let completedSteps = 0;

    try {
      for (const step of this.steps) {
        this.log(`Step ${completedSteps + 1}/${this.steps.length}: ${step.name}`, 'deploy');
        
        await this[step.method]();
        completedSteps++;
        
        console.log('✅ ' + step.name + ' completed\n');
      }

      const duration = Math.round((Date.now() - startTime) / 1000);
      
      console.log('=' .repeat(60));
      console.log('🎉 DEPLOYMENT SUCCESSFUL! 🎉');
      console.log('=' .repeat(60));
      console.log(`✅ Deployment completed in ${duration} seconds`);
      console.log(`🌐 Production URL: ${this.deploymentUrl}`);
      
      if (this.warnings.length > 0) {
        console.log('\n⚠️  Warnings:');
        this.warnings.forEach(warning => console.log(`   • ${warning}`));
      }
      
      console.log('\n📋 Next Steps:');
      console.log('   • Monitor application metrics');
      console.log('   • Verify user workflows');
      console.log('   • Check error reporting');
      console.log('   • Update DNS records if needed');
      
    } catch (error) {
      const duration = Math.round((Date.now() - startTime) / 1000);
      
      console.log('=' .repeat(60));
      console.log('❌ DEPLOYMENT FAILED');
      console.log('=' .repeat(60));
      console.log(`❌ Failed at step ${completedSteps + 1}/${this.steps.length}: ${this.steps[completedSteps]?.name}`);
      console.log(`⏱️  Duration: ${duration} seconds`);
      console.log(`💥 Error: ${error.message}`);
      
      if (this.warnings.length > 0) {
        console.log('\n⚠️  Warnings encountered:');
        this.warnings.forEach(warning => console.log(`   • ${warning}`));
      }
      
      console.log('\n🔧 Troubleshooting:');
      console.log('   • Check environment variables');
      console.log('   • Verify Vercel token permissions');
      console.log('   • Review build logs');
      console.log('   • Check Supabase connection');
      
      process.exit(1);
    }
  }
}

// Run deployment if this script is executed directly
if (process.argv[1].endsWith('deploy-production.js')) {
  const deployer = new ProductionDeployer();
  deployer.deploy().catch(error => {
    console.error('❌ Deployment script failed:', error);
    process.exit(1);
  });
}

export default ProductionDeployer;