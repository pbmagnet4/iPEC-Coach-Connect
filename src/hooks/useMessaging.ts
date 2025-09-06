import { useCallback, useEffect, useRef, useState } from 'react';
import { messagingService } from '../services/messaging.service';
import { authService } from '../services/auth.service';
import type {
  ConversationFilters,
  ConversationWithDetails,
  MessageFormData,
  MessageWithDetails,
  RealtimeMessagePayload,
  RealtimeTypingPayload,
  SendMessageRequest,
  TypingIndicatorWithUser,
} from '../types/database';

interface UseMessagingOptions {
  autoLoadConversations?: boolean;
  enableRealtime?: boolean;
  enablePresence?: boolean;
}

export function useMessaging(options: UseMessagingOptions = {}) {
  const {
    autoLoadConversations = true,
    enableRealtime = true,
    enablePresence = true,
  } = options;

  // State
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [conversationMessages, setConversationMessages] = useState<Record<string, MessageWithDetails[]>>({});
  const [typingIndicators, setTypingIndicators] = useState<Record<string, TypingIndicatorWithUser[]>>({});
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState<Record<string, boolean>>({});
  const [hasMoreMessages, setHasMoreMessages] = useState<Record<string, boolean>>({});
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  // Refs for cleanup
  const subscriptionsRef = useRef<Record<string, () => void>>({});
  const typingTimeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});

  // Get current user
  const currentUser = authService.getState().user;

  // Load conversations
  const loadConversations = useCallback(async (filters: ConversationFilters = {}) => {
    if (!currentUser) return;

    setIsLoadingConversations(true);
    try {
      const result = await messagingService.getUserConversations();
      if (result.data) {
        setConversations(result.data.data);
        
        // Update unread counts
        const unreadCountsMap: Record<string, number> = {};
        result.data.data.forEach(conv => {
          unreadCountsMap[conv.id] = conv.unread_count;
        });
        setUnreadCounts(unreadCountsMap);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setIsLoadingConversations(false);
    }
  }, [currentUser]);

  // Load messages for a conversation
  const loadMessages = useCallback(async (
    conversationId: string, 
    page = 1,
    append = false
  ) => {
    if (!currentUser) return;

    setIsLoadingMessages(prev => ({ ...prev, [conversationId]: true }));
    
    try {
      const result = await messagingService.getConversationMessages(conversationId, {
        page,
        limit: 50,
      });

      if (result.data) {
        const newMessages = result.data.data.reverse(); // Reverse to show oldest first
        
        setConversationMessages(prev => {
          const existingMessages = prev[conversationId] || [];
          return {
            ...prev,
            [conversationId]: append 
              ? [...newMessages, ...existingMessages]
              : newMessages
          };
        });

        setHasMoreMessages(prev => ({
          ...prev,
          [conversationId]: result.data!.meta.page < result.data!.meta.totalPages
        }));
      }
    } catch (error) {
      console.error(`Failed to load messages for conversation ${conversationId}:`, error);
    } finally {
      setIsLoadingMessages(prev => ({ ...prev, [conversationId]: false }));
    }
  }, [currentUser]);

  // Send message
  const sendMessage = useCallback(async (
    conversationId: string,
    data: MessageFormData
  ): Promise<void> => {
    if (!currentUser || !data.content.trim() && data.files.length === 0) return;

    try {
      // Handle file uploads if present
      const filePromises: Promise<void>[] = [];
      
      for (const file of data.files) {
        const sendFileMessage = async () => {
          const result = await messagingService.sendMessage({
            conversationId,
            content: data.content || `Shared ${file.name}`,
            messageType: file.type.startsWith('image/') ? 'image' : 'file',
            file,
          });

          if (result.data) {
            // Add message to local state
            setConversationMessages(prev => ({
              ...prev,
              [conversationId]: [...(prev[conversationId] || []), result.data!]
            }));
          }
        };
        
        filePromises.push(sendFileMessage());
      }

      // Send text message if content exists
      if (data.content.trim()) {
        const result = await messagingService.sendMessage({
          conversationId,
          content: data.content,
          messageType: 'text',
        });

        if (result.data) {
          // Add message to local state
          setConversationMessages(prev => ({
            ...prev,
            [conversationId]: [...(prev[conversationId] || []), result.data!]
          }));
        }
      }

      // Wait for all file uploads to complete
      await Promise.all(filePromises);

    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }, [currentUser]);

  // Start conversation
  const startConversation = useCallback(async (receiverId: string, initialMessage?: string) => {
    if (!currentUser) return null;

    try {
      const result = await messagingService.sendMessage({
        receiverId,
        content: initialMessage || 'Hello!',
        messageType: 'text',
      });

      if (result.data) {
        // Reload conversations to include the new one
        await loadConversations();
        return result.data.conversationId;
      }
    } catch (error) {
      console.error('Failed to start conversation:', error);
      throw error;
    }

    return null;
  }, [currentUser, loadConversations]);

  // Typing indicators
  const startTyping = useCallback(async (conversationId: string) => {
    if (!currentUser) return;

    try {
      await messagingService.sendTypingIndicator(conversationId, true);
    } catch (error) {
      console.error('Failed to send typing indicator:', error);
    }
  }, [currentUser]);

  const stopTyping = useCallback(async (conversationId: string) => {
    if (!currentUser) return;

    try {
      await messagingService.sendTypingIndicator(conversationId, false);
    } catch (error) {
      console.error('Failed to stop typing indicator:', error);
    }
  }, [currentUser]);

  // Mark messages as read
  const markConversationAsRead = useCallback(async (conversationId: string) => {
    if (!currentUser) return;

    try {
      await messagingService.markConversationAsRead(conversationId);
      
      // Update local unread count
      setUnreadCounts(prev => ({
        ...prev,
        [conversationId]: 0
      }));

      // Update conversation in list
      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId
            ? { ...conv, unread_count: 0 }
            : conv
        )
      );
    } catch (error) {
      console.error('Failed to mark conversation as read:', error);
    }
  }, [currentUser]);

  // Real-time subscriptions
  useEffect(() => {
    if (!enableRealtime || !currentUser) return;

    // Subscribe to all conversation updates
    conversations.forEach(conversation => {
      const conversationId = conversation.id;
      
      // Skip if already subscribed
      if (subscriptionsRef.current[conversationId]) return;

      // Subscribe to messages
      const messageUnsubscribe = messagingService.subscribeToConversation(
        conversationId,
        (message: MessageWithDetails) => {
          setConversationMessages(prev => ({
            ...prev,
            [conversationId]: [...(prev[conversationId] || []), message]
          }));

          // Update conversation last message if not from current user
          if (message.sender_id !== currentUser.id) {
            setConversations(prevConvs =>
              prevConvs.map(conv =>
                conv.id === conversationId
                  ? {
                      ...conv,
                      last_message: message,
                      last_message_at: message.created_at,
                      unread_count: conv.unread_count + 1
                    }
                  : conv
              )
            );

            // Update unread count
            setUnreadCounts(prev => ({
              ...prev,
              [conversationId]: (prev[conversationId] || 0) + 1
            }));
          }
        }
      );

      // Subscribe to typing indicators
      const typingUnsubscribe = messagingService.subscribeToTypingIndicators(
        conversationId,
        (indicator) => {
          if (indicator.userId === currentUser.id) return; // Ignore own typing

          setTypingIndicators(prev => {
            const conversationTyping = prev[conversationId] || [];
            
            if (indicator.isTyping) {
              // Add or update typing indicator
              const existingIndex = conversationTyping.findIndex(t => t.user_id === indicator.userId);
              let newTyping: TypingIndicatorWithUser[];
              
              if (existingIndex >= 0) {
                newTyping = [...conversationTyping];
                newTyping[existingIndex] = {
                  ...newTyping[existingIndex],
                  is_typing: true,
                  updated_at: indicator.timestamp,
                };
              } else {
                // Need to get user profile - for now just create placeholder
                newTyping = [...conversationTyping, {
                  id: `${conversationId}-${indicator.userId}`,
                  conversation_id: conversationId,
                  user_id: indicator.userId,
                  is_typing: true,
                  updated_at: indicator.timestamp,
                  user: {
                    id: indicator.userId,
                    full_name: 'User', // TODO: Get real profile
                    avatar_url: null,
                    // ... other profile fields
                  } as any
                }];
              }

              // Set timeout to remove typing indicator
              const timeoutKey = `${conversationId}-${indicator.userId}`;
              if (typingTimeoutsRef.current[timeoutKey]) {
                clearTimeout(typingTimeoutsRef.current[timeoutKey]);
              }

              typingTimeoutsRef.current[timeoutKey] = setTimeout(() => {
                setTypingIndicators(prevTyping => ({
                  ...prevTyping,
                  [conversationId]: (prevTyping[conversationId] || []).filter(
                    t => t.user_id !== indicator.userId
                  )
                }));
                delete typingTimeoutsRef.current[timeoutKey];
              }, 3000);

              return {
                ...prev,
                [conversationId]: newTyping
              };
            } else {
              // Remove typing indicator
              return {
                ...prev,
                [conversationId]: conversationTyping.filter(t => t.user_id !== indicator.userId)
              };
            }
          });
        }
      );

      // Store cleanup functions
      subscriptionsRef.current[conversationId] = () => {
        messageUnsubscribe();
        typingUnsubscribe();
      };
    });

    // Cleanup function
    return () => {
      Object.values(subscriptionsRef.current).forEach(unsubscribe => unsubscribe());
      subscriptionsRef.current = {};
      
      Object.values(typingTimeoutsRef.current).forEach(timeout => clearTimeout(timeout));
      typingTimeoutsRef.current = {};
    };
  }, [conversations, currentUser, enableRealtime]);

  // Auto-load conversations on mount
  useEffect(() => {
    if (autoLoadConversations && currentUser) {
      loadConversations();
    }
  }, [autoLoadConversations, currentUser, loadConversations]);

  // Select conversation
  const selectConversation = useCallback(async (conversationId: string) => {
    setSelectedConversationId(conversationId);
    
    // Load messages if not already loaded
    if (!conversationMessages[conversationId]) {
      await loadMessages(conversationId);
    }
    
    // Mark as read
    await markConversationAsRead(conversationId);
  }, [conversationMessages, loadMessages, markConversationAsRead]);

  // Load more messages
  const loadMoreMessages = useCallback(async (conversationId: string) => {
    if (!conversationMessages[conversationId] || isLoadingMessages[conversationId]) return;
    
    const currentMessages = conversationMessages[conversationId];
    const currentPage = Math.ceil(currentMessages.length / 50);
    await loadMessages(conversationId, currentPage + 1, true);
  }, [conversationMessages, isLoadingMessages, loadMessages]);

  return {
    // State
    conversations,
    selectedConversationId,
    currentConversation: selectedConversationId 
      ? conversations.find(c => c.id === selectedConversationId) || null
      : null,
    messages: selectedConversationId ? conversationMessages[selectedConversationId] || [] : [],
    typingIndicators: selectedConversationId ? typingIndicators[selectedConversationId] || [] : [],
    isLoadingConversations,
    isLoadingMessages: selectedConversationId ? isLoadingMessages[selectedConversationId] || false : false,
    hasMoreMessages: selectedConversationId ? hasMoreMessages[selectedConversationId] || false : false,
    unreadCounts,
    
    // Actions
    loadConversations,
    selectConversation,
    loadMoreMessages,
    sendMessage,
    startConversation,
    startTyping,
    stopTyping,
    markConversationAsRead,
    
    // Utils
    currentUserId: currentUser?.id || '',
  };
}

export default useMessaging;