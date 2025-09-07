/**
 * Advanced Search Service
 * Comprehensive search and filtering functionality for iPEC Coach Connect
 */

import { supabase } from './supabase';
import { cacheService } from './cache.service';

export interface SearchFilters {
  // Text search
  query?: string;
  
  // Coach-specific filters
  specialization?: string[];
  certification_level?: string[];
  experience_years?: {
    min?: number;
    max?: number;
  };
  hourly_rate?: {
    min?: number;
    max?: number;
  };
  availability?: {
    days?: string[];
    times?: string[];
    timezone?: string;
  };
  languages?: string[];
  location?: {
    type?: 'in_person' | 'virtual' | 'both';
    city?: string;
    state?: string;
    country?: string;
    radius?: number; // miles
  };
  rating?: {
    min?: number;
  };
  session_types?: string[];
  
  // Session filters
  session_duration?: number[];
  session_format?: string[];
  
  // Content filters (for resources, courses, etc.)
  content_type?: string[];
  difficulty_level?: string[];
  tags?: string[];
  
  // Date filters
  date_range?: {
    start?: Date;
    end?: Date;
  };
  
  // Sorting
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  
  // Pagination
  page?: number;
  limit?: number;
}

export interface SearchResult<T = any> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  filters_applied: SearchFilters;
  search_time_ms: number;
  suggestions?: string[];
}

export interface Coach {
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
    coordinates?: [number, number]; // [lat, lng]
  };
  availability: {
    timezone: string;
    schedule: Record<string, { start: string; end: string; }[]>;
  };
  session_types: string[];
  profile_image_url?: string;
  verified: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SearchableContent {
  id: string;
  type: 'coach' | 'course' | 'resource' | 'session' | 'event';
  title: string;
  description?: string;
  content?: string;
  tags: string[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface SearchSuggestion {
  text: string;
  type: 'query' | 'filter' | 'category';
  category?: string;
  count?: number;
}

class SearchService {
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly SEARCH_CACHE_PREFIX = 'search_';
  private readonly SUGGESTIONS_CACHE_KEY = 'search_suggestions';

  /**
   * Search coaches with advanced filtering
   */
  async searchCoaches(filters: SearchFilters = {}): Promise<SearchResult<Coach>> {
    const startTime = Date.now();
    const cacheKey = `${this.SEARCH_CACHE_PREFIX}coaches_${this.getFilterHash(filters)}`;
    
    // Try cache first
    const cached = await cacheService.get<SearchResult<Coach>>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      let query = supabase
        .from('coaches')
        .select(`
          *,
          user:users!coaches_user_id_fkey(
            first_name,
            last_name,
            profile_image_url
          ),
          reviews:coach_reviews(rating),
          specializations:coach_specializations(
            specialization:specializations(name)
          )
        `)
        .eq('active', true)
        .eq('verified', true);

      // Apply filters
      query = this.applyCoachFilters(query, filters);

      // Apply sorting
      if (filters.sort_by) {
        query = query.order(filters.sort_by, { 
          ascending: filters.sort_order === 'asc' 
        });
      } else {
        // Default sorting: rating desc, then review count desc
        query = query.order('rating', { ascending: false })
                    .order('review_count', { ascending: false });
      }

      // Apply pagination
      const page = filters.page || 1;
      const limit = Math.min(filters.limit || 20, 100);
      const offset = (page - 1) * limit;
      
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Coach search failed: ${error.message}`);
      }

      // Transform data
      const coaches = this.transformCoachData(data || []);
      
      const result: SearchResult<Coach> = {
        items: coaches,
        total: count || 0,
        page,
        limit,
        total_pages: Math.ceil((count || 0) / limit),
        filters_applied: filters,
        search_time_ms: Date.now() - startTime,
        suggestions: await this.generateSuggestions('coach', filters.query)
      };

      // Cache result
      await cacheService.set(cacheKey, result, this.CACHE_TTL);
      
      return result;

    } catch (error) {
  void console.error('Coach search error:', error);
      throw error;
    }
  }

  /**
   * Universal search across all content types
   */
  async searchAll(filters: SearchFilters = {}): Promise<SearchResult<SearchableContent>> {
    const startTime = Date.now();
    const cacheKey = `${this.SEARCH_CACHE_PREFIX}all_${this.getFilterHash(filters)}`;
    
    const cached = await cacheService.get<SearchResult<SearchableContent>>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const searches = await Promise.all([
        this.searchCoaches(filters),
        this.searchCourses(filters),
        this.searchResources(filters)
      ]);

      // Combine and rank results
      const allItems: SearchableContent[] = [];
      
      searches.forEach((searchResult, index) => {
        const contentType = ['coach', 'course', 'resource'][index];
        searchResult.items.forEach(item => {
  void allItems.push(this.transformToSearchableContent(item, contentType));
        });
      });

      // Apply universal sorting
      const sortedItems = this.sortSearchResults(allItems, filters);
      
      // Apply pagination
      const page = filters.page || 1;
      const limit = Math.min(filters.limit || 20, 100);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedItems = sortedItems.slice(startIndex, endIndex);

      const result: SearchResult<SearchableContent> = {
        items: paginatedItems,
        total: allItems.length,
        page,
        limit,
        total_pages: Math.ceil(allItems.length / limit),
        filters_applied: filters,
        search_time_ms: Date.now() - startTime,
        suggestions: await this.generateSuggestions('all', filters.query)
      };

      await cacheService.set(cacheKey, result, this.CACHE_TTL);
      return result;

    } catch (error) {
  void console.error('Universal search error:', error);
      throw error;
    }
  }

  /**
   * Search courses
   */
  async searchCourses(filters: SearchFilters = {}): Promise<SearchResult<any>> {
    const startTime = Date.now();
    
    try {
      let query = supabase
        .from('courses')
        .select('*')
        .eq('published', true);

      // Apply text search
      if (filters.query) {
        query = query.or(`title.ilike.%${filters.query}%,description.ilike.%${filters.query}%`);
      }

      // Apply content filters
      if (filters.difficulty_level && filters.difficulty_level.length > 0) {
        query = query.in('difficulty_level', filters.difficulty_level);
      }

      if (filters.tags && filters.tags.length > 0) {
        query = query.contains('tags', filters.tags);
      }

      // Apply sorting and pagination
      const page = filters.page || 1;
      const limit = Math.min(filters.limit || 20, 100);
      const offset = (page - 1) * limit;
      
      query = query.order('created_at', { ascending: false })
                  .range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Course search failed: ${error.message}`);
      }

      return {
        items: data || [],
        total: count || 0,
        page,
        limit,
        total_pages: Math.ceil((count || 0) / limit),
        filters_applied: filters,
        search_time_ms: Date.now() - startTime
      };

    } catch (error) {
  void console.error('Course search error:', error);
      throw error;
    }
  }

  /**
   * Search resources
   */
  async searchResources(filters: SearchFilters = {}): Promise<SearchResult<any>> {
    const startTime = Date.now();
    
    try {
      let query = supabase
        .from('resources')
        .select('*')
        .eq('published', true);

      // Apply text search
      if (filters.query) {
        query = query.or(`title.ilike.%${filters.query}%,description.ilike.%${filters.query}%,content.ilike.%${filters.query}%`);
      }

      // Apply content type filter
      if (filters.content_type && filters.content_type.length > 0) {
        query = query.in('type', filters.content_type);
      }

      if (filters.tags && filters.tags.length > 0) {
        query = query.contains('tags', filters.tags);
      }

      const page = filters.page || 1;
      const limit = Math.min(filters.limit || 20, 100);
      const offset = (page - 1) * limit;
      
      query = query.order('created_at', { ascending: false })
                  .range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Resource search failed: ${error.message}`);
      }

      return {
        items: data || [],
        total: count || 0,
        page,
        limit,
        total_pages: Math.ceil((count || 0) / limit),
        filters_applied: filters,
        search_time_ms: Date.now() - startTime
      };

    } catch (error) {
  void console.error('Resource search error:', error);
      throw error;
    }
  }

  /**
   * Get search suggestions based on query and type
   */
  async getSuggestions(query = '', type = 'all'): Promise<SearchSuggestion[]> {
    const cacheKey = `${this.SUGGESTIONS_CACHE_KEY}_${type}_${query.toLowerCase()}`;
    
    const cached = await cacheService.get<SearchSuggestion[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const suggestions: SearchSuggestion[] = [];

      // Query suggestions
      if (query.length >= 2) {
        const queryTerms = await this.getQuerySuggestions(query, type);
  void suggestions.push(...queryTerms);
      }

      // Category suggestions
      const categories = await this.getCategorySuggestions(type);
  void suggestions.push(...categories);

      // Cache suggestions
      await cacheService.set(cacheKey, suggestions, this.CACHE_TTL);
      
      return suggestions;

    } catch (error) {
  void console.error('Suggestion generation error:', error);
      return [];
    }
  }

  /**
   * Get available filter options for a search type
   */
  async getFilterOptions(type = 'coach'): Promise<Record<string, any[]>> {
    const cacheKey = `filter_options_${type}`;
    
    const cached = await cacheService.get<Record<string, any[]>>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const options: Record<string, any[]> = {};

      if (type === 'coach') {
        // Get available specializations
        const { data: specializations } = await supabase
          .from('specializations')
          .select('name, description')
          .eq('active', true)
          .order('name');

        // Get certification levels
        const { data: certifications } = await supabase
          .from('coaches')
          .select('certification_level')
          .not('certification_level', 'is', null);

        // Get unique languages
        const { data: languageData } = await supabase
          .from('coaches')
          .select('languages')
          .not('languages', 'is', null);

        options.specializations = specializations || [];
        options.certification_levels = [...new Set(
          certifications?.map(c => c.certification_level).filter(Boolean) || []
        )];
        options.languages = [...new Set(
          languageData?.flatMap(d => d.languages || []) || []
        )];
        options.session_types = [
          'Individual Coaching',
          'Group Coaching', 
          'Workshop',
          'Intensive Session',
          'Discovery Call'
        ];
      }

      // Cache options
      await cacheService.set(cacheKey, options, this.CACHE_TTL * 2); // Cache longer
      
      return options;

    } catch (error) {
  void console.error('Filter options error:', error);
      return {};
    }
  }

  /**
   * Save search for user analytics
   */
  async saveSearch(userId: string, filters: SearchFilters, resultCount: number): Promise<void> {
    try {
      await supabase
        .from('search_analytics')
        .insert({
          user_id: userId,
          query: filters.query,
          filters,
          result_count: resultCount,
          timestamp: new Date().toISOString()
        });
    } catch (error) {
  void console.error('Save search error:', error);
      // Don't throw - this is analytics only
    }
  }

  // Private helper methods

  private applyCoachFilters(query: any, filters: SearchFilters): any {
    // Text search
    if (filters.query) {
      query = query.or(`
        first_name.ilike.%${filters.query}%,
        last_name.ilike.%${filters.query}%,
        bio.ilike.%${filters.query}%,
        display_name.ilike.%${filters.query}%
      `);
    }

    // Experience years
    if (filters.experience_years?.min !== undefined) {
      query = query.gte('experience_years', filters.experience_years.min);
    }
    if (filters.experience_years?.max !== undefined) {
      query = query.lte('experience_years', filters.experience_years.max);
    }

    // Hourly rate
    if (filters.hourly_rate?.min !== undefined) {
      query = query.gte('hourly_rate', filters.hourly_rate.min);
    }
    if (filters.hourly_rate?.max !== undefined) {
      query = query.lte('hourly_rate', filters.hourly_rate.max);
    }

    // Rating
    if (filters.rating?.min !== undefined) {
      query = query.gte('rating', filters.rating.min);
    }

    // Certification level
    if (filters.certification_level && filters.certification_level.length > 0) {
      query = query.in('certification_level', filters.certification_level);
    }

    // Languages
    if (filters.languages && filters.languages.length > 0) {
      query = query.contains('languages', filters.languages);
    }

    return query;
  }

  private transformCoachData(data: any[]): Coach[] {
    return data.map(item => ({
      id: item.id,
      user_id: item.user_id,
      first_name: item.user?.first_name || '',
      last_name: item.user?.last_name || '',
      display_name: item.display_name,
      bio: item.bio,
      specializations: item.specializations?.map((s: any) => s.specialization?.name) || [],
      certification_level: item.certification_level,
      experience_years: item.experience_years,
      hourly_rate: item.hourly_rate,
      rating: item.rating,
      review_count: item.reviews?.length || 0,
      languages: item.languages || [],
      location: item.location || { type: 'virtual' },
      availability: item.availability || { timezone: 'UTC', schedule: {} },
      session_types: item.session_types || [],
      profile_image_url: item.user?.profile_image_url,
      verified: item.verified,
      active: item.active,
      created_at: item.created_at,
      updated_at: item.updated_at
    }));
  }

  private transformToSearchableContent(item: any, type: string): SearchableContent {
    return {
      id: item.id,
      type: type as any,
      title: item.title || item.display_name || `${item.first_name} ${item.last_name}`,
      description: item.description || item.bio,
      content: item.content,
      tags: item.tags || item.specializations || [],
      metadata: {
        ...item,
        content_type: type
      },
      created_at: item.created_at,
      updated_at: item.updated_at
    };
  }

  private sortSearchResults(items: SearchableContent[], filters: SearchFilters): SearchableContent[] {
    if (!filters.query) {
      return items.sort((a, b) => 
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
    }

    // Relevance scoring for text search
    const query = filters.query.toLowerCase();
    
    return items.sort((a, b) => {
      const scoreA = this.calculateRelevanceScore(a, query);
      const scoreB = this.calculateRelevanceScore(b, query);
      return scoreB - scoreA;
    });
  }

  private calculateRelevanceScore(item: SearchableContent, query: string): number {
    let score = 0;
    
    // Title match (highest weight)
    if (item.title.toLowerCase().includes(query)) {
      score += 10;
    }
    
    // Description match
    if (item.description?.toLowerCase().includes(query)) {
      score += 5;
    }
    
    // Tag match
    if (item.tags.some(tag => tag.toLowerCase().includes(query))) {
      score += 3;
    }
    
    // Content match (lowest weight)
    if (item.content?.toLowerCase().includes(query)) {
      score += 1;
    }
    
    return score;
  }

  private async generateSuggestions(type: string, query?: string): Promise<string[]> {
    // Implementation would generate contextual suggestions
    return [];
  }

  private async getQuerySuggestions(query: string, type: string): Promise<SearchSuggestion[]> {
    // Implementation would return query autocomplete suggestions
    return [];
  }

  private async getCategorySuggestions(type: string): Promise<SearchSuggestion[]> {
    // Implementation would return category/filter suggestions
    return [];
  }

  private getFilterHash(filters: SearchFilters): string {
    return btoa(JSON.stringify(filters)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);
  }
}

export const searchService = new SearchService();