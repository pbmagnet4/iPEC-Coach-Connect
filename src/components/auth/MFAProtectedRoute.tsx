/**
 * MFA Protected Route Component for iPEC Coach Connect
 * 
 * Route wrapper that enforces MFA verification with:
 * - Automatic MFA requirement detection
 * - Device trust checking
 * - Seamless MFA flow integration
 * - Loading states and error handling
 * - Fallback for non-MFA users
 */

import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader, Shield } from 'lucide-react';
import { useAuth } from '../../services/auth.service';
import { MFAVerification } from './MFAVerification';
import { useMFA } from '../../hooks/useMFA';

interface MFAProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  requireMFA?: boolean; // Force MFA even if not enabled
}

export function MFAProtectedRoute({ 
  children, 
  redirectTo = '/auth/login',
  requireMFA = false 
}: MFAProtectedRouteProps) {
  const location = useLocation();
  const { user, isAuthenticated, isLoading, requiresMFA, mfaVerified, mfaSettings } = useAuth();
  const { isDeviceTrusted } = useMFA();
  
  const [checkingDeviceTrust, setCheckingDeviceTrust] = useState(true);
  const [deviceTrusted, setDeviceTrusted] = useState(false);
  const [showMFAVerification, setShowMFAVerification] = useState(false);

  // Check device trust status on mount
  useEffect(() => {
    const checkTrust = async () => {
      if (user?.id && mfaSettings?.mfa_enabled) {
        try {
          const trusted = await isDeviceTrusted();
          setDeviceTrusted(trusted);
        } catch (error) {
          console.warn('Device trust check failed:', error);
          setDeviceTrusted(false);
        }
      }
      setCheckingDeviceTrust(false);
    };

    checkTrust();
  }, [user?.id, mfaSettings?.mfa_enabled, isDeviceTrusted]);

  // Determine if MFA verification is needed
  useEffect(() => {
    const needsMFAVerification = (
      isAuthenticated && 
      (requiresMFA || requireMFA || mfaSettings?.mfa_enabled) && 
      (!mfaVerified || !deviceTrusted) &&
      !checkingDeviceTrust
    );

    setShowMFAVerification(needsMFAVerification);
  }, [
    isAuthenticated, 
    requiresMFA, 
    requireMFA, 
    mfaSettings?.mfa_enabled, 
    mfaVerified, 
    deviceTrusted,
    checkingDeviceTrust
  ]);

  // Handle successful MFA verification
  const handleMFASuccess = async (trustToken?: string) => {
    setShowMFAVerification(false);
    
    // Update device trust if trust token provided
    if (trustToken) {
      setDeviceTrusted(true);
    }
  };

  // Show loading spinner while checking authentication or device trust
  if (isLoading || checkingDeviceTrust) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
          <h2 className="text-lg font-medium text-gray-900">Loading...</h2>
          <p className="text-gray-600">Checking authentication status</p>
        </motion.div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <Navigate 
        to={redirectTo} 
        state={{ from: location.pathname }} 
        replace 
      />
    );
  }

  // Show MFA verification if required
  if (showMFAVerification && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full">
          {/* MFA Required Banner */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-lg border border-gray-200 mb-6 p-6 text-center"
          >
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Additional Verification Required
            </h2>
            <p className="text-gray-600">
              Your account has two-factor authentication enabled. Please verify your identity to continue.
            </p>
          </motion.div>

          {/* MFA Verification Component */}
          <MFAVerification
            userId={user.id}
            onSuccess={handleMFASuccess}
            onCancel={() => {
              // Allow user to logout if they cancel MFA
              window.location.href = '/auth/login';
            }}
          />
        </div>
      </div>
    );
  }

  // Render protected content
  return <>{children}</>;
}

export default MFAProtectedRoute;

// Higher-order component version for easier usage
export function withMFAProtection<P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<MFAProtectedRouteProps, 'children'>
) {
  return function MFAProtectedComponent(props: P) {
    return (
      <MFAProtectedRoute {...options}>
        <Component {...props} />
      </MFAProtectedRoute>
    );
  };
}

// Hook for checking MFA status in components
export function useMFAStatus() {
  const { requiresMFA, mfaVerified, mfaSettings } = useAuth();
  const { isDeviceTrusted } = useMFA();
  
  const [status, setStatus] = useState<{
    isRequired: boolean;
    isVerified: boolean;
    needsVerification: boolean;
    isLoading: boolean;
  }>({
    isRequired: false,
    isVerified: false,
    needsVerification: false,
    isLoading: true
  });

  useEffect(() => {
    const checkStatus = async () => {
      const deviceTrusted = mfaSettings?.mfa_enabled ? await isDeviceTrusted() : true;
      
      setStatus({
        isRequired: requiresMFA || (mfaSettings?.mfa_enabled ?? false),
        isVerified: mfaVerified && deviceTrusted,
        needsVerification: (requiresMFA || (mfaSettings?.mfa_enabled ?? false)) && (!mfaVerified || !deviceTrusted),
        isLoading: false
      });
    };

    checkStatus();
  }, [requiresMFA, mfaVerified, mfaSettings?.mfa_enabled, isDeviceTrusted]);

  return status;
}