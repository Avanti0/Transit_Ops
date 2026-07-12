import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { ProtectedRoute } from './ProtectedRoute';

// ─── Lazy page imports ────────────────────────────────────────────────────────
// Pages will be created separately. Lazy imports are defined here so the router
// compiles; they resolve at runtime when the user navigates to each route.

const LoginPage = React.lazy(() => import('../pages/LoginPage'));
const DashboardPage = React.lazy(() => import('../pages/DashboardPage'));
const VehiclesPage = React.lazy(() => import('../pages/VehiclesPage'));
const DriversPage = React.lazy(() => import('../pages/DriversPage'));
const TripsPage = React.lazy(() => import('../pages/TripsPage'));
const MaintenancePage = React.lazy(() => import('../pages/MaintenancePage'));
const FuelPage = React.lazy(() => import('../pages/FuelPage'));
const ExpensesPage = React.lazy(() => import('../pages/ExpensesPage'));
const ReportsPage = React.lazy(() => import('../pages/ReportsPage'));
const AnalyticsPage = React.lazy(() => import('../pages/AnalyticsPage'));

// ─── Fallback spinner ─────────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </div>
  );
}

// ─── Router ───────────────────────────────────────────────────────────────────
export function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* Root redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vehicles"
            element={
              <ProtectedRoute>
                <VehiclesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/drivers"
            element={
              <ProtectedRoute>
                <DriversPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trips"
            element={
              <ProtectedRoute>
                <TripsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/maintenance"
            element={
              <ProtectedRoute>
                <MaintenancePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/fuel"
            element={
              <ProtectedRoute>
                <FuelPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/expenses"
            element={
              <ProtectedRoute>
                <ExpensesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <ReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <AnalyticsPage />
              </ProtectedRoute>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
