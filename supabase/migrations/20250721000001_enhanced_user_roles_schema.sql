-- =====================================================================
-- iPEC Coach Connect - Enhanced User Roles & State Management Schema  
-- =====================================================================
-- This migration enhances the existing schema with comprehensive user
-- role management, state tracking, and permission systems
-- =====================================================================

-- =====================================================================
-- USER ROLES AND PERMISSIONS SYSTEM
-- =====================================================================

-- Define available user roles
CREATE TYPE user_role AS ENUM (
    'client',           -- Regular coaching clients
    'coach',            -- Certified iPEC coaches  
    'admin',            -- Platform administrators
    'moderator',        -- Community moderators
    'support',          -- Customer support staff
    'pending_coach',    -- Coach applications pending approval
    'suspended'         -- Suspended users
);

-- Define user account status
CREATE TYPE account_status AS ENUM (
    'active',           -- Normal active account
    'pending_verification', -- Email/phone not verified
    'pending_approval', -- Waiting for admin approval (coaches)
    'suspended',        -- Temporarily suspended
    'deactivated',      -- User deactivated their account
    'banned'            -- Permanently banned
);

-- Define onboarding stages
CREATE TYPE onboarding_stage AS ENUM (
    'not_started',      -- Just signed up
    'profile_setup',    -- Setting up basic profile
    'role_selection',   -- Choosing client/coach role
    'verification',     -- Email/phone verification
    'coach_application',-- Coach-specific application process
    'goal_setting',     -- Client goal setting
    'coach_matching',   -- Finding/selecting coaches
    'payment_setup',    -- Setting up payment methods
    'completed'         -- Onboarding finished
);

-- User roles assignment table (many-to-many for future flexibility)
CREATE TABLE user_roles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    role user_role NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES profiles(id), -- Who assigned this role
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE, -- Optional role expiration
    metadata JSONB DEFAULT '{}', -- Role-specific metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, role) -- One instance of each role per user
);

-- Enhanced user state tracking
CREATE TABLE user_states (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
    
    -- Core state information
    account_status account_status DEFAULT 'pending_verification',
    onboarding_stage onboarding_stage DEFAULT 'not_started',
    profile_completion_percentage INTEGER DEFAULT 0 CHECK (profile_completion_percentage BETWEEN 0 AND 100),
    
    -- Verification status
    email_verified_at TIMESTAMP WITH TIME ZONE,
    phone_verified_at TIMESTAMP WITH TIME ZONE,
    identity_verified_at TIMESTAMP WITH TIME ZONE,
    
    -- Onboarding progress tracking
    onboarding_data JSONB DEFAULT '{}', -- Store onboarding progress and choices
    onboarding_completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Feature access and preferences
    feature_flags JSONB DEFAULT '{}', -- User-specific feature flags
    preferences JSONB DEFAULT '{}', -- User preferences and settings
    
    -- Activity tracking
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    login_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Role permissions definition table
CREATE TABLE role_permissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    role user_role NOT NULL,
    resource TEXT NOT NULL, -- e.g., 'sessions', 'profiles', 'community'
    action TEXT NOT NULL,   -- e.g., 'create', 'read', 'update', 'delete', 'moderate'
    conditions JSONB DEFAULT '{}', -- Additional conditions for the permission
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(role, resource, action)
);

-- User-specific permission overrides (for special cases)
CREATE TABLE user_permission_overrides (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    resource TEXT NOT NULL,
    action TEXT NOT NULL,
    granted BOOLEAN NOT NULL, -- true = granted, false = denied
    reason TEXT, -- Reason for the override
    expires_at TIMESTAMP WITH TIME ZONE, -- Optional expiration
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, resource, action)
);

-- =====================================================================
-- ENHANCED PROFILE EXTENSIONS
-- =====================================================================

-- Extend existing profiles table with additional fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS
    primary_role user_role DEFAULT 'client';

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS
    display_name TEXT;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS
    preferred_language TEXT DEFAULT 'en';

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS
    notification_preferences JSONB DEFAULT '{}';

-- Client-specific profiles
CREATE TABLE client_profiles (
    id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
    
    -- Goals and coaching preferences
    coaching_goals TEXT[],
    preferred_coaching_style TEXT[], -- e.g., ['supportive', 'direct', 'collaborative']
    focus_areas TEXT[], -- e.g., ['leadership', 'work-life-balance', 'career-change']
    
    -- Matching preferences
    preferred_coach_gender TEXT, -- 'any', 'male', 'female'
    preferred_session_duration INTEGER DEFAULT 60,
    preferred_time_slots JSONB DEFAULT '{}', -- Preferred time slots by day
    budget_range JSONB DEFAULT '{}', -- Min/max session rates
    
    -- Progress tracking
    total_sessions_completed INTEGER DEFAULT 0,
    current_coaching_streak INTEGER DEFAULT 0,
    longest_coaching_streak INTEGER DEFAULT 0,
    
    -- Onboarding specific
    assessment_completed_at TIMESTAMP WITH TIME ZONE,
    goals_set_at TIMESTAMP WITH TIME ZONE,
    first_coach_matched_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Coach-specific application and verification tracking
CREATE TABLE coach_applications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Application status
    status TEXT CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'resubmission_required')) DEFAULT 'draft',
    
    -- Application data
    application_data JSONB NOT NULL DEFAULT '{}',
    
    -- iPEC certification details (enhanced from existing coaches table)
    certification_number TEXT,
    certification_level TEXT CHECK (certification_level IN ('Associate', 'Professional', 'Master')),
    certification_date DATE,
    certification_documents TEXT[], -- File paths to uploaded documents
    
    -- Experience and qualifications
    experience_years INTEGER,
    previous_coaching_experience TEXT,
    education_background TEXT,
    specializations TEXT[],
    languages TEXT[],
    
    -- Business information
    desired_hourly_rate DECIMAL(10,2),
    availability_timezone TEXT DEFAULT 'UTC',
    why_coaching TEXT, -- Why do you want to be a coach?
    coaching_philosophy TEXT,
    
    -- Review process
    reviewed_by UUID REFERENCES profiles(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_notes TEXT,
    approval_decision_reason TEXT,
    
    -- Timestamps
    submitted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================================
-- ENHANCED COACHES TABLE INTEGRATION
-- =====================================================================

-- Add application reference to existing coaches table
ALTER TABLE coaches ADD COLUMN IF NOT EXISTS
    application_id UUID REFERENCES coach_applications(id);

-- Add onboarding status for approved coaches
ALTER TABLE coaches ADD COLUMN IF NOT EXISTS
    onboarding_completed_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE coaches ADD COLUMN IF NOT EXISTS
    profile_setup_completed_at TIMESTAMP WITH TIME ZONE;

-- =====================================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================================

-- User roles indexes
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);
CREATE INDEX idx_user_roles_active ON user_roles(user_id, role) WHERE is_active = true;

-- User states indexes
CREATE INDEX idx_user_states_account_status ON user_states(account_status);
CREATE INDEX idx_user_states_onboarding_stage ON user_states(onboarding_stage);
CREATE INDEX idx_user_states_last_active ON user_states(last_active_at);

-- Role permissions indexes
CREATE INDEX idx_role_permissions_role ON role_permissions(role);
CREATE INDEX idx_role_permissions_resource_action ON role_permissions(resource, action);

-- User permission overrides indexes
CREATE INDEX idx_user_permission_overrides_user_id ON user_permission_overrides(user_id);

-- Client profiles indexes
CREATE INDEX idx_client_profiles_coaching_goals ON client_profiles USING GIN(coaching_goals);
CREATE INDEX idx_client_profiles_focus_areas ON client_profiles USING GIN(focus_areas);

-- Coach applications indexes
CREATE INDEX idx_coach_applications_user_id ON coach_applications(user_id);
CREATE INDEX idx_coach_applications_status ON coach_applications(status);
CREATE INDEX idx_coach_applications_submitted_at ON coach_applications(submitted_at);

-- =====================================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================================

-- Enable RLS on new tables
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permission_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_applications ENABLE ROW LEVEL SECURITY;

-- User roles policies
CREATE POLICY "Users can view their own roles" ON user_roles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" ON user_roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.role = 'admin' 
            AND ur.is_active = true
        )
    );

-- User states policies  
CREATE POLICY "Users can view their own state" ON user_states
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own state" ON user_states
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can manage user states" ON user_states
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Role permissions policies (read-only for authenticated users)
CREATE POLICY "Authenticated users can view role permissions" ON role_permissions
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Client profiles policies
CREATE POLICY "Users can manage their own client profile" ON client_profiles
    FOR ALL USING (auth.uid() = id);

CREATE POLICY "Coaches can view their clients' profiles" ON client_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM sessions s 
            WHERE s.client_id = id 
            AND s.coach_id = auth.uid()
        )
    );

-- Coach applications policies
CREATE POLICY "Users can manage their own coach application" ON coach_applications
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all coach applications" ON coach_applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.role IN ('admin', 'moderator')
            AND ur.is_active = true
        )
    );

-- =====================================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================================

-- Function to automatically create user state on profile creation
CREATE OR REPLACE FUNCTION create_user_state()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_states (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user state when profile is created
CREATE TRIGGER create_user_state_trigger
    AFTER INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION create_user_state();

-- Function to assign default client role on user creation
CREATE OR REPLACE FUNCTION assign_default_role()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_roles (user_id, role, assigned_by)
    VALUES (NEW.id, 'client', NEW.id)
    ON CONFLICT (user_id, role) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to assign default role when profile is created
CREATE TRIGGER assign_default_role_trigger
    AFTER INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION assign_default_role();

-- Function to update profile completion percentage
CREATE OR REPLACE FUNCTION calculate_profile_completion(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    completion_score INTEGER := 0;
    total_fields INTEGER := 10;
    profile_record profiles%ROWTYPE;
    client_record client_profiles%ROWTYPE;
    user_state_record user_states%ROWTYPE;
BEGIN
    -- Get profile data
    SELECT * INTO profile_record FROM profiles WHERE id = user_id;
    SELECT * INTO client_record FROM client_profiles WHERE id = user_id;
    SELECT * INTO user_state_record FROM user_states WHERE user_id = user_id;
    
    -- Check basic profile fields
    IF profile_record.full_name IS NOT NULL THEN completion_score := completion_score + 1; END IF;
    IF profile_record.avatar_url IS NOT NULL THEN completion_score := completion_score + 1; END IF;
    IF profile_record.bio IS NOT NULL THEN completion_score := completion_score + 1; END IF;
    IF profile_record.location IS NOT NULL THEN completion_score := completion_score + 1; END IF;
    IF profile_record.phone IS NOT NULL THEN completion_score := completion_score + 1; END IF;
    
    -- Check verification status
    IF user_state_record.email_verified_at IS NOT NULL THEN completion_score := completion_score + 1; END IF;
    
    -- Check role-specific completion
    IF client_record.id IS NOT NULL THEN
        IF array_length(client_record.coaching_goals, 1) > 0 THEN completion_score := completion_score + 1; END IF;
        IF array_length(client_record.focus_areas, 1) > 0 THEN completion_score := completion_score + 1; END IF;
        IF client_record.preferred_coaching_style IS NOT NULL THEN completion_score := completion_score + 1; END IF;
        IF client_record.budget_range IS NOT NULL THEN completion_score := completion_score + 1; END IF;
    END IF;
    
    RETURN (completion_score * 100 / total_fields);
END;
$$ LANGUAGE plpgsql;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER user_roles_updated_at BEFORE UPDATE ON user_roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER user_states_updated_at BEFORE UPDATE ON user_states
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER client_profiles_updated_at BEFORE UPDATE ON client_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER coach_applications_updated_at BEFORE UPDATE ON coach_applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================================
-- SEED DATA - DEFAULT ROLE PERMISSIONS
-- =====================================================================

-- Client permissions
INSERT INTO role_permissions (role, resource, action) VALUES
-- Clients can manage their own profile and sessions
('client', 'profiles', 'read'),
('client', 'profiles', 'update'),
('client', 'sessions', 'create'),
('client', 'sessions', 'read'),
('client', 'sessions', 'update'),
('client', 'coaches', 'read'),
('client', 'community', 'read'),
('client', 'community', 'create'),
('client', 'learning', 'read'),
('client', 'notifications', 'read');

-- Coach permissions (includes client permissions plus coach-specific)
INSERT INTO role_permissions (role, resource, action) VALUES
('coach', 'profiles', 'read'),
('coach', 'profiles', 'update'),
('coach', 'sessions', 'create'),
('coach', 'sessions', 'read'),
('coach', 'sessions', 'update'),
('coach', 'sessions', 'delete'),
('coach', 'coaches', 'read'),
('coach', 'coaches', 'update'),
('coach', 'clients', 'read'),
('coach', 'community', 'read'),
('coach', 'community', 'create'),
('coach', 'community', 'moderate'),
('coach', 'learning', 'read'),
('coach', 'learning', 'create'),
('coach', 'notifications', 'read');

-- Admin permissions (full access)
INSERT INTO role_permissions (role, resource, action) VALUES
('admin', 'profiles', 'read'),
('admin', 'profiles', 'update'),
('admin', 'profiles', 'delete'),
('admin', 'sessions', 'read'),
('admin', 'sessions', 'update'),
('admin', 'sessions', 'delete'),
('admin', 'coaches', 'read'),
('admin', 'coaches', 'update'),
('admin', 'coaches', 'approve'),
('admin', 'users', 'read'),
('admin', 'users', 'update'),
('admin', 'users', 'suspend'),
('admin', 'community', 'moderate'),
('admin', 'system', 'configure');

-- Moderator permissions
INSERT INTO role_permissions (role, resource, action) VALUES
('moderator', 'community', 'read'),
('moderator', 'community', 'moderate'),
('moderator', 'community', 'delete'),
('moderator', 'profiles', 'read'),
('moderator', 'users', 'read');

-- =====================================================================
-- HELPFUL VIEWS FOR APPLICATION LOGIC
-- =====================================================================

-- User roles view with additional information
CREATE VIEW user_roles_extended AS
SELECT 
    ur.id,
    ur.user_id,
    ur.role,
    ur.is_active,
    ur.assigned_at,
    ur.expires_at,
    p.full_name,
    p.email,
    us.account_status,
    us.onboarding_stage
FROM user_roles ur
JOIN profiles p ON ur.user_id = p.id  
JOIN user_states us ON ur.user_id = us.user_id
WHERE ur.is_active = true;

-- User dashboard data view
CREATE VIEW user_dashboard_data AS
SELECT 
    p.id as user_id,
    p.full_name,
    p.email,
    p.avatar_url,
    us.account_status,
    us.onboarding_stage,
    us.profile_completion_percentage,
    us.last_active_at,
    array_agg(DISTINCT ur.role) FILTER (WHERE ur.is_active = true) as roles,
    cp.coaching_goals,
    cp.focus_areas,
    c.is_active as is_coach_active
FROM profiles p
JOIN user_states us ON p.id = us.user_id
LEFT JOIN user_roles ur ON p.id = ur.user_id
LEFT JOIN client_profiles cp ON p.id = cp.id
LEFT JOIN coaches c ON p.id = c.id
GROUP BY p.id, p.full_name, p.email, p.avatar_url, us.account_status, 
         us.onboarding_stage, us.profile_completion_percentage, 
         us.last_active_at, cp.coaching_goals, cp.focus_areas, c.is_active;

-- Coach application summary view
CREATE VIEW coach_applications_summary AS
SELECT 
    ca.id,
    ca.user_id,
    p.full_name,
    p.email,
    ca.status,
    ca.certification_level,
    ca.experience_years,
    ca.desired_hourly_rate,
    ca.specializations,
    ca.submitted_at,
    ca.reviewed_at,
    reviewer.full_name as reviewed_by_name
FROM coach_applications ca
JOIN profiles p ON ca.user_id = p.id
LEFT JOIN profiles reviewer ON ca.reviewed_by = reviewer.id;

-- Grant permissions on views
GRANT SELECT ON user_roles_extended TO authenticated;
GRANT SELECT ON user_dashboard_data TO authenticated;
GRANT SELECT ON coach_applications_summary TO authenticated, anon;

-- =====================================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================================

COMMENT ON TABLE user_roles IS 'User role assignments with support for multiple roles per user';
COMMENT ON TABLE user_states IS 'Comprehensive user state and progress tracking';
COMMENT ON TABLE role_permissions IS 'Role-based permission definitions';
COMMENT ON TABLE user_permission_overrides IS 'User-specific permission overrides';
COMMENT ON TABLE client_profiles IS 'Client-specific profile information and preferences';
COMMENT ON TABLE coach_applications IS 'Coach application and approval process tracking';

COMMENT ON VIEW user_roles_extended IS 'User roles with profile and state information';
COMMENT ON VIEW user_dashboard_data IS 'Complete user dashboard data in single view';
COMMENT ON VIEW coach_applications_summary IS 'Coach application summary with reviewer information';