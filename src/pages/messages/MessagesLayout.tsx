import React from 'react';
import { Search, Filter, Bell, Video, Paperclip, Send, MoreVertical, Phone } from 'lucide-react';
import { Container } from '../../components/ui/Container';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';

const mockConversations = [
  {
    id: 1,
    user: {
      name: 'Sarah Johnson',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80',
      role: 'Coach',
      status: 'online',
    },
    lastMessage: {
      text: 'Looking forward to our next session!',
      timestamp: '10:30 AM',
      unread: true,
    },
    typing: false,
  },
  {
    id: 2,
    user: {
      name: 'Michael Chen',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80',
      role: 'Coach',
      status: 'offline',
    },
    lastMessage: {
      text: 'Great progress today! Here are your action items...',
      timestamp: 'Yesterday',
      unread: false,
    },
    typing: true,
  },
];

const mockMessages = [
  {
    id: 1,
    sender: {
      name: 'Sarah Johnson',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80',
    },
    content: 'Hi! How are you preparing for our upcoming session?',
    timestamp: '10:15 AM',
    type: 'text',
  },
  {
    id: 2,
    sender: {
      name: 'You',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80',
    },
    content: "I've been reviewing my goals and completed the worksheet you sent.",
    timestamp: '10:20 AM',
    type: 'text',
  },
  {
    id: 3,
    sender: {
      name: 'Sarah Johnson',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80',
    },
    content: "That's great! Would you like to discuss any specific challenges?",
    timestamp: '10:25 AM',
    type: 'text',
  },
];

const quickResponses = [
  'Thanks for your message!',
  "I'll get back to you soon.",
  'Can we schedule a call?',
  'Looking forward to our session!',
];

export function MessagesLayout() {
  const [selectedConversation, setSelectedConversation] = React.useState(mockConversations[0]);
  const [messageInput, setMessageInput] = React.useState('');
  const [filter, setFilter] = React.useState('all');

  return (
    <div className="min-h-screen bg-gray-50">
      <Container className="py-6">
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Conversation List */}
          <Card className="lg:col-span-4">
            <Card.Header className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Messages</h2>
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Bell className="h-4 w-4" />}
                >
                  Notifications
                </Button>
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search messages..."
                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <Button
                  variant="outline"
                  icon={<Filter className="h-4 w-4" />}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filter === 'all' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('all')}
                >
                  All
                </Button>
                <Button
                  variant={filter === 'coaches' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('coaches')}
                >
                  Coaches
                </Button>
                <Button
                  variant={filter === 'unread' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('unread')}
                >
                  Unread
                </Button>
              </div>
            </Card.Header>
            <Card.Body className="space-y-2 h-[calc(100vh-16rem)] overflow-y-auto">
              {mockConversations.map((conversation) => (
                <button
                  key={conversation.id}
                  className={`w-full p-3 rounded-lg text-left transition-colors ${
                    selectedConversation.id === conversation.id
                      ? 'bg-brand-50'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedConversation(conversation)}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar
                        src={conversation.user.image}
                        alt={conversation.user.name}
                        size="md"
                      />
                      <div
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                          conversation.user.status === 'online'
                            ? 'bg-green-500'
                            : 'bg-gray-400'
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium truncate">
                            {conversation.user.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {conversation.user.role}
                          </p>
                        </div>
                        <span className="text-xs text-gray-500">
                          {conversation.lastMessage.timestamp}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm text-gray-600 truncate">
                          {conversation.lastMessage.text}
                        </p>
                        {conversation.lastMessage.unread && (
                          <Badge variant="success" className="flex-shrink-0">
                            New
                          </Badge>
                        )}
                      </div>
                      {conversation.typing && (
                        <p className="text-sm text-brand-600 mt-1">Typing...</p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </Card.Body>
          </Card>

          {/* Message Thread */}
          <Card className="lg:col-span-8">
            <Card.Header className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <Avatar
                  src={selectedConversation.user.image}
                  alt={selectedConversation.user.name}
                  size="md"
                />
                <div>
                  <h2 className="font-semibold">{selectedConversation.user.name}</h2>
                  <p className="text-sm text-gray-600">{selectedConversation.user.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  icon={<Phone className="h-4 w-4" />}
                >
                  Call
                </Button>
                <Button
                  variant="outline"
                  icon={<Video className="h-4 w-4" />}
                >
                  Video
                </Button>
                <Button
                  variant="outline"
                  icon={<MoreVertical className="h-4 w-4" />}
                />
              </div>
            </Card.Header>
            <Card.Body className="p-0">
              <div className="h-[calc(100vh-24rem)] overflow-y-auto p-6 space-y-6">
                {mockMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex items-start gap-3 ${
                      message.sender.name === 'You' ? 'flex-row-reverse' : ''
                    }`}
                  >
                    <Avatar
                      src={message.sender.image}
                      alt={message.sender.name}
                      size="sm"
                    />
                    <div
                      className={`max-w-[70%] ${
                        message.sender.name === 'You'
                          ? 'bg-brand-500 text-white'
                          : 'bg-gray-100'
                      } p-3 rounded-lg`}
                    >
                      <p>{message.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          message.sender.name === 'You'
                            ? 'text-brand-100'
                            : 'text-gray-500'
                        }`}
                      >
                        {message.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t">
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-2">Quick Responses</h4>
                  <div className="flex flex-wrap gap-2">
                    {quickResponses.map((response, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => setMessageInput(response)}
                      >
                        {response}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    icon={<Paperclip className="h-4 w-4" />}
                  />
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <Button
                    variant="gradient"
                    icon={<Send className="h-4 w-4" />}
                    onClick={() => setMessageInput('')}
                  >
                    Send
                  </Button>
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>
      </Container>
    </div>
  );
}