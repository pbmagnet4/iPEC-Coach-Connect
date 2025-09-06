import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Phone, Video, MoreVertical, ArrowDown, Search } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { PresenceStatus } from './PresenceStatus';
import { MessageComposer } from './MessageComposer';
import type { 
  ConversationWithDetails, 
  MessageWithDetails, 
  TypingIndicatorWithUser,
  MessageFormData,
  EmojiReaction
} from '../../types/database';

interface MessageThreadProps {
  conversation: ConversationWithDetails;
  messages: MessageWithDetails[];
  currentUserId: string;
  typingIndicators: TypingIndicatorWithUser[];
  isLoadingMessages?: boolean;
  hasMoreMessages?: boolean;
  onSendMessage: (data: MessageFormData) => Promise<void>;
  onLoadMoreMessages?: () => Promise<void>;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
  onMessageReact?: (messageId: string, emoji: string) => void;
  onMessageEdit?: (messageId: string, content: string) => void;
  onMessageDelete?: (messageId: string) => void;
  onMessageRetry?: (messageId: string) => void;
  onCall?: () => void;
  onVideoCall?: () => void;
  onConversationInfo?: () => void;
  className?: string;
}

const MESSAGE_GROUP_THRESHOLD = 5 * 60 * 1000; // 5 minutes

export function MessageThread({
  conversation,
  messages,
  currentUserId,
  typingIndicators,
  isLoadingMessages = false,
  hasMoreMessages = false,
  onSendMessage,
  onLoadMoreMessages,
  onTypingStart,
  onTypingStop,
  onMessageReact,
  onMessageEdit,
  onMessageDelete,
  onMessageRetry,
  onCall,
  onVideoCall,
  onConversationInfo,
  className = '',
}: MessageThreadProps) {
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [lastReadMessageId, setLastReadMessageId] = useState<string | null>(null);
  
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);

  // Get the other participant for display purposes
  const otherParticipant = useMemo(() => {
    return conversation.participant_profiles.find(p => p.id !== currentUserId);
  }, [conversation.participant_profiles, currentUserId]);

  // Group messages for better UX
  const groupedMessages = useMemo(() => {
    const groups: Array<{
      id: string;
      messages: MessageWithDetails[];
      senderId: string;
      timestamp: string;
    }> = [];

    messages.forEach((message) => {
      const lastGroup = groups[groups.length - 1];
      const messageTime = new Date(message.created_at).getTime();
      
      if (
        lastGroup &&
        lastGroup.senderId === message.sender_id &&
        messageTime - new Date(lastGroup.timestamp).getTime() < MESSAGE_GROUP_THRESHOLD
      ) {
        lastGroup.messages.push(message);
      } else {
        groups.push({
          id: message.id,
          messages: [message],
          senderId: message.sender_id,
          timestamp: message.created_at,
        });
      }
    });

    return groups;
  }, [messages]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (isNearBottom && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isNearBottom]);

  // Handle scroll events
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      const isNearBottomNew = scrollHeight - scrollTop - clientHeight < 200;
      
      setIsNearBottom(isNearBottomNew);
      setShowScrollToBottom(!isAtBottom && messages.length > 0);

      // Load more messages when near top
      if (scrollTop < 100 && hasMoreMessages && onLoadMoreMessages && !isLoadingMessages) {
        onLoadMoreMessages();
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [hasMoreMessages, onLoadMoreMessages, isLoadingMessages, messages.length]);

  // Auto-scroll to bottom on initial load
  useEffect(() => {
    if (messagesEndRef.current && messages.length > 0) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
    }
  }, [conversation.id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) return 'Today';
    
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();
    
    if (isYesterday) return 'Yesterday';
    
    return date.toLocaleDateString([], { 
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  // Group messages by date
  const messagesByDate = useMemo(() => {
    const dateGroups: Record<string, typeof groupedMessages> = {};
    
    groupedMessages.forEach((group) => {
      const dateKey = new Date(group.timestamp).toDateString();
      if (!dateGroups[dateKey]) {
        dateGroups[dateKey] = [];
      }
      dateGroups[dateKey].push(group);
    });

    return Object.entries(dateGroups).sort(([a], [b]) => 
      new Date(a).getTime() - new Date(b).getTime()
    );
  }, [groupedMessages]);

  if (!otherParticipant) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Invalid conversation</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full bg-white ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Avatar
            src={otherParticipant.avatar_url || undefined}
            alt={otherParticipant.full_name || 'User'}
            size="md"
          />
          <div>
            <h2 className="font-semibold text-lg">
              {otherParticipant.full_name || 'Unknown User'}
            </h2>
            <PresenceStatus
              isOnline={otherParticipant.is_online}
              lastSeen={otherParticipant.last_seen}
              showText={true}
              size="sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onCall && (
            <Button
              variant="outline"
              size="sm"
              onClick={onCall}
              className="flex items-center gap-2"
            >
              <Phone className="h-4 w-4" />
              Call
            </Button>
          )}
          
          {onVideoCall && (
            <Button
              variant="outline"
              size="sm"
              onClick={onVideoCall}
              className="flex items-center gap-2"
            >
              <Video className="h-4 w-4" />
              Video
            </Button>
          )}

          {onConversationInfo && (
            <Button
              variant="outline"
              size="sm"
              onClick={onConversationInfo}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Messages Container */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto relative"
      >
        {/* Load More Messages Indicator */}
        {hasMoreMessages && (
          <div className="p-4 text-center">
            {isLoadingMessages ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-500"></div>
                <span className="ml-2 text-gray-500">Loading messages...</span>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={onLoadMoreMessages}
                className="text-brand-600 hover:text-brand-700"
              >
                Load more messages
              </Button>
            )}
          </div>
        )}

        {/* Messages */}
        <div className="px-4 py-2">
          {messagesByDate.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Avatar
                src={otherParticipant.avatar_url || undefined}
                alt={otherParticipant.full_name || 'User'}
                size="lg"
                className="mb-4"
              />
              <h3 className="text-lg font-medium mb-2">
                Start a conversation with {otherParticipant.full_name}
              </h3>
              <p className="text-gray-500 mb-4">
                Say hello and start your conversation
              </p>
            </div>
          ) : (
            messagesByDate.map(([dateKey, dateGroups]) => (
              <div key={dateKey}>
                {/* Date Separator */}
                <div className="flex items-center justify-center py-4">
                  <div className="bg-gray-100 rounded-full px-3 py-1">
                    <span className="text-xs font-medium text-gray-600">
                      {formatDate(dateKey)}
                    </span>
                  </div>
                </div>

                {/* Message Groups for this date */}
                {dateGroups.map((group, groupIndex) => (
                  <div key={group.id} className="mb-6">
                    {group.messages.map((message, messageIndex) => {
                      const isOwnMessage = message.sender_id === currentUserId;
                      const isFirstInGroup = messageIndex === 0;
                      const isLastInGroup = messageIndex === group.messages.length - 1;
                      const showAvatar = isFirstInGroup && !isOwnMessage;
                      const showTimestamp = isLastInGroup;

                      return (
                        <div
                          key={message.id}
                          className={messageIndex > 0 ? 'mt-1' : ''}
                        >
                          <MessageBubble
                            message={{
                              ...message,
                              isOwnMessage,
                              isRead: message.read_at !== null,
                              isPending: message.isPending || false,
                              failedToSend: message.failedToSend || false,
                            }}
                            isOwnMessage={isOwnMessage}
                            showAvatar={showAvatar}
                            showTimestamp={showTimestamp}
                            isGrouped={!isFirstInGroup}
                            reactions={[]} // TODO: Load reactions
                            onReply={(msg) => {
                              // TODO: Implement reply functionality
                            }}
                            onReact={onMessageReact}
                            onEdit={onMessageEdit}
                            onDelete={onMessageDelete}
                            onRetry={onMessageRetry}
                            className="mb-1"
                          />
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            ))
          )}
        </div>

        {/* Typing Indicator */}
        {typingIndicators.length > 0 && (
          <div className="px-4 pb-2">
            <TypingIndicator
              typingUsers={typingIndicators}
              showAvatars={false}
            />
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to Bottom Button */}
      {showScrollToBottom && (
        <div className="absolute bottom-20 right-6 z-20">
          <Button
            onClick={scrollToBottom}
            className="rounded-full p-2 shadow-lg"
            variant="primary"
          >
            <ArrowDown className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Message Composer */}
      <MessageComposer
        conversationId={conversation.id}
        onSendMessage={onSendMessage}
        onTypingStart={onTypingStart}
        onTypingStop={onTypingStop}
        placeholder={`Message ${otherParticipant.full_name || 'User'}...`}
      />
    </div>
  );
}

interface EmptyConversationProps {
  onSelectConversation?: () => void;
  className?: string;
}

export function EmptyConversation({
  onSelectConversation,
  className = '',
}: EmptyConversationProps) {
  return (
    <div className={`flex flex-col items-center justify-center h-full bg-gray-50 ${className}`}>
      <div className="text-center max-w-md mx-auto p-8">
        <div className="w-24 h-24 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg 
            className="w-12 h-12 text-brand-500" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1} 
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
            />
          </svg>
        </div>
        
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Welcome to Messages
        </h3>
        
        <p className="text-gray-600 mb-6">
          Select a conversation to start chatting, or create a new conversation with your coach or clients.
        </p>

        {onSelectConversation && (
          <Button
            onClick={onSelectConversation}
            variant="primary"
            className="inline-flex items-center gap-2"
          >
            <Search className="h-4 w-4" />
            Browse Conversations
          </Button>
        )}
      </div>
    </div>
  );
}