import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowPathIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  ClockIcon,
  EnvelopeOpenIcon,
  HandThumbUpIcon,
  ClipboardDocumentCheckIcon,
  DocumentTextIcon,
  GlobeAmericasIcon,
  ShareIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserGroupIcon,
  SparklesIcon,
  MagnifyingGlassCircleIcon,
  MapIcon,
  ShieldCheckIcon,
  ChartPieIcon,
  BeakerIcon,
  BoltIcon,
  MegaphoneIcon,
} from '@heroicons/react/24/outline';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import DataStatus from '../../components/DataStatus.jsx';
import { useHeadhunterDashboard } from '../../hooks/useHeadhunterDashboard.js';
import { formatRelativeTime, formatAbsolute } from '../../utils/date.js';
import PartnershipsInsightsSection from './headhunter/sections/PartnershipsInsightsSection.jsx';

const menuSections = [
  {
    label: 'Prospecting',
    items: [
      {
        name: 'Prospect discovery',
        description: 'Advanced search across Gigvora talent, projects, referrals, and external signals.',
        sectionId: 'prospect-discovery',
        tags: ['AI sourcing'],
      },
      {
        name: 'Market maps',
        description: 'Track target companies, competitor org charts, and hiring movements.',
        sectionId: 'prospect-market-maps',
      },
      {
        name: 'Outreach playbooks',
        description: 'Sequenced campaigns, messaging templates, and analytics for conversions.',
        sectionId: 'campaign-studio',
      },
    ],
  },
  {
    label: 'Pipeline execution',
    items: [
      {
        name: 'Prospect pipeline',
        description: 'Stage-based pipeline from discovery to offer with scoring, notes, and attachments.',
        sectionId: 'prospect-pipeline',
        sectionId: 'pipeline-health',
      },
      {
        name: 'Interview coordination',
        description: 'Plan intro calls, client interviews, prep sessions, and debriefs in one hub.',
        sectionId: 'interview-coordination',
      },
      {
        name: 'Pass-on center',
        description: 'Share candidates with partner companies or agencies with insights and fit notes.',
        sectionId: 'pass-on-center',
        sectionId: 'pass-on-network',
      },
    ],
  },
  {
    label: 'Partnerships & insights',
    items: [
      {
        name: 'Client management',
        description: 'Manage retainers, success fees, contracts, and hiring mandates.',
        sectionId: 'client-partnerships',
      },
      {
        name: 'Performance analytics',
        description: 'Placement rates, time-to-submit, interview-to-offer ratios, and revenue.',
        sectionId: 'outreach-performance',
      },
      {
        name: 'Calendar & availability',
        description: 'Personal calendar, shared calendars with clients, and availability broadcasting.',
        sectionId: 'interview-coordination',
      },
      {
        name: 'Client partnership excellence',
        description: 'Deliver transparency to clients with shared dashboards, milestone updates, and ROI storytelling.',
      },
      {
        name: 'Client portals',
        description: 'Invite clients to review shortlists, feedback, and offer strategy with customizable branding and audit logs.',
      },
      {
        name: 'Mandate performance dashboards',
        description: 'Measure submissions, interviews, offers, placements, diversity, and quality metrics.',
      },
      {
        name: 'Commercial operations',
        description: 'Manage retainers, milestones, invoices, and commissions with finance-ready documentation.',
      },
      {
        name: 'Issue resolution desk',
        description: 'Address candidate withdrawals, renegotiations, or conflicts with structured playbooks and escalations.',
      },
    ],
  },
];

const availableDashboards = ['headhunter', 'company', 'agency'];

const LOOKBACK_OPTIONS = [30, 60, 90, 120];
const SUMMARY_ICONS = [BriefcaseIcon, UserGroupIcon, ClockIcon, ChartBarIcon];

const DEFAULT_PROFILE = {
  name: 'Skyline Search',
  role: 'Executive Headhunter Collective',
  initials: 'SS',
  status: 'Active mandates in 3 sectors',
  badges: ['Platinum headhunter', 'Preferred partner'],
  metrics: [
    { label: 'Active mandates', value: '12' },
    { label: 'Candidates interviewing', value: '37' },
    { label: 'Placements YTD', value: '18' },
    { label: 'Win rate', value: '72%' },
  ],
};

function formatPercent(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }
  return `${Number(value).toFixed(1)}%`;
}

function formatCurrency(value, currency = 'USD') {
  if (value == null) return '—';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(Number(value));
  } catch (error) {
    return `${value}`;
  }
}

function formatDate(value) {
  if (!value) return '—';
  return formatAbsolute(value, { dateStyle: 'medium', timeStyle: 'short' });
}

function formatStageValue(stage, currency) {
  if (!stage) return '—';
  return formatCurrency(stage.valueTotal ?? 0, currency);
}

function formatCompRange(comp, fallbackCurrency = 'USD') {
  if (!comp) return '—';
  const currency = comp.currency ?? fallbackCurrency;
  if (comp.min != null && comp.max != null) {
    return `${formatCurrency(comp.min, currency)} – ${formatCurrency(comp.max, currency)}`;
  }
  if (comp.min != null) {
    return `≥ ${formatCurrency(comp.min, currency)}`;
  }
  if (comp.max != null) {
    return `≤ ${formatCurrency(comp.max, currency)}`;
  }
  return '—';
}

export default function HeadhunterDashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const workspaceIdParam = searchParams.get('workspaceId');
  const lookbackParam = searchParams.get('lookbackDays');
  const lookbackDays = lookbackParam ? Math.max(Number.parseInt(lookbackParam, 10) || 30, 7) : 30;

  const {
    data,
    error,
    loading,
    refresh,
    fromCache,
    lastUpdated,
    summaryCards,
  } = useHeadhunterDashboard({ workspaceId: workspaceIdParam, lookbackDays });

  const selectedWorkspaceId = data?.meta?.selectedWorkspaceId ?? workspaceIdParam ?? null;

  useEffect(() => {
    if (!workspaceIdParam && data?.meta?.selectedWorkspaceId) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('workspaceId', `${data.meta.selectedWorkspaceId}`);
        return next;
      }, { replace: true });
    }
  }, [workspaceIdParam, data?.meta?.selectedWorkspaceId, setSearchParams]);

  const workspaceOptions = data?.meta?.availableWorkspaces ?? [];
  const currency = data?.workspaceSummary?.defaultCurrency ?? 'USD';

  const activeProfile = useMemo(() => {
    if (!data?.workspaceSummary) {
      return DEFAULT_PROFILE;
    }
    const workspace = data.workspaceSummary;
    const initials = workspace.name
      ? workspace.name
          .split(' ')
          .map((part) => part.charAt(0))
          .join('')
          .slice(0, 3)
          .toUpperCase()
      : 'HH';

    const derivedMetrics = summaryCards.map((card) => ({ label: card.label, value: `${card.value}` }));

    return {
      name: workspace.name ?? DEFAULT_PROFILE.name,
      role: workspace.type ? `${workspace.type.charAt(0).toUpperCase()}${workspace.type.slice(1)} workspace` : DEFAULT_PROFILE.role,
      initials,
      status: workspace.health?.badges?.[0] ?? DEFAULT_PROFILE.status,
      badges: workspace.health?.badges?.length ? workspace.health.badges : DEFAULT_PROFILE.badges,
      metrics: derivedMetrics,
    };
  }, [data?.workspaceSummary, summaryCards]);

  const handleWorkspaceChange = (event) => {
    const nextWorkspaceId = event.target.value;
    const next = new URLSearchParams(searchParams);
    if (nextWorkspaceId) {
      next.set('workspaceId', nextWorkspaceId);
    } else {
      next.delete('workspaceId');
    }
    setSearchParams(next);
  };

  const handleLookbackChange = (event) => {
    const nextLookback = event.target.value;
    const next = new URLSearchParams(searchParams);
    if (nextLookback) {
      next.set('lookbackDays', nextLookback);
    } else {
      next.delete('lookbackDays');
    }
    setSearchParams(next);
  };

  const pipelineSummary = data?.pipelineSummary ?? {};
  const stageBreakdown = pipelineSummary.stageBreakdown ?? [];
  const agingBuckets = pipelineSummary.agingBuckets ?? {};
  const candidateSpotlight = data?.candidateSpotlight ?? [];
  const mandatePortfolio = data?.mandatePortfolio ?? { totals: {}, mandates: [] };
  const outreachPerformance = data?.outreachPerformance ?? {};
  const passOnNetwork = data?.passOnNetwork ?? { candidates: [] };
  const activityTimeline = data?.activityTimeline ?? [];
  const calendar = data?.calendar ?? { upcoming: [], workload: {} };
  const clientPartnerships = data?.clientPartnerships ?? {};
  const clientPartnerships = data?.clientPartnerships ?? { topContacts: [] };
  const pipelineExecution = data?.pipelineExecution ?? {};
  const prospectPipeline = pipelineExecution.prospectPipeline ?? {
    stageSummaries: [],
    metrics: {},
    automations: {},
    overview: {},
  };
  const pipelineBoard = pipelineExecution.board ?? { columns: [], automations: {} };
  const heatmap = pipelineExecution.heatmap ?? { stages: [], overallSentiment: null, overallRisk: 'low' };
  const interviewHub = pipelineExecution.interviewCoordination ?? {
    upcoming: [],
    summary: {},
    timezoneStats: [],
  };
  const experienceVault = pipelineExecution.candidateExperienceVault ?? {
    entries: [],
    readinessIndex: null,
    wellbeingAlerts: [],
    preferenceCoverage: 0,
    prepPackCount: 0,
    coachingNotesLogged: 0,
  };
  const passOnExchange = pipelineExecution.passOnExchange ?? { shares: [], summary: {} };
  const hasWorkspaceScopedData = data?.meta?.hasWorkspaceScopedData ?? false;
  const fallbackReason = data?.meta?.fallbackReason ?? null;

  const integerFormatter = useMemo(() => new Intl.NumberFormat('en-US'), []);
  const formatInteger = (value) => {
    if (value == null) return '—';
    return integerFormatter.format(value);
  };

  const formatSentimentScore = (value) => {
    if (value == null || Number.isNaN(Number(value))) {
      return '—';
    }
    const numeric = Number(value);
    if (numeric >= 0.5) {
      return `Positive (${numeric.toFixed(2)})`;
    }
    if (numeric >= 0) {
      return `Steady (${numeric.toFixed(2)})`;
    }
    if (numeric <= -0.5) {
      return `At risk (${numeric.toFixed(2)})`;
    }
    return `Caution (${numeric.toFixed(2)})`;
  };

  const formatRiskLabel = (value) => {
    if (!value) return '—';
    const label = `${value}`.replace(/_/g, ' ');
    return label.charAt(0).toUpperCase() + label.slice(1);
  };

  const pipelineAutomations = pipelineBoard.automations ?? prospectPipeline.automations ?? {};
  const boardColumns = pipelineBoard.columns ?? [];
  const heatmapStages = heatmap.stages ?? [];
  const experienceEntries = experienceVault.entries ?? [];
  const wellbeingAlerts = experienceVault.wellbeingAlerts ?? [];
  const interviewSummary = interviewHub.summary ?? {};
  const interviewUpcoming = interviewHub.upcoming ?? [];
  const timezoneStats = interviewHub.timezoneStats ?? [];
  const passOnShares = passOnExchange.shares ?? [];
  const passOnSummary = passOnExchange.summary ?? {};

  const pipelineMetricCards = [
    { label: 'Active prospects', value: formatInteger(prospectPipeline.metrics?.activeCandidates ?? 0) },
    {
      label: 'Avg fit score',
      value:
        prospectPipeline.metrics?.averageScore != null
          ? Number(prospectPipeline.metrics.averageScore).toFixed(1)
          : '—',
    },
    {
      label: 'Avg days in stage',
      value:
        prospectPipeline.metrics?.averageStageDays != null
          ? `${Number(prospectPipeline.metrics.averageStageDays).toFixed(1)}d`
          : '—',
    },
    {
      label: 'Prep packs sent',
      value: formatInteger(prospectPipeline.metrics?.prepPacksSent ?? 0),
    },
  ];

  const experienceHighlights = [
    {
      label: 'Readiness index',
      value:
        experienceVault.readinessIndex != null
          ? Number(experienceVault.readinessIndex).toFixed(1)
          : '—',
    },
    {
      label: 'Preferences logged',
      value: formatInteger(experienceVault.preferenceCoverage ?? 0),
    },
    {
      label: 'Prep packs delivered',
      value: formatInteger(experienceVault.prepPackCount ?? 0),
    },
    {
      label: 'Coaching notes',
      value: formatInteger(experienceVault.coachingNotesLogged ?? 0),
    },
  ];

  const interviewMetricCards = [
    { label: 'Scheduled', value: formatInteger(interviewSummary.totalScheduled ?? 0) },
    { label: 'Completed (7d)', value: formatInteger(interviewSummary.completedThisWeek ?? 0) },
    { label: 'Prep materials', value: formatInteger(interviewSummary.withPrepMaterials ?? 0) },
    { label: 'Scorecards linked', value: formatInteger(interviewSummary.scorecardsLinked ?? 0) },
  ];

  const passOnMetricCards = [
    { label: 'Shares logged', value: formatInteger(passOnSummary.totalShares ?? 0) },
    { label: 'Consent pending', value: formatInteger(passOnSummary.pendingConsent ?? 0) },
    { label: 'Accepted matches', value: formatInteger(passOnSummary.accepted ?? 0) },
    { label: 'Projected revenue', value: formatCurrency(passOnSummary.projectedRevenue ?? 0, currency) },
  ];

  const interviewTypeLabels = {
    intro: 'Intro call',
    client_interview: 'Client interview',
    prep: 'Prep session',
    debrief: 'Debrief',
  };

  const interviewStatusClass = (status) => {
    const normalised = `${status ?? ''}`.toLowerCase();
    if (normalised === 'completed') return 'bg-emerald-100 text-emerald-700';
    if (normalised === 'scheduled') return 'bg-blue-100 text-blue-700';
    if (normalised === 'cancelled') return 'bg-rose-100 text-rose-600';
    return 'bg-slate-100 text-slate-600';
  };

  const normalizedInterviews = interviewUpcoming.map((interview) => {
    const prepCount = Array.isArray(interview.prepMaterials)
      ? interview.prepMaterials.length
      : interview.prepMaterials
      ? 1
      : 0;
    const hasScorecard =
      interview.scorecard && typeof interview.scorecard === 'object'
        ? Object.keys(interview.scorecard).length > 0
        : Boolean(interview.scorecard);
    return {
      ...interview,
      prepCount,
      hasScorecard,
    };
  });

  const prospectIntelligence = data?.prospectIntelligence ?? {};
  const intelligenceOverview = prospectIntelligence.overview ?? {};
  const relocationBreakdown = intelligenceOverview.relocationReadiness ?? {};
  const signalBreakdown = intelligenceOverview.signalIntentBreakdown ?? {};
  const topMotivators = intelligenceOverview.topMotivators ?? [];
  const talentProfiles = prospectIntelligence.talentProfiles ?? [];
  const prospectCockpit = prospectIntelligence.cockpit ?? {};
  const prospectSavedSearches = prospectCockpit.savedSearches ?? [];
  const activeAlerts = prospectCockpit.activeAlerts ?? [];
  const industryMaps = prospectCockpit.industryMaps ?? [];
  const signalStream = prospectCockpit.signalStream ?? [];
  const campaignStudio = prospectIntelligence.campaignStudio ?? {};
  const campaignMetrics = campaignStudio.aggregateMetrics ?? {};
  const campaignBreakdown = campaignStudio.channelBreakdown ?? [];
  const campaignList = campaignStudio.campaigns ?? [];
  const campaignAbTests = campaignStudio.abTests ?? [];
  const researchCollaboration = prospectIntelligence.researchCollaboration ?? {};
  const researchNotes = researchCollaboration.notes ?? [];
  const researchTasks = researchCollaboration.tasks ?? [];
  const researchTaskSummary = researchCollaboration.taskSummary ?? {};
  const complianceGuardrails = researchCollaboration.compliance?.guardrails ?? {};
  const complianceLog = researchCollaboration.compliance?.log ?? [];

  const intelligenceStats = [
    {
      label: 'Profiles tracked',
      value: intelligenceOverview.profilesTracked ?? 0,
      icon: SparklesIcon,
    },
    {
      label: 'High-intent signals',
      value: intelligenceOverview.highIntentSignals ?? 0,
      icon: BoltIcon,
    },
    {
      label: 'Avg compensation target',
      value:
        intelligenceOverview.averageCompTarget != null
          ? formatCurrency(intelligenceOverview.averageCompTarget, currency)
          : '—',
      icon: ChartPieIcon,
    },
    {
      label: 'Exclusivity conflicts',
      value: intelligenceOverview.exclusivityConflicts ?? 0,
      icon: ShieldCheckIcon,
    },
  ];

  return (
    <DashboardLayout
      currentDashboard="headhunter"
      title="Headhunter Deal Desk"
      subtitle="Prospecting, pipeline, and partnerships"
      description="Purpose-built for executive search teams to discover prospects, manage pipelines, orchestrate interviews, and collaborate with clients using pass-on workflows."
      menuSections={menuSections}
      profile={activeProfile}
      availableDashboards={availableDashboards}
    >
      <div className="space-y-10">
        <section id="command-center-overview" className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Command center overview</h2>
              <p className="text-sm text-slate-600">
                Monitor mandate load, candidate momentum, and team performance in one view.
              </p>
            </div>
            <DataStatus loading={loading} fromCache={fromCache} lastUpdated={lastUpdated} onRefresh={refresh} />
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error.message ?? 'Failed to load headhunter metrics. Please try refreshing.'}
            </div>
          ) : null}

          {fallbackReason && !loading ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {fallbackReason}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-medium uppercase tracking-wide text-slate-500">
              Workspace
              <select
                value={selectedWorkspaceId ?? ''}
                onChange={handleWorkspaceChange}
                className="rounded-md border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
              >
                {workspaceOptions.map((workspace) => (
                  <option key={workspace.id} value={workspace.id}>
                    {workspace.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-medium uppercase tracking-wide text-slate-500">
              Lookback
              <select
                value={lookbackDays}
                onChange={handleLookbackChange}
                className="rounded-md border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
              >
                {LOOKBACK_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option} days
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {summaryCards.map((card, index) => {
              const Icon = SUMMARY_ICONS[index % SUMMARY_ICONS.length];
              return (
                <div
                  key={card.label}
                  className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">{card.label}</p>
                    <p className="text-lg font-semibold text-slate-900">{card.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section id="prospect-discovery" className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Prospect intelligence &amp; sourcing</h2>
              <p className="text-sm text-slate-600">
                Combine data, AI, and relationship signals to curate shortlists faster and surface actionable insights.
              </p>
            </div>
          </div>

          <div className="grid gap-3 text-xs text-slate-600 sm:grid-cols-2 lg:grid-cols-4">
            {intelligenceStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">{stat.label}</p>
                    <p className="text-base font-semibold text-slate-900">{stat.value}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-slate-600">
            {Object.entries(relocationBreakdown).length ? (
              Object.entries(relocationBreakdown).map(([status, count]) => (
                <span
                  key={status}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1"
                >
                  <MapIcon className="h-3.5 w-3.5 text-blue-500" />
                  <span className="capitalize">
                    {status.replace(/_/g, ' ')}: <strong className="text-slate-800">{count}</strong>
                  </span>
                </span>
              ))
            ) : (
              <span className="text-slate-500">No relocation readiness data captured yet.</span>
            )}
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-slate-600">
            {Object.entries(signalBreakdown).length ? (
              Object.entries(signalBreakdown).map(([intent, count]) => (
                <span
                  key={intent}
                  className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1"
                >
                  <BoltIcon className="h-3.5 w-3.5 text-blue-600" />
                  <span className="capitalize">
                    {intent.replace(/_/g, ' ')}: <strong className="text-slate-800">{count}</strong>
                  </span>
                </span>
              ))
            ) : (
              <span className="text-slate-500">No intent scoring available for this window.</span>
            )}
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <div id="talent-profiles" className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-800">360° talent profiles</h3>
                <SparklesIcon className="h-5 w-5 text-blue-500" />
              </div>
              <div className="space-y-3">
                {talentProfiles.length ? (
                  talentProfiles.map((profile) => {
                    const relocationLabel = profile.relocation ? profile.relocation.replace(/_/g, ' ') : 'unspecified';
                    const latestSignal = profile.signals?.[0];
                    return (
                      <div key={profile.id} className="rounded-2xl border border-white bg-white p-4 shadow-sm">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-base font-semibold text-slate-900">{profile.name}</p>
                            <p className="text-xs text-slate-500">{profile.headline ?? '—'}</p>
                          </div>
                          <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-medium text-blue-700">
                            {profile.seniority ?? 'Unassigned'}
                          </span>
                        </div>
                        <div className="mt-3 space-y-2 text-xs text-slate-600">
                          <div className="flex items-start gap-2">
                            <SparklesIcon className="mt-0.5 h-4 w-4 text-violet-500" />
                            <span>{profile.aiHighlights?.[0] ?? 'AI insights will populate as new signals arrive.'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CalendarDaysIcon className="h-4 w-4 text-blue-500" />
                            <span>
                              Last signal{' '}
                              {latestSignal?.occurredAt ? formatRelativeTime(latestSignal.occurredAt) : 'pending'}
                            </span>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-500">
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1">
                            <ClockIcon className="h-3.5 w-3.5 text-blue-500" />
                            {profile.availability ?? 'Unknown availability'}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 capitalize">
                            <MapIcon className="h-3.5 w-3.5 text-blue-500" />
                            {relocationLabel}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1">
                            <ChartBarIcon className="h-3.5 w-3.5 text-blue-500" />
                            {formatCompRange(profile.compensation, currency)}
                          </span>
                          {profile.exclusivityConflict ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-3 py-1 text-rose-700">
                              <ShieldCheckIcon className="h-3.5 w-3.5" />
                              Exclusivity flag
                            </span>
                          ) : null}
                        </div>
                        {profile.exclusivityConflict && profile.exclusivityNotes ? (
                          <p className="mt-2 text-[11px] text-rose-600">{profile.exclusivityNotes}</p>
                        ) : null}
                        <div className="mt-3">
                          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Motivators</p>
                          <div className="mt-1 flex flex-wrap gap-1 text-[11px] text-slate-600">
                            {profile.motivators?.length ? (
                              profile.motivators.map((motivator) => (
                                <span key={`${profile.id}-motivator-${motivator}`} className="rounded-full bg-slate-100 px-2 py-1">
                                  {motivator}
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-400">No motivator insights yet.</span>
                            )}
                          </div>
                        </div>
                        <div className="mt-3">
                          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Recent signals</p>
                          <div className="mt-1 space-y-1">
                            {profile.signals?.length ? (
                              profile.signals.map((signal) => (
                                <div
                                  key={signal.id}
                                  className="flex items-center justify-between rounded-xl bg-slate-100 px-3 py-2"
                                >
                                  <div className="text-[11px] text-slate-600">
                                    <span className="font-medium capitalize text-slate-700">{signal.intentLevel ?? 'n/a'}</span>
                                    {' • '}
                                    {signal.signalType}
                                  </div>
                                  <span className="text-[11px] text-slate-500">
                                    {signal.occurredAt ? formatRelativeTime(signal.occurredAt) : '—'}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <div className="rounded-xl border border-dashed border-slate-200 px-3 py-2 text-center text-[11px] text-slate-400">
                                Waiting on new activity.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
                    No enriched talent dossiers available yet.
                  </div>
                )}
              </div>
            </div>

            <div id="prospecting-cockpit" className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-800">Prospecting cockpit</h3>
                <MagnifyingGlassCircleIcon className="h-5 w-5 text-blue-500" />
              </div>
              <div className="space-y-3">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Saved searches</h4>
                  <div className="mt-2 space-y-2">
                    {prospectSavedSearches.length ? (
                      prospectSavedSearches.slice(0, 3).map((search) => (
                        <div key={search.id} className="rounded-2xl border border-white bg-white p-3 shadow-sm">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{search.name}</p>
                              <p className="text-xs text-slate-500">{search.description ?? '—'}</p>
                            </div>
                            {search.isAlertEnabled ? (
                              <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-medium text-emerald-700">
                                {search.alertCadence ? search.alertCadence.replace(/_/g, ' ') : 'alerts on'}
                              </span>
                            ) : null}
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1 text-[11px] text-slate-600">
                            {search.skills?.slice(0, 3).map((skill) => (
                              <span key={`${search.id}-skill-${skill}`} className="rounded-full bg-slate-100 px-2 py-1">
                                {skill}
                              </span>
                            ))}
                            {search.diversityFocus?.slice(0, 2).map((tag) => (
                              <span key={`${search.id}-diversity-${tag}`} className="rounded-full bg-blue-100 px-2 py-1 text-blue-700">
                                {tag}
                              </span>
                            ))}
                          </div>
                          <div className="mt-2 text-[11px] text-slate-500">
                            {search.resultsCount ?? 0} matching prospects • Last run{' '}
                            {search.lastRunAt ? formatRelativeTime(search.lastRunAt) : 'never'}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-center text-sm text-slate-500">
                        No saved prospect queries yet.
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Signal-based alerts</h4>
                  <div className="mt-2 space-y-2">
                    {activeAlerts.length ? (
                      activeAlerts.slice(0, 4).map((alert) => (
                        <div
                          key={alert.id}
                          className="flex items-center justify-between rounded-2xl border border-white bg-white px-3 py-2 shadow-sm text-xs text-slate-600"
                        >
                          <div>
                            <p className="font-semibold text-slate-800">{alert.searchName}</p>
                            <p className="text-[11px] text-slate-500 capitalize">
                              {alert.channel} • {alert.status}
                            </p>
                          </div>
                          <span className="text-[11px] text-slate-500">
                            {alert.lastTriggeredAt ? formatRelativeTime(alert.lastTriggeredAt) : 'pending'}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-3 text-center text-xs text-slate-500">
                        No live alerts in this window.
                      </div>
                    )}
                  </div>
                </div>

                <div id="prospect-market-maps">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Industry whitespace</h4>
                  <div className="mt-2 space-y-1 text-xs text-slate-600">
                    {industryMaps.length ? (
                      industryMaps.map((entry) => (
                        <div key={entry.industry} className="flex items-center justify-between rounded-xl bg-white px-3 py-2 shadow-sm">
                          <span className="inline-flex items-center gap-2 text-slate-700">
                            <MapIcon className="h-4 w-4 text-blue-500" />
                            {entry.industry}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {entry.totalResults} results • {entry.savedSearches} searches
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-xl border border-dashed border-slate-200 bg-white px-3 py-2 text-center text-xs text-slate-500">
                        No industry mapping insights captured.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div id="signal-feed" className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-800">Signal feed &amp; motivators</h3>
                <BoltIcon className="h-5 w-5 text-blue-500" />
              </div>
              <div className="space-y-2 text-xs text-slate-600">
                {signalStream.length ? (
                  signalStream.slice(0, 6).map((signal) => (
                    <div key={signal.id} className="rounded-2xl border border-white bg-white px-3 py-2 shadow-sm">
                      <p className="font-semibold text-slate-800">{signal.candidateName ?? 'Prospect'}</p>
                      <p className="text-[11px] text-slate-500">
                        {signal.signalType} • {signal.intentLevel ?? 'intent'}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-600">{signal.summary}</p>
                      <p className="mt-1 text-[11px] text-slate-500">
                        {signal.occurredAt ? formatRelativeTime(signal.occurredAt) : 'timestamp unavailable'} • {signal.source ?? 'unknown source'}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-center text-sm text-slate-500">
                    AI signals will populate as campaigns engage prospects.
                  </div>
                )}
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Motivator themes</h4>
                <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-600">
                  {topMotivators.length ? (
                    topMotivators.map((item) => (
                      <span key={item.label} className="rounded-full bg-white px-3 py-1 shadow-sm">
                        {item.label} • {item.count}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400">No motivator insights yet.</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div id="campaign-studio" className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Campaign studio</h3>
                <MegaphoneIcon className="h-6 w-6 text-blue-500" />
              </div>
              <div className="grid gap-3 text-xs text-slate-600 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 px-3 py-2">
                  <p className="font-semibold text-slate-500">Active campaigns</p>
                  <p className="mt-1 text-base font-semibold text-slate-900">
                    {campaignMetrics.activeCampaigns ?? 0} / {campaignMetrics.totalCampaigns ?? 0}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-3 py-2">
                  <p className="font-semibold text-slate-500">Avg response rate</p>
                  <p className="mt-1 text-base font-semibold text-slate-900">
                    {campaignMetrics.averageResponseRate != null
                      ? formatPercent(campaignMetrics.averageResponseRate)
                      : '—'}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-3 py-2">
                  <p className="font-semibold text-slate-500">Avg conversion</p>
                  <p className="mt-1 text-base font-semibold text-slate-900">
                    {campaignMetrics.averageConversionRate != null
                      ? formatPercent(campaignMetrics.averageConversionRate)
                      : '—'}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-3 py-2">
                  <p className="font-semibold text-slate-500">Channels in play</p>
                  <p className="mt-1 text-base font-semibold text-slate-900">{campaignBreakdown.length}</p>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-700">Channel mix</h4>
                <div className="mt-2 space-y-2 text-xs text-slate-600">
                  {campaignBreakdown.length ? (
                    campaignBreakdown.map((entry) => (
                      <div key={entry.channel} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                        <span className="capitalize text-slate-700">{entry.channel}</span>
                        <span className="text-[11px] text-slate-500">
                          {entry.campaigns} campaigns • {entry.steps} steps
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-200 px-3 py-2 text-center text-xs text-slate-500">
                      No campaign channel data yet.
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-700">Sequences</h4>
                <div className="mt-2 space-y-2 text-xs text-slate-600">
                  {campaignList.length ? (
                    campaignList.slice(0, 4).map((campaign) => (
                      <div key={campaign.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                        <p className="text-sm font-semibold text-slate-900">{campaign.name}</p>
                        <p className="text-[11px] text-slate-500">
                          {campaign.persona ?? 'General persona'} • {campaign.status}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Launched {campaign.launchDate ? formatRelativeTime(campaign.launchDate) : '—'} •{' '}
                          {campaign.steps?.length ?? 0} steps
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 px-3 py-2 text-center text-xs text-slate-500">
                      No outreach sequences drafted yet.
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-700">A/B experiments</h4>
                <div className="mt-2 space-y-1 text-xs text-slate-600">
                  {campaignAbTests.length ? (
                    campaignAbTests.slice(0, 4).map((experiment, index) => (
                      <div key={`${experiment.campaignId}-${experiment.variant}-${index}`} className="rounded-xl bg-slate-50 px-3 py-2">
                        <p className="font-semibold text-slate-800">
                          {experiment.campaignName} • Step {experiment.stepOrder}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Variant {experiment.variant.replace('_', ' ')}{' '}
                          {experiment.aiVariant ? `(${experiment.aiVariant})` : ''}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-200 px-3 py-2 text-center text-xs text-slate-500">
                      No live experiments configured.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div id="research-collaboration" className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Research collaboration</h3>
                <BeakerIcon className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-700">Shared notes</h4>
                <div className="mt-2 space-y-2 text-xs text-slate-600">
                  {researchNotes.length ? (
                    researchNotes.slice(0, 4).map((note) => (
                      <div key={note.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                        <p className="text-sm font-semibold text-slate-900">{note.title}</p>
                        <p className="text-[11px] text-slate-500">{note.candidate?.name ?? 'General'}</p>
                        <p className="mt-1 line-clamp-2 text-[11px] text-slate-600">{note.body}</p>
                        <p className="mt-1 text-[11px] text-slate-500">
                          {note.author?.name ?? 'Unknown'} • {note.createdAt ? formatRelativeTime(note.createdAt) : '—'} •{' '}
                          {note.visibility.replace(/_/g, ' ')}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 px-3 py-2 text-center text-xs text-slate-500">
                      No researcher notes logged in this period.
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-700">Tasks &amp; guardrails</h4>
                <div className="mt-2 space-y-2 text-xs text-slate-600">
                  {researchTasks.length ? (
                    researchTasks.slice(0, 4).map((task) => (
                      <div key={task.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                        <p className="text-sm font-semibold text-slate-900">{task.title}</p>
                        <p className="text-[11px] text-slate-500 capitalize">
                          {task.status} • Priority {task.priority}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {task.dueAt ? `Due ${formatRelativeTime(task.dueAt)}` : 'No due date'} • {task.assignee?.name ?? 'Unassigned'}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 px-3 py-2 text-center text-xs text-slate-500">
                      No research tasks scheduled.
                    </div>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-600">
                  {Object.entries(researchTaskSummary).length ? (
                    Object.entries(researchTaskSummary).map(([status, count]) => (
                      <span key={status} className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 capitalize">
                        <CalendarDaysIcon className="h-3.5 w-3.5 text-blue-500" />
                        {status.replace(/_/g, ' ')}: <strong className="text-slate-800">{count}</strong>
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400">Task load is clear.</span>
                  )}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-700">Compliance log</h4>
                <div className="mt-2 grid gap-2 text-xs text-slate-600 sm:grid-cols-3">
                  <div className="rounded-2xl bg-slate-50 px-3 py-2 text-center">
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">Restricted notes</p>
                    <p className="mt-1 text-base font-semibold text-slate-900">{complianceGuardrails.restrictedNotes ?? 0}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-3 py-2 text-center">
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">Compliance events</p>
                    <p className="mt-1 text-base font-semibold text-slate-900">{complianceGuardrails.complianceEvents ?? 0}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-3 py-2 text-center">
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">Retention reviews</p>
                    <p className="mt-1 text-base font-semibold text-slate-900">{complianceGuardrails.retentionReviews ?? 0}</p>
                  </div>
                </div>
                <div className="mt-3 space-y-1 text-[11px] text-slate-600">
                  {complianceLog.length ? (
                    complianceLog.slice(0, 4).map((entry, index) => (
                      <div key={`${entry.id}-${index}`} className="rounded-xl border border-slate-200 px-3 py-2">
                        <p className="font-semibold text-slate-800">{entry.title}</p>
                        <p className="text-slate-500">
                          {entry.candidateName ?? 'General'} • {entry.visibility.replace(/_/g, ' ')}
                        </p>
                        <p className="text-slate-500">{entry.createdAt ? formatRelativeTime(entry.createdAt) : '—'}</p>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-200 px-3 py-2 text-center text-xs text-slate-500">
                      No compliance events logged.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="pipeline-health" className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Pipeline health</h2>
              <p className="text-sm text-slate-600">
                Stage progression, conversion velocity, and bottlenecks across the active search portfolio.
              </p>
            </div>
            <div className="grid gap-3 text-xs text-slate-600 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="font-semibold text-slate-500">Screening conversion</p>
                <p className="mt-1 text-base font-semibold text-slate-900">
                  {formatPercent(pipelineSummary.conversionRates?.screening)}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="font-semibold text-slate-500">Interview conversion</p>
                <p className="mt-1 text-base font-semibold text-slate-900">
                  {formatPercent(pipelineSummary.conversionRates?.interviewing)}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="font-semibold text-slate-500">Offer acceptance</p>
                <p className="mt-1 text-base font-semibold text-slate-900">
                  {formatPercent(pipelineSummary.conversionRates?.offers)}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="font-semibold text-slate-500">Placements from offers</p>
                <p className="mt-1 text-base font-semibold text-slate-900">
                  {formatPercent(pipelineSummary.conversionRates?.placements)}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stageBreakdown.map((stage) => (
              <div key={stage.key} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-700">{stage.label}</p>
                  <span className="text-xs text-slate-500">{stage.count} candidates</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-blue-500"
                    style={{ width: `${Math.min(stage.percentage ?? 0, 100)}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  {formatStageValue(stage, currency)} • {formatPercent(stage.percentage)} of pipeline
                </p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-slate-600">
            {Object.entries(agingBuckets).map(([bucket, count]) => (
              <span
                key={bucket}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 py-1"
              >
                <ClockIcon className="h-3.5 w-3.5 text-blue-500" />
                <span>
                  {bucket} days: <strong className="text-slate-800">{count}</strong>
                </span>
              </span>
            ))}
          </div>
        </section>

        <section
          id="prospect-pipeline"
          className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Prospect pipeline</h2>
              <p className="text-sm text-slate-600">
                Drag-and-drop progression with automated next steps and boutique candidate care.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-500">
              <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-blue-700">
                <SparklesIcon className="h-4 w-4" />
                {formatInteger(pipelineAutomations.remindersScheduled ?? 0)} smart reminders
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700">
                <ClipboardDocumentCheckIcon className="h-4 w-4" />
                {formatInteger(pipelineAutomations.interviewsQueued ?? 0)} interviews queued
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-indigo-700">
                <ShareIcon className="h-4 w-4" />
                {formatInteger(pipelineAutomations.passOnReady ?? 0)} pass-on ready
              </span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {pipelineMetricCards.map((metric) => (
              <div key={metric.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">{metric.label}</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{metric.value}</p>
              </div>
            ))}
          </div>

          <div className="overflow-x-auto">
            <div className="flex min-w-full gap-4 pb-2">
              {boardColumns.length ? (
                boardColumns.map((column) => (
                  <div
                    key={column.id}
                    className="flex w-80 flex-col rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{column.name}</p>
                        <p className="text-xs text-slate-500">
                          {formatInteger(column.stats?.totalCandidates ?? 0)} candidates •{' '}
                          {column.stats?.winProbability != null
                            ? `${Number(column.stats.winProbability).toFixed(0)}% win`
                            : '—'}
                        </p>
                      </div>
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                        {column.stats?.averageScore != null
                          ? Number(column.stats.averageScore).toFixed(1)
                          : '—'}
                      </span>
                    </div>
                    <div className="mt-3 space-y-3">
                      {column.items.length ? (
                        column.items.map((item) => (
                          <div
                            key={item.id}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-600"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-semibold text-slate-900">{item.candidateName}</p>
                                <p className="text-xs text-slate-500">
                                  {item.targetRole ?? 'Role TBD'} • {item.targetCompany ?? 'Confidential'}
                                </p>
                              </div>
                              <span className="text-xs font-semibold text-blue-600">
                                {item.score != null ? Number(item.score).toFixed(0) : '—'}
                              </span>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-slate-500">
                              <span>
                                Last touch {item.lastTouchedAt ? formatRelativeTime(item.lastTouchedAt) : '—'}
                              </span>
                              <span>Stage age {item.stageAgeDays != null ? `${item.stageAgeDays}d` : '—'}</span>
                              <span>Next: {item.nextStep ?? '—'}</span>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2 text-[10px] uppercase tracking-wide">
                              <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-slate-600">
                                Risk {formatRiskLabel(item.risk)}
                              </span>
                              <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-slate-600">
                                Sentiment {item.sentiment ?? '—'}
                              </span>
                              {item.readiness != null ? (
                                <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-slate-600">
                                  Ready{' '}
                                  {typeof item.readiness === 'number'
                                    ? Number(item.readiness).toFixed(1)
                                    : item.readiness}
                                </span>
                              ) : null}
                              {item.blockers?.length ? (
                                <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-rose-600">
                                  {item.blockers.length} blockers
                                </span>
                              ) : null}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-3 py-6 text-center text-xs text-slate-500">
                          No candidates in this stage yet.
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="w-full rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">
                  No prospect board data has been configured for this workspace.
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Pipeline heatmap</h3>
                <p className="text-xs text-slate-500">
                  Overall sentiment {heatmap.overallSentiment != null ? formatSentimentScore(heatmap.overallSentiment) : '—'} • Risk {formatRiskLabel(heatmap.overallRisk)}
                </p>
              </div>
              <ShieldCheckIcon className="h-5 w-5 text-blue-500" />
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-white text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2 text-left">Stage</th>
                    <th className="px-3 py-2 text-left">Candidates</th>
                    <th className="px-3 py-2 text-left">Avg score</th>
                    <th className="px-3 py-2 text-left">Sentiment</th>
                    <th className="px-3 py-2 text-left">Risk</th>
                    <th className="px-3 py-2 text-left">Blockers</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {heatmapStages.length ? (
                    heatmapStages.map((stage) => (
                      <tr key={stage.stageId}>
                        <td className="px-3 py-2">
                          <div className="font-semibold text-slate-900">{stage.stageName}</div>
                          <div className="text-xs text-slate-500">{stage.stageType}</div>
                        </td>
                        <td className="px-3 py-2 text-slate-600">{formatInteger(stage.candidateCount ?? 0)}</td>
                        <td className="px-3 py-2 text-slate-600">
                          {stage.averageScore != null ? Number(stage.averageScore).toFixed(1) : '—'}
                        </td>
                        <td className="px-3 py-2 text-slate-600">{formatSentimentScore(stage.averageSentiment)}</td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              stage.dominantRisk === 'high'
                                ? 'bg-rose-100 text-rose-600'
                                : stage.dominantRisk === 'medium'
                                ? 'bg-amber-100 text-amber-600'
                                : 'bg-emerald-100 text-emerald-600'
                            }`}
                          >
                            {formatRiskLabel(stage.dominantRisk)}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-slate-600">{formatInteger(stage.blockerCount ?? 0)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-3 py-6 text-center text-sm text-slate-500">
                        No stage analytics available yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">
                  Pipeline mastery &amp; candidate care
                </h3>
                <p className="text-xs text-slate-500">
                  Personalised preferences, relocation signals, and wellbeing tracking for every prospect.
                </p>
              </div>
              <DocumentTextIcon className="h-5 w-5 text-blue-500" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {experienceHighlights.map((highlight) => (
                <div key={highlight.label} className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm">
                  <p className="text-xs uppercase tracking-wide text-slate-500">{highlight.label}</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{highlight.value}</p>
                </div>
              ))}
            </div>
            {wellbeingAlerts.length ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {wellbeingAlerts.slice(0, 3).map((alert, index) => (
                  <div
                    key={`${alert.candidateName}-${index}`}
                    className="flex items-center justify-between gap-4 border-b border-amber-200/60 py-1 last:border-b-0"
                  >
                    <div>
                      <p className="font-semibold">{alert.candidateName}</p>
                      <p className="text-xs text-amber-700">
                        {alert.stageName ?? 'Unknown stage'} • wellbeing {alert.wellbeing}
                      </p>
                    </div>
                    <p className="text-xs text-amber-600">
                      {alert.lastTouchedAt ? formatRelativeTime(alert.lastTouchedAt) : '—'}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
            <div className="space-y-2">
              {experienceEntries.length ? (
                experienceEntries.slice(0, 5).map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-900">{entry.candidateName}</p>
                        <p className="text-xs text-slate-500">{entry.stageName ?? 'Stage TBD'}</p>
                      </div>
                      <span className="text-xs text-slate-500">
                        Last touch {entry.lastTouchedAt ? formatRelativeTime(entry.lastTouchedAt) : '—'}
                      </span>
                    </div>
                    <div className="mt-2 grid gap-2 text-xs text-slate-600 sm:grid-cols-3">
                      <span>Comp: {entry.compensation ?? '—'}</span>
                      <span>Relocation: {entry.relocation ?? '—'}</span>
                      <span>Next step: {entry.nextStep ?? '—'}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-[10px] uppercase tracking-wide text-slate-500">
                      {Object.entries(entry.preferences ?? {}).map(([key, value]) => (
                        <span
                          key={key}
                          className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5"
                        >
                          {key}: {value}
                        </span>
                      ))}
                      {entry.prepPacks?.length ? (
                        <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-blue-700">
                          Prep packs: {entry.prepPacks.length}
                        </span>
                      ) : null}
                      {entry.coachingNotes?.length ? (
                        <span className="rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-violet-700">
                          Coaching notes: {entry.coachingNotes.length}
                        </span>
                      ) : null}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500">
                  No candidate experience records captured yet.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div id="candidate-spotlight" className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Candidate spotlight</h3>
              <UserGroupIcon className="h-5 w-5 text-blue-500" />
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2 text-left">Candidate</th>
                    <th className="px-3 py-2 text-left">Stage</th>
                    <th className="px-3 py-2 text-left">Interviews</th>
                    <th className="px-3 py-2 text-left">Last interaction</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {candidateSpotlight.length ? (
                    candidateSpotlight.map((candidate) => (
                      <tr key={candidate.userId} className="hover:bg-slate-50">
                        <td className="px-3 py-2">
                          <div className="font-semibold text-slate-900">{candidate.name}</div>
                          <div className="text-xs text-slate-500">{candidate.headline ?? '—'}</div>
                        </td>
                        <td className="px-3 py-2 text-slate-600">
                          {candidate.activeApplication?.stage ?? '—'}
                        </td>
                        <td className="px-3 py-2 text-slate-600">{candidate.interviews ?? 0}</td>
                        <td className="px-3 py-2 text-slate-600">
                          {candidate.lastInteractionAt ? formatRelativeTime(candidate.lastInteractionAt) : '—'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-3 py-6 text-center text-sm text-slate-500">
                        No candidates are currently spotlighted for this workspace.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div id="pass-on-network" className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Pass-on network</h3>
              <HandThumbUpIcon className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-sm text-slate-600">
              Managed referrals ready to be matched with partner mandates.
            </p>
            <div className="space-y-3">
              {passOnNetwork.candidates?.length ? (
                passOnNetwork.candidates.map((entry) => (
                  <div
                    key={`${entry.applicantId}-${entry.sharedAt}`}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{entry.name}</p>
                        <p className="text-xs text-slate-500">{entry.primarySkill ?? 'Generalist'}</p>
                      </div>
                      <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                        {entry.lastStage}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                      <span className="inline-flex items-center gap-1">
                        <BuildingOfficeIcon className="h-4 w-4 text-blue-500" />
                        {entry.referredTo ?? 'Open referral'}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <CalendarDaysIcon className="h-4 w-4 text-blue-500" />
                        {entry.sharedAt ? formatRelativeTime(entry.sharedAt) : 'Pending share'}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <EnvelopeOpenIcon className="h-4 w-4 text-blue-500" />
                        {entry.nextStep ?? 'Awaiting update'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                  No pass-on candidates logged in the selected window.
                </div>
              )}
            </div>
          </div>
        </section>

        <section id="mandate-portfolio" className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Mandate portfolio</h3>
            <BriefcaseIcon className="h-5 w-5 text-blue-500" />
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2 text-left">Mandate</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Pipeline value</th>
                  <th className="px-3 py-2 text-left">Open roles</th>
                  <th className="px-3 py-2 text-left">Last activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mandatePortfolio.mandates?.length ? (
                  mandatePortfolio.mandates.map((mandate) => (
                    <tr key={mandate.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2">
                        <div className="font-semibold text-slate-900">{mandate.title}</div>
                        <div className="text-xs text-slate-500">{mandate.location ?? 'Remote'}</div>
                      </td>
                      <td className="px-3 py-2 text-slate-600">{mandate.status ?? 'active'}</td>
                      <td className="px-3 py-2 text-slate-600">{formatCurrency(mandate.value, currency)}</td>
                      <td className="px-3 py-2 text-slate-600">{mandate.openRoles}</td>
                      <td className="px-3 py-2 text-slate-600">
                        {mandate.lastActivityAt ? formatRelativeTime(mandate.lastActivityAt) : '—'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-3 py-6 text-center text-sm text-slate-500">
                      No mandates are linked to this workspace during the selected lookback.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section
          id="interview-coordination"
          className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Interview coordination</h2>
              <p className="text-sm text-slate-600">
                Concierge scheduling with prep resources, timezone intelligence, and scorecard tracking.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-500">
              <GlobeAmericasIcon className="h-4 w-4 text-blue-500" />
              {formatInteger(timezoneStats.length)} timezones active
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {interviewMetricCards.map((metric) => (
              <div key={metric.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">{metric.label}</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{metric.value}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-slate-500">
            {timezoneStats.length ? (
              timezoneStats.slice(0, 8).map((entry) => (
                <span
                  key={entry.timezone}
                  className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-blue-700"
                >
                  <GlobeAmericasIcon className="h-3.5 w-3.5" />
                  {entry.timezone} • {formatInteger(entry.count)}
                </span>
              ))
            ) : (
              <span className="rounded-full border border-dashed border-slate-200 bg-slate-50 px-3 py-1">
                No timezone data captured yet.
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2 text-left">Candidate</th>
                  <th className="px-3 py-2 text-left">Stage</th>
                  <th className="px-3 py-2 text-left">Type</th>
                  <th className="px-3 py-2 text-left">When</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Prep &amp; scorecard</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {normalizedInterviews.length ? (
                  normalizedInterviews.slice(0, 10).map((interview) => (
                    <tr key={interview.id}>
                      <td className="px-3 py-2">
                        <div className="font-semibold text-slate-900">{interview.candidateName}</div>
                        <div className="text-xs text-slate-500">{interview.timezone ?? 'UTC'}</div>
                      </td>
                      <td className="px-3 py-2 text-slate-600">{interview.stageName ?? '—'}</td>
                      <td className="px-3 py-2 text-slate-600">
                        {interviewTypeLabels[interview.interviewType] ?? interview.interviewType ?? '—'}
                      </td>
                      <td className="px-3 py-2 text-slate-600">
                        {interview.scheduledAt ? formatDate(interview.scheduledAt) : '—'}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${interviewStatusClass(
                            interview.status,
                          )}`}
                        >
                          {formatRiskLabel(interview.status)}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-600">
                        <div className="flex flex-wrap gap-2">
                          {interview.prepCount ? (
                            <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                              Prep pack
                            </span>
                          ) : null}
                          {interview.hasScorecard ? (
                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
                              Scorecard ready
                            </span>
                          ) : (
                            <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-500">
                              Awaiting scorecard
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-3 py-6 text-center text-sm text-slate-500">
                      No interviews scheduled in this window.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section
          id="pass-on-center"
          className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Pass-on center</h2>
              <p className="text-sm text-slate-600">
                Route talent to partner searches with consent tracking and revenue share forecasting.
              </p>
            </div>
            <div className="text-xs text-slate-500">
              Avg share rate:{' '}
              {passOnSummary.averageRevenueShareRate != null
                ? `${Number(passOnSummary.averageRevenueShareRate).toFixed(1)}%`
                : '—'}{' '}
              • Consent granted {formatInteger(passOnSummary.consentGranted ?? 0)}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {passOnMetricCards.map((metric) => (
              <div key={metric.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">{metric.label}</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{metric.value}</p>
              </div>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2 text-left">Candidate</th>
                  <th className="px-3 py-2 text-left">Stage</th>
                  <th className="px-3 py-2 text-left">Destination</th>
                  <th className="px-3 py-2 text-left">Consent</th>
                  <th className="px-3 py-2 text-left">Revenue share</th>
                  <th className="px-3 py-2 text-left">Shared</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {passOnShares.length ? (
                  passOnShares.slice(0, 12).map((share) => (
                    <tr key={share.id}>
                      <td className="px-3 py-2">
                        <div className="font-semibold text-slate-900">{share.candidateName}</div>
                        <div className="text-xs text-slate-500">
                          Share {formatRiskLabel(share.shareStatus)}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-slate-600">{share.stageName ?? '—'}</td>
                      <td className="px-3 py-2 text-slate-600">
                        {share.targetWorkspace?.name ?? share.targetName}
                        <span className="block text-xs text-slate-500">
                          {share.targetWorkspace?.type ?? 'External'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-600">
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs">
                          {formatRiskLabel(share.consentStatus)}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-600">
                        <div className="flex flex-col gap-1">
                          {share.revenueShareRate != null ? (
                            <span>{Number(share.revenueShareRate).toFixed(1)}%</span>
                          ) : null}
                          {share.revenueShareFlat != null ? (
                            <span>{formatCurrency(share.revenueShareFlat, currency)}</span>
                          ) : null}
                          <span className="text-xs text-slate-500">
                            Forecast {formatCurrency(share.projectedValue ?? 0, currency)}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-slate-600">
                        {share.sharedAt ? formatRelativeTime(share.sharedAt) : '—'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-3 py-6 text-center text-sm text-slate-500">
                      No pass-on exchanges recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <section id="outreach-performance" className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Outreach performance</h3>
            <ArrowPathIcon className="h-5 w-5 text-blue-500" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Active campaigns</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{outreachPerformance.campaignCount ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Total touchpoints</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{outreachPerformance.totalMessages ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Avg response time</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {outreachPerformance.averageResponseHours != null
                  ? `${outreachPerformance.averageResponseHours.toFixed(1)}h`
                  : '—'}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Response rate</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {formatPercent((outreachPerformance.responseRate ?? 0) * 100)}
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-700">Channel breakdown</h4>
              <div className="space-y-2">
                {outreachPerformance.channelBreakdown?.length ? (
                  outreachPerformance.channelBreakdown.map((entry) => (
                    <div
                      key={entry.channel}
                      className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600"
                    >
                      <span className="capitalize">{entry.channel}</span>
                      <span>
                        {entry.responses ?? 0}/{entry.sent ?? 0} responses • {formatPercent((entry.conversion ?? 0) * 100)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                    No outreach sequences logged during this window.
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-700">Latest campaigns</h4>
              <div className="space-y-2">
                {outreachPerformance.latestCampaigns?.length ? (
                  outreachPerformance.latestCampaigns.map((campaign) => (
                    <div
                      key={campaign.threadId}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600"
                    >
                      <p className="font-semibold text-slate-800">{campaign.subject}</p>
                      <p className="text-xs text-slate-500">
                        {campaign.touchpoints} touchpoints • Last reply{' '}
                        {campaign.lastReplyAt ? formatRelativeTime(campaign.lastReplyAt) : 'pending'}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                    No active campaigns to display.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <PartnershipsInsightsSection partnerships={clientPartnerships} calendar={calendar} />
        <section className="grid gap-6 lg:grid-cols-2">
          <div id="client-partnerships" className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Client partnerships</h3>
              <BuildingOfficeIcon className="h-5 w-5 text-blue-500" />
            </div>
            <div className="space-y-3">
              {clientPartnerships.topContacts?.length ? (
                clientPartnerships.topContacts.map((contact) => (
                  <div
                    key={contact.userId}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600"
                  >
                    <p className="font-semibold text-slate-800">{contact.name}</p>
                    <p className="text-xs text-slate-500">{contact.company ?? contact.email}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Last interaction: {contact.lastInteractionAt ? formatRelativeTime(contact.lastInteractionAt) : '—'}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                  No recent client interactions logged.
                </div>
              )}
            </div>
          </div>

          <div id="interview-coordination" className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Upcoming schedule</h3>
              <CalendarDaysIcon className="h-5 w-5 text-blue-500" />
            </div>
            <div className="space-y-2">
              {calendar.upcoming?.length ? (
                calendar.upcoming.map((event, index) => (
                  <div
                    key={`${event.applicationId}-${index}`}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600"
                  >
                    <p className="font-semibold text-slate-800">{event.label}</p>
                    <p className="text-xs text-slate-500">{formatDate(event.date)}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                  No upcoming events scheduled in this timeframe.
                </div>
              )}
            </div>
            <div className="grid gap-3 text-xs text-slate-600 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                Interviews this week: <strong className="text-slate-800">{calendar.workload?.interviewsThisWeek ?? 0}</strong>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                Offers pending: <strong className="text-slate-800">{calendar.workload?.offersPending ?? 0}</strong>
              </div>
            </div>
          </div>
        </section>

        <section id="activity-timeline" className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Activity timeline</h3>
            <ChartBarIcon className="h-5 w-5 text-blue-500" />
          </div>
          <div className="space-y-3">
            {activityTimeline.length ? (
              activityTimeline.map((event, index) => (
                <div
                  key={`${event.label}-${index}`}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600"
                >
                  <div>
                    <p className="font-semibold text-slate-800">{event.label}</p>
                    <p className="text-xs text-slate-500">{event.stage}</p>
                  </div>
                  <p className="text-xs text-slate-500">{formatRelativeTime(event.date)}</p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                No timeline events recorded yet.
              </div>
            )}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
