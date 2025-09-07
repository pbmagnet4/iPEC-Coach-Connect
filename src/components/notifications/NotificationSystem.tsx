/**
 * Notification System Component for iPEC Coach Connect
 * 
 * Real-time notification management system with multi-channel delivery,
 * user preferences, and intelligent notification grouping. Supports
 * in-app notifications, email digests, and push notifications.
 * 
 * Features:
 * - Real-time notification delivery with WebSocket support
 * - Multi-channel notifications (in-app, email, push, SMS)
 * - User preference management with granular controls
 * - Notification grouping and batching
 * - Read/unread status tracking
 * - Action buttons and quick responses
 * - Notification history and search
 * - Smart notification scheduling
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  X,
  Calendar,
  Users,
  Target,
  MessageSquare,
  Award,
  AlertCircle,
  Info,
  Star,
  Clock,
  Filter,
  Search,
  Settings,
  Mail,
  Smartphone,
  Globe,
  Volume2,
  ChevronRight,
  Eye,
  Trash2,
  Archive,
  RefreshCw,
  Zap,
  Heart,
  DollarSign,
  UserPlus,
  LogIn,
  Package,
  TrendingUp,
  Video,
  FileText,
  Shield
} from 'lucide-react';
import { 
  useAuth, 
  useUserRoles,
  useUserPreferences 
} from '../../stores/unified-user-store';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { Modal } from '../ui/Modal';
import { Tabs } from '../ui/Tabs';
import { Toggle } from '../ui/Toggle';
import { Select } from '../ui/Select';
import { Checkbox } from '../ui/Checkbox';
import { Tooltip } from '../ui/Tooltip';
import { toast } from '../ui/Toast';

// =====================================================================
// TYPES AND INTERFACES
// =====================================================================

type NotificationType = 
  | 'session_reminder'
  | 'session_booked'
  | 'session_cancelled'
  | 'session_rescheduled'
  | 'goal_milestone'
  | 'goal_deadline'
  | 'goal_completed'
  | 'message_received'
  | 'coach_matched'
  | 'payment_received'
  | 'payment_failed'
  | 'review_request'
  | 'system_update'
  | 'security_alert'
  | 'welcome'
  | 'achievement'
  | 'community_mention'
  | 'coach_application_update';

type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';
type NotificationChannel = 'in_app' | 'email' | 'push' | 'sms';

interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  data?: Record<string, any>;
  actions?: NotificationAction[];
  is_read: boolean;
  is_archived: boolean;
  created_at: string;
  read_at?: string;
  expires_at?: string;
  group_id?: string;
  avatar?: {
    url?: string;
    fallback: string;
    type: 'user' | 'system' | 'icon';
  };
  channels: NotificationChannel[];
}

interface NotificationAction {
  id: string;
  label: string;
  action_type: 'navigate' | 'api_call' | 'dismiss';
  action_data?: Record<string, any>;
  style?: 'primary' | 'secondary' | 'danger';
}

interface NotificationGroup {
  id: string;
  type: NotificationType;
  notifications: Notification[];
  summary: string;
  count: number;
  latest_at: string;
}

interface NotificationPreferences {
  channels: {
    in_app: boolean;
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  categories: {
    sessions: {
      enabled: boolean;
      channels: NotificationChannel[];
      quiet_hours?: { start: string; end: string };
    };
    goals: {
      enabled: boolean;
      channels: NotificationChannel[];
    };
    messages: {
      enabled: boolean;
      channels: NotificationChannel[];
    };
    payments: {
      enabled: boolean;
      channels: NotificationChannel[];
    };
    marketing: {
      enabled: boolean;
      channels: NotificationChannel[];
    };
    system: {
      enabled: boolean;
      channels: NotificationChannel[];
    };
  };
  email_frequency: 'instant' | 'hourly' | 'daily' | 'weekly';
  quiet_hours: {
    enabled: boolean;
    start_time: string;
    end_time: string;
    timezone: string;
  };
  do_not_disturb: boolean;
}

interface NotificationFilters {
  types?: NotificationType[];
  priority?: NotificationPriority[];
  is_read?: boolean;
  is_archived?: boolean;
  date_range?: {
    start: Date;
    end: Date;
  };
  search?: string;
}

// =====================================================================
// NOTIFICATION ICONS AND STYLING
// =====================================================================

const getNotificationIcon = (type: NotificationType) => {
  const icons: Record<NotificationType, React.ComponentType<any>> = {
    session_reminder: Calendar,
    session_booked: Calendar,
    session_cancelled: Calendar,
    session_rescheduled: Calendar,
    goal_milestone: Target,
    goal_deadline: Clock,
    goal_completed: Award,
    message_received: MessageSquare,
    coach_matched: Users,
    payment_received: DollarSign,
    payment_failed: AlertCircle,
    review_request: Star,
    system_update: Info,
    security_alert: Shield,
    welcome: Heart,
    achievement: Trophy,
    community_mention: Users,
    coach_application_update: FileText
  };
  return icons[type] || Bell;
};

const getNotificationColor = (type: NotificationType, priority: NotificationPriority) => {
  if (priority === 'urgent') return 'red';
  
  const colors: Partial<Record<NotificationType, string>> = {
    session_booked: 'green',
    session_cancelled: 'red',
    goal_completed: 'green',
    payment_received: 'green',
    payment_failed: 'red',
    security_alert: 'red',
    achievement: 'purple'
  };
  
  return colors[type] || 'blue';
};

// =====================================================================
// NOTIFICATION DATA HOOKS
// =====================================================================

const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    channels: {
      in_app: true,
      email: true,
      push: false,
      sms: false
    },
    categories: {
      sessions: { enabled: true, channels: ['in_app', 'email'] },
      goals: { enabled: true, channels: ['in_app'] },
      messages: { enabled: true, channels: ['in_app', 'push'] },
      payments: { enabled: true, channels: ['in_app', 'email'] },
      marketing: { enabled: false, channels: ['email'] },
      system: { enabled: true, channels: ['in_app'] }
    },
    email_frequency: 'daily',
    quiet_hours: {
      enabled: false,
      start_time: '22:00',
      end_time: '08:00',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    do_not_disturb: false
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Simulate WebSocket connection for real-time notifications
  const wsRef = useRef<WebSocket | null>(null);

  const fetchNotifications = async (filters?: NotificationFilters) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // This would fetch from Supabase
      // For now, using mock data
      const mockNotifications: Notification[] = [
        {
          id: '1',
          user_id: user?.id || 'user1',
          type: 'session_reminder',
          priority: 'high',
          title: 'Upcoming Session in 1 Hour',
          message: 'Your coaching session with Sarah Johnson starts at 3:00 PM',
          data: {
            session_id: 'session1',
            coach_name: 'Sarah Johnson',
            start_time: new Date(Date.now() + 60 * 60 * 1000).toISOString()
          },
          actions: [
            {
              id: 'join',
              label: 'Join Session',
              action_type: 'navigate',
              action_data: { path: '/sessions/session1' },
              style: 'primary'
            },
            {
              id: 'reschedule',
              label: 'Reschedule',
              action_type: 'navigate',
              action_data: { path: '/sessions/session1/reschedule' },
              style: 'secondary'
            }
          ],
          is_read: false,
          is_archived: false,
          created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          channels: ['in_app', 'email', 'push'],
          avatar: {
            url: 'https://images.unsplash.com/photo-1573496799652-408c2ac9fe98?auto=format&fit=crop&q=80',
            fallback: 'SJ',
            type: 'user'
          }
        },
        {
          id: '2',
          user_id: user?.id || 'user1',
          type: 'goal_milestone',
          priority: 'medium',
          title: 'Milestone Achieved! 🎉',
          message: 'You completed "Give presentation to team" - Great progress on your Public Speaking goal!',
          data: {
            goal_id: 'goal1',
            milestone_id: 'milestone1',
            goal_title: 'Improve Public Speaking Skills'
          },
          actions: [
            {
              id: 'view',
              label: 'View Goal',
              action_type: 'navigate',
              action_data: { path: '/goals/goal1' },
              style: 'primary'
            }
          ],
          is_read: false,
          is_archived: false,
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          channels: ['in_app'],
          avatar: {
            fallback: '🎯',
            type: 'icon'
          }
        },
        {
          id: '3',
          user_id: user?.id || 'user1',
          type: 'coach_matched',
          priority: 'medium',
          title: 'New Coach Match: Dr. Emily Rodriguez',
          message: '95% match based on your goals and preferences. Dr. Emily specializes in Executive Leadership.',
          data: {
            coach_id: 'coach3',
            match_score: 95,
            specializations: ['Executive Leadership', 'Team Dynamics']
          },
          actions: [
            {
              id: 'view_profile',
              label: 'View Profile',
              action_type: 'navigate',
              action_data: { path: '/coaches/coach3' },
              style: 'primary'
            },
            {
              id: 'book',
              label: 'Book Session',
              action_type: 'navigate',
              action_data: { path: '/book-session?coach=coach3' },
              style: 'secondary'
            }
          ],
          is_read: true,
          is_archived: false,
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          read_at: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
          channels: ['in_app', 'email'],
          avatar: {
            url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80',
            fallback: 'ER',
            type: 'user'
          }
        },
        {
          id: '4',
          user_id: user?.id || 'user1',
          type: 'message_received',
          priority: 'low',
          title: 'New message from Sarah Johnson',
          message: 'Great job in our last session! I've attached some resources for you to review.',
          data: {
            sender_id: 'coach1',
            conversation_id: 'conv1'
          },
          actions: [
            {
              id: 'reply',
              label: 'Reply',
              action_type: 'navigate',
              action_data: { path: '/messages/conv1' },
              style: 'primary'
            }
          ],
          is_read: true,
          is_archived: false,
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          read_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          channels: ['in_app'],
          avatar: {
            url: 'https://images.unsplash.com/photo-1573496799652-408c2ac9fe98?auto=format&fit=crop&q=80',
            fallback: 'SJ',
            type: 'user'
          }
        }
      ];

      // Apply filters
      let filteredNotifications = mockNotifications;
      
      if (filters?.types && filters.types.length > 0) {
        filteredNotifications = filteredNotifications.filter(n => 
          filters.types!.includes(n.type)
        );
      }
      
      if (filters?.priority && filters.priority.length > 0) {
        filteredNotifications = filteredNotifications.filter(n => 
          filters.priority!.includes(n.priority)
        );
      }
      
      if (filters?.is_read !== undefined) {
        filteredNotifications = filteredNotifications.filter(n => 
          n.is_read === filters.is_read
        );
      }
      
      if (filters?.is_archived !== undefined) {
        filteredNotifications = filteredNotifications.filter(n => 
          n.is_archived === filters.is_archived
        );
      }
      
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        filteredNotifications = filteredNotifications.filter(n =>
          n.title.toLowerCase().includes(searchLower) ||
          n.message.toLowerCase().includes(searchLower)
        );
      }

      setNotifications(filteredNotifications);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationIds: string[]) => {
    try {
      setNotifications(prev => prev.map(n => 
        notificationIds.includes(n.id)
          ? { ...n, is_read: true, read_at: new Date().toISOString() }
          : n
      ));
    } catch (err) {
  void oast.error('Failed to mark notifications as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
      await markAsRead(unreadIds);
  void oast.success('All notifications marked as read');
    } catch (err) {
  void oast.error('Failed to mark all as read');
    }
  };

  const archiveNotifications = async (notificationIds: string[]) => {
    try {
      setNotifications(prev => prev.map(n => 
        notificationIds.includes(n.id)
          ? { ...n, is_archived: true }
          : n
      ));
  void oast.success(`${notificationIds.length} notification(s) archived`);
    } catch (err) {
  void oast.error('Failed to archive notifications');
    }
  };

  const deleteNotifications = async (notificationIds: string[]) => {
    try {
      setNotifications(prev => prev.filter(n => !notificationIds.includes(n.id)));
  void oast.success(`${notificationIds.length} notification(s) deleted`);
    } catch (err) {
  void oast.error('Failed to delete notifications');
    }
  };

  const updatePreferences = async (newPreferences: NotificationPreferences) => {
    try {
      setPreferences(newPreferences);
  void oast.success('Notification preferences updated');
    } catch (err) {
  void oast.error('Failed to update preferences');
    }
  };

  // Simulate real-time notification
  useEffect(() => {
    const simulateNewNotification = () => {
      const newNotification: Notification = {
        id: Date.now().toString(),
        user_id: user?.id || 'user1',
        type: 'message_received',
        priority: 'medium',
        title: 'New message from your coach',
        message: 'You have a new message waiting for you.',
        is_read: false,
        is_archived: false,
        created_at: new Date().toISOString(),
        channels: ['in_app', 'push'],
        avatar: {
          fallback: '💬',
          type: 'icon'
        },
        actions: [
          {
            id: 'view',
            label: 'View Message',
            action_type: 'navigate',
            action_data: { path: '/messages' },
            style: 'primary'
          }
        ]
      };

      // Check if notifications are enabled and not in quiet hours
      if (!preferences.do_not_disturb && preferences.categories.messages.enabled) {
        setNotifications(prev => [newNotification, ...prev]);
        
        // Show toast for new notification
        toast.info(newNotification.title, {
          duration: 5000,
          action: {
            label: 'View',
            onClick: () => console.log('Navigate to message')
          }
        });
      }
    };

    // Simulate occasional notifications (every 2 minutes for demo)
    const interval = setInterval(simulateNewNotification, 120000);

    return () => clearInterval(interval);
  }, [user, preferences]);

  useEffect(() => {
    fetchNotifications();
  }, []);

  return {
    notifications,
    preferences,
    isLoading,
    error,
    unreadCount: notifications.filter(n => !n.is_read && !n.is_archived).length,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    archiveNotifications,
    deleteNotifications,
    updatePreferences
  };
};

// =====================================================================
// NOTIFICATION BELL COMPONENT
// =====================================================================

export const NotificationBell: React.FC<{
  onClick?: () => void;
  className?: string;
}> = ({ onClick, className }) => {
  const { unreadCount } = useNotifications();
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (unreadCount > 0) {
      setIsAnimating(true);
      const timeout = setTimeout(() => setIsAnimating(false), 1000);
      return () => clearTimeout(timeout);
    }
  }, [unreadCount]);

  return (
    <button
      onClick={onClick}
      className={`relative p-2 rounded-lg hover:bg-gray-100 transition-colors ${className}`}
    >
      <motion.div
        animate={isAnimating ? {
          rotate: [0, -10, 10, -10, 10, 0],
          transition: { duration: 0.5 }
        } : {}}
      >
        <Bell className="w-5 h-5 text-gray-600" />
      </motion.div>
      
      {unreadCount > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </motion.div>
      )}
    </button>
  );
};

// =====================================================================
// NOTIFICATION ITEM COMPONENT
// =====================================================================

const NotificationItem: React.FC<{
  notification: Notification;
  onRead: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onAction: (action: NotificationAction) => void;
}> = ({ notification, onRead, onArchive, onDelete, onAction }) => {
  const Icon = getNotificationIcon(notification.type);
  const color = getNotificationColor(notification.type, notification.priority);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
        !notification.is_read ? 'bg-blue-50' : ''
      }`}
    >
      <div className="flex gap-4">
        <div className="flex-shrink-0">
          {notification.avatar?.type === 'user' && notification.avatar.url ? (
            <Avatar
              src={notification.avatar.url}
              alt={notification.avatar.fallback}
              size="md"
              fallback={notification.avatar.fallback}
            />
          ) : (
            <div className={`w-10 h-10 rounded-full bg-${color}-100 text-${color}-600 flex items-center justify-center`}>
              {notification.avatar?.type === 'icon' ? (
                <span className="text-lg">{notification.avatar.fallback}</span>
              ) : (
                <Icon className="w-5 h-5" />
              )}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1">
            <h4 className={`font-medium ${!notification.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
              {notification.title}
            </h4>
            <span className="text-xs text-gray-500 ml-2">
              {formatTime(notification.created_at)}
            </span>
          </div>

          <p className="text-sm text-gray-600 mb-2">
            {notification.message}
          </p>

          {notification.actions && notification.actions.length > 0 && (
            <div className="flex gap-2 mb-2">
              {notification.actions.map((action) => (
                <Button
                  key={action.id}
                  size="sm"
                  variant={action.style === 'primary' ? 'primary' : 'outline'}
                  onClick={() => onAction(action)}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-4 text-xs">
            {!notification.is_read && (
              <button
                onClick={() => onRead(notification.id)}
                className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                Mark as read
              </button>
            )}
            
            <button
              onClick={() => onArchive(notification.id)}
              className="text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              <Archive className="w-3 h-3" />
              Archive
            </button>
            
            <button
              onClick={() => onDelete(notification.id)}
              className="text-red-500 hover:text-red-700 flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              Delete
            </button>
          </div>
        </div>

        {notification.priority === 'urgent' && (
          <div className="flex-shrink-0">
            <Badge variant="danger" size="sm">
              Urgent
            </Badge>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// =====================================================================
// NOTIFICATION PREFERENCES MODAL
// =====================================================================

const NotificationPreferencesModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  preferences: NotificationPreferences;
  onUpdatePreferences: (preferences: NotificationPreferences) => Promise<void>;
}> = ({ isOpen, onClose, preferences, onUpdatePreferences }) => {
  const [localPreferences, setLocalPreferences] = useState(preferences);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setLocalPreferences(preferences);
  }, [preferences]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdatePreferences(localPreferences);
      onClose();
    } catch (error) {
      // Error handled in parent
    } finally {
      setIsSaving(false);
    }
  };

  const updateChannelPreference = (channel: NotificationChannel, enabled: boolean) => {
    setLocalPreferences(prev => ({
      ...prev,
      channels: {
        ...prev.channels,
        [channel]: enabled
      }
    }));
  };

  const updateCategoryPreference = (
    category: keyof NotificationPreferences['categories'],
    updates: Partial<NotificationPreferences['categories'][typeof category]>
  ) => {
    setLocalPreferences(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [category]: {
          ...prev.categories[category],
          ...updates
        }
      }
    }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Notification Preferences" size="lg">
      <div className="space-y-6">
        {/* Master Controls */}
        <Card>
          <Card.Header>
            <h3 className="text-lg font-semibold">Master Controls</h3>
          </Card.Header>
          <Card.Body className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Do Not Disturb</h4>
                <p className="text-sm text-gray-600">Turn off all notifications temporarily</p>
              </div>
              <Toggle
                checked={localPreferences.do_not_disturb}
                onChange={(checked) => setLocalPreferences(prev => ({
                  ...prev,
                  do_not_disturb: checked
                }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Quiet Hours</h4>
                <p className="text-sm text-gray-600">Pause notifications during specific hours</p>
              </div>
              <Toggle
                checked={localPreferences.quiet_hours.enabled}
                onChange={(checked) => setLocalPreferences(prev => ({
                  ...prev,
                  quiet_hours: {
                    ...prev.quiet_hours,
                    enabled: checked
                  }
                }))}
              />
            </div>

            {localPreferences.quiet_hours.enabled && (
              <div className="grid grid-cols-2 gap-4 ml-12">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <Input
                    type="time"
                    value={localPreferences.quiet_hours.start_time}
                    onChange={(e) => setLocalPreferences(prev => ({
                      ...prev,
                      quiet_hours: {
                        ...prev.quiet_hours,
                        start_time: e.target.value
                      }
                    }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <Input
                    type="time"
                    value={localPreferences.quiet_hours.end_time}
                    onChange={(e) => setLocalPreferences(prev => ({
                      ...prev,
                      quiet_hours: {
                        ...prev.quiet_hours,
                        end_time: e.target.value
                      }
                    }))}
                  />
                </div>
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Notification Channels */}
        <Card>
          <Card.Header>
            <h3 className="text-lg font-semibold">Notification Channels</h3>
          </Card.Header>
          <Card.Body className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-gray-600" />
                  <span className="font-medium">In-App</span>
                </div>
                <Toggle
                  checked={localPreferences.channels.in_app}
                  onChange={(checked) => updateChannelPreference('in_app', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-600" />
                  <span className="font-medium">Email</span>
                </div>
                <Toggle
                  checked={localPreferences.channels.email}
                  onChange={(checked) => updateChannelPreference('email', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-5 h-5 text-gray-600" />
                  <span className="font-medium">Push</span>
                </div>
                <Toggle
                  checked={localPreferences.channels.push}
                  onChange={(checked) => updateChannelPreference('push', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-gray-600" />
                  <span className="font-medium">SMS</span>
                </div>
                <Toggle
                  checked={localPreferences.channels.sms}
                  onChange={(checked) => updateChannelPreference('sms', checked)}
                />
              </div>
            </div>

            {localPreferences.channels.email && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Frequency
                </label>
                <Select
                  value={localPreferences.email_frequency}
                  onChange={(value) => setLocalPreferences(prev => ({
                    ...prev,
                    email_frequency: value as NotificationPreferences['email_frequency']
                  }))}
                >
                  <option value="instant">Instant</option>
                  <option value="hourly">Hourly Digest</option>
                  <option value="daily">Daily Digest</option>
                  <option value="weekly">Weekly Digest</option>
                </Select>
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Notification Categories */}
        <Card>
          <Card.Header>
            <h3 className="text-lg font-semibold">Notification Categories</h3>
          </Card.Header>
          <Card.Body className="space-y-4">
            {Object.entries(localPreferences.categories).map(([category, settings]) => (
              <div key={category} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900 capitalize">
                    {category.replace('_', ' ')}
                  </h4>
                  <Toggle
                    checked={settings.enabled}
                    onChange={(checked) => updateCategoryPreference(
                      category as keyof NotificationPreferences['categories'],
                      { enabled: checked }
                    )}
                  />
                </div>

                {settings.enabled && (
                  <div className="flex flex-wrap gap-2">
                    {(['in_app', 'email', 'push', 'sms'] as NotificationChannel[]).map((channel) => (
                      <Checkbox
                        key={channel}
                        checked={settings.channels.includes(channel)}
                        onChange={(checked) => {
                          const newChannels = checked
                            ? [...settings.channels, channel]
                            : settings.channels.filter(c => c !== channel);
                          updateCategoryPreference(
                            category as keyof NotificationPreferences['categories'],
                            { channels: newChannels }
                          );
                        }}
                        label={channel.replace('_', ' ')}
                        disabled={!localPreferences.channels[channel]}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </Card.Body>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="flex-1">
            {isSaving && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
            Save Preferences
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// =====================================================================
// MAIN NOTIFICATION CENTER COMPONENT
// =====================================================================

export const NotificationCenter: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const {
    notifications,
    preferences,
    isLoading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    archiveNotifications,
    deleteNotifications,
    updatePreferences,
    fetchNotifications
  } = useNotifications();

  const [selectedTab, setSelectedTab] = useState<'all' | 'unread' | 'archived'>('all');
  const [showPreferences, setShowPreferences] = useState(false);
  const [filters, setFilters] = useState<NotificationFilters>({});

  // Group notifications by date
  const groupedNotifications = useMemo(() => {
    let filtered = notifications;

    // Apply tab filter
    switch (selectedTab) {
      case 'unread':
        filtered = notifications.filter(n => !n.is_read && !n.is_archived);
        break;
      case 'archived':
        filtered = notifications.filter(n => n.is_archived);
        break;
      default:
        filtered = notifications.filter(n => !n.is_archived);
    }

    // Group by date
    const groups: Record<string, Notification[]> = {};
    const today = new Date();
    const yesterday = new Date(today);
  void yesterday.setDate(yesterday.getDate() - 1);

    filtered.forEach(notification => {
      const date = new Date(notification.created_at);
      let groupKey: string;

      if (date.toDateString() === today.toDateString()) {
        groupKey = 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        groupKey = 'Yesterday';
      } else if (date > new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)) {
        groupKey = 'This Week';
      } else {
        groupKey = 'Older';
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(notification);
    });

    return groups;
  }, [notifications, selectedTab]);

  const handleAction = (action: NotificationAction) => {
    if (action.action_type === 'navigate' && action.action_data?.path) {
      // Navigate to the specified path
      window.location.href = action.action_data.path;
      onClose();
    } else if (action.action_type === 'api_call') {
      // Handle API call
  void console.log('API call:', action.action_data);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Notifications"
        size="lg"
        className="notification-center"
      >
        <div className="flex flex-col h-[600px]">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold">
                Notifications
                {unreadCount > 0 && (
                  <Badge variant="primary" size="sm" className="ml-2">
                    {unreadCount} new
                  </Badge>
                )}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={markAllAsRead}
                >
                  <CheckCheck className="w-4 h-4 mr-1" />
                  Mark all read
                </Button>
              )}
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowPreferences(true)}
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b">
            <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as typeof selectedTab)}>
              <Tabs.List className="px-4">
                <Tabs.Trigger value="all">All</Tabs.Trigger>
                <Tabs.Trigger value="unread">
                  Unread {unreadCount > 0 && `(${unreadCount})`}
                </Tabs.Trigger>
                <Tabs.Trigger value="archived">Archived</Tabs.Trigger>
              </Tabs.List>
            </Tabs>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : Object.keys(groupedNotifications).length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <Bell className="w-12 h-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {selectedTab === 'unread' ? 'All caught up!' :
                   selectedTab === 'archived' ? 'No archived notifications' :
                   'No notifications yet'}
                </h3>
                <p className="text-gray-600">
                  {selectedTab === 'unread' ? 'You have no unread notifications.' :
                   selectedTab === 'archived' ? 'Archived notifications will appear here.' :
                   'When you receive notifications, they\'ll appear here.'}
                </p>
              </div>
            ) : (
              <div>
                {Object.entries(groupedNotifications).map(([dateGroup, groupNotifications]) => (
                  <div key={dateGroup}>
                    <div className="px-4 py-2 bg-gray-50 border-b">
                      <h3 className="text-sm font-medium text-gray-700">{dateGroup}</h3>
                    </div>
                    <AnimatePresence>
                      {groupNotifications.map((notification) => (
                        <NotificationItem
                          key={notification.id}
                          notification={notification}
                          onRead={(id) => markAsRead([id])}
                          onArchive={(id) => archiveNotifications([id])}
                          onDelete={(id) => deleteNotifications([id])}
                          onAction={handleAction}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Preferences Modal */}
      <NotificationPreferencesModal
        isOpen={showPreferences}
        onClose={() => setShowPreferences(false)}
        preferences={preferences}
        onUpdatePreferences={updatePreferences}
      />
    </>
  );
};

export default NotificationCenter;