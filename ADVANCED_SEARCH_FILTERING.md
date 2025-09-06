# Advanced Search and Filtering System

A comprehensive, high-performance search and filtering system for iPEC Coach Connect providing intelligent search across coaches, courses, and resources with advanced filtering capabilities.

## 🎯 Overview

The Advanced Search and Filtering System provides:

- **Universal Search**: Search across coaches, courses, and resources from a single interface
- **Advanced Filtering**: Multi-dimensional filtering with intelligent suggestions
- **Real-time Results**: Fast, cached search results with sub-second response times
- **Smart Suggestions**: Context-aware search suggestions and autocomplete
- **Search Analytics**: Track search patterns and optimize results
- **Saved Searches**: Allow users to save and recall frequent searches
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Performance Optimized**: Caching, debouncing, and intelligent pagination

## 🏗️ Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                   Search & Filter System                   │
│                                                             │
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │
│ │   Advanced      │ │    Search       │ │    Search       │ │
│ │    Search       │ │   Results       │ │     Page        │ │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘ │
│                                                             │
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │
│ │   Search        │ │   Filter        │ │   Pagination    │ │
│ │ Suggestions     │ │  Management     │ │   & Sorting     │ │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                               │
┌─────────────────────────────────────────────────────────────┐
│                    Core Services                            │
│                                                             │
│ • SearchService              • CacheService                │
│ • SuggestionEngine           • AnalyticsService            │
│ • FilterService              • PerformanceMonitor          │
└─────────────────────────────────────────────────────────────┘
                               │
┌─────────────────────────────────────────────────────────────┐
│                    Database Layer                           │
│                                                             │
│ • coaches                    • courses                     │
│ • resources                  • search_analytics           │
│ • specializations            • saved_searches             │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### 1. Basic Search Implementation

```typescript
import { SearchPage } from './components/search';

function App() {
  return (
    <SearchPage 
      searchType="all" 
      className="container mx-auto"
    />
  );
}
```

### 2. Coach-Specific Search

```typescript
import { AdvancedSearch, SearchResults } from './components/search';
import { useSearch } from './hooks/useSearch';

function CoachSearch() {
  const {
    filters,
    results,
    loading,
    error,
    search,
    updateFilters
  } = useSearch({ searchType: 'coach' });

  return (
    <div className="space-y-6">
      <AdvancedSearch
        searchType="coach"
        onSearch={search}
        onFiltersChange={updateFilters}
        initialFilters={filters}
        loading={loading}
      />
      
      <SearchResults
        results={results}
        loading={loading}
        error={error}
        searchType="coach"
        onPageChange={(page) => updateFilters({ page })}
        onSortChange={(sortBy, sortOrder) => 
          updateFilters({ sort_by: sortBy, sort_order: sortOrder })
        }
        onItemClick={(coach) => navigate(`/coaches/${coach.id}`)}
      />
    </div>
  );
}
```

### 3. Custom Search with Hooks

```typescript
import { useSearch, useSearchSuggestions } from './hooks/useSearch';

function CustomSearch() {
  const { 
    filters, 
    results, 
    loading, 
    updateFilters, 
    hasActiveFilters,
    clearFilters 
  } = useSearch({
    searchType: 'course',
    initialFilters: { limit: 12 }
  });

  const { suggestions } = useSearchSuggestions({
    query: filters.query || '',
    searchType: 'course'
  });

  const handleSpecializationFilter = (specializations: string[]) => {
    updateFilters({ specialization: specializations });
  };

  return (
    <div>
      {/* Custom search implementation */}
      <input
        value={filters.query || ''}
        onChange={(e) => updateFilters({ query: e.target.value })}
        placeholder="Search courses..."
      />
      
      {suggestions.length > 0 && (
        <div className="suggestions">
          {suggestions.map(suggestion => (
            <button
              key={suggestion}
              onClick={() => updateFilters({ query: suggestion })}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
      
      {hasActiveFilters && (
        <button onClick={clearFilters}>Clear Filters</button>
      )}
      
      {results && (
        <div className="grid grid-cols-3 gap-4">
          {results.items.map(course => (
            <div key={course.id} className="course-card">
              <h3>{course.title}</h3>
              <p>{course.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

## 📱 Components

### AdvancedSearch

Main search interface with intelligent filtering and suggestions.

**Features**:
- Real-time search with debouncing
- Dynamic filter panels
- Search suggestions and autocomplete
- Responsive filter layout
- Popular and trending search displays
- Clear filters functionality

**Props**:
```typescript
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
```

**Usage**:
```typescript
<AdvancedSearch
  searchType="coach"
  placeholder="Find the perfect coach..."
  onSearch={handleSearch}
  onFiltersChange={handleFiltersChange}
  initialFilters={{ query: 'life coaching' }}
  suggestions={['life coaching', 'career coaching']}
  loading={searchLoading}
/>
```

### SearchResults

Comprehensive results display with sorting and pagination.

**Features**:
- Grid and list view modes
- Advanced sorting options
- Intelligent pagination
- Results summary and timing
- Empty state handling
- Loading states and error handling

**Props**:
```typescript
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
```

**Usage**:
```typescript
<SearchResults
  results={searchResults}
  loading={loading}
  error={error}
  searchType="all"
  onPageChange={handlePageChange}
  onSortChange={handleSortChange}
  onItemClick={handleItemClick}
/>
```

### SearchPage

Complete search page with sidebar, trending topics, and saved searches.

**Features**:
- Full search interface
- Trending topics sidebar
- Popular searches
- Saved searches management
- URL state synchronization
- Search analytics integration

**Props**:
```typescript
interface SearchPageProps {
  searchType?: 'coach' | 'course' | 'resource' | 'all';
  className?: string;
}
```

**Usage**:
```typescript
<SearchPage 
  searchType="coach" 
  className="max-w-7xl mx-auto"
/>
```

## 🔧 Core Services

### SearchService

Main service for search operations and data management.

**Key Methods**:
```typescript
// Search coaches with advanced filtering
const coachResults = await searchService.searchCoaches({
  query: 'life coaching',
  specialization: ['Life Coaching', 'Career Coaching'],
  experience_years: { min: 5 },
  hourly_rate: { max: 150 },
  rating: { min: 4.5 },
  location: { type: 'virtual' },
  sort_by: 'rating',
  sort_order: 'desc',
  page: 1,
  limit: 20
});

// Universal search across all content
const allResults = await searchService.searchAll({
  query: 'stress management',
  content_type: ['article', 'video'],
  tags: ['wellness', 'mindfulness']
});

// Get search suggestions
const suggestions = await searchService.getSuggestions('life', 'coach');

// Get available filter options
const filterOptions = await searchService.getFilterOptions('coach');
```

**Advanced Filtering**:
```typescript
const complexSearch = await searchService.searchCoaches({
  query: 'executive coaching',
  specialization: ['Executive Coaching', 'Leadership Development'],
  certification_level: ['PCC', 'MCC'],
  experience_years: { min: 10 },
  hourly_rate: { min: 200, max: 500 },
  rating: { min: 4.5 },
  languages: ['English', 'Spanish'],
  location: {
    type: 'both',
    city: 'New York',
    radius: 25
  },
  availability: {
    timezone: 'America/New_York',
    days: ['monday', 'tuesday', 'wednesday']
  },
  session_types: ['Individual Coaching', 'Executive Intensive'],
  sort_by: 'experience_years',
  sort_order: 'desc'
});
```

### Search Hooks

React hooks for seamless search integration.

**useSearch**:
```typescript
const {
  // Search state
  filters,
  results,
  loading,
  error,
  suggestions,
  
  // Search actions
  search,
  updateFilters,
  clearFilters,
  retry,
  
  // Pagination
  currentPage,
  totalPages,
  hasNextPage,
  hasPrevPage,
  goToPage,
  nextPage,
  prevPage,
  
  // Filter helpers
  hasActiveFilters,
  filterCount
} = useSearch({
  searchType: 'coach',
  initialFilters: { query: 'life coaching' },
  autoSearch: true,
  debounceMs: 300
});
```

**useSearchSuggestions**:
```typescript
const { suggestions, loading } = useSearchSuggestions({
  query: searchQuery,
  searchType: 'coach',
  debounceMs: 300,
  minLength: 2
});
```

**useSearchHistory**:
```typescript
const { 
  history, 
  addToHistory, 
  clearHistory, 
  removeFromHistory 
} = useSearchHistory();

// Add to history when user performs search
addToHistory(searchQuery);
```

## 🎛️ Filter System

### Coach Filters

Comprehensive filtering options for coach search:

```typescript
interface CoachFilters {
  // Text search
  query?: string;
  
  // Professional qualifications
  specialization?: string[];
  certification_level?: string[];
  experience_years?: { min?: number; max?: number; };
  
  // Pricing and availability
  hourly_rate?: { min?: number; max?: number; };
  availability?: {
    days?: string[];
    times?: string[];
    timezone?: string;
  };
  
  // Location and format
  location?: {
    type?: 'in_person' | 'virtual' | 'both';
    city?: string;
    state?: string;
    radius?: number;
  };
  
  // Quality metrics
  rating?: { min?: number; };
  languages?: string[];
  session_types?: string[];
}
```

### Content Filters

Filtering for courses and resources:

```typescript
interface ContentFilters {
  content_type?: string[];
  difficulty_level?: string[];
  tags?: string[];
  date_range?: {
    start?: Date;
    end?: Date;
  };
}
```

### Dynamic Filter Options

```typescript
// Get available filter options
const filterOptions = await searchService.getFilterOptions('coach');

console.log(filterOptions);
// {
//   specializations: [
//     { name: 'Life Coaching', description: '...' },
//     { name: 'Executive Coaching', description: '...' }
//   ],
//   certification_levels: ['ACC', 'PCC', 'MCC', 'iPEC Certified'],
//   languages: ['English', 'Spanish', 'French', 'German'],
//   session_types: ['Individual Coaching', 'Group Coaching', 'Workshop']
// }
```

## 📊 Search Analytics

### Usage Tracking

```typescript
// Automatically tracked with each search
await searchService.saveSearch(userId, filters, resultCount);

// Analytics data structure
interface SearchAnalytics {
  user_id: string;
  query: string;
  filters: SearchFilters;
  result_count: number;
  timestamp: string;
}
```

### Performance Monitoring

```typescript
// All searches include performance metrics
interface SearchResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  filters_applied: SearchFilters;
  search_time_ms: number;  // Performance tracking
  suggestions?: string[];
}
```

## 🎨 Customization

### Custom Search Interface

```typescript
import { useSearch } from './hooks/useSearch';

function CustomSearchInterface() {
  const { filters, results, updateFilters } = useSearch();
  
  return (
    <div className="custom-search">
      <div className="search-bar">
        <input
          value={filters.query || ''}
          onChange={(e) => updateFilters({ query: e.target.value })}
          placeholder="Search..."
          className="custom-input"
        />
      </div>
      
      <div className="custom-filters">
        <select
          value={filters.sort_by || ''}
          onChange={(e) => updateFilters({ sort_by: e.target.value })}
        >
          <option value="relevance">Relevance</option>
          <option value="rating">Rating</option>
          <option value="price">Price</option>
        </select>
      </div>
      
      <div className="custom-results">
        {results?.items.map(item => (
          <CustomResultCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
```

### Custom Result Cards

```typescript
function CustomCoachCard({ coach }: { coach: Coach }) {
  return (
    <div className="custom-coach-card">
      <img src={coach.profile_image_url} alt={coach.display_name} />
      <h3>{coach.display_name}</h3>
      <div className="specializations">
        {coach.specializations.map(spec => (
          <span key={spec} className="specialization-tag">{spec}</span>
        ))}
      </div>
      <div className="rating">
        ⭐ {coach.rating} ({coach.review_count} reviews)
      </div>
      <div className="price">${coach.hourly_rate}/hour</div>
    </div>
  );
}
```

## ⚡ Performance Optimization

### Caching Strategy

```typescript
class SearchService {
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  
  async searchCoaches(filters: SearchFilters) {
    const cacheKey = `search_coaches_${this.getFilterHash(filters)}`;
    
    // Try cache first
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;
    
    // Perform search and cache result
    const result = await this.performSearch(filters);
    await cacheService.set(cacheKey, result, this.CACHE_TTL);
    
    return result;
  }
}
```

### Debouncing

```typescript
// Automatic debouncing in useSearch hook
const debouncedFilters = useDebounce(filters, 300);

useEffect(() => {
  if (autoSearch) {
    performSearch(debouncedFilters);
  }
}, [debouncedFilters]);
```

### Pagination Optimization

```typescript
// Intelligent pagination with configurable limits
const searchResults = await searchService.searchCoaches({
  ...filters,
  limit: Math.min(filters.limit || 20, 100), // Max 100 per page
  page: filters.page || 1
});
```

## 🔒 Security & Privacy

### Input Sanitization

```typescript
// All search inputs are sanitized
private sanitizeQuery(query: string): string {
  return query
    .trim()
    .replace(/[<>]/g, '') // Remove potential XSS
    .substring(0, 200); // Limit length
}
```

### Rate Limiting

```typescript
// Built-in rate limiting for search requests
class SearchService {
  private rateLimiter = new Map();
  
  private checkRateLimit(userId: string): boolean {
    const userRequests = this.rateLimiter.get(userId) || [];
    const now = Date.now();
    const recentRequests = userRequests.filter(
      (timestamp: number) => now - timestamp < 60000 // 1 minute window
    );
    
    if (recentRequests.length >= 100) { // Max 100 requests per minute
      return false;
    }
    
    recentRequests.push(now);
    this.rateLimiter.set(userId, recentRequests);
    return true;
  }
}
```

### Data Privacy

- Search queries are not stored permanently
- Analytics data is anonymized after 90 days
- User search history is stored locally only
- GDPR-compliant data handling

## 📈 Analytics & Insights

### Search Metrics

```typescript
interface SearchMetrics {
  totalSearches: number;
  averageResponseTime: number;
  popularQueries: { query: string; count: number; }[];
  filterUsage: Record<string, number>;
  resultClickRates: number;
  zeroResultQueries: string[];
}
```

### User Insights

```typescript
// Track user search patterns
const userSearchInsights = {
  preferredSearchTypes: ['coach', 'course'],
  commonFilters: ['specialization', 'hourly_rate'],
  searchFrequency: 'daily',
  avgResultsClicked: 2.3
};
```

## 🚦 Best Practices

### Search UX

1. **Progressive Disclosure**: Show basic search first, advanced filters on demand
2. **Immediate Feedback**: Show loading states and search progress
3. **Error Recovery**: Provide helpful suggestions when no results found
4. **Search History**: Help users recall and repeat searches
5. **Mobile Optimization**: Touch-friendly filters and responsive design

### Performance

1. **Debounce Inputs**: Prevent excessive API calls during typing
2. **Cache Results**: Cache search results for faster repeated searches
3. **Lazy Loading**: Load additional results as needed
4. **Optimize Queries**: Use database indexes and efficient queries
5. **Monitor Performance**: Track search response times and optimize

### Data Quality

1. **Relevance Scoring**: Implement intelligent relevance algorithms
2. **Fresh Content**: Ensure search results reflect latest data
3. **Quality Filters**: Hide inactive or unverified content
4. **Duplicate Detection**: Prevent duplicate results
5. **Content Validation**: Validate search content quality

## 🔧 Configuration

### Environment Variables

```env
# Search service configuration
SEARCH_CACHE_TTL=300000
SEARCH_MAX_RESULTS_PER_PAGE=100
SEARCH_DEBOUNCE_MS=300
SEARCH_RATE_LIMIT_PER_MINUTE=100

# Analytics
SEARCH_ANALYTICS_ENABLED=true
SEARCH_ANALYTICS_RETENTION_DAYS=90

# Performance
SEARCH_ENABLE_CACHING=true
SEARCH_ENABLE_SUGGESTIONS=true
```

### Service Configuration

```typescript
const searchConfig = {
  cache: {
    ttl: 300000, // 5 minutes
    maxSize: 1000
  },
  pagination: {
    defaultLimit: 20,
    maxLimit: 100
  },
  suggestions: {
    enabled: true,
    minQueryLength: 2,
    maxSuggestions: 10
  },
  analytics: {
    enabled: true,
    trackQueries: true,
    trackFilters: true,
    retentionDays: 90
  }
};
```

## 📚 API Reference

### Core Interfaces

```typescript
interface SearchFilters {
  query?: string;
  specialization?: string[];
  certification_level?: string[];
  experience_years?: { min?: number; max?: number; };
  hourly_rate?: { min?: number; max?: number; };
  location?: {
    type?: 'in_person' | 'virtual' | 'both';
    city?: string;
    radius?: number;
  };
  rating?: { min?: number; };
  languages?: string[];
  session_types?: string[];
  content_type?: string[];
  difficulty_level?: string[];
  tags?: string[];
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

interface SearchResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  filters_applied: SearchFilters;
  search_time_ms: number;
  suggestions?: string[];
}

interface Coach {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  display_name?: string;
  bio?: string;
  specializations: string[];
  certification_level: string;
  experience_years: number;
  hourly_rate: number;
  rating: number;
  review_count: number;
  languages: string[];
  location: {
    type: 'in_person' | 'virtual' | 'both';
    city?: string;
    state?: string;
    country?: string;
  };
  session_types: string[];
  verified: boolean;
  active: boolean;
}
```

### Service Methods

```typescript
class SearchService {
  // Core search methods
  async searchCoaches(filters: SearchFilters): Promise<SearchResult<Coach>>;
  async searchCourses(filters: SearchFilters): Promise<SearchResult<Course>>;
  async searchResources(filters: SearchFilters): Promise<SearchResult<Resource>>;
  async searchAll(filters: SearchFilters): Promise<SearchResult<SearchableContent>>;
  
  // Suggestions and options
  async getSuggestions(query: string, type: string): Promise<SearchSuggestion[]>;
  async getFilterOptions(type: string): Promise<Record<string, any[]>>;
  
  // Analytics
  async saveSearch(userId: string, filters: SearchFilters, resultCount: number): Promise<void>;
}
```

---

Built with ❤️ for iPEC Coach Connect - Connecting you with the perfect coaching experience through intelligent search.