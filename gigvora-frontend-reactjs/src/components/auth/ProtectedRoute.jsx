import { Navigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import useAccessControl from '../../hooks/useAccessControl.js';

export default function ProtectedRoute({ children, allowedMemberships }) {
  const location = useLocation();
  const access = useAccessControl({
    requireAuth: true,
    allowedMemberships,
  });

  if (access.status === 'unauthenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!allowedMemberships?.length) {
    return children;
  }

  if (access.status === 'forbidden') {
    const fallbackPath = access.redirectPath ?? '/';
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
