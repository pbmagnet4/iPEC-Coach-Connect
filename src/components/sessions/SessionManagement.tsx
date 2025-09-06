/**
 * Session Management Component for iPEC Coach Connect
 * 
 * Comprehensive session management system that handles booking, scheduling,
 * cancellation, and session lifecycle management for both clients and coaches.
 * Integrates with the unified user store for real-time state management.
 * 
 * Features:
 * - Session booking and scheduling
 * - Calendar integration and availability management
 * - Session status tracking and updates
 * - Video call integration and session materials
 * - Payment processing and billing
 * - Review and feedback system
 * - Multi-timezone support
 * - Real-time notifications and reminders
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  Bell,
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
  Download,
  Edit,
  Eye,
  FileText,
  Filter,
  Mail,
  MapPin,
  MessageSquare,
  MoreVertical,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Star,
  Trash2,
  Upload,
  User,
  Video,
  XCircle
} from 'lucide-react';
import { 
  useAuth, 
  useClientProfile, 
  useDashboardMetrics,
  useUserRoles 
} from '../../stores/unified-user-store';
import { ExtendedUserRole } from '../../services/enhanced-auth.service';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { TextArea } from '../ui/TextArea';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { Modal } from '../ui/Modal';
import { Table } from '../ui/Table';
import { Tooltip } from '../ui/Tooltip';
import { toast } from '../ui/Toast';
import { Tabs } from '../ui/Tabs';
import { EnhancedRoleGuard } from '../auth/EnhancedRoleGuard';

// =====================================================================
// TYPES AND INTERFACES
// =====================================================================

interface SessionParticipant {
  id: string;
  user_id: string;
  name: string;
  email: string;
  avatar_url?: string;
  role: 'coach' | 'client';
  specialties?: string[];
  location?: string;
}

interface SessionMaterial {
  id: string;
  name: string;
  type: 'pdf' | 'doc' | 'video' | 'audio' | 'image' | 'link';
  url?: string;
  file_size?: number;
  uploaded_at: string;
  uploaded_by: string;
}

interface Session {
  id: string;
  coach: SessionParticipant;
  client: SessionParticipant;
  title: string;
  description?: string;
  scheduled_at: string;
  duration_minutes: number;
  session_type: 'initial' | 'follow_up' | 'goal_review' | 'intensive' | 'group';
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  meeting_link?: string;
  meeting_id?: string;
  location_type: 'video' | 'phone' | 'in_person';
  location_details?: string;
  price_cents?: number;
  currency?: string;
  payment_status?: 'pending' | 'paid' | 'refunded' | 'failed';
  materials?: SessionMaterial[];
  notes?: string;
  coach_notes?: string;
  client_feedback?: {
    rating: number;
    comment?: string;
    submitted_at: string;
  };
  coach_feedback?: {
    rating: number;
    comment?: string;
    submitted_at: string;
  };
  created_at: string;
  updated_at: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  timezone: string;
}

interface SessionFilters {
  status?: Session['status'][];
  dateRange?: {
    start: Date;
    end: Date;
  };
  sessionType?: Session['session_type'];
  search?: string;
  participantId?: string;
}

interface BookingRequest {
  coachId: string;
  clientId: string;
  scheduledAt: string;
  durationMinutes: number;
  sessionType: Session['session_type'];
  locationType: Session['location_type'];
  title?: string;
  description?: string;
  locationDetails?: string;
  timezone: string;
}

// =====================================================================
// SESSION DATA HOOKS
// =====================================================================

const useSessionManagement = () => {
  const { user } = useAuth();
  const { hasRole } = useUserRoles();
  
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = async (filters?: SessionFilters) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // This would fetch from Supabase
      // For now, using mock data structure
      const mockSessions: Session[] = [
        {
          id: '1',
          coach: {
            id: 'coach1',
            user_id: 'user1',
            name: 'Sarah Johnson',
            email: 'sarah@example.com',
            avatar_url: 'https://images.unsplash.com/photo-1573496799652-408c2ac9fe98?auto=format&fit=crop&q=80',
            role: 'coach',
            specialties: ['Leadership Development', 'Executive Coaching'],
            location: 'New York, NY'
          },
          client: {
            id: 'client1',
            user_id: user?.id || 'user2',
            name: user?.display_name || user?.full_name || 'John Doe',
            email: user?.email || 'john@example.com',
            avatar_url: user?.avatar_url,
            role: 'client'
          },
          title: 'Leadership Development Session',
          description: 'Focus on building executive presence and communication skills',
          scheduled_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          duration_minutes: 60,
          session_type: 'follow_up',
          status: 'confirmed',
          meeting_link: 'https://zoom.us/j/123456789',
          meeting_id: '123 456 789',
          location_type: 'video',
          price_cents: 15000,
          currency: 'USD',
          payment_status: 'paid',
          materials: [
            {
              id: '1',
              name: 'Pre-session Assessment',
              type: 'pdf',
              uploaded_at: new Date().toISOString(),
              uploaded_by: 'coach1'
            },
            {
              id: '2',
              name: 'Leadership Style Guide',
              type: 'doc',
              uploaded_at: new Date().toISOString(),
              uploaded_by: 'coach1'
            }
          ],
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
          timezone: 'America/New_York'
        },
        {
          id: '2',
          coach: {
            id: 'coach2',
            user_id: 'user3',
            name: 'Michael Chen',
            email: 'michael@example.com',
            avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80',
            role: 'coach',
            specialties: ['Career Development', 'Work-Life Balance'],
            location: 'San Francisco, CA'
          },
          client: {
            id: 'client1',
            user_id: user?.id || 'user2',
            name: user?.display_name || user?.full_name || 'John Doe',
            email: user?.email || 'john@example.com',
            avatar_url: user?.avatar_url,
            role: 'client'
          },
          title: 'Career Planning Session',
          description: 'Setting 2024 career goals and development plan',
          scheduled_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          duration_minutes: 90,
          session_type: 'initial',
          status: 'completed',
          location_type: 'video',
          price_cents: 20000,
          currency: 'USD',
          payment_status: 'paid',
          client_feedback: {
            rating: 5,
            comment: 'Excellent session! Very insightful and actionable advice.',
            submitted_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
          },
          created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          timezone: 'America/Los_Angeles'
        }
      ];

      // Apply filters
      let filteredSessions = mockSessions;
      
      if (filters?.status && filters.status.length > 0) {
        filteredSessions = filteredSessions.filter(session => 
          filters.status!.includes(session.status)
        );
      }
      
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        filteredSessions = filteredSessions.filter(session =>
          session.title.toLowerCase().includes(searchLower) ||
          session.description?.toLowerCase().includes(searchLower) ||
          session.coach.name.toLowerCase().includes(searchLower) ||
          session.client.name.toLowerCase().includes(searchLower)
        );
      }
      
      if (filters?.sessionType) {
        filteredSessions = filteredSessions.filter(session =>
          session.session_type === filters.sessionType
        );
      }

      setSessions(filteredSessions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sessions');
    } finally {
      setIsLoading(false);
    }
  };

  const bookSession = async (request: BookingRequest): Promise<Session> => {
    try {
      // This would call Supabase API
      const newSession: Session = {
        id: Date.now().toString(),
        coach: {
          id: request.coachId,
          user_id: request.coachId,
          name: 'Coach Name', // Would be fetched
          email: 'coach@example.com',
          role: 'coach'
        },
        client: {
          id: request.clientId,
          user_id: request.clientId,
          name: user?.display_name || user?.full_name || 'Client Name',
          email: user?.email || 'client@example.com',
          avatar_url: user?.avatar_url,
          role: 'client'
        },
        title: request.title || 'Coaching Session',
        description: request.description,
        scheduled_at: request.scheduledAt,
        duration_minutes: request.durationMinutes,
        session_type: request.sessionType,
        status: 'scheduled',
        location_type: request.locationType,
        location_details: request.locationDetails,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        timezone: request.timezone
      };

      setSessions(prev => [newSession, ...prev]);
      toast.success('Session booked successfully!');
      return newSession;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to book session';
      toast.error(error);
      throw new Error(error);
    }
  };

  const updateSession = async (sessionId: string, updates: Partial<Session>) => {
    try {
      setSessions(prev => prev.map(session =>
        session.id === sessionId
          ? { ...session, ...updates, updated_at: new Date().toISOString() }
          : session
      ));
      toast.success('Session updated successfully!');
    } catch (err) {
      toast.error('Failed to update session');
      throw err;
    }
  };

  const cancelSession = async (sessionId: string, reason: string) => {
    try {
      await updateSession(sessionId, {
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason
      });
      toast.success('Session cancelled successfully');
    } catch (err) {
      toast.error('Failed to cancel session');
      throw err;
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  return {
    sessions,
    isLoading,
    error,
    fetchSessions,
    bookSession,
    updateSession,
    cancelSession
  };
};

// =====================================================================
// SESSION BOOKING MODAL
// =====================================================================

const SessionBookingModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onBook: (request: BookingRequest) => Promise<void>;
  preSelectedCoach?: SessionParticipant;
}> = ({ isOpen, onClose, onBook, preSelectedCoach }) => {
  const { user } = useAuth();
  
  const [formData, setFormData] = useState<Partial<BookingRequest>>({
    coachId: preSelectedCoach?.id || '',
    clientId: user?.id || '',
    durationMinutes: 60,
    sessionType: 'initial',
    locationType: 'video',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.coachId) newErrors.coachId = 'Please select a coach';
    if (!formData.scheduledAt) newErrors.scheduledAt = 'Please select a date and time';
    if (!formData.durationMinutes || formData.durationMinutes < 30) {
      newErrors.durationMinutes = 'Duration must be at least 30 minutes';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !formData.scheduledAt) return;

    setIsSubmitting(true);
    try {
      await onBook(formData as BookingRequest);
      onClose();
      // Reset form
      setFormData({
        coachId: preSelectedCoach?.id || '',
        clientId: user?.id || '',
        durationMinutes: 60,
        sessionType: 'initial',
        locationType: 'video',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      });
    } catch (error) {
      // Error handled in parent
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Book Coaching Session" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Coach
            </label>
            <Select
              value={formData.coachId}
              onChange={(value) => setFormData(prev => ({ ...prev, coachId: value }))}
              error={errors.coachId}
              required
            >
              <option value="">Select a coach...</option>
              {preSelectedCoach && (
                <option value={preSelectedCoach.id}>{preSelectedCoach.name}</option>
              )}
              {/* Would be populated from API */}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Session Type
            </label>
            <Select
              value={formData.sessionType}
              onChange={(value) => setFormData(prev => ({ 
                ...prev, 
                sessionType: value as Session['session_type'] 
              }))}
              required
            >
              <option value="initial">Initial Session</option>
              <option value="follow_up">Follow-up Session</option>
              <option value="goal_review">Goal Review</option>
              <option value="intensive">Intensive Session</option>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date & Time
            </label>
            <Input
              type="datetime-local"
              value={formData.scheduledAt}
              onChange={(e) => setFormData(prev => ({ ...prev, scheduledAt: e.target.value }))}
              error={errors.scheduledAt}
              min={new Date().toISOString().slice(0, 16)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duration (minutes)
            </label>
            <Select
              value={formData.durationMinutes?.toString()}
              onChange={(value) => setFormData(prev => ({ 
                ...prev, 
                durationMinutes: parseInt(value) 
              }))}
              error={errors.durationMinutes}
              required
            >
              <option value="30">30 minutes</option>
              <option value="60">60 minutes</option>
              <option value="90">90 minutes</option>
              <option value="120">120 minutes</option>
            </Select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Session Title
          </label>
          <Input
            value={formData.title || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="e.g., Leadership Development Session"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Session Description
          </label>
          <TextArea
            value={formData.description || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="What would you like to focus on in this session?"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Meeting Type
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 'video', icon: Video, label: 'Video Call' },
              { value: 'phone', icon: Phone, label: 'Phone Call' },
              { value: 'in_person', icon: MapPin, label: 'In Person' }
            ].map(option => {
              const Icon = option.icon;
              const isSelected = formData.locationType === option.value;
              
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ 
                    ...prev, 
                    locationType: option.value as Session['location_type'] 
                  }))}
                  className={`p-3 border rounded-lg text-center transition-colors ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5 mx-auto mb-1" />
                  <div className="text-sm">{option.label}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
            Book Session
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// =====================================================================
// SESSION CARD COMPONENT
// =====================================================================

const SessionCard: React.FC<{
  session: Session;
  onUpdate: (sessionId: string, updates: Partial<Session>) => Promise<void>;
  onCancel: (sessionId: string, reason: string) => Promise<void>;
  userRole: 'coach' | 'client';
}> = ({ session, onUpdate, onCancel, userRole }) => {
  const [showActions, setShowActions] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit'
      })
    };
  };

  const getStatusColor = (status: Session['status']) => {
    const colors = {
      scheduled: 'blue',
      confirmed: 'green',
      in_progress: 'yellow',
      completed: 'green',
      cancelled: 'red',
      no_show: 'red'
    };
    return colors[status] || 'gray';
  };

  const participant = userRole === 'coach' ? session.client : session.coach;
  const formatted = formatDate(session.scheduled_at);

  const handleCancel = async () => {
    if (cancelReason.trim()) {
      await onCancel(session.id, cancelReason);
      setShowCancelModal(false);
      setCancelReason('');
    }
  };

  return (
    <>
      <Card className="hover:shadow-md transition-all duration-200">
        <Card.Body className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <Avatar
                src={participant.avatar_url}
                alt={participant.name}
                fallback={participant.name.charAt(0)}
              />
              <div>
                <h3 className="font-semibold text-gray-900">{session.title}</h3>
                <p className="text-sm text-gray-600">
                  with {participant.name}
                  {participant.specialties && (
                    <span className="text-gray-500">
                      {' • '}{participant.specialties[0]}
                    </span>
                  )}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant={getStatusColor(session.status) as any}>
                {session.status.replace('_', ' ')}
              </Badge>
              
              <div className="relative">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowActions(!showActions)}
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
                
                {showActions && (
                  <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg py-1 z-10">
                    <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      View Details
                    </button>
                    {session.status === 'scheduled' && (
                      <button
                        onClick={() => setShowCancelModal(true)}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"
                      >
                        <XCircle className="w-4 h-4" />
                        Cancel Session
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatted.date}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatted.time}
              </div>
              <div className="flex items-center gap-1">
                {session.location_type === 'video' ? <Video className="w-4 h-4" /> :
                 session.location_type === 'phone' ? <Phone className="w-4 h-4" /> :
                 <MapPin className="w-4 h-4" />}
                {session.duration_minutes} min
              </div>
            </div>
            
            {session.description && (
              <p className="text-sm text-gray-700 line-clamp-2">
                {session.description}
              </p>
            )}
            
            {session.materials && session.materials.length > 0 && (
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {session.materials.length} material{session.materials.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
          
          <div className="mt-4 flex gap-2">
            {session.status === 'scheduled' && (
              <Button size="sm" variant="primary">
                <Video className="w-4 h-4 mr-2" />
                Join Session
              </Button>
            )}
            
            {session.status === 'completed' && !session.client_feedback && userRole === 'client' && (
              <Button size="sm" variant="outline">
                <Star className="w-4 h-4 mr-2" />
                Rate Session
              </Button>
            )}
            
            <Button size="sm" variant="outline">
              <MessageSquare className="w-4 h-4 mr-2" />
              Message
            </Button>
          </div>
        </Card.Body>
      </Card>

      {/* Cancel Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancel Session"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to cancel this session? This action cannot be undone.
          </p>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for cancellation
            </label>
            <TextArea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Please provide a reason for cancelling..."
              rows={3}
              required
            />
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowCancelModal(false)}
              className="flex-1"
            >
              Keep Session
            </Button>
            <Button
              variant="danger"
              onClick={handleCancel}
              disabled={!cancelReason.trim()}
              className="flex-1"
            >
              Cancel Session
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

// =====================================================================
// MAIN COMPONENT
// =====================================================================

export const SessionManagement: React.FC = () => {
  const { user } = useAuth();
  const { hasRole, primaryRole } = useUserRoles();
  const {
    sessions,
    isLoading,
    error,
    fetchSessions,
    bookSession,
    updateSession,
    cancelSession
  } = useSessionManagement();

  const [filters, setFilters] = useState<SessionFilters>({
    status: undefined,
    search: ''
  });
  
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'upcoming' | 'past' | 'all'>('upcoming');

  // Filter sessions based on current tab
  const filteredSessions = useMemo(() => {
    const now = new Date();
    let filtered = sessions;

    switch (selectedTab) {
      case 'upcoming':
        filtered = sessions.filter(session => 
          new Date(session.scheduled_at) > now &&
          ['scheduled', 'confirmed'].includes(session.status)
        );
        break;
      case 'past':
        filtered = sessions.filter(session => 
          new Date(session.scheduled_at) < now ||
          ['completed', 'cancelled', 'no_show'].includes(session.status)
        );
        break;
      case 'all':
      default:
        filtered = sessions;
        break;
    }

    // Apply additional filters
    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter(session => 
        filters.status!.includes(session.status)
      );
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(session =>
        session.title.toLowerCase().includes(searchLower) ||
        session.coach.name.toLowerCase().includes(searchLower) ||
        session.client.name.toLowerCase().includes(searchLower)
      );
    }

    return filtered.sort((a, b) => 
      new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime()
    );
  }, [sessions, selectedTab, filters]);

  // Determine user role for session display
  const userRole: 'coach' | 'client' = hasRole('coach') ? 'coach' : 'client';

  const handleBookSession = async (request: BookingRequest) => {
    await bookSession(request);
  };

  if (error) {
    return (
      <Card>
        <Card.Body className="text-center p-8">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Sessions</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => fetchSessions()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </Card.Body>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Session Management</h2>
          <p className="text-gray-600">
            {userRole === 'coach' 
              ? 'Manage your coaching sessions and client appointments'
              : 'View and manage your coaching sessions'
            }
          </p>
        </div>
        
        <EnhancedRoleGuard roles={['client']}>
          <Button onClick={() => setIsBookingModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Book Session
          </Button>
        </EnhancedRoleGuard>
      </div>

      {/* Tabs and Filters */}
      <Card>
        <Card.Body className="p-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Tabs */}
            <Tabs
              value={selectedTab}
              onValueChange={(value) => setSelectedTab(value as typeof selectedTab)}
              className="w-full lg:w-auto"
            >
              <Tabs.List>
                <Tabs.Trigger value="upcoming">Upcoming</Tabs.Trigger>
                <Tabs.Trigger value="past">Past</Tabs.Trigger>
                <Tabs.Trigger value="all">All Sessions</Tabs.Trigger>
              </Tabs.List>
            </Tabs>
            
            {/* Filters */}
            <div className="flex gap-3">
              <Input
                placeholder="Search sessions..."
                value={filters.search || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-64"
              />
              
              <Select
                value=""
                onChange={(value) => {
                  if (value) {
                    setFilters(prev => ({
                      ...prev,
                      status: [value as Session['status']]
                    }));
                  } else {
                    setFilters(prev => ({ ...prev, status: undefined }));
                  }
                }}
                placeholder="Filter by status"
              >
                <option value="">All Statuses</option>
                <option value="scheduled">Scheduled</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </Select>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Sessions List */}
      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" />
          <span>Loading sessions...</span>
        </div>
      ) : filteredSessions.length > 0 ? (
        <div className="grid gap-4">
          {filteredSessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onUpdate={updateSession}
              onCancel={cancelSession}
              userRole={userRole}
            />
          ))}
        </div>
      ) : (
        <Card>
          <Card.Body className="text-center p-12">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              No sessions found
            </h3>
            <p className="text-gray-600 mb-6">
              {selectedTab === 'upcoming' 
                ? "You don't have any upcoming sessions scheduled."
                : selectedTab === 'past'
                ? "You don't have any past sessions to display."
                : "You haven't scheduled any sessions yet."
              }
            </p>
            
            <EnhancedRoleGuard roles={['client']}>
              <Button onClick={() => setIsBookingModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Book Your First Session
              </Button>
            </EnhancedRoleGuard>
          </Card.Body>
        </Card>
      )}

      {/* Session Booking Modal */}
      <SessionBookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        onBook={handleBookSession}
      />
    </div>
  );
};

export default SessionManagement;