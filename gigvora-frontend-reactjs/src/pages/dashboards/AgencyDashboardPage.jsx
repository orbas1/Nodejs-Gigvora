import { useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import useSession from '../../hooks/useSession.js';
import { AGENCY_DASHBOARD_MENU_SECTIONS } from '../../constants/agencyDashboardMenu.js';
import OverviewSection from './agency/sections/OverviewSection.jsx';
import { useAgencyOverview } from '../../hooks/useAgencyOverview.js';

const sections = [
  {
    id: 'agency-overview',
      title: 'Home',
      description: 'Daily snapshot',
    },
  ];

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AgencyProfileWorkspace from '../../components/dashboard/agency/AgencyProfileWorkspace.jsx';
import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import useSession from '../../hooks/useSession.js';
import AgencyIdVerificationSection from '../../components/agency/id-verification/AgencyIdVerificationSection.jsx';
import { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import useSession from '../../hooks/useSession.js';
import { fetchAgencyDashboard } from '../../services/agency.js';
import AgencyOverviewPanel from './agency/AgencyOverviewPanel.jsx';
import AgencyAdsManagementPanel from './agency/AgencyAdsManagementPanel.jsx';

const menuSections = [
  {
    id: 'main',
    label: 'Main',
    items: [
      { id: 'overview', name: 'Overview', sectionId: 'agency-overview' },
      { id: 'ads', name: 'Ads', sectionId: 'agency-ads' },
import useSession from '../../hooks/useSession.js';
import AgencyDashboardLayout from './agency/AgencyDashboardLayout.jsx';
import AgencyOverview from './agency/AgencyOverview.jsx';
import { useMemo } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import CreationStudioSection from '../../components/agencyCreationStudio/CreationStudioSection.jsx';
import { AGENCY_DASHBOARD_MENU_SECTIONS } from '../../constants/agencyDashboardMenu.js';
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
import useSession from '../../hooks/useSession.js';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import AgencyOverviewContent from '../../components/agency/AgencyOverviewContent.jsx';
import { AGENCY_AVAILABLE_DASHBOARDS, AGENCY_DASHBOARD_MENU } from '../../constants/agencyDashboardMenu.js';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import useSession from '../../hooks/useSession.js';
import AgencyDashboardSidebar from '../../components/dashboard/agency/AgencyDashboardSidebar.jsx';
import MentoringSessionManagement from '../../components/dashboard/agency/MentoringSessionManagement.jsx';
import { AGENCY_DASHBOARD_MENU_SECTIONS } from '../../constants/agencyDashboardMenu.js';

const OVERVIEW_METRICS = [
  { id: 'clients', label: 'Clients', value: 18, hint: '4 onboarding' },
  { id: 'projects', label: 'Projects', value: 42, hint: '8 in kickoff' },
  { id: 'talent', label: 'Bench', value: '63%', hint: '120 hours open' },
  { id: 'clients', label: 'Active clients', value: 18, hint: '4 onboarding this month' },
  { id: 'projects', label: 'Managed projects', value: 42, hint: '8 in kickoff' },
  { id: 'talent', label: 'Bench capacity', value: '63%', hint: '120 hours open' },
];
import { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import DataStatus from '../../components/DataStatus.jsx';
import useSession from '../../hooks/useSession.js';
import useAgencyDashboard from '../../hooks/useAgencyDashboard.js';
import useProjectGigManagement from '../../hooks/useProjectGigManagement.js';
import useGigOrderDetail from '../../hooks/useGigOrderDetail.js';
import { MENU_GROUPS, AVAILABLE_DASHBOARDS } from './agency/menuConfig.js';
import {
  GigManagementSection,
  GigTimelineSection,
  GigCreationSection,
  OpenGigsSection,
  ClosedGigsSection,
  GigSubmissionsSection,
  GigChatSection,
} from './agency/sections/index.js';

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
const TEAM_TASKS = [
  { id: 'advocacy', title: 'Client sync', description: 'Check health scores and follow-ups.' },
  { id: 'payments', title: 'Finance sweep', description: 'Approve payouts and invoices.' },
  { id: 'growth', title: 'Pipeline huddle', description: 'Confirm demos and outreach.' },
];

const BENCH_SIGNALS = [
  { id: 'design', label: 'Design pod', tone: 'emerald', status: 'Room to book' },
  { id: 'marketing', label: 'Growth squad', tone: 'amber', status: 'Watch load' },
  { id: 'engineering', label: 'Build team', tone: 'rose', status: 'At limit' },
];

const BENCH_TONE_CLASSES = {
  emerald: 'bg-emerald-100 text-emerald-700',
  amber: 'bg-amber-100 text-amber-700',
  rose: 'bg-rose-100 text-rose-700',
};

const FINANCE_SUMMARY = [
  { id: 'run-rate', label: 'Run rate', value: '$1.84M', hint: '+12% QoQ' },
  { id: 'invoiced', label: 'Invoiced', value: '$310K', hint: '3 awaiting sign-off' },
  { id: 'payouts', label: 'Payouts', value: '$245K', hint: 'Cleared overnight' },
  { id: 'advocacy', title: 'Client sync', hint: 'Review NPS and set follow-ups.' },
  { id: 'payments', title: 'Finance check', hint: 'Clear payouts and vendor bills.' },
  { id: 'growth', title: 'Growth standup', hint: 'Align on next demo targets.' },
const DEFAULT_SECTION = 'manage';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import useSession from '../../hooks/useSession.js';
import { AGENCY_DASHBOARD_MENU_SECTIONS, AGENCY_DASHBOARD_ALTERNATES } from './agency/menuConfig.js';
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

const AVAILABLE_DASHBOARDS = ['agency', 'company', 'freelancer', 'user', 'headhunter'];

export default function AgencyDashboardPage() {
  const { session } = useSession();
  const displayName = useMemo(() => session?.name || session?.firstName || 'Agency team', [session]);
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

const MENU_SECTIONS = [
  {
    label: 'Ops',
    items: [
      {
        name: 'Control',
        sectionId: 'agency-overview',
      },
      {
        name: 'Bench',
        sectionId: 'agency-bench',
      },
    ],
  },
  {
    label: 'Talent',
    items: [
      {
        name: 'Jobs',
        href: '/dashboard/agency/job-management',
      },
    ],
  },
];
const availableDashboards = ['agency', 'company', 'freelancer', 'user'];

const availableDashboards = ['agency', 'company', 'freelancer', 'user'];

function normalizeRoles(memberships = []) {
  return memberships.map((role) => `${role}`.toLowerCase());
}

export default function AgencyDashboardPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { session, isAuthenticated } = useSession();

  const memberships = useMemo(() => normalizeRoles(session?.memberships ?? session?.roles ?? []), [session?.memberships, session?.roles]);
  const isAgencyMember = memberships.some((role) => ['agency', 'agency_admin', 'admin'].includes(role));
  const canManageOverview = memberships.some((role) => ['agency_admin', 'admin'].includes(role));

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    if (!isAgencyMember) {
      const fallback = session?.primaryDashboard || memberships.find((role) => role !== 'agency') || 'user';
      navigate(`/dashboard/${fallback}`, { replace: true });
    }
  }, [isAuthenticated, isAgencyMember, navigate, session?.primaryDashboard, memberships]);

  const workspaceIdParam = searchParams.get('workspaceId');
  const workspaceSlugParam = searchParams.get('workspaceSlug');

  const {
    data,
    loading,
    error,
    fromCache,
    lastUpdated,
    refresh,
    save,
    saving,
  } = useAgencyOverview({
    workspaceId: workspaceIdParam,
    workspaceSlug: workspaceSlugParam,
    enabled: isAuthenticated && isAgencyMember,
  });

  useEffect(() => {
    const selectedWorkspaceId = data?.meta?.selectedWorkspaceId;
    if (!workspaceIdParam && selectedWorkspaceId) {
      setSearchParams((previous) => {
        const next = new URLSearchParams(previous);
        next.set('workspaceId', `${selectedWorkspaceId}`);
        next.delete('workspaceSlug');
        return next;
      }, { replace: true });
    }
  }, [data?.meta?.selectedWorkspaceId, setSearchParams, workspaceIdParam]);

  const workspaceOptions = data?.meta?.availableWorkspaces ?? [];
  const selectedWorkspaceId = workspaceIdParam || (data?.workspace?.id ? `${data.workspace.id}` : workspaceOptions[0]?.id ?? '');

  const handleWorkspaceChange = (event) => {
    const nextId = event.target.value;
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);
      if (nextId) {
        next.set('workspaceId', nextId);
        next.delete('workspaceSlug');
      } else {
        next.delete('workspaceId');
      }
      return next;
    }, { replace: true });
  };

  const overview = data?.overview ?? null;
  const workspace = data?.workspace ?? null;

  return (
    <DashboardLayout
      currentDashboard="agency"
      title="Agency"
      subtitle={workspace?.name || 'Home'}
      description="Daily snapshot"
      menuSections={AGENCY_DASHBOARD_MENU_SECTIONS}
      sections={sections}
      availableDashboards={availableDashboards}
      activeMenuItem="home"
      adSurface="agency_dashboard"
    >
      <div className="space-y-10">
        <OverviewSection
          overview={overview}
          workspace={workspace}
          loading={loading}
          error={error}
          onRefresh={refresh}
          fromCache={fromCache}
          lastUpdated={lastUpdated}
          onSave={save}
          saving={saving}
          canManage={canManageOverview}
          workspaceOptions={workspaceOptions}
          selectedWorkspaceId={selectedWorkspaceId}
          onWorkspaceChange={workspaceOptions.length > 1 ? handleWorkspaceChange : undefined}
          currentDate={data?.currentDate}
        />
      </div>
const sections = [
  { id: 'agency-overview', label: 'Overview' },
  { id: 'agency-ads', label: 'Ads' },
];
const availableDashboards = ['agency', 'company', 'freelancer', 'user', 'mentor', 'headhunter'];

const availableDashboards = ['agency', 'company', 'user', 'freelancer'];

const AVAILABLE_DASHBOARDS = ['agency', 'company', 'headhunter', 'user'];

function parseWorkspaceId(value) {
  if (!value) {
    return undefined;
  }
  const numeric = Number.parseInt(value, 10);
  if (!Number.isFinite(numeric)) {
    return undefined;
  }
  return numeric;
}

const NAV_ITEMS = [
  {
    id: 'profile',
    label: 'Profile',
  },
  {
    id: 'control-tower',
    label: 'Ops',
  },
];

function ControlTowerSection() {
  return (
    <div className="space-y-8">
      <section className="space-y-6">
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
      </section>

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
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
            <h2 className="text-xl font-semibold text-slate-900">Bench signals</h2>
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
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
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
          </div>

          <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-accent/10 via-white to-blue-100 p-6 shadow-soft">
            <h2 className="text-lg font-semibold text-slate-900">Need support?</h2>
            <p className="mt-2 text-sm text-slate-600">
              Coordinate with finance or compliance in the shared channel. We’ll help unblock vendors, approvals, or contract questions within the hour.
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
  );
}

export default function AgencyDashboardPage() {
  const { session } = useSession();
  const [searchParams] = useSearchParams();
  const workspaceIdParam = searchParams.get('workspaceId');
  const workspaceSlug = searchParams.get('workspaceSlug') ?? undefined;

  const workspaceId = useMemo(() => parseWorkspaceId(workspaceIdParam), [workspaceIdParam]);
  const [activeMenuItem, setActiveMenuItem] = useState('overview');
  const [dashboardData, setDashboardData] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState(null);

  const loadDashboard = useCallback(async () => {
    setDashboardLoading(true);
    setDashboardError(null);
    try {
      const response = await fetchAgencyDashboard();
      setDashboardData(response);
    } catch (error) {
      console.error('Failed to load agency dashboard', error);
      setDashboardError(error);
    } finally {
      setDashboardLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const workspace = useMemo(() => {
    return dashboardData?.workspace ?? dashboardData?.meta?.workspace ?? null;
  }, [dashboardData]);

  const displayName = useMemo(() => {
    return session?.name || session?.firstName || 'Agency team';
  }, [session]);

  const handleMenuItemSelect = useCallback(
    (itemId) => {
      setActiveMenuItem(itemId);
      const targetId = itemId === 'overview' ? 'agency-overview' : itemId === 'ads' ? 'agency-ads' : itemId;
      if (typeof window !== 'undefined') {
        const target = document.getElementById(targetId);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    },
    [],
  );

  return (
    <DashboardLayout
      currentDashboard="agency"
      title="Agency Control Tower"
      subtitle={`Welcome back, ${displayName}`}
      description="Monitor operations, steer growth initiatives, and manage campaigns without leaving the workspace."
      menuSections={menuSections}
      sections={sections}
      availableDashboards={availableDashboards}
      activeMenuItem={activeMenuItem}
      onMenuItemSelect={handleMenuItemSelect}
      adSurface="agency_dashboard"
    >
      <div className="space-y-10">
        <AgencyOverviewPanel
          data={dashboardData}
          loading={dashboardLoading}
          error={dashboardError}
          onRefresh={loadDashboard}
        />
        <AgencyAdsManagementPanel workspace={workspace} />
      </div>
  const displayName = useMemo(() => session?.name ?? session?.firstName ?? 'Agency team', [session]);
  const [activeSection, setActiveSection] = useState(DEFAULT_SECTION);

  const {
    data: agencyDashboard,
    loading: agencyLoading,
    error: agencyError,
    refresh: refreshAgency,
  } = useAgencyDashboard();

  const ownerId = agencyDashboard?.workspace?.ownerId ?? session?.id ?? null;

  const {
    data: projectGigData,
    loading: projectLoading,
    error: projectError,
    actions: projectActions,
    reload: reloadProject,
  } = useProjectGigManagement(ownerId);

  const orders = useMemo(() => projectGigData?.purchasedGigs?.orders ?? [], [projectGigData]);

  const [selectedOrderId, setSelectedOrderId] = useState(() => (orders.length ? orders[0].id : null));
  useEffect(() => {
    if (!orders.length) {
      setSelectedOrderId(null);
      return;
    }
    if (selectedOrderId == null) {
      setSelectedOrderId(orders[0].id);
      return;
    }
    const match = orders.find((order) => order.id === selectedOrderId);
    if (!match) {
      setSelectedOrderId(orders[0].id);
    }
  }, [orders, selectedOrderId]);

  const {
    data: orderDetail,
    loading: orderLoading,
    error: orderError,
    actions: orderActions,
    refresh: refreshOrder,
    pendingAction,
  } = useGigOrderDetail(ownerId, selectedOrderId);

  const [creatingGig, setCreatingGig] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  const handleRefresh = useCallback(async () => {
    await Promise.all([refreshAgency(), reloadProject()]);
    if (selectedOrderId) {
      await refreshOrder();
    }
  }, [refreshAgency, reloadProject, refreshOrder, selectedOrderId]);

  const handleCreateGig = useCallback(
    async (payload) => {
      if (!projectActions?.createGigOrder) return;
      setCreatingGig(true);
      try {
        const response = await projectActions.createGigOrder(payload);
        await handleRefresh();
        if (response?.order?.id) {
          setSelectedOrderId(response.order.id);
        }
      } finally {
        setCreatingGig(false);
      }
    },
    [projectActions, handleRefresh],
  );

  const handleUpdateOrder = useCallback(
    async (orderId, payload) => {
      if (!projectActions?.updateGigOrder) return;
      setUpdatingOrderId(orderId);
      try {
        await projectActions.updateGigOrder(orderId, payload);
        await refreshOrder();
      } finally {
        setUpdatingOrderId(null);
      }
    },
    [projectActions, refreshOrder],
  );

  const handleReopenOrder = useCallback(
    async (order) => {
      if (!order || !projectActions?.updateGigOrder) return;
      const fallback = order.dueAt ? new Date(order.dueAt) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const normalized = new Date(fallback.getFullYear(), fallback.getMonth(), fallback.getDate())
        .toISOString()
        .slice(0, 10);
      setUpdatingOrderId(order.id);
      try {
        await projectActions.updateGigOrder(order.id, {
          status: 'in_delivery',
          dueAt: normalized,
          progressPercent: order.progressPercent ?? 0,
        });
        setActiveSection('open-gigs');
        setSelectedOrderId(order.id);
        await refreshOrder();
      } finally {
        setUpdatingOrderId(null);
      }
    },
    [projectActions, refreshOrder],
  );

  const handleAddTimelineEvent = useCallback(
    (payload) => orderActions.addTimelineEvent?.(payload),
    [orderActions],
  );

  const handleCreateSubmission = useCallback(
    (payload) => orderActions.createSubmission?.(payload),
    [orderActions],
  );

  const handleUpdateSubmission = useCallback(
    (submissionId, payload) => orderActions.updateSubmission?.(submissionId, payload),
    [orderActions],
  );

  const handleSendMessage = useCallback(
    (payload) => orderActions.sendMessage?.(payload),
    [orderActions],
  );

  const handleAcknowledgeMessage = useCallback(
    (messageId) => orderActions.acknowledgeMessage?.(messageId),
    [orderActions],
  );

  const studioInsights = agencyDashboard?.operations?.gigPrograms?.studio ?? {};
  const pageLoading = agencyLoading || projectLoading;
  const displayName = session?.name || session?.firstName || 'agency team';
  const anyError = agencyError || projectError || orderError;

  const renderSection = () => {
    switch (activeSection) {
      case 'manage':
        return (
          <GigManagementSection
            summary={studioInsights.summary}
            deliverables={studioInsights.deliverables}
            orders={orders}
            selectedOrderId={selectedOrderId}
            onSelectOrder={setSelectedOrderId}
            onRefresh={handleRefresh}
            loading={pageLoading || orderLoading}
            detail={orderDetail}
          />
        );
      case 'timeline':
        return (
          <GigTimelineSection
            orderDetail={orderDetail}
            onAddEvent={handleAddTimelineEvent}
            loading={orderLoading}
            pending={pendingAction}
          />
        );
      case 'build':
        return (
          <GigCreationSection
            onCreate={handleCreateGig}
            creating={creatingGig}
            defaultCurrency={agencyDashboard?.workspace?.defaultCurrency ?? 'USD'}
            onCreated={handleRefresh}
          />
        );
      case 'open':
        return (
          <OpenGigsSection
            orders={orders}
            onUpdateOrder={handleUpdateOrder}
            updatingOrderId={updatingOrderId}
          />
        );
      case 'closed':
        return (
          <ClosedGigsSection
            orders={orders}
            onReopen={handleReopenOrder}
            updatingOrderId={updatingOrderId}
          />
        );
      case 'proofs':
        return (
          <GigSubmissionsSection
            orderDetail={orderDetail}
            onCreateSubmission={handleCreateSubmission}
            onUpdateSubmission={handleUpdateSubmission}
            pending={pendingAction}
          />
        );
      case 'chat':
        return (
          <GigChatSection
            orderDetail={orderDetail}
            onSendMessage={handleSendMessage}
            onAcknowledgeMessage={handleAcknowledgeMessage}
            pending={pendingAction}
          />
        );
      default:
        return null;
    }
  };
  const displayName = session?.name || session?.firstName || 'Agency team';
  const [activeSection, setActiveSection] = useState('profile');

  const navigationItems = useMemo(() => NAV_ITEMS, []);
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

  const sidebarSections = [
    { id: 'agency-overview', label: 'Overview' },
    { id: 'agency-focus', label: 'Focus' },
    { id: 'agency-bench', label: 'Bench' },
    { id: 'agency-finance', label: 'Finance' },
    { href: '/dashboard/agency/mentoring', label: 'Mentor' },
  ];

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
      title="Agency control tower"
      subtitle={`Hello, ${displayName}`}
      description="Track client health, revenue momentum, compliance guardrails, and the team’s next actions."
      menuSections={AGENCY_DASHBOARD_MENU_SECTIONS}
      availableDashboards={AVAILABLE_DASHBOARDS}
    >
      <div className="space-y-16">
        <section
          id="agency-overview"
          className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12 space-y-10"
        >
          <header className="flex flex-col gap-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
            <div>
              <p className="text-sm uppercase tracking-[0.4em] text-slate-500">Agency control tower</p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900">Hello, {displayName}</h1>
              <p className="mt-3 max-w-3xl text-sm text-slate-600">
                Track client health, revenue momentum, and the team’s next actions. Keep the bench balanced and highlight wins to
                leadership.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {OVERVIEW_METRICS.map((metric) => (
                <div
                  key={metric.id}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-inner transition hover:-translate-y-0.5 hover:border-accent/60"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">{metric.label}</p>
                  <p className="mt-3 text-3xl font-semibold text-slate-900">{metric.value}</p>
                  <p className="mt-2 text-xs text-slate-500">{metric.hint}</p>
    <AgencyDashboardLayout activeItem="overview">
      <AgencyOverview displayName={displayName} />
    </AgencyDashboardLayout>
    <DashboardLayout
      currentDashboard="agency"
      title="Agency hub"
      subtitle="Operate launches, teams, and cash flow"
      description=""
      menuSections={AGENCY_DASHBOARD_MENU_SECTIONS}
      availableDashboards={availableDashboards}
    >
      <div className="mx-auto w-full max-w-7xl space-y-12 px-6 py-10">
        <section id="agency-overview" className="space-y-6">
          <div className="flex flex-col gap-2">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Welcome</p>
            <h1 className="text-3xl font-semibold text-slate-900">Hello, {displayName}</h1>
            <p className="max-w-2xl text-sm text-slate-600">Your live pulse on clients, delivery, launches, and cash.</p>
      title="Agency control tower"
      subtitle="Client success & bench management"
      description="Track client health, revenue momentum, and the team’s next actions. Keep the bench balanced and highlight wins to leadership."
      menuSections={MENU_SECTIONS}
      availableDashboards={['agency', 'user', 'freelancer', 'company', 'headhunter']}
    >
      <section id="agency-overview" className="space-y-12">
        <header className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
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
      title="Agency control tower"
      subtitle="Visibility across clients, teams, and delivery."
      description="Monitor delivery, balance the bench, and collaborate with clients in real time."
      menuSections={AGENCY_DASHBOARD_MENU}
      availableDashboards={AGENCY_AVAILABLE_DASHBOARDS}
      activeMenuItem="agency-overview"
    >
      <AgencyOverviewContent displayName={displayName} />
      title={`Hello, ${displayName}`}
      subtitle="Agency control tower"
      description="Track client health, delivery posture, and finance momentum so pods stay aligned and proactive."
      menuSections={AGENCY_DASHBOARD_MENU_SECTIONS}
      availableDashboards={AVAILABLE_DASHBOARDS}
      activeMenuItem="overview"
    >
      <div className="space-y-12">
        <section>
      title="Agency command center"
      subtitle="Control tower for growth, delivery, and finance"
      description="Keep your clients delighted, balance the bench, and unblock the team with one connected workspace."
      menuSections={AGENCY_DASHBOARD_MENU_SECTIONS}
      availableDashboards={AGENCY_DASHBOARD_ALTERNATES}
      activeMenuItem="agency-overview"
      title="Agency Hub"
      subtitle={`Hello ${displayName.split(' ')[0] ?? displayName}`}
      description="Run gigs end-to-end."
      menuSections={MENU_GROUPS}
      availableDashboards={AVAILABLE_DASHBOARDS}
      activeMenuItem={activeSection}
      onMenuItemSelect={(itemId) => setActiveSection(itemId)}
    >
      <div className="mx-auto w-full max-w-7xl space-y-10 px-8 py-10">
        {anyError ? (
          <DataStatus
            status="error"
            title="Unable to load gigs"
            message={agencyError?.message || projectError?.message || orderError?.message}
            onRetry={handleRefresh}
          />
        ) : null}
        {pageLoading && !orders.length && !studioInsights.summary ? (
          <DataStatus status="loading" title="Loading" />
        ) : null}
        {renderSection()}
      </div>
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
      <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-6">
      <div className="mx-auto max-w-6xl px-4 pt-12 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-10">
          <AgencyDashboardSidebar sections={sidebarSections} />
          <div className="space-y-10">
            <section id="agency-overview" className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.4em] text-slate-500">Agency control tower</p>
                  <h1 className="mt-2 text-3xl font-semibold text-slate-900">Hello, {displayName}</h1>
                  <p className="mt-3 max-w-3xl text-sm text-slate-600">
                    Track health at a glance and jump straight into the work that needs attention.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  {OVERVIEW_METRICS.map((metric) => (
                    <div
                      key={metric.id}
                      className="rounded-3xl border border-slate-200 bg-slate-50 p-6 transition hover:-translate-y-0.5 hover:border-accent/60"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">{metric.label}</p>
                      <p className="mt-3 text-3xl font-semibold text-slate-900">{metric.value}</p>
                      <p className="mt-2 text-xs text-slate-500">{metric.hint}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section id="agency-focus" className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900">Focus</h2>
                <Link to="/inbox" className="text-sm font-semibold text-accent hover:text-accentDark">
                  Update
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-8">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Agency</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Hello, {displayName}</h1>
            <p className="mt-3 max-w-3xl text-sm text-slate-600">
              Track client health, revenue momentum, and the team’s next actions. Keep the bench balanced and highlight wins to leadership.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {OVERVIEW_METRICS.map((metric) => (
                <div
                  key={metric.id}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-soft transition hover:-translate-y-0.5 hover:border-accent/60"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">{metric.label}</p>
                  <p className="mt-3 text-3xl font-semibold text-slate-900">{metric.value}</p>
                  <p className="mt-2 text-xs text-slate-500">{metric.hint}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="project-operations" className="grid gap-8 lg:grid-cols-[1.35fr_1fr]">
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

        <CreationStudioSection />

        <section id="team-focus" className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">Team focus</h2>
              <span className="text-xs uppercase tracking-wide text-slate-400">Weekly rhythm</span>
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

        <div className="mt-10 grid gap-8 lg:grid-cols-[260px_1fr]">
          <aside>
            <nav className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <ul className="space-y-2">
                {navigationItems.map((item) => {
                  const isActive = activeSection === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => setActiveSection(item.id)}
                        aria-current={isActive ? 'page' : undefined}
                        className={`w-full rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                          isActive
                            ? 'border-accent bg-accent/10 text-accent'
                            : 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        {item.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </aside>

          <main className="space-y-10">
            {activeSection === 'profile' ? <AgencyProfileWorkspace /> : null}
            {activeSection === 'control-tower' ? <ControlTowerSection /> : null}
          </main>
        </div>
        <div className="grid gap-8 lg:grid-cols-[1.35fr_1fr]">
        <section className="grid gap-8 lg:grid-cols-[1.35fr_1fr]">
          <div className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft" aria-labelledby="team-focus-heading">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900">Team focus</h2>
                <Link to="/dashboard/agency/inbox" className="text-sm font-semibold text-accent hover:text-accentDark">
                  Share update
                <h2 id="team-focus-heading" className="text-xl font-semibold text-slate-900">
                  Team focus
                </h2>
                <Link to="/inbox" className="text-sm font-semibold text-accent hover:text-accentDark">
                  Assign owner
                </Link>
              </div>
              <ol className="mt-6 grid gap-4 sm:grid-cols-3">
                {TEAM_TASKS.map((task, index) => (
                  <li key={task.id} className="flex flex-col gap-2 rounded-2xl border border-slate-200/70 bg-slate-50 p-4">
                    <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                      <span>{String(index + 1).padStart(2, '0')}</span>
                      <span>Today</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">{task.title}</p>
                    <p className="text-xs text-slate-500">{task.hint}</p>
                  </li>
                ))}
              </ol>
            </section>

            <section id="agency-bench" className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
              <h2 className="text-xl font-semibold text-slate-900">Bench</h2>

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

          <div id="bench-signals" className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
            <h2 className="text-xl font-semibold text-slate-900">Bench signals</h2>
            <div className="mt-4 space-y-3">
              {BENCH_SIGNALS.map((signal) => (
                <div
                  key={signal.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-slate-50 px-4 py-3"
                >
                  <p className="text-sm text-slate-600">{signal.label}</p>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      BENCH_TONE_CLASSES[signal.tone] ?? 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {signal.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="finance-snapshot" className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            <h2 className="text-lg font-semibold text-slate-900">Finance snapshot</h2>
            <ul className="mt-4 space-y-3">
              {FINANCE_SUMMARY.map((item) => (
                <li key={item.id} className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{item.value}</p>
                  <p className="text-xs text-slate-500">{item.hint}</p>
            <div id="agency-bench" className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
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
              ))}
            </div>
          </header>

          <div className="grid gap-8 lg:grid-cols-[1.35fr_1fr]">
            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-slate-900">Team focus</h2>
                  <Link to="/inbox" className="text-sm font-semibold text-accent transition hover:text-accentDark">
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
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
                <h2 className="text-xl font-semibold text-slate-900">Bench signals</h2>
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
                </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Bench signals</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Product design squad</p>
                <p className="mt-2 text-sm text-emerald-700">Under capacity · 24 hours open</p>
              </div>
            </div>

            <aside className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
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
              </div>

              <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-accent/10 via-white to-blue-100 p-6 shadow-soft">
                <h2 className="text-lg font-semibold text-slate-900">Need support?</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Coordinate with finance or compliance in the shared channel. We’ll help unblock vendors, approvals, or contract
                  questions within the hour.
                </p>
                <Link
                  to="/inbox"
                  className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                >
                  Message operations
                </Link>
              </div>
            </aside>
          </div>
        </section>

        <AgencyIdVerificationSection workspaceId={workspaceId} workspaceSlug={workspaceSlug} />
      </div>
            </section>

            <section id="agency-finance" className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
              <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
                <h2 className="text-xl font-semibold text-slate-900">Finance</h2>
                <ul className="mt-4 space-y-3">
                  {FINANCE_SUMMARY.map((item) => (
                    <li key={item.id} className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                      <p className="mt-1 text-lg font-semibold text-slate-900">{item.value}</p>
                      <p className="text-xs text-slate-500">{item.hint}</p>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-accent/10 via-white to-blue-100 p-6 shadow-soft">
                <h2 className="text-lg font-semibold text-slate-900">Need support?</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Coordinate with finance or compliance in the shared channel. We’ll help unblock vendors, approvals, or contract
                  questions within the hour.
                </p>
                <Link
                  to="/inbox"
                  className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                >
                  Message operations
                </Link>
              </div>
            </section>

            <MentoringSessionManagement />
          </div>
        </div>
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
          <aside className="space-y-6">
            <div id="finance-oversight" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
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
          <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-accent/10 via-white to-blue-100 p-6 shadow-soft">
            <h2 className="text-lg font-semibold text-slate-900">Need support?</h2>
            <p className="mt-2 text-sm text-slate-600">Ping ops for finance or compliance help in the shared channel.</p>
            <a
              href="/inbox"
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
            >
              Message operations
            </a>
          </div>
        </section>

        <section id="marketplace-leadership" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Marketplace leadership</h2>
              <p className="text-sm text-slate-600">Quick checks on studios, partners, advocacy, and automation.</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">Pulse report</span>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">Studio pipeline</p>
              <p className="mt-1 text-xs text-slate-500">13 briefs in discovery · 6 awaiting client approval</p>
            </div>
            <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">Advocacy flywheel</p>
              <p className="mt-1 text-xs text-slate-500">5 stories ready for spotlight · 9 referrals pending nurture</p>
            </div>
            <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">Partner programs</p>
              <p className="mt-1 text-xs text-slate-500">4 alliances activated · 3 in due diligence</p>
            </div>
            <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">Marketing automation</p>
              <p className="mt-1 text-xs text-slate-500">Next campaign: Launchpad momentum · send scheduled tomorrow</p>
            </div>
          </div>
        </section>

        <section id="ads-operations" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Gigvora ads</h2>
              <p className="text-sm text-slate-600">Track pacing, tests, and channel mix for paid work.</p>
            </div>
            <a
              href="/dashboard/agency#creation-studio"
              className="text-xs font-semibold text-accent transition hover:text-accentDark"
            >
              Manage placements
            </a>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Active campaigns</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">7</p>
              <p className="text-xs text-slate-500">3 prospecting · 4 retargeting</p>
            </div>
            <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Spend this week</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">$8.4K</p>
              <p className="text-xs text-slate-500">32% pacing vs budget</p>
            </div>
            <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Top performer</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">Launchpad success carousel</p>
              <p className="text-xs text-slate-500">CTR 4.2% · CPL $38</p>
            </div>
          </div>
        </section>

        <section id="projects-workspace" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold text-slate-900">Project workspaces</h2>
            <p className="text-sm text-slate-600">
              Monitor delivery pods, dependencies, and client experience. Surface risks before they become blockers.
            </p>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">In delivery</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">24</p>
              <p className="text-xs text-slate-500">3 marked at risk</p>
            </div>
            <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Next retros</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">5</p>
              <p className="text-xs text-slate-500">Auto-generated for Friday</p>
            </div>
            <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Budget in play</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">$420K</p>
              <p className="text-xs text-slate-500">Spending velocity on track</p>

            <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-accent/10 via-white to-blue-100 p-6 shadow-soft" aria-labelledby="support-heading">
              <h2 id="support-heading" className="text-lg font-semibold text-slate-900">
                Need support?
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Coordinate with finance or compliance in the shared channel. We’ll help unblock vendors, approvals, or contract questions within the hour.
                Finance and compliance respond within one hour. Flag blockers and we will unblock contracts, payouts, or vendor checks fast.
                Coordinate with finance or compliance from your shared operations channel. Our team responds within an hour.
              </p>
              <Link
                to="/dashboard/agency/inbox"
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
              >
                Open inbox
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

        <section id="gig-programs" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <h2 className="text-lg font-semibold text-slate-900">Gig programs</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">Studio pipeline</p>
              <p className="text-xs text-slate-500">11 briefs in scope review · 5 fulfilment in progress</p>
            </div>
            <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">Marketplace health</p>
              <p className="text-xs text-slate-500">CSAT 4.7 · Avg. SLA 36h</p>
            </div>
          </div>
        </section>

        <section id="payments-distribution" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <h2 className="text-lg font-semibold text-slate-900">Payments distribution</h2>
          <p className="mt-1 text-sm text-slate-600">
            Keep escrow balances, payout batches, and vendor invoices on time with automated reconciliations.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Upcoming batches</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">3</p>
              <p className="text-xs text-slate-500">Clears within 48h</p>
            </div>
            <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Escrow balance</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">$612K</p>
              <p className="text-xs text-slate-500">$92K earmarked for vendors</p>
            </div>
            <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Invoices pending</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">7</p>
              <p className="text-xs text-slate-500">Send approvals today</p>
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

        <VolunteeringWorkspace
          workspaceId={workspaceId}
          workspaceSlug={workspaceSlug}
          initialPane={volPaneParam}
          onPaneChange={handleVolunteeringPaneChange}
        />
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

