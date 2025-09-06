# iPEC Coach Connect - Enhanced User State Management System

## Overview

This document describes the comprehensive user state management system implemented for iPEC Coach Connect. The system provides multi-role user management, onboarding tracking, permission-based access control, and unified state management through a modern, type-safe architecture.

## Architecture Components

### 1. Database Schema (`supabase/migrations/20250721000001_enhanced_user_roles_schema.sql`)

Enhanced database schema with:
- **Multi-role support**: Users can have multiple roles (client, coach, admin, moderator, etc.)
- **User state tracking**: Onboarding progress, account status, profile completion
- **Permission system**: Role-based permissions with user-specific overrides
- **Client profiles**: Coaching preferences, goals, and session tracking
- **Coach applications**: Application workflow with approval process
- **Audit trails**: Comprehensive tracking of role assignments and changes

### 2. Enhanced Authentication Service (`src/services/enhanced-auth.service.ts`)

Extends the existing auth service with:
- Multi-role user management
- Onboarding stage tracking
- Client profile management
- Coach application workflow
- Permission checking
- Real-time state synchronization

### 3. Enhanced Role System (`src/lib/enhanced-roles.ts`)

Advanced role management with:
- Role hierarchy and priority system
- Permission-based access control
- Backward compatibility with existing role system
- Utility functions for role checking

### 4. Unified State Store (`src/stores/unified-user-store.ts`)

Comprehensive Zustand-based state management:
- Centralized user state
- Real-time synchronization
- Offline support with sync queue
- Performance optimization
- Type-safe state management

## Key Features

### Multi-Role Support
```typescript
// Users can have multiple active roles
const userRoles = [
  { role: 'client', is_active: true },
  { role: 'pending_coach', is_active: true }
];

// Check specific roles
if (hasRole('coach')) {
  // User is a coach
}

// Check multiple roles
if (hasAnyRole(['admin', 'moderator'])) {
  // User can moderate content
}
```

### Permission-Based Access Control
```typescript
// Check specific permissions
if (checkPermission('sessions', 'create')) {
  // User can create sessions
}

// Resource-based access control
if (canAccessResource('admin', 'manage')) {
  // User has admin access
}
```

### Onboarding Management
```typescript
// Update onboarding progress
await updateOnboardingStage('profile_setup', {
  profileCompleted: true,
  goalsSet: ['leadership', 'work-life-balance']
});

// Check onboarding completion
if (isOnboardingCompleted()) {
  // User has completed onboarding
}
```

### User State Tracking
```typescript
// Profile completion percentage
const completion = getProfileCompletionPercentage(); // 0-100

// Account status
const status = accountStatus; // 'active', 'pending_verification', etc.

// Dashboard metrics
const metrics = {
  profileCompletion: 85,
  totalSessions: 12,
  upcomingSessions: 2,
  completedGoals: 3
};
```

## Usage Examples

### 1. User Authentication Integration

```typescript
import { useAuth } from '../stores/unified-user-store';

function AuthenticatedComponent() {
  const { isAuthenticated, user, isLoading, error } = useAuth();
  
  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) return <LoginPrompt />;
  if (error) return <ErrorMessage error={error} />;
  
  return <Dashboard user={user} />;
}
```

### 2. Role-Based Component Rendering

```typescript
import { useUserRoles } from '../stores/unified-user-store';

function NavigationMenu() {
  const { hasRole, hasAnyRole, checkPermission } = useUserRoles();
  
  return (
    <nav>
      <Link to="/dashboard">Dashboard</Link>
      
      {hasRole('client') && (
        <Link to="/find-coaches">Find Coaches</Link>
      )}
      
      {hasRole('coach') && (
        <Link to="/my-clients">My Clients</Link>
      )}
      
      {hasAnyRole(['admin', 'moderator']) && (
        <Link to="/moderation">Moderation</Link>
      )}
      
      {checkPermission('admin', 'manage') && (
        <Link to="/admin">Admin Panel</Link>
      )}
    </nav>
  );
}
```

### 3. Onboarding Flow

```typescript
import { useOnboarding } from '../stores/unified-user-store';

function OnboardingFlow() {
  const { 
    onboardingStage, 
    profileCompletion,
    updateOnboardingStage,
    completeOnboarding 
  } = useOnboarding();
  
  const handleStageComplete = async (stage: OnboardingStage, data?: any) => {
    await updateOnboardingStage(stage, data);
  };
  
  switch (onboardingStage) {
    case 'not_started':
      return <WelcomeScreen onNext={() => handleStageComplete('profile_setup')} />;
    
    case 'profile_setup':
      return <ProfileSetup onComplete={(data) => handleStageComplete('role_selection', data)} />;
    
    case 'role_selection':
      return <RoleSelection onComplete={(role) => handleStageComplete('verification', { selectedRole: role })} />;
    
    case 'completed':
      return <Redirect to="/dashboard" />;
    
    default:
      return <OnboardingStep stage={onboardingStage} onComplete={handleStageComplete} />;
  }
}
```

### 4. Client Profile Management

```typescript
import { useClientProfile } from '../stores/unified-user-store';

function ClientProfileForm() {
  const { 
    clientProfile, 
    updateClientProfile,
    setCoachingGoals,
    updateCoachingPreferences 
  } = useClientProfile();
  
  const handleGoalsUpdate = async (goals: string[]) => {
    await setCoachingGoals(goals);
  };
  
  const handlePreferencesUpdate = async (preferences: any) => {
    await updateCoachingPreferences(preferences);
  };
  
  return (
    <form>
      <GoalsSelector 
        goals={clientProfile?.coaching_goals || []}
        onChange={handleGoalsUpdate}
      />
      
      <PreferencesForm 
        preferences={clientProfile}
        onChange={handlePreferencesUpdate}
      />
    </form>
  );
}
```

### 5. Coach Application Process

```typescript
import { useCoachApplication } from '../stores/unified-user-store';

function CoachApplicationForm() {
  const { 
    coachApplication, 
    submitCoachApplication,
    updateCoachApplication 
  } = useCoachApplication();
  
  const handleSubmit = async (applicationData: any) => {
    try {
      await submitCoachApplication(applicationData);
      // Application submitted successfully
    } catch (error) {
      // Handle error
    }
  };
  
  return (
    <ApplicationForm 
      application={coachApplication}
      onSubmit={handleSubmit}
    />
  );
}
```

## Migration Guide

### For Existing Components

1. **Replace existing auth hooks**:
```typescript
// Before
import { useAuth } from '../lib/auth';

// After
import { useAuth } from '../stores/unified-user-store';
```

2. **Update role checking**:
```typescript
// Before
import { useRole, isCoach } from '../lib/roles';
const { role } = useRole();
const showCoachFeatures = isCoach(role);

// After
import { useUserRoles } from '../stores/unified-user-store';
const { hasRole } = useUserRoles();
const showCoachFeatures = hasRole('coach');
```

3. **Add permission checking**:
```typescript
// New capability
import { useUserRoles } from '../stores/unified-user-store';
const { checkPermission } = useUserRoles();

// Replace manual role checks with permission checks
const canCreateSessions = checkPermission('sessions', 'create');
const canModerateContent = checkPermission('community', 'moderate');
```

### Database Migration

Run the database migration to set up the new schema:
```bash
# Run the enhanced schema migration
supabase db reset
# or
supabase migration up
```

### Component Updates

Update components to use the new role and permission system:

1. **Navigation Component** (`src/components/Navigation.tsx`):
   - Replace `RoleGuard` components with permission-based checks
   - Use `checkPermission` instead of role-based conditionals

2. **Dashboard Component** (`src/pages/Dashboard.tsx`):
   - Integrate with unified user store for dashboard metrics
   - Use real user data instead of mock data

3. **Route Protection**:
   - Enhance `MFAProtectedRoute` with permission checking
   - Create new `PermissionProtectedRoute` component

## Performance Considerations

### State Management Optimization
- **Selective subscriptions**: Only subscribe to needed state slices
- **Memoization**: Use React.memo and useMemo for expensive operations
- **Batch updates**: Group related state changes together
- **Real-time efficiency**: Only sync critical state changes in real-time

### Database Optimization
- **Indexes**: All frequently queried fields are indexed
- **Row-level security**: Efficient policies for data access control
- **Query optimization**: Use specific field selection and joins
- **Caching**: Implement client-side caching for static data

### Memory Management
- **Cleanup subscriptions**: Proper cleanup of real-time subscriptions
- **Cache invalidation**: Intelligent cache invalidation strategies
- **State normalization**: Normalized state structure to prevent duplication

## Security Considerations

### Authentication Security
- **Session management**: Secure session handling with expiration
- **MFA integration**: Multi-factor authentication support
- **Rate limiting**: Protection against brute force attacks
- **CSRF protection**: Cross-site request forgery protection

### Authorization Security
- **Permission-based access**: Fine-grained permission system
- **Role hierarchy**: Proper role hierarchy and inheritance
- **Audit logging**: Comprehensive audit trail for role changes
- **Data privacy**: User data protection and privacy compliance

### Database Security
- **Row-level security**: Database-level access control
- **Encrypted data**: Sensitive data encryption at rest
- **SQL injection protection**: Parameterized queries and validation
- **Backup security**: Secure backup and recovery procedures

## Testing Strategy

### Unit Tests
- Auth service functions
- Role and permission checking
- State management actions
- Utility functions

### Integration Tests
- Database operations
- Real-time synchronization
- Error handling
- Performance metrics

### E2E Tests
- Complete user journeys
- Role-based workflows
- Onboarding processes
- Permission enforcement

## Monitoring and Analytics

### Performance Monitoring
- State update frequency
- Database query performance
- Real-time subscription health
- Memory usage patterns

### User Analytics
- Onboarding completion rates
- Feature usage by role
- Permission access patterns
- User journey analysis

### Error Tracking
- Authentication failures
- Permission denials
- State synchronization errors
- Database operation failures

## Future Enhancements

### Planned Features
- **Advanced role templates**: Predefined role configurations
- **Dynamic permissions**: Runtime permission modifications
- **Role scheduling**: Time-based role assignments
- **Bulk operations**: Batch role and permission management

### Integration Opportunities
- **External identity providers**: SAML, LDAP integration
- **Analytics platforms**: Advanced user behavior tracking
- **Communication systems**: Notification and messaging integration
- **Audit systems**: Enterprise audit and compliance tools

## Support and Troubleshooting

### Common Issues

1. **Migration failures**: Check database schema compatibility
2. **Permission errors**: Verify role assignments and permissions
3. **State sync issues**: Check real-time subscription status
4. **Performance problems**: Review query optimization and caching

### Debug Tools
- Redux DevTools integration for state inspection
- Console logging with security-safe output
- Performance profiling hooks
- Database query analysis tools

### Getting Help
- Check the troubleshooting section in this document
- Review error logs and console output
- Test with simplified scenarios to isolate issues
- Contact the development team for complex problems