/**
 * MFA Verification Component for iPEC Coach Connect
 * 
 * Handles MFA verification during login with:
 * - TOTP code input
 * - Backup code fallback
 * - Device trust options
 * - Rate limiting indicators
 * - Accessibility support
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Key,
  Shield,
  Smartphone
} from 'lucide-react';
import { mfaService } from '../../services/mfa.service';
import type { MFAVerificationResult } from '../../services/mfa.service';

interface MFAVerificationProps {
  userId: string;
  onSuccess: (trustToken?: string) => void;
  onCancel: () => void;
}

type VerificationMode = 'totp' | 'backup';

export function MFAVerification({ userId, onSuccess, onCancel }: MFAVerificationProps) {
  const [mode, setMode] = useState<VerificationMode>('totp');
  const [code, setCode] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [trustDevice, setTrustDevice] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0);

  const codeInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus code input with scroll prevention
  useEffect(() => {
    if (codeInputRef.current) {
      // Use setTimeout to prevent focus from interfering with initial page load
      const timeoutId = setTimeout(() => {
        codeInputRef.current?.focus({ preventScroll: true });
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [mode]);

  // Auto-generate device name
  useEffect(() => {
    const {userAgent} = navigator;
    let deviceType = 'Desktop';
    let browser = 'Browser';

    if (/Mobile|Android|iPhone/.test(userAgent)) {
      deviceType = /iPhone/.test(userAgent) ? 'iPhone' : 'Mobile';
    } else if (/iPad/.test(userAgent)) {
      deviceType = 'iPad';
    }

    if (/Chrome/.test(userAgent)) {
      browser = 'Chrome';
    } else if (/Firefox/.test(userAgent)) {
      browser = 'Firefox';
    } else if (/Safari/.test(userAgent) && !/Chrome/.test(userAgent)) {
      browser = 'Safari';
    } else if (/Edg/.test(userAgent)) {
      browser = 'Edge';
    }

    setDeviceName(`${browser} on ${deviceType}`);
  }, []);

  // Rate limit countdown
  useEffect(() => {
    if (rateLimitCountdown > 0) {
      const timer = setTimeout(() => {
        setRateLimitCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (isRateLimited && rateLimitCountdown === 0) {
      setIsRateLimited(false);
      setError(null);
    }
  }, [rateLimitCountdown, isRateLimited]);

  const handleVerifyCode = async () => {
    if (!code || (mode === 'totp' && code.length !== 6) || (mode === 'backup' && code.length !== 8)) {
      setError(mode === 'totp' 
        ? 'Please enter a 6-digit verification code' 
        : 'Please enter an 8-character backup code'
      );
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result: MFAVerificationResult = await mfaService.verifyMFALogin(userId, code);
      
      if (result.success) {
        // Handle device trust if requested
        if (trustDevice && deviceName) {
          try {
            const trustResult = await mfaService.trustDevice(userId, deviceName);
            onSuccess(trustResult.trustToken);
          } catch (trustError) {
            // Continue even if device trust fails
  void console.warn('Device trust failed:', trustError);
            onSuccess();
          }
        } else {
          onSuccess();
        }
      } else {
        setRemainingAttempts(result.remainingAttempts || null);
        
        if (result.remainingAttempts !== undefined && result.remainingAttempts <= 0) {
          setIsRateLimited(true);
          setRateLimitCountdown(900); // 15 minutes
          setError('Too many failed attempts. Please try again in 15 minutes.');
        } else {
          setError(
            `Invalid ${mode === 'totp' ? 'verification code' : 'backup code'}.${
              result.remainingAttempts 
                ? ` ${result.remainingAttempts} attempt${result.remainingAttempts !== 1 ? 's' : ''} remaining.`
                : ''
            }`
          );
        }
        
        setCode('');
        if (codeInputRef.current) {
          codeInputRef.current.focus({ preventScroll: true });
        }
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('RATE_LIMITED')) {
        setIsRateLimited(true);
        setRateLimitCountdown(900); // 15 minutes
        setError('Too many attempts. Please try again in 15 minutes.');
      } else {
        setError(error instanceof Error ? error.message : 'Verification failed');
      }
      setCode('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleModeSwitch = () => {
    setMode(mode === 'totp' ? 'backup' : 'totp');
    setCode('');
    setError(null);
    setRemainingAttempts(null);
  };

  const formatCountdown = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading && !isRateLimited) {
      handleVerifyCode();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg max-w-md w-full p-6"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            {mode === 'totp' ? (
              <Smartphone className="w-8 h-8 text-blue-600" />
            ) : (
              <Key className="w-8 h-8 text-blue-600" />
            )}
          </div>
          <h2 className="text-xl font-semibold text-gray-900">
            Two-Factor Authentication
          </h2>
          <p className="text-gray-600 mt-2">
            {mode === 'totp'
              ? 'Enter the 6-digit code from your authenticator app'
              : 'Enter one of your 8-character backup codes'
            }
          </p>
        </div>

        {/* Rate limit warning */}
        {isRateLimited && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg"
          >
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-red-600" />
              <div className="flex-1">
                <p className="text-red-800 font-medium">Account temporarily locked</p>
                <p className="text-red-700 text-sm">
                  Try again in {formatCountdown(rateLimitCountdown)}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Error message */}
        {error && !isRateLimited && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg"
          >
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          </motion.div>
        )}

        {/* Remaining attempts indicator */}
        {remainingAttempts !== null && remainingAttempts > 0 && !isRateLimited && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 text-sm">
              {remainingAttempts} attempt{remainingAttempts !== 1 ? 's' : ''} remaining
            </p>
          </div>
        )}

        {/* Code input */}
        <div className="space-y-4 mb-6">
          <div>
            <label htmlFor="mfa-code" className="sr-only">
              {mode === 'totp' ? 'Verification Code' : 'Backup Code'}
            </label>
            <input
              ref={codeInputRef}
              id="mfa-code"
              type="text"
              value={code}
              onChange={(e) => {
                const value = mode === 'totp' 
                  ? e.target.value.replace(/\D/g, '').slice(0, 6)
                  : e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase();
                setCode(value);
              }}
              onKeyPress={handleKeyPress}
              placeholder={mode === 'totp' ? '000000' : 'ABCD1234'}
              className={`w-full text-center ${
                mode === 'totp' 
                  ? 'text-2xl tracking-widest font-mono' 
                  : 'text-lg tracking-wider font-mono'
              } px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100`}
              maxLength={mode === 'totp' ? 6 : 8}
              disabled={isLoading || isRateLimited}
            />
          </div>

          {/* Device trust option */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="trust-device"
              checked={trustDevice}
              onChange={(e) => setTrustDevice(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              disabled={isLoading || isRateLimited}
            />
            <label htmlFor="trust-device" className="flex-1">
              <span className="text-sm text-gray-700">
                Trust this device for 30 days
              </span>
              <p className="text-xs text-gray-500">
                You won't need to verify again on this device
              </p>
            </label>
          </div>

          {/* Device name input (shown when trust device is checked) */}
          {trustDevice && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              <label htmlFor="device-name" className="block text-sm font-medium text-gray-700">
                Device Name
              </label>
              <input
                id="device-name"
                type="text"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                placeholder="My Device"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading || isRateLimited}
              />
            </motion.div>
          )}
        </div>

        {/* Action buttons */}
        <div className="space-y-3">
          <button
            onClick={handleVerifyCode}
            disabled={
              isLoading || 
              isRateLimited || 
              !code || 
              (mode === 'totp' && code.length !== 6) || 
              (mode === 'backup' && code.length !== 8)
            }
            className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Verifying...</span>
              </div>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Verify
              </>
            )}
          </button>

          <div className="flex space-x-3">
            <button
              onClick={handleModeSwitch}
              disabled={isLoading || isRateLimited}
              className="flex-1 px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 disabled:opacity-50"
            >
              {mode === 'totp' ? 'Use backup code' : 'Use authenticator app'}
            </button>
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Help text */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            {mode === 'totp'
              ? "Don't have your authenticator app? Use a backup code instead."
              : 'Each backup code can only be used once. Generate new ones if needed.'
            }
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default MFAVerification;