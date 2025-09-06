import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  Edit3,
  MessageCircle,
  MoreHorizontal,
  Star,
  Trash2,
  User,
  Video,
  XCircle
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { type BookingFilters, bookingService, type SessionWithDetails } from '../../services/booking.service';
import { authService } from '../../services/auth.service';
import { addDays, format, isPast, isToday, isTomorrow } from 'date-fns';

interface SessionManagerProps {
  view?: 'upcoming' | 'past' | 'all';
  userRole?: 'client' | 'coach';
  onSessionSelect?: (session: SessionWithDetails) => void;
}

interface SessionCardProps {
  session: SessionWithDetails;
  userRole: 'client' | 'coach';
  onAction: (action: string, session: SessionWithDetails) => void;
}

const SessionCard: React.FC<SessionCardProps> = ({ session, userRole, onAction }) => {
  const sessionDate = new Date(session.scheduled_at);
  const isSessionToday = isToday(sessionDate);
  const isSessionTomorrow = isTomorrow(sessionDate);
  const isSessionPast = isPast(sessionDate);
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'rescheduled': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTimeLabel = () => {
    if (isSessionToday) return 'Today';
    if (isSessionTomorrow) return 'Tomorrow';
    if (isPast(sessionDate)) return 'Past';
    return format(sessionDate, 'MMM d');
  };

  const canJoinSession = () => {
    const now = new Date();
    const sessionStart = new Date(session.scheduled_at);
    const sessionEnd = new Date(sessionStart.getTime() + session.duration_minutes * 60000);
    const joinWindow = 15 * 60 * 1000; // 15 minutes before

    return (
      session.status === 'scheduled' &&
      session.meeting_url &&
      now >= new Date(sessionStart.getTime() - joinWindow) &&
      now <= sessionEnd
    );
  };

  const otherUser = userRole === 'client' ? session.coach : session.client;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow"
    >
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <Badge className={getStatusColor(session.status)}>
                {session.status === 'scheduled' ? 'Scheduled' :
                 session.status === 'completed' ? 'Completed' :
                 session.status === 'cancelled' ? 'Cancelled' :
                 'Rescheduled'}
              </Badge>
              
              {isSessionToday && session.status === 'scheduled' && (
                <Badge variant="success">
                  {getTimeLabel()}
                </Badge>
              )}
              
              {isSessionTomorrow && session.status === 'scheduled' && (
                <Badge variant="warning">
                  {getTimeLabel()}
                </Badge>
              )}
            </div>

            <h3 className="text-lg font-semibold mb-2">
              {session.session_type?.name || 'Coaching Session'}
            </h3>

            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>
                  {format(sessionDate, 'EEEE, MMMM d, yyyy')}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>
                  {format(sessionDate, 'h:mm a')} ({session.duration_minutes} min)
                </span>
              </div>

              {otherUser && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>
                    {userRole === 'client' ? 'Coach: ' : 'Client: '}
                    {otherUser.full_name || 'User'}
                  </span>
                </div>
              )}

              {session.notes && (
                <div className="flex items-start gap-2">
                  <MessageCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-2">{session.notes}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 ml-4">
            {/* Join Session Button */}
            {canJoinSession() && (
              <Button
                variant="gradient"
                size="sm"
                onClick={() => onAction('join', session)}
                className="flex items-center gap-2"
              >
                <Video className="h-4 w-4" />
                Join Session
              </Button>
            )}

            {/* Action Menu */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAction('menu', session)}
                className="p-2"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4 pt-4 border-t">
          {session.status === 'scheduled' && !isSessionPast && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAction('reschedule', session)}
                className="flex items-center gap-1"
              >
                <Edit3 className="h-3 w-3" />
                Reschedule
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAction('cancel', session)}
                className="flex items-center gap-1 text-red-600 border-red-200 hover:bg-red-50"
              >
                <XCircle className="h-3 w-3" />
                Cancel
              </Button>
            </>
          )}

          {session.status === 'completed' && (
            <>
              {userRole === 'client' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAction('feedback', session)}
                  className="flex items-center gap-1"
                >
                  <Star className="h-3 w-3" />
                  Leave Feedback
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAction('download', session)}
                className="flex items-center gap-1"
              >
                <Download className="h-3 w-3" />
                Session Summary
              </Button>
            </>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAction('details', session)}
            className="ml-auto"
          >
            View Details
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export function SessionManager({ 
  view = 'upcoming',
  userRole,
  onSessionSelect 
}: SessionManagerProps) {
  const [sessions, setSessions] = useState<SessionWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [selectedView, setSelectedView] = useState(view);
  const [currentUserRole, setCurrentUserRole] = useState<'client' | 'coach'>(userRole || 'client');

  useEffect(() => {
    // Determine user role from auth state
    const authState = authService.getState();
    if (authState.role === 'coach') {
      setCurrentUserRole('coach');
    }
    
    loadSessions();
  }, [selectedView]);

  const loadSessions = async () => {
    setLoading(true);
    setError('');

    try {
      const filters: BookingFilters = {};
      
      switch (selectedView) {
        case 'upcoming':
          filters.upcoming = true;
          break;
        case 'past':
          filters.past = true;
          break;
        case 'all':
          // No additional filters
          break;
      }

      const result = await bookingService.getUserSessions(filters, {
        limit: 50,
        orderBy: 'scheduled_at',
        orderDirection: selectedView === 'past' ? 'desc' : 'asc'
      });

      if (result.error) {
        setError(result.error.message);
      } else {
        setSessions(result.data?.data || []);
      }
    } catch (err) {
      setError('Failed to load sessions. Please try again.');
      console.error('Error loading sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSessionAction = async (action: string, session: SessionWithDetails) => {
    switch (action) {
      case 'join':
        if (session.meeting_url) {
          window.open(session.meeting_url, '_blank');
        }
        break;
        
      case 'reschedule':
        // Open reschedule modal/flow
        console.log('Reschedule session:', session.id);
        break;
        
      case 'cancel':
        // Open cancel confirmation modal
        if (confirm('Are you sure you want to cancel this session?')) {
          try {
            const result = await bookingService.cancelSession({
              sessionId: session.id,
              reason: 'Cancelled by user',
              requestRefund: true
            });
            
            if (result.error) {
              alert(result.error.message);
            } else {
              loadSessions(); // Reload sessions
            }
          } catch (err) {
            alert('Failed to cancel session. Please try again.');
          }
        }
        break;
        
      case 'feedback':
        // Open feedback modal
        console.log('Leave feedback for session:', session.id);
        break;
        
      case 'download':
        // Download session summary
        console.log('Download summary for session:', session.id);
        break;
        
      case 'details':
        if (onSessionSelect) {
          onSessionSelect(session);
        }
        break;
    }
  };

  const getViewCounts = () => {
    const now = new Date();
    const upcoming = sessions.filter(s => 
      new Date(s.scheduled_at) > now && s.status === 'scheduled'
    ).length;
    
    const past = sessions.filter(s => 
      new Date(s.scheduled_at) <= now || s.status === 'completed'
    ).length;

    return { upcoming, past, all: sessions.length };
  };

  const counts = getViewCounts();

  return (
    <div className="space-y-6">
      {/* View Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit">
        {[
          { key: 'upcoming', label: 'Upcoming', count: counts.upcoming },
          { key: 'past', label: 'Past', count: counts.past },
          { key: 'all', label: 'All Sessions', count: counts.all }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setSelectedView(tab.key as any)}
            className={`
              px-4 py-2 rounded-md font-medium text-sm transition-all
              ${selectedView === tab.key
                ? 'bg-white shadow-sm text-brand-600'
                : 'text-gray-600 hover:text-gray-800'
              }
            `}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`
                ml-2 px-2 py-0.5 rounded-full text-xs
                ${selectedView === tab.key
                  ? 'bg-brand-100 text-brand-700'
                  : 'bg-gray-200 text-gray-600'
                }
              `}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-red-800">Error Loading Sessions</h3>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
          <Button 
            onClick={loadSessions}
            variant="outline"
            size="sm"
            className="ml-auto"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-500 border-t-transparent"></div>
          <span className="ml-3 text-gray-600">Loading sessions...</span>
        </div>
      )}

      {/* Sessions List */}
      {!loading && !error && (
        <AnimatePresence mode="wait">
          {sessions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No {selectedView === 'upcoming' ? 'upcoming' : selectedView === 'past' ? 'past' : ''} sessions
              </h3>
              <p className="text-gray-600 mb-6">
                {selectedView === 'upcoming' 
                  ? "You don't have any upcoming sessions scheduled."
                  : selectedView === 'past'
                  ? "You haven't completed any sessions yet."
                  : "You don't have any sessions."
                }
              </p>
              {selectedView === 'upcoming' && (
                <Button variant="gradient">
                  Book a Session
                </Button>
              )}
            </motion.div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  userRole={currentUserRole}
                  onAction={handleSessionAction}
                />
              ))}
            </div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}

export default SessionManager;