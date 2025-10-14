import { Navigate, useLocation } from 'react-router-dom';
import useSession from '../../hooks/useSession.js';
import DashboardAccessDenied from './DashboardAccessDenied.jsx';

export default function ProtectedDashboardRoute({ role, children }) {
  const { session, isAuthenticated } = useSession();
  const location = useLocation();
  const normalizedRole = role ? role.toLowerCase() : null;

  if (!isAuthenticated || !session) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  const memberships = Array.isArray(session.memberships)
    ? session.memberships.map((membership) => membership.toLowerCase())
    : [];

  if (normalizedRole && !memberships.includes(normalizedRole)) {
    return <DashboardAccessDenied requiredRole={normalizedRole} memberships={memberships} />;
  }

  return children;
}
