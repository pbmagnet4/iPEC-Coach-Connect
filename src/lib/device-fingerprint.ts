/**
 * Device Fingerprinting Utility for iPEC Coach Connect
 * 
 * Generates unique device fingerprints for MFA device trust functionality.
 * Uses multiple browser characteristics to create a reasonably unique identifier
 * while respecting user privacy.
 */

// Device fingerprint components
interface FingerprintComponents {
  userAgent: string;
  language: string;
  platform: string;
  cookieEnabled: boolean;
  screen: {
    width: number;
    height: number;
    colorDepth: number;
    pixelRatio: number;
  };
  timezone: string;
  touchSupport: boolean;
  webGLSupport: boolean;
  localStorage: boolean;
  sessionStorage: boolean;
  indexedDB: boolean;
  doNotTrack: string | null;
  hardwareConcurrency: number;
  maxTouchPoints: number;
}

/**
 * Generate a unique device fingerprint
 */
export async function generateDeviceFingerprint(): Promise<string> {
  try {
    const components = await collectFingerprintComponents();
    const fingerprintString = JSON.stringify(components);
    
    // Generate hash of the fingerprint components
    const hash = await hashString(fingerprintString);
    
    return hash.substring(0, 32); // Return first 32 characters
  } catch (error) {
    // Fallback to a random identifier if fingerprinting fails
    console.warn('Device fingerprinting failed, using fallback:', error);
    return generateFallbackFingerprint();
  }
}

/**
 * Collect all available fingerprint components
 */
async function collectFingerprintComponents(): Promise<FingerprintComponents> {
  const components: FingerprintComponents = {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    cookieEnabled: navigator.cookieEnabled,
    screen: {
      width: screen.width,
      height: screen.height,
      colorDepth: screen.colorDepth,
      pixelRatio: window.devicePixelRatio,
    },
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    webGLSupport: await hasWebGLSupport(),
    localStorage: hasLocalStorage(),
    sessionStorage: hasSessionStorage(),
    indexedDB: hasIndexedDB(),
    doNotTrack: navigator.doNotTrack,
    hardwareConcurrency: navigator.hardwareConcurrency || 1,
    maxTouchPoints: navigator.maxTouchPoints || 0,
  };

  return components;
}

/**
 * Check if WebGL is supported
 */
async function hasWebGLSupport(): Promise<boolean> {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return !!gl;
  } catch {
    return false;
  }
}

/**
 * Check if localStorage is supported and accessible
 */
function hasLocalStorage(): boolean {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if sessionStorage is supported and accessible
 */
function hasSessionStorage(): boolean {
  try {
    const test = '__storage_test__';
    sessionStorage.setItem(test, test);
    sessionStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if IndexedDB is supported
 */
function hasIndexedDB(): boolean {
  try {
    return !!window.indexedDB;
  } catch {
    return false;
  }
}

/**
 * Generate SHA-256 hash of a string
 */
async function hashString(str: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } else {
    // Fallback simple hash for environments without crypto.subtle
    return simpleHash(str);
  }
}

/**
 * Simple hash function fallback
 */
function simpleHash(str: string): string {
  let hash = 0;
  if (str.length === 0) return hash.toString();
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return Math.abs(hash).toString(16);
}

/**
 * Generate a fallback fingerprint when normal fingerprinting fails
 */
function generateFallbackFingerprint(): string {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 15);
  const userAgent = navigator.userAgent.substring(0, 50);
  
  return btoa(`${timestamp}_${random}_${userAgent}`).substring(0, 32);
}

/**
 * Validate a device fingerprint format
 */
export function isValidFingerprint(fingerprint: string): boolean {
  if (typeof fingerprint !== 'string') return false;
  if (fingerprint.length < 8 || fingerprint.length > 64) return false;
  
  // Should only contain alphanumeric characters and basic symbols
  return /^[a-zA-Z0-9_\-+/=]+$/.test(fingerprint);
}

/**
 * Get device information for display purposes
 */
export function getDeviceInfo(): {
  name: string;
  type: 'desktop' | 'tablet' | 'mobile';
  browser: string;
  os: string;
} {
  const {userAgent} = navigator;
  
  // Detect device type
  let type: 'desktop' | 'tablet' | 'mobile' = 'desktop';
  if (/iPad/.test(userAgent)) {
    type = 'tablet';
  } else if (/Mobile|Android|iPhone/.test(userAgent)) {
    type = 'mobile';
  }

  // Detect browser
  let browser = 'Unknown';
  if (/Chrome/.test(userAgent) && !/Edg|OPR/.test(userAgent)) {
    browser = 'Chrome';
  } else if (/Firefox/.test(userAgent)) {
    browser = 'Firefox';
  } else if (/Safari/.test(userAgent) && !/Chrome/.test(userAgent)) {
    browser = 'Safari';
  } else if (/Edg/.test(userAgent)) {
    browser = 'Edge';
  } else if (/OPR/.test(userAgent)) {
    browser = 'Opera';
  }

  // Detect OS
  let os = 'Unknown';
  if (/Windows/.test(userAgent)) {
    os = 'Windows';
  } else if (/Mac OS/.test(userAgent)) {
    os = 'macOS';
  } else if (/Linux/.test(userAgent)) {
    os = 'Linux';
  } else if (/Android/.test(userAgent)) {
    os = 'Android';
  } else if (/iOS|iPhone|iPad/.test(userAgent)) {
    os = 'iOS';
  }

  // Generate device name
  const name = `${browser} on ${os}`;

  return { name, type, browser, os };
}

/**
 * Check if two fingerprints are similar enough to be considered the same device
 * This helps handle minor changes in device configuration
 */
export function areFingerprintsSimilar(
  fingerprint1: string, 
  fingerprint2: string, 
  threshold = 0.9
): boolean {
  if (fingerprint1 === fingerprint2) return true;
  
  // Simple Jaccard similarity for the fingerprints
  const set1 = new Set(fingerprint1.split(''));
  const set2 = new Set(fingerprint2.split(''));
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  const similarity = intersection.size / union.size;
  
  return similarity >= threshold;
}

// Privacy-conscious fingerprinting note:
// This fingerprinting implementation balances security needs with privacy concerns.
// It doesn't use techniques that could be considered invasive (like canvas fingerprinting
// or audio fingerprinting) and focuses on stable, legitimate browser characteristics.
// The fingerprint is used solely for MFA device trust and is not shared with third parties.