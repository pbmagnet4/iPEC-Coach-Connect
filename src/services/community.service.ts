/**
 * Community Service for iPEC Coach Connect
 * 
 * Manages community features including groups, discussions, and member interactions
 */

import { handleSupabaseError, supabase, SupabaseError, supabaseUtils } from '../lib/supabase';
import { authService } from './auth.service';
import type {
  ApiResponse,
  DiscussionReplyWithAuthor,
  DiscussionWithDetails,
  PaginatedResponse,
  PaginationOptions,
  Tables,
} from '../types/database';

// Type definitions
export interface Group extends Tables<'groups'> {
  member_count?: number;
  recent_activity?: string;
}

export interface Discussion extends DiscussionWithDetails {
  reply_count?: number;
  like_count?: number;
}

export interface CommunityStats {
  totalGroups: number;
  totalDiscussions: number;
  totalMembers: number;
  activeGroups: number;
}

export interface TrendingTopic {
  name: string;
  posts: number;
  trend: 'up' | 'down' | 'stable';
}

export interface NewMember {
  id: string;
  name: string;
  image: string | null;
  title: string | null;
  joinDate: string;
}

/**
 * Community Management Service
 */
class CommunityManagementService {
  /**
   * Get featured/popular discussions
   */
  async getFeaturedDiscussions(limit = 10): Promise<ApiResponse<Discussion[]>> {
    try {
      const result = await supabaseUtils.db.safeQuery(async () => {
        return await supabase
          .from('discussions')
          .select(`
            *,
            author:profiles(id, full_name, avatar_url),
            group:groups(name),
            replies:discussion_replies(count)
          `)
          .eq('is_featured', true)
          .order('created_at', { ascending: false })
          .limit(limit);
      });

      if (!result) {
        throw new SupabaseError('Failed to fetch featured discussions');
      }

      const discussions: Discussion[] = result.map((discussion: any) => ({
        ...discussion,
        reply_count: discussion.replies?.length || 0,
        like_count: 0, // TODO: Implement likes system
      }));

      return { data: discussions };
    } catch (error) {
      return { error: handleSupabaseError(error) };
    }
  }

  /**
   * Get active groups
   */
  async getActiveGroups(limit = 10): Promise<ApiResponse<Group[]>> {
    try {
      const result = await supabaseUtils.db.safeQuery(async () => {
        return await supabase
          .from('groups')
          .select(`
            *,
            members:group_members(count),
            recent_discussions:discussions(created_at)
          `)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(limit);
      });

      if (!result) {
        throw new SupabaseError('Failed to fetch active groups');
      }

      const groups: Group[] = result.map((group: any) => ({
        ...group,
        member_count: group.members?.length || 0,
        recent_activity: group.recent_discussions?.[0]?.created_at || group.created_at,
      }));

      return { data: groups };
    } catch (error) {
      return { error: handleSupabaseError(error) };
    }
  }

  /**
   * Get trending topics (based on recent discussion activity)
   */
  async getTrendingTopics(limit = 10): Promise<ApiResponse<TrendingTopic[]>> {
    try {
      // This is a simplified implementation - in a real app you'd have more sophisticated analytics
      const result = await supabaseUtils.db.safeQuery(async () => {
        return await supabase
          .from('discussions')
          .select('tags')
          .not('tags', 'is', null)
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()); // Last 7 days
      });

      if (!result) {
        return { data: [] };
      }

      // Count tag occurrences
      const tagCounts: Record<string, number> = {};
      result.forEach((discussion: any) => {
        if (discussion.tags && Array.isArray(discussion.tags)) {
          discussion.tags.forEach((tag: string) => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        }
      });

      // Convert to trending topics format
      const trendingTopics: TrendingTopic[] = Object.entries(tagCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit)
        .map(([name, posts]) => ({
          name,
          posts,
          trend: 'up' as const, // Simplified - in real app you'd compare with previous period
        }));

      return { data: trendingTopics };
    } catch (error) {
      return { error: handleSupabaseError(error) };
    }
  }

  /**
   * Get new members (recently joined users)
   */
  async getNewMembers(limit = 10): Promise<ApiResponse<NewMember[]>> {
    try {
      const result = await supabaseUtils.db.safeQuery(async () => {
        return await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, professional_title, created_at')
          .order('created_at', { ascending: false })
          .limit(limit);
      });

      if (!result) {
        throw new SupabaseError('Failed to fetch new members');
      }

      const newMembers: NewMember[] = result.map((profile: any) => ({
        id: profile.id,
        name: profile.full_name || 'New Member',
        image: profile.avatar_url,
        title: profile.professional_title,
        joinDate: profile.created_at,
      }));

      return { data: newMembers };
    } catch (error) {
      return { error: handleSupabaseError(error) };
    }
  }

  /**
   * Get community statistics
   */
  async getCommunityStats(): Promise<ApiResponse<CommunityStats>> {
    try {
      const [groupsResult, discussionsResult, membersResult] = await Promise.all([
        supabaseUtils.db.safeQuery(async () => {
          const { count } = await supabase
            .from('groups')
            .select('*', { count: 'exact', head: true })
            .eq('is_active', true);
          return { data: count, error: null };
        }),
        supabaseUtils.db.safeQuery(async () => {
          const { count } = await supabase
            .from('discussions')
            .select('*', { count: 'exact', head: true });
          return { data: count, error: null };
        }),
        supabaseUtils.db.safeQuery(async () => {
          const { count } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });
          return { data: count, error: null };
        }),
      ]);

      const stats: CommunityStats = {
        totalGroups: groupsResult || 0,
        totalDiscussions: discussionsResult || 0,
        totalMembers: membersResult || 0,
        activeGroups: groupsResult || 0, // Simplified
      };

      return { data: stats };
    } catch (error) {
      return { error: handleSupabaseError(error) };
    }
  }

  /**
   * Create a new discussion
   */
  async createDiscussion(
    title: string,
    content: string,
    groupId?: string,
    tags?: string[]
  ): Promise<ApiResponse<Discussion>> {
    try {
      const authState = authService.getState();
      if (!authState.user) {
        throw new SupabaseError('User not authenticated');
      }

      const discussionData = {
        title,
        content,
        author_id: authState.user.id,
        group_id: groupId || null,
        tags: tags || [],
        is_featured: false,
      };

      const result = await supabaseUtils.db.safeQuery(async () => {
        return await supabase
          .from('discussions')
          .insert(discussionData)
          .select(`
            *,
            author:profiles(id, full_name, avatar_url),
            group:groups(name)
          `)
          .single();
      });

      if (!result) {
        throw new SupabaseError('Failed to create discussion');
      }

      const discussion: Discussion = {
        ...result,
        reply_count: 0,
        like_count: 0,
      };

      return { data: discussion };
    } catch (error) {
      return { error: handleSupabaseError(error) };
    }
  }

  /**
   * Join a group
   */
  async joinGroup(groupId: string): Promise<ApiResponse<void>> {
    try {
      const authState = authService.getState();
      if (!authState.user) {
        throw new SupabaseError('User not authenticated');
      }

      await supabaseUtils.db.safeQuery(async () => {
        return await supabase
          .from('group_members')
          .insert({
            group_id: groupId,
            user_id: authState.user.id,
            role: 'member',
          });
      });

      return { data: undefined };
    } catch (error) {
      return { error: handleSupabaseError(error) };
    }
  }

  /**
   * Leave a group
   */
  async leaveGroup(groupId: string): Promise<ApiResponse<void>> {
    try {
      const authState = authService.getState();
      if (!authState.user) {
        throw new SupabaseError('User not authenticated');
      }

      await supabaseUtils.db.safeQuery(async () => {
        return await supabase
          .from('group_members')
          .delete()
          .eq('group_id', groupId)
          .eq('user_id', authState.user.id);
      });

      return { data: undefined };
    } catch (error) {
      return { error: handleSupabaseError(error) };
    }
  }

  /**
   * Get user's groups
   */
  async getUserGroups(userId?: string): Promise<ApiResponse<Group[]>> {
    try {
      const authState = authService.getState();
      const targetUserId = userId || authState.user?.id;
      
      if (!targetUserId) {
        throw new SupabaseError('User not authenticated');
      }

      const result = await supabaseUtils.db.safeQuery(async () => {
        return await supabase
          .from('group_members')
          .select(`
            group:groups(
              *,
              members:group_members(count)
            )
          `)
          .eq('user_id', targetUserId);
      });

      if (!result) {
        return { data: [] };
      }

      const groups: Group[] = result.map((membership: any) => ({
        ...membership.group,
        member_count: membership.group.members?.length || 0,
      }));

      return { data: groups };
    } catch (error) {
      return { error: handleSupabaseError(error) };
    }
  }
}

// Export singleton instance
export const communityService = new CommunityManagementService();

export default communityService;