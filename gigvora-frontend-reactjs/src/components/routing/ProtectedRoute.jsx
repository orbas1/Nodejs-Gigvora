import PropTypes from 'prop-types';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAccessControl from '../../hooks/useAccessControl.js';

function DefaultAccessDenied({ missingMemberships = [], missingRoles = [] }) {
  const hasMissingMemberships = Array.isArray(missingMemberships) && missingMemberships.length > 0;
  const hasMissingRoles = Array.isArray(missingRoles) && missingRoles.length > 0;

  return (
    <div className="px-6 py-16">
      <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-soft">
        <h1 className="text-2xl font-semibold text-slate-900">Secure area</h1>
        <p className="mt-3 text-sm text-slate-600">
          {hasMissingMemberships || hasMissingRoles
            ? 'This space is limited to specific Gigvora memberships and roles.'
            : 'Switch to an authorised workspace or contact support to request access.'}
        </p>
        {hasMissingMemberships ? (
          <ul className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
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
        {hasMissingRoles ? (
          <ul className="mt-2 flex flex-wrap items-center justify-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-slate-500">
            {missingRoles.map((role) => (
              <li key={role} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-600">
                {role}
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

function resolveMembershipsInput(requiredMemberships, allowedMemberships) {
  const memberships = requiredMemberships ?? allowedMemberships ?? [];
  return Array.isArray(memberships) ? memberships : [memberships];
}

function isRenderable(value) {
  return value !== null && value !== undefined;
}

function renderFallbackElement(renderer, payload) {
  if (!isRenderable(renderer)) {
    return null;
  }
  if (typeof renderer === 'function') {
    return renderer(payload);
  }
  return renderer;
}

export default function ProtectedRoute({
  requiredMemberships,
  allowedMemberships,
  allowedRoles,
  requireAuth = true,
  redirectTo = '/login',
  fallback = null,
  unauthenticatedFallback = null,
  preferDashboardRedirect = false,
  children,
}) {
  const location = useLocation();
  const normalizedMemberships = resolveMembershipsInput(requiredMemberships, allowedMemberships);
  const normalizedRoles = Array.isArray(allowedRoles) ? allowedRoles : allowedRoles ? [allowedRoles] : [];
  const access = useAccessControl({
    requireAuth,
    allowedMemberships: normalizedMemberships,
    allowedRoles: normalizedRoles,
    fallbackPath: redirectTo,
    preferDashboardRedirect,
  });

  const payload = {
    access,
    location,
    redirectPath: access.redirectPath,
    redirectTo,
  };

  if (access.status === 'unauthenticated') {
    const rendered = renderFallbackElement(unauthenticatedFallback, payload);
    if (rendered) {
      return rendered;
    }
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  if (access.status === 'forbidden') {
    const rendered = renderFallbackElement(fallback, payload);
    if (rendered) {
      return rendered;
    }

    if (preferDashboardRedirect && access.redirectPath) {
      return <Navigate to={access.redirectPath} replace state={{ from: location, reason: 'unauthorised' }} />;
    }

    return (
      <DefaultAccessDenied
        missingMemberships={access.missingMemberships}
        missingRoles={access.missingRoles}
      />
    );
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
  allowedRoles: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.string),
    PropTypes.string,
  ]),
  requireAuth: PropTypes.bool,
  redirectTo: PropTypes.string,
  fallback: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  unauthenticatedFallback: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  preferDashboardRedirect: PropTypes.bool,
  children: PropTypes.node,
};

DefaultAccessDenied.propTypes = {
  missingMemberships: PropTypes.arrayOf(PropTypes.string),
  missingRoles: PropTypes.arrayOf(PropTypes.string),
};
