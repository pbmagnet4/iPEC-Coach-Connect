/**
 * A/B Testing Framework Types
 * Comprehensive type definitions for experiment management, feature flags, and analytics
 */

export type ExperimentStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived';
export type VariantType = 'control' | 'variant' | 'challenger';
export type ConversionGoal = 'registration' | 'booking' | 'engagement' | 'retention' | 'revenue';
export type SegmentCriteria = 'all_users' | 'new_users' | 'returning_users' | 'premium_users' | 'mobile_users' | 'desktop_users';
export type TrafficAllocation = 1 | 5 | 10 | 25 | 50 | 75 | 100;

export interface ExperimentVariant {
  id: string;
  name: string;
  description: string;
  type: VariantType;
  traffic_weight: number; // 0-100, sum of all variants should equal 100
  config: Record<string, any>; // Variant-specific configuration
  is_control: boolean;
}

export interface ConversionMetric {
  name: string;
  goal: ConversionGoal;
  description: string;
  is_primary: boolean;
  target_improvement: number; // Expected improvement percentage
}

export interface TargetingRule {
  criteria: SegmentCriteria;
  conditions: {
    user_properties?: Record<string, any>;
    device_type?: 'mobile' | 'tablet' | 'desktop';
    location?: string[];
    registration_date_range?: {
      start?: Date;
      end?: Date;
    };
    custom_attributes?: Record<string, any>;
  };
}

export interface StatisticalConfig {
  confidence_level: 0.9 | 0.95 | 0.99; // 90%, 95%, 99%
  power: 0.8 | 0.9; // Statistical power
  minimum_sample_size: number;
  minimum_runtime_hours: number;
  maximum_runtime_days: number;
  early_stopping: boolean;
  bayesian_analysis: boolean;
}

export interface Experiment {
  id: string;
  name: string;
  description: string;
  status: ExperimentStatus;
  
  // Configuration
  feature_key: string; // Unique identifier for feature flag
  variants: ExperimentVariant[];
  metrics: ConversionMetric[];
  targeting: TargetingRule[];
  traffic_allocation: TrafficAllocation; // Percentage of users to include
  
  // Statistical Configuration
  statistical_config: StatisticalConfig;
  
  // Lifecycle
  created_at: string;
  started_at?: string;
  ended_at?: string;
  created_by: string;
  
  // Metadata
  hypothesis: string;
  expected_impact: string;
  business_justification: string;
  tags: string[];
}

export interface ExperimentAssignment {
  user_id: string;
  experiment_id: string;
  variant_id: string;
  assigned_at: string;
  session_id: string;
  user_agent?: string;
  ip_address?: string; // For geographical analysis
}

export interface ConversionEvent {
  id: string;
  user_id: string;
  experiment_id: string;
  variant_id: string;
  metric_name: string;
  value: number; // 1 for binary conversions, actual value for numeric metrics
  properties?: Record<string, any>;
  occurred_at: string;
  session_id: string;
}

export interface ExperimentResult {
  experiment_id: string;
  variant_id: string;
  metric_name: string;
  
  // Sample Statistics
  sample_size: number;
  conversion_count: number;
  conversion_rate: number;
  
  // Statistical Analysis
  confidence_interval: {
    lower: number;
    upper: number;
    confidence_level: number;
  };
  
  // Comparison to Control
  lift: number; // Percentage improvement over control
  lift_confidence_interval: {
    lower: number;
    upper: number;
  };
  
  // Statistical Significance
  p_value: number;
  is_significant: boolean;
  statistical_power: number;
  
  // Bayesian Analysis (if enabled)
  probability_to_be_best?: number;
  expected_loss?: number;
  
  // Metadata
  calculated_at: string;
  calculation_method: 'frequentist' | 'bayesian';
}

export interface ExperimentSummary {
  experiment: Experiment;
  results: ExperimentResult[];
  status: {
    is_running: boolean;
    runtime_hours: number;
    sample_size_reached: boolean;
    significance_achieved: boolean;
    winner_declared: boolean;
    winner_variant_id?: string;
    can_conclude: boolean;
  };
  recommendations: {
    action: 'continue' | 'conclude' | 'extend' | 'stop';
    reason: string;
    confidence: 'high' | 'medium' | 'low';
  };
}

// Feature Flag System Types
export interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  is_active: boolean;
  
  // Rollout Configuration
  rollout_percentage: TrafficAllocation;
  targeting_rules: TargetingRule[];
  
  // A/B Test Integration
  experiment_id?: string;
  use_for_ab_test: boolean;
  
  // Values
  default_value: any;
  variant_values: Record<string, any>; // variant_id -> value mapping
  
  // Metadata
  created_at: string;
  updated_at: string;
  created_by: string;
  tags: string[];
}

export interface UserContext {
  user_id: string;
  is_authenticated: boolean;
  user_properties: {
    registration_date: string;
    user_type: 'client' | 'coach' | 'admin';
    subscription_tier?: 'free' | 'premium' | 'enterprise';
    location?: {
      country: string;
      region: string;
      city: string;
    };
    device_info: {
      type: 'mobile' | 'tablet' | 'desktop';
      browser: string;
      os: string;
    };
    behavioral_attributes: {
      session_count: number;
      last_login: string;
      total_bookings: number;
      engagement_score: number;
    };
  };
  session_id: string;
}

// Analytics Integration
export interface ABTestAnalytics {
  track_experiment_exposure: (experiment_id: string, variant_id: string, user_context: UserContext) => void;
  track_conversion: (experiment_id: string, metric_name: string, value?: number, properties?: Record<string, any>) => void;
  track_feature_flag_evaluation: (flag_key: string, value: any, user_context: UserContext) => void;
}

// Hook Return Types
export interface UseExperimentResult {
  variant: ExperimentVariant | null;
  isLoading: boolean;
  isActive: boolean;
  trackConversion: (metric_name: string, value?: number, properties?: Record<string, any>) => void;
}

export interface UseFeatureFlagResult {
  value: any;
  isEnabled: boolean;
  isLoading: boolean;
  variant: string | null;
}

// Dashboard Types
export interface ExperimentListItem {
  id: string;
  name: string;
  status: ExperimentStatus;
  created_at: string;
  runtime_hours?: number;
  sample_size: number;
  primary_metric_lift?: number;
  is_significant: boolean;
  winner_variant?: string;
}

export interface CreateExperimentPayload {
  name: string;
  description: string;
  hypothesis: string;
  feature_key: string;
  variants: Omit<ExperimentVariant, 'id'>[];
  metrics: ConversionMetric[];
  targeting: TargetingRule[];
  traffic_allocation: TrafficAllocation;
  statistical_config: StatisticalConfig;
  business_justification: string;
  tags: string[];
}

// Error Types
export class ABTestingError extends Error {
  constructor(
    message: string,
    public code: 'EXPERIMENT_NOT_FOUND' | 'VARIANT_NOT_FOUND' | 'INVALID_CONFIG' | 'STATISTICAL_ERROR' | 'ASSIGNMENT_ERROR',
    public details?: any
  ) {
    super(message);
    this.name = 'ABTestingError';
  }
}