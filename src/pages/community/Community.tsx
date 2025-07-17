import React from 'react';
import { motion } from 'framer-motion';
import { 
  MessageSquare, 
  Users, 
  TrendingUp, 
  Calendar,
  Search,
  Plus,
  ChevronRight,
  Heart,
  MessageCircle,
  UserPlus
} from 'lucide-react';
import { Container } from '../../components/ui/Container';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';

const mockData = {
  featuredDiscussions: [
    {
      id: 1,
      title: 'Transitioning from Corporate to Entrepreneurship',
      author: {
        name: 'Emily Chen',
        image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80',
      },
      category: 'Career Development',
      replies: 24,
      likes: 156,
      lastActive: '2024-03-19T14:00:00Z',
    },
    {
      id: 2,
      title: 'Building Resilience in Leadership',
      author: {
        name: 'Marcus Johnson',
        image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80',
      },
      category: 'Leadership',
      replies: 18,
      likes: 92,
      lastActive: '2024-03-19T12:30:00Z',
    },
  ],
  activeGroups: [
    {
      id: 1,
      name: 'Executive Leadership Network',
      members: 1250,
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80',
      description: 'A community for executive leaders to share insights and experiences',
      activity: 'High',
    },
    {
      id: 2,
      name: 'Work-Life Balance Champions',
      members: 850,
      image: 'https://images.unsplash.com/photo-1590650153855-d9e808231d41?auto=format&fit=crop&q=80',
      description: 'Discussions and strategies for maintaining work-life harmony',
      activity: 'Medium',
    },
  ],
  trendingTopics: [
    {
      name: 'Remote Leadership',
      posts: 156,
      trend: 'up',
    },
    {
      name: 'Career Transition',
      posts: 142,
      trend: 'up',
    },
    {
      name: 'Work-Life Balance',
      posts: 128,
      trend: 'up',
    },
  ],
  newMembers: [
    {
      id: 1,
      name: 'Sarah Miller',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80',
      title: 'Marketing Director',
      joinDate: '2024-03-19T10:00:00Z',
    },
    {
      id: 2,
      name: 'David Kim',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80',
      title: 'Tech Entrepreneur',
      joinDate: '2024-03-19T09:30:00Z',
    },
  ],
};

export function Community() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Container>
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Community</h1>
            <p className="text-gray-600">
              Connect, share, and grow with fellow professionals
            </p>
          </div>
          <div className="flex gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search discussions..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <Button
              variant="gradient"
              icon={<Plus className="h-5 w-5" />}
            >
              Start Discussion
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Featured Discussions */}
            <Card>
              <Card.Header>
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Featured Discussions</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    href="/community/discussions"
                    className="text-brand-600"
                  >
                    View All
                  </Button>
                </div>
              </Card.Header>
              <Card.Body>
                <div className="space-y-6">
                  {mockData.featuredDiscussions.map((discussion) => (
                    <div
                      key={discussion.id}
                      className="flex gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <Avatar
                        src={discussion.author.image}
                        alt={discussion.author.name}
                        size="lg"
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold hover:text-brand-600">
                              <a href={`/community/discussions/${discussion.id}`}>
                                {discussion.title}
                              </a>
                            </h3>
                            <p className="text-sm text-gray-600">
                              Started by {discussion.author.name}
                            </p>
                          </div>
                          <Badge variant="default">
                            {discussion.category}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-4 w-4" />
                            {discussion.replies} replies
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="h-4 w-4" />
                            {discussion.likes} likes
                          </span>
                          <span>
                            Active {new Date(discussion.lastActive).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>

            {/* Active Groups */}
            <Card>
              <Card.Header>
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Active Groups</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    href="/community/groups"
                    className="text-brand-600"
                  >
                    View All
                  </Button>
                </div>
              </Card.Header>
              <Card.Body>
                <div className="grid sm:grid-cols-2 gap-4">
                  {mockData.activeGroups.map((group) => (
                    <div
                      key={group.id}
                      className="group cursor-pointer"
                    >
                      <Card hover>
                        <img
                          src={group.image}
                          alt={group.name}
                          className="w-full h-32 object-cover rounded-t-xl"
                        />
                        <Card.Body>
                          <h3 className="font-semibold group-hover:text-brand-600">
                            {group.name}
                          </h3>
                          <p className="text-sm text-gray-600 mb-3">
                            {group.description}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">
                              {group.members.toLocaleString()} members
                            </span>
                            <Badge
                              variant={
                                group.activity === 'High'
                                  ? 'success'
                                  : 'default'
                              }
                            >
                              {group.activity} Activity
                            </Badge>
                          </div>
                        </Card.Body>
                      </Card>
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Trending Topics */}
            <Card>
              <Card.Header>
                <h2 className="text-xl font-semibold">Trending Topics</h2>
              </Card.Header>
              <Card.Body>
                <div className="space-y-4">
                  {mockData.trendingTopics.map((topic, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <div>
                        <h3 className="font-medium">#{topic.name}</h3>
                        <p className="text-sm text-gray-600">
                          {topic.posts} posts
                        </p>
                      </div>
                      <TrendingUp className="h-5 w-5 text-green-500" />
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>

            {/* New Members */}
            <Card>
              <Card.Header>
                <h2 className="text-xl font-semibold">Welcome New Members</h2>
              </Card.Header>
              <Card.Body>
                <div className="space-y-4">
                  {mockData.newMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <Avatar
                        src={member.image}
                        alt={member.name}
                        size="md"
                      />
                      <div className="flex-1">
                        <h3 className="font-medium">{member.name}</h3>
                        <p className="text-sm text-gray-600">{member.title}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<UserPlus className="h-4 w-4" />}
                      >
                        Follow
                      </Button>
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>

            {/* Quick Links */}
            <Card>
              <Card.Body>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    href="/community/events"
                    icon={<Calendar className="h-5 w-5" />}
                  >
                    Upcoming Events
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    href="/community/groups"
                    icon={<Users className="h-5 w-5" />}
                  >
                    Browse Groups
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    href="/community/discussions"
                    icon={<MessageCircle className="h-5 w-5" />}
                  >
                    All Discussions
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </div>
        </div>
      </Container>
    </div>
  );
}