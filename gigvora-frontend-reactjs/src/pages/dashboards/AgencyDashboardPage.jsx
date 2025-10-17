import { useCallback, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import useSession from '../../hooks/useSession.js';
import VolunteeringWorkspace from '../../components/agency/volunteering/VolunteeringWorkspace.jsx';
import { AGENCY_DASHBOARD_MENU_SECTIONS } from '../../constants/agencyDashboardMenu.js';

const OVERVIEW_CARDS = [
  { id: 'programmes', label: 'Programmes', value: 7 },
  { id: 'active-volunteers', label: 'Volunteers', value: 42 },
  { id: 'deployments', label: 'Deployments', value: 5 },
  { id: 'responses', label: 'Replies today', value: 18 },
];

const TEAM_REMINDERS = [
  { id: 'checkins', label: 'Client check-in · 10:00' },
  { id: 'onboarding', label: 'Onboard three mentors' },
  { id: 'reports', label: 'Send weekly summary' },
];

const QUICK_LINKS = [
  { id: 'inbox', label: 'Inbox', to: '/inbox' },
  { id: 'finance', label: 'Finance', to: '/finance' },
  { id: 'settings', label: 'Settings', to: '/settings' },
];

const VOL_PANES = new Set(['overview', 'applications', 'responses', 'contracts', 'spend']);
const VOL_MENU_TO_PANE = Object.freeze({
  'volunteer-home': 'overview',
  'volunteer-deals': 'contracts',
  'volunteer-apply': 'applications',
  'volunteer-replies': 'responses',
  'volunteer-spend': 'spend',
});

function parseWorkspaceId(rawValue) {
  if (!rawValue) {
    return undefined;
  }
  const numeric = Number.parseInt(rawValue, 10);
  return Number.isNaN(numeric) ? undefined : numeric;
}

function normalizePane(value) {
  if (!value) {
    return 'overview';
  }
  return VOL_PANES.has(value) ? value : 'overview';
}

export default function AgencyDashboardPage() {
  const { session } = useSession();
  const [searchParams, setSearchParams] = useSearchParams();

  const workspaceIdParam = searchParams.get('workspaceId');
  const workspaceSlugParam = searchParams.get('workspaceSlug');
  const volPaneParam = normalizePane(searchParams.get('volPane'));

  const workspaceId = parseWorkspaceId(workspaceIdParam);
  const workspaceSlug = workspaceSlugParam || undefined;

  const menuSections = useMemo(
    () =>
      AGENCY_DASHBOARD_MENU_SECTIONS.map((section) => ({
        ...section,
        items: section.items.map((item) => ({ ...item })),
      })),
    [],
  );
  const availableDashboards = useMemo(() => ['agency', 'company', 'headhunter', 'user', 'freelancer'], []);
  const displayName = session?.name || session?.firstName || 'Agency team';

  const handleVolunteeringPaneChange = useCallback(
    (nextPane) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          if (nextPane === 'overview') {
            next.delete('volPane');
          } else {
            next.set('volPane', nextPane);
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const handleDashboardMenuSelect = useCallback(
    (itemId, item) => {
      if (!item) {
        return;
      }

      const pane = VOL_MENU_TO_PANE[itemId];
      if (pane) {
        handleVolunteeringPaneChange(pane);
        if (typeof document !== 'undefined') {
          const target = document.getElementById('volunteering-home');
          if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
        return;
      }

      if (item.href) {
        if (typeof window !== 'undefined') {
          if (item.href.startsWith('http')) {
            window.open(item.href, item.target ?? '_blank', 'noreferrer');
          } else {
            window.location.href = item.href;
          }
        }
        return;
      }

      const targetId = item.sectionId || item.targetId || item.id;
      if (targetId && typeof document !== 'undefined') {
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    },
    [handleVolunteeringPaneChange],
  );

  return (
    <DashboardLayout
      currentDashboard="agency"
      title="Agency"
      subtitle="Operations"
      description="Control contracts, teams, and volunteering programmes from one screen."
      menuSections={menuSections}
      availableDashboards={availableDashboards}
      onMenuItemSelect={handleDashboardMenuSelect}
    >
      <div className="space-y-10">
        <section
          id="agency-overview"
          className="rounded-3xl border border-slate-200 bg-white px-8 py-10 shadow-soft"
        >
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Workspace</p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900">Welcome back, {displayName}</h1>
            </div>
            <div className="flex gap-3">
              <Link
                to="/dashboard/company"
                className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
              >
                Switch board
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {OVERVIEW_CARDS.map((card) => (
              <div key={card.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">{card.label}</p>
                <p className="mt-3 text-3xl font-semibold text-slate-900">{card.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            <article className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <h2 className="text-lg font-semibold text-slate-900">Today</h2>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                {TEAM_REMINDERS.map((item) => (
                  <li key={item.id} className="rounded-2xl border border-slate-100 bg-white px-4 py-3">
                    {item.label}
                  </li>
                ))}
              </ul>
            </article>
            <article className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <h2 className="text-lg font-semibold text-slate-900">Shortcuts</h2>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                {QUICK_LINKS.map((link) => (
                  <li key={link.id}>
                    <Link
                      to={link.to}
                      className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-4 py-3 font-semibold text-slate-900 transition hover:border-slate-300 hover:text-slate-700"
                    >
                      {link.label}
                      <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Open</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </section>

        <VolunteeringWorkspace
          workspaceId={workspaceId}
          workspaceSlug={workspaceSlug}
          initialPane={volPaneParam}
          onPaneChange={handleVolunteeringPaneChange}
        />
      </div>
    </DashboardLayout>
  );
}
