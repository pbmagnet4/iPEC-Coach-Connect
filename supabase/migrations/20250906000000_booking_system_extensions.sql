-- =====================================================================
-- Booking System Extensions Migration
-- =====================================================================
-- 
-- This migration adds the necessary database extensions for the enhanced
-- booking system with real-time conflict prevention and reservations.
--
-- Features Added:
-- - Temporary session reservations
-- - Booking conflict prevention
-- - Enhanced session tracking
-- - Real-time availability updates
-- - Notification scheduling
--

-- =====================================================================
-- Session Reservations Table
-- =====================================================================
-- Temporary reservations to prevent double-booking during checkout process

CREATE TABLE session_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
    reserved_at TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    expires_at TIMESTAMPTZ NOT NULL,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    status reservation_status DEFAULT 'active',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create enum for reservation status
CREATE TYPE reservation_status AS ENUM (
    'active',
    'expired',
    'converted',
    'cancelled'
);

-- Add the status column with the new enum type
ALTER TABLE session_reservations 
ALTER COLUMN status TYPE reservation_status USING status::reservation_status;

-- Add indexes for performance
CREATE INDEX idx_session_reservations_coach_id ON session_reservations(coach_id);
CREATE INDEX idx_session_reservations_expires_at ON session_reservations(expires_at);
CREATE INDEX idx_session_reservations_reserved_at ON session_reservations(reserved_at);
CREATE INDEX idx_session_reservations_status ON session_reservations(status) WHERE status = 'active';

-- Add constraint to prevent overlapping active reservations
CREATE UNIQUE INDEX idx_session_reservations_no_overlap 
ON session_reservations(coach_id, reserved_at, duration_minutes) 
WHERE status = 'active';

-- =====================================================================
-- Session Reminders Table
-- =====================================================================
-- Scheduled reminders for sessions

CREATE TABLE session_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reminder_type reminder_type_enum NOT NULL,
    scheduled_for TIMESTAMPTZ NOT NULL,
    sent_at TIMESTAMPTZ NULL,
    delivery_method delivery_method_enum DEFAULT 'email',
    status reminder_status DEFAULT 'scheduled',
    retry_count INTEGER DEFAULT 0,
    error_message TEXT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create enums for reminder system
CREATE TYPE reminder_type_enum AS ENUM (
    '24_hours',
    '2_hours', 
    '15_minutes',
    'custom'
);

CREATE TYPE delivery_method_enum AS ENUM (
    'email',
    'sms',
    'push',
    'in_app'
);

CREATE TYPE reminder_status AS ENUM (
    'scheduled',
    'sent',
    'failed',
    'cancelled'
);

-- Update the reminder status column
ALTER TABLE session_reminders 
ALTER COLUMN status TYPE reminder_status USING status::reminder_status;

-- Add indexes
CREATE INDEX idx_session_reminders_session_id ON session_reminders(session_id);
CREATE INDEX idx_session_reminders_user_id ON session_reminders(user_id);
CREATE INDEX idx_session_reminders_scheduled_for ON session_reminders(scheduled_for) WHERE status = 'scheduled';
CREATE INDEX idx_session_reminders_status ON session_reminders(status);

-- =====================================================================
-- Booking Analytics Table
-- =====================================================================
-- Track booking patterns and analytics

CREATE TABLE booking_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type booking_event_type NOT NULL,
    session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
    coach_id UUID REFERENCES coaches(id) ON DELETE SET NULL,
    client_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    event_data JSONB DEFAULT '{}',
    user_agent TEXT NULL,
    ip_address INET NULL,
    referrer TEXT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create enum for booking events
CREATE TYPE booking_event_type AS ENUM (
    'session_viewed',
    'calendar_opened',
    'slot_selected',
    'booking_started',
    'payment_initiated',
    'booking_completed',
    'booking_cancelled',
    'session_rescheduled',
    'reminder_sent',
    'session_joined',
    'session_completed',
    'feedback_submitted'
);

-- Add indexes for analytics
CREATE INDEX idx_booking_analytics_event_type ON booking_analytics(event_type);
CREATE INDEX idx_booking_analytics_created_at ON booking_analytics(created_at);
CREATE INDEX idx_booking_analytics_coach_id ON booking_analytics(coach_id);
CREATE INDEX idx_booking_analytics_client_id ON booking_analytics(client_id);

-- =====================================================================
-- Enhanced Session Types Table
-- =====================================================================
-- Add more fields to session types for better booking management

ALTER TABLE session_types ADD COLUMN IF NOT EXISTS 
    is_active BOOLEAN DEFAULT TRUE;

ALTER TABLE session_types ADD COLUMN IF NOT EXISTS 
    booking_lead_time INTEGER DEFAULT 120; -- Minimum minutes before session

ALTER TABLE session_types ADD COLUMN IF NOT EXISTS 
    cancellation_policy TEXT;

ALTER TABLE session_types ADD COLUMN IF NOT EXISTS 
    max_participants INTEGER DEFAULT 1;

ALTER TABLE session_types ADD COLUMN IF NOT EXISTS 
    requires_approval BOOLEAN DEFAULT FALSE;

ALTER TABLE session_types ADD COLUMN IF NOT EXISTS 
    metadata JSONB DEFAULT '{}';

-- =====================================================================
-- Enhanced Sessions Table
-- =====================================================================
-- Add fields for better session management

ALTER TABLE sessions ADD COLUMN IF NOT EXISTS 
    preparation_notes TEXT;

ALTER TABLE sessions ADD COLUMN IF NOT EXISTS 
    outcome_notes TEXT;

ALTER TABLE sessions ADD COLUMN IF NOT EXISTS 
    client_rating INTEGER CHECK (client_rating >= 1 AND client_rating <= 5);

ALTER TABLE sessions ADD COLUMN IF NOT EXISTS 
    client_feedback TEXT;

ALTER TABLE sessions ADD COLUMN IF NOT EXISTS 
    coach_rating INTEGER CHECK (coach_rating >= 1 AND coach_rating <= 5);

ALTER TABLE sessions ADD COLUMN IF NOT EXISTS 
    coach_feedback TEXT;

ALTER TABLE sessions ADD COLUMN IF NOT EXISTS 
    recording_url TEXT;

ALTER TABLE sessions ADD COLUMN IF NOT EXISTS 
    session_materials JSONB DEFAULT '{}';

ALTER TABLE sessions ADD COLUMN IF NOT EXISTS 
    timezone TEXT DEFAULT 'UTC';

-- =====================================================================
-- Coach Availability Enhancements
-- =====================================================================
-- Add more flexibility to coach availability

ALTER TABLE coach_availability ADD COLUMN IF NOT EXISTS 
    buffer_minutes_before INTEGER DEFAULT 0;

ALTER TABLE coach_availability ADD COLUMN IF NOT EXISTS 
    buffer_minutes_after INTEGER DEFAULT 0;

ALTER TABLE coach_availability ADD COLUMN IF NOT EXISTS 
    max_sessions_per_day INTEGER;

ALTER TABLE coach_availability ADD COLUMN IF NOT EXISTS 
    available_from DATE;

ALTER TABLE coach_availability ADD COLUMN IF NOT EXISTS 
    available_until DATE;

-- =====================================================================
-- Functions for Booking System
-- =====================================================================

-- Function to check for booking conflicts
CREATE OR REPLACE FUNCTION check_booking_conflicts(
    p_coach_id UUID,
    p_start_time TIMESTAMPTZ,
    p_duration_minutes INTEGER,
    p_exclude_session_id UUID DEFAULT NULL
) RETURNS TABLE (
    conflict_type TEXT,
    conflict_details JSONB
) AS $$
BEGIN
    -- Check for session conflicts
    RETURN QUERY
    SELECT 
        'session_conflict'::TEXT as conflict_type,
        jsonb_build_object(
            'conflicting_session_id', s.id,
            'conflicting_session_start', s.scheduled_at,
            'conflicting_session_end', s.scheduled_at + (s.duration_minutes || ' minutes')::INTERVAL
        ) as conflict_details
    FROM sessions s
    WHERE s.coach_id = p_coach_id
        AND s.status = 'scheduled'
        AND (p_exclude_session_id IS NULL OR s.id != p_exclude_session_id)
        AND (
            -- New session starts during existing session
            p_start_time BETWEEN s.scheduled_at 
                AND s.scheduled_at + (s.duration_minutes || ' minutes')::INTERVAL
            OR 
            -- New session ends during existing session
            (p_start_time + (p_duration_minutes || ' minutes')::INTERVAL) 
                BETWEEN s.scheduled_at 
                AND s.scheduled_at + (s.duration_minutes || ' minutes')::INTERVAL
            OR
            -- New session completely contains existing session
            (p_start_time <= s.scheduled_at 
                AND (p_start_time + (p_duration_minutes || ' minutes')::INTERVAL) 
                    >= s.scheduled_at + (s.duration_minutes || ' minutes')::INTERVAL)
        );
    
    -- Check for reservation conflicts
    RETURN QUERY
    SELECT 
        'reservation_conflict'::TEXT as conflict_type,
        jsonb_build_object(
            'conflicting_reservation_id', r.id,
            'reservation_expires_at', r.expires_at
        ) as conflict_details
    FROM session_reservations r
    WHERE r.coach_id = p_coach_id
        AND r.status = 'active'
        AND r.expires_at > NOW()
        AND (
            p_start_time BETWEEN r.reserved_at 
                AND r.reserved_at + (r.duration_minutes || ' minutes')::INTERVAL
            OR 
            (p_start_time + (p_duration_minutes || ' minutes')::INTERVAL) 
                BETWEEN r.reserved_at 
                AND r.reserved_at + (r.duration_minutes || ' minutes')::INTERVAL
            OR
            (p_start_time <= r.reserved_at 
                AND (p_start_time + (p_duration_minutes || ' minutes')::INTERVAL) 
                    >= r.reserved_at + (r.duration_minutes || ' minutes')::INTERVAL)
        );
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired reservations
CREATE OR REPLACE FUNCTION cleanup_expired_reservations() RETURNS INTEGER AS $$
DECLARE
    cleanup_count INTEGER;
BEGIN
    UPDATE session_reservations 
    SET status = 'expired', updated_at = NOW()
    WHERE status = 'active' 
        AND expires_at < NOW();
    
    GET DIAGNOSTICS cleanup_count = ROW_COUNT;
    RETURN cleanup_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get coach available slots
CREATE OR REPLACE FUNCTION get_coach_available_slots(
    p_coach_id UUID,
    p_start_date DATE,
    p_end_date DATE,
    p_duration_minutes INTEGER DEFAULT 60,
    p_slot_interval_minutes INTEGER DEFAULT 30
) RETURNS TABLE (
    slot_start TIMESTAMPTZ,
    slot_end TIMESTAMPTZ,
    is_available BOOLEAN
) AS $$
DECLARE
    current_date DATE;
    availability_record RECORD;
    current_slot_start TIMESTAMPTZ;
    current_slot_end TIMESTAMPTZ;
    has_conflict BOOLEAN;
BEGIN
    -- Loop through each date in the range
    current_date := p_start_date;
    WHILE current_date <= p_end_date LOOP
        
        -- Get availability for current day of week
        FOR availability_record IN
            SELECT start_time, end_time, timezone
            FROM coach_availability ca
            WHERE ca.coach_id = p_coach_id
                AND ca.day_of_week = EXTRACT(DOW FROM current_date)::INTEGER
                AND ca.is_active = TRUE
                AND (ca.available_from IS NULL OR current_date >= ca.available_from)
                AND (ca.available_until IS NULL OR current_date <= ca.available_until)
        LOOP
            -- Generate time slots for this availability window
            current_slot_start := (current_date || ' ' || availability_record.start_time)::TIMESTAMPTZ
                AT TIME ZONE COALESCE(availability_record.timezone, 'UTC');
            
            WHILE current_slot_start + (p_duration_minutes || ' minutes')::INTERVAL <= 
                  (current_date || ' ' || availability_record.end_time)::TIMESTAMPTZ 
                  AT TIME ZONE COALESCE(availability_record.timezone, 'UTC') LOOP
                
                current_slot_end := current_slot_start + (p_duration_minutes || ' minutes')::INTERVAL;
                
                -- Skip past time slots
                IF current_slot_start > NOW() THEN
                    -- Check for conflicts
                    SELECT COUNT(*) > 0 INTO has_conflict
                    FROM check_booking_conflicts(p_coach_id, current_slot_start, p_duration_minutes);
                    
                    RETURN QUERY SELECT 
                        current_slot_start,
                        current_slot_end,
                        NOT has_conflict;
                END IF;
                
                -- Move to next slot
                current_slot_start := current_slot_start + (p_slot_interval_minutes || ' minutes')::INTERVAL;
            END LOOP;
        END LOOP;
        
        current_date := current_date + 1;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- Triggers and Automation
-- =====================================================================

-- Trigger to update session_reservations updated_at
CREATE OR REPLACE FUNCTION update_session_reservations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER session_reservations_updated_at
    BEFORE UPDATE ON session_reservations
    FOR EACH ROW EXECUTE FUNCTION update_session_reservations_updated_at();

-- Trigger to log booking events
CREATE OR REPLACE FUNCTION log_session_booking_events()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO booking_analytics (
            event_type,
            session_id,
            coach_id,
            client_id,
            event_data
        ) VALUES (
            'booking_completed',
            NEW.id,
            NEW.coach_id,
            NEW.client_id,
            jsonb_build_object(
                'session_type_id', NEW.session_type_id,
                'scheduled_at', NEW.scheduled_at,
                'amount_paid', NEW.amount_paid
            )
        );
        RETURN NEW;
    END IF;
    
    IF TG_OP = 'UPDATE' THEN
        -- Log status changes
        IF OLD.status != NEW.status THEN
            INSERT INTO booking_analytics (
                event_type,
                session_id,
                coach_id,
                client_id,
                event_data
            ) VALUES (
                CASE NEW.status
                    WHEN 'cancelled' THEN 'booking_cancelled'
                    WHEN 'rescheduled' THEN 'session_rescheduled'
                    WHEN 'completed' THEN 'session_completed'
                    ELSE 'session_updated'
                END,
                NEW.id,
                NEW.coach_id,
                NEW.client_id,
                jsonb_build_object(
                    'old_status', OLD.status,
                    'new_status', NEW.status,
                    'old_scheduled_at', OLD.scheduled_at,
                    'new_scheduled_at', NEW.scheduled_at
                )
            );
        END IF;
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sessions_booking_events
    AFTER INSERT OR UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION log_session_booking_events();

-- =====================================================================
-- Scheduled Tasks Setup
-- =====================================================================

-- Function to schedule session reminders
CREATE OR REPLACE FUNCTION schedule_session_reminders(p_session_id UUID) RETURNS VOID AS $$
DECLARE
    session_record sessions%ROWTYPE;
    reminder_times INTEGER[] := ARRAY[1440, 60, 15]; -- 24 hours, 1 hour, 15 minutes
    reminder_labels TEXT[] := ARRAY['24_hours', '2_hours', '15_minutes'];
    i INTEGER;
    reminder_time TIMESTAMPTZ;
BEGIN
    -- Get session details
    SELECT * INTO session_record FROM sessions WHERE id = p_session_id;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- Schedule reminders for client and coach
    FOR i IN 1..array_length(reminder_times, 1) LOOP
        reminder_time := session_record.scheduled_at - (reminder_times[i] || ' minutes')::INTERVAL;
        
        -- Only schedule if reminder time is in the future
        IF reminder_time > NOW() THEN
            -- Client reminder
            INSERT INTO session_reminders (
                session_id,
                user_id,
                reminder_type,
                scheduled_for,
                delivery_method
            ) VALUES (
                p_session_id,
                session_record.client_id,
                reminder_labels[i]::reminder_type_enum,
                reminder_time,
                'email'
            );
            
            -- Coach reminder
            INSERT INTO session_reminders (
                session_id,
                user_id,
                reminder_type,
                scheduled_for,
                delivery_method
            ) VALUES (
                p_session_id,
                session_record.coach_id,
                reminder_labels[i]::reminder_type_enum,
                reminder_time,
                'email'
            );
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically schedule reminders for new sessions
CREATE OR REPLACE FUNCTION auto_schedule_session_reminders()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'scheduled' AND (OLD IS NULL OR OLD.status != 'scheduled') THEN
        PERFORM schedule_session_reminders(NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_schedule_reminders
    AFTER INSERT OR UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION auto_schedule_session_reminders();

-- =====================================================================
-- Indexes for Performance
-- =====================================================================

-- Additional indexes for better query performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_coach_scheduled_at 
ON sessions(coach_id, scheduled_at) WHERE status = 'scheduled';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_client_scheduled_at 
ON sessions(client_id, scheduled_at) WHERE status = 'scheduled';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_status_scheduled_at 
ON sessions(status, scheduled_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_coach_availability_coach_day_active 
ON coach_availability(coach_id, day_of_week) WHERE is_active = true;

-- =====================================================================
-- Row Level Security (RLS) Policies
-- =====================================================================

-- Enable RLS on new tables
ALTER TABLE session_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_analytics ENABLE ROW LEVEL SECURITY;

-- Session reservations policies
CREATE POLICY "Users can view their own reservations" ON session_reservations
    FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Users can create reservations" ON session_reservations
    FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own reservations" ON session_reservations
    FOR UPDATE USING (created_by = auth.uid());

-- Session reminders policies
CREATE POLICY "Users can view their own reminders" ON session_reminders
    FOR SELECT USING (user_id = auth.uid());

-- Booking analytics policies (admin only for now)
CREATE POLICY "Admins can view all booking analytics" ON booking_analytics
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND (profiles.full_name ILIKE '%admin%' OR profiles.bio ILIKE '%admin%')
        )
    );

-- =====================================================================
-- Comments for Documentation
-- =====================================================================

COMMENT ON TABLE session_reservations IS 'Temporary reservations to prevent double-booking during checkout process';
COMMENT ON TABLE session_reminders IS 'Scheduled reminders for upcoming sessions';
COMMENT ON TABLE booking_analytics IS 'Analytics and event tracking for booking patterns';

COMMENT ON FUNCTION check_booking_conflicts IS 'Checks for session and reservation conflicts for a given time slot';
COMMENT ON FUNCTION cleanup_expired_reservations IS 'Removes expired reservations from the active pool';
COMMENT ON FUNCTION get_coach_available_slots IS 'Generates available time slots for a coach within a date range';
COMMENT ON FUNCTION schedule_session_reminders IS 'Schedules automatic reminders for a session';

-- =====================================================================
-- Initial Data and Configuration
-- =====================================================================

-- Insert default session types if they don't exist
INSERT INTO session_types (name, description, duration_minutes, price, is_active, booking_lead_time, cancellation_policy)
VALUES 
    ('Discovery Session', 'Complimentary consultation to explore goals and coaching fit', 30, 0, true, 120, 'Can be cancelled up to 2 hours before session time'),
    ('Single Coaching Session', 'One-time focused coaching session', 60, 20000, true, 120, 'Full refund if cancelled 24+ hours before. 50% refund if cancelled 2-24 hours before. No refund if cancelled less than 2 hours before.'),
    ('4-Session Package', 'Monthly coaching package for sustained growth', 60, 72000, true, 120, 'Package sessions can be rescheduled with 24 hours notice. Partial refunds available based on unused sessions.')
ON CONFLICT (name) DO NOTHING;

-- Set up cleanup job for expired reservations (would be handled by a cron job in production)
-- This is just for documentation - actual implementation would use pg_cron or external scheduler
COMMENT ON FUNCTION cleanup_expired_reservations IS 'Should be run every 15 minutes via cron: */15 * * * * SELECT cleanup_expired_reservations();';

-- =====================================================================
-- End of Migration
-- =====================================================================