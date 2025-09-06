// Core messaging components
export { MessageBubble } from './MessageBubble';
export { MessageComposer, QuickResponses } from './MessageComposer';
export { ConversationList, ConversationListItem } from './ConversationList';
export { MessageThread, EmptyConversation } from './MessageThread';

// Real-time components
export { 
  TypingIndicator, 
  TypingDots, 
  InlineTypingIndicator 
} from './TypingIndicator';
export { 
  PresenceStatus, 
  UserPresenceIndicator, 
  ConversationPresence 
} from './PresenceStatus';

// Hooks
export { useMessaging } from '../../hooks/useMessaging';

// Types (re-export from database types)
export type {
  MessageWithDetails,
  ConversationWithDetails,
  MessageFormData,
  SendMessageRequest,
  ConversationFilters,
  TypingIndicatorWithUser,
  MessageReactionWithUser,
  EmojiReaction,
  MessageContextMenu,
  MessageNotification,
  ConversationNotificationSettings,
  MessageSearchResult,
  MessageSearchFilters,
  UserSearchResult,
  MessageFile,
  MediaGalleryItem,
  ConversationSettings,
  GlobalMessagingSettings,
  ConversationMetrics,
  UserMessagingMetrics,
  CoachClientConversation,
  SessionMessage,
  MessagingApiResponse,
  MessagesPaginationOptions,
  ConversationsPaginationOptions,
} from '../../types/database';