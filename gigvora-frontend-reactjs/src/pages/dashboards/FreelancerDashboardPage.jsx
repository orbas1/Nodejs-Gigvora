import { useCallback, useEffect, useMemo, useState } from 'react';
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
import useSession from '../../hooks/useSession.js';
import useDashboardOverviewResource from '../../hooks/useDashboardOverviewResource.js';
import useFreelancerProfileOverview from '../../hooks/useFreelancerProfileOverview.js';
import useFreelancerOperationsHQ from '../../hooks/useFreelancerOperationsHQ.js';
import useProjectGigManagement from '../../hooks/useProjectGigManagement.js';
import { AVAILABLE_DASHBOARDS } from './freelancer/menuConfig.js';
import OverviewSection from './freelancer/sections/OverviewSection.jsx';
import ProfileOverviewSection from './freelancer/sections/ProfileOverviewSection.jsx';
import PlanningSection from './freelancer/sections/PlanningSection.jsx';
import ProjectManagementSection from './freelancer/sections/project-management/ProjectManagementSection.jsx';
import EscrowManagementSection from './freelancer/sections/EscrowManagementSection.jsx';
import InboxSection from './freelancer/sections/InboxSection.jsx';
import SupportSection from './freelancer/sections/SupportSection.jsx';
import FreelancerWalletSection from './freelancer/sections/FreelancerWalletSection.jsx';
import { IdentityVerificationSection } from '../../features/identityVerification/index.js';
import { fetchFreelancerDashboardOverview, saveFreelancerDashboardOverview } from '../../services/freelancerDashboard.js';
import { resolveActorId } from '../../utils/session.js';
import { trackDashboardEvent } from '../../utils/analytics.js';
import {
  buildFreelancerInsightCards,
  computeFreelancerHealthBanner,
  resolveFreelancerIdFromSession,
} from '../../utils/dashboard/freelancer.js';

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

  const {
    data: overviewData,
    loading: overviewLoading,
    error: overviewError,
    refresh: refreshOverview,
  } = overviewResource;

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

  const operationsResource = useFreelancerOperationsHQ({ freelancerId, enabled: Boolean(freelancerId) });
  const projectResource = useProjectGigManagement(freelancerId, { enabled: Boolean(freelancerId) });

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
            <aside className="space-y-4 rounded-3xl border border-slate-200 bg-white/70 p-4 shadow-sm lg:sticky lg:top-24">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mission telemetry</p>
              <p className="text-sm text-slate-600">
                Stay ahead of revenue, delivery, and relationship signals. Insights refresh whenever new data arrives from
                operations, inbox, or support hubs.
              </p>
            </aside>
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
      </DashboardLayout>
    </DashboardAccessGuard>
  );
}
