-- MFA Schema Migration for iPEC Coach Connect
-- This migration adds comprehensive MFA support with TOTP, backup codes, and device management

-- Create MFA methods enum
CREATE TYPE mfa_method AS ENUM ('totp', 'sms', 'email');

-- Create MFA status enum
CREATE TYPE mfa_status AS ENUM ('pending', 'active', 'disabled');

-- Create device trust status enum
CREATE TYPE device_trust_status AS ENUM ('trusted', 'untrusted', 'revoked');

-- MFA settings table - stores user MFA configuration
CREATE TABLE mfa_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mfa_enabled BOOLEAN DEFAULT false,
  mfa_enforced BOOLEAN DEFAULT false, -- Admin can enforce MFA for certain users
  primary_method mfa_method,
  backup_method mfa_method,
  last_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- MFA TOTP secrets table - stores encrypted TOTP secrets
CREATE TABLE mfa_totp_secrets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  encrypted_secret TEXT NOT NULL, -- Encrypted using Supabase vault
  recovery_codes TEXT[], -- Encrypted recovery codes
  status mfa_status DEFAULT 'pending',
  verified_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- MFA backup codes table - stores single-use backup codes
CREATE TABLE mfa_backup_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL, -- Hashed backup code
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, code_hash)
);

-- MFA devices table - stores trusted devices
CREATE TABLE mfa_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_fingerprint TEXT NOT NULL,
  device_name TEXT,
  device_type TEXT, -- mobile, desktop, tablet
  browser_info JSONB,
  ip_address INET,
  trust_status device_trust_status DEFAULT 'untrusted',
  trusted_at TIMESTAMPTZ,
  trust_expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, device_fingerprint)
);

-- MFA audit log table - tracks all MFA-related events
CREATE TABLE mfa_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- enrolled, verified, failed, disabled, etc.
  method mfa_method,
  ip_address INET,
  user_agent TEXT,
  device_fingerprint TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MFA verification attempts table - for rate limiting
CREATE TABLE mfa_verification_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  method mfa_method NOT NULL,
  ip_address INET,
  device_fingerprint TEXT,
  success BOOLEAN DEFAULT false,
  attempted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_mfa_settings_user_id ON mfa_settings(user_id);
CREATE INDEX idx_mfa_totp_secrets_user_id ON mfa_totp_secrets(user_id);
CREATE INDEX idx_mfa_backup_codes_user_id ON mfa_backup_codes(user_id);
CREATE INDEX idx_mfa_devices_user_id ON mfa_devices(user_id);
CREATE INDEX idx_mfa_devices_fingerprint ON mfa_devices(device_fingerprint);
CREATE INDEX idx_mfa_audit_log_user_id ON mfa_audit_log(user_id);
CREATE INDEX idx_mfa_audit_log_created_at ON mfa_audit_log(created_at);
CREATE INDEX idx_mfa_verification_attempts_user_id ON mfa_verification_attempts(user_id);
CREATE INDEX idx_mfa_verification_attempts_attempted_at ON mfa_verification_attempts(attempted_at);

-- Row Level Security (RLS) policies
ALTER TABLE mfa_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE mfa_totp_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE mfa_backup_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE mfa_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE mfa_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE mfa_verification_attempts ENABLE ROW LEVEL SECURITY;

-- MFA settings policies - users can only access their own settings
CREATE POLICY "Users can view their own MFA settings"
  ON mfa_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own MFA settings"
  ON mfa_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own MFA settings"
  ON mfa_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- TOTP secrets policies - highly restricted
CREATE POLICY "Users can view their own TOTP secrets"
  ON mfa_totp_secrets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own TOTP secrets"
  ON mfa_totp_secrets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own TOTP secrets"
  ON mfa_totp_secrets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Backup codes policies
CREATE POLICY "Users can view their own backup codes"
  ON mfa_backup_codes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own backup codes"
  ON mfa_backup_codes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own backup codes"
  ON mfa_backup_codes FOR UPDATE
  USING (auth.uid() = user_id);

-- Device policies
CREATE POLICY "Users can view their own devices"
  ON mfa_devices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own devices"
  ON mfa_devices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own devices"
  ON mfa_devices FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own devices"
  ON mfa_devices FOR DELETE
  USING (auth.uid() = user_id);

-- Audit log policies - read only for users
CREATE POLICY "Users can view their own audit logs"
  ON mfa_audit_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert audit logs"
  ON mfa_audit_log FOR INSERT
  WITH CHECK (true); -- Service role will handle this

-- Verification attempts policies
CREATE POLICY "System can insert verification attempts"
  ON mfa_verification_attempts FOR INSERT
  WITH CHECK (true); -- Service role will handle this

-- Functions for MFA operations

-- Function to generate backup codes
CREATE OR REPLACE FUNCTION generate_backup_codes(user_id UUID, count INTEGER DEFAULT 10)
RETURNS TEXT[]
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  codes TEXT[] := '{}';
  i INTEGER;
  new_code TEXT;
BEGIN
  -- Delete existing unused backup codes
  DELETE FROM mfa_backup_codes WHERE user_id = $1 AND used_at IS NULL;
  
  -- Generate new codes
  FOR i IN 1..count LOOP
    -- Generate a random 8-character alphanumeric code
    new_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
    codes := array_append(codes, new_code);
    
    -- Insert hashed version into database
    INSERT INTO mfa_backup_codes (user_id, code_hash)
    VALUES ($1, crypt(new_code, gen_salt('bf')));
  END LOOP;
  
  RETURN codes;
END;
$$;

-- Function to verify backup code
CREATE OR REPLACE FUNCTION verify_backup_code(user_id UUID, code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_valid BOOLEAN;
  code_id UUID;
BEGIN
  -- Find matching unused backup code
  SELECT id INTO code_id
  FROM mfa_backup_codes
  WHERE user_id = $1 
    AND used_at IS NULL
    AND code_hash = crypt($2, code_hash);
  
  IF code_id IS NOT NULL THEN
    -- Mark code as used
    UPDATE mfa_backup_codes
    SET used_at = NOW()
    WHERE id = code_id;
    
    is_valid := true;
  ELSE
    is_valid := false;
  END IF;
  
  -- Log the attempt
  INSERT INTO mfa_verification_attempts (user_id, method, success)
  VALUES ($1, 'totp', is_valid);
  
  RETURN is_valid;
END;
$$;

-- Function to clean up expired verification attempts (for rate limiting)
CREATE OR REPLACE FUNCTION cleanup_mfa_verification_attempts()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Delete attempts older than 15 minutes
  DELETE FROM mfa_verification_attempts
  WHERE attempted_at < NOW() - INTERVAL '15 minutes';
END;
$$;

-- Function to check rate limit for MFA attempts
CREATE OR REPLACE FUNCTION check_mfa_rate_limit(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  attempt_count INTEGER;
BEGIN
  -- Count attempts in the last 15 minutes
  SELECT COUNT(*)
  INTO attempt_count
  FROM mfa_verification_attempts
  WHERE user_id = p_user_id
    AND attempted_at > NOW() - INTERVAL '15 minutes'
    AND success = false;
  
  -- Allow max 5 failed attempts per 15 minutes
  RETURN attempt_count < 5;
END;
$$;

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_mfa_settings_updated_at
  BEFORE UPDATE ON mfa_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mfa_totp_secrets_updated_at
  BEFORE UPDATE ON mfa_totp_secrets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create a scheduled job to cleanup old verification attempts (requires pg_cron)
-- This would be set up in Supabase dashboard or via SQL if pg_cron is available
-- SELECT cron.schedule('cleanup-mfa-attempts', '*/15 * * * *', 'SELECT cleanup_mfa_verification_attempts();');

-- Grant necessary permissions
GRANT ALL ON mfa_settings TO authenticated;
GRANT ALL ON mfa_totp_secrets TO authenticated;
GRANT ALL ON mfa_backup_codes TO authenticated;
GRANT ALL ON mfa_devices TO authenticated;
GRANT SELECT ON mfa_audit_log TO authenticated;
GRANT INSERT ON mfa_verification_attempts TO authenticated;

-- Add MFA status to profiles table for easy access
ALTER TABLE profiles ADD COLUMN mfa_enabled BOOLEAN DEFAULT false;

-- Update profiles when MFA settings change
CREATE OR REPLACE FUNCTION sync_mfa_status_to_profile()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET mfa_enabled = NEW.mfa_enabled
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_mfa_status
  AFTER INSERT OR UPDATE OF mfa_enabled ON mfa_settings
  FOR EACH ROW
  EXECUTE FUNCTION sync_mfa_status_to_profile();