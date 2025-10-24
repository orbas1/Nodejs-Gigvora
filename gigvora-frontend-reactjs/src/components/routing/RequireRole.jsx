import PropTypes from 'prop-types';
import { Navigate, useLocation } from 'react-router-dom';
import useAccessControl from '../../hooks/useAccessControl.js';

export default function RequireRole({ allowedRoles, fallback = '/login', children }) {
  const location = useLocation();
  const access = useAccessControl({
    requireAuth: true,
    allowedRoles,
    fallbackPath: fallback,
  });

  if (access.status === 'unauthenticated') {
    return <Navigate to={fallback} replace state={{ from: location }} />;
  }

  if (!allowedRoles?.length) {
    return children;
  }

  if (access.status === 'forbidden') {
    const redirectTo = access.redirectPath ?? fallback;
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
