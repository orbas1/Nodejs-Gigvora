import { useMemo } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import useSession from '../../hooks/useSession.js';
import { DASHBOARD_LINKS } from '../../constants/dashboardLinks.js';

function resolveFallbackPath(session) {
  if (!session) {
    return '/login';
  }

  const preferred = session.primaryDashboard;
  const memberships = Array.isArray(session.memberships) ? session.memberships : [];

  if (preferred && DASHBOARD_LINKS[preferred]?.path) {
    return DASHBOARD_LINKS[preferred].path;
  }

  const firstAvailable = memberships
    .map((key) => DASHBOARD_LINKS[key]?.path)
    .find((path) => typeof path === 'string' && path.length > 0);

  return firstAvailable ?? '/';
}

export default function ProtectedRoute({ children, allowedMemberships }) {
  const location = useLocation();
  const { isAuthenticated, session } = useSession();

  const accessGranted = useMemo(() => {
    if (!isAuthenticated) {
      return false;
    }
    if (!allowedMemberships?.length) {
      return true;
    }
    const memberships = Array.isArray(session?.memberships) ? session.memberships : [];
    return allowedMemberships.some((role) => memberships.includes(role));
  }, [allowedMemberships, isAuthenticated, session?.memberships]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!accessGranted) {
    const fallbackPath = resolveFallbackPath(session);
    return <Navigate to={fallbackPath} replace state={{ from: location }} />;
  }

  return children;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  allowedMemberships: PropTypes.arrayOf(PropTypes.string),
};

ProtectedRoute.defaultProps = {
  allowedMemberships: undefined,
};
