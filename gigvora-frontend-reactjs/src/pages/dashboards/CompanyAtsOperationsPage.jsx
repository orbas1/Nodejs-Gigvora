import { useEffect, useMemo } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ChartBarIcon,
  ClockIcon,
  SparklesIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
  SignalIcon,
  ChartPieIcon,
} from '@heroicons/react/24/outline';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import DataStatus from '../../components/DataStatus.jsx';
import JobLifecycleSection from '../../components/company/JobLifecycleSection.jsx';
import InterviewExperienceSection from '../../components/dashboard/InterviewExperienceSection.jsx';
import AccessDeniedPanel from '../../components/dashboard/AccessDeniedPanel.jsx';
import { useCompanyDashboard } from '../../hooks/useCompanyDashboard.js';
import { useSession } from '../../context/SessionContext.jsx';
import { COMPANY_DASHBOARD_MENU_SECTIONS } from '../../constants/companyDashboardMenu.js';
import { formatRelativeTime } from '../../utils/date.js';

const LOOKBACK_OPTIONS = [30, 60, 90, 120];

function formatNumber(value, { fallback = '—', decimals = null, suffix = '' } = {}) {
  if (value == null || Number.isNaN(Number(value))) {
    return fallback;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
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

function buildProfile(data) {
  const workspace = data?.workspace ?? {};
  const profile = data?.profile ?? {};
  const displayName = profile.companyName ?? workspace.name ?? 'Company workspace';
  const initials = displayName
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return {
    name: displayName,
    role: 'Talent acquisition workspace',
    initials: initials || 'CO',
    status: workspace.health?.statusLabel ?? 'Monitoring hiring performance',
    badges: workspace.health?.badges ?? [],
    metrics: [
      {
        label: 'Open requisitions',
        value: formatNumber(data?.jobSummary?.total ?? data?.jobSummary?.active ?? 0),
      },
      {
        label: 'Active candidates',
        value: formatNumber(data?.pipelineSummary?.totals?.applications ?? 0),
      },
    ],
  };
}

function buildAtsSummary(jobLifecycle, candidateExperience, interviewOperations) {
  const atsHealth = jobLifecycle?.atsHealth ?? {};
  return [
    {
      label: 'Active requisitions',
      value: formatNumber(atsHealth.activeRequisitions ?? jobLifecycle?.totalStages ?? 0),
      helper: 'Open across this workspace',
      icon: ChartBarIcon,
    },
    {
      label: 'Maturity score',
      value: formatPercent(atsHealth.maturityScore),
      helper: atsHealth.readinessTier
        ? `${atsHealth.readinessTier.replace(/_/g, ' ')} tier`
        : 'Lifecycle readiness tier',
      icon: ChartPieIcon,
    },
    {
      label: 'Automation coverage',
      value: formatPercent(atsHealth.automationCoverage),
      helper: `${formatNumber(jobLifecycle?.stagePerformance?.length ?? 0)} stages instrumented`,
      icon: SparklesIcon,
    },
    {
      label: 'Template coverage',
      value: formatPercent(atsHealth.templateCoverage),
      helper: 'Interview templates aligned to stages',
      icon: SignalIcon,
    },
    {
      label: 'Pending approvals',
      value: formatNumber(jobLifecycle?.pendingApprovals),
      helper:
        jobLifecycle?.overdueApprovals && jobLifecycle.overdueApprovals > 0
          ? `${formatNumber(jobLifecycle.overdueApprovals)} overdue`
          : 'All approvals on track',
      icon: ShieldCheckIcon,
    },
    {
      label: 'Data freshness',
      value:
        atsHealth.dataFreshnessHours != null
          ? `${formatNumber(atsHealth.dataFreshnessHours, { decimals: 1 })} hrs`
          : '—',
      helper: atsHealth.lastUpdatedAt ? `Updated ${formatRelativeTime(atsHealth.lastUpdatedAt)}` : 'Awaiting recent sync',
      icon: ArrowPathIcon,
    },
    {
      label: 'Upcoming interviews',
      value: formatNumber(atsHealth.upcomingInterviews ?? interviewOperations?.upcomingCount ?? 0),
      helper:
        interviewOperations?.averageLeadTimeHours != null
          ? `Lead time ${formatNumber(interviewOperations.averageLeadTimeHours, { decimals: 1, suffix: ' hrs' })}`
          : 'Lead time pending',
      icon: ClockIcon,
    },
    {
      label: 'Candidate NPS',
      value: formatNumber(candidateExperience?.nps, { decimals: 1 }),
      helper: `${formatNumber(candidateExperience?.responseCount ?? 0)} responses`,
      icon: SparklesIcon,
    },
  ];
}

function SummaryGrid({ metrics }) {
  if (!metrics?.length) {
    return null;
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {metrics.map((metric) => {
        const Icon = metric.icon ?? ChartBarIcon;
        return (
          <div
            key={metric.label}
            className="flex h-full flex-col justify-between rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-5 shadow-sm"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{metric.label}</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{metric.value}</p>
                {metric.helper ? <p className="mt-1 text-xs text-slate-500">{metric.helper}</p> : null}
              </div>
              <div className="rounded-2xl bg-white p-3 text-blue-600 shadow-sm">
                <Icon className="h-6 w-6" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CandidateExperienceHighlights({ candidateExperience, candidateCare, enterpriseReadiness, atsHealth }) {
  const experienceHealth = enterpriseReadiness?.health?.experience ?? atsHealth?.overallHealthStatus;
  const inclusionScore = enterpriseReadiness?.experience?.inclusionScore ?? atsHealth?.inclusionScore;
  const metrics = [
    {
      label: 'Avg satisfaction',
      value: formatNumber(candidateExperience?.averageScore, { decimals: 1 }),
      helper: `${formatNumber(candidateExperience?.responseCount ?? 0)} surveys`,
    },
    {
      label: 'Follow-ups pending',
      value: formatNumber(candidateExperience?.followUpsPending),
      helper: 'Awaiting recruiter outreach',
    },
    {
      label: 'Open care tickets',
      value: formatNumber(candidateCare?.openTickets),
      helper:
        candidateCare?.averageResponseMinutes != null
          ? `Response ${formatNumber(candidateCare.averageResponseMinutes, { decimals: 0 })} mins`
          : 'Response time not captured',
    },
    {
      label: 'Escalations',
      value: formatNumber(candidateCare?.escalations),
      helper: candidateCare?.escalations ? 'Resolve escalated cases promptly' : 'No escalations in queue',
    },
    inclusionScore != null
      ? {
          label: 'Inclusion score',
          value: formatPercent(inclusionScore),
          helper: experienceHealth ? `Experience status ${experienceHealth.replace(/_/g, ' ')}` : 'Monitor inclusion metrics',
        }
      : null,
  ].filter((metric) => metric && metric.value !== '—');

  if (!metrics.length) {
    return null;
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_-24px_rgba(30,64,175,0.35)]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Candidate experience guardrails</h2>
          <p className="mt-1 text-sm text-slate-600">
            Monitor satisfaction, response times, and escalations to deliver enterprise-ready hiring journeys.
          </p>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-600">
          Experience signals
        </span>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{metric.label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{metric.value}</p>
            <p className="mt-2 text-xs text-slate-500">{metric.helper}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function CompanyAtsOperationsPage() {
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
        navigate(`/dashboard/${fallback}`, { replace: true, state: { from: '/dashboard/company/ats' } });
      }
    }
  }, [isAuthenticated, isCompanyMember, navigate, session?.primaryDashboard, membershipsList]);

  const { data, error, loading, refresh, fromCache, lastUpdated } = useCompanyDashboard({
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

  const profile = useMemo(() => buildProfile(data), [data]);
  const workspaceOptions = data?.meta?.availableWorkspaces ?? [];
  const atsMetrics = useMemo(
    () => buildAtsSummary(data?.jobLifecycle, data?.candidateExperience, data?.interviewOperations),
    [data?.jobLifecycle, data?.candidateExperience, data?.interviewOperations],
  );
  const candidateCare = data?.candidateCare;

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
    return <Navigate to="/login" replace state={{ redirectTo: '/dashboard/company/ats' }} />;
  }

  if (!isCompanyMember) {
    return (
      <DashboardLayout
        currentDashboard="company"
        title="Company Talent Acquisition Hub"
        subtitle="ATS command center"
        description="Enterprise-grade orchestration for requisitions, interviews, approvals, and candidate experience."
        menuSections={COMPANY_DASHBOARD_MENU_SECTIONS}
        availableDashboards={['user', 'freelancer', 'agency']}
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
      title="ATS operations"
      subtitle="Enterprise hiring control center"
      description="Monitor lifecycle readiness, interview orchestration, and candidate care with secure enterprise guardrails."
      menuSections={COMPANY_DASHBOARD_MENU_SECTIONS}
      profile={profile}
      availableDashboards={['company', 'agency', 'headhunter', 'user', 'freelancer']}
      activeMenuItem="job-lifecycle-ats-intelligence"
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
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              <option value="">Primary workspace</option>
              {workspaceOptions.map((option) => (
                <option key={option.id ?? option.slug ?? option.name} value={option.id ?? option.slug}>
                  {option.name ?? option.label ?? option.slug ?? `Workspace ${option.id}`}
                </option>
              ))}
            </select>
            <span className="hidden text-xs font-semibold uppercase tracking-wide text-slate-400 sm:inline">Lookback</span>
            <select
              value={lookbackDays}
              onChange={handleLookbackChange}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
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
            {error.message || 'Unable to load ATS operations data.'}
          </div>
        ) : null}

        <SummaryGrid metrics={atsMetrics} />

        <JobLifecycleSection
          jobLifecycle={data?.jobLifecycle}
          recommendations={data?.recommendations}
          lookbackDays={data?.meta?.lookbackDays ?? lookbackDays}
        />

        <CandidateExperienceHighlights
          candidateExperience={data?.candidateExperience}
          candidateCare={candidateCare}
          enterpriseReadiness={data?.jobLifecycle?.enterpriseReadiness}
          atsHealth={data?.jobLifecycle?.atsHealth}
        />

        <section
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_-24px_rgba(30,64,175,0.35)] sm:p-8"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Interview command center</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-600">
                Coordinate interviewer readiness, prep resources, feedback loops, and offer transitions without leaving the ATS.
              </p>
            </div>
            <Link
              to="/dashboard/company"
              className="inline-flex items-center gap-2 rounded-full border border-accent/40 px-4 py-2 text-xs font-semibold text-accent transition hover:border-accent hover:bg-accent/5"
            >
              Return to talent hub
            </Link>
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
      </div>
    </DashboardLayout>
  );
}
