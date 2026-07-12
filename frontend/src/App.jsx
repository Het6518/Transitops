import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/ToastProvider';
import { RouteGuard } from './components/RouteGuard';

// Pages
import LoginPage      from './pages/LoginPage';
import RestrictedPage from './pages/RestrictedPage';
import DashboardPage  from './pages/DashboardPage';
import FleetPage      from './pages/FleetPage';
import DriversPage    from './pages/DriversPage';
import TripsPage      from './pages/TripsPage';
import MaintenancePage   from './pages/MaintenancePage';
import FuelExpensesPage  from './pages/FuelExpensesPage';
import AnalyticsPage     from './pages/AnalyticsPage';
import SettingsPage      from './pages/SettingsPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />

            {/* Blocked-access page — no role guard wrapping it (a DRIVER landing here should see it) */}
            <Route path="/restricted" element={<RestrictedPage />} />

            {/* Protected — each wrapped in RouteGuard with the page key matching PAGE_ACCESS */}
            <Route path="/dashboard"     element={<RouteGuard page="dashboard">    <DashboardPage />    </RouteGuard>} />
            <Route path="/fleet"         element={<RouteGuard page="fleet">         <FleetPage />         </RouteGuard>} />
            <Route path="/drivers"       element={<RouteGuard page="drivers">       <DriversPage />       </RouteGuard>} />
            <Route path="/trips"         element={<RouteGuard page="trips">         <TripsPage />         </RouteGuard>} />
            <Route path="/maintenance"   element={<RouteGuard page="maintenance">   <MaintenancePage />   </RouteGuard>} />
            <Route path="/fuel-expenses" element={<RouteGuard page="fuelExpenses">  <FuelExpensesPage />  </RouteGuard>} />
            <Route path="/analytics"     element={<RouteGuard page="analytics">     <AnalyticsPage />     </RouteGuard>} />
            <Route path="/settings"      element={<RouteGuard page="settings">      <SettingsPage />      </RouteGuard>} />

            {/* Catch-all — send to login (RouteGuard redirects after auth) */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
