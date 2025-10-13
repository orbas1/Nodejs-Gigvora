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
import PartnershipsSourcingSection from '../../components/dashboard/PartnershipsSourcingSection.jsx';
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
        name: 'Job lifecycle & ATS intelligence',
        description:
          'Run a modern applicant tracking system with collaborative job creation, smart sourcing, and full-funnel insights.',
        tags: ['ATS'],
      },
      {
        name: 'Interview excellence & candidate experience',
        description: 'Structured guides, scheduling automation, and feedback collaboration for every interview panel.',
      },
      {
        name: 'Offer & onboarding bridge',
        description: 'Generate offers, track approvals, manage background checks, and orchestrate onboarding tasks.',
      },
      {
        name: 'Candidate care center',
        description: 'Monitor response times, candidate NPS, and inclusion metrics to deliver a world-class experience.',
      },
    ],
  },
  {
    label: 'Design & sourcing',
    items: [
      {
        name: 'Job design studio',
        description: 'Craft requisitions with intake surveys, leveling frameworks, compensation guidelines, and approvals.',
      },
      {
        name: 'Multi-channel sourcing',
        description:
          'Publish to Gigvora, job boards, employee referrals, and talent pools with personalized landing pages and reporting.',
      },
      {
        name: 'Applicant relationship manager',
        description: 'Segment candidates, send nurture campaigns, and manage compliance across GDPR, CCPA, and internal policies.',
      },
    ],
  },
  {
    label: 'Analytics & planning',
    items: [
      {
        name: 'Analytics & forecasting',
        description: 'Predict time-to-fill, offer acceptance, and pipeline conversion to forecast headcount.',
      },
      {
        name: 'Workforce analytics',
        description: 'Blend hiring and HRIS data to uncover attrition risks, mobility opportunities, and skill gaps.',
      },
      {
        name: 'Scenario planning',
        description: 'Model hiring freezes or acceleration plans with interactive dashboards by department, level, or location.',
      },
    ],
  },
  {
    label: 'Partnerships & sourcing',
    items: [
      {
        name: 'Headhunter program',
        description: 'Invite headhunters, share briefs, score performance, and manage commissions.',
        sectionId: 'partnerships-headhunter-program',
      },
      {
        name: 'Talent pools',
        description: 'Maintain silver medalists, alumni, referrals, and campus relationships.',
        sectionId: 'partnerships-talent-pools',
      },
      {
        name: 'Agency collaboration',
        description: 'Coordinate with partner agencies on SLAs, billing, and compliance.',
        sectionId: 'partnerships-agency-collaboration',
      },
      {
        name: 'Partner performance manager',
        description: 'Compare agencies, headhunters, and recruiters with leaderboards, SLAs, and ROI analytics.',
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
        name: 'Internal mobility & referrals',
        description: 'Promote jobs internally, reward referrals, and manage career pathing across departments.',
      },
    ],
  },
  {
    label: 'Operations & governance',
    items: [
      {
        name: 'Calendar & communications',
        description: 'Sync recruiting calendars, digests, integrations, and cross-functional updates.',
      },
      {
        name: 'Settings & governance',
        description: 'Permissions, integrations, compliance, and approval workflows.',
      },
      {
        name: 'Governance & compliance',
        description: 'Maintain GDPR/CCPA compliance, accessibility standards, and equitable hiring policies.',
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
  ClipboardDocumentCheckIcon,
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

  const {
    pipelineSummary,
    diversity,
    alerts,
    jobLifecycle,
    jobDesign,
    sourcing,
    applicantRelationshipManager,
    analyticsForecasting,
    interviewOperations,
    candidateExperience,
    offerOnboarding,
    candidateCare,
    partnerCollaboration,
    brandIntelligence,
    governance,
    calendar,
    jobSummary,
    projectSummary,
    recommendations,
  } = data;

  const statusEntries = Object.entries(pipelineSummary?.byStatus ?? {});
  const statusBulletPoints = statusEntries.length
    ? statusEntries
        .sort(([, a], [, b]) => b - a)
        .slice(0, 6)
        .map(([status, count]) => `${status.replace(/_/g, ' ')} — ${formatNumber(count)}`)
    : ['No application activity recorded in this window.'];

  const diversityBreakdown = diversity?.breakdowns?.gender ?? [];
  const diversityPoints = diversityBreakdown.length
    ? [
        `Representation index: ${diversity?.representationIndex != null ? diversity.representationIndex.toFixed(2) : '—'}`,
        `Responses captured: ${formatNumber(diversity?.total)}`,
        ...diversityBreakdown.slice(0, 3).map((item) => `${item.label}: ${formatPercent(item.percentage)}`),
      ]
    : ['Capture optional demographic surveys to unlock representation reporting.'];

  const alertPoints = alerts?.items?.length
    ? [
        `Open alerts: ${formatNumber(alerts.open ?? 0)}`,
        `Critical issues: ${formatNumber(alerts.bySeverity?.critical ?? 0)}`,
        alerts.latestDetection ? `Latest detected: ${formatRelativeTime(alerts.latestDetection)}` : 'No recent alerts detected.',
      ]
    : ['No active alerts in this lookback window.'];

  const campaignChannelPoints = jobLifecycle?.campaigns?.byChannel?.length
    ? jobLifecycle.campaigns.byChannel.slice(0, 3).map(
        ({ channel, applications, conversionRate }) =>
          `${channel}: ${formatNumber(applications)} apps • ${formatPercent(conversionRate)} hire rate`,
      )
    : ['Launch a campaign to see channel performance.'];

  const jobStagePoints = jobLifecycle
    ? [
        `Total stages: ${formatNumber(jobLifecycle.totalStages)}`,
        `Average stage duration: ${formatNumber(jobLifecycle.averageStageDurationHours, { suffix: ' hrs' })}`,
        `Pending approvals: ${formatNumber(jobLifecycle.pendingApprovals)}`,
        `Overdue approvals: ${formatNumber(jobLifecycle.overdueApprovals)}`,
      ]
    : ['Configure your hiring stages to see lifecycle analytics.'];

  const jobDesignPoints = jobDesign
    ? [
        `Approvals in flight: ${formatNumber(jobDesign.approvalsInFlight)}`,
        `Co-author sessions: ${formatNumber(jobDesign.coAuthorSessions)}`,
        `Structured stages: ${formatNumber(jobDesign.structuredStages)}`,
        `Compliance alerts: ${formatNumber(jobDesign.complianceAlerts)}`,
      ]
    : ['Track job approvals and compliance to surface design insights.'];

  const sourcingSources = sourcing?.sources?.length
    ? sourcing.sources.slice(0, 4).map((entry) => `${entry.source}: ${formatNumber(entry.count)} (${formatPercent(entry.percentage)})`)
    : ['No candidate source data captured in this window.'];

  const sourcingTotals = sourcing
    ? [
        `Campaign applications: ${formatNumber(sourcing.campaignTotals?.applications)}`,
        `Campaign hires: ${formatNumber(sourcing.campaignTotals?.hires)}`,
        `Average CPA: ${
          sourcing.averageCostPerApplication != null
            ? `$${Number(sourcing.averageCostPerApplication).toFixed(2)}`
            : '—'
        }`,
        `Hire contribution rate: ${formatPercent(sourcing.hireContributionRate)}`,
      ]
    : ['Activate campaign tracking to monitor sourcing ROI.'];

  const armPoints = applicantRelationshipManager
    ? [
        `Active candidates: ${formatNumber(applicantRelationshipManager.totalActiveCandidates)}`,
        `Nurture campaigns logged: ${formatNumber(applicantRelationshipManager.nurtureCampaigns)}`,
        `Follow-ups scheduled: ${formatNumber(applicantRelationshipManager.followUpsScheduled)}`,
        `Compliance reviews: ${formatNumber(applicantRelationshipManager.complianceReviews)}`,
      ]
    : ['Log nurture campaigns to power the applicant relationship manager.'];

  const forecastingPoints = analyticsForecasting
    ? [
        `Projected hires: ${formatNumber(analyticsForecasting.projectedHires)}`,
        `Estimated backlog: ${formatNumber(analyticsForecasting.backlog)}`,
        `Average time to fill: ${formatNumber(analyticsForecasting.timeToFillDays, { suffix: ' days' })}`,
        `Projects at risk: ${formatNumber(analyticsForecasting.atRiskProjects)}`,
      ]
    : ['Forecast models will appear once enough activity is captured.'];

  const interviewPoints = [
    `Upcoming interviews: ${formatNumber(interviewOperations?.upcomingCount)}`,
    `Average lead time: ${formatNumber(interviewOperations?.averageLeadTimeHours, { suffix: ' hrs' })}`,
    `Average duration: ${formatNumber(interviewOperations?.averageDurationMinutes, { suffix: ' mins' })}`,
    `Feedback logged: ${formatNumber(interviewOperations?.feedbackLogged)}`,
  ];

  const candidateExperiencePoints = [
    `Survey responses: ${formatNumber(candidateExperience?.responseCount)}`,
    `Avg satisfaction: ${formatNumber(candidateExperience?.averageScore)}`,
    `Candidate NPS: ${
      candidateExperience?.nps != null && Number.isFinite(Number(candidateExperience.nps))
        ? `${Number(candidateExperience.nps).toFixed(1)}`
        : '—'
    }`,
    `Follow-ups pending: ${formatNumber(candidateExperience?.followUpsPending)}`,
  ];

  const offerPoints = [
    `Open offers: ${formatNumber(offerOnboarding?.openOffers)}`,
    `Acceptance rate: ${formatPercent(offerOnboarding?.acceptanceRate)}`,
    `Onboarding follow-ups: ${formatNumber(offerOnboarding?.onboardingFollowUps)}`,
    `Average days to start: ${formatNumber(offerOnboarding?.averageDaysToStart)}`,
  ];

  const carePoints = [
    `Satisfaction score: ${formatNumber(candidateCare?.satisfaction)}`,
    `Candidate NPS: ${
      candidateCare?.nps != null && Number.isFinite(Number(candidateCare.nps))
        ? `${Number(candidateCare.nps).toFixed(1)}`
        : '—'
    }`,
    `Follow-ups pending: ${formatNumber(candidateCare?.followUpsPending)}`,
    `Escalations: ${formatNumber(candidateCare?.escalations)}`,
  ];

  const calendarPoints = calendar?.upcoming?.length
    ? calendar.upcoming.slice(0, 3).map((event) => `${event.eventType} • ${formatAbsolute(event.startsAt)}`)
    : ['Connect your recruiting calendar to see upcoming events.'];

  const brandPoints = brandIntelligence
    ? [
        `Published assets: ${formatNumber(brandIntelligence.publishedAssets)}`,
        `Average engagement: ${formatNumber(brandIntelligence.averageEngagementScore)}`,
        `Profile completeness: ${formatPercent(brandIntelligence.profileCompleteness)}`,
        `Active roles highlighted: ${formatNumber(brandIntelligence.activeRoles)}`,
      ]
    : ['Publish employer brand assets to monitor engagement.'];

  const governancePoints = governance
    ? [
        `Pending approvals: ${formatNumber(governance.pendingApprovals)}`,
        `Critical alerts: ${formatNumber(governance.criticalAlerts)}`,
        `Workspace active: ${governance.workspaceActive ? 'Yes' : 'No'}`,
        governance.timezone ? `Primary timezone: ${governance.timezone}` : 'Set a default timezone for scheduling.',
      ]
    : ['Governance metrics appear once approvals and alerts are captured.'];

  const recommendationPoints = Array.isArray(recommendations) && recommendations.length
    ? recommendations.map((item) => item.title)
    : ['Keep capturing activity to surface recommended actions.'];

  return [
    {
      title: 'Hiring overview',
      description: 'Pipeline health, hiring velocity, diversity metrics, and alerts.',
      features: [
        { name: 'Pipeline health', description: 'Stage distribution across the hiring funnel.', bulletPoints: statusBulletPoints },
        {
          name: 'Velocity & conversion',
          description: 'Measure time-to-hire and conversion rates across stages.',
          bulletPoints: [
            `Average days to decision: ${formatNumber(pipelineSummary?.velocity?.averageDaysToDecision)}`,
            `Median days to interview: ${formatNumber(pipelineSummary?.velocity?.medianDaysToInterview)}`,
            `Interview rate: ${formatPercent(pipelineSummary?.conversionRates?.interviewRate)}`,
            `Offer-to-hire: ${formatPercent(pipelineSummary?.conversionRates?.hireRate)}`,
          ],
        },
        {
          name: 'Diversity & inclusion',
          description: 'Monitor representation across self-reported demographics.',
          bulletPoints: diversityPoints,
        },
        {
          name: 'Alerts & risk',
          description: 'Track SLA breaches, compliance flags, and emerging issues.',
          bulletPoints: alertPoints,
        },
      ],
    },
    {
      title: 'Job lifecycle & ATS intelligence',
      description: 'Optimise stage configurations, approvals, and campaign performance.',
      features: [
        {
          name: 'Stage configuration',
          description: 'Understand the structure and pacing of your ATS stages.',
          bulletPoints: jobStagePoints,
        },
        {
          name: 'Campaign performance',
          description: 'Compare sourcing channels powering your requisitions.',
          bulletPoints: campaignChannelPoints,
        },
        {
          name: 'Recommended actions',
          description: 'AI-assisted guidance based on current lifecycle metrics.',
          bulletPoints: recommendationPoints,
        },
      ],
    },
    {
      title: 'Job design studio',
      description: 'Craft requisitions with collaborative approvals and compliance controls.',
      features: [
        {
          name: 'Design throughput',
          description: 'Keep requisitions flowing with cross-functional co-authoring.',
          bulletPoints: jobDesignPoints,
        },
        {
          name: 'Jobs management',
          description: 'Inventory of open jobs and gigs promoted to the market.',
          bulletPoints: [
            `Total roles: ${formatNumber(jobSummary?.total)}`,
            `Jobs vs gigs: ${formatNumber(jobSummary?.byType?.jobs)} jobs • ${formatNumber(jobSummary?.byType?.gigs)} gigs`,
            ...(jobSummary?.topLocations?.slice?.(0, 3).map((item) => `${item.location} — ${formatNumber(item.count)} openings`) ?? []),
          ],
        },
      ],
    },
    {
      title: 'Multi-channel sourcing',
      description: 'Publish requisitions across campaigns, referrals, and targeted pools.',
      features: [
        {
          name: 'Source mix',
          description: 'Top channels contributing applicants this period.',
          bulletPoints: sourcingSources,
        },
        {
          name: 'Campaign ROI',
          description: 'Spend, applications, and hires generated by tracked campaigns.',
          bulletPoints: sourcingTotals,
        },
      ],
    },
    {
      title: 'Applicant relationship manager',
      description: 'Nurture candidates, manage follow-ups, and stay compliant.',
      features: [
        {
          name: 'Pipeline engagement',
          description: 'Track nurture sequences and compliance tasks.',
          bulletPoints: armPoints,
        },
      ],
    },
    {
      title: 'Analytics & forecasting',
      description: 'Model hiring plans, forecast headcount, and spot delivery risks.',
      features: [
        {
          name: 'Planning insights',
          description: 'Forward-looking metrics for leadership reviews.',
          bulletPoints: forecastingPoints,
        },
        {
          name: 'Delivery readiness',
          description: 'Link project signals to hiring capacity.',
          bulletPoints: [
            `Projects active: ${formatNumber(projectSummary?.totals?.active)}`,
            `Planning pipeline: ${formatNumber(projectSummary?.totals?.planning)}`,
            `At-risk delivery: ${formatNumber(projectSummary?.totals?.atRisk)}`,
            `Automation-enabled: ${formatNumber(projectSummary?.automation?.automationEnabled)}`,
          ],
        },
      ],
    },
    {
      title: 'Interview excellence & candidate experience',
      description: 'Enable consistent, inclusive interviews with rich feedback loops.',
      features: [
        {
          name: 'Interview operations',
          description: 'Scheduling health and interviewer readiness.',
          bulletPoints: interviewPoints,
        },
        {
          name: 'Experience insights',
          description: 'Candidate feedback and sentiment trends.',
          bulletPoints: candidateExperiencePoints,
        },
      ],
    },
    {
      title: 'Offer & onboarding bridge',
      description: 'Close candidates confidently and orchestrate day-one readiness.',
      features: [
        {
          name: 'Offer pipeline',
          description: 'Conversion, follow-ups, and start-date readiness.',
          bulletPoints: offerPoints,
        },
      ],
    },
    {
      title: 'Candidate care center',
      description: 'Deliver responsive, inclusive experiences throughout the journey.',
      features: [
        {
          name: 'Experience health',
          description: 'Satisfaction, NPS, and escalations in one view.',
          bulletPoints: carePoints,
        },
      ],
    },
    {
      title: 'Calendar & communications',
      description: 'Coordinate interviews, events, and executive reviews.',
      features: [
        {
          name: 'Upcoming events',
          description: 'Recruiting calendar highlights and digests.',
          bulletPoints: calendarPoints,
        },
      ],
    },
    {
      title: 'Employer brand & workforce intelligence',
      description: 'Promote culture, track engagement, and align with workforce plans.',
      features: [
        {
          name: 'Brand engagement',
          description: 'Published assets and campaign traction.',
          bulletPoints: brandPoints,
        },
        {
          name: 'Workforce insights',
          description: 'Tie hiring plans to workforce analytics.',
          bulletPoints: [
            `Projected hires: ${formatNumber(analyticsForecasting?.projectedHires)}`,
            `Attrition risks surfaced via projects at risk: ${formatNumber(analyticsForecasting?.atRiskProjects)}`,
            `Internal mobility spotlight: ${formatNumber(jobDesign?.coAuthorSessions ?? 0)} collaborative design sessions`,
          ],
        },
      ],
    },
    {
      title: 'Governance & compliance',
      description: 'Stay audit-ready with approvals, policies, and accessibility checks.',
      features: [
        {
          name: 'Policy health',
          description: 'Ensure approvals, alerts, and workspace controls are on track.',
          bulletPoints: governancePoints,
        },
      ],
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

function MembershipList({ memberships }) {
  if (!memberships?.length) {
    return (
      <p className="text-sm text-blue-700">Enable additional workspace memberships to collaborate across programs.</p>
    );
  }

  return (
    <div className="flex flex-wrap gap-4">
      {memberships.map((membership) => (
        <div
          key={membership.name}
          className="min-w-[200px] flex-1 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 shadow-sm"
        >
          <p className="text-sm font-semibold text-blue-900">{membership.name}</p>
          <p className="mt-2 text-xs text-blue-700">{membership.description}</p>
          <div className="mt-3 flex items-center text-xs font-semibold">
            <span
              className={`mr-2 inline-block h-2.5 w-2.5 rounded-full ${membership.active ? 'bg-emerald-500' : 'bg-slate-300'}`}
            />
            <span className={membership.active ? 'text-emerald-600' : 'text-slate-500'}>
              {membership.active ? 'Active membership' : 'Inactive'}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
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
  const memberships = data?.memberships ?? data?.meta?.memberships ?? [];

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

        <section className="rounded-3xl border border-blue-100 bg-blue-50/60 p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-blue-800">Your memberships</h2>
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">Workspace access</span>
          </div>
          <div className="mt-4">
            <MembershipList memberships={memberships} />
          </div>
        </section>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {summaryCards.map((card, index) => {
            const Icon = SUMMARY_ICONS[index % SUMMARY_ICONS.length] ?? ClipboardDocumentCheckIcon;
            return (
              <div
                key={card.label}
                className="flex items-center justify-between rounded-3xl border border-blue-100 bg-white px-4 py-5 shadow-sm"
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

        <PartnershipsSourcingSection data={data?.partnerships} />

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

