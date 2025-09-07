/**
 * Search System Component for iPEC Coach Connect
 * 
 * Advanced search component with filters, AI-powered suggestions, and
 * comprehensive search across multiple entity types (coaches, sessions, 
 * goals, resources, etc.). Features real-time search, saved searches,
 * and intelligent query expansion.
 * 
 * Features:
 * - Full-text search across multiple entities
 * - Advanced filtering and faceted search
 * - AI-powered search suggestions and query completion
 * - Search history and saved searches
 * - Real-time search results with debouncing
 * - Voice search integration
 * - Search analytics and optimization
 * - Multi-language search support
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowRight,
  Award,
  Bookmark,
  BookOpen,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  DollarSign,
  Download,
  Eye,
  Filter,
  History,
  Loader2,
  MapPin,
  MessageSquare,
  Mic,
  MicOff,
  RefreshCw,
  Save,
  Search,
  Settings,
  Share2,
  SlidersHorizontal,
  Sparkles,
  Star,
  Target,
  Trash2,
  TrendingUp,
  User,
  X,
  Zap
} from 'lucide-react';
import { 
  useAuth, 
  useClientProfile,
  useDashboardMetrics,
  useUserRoles 
} from '../../stores/unified-user-store';
import type { ExtendedUserRole } from '../../services/enhanced-auth.service';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { Modal } from '../ui/Modal';
import { Tooltip } from '../ui/Tooltip';
import { toast } from '../ui/Toast';
import { Tabs } from '../ui/Tabs';
import { EnhancedRoleGuard } from '../auth/EnhancedRoleGuard';

// =====================================================================
// TYPES AND INTERFACES
// =====================================================================

interface SearchEntity {
  id: string;
  type: 'coach' | 'session' | 'goal' | 'resource' | 'community' | 'event' | 'message';
  title: string;
  description?: string;
  content?: string;
  metadata: Record<string, any>;
  relevance_score: number;
  created_at: string;
  updated_at: string;
  tags?: string[];
  author?: {
    id: string;
    name: string;
    avatar_url?: string;
    role: string;
  };
}

interface SearchFilters {
  entity_types: SearchEntity['type'][];
  date_range?: {
    start: Date;
    end: Date;
  };
  location?: string;
  price_range?: {
    min: number;
    max: number;
  };
  rating_min?: number;
  specialties?: string[];
  availability?: 'immediate' | 'this_week' | 'this_month' | 'flexible';
  sort_by: 'relevance' | 'date' | 'rating' | 'price' | 'popularity';
  sort_order: 'asc' | 'desc';
  tags?: string[];
  author_roles?: ExtendedUserRole[];
}

interface SearchSuggestion {
  id: string;
  query: string;
  type: 'completion' | 'correction' | 'related' | 'trending';
  relevance: number;
  metadata?: Record<string, any>;
}

interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: SearchFilters;
  created_at: string;
  last_used: string;
  usage_count: number;
  alert_enabled: boolean;
}

interface SearchHistory {
  id: string;
  query: string;
  filters: SearchFilters;
  results_count: number;
  searched_at: string;
  execution_time_ms: number;
}

interface SearchAnalytics {
  total_searches: number;
  unique_queries: number;
  avg_results_per_search: number;
  avg_execution_time: number;
  popular_queries: {
    query: string;
    count: number;
    avg_click_position: number;
  }[];
  popular_filters: {
    filter: string;
    usage_percentage: number;
  }[];
  conversion_metrics: {
    search_to_action: number;
    search_to_booking: number;
    search_to_contact: number;
  };
}

// =====================================================================
// SEARCH DATA HOOKS
// =====================================================================

const useSearchSystem = () => {
  const { user } = useAuth();
  const { hasRole } = useUserRoles();
  
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchEntity[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [analytics, setAnalytics] = useState<SearchAnalytics | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Voice search state
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check for voice search support
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setVoiceSupported(true);
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';
    }
    
    // Load saved searches and history
    loadSavedSearches();
    loadSearchHistory();
    loadAnalytics();
  }, []);

  const performSearch = async (
    query: string, 
    filters: SearchFilters,
    trackHistory = true
  ): Promise<SearchEntity[]> => {
    if (!query.trim() && filters.entity_types.length === 0) {
      setResults([]);
      return [];
    }

    setIsSearching(true);
    setError(null);
    const startTime = Date.now();
    
    try {
      // This would call your search API
      // For now, using mock data with realistic search behavior
      await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));
      
      const mockResults: SearchEntity[] = [
        {
          id: '1',
          type: 'coach',
          title: 'Sarah Johnson - Leadership Coach',
          description: 'Certified iPEC coach specializing in executive leadership development and team dynamics.',
          metadata: {
            specialties: ['Leadership Development', 'Executive Coaching', 'Team Building'],
            rating: 4.9,
            sessions_completed: 150,
            price_per_session: 150,
            location: 'New York, NY',
            availability: 'this_week',
            certifications: ['PCC', 'iPEC Certified']
          },
          relevance_score: 0.95,
          created_at: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
          tags: ['leadership', 'executive', 'team-building', 'communication'],
          author: {
            id: 'coach1',
            name: 'Sarah Johnson',
            avatar_url: 'https://images.unsplash.com/photo-1573496799652-408c2ac9fe98?auto=format&fit=crop&q=80',
            role: 'coach'
          }
        },
        {
          id: '2',
          type: 'session',
          title: 'Leadership Development Intensive',
          description: 'A comprehensive 90-minute session focused on building executive presence and communication skills.',
          content: 'This session will cover key leadership principles, communication strategies, and practical exercises to enhance your executive presence.',
          metadata: {
            duration_minutes: 90,
            price: 200,
            session_type: 'intensive',
            coach_id: 'coach1',
            available_times: ['2024-01-15T14:00:00Z', '2024-01-16T16:00:00Z'],
            materials_included: true
          },
          relevance_score: 0.88,
          created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
          tags: ['leadership', 'intensive', 'communication', 'executive-presence'],
          author: {
            id: 'coach1',
            name: 'Sarah Johnson',
            avatar_url: 'https://images.unsplash.com/photo-1573496799652-408c2ac9fe98?auto=format&fit=crop&q=80',
            role: 'coach'
          }
        },
        {
          id: '3',
          type: 'goal',
          title: 'Improve Team Communication',
          description: 'Develop better communication strategies and build stronger relationships with team members.',
          metadata: {
            category: 'professional',
            target_date: '2024-06-01',
            progress_percentage: 65,
            milestones_count: 5,
            habits_count: 3,
            coach_assigned: true
          },
          relevance_score: 0.82,
          created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          tags: ['communication', 'team-building', 'leadership', 'professional-development']
        },
        {
          id: '4',
          type: 'resource',
          title: 'The Leadership Challenge: Complete Guide',
          description: 'Comprehensive resource covering modern leadership principles and practical implementation strategies.',
          content: 'A detailed guide that explores the five practices of exemplary leadership and provides actionable frameworks for implementation.',
          metadata: {
            resource_type: 'guide',
            format: 'pdf',
            pages: 45,
            reading_time_minutes: 120,
            difficulty_level: 'intermediate',
            downloads: 1250,
            rating: 4.7
          },
          relevance_score: 0.75,
          created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          tags: ['leadership', 'guide', 'management', 'best-practices'],
          author: {
            id: 'admin1',
            name: 'iPEC Content Team',
            role: 'admin'
          }
        },
        {
          id: '5',
          type: 'community',
          title: 'Leadership Development Discussion',
          description: 'Active community discussion about effective leadership strategies and real-world applications.',
          content: 'Join the conversation about modern leadership challenges and share your experiences with fellow coaches and clients.',
          metadata: {
            post_count: 23,
            participant_count: 15,
            last_activity: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            category: 'leadership',
            is_featured: true
          },
          relevance_score: 0.70,
          created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          tags: ['leadership', 'community', 'discussion', 'networking']
        }
      ];

      // Apply filters
      let filteredResults = mockResults;
      
      if (filters.entity_types.length > 0) {
        filteredResults = filteredResults.filter(result => 
          filters.entity_types.includes(result.type)
        );
      }

      if (filters.rating_min) {
        filteredResults = filteredResults.filter(result => 
          (result.metadata.rating || 0) >= filters.rating_min!
        );
      }

      if (filters.price_range) {
        filteredResults = filteredResults.filter(result => {
          const price = result.metadata.price || result.metadata.price_per_session || 0;
          return price >= filters.price_range!.min && price <= filters.price_range!.max;
        });
      }

      if (filters.specialties && filters.specialties.length > 0) {
        filteredResults = filteredResults.filter(result => {
          const specialties = result.metadata.specialties || [];
          return filters.specialties!.some(specialty => 
            specialties.includes(specialty) || 
            result.tags?.includes(specialty.toLowerCase().replace(/\s+/g, '-'))
          );
        });
      }

      // Apply sorting
      filteredResults.sort((a, b) => {
        switch (filters.sort_by) {
          case 'relevance':
            return filters.sort_order === 'asc' 
              ? a.relevance_score - b.relevance_score
              : b.relevance_score - a.relevance_score;
          case 'date':
            return filters.sort_order === 'asc'
              ? new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
              : new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
          case 'rating':
            const ratingA = a.metadata.rating || 0;
            const ratingB = b.metadata.rating || 0;
            return filters.sort_order === 'asc' ? ratingA - ratingB : ratingB - ratingA;
          case 'price':
            const priceA = a.metadata.price || a.metadata.price_per_session || 0;
            const priceB = b.metadata.price || b.metadata.price_per_session || 0;
            return filters.sort_order === 'asc' ? priceA - priceB : priceB - priceA;
          default:
            return 0;
        }
      });

      const executionTime = Date.now() - startTime;
      setResults(filteredResults);

      // Track search in history
      if (trackHistory) {
        const historyEntry: SearchHistory = {
          id: Date.now().toString(),
          query,
          filters,
          results_count: filteredResults.length,
          searched_at: new Date().toISOString(),
          execution_time_ms: executionTime
        };
        
        setSearchHistory(prev => [historyEntry, ...prev.slice(0, 49)]); // Keep last 50
      }

      return filteredResults;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Search failed';
      setError(error);
  void oast.error(error);
      return [];
    } finally {
      setIsSearching(false);
    }
  };

  const generateSuggestions = async (query: string): Promise<SearchSuggestion[]> => {
    if (!query.trim()) {
      setSuggestions([]);
      return [];
    }

    try {
      // Mock AI-powered suggestions
      const mockSuggestions: SearchSuggestion[] = [
        {
          id: '1',
          query: 'leadership development coaching',
          type: 'completion',
          relevance: 0.95
        },
        {
          id: '2',
          query: 'executive coaching sessions',
          type: 'related',
          relevance: 0.88
        },
        {
          id: '3',
          query: 'team building workshops',
          type: 'related',
          relevance: 0.82
        },
        {
          id: '4',
          query: 'communication skills training',
          type: 'trending',
          relevance: 0.75,
          metadata: { trending_since: '2024-01-01' }
        }
      ].filter(suggestion => 
        suggestion.query.toLowerCase().includes(query.toLowerCase()) ||
        query.toLowerCase().includes(suggestion.query.toLowerCase())
      );

      setSuggestions(mockSuggestions);
      return mockSuggestions;
    } catch (err) {
  void console.error('Failed to generate suggestions:', err);
      return [];
    }
  };

  const saveSearch = async (name: string, query: string, filters: SearchFilters) => {
    try {
      const savedSearch: SavedSearch = {
        id: Date.now().toString(),
        name,
        query,
        filters,
        created_at: new Date().toISOString(),
        last_used: new Date().toISOString(),
        usage_count: 1,
        alert_enabled: false
      };
      
      setSavedSearches(prev => [savedSearch, ...prev]);
  void oast.success('Search saved successfully!');
      return savedSearch;
    } catch (err) {
  void oast.error('Failed to save search');
      throw err;
    }
  };

  const loadSavedSearch = async (savedSearch: SavedSearch) => {
    try {
      // Update usage stats
      setSavedSearches(prev => prev.map(search =>
        search.id === savedSearch.id
          ? {
              ...search,
              last_used: new Date().toISOString(),
              usage_count: search.usage_count + 1
            }
          : search
      ));

      return await performSearch(savedSearch.query, savedSearch.filters);
    } catch (err) {
  void oast.error('Failed to load saved search');
      throw err;
    }
  };

  const startVoiceSearch = () => {
    if (!voiceSupported || !recognitionRef.current) return;

    setIsListening(true);
    recognitionRef.current.onresult = (event: any) => {
      const {transcript} = event.results[0][0];
      setIsListening(false);
      // Return transcript for parent component to use
      return transcript;
    };

    recognitionRef.current.onerror = () => {
      setIsListening(false);
  void oast.error('Voice search failed. Please try again.');
    };

    recognitionRef.current.start();
  };

  const stopVoiceSearch = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const loadSavedSearches = async () => {
    // This would load from your backend
    // Mock data for now
    const mockSavedSearches: SavedSearch[] = [
      {
        id: '1',
        name: 'Leadership Coaches in NYC',
        query: 'leadership coaching',
        filters: {
          entity_types: ['coach'],
          location: 'New York, NY',
          specialties: ['Leadership Development'],
          sort_by: 'rating',
          sort_order: 'desc'
        },
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        last_used: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        usage_count: 5,
        alert_enabled: true
      }
    ];
    
    setSavedSearches(mockSavedSearches);
  };

  const loadSearchHistory = async () => {
    // Mock search history
    const mockHistory: SearchHistory[] = [
      {
        id: '1',
        query: 'executive coaching',
        filters: {
          entity_types: ['coach', 'session'],
          sort_by: 'relevance',
          sort_order: 'desc'
        },
        results_count: 12,
        searched_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        execution_time_ms: 285
      },
      {
        id: '2',
        query: 'team building',
        filters: {
          entity_types: ['resource', 'community'],
          sort_by: 'date',
          sort_order: 'desc'
        },
        results_count: 8,
        searched_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        execution_time_ms: 192
      }
    ];
    
    setSearchHistory(mockHistory);
  };

  const loadAnalytics = async () => {
    // Mock analytics data
    const mockAnalytics: SearchAnalytics = {
      total_searches: 234,
      unique_queries: 89,
      avg_results_per_search: 8.5,
      avg_execution_time: 245,
      popular_queries: [
        { query: 'leadership coaching', count: 45, avg_click_position: 2.1 },
        { query: 'executive development', count: 32, avg_click_position: 1.8 },
        { query: 'team building', count: 28, avg_click_position: 2.5 }
      ],
      popular_filters: [
        { filter: 'entity_type:coach', usage_percentage: 78 },
        { filter: 'rating:4+', usage_percentage: 65 },
        { filter: 'sort:rating', usage_percentage: 52 }
      ],
      conversion_metrics: {
        search_to_action: 0.34,
        search_to_booking: 0.12,
        search_to_contact: 0.18
      }
    };
    
    setAnalytics(mockAnalytics);
  };

  return {
    // State
    isSearching,
    results,
    suggestions,
    savedSearches,
    searchHistory,
    analytics,
    error,
    isListening,
    voiceSupported,
    
    // Actions
    performSearch,
    generateSuggestions,
    saveSearch,
    loadSavedSearch,
    startVoiceSearch,
    stopVoiceSearch
  };
};

// =====================================================================
// SEARCH RESULT COMPONENTS
// =====================================================================

const SearchResultCard: React.FC<{
  result: SearchEntity;
  onAction?: (action: string, result: SearchEntity) => void;
}> = ({ result, onAction }) => {
  const getEntityIcon = (type: SearchEntity['type']) => {
    const icons = {
      coach: User,
      session: Calendar,
      goal: Target,
      resource: BookOpen,
      community: MessageSquare,
      event: Calendar,
      message: MessageSquare
    };
    return icons[type] || Search;
  };

  const getEntityTypeLabel = (type: SearchEntity['type']) => {
    const labels = {
      coach: 'Coach',
      session: 'Session',
      goal: 'Goal',
      resource: 'Resource',
      community: 'Community',
      event: 'Event',
      message: 'Message'
    };
    return labels[type] || type;
  };

  const formatMetadata = (metadata: Record<string, any>, type: SearchEntity['type']) => {
    switch (type) {
      case 'coach':
        return (
          <div className="flex items-center gap-4 text-sm text-gray-600">
            {metadata.rating && (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span>{metadata.rating}</span>
              </div>
            )}
            {metadata.price_per_session && (
              <div className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                <span>${metadata.price_per_session}/session</span>
              </div>
            )}
            {metadata.location && (
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{metadata.location}</span>
              </div>
            )}
          </div>
        );
      case 'session':
        return (
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{metadata.duration_minutes} min</span>
            </div>
            {metadata.price && (
              <div className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                <span>${metadata.price}</span>
              </div>
            )}
            <Badge variant="outline">{metadata.session_type}</Badge>
          </div>
        );
      case 'goal':
        return (
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              <span>{metadata.progress_percentage}% complete</span>
            </div>
            {metadata.target_date && (
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>Due {new Date(metadata.target_date).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        );
      case 'resource':
        return (
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <Badge variant="outline">{metadata.resource_type}</Badge>
            {metadata.reading_time_minutes && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{metadata.reading_time_minutes} min read</span>
              </div>
            )}
            {metadata.rating && (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span>{metadata.rating}</span>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const Icon = getEntityIcon(result.type);

  return (
    <Card className="hover:shadow-md transition-all duration-200 cursor-pointer">
      <Card.Body className="p-6">
        <div className="flex items-start gap-4">
          <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
            result.type === 'coach' ? 'bg-blue-100 text-blue-600' :
            result.type === 'session' ? 'bg-green-100 text-green-600' :
            result.type === 'goal' ? 'bg-purple-100 text-purple-600' :
            result.type === 'resource' ? 'bg-orange-100 text-orange-600' :
            'bg-gray-100 text-gray-600'
          }`}>
            <Icon className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900 truncate">{result.title}</h3>
                <Badge variant="outline" size="sm">
                  {getEntityTypeLabel(result.type)}
                </Badge>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Sparkles className="w-3 h-3" />
                  <span>{Math.round(result.relevance_score * 100)}%</span>
                </div>
              </div>
              
              {result.author && (
                <Avatar
                  src={result.author.avatar_url}
                  alt={result.author.name}
                  fallback={result.author.name.charAt(0)}
                  size="sm"
                />
              )}
            </div>

            {result.description && (
              <p className="text-gray-700 text-sm mb-3 line-clamp-2">
                {result.description}
              </p>
            )}

            {formatMetadata(result.metadata, result.type)}

            {result.tags && result.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {result.tags.slice(0, 4).map(tag => (
                  <Badge key={tag} variant="outline" size="sm">
                    {tag}
                  </Badge>
                ))}
                {result.tags.length > 4 && (
                  <Badge variant="outline" size="sm">
                    +{result.tags.length - 4}
                  </Badge>
                )}
              </div>
            )}

            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                <span>Updated {new Date(result.updated_at).toLocaleDateString()}</span>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onAction?.('view', result)}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View
                </Button>
                
                {result.type === 'coach' && (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => onAction?.('contact', result)}
                  >
                    Contact
                  </Button>
                )}
                
                {result.type === 'session' && (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => onAction?.('book', result)}
                  >
                    Book
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

// =====================================================================
// SEARCH FILTERS COMPONENT
// =====================================================================

const SearchFiltersPanel: React.FC<{
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onReset: () => void;
}> = ({ filters, onFiltersChange, onReset }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const entityTypes: { value: SearchEntity['type']; label: string; icon: any }[] = [
    { value: 'coach', label: 'Coaches', icon: User },
    { value: 'session', label: 'Sessions', icon: Calendar },
    { value: 'goal', label: 'Goals', icon: Target },
    { value: 'resource', label: 'Resources', icon: BookOpen },
    { value: 'community', label: 'Community', icon: MessageSquare },
    { value: 'event', label: 'Events', icon: Calendar }
  ];

  const specialties = [
    'Leadership Development',
    'Executive Coaching',
    'Career Development',
    'Team Building',
    'Work-Life Balance',
    'Communication Skills',
    'Stress Management',
    'Goal Setting',
    'Performance Improvement',
    'Conflict Resolution'
  ];

  const updateFilter = <K extends keyof SearchFilters>(
    key: K,
    value: SearchFilters[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const hasActiveFilters = () => {
    return (
      filters.entity_types.length > 0 ||
      filters.date_range ||
      filters.location ||
      filters.price_range ||
      filters.rating_min ||
      filters.specialties?.length ||
      filters.availability ||
      filters.tags?.length ||
      filters.author_roles?.length
    );
  };

  return (
    <Card>
      <Card.Body className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-gray-600" />
            <h3 className="font-medium text-gray-900">Filters</h3>
            {hasActiveFilters() && (
              <Badge variant="primary" size="sm">
                Active
              </Badge>
            )}
          </div>
          
          <div className="flex gap-2">
            {hasActiveFilters() && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onReset}
              >
                Reset
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-6"
            >
              {/* Entity Types */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Content Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {entityTypes.map(type => {
                    const Icon = type.icon;
                    const isSelected = filters.entity_types.includes(type.value);
                    
                    return (
                      <button
                        key={type.value}
                        onClick={() => {
                          const newTypes = isSelected
                            ? filters.entity_types.filter(t => t !== type.value)
                            : [...filters.entity_types, type.value];
                          updateFilter('entity_types', newTypes);
                        }}
                        className={`p-3 border rounded-lg text-left transition-colors ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          <span className="text-sm">{type.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Rating Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Rating
                </label>
                <Select
                  value={filters.rating_min?.toString() || ''}
                  onChange={(value) => updateFilter('rating_min', value ? parseFloat(value) : undefined)}
                >
                  <option value="">Any Rating</option>
                  <option value="4.5">4.5+ Stars</option>
                  <option value="4">4+ Stars</option>
                  <option value="3.5">3.5+ Stars</option>
                  <option value="3">3+ Stars</option>
                </Select>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Range
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    placeholder="Min $"
                    value={filters.price_range?.min || ''}
                    onChange={(e) => updateFilter('price_range', {
                      min: parseInt(e.target.value) || 0,
                      max: filters.price_range?.max || 1000
                    })}
                  />
                  <Input
                    type="number"
                    placeholder="Max $"
                    value={filters.price_range?.max || ''}
                    onChange={(e) => updateFilter('price_range', {
                      min: filters.price_range?.min || 0,
                      max: parseInt(e.target.value) || 1000
                    })}
                  />
                </div>
              </div>

              {/* Specialties */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specialties
                </label>
                <Select
                  value=""
                  onChange={(value) => {
                    if (value && !filters.specialties?.includes(value)) {
                      updateFilter('specialties', [...(filters.specialties || []), value]);
                    }
                  }}
                >
                  <option value="">Add specialty...</option>
                  {specialties.map(specialty => (
                    <option key={specialty} value={specialty}>
                      {specialty}
                    </option>
                  ))}
                </Select>
                
                {filters.specialties && filters.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {filters.specialties.map(specialty => (
                      <Badge
                        key={specialty}
                        variant="primary"
                        className="cursor-pointer"
                        onClick={() => updateFilter('specialties', 
                          filters.specialties!.filter(s => s !== specialty)
                        )}
                      >
                        {specialty}
                        <X className="w-3 h-3 ml-1" />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Availability */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Availability
                </label>
                <Select
                  value={filters.availability || ''}
                  onChange={(value) => updateFilter('availability', value as any)}
                >
                  <option value="">Any Time</option>
                  <option value="immediate">Available Now</option>
                  <option value="this_week">This Week</option>
                  <option value="this_month">This Month</option>
                  <option value="flexible">Flexible</option>
                </Select>
              </div>

              {/* Sort Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    value={filters.sort_by}
                    onChange={(value) => updateFilter('sort_by', value as any)}
                  >
                    <option value="relevance">Relevance</option>
                    <option value="date">Date</option>
                    <option value="rating">Rating</option>
                    <option value="price">Price</option>
                    <option value="popularity">Popularity</option>
                  </Select>
                  
                  <Select
                    value={filters.sort_order}
                    onChange={(value) => updateFilter('sort_order', value as any)}
                  >
                    <option value="desc">High to Low</option>
                    <option value="asc">Low to High</option>
                  </Select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card.Body>
    </Card>
  );
};

// =====================================================================
// MAIN SEARCH COMPONENT
// =====================================================================

export const SearchSystem: React.FC = () => {
  const { user } = useAuth();
  const { hasRole } = useUserRoles();
  const {
    isSearching,
    results,
    suggestions,
    savedSearches,
    searchHistory,
    analytics,
    error,
    isListening,
    voiceSupported,
    performSearch,
    generateSuggestions,
    saveSearch,
    loadSavedSearch,
    startVoiceSearch,
    stopVoiceSearch
  } = useSearchSystem();

  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    entity_types: [],
    sort_by: 'relevance',
    sort_order: 'desc'
  });
  
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveSearchName, setSaveSearchName] = useState('');
  const [selectedTab, setSelectedTab] = useState<'results' | 'saved' | 'history' | 'analytics'>('results');

  // Debounced search
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        generateSuggestions(query);
        performSearch(query, filters);
      }, 300);
    } else {
      generateSuggestions('');
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, filters]);

  const handleSearch = (searchQuery: string = query) => {
    if (searchQuery.trim()) {
      performSearch(searchQuery, filters);
      setShowSuggestions(false);
      setQuery(searchQuery);
    }
  };

  const handleVoiceSearch = () => {
    if (isListening) {
      stopVoiceSearch();
    } else {
      startVoiceSearch();
    }
  };

  const handleSaveSearch = async () => {
    if (saveSearchName.trim() && query.trim()) {
      await saveSearch(saveSearchName, query, filters);
      setSaveSearchName('');
      setShowSaveModal(false);
    }
  };

  const handleLoadSavedSearch = async (savedSearch: SavedSearch) => {
    setQuery(savedSearch.query);
    setFilters(savedSearch.filters);
    await loadSavedSearch(savedSearch);
    setSelectedTab('results');
  };

  const handleResultAction = (action: string, result: SearchEntity) => {
    switch (action) {
      case 'view':
        // Navigate to detailed view
  void oast.info(`Viewing ${result.title}`);
        break;
      case 'contact':
        // Open contact modal
  void oast.info(`Contacting ${result.title}`);
        break;
      case 'book':
        // Open booking modal
  void oast.info(`Booking ${result.title}`);
        break;
      default:
        break;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Search</h2>
          <p className="text-gray-600">
            Find coaches, sessions, resources, and more across the platform
          </p>
        </div>
      </div>

      {/* Search Input */}
      <Card>
        <Card.Body className="p-4">
          <div className="relative">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  ref={searchInputRef}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="Search for coaches, sessions, goals, resources..."
                  className="pl-10 pr-12"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                
                {/* Voice Search */}
                {voiceSupported && (
                  <button
                    onClick={handleVoiceSearch}
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded ${
                      isListening 
                        ? 'text-red-500 animate-pulse' 
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                )}
              </div>
              
              <Button onClick={() => handleSearch()} disabled={isSearching}>
                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Search
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setShowSaveModal(true)}
                disabled={!query.trim()}
              >
                <Save className="w-4 h-4" />
              </Button>
            </div>

            {/* Suggestions Dropdown */}
            <AnimatePresence>
              {showSuggestions && suggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-50"
                >
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      onClick={() => {
                        setQuery(suggestion.query);
                        handleSearch(suggestion.query);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 first:rounded-t-lg last:rounded-b-lg"
                    >
                      <Search className="w-4 h-4 text-gray-400" />
                      <span>{suggestion.query}</span>
                      {suggestion.type === 'trending' && (
                        <Badge variant="outline" size="sm">
                          Trending
                        </Badge>
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Card.Body>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Panel */}
        <div className="lg:col-span-1">
          <SearchFiltersPanel
            filters={filters}
            onFiltersChange={setFilters}
            onReset={() => setFilters({
              entity_types: [],
              sort_by: 'relevance',
              sort_order: 'desc'
            })}
          />
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-3">
          <Card>
            <Card.Body className="p-0">
              {/* Tabs */}
              <div className="border-b">
                <Tabs
                  value={selectedTab}
                  onValueChange={(value) => setSelectedTab(value as typeof selectedTab)}
                  className="p-4"
                >
                  <Tabs.List>
                    <Tabs.Trigger value="results">
                      Results
                      {results.length > 0 && (
                        <Badge variant="outline" size="sm" className="ml-2">
                          {results.length}
                        </Badge>
                      )}
                    </Tabs.Trigger>
                    <Tabs.Trigger value="saved">
                      Saved
                      <Badge variant="outline" size="sm" className="ml-2">
                        {savedSearches.length}
                      </Badge>
                    </Tabs.Trigger>
                    <Tabs.Trigger value="history">History</Tabs.Trigger>
                    <EnhancedRoleGuard roles={['coach', 'admin']}>
                      <Tabs.Trigger value="analytics">Analytics</Tabs.Trigger>
                    </EnhancedRoleGuard>
                  </Tabs.List>
                </Tabs>
              </div>

              <div className="p-6">
                {/* Search Results */}
                {selectedTab === 'results' && (
                  <div>
                    {error ? (
                      <div className="text-center p-8">
                        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Search Error</h3>
                        <p className="text-gray-600">{error}</p>
                      </div>
                    ) : isSearching ? (
                      <div className="text-center p-8">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
                        <p className="text-gray-600">Searching...</p>
                      </div>
                    ) : results.length > 0 ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-600">
                            Found {results.length} result{results.length !== 1 ? 's' : ''}
                            {query && ` for "${query}"`}
                          </p>
                        </div>
                        
                        {results.map((result) => (
                          <SearchResultCard
                            key={result.id}
                            result={result}
                            onAction={handleResultAction}
                          />
                        ))}
                      </div>
                    ) : query ? (
                      <div className="text-center p-8">
                        <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                        <p className="text-gray-600">
                          Try adjusting your search terms or filters
                        </p>
                      </div>
                    ) : (
                      <div className="text-center p-8">
                        <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Start searching</h3>
                        <p className="text-gray-600">
                          Enter a search term to find coaches, sessions, and resources
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Saved Searches */}
                {selectedTab === 'saved' && (
                  <div className="space-y-4">
                    {savedSearches.length > 0 ? (
                      savedSearches.map((savedSearch) => (
                        <Card key={savedSearch.id} className="hover:shadow-md transition-shadow">
                          <Card.Body className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900">{savedSearch.name}</h4>
                                <p className="text-sm text-gray-600">"{savedSearch.query}"</p>
                                <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                                  <span>Used {savedSearch.usage_count} times</span>
                                  <span>Last used {new Date(savedSearch.last_used).toLocaleDateString()}</span>
                                </div>
                              </div>
                              
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleLoadSavedSearch(savedSearch)}
                                >
                                  Load
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    // Delete saved search
  void oast.info('Delete functionality would be implemented here');
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </Card.Body>
                        </Card>
                      ))
                    ) : (
                      <div className="text-center p-8">
                        <Bookmark className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No saved searches</h3>
                        <p className="text-gray-600">
                          Save your frequent searches for quick access
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Search History */}
                {selectedTab === 'history' && (
                  <div className="space-y-4">
                    {searchHistory.length > 0 ? (
                      searchHistory.map((historyItem) => (
                        <Card key={historyItem.id} className="hover:shadow-md transition-shadow">
                          <Card.Body className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">"{historyItem.query}"</p>
                                <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                                  <span>{historyItem.results_count} results</span>
                                  <span>{historyItem.execution_time_ms}ms</span>
                                  <span>{new Date(historyItem.searched_at).toLocaleDateString()}</span>
                                </div>
                              </div>
                              
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setQuery(historyItem.query);
                                  setFilters(historyItem.filters);
                                  handleSearch(historyItem.query);
                                  setSelectedTab('results');
                                }}
                              >
                                <RefreshCw className="w-4 h-4 mr-1" />
                                Repeat
                              </Button>
                            </div>
                          </Card.Body>
                        </Card>
                      ))
                    ) : (
                      <div className="text-center p-8">
                        <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No search history</h3>
                        <p className="text-gray-600">
                          Your recent searches will appear here
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Analytics */}
                {selectedTab === 'analytics' && analytics && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card>
                        <Card.Body className="p-4 text-center">
                          <div className="text-2xl font-bold text-blue-600">{analytics.total_searches}</div>
                          <div className="text-sm text-gray-600">Total Searches</div>
                        </Card.Body>
                      </Card>
                      
                      <Card>
                        <Card.Body className="p-4 text-center">
                          <div className="text-2xl font-bold text-green-600">{analytics.unique_queries}</div>
                          <div className="text-sm text-gray-600">Unique Queries</div>
                        </Card.Body>
                      </Card>
                      
                      <Card>
                        <Card.Body className="p-4 text-center">
                          <div className="text-2xl font-bold text-purple-600">{analytics.avg_results_per_search}</div>
                          <div className="text-sm text-gray-600">Avg Results</div>
                        </Card.Body>
                      </Card>
                      
                      <Card>
                        <Card.Body className="p-4 text-center">
                          <div className="text-2xl font-bold text-orange-600">{analytics.avg_execution_time}ms</div>
                          <div className="text-sm text-gray-600">Avg Speed</div>
                        </Card.Body>
                      </Card>
                    </div>

                    <Card>
                      <Card.Body className="p-6">
                        <h3 className="font-semibold text-gray-900 mb-4">Popular Queries</h3>
                        <div className="space-y-3">
                          {analytics.popular_queries.map((query, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <span className="text-gray-900">{query.query}</span>
                              <div className="flex items-center gap-3 text-sm text-gray-600">
                                <span>{query.count} searches</span>
                                <span>Pos. {query.avg_click_position}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card.Body>
                    </Card>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>

      {/* Save Search Modal */}
      <Modal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        title="Save Search"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Name
            </label>
            <Input
              value={saveSearchName}
              onChange={(e) => setSaveSearchName(e.target.value)}
              placeholder="e.g., Leadership Coaches in NYC"
              autoFocus
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Query
            </label>
            <Input value={query} disabled />
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowSaveModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveSearch}
              disabled={!saveSearchName.trim()}
              className="flex-1"
            >
              Save Search
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SearchSystem;