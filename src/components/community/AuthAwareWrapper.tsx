/**
 * Authentication Aware Wrapper Component for iPEC Coach Connect
 * 
 * Provides consistent authentication-aware UI patterns across community components.
 * Handles conditional rendering, permission checks, and progressive disclosure.
 * 
 * Features:
 * - Progressive disclosure based on authentication state
 * - Role-based content filtering and action availability
 * - Graceful degradation for non-authenticated users
 * - Consistent loading states and error handling
 * - Mobile-responsive authentication prompts
 */

import React from 'react';
import { useUnifiedUserStore } from '../../stores/unified-user-store';
import type { AuthPromptAction, AuthPromptStyle } from './AuthPrompt';
import { AuthPrompt } from './AuthPrompt';
import { RoleGuard } from '../RoleGuard';
import { LoadingSpinner } from '../ui/LoadingSpinner';

export interface AuthAwareWrapperProps {
  children: React.ReactNode;
  
  /** Content to show for non-authenticated users */
  fallback?: React.ReactNode;
  
  /** Show loading state while checking authentication */
  showLoading?: boolean;
  
  /** Custom loading component */
  loadingComponent?: React.ReactNode;
  
  /** Additional CSS classes */
  className?: string;
}

export interface ConditionalActionProps {
  children: React.ReactNode;
  
  /** Action that requires authentication */
  authAction: AuthPromptAction;
  
  /** Required roles for this action */
  requiredRoles?: string[];
  
  /** Required permissions for this action */
  requiredPermissions?: string[];
  
  /** Style of authentication prompt */
  promptStyle?: AuthPromptStyle;
  
  /** Context for the authentication prompt */
  promptContext?: string;
  
  /** Replace action with prompt instead of showing both */
  replaceWithPrompt?: boolean;
  
  /** Custom prompt message */
  promptMessage?: string;
  
  /** Additional CSS classes for the wrapper */
  className?: string;
}

export interface ProgressiveContentProps {
  /** Content shown to all users */
  publicContent?: React.ReactNode;
  
  /** Additional content shown to authenticated users */
  authenticatedContent?: React.ReactNode;
  
  /** Content shown only to specific roles */
  roleBasedContent?: {
    roles: string[];
    content: React.ReactNode;
  }[];
  
  /** CSS classes */
  className?: string;
}

/**
 * Wrapper component that provides authentication-aware rendering
 */
export function AuthAwareWrapper({
  children,
  fallback,
  showLoading = false,
  loadingComponent = <LoadingSpinner />,
  className = '',
}: AuthAwareWrapperProps) {
  const { isAuthenticated, isLoading } = useUnifiedUserStore(state => ({
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
  }));

  if (showLoading && isLoading) {
    return <div className={className}>{loadingComponent}</div>;
  }

  if (!isAuthenticated && fallback) {
    return <div className={className}>{fallback}</div>;
  }

  return <div className={className}>{children}</div>;
}

/**
 * Component that conditionally renders actions based on authentication state
 */
export function ConditionalAction({
  children,
  authAction,
  requiredRoles = [],
  requiredPermissions = [],
  promptStyle = 'inline',
  promptContext,
  replaceWithPrompt = false,
  promptMessage,
  className = '',
}: ConditionalActionProps) {
  const { 
    isAuthenticated, 
    isLoading, 
    hasRole, 
    hasAnyRole, 
    checkPermission 
  } = useUnifiedUserStore(state => ({
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    hasRole: state.hasRole,
    hasAnyRole: state.hasAnyRole,
    checkPermission: state.checkPermission,
  }));

  // Show loading state
  if (isLoading) {
    return <div className={className}><LoadingSpinner size="sm" /></div>;
  }

  // Check authentication
  if (!isAuthenticated) {
    if (replaceWithPrompt) {
      return (
        <div className={className}>
          <AuthPrompt
            action={authAction}
            style={promptStyle}
            context={promptContext}
            message={promptMessage}
            compact={promptStyle === 'inline'}
          />
        </div>
      );
    } else {
      return (
        <div className={className}>
          {children}
          <AuthPrompt
            action={authAction}
            style={promptStyle}
            context={promptContext}
            message={promptMessage}
            compact={true}
            className="mt-2"
          />
        </div>
      );
    }
  }

  // Check role requirements
  if (requiredRoles.length > 0 && !hasAnyRole(requiredRoles as any)) {
    return null; // Hide action if user doesn't have required role
  }

  // Check permission requirements
  if (requiredPermissions.length > 0) {
    const hasAllPermissions = requiredPermissions.every(permission => {
      const [resource, action] = permission.split(':');
      return checkPermission(resource, action);
    });

    if (!hasAllPermissions) {
      return null; // Hide action if user doesn't have required permissions
    }
  }

  // User is authenticated and has required roles/permissions
  return <div className={className}>{children}</div>;
}

/**
 * Component that progressively discloses content based on authentication state
 */
export function ProgressiveContent({
  publicContent,
  authenticatedContent,
  roleBasedContent = [],
  className = '',
}: ProgressiveContentProps) {
  const { 
    isAuthenticated, 
    isLoading, 
    hasAnyRole 
  } = useUnifiedUserStore(state => ({
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    hasAnyRole: state.hasAnyRole,
  }));

  if (isLoading) {
    return <div className={className}><LoadingSpinner /></div>;
  }

  return (
    <div className={className}>
      {/* Content shown to all users */}
      {publicContent}
      
      {/* Content shown only to authenticated users */}
      {isAuthenticated && authenticatedContent}
      
      {/* Role-based content */}
      {isAuthenticated && roleBasedContent.map((roleContent, index) => (
        <RoleGuard 
          key={index} 
          roles={roleContent.roles as any} 
        >
          {roleContent.content}
        </RoleGuard>
      ))}
    </div>
  );
}

/**
 * Higher-order component that wraps components with authentication awareness
 */
export function withAuthAwareness<T extends object>(
  Component: React.ComponentType<T>,
  options?: {
    showLoadingState?: boolean;
    fallbackComponent?: React.ComponentType;
    requiredRoles?: string[];
  }
) {
  return function AuthAwareComponent(props: T) {
    const { 
      isAuthenticated, 
      isLoading, 
      hasAnyRole 
    } = useUnifiedUserStore(state => ({
      isAuthenticated: state.isAuthenticated,
      isLoading: state.isLoading,
      hasAnyRole: state.hasAnyRole,
    }));

    if (options?.showLoadingState && isLoading) {
      return <LoadingSpinner />;
    }

    if (options?.requiredRoles && isAuthenticated && !hasAnyRole(options.requiredRoles as any)) {
      return null;
    }

    if (!isAuthenticated && options?.fallbackComponent) {
      const FallbackComponent = options.fallbackComponent;
      return <FallbackComponent />;
    }

    return <Component {...props} />;
  };
}

/**
 * Hook for components to check authentication state and permissions
 */
export function useAuthAwareActions() {
  const { 
    isAuthenticated, 
    isLoading,
    primaryRole,
    hasRole,
    hasAnyRole,
    checkPermission 
  } = useUnifiedUserStore(state => ({
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    primaryRole: state.primaryRole,
    hasRole: state.hasRole,
    hasAnyRole: state.hasAnyRole,
    checkPermission: state.checkPermission,
  }));

  const canPerformAction = (
    requiredRoles: string[] = [],
    requiredPermissions: string[] = []
  ): boolean => {
    if (!isAuthenticated) return false;
    
    if (requiredRoles.length > 0 && !hasAnyRole(requiredRoles as any)) {
      return false;
    }
    
    if (requiredPermissions.length > 0) {
      return requiredPermissions.every(permission => {
        const [resource, action] = permission.split(':');
        return checkPermission(resource, action);
      });
    }
    
    return true;
  };

  const getActionPrompt = (action: AuthPromptAction, context?: string) => {
    return (
      <AuthPrompt
        action={action}
        style="inline"
        context={context}
        compact={true}
      />
    );
  };

  return {
    isAuthenticated,
    isLoading,
    primaryRole,
    hasRole,
    hasAnyRole,
    checkPermission,
    canPerformAction,
    getActionPrompt,
  };
}

/**
 * Component for displaying user-specific welcome messages or CTAs
 */
export function AuthAwareBanner({ className }: { className?: string }) {
  const { isAuthenticated, profile } = useUnifiedUserStore(state => ({
    isAuthenticated: state.isAuthenticated,
    profile: state.profile,
  }));

  if (isAuthenticated && profile) {
    return (
      <div className={`bg-brand-50 border border-brand-200 rounded-lg p-4 ${className}`}>
        <p className="text-brand-900">
          Welcome back, <span className="font-semibold">{profile.full_name}</span>! 
          What would you like to explore in the community today?
        </p>
      </div>
    );
  }

  return (
    <AuthPrompt
      action="participate"
      style="banner"
      emphasizeSignUp={true}
      className={className}
    />
  );
}