import { ShieldExclamationIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { DASHBOARD_LINKS } from '../../constants/dashboardLinks.js';

const ROLE_LABELS = {
  user: 'User & job seeker',
  freelancer: 'Freelancer',
  agency: 'Agency',
  company: 'Company',
  headhunter: 'Headhunter',
  mentor: 'Mentor',
  admin: 'Admin',
};

function resolveRoleLabel(role) {
  if (!role) {
    return 'selected role';
  }
  return ROLE_LABELS[role] ?? role.charAt(0).toUpperCase() + role.slice(1);
}

export default function DashboardAccessDenied({ requiredRole, memberships = [] }) {
  const normalizedRequired = (requiredRole ?? '').toLowerCase();
  const roleLabel = resolveRoleLabel(normalizedRequired);
  const availableDashboards = memberships
    .map((membership) => membership.toLowerCase())
    .filter((membership, index, array) => array.indexOf(membership) === index)
    .filter((membership) => membership !== normalizedRequired && DASHBOARD_LINKS[membership])
    .map((membership) => ({
      role: membership,
      ...DASHBOARD_LINKS[membership],
    }));

  return (
    <main className="flex min-h-[60vh] items-center justify-center bg-surfaceMuted px-6 py-16">
      <div className="w-full max-w-2xl space-y-6 rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-soft">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600">
          <ShieldExclamationIcon className="h-7 w-7" aria-hidden="true" />
        </div>
        <div className="space-y-3">
          <h1 className="text-2xl font-semibold text-slate-900">Access restricted</h1>
          <p className="text-sm text-slate-600">
            The {roleLabel} dashboard is limited to accounts with the {roleLabel} membership. Switch to an authorised workspace or
            contact your Gigvora administrator to update access rights.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/feed"
            className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark"
          >
            Go to feed
          </Link>
          <Link
            to="/settings"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-accent hover:text-accent"
          >
            Manage account access
          </Link>
        </div>
        {availableDashboards.length ? (
          <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5 text-left">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Dashboards you can open</p>
            <div className="mt-3 flex flex-wrap gap-3">
              {availableDashboards.map((dashboard) => (
                <Link
                  key={dashboard.role}
                  to={dashboard.path}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-accent hover:text-accent"
                >
                  {dashboard.label}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
