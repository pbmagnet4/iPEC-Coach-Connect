#!/usr/bin/env node

/**
 * Security Utilities for iPEC Coach Connect
 * 
 * This script provides security-related utilities including secret validation,
 * environment security checks, and security configuration management.
 */

import { promises as fs } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import crypto from 'crypto';

const execAsync = promisify(exec);

class SecurityManager {
  constructor() {
    this.securityRules = {
      minSecretLength: 32,
      forbiddenPatterns: [
        /password\s*=\s*['"][^'"]{1,20}['"]/gi,
        /secret\s*=\s*['"][^'"]{1,20}['"]/gi,
        /api[_-]?key\s*=\s*['"][^'"]{1,30}['"]/gi,
        /token\s*=\s*['"][^'"]{1,30}['"]/gi
      ],
      allowedOrigins: {
        development: ['http://localhost:5173', 'http://127.0.0.1:5173'],
        staging: ['https://staging.ipec-coach-connect.com'],
        production: ['https://ipec-coach-connect.com']
      }
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '✅',
      warn: '⚠️',
      error: '❌',
      debug: '🔍',
      security: '🔒'
    }[type];
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  // ============================================================================
  // SECRET VALIDATION
  // ============================================================================

  async validateSecrets(environment = 'development') {
    this.log(`Validating secrets for ${environment} environment...`, 'security');
    
    const envFile = environment === 'development' ? '.env.local' : `.env.${environment}`;
    
    try {
      const content = await fs.readFile(envFile, 'utf8');
      const secrets = this.parseEnvFile(content);
      
      const issues = [];
      
      // Check secret strength
      Object.entries(secrets).forEach(([key, value]) => {
        if (this.isSensitiveKey(key)) {
          if (value.length < this.securityRules.minSecretLength) {
            issues.push(`Secret ${key} is too short (${value.length} chars, minimum ${this.securityRules.minSecretLength})`);
          }
          
          if (this.isWeakSecret(value)) {
            issues.push(`Secret ${key} appears to be weak or predictable`);
          }
        }
      });
      
      // Check for test/default values
      this.checkTestValues(secrets, issues);
      
      if (issues.length > 0) {
        this.log(`Found ${issues.length} security issues:`, 'error');
        issues.forEach(issue => console.log(`  ❌ ${issue}`));
        return false;
      }
      
      this.log(`All secrets validated successfully for ${environment}`, 'security');
      return true;
      
    } catch (error) {
      this.log(`Could not validate secrets: ${error.message}`, 'error');
      return false;
    }
  }

  parseEnvFile(content) {
    const secrets = {};
    const lines = content.split('\n');
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          secrets[key.trim()] = valueParts.join('=').trim().replace(/^['"]|['"]$/g, '');
        }
      }
    });
    
    return secrets;
  }

  isSensitiveKey(key) {
    const sensitivePatterns = [
      /key/i, /secret/i, /password/i, /token/i, /auth/i, /private/i
    ];
    return sensitivePatterns.some(pattern => pattern.test(key));
  }

  isWeakSecret(value) {
    // Check for common weak patterns
    const weakPatterns = [
      /^(test|example|demo|sample)/i,
      /^(123|abc|password|secret)/i,
      /(.)\1{4,}/, // Repeated characters
      /^[a-zA-Z]{1,10}$/, // Only letters, short
      /^[0-9]{1,10}$/ // Only numbers, short
    ];
    
    return weakPatterns.some(pattern => pattern.test(value));
  }

  checkTestValues(secrets, issues) {
    const testPatterns = {
      'VITE_SUPABASE_URL': /^https:\/\/.*\.supabase\.co$/,
      'VITE_SUPABASE_ANON_KEY': /^eyJ[A-Za-z0-9_-]+$/,
      'VITE_STRIPE_PUBLISHABLE_KEY': /^pk_(test|live)_[A-Za-z0-9]+$/
    };
    
    Object.entries(testPatterns).forEach(([key, pattern]) => {
      if (secrets[key] && !pattern.test(secrets[key])) {
        issues.push(`${key} does not match expected format`);
      }
    });
  }

  // ============================================================================
  // CODE SECURITY SCANNING
  // ============================================================================

  async scanCodeForSecrets() {
    this.log('Scanning codebase for potential secrets...', 'security');
    
    const issues = [];
    
    try {
      // Scan source files
      const sourceFiles = await this.getSourceFiles();
      
      for (const file of sourceFiles) {
        const content = await fs.readFile(file, 'utf8');
        const fileIssues = this.scanFileForSecrets(file, content);
        issues.push(...fileIssues);
      }
      
      if (issues.length > 0) {
        this.log(`Found ${issues.length} potential security issues:`, 'error');
        issues.forEach(issue => console.log(`  ❌ ${issue}`));
        return false;
      }
      
      this.log('No security issues found in codebase', 'security');
      return true;
      
    } catch (error) {
      this.log(`Code scanning failed: ${error.message}`, 'error');
      return false;
    }
  }

  async getSourceFiles() {
    const { stdout } = await execAsync('find src -type f \\( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \\)');
    return stdout.trim().split('\n').filter(Boolean);
  }

  scanFileForSecrets(file, content) {
    const issues = [];
    
    this.securityRules.forbiddenPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          issues.push(`Potential hardcoded secret in ${file}: ${match}`);
        });
      }
    });
    
    return issues;
  }

  // ============================================================================
  // SECURITY CONFIGURATION
  // ============================================================================

  async generateSecurityHeaders(environment = 'production') {
    this.log(`Generating security headers for ${environment}...`, 'security');
    
    const allowedOrigins = this.securityRules.allowedOrigins[environment] || [];
    
    const headers = {
      'Content-Security-Policy': this.generateCSP(environment),
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Access-Control-Allow-Origin': allowedOrigins[0] || '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Requested-With'
    };
    
    return headers;
  }

  generateCSP(environment) {
    const baseCSP = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
      "style-src 'self' 'unsafe-inline' https:",
      "img-src 'self' data: https:",
      "font-src 'self' https:",
      "connect-src 'self' https:",
      "media-src 'self' https:",
      "object-src 'none'",
      "base-uri 'self'"
    ];
    
    if (environment === 'development') {
      baseCSP[1] = "script-src 'self' 'unsafe-inline' 'unsafe-eval' http: https:";
    }
    
    return baseCSP.join('; ') + ';';
  }

  // ============================================================================
  // SECRET GENERATION
  // ============================================================================

  generateSecret(length = 64) {
    return crypto.randomBytes(length).toString('hex');
  }

  generateAPIKey(prefix = 'ipec') {
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(16).toString('hex');
    return `${prefix}_${timestamp}_${random}`;
  }

  generateJWTSecret() {
    return crypto.randomBytes(64).toString('base64');
  }

  // ============================================================================
  // SECURITY AUDIT
  // ============================================================================

  async runSecurityAudit() {
    this.log('Running comprehensive security audit...', 'security');
    
    const results = {
      secrets: await this.validateSecrets(),
      codebase: await this.scanCodeForSecrets(),
      dependencies: await this.auditDependencies(),
      configuration: await this.auditConfiguration()
    };
    
    const passed = Object.values(results).every(result => result === true);
    
    console.log('\n' + '='.repeat(60));
    console.log('🔒 Security Audit Results');
    console.log('='.repeat(60));
    
    Object.entries(results).forEach(([check, passed]) => {
      const status = passed ? '✅ PASS' : '❌ FAIL';
      console.log(`${check.padEnd(20)} | ${status}`);
    });
    
    console.log('='.repeat(60));
    
    if (passed) {
      console.log('🎉 All security checks passed!');
      process.exit(0);
    } else {
      console.log('🚨 Security issues found - please address before deployment');
      process.exit(1);
    }
  }

  async auditDependencies() {
    try {
      await execAsync('npm audit --audit-level=high');
      return true;
    } catch (error) {
      this.log('Dependency vulnerabilities found', 'error');
      return false;
    }
  }

  async auditConfiguration() {
    // Check for secure configuration files
    const requiredFiles = [
      '.gitignore',
      'vercel.json',
      'SECURITY.md'
    ];
    
    for (const file of requiredFiles) {
      try {
        await fs.access(file);
      } catch {
        this.log(`Missing security configuration file: ${file}`, 'error');
        return false;
      }
    }
    
    return true;
  }

  // ============================================================================
  // CLI INTERFACE
  // ============================================================================

  async run(command, ...args) {
    switch (command) {
      case 'validate':
        const env = args[0] || 'development';
        await this.validateSecrets(env);
        break;
        
      case 'scan':
        await this.scanCodeForSecrets();
        break;
        
      case 'generate':
        const type = args[0] || 'secret';
        const length = parseInt(args[1]) || 64;
        
        switch (type) {
          case 'secret':
            console.log(this.generateSecret(length));
            break;
          case 'api-key':
            console.log(this.generateAPIKey(args[1] || 'ipec'));
            break;
          case 'jwt':
            console.log(this.generateJWTSecret());
            break;
          default:
            console.log('Unknown generation type. Use: secret, api-key, jwt');
        }
        break;
        
      case 'audit':
        await this.runSecurityAudit();
        break;
        
      case 'headers':
        const environment = args[0] || 'production';
        const headers = await this.generateSecurityHeaders(environment);
        console.log(JSON.stringify(headers, null, 2));
        break;
        
      default:
        console.log(`
🔒 iPEC Coach Connect Security Utilities

Usage: node scripts/security-utils.js <command> [args]

Commands:
  validate [env]    - Validate secrets for environment (development, staging, production)
  scan             - Scan codebase for potential secrets
  generate <type>  - Generate secure secrets (secret, api-key, jwt)
  audit            - Run comprehensive security audit
  headers [env]    - Generate security headers for environment

Examples:
  node scripts/security-utils.js validate production
  node scripts/security-utils.js generate secret 64
  node scripts/security-utils.js audit
        `);
    }
  }
}

// Run if executed directly
if (process.argv[1].endsWith('security-utils.js')) {
  const manager = new SecurityManager();
  const [,, command, ...args] = process.argv;
  
  manager.run(command, ...args).catch(error => {
    console.error('❌ Security utility failed:', error);
    process.exit(1);
  });
}

export default SecurityManager;