/**
 * Real-time Notifications Service
 * Comprehensive notification system with multiple delivery channels and real-time updates
 */

import { supabase } from '../lib/supabase';
import { cacheService } from '../lib/cache.service';

export interface Notification {
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
  metadata?: {
    source?: string;
    campaign_id?: string;
    template_id?: string;
    retry_count?: number;
    delivery_attempts?: DeliveryAttempt[];
  };
}

export interface DeliveryAttempt {
  channel: NotificationChannel;
  attempted_at: string;
  success: boolean;
  error?: string;
  response_data?: Record<string, any>;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: NotificationType;
  subject_template: string;
  body_template: string;
  channels: NotificationChannel[];
  variables: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferences {
  user_id: string;
  email_enabled: boolean;
  push_enabled: boolean;
  sms_enabled: boolean;
  in_app_enabled: boolean;
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
  quiet_hours: {
    enabled: boolean;
    start_time: string;
    end_time: string;
    timezone: string;
  };
  categories: Record<NotificationType, boolean>;
  created_at: string;
  updated_at: string;
}

export interface NotificationStats {
  total_sent: number;
  total_delivered: number;
  total_read: number;
  total_clicked: number;
  delivery_rate: number;
  open_rate: number;
  click_rate: number;
  by_channel: Record<NotificationChannel, {
    sent: number;
    delivered: number;
    failed: number;
  }>;
  by_type: Record<NotificationType, {
    sent: number;
    read: number;
    clicked: number;
  }>;
}

export type NotificationType = 
  | 'session_reminder'
  | 'session_confirmed'
  | 'session_cancelled'
  | 'session_rescheduled'
  | 'payment_received'
  | 'payment_failed'
  | 'coach_message'
  | 'system_update'
  | 'welcome'
  | 'profile_incomplete'
  | 'subscription_expiring'
  | 'new_feature'
  | 'maintenance'
  | 'security_alert';

export type NotificationChannel = 'email' | 'push' | 'sms' | 'in_app';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export type NotificationStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'expired';

export interface SendNotificationOptions {
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

class NotificationsService {
  private readonly CACHE_TTL = 300000; // 5 minutes
  private readonly MAX_RETRIES = 3;
  private subscribers: Map<string, Set<(notification: Notification) => void>> = new Map();
  private realtimeSubscription: any = null;
  private messageQueue: Notification[] = [];
  private isProcessingQueue = false;

  /**
   * Initialize the notifications service
   */
  async initialize(): Promise<void> {
    try {
      // Create database tables if they don't exist
      await this.createTables();
      
      // Set up real-time subscriptions
      await this.setupRealtimeSubscriptions();
      
      // Start background processing
      this.startBackgroundProcessing();
      
      // Load user preferences cache
      await this.preloadUserPreferences();

      console.log('Notifications Service initialized');
    } catch (error) {
      console.error('Failed to initialize Notifications Service:', error);
      throw error;
    }
  }

  /**
   * Send a notification to a user
   */
  async sendNotification(options: SendNotificationOptions): Promise<Notification> {
    try {
      // Get user preferences
      const preferences = await this.getUserPreferences(options.user_id);
      
      // Check if user has notifications enabled for this type
      if (!preferences.categories[options.type]) {
        throw new Error(`User has disabled notifications for type: ${options.type}`);
      }

      // Determine channels based on preferences and options
      const channels = this.determineChannels(options.channels, preferences);
      
      if (channels.length === 0) {
        throw new Error('No available channels for notification delivery');
      }

      // Process template if provided
      let { title, message } = options;
      if (options.template_id && options.template_variables) {
        const processed = await this.processTemplate(
          options.template_id, 
          options.template_variables
        );
        title = processed.subject;
        message = processed.body;
      }

      // Create notification record
      const notification: Omit<Notification, 'id' | 'created_at' | 'updated_at'> = {
        user_id: options.user_id,
        type: options.type,
        title,
        message,
        data: options.data || {},
        channel: channels,
        priority: options.priority || 'medium',
        status: options.scheduled_for ? 'pending' : 'sent',
        scheduled_for: options.scheduled_for?.toISOString(),
        expires_at: options.expires_at?.toISOString(),
        metadata: {
          template_id: options.template_id,
          retry_count: 0,
          delivery_attempts: []
        }
      };

      const { data: createdNotification, error } = await supabase
        .from('notifications')
        .insert([notification])
        .select()
        .single();

      if (error) throw error;

      // Add to processing queue
      if (!options.scheduled_for || options.scheduled_for <= new Date()) {
        this.addToQueue(createdNotification);
      }

      return createdNotification;
    } catch (error) {
      console.error('Failed to send notification:', error);
      throw error;
    }
  }

  /**
   * Send bulk notifications
   */
  async sendBulkNotifications(
    notifications: SendNotificationOptions[]
  ): Promise<Notification[]> {
    const results: Notification[] = [];
    const batchSize = 100;

    for (let i = 0; i < notifications.length; i += batchSize) {
      const batch = notifications.slice(i, i + batchSize);
      const batchPromises = batch.map(notification => 
        this.sendNotification(notification).catch(error => {
          console.error('Bulk notification failed:', error);
          return null;
        })
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults.filter(Boolean) as Notification[]);
    }

    return results;
  }

  /**
   * Get notifications for a user
   */
  async getUserNotifications(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      unread_only?: boolean;
      type?: NotificationType;
    } = {}
  ): Promise<{ notifications: Notification[]; total: number }> {
    try {
      let query = supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (options.unread_only) {
        query = query.is('read_at', null);
      }

      if (options.type) {
        query = query.eq('type', options.type);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        notifications: data || [],
        total: count || 0
      };
    } catch (error) {
      console.error('Failed to get user notifications:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          read_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) throw error;

      // Clear relevant cache
      this.clearUserNotificationsCache(userId);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark notification as clicked
   */
  async markAsClicked(notificationId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          clicked_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) throw error;

      // Clear relevant cache
      this.clearUserNotificationsCache(userId);
    } catch (error) {
      console.error('Failed to mark notification as clicked:', error);
      throw error;
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) throw error;

      // Clear relevant cache
      this.clearUserNotificationsCache(userId);
    } catch (error) {
      console.error('Failed to delete notification:', error);
      throw error;
    }
  }

  /**
   * Get user notification preferences
   */
  async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    const cacheKey = `notification_preferences_${userId}`;
    
    // Try cache first
    const cached = cacheService.get(cacheKey);
    if (cached) {
      return cached as NotificationPreferences;
    }

    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      // Create default preferences if none exist
      if (!data) {
        return await this.createDefaultPreferences(userId);
      }

      // Cache the preferences
      cacheService.set(cacheKey, data, this.CACHE_TTL);

      return data;
    } catch (error) {
      console.error('Failed to get user preferences:', error);
      throw error;
    }
  }

  /**
   * Update user notification preferences
   */
  async updateUserPreferences(
    userId: string, 
    preferences: Partial<Omit<NotificationPreferences, 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<NotificationPreferences> {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .update({
          ...preferences,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      // Clear cache
      const cacheKey = `notification_preferences_${userId}`;
      cacheService.delete(cacheKey);

      return data;
    } catch (error) {
      console.error('Failed to update user preferences:', error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time notifications for a user
   */
  subscribeToUserNotifications(
    userId: string, 
    callback: (notification: Notification) => void
  ): () => void {
    if (!this.subscribers.has(userId)) {
      this.subscribers.set(userId, new Set());
    }
    
    this.subscribers.get(userId)!.add(callback);

    // Return unsubscribe function
    return () => {
      const userSubscribers = this.subscribers.get(userId);
      if (userSubscribers) {
        userSubscribers.delete(callback);
        if (userSubscribers.size === 0) {
          this.subscribers.delete(userId);
        }
      }
    };
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats(
    userId?: string,
    dateRange: { start: Date; end: Date } = {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: new Date()
    }
  ): Promise<NotificationStats> {
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString());

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const notifications = data || [];

      // Calculate statistics
      const stats: NotificationStats = {
        total_sent: notifications.length,
        total_delivered: notifications.filter(n => n.delivered_at).length,
        total_read: notifications.filter(n => n.read_at).length,
        total_clicked: notifications.filter(n => n.clicked_at).length,
        delivery_rate: 0,
        open_rate: 0,
        click_rate: 0,
        by_channel: {
          email: { sent: 0, delivered: 0, failed: 0 },
          push: { sent: 0, delivered: 0, failed: 0 },
          sms: { sent: 0, delivered: 0, failed: 0 },
          in_app: { sent: 0, delivered: 0, failed: 0 }
        },
        by_type: {} as Record<NotificationType, { sent: number; read: number; clicked: number }>
      };

      // Calculate rates
      if (stats.total_sent > 0) {
        stats.delivery_rate = (stats.total_delivered / stats.total_sent) * 100;
        stats.open_rate = (stats.total_read / stats.total_sent) * 100;
        stats.click_rate = (stats.total_clicked / stats.total_sent) * 100;
      }

      // Calculate by channel and type
      notifications.forEach(notification => {
        // By type
        if (!stats.by_type[notification.type]) {
          stats.by_type[notification.type] = { sent: 0, read: 0, clicked: 0 };
        }
        stats.by_type[notification.type].sent++;
        if (notification.read_at) stats.by_type[notification.type].read++;
        if (notification.clicked_at) stats.by_type[notification.type].clicked++;

        // By channel (simplified - would need delivery attempt data for accurate stats)
        notification.channel.forEach(channel => {
          stats.by_channel[channel].sent++;
          if (notification.delivered_at) stats.by_channel[channel].delivered++;
          if (notification.status === 'failed') stats.by_channel[channel].failed++;
        });
      });

      return stats;
    } catch (error) {
      console.error('Failed to get notification stats:', error);
      throw error;
    }
  }

  /**
   * Create notification template
   */
  async createTemplate(template: Omit<NotificationTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<NotificationTemplate> {
    try {
      const { data, error } = await supabase
        .from('notification_templates')
        .insert([template])
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Failed to create notification template:', error);
      throw error;
    }
  }

  /**
   * Get notification templates
   */
  async getTemplates(type?: NotificationType): Promise<NotificationTemplate[]> {
    try {
      let query = supabase
        .from('notification_templates')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (type) {
        query = query.eq('type', type);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Failed to get notification templates:', error);
      throw error;
    }
  }

  // Private methods

  private async createTables(): Promise<void> {
    const tables = [
      // Notifications table
      `
        CREATE TABLE IF NOT EXISTS notifications (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          type TEXT NOT NULL,
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          data JSONB DEFAULT '{}',
          channel TEXT[] NOT NULL,
          priority TEXT NOT NULL DEFAULT 'medium',
          status TEXT NOT NULL DEFAULT 'pending',
          scheduled_for TIMESTAMP WITH TIME ZONE,
          expires_at TIMESTAMP WITH TIME ZONE,
          read_at TIMESTAMP WITH TIME ZONE,
          clicked_at TIMESTAMP WITH TIME ZONE,
          delivered_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          metadata JSONB DEFAULT '{}'
        );
        CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
        CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
        CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
        CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
        CREATE INDEX IF NOT EXISTS idx_notifications_scheduled_for ON notifications(scheduled_for);
      `,
      // Notification preferences table
      `
        CREATE TABLE IF NOT EXISTS notification_preferences (
          user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
          email_enabled BOOLEAN DEFAULT true,
          push_enabled BOOLEAN DEFAULT true,
          sms_enabled BOOLEAN DEFAULT false,
          in_app_enabled BOOLEAN DEFAULT true,
          frequency TEXT DEFAULT 'immediate',
          quiet_hours JSONB DEFAULT '{"enabled": false, "start_time": "22:00", "end_time": "08:00", "timezone": "UTC"}',
          categories JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `,
      // Notification templates table
      `
        CREATE TABLE IF NOT EXISTS notification_templates (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          subject_template TEXT NOT NULL,
          body_template TEXT NOT NULL,
          channels TEXT[] NOT NULL,
          variables TEXT[] DEFAULT '{}',
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_notification_templates_type ON notification_templates(type);
        CREATE INDEX IF NOT EXISTS idx_notification_templates_active ON notification_templates(is_active);
      `
    ];

    for (const sql of tables) {
      await supabase.rpc('exec_sql', { sql });
    }
  }

  private async setupRealtimeSubscriptions(): Promise<void> {
    // Subscribe to notification changes for real-time updates
    this.realtimeSubscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          const notification = payload.new as Notification;
          this.notifySubscribers(notification);
        }
      )
      .subscribe();
  }

  private async createDefaultPreferences(userId: string): Promise<NotificationPreferences> {
    const defaultPreferences: Omit<NotificationPreferences, 'user_id' | 'created_at' | 'updated_at'> = {
      email_enabled: true,
      push_enabled: true,
      sms_enabled: false,
      in_app_enabled: true,
      frequency: 'immediate',
      quiet_hours: {
        enabled: false,
        start_time: '22:00',
        end_time: '08:00',
        timezone: 'UTC'
      },
      categories: {
        session_reminder: true,
        session_confirmed: true,
        session_cancelled: true,
        session_rescheduled: true,
        payment_received: true,
        payment_failed: true,
        coach_message: true,
        system_update: true,
        welcome: true,
        profile_incomplete: true,
        subscription_expiring: true,
        new_feature: false,
        maintenance: true,
        security_alert: true
      }
    };

    const { data, error } = await supabase
      .from('notification_preferences')
      .insert([{ user_id: userId, ...defaultPreferences }])
      .select()
      .single();

    if (error) throw error;

    return data;
  }

  private determineChannels(
    requestedChannels: NotificationChannel[] | undefined,
    preferences: NotificationPreferences
  ): NotificationChannel[] {
    const availableChannels: NotificationChannel[] = [];

    if (preferences.email_enabled) availableChannels.push('email');
    if (preferences.push_enabled) availableChannels.push('push');
    if (preferences.sms_enabled) availableChannels.push('sms');
    if (preferences.in_app_enabled) availableChannels.push('in_app');

    if (requestedChannels) {
      return requestedChannels.filter(channel => availableChannels.includes(channel));
    }

    return availableChannels;
  }

  private async processTemplate(
    templateId: string,
    variables: Record<string, any>
  ): Promise<{ subject: string; body: string }> {
    const { data: template, error } = await supabase
      .from('notification_templates')
      .select('*')
      .eq('id', templateId)
      .eq('is_active', true)
      .single();

    if (error) throw error;

    let subject = template.subject_template;
    let body = template.body_template;

    // Simple template variable replacement
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      subject = subject.replace(regex, String(value));
      body = body.replace(regex, String(value));
    });

    return { subject, body };
  }

  private addToQueue(notification: Notification): void {
    this.messageQueue.push(notification);
    if (!this.isProcessingQueue) {
      this.processQueue();
    }
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.messageQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.messageQueue.length > 0) {
      const notification = this.messageQueue.shift()!;
      
      try {
        await this.deliverNotification(notification);
      } catch (error) {
        console.error('Failed to deliver notification:', error);
        
        // Retry logic
        const retryCount = notification.metadata?.retry_count || 0;
        if (retryCount < this.MAX_RETRIES) {
          notification.metadata = {
            ...notification.metadata,
            retry_count: retryCount + 1
          };
          this.messageQueue.push(notification);
        } else {
          // Mark as failed
          await this.markNotificationFailed(notification.id);
        }
      }
    }

    this.isProcessingQueue = false;
  }

  private async deliverNotification(notification: Notification): Promise<void> {
    const deliveryAttempts: DeliveryAttempt[] = [];

    for (const channel of notification.channel) {
      try {
        await this.deliverToChannel(notification, channel);
        deliveryAttempts.push({
          channel,
          attempted_at: new Date().toISOString(),
          success: true
        });
      } catch (error) {
        deliveryAttempts.push({
          channel,
          attempted_at: new Date().toISOString(),
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    // Update notification with delivery attempts
    await supabase
      .from('notifications')
      .update({
        status: deliveryAttempts.some(a => a.success) ? 'delivered' : 'failed',
        delivered_at: deliveryAttempts.some(a => a.success) ? new Date().toISOString() : null,
        metadata: {
          ...notification.metadata,
          delivery_attempts: deliveryAttempts
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', notification.id);
  }

  private async deliverToChannel(
    notification: Notification, 
    channel: NotificationChannel
  ): Promise<void> {
    switch (channel) {
      case 'email':
        await this.sendEmail(notification);
        break;
      case 'push':
        await this.sendPushNotification(notification);
        break;
      case 'sms':
        await this.sendSMS(notification);
        break;
      case 'in_app':
        // In-app notifications are already stored in database
        // Real-time delivery handled by subscription
        break;
      default:
        throw new Error(`Unknown notification channel: ${channel}`);
    }
  }

  private async sendEmail(notification: Notification): Promise<void> {
    // Email delivery implementation would go here
    // For now, we'll simulate success
    console.log(`Sending email notification: ${notification.title}`);
  }

  private async sendPushNotification(notification: Notification): Promise<void> {
    // Push notification delivery implementation would go here
    // For now, we'll simulate success
    console.log(`Sending push notification: ${notification.title}`);
  }

  private async sendSMS(notification: Notification): Promise<void> {
    // SMS delivery implementation would go here
    // For now, we'll simulate success
    console.log(`Sending SMS notification: ${notification.title}`);
  }

  private async markNotificationFailed(notificationId: string): Promise<void> {
    await supabase
      .from('notifications')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString()
      })
      .eq('id', notificationId);
  }

  private notifySubscribers(notification: Notification): void {
    const userSubscribers = this.subscribers.get(notification.user_id);
    if (userSubscribers) {
      userSubscribers.forEach(callback => {
        try {
          callback(notification);
        } catch (error) {
          console.error('Error in notification subscriber callback:', error);
        }
      });
    }
  }

  private startBackgroundProcessing(): void {
    // Process scheduled notifications every minute
    setInterval(async () => {
      try {
        const { data: scheduledNotifications } = await supabase
          .from('notifications')
          .select('*')
          .eq('status', 'pending')
          .lte('scheduled_for', new Date().toISOString())
          .limit(100);

        if (scheduledNotifications) {
          scheduledNotifications.forEach(notification => {
            this.addToQueue(notification);
          });
        }
      } catch (error) {
        console.error('Error processing scheduled notifications:', error);
      }
    }, 60000); // 1 minute
  }

  private async preloadUserPreferences(): Promise<void> {
    try {
      const { data: preferences } = await supabase
        .from('notification_preferences')
        .select('*')
        .limit(1000);

      if (preferences) {
        preferences.forEach(pref => {
          const cacheKey = `notification_preferences_${pref.user_id}`;
          cacheService.set(cacheKey, pref, this.CACHE_TTL);
        });
      }
    } catch (error) {
      console.error('Failed to preload user preferences:', error);
    }
  }

  private clearUserNotificationsCache(userId: string): void {
    const cacheKey = `notification_preferences_${userId}`;
    cacheService.delete(cacheKey);
  }

  /**
   * Cleanup method for graceful shutdown
   */
  async cleanup(): Promise<void> {
    if (this.realtimeSubscription) {
      await this.realtimeSubscription.unsubscribe();
    }
    this.subscribers.clear();
  }
}

export const notificationsService = new NotificationsService();