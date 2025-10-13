import { useEffect, useMemo, useState } from 'react';
import {
  ArrowTrendingUpIcon,
  BriefcaseIcon,
  BuildingOffice2Icon,
  CheckCircleIcon,
  ClipboardDocumentCheckIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  HeartIcon,
  MegaphoneIcon,
  QueueListIcon,
  SparklesIcon,
  UserGroupIcon,
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

function formatScore(value, decimals = 1) {
  if (value == null || Number.isNaN(Number(value))) {
    return (0).toFixed(decimals);
  }
  return Number(value).toFixed(decimals);
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
  const talentLifecycle = state.data?.talentLifecycle ?? {};
  const talentLifecycleSummary = talentLifecycle.summary ?? {};
  const talentCrm = talentLifecycle.crm ?? {};
  const peopleOps = talentLifecycle.peopleOps ?? {};
  const talentOpportunityBoard = talentLifecycle.opportunityBoard ?? {};
  const brandingStudio = talentLifecycle.branding ?? {};
  const hrManagement = talentLifecycle.hrManagement ?? {};
  const capacityPlanning = talentLifecycle.capacityPlanning ?? {};
  const internalMarketplace = talentLifecycle.internalMarketplace ?? {};

  const benchMembers = members
    .filter((member) => member.availability?.status === 'available')
    .slice(0, 4);

  const menuSections = useMemo(() => {
    const activeProjects = summary?.projects?.buckets?.active ?? summary?.projects?.total ?? 0;
    const utilization = summary?.members?.utilizationRate ?? 0;
    const pendingInvites = summary?.members?.pendingInvites ?? invites.length;
    const conversionRate = talentLifecycleSummary?.conversionRate ?? talentCrm?.conversionRate ?? 0;
    const openInternalOpportunities = talentOpportunityBoard?.summary?.open ?? 0;
    const averageMatchScore = talentOpportunityBoard?.summary?.averageMatchScore ?? 0;
    const brandingReach = brandingStudio?.metrics?.totals?.reach ?? 0;
    const benchCapacityHours = Number.isFinite(Number(capacityPlanning?.benchCapacityHours))
      ? Math.round(Number(capacityPlanning.benchCapacityHours))
      : 0;
    const utilisationRate = capacityPlanning?.utilizationRate ?? utilization;
    return [
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
        label: 'Talent lifecycle & HR excellence',
        items: [
          {
            name: 'Talent CRM',
            description: `${formatNumber(talentCrm?.totals?.candidates ?? 0)} candidates • ${formatPercent(conversionRate)} conversion`,
            tags: ['talent_crm'],
          },
          {
            name: 'People ops hub',
            description: `${formatNumber(peopleOps?.policies?.active ?? 0)} active policies • ${formatPercent(peopleOps?.policies?.acknowledgementRate ?? 0)} acknowledgement`,
            tags: ['people_ops'],
          },
          {
            name: 'Internal opportunity board',
            description: `${formatNumber(openInternalOpportunities)} open opportunities • Avg match ${formatScore(averageMatchScore)}`,
            tags: ['opportunity_board'],
          },
          {
            name: 'Agency member branding',
            description: `${formatNumber(brandingStudio?.totals?.published ?? 0)} published assets • ${formatNumber(brandingReach)} reach`,
            tags: ['branding'],
          },
          {
            name: 'HR management',
            description: `${formatNumber(hrManagement?.activeHeadcount ?? summary?.members?.total ?? members.length)} headcount • ${formatNumber(hrManagement?.complianceOutstanding ?? 0)} compliance tasks open`,
          },
          {
            name: 'Capacity planning',
            description: `${benchCapacityHours} bench hours • Utilisation ${formatPercent(utilisationRate)}`,
          },
          {
            name: 'Internal marketplace',
            description: `${formatNumber(internalMarketplace?.openOpportunities ?? 0)} open matches • ${formatNumber(internalMarketplace?.benchAvailable ?? benchMembers.length)} bench ready`,
            tags: ['marketplace'],
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
  }, [
    summary,
    invites.length,
    benchMembers.length,
    gigs.length,
    contactNotes.length,
    workspace?.slug,
    state.data?.scope,
    talentLifecycleSummary,
    talentCrm,
    peopleOps,
    talentOpportunityBoard,
    brandingStudio,
    hrManagement,
    capacityPlanning,
    internalMarketplace,
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
      {
        name: 'Talent pipeline',
        value: formatNumber(talentCrm?.totals?.candidates ?? 0),
        description: `${formatPercent(talentCrm?.conversionRate ?? talentLifecycleSummary?.conversionRate ?? 0)} conversion • ${formatNumber(talentCrm?.totals?.offersSigned ?? 0)} signed offers`,
        icon: BriefcaseIcon,
      },
      {
        name: 'Wellbeing index',
        value: formatScore(peopleOps?.wellbeing?.averageScore ?? 0),
        description: `${formatNumber(peopleOps?.wellbeing?.atRisk ?? 0)} retention risk alerts`,
        icon: HeartIcon,
      },
    ];
    return cards;
  }, [summary, financialSummary, contactNotes.length, talentCrm, peopleOps, talentLifecycleSummary]);

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

  const renderTalentOverview = (
    <div className="rounded-3xl border border-purple-100 bg-gradient-to-r from-purple-50 via-indigo-50 to-sky-50 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Talent lifecycle &amp; HR excellence</h2>
          <p className="text-sm text-slate-600">
            Give every agency member a consumer-grade experience across hiring, onboarding, development, and performance.
          </p>
        </div>
        <span className="rounded-2xl bg-purple-100/80 p-3 text-purple-600">
          <SparklesIcon className="h-6 w-6" />
        </span>
      </div>
      <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-white/60 bg-white/80 px-4 py-3 shadow-sm">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Active headcount</dt>
          <dd className="mt-2 text-xl font-semibold text-slate-900">
            {formatNumber(hrManagement?.activeHeadcount ?? summary?.members?.total ?? members.length ?? 0)}
          </dd>
          <dd className="mt-1 text-xs text-slate-500">
            {formatNumber(hrManagement?.contractors ?? 0)} contractors
          </dd>
        </div>
        <div className="rounded-2xl border border-white/60 bg-white/80 px-4 py-3 shadow-sm">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Talent conversion</dt>
          <dd className="mt-2 text-xl font-semibold text-slate-900">
            {formatPercent(talentLifecycleSummary?.conversionRate ?? talentCrm?.conversionRate ?? 0)}
          </dd>
          <dd className="mt-1 text-xs text-slate-500">
            Avg time-to-fill {formatScore(talentCrm?.averageTimeToFillDays ?? 0)} days
          </dd>
        </div>
        <div className="rounded-2xl border border-white/60 bg-white/80 px-4 py-3 shadow-sm">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bench capacity</dt>
          <dd className="mt-2 text-xl font-semibold text-slate-900">
            {formatNumber(Math.round(capacityPlanning?.benchCapacityHours ?? 0))} hrs
          </dd>
          <dd className="mt-1 text-xs text-slate-500">
            Utilisation {formatPercent(capacityPlanning?.utilizationRate ?? summary?.members?.utilizationRate ?? 0)}
          </dd>
        </div>
        <div className="rounded-2xl border border-white/60 bg-white/80 px-4 py-3 shadow-sm">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Brand reach</dt>
          <dd className="mt-2 text-xl font-semibold text-slate-900">
            {formatNumber(brandingStudio?.metrics?.totals?.reach ?? 0)}
          </dd>
          <dd className="mt-1 text-xs text-slate-500">
            {formatNumber(brandingStudio?.metrics?.totals?.leadsAttributed ?? 0)} attributed leads
          </dd>
        </div>
      </dl>
    </div>
  );

  const renderTalentCrm = (
    <div className="rounded-3xl border border-purple-100 bg-white p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Talent CRM</h2>
          <p className="text-sm text-slate-500">
            Recruit, evaluate, and onboard permanent staff, contractors, and collectives with interview scheduling and feedback loops.
          </p>
        </div>
        <span className="rounded-2xl bg-purple-50 p-3 text-purple-600">
          <BriefcaseIcon className="h-6 w-6" />
        </span>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {Object.entries(talentCrm?.stageCounts ?? {}).map(([stage, count]) => (
          <div key={stage} className="rounded-2xl border border-slate-200/60 bg-slate-50/60 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{titleCase(stage)}</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{formatNumber(count)}</p>
          </div>
        ))}
        {!Object.keys(talentCrm?.stageCounts ?? {}).length ? (
          <p className="col-span-full text-sm text-slate-500">
            No candidates in the pipeline yet. Publish a role or gig to start sourcing talent.
          </p>
        ) : null}
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-600">
        {Object.entries(talentCrm?.diversityBreakdown ?? {})
          .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
          .slice(0, 4)
          .map(([tag, count]) => (
            <span key={tag} className="rounded-full bg-purple-50 px-3 py-1 font-medium text-purple-700">
              {titleCase(tag)} · {formatNumber(count)}
            </span>
          ))}
        {talentCrm?.totals?.offersSigned != null ? (
          <span className="rounded-full bg-indigo-50 px-3 py-1 font-medium text-indigo-700">
            {formatNumber(talentCrm.totals.offersSigned)} signed offers
          </span>
        ) : null}
        {talentCrm?.pipelineAnalytics?.latest?.openRoles != null ? (
          <span className="rounded-full bg-blue-50 px-3 py-1 font-medium text-blue-700">
            {formatNumber(talentCrm.pipelineAnalytics.latest.openRoles)} open roles
          </span>
        ) : null}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Upcoming interviews</p>
          <ul className="mt-3 space-y-3">
            {(talentCrm?.upcomingInterviews ?? []).length ? (
              talentCrm.upcomingInterviews.slice(0, 4).map((interview) => (
                <li key={`${interview.id ?? interview.scheduledAt}-upcoming`} className="rounded-2xl border border-slate-200/60 bg-slate-50/60 p-4">
                  <p className="text-sm font-medium text-slate-900">{titleCase(interview.stage ?? 'Interview')}</p>
                  <p className="text-xs text-slate-500">
                    Candidate {interview.candidateId ?? 'TBC'} • {interview.scheduledAt ? formatAbsolute(interview.scheduledAt) : 'Scheduling'}
                  </p>
                </li>
              ))
            ) : (
              <li className="text-sm text-slate-500">No interviews scheduled.</li>
            )}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Offer workflows</p>
          <ul className="mt-3 space-y-3">
            {(talentCrm?.offerWorkflows ?? []).length ? (
              talentCrm.offerWorkflows.slice(0, 4).map((offer) => (
                <li key={`${offer.id ?? offer.candidateId}-offer`} className="rounded-2xl border border-purple-100 bg-purple-50/60 p-4">
                  <p className="text-sm font-medium text-slate-900">{offer.roleTitle ?? 'Offer'}</p>
                  <p className="text-xs text-slate-500">
                    {titleCase(offer.status ?? 'draft')} • {offer.sentAt ? formatRelativeTime(offer.sentAt) : 'Pending send'}
                  </p>
                </li>
              ))
            ) : (
              <li className="text-sm text-slate-500">Draft an offer to begin automated approvals.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );

  const renderPeopleOpsHub = (
    <div className="rounded-3xl border border-purple-100 bg-white p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">People ops hub</h2>
          <p className="text-sm text-slate-500">
            Centralize HR policies, benefits, compliance attestations, performance reviews, and wellbeing insights.
          </p>
        </div>
        <span className="rounded-2xl bg-purple-50 p-3 text-purple-600">
          <ClipboardDocumentCheckIcon className="h-6 w-6" />
        </span>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200/60 bg-slate-50/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Policies</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {formatNumber(peopleOps?.policies?.active ?? 0)} active • {formatPercent(peopleOps?.policies?.acknowledgementRate ?? 0)} acknowledged
            </p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {(peopleOps?.policies?.list ?? []).slice(0, 3).map((policy) => (
                <li key={policy.id ?? policy.title ?? 'policy'} className="flex items-center justify-between rounded-xl border border-white/60 bg-white/80 px-3 py-2">
                  <span className="font-medium text-slate-900">{policy.title ?? 'Policy'}</span>
                  <span className="text-xs text-slate-500">{policy.updatedAt || policy.effectiveDate ? formatAbsolute(policy.updatedAt ?? policy.effectiveDate) : 'Review pending'}</span>
                </li>
              ))}
              {!peopleOps?.policies?.list?.length ? <li className="text-xs text-slate-500">No policies published yet.</li> : null}
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-200/60 bg-slate-50/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Performance reviews</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {formatNumber(peopleOps?.performance?.outstanding ?? 0)} outstanding • {formatNumber(peopleOps?.performance?.completed ?? 0)} completed
            </p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {(peopleOps?.performance?.reviews ?? []).slice(0, 3).map((review) => (
                <li key={review.id ?? review.memberId ?? 'review'} className="flex items-center justify-between rounded-xl border border-white/60 bg-white/80 px-3 py-2">
                  <span className="font-medium text-slate-900">{review.cycle ?? 'Review cycle'}</span>
                  <span className="text-xs text-slate-500">{titleCase(review.status ?? 'pending')}</span>
                </li>
              ))}
              {!peopleOps?.performance?.reviews?.length ? <li className="text-xs text-slate-500">No reviews scheduled.</li> : null}
            </ul>
          </div>
        </div>
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200/60 bg-slate-50/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Skills matrix</p>
            <ul className="mt-3 space-y-3">
              {Object.entries(peopleOps?.skills?.coverage ?? {}).slice(0, 3).map(([category, coverage]) => {
                const total = coverage.total ?? 0;
                const ready = coverage.ready ?? 0;
                const percent = total ? Math.round((ready / total) * 100) : 0;
                return (
                  <li key={category} className="rounded-xl border border-white/60 bg-white/80 p-3">
                    <div className="flex items-center justify-between text-sm font-medium text-slate-900">
                      <span>{titleCase(category)}</span>
                      <span>{percent}% ready</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-purple-100">
                      <div className="h-full rounded-full bg-purple-500" style={{ width: `${Math.min(percent, 100)}%` }} />
                    </div>
                  </li>
                );
              })}
              {!Object.keys(peopleOps?.skills?.coverage ?? {}).length ? (
                <li className="text-xs text-slate-500">Document skills to unlock growth pathways.</li>
              ) : null}
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-200/60 bg-slate-50/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Wellbeing</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              Score {formatScore(peopleOps?.wellbeing?.averageScore ?? 0)} • {formatNumber(peopleOps?.wellbeing?.atRisk ?? 0)} at-risk
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              {Object.entries(peopleOps?.wellbeing?.riskCounts ?? {}).map(([risk, count]) => (
                <span key={risk} className="rounded-full bg-indigo-50 px-3 py-1 font-medium text-indigo-700">
                  {titleCase(risk)} · {formatNumber(count ?? 0)}
                </span>
              ))}
            </div>
            <ul className="mt-3 space-y-2 text-xs text-slate-500">
              {(peopleOps?.wellbeing?.snapshots ?? []).slice(0, 3).map((snapshot) => (
                <li key={snapshot.id ?? snapshot.capturedAt ?? 'snapshot'} className="flex items-center justify-between rounded-xl border border-white/60 bg-white/80 px-3 py-2">
                  <span>Member {snapshot.memberId}</span>
                  <span>{snapshot.capturedAt ? formatRelativeTime(snapshot.capturedAt) : 'Awaiting check-in'}</span>
                </li>
              ))}
              {!peopleOps?.wellbeing?.snapshots?.length ? <li>No wellbeing surveys captured.</li> : null}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTalentOpportunityBoard = (
    <div className="rounded-3xl border border-purple-100 bg-white p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Internal opportunity board</h2>
          <p className="text-sm text-slate-500">
            Advertise cross-agency projects, mentorships, communities, and bench initiatives to keep talent engaged.
          </p>
        </div>
        <span className="rounded-2xl bg-purple-50 p-3 text-purple-600">
          <UserGroupIcon className="h-6 w-6" />
        </span>
      </div>
      <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-600">
        <span className="rounded-full bg-purple-50 px-3 py-1 font-medium text-purple-700">
          {formatNumber(talentOpportunityBoard?.summary?.open ?? 0)} open opportunities
        </span>
        <span className="rounded-full bg-indigo-50 px-3 py-1 font-medium text-indigo-700">
          Avg match {formatScore(talentOpportunityBoard?.summary?.averageMatchScore ?? 0)}
        </span>
        <span className="rounded-full bg-blue-50 px-3 py-1 font-medium text-blue-700">
          {formatNumber(talentOpportunityBoard?.summary?.mobileAlerts ?? 0)} mobile alerts sent
        </span>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Upcoming opportunities</p>
          <ul className="mt-3 space-y-3">
            {(talentOpportunityBoard?.opportunities ?? []).length ? (
              talentOpportunityBoard.opportunities.slice(0, 4).map((opportunity) => (
                <li key={opportunity.id ?? opportunity.title} className="rounded-2xl border border-slate-200/60 bg-slate-50/60 p-4">
                  <p className="text-sm font-medium text-slate-900">{opportunity.title}</p>
                  <p className="text-xs text-slate-500">
                    {titleCase(opportunity.category ?? 'project')} • {opportunity.startDate ? formatAbsolute(opportunity.startDate) : 'Start TBD'}
                </li>
              ))
            ) : (
              <li className="text-sm text-slate-500">No internal opportunities posted.</li>
            )}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Smart matches</p>
          <ul className="mt-3 space-y-3">
            {(talentOpportunityBoard?.matches ?? []).length ? (
              talentOpportunityBoard.matches.slice(0, 4).map((match) => (
                <li key={match.id ?? match.memberId ?? 'match'} className="rounded-2xl border border-purple-100 bg-purple-50/60 p-4">
                  <p className="text-sm font-medium text-slate-900">Member {match.memberId}</p>
                  <p className="text-xs text-slate-500">
                    {titleCase(match.status ?? 'new')} • Match score {formatScore(match.matchScore ?? 0)}
                  </p>
                </li>
              ))
            ) : (
              <li className="text-sm text-slate-500">Matches will appear once opportunities go live.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );

  const renderBrandingStudio = (
    <div className="rounded-3xl border border-purple-100 bg-white p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Agency member branding</h2>
          <p className="text-sm text-slate-500">
            Provide banners, media kits, and social cards for each team member to promote agency credentials with approval workflows and analytics.
          </p>
        </div>
        <span className="rounded-2xl bg-purple-50 p-3 text-purple-600">
          <MegaphoneIcon className="h-6 w-6" />
        </span>
      </div>
      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Published assets</p>
          <ul className="mt-3 space-y-3">
            {(brandingStudio?.assets ?? []).length ? (
              brandingStudio.assets.slice(0, 4).map((asset) => (
                <li key={asset.id ?? asset.title ?? 'asset'} className="rounded-2xl border border-slate-200/60 bg-slate-50/60 p-4">
                  <p className="text-sm font-medium text-slate-900">{asset.title}</p>
                  <p className="text-xs text-slate-500">
                    {titleCase(asset.assetType ?? 'asset')} • {titleCase(asset.status ?? 'draft')}
                  </p>
                </li>
              ))
            ) : (
              <li className="text-sm text-slate-500">No branding assets uploaded.</li>
            )}
          </ul>
        </div>
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200/60 bg-slate-50/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reach &amp; engagement</p>
            <dl className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-slate-500">Reach</dt>
                <dd className="text-lg font-semibold text-slate-900">{formatNumber(brandingStudio?.metrics?.totals?.reach ?? 0)}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-slate-500">Engagements</dt>
                <dd className="text-lg font-semibold text-slate-900">{formatNumber(brandingStudio?.metrics?.totals?.engagements ?? 0)}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-slate-500">Clicks</dt>
                <dd className="text-lg font-semibold text-slate-900">{formatNumber(brandingStudio?.metrics?.totals?.clicks ?? 0)}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-slate-500">Leads</dt>
                <dd className="text-lg font-semibold text-slate-900">{formatNumber(brandingStudio?.metrics?.totals?.leadsAttributed ?? 0)}</dd>
              </div>
            </dl>
          </div>
          <div className="rounded-2xl border border-slate-200/60 bg-slate-50/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Approval queue</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {(brandingStudio?.approvals?.queue ?? []).slice(0, 4).map((approval) => (
                <li key={approval.id ?? approval.assetId ?? 'approval'} className="flex items-center justify-between rounded-xl border border-white/60 bg-white/80 px-3 py-2">
                  <span>Asset {approval.assetId ?? 'pending'}</span>
                  <span className="text-xs text-slate-500">{approval.requestedAt ? formatRelativeTime(approval.requestedAt) : 'Awaiting review'}</span>
                </li>
              ))}
              {!brandingStudio?.approvals?.queue?.length ? <li className="text-xs text-slate-500">No approvals pending.</li> : null}
            </ul>
          </div>
        </div>
      </div>
    </div>
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

            <section>{renderTalentOverview}</section>

            <section className="grid gap-6 xl:grid-cols-2">
              {renderTalentCrm}
              {renderPeopleOpsHub}
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
              {renderTalentOpportunityBoard}
              {renderBrandingStudio}
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
