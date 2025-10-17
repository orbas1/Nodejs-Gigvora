import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import useSession from '../../hooks/useSession.js';
import useAgencyWorkforceDashboard from '../../hooks/useAgencyWorkforceDashboard.js';
import AgencyWorkforceDashboard from '../../components/agency/workforce/AgencyWorkforceDashboard.jsx';
import { AGENCY_DASHBOARD_MENU_SECTIONS } from '../../constants/agencyDashboardMenu.js';
import {
  createAvailabilityEntry,
  createGigDelegation,
  createPayDelegation,
  createProjectDelegation,
  createWorkforceMember,
  deleteAvailabilityEntry,
  deleteCapacitySnapshot,
  deleteGigDelegation,
  deletePayDelegation,
  deleteProjectDelegation,
  deleteWorkforceMember,
  recordCapacitySnapshot,
  updateAvailabilityEntry,
  updateCapacitySnapshot,
  updateGigDelegation,
  updatePayDelegation,
  updateProjectDelegation,
  updateWorkforceMember,
} from '../../services/agencyWorkforce.js';

const availableDashboards = ['agency', 'company', 'freelancer', 'user'];

function parseWorkspaceId(value) {
  if (!value) return undefined;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
}
import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import useSession from '../../hooks/useSession.js';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import { AGENCY_DASHBOARD_MENU_SECTIONS } from '../../constants/agencyDashboardMenu.js';

const OVERVIEW_METRICS = [
  { id: 'clients', label: 'Active clients', value: '18', helper: '4 onboarding now' },
  { id: 'projects', label: 'Projects in delivery', value: '42', helper: '8 kicking off this week' },
  { id: 'capacity', label: 'Bench capacity', value: '63%', helper: 'Plan 120 open hours' },
];

const TEAM_NOTES = [
  { id: 'advocacy', title: 'Client advocacy sync', helper: 'Review NPS signals and assign follow-ups.' },
  { id: 'payments', title: 'Finance review', helper: 'Clear payouts and unblock vendor invoices.' },
  { id: 'growth', title: 'Growth pipeline', helper: 'Align pitch schedule for next week demos.' },
];

const FINANCE_SNAPSHOT = [
  { id: 'run-rate', label: 'Revenue run-rate', value: '$1.84M', helper: '+12% vs last quarter' },
  { id: 'invoiced', label: 'Invoices sent', value: '$310K', helper: 'Awaiting 3 approvals' },
  { id: 'payouts', label: 'Payouts processed', value: '$245K', helper: 'Cleared overnight' },
];

const availableDashboards = ['agency', 'company', 'freelancer', 'user'];

export default function AgencyDashboardPage() {
  const { session } = useSession();
  const [searchParams] = useSearchParams();
  const workspaceIdParam = searchParams.get('workspaceId');
  const workspaceId = parseWorkspaceId(workspaceIdParam);

  const { data, loading, error, summaryCards, refresh } = useAgencyWorkforceDashboard({ workspaceId });

  const roles = session?.memberships ?? session?.roles ?? [];
  const canEdit = useMemo(() => {
    return roles.some((role) => {
      const normalized = `${role}`.toLowerCase();
      return normalized === 'agency_admin' || normalized === 'admin' || normalized === 'agency';
    });
  }, [roles]);

  const actions = useMemo(() => ({
    createMember: async (payload) => {
      await createWorkforceMember(payload);
      await refresh({ force: true });
    },
    updateMember: async (memberId, payload) => {
      await updateWorkforceMember(memberId, payload);
      await refresh({ force: true });
    },
    deleteMember: async (memberId, params) => {
      await deleteWorkforceMember(memberId, params);
      await refresh({ force: true });
    },
    createPayDelegation: async (payload) => {
      await createPayDelegation(payload);
      await refresh({ force: true });
    },
    updatePayDelegation: async (delegationId, payload) => {
      await updatePayDelegation(delegationId, payload);
      await refresh({ force: true });
    },
    deletePayDelegation: async (delegationId, params) => {
      await deletePayDelegation(delegationId, params);
      await refresh({ force: true });
    },
    createProjectDelegation: async (payload) => {
      await createProjectDelegation(payload);
      await refresh({ force: true });
    },
    updateProjectDelegation: async (delegationId, payload) => {
      await updateProjectDelegation(delegationId, payload);
      await refresh({ force: true });
    },
    deleteProjectDelegation: async (delegationId, params) => {
      await deleteProjectDelegation(delegationId, params);
      await refresh({ force: true });
    },
    createGigDelegation: async (payload) => {
      await createGigDelegation(payload);
      await refresh({ force: true });
    },
    updateGigDelegation: async (delegationId, payload) => {
      await updateGigDelegation(delegationId, payload);
      await refresh({ force: true });
    },
    deleteGigDelegation: async (delegationId, params) => {
      await deleteGigDelegation(delegationId, params);
      await refresh({ force: true });
    },
    recordCapacitySnapshot: async (payload) => {
      await recordCapacitySnapshot(payload);
      await refresh({ force: true });
    },
    updateCapacitySnapshot: async (snapshotId, payload) => {
      await updateCapacitySnapshot(snapshotId, payload);
      await refresh({ force: true });
    },
    deleteCapacitySnapshot: async (snapshotId, params) => {
      await deleteCapacitySnapshot(snapshotId, params);
      await refresh({ force: true });
    },
    createAvailabilityEntry: async (payload) => {
      await createAvailabilityEntry(payload);
      await refresh({ force: true });
    },
    updateAvailabilityEntry: async (entryId, payload) => {
      await updateAvailabilityEntry(entryId, payload);
      await refresh({ force: true });
    },
    deleteAvailabilityEntry: async (entryId, params) => {
      await deleteAvailabilityEntry(entryId, params);
      await refresh({ force: true });
    },
  }), [refresh]);

  const subtitle = useMemo(() => {
    const { totalMembers, utilizationPercent } = data?.metrics ?? {};
    return `Headcount ${totalMembers ?? 0} · Utilisation ${utilizationPercent?.toFixed?.(1) ?? '0.0'}%`;
  }, [data?.metrics]);

  const title = useMemo(() => {
    const displayName = session?.name ?? session?.firstName ?? 'Agency team';
    return `${displayName} workforce hub`;
  }, [session?.firstName, session?.name]);

  return (
    <div className="min-h-screen bg-surfaceMuted pb-16">
      <div className="mx-auto max-w-6xl px-4 pt-12 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-8">
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-slate-500">Agency control tower</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Hello, {displayName}</h1>
            <p className="mt-3 max-w-3xl text-sm text-slate-600">
              Track client health, revenue momentum, and the team’s next actions. Keep the bench balanced and highlight wins to
              leadership.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/dashboard/agency/ai"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700"
            >
              Manage AI & bidding
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {OVERVIEW_METRICS.map((metric) => (
              <div
                key={metric.id}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft transition hover:-translate-y-0.5 hover:border-accent/60"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">{metric.label}</p>
                <p className="mt-3 text-3xl font-semibold text-slate-900">{metric.value}</p>
                <p className="mt-2 text-xs text-slate-500">{metric.hint}</p>
              </div>
            ))}
          </div>
        </header>
    <DashboardLayout
      currentDashboard="agency"
      title={title}
      subtitle={subtitle}
      description=""
      menuSections={AGENCY_DASHBOARD_MENU_SECTIONS}
      availableDashboards={availableDashboards}
      activeMenuItem="home"
    >
      <div className="flex min-h-[calc(100vh-6rem)] flex-col gap-8 px-4 py-10 sm:px-6 lg:px-10 xl:px-16">
        <AgencyWorkforceDashboard
          data={data}
          loading={loading}
          error={error}
          summaryCards={summaryCards}
          onRefresh={refresh}
          workspaceId={workspaceId ?? data?.workspaceId ?? null}
          permissions={{ canEdit }}
          actions={actions}
        />
      </div>
  return (
    <DashboardLayout
      currentDashboard="agency"
      title="Agency control tower"
      subtitle={`Hello, ${displayName}`}
      description="Track client health, revenue momentum, and bench coverage from one place."
      menuSections={AGENCY_DASHBOARD_MENU_SECTIONS}
      availableDashboards={availableDashboards}
      activeMenuItem="agency-overview"
    >
      <div className="mx-auto max-w-6xl space-y-10 px-6 py-10">
        <div className="grid gap-4 sm:grid-cols-3">
          {OVERVIEW_METRICS.map((metric) => (
            <div
              key={metric.id}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft transition hover:-translate-y-0.5 hover:border-accent/60"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">{metric.label}</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">{metric.value}</p>
              <p className="mt-2 text-xs text-slate-500">{metric.hint}</p>
            </div>
          ))}
        </div>

        <section className="grid gap-8 lg:grid-cols-[1.35fr_1fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900">Team focus</h2>
                <Link to="/inbox" className="text-sm font-semibold text-accent hover:text-accentDark">
                  Share update
                </Link>
              </div>
              <ol className="mt-6 space-y-4">
                {TEAM_TASKS.map((task, index) => (
                  <li key={task.id} className="flex gap-4 rounded-2xl border border-slate-200/70 bg-slate-50 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{task.title}</p>
                      <p className="text-xs text-slate-500">{task.description}</p>
                    </div>
                  </li>
                ))}
              </ol>
      subtitle={`Good to see you, ${displayName}`}
      description="Monitor client health, delivery momentum, and capacity in one place."
      menuSections={AGENCY_DASHBOARD_MENU_SECTIONS}
      activeMenuItem="agency-control-tower"
    >
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {OVERVIEW_METRICS.map((metric) => (
          <div
            key={metric.id}
            className="rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">{metric.label}</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{metric.value}</p>
            <p className="mt-1 text-xs text-slate-500">{metric.helper}</p>
          </div>
        ))}
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Team focus</h2>
              <Link to="/inbox" className="text-sm font-semibold text-accent hover:text-accentDark">
                Post update
              </Link>
            </div>
            <ol className="mt-4 space-y-3">
              {TEAM_NOTES.map((task, index) => (
                <li key={task.id} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{task.title}</p>
                    <p className="text-xs text-slate-500">{task.helper}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Bench signals</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Product design squad</p>
                <p className="mt-2 text-sm text-emerald-700">Under capacity · 24 hours open</p>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Growth marketing pod</p>
                <p className="mt-2 text-sm text-amber-700">Monitor utilisation · 6 hours variance</p>
              </div>
              <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">Engineering guild</p>
                <p className="mt-2 text-sm text-rose-700">Over capacity · triage blockers</p>
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Finance snapshot</h2>
            <ul className="mt-4 space-y-3">
              {FINANCE_SNAPSHOT.map((item) => (
                <li key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{item.value}</p>
                  <p className="text-xs text-slate-500">{item.helper}</p>
                </li>
              ))}
            </ul>
          </div>

            <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-accent/10 via-white to-blue-100 p-6 shadow-soft">
              <h2 className="text-lg font-semibold text-slate-900">Need support?</h2>
              <p className="mt-2 text-sm text-slate-600">
                Coordinate with finance or compliance from your shared operations channel. Our team responds within an hour.
              </p>
              <Link
                to="/inbox"
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
              >
                Message operations
              </Link>
            </div>
          </aside>
        </section>
      </div>
          <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-accent/10 via-white to-blue-100 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Need support?</h2>
            <p className="mt-2 text-sm text-slate-600">
              Finance and compliance can help unblock vendor payouts or contract reviews within the hour.
            </p>
            <Link
              to="/inbox"
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
            >
              Message operations
            </Link>
          </div>
        </aside>
      </section>
    </DashboardLayout>
  );
}
