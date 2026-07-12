import { useAuth } from './useAuth';
import type { UserRole } from '@/types/global';

const ROLE_HIERARCHY: Record<UserRole, number> = {
  SUPER_ADMIN: 100,
  ADMIN: 80,
  MANAGER: 60,
  DISPATCHER: 50,
  OPERATOR: 40,
  DRIVER: 20,
  VIEWER: 10,
};

export function usePermissions() {
  const { user } = useAuth();

  const hasPermission = (...permissionNames: string[]): boolean => {
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN') return true;
    return permissionNames.every((p) => user.permissions.includes(p));
  };

  const hasAnyPermission = (...permissionNames: string[]): boolean => {
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN') return true;
    return permissionNames.some((p) => user.permissions.includes(p));
  };

  const hasRole = (...roles: UserRole[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const hasMinRole = (minRole: UserRole): boolean => {
    if (!user) return false;
    return ROLE_HIERARCHY[user.role] >= ROLE_HIERARCHY[minRole];
  };

  const can = (module: string, action: string): boolean => {
    return hasPermission(`${module}:${action}`);
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasRole,
    hasMinRole,
    can,
    permissions: user?.permissions ?? [],
    role: user?.role,
    isSuperAdmin: user?.role === 'SUPER_ADMIN',
    isAdmin: hasMinRole('ADMIN'),
    isManager: hasMinRole('MANAGER'),
  };
}
