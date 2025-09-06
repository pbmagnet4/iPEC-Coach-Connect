/**
 * Registration Analytics Hook
 * 
 * Tracks registration funnel analytics including:
 * - Step completion rates
 * - Time spent on each step
 * - Conversion optimization metrics
 * - Exit intent detection
 * - A/B testing support
 */

import { useCallback, useEffect, useState } from 'react';

export interface RegistrationAnalyticsData {
  sessionId: string;
  startTime: number;
  currentStep: number;
  stepTimes: number[];
  stepCompletions: boolean[];
  exitIntentTriggered: boolean;
  conversionEvents: ConversionEvent[];
  userAgent: string;
  referrer: string;
  source: string;
  medium: string;
  campaign: string;
}

export interface ConversionEvent {
  event: string;
  timestamp: number;
  step: number;
  data: any;
}

export interface StepMetrics {
  stepId: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  completed: boolean;
  errors: string[];
  interactions: number;
  exitAttempts: number;
}

export interface RegistrationFunnelData {
  step0_started: number;
  step0_completed: number;
  step1_started: number;
  step1_completed: number;
  step2_started: number;
  step2_completed: number;
  step3_reached: number;
  registration_completed: number;
  exit_intent_triggered: number;
  google_auth_attempted: number;
  google_auth_completed: number;
}

export function useRegistrationAnalytics(enableTracking = true) {
  const [analyticsData, setAnalyticsData] = useState<RegistrationAnalyticsData>(() => ({
    sessionId: generateSessionId(),
    startTime: Date.now(),
    currentStep: 0,
    stepTimes: [],
    stepCompletions: [],
    exitIntentTriggered: false,
    conversionEvents: [],
    userAgent: navigator.userAgent,
    referrer: document.referrer,
    source: getUrlParameter('utm_source') || 'direct',
    medium: getUrlParameter('utm_medium') || 'organic',
    campaign: getUrlParameter('utm_campaign') || 'none'
  }));

  const [stepMetrics, setStepMetrics] = useState<StepMetrics[]>([]);
  const [funnelData, setFunnelData] = useState<RegistrationFunnelData>({
    step0_started: 0,
    step0_completed: 0,
    step1_started: 0,
    step1_completed: 0,
    step2_started: 0,
    step2_completed: 0,
    step3_reached: 0,
    registration_completed: 0,
    exit_intent_triggered: 0,
    google_auth_attempted: 0,
    google_auth_completed: 0
  });

  // Track page visibility for exit intent
  useEffect(() => {
    if (!enableTracking) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        trackEvent('page_hidden', { step: analyticsData.currentStep });
      } else {
        trackEvent('page_visible', { step: analyticsData.currentStep });
      }
    };

    const handleBeforeUnload = () => {
      trackEvent('page_unload', { 
        step: analyticsData.currentStep,
        timeSpent: Date.now() - analyticsData.startTime
      });
      
      // Send analytics before leaving
      sendAnalytics();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [enableTracking, analyticsData.currentStep, analyticsData.startTime]);

  // Track conversion events
  const trackEvent = useCallback((event: string, data: any = {}) => {
    if (!enableTracking) return;

    const conversionEvent: ConversionEvent = {
      event,
      timestamp: Date.now(),
      step: analyticsData.currentStep,
      data
    };

    setAnalyticsData(prev => ({
      ...prev,
      conversionEvents: [...prev.conversionEvents, conversionEvent]
    }));

    // Update funnel metrics
    updateFunnelMetrics(event, data);

    // Send to analytics service
    sendEventToAnalytics(conversionEvent);
  }, [enableTracking, analyticsData.currentStep]);

  // Track step changes
  const trackStepChange = useCallback((newStep: number, stepData: any = {}) => {
    if (!enableTracking) return;

    const now = Date.now();
    
    // Complete current step metrics
    setStepMetrics(prev => {
      const updated = [...prev];
      if (updated[analyticsData.currentStep]) {
        updated[analyticsData.currentStep].endTime = now;
        updated[analyticsData.currentStep].duration = now - updated[analyticsData.currentStep].startTime;
        updated[analyticsData.currentStep].completed = true;
      }
      return updated;
    });

    // Start new step metrics
    const newStepMetrics: StepMetrics = {
      stepId: `step_${newStep}`,
      startTime: now,
      completed: false,
      errors: [],
      interactions: 0,
      exitAttempts: 0
    };

    setStepMetrics(prev => {
      const updated = [...prev];
      updated[newStep] = newStepMetrics;
      return updated;
    });

    // Update analytics data
    setAnalyticsData(prev => ({
      ...prev,
      currentStep: newStep,
      stepTimes: [...prev.stepTimes, now - prev.startTime]
    }));

    // Track specific step events
    trackEvent(`step_${newStep}_started`, { 
      previousStep: analyticsData.currentStep,
      stepData 
    });
  }, [enableTracking, analyticsData.currentStep, analyticsData.startTime, trackEvent]);

  // Track field interactions
  const trackFieldInteraction = useCallback((fieldName: string, action: string, value?: any) => {
    if (!enableTracking) return;

    trackEvent('field_interaction', {
      field: fieldName,
      action,
      value: value ? '[REDACTED]' : undefined, // Don't track actual values for privacy
      step: analyticsData.currentStep
    });

    // Update step metrics
    setStepMetrics(prev => {
      const updated = [...prev];
      if (updated[analyticsData.currentStep]) {
        updated[analyticsData.currentStep].interactions++;
      }
      return updated;
    });
  }, [enableTracking, analyticsData.currentStep, trackEvent]);

  // Track validation errors
  const trackValidationError = useCallback((fieldName: string, error: string) => {
    if (!enableTracking) return;

    trackEvent('validation_error', {
      field: fieldName,
      error,
      step: analyticsData.currentStep
    });

    // Update step metrics
    setStepMetrics(prev => {
      const updated = [...prev];
      if (updated[analyticsData.currentStep]) {
        updated[analyticsData.currentStep].errors.push(error);
      }
      return updated;
    });
  }, [enableTracking, analyticsData.currentStep, trackEvent]);

  // Track exit intent
  const trackExitIntent = useCallback(() => {
    if (!enableTracking) return;

    setAnalyticsData(prev => ({ ...prev, exitIntentTriggered: true }));
    
    trackEvent('exit_intent_detected', {
      step: analyticsData.currentStep,
      timeSpent: Date.now() - analyticsData.startTime
    });

    // Update step metrics
    setStepMetrics(prev => {
      const updated = [...prev];
      if (updated[analyticsData.currentStep]) {
        updated[analyticsData.currentStep].exitAttempts++;
      }
      return updated;
    });
  }, [enableTracking, analyticsData.currentStep, analyticsData.startTime, trackEvent]);

  // Track registration completion
  const trackRegistrationComplete = useCallback((userId: string, userRole: string) => {
    if (!enableTracking) return;

    trackEvent('registration_completed', {
      userId,
      userRole,
      totalTime: Date.now() - analyticsData.startTime,
      stepsCompleted: analyticsData.stepCompletions.filter(Boolean).length
    });

    // Send final analytics
    sendAnalytics();
  }, [enableTracking, analyticsData.startTime, analyticsData.stepCompletions, trackEvent]);

  // Update funnel metrics
  const updateFunnelMetrics = useCallback((event: string, data: any) => {
    setFunnelData(prev => {
      const updated = { ...prev };
      
      switch (event) {
        case 'step_0_started':
          updated.step0_started++;
          break;
        case 'step_0_completed':
          updated.step0_completed++;
          break;
        case 'step_1_started':
          updated.step1_started++;
          break;
        case 'step_1_completed':
          updated.step1_completed++;
          break;
        case 'step_2_started':
          updated.step2_started++;
          break;
        case 'step_2_completed':
          updated.step2_completed++;
          break;
        case 'step_3_reached':
          updated.step3_reached++;
          break;
        case 'registration_completed':
          updated.registration_completed++;
          break;
        case 'exit_intent_detected':
          updated.exit_intent_triggered++;
          break;
        case 'google_auth_attempted':
          updated.google_auth_attempted++;
          break;
        case 'google_auth_completed':
          updated.google_auth_completed++;
          break;
      }
      
      return updated;
    });
  }, []);

  // Send event to analytics service
  const sendEventToAnalytics = useCallback((event: ConversionEvent) => {
    if (!enableTracking) return;

    // Send to analytics service (e.g., Google Analytics, Mixpanel, etc.)
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', event.event, {
        event_category: 'Registration',
        event_label: `Step ${event.step}`,
        value: event.step,
        custom_parameter_1: event.data?.field || '',
        custom_parameter_2: event.data?.error || ''
      });
    }

    // Send to custom analytics endpoint
    fetch('/api/analytics/registration', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId: analyticsData.sessionId,
        event: event.event,
        timestamp: event.timestamp,
        step: event.step,
        data: event.data,
        userAgent: analyticsData.userAgent,
        referrer: analyticsData.referrer,
        source: analyticsData.source,
        medium: analyticsData.medium,
        campaign: analyticsData.campaign
      })
    }).catch(error => {
      console.warn('Analytics tracking failed:', error);
    });
  }, [enableTracking, analyticsData]);

  // Send complete analytics data
  const sendAnalytics = useCallback(() => {
    if (!enableTracking) return;

    const completeData = {
      ...analyticsData,
      stepMetrics,
      funnelData,
      completionRate: calculateCompletionRate(),
      averageStepTime: calculateAverageStepTime(),
      endTime: Date.now()
    };

    // Send to analytics service
    fetch('/api/analytics/registration/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(completeData)
    }).catch(error => {
      console.warn('Analytics sending failed:', error);
    });
  }, [enableTracking, analyticsData, stepMetrics, funnelData]);

  // Calculate completion rate
  const calculateCompletionRate = useCallback(() => {
    const completedSteps = analyticsData.stepCompletions.filter(Boolean).length;
    const totalSteps = analyticsData.stepCompletions.length;
    return totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
  }, [analyticsData.stepCompletions]);

  // Calculate average step time
  const calculateAverageStepTime = useCallback(() => {
    const validTimes = stepMetrics
      .filter(step => step.duration && step.duration > 0)
      .map(step => step.duration!);
    
    if (validTimes.length === 0) return 0;
    
    return validTimes.reduce((sum, time) => sum + time, 0) / validTimes.length;
  }, [stepMetrics]);

  // Get conversion funnel data
  const getConversionFunnel = useCallback(() => {
    const funnel = {
      step0: {
        started: funnelData.step0_started,
        completed: funnelData.step0_completed,
        conversionRate: funnelData.step0_started > 0 ? 
          (funnelData.step0_completed / funnelData.step0_started) * 100 : 0
      },
      step1: {
        started: funnelData.step1_started,
        completed: funnelData.step1_completed,
        conversionRate: funnelData.step1_started > 0 ? 
          (funnelData.step1_completed / funnelData.step1_started) * 100 : 0
      },
      step2: {
        started: funnelData.step2_started,
        completed: funnelData.step2_completed,
        conversionRate: funnelData.step2_started > 0 ? 
          (funnelData.step2_completed / funnelData.step2_started) * 100 : 0
      },
      overall: {
        started: funnelData.step0_started,
        completed: funnelData.registration_completed,
        conversionRate: funnelData.step0_started > 0 ? 
          (funnelData.registration_completed / funnelData.step0_started) * 100 : 0
      }
    };

    return funnel;
  }, [funnelData]);

  // A/B testing support
  const getABTestVariant = useCallback((testName: string) => {
    // Simple A/B test based on session ID
    const hash = hashString(analyticsData.sessionId + testName);
    return hash % 2 === 0 ? 'A' : 'B';
  }, [analyticsData.sessionId]);

  return {
    analyticsData,
    stepMetrics,
    funnelData,
    trackEvent,
    trackStepChange,
    trackFieldInteraction,
    trackValidationError,
    trackExitIntent,
    trackRegistrationComplete,
    getConversionFunnel,
    getABTestVariant,
    completionRate: calculateCompletionRate(),
    averageStepTime: calculateAverageStepTime(),
    sendAnalytics
  };
}

// Utility functions
function generateSessionId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function getUrlParameter(name: string): string | null {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

// Extend window type for gtag
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

export type { RegistrationAnalyticsData, ConversionEvent, StepMetrics, RegistrationFunnelData };