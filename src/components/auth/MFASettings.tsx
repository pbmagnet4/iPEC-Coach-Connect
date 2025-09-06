/**
 * MFA Settings Management Component for iPEC Coach Connect
 * 
 * Comprehensive MFA management interface with:
 * - MFA status and configuration
 * - Device management and trust
 * - Backup code generation
 * - MFA disable/enable functionality
 * - Security audit log
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  ShieldCheck, 
  ShieldX,
  Smartphone, 
  Monitor,
  Tablet,
  Key,
  Download,
  Copy,
  Trash2,
  AlertTriangle,
  Clock,
  CheckCircle,
  Eye,
  MoreVertical,
  RefreshCw
} from 'lucide-react';
import { mfaService } from '../../services/mfa.service';
import { MFAEnrollment } from './MFAEnrollment';
import { MFAVerification } from './MFAVerification';
import type { MFASettings, MFADevice } from '../../services/mfa.service';

interface MFASettingsProps {
  userId: string;
}

interface AuditLogEntry {
  id: string;
  event_type: string;
  method: string | null;
  created_at: string;
  metadata: any;
}

export function MFASettings({ userId }: MFASettingsProps) {
  const [settings, setSettings] = useState<MFASettings | null>(null);
  const [devices, setDevices] = useState<MFADevice[]>([]);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [showEnrollment, setShowEnrollment] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [disableCode, setDisableCode] = useState('');

  // Load initial data
  useEffect(() => {
    loadMFAData();
  }, [userId]);

  // Clear success/error messages after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const loadMFAData = async () => {
    try {
      setIsLoading(true);
      const [settingsData, devicesData] = await Promise.all([
        mfaService.getMFASettings(userId),
        mfaService.getTrustedDevices(userId)
      ]);
      
      setSettings(settingsData);
      setDevices(devicesData);
      setError(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load MFA settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnableMFA = () => {
    setShowEnrollment(true);
  };

  const handleDisableMFA = async () => {
    if (!disableCode) {
      setError('Please enter a verification code to disable MFA');
      return;
    }

    setActionLoading('disable');
    try {
      await mfaService.disableMFA(userId, disableCode);
      setSuccess('MFA has been disabled successfully');
      setDisableCode('');
      await loadMFAData();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to disable MFA');
    } finally {
      setActionLoading(null);
    }
  };

  const handleGenerateBackupCodes = async () => {
    setActionLoading('backup-codes');
    try {
      const codes = await mfaService.generateNewBackupCodes(userId);
      setBackupCodes(codes);
      setShowBackupCodes(true);
      setSuccess('New backup codes generated successfully');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to generate backup codes');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevokeDevice = async (deviceId: string) => {
    setActionLoading(`revoke-${deviceId}`);
    try {
      await mfaService.revokeDeviceTrust(userId, deviceId);
      setSuccess('Device trust revoked successfully');
      await loadMFAData();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to revoke device');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCopyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setSuccess('Copied to clipboard');
    } catch (error) {
      setError('Failed to copy to clipboard');
    }
  };

  const downloadBackupCodes = () => {
    if (!backupCodes.length) return;

    const content = `iPEC Coach Connect - MFA Backup Codes\n\nGenerated: ${new Date().toLocaleDateString()}\n\nIMPORTANT: Store these codes securely. Each code can only be used once.\n\n${backupCodes.map((code, index) => `${index + 1}. ${code}`).join('\n')}\n\nIf you lose access to your authenticator app, you can use these codes to sign in.`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ipec-mfa-backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getDeviceIcon = (deviceType: string | null) => {
    switch (deviceType?.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="w-5 h-5" />;
      case 'tablet':
        return <Tablet className="w-5 h-5" />;
      default:
        return <Monitor className="w-5 h-5" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'mfa_enabled':
      case 'mfa_verified':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'mfa_disabled':
      case 'device_trust_revoked':
        return <ShieldX className="w-4 h-4 text-red-600" />;
      case 'device_trusted':
        return <Shield className="w-4 h-4 text-blue-600" />;
      case 'backup_code_used':
        return <Key className="w-4 h-4 text-yellow-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Messages */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-50 border border-red-200 rounded-lg p-4"
          >
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <p className="text-red-800">{error}</p>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-600 hover:text-red-800"
              >
                ×
              </button>
            </div>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-green-50 border border-green-200 rounded-lg p-4"
          >
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-green-800">{success}</p>
              <button
                onClick={() => setSuccess(null)}
                className="ml-auto text-green-600 hover:text-green-800"
              >
                ×
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MFA Status Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              {settings?.mfa_enabled ? (
                <ShieldCheck className="w-8 h-8 text-green-600" />
              ) : (
                <Shield className="w-8 h-8 text-gray-400" />
              )}
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Two-Factor Authentication
                </h2>
                <p className="text-sm text-gray-600">
                  {settings?.mfa_enabled
                    ? 'Your account is protected with MFA'
                    : 'Add an extra layer of security to your account'
                  }
                </p>
              </div>
            </div>

            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              settings?.mfa_enabled
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {settings?.mfa_enabled ? 'Enabled' : 'Disabled'}
            </div>
          </div>

          {settings?.mfa_enabled ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Primary Method:</span>
                  <span className="ml-2 font-medium capitalize">
                    {settings.primary_method || 'TOTP'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Last Verified:</span>
                  <span className="ml-2 font-medium">
                    {settings.last_verified_at
                      ? formatDate(settings.last_verified_at)
                      : 'Never'
                    }
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleGenerateBackupCodes}
                  disabled={actionLoading === 'backup-codes'}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  {actionLoading === 'backup-codes' ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Key className="w-4 h-4 mr-2" />
                  )}
                  Generate Backup Codes
                </button>

                <button
                  onClick={() => setShowVerification(true)}
                  className="inline-flex items-center px-3 py-2 border border-red-300 rounded-lg text-sm font-medium text-red-700 hover:bg-red-50"
                >
                  <ShieldX className="w-4 h-4 mr-2" />
                  Disable MFA
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-gray-600 mb-4">
                Two-factor authentication adds an extra layer of security to your account
                by requiring a code from your phone in addition to your password.
              </p>
              <button
                onClick={handleEnableMFA}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <ShieldCheck className="w-4 h-4 mr-2" />
                Enable Two-Factor Authentication
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Trusted Devices */}
      {settings?.mfa_enabled && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Trusted Devices</h3>
              <span className="text-sm text-gray-600">
                {devices.length} device{devices.length !== 1 ? 's' : ''}
              </span>
            </div>

            {devices.length > 0 ? (
              <div className="space-y-3">
                {devices.map((device) => (
                  <motion.div
                    key={device.id}
                    layout
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="text-gray-600">
                        {getDeviceIcon(device.device_type)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {device.device_name || 'Unnamed Device'}
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>
                            Added {formatDate(device.created_at)}
                          </span>
                          {device.last_used_at && (
                            <span>
                              Last used {formatDate(device.last_used_at)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        device.trust_status === 'trusted'
                          ? 'bg-green-100 text-green-800'
                          : device.trust_status === 'revoked'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {device.trust_status}
                      </div>

                      {device.trust_status === 'trusted' && (
                        <button
                          onClick={() => handleRevokeDevice(device.id)}
                          disabled={actionLoading === `revoke-${device.id}`}
                          className="p-1 text-gray-400 hover:text-red-600 disabled:opacity-50"
                          title="Revoke trust"
                        >
                          {actionLoading === `revoke-${device.id}` ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Monitor className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No trusted devices</p>
                <p className="text-sm text-gray-500">
                  Devices you trust will appear here
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MFA Enrollment Modal */}
      {showEnrollment && (
        <MFAEnrollment
          userId={userId}
          onComplete={() => {
            setShowEnrollment(false);
            loadMFAData();
            setSuccess('MFA has been enabled successfully');
          }}
          onCancel={() => setShowEnrollment(false)}
        />
      )}

      {/* MFA Verification Modal for Disable */}
      {showVerification && (
        <MFAVerification
          userId={userId}
          onSuccess={() => {
            setShowVerification(false);
            // Show disable confirmation
            const code = prompt('Enter verification code to disable MFA:');
            if (code) {
              setDisableCode(code);
              handleDisableMFA();
            }
          }}
          onCancel={() => setShowVerification(false)}
        />
      )}

      {/* Backup Codes Modal */}
      {showBackupCodes && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Key className="w-8 h-8 text-yellow-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Your New Backup Codes
                </h3>
                <p className="text-gray-600">
                  Save these codes securely. Each code can only be used once.
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium">Important:</p>
                    <ul className="mt-1 list-disc list-inside space-y-1">
                      <li>Store these codes in a safe place</li>
                      <li>Each code can only be used once</li>
                      <li>These replace your previous backup codes</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-white border rounded-lg p-4 mb-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {backupCodes.map((code, index) => (
                    <div
                      key={code}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded font-mono"
                    >
                      <span>{index + 1}. {code}</span>
                      <button
                        onClick={() => handleCopyToClipboard(code)}
                        className="p-1 text-gray-500 hover:text-gray-700"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={downloadBackupCodes}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center justify-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>
                <button
                  onClick={() => {
                    const allCodes = backupCodes.join('\n');
                    handleCopyToClipboard(allCodes);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center justify-center space-x-2"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy All</span>
                </button>
              </div>

              <button
                onClick={() => setShowBackupCodes(false)}
                className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Done
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default MFASettings;