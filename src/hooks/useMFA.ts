/**
 * MFA Management Hook for iPEC Coach Connect
 * 
 * React hook for managing MFA state and operations with:
 * - MFA enrollment and verification
 * - Device trust management
 * - Backup code generation
 * - Real-time MFA status updates
 * - Error handling and loading states
 */

import { useState, useEffect, useCallback } from 'react';
import { mfaService } from '../services/mfa.service';
import { useAuth } from '../services/auth.service';
import type { 
  MFASettings, 
  MFADevice, 
  MFAEnrollmentResult,
  MFAVerificationResult,
  DeviceTrustResult 
} from '../services/mfa.service';

interface MFAState {
  settings: MFASettings | null;
  devices: MFADevice[];
  isLoading: boolean;
  isEnrolling: boolean;
  isVerifying: boolean;
  error: string | null;
  enrollmentData: MFAEnrollmentResult | null;
}

interface MFAOperations {
  // Enrollment
  initializeMFA: () => Promise<MFAEnrollmentResult>;
  completeMFAEnrollment: (code: string, deviceName?: string) => Promise<boolean>;
  
  // Verification
  verifyMFACode: (code: string) => Promise<MFAVerificationResult>;
  
  // Device Management
  trustDevice: (deviceName: string) => Promise<DeviceTrustResult>;
  revokeDeviceTrust: (deviceId: string) => Promise<void>;
  isDeviceTrusted: () => Promise<boolean>;
  
  // Backup Codes
  generateBackupCodes: () => Promise<string[]>;
  
  // Settings Management
  disableMFA: (verificationCode: string) => Promise<void>;
  refreshMFAData: () => Promise<void>;
  
  // Error Management
  clearError: () => void;
}

export function useMFA(): MFAState & MFAOperations {
  const { user, mfaSettings } = useAuth();
  
  const [state, setState] = useState<MFAState>({
    settings: mfaSettings,
    devices: [],
    isLoading: false,
    isEnrolling: false,
    isVerifying: false,
    error: null,
    enrollmentData: null,
  });

  // Sync with auth state
  useEffect(() => {
    setState(prev => ({
      ...prev,
      settings: mfaSettings
    }));
  }, [mfaSettings]);

  // Load MFA data when user changes
  useEffect(() => {
    if (user?.id) {
      refreshMFAData();
    }
  }, [user?.id]);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

  const refreshMFAData = useCallback(async () => {
    if (!user?.id) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const [settingsData, devicesData] = await Promise.all([
        mfaService.getMFASettings(user.id),
        mfaService.getTrustedDevices(user.id)
      ]);

      setState(prev => ({
        ...prev,
        settings: settingsData,
        devices: devicesData,
        isLoading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load MFA data',
        isLoading: false
      }));
    }
  }, [user?.id]);

  const initializeMFA = useCallback(async (): Promise<MFAEnrollmentResult> => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    setState(prev => ({ ...prev, isEnrolling: true, error: null }));

    try {
      const enrollmentData = await mfaService.initializeMFA(user.id);
      
      setState(prev => ({
        ...prev,
        enrollmentData,
        isEnrolling: false
      }));

      return enrollmentData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize MFA';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isEnrolling: false
      }));
      throw error;
    }
  }, [user?.id]);

  const completeMFAEnrollment = useCallback(async (
    code: string, 
    deviceName?: string
  ): Promise<boolean> => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    setState(prev => ({ ...prev, isVerifying: true, error: null }));

    try {
      const result = await mfaService.verifyAndEnableMFA(user.id, code, deviceName);
      
      if (result.success) {
        await refreshMFAData();
        setState(prev => ({
          ...prev,
          isVerifying: false,
          enrollmentData: null
        }));
        return true;
      } else {
        setState(prev => ({
          ...prev,
          error: 'Invalid verification code',
          isVerifying: false
        }));
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Enrollment failed';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isVerifying: false
      }));
      return false;
    }
  }, [user?.id, refreshMFAData]);

  const verifyMFACode = useCallback(async (code: string): Promise<MFAVerificationResult> => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    setState(prev => ({ ...prev, isVerifying: true, error: null }));

    try {
      const result = await mfaService.verifyMFALogin(user.id, code);
      
      setState(prev => ({ ...prev, isVerifying: false }));

      if (!result.success) {
        setState(prev => ({
          ...prev,
          error: `Invalid code. ${result.remainingAttempts ? `${result.remainingAttempts} attempts remaining.` : ''}`
        }));
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Verification failed';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isVerifying: false
      }));
      throw error;
    }
  }, [user?.id]);

  const trustDevice = useCallback(async (deviceName: string): Promise<DeviceTrustResult> => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    setState(prev => ({ ...prev, error: null }));

    try {
      const result = await mfaService.trustDevice(user.id, deviceName);
      await refreshMFAData();
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to trust device';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, [user?.id, refreshMFAData]);

  const revokeDeviceTrust = useCallback(async (deviceId: string): Promise<void> => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    setState(prev => ({ ...prev, error: null }));

    try {
      await mfaService.revokeDeviceTrust(user.id, deviceId);
      await refreshMFAData();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to revoke device trust';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, [user?.id, refreshMFAData]);

  const isDeviceTrusted = useCallback(async (): Promise<boolean> => {
    if (!user?.id) {
      return false;
    }

    try {
      return await mfaService.isDeviceTrusted(user.id);
    } catch (error) {
      console.warn('Failed to check device trust:', error);
      return false;
    }
  }, [user?.id]);

  const generateBackupCodes = useCallback(async (): Promise<string[]> => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    setState(prev => ({ ...prev, error: null }));

    try {
      const codes = await mfaService.generateNewBackupCodes(user.id);
      return codes;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate backup codes';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, [user?.id]);

  const disableMFA = useCallback(async (verificationCode: string): Promise<void> => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    setState(prev => ({ ...prev, error: null }));

    try {
      await mfaService.disableMFA(user.id, verificationCode);
      await refreshMFAData();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to disable MFA';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, [user?.id, refreshMFAData]);

  return {
    // State
    ...state,
    
    // Operations
    initializeMFA,
    completeMFAEnrollment,
    verifyMFACode,
    trustDevice,
    revokeDeviceTrust,
    isDeviceTrusted,
    generateBackupCodes,
    disableMFA,
    refreshMFAData,
    clearError,
  };
}

export default useMFA;

// Convenience hooks for specific MFA operations
export function useMFAEnrollment() {
  const mfa = useMFA();
  
  return {
    isEnrolling: mfa.isEnrolling,
    enrollmentData: mfa.enrollmentData,
    error: mfa.error,
    initializeMFA: mfa.initializeMFA,
    completeMFAEnrollment: mfa.completeMFAEnrollment,
    clearError: mfa.clearError,
  };
}

export function useMFAVerification() {
  const mfa = useMFA();
  
  return {
    isVerifying: mfa.isVerifying,
    error: mfa.error,
    verifyMFACode: mfa.verifyMFACode,
    clearError: mfa.clearError,
  };
}

export function useMFADevices() {
  const mfa = useMFA();
  
  return {
    devices: mfa.devices,
    isLoading: mfa.isLoading,
    error: mfa.error,
    trustDevice: mfa.trustDevice,
    revokeDeviceTrust: mfa.revokeDeviceTrust,
    isDeviceTrusted: mfa.isDeviceTrusted,
    refreshMFAData: mfa.refreshMFAData,
    clearError: mfa.clearError,
  };
}