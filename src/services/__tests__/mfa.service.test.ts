/**
 * Comprehensive Test Suite for MFA Service
 * 
 * Tests for iPEC Coach Connect MFA implementation covering:
 * - TOTP enrollment and verification
 * - Backup code generation and usage
 * - Device trust management
 * - Rate limiting and security measures
 * - Error handling and edge cases
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mfaService } from '../mfa.service';
import { supabase } from '../../lib/supabase';
import * as OTPAuth from 'otpauth';

// Mock dependencies
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn()
  },
  handleSupabaseError: vi.fn((error) => error),
  SupabaseError: class extends Error {
    constructor(message: string, public code?: string) {
      super(message);
      this.name = 'SupabaseError';
    }
  }
}));

vi.mock('../../lib/device-fingerprint', () => ({
  generateDeviceFingerprint: vi.fn(() => Promise.resolve('test-fingerprint-123'))
}));

vi.mock('../../lib/secure-logger', () => ({
  logSecurity: vi.fn(),
  logAuth: vi.fn()
}));

// Mock OTPAuth
vi.mock('otpauth', () => ({
  Secret: {
    fromRandom: () => ({
      base32: 'TESTSECRET123456'
    })
  },
  TOTP: vi.fn().mockImplementation(({ secret }) => ({
    toString: () => 'otpauth://totp/test',
    generate: ({ timestamp }: { timestamp?: number } = {}) => {
      // Mock TOTP generation based on timestamp
      const time = timestamp || Date.now();
      const timeSlot = Math.floor(time / 1000 / 30);
      return String((timeSlot % 1000000)).padStart(6, '0');
    }
  }))
}));

// Test data
const mockUserId = 'test-user-id-123';
const mockDeviceFingerprint = 'test-fingerprint-123';

const mockMFASettings = {
  id: 'settings-id',
  user_id: mockUserId,
  mfa_enabled: false,
  mfa_enforced: false,
  primary_method: null,
  backup_method: null,
  last_verified_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

const mockTOTPSecret = {
  id: 'secret-id',
  user_id: mockUserId,
  encrypted_secret: 'encrypted-secret',
  recovery_codes: null,
  status: 'pending' as const,
  verified_at: null,
  last_used_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

const mockTrustedDevice = {
  id: 'device-id',
  user_id: mockUserId,
  device_fingerprint: mockDeviceFingerprint,
  device_name: 'Test Device',
  device_type: 'desktop',
  browser_info: { userAgent: 'test' },
  ip_address: '192.168.1.1',
  trust_status: 'trusted' as const,
  trusted_at: new Date().toISOString(),
  trust_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  last_used_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

describe('MFAService', () => {
  beforeEach(() => {
  void vi.clearAllMocks();
    
    // Default Supabase mocks
    (supabase.from as any).mockImplementation((table: string) => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      order: vi.fn().mockReturnThis()
    }));

    (supabase.rpc as any).mockResolvedValue({ data: true, error: null });
  });

  afterEach(() => {
  void vi.restoreAllMocks();
  });

  describe('initializeMFA', () => {
    it('should successfully initialize MFA for new user', async () => {
      // Mock no existing MFA settings
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'mfa_settings') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ 
              data: null, 
              error: { code: 'PGRST116' } // No rows found
            }),
            upsert: vi.fn().mockResolvedValue({ data: mockMFASettings, error: null })
          };
        }
        if (table === 'mfa_totp_secrets') {
          return {
            upsert: vi.fn().mockResolvedValue({ data: mockTOTPSecret, error: null })
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null })
        };
      });

      (supabase.from as any) = mockFrom;
      (supabase.rpc as any).mockResolvedValue({ 
        data: ['CODE1234', 'CODE5678', 'CODE9012'], 
        error: null 
      });

      const result = await mfaService.initializeMFA(mockUserId);

      expect(result).toEqual({
        qrCodeUrl: 'otpauth://totp/test',
        secret: 'TESTSECRET123456',
        backupCodes: ['CODE1234', 'CODE5678', 'CODE9012']
      });
    });

    it('should throw error if MFA already enabled', async () => {
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'mfa_settings') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ 
              data: { ...mockMFASettings, mfa_enabled: true }, 
              error: null 
            })
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null })
        };
      });

      (supabase.from as any) = mockFrom;

      await expect(mfaService.initializeMFA(mockUserId))
        .rejects
        .toThrow('MFA is already enabled for this user');
    });

    it('should handle database errors gracefully', async () => {
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'mfa_settings') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ 
              data: null, 
              error: { code: 'PGRST116' } 
            }),
            upsert: vi.fn().mockResolvedValue({ 
              data: null, 
              error: new Error('Database connection failed') 
            })
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null })
        };
      });

      (supabase.from as any) = mockFrom;

      await expect(mfaService.initializeMFA(mockUserId))
        .rejects
        .toThrow('Database connection failed');
    });
  });

  describe('verifyAndEnableMFA', () => {
    const validTOTPCode = '123456';

    beforeEach(() => {
      // Mock current time to ensure consistent TOTP generation
  void vi.useFakeTimers();
  void vi.setSystemTime(new Date('2024-01-01T12:00:00Z'));
    });

    afterEach(() => {
  void vi.useRealTimers();
    });

    it('should successfully verify TOTP and enable MFA', async () => {
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'mfa_totp_secrets') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ 
              data: mockTOTPSecret, 
              error: null 
            }),
            update: vi.fn().mockResolvedValue({ data: mockTOTPSecret, error: null })
          };
        }
        if (table === 'mfa_settings') {
          return {
            update: vi.fn().mockResolvedValue({ data: mockMFASettings, error: null })
          };
        }
        if (table === 'mfa_devices') {
          return {
            upsert: vi.fn().mockResolvedValue({ data: mockTrustedDevice, error: null })
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null })
        };
      });

      (supabase.from as any) = mockFrom;
      (supabase.rpc as any).mockResolvedValue({ data: true, error: null });

      // Mock TOTP verification to return true for our test code
      const mockTOTP = vi.fn().mockImplementation(() => ({
        generate: () => validTOTPCode
      }));
      (OTPAuth.TOTP as any) = mockTOTP;

      const result = await mfaService.verifyAndEnableMFA(mockUserId, validTOTPCode, 'Test Device');

      expect(result.success).toBe(true);
      expect(result.trustToken).toBeDefined();
    });

    it('should fail verification with invalid TOTP code', async () => {
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'mfa_totp_secrets') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ 
              data: mockTOTPSecret, 
              error: null 
            })
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null })
        };
      });

      (supabase.from as any) = mockFrom;
      (supabase.rpc as any).mockResolvedValue({ data: true, error: null });

      const result = await mfaService.verifyAndEnableMFA(mockUserId, 'wrongcode', 'Test Device');

      expect(result.success).toBe(false);
      expect(result.remainingAttempts).toBeDefined();
    });

    it('should handle rate limiting', async () => {
      (supabase.rpc as any).mockResolvedValue({ data: false, error: null });

      await expect(mfaService.verifyAndEnableMFA(mockUserId, validTOTPCode))
        .rejects
        .toThrow('Too many MFA attempts');
    });
  });

  describe('verifyMFALogin', () => {
    const validTOTPCode = '123456';
    const validBackupCode = 'BACKUP12';

    beforeEach(() => {
  void vi.useFakeTimers();
  void vi.setSystemTime(new Date('2024-01-01T12:00:00Z'));
    });

    afterEach(() => {
  void vi.useRealTimers();
    });

    it('should successfully verify TOTP code during login', async () => {
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'mfa_totp_secrets') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ 
              data: { ...mockTOTPSecret, status: 'active' }, 
              error: null 
            })
          };
        }
        if (table === 'mfa_settings') {
          return {
            update: vi.fn().mockResolvedValue({ data: mockMFASettings, error: null })
          };
        }
        if (table === 'mfa_devices') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ 
              data: null, 
              error: { code: 'PGRST116' } 
            })
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null })
        };
      });

      (supabase.from as any) = mockFrom;
      (supabase.rpc as any).mockResolvedValue({ data: true, error: null });

      // Mock TOTP verification
      const mockTOTP = vi.fn().mockImplementation(() => ({
        generate: () => validTOTPCode
      }));
      (OTPAuth.TOTP as any) = mockTOTP;

      const result = await mfaService.verifyMFALogin(mockUserId, validTOTPCode);

      expect(result.success).toBe(true);
      expect(result.requiresDeviceTrust).toBe(true);
    });

    it('should successfully verify backup code', async () => {
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'mfa_totp_secrets') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ 
              data: { ...mockTOTPSecret, status: 'active' }, 
              error: null 
            })
          };
        }
        if (table === 'mfa_settings') {
          return {
            update: vi.fn().mockResolvedValue({ data: mockMFASettings, error: null })
          };
        }
        if (table === 'mfa_devices') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ 
              data: null, 
              error: { code: 'PGRST116' } 
            })
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null })
        };
      });

      (supabase.from as any) = mockFrom;
      (supabase.rpc as any)
        .mockResolvedValueOnce({ data: true, error: null }) // Rate limit check
        .mockResolvedValueOnce({ data: true, error: null }); // Backup code verification

      const result = await mfaService.verifyMFALogin(mockUserId, validBackupCode);

      expect(result.success).toBe(true);
    });

    it('should detect trusted device', async () => {
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'mfa_totp_secrets') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ 
              data: { ...mockTOTPSecret, status: 'active' }, 
              error: null 
            })
          };
        }
        if (table === 'mfa_settings') {
          return {
            update: vi.fn().mockResolvedValue({ data: mockMFASettings, error: null })
          };
        }
        if (table === 'mfa_devices') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ 
              data: mockTrustedDevice, 
              error: null 
            }),
            update: vi.fn().mockResolvedValue({ data: mockTrustedDevice, error: null })
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null })
        };
      });

      (supabase.from as any) = mockFrom;
      (supabase.rpc as any).mockResolvedValue({ data: true, error: null });

      // Mock TOTP verification
      const mockTOTP = vi.fn().mockImplementation(() => ({
        generate: () => validTOTPCode
      }));
      (OTPAuth.TOTP as any) = mockTOTP;

      const result = await mfaService.verifyMFALogin(mockUserId, validTOTPCode);

      expect(result.success).toBe(true);
      expect(result.requiresDeviceTrust).toBe(false);
    });
  });

  describe('trustDevice', () => {
    it('should successfully trust a device', async () => {
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'mfa_devices') {
          return {
            upsert: vi.fn().mockResolvedValue({ data: mockTrustedDevice, error: null })
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null })
        };
      });

      (supabase.from as any) = mockFrom;

      const result = await mfaService.trustDevice(mockUserId, 'My Test Device');

      expect(result.trusted).toBe(true);
      expect(result.trustToken).toBeDefined();
      expect(result.expiresAt).toBeDefined();
    });

    it('should handle device trust failure', async () => {
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'mfa_devices') {
          return {
            upsert: vi.fn().mockResolvedValue({ 
              data: null, 
              error: new Error('Device trust failed') 
            })
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null })
        };
      });

      (supabase.from as any) = mockFrom;

      await expect(mfaService.trustDevice(mockUserId, 'Test Device'))
        .rejects
        .toThrow('Device trust failed');
    });
  });

  describe('isDeviceTrusted', () => {
    it('should return true for trusted device', async () => {
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'mfa_devices') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ 
              data: mockTrustedDevice, 
              error: null 
            }),
            update: vi.fn().mockResolvedValue({ data: mockTrustedDevice, error: null })
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null })
        };
      });

      (supabase.from as any) = mockFrom;

      const result = await mfaService.isDeviceTrusted(mockUserId);

      expect(result).toBe(true);
    });

    it('should return false for untrusted device', async () => {
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'mfa_devices') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ 
              data: null, 
              error: { code: 'PGRST116' } 
            })
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null })
        };
      });

      (supabase.from as any) = mockFrom;

      const result = await mfaService.isDeviceTrusted(mockUserId);

      expect(result).toBe(false);
    });

    it('should revoke expired device trust', async () => {
      const expiredDevice = {
        ...mockTrustedDevice,
        trust_expires_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // Expired yesterday
      };

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'mfa_devices') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ 
              data: expiredDevice, 
              error: null 
            }),
            update: vi.fn().mockResolvedValue({ 
              data: { ...expiredDevice, trust_status: 'revoked' }, 
              error: null 
            })
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null })
        };
      });

      (supabase.from as any) = mockFrom;

      const result = await mfaService.isDeviceTrusted(mockUserId);

      expect(result).toBe(false);
    });
  });

  describe('disableMFA', () => {
    it('should successfully disable MFA with valid code', async () => {
      const validCode = '123456';
      
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'mfa_totp_secrets') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ 
              data: { ...mockTOTPSecret, status: 'active' }, 
              error: null 
            }),
            update: vi.fn().mockResolvedValue({ data: mockTOTPSecret, error: null })
          };
        }
        if (table === 'mfa_settings') {
          return {
            update: vi.fn().mockResolvedValue({ data: mockMFASettings, error: null })
          };
        }
        if (table === 'mfa_devices') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ 
              data: null, 
              error: { code: 'PGRST116' } 
            }),
            update: vi.fn().mockResolvedValue({ data: mockTrustedDevice, error: null })
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null })
        };
      });

      (supabase.from as any) = mockFrom;
      (supabase.rpc as any).mockResolvedValue({ data: true, error: null });

      // Mock TOTP verification
      const mockTOTP = vi.fn().mockImplementation(() => ({
        generate: () => validCode
      }));
      (OTPAuth.TOTP as any) = mockTOTP;

      await expect(mfaService.disableMFA(mockUserId, validCode)).resolves.toBeUndefined();
    });

    it('should fail to disable MFA with invalid code', async () => {
      const invalidCode = 'wrongcode';
      
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'mfa_totp_secrets') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ 
              data: { ...mockTOTPSecret, status: 'active' }, 
              error: null 
            })
          };
        }
        if (table === 'mfa_devices') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mkReturnThis(),
            single: vi.fn().mockResolvedValue({ 
              data: null, 
              error: { code: 'PGRST116' } 
            })
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null })
        };
      });

      (supabase.from as any) = mockFrom;
      (supabase.rpc as any).mockResolvedValue({ data: true, error: null });

      await expect(mfaService.disableMFA(mockUserId, invalidCode))
        .rejects
        .toThrow('Invalid verification code');
    });
  });

  describe('generateNewBackupCodes', () => {
    it('should generate new backup codes', async () => {
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'mfa_settings') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ 
              data: { ...mockMFASettings, mfa_enabled: true }, 
              error: null 
            })
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null })
        };
      });

      (supabase.from as any) = mockFrom;
      (supabase.rpc as any).mockResolvedValue({ 
        data: ['CODE1234', 'CODE5678', 'CODE9012'], 
        error: null 
      });

      const result = await mfaService.generateNewBackupCodes(mockUserId);

      expect(result).toEqual(['CODE1234', 'CODE5678', 'CODE9012']);
    });

    it('should fail if MFA is not enabled', async () => {
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'mfa_settings') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ 
              data: { ...mockMFASettings, mfa_enabled: false }, 
              error: null 
            })
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null })
        };
      });

      (supabase.from as any) = mockFrom;

      await expect(mfaService.generateNewBackupCodes(mockUserId))
        .rejects
        .toThrow('MFA is not enabled');
    });
  });
});