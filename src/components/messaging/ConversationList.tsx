import React, { useMemo } from 'react';
import { Search, Filter, Plus, Archive, MoreVertical } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { PresenceStatus } from './PresenceStatus';
import { InlineTypingIndicator } from './TypingIndicator';
import type { ConversationWithDetails, ConversationFilters } from '../../types/database';

interface ConversationListProps {
  conversations: ConversationWithDetails[];
  selectedConversationId?: string;
  currentUserId: string;
  searchQuery: string;
  filters: ConversationFilters;
  typingIndicators: Record<string, boolean>; // conversationId -> isTyping
  isLoading?: boolean;
  onSelectConversation: (conversation: ConversationWithDetails) => void;
  onSearchChange: (query: string) => void;
  onFiltersChange: (filters: ConversationFilters) => void;
  onCreateConversation?: () => void;
  onArchiveConversation?: (conversationId: string) => void;
  onDeleteConversation?: (conversationId: string) => void;
  className?: string;
}

export function ConversationList({
  conversations,
  selectedConversationId,
  currentUserId,
  searchQuery,
  filters,
  typingIndicators,
  isLoading = false,
  onSelectConversation,
  onSearchChange,
  onFiltersChange,
  onCreateConversation,
  onArchiveConversation,
  onDeleteConversation,
  className = '',
}: ConversationListProps) {
  // Filter and sort conversations
  const filteredConversations = useMemo(() => {
    let filtered = conversations;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(conv => 
        conv.participant_profiles.some(p => 
          p.full_name?.toLowerCase().includes(query)
        ) ||
        conv.last_message?.content.toLowerCase().includes(query)
      );
    }

    // Apply unread filter
    if (filters.unread_only) {
      filtered = filtered.filter(conv => conv.unread_count > 0);
    }

    // Apply archived filter
    if (filters.archived !== undefined) {
      filtered = filtered.filter(conv => conv.is_archived === filters.archived);
    }

    // Sort by last message time
    return filtered.sort((a, b) => {
      const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
      const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
      return bTime - aTime;
    });
  }, [conversations, searchQuery, filters]);

  const formatLastMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    
    // Check if it's today
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // Check if it's this week
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    if (date > weekAgo) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    
    // Older than a week
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const getOtherParticipant = (conversation: ConversationWithDetails) => {
    return conversation.participant_profiles.find(p => p.id !== currentUserId);
  };

  const getConversationName = (conversation: ConversationWithDetails) => {
    const otherParticipant = getOtherParticipant(conversation);
    if (otherParticipant) {
      return otherParticipant.full_name || 'Unknown User';
    }
    
    // For group conversations or fallback
    const participantNames = conversation.participant_profiles
      .filter(p => p.id !== currentUserId)
      .map(p => p.full_name || 'Unknown')
      .slice(0, 2);
    
    if (participantNames.length === 0) return 'You';
    if (participantNames.length === 1) return participantNames[0];
    return `${participantNames.join(', ')}${conversation.participant_profiles.length > 3 ? '...' : ''}`;
  };

  const getLastMessagePreview = (conversation: ConversationWithDetails) => {
    const lastMessage = conversation.last_message;
    if (!lastMessage) return 'No messages yet';

    if (lastMessage.message_type === 'image') {
      return `${lastMessage.sender_id === currentUserId ? 'You' : 'Them'}: 📷 Photo`;
    }
    if (lastMessage.message_type === 'file') {
      return `${lastMessage.sender_id === currentUserId ? 'You' : 'Them'}: 📎 ${lastMessage.file_name || 'File'}`;
    }
    
    const prefix = lastMessage.sender_id === currentUserId ? 'You: ' : '';
    const content = lastMessage.content.length > 50 
      ? `${lastMessage.content.substring(0, 50)}...`
      : lastMessage.content;
    
    return `${prefix}${content}`;
  };

  return (
    <div className={`flex flex-col h-full bg-white ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Messages</h2>
          {onCreateConversation && (
            <Button
              variant="primary"
              size="sm"
              onClick={onCreateConversation}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          <Button
            variant={!filters.unread_only && !filters.archived ? 'primary' : 'outline'}
            size="sm"
            onClick={() => onFiltersChange({ ...filters, unread_only: false, archived: false })}
          >
            All
          </Button>
          <Button
            variant={filters.unread_only ? 'primary' : 'outline'}
            size="sm"
            onClick={() => onFiltersChange({ ...filters, unread_only: true, archived: false })}
          >
            Unread
          </Button>
          <Button
            variant={filters.archived ? 'primary' : 'outline'}
            size="sm"
            onClick={() => onFiltersChange({ ...filters, unread_only: false, archived: true })}
          >
            <Archive className="h-4 w-4 mr-1" />
            Archived
          </Button>
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading conversations...</p>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-500 mb-4">
              {searchQuery.trim() ? (
                <p>No conversations found matching "{searchQuery}"</p>
              ) : filters.unread_only ? (
                <p>No unread messages</p>
              ) : filters.archived ? (
                <p>No archived conversations</p>
              ) : (
                <p>No conversations yet</p>
              )}
            </div>
            {!searchQuery.trim() && !filters.unread_only && !filters.archived && onCreateConversation && (
              <Button variant="primary" onClick={onCreateConversation}>
                Start a conversation
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredConversations.map((conversation) => {
              const otherParticipant = getOtherParticipant(conversation);
              const isSelected = conversation.id === selectedConversationId;
              const isTyping = typingIndicators[conversation.id];

              return (
                <div
                  key={conversation.id}
                  className={`
                    p-4 cursor-pointer hover:bg-gray-50 transition-colors relative group
                    ${isSelected ? 'bg-brand-50 border-r-4 border-brand-500' : ''}
                  `}
                  onClick={() => onSelectConversation(conversation)}
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <Avatar
                        src={otherParticipant?.avatar_url || undefined}
                        alt={getConversationName(conversation)}
                        size="md"
                      />
                      {otherParticipant && (
                        <PresenceStatus
                          isOnline={otherParticipant.is_online}
                          lastSeen={otherParticipant.last_seen}
                          size="sm"
                          className="absolute -bottom-0.5 -right-0.5"
                        />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className={`
                          font-medium truncate text-sm
                          ${conversation.unread_count > 0 ? 'text-gray-900' : 'text-gray-700'}
                        `}>
                          {getConversationName(conversation)}
                        </h3>
                        <div className="flex items-center gap-2 ml-2">
                          {conversation.last_message_at && (
                            <span className="text-xs text-gray-500 flex-shrink-0">
                              {formatLastMessageTime(conversation.last_message_at)}
                            </span>
                          )}
                          {conversation.unread_count > 0 && (
                            <Badge variant="primary" className="flex-shrink-0">
                              {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Last Message or Typing Indicator */}
                      <div className="text-sm text-gray-600">
                        {isTyping ? (
                          <InlineTypingIndicator
                            isTyping={true}
                            typingUser={otherParticipant}
                          />
                        ) : (
                          <p className={`
                            truncate
                            ${conversation.unread_count > 0 ? 'font-medium text-gray-900' : ''}
                          `}>
                            {getLastMessagePreview(conversation)}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Context Menu */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1 h-auto"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Handle context menu - could show dropdown with archive/delete options
                        }}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Conversation Indicators */}
                  {(conversation.is_archived || conversation.is_group) && (
                    <div className="flex gap-1 mt-2">
                      {conversation.is_archived && (
                        <Badge variant="secondary" className="text-xs">
                          <Archive className="h-3 w-3 mr-1" />
                          Archived
                        </Badge>
                      )}
                      {conversation.is_group && (
                        <Badge variant="secondary" className="text-xs">
                          Group ({conversation.participant_profiles.length})
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

interface ConversationListItemProps {
  conversation: ConversationWithDetails;
  currentUserId: string;
  isSelected: boolean;
  isTyping: boolean;
  onClick: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
  className?: string;
}

export function ConversationListItem({
  conversation,
  currentUserId,
  isSelected,
  isTyping,
  onClick,
  onArchive,
  onDelete,
  className = '',
}: ConversationListItemProps) {
  const otherParticipant = conversation.participant_profiles.find(p => p.id !== currentUserId);

  return (
    <div
      className={`
        p-4 cursor-pointer hover:bg-gray-50 transition-colors border-l-4
        ${isSelected ? 'bg-brand-50 border-brand-500' : 'border-transparent'}
        ${className}
      `}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <Avatar
            src={otherParticipant?.avatar_url || undefined}
            alt={otherParticipant?.full_name || 'Unknown User'}
            size="md"
          />
          {otherParticipant && (
            <PresenceStatus
              isOnline={otherParticipant.is_online}
              lastSeen={otherParticipant.last_seen}
              size="sm"
              className="absolute -bottom-0.5 -right-0.5"
            />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-1">
            <h3 className="font-medium truncate">
              {otherParticipant?.full_name || 'Unknown User'}
            </h3>
            {conversation.last_message_at && (
              <span className="text-xs text-gray-500">
                {new Date(conversation.last_message_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            )}
          </div>

          <div className="flex justify-between items-center">
            <div className="flex-1 min-w-0">
              {isTyping ? (
                <InlineTypingIndicator
                  isTyping={true}
                  typingUser={otherParticipant}
                />
              ) : (
                <p className="text-sm text-gray-600 truncate">
                  {conversation.last_message?.content || 'No messages yet'}
                </p>
              )}
            </div>
            
            {conversation.unread_count > 0 && (
              <Badge variant="primary" className="ml-2 flex-shrink-0">
                {conversation.unread_count}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}