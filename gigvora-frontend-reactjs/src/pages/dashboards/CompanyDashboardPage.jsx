import { useEffect, useMemo } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
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
import { useCompanyDashboard } from '../../hooks/useCompanyDashboard.js';
import { useSession } from '../../context/SessionContext.jsx';
import { formatAbsolute, formatRelativeTime } from '../../utils/date.js';

const menuSections = [
  {
    label: 'Talent acquisition',
    items: [
      {
        name: 'Hiring overview',
        description: 'Pipeline health, hiring velocity, diversity metrics, and alerts.',
        sectionId: 'hiring-overview',
      },
      {
        name: 'Job lifecycle & ATS intelligence',
        description:
          'Run a modern applicant tracking system with collaborative job creation, smart sourcing, and full-funnel insights.',
        tags: ['ATS'],
        sectionId: 'job-lifecycle-ats-intelligence',
      },
      {
        name: 'Interview excellence & candidate experience',
        description: 'Structured guides, scheduling automation, and feedback collaboration for every interview panel.',
        sectionId: 'interview-excellence',
      },
      {
        name: 'Offer & onboarding bridge',
        description: 'Generate offers, track approvals, manage background checks, and orchestrate onboarding tasks.',
        sectionId: 'offer-onboarding',
      },
      {
        name: 'Candidate care center',
        description: 'Monitor response times, candidate NPS, and inclusion metrics to deliver a world-class experience.',
        sectionId: 'candidate-care-center',
      },
    ],
  },
  {
    label: 'Design & sourcing',
    items: [
      {
        name: 'Job design studio',
        description: 'Craft requisitions with intake surveys, leveling frameworks, compensation guidelines, and approvals.',
        sectionId: 'job-design-studio',
      },
      {
        name: 'Multi-channel sourcing',
        description:
          'Publish to Gigvora, job boards, employee referrals, and talent pools with personalised landing pages and reporting.',
        sectionId: 'multi-channel-sourcing',
      },
      {
        name: 'Applicant relationship manager',
        description: 'Segment candidates, send nurture campaigns, and manage compliance across GDPR, CCPA, and internal policies.',
        sectionId: 'applicant-relationship-manager',
      },
    ],
  },
  {
    label: 'Networking & community',
    items: [
      {
        name: 'Networking sessions',
        description: 'Launch and monitor speed networking programs with configurable rotations and join limits.',
        sectionId: 'networking-sessions',
        href: '/dashboard/company/networking',
      },
      {
        name: 'Attendee experience',
        description: 'Digital business cards, profile sharing, and chat tools keep every connection actionable.',
        sectionId: 'networking-attendee-experience',
        href: '/dashboard/company/networking',
      },
      {
        name: 'Attendance controls',
        description: 'Automate penalties for repeated no-shows and manage eligibility for future sessions.',
        sectionId: 'networking-attendance-controls',
        href: '/dashboard/company/networking',
      },
    ],
  },
  {
    label: 'Analytics & planning',
    items: [
      {
        name: 'Analytics & forecasting',
        description: 'Predict time-to-fill, offer acceptance, and pipeline conversion to forecast headcount.',
        sectionId: 'analytics-forecasting',
      },
      {
        name: 'Workforce analytics',
        description: 'Blend hiring and HRIS data to uncover attrition risks, mobility opportunities, and skill gaps.',
        sectionId: 'workforce-analytics',
      },
      {
        name: 'Scenario planning',
        description: 'Model hiring freezes or acceleration plans with interactive dashboards by department, level, or location.',
        sectionId: 'scenario-planning',
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
        sectionId: 'partner-performance-manager',
      },
    ],
  },
  {
    label: 'Brand & people',
    items: [
      {
        name: 'Employer brand & workforce intelligence',
        description: 'Promote your culture, understand workforce trends, and connect hiring with employee experience data.',
        sectionId: 'employer-brand-workforce',
      },
      {
        name: 'Employer brand studio',
        description: 'Company profile, culture stories, benefits, and employer marketing assets.',
        sectionId: 'employer-brand-studio',
      },
      {
        name: 'Employee journeys',
        description: 'Onboarding, internal mobility, and performance snapshots for HR teams.',
        sectionId: 'employee-journeys',
      },
      {
        name: 'Settings & governance',
        description: 'Calendar sync, permissions, integrations, compliance, and approvals.',
        sectionId: 'settings-governance',
      },
    ],
  },
  {
    label: 'Operations & governance',
    items: [
      {
        name: 'Calendar & communications',
        description: 'Sync recruiting calendars, digests, integrations, and cross-functional updates.',
        sectionId: 'calendar-communications',
      },
      {
        name: 'Settings & governance',
        description: 'Permissions, integrations, compliance, and approval workflows.',
        sectionId: 'settings-governance',
      },
      {
        name: 'Governance & compliance',
        description: 'Maintain GDPR/CCPA compliance, accessibility standards, and equitable hiring policies.',
        sectionId: 'governance-compliance',
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
        <div key={item.id ?? `${item.note}-${item.createdAt}`}
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

function AccessDeniedPanel({ availableDashboards, onNavigate }) {
  return (
    <div className="rounded-3xl border border-rose-200 bg-rose-50/70 p-6 text-slate-700">
      <h2 className="text-xl font-semibold text-rose-700">Access restricted</h2>
      <p className="mt-2 text-sm">
        The company talent acquisition hub is only available to workspace members with the company role. Contact your
        administrator to request access or switch to another dashboard below.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        {(availableDashboards ?? []).map((dashboard) => (
          <button
            key={dashboard}
            type="button"
            onClick={() => onNavigate?.(dashboard)}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
          >
            Switch to {dashboard.charAt(0).toUpperCase() + dashboard.slice(1)} dashboard
          </button>
        ))}
      </div>
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
    ? alerts.items.slice(0, 4).map((item) => `${item.title ?? item.type ?? 'Alert'} • ${formatRelativeTime(item.detectedAt)}`)
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
          items: recommendedActions.length ? recommendedActions : ['Keep activity flowing to surface playbook suggestions.'],
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

export default function CompanyDashboardPage() {
  const { session, isAuthenticated } = useSession();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const workspaceIdParam = searchParams.get('workspaceId');
  const workspaceSlugParam = searchParams.get('workspaceSlug');
  const lookbackParam = searchParams.get('lookbackDays');
  const lookbackDays = lookbackParam ? Math.max(Number.parseInt(lookbackParam, 10) || 30, 7) : 30;

  const isCompanyMember = isAuthenticated && (session?.memberships ?? []).includes('company');

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    if (!isCompanyMember) {
      const fallback = session?.primaryDashboard ?? session?.memberships?.find((role) => role !== 'company');
      if (fallback) {
        navigate(`/dashboard/${fallback}`, { replace: true, state: { from: '/dashboard/company' } });
      }
    }
  }, [isAuthenticated, isCompanyMember, navigate, session?.primaryDashboard, session?.memberships]);

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
          availableDashboards={(session?.memberships ?? []).filter((membership) => membership !== 'company')}
          onNavigate={(dashboard) => navigate(`/dashboard/${dashboard}`)}
        />
      </DashboardLayout>
    );
  }

  const {
    data,
    error,
    loading,
    refresh,
    fromCache,
    lastUpdated,
    summaryCards,
  } = useCompanyDashboard({
    workspaceId: workspaceIdParam,
    workspaceSlug: workspaceSlugParam,
    lookbackDays,
    enabled: isCompanyMember,
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
  const memberships = data?.memberships ?? data?.meta?.memberships ?? [];
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

          <DataStatus loading={loading} fromCache={fromCache} lastUpdated={lastUpdated} onRefresh={() => refresh({ force: true })} />
        </div>

        {error ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50/70 p-6 text-sm text-rose-700">
            {error.message || 'Unable to load company dashboard data.'}
          </div>
        ) : null}

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
