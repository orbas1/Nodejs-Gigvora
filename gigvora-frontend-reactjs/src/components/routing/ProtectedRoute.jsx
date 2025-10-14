import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useSession from '../../hooks/useSession.js';
import { hasAnyMembership } from '../../utils/session.js';

function DefaultAccessDenied() {
  return (
    <div className="px-6 py-16">
      <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-soft">
        <h1 className="text-2xl font-semibold text-slate-900">Community access is restricted</h1>
        <p className="mt-3 text-sm text-slate-600">
          Your current workspace does not include access to this area. Switch to a community-enabled role or contact support for help enabling access.
        </p>
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

export default function ProtectedRoute({ requiredMemberships = [], redirectTo = '/login', fallback = null }) {
  const { session, isAuthenticated } = useSession();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  if (requiredMemberships.length && !hasAnyMembership(session, requiredMemberships)) {
    return fallback ?? <DefaultAccessDenied />;
  }

  return <Outlet />;
}
