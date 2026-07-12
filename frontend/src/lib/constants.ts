export const APP_NAME = 'TransitOps';
export const APP_VERSION = import.meta.env.VITE_APP_VERSION ?? '1.0.0';
export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api/v1';

// Storage keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'transitops_access_token',
  REFRESH_TOKEN: 'transitops_refresh_token',
  USER: 'transitops_user',
  THEME: 'transitops_theme',
  SIDEBAR_COLLAPSED: 'transitops_sidebar_collapsed',
} as const;

// Query keys (centralized to avoid typos)
export const QUERY_KEYS = {
  AUTH: {
    PROFILE: ['auth', 'profile'],
  },
  FLEET: {
    LIST: (params?: Record<string, unknown>) => ['fleet', 'list', params],
    DETAIL: (id: string) => ['fleet', 'detail', id],
  },
  ROUTES: {
    LIST: (params?: Record<string, unknown>) => ['routes', 'list', params],
    DETAIL: (id: string) => ['routes', 'detail', id],
  },
  DRIVERS: {
    LIST: (params?: Record<string, unknown>) => ['drivers', 'list', params],
    DETAIL: (id: string) => ['drivers', 'detail', id],
  },
  TRIPS: {
    LIST: (params?: Record<string, unknown>) => ['trips', 'list', params],
    DETAIL: (id: string) => ['trips', 'detail', id],
  },
  MAINTENANCE: {
    LIST: (params?: Record<string, unknown>) => ['maintenance', 'list', params],
  },
  FUEL: {
    LIST: (params?: Record<string, unknown>) => ['fuel', 'list', params],
  },
  REPORTS: {
    DASHBOARD: ['reports', 'dashboard'],
  },
} as const;

// User roles
export const USER_ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  DISPATCHER: 'DISPATCHER',
  OPERATOR: 'OPERATOR',
  DRIVER: 'DRIVER',
  VIEWER: 'VIEWER',
} as const;

// Pagination
export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

// Date formats
export const DATE_FORMAT = 'MMM dd, yyyy';
export const DATETIME_FORMAT = 'MMM dd, yyyy HH:mm';

// Navigation routes
export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/',
  FLEET: '/fleet',
  ROUTES_PAGE: '/routes',
  DRIVERS: '/drivers',
  TRIPS: '/trips',
  MAINTENANCE: '/maintenance',
  FUEL: '/fuel',
  FINANCE: '/finance',
  REPORTS: '/reports',
  SETTINGS: '/settings',
  USERS: '/users',
  PROFILE: '/profile',
} as const;
