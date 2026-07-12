import { useAuth } from '../context/AuthContext';
import { WRITE_PERMISSIONS } from '../config/permissions';

/**
 * useCanWrite(resource, action)
 * ──────────────────────────────
 * Returns true if the current user's role can perform `action` on `resource`.
 * Mirrors the backend's ROLE_PERMISSIONS from seed.js.
 *
 * @example
 *   const canAdd = useCanWrite('vehicle', 'create');
 *   <button disabled={!canAdd}>+ Add Vehicle</button>
 */
export function useCanWrite(resource, action) {
  const { user } = useAuth();
  if (!user?.role) return false;
  const allowed = WRITE_PERMISSIONS[resource]?.[action] ?? [];
  return allowed.includes(user.role);
}
