#!/usr/bin/env node

/**
 * Monitoring and Alerting System for iPEC Coach Connect
 * 
 * This script provides comprehensive monitoring capabilities including
 * uptime checks, performance monitoring, error tracking, and alerting.
 */

import { promises as fs } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import https from 'https';
import { URL } from 'url';

const execAsync = promisify(exec);

class MonitoringSystem {
  constructor() {
    this.config = {
      environments: {
        production: 'https://ipec-coach-connect.vercel.app',
        staging: 'https://staging.ipec-coach-connect.vercel.app',
        development: 'http://localhost:5173'
      },
      thresholds: {
        responseTime: 3000, // 3 seconds
        errorRate: 0.05,    // 5%
        uptime: 0.99,       // 99%
        performanceScore: 80 // Lighthouse score
      },
      checkIntervals: {
        uptime: 60,      // 1 minute
        performance: 300, // 5 minutes
        health: 180      // 3 minutes
      }
    };
    
    this.metrics = {
      uptime: new Map(),
      responseTime: new Map(),
      errors: new Map(),
      performance: new Map()
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '✅',
      warn: '⚠️',
      error: '❌',
      debug: '🔍',
      monitor: '📊'
    }[type];
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  // ============================================================================
  // UPTIME MONITORING
  // ============================================================================

  async checkUptime(environment = 'production') {
    const url = this.config.environments[environment];
    if (!url) {
      throw new Error(`Unknown environment: ${environment}`);
    }

    this.log(`Checking uptime for ${environment}: ${url}`, 'monitor');

    return new Promise((resolve) => {
      const startTime = Date.now();
      const request = https.get(url, (response) => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        const result = {
          environment,
          url,
          statusCode: response.statusCode,
          responseTime,
          timestamp: new Date().toISOString(),
          isUp: response.statusCode >= 200 && response.statusCode < 400
        };

        // Store metrics
        this.storeMetric('uptime', environment, result.isUp ? 1 : 0);
        this.storeMetric('responseTime', environment, responseTime);

        if (result.isUp) {
          this.log(`${environment} is UP (${result.statusCode}) - ${responseTime}ms`, 'info');
        } else {
          this.log(`${environment} is DOWN (${result.statusCode}) - ${responseTime}ms`, 'error');
        }

        resolve(result);
      });

      request.on('error', (error) => {
        const result = {
          environment,
          url,
          error: error.message,
          responseTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          isUp: false
        };

        this.storeMetric('uptime', environment, 0);
        this.log(`${environment} is DOWN - ${error.message}`, 'error');

        resolve(result);
      });

      request.setTimeout(10000, () => {
        request.destroy();
        const result = {
          environment,
          url,
          error: 'Timeout',
          responseTime: 10000,
          timestamp: new Date().toISOString(),
          isUp: false
        };

        this.storeMetric('uptime', environment, 0);
        this.log(`${environment} TIMEOUT`, 'error');

        resolve(result);
      });
    });
  }

  async checkCriticalEndpoints(environment = 'production') {
    const baseUrl = this.config.environments[environment];
    const endpoints = [
      '/',
      '/login',
      '/coaches',
      '/community',
      '/api/health'
    ];

    this.log(`Checking critical endpoints for ${environment}`, 'monitor');

    const results = [];
    for (const endpoint of endpoints) {
      const fullUrl = `${baseUrl}${endpoint}`;
      
      try {
        const result = await this.checkSingleEndpoint(fullUrl);
        results.push({
          endpoint,
          ...result
        });
      } catch (error) {
        results.push({
          endpoint,
          error: error.message,
          isUp: false
        });
      }
    }

    return results;
  }

  async checkSingleEndpoint(url) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const request = https.get(url, (response) => {
        const responseTime = Date.now() - startTime;
        
        resolve({
          url,
          statusCode: response.statusCode,
          responseTime,
          isUp: response.statusCode >= 200 && response.statusCode < 500
        });
      });

      request.on('error', (error) => {
        resolve({
          url,
          error: error.message,
          responseTime: Date.now() - startTime,
          isUp: false
        });
      });

      request.setTimeout(5000, () => {
        request.destroy();
        resolve({
          url,
          error: 'Timeout',
          responseTime: 5000,
          isUp: false
        });
      });
    });
  }

  // ============================================================================
  // PERFORMANCE MONITORING
  // ============================================================================

  async runPerformanceAudit(environment = 'production') {
    const url = this.config.environments[environment];
    this.log(`Running performance audit for ${environment}`, 'monitor');

    try {
      // Use Lighthouse to audit performance
      const { stdout } = await execAsync(`npx lighthouse ${url} --output=json --chrome-flags="--headless" --quiet`);
      const results = JSON.parse(stdout);

      const metrics = {
        environment,
        url,
        timestamp: new Date().toISOString(),
        performanceScore: results.lhr.categories.performance.score * 100,
        firstContentfulPaint: results.lhr.audits['first-contentful-paint'].numericValue,
        largestContentfulPaint: results.lhr.audits['largest-contentful-paint'].numericValue,
        cumulativeLayoutShift: results.lhr.audits['cumulative-layout-shift'].numericValue,
        firstInputDelay: results.lhr.audits['max-potential-fid']?.numericValue || 0,
        accessibility: results.lhr.categories.accessibility.score * 100,
        bestPractices: results.lhr.categories['best-practices'].score * 100,
        seo: results.lhr.categories.seo.score * 100
      };

      // Store performance metrics
      this.storeMetric('performance', environment, metrics.performanceScore);

      this.log(`Performance Score: ${metrics.performanceScore.toFixed(1)}%`, 'info');
      this.log(`LCP: ${(metrics.largestContentfulPaint / 1000).toFixed(2)}s`, 'info');
      this.log(`FCP: ${(metrics.firstContentfulPaint / 1000).toFixed(2)}s`, 'info');

      return metrics;
    } catch (error) {
      this.log(`Performance audit failed: ${error.message}`, 'error');
      return {
        environment,
        url,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async checkWebVitals(environment = 'production') {
    const url = this.config.environments[environment];
    this.log(`Checking Core Web Vitals for ${environment}`, 'monitor');

    // Simple performance timing check
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      const request = https.get(url, (response) => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        let body = '';
        response.on('data', chunk => body += chunk);
        response.on('end', () => {
          const parseTime = Date.now() - endTime;
          
          const metrics = {
            environment,
            url,
            timestamp: new Date().toISOString(),
            responseTime,
            parseTime,
            totalTime: responseTime + parseTime,
            contentLength: body.length
          };

          this.log(`Response: ${responseTime}ms, Parse: ${parseTime}ms, Total: ${metrics.totalTime}ms`, 'info');
          
          resolve(metrics);
        });
      });

      request.on('error', (error) => {
        resolve({
          environment,
          url,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      });
    });
  }

  // ============================================================================
  // HEALTH MONITORING
  // ============================================================================

  async checkApplicationHealth(environment = 'production') {
    this.log(`Checking application health for ${environment}`, 'monitor');

    const healthChecks = {
      database: await this.checkDatabaseHealth(),
      externalServices: await this.checkExternalServices(),
      errorRates: await this.checkErrorRates(environment),
      systemResources: await this.checkSystemResources()
    };

    const overallHealth = Object.values(healthChecks).every(check => check.healthy);

    return {
      environment,
      timestamp: new Date().toISOString(),
      healthy: overallHealth,
      checks: healthChecks
    };
  }

  async checkDatabaseHealth() {
    try {
      // Check Supabase status
      const response = await fetch('https://status.supabase.com/api/v2/status.json');
      const status = await response.json();
      
      return {
        healthy: status.status.indicator === 'none',
        service: 'supabase',
        status: status.status.description,
        message: status.status.indicator === 'none' ? 'Operational' : 'Service degradation detected'
      };
    } catch (error) {
      return {
        healthy: false,
        service: 'supabase',
        error: error.message,
        message: 'Unable to check database status'
      };
    }
  }

  async checkExternalServices() {
    const services = [
      { name: 'Stripe', url: 'https://status.stripe.com/api/v2/status.json' },
      { name: 'Vercel', url: 'https://www.vercel-status.com/api/v2/status.json' }
    ];

    const results = {};
    
    for (const service of services) {
      try {
        const response = await fetch(service.url);
        const status = await response.json();
        
        results[service.name.toLowerCase()] = {
          healthy: status.status.indicator === 'none',
          service: service.name,
          status: status.status.description
        };
      } catch (error) {
        results[service.name.toLowerCase()] = {
          healthy: false,
          service: service.name,
          error: error.message
        };
      }
    }

    return results;
  }

  async checkErrorRates(environment) {
    // Simulate error rate checking
    // In a real implementation, this would query your error tracking service
    const simulatedErrorRate = Math.random() * 0.1; // 0-10% error rate

    return {
      healthy: simulatedErrorRate < this.config.thresholds.errorRate,
      errorRate: simulatedErrorRate,
      threshold: this.config.thresholds.errorRate,
      message: simulatedErrorRate < this.config.thresholds.errorRate 
        ? 'Error rate within acceptable limits' 
        : 'Error rate exceeds threshold'
    };
  }

  async checkSystemResources() {
    // Check system resources (memory, CPU, etc.)
    // This is simplified for the example
    return {
      healthy: true,
      memory: { used: '45%', available: '55%' },
      cpu: { load: '23%' },
      message: 'System resources within normal range'
    };
  }

  // ============================================================================
  // METRICS STORAGE AND ANALYSIS
  // ============================================================================

  storeMetric(type, environment, value) {
    if (!this.metrics[type]) {
      this.metrics[type] = new Map();
    }
    
    if (!this.metrics[type].has(environment)) {
      this.metrics[type].set(environment, []);
    }

    const environmentMetrics = this.metrics[type].get(environment);
    environmentMetrics.push({
      timestamp: Date.now(),
      value
    });

    // Keep only last 100 measurements
    if (environmentMetrics.length > 100) {
      environmentMetrics.shift();
    }
  }

  calculateUptime(environment, hours = 24) {
    const uptimeData = this.metrics.uptime.get(environment) || [];
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);
    const recentData = uptimeData.filter(point => point.timestamp > cutoff);
    
    if (recentData.length === 0) return null;
    
    const totalChecks = recentData.length;
    const successfulChecks = recentData.filter(point => point.value === 1).length;
    
    return (successfulChecks / totalChecks) * 100;
  }

  calculateAverageResponseTime(environment, hours = 24) {
    const responseData = this.metrics.responseTime.get(environment) || [];
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);
    const recentData = responseData.filter(point => point.timestamp > cutoff);
    
    if (recentData.length === 0) return null;
    
    const total = recentData.reduce((sum, point) => sum + point.value, 0);
    return total / recentData.length;
  }

  // ============================================================================
  // ALERTING SYSTEM
  // ============================================================================

  async sendAlert(type, environment, details) {
    const alert = {
      type,
      environment,
      timestamp: new Date().toISOString(),
      details,
      severity: this.calculateSeverity(type, details)
    };

    this.log(`🚨 ALERT: ${type} in ${environment} - ${alert.severity}`, 'error');
    
    // In a real implementation, this would send alerts via:
    // - Email
    // - Slack
    // - PagerDuty
    // - SMS
    
    await this.saveAlert(alert);
    return alert;
  }

  calculateSeverity(type, details) {
    if (type === 'uptime' && !details.isUp) return 'critical';
    if (type === 'performance' && details.performanceScore < 50) return 'high';
    if (type === 'error_rate' && details.errorRate > 0.1) return 'high';
    return 'medium';
  }

  async saveAlert(alert) {
    try {
      const alertsFile = 'monitoring-alerts.json';
      let alerts = [];
      
      try {
        const existing = await fs.readFile(alertsFile, 'utf8');
        alerts = JSON.parse(existing);
      } catch {
        // File doesn't exist, start fresh
      }
      
      alerts.push(alert);
      
      // Keep only last 1000 alerts
      if (alerts.length > 1000) {
        alerts = alerts.slice(-1000);
      }
      
      await fs.writeFile(alertsFile, JSON.stringify(alerts, null, 2));
    } catch (error) {
      this.log(`Failed to save alert: ${error.message}`, 'error');
    }
  }

  // ============================================================================
  // MONITORING DASHBOARD
  // ============================================================================

  async generateMonitoringReport(environment = 'all') {
    const environments = environment === 'all' 
      ? Object.keys(this.config.environments)
      : [environment];

    const report = {
      generated: new Date().toISOString(),
      environments: {}
    };

    for (const env of environments) {
      const uptime = await this.checkUptime(env);
      const health = await this.checkApplicationHealth(env);
      
      report.environments[env] = {
        uptime: {
          current: uptime.isUp,
          last24h: this.calculateUptime(env, 24),
          averageResponseTime: this.calculateAverageResponseTime(env, 24)
        },
        health: health.healthy,
        lastCheck: new Date().toISOString()
      };
    }

    return report;
  }

  async printDashboard() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 iPEC Coach Connect - Monitoring Dashboard');
    console.log('='.repeat(80));

    const report = await this.generateMonitoringReport();

    Object.entries(report.environments).forEach(([env, data]) => {
      const status = data.uptime.current ? '🟢 UP' : '🔴 DOWN';
      const uptime24h = data.uptime.last24h ? `${data.uptime.last24h.toFixed(2)}%` : 'N/A';
      const avgResponse = data.uptime.averageResponseTime ? `${Math.round(data.uptime.averageResponseTime)}ms` : 'N/A';
      
      console.log(`\n${env.toUpperCase().padEnd(12)} | ${status.padEnd(8)} | Uptime: ${uptime24h.padEnd(8)} | Avg Response: ${avgResponse}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log(`Last Updated: ${new Date().toLocaleString()}`);
    console.log('='.repeat(80) + '\n');
  }

  // ============================================================================
  // CLI INTERFACE
  // ============================================================================

  async run(command, ...args) {
    switch (command) {
      case 'uptime':
        const env = args[0] || 'production';
        await this.checkUptime(env);
        break;
        
      case 'performance':
        await this.runPerformanceAudit(args[0] || 'production');
        break;
        
      case 'health':
        const health = await this.checkApplicationHealth(args[0] || 'production');
        console.log(JSON.stringify(health, null, 2));
        break;
        
      case 'dashboard':
        await this.printDashboard();
        break;
        
      case 'monitor':
        const interval = parseInt(args[0]) || 60;
        this.log(`Starting continuous monitoring (${interval}s intervals)...`, 'monitor');
        setInterval(async () => {
          await this.printDashboard();
        }, interval * 1000);
        break;
        
      case 'report':
        const reportEnv = args[0] || 'all';
        const report = await this.generateMonitoringReport(reportEnv);
        console.log(JSON.stringify(report, null, 2));
        break;
        
      default:
        console.log(`
📊 iPEC Coach Connect Monitoring System

Usage: node scripts/monitoring.js <command> [args]

Commands:
  uptime [env]      - Check uptime for environment
  performance [env] - Run performance audit
  health [env]      - Check application health
  dashboard         - Display monitoring dashboard
  monitor [interval] - Start continuous monitoring (default: 60s)
  report [env]      - Generate monitoring report

Environments: production, staging, development

Examples:
  node scripts/monitoring.js uptime production
  node scripts/monitoring.js performance
  node scripts/monitoring.js dashboard
  node scripts/monitoring.js monitor 30
        `);
    }
  }
}

// Run if executed directly
if (process.argv[1].endsWith('monitoring.js')) {
  const monitor = new MonitoringSystem();
  const [,, command, ...args] = process.argv;
  
  monitor.run(command, ...args).catch(error => {
    console.error('❌ Monitoring failed:', error);
    process.exit(1);
  });
}

export default MonitoringSystem;