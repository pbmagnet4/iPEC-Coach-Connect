/**
 * Secure Session Management for iPEC Coach Connect
 * 
 * Provides enhanced security for session data with encryption,
 * integrity checks, and secure storage practices.
 */

import { logSecurity } from './secure-logger';

interface SecureSessionData {
  data: any;
  timestamp: number;
  checksum: string;
  version: string;
}

interface SessionConfig {
  encryptionKey?: string;
  expiryHours?: number;
  enableIntegrityCheck?: boolean;
  storage?: 'localStorage' | 'sessionStorage';
}

class SecureSessionManager {
  private readonly STORAGE_PREFIX = 'ipec_secure_';
  private readonly ENCRYPTION_VERSION = '1.0';
  private config: Required<SessionConfig>;

  constructor(config: SessionConfig = {}) {
    this.config = {
      encryptionKey: config.encryptionKey || this.generateEncryptionKey(),
      expiryHours: config.expiryHours || 24,
      enableIntegrityCheck: config.enableIntegrityCheck ?? true,
      storage: config.storage || 'localStorage'
    };
  }

  /**
   * Store data securely with encryption and integrity checking
   */
  async setSecureData(key: string, data: any): Promise<void> {
    try {
      const secureData: SecureSessionData = {
        data,
        timestamp: Date.now(),
        checksum: this.config.enableIntegrityCheck ? await this.generateChecksum(data) : '',
        version: this.ENCRYPTION_VERSION
      };

      const encrypted = await this.encrypt(JSON.stringify(secureData));
      const storageKey = this.STORAGE_PREFIX + key;

      this.getStorage().setItem(storageKey, encrypted);

      logSecurity('Secure session data stored', 'low', {
        key: `${key.substring(0, 8)  }...`,
        dataSize: JSON.stringify(data).length,
        hasIntegrityCheck: this.config.enableIntegrityCheck
      });
    } catch (error) {
      logSecurity('Failed to store secure session data', 'medium', {
        key: `${key.substring(0, 8)  }...`,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error('Failed to store secure session data');
    }
  }

  /**
   * Retrieve and decrypt secure data
   */
  async getSecureData<T = any>(key: string): Promise<T | null> {
    try {
      const storageKey = this.STORAGE_PREFIX + key;
      const encrypted = this.getStorage().getItem(storageKey);

      if (!encrypted) {
        return null;
      }

      const decrypted = await this.decrypt(encrypted);
      const secureData: SecureSessionData = JSON.parse(decrypted);

      // Check expiry
      const expiryTime = secureData.timestamp + (this.config.expiryHours * 60 * 60 * 1000);
      if (Date.now() > expiryTime) {
        this.removeSecureData(key);
        
        logSecurity('Secure session data expired', 'low', {
          key: `${key.substring(0, 8)  }...`,
          expiredAt: new Date(expiryTime).toISOString()
        });
        
        return null;
      }

      // Verify integrity if enabled
      if (this.config.enableIntegrityCheck && secureData.checksum) {
        const expectedChecksum = await this.generateChecksum(secureData.data);
        if (expectedChecksum !== secureData.checksum) {
          this.removeSecureData(key);
          
          logSecurity('Secure session data integrity check failed', 'high', {
            key: `${key.substring(0, 8)  }...`,
            expectedChecksum: `${expectedChecksum.substring(0, 8)  }...`,
            actualChecksum: `${secureData.checksum.substring(0, 8)  }...`
          });
          
          throw new Error('Data integrity check failed');
        }
      }

      logSecurity('Secure session data retrieved', 'low', {
        key: `${key.substring(0, 8)  }...`,
        dataAge: `${Math.round((Date.now() - secureData.timestamp) / 1000 / 60)  } minutes`
      });

      return secureData.data as T;
    } catch (error) {
      logSecurity('Failed to retrieve secure session data', 'medium', {
        key: `${key.substring(0, 8)  }...`,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // Remove corrupted data
      this.removeSecureData(key);
      return null;
    }
  }

  /**
   * Remove secure data
   */
  removeSecureData(key: string): void {
    const storageKey = this.STORAGE_PREFIX + key;
    this.getStorage().removeItem(storageKey);
    
    logSecurity('Secure session data removed', 'low', {
      key: `${key.substring(0, 8)  }...`
    });
  }

  /**
   * Clear all secure session data
   */
  clearAllSecureData(): void {
    const storage = this.getStorage();
    const keysToRemove: string[] = [];

    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key && key.startsWith(this.STORAGE_PREFIX)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => storage.removeItem(key));

    logSecurity('All secure session data cleared', 'low', {
      itemsCleared: keysToRemove.length
    });
  }

  /**
   * Get storage interface based on configuration
   */
  private getStorage(): Storage {
    return this.config.storage === 'sessionStorage' ? sessionStorage : localStorage;
  }

  /**
   * Generate encryption key from browser characteristics
   */
  private generateEncryptionKey(): string {
    if (typeof window === 'undefined') {
      return 'server-fallback-key';
    }

    // Create a deterministic key based on browser characteristics
    const characteristics = [
      navigator.userAgent,
      navigator.language,
      `${screen.width  }x${  screen.height}`,
      new Date().getTimezoneOffset().toString(),
      window.location.origin
    ].join('|');

    return this.simpleHash(characteristics);
  }

  /**
   * Simple hash function for key generation
   */
  private simpleHash(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36).padEnd(16, '0');
  }

  /**
   * Simple encryption using XOR cipher
   * Note: This is for basic obfuscation, not cryptographically secure
   */
  private async encrypt(data: string): Promise<string> {
    const key = this.config.encryptionKey;
    let encrypted = '';
    
    for (let i = 0; i < data.length; i++) {
      const dataChar = data.charCodeAt(i);
      const keyChar = key.charCodeAt(i % key.length);
      encrypted += String.fromCharCode(dataChar ^ keyChar);
    }
    
    return btoa(encrypted);
  }

  /**
   * Simple decryption using XOR cipher
   */
  private async decrypt(encryptedData: string): Promise<string> {
    const key = this.config.encryptionKey;
    const data = atob(encryptedData);
    let decrypted = '';
    
    for (let i = 0; i < data.length; i++) {
      const dataChar = data.charCodeAt(i);
      const keyChar = key.charCodeAt(i % key.length);
      decrypted += String.fromCharCode(dataChar ^ keyChar);
    }
    
    return decrypted;
  }

  /**
   * Generate checksum for integrity verification
   */
  private async generateChecksum(data: any): Promise<string> {
    const dataString = JSON.stringify(data);
    
    // Simple checksum using crypto API if available
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      try {
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(dataString);
        const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      } catch {
        // Fallback to simple hash
      }
    }
    
    // Fallback simple hash
    return this.simpleHash(dataString);
  }

  /**
   * Validate session data structure
   */
  validateSessionData(data: any): boolean {
    try {
      if (!data || typeof data !== 'object') {
        return false;
      }

      // Check required fields
      if (!data.timestamp || !data.version) {
        return false;
      }

      // Check if data is too old
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
      if (Date.now() - data.timestamp > maxAge) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Cleanup expired sessions
   */
  cleanupExpiredSessions(): void {
    const storage = this.getStorage();
    const keysToRemove: string[] = [];
    const now = Date.now();
    const expiryMs = this.config.expiryHours * 60 * 60 * 1000;

    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key && key.startsWith(this.STORAGE_PREFIX)) {
        try {
          const item = storage.getItem(key);
          if (item) {
            const decrypted = this.decrypt(item);
            decrypted.then(decryptedData => {
              const data: SecureSessionData = JSON.parse(decryptedData);
              if (now - data.timestamp > expiryMs) {
                keysToRemove.push(key);
              }
            }).catch(() => {
              // Remove corrupted data
              keysToRemove.push(key);
            });
          }
        } catch {
          // Remove corrupted data
          keysToRemove.push(key);
        }
      }
    }

    keysToRemove.forEach(key => storage.removeItem(key));

    if (keysToRemove.length > 0) {
      logSecurity('Expired secure sessions cleaned up', 'low', {
        itemsRemoved: keysToRemove.length
      });
    }
  }

  /**
   * Get debug information about stored sessions
   */
  getDebugInfo(): Record<string, any> {
    const storage = this.getStorage();
    const info: Record<string, any> = {};
    let totalItems = 0;
    let secureItems = 0;

    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key) {
        totalItems++;
        if (key.startsWith(this.STORAGE_PREFIX)) {
          secureItems++;
          const shortKey = `${key.replace(this.STORAGE_PREFIX, '').substring(0, 8)  }...`;
          try {
            const item = storage.getItem(key);
            if (item) {
              info[shortKey] = {
                size: item.length,
                created: 'encrypted'
              };
            }
          } catch {
            info[shortKey] = { error: 'corrupted' };
          }
        }
      }
    }

    return {
      config: {
        storage: this.config.storage,
        expiryHours: this.config.expiryHours,
        enableIntegrityCheck: this.config.enableIntegrityCheck
      },
      stats: {
        totalStorageItems: totalItems,
        secureItems,
        storageUsage: this.getStorageUsage()
      },
      items: info
    };
  }

  /**
   * Get storage usage statistics
   */
  private getStorageUsage(): { used: number; available: number } {
    try {
      const storage = this.getStorage();
      let used = 0;
      
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key) {
          const item = storage.getItem(key);
          if (item) {
            used += key.length + item.length;
          }
        }
      }

      // Estimate available space (browser dependent)
      const estimated = 5 * 1024 * 1024; // 5MB typical limit
      return {
        used,
        available: Math.max(0, estimated - used)
      };
    } catch {
      return { used: 0, available: 0 };
    }
  }
}

// Create default instance
export const secureSession = new SecureSessionManager({
  expiryHours: 24,
  enableIntegrityCheck: true,
  storage: 'localStorage'
});

// Create session-only instance for temporary data
export const sessionOnlySecureSession = new SecureSessionManager({
  expiryHours: 12,
  enableIntegrityCheck: true,
  storage: 'sessionStorage'
});

// Export convenience functions
export const setSecureData = secureSession.setSecureData.bind(secureSession);
export const getSecureData = secureSession.getSecureData.bind(secureSession);
export const removeSecureData = secureSession.removeSecureData.bind(secureSession);
export const clearAllSecureData = secureSession.clearAllSecureData.bind(secureSession);

export default secureSession;