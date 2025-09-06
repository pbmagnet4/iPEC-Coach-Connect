/**
 * Notification Toast Component
 * Real-time toast notifications with animations and actions
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Check, 
  AlertTriangle, 
  Info, 
  Bell,
  Calendar,
  CreditCard,
  MessageSquare,
  Shield,
  Zap,
  CheckCircle
} from 'lucide-react';
import { Button } from '../ui/Button';
import type { Notification } from '../../services/notifications.service';

interface ToastNotification extends Notification {
  id: string;
  autoHide?: boolean;
  duration?: number;
  actions?: ToastAction[];
}

interface ToastAction {
  label: string;
  action: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
}

interface NotificationToastProps {
  notifications: ToastNotification[];
  onDismiss: (id: string) => void;
  onAction: (notificationId: string, actionLabel: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  maxVisible?: number;
}

const TOAST_ICONS = {
  session_reminder: <Calendar className="w-5 h-5" />,
  session_confirmed: <CheckCircle className="w-5 h-5" />,
  session_cancelled: <X className="w-5 h-5" />,
  session_rescheduled: <Calendar className="w-5 h-5" />,
  payment_received: <CreditCard className="w-5 h-5" />,
  payment_failed: <CreditCard className="w-5 h-5" />,
  coach_message: <MessageSquare className="w-5 h-5" />,
  system_update: <Info className="w-5 h-5" />,
  welcome: <CheckCircle className="w-5 h-5" />,
  profile_incomplete: <AlertTriangle className="w-5 h-5" />,
  subscription_expiring: <AlertTriangle className="w-5 h-5" />,
  new_feature: <Zap className="w-5 h-5" />,
  maintenance: <Info className="w-5 h-5" />,
  security_alert: <Shield className="w-5 h-5" />
};

const TOAST_STYLES = {
  session_reminder: 'bg-blue-600 text-white',
  session_confirmed: 'bg-green-600 text-white',
  session_cancelled: 'bg-red-600 text-white',
  session_rescheduled: 'bg-yellow-600 text-white',
  payment_received: 'bg-green-600 text-white',
  payment_failed: 'bg-red-600 text-white',
  coach_message: 'bg-purple-600 text-white',
  system_update: 'bg-blue-600 text-white',
  welcome: 'bg-green-600 text-white',
  profile_incomplete: 'bg-yellow-600 text-white',
  subscription_expiring: 'bg-orange-600 text-white',
  new_feature: 'bg-purple-600 text-white',
  maintenance: 'bg-gray-600 text-white',
  security_alert: 'bg-red-600 text-white'
};

const POSITION_CLASSES = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
  'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2'
};

export function NotificationToast({
  notifications,
  onDismiss,
  onAction,
  position = 'top-right',
  maxVisible = 5
}: NotificationToastProps) {
  const visibleNotifications = notifications.slice(0, maxVisible);

  return (
    <div className={`fixed z-50 space-y-2 ${POSITION_CLASSES[position]}`}>
      <AnimatePresence mode="popLayout">
        {visibleNotifications.map((notification, index) => (
          <ToastItem
            key={notification.id}
            notification={notification}
            index={index}
            onDismiss={onDismiss}
            onAction={onAction}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

interface ToastItemProps {
  notification: ToastNotification;
  index: number;
  onDismiss: (id: string) => void;
  onAction: (notificationId: string, actionLabel: string) => void;
}

function ToastItem({ notification, index, onDismiss, onAction }: ToastItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [progress, setProgress] = useState(100);

  const duration = notification.duration || 5000; // 5 seconds default
  const autoHide = notification.autoHide ?? true;

  useEffect(() => {
    if (!autoHide || isHovered) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, duration - elapsed);
      const progressPercent = (remaining / duration) * 100;
      
      setProgress(progressPercent);

      if (remaining <= 0) {
        onDismiss(notification.id);
      }
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, [notification.id, duration, autoHide, isHovered, onDismiss]);

  const handleAction = (actionLabel: string) => {
    onAction(notification.id, actionLabel);
  };

  const icon = TOAST_ICONS[notification.type] || <Bell className="w-5 h-5" />;
  const style = TOAST_STYLES[notification.type] || 'bg-gray-600 text-white';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 300, scale: 0.3 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.5 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`
        relative w-80 rounded-lg shadow-lg overflow-hidden
        ${style}
        ${isHovered ? 'shadow-xl' : ''}
        transition-shadow duration-200
      `}>
        {/* Progress bar */}
        {autoHide && (
          <div className="absolute top-0 left-0 h-1 bg-black bg-opacity-20 w-full">
            <motion.div
              className="h-full bg-white bg-opacity-50"
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
        )}

        <div className="p-4">
          <div className="flex items-start space-x-3">
            {/* Icon */}
            <div className="flex-shrink-0 pt-0.5">
              {icon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium mb-1">
                {notification.title}
              </h4>
              <p className="text-sm opacity-90 mb-3">
                {notification.message}
              </p>

              {/* Actions */}
              {notification.actions && notification.actions.length > 0 && (
                <div className="flex items-center space-x-2">
                  {notification.actions.map((action, actionIndex) => (
                    <button
                      key={actionIndex}
                      onClick={() => handleAction(action.label)}
                      className={`
                        px-3 py-1.5 text-xs font-medium rounded
                        ${action.variant === 'primary' 
                          ? 'bg-white bg-opacity-20 hover:bg-opacity-30' 
                          : action.variant === 'danger'
                          ? 'bg-red-500 hover:bg-red-600'
                          : 'bg-black bg-opacity-20 hover:bg-opacity-30'
                        }
                        transition-colors duration-150
                      `}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Close button */}
            <button
              onClick={() => onDismiss(notification.id)}
              className="flex-shrink-0 p-1 hover:bg-white hover:bg-opacity-20 rounded transition-colors duration-150"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Toast notification manager hook
export function useToastNotifications() {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const addToast = (notification: Omit<ToastNotification, 'id'>) => {
    const toast: ToastNotification = {
      ...notification,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    setToasts(prev => [toast, ...prev]);
    
    return toast.id;
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const clearToasts = () => {
    setToasts([]);
  };

  const handleToastAction = (notificationId: string, actionLabel: string) => {
    const toast = toasts.find(t => t.id === notificationId);
    if (toast && toast.actions) {
      const action = toast.actions.find(a => a.label === actionLabel);
      if (action) {
        action.action();
        removeToast(notificationId);
      }
    }
  };

  // Helper functions for common toast types
  const showSuccess = (title: string, message: string, actions?: ToastAction[]) => {
    return addToast({
      user_id: '', // Not used for local toasts
      type: 'session_confirmed',
      title,
      message,
      channel: ['in_app'],
      priority: 'medium',
      status: 'delivered',
      actions,
      duration: 4000
    });
  };

  const showError = (title: string, message: string, actions?: ToastAction[]) => {
    return addToast({
      user_id: '',
      type: 'payment_failed',
      title,
      message,
      channel: ['in_app'],
      priority: 'high',
      status: 'delivered',
      actions,
      duration: 6000
    });
  };

  const showWarning = (title: string, message: string, actions?: ToastAction[]) => {
    return addToast({
      user_id: '',
      type: 'profile_incomplete',
      title,
      message,
      channel: ['in_app'],
      priority: 'medium',
      status: 'delivered',
      actions,
      duration: 5000
    });
  };

  const showInfo = (title: string, message: string, actions?: ToastAction[]) => {
    return addToast({
      user_id: '',
      type: 'system_update',
      title,
      message,
      channel: ['in_app'],
      priority: 'low',
      status: 'delivered',
      actions,
      duration: 4000
    });
  };

  const showSecurityAlert = (title: string, message: string, actions?: ToastAction[]) => {
    return addToast({
      user_id: '',
      type: 'security_alert',
      title,
      message,
      channel: ['in_app'],
      priority: 'urgent',
      status: 'delivered',
      actions,
      duration: 8000,
      autoHide: false // Security alerts should not auto-hide
    });
  };

  return {
    toasts,
    addToast,
    removeToast,
    clearToasts,
    handleToastAction,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showSecurityAlert
  };
}

// Global toast notification provider component
export function ToastNotificationProvider({ children }: { children: React.ReactNode }) {
  const {
    toasts,
    removeToast,
    handleToastAction
  } = useToastNotifications();

  return (
    <>
      {children}
      <NotificationToast
        notifications={toasts}
        onDismiss={removeToast}
        onAction={handleToastAction}
        position="top-right"
        maxVisible={5}
      />
    </>
  );
}