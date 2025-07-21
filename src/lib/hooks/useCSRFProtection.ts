/**
 * React Hook for CSRF Protection
 * 
 * Provides easy integration of CSRF protection in React components
 * with form handling, validation, and error management.
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  generateCSRFToken, 
  generateFormCSRFToken, 
  validateCSRFToken,
  validateFormCSRFToken,
  consumeCSRFToken,
  consumeFormCSRFToken,
  clearCSRFTokens
} from '../csrf-protection';
import { logSecurity } from '../secure-logger';

export interface CSRFHookOptions {
  purpose?: string;
  formId?: string;
  autoGenerate?: boolean;
  includeNonce?: boolean;
  includeUserAgent?: boolean;
  customExpiry?: number;
}

export interface CSRFTokenInfo {
  token: string;
  isValid: boolean;
  isExpired: boolean;
  generatedAt: number;
  expiresAt: number;
}

export interface CSRFHookResult {
  token: string | null;
  tokenInfo: CSRFTokenInfo | null;
  generateToken: (options?: CSRFHookOptions) => string;
  validateToken: (token?: string) => Promise<boolean>;
  consumeToken: (token?: string) => Promise<boolean>;
  refreshToken: () => void;
  clearTokens: () => void;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook for general CSRF protection
 */
export function useCSRFProtection(options: CSRFHookOptions = {}): CSRFHookResult {
  const [token, setToken] = useState<string | null>(null);
  const [tokenInfo, setTokenInfo] = useState<CSRFTokenInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    purpose = 'general',
    autoGenerate = true,
    includeNonce = true,
    includeUserAgent = true,
    customExpiry
  } = options;

  const generateToken = useCallback((overrideOptions?: CSRFHookOptions) => {
    try {
      setIsLoading(true);
      setError(null);

      const tokenOptions = {
        includeNonce: overrideOptions?.includeNonce ?? includeNonce,
        includeUserAgent: overrideOptions?.includeUserAgent ?? includeUserAgent
      };

      const newToken = generateCSRFToken(
        overrideOptions?.purpose ?? purpose,
        overrideOptions?.customExpiry ?? customExpiry,
        tokenOptions
      );

      const now = Date.now();
      const expiry = now + (customExpiry || 15 * 60 * 1000);

      setToken(newToken);
      setTokenInfo({
        token: newToken,
        isValid: true,
        isExpired: false,
        generatedAt: now,
        expiresAt: expiry
      });

      logSecurity('CSRF token generated via hook', 'low', {
        purpose: overrideOptions?.purpose ?? purpose,
        tokenId: newToken.substring(0, 8) + '...',
        hasNonce: tokenOptions.includeNonce,
        hasUserAgent: tokenOptions.includeUserAgent
      });

      return newToken;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate CSRF token';
      setError(errorMessage);
      logSecurity('CSRF token generation failed in hook', 'medium', {
        error: errorMessage,
        purpose: overrideOptions?.purpose ?? purpose
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [purpose, includeNonce, includeUserAgent, customExpiry]);

  const validateToken = useCallback(async (tokenToValidate?: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const targetToken = tokenToValidate || token;
      if (!targetToken) {
        setError('No token available for validation');
        return false;
      }

      const validation = validateCSRFToken(targetToken, purpose);
      
      if (tokenInfo && targetToken === token) {
        setTokenInfo(prev => prev ? {
          ...prev,
          isValid: validation.valid,
          isExpired: !validation.valid && validation.reason === 'Token expired'
        } : null);
      }

      if (!validation.valid) {
        setError(validation.reason || 'Token validation failed');
        logSecurity('CSRF token validation failed in hook', 'medium', {
          reason: validation.reason,
          purpose,
          tokenId: targetToken.substring(0, 8) + '...'
        });
      }

      return validation.valid;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Token validation failed';
      setError(errorMessage);
      logSecurity('CSRF token validation error in hook', 'medium', {
        error: errorMessage,
        purpose
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [token, tokenInfo, purpose]);

  const consumeToken = useCallback(async (tokenToConsume?: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const targetToken = tokenToConsume || token;
      if (!targetToken) {
        setError('No token available for consumption');
        return false;
      }

      const consumption = consumeCSRFToken(targetToken, purpose);
      
      if (consumption.valid) {
        // Clear the token after successful consumption
        if (targetToken === token) {
          setToken(null);
          setTokenInfo(null);
        }
        
        logSecurity('CSRF token consumed via hook', 'low', {
          purpose,
          tokenId: targetToken.substring(0, 8) + '...'
        });
      } else {
        setError(consumption.reason || 'Token consumption failed');
      }

      return consumption.valid;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Token consumption failed';
      setError(errorMessage);
      logSecurity('CSRF token consumption error in hook', 'medium', {
        error: errorMessage,
        purpose
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [token, purpose]);

  const refreshToken = useCallback(() => {
    generateToken();
  }, [generateToken]);

  const clearTokens = useCallback(() => {
    setToken(null);
    setTokenInfo(null);
    setError(null);
    clearCSRFTokens();
  }, []);

  // Auto-generate token on mount if enabled
  useEffect(() => {
    if (autoGenerate && !token) {
      generateToken();
    }
  }, [autoGenerate, token, generateToken]);

  // Check token expiry periodically
  useEffect(() => {
    if (!tokenInfo || !tokenInfo.isValid) return;

    const checkExpiry = () => {
      const now = Date.now();
      if (now >= tokenInfo.expiresAt) {
        setTokenInfo(prev => prev ? {
          ...prev,
          isValid: false,
          isExpired: true
        } : null);
        logSecurity('CSRF token expired in hook', 'low', {
          purpose,
          tokenId: tokenInfo.token.substring(0, 8) + '...'
        });
      }
    };

    const interval = setInterval(checkExpiry, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [tokenInfo, purpose]);

  return {
    token,
    tokenInfo,
    generateToken,
    validateToken,
    consumeToken,
    refreshToken,
    clearTokens,
    isLoading,
    error
  };
}

/**
 * Hook for form-specific CSRF protection
 */
export function useFormCSRFProtection(formId: string, options: CSRFHookOptions = {}): CSRFHookResult {
  const [token, setToken] = useState<string | null>(null);
  const [tokenInfo, setTokenInfo] = useState<CSRFTokenInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    autoGenerate = true,
    customExpiry
  } = options;

  const generateToken = useCallback((overrideOptions?: CSRFHookOptions) => {
    try {
      setIsLoading(true);
      setError(null);

      const newToken = generateFormCSRFToken(
        formId,
        overrideOptions?.customExpiry ?? customExpiry
      );

      const now = Date.now();
      const expiry = now + (customExpiry || 60 * 60 * 1000); // 1 hour default for forms

      setToken(newToken);
      setTokenInfo({
        token: newToken,
        isValid: true,
        isExpired: false,
        generatedAt: now,
        expiresAt: expiry
      });

      logSecurity('CSRF form token generated via hook', 'low', {
        formId,
        tokenId: newToken.substring(0, 8) + '...'
      });

      return newToken;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate form CSRF token';
      setError(errorMessage);
      logSecurity('CSRF form token generation failed in hook', 'medium', {
        error: errorMessage,
        formId
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [formId, customExpiry]);

  const validateToken = useCallback(async (tokenToValidate?: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const targetToken = tokenToValidate || token;
      if (!targetToken) {
        setError('No token available for validation');
        return false;
      }

      const validation = validateFormCSRFToken(targetToken, formId);
      
      if (tokenInfo && targetToken === token) {
        setTokenInfo(prev => prev ? {
          ...prev,
          isValid: validation.valid,
          isExpired: !validation.valid && validation.reason === 'Token expired'
        } : null);
      }

      if (!validation.valid) {
        setError(validation.reason || 'Form token validation failed');
        logSecurity('CSRF form token validation failed in hook', 'medium', {
          reason: validation.reason,
          formId,
          tokenId: targetToken.substring(0, 8) + '...'
        });
      }

      return validation.valid;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Form token validation failed';
      setError(errorMessage);
      logSecurity('CSRF form token validation error in hook', 'medium', {
        error: errorMessage,
        formId
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [token, tokenInfo, formId]);

  const consumeToken = useCallback(async (tokenToConsume?: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const targetToken = tokenToConsume || token;
      if (!targetToken) {
        setError('No token available for consumption');
        return false;
      }

      const consumption = consumeFormCSRFToken(targetToken, formId);
      
      if (consumption.valid) {
        // Clear the token after successful consumption
        if (targetToken === token) {
          setToken(null);
          setTokenInfo(null);
        }
        
        logSecurity('CSRF form token consumed via hook', 'low', {
          formId,
          tokenId: targetToken.substring(0, 8) + '...'
        });
      } else {
        setError(consumption.reason || 'Form token consumption failed');
      }

      return consumption.valid;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Form token consumption failed';
      setError(errorMessage);
      logSecurity('CSRF form token consumption error in hook', 'medium', {
        error: errorMessage,
        formId
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [token, formId]);

  const refreshToken = useCallback(() => {
    generateToken();
  }, [generateToken]);

  const clearTokens = useCallback(() => {
    setToken(null);
    setTokenInfo(null);
    setError(null);
    clearCSRFTokens();
  }, []);

  // Auto-generate token on mount if enabled
  useEffect(() => {
    if (autoGenerate && !token) {
      generateToken();
    }
  }, [autoGenerate, token, generateToken]);

  // Check token expiry periodically
  useEffect(() => {
    if (!tokenInfo || !tokenInfo.isValid) return;

    const checkExpiry = () => {
      const now = Date.now();
      if (now >= tokenInfo.expiresAt) {
        setTokenInfo(prev => prev ? {
          ...prev,
          isValid: false,
          isExpired: true
        } : null);
        logSecurity('CSRF form token expired in hook', 'low', {
          formId,
          tokenId: tokenInfo.token.substring(0, 8) + '...'
        });
      }
    };

    const interval = setInterval(checkExpiry, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [tokenInfo, formId]);

  return {
    token,
    tokenInfo,
    generateToken,
    validateToken,
    consumeToken,
    refreshToken,
    clearTokens,
    isLoading,
    error
  };
}