import { Navigate, useLocation } from 'react-router-dom';
import useSession from '../../hooks/useSession.js';
import { DASHBOARD_LINKS } from '../../constants/dashboardLinks.js';

function buildMembershipSet(session) {
  const memberships = new Set();
  if (!session) {
    return memberships;
  }

  const primary = session.primaryDashboard;
  if (primary && typeof primary === 'string') {
    memberships.add(primary.toLowerCase());
  }

  const list = Array.isArray(session.memberships) ? session.memberships : [];
  list.forEach((role) => {
    if (!role) {
      return;
    }
    const normalized = typeof role === 'string' ? role.toLowerCase().trim() : role;
    if (typeof normalized === 'string' && normalized) {
      memberships.add(normalized);
    }
  });

  if (Array.isArray(session.accountTypes)) {
    session.accountTypes.forEach((role) => {
      if (role && typeof role === 'string') {
        const normalized = role.toLowerCase().trim();
        if (normalized) {
          memberships.add(normalized);
        }
      }
    });
  }

  return memberships;
}

function resolveFallbackPath(memberships) {
  const preferred = memberships.values().next();
  if (!preferred.done) {
    const link = DASHBOARD_LINKS[preferred.value];
    if (link?.path) {
      return link.path;
    }
  }
  return '/';
}

export default function RoleProtectedRoute({ allowedRoles = [], children }) {
  const location = useLocation();
  const { session, isAuthenticated } = useSession();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const memberships = buildMembershipSet(session);

  if (allowedRoles.length === 0) {
    return children;
  }

  const isAuthorised = allowedRoles.some((role) => role && memberships.has(role));

  if (!isAuthorised) {
    const fallbackPath = resolveFallbackPath(memberships);
    return <Navigate to={fallbackPath} replace state={{ from: location, reason: 'unauthorised' }} />;
  }

  return children;
}
