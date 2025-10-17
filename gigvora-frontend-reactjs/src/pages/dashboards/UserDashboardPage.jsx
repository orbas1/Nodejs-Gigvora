import { useMemo } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import useCachedResource from '../../hooks/useCachedResource.js';
import DataStatus from '../../components/DataStatus.jsx';
import { fetchUserDashboard } from '../../services/userDashboard.js';
import { formatAbsolute, formatRelativeTime } from '../../utils/date.js';
import DocumentStudioSection from '../../components/documentStudio/DocumentStudioSection.jsx';
import ProjectGigManagementContainer from '../../components/projectGigManagement/ProjectGigManagementContainer.jsx';
import EventManagementSection from '../../components/eventManagement/EventManagementSection.jsx';
import useSession from '../../hooks/useSession.js';
import DashboardAccessGuard from '../../components/security/DashboardAccessGuard.jsx';
import DashboardBlogSpotlight from '../../components/blog/DashboardBlogSpotlight.jsx';
import AffiliateProgramSection from '../../components/affiliate/AffiliateProgramSection.jsx';
import DashboardNotificationCenterSection from '../../components/notifications/DashboardNotificationCenterSection.jsx';
import useSavedSearches from '../../hooks/useSavedSearches.js';
import { TopSearchSection } from './user/sections/index.js';

const DEFAULT_USER_ID = 1;
const availableDashboards = ['user', 'freelancer', 'agency', 'company', 'headhunter'];
const allowedDashboardRoles = availableDashboards;

function resolveUserId(session) {
  if (!session) {
    return DEFAULT_USER_ID;
  }

  return session.userId ?? session.user?.id ?? session.id ?? DEFAULT_USER_ID;
}

function formatNumber(value) {
  if (value == null) return '0';
  const formatter = new Intl.NumberFormat('en-GB');
  return formatter.format(Number(value));
}

function formatPercent(value, fractionDigits = 1) {
  if (value == null || Number.isNaN(Number(value))) return '—';
  const formatter = new Intl.NumberFormat('en-GB', {
    style: 'percent',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
  return formatter.format(Number(value) / 100);
}

function formatChangeBadge(change, { suffix = '' } = {}) {
  if (!change) {
    return { label: 'Stable', tone: 'neutral' };
  }
  const direction = change.direction;
  const symbol = direction === 'up' ? '▲' : direction === 'down' ? '▼' : '→';
  const reference = change.absolute ?? change.percent;
  const value = reference == null ? null : Math.abs(Number(reference)).toFixed(1);
  return {
    label: value == null ? 'Stable' : `${symbol} ${value}${suffix}`,
    tone: direction === 'down' ? 'negative' : direction === 'up' ? 'positive' : 'neutral',
  };
}

function formatMinutesToHours(minutes) {
  if (!minutes || Number.isNaN(Number(minutes))) return '0m';
  const total = Math.max(0, Math.round(Number(minutes)));
  const hours = Math.floor(total / 60);
  const remainder = total % 60;
  if (hours === 0) return `${remainder}m`;
  if (remainder === 0) return `${hours}h`;
  return `${hours}h ${remainder}m`;
}

function formatStatus(status) {
  if (!status) return 'Unknown';
  return status
    .split('_')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

function formatCurrency(value, currency = 'USD') {
  if (value == null) return null;
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(Number(value));
  } catch (error) {
    return `${currency} ${formatNumber(value)}`;
  }
}

function normalizeChecklist(value) {
  if (Array.isArray(value)) {
    return value.map((item) =>
      typeof item === 'object' ? { label: item.label ?? item.name ?? 'Checklist item', completed: Boolean(item.completed) } : { label: String(item), completed: false },
    );
  }
  if (value && typeof value === 'object') {
    return Object.entries(value).map(([label, item]) => ({
      label,
      completed: Boolean(item?.completed ?? item),
    }));
  }
  return [];
}

function normalizePrompts(value) {
  if (Array.isArray(value)) {
    return value;
  }
  if (value && typeof value === 'object') {
    return Object.values(value);
  }
  return [];
}

function buildProfileCard(data, summary, session) {
  const profile = data?.profile ?? {};
  const user = profile.user ?? {};
  const sessionName = session?.name ?? null;
  const sessionHeadline = session?.title ?? null;
  const fallbackName = sessionName || [user.firstName, user.lastName].filter(Boolean).join(' ');
  const name = profile.name ?? (fallbackName || 'Gigvora member');
  const headline = profile.headline || profile.missionStatement || sessionHeadline || 'Professional member';
  const initials = (profile.initials ||
    (sessionName ? sessionName.split(' ').map((part) => part[0]).join('') : null) ||
    name)
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const availability = profile.availability?.status ? formatStatus(profile.availability.status) : null;
  const launchpadStatus = profile.launchpadEligibility?.status === 'eligible' ? 'Launchpad ready' : null;
  const membershipBadges = (session?.memberships ?? [])
    .filter((membership) => membership && typeof membership === 'string')
    .slice(0, 3)
    .map((membership) => `${membership.charAt(0).toUpperCase()}${membership.slice(1)} member`);

  const badges = [
    ...(profile.statusFlags?.slice?.(0, 2) ?? []),
    ...(launchpadStatus ? [launchpadStatus] : []),
    ...membershipBadges,
  ].map(formatStatus);

  return {
    name,
    role: headline,
    initials,
    status: availability ? `Availability: ${availability}` : undefined,
    badges,
    metrics: [
      { label: 'Active applications', value: formatNumber(summary.activeApplications) },
      { label: 'Interviews', value: formatNumber(summary.interviewsScheduled) },
      { label: 'Offers in play', value: formatNumber(summary.offersNegotiating) },
      { label: 'Connections', value: formatNumber(summary.connections) },
    ],
  };
}

function buildMenuSections(data) {
  const summary = data?.summary ?? {};
  const eventManagement = data?.eventManagement ?? {};
  const eventOverview = eventManagement.overview ?? {};
  const upcomingEventCount = Array.isArray(eventOverview.upcomingEvents)
    ? eventOverview.upcomingEvents.length
    : 0;
  const nextEvent = eventOverview.nextEvent ?? null;
  const documents = data?.documents ?? {};
  const documentStudio = data?.documentStudio;
  const documentSummary = documentStudio?.summary ?? {};
  const projectGigManagement = data?.projectGigManagement ?? {};
  const projectSummary = projectGigManagement.summary ?? {};
  const assetSummary = projectGigManagement.assets?.summary ?? {};
  const purchasedGigStats = projectGigManagement.purchasedGigs?.stats ?? {};
  const vendorAverages = purchasedGigStats.averages ?? {};
  const storytelling = projectGigManagement.storytelling ?? {};
  const averageBoardProgress = projectGigManagement.managementBoard?.metrics?.averageProgress;
  const vendorScoreLabel =
    vendorAverages.overall != null ? `${Number(vendorAverages.overall).toFixed(1)}/5` : 'unrated';
  const portfolioProjects = Array.isArray(documentStudio?.brandHub?.portfolioProjects)
    ? documentStudio.brandHub.portfolioProjects.length
    : documents.portfolioLinks?.length ?? 0;
  const portfolioCount = documents.portfolioLinks?.length ?? 0;
  const pipelineAutomation = data?.careerPipelineAutomation ?? {};
  const automationMetrics = pipelineAutomation.kanban?.metrics ?? {};
  const automationBoardName = pipelineAutomation.board?.name ?? 'Career pipeline';
  return [
    {
      label: 'Events',
      items: [
        {
          name: 'Plan',
          description: '',
          sectionId: 'event-management',
        },
        {
          name: 'Guests',
          description: '',
          sectionId: 'event-management',
        },
        {
          name: 'Finance',
          description: '',
          sectionId: 'event-management',
        },
      ],
    },
    {
      label: 'Project & gig management',
      items: [
        {
          name: 'Project creation workspace',
          description: `Launch ${formatNumber(projectSummary.totalProjects ?? 0)} initiatives with ${formatNumber(
            projectSummary.templatesAvailable ?? projectGigManagement.projectCreation?.templates?.length ?? 0,
          )} templates ready for mentors or freelancers.`,
          tags: ['briefs', 'collaboration'],
          sectionId: 'project-gig-creation',
        },
        {
          name: 'Template gallery',
          description: `Hackathons, bootcamps, and consulting kits curated for ${formatNumber(
            projectGigManagement.projectCreation?.templates?.filter?.((template) => template?.isFeatured)?.length ?? 0,
          )} featured playbooks.`,
          tags: ['templates', 'playbooks'],
          sectionId: 'project-gig-templates',
        },
        {
          name: 'Asset repository',
          description: `${formatNumber(assetSummary.total ?? 0)} secured files with ${formatNumber(
            assetSummary.watermarked ?? 0,
          )} watermark protections & granular permissions.`,
          tags: ['assets', 'compliance'],
          sectionId: 'project-gig-assets',
        },
        {
          name: 'Delivery board',
          description: `Visualise ${formatNumber(projectSummary.activeProjects ?? 0)} active projects with average progress ${
            averageBoardProgress != null ? `${averageBoardProgress}%` : 'tracking'
          }.`,
          tags: ['kanban', 'progress'],
          sectionId: 'project-gig-board',
        },
        {
          name: 'Purchased gig operations',
          description: `Manage ${formatNumber(purchasedGigStats.totalOrders ?? 0)} vendor orders with CSAT ${vendorScoreLabel} and escrow safeguards.`,
          tags: ['vendors', 'escrow'],
          sectionId: 'project-gig-purchased',
        },
        {
          name: 'CV-ready storytelling',
          description: `Convert ${formatNumber(storytelling.achievements?.length ?? 0)} outcomes into resume bullets & LinkedIn stories.`,
          tags: ['storytelling', 'ai'],
          sectionId: 'project-gig-storytelling',
        },
      ],
    },
    {
      label: 'Career pipeline automation',
      items: [
        {
          name: 'Job applications kanban',
          description: `${automationBoardName} with ${formatNumber(automationMetrics.totalOpportunities ?? 0)} tracked opportunities.`,
          tags: ['kanban', 'sla'],
          sectionId: 'career-pipeline-automation-kanban',
        },
        {
          name: 'Interview command center',
          description: 'Prep tasks, scorecards, and live readiness tracking for every panel.',
          tags: ['calendar', 'prep'],
          sectionId: 'career-interview-command-center',
        },
        {
          name: 'Offer negotiation vault',
          description: 'Scenario planning, competing offers, and legal-ready archives.',
          tags: ['compensation'],
          sectionId: 'career-offer-negotiation-vault',
        },
        {
          name: 'Auto job application criteria',
          description: 'Rule library with analytics and guardrails for premium roles.',
          tags: ['automation', 'ai'],
          sectionId: 'career-auto-apply-rules',
        },
      ],
    },
    {
      label: 'Search',
      items: [
        {
          name: 'Search',
          description: 'Saved alerts',
          tags: ['search'],
          sectionId: 'top-search',
        },
        {
          name: 'Explorer',
          description: 'Full explorer',
          tags: ['explorer'],
          href: '/search',
        },
      ],
    },
    {
      label: 'Career operations',
      items: [
        {
          name: 'Pipeline overview',
          description: `${formatNumber(summary.activeApplications)} live opportunities with ${formatNumber(summary.interviewsScheduled)} interviews scheduled.`,
          tags: ['applications', 'interviews'],
        },
        {
          name: 'Follow-ups',
          description: 'Track outstanding nudges and due diligence per opportunity.',
          tags: ['tasks'],
        },
        {
          name: 'Automation rules',
          description: 'Monitor launchpad readiness and availability automations.',
          tags: ['automation'],
        },
      ],
    },
    {
      label: 'Documents & branding',
      items: [
        {
          name: 'Document library',
          description: `${formatNumber(documentSummary.totalDocuments ?? summary.documentsUploaded ?? 0)} tailored assets ready to send.`,
          tags: ['resumes'],
        },
        {
          name: 'Portfolio evidence',
          description: `${formatNumber(portfolioProjects || portfolioCount)} public case studies, testimonials, and banners.`,
        },
        {
          name: 'Purchased gigs',
          description: `Review ${formatNumber(documentStudio?.purchasedGigs?.stats?.total ?? 0)} vendor deliverables feeding your workspace.`,
        },
      ],
    },
    {
      label: 'Insights & network',
      items: [
        {
          name: 'Insights, accountability, & support',
          description: 'Career analytics, rituals, advisors, and support in one command center.',
          tags: ['insights', 'support'],
          sectionId: 'insights-accountability-support',
        },
        {
          name: 'Talent intelligence',
          description: 'Track interview conversion, offer momentum, and market benchmarks.',
        },
        {
          name: 'Connections CRM',
          description: `Maintain ${formatNumber(summary.connections)} relationships for referrals and mentorship.`,
        },
        {
          name: 'Profile settings',
          description: 'Control availability, visibility, and launchpad eligibility signals.',
        },
      ],
    },
    {
      label: 'Alerts',
      items: [
        {
          name: 'Inbox',
          description: `${formatNumber(data?.notifications?.unreadCount ?? 0)} unread`,
          tags: ['notifications', 'alerts'],
          sectionId: 'notifications-center',
        },
        {
          name: 'Digest',
          description: `${
            data?.notifications?.preferences?.digestFrequency
              ? data.notifications.preferences.digestFrequency.replace(/^(\w)/, (match) => match.toUpperCase())
              : 'Immediate'
          } cadence`,
          sectionId: 'notifications-center',
        },
      ],
    },
    {
      label: 'Affiliate & referrals',
      items: [
        {
          name: 'Affiliate revenue cockpit',
          description: 'Track referral links, tiered commissions, and payout readiness in real time.',
          tags: ['growth', 'monetisation'],
          sectionId: 'affiliate-program',
        },
        {
          name: 'Referral compliance',
          description: 'Monitor KYC, payout thresholds, and activity guardrails for each partner.',
          tags: ['compliance'],
        },
      ],
    },
  ];
}

export default function UserDashboardPage() {
  const { session, isAuthenticated } = useSession();
  const userId = session ? resolveUserId(session) : null;
  const shouldLoadDashboard = Boolean(isAuthenticated && userId);

  const { data, error, loading, fromCache, lastUpdated, refresh } = useCachedResource(
    `dashboard:user:${userId ?? 'anonymous'}`,
    ({ signal }) => {
      if (!userId) {
        throw new Error('A valid userId is required to load the dashboard.');
      }
      return fetchUserDashboard(userId, { signal });
    },
    {
      ttl: 1000 * 60,
      dependencies: [userId],
      enabled: shouldLoadDashboard,
    },
  );

  const {
    items: savedSearches,
    loading: savedSearchesLoading,
    createSavedSearch,
    updateSavedSearch,
    deleteSavedSearch,
    runSavedSearch,
  } = useSavedSearches({ enabled: shouldLoadDashboard });

  const summary = data?.summary ?? {
    totalApplications: 0,
    activeApplications: 0,
    interviewsScheduled: 0,
    offersNegotiating: 0,
    documentsUploaded: 0,
    connections: 0,
  };

  const pipelineAutomation = data?.careerPipelineAutomation ?? {};
  const automationBoard = pipelineAutomation.board ?? null;
  const kanbanStages = Array.isArray(pipelineAutomation.kanban?.stages)
    ? pipelineAutomation.kanban.stages
    : [];
  const kanbanMetrics = pipelineAutomation.kanban?.metrics ?? {};
  const bulkOperations = pipelineAutomation.bulkOperations ?? { pendingBulkUpdates: 0, reminders: [] };
  const candidateBriefs = Array.isArray(pipelineAutomation.candidateBriefs)
    ? pipelineAutomation.candidateBriefs
    : [];
  const complianceInsights = pipelineAutomation.compliance ?? {
    flaggedOpportunities: 0,
    pendingReports: 0,
    completedReports: 0,
    lastAuditAt: null,
    snapshots: [],
  };
  const interviewCommand = pipelineAutomation.interviewCommandCenter ?? {
    workspaces: [],
    tasks: [],
    scorecards: [],
    readiness: { totalItems: 0, completedItems: 0 },
    summary: { upcoming: 0, completed: 0, averageScore: null, recommendations: {} },
  };
  const offerVault = pipelineAutomation.offerVault ?? { packages: [], metrics: {} };
  const autoApply = pipelineAutomation.autoApply ?? {
    rules: [],
    guardrails: { manualReviewRequired: 0, premiumProtected: 0 },
    analytics: [],
  };

  const pipeline = Array.isArray(data?.pipeline?.statuses) ? data.pipeline.statuses : [];
  const pipelineTotal = pipeline.reduce((accumulator, row) => accumulator + row.count, 0) || 1;
  const recentApplications = Array.isArray(data?.applications?.recent) ? data.applications.recent : [];
  const followUps = Array.isArray(data?.tasks?.followUps) ? data.tasks.followUps : [];
  const automations = Array.isArray(data?.tasks?.automations) ? data.tasks.automations : [];
  const interviews = Array.isArray(data?.interviews) ? data.interviews : [];
  const documents = data?.documents ?? { attachments: [], portfolioLinks: [] };
  const documentStudio = data?.documentStudio ?? null;
  const eventManagement = data?.eventManagement ?? null;
  const eventManagementOverview = eventManagement?.overview ?? null;
  const projectGigManagement = data?.projectGigManagement ?? null;
  const notifications = Array.isArray(data?.notifications?.recent) ? data.notifications.recent : [];
  const notificationsUnreadCount = Number(data?.notifications?.unreadCount ?? 0);
  const notificationPreferences = data?.notifications?.preferences ?? null;
  const notificationStats = data?.notifications?.stats ?? null;
  const projectActivity = Array.isArray(data?.projectActivity?.recent) ? data.projectActivity.recent : [];
  const launchpadApplications = Array.isArray(data?.launchpad?.applications) ? data.launchpad.applications : [];
  const affiliateProgram = data?.affiliate ?? null;
  const affiliateOverview = affiliateProgram?.overview ?? {};

  const topSearchData = data?.topSearch ?? null;

  const insights = data?.insights ?? {};
  const careerAnalytics = insights.careerAnalytics ?? {};
  const careerSummary = careerAnalytics.summary ?? {};
  const careerSnapshots = Array.isArray(careerAnalytics.snapshots) ? careerAnalytics.snapshots : [];
  const careerBenchmarks = Array.isArray(careerAnalytics.benchmarks) ? careerAnalytics.benchmarks : [];
  const careerDiversity = careerAnalytics.diversity ?? null;
  const careerFunnel = careerAnalytics.funnel ?? null;

  const weeklyDigest = insights.weeklyDigest ?? {};
  const digestSubscription = weeklyDigest.subscription ?? null;
  const digestIntegrations = Array.isArray(weeklyDigest.integrations) ? weeklyDigest.integrations : [];

  const calendarInsights = insights.calendar ?? {};
  const upcomingInterviewEvents = Array.isArray(calendarInsights.upcomingInterviews)
    ? calendarInsights.upcomingInterviews
    : [];
  const nextFocusBlock = calendarInsights.nextFocusBlock ?? null;
  const focusInsights = calendarInsights.focus ?? { sessions: [], totalMinutes: 0, byType: {} };
  const focusSessions = Array.isArray(focusInsights.sessions) ? focusInsights.sessions : [];
  const focusMinutesTotal = focusInsights.totalMinutes ?? 0;
  const focusByTypeEntries = focusInsights.byType ? Object.entries(focusInsights.byType) : [];

  const advisorInsights = insights.advisorCollaboration ?? {};
  const advisorCollaborations = Array.isArray(advisorInsights.collaborations)
    ? advisorInsights.collaborations
    : [];
  const advisorSummary = advisorInsights.summary ?? {};

  const supportDesk = insights.supportDesk ?? {};
  const supportCases = Array.isArray(supportDesk.cases) ? supportDesk.cases : [];
  const supportAutomation = Array.isArray(supportDesk.automation) ? supportDesk.automation : [];
  const supportArticles = Array.isArray(supportDesk.knowledgeArticles) ? supportDesk.knowledgeArticles : [];
  const supportSummary = supportDesk.summary ?? {};

  const menuSections = useMemo(() => buildMenuSections(data), [data]);
  const profileCard = useMemo(() => buildProfileCard(data, summary, session), [data, session, summary]);

  const summaryCards = [
    {
      label: 'Total applications',
      value: summary.totalApplications,
      description: 'Opportunities you have submitted or are drafting.',
    },
    {
      label: 'Active events',
      value: eventManagementOverview?.active ?? 0,
      description: `Managing ${formatNumber(eventManagementOverview?.events ?? 0)} total events across your programs.`,
    },
    {
      label: 'Active pipeline',
      value: summary.activeApplications,
      description: 'Applications requiring monitoring or follow-up.',
    },
    {
      label: 'Interviews scheduled',
      value: summary.interviewsScheduled,
      description: 'Confirmed interview touchpoints across your pipeline.',
    },
    {
      label: 'Documents uploaded',
      value: summary.documentsUploaded,
      description: 'Tailored CVs, cover letters, and supporting evidence.',
    },
    {
      label: 'Affiliate earnings',
      value: Number(affiliateOverview?.lifetimeEarnings ?? 0),
      displayValue:
        affiliateOverview?.lifetimeEarnings != null
          ? formatCurrency(affiliateOverview.lifetimeEarnings, affiliateOverview.currency ?? 'USD')
          : '—',
      description: `Pending ${formatCurrency(
        affiliateOverview?.pendingPayouts ?? 0,
        affiliateOverview?.currency ?? 'USD',
      )} with ${(affiliateOverview?.conversionRate ?? 0).toFixed(1)}% conversion velocity.`,
    },
  ];

  const heroTitle = 'User & Job Seeker Command Center';
  const heroSubtitle = 'Candidate success workspace';
  const heroDescription =
    'Monitor applications, interviews, documents, and collaborations with a single source of truth personalised to your Gigvora profile.';

  const dashboardView = (
    <DashboardLayout
      currentDashboard="user"
      title={heroTitle}
      subtitle={heroSubtitle}
      description={heroDescription}
      menuSections={menuSections}
      sections={[]}
      profile={profileCard}
      availableDashboards={availableDashboards}
    >
      <div className="space-y-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <DataStatus
            loading={loading}
            error={error?.message}
            fromCache={fromCache}
            lastUpdated={lastUpdated}
            onRetry={refresh}
          />
        </div>

        <DashboardBlogSpotlight />

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <div
              key={card.label}
              className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm transition hover:border-accent/40 hover:shadow-soft"
            >
              <p className="text-sm font-medium text-slate-500">{card.label}</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">
                {card.displayValue ?? formatNumber(card.value)}
              </p>
              <p className="mt-2 text-sm text-slate-500">{card.description}</p>
            </div>
          ))}
        </section>

        <TopSearchSection
          data={topSearchData}
          savedSearches={savedSearches}
          savedSearchesLoading={savedSearchesLoading}
          onCreateSavedSearch={createSavedSearch}
          onUpdateSavedSearch={updateSavedSearch}
          onDeleteSavedSearch={deleteSavedSearch}
          onRunSavedSearch={runSavedSearch}
        />

        <section id="career-pipeline-automation" className="space-y-8">
          <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-accentSoft p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-accent">Career pipeline automation</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                  {automationBoard?.name ?? 'Automation workbench'}
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-slate-600">
                  Build a predictable job-search operating system with structured pipelines, SLA-aware nudges, and
                  collaboration-ready workflows spanning interviews and offer negotiations.
                </p>
              </div>
              <div className="grid w-full gap-3 rounded-2xl border border-accent/30 bg-white/70 p-4 text-sm text-slate-700 shadow-inner sm:grid-cols-3 lg:max-w-xl">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Active opportunities</p>
                  <p className="mt-1 text-xl font-semibold text-slate-900">
                    {formatNumber(kanbanMetrics.totalOpportunities ?? 0)}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">SLA breaches</p>
                  <p className={`mt-1 text-xl font-semibold ${kanbanMetrics.overdueOpportunities ? 'text-rose-600' : 'text-slate-900'}`}>
                    {formatNumber(kanbanMetrics.overdueOpportunities ?? 0)}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Avg. stage duration</p>
                  <p className="mt-1 text-xl font-semibold text-slate-900">
                    {kanbanMetrics.averageStageDurationHours != null
                      ? `${kanbanMetrics.averageStageDurationHours}h`
                      : '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div id="career-pipeline-automation-kanban" className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Job applications kanban</h3>
                <p className="text-sm text-slate-600">
                  Track every opportunity from sourcing to signed offer. Attach research, monitor SLAs, and trigger nudges
                  when momentum stalls.
                </p>
              </div>
              <span className="text-xs uppercase tracking-wide text-slate-500">
                {automationBoard?.timezone ? `Timezone ${automationBoard.timezone}` : 'Realtime automation insights'}
              </span>
            </div>

            <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-4">
              {kanbanStages.length ? (
                kanbanStages.map((stage) => {
                  const stageOverdue = stage.metrics?.overdue ?? 0;
                  return (
                    <div key={stage.id} className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{stage.name}</p>
                          <p className="text-xs text-slate-500">
                            {formatStatus(stage.stageType)} • {formatNumber(stage.metrics?.total ?? 0)} opportunities
                          </p>
                        </div>
                        {stage.slaHours != null ? (
                          <span className="rounded-full bg-accentSoft px-3 py-1 text-xs font-semibold text-accent">
                            SLA {stage.slaHours}h
                          </span>
                        ) : null}
                      </div>
                      {stageOverdue ? (
                        <p className="mt-3 text-xs font-medium uppercase tracking-wide text-rose-500">
                          {formatNumber(stageOverdue)} exceeding SLA
                        </p>
                      ) : null}
                      <div className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1">
                        {stage.opportunities?.length ? (
                          stage.opportunities.map((opportunity) => {
                            const salary = opportunity.salary ?? {};
                            const salaryParts = [
                              salary.min != null ? formatCurrency(salary.min, salary.currency ?? 'USD') : null,
                              salary.max != null ? formatCurrency(salary.max, salary.currency ?? 'USD') : null,
                            ].filter(Boolean);
                            const salaryLabel = salaryParts.length ? salaryParts.join(' – ') : null;
                            const primaryNudge = Array.isArray(opportunity.nudges) ? opportunity.nudges[0] : null;
                            const collaboratorCount = Array.isArray(opportunity.collaborators)
                              ? opportunity.collaborators.length
                              : 0;
                            const researchLinks = Array.isArray(opportunity.researchLinks)
                              ? opportunity.researchLinks.slice(0, 2)
                              : [];
                            const attachmentsCount = Array.isArray(opportunity.attachments)
                              ? opportunity.attachments.length
                              : 0;
                            const cardHighlight = opportunity.isOverdue || opportunity.followUpStatus === 'overdue';

                            return (
                              <article
                                key={`${stage.id}-${opportunity.id}`}
                                className={`rounded-2xl border p-4 text-sm transition ${
                                  cardHighlight
                                    ? 'border-rose-200 bg-rose-50/70 shadow-inner'
                                    : 'border-slate-200 bg-slate-50/60 hover:border-accent/40 hover:bg-white'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="font-semibold text-slate-900">{opportunity.title}</p>
                                    <p className="text-xs text-slate-500">{opportunity.companyName}</p>
                                  </div>
                                  <span
                                    className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                                      cardHighlight
                                        ? 'bg-rose-500/10 text-rose-600'
                                        : 'bg-accentSoft text-accent'
                                    }`}
                                  >
                                    {formatStatus(opportunity.followUpStatus)}
                                  </span>
                                </div>
                                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
                                  <div>
                                    <p className="uppercase tracking-wide">Stage duration</p>
                                    <p className="mt-1 text-slate-700">{opportunity.stageDurationHours ?? '—'}h</p>
                                  </div>
                                  <div>
                                    <p className="uppercase tracking-wide">Next action</p>
                                    <p className="mt-1 text-slate-700">
                                      {opportunity.nextActionDueAt ? formatAbsolute(opportunity.nextActionDueAt) : 'Not scheduled'}
                                    </p>
                                  </div>
                                  {salaryLabel ? (
                                    <div>
                                      <p className="uppercase tracking-wide">Salary range</p>
                                      <p className="mt-1 text-slate-700">{salaryLabel}</p>
                                    </div>
                                  ) : null}
                                  <div>
                                    <p className="uppercase tracking-wide">Last activity</p>
                                    <p className="mt-1 text-slate-700">
                                      {opportunity.lastActivityAt ? formatRelativeTime(opportunity.lastActivityAt) : '—'}
                                    </p>
                                  </div>
                                </div>
                                {opportunity.researchSummary ? (
                                  <p className="mt-3 text-sm text-slate-600">{opportunity.researchSummary}</p>
                                ) : null}
                                {researchLinks.length ? (
                                  <ul className="mt-3 space-y-1 text-xs text-accent">
                                    {researchLinks.map((link) => (
                                      <li key={`${opportunity.id}-${link.url ?? link}`}>
                                        <a
                                          href={link.url ?? link.href ?? '#'}
                                          className="inline-flex items-center gap-1 hover:underline"
                                          target="_blank"
                                          rel="noreferrer"
                                        >
                                          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                                          {link.label ?? link.title ?? link.url ?? 'Resource'}
                                        </a>
                                      </li>
                                    ))}
                                  </ul>
                                ) : null}
                                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                  {collaboratorCount ? (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
                                      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                                      {collaboratorCount} collaborator{collaboratorCount === 1 ? '' : 's'}
                                    </span>
                                  ) : null}
                                  {attachmentsCount ? (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
                                      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                                      {attachmentsCount} attachment{attachmentsCount === 1 ? '' : 's'}
                                    </span>
                                  ) : null}
                                  {opportunity.candidateBrief?.shareUrl ? (
                                    <a
                                      href={opportunity.candidateBrief.shareUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1 rounded-full bg-accentSoft px-2.5 py-1 text-accent hover:bg-accent/10"
                                    >
                                      Share brief
                                    </a>
                                  ) : null}
                                </div>
                                <div className="mt-3 flex flex-col gap-2 text-xs">
                                  {primaryNudge ? (
                                    <div
                                      className={`rounded-xl border px-3 py-2 ${
                                        primaryNudge.severity === 'critical'
                                          ? 'border-rose-200 bg-rose-50 text-rose-600'
                                          : primaryNudge.severity === 'warning'
                                          ? 'border-amber-200 bg-amber-50 text-amber-700'
                                          : 'border-accent/40 bg-accentSoft text-accent'
                                      }`}
                                    >
                                      <p className="font-medium">{primaryNudge.message}</p>
                                      <p className="mt-1 text-[11px] uppercase tracking-wide">
                                        Triggered {formatRelativeTime(primaryNudge.triggeredAt)}
                                      </p>
                                    </div>
                                  ) : null}
                                  <div className="grid grid-cols-2 gap-2 text-slate-500">
                                    <div>
                                      <p className="text-[11px] uppercase tracking-wide">Compliance</p>
                                      <p className="mt-1 font-medium text-slate-700">
                                        {formatStatus(opportunity.complianceStatus)}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-[11px] uppercase tracking-wide">Guardrail</p>
                                      <p className="mt-1 font-medium text-slate-700">
                                        {opportunity.automationMetadata?.guardrail ?? 'On track'}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </article>
                            );
                          })
                        ) : (
                          <p className="text-sm text-slate-500">No opportunities in this stage yet.</p>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-slate-500">
                  Configure your first pipeline board to unlock automation insights.
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3" id="career-pipeline-automation-collaboration">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">Bulk status updates & reminders</h3>
              <p className="mt-1 text-sm text-slate-600">
                Automate follow-ups across opportunities and trigger nudges before SLAs are breached.
              </p>
              <div className="mt-4 rounded-2xl border border-accent/40 bg-accentSoft/70 p-4 text-sm text-slate-700">
                <p className="font-semibold text-accent">Bulk updates pending</p>
                <p className="mt-1 text-3xl font-semibold text-slate-900">
                  {formatNumber(bulkOperations.pendingBulkUpdates ?? 0)}
                </p>
                <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">Require attention for SLA alignment</p>
              </div>
              <div className="mt-4 space-y-3">
                {Array.isArray(bulkOperations.reminders) && bulkOperations.reminders.length ? (
                  bulkOperations.reminders.map((reminder) => (
                    <div
                      key={`${reminder.opportunityId}-${reminder.stageKey}`}
                      className={`rounded-2xl border px-4 py-3 text-sm ${
                        reminder.severity === 'critical'
                          ? 'border-rose-200 bg-rose-50 text-rose-600'
                          : reminder.severity === 'warning'
                          ? 'border-amber-200 bg-amber-50 text-amber-700'
                          : 'border-slate-200 bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-wide">
                        <span>{reminder.stageName ?? 'Stage'}</span>
                        <span>{reminder.dueAt ? formatAbsolute(reminder.dueAt) : 'Ad-hoc'}</span>
                      </div>
                      <p className="mt-1 font-semibold text-slate-900">{reminder.title}</p>
                      <p className="text-xs text-slate-500">{reminder.companyName}</p>
                      <p className="mt-2 text-sm">{reminder.recommendation}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No smart reminders pending.</p>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">Candidate briefs & sharing</h3>
              <p className="mt-1 text-sm text-slate-600">
                Generate referral-ready briefs that keep agencies and mentors aligned on your positioning.
              </p>
              <div className="mt-4 space-y-3">
                {candidateBriefs.length ? (
                  candidateBriefs.slice(0, 5).map((brief) => (
                    <div key={brief.id} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-slate-900">Brief #{brief.id}</p>
                        <span className="rounded-full bg-accentSoft px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-accent">
                          {formatStatus(brief.status)}
                        </span>
                      </div>
                      {brief.summary ? <p className="mt-2 text-sm text-slate-600">{brief.summary}</p> : null}
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        {Array.isArray(brief.strengths) && brief.strengths.length ? (
                          <span>{brief.strengths.slice(0, 2).join(' • ')}</span>
                        ) : null}
                        {brief.shareUrl ? (
                          <a
                            href={brief.shareUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-full bg-accentSoft px-2.5 py-1 text-accent hover:bg-accent/10"
                          >
                            Share link
                          </a>
                        ) : null}
                        {brief.lastSharedAt ? (
                          <span>Shared {formatRelativeTime(brief.lastSharedAt)}</span>
                        ) : null}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No briefs published yet.</p>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">Compliance guardrails</h3>
              <p className="mt-1 text-sm text-slate-600">
                Stay audit-ready with equal opportunity reporting and automatic guardrails for sensitive data.
              </p>
              <dl className="mt-4 grid grid-cols-2 gap-4 text-sm text-slate-700">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Flagged</dt>
                  <dd className="mt-1 text-xl font-semibold text-rose-600">
                    {formatNumber(complianceInsights.flaggedOpportunities ?? 0)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Pending reports</dt>
                  <dd className="mt-1 text-xl font-semibold text-slate-900">
                    {formatNumber(complianceInsights.pendingReports ?? 0)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Completed</dt>
                  <dd className="mt-1 text-xl font-semibold text-slate-900">
                    {formatNumber(complianceInsights.completedReports ?? 0)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Last audit</dt>
                  <dd className="mt-1 text-xl font-semibold text-slate-900">
                    {complianceInsights.lastAuditAt ? formatAbsolute(complianceInsights.lastAuditAt) : '—'}
                  </dd>
                </div>
              </dl>
              <div className="mt-4 space-y-2">
                {Array.isArray(complianceInsights.snapshots) && complianceInsights.snapshots.length ? (
                  complianceInsights.snapshots.slice(0, 3).map((snapshot) => (
                    <div key={snapshot.opportunityId} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs">
                      <p className="font-semibold text-slate-800">{snapshot.companyName}</p>
                      {snapshot.submittedAt ? (
                        <p className="text-slate-500">Submitted {formatRelativeTime(snapshot.submittedAt)}</p>
                      ) : null}
                      {snapshot.metrics ? (
                        <p className="mt-1 text-slate-500">
                          {Object.entries(snapshot.metrics)
                            .slice(0, 2)
                            .map(([key, value]) => `${formatStatus(key)}: ${value}`)
                            .join(' • ')}
                        </p>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No compliance snapshots captured.</p>
                )}
              </div>
            </div>
          </div>

          <div id="career-interview-command-center" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Interview command center</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Consolidate interview panels, prep tasks, calendars, and AI rehearsal prompts in one workspace.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm text-slate-700">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Upcoming</p>
                  <p className="mt-1 text-xl font-semibold text-slate-900">
                    {formatNumber(interviewCommand.summary?.upcoming ?? 0)}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Completed</p>
                  <p className="mt-1 text-xl font-semibold text-slate-900">
                    {formatNumber(interviewCommand.summary?.completed ?? 0)}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Checklist</p>
                  <p className="mt-1 text-xl font-semibold text-slate-900">
                    {formatNumber(interviewCommand.readiness?.completedItems ?? 0)} /{' '}
                    {formatNumber(interviewCommand.readiness?.totalItems ?? 0)}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Avg score</p>
                  <p className="mt-1 text-xl font-semibold text-slate-900">
                    {interviewCommand.summary?.averageScore != null ? interviewCommand.summary.averageScore : '—'}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-4">
                {Array.isArray(interviewCommand.workspaces) && interviewCommand.workspaces.length ? (
                  interviewCommand.workspaces.slice(0, 3).map((workspace) => (
                    <div key={workspace.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">Workspace #{workspace.id}</p>
                          <p className="text-xs text-slate-500">
                            {workspace.status ? formatStatus(workspace.status) : 'Planning'} • Interview {workspace.opportunityId}
                          </p>
                        </div>
                        {workspace.calendarEventId ? (
                          <span className="rounded-full bg-accentSoft px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-accent">
                            Synced
                          </span>
                        ) : null}
                      </div>
                      {workspace.roomUrl ? (
                        <p className="mt-2 text-xs text-accent">
                          <a href={workspace.roomUrl} target="_blank" rel="noreferrer" className="hover:underline">
                            Join virtual room
                          </a>
                        </p>
                      ) : null}
                      <div className="mt-3 grid gap-3 text-xs text-slate-600 md:grid-cols-2">
                        <div>
                          <p className="text-[11px] uppercase tracking-wide">Prep checklist</p>
                          <ul className="mt-1 space-y-1">
                            {normalizeChecklist(workspace.prepChecklist).slice(0, 3).map((item, index) => (
                              <li key={`${workspace.id}-check-${index}`} className="flex items-center gap-2">
                                <span
                                  className={`h-2 w-2 rounded-full ${item.completed ? 'bg-accent' : 'bg-slate-300'}`}
                                />
                                <span className="text-slate-700">{item.label ?? 'Checklist item'}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-[11px] uppercase tracking-wide">AI rehearsal prompts</p>
                          <ul className="mt-1 space-y-1">
                            {normalizePrompts(workspace.aiPrompts).slice(0, 3).map((prompt, index) => (
                              <li key={`${workspace.id}-prompt-${index}`} className="text-slate-700">
                                {typeof prompt === 'string' ? prompt : prompt?.title ?? 'Prompt'}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      {Array.isArray(workspace.scorecards) && workspace.scorecards.length ? (
                        <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-600">
                          <p className="font-semibold text-slate-800">Live scorecards</p>
                          <div className="mt-2 grid grid-cols-2 gap-2">
                            {workspace.scorecards.slice(0, 2).map((scorecard) => (
                              <div key={scorecard.id} className="rounded-lg bg-slate-50 p-2">
                                <p className="text-[11px] uppercase tracking-wide text-slate-500">
                                  {scorecard.interviewerId ? `Interviewer #${scorecard.interviewerId}` : 'Interviewer'}
                                </p>
                                <p className="mt-1 font-semibold text-slate-800">
                                  {scorecard.overallScore != null ? scorecard.overallScore : '—'}
                                </p>
                                <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-500">
                                  {formatStatus(scorecard.recommendation)}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No interview workspaces configured.</p>
                )}
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <h4 className="text-sm font-semibold text-slate-900">Action items</h4>
                  <div className="mt-2 space-y-2 text-xs text-slate-600">
                    {Array.isArray(interviewCommand.tasks) && interviewCommand.tasks.length ? (
                      interviewCommand.tasks.map((task) => (
                        <div key={task.id} className="rounded-xl border border-slate-200 bg-white p-3">
                          <p className="font-medium text-slate-800">{task.title}</p>
                          <p className="text-[11px] uppercase tracking-wide text-slate-500">
                            {formatStatus(task.status)} • {formatStatus(task.priority)}
                          </p>
                          <p className="mt-1 text-slate-600">{task.description}</p>
                          <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-500">
                            {task.dueAt ? `Due ${formatAbsolute(task.dueAt)}` : 'No due date'}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p>No open tasks.</p>
                    )}
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-xs text-slate-600">
                  <h4 className="text-sm font-semibold text-slate-900">Recommendation mix</h4>
                  <div className="mt-2 space-y-1">
                    {interviewCommand.summary?.recommendations
                      ? Object.entries(interviewCommand.summary.recommendations).map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between">
                            <span>{formatStatus(key)}</span>
                            <span className="font-semibold text-slate-800">{formatNumber(value)}</span>
                          </div>
                        ))
                      : (
                        <p>No feedback captured.</p>
                        )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div id="career-offer-negotiation-vault" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Offer negotiation vault</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Store compensation data, negotiation scripts, scenario models, and signed documents side-by-side.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3 text-sm text-slate-700">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Active</p>
                  <p className="mt-1 text-xl font-semibold text-slate-900">
                    {formatNumber(offerVault.metrics?.activeOffers ?? 0)}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Accepted</p>
                  <p className="mt-1 text-xl font-semibold text-slate-900">
                    {formatNumber(offerVault.metrics?.acceptedOffers ?? 0)}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Avg. total value</p>
                  <p className="mt-1 text-xl font-semibold text-slate-900">
                    {offerVault.metrics?.averageTotalValue != null
                      ? formatCurrency(offerVault.metrics.averageTotalValue, offerVault.packages?.[0]?.currencyCode ?? 'USD')
                      : '—'}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {Array.isArray(offerVault.packages) && offerVault.packages.length ? (
                offerVault.packages.slice(0, 4).map((offer) => (
                  <div key={offer.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">Offer #{offer.id}</p>
                        <p className="text-xs text-slate-500">{formatStatus(offer.status)}</p>
                      </div>
                      <span className="rounded-full bg-accentSoft px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-accent">
                        {formatStatus(offer.decisionStatus)}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
                      <div>
                        <p className="text-[11px] uppercase tracking-wide">Total comp</p>
                        <p className="mt-1 font-semibold text-slate-800">
                          {offer.totalCompValue != null
                            ? formatCurrency(offer.totalCompValue, offer.currencyCode ?? 'USD')
                            : '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-wide">Base salary</p>
                        <p className="mt-1 font-semibold text-slate-800">
                          {offer.baseSalary != null
                            ? formatCurrency(offer.baseSalary, offer.currencyCode ?? 'USD')
                            : '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-wide">Equity</p>
                        <p className="mt-1 font-semibold text-slate-800">
                          {offer.equityValue != null
                            ? formatCurrency(offer.equityValue, offer.currencyCode ?? 'USD')
                            : '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-wide">Bonus</p>
                        <p className="mt-1 font-semibold text-slate-800">
                          {offer.bonusTarget != null
                            ? formatCurrency(offer.bonusTarget, offer.currencyCode ?? 'USD')
                            : '—'}
                        </p>
                      </div>
                    </div>
                    {offer.scenarioModel?.summary ? (
                      <p className="mt-3 text-xs text-slate-600">{offer.scenarioModel.summary}</p>
                    ) : null}
                    {Array.isArray(offer.scenarios) && offer.scenarios.length ? (
                      <div className="mt-3 space-y-2 text-xs text-slate-600">
                        <p className="text-[11px] uppercase tracking-wide text-slate-500">Scenario modeling</p>
                        {offer.scenarios.slice(0, 2).map((scenario) => (
                          <div key={scenario.id} className="rounded-lg border border-slate-200 bg-white p-3">
                            <p className="font-semibold text-slate-800">{scenario.label}</p>
                            <p className="text-slate-500">
                              {scenario.totalValue != null
                                ? formatCurrency(scenario.totalValue, offer.currencyCode ?? 'USD')
                                : '—'}{' '}
                              total • {scenario.notes ?? 'Modeled assumptions applied'}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    {Array.isArray(offer.documents) && offer.documents.length ? (
                      <div className="mt-3 space-y-1 text-xs text-slate-600">
                        <p className="text-[11px] uppercase tracking-wide text-slate-500">Documents</p>
                        {offer.documents.slice(0, 2).map((document) => (
                          <div key={document.id} className="flex items-center justify-between">
                            <span>{document.fileName}</span>
                            <span className="text-[11px] uppercase tracking-wide">
                              {document.isSigned ? `Signed ${formatRelativeTime(document.signedAt)}` : 'Awaiting signature'}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No offers captured yet.</p>
              )}
            </div>
          </div>

          <div id="career-auto-apply-rules" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Auto job application criteria</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Define guardrailed rules for salary, role, visa, and culture-fit filters. Review drafts before sending or
                  allow trusted rules to auto-submit on your behalf.
                </p>
              </div>
              <div className="rounded-2xl border border-accent/40 bg-accentSoft/70 p-4 text-sm text-slate-700 shadow-inner">
                <p className="font-semibold text-accent">Guardrails</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
                  {formatNumber(autoApply.guardrails?.manualReviewRequired ?? 0)} rules require manual review
                </p>
                <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
                  {formatNumber(autoApply.guardrails?.premiumProtected ?? 0)} premium roles blocked from auto-send
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              {Array.isArray(autoApply.rules) && autoApply.rules.length ? (
                autoApply.rules.slice(0, 6).map((rule) => {
                  const latestAnalytics = Array.isArray(rule.analytics) ? rule.analytics[0] : null;
                  const latestTestRun = Array.isArray(rule.recentTestRuns) ? rule.recentTestRuns[0] : null;
                  const criteria = rule.criteria && typeof rule.criteria === 'object' ? rule.criteria : {};
                  const rejectionReasons = latestAnalytics?.rejectionReasons || {};
                  return (
                    <div key={rule.id} className="flex h-full flex-col rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">{rule.name}</p>
                          <p className="text-xs text-slate-500">{formatStatus(rule.status)}</p>
                        </div>
                        {rule.sandboxMode ? (
                          <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-700">
                            Sandbox
                          </span>
                        ) : rule.autoSendEnabled ? (
                          <span className="rounded-full bg-accentSoft px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-accent">
                            Auto-send
                          </span>
                        ) : null}
                      </div>
                      {rule.description ? <p className="mt-2 text-sm text-slate-600">{rule.description}</p> : null}
                      <div className="mt-3 space-y-2 text-xs text-slate-600">
                        {criteria.role ? (
                          <p>
                            <span className="font-semibold text-slate-800">Role: </span>
                            {criteria.role}
                          </p>
                        ) : null}
                        {criteria.salary ? (
                          <p>
                            <span className="font-semibold text-slate-800">Salary: </span>
                            {criteria.salary}
                          </p>
                        ) : null}
                        {criteria.location ? (
                          <p>
                            <span className="font-semibold text-slate-800">Location: </span>
                            {criteria.location}
                          </p>
                        ) : null}
                        {criteria.visa ? (
                          <p>
                            <span className="font-semibold text-slate-800">Visa: </span>
                            {criteria.visa}
                          </p>
                        ) : null}
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
                        <div>
                          <p className="text-[11px] uppercase tracking-wide text-slate-500">Last run</p>
                          <p className="mt-1 font-semibold text-slate-800">
                            {latestTestRun?.executedAt ? formatRelativeTime(latestTestRun.executedAt) : '—'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] uppercase tracking-wide text-slate-500">Status</p>
                          <p className="mt-1 font-semibold text-slate-800">
                            {latestTestRun ? formatStatus(latestTestRun.status) : 'Not tested'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] uppercase tracking-wide text-slate-500">Conversions</p>
                          <p className="mt-1 font-semibold text-slate-800">
                            {latestAnalytics ? formatNumber(latestAnalytics.conversions ?? 0) : '0'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] uppercase tracking-wide text-slate-500">Rejections</p>
                          <p className="mt-1 font-semibold text-slate-800">
                            {latestAnalytics ? formatNumber(latestAnalytics.rejections ?? 0) : '0'}
                          </p>
                        </div>
                      </div>
                      {Object.keys(rejectionReasons).length ? (
                        <div className="mt-3 text-xs text-slate-600">
                          <p className="text-[11px] uppercase tracking-wide text-slate-500">Top rejection reasons</p>
                          <ul className="mt-1 space-y-1">
                            {Object.entries(rejectionReasons)
                              .slice(0, 2)
                              .map(([reason, value]) => (
                                <li key={reason} className="flex items-center justify-between">
                                  <span>{formatStatus(reason)}</span>
                                  <span className="font-semibold text-slate-800">{formatNumber(value)}</span>
                                </li>
                              ))}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-slate-500">No automation rules configured.</p>
              )}
            </div>

            {Array.isArray(autoApply.analytics) && autoApply.analytics.length ? (
              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Rule</th>
                      <th className="px-4 py-3">Window</th>
                      <th className="px-4 py-3">Submissions</th>
                      <th className="px-4 py-3">Conversions</th>
                      <th className="px-4 py-3">Manual reviews</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {autoApply.analytics.slice(0, 6).map((record) => (
                      <tr key={`${record.ruleId}-${record.windowEnd}`} className="bg-white">
                        <td className="px-4 py-3 font-medium text-slate-800">Rule #{record.ruleId}</td>
                        <td className="px-4 py-3 text-slate-500">
                          {formatAbsolute(record.windowStart, { dateStyle: 'medium' })} –{' '}
                          {formatAbsolute(record.windowEnd, { dateStyle: 'medium' })}
                        </td>
                        <td className="px-4 py-3">{formatNumber(record.submissions ?? 0)}</td>
                        <td className="px-4 py-3">{formatNumber(record.conversions ?? 0)}</td>
                        <td className="px-4 py-3">{formatNumber(record.manualReviews ?? 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-5">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900">Pipeline health</h2>
              <span className="text-xs uppercase tracking-wide text-slate-500">Updated {formatRelativeTime(data?.pipeline?.lastActivityAt)}</span>
            </div>
            <div className="mt-6 space-y-4">
              {pipeline.length ? (
                pipeline.map((row) => {
                  const percent = Math.round((row.count / pipelineTotal) * 100);
                  return (
                    <div key={row.status}>
                      <div className="flex items-center justify-between text-sm text-slate-600">
                        <span className="font-medium text-slate-700">{formatStatus(row.status)}</span>
                        <span>{formatNumber(row.count)}</span>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-slate-100">
                        <div
                          className="h-2 rounded-full bg-accent"
                          style={{ width: `${Math.min(100, Math.max(5, percent))}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-slate-500">No applications yet — once you submit, pipeline insights will appear here.</p>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
            <h2 className="text-lg font-semibold text-slate-900">Automations & readiness</h2>
            <div className="mt-4 space-y-3">
              {automations.length ? (
                automations.map((item) => (
                  <div key={item.title} className="rounded-2xl border border-accent/30 bg-accentSoft/70 p-4">
                    <p className="text-sm font-semibold text-accent">{item.title}</p>
                    {item.detail ? <p className="text-xs uppercase tracking-wide text-accent/80">{item.detail}</p> : null}
                    <p className="mt-2 text-sm text-slate-600">{item.recommendation}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No automation alerts — keep availability and launchpad signals fresh to unlock new opportunities.</p>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Recent applications</h2>
            <span className="text-xs uppercase tracking-wide text-slate-500">Showing up to 10 latest updates</span>
          </div>
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm text-slate-600">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="pb-3 pr-4">Opportunity</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 pr-4">Last update</th>
                  <th className="pb-3">Next step</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {recentApplications.length ? (
                  recentApplications.map((application) => (
                    <tr key={application.id} className="transition hover:bg-accentSoft/40">
                      <td className="py-3 pr-4">
                        <p className="font-medium text-slate-800">
                          {application.target?.title || application.target?.name || `#${application.targetId}`}
                        </p>
                        <p className="text-xs text-slate-500">{application.targetType?.toUpperCase()}</p>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="inline-flex rounded-full border border-accent/40 bg-accentSoft px-3 py-1 text-xs font-medium text-accent">
                          {formatStatus(application.status)}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-slate-500">{formatAbsolute(application.updatedAt)}</td>
                      <td className="py-3 text-slate-600">{application.nextStep}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="py-6 text-center text-sm text-slate-500">
                      Start applying to opportunities to see your pipeline history.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Follow-ups & nudges</h2>
            <div className="mt-4 space-y-3">
              {followUps.length ? (
                followUps.map((item) => (
                  <div key={`${item.applicationId}-${item.targetName}`} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <div className="flex items-center justify-between text-sm">
                      <p className="font-medium text-slate-800">{item.targetName}</p>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${item.overdue ? 'bg-rose-100 text-rose-600' : 'bg-accentSoft text-accent'}`}>
                        {item.overdue ? 'Overdue' : 'Upcoming'}
                      </span>
                    </div>
                    <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">{formatStatus(item.status)}</p>
                    <p className="mt-2 text-sm text-slate-600">{item.nextStep}</p>
                    {item.dueAt ? (
                      <p className="mt-2 text-xs text-slate-500">Suggested follow-up by {formatAbsolute(item.dueAt, { dateStyle: 'medium' })}</p>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">You are fully up to date — new follow-up tasks will appear here as applications progress.</p>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Interview schedule</h2>
            <div className="mt-4 space-y-3">
              {interviews.length ? (
                interviews.map((interview) => (
                  <div key={interview.applicationId} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <p className="text-sm font-semibold text-slate-800">{interview.targetName}</p>
                    <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">{formatStatus(interview.status)}</p>
                    <p className="mt-2 text-sm text-slate-600">
                      {interview.scheduledAt ? `Scheduled ${formatAbsolute(interview.scheduledAt)}` : 'Awaiting confirmation'}
                    </p>
                    {interview.reviewer ? (
                      <p className="mt-1 text-xs text-slate-500">With {interview.reviewer.firstName} {interview.reviewer.lastName}</p>
                    ) : null}
                    <p className="mt-2 text-xs text-slate-500">{interview.nextStep}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No interviews booked yet — schedule notifications will appear here when recruiters confirm.</p>
              )}
            </div>
          </div>
        </section>

        {userId ? (
          <EventManagementSection data={eventManagement} userId={userId} onRefresh={() => refresh({ force: true })} />
        ) : null}

        <ProjectGigManagementContainer userId={userId} />
        {documentStudio ? (
          <DocumentStudioSection
            data={documentStudio}
            userId={userId}
            onRefresh={() => refresh({ force: true })}
          />
        ) : null}

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Document workspace</h2>
            <div className="mt-4 space-y-3">
              {documents.attachments?.length ? (
                documents.attachments.map((file) => (
                  <div key={`${file.applicationId}-${file.fileName}`} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <p className="text-sm font-semibold text-slate-800">{file.fileName}</p>
                    <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">Application #{file.applicationId}</p>
                    <p className="mt-2 text-sm text-slate-600">Uploaded {formatAbsolute(file.uploadedAt)}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">Upload CVs, cover letters, and case studies to populate your document workspace.</p>
              )}
            </div>
            {documents.portfolioLinks?.length ? (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-slate-800">Portfolio links</h3>
                <ul className="mt-2 space-y-2 text-sm text-accent">
                  {documents.portfolioLinks.map((link) => (
                    <li key={link.url}>
                      <a href={link.url} target="_blank" rel="noreferrer" className="hover:underline">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Launchpad & activity</h2>
            <div className="mt-4 space-y-3">
              {launchpadApplications.length ? (
                launchpadApplications.map((application) => (
                  <div key={application.id} className="rounded-2xl border border-accent/30 bg-accentSoft/70 p-4">
                    <p className="text-sm font-semibold text-accent">
                      {application.launchpad?.title || 'Launchpad application'}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-wide text-accent/80">{formatStatus(application.status)}</p>
                    {application.interviewScheduledAt ? (
                      <p className="mt-2 text-sm text-slate-600">Interview scheduled {formatAbsolute(application.interviewScheduledAt)}</p>
                    ) : null}
                    {application.qualificationScore ? (
                      <p className="mt-1 text-xs text-slate-500">Readiness score {application.qualificationScore}</p>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">Opt into launchpad cohorts to see readiness insights and interview milestones.</p>
              )}
            </div>
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-slate-800">Project activity</h3>
              <div className="mt-3 space-y-3">
                {projectActivity.length ? (
                  projectActivity.map((event) => (
                    <div key={event.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                      <p className="text-sm font-semibold text-slate-800">{event.project?.title || 'Project update'}</p>
                      <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">{formatStatus(event.eventType)}</p>
                      <p className="mt-2 text-xs text-slate-500">{formatRelativeTime(event.createdAt)}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No recent project automation events.</p>
                )}
              </div>
            </div>
          </div>
        </section>

        <section
          id="insights-accountability-support"
          className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Insights, accountability, &amp; support</h2>
              <p className="text-sm text-slate-500">
                Stay in the loop with market data, coach collaboration, calendars, and progress retrospectives.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-medium">
              <span className="inline-flex items-center gap-1 rounded-full bg-accentSoft px-3 py-1 text-accent">
                {formatPercent(careerSummary.conversionRate ?? 0)} outreach conversion
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                {supportSummary.openCases ?? 0} open support cases
              </span>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <div className="space-y-6 xl:col-span-2">
              <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">Career analytics</h3>
                    <p className="text-sm text-slate-500">
                      Monitor conversions, interview momentum, and salary signals for your pipeline.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      { label: 'Conversion', change: formatChangeBadge(careerSummary.conversionChange, { suffix: ' pts' }) },
                      { label: 'Interviews', change: formatChangeBadge(careerSummary.interviewChange, { suffix: ' pts' }) },
                      { label: 'Offers', change: formatChangeBadge(careerSummary.offerChange, { suffix: ' pts' }) },
                      { label: 'Salary', change: formatChangeBadge(careerSummary.salary?.change, { suffix: ' pts' }) },
                    ].map((item) => (
                      <span
                        key={item.label}
                        className={`inline-flex items-center justify-center gap-1 rounded-full px-2.5 py-1 ${
                          item.change.tone === 'positive'
                            ? 'bg-emerald-50 text-emerald-600'
                            : item.change.tone === 'negative'
                              ? 'bg-rose-50 text-rose-600'
                              : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <span className="font-semibold">{item.change.label}</span>
                        <span className="font-normal text-slate-500">{item.label}</span>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Outreach conversion</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">
                      {formatPercent(careerSummary.conversionRate ?? 0)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Interview momentum</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">
                      {formatPercent(careerSummary.interviewMomentum ?? 0)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Offer win rate</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">
                      {formatPercent(careerSummary.offerWinRate ?? 0)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Median salary</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">
                      {formatCurrency(
                        careerSummary.salary?.value ?? null,
                        careerSummary.salary?.currency ?? 'USD',
                      )}
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800">Period snapshots</h4>
                    <div className="mt-3 space-y-3 text-sm text-slate-600">
                      {careerSnapshots.length ? (
                        careerSnapshots.slice(0, 4).map((snapshot) => (
                          <div
                            key={`${snapshot.id ?? snapshot.timeframeEnd}-snapshot`}
                            className="rounded-xl border border-slate-200 bg-white/80 p-3"
                          >
                            <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                              <span className="font-semibold text-slate-700">
                                {formatAbsolute(snapshot.timeframeStart, { dateStyle: 'medium' })} –{' '}
                                {formatAbsolute(snapshot.timeframeEnd, { dateStyle: 'medium' })}
                              </span>
                            </div>
                            <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
                              <div>
                                <dt className="text-slate-500">Conversion</dt>
                                <dd className="font-semibold text-slate-800">
                                  {formatPercent(snapshot.outreachConversionRate ?? 0)}
                                </dd>
                              </div>
                              <div>
                                <dt className="text-slate-500">Interviews</dt>
                                <dd className="font-semibold text-slate-800">
                                  {formatPercent(snapshot.interviewMomentum ?? 0)}
                                </dd>
                              </div>
                              <div>
                                <dt className="text-slate-500">Offers</dt>
                                <dd className="font-semibold text-slate-800">
                                  {formatPercent(snapshot.offerWinRate ?? 0)}
                                </dd>
                              </div>
                            </dl>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500">
                          Submit applications to unlock conversion analytics and funnel retrospectives.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {careerDiversity ? (
                      <div className="rounded-xl border border-slate-200 bg-white/80 p-4">
                        <h4 className="text-sm font-semibold text-slate-800">Diversity mix</h4>
                        <ul className="mt-3 space-y-2 text-xs text-slate-600">
                          {Object.entries(careerDiversity)
                            .slice(0, 4)
                            .map(([label, value]) => (
                              <li key={label} className="flex items-center justify-between">
                                <span className="font-medium text-slate-700">{formatStatus(label)}</span>
                                <span>{formatPercent(Number(value) ?? 0)}</span>
                              </li>
                            ))}
                        </ul>
                      </div>
                    ) : null}

                    {careerFunnel ? (
                      <div className="rounded-xl border border-slate-200 bg-white/80 p-4">
                        <h4 className="text-sm font-semibold text-slate-800">Pipeline funnel</h4>
                        <div className="mt-3 space-y-3 text-xs text-slate-600">
                          {Object.entries(careerFunnel)
                            .slice(0, 4)
                            .map(([label, value]) => (
                              <div key={label}>
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-slate-700">{formatStatus(label)}</span>
                                  <span>{formatNumber(value)}</span>
                                </div>
                                <div className="mt-2 h-1.5 rounded-full bg-slate-100">
                                  <div
                                    className="h-1.5 rounded-full bg-accent"
                                    style={{ width: `${Math.min(100, Math.max(4, Number(value) * 5))}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">Calendar &amp; rituals</h3>
                    <p className="text-sm text-slate-500">
                      Combine interviews, networking, deadlines, and wellbeing rituals in one focus layer.
                    </p>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <p>Total focus time {formatMinutesToHours(focusMinutesTotal)}</p>
                    {nextFocusBlock?.startsAt ? (
                      <p>Next focus block {formatRelativeTime(nextFocusBlock.startsAt)}</p>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 grid gap-5 lg:grid-cols-2">
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-slate-800">Upcoming interviews</h4>
                    {upcomingInterviewEvents.length ? (
                      upcomingInterviewEvents.slice(0, 4).map((event) => (
                        <div key={event.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-sm font-semibold text-slate-800">{event.title}</p>
                          <p className="text-xs uppercase tracking-wide text-slate-500">{formatStatus(event.eventType)}</p>
                          <p className="mt-1 text-xs text-slate-500">{formatAbsolute(event.startsAt)}</p>
                          {event.location ? (
                            <p className="mt-1 text-xs text-slate-500">{event.location}</p>
                          ) : null}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">No interviews scheduled yet — sync a calendar to stay ahead.</p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-slate-800">Focus sessions</h4>
                    {focusSessions.length ? (
                      focusSessions.slice(0, 4).map((session) => (
                        <div key={session.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-semibold text-slate-800">{formatStatus(session.focusType)}</span>
                            <span className="text-xs text-slate-500">
                              {session.startedAt ? formatRelativeTime(session.startedAt) : 'Scheduled'}
                            </span>
                          </div>
                          <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
                            {session.completed ? 'Completed' : 'Planned'} • {formatMinutesToHours(session.durationMinutes)}
                          </p>
                          {session.notes ? (
                            <p className="mt-2 text-xs text-slate-600">{session.notes}</p>
                          ) : null}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">
                        No focus sessions logged — block time for interview prep or relationship sprints.
                      </p>
                    )}

                    {focusByTypeEntries.length ? (
                      <div className="rounded-xl border border-slate-200 bg-white/80 p-3 text-xs text-slate-600">
                        <p className="font-semibold text-slate-700">Focus mix</p>
                        <ul className="mt-2 space-y-1">
                          {focusByTypeEntries.map(([key, value]) => (
                            <li key={key} className="flex items-center justify-between">
                              <span>{formatStatus(key)}</span>
                              <span>{formatMinutesToHours(value)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
                <h3 className="text-base font-semibold text-slate-900">Weekly digest &amp; integrations</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Weekly digest emails and on-demand dashboards keep your collaborators accountable.
                </p>

                <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Digest subscription</p>
                  {digestSubscription ? (
                    <div className="mt-2 space-y-2">
                      <p>
                        Frequency:{' '}
                        <span className="font-semibold text-slate-800">
                          {formatStatus(digestSubscription.frequency)}
                        </span>
                      </p>
                      <p>
                        Status:{' '}
                        <span className={digestSubscription.isActive ? 'text-emerald-600' : 'text-amber-600'}>
                          {digestSubscription.isActive ? 'Active' : 'Paused'}
                        </span>
                      </p>
                      <p>
                        Last sent:{' '}
                        {digestSubscription.lastSentAt ? formatRelativeTime(digestSubscription.lastSentAt) : 'Never'}
                      </p>
                      <p>
                        Next scheduled:{' '}
                        {digestSubscription.nextScheduledAt
                          ? formatAbsolute(digestSubscription.nextScheduledAt)
                          : 'Not scheduled'}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-2">Enable weekly digests to receive momentum recaps and coaching nudges.</p>
                  )}
                </div>

                <div className="mt-5 space-y-3">
                  <h4 className="text-sm font-semibold text-slate-800">Connected calendars</h4>
                  {digestIntegrations.length ? (
                    digestIntegrations.map((integration) => {
                      const statusTone =
                        integration.status === 'connected'
                          ? 'text-emerald-600'
                          : integration.status === 'syncing'
                            ? 'text-amber-600'
                            : integration.status === 'error'
                              ? 'text-rose-600'
                              : 'text-slate-500';
                      return (
                        <div key={integration.id ?? integration.provider} className="rounded-xl border border-slate-200 p-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-slate-800">{formatStatus(integration.provider)}</span>
                            <span className={`text-xs font-semibold uppercase ${statusTone}`}>
                              {formatStatus(integration.status)}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-500">
                            {integration.lastSyncedAt
                              ? `Last synced ${formatRelativeTime(integration.lastSyncedAt)}`
                              : 'Awaiting first sync'}
                          </p>
                          {integration.syncError ? (
                            <p className="mt-1 text-xs text-rose-500">{integration.syncError}</p>
                          ) : null}
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-slate-500">
                      Connect Google or Outlook to automate reminders and focus blocks.
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
                <h3 className="text-base font-semibold text-slate-900">Peer benchmarks</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Compare against peers with similar skill stacks to calibrate expectations.
                </p>
                <div className="mt-4 space-y-3 text-sm text-slate-600">
                  {careerBenchmarks.length ? (
                    careerBenchmarks.slice(0, 6).map((benchmark) => (
                      <div
                        key={benchmark.id ?? `${benchmark.metric}-${benchmark.cohortKey}`}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-slate-800">{formatStatus(benchmark.metric)}</span>
                          <span className="text-xs text-slate-500">{benchmark.cohortKey}</span>
                        </div>
                        <p className="mt-2 text-sm font-semibold text-slate-900">
                          {benchmark.value != null ? formatPercent(benchmark.value) : '—'}
                          {benchmark.percentile != null ? (
                            <span className="ml-2 text-xs font-medium text-slate-500">
                              {Math.round(benchmark.percentile)}th percentile
                            </span>
                          ) : null}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">
                      Benchmarks will populate once enough peers match your skill stack.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Advisor collaboration</h3>
                  <p className="text-sm text-slate-500">
                    Invite mentors, agencies, or coaches with scoped permissions to co-manage parts of your search.
                  </p>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <p>{advisorSummary.totalCollaborations ?? 0} workrooms</p>
                  <p>{advisorSummary.totalMembers ?? 0} collaborators</p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {advisorCollaborations.length ? (
                  advisorCollaborations.slice(0, 3).map((collaboration) => (
                    <div key={collaboration.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-slate-800">{collaboration.name}</span>
                        <span className="text-xs text-slate-500">{formatStatus(collaboration.status)}</span>
                      </div>
                      {collaboration.description ? (
                        <p className="mt-1 text-sm text-slate-600">{collaboration.description}</p>
                      ) : null}
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                        {collaboration.members.slice(0, 4).map((member) => (
                          <span
                            key={`${collaboration.id}-${member.email ?? member.user?.id ?? member.id}`}
                            className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-slate-600"
                          >
                            <span className="font-medium text-slate-800">
                              {member.user?.firstName
                                ? `${member.user.firstName} ${member.user.lastName ?? ''}`.trim()
                                : member.email ?? 'Pending invite'}
                            </span>
                            <span className="uppercase tracking-wide">{member.role}</span>
                          </span>
                        ))}
                      </div>
                      {collaboration.auditTrail?.length ? (
                        <div className="mt-3 space-y-1 text-xs text-slate-500">
                          {collaboration.auditTrail.slice(0, 2).map((audit) => (
                            <p key={audit.id}>
                              {formatRelativeTime(audit.createdAt)} – {audit.action}
                              {audit.actor?.firstName ? ` by ${audit.actor.firstName}` : ''}
                            </p>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">
                    Invite an advisor to unlock shared pipelines, audit logs, and secure document rooms.
                  </p>
                )}
              </div>

              {advisorSummary.activeDocumentRooms ? (
                <p className="mt-4 text-xs text-slate-500">
                  {advisorSummary.activeDocumentRooms} secure document rooms active with expiration controls.
                </p>
              ) : null}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Support desk</h3>
                  <p className="text-sm text-slate-500">
                    Access Gigvora support, automation logs, and troubleshooting guides right from the dashboard.
                  </p>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <p>SLA breaches {supportSummary.slaBreached ?? 0}</p>
                  <p>Avg response {supportSummary.averageFirstResponseMinutes ?? '—'} mins</p>
                </div>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-slate-800">Open cases</h4>
                  {supportCases.length ? (
                    supportCases.slice(0, 3).map((supportCase) => (
                      <div key={supportCase.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-semibold text-slate-800">Case #{supportCase.id}</span>
                          <span className="text-xs text-slate-500">{formatStatus(supportCase.priority)}</span>
                        </div>
                        <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
                          {formatStatus(supportCase.status)} • {supportCase.ageHours ?? 0}h open
                        </p>
                        {supportCase.assignedAgent ? (
                          <p className="mt-1 text-xs text-slate-500">
                            Assigned to {supportCase.assignedAgent.firstName}{' '}
                            {supportCase.assignedAgent.lastName}
                          </p>
                        ) : null}
                        {supportCase.slaBreached ? (
                          <p className="mt-2 text-xs font-medium text-rose-600">SLA attention required</p>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">
                      No support conversations open — automation logs will appear here when triggered.
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-slate-800">Automation &amp; knowledge base</h4>
                  <div className="space-y-2">
                    {supportAutomation.slice(0, 3).map((log) => (
                      <div key={log.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-800">{formatStatus(log.source)}</span>
                          <span className="uppercase tracking-wide text-slate-500">{formatStatus(log.status)}</span>
                        </div>
                        <p className="mt-1">{log.action}</p>
                        <p className="mt-1 text-[11px] text-slate-500">{formatRelativeTime(log.triggeredAt)}</p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    {supportArticles.slice(0, 3).map((article) => (
                      <div key={article.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                        <p className="font-semibold text-slate-800">{article.title}</p>
                        <p className="mt-1 text-slate-500">{article.summary}</p>
                        <p className="mt-1 text-[11px] text-slate-500">Audience: {formatStatus(article.audience)}</p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white/80 p-3 text-xs text-slate-500">
                    <p>
                      Need help? Escalate to live chat or explore the knowledge base to keep SLAs on track.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="affiliate-program" className="rounded-3xl border border-slate-200 bg-white p-0 shadow-sm">
          <AffiliateProgramSection data={affiliateProgram} />
        </section>

        <section
          id="notifications-center"
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <DashboardNotificationCenterSection
            userId={userId ?? DEFAULT_USER_ID}
            initialNotifications={notifications}
            initialUnreadCount={notificationsUnreadCount}
            initialPreferences={notificationPreferences}
            initialStats={notificationStats}
            session={session}
          />
        </section>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardAccessGuard requiredRoles={allowedDashboardRoles}>
      {dashboardView}
    </DashboardAccessGuard>
  );
}
