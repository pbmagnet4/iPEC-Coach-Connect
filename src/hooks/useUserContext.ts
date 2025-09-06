/**
 * User Context Hook for A/B Testing and Feature Flags
 * Provides user context information needed for experimentation
 */

import { useEffect, useState, useMemo } from 'react';
import { useStore } from '../lib/store';
import type { UserContext } from '../types/ab-testing';

// Generate session ID that persists for the browser session
const generateSessionId = (): string => {
  let sessionId = sessionStorage.getItem('ab_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    sessionStorage.setItem('ab_session_id', sessionId);
  }
  return sessionId;
};

// Detect device type based on screen size and user agent
const detectDeviceType = (): 'mobile' | 'tablet' | 'desktop' => {
  const width = window.innerWidth;
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (width <= 768 || /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)) {
    return width <= 480 ? 'mobile' : 'tablet';
  }
  
  return 'desktop';
};

// Detect browser information
const detectBrowserInfo = (): { browser: string; os: string } => {
  const userAgent = navigator.userAgent.toLowerCase();
  
  let browser = 'unknown';
  if (userAgent.includes('chrome')) browser = 'chrome';
  else if (userAgent.includes('firefox')) browser = 'firefox';
  else if (userAgent.includes('safari')) browser = 'safari';
  else if (userAgent.includes('edge')) browser = 'edge';
  
  let os = 'unknown';
  if (userAgent.includes('windows')) os = 'windows';
  else if (userAgent.includes('mac')) os = 'macos';
  else if (userAgent.includes('linux')) os = 'linux';
  else if (userAgent.includes('android')) os = 'android';
  else if (userAgent.includes('ios')) os = 'ios';
  
  return { browser, os };
};

// Get user's approximate location (country level)
const getUserLocation = async (): Promise<{ country: string; region: string; city: string } | undefined> => {
  try {
    // Use a free geolocation API or browser geolocation
    // For privacy, we only get country-level data
    const response = await fetch('https://ipapi.co/json/');
    if (response.ok) {
      const data = await response.json();
      return {
        country: data.country_name || 'unknown',
        region: data.region || 'unknown',
        city: data.city || 'unknown'
      };
    }
  } catch (error) {
    console.log('Could not determine user location:', error);
  }
  return undefined;
};

// Calculate engagement score based on user behavior
const calculateEngagementScore = (sessionCount: number, totalBookings: number, lastLogin: string): number => {
  const daysSinceLastLogin = Math.floor(
    (Date.now() - new Date(lastLogin).getTime()) / (1000 * 60 * 60 * 24)
  );
  
  let score = 0;
  
  // Session frequency (0-30 points)
  score += Math.min(sessionCount * 2, 30);
  
  // Booking activity (0-40 points)
  score += Math.min(totalBookings * 10, 40);
  
  // Recency (0-30 points)
  if (daysSinceLastLogin <= 1) score += 30;
  else if (daysSinceLastLogin <= 7) score += 20;
  else if (daysSinceLastLogin <= 30) score += 10;
  
  return Math.min(score, 100);
};

/**
 * Hook to get user context for A/B testing and feature flags
 */
export function useUserContext(): UserContext | null {
  const user = useStore((state) => state.user);
  const isAuthenticated = !!user;
  const [location, setLocation] = useState<{ country: string; region: string; city: string } | undefined>();
  const [isInitialized, setIsInitialized] = useState(false);

  // Get user location on mount
  useEffect(() => {
    getUserLocation().then(loc => {
      setLocation(loc);
      setIsInitialized(true);
    });
  }, []);

  // Generate session ID (stable for the session)
  const sessionId = useMemo(() => generateSessionId(), []);

  // Device and browser info (stable for the session)
  const deviceInfo = useMemo(() => ({
    type: detectDeviceType(),
    ...detectBrowserInfo()
  }), []);

  // Return user context
  return useMemo(() => {
    if (!isInitialized) return null;

    // For unauthenticated users, create anonymous context
    if (!isAuthenticated || !user) {
      return {
        user_id: `anonymous_${sessionId}`,
        is_authenticated: false,
        user_properties: {
          registration_date: new Date().toISOString(),
          user_type: 'client',
          location,
          device_info: deviceInfo,
          behavioral_attributes: {
            session_count: 1,
            last_login: new Date().toISOString(),
            total_bookings: 0,
            engagement_score: 10
          }
        },
        session_id: sessionId
      } as UserContext;
    }

    // For authenticated users, use actual user data
    const userProperties = {
      registration_date: user.createdAt || new Date().toISOString(),
      user_type: 'client' as 'client' | 'coach' | 'admin', // Default to client for now
      subscription_tier: 'free' as 'free' | 'premium' | 'enterprise', // Default to free for now
      location,
      device_info: deviceInfo,
      behavioral_attributes: {
        session_count: 1, // Default values for now
        last_login: new Date().toISOString(),
        total_bookings: 0,
        engagement_score: calculateEngagementScore(
          1,
          0,
          new Date().toISOString()
        )
      }
    };

    return {
      user_id: user.id,
      is_authenticated: true,
      user_properties: userProperties,
      session_id: sessionId
    } as UserContext;
  }, [user, isAuthenticated, location, deviceInfo, sessionId, isInitialized]);
}

/**
 * Hook to track user behavior for better A/B testing targeting
 */
export function useUserBehaviorTracking() {
  const userContext = useUserContext();
  
  useEffect(() => {
    if (!userContext) return;

    // Track page views
    const trackPageView = () => {
      // This would integrate with your analytics service
      console.log('Page view tracked for A/B testing:', {
        user_id: userContext.user_id,
        page: window.location.pathname,
        timestamp: new Date().toISOString()
      });
    };

    // Track time on page
    let startTime = Date.now();
    const trackTimeOnPage = () => {
      const timeSpent = Date.now() - startTime;
      console.log('Time on page:', {
        user_id: userContext.user_id,
        page: window.location.pathname,
        time_spent: timeSpent,
        timestamp: new Date().toISOString()
      });
    };

    // Initial page view
    trackPageView();

    // Track when user leaves the page
    window.addEventListener('beforeunload', trackTimeOnPage);

    return () => {
      window.removeEventListener('beforeunload', trackTimeOnPage);
      trackTimeOnPage();
    };
  }, [userContext?.user_id]);
}

/**
 * Hook to get simplified user segments for targeting
 */
export function useUserSegments(): {
  isNewUser: boolean;
  isReturningUser: boolean;
  isPremiumUser: boolean;
  isMobileUser: boolean;
  isHighEngagementUser: boolean;
  userType: 'client' | 'coach' | 'admin';
} {
  const userContext = useUserContext();
  
  return useMemo(() => {
    if (!userContext) {
      return {
        isNewUser: true,
        isReturningUser: false,
        isPremiumUser: false,
        isMobileUser: false,
        isHighEngagementUser: false,
        userType: 'client' as const
      };
    }

    const { user_properties } = userContext;
    const daysSinceRegistration = Math.floor(
      (Date.now() - new Date(user_properties.registration_date).getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      isNewUser: daysSinceRegistration <= 7,
      isReturningUser: user_properties.behavioral_attributes.session_count > 1,
      isPremiumUser: user_properties.subscription_tier === 'premium',
      isMobileUser: user_properties.device_info.type === 'mobile',
      isHighEngagementUser: user_properties.behavioral_attributes.engagement_score > 70,
      userType: user_properties.user_type
    };
  }, [userContext]);
}