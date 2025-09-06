/**
 * Feature Flag Service
 * Dynamic feature toggling system integrated with A/B testing
 */

import { supabase } from '../lib/supabase';
import { abTestingService } from './ab-testing.service';
import { analyticsService } from './analytics.service';
import type {
  FeatureFlag,
  UserContext,
  ABTestingError,
  TrafficAllocation,
  TargetingRule
} from '../types/ab-testing';

class FeatureFlagsService {
  private flagCache = new Map<string, FeatureFlag>();
  private userFlagCache = new Map<string, Map<string, any>>();
  private cacheExpiry = 3 * 60 * 1000; // 3 minutes for faster feature flag updates
  private lastCacheUpdate = 0;

  /**
   * Initialize the feature flags service
   */
  async initialize(): Promise<void> {
    await this.refreshFlagCache();
    this.setupRealtimeUpdates();
  }

  /**
   * Create a new feature flag
   */
  async createFlag(
    key: string,
    name: string,
    description: string,
    defaultValue: any,
    options: {
      rolloutPercentage?: TrafficAllocation;
      targetingRules?: TargetingRule[];
      tags?: string[];
      experimentId?: string;
    } = {}
  ): Promise<FeatureFlag> {
    try {
      const flag: Omit<FeatureFlag, 'created_at' | 'updated_at'> = {
        key,
        name,
        description,
        is_active: true,
        rollout_percentage: options.rolloutPercentage || 100,
        targeting_rules: options.targetingRules || [],
        experiment_id: options.experimentId,
        use_for_ab_test: !!options.experimentId,
        default_value: defaultValue,
        variant_values: {},
        created_by: (await supabase.auth.getUser()).data.user?.id || 'system',
        tags: options.tags || [],
      };

      const { data, error } = await supabase
        .from('feature_flags')
        .insert([flag])
        .select()
        .single();

      if (error) throw error;

      // Clear cache to ensure fresh data
      this.flagCache.clear();
      this.userFlagCache.clear();

      return data as FeatureFlag;
    } catch (error) {
      throw new ABTestingError(
        'Failed to create feature flag',
        'INVALID_CONFIG',
        error
      );
    }
  }

  /**
   * Update a feature flag
   */
  async updateFlag(
    key: string,
    updates: Partial<Pick<FeatureFlag, 'name' | 'description' | 'is_active' | 'rollout_percentage' | 'targeting_rules' | 'default_value' | 'variant_values'>>
  ): Promise<FeatureFlag> {
    try {
      const { data, error } = await supabase
        .from('feature_flags')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('key', key)
        .select()
        .single();

      if (error) throw error;

      // Clear caches
      this.flagCache.delete(key);
      this.userFlagCache.clear();

      return data as FeatureFlag;
    } catch (error) {
      throw new ABTestingError(
        'Failed to update feature flag',
        'INVALID_CONFIG',
        error
      );
    }
  }

  /**
   * Delete a feature flag
   */
  async deleteFlag(key: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('feature_flags')
        .delete()
        .eq('key', key);

      if (error) throw error;

      // Clear caches
      this.flagCache.delete(key);
      this.userFlagCache.clear();

      // Track flag deletion
      analyticsService.track('feature_flag_deleted', {
        flag_key: key,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      throw new ABTestingError(
        'Failed to delete feature flag',
        'INVALID_CONFIG',
        error
      );
    }
  }

  /**
   * Evaluate a feature flag for a user
   */
  async evaluateFlag(key: string, userContext: UserContext, defaultValue?: any): Promise<{
    value: any;
    variant: string | null;
    isEnabled: boolean;
  }> {
    try {
      // Check user cache first
      const userCacheKey = `${userContext.user_id}_${userContext.session_id}`;
      const userCache = this.userFlagCache.get(userCacheKey);
      if (userCache && userCache.has(key)) {
        const cached = userCache.get(key);
        this.trackFlagEvaluation(key, cached.value, userContext, cached.variant);
        return cached;
      }

      // Get flag configuration
      const flag = await this.getFlag(key);
      if (!flag || !flag.is_active) {
        const fallbackValue = defaultValue !== undefined ? defaultValue : (flag?.default_value || false);
        const result = {
          value: fallbackValue,
          variant: null,
          isEnabled: false
        };
        this.cacheUserFlagResult(userCacheKey, key, result);
        return result;
      }

      // Check if flag is used for A/B testing
      if (flag.use_for_ab_test && flag.experiment_id) {
        return await this.evaluateExperimentFlag(flag, userContext);
      }

      // Standard feature flag evaluation
      return await this.evaluateStandardFlag(flag, userContext, defaultValue);
    } catch (error) {
      console.error(`Error evaluating flag ${key}:`, error);
      
      // Return safe fallback
      const fallbackValue = defaultValue !== undefined ? defaultValue : false;
      return {
        value: fallbackValue,
        variant: null,
        isEnabled: false
      };
    }
  }

  /**
   * Evaluate multiple flags at once
   */
  async evaluateFlags(keys: string[], userContext: UserContext): Promise<Record<string, any>> {
    const results: Record<string, any> = {};
    
    // Evaluate flags in parallel for better performance
    const evaluations = await Promise.allSettled(
      keys.map(key => this.evaluateFlag(key, userContext))
    );

    evaluations.forEach((result, index) => {
      const key = keys[index];
      if (result.status === 'fulfilled') {
        results[key] = result.value.value;
      } else {
        console.error(`Failed to evaluate flag ${key}:`, result.reason);
        results[key] = false; // Safe fallback
      }
    });

    return results;
  }

  /**
   * Get all flags for a user (for dashboard/debugging)
   */
  async getUserFlags(userContext: UserContext): Promise<Array<{
    key: string;
    name: string;
    value: any;
    variant: string | null;
    isEnabled: boolean;
    reason: string;
  }>> {
    try {
      const flags = await this.getAllFlags();
      const results = await Promise.allSettled(
        flags.map(async flag => {
          const evaluation = await this.evaluateFlag(flag.key, userContext);
          return {
            key: flag.key,
            name: flag.name,
            value: evaluation.value,
            variant: evaluation.variant,
            isEnabled: evaluation.isEnabled,
            reason: this.getEvaluationReason(flag, userContext, evaluation)
          };
        })
      );

      return results
        .filter(result => result.status === 'fulfilled')
        .map(result => (result as PromiseFulfilledResult<any>).value);
    } catch (error) {
      throw new ABTestingError(
        'Failed to get user flags',
        'INVALID_CONFIG',
        error
      );
    }
  }

  /**
   * List all feature flags
   */
  async listFlags(activeOnly: boolean = false): Promise<FeatureFlag[]> {
    try {
      let query = supabase.from('feature_flags').select('*');
      
      if (activeOnly) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      return data as FeatureFlag[];
    } catch (error) {
      throw new ABTestingError(
        'Failed to list feature flags',
        'INVALID_CONFIG',
        error
      );
    }
  }

  /**
   * Get flag usage statistics
   */
  async getFlagStats(key: string, days: number = 7): Promise<{
    evaluations: number;
    uniqueUsers: number;
    enabledRate: number;
    variantBreakdown: Record<string, number>;
  }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // This would typically query your analytics system
      // For now, return mock data structure
      return {
        evaluations: 0,
        uniqueUsers: 0,
        enabledRate: 0,
        variantBreakdown: {}
      };
    } catch (error) {
      throw new ABTestingError(
        'Failed to get flag statistics',
        'STATISTICAL_ERROR',
        error
      );
    }
  }

  // Private helper methods

  private async getFlag(key: string): Promise<FeatureFlag | null> {
    // Check cache first
    if (this.flagCache.has(key)) {
      return this.flagCache.get(key)!;
    }

    // Refresh cache if stale
    await this.refreshFlagCache();

    return this.flagCache.get(key) || null;
  }

  private async getAllFlags(): Promise<FeatureFlag[]> {
    await this.refreshFlagCache();
    return Array.from(this.flagCache.values());
  }

  private async refreshFlagCache(): Promise<void> {
    const now = Date.now();
    if (now - this.lastCacheUpdate < this.cacheExpiry) {
      return;
    }

    try {
      const { data: flags } = await supabase
        .from('feature_flags')
        .select('*')
        .eq('is_active', true);

      if (flags) {
        this.flagCache.clear();
        flags.forEach(flag => {
          this.flagCache.set(flag.key, flag as FeatureFlag);
        });
      }

      this.lastCacheUpdate = now;
    } catch (error) {
      console.error('Failed to refresh flag cache:', error);
    }
  }

  private async evaluateExperimentFlag(flag: FeatureFlag, userContext: UserContext): Promise<{
    value: any;
    variant: string | null;
    isEnabled: boolean;
  }> {
    if (!flag.experiment_id) {
      throw new ABTestingError('Experiment ID missing for A/B test flag', 'INVALID_CONFIG');
    }

    // Get user assignment from A/B testing service
    const assignment = await abTestingService.getAssignment(flag.experiment_id, userContext);
    
    if (!assignment) {
      // User not in experiment, return default
      const result = {
        value: flag.default_value,
        variant: null,
        isEnabled: false
      };
      this.cacheUserFlagResult(`${userContext.user_id}_${userContext.session_id}`, flag.key, result);
      return result;
    }

    // Get variant-specific value
    const variantValue = flag.variant_values[assignment.variant_id] !== undefined 
      ? flag.variant_values[assignment.variant_id]
      : flag.default_value;

    const result = {
      value: variantValue,
      variant: assignment.variant_id,
      isEnabled: true
    };

    this.cacheUserFlagResult(`${userContext.user_id}_${userContext.session_id}`, flag.key, result);
    this.trackFlagEvaluation(flag.key, variantValue, userContext, assignment.variant_id);

    return result;
  }

  private async evaluateStandardFlag(flag: FeatureFlag, userContext: UserContext, defaultValue?: any): Promise<{
    value: any;
    variant: string | null;
    isEnabled: boolean;
  }> {
    // Check targeting rules
    if (!this.matchesTargeting(userContext, flag.targeting_rules)) {
      const fallbackValue = defaultValue !== undefined ? defaultValue : flag.default_value;
      const result = {
        value: fallbackValue,
        variant: null,
        isEnabled: false
      };
      this.cacheUserFlagResult(`${userContext.user_id}_${userContext.session_id}`, flag.key, result);
      return result;
    }

    // Check rollout percentage
    if (!this.isInRollout(userContext, flag.rollout_percentage)) {
      const fallbackValue = defaultValue !== undefined ? defaultValue : flag.default_value;
      const result = {
        value: fallbackValue,
        variant: null,
        isEnabled: false
      };
      this.cacheUserFlagResult(`${userContext.user_id}_${userContext.session_id}`, flag.key, result);
      return result;
    }

    // User is in rollout, return flag value
    const result = {
      value: flag.default_value,
      variant: 'default',
      isEnabled: true
    };

    this.cacheUserFlagResult(`${userContext.user_id}_${userContext.session_id}`, flag.key, result);
    this.trackFlagEvaluation(flag.key, flag.default_value, userContext, 'default');

    return result;
  }

  private matchesTargeting(userContext: UserContext, targetingRules: TargetingRule[]): boolean {
    // If no targeting rules, include all users
    if (!targetingRules || targetingRules.length === 0) {
      return true;
    }

    // User must match at least one targeting rule
    return targetingRules.some(rule => {
      return this.matchesTargetingRule(userContext, rule);
    });
  }

  private matchesTargetingRule(userContext: UserContext, rule: TargetingRule): boolean {
    const { criteria, conditions } = rule;

    // Check basic criteria (reuse logic from A/B testing service)
    switch (criteria) {
      case 'new_users':
        const daysSinceRegistration = Math.floor(
          (Date.now() - new Date(userContext.user_properties.registration_date).getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSinceRegistration > 7) return false;
        break;
      case 'returning_users':
        if (userContext.user_properties.behavioral_attributes.session_count <= 1) return false;
        break;
      case 'premium_users':
        if (userContext.user_properties.subscription_tier !== 'premium') return false;
        break;
      case 'mobile_users':
        if (userContext.user_properties.device_info.type !== 'mobile') return false;
        break;
      case 'desktop_users':
        if (userContext.user_properties.device_info.type === 'mobile') return false;
        break;
    }

    // Check additional conditions
    if (conditions) {
      if (conditions.device_type && userContext.user_properties.device_info.type !== conditions.device_type) {
        return false;
      }

      if (conditions.location && !conditions.location.includes(userContext.user_properties.location?.country || '')) {
        return false;
      }

      // Custom attribute matching
      if (conditions.custom_attributes) {
        for (const [key, value] of Object.entries(conditions.custom_attributes)) {
          if (userContext.user_properties.behavioral_attributes[key as keyof typeof userContext.user_properties.behavioral_attributes] !== value) {
            return false;
          }
        }
      }
    }

    return true;
  }

  private isInRollout(userContext: UserContext, rolloutPercentage: TrafficAllocation): boolean {
    // Use deterministic hashing for consistent assignment
    const hash = this.hashString(`${userContext.user_id}_rollout`);
    const bucket = hash % 100;
    return bucket < rolloutPercentage;
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private cacheUserFlagResult(userCacheKey: string, flagKey: string, result: any): void {
    if (!this.userFlagCache.has(userCacheKey)) {
      this.userFlagCache.set(userCacheKey, new Map());
    }
    this.userFlagCache.get(userCacheKey)!.set(flagKey, result);

    // Clean up old cache entries periodically
    if (this.userFlagCache.size > 1000) {
      const oldestKey = this.userFlagCache.keys().next().value;
      this.userFlagCache.delete(oldestKey);
    }
  }

  private trackFlagEvaluation(key: string, value: any, userContext: UserContext, variant: string | null): void {
    analyticsService.track('feature_flag_evaluated', {
      flag_key: key,
      value,
      variant,
      user_id: userContext.user_id,
      session_id: userContext.session_id,
      timestamp: new Date().toISOString(),
    });
  }

  private getEvaluationReason(flag: FeatureFlag, userContext: UserContext, evaluation: any): string {
    if (!flag.is_active) return 'Flag is disabled';
    if (!evaluation.isEnabled && flag.use_for_ab_test) return 'Not selected for A/B test';
    if (!evaluation.isEnabled && !this.matchesTargeting(userContext, flag.targeting_rules)) return 'Does not match targeting rules';
    if (!evaluation.isEnabled && !this.isInRollout(userContext, flag.rollout_percentage)) return 'Not in rollout percentage';
    return evaluation.isEnabled ? 'Enabled' : 'Disabled';
  }

  private setupRealtimeUpdates(): void {
    // Set up Supabase real-time subscription for flag updates
    const channel = supabase
      .channel('feature_flags_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'feature_flags'
      }, (payload) => {
        // Clear cache when flags change
        this.flagCache.clear();
        this.userFlagCache.clear();
        console.log('Feature flag updated:', payload);
      })
      .subscribe();

    // Store channel reference for cleanup if needed
    (this as any).realtimeChannel = channel;
  }
}

export const featureFlagsService = new FeatureFlagsService();