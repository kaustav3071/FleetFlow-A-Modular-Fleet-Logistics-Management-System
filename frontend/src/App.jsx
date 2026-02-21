import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
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

function AuthGuard({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1E293B',
              color: '#F1F5F9',
              border: '1px solid #334155',
              borderRadius: '12px',
            },
            success: { iconTheme: { primary: '#F59E0B', secondary: '#0F172A' } },
            error: { iconTheme: { primary: '#EF4444', secondary: '#0F172A' } },
          }}
        />
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
            <Route index element={<DashboardPage />} />
            <Route path="/vehicles" element={
              <ProtectedRoute roles={['manager', 'dispatcher', 'safety_officer']}>
                <VehiclesPage />
              </ProtectedRoute>
            } />
            <Route path="/drivers" element={
              <ProtectedRoute roles={['manager', 'dispatcher', 'safety_officer']}>
                <DriversPage />
              </ProtectedRoute>
            } />
            <Route path="/trips" element={
              <ProtectedRoute roles={['manager', 'dispatcher']}>
                <TripsPage />
              </ProtectedRoute>
            } />
            <Route path="/maintenance" element={
              <ProtectedRoute roles={['manager', 'safety_officer']}>
                <MaintenancePage />
              </ProtectedRoute>
            } />
            <Route path="/expenses" element={
              <ProtectedRoute roles={['manager', 'analyst']}>
                <ExpensesPage />
              </ProtectedRoute>
            } />
            <Route path="/analytics" element={
              <ProtectedRoute roles={['manager', 'analyst', 'safety_officer']}>
                <AnalyticsPage />
              </ProtectedRoute>
            } />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
