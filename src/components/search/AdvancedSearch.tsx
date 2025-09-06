/**
 * Advanced Search Component
 * Comprehensive search interface with filters and suggestions
 */

import React, { useCallback, useEffect, useState } from 'react';
import { 
  BookOpen,
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  DollarSign,
  FileText,
  Filter,
  Loader,
  MapPin,
  Search,
  SlidersHorizontal,
  Star,
  User,
  X
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import type { SearchFilters } from '../../services/search.service';
import { useDebounce } from '../../hooks/useDebounce';

interface AdvancedSearchProps {
  onSearch: (filters: SearchFilters) => void;
  onFiltersChange: (filters: SearchFilters) => void;
  initialFilters?: SearchFilters;
  searchType?: 'coach' | 'course' | 'resource' | 'all';
  placeholder?: string;
  suggestions?: string[];
  loading?: boolean;
  className?: string;
}

interface FilterPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  searchType: string;
}

const SPECIALIZATION_OPTIONS = [
  'Life Coaching',
  'Executive Coaching',
  'Career Coaching',
  'Relationship Coaching',
  'Health & Wellness',
  'Business Coaching',
  'Leadership Development',
  'Personal Development',
  'Stress Management',
  'Goal Achievement'
];

const CERTIFICATION_LEVELS = [
  'ACC (Associate Certified Coach)',
  'PCC (Professional Certified Coach)', 
  'MCC (Master Certified Coach)',
  'iPEC Certified'
];

const SESSION_TYPES = [
  'Individual Coaching',
  'Group Coaching',
  'Workshop',
  'Intensive Session',
  'Discovery Call'
];

const EXPERIENCE_RANGES = [
  { label: 'Any Experience', min: 0, max: undefined },
  { label: '1-3 years', min: 1, max: 3 },
  { label: '3-5 years', min: 3, max: 5 },
  { label: '5-10 years', min: 5, max: 10 },
  { label: '10+ years', min: 10, max: undefined }
];

const RATE_RANGES = [
  { label: 'Any Rate', min: 0, max: undefined },
  { label: '$50-100', min: 50, max: 100 },
  { label: '$100-150', min: 100, max: 150 },
  { label: '$150-200', min: 150, max: 200 },
  { label: '$200+', min: 200, max: undefined }
];

export function AdvancedSearch({
  onSearch,
  onFiltersChange,
  initialFilters = {},
  searchType = 'all',
  placeholder = 'Search coaches, courses, and resources...',
  suggestions = [],
  loading = false,
  className = ''
}: AdvancedSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  const debouncedQuery = useDebounce(filters.query || '', 300);

  // Auto-search when query changes (debounced)
  useEffect(() => {
    if (debouncedQuery !== (initialFilters.query || '')) {
      const newFilters = { ...filters, query: debouncedQuery, page: 1 };
      onFiltersChange(newFilters);
      onSearch(newFilters);
    }
  }, [debouncedQuery]);

  const handleQueryChange = (query: string) => {
    setFilters(prev => ({ ...prev, query }));
    setShowSuggestions(query.length > 0 && inputFocused);
  };

  const handleFilterChange = useCallback((key: keyof SearchFilters, value: any) => {
    const newFilters = { 
      ...filters, 
      [key]: value,
      page: 1 // Reset to first page when filters change
    };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  }, [filters, onFiltersChange]);

  const handleSearch = () => {
    onSearch(filters);
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (suggestion: string) => {
    const newFilters = { ...filters, query: suggestion, page: 1 };
    setFilters(newFilters);
    setShowSuggestions(false);
    onSearch(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters: SearchFilters = { query: filters.query };
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
    onSearch(clearedFilters);
  };

  const hasActiveFilters = Object.keys(filters).some(
    key => key !== 'query' && key !== 'page' && key !== 'limit' && filters[key as keyof SearchFilters]
  );

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={filters.query || ''}
            onChange={(e) => handleQueryChange(e.target.value)}
            onFocus={() => {
              setInputFocused(true);
              setShowSuggestions((filters.query || '').length > 0);
            }}
            onBlur={() => {
              setInputFocused(false);
              // Delay hiding suggestions to allow clicks
              setTimeout(() => setShowSuggestions(false), 200);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              }
              if (e.key === 'Escape') {
                setShowSuggestions(false);
              }
            }}
            placeholder={placeholder}
            className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
          />
          
          {/* Loading indicator */}
          {loading && (
            <Loader className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-600 animate-spin" />
          )}
          
          {/* Clear search */}
          {filters.query && !loading && (
            <button
              onClick={() => handleQueryChange('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>

        {/* Search Suggestions */}
        <AnimatePresence>
          {showSuggestions && suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
            >
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg"
                >
                  <span className="text-gray-900">{suggestion}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Filter Toggle and Active Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button
            variant={showFilters ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                !
              </span>
            )}
          </Button>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-gray-600 hover:text-gray-900"
            >
              Clear Filters
            </Button>
          )}
        </div>

        <Button onClick={handleSearch} disabled={loading}>
          {loading ? (
            <>
              <Loader className="w-4 h-4 mr-2 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Search className="w-4 h-4 mr-2" />
              Search
            </>
          )}
        </Button>
      </div>

      {/* Filter Panel */}
      <FilterPanel
        isOpen={showFilters}
        onToggle={() => setShowFilters(!showFilters)}
        filters={filters}
        onFiltersChange={handleFilterChange}
        searchType={searchType}
      />
    </div>
  );
}

function FilterPanel({ 
  isOpen, 
  onToggle, 
  filters, 
  onFiltersChange, 
  searchType 
}: FilterPanelProps) {
  if (!isOpen) return null;

  const handleArrayFilterChange = (key: keyof SearchFilters, value: string, checked: boolean) => {
    const currentArray = (filters[key] as string[]) || [];
    const newArray = checked 
      ? [...currentArray, value]
      : currentArray.filter(item => item !== value);
    
    onFiltersChange(key, newArray.length > 0 ? newArray : undefined);
  };

  const handleRangeFilterChange = (key: keyof SearchFilters, field: 'min' | 'max', value: number | undefined) => {
    const currentRange = filters[key] as any || {};
    const newRange = { ...currentRange, [field]: value };
    
    // Remove undefined values
    if (newRange.min === undefined) delete newRange.min;
    if (newRange.max === undefined) delete newRange.max;
    
    onFiltersChange(key, Object.keys(newRange).length > 0 ? newRange : undefined);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <Card>
          <Card.Body className="space-y-6">
            {/* Coach-specific filters */}
            {(searchType === 'coach' || searchType === 'all') && (
              <>
                {/* Specialization */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    Specialization
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {SPECIALIZATION_OPTIONS.map((spec) => (
                      <label key={spec} className="flex items-center space-x-2 text-sm">
                        <input
                          type="checkbox"
                          checked={(filters.specialization || []).includes(spec)}
                          onChange={(e) => handleArrayFilterChange('specialization', spec, e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-gray-700">{spec}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Experience & Rate */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Experience */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      Experience
                    </h3>
                    <div className="space-y-2">
                      {EXPERIENCE_RANGES.map((range, index) => (
                        <label key={index} className="flex items-center space-x-2 text-sm">
                          <input
                            type="radio"
                            name="experience"
                            checked={
                              filters.experience_years?.min === range.min &&
                              filters.experience_years?.max === range.max
                            }
                            onChange={() => {
                              if (range.min === 0) {
                                onFiltersChange('experience_years', undefined);
                              } else {
                                onFiltersChange('experience_years', {
                                  min: range.min,
                                  max: range.max
                                });
                              }
                            }}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-gray-700">{range.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Hourly Rate */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                      <DollarSign className="w-4 h-4 mr-2" />
                      Hourly Rate
                    </h3>
                    <div className="space-y-2">
                      {RATE_RANGES.map((range, index) => (
                        <label key={index} className="flex items-center space-x-2 text-sm">
                          <input
                            type="radio"
                            name="rate"
                            checked={
                              filters.hourly_rate?.min === range.min &&
                              filters.hourly_rate?.max === range.max
                            }
                            onChange={() => {
                              if (range.min === 0) {
                                onFiltersChange('hourly_rate', undefined);
                              } else {
                                onFiltersChange('hourly_rate', {
                                  min: range.min,
                                  max: range.max
                                });
                              }
                            }}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-gray-700">{range.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Certification Level */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                    <Star className="w-4 h-4 mr-2" />
                    Certification Level
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {CERTIFICATION_LEVELS.map((cert) => (
                      <label key={cert} className="flex items-center space-x-2 text-sm">
                        <input
                          type="checkbox"
                          checked={(filters.certification_level || []).includes(cert)}
                          onChange={(e) => handleArrayFilterChange('certification_level', cert, e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-gray-700">{cert}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Session Types */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    Session Types
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {SESSION_TYPES.map((type) => (
                      <label key={type} className="flex items-center space-x-2 text-sm">
                        <input
                          type="checkbox"
                          checked={(filters.session_types || []).includes(type)}
                          onChange={(e) => handleArrayFilterChange('session_types', type, e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-gray-700">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Location Type */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    Session Format
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {['in_person', 'virtual', 'both'].map((type) => (
                      <label key={type} className="flex items-center space-x-2 text-sm">
                        <input
                          type="radio"
                          name="location_type"
                          value={type}
                          checked={filters.location?.type === type}
                          onChange={(e) => {
                            onFiltersChange('location', {
                              ...filters.location,
                              type: e.target.value as any
                            });
                          }}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-gray-700 capitalize">
                          {type === 'in_person' ? 'In Person' : type === 'virtual' ? 'Virtual' : 'Both'}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Rating */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                    <Star className="w-4 h-4 mr-2" />
                    Minimum Rating
                  </h3>
                  <div className="flex items-center space-x-4">
                    <input
                      type="range"
                      min="0"
                      max="5"
                      step="0.5"
                      value={filters.rating?.min || 0}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        handleRangeFilterChange('rating', 'min', value > 0 ? value : undefined);
                      }}
                      className="flex-1"
                    />
                    <span className="text-sm text-gray-600 min-w-0 w-12">
                      {filters.rating?.min || 0}+ ⭐
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* Course/Resource filters */}
            {(searchType === 'course' || searchType === 'resource' || searchType === 'all') && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Content Type
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {['article', 'video', 'podcast', 'worksheet', 'assessment'].map((type) => (
                    <label key={type} className="flex items-center space-x-2 text-sm">
                      <input
                        type="checkbox"
                        checked={(filters.content_type || []).includes(type)}
                        onChange={(e) => handleArrayFilterChange('content_type', type, e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-gray-700 capitalize">{type}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </Card.Body>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}