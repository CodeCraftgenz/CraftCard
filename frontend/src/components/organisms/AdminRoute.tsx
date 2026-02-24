import { Navigate } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { LoadingSpinner } from '@/components/atoms/LoadingSpinner';
import { type ReactNode } from 'react';

export function AdminRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-bg-dark flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/editor" replace />;
  }

  return <>{children}</>;
}
