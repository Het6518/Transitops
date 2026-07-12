/**
 * src/config/permissions.js
 * ─────────────────────────
 * SINGLE SOURCE OF TRUTH for all frontend access control.
 *
 * Key facts about the backend:
 *  - Role names in DB: FLEET_MANAGER | DRIVER | SAFETY_OFFICER | FINANCIAL_ANALYST
 *  - JWT carries: { userId, roleId (UUID), email } — NOT the role name string
 *  - Role name string comes from login response body: user.role
 *  - Backend enforces permissions via resource:action pairs, not role names directly
 *
 * "DRIVER" in the backend is the person who dispatches trips (not just a vehicle driver).
 * The UI displays this role as "Dispatcher" (see ROLE_DISPLAY_NAME below).
 */

// ─── Display labels ──────────────────────────────────────────────────────────
export const ROLE_DISPLAY_NAME = {
  FLEET_MANAGER:     'Fleet Manager',
  DRIVER:            'Dispatcher',        // backend enum is DRIVER; UI label is Dispatcher
  SAFETY_OFFICER:    'Safety Officer',
  FINANCIAL_ANALYST: 'Financial Analyst',
};

// ─── Route-level access ───────────────────────────────────────────────────────
// 'full'  → role can view AND use all write actions on this page
// 'view'  → route loads, but Add/Edit/Delete/Dispatch buttons are hidden inside the page
// 'none'  → route is blocked; RouteGuard redirects to /restricted
//
// Derived from backend seed.js ROLE_PERMISSIONS (ground truth):
//   FLEET_MANAGER  → all vehicle/driver/maintenance CRUD + trip:read + fuel/expense + dashboard + reports
//   DRIVER         → trip CRUD + dispatch/complete/cancel + fuel/expense + NO dashboard:read
//   SAFETY_OFFICER → vehicle:read + driver full + trip:read + maintenance:read + dashboard + reports
//   FINANCIAL_ANALYST → vehicle/driver/trip/maintenance/fuelLog/expense:read + dashboard + reports
export const PAGE_ACCESS = {
  //              FLEET_MANAGER   DRIVER    SAFETY_OFFICER  FINANCIAL_ANALYST
  dashboard:    { FLEET_MANAGER: 'full',   DRIVER: 'none', SAFETY_OFFICER: 'full',  FINANCIAL_ANALYST: 'full'  },
  // DRIVER has no dashboard:read in backend — would get 403; block route entirely
  fleet:        { FLEET_MANAGER: 'full',   DRIVER: 'none', SAFETY_OFFICER: 'view',  FINANCIAL_ANALYST: 'view'  },
  drivers:      { FLEET_MANAGER: 'full',   DRIVER: 'none', SAFETY_OFFICER: 'full',  FINANCIAL_ANALYST: 'view'  },
  trips:        { FLEET_MANAGER: 'view',   DRIVER: 'full', SAFETY_OFFICER: 'view',  FINANCIAL_ANALYST: 'view'  },
  maintenance:  { FLEET_MANAGER: 'full',   DRIVER: 'none', SAFETY_OFFICER: 'view',  FINANCIAL_ANALYST: 'view'  },
  fuelExpenses: { FLEET_MANAGER: 'full',   DRIVER: 'full', SAFETY_OFFICER: 'none',  FINANCIAL_ANALYST: 'view'  },
  analytics:    { FLEET_MANAGER: 'full',   DRIVER: 'none', SAFETY_OFFICER: 'full',  FINANCIAL_ANALYST: 'full'  },
  settings:     { FLEET_MANAGER: 'full',   DRIVER: 'none', SAFETY_OFFICER: 'none',  FINANCIAL_ANALYST: 'none'  },
  organization: { FLEET_MANAGER: 'full',   DRIVER: 'none', SAFETY_OFFICER: 'full',  FINANCIAL_ANALYST: 'full'  },
};

// ─── Write-button gating inside pages ────────────────────────────────────────
// Used by useCanWrite(resource, action) to hide/disable specific write controls.
// Mirrors backend ROLE_PERMISSIONS in seed.js exactly.
export const WRITE_PERMISSIONS = {
  vehicle:     { create: ['FLEET_MANAGER'], update: ['FLEET_MANAGER'], delete: ['FLEET_MANAGER'] },
  driver:      {
    create: ['FLEET_MANAGER', 'SAFETY_OFFICER'],
    update: ['FLEET_MANAGER', 'SAFETY_OFFICER'],
    delete: ['FLEET_MANAGER', 'SAFETY_OFFICER'],
  },
  trip:        {
    create:   ['DRIVER'],
    dispatch: ['DRIVER'],
    complete: ['DRIVER'],
    cancel:   ['DRIVER'],
  },
  maintenance: {
    create: ['FLEET_MANAGER'],
    update: ['FLEET_MANAGER'],
    delete: ['FLEET_MANAGER'],
  },
  fuelLog:     {
    create: ['FLEET_MANAGER', 'DRIVER'],
    update: ['FLEET_MANAGER', 'DRIVER'],
    delete: ['FLEET_MANAGER', 'DRIVER'],
  },
  expense:     {
    create: ['FLEET_MANAGER', 'DRIVER'],
    update: ['FLEET_MANAGER', 'DRIVER'],
    delete: ['FLEET_MANAGER', 'DRIVER'],
  },
  report:      {
    create: ['FLEET_MANAGER', 'FINANCIAL_ANALYST'],  // CSV export
  },
};

// ─── Sidebar nav items (ordered) ─────────────────────────────────────────────
// page key must match PAGE_ACCESS keys above
export const NAV_ITEMS = [
  { page: 'dashboard',    label: 'Dashboard',         path: '/dashboard',    icon: 'grid' },
  { page: 'fleet',        label: 'Fleet',             path: '/fleet',        icon: 'truck' },
  { page: 'drivers',      label: 'Drivers',           path: '/drivers',      icon: 'users' },
  { page: 'trips',        label: 'Trips',             path: '/trips',        icon: 'map' },
  { page: 'maintenance',  label: 'Maintenance',       path: '/maintenance',  icon: 'tool' },
  { page: 'fuelExpenses', label: 'Fuel & Expenses',   path: '/fuel-expenses',icon: 'droplet' },
  { page: 'analytics',    label: 'Analytics',         path: '/analytics',    icon: 'bar-chart' },
  { page: 'organization', label: 'Organization',      path: '/organization', icon: 'users' },
  { page: 'settings',     label: 'Settings',          path: '/settings',     icon: 'settings' },
];

// Helper — returns 'full' | 'view' | 'none' for a given page and role
export function getAccess(page, role) {
  return PAGE_ACCESS[page]?.[role] ?? 'none';
}
