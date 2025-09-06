# Real-time Notifications System

A comprehensive, enterprise-grade notification system for iPEC Coach Connect providing multi-channel delivery, real-time updates, and advanced user preference management.

## 🎯 Overview

The Real-time Notifications System provides:

- **Multi-Channel Delivery**: Email, Push, SMS, and In-App notifications
- **Real-time Updates**: Live notification delivery using Supabase real-time subscriptions
- **Advanced Preferences**: Granular user control over notification types and delivery
- **Template Management**: Reusable notification templates with variable substitution
- **Analytics & Tracking**: Comprehensive delivery and engagement metrics
- **Toast Notifications**: Real-time in-app toast notifications with actions
- **Batch Processing**: Efficient queue-based notification delivery
- **Quiet Hours**: Time-based notification scheduling with timezone support

## 🏗️ Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Notification System                      │
│                                                             │
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │
│ │ Notification    │ │   Toast         │ │  Settings       │ │
│ │   Center        │ │ Notifications   │ │  Management     │ │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘ │
│                                                             │
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │
│ │  Real-time      │ │   Template      │ │   Analytics     │ │
│ │ Subscriptions   │ │   System        │ │ & Tracking      │ │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                               │
┌─────────────────────────────────────────────────────────────┐
│                    Core Services                            │
│                                                             │
│ • NotificationsService        • CacheService               │
│ • BatchProcessingService      • TemplateEngine             │
│ • DeliveryChannels            • AnalyticsService           │
└─────────────────────────────────────────────────────────────┘
                               │
┌─────────────────────────────────────────────────────────────┐
│                    Database Layer                           │
│                                                             │
│ • notifications              • notification_preferences     │
│ • notification_templates     • delivery_attempts           │
│ • analytics_events           • scheduled_notifications     │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### 1. Initialize Notifications Service

```typescript
import { notificationsService } from './services/notifications.service';

// Initialize the service (usually done in app startup)
await notificationsService.initialize();
```

### 2. Add Notification Center to Layout

```typescript
import { NotificationCenter, ToastNotificationProvider } from './components/notifications';

function AppLayout({ children }) {
  return (
    <ToastNotificationProvider>
      <div className="app-layout">
        <header className="header">
          <NotificationCenter />
        </header>
        <main>{children}</main>
      </div>
    </ToastNotificationProvider>
  );
}
```

### 3. Send Notifications

```typescript
import { useNotificationSender } from './hooks/useNotifications';

function SessionBooking() {
  const { sendSessionReminder, sendPaymentConfirmation } = useNotificationSender();

  const handleSessionBooked = async (sessionData) => {
    // Send confirmation notification
    await sendPaymentConfirmation(userId, {
      amount: sessionData.price,
      session_id: sessionData.id
    });

    // Schedule reminder notification
    await sendSessionReminder(userId, {
      coach_name: sessionData.coach.name,
      session_time: sessionData.scheduled_time,
      session_id: sessionData.id
    });
  };

  return (
    <div>
      {/* Your booking UI */}
    </div>
  );
}
```

## 📱 Components

### Notification Center

Central hub for viewing and managing notifications with real-time updates.

**Features**:
- Real-time notification updates
- Filter by type (all, unread, specific categories)
- Mark as read/delete actions
- Quick settings access
- Load more pagination
- Responsive design

**Usage**:
```typescript
<NotificationCenter 
  className="ml-4"
/>
```

### Toast Notifications

Real-time toast notifications for immediate user feedback.

**Features**:
- Auto-hide with progress bar
- Multiple priority levels
- Custom actions
- Position configuration
- Queue management
- Hover to pause

**Usage**:
```typescript
import { useToastNotifications } from './components/notifications';

function MyComponent() {
  const { showSuccess, showError, showWarning } = useToastNotifications();

  const handleSuccess = () => {
    showSuccess(
      'Session Booked!', 
      'Your session with Sarah has been confirmed',
      [
        { label: 'View Details', action: () => navigate('/sessions/123') },
        { label: 'Add to Calendar', action: () => addToCalendar() }
      ]
    );
  };

  return (
    <button onClick={handleSuccess}>
      Book Session
    </button>
  );
}
```

### Notification Settings

Comprehensive preferences management interface.

**Features**:
- Channel preferences (Email, Push, SMS, In-App)
- Notification frequency control
- Quiet hours configuration
- Category-specific settings
- Real-time preview
- Bulk enable/disable

**Usage**:
```typescript
<NotificationSettings 
  showHeader={true}
  className="max-w-4xl mx-auto"
/>
```

## 🔧 Core Services

### NotificationsService

Main service for notification management and delivery.

**Key Methods**:
```typescript
// Send notification
const notification = await notificationsService.sendNotification({
  user_id: 'user-123',
  type: 'session_reminder',
  title: 'Session Starting Soon',
  message: 'Your session with John starts in 15 minutes',
  channels: ['email', 'push'],
  priority: 'high',
  data: { session_id: 'session-456' }
});

// Send bulk notifications
const notifications = await notificationsService.sendBulkNotifications([
  { user_id: 'user-1', type: 'welcome', title: 'Welcome!', message: 'Getting started...' },
  { user_id: 'user-2', type: 'welcome', title: 'Welcome!', message: 'Getting started...' }
]);

// Get user notifications
const { notifications, total } = await notificationsService.getUserNotifications(
  'user-123',
  { limit: 20, unread_only: true }
);

// Subscribe to real-time updates
const unsubscribe = notificationsService.subscribeToUserNotifications(
  'user-123',
  (notification) => {
    console.log('New notification:', notification);
  }
);
```

### Notification Hooks

React hooks for seamless notification integration.

**useNotifications**:
```typescript
const {
  notifications,
  unreadCount,
  loading,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  loadMore,
  refresh
} = useNotifications({
  filter: 'unread',
  limit: 20,
  realtime: true
});
```

**useNotificationPreferences**:
```typescript
const {
  preferences,
  loading,
  error,
  updatePreferences
} = useNotificationPreferences();

// Update preferences
await updatePreferences({
  email_enabled: false,
  categories: {
    ...preferences.categories,
    new_feature: true
  }
});
```

**useNotificationSender**:
```typescript
const {
  sendSessionReminder,
  sendPaymentConfirmation,
  sendWelcomeMessage,
  sendSecurityAlert,
  sendCustomNotification
} = useNotificationSender();
```

## 📊 Notification Types

### Session Management
- **session_reminder**: Pre-session reminders
- **session_confirmed**: Booking confirmations
- **session_cancelled**: Cancellation alerts
- **session_rescheduled**: Schedule change notifications

### Payment & Billing
- **payment_received**: Payment confirmations
- **payment_failed**: Payment failure alerts
- **subscription_expiring**: Subscription reminders

### Communication
- **coach_message**: Messages from coaches
- **welcome**: Onboarding messages
- **system_update**: Platform updates

### Security & Account
- **security_alert**: Security notifications
- **profile_incomplete**: Profile completion reminders

### Product & Features
- **new_feature**: Feature announcements
- **maintenance**: Maintenance notices

## 🎨 Customization

### Notification Templates

Create reusable templates with variable substitution:

```typescript
const template = await notificationsService.createTemplate({
  name: 'Session Reminder Template',
  type: 'session_reminder',
  subject_template: '{{coach_name}} session starts in {{time_until}}',
  body_template: 'Hi {{user_name}}, your session with {{coach_name}} starts in {{time_until}}. Join here: {{session_link}}',
  channels: ['email', 'push'],
  variables: ['coach_name', 'time_until', 'user_name', 'session_link']
});

// Use template
await notificationsService.sendNotification({
  user_id: 'user-123',
  type: 'session_reminder',
  template_id: template.id,
  template_variables: {
    coach_name: 'Sarah Johnson',
    time_until: '15 minutes',
    user_name: 'John',
    session_link: 'https://app.com/session/123'
  }
});
```

### Custom Toast Types

Extend toast notifications with custom styling:

```typescript
const { addToast } = useToastNotifications();

// Custom coaching milestone toast
addToast({
  user_id: userId,
  type: 'session_confirmed', // Use existing type for styling
  title: '🎉 Milestone Achieved!',
  message: 'You've completed 10 coaching sessions!',
  channel: ['in_app'],
  priority: 'medium',
  status: 'delivered',
  duration: 6000,
  actions: [
    { 
      label: 'View Progress', 
      action: () => navigate('/progress'),
      variant: 'primary'
    },
    { 
      label: 'Share Achievement', 
      action: () => openShareDialog(),
      variant: 'secondary'
    }
  ]
});
```

## 📈 Analytics & Monitoring

### Notification Statistics

Track delivery and engagement metrics:

```typescript
const stats = await notificationsService.getNotificationStats('user-123', {
  start: new Date('2024-01-01'),
  end: new Date('2024-01-31')
});

console.log('Delivery Rate:', stats.delivery_rate);
console.log('Open Rate:', stats.open_rate);
console.log('Click Rate:', stats.click_rate);
console.log('By Channel:', stats.by_channel);
console.log('By Type:', stats.by_type);
```

### Performance Monitoring

Monitor system performance and health:

```typescript
// Delivery queue size
const queueSize = notificationsService.getQueueSize();

// Failed deliveries
const failedDeliveries = await notificationsService.getFailedDeliveries({
  timeRange: '24h',
  limit: 100
});

// Channel health
const channelHealth = await notificationsService.getChannelHealth();
```

## 🔒 Security & Privacy

### Data Protection
- **User Consent**: Respect notification preferences and opt-outs
- **Data Encryption**: All notification data encrypted at rest and in transit
- **GDPR Compliance**: Support for data export and deletion
- **Rate Limiting**: Prevent notification spam and abuse

### Access Control
```sql
-- RLS policies ensure users only see their own notifications
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Service can create notifications" ON notifications
    FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'service_role');
```

## 🚦 Best Practices

### Notification Design
1. **Clear & Actionable**: Make notifications clear and include relevant actions
2. **Personalized**: Use user names and relevant context
3. **Timely**: Send notifications at appropriate times based on user timezone
4. **Respectful**: Honor quiet hours and frequency preferences

### Performance Optimization
1. **Batch Processing**: Use bulk operations for multiple notifications
2. **Caching**: Cache user preferences for faster delivery decisions
3. **Queue Management**: Process notifications asynchronously
4. **Fallback Strategies**: Graceful degradation when channels fail

### User Experience
1. **Progressive Enhancement**: Start with essential notifications, add more based on engagement
2. **Smart Defaults**: Enable important notifications by default
3. **Easy Management**: Provide clear, accessible preference controls
4. **Feedback Loops**: Allow users to provide feedback on notification relevance

## 🔧 Configuration

### Environment Variables
```env
# Notification service configuration
NOTIFICATION_BATCH_SIZE=100
NOTIFICATION_QUEUE_INTERVAL=5000
NOTIFICATION_MAX_RETRIES=3
NOTIFICATION_CACHE_TTL=300000

# Channel-specific settings
EMAIL_SERVICE_PROVIDER=sendgrid
PUSH_SERVICE_PROVIDER=firebase
SMS_SERVICE_PROVIDER=twilio

# Rate limiting
NOTIFICATION_RATE_LIMIT_PER_USER=100
NOTIFICATION_RATE_LIMIT_WINDOW=3600
```

### Service Configuration
```typescript
const notificationConfig = {
  batchSize: 100,
  queueInterval: 5000,
  maxRetries: 3,
  cacheTTL: 300000,
  channels: {
    email: { enabled: true, provider: 'sendgrid' },
    push: { enabled: true, provider: 'firebase' },
    sms: { enabled: true, provider: 'twilio' },
    in_app: { enabled: true }
  },
  rateLimit: {
    perUser: 100,
    window: 3600
  }
};
```

## 📚 API Reference

### Core Interfaces

```typescript
interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  channel: NotificationChannel[];
  priority: NotificationPriority;
  status: NotificationStatus;
  scheduled_for?: string;
  expires_at?: string;
  read_at?: string;
  clicked_at?: string;
  delivered_at?: string;
  created_at: string;
  updated_at: string;
}

interface SendNotificationOptions {
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  channels?: NotificationChannel[];
  priority?: NotificationPriority;
  scheduled_for?: Date;
  expires_at?: Date;
  template_id?: string;
  template_variables?: Record<string, any>;
}
```

### Service Methods

```typescript
class NotificationsService {
  // Core methods
  async initialize(): Promise<void>;
  async sendNotification(options: SendNotificationOptions): Promise<Notification>;
  async sendBulkNotifications(notifications: SendNotificationOptions[]): Promise<Notification[]>;
  
  // User management
  async getUserNotifications(userId: string, options?: GetNotificationsOptions): Promise<NotificationList>;
  async markAsRead(notificationId: string, userId: string): Promise<void>;
  async deleteNotification(notificationId: string, userId: string): Promise<void>;
  
  // Preferences
  async getUserPreferences(userId: string): Promise<NotificationPreferences>;
  async updateUserPreferences(userId: string, preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences>;
  
  // Real-time
  subscribeToUserNotifications(userId: string, callback: (notification: Notification) => void): () => void;
  
  // Analytics
  async getNotificationStats(userId?: string, dateRange?: DateRange): Promise<NotificationStats>;
  
  // Templates
  async createTemplate(template: NotificationTemplate): Promise<NotificationTemplate>;
  async getTemplates(type?: NotificationType): Promise<NotificationTemplate[]>;
}
```

---

Built with ❤️ for iPEC Coach Connect - Keeping users connected and informed in real-time.