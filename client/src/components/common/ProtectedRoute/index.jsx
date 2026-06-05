import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth.js';
import PageLoader from '../PageLoader/index.jsx';

const ROLE_HOME = { student: '/student', teacher: '/teacher', admin: '/admin' };

export default function ProtectedRoute({ children, role }) {
  const { user, isAuthenticated, initializing } = useAuth();
  const location = useLocation();

  if (initializing) return <PageLoader />;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (role && user?.role !== role) {
    return <Navigate to={ROLE_HOME[user?.role] ?? '/'} replace />;
  }

  return children;
}
