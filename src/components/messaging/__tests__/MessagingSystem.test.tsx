import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MessageBubble } from '../MessageBubble';
import { MessageComposer } from '../MessageComposer';
import { ConversationList } from '../ConversationList';
import { TypingIndicator } from '../TypingIndicator';
import { PresenceStatus } from '../PresenceStatus';
import type { 
  MessageWithDetails, 
  ConversationWithDetails,
  TypingIndicatorWithUser,
  ConversationFilters 
} from '../../../types/database';

// Mock data
const mockUser = {
  id: 'user1',
  full_name: 'Test User',
  avatar_url: 'https://example.com/avatar.jpg',
};

const mockMessage: MessageWithDetails = {
  id: 'msg1',
  conversation_id: 'conv1',
  sender_id: 'user2',
  receiver_id: 'user1',
  content: 'Hello! How are you today?',
  message_type: 'text',
  file_url: null,
  file_name: null,
  file_size: null,
  read_at: null,
  edited_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  sender: {
    id: 'user2',
    full_name: 'Jane Coach',
    avatar_url: 'https://example.com/coach.jpg',
    bio: null,
    phone: null,
    location: null,
    timezone: null,
    mfa_enabled: null,
    username: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  receiver: mockUser,
  reactions: [],
  isOwnMessage: false,
  isRead: false,
  isPending: false,
  failedToSend: false,
};

const mockConversation: ConversationWithDetails = {
  id: 'conv1',
  participants: ['user1', 'user2'],
  last_message_id: 'msg1',
  last_message_at: new Date().toISOString(),
  is_archived: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  participant_profiles: [
    {
      id: 'user2',
      full_name: 'Jane Coach',
      avatar_url: 'https://example.com/coach.jpg',
      is_online: true,
      last_seen: new Date().toISOString(),
    }
  ],
  last_message: mockMessage,
  unread_count: 1,
  other_participant: {
    id: 'user2',
    full_name: 'Jane Coach',
    avatar_url: 'https://example.com/coach.jpg',
    bio: null,
    phone: null,
    location: null,
    timezone: null,
    mfa_enabled: null,
    username: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  is_group: false,
};

const mockTypingIndicator: TypingIndicatorWithUser = {
  id: 'typing1',
  conversation_id: 'conv1',
  user_id: 'user2',
  is_typing: true,
  updated_at: new Date().toISOString(),
  user: {
    id: 'user2',
    full_name: 'Jane Coach',
    avatar_url: 'https://example.com/coach.jpg',
    bio: null,
    phone: null,
    location: null,
    timezone: null,
    mfa_enabled: null,
    username: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
};

describe('MessagingSystem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('MessageBubble', () => {
    it('renders message content correctly', () => {
      render(
        <MessageBubble
          message={mockMessage}
          isOwnMessage={false}
          showAvatar={true}
          showTimestamp={true}
        />
      );

      expect(screen.getByText('Hello! How are you today?')).toBeInTheDocument();
      expect(screen.getByText('Jane Coach')).toBeInTheDocument();
    });

    it('renders own messages with different styling', () => {
      const ownMessage = { ...mockMessage, sender_id: 'user1', isOwnMessage: true };
      
      render(
        <MessageBubble
          message={ownMessage}
          isOwnMessage={true}
          showAvatar={true}
          showTimestamp={true}
        />
      );

      const messageBubble = screen.getByText('Hello! How are you today?').closest('div');
      expect(messageBubble).toHaveClass('bg-brand-500');
    });

    it('shows context menu on right click', async () => {
      const user = userEvent.setup();
      
      render(
        <MessageBubble
          message={mockMessage}
          isOwnMessage={false}
          onReply={vi.fn()}
          onReact={vi.fn()}
        />
      );

      const messageBubble = screen.getByText('Hello! How are you today?');
      await user.pointer({ keys: '[MouseRight>]', target: messageBubble });

      expect(screen.getByText('Reply')).toBeInTheDocument();
      expect(screen.getByText('Add Reaction')).toBeInTheDocument();
    });

    it('handles file messages correctly', () => {
      const fileMessage = {
        ...mockMessage,
        message_type: 'file' as const,
        file_url: 'https://example.com/document.pdf',
        file_name: 'document.pdf',
        file_size: 1024,
      };

      render(
        <MessageBubble
          message={fileMessage}
          isOwnMessage={false}
          showAvatar={true}
          showTimestamp={true}
        />
      );

      expect(screen.getByText('document.pdf')).toBeInTheDocument();
      expect(screen.getByText('View')).toBeInTheDocument();
    });
  });

  describe('MessageComposer', () => {
    it('renders message input and send button', () => {
      const onSendMessage = vi.fn();
      
      render(
        <MessageComposer
          conversationId="conv1"
          onSendMessage={onSendMessage}
          placeholder="Type a message..."
        />
      );

      expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('calls onSendMessage when message is sent', async () => {
      const user = userEvent.setup();
      const onSendMessage = vi.fn().mockResolvedValue(undefined);
      
      render(
        <MessageComposer
          conversationId="conv1"
          onSendMessage={onSendMessage}
          placeholder="Type a message..."
        />
      );

      const input = screen.getByPlaceholderText('Type a message...');
      const sendButton = screen.getByRole('button');

      await user.type(input, 'Hello world!');
      await user.click(sendButton);

      expect(onSendMessage).toHaveBeenCalledWith({
        content: 'Hello world!',
        files: [],
      });
    });

    it('handles enter key to send message', async () => {
      const user = userEvent.setup();
      const onSendMessage = vi.fn().mockResolvedValue(undefined);
      
      render(
        <MessageComposer
          conversationId="conv1"
          onSendMessage={onSendMessage}
          placeholder="Type a message..."
        />
      );

      const input = screen.getByPlaceholderText('Type a message...');
      await user.type(input, 'Hello world!{enter}');

      expect(onSendMessage).toHaveBeenCalledWith({
        content: 'Hello world!',
        files: [],
      });
    });

    it('calls typing indicators correctly', async () => {
      const user = userEvent.setup();
      const onTypingStart = vi.fn();
      const onTypingStop = vi.fn();
      
      render(
        <MessageComposer
          conversationId="conv1"
          onSendMessage={vi.fn().mockResolvedValue(undefined)}
          onTypingStart={onTypingStart}
          onTypingStop={onTypingStop}
          placeholder="Type a message..."
        />
      );

      const input = screen.getByPlaceholderText('Type a message...');
      await user.type(input, 'Hello');

      expect(onTypingStart).toHaveBeenCalled();

      // Clear input should trigger stop typing
      await user.clear(input);
      
      // Wait for debounced typing stop
      await waitFor(() => {
        expect(onTypingStop).toHaveBeenCalled();
      }, { timeout: 3500 });
    });

    it('shows emoji picker when emoji button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <MessageComposer
          conversationId="conv1"
          onSendMessage={vi.fn()}
          showEmojiPicker={true}
        />
      );

      const emojiButton = screen.getByRole('button', { name: /emoji/i });
      await user.click(emojiButton);

      // Should show emoji picker with quick reactions
      expect(screen.getByText('👍')).toBeInTheDocument();
      expect(screen.getByText('❤️')).toBeInTheDocument();
    });
  });

  describe('ConversationList', () => {
    const mockFilters: ConversationFilters = {
      unread_only: false,
      archived: false,
    };

    it('renders conversation list correctly', () => {
      render(
        <ConversationList
          conversations={[mockConversation]}
          selectedConversationId={null}
          currentUserId="user1"
          searchQuery=""
          filters={mockFilters}
          typingIndicators={{}}
          onSelectConversation={vi.fn()}
          onSearchChange={vi.fn()}
          onFiltersChange={vi.fn()}
        />
      );

      expect(screen.getByText('Messages')).toBeInTheDocument();
      expect(screen.getByText('Jane Coach')).toBeInTheDocument();
      expect(screen.getByText('Hello! How are you today?')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument(); // Unread count
    });

    it('handles conversation selection', async () => {
      const user = userEvent.setup();
      const onSelectConversation = vi.fn();

      render(
        <ConversationList
          conversations={[mockConversation]}
          selectedConversationId={null}
          currentUserId="user1"
          searchQuery=""
          filters={mockFilters}
          typingIndicators={{}}
          onSelectConversation={onSelectConversation}
          onSearchChange={vi.fn()}
          onFiltersChange={vi.fn()}
        />
      );

      const conversationItem = screen.getByText('Jane Coach').closest('div');
      await user.click(conversationItem!);

      expect(onSelectConversation).toHaveBeenCalledWith(mockConversation);
    });

    it('filters conversations based on search query', async () => {
      const user = userEvent.setup();
      const onSearchChange = vi.fn();

      render(
        <ConversationList
          conversations={[mockConversation]}
          selectedConversationId={null}
          currentUserId="user1"
          searchQuery=""
          filters={mockFilters}
          typingIndicators={{}}
          onSelectConversation={vi.fn()}
          onSearchChange={onSearchChange}
          onFiltersChange={vi.fn()}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search conversations...');
      await user.type(searchInput, 'Jane');

      expect(onSearchChange).toHaveBeenCalledWith('J');
      expect(onSearchChange).toHaveBeenCalledWith('Ja');
      expect(onSearchChange).toHaveBeenCalledWith('Jan');
      expect(onSearchChange).toHaveBeenCalledWith('Jane');
    });

    it('shows typing indicator when user is typing', () => {
      render(
        <ConversationList
          conversations={[mockConversation]}
          selectedConversationId={null}
          currentUserId="user1"
          searchQuery=""
          filters={mockFilters}
          typingIndicators={{ 'conv1': true }}
          onSelectConversation={vi.fn()}
          onSearchChange={vi.fn()}
          onFiltersChange={vi.fn()}
        />
      );

      // Should show typing indicator instead of last message
      expect(screen.getByText(/typing/i)).toBeInTheDocument();
    });
  });

  describe('TypingIndicator', () => {
    it('renders typing indicator correctly', () => {
      render(
        <TypingIndicator
          typingUsers={[mockTypingIndicator]}
          showAvatars={true}
        />
      );

      expect(screen.getByText('Jane Coach is typing...')).toBeInTheDocument();
    });

    it('handles multiple typing users', () => {
      const multipleTyping = [
        mockTypingIndicator,
        { 
          ...mockTypingIndicator, 
          id: 'typing2',
          user_id: 'user3',
          user: { 
            ...mockTypingIndicator.user, 
            id: 'user3',
            full_name: 'John Client' 
          }
        }
      ];

      render(
        <TypingIndicator
          typingUsers={multipleTyping}
          showAvatars={true}
        />
      );

      expect(screen.getByText('Jane Coach and John Client are typing...')).toBeInTheDocument();
    });

    it('does not render when no one is typing', () => {
      const { container } = render(
        <TypingIndicator
          typingUsers={[]}
          showAvatars={true}
        />
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('PresenceStatus', () => {
    it('shows online status correctly', () => {
      render(
        <PresenceStatus
          isOnline={true}
          showText={true}
        />
      );

      expect(screen.getByText('Online')).toBeInTheDocument();
    });

    it('shows last seen when offline', () => {
      const lastSeen = new Date(Date.now() - 30 * 60 * 1000).toISOString(); // 30 minutes ago
      
      render(
        <PresenceStatus
          isOnline={false}
          lastSeen={lastSeen}
          showText={true}
        />
      );

      expect(screen.getByText(/30 minutes ago/)).toBeInTheDocument();
    });

    it('shows appropriate color for online status', () => {
      const { container } = render(
        <PresenceStatus
          isOnline={true}
          showText={false}
        />
      );

      const statusDot = container.querySelector('div');
      expect(statusDot).toHaveClass('bg-green-500');
    });
  });

  describe('Integration', () => {
    it('components work together correctly', async () => {
      const user = userEvent.setup();
      const onSendMessage = vi.fn().mockResolvedValue(undefined);
      const onSelectConversation = vi.fn();

      // This would typically be wrapped in a MessagesLayout component
      render(
        <div>
          <ConversationList
            conversations={[mockConversation]}
            selectedConversationId={null}
            currentUserId="user1"
            searchQuery=""
            filters={{ unread_only: false, archived: false }}
            typingIndicators={{}}
            onSelectConversation={onSelectConversation}
            onSearchChange={vi.fn()}
            onFiltersChange={vi.fn()}
          />
          <MessageComposer
            conversationId="conv1"
            onSendMessage={onSendMessage}
            placeholder="Type a message..."
          />
        </div>
      );

      // Select conversation
      const conversationItem = screen.getByText('Jane Coach').closest('div');
      await user.click(conversationItem!);
      expect(onSelectConversation).toHaveBeenCalled();

      // Send message
      const input = screen.getByPlaceholderText('Type a message...');
      const sendButton = screen.getByRole('button');
      
      await user.type(input, 'Test message');
      await user.click(sendButton);
      
      expect(onSendMessage).toHaveBeenCalledWith({
        content: 'Test message',
        files: [],
      });
    });
  });
});

// Performance tests
describe('MessagingSystem Performance', () => {
  it('handles large conversation lists efficiently', () => {
    const manyConversations = Array.from({ length: 100 }, (_, i) => ({
      ...mockConversation,
      id: `conv${i}`,
      participant_profiles: [{
        ...mockConversation.participant_profiles[0],
        id: `user${i}`,
        full_name: `User ${i}`,
      }],
    }));

    const startTime = performance.now();
    
    render(
      <ConversationList
        conversations={manyConversations}
        selectedConversationId={null}
        currentUserId="user1"
        searchQuery=""
        filters={{ unread_only: false, archived: false }}
        typingIndicators={{}}
        onSelectConversation={vi.fn()}
        onSearchChange={vi.fn()}
        onFiltersChange={vi.fn()}
      />
    );

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Should render within reasonable time (adjust threshold as needed)
    expect(renderTime).toBeLessThan(100); // 100ms
  });

  it('handles many messages efficiently', () => {
    const manyMessages = Array.from({ length: 50 }, (_, i) => ({
      ...mockMessage,
      id: `msg${i}`,
      content: `Message ${i}`,
      created_at: new Date(Date.now() - i * 60000).toISOString(),
    }));

    const startTime = performance.now();
    
    manyMessages.forEach((message, index) => {
      render(
        <MessageBubble
          key={message.id}
          message={message}
          isOwnMessage={index % 2 === 0}
          showAvatar={true}
          showTimestamp={true}
        />
      );
    });

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Should render within reasonable time
    expect(renderTime).toBeLessThan(200); // 200ms
  });
});