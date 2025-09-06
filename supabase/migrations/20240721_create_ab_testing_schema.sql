-- A/B Testing Framework Database Schema
-- Comprehensive schema for experiments, feature flags, user assignments, and analytics

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Experiments table
CREATE TABLE ab_experiments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('draft', 'active', 'paused', 'completed', 'archived')),
  
  -- Configuration
  feature_key TEXT NOT NULL UNIQUE,
  hypothesis TEXT NOT NULL,
  expected_impact TEXT,
  business_justification TEXT,
  
  -- Variants (stored as JSONB for flexibility)
  variants JSONB NOT NULL DEFAULT '[]',
  
  -- Metrics configuration
  metrics JSONB NOT NULL DEFAULT '[]',
  
  -- Targeting and traffic
  targeting JSONB NOT NULL DEFAULT '[]',
  traffic_allocation INTEGER NOT NULL DEFAULT 100 CHECK (traffic_allocation BETWEEN 1 AND 100),
  
  -- Statistical configuration
  statistical_config JSONB NOT NULL DEFAULT '{}',
  
  -- Lifecycle timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  tags TEXT[] DEFAULT '{}',
  
  -- Indexes for efficient querying
  CONSTRAINT check_variants_not_empty CHECK (jsonb_array_length(variants) > 0),
  CONSTRAINT check_metrics_not_empty CHECK (jsonb_array_length(metrics) > 0)
);

-- User assignments table
CREATE TABLE ab_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL, -- Can be UUID for auth users or anonymous identifier
  experiment_id UUID NOT NULL REFERENCES ab_experiments(id) ON DELETE CASCADE,
  variant_id TEXT NOT NULL,
  
  -- Assignment context
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_id TEXT NOT NULL,
  user_agent TEXT,
  ip_address INET,
  
  -- User properties at assignment time (for analysis)
  user_properties JSONB DEFAULT '{}',
  
  -- Ensure one assignment per user per experiment
  UNIQUE (user_id, experiment_id)
);

-- Conversion events table
CREATE TABLE ab_conversions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  experiment_id UUID NOT NULL REFERENCES ab_experiments(id) ON DELETE CASCADE,
  variant_id TEXT NOT NULL,
  
  -- Conversion details
  metric_name TEXT NOT NULL,
  value NUMERIC NOT NULL DEFAULT 1,
  properties JSONB DEFAULT '{}',
  
  -- Timing
  occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_id TEXT NOT NULL,
  
  -- Performance optimization index
  CONSTRAINT conversion_positive_value CHECK (value >= 0)
);

-- Feature flags table
CREATE TABLE feature_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Rollout configuration
  rollout_percentage INTEGER NOT NULL DEFAULT 100 CHECK (rollout_percentage BETWEEN 0 AND 100),
  targeting_rules JSONB NOT NULL DEFAULT '[]',
  
  -- A/B test integration
  experiment_id UUID REFERENCES ab_experiments(id) ON DELETE SET NULL,
  use_for_ab_test BOOLEAN NOT NULL DEFAULT false,
  
  -- Flag values
  default_value JSONB NOT NULL,
  variant_values JSONB NOT NULL DEFAULT '{}',
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  tags TEXT[] DEFAULT '{}'
);

-- Experiment results cache table (for performance)
CREATE TABLE ab_experiment_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  experiment_id UUID NOT NULL REFERENCES ab_experiments(id) ON DELETE CASCADE,
  variant_id TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  
  -- Sample statistics
  sample_size INTEGER NOT NULL DEFAULT 0,
  conversion_count INTEGER NOT NULL DEFAULT 0,
  conversion_rate NUMERIC NOT NULL DEFAULT 0,
  
  -- Statistical analysis
  confidence_interval JSONB NOT NULL DEFAULT '{}',
  lift NUMERIC NOT NULL DEFAULT 0,
  lift_confidence_interval JSONB NOT NULL DEFAULT '{}',
  p_value NUMERIC NOT NULL DEFAULT 1,
  is_significant BOOLEAN NOT NULL DEFAULT false,
  statistical_power NUMERIC NOT NULL DEFAULT 0,
  
  -- Bayesian analysis (optional)
  probability_to_be_best NUMERIC,
  expected_loss NUMERIC,
  
  -- Metadata
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  calculation_method TEXT NOT NULL DEFAULT 'frequentist' CHECK (calculation_method IN ('frequentist', 'bayesian')),
  
  UNIQUE (experiment_id, variant_id, metric_name)
);

-- Analytics events table (for detailed tracking)
CREATE TABLE ab_analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_name TEXT NOT NULL,
  user_id TEXT,
  session_id TEXT,
  
  -- Event data
  properties JSONB DEFAULT '{}',
  experiment_context JSONB DEFAULT '{}',
  
  -- Timing and context
  occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  url TEXT,
  referrer TEXT,
  user_agent TEXT,
  
  -- Performance optimization
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance optimization

-- Experiments indexes
CREATE INDEX idx_ab_experiments_status ON ab_experiments(status);
CREATE INDEX idx_ab_experiments_feature_key ON ab_experiments(feature_key);
CREATE INDEX idx_ab_experiments_created_by ON ab_experiments(created_by);
CREATE INDEX idx_ab_experiments_tags ON ab_experiments USING GIN(tags);

-- Assignments indexes
CREATE INDEX idx_ab_assignments_user_id ON ab_assignments(user_id);
CREATE INDEX idx_ab_assignments_experiment_id ON ab_assignments(experiment_id);
CREATE INDEX idx_ab_assignments_variant_id ON ab_assignments(variant_id);
CREATE INDEX idx_ab_assignments_session_id ON ab_assignments(session_id);
CREATE INDEX idx_ab_assignments_assigned_at ON ab_assignments(assigned_at);

-- Conversions indexes
CREATE INDEX idx_ab_conversions_user_id ON ab_conversions(user_id);
CREATE INDEX idx_ab_conversions_experiment_id ON ab_conversions(experiment_id);
CREATE INDEX idx_ab_conversions_variant_id ON ab_conversions(variant_id);
CREATE INDEX idx_ab_conversions_metric_name ON ab_conversions(metric_name);
CREATE INDEX idx_ab_conversions_occurred_at ON ab_conversions(occurred_at);
CREATE INDEX idx_ab_conversions_session_id ON ab_conversions(session_id);

-- Feature flags indexes
CREATE INDEX idx_feature_flags_key ON feature_flags(key);
CREATE INDEX idx_feature_flags_is_active ON feature_flags(is_active);
CREATE INDEX idx_feature_flags_experiment_id ON feature_flags(experiment_id);
CREATE INDEX idx_feature_flags_use_for_ab_test ON feature_flags(use_for_ab_test);

-- Results cache indexes
CREATE INDEX idx_ab_experiment_results_experiment_id ON ab_experiment_results(experiment_id);
CREATE INDEX idx_ab_experiment_results_calculated_at ON ab_experiment_results(calculated_at);

-- Analytics events indexes
CREATE INDEX idx_ab_analytics_events_event_name ON ab_analytics_events(event_name);
CREATE INDEX idx_ab_analytics_events_user_id ON ab_analytics_events(user_id);
CREATE INDEX idx_ab_analytics_events_occurred_at ON ab_analytics_events(occurred_at);
CREATE INDEX idx_ab_analytics_events_properties ON ab_analytics_events USING GIN(properties);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER ab_experiments_updated_at
    BEFORE UPDATE ON ab_experiments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER feature_flags_updated_at
    BEFORE UPDATE ON feature_flags
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Create RLS policies for security

-- Experiments policies (admin and creator access)
ALTER TABLE ab_experiments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all experiments" ON ab_experiments
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create experiments" ON ab_experiments
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own experiments" ON ab_experiments
    FOR UPDATE USING (created_by = auth.uid() OR auth.jwt() ->> 'role' = 'admin');

-- Assignments policies (users can only see their own assignments)
ALTER TABLE ab_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own assignments" ON ab_assignments
    FOR SELECT USING (user_id = auth.uid()::text OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "System can create assignments" ON ab_assignments
    FOR INSERT WITH CHECK (true); -- Service role access needed

-- Conversions policies (users can only create their own conversions)
ALTER TABLE ab_conversions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own conversions" ON ab_conversions
    FOR SELECT USING (user_id = auth.uid()::text OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users can create their own conversions" ON ab_conversions
    FOR INSERT WITH CHECK (user_id = auth.uid()::text OR auth.jwt() ->> 'role' = 'service_role');

-- Feature flags policies (public read, admin write)
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active feature flags" ON feature_flags
    FOR SELECT USING (is_active = true OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Authenticated users can create feature flags" ON feature_flags
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own feature flags" ON feature_flags
    FOR UPDATE USING (created_by = auth.uid() OR auth.jwt() ->> 'role' = 'admin');

-- Results cache policies (public read for active experiments)
ALTER TABLE ab_experiment_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view experiment results" ON ab_experiment_results
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM ab_experiments 
            WHERE id = experiment_id 
            AND status IN ('active', 'completed')
        ) OR auth.jwt() ->> 'role' = 'admin'
    );

CREATE POLICY "System can manage experiment results" ON ab_experiment_results
    FOR ALL USING (auth.jwt() ->> 'role' IN ('service_role', 'admin'));

-- Analytics events policies (system access only)
ALTER TABLE ab_analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view all analytics events" ON ab_analytics_events
    FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "System can create analytics events" ON ab_analytics_events
    FOR INSERT WITH CHECK (auth.jwt() ->> 'role' IN ('service_role', 'anon'));

-- Create helpful views for common queries

-- Active experiments view
CREATE VIEW active_experiments AS
SELECT 
    e.*,
    COUNT(DISTINCT a.user_id) as participant_count,
    COUNT(c.id) as conversion_count
FROM ab_experiments e
LEFT JOIN ab_assignments a ON e.id = a.experiment_id
LEFT JOIN ab_conversions c ON e.id = c.experiment_id
WHERE e.status = 'active'
GROUP BY e.id;

-- Experiment performance summary view
CREATE VIEW experiment_performance AS
SELECT 
    e.id,
    e.name,
    e.status,
    a.variant_id,
    COUNT(DISTINCT a.user_id) as participants,
    COUNT(c.id) as conversions,
    COALESCE(COUNT(c.id)::float / NULLIF(COUNT(DISTINCT a.user_id), 0), 0) as conversion_rate,
    AVG(c.value) as avg_conversion_value
FROM ab_experiments e
JOIN ab_assignments a ON e.id = a.experiment_id
LEFT JOIN ab_conversions c ON e.id = c.experiment_id AND a.variant_id = c.variant_id
GROUP BY e.id, e.name, e.status, a.variant_id;

-- Feature flag usage view
CREATE VIEW feature_flag_usage AS
SELECT 
    ff.key,
    ff.name,
    ff.is_active,
    ff.rollout_percentage,
    COUNT(DISTINCT ae.user_id) as unique_evaluations,
    COUNT(ae.id) as total_evaluations
FROM feature_flags ff
LEFT JOIN ab_analytics_events ae ON ae.properties->>'flag_key' = ff.key
WHERE ae.event_name = 'feature_flag_evaluation' OR ae.event_name IS NULL
GROUP BY ff.id, ff.key, ff.name, ff.is_active, ff.rollout_percentage;

-- Grant permissions for the views
GRANT SELECT ON active_experiments TO authenticated, anon;
GRANT SELECT ON experiment_performance TO authenticated, anon;
GRANT SELECT ON feature_flag_usage TO authenticated, anon;

-- Insert some example data for testing

-- Example experiment
INSERT INTO ab_experiments (
    name,
    description,
    status,
    feature_key,
    hypothesis,
    expected_impact,
    business_justification,
    variants,
    metrics,
    targeting,
    traffic_allocation,
    statistical_config,
    tags
) VALUES (
    'Registration CTA Test',
    'Testing different call-to-action buttons on the registration page',
    'draft',
    'registration_cta_optimization',
    'A more action-oriented CTA will increase registration conversion rates',
    'Expected 15% increase in registration completion',
    'Registration is a key funnel step that directly impacts user acquisition',
    '[
        {
            "id": "control",
            "name": "get_started",
            "description": "Standard Get Started button",
            "type": "control",
            "traffic_weight": 50,
            "config": {"button_text": "Get Started", "button_color": "blue"},
            "is_control": true
        },
        {
            "id": "variant_a",
            "name": "join_now",
            "description": "Action-oriented Join Now button",
            "type": "variant",
            "traffic_weight": 50,
            "config": {"button_text": "Join Now - It''s Free!", "button_color": "green"},
            "is_control": false
        }
    ]'::jsonb,
    '[
        {
            "name": "registration_completed",
            "goal": "registration",
            "description": "User completes registration process",
            "is_primary": true,
            "target_improvement": 15
        }
    ]'::jsonb,
    '[
        {
            "criteria": "all_users",
            "conditions": {}
        }
    ]'::jsonb,
    100,
    '{
        "confidence_level": 0.95,
        "power": 0.8,
        "minimum_sample_size": 1000,
        "minimum_runtime_hours": 168,
        "maximum_runtime_days": 30,
        "early_stopping": true,
        "bayesian_analysis": false
    }'::jsonb,
    ARRAY['registration', 'cta', 'conversion-optimization']
);

-- Example feature flag
INSERT INTO feature_flags (
    key,
    name,
    description,
    is_active,
    rollout_percentage,
    targeting_rules,
    default_value,
    variant_values,
    tags
) VALUES (
    'new_dashboard_ui',
    'New Dashboard UI',
    'Feature flag for the redesigned dashboard interface',
    true,
    25,
    '[
        {
            "criteria": "premium_users",
            "conditions": {"subscription_tier": "premium"}
        }
    ]'::jsonb,
    'false'::jsonb,
    '{}'::jsonb,
    ARRAY['ui', 'dashboard', 'gradual-rollout']
);

COMMENT ON TABLE ab_experiments IS 'A/B testing experiments with variants, metrics, and targeting configuration';
COMMENT ON TABLE ab_assignments IS 'User assignments to experiment variants';
COMMENT ON TABLE ab_conversions IS 'Conversion events tracked for A/B tests';
COMMENT ON TABLE feature_flags IS 'Feature flags with rollout and targeting capabilities';
COMMENT ON TABLE ab_experiment_results IS 'Cached statistical results for experiments';
COMMENT ON TABLE ab_analytics_events IS 'Detailed analytics events for A/B testing';