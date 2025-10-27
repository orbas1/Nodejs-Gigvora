import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BanknotesIcon,
  BriefcaseIcon,
  CalendarDaysIcon,
  HomeModernIcon,
  InboxStackIcon,
  LifebuoyIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import DashboardAccessGuard from '../../components/security/DashboardAccessGuard.jsx';
import QuickCreateFab from '../../components/navigation/QuickCreateFab.jsx';
import useSession from '../../hooks/useSession.js';
import useDashboardOverviewResource from '../../hooks/useDashboardOverviewResource.js';
import useCachedResource from '../../hooks/useCachedResource.js';
import useFreelancerProfileOverview from '../../hooks/useFreelancerProfileOverview.js';
import useFreelancerOperationsHQ from '../../hooks/useFreelancerOperationsHQ.js';
import useProjectGigManagement from '../../hooks/useProjectGigManagement.js';
import { AVAILABLE_DASHBOARDS } from './freelancer/menuConfig.js';
import OverviewSection from './freelancer/sections/OverviewSection.jsx';
import ProfileOverviewSection from './freelancer/sections/ProfileOverviewSection.jsx';
import PlanningSection from './freelancer/sections/PlanningSection.jsx';
import ProjectManagementSection from './freelancer/sections/project-management/ProjectManagementSection.jsx';
import GigMarketplaceOperationsSection from './freelancer/sections/GigMarketplaceOperationsSection.jsx';
import EscrowManagementSection from './freelancer/sections/EscrowManagementSection.jsx';
import InboxSection from './freelancer/sections/InboxSection.jsx';
import SupportSection from './freelancer/sections/SupportSection.jsx';
import FreelancerWalletSection from './freelancer/sections/FreelancerWalletSection.jsx';
import { IdentityVerificationSection } from '../../features/identityVerification/index.js';
import { fetchFreelancerDashboardOverview, saveFreelancerDashboardOverview } from '../../services/freelancerDashboard.js';
import { fetchUserQuickActions } from '../../services/userQuickActions.js';
import { resolveActorId } from '../../utils/session.js';
import { trackDashboardEvent } from '../../utils/analytics.js';
import {
  buildFreelancerInsightCards,
  computeFreelancerHealthBanner,
  resolveFreelancerIdFromSession,
} from '../../utils/dashboard/freelancer.js';

function formatDateTime(value, timezone) {
  if (!value) {
    return null;
  }

  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: timezone || undefined,
    }).format(date);
  } catch (error) {
    return null;
  }
}

function InsightCard({ card, currency }) {
  const formatValue = (value) => {
    if (value == null) {
      return '—';
    }
    if (card.format === 'currency') {
      try {
        return new Intl.NumberFormat(undefined, {
          style: 'currency',
          currency: currency || 'USD',
          maximumFractionDigits: 0,
        }).format(value);
      } catch (error) {
        return value.toLocaleString();
      }
    }
    if (card.format === 'percent') {
      return `${Math.round(value)}%`;
    }
    return value.toLocaleString();
  };

  return (
    <div className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{card.label}</p>
        <p className="mt-2 text-2xl font-semibold text-slate-900">{formatValue(card.value)}</p>
        {card.hint ? <p className="mt-1 text-xs text-slate-500">{card.hint}</p> : null}
      </div>
      {card.secondary != null ? (
        <p className="mt-4 text-xs text-slate-500">
          Last signal: <span className="font-semibold text-slate-700">{formatValue(card.secondary)}</span>
        </p>
      ) : null}
    </div>
  );
}

function HealthBanner({ banner }) {
  if (!banner) {
    return null;
  }

  const toneStyles = {
    info: 'border-sky-200 bg-sky-50 text-sky-700',
    warning: 'border-amber-200 bg-amber-50 text-amber-700',
    alert: 'border-orange-200 bg-orange-50 text-orange-700',
    critical: 'border-rose-200 bg-rose-50 text-rose-700',
  };

  const style = toneStyles[banner.tone] || toneStyles.info;

  return (
    <div className={`rounded-3xl border px-6 py-4 text-sm shadow-sm ${style}`}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-semibold">{banner.message}</p>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-white/60 px-2 py-0.5 font-semibold text-slate-700">
            Escalations: {banner.metrics.escalations ?? 0}
          </span>
          <span className="rounded-full bg-white/60 px-2 py-0.5 font-semibold text-slate-700">
            Outstanding: {banner.metrics.outstanding ?? 0}
          </span>
          <span className="rounded-full bg-white/60 px-2 py-0.5 font-semibold text-slate-700">
            Retention: {banner.metrics.retentionScore != null ? `${Math.round(banner.metrics.retentionScore)}%` : '—'}
          </span>
          <span className="rounded-full bg-white/60 px-2 py-0.5 font-semibold text-slate-700">
            Compliance: {banner.metrics.compliance != null ? `${Math.round(banner.metrics.compliance)}%` : '—'}
          </span>
        </div>
      </div>
    </div>
  );
}

function MissionTelemetryPanel({
  metrics,
  loading,
  onSync,
  syncing,
  lastSyncedAt,
  timezone,
  scheduleCount,
}) {
  const formattedSync = formatDateTime(lastSyncedAt, timezone);

  return (
    <aside className="space-y-4 rounded-3xl border border-slate-200 bg-white/70 p-4 shadow-sm lg:sticky lg:top-24">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mission telemetry</p>
          <p className="mt-1 text-xs text-slate-600">
            Live signal blend from operations, pipeline, and schedule keeps your mission control aligned in real time.
          </p>
        </div>
        {typeof onSync === 'function' ? (
          <button
            type="button"
            onClick={onSync}
            disabled={syncing}
            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {syncing ? 'Syncing…' : 'Sync now'}
          </button>
        ) : null}
      </div>

      <dl className="grid gap-3">
        {loading
          ? Array.from({ length: 4 }).map((_, index) => (
              <div
                key={`telemetry-placeholder-${index}`}
                className="h-16 animate-pulse rounded-2xl border border-dashed border-slate-200 bg-slate-50"
              />
            ))
          : metrics.map((metric) => (
              <div key={metric.id} className="rounded-2xl border border-slate-200 bg-white/80 p-3">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{metric.label}</dt>
                <dd className="mt-1 text-lg font-semibold text-slate-900">{metric.value ?? '—'}</dd>
                {metric.hint ? <p className="mt-1 text-xs text-slate-500">{metric.hint}</p> : null}
              </div>
            ))}
      </dl>

      <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-500">
        <p className="font-semibold text-slate-600">
          Snapshot {formattedSync ? `updated ${formattedSync}` : 'waiting for first sync'}
        </p>
        <p className="mt-1">{scheduleCount > 0 ? `${scheduleCount} upcoming commitments` : 'Nothing scheduled—room to focus.'}</p>
      </div>
    </aside>
  );
}

const MENU_SECTIONS = [
  {
    label: 'Home',
    items: [
      {
        id: 'mission-control',
        name: 'Mission control',
        description: 'Live overview',
        sectionId: 'overview',
        icon: HomeModernIcon,
      },
    ],
  },
  {
    label: 'Profile',
    items: [
      {
        id: 'profile-overview',
        name: 'Profile',
        description: 'Story & relationships',
        sectionId: 'profile',
        icon: UserCircleIcon,
      },
    ],
  },
  {
    label: 'Planner',
    items: [
      {
        id: 'calendar',
        name: 'Calendar',
        description: 'Schedule & focus',
        sectionId: 'planning',
        icon: CalendarDaysIcon,
      },
    ],
  },
  {
    label: 'Delivery',
    items: [
      {
        id: 'gig-management',
        name: 'Gig management',
        description: 'Projects & orders',
        sectionId: 'project-management',
        icon: BriefcaseIcon,
      },
    ],
  },
  {
    label: 'Communications',
    items: [
      {
        id: 'inbox',
        name: 'Inbox',
        description: 'Messages, calls, and routing',
        sectionId: 'inbox',
        icon: InboxStackIcon,
      },
      {
        id: 'support',
        name: 'Support desk',
        description: 'Escalations & playbooks',
        sectionId: 'support',
        icon: LifebuoyIcon,
      },
    ],
  },
  {
    label: 'Finance',
    items: [
      {
        id: 'wallet',
        name: 'Wallet',
        description: 'Balances & automations',
        sectionId: 'wallet',
        icon: BanknotesIcon,
      },
      {
        id: 'escrow',
        name: 'Escrow',
        description: 'Accounts & releases',
        sectionId: 'escrow-management',
        icon: LockClosedIcon,
      },
      {
        id: 'identity',
        name: 'Identity',
        description: 'Verification & compliance',
        sectionId: 'identity',
        icon: ShieldCheckIcon,
      },
    ],
  },
];

const ALLOWED_ROLES = ['freelancer'];

export default function FreelancerDashboardPage() {
  const { session } = useSession();
  const freelancerId = useMemo(() => resolveFreelancerIdFromSession(session), [session]);
  const actorId = useMemo(() => resolveActorId(session), [session]);

  const overviewResource = useDashboardOverviewResource({
    cacheKey: freelancerId ? `freelancer:${freelancerId}:dashboard-overview` : 'freelancer:dashboard-overview:pending',
    fetcher: () => (freelancerId ? fetchFreelancerDashboardOverview(freelancerId) : Promise.resolve(null)),
    enabled: Boolean(freelancerId),
    dependencies: [freelancerId],
    ttl: 1000 * 45,
  });

  const quickActionsResource = useCachedResource(
    freelancerId ? `user:${freelancerId}:quick-actions` : 'user:quick-actions:pending',
    useCallback(
      ({ signal, force } = {}) => {
        if (!freelancerId) {
          return Promise.resolve(null);
        }
        return fetchUserQuickActions(freelancerId, { signal, fresh: Boolean(force) });
      },
      [freelancerId],
    ),
    {
      enabled: Boolean(freelancerId),
      dependencies: [freelancerId],
      ttl: 1000 * 90,
    },
  );

  const {
    data: overviewData,
    loading: overviewLoading,
    error: overviewError,
    refresh: refreshOverview,
  } = overviewResource;

  const {
    data: quickActionsData,
    loading: quickActionsLoading,
    error: quickActionsError,
    refresh: refreshQuickActions,
    fromCache: quickActionsFromCache,
  } = quickActionsResource;

  const {
    overview: profileOverview,
    loading: profileLoading,
    saving: profileSaving,
    avatarUploading,
    connectionSaving,
    error: profileError,
    refresh: refreshProfile,
    saveProfile,
    uploadAvatar,
    createConnection,
    updateConnection,
    deleteConnection,
  } = useFreelancerProfileOverview({ userId: freelancerId, enabled: Boolean(freelancerId) });

  const [savingOverview, setSavingOverview] = useState(false);
  const [activeMenuItemId, setActiveMenuItemId] = useState('mission-control');
  const [syncingOperations, setSyncingOperations] = useState(false);
  const lastTrackedSectionRef = useRef('mission-control');

  const operationsResource = useFreelancerOperationsHQ({ freelancerId, enabled: Boolean(freelancerId) });
  const projectResource = useProjectGigManagement(freelancerId, { enabled: Boolean(freelancerId) });

  useEffect(() => {
    if (quickActionsError) {
      console.warn('Unable to load quick actions for freelancer dashboard.', quickActionsError);
    }
  }, [quickActionsError]);

  const quickActionDefaultId = quickActionsData?.recommendedActionId ?? null;

  const quickActionItems = useMemo(() => {
    if (!quickActionsData?.actions?.length) {
      return null;
    }
    return quickActionsData.actions.map((action) => ({
      id: action.id,
      label: action.label,
      description: action.description,
      icon: action.icon ?? null,
      tone: action.tone ?? null,
      href: action.href ?? null,
      badge: action.badge ?? null,
      disabled: Boolean(action.disabled),
      recommended: Boolean(action.recommended),
    }));
  }, [quickActionsData]);

  const handleQuickActionSelect = useCallback(
    (action) => {
      if (!action) {
        return;
      }
      trackDashboardEvent('freelancer.dashboard.quick-action.select', {
        freelancerId,
        actionId: action.id ?? null,
        recommended: action.recommended === true || action.id === quickActionDefaultId,
        fromCache: quickActionsFromCache,
      });
    },
    [freelancerId, quickActionDefaultId, quickActionsFromCache],
  );

  const handleQuickFabOpenChange = useCallback(
    (isOpen) => {
      trackDashboardEvent('freelancer.dashboard.quick-action.toggle', {
        freelancerId,
        open: isOpen,
        cached: quickActionsFromCache,
      });
      if (isOpen && typeof refreshQuickActions === 'function' && !quickActionsLoading) {
        refreshQuickActions({ force: false });
      }
    },
    [freelancerId, quickActionsFromCache, quickActionsLoading, refreshQuickActions],
  );

  const lifecycleStats = projectResource.data?.projectLifecycle?.stats ?? null;
  const insightCards = useMemo(
    () =>
      buildFreelancerInsightCards({
        overview: overviewData ?? {},
        operationsMetrics: operationsResource.metrics,
        lifecycleStats,
      }),
    [lifecycleStats, operationsResource.metrics, overviewData],
  );

  const healthBanner = useMemo(
    () => computeFreelancerHealthBanner({ overview: overviewData ?? {}, operationsMetrics: operationsResource.metrics }),
    [operationsResource.metrics, overviewData],
  );

  useEffect(() => {
    trackDashboardEvent('freelancer.dashboard.view', {
      freelancerId,
      hasOverview: Boolean(overviewData),
    });
  }, [freelancerId, overviewData]);

  useEffect(() => {
    const sections = document.querySelectorAll('[data-freelancer-section]');
    if (!sections.length) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length > 0) {
          const id = visible[0].target.getAttribute('data-freelancer-section');
          if (id) {
            setActiveMenuItemId(id);
          }
        }
      },
      { rootMargin: '-35% 0px -45% 0px', threshold: [0.25, 0.5, 0.75] },
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, [overviewData]);

  useEffect(() => {
    if (!activeMenuItemId || lastTrackedSectionRef.current === activeMenuItemId) {
      return;
    }

    trackDashboardEvent('freelancer.dashboard.section.visible', {
      freelancerId,
      sectionId: activeMenuItemId,
    });

    lastTrackedSectionRef.current = activeMenuItemId;
  }, [activeMenuItemId, freelancerId]);

  const handleSaveOverview = useCallback(
    async (payload) => {
      if (!freelancerId) {
        throw new Error('Freelancer workspace required.');
      }
      setSavingOverview(true);
      try {
        const result = await saveFreelancerDashboardOverview(freelancerId, payload);
        await refreshOverview({ force: true });
        return result;
      } catch (error) {
        const normalised = error instanceof Error ? error : new Error('Unable to update overview.');
        throw normalised;
      } finally {
        setSavingOverview(false);
      }
    },
    [freelancerId, refreshOverview],
  );

  const handleSyncOperations = useCallback(async () => {
    if (typeof operationsResource.syncOperations !== 'function') {
      return;
    }
    setSyncingOperations(true);
    try {
      await operationsResource.syncOperations();
    } finally {
      setSyncingOperations(false);
    }
  }, [operationsResource]);

  const timezone = overviewData?.currentDate?.timezone ?? null;
  const upcomingSchedule = Array.isArray(overviewData?.upcomingSchedule) ? overviewData.upcomingSchedule : [];
  const nextCommitment = upcomingSchedule[0] ?? null;

  const missionMetrics = useMemo(() => {
    const operationsMetrics = operationsResource.metrics ?? {};
    const workstreamCount = Array.isArray(overviewData?.workstreams) ? overviewData.workstreams.length : 0;
    const automationCoverage = operationsMetrics.automationCoverage;
    const automationValue = automationCoverage == null ? '—' : `${Math.round(Number(automationCoverage))}%`;
    const complianceHint =
      operationsMetrics.complianceScore == null
        ? null
        : `Compliance ${Math.round(Number(operationsMetrics.complianceScore))}%`;
    const escalations = operationsMetrics.escalations ?? 0;
    const atRiskCount = lifecycleStats?.atRiskCount ?? 0;
    const overdueCount = lifecycleStats?.overdueCount ?? 0;
    const activeWorkflows = operationsMetrics.activeWorkflows ?? 0;
    const nextTimestamp = nextCommitment?.startsAt ? formatDateTime(nextCommitment.startsAt, timezone) : null;
    const nextType = nextCommitment?.type ?? null;

    return [
      {
        id: 'workstreams',
        label: 'Active workstreams',
        value: workstreamCount.toLocaleString(),
        hint: `${activeWorkflows.toLocaleString()} workflows in Operations HQ`,
      },
      {
        id: 'automation',
        label: 'Automation coverage',
        value: automationValue,
        hint: complianceHint ?? `${escalations.toLocaleString()} escalations open`,
      },
      {
        id: 'risk',
        label: 'At-risk engagements',
        value: atRiskCount.toLocaleString(),
        hint:
          overdueCount > 0
            ? `${overdueCount.toLocaleString()} overdue deliverables`
            : 'No overdue deliverables',
      },
      {
        id: 'next-commitment',
        label: 'Next commitment',
        value: nextCommitment ? nextCommitment.label : 'All clear',
        hint: nextCommitment
          ? `${nextTimestamp ?? 'TBC'}${nextType ? ` · ${nextType}` : ''}`
          : 'No upcoming commitments scheduled',
      },
    ];
  }, [
    lifecycleStats?.atRiskCount,
    lifecycleStats?.overdueCount,
    nextCommitment,
    operationsResource.metrics,
    overviewData?.workstreams,
    timezone,
  ]);

  const telemetryLoading =
    overviewLoading || operationsResource.loading || projectResource.loading || syncingOperations;

  return (
    <DashboardAccessGuard requiredRoles={ALLOWED_ROLES}>
      <DashboardLayout
        currentDashboard="freelancer"
        title="Freelancer mission control"
        subtitle="Signals, revenue, and relationships"
        description="Keep your Gigvora career in flow with a personalised control centre for operations, growth, and support."
        menuSections={MENU_SECTIONS}
        availableDashboards={AVAILABLE_DASHBOARDS}
        activeMenuItem={activeMenuItemId}
      >
        <div className="mx-auto w-full max-w-7xl space-y-12 px-6 py-10">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <div className="space-y-6" data-freelancer-section="mission-control" id="mission-control">
              <HealthBanner banner={healthBanner} />
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {insightCards.map((card) => (
                  <InsightCard key={card.id} card={card} currency={overviewData?.metrics?.currency} />
                ))}
              </div>
            </div>
            <MissionTelemetryPanel
              metrics={missionMetrics}
              loading={telemetryLoading}
              onSync={freelancerId ? handleSyncOperations : null}
              syncing={syncingOperations}
              lastSyncedAt={operationsResource.metrics?.lastSyncedAt}
              timezone={timezone}
              scheduleCount={upcomingSchedule.length}
            />
          </div>

          <div data-freelancer-section="overview" id="overview" className="scroll-mt-28 space-y-12">
            <OverviewSection
              overview={overviewData}
              loading={overviewLoading}
              error={overviewError}
              onRefresh={() => refreshOverview({ force: true })}
              onSave={handleSaveOverview}
              saving={savingOverview}
              autosaveEnabled
            />
          </div>

          <div data-freelancer-section="profile" id="profile" className="scroll-mt-28 space-y-12">
            <ProfileOverviewSection
              overview={profileOverview}
              loading={profileLoading}
              saving={profileSaving}
              avatarUploading={avatarUploading}
              connectionSaving={connectionSaving}
              error={profileError}
              onRefresh={() => refreshProfile({ fresh: true })}
              onSave={saveProfile}
              onUploadAvatar={uploadAvatar}
              onCreateConnection={createConnection}
              onUpdateConnection={updateConnection}
              onDeleteConnection={deleteConnection}
            />
          </div>

          <div data-freelancer-section="planning" id="planning" className="scroll-mt-28">
            <PlanningSection freelancerId={freelancerId} />
          </div>

          <div data-freelancer-section="project-management" id="project-management" className="scroll-mt-28">
            <ProjectManagementSection
              freelancerId={freelancerId}
              managementResource={projectResource}
              onProjectEvent={(eventName, payload) => trackDashboardEvent(eventName, payload)}
            />
          </div>

          <div data-freelancer-section="gig-marketplace" className="scroll-mt-28">
            <GigMarketplaceOperationsSection freelancerId={freelancerId} />
          </div>

          <div data-freelancer-section="wallet" id="wallet" className="scroll-mt-28">
            <FreelancerWalletSection userId={actorId} />
          </div>

          <div data-freelancer-section="escrow-management" id="escrow-management" className="scroll-mt-28">
            <EscrowManagementSection freelancerId={freelancerId} />
          </div>

          <div data-freelancer-section="identity" id="identity" className="scroll-mt-28">
            <IdentityVerificationSection />
          </div>

          <div data-freelancer-section="inbox" id="inbox" className="scroll-mt-28">
            <InboxSection userId={actorId} freelancerId={freelancerId} />
          </div>

          <div data-freelancer-section="support" id="support" className="scroll-mt-28">
            <SupportSection userId={actorId} freelancerId={freelancerId} />
          </div>
        </div>
        <QuickCreateFab
          actions={quickActionItems ?? undefined}
          defaultActionId={quickActionDefaultId ?? null}
          onAction={handleQuickActionSelect}
          onOpenChange={handleQuickFabOpenChange}
          label="Quick launch"
        />
      </DashboardLayout>
    </DashboardAccessGuard>
  );
}
