import { useEffect, useMemo, useState } from 'react';
import {
  ArrowTrendingUpIcon,
  BuildingOffice2Icon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  QueueListIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import { fetchAgencyDashboard } from '../../services/agency.js';
import { formatRelativeTime, formatAbsolute } from '../../utils/date.js';

const DEFAULT_WORKSPACE_SLUG = 'nova-collective';
const DEFAULT_MEMBERSHIPS = ['agency', 'freelancer', 'company'];

function formatNumber(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '0';
  }
  const formatter = new Intl.NumberFormat('en-GB');
  return formatter.format(Math.round(Number(value)));
}

function formatPercent(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '0%';
  }
  const numeric = Number(value);
  return `${numeric.toFixed(1)}%`;
}

function formatCurrency(amount, currency = 'USD') {
  if (amount == null || Number.isNaN(Number(amount))) {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency, maximumFractionDigits: 0 }).format(0);
  }
  const numeric = Number(amount);
  const formatter = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    maximumFractionDigits: Math.abs(numeric) >= 1000 ? 0 : 2,
  });
  return formatter.format(numeric);
}

function getInitials(name) {
  if (!name) return 'AG';
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

function titleCase(value) {
  if (!value) return '';
  return value
    .toString()
    .toLowerCase()
    .split(/[_\s-]+/)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

export default function AgencyDashboardPage() {
  const [state, setState] = useState({ data: null, loading: true, error: null });

  useEffect(() => {
    let isMounted = true;
    setState((previous) => ({ ...previous, loading: true, error: null }));

    fetchAgencyDashboard({ workspaceSlug: DEFAULT_WORKSPACE_SLUG, lookbackDays: 120 })
      .then((payload) => {
        if (isMounted) {
          setState({ data: payload, loading: false, error: null });
        }
      })
      .catch((error) => {
        if (isMounted) {
          setState({ data: null, loading: false, error: error.message ?? 'Unable to load agency dashboard.' });
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const summary = state.data?.summary ?? null;
  const workspace = state.data?.workspace ?? null;
  const agencyProfile = state.data?.agencyProfile ?? null;
  const members = state.data?.members?.list ?? [];
  const invites = state.data?.members?.invites ?? [];
  const projects = state.data?.projects?.list ?? [];
  const projectEvents = state.data?.projects?.events ?? [];
  const contactNotes = state.data?.contactNotes ?? [];
  const gigs = state.data?.gigs ?? [];
  const jobs = state.data?.jobs ?? [];
  const pipeline = summary?.pipeline ?? { statuses: {}, topCandidates: [] };
  const financialSummary = summary?.financials ?? { inEscrow: 0, released: 0, outstanding: 0, currency: 'USD' };
  const executiveData = state.data?.executive ?? {};
  const intelligenceOverview = executiveData.intelligence ?? {};
  const analyticsWarRoomData = executiveData.analyticsWarRoom ?? { summary: {}, scorecards: [], grouped: {} };
  const scenarioExplorerData = executiveData.scenarioExplorer ?? { scenarios: {}, breakdowns: {} };
  const governanceDeskData = executiveData.governance ?? {
    policies: [],
    obligations: [],
    reminders: [],
    risks: [],
    audits: [],
  };
  const leadershipHubData = executiveData.leadership ?? {
    rituals: [],
    okrs: [],
    decisions: [],
    briefings: [],
    strategicBets: [],
    collaborationRooms: [],
  };
  const innovationLabData = executiveData.innovation ?? { initiatives: [], funding: { summary: {}, events: [] } };

  const focusMetricOrder = [
    { key: 'revenueRunRate', label: 'Revenue run-rate' },
    { key: 'grossMargin', label: 'Gross margin' },
    { key: 'utilization', label: 'Utilization' },
    { key: 'pipelineVelocity', label: 'Pipeline velocity' },
    { key: 'clientSatisfaction', label: 'Client satisfaction' },
    { key: 'policyAdherence', label: 'Policy adherence' },
  ];

  function formatMetricValue(metric) {
    if (!metric || metric.value == null) {
      return '—';
    }
    switch (metric.unit) {
      case 'currency':
        return formatCurrency(metric.value, metric.metadata?.currency ?? financialSummary.currency ?? 'USD');
      case 'percentage':
        return formatPercent(metric.value);
      case 'duration':
        return `${formatNumber(metric.value)} ${metric.metadata?.unitLabel ?? 'days'}`;
      case 'score':
        return formatNumber(metric.value);
      default:
        return formatNumber(metric.value);
    }
  }

  function describeMetricChange(metric) {
    if (!metric || metric.changeValue == null) {
      return null;
    }
    const changeUnit = metric.changeUnit ?? metric.unit ?? 'count';
    const absolute = Math.abs(metric.changeValue);
    const sign = metric.changeValue >= 0 ? '+' : '-';
    let valueText;
    switch (changeUnit) {
      case 'currency':
        valueText = `${sign}${formatCurrency(absolute, metric.metadata?.currency ?? financialSummary.currency ?? 'USD')}`;
        break;
      case 'percentage':
        valueText = `${sign}${absolute.toFixed(1)}pp`;
        break;
      case 'duration':
        valueText = `${sign}${formatNumber(absolute)} ${metric.metadata?.unitLabel ?? 'days'}`;
        break;
      case 'score':
        valueText = `${sign}${formatNumber(absolute)}`;
        break;
      default:
        valueText = `${sign}${formatNumber(absolute)}`;
        break;
    }
    const directionClass =
      metric.trend === 'down' ? 'text-red-600' : metric.trend === 'up' ? 'text-emerald-600' : 'text-slate-500';
    const comparison = metric.comparisonPeriod ? ` ${metric.comparisonPeriod}` : '';
    return { text: `${valueText}${comparison}`, className: directionClass };
  }

  function normaliseTagList(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return [];
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (error) {
        // Ignore parse failures and fall back to splitting
      }
      return trimmed
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }
    return [];
  }

  function summariseAssumptions(value) {
    if (!value) return null;
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'object') {
      if (Array.isArray(value.drivers)) {
        return value.drivers.join(', ');
      }
      const stringEntries = Object.values(value).filter((entry) => typeof entry === 'string');
      if (stringEntries.length) {
        return stringEntries.join(', ');
      }
    }
    return null;
  }

  const focusMetrics = focusMetricOrder.map((item) => ({
    ...item,
    metric: analyticsWarRoomData.summary?.[item.key] ?? null,
  }));

  const groupedWarRoom = analyticsWarRoomData.grouped ?? {};
  const scenarioBreakdowns = scenarioExplorerData.breakdowns ?? {};
  const topPolicies = (governanceDeskData.policies ?? []).slice(0, 4);
  const topObligations = (governanceDeskData.obligations ?? []).slice(0, 4);
  const upcomingReminders = (governanceDeskData.reminders ?? []).slice(0, 4);
  const highlightedRisks = (governanceDeskData.risks ?? []).slice(0, 4);
  const recentAudits = (governanceDeskData.audits ?? []).slice(0, 4);
  const upcomingRituals = (leadershipHubData.rituals ?? []).slice(0, 4);
  const keyOkrs = (leadershipHubData.okrs ?? []).slice(0, 4);
  const decisionLog = (leadershipHubData.decisions ?? []).slice(0, 4);
  const briefingPacks = (leadershipHubData.briefings ?? []).slice(0, 4);
  const strategicBets = (leadershipHubData.strategicBets ?? []).slice(0, 4);
  const leadershipRooms = (leadershipHubData.collaborationRooms ?? []).slice(0, 4);
  const innovationInitiatives = (innovationLabData.initiatives ?? []).slice(0, 6);
  const fundingSummary = innovationLabData.funding?.summary ?? {};
  const fundingEvents = (innovationLabData.funding?.events ?? []).slice(0, 5);

  const activeProjectsCount = summary?.projects?.buckets?.active ?? summary?.projects?.total ?? 0;
  const totalProjectsCount = summary?.projects?.total ?? projects.length ?? 0;
  const autoAssignQueueSize = summary?.projects?.autoAssignQueueSize ?? pipeline.statuses?.pending ?? 0;
  const utilizationRate = summary?.members?.utilizationRate ?? 0;
  const pendingInvitesCount = summary?.members?.pendingInvites ?? invites.length;
  const totalMembersCount = summary?.members?.total ?? members.length;
  const benchCount = summary?.members?.bench ?? benchMembers.length;
  const averageWeeklyCapacity = summary?.members?.averageWeeklyCapacity ?? null;
  const totalGigsCount = gigs.length;
  const acceptedAssignmentsCount = pipeline.statuses?.accepted ?? 0;
  const pendingMatchesCount = pipeline.statuses?.pending ?? 0;
  const activeClientsCount = summary?.clients?.active ?? contactNotes.length;
  const releasedAmountText = formatCurrency(financialSummary.released ?? 0, financialSummary.currency);
  const summaryScope = state.data?.scope ?? 'global';
  const workspaceSlugValue = workspace?.slug ?? 'n/a';

  const revenueRunRateText = formatMetricValue(analyticsWarRoomData.summary?.revenueRunRate ?? null);
  const marginText = formatMetricValue(analyticsWarRoomData.summary?.grossMargin ?? null);
  const analyticsScorecardCount = analyticsWarRoomData.scorecards?.length ?? 0;
  const analyticsCategoryCount = Object.keys(groupedWarRoom).length;
  const scenarioCount = Object.keys(scenarioExplorerData.scenarios ?? {}).length;
  const governancePolicyCount = governanceDeskData.policies?.length ?? 0;
  const governanceObligationCount = governanceDeskData.obligations?.length ?? 0;
  const leadershipDecisionCount = leadershipHubData.decisions?.length ?? 0;
  const leadershipRitualCount = leadershipHubData.rituals?.length ?? 0;
  const innovationCount = innovationLabData.initiatives?.length ?? 0;

  const benchMembers = members
    .filter((member) => member.availability?.status === 'available')
    .slice(0, 4);

  const menuSections = useMemo(() => {
    return [
      {
        label: 'Executive intelligence & governance',
        items: [
          {
            name: 'Executive overview',
            sectionId: 'executive-intelligence',
            description: `${revenueRunRateText} run-rate · ${marginText} margin`,
          },
          {
            name: 'Analytics war room',
            sectionId: 'analytics-war-room',
            description: `${formatNumber(analyticsScorecardCount)} scorecards across ${formatNumber(analyticsCategoryCount)} categories`,
          },
          {
            name: 'Scenario explorer',
            sectionId: 'scenario-explorer',
            description: `${formatNumber(scenarioCount)} active scenarios with drill-downs`,
          },
          {
            name: 'Governance desk',
            sectionId: 'governance-desk',
            description: `${formatNumber(governancePolicyCount)} policies · ${formatNumber(governanceObligationCount)} obligations`,
          },
          {
            name: 'Leadership collaboration',
            sectionId: 'leadership-collaboration',
            description: `${formatNumber(leadershipRitualCount)} rituals · ${formatNumber(leadershipDecisionCount)} decisions tracked`,
          },
          {
            name: 'Innovation lab',
            sectionId: 'innovation-lab',
            description: `${formatNumber(innovationCount)} initiatives in pipeline`,
          },
        ],
      },
      {
        label: 'Agency operations',
        items: [
          {
            name: 'Agency overview',
            description: `Utilization running at ${formatPercent(utilizationRate)} with ${formatNumber(activeProjectsCount)} active projects.`,
          },
          {
            name: 'Projects workspace',
            description: `${formatNumber(totalProjectsCount)} projects monitored · ${formatNumber(autoAssignQueueSize)} candidates in queues.`,
            tags: ['projects'],
          },
          {
            name: 'Gig programs',
            description: `${formatNumber(totalGigsCount)} managed gigs and ${formatNumber(acceptedAssignmentsCount)} accepted assignments this quarter.`,
          },
        ],
      },
      {
        label: 'Talent & HR',
        items: [
          {
            name: 'HR management',
            description: `${formatNumber(totalMembersCount)} members · ${formatNumber(benchCount)} on bench · ${formatNumber(pendingInvitesCount)} invites open`,
          },
          {
            name: 'Capacity planning',
            description: `Average weekly capacity ${averageWeeklyCapacity ? `${averageWeeklyCapacity}h` : 'n/a'}.`,
          },
          {
            name: 'Internal marketplace',
            description: `${formatNumber(pendingMatchesCount)} pending matches ready for review.`,
            tags: ['auto-assign'],
          },
        ],
      },
      {
        label: 'Growth & brand',
        items: [
          {
            name: 'Analytics & insights',
            description: `${releasedAmountText} released YTD.`,
          },
          {
            name: 'Marketing studio',
            description: `${formatNumber(activeClientsCount)} active client relationships tracked.`,
          },
          {
            name: 'Settings & governance',
            description: `Workspace ${workspaceSlugValue} · ${summaryScope === 'workspace' ? 'Workspace filtered' : summaryScope === 'global_fallback' ? 'Global metrics fallback' : 'Global view'}.`,
          },
        ],
      },
    ];
  }, [
    revenueRunRateText,
    marginText,
    analyticsScorecardCount,
    analyticsCategoryCount,
    scenarioCount,
    governancePolicyCount,
    governanceObligationCount,
    leadershipRitualCount,
    leadershipDecisionCount,
    innovationCount,
    utilizationRate,
    activeProjectsCount,
    totalProjectsCount,
    autoAssignQueueSize,
    totalGigsCount,
    acceptedAssignmentsCount,
    totalMembersCount,
    benchCount,
    pendingInvitesCount,
    averageWeeklyCapacity,
    pendingMatchesCount,
    releasedAmountText,
    activeClientsCount,
    workspaceSlugValue,
    summaryScope,
  ]);

  const profile = useMemo(() => {
    const metrics = [];
    if (summary?.members?.active != null) {
      metrics.push({ label: 'Active members', value: formatNumber(summary.members.active) });
    }
    if (summary?.projects?.total != null) {
      metrics.push({ label: 'Projects', value: formatNumber(summary.projects.total) });
    }
    if (summary?.financials?.inEscrow != null) {
      metrics.push({ label: 'In escrow', value: formatCurrency(summary.financials.inEscrow, summary.financials.currency) });
    }

    const badges = [];
    if (state.data?.scope === 'workspace') {
      badges.push('Workspace view');
    } else if (state.data?.scope === 'global_fallback') {
      badges.push('Global metrics fallback');
    } else {
      badges.push('Global view');
    }

    return {
      name: agencyProfile?.agencyName ?? workspace?.name ?? 'Agency Workspace',
      role: agencyProfile?.focusArea ?? 'Agency operations',
      initials: agencyProfile?.agencyName ? getInitials(agencyProfile.agencyName) : getInitials(workspace?.name ?? 'Agency'),
      status: workspace?.isActive === false ? 'Suspended' : 'Operating at scale',
      badges,
      metrics,
    };
  }, [agencyProfile, workspace, summary, state.data?.scope]);

  const capabilitySections = [];

  const summaryCards = useMemo(() => {
    const cards = [
      {
        name: 'Utilization',
        value: formatPercent(summary?.members?.utilizationRate ?? 0),
        description: `${formatNumber(summary?.members?.bench ?? 0)} on bench`,
        icon: ArrowTrendingUpIcon,
      },
      {
        name: 'Active projects',
        value: formatNumber(summary?.projects?.buckets?.active ?? summary?.projects?.total ?? 0),
        description: `${formatNumber(summary?.projects?.total ?? 0)} total engagements`,
        icon: QueueListIcon,
      },
      {
        name: 'Revenue in escrow',
        value: formatCurrency(financialSummary.inEscrow ?? 0, financialSummary.currency),
        description: `${formatCurrency(financialSummary.released ?? 0, financialSummary.currency)} released YTD`,
        icon: CurrencyDollarIcon,
      },
      {
        name: 'Client relationships',
        value: formatNumber(summary?.clients?.active ?? contactNotes.length ?? 0),
        description: `${formatNumber(summary?.clients?.notes ?? 0)} notes logged`,
        icon: BuildingOffice2Icon,
      },
    ];
    return cards;
  }, [summary, financialSummary, contactNotes.length]);

  const renderLoading = (
    <section className="rounded-3xl border border-blue-100 bg-white/80 p-10 shadow-inner">
      <div className="space-y-4">
        <div className="h-6 w-48 animate-pulse rounded-full bg-blue-100" />
        <div className="h-4 w-64 animate-pulse rounded-full bg-blue-50" />
        <div className="h-4 w-80 animate-pulse rounded-full bg-blue-50" />
      </div>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-3 rounded-3xl border border-blue-50 bg-blue-50/50 p-6">
            <div className="h-4 w-32 animate-pulse rounded-full bg-blue-100" />
            <div className="h-8 w-20 animate-pulse rounded-full bg-blue-200" />
            <div className="h-4 w-24 animate-pulse rounded-full bg-blue-100" />
          </div>
        ))}
      </div>
    </section>
  );

  const renderError = (
    <section className="rounded-3xl border border-red-100 bg-red-50/70 p-6 text-red-700">
      <div className="flex items-start gap-3">
        <ExclamationTriangleIcon className="h-6 w-6 flex-shrink-0" />
        <div>
          <h2 className="text-base font-semibold">We couldn&rsquo;t load the agency dashboard</h2>
          <p className="mt-1 text-sm">{state.error ?? 'An unexpected error occurred. Please try refreshing the page.'}</p>
        </div>
      </div>
    </section>
  );

  const executiveFocusMetrics = focusMetrics.filter((item) => item.metric);
  const executiveScorecards = (intelligenceOverview.metrics ?? []).slice(0, 6);
  const executivePolicies = (intelligenceOverview.compliancePolicies ?? []).slice(0, 4);
  const executiveObligations = (intelligenceOverview.upcomingObligations ?? []).slice(0, 4);
  const executiveRooms = (intelligenceOverview.collaborationRooms ?? []).slice(0, 3);

  const renderExecutiveIntelligenceSection = (
    <section id="executive-intelligence" className="rounded-3xl border border-blue-100 bg-white p-8 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Executive intelligence &amp; governance</p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-900">Stay on top of the agency command centre</h2>
          <p className="mt-2 text-sm text-slate-500">
            Signal-driven focus metrics, compliance posture, and collaboration rooms aligned to leadership decisions.
          </p>
        </div>
        <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-right">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Run-rate</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{revenueRunRateText}</p>
          <p className="text-xs text-slate-500">Gross margin {marginText}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {executiveFocusMetrics.length ? (
          executiveFocusMetrics.map((item) => {
            const change = describeMetricChange(item.metric);
            return (
              <div key={item.key} className="rounded-2xl border border-slate-200/70 bg-slate-50/70 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{formatMetricValue(item.metric)}</p>
                {change ? (
                  <p className={`mt-1 text-xs font-medium ${change.className}`}>{change.text}</p>
                ) : null}
                {item.metric?.description ? (
                  <p className="mt-3 text-xs text-slate-500">{item.metric.description}</p>
                ) : null}
              </div>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/80 p-6 text-sm text-slate-500">
            Executive metrics will appear here once configured.
          </div>
        )}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Executive scorecards</h3>
              <span className="text-xs font-medium uppercase tracking-wide text-blue-600">
                {formatNumber(analyticsScorecardCount)} metrics tracked
              </span>
            </div>
            <ul className="mt-4 space-y-3">
              {executiveScorecards.length ? (
                executiveScorecards.map((metric) => {
                  const change = describeMetricChange(metric);
                  return (
                    <li
                      key={metric.id ?? metric.metricKey}
                      className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-white/70 bg-white px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-900">{metric.name}</p>
                        {metric.description ? (
                          <p className="text-xs text-slate-500">{metric.description}</p>
                        ) : null}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-900">{formatMetricValue(metric)}</p>
                        {change ? (
                          <p className={`text-xs font-medium ${change.className}`}>{change.text}</p>
                        ) : null}
                      </div>
                    </li>
                  );
                })
              ) : (
                <li className="rounded-2xl border border-dashed border-blue-200 px-4 py-6 text-center text-sm text-slate-500">
                  Add metrics to populate the leadership scorecard view.
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-slate-900">Compliance policies</h3>
            <ul className="mt-3 space-y-3">
              {executivePolicies.length ? (
                executivePolicies.map((policy) => (
                  <li key={policy.id} className="rounded-2xl border border-slate-200/60 bg-slate-50/60 px-4 py-3">
                    <p className="text-sm font-medium text-slate-900">{policy.title}</p>
                    <p className="text-xs text-slate-500">
                      {titleCase(policy.documentType)} · {titleCase(policy.status ?? 'active')}
                      {policy.nextReviewAt ? ` · Next review ${formatAbsolute(policy.nextReviewAt)}` : ''}
                    </p>
                  </li>
                ))
              ) : (
                <li className="text-sm text-slate-500">No policies have been catalogued.</li>
              )}
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-slate-900">Upcoming obligations</h3>
            <ul className="mt-3 space-y-3">
              {executiveObligations.length ? (
                executiveObligations.map((obligation) => (
                  <li key={obligation.id} className="rounded-2xl border border-slate-200/60 bg-slate-50/60 px-4 py-3">
                    <p className="text-sm font-medium text-slate-900">{obligation.description}</p>
                    <p className="text-xs text-slate-500">
                      {obligation.document?.title ? `${obligation.document.title} · ` : ''}
                      Due {obligation.dueAt ? formatAbsolute(obligation.dueAt) : 'TBC'}
                      {obligation.priority ? ` · Priority ${titleCase(obligation.priority)}` : ''}
                    </p>
                  </li>
                ))
              ) : (
                <li className="text-sm text-slate-500">All governance obligations are up to date.</li>
              )}
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-slate-900">Leadership rooms</h3>
            <ul className="mt-3 space-y-3">
              {executiveRooms.length ? (
                executiveRooms.map((room) => (
                  <li key={room.id} className="rounded-2xl border border-slate-200/60 bg-slate-50/60 px-4 py-3">
                    <p className="text-sm font-medium text-slate-900">{room.name}</p>
                    <p className="text-xs text-slate-500">
                      {room.summary ?? 'Shared workspace for leadership rituals.'}
                    </p>
                    {room.meetingCadence ? (
                      <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-blue-600">{room.meetingCadence}</p>
                    ) : null}
                  </li>
                ))
              ) : (
                <li className="text-sm text-slate-500">Create collaboration rooms to orchestrate executive work.</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );

  const warRoomScorecards = (analyticsWarRoomData.scorecards ?? []).slice(0, 9);
  const groupedWarRoomEntries = Object.entries(groupedWarRoom).sort((a, b) => a[0].localeCompare(b[0]));

  const renderAnalyticsWarRoomSection = (
    <section id="analytics-war-room" className="rounded-3xl border border-blue-100 bg-white p-8 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Agency analytics war room</p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-900">Interactive command centre for revenue and delivery</h2>
          <p className="mt-2 text-sm text-slate-500">
            Track revenue, margin, utilisation, and policy adherence with real-time scorecards grouped by strategic lenses.
          </p>
        </div>
        <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-right">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Categories</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{formatNumber(analyticsCategoryCount)}</p>
          <p className="text-xs text-slate-500">{formatNumber(analyticsScorecardCount)} scorecards</p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">Metric spotlight</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {warRoomScorecards.length ? (
                warRoomScorecards.map((metric) => {
                  const change = describeMetricChange(metric);
                  return (
                    <div key={metric.id ?? metric.metricKey} className="rounded-2xl border border-slate-200/70 bg-slate-50/70 p-5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{titleCase(metric.category)}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{metric.name}</p>
                      <p className="mt-3 text-2xl font-semibold text-slate-900">{formatMetricValue(metric)}</p>
                      {change ? (
                        <p className={`mt-1 text-xs font-medium ${change.className}`}>{change.text}</p>
                      ) : null}
                      {metric.description ? (
                        <p className="mt-3 text-xs text-slate-500">{metric.description}</p>
                      ) : null}
                    </div>
                  );
                })
              ) : (
                <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
                  Configure scorecards to activate the analytics war room.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {groupedWarRoomEntries.length ? (
            groupedWarRoomEntries.map(([category, metrics]) => (
              <div key={category} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">{titleCase(category)}</h3>
                  <span className="text-xs font-medium uppercase tracking-wide text-blue-600">
                    {formatNumber(metrics.length)} metrics
                  </span>
                </div>
                <ul className="mt-3 space-y-2">
                  {metrics.slice(0, 4).map((metric) => (
                    <li key={metric.id ?? metric.metricKey} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/60 bg-white px-3 py-2">
                      <div>
                        <p className="text-xs font-semibold text-slate-600">{metric.name}</p>
                        {metric.description ? (
                          <p className="text-[11px] text-slate-500">{metric.description}</p>
                        ) : null}
                      </div>
                      <p className="text-sm font-semibold text-slate-900">{formatMetricValue(metric)}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white/80 p-6 text-sm text-slate-500">
              Metrics will automatically cluster into command pods once recorded.
            </div>
          )}
        </div>
      </div>
    </section>
  );

  const scenarioCards = Object.entries(scenarioExplorerData.scenarios ?? {}).map(([scenarioKey, scenario]) => ({
    key: scenarioKey,
    ...scenario,
  }));
  const scenarioOrder = ['best', 'base', 'worst'];
  scenarioCards.sort((a, b) => {
    const indexA = scenarioOrder.indexOf(a.key);
    const indexB = scenarioOrder.indexOf(b.key);
    if (indexA === -1 && indexB === -1) return a.label.localeCompare(b.label);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  function summariseScenarioMetrics(metrics = {}) {
    const parts = [];
    if (metrics.revenue != null) {
      parts.push(`Revenue ${formatCurrency(metrics.revenue, financialSummary.currency)}`);
    }
    if (metrics.grossMargin != null) {
      parts.push(`Margin ${formatPercent(metrics.grossMargin)}`);
    }
    if (metrics.utilization != null) {
      parts.push(`Util ${formatPercent(metrics.utilization)}`);
    }
    if (metrics.pipelineVelocity != null) {
      parts.push(`Velocity ${formatNumber(metrics.pipelineVelocity)} days`);
    }
    if (metrics.clientSatisfaction != null) {
      parts.push(`Satisfaction ${formatNumber(metrics.clientSatisfaction)}`);
    }
    if (metrics.netRetention != null) {
      parts.push(`Net retention ${formatPercent(metrics.netRetention)}`);
    }
    return parts.join(' · ');
  }

  const scenarioDimensions = [
    { key: 'clients', label: 'Clients' },
    { key: 'serviceLines', label: 'Service lines' },
    { key: 'squads', label: 'Squads' },
    { key: 'individuals', label: 'Individuals' },
  ];

  const renderScenarioExplorerSection = (
    <section id="scenario-explorer" className="rounded-3xl border border-blue-100 bg-white p-8 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Scenario explorer</p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-900">Plan best, base, and worst-case outcomes</h2>
          <p className="mt-2 text-sm text-slate-500">
            Model forecasts and drill down into clients, service lines, squads, or individuals to stress-test delivery plans.
          </p>
        </div>
        <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-right">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Scenarios</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{formatNumber(scenarioCards.length)}</p>
          <p className="text-xs text-slate-500">Interactive forecasts</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {scenarioCards.length ? (
          scenarioCards.map((scenario) => (
            <div key={scenario.key} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{titleCase(scenario.key)}</p>
                  <h3 className="mt-1 text-lg font-semibold text-slate-900">{scenario.label ?? titleCase(scenario.key)}</h3>
                </div>
                {scenario.timeframeStart || scenario.timeframeEnd ? (
                  <p className="text-xs text-slate-500 text-right">
                    {scenario.timeframeStart ? formatAbsolute(scenario.timeframeStart) : ''}
                    {scenario.timeframeStart && scenario.timeframeEnd ? ' – ' : ''}
                    {scenario.timeframeEnd ? formatAbsolute(scenario.timeframeEnd) : ''}
                  </p>
                ) : null}
              </div>
              <p className="mt-3 text-sm font-medium text-slate-900">{summariseScenarioMetrics(scenario.metrics)}</p>
              {summariseAssumptions(scenario.assumptions) ? (
                <p className="mt-3 text-xs text-slate-500">Assumptions: {summariseAssumptions(scenario.assumptions)}</p>
              ) : null}
              {scenario.notes ? <p className="mt-3 text-xs text-slate-500">Notes: {scenario.notes}</p> : null}
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/80 p-6 text-sm text-slate-500 md:col-span-3">
            Create scenario plans to compare best, base, and downside cases.
          </div>
        )}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {scenarioDimensions.map((dimension) => {
          const items = (scenarioBreakdowns[dimension.key] ?? []).slice(0, 6);
          return (
            <div key={dimension.key} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">{dimension.label} drill-down</h3>
                <span className="text-xs font-medium uppercase tracking-wide text-blue-600">{formatNumber(items.length)} entries</span>
              </div>
              <ul className="mt-3 space-y-3">
                {items.length ? (
                  items.map((item) => (
                    <li key={`${item.dimensionKey}-${item.scenarioType}`} className="rounded-2xl border border-slate-200/60 bg-slate-50/60 px-4 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-slate-900">{item.label ?? item.dimensionKey}</p>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-600">{titleCase(item.scenarioType)}</p>
                        </div>
                        <p className="text-xs text-slate-500 text-right">{summariseScenarioMetrics(item.metrics)}</p>
                      </div>
                      {item.owner ? (
                        <p className="mt-2 text-xs text-slate-500">Owner: {item.owner}</p>
                      ) : null}
                      {item.highlight ? (
                        <p className="mt-1 text-xs text-emerald-600">Highlight: {item.highlight}</p>
                      ) : null}
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-slate-500">No {dimension.label.toLowerCase()} captured yet.</li>
                )}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );

  const renderGovernanceDeskSection = (
    <section id="governance-desk" className="rounded-3xl border border-blue-100 bg-white p-8 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Governance &amp; compliance desk</p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-900">Contracts, NDAs, insurance, and regulatory coverage</h2>
          <p className="mt-2 text-sm text-slate-500">
            Maintain risk registers, automated reviews, and audit-ready exports tied directly to mitigation owners.
          </p>
        </div>
        <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-right">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Policies &amp; obligations</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">
            {formatNumber(governancePolicyCount)} / {formatNumber(governanceObligationCount)}
          </p>
          <p className="text-xs text-slate-500">Tracked artefacts</p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-slate-900">Policy register</h3>
            <ul className="mt-3 space-y-3">
              {topPolicies.length ? (
                topPolicies.map((policy) => (
                  <li key={policy.id} className="rounded-2xl border border-slate-200/60 bg-slate-50/60 px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{policy.title}</p>
                        <p className="text-xs text-slate-500">{titleCase(policy.documentType)} · {titleCase(policy.status ?? 'active')}</p>
                      </div>
                      {policy.expiryDate ? (
                        <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-blue-600">
                          Expires {formatAbsolute(policy.expiryDate)}
                        </span>
                      ) : null}
                    </div>
                    {policy.renewalTerms ? (
                      <p className="mt-2 text-xs text-slate-500">Renewal: {policy.renewalTerms}</p>
                    ) : null}
                    {policy.counterpartyName ? (
                      <p className="mt-1 text-xs text-slate-500">Counterparty: {policy.counterpartyName}</p>
                    ) : null}
                    {policy.nextReviewAt ? (
                      <p className="mt-1 text-xs text-blue-600">Next review {formatAbsolute(policy.nextReviewAt)}</p>
                    ) : null}
                  </li>
                ))
              ) : (
                <li className="text-sm text-slate-500">No policies available for this workspace.</li>
              )}
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-slate-900">Risk register</h3>
            <ul className="mt-3 space-y-3">
              {highlightedRisks.length ? (
                highlightedRisks.map((risk) => (
                  <li key={risk.id} className="rounded-2xl border border-slate-200/60 bg-slate-50/60 px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{risk.title}</p>
                        <p className="text-xs text-slate-500">
                          {titleCase(risk.category ?? 'risk')} · Status {titleCase(risk.status ?? 'open')} · Impact {formatNumber(risk.impactScore)} / Likelihood {formatNumber(risk.likelihoodScore)}
                        </p>
                      </div>
                      {risk.targetResolutionDate ? (
                        <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-amber-700">
                          Resolve by {formatAbsolute(risk.targetResolutionDate)}
                        </span>
                      ) : null}
                    </div>
                    {risk.mitigationPlan ? (
                      <p className="mt-2 text-xs text-slate-500">Plan: {risk.mitigationPlan}</p>
                    ) : null}
                    {risk.mitigationOwner ? (
                      <p className="mt-1 text-xs text-slate-500">Owner: {risk.mitigationOwner}</p>
                    ) : null}
                    {risk.mitigationStatus ? (
                      <p className="mt-1 text-xs text-blue-600">Status: {risk.mitigationStatus}</p>
                    ) : null}
                  </li>
                ))
              ) : (
                <li className="text-sm text-slate-500">No risks captured in the register.</li>
              )}
            </ul>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-slate-900">Obligations &amp; reminders</h3>
            <ul className="mt-3 space-y-3">
              {topObligations.length ? (
                topObligations.map((obligation) => (
                  <li key={obligation.id} className="rounded-2xl border border-slate-200/60 bg-slate-50/60 px-4 py-3">
                    <p className="text-sm font-medium text-slate-900">{obligation.description}</p>
                    <p className="text-xs text-slate-500">
                      {obligation.document?.title ? `${obligation.document.title} · ` : ''}
                      Due {obligation.dueAt ? formatAbsolute(obligation.dueAt) : 'TBC'}
                      {obligation.status ? ` · ${titleCase(obligation.status)}` : ''}
                    </p>
                  </li>
                ))
              ) : (
                <li className="text-sm text-slate-500">No obligations require attention.</li>
              )}
            </ul>

            <div className="mt-4 rounded-2xl border border-dashed border-blue-200 bg-blue-50/40 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Automated reminders</p>
              <ul className="mt-2 space-y-2">
                {upcomingReminders.length ? (
                  upcomingReminders.map((reminder) => (
                    <li key={reminder.id} className="text-xs text-slate-500">
                      {reminder.document?.title ? `${reminder.document.title} · ` : ''}
                      {titleCase(reminder.reminderType ?? 'reminder')} scheduled {reminder.sendAt ? formatAbsolute(reminder.sendAt) : 'TBC'}
                      {reminder.status ? ` · ${titleCase(reminder.status)}` : ''}
                    </li>
                  ))
                ) : (
                  <li className="text-xs text-slate-500">No reminders scheduled.</li>
                )}
              </ul>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-slate-900">Audit-ready exports</h3>
            <ul className="mt-3 space-y-3">
              {recentAudits.length ? (
                recentAudits.map((audit) => (
                  <li key={audit.id} className="rounded-2xl border border-slate-200/60 bg-slate-50/60 px-4 py-3">
                    <p className="text-sm font-medium text-slate-900">{titleCase(audit.exportType ?? 'export')}</p>
                    <p className="text-xs text-slate-500">
                      Requested by {audit.requestedBy ?? 'Client'} · Generated {audit.generatedAt ? formatAbsolute(audit.generatedAt) : 'TBC'}
                    </p>
                    {audit.notes ? <p className="mt-1 text-xs text-slate-500">{audit.notes}</p> : null}
                  </li>
                ))
              ) : (
                <li className="text-sm text-slate-500">No audit exports generated yet.</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );

  const renderLeadershipHubSection = (
    <section id="leadership-collaboration" className="rounded-3xl border border-blue-100 bg-white p-8 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Leadership collaboration</p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-900">Shared rituals, OKRs, decisions, and async briefings</h2>
          <p className="mt-2 text-sm text-slate-500">
            Coordinate distributed leaders with recurring rituals, transparent decision logs, and Monday-ready briefing packs.
          </p>
        </div>
        <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-right">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Leadership assets</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{formatNumber(leadershipRitualCount + leadershipDecisionCount)}</p>
          <p className="text-xs text-slate-500">Rituals &amp; decisions</p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-slate-900">Upcoming rituals</h3>
            <ul className="mt-3 space-y-3">
              {upcomingRituals.length ? (
                upcomingRituals.map((ritual) => (
                  <li key={ritual.id} className="rounded-2xl border border-slate-200/60 bg-slate-50/60 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{ritual.name}</p>
                        <p className="text-xs text-slate-500">Cadence {titleCase(ritual.cadence ?? 'weekly')} · Facilitator {ritual.facilitator ?? 'TBC'}</p>
                      </div>
                      {ritual.nextSessionAt ? (
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-emerald-600">
                          Next {formatAbsolute(ritual.nextSessionAt)}
                        </span>
                      ) : null}
                    </div>
                    {ritual.summary ? <p className="mt-2 text-xs text-slate-500">{ritual.summary}</p> : null}
                  </li>
                ))
              ) : (
                <li className="text-sm text-slate-500">No leadership rituals scheduled.</li>
              )}
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-slate-900">Strategic bets</h3>
            <ul className="mt-3 space-y-3">
              {strategicBets.length ? (
                strategicBets.map((bet) => (
                  <li key={bet.id} className="rounded-2xl border border-slate-200/60 bg-slate-50/60 px-4 py-3">
                    <p className="text-sm font-medium text-slate-900">{bet.name}</p>
                    <p className="text-xs text-slate-500">
                      Owner {bet.owner ?? 'TBC'} · Progress {formatPercent(bet.progress ?? 0)} · Impact {formatNumber(bet.impactScore ?? 0)}
                    </p>
                    {bet.project?.title ? (
                      <p className="mt-1 text-xs text-slate-500">Linked project: {bet.project.title}</p>
                    ) : null}
                    {bet.thesis ? <p className="mt-2 text-xs text-slate-500">Thesis: {bet.thesis}</p> : null}
                  </li>
                ))
              ) : (
                <li className="text-sm text-slate-500">Document strategic bets to align leadership focus.</li>
              )}
            </ul>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-slate-900">Objectives &amp; key results</h3>
            <ul className="mt-3 space-y-3">
              {keyOkrs.length ? (
                keyOkrs.map((okr) => {
                  const keyResults = normaliseTagList(okr.keyResults);
                  return (
                    <li key={okr.id} className="rounded-2xl border border-slate-200/60 bg-slate-50/60 px-4 py-3">
                      <p className="text-sm font-medium text-slate-900">{okr.objective}</p>
                      <p className="text-xs text-slate-500">
                        Owner {okr.owner ?? 'TBC'} · Status {titleCase(okr.status ?? 'on_track')} · Progress {formatPercent(okr.progress ?? 0)} · Confidence {formatPercent(okr.confidence ?? 0)}
                      </p>
                      {keyResults.length ? (
                        <p className="mt-2 text-xs text-slate-500">Key results: {keyResults.join('; ')}</p>
                      ) : null}
                    </li>
                  );
                })
              ) : (
                <li className="text-sm text-slate-500">No OKRs have been logged for this cycle.</li>
              )}
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-slate-900">Decision log &amp; briefing packs</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recent decisions</p>
                <ul className="mt-2 space-y-2">
                  {decisionLog.length ? (
                    decisionLog.map((decision) => (
                      <li key={decision.id} className="rounded-2xl border border-slate-200/60 bg-slate-50/60 px-4 py-3">
                        <p className="text-sm font-medium text-slate-900">{decision.title}</p>
                        <p className="text-xs text-slate-500">
                          {titleCase(decision.status ?? 'open')} · {decision.decidedAt ? formatAbsolute(decision.decidedAt) : 'Date TBC'} · Owner {decision.owner ?? 'TBC'}
                        </p>
                        {decision.summary ? <p className="mt-1 text-xs text-slate-500">{decision.summary}</p> : null}
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-slate-500">No decisions recorded yet.</li>
                  )}
                </ul>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Briefing packs</p>
                <ul className="mt-2 space-y-2">
                  {briefingPacks.length ? (
                    briefingPacks.map((briefing) => {
                      const highlights = normaliseTagList(briefing.highlights);
                      return (
                        <li key={briefing.id} className="rounded-2xl border border-slate-200/60 bg-slate-50/60 px-4 py-3">
                          <p className="text-sm font-medium text-slate-900">{briefing.title}</p>
                          <p className="text-xs text-slate-500">
                            {titleCase(briefing.status ?? 'draft')} · {briefing.distributionDate ? formatAbsolute(briefing.distributionDate) : 'Distribution TBC'} · Prepared by {briefing.preparedBy ?? 'Team'}
                          </p>
                          {briefing.summary ? <p className="mt-1 text-xs text-slate-500">{briefing.summary}</p> : null}
                          {highlights.length ? (
                            <p className="mt-1 text-xs text-blue-600">Highlights: {highlights.join('; ')}</p>
                          ) : null}
                        </li>
                      );
                    })
                  ) : (
                    <li className="text-sm text-slate-500">No briefing packs published yet.</li>
                  )}
                </ul>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Collaboration rooms</p>
                <ul className="mt-2 space-y-2">
                  {leadershipRooms.length ? (
                    leadershipRooms.map((room) => (
                      <li key={room.id} className="rounded-2xl border border-slate-200/60 bg-slate-50/60 px-4 py-3">
                        <p className="text-sm font-medium text-slate-900">{room.name}</p>
                        <p className="text-xs text-slate-500">{room.summary ?? 'Leadership collaboration space.'}</p>
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-slate-500">Spin up leadership rooms to centralise async rituals.</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  const renderInnovationLabSection = (
    <section id="innovation-lab" className="rounded-3xl border border-blue-100 bg-white p-8 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Innovation lab</p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-900">Experiment with new service lines and incubators</h2>
          <p className="mt-2 text-sm text-slate-500">
            Prioritise initiatives, track funding, and link ROI snapshots back to executive decision-making.
          </p>
        </div>
        <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-right">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Portfolio</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{formatNumber(innovationCount)}</p>
          <p className="text-xs text-slate-500">Active initiatives</p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-slate-900">Funding snapshot</h3>
          <dl className="mt-3 space-y-3">
            <div className="flex items-center justify-between rounded-2xl border border-slate-200/60 bg-slate-50/60 px-4 py-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Allocated</dt>
              <dd className="text-sm font-semibold text-slate-900">{formatCurrency(fundingSummary.allocated ?? 0, financialSummary.currency)}</dd>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-slate-200/60 bg-slate-50/60 px-4 py-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Spent</dt>
              <dd className="text-sm font-semibold text-slate-900">{formatCurrency(fundingSummary.spent ?? 0, financialSummary.currency)}</dd>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-slate-200/60 bg-slate-50/60 px-4 py-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Returned</dt>
              <dd className="text-sm font-semibold text-slate-900">{formatCurrency(fundingSummary.returned ?? 0, financialSummary.currency)}</dd>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50/70 px-4 py-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Balance</dt>
              <dd className="text-sm font-semibold text-emerald-700">{formatCurrency(fundingSummary.balance ?? 0, financialSummary.currency)}</dd>
            </div>
          </dl>

          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Funding events</p>
            <ul className="mt-2 space-y-2">
              {fundingEvents.length ? (
                fundingEvents.map((event) => (
                  <li key={event.id} className="rounded-2xl border border-slate-200/60 bg-slate-50/60 px-4 py-3 text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">{titleCase(event.eventType ?? 'allocation')}</span>
                    {` • ${formatCurrency(event.amount ?? 0, event.currency ?? financialSummary.currency)} · ${event.recordedAt ? formatAbsolute(event.recordedAt) : 'Recorded TBC'}`}
                    {event.owner ? ` · ${event.owner}` : ''}
                  </li>
                ))
              ) : (
                <li className="text-xs text-slate-500">No funding activity captured.</li>
              )}
            </ul>
          </div>
        </div>

        <div className="xl:col-span-2 rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-slate-900">Innovation pipeline</h3>
          <ul className="mt-3 space-y-3">
            {innovationInitiatives.length ? (
              innovationInitiatives.map((initiative) => {
                const tags = normaliseTagList(initiative.tags);
                return (
                  <li key={initiative.id} className="rounded-2xl border border-slate-200/60 bg-slate-50/60 px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{initiative.name}</p>
                        <p className="text-xs text-slate-500">
                          {titleCase(initiative.category ?? 'innovation')} · Stage {titleCase(initiative.stage ?? 'ideation')} · Priority {titleCase(initiative.priority ?? 'medium')}
                        </p>
                      </div>
                      <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-blue-600">
                        Score {formatNumber(initiative.priorityScore ?? 0)}
                      </span>
                    </div>
                    {initiative.summary ? <p className="mt-2 text-xs text-slate-500">{initiative.summary}</p> : null}
                    <p className="mt-2 text-xs text-slate-500">
                      ETA {initiative.eta ? formatAbsolute(initiative.eta) : 'TBC'} · Confidence {formatPercent(initiative.confidence ?? 0)} · ROI {formatCurrency(initiative.projectedRoi ?? 0, initiative.roiCurrency ?? financialSummary.currency)}
                    </p>
                    {tags.length ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {tags.map((tag) => (
                          <span key={tag} className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-500">
                            {titleCase(tag)}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </li>
                );
              })
            ) : (
              <li className="text-sm text-slate-500">No innovation initiatives captured. Add initiatives to track experiments and ROI.</li>
            )}
          </ul>
        </div>
      </div>
    </section>
  );

  const renderProjects = (
    <div className="rounded-3xl border border-blue-100 bg-white p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Active engagements</h2>
          <p className="text-sm text-slate-500">Top projects by recent activity</p>
        </div>
        <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium uppercase tracking-wide text-blue-700">
          {formatNumber(summary?.projects?.total ?? 0)} total
        </span>
      </div>
      <div className="mt-6 space-y-4">
        {(projects || []).slice(0, 6).map((project) => {
          const status = titleCase(project.status ?? 'unspecified');
          const queueStatus = project.autoAssignEnabled ? titleCase(project.autoAssignStatus ?? 'Queue ready') : 'Manual staffing';
          return (
            <div key={project.id} className="rounded-2xl border border-slate-200/60 bg-slate-50/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">{project.title}</p>
                  <p className="text-xs text-slate-500">
                    {status}
                    {project.budgetAmount != null
                      ? ` • ${formatCurrency(project.budgetAmount, project.budgetCurrency ?? financialSummary.currency)}`
                      : ''}
                  </p>
                </div>
                <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-blue-700">
                  {queueStatus}
                </span>
              </div>
            </div>
          );
        })}
        {!projects.length ? (
          <p className="text-sm text-slate-500">No projects found for this workspace.</p>
        ) : null}
      </div>
    </div>
  );

  const renderPipeline = (
    <div className="rounded-3xl border border-blue-100 bg-white p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Auto-assign pipeline</h2>
          <p className="text-sm text-slate-500">Candidate queue across active projects</p>
        </div>
        <UsersIcon className="h-6 w-6 text-blue-500" />
      </div>
      <dl className="mt-6 space-y-3">
        {Object.entries(pipeline.statuses || {}).map(([status, count]) => (
          <div key={status} className="flex items-center justify-between rounded-2xl border border-slate-200/60 bg-slate-50/60 px-4 py-3">
            <dt className="text-sm font-medium text-slate-600">{titleCase(status)}</dt>
            <dd className="text-base font-semibold text-slate-900">{formatNumber(count)}</dd>
          </div>
        ))}
        {!Object.keys(pipeline.statuses || {}).length ? (
          <p className="text-sm text-slate-500">No auto-assign activity captured for this period.</p>
        ) : null}
      </dl>
      {pipeline.topCandidates?.length ? (
        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Top candidates</p>
          <ul className="mt-3 space-y-3">
            {pipeline.topCandidates.map((candidate) => (
              <li key={candidate.freelancerId} className="flex items-center justify-between rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {candidate.freelancer
                      ? `${candidate.freelancer.firstName} ${candidate.freelancer.lastName}`
                      : `Freelancer ${candidate.freelancerId}`}
                  </p>
                  <p className="text-xs text-slate-500">Pending {formatNumber(candidate.pendingCount)} · Accepted {formatNumber(candidate.acceptedCount)}</p>
                </div>
                <span className="rounded-full border border-blue-200 bg-white px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-blue-700">
                  Score {candidate.topScore.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );

  const renderFinancials = (
    <div className="rounded-3xl border border-blue-100 bg-white p-6">
      <div className="flex items-center gap-3">
        <CurrencyDollarIcon className="h-6 w-6 text-blue-500" />
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Financial snapshot</h2>
          <p className="text-sm text-slate-500">Escrow and revenue analytics</p>
        </div>
      </div>
      <dl className="mt-6 space-y-4">
        <div className="rounded-2xl border border-slate-200/60 bg-slate-50/60 px-4 py-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">In escrow</dt>
          <dd className="mt-1 text-xl font-semibold text-slate-900">
            {formatCurrency(financialSummary.inEscrow ?? 0, financialSummary.currency)}
          </dd>
        </div>
        <div className="rounded-2xl border border-slate-200/60 bg-slate-50/60 px-4 py-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Released</dt>
          <dd className="mt-1 text-xl font-semibold text-slate-900">
            {formatCurrency(financialSummary.released ?? 0, financialSummary.currency)}
          </dd>
        </div>
        <div className="rounded-2xl border border-slate-200/60 bg-slate-50/60 px-4 py-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Outstanding</dt>
          <dd className="mt-1 text-xl font-semibold text-slate-900">
            {formatCurrency(financialSummary.outstanding ?? 0, financialSummary.currency)}
          </dd>
        </div>
      </dl>
    </div>
  );

  const renderBench = (
    <div className="rounded-3xl border border-blue-100 bg-white p-6">
      <div className="flex items-center gap-3">
        <UsersIcon className="h-6 w-6 text-blue-500" />
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Bench capacity</h2>
          <p className="text-sm text-slate-500">Talent available for immediate assignment</p>
        </div>
      </div>
      <ul className="mt-6 space-y-3">
        {benchMembers.map((member) => (
          <li key={member.id} className="flex items-center justify-between rounded-2xl border border-slate-200/60 bg-slate-50/60 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-slate-900">
                {member.user ? `${member.user.firstName} ${member.user.lastName}` : `Member ${member.userId}`}
              </p>
              <p className="text-xs text-slate-500">{titleCase(member.role ?? 'staff')} · {member.availability?.availableHoursPerWeek ? `${member.availability.availableHoursPerWeek}h available` : 'Capacity TBD'}</p>
            </div>
            <CheckCircleIcon className="h-5 w-5 text-emerald-500" />
          </li>
        ))}
        {!benchMembers.length ? (
          <p className="text-sm text-slate-500">No members on the bench right now.</p>
        ) : null}
      </ul>
    </div>
  );

  const renderNotes = (
    <div className="rounded-3xl border border-blue-100 bg-white p-6">
      <div className="flex items-center gap-3">
        <BuildingOffice2Icon className="h-6 w-6 text-blue-500" />
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Client relationship log</h2>
          <p className="text-sm text-slate-500">Recent collaboration notes and health signals</p>
        </div>
      </div>
      <ul className="mt-6 space-y-4">
        {contactNotes.slice(0, 4).map((note) => (
          <li key={note.id} className="rounded-2xl border border-slate-200/60 bg-slate-50/60 p-4">
            <p className="text-sm text-slate-700">{note.note}</p>
            <p className="mt-2 text-xs text-slate-500">
              {note.subject
                ? `${note.subject.firstName} ${note.subject.lastName}`
                : `Contact ${note.subjectUserId}`}
              {' · '}
              {formatRelativeTime(note.createdAt)}
            </p>
          </li>
        ))}
        {!contactNotes.length ? (
          <p className="text-sm text-slate-500">No notes recorded yet. Capture client updates to build institutional memory.</p>
        ) : null}
      </ul>
    </div>
  );

  const renderTimeline = (
    <div className="rounded-3xl border border-blue-100 bg-white p-6">
      <div className="flex items-center gap-3">
        <ArrowTrendingUpIcon className="h-6 w-6 text-blue-500" />
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Recent delivery activity</h2>
          <p className="text-sm text-slate-500">Milestones captured in the last 120 days</p>
        </div>
      </div>
      <ul className="mt-6 space-y-4">
        {projectEvents.slice(0, 6).map((event) => (
          <li key={event.id} className="rounded-2xl border border-slate-200/60 bg-slate-50/60 p-4">
            <p className="text-sm font-medium text-slate-900">{titleCase(event.eventType)}</p>
            {event.payload?.milestone ? (
              <p className="text-xs text-slate-500">{event.payload.milestone}</p>
            ) : null}
            <p className="mt-2 text-xs text-slate-500">
              {event.actor ? `${event.actor.firstName} ${event.actor.lastName}` : 'System'} · {formatAbsolute(event.createdAt)}
            </p>
          </li>
        ))}
        {!projectEvents.length ? (
          <p className="text-sm text-slate-500">No recent project activity recorded.</p>
        ) : null}
      </ul>
    </div>
  );

  const renderOpportunities = (
    <div className="rounded-3xl border border-blue-100 bg-white p-6">
      <div className="flex items-center gap-3">
        <QueueListIcon className="h-6 w-6 text-blue-500" />
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Marketplace pipeline</h2>
          <p className="text-sm text-slate-500">Latest gigs and roles surfaced for the agency</p>
        </div>
      </div>
      <div className="mt-6 space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Gigs</p>
          <ul className="mt-2 space-y-2">
            {gigs.slice(0, 3).map((gig) => (
              <li key={gig.id ?? gig.title} className="rounded-2xl border border-slate-200/60 bg-slate-50/60 px-4 py-3">
                <p className="text-sm font-medium text-slate-900">{gig.title}</p>
                <p className="text-xs text-slate-500">{gig.duration ?? 'Duration TBD'}{gig.budget ? ` • ${gig.budget}` : ''}</p>
              </li>
            ))}
            {!gigs.length ? <p className="text-sm text-slate-500">No gigs published yet.</p> : null}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Roles</p>
          <ul className="mt-2 space-y-2">
            {jobs.slice(0, 3).map((job) => (
              <li key={job.id ?? job.title} className="rounded-2xl border border-slate-200/60 bg-slate-50/60 px-4 py-3">
                <p className="text-sm font-medium text-slate-900">{job.title}</p>
                <p className="text-xs text-slate-500">{job.employmentType ?? 'Type TBD'}</p>
              </li>
            ))}
            {!jobs.length ? <p className="text-sm text-slate-500">No roles have been drafted.</p> : null}
          </ul>
        </div>
      </div>
    </div>
  );

  const renderContent = state.loading
    ? renderLoading
    : state.error
      ? renderError
      : (
          <div className="space-y-10">
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {summaryCards.map((card) => (
                <div key={card.name} className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.name}</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-900">{card.value}</p>
                      {card.description ? (
                        <p className="mt-1 text-xs text-slate-500">{card.description}</p>
                      ) : null}
                    </div>
                    {card.icon ? (
                      <span className="rounded-2xl bg-blue-50 p-3 text-blue-600">
                        <card.icon className="h-6 w-6" />
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </section>

            {renderExecutiveIntelligenceSection}
            {renderAnalyticsWarRoomSection}
            {renderScenarioExplorerSection}
            {renderGovernanceDeskSection}
            {renderLeadershipHubSection}
            {renderInnovationLabSection}

            <section className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">{renderProjects}</div>
              {renderPipeline}
            </section>

            <section className="grid gap-6 lg:grid-cols-3">
              {renderFinancials}
              {renderBench}
              {renderNotes}
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              {renderTimeline}
              {renderOpportunities}
            </section>
          </div>
        );

  return (
    <DashboardLayout
      currentDashboard="agency"
      title="Agency Command Studio"
      subtitle="Operations, talent, and growth"
      description="Purpose-built to help agencies orchestrate projects, talent, gigs, and marketing campaigns while staying ahead of analytics and governance."
      menuSections={menuSections}
      sections={capabilitySections}
      profile={profile}
      availableDashboards={DEFAULT_MEMBERSHIPS}
    >
      {renderContent}
    </DashboardLayout>
  );
}
