import PropTypes from 'prop-types';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAccessControl from '../../hooks/useAccessControl.js';

function DefaultAccessDenied({ missingMemberships = [] }) {
  const hasMissing = Array.isArray(missingMemberships) && missingMemberships.length > 0;
  return (
    <div className="px-6 py-16">
      <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-soft">
        <h1 className="text-2xl font-semibold text-slate-900">Community access locked</h1>
        <p className="mt-3 text-sm text-slate-600">
          {hasMissing
            ? 'This area is limited to the following memberships:'
            : 'Switch to a community-enabled role or contact support to turn it on.'}
        </p>
        {hasMissing ? (
          <ul className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {missingMemberships.map((membership) => (
              <li
                key={membership}
                className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-600"
              >
                {membership}
              </li>
            ))}
          </ul>
        ) : null}
        <a
          href="https://support.gigvora.com"
          target="_blank"
          rel="noreferrer"
          className="mt-6 inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
        >
          Visit support centre
        </a>
      </div>
    </div>
  );
}

export default function ProtectedRoute({
  requiredMemberships,
  allowedMemberships,
  redirectTo = '/login',
  fallback = null,
  children,
}) {
  const location = useLocation();
  const memberships = requiredMemberships ?? allowedMemberships ?? [];
  const normalizedMemberships = Array.isArray(memberships) ? memberships : [memberships];
  const access = useAccessControl({
    requireAuth: true,
    allowedMemberships: normalizedMemberships,
    fallbackPath: redirectTo,
    preferDashboardRedirect: false,
  });

  if (access.status === 'unauthenticated') {
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  if (access.status === 'forbidden') {
    return fallback ?? <DefaultAccessDenied missingMemberships={access.missingMemberships} />;
  }

  if (children) {
    return <>{children}</>;
  }

  return <Outlet />;
}

ProtectedRoute.propTypes = {
  requiredMemberships: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.string),
    PropTypes.string,
  ]),
  allowedMemberships: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.string),
    PropTypes.string,
  ]),
  redirectTo: PropTypes.string,
  fallback: PropTypes.node,
  children: PropTypes.node,
};

ProtectedRoute.defaultProps = {
  requiredMemberships: undefined,
  allowedMemberships: undefined,
  redirectTo: '/login',
  fallback: null,
  children: undefined,
};
