/**
 * Notification Settings Component
 * Comprehensive notification preferences management interface
 */

import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Mail, 
  Smartphone, 
  MessageSquare,
  Clock,
  Volume2,
  VolumeX,
  Save,
  RefreshCw,
  Check,
  X,
  Info,
  Calendar,
  CreditCard,
  Shield,
  Zap,
  AlertTriangle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useNotificationPreferences } from '../../hooks/useNotifications';
import { Switch } from '../ui/Switch';
import type { NotificationType } from '../../services/notifications.service';

interface NotificationSettingsProps {
  className?: string;
  showHeader?: boolean;
}

interface NotificationCategoryConfig {
  type: NotificationType;
  label: string;
  description: string;
  icon: React.ReactNode;
  defaultEnabled: boolean;
  priority: 'high' | 'medium' | 'low';
}

const NOTIFICATION_CATEGORIES: NotificationCategoryConfig[] = [
  {
    type: 'session_reminder',
    label: 'Session Reminders',
    description: 'Get notified before your coaching sessions',
    icon: <Calendar className="w-5 h-5 text-blue-600" />,
    defaultEnabled: true,
    priority: 'high'
  },
  {
    type: 'session_confirmed',
    label: 'Session Confirmations',
    description: 'Notifications when sessions are confirmed',
    icon: <Check className="w-5 h-5 text-green-600" />,
    defaultEnabled: true,
    priority: 'high'
  },
  {
    type: 'session_cancelled',
    label: 'Session Cancellations',
    description: 'Alerts when sessions are cancelled',
    icon: <X className="w-5 h-5 text-red-600" />,
    defaultEnabled: true,
    priority: 'high'
  },
  {
    type: 'session_rescheduled',
    label: 'Session Changes',
    description: 'Updates when sessions are rescheduled',
    icon: <Clock className="w-5 h-5 text-yellow-600" />,
    defaultEnabled: true,
    priority: 'high'
  },
  {
    type: 'payment_received',
    label: 'Payment Confirmations',
    description: 'Confirmations of successful payments',
    icon: <CreditCard className="w-5 h-5 text-green-600" />,
    defaultEnabled: true,
    priority: 'medium'
  },
  {
    type: 'payment_failed',
    label: 'Payment Issues',
    description: 'Alerts when payments fail or have issues',
    icon: <CreditCard className="w-5 h-5 text-red-600" />,
    defaultEnabled: true,
    priority: 'high'
  },
  {
    type: 'coach_message',
    label: 'Coach Messages',
    description: 'Messages from your coaches',
    icon: <MessageSquare className="w-5 h-5 text-purple-600" />,
    defaultEnabled: true,
    priority: 'medium'
  },
  {
    type: 'system_update',
    label: 'System Updates',
    description: 'Platform updates and improvements',
    icon: <Info className="w-5 h-5 text-blue-600" />,
    defaultEnabled: true,
    priority: 'low'
  },
  {
    type: 'welcome',
    label: 'Welcome Messages',
    description: 'Onboarding and welcome notifications',
    icon: <Check className="w-5 h-5 text-green-600" />,
    defaultEnabled: true,
    priority: 'medium'
  },
  {
    type: 'profile_incomplete',
    label: 'Profile Reminders',
    description: 'Reminders to complete your profile',
    icon: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
    defaultEnabled: true,
    priority: 'low'
  },
  {
    type: 'subscription_expiring',
    label: 'Subscription Alerts',
    description: 'Notifications about subscription status',
    icon: <Clock className="w-5 h-5 text-orange-600" />,
    defaultEnabled: true,
    priority: 'medium'
  },
  {
    type: 'new_feature',
    label: 'New Features',
    description: 'Announcements about new platform features',
    icon: <Zap className="w-5 h-5 text-purple-600" />,
    defaultEnabled: false,
    priority: 'low'
  },
  {
    type: 'maintenance',
    label: 'Maintenance Notices',
    description: 'Scheduled maintenance and downtime alerts',
    icon: <Info className="w-5 h-5 text-gray-600" />,
    defaultEnabled: true,
    priority: 'medium'
  },
  {
    type: 'security_alert',
    label: 'Security Alerts',
    description: 'Important security notifications',
    icon: <Shield className="w-5 h-5 text-red-600" />,
    defaultEnabled: true,
    priority: 'high'
  }
];

const FREQUENCY_OPTIONS = [
  { value: 'immediate', label: 'Immediate', description: 'Get notifications right away' },
  { value: 'hourly', label: 'Hourly Digest', description: 'Summary every hour' },
  { value: 'daily', label: 'Daily Digest', description: 'Summary once per day' },
  { value: 'weekly', label: 'Weekly Digest', description: 'Summary once per week' }
];

const TIME_ZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Australia/Sydney'
];

export function NotificationSettings({ className = '', showHeader = true }: NotificationSettingsProps) {
  const { preferences, loading, error, updatePreferences } = useNotificationPreferences();
  const [localPreferences, setLocalPreferences] = useState(preferences);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (preferences) {
      setLocalPreferences(preferences);
      setHasChanges(false);
    }
  }, [preferences]);

  const handleChannelToggle = (channel: 'email' | 'push' | 'sms' | 'in_app', enabled: boolean) => {
    if (!localPreferences) return;

    const channelKey = `${channel}_enabled` as keyof typeof localPreferences;
    setLocalPreferences(prev => prev ? {
      ...prev,
      [channelKey]: enabled
    } : prev);
    setHasChanges(true);
  };

  const handleCategoryToggle = (type: NotificationType, enabled: boolean) => {
    if (!localPreferences) return;

    setLocalPreferences(prev => prev ? {
      ...prev,
      categories: {
        ...prev.categories,
        [type]: enabled
      }
    } : prev);
    setHasChanges(true);
  };

  const handleFrequencyChange = (frequency: string) => {
    if (!localPreferences) return;

    setLocalPreferences(prev => prev ? {
      ...prev,
      frequency: frequency as any
    } : prev);
    setHasChanges(true);
  };

  const handleQuietHoursToggle = (enabled: boolean) => {
    if (!localPreferences) return;

    setLocalPreferences(prev => prev ? {
      ...prev,
      quiet_hours: {
        ...prev.quiet_hours,
        enabled
      }
    } : prev);
    setHasChanges(true);
  };

  const handleQuietHoursChange = (field: 'start_time' | 'end_time' | 'timezone', value: string) => {
    if (!localPreferences) return;

    setLocalPreferences(prev => prev ? {
      ...prev,
      quiet_hours: {
        ...prev.quiet_hours,
        [field]: value
      }
    } : prev);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!localPreferences || !hasChanges) return;

    setSaving(true);
    try {
      await updatePreferences(localPreferences);
      setHasChanges(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save preferences:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (preferences) {
      setLocalPreferences(preferences);
      setHasChanges(false);
    }
  };

  if (loading && !localPreferences) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-lg">Loading notification settings...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Settings</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }

  if (!localPreferences) {
    return (
      <div className="text-center py-12">
        <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No notification preferences found</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {showHeader && (
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notification Settings</h1>
            <p className="text-gray-600">Manage how and when you receive notifications</p>
          </div>
          
          {hasChanges && (
            <div className="flex items-center space-x-3">
              <Button variant="secondary" onClick={handleReset}>
                Reset
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : saveSuccess ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Saved!
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Delivery Channels */}
      <Card>
        <Card.Header>
          <h2 className="text-lg font-semibold text-gray-900">Delivery Channels</h2>
          <p className="text-sm text-gray-600">Choose how you want to receive notifications</p>
        </Card.Header>
        
        <Card.Body>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-medium text-gray-900">Email</h3>
                  <p className="text-sm text-gray-600">Receive notifications via email</p>
                </div>
              </div>
              <Switch
                checked={localPreferences.email_enabled}
                onChange={(checked) => handleChannelToggle('email', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <Smartphone className="w-5 h-5 text-green-600" />
                <div>
                  <h3 className="font-medium text-gray-900">Push Notifications</h3>
                  <p className="text-sm text-gray-600">Browser and mobile push notifications</p>
                </div>
              </div>
              <Switch
                checked={localPreferences.push_enabled}
                onChange={(checked) => handleChannelToggle('push', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <MessageSquare className="w-5 h-5 text-purple-600" />
                <div>
                  <h3 className="font-medium text-gray-900">SMS</h3>
                  <p className="text-sm text-gray-600">Text message notifications</p>
                </div>
              </div>
              <Switch
                checked={localPreferences.sms_enabled}
                onChange={(checked) => handleChannelToggle('sms', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <Bell className="w-5 h-5 text-orange-600" />
                <div>
                  <h3 className="font-medium text-gray-900">In-App</h3>
                  <p className="text-sm text-gray-600">Notifications within the platform</p>
                </div>
              </div>
              <Switch
                checked={localPreferences.in_app_enabled}
                onChange={(checked) => handleChannelToggle('in_app', checked)}
              />
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Notification Frequency */}
      <Card>
        <Card.Header>
          <h2 className="text-lg font-semibold text-gray-900">Notification Frequency</h2>
          <p className="text-sm text-gray-600">Control how often you receive notifications</p>
        </Card.Header>
        
        <Card.Body>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FREQUENCY_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  localPreferences.frequency === option.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="frequency"
                  value={option.value}
                  checked={localPreferences.frequency === option.value}
                  onChange={(e) => handleFrequencyChange(e.target.value)}
                  className="sr-only"
                />
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    localPreferences.frequency === option.value
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                  }`}>
                    {localPreferences.frequency === option.value && (
                      <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{option.label}</h3>
                    <p className="text-sm text-gray-600">{option.description}</p>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </Card.Body>
      </Card>

      {/* Quiet Hours */}
      <Card>
        <Card.Header>
          <h2 className="text-lg font-semibold text-gray-900">Quiet Hours</h2>
          <p className="text-sm text-gray-600">Set times when you don't want to receive notifications</p>
        </Card.Header>
        
        <Card.Body>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {localPreferences.quiet_hours.enabled ? (
                  <VolumeX className="w-5 h-5 text-gray-600" />
                ) : (
                  <Volume2 className="w-5 h-5 text-gray-600" />
                )}
                <div>
                  <h3 className="font-medium text-gray-900">Enable Quiet Hours</h3>
                  <p className="text-sm text-gray-600">Pause non-urgent notifications during these hours</p>
                </div>
              </div>
              <Switch
                checked={localPreferences.quiet_hours.enabled}
                onChange={handleQuietHoursToggle}
              />
            </div>

            {localPreferences.quiet_hours.enabled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={localPreferences.quiet_hours.start_time}
                    onChange={(e) => handleQuietHoursChange('start_time', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={localPreferences.quiet_hours.end_time}
                    onChange={(e) => handleQuietHoursChange('end_time', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timezone
                  </label>
                  <select
                    value={localPreferences.quiet_hours.timezone}
                    onChange={(e) => handleQuietHoursChange('timezone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {TIME_ZONES.map((tz) => (
                      <option key={tz} value={tz}>{tz}</option>
                    ))}
                  </select>
                </div>
              </motion.div>
            )}
          </div>
        </Card.Body>
      </Card>

      {/* Notification Categories */}
      <Card>
        <Card.Header>
          <h2 className="text-lg font-semibold text-gray-900">Notification Categories</h2>
          <p className="text-sm text-gray-600">Choose which types of notifications you want to receive</p>
        </Card.Header>
        
        <Card.Body>
          <div className="space-y-1">
            {NOTIFICATION_CATEGORIES.map((category) => (
              <div
                key={category.type}
                className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="flex items-center space-x-3">
                  {category.icon}
                  <div>
                    <h3 className="font-medium text-gray-900">{category.label}</h3>
                    <p className="text-sm text-gray-600">{category.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  {category.priority === 'high' && (
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                      High Priority
                    </span>
                  )}
                  <Switch
                    checked={localPreferences.categories[category.type] ?? category.defaultEnabled}
                    onChange={(checked) => handleCategoryToggle(category.type, checked)}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card.Body>
      </Card>

      {/* Save Changes */}
      {hasChanges && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4"
        >
          <div className="flex items-center space-x-3">
            <Info className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-gray-700">You have unsaved changes</span>
            <div className="flex items-center space-x-2">
              <Button variant="secondary" size="sm" onClick={handleReset}>
                Reset
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}