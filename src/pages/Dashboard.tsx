import React from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar,
  Clock,
  Target,
  BookOpen,
  TrendingUp,
  Award,
  ChevronRight,
  Video,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  FileText,
  Download
} from 'lucide-react';
import { Container } from '../components/ui/Container';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';

const mockUser = {
  firstName: 'Jennifer',
  lastName: 'Thompson',
  email: 'jennifer@example.com',
  profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80',
  profileCompletion: 85,
  goals: [
    {
      id: 1,
      title: 'Leadership Development',
      progress: 60,
      milestones: [
        { title: 'Complete Leadership Assessment', completed: true },
        { title: 'Develop Communication Strategy', completed: true },
        { title: 'Team Building Workshop', completed: false },
        { title: 'Executive Presence Training', completed: false },
      ],
    },
    {
      id: 2,
      title: 'Work-Life Balance',
      progress: 40,
      milestones: [
        { title: 'Time Management Assessment', completed: true },
        { title: 'Stress Reduction Plan', completed: true },
        { title: 'Boundary Setting Workshop', completed: false },
        { title: 'Wellness Integration', completed: false },
      ],
    },
  ],
  upcomingSessions: [
    {
      id: 1,
      coach: {
        name: 'Sarah Johnson',
        image: 'https://images.unsplash.com/photo-1573496799652-408c2ac9fe98?auto=format&fit=crop&q=80',
        specialty: 'Executive Leadership Coach',
      },
      date: '2024-03-20T10:00:00Z',
      duration: 60,
      type: 'Leadership Development',
      materials: [
        { title: 'Pre-session Questionnaire', type: 'pdf' },
        { title: 'Leadership Style Assessment', type: 'doc' },
      ],
    },
    {
      id: 2,
      coach: {
        name: 'Michael Chen',
        image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80',
        specialty: 'Life Balance Coach',
      },
      date: '2024-03-25T15:00:00Z',
      duration: 60,
      type: 'Work-Life Balance',
      materials: [
        { title: 'Time Management Template', type: 'pdf' },
        { title: 'Weekly Planning Guide', type: 'doc' },
      ],
    },
  ],
  recentActivity: [
    {
      id: 1,
      type: 'session',
      title: 'Completed coaching session with Sarah Johnson',
      date: '2024-03-15T14:00:00Z',
    },
    {
      id: 2,
      type: 'community',
      title: 'Posted in "Leadership Challenges" discussion',
      date: '2024-03-14T09:30:00Z',
    },
    {
      id: 3,
      type: 'milestone',
      title: 'Completed "Communication Strategy" milestone',
      date: '2024-03-13T16:45:00Z',
    },
  ],
  recommendedResources: [
    {
      id: 1,
      type: 'article',
      title: '5 Strategies for Effective Leadership Communication',
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80',
      readTime: '8 min read',
    },
    {
      id: 2,
      type: 'video',
      title: 'Mastering Work-Life Balance in the Digital Age',
      image: 'https://images.unsplash.com/photo-1590650153855-d9e808231d41?auto=format&fit=crop&q=80',
      duration: '12 min',
    },
    {
      id: 3,
      type: 'worksheet',
      title: 'Time Management Matrix Template',
      description: 'Prioritize tasks and manage your time effectively',
    },
  ],
  suggestedCoaches: [
    {
      id: 1,
      name: 'Emily Rodriguez',
      image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80',
      specialty: 'Career Development Coach',
      matchPercentage: 95,
      reasons: ['Leadership expertise', 'Industry background', 'Communication style'],
    },
    {
      id: 2,
      name: 'David Kim',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80',
      specialty: 'Executive Coach',
      matchPercentage: 90,
      reasons: ['Change management focus', 'Strategic planning', 'Similar clients'],
    },
  ],
};

export function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Container>
        {/* Welcome Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {mockUser.firstName}!
            </h1>
            <p className="text-gray-600">
              Your next coaching session is in{' '}
              <span className="font-semibold text-brand-600">2 days</span>
            </p>
          </div>
          <div className="text-right">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-brand-500 to-blue-500 flex items-center justify-center text-white font-semibold">
                {mockUser.profileCompletion}%
              </div>
              <div className="text-sm">
                <p className="font-medium">Profile Completion</p>
                <a href="/profile" className="text-brand-600 hover:underline">
                  Complete Profile
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Upcoming Sessions */}
            <Card>
              <Card.Header>
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Upcoming Sessions</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    href="/sessions"
                    className="text-brand-600"
                  >
                    View All
                  </Button>
                </div>
              </Card.Header>
              <Card.Body>
                <div className="space-y-6">
                  {mockUser.upcomingSessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex gap-6 p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-shrink-0">
                        <img
                          src={session.coach.image}
                          alt={session.coach.name}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold mb-1">
                              {session.type} with {session.coach.name}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2">
                              {session.coach.specialty}
                            </p>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {new Date(session.date).toLocaleDateString('en-US', {
                                  weekday: 'long',
                                  month: 'long',
                                  day: 'numeric',
                                })}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {new Date(session.date).toLocaleTimeString('en-US', {
                                  hour: 'numeric',
                                  minute: 'numeric',
                                })}
                              </span>
                              <span className="flex items-center gap-1">
                                <Video className="h-4 w-4" />
                                {session.duration} min
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              Reschedule
                            </Button>
                            <Button variant="primary" size="sm">
                              Join Call
                            </Button>
                          </div>
                        </div>
                        {session.materials.length > 0 && (
                          <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
                            <h4 className="text-sm font-medium mb-2">
                              Pre-session Materials
                            </h4>
                            <div className="flex gap-2">
                              {session.materials.map((material, index) => (
                                <Button
                                  key={index}
                                  variant="ghost"
                                  size="sm"
                                  className="text-brand-600"
                                  icon={<Download className="h-4 w-4" />}
                                >
                                  {material.title}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>

            {/* Goals Tracker */}
            <Card>
              <Card.Header>
                <h2 className="text-xl font-semibold">Goals Progress</h2>
              </Card.Header>
              <Card.Body>
                <div className="space-y-6">
                  {mockUser.goals.map((goal) => (
                    <div key={goal.id}>
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-medium">{goal.title}</h3>
                        <span className="text-sm text-gray-600">
                          {goal.progress}% Complete
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full mb-4">
                        <div
                          className="h-full bg-gradient-to-r from-brand-500 to-blue-500 rounded-full"
                          style={{ width: `${goal.progress}%` }}
                        />
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        {goal.milestones.map((milestone, index) => (
                          <div
                            key={index}
                            className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                          >
                            <div
                              className={`p-1 rounded-full ${
                                milestone.completed
                                  ? 'bg-green-100 text-green-600'
                                  : 'bg-gray-100 text-gray-400'
                              }`}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </div>
                            <span
                              className={
                                milestone.completed
                                  ? 'text-gray-900'
                                  : 'text-gray-500'
                              }
                            >
                              {milestone.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>

            {/* Recent Activity */}
            <Card>
              <Card.Header>
                <h2 className="text-xl font-semibold">Recent Activity</h2>
              </Card.Header>
              <Card.Body>
                <div className="space-y-4">
                  {mockUser.recentActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg"
                    >
                      <div
                        className={`p-2 rounded-lg ${
                          activity.type === 'session'
                            ? 'bg-blue-100 text-blue-600'
                            : activity.type === 'community'
                            ? 'bg-purple-100 text-purple-600'
                            : 'bg-green-100 text-green-600'
                        }`}
                      >
                        {activity.type === 'session' ? (
                          <Video className="h-5 w-5" />
                        ) : activity.type === 'community' ? (
                          <MessageSquare className="h-5 w-5" />
                        ) : (
                          <Target className="h-5 w-5" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{activity.title}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(activity.date).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Coach Matches */}
            <Card>
              <Card.Header>
                <h2 className="text-xl font-semibold">Recommended Coaches</h2>
              </Card.Header>
              <Card.Body className="space-y-6">
                {mockUser.suggestedCoaches.map((coach) => (
                  <div key={coach.id} className="space-y-4">
                    <div className="flex items-center gap-4">
                      <img
                        src={coach.image}
                        alt={coach.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold">{coach.name}</h3>
                        <p className="text-sm text-gray-600">{coach.specialty}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="success">
                            {coach.matchPercentage}% Match
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {coach.reasons.map((reason, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 text-sm text-gray-600"
                        >
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>{reason}</span>
                        </div>
                      ))}
                    </div>
                    <Button
                      href={`/coaches/${coach.id}`}
                      variant="outline"
                      className="w-full"
                    >
                      View Profile
                    </Button>
                  </div>
                ))}
              </Card.Body>
            </Card>

            {/* Resources */}
            <Card>
              <Card.Header>
                <h2 className="text-xl font-semibold">Recommended Resources</h2>
              </Card.Header>
              <Card.Body className="space-y-4">
                {mockUser.recommendedResources.map((resource) => (
                  <div
                    key={resource.id}
                    className="group cursor-pointer hover:bg-gray-50 p-3 -mx-3 rounded-lg transition-colors"
                  >
                    {resource.type !== 'worksheet' && (
                      <div className="relative mb-3 rounded-lg overflow-hidden">
                        <img
                          src={resource.image}
                          alt={resource.title}
                          className="w-full h-32 object-cover"
                        />
                        {resource.type === 'video' && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <Video className="h-8 w-8 text-white" />
                          </div>
                        )}
                      </div>
                    )}
                    <h3 className="font-medium group-hover:text-brand-600 transition-colors">
                      {resource.title}
                    </h3>
                    {resource.type === 'worksheet' ? (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                        <FileText className="h-4 w-4" />
                        <span>{resource.description}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                        {resource.type === 'article' ? (
                          <BookOpen className="h-4 w-4" />
                        ) : (
                          <Video className="h-4 w-4" />
                        )}
                        <span>
                          {resource.type === 'article'
                            ? resource.readTime
                            : resource.duration}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </Card.Body>
            </Card>
          </div>
        </div>
      </Container>
    </div>
  );
}