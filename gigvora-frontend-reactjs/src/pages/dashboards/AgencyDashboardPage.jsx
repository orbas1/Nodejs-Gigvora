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

  const benchMembers = members
    .filter((member) => member.availability?.status === 'available')
    .slice(0, 4);

  const operatingIntelligence = state.data?.operatingIntelligence ?? {};
  const portfolioInsights = operatingIntelligence.projectPortfolioMastery ?? {};
  const orchestratorInsights = operatingIntelligence.workspaceOrchestrator ?? {};
  const resourceIntelligenceInsights = operatingIntelligence.resourceIntelligence ?? {};
  const qualityInsights = operatingIntelligence.qualityAssurance ?? {};
  const financialOversightInsights = operatingIntelligence.financialOversight ?? {};

  const portfolioSummary = portfolioInsights.summary ?? {};
  const orchestratorSummary = orchestratorInsights.summary ?? {};
  const resourceSummary = resourceIntelligenceInsights.summary ?? {};
  const qualitySummary = qualityInsights.summary ?? {};
  const financialOversightSummary = financialOversightInsights.summary ?? {};

  const menuSections = useMemo(() => {
    const activeProjects = summary?.projects?.buckets?.active ?? summary?.projects?.total ?? 0;
    const utilization = summary?.members?.utilizationRate ?? 0;
    const pendingInvites = summary?.members?.pendingInvites ?? invites.length;

    const sections = [
      {
        label: 'Agency operations',
        items: [
          {
            name: 'Agency overview',
            description: `Utilization running at ${formatPercent(utilization)} with ${formatNumber(activeProjects)} active projects.`,
          },
          {
            name: 'Projects workspace',
            description: `${formatNumber(summary?.projects?.total ?? 0)} projects monitored · ${formatNumber(summary?.projects?.autoAssignQueueSize ?? 0)} candidates in queues.`,
            tags: ['projects'],
          },
          {
            name: 'Gig programs',
            description: `${formatNumber(gigs.length)} managed gigs and ${formatNumber(pipeline.statuses.accepted ?? 0)} accepted assignments this quarter.`,
          },
        ],
      },
      {
        label: 'Talent & HR',
        items: [
          {
            name: 'HR management',
            description: `${formatNumber(summary?.members?.total ?? members.length)} members · ${formatNumber(summary?.members?.bench ?? benchMembers.length)} on bench · ${formatNumber(pendingInvites)} invites open`,
          },
          {
            name: 'Capacity planning',
            description: `Average weekly capacity ${summary?.members?.averageWeeklyCapacity ? `${summary.members.averageWeeklyCapacity}h` : 'n/a'}.`,
          },
          {
            name: 'Internal marketplace',
            description: `${formatNumber(pipeline.statuses.pending ?? 0)} pending matches ready for review.`,
            tags: ['auto-assign'],
          },
        ],
      },
      {
        label: 'Growth & brand',
        items: [
          {
            name: 'Analytics & insights',
            description: `${formatCurrency(financialSummary.released ?? 0, financialSummary.currency)} released YTD.`,
          },
          {
            name: 'Marketing studio',
            description: `${formatNumber(summary?.clients?.active ?? contactNotes.length)} active client relationships tracked.`,
          },
          {
            name: 'Settings & governance',
            description: `Workspace ${workspace?.slug ?? 'n/a'} · ${state.data?.scope === 'workspace' ? 'Workspace filtered' : 'Global view'}.`,
          },
        ],
      },
    ];

    sections.push({
      label: 'Operating intelligence',
      items: [
        {
          name: 'Project portfolio mastery',
          description: `${formatNumber(portfolioSummary.totalProjects ?? 0)} projects · ${formatPercent(portfolioSummary.avgMargin ?? 0)} avg margin`,
          sectionId: 'project-portfolio-mastery',
        },
        {
          name: 'Workspace orchestrator',
          description: `${formatNumber(orchestratorSummary.totalBlueprints ?? 0)} blueprints · ${formatNumber(orchestratorSummary.automationGuardrails ?? 0)} guardrails`,
          sectionId: 'workspace-orchestrator',
        },
        {
          name: 'Resource intelligence',
          description: `${formatPercent(resourceSummary.averageUtilization ?? 0)} utilization · ${formatNumber(resourceSummary.totalScenarioPlans ?? 0)} scenarios`,
          sectionId: 'resource-intelligence',
        },
        {
          name: 'Quality assurance workflow',
          description: `${formatNumber(qualitySummary.completedReviews ?? 0)} reviews · QA ${formatPercent(qualitySummary.averageQaScore ?? 0)}`,
          sectionId: 'quality-assurance',
        },
        {
          name: 'Financial oversight',
          description: `${formatNumber(financialOversightSummary.totalEngagements ?? 0)} engagements · ${formatNumber(financialOversightSummary.alerts ?? 0)} alerts`,
          sectionId: 'financial-oversight',
        },
      ],
    });

    return sections;
  }, [
    summary,
    invites.length,
    benchMembers.length,
    gigs.length,
    contactNotes.length,
    workspace?.slug,
    state.data?.scope,
    portfolioSummary,
    orchestratorSummary,
    resourceSummary,
    qualitySummary,
    financialOversightSummary,
  ]);

  const portfolioSummaryCards = [
    {
      name: 'Active projects',
      value: formatNumber(portfolioSummary.totalProjects ?? 0),
      description: `${formatNumber(portfolioSummary.onTrack ?? 0)} on track`,
      tone: 'emerald',
    },
    {
      name: 'Projects at risk',
      value: formatNumber(portfolioSummary.atRisk ?? 0),
      description: `${formatNumber(portfolioSummary.critical ?? 0)} critical`,
      tone: 'amber',
    },
    {
      name: 'Average margin',
      value: formatPercent(portfolioSummary.avgMargin ?? 0),
      description: `Quality ${formatPercent(portfolioSummary.avgQualityScore ?? 0)}`,
      tone: 'sky',
    },
    {
      name: 'Automation coverage',
      value: formatPercent(portfolioSummary.avgAutomationCoverage ?? 0),
      description: 'Across monitored portfolio',
      tone: 'violet',
    },
  ];

  const orchestratorStats = [
    {
      name: 'Active blueprints',
      value: formatNumber(orchestratorSummary.activeBlueprints ?? 0),
      description: `${formatNumber(orchestratorSummary.totalBlueprints ?? 0)} total`,
    },
    {
      name: 'Average cadence',
      value: orchestratorSummary.averageCadenceDays != null
        ? `${formatNumber(Math.round((orchestratorSummary.averageCadenceDays + Number.EPSILON) * 10) / 10)} days`
        : 'n/a',
      description: 'Cadence between blueprint runs',
    },
    {
      name: 'Automation guardrails',
      value: formatNumber(orchestratorSummary.automationGuardrails ?? 0),
      description: 'Workspace automation policies',
    },
  ];

  const resourceStats = [
    {
      name: 'Average utilization',
      value: formatPercent(resourceSummary.averageUtilization ?? 0),
      description: `${formatNumber(resourceSummary.totalSkillGroups ?? 0)} skill groups`,
    },
    {
      name: 'Bench hours',
      value: `${formatNumber(Math.round(resourceSummary.benchHours ?? 0))}h`,
      description: 'Available capacity',
    },
    {
      name: 'Scenario plans',
      value: formatNumber(resourceSummary.totalScenarioPlans ?? 0),
      description: `${formatNumber(resourceSummary.totalMembers ?? members.length)} members`,
    },
  ];

  const qualityStats = [
    {
      name: 'Completed reviews',
      value: formatNumber(qualitySummary.completedReviews ?? 0),
      description: `${formatNumber(qualitySummary.totalReviews ?? 0)} total reviews`,
    },
    {
      name: 'Avg QA score',
      value: formatPercent(qualitySummary.averageQaScore ?? 0),
      description: `Client CSAT ${formatPercent(qualitySummary.averageClientSatisfaction ?? 0)}`,
    },
  ];

  const financialStats = [
    {
      name: 'Engagements monitored',
      value: formatNumber(financialOversightSummary.totalEngagements ?? 0),
      description: `${formatNumber(financialOversightSummary.alerts ?? 0)} alerts`,
    },
  ];

  const portfolioProjects = portfolioInsights.projects ?? [];
  const portfolioDependencies = portfolioInsights.dependencies ?? [];
  const portfolioCalendar = portfolioInsights.calendar ?? [];

  const orchestratorBlueprints = orchestratorInsights.blueprints ?? [];
  const orchestratorCadences = orchestratorInsights.cadences ?? [];
  const orchestratorGuardrails = orchestratorInsights.automationGuardrails ?? [];
  const orchestratorDashboards = orchestratorInsights.clientDashboards ?? [];
  const orchestratorNotes = orchestratorInsights.latestNotes ?? [];

  const resourceHeatmap = resourceIntelligenceInsights.heatmap ?? [];
  const assignmentMatches = resourceIntelligenceInsights.assignmentMatches ?? [];
  const scenarioPlans = resourceIntelligenceInsights.scenarioPlans ?? [];

  const qualityUpcoming = qualityInsights.upcoming ?? [];
  const qualityScorecards = qualityInsights.scorecards ?? [];
  const qualityLessons = qualityInsights.lessonsLearned ?? [];
  const qualityIncentives = qualityInsights.incentives ?? [];

  const financialEngagements = financialOversightInsights.engagements ?? [];
  const financialAlerts = financialOversightInsights.alerts ?? [];
  const financialEscrow = financialOversightInsights.escrow ?? [];
  const financialCurrencies = financialOversightSummary.currencies ?? [];

  const toneClasses = {
    emerald: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    amber: 'border-amber-100 bg-amber-50 text-amber-700',
    sky: 'border-sky-100 bg-sky-50 text-sky-700',
    violet: 'border-violet-100 bg-violet-50 text-violet-700',
  };

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

  const renderProjectPortfolio = (
    <section
      id="project-portfolio-mastery"
      className="space-y-6 rounded-3xl border border-blue-100 bg-white p-6"
    >
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">Project portfolio mastery</p>
          <h2 className="text-xl font-semibold text-slate-900">Operational visibility across every engagement</h2>
          <p className="mt-1 text-sm text-slate-500">
            Run complex client programs with live signals on scope, staffing, profitability, and automation coverage.
          </p>
        </div>
        <span className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-4 py-1 text-xs font-medium uppercase tracking-wide text-blue-700">
          {formatNumber(portfolioSummary.totalProjects ?? 0)} projects monitored
        </span>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {portfolioSummaryCards.map((card) => (
          <div
            key={card.name}
            className={`rounded-3xl border px-4 py-5 ${toneClasses[card.tone] ?? 'border-blue-100 bg-blue-50/60 text-blue-700'}`}
          >
            <p className="text-xs font-semibold uppercase tracking-wide">{card.name}</p>
            <p className="mt-2 text-2xl font-semibold">{card.value}</p>
            {card.description ? (
              <p className="mt-1 text-xs text-blue-900/70">{card.description}</p>
            ) : null}
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-3xl border border-slate-200/60 bg-slate-50/60 p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Portfolio health</h3>
              <p className="text-xs text-slate-500">Staffing, quality, and margin signals by project</p>
            </div>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
              {formatNumber(portfolioProjects.length)} tracked
            </span>
          </div>
          <ul className="space-y-3">
            {portfolioProjects.slice(0, 6).map((project) => (
              <li key={project.id} className="rounded-2xl border border-white bg-white px-4 py-3 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{project.title}</p>
                    <p className="text-xs text-slate-500">
                      Scope {titleCase(project.scopeHealth ?? 'unknown')} · Staffing {titleCase(project.staffingStatus ?? 'unknown')} · Profitability {titleCase(project.profitabilityStatus ?? 'unknown')}
                    </p>
                  </div>
                  <span className="rounded-full border border-blue-100 bg-blue-50 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-blue-700">
                    {titleCase(project.status ?? 'unspecified')}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span>Margin {project.marginPercent != null ? formatPercent(project.marginPercent) : 'n/a'}</span>
                  <span>QA {project.qualityScore != null ? `${Math.round(project.qualityScore * 10) / 10}` : 'n/a'}</span>
                  <span>Automation {project.automationCoverage != null ? formatPercent(project.automationCoverage) : 'n/a'}</span>
                  <span>Issues {formatNumber(project.issuesOpen ?? 0)}</span>
                </div>
              </li>
            ))}
            {!portfolioProjects.length ? (
              <li className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
                No project snapshots captured yet.
              </li>
            ) : null}
          </ul>
        </div>
        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Dependency map</h3>
                <p className="text-xs text-slate-500">Critical links across the delivery portfolio</p>
              </div>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                {formatNumber(portfolioDependencies.length)} dependencies
              </span>
            </div>
            <ul className="mt-4 space-y-3">
              {portfolioDependencies.slice(0, 6).map((dependency) => (
                <li key={dependency.id} className="rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-900">{dependency.projectTitle}</p>
                  <p className="text-xs text-slate-600">
                    Depends on {dependency.dependentProjectTitle} · {titleCase(dependency.dependencyType ?? 'dependency')}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wide">
                    <span className="rounded-full border border-slate-200 bg-white px-2 py-1 text-slate-600">
                      {titleCase(dependency.status ?? 'open')}
                    </span>
                    <span className={`rounded-full px-2 py-1 ${String(dependency.riskLevel ?? '').toLowerCase() === 'critical' ? 'border border-red-200 bg-red-50 text-red-600' : 'border border-amber-200 bg-amber-50 text-amber-600'}`}>
                      Risk {titleCase(dependency.riskLevel ?? 'moderate')}
                    </span>
                    {dependency.isCritical ? (
                      <span className="rounded-full border border-red-200 bg-red-50 px-2 py-1 text-red-600">Critical path</span>
                    ) : null}
                    {dependency.leadTimeDays != null ? (
                      <span className="rounded-full border border-slate-200 bg-white px-2 py-1 text-slate-600">
                        Lead {formatNumber(dependency.leadTimeDays)}d
                      </span>
                    ) : null}
                  </div>
                  {dependency.notes ? <p className="mt-2 text-xs text-slate-500">{dependency.notes}</p> : null}
                </li>
              ))}
              {!portfolioDependencies.length ? (
                <li className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                  No dependency links configured.
                </li>
              ) : null}
            </ul>
          </div>
          <div className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">Delivery calendar</h3>
            <p className="text-xs text-slate-500">Milestones and reviews across the last 120 days</p>
            <ul className="mt-4 space-y-3">
              {portfolioCalendar.slice(0, 6).map((entry) => (
                <li key={entry.id} className="rounded-2xl border border-slate-200/60 bg-slate-50/80 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-900">{titleCase(entry.eventType ?? 'event')}</p>
                  <p className="text-xs text-slate-500">{entry.projectTitle}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatAbsolute(entry.occurredAt)}</p>
                  {entry.description ? <p className="mt-1 text-xs text-slate-500">{entry.description}</p> : null}
                </li>
              ))}
              {!portfolioCalendar.length ? (
                <li className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                  No recent milestones captured.
                </li>
              ) : null}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );

  const renderWorkspaceOrchestrator = (
    <section
      id="workspace-orchestrator"
      className="space-y-6 rounded-3xl border border-blue-100 bg-white p-6"
    >
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">Workspace orchestrator</p>
          <h2 className="text-xl font-semibold text-slate-900">Launch structured client workspaces in seconds</h2>
          <p className="mt-1 text-sm text-slate-500">
            Standardise briefs, SOWs, cadences, and automation guardrails across your operating system.
          </p>
        </div>
        <span className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-4 py-1 text-xs font-medium uppercase tracking-wide text-blue-700">
          {formatNumber(orchestratorSummary.totalBlueprints ?? 0)} blueprints
        </span>
      </header>
      <div className="grid gap-4 sm:grid-cols-3">
        {orchestratorStats.map((stat) => (
          <div key={stat.name} className="rounded-3xl border border-slate-200/60 bg-slate-50/60 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{stat.name}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{stat.value}</p>
            {stat.description ? <p className="mt-1 text-xs text-slate-500">{stat.description}</p> : null}
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">Blueprint library</h3>
          <p className="text-xs text-slate-500">Automation-ready workspace templates per client</p>
          <ul className="space-y-3">
            {orchestratorBlueprints.slice(0, 6).map((blueprint) => (
              <li key={blueprint.id} className="rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{blueprint.name}</p>
                    <p className="text-xs text-slate-500">
                      {blueprint.clientName ? `${blueprint.clientName} · ` : ''}
                      {titleCase(blueprint.status ?? 'draft')}
                    </p>
                  </div>
                  <span className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                    Guardrails {formatNumber(blueprint.guardrailCount ?? 0)}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  {blueprint.deliveryCadence ? <span>{titleCase(blueprint.deliveryCadence)}</span> : null}
                  {blueprint.cadenceCycleDays ? <span>{formatNumber(blueprint.cadenceCycleDays)} day cycle</span> : null}
                  {blueprint.lastRunAt ? <span>Last run {formatRelativeTime(blueprint.lastRunAt)}</span> : null}
                  {blueprint.nextRunAt ? <span>Next {formatRelativeTime(blueprint.nextRunAt)}</span> : null}
                  {blueprint.checklistCount ? <span>{formatNumber(blueprint.checklistCount)} kickoff steps</span> : null}
                </div>
              </li>
            ))}
            {!orchestratorBlueprints.length ? (
              <li className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                No workspace blueprints have been published.
              </li>
            ) : null}
          </ul>
        </div>
        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">Delivery cadences</h3>
            <p className="text-xs text-slate-500">Structured rhythms that keep engagements on pace</p>
            <ul className="mt-4 space-y-3">
              {orchestratorCadences.slice(0, 6).map((cadence) => (
                <li key={cadence.blueprintId} className="rounded-2xl border border-slate-200/60 bg-slate-50/80 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-900">{cadence.blueprintName}</p>
                  <p className="text-xs text-slate-500">{cadence.cadence}</p>
                  {cadence.nextRunAt ? <p className="mt-1 text-xs text-slate-500">Next run {formatRelativeTime(cadence.nextRunAt)}</p> : null}
                </li>
              ))}
              {!orchestratorCadences.length ? (
                <li className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                  No cadences configured yet.
                </li>
              ) : null}
            </ul>
          </div>
          <div className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">Automation guardrails</h3>
            <p className="text-xs text-slate-500">Policies, approvals, and QA steps embedded in delivery</p>
            <ul className="mt-4 space-y-3">
              {orchestratorGuardrails.slice(0, 5).map((guardrail) => (
                <li key={guardrail.blueprintId} className="rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-900">{guardrail.blueprintName}</p>
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-600">
                    {guardrail.guardrails.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </li>
              ))}
              {!orchestratorGuardrails.length ? (
                <li className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                  No automation guardrails documented.
                </li>
              ) : null}
            </ul>
          </div>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">Client dashboards</h3>
          <p className="text-xs text-slate-500">Branded experiences and recent touchpoints</p>
          <ul className="mt-4 space-y-3">
            {orchestratorDashboards.slice(0, 6).map((dashboard) => (
              <li key={dashboard.blueprintId} className="rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-3">
                <p className="text-sm font-semibold text-slate-900">{dashboard.clientName}</p>
                <p className="text-xs text-slate-500">Status {titleCase(dashboard.status ?? 'active')}</p>
                {dashboard.experienceSummary ? <p className="mt-1 text-xs text-slate-500">{dashboard.experienceSummary}</p> : null}
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                  {dashboard.lastTouchpointAt ? <span className="rounded-full border border-slate-200 bg-white px-2 py-1">Last touch {formatRelativeTime(dashboard.lastTouchpointAt)}</span> : null}
                  {dashboard.nextRunAt ? <span className="rounded-full border border-slate-200 bg-white px-2 py-1">Next cadence {formatRelativeTime(dashboard.nextRunAt)}</span> : null}
                  {dashboard.brandTheme ? <span className="rounded-full border border-slate-200 bg-white px-2 py-1">{titleCase(dashboard.brandTheme)}</span> : null}
                </div>
              </li>
            ))}
            {!orchestratorDashboards.length ? (
              <li className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                No client-specific dashboards generated.
              </li>
            ) : null}
          </ul>
        </div>
        <div className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">Latest orchestration notes</h3>
          <p className="text-xs text-slate-500">Capture decision logs and governance updates</p>
          <ul className="mt-4 space-y-3">
            {orchestratorNotes.slice(0, 6).map((note) => (
              <li key={note.id} className="rounded-2xl border border-slate-200/60 bg-slate-50/60 px-4 py-3">
                <p className="text-sm text-slate-700">{note.note}</p>
                <p className="mt-2 text-xs text-slate-500">Logged {formatRelativeTime(note.createdAt)}</p>
              </li>
            ))}
            {!orchestratorNotes.length ? (
              <li className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                No orchestration notes recorded.
              </li>
            ) : null}
          </ul>
        </div>
      </div>
    </section>
  );

  const renderResourceIntelligence = (
    <section
      id="resource-intelligence"
      className="space-y-6 rounded-3xl border border-blue-100 bg-white p-6"
    >
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">Resource intelligence</p>
          <h2 className="text-xl font-semibold text-slate-900">Match assignments to skill, availability, and cost</h2>
          <p className="mt-1 text-sm text-slate-500">
            Heatmaps and scenario plans keep utilisation balanced while protecting against burnout.
          </p>
        </div>
        <span className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-4 py-1 text-xs font-medium uppercase tracking-wide text-blue-700">
          {formatPercent(resourceSummary.averageUtilization ?? 0)} avg utilisation
        </span>
      </header>
      <div className="grid gap-4 sm:grid-cols-3">
        {resourceStats.map((stat) => (
          <div key={stat.name} className="rounded-3xl border border-slate-200/60 bg-slate-50/60 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{stat.name}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{stat.value}</p>
            {stat.description ? <p className="mt-1 text-xs text-slate-500">{stat.description}</p> : null}
          </div>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">Capacity heatmap</h3>
          <p className="text-xs text-slate-500">Utilisation and burnout risk by skill group</p>
          <ul className="mt-4 space-y-3">
            {resourceHeatmap.slice(0, 8).map((entry) => (
              <li key={entry.skillGroup} className="rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{entry.skillGroup}</p>
                    <p className="text-xs text-slate-500">{formatNumber(entry.availableHours ?? 0)}h available · {formatNumber(entry.assignedHours ?? 0)}h assigned</p>
                  </div>
                  <span className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                    Utilisation {entry.utilizationRate != null ? formatPercent(entry.utilizationRate) : 'n/a'}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span>Bench {formatNumber(entry.benchHours ?? 0)}h</span>
                  {entry.burnoutRisk ? <span>Risk {titleCase(entry.burnoutRisk)}</span> : null}
                  {entry.billableRate != null ? <span>Billable {formatCurrency(entry.billableRate)}</span> : null}
                  {entry.costRate != null ? <span>Cost {formatCurrency(entry.costRate)}</span> : null}
                  {entry.notes ? <span>{entry.notes}</span> : null}
                </div>
              </li>
            ))}
            {!resourceHeatmap.length ? (
              <li className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                No capacity snapshots captured.
              </li>
            ) : null}
          </ul>
        </div>
        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">Assignment intelligence</h3>
            <p className="text-xs text-slate-500">Recommendations based on workload and risk</p>
            <ul className="mt-4 space-y-3">
              {assignmentMatches.slice(0, 6).map((match, index) => (
                <li key={`${match.skillGroup}-${index}`} className="rounded-2xl border border-slate-200/60 bg-slate-50/80 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-900">{match.skillGroup}</p>
                  <p className="text-xs text-slate-500">
                    {formatNumber(match.availableHours ?? 0)}h available · {formatNumber(match.assignedHours ?? 0)}h assigned · Utilisation {match.utilizationRate != null ? formatPercent(match.utilizationRate) : 'n/a'}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{match.recommendation}</p>
                </li>
              ))}
              {!assignmentMatches.length ? (
                <li className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                  No assignment insights generated.
                </li>
              ) : null}
            </ul>
          </div>
          <div className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">Scenario planning</h3>
            <p className="text-xs text-slate-500">Stress-test staffing plans for upcoming pitches or renewals</p>
            <ul className="mt-4 space-y-3">
              {scenarioPlans.slice(0, 5).map((plan) => (
                <li key={plan.id} className="rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-900">{plan.title}</p>
                  <p className="text-xs text-slate-500">
                    {titleCase(plan.scenarioType ?? 'scenario')} · {titleCase(plan.status ?? 'draft')}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    {plan.window?.startDate ? <span>Start {formatAbsolute(plan.window.startDate)}</span> : null}
                    {plan.window?.endDate ? <span>End {formatAbsolute(plan.window.endDate)}</span> : null}
                    {plan.projectedRevenue != null ? <span>Revenue {formatCurrency(plan.projectedRevenue)}</span> : null}
                    {plan.projectedCost != null ? <span>Cost {formatCurrency(plan.projectedCost)}</span> : null}
                    {plan.projectedMargin != null ? <span>Margin {formatPercent(plan.projectedMargin)}</span> : null}
                  </div>
                  {plan.notes ? <p className="mt-2 text-xs text-slate-500">{plan.notes}</p> : null}
                </li>
              ))}
              {!scenarioPlans.length ? (
                <li className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                  No scenario plans drafted yet.
                </li>
              ) : null}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );

  const renderQualityAssurance = (
    <section
      id="quality-assurance"
      className="space-y-6 rounded-3xl border border-blue-100 bg-white p-6"
    >
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">Quality assurance workflow</p>
          <h2 className="text-xl font-semibold text-slate-900">Embed QA scorecards and retros in every project</h2>
          <p className="mt-1 text-sm text-slate-500">
            Operationalise pre-delivery reviews, CSAT tracking, and lessons learned to drive performance.
          </p>
        </div>
        <span className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-4 py-1 text-xs font-medium uppercase tracking-wide text-blue-700">
          {formatNumber(qualitySummary.completedReviews ?? 0)} reviews completed
        </span>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        {qualityStats.map((stat) => (
          <div key={stat.name} className="rounded-3xl border border-slate-200/60 bg-slate-50/60 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{stat.name}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{stat.value}</p>
            {stat.description ? <p className="mt-1 text-xs text-slate-500">{stat.description}</p> : null}
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">Upcoming QA checkpoints</h3>
          <p className="text-xs text-slate-500">Scheduled reviews before delivery hand-offs</p>
          <ul className="mt-4 space-y-3">
            {qualityUpcoming.slice(0, 6).map((item) => (
              <li key={item.id} className="rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-3">
                <p className="text-sm font-semibold text-slate-900">{item.projectTitle}</p>
                <p className="text-xs text-slate-500">{titleCase(item.reviewType ?? 'qa')} · {titleCase(item.status ?? 'scheduled')}</p>
                {item.reviewDate ? <p className="mt-1 text-xs text-slate-500">Review {formatAbsolute(item.reviewDate)}</p> : null}
                {item.reviewer ? (
                  <p className="mt-1 text-xs text-slate-500">
                    Reviewer {item.reviewer.firstName} {item.reviewer.lastName}
                  </p>
                ) : null}
                {item.automationCoverage != null ? (
                  <p className="mt-1 text-xs text-slate-500">Automation {formatPercent(item.automationCoverage)}</p>
                ) : null}
              </li>
            ))}
            {!qualityUpcoming.length ? (
              <li className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                No upcoming QA checkpoints scheduled.
              </li>
            ) : null}
          </ul>
        </div>
        <div className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">QA scorecards</h3>
          <p className="text-xs text-slate-500">Quality, CSAT, and follow-up actions by project</p>
          <ul className="mt-4 space-y-3">
            {qualityScorecards.slice(0, 6).map((card) => (
              <li key={card.id} className="rounded-2xl border border-slate-200/60 bg-slate-50/80 px-4 py-3">
                <p className="text-sm font-semibold text-slate-900">{card.projectTitle}</p>
                <p className="text-xs text-slate-500">
                  {titleCase(card.reviewType ?? 'review')} · {titleCase(card.status ?? 'completed')}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  {card.qaScore != null ? <span>QA {Math.round(card.qaScore * 10) / 10}</span> : null}
                  {card.clientSatisfaction != null ? <span>CSAT {Math.round(card.clientSatisfaction * 10) / 10}</span> : null}
                  <span>Lessons {formatNumber(card.lessonsLearnedCount ?? 0)}</span>
                  <span>Follow-ups {formatNumber(card.followUpActionsCount ?? 0)}</span>
                </div>
              </li>
            ))}
            {!qualityScorecards.length ? (
              <li className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                No QA scorecards have been recorded.
              </li>
            ) : null}
          </ul>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">Lessons learned</h3>
          <p className="text-xs text-slate-500">Auto-generated insights synced to knowledge bases</p>
          <ul className="mt-4 space-y-3">
            {qualityLessons.slice(0, 6).map((lesson, index) => (
              <li key={`${lesson.reviewId}-${index}`} className="rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-3">
                <p className="text-sm font-semibold text-slate-900">{lesson.projectTitle}</p>
                {lesson.category ? <p className="text-xs text-slate-500">{titleCase(lesson.category)}</p> : null}
                <p className="mt-1 text-xs text-slate-500">{lesson.lesson ?? 'Lesson summary unavailable.'}</p>
              </li>
            ))}
            {!qualityLessons.length ? (
              <li className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                No retrospectives documented.
              </li>
            ) : null}
          </ul>
        </div>
        <div className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">Performance incentives</h3>
          <p className="text-xs text-slate-500">Link QA outcomes to recognition and rewards</p>
          <ul className="mt-4 space-y-3">
            {qualityIncentives.slice(0, 6).map((incentive, index) => (
              <li key={`${incentive.reviewId}-${index}`} className="rounded-2xl border border-slate-200/60 bg-slate-50/80 px-4 py-3">
                <p className="text-sm font-semibold text-slate-900">{incentive.title}</p>
                {incentive.owner ? <p className="text-xs text-slate-500">Owner {incentive.owner}</p> : null}
                {incentive.dueDate ? <p className="mt-1 text-xs text-slate-500">Due {formatAbsolute(incentive.dueDate)}</p> : null}
              </li>
            ))}
            {!qualityIncentives.length ? (
              <li className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                No incentive actions opened yet.
              </li>
            ) : null}
          </ul>
        </div>
      </div>
    </section>
  );

  const renderFinancialOversight = (
    <section
      id="financial-oversight"
      className="space-y-6 rounded-3xl border border-blue-100 bg-white p-6"
    >
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">Financial oversight</p>
          <h2 className="text-xl font-semibold text-slate-900">Stay ahead of budget, billing, and compliance</h2>
          <p className="mt-1 text-sm text-slate-500">
            Monitor profitability, change orders, and invoicing policies across every client engagement.
          </p>
        </div>
        <span className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-4 py-1 text-xs font-medium uppercase tracking-wide text-blue-700">
          {formatNumber(financialOversightSummary.totalEngagements ?? 0)} engagements
        </span>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {financialStats.map((stat) => (
          <div key={stat.name} className="rounded-3xl border border-slate-200/60 bg-slate-50/60 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{stat.name}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{stat.value}</p>
            {stat.description ? <p className="mt-1 text-xs text-slate-500">{stat.description}</p> : null}
          </div>
        ))}
        <div className="rounded-3xl border border-slate-200/60 bg-slate-50/60 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Alerts</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{formatNumber(financialAlerts.length)}</p>
          <p className="mt-1 text-xs text-slate-500">Margin erosion, overdue invoices, and compliance</p>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">Financial posture by currency</h3>
          <p className="text-xs text-slate-500">Budgets, spend, and change orders per market</p>
          <ul className="mt-4 space-y-3">
            {financialCurrencies.slice(0, 6).map((currency) => (
              <li key={currency.currency} className="rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">{currency.currency}</p>
                  <span className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                    {formatNumber(currency.engagements ?? 0)} engagements
                  </span>
                </div>
                <div className="mt-2 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
                  <span>Budget {formatCurrency(currency.budgetAmount ?? 0, currency.currency)}</span>
                  <span>Actual {formatCurrency(currency.actualSpend ?? 0, currency.currency)}</span>
                  <span>Invoiced {formatCurrency(currency.invoicedAmount ?? 0, currency.currency)}</span>
                  <span>Outstanding {formatCurrency(currency.outstandingAmount ?? 0, currency.currency)}</span>
                  <span>Change orders {formatNumber(currency.changeOrders ?? 0)}</span>
                </div>
              </li>
            ))}
            {!financialCurrencies.length ? (
              <li className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                No financial summaries recorded.
              </li>
            ) : null}
          </ul>
        </div>
        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">Escrow position</h3>
            <p className="text-xs text-slate-500">Multi-currency tracking of funds in motion</p>
            <ul className="mt-4 space-y-3">
              {financialEscrow.slice(0, 6).map((entry, index) => (
                <li key={`${entry.currency}-${index}`} className="rounded-2xl border border-slate-200/60 bg-slate-50/80 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-900">{entry.currency}</p>
                  <p className="text-xs text-slate-500">In escrow {formatCurrency(entry.inEscrow ?? 0, entry.currency)}</p>
                  <p className="text-xs text-slate-500">Released {formatCurrency(entry.released ?? 0, entry.currency)}</p>
                </li>
              ))}
              {!financialEscrow.length ? (
                <li className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                  No escrow transactions recorded.
                </li>
              ) : null}
            </ul>
          </div>
          <div className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">Alerts & governance</h3>
            <p className="text-xs text-slate-500">Stay ahead of risk on billing and profitability</p>
            <ul className="mt-4 space-y-3">
              {financialAlerts.slice(0, 6).map((alert, index) => (
                <li key={`${alert.engagementId}-${index}`} className="rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-900">{titleCase(alert.type ?? 'alert')}</p>
                  <p className="text-xs text-slate-500">{alert.message}</p>
                  <p className="mt-1 text-xs text-slate-500">Severity {titleCase(alert.severity ?? 'warning')}</p>
                </li>
              ))}
              {!financialAlerts.length ? (
                <li className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                  No financial alerts triggered.
                </li>
              ) : null}
            </ul>
          </div>
        </div>
      </div>
      <div className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">Engagement ledger</h3>
        <p className="text-xs text-slate-500">Budgets, invoices, and profitability per client</p>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Client</th>
                <th scope="col" className="px-4 py-3 font-semibold">Policy</th>
                <th scope="col" className="px-4 py-3 font-semibold">Budget</th>
                <th scope="col" className="px-4 py-3 font-semibold">Actual</th>
                <th scope="col" className="px-4 py-3 font-semibold">Outstanding</th>
                <th scope="col" className="px-4 py-3 font-semibold">Margin</th>
                <th scope="col" className="px-4 py-3 font-semibold">Compliance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {financialEngagements.slice(0, 8).map((engagement) => (
                <tr key={engagement.id} className="bg-white">
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-slate-900">{engagement.clientName}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs">{engagement.policyName}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {formatCurrency(engagement.budgetAmount ?? 0, engagement.billingCurrency)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {formatCurrency(engagement.actualSpend ?? 0, engagement.billingCurrency)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {formatCurrency(engagement.outstandingAmount ?? 0, engagement.billingCurrency)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {engagement.marginPercent != null ? formatPercent(engagement.marginPercent) : 'n/a'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {titleCase(engagement.complianceStatus ?? 'on_track')}
                  </td>
                </tr>
              ))}
              {!financialEngagements.length ? (
                <tr>
                  <td colSpan="7" className="px-4 py-6 text-center text-sm text-slate-500">
                    No financial engagement summaries recorded.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </section>
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

            {renderProjectPortfolio}
            {renderWorkspaceOrchestrator}
            {renderResourceIntelligence}
            {renderQualityAssurance}
            {renderFinancialOversight}
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
