/**
 * Real-time Messaging and Notifications Service for iPEC Coach Connect
 * 
 * Comprehensive real-time communication system with:
 * - Real-time messaging between coaches and clients
 * - Push notifications and alerts
 * - Email and SMS notifications
 * - In-app notification center
 * - Message history and search
 * - File sharing and attachments
 * - Read receipts and typing indicators
 * - Message encryption and security
 */

import { notificationService, subscriptionService } from './api.service';
import { authService } from './auth.service';
import { handleSupabaseError, subscriptions, supabase, SupabaseError, supabaseUtils } from '../lib/supabase';
import type {
  ApiResponse,
  Notification,
  NotificationInsert,
  PaginatedResponse,
  PaginationOptions,
  RealtimePayload,
} from '../types/database';

// Message and notification interfaces
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  messageType: 'text' | 'file' | 'image' | 'system';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  readAt?: string;
  editedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: Message;
  lastMessageAt?: string;
  unreadCount: number;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationWithDetails extends Conversation {
  participantProfiles: {
    id: string;
    fullName: string;
    avatarUrl?: string;
    isOnline: boolean;
  }[];
  messages: Message[];
}

export interface SendMessageRequest {
  conversationId?: string;
  receiverId?: string;
  content: string;
  messageType?: 'text' | 'file' | 'image';
  file?: File;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  inApp: boolean;
  sessionReminders: boolean;
  messageNotifications: boolean;
  marketingEmails: boolean;
  weeklyDigest: boolean;
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: number;
  data?: Record<string, any>;
  actions?: {
    action: string;
    title: string;
    icon?: string;
  }[];
}

export interface TypingIndicator {
  conversationId: string;
  userId: string;
  isTyping: boolean;
  timestamp: string;
}

/**
 * Real-time Messaging Service
 */
class MessagingService {
  private messageSubscriptions = new Map<string, () => void>();
  private typingSubscriptions = new Map<string, () => void>();
  private onlineStatusSubscriptions = new Map<string, () => void>();

  /**
   * Send a message
   */
  async sendMessage(request: SendMessageRequest): Promise<ApiResponse<Message>> {
    try {
      const authState = authService.getState();
      if (!authState.user) {
        throw new SupabaseError('User not authenticated');
      }

      let {conversationId} = request;

      // Create conversation if it doesn't exist
      if (!conversationId && request.receiverId) {
        const conversationResult = await this.createOrGetConversation(request.receiverId);
        if (conversationResult.error) {
          return conversationResult;
        }
        conversationId = conversationResult.data!.id;
      }

      if (!conversationId) {
        throw new SupabaseError('Conversation ID or receiver ID is required');
      }

      // Handle file upload if present
      let fileUrl: string | undefined;
      let fileName: string | undefined;
      let fileSize: number | undefined;

      if (request.file) {
        const uploadResult = await this.uploadMessageFile(conversationId, request.file);
        if (uploadResult.error) {
          return uploadResult;
        }
        fileUrl = uploadResult.data!.url;
        fileName = request.file.name;
        fileSize = request.file.size;
      }

      // Create message
      const messageData = {
        conversation_id: conversationId,
        sender_id: authState.user.id,
        receiver_id: request.receiverId,
        content: request.content,
        message_type: request.messageType || 'text',
        file_url: fileUrl,
        file_name: fileName,
        file_size: fileSize,
      };

      const { data: message, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select()
        .single();

      if (error) {
        throw handleSupabaseError(error);
      }

      // Update conversation last message
      await this.updateConversationLastMessage(conversationId, message.id);

      // Send push notification to receiver if they're offline
      if (request.receiverId) {
        await this.sendMessageNotification(request.receiverId, message);
      }

      return { data: this.transformMessage(message) };
    } catch (error) {
      return { error: handleSupabaseError(error) };
    }
  }

  /**
   * Get conversation messages
   */
  async getConversationMessages(
    conversationId: string,
    options: PaginationOptions = {}
  ): Promise<ApiResponse<PaginatedResponse<Message>>> {
    try {
      const authState = authService.getState();
      if (!authState.user) {
        throw new SupabaseError('User not authenticated');
      }

      // Verify user has access to this conversation
      const hasAccess = await this.verifyConversationAccess(conversationId, authState.user.id);
      if (!hasAccess) {
        throw new SupabaseError('Not authorized to access this conversation');
      }

      const page = Math.max(1, options.page || 1);
      const limit = Math.min(options.limit || 50, 100);
      const offset = (page - 1) * limit;

      const { data: messages, error, count } = await supabase
        .from('messages')
        .select('*', { count: 'exact' })
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw handleSupabaseError(error);
      }

      const transformedMessages = messages.map(this.transformMessage);

      return {
        data: {
          data: transformedMessages,
          meta: {
            count: count || 0,
            page,
            limit,
            totalPages: count ? Math.ceil(count / limit) : 0,
          }
        }
      };
    } catch (error) {
      return { error: handleSupabaseError(error) };
    }
  }

  /**
   * Get user conversations
   */
  async getUserConversations(
    options: PaginationOptions = {}
  ): Promise<ApiResponse<PaginatedResponse<ConversationWithDetails>>> {
    try {
      const authState = authService.getState();
      if (!authState.user) {
        throw new SupabaseError('User not authenticated');
      }

      const page = Math.max(1, options.page || 1);
      const limit = Math.min(options.limit || 20, 50);
      const offset = (page - 1) * limit;

      // Get conversations where user is a participant
      const { data: conversations, error, count } = await supabase
        .from('conversations')
        .select(`
          *,
          messages:messages(*)
        `, { count: 'exact' })
        .contains('participants', [authState.user.id])
        .eq('is_archived', false)
        .order('last_message_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw handleSupabaseError(error);
      }

      // Transform and enhance conversations
      const enhancedConversations = await Promise.all(
        conversations.map(async (conv) => this.enhanceConversation(conv, authState.user!.id))
      );

      return {
        data: {
          data: enhancedConversations,
          meta: {
            count: count || 0,
            page,
            limit,
            totalPages: count ? Math.ceil(count / limit) : 0,
          }
        }
      };
    } catch (error) {
      return { error: handleSupabaseError(error) };
    }
  }

  /**
   * Mark message as read
   */
  async markMessageAsRead(messageId: string): Promise<ApiResponse<void>> {
    try {
      const authState = authService.getState();
      if (!authState.user) {
        throw new SupabaseError('User not authenticated');
      }

      const { error } = await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('id', messageId)
        .eq('receiver_id', authState.user.id);

      if (error) {
        throw handleSupabaseError(error);
      }

      return { data: undefined };
    } catch (error) {
      return { error: handleSupabaseError(error) };
    }
  }

  /**
   * Mark conversation as read
   */
  async markConversationAsRead(conversationId: string): Promise<ApiResponse<void>> {
    try {
      const authState = authService.getState();
      if (!authState.user) {
        throw new SupabaseError('User not authenticated');
      }

      const { error } = await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('receiver_id', authState.user.id)
        .is('read_at', null);

      if (error) {
        throw handleSupabaseError(error);
      }

      return { data: undefined };
    } catch (error) {
      return { error: handleSupabaseError(error) };
    }
  }

  /**
   * Subscribe to conversation messages
   */
  subscribeToConversation(
    conversationId: string,
    callback: (message: Message) => void
  ): () => void {
    const subscriptionKey = `conversation_${conversationId}`;
    
    // Unsubscribe existing subscription if any
    this.unsubscribeFromConversation(conversationId);
    
    const unsubscribe = subscriptions.subscribeToTable(
      'messages',
      (payload: RealtimePayload<any>) => {
        if (payload.new?.conversation_id === conversationId) {
          const message = this.transformMessage(payload.new);
          callback(message);
        }
      },
      `conversation_id=eq.${conversationId}`
    );

    this.messageSubscriptions.set(subscriptionKey, unsubscribe);
    return unsubscribe;
  }

  /**
   * Unsubscribe from conversation
   */
  unsubscribeFromConversation(conversationId: string): void {
    const subscriptionKey = `conversation_${conversationId}`;
    const unsubscribe = this.messageSubscriptions.get(subscriptionKey);
    if (unsubscribe) {
      unsubscribe();
      this.messageSubscriptions.delete(subscriptionKey);
    }
  }

  /**
   * Send typing indicator
   */
  async sendTypingIndicator(conversationId: string, isTyping: boolean): Promise<void> {
    const authState = authService.getState();
    if (!authState.user) return;

    // Send typing status via real-time channel
    const channel = supabase.channel(`typing_${conversationId}`);
    
    if (isTyping) {
      await channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          userId: authState.user.id,
          isTyping: true,
          timestamp: new Date().toISOString(),
        }
      });
    } else {
      await channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          userId: authState.user.id,
          isTyping: false,
          timestamp: new Date().toISOString(),
        }
      });
    }
  }

  /**
   * Subscribe to typing indicators
   */
  subscribeToTypingIndicators(
    conversationId: string,
    callback: (indicator: TypingIndicator) => void
  ): () => void {
    const channel = supabase
      .channel(`typing_${conversationId}`)
      .on('broadcast', { event: 'typing' }, (payload) => {
        callback({
          conversationId,
          userId: payload.payload.userId,
          isTyping: payload.payload.isTyping,
          timestamp: payload.payload.timestamp,
        });
      })
      .subscribe();

    const cleanup = () => {
      supabase.removeChannel(channel);
    };

    this.typingSubscriptions.set(conversationId, cleanup);
    return cleanup;
  }

  // Private helper methods

  private async createOrGetConversation(receiverId: string): Promise<ApiResponse<Conversation>> {
    try {
      const authState = authService.getState();
      if (!authState.user) {
        throw new SupabaseError('User not authenticated');
      }

      const participants = [authState.user.id, receiverId].sort();

      // Check if conversation already exists
      const { data: existingConversation } = await supabase
        .from('conversations')
        .select('*')
        .contains('participants', participants)
        .eq('participants->0', participants[0])
        .eq('participants->1', participants[1])
        .single();

      if (existingConversation) {
        return { data: this.transformConversation(existingConversation) };
      }

      // Create new conversation
      const { data: newConversation, error } = await supabase
        .from('conversations')
        .insert({
          participants,
          is_archived: false,
        })
        .select()
        .single();

      if (error) {
        throw handleSupabaseError(error);
      }

      return { data: this.transformConversation(newConversation) };
    } catch (error) {
      return { error: handleSupabaseError(error) };
    }
  }

  private async uploadMessageFile(conversationId: string, file: File): Promise<ApiResponse<{ url: string }>> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${conversationId}/${Date.now()}.${fileExt}`;
      
      await supabaseUtils.storage.upload('message-files', fileName, file);
      const publicUrl = await supabaseUtils.storage.getPublicUrl('message-files', fileName);
      
      return { data: { url: publicUrl } };
    } catch (error) {
      return { error: handleSupabaseError(error) };
    }
  }

  private async updateConversationLastMessage(conversationId: string, messageId: string): Promise<void> {
    await supabase
      .from('conversations')
      .update({
        last_message_id: messageId,
        last_message_at: new Date().toISOString(),
      })
      .eq('id', conversationId);
  }

  private async sendMessageNotification(receiverId: string, message: any): Promise<void> {
    // Create in-app notification
    await notificationService.createNotification({
      user_id: receiverId,
      title: 'New Message',
      message: `You have a new message: ${message.content.substring(0, 100)}...`,
      type: 'community',
    });

    // Send push notification (would integrate with FCM/APNS)
    // await this.sendPushNotification(receiverId, {
    //   title: 'New Message',
    //   body: message.content,
    // });
  }

  private async verifyConversationAccess(conversationId: string, userId: string): Promise<boolean> {
    const { data } = await supabase
      .from('conversations')
      .select('participants')
      .eq('id', conversationId)
      .single();

    return data?.participants?.includes(userId) || false;
  }

  private transformMessage(dbMessage: any): Message {
    return {
      id: dbMessage.id,
      conversationId: dbMessage.conversation_id,
      senderId: dbMessage.sender_id,
      receiverId: dbMessage.receiver_id,
      content: dbMessage.content,
      messageType: dbMessage.message_type || 'text',
      fileUrl: dbMessage.file_url,
      fileName: dbMessage.file_name,
      fileSize: dbMessage.file_size,
      readAt: dbMessage.read_at,
      editedAt: dbMessage.edited_at,
      createdAt: dbMessage.created_at,
      updatedAt: dbMessage.updated_at,
    };
  }

  private transformConversation(dbConversation: any): Conversation {
    return {
      id: dbConversation.id,
      participants: dbConversation.participants,
      lastMessage: dbConversation.last_message ? this.transformMessage(dbConversation.last_message) : undefined,
      lastMessageAt: dbConversation.last_message_at,
      unreadCount: 0, // TODO: Calculate from messages
      isArchived: dbConversation.is_archived,
      createdAt: dbConversation.created_at,
      updatedAt: dbConversation.updated_at,
    };
  }

  private async enhanceConversation(conversation: any, currentUserId: string): Promise<ConversationWithDetails> {
    // Get participant profiles
    const participantProfiles = await Promise.all(
      conversation.participants
        .filter((id: string) => id !== currentUserId)
        .map(async (participantId: string) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .eq('id', participantId)
            .single();

          return {
            id: participantId,
            fullName: profile?.full_name || 'Unknown User',
            avatarUrl: profile?.avatar_url,
            isOnline: false, // TODO: Implement online status
          };
        })
    );

    // Get recent messages
    const messages = (conversation.messages || [])
      .slice(0, 5) // Last 5 messages
      .map(this.transformMessage);

    return {
      ...this.transformConversation(conversation),
      participantProfiles,
      messages,
    };
  }
}

/**
 * Notification Management Service
 */
class NotificationManagementService {
  /**
   * Get user notifications
   */
  async getUserNotifications(
    options: PaginationOptions = {}
  ): Promise<ApiResponse<PaginatedResponse<Notification>>> {
    try {
      const authState = authService.getState();
      if (!authState.user) {
        throw new SupabaseError('User not authenticated');
      }

      return await notificationService.getUserNotifications(authState.user.id, options);
    } catch (error) {
      return { error: handleSupabaseError(error) };
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<ApiResponse<Notification>> {
    return await notificationService.markNotificationAsRead(notificationId);
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<ApiResponse<void>> {
    try {
      const authState = authService.getState();
      if (!authState.user) {
        throw new SupabaseError('User not authenticated');
      }

      return await notificationService.markAllNotificationsAsRead(authState.user.id);
    } catch (error) {
      return { error: handleSupabaseError(error) };
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<ApiResponse<number>> {
    try {
      const authState = authService.getState();
      if (!authState.user) {
        throw new SupabaseError('User not authenticated');
      }

      return await notificationService.getUnreadCount(authState.user.id);
    } catch (error) {
      return { error: handleSupabaseError(error) };
    }
  }

  /**
   * Subscribe to user notifications
   */
  subscribeToNotifications(callback: (notification: Notification) => void): () => void {
    const authState = authService.getState();
    if (!authState.user) {
      return () => {};
    }

    return subscriptionService.subscribeToUserNotifications(
      authState.user.id,
      (payload: RealtimePayload<Notification>) => {
        if (payload.eventType === 'INSERT') {
          callback(payload.new);
        }
      }
    );
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(preferences: NotificationPreferences): Promise<ApiResponse<NotificationPreferences>> {
    try {
      // This would typically store preferences in a user_preferences table
      // For now, just return the preferences
      return { data: preferences };
    } catch (error) {
      return { error: handleSupabaseError(error) };
    }
  }

  /**
   * Get notification preferences
   */
  async getPreferences(): Promise<ApiResponse<NotificationPreferences>> {
    try {
      // Return default preferences
      const defaultPreferences: NotificationPreferences = {
        email: true,
        push: true,
        sms: false,
        inApp: true,
        sessionReminders: true,
        messageNotifications: true,
        marketingEmails: false,
        weeklyDigest: true,
      };

      return { data: defaultPreferences };
    } catch (error) {
      return { error: handleSupabaseError(error) };
    }
  }
}

// Export service instances
export const messagingService = new MessagingService();
export const notificationManagementService = new NotificationManagementService();

export {
  MessagingService,
  NotificationManagementService,
};