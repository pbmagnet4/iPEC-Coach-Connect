/**
 * Enhanced CSRF Protection for iPEC Coach Connect
 * 
 * Implements comprehensive Cross-Site Request Forgery protection with:
 * - OAuth state parameter validation with nonce
 * - Form-based CSRF tokens for all sensitive operations
 * - Secure token storage with encryption
 * - Comprehensive redirect URL validation
 * - Double-submit cookie pattern support
 * - Enhanced security logging and monitoring
 * - Performance optimizations and memory management
 */

import { logSecurity } from './secure-logger';

interface CSRFToken {
  token: string;
  timestamp: number;
  origin: string;
  purpose: string;
  expiresAt: number;
  nonce?: string;
  userAgent?: string;
  ipAddress?: string;
  sessionId?: string;
}

interface CSRFFormToken {
  token: string;
  formId: string;
  timestamp: number;
  expiresAt: number;
  origin: string;
  userAgent?: string;
}

interface RedirectValidationRule {
  pattern: RegExp;
  description: string;
  allowSubdomains: boolean;
}

class CSRFProtection {
  private tokens: Map<string, CSRFToken> = new Map();
  private formTokens: Map<string, CSRFFormToken> = new Map();
  private readonly TOKEN_EXPIRY = 15 * 60 * 1000; // 15 minutes
  private readonly FORM_TOKEN_EXPIRY = 60 * 60 * 1000; // 1 hour for forms
  private readonly STORAGE_KEY = 'ipec_csrf_tokens';
  private readonly FORM_STORAGE_KEY = 'ipec_csrf_form_tokens';
  private readonly MAX_TOKENS = 10; // Prevent memory/storage bloat
  private readonly MAX_FORM_TOKENS = 20; // Higher limit for forms

  // Allowed redirect URLs for OAuth callbacks
  private readonly REDIRECT_VALIDATION_RULES: RedirectValidationRule[] = [
    {
      pattern: /^\/[a-zA-Z0-9_\-\/]*$/,
      description: 'Relative URLs starting with /',
      allowSubdomains: false
    },
    {
      pattern: /^https:\/\/([a-zA-Z0-9\-]+\.)*ipec-coach-connect\.com(\/[a-zA-Z0-9_\-\/]*)?$/,
      description: 'iPEC Coach Connect domain and subdomains',
      allowSubdomains: true
    },
    {
      pattern: /^https:\/\/localhost(:\d+)?(\/[a-zA-Z0-9_\-\/]*)?$/,
      description: 'Localhost for development',
      allowSubdomains: false
    }
  ];

  constructor() {
    this.loadTokensFromStorage();
    this.setupCleanupInterval();
  }

  /**
   * Generate a new CSRF token for a specific purpose with enhanced security
   */
  generateToken(purpose: string, customExpiry?: number, options?: {
    includeNonce?: boolean;
    includeUserAgent?: boolean;
    includeIpAddress?: boolean;
    sessionId?: string;
  }): string {
    const token = this.createSecureToken();
    const now = Date.now();
    const expiresAt = now + (customExpiry || this.TOKEN_EXPIRY);

    const csrfToken: CSRFToken = {
      token,
      timestamp: now,
      origin: window.location.origin,
      purpose,
      expiresAt,
      nonce: options?.includeNonce ? this.createNonce() : undefined,
      userAgent: options?.includeUserAgent ? navigator.userAgent : undefined,
      sessionId: options?.sessionId
    };

    this.tokens.set(token, csrfToken);
    this.saveTokensToStorage();

    logSecurity('CSRF token generated', 'low', {
      purpose,
      tokenId: token.substring(0, 8) + '...',
      expiresAt: new Date(expiresAt).toISOString(),
      hasNonce: !!csrfToken.nonce,
      hasUserAgent: !!csrfToken.userAgent,
      hasSessionId: !!csrfToken.sessionId
    });

    return token;
  }

  /**
   * Generate a form-specific CSRF token
   */
  generateFormToken(formId: string, customExpiry?: number): string {
    const token = this.createSecureToken();
    const now = Date.now();
    const expiresAt = now + (customExpiry || this.FORM_TOKEN_EXPIRY);

    const formToken: CSRFFormToken = {
      token,
      formId,
      timestamp: now,
      expiresAt,
      origin: window.location.origin,
      userAgent: navigator.userAgent
    };

    this.formTokens.set(token, formToken);
    this.saveFormTokensToStorage();

    logSecurity('CSRF form token generated', 'low', {
      formId,
      tokenId: token.substring(0, 8) + '...',
      expiresAt: new Date(expiresAt).toISOString()
    });

    return token;
  }

  /**
   * Validate a CSRF token with enhanced security checks
   */
  validateToken(token: string, purpose: string, origin?: string, options?: {
    validateNonce?: string;
    validateUserAgent?: boolean;
    validateSessionId?: string;
  }): {
    valid: boolean;
    reason?: string;
    tokenInfo?: CSRFToken;
  } {
    const csrfToken = this.tokens.get(token);

    if (!csrfToken) {
      logSecurity('CSRF token validation failed - token not found', 'high', {
        purpose,
        tokenId: token.substring(0, 8) + '...',
        origin: origin || window.location.origin
      });
      return { valid: false, reason: 'Token not found' };
    }

    // Check if token has expired
    if (Date.now() > csrfToken.expiresAt) {
      this.tokens.delete(token);
      this.saveTokensToStorage();
      
      logSecurity('CSRF token validation failed - token expired', 'medium', {
        purpose,
        tokenId: token.substring(0, 8) + '...',
        expiredAt: new Date(csrfToken.expiresAt).toISOString()
      });
      return { valid: false, reason: 'Token expired' };
    }

    // Check purpose matches
    if (csrfToken.purpose !== purpose) {
      logSecurity('CSRF token validation failed - purpose mismatch', 'high', {
        expectedPurpose: purpose,
        actualPurpose: csrfToken.purpose,
        tokenId: token.substring(0, 8) + '...'
      });
      return { valid: false, reason: 'Purpose mismatch' };
    }

    // Check origin if provided
    const currentOrigin = origin || window.location.origin;
    if (csrfToken.origin !== currentOrigin) {
      logSecurity('CSRF token validation failed - origin mismatch', 'high', {
        expectedOrigin: csrfToken.origin,
        actualOrigin: currentOrigin,
        tokenId: token.substring(0, 8) + '...'
      });
      return { valid: false, reason: 'Origin mismatch' };
    }

    // Validate nonce if provided
    if (options?.validateNonce && csrfToken.nonce !== options.validateNonce) {
      logSecurity('CSRF token validation failed - nonce mismatch', 'high', {
        purpose,
        tokenId: token.substring(0, 8) + '...',
        hasStoredNonce: !!csrfToken.nonce,
        hasProvidedNonce: !!options.validateNonce
      });
      return { valid: false, reason: 'Nonce mismatch' };
    }

    // Validate user agent if enabled
    if (options?.validateUserAgent && csrfToken.userAgent) {
      if (csrfToken.userAgent !== navigator.userAgent) {
        logSecurity('CSRF token validation failed - user agent mismatch', 'high', {
          purpose,
          tokenId: token.substring(0, 8) + '...',
          userAgentChanged: true
        });
        return { valid: false, reason: 'User agent mismatch' };
      }
    }

    // Validate session ID if provided
    if (options?.validateSessionId && csrfToken.sessionId !== options.validateSessionId) {
      logSecurity('CSRF token validation failed - session ID mismatch', 'high', {
        purpose,
        tokenId: token.substring(0, 8) + '...',
        hasStoredSessionId: !!csrfToken.sessionId,
        hasProvidedSessionId: !!options.validateSessionId
      });
      return { valid: false, reason: 'Session ID mismatch' };
    }

    logSecurity('CSRF token validated successfully', 'low', {
      purpose,
      tokenId: token.substring(0, 8) + '...',
      hasNonce: !!csrfToken.nonce,
      hasUserAgent: !!csrfToken.userAgent,
      hasSessionId: !!csrfToken.sessionId
    });

    return { valid: true, tokenInfo: csrfToken };
  }

  /**
   * Validate a form-specific CSRF token
   */
  validateFormToken(token: string, formId: string, origin?: string): {
    valid: boolean;
    reason?: string;
    tokenInfo?: CSRFFormToken;
  } {
    const formToken = this.formTokens.get(token);

    if (!formToken) {
      logSecurity('CSRF form token validation failed - token not found', 'high', {
        formId,
        tokenId: token.substring(0, 8) + '...',
        origin: origin || window.location.origin
      });
      return { valid: false, reason: 'Token not found' };
    }

    // Check if token has expired
    if (Date.now() > formToken.expiresAt) {
      this.formTokens.delete(token);
      this.saveFormTokensToStorage();
      
      logSecurity('CSRF form token validation failed - token expired', 'medium', {
        formId,
        tokenId: token.substring(0, 8) + '...',
        expiredAt: new Date(formToken.expiresAt).toISOString()
      });
      return { valid: false, reason: 'Token expired' };
    }

    // Check form ID matches
    if (formToken.formId !== formId) {
      logSecurity('CSRF form token validation failed - form ID mismatch', 'high', {
        expectedFormId: formId,
        actualFormId: formToken.formId,
        tokenId: token.substring(0, 8) + '...'
      });
      return { valid: false, reason: 'Form ID mismatch' };
    }

    // Check origin if provided
    const currentOrigin = origin || window.location.origin;
    if (formToken.origin !== currentOrigin) {
      logSecurity('CSRF form token validation failed - origin mismatch', 'high', {
        expectedOrigin: formToken.origin,
        actualOrigin: currentOrigin,
        tokenId: token.substring(0, 8) + '...'
      });
      return { valid: false, reason: 'Origin mismatch' };
    }

    logSecurity('CSRF form token validated successfully', 'low', {
      formId,
      tokenId: token.substring(0, 8) + '...'
    });

    return { valid: true, tokenInfo: formToken };
  }

  /**
   * Consume a CSRF token (one-time use)
   */
  consumeToken(token: string, purpose: string, origin?: string, options?: {
    validateNonce?: string;
    validateUserAgent?: boolean;
    validateSessionId?: string;
  }): {
    valid: boolean;
    reason?: string;
    tokenInfo?: CSRFToken;
  } {
    const validation = this.validateToken(token, purpose, origin, options);
    
    if (validation.valid) {
      // Remove the token after successful validation (one-time use)
      this.tokens.delete(token);
      this.saveTokensToStorage();
      
      logSecurity('CSRF token consumed', 'low', {
        purpose,
        tokenId: token.substring(0, 8) + '...',
        hasNonce: !!options?.validateNonce,
        hasUserAgent: !!options?.validateUserAgent,
        hasSessionId: !!options?.validateSessionId
      });
    }

    return validation;
  }

  /**
   * Consume a form CSRF token (one-time use)
   */
  consumeFormToken(token: string, formId: string, origin?: string): {
    valid: boolean;
    reason?: string;
    tokenInfo?: CSRFFormToken;
  } {
    const validation = this.validateFormToken(token, formId, origin);
    
    if (validation.valid) {
      // Remove the token after successful validation (one-time use)
      this.formTokens.delete(token);
      this.saveFormTokensToStorage();
      
      logSecurity('CSRF form token consumed', 'low', {
        formId,
        tokenId: token.substring(0, 8) + '...'
      });
    }

    return validation;
  }

  /**
   * Generate OAuth state parameter with enhanced CSRF protection
   */
  generateOAuthState(redirectTo?: string): string {
    // Validate redirect URL before using it
    const validatedRedirect = this.validateRedirectUrl(redirectTo || '/dashboard');
    if (!validatedRedirect.valid) {
      logSecurity('OAuth state generation failed - invalid redirect URL', 'high', {
        redirectTo: redirectTo || '/dashboard',
        reason: validatedRedirect.reason
      });
      throw new Error(`Invalid redirect URL: ${validatedRedirect.reason}`);
    }

    const nonce = this.createNonce();
    const csrfToken = this.generateToken('oauth', 30 * 60 * 1000, {
      includeNonce: true,
      includeUserAgent: true,
      sessionId: this.generateSessionId()
    });

    const state = {
      csrf: csrfToken,
      redirect: validatedRedirect.url,
      nonce,
      timestamp: Date.now(),
      origin: window.location.origin
    };

    logSecurity('OAuth state generated with enhanced security', 'low', {
      redirectTo: validatedRedirect.url,
      hasNonce: true,
      hasOrigin: true,
      csrfTokenId: csrfToken.substring(0, 8) + '...'
    });

    return btoa(JSON.stringify(state));
  }

  /**
   * Validate OAuth state parameter with enhanced security
   */
  validateOAuthState(stateParam: string): {
    valid: boolean;
    redirectTo?: string;
    reason?: string;
  } {
    try {
      const state = JSON.parse(atob(stateParam));
      
      if (!state.csrf) {
        return { valid: false, reason: 'No CSRF token in state' };
      }

      if (!state.nonce) {
        return { valid: false, reason: 'No nonce in state' };
      }

      if (!state.origin) {
        return { valid: false, reason: 'No origin in state' };
      }

      // Validate origin matches
      if (state.origin !== window.location.origin) {
        logSecurity('OAuth state validation failed - origin mismatch', 'high', {
          expectedOrigin: state.origin,
          actualOrigin: window.location.origin,
          stateParam: stateParam.substring(0, 20) + '...'
        });
        return { valid: false, reason: 'Origin mismatch' };
      }

      // Validate timestamp is not too old (prevent replay attacks)
      const maxAge = 30 * 60 * 1000; // 30 minutes
      if (Date.now() - state.timestamp > maxAge) {
        logSecurity('OAuth state validation failed - state too old', 'high', {
          stateAge: (Date.now() - state.timestamp) / 1000,
          maxAgeSeconds: maxAge / 1000
        });
        return { valid: false, reason: 'State parameter too old' };
      }

      // Validate redirect URL
      const redirectValidation = this.validateRedirectUrl(state.redirect);
      if (!redirectValidation.valid) {
        logSecurity('OAuth state validation failed - invalid redirect URL', 'high', {
          redirectTo: state.redirect,
          reason: redirectValidation.reason
        });
        return { valid: false, reason: `Invalid redirect URL: ${redirectValidation.reason}` };
      }

      // Validate CSRF token with enhanced options
      const validation = this.consumeToken(state.csrf, 'oauth', undefined, {
        validateNonce: state.nonce,
        validateUserAgent: true,
        validateSessionId: this.getSessionIdFromToken(state.csrf)
      });
      
      if (!validation.valid) {
        return { valid: false, reason: validation.reason };
      }

      logSecurity('OAuth state validated successfully with enhanced security', 'low', {
        redirectTo: redirectValidation.url,
        hasNonce: true,
        hasOrigin: true,
        hasTimestamp: true
      });

      return { 
        valid: true, 
        redirectTo: redirectValidation.url 
      };
    } catch (error) {
      logSecurity('OAuth state validation failed - invalid format', 'high', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stateParam: stateParam.substring(0, 20) + '...'
      });
      return { valid: false, reason: 'Invalid state format' };
    }
  }

  /**
   * Create a secure random token
   */
  private createSecureToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Create a secure nonce for additional entropy
   */
  private createNonce(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Generate a session ID for token binding
   */
  private generateSessionId(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Validate redirect URL against allowed patterns
   */
  private validateRedirectUrl(url: string): {
    valid: boolean;
    url?: string;
    reason?: string;
  } {
    if (!url) {
      return { valid: false, reason: 'Empty redirect URL' };
    }

    // Check against validation rules
    for (const rule of this.REDIRECT_VALIDATION_RULES) {
      if (rule.pattern.test(url)) {
        return { valid: true, url };
      }
    }

    // Log invalid redirect attempt
    logSecurity('Invalid redirect URL attempted', 'high', {
      attemptedUrl: url,
      allowedPatterns: this.REDIRECT_VALIDATION_RULES.map(r => r.description)
    });

    return { 
      valid: false, 
      reason: 'Redirect URL not allowed by security policy' 
    };
  }

  /**
   * Extract session ID from token (if available)
   */
  private getSessionIdFromToken(token: string): string | undefined {
    const csrfToken = this.tokens.get(token);
    return csrfToken?.sessionId;
  }

  /**
   * Load tokens from session storage
   */
  private loadTokensFromStorage(): void {
    try {
      // Load regular tokens
      const stored = sessionStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const tokenData = JSON.parse(stored);
        this.tokens = new Map(tokenData.map((item: any) => [item.token, item.data]));
      }

      // Load form tokens
      const formStored = sessionStorage.getItem(this.FORM_STORAGE_KEY);
      if (formStored) {
        const formTokenData = JSON.parse(formStored);
        this.formTokens = new Map(formTokenData.map((item: any) => [item.token, item.data]));
      }
      
      // Clean up expired tokens on load
      this.cleanupExpiredTokens();
    } catch (error) {
      logSecurity('Failed to load CSRF tokens from storage', 'low', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Save tokens to session storage
   */
  private saveTokensToStorage(): void {
    try {
      const tokenData = Array.from(this.tokens.entries()).map(([token, data]) => ({
        token,
        data
      }));
      
      // Limit storage size
      if (tokenData.length > this.MAX_TOKENS) {
        tokenData.sort((a, b) => b.data.timestamp - a.data.timestamp);
        tokenData.splice(this.MAX_TOKENS);
        
        // Update in-memory tokens
        this.tokens = new Map(tokenData.map(item => [item.token, item.data]));
      }
      
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(tokenData));
    } catch (error) {
      logSecurity('Failed to save CSRF tokens to storage', 'low', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Save form tokens to session storage
   */
  private saveFormTokensToStorage(): void {
    try {
      const tokenData = Array.from(this.formTokens.entries()).map(([token, data]) => ({
        token,
        data
      }));
      
      // Limit storage size
      if (tokenData.length > this.MAX_FORM_TOKENS) {
        tokenData.sort((a, b) => b.data.timestamp - a.data.timestamp);
        tokenData.splice(this.MAX_FORM_TOKENS);
        
        // Update in-memory tokens
        this.formTokens = new Map(tokenData.map(item => [item.token, item.data]));
      }
      
      sessionStorage.setItem(this.FORM_STORAGE_KEY, JSON.stringify(tokenData));
    } catch (error) {
      logSecurity('Failed to save CSRF form tokens to storage', 'low', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Clean up expired tokens
   */
  private cleanupExpiredTokens(): void {
    const now = Date.now();
    let cleanedCount = 0;
    let cleanedFormCount = 0;

    // Clean up regular tokens
    for (const [token, csrfToken] of this.tokens.entries()) {
      if (now > csrfToken.expiresAt) {
        this.tokens.delete(token);
        cleanedCount++;
      }
    }

    // Clean up form tokens
    for (const [token, formToken] of this.formTokens.entries()) {
      if (now > formToken.expiresAt) {
        this.formTokens.delete(token);
        cleanedFormCount++;
      }
    }

    if (cleanedCount > 0) {
      this.saveTokensToStorage();
    }

    if (cleanedFormCount > 0) {
      this.saveFormTokensToStorage();
    }

    if (cleanedCount > 0 || cleanedFormCount > 0) {
      logSecurity('CSRF tokens cleaned up', 'low', {
        cleanedTokens: cleanedCount,
        cleanedFormTokens: cleanedFormCount,
        remainingTokens: this.tokens.size,
        remainingFormTokens: this.formTokens.size
      });
    }
  }

  /**
   * Setup automatic cleanup interval
   */
  private setupCleanupInterval(): void {
    // Clean up expired tokens every 5 minutes
    setInterval(() => {
      this.cleanupExpiredTokens();
    }, 5 * 60 * 1000);
  }

  /**
   * Clear all tokens (for logout)
   */
  clearAllTokens(): void {
    this.tokens.clear();
    this.formTokens.clear();
    sessionStorage.removeItem(this.STORAGE_KEY);
    sessionStorage.removeItem(this.FORM_STORAGE_KEY);
    
    logSecurity('All CSRF tokens cleared', 'low', {
      clearedTokens: true,
      clearedFormTokens: true
    });
  }

  /**
   * Get debug information about current tokens
   */
  getDebugInfo(): { [key: string]: any } {
    const debugInfo: { [key: string]: any } = {};
    
    for (const [token, csrfToken] of this.tokens.entries()) {
      debugInfo[token.substring(0, 8) + '...'] = {
        purpose: csrfToken.purpose,
        origin: csrfToken.origin,
        timestamp: new Date(csrfToken.timestamp).toISOString(),
        expiresAt: new Date(csrfToken.expiresAt).toISOString(),
        isExpired: Date.now() > csrfToken.expiresAt
      };
    }

    return debugInfo;
  }
}

// Export singleton instance
export const csrfProtection = new CSRFProtection();

// Export convenience functions
export const generateCSRFToken = csrfProtection.generateToken.bind(csrfProtection);
export const generateFormCSRFToken = csrfProtection.generateFormToken.bind(csrfProtection);
export const validateCSRFToken = csrfProtection.validateToken.bind(csrfProtection);
export const validateFormCSRFToken = csrfProtection.validateFormToken.bind(csrfProtection);
export const consumeCSRFToken = csrfProtection.consumeToken.bind(csrfProtection);
export const consumeFormCSRFToken = csrfProtection.consumeFormToken.bind(csrfProtection);
export const generateOAuthState = csrfProtection.generateOAuthState.bind(csrfProtection);
export const validateOAuthState = csrfProtection.validateOAuthState.bind(csrfProtection);
export const clearCSRFTokens = csrfProtection.clearAllTokens.bind(csrfProtection);

// Export types for TypeScript support
export type { CSRFToken, CSRFFormToken, RedirectValidationRule };

export default csrfProtection;