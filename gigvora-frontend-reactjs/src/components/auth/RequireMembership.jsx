import { Navigate, useLocation, Link } from 'react-router-dom';
import { ShieldExclamationIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import useSession from '../../hooks/useSession.js';

function AccessDeniedNotice({ role }) {
  const normalizedRole = role ? role.charAt(0).toUpperCase() + role.slice(1) : 'workspace';

  return (
    <div className="relative min-h-screen bg-surfaceMuted py-20">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-accent/15 via-white/80 to-transparent"
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-4xl px-6">
        <div className="rounded-3xl border border-slate-200 bg-white/95 p-12 shadow-soft backdrop-blur">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-5">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10">
                <ShieldExclamationIcon className="h-8 w-8 text-accent" aria-hidden="true" />
              </span>
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Access restricted</p>
                <h1 className="text-2xl font-semibold text-slate-900">
                  {normalizedRole} dashboard is limited to approved agency operators
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-slate-600">
                  Your profile is signed in, but it doesn&apos;t carry the necessary agency membership yet. Gigvora protects
                  sensitive revenue, bench, and alliance data so only verified agency leads can open this control tower.
                  Switch to a permitted dashboard or request an agency workspace upgrade from your organisation admin.
                </p>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-start gap-2">
                    <span className="mt-1 inline-flex h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
                    <span>Role-based gating keeps partner contracts, billings, and rosters secure.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                    <span>Request access to unlock full agency insights once your workspace is approved.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 inline-flex h-1.5 w-1.5 rounded-full bg-slate-400" aria-hidden="true" />
                    <span>In the meantime, you can continue collaborating from your active dashboards.</span>
                  </li>
                </ul>
              </div>
            </div>
            <div className="flex w-full flex-col gap-3 rounded-2xl bg-surfaceMuted/70 p-6 lg:max-w-xs">
              <Link
                to="/dashboard/user"
                className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accentDark"
              >
                Go to your active dashboard
              </Link>
              <a
                href="mailto:support@gigvora.com?subject=Agency%20access%20request"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-accent/40 hover:text-accent"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" aria-hidden="true" />
                Request agency membership
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RequireMembership({ role, children, fallback = null }) {
  const location = useLocation();
  const { session, isAuthenticated } = useSession();

  if (!isAuthenticated) {
    if (fallback) {
      return fallback;
    }
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  const memberships = Array.isArray(session?.memberships) ? session.memberships : [];
  const hasAccess = role ? memberships.includes(role) : true;

  if (!hasAccess) {
    if (fallback) {
      return fallback;
    }
    return <AccessDeniedNotice role={role} />;
  }

  return children;
}
