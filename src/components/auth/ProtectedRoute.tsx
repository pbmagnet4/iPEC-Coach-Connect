/**
 * ProtectedRoute Component for iPEC Coach Connect
 * 
 * Provides comprehensive route protection using the enhanced authentication system.
 * Supports multiple protection levels from public access to role-specific restrictions.
 * 
 * Features:
 * - Enhanced authentication integration
 * - Role-based access control with ExtendedUserRole support
 * - Loading states during authentication checks
 * - Automatic redirects to login/unauthorized pages
 * - Support for optional authentication
 * - Onboarding stage protection
 * - Account status validation
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import type { 
  AccountStatus, 
  ExtendedUserRole, 
  OnboardingStage 
} from '../../stores/unified-user-store';
import { 
  useUnifiedUserStore 
} from '../../stores/unified-user-store';
import { LoadingSpinner } from '../ui/LoadingSpinner';

export interface ProtectedRouteProps {
  children: React.ReactNode;
  
  // Authentication requirements
  requiresAuth?: boolean;
  allowAnonymous?: boolean;
  
  // Role-based protection
  allowedRoles?: ExtendedUserRole[];
  blockedRoles?: ExtendedUserRole[];
  
  // Account status requirements
  allowedAccountStatus?: AccountStatus[];
  blockedAccountStatus?: AccountStatus[];
  
  // Onboarding requirements
  requiresOnboardingComplete?: boolean;
  allowedOnboardingStages?: OnboardingStage[];
  blockedOnboardingStages?: OnboardingStage[];
  
  // Permission-based protection
  requiredPermissions?: string[];
  
  // Redirect behavior
  redirectTo?: string;
  redirectToLogin?: boolean;
  redirectToOnboarding?: boolean;
  redirectToUnauthorized?: boolean;
  
  // Fallback content
  fallback?: React.ReactNode;
  unauthorizedFallback?: React.ReactNode;
  loadingFallback?: React.ReactNode;
  
  // Advanced options
  exactRoleMatch?: boolean;
  adminOverride?: boolean;
}

/**
 * ProtectedRoute component that handles authentication and authorization
 * for different types of routes in the application.
 */
export function ProtectedRoute({
  children,
  requiresAuth = true,
  allowAnonymous = false,
  allowedRoles = [],
  blockedRoles = [],
  allowedAccountStatus = ['active'],
  blockedAccountStatus = ['suspended', 'banned', 'deactivated'],
  requiresOnboardingComplete = false,
  allowedOnboardingStages = [],
  blockedOnboardingStages = [],
  requiredPermissions = [],
  redirectTo,
  redirectToLogin = true,
  redirectToOnboarding = false,
  redirectToUnauthorized = false,
  fallback = null,
  unauthorizedFallback = null,
  loadingFallback = <LoadingSpinner />,
  exactRoleMatch = false,
  adminOverride = true,
}: ProtectedRouteProps) {
  const location = useLocation();
  
  // Get authentication state from enhanced store
  const {
    isAuthenticated,
    isLoading,
    userId,
    profile,
    primaryRole,
    roles,
    permissions,
    accountStatus,
    onboardingStage,
    isOnboardingComplete,
    checkPermission,
    hasRole,
    hasAnyRole
  } = useUnifiedUserStore((state) => ({
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    userId: state.userId,
    profile: state.profile,
    primaryRole: state.primaryRole,
    roles: state.roles,
    permissions: state.permissions,
    accountStatus: state.accountStatus,
    onboardingStage: state.onboardingStage,
    isOnboardingComplete: state.isOnboardingComplete,
    checkPermission: state.checkPermission,
    hasRole: state.hasRole,
    hasAnyRole: state.hasAnyRole,
  }));

  // Show loading state while authentication is being determined
  if (isLoading) {
    return <>{loadingFallback}</>;
  }

  // Handle anonymous access
  if (allowAnonymous) {
    return <>{children}</>;
  }

  // Check authentication requirement
  if (requiresAuth && !isAuthenticated) {
    if (redirectToLogin) {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
    if (redirectTo) {
      return <Navigate to={redirectTo} state={{ from: location }} replace />;
    }
    return <>{fallback}</>;
  }

  // If not requiring auth and user is not authenticated, allow access
  if (!requiresAuth && !isAuthenticated) {
    return <>{children}</>;
  }

  // From here on, user must be authenticated
  if (!isAuthenticated || !userId || !profile) {
    if (redirectToLogin) {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
    return <>{fallback}</>;
  }

  // Admin override check (admins can access most routes)
  const isAdmin = adminOverride && hasRole('admin');

  // Check account status
  if (!isAdmin && blockedAccountStatus.includes(accountStatus)) {
    if (redirectToUnauthorized) {
      return <Navigate to="/unauthorized" state={{ reason: 'account_status', status: accountStatus }} replace />;
    }
    return <>{unauthorizedFallback || <div className="p-4 text-red-600">Access denied: Account {accountStatus}</div>}</>;
  }

  if (!isAdmin && allowedAccountStatus.length > 0 && !allowedAccountStatus.includes(accountStatus)) {
    if (redirectToUnauthorized) {
      return <Navigate to="/unauthorized" state={{ reason: 'account_status', status: accountStatus }} replace />;
    }
    return <>{unauthorizedFallback || <div className="p-4 text-red-600">Access denied: Invalid account status</div>}</>;
  }

  // Check onboarding requirements
  if (!isAdmin && requiresOnboardingComplete && !isOnboardingComplete) {
    if (redirectToOnboarding) {
      return <Navigate to="/onboarding" state={{ from: location, stage: onboardingStage }} replace />;
    }
    return <Navigate to="/get-started" state={{ from: location }} replace />;
  }

  if (!isAdmin && blockedOnboardingStages.includes(onboardingStage)) {
    if (redirectToOnboarding) {
      return <Navigate to="/onboarding" state={{ from: location, stage: onboardingStage }} replace />;
    }
    return <>{unauthorizedFallback || <div className="p-4 text-orange-600">Please complete onboarding first</div>}</>;
  }

  if (!isAdmin && allowedOnboardingStages.length > 0 && !allowedOnboardingStages.includes(onboardingStage)) {
    if (redirectToOnboarding) {
      return <Navigate to="/onboarding" state={{ from: location, stage: onboardingStage }} replace />;
    }
    return <>{unauthorizedFallback || <div className="p-4 text-orange-600">Onboarding required</div>}</>;
  }

  // Check role-based access
  if (!isAdmin && blockedRoles.length > 0 && primaryRole && blockedRoles.includes(primaryRole)) {
    if (redirectToUnauthorized) {
      return <Navigate to="/unauthorized" state={{ reason: 'role_blocked', role: primaryRole }} replace />;
    }
    return <>{unauthorizedFallback || <div className="p-4 text-red-600">Access denied: Role not permitted</div>}</>;
  }

  if (!isAdmin && allowedRoles.length > 0) {
    const hasAllowedRole = exactRoleMatch 
      ? primaryRole && allowedRoles.includes(primaryRole)
      : hasAnyRole(allowedRoles);

    if (!hasAllowedRole) {
      if (redirectToUnauthorized) {
        return <Navigate to="/unauthorized" state={{ reason: 'role_required', allowedRoles }} replace />;
      }
      return <>{unauthorizedFallback || <div className="p-4 text-red-600">Access denied: Insufficient permissions</div>}</>;
    }
  }

  // Check permission-based access
  if (!isAdmin && requiredPermissions.length > 0) {
    const hasAllPermissions = requiredPermissions.every(permission => {
      const [resource, action] = permission.split(':');
      return checkPermission(resource, action);
    });

    if (!hasAllPermissions) {
      if (redirectToUnauthorized) {
        return <Navigate to="/unauthorized" state={{ reason: 'permissions', requiredPermissions }} replace />;
      }
      return <>{unauthorizedFallback || <div className="p-4 text-red-600">Access denied: Missing required permissions</div>}</>;
    }
  }

  // All checks passed, render children
  return <>{children}</>;
}

/**
 * Convenience wrapper for public routes that don't require authentication
 */
export function PublicRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute 
      requiresAuth={false} 
      allowAnonymous={true}
    >
      {children}
    </ProtectedRoute>
  );
}

/**
 * Convenience wrapper for authenticated routes
 */
export function AuthenticatedRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiresAuth={true}>
      {children}
    </ProtectedRoute>
  );
}

/**
 * Convenience wrapper for client-only routes
 */
export function ClientRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute 
      requiresAuth={true}
      allowedRoles={['client']}
    >
      {children}
    </ProtectedRoute>
  );
}

/**
 * Convenience wrapper for coach-only routes
 */
export function CoachRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute 
      requiresAuth={true}
      allowedRoles={['coach', 'admin', 'moderator', 'support']}
    >
      {children}
    </ProtectedRoute>
  );
}

/**
 * Convenience wrapper for admin-only routes
 */
export function AdminRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute 
      requiresAuth={true}
      allowedRoles={['admin']}
      exactRoleMatch={true}
    >
      {children}
    </ProtectedRoute>
  );
}

/**
 * Wrapper for routes that require completed onboarding
 */
export function OnboardedRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute 
      requiresAuth={true}
      requiresOnboardingComplete={true}
      redirectToOnboarding={true}
    >
      {children}
    </ProtectedRoute>
  );
}