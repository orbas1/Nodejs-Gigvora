import PropTypes from 'prop-types';
import { Navigate, useLocation } from 'react-router-dom';
import useSession from '../../hooks/useSession.js';

function normaliseRole(value) {
  if (!value) return null;
  return `${value}`.trim().toLowerCase().replace(/\s+/g, '-');
}

function collectRoles(session) {
  const roles = new Set();
  if (!session) {
    return roles;
  }
  const candidates = [
    session.userType,
    session.primaryDashboard,
    ...(Array.isArray(session.memberships) ? session.memberships : []),
    ...(Array.isArray(session.accountTypes) ? session.accountTypes : []),
    ...(Array.isArray(session.roles) ? session.roles : []),
  ];
  candidates.map(normaliseRole).forEach((role) => {
    if (role) {
      roles.add(role);
    }
  });
  return roles;
}

export default function RequireRole({ allowedRoles, fallback = '/login', children }) {
  const location = useLocation();
  const { session, isAuthenticated } = useSession();
  const normalisedAllowed = (allowedRoles ?? []).map(normaliseRole).filter(Boolean);

  if (!isAuthenticated) {
    return <Navigate to={fallback} replace state={{ from: location }} />;
  }

  if (!normalisedAllowed.length) {
    return children;
  }

  const availableRoles = collectRoles(session);
  const hasAccess = normalisedAllowed.some((role) => availableRoles.has(role));

  if (!hasAccess) {
    const redirectTo = session?.primaryDashboard ? `/dashboard/${session.primaryDashboard}` : fallback;
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  return children;
}

RequireRole.propTypes = {
  allowedRoles: PropTypes.arrayOf(PropTypes.string),
  fallback: PropTypes.string,
  children: PropTypes.node.isRequired,
};

RequireRole.defaultProps = {
  allowedRoles: [],
  fallback: '/login',
};
