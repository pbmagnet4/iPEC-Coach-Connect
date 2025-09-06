# Multi-Factor Authentication (MFA) Implementation

## Overview

iPEC Coach Connect implements a comprehensive Multi-Factor Authentication system to enhance account security. The system supports TOTP (Time-based One-Time Password), backup codes, device trust management, and progressive security measures.

## Features

### 🔐 Authentication Methods
- **TOTP (Primary)**: Compatible with Google Authenticator, Authy, 1Password, etc.
- **SMS Verification**: Backup method for TOTP (configurable)
- **Email Verification**: Secondary backup method (configurable)
- **Backup Codes**: 10 single-use recovery codes

### 🛡️ Security Features
- **Rate Limiting**: 5 attempts per 15 minutes with progressive delays
- **Device Trust**: 30-day device trust with fingerprinting
- **Audit Logging**: Comprehensive MFA event tracking
- **Session Security**: Integration with secure session management
- **Emergency Recovery**: Admin override capabilities

### 🎯 User Experience
- **Progressive Enrollment**: Step-by-step MFA setup flow
- **QR Code Setup**: Easy authenticator app configuration
- **Device Management**: View and revoke trusted devices
- **Backup Code Management**: Generate, view, and download codes
- **Mobile Optimization**: Responsive design for all devices

## Architecture

### Database Schema

The MFA system uses several tables to manage authentication data:

```sql
-- Core MFA settings
mfa_settings (user_id, mfa_enabled, primary_method, backup_method, ...)

-- TOTP secrets (encrypted)
mfa_totp_secrets (user_id, encrypted_secret, status, ...)

-- Single-use backup codes
mfa_backup_codes (user_id, code_hash, used_at, ...)

-- Trusted devices
mfa_devices (user_id, device_fingerprint, trust_status, ...)

-- Security audit log
mfa_audit_log (user_id, event_type, method, metadata, ...)

-- Rate limiting
mfa_verification_attempts (user_id, method, success, attempted_at, ...)
```

### Service Layer

The `MFAService` class provides all MFA functionality:

```typescript
// Core operations
mfaService.initializeMFA(userId)
mfaService.verifyAndEnableMFA(userId, code, deviceName?)
mfaService.verifyMFALogin(userId, code, method?)
mfaService.disableMFA(userId, verificationCode)

// Device management
mfaService.trustDevice(userId, deviceName)
mfaService.isDeviceTrusted(userId, fingerprint?)
mfaService.revokeDeviceTrust(userId, deviceId)

// Backup codes
mfaService.generateNewBackupCodes(userId)

// Settings
mfaService.getMFASettings(userId)
mfaService.getTrustedDevices(userId)
```

### React Components

Three main React components handle the MFA user interface:

1. **MFAEnrollment**: Step-by-step MFA setup flow
2. **MFAVerification**: Login verification interface
3. **MFASettings**: Management and configuration interface

## Usage Guide

### Basic Implementation

#### 1. Protect Routes with MFA

```tsx
import { MFAProtectedRoute } from '../components/auth/MFAProtectedRoute';

function App() {
  return (
    <Routes>
      <Route 
        path="/dashboard" 
        element={
          <MFAProtectedRoute>
            <Dashboard />
          </MFAProtectedRoute>
        } 
      />
    </Routes>
  );
}
```

#### 2. Use MFA Hook in Components

```tsx
import { useMFA } from '../hooks/useMFA';

function SecuritySettings() {
  const { 
    settings, 
    devices, 
    initializeMFA, 
    generateBackupCodes,
    error 
  } = useMFA();

  const handleEnableMFA = async () => {
    try {
      const result = await initializeMFA();
      // Handle enrollment flow
    } catch (error) {
      console.error('MFA initialization failed:', error);
    }
  };

  return (
    <div>
      {settings?.mfa_enabled ? (
        <p>MFA is enabled</p>
      ) : (
        <button onClick={handleEnableMFA}>
          Enable MFA
        </button>
      )}
    </div>
  );
}
```

#### 3. Integrate with Auth Service

```tsx
import { useAuth } from '../services/auth.service';

function LoginForm() {
  const { signIn, verifyMFA, requiresMFA, mfaVerified } = useAuth();
  const [showMFA, setShowMFA] = useState(false);

  const handleLogin = async (email: string, password: string) => {
    const result = await signIn({ email, password });
    
    if (result.data && requiresMFA && !mfaVerified) {
      setShowMFA(true);
    }
  };

  const handleMFAVerification = async (code: string) => {
    const result = await verifyMFA(code);
    
    if (result.data) {
      // Login complete
      navigate('/dashboard');
    }
  };

  return (
    <div>
      {showMFA ? (
        <MFAVerification
          userId={user.id}
          onSuccess={() => navigate('/dashboard')}
          onCancel={() => setShowMFA(false)}
        />
      ) : (
        <LoginForm onSubmit={handleLogin} />
      )}
    </div>
  );
}
```

### Advanced Configuration

#### Custom Device Trust Duration

```typescript
// Trust device for 7 days instead of default 30
await mfaService.trustDevice(userId, deviceName, 7 * 24 * 60 * 60 * 1000);
```

#### Force MFA for Specific Routes

```tsx
<MFAProtectedRoute requireMFA={true}>
  <AdminPanel />
</MFAProtectedRoute>
```

#### Custom Rate Limiting

```sql
-- Adjust rate limits in database function
CREATE OR REPLACE FUNCTION check_mfa_rate_limit(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  -- Custom logic for different rate limits per user role
  -- Example: Admins get higher limits
END;
$$;
```

## Security Considerations

### Encryption and Storage

- **TOTP Secrets**: Encrypted using Supabase Vault or AES-256
- **Backup Codes**: Hashed using bcrypt with random salt
- **Device Fingerprints**: Non-reversible hash of device characteristics
- **Audit Logs**: Encrypted sensitive metadata

### Rate Limiting Strategy

```typescript
// Default rate limits
const rateLimits = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
  progressiveDelay: true,
  lockoutDuration: 15 * 60 * 1000 // 15 minutes
};
```

### Device Fingerprinting

The system generates device fingerprints using:

- User agent string
- Screen resolution and color depth
- Timezone and language settings
- Hardware capabilities
- Browser features support
- Platform information

**Privacy Note**: The fingerprinting is designed to be stable yet privacy-conscious, avoiding techniques that could be considered invasive.

### Backup Code Security

- Generated using cryptographically secure random number generator
- Each code is single-use and immediately invalidated
- Codes are hashed with unique salts before storage
- Users can download codes in encrypted format

## Error Handling

The MFA system provides comprehensive error handling:

### Common Error Scenarios

```typescript
try {
  await mfaService.verifyMFALogin(userId, code);
} catch (error) {
  if (error.code === 'RATE_LIMITED') {
    // Show rate limit message with countdown
  } else if (error.code === 'INVALID_CODE') {
    // Show attempts remaining
  } else if (error.code === 'MFA_NOT_ENABLED') {
    // Redirect to setup
  } else {
    // Generic error handling
  }
}
```

### Error Recovery Flows

1. **Rate Limited**: Show countdown timer with retry option
2. **Invalid Code**: Display remaining attempts with help text
3. **Lost Device**: Guide user to backup code usage
4. **Backup Exhausted**: Admin contact information
5. **Network Issues**: Offline state handling

## Testing

### Unit Tests

```bash
npm test src/services/__tests__/mfa.service.test.ts
```

### Integration Tests

```bash
npm run test:e2e -- --grep="MFA"
```

### Security Tests

The implementation includes tests for:

- TOTP generation and verification
- Rate limiting effectiveness  
- Device fingerprinting consistency
- Backup code single-use enforcement
- Session security integration

## Migration Guide

### Enabling MFA for Existing Users

1. **Database Migration**: Run the MFA schema migration
2. **Feature Flag**: Enable MFA in application configuration
3. **User Communication**: Notify users about new security features
4. **Gradual Rollout**: Enable for admin users first, then general users
5. **Monitoring**: Watch for authentication issues and user feedback

### Updating from Previous Versions

If upgrading from a previous authentication system:

```typescript
// Migration helper
async function migrateLegacyUsers() {
  const users = await supabase
    .from('profiles')
    .select('id')
    .is('mfa_enabled', null);

  for (const user of users) {
    await supabase
      .from('mfa_settings')
      .upsert({
        user_id: user.id,
        mfa_enabled: false,
        primary_method: 'totp',
        backup_method: 'email'
      });
  }
}
```

## Performance Optimization

### Caching Strategy

- MFA settings cached in auth service state
- Device trust status cached for session duration
- TOTP secrets retrieved only during verification
- Audit logs written asynchronously

### Database Optimization

```sql
-- Key indexes for performance
CREATE INDEX CONCURRENTLY idx_mfa_settings_user_enabled 
ON mfa_settings(user_id, mfa_enabled);

CREATE INDEX CONCURRENTLY idx_mfa_devices_user_trusted 
ON mfa_devices(user_id, trust_status, trust_expires_at);

CREATE INDEX CONCURRENTLY idx_mfa_attempts_user_time 
ON mfa_verification_attempts(user_id, attempted_at);
```

### Frontend Performance

- Lazy load MFA components
- Preload QR codes during enrollment
- Cache device fingerprints client-side
- Progressive enhancement for advanced features

## Monitoring and Analytics

### Key Metrics to Track

1. **Adoption Rate**: Percentage of users with MFA enabled
2. **Verification Success**: Success rate of MFA verifications
3. **Device Trust**: Average number of trusted devices per user
4. **Recovery Usage**: Frequency of backup code usage
5. **Security Incidents**: Failed verification attempts and patterns

### Alerts and Monitoring

```typescript
// Example monitoring setup
const mfaMetrics = {
  enablementRate: () => /* Calculate percentage */,
  failureRate: () => /* Calculate failure rate */,
  suspiciousActivity: () => /* Detect patterns */,
  systemHealth: () => /* Check component status */
};

// Set up alerts for:
// - High failure rates (> 10%)
// - Rate limiting triggered frequently
// - System component failures
// - Unusual authentication patterns
```

## Compliance and Auditing

### Regulatory Compliance

The MFA implementation supports:

- **SOC 2 Type II**: Comprehensive audit logging
- **GDPR**: User data protection and right to deletion
- **HIPAA**: Healthcare data protection (if applicable)
- **PCI DSS**: Payment card industry standards

### Audit Trail

All MFA events are logged with:

```typescript
interface AuditLogEntry {
  user_id: string;
  event_type: string; // 'mfa_enabled', 'mfa_verified', 'device_trusted', etc.
  method: 'totp' | 'sms' | 'email' | null;
  ip_address: string;
  user_agent: string;
  device_fingerprint: string;
  metadata: Record<string, any>;
  created_at: string;
}
```

## Support and Troubleshooting

### Common Issues

1. **Time Sync Issues**: TOTP codes depend on accurate time
2. **Device Changes**: Browser updates may change fingerprints
3. **Lost Backup Codes**: Admin intervention may be required
4. **Rate Limiting**: Too many failed attempts

### Admin Tools

Administrators can:

- View user MFA status
- Reset MFA for users (with proper authorization)
- Generate emergency bypass codes
- Review security audit logs
- Monitor system health and performance

### User Support Flow

1. **Self-Service**: Guide users through recovery options
2. **Backup Codes**: Direct users to use backup codes
3. **Admin Reset**: Secure process for MFA reset with identity verification
4. **Emergency Access**: Temporary bypass with security review

## Future Enhancements

### Planned Features

- **WebAuthn/FIDO2**: Hardware security key support
- **Biometric Authentication**: Face ID, Touch ID integration
- **Risk-Based Authentication**: Adaptive MFA based on login patterns
- **SMS/Voice Backup**: Alternative delivery methods
- **Admin Dashboard**: Enhanced management interface

### API Extensions

```typescript
// Future API endpoints
interface FutureMFAAPI {
  // Hardware token support
  registerSecurityKey(userId: string, keyData: WebAuthnCredential): Promise<void>;
  verifySecurityKey(userId: string, assertion: PublicKeyCredential): Promise<boolean>;
  
  // Risk-based authentication
  assessLoginRisk(userId: string, context: LoginContext): Promise<RiskScore>;
  adaptMFARequirement(userId: string, riskScore: RiskScore): Promise<MFARequirement>;
  
  // Advanced device management
  analyzeDevicePatterns(userId: string): Promise<DevicePattern[]>;
  detectAnomalousActivity(userId: string): Promise<SecurityAlert[]>;
}
```

## Resources

- [TOTP RFC 6238](https://tools.ietf.org/html/rfc6238)
- [OWASP Authentication Guidelines](https://owasp.org/www-project-authentication/)
- [NIST Digital Identity Guidelines](https://pages.nist.gov/800-63-3/)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)

## Support

For technical support or questions about the MFA implementation:

1. Check the troubleshooting section above
2. Review the test suite for examples
3. Consult the audit logs for debugging
4. Contact the development team for complex issues

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Maintainer**: iPEC Coach Connect Development Team