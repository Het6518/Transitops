import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { PageLoader } from '@/components/common/PageLoader';
import { ROUTES } from '@/lib/constants';
import type { UserRole } from '@/types/global';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Redirect here if not authenticated. Defaults to /login */
  redirectTo?: string;
  /** Require a minimum role level */
  minRole?: UserRole;
  /** Require ALL of these permissions */
  permissions?: string[];
  /** Require ANY of these permissions */
  anyPermissions?: string[];
}

export function ProtectedRoute({
  children,
  redirectTo = ROUTES.LOGIN,
  minRole,
  permissions = [],
  anyPermissions = [],
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const { hasPermission, hasAnyPermission, hasMinRole } = usePermissions();
  const location = useLocation();

  if (isLoading) {
    return <PageLoader message="Verifying session..." />;
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to={redirectTo}
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  if (minRole && !hasMinRole(minRole)) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  if (permissions.length > 0 && !hasPermission(...permissions)) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  if (anyPermissions.length > 0 && !hasAnyPermission(...anyPermissions)) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return <>{children}</>;
}

/** Redirect authenticated users away (e.g., login page) */
export function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <PageLoader />;

  if (isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return <>{children}</>;
}
