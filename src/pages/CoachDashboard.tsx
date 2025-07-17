import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp,
  Users,
  Star,
  DollarSign,
  Calendar,
  Clock,
  FileText,
  MessageSquare,
  Eye,
  Search,
  MousePointer,
  BarChart,
  Edit,
  Plus,
  ChevronRight,
  BookOpen,
  ThumbsUp
} from 'lucide-react';
import { Container } from '../components/ui/Container';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';

const mockData = {
  coach: {
    name: 'Sarah Johnson',
    image: 'https://images.unsplash.com/photo-1573496799652-408c2ac9fe98?auto=format&fit=crop&q=80',
    specialty: 'Executive Leadership Coach',
  },
  performance: {
    bookingRate: 85,
    clientRetention: 92,
    rating: 4.9,
    reviewCount: 127,
    earnings: {
      current: 12500,
      previous: 10800,
      growth: 15.7,
    },
  },
  upcomingSessions: [
    {
      id: 1,
      client: {
        name: 'Michael Chen',
        image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80',
        company: 'Tech Innovations Inc.',
      },
      date: '2024-03-20T10:00:00Z',
      duration: 60,
      type: 'Leadership Development',
      notes: 'Focus on communication strategies and team alignment',
    },
    {
      id: 2,
      client: {
        name: 'Emily Rodriguez',
        image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80',
        company: 'Global Solutions Ltd.',
      },
      date: '2024-03-20T14:00:00Z',
      duration: 60,
      type: 'Career Transition',
      notes: 'Review career goals and action plan progress',
    },
  ],
  activeClients: [
    {
      id: 1,
      name: 'Michael Chen',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80',
      company: 'Tech Innovations Inc.',
      startDate: '2024-01-15',
      sessionCount: 8,
      nextSession: '2024-03-20T10:00:00Z',
      goals: [
        { title: 'Improve team communication', progress: 75 },
        { title: 'Develop leadership style', progress: 60 },
      ],
      recentNotes: 'Making excellent progress on communication objectives. Team feedback is positive.',
    },
    {
      id: 2,
      name: 'Emily Rodriguez',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80',
      company: 'Global Solutions Ltd.',
      startDate: '2024-02-01',
      sessionCount: 5,
      nextSession: '2024-03-20T14:00:00Z',
      goals: [
        { title: 'Career transition strategy', progress: 40 },
        { title: 'Personal branding', progress: 55 },
      ],
      recentNotes: 'Successfully identified target roles and companies. Working on networking strategy.',
    },
  ],
  analytics: {
    profileViews: {
      current: 450,
      previous: 380,
      growth: 18.4,
    },
    searchAppearances: {
      current: 1200,
      previous: 950,
      growth: 26.3,
    },
    clickRate: {
      current: 15.2,
      previous: 12.8,
      growth: 18.8,
    },
    conversionRate: {
      current: 8.5,
      previous: 7.2,
      growth: 18.1,
    },
  },
  content: [
    {
      id: 1,
      title: 'Building Resilient Leadership in Uncertain Times',
      type: 'article',
      status: 'published',
      publishDate: '2024-03-01',
      views: 1250,
      engagement: 85,
    },
    {
      id: 2,
      title: 'Effective Communication Strategies for Remote Teams',
      type: 'video',
      status: 'published',
      publishDate: '2024-02-15',
      views: 850,
      engagement: 92,
    },
    {
      id: 3,
      title: 'Personal Growth Framework for Leaders',
      type: 'worksheet',
      status: 'draft',
      lastEdited: '2024-03-15',
    },
  ],
};

export function CoachDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Container>
        {/* Welcome Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {mockData.coach.name}!
            </h1>
            <p className="text-gray-600">
              You have {mockData.upcomingSessions.length} sessions scheduled for today
            </p>
          </div>
          <Button
            variant="gradient"
            size="lg"
            href="/profile/edit"
            icon={<Edit className="h-5 w-5" />}
          >
            Edit Profile
          </Button>
        </div>

        {/* Performance Overview */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card hover>
            <Card.Body className="text-center">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div className="text-2xl font-bold mb-1">{mockData.performance.bookingRate}%</div>
              <div className="text-gray-600">Booking Rate</div>
              <div className="text-sm text-green-600 mt-2">↑ 12% from last month</div>
            </Card.Body>
          </Card>

          <Card hover>
            <Card.Body className="text-center">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6" />
              </div>
              <div className="text-2xl font-bold mb-1">{mockData.performance.clientRetention}%</div>
              <div className="text-gray-600">Client Retention</div>
              <div className="text-sm text-green-600 mt-2">↑ 5% from last month</div>
            </Card.Body>
          </Card>

          <Card hover>
            <Card.Body className="text-center">
              <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="h-6 w-6" />
              </div>
              <div className="text-2xl font-bold mb-1">{mockData.performance.rating}</div>
              <div className="text-gray-600">Average Rating</div>
              <div className="text-sm text-gray-600 mt-2">
                {mockData.performance.reviewCount} reviews
              </div>
            </Card.Body>
          </Card>

          <Card hover>
            <Card.Body className="text-center">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="h-6 w-6" />
              </div>
              <div className="text-2xl font-bold mb-1">
                ${mockData.performance.earnings.current.toLocaleString()}
              </div>
              <div className="text-gray-600">Monthly Earnings</div>
              <div className="text-sm text-green-600 mt-2">
                ↑ {mockData.performance.earnings.growth}% from last month
              </div>
            </Card.Body>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Upcoming Sessions */}
            <Card>
              <Card.Header>
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Today's Sessions</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    href="/calendar"
                    className="text-brand-600"
                  >
                    View Calendar
                  </Button>
                </div>
              </Card.Header>
              <Card.Body>
                <div className="space-y-6">
                  {mockData.upcomingSessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex gap-6 p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-shrink-0">
                        <img
                          src={session.client.image}
                          alt={session.client.name}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold mb-1">
                              {session.client.name}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2">
                              {session.client.company}
                            </p>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {new Date(session.date).toLocaleTimeString('en-US', {
                                  hour: 'numeric',
                                  minute: 'numeric',
                                })}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {session.duration} min
                              </span>
                            </div>
                          </div>
                          <Badge variant="default">{session.type}</Badge>
                        </div>
                        <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
                          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                            <FileText className="h-4 w-4 text-gray-500" />
                            Session Notes
                          </h4>
                          <p className="text-sm text-gray-600">{session.notes}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>

            {/* Client Management */}
            <Card>
              <Card.Header>
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Active Clients</h2>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<Plus className="h-4 w-4" />}
                    >
                      Add Client
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      href="/clients"
                      className="text-brand-600"
                    >
                      View All
                    </Button>
                  </div>
                </div>
              </Card.Header>
              <Card.Body>
                <div className="space-y-8">
                  {mockData.activeClients.map((client) => (
                    <div key={client.id} className="space-y-4">
                      <div className="flex items-start gap-4">
                        <img
                          src={client.image}
                          alt={client.name}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold">{client.name}</h3>
                              <p className="text-sm text-gray-600">
                                {client.company}
                              </p>
                              <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                                <span>Client since {new Date(client.startDate).toLocaleDateString()}</span>
                                <span>{client.sessionCount} sessions completed</span>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              icon={<MessageSquare className="h-4 w-4" />}
                            >
                              Message
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {client.goals.map((goal, index) => (
                          <div key={index}>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm font-medium">
                                {goal.title}
                              </span>
                              <span className="text-sm text-gray-600">
                                {goal.progress}%
                              </span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full">
                              <div
                                className="h-full bg-gradient-to-r from-brand-500 to-blue-500 rounded-full"
                                style={{ width: `${goal.progress}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="p-3 bg-gray-50 rounded-lg">
                        <h4 className="text-sm font-medium mb-2">Recent Notes</h4>
                        <p className="text-sm text-gray-600">{client.recentNotes}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Profile Analytics */}
            <Card>
              <Card.Header>
                <h2 className="text-xl font-semibold">Profile Analytics</h2>
              </Card.Header>
              <Card.Body className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                        <Eye className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-semibold">
                          {mockData.analytics.profileViews.current}
                        </div>
                        <div className="text-sm text-gray-600">Profile Views</div>
                      </div>
                    </div>
                    <div className="text-sm text-green-600">
                      ↑ {mockData.analytics.profileViews.growth}%
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                        <Search className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-semibold">
                          {mockData.analytics.searchAppearances.current}
                        </div>
                        <div className="text-sm text-gray-600">
                          Search Appearances
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-green-600">
                      ↑ {mockData.analytics.searchAppearances.growth}%
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                        <MousePointer className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-semibold">
                          {mockData.analytics.clickRate.current}%
                        </div>
                        <div className="text-sm text-gray-600">Click Rate</div>
                      </div>
                    </div>
                    <div className="text-sm text-green-600">
                      ↑ {mockData.analytics.clickRate.growth}%
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                        <BarChart className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-semibold">
                          {mockData.analytics.conversionRate.current}%
                        </div>
                        <div className="text-sm text-gray-600">
                          Conversion Rate
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-green-600">
                      ↑ {mockData.analytics.conversionRate.growth}%
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* Content Management */}
            <Card>
              <Card.Header>
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Content</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<Plus className="h-4 w-4" />}
                  >
                    Create New
                  </Button>
                </div>
              </Card.Header>
              <Card.Body className="space-y-4">
                {mockData.content.map((item) => (
                  <div
                    key={item.id}
                    className="group cursor-pointer hover:bg-gray-50 p-3 -mx-3 rounded-lg transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          item.type === 'article'
                            ? 'bg-blue-100 text-blue-600'
                            : item.type === 'video'
                            ? 'bg-purple-100 text-purple-600'
                            : 'bg-green-100 text-green-600'
                        }`}
                      >
                        {item.type === 'article' ? (
                          <BookOpen className="h-5 w-5" />
                        ) : item.type === 'video' ? (
                          <Video className="h-5 w-5" />
                        ) : (
                          <FileText className="h-5 w-5" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium group-hover:text-brand-600 transition-colors">
                          {item.title}
                        </h3>
                        <div className="flex items-center gap-4 mt-1">
                          <Badge
                            variant={item.status === 'published' ? 'success' : 'default'}
                          >
                            {item.status}
                          </Badge>
                          {item.status === 'published' ? (
                            <>
                              <span className="text-sm text-gray-600">
                                {item.views} views
                              </span>
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <ThumbsUp className="h-4 w-4" />
                                <span>{item.engagement}%</span>
                              </div>
                            </>
                          ) : (
                            <span className="text-sm text-gray-600">
                              Last edited{' '}
                              {new Date(item.lastEdited).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-brand-600 transition-colors" />
                    </div>
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