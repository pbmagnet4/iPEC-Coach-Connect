/**
 * Enhanced Community Component for iPEC Coach Connect
 * 
 * Authentication-aware community hub that provides differentiated experiences
 * based on user authentication state and role. Seamlessly transitions between
 * viewing and participating modes.
 * 
 * Features:
 * - Progressive disclosure based on authentication state
 * - Role-based action availability (client, coach, admin)
 * - Inline authentication prompts that don't disrupt browsing
 * - Real-time updates for authenticated users
 * - Mobile-optimized interaction patterns
 * - SEO-friendly public content for discoverability
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  UserPlus,
  Filter,
  Star
} from 'lucide-react';
import { Container } from '../../components/ui/Container';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { AuthPrompt } from '../../components/community/AuthPrompt';
import { 
  ConditionalAction, 
  ProgressiveContent, 
  AuthAwareBanner,
  useAuthAwareActions 
} from '../../components/community/AuthAwareWrapper';
import { useUnifiedUserStore } from '../../stores/unified-user-store';

// Enhanced mock data with authentication-aware features
const mockData = {
  featuredDiscussions: [
    {
      id: 1,
      title: 'Transitioning from Corporate to Entrepreneurship',
      author: {
        name: 'Emily Chen',
        image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80',
        role: 'Executive Coach',
        isVerified: true,
      },
      category: 'Career Development',
      replies: 24,
      likes: 156,
      lastActive: '2024-03-19T14:00:00Z',
      excerpt: 'After 10 years in corporate marketing, I\'ve decided to take the leap into entrepreneurship...',
      isLiked: false,
      isFollowing: false,
      tags: ['entrepreneurship', 'career-transition', 'leadership'],
    },
    {
      id: 2,
      title: 'Building Resilience in Leadership',
      author: {
        name: 'Marcus Johnson',
        image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80',
        role: 'Leadership Coach',
        isVerified: true,
      },
      category: 'Leadership',
      replies: 18,
      likes: 92,
      lastActive: '2024-03-19T12:30:00Z',
      excerpt: 'Resilience is not just bouncing back, it\'s about growing through challenges...',
      isLiked: false,
      isFollowing: false,
      tags: ['resilience', 'leadership', 'personal-growth'],
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
      isJoined: false,
      recentActivity: 'New discussion 2 hours ago',
      memberSample: [
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80',
      ],
    },
    {
      id: 2,
      name: 'Work-Life Balance Champions',
      members: 850,
      image: 'https://images.unsplash.com/photo-1590650153855-d9e808231d41?auto=format&fit=crop&q=80',
      description: 'Discussions and strategies for maintaining work-life harmony',
      activity: 'Medium',
      isJoined: false,
      recentActivity: 'New member joined 1 hour ago',
      memberSample: [
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80',
      ],
    },
  ],
  trendingTopics: [
    {
      name: 'Remote Leadership',
      posts: 156,
      trend: 'up',
      growth: '+12%',
    },
    {
      name: 'Career Transition',
      posts: 142,
      trend: 'up',
      growth: '+8%',
    },
    {
      name: 'Work-Life Balance',
      posts: 128,
      trend: 'up',
      growth: '+15%',
    },
  ],
  upcomingEvents: [
    {
      id: 1,
      title: 'Leadership Summit 2024',
      date: '2024-03-25T09:00:00Z',
      type: 'in-person',
      attendees: 89,
      location: 'New York City',
      image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80',
      isRegistered: false,
    },
    {
      id: 2,
      title: 'Virtual Networking Session',
      date: '2024-03-22T19:00:00Z',
      type: 'virtual',
      attendees: 156,
      isRegistered: false,
    },
  ],
  newMembers: [
    {
      id: 1,
      name: 'Sarah Miller',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80',
      title: 'Marketing Director',
      joinDate: '2024-03-19T10:00:00Z',
      mutual_connections: 3,
    },
    {
      id: 2,
      name: 'David Kim',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80',
      title: 'Tech Entrepreneur',
      joinDate: '2024-03-19T09:30:00Z',
      mutual_connections: 1,
    },
  ],
};

export function EnhancedCommunity() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  
  const { 
    isAuthenticated, 
    isLoading, 
    primaryRole,
    canPerformAction 
  } = useAuthAwareActions();
  
  const profile = useUnifiedUserStore(state => state.profile);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Container>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Authentication-aware banner */}
          <motion.div variants={itemVariants} className="mb-8">
            <AuthAwareBanner />
          </motion.div>

          {/* Header */}
          <motion.div 
            variants={itemVariants}
            className="flex flex-col lg:flex-row lg:justify-between lg:items-start mb-8 gap-4"
          >
            <div>
              <h1 className="text-3xl font-bold mb-2">Community</h1>
              <p className="text-gray-600">
                Connect, share, and grow with fellow professionals
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search discussions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 min-w-[250px]"
                />
              </div>
              
              {/* Create Discussion Button - Authentication Aware */}
              <ConditionalAction
                authAction="create"
                promptStyle="inline"
                promptContext="a new discussion"
                replaceWithPrompt={!isAuthenticated}
              >
                <Button
                  variant="gradient"
                  icon={<Plus className="h-5 w-5" />}
                  onClick={() => console.log('Create discussion')}
                >
                  Start Discussion
                </Button>
              </ConditionalAction>
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Featured Discussions */}
              <motion.div variants={itemVariants}>
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
                      <AnimatePresence>
                        {mockData.featuredDiscussions.map((discussion) => (
                          <motion.div
                            key={discussion.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="group"
                          >
                            <div className="flex gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                              <Avatar
                                src={discussion.author.image}
                                alt={discussion.author.name}
                                size="lg"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold hover:text-brand-600 group-hover:text-brand-600 transition-colors">
                                      <a href={`/community/discussions/${discussion.id}`}>
                                        {discussion.title}
                                      </a>
                                    </h3>
                                    <div className="flex items-center gap-2 mt-1">
                                      <p className="text-sm text-gray-600">
                                        by {discussion.author.name}
                                      </p>
                                      {discussion.author.isVerified && (
                                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                                      )}
                                      <span className="text-sm text-gray-400">•</span>
                                      <span className="text-sm text-gray-600">
                                        {discussion.author.role}
                                      </span>
                                    </div>
                                    
                                    {/* Progressive Content - Show excerpt only to authenticated users */}
                                    <ProgressiveContent
                                      authenticatedContent={
                                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                                          {discussion.excerpt}
                                        </p>
                                      }
                                    />
                                    
                                    {/* Tags */}
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {discussion.tags.map((tag) => (
                                        <Badge key={tag} variant="secondary" className="text-xs">
                                          #{tag}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                  
                                  <Badge variant="default" className="flex-shrink-0">
                                    {discussion.category}
                                  </Badge>
                                </div>
                                
                                {/* Interaction Bar */}
                                <div className="flex items-center justify-between mt-4">
                                  <div className="flex items-center gap-4 text-sm text-gray-600">
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
                                  
                                  {/* Authentication-aware interaction buttons */}
                                  <div className="flex items-center gap-2">
                                    <ConditionalAction
                                      authAction="like"
                                      promptStyle="inline"
                                      promptContext="this discussion"
                                    >
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => console.log('Like discussion')}
                                        className="text-gray-600 hover:text-red-500"
                                      >
                                        <Heart className="h-4 w-4" />
                                      </Button>
                                    </ConditionalAction>
                                    
                                    <ConditionalAction
                                      authAction="follow"
                                      promptStyle="inline"
                                      promptContext={discussion.author.name}
                                    >
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => console.log('Follow author')}
                                        className="text-gray-600 hover:text-brand-500"
                                      >
                                        <UserPlus className="h-4 w-4" />
                                      </Button>
                                    </ConditionalAction>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </Card.Body>
                </Card>
              </motion.div>

              {/* Active Groups */}
              <motion.div variants={itemVariants}>
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
                        <motion.div
                          key={group.id}
                          whileHover={{ scale: 1.02 }}
                          className="group cursor-pointer"
                        >
                          <Card hover>
                            <img
                              src={group.image}
                              alt={group.name}
                              className="w-full h-32 object-cover rounded-t-xl"
                            />
                            <Card.Body>
                              <h3 className="font-semibold group-hover:text-brand-600 transition-colors mb-2">
                                {group.name}
                              </h3>
                              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                {group.description}
                              </p>
                              
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-sm text-gray-600 flex items-center gap-1">
                                  <Users className="h-4 w-4" />
                                  {group.members.toLocaleString()} members
                                </span>
                                <Badge
                                  variant={group.activity === 'High' ? 'success' : 'default'}
                                >
                                  {group.activity} Activity
                                </Badge>
                              </div>
                              
                              {/* Member avatars */}
                              <div className="flex items-center justify-between">
                                <div className="flex -space-x-2">
                                  {group.memberSample.map((avatar, index) => (
                                    <Avatar
                                      key={index}
                                      src={avatar}
                                      alt={`Member ${index + 1}`}
                                      size="sm"
                                      className="border-2 border-white"
                                    />
                                  ))}
                                </div>
                                
                                <ConditionalAction
                                  authAction="join"
                                  promptStyle="inline"
                                  promptContext={group.name}
                                  replaceWithPrompt={!isAuthenticated}
                                >
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => console.log('Join group')}
                                  >
                                    Join
                                  </Button>
                                </ConditionalAction>
                              </div>
                              
                              <p className="text-xs text-gray-500 mt-2">
                                {group.recentActivity}
                              </p>
                            </Card.Body>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </Card.Body>
                </Card>
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Trending Topics */}
              <motion.div variants={itemVariants}>
                <Card>
                  <Card.Header>
                    <h2 className="text-xl font-semibold">Trending Topics</h2>
                  </Card.Header>
                  <Card.Body>
                    <div className="space-y-4">
                      {mockData.trendingTopics.map((topic, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <div>
                            <h3 className="font-medium">#{topic.name}</h3>
                            <p className="text-sm text-gray-600">
                              {topic.posts} posts
                            </p>
                          </div>
                          <div className="text-right">
                            <TrendingUp className="h-5 w-5 text-green-500 mb-1" />
                            <span className="text-xs text-green-600">
                              {topic.growth}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card.Body>
                </Card>
              </motion.div>

              {/* Upcoming Events */}
              <motion.div variants={itemVariants}>
                <Card>
                  <Card.Header>
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-semibold">Upcoming Events</h2>
                      <Button
                        variant="ghost"
                        size="sm"
                        href="/community/events"
                        className="text-brand-600"
                      >
                        View All
                      </Button>
                    </div>
                  </Card.Header>
                  <Card.Body>
                    <div className="space-y-4">
                      {mockData.upcomingEvents.map((event) => (
                        <div
                          key={event.id}
                          className="p-3 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          <h3 className="font-medium mb-1">{event.title}</h3>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(event.date).toLocaleDateString()}</span>
                            <Badge 
                              variant={event.type === 'virtual' ? 'secondary' : 'default'}
                              className="text-xs"
                            >
                              {event.type}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">
                              {event.attendees} attending
                            </span>
                            
                            <ConditionalAction
                              authAction="rsvp"
                              promptStyle="inline"
                              promptContext={event.title}
                              replaceWithPrompt={!isAuthenticated}
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => console.log('RSVP to event')}
                              >
                                RSVP
                              </Button>
                            </ConditionalAction>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card.Body>
                </Card>
              </motion.div>

              {/* New Members - Only show to authenticated users */}
              <ProgressiveContent
                authenticatedContent={
                  <motion.div variants={itemVariants}>
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
                                {member.mutual_connections > 0 && (
                                  <p className="text-xs text-brand-600">
                                    {member.mutual_connections} mutual connections
                                  </p>
                                )}
                              </div>
                              <ConditionalAction
                                authAction="follow"
                                promptStyle="inline"
                                promptContext={member.name}
                              >
                                <Button
                                  variant="outline"
                                  size="sm"
                                  icon={<UserPlus className="h-4 w-4" />}
                                  onClick={() => console.log('Follow member')}
                                >
                                  Follow
                                </Button>
                              </ConditionalAction>
                            </div>
                          ))}
                        </div>
                      </Card.Body>
                    </Card>
                  </motion.div>
                }
              />

              {/* Quick Links */}
              <motion.div variants={itemVariants}>
                <Card>
                  <Card.Body>
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        className="w-full justify-between"
                        href="/community/events"
                        icon={<Calendar className="h-5 w-5" />}
                      >
                        Browse Events
                        <ChevronRight className="h-5 w-5" />
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-between"
                        href="/community/groups"
                        icon={<Users className="h-5 w-5" />}
                      >
                        Explore Groups
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
                      
                      {/* Coach-specific actions */}
                      <ProgressiveContent
                        roleBasedContent={[
                          {
                            roles: ['coach', 'admin', 'moderator'],
                            content: (
                              <Button
                                variant="outline"
                                className="w-full justify-between"
                                href="/community/events/create"
                                icon={<Plus className="h-5 w-5" />}
                              >
                                Host an Event
                                <ChevronRight className="h-5 w-5" />
                              </Button>
                            ),
                          },
                        ]}
                      />
                    </div>
                  </Card.Body>
                </Card>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </Container>
    </div>
  );
}