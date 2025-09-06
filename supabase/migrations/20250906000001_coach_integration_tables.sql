-- Coach Integration Additional Tables
-- Tables needed for full coach integration after application approval

-- Coach Payment Settings (for revenue sharing and payouts)
CREATE TABLE coach_payment_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  payout_enabled BOOLEAN DEFAULT FALSE,
  commission_rate DECIMAL(5,2) DEFAULT 15.00, -- Platform commission percentage
  currency VARCHAR(3) DEFAULT 'usd',
  payout_schedule VARCHAR(20) DEFAULT 'weekly', -- weekly, monthly
  minimum_payout INTEGER DEFAULT 5000, -- Minimum payout amount in cents ($50.00)
  stripe_account_id VARCHAR(255), -- Stripe Connect account ID
  bank_account_verified BOOLEAN DEFAULT FALSE,
  tax_info_collected BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(coach_id)
);

-- Session Types (offerings each coach provides)
CREATE TABLE session_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL, -- Price in dollars
  session_type VARCHAR(50) NOT NULL, -- discovery, regular, extended, group
  max_participants INTEGER DEFAULT 1, -- For group sessions
  is_active BOOLEAN DEFAULT TRUE,
  booking_instructions TEXT,
  cancellation_policy TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_duration CHECK (duration_minutes > 0),
  CONSTRAINT valid_price CHECK (price >= 0),
  CONSTRAINT valid_participants CHECK (max_participants > 0)
);

-- Coach Availability Schedules
CREATE TABLE coach_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  timezone VARCHAR(50) DEFAULT 'UTC',
  weekly_schedule JSONB NOT NULL, -- Weekly availability pattern
  buffer_time_minutes INTEGER DEFAULT 15, -- Buffer between sessions
  advance_booking_days INTEGER DEFAULT 30, -- How far in advance clients can book
  same_day_booking BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(coach_id),
  CONSTRAINT valid_buffer_time CHECK (buffer_time_minutes >= 0),
  CONSTRAINT valid_advance_booking CHECK (advance_booking_days > 0)
);

-- Availability Exceptions (for holidays, vacations, etc.)
CREATE TABLE coach_availability_exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  exception_date DATE NOT NULL,
  exception_type VARCHAR(50) NOT NULL, -- unavailable, custom_hours
  start_time TIME,
  end_time TIME,
  reason VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(coach_id, exception_date)
);

-- Sessions table (if not exists - for booking functionality)
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_type_id UUID NOT NULL REFERENCES session_types(id) ON DELETE RESTRICT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL,
  status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, in_progress, completed, cancelled, no_show
  amount_paid DECIMAL(10,2),
  stripe_payment_intent_id VARCHAR(255),
  notes TEXT,
  session_notes TEXT, -- Notes taken during the session
  coach_rating INTEGER, -- 1-5 rating from client
  client_rating INTEGER, -- 1-5 rating from coach
  completion_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_duration CHECK (duration_minutes > 0),
  CONSTRAINT valid_coach_rating CHECK (coach_rating IS NULL OR (coach_rating >= 1 AND coach_rating <= 5)),
  CONSTRAINT valid_client_rating CHECK (client_rating IS NULL OR (client_rating >= 1 AND client_rating <= 5))
);

-- Revenue Records (for tracking coach earnings and platform commission)
CREATE TABLE IF NOT EXISTS revenue_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  payment_intent_id UUID, -- References payment_intents table
  gross_amount DECIMAL(10,2) NOT NULL, -- Total amount paid by client
  platform_commission DECIMAL(10,2) NOT NULL, -- Platform's share
  coach_amount DECIMAL(10,2) NOT NULL, -- Coach's share after commission
  currency VARCHAR(3) DEFAULT 'usd',
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  coach_payout_status VARCHAR(50) DEFAULT 'pending', -- pending, processing, paid, failed
  payout_batch_id VARCHAR(255), -- Reference to payout batch
  payout_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_amounts CHECK (
    gross_amount = platform_commission + coach_amount AND
    gross_amount > 0
  )
);

-- Subscription Plans (if not exists)
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  billing_interval VARCHAR(20) NOT NULL, -- monthly, yearly
  max_sessions INTEGER,
  features JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  stripe_product_id VARCHAR(255),
  stripe_price_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies for new tables

-- Coach Payment Settings
ALTER TABLE coach_payment_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can view own payment settings" ON coach_payment_settings
  FOR SELECT USING (
    coach_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Coaches can update own payment settings" ON coach_payment_settings
  FOR UPDATE USING (coach_id = auth.uid());

CREATE POLICY "Admins can manage all coach payment settings" ON coach_payment_settings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Session Types
ALTER TABLE session_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active session types" ON session_types
  FOR SELECT USING (is_active = true);

CREATE POLICY "Coaches can manage own session types" ON session_types
  FOR ALL USING (coach_id = auth.uid());

CREATE POLICY "Admins can manage all session types" ON session_types
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Coach Availability
ALTER TABLE coach_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active coach availability" ON coach_availability
  FOR SELECT USING (is_active = true);

CREATE POLICY "Coaches can manage own availability" ON coach_availability
  FOR ALL USING (coach_id = auth.uid());

CREATE POLICY "Admins can view all availability" ON coach_availability
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Coach Availability Exceptions
ALTER TABLE coach_availability_exceptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can manage own availability exceptions" ON coach_availability_exceptions
  FOR ALL USING (coach_id = auth.uid());

CREATE POLICY "Clients can view coach availability exceptions" ON coach_availability_exceptions
  FOR SELECT USING (true);

-- Sessions
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions" ON sessions
  FOR SELECT USING (
    coach_id = auth.uid() OR 
    client_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Coaches can update own sessions" ON sessions
  FOR UPDATE USING (coach_id = auth.uid());

CREATE POLICY "Clients can create sessions" ON sessions
  FOR INSERT WITH CHECK (client_id = auth.uid());

CREATE POLICY "Admins can manage all sessions" ON sessions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Revenue Records
ALTER TABLE revenue_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can view own revenue" ON revenue_records
  FOR SELECT USING (coach_id = auth.uid());

CREATE POLICY "Admins can view all revenue" ON revenue_records
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "System can insert revenue records" ON revenue_records
  FOR INSERT WITH CHECK (true); -- This will be handled by service-level logic

-- Subscription Plans
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active subscription plans" ON subscription_plans
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage subscription plans" ON subscription_plans
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Create indexes for performance
CREATE INDEX idx_coach_payment_settings_coach_id ON coach_payment_settings(coach_id);
CREATE INDEX idx_session_types_coach_id ON session_types(coach_id);
CREATE INDEX idx_session_types_active ON session_types(is_active) WHERE is_active = true;
CREATE INDEX idx_coach_availability_coach_id ON coach_availability(coach_id);
CREATE INDEX idx_coach_availability_active ON coach_availability(is_active) WHERE is_active = true;
CREATE INDEX idx_coach_availability_exceptions_coach_date ON coach_availability_exceptions(coach_id, exception_date);
CREATE INDEX idx_sessions_coach_id ON sessions(coach_id);
CREATE INDEX idx_sessions_client_id ON sessions(client_id);
CREATE INDEX idx_sessions_scheduled_at ON sessions(scheduled_at);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_revenue_records_coach_id ON revenue_records(coach_id);
CREATE INDEX idx_revenue_records_session_id ON revenue_records(session_id);
CREATE INDEX idx_revenue_records_payout_status ON revenue_records(coach_payout_status);

-- Add triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_coach_payment_settings_updated_at BEFORE UPDATE ON coach_payment_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_session_types_updated_at BEFORE UPDATE ON session_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_coach_availability_updated_at BEFORE UPDATE ON coach_availability FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON subscription_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default subscription plans
INSERT INTO subscription_plans (name, description, price, billing_interval, max_sessions, features, stripe_product_id, stripe_price_id) VALUES
('Basic Plan', 'Perfect for getting started with coaching', 99.00, 'monthly', 4, '{"features": ["4 sessions per month", "Email support", "Basic resources"]}', NULL, NULL),
('Professional Plan', 'Most popular plan for regular coaching', 179.00, 'monthly', 8, '{"features": ["8 sessions per month", "Priority support", "Advanced resources", "Group sessions"]}', NULL, NULL),
('Premium Plan', 'Unlimited coaching for serious growth', 299.00, 'monthly', NULL, '{"features": ["Unlimited sessions", "24/7 support", "Premium resources", "1-on-1 support", "Custom coaching plans"]}', NULL, NULL);

-- Function to calculate coach earnings from session amount
CREATE OR REPLACE FUNCTION calculate_coach_earnings(gross_amount DECIMAL(10,2), commission_rate DECIMAL(5,2))
RETURNS TABLE(platform_commission DECIMAL(10,2), coach_amount DECIMAL(10,2)) AS $$
BEGIN
  platform_commission := ROUND(gross_amount * (commission_rate / 100), 2);
  coach_amount := gross_amount - platform_commission;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;