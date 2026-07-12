import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import type { UserRole } from '@/types/global';

interface PermissionGuardProps {
  children: React.ReactNode;
  /** Require ALL of these permissions */
  permissions?: string[];
  /** Require ANY of these permissions */
  anyPermissions?: string[];
  /** Require a minimum role level */
  minRole?: UserRole;
  /** Optional fallback component if access is denied */
  fallback?: React.ReactNode;
}

export function PermissionGuard({
  children,
  permissions = [],
  anyPermissions = [],
  minRole,
  fallback = null,
}: PermissionGuardProps) {
  const { hasPermission, hasAnyPermission, hasMinRole } = usePermissions();

  if (minRole && !hasMinRole(minRole)) {
    return <>{fallback}</>;
  }

  if (permissions.length > 0 && !hasPermission(...permissions)) {
    return <>{fallback}</>;
  }

  if (anyPermissions.length > 0 && !hasAnyPermission(...anyPermissions)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
