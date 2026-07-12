import { Navigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { AppLayout } from '../layouts/AppLayout';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return <AppLayout>{children}</AppLayout>;
}
