import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Award,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  Globe,
  MapPin,
  MessageSquare,
  Star,
  ThumbsDown,
  ThumbsUp,
  Users,
  Video
} from 'lucide-react';
import { Container } from '../components/ui/Container';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

// Type for credentials
interface Credential {
  name: string;
  organization: string;
  year: number;
  verified: boolean;
}

const mockCoach = {
  id: '1',
  name: 'Sarah Johnson',
  credentials: 'PCC, CPC, ELI-MP',
  image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80',
  title: 'Executive Leadership Coach',
  verified: true,
  rating: 4.9,
  reviewCount: 127,
  clientsHelped: 250,
  yearsExperience: 10,
  specialties: [
    'Career Transition',
    'Leadership Development',
    'Executive Coaching',
    'Work-Life Balance',
  ],
  sessionTypes: ['1-on-1 Coaching', 'Group Sessions', 'Workshop Facilitation'],
  languages: ['English', 'Spanish'],
  priceRange: { min: 150, max: 250 },
  location: {
    type: 'hybrid',
    address: 'New York, NY',
    virtual: true,
  },
  bio: "As a certified iPEC coach with over a decade of experience, I specialize in helping professionals navigate career transitions and develop their leadership potential. My approach combines Core Energy™ Coaching with practical strategies for sustainable success.\n\nI believe that true leadership begins with self-awareness and emotional intelligence. Through our work together, you'll discover your unique leadership style and learn how to leverage your strengths to achieve your goals.\n\nMy background includes 15 years in corporate leadership roles before transitioning to full-time coaching, giving me firsthand understanding of the challenges modern leaders face.",
  philosophy: "My coaching philosophy centers on the belief that every individual has untapped potential waiting to be discovered. Using iPEC's Core Energy™ Coaching process, we work together to:\n\n1. Identify limiting beliefs and energy blocks\n2. Develop strategies for sustainable change\n3. Create actionable plans for achieving your goals\n4. Build lasting habits for continued success",
  credentialsList: [
    {
      name: 'Professional Certified Coach (PCC)',
      organization: 'International Coach Federation',
      year: 2018,
      verified: true,
    },
    {
      name: 'Certified Professional Coach (CPC)',
      organization: 'iPEC',
      year: 2015,
      verified: true,
    },
    {
      name: 'Energy Leadership Index Master Practitioner (ELI-MP)',
      organization: 'iPEC',
      year: 2015,
      verified: true,
    },
  ] as Credential[],
  sessionOptions: [
    {
      id: '1',
      name: 'Discovery Session',
      duration: 30,
      price: 0,
      description: "A complimentary consultation to discuss your goals and see if we're a good fit.",
    },
    {
      id: '2',
      name: 'Single Session',
      duration: 60,
      price: 200,
      description: 'One-time coaching session focused on specific goals or challenges.',
    },
    {
      id: '3',
      name: '4-Session Package',
      duration: 60,
      sessionsCount: 4,
      price: 720,
      savings: 80,
      description: 'Monthly coaching package ideal for sustained growth and accountability.',
    },
    {
      id: '4',
      name: '12-Session Package',
      duration: 60,
      sessionsCount: 12,
      price: 1920,
      savings: 480,
      description: 'Comprehensive 3-month program for deep transformation and lasting results.',
    },
  ],
  reviews: [
    {
      id: '1',
      name: 'Michael Roberts',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80',
      rating: 5,
      date: '2024-02-15',
      comment: 'Sarah has been instrumental in my career transition. Her insights and guidance helped me navigate complex decisions with confidence.',
      helpful: 12,
      notHelpful: 1,
    },
    {
      id: '2',
      name: 'Emily Chen',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80',
      rating: 5,
      date: '2024-02-01',
      comment: 'Working with Sarah has transformed my approach to leadership. She has a unique ability to ask the right questions and guide you to meaningful insights.',
      helpful: 8,
      notHelpful: 0,
    },
    {
      id: '3',
      name: 'David Thompson',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80',
      rating: 4,
      date: '2024-01-20',
      comment: 'Sarah brings a wealth of experience and practical insights to her coaching. Her structured approach helped me achieve tangible results.',
      helpful: 5,
      notHelpful: 1,
    },
  ],
  similarCoaches: [
    {
      id: '2',
      name: 'Michael Chen',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80',
      title: 'Life & Business Coach',
      rating: 4.8,
      reviewCount: 93,
    },
    {
      id: '3',
      name: 'Emily Rodriguez',
      image: 'https://images.unsplash.com/photo-1573496799652-408c2ac9fe98?auto=format&fit=crop&q=80',
      title: 'Transformational Coach',
      rating: 5.0,
      reviewCount: 74,
    },
  ],
};

export function CoachProfile() {
  const { id } = useParams();
  const [expandedBio, setExpandedBio] = useState(false);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Profile Header */}
      <div className="bg-white border-b">
        <Container className="py-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Profile Image */}
            <div className="md:w-1/3">
              <div className="relative">
                <img
                  src={mockCoach.image}
                  alt={mockCoach.name}
                  className="w-full aspect-square object-cover rounded-xl"
                />
                {mockCoach.verified && (
                  <div className="absolute top-4 right-4 bg-white rounded-full p-1">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  </div>
                )}
              </div>
            </div>

            {/* Profile Info */}
            <div className="md:w-2/3">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold mb-2">{mockCoach.name}</h1>
                  <p className="text-xl text-gray-600 mb-2">{mockCoach.title}</p>
                  <div className="flex items-center gap-2 mb-4">
                    <p className="text-gray-600">{mockCoach.credentials}</p>
                    {mockCoach.verified && (
                      <Badge variant="success" className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Verified
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 mb-1">
                    <Star className="h-5 w-5 text-yellow-400 fill-current" />
                    <span className="font-semibold text-lg">{mockCoach.rating}</span>
                    <span className="text-gray-500">({mockCoach.reviewCount} reviews)</span>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Users className="h-6 w-6 text-brand-600 mx-auto mb-1" />
                  <div className="font-semibold">{mockCoach.clientsHelped}+</div>
                  <div className="text-sm text-gray-600">Clients</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Clock className="h-6 w-6 text-brand-600 mx-auto mb-1" />
                  <div className="font-semibold">{mockCoach.yearsExperience}+</div>
                  <div className="text-sm text-gray-600">Years</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Globe className="h-6 w-6 text-brand-600 mx-auto mb-1" />
                  <div className="font-semibold">{mockCoach.languages.length}</div>
                  <div className="text-sm text-gray-600">Languages</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <MessageSquare className="h-6 w-6 text-brand-600 mx-auto mb-1" />
                  <div className="font-semibold">{mockCoach.sessionTypes.length}</div>
                  <div className="text-sm text-gray-600">Session Types</div>
                </div>
              </div>

              {/* Quick Info Bar */}
              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="h-5 w-5 text-brand-600" />
                  <span>{mockCoach.location.address}</span>
                  <Badge variant="default">
                    {mockCoach.location.type.charAt(0).toUpperCase() + mockCoach.location.type.slice(1)}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="h-5 w-5 text-brand-600" />
                  <span>Next available: Tomorrow at 10 AM</span>
                </div>
              </div>

              {/* Specialties */}
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Specialties</h3>
                <div className="flex flex-wrap gap-2">
                  {mockCoach.specialties.map((specialty) => (
                    <Badge key={specialty} variant="default">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex gap-4">
                <Button
                  variant="gradient"
                  size="lg"
                  className="flex-1"
                  href={`/booking?coach=${mockCoach.id}`}
                >
                  Book a Session
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  icon={<Video className="h-5 w-5" />}
                >
                  Schedule Free Consultation
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </div>

      <Container className="py-8">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            {/* About Section */}
            <Card>
              <Card.Header>
                <h2 className="text-2xl font-semibold">About</h2>
              </Card.Header>
              <Card.Body>
                <div className={`prose max-w-none ${!expandedBio && 'line-clamp-6'}`}>
                  <p className="whitespace-pre-line">{mockCoach.bio}</p>
                </div>
                <button
                  onClick={() => setExpandedBio(!expandedBio)}
                  className="flex items-center gap-1 text-brand-600 mt-4 hover:text-brand-700"
                >
                  {expandedBio ? (
                    <>
                      Show Less
                      <ChevronUp className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Read More
                      <ChevronDown className="h-4 w-4" />
                    </>
                  )}
                </button>
              </Card.Body>
            </Card>

            {/* Coaching Philosophy */}
            <Card>
              <Card.Header>
                <h2 className="text-2xl font-semibold">Coaching Philosophy</h2>
              </Card.Header>
              <Card.Body>
                <div className="prose max-w-none">
                  <p className="whitespace-pre-line">{mockCoach.philosophy}</p>
                </div>
              </Card.Body>
            </Card>

            {/* Reviews Section */}
            <Card>
              <Card.Header>
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-semibold">Client Reviews</h2>
                  <div className="flex items-center gap-1">
                    <Star className="h-5 w-5 text-yellow-400 fill-current" />
                    <span className="font-semibold">{mockCoach.rating}</span>
                    <span className="text-gray-500">({mockCoach.reviewCount})</span>
                  </div>
                </div>
              </Card.Header>
              <Card.Body>
                <div className="space-y-6">
                  {mockCoach.reviews.map((review) => (
                    <div key={review.id} className="border-b last:border-0 pb-6 last:pb-0">
                      <div className="flex items-start gap-4">
                        <img
                          src={review.image}
                          alt={review.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-semibold">{review.name}</h4>
                              <p className="text-sm text-gray-500">
                                {new Date(review.date).toLocaleDateString('en-US', {
                                  month: 'long',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-yellow-400 fill-current" />
                              <span>{review.rating}</span>
                            </div>
                          </div>
                          <p className="mt-2 text-gray-600">{review.comment}</p>
                          <div className="flex items-center gap-4 mt-3">
                            <button className="flex items-center gap-1 text-gray-500 hover:text-gray-700">
                              <ThumbsUp className="h-4 w-4" />
                              <span>{review.helpful}</span>
                            </button>
                            <button className="flex items-center gap-1 text-gray-500 hover:text-gray-700">
                              <ThumbsDown className="h-4 w-4" />
                              <span>{review.notHelpful}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </div>

          <div className="space-y-8">
            {/* Session Options */}
            <Card>
              <Card.Header>
                <h2 className="text-xl font-semibold">Session Options</h2>
              </Card.Header>
              <Card.Body className="space-y-4">
                {mockCoach.sessionOptions.map((session) => (
                  <div
                    key={session.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedSession === session.id
                        ? 'border-brand-500 bg-brand-50'
                        : 'hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedSession(session.id)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold">{session.name}</h3>
                        <p className="text-sm text-gray-600">
                          {session.duration} minutes
                          {session.sessionsCount && ` × ${session.sessionsCount} sessions`}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-brand-600">
                          ${session.price}
                          {session.sessionsCount && (
                            <span className="text-sm text-gray-500">
                              /session
                            </span>
                          )}
                        </div>
                        {session.savings && (
                          <div className="text-sm text-green-600">
                            Save ${session.savings}
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{session.description}</p>
                    {selectedSession === session.id && (
                      <Button
                        variant="gradient"
                        className="w-full mt-4"
                        href={`/booking?coach=${mockCoach.id}&session=${session.id}`}
                      >
                        Select & Continue
                      </Button>
                    )}
                  </div>
                ))}
              </Card.Body>
            </Card>

            {/* Credentials */}
            <Card>
              <Card.Header>
                <h2 className="text-xl font-semibold">Credentials</h2>
              </Card.Header>
              <Card.Body className="space-y-4">
                {mockCoach.credentialsList.map((credential, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="p-2 bg-brand-50 rounded-lg">
                      <Award className="h-5 w-5 text-brand-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{credential.name}</h3>
                      <p className="text-sm text-gray-600">
                        {credential.organization} • {credential.year}
                      </p>
                      {credential.verified && (
                        <Badge variant="success" className="mt-1">Verified</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </Card.Body>
            </Card>
          </div>
        </div>

        {/* Similar Coaches */}
        <div className="mt-12">
          <h2 className="text-2xl font-semibold mb-6">Similar Coaches</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {mockCoach.similarCoaches.map((coach) => (
              <Card key={coach.id} hover>
                <img
                  src={coach.image}
                  alt={coach.name}
                  className="w-full h-48 object-cover rounded-t-xl"
                />
                <Card.Body>
                  <h3 className="font-semibold">{coach.name}</h3>
                  <p className="text-gray-600 mb-2">{coach.title}</p>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="font-semibold">{coach.rating}</span>
                    <span className="text-gray-500">({coach.reviewCount})</span>
                  </div>
                  <Button
                    href={`/coaches/${coach.id}`}
                    variant="outline"
                    className="w-full mt-4"
                  >
                    View Profile
                  </Button>
                </Card.Body>
              </Card>
            ))}
          </div>
        </div>
      </Container>
    </div>
  );
}