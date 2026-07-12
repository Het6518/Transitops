import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute, PublicRoute } from '@/components/guards/ProtectedRoute';
import { PageLoader } from '@/components/common/PageLoader';
import { ROUTES } from '@/lib/constants';

// ── Lazy-loaded pages ─────────────────────────────────────────────────────────
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'));
const ForgotPasswordPage = lazy(() => import('@/features/auth/pages/ForgotPasswordPage'));
const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage'));
const FleetPage = lazy(() => import('@/features/fleet/pages/FleetPage'));
const DriversPage = lazy(() => import('@/features/drivers/pages/DriversPage'));
const TripsPage = lazy(() => import('@/features/trips/pages/TripsPage'));
const MaintenancePage = lazy(() => import('@/features/maintenance/pages/MaintenancePage'));
const FuelPage = lazy(() => import('@/features/fuel/pages/FuelPage'));
const ExpensesPage = lazy(() => import('@/features/expenses/pages/ExpensesPage'));
const UnauthorizedPage = lazy(() => import('@/components/common/UnauthorizedPage'));

// Placeholder pages for modules not yet built
function ComingSoon({ module }: { module: string }) {
  return (
    <div className="page-wrapper">
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <span className="text-2xl">🚧</span>
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold">{module}</h2>
          <p className="text-muted-foreground text-sm mt-1">This module is coming in the next phase.</p>
        </div>
      </div>
    </div>
  );
}

// ── Router ────────────────────────────────────────────────────────────────────
const router = createBrowserRouter([
  // Public routes
  {
    path: ROUTES.LOGIN,
    element: (
      <PublicRoute>
        <Suspense fallback={<PageLoader />}>
          <LoginPage />
        </Suspense>
      </PublicRoute>
    ),
  },
  {
    path: '/forgot-password',
    element: (
      <Suspense fallback={<PageLoader />}>
        <ForgotPasswordPage />
      </Suspense>
    ),
  },
  {
    path: '/unauthorized',
    element: (
      <Suspense fallback={<PageLoader />}>
        <UnauthorizedPage />
      </Suspense>
    ),
  },

  // Protected app shell
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<PageLoader />}>
            <DashboardPage />
          </Suspense>
        ),
      },
      {
        path: ROUTES.FLEET,
        element: (
          <Suspense fallback={<PageLoader />}>
            <FleetPage />
          </Suspense>
        ),
      },
      { path: ROUTES.ROUTES_PAGE, element: <ComingSoon module="Route Management" /> },
      {
        path: ROUTES.DRIVERS,
        element: (
          <Suspense fallback={<PageLoader />}>
            <DriversPage />
          </Suspense>
        ),
      },
      {
        path: ROUTES.TRIPS,
        element: (
          <Suspense fallback={<PageLoader />}>
            <TripsPage />
          </Suspense>
        ),
      },
      {
        path: ROUTES.MAINTENANCE,
        element: (
          <Suspense fallback={<PageLoader />}>
            <MaintenancePage />
          </Suspense>
        ),
      },
      {
        path: ROUTES.FUEL,
        element: (
          <Suspense fallback={<PageLoader />}>
            <FuelPage />
          </Suspense>
        ),
      },
      {
        path: ROUTES.FINANCE,
        element: (
          <Suspense fallback={<PageLoader />}>
            <ExpensesPage />
          </Suspense>
        ),
      },
      { path: ROUTES.REPORTS, element: <ComingSoon module="Reports & Analytics" /> },
      { path: ROUTES.USERS, element: <ComingSoon module="User Management" /> },
      { path: ROUTES.SETTINGS, element: <ComingSoon module="Settings" /> },
      { path: ROUTES.PROFILE, element: <ComingSoon module="Profile" /> },
    ],
  },

  // 404
  {
    path: '*',
    element: (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <h1 className="text-6xl font-bold text-muted-foreground/20">404</h1>
          <p className="text-muted-foreground">Page not found</p>
          <a href="/" className="text-primary hover:underline text-sm">Go to Dashboard</a>
        </div>
      </div>
    ),
  },
]);

export function Router() {
  return <RouterProvider router={router} />;
}
