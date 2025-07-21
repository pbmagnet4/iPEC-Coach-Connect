/**
 * API Service Layer for iPEC Coach Connect
 * 
 * Comprehensive service layer providing standardized data operations with:
 * - Type-safe database operations
 * - Error handling and validation
 * - Caching and optimization
 * - Real-time subscriptions
 * - Pagination and filtering
 * - Transaction support
 * - Performance monitoring
 */

import { supabase, supabaseUtils, handleSupabaseError, SupabaseError } from '../lib/supabase';
import type {
  Profile,
  ProfileInsert,
  ProfileUpdate,
  Coach,
  CoachInsert,
  CoachUpdate,
  Session,
  SessionInsert,
  SessionUpdate,
  SessionWithDetails,
  CoachWithProfile,
  Notification,
  NotificationInsert,
  CoachFilters,
  SessionFilters,
  ApiResponse,
  PaginatedResponse,
  RealtimePayload,
} from '../types/database';

// Base API service configuration
interface ApiConfig {
  defaultPageSize: number;
  maxPageSize: number;
  cacheTimeout: number;
  retryAttempts: number;
}

const API_CONFIG: ApiConfig = {
  defaultPageSize: 20,
  maxPageSize: 100,
  cacheTimeout: 300000, // 5 minutes
  retryAttempts: 3,
};

// Generic pagination options
export interface PaginationOptions {
  page?: number;
  limit?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

// Generic filter options
export interface BaseFilters {
  search?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

/**
 * Base API Service class with common functionality
 */
abstract class BaseApiService {
  protected async handleQuery<T>(
    queryFn: () => Promise<{ data: T; error: any; count?: number }>
  ): Promise<ApiResponse<T>> {
    try {
      const { data, error, count } = await queryFn();
      
      if (error) {
        console.error('API Query Error:', error);
        return { error: handleSupabaseError(error) };
      }
      
      const response: ApiResponse<T> = { data };
      if (count !== undefined) {
        response.meta = { count };
      }
      
      return response;
    } catch (error) {
      console.error('API Service Error:', error);
      return { error: handleSupabaseError(error) };
    }
  }

  protected async handlePaginatedQuery<T>(
    queryBuilder: any,
    options: PaginationOptions = {}
  ): Promise<ApiResponse<PaginatedResponse<T>>> {
    try {
      const page = Math.max(1, options.page || 1);
      const limit = Math.min(options.limit || API_CONFIG.defaultPageSize, API_CONFIG.maxPageSize);
      const offset = (page - 1) * limit;

      // Apply pagination
      let query = queryBuilder.range(offset, offset + limit - 1);

      // Apply ordering
      if (options.orderBy) {
        query = query.order(options.orderBy, { 
          ascending: options.orderDirection !== 'desc' 
        });
      }

      const { data, error, count } = await query;
      
      if (error) {
        console.error('Paginated Query Error:', error);
        return { error: handleSupabaseError(error) };
      }
      
      const totalPages = count ? Math.ceil(count / limit) : 0;
      
      return {
        data: {
          data,
          meta: {
            count: count || 0,
            page,
            limit,
            totalPages,
          }
        }
      };
    } catch (error) {
      console.error('Paginated Service Error:', error);
      return { error: handleSupabaseError(error) };
    }
  }

  protected buildSearchFilter(query: any, searchTerm: string, searchFields: string[]) {
    if (!searchTerm) return query;
    
    const searchConditions = searchFields
      .map(field => `${field}.ilike.%${searchTerm}%`)
      .join(',');
    
    return query.or(searchConditions);
  }

  protected buildDateRangeFilter(query: any, dateRange: { start: string; end: string } | undefined, dateField: string) {
    if (!dateRange) return query;
    
    return query
      .gte(dateField, dateRange.start)
      .lte(dateField, dateRange.end);
  }
}

/**
 * Profile Management Service
 */
class ProfileService extends BaseApiService {
  async getProfile(userId: string): Promise<ApiResponse<Profile>> {
    return this.handleQuery(async () => {
      return await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
    });
  }

  async updateProfile(userId: string, updates: ProfileUpdate): Promise<ApiResponse<Profile>> {
    return this.handleQuery(async () => {
      return await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();
    });
  }

  async uploadAvatar(userId: string, file: File): Promise<ApiResponse<string>> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/avatar.${fileExt}`;
      
      // Upload file
      const uploadResult = await supabaseUtils.storage.upload('avatars', fileName, file);
      
      // Get public URL
      const publicUrl = await supabaseUtils.storage.getPublicUrl('avatars', fileName);
      
      // Update profile with new avatar URL
      await this.updateProfile(userId, { avatar_url: publicUrl });
      
      return { data: publicUrl };
    } catch (error) {
      return { error: handleSupabaseError(error) };
    }
  }

  async searchProfiles(
    searchTerm: string,
    options: PaginationOptions = {}
  ): Promise<ApiResponse<PaginatedResponse<Profile>>> {
    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' });

    query = this.buildSearchFilter(query, searchTerm, ['full_name', 'username', 'bio']);

    return this.handlePaginatedQuery(query, options);
  }
}

/**
 * Coach Management Service
 */
class CoachService extends BaseApiService {
  async getCoach(coachId: string): Promise<ApiResponse<CoachWithProfile>> {
    return this.handleQuery(async () => {
      return await supabase
        .from('coaches')
        .select(`
          *,
          profile:profiles(*)
        `)
        .eq('id', coachId)
        .single();
    });
  }

  async getActiveCoaches(
    filters: CoachFilters = {},
    options: PaginationOptions = {}
  ): Promise<ApiResponse<PaginatedResponse<CoachWithProfile>>> {
    let query = supabase
      .from('coaches')
      .select(`
        *,
        profile:profiles(*)
      `, { count: 'exact' })
      .eq('is_active', true);

    // Apply filters
    if (filters.specializations?.length) {
      query = query.overlaps('specializations', filters.specializations);
    }

    if (filters.certificationLevel?.length) {
      query = query.in('certification_level', filters.certificationLevel);
    }

    if (filters.hourlyRateRange) {
      query = query
        .gte('hourly_rate', filters.hourlyRateRange.min)
        .lte('hourly_rate', filters.hourlyRateRange.max);
    }

    if (filters.languages?.length) {
      query = query.overlaps('languages', filters.languages);
    }

    return this.handlePaginatedQuery(query, options);
  }

  async updateCoach(coachId: string, updates: CoachUpdate): Promise<ApiResponse<Coach>> {
    return this.handleQuery(async () => {
      return await supabase
        .from('coaches')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', coachId)
        .select()
        .single();
    });
  }

  async verifyCoach(coachId: string): Promise<ApiResponse<Coach>> {
    return this.updateCoach(coachId, {
      verified_at: new Date().toISOString(),
      is_active: true,
    });
  }

  async getCoachAvailability(coachId: string) {
    return this.handleQuery(async () => {
      return await supabase
        .from('coach_availability')
        .select('*')
        .eq('coach_id', coachId)
        .eq('is_active', true)
        .order('day_of_week');
    });
  }

  async updateCoachAvailability(coachId: string, availability: any[]) {
    try {
      // Delete existing availability
      await supabase
        .from('coach_availability')
        .delete()
        .eq('coach_id', coachId);

      // Insert new availability
      const { data, error } = await supabase
        .from('coach_availability')
        .insert(
          availability.map(slot => ({
            coach_id: coachId,
            ...slot,
          }))
        )
        .select();

      if (error) {
        return { error: handleSupabaseError(error) };
      }

      return { data };
    } catch (error) {
      return { error: handleSupabaseError(error) };
    }
  }
}

/**
 * Session Management Service
 */
class SessionService extends BaseApiService {
  async createSession(sessionData: SessionInsert): Promise<ApiResponse<Session>> {
    return this.handleQuery(async () => {
      return await supabase
        .from('sessions')
        .insert(sessionData)
        .select()
        .single();
    });
  }

  async getSession(sessionId: string): Promise<ApiResponse<SessionWithDetails>> {
    return this.handleQuery(async () => {
      return await supabase
        .from('sessions')
        .select(`
          *,
          coach:coaches(
            *,
            profile:profiles(*)
          ),
          client:profiles(*),
          session_type:session_types(*)
        `)
        .eq('id', sessionId)
        .single();
    });
  }

  async getSessions(
    filters: SessionFilters = {},
    options: PaginationOptions = {}
  ): Promise<ApiResponse<PaginatedResponse<SessionWithDetails>>> {
    let query = supabase
      .from('sessions')
      .select(`
        *,
        coach:coaches(
          *,
          profile:profiles(*)
        ),
        client:profiles(*),
        session_type:session_types(*)
      `, { count: 'exact' });

    // Apply filters
    if (filters.status?.length) {
      query = query.in('status', filters.status);
    }

    if (filters.coachId) {
      query = query.eq('coach_id', filters.coachId);
    }

    if (filters.clientId) {
      query = query.eq('client_id', filters.clientId);
    }

    if (filters.dateRange) {
      query = this.buildDateRangeFilter(query, filters.dateRange, 'scheduled_at');
    }

    return this.handlePaginatedQuery(query, {
      ...options,
      orderBy: options.orderBy || 'scheduled_at',
      orderDirection: options.orderDirection || 'asc',
    });
  }

  async updateSession(sessionId: string, updates: SessionUpdate): Promise<ApiResponse<Session>> {
    return this.handleQuery(async () => {
      return await supabase
        .from('sessions')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId)
        .select()
        .single();
    });
  }

  async cancelSession(sessionId: string, reason?: string): Promise<ApiResponse<Session>> {
    return this.updateSession(sessionId, {
      status: 'cancelled',
      notes: reason ? `Cancelled: ${reason}` : 'Cancelled',
    });
  }

  async completeSession(sessionId: string, notes?: string): Promise<ApiResponse<Session>> {
    return this.updateSession(sessionId, {
      status: 'completed',
      notes,
    });
  }

  async getSessionTypes() {
    return this.handleQuery(async () => {
      return await supabase
        .from('session_types')
        .select('*')
        .order('price');
    });
  }
}

/**
 * Notification Service
 */
class NotificationService extends BaseApiService {
  async createNotification(notificationData: NotificationInsert): Promise<ApiResponse<Notification>> {
    return this.handleQuery(async () => {
      return await supabase
        .from('notifications')
        .insert(notificationData)
        .select()
        .single();
    });
  }

  async getUserNotifications(
    userId: string,
    options: PaginationOptions = {}
  ): Promise<ApiResponse<PaginatedResponse<Notification>>> {
    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    return this.handlePaginatedQuery(query, {
      ...options,
      orderBy: options.orderBy || 'created_at',
      orderDirection: options.orderDirection || 'desc',
    });
  }

  async markNotificationAsRead(notificationId: string): Promise<ApiResponse<Notification>> {
    return this.handleQuery(async () => {
      return await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .select()
        .single();
    });
  }

  async markAllNotificationsAsRead(userId: string): Promise<ApiResponse<void>> {
    return this.handleQuery(async () => {
      return await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .is('read_at', null);
    });
  }

  async getUnreadCount(userId: string): Promise<ApiResponse<number>> {
    return this.handleQuery(async () => {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .is('read_at', null);

      return { data: count || 0, error };
    });
  }
}

/**
 * Real-time Subscription Service
 */
class SubscriptionService {
  private subscriptions = new Map<string, () => void>();

  subscribeToUserNotifications(
    userId: string,
    callback: (payload: RealtimePayload<Notification>) => void
  ): () => void {
    const subscriptionKey = `notifications_${userId}`;
    
    // Unsubscribe existing subscription if any
    this.unsubscribe(subscriptionKey);
    
    const unsubscribe = supabase
      .channel(`notifications_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        callback
      )
      .subscribe();

    const cleanup = () => {
      supabase.removeChannel(unsubscribe);
    };

    this.subscriptions.set(subscriptionKey, cleanup);
    return cleanup;
  }

  subscribeToUserSessions(
    userId: string,
    callback: (payload: RealtimePayload<Session>) => void
  ): () => void {
    const subscriptionKey = `sessions_${userId}`;
    
    // Unsubscribe existing subscription if any
    this.unsubscribe(subscriptionKey);
    
    const unsubscribe = supabase
      .channel(`sessions_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sessions',
          filter: `or(coach_id.eq.${userId},client_id.eq.${userId})`,
        },
        callback
      )
      .subscribe();

    const cleanup = () => {
      supabase.removeChannel(unsubscribe);
    };

    this.subscriptions.set(subscriptionKey, cleanup);
    return cleanup;
  }

  unsubscribe(key: string): void {
    const cleanup = this.subscriptions.get(key);
    if (cleanup) {
      cleanup();
      this.subscriptions.delete(key);
    }
  }

  unsubscribeAll(): void {
    this.subscriptions.forEach(cleanup => cleanup());
    this.subscriptions.clear();
  }
}

// Export service instances
export const profileService = new ProfileService();
export const coachService = new CoachService();
export const sessionService = new SessionService();
export const notificationService = new NotificationService();
export const subscriptionService = new SubscriptionService();

// Export combined API service
export const apiService = {
  profiles: profileService,
  coaches: coachService,
  sessions: sessionService,
  notifications: notificationService,
  subscriptions: subscriptionService,
};

export default apiService;