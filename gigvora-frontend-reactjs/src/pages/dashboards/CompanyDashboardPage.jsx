import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  BriefcaseIcon,
  UsersIcon,
  ClockIcon,
  EnvelopeOpenIcon,
  SparklesIcon,
  GlobeAltIcon,
  ClipboardDocumentCheckIcon,
} from '@heroicons/react/24/outline';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import DataStatus from '../../components/DataStatus.jsx';
import { useCompanyDashboard } from '../../hooks/useCompanyDashboard.js';
import { formatAbsolute, formatRelativeTime } from '../../utils/date.js';

const menuSections = [
  {
    label: 'Talent acquisition',
    items: [
      {
        name: 'Hiring overview',
        description: 'Pipeline health, hiring velocity, diversity metrics, and alerts.',
      },
      {
        name: 'Jobs management',
        description: 'Create, duplicate, archive, and collaborate on job requisitions.',
        tags: ['ATS'],
      },
      {
        name: 'Interview operations',
        description: 'Schedule panels, share prep kits, manage interviewer enablement, and feedback.',
      },
    ],
  },
  {
    label: 'Partnerships & sourcing',
    items: [
      {
        name: 'Headhunter program',
        description: 'Invite headhunters, share briefs, score performance, and manage commissions.',
      },
      {
        name: 'Talent pools',
        description: 'Maintain silver medalists, alumni, referrals, and campus relationships.',
      },
      {
        name: 'Agency collaboration',
        description: 'Coordinate with partner agencies on SLAs, billing, and compliance.',
      },
    ],
  },
  {
    label: 'Brand & people',
    items: [
      {
        name: 'Employer brand studio',
        description: 'Company profile, culture stories, benefits, and employer marketing assets.',
      },
      {
        name: 'Employee journeys',
        description: 'Onboarding, internal mobility, and performance snapshots for HR teams.',
      },
      {
        name: 'Settings & governance',
        description: 'Calendar sync, permissions, integrations, compliance, and approvals.',
      },
    ],
  },
];

const availableDashboards = ['company', 'headhunter', 'user', 'agency'];
const LOOKBACK_OPTIONS = [30, 60, 90, 120];
const SUMMARY_ICONS = [
  BriefcaseIcon,
  UsersIcon,
  ClockIcon,
  EnvelopeOpenIcon,
  SparklesIcon,
  GlobeAltIcon,
];

function formatNumber(value, { fallback = '—', suffix = '' } = {}) {
  if (value == null) return fallback;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return `${value}${suffix}`;
  }
  return `${numeric.toLocaleString()}${suffix}`;
}

function formatPercent(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }
  return `${Number(value).toFixed(1)}%`;
}

function buildSections(data) {
  if (!data) {
    return [];
  }

  const { pipelineSummary, memberSummary, projectSummary, partnerSummary, recommendations, insights, jobSummary } = data;

  const statusEntries = Object.entries(pipelineSummary?.byStatus ?? {});
  const statusBulletPoints = statusEntries.length
    ? statusEntries.sort(([, a], [, b]) => b - a).map(([status, count]) => `${status.replace(/_/g, ' ')} — ${count}`)
    : ['No application activity recorded in this window.'];

  const sourceEntries = Object.entries(insights?.candidateSources ?? {});
  const sourceBulletPoints = sourceEntries.length
    ? sourceEntries.sort(([, a], [, b]) => b - a).map(([source, count]) => `${source} — ${count}`)
    : ['No candidate sources captured.'];

  const recommendationTitles = Array.isArray(recommendations) && recommendations.length
    ? recommendations.map((item) => item.title)
    : ['Keep capturing activity to surface recommended actions.'];

  const pipelineFeatures = [
    {
      name: 'Stage distribution',
      description: 'Visibility across every stage of the hiring funnel for the selected lookback window.',
      bulletPoints: statusBulletPoints,
    },
    {
      name: 'Candidate sources',
      description: 'Understand where your applicants originate to prioritise future investments.',
      bulletPoints: sourceBulletPoints,
    },
    {
      name: 'Velocity & conversion',
      description: 'Keep leadership informed on pace from submission to decision.',
      bulletPoints: [
        `Average days to decision: ${formatNumber(pipelineSummary?.velocity?.averageDaysToDecision)}`,
        `Median days to interview: ${formatNumber(pipelineSummary?.velocity?.medianDaysToInterview)}`,
        `Interview rate: ${formatPercent(pipelineSummary?.conversionRates?.interviewRate)}`,
        `Offer-to-hire: ${formatPercent(pipelineSummary?.conversionRates?.hireRate)}`,
      ],
    },
  ];

  const operationsFeatures = [
    {
      name: 'Team capacity',
      description: 'Monitor recruiter availability, bench coverage, and utilisation.',
      bulletPoints: [
        `Active members: ${formatNumber(memberSummary?.active)} of ${formatNumber(memberSummary?.total)}`,
        `Bench availability: ${formatNumber(memberSummary?.bench)} teammates`,
        `Average weekly capacity: ${formatNumber(memberSummary?.averageWeeklyCapacity, { suffix: ' hrs' })}`,
        `Timezones covered: ${formatNumber(memberSummary?.uniqueTimezones)}`,
      ],
    },
    {
      name: 'Open requisitions',
      description: 'Jobs and gigs currently being promoted to the market.',
      bulletPoints: [
        `Total roles this period: ${formatNumber(jobSummary?.total)}`,
        `Jobs vs gigs: ${formatNumber(jobSummary?.byType?.jobs)} jobs • ${formatNumber(jobSummary?.byType?.gigs)} gigs`,
        ...(jobSummary?.topLocations?.map?.(
          ({ location, count }) => `${location} — ${formatNumber(count)} openings`,
        ) ?? []),
      ].slice(0, 5),
    },
    {
      name: 'Project automation',
      description: 'Auto-assign and workforce orchestration signals sourced from delivery projects.',
      bulletPoints: [
        `Active projects: ${formatNumber(projectSummary?.totals?.active)}`,
        `Planning queue: ${formatNumber(projectSummary?.totals?.planning)}`,
        `At-risk initiatives: ${formatNumber(projectSummary?.totals?.atRisk)}`,
        `Automation-enabled: ${formatNumber(projectSummary?.automation?.automationEnabled)}`,
      ],
    },
  ];

  const partnerFeatures = [
    {
      name: 'Partner ecosystem',
      description: 'Coordinate agencies, headhunters, and referrals collaborating with your team.',
      bulletPoints: [
        `Engaged contacts: ${formatNumber(partnerSummary?.engagedContacts)}`,
        `Touchpoints logged: ${formatNumber(partnerSummary?.touchpoints)}`,
        `Pending partner invites: ${formatNumber(partnerSummary?.pendingInvites)}`,
      ],
    },
    {
      name: 'Interview feedback health',
      description: 'Ensure feedback is logged and actionable.',
      bulletPoints: [
        `Review sample size: ${formatNumber(insights?.reviewSampleSize)}`,
        `Average score: ${formatNumber(insights?.averageReviewScore)}`,
        `Offers accepted: ${formatNumber(data.offers?.accepted)}`,
        `Offer win rate: ${formatPercent(data.offers?.winRate)}`,
      ],
    },
    {
      name: 'Recommended actions',
      description: 'Automated operational suggestions generated from current metrics.',
      bulletPoints: recommendationTitles,
    },
  ];

  return [
    {
      title: 'Pipeline performance',
      description: 'Monitor application flow, conversion, and velocity across all requisitions.',
      features: pipelineFeatures,
    },
    {
      title: 'Recruiting operations',
      description: 'Balance recruiter capacity, requisition health, and delivery readiness.',
      features: operationsFeatures,
    },
    {
      title: 'Partnerships & insights',
      description: 'Strengthen headhunter programs, gather feedback, and action recommendations.',
      features: partnerFeatures,
    },
  ];
}

function buildProfile(data, summaryCards) {
  if (!data?.workspace) {
    return {
      name: 'Atlas Robotics',
      role: 'Global Talent Acquisition Team',
      initials: 'AR',
      status: 'Hiring across multiple regions',
      badges: ['Employer of choice', 'Diversity champion'],
      metrics: summaryCards.slice(0, 4).map((card) => ({ label: card.label, value: `${card.value}` })),
    };
  }

  const workspace = data.workspace;
  const profile = data.profile ?? {};
  const displayName = profile.companyName ?? workspace.name ?? 'Company';
  const initials = displayName
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 3)
    .toUpperCase();

  return {
    name: displayName,
    role: 'Talent acquisition workspace',
    initials,
    status: workspace.health?.badges?.[0] ?? 'Monitoring hiring performance',
    badges: workspace.health?.badges ?? [],
    metrics: summaryCards.slice(0, 4).map((card) => ({ label: card.label, value: `${card.value}` })),
  };
}

function RecentNotes({ items }) {
  if (!items?.length) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">No partner notes captured in this window. Encourage your team to log updates.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.id} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-800">{item.subject ? `${item.subject.firstName} ${item.subject.lastName}` : 'Contact update'}</p>
              <p className="mt-1 text-sm text-slate-600">{item.note}</p>
            </div>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium uppercase tracking-wide text-blue-600">
              {item.visibility}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span>{item.author ? `By ${item.author.firstName} ${item.author.lastName}` : 'System'}</span>
            <span aria-hidden="true">•</span>
            <span title={formatAbsolute(item.createdAt)}>{formatRelativeTime(item.createdAt)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CompanyDashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const workspaceIdParam = searchParams.get('workspaceId');
  const workspaceSlugParam = searchParams.get('workspaceSlug');
  const lookbackParam = searchParams.get('lookbackDays');
  const lookbackDays = lookbackParam ? Math.max(Number.parseInt(lookbackParam, 10) || 30, 7) : 30;

  const { data, error, loading, refresh, fromCache, lastUpdated, summaryCards } = useCompanyDashboard({
    workspaceId: workspaceIdParam,
    workspaceSlug: workspaceSlugParam,
    lookbackDays,
  });

  useEffect(() => {
    if (!workspaceIdParam && data?.meta?.selectedWorkspaceId) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('workspaceId', `${data.meta.selectedWorkspaceId}`);
        return next;
      }, { replace: true });
    }
  }, [workspaceIdParam, data?.meta?.selectedWorkspaceId, setSearchParams]);

  const sections = useMemo(() => buildSections(data), [data]);
  const profile = useMemo(() => buildProfile(data, summaryCards), [data, summaryCards]);
  const workspaceOptions = data?.meta?.availableWorkspaces ?? [];

  const handleWorkspaceChange = (event) => {
    const nextWorkspaceId = event.target.value;
    const next = new URLSearchParams(searchParams);
    if (nextWorkspaceId) {
      next.set('workspaceId', nextWorkspaceId);
      next.delete('workspaceSlug');
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

  return (
    <DashboardLayout
      currentDashboard="company"
      title="Company Talent Acquisition Hub"
      subtitle="Integrated ATS & partnerships"
      description="Everything hiring teams need to design jobs, run interviews, collaborate with headhunters, and promote a magnetic employer brand on Gigvora."
      menuSections={menuSections}
      profile={profile}
      availableDashboards={availableDashboards}
    >
      <div className="space-y-10">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400" htmlFor="workspace-select">
              Workspace
            </label>
            <select
              id="workspace-select"
              value={data?.meta?.selectedWorkspaceId ?? workspaceIdParam ?? ''}
              onChange={handleWorkspaceChange}
              className="min-w-[180px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Select workspace</option>
              {workspaceOptions.map((workspace) => (
                <option key={workspace.id} value={workspace.id}>
                  {workspace.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400" htmlFor="lookback-select">
              Lookback window
            </label>
            <select
              id="lookback-select"
              value={lookbackDays}
              onChange={handleLookbackChange}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              {LOOKBACK_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  Last {option} days
                </option>
              ))}
            </select>
          </div>
        </div>

        <DataStatus loading={loading} fromCache={fromCache} lastUpdated={lastUpdated} onRefresh={() => refresh({ force: true })} />

        {error ? (
          <p className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
            {error.message || 'Unable to load company dashboard data.'}
          </p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {summaryCards.map((card, index) => {
            const Icon = SUMMARY_ICONS[index % SUMMARY_ICONS.length] ?? ClipboardDocumentCheckIcon;
            return (
              <div
                key={card.label}
                className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white px-4 py-5 shadow-sm"
              >
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{card.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{card.value}</p>
                </div>
                <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            );
          })}
        </div>

        {sections.map((section) => (
          <section
            key={section.title}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_-24px_rgba(30,64,175,0.35)] sm:p-8"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">{section.title}</h2>
                {section.description ? <p className="mt-2 max-w-3xl text-sm text-slate-600">{section.description}</p> : null}
              </div>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {section.features.map((feature) => (
                <div
                  key={feature.name}
                  className="group flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:border-blue-300 hover:bg-blue-50"
                >
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{feature.name}</h3>
                    {feature.description ? <p className="mt-2 text-sm text-slate-600">{feature.description}</p> : null}
                    {feature.bulletPoints?.length ? (
                      <ul className="mt-3 space-y-2 text-sm text-slate-600">
                        {feature.bulletPoints.map((point) => (
                          <li key={point} className="flex gap-2">
                            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Partner timeline</h2>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-600">
              Recent activity
            </span>
          </div>
          <RecentNotes items={data?.recentNotes ?? []} />
        </section>
      </div>
    </DashboardLayout>
  );
}

