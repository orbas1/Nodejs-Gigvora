import { Link, Navigate, useLocation } from 'react-router-dom';
import { useMemo } from 'react';
import useRoleAccess from '../../hooks/useRoleAccess.js';

const ROLE_LABELS = {
  freelancer: 'Freelancer',
  user: 'User & Job Seeker',
  agency: 'Agency',
  company: 'Company',
  headhunter: 'Headhunter',
  mentor: 'Mentor',
  admin: 'Admin',
};

function humanizeRole(role) {
  if (!role) {
    return 'member';
  }
  return ROLE_LABELS[role] ?? role.replace(/(^|[\s_-])(\w)/g, (match, space, letter) => `${space}${letter.toUpperCase()}`);
}

function AccessDeniedView({ allowedRoles, featureName }) {
  const readableRoles = allowedRoles.length
    ? allowedRoles.map(humanizeRole)
    : ['authorised members'];

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 px-6 py-16">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white/90 p-10 text-center shadow-2xl backdrop-blur">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
          <span className="text-2xl font-semibold">!</span>
        </div>
        <h1 className="mt-6 text-2xl font-semibold text-slate-900">Access restricted</h1>
        <p className="mt-3 text-sm text-slate-600">
          {featureName ?? 'This dashboard'} is reserved for {readableRoles.join(' or ')}. Switch to an eligible membership or
          contact Gigvora support if you believe this is a mistake.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/dashboard/user"
            className="inline-flex items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark"
          >
            Go to my workspace
          </Link>
          <Link
            to="/settings"
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-600"
          >
            Manage memberships
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RoleGate({ allowedRoles, children, featureName }) {
  const location = useLocation();
  const { hasAccess, isAuthenticated, session, allowedRoles: normalizedRoles, matchedRole } = useRoleAccess(allowedRoles);

  const content = useMemo(() => {
    if (!isAuthenticated) {
      return (
        <Navigate
          to="/login"
          replace
          state={{ from: location.pathname, requiredRoles: normalizedRoles }}
        />
      );
    }

    if (!hasAccess) {
      return <AccessDeniedView allowedRoles={normalizedRoles} featureName={featureName} />;
    }

    if (typeof children === 'function') {
      return children({ session, role: matchedRole, allowedRoles: normalizedRoles });
    }

    return children;
  }, [children, featureName, hasAccess, isAuthenticated, location.pathname, matchedRole, normalizedRoles, session]);

  return content;
}
