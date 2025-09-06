/**
 * Search Components Export Index
 * Centralized exports for all search-related components
 */

export { AdvancedSearch } from './AdvancedSearch';
export { SearchResults } from './SearchResults';
export { SearchPage } from './SearchPage';

// Service exports
export { searchService } from '../../services/search.service';

// Hook exports
export { 
  useSearch, 
  useSearchSuggestions, 
  useSearchHistory,
  useSearchFilters 
} from '../../hooks/useSearch';

// Type exports
export type {
  SearchFilters,
  SearchResult,
  Coach,
  SearchableContent,
  SearchSuggestion
} from '../../services/search.service';