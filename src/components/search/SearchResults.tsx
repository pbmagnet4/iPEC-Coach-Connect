/**
 * Search Results Component
 * Display and interaction for search results with pagination
 */

import React, { useState } from 'react';
import { 
  AlertCircle,
  BookOpen,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
  ExternalLink,
  FileText,
  Filter,
  Grid,
  List,
  Loader,
  MapPin,
  MessageSquare,
  Star,
  User
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import type { Coach, SearchableContent, SearchFilters, SearchResult } from '../../services/search.service';

interface SearchResultsProps {
  results: SearchResult<any> | null;
  loading?: boolean;
  error?: string;
  searchType?: 'coach' | 'course' | 'resource' | 'all';
  onPageChange: (page: number) => void;
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  onItemClick: (item: any, type: string) => void;
  className?: string;
}

type ViewMode = 'grid' | 'list';

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance', field: '', order: 'desc' },
  { value: 'rating_desc', label: 'Rating (High to Low)', field: 'rating', order: 'desc' },
  { value: 'rating_asc', label: 'Rating (Low to High)', field: 'rating', order: 'asc' },
  { value: 'price_asc', label: 'Price (Low to High)', field: 'hourly_rate', order: 'asc' },
  { value: 'price_desc', label: 'Price (High to Low)', field: 'hourly_rate', order: 'desc' },
  { value: 'experience_desc', label: 'Most Experienced', field: 'experience_years', order: 'desc' },
  { value: 'newest', label: 'Newest', field: 'created_at', order: 'desc' },
  { value: 'oldest', label: 'Oldest', field: 'created_at', order: 'asc' }
];

export function SearchResults({
  results,
  loading = false,
  error,
  searchType = 'all',
  onPageChange,
  onSortChange,
  onItemClick,
  className = ''
}: SearchResultsProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState('relevance');

  const handleSortChange = (value: string) => {
    setSortBy(value);
    const option = SORT_OPTIONS.find(opt => opt.value === value);
    if (option) {
      onSortChange(option.field, option.order as 'asc' | 'desc');
    }
  };

  const renderPagination = () => {
    if (!results || results.total_pages <= 1) return null;

    const { page, total_pages } = results;
    const maxVisiblePages = 7;
    
    let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(total_pages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    const pages = Array.from(
      { length: endPage - startPage + 1 }, 
      (_, i) => startPage + i
    );

    return (
      <div className="flex items-center justify-center space-x-2 mt-8">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        {startPage > 1 && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPageChange(1)}
            >
              1
            </Button>
            {startPage > 2 && (
              <span className="text-gray-400">...</span>
            )}
          </>
        )}

        {pages.map(pageNum => (
          <Button
            key={pageNum}
            variant={pageNum === page ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => onPageChange(pageNum)}
          >
            {pageNum}
          </Button>
        ))}

        {endPage < total_pages && (
          <>
            {endPage < total_pages - 1 && (
              <span className="text-gray-400">...</span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPageChange(total_pages)}
            >
              {total_pages}
            </Button>
          </>
        )}

        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= total_pages}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Searching for the best matches...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Search Error</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }

  if (!results || results.items.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="mb-4">
          <Filter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Results Found</h3>
          <p className="text-gray-600 mb-4">
            Try adjusting your search criteria or filters to find more results.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <p className="text-gray-600">
            Showing {results.items.length} of {results.total} results
            {results.search_time_ms && (
              <span className="text-gray-400 ml-2">
                ({results.search_time_ms}ms)
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center space-x-4">
          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            {SORT_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'list' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Results Grid/List */}
      <AnimatePresence mode="wait">
        <motion.div
          key={viewMode}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.items.map((item, index) => (
                <ResultCard
                  key={item.id || index}
                  item={item}
                  searchType={searchType}
                  onClick={() => onItemClick(item, getItemType(item, searchType))}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {results.items.map((item, index) => (
                <ResultListItem
                  key={item.id || index}
                  item={item}
                  searchType={searchType}
                  onClick={() => onItemClick(item, getItemType(item, searchType))}
                />
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Pagination */}
      {renderPagination()}
    </div>
  );
}

interface ResultCardProps {
  item: any;
  searchType: string;
  onClick: () => void;
}

function ResultCard({ item, searchType, onClick }: ResultCardProps) {
  const itemType = getItemType(item, searchType);

  if (itemType === 'coach') {
    return <CoachCard coach={item} onClick={onClick} />;
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <Card className="h-full cursor-pointer" onClick={onClick}>
        <Card.Body className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                {item.title || item.name}
              </h3>
              <p className="text-gray-600 text-sm line-clamp-3 mb-3">
                {item.description || item.bio}
              </p>
            </div>
            <div className="ml-3">
              {getItemIcon(itemType)}
            </div>
          </div>

          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {item.tags.slice(0, 3).map((tag: string, index: number) => (
                <Badge key={index} variant="secondary" size="sm">
                  {tag}
                </Badge>
              ))}
              {item.tags.length > 3 && (
                <Badge variant="secondary" size="sm">
                  +{item.tags.length - 3} more
                </Badge>
              )}
            </div>
          )}

          <div className="flex items-center justify-between text-sm text-gray-500">
            <span className="capitalize">{itemType}</span>
            {item.created_at && (
              <span>
                {new Date(item.created_at).toLocaleDateString()}
              </span>
            )}
          </div>
        </Card.Body>
      </Card>
    </motion.div>
  );
}

function CoachCard({ coach, onClick }: { coach: Coach; onClick: () => void }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <Card className="h-full cursor-pointer" onClick={onClick}>
        <Card.Body className="space-y-4">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
              {coach.profile_image_url ? (
                <img 
                  src={coach.profile_image_url} 
                  alt={coach.display_name || `${coach.first_name} ${coach.last_name}`}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <span>
                  {coach.first_name?.[0]}{coach.last_name?.[0]}
                </span>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 mb-1">
                {coach.display_name || `${coach.first_name} ${coach.last_name}`}
              </h3>
              <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                {coach.bio}
              </p>
              
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <div className="flex items-center">
                  <Star className="w-3 h-3 text-yellow-500 mr-1" />
                  <span>{coach.rating.toFixed(1)}</span>
                  <span className="ml-1">({coach.review_count})</span>
                </div>
                
                <div className="flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  <span>{coach.experience_years}y exp</span>
                </div>
                
                <div className="flex items-center">
                  <DollarSign className="w-3 h-3 mr-1" />
                  <span>${coach.hourly_rate}/hr</span>
                </div>
              </div>
            </div>
          </div>

          {coach.specializations && coach.specializations.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {coach.specializations.slice(0, 2).map((spec, index) => (
                <Badge key={index} variant="secondary" size="sm">
                  {spec}
                </Badge>
              ))}
              {coach.specializations.length > 2 && (
                <Badge variant="secondary" size="sm">
                  +{coach.specializations.length - 2} more
                </Badge>
              )}
            </div>
          )}

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center text-gray-500">
              <MapPin className="w-3 h-3 mr-1" />
              <span className="capitalize">{coach.location.type}</span>
            </div>
            
            {coach.verified && (
              <Badge variant="success" size="sm">
                Verified
              </Badge>
            )}
          </div>
        </Card.Body>
      </Card>
    </motion.div>
  );
}

interface ResultListItemProps {
  item: any;
  searchType: string;
  onClick: () => void;
}

function ResultListItem({ item, searchType, onClick }: ResultListItemProps) {
  const itemType = getItemType(item, searchType);

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <Card.Body>
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            {getItemIcon(itemType)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">
                  {item.title || item.display_name || `${item.first_name} ${item.last_name}`}
                </h3>
                <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                  {item.description || item.bio}
                </p>
              </div>
              
              <div className="ml-4 text-sm text-gray-500">
                <span className="capitalize">{itemType}</span>
              </div>
            </div>

            {/* Type-specific details */}
            {itemType === 'coach' && (
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <div className="flex items-center">
                  <Star className="w-3 h-3 text-yellow-500 mr-1" />
                  <span>{item.rating?.toFixed(1)} ({item.review_count})</span>
                </div>
                <div className="flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  <span>{item.experience_years}y exp</span>
                </div>
                <div className="flex items-center">
                  <DollarSign className="w-3 h-3 mr-1" />
                  <span>${item.hourly_rate}/hr</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="w-3 h-3 mr-1" />
                  <span className="capitalize">{item.location?.type}</span>
                </div>
              </div>
            )}

            {(item.tags || item.specializations) && (
              <div className="flex flex-wrap gap-1 mt-2">
                {(item.tags || item.specializations || []).slice(0, 4).map((tag: string, index: number) => (
                  <Badge key={index} variant="secondary" size="sm">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card.Body>
    </Card>
  );
}

function getItemType(item: any, searchType: string): string {
  if (searchType !== 'all') return searchType;
  
  if (item.type) return item.type;
  if (item.hourly_rate !== undefined) return 'coach';
  if (item.difficulty_level !== undefined) return 'course';
  return 'resource';
}

function getItemIcon(type: string) {
  const iconClass = "w-8 h-8 text-gray-600";
  
  switch (type) {
    case 'coach':
      return <User className={iconClass} />;
    case 'course':
      return <BookOpen className={iconClass} />;
    case 'resource':
      return <FileText className={iconClass} />;
    default:
      return <FileText className={iconClass} />;
  }
}