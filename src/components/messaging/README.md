# Real-Time Messaging System

A comprehensive real-time messaging system for iPEC Coach Connect that enables seamless communication between coaches and clients.

## 🌟 Features

### Core Messaging
- **Real-time message delivery** with sub-second latency
- **File sharing** with image previews and document support
- **Message reactions** with emoji support
- **Message editing and deletion** with proper permissions
- **Read receipts and delivery status** tracking
- **Message search and filtering** capabilities

### Real-Time Features
- **Typing indicators** with debounced updates
- **Online/offline presence** with last seen timestamps
- **Live message synchronization** across devices
- **Connection management** with automatic reconnection
- **Presence heartbeat** system for accurate status

### User Experience
- **Mobile-first responsive design** optimized for all devices
- **Keyboard shortcuts** for power users
- **Message virtualization** for large conversation histories
- **Optimistic updates** with error recovery
- **Dark mode support** (theme-aware)
- **Accessibility compliance** (WCAG 2.1 AA)

### Coach-Client Integration
- **Session-linked messaging** with context awareness
- **Post-session follow-ups** with automated templates
- **Booking integration** for seamless communication
- **Message templates** for common scenarios
- **Professional boundaries** with appropriate messaging controls

## 🏗️ Architecture

### Database Schema
```sql
-- Conversations table
CREATE TABLE conversations (
    id UUID PRIMARY KEY,
    participants TEXT[] NOT NULL,
    last_message_id UUID,
    last_message_at TIMESTAMP WITH TIME ZONE,
    is_archived BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY,
    conversation_id UUID REFERENCES conversations(id),
    sender_id UUID REFERENCES auth.users(id),
    receiver_id UUID REFERENCES auth.users(id),
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text',
    file_url TEXT,
    file_name TEXT,
    file_size INTEGER,
    read_at TIMESTAMP WITH TIME ZONE,
    edited_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Additional tables for reactions, typing, presence
-- See: supabase/migrations/20250906000002_messaging_system_schema.sql
```

### Component Architecture
```
messaging/
├── MessageBubble.tsx          # Individual message display
├── MessageComposer.tsx        # Message input with file upload
├── ConversationList.tsx       # Conversation sidebar
├── MessageThread.tsx          # Main chat interface
├── TypingIndicator.tsx        # Real-time typing status
├── PresenceStatus.tsx         # Online/offline indicators
├── MessagingIntegration.tsx   # Coach-client integrations
├── index.ts                   # Clean exports
└── __tests__/
    └── MessagingSystem.test.tsx
```

## 🚀 Getting Started

### 1. Database Setup
Run the messaging system migration:
```bash
npx supabase migration up --file 20250906000002_messaging_system_schema.sql
```

### 2. Basic Implementation
```tsx
import { 
  ConversationList, 
  MessageThread, 
  useMessaging 
} from '../components/messaging';

function MessagingApp() {
  const {
    conversations,
    selectedConversationId,
    currentConversation,
    messages,
    typingIndicators,
    selectConversation,
    sendMessage,
    startTyping,
    stopTyping,
  } = useMessaging();

  return (
    <div className="flex h-screen">
      <ConversationList
        conversations={conversations}
        selectedConversationId={selectedConversationId}
        onSelectConversation={selectConversation}
        // ... other props
      />
      
      {currentConversation && (
        <MessageThread
          conversation={currentConversation}
          messages={messages}
          typingIndicators={typingIndicators}
          onSendMessage={sendMessage}
          onTypingStart={startTyping}
          onTypingStop={stopTyping}
          // ... other props
        />
      )}
    </div>
  );
}
```

### 3. Integration with Coaching
```tsx
import { PostSessionMessaging } from '../components/messaging';

function SessionComplete({ session }) {
  return (
    <div>
      <h2>Session Completed</h2>
      <PostSessionMessaging
        sessionId={session.id}
        coachId={session.coach_id}
        clientId={session.client_id}
        sessionDate={session.scheduled_at}
        currentUserId={currentUser.id}
      />
    </div>
  );
}
```

## 🔧 API Reference

### useMessaging Hook
```tsx
const {
  // State
  conversations,           // ConversationWithDetails[]
  selectedConversationId,  // string | null
  currentConversation,     // ConversationWithDetails | null
  messages,               // MessageWithDetails[]
  typingIndicators,       // TypingIndicatorWithUser[]
  isLoadingConversations, // boolean
  isLoadingMessages,      // boolean
  hasMoreMessages,        // boolean
  unreadCounts,          // Record<string, number>
  
  // Actions
  loadConversations,      // (filters?) => Promise<void>
  selectConversation,     // (id: string) => Promise<void>
  loadMoreMessages,       // (conversationId: string) => Promise<void>
  sendMessage,           // (conversationId: string, data: MessageFormData) => Promise<void>
  startConversation,     // (receiverId: string, message?: string) => Promise<string>
  startTyping,           // (conversationId: string) => Promise<void>
  stopTyping,            // (conversationId: string) => Promise<void>
  markConversationAsRead, // (conversationId: string) => Promise<void>
  
  // Utils
  currentUserId,         // string
} = useMessaging(options);
```

### Component Props

#### MessageBubble
```tsx
interface MessageBubbleProps {
  message: MessageWithDetails;
  isOwnMessage: boolean;
  showAvatar?: boolean;
  showTimestamp?: boolean;
  isGrouped?: boolean;
  reactions?: EmojiReaction[];
  onReply?: (message: MessageWithDetails) => void;
  onReact?: (messageId: string, emoji: string) => void;
  onEdit?: (messageId: string, content: string) => void;
  onDelete?: (messageId: string) => void;
  onRetry?: (messageId: string) => void;
}
```

#### MessageComposer
```tsx
interface MessageComposerProps {
  conversationId: string;
  placeholder?: string;
  onSendMessage: (data: MessageFormData) => Promise<void>;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
  onFileUpload?: (files: File[]) => Promise<void>;
  disabled?: boolean;
  maxFileSize?: number; // MB
  acceptedFileTypes?: string[];
  showEmojiPicker?: boolean;
  showFileUpload?: boolean;
}
```

## 📱 Mobile Optimization

The messaging system is optimized for mobile devices:

- **Touch-friendly interfaces** with appropriate tap targets
- **Responsive layouts** that work on all screen sizes
- **Swipe gestures** for message actions
- **Virtual keyboard handling** with proper input behavior
- **Performance optimization** for lower-end devices

## 🔐 Security Features

- **Row Level Security (RLS)** policies for all database tables
- **File upload validation** with type and size restrictions
- **Message content sanitization** to prevent XSS attacks
- **Rate limiting** for message sending to prevent spam
- **Secure file storage** with proper access controls

## 🚀 Performance Optimization

### Message Virtualization
For large conversation histories:
```tsx
// Automatically handles virtualization for 1000+ messages
<MessageThread
  conversation={conversation}
  messages={messages}
  // ... other props
/>
```

### Optimistic Updates
Messages appear instantly with loading states:
```tsx
// Messages show immediately, then sync with server
const sendMessage = async (data) => {
  // Add optimistic message
  const optimisticMessage = createOptimisticMessage(data);
  setMessages(prev => [...prev, optimisticMessage]);
  
  try {
    // Send to server
    const result = await messagingService.sendMessage(data);
    // Update with server response
    updateOptimisticMessage(optimisticMessage.id, result.data);
  } catch (error) {
    // Mark as failed
    markMessageAsFailed(optimisticMessage.id);
  }
};
```

### Connection Management
```tsx
// Automatic reconnection with exponential backoff
useEffect(() => {
  const subscription = messagingService.subscribeToConversation(
    conversationId,
    handleMessage,
    {
      onDisconnect: () => setConnectionStatus('disconnected'),
      onReconnect: () => setConnectionStatus('connected'),
      retryPolicy: 'exponential',
    }
  );
  
  return subscription.unsubscribe;
}, [conversationId]);
```

## 🧪 Testing

### Unit Tests
```bash
npm run test -- messaging
```

### Integration Tests
```bash
npm run test:integration -- messaging
```

### Performance Tests
```bash
npm run test:performance -- messaging
```

### E2E Tests
```bash
npm run test:e2e -- messaging
```

## 📊 Monitoring & Analytics

### Key Metrics
- **Message delivery time** (target: <1 second)
- **Connection uptime** (target: >99.9%)
- **File upload success rate** (target: >99%)
- **User engagement** (messages per session)
- **Error rates** by component and operation

### Error Tracking
```tsx
// Comprehensive error boundaries and logging
<ErrorBoundary
  fallback={<MessagingError />}
  onError={(error, errorInfo) => {
    analytics.track('messaging_error', {
      error: error.message,
      component: errorInfo.componentStack,
      userId: currentUser.id,
    });
  }}
>
  <MessagingApp />
</ErrorBoundary>
```

## 🔄 Real-Time System Details

### Supabase Realtime Integration
```tsx
// Subscribe to message updates
const subscription = supabase
  .channel(`conversation:${conversationId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `conversation_id=eq.${conversationId}`
  }, handleNewMessage)
  .on('broadcast', {
    event: 'typing'
  }, handleTypingIndicator)
  .subscribe();
```

### Connection States
- **Connected**: Normal operation with real-time updates
- **Connecting**: Attempting to establish connection
- **Disconnected**: Offline mode with queue management
- **Reconnecting**: Attempting to restore connection

### Message States
- **Sending**: Optimistic update, not yet confirmed
- **Sent**: Delivered to server
- **Delivered**: Received by recipient's device
- **Read**: Acknowledged by recipient
- **Failed**: Delivery failed, retry available

## 🎨 Customization

### Theming
```tsx
// Custom message bubble styling
<MessageBubble
  message={message}
  isOwnMessage={true}
  className="custom-bubble-style"
  bubbleClassName="bg-purple-500 text-white"
/>
```

### Message Templates
```tsx
// Add custom quick responses
const customTemplates = [
  'Thank you for the session!',
  'Can we reschedule?',
  'I have a question about...',
];

<MessageComposer
  conversationId={conversationId}
  quickResponses={customTemplates}
  onSendMessage={handleSend}
/>
```

### File Upload Configuration
```tsx
<MessageComposer
  conversationId={conversationId}
  maxFileSize={25} // MB
  acceptedFileTypes={['image/*', '.pdf', '.doc', '.docx']}
  onFileUpload={handleFileUpload}
  onSendMessage={handleSend}
/>
```

## 🚨 Error Handling

### Common Error Scenarios
1. **Network disconnection**: Graceful offline mode
2. **File upload failures**: Retry mechanism with progress
3. **Message delivery failures**: Retry with exponential backoff
4. **Authentication expiry**: Automatic token refresh
5. **Rate limiting**: User feedback with retry timing

### Error Recovery
```tsx
// Automatic retry for failed messages
const retryFailedMessage = async (messageId: string) => {
  try {
    await messagingService.retryMessage(messageId);
    updateMessageStatus(messageId, 'sent');
  } catch (error) {
    updateMessageStatus(messageId, 'failed');
    showRetryOption(messageId);
  }
};
```

## 📚 Best Practices

### Performance
- Use `React.memo` for message components to prevent unnecessary re-renders
- Implement proper cleanup for subscriptions and timeouts
- Use optimistic updates for better perceived performance
- Implement message virtualization for large conversations

### UX Guidelines
- Show typing indicators for 1-3 seconds maximum
- Provide clear visual feedback for message status
- Use appropriate loading states during operations
- Implement proper error messages with actionable steps

### Accessibility
- Ensure proper ARIA labels for screen readers
- Implement keyboard navigation for all interactive elements
- Provide high contrast mode support
- Use semantic HTML elements appropriately

## 🔮 Future Enhancements

### Planned Features
- **Voice messages** with audio recording and playback
- **Message scheduling** for delayed delivery
- **Message templates** with variable substitution
- **Advanced search** with filters and full-text search
- **Message translation** for international users
- **Group messaging** for team conversations
- **Message encryption** for enhanced privacy
- **Video calling integration** within message threads

### Integration Roadmap
- **Calendar integration** for session scheduling from messages
- **Payment processing** for booking payments via messages
- **AI-powered suggestions** for response templates
- **Analytics dashboard** for messaging insights
- **Third-party integrations** (Zoom, Slack, etc.)

## 📞 Support

For questions about the messaging system:
1. Check the component documentation in `/src/components/messaging/`
2. Review test files for usage examples
3. Check the integration examples in `MessagingIntegration.tsx`
4. Look at the database schema in `/supabase/migrations/`

## 📄 License

Part of the iPEC Coach Connect platform. See main project license for details.