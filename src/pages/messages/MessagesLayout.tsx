import React, { useState } from 'react';
import { Container } from '../../components/ui/Container';
import { Card } from '../../components/ui/Card';
import { 
  type ConversationFilters, 
  ConversationList, 
  EmptyConversation,
  MessageThread,
  useMessaging 
} from '../../components/messaging';

export function MessagesLayout() {
  // Messaging hook
  const {
    conversations,
    selectedConversationId,
    currentConversation,
    messages,
    typingIndicators,
    isLoadingConversations,
    isLoadingMessages,
    hasMoreMessages,
    unreadCounts,
    loadConversations,
    selectConversation,
    loadMoreMessages,
    sendMessage,
    startConversation,
    startTyping,
    stopTyping,
    markConversationAsRead,
    currentUserId,
  } = useMessaging({
    autoLoadConversations: true,
    enableRealtime: true,
    enablePresence: true,
  });

  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<ConversationFilters>({
    unread_only: false,
    archived: false,
  });

  // Create typing indicators map for selected conversation
  const conversationTypingIndicators = React.useMemo(() => {
    if (!selectedConversationId) return {};
    return { [selectedConversationId]: !!typingIndicators.find(t => t.is_typing) };
  }, [selectedConversationId, typingIndicators]);

  // Handle conversation selection
  const handleSelectConversation = React.useCallback(async (conversation: any) => {
    await selectConversation(conversation.id);
  }, [selectConversation]);

  // Handle sending messages
  const handleSendMessage = React.useCallback(async (data: any) => {
    if (!selectedConversationId) return;
    await sendMessage(selectedConversationId, data);
  }, [selectedConversationId, sendMessage]);

  // Handle typing start/stop
  const handleTypingStart = React.useCallback(() => {
    if (selectedConversationId) {
      startTyping(selectedConversationId);
    }
  }, [selectedConversationId, startTyping]);

  const handleTypingStop = React.useCallback(() => {
    if (selectedConversationId) {
      stopTyping(selectedConversationId);
    }
  }, [selectedConversationId, stopTyping]);

  // Handle load more messages
  const handleLoadMoreMessages = React.useCallback(async () => {
    if (selectedConversationId) {
      await loadMoreMessages(selectedConversationId);
    }
  }, [selectedConversationId, loadMoreMessages]);

  // Handle starting new conversation
  const handleCreateConversation = React.useCallback(() => {
    // TODO: Implement new conversation modal/flow
    console.log('Create new conversation');
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Container className="py-6">
        <div className="grid lg:grid-cols-12 gap-6 h-[calc(100vh-8rem)]">
          {/* Conversation List */}
          <div className="lg:col-span-4">
            <Card className="h-full">
              <ConversationList
                conversations={conversations}
                selectedConversationId={selectedConversationId}
                currentUserId={currentUserId}
                searchQuery={searchQuery}
                filters={filters}
                typingIndicators={conversationTypingIndicators}
                isLoading={isLoadingConversations}
                onSelectConversation={handleSelectConversation}
                onSearchChange={setSearchQuery}
                onFiltersChange={setFilters}
                onCreateConversation={handleCreateConversation}
                className="h-full"
              />
            </Card>
          </div>

          {/* Message Thread */}
          <div className="lg:col-span-8">
            <Card className="h-full">
              {currentConversation ? (
                <MessageThread
                  conversation={currentConversation}
                  messages={messages}
                  currentUserId={currentUserId}
                  typingIndicators={typingIndicators}
                  isLoadingMessages={isLoadingMessages}
                  hasMoreMessages={hasMoreMessages}
                  onSendMessage={handleSendMessage}
                  onLoadMoreMessages={handleLoadMoreMessages}
                  onTypingStart={handleTypingStart}
                  onTypingStop={handleTypingStop}
                  onMessageReact={(messageId, emoji) => {
                    // TODO: Implement message reactions
                    console.log('React to message:', messageId, emoji);
                  }}
                  onMessageEdit={(messageId, content) => {
                    // TODO: Implement message editing
                    console.log('Edit message:', messageId, content);
                  }}
                  onMessageDelete={(messageId) => {
                    // TODO: Implement message deletion
                    console.log('Delete message:', messageId);
                  }}
                  onMessageRetry={(messageId) => {
                    // TODO: Implement message retry
                    console.log('Retry message:', messageId);
                  }}
                  onCall={() => {
                    // TODO: Implement calling functionality
                    console.log('Start call');
                  }}
                  onVideoCall={() => {
                    // TODO: Implement video calling functionality
                    console.log('Start video call');
                  }}
                  onConversationInfo={() => {
                    // TODO: Implement conversation info modal
                    console.log('Show conversation info');
                  }}
                  className="h-full"
                />
              ) : (
                <EmptyConversation
                  onSelectConversation={handleCreateConversation}
                  className="h-full"
                />
              )}
            </Card>
          </div>
        </div>
      </Container>
    </div>
  );
}