/**
 * Permission-Protected Route Component for iPEC Coach Connect
 * 
 * Advanced route protection that combines authentication, MFA verification,
 * and permission-based access control with the enhanced role system.
 * 
 * Features:
 * - Multi-layer security: Auth → MFA → Permissions
 * - Real-time permission checking
 * - Onboarding flow integration
 * - Performance optimization
 * - Comprehensive error handling
 * - Debug mode for development
 */

import React, { memo, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, Loader, Lock, Shield, User } from 'lucide-react';
import { useAuth, useOnboarding, useUserRoles } from '../../stores/unified-user-store';
import type { ExtendedUserRole } from '../../services/enhanced-auth.service';
import { MFAProtectedRoute } from './MFAProtectedRoute';
import type { Permission } from './EnhancedRoleGuard';
import { EnhancedRoleGuard } from './EnhancedRoleGuard';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

// =====================================================================
// TYPES AND INTERFACES
// =====================================================================

export interface PermissionProtectedRouteProps {
  children: React.ReactNode;
  
  // Permission requirements
  requiredPermissions?: Permission[];
  requireAllPermissions?: boolean;
  
  // Role requirements (fallback if permissions not available)
  requiredRoles?: ExtendedUserRole[];
  requireAllRoles?: boolean;
  
  // Route configuration
  redirectTo?: string;
  allowGuestAccess?: boolean;
  requireMFA?: boolean;
  
  // Onboarding integration
  requireOnboardingComplete?: boolean;
  allowedOnboardingStages?: string[];
  onboardingRedirectTo?: string;
  
  // Error handling
  showDetailedErrors?: boolean;
  customErrorComponent?: React.ReactNode;
  
  // Performance and debugging
  debug?: boolean;
  skipCache?: boolean;
  
  // UI customization
  loadingComponent?: React.ReactNode;
  className?: string;
}

interface RouteSecurityStatus {
  isAuthenticated: boolean;
  mfaRequired: boolean;
  mfaVerified: boolean;
  hasPermissions: boolean;
  hasRoles: boolean;
  onboardingComplete: boolean;
  onboardingStageAllowed: boolean;
  overallAccess: boolean;
}

// =====================================================================
// SECURITY STATUS DISPLAY COMPONENT
// =====================================================================

const SecurityStatusDisplay: React.FC<{
  status: RouteSecurityStatus;
  requiredPermissions?: Permission[];
  requiredRoles?: ExtendedUserRole[];
  userRoles: ExtendedUserRole[];
  debug?: boolean;
  onRetry: () => void;
}> = ({ 
  status, 
  requiredPermissions, 
  requiredRoles, 
  userRoles, 
  debug, 
  onRetry 
}) => {
  const getStatusIcon = (passed: boolean) => {
    return passed ? (
      <CheckCircle className="w-5 h-5 text-green-600" />
    ) : (
      <AlertTriangle className="w-5 h-5 text-red-600" />
    );
  };
  
  const getStatusColor = (passed: boolean) => {
    return passed ? 'text-green-600' : 'text-red-600';
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg w-full"
      >
        <Card>
          <Card.Header className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold">Route Security Check</h2>
            <p className="text-gray-600">Verifying access permissions</p>
          </Card.Header>
          
          <Card.Body className="space-y-4">
            {/* Security checks */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                {getStatusIcon(status.isAuthenticated)}
                <span className={getStatusColor(status.isAuthenticated)}>
                  Authentication
                </span>
                {status.isAuthenticated && (
                  <Badge variant="success" size="sm">Verified</Badge>
                )}
              </div>
              
              {status.mfaRequired && (
                <div className="flex items-center gap-3">
                  {getStatusIcon(status.mfaVerified)}
                  <span className={getStatusColor(status.mfaVerified)}>
                    Multi-Factor Authentication
                  </span>
                  {status.mfaVerified && (
                    <Badge variant="success" size="sm">Verified</Badge>
                  )}
                </div>
              )}
              
              {requiredPermissions && requiredPermissions.length > 0 && (
                <div className="flex items-center gap-3">
                  {getStatusIcon(status.hasPermissions)}
                  <span className={getStatusColor(status.hasPermissions)}>
                    Required Permissions ({requiredPermissions.length})
                  </span>
                </div>
              )}
              
              {requiredRoles && requiredRoles.length > 0 && (
                <div className="flex items-center gap-3">
                  {getStatusIcon(status.hasRoles)}
                  <span className={getStatusColor(status.hasRoles)}>
                    Required Roles
                  </span>
                </div>
              )}
              
              <div className="flex items-center gap-3">
                {getStatusIcon(status.onboardingComplete || status.onboardingStageAllowed)}
                <span className={getStatusColor(status.onboardingComplete || status.onboardingStageAllowed)}>
                  Onboarding Status
                </span>
              </div>
            </div>
            
            {/* Detailed requirements */}
            {!status.overallAccess && (
              <div className="border-t pt-4 space-y-3">
                {requiredRoles && requiredRoles.length > 0 && !status.hasRoles && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Required roles:</p>
                    <div className="flex flex-wrap gap-2">
                      {requiredRoles.map((role) => (
                        <Badge 
                          key={role}
                          variant={userRoles.includes(role) ? "success" : "secondary"}
                          size="sm"
                        >
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {requiredPermissions && requiredPermissions.length > 0 && !status.hasPermissions && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Required permissions:</p>
                    <div className="space-y-1">
                      {requiredPermissions.map((permission, index) => (
                        <div key={index} className="text-xs px-2 py-1 bg-gray-100 rounded">
                          {permission.resource}:{permission.action}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Debug information */}
            {debug && (
              <details className="border-t pt-4">
                <summary className="text-sm font-medium text-gray-700 cursor-pointer">
                  Debug Information
                </summary>
                <div className="mt-2 p-3 bg-gray-50 rounded text-xs space-y-2">
                  <div><strong>Current User Roles:</strong> {userRoles.join(', ') || 'None'}</div>
                  <div><strong>Authentication:</strong> {status.isAuthenticated ? 'Yes' : 'No'}</div>
                  <div><strong>MFA Required:</strong> {status.mfaRequired ? 'Yes' : 'No'}</div>
                  <div><strong>MFA Verified:</strong> {status.mfaVerified ? 'Yes' : 'No'}</div>
                  <div><strong>Has Permissions:</strong> {status.hasPermissions ? 'Yes' : 'No'}</div>
                  <div><strong>Has Roles:</strong> {status.hasRoles ? 'Yes' : 'No'}</div>
                  <div><strong>Onboarding Complete:</strong> {status.onboardingComplete ? 'Yes' : 'No'}</div>
                </div>
              </details>
            )}
            
            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => window.history.back()}
                className="flex-1"
              >
                Go Back
              </Button>
              
              <Button
                variant="primary"
                onClick={onRetry}
                className="flex-1"
              >
                Retry Check
              </Button>
            </div>
          </Card.Body>
        </Card>
      </motion.div>
    </div>
  );
};

// =====================================================================
// DEFAULT LOADING COMPONENT
// =====================================================================

const DefaultLoadingComponent: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-center"
    >
      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Loader className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
      <h2 className="text-lg font-medium text-gray-900">Verifying access...</h2>
      <p className="text-gray-600">Checking permissions and security requirements</p>
    </motion.div>
  </div>
);

// =====================================================================
// MAIN COMPONENT
// =====================================================================

export const PermissionProtectedRoute: React.FC<PermissionProtectedRouteProps> = memo(({
  children,
  requiredPermissions = [],
  requireAllPermissions = true,
  requiredRoles = [],
  requireAllRoles = false,
  redirectTo = '/login',
  allowGuestAccess = false,
  requireMFA = false,
  requireOnboardingComplete = false,
  allowedOnboardingStages = [],
  onboardingRedirectTo = '/get-started',
  showDetailedErrors = true,
  customErrorComponent,
  debug = process.env.NODE_ENV === 'development',
  skipCache = false,
  loadingComponent,
  className
}) => {
  const location = useLocation();
  const { 
    isAuthenticated, 
    isLoading: authLoading, 
    requiresMFA, 
    mfaVerified,
    error: authError 
  } = useAuth();
  
  const { 
    checkPermission, 
    hasRole, 
    hasAnyRole,
    hasAllRoles,
    roles: userRoleAssignments 
  } = useUserRoles();
  
  const { 
    isOnboardingComplete, 
    onboardingStage 
  } = useOnboarding();
  
  const [securityStatus, setSecurityStatus] = useState<RouteSecurityStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get active user roles
  const userRoles = userRoleAssignments
    .filter(assignment => assignment.is_active)
    .map(assignment => assignment.role);
  
  // Check all security requirements
  const checkSecurityRequirements = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Wait for auth to complete loading
      if (authLoading) {
        return;
      }
      
      // Check authentication error
      if (authError) {
        setError(authError);
        setIsLoading(false);
        return;
      }
      
      // Allow guest access if configured
      if (!isAuthenticated && allowGuestAccess) {
        setSecurityStatus({
          isAuthenticated: true, // Treat as authenticated for guest access
          mfaRequired: false,
          mfaVerified: true,
          hasPermissions: true,
          hasRoles: true,
          onboardingComplete: true,
          onboardingStageAllowed: true,
          overallAccess: true
        });
        setIsLoading(false);
        return;
      }
      
      // Check authentication
      if (!isAuthenticated) {
        setSecurityStatus({
          isAuthenticated: false,
          mfaRequired: requiresMFA,
          mfaVerified: false,
          hasPermissions: false,
          hasRoles: false,
          onboardingComplete: false,
          onboardingStageAllowed: false,
          overallAccess: false
        });
        setIsLoading(false);
        return;
      }
      
      // Check MFA if required
      const mfaCheck = !requireMFA || !requiresMFA || mfaVerified;
      
      // Check permissions
      let permissionCheck = true;
      if (requiredPermissions.length > 0) {
        if (requireAllPermissions) {
          permissionCheck = requiredPermissions.every(permission =>
            checkPermission(permission.resource, permission.action)
          );
        } else {
          permissionCheck = requiredPermissions.some(permission =>
            checkPermission(permission.resource, permission.action)
          );
        }
      }
      
      // Check roles (fallback if permissions not specified or failed)
      let roleCheck = true;
      if (requiredRoles.length > 0) {
        if (requireAllRoles) {
          roleCheck = hasAllRoles(requiredRoles);
        } else {
          roleCheck = hasAnyRole(requiredRoles);
        }
      }
      
      // Check onboarding requirements
      const onboardingCheck = !requireOnboardingComplete || isOnboardingComplete;
      const stageCheck = allowedOnboardingStages.length === 0 || 
  void allowedOnboardingStages.includes(onboardingStage);
      
      const overallAccess = mfaCheck && 
        (permissionCheck || (requiredPermissions.length === 0 && roleCheck)) && 
        (onboardingCheck || stageCheck);
      
      const status: RouteSecurityStatus = {
        isAuthenticated,
        mfaRequired: requiresMFA,
        mfaVerified,
        hasPermissions: permissionCheck,
        hasRoles: roleCheck,
        onboardingComplete: isOnboardingComplete,
        onboardingStageAllowed: stageCheck,
        overallAccess
      };
      
      setSecurityStatus(status);
      setIsLoading(false);
      
      if (debug) {
        console.log('🔒 PermissionProtectedRoute check:', {
          path: location.pathname,
          requiredPermissions,
          requiredRoles,
          userRoles,
          status,
          overallAccess
        });
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Security check failed';
      setError(errorMessage);
      setIsLoading(false);
      
      if (debug) {
  void console.error('🔒 PermissionProtectedRoute error:', err);
      }
    }
  }, [
    isAuthenticated,
    authLoading,
    authError,
    requiresMFA,
    mfaVerified,
    allowGuestAccess,
    requireMFA,
    requiredPermissions,
    requireAllPermissions,
    requiredRoles,
    requireAllRoles,
    requireOnboardingComplete,
    allowedOnboardingStages,
    isOnboardingComplete,
    onboardingStage,
    userRoles.join(','), // Trigger re-check when roles change
    location.pathname,
    debug,
    checkPermission,
    hasRole,
    hasAnyRole,
    hasAllRoles
  ]);
  
  // Run security check
  useEffect(() => {
    checkSecurityRequirements();
  }, [checkSecurityRequirements]);
  
  // Handle loading state
  if (isLoading) {
    return (
      <AnimatePresence mode="wait">
        {loadingComponent || <DefaultLoadingComponent />}
      </AnimatePresence>
    );
  }
  
  // Handle error state
  if (error) {
    if (customErrorComponent) {
      return <>{customErrorComponent}</>;
    }
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card>
          <Card.Body className="text-center p-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Security Check Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={checkSecurityRequirements}>Retry</Button>
          </Card.Body>
        </Card>
      </div>
    );
  }
  
  // Handle access denied
  if (!securityStatus?.overallAccess) {
    // Redirect to login if not authenticated
    if (!securityStatus?.isAuthenticated && !allowGuestAccess) {
      return (
        <Navigate 
          to={redirectTo}
          state={{ from: location.pathname, reason: 'authentication_required' }}
          replace 
        />
      );
    }
    
    // Redirect to onboarding if required
    if (requireOnboardingComplete && 
        !securityStatus?.onboardingComplete && 
        !securityStatus?.onboardingStageAllowed) {
      return (
        <Navigate 
          to={onboardingRedirectTo}
          state={{ from: location.pathname, reason: 'onboarding_required' }}
          replace 
        />
      );
    }
    
    // Show detailed error if enabled
    if (showDetailedErrors) {
      return (
        <SecurityStatusDisplay
          status={securityStatus!}
          requiredPermissions={requiredPermissions}
          requiredRoles={requiredRoles}
          userRoles={userRoles}
          debug={debug}
          onRetry={checkSecurityRequirements}
        />
      );
    }
    
    // Default access denied
    return (
      <Navigate 
        to={redirectTo}
        state={{ from: location.pathname, reason: 'access_denied' }}
        replace 
      />
    );
  }
  
  // Access granted - wrap with MFA protection if needed
  const content = <div className={className}>{children}</div>;
  
  if (requireMFA || securityStatus.mfaRequired) {
    return (
      <MFAProtectedRoute requireMFA={requireMFA}>
        {content}
      </MFAProtectedRoute>
    );
  }
  
  return content;
});

PermissionProtectedRoute.displayName = 'PermissionProtectedRoute';

// =====================================================================
// CONVENIENCE ROUTE COMPONENTS
// =====================================================================

export const AdminRoute: React.FC<Omit<PermissionProtectedRouteProps, 'requiredPermissions'>> = (props) => (
  <PermissionProtectedRoute 
    {...props} 
    requiredPermissions={[{ resource: 'admin', action: 'manage' }]}
    requireMFA={true}
  />
);

export const CoachRoute: React.FC<Omit<PermissionProtectedRouteProps, 'requiredRoles'>> = (props) => (
  <PermissionProtectedRoute 
    {...props} 
    requiredRoles={['coach']}
    requireOnboardingComplete={true}
  />
);

export const ClientRoute: React.FC<Omit<PermissionProtectedRouteProps, 'requiredRoles'>> = (props) => (
  <PermissionProtectedRoute 
    {...props} 
    requiredRoles={['client', 'coach', 'admin']}
    requireOnboardingComplete={true}
  />
);

export const ModeratorRoute: React.FC<Omit<PermissionProtectedRouteProps, 'requiredPermissions'>> = (props) => (
  <PermissionProtectedRoute 
    {...props} 
    requiredPermissions={[{ resource: 'community', action: 'moderate' }]}
  />
);

export default PermissionProtectedRoute;