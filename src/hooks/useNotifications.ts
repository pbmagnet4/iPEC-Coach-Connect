/**
 * useNotifications Hook
 * React hook for managing notifications with real-time updates and state management
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { notificationsService } from '../services/notifications.service';
import type { 
  Notification, 
  NotificationPreferences, 
  NotificationType,
  SendNotificationOptions
} from '../services/notifications.service';
import { useAuthStore } from '../stores/authStore';

interface UseNotificationsOptions {
  limit?: number;
  offset?: number;
  filter?: 'unread' | NotificationType;
  realtime?: boolean;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  sendNotification: (options: SendNotificationOptions) => Promise<Notification | null>;
}

interface UseNotificationPreferencesReturn {
  preferences: NotificationPreferences | null;
  loading: boolean;
  error: string | null;
  updatePreferences: (updates: Partial<NotificationPreferences>) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useNotifications(options: UseNotificationsOptions = {}): UseNotificationsReturn {
  const {
    limit = 20,
    offset: initialOffset = 0,
    filter,
    realtime = true
  } = options;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(initialOffset);

  const { user } = useAuthStore();
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const mountedRef = useRef(true);

  // Load notifications
  const loadNotifications = useCallback(async (reset = false) => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const currentOffset = reset ? 0 : offset;
      const result = await notificationsService.getUserNotifications(user.id, {
        limit,
        offset: currentOffset,
        unread_only: filter === 'unread',
        type: filter && filter !== 'unread' ? filter : undefined
      });

      if (!mountedRef.current) return;

      if (reset) {
        setNotifications(result.notifications);
        setOffset(limit);
      } else {
        setNotifications(prev => [...prev, ...result.notifications]);
        setOffset(prev => prev + limit);
      }

      setHasMore(result.notifications.length === limit);

      // Update unread count
      const unreadResult = await notificationsService.getUserNotifications(user.id, {
        limit: 1000,
        unread_only: true
      });

      if (mountedRef.current) {
        setUnreadCount(unreadResult.total);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to load notifications');
  void console.error('Failed to load notifications:', err);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [user?.id, limit, offset, filter]);

  // Load more notifications
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    await loadNotifications(false);
  }, [loading, hasMore, loadNotifications]);

  // Refresh notifications
  const refresh = useCallback(async () => {
    setOffset(0);
    await loadNotifications(true);
  }, [loadNotifications]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!user?.id) return;

    try {
      await notificationsService.markAsRead(notificationId, user.id);
      
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId
            ? { ...notification, read_at: new Date().toISOString() }
            : notification
        )
      );

      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
  void console.error('Failed to mark notification as read:', err);
      setError(err instanceof Error ? err.message : 'Failed to mark as read');
    }
  }, [user?.id]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Mark all unread notifications as read
      const unreadNotifications = notifications.filter(n => !n.read_at);
      
      await Promise.all(
        unreadNotifications.map(notification =>
          notificationsService.markAsRead(notification.id, user.id)
        )
      );

      setNotifications(prev =>
        prev.map(notification => ({
          ...notification,
          read_at: notification.read_at || new Date().toISOString()
        }))
      );

      setUnreadCount(0);
    } catch (err) {
  void console.error('Failed to mark all notifications as read:', err);
      setError(err instanceof Error ? err.message : 'Failed to mark all as read');
    }
  }, [user?.id, notifications]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    if (!user?.id) return;

    try {
      await notificationsService.deleteNotification(notificationId, user.id);
      
      const deletedNotification = notifications.find(n => n.id === notificationId);
      
      setNotifications(prev => prev.filter(n => n.id !== notificationId));

      if (deletedNotification && !deletedNotification.read_at) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
  void console.error('Failed to delete notification:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete notification');
    }
  }, [user?.id, notifications]);

  // Send notification
  const sendNotification = useCallback(async (
    options: SendNotificationOptions
  ): Promise<Notification | null> => {
    try {
      const notification = await notificationsService.sendNotification(options);
      
      // If sending to current user, add to local state
      if (user?.id === options.user_id) {
        setNotifications(prev => [notification, ...prev]);
        if (!notification.read_at) {
          setUnreadCount(prev => prev + 1);
        }
      }

      return notification;
    } catch (err) {
  void console.error('Failed to send notification:', err);
      setError(err instanceof Error ? err.message : 'Failed to send notification');
      return null;
    }
  }, [user?.id]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user?.id || !realtime) return;

    const unsubscribe = notificationsService.subscribeToUserNotifications(
      user.id,
      (notification) => {
        if (!mountedRef.current) return;

        setNotifications(prev => {
          // Check if notification already exists
          const exists = prev.some(n => n.id === notification.id);
          if (exists) return prev;

          return [notification, ...prev];
        });

        if (!notification.read_at) {
          setUnreadCount(prev => prev + 1);
        }
      }
    );

    unsubscribeRef.current = unsubscribe;

    return () => {
      unsubscribe();
      unsubscribeRef.current = null;
    };
  }, [user?.id, realtime]);

  // Initial load
  useEffect(() => {
    if (user?.id) {
      loadNotifications(true);
    }
  }, [user?.id, filter]);

  // Cleanup
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (unsubscribeRef.current) {
  void unsubscribeRef.current();
      }
    };
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    sendNotification
  };
}

export function useNotificationPreferences(): UseNotificationPreferencesReturn {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuthStore();
  const mountedRef = useRef(true);

  // Load preferences
  const loadPreferences = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const userPreferences = await notificationsService.getUserPreferences(user.id);

      if (mountedRef.current) {
        setPreferences(userPreferences);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to load preferences');
  void console.error('Failed to load notification preferences:', err);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [user?.id]);

  // Update preferences
  const updatePreferences = useCallback(async (
    updates: Partial<Omit<NotificationPreferences, 'user_id' | 'created_at' | 'updated_at'>>
  ) => {
    if (!user?.id || !preferences) return;

    try {
      setError(null);

      const updatedPreferences = await notificationsService.updateUserPreferences(
        user.id,
        updates
      );

      if (mountedRef.current) {
        setPreferences(updatedPreferences);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to update preferences');
  void console.error('Failed to update notification preferences:', err);
      }
    }
  }, [user?.id, preferences]);

  // Refresh preferences
  const refresh = useCallback(async () => {
    await loadPreferences();
  }, [loadPreferences]);

  // Initial load
  useEffect(() => {
    if (user?.id) {
      loadPreferences();
    }
  }, [user?.id, loadPreferences]);

  // Cleanup
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    preferences,
    loading,
    error,
    updatePreferences,
    refresh
  };
}

// Utility hook for sending specific notification types
export function useNotificationSender() {
  const { sendNotification } = useNotifications({ realtime: false });

  const sendSessionReminder = useCallback(async (
    userId: string,
    sessionData: { coach_name: string; session_time: string; session_id: string }
  ) => {
    return sendNotification({
      user_id: userId,
      type: 'session_reminder',
      title: 'Upcoming Session Reminder',
      message: `Your session with ${sessionData.coach_name} starts in 1 hour`,
      data: {
        session_id: sessionData.session_id,
        action_url: `/sessions/${sessionData.session_id}`
      },
      priority: 'high'
    });
  }, [sendNotification]);

  const sendPaymentConfirmation = useCallback(async (
    userId: string,
    paymentData: { amount: number; session_id: string }
  ) => {
    return sendNotification({
      user_id: userId,
      type: 'payment_received',
      title: 'Payment Confirmation',
      message: `Payment of $${paymentData.amount} has been processed successfully`,
      data: {
        amount: paymentData.amount,
        session_id: paymentData.session_id,
        action_url: `/sessions/${paymentData.session_id}`
      },
      priority: 'medium'
    });
  }, [sendNotification]);

  const sendWelcomeMessage = useCallback(async (
    userId: string,
    userData: { name: string }
  ) => {
    return sendNotification({
      user_id: userId,
      type: 'welcome',
      title: `Welcome to iPEC Coach Connect, ${userData.name}!`,
      message: 'Complete your profile to get matched with the perfect coach for your journey',
      data: {
        action_url: '/profile/complete'
      },
      priority: 'medium'
    });
  }, [sendNotification]);

  const sendSecurityAlert = useCallback(async (
    userId: string,
    alertData: { event: string; location: string; timestamp: string }
  ) => {
    return sendNotification({
      user_id: userId,
      type: 'security_alert',
      title: 'Security Alert',
      message: `New ${alertData.event} detected from ${alertData.location}`,
      data: {
        event: alertData.event,
        location: alertData.location,
        timestamp: alertData.timestamp,
        action_url: '/settings/security'
      },
      priority: 'urgent'
    });
  }, [sendNotification]);

  return {
    sendSessionReminder,
    sendPaymentConfirmation,
    sendWelcomeMessage,
    sendSecurityAlert,
    sendCustomNotification: sendNotification
  };
}