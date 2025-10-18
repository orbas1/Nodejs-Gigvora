import { useEffect, useMemo } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import {
  BriefcaseIcon,
  UsersIcon,
  ClockIcon,
  EnvelopeOpenIcon,
  SparklesIcon,
  GlobeAltIcon,
  ClipboardDocumentCheckIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import DataStatus from '../../components/DataStatus.jsx';
import PartnershipsSourcingSection from '../../components/dashboard/PartnershipsSourcingSection.jsx';
import JobLifecycleSection from '../../components/company/JobLifecycleSection.jsx';
import InterviewExperienceSection from '../../components/dashboard/InterviewExperienceSection.jsx';
import AccessDeniedPanel from '../../components/dashboard/AccessDeniedPanel.jsx';
import CompanyDashboardOverviewSection from '../../components/company/CompanyDashboardOverviewSection.jsx';
import { useCompanyDashboard } from '../../hooks/useCompanyDashboard.js';
import { useSession } from '../../context/SessionContext.jsx';
import { formatAbsolute, formatRelativeTime } from '../../utils/date.js';
import { COMPANY_DASHBOARD_MENU_SECTIONS } from '../../constants/companyDashboardMenu.js';
import TimelineManagementSection from '../../components/company/TimelineManagementSection.jsx';

const menuSections = COMPANY_DASHBOARD_MENU_SECTIONS;

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
  ShieldCheckIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
];

function formatNumber(value, { fallback = '—', suffix = '', decimals = null } = {}) {
  if (value == null || Number.isNaN(Number(value))) {
    return fallback;
  }
  const numeric = Number(value);
  const formatted =
    decimals == null
      ? numeric.toLocaleString()
      : numeric.toLocaleString(undefined, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        });
  return `${formatted}${suffix}`;
}

function formatPercent(value, { fallback = '—', decimals = 1 } = {}) {
  if (value == null || Number.isNaN(Number(value))) {
    return fallback;
  }
  return `${Number(value).toFixed(decimals)}%`;
}

function formatCurrency(value, currency = 'USD', { fallback = '—' } = {}) {
  if (value == null || Number.isNaN(Number(value))) {
    return fallback;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currency || 'USD',
    maximumFractionDigits: numeric < 100 ? 2 : 0,
  }).format(numeric);
}

function buildProfile(data, summaryCards) {
  const workspace = data?.workspace ?? {};
  const companyProfile = data?.profile ?? {};
  const displayName = companyProfile.companyName ?? workspace.name ?? 'Company workspace';
  const initials = displayName
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const healthBadges = workspace.health?.badges ?? [];
  const status = workspace.health?.statusLabel ?? workspace.health?.status ?? 'Monitoring hiring performance';

  const metrics = (summaryCards ?? []).slice(0, 4).map((card) => ({
    label: card.label,
    value: card.value,
  }));

  return {
    name: displayName,
    role: 'Talent acquisition workspace',
    initials: initials || 'CO',
    status,
    badges: healthBadges,
    metrics,
  };
}

function normaliseMembership(membership) {
  if (!membership) {
    return null;
  }
  if (typeof membership === 'string') {
    const label = membership.replace(/_/g, ' ');
    return {
      id: membership,
      label: label.charAt(0).toUpperCase() + label.slice(1),
      description: 'Active workspace membership',
      active: true,
    };
  }
  const fallbackId =
    membership.id ??
    membership.slug ??
    membership.name ??
    membership.label ??
    membership.role ??
    membership.type ??
    null;

  return {
    id: typeof fallbackId === 'string' ? fallbackId : JSON.stringify(fallbackId ?? membership),
    label: membership.name ?? membership.label ?? membership.slug ?? 'Membership',
    description: membership.description ?? membership.summary ?? 'Workspace membership',
    active: membership.active ?? membership.status === 'active' ?? true,
  };
}

function MembershipHighlights({ memberships }) {
  const resolved = (memberships ?? [])
    .map((membership) => normaliseMembership(membership))
    .filter(Boolean);

  if (!resolved.length) {
    return (
      <p className="text-sm text-slate-500">
        Enable additional workspace memberships to collaborate across programs and dashboards.
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {resolved.map((membership) => (
        <div
          key={membership.id}
          className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 text-sm shadow-sm"
        >
          <p className="font-semibold text-blue-900">{membership.label}</p>
          <p className="mt-1 text-xs text-blue-700">{membership.description}</p>
          <div className="mt-3 inline-flex items-center gap-2 text-xs font-semibold">
            <span
              className={`inline-block h-2.5 w-2.5 rounded-full ${membership.active ? 'bg-emerald-500' : 'bg-slate-300'}`}
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

function SummaryCardGrid({ cards }) {
  if (!cards?.length) {
    return null;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = SUMMARY_ICONS[index % SUMMARY_ICONS.length];
        return (
          <div
            key={card.label}
            className="flex items-center justify-between rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-5 shadow-sm"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.label}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{card.value ?? '—'}</p>
              {card.helper ? <p className="mt-1 text-xs text-slate-500">{card.helper}</p> : null}
            </div>
            <div className="rounded-2xl bg-white p-3 text-blue-600 shadow-sm">
              <Icon className="h-6 w-6" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ActivityTimeline({ items }) {
  if (!items?.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-white/60 p-6 text-sm text-slate-500">
        No partner updates captured in this window. Encourage your team to log outreach notes and decision changes.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div
          key={item.id ?? `${item.note}-${item.createdAt}`}
          className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {item.subject ? `${item.subject.firstName} ${item.subject.lastName}` : 'Workspace note'}
              </p>
              <p className="mt-1 text-sm text-slate-600">{item.note ?? 'Update logged'}</p>
            </div>
            {item.visibility ? (
              <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-600">
                {item.visibility}
              </span>
            ) : null}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
            {item.author ? <span>By {item.author.firstName} {item.author.lastName}</span> : <span>System</span>}
            <span aria-hidden="true">•</span>
            <span title={item.createdAt ? formatAbsolute(item.createdAt) : undefined}>
              {item.createdAt ? formatRelativeTime(item.createdAt) : 'Recently'}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function buildSections(data) {
  if (!data) {
    return [];
  }

  const pipeline = data.pipelineSummary ?? {};
  const conversions = pipeline.conversionRates ?? {};
  const velocity = pipeline.velocity ?? {};
  const diversity = data.diversity ?? {};
  const diversityBreakdowns = Array.isArray(diversity.breakdowns?.gender)
    ? diversity.breakdowns.gender.slice(0, 3)
    : [];
  const alerts = data.alerts ?? {};
  const jobDesign = data.jobDesign ?? {};
  const sourcing = data.sourcing ?? {};
  const applicantRelationshipManager = data.applicantRelationshipManager ?? {};
  const analyticsForecasting = data.analyticsForecasting ?? {};
  const workforce = data.employerBrandWorkforce?.workforceAnalytics ?? {};
  const mobility = data.employerBrandWorkforce?.internalMobility ?? {};
  const scenarioPlanning = analyticsForecasting.scenarios ?? {};
  const networking = data.networking ?? {};
  const governance = data.governance ?? {};
  const calendar = data.calendar ?? {};
  const candidateExperience = data.candidateExperience ?? {};
  const candidateCare = data.candidateCare ?? {};
  const offer = data.offerOnboarding ?? {};

  const recommendedActions = Array.isArray(data.recommendations)
    ? data.recommendations.slice(0, 6).map((item) => item.title)
    : [];

  const diversityItems = diversityBreakdowns.length
    ? diversityBreakdowns.map((item) => `${item.label}: ${formatPercent(item.percentage)}`)
    : ['Capture voluntary demographic surveys to unlock representation insights.'];

  const alertItems = Array.isArray(alerts.items) && alerts.items.length
    ? alerts.items
        .slice(0, 4)
        .map((item) => `${item.title ?? item.type ?? 'Alert'} • ${formatRelativeTime(item.detectedAt)}`)
    : ['No active alerts detected in this window.'];

  const networkingSessions = networking.sessions ?? {};
  const networkingExperience = networking.attendeeExperience ?? {};
  const networkingPenalties = networking.penalties ?? {};

  return [
    {
      id: 'hiring-overview',
      title: 'Hiring overview',
      description: 'Monitor open requisitions, conversion velocity, diversity, and critical guardrails in one hub.',
      features: [
        {
          name: 'Pipeline health',
          sectionId: 'hiring-overview',
          bulletPoints: [
            `Open requisitions: ${formatNumber(data.jobSummary?.total ?? data.jobSummary?.active ?? 0)}`,
            `Applications in flight: ${formatNumber(pipeline.totals?.applications)}`,
            `Interviews scheduled: ${formatNumber(pipeline.totals?.interviews)}`,
            `Offers extended: ${formatNumber(offer.openOffers)}`,
          ],
        },
        {
          name: 'Conversion & velocity',
          sectionId: 'hiring-overview',
          bulletPoints: [
            `Average days to decision: ${formatNumber(velocity.averageDaysToDecision, { suffix: ' days' })}`,
            `Median days to interview: ${formatNumber(velocity.medianDaysToInterview, { suffix: ' days' })}`,
            `Interview rate: ${formatPercent(conversions.interviewRate)}`,
            `Offer-to-hire rate: ${formatPercent(conversions.hireRate)}`,
          ],
        },
        {
          name: 'Alerts & representation',
          sectionId: 'candidate-care-center',
          bulletPoints: [
            `Open alerts: ${formatNumber(alerts.open)}`,
            `Critical severity: ${formatNumber(alerts.bySeverity?.critical)}`,
            `Representation index: ${
              diversity.representationIndex != null
                ? Number(diversity.representationIndex).toFixed(2)
                : '—'
            }`,
            diversityBreakdowns.length ? diversityItems[0] : 'Invite candidates to share demographic data securely.',
          ],
        },
      ],
      details: [
        {
          title: 'Diversity breakdown',
          subtitle: 'Self reported demographics',
          items: diversityItems,
        },
        {
          title: 'Alert center',
          subtitle: 'Governance & compliance',
          items: alertItems,
        },
        {
          title: 'Recommended actions',
          subtitle: 'Automation & guardrails',
          items: recommendedActions.length
            ? recommendedActions
            : ['Keep activity flowing to surface playbook suggestions.'],
        },
      ],
    },
    {
      id: 'job-lifecycle-ats-intelligence',
      title: 'Job lifecycle & ATS intelligence',
      description: 'Design requisitions, launch sourcing campaigns, and nurture pipelines with built-in compliance.',
      features: [
        {
          name: 'Job design studio',
          sectionId: 'job-design-studio',
          bulletPoints: [
            `Approvals in flight: ${formatNumber(jobDesign.approvalsInFlight)}`,
            `Co-author sessions: ${formatNumber(jobDesign.coAuthorSessions)}`,
            `Structured stages: ${formatNumber(jobDesign.structuredStages)}`,
            `Compliance alerts: ${formatNumber(jobDesign.complianceAlerts)}`,
          ],
        },
        {
          name: 'Multi-channel sourcing',
          sectionId: 'multi-channel-sourcing',
          bulletPoints: [
            `Campaign applications: ${formatNumber(sourcing.campaignTotals?.applications)}`,
            `Campaign hires: ${formatNumber(sourcing.campaignTotals?.hires)}`,
            `Average CPA: ${formatCurrency(sourcing.averageCostPerApplication)}`,
            `Hire contribution rate: ${formatPercent(sourcing.hireContributionRate)}`,
          ],
        },
        {
          name: 'Applicant relationship manager',
          sectionId: 'applicant-relationship-manager',
          bulletPoints: [
            `Active candidates: ${formatNumber(applicantRelationshipManager.totalActiveCandidates)}`,
            `Nurture campaigns: ${formatNumber(applicantRelationshipManager.nurtureCampaigns)}`,
            `Follow-ups scheduled: ${formatNumber(applicantRelationshipManager.followUpsScheduled)}`,
            `Compliance reviews: ${formatNumber(applicantRelationshipManager.complianceReviews)}`,
          ],
        },
      ],
    },
    {
      id: 'analytics-forecasting',
      title: 'Analytics & planning',
      description: 'Forecast hiring, identify attrition risks, and stress test scenarios before committing.',
      features: [
        {
          name: 'Forecasting signals',
          sectionId: 'analytics-forecasting',
          bulletPoints: [
            `Projected hires: ${formatNumber(analyticsForecasting.projectedHires)}`,
            `Estimated backlog: ${formatNumber(analyticsForecasting.backlog)}`,
            `Time to fill: ${formatNumber(analyticsForecasting.timeToFillDays, { suffix: ' days' })}`,
            `Projects at risk: ${formatNumber(analyticsForecasting.atRiskProjects)}`,
          ],
        },
        {
          name: 'Workforce analytics',
          sectionId: 'workforce-analytics',
          bulletPoints: [
            `Attrition risk score: ${formatPercent(workforce.attritionRiskScore)}`,
            `Flight-risk employees: ${formatNumber(workforce.employeesAtRisk)}`,
            `Hot skills tracked: ${formatNumber(workforce.hotSkillsTracked)}`,
            `Mobility readiness: ${formatPercent(mobility.referralConversionRate)}`,
          ],
        },
        {
          name: 'Scenario planning',
          sectionId: 'scenario-planning',
          bulletPoints: [
            `Draft scenarios: ${formatNumber(scenarioPlanning.total)}`,
            `Active hiring freezes: ${formatNumber(scenarioPlanning.freezePlans)}`,
            `Acceleration plans: ${formatNumber(scenarioPlanning.accelerationPlans)}`,
            scenarioPlanning.nextReviewAt
              ? `Next review: ${formatAbsolute(scenarioPlanning.nextReviewAt)}`
              : 'Schedule scenario reviews to align exec decisions.',
          ],
        },
      ],
    },
    {
      id: 'networking-sessions',
      title: 'Networking & community',
      description: 'Activate company-hosted networking with end-to-end attendee experience controls.',
      features: [
        {
          name: 'Session operations',
          sectionId: 'networking-sessions',
          bulletPoints: [
            `Active sessions: ${formatNumber(networkingSessions.active)}`,
            `Upcoming sessions: ${formatNumber(networkingSessions.upcoming)}`,
            `Join limit: ${formatNumber(networkingSessions.defaultJoinLimit ?? networkingSessions.joinLimit)}`,
            networkingSessions.rotationDurationMinutes
              ? `Rotation cadence: ${formatNumber(networkingSessions.rotationDurationMinutes, { suffix: ' min' })}`
              : 'Configure 2–5 minute rotations to keep meetings balanced.',
          ],
        },
        {
          name: 'Attendee experience',
          sectionId: 'networking-attendee-experience',
          bulletPoints: [
            `Digital cards created: ${formatNumber(networkingExperience.digitalBusinessCardsCreated)}`,
            `Average satisfaction: ${formatPercent(networkingExperience.averageSatisfaction)}`,
            `Saved matches: ${formatNumber(networkingExperience.matchesSaved)}`,
            `Follow-up nudges sent: ${formatNumber(networkingExperience.followUpsSent)}`,
          ],
        },
        {
          name: 'Attendance controls',
          sectionId: 'networking-attendance-controls',
          bulletPoints: [
            `No-show rate: ${formatPercent(networkingPenalties.noShowRate)}`,
            `Active penalties: ${formatNumber(networkingPenalties.activePenalties)}`,
            `Restricted attendees: ${formatNumber(networkingPenalties.restrictedParticipants)}`,
            networkingPenalties.cooldownDays
              ? `Cooldown window: ${formatNumber(networkingPenalties.cooldownDays, { suffix: ' days' })}`
              : 'Set cooldown windows to auto-manage repeat no-shows.',
          ],
        },
      ],
    },
    {
      id: 'settings-governance',
      title: 'Governance & operations',
      description: 'Keep calendars, permissions, and compliance health in lockstep with recruiting velocity.',
      features: [
        {
          name: 'Calendar & comms',
          sectionId: 'calendar-communications',
          bulletPoints: [
            `Events this week: ${formatNumber(calendar.upcoming?.length)}`,
            calendar.upcoming?.[0]?.startsAt
              ? `Next event: ${formatAbsolute(calendar.upcoming[0].startsAt)}`
              : 'Connect recruiting calendars to show upcoming milestones.',
            `Pending escalations: ${formatNumber(calendar.pendingEscalations)}`,
            calendar.weeklyDigest?.highlights?.[0] ?? 'Weekly digests summarise pipeline changes for stakeholders.',
          ],
        },
        {
          name: 'Permissions & governance',
          sectionId: 'settings-governance',
          bulletPoints: [
            `Pending approvals: ${formatNumber(governance.pendingApprovals)}`,
            `Critical alerts: ${formatNumber(governance.criticalAlerts)}`,
            governance.timezone ? `Primary timezone: ${governance.timezone}` : 'Set a default timezone for scheduling.',
            `Workspace active: ${governance.workspaceActive ? 'Yes' : 'No'}`,
          ],
        },
        {
          name: 'Candidate care',
          sectionId: 'candidate-care-center',
          bulletPoints: [
            `Survey responses: ${formatNumber(candidateExperience.responseCount)}`,
            `Candidate NPS: ${
              candidateExperience.nps != null && Number.isFinite(Number(candidateExperience.nps))
                ? Number(candidateExperience.nps).toFixed(1)
                : '—'
            }`,
            `Open care tickets: ${formatNumber(candidateCare.escalations)}`,
            `Follow-ups pending: ${formatNumber(candidateCare.followUpsPending)}`,
          ],
        },
      ],
    },
    {
      id: 'offer-onboarding',
      title: 'Offer bridge & onboarding',
      description: 'Coordinate approvals, background checks, and day-one readiness with confidence.',
      features: [
        {
          name: 'Offer health',
          sectionId: 'offer-onboarding',
          bulletPoints: [
            `Open offers: ${formatNumber(offer.openOffers)}`,
            `Acceptance rate: ${formatPercent(offer.acceptanceRate)}`,
            `Approvals pending: ${formatNumber(offer.approvalsPending)}`,
            `Average days to start: ${formatNumber(offer.averageDaysToStart, { suffix: ' days' })}`,
          ],
        },
      ],
    },
  ];
}

function BrandAndPeopleSection({ data }) {
  const employerBrandStudio = data?.employerBrandStudio ?? null;
  const employeeJourneys = data?.employeeJourneys ?? null;
  const settingsGovernance = data?.settingsGovernance ?? null;
  const pageWorkspace = employerBrandStudio?.pages ?? data?.pageWorkspace ?? null;

  if (!employerBrandStudio && !employeeJourneys && !settingsGovernance) {
    return null;
  }

  const brandMetrics = [
    {
      label: 'Profile completeness',
      value: formatPercent(employerBrandStudio?.profileCompleteness),
    },
    {
      label: 'Published assets',
      value: formatNumber(employerBrandStudio?.publishedAssets),
    },
    {
      label: 'Avg asset engagement',
      value: formatNumber(employerBrandStudio?.averageAssetEngagement),
    },
    {
      label: 'Stories live',
      value: formatNumber(employerBrandStudio?.stories?.published),
    },
  ];

  const journeyMetrics = [
    {
      label: 'Active programs',
      value: formatNumber(employeeJourneys?.totalPrograms),
    },
    {
      label: 'Employees enrolled',
      value: formatNumber(employeeJourneys?.activeEmployees),
    },
    {
      label: 'Avg completion',
      value: formatPercent(employeeJourneys?.averageCompletionRate),
    },
    {
      label: 'Programs at risk',
      value: formatNumber(employeeJourneys?.programsAtRisk),
    },
  ];

  const governanceMetrics = [
    {
      label: 'Calendar connections',
      value: `${formatNumber(settingsGovernance?.calendar?.connected)} / ${formatNumber(
        settingsGovernance?.calendar?.totalConnections,
      )}`,
      helper: 'Active / total connections',
    },
    {
      label: 'Integrations live',
      value: `${formatNumber(settingsGovernance?.integrations?.connected)} / ${formatNumber(
        settingsGovernance?.integrations?.total,
      )}`,
      helper: 'Connected integrations',
    },
    {
      label: 'Pending invites',
      value: formatNumber(settingsGovernance?.permissions?.pendingInvites),
    },
    {
      label: 'Critical alerts',
      value: formatNumber(settingsGovernance?.compliance?.criticalAlerts),
    },
  ];

  const healthBadgeStyles = {
    on_track: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
    at_risk: 'bg-amber-50 text-amber-600 border border-amber-200',
    needs_attention: 'bg-orange-50 text-orange-600 border border-orange-200',
    off_track: 'bg-rose-50 text-rose-600 border border-rose-200',
  };

  const pageMetrics = [
    {
      label: 'Pages live',
      value: formatNumber(pageWorkspace?.live ?? pageWorkspace?.published ?? 0),
      helper: 'Publicly available',
    },
    {
      label: 'Drafts in review',
      value: formatNumber(pageWorkspace?.inReview ?? pageWorkspace?.drafts ?? 0),
      helper: 'Awaiting approvals',
    },
    {
      label: 'Avg conversion',
      value: formatPercent(pageWorkspace?.averageConversionRate ?? pageWorkspace?.conversionRate ?? 0),
      helper: 'Explorer to lead',
    },
    {
      label: 'Follower reach',
      value: formatNumber(pageWorkspace?.totalFollowers ?? pageWorkspace?.followers ?? 0),
      helper: 'Across all pages',
    },
  ];

  const upcomingPageLaunches = pageWorkspace?.upcomingLaunches ?? pageWorkspace?.upcoming ?? [];
  const governanceSignals = pageWorkspace?.governance ?? {};

  return (
    <section
      id="brand-and-people"
      className="space-y-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_-24px_rgba(30,64,175,0.35)] sm:p-8"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Brand &amp; people</h2>
          <p className="mt-1 text-sm text-slate-600">
            Showcase your employer brand, orchestrate employee journeys, and keep governance signals in one place.
          </p>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-600">
          Workspace programs
        </span>
      </div>

      <div id="employer-brand-studio" className="space-y-4 rounded-3xl border border-blue-100 bg-blue-50/40 p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-blue-900">Employer brand studio</h3>
            <p className="text-sm text-blue-700">
              Publish culture stories, benefits, and assets to elevate your employer reputation.
            </p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {brandMetrics.map((metric) => (
            <div key={metric.label} className="rounded-2xl bg-white/70 p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">{metric.label}</p>
              <p className="mt-2 text-xl font-semibold text-blue-900">{metric.value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-blue-100 bg-white/80 p-4">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-blue-700">Top culture stories</h4>
            {employerBrandStudio?.stories?.topStories?.length ? (
              <ul className="mt-3 space-y-3">
                {employerBrandStudio.stories.topStories.map((story) => (
                  <li key={story.id} className="rounded-xl border border-blue-100 bg-blue-50/60 p-3">
                    <p className="text-sm font-semibold text-blue-900">{story.title}</p>
                    <p className="text-xs text-blue-700">{story.tagline ?? story.category ?? 'Story'}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-blue-700">Publish stories to showcase culture moments across teams.</p>
            )}

            {employerBrandStudio?.benefits?.featured?.length ? (
              <div className="mt-4 space-y-2">
                {employerBrandStudio.benefits.featured.map((benefit) => (
                  <div key={benefit.id} className="rounded-xl border border-blue-100 bg-blue-50/60 p-3">
                    <p className="text-sm font-semibold text-blue-900">{benefit.title}</p>
                    <p className="text-xs text-blue-700">{benefit.category}</p>
                  </div>
                ))}
              </div>
            ) : null}

            {employerBrandStudio?.highlights?.length ? (
              <ul className="mt-4 space-y-1 text-sm text-blue-800">
                {employerBrandStudio.highlights.map((highlight) => (
                  <li key={highlight} className="flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div id="brand-pages" className="space-y-4 rounded-3xl border border-indigo-100 bg-indigo-50/40 p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-xl font-semibold text-indigo-900">Public pages studio</h3>
                <p className="text-sm text-indigo-700">
                  Publish high-converting company and program destinations with approval workflows and analytics baked in.
                </p>
                {pageWorkspace?.lastPublishedAt ? (
                  <p className="mt-1 text-xs text-indigo-600">
                    Last launch {formatRelativeTime(pageWorkspace.lastPublishedAt)}
                  </p>
                ) : null}
              </div>
              <Link
                to="/pages"
                className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white/70 px-4 py-2 text-xs font-semibold text-indigo-700 transition hover:border-indigo-400 hover:text-indigo-900"
              >
                Open page studio
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {pageMetrics.map((metric) => (
                <div key={metric.label} className="rounded-2xl bg-white/80 p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">{metric.label}</p>
                  <p className="mt-2 text-xl font-semibold text-indigo-900">{metric.value}</p>
                  <p className="mt-1 text-xs text-indigo-600">{metric.helper}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-indigo-100 bg-white/80 p-4">
                <h4 className="text-sm font-semibold uppercase tracking-wide text-indigo-700">Upcoming launches</h4>
                <ul className="mt-3 space-y-3 text-sm text-indigo-800">
                  {upcomingPageLaunches.slice(0, 4).map((item, index) => (
                    <li
                      key={item.id ?? item.slug ?? index}
                      className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-3"
                    >
                      <p className="text-sm font-semibold text-indigo-900">{item.title ?? item.name ?? 'Launch'}</p>
                      <p className="mt-1 text-xs text-indigo-600">
                        {item.launchDate ? `Launch ${formatAbsolute(item.launchDate)}` : 'Scheduling in progress'}
                        {item.owner ? ` • Owner ${item.owner}` : ''}
                      </p>
                      {item.status ? (
                        <span className="mt-2 inline-flex rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-indigo-700">
                          {item.status.replace(/_/g, ' ')}
                        </span>
                      ) : null}
                    </li>
                  ))}
                  {!upcomingPageLaunches.length ? (
                    <li className="rounded-2xl border border-dashed border-indigo-200 bg-white/70 p-4 text-xs text-indigo-600">
                      No launches queued—create a page to start capturing demand.
                    </li>
                  ) : null}
                </ul>
              </div>

              <div className="rounded-2xl border border-indigo-100 bg-white/80 p-4">
                <h4 className="text-sm font-semibold uppercase tracking-wide text-indigo-700">Governance guardrails</h4>
                <ul className="mt-3 space-y-2 text-sm text-indigo-700">
                  <li className="flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-500" />
                    Brand compliance status: {governanceSignals.brand ?? 'Aligned'}
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-500" />
                    Accessibility automation: {governanceSignals.accessibility ?? 'AA contrast checks active'}
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-500" />
                    Privacy reviews pending: {formatNumber(governanceSignals.privacyPending ?? 0)}
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-500" />
                    Approvers assigned: {formatNumber(governanceSignals.approvers ?? governanceSignals.reviewers ?? 0)}
                  </li>
                </ul>
                <p className="mt-3 text-xs text-indigo-600">
                  Guardrails sync with Trust Centre policies and automatically enforce on every publish.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div id="employee-journeys" className="space-y-4 rounded-3xl border border-emerald-100 bg-emerald-50/40 p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-emerald-900">Employee journeys</h3>
            <p className="text-sm text-emerald-700">
              Monitor onboarding, mobility, and performance programs for your workforce.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {journeyMetrics.map((metric) => (
            <div key={metric.label} className="rounded-2xl bg-white/80 p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-500">{metric.label}</p>
              <p className="mt-2 text-xl font-semibold text-emerald-900">{metric.value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-white/80 p-4">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Programs spotlight</h4>
          {employeeJourneys?.spotlightPrograms?.length ? (
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-left text-sm text-emerald-900">
                <thead>
                  <tr className="text-xs uppercase tracking-wide text-emerald-600">
                    <th className="px-3 py-2">Program</th>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">Health</th>
                    <th className="px-3 py-2">Active</th>
                    <th className="px-3 py-2">Completion</th>
                  </tr>
                </thead>
                <tbody>
                  {employeeJourneys.spotlightPrograms.map((program) => (
                    <tr key={program.id} className="border-t border-emerald-100">
                      <td className="px-3 py-2">
                        <p className="font-semibold">{program.title}</p>
                        <p className="text-xs text-emerald-600">{program.ownerName ?? 'No owner assigned'}</p>
                      </td>
                      <td className="px-3 py-2 capitalize">{program.programType?.replace(/_/g, ' ')}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            healthBadgeStyles[program.healthStatus] ?? 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {program.healthStatus?.replace(/_/g, ' ') ?? 'unknown'}
                        </span>
                      </td>
                      <td className="px-3 py-2">{formatNumber(program.activeEmployees)}</td>
                      <td className="px-3 py-2">{formatPercent(program.completionRate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-2 text-sm text-emerald-700">
              Activate onboarding or mobility journeys to track progress and surface insights.
            </p>
          )}

          {employeeJourneys?.highlights?.length ? (
            <ul className="mt-4 space-y-1 text-sm text-emerald-800">
              {employeeJourneys.highlights.map((highlight) => (
                <li key={highlight} className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      <div id="settings-governance" className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">Settings &amp; governance</h3>
            <p className="text-sm text-slate-600">
              Keep integrations healthy, calendar syncs current, and permissions aligned with policy.
            </p>
          </div>
          <Link
            to="/dashboard/company/integrations"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-accent hover:text-accent"
          >
            Open integration command center
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {governanceMetrics.map((metric) => (
            <div key={metric.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{metric.label}</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">{metric.value}</p>
              {metric.helper ? <p className="mt-1 text-xs text-slate-500">{metric.helper}</p> : null}
            </div>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Calendar sync</h4>
            <p className="mt-1 text-sm text-slate-600">
              Last synced {settingsGovernance?.calendar?.lastSyncedAt ? formatRelativeTime(settingsGovernance.calendar.lastSyncedAt) : '—'}
            </p>
            {settingsGovernance?.calendar?.primaryCalendars?.length ? (
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                {settingsGovernance.calendar.primaryCalendars.map((calendar) => (
                  <li
                    key={`${calendar.providerKey}-${calendar.primaryCalendar}`}
                    className="flex flex-col rounded-xl bg-slate-50 p-3"
                  >
                    <span className="font-semibold">{calendar.primaryCalendar}</span>
                    <span className="text-xs uppercase tracking-wide text-slate-500">{calendar.providerKey}</span>
                    <span className="mt-1 text-xs text-slate-500">Status: {calendar.status}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-slate-600">Connect a recruiting calendar to surface interview visibility.</p>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Integrations</h4>
            {settingsGovernance?.integrations?.categories?.length ? (
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                {settingsGovernance.integrations.categories.map((category) => (
                  <li key={category.category} className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                    <span className="capitalize">{category.category.replace(/_/g, ' ')}</span>
                    <span className="text-sm font-semibold text-slate-900">{formatNumber(category.count)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-slate-600">Connect HRIS, communication, and ATS integrations to streamline automation.</p>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Highlights</h4>
            {settingsGovernance?.highlights?.length ? (
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                {settingsGovernance.highlights.map((highlight) => (
                  <li key={highlight} className="flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-slate-600">Add integrations and finalize approvals to surface governance insights.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
export default function CompanyDashboardPage() {
  const { session, isAuthenticated } = useSession();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const workspaceIdParam = searchParams.get('workspaceId');
  const workspaceSlugParam = searchParams.get('workspaceSlug');
  const lookbackParam = searchParams.get('lookbackDays');
  const lookbackDays = lookbackParam ? Math.max(Number.parseInt(lookbackParam, 10) || 30, 7) : 30;

  const membershipsList = session?.memberships ?? [];
  const isCompanyMember = isAuthenticated && membershipsList.includes('company');

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    if (!isCompanyMember) {
      const fallback = session?.primaryDashboard ?? membershipsList.find((role) => role !== 'company');
      if (fallback) {
        navigate(`/dashboard/${fallback}`, { replace: true, state: { from: '/dashboard/company' } });
      }
    }
  }, [isAuthenticated, isCompanyMember, navigate, session?.primaryDashboard, membershipsList]);

  const { data, error, loading, refresh, fromCache, lastUpdated, summaryCards } = useCompanyDashboard({
    workspaceId: workspaceIdParam,
    workspaceSlug: workspaceSlugParam,
    lookbackDays,
    enabled: isAuthenticated && isCompanyMember,
  });

  useEffect(() => {
    if (!workspaceIdParam && data?.meta?.selectedWorkspaceId) {
      setSearchParams((previous) => {
        const next = new URLSearchParams(previous);
        next.set('workspaceId', `${data.meta.selectedWorkspaceId}`);
        return next;
      }, { replace: true });
    }
  }, [workspaceIdParam, data?.meta?.selectedWorkspaceId, setSearchParams]);

  const sections = useMemo(() => buildSections(data), [data]);
  const profile = useMemo(() => buildProfile(data, summaryCards), [data, summaryCards]);
  const workspaceOptions = data?.meta?.availableWorkspaces ?? [];
  const activeWorkspaceId = data?.meta?.selectedWorkspaceId ?? workspaceIdParam ?? data?.workspace?.id ?? null;
  const memberships = data?.memberships ?? data?.meta?.memberships ?? membershipsList;
  const enrichedSummaryCards = useMemo(() => summaryCards ?? [], [summaryCards]);

  const networkingCta = {
    href: '/dashboard/company/networking',
    label: 'Open networking command center',
  };

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

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ redirectTo: '/dashboard/company' }} />;
  }

  if (!isCompanyMember) {
    return (
      <DashboardLayout
        currentDashboard="company"
        title="Company Talent Acquisition Hub"
        subtitle="Integrated ATS & partnerships"
        description="Everything hiring teams need to design jobs, run interviews, collaborate with headhunters, and promote a magnetic employer brand on Gigvora."
        menuSections={menuSections}
        availableDashboards={availableDashboards}
      >
        <AccessDeniedPanel
          availableDashboards={membershipsList.filter((membership) => membership !== 'company')}
          onNavigate={(dashboard) => navigate(`/dashboard/${dashboard}`)}
        />
      </DashboardLayout>
    );
  }

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
        <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-4">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400" htmlFor="workspace-select">
              Workspace
            </label>
            <select
              id="workspace-select"
              value={data?.meta?.selectedWorkspaceId ?? workspaceIdParam ?? ''}
              onChange={handleWorkspaceChange}
              className="min-w-[180px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
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
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              {LOOKBACK_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  Last {option} days
                </option>
              ))}
            </select>
          </div>

          <DataStatus
            loading={loading}
            fromCache={fromCache}
            lastUpdated={lastUpdated}
            onRefresh={() => refresh({ force: true })}
          />
        </div>

        {error ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50/70 p-6 text-sm text-rose-700">
            {error.message || 'Unable to load company dashboard data.'}
          </div>
        ) : null}

        <CompanyDashboardOverviewSection
          overview={data?.overview}
          profile={profile}
          workspace={data?.workspace}
          onOverviewUpdated={() => refresh({ force: true })}
        />

        <SummaryCardGrid cards={enrichedSummaryCards} />

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Workspace memberships</h2>
          <p className="mt-1 text-sm text-slate-600">
            Cross-functional collaborators gain tailored permissions and dashboards per membership.
          </p>
          <div className="mt-4">
            <MembershipHighlights memberships={memberships} />
          </div>
        </div>

        <PartnershipsSourcingSection data={data?.partnerships} />

        {data ? (
          <JobLifecycleSection
            jobLifecycle={data.jobLifecycle}
            recommendations={data.recommendations}
            lookbackDays={data?.meta?.lookbackDays ?? lookbackDays}
          />
        ) : null}

        <section
          id="interview-excellence"
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_-24px_rgba(30,64,175,0.35)] sm:p-8"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Interview excellence & candidate experience</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-600">
                Run structured interviews, automate reminders, manage prep portals, and monitor offer and care workflows.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-600">
                Interview workspace
              </span>
              <a
                href={networkingCta.href}
                className="inline-flex items-center gap-2 rounded-full border border-accent/40 px-4 py-2 text-xs font-semibold text-accent transition hover:border-accent hover:bg-accent/5"
              >
                {networkingCta.label}
              </a>
            </div>
          </div>

          <div className="mt-6">
            <InterviewExperienceSection
              data={data?.interviewExperience}
              interviewOperations={data?.interviewOperations}
              candidateExperience={data?.candidateExperience}
              offerOnboarding={data?.offerOnboarding}
            />
          </div>
        </section>

        <TimelineManagementSection
          id="timeline-management"
          workspaceId={activeWorkspaceId}
          lookbackDays={lookbackDays}
          data={data?.timelineManagement}
          onRefresh={refresh}
        />

        <BrandAndPeopleSection data={data} />

        {sections.map((section) => (
          <section
            key={section.id}
            id={section.id}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_-24px_rgba(30,64,175,0.35)] sm:p-8"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">{section.title}</h2>
                {section.description ? (
                  <p className="mt-2 max-w-3xl text-sm text-slate-600">{section.description}</p>
                ) : null}
              </div>
            </div>

            {section.features?.length ? (
              <div className={`mt-6 grid gap-4 ${section.features.length > 1 ? 'lg:grid-cols-3' : 'lg:grid-cols-1'}`}>
                {section.features.map((feature) => (
                  <div
                    key={feature.name}
                    id={feature.sectionId}
                    className="group flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:border-accent/40 hover:bg-accent/5"
                  >
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{feature.name}</h3>
                      {feature.description ? (
                        <p className="mt-2 text-sm text-slate-600">{feature.description}</p>
                      ) : null}
                      {feature.bulletPoints?.length ? (
                        <ul className="mt-3 space-y-2 text-sm text-slate-600">
                          {feature.bulletPoints.map((point, index) => (
                            <li key={`${feature.name}-${index}`} className="flex gap-2">
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
            ) : null}

            {section.details?.length ? (
              <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {section.details.map((detail) => (
                  <div
                    key={detail.title}
                    className="flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div>
                      {detail.subtitle ? (
                        <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">{detail.subtitle}</p>
                      ) : null}
                      <h3 className="mt-2 text-lg font-semibold text-slate-900">{detail.title}</h3>
                      {detail.items?.length ? (
                        <ul className="mt-3 space-y-2 text-sm text-slate-600">
                          {detail.items.map((item, index) => (
                            <li key={`${detail.title}-${index}`} className="flex gap-2">
                              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </section>
        ))}

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-2xl font-semibold text-slate-900">Partner timeline</h2>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-600">
              Recent activity
            </span>
          </div>
          <ActivityTimeline items={data?.recentNotes ?? []} />
        </section>
      </div>
    </DashboardLayout>
  );
}
