import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar,
  Clock,
  Video,
  FileText,
  Download,
  Star,
  MessageSquare,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  X,
  MapPin
} from 'lucide-react';
import { Container } from '../components/ui/Container';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';

const mockSessions = {
  upcoming: [
    {
      id: 1,
      coach: {
        name: 'Sarah Johnson',
        image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80',
        specialty: 'Executive Leadership Coach',
      },
      date: '2024-03-25T10:00:00Z',
      duration: 60,
      type: 'Leadership Development',
      format: 'virtual',
      status: 'confirmed',
      notes: 'Focus on communication strategies and team alignment',
      materials: [
        { name: 'Pre-session Questionnaire', type: 'pdf' },
        { name: 'Leadership Assessment', type: 'doc' },
      ],
    },
    {
      id: 2,
      coach: {
        name: 'Michael Chen',
        image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80',
        specialty: 'Career Transition Coach',
      },
      date: '2024-03-28T15:00:00Z',
      duration: 60,
      type: 'Career Planning',
      format: 'in-person',
      status: 'confirmed',
      location: 'New York Office',
      notes: 'Review career goals and action plan progress',
      materials: [
        { name: 'Career Values Worksheet', type: 'pdf' },
      ],
    },
  ],
  past: [
    {
      id: 3,
      coach: {
        name: 'Sarah Johnson',
        image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80',
        specialty: 'Executive Leadership Coach',
      },
      date: '2024-03-18T10:00:00Z',
      duration: 60,
      type: 'Leadership Development',
      format: 'virtual',
      status: 'completed',
      feedback: {
        rating: 5,
        comment: 'Excellent session! Sarah provided valuable insights and actionable strategies.',
        submitted: true,
      },
      summary: 'Discussed leadership challenges and developed communication strategies.',
      materials: [
        { name: 'Session Summary', type: 'pdf' },
        { name: 'Action Items', type: 'doc' },
      ],
    },
  ],
  canceled: [
    {
      id: 4,
      coach: {
        name: 'Michael Chen',
        image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80',
        specialty: 'Career Transition Coach',
      },
      date: '2024-03-15T14:00:00Z',
      duration: 60,
      type: 'Career Planning',
      format: 'virtual',
      status: 'canceled',
      canceledBy: 'coach',
      cancelReason: 'Unexpected emergency',
    },
  ],
};

export function MySessions() {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'canceled'>('upcoming');
  const [showFeedbackForm, setShowFeedbackForm] = useState<number | null>(null);
  const [feedbackData, setFeedbackData] = useState({
    rating: 5,
    comment: '',
  });

  const handleSubmitFeedback = async (sessionId: number) => {
    try {
      // Here you would typically submit the feedback to your backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      setShowFeedbackForm(null);
      // Optionally update the local state or refetch sessions
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  const handleReschedule = async (sessionId: number) => {
    // Here you would typically navigate to the booking page with pre-filled data
    // navigate(`/booking?reschedule=${sessionId}`);
  };

  const handleCancel = async (sessionId: number) => {
    // Here you would typically show a confirmation dialog and handle cancellation
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Container>
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Sessions</h1>
            <p className="text-gray-600">
              Manage your coaching sessions and track your progress
            </p>
          </div>
          <Button
            variant="gradient"
            href="/booking"
            icon={<Calendar className="h-5 w-5" />}
          >
            Book New Session
          </Button>
        </div>

        {/* Session Tabs */}
        <div className="flex gap-4 mb-6">
          <Button
            variant={activeTab === 'upcoming' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('upcoming')}
          >
            Upcoming ({mockSessions.upcoming.length})
          </Button>
          <Button
            variant={activeTab === 'past' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('past')}
          >
            Past ({mockSessions.past.length})
          </Button>
          <Button
            variant={activeTab === 'canceled' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('canceled')}
          >
            Canceled ({mockSessions.canceled.length})
          </Button>
        </div>

        {/* Session List */}
        <div className="space-y-6">
          {activeTab === 'upcoming' && mockSessions.upcoming.map((session) => (
            <Card key={session.id}>
              <Card.Body className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Coach Info */}
                  <div className="md:w-1/4">
                    <div className="flex items-center gap-4">
                      <Avatar
                        src={session.coach.image}
                        alt={session.coach.name}
                        size="lg"
                      />
                      <div>
                        <h3 className="font-semibold">{session.coach.name}</h3>
                        <p className="text-sm text-gray-600">
                          {session.coach.specialty}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Session Details */}
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <Badge variant="default">{session.type}</Badge>
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {new Date(session.date).toLocaleDateString('en-US', {
                                weekday: 'long',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Clock className="h-4 w-4" />
                            <span>
                              {new Date(session.date).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: 'numeric',
                              })}
                              {' • '}
                              {session.duration} minutes
                            </span>
                          </div>
                          {session.format === 'virtual' ? (
                            <div className="flex items-center gap-2 text-gray-600">
                              <Video className="h-4 w-4" />
                              <span>Virtual Session</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-gray-600">
                              <MapPin className="h-4 w-4" />
                              <span>{session.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReschedule(session.id)}
                        >
                          Reschedule
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => handleCancel(session.id)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>

                    {/* Session Materials */}
                    {session.materials && session.materials.length > 0 && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-500" />
                          Session Materials
                        </h4>
                        <div className="flex gap-2">
                          {session.materials.map((material, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              size="sm"
                              icon={<Download className="h-4 w-4" />}
                            >
                              {material.name}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Session Notes */}
                    {session.notes && (
                      <div className="mt-4">
                        <h4 className="font-medium mb-2">Session Notes</h4>
                        <p className="text-gray-600">{session.notes}</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                      <Button
                        variant="outline"
                        icon={<MessageSquare className="h-4 w-4" />}
                      >
                        Message Coach
                      </Button>
                      {session.format === 'virtual' && (
                        <Button
                          variant="gradient"
                          icon={<Video className="h-4 w-4" />}
                        >
                          Join Session
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          ))}

          {activeTab === 'past' && mockSessions.past.map((session) => (
            <Card key={session.id}>
              <Card.Body className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Coach Info */}
                  <div className="md:w-1/4">
                    <div className="flex items-center gap-4">
                      <Avatar
                        src={session.coach.image}
                        alt={session.coach.name}
                        size="lg"
                      />
                      <div>
                        <h3 className="font-semibold">{session.coach.name}</h3>
                        <p className="text-sm text-gray-600">
                          {session.coach.specialty}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Session Details */}
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <Badge variant="default">{session.type}</Badge>
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {new Date(session.date).toLocaleDateString('en-US', {
                                weekday: 'long',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Clock className="h-4 w-4" />
                            <span>
                              {new Date(session.date).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: 'numeric',
                              })}
                              {' • '}
                              {session.duration} minutes
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Session Summary */}
                    {session.summary && (
                      <div className="mt-4">
                        <h4 className="font-medium mb-2">Session Summary</h4>
                        <p className="text-gray-600">{session.summary}</p>
                      </div>
                    )}

                    {/* Session Materials */}
                    {session.materials && session.materials.length > 0 && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-500" />
                          Session Materials
                        </h4>
                        <div className="flex gap-2">
                          {session.materials.map((material, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              size="sm"
                              icon={<Download className="h-4 w-4" />}
                            >
                              {material.name}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Feedback */}
                    <div className="mt-4 pt-4 border-t">
                      {session.feedback?.submitted ? (
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium mb-1">Your Feedback</h4>
                            <div className="flex items-center gap-2">
                              {[...Array(session.feedback.rating)].map((_, i) => (
                                <Star
                                  key={i}
                                  className="h-4 w-4 text-yellow-400 fill-current"
                                />
                              ))}
                            </div>
                            <p className="text-gray-600 mt-2">
                              {session.feedback.comment}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowFeedbackForm(session.id)}
                          >
                            Edit Feedback
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-gray-600">
                            <AlertCircle className="h-5 w-5" />
                            <span>Feedback not submitted</span>
                          </div>
                          <Button
                            variant="gradient"
                            size="sm"
                            onClick={() => setShowFeedbackForm(session.id)}
                            icon={<Star className="h-4 w-4" />}
                          >
                            Give Feedback
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          ))}

          {activeTab === 'canceled' && mockSessions.canceled.map((session) => (
            <Card key={session.id}>
              <Card.Body className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Coach Info */}
                  <div className="md:w-1/4">
                    <div className="flex items-center gap-4">
                      <Avatar
                        src={session.coach.image}
                        alt={session.coach.name}
                        size="lg"
                      />
                      <div>
                        <h3 className="font-semibold">{session.coach.name}</h3>
                        <p className="text-sm text-gray-600">
                          {session.coach.specialty}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Session Details */}
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <Badge variant="error">Canceled</Badge>
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {new Date(session.date).toLocaleDateString('en-US', {
                                weekday: 'long',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Clock className="h-4 w-4" />
                            <span>
                              {new Date(session.date).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: 'numeric',
                              })}
                              {' • '}
                              {session.duration} minutes
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 p-4 bg-red-50 rounded-lg">
                      <div className="flex items-center gap-2 text-red-600">
                        <AlertCircle className="h-5 w-5" />
                        <div>
                          <p className="font-medium">
                            Canceled by {session.canceledBy}
                          </p>
                          <p className="text-sm mt-1">{session.cancelReason}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end mt-4 pt-4 border-t">
                      <Button
                        variant="gradient"
                        href={`/booking?coach=${session.coach.id}`}
                        icon={<Calendar className="h-4 w-4" />}
                      >
                        Reschedule Session
                      </Button>
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          ))}

          {/* Empty State */}
          {((activeTab === 'upcoming' && mockSessions.upcoming.length === 0) ||
            (activeTab === 'past' && mockSessions.past.length === 0) ||
            (activeTab === 'canceled' && mockSessions.canceled.length === 0)) && (
            <Card>
              <Card.Body className="py-12">
                <div className="text-center">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No {activeTab} sessions
                  </h3>
                  {activeTab === 'upcoming' && (
                    <>
                      <p className="text-gray-600 mb-6">
                        Book your first coaching session to get started
                      </p>
                      <Button
                        variant="gradient"
                        href="/booking"
                        icon={<Calendar className="h-5 w-5" />}
                      >
                        Book a Session
                      </Button>
                    </>
                  )}
                </div>
              </Card.Body>
            </Card>
          )}
        </div>
      </Container>

      {/* Feedback Modal */}
      {showFeedbackForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4"
          >
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-semibold">Session Feedback</h3>
              <button
                onClick={() => setShowFeedbackForm(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block font-medium mb-2">Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        onClick={() => setFeedbackData(prev => ({ ...prev, rating }))}
                        className={`p-2 rounded-lg ${
                          feedbackData.rating >= rating
                            ? 'text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      >
                        <Star className="h-6 w-6 fill-current" />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block font-medium mb-2">Comments</label>
                  <textarea
                    value={feedbackData.comment}
                    onChange={(e) => setFeedbackData(prev => ({ ...prev, comment: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                    rows={4}
                    placeholder="Share your thoughts about the session..."
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 p-6 border-t bg-gray-50 rounded-b-xl">
              <Button
                variant="outline"
                onClick={() => setShowFeedbackForm(null)}
              >
                Cancel
              </Button>
              <Button
                variant="gradient"
                onClick={() => handleSubmitFeedback(showFeedbackForm)}
                icon={<CheckCircle className="h-5 w-5" />}
              >
                Submit Feedback
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}