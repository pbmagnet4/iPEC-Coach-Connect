import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type NotificationType = 
  | 'session_booked'
  | 'session_reminder'
  | 'session_canceled'
  | 'new_message'
  | 'resource_update'
  | 'community_reply'
  | 'feedback_request'
  | 'client_message'
  | 'feedback_received'
  | 'content_contribution';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, any>;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

export const useNotifications = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      addNotification: (notification) => {
        const newNotification: Notification = {
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          read: false,
          ...notification,
        };
        set((state) => ({
          notifications: [newNotification, ...state.notifications],
          unreadCount: state.unreadCount + 1,
        }));
      },
      markAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        }));
      },
      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        }));
      },
      removeNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
          unreadCount: state.notifications.find((n) => n.id === id)?.read
            ? state.unreadCount
            : Math.max(0, state.unreadCount - 1),
        }));
      },
      clearAll: () => {
        set({ notifications: [], unreadCount: 0 });
      },
    }),
    {
      name: 'notifications-storage',
    }
  )
);

export function createNotification(type: NotificationType, data: any): Omit<Notification, 'id' | 'timestamp' | 'read'> {
  switch (type) {
    case 'session_booked':
      return {
        type,
        title: 'New Session Booked',
        message: `Session booked with ${data.coachName} on ${new Date(data.date).toLocaleDateString()}`,
        actionUrl: `/sessions/${data.sessionId}`,
        actionLabel: 'View Session',
        metadata: data,
      };
    case 'session_reminder':
      return {
        type,
        title: 'Upcoming Session Reminder',
        message: `Your session with ${data.coachName} starts in 24 hours`,
        actionUrl: `/sessions/${data.sessionId}`,
        actionLabel: 'View Details',
        metadata: data,
      };
    case 'session_canceled':
      return {
        type,
        title: 'Session Canceled',
        message: `Session with ${data.coachName} on ${new Date(data.date).toLocaleDateString()} has been canceled`,
        actionUrl: '/sessions',
        actionLabel: 'View Sessions',
        metadata: data,
      };
    case 'new_message':
      return {
        type,
        title: 'New Message',
        message: `${data.senderName} sent you a message`,
        actionUrl: `/messages/${data.conversationId}`,
        actionLabel: 'Read Message',
        metadata: data,
      };
    case 'resource_update':
      return {
        type,
        title: 'New Resource Available',
        message: `${data.resourceName} has been added to your library`,
        actionUrl: `/coaching-resources`,
        actionLabel: 'View Resource',
        metadata: data,
      };
    case 'community_reply':
      return {
        type,
        title: 'New Reply',
        message: `${data.authorName} replied to your discussion`,
        actionUrl: `/community/discussions/${data.discussionId}`,
        actionLabel: 'View Reply',
        metadata: data,
      };
    case 'feedback_request':
      return {
        type,
        title: 'Feedback Requested',
        message: `Please provide feedback for your session with ${data.coachName}`,
        actionUrl: `/feedback/${data.sessionId}`,
        actionLabel: 'Give Feedback',
        metadata: data,
      };
    default:
      return {
        type,
        title: 'Notification',
        message: 'You have a new notification',
        metadata: data,
      };
  }
}