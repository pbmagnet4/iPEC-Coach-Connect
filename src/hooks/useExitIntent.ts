/**
 * Exit Intent Detection Hook
 * 
 * Detects when users are about to leave the page and provides
 * retention strategies to improve conversion rates:
 * - Mouse movement tracking
 * - Scroll behavior analysis
 * - Time-based triggers
 * - Mobile touch gesture detection
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export interface ExitIntentConfig {
  enabled?: boolean;
  mouseThreshold?: number;
  timeThreshold?: number;
  scrollThreshold?: number;
  mobileEnabled?: boolean;
  cooldownTime?: number;
  maxTriggers?: number;
  excludeElements?: string[];
}

export interface ExitIntentData {
  trigger: 'mouse' | 'time' | 'scroll' | 'touch' | 'visibility';
  timestamp: number;
  scrollPosition: number;
  timeOnPage: number;
  triggerCount: number;
}

const defaultConfig: ExitIntentConfig = {
  enabled: true,
  mouseThreshold: 10, // pixels from top
  timeThreshold: 30000, // 30 seconds
  scrollThreshold: 50, // 50% of page
  mobileEnabled: true,
  cooldownTime: 60000, // 1 minute between triggers
  maxTriggers: 3,
  excludeElements: []
};

export function useExitIntent(
  onExitIntent: (data: ExitIntentData) => void,
  config: ExitIntentConfig = {}
) {
  const finalConfig = { ...defaultConfig, ...config };
  const [isTriggered, setIsTriggered] = useState(false);
  const [triggerCount, setTriggerCount] = useState(0);
  const [lastTriggerTime, setLastTriggerTime] = useState<number | null>(null);
  
  const pageLoadTime = useRef(Date.now());
  const maxScrollPosition = useRef(0);
  const isMouseTracking = useRef(false);
  const touchStartY = useRef<number | null>(null);

  // Check if we should trigger exit intent
  const shouldTrigger = useCallback(() => {
    if (!finalConfig.enabled) return false;
    if (triggerCount >= finalConfig.maxTriggers) return false;
    
    const now = Date.now();
    if (lastTriggerTime && now - lastTriggerTime < finalConfig.cooldownTime) {
      return false;
    }
    
    return true;
  }, [finalConfig, triggerCount, lastTriggerTime]);

  // Trigger exit intent with data
  const triggerExitIntent = useCallback((trigger: ExitIntentData['trigger']) => {
    if (!shouldTrigger()) return;
    
    const now = Date.now();
    const data: ExitIntentData = {
      trigger,
      timestamp: now,
      scrollPosition: Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100),
      timeOnPage: now - pageLoadTime.current,
      triggerCount: triggerCount + 1
    };
    
    setIsTriggered(true);
    setTriggerCount(prev => prev + 1);
    setLastTriggerTime(now);
    
    onExitIntent(data);
    
    // Reset triggered state after cooldown
    setTimeout(() => setIsTriggered(false), finalConfig.cooldownTime);
  }, [shouldTrigger, triggerCount, onExitIntent, finalConfig.cooldownTime]);

  // Mouse leave detection (desktop)
  useEffect(() => {
    if (!finalConfig.enabled) return;
    
    const handleMouseLeave = (e: MouseEvent) => {
      // Check if mouse is leaving from the top
      if (e.clientY <= finalConfig.mouseThreshold) {
        // Check if mouse is not over an excluded element
        const target = e.target as HTMLElement;
        const isExcluded = finalConfig.excludeElements?.some(selector => 
          target.closest(selector)
        );
        
        if (!isExcluded) {
          triggerExitIntent('mouse');
        }
      }
    };

    const handleMouseEnter = () => {
      isMouseTracking.current = true;
    };

  void document.addEventListener('mouseleave', handleMouseLeave);
  void document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
  void document.removeEventListener('mouseleave', handleMouseLeave);
  void document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [finalConfig, triggerExitIntent]);

  // Time-based trigger
  useEffect(() => {
    if (!finalConfig.enabled || !finalConfig.timeThreshold) return;
    
    const timeoutId = setTimeout(() => {
      triggerExitIntent('time');
    }, finalConfig.timeThreshold);

    return () => clearTimeout(timeoutId);
  }, [finalConfig, triggerExitIntent]);

  // Scroll-based trigger
  useEffect(() => {
    if (!finalConfig.enabled || !finalConfig.scrollThreshold) return;
    
    const handleScroll = () => {
      const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
      maxScrollPosition.current = Math.max(maxScrollPosition.current, scrollPercent);
      
      if (scrollPercent >= finalConfig.scrollThreshold && !isTriggered) {
        triggerExitIntent('scroll');
      }
    };

  void window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [finalConfig, triggerExitIntent, isTriggered]);

  // Mobile touch gesture detection
  useEffect(() => {
    if (!finalConfig.enabled || !finalConfig.mobileEnabled) return;
    
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (!isMobile) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartY.current === null) return;
      
      const currentY = e.touches[0].clientY;
      const deltaY = currentY - touchStartY.current;
      
      // Detect upward swipe at the top of the page
      if (window.scrollY === 0 && deltaY > 50) {
        triggerExitIntent('touch');
      }
    };

    const handleTouchEnd = () => {
      touchStartY.current = null;
    };

  void document.addEventListener('touchstart', handleTouchStart);
  void document.addEventListener('touchmove', handleTouchMove);
  void document.addEventListener('touchend', handleTouchEnd);

    return () => {
  void document.removeEventListener('touchstart', handleTouchStart);
  void document.removeEventListener('touchmove', handleTouchMove);
  void document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [finalConfig, triggerExitIntent]);

  // Page visibility change detection
  useEffect(() => {
    if (!finalConfig.enabled) return;
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerExitIntent('visibility');
      }
    };

  void document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [finalConfig, triggerExitIntent]);

  // Beforeunload event (as backup)
  useEffect(() => {
    if (!finalConfig.enabled) return;
    
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Only trigger if we haven't already triggered recently
      if (shouldTrigger()) {
        triggerExitIntent('visibility');
        // Note: We can't show custom messages in modern browsers
        // but we can still track the intent
      }
    };

  void window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [finalConfig, triggerExitIntent, shouldTrigger]);

  // Reset function
  const reset = useCallback(() => {
    setIsTriggered(false);
    setTriggerCount(0);
    setLastTriggerTime(null);
    maxScrollPosition.current = 0;
    pageLoadTime.current = Date.now();
  }, []);

  // Manual trigger function
  const manualTrigger = useCallback(() => {
    triggerExitIntent('mouse'); // Use mouse as default manual trigger
  }, [triggerExitIntent]);

  // Disable function
  const disable = useCallback(() => {
    finalConfig.enabled = false;
  }, [finalConfig]);

  // Enable function
  const enable = useCallback(() => {
    finalConfig.enabled = true;
  }, [finalConfig]);

  return {
    isTriggered,
    triggerCount,
    lastTriggerTime,
    timeOnPage: Date.now() - pageLoadTime.current,
    maxScrollPosition: maxScrollPosition.current,
    reset,
    manualTrigger,
    disable,
    enable
  };
}

// Hook for exit intent with retention modal
export function useExitIntentWithModal(
  config: ExitIntentConfig = {}
) {
  const [showModal, setShowModal] = useState(false);
  const [exitData, setExitData] = useState<ExitIntentData | null>(null);

  const handleExitIntent = useCallback((data: ExitIntentData) => {
    setExitData(data);
    setShowModal(true);
  }, []);

  const exitIntent = useExitIntent(handleExitIntent, config);

  const closeModal = useCallback(() => {
    setShowModal(false);
  }, []);

  const handleStay = useCallback(() => {
    setShowModal(false);
    // Track user decided to stay
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exit_intent_retained', {
        event_category: 'Retention',
        event_label: exitData?.trigger || 'unknown'
      });
    }
  }, [exitData]);

  const handleLeave = useCallback(() => {
    setShowModal(false);
    // Track user decided to leave
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exit_intent_left', {
        event_category: 'Retention',
        event_label: exitData?.trigger || 'unknown'
      });
    }
    // Navigate away or close tab
    window.history.back();
  }, [exitData]);

  return {
    ...exitIntent,
    showModal,
    exitData,
    closeModal,
    handleStay,
    handleLeave
  };
}

// Retention strategies
export const retentionStrategies = {
  discount: {
    title: "Wait! Get 20% off your first session",
    description: "Don't miss out on this limited-time offer for new members.",
    action: "Claim Discount"
  },
  social: {
    title: "Join 10,000+ people who found their perfect coach",
    description: "You're just one step away from transforming your life.",
    action: "Continue Registration"
  },
  urgency: {
    title: "Limited spots available",
    description: "Only 5 coach spots left this month. Secure yours now.",
    action: "Reserve My Spot"
  },
  progress: {
    title: "Don't lose your progress!",
    description: "You're already halfway through. Complete your registration now.",
    action: "Continue"
  }
};

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

export type { ExitIntentConfig, ExitIntentData };