/**
 * Notification Center Component
 * Comprehensive notification management interface with real-time updates
 */

import React, { useEffect, useRef, useState } from 'react';
import { 
  AlertCircle, 
  Bell, 
  Calendar, 
  Check, 
  CheckCircle, 
  Clock,
  CreditCard,
  Filter,
  Info,
  MessageSquare,
  MoreHorizontal,
  Settings,
  Shield,
  Trash2,
  X,
  Zap
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '../ui/Button';
import { useNotifications } from '../../hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import type { Notification, NotificationType } from '../../services/notifications.service';

interface NotificationCenterProps {
  className?: string;
}

interface NotificationItemProps {
  notification: Notification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
  onAction: (id: string, action: string) => void;
}

const NOTIFICATION_ICONS: Record<NotificationType, React.ReactNode> = {
  session_reminder: <Calendar className="w-5 h-5 text-blue-600" />,
  session_confirmed: <CheckCircle className="w-5 h-5 text-green-600" />,
  session_cancelled: <X className="w-5 h-5 text-red-600" />,
  session_rescheduled: <Clock className="w-5 h-5 text-yellow-600" />,
  payment_received: <CreditCard className="w-5 h-5 text-green-600" />,
  payment_failed: <CreditCard className="w-5 h-5 text-red-600" />,
  coach_message: <MessageSquare className="w-5 h-5 text-purple-600" />,
  system_update: <Info className="w-5 h-5 text-blue-600" />,
  welcome: <CheckCircle className="w-5 h-5 text-green-600" />,
  profile_incomplete: <AlertCircle className="w-5 h-5 text-yellow-600" />,
  subscription_expiring: <Clock className="w-5 h-5 text-orange-600" />,
  new_feature: <Zap className="w-5 h-5 text-purple-600" />,
  maintenance: <Settings className="w-5 h-5 text-gray-600" />,
  security_alert: <Shield className="w-5 h-5 text-red-600" />
};

const PRIORITY_COLORS = {
  low: 'border-l-gray-300',
  medium: 'border-l-blue-500',
  high: 'border-l-orange-500',
  urgent: 'border-l-red-500'
};

export function NotificationCenter({ className = '' }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | NotificationType>('all');
  const [showSettings, setShowSettings] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    loadMore,
    hasMore
  } = useNotifications({
    filter: filter === 'all' ? undefined : filter === 'unread' ? 'unread' : filter,
    limit: 20
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowSettings(false);
      }
    }

  void document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read_at) {
      markAsRead(notification.id);
    }

    // Handle notification actions based on type
    if (notification.data?.action_url) {
      window.location.href = notification.data.action_url;
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.read_at;
    return notification.type === filter;
  });

  const notificationTypes = Array.from(new Set(notifications.map(n => n.type)));

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Notification Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllAsRead()}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Settings Panel */}
            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-b border-gray-200 p-4 bg-gray-50"
                >
                  <NotificationSettings onClose={() => setShowSettings(false)} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Filters */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center space-x-2 overflow-x-auto">
                <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1 text-sm rounded-full whitespace-nowrap ${
                    filter === 'all'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={`px-3 py-1 text-sm rounded-full whitespace-nowrap ${
                    filter === 'unread'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Unread
                </button>
                {notificationTypes.slice(0, 3).map(type => (
                  <button
                    key={type}
                    onClick={() => setFilter(type)}
                    className={`px-3 py-1 text-sm rounded-full whitespace-nowrap ${
                      filter === type
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {type.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {loading && notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Loading notifications...</p>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {filter === 'unread' ? 'No unread notifications' : 'No notifications found'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredNotifications.map((notification, index) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <NotificationItem
                        notification={notification}
                        onRead={markAsRead}
                        onDelete={deleteNotification}
                        onAction={handleNotificationClick}
                      />
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Load More Button */}
              {hasMore && !loading && (
                <div className="p-4 border-t border-gray-200">
                  <button
                    onClick={loadMore}
                    className="w-full text-center text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Load more notifications
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setIsOpen(false);
                  // Navigate to full notifications page
                  window.location.href = '/notifications';
                }}
                className="w-full text-center text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                View all notifications
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NotificationItem({ notification, onRead, onDelete, onAction }: NotificationItemProps) {
  const [showActions, setShowActions] = useState(false);
  const isUnread = !notification.read_at;

  const handleClick = () => {
    onAction(notification.id, 'click');
  };

  const timeAgo = formatDistanceToNow(new Date(notification.created_at), { addSuffix: true });

  return (
    <div
      className={`relative p-4 hover:bg-gray-50 cursor-pointer transition-colors border-l-4 ${
        PRIORITY_COLORS[notification.priority]
      } ${isUnread ? 'bg-blue-50' : ''}`}
      onClick={handleClick}
    >
      <div className="flex items-start space-x-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-1">
          {NOTIFICATION_ICONS[notification.type] || <Bell className="w-5 h-5 text-gray-400" />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className={`text-sm font-medium ${isUnread ? 'text-gray-900' : 'text-gray-700'}`}>
                {notification.title}
              </h4>
              <p className={`text-sm mt-1 ${isUnread ? 'text-gray-800' : 'text-gray-600'}`}>
                {notification.message}
              </p>
              <div className="flex items-center space-x-2 mt-2">
                <span className="text-xs text-gray-500">{timeAgo}</span>
                {notification.priority === 'urgent' && (
                  <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                    Urgent
                  </span>
                )}
                {notification.priority === 'high' && (
                  <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
                    High
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-1 ml-2">
              {isUnread && (
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              )}
              
              <button
                onClick={(e) => {
  void e.stopPropagation();
                  setShowActions(!showActions);
                }}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <AnimatePresence>
            {showActions && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-4 top-4 bg-white border border-gray-200 rounded-lg shadow-lg z-10"
              >
                <div className="py-1">
                  {isUnread && (
                    <button
                      onClick={(e) => {
  void e.stopPropagation();
                        onRead(notification.id);
                        setShowActions(false);
                      }}
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      <Check className="w-4 h-4" />
                      <span>Mark as read</span>
                    </button>
                  )}
                  <button
                    onClick={(e) => {
  void e.stopPropagation();
                      onDelete(notification.id);
                      setShowActions(false);
                    }}
                    className="flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function NotificationSettings({ onClose }: { onClose: () => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-900">Notification Settings</h4>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-700">Email notifications</span>
          <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600">
            <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-6" />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-700">Push notifications</span>
          <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600">
            <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-6" />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-700">SMS notifications</span>
          <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200">
            <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-1" />
          </button>
        </div>
      </div>

      <div className="pt-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            // Navigate to full settings page
            window.location.href = '/settings/notifications';
          }}
          className="w-full"
        >
          Manage all settings
        </Button>
      </div>
    </div>
  );
}