-- =====================================================================
-- iPEC Coach Connect - Payment System Schema
-- =====================================================================
-- This migration creates comprehensive payment infrastructure including
-- Stripe integration, subscription management, payment methods, invoices,
-- and comprehensive audit trails for all payment operations.
-- =====================================================================

-- Enable necessary extensions for payments
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================================
-- PAYMENT CORE ENTITIES
-- =====================================================================

-- Customers (mirrors Stripe customers)
CREATE TABLE public.payment_customers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
    stripe_customer_id TEXT UNIQUE NOT NULL,
    email TEXT,
    default_payment_method_id TEXT,
    invoice_settings JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment Methods (mirrors Stripe payment methods)
CREATE TABLE public.payment_methods (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_id UUID REFERENCES public.payment_customers(id) ON DELETE CASCADE NOT NULL,
    stripe_payment_method_id TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('card', 'bank_account', 'sepa_debit', 'ideal', 'paypal')),
    card_info JSONB, -- last4, brand, exp_month, exp_year, country, fingerprint
    billing_details JSONB, -- name, email, phone, address
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products (coaching packages, sessions, courses)
CREATE TABLE public.payment_products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    stripe_product_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('session', 'package', 'course', 'event', 'membership')),
    reference_id UUID, -- References session_types, courses, events, etc.
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prices (mirrors Stripe prices)
CREATE TABLE public.payment_prices (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID REFERENCES public.payment_products(id) ON DELETE CASCADE NOT NULL,
    stripe_price_id TEXT UNIQUE NOT NULL,
    currency TEXT NOT NULL DEFAULT 'usd',
    unit_amount INTEGER NOT NULL, -- Amount in cents
    billing_scheme TEXT NOT NULL CHECK (billing_scheme IN ('per_unit', 'tiered')) DEFAULT 'per_unit',
    recurring_interval TEXT CHECK (recurring_interval IN ('day', 'week', 'month', 'year')),
    recurring_interval_count INTEGER DEFAULT 1,
    trial_period_days INTEGER,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================================
-- PAYMENT TRANSACTIONS
-- =====================================================================

-- Payment Intents (one-time payments)
CREATE TABLE public.payment_intents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_id UUID REFERENCES public.payment_customers(id) NOT NULL,
    stripe_payment_intent_id TEXT UNIQUE NOT NULL,
    amount INTEGER NOT NULL, -- Amount in cents
    currency TEXT NOT NULL DEFAULT 'usd',
    status TEXT NOT NULL CHECK (status IN (
        'requires_payment_method', 'requires_confirmation', 'requires_action',
        'processing', 'requires_capture', 'canceled', 'succeeded'
    )),
    payment_method_id UUID REFERENCES public.payment_methods(id),
    description TEXT,
    receipt_email TEXT,
    
    -- Related entity information
    entity_type TEXT CHECK (entity_type IN ('session', 'course', 'event', 'package')),
    entity_id UUID, -- References sessions, courses, events, etc.
    
    -- Stripe webhook data
    charges JSONB, -- Stripe charges data
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    canceled_at TIMESTAMP WITH TIME ZONE,
    succeeded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Setup Intents (for saving payment methods)
CREATE TABLE public.setup_intents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_id UUID REFERENCES public.payment_customers(id) NOT NULL,
    stripe_setup_intent_id TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL CHECK (status IN (
        'requires_payment_method', 'requires_confirmation', 'requires_action',
        'processing', 'canceled', 'succeeded'
    )),
    payment_method_id UUID REFERENCES public.payment_methods(id),
    usage TEXT NOT NULL DEFAULT 'off_session' CHECK (usage IN ('on_session', 'off_session')),
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    canceled_at TIMESTAMP WITH TIME ZONE,
    succeeded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================================
-- SUBSCRIPTION MANAGEMENT
-- =====================================================================

-- Subscription Plans
CREATE TABLE public.subscription_plans (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price_id UUID REFERENCES public.payment_prices(id) NOT NULL,
    features TEXT[] DEFAULT '{}',
    max_sessions INTEGER, -- Monthly session limit
    coach_revenue_share DECIMAL(5,2) DEFAULT 80.00, -- Percentage coach keeps
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer Subscriptions
CREATE TABLE public.subscriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_id UUID REFERENCES public.payment_customers(id) ON DELETE CASCADE NOT NULL,
    stripe_subscription_id TEXT UNIQUE NOT NULL,
    plan_id UUID REFERENCES public.subscription_plans(id) NOT NULL,
    status TEXT NOT NULL CHECK (status IN (
        'trialing', 'active', 'incomplete', 'incomplete_expired',
        'past_due', 'canceled', 'unpaid', 'paused'
    )),
    
    -- Subscription details
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    trial_start TIMESTAMP WITH TIME ZONE,
    trial_end TIMESTAMP WITH TIME ZONE,
    cancel_at TIMESTAMP WITH TIME ZONE,
    canceled_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    
    -- Usage tracking
    sessions_used INTEGER DEFAULT 0,
    sessions_limit INTEGER,
    
    -- Financial tracking
    discount_id TEXT, -- Stripe coupon/discount
    tax_percent DECIMAL(5,2),
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================================
-- INVOICING SYSTEM
-- =====================================================================

-- Invoices
CREATE TABLE public.invoices (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_id UUID REFERENCES public.payment_customers(id) NOT NULL,
    subscription_id UUID REFERENCES public.subscriptions(id),
    stripe_invoice_id TEXT UNIQUE NOT NULL,
    
    -- Invoice details
    invoice_number TEXT UNIQUE,
    status TEXT NOT NULL CHECK (status IN (
        'draft', 'open', 'paid', 'void', 'uncollectible'
    )),
    
    -- Financial details
    subtotal INTEGER NOT NULL, -- Amount in cents before tax
    tax INTEGER DEFAULT 0, -- Tax amount in cents
    total INTEGER NOT NULL, -- Total amount in cents
    amount_paid INTEGER DEFAULT 0,
    amount_due INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'usd',
    
    -- Dates
    due_date DATE,
    period_start TIMESTAMP WITH TIME ZONE,
    period_end TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    voided_at TIMESTAMP WITH TIME ZONE,
    
    -- Links and metadata
    hosted_invoice_url TEXT,
    invoice_pdf TEXT,
    receipt_number TEXT,
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoice Line Items
CREATE TABLE public.invoice_line_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
    stripe_line_item_id TEXT,
    
    -- Item details
    description TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_amount INTEGER NOT NULL, -- Amount in cents
    amount INTEGER NOT NULL, -- Total line amount in cents
    currency TEXT NOT NULL DEFAULT 'usd',
    
    -- Product information
    product_id UUID REFERENCES public.payment_products(id),
    price_id UUID REFERENCES public.payment_prices(id),
    
    -- Period for recurring items
    period_start TIMESTAMP WITH TIME ZONE,
    period_end TIMESTAMP WITH TIME ZONE,
    
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================================
-- PAYMENT PROCESSING & WEBHOOKS
-- =====================================================================

-- Webhook Events (for debugging and audit)
CREATE TABLE public.webhook_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    stripe_event_id TEXT UNIQUE NOT NULL,
    event_type TEXT NOT NULL,
    api_version TEXT,
    livemode BOOLEAN NOT NULL,
    
    -- Event data
    data JSONB NOT NULL,
    request_id TEXT,
    idempotency_key TEXT,
    
    -- Processing status
    processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMP WITH TIME ZONE,
    processing_error TEXT,
    retry_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment Processing Log
CREATE TABLE public.payment_processing_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    payment_intent_id UUID REFERENCES public.payment_intents(id),
    subscription_id UUID REFERENCES public.subscriptions(id),
    
    -- Event details
    event_type TEXT NOT NULL,
    status TEXT NOT NULL,
    message TEXT,
    
    -- Context
    user_id UUID REFERENCES public.profiles(id),
    stripe_event_id TEXT,
    ip_address INET,
    user_agent TEXT,
    
    -- Debugging data
    request_data JSONB,
    response_data JSONB,
    error_data JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================================
-- FINANCIAL REPORTING & ANALYTICS
-- =====================================================================

-- Revenue Tracking (for coaches and platform)
CREATE TABLE public.revenue_records (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    payment_intent_id UUID REFERENCES public.payment_intents(id) NOT NULL,
    
    -- Revenue split
    gross_amount INTEGER NOT NULL, -- Total amount in cents
    platform_fee INTEGER NOT NULL, -- Platform fee in cents
    coach_amount INTEGER NOT NULL, -- Amount to coach in cents
    stripe_fee INTEGER NOT NULL, -- Stripe processing fee in cents
    net_amount INTEGER NOT NULL, -- Net to platform in cents
    
    -- Coach information
    coach_id UUID REFERENCES public.coaches(id),
    coach_payout_status TEXT DEFAULT 'pending' CHECK (coach_payout_status IN ('pending', 'processing', 'paid', 'failed')),
    coach_payout_date TIMESTAMP WITH TIME ZONE,
    coach_payout_reference TEXT,
    
    -- Entity reference
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    
    currency TEXT NOT NULL DEFAULT 'usd',
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Refunds
CREATE TABLE public.refunds (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    payment_intent_id UUID REFERENCES public.payment_intents(id) NOT NULL,
    stripe_refund_id TEXT UNIQUE NOT NULL,
    
    -- Refund details
    amount INTEGER NOT NULL, -- Amount refunded in cents
    currency TEXT NOT NULL DEFAULT 'usd',
    reason TEXT CHECK (reason IN ('duplicate', 'fraudulent', 'requested_by_customer')),
    status TEXT NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'canceled')),
    
    -- References
    charge_id TEXT, -- Stripe charge ID
    receipt_number TEXT,
    failure_reason TEXT,
    
    -- Coach impact
    coach_adjustment INTEGER DEFAULT 0, -- Amount to adjust coach revenue
    
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================================

-- Enable RLS on all payment tables
ALTER TABLE public.payment_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.setup_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_processing_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;

-- Customer policies - users can only access their own payment data
CREATE POLICY "Users can view own payment customer data" ON public.payment_customers
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view own payment methods" ON public.payment_methods
    FOR SELECT USING (
        customer_id IN (
            SELECT id FROM public.payment_customers WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view own payment intents" ON public.payment_intents
    FOR SELECT USING (
        customer_id IN (
            SELECT id FROM public.payment_customers WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
    FOR SELECT USING (
        customer_id IN (
            SELECT id FROM public.payment_customers WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view own invoices" ON public.invoices
    FOR SELECT USING (
        customer_id IN (
            SELECT id FROM public.payment_customers WHERE user_id = auth.uid()
        )
    );

-- Allow coaches to view their revenue records
CREATE POLICY "Coaches can view own revenue records" ON public.revenue_records
    FOR SELECT USING (coach_id = auth.uid());

-- Public access to active subscription plans and products
CREATE POLICY "Anyone can view active subscription plans" ON public.subscription_plans
    FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can view active payment products" ON public.payment_products
    FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can view active payment prices" ON public.payment_prices
    FOR SELECT USING (is_active = true);

-- =====================================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================================

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.handle_payment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to payment tables
CREATE TRIGGER handle_payment_updated_at BEFORE UPDATE ON public.payment_customers
    FOR EACH ROW EXECUTE FUNCTION public.handle_payment_updated_at();

CREATE TRIGGER handle_payment_updated_at BEFORE UPDATE ON public.payment_methods
    FOR EACH ROW EXECUTE FUNCTION public.handle_payment_updated_at();

CREATE TRIGGER handle_payment_updated_at BEFORE UPDATE ON public.payment_products
    FOR EACH ROW EXECUTE FUNCTION public.handle_payment_updated_at();

CREATE TRIGGER handle_payment_updated_at BEFORE UPDATE ON public.payment_prices
    FOR EACH ROW EXECUTE FUNCTION public.handle_payment_updated_at();

CREATE TRIGGER handle_payment_updated_at BEFORE UPDATE ON public.payment_intents
    FOR EACH ROW EXECUTE FUNCTION public.handle_payment_updated_at();

CREATE TRIGGER handle_payment_updated_at BEFORE UPDATE ON public.setup_intents
    FOR EACH ROW EXECUTE FUNCTION public.handle_payment_updated_at();

CREATE TRIGGER handle_payment_updated_at BEFORE UPDATE ON public.subscription_plans
    FOR EACH ROW EXECUTE FUNCTION public.handle_payment_updated_at();

CREATE TRIGGER handle_payment_updated_at BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.handle_payment_updated_at();

CREATE TRIGGER handle_payment_updated_at BEFORE UPDATE ON public.invoices
    FOR EACH ROW EXECUTE FUNCTION public.handle_payment_updated_at();

CREATE TRIGGER handle_payment_updated_at BEFORE UPDATE ON public.refunds
    FOR EACH ROW EXECUTE FUNCTION public.handle_payment_updated_at();

-- Function to ensure only one default payment method per customer
CREATE OR REPLACE FUNCTION public.ensure_single_default_payment_method()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_default = true THEN
        -- Set all other payment methods for this customer to non-default
        UPDATE public.payment_methods 
        SET is_default = false 
        WHERE customer_id = NEW.customer_id AND id != NEW.id;
        
        -- Update customer's default_payment_method_id
        UPDATE public.payment_customers
        SET default_payment_method_id = NEW.stripe_payment_method_id
        WHERE id = NEW.customer_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to ensure single default payment method
CREATE TRIGGER ensure_single_default_payment_method
    AFTER INSERT OR UPDATE ON public.payment_methods
    FOR EACH ROW EXECUTE FUNCTION public.ensure_single_default_payment_method();

-- Function to calculate revenue split
CREATE OR REPLACE FUNCTION public.calculate_revenue_split(
    p_gross_amount INTEGER,
    p_coach_revenue_share DECIMAL DEFAULT 80.00
) RETURNS TABLE (
    gross_amount INTEGER,
    coach_amount INTEGER,
    platform_fee INTEGER,
    stripe_fee INTEGER,
    net_amount INTEGER
) AS $$
DECLARE
    v_stripe_fee INTEGER;
    v_coach_amount INTEGER;
    v_platform_fee INTEGER;
    v_net_amount INTEGER;
BEGIN
    -- Calculate Stripe fee (2.9% + $0.30)
    v_stripe_fee := ROUND(p_gross_amount * 0.029) + 30;
    
    -- Calculate coach amount (percentage of gross minus Stripe fee)
    v_coach_amount := ROUND((p_gross_amount - v_stripe_fee) * (p_coach_revenue_share / 100.0));
    
    -- Platform keeps the rest
    v_platform_fee := p_gross_amount - v_stripe_fee - v_coach_amount;
    v_net_amount := v_platform_fee;
    
    RETURN QUERY SELECT 
        p_gross_amount,
        v_coach_amount,
        v_platform_fee,
        v_stripe_fee,
        v_net_amount;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================================

-- Payment customer indexes
CREATE INDEX idx_payment_customers_user_id ON public.payment_customers (user_id);
CREATE INDEX idx_payment_customers_stripe_id ON public.payment_customers (stripe_customer_id);

-- Payment method indexes
CREATE INDEX idx_payment_methods_customer_id ON public.payment_methods (customer_id);
CREATE INDEX idx_payment_methods_default ON public.payment_methods (customer_id, is_default) WHERE is_default = true;
CREATE INDEX idx_payment_methods_active ON public.payment_methods (customer_id, is_active) WHERE is_active = true;

-- Payment intent indexes
CREATE INDEX idx_payment_intents_customer_id ON public.payment_intents (customer_id);
CREATE INDEX idx_payment_intents_status ON public.payment_intents (status);
CREATE INDEX idx_payment_intents_stripe_id ON public.payment_intents (stripe_payment_intent_id);
CREATE INDEX idx_payment_intents_entity ON public.payment_intents (entity_type, entity_id);
CREATE INDEX idx_payment_intents_created_at ON public.payment_intents (created_at);

-- Subscription indexes
CREATE INDEX idx_subscriptions_customer_id ON public.subscriptions (customer_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions (status);
CREATE INDEX idx_subscriptions_plan_id ON public.subscriptions (plan_id);
CREATE INDEX idx_subscriptions_current_period ON public.subscriptions (current_period_end);

-- Invoice indexes
CREATE INDEX idx_invoices_customer_id ON public.invoices (customer_id);
CREATE INDEX idx_invoices_subscription_id ON public.invoices (subscription_id);
CREATE INDEX idx_invoices_status ON public.invoices (status);
CREATE INDEX idx_invoices_due_date ON public.invoices (due_date) WHERE status IN ('open', 'past_due');

-- Webhook event indexes
CREATE INDEX idx_webhook_events_stripe_id ON public.webhook_events (stripe_event_id);
CREATE INDEX idx_webhook_events_processed ON public.webhook_events (processed, created_at) WHERE processed = false;
CREATE INDEX idx_webhook_events_type ON public.webhook_events (event_type);

-- Revenue tracking indexes
CREATE INDEX idx_revenue_records_coach_id ON public.revenue_records (coach_id);
CREATE INDEX idx_revenue_records_payout_status ON public.revenue_records (coach_payout_status, coach_id);
CREATE INDEX idx_revenue_records_processed_at ON public.revenue_records (processed_at);

-- =====================================================================
-- INITIAL DATA
-- =====================================================================

-- Insert default subscription plans
INSERT INTO public.subscription_plans (name, description, max_sessions, coach_revenue_share) VALUES
('Basic Plan', 'Up to 2 coaching sessions per month', 2, 80.00),
('Professional Plan', 'Up to 4 coaching sessions per month', 4, 82.00),
('Premium Plan', 'Up to 8 coaching sessions per month', 8, 85.00),
('Unlimited Plan', 'Unlimited coaching sessions', NULL, 85.00);

-- Note: Actual Stripe product and price creation will be handled by the service layer
-- This ensures consistency between our database and Stripe's records