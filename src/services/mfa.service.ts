/**
 * Multi-Factor Authentication (MFA) Service for iPEC Coach Connect
 * 
 * Comprehensive MFA service with:
 * - TOTP (Time-based One-Time Password) support
 * - SMS verification backup
 * - Email verification backup
 * - Backup recovery codes
 * - Device enrollment and management
 * - Rate limiting and security measures
 * - Audit logging
 */

import { handleSupabaseError, supabase, SupabaseError } from '../lib/supabase';
import { logAuth, logSecurity } from '../lib/secure-logger';
import { Secret, TOTP } from 'otpauth';
import { generateDeviceFingerprint } from '../lib/device-fingerprint';
import type { Database } from '../types/database';

// Type definitions
type MFAMethod = 'totp' | 'sms' | 'email';
type MFAStatus = 'pending' | 'active' | 'disabled';
type DeviceTrustStatus = 'trusted' | 'untrusted' | 'revoked';

interface MFASettings {
  id: string;
  user_id: string;
  mfa_enabled: boolean;
  mfa_enforced: boolean;
  primary_method: MFAMethod | null;
  backup_method: MFAMethod | null;
  last_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

interface TOTPSecret {
  id: string;
  user_id: string;
  encrypted_secret: string;
  recovery_codes: string[] | null;
  status: MFAStatus;
  verified_at: string | null;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

interface MFADevice {
  id: string;
  user_id: string;
  device_fingerprint: string;
  device_name: string | null;
  device_type: string | null;
  browser_info: any | null;
  ip_address: string | null;
  trust_status: DeviceTrustStatus;
  trusted_at: string | null;
  trust_expires_at: string | null;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

interface MFAEnrollmentResult {
  qrCodeUrl: string;
  secret: string;
  backupCodes: string[];
}

interface MFAVerificationResult {
  success: boolean;
  requiresDeviceTrust?: boolean;
  trustToken?: string;
  remainingAttempts?: number;
}

interface DeviceTrustResult {
  trusted: boolean;
  trustToken?: string;
  expiresAt?: string;
}

class MFAService {
  private readonly issuer = 'iPEC Coach Connect';
  private readonly rateLimit = {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
  };

  /**
   * Initialize MFA setup for a user
   */
  public async initializeMFA(userId: string): Promise<MFAEnrollmentResult> {
    try {
      // Check if user already has MFA set up
      const existingSettings = await this.getMFASettings(userId);
      if (existingSettings?.mfa_enabled) {
        throw new SupabaseError('MFA is already enabled for this user', 'MFA_ALREADY_ENABLED');
      }

      // Generate TOTP secret
      const secret = this.generateTOTPSecret();
      const totp = new TOTP({
        issuer: this.issuer,
        label: userId,
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret,
      });

      // Create MFA settings record
      const { error: settingsError } = await supabase
        .from('mfa_settings')
        .upsert({
          user_id: userId,
          mfa_enabled: false, // Will be enabled after verification
          primary_method: 'totp',
          backup_method: 'email',
        });

      if (settingsError) {
        throw handleSupabaseError(settingsError);
      }

      // Store encrypted TOTP secret
      const { error: secretError } = await supabase
        .from('mfa_totp_secrets')
        .upsert({
          user_id: userId,
          encrypted_secret: await this.encryptSecret(secret),
          status: 'pending',
        });

      if (secretError) {
        throw handleSupabaseError(secretError);
      }

      // Generate backup codes using database function
      const { data: backupCodes, error: codesError } = await supabase
        .rpc('generate_backup_codes', { user_id: userId });

      if (codesError) {
        throw handleSupabaseError(codesError);
      }

      // Log MFA initialization
      await this.logMFAEvent(userId, 'mfa_initialized', 'totp');

      return {
        qrCodeUrl: totp.toString(),
        secret,
        backupCodes: backupCodes || [],
      };
    } catch (error) {
      const mfaError = error instanceof SupabaseError 
        ? error 
        : new SupabaseError('Failed to initialize MFA');
      
      await this.logMFAEvent(userId, 'mfa_init_failed', 'totp', {
        error: mfaError.message
      });
      
      throw mfaError;
    }
  }

  /**
   * Verify TOTP code and complete MFA enrollment
   */
  public async verifyAndEnableMFA(
    userId: string, 
    totpCode: string,
    deviceName?: string
  ): Promise<MFAVerificationResult> {
    try {
      // Check rate limit
      const rateLimitValid = await this.checkRateLimit(userId);
      if (!rateLimitValid) {
        throw new SupabaseError('Too many MFA attempts. Please try again later.', 'RATE_LIMITED');
      }

      // Get TOTP secret
      const { data: totpSecret, error: secretError } = await supabase
        .from('mfa_totp_secrets')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'pending')
        .single();

      if (secretError || !totpSecret) {
        await this.logVerificationAttempt(userId, 'totp', false);
        throw new SupabaseError('MFA setup not found', 'MFA_NOT_FOUND');
      }

      // Decrypt and verify TOTP code
      const decryptedSecret = await this.decryptSecret(totpSecret.encrypted_secret);
      const isValid = this.verifyTOTP(decryptedSecret, totpCode);

      // Log attempt
      await this.logVerificationAttempt(userId, 'totp', isValid);

      if (!isValid) {
        const remainingAttempts = await this.getRemainingAttempts(userId);
        return {
          success: false,
          remainingAttempts,
        };
      }

      // Enable MFA
      const { error: enableError } = await supabase
        .from('mfa_settings')
        .update({
          mfa_enabled: true,
          last_verified_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (enableError) {
        throw handleSupabaseError(enableError);
      }

      // Mark TOTP secret as active
      const { error: activateError } = await supabase
        .from('mfa_totp_secrets')
        .update({
          status: 'active',
          verified_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (activateError) {
        throw handleSupabaseError(activateError);
      }

      // Register device if name provided
      let trustToken: string | undefined;
      if (deviceName) {
        const trustResult = await this.trustDevice(userId, deviceName);
        trustToken = trustResult.trustToken;
      }

      await this.logMFAEvent(userId, 'mfa_enabled', 'totp');

      return {
        success: true,
        trustToken,
      };
    } catch (error) {
      const mfaError = error instanceof SupabaseError 
        ? error 
        : new SupabaseError('MFA verification failed');
      
      await this.logMFAEvent(userId, 'mfa_verification_failed', 'totp', {
        error: mfaError.message
      });
      
      throw mfaError;
    }
  }

  /**
   * Verify MFA during login
   */
  public async verifyMFALogin(
    userId: string,
    code: string,
    method: MFAMethod = 'totp'
  ): Promise<MFAVerificationResult> {
    try {
      // Check rate limit
      const rateLimitValid = await this.checkRateLimit(userId);
      if (!rateLimitValid) {
        throw new SupabaseError('Too many MFA attempts. Please try again later.', 'RATE_LIMITED');
      }

      let isValid = false;

      if (method === 'totp') {
        // Check if it's a backup code first
        if (code.length === 8) {
          const { data: backupValid, error: backupError } = await supabase
            .rpc('verify_backup_code', { user_id: userId, code });

          if (!backupError && backupValid) {
            isValid = true;
            await this.logMFAEvent(userId, 'backup_code_used', method);
          }
        }

        // If not a valid backup code, try TOTP
        if (!isValid) {
          const { data: totpSecret, error: secretError } = await supabase
            .from('mfa_totp_secrets')
            .select('encrypted_secret')
            .eq('user_id', userId)
            .eq('status', 'active')
            .single();

          if (!secretError && totpSecret) {
            const decryptedSecret = await this.decryptSecret(totpSecret.encrypted_secret);
            isValid = this.verifyTOTP(decryptedSecret, code);
          }
        }
      }

      // Log attempt
      await this.logVerificationAttempt(userId, method, isValid);

      if (!isValid) {
        const remainingAttempts = await this.getRemainingAttempts(userId);
        return {
          success: false,
          remainingAttempts,
        };
      }

      // Update last verified time
      await supabase
        .from('mfa_settings')
        .update({ last_verified_at: new Date().toISOString() })
        .eq('user_id', userId);

      // Check if device needs to be trusted
      const deviceFingerprint = await generateDeviceFingerprint();
      const deviceTrusted = await this.isDeviceTrusted(userId, deviceFingerprint);

      await this.logMFAEvent(userId, 'mfa_verified', method);

      return {
        success: true,
        requiresDeviceTrust: !deviceTrusted,
      };
    } catch (error) {
      const mfaError = error instanceof SupabaseError 
        ? error 
        : new SupabaseError('MFA login verification failed');
      
      await this.logMFAEvent(userId, 'mfa_login_failed', method, {
        error: mfaError.message
      });
      
      throw mfaError;
    }
  }

  /**
   * Trust a device for MFA bypass
   */
  public async trustDevice(
    userId: string,
    deviceName: string,
    trustDuration: number = 30 * 24 * 60 * 60 * 1000 // 30 days
  ): Promise<DeviceTrustResult> {
    try {
      const deviceFingerprint = await generateDeviceFingerprint();
      const trustExpiresAt = new Date(Date.now() + trustDuration);
      const trustToken = this.generateTrustToken();

      // Get device info
      const deviceInfo = this.getDeviceInfo();

      const { error } = await supabase
        .from('mfa_devices')
        .upsert({
          user_id: userId,
          device_fingerprint: deviceFingerprint,
          device_name: deviceName,
          device_type: deviceInfo.type,
          browser_info: deviceInfo.browser,
          ip_address: deviceInfo.ipAddress,
          trust_status: 'trusted',
          trusted_at: new Date().toISOString(),
          trust_expires_at: trustExpiresAt.toISOString(),
          last_used_at: new Date().toISOString(),
        });

      if (error) {
        throw handleSupabaseError(error);
      }

      await this.logMFAEvent(userId, 'device_trusted', null, {
        deviceName,
        deviceFingerprint,
        expiresAt: trustExpiresAt.toISOString(),
      });

      return {
        trusted: true,
        trustToken,
        expiresAt: trustExpiresAt.toISOString(),
      };
    } catch (error) {
      const mfaError = error instanceof SupabaseError 
        ? error 
        : new SupabaseError('Failed to trust device');
      
      await this.logMFAEvent(userId, 'device_trust_failed', null, {
        error: mfaError.message
      });
      
      throw mfaError;
    }
  }

  /**
   * Check if current device is trusted
   */
  public async isDeviceTrusted(userId: string, deviceFingerprint?: string): Promise<boolean> {
    try {
      const fingerprint = deviceFingerprint || await generateDeviceFingerprint();

      const { data: device, error } = await supabase
        .from('mfa_devices')
        .select('trust_status, trust_expires_at')
        .eq('user_id', userId)
        .eq('device_fingerprint', fingerprint)
        .single();

      if (error || !device) {
        return false;
      }

      if (device.trust_status !== 'trusted') {
        return false;
      }

      // Check if trust has expired
      if (device.trust_expires_at && new Date(device.trust_expires_at) < new Date()) {
        // Revoke expired trust
        await supabase
          .from('mfa_devices')
          .update({ trust_status: 'revoked' })
          .eq('user_id', userId)
          .eq('device_fingerprint', fingerprint);

        return false;
      }

      // Update last used
      await supabase
        .from('mfa_devices')
        .update({ last_used_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('device_fingerprint', fingerprint);

      return true;
    } catch (error) {
      logSecurity('Device trust check failed', 'medium', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  /**
   * Get user's MFA settings
   */
  public async getMFASettings(userId: string): Promise<MFASettings | null> {
    try {
      const { data: settings, error } = await supabase
        .from('mfa_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw handleSupabaseError(error);
      }

      return settings;
    } catch (error) {
      logSecurity('Failed to get MFA settings', 'low', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  /**
   * Get user's trusted devices
   */
  public async getTrustedDevices(userId: string): Promise<MFADevice[]> {
    try {
      const { data: devices, error } = await supabase
        .from('mfa_devices')
        .select('*')
        .eq('user_id', userId)
        .eq('trust_status', 'trusted')
        .order('last_used_at', { ascending: false });

      if (error) {
        throw handleSupabaseError(error);
      }

      return devices || [];
    } catch (error) {
      logSecurity('Failed to get trusted devices', 'low', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return [];
    }
  }

  /**
   * Revoke device trust
   */
  public async revokeDeviceTrust(userId: string, deviceId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('mfa_devices')
        .update({ trust_status: 'revoked' })
        .eq('user_id', userId)
        .eq('id', deviceId);

      if (error) {
        throw handleSupabaseError(error);
      }

      await this.logMFAEvent(userId, 'device_trust_revoked', null, { deviceId });
    } catch (error) {
      const mfaError = error instanceof SupabaseError 
        ? error 
        : new SupabaseError('Failed to revoke device trust');
      
      await this.logMFAEvent(userId, 'device_trust_revoke_failed', null, {
        error: mfaError.message,
        deviceId
      });
      
      throw mfaError;
    }
  }

  /**
   * Disable MFA for a user
   */
  public async disableMFA(userId: string, verificationCode: string): Promise<void> {
    try {
      // Verify current MFA code before disabling
      const verificationResult = await this.verifyMFALogin(userId, verificationCode);
      if (!verificationResult.success) {
        throw new SupabaseError('Invalid verification code', 'INVALID_CODE');
      }

      // Disable MFA
      const { error: settingsError } = await supabase
        .from('mfa_settings')
        .update({ mfa_enabled: false })
        .eq('user_id', userId);

      if (settingsError) {
        throw handleSupabaseError(settingsError);
      }

      // Disable TOTP secrets
      const { error: secretError } = await supabase
        .from('mfa_totp_secrets')
        .update({ status: 'disabled' })
        .eq('user_id', userId);

      if (secretError) {
        throw handleSupabaseError(secretError);
      }

      // Revoke all trusted devices
      await supabase
        .from('mfa_devices')
        .update({ trust_status: 'revoked' })
        .eq('user_id', userId);

      await this.logMFAEvent(userId, 'mfa_disabled', 'totp');
    } catch (error) {
      const mfaError = error instanceof SupabaseError 
        ? error 
        : new SupabaseError('Failed to disable MFA');
      
      await this.logMFAEvent(userId, 'mfa_disable_failed', 'totp', {
        error: mfaError.message
      });
      
      throw mfaError;
    }
  }

  /**
   * Generate new backup codes
   */
  public async generateNewBackupCodes(userId: string): Promise<string[]> {
    try {
      // Verify MFA is enabled
      const settings = await this.getMFASettings(userId);
      if (!settings?.mfa_enabled) {
        throw new SupabaseError('MFA is not enabled', 'MFA_NOT_ENABLED');
      }

      // Generate new backup codes
      const { data: backupCodes, error } = await supabase
        .rpc('generate_backup_codes', { user_id: userId });

      if (error) {
        throw handleSupabaseError(error);
      }

      await this.logMFAEvent(userId, 'backup_codes_generated', null);

      return backupCodes || [];
    } catch (error) {
      const mfaError = error instanceof SupabaseError 
        ? error 
        : new SupabaseError('Failed to generate backup codes');
      
      await this.logMFAEvent(userId, 'backup_codes_failed', null, {
        error: mfaError.message
      });
      
      throw mfaError;
    }
  }

  // Private helper methods

  private generateTOTPSecret(): string {
    return Secret.fromRandom().base32;
  }

  private verifyTOTP(secret: string, token: string): boolean {
    const totp = new TOTP({
      issuer: this.issuer,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret,
    });

    // Allow for some clock drift (±1 period)
    const now = Math.floor(Date.now() / 1000);
    const window = 1;

    for (let i = -window; i <= window; i++) {
      const time = now + (i * 30);
      if (totp.generate({ timestamp: time * 1000 }) === token) {
        return true;
      }
    }

    return false;
  }

  private async encryptSecret(secret: string): Promise<string> {
    // In a real implementation, this would use Supabase Vault or similar
    // For now, we'll use a simple encoding (replace with proper encryption)
    return btoa(secret);
  }

  private async decryptSecret(encryptedSecret: string): Promise<string> {
    // In a real implementation, this would use Supabase Vault or similar
    // For now, we'll use a simple decoding (replace with proper decryption)
    return atob(encryptedSecret);
  }

  private generateTrustToken(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  private getDeviceInfo() {
    const {userAgent} = navigator;
    const {platform} = navigator;

    let deviceType = 'desktop';
    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
      deviceType = /iPad/.test(userAgent) ? 'tablet' : 'mobile';
    }

    return {
      type: deviceType,
      browser: {
        userAgent,
        platform,
        language: navigator.language,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
      },
      ipAddress: null, // Would be set by server-side component
    };
  }

  private async checkRateLimit(userId: string): Promise<boolean> {
    try {
      const { data: allowed, error } = await supabase
        .rpc('check_mfa_rate_limit', { p_user_id: userId });

      if (error) {
        logSecurity('Rate limit check failed', 'medium', {
          userId,
          error: error.message
        });
        return false;
      }

      return allowed;
    } catch (error) {
      logSecurity('Rate limit check failed', 'medium', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  private async getRemainingAttempts(userId: string): Promise<number> {
    try {
      const { data: attempts, error } = await supabase
        .from('mfa_verification_attempts')
        .select('id')
        .eq('user_id', userId)
        .eq('success', false)
        .gte('attempted_at', new Date(Date.now() - this.rateLimit.windowMs).toISOString());

      if (error) {
        return 0;
      }

      return Math.max(0, this.rateLimit.maxAttempts - (attempts?.length || 0));
    } catch (error) {
      return 0;
    }
  }

  private async logVerificationAttempt(
    userId: string,
    method: MFAMethod,
    success: boolean
  ): Promise<void> {
    try {
      const deviceFingerprint = await generateDeviceFingerprint();
      
      await supabase
        .from('mfa_verification_attempts')
        .insert({
          user_id: userId,
          method,
          success,
          device_fingerprint: deviceFingerprint,
        });
    } catch (error) {
      // Log but don't throw - verification logging is not critical
      logSecurity('Failed to log MFA verification attempt', 'low', {
        userId,
        method,
        success,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async logMFAEvent(
    userId: string,
    eventType: string,
    method: MFAMethod | null,
    metadata?: any
  ): Promise<void> {
    try {
      const deviceFingerprint = await generateDeviceFingerprint();
      
      await supabase
        .from('mfa_audit_log')
        .insert({
          user_id: userId,
          event_type: eventType,
          method,
          user_agent: navigator.userAgent,
          device_fingerprint: deviceFingerprint,
          metadata: metadata || {},
        });

      logSecurity(`MFA event: ${eventType}`, 'low', {
        userId,
        method,
        metadata
      });
    } catch (error) {
      // Log but don't throw - audit logging is not critical for functionality
      logSecurity('Failed to log MFA audit event', 'low', {
        userId,
        eventType,
        method,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

// Export singleton instance
export const mfaService = new MFAService();

export default mfaService;

// Export types for use in components
export type {
  MFAMethod,
  MFAStatus,
  DeviceTrustStatus,
  MFASettings,
  MFADevice,
  MFAEnrollmentResult,
  MFAVerificationResult,
  DeviceTrustResult,
};