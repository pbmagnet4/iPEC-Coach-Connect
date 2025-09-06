/**
 * Search Hooks
 * Custom hooks for search functionality and state management
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { searchService, SearchFilters, SearchResult } from '../services/search.service';
import { useDebounce } from './useDebounce';

interface UseSearchOptions {
  searchType?: 'coach' | 'course' | 'resource' | 'all';
  initialFilters?: SearchFilters;
  autoSearch?: boolean;
  debounceMs?: number;
}

interface UseSearchReturn {
  // Search state
  filters: SearchFilters;
  results: SearchResult<any> | null;
  loading: boolean;
  error: string | null;
  suggestions: string[];
  
  // Search actions
  search: (newFilters?: SearchFilters) => void;
  updateFilters: (newFilters: Partial<SearchFilters>) => void;
  clearFilters: () => void;
  retry: () => void;
  
  // Pagination
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  
  // Filter helpers
  hasActiveFilters: boolean;
  filterCount: number;
}

export function useSearch({
  searchType = 'all',
  initialFilters = {},
  autoSearch = true,
  debounceMs = 300
}: UseSearchOptions = {}): UseSearchReturn {
  const [filters, setFilters] = useState<SearchFilters>({
    limit: 20,
    page: 1,
    ...initialFilters
  });
  const [results, setResults] = useState<SearchResult<any> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const debouncedFilters = useDebounce(filters, debounceMs);

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
      
      if (searchResults.suggestions) {
        setSuggestions(searchResults.suggestions);
      }

    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'Search failed');
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, [searchType]);

  // Auto search when filters change (debounced)
  useEffect(() => {
    if (autoSearch && Object.keys(debouncedFilters).length > 0) {
      performSearch(debouncedFilters);
    }
  }, [debouncedFilters, autoSearch, performSearch]);

  // Search function
  const search = useCallback((newFilters?: SearchFilters) => {
    const searchFilters = newFilters || filters;
    setFilters(searchFilters);
    performSearch(searchFilters);
  }, [filters, performSearch]);

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: newFilters.page ?? 1 // Reset to page 1 unless explicitly set
    }));
  }, []);

  // Clear filters
  const clearFilters = useCallback(() => {
    const clearedFilters: SearchFilters = {
      limit: filters.limit || 20,
      page: 1
    };
    setFilters(clearedFilters);
    setResults(null);
    setError(null);
  }, [filters.limit]);

  // Retry search
  const retry = useCallback(() => {
    performSearch(filters);
  }, [filters, performSearch]);

  // Pagination helpers
  const currentPage = useMemo(() => filters.page || 1, [filters.page]);
  const totalPages = useMemo(() => results?.total_pages || 0, [results?.total_pages]);
  const hasNextPage = useMemo(() => currentPage < totalPages, [currentPage, totalPages]);
  const hasPrevPage = useMemo(() => currentPage > 1, [currentPage]);

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      updateFilters({ page });
    }
  }, [totalPages, updateFilters]);

  const nextPage = useCallback(() => {
    if (hasNextPage) {
      goToPage(currentPage + 1);
    }
  }, [hasNextPage, currentPage, goToPage]);

  const prevPage = useCallback(() => {
    if (hasPrevPage) {
      goToPage(currentPage - 1);
    }
  }, [hasPrevPage, currentPage, goToPage]);

  // Filter state helpers
  const hasActiveFilters = useMemo(() => {
    return Object.keys(filters).some(
      key => key !== 'page' && key !== 'limit' && key !== 'sort_by' && key !== 'sort_order' && filters[key as keyof SearchFilters]
    );
  }, [filters]);

  const filterCount = useMemo(() => {
    let count = 0;
    Object.entries(filters).forEach(([key, value]) => {
      if (key !== 'page' && key !== 'limit' && key !== 'sort_by' && key !== 'sort_order' && value) {
        if (Array.isArray(value)) {
          count += value.length;
        } else if (typeof value === 'object') {
          count += Object.keys(value).length;
        } else {
          count += 1;
        }
      }
    });
    return count;
  }, [filters]);

  return {
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
  };
}

interface UseSearchSuggestionsOptions {
  query: string;
  searchType?: 'coach' | 'course' | 'resource' | 'all';
  debounceMs?: number;
  minLength?: number;
}

interface UseSearchSuggestionsReturn {
  suggestions: string[];
  loading: boolean;
  error: string | null;
}

export function useSearchSuggestions({
  query,
  searchType = 'all',
  debounceMs = 300,
  minLength = 2
}: UseSearchSuggestionsOptions): UseSearchSuggestionsReturn {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedQuery = useDebounce(query, debounceMs);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (debouncedQuery.length < minLength) {
        setSuggestions([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const results = await searchService.getSuggestions(debouncedQuery, searchType);
        setSuggestions(results.map(s => s.text));
      } catch (err) {
        console.error('Suggestions error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load suggestions');
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [debouncedQuery, searchType, minLength]);

  return {
    suggestions,
    loading,
    error
  };
}

interface UseSearchHistoryReturn {
  history: string[];
  addToHistory: (query: string) => void;
  clearHistory: () => void;
  removeFromHistory: (query: string) => void;
}

export function useSearchHistory(): UseSearchHistoryReturn {
  const [history, setHistory] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('search_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const addToHistory = useCallback((query: string) => {
    if (!query.trim()) return;

    setHistory(prev => {
      const filtered = prev.filter(item => item !== query);
      const newHistory = [query, ...filtered].slice(0, 10); // Keep last 10
      
      try {
        localStorage.setItem('search_history', JSON.stringify(newHistory));
      } catch (err) {
        console.error('Failed to save search history:', err);
      }
      
      return newHistory;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem('search_history');
    } catch (err) {
      console.error('Failed to clear search history:', err);
    }
  }, []);

  const removeFromHistory = useCallback((query: string) => {
    setHistory(prev => {
      const newHistory = prev.filter(item => item !== query);
      
      try {
        localStorage.setItem('search_history', JSON.stringify(newHistory));
      } catch (err) {
        console.error('Failed to update search history:', err);
      }
      
      return newHistory;
    });
  }, []);

  return {
    history,
    addToHistory,
    clearHistory,
    removeFromHistory
  };
}

interface UseSearchFiltersReturn {
  filterOptions: Record<string, any[]>;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useSearchFilters(searchType: string = 'coach'): UseSearchFiltersReturn {
  const [filterOptions, setFilterOptions] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFilterOptions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const options = await searchService.getFilterOptions(searchType);
      setFilterOptions(options);
    } catch (err) {
      console.error('Filter options error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load filter options');
    } finally {
      setLoading(false);
    }
  }, [searchType]);

  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  return {
    filterOptions,
    loading,
    error,
    refresh: fetchFilterOptions
  };
}