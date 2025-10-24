import { Navigate, useLocation } from 'react-router-dom';
import useAccessControl from '../../hooks/useAccessControl.js';

export default function RoleProtectedRoute({ allowedRoles = [], children }) {
  const location = useLocation();
  const access = useAccessControl({
    requireAuth: true,
    allowedRoles,
  });

  if (access.status === 'unauthenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles.length === 0) {
    return children;
  }

  if (access.status === 'forbidden') {
    const fallbackPath = access.redirectPath ?? '/';
    return <Navigate to={fallbackPath} replace state={{ from: location, reason: 'unauthorised' }} />;
  }

  return children;
}
