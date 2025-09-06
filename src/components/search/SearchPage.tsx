/**
 * Search Page Component
 * Main search interface combining advanced search and results
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Search,
  Bookmark,
  Share2,
  Download,
  RefreshCw,
  TrendingUp,
  Clock,
  Users
} from 'lucide-react';
import { motion } from 'framer-motion';
import { AdvancedSearch } from './AdvancedSearch';
import { SearchResults } from './SearchResults';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { searchService, SearchFilters, SearchResult } from '../../services/search.service';
import { useAuth } from '../../hooks/useAuth';
import { useDebounce } from '../../hooks/useDebounce';

interface SearchPageProps {
  searchType?: 'coach' | 'course' | 'resource' | 'all';
  className?: string;
}

interface SavedSearch {
  id: string;
  name: string;
  filters: SearchFilters;
  created_at: string;
}

interface PopularSearch {
  query: string;
  count: number;
  category: string;
}

const POPULAR_SEARCHES: PopularSearch[] = [
  { query: 'life coaching', count: 1250, category: 'coaching' },
  { query: 'executive coaching', count: 890, category: 'coaching' },
  { query: 'stress management', count: 670, category: 'wellness' },
  { query: 'goal setting', count: 580, category: 'development' },
  { query: 'career transition', count: 450, category: 'career' },
  { query: 'leadership development', count: 420, category: 'leadership' },
  { query: 'work life balance', count: 380, category: 'wellness' },
  { query: 'confidence building', count: 320, category: 'development' }
];

const TRENDING_TOPICS = [
  'Mindfulness Coaching',
  'Remote Team Leadership', 
  'Digital Detox',
  'Burnout Prevention',
  'Career Pivoting',
  'Emotional Intelligence'
];

export function SearchPage({ 
  searchType = 'all',
  className = ''
}: SearchPageProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Search state
  const [filters, setFilters] = useState<SearchFilters>({});
  const [results, setResults] = useState<SearchResult<any> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  
  // UI state
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [showSaveSearch, setShowSaveSearch] = useState(false);
  const [saveSearchName, setSaveSearchName] = useState('');

  // Initialize filters from URL params
  useEffect(() => {
    const urlFilters: SearchFilters = {};
    
    const query = searchParams.get('q');
    if (query) urlFilters.query = query;
    
    const page = searchParams.get('page');
    if (page) urlFilters.page = parseInt(page);
    
    const sortBy = searchParams.get('sort');
    if (sortBy) urlFilters.sort_by = sortBy;
    
    const sortOrder = searchParams.get('order');
    if (sortOrder) urlFilters.sort_order = sortOrder as 'asc' | 'desc';

    // Parse filter parameters
    const specialization = searchParams.get('specialization');
    if (specialization) urlFilters.specialization = specialization.split(',');
    
    const certification = searchParams.get('certification');
    if (certification) urlFilters.certification_level = certification.split(',');
    
    const minRate = searchParams.get('min_rate');
    const maxRate = searchParams.get('max_rate');
    if (minRate || maxRate) {
      urlFilters.hourly_rate = {
        min: minRate ? parseInt(minRate) : undefined,
        max: maxRate ? parseInt(maxRate) : undefined
      };
    }

    const minExp = searchParams.get('min_exp');
    const maxExp = searchParams.get('max_exp');
    if (minExp || maxExp) {
      urlFilters.experience_years = {
        min: minExp ? parseInt(minExp) : undefined,
        max: maxExp ? parseInt(maxExp) : undefined
      };
    }

    const location = searchParams.get('location_type');
    if (location) {
      urlFilters.location = { type: location as any };
    }

    setFilters(urlFilters);

    // Perform initial search if there are filters
    if (Object.keys(urlFilters).length > 0) {
      performSearch(urlFilters);
    }
  }, []);

  // Update URL when filters change
  const updateUrl = useCallback((newFilters: SearchFilters) => {
    const params = new URLSearchParams();
    
    if (newFilters.query) params.set('q', newFilters.query);
    if (newFilters.page && newFilters.page > 1) params.set('page', newFilters.page.toString());
    if (newFilters.sort_by) params.set('sort', newFilters.sort_by);
    if (newFilters.sort_order) params.set('order', newFilters.sort_order);
    
    if (newFilters.specialization?.length) {
      params.set('specialization', newFilters.specialization.join(','));
    }
    if (newFilters.certification_level?.length) {
      params.set('certification', newFilters.certification_level.join(','));
    }
    if (newFilters.hourly_rate?.min) {
      params.set('min_rate', newFilters.hourly_rate.min.toString());
    }
    if (newFilters.hourly_rate?.max) {
      params.set('max_rate', newFilters.hourly_rate.max.toString());
    }
    if (newFilters.experience_years?.min) {
      params.set('min_exp', newFilters.experience_years.min.toString());
    }
    if (newFilters.experience_years?.max) {
      params.set('max_exp', newFilters.experience_years.max.toString());
    }
    if (newFilters.location?.type) {
      params.set('location_type', newFilters.location.type);
    }

    setSearchParams(params);
  }, [setSearchParams]);

  // Perform search
  const performSearch = useCallback(async (searchFilters: SearchFilters) => {
    setLoading(true);
    setError(null);

    try {
      let searchResults: SearchResult<any>;
      
      switch (searchType) {
        case 'coach':
          searchResults = await searchService.searchCoaches(searchFilters);
          break;
        case 'course':
          searchResults = await searchService.searchCourses(searchFilters);
          break;
        case 'resource':
          searchResults = await searchService.searchResources(searchFilters);
          break;
        default:
          searchResults = await searchService.searchAll(searchFilters);
      }

      setResults(searchResults);
      
      // Save search analytics
      if (user && searchResults.total > 0) {
        await searchService.saveSearch(user.id, searchFilters, searchResults.total);
      }

      // Update suggestions
      if (searchResults.suggestions) {
        setSuggestions(searchResults.suggestions);
      }

    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  }, [searchType, user]);

  // Handle search
  const handleSearch = useCallback((newFilters: SearchFilters) => {
    setFilters(newFilters);
    updateUrl(newFilters);
    performSearch(newFilters);
  }, [updateUrl, performSearch]);

  // Handle filters change
  const handleFiltersChange = useCallback((newFilters: SearchFilters) => {
    setFilters(newFilters);
    updateUrl(newFilters);
  }, [updateUrl]);

  // Handle pagination
  const handlePageChange = useCallback((page: number) => {
    const newFilters = { ...filters, page };
    handleSearch(newFilters);
  }, [filters, handleSearch]);

  // Handle sorting
  const handleSortChange = useCallback((sortBy: string, sortOrder: 'asc' | 'desc') => {
    const newFilters = { 
      ...filters, 
      sort_by: sortBy, 
      sort_order: sortOrder,
      page: 1 
    };
    handleSearch(newFilters);
  }, [filters, handleSearch]);

  // Handle item click
  const handleItemClick = useCallback((item: any, type: string) => {
    switch (type) {
      case 'coach':
        navigate(`/coaches/${item.id}`);
        break;
      case 'course':
        navigate(`/courses/${item.id}`);
        break;
      case 'resource':
        navigate(`/resources/${item.id}`);
        break;
      default:
        console.log('Unknown item type:', type);
    }
  }, [navigate]);

  // Handle popular search click
  const handlePopularSearchClick = useCallback((query: string) => {
    const newFilters = { ...filters, query, page: 1 };
    handleSearch(newFilters);
  }, [filters, handleSearch]);

  // Save search
  const handleSaveSearch = useCallback(async () => {
    if (!user || !saveSearchName.trim()) return;

    try {
      // Implementation would save to database
      const savedSearch: SavedSearch = {
        id: crypto.randomUUID(),
        name: saveSearchName.trim(),
        filters,
        created_at: new Date().toISOString()
      };

      setSavedSearches(prev => [savedSearch, ...prev]);
      setShowSaveSearch(false);
      setSaveSearchName('');
    } catch (err) {
      console.error('Save search error:', err);
    }
  }, [user, saveSearchName, filters]);

  const showEmptyState = !loading && !results;
  const hasResults = results && results.items.length > 0;

  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${className}`}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {searchType === 'all' ? 'Search Everything' : 
           searchType === 'coach' ? 'Find a Coach' :
           searchType === 'course' ? 'Browse Courses' : 'Explore Resources'}
        </h1>
        <p className="text-gray-600">
          Discover the perfect {searchType === 'all' ? 'match' : searchType} for your coaching journey
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Trending Topics */}
          <Card>
            <Card.Header>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Trending Topics
              </h3>
            </Card.Header>
            <Card.Body>
              <div className="flex flex-wrap gap-2">
                {TRENDING_TOPICS.map((topic, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="cursor-pointer hover:bg-blue-100"
                    onClick={() => handlePopularSearchClick(topic)}
                  >
                    {topic}
                  </Badge>
                ))}
              </div>
            </Card.Body>
          </Card>

          {/* Popular Searches */}
          <Card>
            <Card.Header>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Search className="w-5 h-5 mr-2" />
                Popular Searches
              </h3>
            </Card.Header>
            <Card.Body>
              <div className="space-y-2">
                {POPULAR_SEARCHES.slice(0, 6).map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handlePopularSearchClick(search.query)}
                    className="w-full text-left p-2 rounded hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-gray-900 capitalize">{search.query}</span>
                      <span className="text-xs text-gray-500">{search.count}</span>
                    </div>
                  </button>
                ))}
              </div>
            </Card.Body>
          </Card>

          {/* Saved Searches */}
          {user && savedSearches.length > 0 && (
            <Card>
              <Card.Header>
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Bookmark className="w-5 h-5 mr-2" />
                  Saved Searches
                </h3>
              </Card.Header>
              <Card.Body>
                <div className="space-y-2">
                  {savedSearches.slice(0, 5).map((saved) => (
                    <button
                      key={saved.id}
                      onClick={() => handleSearch(saved.filters)}
                      className="w-full text-left p-2 rounded hover:bg-gray-50 transition-colors"
                    >
                      <div className="text-gray-900 font-medium">{saved.name}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(saved.created_at).toLocaleDateString()}
                      </div>
                    </button>
                  ))}
                </div>
              </Card.Body>
            </Card>
          )}
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Search Interface */}
          <AdvancedSearch
            onSearch={handleSearch}
            onFiltersChange={handleFiltersChange}
            initialFilters={filters}
            searchType={searchType}
            suggestions={suggestions}
            loading={loading}
          />

          {/* Search Results Actions */}
          {hasResults && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {user && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowSaveSearch(true)}
                  >
                    <Bookmark className="w-4 h-4 mr-2" />
                    Save Search
                  </Button>
                )}
                
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const url = window.location.href;
                    navigator.clipboard.writeText(url);
                  }}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => performSearch(filters)}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          )}

          {/* Empty State */}
          {showEmptyState && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Start Your Search
              </h3>
              <p className="text-gray-600 mb-6">
                Enter a search term or browse our popular searches to get started
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {POPULAR_SEARCHES.slice(0, 4).map((search, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="cursor-pointer hover:bg-blue-100"
                    onClick={() => handlePopularSearchClick(search.query)}
                  >
                    {search.query}
                  </Badge>
                ))}
              </div>
            </motion.div>
          )}

          {/* Search Results */}
          <SearchResults
            results={results}
            loading={loading}
            error={error}
            searchType={searchType}
            onPageChange={handlePageChange}
            onSortChange={handleSortChange}
            onItemClick={handleItemClick}
          />
        </div>
      </div>

      {/* Save Search Modal */}
      {showSaveSearch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Save Search</h3>
            <input
              type="text"
              value={saveSearchName}
              onChange={(e) => setSaveSearchName(e.target.value)}
              placeholder="Enter a name for this search"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
              autoFocus
            />
            <div className="flex justify-end space-x-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowSaveSearch(false);
                  setSaveSearchName('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveSearch}
                disabled={!saveSearchName.trim()}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}