import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/ui/Toast.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';

import DashboardLayout from './components/layout/DashboardLayout.jsx';
import ProtectedRoute from './components/layout/ProtectedRoute.jsx';

import AuthPage from './pages/AuthPage.jsx';
import VerifyEmailPage from './pages/VerifyEmailPage.jsx';
import DashboardPage from './pages/Dashboard/DashboardPage.jsx';
import VehiclesPage from './pages/Vehicles/VehiclesPage.jsx';
import DriversPage from './pages/Drivers/DriversPage.jsx';
import TripsPage from './pages/Trips/TripsPage.jsx';
import MaintenancePage from './pages/Maintenance/MaintenancePage.jsx';
import ExpensesPage from './pages/Expenses/ExpensesPage.jsx';
import AnalyticsPage from './pages/Analytics/AnalyticsPage.jsx';
import ProfilePage from './pages/Profile/ProfilePage.jsx';
import DriverDashboardPage from './pages/DriverDashboard/DriverDashboardPage.jsx';

function AuthGuard({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) {
    // Redirect drivers to their dashboard
    if (user.role === 'driver') return <Navigate to="/my-trips" replace />;
    return <Navigate to="/" replace />;
  }
  return children;
}

// Redirect drivers from admin dashboard to their own My Trips page
function DashboardRedirect() {
  const { user } = useAuth();
  if (user?.role === 'driver') return <Navigate to="/my-trips" replace />;
  return <DashboardPage />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public */}
            <Route path="/auth" element={<AuthGuard><AuthPage /></AuthGuard>} />
            <Route path="/verify-email/:token" element={<VerifyEmailPage />} />

            {/* Protected - Dashboard Layout */}
            <Route element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              {/* Dashboard — all roles (drivers redirect to /my-trips) */}
              <Route index element={<DashboardRedirect />} />

              {/* Profile & Settings — all roles */}
              <Route path="/profile" element={<ProfilePage />} />

              {/* Driver's My Trips dashboard */}
              <Route path="/my-trips" element={
                <ProtectedRoute roles={['driver']}>
                  <DriverDashboardPage />
                </ProtectedRoute>
              } />

              {/* Vehicles — Manager (full), Dispatcher (view), Safety Officer (view) */}
              <Route path="/vehicles" element={
                <ProtectedRoute roles={['manager', 'dispatcher', 'safety_officer']}>
                  <VehiclesPage />
                </ProtectedRoute>
              } />

              {/* Drivers — Manager (full), Dispatcher (view), Safety Officer (view/edit) */}
              <Route path="/drivers" element={
                <ProtectedRoute roles={['manager', 'dispatcher', 'safety_officer']}>
                  <DriversPage />
                </ProtectedRoute>
              } />

              {/* Trips — Manager (full), Dispatcher (full), Safety Officer (view), Analyst (view) */}
              <Route path="/trips" element={
                <ProtectedRoute roles={['manager', 'dispatcher', 'safety_officer', 'analyst']}>
                  <TripsPage />
                </ProtectedRoute>
              } />

              {/* Maintenance — Manager (full), Dispatcher (view), Safety Officer (view), Analyst (view) */}
              <Route path="/maintenance" element={
                <ProtectedRoute roles={['manager', 'dispatcher', 'safety_officer', 'analyst']}>
                  <MaintenancePage />
                </ProtectedRoute>
              } />

              {/* Expenses — Manager (full), Dispatcher (view), Analyst (view) */}
              <Route path="/expenses" element={
                <ProtectedRoute roles={['manager', 'dispatcher', 'analyst']}>
                  <ExpensesPage />
                </ProtectedRoute>
              } />

              {/* Analytics — Manager (full), Dispatcher (view), Safety Officer (view), Analyst (full) */}
              <Route path="/analytics" element={
                <ProtectedRoute roles={['manager', 'dispatcher', 'safety_officer', 'analyst']}>
                  <AnalyticsPage />
                </ProtectedRoute>
              } />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
