-- Coach Application and Verification System Migration
-- Created: 2025-09-06
-- Purpose: Complete coach onboarding, verification, and application management system

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================================
-- COACH APPLICATIONS TABLE
-- =====================================================================
CREATE TABLE coach_applications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Application Status
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
        'draft', 'submitted', 'under_review', 'documents_requested', 
        'interview_scheduled', 'approved', 'rejected', 'withdrawn'
    )),
    
    -- Personal Information
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    
    -- Professional Information
    ipec_certification_number TEXT NOT NULL,
    certification_level TEXT NOT NULL CHECK (certification_level IN ('Associate', 'Professional', 'Master')),
    certification_date DATE NOT NULL,
    experience_years INTEGER NOT NULL CHECK (experience_years >= 0),
    hourly_rate NUMERIC(10,2) CHECK (hourly_rate >= 25.00),
    
    -- Profile Information
    bio TEXT NOT NULL CHECK (LENGTH(bio) >= 100),
    specializations TEXT[] NOT NULL DEFAULT '{}',
    languages TEXT[] NOT NULL DEFAULT '{}',
    website TEXT,
    linkedin_url TEXT,
    
    -- Application Metadata
    cover_letter TEXT NOT NULL,
    motivation TEXT,
    additional_notes TEXT,
    referral_source TEXT,
    
    -- Review Information
    reviewer_id UUID REFERENCES profiles(id),
    review_notes TEXT,
    rejection_reason TEXT,
    approval_date TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    submitted_at TIMESTAMP WITH TIME ZONE,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_coach_applications_user_id ON coach_applications(user_id);
CREATE INDEX idx_coach_applications_status ON coach_applications(status);
CREATE INDEX idx_coach_applications_submitted_at ON coach_applications(submitted_at);
CREATE INDEX idx_coach_applications_reviewer_id ON coach_applications(reviewer_id);

-- =====================================================================
-- APPLICATION DOCUMENTS TABLE
-- =====================================================================
CREATE TABLE application_documents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    application_id UUID NOT NULL REFERENCES coach_applications(id) ON DELETE CASCADE,
    
    -- Document Information
    document_type TEXT NOT NULL CHECK (document_type IN (
        'resume', 'certification', 'identity', 'insurance', 'portfolio', 
        'reference_letter', 'additional'
    )),
    document_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    
    -- Verification Status
    verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN (
        'pending', 'verified', 'rejected', 'expired'
    )),
    verified_by UUID REFERENCES profiles(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    verification_notes TEXT,
    
    -- Metadata
    is_required BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_application_documents_application_id ON application_documents(application_id);
CREATE INDEX idx_application_documents_type ON application_documents(document_type);
CREATE INDEX idx_application_documents_status ON application_documents(verification_status);

-- =====================================================================
-- APPLICATION REFERENCES TABLE
-- =====================================================================
CREATE TABLE application_references (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    application_id UUID NOT NULL REFERENCES coach_applications(id) ON DELETE CASCADE,
    
    -- Reference Information
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    relationship TEXT NOT NULL,
    organization TEXT,
    
    -- Contact Status
    contact_status TEXT NOT NULL DEFAULT 'pending' CHECK (contact_status IN (
        'pending', 'contacted', 'responded', 'unavailable'
    )),
    contacted_at TIMESTAMP WITH TIME ZONE,
    responded_at TIMESTAMP WITH TIME ZONE,
    
    -- Reference Response
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comments TEXT,
    would_recommend BOOLEAN,
    
    -- Metadata
    is_verified BOOLEAN DEFAULT FALSE,
    verification_token TEXT UNIQUE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_application_references_application_id ON application_references(application_id);
CREATE INDEX idx_application_references_status ON application_references(contact_status);
CREATE INDEX idx_application_references_token ON application_references(verification_token);

-- =====================================================================
-- APPLICATION REVIEWS TABLE
-- =====================================================================
CREATE TABLE application_reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    application_id UUID NOT NULL REFERENCES coach_applications(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES profiles(id),
    
    -- Review Information
    review_type TEXT NOT NULL CHECK (review_type IN (
        'initial', 'documents', 'references', 'interview', 'final'
    )),
    decision TEXT CHECK (decision IN ('approve', 'reject', 'request_info', 'schedule_interview')),
    
    -- Review Criteria (1-5 scale)
    credentials_rating INTEGER CHECK (credentials_rating >= 1 AND credentials_rating <= 5),
    experience_rating INTEGER CHECK (experience_rating >= 1 AND experience_rating <= 5),
    communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
    professionalism_rating INTEGER CHECK (professionalism_rating >= 1 AND professionalism_rating <= 5),
    overall_rating NUMERIC(3,2) CHECK (overall_rating >= 1.0 AND overall_rating <= 5.0),
    
    -- Review Notes
    strengths TEXT,
    concerns TEXT,
    recommendations TEXT,
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_application_reviews_application_id ON application_reviews(application_id);
CREATE INDEX idx_application_reviews_reviewer_id ON application_reviews(reviewer_id);
CREATE INDEX idx_application_reviews_type ON application_reviews(review_type);

-- =====================================================================
-- APPLICATION INTERVIEW TABLE
-- =====================================================================
CREATE TABLE application_interviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    application_id UUID NOT NULL REFERENCES coach_applications(id) ON DELETE CASCADE,
    interviewer_id UUID NOT NULL REFERENCES profiles(id),
    
    -- Interview Information
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    meeting_url TEXT,
    meeting_platform TEXT DEFAULT 'zoom',
    
    -- Interview Status
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN (
        'scheduled', 'completed', 'cancelled', 'no_show', 'rescheduled'
    )),
    
    -- Interview Results
    conducted_at TIMESTAMP WITH TIME ZONE,
    coaching_skills_rating INTEGER CHECK (coaching_skills_rating >= 1 AND coaching_skills_rating <= 5),
    communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
    culture_fit_rating INTEGER CHECK (culture_fit_rating >= 1 AND culture_fit_rating <= 5),
    technical_rating INTEGER CHECK (technical_rating >= 1 AND technical_rating <= 5),
    overall_rating NUMERIC(3,2) CHECK (overall_rating >= 1.0 AND overall_rating <= 5.0),
    
    -- Interview Notes
    notes TEXT,
    recommendation TEXT CHECK (recommendation IN ('hire', 'reject', 'second_interview')),
    next_steps TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_application_interviews_application_id ON application_interviews(application_id);
CREATE INDEX idx_application_interviews_interviewer_id ON application_interviews(interviewer_id);
CREATE INDEX idx_application_interviews_scheduled_at ON application_interviews(scheduled_at);
CREATE INDEX idx_application_interviews_status ON application_interviews(status);

-- =====================================================================
-- APPLICATION STATUS HISTORY TABLE
-- =====================================================================
CREATE TABLE application_status_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    application_id UUID NOT NULL REFERENCES coach_applications(id) ON DELETE CASCADE,
    
    -- Status Change Information
    from_status TEXT,
    to_status TEXT NOT NULL,
    changed_by UUID REFERENCES profiles(id),
    change_reason TEXT,
    notes TEXT,
    
    -- Metadata
    automated BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_application_status_history_application_id ON application_status_history(application_id);
CREATE INDEX idx_application_status_history_created_at ON application_status_history(created_at);

-- =====================================================================
-- APPLICATION NOTIFICATIONS TABLE
-- =====================================================================
CREATE TABLE application_notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    application_id UUID NOT NULL REFERENCES coach_applications(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES profiles(id),
    
    -- Notification Information
    type TEXT NOT NULL CHECK (type IN (
        'application_submitted', 'under_review', 'documents_requested', 
        'interview_scheduled', 'interview_reminder', 'approved', 'rejected',
        'additional_info_needed', 'reference_request'
    )),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    
    -- Delivery Information
    delivery_method TEXT NOT NULL DEFAULT 'email' CHECK (delivery_method IN ('email', 'sms', 'in_app', 'all')),
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- Email/SMS Information
    email_subject TEXT,
    email_template TEXT,
    sms_message TEXT,
    
    -- Metadata
    priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 5),
    retry_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_application_notifications_application_id ON application_notifications(application_id);
CREATE INDEX idx_application_notifications_recipient_id ON application_notifications(recipient_id);
CREATE INDEX idx_application_notifications_type ON application_notifications(type);
CREATE INDEX idx_application_notifications_sent_at ON application_notifications(sent_at);

-- =====================================================================
-- ADMIN REVIEW QUEUES TABLE
-- =====================================================================
CREATE TABLE admin_review_queues (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    application_id UUID NOT NULL REFERENCES coach_applications(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES profiles(id),
    
    -- Queue Information
    queue_type TEXT NOT NULL CHECK (queue_type IN (
        'initial_review', 'document_verification', 'reference_check', 
        'interview_scheduling', 'final_approval'
    )),
    priority INTEGER DEFAULT 3 CHECK (priority >= 1 AND priority <= 5),
    
    -- Status Information
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'in_progress', 'completed', 'escalated'
    )),
    
    -- Timeline Information
    due_date TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    estimated_hours NUMERIC(4,2) DEFAULT 1.0,
    actual_hours NUMERIC(4,2),
    complexity_score INTEGER DEFAULT 1 CHECK (complexity_score >= 1 AND complexity_score <= 5),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_admin_review_queues_application_id ON admin_review_queues(application_id);
CREATE INDEX idx_admin_review_queues_assigned_to ON admin_review_queues(assigned_to);
CREATE INDEX idx_admin_review_queues_queue_type ON admin_review_queues(queue_type);
CREATE INDEX idx_admin_review_queues_status ON admin_review_queues(status);
CREATE INDEX idx_admin_review_queues_due_date ON admin_review_queues(due_date);

-- =====================================================================
-- UPDATE TRIGGERS
-- =====================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_coach_applications_updated_at 
    BEFORE UPDATE ON coach_applications 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_application_documents_updated_at 
    BEFORE UPDATE ON application_documents 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_application_references_updated_at 
    BEFORE UPDATE ON application_references 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_application_interviews_updated_at 
    BEFORE UPDATE ON application_interviews 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_admin_review_queues_updated_at 
    BEFORE UPDATE ON admin_review_queues 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- =====================================================================
-- STATUS CHANGE TRIGGER
-- =====================================================================

-- Function to log status changes
CREATE OR REPLACE FUNCTION log_application_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log if status actually changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO application_status_history (
            application_id, 
            from_status, 
            to_status, 
            changed_by,
            automated,
            notes
        ) VALUES (
            NEW.id, 
            OLD.status, 
            NEW.status, 
            NEW.reviewer_id,
            FALSE,
            'Status changed from ' || COALESCE(OLD.status, 'null') || ' to ' || NEW.status
        );
        
        -- Update relevant timestamps
        IF NEW.status = 'submitted' AND OLD.status = 'draft' THEN
            NEW.submitted_at = NOW();
        ELSIF NEW.status = 'approved' THEN
            NEW.approval_date = NOW();
            NEW.reviewed_at = NOW();
        ELSIF NEW.status IN ('rejected', 'withdrawn') THEN
            NEW.reviewed_at = NOW();
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create status change trigger
CREATE TRIGGER log_coach_application_status_change 
    BEFORE UPDATE ON coach_applications 
    FOR EACH ROW EXECUTE PROCEDURE log_application_status_change();

-- =====================================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================================

-- Enable RLS on all tables
ALTER TABLE coach_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_review_queues ENABLE ROW LEVEL SECURITY;

-- Coach Applications policies
CREATE POLICY "Users can view their own applications" ON coach_applications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own applications" ON coach_applications
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own draft applications" ON coach_applications
    FOR UPDATE USING (user_id = auth.uid() AND status = 'draft');

-- Admin policies for coach applications
CREATE POLICY "Admins can view all applications" ON coach_applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() 
            AND EXISTS (
                SELECT 1 FROM coaches c 
                WHERE c.id = p.id 
                AND c.is_active = true
            )
        )
        OR 
        auth.jwt() ->> 'role' = 'admin'
    );

CREATE POLICY "Admins can update all applications" ON coach_applications
    FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

-- Application Documents policies
CREATE POLICY "Users can view their own documents" ON application_documents
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM coach_applications ca 
            WHERE ca.id = application_documents.application_id 
            AND ca.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their own documents" ON application_documents
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM coach_applications ca 
            WHERE ca.id = application_documents.application_id 
            AND ca.user_id = auth.uid()
            AND ca.status IN ('draft', 'documents_requested')
        )
    );

-- Admins can view/manage all documents
CREATE POLICY "Admins can manage all documents" ON application_documents
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Application References policies
CREATE POLICY "Users can view their own references" ON application_references
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM coach_applications ca 
            WHERE ca.id = application_references.application_id 
            AND ca.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their own references" ON application_references
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM coach_applications ca 
            WHERE ca.id = application_references.application_id 
            AND ca.user_id = auth.uid()
            AND ca.status IN ('draft', 'documents_requested')
        )
    );

-- Admins can manage all references
CREATE POLICY "Admins can manage all references" ON application_references
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Reviews, interviews, notifications, and admin queues - admin only
CREATE POLICY "Admin only access" ON application_reviews FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admin only access" ON application_interviews FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admin only access" ON admin_review_queues FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Status history - read only for users and admins
CREATE POLICY "Users can view their own status history" ON application_status_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM coach_applications ca 
            WHERE ca.id = application_status_history.application_id 
            AND ca.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all status history" ON application_status_history
    FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- Notifications - users can view their own
CREATE POLICY "Users can view their own notifications" ON application_notifications
    FOR SELECT USING (recipient_id = auth.uid());

CREATE POLICY "Admins can manage all notifications" ON application_notifications
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- =====================================================================
-- HELPER FUNCTIONS
-- =====================================================================

-- Function to get application summary
CREATE OR REPLACE FUNCTION get_application_summary(app_id UUID)
RETURNS JSON AS $$
DECLARE
    app_data JSON;
BEGIN
    SELECT to_json(t) INTO app_data
    FROM (
        SELECT 
            ca.*,
            p.full_name,
            p.avatar_url,
            (
                SELECT COUNT(*) 
                FROM application_documents ad 
                WHERE ad.application_id = ca.id
            ) as document_count,
            (
                SELECT COUNT(*) 
                FROM application_documents ad 
                WHERE ad.application_id = ca.id 
                AND ad.verification_status = 'verified'
            ) as verified_documents_count,
            (
                SELECT COUNT(*) 
                FROM application_references ar 
                WHERE ar.application_id = ca.id
            ) as reference_count,
            (
                SELECT COUNT(*) 
                FROM application_references ar 
                WHERE ar.application_id = ca.id 
                AND ar.contact_status = 'responded'
            ) as completed_references_count,
            (
                SELECT AVG(overall_rating) 
                FROM application_reviews ar 
                WHERE ar.application_id = ca.id 
                AND ar.overall_rating IS NOT NULL
            ) as average_rating
        FROM coach_applications ca
        LEFT JOIN profiles p ON ca.user_id = p.id
        WHERE ca.id = app_id
    ) t;
    
    RETURN app_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update application progress
CREATE OR REPLACE FUNCTION calculate_application_progress(app_id UUID)
RETURNS INTEGER AS $$
DECLARE
    progress INTEGER := 0;
    doc_progress INTEGER := 0;
    ref_progress INTEGER := 0;
    review_progress INTEGER := 0;
BEGIN
    -- Basic application data (20%)
    SELECT 
        CASE WHEN status != 'draft' THEN 20 ELSE 10 END
    INTO progress
    FROM coach_applications 
    WHERE id = app_id;
    
    -- Documents progress (30%)
    SELECT 
        CASE 
            WHEN total = 0 THEN 0
            ELSE (verified * 30 / total)
        END
    INTO doc_progress
    FROM (
        SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN verification_status = 'verified' THEN 1 END) as verified
        FROM application_documents 
        WHERE application_id = app_id
    ) t;
    
    -- References progress (25%)
    SELECT 
        CASE 
            WHEN total = 0 THEN 0
            ELSE (completed * 25 / total)
        END
    INTO ref_progress
    FROM (
        SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN contact_status = 'responded' THEN 1 END) as completed
        FROM application_references 
        WHERE application_id = app_id
    ) t;
    
    -- Review progress (25%)
    SELECT 
        CASE 
            WHEN EXISTS (SELECT 1 FROM coach_applications WHERE id = app_id AND status = 'approved') THEN 25
            WHEN EXISTS (SELECT 1 FROM application_interviews WHERE application_id = app_id AND status = 'completed') THEN 20
            WHEN EXISTS (SELECT 1 FROM application_reviews WHERE application_id = app_id) THEN 15
            ELSE 0
        END
    INTO review_progress;
    
    RETURN LEAST(100, progress + doc_progress + ref_progress + review_progress);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================
-- SAMPLE DATA (for development/testing)
-- =====================================================================

-- Insert sample application statuses for reference
COMMENT ON COLUMN coach_applications.status IS 'Application workflow: draft → submitted → under_review → (documents_requested|interview_scheduled) → approved|rejected';

-- Create initial admin review queue types
INSERT INTO admin_review_queues (id, application_id, queue_type, priority, status, created_at) 
SELECT 
    uuid_generate_v4(),
    id,
    'initial_review',
    2,
    'pending',
    NOW()
FROM coach_applications 
WHERE status = 'submitted'
ON CONFLICT DO NOTHING;