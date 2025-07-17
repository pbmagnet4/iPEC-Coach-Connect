import React from 'react';
import { UserRole, useRole } from '../lib/roles';

interface RoleGuardProps {
  children: React.ReactNode;
  roles: UserRole[];
  fallback?: React.ReactNode;
}

export function RoleGuard({ children, roles, fallback = null }: RoleGuardProps) {
  const { role } = useRole();

  if (!role || !roles.includes(role)) {
    return fallback;
  }

  return <>{children}</>;
}