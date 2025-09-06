/**
 * Enhanced Analytics Service with A/B Testing Integration
 * 
 * Comprehensive analytics service that handles registration tracking,
 * A/B test analytics, feature flag evaluation tracking, and statistical analysis.
 */

import type { ConversionEvent, RegistrationFunnelData } from '../hooks/useRegistrationAnalytics';
import type { UserContext } from '../types/ab-testing';

export interface AnalyticsConfig {
  endpoint: string;
  apiKey?: string;
  debug?: boolean;
}

class AnalyticsService {
  private config: AnalyticsConfig;
  private isEnabled = true;

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
   * Track experiment exposure (when user is assigned to experiment)
   */
  async trackExperimentExposure(experimentId: string, variantId: string, userContext: UserContext): Promise<void> {
    if (!this.isEnabled) return;

    try {
      const data = {
        event: 'experiment_exposure',
        experiment_id: experimentId,
        variant_id: variantId,
        user_id: userContext.user_id,
        session_id: userContext.session_id,
        is_authenticated: userContext.is_authenticated,
        user_type: userContext.user_properties.user_type,
        device_type: userContext.user_properties.device_info.type,
        timestamp: Date.now()
      };

      if (this.config.debug) {
        console.log('[Analytics] Experiment Exposure:', data);
      }

      await this.sendAnalyticsEvent('experiment_exposure', data);
      this.trackGoogleAnalytics('experiment_exposure', {
        experiment_id: experimentId,
        variant_id: variantId
      });
    } catch (error) {
      console.warn('[Analytics] Failed to track experiment exposure:', error);
    }
  }

  /**
   * Track A/B test conversion
   */
  async trackABConversion(
    experimentId: string,
    variantId: string,
    metricName: string,
    value = 1,
    userContext: UserContext,
    properties?: Record<string, any>
  ): Promise<void> {
    if (!this.isEnabled) return;

    try {
      const data = {
        event: 'ab_conversion',
        experiment_id: experimentId,
        variant_id: variantId,
        metric_name: metricName,
        value,
        user_id: userContext.user_id,
        session_id: userContext.session_id,
        properties,
        timestamp: Date.now()
      };

      if (this.config.debug) {
        console.log('[Analytics] A/B Conversion:', data);
      }

      await this.sendAnalyticsEvent('ab_conversion', data);
      this.trackGoogleAnalytics('ab_conversion', {
        experiment_id: experimentId,
        variant_id: variantId,
        metric_name: metricName,
        value
      });
    } catch (error) {
      console.warn('[Analytics] Failed to track A/B conversion:', error);
    }
  }

  /**
   * Track feature flag evaluation
   */
  async trackFeatureFlagEvaluation(
    flagKey: string,
    value: any,
    userContext: UserContext,
    variant: string | null = null
  ): Promise<void> {
    if (!this.isEnabled) return;

    try {
      const data = {
        event: 'feature_flag_evaluation',
        flag_key: flagKey,
        value,
        variant,
        user_id: userContext.user_id,
        session_id: userContext.session_id,
        is_enabled: Boolean(value),
        timestamp: Date.now()
      };

      if (this.config.debug) {
        console.log('[Analytics] Feature Flag Evaluation:', data);
      }

      await this.sendAnalyticsEvent('feature_flag_evaluation', data);
    } catch (error) {
      console.warn('[Analytics] Failed to track feature flag evaluation:', error);
    }
  }

  /**
   * Track generic event with A/B testing context
   */
  async track(eventName: string, properties?: Record<string, any>): Promise<void> {
    if (!this.isEnabled) return;

    try {
      const data = {
        event: eventName,
        ...properties,
        session_id: this.getSessionId(),
        timestamp: Date.now(),
        url: window.location.href,
        referrer: document.referrer
      };

      if (this.config.debug) {
        console.log(`[Analytics] ${eventName}:`, data);
      }

      await this.sendAnalyticsEvent(eventName, data);
      this.trackGoogleAnalytics(eventName, properties);
    } catch (error) {
      console.warn(`[Analytics] Failed to track ${eventName}:`, error);
    }
  }

  /**
   * Track funnel step with A/B testing context
   */
  async trackFunnelStep(
    funnelName: string,
    stepName: string,
    stepIndex: number,
    userContext?: UserContext,
    experimentContext?: { experimentId: string; variantId: string }
  ): Promise<void> {
    const data = {
      funnel_name: funnelName,
      step_name: stepName,
      step_index: stepIndex,
      ...experimentContext,
      user_id: userContext?.user_id,
      session_id: userContext?.session_id
    };

    await this.track('funnel_step', data);
  }

  /**
   * Calculate and track statistical significance
   */
  async trackStatisticalSignificance(
    experimentId: string,
    metricName: string,
    pValue: number,
    isSignificant: boolean,
    confidence: number
  ): Promise<void> {
    const data = {
      experiment_id: experimentId,
      metric_name: metricName,
      p_value: pValue,
      is_significant: isSignificant,
      confidence_level: confidence
    };

    await this.track('statistical_significance', data);
  }

  /**
   * Track experiment lifecycle events
   */
  async trackExperimentLifecycle(
    experimentId: string,
    action: 'created' | 'started' | 'paused' | 'resumed' | 'stopped' | 'concluded',
    metadata?: Record<string, any>
  ): Promise<void> {
    const data = {
      experiment_id: experimentId,
      action,
      ...metadata
    };

    await this.track('experiment_lifecycle', data);
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
   * Send analytics event to backend
   */
  private async sendAnalyticsEvent(eventName: string, data: any): Promise<void> {
    try {
      const response = await fetch(`${this.config.endpoint}/${eventName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`Analytics request failed: ${response.status}`);
      }
    } catch (error) {
      console.warn(`[Analytics] Failed to send ${eventName} event:`, error);
    }
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