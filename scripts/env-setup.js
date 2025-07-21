#!/usr/bin/env node

/**
 * Environment Setup Script for iPEC Coach Connect
 * 
 * This script helps manage environment configurations across
 * development, staging, and production environments.
 */

import { promises as fs } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

class EnvironmentManager {
  constructor() {
    this.environments = {
      development: {
        name: 'Development',
        suffix: '.local',
        description: 'Local development environment'
      },
      staging: {
        name: 'Staging',
        suffix: '.staging',
        description: 'Pre-production testing environment'
      },
      production: {
        name: 'Production',
        suffix: '.production',
        description: 'Live production environment'
      }
    };
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

  async createEnvironmentFile(environment) {
    const envConfig = this.environments[environment];
    if (!envConfig) {
      throw new Error(`Unknown environment: ${environment}`);
    }

    const filename = `.env${envConfig.suffix}`;
    
    // Check if file already exists
    try {
      await fs.access(filename);
      this.log(`Environment file ${filename} already exists`, 'warn');
      return false;
    } catch {
      // File doesn't exist, create it
    }

    const template = await this.getEnvironmentTemplate(environment);
    await fs.writeFile(filename, template);
    
    this.log(`Created ${filename} for ${envConfig.description}`);
    return true;
  }

  async getEnvironmentTemplate(environment) {
    const baseTemplate = await fs.readFile('.env.example', 'utf8');
    
    const environmentSpecific = {
      development: {
        'VITE_APP_ENVIRONMENT': 'development',
        'VITE_ENABLE_DEBUG_MODE': 'true',
        'VITE_API_BASE_URL': 'http://localhost:3000',
        'VITE_CORS_ORIGIN': 'http://localhost:5173'
      },
      staging: {
        'VITE_APP_ENVIRONMENT': 'staging',
        'VITE_ENABLE_DEBUG_MODE': 'false',
        'VITE_API_BASE_URL': 'https://staging-api.ipec-coach-connect.com',
        'VITE_CORS_ORIGIN': 'https://staging.ipec-coach-connect.com'
      },
      production: {
        'VITE_APP_ENVIRONMENT': 'production',
        'VITE_ENABLE_DEBUG_MODE': 'false',
        'VITE_API_BASE_URL': 'https://api.ipec-coach-connect.com',
        'VITE_CORS_ORIGIN': 'https://ipec-coach-connect.com'
      }
    };

    let template = baseTemplate;
    const config = environmentSpecific[environment];
    
    // Replace template values with environment-specific ones
    Object.entries(config).forEach(([key, value]) => {
      const regex = new RegExp(`^${key}=.*$`, 'gm');
      template = template.replace(regex, `${key}=${value}`);
    });

    return template;
  }

  async validateEnvironment(environment) {
    const envConfig = this.environments[environment];
    const filename = `.env${envConfig.suffix}`;
    
    try {
      const content = await fs.readFile(filename, 'utf8');
      const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));
      
      const requiredVars = [
        'VITE_SUPABASE_URL',
        'VITE_SUPABASE_ANON_KEY',
        'VITE_APP_ENVIRONMENT'
      ];

      const missingVars = [];
      
      for (const varName of requiredVars) {
        const found = lines.some(line => line.startsWith(`${varName}=`) && line.split('=')[1].trim());
        if (!found) {
          missingVars.push(varName);
        }
      }

      if (missingVars.length > 0) {
        this.log(`Missing variables in ${filename}: ${missingVars.join(', ')}`, 'error');
        return false;
      }

      this.log(`Environment ${filename} is valid`);
      return true;
    } catch (error) {
      this.log(`Cannot read ${filename}: ${error.message}`, 'error');
      return false;
    }
  }

  async setupAll() {
    this.log('Setting up all environments...');
    
    for (const [env, config] of Object.entries(this.environments)) {
      try {
        await this.createEnvironmentFile(env);
        await this.validateEnvironment(env);
      } catch (error) {
        this.log(`Failed to setup ${env}: ${error.message}`, 'error');
      }
    }
  }

  async copyEnvironment(source, target) {
    const sourceFile = `.env${this.environments[source]?.suffix || source}`;
    const targetFile = `.env${this.environments[target]?.suffix || target}`;
    
    try {
      const content = await fs.readFile(sourceFile, 'utf8');
      await fs.writeFile(targetFile, content);
      this.log(`Copied ${sourceFile} to ${targetFile}`);
    } catch (error) {
      this.log(`Failed to copy environment: ${error.message}`, 'error');
    }
  }

  async listEnvironments() {
    console.log('\n🌍 Available Environments:');
    console.log('=' .repeat(50));
    
    for (const [env, config] of Object.entries(this.environments)) {
      const filename = `.env${config.suffix}`;
      let status = '❌ Not Found';
      
      try {
        await fs.access(filename);
        const isValid = await this.validateEnvironment(env);
        status = isValid ? '✅ Valid' : '⚠️  Invalid';
      } catch {
        // File doesn't exist
      }
      
      console.log(`${env.padEnd(12)} | ${filename.padEnd(20)} | ${status}`);
      console.log(`             | ${config.description}`);
      console.log('');
    }
  }

  async run(command, ...args) {
    switch (command) {
      case 'setup':
        if (args[0]) {
          await this.createEnvironmentFile(args[0]);
          await this.validateEnvironment(args[0]);
        } else {
          await this.setupAll();
        }
        break;
        
      case 'validate':
        if (args[0]) {
          await this.validateEnvironment(args[0]);
        } else {
          for (const env of Object.keys(this.environments)) {
            await this.validateEnvironment(env);
          }
        }
        break;
        
      case 'copy':
        if (args[0] && args[1]) {
          await this.copyEnvironment(args[0], args[1]);
        } else {
          this.log('Usage: copy <source> <target>', 'error');
        }
        break;
        
      case 'list':
        await this.listEnvironments();
        break;
        
      default:
        console.log(`
🌍 iPEC Coach Connect Environment Manager

Usage: node scripts/env-setup.js <command> [args]

Commands:
  setup [env]     - Setup environment files (all or specific)
  validate [env]  - Validate environment files (all or specific) 
  copy src dest   - Copy environment configuration
  list           - List all environments and their status

Environments: development, staging, production

Examples:
  node scripts/env-setup.js setup
  node scripts/env-setup.js validate production
  node scripts/env-setup.js copy development staging
  node scripts/env-setup.js list
        `);
    }
  }
}

// Run if executed directly
if (process.argv[1].endsWith('env-setup.js')) {
  const manager = new EnvironmentManager();
  const [,, command, ...args] = process.argv;
  
  manager.run(command, ...args).catch(error => {
    console.error('❌ Environment setup failed:', error);
    process.exit(1);
  });
}

export default EnvironmentManager;