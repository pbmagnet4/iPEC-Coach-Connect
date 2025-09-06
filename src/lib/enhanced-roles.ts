/**
 * Enhanced Role Management System for iPEC Coach Connect
 * 
 * Extends the existing role system with multi-role support, permission-based 
 * access control, and integration with the enhanced authentication service.
 * 
 * Features:
 * - Backward compatibility with existing role system
 * - Multi-role support per user
 * - Permission-based access control
 * - Role hierarchy and priority system
 * - Integration with enhanced auth service
 * - Zustand-based state management with persistence
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ExtendedUserRole, UserRoleAssignment } from '../services/enhanced-auth.service';
import { enhancedAuthService } from '../services/enhanced-auth.service';
import type { LegacyUserRole } from '../stores/unified-user-store';
import { useLegacyRole } from '../stores/unified-user-store'; // Import from unified store for compatibility

// Extended role type that includes all possible roles
export type { ExtendedUserRole } from '../services/enhanced-auth.service';

// Permission-based access control
export interface Permission {
  resource: string;
  action: string;
  conditions?: Record<string, any>;
}

export interface RoleDefinition {
  role: ExtendedUserRole;
  displayName: string;
  description: string;
  permissions: Permission[];
  hierarchy: number; // Higher number = higher priority
  canAssignRoles?: ExtendedUserRole[];
  maxDurationDays?: number; // Optional role expiration
}

// Enhanced role state interface
export interface EnhancedRoleState {
  // Current user's roles
  userRoles: UserRoleAssignment[];
  primaryRole: ExtendedUserRole | null;
  
  // Permission tracking
  permissions: string[];
  permissionOverrides: Record<string, boolean>;
  
  // Role management functions
  setUserRoles: (roles: UserRoleAssignment[]) => void;
  setPrimaryRole: (role: ExtendedUserRole | null) => void;
  setPermissions: (permissions: string[]) => void;
  
  // Permission checking functions
  hasRole: (role: ExtendedUserRole) => boolean;
  hasAnyRole: (roles: ExtendedUserRole[]) => boolean;
  hasAllRoles: (roles: ExtendedUserRole[]) => boolean;
  hasPermission: (resource: string, action: string) => boolean;
  canAccessResource: (resource: string, action: string) => boolean;
  
  // Utility functions
  getActiveRoles: () => ExtendedUserRole[];
  getRoleHierarchy: () => number;
  isRoleActive: (role: ExtendedUserRole) => boolean;
  
  // Backward compatibility
  legacyRole: LegacyUserRole;
  setLegacyRole: (role: LegacyUserRole) => void;
}

// Role definitions with hierarchy and permissions
export const ROLE_DEFINITIONS: RoleDefinition[] = [
  {
    role: 'admin',
    displayName: 'Administrator',
    description: 'Full system access and user management',
    hierarchy: 100,
    permissions: [
      { resource: '*', action: '*' }, // Full access
    ],
    canAssignRoles: ['admin', 'moderator', 'support', 'coach', 'client', 'suspended'],
  },
  {
    role: 'moderator',
    displayName: 'Community Moderator',
    description: 'Community management and content moderation',
    hierarchy: 80,
    permissions: [
      { resource: 'community', action: 'moderate' },
      { resource: 'community', action: 'delete' },
      { resource: 'community', action: 'read' },
      { resource: 'profiles', action: 'read' },
      { resource: 'users', action: 'read' },
    ],
    canAssignRoles: ['client'],
  },
  {
    role: 'support',
    displayName: 'Customer Support',
    description: 'Customer support and assistance',
    hierarchy: 70,
    permissions: [
      { resource: 'profiles', action: 'read' },
      { resource: 'sessions', action: 'read' },
      { resource: 'users', action: 'read' },
      { resource: 'support', action: 'manage' },
    ],
  },
  {
    role: 'coach',
    displayName: 'Certified Coach',
    description: 'iPEC certified coaching professional',
    hierarchy: 60,
    permissions: [
      { resource: 'profiles', action: 'read' },
      { resource: 'profiles', action: 'update' },
      { resource: 'sessions', action: 'create' },
      { resource: 'sessions', action: 'read' },
      { resource: 'sessions', action: 'update' },
      { resource: 'sessions', action: 'delete' },
      { resource: 'coaches', action: 'read' },
      { resource: 'coaches', action: 'update' },
      { resource: 'clients', action: 'read' },
      { resource: 'community', action: 'read' },
      { resource: 'community', action: 'create' },
      { resource: 'community', action: 'moderate' },
      { resource: 'learning', action: 'read' },
      { resource: 'learning', action: 'create' },
      { resource: 'notifications', action: 'read' },
    ],
  },
  {
    role: 'pending_coach',
    displayName: 'Pending Coach Approval',
    description: 'Coach application submitted, awaiting approval',
    hierarchy: 40,
    permissions: [
      { resource: 'profiles', action: 'read' },
      { resource: 'profiles', action: 'update' },
      { resource: 'coaches', action: 'read' },
      { resource: 'community', action: 'read' },
      { resource: 'learning', action: 'read' },
    ],
    maxDurationDays: 30, // Auto-expire after 30 days
  },
  {
    role: 'client',
    displayName: 'Client',
    description: 'Coaching client seeking services',
    hierarchy: 50,
    permissions: [
      { resource: 'profiles', action: 'read' },
      { resource: 'profiles', action: 'update' },
      { resource: 'sessions', action: 'create' },
      { resource: 'sessions', action: 'read' },
      { resource: 'sessions', action: 'update' },
      { resource: 'coaches', action: 'read' },
      { resource: 'community', action: 'read' },
      { resource: 'community', action: 'create' },
      { resource: 'learning', action: 'read' },
      { resource: 'notifications', action: 'read' },
    ],
  },
  {
    role: 'suspended',
    displayName: 'Suspended User',
    description: 'User account temporarily suspended',
    hierarchy: 10,
    permissions: [
      // Very limited permissions
      { resource: 'profiles', action: 'read' },
    ],
    maxDurationDays: 90, // Auto-expire after 90 days
  },
];

// Create enhanced role store
export const useEnhancedRole = create<EnhancedRoleState>()(
  persist(
    (set, get) => ({
      // State
      userRoles: [],
      primaryRole: null,
      permissions: [],
      permissionOverrides: {},
      legacyRole: null,

      // Setters
      setUserRoles: (roles: UserRoleAssignment[]) => {
        const primaryRole = determinePrimaryRole(roles);
        const permissions = calculatePermissions(roles);
        const legacyRole = mapToLegacyRole(primaryRole);
        
        set({ 
          userRoles: roles, 
          primaryRole,
          permissions,
          legacyRole
        });
        
        // Sync with legacy role store for backward compatibility
        useLegacyRole.getState().setRole(legacyRole);
      },

      setPrimaryRole: (role: ExtendedUserRole | null) => {
        const legacyRole = mapToLegacyRole(role);
        set({ primaryRole: role, legacyRole });
        useLegacyRole.getState().setRole(legacyRole);
      },

      setPermissions: (permissions: string[]) => set({ permissions }),

      setLegacyRole: (role: LegacyUserRole) => {
        set({ legacyRole: role });
        useLegacyRole.getState().setRole(role);
      },

      // Role checking functions
      hasRole: (role: ExtendedUserRole) => {
        const { userRoles } = get();
        return userRoles.some(r => r.role === role && r.is_active);
      },

      hasAnyRole: (roles: ExtendedUserRole[]) => {
        const { userRoles } = get();
        return userRoles.some(r => r.is_active && roles.includes(r.role));
      },

      hasAllRoles: (roles: ExtendedUserRole[]) => {
        const { userRoles } = get();
        const activeRoles = userRoles.filter(r => r.is_active).map(r => r.role);
        return roles.every(role => activeRoles.includes(role));
      },

      hasPermission: (resource: string, action: string) => {
        const { permissions, permissionOverrides } = get();
        const permissionKey = `${resource}:${action}`;
        
        // Check permission overrides first
        if (permissionKey in permissionOverrides) {
          return permissionOverrides[permissionKey];
        }
        
        // Check wildcard admin permissions
        if (permissions.includes('*:*')) {
          return true;
        }
        
        // Check specific permission
        if (permissions.includes(permissionKey)) {
          return true;
        }
        
        // Check resource wildcard
        if (permissions.includes(`${resource}:*`)) {
          return true;
        }
        
        return false;
      },

      canAccessResource: (resource: string, action: string) => {
        return get().hasPermission(resource, action);
      },

      // Utility functions
      getActiveRoles: () => {
        const { userRoles } = get();
        return userRoles.filter(r => r.is_active).map(r => r.role);
      },

      getRoleHierarchy: () => {
        const { primaryRole } = get();
        if (!primaryRole) return 0;
        
        const roleDef = ROLE_DEFINITIONS.find(def => def.role === primaryRole);
        return roleDef?.hierarchy || 0;
      },

      isRoleActive: (role: ExtendedUserRole) => {
        const { userRoles } = get();
        const roleAssignment = userRoles.find(r => r.role === role);
        if (!roleAssignment) return false;
        
        // Check if role is active
        if (!roleAssignment.is_active) return false;
        
        // Check if role has expired
        if (roleAssignment.expires_at) {
          const expirationDate = new Date(roleAssignment.expires_at);
          if (expirationDate < new Date()) return false;
        }
        
        return true;
      },
    }),
    {
      name: 'enhanced-role-storage',
      partialize: (state) => ({
        userRoles: state.userRoles,
        primaryRole: state.primaryRole,
        permissions: state.permissions,
        permissionOverrides: state.permissionOverrides,
        legacyRole: state.legacyRole,
      }),
    }
  )
);

// Helper function to determine primary role based on hierarchy
function determinePrimaryRole(roles: UserRoleAssignment[]): ExtendedUserRole | null {
  if (!roles.length) return null;

  const activeRoles = roles.filter(r => r.is_active);
  if (!activeRoles.length) return null;

  // Find highest hierarchy role
  let highestRole: ExtendedUserRole | null = null;
  let highestHierarchy = -1;

  for (const roleAssignment of activeRoles) {
    const roleDef = ROLE_DEFINITIONS.find(def => def.role === roleAssignment.role);
    if (roleDef && roleDef.hierarchy > highestHierarchy) {
      highestHierarchy = roleDef.hierarchy;
      highestRole = roleAssignment.role;
    }
  }

  return highestRole;
}

// Helper function to calculate permissions from roles
function calculatePermissions(roles: UserRoleAssignment[]): string[] {
  const permissions = new Set<string>();

  for (const roleAssignment of roles) {
    if (!roleAssignment.is_active) continue;

    const roleDef = ROLE_DEFINITIONS.find(def => def.role === roleAssignment.role);
    if (!roleDef) continue;

    for (const permission of roleDef.permissions) {
      permissions.add(`${permission.resource}:${permission.action}`);
    }
  }

  return Array.from(permissions);
}

// Helper function to map extended roles to legacy roles for backward compatibility
function mapToLegacyRole(extendedRole: ExtendedUserRole | null): LegacyUserRole {
  if (!extendedRole) return null;
  
  switch (extendedRole) {
    case 'coach':
    case 'pending_coach':
      return 'coach';
    case 'client':
    case 'admin':
    case 'moderator':
    case 'support':
    case 'suspended':
    default:
      return 'client';
  }
}

// Initialize enhanced role system with auth service integration
let enhancedAuthSubscription: (() => void) | null = null;

const initializeEnhancedRoles = () => {
  enhancedAuthSubscription = enhancedAuthService.onEnhancedStateChange((authState) => {
    const enhancedRoleState = useEnhancedRole.getState();
    
    // Update roles from auth state
    if (authState.userRoles !== enhancedRoleState.userRoles) {
      enhancedRoleState.setUserRoles(authState.userRoles);
    }
    
    // Update permissions from auth state
    if (authState.permissions !== enhancedRoleState.permissions) {
      enhancedRoleState.setPermissions(authState.permissions);
    }
  });
};

// Initialize on module load
initializeEnhancedRoles();

// Cleanup function
export const destroyEnhancedRoles = () => {
  if (enhancedAuthSubscription) {
    enhancedAuthSubscription();
    enhancedAuthSubscription = null;
  }
};

// Utility functions for role management
export const getRoleDefinition = (role: ExtendedUserRole): RoleDefinition | undefined => {
  return ROLE_DEFINITIONS.find(def => def.role === role);
};

export const getRoleDisplayName = (role: ExtendedUserRole): string => {
  const roleDef = getRoleDefinition(role);
  return roleDef?.displayName || role;
};

export const getRoleDescription = (role: ExtendedUserRole): string => {
  const roleDef = getRoleDefinition(role);
  return roleDef?.description || '';
};

export const canAssignRole = (currentUserRole: ExtendedUserRole, targetRole: ExtendedUserRole): boolean => {
  const roleDef = getRoleDefinition(currentUserRole);
  return roleDef?.canAssignRoles?.includes(targetRole) || false;
};

export const getRoleHierarchy = (role: ExtendedUserRole): number => {
  const roleDef = getRoleDefinition(role);
  return roleDef?.hierarchy || 0;
};

export const isRoleExpired = (roleAssignment: UserRoleAssignment): boolean => {
  if (!roleAssignment.expires_at) return false;
  return new Date(roleAssignment.expires_at) < new Date();
};

// Backward compatibility functions - maintain existing API
export const isCoach = (role: LegacyUserRole | ExtendedUserRole | null): boolean => {
  if (!role) return false;
  return ['coach', 'pending_coach'].includes(role as ExtendedUserRole);
};

export const isClient = (role: LegacyUserRole | ExtendedUserRole | null): boolean => {
  if (!role) return false;
  return role === 'client';
};

export const isAdmin = (role: ExtendedUserRole | null): boolean => {
  if (!role) return false;
  return role === 'admin';
};

export const isModerator = (role: ExtendedUserRole | null): boolean => {
  if (!role) return false;
  return ['admin', 'moderator'].includes(role);
};

export const isSupport = (role: ExtendedUserRole | null): boolean => {
  if (!role) return false;
  return ['admin', 'support'].includes(role);
};

export const isSuspended = (role: ExtendedUserRole | null): boolean => {
  if (!role) return false;
  return role === 'suspended';
};

// Enhanced permission checking functions
export const hasResourceAccess = (resource: string, action: string): boolean => {
  return useEnhancedRole.getState().hasPermission(resource, action);
};

export const hasAnyPermission = (permissions: { resource: string; action: string }[]): boolean => {
  const state = useEnhancedRole.getState();
  return permissions.some(({ resource, action }) => state.hasPermission(resource, action));
};

export const hasAllPermissions = (permissions: { resource: string; action: string }[]): boolean => {
  const state = useEnhancedRole.getState();
  return permissions.every(({ resource, action }) => state.hasPermission(resource, action));
};

// React hook for convenient access to enhanced role functionality
export const useEnhancedRoleSystem = () => {
  const state = useEnhancedRole();
  
  return {
    ...state,
    // Convenience functions
    isCoach: isCoach(state.primaryRole),
    isClient: isClient(state.primaryRole),
    isAdmin: isAdmin(state.primaryRole),
    isModerator: isModerator(state.primaryRole),
    isSupport: isSupport(state.primaryRole),
    isSuspended: isSuspended(state.primaryRole),
    
    // Role utilities
    getRoleDisplayName: (role: ExtendedUserRole) => getRoleDisplayName(role),
    getRoleDescription: (role: ExtendedUserRole) => getRoleDescription(role),
    canAssignRole: (targetRole: ExtendedUserRole) => 
      state.primaryRole ? canAssignRole(state.primaryRole, targetRole) : false,
  };
};

// Default export for convenience
export default useEnhancedRole;