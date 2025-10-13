import { useMemo } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { LockClosedIcon } from '@heroicons/react/24/outline';
import useSession from '../../hooks/useSession.js';

function AccessDenied({ requiredRoles = [] }) {
  const message = requiredRoles.length
    ? `You need a ${requiredRoles.map((role) => `${role.charAt(0).toUpperCase()}${role.slice(1)}`).join(' or ')} membership to open this dashboard.`
    : 'You do not have permission to open this dashboard yet.';

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <div className="space-y-6 rounded-3xl border border-slate-200 bg-white/95 p-12 shadow-soft">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-500">
            <LockClosedIcon className="h-7 w-7" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-slate-900">Access restricted</h1>
            <p className="text-sm text-slate-600">{message}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <a
              href="/"
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-medium text-slate-700 transition hover:border-accent hover:text-accent"
            >
              Return home
            </a>
            <a
              href="/settings"
              className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark"
            >
              Manage memberships
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RequireDashboardAccess({ requiredRoles = [], children }) {
  const location = useLocation();
  const { isAuthenticated, session } = useSession();

  const hasMembership = useMemo(() => {
    if (!Array.isArray(requiredRoles) || requiredRoles.length === 0) {
      return true;
    }
    const memberships = session?.memberships ?? [];
    return requiredRoles.some((role) => memberships.includes(role));
  }, [requiredRoles, session?.memberships]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ redirectTo: location.pathname }} />;
  }

  if (!hasMembership) {
    return <AccessDenied requiredRoles={requiredRoles} />;
  }

  return children;
}
