/**
 * A/B Testing Service
 * Core service for experiment management, user assignment, and statistical analysis
 */

import { supabase } from '../lib/supabase';
import { analyticsService } from './analytics.service';
import type {
  ABTestingError,
  ConversionEvent,
  CreateExperimentPayload,
  Experiment,
  ExperimentAssignment,
  ExperimentResult,
  ExperimentStatus,
  ExperimentSummary,
  ExperimentVariant,
  TrafficAllocation,
  UserContext
} from '../types/ab-testing';

class ABTestingService {
  private assignmentCache = new Map<string, ExperimentAssignment>();
  private experimentCache = new Map<string, Experiment>();
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes
  private lastCacheUpdate = 0;

  /**
   * Initialize the A/B testing service
   */
  async initialize(): Promise<void> {
    await this.refreshExperimentCache();
    this.setupAnalyticsIntegration();
  }

  /**
   * Create a new experiment
   */
  async createExperiment(payload: CreateExperimentPayload): Promise<Experiment> {
    try {
      // Validate experiment configuration
      this.validateExperimentConfig(payload);

      const experiment: Omit<Experiment, 'id' | 'created_at'> = {
        ...payload,
        status: 'draft',
        variants: payload.variants.map((variant, index) => ({
          ...variant,
          id: `${payload.feature_key}_variant_${index}`,
        })),
        created_by: (await supabase.auth.getUser()).data.user?.id || 'system',
        expected_impact: '', // Will be calculated based on metrics
        business_justification: payload.business_justification,
      };

      const { data, error } = await supabase
        .from('ab_experiments')
        .insert([experiment])
        .select()
        .single();

      if (error) throw error;

      // Clear cache to ensure fresh data
      this.experimentCache.clear();
      
      return data as Experiment;
    } catch (error) {
      throw new ABTestingError(
        'Failed to create experiment',
        'INVALID_CONFIG',
        error
      );
    }
  }

  /**
   * Get experiment by ID
   */
  async getExperiment(experimentId: string): Promise<Experiment | null> {
    try {
      // Check cache first
      if (this.experimentCache.has(experimentId)) {
        return this.experimentCache.get(experimentId)!;
      }

      const { data, error } = await supabase
        .from('ab_experiments')
        .select('*')
        .eq('id', experimentId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (!data) return null;

      const experiment = data as Experiment;
      this.experimentCache.set(experimentId, experiment);
      
      return experiment;
    } catch (error) {
      throw new ABTestingError(
        `Failed to fetch experiment: ${experimentId}`,
        'EXPERIMENT_NOT_FOUND',
        error
      );
    }
  }

  /**
   * Start an experiment
   */
  async startExperiment(experimentId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('ab_experiments')
        .update({
          status: 'active',
          started_at: new Date().toISOString()
        })
        .eq('id', experimentId);

      if (error) throw error;

      // Clear cache
      this.experimentCache.delete(experimentId);

      // Track experiment start
      analyticsService.track('experiment_started', {
        experiment_id: experimentId,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      throw new ABTestingError(
        'Failed to start experiment',
        'EXPERIMENT_NOT_FOUND',
        error
      );
    }
  }

  /**
   * Stop an experiment
   */
  async stopExperiment(experimentId: string, reason: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('ab_experiments')
        .update({
          status: 'completed',
          ended_at: new Date().toISOString()
        })
        .eq('id', experimentId);

      if (error) throw error;

      // Clear cache
      this.experimentCache.delete(experimentId);

      // Track experiment stop
      analyticsService.track('experiment_stopped', {
        experiment_id: experimentId,
        reason,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      throw new ABTestingError(
        'Failed to stop experiment',
        'EXPERIMENT_NOT_FOUND',
        error
      );
    }
  }

  /**
   * Get user assignment for an experiment
   */
  async getAssignment(experimentId: string, userContext: UserContext): Promise<ExperimentAssignment | null> {
    try {
      const cacheKey = `${experimentId}_${userContext.user_id}`;
      
      // Check cache first
      if (this.assignmentCache.has(cacheKey)) {
        return this.assignmentCache.get(cacheKey)!;
      }

      // Check database for existing assignment
      const { data: existingAssignment } = await supabase
        .from('ab_assignments')
        .select('*')
        .eq('experiment_id', experimentId)
        .eq('user_id', userContext.user_id)
        .single();

      if (existingAssignment) {
        const assignment = existingAssignment as ExperimentAssignment;
        this.assignmentCache.set(cacheKey, assignment);
        return assignment;
      }

      // Get experiment
      const experiment = await this.getExperiment(experimentId);
      if (!experiment || experiment.status !== 'active') {
        return null;
      }

      // Check if user matches targeting criteria
      if (!this.matchesTargeting(userContext, experiment.targeting)) {
        return null;
      }

      // Check traffic allocation
      if (!this.isInTrafficAllocation(userContext, experiment.traffic_allocation)) {
        return null;
      }

      // Assign user to variant
      const variant = this.assignToVariant(userContext, experiment.variants);
      
      const assignment: Omit<ExperimentAssignment, 'id'> = {
        user_id: userContext.user_id,
        experiment_id: experimentId,
        variant_id: variant.id,
        assigned_at: new Date().toISOString(),
        session_id: userContext.session_id,
        user_agent: navigator.userAgent,
        ip_address: '', // Will be set server-side for privacy
      };

      // Save assignment to database
      const { data, error } = await supabase
        .from('ab_assignments')
        .insert([assignment])
        .select()
        .single();

      if (error) throw error;

      const finalAssignment = data as ExperimentAssignment;
      this.assignmentCache.set(cacheKey, finalAssignment);

      // Track exposure
      this.trackExposure(experimentId, variant.id, userContext);

      return finalAssignment;
    } catch (error) {
      throw new ABTestingError(
        'Failed to get user assignment',
        'ASSIGNMENT_ERROR',
        error
      );
    }
  }

  /**
   * Track conversion event
   */
  async trackConversion(
    experimentId: string,
    metricName: string,
    userContext: UserContext,
    value = 1,
    properties?: Record<string, any>
  ): Promise<void> {
    try {
      // Get user assignment
      const assignment = await this.getAssignment(experimentId, userContext);
      if (!assignment) return;

      const conversionEvent: Omit<ConversionEvent, 'id'> = {
        user_id: userContext.user_id,
        experiment_id: experimentId,
        variant_id: assignment.variant_id,
        metric_name: metricName,
        value,
        properties,
        occurred_at: new Date().toISOString(),
        session_id: userContext.session_id,
      };

      const { error } = await supabase
        .from('ab_conversions')
        .insert([conversionEvent]);

      if (error) throw error;

      // Track in analytics
      analyticsService.track('ab_conversion', {
        experiment_id: experimentId,
        variant_id: assignment.variant_id,
        metric_name: metricName,
        value,
        properties,
      });
    } catch (error) {
      throw new ABTestingError(
        'Failed to track conversion',
        'STATISTICAL_ERROR',
        error
      );
    }
  }

  /**
   * Calculate experiment results
   */
  async calculateResults(experimentId: string): Promise<ExperimentResult[]> {
    try {
      const experiment = await this.getExperiment(experimentId);
      if (!experiment) {
        throw new ABTestingError('Experiment not found', 'EXPERIMENT_NOT_FOUND');
      }

      const results: ExperimentResult[] = [];

      for (const metric of experiment.metrics) {
        for (const variant of experiment.variants) {
          const result = await this.calculateVariantResult(
            experimentId,
            variant.id,
            metric.name,
            experiment.statistical_config.confidence_level,
            experiment.statistical_config.bayesian_analysis
          );
          results.push(result);
        }
      }

      return results;
    } catch (error) {
      throw new ABTestingError(
        'Failed to calculate results',
        'STATISTICAL_ERROR',
        error
      );
    }
  }

  /**
   * Get experiment summary with recommendations
   */
  async getExperimentSummary(experimentId: string): Promise<ExperimentSummary> {
    try {
      const experiment = await this.getExperiment(experimentId);
      if (!experiment) {
        throw new ABTestingError('Experiment not found', 'EXPERIMENT_NOT_FOUND');
      }

      const results = await this.calculateResults(experimentId);
      const status = this.calculateExperimentStatus(experiment, results);
      const recommendations = this.generateRecommendations(experiment, results, status);

      return {
        experiment,
        results,
        status,
        recommendations,
      };
    } catch (error) {
      throw new ABTestingError(
        'Failed to get experiment summary',
        'STATISTICAL_ERROR',
        error
      );
    }
  }

  /**
   * List all experiments with optional filtering
   */
  async listExperiments(
    status?: ExperimentStatus,
    createdBy?: string,
    tags?: string[]
  ): Promise<Experiment[]> {
    try {
      let query = supabase.from('ab_experiments').select('*');

      if (status) {
        query = query.eq('status', status);
      }

      if (createdBy) {
        query = query.eq('created_by', createdBy);
      }

      if (tags && tags.length > 0) {
        query = query.contains('tags', tags);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      return data as Experiment[];
    } catch (error) {
      throw new ABTestingError(
        'Failed to list experiments',
        'EXPERIMENT_NOT_FOUND',
        error
      );
    }
  }

  // Private helper methods

  private validateExperimentConfig(payload: CreateExperimentPayload): void {
    // Validate traffic weights sum to 100
    const totalWeight = payload.variants.reduce((sum, variant) => sum + variant.traffic_weight, 0);
    if (totalWeight !== 100) {
      throw new ABTestingError(
        'Variant traffic weights must sum to 100',
        'INVALID_CONFIG'
      );
    }

    // Validate at least one control variant
    const hasControl = payload.variants.some(variant => variant.is_control);
    if (!hasControl) {
      throw new ABTestingError(
        'Experiment must have at least one control variant',
        'INVALID_CONFIG'
      );
    }

    // Validate at least one primary metric
    const hasPrimaryMetric = payload.metrics.some(metric => metric.is_primary);
    if (!hasPrimaryMetric) {
      throw new ABTestingError(
        'Experiment must have at least one primary metric',
        'INVALID_CONFIG'
      );
    }
  }

  private matchesTargeting(userContext: UserContext, targetingRules: any[]): boolean {
    // If no targeting rules, include all users
    if (!targetingRules || targetingRules.length === 0) {
      return true;
    }

    // User must match at least one targeting rule
    return targetingRules.some(rule => {
      return this.matchesTargetingRule(userContext, rule);
    });
  }

  private matchesTargetingRule(userContext: UserContext, rule: any): boolean {
    const { criteria, conditions } = rule;

    // Check basic criteria
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

      if (conditions.location && !conditions.location.includes(userContext.user_properties.location?.country)) {
        return false;
      }

      // Add more condition checks as needed
    }

    return true;
  }

  private isInTrafficAllocation(userContext: UserContext, allocation: TrafficAllocation): boolean {
    // Use deterministic hashing for consistent assignment
    const hash = this.hashString(`${userContext.user_id}_traffic`);
    const bucket = hash % 100;
    return bucket < allocation;
  }

  private assignToVariant(userContext: UserContext, variants: ExperimentVariant[]): ExperimentVariant {
    // Use deterministic hashing for consistent assignment
    const hash = this.hashString(`${userContext.user_id}_variant`);
    const bucket = hash % 100;

    let cumulativeWeight = 0;
    for (const variant of variants) {
      cumulativeWeight += variant.traffic_weight;
      if (bucket < cumulativeWeight) {
        return variant;
      }
    }

    // Fallback to control variant
    return variants.find(v => v.is_control) || variants[0];
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

  private async trackExposure(experimentId: string, variantId: string, userContext: UserContext): Promise<void> {
    analyticsService.track('ab_exposure', {
      experiment_id: experimentId,
      variant_id: variantId,
      user_id: userContext.user_id,
      session_id: userContext.session_id,
      timestamp: new Date().toISOString(),
    });
  }

  private async calculateVariantResult(
    experimentId: string,
    variantId: string,
    metricName: string,
    confidenceLevel: number,
    useBayesian: boolean
  ): Promise<ExperimentResult> {
    // Get conversion data
    const { data: conversions, error } = await supabase
      .from('ab_conversions')
      .select('value')
      .eq('experiment_id', experimentId)
      .eq('variant_id', variantId)
      .eq('metric_name', metricName);

    if (error) throw error;

    const { data: assignments } = await supabase
      .from('ab_assignments')
      .select('user_id')
      .eq('experiment_id', experimentId)
      .eq('variant_id', variantId);

    const sampleSize = assignments?.length || 0;
    const conversionCount = conversions?.length || 0;
    const conversionRate = sampleSize > 0 ? conversionCount / sampleSize : 0;

    // Calculate confidence interval (simplified)
    const standardError = Math.sqrt((conversionRate * (1 - conversionRate)) / sampleSize);
    const zScore = confidenceLevel === 0.99 ? 2.576 : confidenceLevel === 0.95 ? 1.96 : 1.645;
    const marginOfError = zScore * standardError;

    return {
      experiment_id: experimentId,
      variant_id: variantId,
      metric_name: metricName,
      sample_size: sampleSize,
      conversion_count: conversionCount,
      conversion_rate: conversionRate,
      confidence_interval: {
        lower: Math.max(0, conversionRate - marginOfError),
        upper: Math.min(1, conversionRate + marginOfError),
        confidence_level: confidenceLevel,
      },
      lift: 0, // Will be calculated against control
      lift_confidence_interval: {
        lower: 0,
        upper: 0,
      },
      p_value: 0, // Simplified - would need proper statistical test
      is_significant: false, // Simplified
      statistical_power: 0.8, // Simplified
      calculated_at: new Date().toISOString(),
      calculation_method: useBayesian ? 'bayesian' : 'frequentist',
    };
  }

  private calculateExperimentStatus(experiment: Experiment, results: ExperimentResult[]): any {
    const runtimeHours = experiment.started_at ? 
      Math.floor((Date.now() - new Date(experiment.started_at).getTime()) / (1000 * 60 * 60)) : 0;

    const totalSampleSize = results.reduce((sum, result) => sum + result.sample_size, 0);
    const sampleSizeReached = totalSampleSize >= experiment.statistical_config.minimum_sample_size;

    const primaryResults = results.filter(r => 
      experiment.metrics.find(m => m.name === r.metric_name && m.is_primary)
    );
    const significanceAchieved = primaryResults.some(r => r.is_significant);

    return {
      is_running: experiment.status === 'active',
      runtime_hours: runtimeHours,
      sample_size_reached: sampleSizeReached,
      significance_achieved: significanceAchieved,
      winner_declared: false, // Simplified
      can_conclude: sampleSizeReached && (significanceAchieved || runtimeHours >= experiment.statistical_config.minimum_runtime_hours * 24),
    };
  }

  private generateRecommendations(experiment: Experiment, results: ExperimentResult[], status: any): any {
    if (!status.sample_size_reached) {
      return {
        action: 'continue' as const,
        reason: 'Minimum sample size not yet reached',
        confidence: 'high' as const,
      };
    }

    if (status.significance_achieved) {
      return {
        action: 'conclude' as const,
        reason: 'Statistical significance achieved',
        confidence: 'high' as const,
      };
    }

    if (status.runtime_hours >= experiment.statistical_config.maximum_runtime_days * 24) {
      return {
        action: 'conclude' as const,
        reason: 'Maximum runtime reached',
        confidence: 'medium' as const,
      };
    }

    return {
      action: 'continue' as const,
      reason: 'Continue collecting data',
      confidence: 'medium' as const,
    };
  }

  private async refreshExperimentCache(): Promise<void> {
    const now = Date.now();
    if (now - this.lastCacheUpdate < this.cacheExpiry) {
      return;
    }

    try {
      const { data: experiments } = await supabase
        .from('ab_experiments')
        .select('*')
        .eq('status', 'active');

      if (experiments) {
        this.experimentCache.clear();
        experiments.forEach(exp => {
          this.experimentCache.set(exp.id, exp as Experiment);
        });
      }

      this.lastCacheUpdate = now;
    } catch (error) {
      console.error('Failed to refresh experiment cache:', error);
    }
  }

  private setupAnalyticsIntegration(): void {
    // Set up event listeners for automatic conversion tracking
    // This would integrate with your existing analytics setup
  }
}

export const abTestingService = new ABTestingService();