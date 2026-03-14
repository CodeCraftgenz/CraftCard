import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { LoadingSpinner } from '@/components/atoms/LoadingSpinner';
import { type ReactNode } from 'react';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-bg-dark flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    const returnTo = location.pathname + location.search;
    return <Navigate to={`/login?redirect=${encodeURIComponent(returnTo)}`} replace />;
  }

  return <>{children}</>;
}

/** Blocks FREE hackathon participants from accessing standard pages (editor, billing, etc).
 *  PRO+ hackathon users pass through freely. */
export function HackathonGuard({ children }: { children: ReactNode }) {
  const { isHackathonParticipant, hasPaid } = useAuth();

  // Hackathon participant on FREE plan → lock to hackathon dashboard
  if (isHackathonParticipant && !hasPaid) {
    return <Navigate to="/hackathon/dashboard" replace />;
  }

  return <>{children}</>;
}
