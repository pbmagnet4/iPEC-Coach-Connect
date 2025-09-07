/**
 * MFA Enrollment Component for iPEC Coach Connect
 * 
 * Provides a step-by-step MFA setup flow with:
 * - QR code display for authenticator app setup
 * - Manual secret key entry option
 * - TOTP code verification
 * - Backup codes display and download
 * - Device trust configuration
 */

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  AlertCircle, 
  Check, 
  Copy, 
  Download, 
  Eye, 
  EyeOff,
  QrCode,
  Shield,
  Smartphone
} from 'lucide-react';
import { mfaService } from '../../services/mfa.service';
import type { MFAEnrollmentResult } from '../../services/mfa.service';

interface MFAEnrollmentProps {
  userId: string;
  onComplete: (trustToken?: string) => void;
  onCancel: () => void;
}

type EnrollmentStep = 'intro' | 'setup' | 'verify' | 'backup' | 'complete';

export function MFAEnrollment({ userId, onComplete, onCancel }: MFAEnrollmentProps) {
  const [currentStep, setCurrentStep] = useState<EnrollmentStep>('intro');
  const [enrollmentData, setEnrollmentData] = useState<MFAEnrollmentResult | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set());

  // Auto-generate device name based on browser/OS
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

  const handleStartSetup = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await mfaService.initializeMFA(userId);
      setEnrollmentData(result);
      setCurrentStep('setup');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to initialize MFA');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a 6-digit verification code');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await mfaService.verifyAndEnableMFA(userId, verificationCode, deviceName);
      if (result.success) {
        setCurrentStep('backup');
      } else {
        setError('Invalid verification code. Please try again.');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyToClipboard = async (text: string, itemId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItems(prev => new Set([...prev, itemId]));
      setTimeout(() => {
        setCopiedItems(prev => {
          const next = new Set(prev);
  void next.delete(itemId);
          return next;
        });
      }, 2000);
    } catch (error) {
  void console.error('Failed to copy to clipboard:', error);
    }
  };

  const handleDownloadBackupCodes = () => {
    if (!enrollmentData?.backupCodes) return;

    const content = `iPEC Coach Connect - MFA Backup Codes\n\nGenerated: ${new Date().toLocaleDateString()}\n\nIMPORTANT: Store these codes securely. Each code can only be used once.\n\n${enrollmentData.backupCodes.map((code, index) => `${index + 1}. ${code}`).join('\n')}\n\nIf you lose access to your authenticator app, you can use these codes to sign in.`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ipec-mfa-backup-codes.txt';
    document.body.appendChild(a);
  void a.click();
    document.body.removeChild(a);
  void URL.revokeObjectURL(url);
  };

  const stepVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'intro':
        return (
          <motion.div
            key="intro"
            variants={stepVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="text-center space-y-6"
          >
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Set up Multi-Factor Authentication
              </h3>
              <p className="text-gray-600">
                Add an extra layer of security to your account by setting up MFA.
                You'll need an authenticator app like Google Authenticator or Authy.
              </p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">What you'll need:</h4>
              <ul className="text-blue-800 text-sm space-y-1">
                <li>• An authenticator app on your phone</li>
                <li>• About 5 minutes to complete setup</li>
                <li>• A secure place to store backup codes</li>
              </ul>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={onCancel}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Not Now
              </button>
              <button
                onClick={handleStartSetup}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Setting up...' : 'Get Started'}
              </button>
            </div>
          </motion.div>
        );

      case 'setup':
        if (!enrollmentData) return null;

        return (
          <motion.div
            key="setup"
            variants={stepVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-6"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <QrCode className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Scan the QR Code
              </h3>
              <p className="text-gray-600">
                Use your authenticator app to scan this QR code
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border-2 border-dashed border-gray-300">
              <div className="w-64 h-64 mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(enrollmentData.qrCodeUrl)}`}
                  alt="QR Code for MFA setup"
                  className="w-full h-full rounded-lg"
                  loading="lazy"
                />
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Manual Entry Key:
                </span>
                <button
                  onClick={() => setShowSecret(!showSecret)}
                  className="p-1 text-gray-500 hover:text-gray-700"
                >
                  {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <code className="flex-1 text-xs bg-white p-2 rounded border font-mono">
                  {showSecret ? enrollmentData.secret : '••••••••••••••••••••••••••••••••'}
                </code>
                <button
                  onClick={() => handleCopyToClipboard(enrollmentData.secret, 'secret')}
                  className="p-2 text-gray-500 hover:text-gray-700"
                >
                  {copiedItems.has('secret') ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              onClick={() => setCurrentStep('verify')}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Continue to Verification
            </button>
          </motion.div>
        );

      case 'verify':
        return (
          <motion.div
            key="verify"
            variants={stepVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-6"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Enter Verification Code
              </h3>
              <p className="text-gray-600">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="w-full text-center text-2xl tracking-widest font-mono px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                maxLength={6}
              />

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Device Name (optional)
                </label>
                <input
                  type="text"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  placeholder="My Device"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500">
                  This will be added to your trusted devices list
                </p>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setCurrentStep('setup')}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={handleVerifyCode}
                disabled={isLoading || verificationCode.length !== 6}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Verifying...' : 'Verify & Enable'}
              </button>
            </div>
          </motion.div>
        );

      case 'backup':
        if (!enrollmentData?.backupCodes) return null;

        return (
          <motion.div
            key="backup"
            variants={stepVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-6"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Download className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Save Your Backup Codes
              </h3>
              <p className="text-gray-600">
                Store these codes securely. You can use them to access your account if you lose your phone.
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Important:</p>
                  <ul className="mt-1 list-disc list-inside space-y-1">
                    <li>Each code can only be used once</li>
                    <li>Store them in a secure location</li>
                    <li>Don't share these codes with anyone</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-white border rounded-lg p-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                {enrollmentData.backupCodes.map((code, index) => (
                  <div
                    key={code}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded font-mono"
                  >
                    <span>{index + 1}. {code}</span>
                    <button
                      onClick={() => handleCopyToClipboard(code, `code-${index}`)}
                      className="p-1 text-gray-500 hover:text-gray-700"
                    >
                      {copiedItems.has(`code-${index}`) ? (
                        <Check className="w-3 h-3 text-green-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleDownloadBackupCodes}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center justify-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
              <button
                onClick={() => {
                  const allCodes = enrollmentData.backupCodes.join('\n');
                  handleCopyToClipboard(allCodes, 'all-codes');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center justify-center space-x-2"
              >
                {copiedItems.has('all-codes') ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                <span>Copy All</span>
              </button>
            </div>

            <button
              onClick={() => setCurrentStep('complete')}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              I've Saved My Backup Codes
            </button>
          </motion.div>
        );

      case 'complete':
        return (
          <motion.div
            key="complete"
            variants={stepVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="text-center space-y-6"
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                MFA Setup Complete!
              </h3>
              <p className="text-gray-600">
                Your account is now protected with multi-factor authentication.
                You'll need to enter a code from your authenticator app when signing in.
              </p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-green-800 text-sm">
                ✓ Two-factor authentication enabled<br />
                ✓ Backup codes saved<br />
                ✓ Device trusted for 30 days
              </p>
            </div>

            <button
              onClick={() => onComplete()}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Continue to Dashboard
            </button>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Progress indicator */}
          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-2">
              {['intro', 'setup', 'verify', 'backup', 'complete'].map((step, index) => {
                const isActive = step === currentStep;
                const isComplete = ['intro', 'setup', 'verify', 'backup', 'complete'].indexOf(currentStep) > index;
                
                return (
                  <React.Fragment key={step}>
                    <div
                      className={`w-3 h-3 rounded-full ${
                        isComplete
                          ? 'bg-green-600'
                          : isActive
                          ? 'bg-blue-600'
                          : 'bg-gray-300'
                      }`}
                    />
                    {index < 4 && (
                      <div
                        className={`flex-1 h-0.5 ${
                          isComplete ? 'bg-green-600' : 'bg-gray-300'
                        }`}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
            <p className="text-xs text-gray-500 capitalize">
              Step {['intro', 'setup', 'verify', 'backup', 'complete'].indexOf(currentStep) + 1} of 5: {currentStep}
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Step content */}
          <AnimatePresence mode="wait">
            {renderStep()}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default MFAEnrollment;