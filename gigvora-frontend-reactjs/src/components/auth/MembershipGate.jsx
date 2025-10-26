import PropTypes from 'prop-types';
import { ShieldCheckIcon, ShieldExclamationIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { DASHBOARD_LINKS } from '../../constants/dashboardLinks.js';
import { classNames } from '../../utils/classNames.js';
import ProtectedRoute from '../routing/ProtectedRoute.jsx';

function resolveLabel(key) {
  return DASHBOARD_LINKS[key]?.label ?? key;
}

function Badge({ label, tone = 'neutral' }) {
  const palette =
    tone === 'positive'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : tone === 'negative'
      ? 'border-rose-200 bg-rose-50 text-rose-600'
      : 'border-slate-200 bg-slate-50 text-slate-600';
  return (
    <span className={classNames('inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide', palette)}>
      {label}
    </span>
  );
}

function UnauthenticatedNotice({ locationPath }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-accentSoft/60">
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col justify-center gap-10 px-6 py-20">
        <div className="max-w-2xl rounded-3xl border border-slate-200 bg-white/95 p-12 shadow-[0_40px_90px_-45px_rgba(37,99,235,0.45)]">
          <div className="flex items-center gap-4 text-accent">
            <ShieldCheckIcon className="h-10 w-10" aria-hidden="true" />
            <p className="text-sm font-semibold uppercase tracking-[0.2em]">Secure workspace</p>
          </div>
          <h1 className="mt-6 text-3xl font-semibold text-slate-900">Sign in to open Gigvora dashboards</h1>
          <p className="mt-4 text-base leading-relaxed text-slate-600">
            <span className="font-semibold text-slate-800">{locationPath}</span> is protected to keep member data private. Use your
            verified credentials to continue on web or mobile.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark"
            >
              Sign in securely
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center justify-center rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-600 transition hover:border-accent/60 hover:text-accent"
            >
              Create an account
            </Link>
          </div>
          <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Tip: Enable two-factor authentication for enterprise-grade protection.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <Badge label="Encrypted access" />
          <Badge label="SSO on roadmap" />
          <Badge label="Mobile parity" />
        </div>
      </div>
    </div>
  );
}

function UpgradeNotice({ requiredMemberships, access }) {
  const requiredLabels = Array.isArray(requiredMemberships)
    ? requiredMemberships.map((membership) => resolveLabel(membership))
    : null;
  const activeMemberships = Array.isArray(access?.memberships) ? access.memberships : [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-white to-surfaceMuted py-20">
      <div className="mx-auto max-w-5xl px-6">
        <div className="rounded-3xl border border-amber-200 bg-amber-50/80 p-12 shadow-[0_38px_70px_-40px_rgba(217,119,6,0.45)]">
          <div className="flex items-center gap-4 text-amber-600">
            <ShieldExclamationIcon className="h-10 w-10" aria-hidden="true" />
            <p className="text-sm font-semibold uppercase tracking-[0.18em]">Membership upgrade required</p>
          </div>
          <h1 className="mt-6 text-3xl font-semibold text-slate-900">This dashboard needs extra permissions</h1>
          <p className="mt-4 text-base leading-relaxed text-slate-700">Your current memberships don&apos;t cover this view.</p>
          <p className="mt-3 text-sm text-slate-600">Required access:</p>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            {requiredLabels?.map((label) => (
              <Badge key={label} label={label} tone="positive" />
            ))}
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-[1.1fr,0.9fr]">
            <div className="rounded-2xl border border-slate-200 bg-white/90 p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Your current memberships</h2>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {activeMemberships.length ? (
                  activeMemberships.map((membership) => (
                    <Badge key={membership} label={resolveLabel(membership)} />
                  ))
                ) : (
                  <Badge label="No memberships" tone="negative" />
                )}
              </div>
            </div>
            <div className="rounded-2xl border border-accent/30 bg-white/95 p-6 shadow-soft">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-accent">Need access?</h2>
              <p className="mt-2 text-sm text-slate-600">
                Request role activation or contact your Gigvora success partner to switch it on.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  to="/settings"
                  className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark"
                >
                  Manage memberships
                </Link>
                <a
                  href="mailto:support@gigvora.com?subject=Access%20request"
                  className="inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-accent/50 hover:text-accent"
                >
                  Contact support
                </a>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-10 flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <Badge label="Role-based controls" />
          <Badge label="Audit trail ready" />
          <Badge label="SSO compatible" />
        </div>
      </div>
    </div>
  );
}

export default function MembershipGate({ allowedMemberships = [], allowedRoles = [], children = null }) {
  const normalizedAllowed = Array.isArray(allowedMemberships)
    ? allowedMemberships
    : [allowedMemberships].filter(Boolean);
  const normalizedRoles = Array.isArray(allowedRoles) ? allowedRoles : allowedRoles ? [allowedRoles] : [];

  return (
    <ProtectedRoute
      allowedMemberships={normalizedAllowed}
      allowedRoles={normalizedRoles}
      preferDashboardRedirect={false}
      fallback={({ access }) => <UpgradeNotice requiredMemberships={normalizedAllowed} access={access} />}
      unauthenticatedFallback={({ location }) => <UnauthenticatedNotice locationPath={location.pathname} />}
    >
      {children}
    </ProtectedRoute>
  );
}

MembershipGate.propTypes = {
  allowedMemberships: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.string),
    PropTypes.string,
  ]),
  allowedRoles: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.string),
    PropTypes.string,
  ]),
  children: PropTypes.node,
};
