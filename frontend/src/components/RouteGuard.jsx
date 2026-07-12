import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAccess, PAGE_ACCESS } from '../config/permissions';

const KNOWN_ROLES = Object.keys(
  Object.values(PAGE_ACCESS)[0] ?? {}
);

/**
 * RouteGuard
 * ───────────
 * 1. Not logged in → /login
 * 2. Role not in our config (stale/old session) → logout + /login
 * 3. Role has 'none' access on this page → /restricted
 * 4. Otherwise renders children
 */
export function RouteGuard({ page, children }) {
  const { user, logout } = useAuth();

  // Not authenticated
  if (!user) return <Navigate to="/login" replace />;

  // Role is completely unknown (stale localStorage from a previous version/DB)
  if (!KNOWN_ROLES.includes(user.role)) {
    logout();
    return <Navigate to="/login" replace />;
  }

  const access = getAccess(page, user.role);

  // Role is blocked from this specific route
  if (access === 'none') return <Navigate to="/restricted" replace />;

  return children;
}
