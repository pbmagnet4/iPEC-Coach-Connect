/**
 * Enhanced Role Guard Component for iPEC Coach Connect
 * 
 * Advanced route and content protection with multi-role support, 
 * permission-based access control, and comprehensive fallback options.
 * 
 * Features:
 * - Multi-role checking with AND/OR logic
 * - Permission-based access control
 * - Loading states and error handling
 * - Fallback components for unauthorized access
 * - Debug mode for development
 * - Performance optimization with memoization
 * - Integration with unified user store
 */

import React, { memo, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, Loader, Lock, Shield, User } from 'lucide-react';
import { useAuth, useUserRoles } from '../../stores/unified-user-store';
import type { ExtendedUserRole } from '../../services/enhanced-auth.service';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

// =====================================================================
// TYPES AND INTERFACES
// =====================================================================

export interface Permission {
  resource: string;
  action: string;
}

export interface RoleRequirement {
  roles: ExtendedUserRole[];
  requireAll?: boolean; // true = AND logic, false = OR logic (default)
}

export interface PermissionRequirement {
  permissions: Permission[];
  requireAll?: boolean; // true = AND logic, false = OR logic (default)
}

export interface EnhancedRoleGuardProps {
  children: React.ReactNode;
  
  // Role-based access
  roles?: ExtendedUserRole[];
  requireAllRoles?: boolean;
  
  // Permission-based access
  permissions?: Permission[];
  requireAllPermissions?: boolean;
  
  // Advanced requirements
  roleRequirements?: RoleRequirement[];
  permissionRequirements?: PermissionRequirement[];
  
  // Custom access logic
  customCheck?: (userState: any) => boolean;
  
  // Fallback options
  fallback?: React.ReactNode;
  redirectTo?: string;
  showAccessDenied?: boolean;
  
  // Loading and error states
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  
  // Development and debugging
  debug?: boolean;
  debugLabel?: string;
  
  // Performance optimization
  skipAuthCheck?: boolean;
  
  // UI customization
  className?: string;
}

interface AccessDeniedProps {
  roles?: ExtendedUserRole[];
  permissions?: Permission[];
  userRoles: ExtendedUserRole[];
  userPermissions: string[];
  debug?: boolean;
  debugLabel?: string;
  onRetry?: () => void;
}

// =====================================================================
// ACCESS DENIED COMPONENT
// =====================================================================

const AccessDenied: React.FC<AccessDeniedProps> = ({
  roles,
  permissions,
  userRoles,
  userPermissions,
  debug,
  debugLabel,
  onRetry
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="max-w-md w-full"
      >
        <Card className="text-center">
          <Card.Body className="p-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-red-600" />
            </div>
            
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Access Denied
            </h2>
            
            <p className="text-gray-600 mb-6">
              You don't have the required permissions to access this content.
            </p>
            
            {/* Required roles display */}
            {roles && roles.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Required roles:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {roles.map((role) => (
                    <Badge 
                      key={role} 
                      variant={userRoles.includes(role) ? "success" : "secondary"}
                    >
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {/* Required permissions display */}
            {permissions && permissions.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Required permissions:</p>
                <div className="space-y-1">
                  {permissions.map((permission, index) => {
                    const permissionKey = `${permission.resource}:${permission.action}`;
                    const hasPermission = userPermissions.includes(permissionKey);
                    
                    return (
                      <div 
                        key={index}
                        className={`text-xs px-2 py-1 rounded ${
                          hasPermission 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {permission.resource}:{permission.action}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Debug information */}
            {debug && (
              <details className="mb-4 text-left">
                <summary className="text-sm font-medium text-gray-700 cursor-pointer">
                  Debug Info {debugLabel && `(${debugLabel})`}
                </summary>
                <div className="mt-2 p-3 bg-gray-100 rounded text-xs space-y-2">
                  <div>
                    <strong>User Roles:</strong> {userRoles.join(', ') || 'None'}
                  </div>
                  <div>
                    <strong>User Permissions:</strong> {userPermissions.length} permissions
                  </div>
                  <div>
                    <strong>Required Roles:</strong> {roles?.join(', ') || 'None'}
                  </div>
                  <div>
                    <strong>Required Permissions:</strong> {permissions?.length || 0} permissions
                  </div>
                </div>
              </details>
            )}
            
            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                onClick={() => window.history.back()}
                className="flex-1"
              >
                Go Back
              </Button>
              
              {onRetry && (
                <Button
                  variant="primary"
                  onClick={onRetry}
                  className="flex-1"
                >
                  Retry
                </Button>
              )}
            </div>
          </Card.Body>
        </Card>
      </motion.div>
    </div>
  );
};

// =====================================================================
// LOADING COMPONENT
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
      <h2 className="text-lg font-medium text-gray-900">Checking permissions...</h2>
      <p className="text-gray-600">Please wait while we verify your access</p>
    </motion.div>
  </div>
);

// =====================================================================
// ACCESS LOGIC FUNCTIONS
// =====================================================================

const checkRoleAccess = (
  userRoles: ExtendedUserRole[],
  requiredRoles: ExtendedUserRole[],
  requireAll = false
): boolean => {
  if (!requiredRoles.length) return true;
  
  if (requireAll) {
    return requiredRoles.every(role => userRoles.includes(role));
  } else {
    return requiredRoles.some(role => userRoles.includes(role));
  }
};

const checkPermissionAccess = (
  checkPermissionFn: (resource: string, action: string) => boolean,
  requiredPermissions: Permission[],
  requireAll = false
): boolean => {
  if (!requiredPermissions.length) return true;
  
  if (requireAll) {
    return requiredPermissions.every(permission => 
      checkPermissionFn(permission.resource, permission.action)
    );
  } else {
    return requiredPermissions.some(permission => 
      checkPermissionFn(permission.resource, permission.action)
    );
  }
};

const checkAdvancedRequirements = (
  userRoles: ExtendedUserRole[],
  checkPermissionFn: (resource: string, action: string) => boolean,
  roleRequirements?: RoleRequirement[],
  permissionRequirements?: PermissionRequirement[]
): boolean => {
  // Check role requirements
  if (roleRequirements && roleRequirements.length > 0) {
    const roleResults = roleRequirements.map(req =>
      checkRoleAccess(userRoles, req.roles, req.requireAll)
    );
    
    // All role requirements must pass
    if (!roleResults.every(result => result)) {
      return false;
    }
  }
  
  // Check permission requirements
  if (permissionRequirements && permissionRequirements.length > 0) {
    const permissionResults = permissionRequirements.map(req =>
      checkPermissionAccess(checkPermissionFn, req.permissions, req.requireAll)
    );
    
    // All permission requirements must pass
    if (!permissionResults.every(result => result)) {
      return false;
    }
  }
  
  return true;
};

// =====================================================================
// MAIN COMPONENT
// =====================================================================

export const EnhancedRoleGuard: React.FC<EnhancedRoleGuardProps> = memo(({
  children,
  roles = [],
  requireAllRoles = false,
  permissions = [],
  requireAllPermissions = false,
  roleRequirements,
  permissionRequirements,
  customCheck,
  fallback = null,
  redirectTo,
  showAccessDenied = true,
  loadingComponent,
  errorComponent,
  debug = process.env.NODE_ENV === 'development',
  debugLabel,
  skipAuthCheck = false,
  className
}) => {
  const location = useLocation();
  const { isAuthenticated, isLoading: authLoading, error: authError } = useAuth();
  const { 
    roles: userRoles, 
    checkPermission, 
    permissions: userPermissions,
    hasRole,
    hasAnyRole 
  } = useUserRoles();
  
  const [accessGranted, setAccessGranted] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get active user roles as strings
  const activeUserRoles = userRoles
    .filter(role => role.is_active)
    .map(role => role.role);
  
  // Check access permissions
  useEffect(() => {
    const checkAccess = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Skip auth check if explicitly requested
        if (skipAuthCheck) {
          setAccessGranted(true);
          setIsLoading(false);
          return;
        }
        
        // Wait for authentication to complete
        if (authLoading) {
          return; // Still loading, wait
        }
        
        // Check authentication error
        if (authError) {
          setError(authError);
          setAccessGranted(false);
          setIsLoading(false);
          return;
        }
        
        // Check if user is authenticated
        if (!isAuthenticated) {
          setAccessGranted(false);
          setIsLoading(false);
          return;
        }
        
        // Custom check takes precedence
        if (customCheck) {
          const customResult = customCheck({ 
            userRoles: activeUserRoles, 
            permissions: userPermissions,
            checkPermission,
            hasRole,
            hasAnyRole
          });
          setAccessGranted(customResult);
          setIsLoading(false);
          return;
        }
        
        // Check basic role requirements
        const hasRequiredRoles = checkRoleAccess(activeUserRoles, roles, requireAllRoles);
        
        // Check basic permission requirements
        const hasRequiredPermissions = checkPermissionAccess(
          checkPermission, 
          permissions, 
          requireAllPermissions
        );
        
        // Check advanced requirements
        const hasAdvancedAccess = checkAdvancedRequirements(
          activeUserRoles,
          checkPermission,
          roleRequirements,
          permissionRequirements
        );
        
        // Grant access if all checks pass
        const finalAccessDecision = hasRequiredRoles && hasRequiredPermissions && hasAdvancedAccess;
        
        if (debug) {
          console.log(`🛡️ EnhancedRoleGuard ${debugLabel ? `(${debugLabel})` : ''}:`, {
            location: location.pathname,
            userRoles: activeUserRoles,
            requiredRoles: roles,
            requireAllRoles,
            hasRequiredRoles,
            requiredPermissions: permissions,
            requireAllPermissions,
            hasRequiredPermissions,
            hasAdvancedAccess,
            finalAccessDecision,
            userPermissionsCount: userPermissions.length
          });
        }
        
        setAccessGranted(finalAccessDecision);
        setIsLoading(false);
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Access check failed';
        setError(errorMessage);
        setAccessGranted(false);
        setIsLoading(false);
        
        if (debug) {
  void console.error('🛡️ EnhancedRoleGuard error:', err);
        }
      }
    };
    
    checkAccess();
  }, [
    isAuthenticated,
    authLoading,
    authError,
    activeUserRoles.join(','), // Trigger re-check when roles change
    userPermissions.join(','), // Trigger re-check when permissions change
    JSON.stringify(roles),
    JSON.stringify(permissions),
    JSON.stringify(roleRequirements),
    JSON.stringify(permissionRequirements),
    customCheck,
    requireAllRoles,
    requireAllPermissions,
    skipAuthCheck,
    location.pathname,
    debug,
    debugLabel
  ]);
  
  // Handle loading state
  if (isLoading) {
    return (
      <AnimatePresence mode="wait">
        {loadingComponent || <DefaultLoadingComponent />}
      </AnimatePresence>
    );
  }
  
  // Handle error state
  if (error && errorComponent) {
    return (
      <AnimatePresence mode="wait">
        {errorComponent}
      </AnimatePresence>
    );
  }
  
  // Handle access denied
  if (accessGranted === false) {
    // Redirect if specified
    if (redirectTo) {
      return (
        <Navigate 
          to={redirectTo} 
          state={{ from: location.pathname, reason: 'access_denied' }}
          replace 
        />
      );
    }
    
    // Show custom fallback if provided
    if (fallback) {
      return <>{fallback}</>;
    }
    
    // Show access denied screen if enabled
    if (showAccessDenied) {
      return (
        <AccessDenied
          roles={roles}
          permissions={permissions}
          userRoles={activeUserRoles}
          userPermissions={userPermissions}
          debug={debug}
          debugLabel={debugLabel}
          onRetry={() => {
            setIsLoading(true);
            setAccessGranted(null);
          }}
        />
      );
    }
    
    // Return null if no fallback options
    return null;
  }
  
  // Access granted - render children
  return (
    <div className={className}>
      <AnimatePresence mode="wait">
        {children}
      </AnimatePresence>
    </div>
  );
});

EnhancedRoleGuard.displayName = 'EnhancedRoleGuard';

// =====================================================================
// CONVENIENCE COMPONENTS
// =====================================================================

// Role-specific guards for common use cases
export const AdminGuard: React.FC<Omit<EnhancedRoleGuardProps, 'roles'>> = (props) => (
  <EnhancedRoleGuard {...props} roles={['admin']} debugLabel="AdminGuard" />
);

export const CoachGuard: React.FC<Omit<EnhancedRoleGuardProps, 'roles'>> = (props) => (
  <EnhancedRoleGuard {...props} roles={['coach']} debugLabel="CoachGuard" />
);

export const ClientGuard: React.FC<Omit<EnhancedRoleGuardProps, 'roles'>> = (props) => (
  <EnhancedRoleGuard {...props} roles={['client']} debugLabel="ClientGuard" />
);

export const ModeratorGuard: React.FC<Omit<EnhancedRoleGuardProps, 'roles'>> = (props) => (
  <EnhancedRoleGuard {...props} roles={['admin', 'moderator']} debugLabel="ModeratorGuard" />
);

// Permission-specific guards
export const SessionCreateGuard: React.FC<Omit<EnhancedRoleGuardProps, 'permissions'>> = (props) => (
  <EnhancedRoleGuard 
    {...props} 
    permissions={[{ resource: 'sessions', action: 'create' }]} 
    debugLabel="SessionCreateGuard" 
  />
);

export const AdminPanelGuard: React.FC<Omit<EnhancedRoleGuardProps, 'permissions'>> = (props) => (
  <EnhancedRoleGuard 
    {...props} 
    permissions={[{ resource: 'admin', action: 'manage' }]} 
    debugLabel="AdminPanelGuard" 
  />
);

// Higher-order component for wrapping components with role protection
export const withRoleGuard = <P extends object>(
  Component: React.ComponentType<P>,
  guardProps: Omit<EnhancedRoleGuardProps, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <EnhancedRoleGuard {...guardProps}>
      <Component {...props} />
    </EnhancedRoleGuard>
  );
  
  WrappedComponent.displayName = `withRoleGuard(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

export default EnhancedRoleGuard;