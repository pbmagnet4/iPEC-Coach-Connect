/**
 * Enhanced Event Details Component for iPEC Coach Connect
 * 
 * Authentication-aware event details page that provides public event information
 * while encouraging registration through clear authentication prompts.
 * 
 * Features:
 * - Public event viewing with detailed information
 * - Authentication prompts for RSVP and event participation
 * - Role-based actions (attendee list visibility, host controls)
 * - Calendar integration for authenticated users
 * - Social sharing functionality
 * - Mobile-optimized event display
 */

import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Bell,
  Calendar,
  Clock,
  Download,
  Edit3,
  ExternalLink,
  MapPin,
  MessageSquare,
  Settings,
  Share,
  Star,
  UserCheck,
  Users,
  Video
} from 'lucide-react';
import { Container } from '../../components/ui/Container';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { AuthPrompt } from '../../components/community/AuthPrompt';
import { 
  ConditionalAction, 
  ProgressiveContent,
  useAuthAwareActions 
} from '../../components/community/AuthAwareWrapper';

// Mock event data
const mockEvent = {
  id: 1,
  title: 'Leadership Summit 2024: Navigating Change in Uncertain Times',
  description: `Join us for a transformative day of leadership insights, networking, and professional development. The Leadership Summit 2024 brings together industry experts, successful entrepreneurs, and thought leaders to share their experiences and strategies for effective leadership in today's rapidly evolving business landscape.

This comprehensive summit will explore the latest trends in leadership development, from remote team management to sustainable business practices. You'll leave with actionable insights, new connections, and renewed inspiration for your leadership journey.

Whether you're a seasoned executive, an emerging leader, or someone looking to develop their leadership skills, this event offers something valuable for everyone.`,
  longDescription: `## What You'll Learn

### Morning Sessions (9:00 AM - 12:00 PM)
- **Keynote: "The Future of Leadership"** by Dr. Sarah Mitchell, bestselling author of "Adaptive Leadership"
- **Panel Discussion: "Leading Through Crisis"** featuring CEOs from Fortune 500 companies
- **Workshop: "Building Resilient Teams"** - hands-on strategies for team development

### Afternoon Sessions (1:00 PM - 5:00 PM)
- **Breakout Sessions** covering topics like emotional intelligence, digital transformation, and inclusive leadership
- **Networking Lunch** with structured activities to maximize connection opportunities
- **Closing Keynote: "Your Leadership Legacy"** by Marcus Thompson, former CEO of TechCorp

## Who Should Attend

- C-level executives and senior managers
- Middle managers looking to advance their careers
- Emerging leaders and high-potential employees
- Entrepreneurs and business owners
- HR professionals and leadership development specialists
- Anyone interested in developing their leadership skills

## What's Included

- Full-day access to all sessions and workshops
- Networking breakfast and lunch
- Digital resource packet with templates and tools
- One-year membership to our Leadership Community
- Certificate of completion
- Professional photography and networking opportunities`,
  host: {
    id: 'host1',
    name: 'Michael Chen',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80',
    title: 'Leadership Coach & Summit Organizer',
    bio: 'Michael is a certified leadership coach with over 15 years of experience helping executives and teams reach their potential.',
    isVerified: true,
    rating: 4.9,
    eventsHosted: 23,
  },
  date: '2024-03-25T09:00:00Z',
  endDate: '2024-03-25T17:00:00Z',
  timezone: 'EDT',
  type: 'in-person',
  category: 'Leadership',
  tags: ['leadership', 'professional-development', 'networking', 'executive-skills'],
  location: {
    name: 'The Grand Conference Center',
    address: '123 Business Avenue, New York, NY 10001',
    coordinates: { lat: 40.7128, lng: -74.0060 },
  },
  virtualLink: null,
  capacity: 150,
  registered: 89,
  waitlist: 12,
  price: {
    regular: 299,
    earlyBird: 249,
    member: 199,
    currency: 'USD',
  },
  earlyBirdDeadline: '2024-03-15T23:59:59Z',
  registrationDeadline: '2024-03-23T23:59:59Z',
  status: 'open', // open, full, cancelled, completed
  agenda: [
    {
      time: '9:00 AM',
      title: 'Registration & Networking Breakfast',
      description: 'Check-in, breakfast, and informal networking',
      duration: 60,
    },
    {
      time: '10:00 AM',
      title: 'Opening Keynote',
      speaker: 'Dr. Sarah Mitchell',
      description: 'The Future of Leadership in a Digital World',
      duration: 45,
    },
    {
      time: '11:00 AM',
      title: 'Panel Discussion',
      description: 'Leading Through Crisis - Real Stories from the Field',
      duration: 60,
    },
    {
      time: '12:15 PM',
      title: 'Networking Lunch',
      description: 'Structured networking activities and meal',
      duration: 75,
    },
    {
      time: '1:30 PM',
      title: 'Breakout Sessions',
      description: 'Choose from 4 different workshop tracks',
      duration: 90,
    },
    {
      time: '3:15 PM',
      title: 'Afternoon Keynote',
      speaker: 'Marcus Thompson',
      description: 'Building Your Leadership Legacy',
      duration: 45,
    },
    {
      time: '4:15 PM',
      title: 'Closing & Next Steps',
      description: 'Summary, resources, and networking reception',
      duration: 45,
    },
  ],
  speakers: [
    {
      id: 1,
      name: 'Dr. Sarah Mitchell',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80',
      title: 'Leadership Expert & Bestselling Author',
      bio: 'Dr. Mitchell has coached over 500 executives and is the author of three bestselling books on leadership.',
    },
    {
      id: 2,
      name: 'Marcus Thompson',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80',
      title: 'Former CEO, TechCorp',
      bio: 'Marcus led TechCorp through a successful digital transformation and IPO.',
    },
  ],
  attendees: [
    {
      id: 1,
      name: 'Sarah Miller',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80',
      title: 'VP of Operations',
      isPublic: true,
    },
    {
      id: 2,
      name: 'David Park',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80',
      title: 'Product Manager',
      isPublic: true,
    },
  ],
  socialLinks: {
    website: 'https://leadershipsummit2024.com',
    linkedin: 'https://linkedin.com/events/leadership-summit-2024',
  },
  isRegistered: false,
  isWaitlisted: false,
  reminderSet: false,
};

export function EnhancedEventDetails() {
  const { id } = useParams();
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [selectedSection, setSelectedSection] = useState<'overview' | 'agenda' | 'speakers' | 'attendees'>('overview');
  
  const { 
    isAuthenticated, 
    profile, 
    primaryRole,
    canPerformAction 
  } = useAuthAwareActions();

  const isHost = isAuthenticated && profile?.id === mockEvent.host.id;
  const canManageEvent = isHost || canPerformAction(['admin', 'moderator'], ['events:manage']);
  const spotsRemaining = mockEvent.capacity - mockEvent.registered;
  const isEarlyBird = new Date() < new Date(mockEvent.earlyBirdDeadline);
  const currentPrice = isEarlyBird ? mockEvent.price.earlyBird : mockEvent.price.regular;

  const handleRegister = () => {
    console.log('Register for event');
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: mockEvent.title,
        text: mockEvent.description,
        url,
      });
    } else {
      await navigator.clipboard.writeText(url);
    }
  };

  const handleAddToCalendar = () => {
    const startDate = new Date(mockEvent.date);
    const endDate = new Date(mockEvent.endDate);
    
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(mockEvent.title)}&dates=${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z&details=${encodeURIComponent(mockEvent.description)}&location=${encodeURIComponent(mockEvent.location.address)}`;
    
    window.open(googleCalendarUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto"
        >
          {/* Event Hero */}
          <Card className="mb-8 overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80"
              alt="Event banner"
              className="w-full h-64 object-cover"
            />
            <Card.Body>
              <div className="grid lg:grid-cols-3 gap-8">
                {/* Main Event Info */}
                <div className="lg:col-span-2">
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="success" className="flex items-center gap-1">
                      {mockEvent.type === 'in-person' ? <MapPin className="h-3 w-3" /> : <Video className="h-3 w-3" />}
                      {mockEvent.type === 'in-person' ? 'In-Person Event' : 'Virtual Event'}
                    </Badge>
                    <Badge variant="default">{mockEvent.category}</Badge>
                    {spotsRemaining < 10 && (
                      <Badge variant="secondary" className="text-orange-600 bg-orange-50">
                        Only {spotsRemaining} spots left!
                      </Badge>
                    )}
                  </div>
                  
                  <h1 className="text-3xl font-bold mb-4 text-gray-900">
                    {mockEvent.title}
                  </h1>
                  
                  {/* Event Meta */}
                  <div className="grid sm:grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-brand-600" />
                      <div>
                        <p className="font-medium">
                          {new Date(mockEvent.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(mockEvent.date).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                          })} - {new Date(mockEvent.endDate).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                          })} {mockEvent.timezone}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-brand-600" />
                      <div>
                        <p className="font-medium">{mockEvent.location.name}</p>
                        <p className="text-sm text-gray-600">{mockEvent.location.address}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-brand-600" />
                      <div>
                        <p className="font-medium">{mockEvent.registered} registered</p>
                        <p className="text-sm text-gray-600">
                          {spotsRemaining > 0 ? `${spotsRemaining} spots remaining` : 'Event is full'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={mockEvent.host.image}
                        alt={mockEvent.host.name}
                        size="sm"
                      />
                      <div>
                        <div className="flex items-center gap-1">
                          <p className="font-medium">{mockEvent.host.name}</p>
                          {mockEvent.host.isVerified && (
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{mockEvent.host.title}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {mockEvent.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3">
                    <ConditionalAction
                      authAction="rsvp"
                      promptStyle="inline"
                      promptContext={mockEvent.title}
                      replaceWithPrompt={!isAuthenticated}
                    >
                      <Button
                        variant="gradient"
                        size="lg"
                        onClick={handleRegister}
                        disabled={spotsRemaining === 0}
                        className="flex-1 sm:flex-initial"
                      >
                        {spotsRemaining === 0 ? 'Join Waitlist' : 'Register Now'}
                        {isEarlyBird && (
                          <Badge variant="secondary" className="ml-2 bg-white text-brand-600">
                            Early Bird
                          </Badge>
                        )}
                      </Button>
                    </ConditionalAction>
                    
                    <Button
                      variant="outline"
                      onClick={handleShare}
                      icon={<Share className="h-4 w-4" />}
                    >
                      Share
                    </Button>
                    
                    {/* Progressive content - authenticated user actions */}
                    <ProgressiveContent
                      authenticatedContent={
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={handleAddToCalendar}
                            icon={<Download className="h-4 w-4" />}
                          >
                            Add to Calendar
                          </Button>
                          
                          <Button
                            variant="outline"
                            onClick={() => console.log('Set reminder')}
                            icon={<Bell className="h-4 w-4" />}
                          >
                            Remind Me
                          </Button>
                        </div>
                      }
                    />
                    
                    {/* Host/Admin actions */}
                    {canManageEvent && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          icon={<Edit3 className="h-4 w-4" />}
                        >
                          Edit Event
                        </Button>
                        <Button
                          variant="outline"
                          icon={<Settings className="h-4 w-4" />}
                        >
                          Manage
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Sidebar Info */}
                <div className="space-y-6">
                  {/* Pricing Card */}
                  <Card className="bg-gradient-to-br from-brand-50 to-blue-50 border-brand-200">
                    <Card.Body>
                      <h3 className="font-semibold mb-4">Event Pricing</h3>
                      <div className="space-y-3">
                        {isEarlyBird && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Early Bird Price</span>
                            <span className="font-bold text-green-600">
                              ${mockEvent.price.earlyBird}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Regular Price</span>
                          <span className={`font-bold ${isEarlyBird ? 'line-through text-gray-500' : ''}`}>
                            ${mockEvent.price.regular}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Member Price</span>
                          <span className="font-bold text-brand-600">
                            ${mockEvent.price.member}
                          </span>
                        </div>
                        {isEarlyBird && (
                          <p className="text-xs text-green-600 mt-2">
                            Early bird pricing ends {new Date(mockEvent.earlyBirdDeadline).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </Card.Body>
                  </Card>
                  
                  {/* Host Info */}
                  <Card>
                    <Card.Body>
                      <h3 className="font-semibold mb-4">Event Host</h3>
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar
                          src={mockEvent.host.image}
                          alt={mockEvent.host.name}
                          size="lg"
                        />
                        <div>
                          <div className="flex items-center gap-1">
                            <p className="font-medium">{mockEvent.host.name}</p>
                            {mockEvent.host.isVerified && (
                              <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{mockEvent.host.title}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                            <span>★ {mockEvent.host.rating}</span>
                            <span>•</span>
                            <span>{mockEvent.host.eventsHosted} events hosted</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">{mockEvent.host.bio}</p>
                      
                      <ConditionalAction
                        authAction="message"
                        promptStyle="inline"
                        promptContext={mockEvent.host.name}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          icon={<MessageSquare className="h-4 w-4" />}
                        >
                          Message Host
                        </Button>
                      </ConditionalAction>
                    </Card.Body>
                  </Card>
                  
                  {/* Quick Links */}
                  <Card>
                    <Card.Body>
                      <h3 className="font-semibold mb-4">Event Links</h3>
                      <div className="space-y-2">
                        {mockEvent.socialLinks.website && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-start"
                            href={mockEvent.socialLinks.website}
                            icon={<ExternalLink className="h-4 w-4" />}
                          >
                            Event Website
                          </Button>
                        )}
                        {mockEvent.location.coordinates && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-start"
                            href={`https://maps.google.com/?q=${mockEvent.location.coordinates.lat},${mockEvent.location.coordinates.lng}`}
                            icon={<MapPin className="h-4 w-4" />}
                          >
                            View on Map
                          </Button>
                        )}
                      </div>
                    </Card.Body>
                  </Card>
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Event Details Tabs */}
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Tab Navigation */}
            <div className="lg:col-span-1">
              <div className="space-y-2 sticky top-8">
                {[
                  { id: 'overview', label: 'Overview', icon: MessageSquare },
                  { id: 'agenda', label: 'Agenda', icon: Clock },
                  { id: 'speakers', label: 'Speakers', icon: Users },
                  { id: 'attendees', label: 'Who\'s Going', icon: UserCheck },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setSelectedSection(id as any)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors ${
                      selectedSection === id
                        ? 'bg-brand-100 text-brand-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Tab Content */}
            <div className="lg:col-span-3">
              <Card>
                <Card.Body>
                  {selectedSection === 'overview' && (
                    <div className="space-y-6">
                      <h2 className="text-2xl font-bold">About This Event</h2>
                      
                      <div className="prose max-w-none">
                        <div className="space-y-4">
                          {mockEvent.description.split('\n\n').map((paragraph, index) => (
                            <p key={index} className="text-gray-700 leading-relaxed">
                              {paragraph}
                            </p>
                          ))}
                        </div>
                        
                        {showFullDescription && (
                          <div 
                            className="mt-6 space-y-4"
                            dangerouslySetInnerHTML={{ __html: mockEvent.longDescription.replace(/\n/g, '<br>').replace(/##/g, '<h3 class="text-lg font-semibold mt-6 mb-2">').replace(/###/g, '<h4 class="text-md font-medium mt-4 mb-2">').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/- /g, '• ') }}
                          />
                        )}
                        
                        <Button
                          variant="ghost"
                          onClick={() => setShowFullDescription(!showFullDescription)}
                          className="mt-4"
                        >
                          {showFullDescription ? 'Show Less' : 'Read More'}
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {selectedSection === 'agenda' && (
                    <div className="space-y-6">
                      <h2 className="text-2xl font-bold">Event Schedule</h2>
                      
                      <div className="space-y-4">
                        {mockEvent.agenda.map((item, index) => (
                          <div key={index} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                            <div className="flex-shrink-0">
                              <div className="bg-brand-100 text-brand-700 px-3 py-1 rounded text-sm font-medium">
                                {item.time}
                              </div>
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold mb-1">{item.title}</h3>
                              {item.speaker && (
                                <p className="text-sm text-brand-600 mb-1">
                                  Speaker: {item.speaker}
                                </p>
                              )}
                              <p className="text-sm text-gray-600">{item.description}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                Duration: {item.duration} minutes
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {selectedSection === 'speakers' && (
                    <div className="space-y-6">
                      <h2 className="text-2xl font-bold">Featured Speakers</h2>
                      
                      <div className="space-y-6">
                        {mockEvent.speakers.map((speaker) => (
                          <div key={speaker.id} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                            <Avatar
                              src={speaker.image}
                              alt={speaker.name}
                              size="lg"
                            />
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold">{speaker.name}</h3>
                              <p className="text-brand-600 mb-2">{speaker.title}</p>
                              <p className="text-gray-600 text-sm">{speaker.bio}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {selectedSection === 'attendees' && (
                    <div className="space-y-6">
                      <h2 className="text-2xl font-bold">Who's Going</h2>
                      
                      {/* Public attendees preview */}
                      <div>
                        <div className="flex -space-x-2 mb-4">
                          {mockEvent.attendees.slice(0, 8).map((attendee) => (
                            <Avatar
                              key={attendee.id}
                              src={attendee.image}
                              alt={attendee.name}
                              className="border-2 border-white"
                            />
                          ))}
                          {mockEvent.registered > 8 && (
                            <div className="w-10 h-10 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
                              <span className="text-xs font-medium text-gray-600">
                                +{mockEvent.registered - 8}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <p className="text-gray-600 mb-6">
                          {mockEvent.registered} people are registered for this event
                        </p>
                      </div>
                      
                      {/* Progressive content - full attendee list */}
                      <ProgressiveContent
                        publicContent={
                          <AuthPrompt
                            action="rsvp"
                            style="card"
                            context="to see the full attendee list and connect with other participants"
                            emphasizeSignUp={true}
                          />
                        }
                        authenticatedContent={
                          <div className="space-y-4">
                            {mockEvent.attendees.map((attendee) => (
                              <div key={attendee.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                  <Avatar
                                    src={attendee.image}
                                    alt={attendee.name}
                                    size="md"
                                  />
                                  <div>
                                    <p className="font-medium">{attendee.name}</p>
                                    <p className="text-sm text-gray-600">{attendee.title}</p>
                                  </div>
                                </div>
                                
                                <Button
                                  variant="outline"
                                  size="sm"
                                  icon={<MessageSquare className="h-4 w-4" />}
                                >
                                  Connect
                                </Button>
                              </div>
                            ))}
                          </div>
                        }
                      />
                    </div>
                  )}
                </Card.Body>
              </Card>
            </div>
          </div>
        </motion.div>
      </Container>
    </div>
  );
}