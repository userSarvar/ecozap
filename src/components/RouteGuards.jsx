import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function RequireAuth({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="page">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;

  return children;
}

export function RequireAdmin({ children }) {
  const { isAdmin, loading } = useAuth();

  if (loading) return <div className="page">Loading…</div>;
  if (!isAdmin) return <Navigate to="/history" replace />;

  return children;
}
