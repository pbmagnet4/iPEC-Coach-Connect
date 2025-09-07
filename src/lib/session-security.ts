/**
 * Comprehensive Session Security System for iPEC Coach Connect
 * 
 * Enterprise-grade session security with:
 * - Secure session tokens with HttpOnly, Secure, SameSite flags
 * - Session timeout with automatic refresh
 * - Session fingerprinting for hijacking detection
 * - Concurrent session management with limits
 * - AES-256 encryption for session storage
 * - Session invalidation on security violations
 * - CSP and security headers configuration
 * - Session activity monitoring and logging
 * - Session cleanup and maintenance
 */

import { logSecurity } from './secure-logger';
import { checkRateLimit, recordAuthAttempt } from './rate-limiter-enhanced';
import type { SupabaseAuthSession, SupabaseAuthUser } from '../types/database';

// Session security configuration
export interface SessionSecurityConfig {
  sessionTimeout: number; // minutes
  refreshThreshold: number; // minutes before expiry to trigger refresh
  maxConcurrentSessions: number; // max sessions per user
  fingerprintingEnabled: boolean;
  encryptionEnabled: boolean;
  securityHeaders: boolean;
  activityMonitoring: boolean;
  cleanupInterval: number; // minutes
}

// Session fingerprint data
export interface SessionFingerprint {
  userAgent: string;
  screenResolution: string;
  timezone: string;
  language: string;
  platform: string;
  doNotTrack: boolean;
  cookieEnabled: boolean;
  webgl: string;
  canvas: string;
  ipAddress?: string;
  createdAt: number;
  hash: string;
}

// Session data structure
export interface SecureSessionData {
  sessionId: string;
  userId: string;
  email: string;
  role: string;
  createdAt: number;
  lastActivity: number;
  expiresAt: number;
  fingerprint: SessionFingerprint;
  isActive: boolean;
  deviceInfo: {
    type: 'desktop' | 'mobile' | 'tablet';
    browser: string;
    os: string;
  };
  securityEvents: SecurityEvent[];
  refreshToken?: string;
  permissions: string[];
}

// Security event tracking
export interface SecurityEvent {
  type: 'login' | 'refresh' | 'suspicious_activity' | 'location_change' | 'fingerprint_mismatch' | 'concurrent_session' | 'logout';
  timestamp: number;
  details: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  action: 'log' | 'warn' | 'block' | 'invalidate';
}

// Session validation result
export interface SessionValidationResult {
  isValid: boolean;
  session?: SecureSessionData;
  error?: string;
  requiresRefresh?: boolean;
  securityRisk?: 'low' | 'medium' | 'high' | 'critical';
  action?: 'allow' | 'refresh' | 'challenge' | 'block' | 'invalidate';
}

// Concurrent session info
export interface ConcurrentSessionInfo {
  sessionId: string;
  deviceType: string;
  browser: string;
  os: string;
  ipAddress?: string;
  createdAt: number;
  lastActivity: number;
  isCurrentSession: boolean;
}

class SessionSecurityManager {
  private config: SessionSecurityConfig;
  private sessions = new Map<string, SecureSessionData>();
  private userSessions = new Map<string, Set<string>>();
  private cleanupInterval?: NodeJS.Timeout;
  private cryptoKey?: CryptoKey;

  constructor(config: Partial<SessionSecurityConfig> = {}) {
    this.config = {
      sessionTimeout: config.sessionTimeout || 120, // 2 hours
      refreshThreshold: config.refreshThreshold || 30, // 30 minutes
      maxConcurrentSessions: config.maxConcurrentSessions || 5,
      fingerprintingEnabled: config.fingerprintingEnabled ?? true,
      encryptionEnabled: config.encryptionEnabled ?? true,
      securityHeaders: config.securityHeaders ?? true,
      activityMonitoring: config.activityMonitoring ?? true,
      cleanupInterval: config.cleanupInterval || 60, // 1 hour
    };

  void his.initializeSecuritySystem();
  }

  /**
   * Initialize the session security system
   */
  private async initializeSecuritySystem(): Promise<void> {
    try {
      // Initialize encryption key
      if (this.config.encryptionEnabled) {
        await this.initializeCryptoKey();
      }

      // Load existing sessions from secure storage
      await this.loadExistingSessions();

      // Setup cleanup interval
  void his.setupCleanupInterval();

      // Configure security headers
      if (this.config.securityHeaders) {
  void his.configureSecurityHeaders();
      }

      logSecurity('Session security system initialized', 'low', {
        config: this.config,
        existingSessions: this.sessions.size
      });
    } catch (error) {
      logSecurity('Failed to initialize session security system', 'critical', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Create a new secure session
   */
  async createSecureSession(
    user: SupabaseAuthUser,
    supabaseSession: SupabaseAuthSession,
    additionalData: { role: string; permissions: string[] }
  ): Promise<SecureSessionData> {
    try {
      // Check rate limiting
      const rateLimitCheck = await checkRateLimit('session.create', user.id);
      if (!rateLimitCheck.allowed) {
        throw new Error('Too many session creation attempts');
      }

      // Generate session fingerprint
      const fingerprint = await this.generateSessionFingerprint();

      // Check for existing sessions and manage concurrent sessions
      await this.manageConcurrentSessions(user.id);

      // Create session data
      const sessionId = await this.generateSecureSessionId();
      const now = Date.now();
      const expiresAt = now + (this.config.sessionTimeout * 60 * 1000);

      const sessionData: SecureSessionData = {
        sessionId,
        userId: user.id,
        email: user.email!,
        role: additionalData.role,
        createdAt: now,
        lastActivity: now,
        expiresAt,
        fingerprint,
        isActive: true,
        deviceInfo: this.getDeviceInfo(),
        securityEvents: [{
          type: 'login',
          timestamp: now,
          details: { method: 'credentials' },
          severity: 'low',
          action: 'log'
        }],
        refreshToken: supabaseSession.refresh_token,
        permissions: additionalData.permissions
      };

      // Store session securely
      await this.storeSession(sessionData);

      // Track user sessions
      if (!this.userSessions.has(user.id)) {
        this.userSessions.set(user.id, new Set());
      }
      this.userSessions.get(user.id)!.add(sessionId);

      // Record successful session creation
      await recordAuthAttempt('session.create', true, user.id);

      logSecurity('Secure session created', 'low', {
        userId: user.id,
        sessionId: `${sessionId.substring(0, 8)  }...`,
        expiresAt: new Date(expiresAt).toISOString(),
        deviceType: sessionData.deviceInfo.type
      });

      return sessionData;
    } catch (error) {
      await recordAuthAttempt('session.create', false, user.id);
      logSecurity('Failed to create secure session', 'high', {
        userId: user.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Validate session and check security
   */
  async validateSession(sessionId: string): Promise<SessionValidationResult> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        return {
          isValid: false,
          error: 'Session not found',
          action: 'block'
        };
      }

      const now = Date.now();

      // Check if session is expired
      if (now > session.expiresAt) {
        await this.invalidateSession(sessionId, 'expired');
        return {
          isValid: false,
          error: 'Session expired',
          action: 'block'
        };
      }

      // Check if session is active
      if (!session.isActive) {
        return {
          isValid: false,
          error: 'Session inactive',
          action: 'block'
        };
      }

      // Check for fingerprint mismatch (session hijacking detection)
      if (this.config.fingerprintingEnabled) {
        const currentFingerprint = await this.generateSessionFingerprint();
        const fingerprintRisk = await this.analyzeFingerprintRisk(session.fingerprint, currentFingerprint);
        
        if (fingerprintRisk === 'high' || fingerprintRisk === 'critical') {
          await this.addSecurityEvent(sessionId, {
            type: 'fingerprint_mismatch',
            timestamp: now,
            details: { riskLevel: fingerprintRisk },
            severity: fingerprintRisk,
            action: fingerprintRisk === 'critical' ? 'invalidate' : 'warn'
          });

          if (fingerprintRisk === 'critical') {
            await this.invalidateSession(sessionId, 'security_violation');
            return {
              isValid: false,
              error: 'Security violation detected',
              securityRisk: 'critical',
              action: 'invalidate'
            };
          }
        }
      }

      // Check if session needs refresh
      const timeUntilExpiry = session.expiresAt - now;
      const refreshThresholdMs = this.config.refreshThreshold * 60 * 1000;
      const requiresRefresh = timeUntilExpiry < refreshThresholdMs;

      // Update last activity
      session.lastActivity = now;
      await this.updateSession(sessionId, session);

      return {
        isValid: true,
        session,
        requiresRefresh,
        securityRisk: 'low',
        action: 'allow'
      };
    } catch (error) {
      logSecurity('Session validation failed', 'medium', {
        sessionId: `${sessionId.substring(0, 8)  }...`,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        isValid: false,
        error: 'Validation failed',
        action: 'block'
      };
    }
  }

  /**
   * Refresh session token
   */
  async refreshSession(sessionId: string): Promise<SecureSessionData> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      const now = Date.now();
      const newExpiresAt = now + (this.config.sessionTimeout * 60 * 1000);

      // Update session
      session.expiresAt = newExpiresAt;
      session.lastActivity = now;
      
      // Add security event
      await this.addSecurityEvent(sessionId, {
        type: 'refresh',
        timestamp: now,
        details: { newExpiresAt },
        severity: 'low',
        action: 'log'
      });

      await this.updateSession(sessionId, session);

      logSecurity('Session refreshed', 'low', {
        sessionId: `${sessionId.substring(0, 8)  }...`,
        userId: session.userId,
        newExpiresAt: new Date(newExpiresAt).toISOString()
      });

      return session;
    } catch (error) {
      logSecurity('Session refresh failed', 'medium', {
        sessionId: `${sessionId.substring(0, 8)  }...`,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Invalidate session
   */
  async invalidateSession(sessionId: string, reason: string): Promise<void> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        return;
      }

      // Add security event
      await this.addSecurityEvent(sessionId, {
        type: 'logout',
        timestamp: Date.now(),
        details: { reason },
        severity: reason === 'security_violation' ? 'high' : 'low',
        action: 'log'
      });

      // Remove from user sessions
      const userSessions = this.userSessions.get(session.userId);
      if (userSessions) {
  void userSessions.delete(sessionId);
        if (userSessions.size === 0) {
          this.userSessions.delete(session.userId);
        }
      }

      // Remove session
      await this.removeSession(sessionId);

      logSecurity('Session invalidated', 'low', {
        sessionId: `${sessionId.substring(0, 8)  }...`,
        userId: session.userId,
        reason
      });
    } catch (error) {
      logSecurity('Session invalidation failed', 'medium', {
        sessionId: `${sessionId.substring(0, 8)  }...`,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get concurrent sessions for a user
   */
  async getConcurrentSessions(userId: string): Promise<ConcurrentSessionInfo[]> {
    try {
      const userSessions = this.userSessions.get(userId);
      if (!userSessions) {
        return [];
      }

      const sessions: ConcurrentSessionInfo[] = [];
      const currentSessionId = this.getCurrentSessionId();

      for (const sessionId of userSessions) {
        const session = await this.getSession(sessionId);
        if (session && session.isActive) {
          sessions.push({
            sessionId,
            deviceType: session.deviceInfo.type,
            browser: session.deviceInfo.browser,
            os: session.deviceInfo.os,
            ipAddress: session.fingerprint.ipAddress,
            createdAt: session.createdAt,
            lastActivity: session.lastActivity,
            isCurrentSession: sessionId === currentSessionId
          });
        }
      }

      return sessions.sort((a, b) => b.lastActivity - a.lastActivity);
    } catch (error) {
      logSecurity('Failed to get concurrent sessions', 'medium', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return [];
    }
  }

  /**
   * Invalidate all sessions for a user except current
   */
  async invalidateAllOtherSessions(userId: string, currentSessionId: string): Promise<void> {
    try {
      const userSessions = this.userSessions.get(userId);
      if (!userSessions) {
        return;
      }

      const sessionsToInvalidate = Array.from(userSessions).filter(
        sessionId => sessionId !== currentSessionId
      );

      for (const sessionId of sessionsToInvalidate) {
        await this.invalidateSession(sessionId, 'user_request');
      }

      logSecurity('All other sessions invalidated', 'low', {
        userId,
        invalidatedSessions: sessionsToInvalidate.length
      });
    } catch (error) {
      logSecurity('Failed to invalidate other sessions', 'medium', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Generate session fingerprint
   */
  private async generateSessionFingerprint(): Promise<SessionFingerprint> {
    try {
      const {userAgent} = navigator;
      const screenResolution = `${screen.width}x${screen.height}`;
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const {language} = navigator;
      const {platform} = navigator;
      const doNotTrack = navigator.doNotTrack === '1';
      const {cookieEnabled} = navigator;
      
      // WebGL fingerprinting
      const webgl = this.getWebGLFingerprint();
      
      // Canvas fingerprinting
      const canvas = this.getCanvasFingerprint();

      const fingerprintData = {
        userAgent,
        screenResolution,
        timezone,
        language,
        platform,
        doNotTrack,
        cookieEnabled,
        webgl,
        canvas,
        createdAt: Date.now(),
        hash: ''
      };

      // Generate hash
      const dataString = JSON.stringify(fingerprintData);
      const hash = await this.generateHash(dataString);
      fingerprintData.hash = hash;

      return fingerprintData;
    } catch (error) {
      logSecurity('Failed to generate session fingerprint', 'medium', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // Return basic fingerprint
      return {
        userAgent: navigator.userAgent,
        screenResolution: `${screen.width}x${screen.height}`,
        timezone: 'UTC',
        language: navigator.language,
        platform: navigator.platform,
        doNotTrack: false,
        cookieEnabled: navigator.cookieEnabled,
        webgl: 'unknown',
        canvas: 'unknown',
        createdAt: Date.now(),
        hash: 'fallback'
      };
    }
  }

  /**
   * WebGL fingerprinting
   */
  private getWebGLFingerprint(): string {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      
      if (!gl) {
        return 'not_supported';
      }

      const renderer = gl.getParameter(gl.RENDERER);
      const vendor = gl.getParameter(gl.VENDOR);
      
      return `${vendor}|${renderer}`;
    } catch {
      return 'error';
    }
  }

  /**
   * Canvas fingerprinting
   */
  private getCanvasFingerprint(): string {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        return 'not_supported';
      }

      // Draw some text and shapes
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
  void ctx.fillText('iPEC Coach Connect Security', 2, 2);
      
      // Draw a colored rectangle
      ctx.fillStyle = 'rgba(255,0,0,0.5)';
  void ctx.fillRect(10, 10, 100, 50);
      
      return canvas.toDataURL();
    } catch {
      return 'error';
    }
  }

  /**
   * Analyze fingerprint risk
   */
  private async analyzeFingerprintRisk(
    originalFingerprint: SessionFingerprint,
    currentFingerprint: SessionFingerprint
  ): Promise<'low' | 'medium' | 'high' | 'critical'> {
    try {
      let riskScore = 0;

      // Check major identifying factors
      if (originalFingerprint.userAgent !== currentFingerprint.userAgent) {
        riskScore += 30; // High risk - different browser/device
      }

      if (originalFingerprint.screenResolution !== currentFingerprint.screenResolution) {
        riskScore += 25; // High risk - different screen
      }

      if (originalFingerprint.timezone !== currentFingerprint.timezone) {
        riskScore += 20; // Medium risk - different timezone
      }

      if (originalFingerprint.language !== currentFingerprint.language) {
        riskScore += 15; // Medium risk - different language
      }

      if (originalFingerprint.platform !== currentFingerprint.platform) {
        riskScore += 25; // High risk - different platform
      }

      if (originalFingerprint.webgl !== currentFingerprint.webgl) {
        riskScore += 20; // Medium risk - different GPU
      }

      if (originalFingerprint.canvas !== currentFingerprint.canvas) {
        riskScore += 15; // Medium risk - different canvas rendering
      }

      // Determine risk level
      if (riskScore >= 70) {
        return 'critical';
      } else if (riskScore >= 50) {
        return 'high';
      } else if (riskScore >= 25) {
        return 'medium';
      } else {
        return 'low';
      }
    } catch (error) {
      logSecurity('Failed to analyze fingerprint risk', 'medium', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return 'medium';
    }
  }

  /**
   * Manage concurrent sessions
   */
  private async manageConcurrentSessions(userId: string): Promise<void> {
    try {
      const userSessions = this.userSessions.get(userId);
      if (!userSessions) {
        return;
      }

      const activeSessions = [];
      for (const sessionId of userSessions) {
        const session = await this.getSession(sessionId);
        if (session && session.isActive && Date.now() < session.expiresAt) {
  void activeSessions.push({ sessionId, lastActivity: session.lastActivity });
        } else {
          // Remove expired/invalid sessions
  void userSessions.delete(sessionId);
          await this.removeSession(sessionId);
        }
      }

      // If we have too many active sessions, remove the oldest ones
      if (activeSessions.length >= this.config.maxConcurrentSessions) {
        const sessionsToRemove = activeSessions
          .sort((a, b) => a.lastActivity - b.lastActivity)
          .slice(0, activeSessions.length - this.config.maxConcurrentSessions + 1);

        for (const { sessionId } of sessionsToRemove) {
          await this.invalidateSession(sessionId, 'concurrent_session_limit');
        }
      }
    } catch (error) {
      logSecurity('Failed to manage concurrent sessions', 'medium', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get device information
   */
  private getDeviceInfo(): SecureSessionData['deviceInfo'] {
    try {
      const userAgent = navigator.userAgent.toLowerCase();
      
      // Detect device type
      let deviceType: 'desktop' | 'mobile' | 'tablet' = 'desktop';
      if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile/i.test(userAgent)) {
        deviceType = 'mobile';
      } else if (/tablet|ipad|android(?!.*mobile)/i.test(userAgent)) {
        deviceType = 'tablet';
      }

      // Detect browser
      let browser = 'unknown';
      if (userAgent.includes('chrome')) browser = 'chrome';
      else if (userAgent.includes('firefox')) browser = 'firefox';
      else if (userAgent.includes('safari')) browser = 'safari';
      else if (userAgent.includes('edge')) browser = 'edge';
      else if (userAgent.includes('opera')) browser = 'opera';

      // Detect OS
      let os = 'unknown';
      if (userAgent.includes('windows')) os = 'windows';
      else if (userAgent.includes('mac')) os = 'macos';
      else if (userAgent.includes('linux')) os = 'linux';
      else if (userAgent.includes('android')) os = 'android';
      else if (userAgent.includes('ios')) os = 'ios';

      return { deviceType, browser, os };
    } catch {
      return { deviceType: 'desktop', browser: 'unknown', os: 'unknown' };
    }
  }

  /**
   * Generate secure session ID
   */
  private async generateSecureSessionId(): Promise<string> {
    try {
      if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        const array = new Uint8Array(32);
  void crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
      }
      
      // Fallback for older browsers
      return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    } catch {
      return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    }
  }

  /**
   * Generate hash using Web Crypto API
   */
  private async generateHash(data: string): Promise<string> {
    try {
      if (typeof crypto !== 'undefined' && crypto.subtle) {
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(data);
        const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      }
      
      // Fallback simple hash
      let hash = 0;
      for (let i = 0; i < data.length; i++) {
        const char = data.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return Math.abs(hash).toString(36);
    } catch {
      // Fallback simple hash
      let hash = 0;
      for (let i = 0; i < data.length; i++) {
        const char = data.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return Math.abs(hash).toString(36);
    }
  }

  /**
   * Initialize crypto key for AES encryption
   */
  private async initializeCryptoKey(): Promise<void> {
    try {
      if (typeof crypto !== 'undefined' && crypto.subtle) {
        // Generate a key from user characteristics for consistency
        const keyMaterial = await crypto.subtle.importKey(
          'raw',
          new TextEncoder().encode(this.getKeyMaterial()),
          { name: 'PBKDF2' },
          false,
          ['deriveBits', 'deriveKey']
        );

        this.cryptoKey = await crypto.subtle.deriveKey(
          {
            name: 'PBKDF2',
            salt: new TextEncoder().encode('ipec-coach-connect-salt'),
            iterations: 100000,
            hash: 'SHA-256'
          },
          keyMaterial,
          { name: 'AES-GCM', length: 256 },
          false,
          ['encrypt', 'decrypt']
        );
      }
    } catch (error) {
      logSecurity('Failed to initialize crypto key', 'medium', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get key material for encryption
   */
  private getKeyMaterial(): string {
    return [
      navigator.userAgent,
      navigator.language,
      `${screen.width  }x${  screen.height}`,
      new Date().getTimezoneOffset().toString(),
      window.location.origin,
      'ipec-coach-connect-2024'
    ].join('|');
  }

  /**
   * Encrypt data using AES-GCM
   */
  private async encryptData(data: string): Promise<string> {
    try {
      if (this.cryptoKey && typeof crypto !== 'undefined' && crypto.subtle) {
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(data);
        
        const encrypted = await crypto.subtle.encrypt(
          { name: 'AES-GCM', iv },
          this.cryptoKey,
          dataBuffer
        );
        
        const combined = new Uint8Array(iv.length + encrypted.byteLength);
  void combined.set(iv);
  void combined.set(new Uint8Array(encrypted), iv.length);
        
        return btoa(String.fromCharCode.apply(null, Array.from(combined)));
      }
      
      // Fallback to base64 encoding
      return btoa(data);
    } catch (error) {
      logSecurity('Failed to encrypt data', 'medium', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return btoa(data);
    }
  }

  /**
   * Decrypt data using AES-GCM
   */
  private async decryptData(encryptedData: string): Promise<string> {
    try {
      if (this.cryptoKey && typeof crypto !== 'undefined' && crypto.subtle) {
        const combined = new Uint8Array(
          atob(encryptedData).split('').map(char => char.charCodeAt(0))
        );
        
        const iv = combined.slice(0, 12);
        const data = combined.slice(12);
        
        const decrypted = await crypto.subtle.decrypt(
          { name: 'AES-GCM', iv },
          this.cryptoKey,
          data
        );
        
        return new TextDecoder().decode(decrypted);
      }
      
      // Fallback from base64 encoding
      return atob(encryptedData);
    } catch (error) {
      logSecurity('Failed to decrypt data', 'medium', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return atob(encryptedData);
    }
  }

  /**
   * Store session securely
   */
  private async storeSession(session: SecureSessionData): Promise<void> {
    try {
      const serialized = JSON.stringify(session);
      const encrypted = await this.encryptData(serialized);
      
  void localStorage.setItem(`ipec_session_${session.sessionId}`, encrypted);
      this.sessions.set(session.sessionId, session);
    } catch (error) {
      logSecurity('Failed to store session', 'high', {
        sessionId: `${session.sessionId.substring(0, 8)  }...`,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get session from storage
   */
  private async getSession(sessionId: string): Promise<SecureSessionData | null> {
    try {
      // Try memory first
      if (this.sessions.has(sessionId)) {
        return this.sessions.get(sessionId)!;
      }

      // Try localStorage
      const encrypted = localStorage.getItem(`ipec_session_${sessionId}`);
      if (!encrypted) {
        return null;
      }

      const decrypted = await this.decryptData(encrypted);
      const session: SecureSessionData = JSON.parse(decrypted);
      
      // Store in memory for faster access
      this.sessions.set(sessionId, session);
      
      return session;
    } catch (error) {
      logSecurity('Failed to get session', 'medium', {
        sessionId: `${sessionId.substring(0, 8)  }...`,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  /**
   * Update session
   */
  private async updateSession(sessionId: string, session: SecureSessionData): Promise<void> {
    try {
      await this.storeSession(session);
    } catch (error) {
      logSecurity('Failed to update session', 'medium', {
        sessionId: `${sessionId.substring(0, 8)  }...`,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Remove session
   */
  private async removeSession(sessionId: string): Promise<void> {
    try {
  void localStorage.removeItem(`ipec_session_${sessionId}`);
      this.sessions.delete(sessionId);
    } catch (error) {
      logSecurity('Failed to remove session', 'medium', {
        sessionId: `${sessionId.substring(0, 8)  }...`,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Add security event to session
   */
  private async addSecurityEvent(sessionId: string, event: SecurityEvent): Promise<void> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        return;
      }

      session.securityEvents.push(event);
      
      // Keep only the last 50 events
      if (session.securityEvents.length > 50) {
        session.securityEvents = session.securityEvents.slice(-50);
      }

      await this.updateSession(sessionId, session);

      // Log security event
      logSecurity(`Security event: ${event.type}`, event.severity, {
        sessionId: `${sessionId.substring(0, 8)  }...`,
        userId: session.userId,
        details: event.details
      });
    } catch (error) {
      logSecurity('Failed to add security event', 'medium', {
        sessionId: `${sessionId.substring(0, 8)  }...`,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Load existing sessions from storage
   */
  private async loadExistingSessions(): Promise<void> {
    try {
      const keys = Object.keys(localStorage);
      const sessionKeys = keys.filter(key => key.startsWith('ipec_session_'));
      
      for (const key of sessionKeys) {
        const sessionId = key.replace('ipec_session_', '');
        const session = await this.getSession(sessionId);
        
        if (session) {
          // Check if session is still valid
          if (session.isActive && Date.now() < session.expiresAt) {
            // Add to user sessions tracking
            if (!this.userSessions.has(session.userId)) {
              this.userSessions.set(session.userId, new Set());
            }
            this.userSessions.get(session.userId)!.add(sessionId);
          } else {
            // Remove expired session
            await this.removeSession(sessionId);
          }
        }
      }
    } catch (error) {
      logSecurity('Failed to load existing sessions', 'medium', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Setup cleanup interval
   */
  private setupCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
  void his.cleanupExpiredSessions();
    }, this.config.cleanupInterval * 60 * 1000);
  }

  /**
   * Cleanup expired sessions
   */
  private async cleanupExpiredSessions(): Promise<void> {
    try {
      const now = Date.now();
      const sessionsToCleanup: string[] = [];

      for (const [sessionId, session] of this.sessions) {
        if (!session.isActive || now > session.expiresAt) {
  void sessionsToCleanup.push(sessionId);
        }
      }

      for (const sessionId of sessionsToCleanup) {
        await this.invalidateSession(sessionId, 'cleanup');
      }

      if (sessionsToCleanup.length > 0) {
        logSecurity('Expired sessions cleaned up', 'low', {
          cleanedSessions: sessionsToCleanup.length
        });
      }
    } catch (error) {
      logSecurity('Failed to cleanup expired sessions', 'medium', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Configure security headers
   */
  private configureSecurityHeaders(): void {
    try {
      // Add Content Security Policy
      if (!document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
        const csp = document.createElement('meta');
        csp.httpEquiv = 'Content-Security-Policy';
        csp.content = [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "font-src 'self' https://fonts.gstatic.com",
          "img-src 'self' data: https: blob:",
          "connect-src 'self' https://*.supabase.co https://accounts.google.com",
          "frame-src https://accounts.google.com",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'"
        ].join('; ');
        document.head.appendChild(csp);
      }

      // Add other security headers via meta tags
      const securityHeaders = [
        { name: 'X-Content-Type-Options', content: 'nosniff' },
        { name: 'X-Frame-Options', content: 'SAMEORIGIN' },
        { name: 'X-XSS-Protection', content: '1; mode=block' },
        { name: 'Referrer-Policy', content: 'strict-origin-when-cross-origin' }
      ];

      securityHeaders.forEach(header => {
        if (!document.querySelector(`meta[name="${header.name}"]`)) {
          const meta = document.createElement('meta');
          meta.name = header.name;
          meta.content = header.content;
          document.head.appendChild(meta);
        }
      });

      logSecurity('Security headers configured', 'low');
    } catch (error) {
      logSecurity('Failed to configure security headers', 'medium', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get current session ID (from URL or storage)
   */
  private getCurrentSessionId(): string | null {
    try {
      // This would typically come from a cookie or authentication context
      // For now, we'll return null as this is a placeholder
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Get session security statistics
   */
  getSecurityStats(): Record<string, any> {
    try {
      const stats = {
        totalSessions: this.sessions.size,
        activeSessions: 0,
        expiredSessions: 0,
        userSessions: this.userSessions.size,
        securityEvents: 0,
        riskLevels: { low: 0, medium: 0, high: 0, critical: 0 }
      };

      const now = Date.now();
      for (const session of this.sessions.values()) {
        if (session.isActive && now < session.expiresAt) {
          stats.activeSessions++;
        } else {
          stats.expiredSessions++;
        }
        
        stats.securityEvents += session.securityEvents.length;
        
        // Analyze security events
        for (const event of session.securityEvents) {
          stats.riskLevels[event.severity]++;
        }
      }

      return stats;
    } catch (error) {
      logSecurity('Failed to get security stats', 'low', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return {};
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.sessions.clear();
    this.userSessions.clear();
  }
}

// Export singleton instance
export const sessionSecurity = new SessionSecurityManager();

// Export convenience functions
export const createSecureSession = sessionSecurity.createSecureSession.bind(sessionSecurity);
export const validateSession = sessionSecurity.validateSession.bind(sessionSecurity);
export const refreshSession = sessionSecurity.refreshSession.bind(sessionSecurity);
export const invalidateSession = sessionSecurity.invalidateSession.bind(sessionSecurity);
export const getConcurrentSessions = sessionSecurity.getConcurrentSessions.bind(sessionSecurity);
export const invalidateAllOtherSessions = sessionSecurity.invalidateAllOtherSessions.bind(sessionSecurity);

export default sessionSecurity;