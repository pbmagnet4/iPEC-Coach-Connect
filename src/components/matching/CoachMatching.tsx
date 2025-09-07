/**
 * Coach Matching Component for iPEC Coach Connect
 * 
 * Intelligent coach recommendation system that matches clients with compatible
 * coaches based on goals, preferences, availability, and coaching style.
 * Includes advanced filtering, comparison tools, and booking integration.
 * 
 * Features:
 * - AI-powered coach matching algorithm
 * - Multi-criteria filtering and search
 * - Coach comparison and detailed profiles
 * - Availability checking and booking
 * - Rating and review integration
 * - Favorites and saved searches
 * - Geographic and timezone matching
 * - Specialization and certification tracking
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  Award,
  BookOpen,
  Brain,
  Briefcase,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  DollarSign,
  Eye,
  Filter,
  Globe,
  Grid,
  Heart,
  List,
  MapPin,
  MessageSquare,
  MoreVertical,
  Phone,
  Search,
  Shield,
  Sliders,
  SortAsc,
  Star,
  Target,
  ThumbsUp,
  TrendingUp,
  User,
  Users,
  Verified,
  Video,
  X,
  Zap
} from 'lucide-react';
import { 
  useAuth, 
  useClientProfile, 
  useDashboardMetrics,
  useUserRoles 
} from '../../stores/unified-user-store';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { Modal } from '../ui/Modal';
import { Tabs } from '../ui/Tabs';
import { Tooltip } from '../ui/Tooltip';
import { Checkbox } from '../ui/Checkbox';
import { Range } from '../ui/Range';
import { toast } from '../ui/Toast';
import { EnhancedRoleGuard } from '../auth/EnhancedRoleGuard';

// =====================================================================
// TYPES AND INTERFACES
// =====================================================================

interface CoachProfile {
  id: string;
  user_id: string;
  name: string;
  display_name: string;
  avatar_url?: string;
  bio: string;
  tagline?: string;
  specializations: string[];
  certifications: Certification[];
  experience_years: number;
  coaching_approach: string[];
  languages: string[];
  timezone: string;
  location: string;
  availability: {
    days: string[];
    hours_start: string;
    hours_end: string;
    timezone: string;
  };
  pricing: {
    initial_session: number;
    follow_up_session: number;
    package_discounts?: {
      sessions: number;
      discount_percentage: number;
    }[];
    currency: string;
    accepts_insurance: boolean;
  };
  rating_average: number;
  rating_count: number;
  total_sessions: number;
  client_success_rate: number;
  response_time_hours: number;
  verification_status: 'verified' | 'pending' | 'unverified';
  ipec_certified: boolean;
  is_accepting_clients: boolean;
  created_at: string;
  updated_at: string;
  match_score?: number;
  match_reasons?: string[];
}

interface Certification {
  id: string;
  name: string;
  issuing_organization: string;
  issue_date: string;
  expiry_date?: string;
  credential_id?: string;
  verification_status: 'verified' | 'pending' | 'unverified';
}

interface CoachReview {
  id: string;
  coach_id: string;
  client_id: string;
  client_name: string;
  client_avatar?: string;
  rating: number;
  title: string;
  content: string;
  session_count: number;
  coaching_duration_months: number;
  goals_achieved: string[];
  would_recommend: boolean;
  is_verified: boolean;
  created_at: string;
}

interface MatchingFilters {
  specializations?: string[];
  experience_min?: number;
  experience_max?: number;
  rating_min?: number;
  pricing_max?: number;
  languages?: string[];
  timezone_compatibility?: boolean;
  availability_days?: string[];
  availability_time?: string;
  certification_required?: boolean;
  ipec_certified_only?: boolean;
  accepting_clients_only?: boolean;
  location_preference?: 'local' | 'remote' | 'any';
  max_distance_miles?: number;
  coaching_approach?: string[];
  search_query?: string;
}

interface MatchingPreferences {
  goals: string[];
  preferred_communication_style: string[];
  session_frequency: 'weekly' | 'bi_weekly' | 'monthly';
  session_duration: 30 | 60 | 90;
  budget_max: number;
  timezone_preference: string;
  language_preference: string[];
  coaching_experience_level: 'new' | 'some' | 'experienced';
  focus_areas: string[];
}

// =====================================================================
// COACH MATCHING HOOKS
// =====================================================================

const _useCoachMatching = () => {
  const { user } = useAuth();
  const { clientProfile } = useClientProfile();
  
  const [coaches, setCoaches] = useState<CoachProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favoriteCoaches, setFavoriteCoaches] = useState<string[]>([]);

  const _fetchCoaches = async (filters?: MatchingFilters) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // This would fetch from Supabase with matching algorithm
      // For now, using mock data structure
      const mockCoaches: CoachProfile[] = [
        {
          id: 'coach1',
          user_id: 'user_coach1',
          name: 'Sarah Johnson',
          display_name: 'Sarah',
          avatar_url: 'https://images.unsplash.com/photo-1573496799652-408c2ac9fe98?auto=format&fit=crop&q=80',
          bio: 'I help ambitious professionals unlock their leadership potential and create meaningful career transitions. With over 8 years of coaching experience, I specialize in executive presence, communication skills, and strategic thinking.',
          tagline: 'Unlocking Leadership Potential',
          specializations: [
            'Executive Leadership',
            'Career Transition',
            'Communication Skills',
            'Strategic Thinking',
            'Team Management'
          ],
          certifications: [
            {
              id: 'cert1',
              name: 'iPEC Certified Professional Coach (CPC)',
              issuing_organization: 'iPEC',
              issue_date: '2020-03-15',
              verification_status: 'verified'
            },
            {
              id: 'cert2',
              name: 'Energy Leadership Index Master Practitioner (ELI-MP)',
              issuing_organization: 'iPEC',
              issue_date: '2021-01-20',
              verification_status: 'verified'
            }
          ],
          experience_years: 8,
          coaching_approach: ['Solution-focused', 'Goal-oriented', 'Collaborative', 'Strength-based'],
          languages: ['English', 'Spanish'],
          timezone: 'America/New_York',
          location: 'New York, NY',
          availability: {
            days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            hours_start: '09:00',
            hours_end: '17:00',
            timezone: 'America/New_York'
          },
          pricing: {
            initial_session: 150,
            follow_up_session: 125,
            package_discounts: [
              { sessions: 4, discount_percentage: 5 },
              { sessions: 8, discount_percentage: 10 }
            ],
            currency: 'USD',
            accepts_insurance: false
          },
          rating_average: 4.8,
          rating_count: 47,
          total_sessions: 312,
          client_success_rate: 89,
          response_time_hours: 4,
          verification_status: 'verified',
          ipec_certified: true,
          is_accepting_clients: true,
          created_at: '2020-01-15T00:00:00Z',
          updated_at: new Date().toISOString(),
          match_score: 95,
          match_reasons: [
            'Leadership specialization matches your goals',
            'High client success rate (89%)',
            'Compatible timezone and availability',
            'iPEC certified professional'
          ]
        },
        {
          id: 'coach2',
          user_id: 'user_coach2',
          name: 'Michael Chen',
          display_name: 'Michael',
          avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80',
          bio: 'Passionate about helping individuals achieve work-life balance and personal fulfillment. I combine mindfulness practices with practical coaching techniques to support sustainable life changes.',
          tagline: 'Balance, Growth, Fulfillment',
          specializations: [
            'Work-Life Balance',
            'Stress Management',
            'Mindfulness',
            'Personal Development',
            'Life Transitions'
          ],
          certifications: [
            {
              id: 'cert3',
              name: 'iPEC Certified Professional Coach (CPC)',
              issuing_organization: 'iPEC',
              issue_date: '2019-09-10',
              verification_status: 'verified'
            },
            {
              id: 'cert4',
              name: 'Certified Mindfulness Practitioner',
              issuing_organization: 'Mindfulness Institute',
              issue_date: '2018-06-01',
              verification_status: 'verified'
            }
          ],
          experience_years: 6,
          coaching_approach: ['Mindful', 'Holistic', 'Client-centered', 'Compassionate'],
          languages: ['English', 'Mandarin'],
          timezone: 'America/Los_Angeles',
          location: 'San Francisco, CA',
          availability: {
            days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            hours_start: '08:00',
            hours_end: '20:00',
            timezone: 'America/Los_Angeles'
          },
          pricing: {
            initial_session: 120,
            follow_up_session: 100,
            package_discounts: [
              { sessions: 6, discount_percentage: 8 }
            ],
            currency: 'USD',
            accepts_insurance: true
          },
          rating_average: 4.9,
          rating_count: 33,
          total_sessions: 198,
          client_success_rate: 92,
          response_time_hours: 2,
          verification_status: 'verified',
          ipec_certified: true,
          is_accepting_clients: true,
          created_at: '2019-05-20T00:00:00Z',
          updated_at: new Date().toISOString(),
          match_score: 87,
          match_reasons: [
            'Work-life balance expertise',
            'Excellent client ratings (4.9/5)',
            'Accepts insurance',
            'Extended availability hours'
          ]
        },
        {
          id: 'coach3',
          user_id: 'user_coach3',
          name: 'Dr. Emily Rodriguez',
          display_name: 'Dr. Emily',
          avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80',
          bio: 'Clinical psychologist turned executive coach with expertise in organizational behavior and team dynamics. I help leaders build high-performing teams and create positive workplace cultures.',
          tagline: 'Building Leaders, Transforming Teams',
          specializations: [
            'Executive Coaching',
            'Team Dynamics',
            'Organizational Behavior',
            'Change Management',
            'Emotional Intelligence'
          ],
          certifications: [
            {
              id: 'cert5',
              name: 'iPEC Certified Professional Coach (CPC)',
              issuing_organization: 'iPEC',
              issue_date: '2021-02-28',
              verification_status: 'verified'
            },
            {
              id: 'cert6',
              name: 'PhD in Clinical Psychology',
              issuing_organization: 'Stanford University',
              issue_date: '2015-06-15',
              verification_status: 'verified'
            }
          ],
          experience_years: 4,
          coaching_approach: ['Evidence-based', 'Systemic', 'Results-oriented', 'Empowering'],
          languages: ['English', 'Spanish', 'Portuguese'],
          timezone: 'America/Chicago',
          location: 'Chicago, IL',
          availability: {
            days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'],
            hours_start: '10:00',
            hours_end: '18:00',
            timezone: 'America/Chicago'
          },
          pricing: {
            initial_session: 200,
            follow_up_session: 175,
            package_discounts: [
              { sessions: 3, discount_percentage: 5 },
              { sessions: 6, discount_percentage: 12 }
            ],
            currency: 'USD',
            accepts_insurance: false
          },
          rating_average: 4.7,
          rating_count: 21,
          total_sessions: 127,
          client_success_rate: 95,
          response_time_hours: 6,
          verification_status: 'verified',
          ipec_certified: true,
          is_accepting_clients: true,
          created_at: '2021-01-10T00:00:00Z',
          updated_at: new Date().toISOString(),
          match_score: 82,
          match_reasons: [
            'Advanced psychology background',
            'Highest client success rate (95%)',
            'Team dynamics specialization',
            'Multiple language support'
          ]
        }
      ];

      // Apply AI matching algorithm based on client profile
      let filteredCoaches = mockCoaches;
      
      // Apply filters
      if (filters?.specializations && filters.specializations.length > 0) {
        filteredCoaches = filteredCoaches.filter(coach =>
          coach.specializations.some(spec => 
            filters.specializations!.some(filterSpec => 
              spec.toLowerCase().includes(filterSpec.toLowerCase())
            )
          )
        );
      }
      
      if (filters?.rating_min) {
        filteredCoaches = filteredCoaches.filter(coach => 
          coach.rating_average >= filters.rating_min!
        );
      }
      
      if (filters?.pricing_max) {
        filteredCoaches = filteredCoaches.filter(coach => 
          coach.pricing.follow_up_session <= filters.pricing_max!
        );
      }
      
      if (filters?.ipec_certified_only) {
        filteredCoaches = filteredCoaches.filter(coach => coach.ipec_certified);
      }
      
      if (filters?.accepting_clients_only) {
        filteredCoaches = filteredCoaches.filter(coach => coach.is_accepting_clients);
      }
      
      if (filters?.search_query) {
        const _searchLower = filters.search_query.toLowerCase();
        filteredCoaches = filteredCoaches.filter(coach =>
          coach.name.toLowerCase().includes(searchLower) ||
          coach.bio.toLowerCase().includes(searchLower) ||
          coach.specializations.some(spec => spec.toLowerCase().includes(searchLower)) ||
          coach.coaching_approach.some(approach => approach.toLowerCase().includes(searchLower))
        );
      }

      // Sort by match score
  void filteredCoaches.sort((a, b) => (b.match_score || 0) - (a.match_score || 0));

      setCoaches(filteredCoaches);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch coaches');
    } finally {
      setIsLoading(false);
    }
  };

  const _toggleFavorite = async (coachId: string) => {
    try {
      setFavoriteCoaches(prev => 
        prev.includes(coachId)
          ? prev.filter(id => id !== coachId)
          : [...prev, coachId]
      );
      
      const _isFavorite = !favoriteCoaches.includes(coachId);
  void oast.success(isFavorite ? 'Coach added to favorites!' : 'Coach removed from favorites');
    } catch (err) {
  void oast.error('Failed to update favorites');
    }
  };

  const _getCoachReviews = async (coachId: string): Promise<CoachReview[]> => {
    // This would fetch from Supabase
    // Mock reviews for now
    return [
      {
        id: '1',
        coach_id: coachId,
        client_id: 'client1',
        client_name: 'Jessica M.',
        rating: 5,
        title: 'Transformative Experience',
        content: 'Sarah helped me navigate a major career transition with confidence and clarity. Her insights were invaluable and her support was unwavering.',
        session_count: 12,
        coaching_duration_months: 6,
        goals_achieved: ['Career Transition', 'Confidence Building'],
        would_recommend: true,
        is_verified: true,
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
  };

  useEffect(() => {
    fetchCoaches();
  }, []);

  return {
    coaches,
    isLoading,
    error,
    favoriteCoaches,
    fetchCoaches,
    toggleFavorite,
    getCoachReviews
  };
};

// =====================================================================
// COACH CARD COMPONENT
// =====================================================================

const CoachCard: React.FC<{
  coach: CoachProfile;
  isFavorite: boolean;
  onToggleFavorite: (coachId: string) => void;
  onViewProfile: (coach: CoachProfile) => void;
  onBookSession: (coach: CoachProfile) => void;
  viewMode: 'grid' | 'list';
}> = ({ coach, isFavorite, onToggleFavorite, onViewProfile, onBookSession, viewMode }) => {
  const [showFullBio, setShowFullBio] = useState(false);

  const _formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: coach.pricing.currency
    }).format(price);
  };

  const _getAvailabilityText = () => {
    const {days} = coach.availability;
    if (days.length === 7) return 'Available 7 days/week';
    if (days.length === 5 && !days.includes('Saturday') && !days.includes('Sunday')) {
      return 'Available weekdays';
    }
    return `Available ${days.length} days/week`;
  };

  const _displayBio = showFullBio ? coach.bio : 
    coach.bio.length > 150 ? `${coach.bio.substring(0, 150)}...` : coach.bio;

  if (viewMode === 'list') {
    return (
      <Card className="hover:shadow-md transition-all duration-200">
        <Card.Body className="p-6">
          <div className="flex gap-6">
            <div className="flex-shrink-0">
              <div className="relative">
                <Avatar
                  src={coach.avatar_url}
                  alt={coach.name}
                  size="xl"
                  fallback={coach.name.charAt(0)}
                />
                {coach.verification_status === 'verified' && (
                  <div className="absolute -bottom-1 -right-1 bg-blue-100 rounded-full p-1">
                    <Verified className="w-4 h-4 text-blue-600" />
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">
                    {coach.name}
                  </h3>
                  {coach.tagline && (
                    <p className="text-blue-600 font-medium mb-2">{coach.tagline}</p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span>{coach.rating_average}</span>
                      <span>({coach.rating_count} reviews)</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Award className="w-4 h-4" />
                      <span>{coach.experience_years} years</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{coach.location}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {coach.match_score && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {coach.match_score}%
                      </div>
                      <div className="text-xs text-gray-500">Match</div>
                    </div>
                  )}
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onToggleFavorite(coach.id)}
                    className={isFavorite ? 'text-red-500' : 'text-gray-400'}
                  >
                    <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                  </Button>
                </div>
              </div>
              
              <p className="text-gray-700 mb-4 leading-relaxed">
                {displayBio}
                {coach.bio.length > 150 && (
                  <button
                    onClick={() => setShowFullBio(!showFullBio)}
                    className="ml-1 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {showFullBio ? 'Show less' : 'Read more'}
                  </button>
                )}
              </p>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {coach.specializations.slice(0, 4).map((spec, index) => (
                  <Badge key={index} variant="secondary" size="sm">
                    {spec}
                  </Badge>
                ))}
                {coach.specializations.length > 4 && (
                  <Badge variant="secondary" size="sm">
                    +{coach.specializations.length - 4} more
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>{formatPrice(coach.pricing.follow_up_session)}/session</span>
                  <span>{getAvailabilityText()}</span>
                  <span>Responds in {coach.response_time_hours}h</span>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onViewProfile(coach)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Profile
                  </Button>
                  
                  <Button
                    size="sm"
                    onClick={() => onBookSession(coach)}
                    disabled={!coach.is_accepting_clients}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Book Session
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>
    );
  }

  // Grid view
  return (
    <Card className="hover:shadow-md transition-all duration-200 h-full">
      <Card.Body className="p-6 flex flex-col h-full">
        <div className="flex items-start justify-between mb-4">
          <div className="relative">
            <Avatar
              src={coach.avatar_url}
              alt={coach.name}
              size="lg"
              fallback={coach.name.charAt(0)}
            />
            {coach.verification_status === 'verified' && (
              <div className="absolute -bottom-1 -right-1 bg-blue-100 rounded-full p-1">
                <Verified className="w-3 h-3 text-blue-600" />
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {coach.match_score && (
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">
                  {coach.match_score}%
                </div>
                <div className="text-xs text-gray-500">Match</div>
              </div>
            )}
            
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onToggleFavorite(coach.id)}
              className={isFavorite ? 'text-red-500' : 'text-gray-400'}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </Button>
          </div>
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {coach.name}
          </h3>
          {coach.tagline && (
            <p className="text-blue-600 font-medium text-sm mb-3">{coach.tagline}</p>
          )}
          
          <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span>{coach.rating_average}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Award className="w-4 h-4" />
              <span>{coach.experience_years}y</span>
            </div>
          </div>
          
          <p className="text-sm text-gray-700 mb-4 line-clamp-3">
            {coach.bio}
          </p>
          
          <div className="flex flex-wrap gap-1 mb-4">
            {coach.specializations.slice(0, 3).map((spec, index) => (
              <Badge key={index} variant="secondary" size="sm">
                {spec}
              </Badge>
            ))}
            {coach.specializations.length > 3 && (
              <Badge variant="secondary" size="sm">
                +{coach.specializations.length - 3}
              </Badge>
            )}
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">
              {formatPrice(coach.pricing.follow_up_session)}/session
            </span>
            <span className="text-gray-600">
              {coach.response_time_hours}h response
            </span>
          </div>
          
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onViewProfile(coach)}
              className="flex-1"
            >
              <Eye className="w-4 h-4 mr-1" />
              View
            </Button>
            
            <Button
              size="sm"
              onClick={() => onBookSession(coach)}
              disabled={!coach.is_accepting_clients}
              className="flex-1"
            >
              <Calendar className="w-4 h-4 mr-1" />
              Book
            </Button>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

// =====================================================================
// COACH PROFILE MODAL
// =====================================================================

const CoachProfileModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  coach: CoachProfile | null;
  onBookSession: (coach: CoachProfile) => void;
  onGetReviews: (coachId: string) => Promise<CoachReview[]>;
}> = ({ isOpen, onClose, coach, onBookSession, onGetReviews }) => {
  const [reviews, setReviews] = useState<CoachReview[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'reviews' | 'availability'>('overview');

  useEffect(() => {
    if (coach && selectedTab === 'reviews') {
      setIsLoadingReviews(true);
      onGetReviews(coach.id)
        .then(setReviews)
        .finally(() => setIsLoadingReviews(false));
    }
  }, [coach, selectedTab, onGetReviews]);

  if (!coach) return null;

  const _formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: coach.pricing.currency
    }).format(price);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={coach.name} size="xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex gap-6">
          <div className="relative">
            <Avatar
              src={coach.avatar_url}
              alt={coach.name}
              size="2xl"
              fallback={coach.name.charAt(0)}
            />
            {coach.verification_status === 'verified' && (
              <div className="absolute -bottom-2 -right-2 bg-blue-100 rounded-full p-2">
                <Verified className="w-5 h-5 text-blue-600" />
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {coach.name}
            </h2>
            {coach.tagline && (
              <p className="text-lg text-blue-600 font-medium mb-3">{coach.tagline}</p>
            )}
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span>{coach.rating_average} ({coach.rating_count} reviews)</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4" />
                <span>{coach.experience_years} years experience</span>
              </div>
              
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{coach.location}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Responds in {coach.response_time_hours}h</span>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            {coach.match_score && (
              <div className="mb-4">
                <div className="text-3xl font-bold text-green-600">
                  {coach.match_score}%
                </div>
                <div className="text-sm text-gray-500">Match Score</div>
              </div>
            )}
            
            <Button
              onClick={() => onBookSession(coach)}
              disabled={!coach.is_accepting_clients}
              size="lg"
            >
              <Calendar className="w-5 h-5 mr-2" />
              Book Session
            </Button>
          </div>
        </div>

        {/* Match Reasons */}
        {coach.match_reasons && coach.match_reasons.length > 0 && (
          <Card>
            <Card.Header>
              <h3 className="text-lg font-semibold text-green-600">Why this coach matches you</h3>
            </Card.Header>
            <Card.Body>
              <ul className="space-y-2">
                {coach.match_reasons.map((reason, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    {reason}
                  </li>
                ))}
              </ul>
            </Card.Body>
          </Card>
        )}

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as typeof selectedTab)}>
          <Tabs.List>
            <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
            <Tabs.Trigger value="reviews">Reviews ({coach.rating_count})</Tabs.Trigger>
            <Tabs.Trigger value="availability">Availability & Pricing</Tabs.Trigger>
          </Tabs.List>
          
          <Tabs.Content value="overview" className="space-y-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">About</h4>
              <p className="text-gray-700 leading-relaxed">{coach.bio}</p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Specializations</h4>
              <div className="flex flex-wrap gap-2">
                {coach.specializations.map((spec, index) => (
                  <Badge key={index} variant="primary">
                    {spec}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Coaching Approach</h4>
              <div className="flex flex-wrap gap-2">
                {coach.coaching_approach.map((approach, index) => (
                  <Badge key={index} variant="secondary">
                    {approach}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Certifications</h4>
              <div className="space-y-2">
                {coach.certifications.map((cert) => (
                  <div key={cert.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">{cert.name}</div>
                      <div className="text-sm text-gray-600">{cert.issuing_organization}</div>
                    </div>
                    {cert.verification_status === 'verified' && (
                      <Verified className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Tabs.Content>
          
          <Tabs.Content value="reviews" className="space-y-4">
            {isLoadingReviews ? (
              <div className="text-center py-8">Loading reviews...</div>
            ) : reviews.length > 0 ? (
              reviews.map((review) => (
                <Card key={review.id}>
                  <Card.Body className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={review.client_avatar}
                          alt={review.client_name}
                          size="sm"
                          fallback={review.client_name.charAt(0)}
                        />
                        <div>
                          <div className="font-medium text-gray-900">{review.client_name}</div>
                          <div className="text-sm text-gray-600">
                            {review.session_count} sessions • {review.coaching_duration_months} months
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    
                    <h5 className="font-medium text-gray-900 mb-2">{review.title}</h5>
                    <p className="text-gray-700 mb-3">{review.content}</p>
                    
                    {review.goals_achieved.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        <span className="text-sm text-gray-600 mr-2">Goals achieved:</span>
                        {review.goals_achieved.map((goal, index) => (
                          <Badge key={index} variant="success" size="sm">
                            {goal}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </Card.Body>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No reviews available yet.
              </div>
            )}
          </Tabs.Content>
          
          <Tabs.Content value="availability" className="space-y-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Pricing</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span>Initial Session</span>
                  <span className="font-medium">{formatPrice(coach.pricing.initial_session)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span>Follow-up Sessions</span>
                  <span className="font-medium">{formatPrice(coach.pricing.follow_up_session)}</span>
                </div>
                {coach.pricing.package_discounts && coach.pricing.package_discounts.length > 0 && (
                  <div>
                    <h5 className="font-medium text-gray-700 mb-2">Package Discounts</h5>
                    {coach.pricing.package_discounts.map((pkg, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                        <span>{pkg.sessions} sessions</span>
                        <span className="font-medium text-green-600">{pkg.discount_percentage}% off</span>
                      </div>
                    ))}
                  </div>
                )}
                {coach.pricing.accepts_insurance && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    Accepts insurance
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Availability</h4>
              <div className="grid grid-cols-7 gap-2 mb-4">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
                  const _fullDay = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][index];
                  const _isAvailable = coach.availability.days.includes(fullDay);
                  
                  return (
                    <div
                      key={day}
                      className={`p-2 text-center text-xs rounded ${
                        isAvailable
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {day}
                    </div>
                  );
                })}
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Hours:</span>
                  <span className="ml-2 font-medium">
                    {coach.availability.hours_start} - {coach.availability.hours_end}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Timezone:</span>
                  <span className="ml-2 font-medium">{coach.availability.timezone}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Languages</h4>
              <div className="flex flex-wrap gap-2">
                {coach.languages.map((language, index) => (
                  <Badge key={index} variant="secondary">
                    {language}
                  </Badge>
                ))}
              </div>
            </div>
          </Tabs.Content>
        </Tabs>
      </div>
    </Modal>
  );
};

// =====================================================================
// FILTERS SIDEBAR
// =====================================================================

const FiltersSidebar: React.FC<{
  filters: MatchingFilters;
  onFiltersChange: (filters: MatchingFilters) => void;
  onClearFilters: () => void;
}> = ({ filters, onFiltersChange, onClearFilters }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const _specializations = [
    'Executive Leadership',
    'Career Transition',
    'Work-Life Balance',
    'Team Management',
    'Communication Skills',
    'Personal Development',
    'Stress Management',
    'Goal Achievement'
  ];

  const _coachingApproaches = [
    'Solution-focused',
    'Goal-oriented',
    'Mindful',
    'Results-oriented',
    'Collaborative',
    'Strength-based'
  ];

  const _updateFilter = <K extends keyof MatchingFilters>(key: K, value: MatchingFilters[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <Card>
      <Card.Header>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Filters</h3>
          <Button size="sm" variant="ghost" onClick={onClearFilters}>
            Clear All
          </Button>
        </div>
      </Card.Header>
      
      <Card.Body className="space-y-6">
        {/* Experience */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Experience (years)
          </label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={filters.experience_min?.toString() || ''}
              onChange={(e) => updateFilter('experience_min', 
                e.target.value ? parseInt(e.target.value) : undefined
              )}
            />
            <Input
              type="number"
              placeholder="Max"
              value={filters.experience_max?.toString() || ''}
              onChange={(e) => updateFilter('experience_max', 
                e.target.value ? parseInt(e.target.value) : undefined
              )}
            />
          </div>
        </div>

        {/* Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Minimum Rating
          </label>
          <Select
            value={filters.rating_min?.toString() || ''}
            onChange={(value) => updateFilter('rating_min', 
              value ? parseFloat(value) : undefined
            )}
            placeholder="Any rating"
          >
            <option value="">Any rating</option>
            <option value="4.5">4.5+ stars</option>
            <option value="4.0">4.0+ stars</option>
            <option value="3.5">3.5+ stars</option>
          </Select>
        </div>

        {/* Pricing */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Maximum Price per Session
          </label>
          <Input
            type="number"
            placeholder="Max price"
            value={filters.pricing_max?.toString() || ''}
            onChange={(e) => updateFilter('pricing_max', 
              e.target.value ? parseInt(e.target.value) : undefined
            )}
          />
        </div>

        {/* Specializations */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Specializations
          </label>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {specializations.map((spec) => (
              <Checkbox
                key={spec}
                checked={filters.specializations?.includes(spec) || false}
                onChange={(checked) => {
                  const _current = filters.specializations || [];
                  updateFilter('specializations', 
                    checked 
                      ? [...current, spec]
                      : current.filter(s => s !== spec)
                  );
                }}
                label={spec}
              />
            ))}
          </div>
        </div>

        {/* Coaching Approach */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Coaching Approach
          </label>
          <div className="space-y-2">
            {coachingApproaches.map((approach) => (
              <Checkbox
                key={approach}
                checked={filters.coaching_approach?.includes(approach) || false}
                onChange={(checked) => {
                  const _current = filters.coaching_approach || [];
                  updateFilter('coaching_approach', 
                    checked 
                      ? [...current, approach]
                      : current.filter(a => a !== approach)
                  );
                }}
                label={approach}
              />
            ))}
          </div>
        </div>

        {/* Additional Filters */}
        <div className="space-y-3">
          <Checkbox
            checked={filters.ipec_certified_only || false}
            onChange={(checked) => updateFilter('ipec_certified_only', checked)}
            label="iPEC Certified Only"
          />
          
          <Checkbox
            checked={filters.accepting_clients_only || false}
            onChange={(checked) => updateFilter('accepting_clients_only', checked)}
            label="Accepting New Clients"
          />
          
          <Checkbox
            checked={filters.certification_required || false}
            onChange={(checked) => updateFilter('certification_required', checked)}
            label="Professional Certification Required"
          />
        </div>
      </Card.Body>
    </Card>
  );
};

// =====================================================================
// MAIN COMPONENT
// =====================================================================

export const CoachMatching: React.FC = () => {
  const { user } = useAuth();
  const { clientProfile } = useClientProfile();
  const {
    coaches,
    isLoading,
    error,
    favoriteCoaches,
    fetchCoaches,
    toggleFavorite,
    getCoachReviews
  } = useCoachMatching();

  const [filters, setFilters] = useState<MatchingFilters>({
    accepting_clients_only: true
  });
  
  const [sortBy, setSortBy] = useState<'match_score' | 'rating' | 'price' | 'experience'>('match_score');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCoach, setSelectedCoach] = useState<CoachProfile | null>(null);

  // Filter and sort coaches
  const _filteredAndSortedCoaches = useMemo(() => {
    const _result = [...coaches];

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'match_score':
          return (b.match_score || 0) - (a.match_score || 0);
        case 'rating':
          return b.rating_average - a.rating_average;
        case 'price':
          return a.pricing.follow_up_session - b.pricing.follow_up_session;
        case 'experience':
          return b.experience_years - a.experience_years;
        default:
          return 0;
      }
    });

    return result;
  }, [coaches, sortBy]);

  const _handleFiltersChange = (newFilters: MatchingFilters) => {
    setFilters(newFilters);
    fetchCoaches(newFilters);
  };

  const _handleClearFilters = () => {
    const clearedFilters: MatchingFilters = { accepting_clients_only: true };
    setFilters(clearedFilters);
    fetchCoaches(clearedFilters);
  };

  const _handleBookSession = (coach: CoachProfile) => {
    // This would navigate to session booking with pre-selected coach
  void oast.success(`Booking session with ${coach.name}...`);
  };

  const _handleSearch = (searchQuery: string) => {
    const _newFilters = { ...filters, search_query: searchQuery };
    setFilters(newFilters);
    fetchCoaches(newFilters);
  };

  if (error) {
    return (
      <Card>
        <Card.Body className="text-center p-8">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Coaches</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => fetchCoaches()}>
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
          <h2 className="text-2xl font-bold text-gray-900">Find Your Perfect Coach</h2>
          <p className="text-gray-600">
            Discover certified coaches matched to your goals and preferences
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
          </Button>
          
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Sliders className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>
      </div>

      {/* Search and Sort */}
      <Card>
        <Card.Body className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search coaches by name, specialization, or coaching style..."
                value={filters.search_query || ''}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full"
              />
            </div>
            
            <div className="flex gap-2">
              <Select
                value={sortBy}
                onChange={(value) => setSortBy(value as typeof sortBy)}
              >
                <option value="match_score">Best Match</option>
                <option value="rating">Highest Rated</option>
                <option value="price">Lowest Price</option>
                <option value="experience">Most Experience</option>
              </Select>
            </div>
          </div>
          
          {coaches.length > 0 && (
            <div className="mt-4 text-sm text-gray-600">
              Showing {filteredAndSortedCoaches.length} of {coaches.length} coaches
            </div>
          )}
        </Card.Body>
      </Card>

      <div className="flex gap-6">
        {/* Filters Sidebar */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="flex-shrink-0"
            >
              <FiltersSidebar
                filters={filters}
                onFiltersChange={handleFiltersChange}
                onClearFilters={handleClearFilters}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Coaches List */}
        <div className="flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Finding your perfect coach matches...</p>
              </div>
            </div>
          ) : filteredAndSortedCoaches.length > 0 ? (
            <div className={
              viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
                : 'space-y-4'
            }>
              {filteredAndSortedCoaches.map((coach) => (
                <CoachCard
                  key={coach.id}
                  coach={coach}
                  isFavorite={favoriteCoaches.includes(coach.id)}
                  onToggleFavorite={toggleFavorite}
                  onViewProfile={setSelectedCoach}
                  onBookSession={handleBookSession}
                  viewMode={viewMode}
                />
              ))}
            </div>
          ) : (
            <Card>
              <Card.Body className="text-center p-12">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  No coaches found
                </h3>
                <p className="text-gray-600 mb-6">
                  {filters.search_query || Object.keys(filters).length > 1
                    ? "Try adjusting your search criteria or filters to find coaches."
                    : "We're working on adding more coaches to our platform. Check back soon!"
                  }
                </p>
                
                {(filters.search_query || Object.keys(filters).length > 1) && (
                  <Button onClick={handleClearFilters} variant="outline">
                    Clear Filters
                  </Button>
                )}
              </Card.Body>
            </Card>
          )}
        </div>
      </div>

      {/* Coach Profile Modal */}
      <CoachProfileModal
        isOpen={selectedCoach !== null}
        onClose={() => setSelectedCoach(null)}
        coach={selectedCoach}
        onBookSession={handleBookSession}
        onGetReviews={getCoachReviews}
      />
    </div>
  );
};

export default CoachMatching;