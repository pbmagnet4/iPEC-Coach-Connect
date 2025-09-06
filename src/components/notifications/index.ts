/**
 * Notifications Components Export Index
 * Centralized exports for all notification-related components
 */

export { NotificationCenter } from './NotificationCenter';
export { NotificationToast, ToastNotificationProvider, useToastNotifications } from './NotificationToast';
export { NotificationSettings } from './NotificationSettings';

// Service exports
export { notificationsService } from '../../services/notifications.service';

// Hook exports
export { 
  useNotifications, 
  useNotificationPreferences, 
  useNotificationSender 
} from '../../hooks/useNotifications';

// Type exports
export type {
  Notification,
  NotificationTemplate,
  NotificationPreferences,
  NotificationStats,
  NotificationType,
  NotificationChannel,
  NotificationPriority,
  NotificationStatus,
  SendNotificationOptions
} from '../../services/notifications.service';