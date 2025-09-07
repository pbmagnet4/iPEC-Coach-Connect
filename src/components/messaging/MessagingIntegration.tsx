import React, { useCallback, useState } from 'react';
import { Calendar, Clock, MessageSquare, Phone, User, Video } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { useMessaging } from '../../hooks/useMessaging';
import type { Tables } from '../../types/database';

// Integration components showing how messaging connects with coaching/booking

interface CoachingSessionCardProps {
  session: Tables<'sessions'> & {
    coach: {
      id: string;
      full_name: string | null;
      avatar_url: string | null;
    };
  };
  onMessageCoach: (coachId: string) => void;
  onJoinSession: (sessionId: string) => void;
}

export function CoachingSessionCard({ 
  session, 
  onMessageCoach, 
  onJoinSession 
}: CoachingSessionCardProps) {
  const sessionDate = new Date(session.scheduled_at);
  const isUpcoming = sessionDate > new Date();
  const isToday = sessionDate.toDateString() === new Date().toDateString();

  return (
    <Card className="p-4">
      <div className="flex items-start gap-4">
        <Avatar
          src={session.coach.avatar_url || undefined}
          alt={session.coach.full_name || 'Coach'}
          size="md"
        />
        
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold">
                Session with {session.coach.full_name}
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                <Calendar className="h-4 w-4" />
                <span>
                  {sessionDate.toLocaleDateString()} at{' '}
                  {sessionDate.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
                {isToday && (
                  <Badge variant="primary" className="ml-2">
                    Today
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                <Clock className="h-4 w-4" />
                <span>{session.duration_minutes} minutes</span>
                <Badge 
                  variant={session.status === 'completed' ? 'success' : 'secondary'}
                  className="ml-2"
                >
                  {session.status}
                </Badge>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onMessageCoach(session.coach.id)}
              className="flex items-center gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              Message Coach
            </Button>
            
            {isUpcoming && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => onJoinSession(session.id)}
                className="flex items-center gap-2"
              >
                <Video className="h-4 w-4" />
                Join Session
              </Button>
            )}

            {session.status === 'completed' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onMessageCoach(session.coach.id)}
                className="flex items-center gap-2"
              >
                <Phone className="h-4 w-4" />
                Follow Up
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

interface CoachClientDashboardProps {
  userRole: 'coach' | 'client';
  userId: string;
}

export function CoachClientDashboard({ userRole, userId }: CoachClientDashboardProps) {
  const {
    conversations,
    startConversation,
    unreadCounts,
    currentUserId,
  } = useMessaging();

  const [sessions, setSessions] = useState<any[]>([]); // Would load from sessions service
  
  // Get total unread message count
  const totalUnreadMessages = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);

  // Handle starting conversation with a user
  const handleStartConversation = useCallback(async (targetUserId: string) => {
    try {
      const conversationId = await startConversation(
        targetUserId, 
        `Hi! I wanted to follow up on our ${userRole === 'coach' ? 'session' : 'coaching session'}.`
      );
      
      if (conversationId) {
        // Navigate to messages page
        window.location.href = `/messages?conversation=${conversationId}`;
      }
    } catch (error) {
  void console.error('Failed to start conversation:', error);
    }
  }, [startConversation, userRole]);

  // Handle joining a session
  const handleJoinSession = useCallback((sessionId: string) => {
    // Would integrate with video calling system
    window.location.href = `/sessions/${sessionId}/join`;
  }, []);

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-100 rounded-lg">
              <MessageSquare className="h-5 w-5 text-brand-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Unread Messages</p>
              <p className="text-2xl font-semibold">{totalUnreadMessages}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">
                {userRole === 'coach' ? 'Upcoming Sessions' : 'Next Session'}
              </p>
              <p className="text-2xl font-semibold">
                {sessions.filter(s => new Date(s.scheduled_at) > new Date()).length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <User className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Conversations</p>
              <p className="text-2xl font-semibold">{conversations.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Sessions with Messaging Integration */}
      <Card>
        <Card.Header>
          <h2 className="text-lg font-semibold">
            {userRole === 'coach' ? 'Recent Client Sessions' : 'Recent Sessions'}
          </h2>
        </Card.Header>
        <Card.Body className="space-y-4">
          {sessions.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {userRole === 'coach' ? 'No client sessions scheduled' : 'No sessions scheduled'}
              </p>
              <Button 
                variant="primary" 
                className="mt-4"
                onClick={() => window.location.href = '/booking'}
              >
                {userRole === 'coach' ? 'View Calendar' : 'Book a Session'}
              </Button>
            </div>
          ) : (
            sessions.map((session) => (
              <CoachingSessionCard
                key={session.id}
                session={session}
                onMessageCoach={handleStartConversation}
                onJoinSession={handleJoinSession}
              />
            ))
          )}
        </Card.Body>
      </Card>

      {/* Recent Conversations */}
      <Card>
        <Card.Header>
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Recent Conversations</h2>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.href = '/messages'}
            >
              View All Messages
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          {conversations.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No recent conversations</p>
              <p className="text-sm text-gray-400 mt-2">
                Start messaging with your {userRole === 'coach' ? 'clients' : 'coach'} to build stronger relationships
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {conversations.slice(0, 3).map((conversation) => {
                const otherParticipant = conversation.participant_profiles.find(
                  p => p.id !== currentUserId
                );
                const unreadCount = unreadCounts[conversation.id] || 0;
                
                return (
                  <div 
                    key={conversation.id} 
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => window.location.href = `/messages?conversation=${conversation.id}`}
                  >
                    <Avatar
                      src={otherParticipant?.avatar_url || undefined}
                      alt={otherParticipant?.full_name || 'User'}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className="font-medium truncate">
                          {otherParticipant?.full_name || 'Unknown User'}
                        </p>
                        {unreadCount > 0 && (
                          <Badge variant="primary">{unreadCount}</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        {conversation.last_message?.content || 'No messages yet'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}

// Integration component for post-session messaging
interface PostSessionMessagingProps {
  sessionId: string;
  coachId: string;
  clientId: string;
  sessionDate: string;
  currentUserId: string;
}

export function PostSessionMessaging({
  sessionId,
  coachId,
  clientId,
  sessionDate,
  currentUserId,
}: PostSessionMessagingProps) {
  const { startConversation } = useMessaging();
  const [hasSentFollowUp, setHasSentFollowUp] = useState(false);

  const isCoach = currentUserId === coachId;
  const targetUserId = isCoach ? clientId : coachId;
  
  const handleSendFollowUp = useCallback(async () => {
    try {
      const followUpMessage = isCoach
        ? `Thank you for our session today! I've prepared some action items for you. How are you feeling about what we discussed?`
        : `Thank you for the great session today! I found our discussion about [topic] really helpful. I have a few questions about the action items you mentioned.`;

      const conversationId = await startConversation(targetUserId, followUpMessage);
      
      if (conversationId) {
        setHasSentFollowUp(true);
        // Navigate to the conversation
        window.location.href = `/messages?conversation=${conversationId}`;
      }
    } catch (error) {
  void console.error('Failed to send follow-up message:', error);
    }
  }, [startConversation, targetUserId, isCoach]);

  if (hasSentFollowUp) {
    return (
      <Card className="p-4 bg-green-50 border-green-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <MessageSquare className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="font-medium text-green-800">Follow-up message sent!</p>
            <p className="text-sm text-green-600">
              Continue the conversation in messages
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 border-brand-200">
      <div className="flex items-start gap-4">
        <div className="p-2 bg-brand-100 rounded-lg">
          <MessageSquare className="h-5 w-5 text-brand-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-brand-800">
            {isCoach ? 'Send follow-up to your client' : 'Follow up with your coach'}
          </h3>
          <p className="text-sm text-brand-600 mt-1">
            {isCoach 
              ? 'Keep the momentum going by checking in with your client about today\'s session.'
              : 'Ask questions or share insights from your session today.'
            }
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSendFollowUp}
            className="mt-3"
          >
            Send Follow-up Message
          </Button>
        </div>
      </div>
    </Card>
  );
}

// Quick message templates for coach-client communication
export const COACHING_MESSAGE_TEMPLATES = {
  coach: {
    'session-reminder': 'Hi! Just a friendly reminder about our session tomorrow at [time]. Looking forward to our conversation!',
    'session-follow-up': 'Thank you for our great session today! I\'ve attached your action items. How are you feeling about what we discussed?',
    'check-in': 'Hi! Just checking in to see how you\'re progressing with your goals from our last session. Any questions or challenges?',
    'encouragement': 'I wanted to reach out and acknowledge the progress you\'ve been making. Keep up the excellent work!',
    'resource-share': 'I found this resource that I think would be really valuable for you: [resource]. Let me know what you think!',
  },
  client: {
    'session-request': 'Hi! I\'d like to schedule our next session. Are you available [preferred time]?',
    'question': 'I have a question about something we discussed in our last session. When would be a good time to chat?',
    'progress-update': 'I wanted to update you on my progress with the goals we set. [update details]',
    'gratitude': 'Thank you for the insights from our last session. The exercise you suggested has been really helpful!',
    'challenge': 'I\'m facing a challenge with [specific area] and could use your guidance. Do you have any suggestions?',
  },
};

// Example usage component
export function MessagingIntegrationExample() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2">
          Messaging System Integration
        </h1>
        <p className="text-gray-600">
          Complete real-time messaging system integrated with coaching and booking features
        </p>
      </div>

      {/* Coach Dashboard Example */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Coach Dashboard Integration</h2>
        <CoachClientDashboard userRole="coach" userId="coach1" />
      </section>

      {/* Post-Session Integration Example */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Post-Session Messaging</h2>
        <PostSessionMessaging
          sessionId="session1"
          coachId="coach1"
          clientId="client1"
          sessionDate="2024-01-15T10:00:00Z"
          currentUserId="coach1"
        />
      </section>

      {/* Message Templates */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Message Templates</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <Card.Header>
              <h3 className="font-medium">Coach Templates</h3>
            </Card.Header>
            <Card.Body className="space-y-3">
              {Object.entries(COACHING_MESSAGE_TEMPLATES.coach).map(([key, template]) => (
                <div key={key} className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium text-sm capitalize mb-1">
                    {key.replace('-', ' ')}
                  </p>
                  <p className="text-sm text-gray-600">{template}</p>
                </div>
              ))}
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <h3 className="font-medium">Client Templates</h3>
            </Card.Header>
            <Card.Body className="space-y-3">
              {Object.entries(COACHING_MESSAGE_TEMPLATES.client).map(([key, template]) => (
                <div key={key} className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium text-sm capitalize mb-1">
                    {key.replace('-', ' ')}
                  </p>
                  <p className="text-sm text-gray-600">{template}</p>
                </div>
              ))}
            </Card.Body>
          </Card>
        </div>
      </section>
    </div>
  );
}