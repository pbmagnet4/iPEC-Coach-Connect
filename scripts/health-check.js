#!/usr/bin/env node

/**
 * Health Check Script for iPEC Coach Connect
 * 
 * This script performs comprehensive health checks for the application
 * including environment validation, dependency checks, and service availability.
 */

import { promises as fs } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

class HealthChecker {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.passed = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '✅',
      warn: '⚠️',
      error: '❌',
      debug: '🔍'
    }[type];
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async checkEnvironment() {
    this.log('Checking environment configuration...', 'debug');
    
    const requiredEnvVars = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY'
    ];

    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        this.errors.push(`Missing required environment variable: ${envVar}`);
      } else {
        this.passed.push(`Environment variable ${envVar} is set`);
      }
    }
  }

  async checkDependencies() {
    this.log('Checking dependencies...', 'debug');
    
    try {
      const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
      this.passed.push('package.json is valid JSON');

      // Check if node_modules exists
      try {
        await fs.access('node_modules');
        this.passed.push('node_modules directory exists');
      } catch {
        this.errors.push('node_modules directory not found - run npm install');
      }

      // Check for security vulnerabilities
      try {
        const { stdout } = await execAsync('npm audit --audit-level=high --json');
        const auditResult = JSON.parse(stdout);
        if (auditResult.metadata.vulnerabilities.total > 0) {
          this.warnings.push(`Found ${auditResult.metadata.vulnerabilities.total} security vulnerabilities`);
        } else {
          this.passed.push('No high-severity security vulnerabilities found');
        }
      } catch (error) {
        this.warnings.push('Could not run security audit');
      }

    } catch (error) {
      this.errors.push('Cannot read or parse package.json');
    }
  }

  async checkBuild() {
    this.log('Checking build configuration...', 'debug');
    
    try {
      await fs.access('vite.config.ts');
      this.passed.push('Vite configuration file exists');
    } catch {
      this.errors.push('vite.config.ts not found');
    }

    try {
      await fs.access('tsconfig.json');
      this.passed.push('TypeScript configuration file exists');
    } catch {
      this.errors.push('tsconfig.json not found');
    }
  }

  async checkServices() {
    this.log('Checking external services...', 'debug');
    
    // Check Supabase connectivity
    if (process.env.VITE_SUPABASE_URL) {
      try {
        const response = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/`, {
          headers: {
            'apikey': process.env.VITE_SUPABASE_ANON_KEY || '',
            'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY || ''}`
          }
        });
        
        if (response.ok || response.status === 404) {
          this.passed.push('Supabase service is reachable');
        } else {
          this.warnings.push(`Supabase service returned status: ${response.status}`);
        }
      } catch (error) {
        this.errors.push(`Cannot reach Supabase service: ${error.message}`);
      }
    }
  }

  async checkFiles() {
    this.log('Checking critical files...', 'debug');
    
    const criticalFiles = [
      'src/main.tsx',
      'src/App.tsx',
      'index.html',
      'package.json'
    ];

    for (const file of criticalFiles) {
      try {
        await fs.access(file);
        this.passed.push(`Critical file ${file} exists`);
      } catch {
        this.errors.push(`Critical file ${file} is missing`);
      }
    }
  }

  printResults() {
    console.log('\n' + '='.repeat(60));
    console.log('🏥 iPEC Coach Connect Health Check Results');
    console.log('='.repeat(60));

    if (this.passed.length > 0) {
      console.log('\n✅ PASSED CHECKS:');
      this.passed.forEach(check => console.log(`  ✓ ${check}`));
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      this.warnings.forEach(warning => console.log(`  ⚠ ${warning}`));
    }

    if (this.errors.length > 0) {
      console.log('\n❌ FAILED CHECKS:');
      this.errors.forEach(error => console.log(`  ✗ ${error}`));
    }

    console.log('\n' + '='.repeat(60));
    console.log(`Summary: ${this.passed.length} passed, ${this.warnings.length} warnings, ${this.errors.length} errors`);
    
    if (this.errors.length === 0) {
      console.log('🎉 All critical health checks passed!');
      process.exit(0);
    } else {
      console.log('🚨 Critical issues found - deployment may fail');
      process.exit(1);
    }
  }

  async run() {
    console.log('🚀 Starting iPEC Coach Connect Health Check...\n');
    
    await this.checkEnvironment();
    await this.checkDependencies();
    await this.checkBuild();
    await this.checkServices();
    await this.checkFiles();
    
    this.printResults();
  }
}

// Run health check if this script is executed directly
if (process.argv[1].endsWith('health-check.js')) {
  const checker = new HealthChecker();
  checker.run().catch(error => {
    console.error('❌ Health check failed:', error);
    process.exit(1);
  });
}

export default HealthChecker;