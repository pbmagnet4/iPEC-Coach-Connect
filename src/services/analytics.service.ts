/**
 * Analytics Service for Registration Tracking
 * 
 * Mock implementation for registration analytics.
 * In production, this would connect to your analytics backend.
 */

import { ConversionEvent, RegistrationFunnelData } from '../hooks/useRegistrationAnalytics';

export interface AnalyticsConfig {
  endpoint: string;
  apiKey?: string;
  debug?: boolean;
}

class AnalyticsService {
  private config: AnalyticsConfig;
  private isEnabled: boolean = true;

  constructor(config: AnalyticsConfig = { endpoint: '/api/analytics' }) {
    this.config = config;
  }

  /**
   * Track a registration event
   */
  async trackRegistrationEvent(event: ConversionEvent): Promise<void> {
    if (!this.isEnabled) return;

    try {
      if (this.config.debug) {
        console.log('[Analytics] Registration Event:', event);
      }

      // Mock API call - replace with your actual analytics endpoint
      const response = await fetch(`${this.config.endpoint}/registration`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
        },
        body: JSON.stringify({
          event: event.event,
          timestamp: event.timestamp,
          step: event.step,
          data: event.data,
          sessionId: this.getSessionId(),
          userAgent: navigator.userAgent,
          referrer: document.referrer,
          url: window.location.href
        })
      });

      if (!response.ok) {
        throw new Error(`Analytics request failed: ${response.status}`);
      }
    } catch (error) {
      console.warn('[Analytics] Failed to track event:', error);
    }
  }

  /**
   * Track funnel completion data
   */
  async trackFunnelCompletion(data: RegistrationFunnelData): Promise<void> {
    if (!this.isEnabled) return;

    try {
      if (this.config.debug) {
        console.log('[Analytics] Funnel Data:', data);
      }

      // Mock API call - replace with your actual analytics endpoint
      const response = await fetch(`${this.config.endpoint}/funnel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
        },
        body: JSON.stringify({
          ...data,
          sessionId: this.getSessionId(),
          timestamp: Date.now()
        })
      });

      if (!response.ok) {
        throw new Error(`Analytics request failed: ${response.status}`);
      }
    } catch (error) {
      console.warn('[Analytics] Failed to track funnel data:', error);
    }
  }

  /**
   * Track A/B test assignment
   */
  async trackABTest(testName: string, variant: string): Promise<void> {
    if (!this.isEnabled) return;

    try {
      if (this.config.debug) {
        console.log('[Analytics] A/B Test:', { testName, variant });
      }

      // Mock API call - replace with your actual analytics endpoint
      const response = await fetch(`${this.config.endpoint}/ab-test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
        },
        body: JSON.stringify({
          testName,
          variant,
          sessionId: this.getSessionId(),
          timestamp: Date.now()
        })
      });

      if (!response.ok) {
        throw new Error(`Analytics request failed: ${response.status}`);
      }
    } catch (error) {
      console.warn('[Analytics] Failed to track A/B test:', error);
    }
  }

  /**
   * Track conversion metrics
   */
  async trackConversion(type: string, value?: number, metadata?: any): Promise<void> {
    if (!this.isEnabled) return;

    try {
      if (this.config.debug) {
        console.log('[Analytics] Conversion:', { type, value, metadata });
      }

      // Mock API call - replace with your actual analytics endpoint
      const response = await fetch(`${this.config.endpoint}/conversion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
        },
        body: JSON.stringify({
          type,
          value,
          metadata,
          sessionId: this.getSessionId(),
          timestamp: Date.now()
        })
      });

      if (!response.ok) {
        throw new Error(`Analytics request failed: ${response.status}`);
      }
    } catch (error) {
      console.warn('[Analytics] Failed to track conversion:', error);
    }
  }

  /**
   * Enable or disable analytics tracking
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Get current session ID
   */
  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = Date.now().toString(36) + Math.random().toString(36).substr(2);
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  }

  /**
   * Initialize analytics with Google Analytics
   */
  initializeGoogleAnalytics(measurementId: string): void {
    if (typeof window === 'undefined') return;

    // Load Google Analytics script
    const script = document.createElement('script');
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    script.async = true;
    document.head.appendChild(script);

    // Initialize gtag
    window.dataLayer = window.dataLayer || [];
    function gtag(...args: any[]) {
      window.dataLayer.push(arguments);
    }
    gtag('js', new Date());
    gtag('config', measurementId);

    // Make gtag globally available
    window.gtag = gtag;
  }

  /**
   * Track with Google Analytics
   */
  trackGoogleAnalytics(eventName: string, parameters?: any): void {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, {
        event_category: 'Registration',
        ...parameters
      });
    }
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService({
  endpoint: '/api/analytics',
  debug: process.env.NODE_ENV === 'development'
});

// Initialize with Google Analytics if measurement ID is available
if (process.env.REACT_APP_GA_MEASUREMENT_ID) {
  analyticsService.initializeGoogleAnalytics(process.env.REACT_APP_GA_MEASUREMENT_ID);
}

export default analyticsService;

// Extend window type for Google Analytics
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}