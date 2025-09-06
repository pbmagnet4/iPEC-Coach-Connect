import React from 'react';
import type { LegacyUserRole} from '../stores/unified-user-store';
import { useLegacyRole } from '../stores/unified-user-store';

interface RoleGuardProps {
  children: React.ReactNode;
  roles: LegacyUserRole[];
  fallback?: React.ReactNode;
}

export function RoleGuard({ children, roles, fallback = null }: RoleGuardProps) {
  const { role } = useLegacyRole();

  if (!role || !roles.includes(role)) {
    return fallback;
  }

  return <>{children}</>;
}