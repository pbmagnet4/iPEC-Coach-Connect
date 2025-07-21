# CSRF Protection Usage Guide
## iPEC Coach Connect - Developer Implementation Guide

### Quick Start

The enhanced CSRF protection system provides multiple layers of security for OAuth flows, form submissions, and general operations. Here's how to implement it in your components.

### 1. OAuth Integration (Already Implemented)

The OAuth flow already includes enhanced CSRF protection with state parameter validation:

```typescript
// In auth service - already implemented
const state = generateOAuthState('/dashboard');
const { error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`,
    queryParams: { state }
  }
});
```

### 2. Form CSRF Protection

#### Using React Hook (Recommended)

```typescript
import { useFormCSRFProtection } from '../lib/hooks/useCSRFProtection';

function ProfileForm() {
  const { token, isLoading, error, validateToken, consumeToken } = useFormCSRFProtection('profile-form');
  
  const handleSubmit = async (formData) => {
    // Validate token before submission
    const isValid = await validateToken();
    if (!isValid) {
      setError('Security validation failed. Please refresh the page.');
      return;
    }
    
    // Submit form with token
    const response = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        _csrf: token
      })
    });
    
    if (response.ok) {
      // Consume token after successful submission
      await consumeToken();
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input type="hidden" name="_csrf" value={token} />
      {/* Your form fields */}
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Processing...' : 'Submit'}
      </button>
      {error && <div className="error">{error}</div>}
    </form>
  );
}
```

#### Manual Implementation

```typescript
import { generateFormCSRFToken, validateFormCSRFToken } from '../lib/csrf-protection';

// Generate token for form
const csrfToken = generateFormCSRFToken('contact-form');

// Validate token before processing
const validation = validateFormCSRFToken(csrfToken, 'contact-form');
if (!validation.valid) {
  throw new Error('CSRF validation failed');
}
```

### 3. General CSRF Protection

For non-form operations like API calls:

```typescript
import { useCSRFProtection } from '../lib/hooks/useCSRFProtection';

function ApiComponent() {
  const { token, generateToken, validateToken, consumeToken } = useCSRFProtection({
    purpose: 'api-call',
    autoGenerate: true,
    includeNonce: true
  });
  
  const handleApiCall = async () => {
    // Validate token before API call
    const isValid = await validateToken();
    if (!isValid) {
      setError('Security validation failed');
      return;
    }
    
    // Make API call with token
    const response = await fetch('/api/sensitive-operation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': token
      },
      body: JSON.stringify({ data: 'sensitive' })
    });
    
    if (response.ok) {
      // Consume token after successful operation
      await consumeToken();
    }
  };
  
  return (
    <button onClick={handleApiCall}>
      Perform Sensitive Operation
    </button>
  );
}
```

### 4. Server-Side Validation

For server-side validation (backend implementation):

```typescript
// Example Express.js middleware
function validateCSRFToken(req, res, next) {
  const token = req.body._csrf || req.headers['x-csrf-token'];
  const formId = req.body._formId || 'general';
  
  if (!token) {
    return res.status(403).json({ error: 'CSRF token missing' });
  }
  
  // Validate token (implement server-side validation)
  const isValid = validateTokenServerSide(token, formId);
  if (!isValid) {
    return res.status(403).json({ error: 'CSRF token invalid' });
  }
  
  next();
}
```

### 5. Error Handling

The system provides comprehensive error handling:

```typescript
const { error } = useFormCSRFProtection('my-form');

// Handle different error types
if (error) {
  switch (error) {
    case 'Token expired':
      // Automatically refresh token
      refreshToken();
      break;
    case 'Token not found':
      // Generate new token
      generateToken();
      break;
    case 'Origin mismatch':
      // Security violation - log and reload
      console.warn('Security violation detected');
      window.location.reload();
      break;
    default:
      // Generic error handling
      setErrorMessage('Security validation failed. Please try again.');
  }
}
```

### 6. Configuration Options

#### Hook Options

```typescript
const csrfOptions = {
  purpose: 'specific-operation',     // Token purpose
  formId: 'unique-form-id',          // Form identifier
  autoGenerate: true,                // Auto-generate on mount
  includeNonce: true,                // Include nonce for extra security
  includeUserAgent: true,            // Bind to user agent
  customExpiry: 30 * 60 * 1000      // Custom expiry time (30 minutes)
};
```

#### Security Features

```typescript
// Enhanced OAuth state generation
const state = generateOAuthState('/redirect-url'); // Validates redirect URL

// Form token with extended expiry
const formToken = generateFormCSRFToken('form-id', 60 * 60 * 1000); // 1 hour

// Token with all security features
const secureToken = generateCSRFToken('secure-op', 15 * 60 * 1000, {
  includeNonce: true,
  includeUserAgent: true,
  sessionId: getCurrentSessionId()
});
```

### 7. Best Practices

#### Do's:
- ✅ Always validate tokens before processing sensitive operations
- ✅ Use form-specific tokens for form submissions
- ✅ Implement proper error handling with user-friendly messages
- ✅ Use React hooks for consistent implementation
- ✅ Monitor CSRF token usage for suspicious activity

#### Don'ts:
- ❌ Don't skip token validation for "internal" operations
- ❌ Don't reuse tokens across different forms
- ❌ Don't expose tokens in URLs or logs
- ❌ Don't ignore token validation failures
- ❌ Don't implement custom token generation

### 8. Testing

Test your CSRF implementation:

```typescript
// Test token generation
const token = generateFormCSRFToken('test-form');
expect(token).toBeTruthy();

// Test token validation
const validation = validateFormCSRFToken(token, 'test-form');
expect(validation.valid).toBe(true);

// Test token consumption
const consumption = consumeFormCSRFToken(token, 'test-form');
expect(consumption.valid).toBe(true);

// Test token is consumed (single use)
const secondValidation = validateFormCSRFToken(token, 'test-form');
expect(secondValidation.valid).toBe(false);
```

### 9. Troubleshooting

#### Common Issues:

**"Token not found" errors:**
- Ensure token is generated before validation
- Check that token is properly stored in state
- Verify token hasn't expired

**"Origin mismatch" errors:**
- Check that the request is coming from the correct domain
- Verify window.location.origin matches token origin
- Ensure no cross-origin attacks

**"Form ID mismatch" errors:**
- Verify form ID matches between generation and validation
- Check for typos in form ID strings
- Ensure form ID is unique per form

### 10. Security Monitoring

Monitor these events for security analysis:

```typescript
// Log CSRF events
logSecurity('CSRF token validation failed', 'high', {
  reason: 'Token expired',
  formId: 'contact-form',
  userAgent: navigator.userAgent
});
```

### Support

For questions or issues with CSRF protection:
1. Check the comprehensive test suite for examples
2. Review the security analysis document
3. Monitor security logs for detailed error information
4. Contact the security team for complex scenarios

---

**Implementation Status:** Ready for Production
**Last Updated:** July 18, 2025