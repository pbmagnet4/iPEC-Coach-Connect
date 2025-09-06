/**
 * Error Analytics Service
 * 
 * Tracks error patterns, user recovery success rates, and provides
 * insights for improving the error messaging system.
 */

import { logSecurity } from './secure-logger';
import type { ErrorContext, ErrorMessage } from './error-messages';

export interface ErrorAnalytics {
  errorCode: string;
  category: string;
  severity: string;
  userAgent: string;
  location: string;
  timestamp: Date;
  userId?: string;
  sessionId: string;
  recoveryAttempted: boolean;
  recoverySuccess: boolean;
  timeToResolve?: number;
  userFeedback?: {
    helpful: boolean;
    rating: number;
    comment?: string;
  };
  context?: {
    operation?: string;
    fieldName?: string;
    attemptCount?: number;
    browserInfo?: any;
    networkInfo?: any;
  };
}

export interface ErrorPattern {
  errorCode: string;
  frequency: number;
  successRate: number;
  avgTimeToResolve: number;
  commonContext: string[];
  userFeedbackAvg: number;
  lastOccurrence: Date;
  trending: 'up' | 'down' | 'stable';
}

export interface ErrorInsight {
  type: 'improvement' | 'warning' | 'success';
  title: string;
  description: string;
  actionable: boolean;
  data: any;
}

class ErrorAnalyticsService {
  private analytics: ErrorAnalytics[] = [];
  private readonly MAX_ANALYTICS_SIZE = 1000;
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.loadAnalytics();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Track an error occurrence
   */
  trackError(
    error: ErrorMessage,
    context?: ErrorContext,
    originalError?: any
  ): void {
    const analytics: ErrorAnalytics = {
      errorCode: this.extractErrorCode(originalError),
      category: error.category,
      severity: error.severity,
      userAgent: navigator.userAgent,
      location: window.location.pathname,
      timestamp: new Date(),
      userId: context?.userId,
      sessionId: this.sessionId,
      recoveryAttempted: false,
      recoverySuccess: false,
      context: {
        operation: context?.operation,
        fieldName: context?.fieldName,
        attemptCount: context?.attemptCount,
        browserInfo: context?.browserInfo,
        networkInfo: context?.networkInfo
      }
    };

    this.addAnalytics(analytics);
    this.logAnalytics(analytics);
  }

  /**
   * Track error recovery attempt
   */
  trackRecoveryAttempt(
    errorCode: string,
    success: boolean,
    timeToResolve?: number
  ): void {
    const latestError = this.findLatestError(errorCode);
    if (latestError) {
      latestError.recoveryAttempted = true;
      latestError.recoverySuccess = success;
      if (timeToResolve !== undefined) {
        latestError.timeToResolve = timeToResolve;
      }
      this.saveAnalytics();
    }
  }

  /**
   * Track user feedback on error message
   */
  trackUserFeedback(
    errorCode: string,
    feedback: {
      helpful: boolean;
      rating: number;
      comment?: string;
    }
  ): void {
    const latestError = this.findLatestError(errorCode);
    if (latestError) {
      latestError.userFeedback = feedback;
      this.saveAnalytics();
    }
  }

  /**
   * Get error patterns and insights
   */
  getErrorPatterns(): ErrorPattern[] {
    const patterns = new Map<string, ErrorPattern>();
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Group analytics by error code
    this.analytics.forEach(analytics => {
      const key = analytics.errorCode;
      
      if (!patterns.has(key)) {
        patterns.set(key, {
          errorCode: key,
          frequency: 0,
          successRate: 0,
          avgTimeToResolve: 0,
          commonContext: [],
          userFeedbackAvg: 0,
          lastOccurrence: analytics.timestamp,
          trending: 'stable'
        });
      }

      const pattern = patterns.get(key)!;
      pattern.frequency++;
      
      if (analytics.timestamp > pattern.lastOccurrence) {
        pattern.lastOccurrence = analytics.timestamp;
      }
    });

    // Calculate metrics for each pattern
    patterns.forEach((pattern, errorCode) => {
      const errorAnalytics = this.analytics.filter(a => a.errorCode === errorCode);
      const recentAnalytics = errorAnalytics.filter(a => a.timestamp >= oneWeekAgo);
      
      // Success rate
      const attemptedRecoveries = errorAnalytics.filter(a => a.recoveryAttempted);
      const successfulRecoveries = attemptedRecoveries.filter(a => a.recoverySuccess);
      pattern.successRate = attemptedRecoveries.length > 0 
        ? successfulRecoveries.length / attemptedRecoveries.length 
        : 0;

      // Average time to resolve
      const resolvedAnalytics = errorAnalytics.filter(a => a.timeToResolve !== undefined);
      pattern.avgTimeToResolve = resolvedAnalytics.length > 0
        ? resolvedAnalytics.reduce((sum, a) => sum + (a.timeToResolve || 0), 0) / resolvedAnalytics.length
        : 0;

      // Common context
      const contexts = errorAnalytics
        .map(a => a.context?.operation)
        .filter(Boolean) as string[];
      const contextCounts = contexts.reduce((acc, ctx) => {
        acc[ctx] = (acc[ctx] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      pattern.commonContext = Object.entries(contextCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([ctx]) => ctx);

      // Average user feedback
      const feedbackAnalytics = errorAnalytics.filter(a => a.userFeedback?.rating);
      pattern.userFeedbackAvg = feedbackAnalytics.length > 0
        ? feedbackAnalytics.reduce((sum, a) => sum + (a.userFeedback?.rating || 0), 0) / feedbackAnalytics.length
        : 0;

      // Trending analysis
      const currentWeekCount = recentAnalytics.length;
      const previousWeekAnalytics = errorAnalytics.filter(a => 
        a.timestamp >= new Date(oneWeekAgo.getTime() - 7 * 24 * 60 * 60 * 1000) &&
        a.timestamp < oneWeekAgo
      );
      const previousWeekCount = previousWeekAnalytics.length;
      
      if (currentWeekCount > previousWeekCount * 1.2) {
        pattern.trending = 'up';
      } else if (currentWeekCount < previousWeekCount * 0.8) {
        pattern.trending = 'down';
      } else {
        pattern.trending = 'stable';
      }
    });

    return Array.from(patterns.values()).sort((a, b) => b.frequency - a.frequency);
  }

  /**
   * Get actionable insights for improving error messaging
   */
  getInsights(): ErrorInsight[] {
    const patterns = this.getErrorPatterns();
    const insights: ErrorInsight[] = [];

    // High frequency errors with low success rate
    patterns
      .filter(p => p.frequency >= 5 && p.successRate < 0.5)
      .forEach(pattern => {
        insights.push({
          type: 'warning',
          title: `High Impact Error: ${pattern.errorCode}`,
          description: `This error occurs frequently (${pattern.frequency} times) but has a low resolution success rate (${Math.round(pattern.successRate * 100)}%). Consider improving the error message or recovery flow.`,
          actionable: true,
          data: { pattern, suggestion: 'improve_messaging' }
        });
      });

    // Trending up errors
    patterns
      .filter(p => p.trending === 'up' && p.frequency >= 3)
      .forEach(pattern => {
        insights.push({
          type: 'warning',
          title: `Trending Error: ${pattern.errorCode}`,
          description: `This error is becoming more frequent. Recent spike may indicate a new issue or change in user behavior.`,
          actionable: true,
          data: { pattern, suggestion: 'investigate_cause' }
        });
      });

    // Low user feedback scores
    patterns
      .filter(p => p.userFeedbackAvg > 0 && p.userFeedbackAvg < 3)
      .forEach(pattern => {
        insights.push({
          type: 'improvement',
          title: `Poor User Experience: ${pattern.errorCode}`,
          description: `Users rate this error message poorly (${pattern.userFeedbackAvg.toFixed(1)}/5). The message may be confusing or unhelpful.`,
          actionable: true,
          data: { pattern, suggestion: 'improve_clarity' }
        });
      });

    // High success rate improvements
    patterns
      .filter(p => p.successRate >= 0.8 && p.frequency >= 3)
      .forEach(pattern => {
        insights.push({
          type: 'success',
          title: `Effective Recovery: ${pattern.errorCode}`,
          description: `Users successfully resolve this error ${Math.round(pattern.successRate * 100)}% of the time. This error handling can serve as a model for others.`,
          actionable: false,
          data: { pattern, suggestion: 'use_as_template' }
        });
      });

    // Long resolution times
    patterns
      .filter(p => p.avgTimeToResolve > 300000) // 5 minutes
      .forEach(pattern => {
        insights.push({
          type: 'improvement',
          title: `Slow Resolution: ${pattern.errorCode}`,
          description: `Users take an average of ${Math.round(pattern.avgTimeToResolve / 60000)} minutes to resolve this error. Consider streamlining the recovery process.`,
          actionable: true,
          data: { pattern, suggestion: 'streamline_recovery' }
        });
      });

    return insights.sort((a, b) => {
      const priority = { warning: 3, improvement: 2, success: 1 };
      return priority[b.type] - priority[a.type];
    });
  }

  /**
   * Get summary statistics
   */
  getSummaryStats() {
    const patterns = this.getErrorPatterns();
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentAnalytics = this.analytics.filter(a => a.timestamp >= oneWeekAgo);

    return {
      totalErrors: this.analytics.length,
      uniqueErrors: patterns.length,
      recentErrors: recentAnalytics.length,
      avgSuccessRate: patterns.length > 0 
        ? patterns.reduce((sum, p) => sum + p.successRate, 0) / patterns.length 
        : 0,
      avgResolutionTime: patterns.length > 0
        ? patterns.reduce((sum, p) => sum + p.avgTimeToResolve, 0) / patterns.length
        : 0,
      topErrors: patterns.slice(0, 5).map(p => ({
        code: p.errorCode,
        frequency: p.frequency,
        successRate: p.successRate
      })),
      trendingUp: patterns.filter(p => p.trending === 'up').length,
      trendingDown: patterns.filter(p => p.trending === 'down').length
    };
  }

  private extractErrorCode(error: any): string {
    if (typeof error === 'string') return error;
    if (error?.code) return error.code;
    if (error?.message) {
      const message = error.message.toLowerCase();
      if (message.includes('network')) return 'NETWORK_ERROR';
      if (message.includes('timeout')) return 'REQUEST_TIMEOUT';
      if (message.includes('unauthorized')) return 'UNAUTHORIZED';
      // Add more mappings as needed
    }
    return 'UNKNOWN_ERROR';
  }

  private findLatestError(errorCode: string): ErrorAnalytics | undefined {
    return this.analytics
      .filter(a => a.errorCode === errorCode)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
  }

  private addAnalytics(analytics: ErrorAnalytics): void {
    this.analytics.push(analytics);
    
    // Limit analytics size
    if (this.analytics.length > this.MAX_ANALYTICS_SIZE) {
      this.analytics = this.analytics.slice(-this.MAX_ANALYTICS_SIZE);
    }
    
    this.saveAnalytics();
  }

  private saveAnalytics(): void {
    try {
      const serialized = JSON.stringify(this.analytics, (key, value) => {
        if (key === 'timestamp') {
          return value instanceof Date ? value.toISOString() : value;
        }
        return value;
      });
      localStorage.setItem('ipec_error_analytics', serialized);
    } catch (error) {
      console.warn('Failed to save error analytics:', error);
    }
  }

  private loadAnalytics(): void {
    try {
      const stored = localStorage.getItem('ipec_error_analytics');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.analytics = parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
      }
    } catch (error) {
      console.warn('Failed to load error analytics:', error);
      this.analytics = [];
    }
  }

  private logAnalytics(analytics: ErrorAnalytics): void {
    logSecurity('Error tracked', analytics.severity as any, {
      errorCode: analytics.errorCode,
      category: analytics.category,
      location: analytics.location,
      sessionId: analytics.sessionId,
      context: analytics.context
    });
  }

  /**
   * Clear all analytics data
   */
  clearAnalytics(): void {
    this.analytics = [];
    localStorage.removeItem('ipec_error_analytics');
  }

  /**
   * Export analytics data for analysis
   */
  exportAnalytics(): string {
    return JSON.stringify(this.analytics, null, 2);
  }
}

// Export singleton instance
export const errorAnalyticsService = new ErrorAnalyticsService();

// Export convenience functions
export const trackError = (error: ErrorMessage, context?: ErrorContext, originalError?: any) => {
  errorAnalyticsService.trackError(error, context, originalError);
};

export const trackRecoveryAttempt = (errorCode: string, success: boolean, timeToResolve?: number) => {
  errorAnalyticsService.trackRecoveryAttempt(errorCode, success, timeToResolve);
};

export const trackUserFeedback = (errorCode: string, feedback: { helpful: boolean; rating: number; comment?: string }) => {
  errorAnalyticsService.trackUserFeedback(errorCode, feedback);
};

export const getErrorInsights = () => {
  return errorAnalyticsService.getInsights();
};

export const getErrorSummary = () => {
  return errorAnalyticsService.getSummaryStats();
};

export default errorAnalyticsService;