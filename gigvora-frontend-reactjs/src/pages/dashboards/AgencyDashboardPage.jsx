import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import useSession from '../../hooks/useSession.js';
import { AGENCY_DASHBOARD_MENU_SECTIONS } from '../../constants/agencyDashboardMenu.js';
import { AGENCY_DASHBOARD_MENU } from '../../constants/agencyDashboardMenu.js';
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
import AgencyOverviewSection from '../../components/agency/AgencyOverviewSection.jsx';
import useSession from '../../hooks/useSession.js';
import AgencyDashboardLayout from './agency/AgencyDashboardLayout.jsx';
import { AGENCY_DASHBOARD_MENU } from '../../constants/agencyDashboardMenu.js';
import { AGENCY_OVERVIEW_MENU_SECTIONS } from '../../constants/agencyDashboardMenu.js';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import { AGENCY_DASHBOARD_MENU_SECTIONS } from '../../constants/agencyDashboardMenu.js';

const MENU_SECTIONS = [
  {
    label: 'Agency cockpit',
    items: [
      {
        id: 'agency-overview',
        name: 'Agency overview',
        description: 'Revenue, focus, and team health.',
        sectionId: 'agency-overview',
      },
      {
        id: 'agency-focus',
        name: 'Focus & signals',
        description: 'What the team is working on next.',
        sectionId: 'agency-focus',
      },
    ],
  },
  {
    label: 'Operations',
    items: [
      {
        id: 'agency-disputes',
        name: 'Disputes',
        description: 'Resolve cases fast.',
        href: '/dashboard/agency/disputes',
      },
    ],
  },
];

const AVAILABLE_DASHBOARDS = ['agency', 'company', 'freelancer', 'user'];
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

const AVAILABLE_DASHBOARDS = ['agency', 'company', 'freelancer', 'user'];

function buildProfile(name) {
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return {
    name,
    role: 'Agency leadership workspace',
    initials: initials || 'AG',
    status: 'Monitoring client momentum and bench health',
    badges: ['Control tower'],
    metrics: OVERVIEW_METRICS.map((metric) => ({ label: metric.label, value: metric.value })),
  };
}
const FINANCE_SNAPSHOT = [
  { id: 'run-rate', label: 'Revenue run-rate', value: '$1.84M', helper: '+12% vs last quarter' },
  { id: 'invoiced', label: 'Invoices sent', value: '$310K', helper: 'Awaiting 3 approvals' },
  { id: 'payouts', label: 'Payouts processed', value: '$245K', helper: 'Cleared overnight' },
];

const availableDashboards = ['agency', 'company', 'freelancer', 'user'];

export default function AgencyDashboardPage() {
  const { session } = useSession();
  const displayName = session?.name || session?.firstName || 'Agency team';
  const availableDashboards = ['agency', 'company', 'freelancer', 'user'];
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

  const workspace = {
    name: `${displayName}'s workspace`,
  };

  const profile = buildProfile(displayName);

  return (
    <DashboardLayout
      currentDashboard="agency"
      title={`Hello, ${displayName}`}
      subtitle="Agency control tower"
      description="Track client health, momentum, and resourcing in one view."
      menuSections={AGENCY_DASHBOARD_MENU_SECTIONS}
      availableDashboards={['agency', 'company', 'freelancer', 'user']}
      activeMenuItem="agency-overview"
    >
      <div className="space-y-12">
        <section id="agency-overview" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            {OVERVIEW_METRICS.map((metric) => (
              <div
                key={metric.id}
                className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-soft transition hover:-translate-y-0.5 hover:border-accent/60"
              >
      title="Agency control tower"
      subtitle="Daily visibility across client commitments, bench capacity, and finance health"
      description="Track client health, revenue momentum, and the team’s next actions. Keep the bench balanced and spotlight wins for leadership."
      menuSections={AGENCY_DASHBOARD_MENU_SECTIONS}
      availableDashboards={AVAILABLE_DASHBOARDS}
      profile={profile}
    >
      <div id="agency-home" className="space-y-10">
      subtitle={`Hello, ${displayName}`}
      description="Track client health, revenue momentum, and the team’s next actions."
      menuSections={AGENCY_DASHBOARD_MENU}
      availableDashboards={availableDashboards}
      activeMenuItem="agency-overview"
      adSurface="agency_dashboard"
    >
      <div id="agency-overview" className="mx-auto max-w-6xl space-y-12 px-4 py-10 sm:px-6 lg:px-8">
      subtitle="Orchestrate delivery, growth, and trust"
      description="A single place to align your agency—revenue, delivery, talent, and dispute operations."
      menuSections={MENU_SECTIONS}
      availableDashboards={AVAILABLE_DASHBOARDS}
    >
      <div className="mx-auto max-w-6xl space-y-12 px-4 py-10 sm:px-6 lg:px-8">
        <AgencyOverviewSection displayName={displayName} />

        <section id="agency-dispute-summary" className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Dispute workspace</h2>
              <p className="mt-2 max-w-xl text-sm text-slate-600">Queue, evidence, and escrow controls in one view.</p>
            </div>
            <Link
              to="/dashboard/agency/disputes"
              className="inline-flex items-center gap-2 rounded-full border border-blue-500 bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              Open workspace
            </Link>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              {
                title: 'Queue',
                description: 'Assign, prioritise, and filter without leaving the page.',
              },
              {
                title: 'Evidence',
                description: 'Log events with attachments and full actor history.',
              },
              {
                title: 'Escrow',
                description: 'Release or refund funds directly from the case.',
              },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{item.description}</p>
    <AgencyDashboardLayout
      workspace={workspace}
      menuSections={AGENCY_DASHBOARD_MENU}
      activeMenuItem="agency-overview"
      description="Track client delivery, utilisation, and finance telemetry with actionable next steps."
    >
      <div className="space-y-12">
        <section id="agency-overview" className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">Mission control</p>
                <h1 className="mt-2 text-3xl font-semibold text-slate-900">Hello, {displayName}</h1>
                <p className="mt-3 max-w-2xl text-sm text-slate-600">
                  Keep an eye on client satisfaction, delivery readiness, and revenue pacing from this control panel. Use the
                  quick actions to broadcast updates or assign owners in seconds.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {OVERVIEW_METRICS.map((metric) => (
                  <div
                    key={metric.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50/80 px-5 py-4 shadow-sm"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{metric.label}</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">{metric.value}</p>
                    <p className="text-xs text-slate-500">{metric.hint}</p>
                  </div>
                ))}
    <DashboardLayout
      currentDashboard="agency"
      title="Agency command center"
      subtitle={`Hello, ${displayName}`}
      description="Monitor delivery health, balance your bench, and keep leadership aligned on revenue momentum."
      menuSections={AGENCY_OVERVIEW_MENU_SECTIONS}
      availableDashboards={[
        { id: 'agency', label: 'Agency overview', href: '/dashboard/agency' },
        { id: 'agency-crm', label: 'CRM pipeline', href: '/dashboard/agency/crm' },
        'freelancer',
        'company',
        'user',
      ]}
    >
      <div className="space-y-12">
        <section id="overview-summary" className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
          <p className="text-sm uppercase tracking-[0.4em] text-slate-500">Workspace pulse</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
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
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                to="/dashboard/agency/integrations"
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
              >
                Manage integrations
              </Link>
            </div>
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
              <div key={metric.id} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">{metric.label}</p>
                <p className="mt-3 text-3xl font-semibold text-slate-900">{metric.value}</p>
                <p className="mt-2 text-xs text-slate-500">{metric.hint}</p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                to="/dashboard/agency/escrow"
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
              >
                Open escrow mission control
              </Link>
              <Link
                to="/inbox"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-accent hover:text-accent"
              >
                Broadcast update
              </Link>
            </div>
          </div>
        </section>

        <section id="team-focus" className="grid gap-8 lg:grid-cols-[1.35fr_1fr]">

        <section id="agency-projects" className="grid gap-8 lg:grid-cols-[1.35fr_1fr]">

        <section className="grid gap-8 lg:grid-cols-[1.35fr_1fr]">
          <div className="space-y-8">
            <div id="overview-team-focus" className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Team focus</h2>
                  <p className="mt-1 text-sm text-slate-500">Share the priorities anchoring this week’s stand-up.</p>
                </div>
                <Link to="/inbox" className="text-sm font-semibold text-accent transition hover:text-accentDark">
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

        <div className="grid gap-8 lg:grid-cols-[1.35fr_1fr]">
        <section className="grid gap-8 lg:grid-cols-[1.35fr_1fr]">
          <div className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft" aria-labelledby="team-focus-heading">
              <div className="flex items-center justify-between">
                <h2 id="team-focus-heading" className="text-xl font-semibold text-slate-900">
                  Team focus
                </h2>
                <Link to="/inbox" className="text-sm font-semibold text-accent hover:text-accentDark">
                  Assign owner
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
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft" aria-labelledby="bench-signals-heading">
              <h2 id="bench-signals-heading" className="text-xl font-semibold text-slate-900">
                Bench signals
              </h2>
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

            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
              <h2 className="text-xl font-semibold text-slate-900">Bench capacity</h2>
            <div id="overview-bench-signals" className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
              <h2 className="text-xl font-semibold text-slate-900">Bench signals</h2>
              <p className="mt-1 text-sm text-slate-500">Use pod utilisation to plan rotations or accelerate sales outreach.</p>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-slate-50 px-4 py-3">
                  <p className="text-sm text-slate-600">Product design squad</p>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Under capacity</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-slate-50 px-4 py-3">
                  <p className="text-sm text-slate-600">Growth marketing</p>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">Monitor</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-slate-50 px-4 py-3">
                  <p className="text-sm text-slate-600">Engineering guild</p>
                  <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">Over capacity</span>
                </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Bench signals</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Product design squad</p>
                <p className="mt-2 text-sm text-emerald-700">Under capacity · 24 hours open</p>
              </div>
            </section>
              <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Growth marketing pod</p>
                <p className="mt-2 text-sm text-amber-700">Monitor utilisation · 6 hours variance</p>
              </div>
              <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">Engineering guild</p>
                <p className="mt-2 text-sm text-rose-700">Over capacity · triage blockers</p>
              </div>
            ))}
          </div>
        </div>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft" aria-labelledby="finance-snapshot-heading">
              <h2 id="finance-snapshot-heading" className="text-lg font-semibold text-slate-900">
                Finance snapshot
              </h2>
          <aside className="space-y-8">
            <div id="overview-finance" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
              <h2 className="text-lg font-semibold text-slate-900">Finance snapshot</h2>
              <ul className="mt-4 space-y-3">
                {FINANCE_SUMMARY.map((item) => (
                  <li key={item.id} className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">{item.value}</p>
                    <p className="text-xs text-slate-500">{item.hint}</p>
                  </li>
                ))}
              </ul>
            </section>
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

            <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-accent/10 via-white to-blue-100 p-6 shadow-soft" aria-labelledby="support-heading">
              <h2 id="support-heading" className="text-lg font-semibold text-slate-900">
                Need support?
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Finance and compliance respond within one hour. Flag blockers and we will unblock contracts, payouts, or vendor checks fast.
                Coordinate with finance or compliance from your shared operations channel. Our team responds within an hour.
              </p>
              <Link
                to="/inbox"
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
              >
                Message operations
              </Link>
            </section>
          </aside>
        </div>
      </div>
        </section>

        <section id="agency-compliance" className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Compliance pulses</h2>
              <p className="text-sm text-slate-600">
                Stay audit ready with the latest contract renewals, NDAs, and KYC refresh tasks.
              </p>
            </div>
            <Link to="/trust-center" className="text-sm font-semibold text-accent hover:text-accentDark">
              View trust center
            </Link>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">KYC refresh</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">4 vendors</p>
              <p className="text-xs text-slate-500">Due this week</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Contracts expiring</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">3 retainers</p>
              <p className="text-xs text-slate-500">Renew before Friday</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Security attestations</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">SOC 2 draft</p>
              <p className="text-xs text-slate-500">In review with compliance</p>
            </div>
          </div>
        </section>

        <section id="agency-automation" className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Automation experiments</h2>
              <p className="text-sm text-slate-600">Review queue automations, AI summaries, and partner hand-offs ready to enable.</p>
            </div>
            <Link to="/auto-assign" className="text-sm font-semibold text-accent hover:text-accentDark">
              Manage auto-assign
            </Link>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">Escalation routing</p>
              <p className="mt-2 text-xs text-slate-500">Pilot automation for support tickets that touch finance or contracts.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">AI project recaps</p>
              <p className="mt-2 text-xs text-slate-500">Summaries posted in #client-wins every Friday at 4pm.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">Bench nudges</p>
              <p className="mt-2 text-xs text-slate-500">Automated alerts when utilisation drops below 60% for any squad.</p>
            </div>
          </div>
        </section>
      </div>
    </AgencyDashboardLayout>
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
