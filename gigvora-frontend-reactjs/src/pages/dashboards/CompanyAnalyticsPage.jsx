import { useMemo } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowTrendingUpIcon,
  ChartBarIcon,
  ClockIcon,
  ShieldCheckIcon,
  Squares2X2Icon,
  UsersIcon,
  SparklesIcon,
  QueueListIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import DataStatus from '../../components/DataStatus.jsx';
import AccessDeniedPanel from '../../components/dashboard/AccessDeniedPanel.jsx';
import { useCompanyDashboard } from '../../hooks/useCompanyDashboard.js';
import { useSession } from '../../context/SessionContext.jsx';
import { formatAbsolute, formatRelativeTime } from '../../utils/date.js';
import { COMPANY_DASHBOARD_MENU_SECTIONS } from '../../constants/companyDashboardMenu.js';

const LOOKBACK_OPTIONS = [30, 60, 90, 120, 180];
const menuSections = COMPANY_DASHBOARD_MENU_SECTIONS;
const availableDashboards = ['company', 'headhunter', 'agency', 'user'];

function formatNumber(value, { fallback = '—', suffix = '', decimals = null } = {}) {
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
  const numeric = Number(value);
  return `${numeric.toFixed(decimals)}%`;
}

function formatCurrency(value, currency = 'USD', { fallback = '—', decimals = 0 } = {}) {
  if (value == null || Number.isNaN(Number(value))) {
    return fallback;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: Math.max(decimals, numeric < 100 ? 2 : decimals),
  }).format(numeric);
}

function buildProfile(data, summaryCards) {
  if (!data) {
    return null;
  }
  const workspace = data.workspace ?? {};
  const profile = data.profile ?? {};
  const displayName = profile.companyName ?? workspace.name ?? 'Company workspace';
  const initials = displayName
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const metrics = (summaryCards ?? []).slice(0, 3).map((card) => ({
    label: card.label,
    value: card.value,
  }));

  return {
    name: displayName,
    role: 'Analytics & planning',
    initials: initials || 'CO',
    status: workspace.health?.statusLabel ?? 'Monitoring workforce intelligence',
    badges: workspace.health?.badges ?? [],
    metrics,
  };
}

function AnalyticsSummaryGrid({ metrics }) {
  if (!metrics.length) {
    return null;
  }
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-900 to-blue-900 p-5 text-white shadow-lg"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-200">{metric.label}</p>
          <p className="mt-2 text-3xl font-semibold">{metric.value}</p>
          {metric.delta ? (
            <p
              className={`mt-1 text-xs font-semibold ${
                metric.tone === 'positive'
                  ? 'text-emerald-300'
                  : metric.tone === 'negative'
                  ? 'text-rose-300'
                  : 'text-slate-200'
              }`}
            >
              {metric.delta}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function InsightList({ title, items, icon: Icon }) {
  const safeItems = Array.isArray(items) ? items.filter(Boolean) : [];
  if (!safeItems.length) {
    return null;
  }
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-blue-50 p-2 text-blue-600">
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      </div>
      <ul className="mt-4 space-y-3 text-sm text-slate-600">
        {safeItems.map((item, index) => (
          <li key={index} className="flex items-start gap-3">
            <span className="mt-1 inline-flex h-2 w-2 flex-shrink-0 rounded-full bg-blue-400" aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ForecastCard({ forecast, scenarioPlanning }) {
  const highlights = [
    `Projected hires: ${formatNumber(forecast.projectedHires)}`,
    `Time to fill: ${formatNumber(forecast.timeToFillDays, { suffix: ' days' })}`,
    `Backlog: ${formatNumber(forecast.backlog)}`,
    `Projects at risk: ${formatNumber(forecast.atRiskProjects)}`,
  ];
  const scenarioHighlights = [
    `Draft scenarios: ${formatNumber(scenarioPlanning.total)}`,
    `Acceleration plans: ${formatNumber(scenarioPlanning.accelerationPlans)}`,
    `Hiring freezes: ${formatNumber(scenarioPlanning.freezePlans)}`,
    scenarioPlanning.nextReviewAt
      ? `Next review: ${formatAbsolute(scenarioPlanning.nextReviewAt)}`
      : null,
  ];
  return (
    <div className="space-y-4" id="analytics-forecasting">
      <InsightList title="Forecast signals" icon={ArrowTrendingUpIcon} items={highlights} />
      <div id="scenarios">
        <InsightList title="Scenario planning" icon={Squares2X2Icon} items={scenarioHighlights} />
      </div>
    </div>
  );
}

function ConversionCard({ conversionRates, velocity, candidateExperience }) {
  const conversionItems = [
    `Application to interview: ${formatPercent(conversionRates.interviewRate)}`,
    `Interview to offer: ${formatPercent(conversionRates.offerRate)}`,
    `Offer to hire: ${formatPercent(conversionRates.hireRate)}`,
    `Average days to decision: ${formatNumber(velocity.averageDaysToDecision, { suffix: ' days' })}`,
  ];
  const experienceItems = [
    candidateExperience?.nps != null
      ? `Candidate NPS: ${Number(candidateExperience.nps).toFixed(1)}`
      : null,
    candidateExperience?.responseCount != null
      ? `Survey responses: ${formatNumber(candidateExperience.responseCount)}`
      : null,
    candidateExperience?.followUpsPending != null
      ? `Follow-ups pending: ${formatNumber(candidateExperience.followUpsPending)}`
      : null,
  ];
  return (
    <div className="space-y-4">
      <InsightList title="Conversion health" icon={ChartBarIcon} items={conversionItems} />
      <InsightList title="Experience telemetry" icon={SparklesIcon} items={experienceItems} />
    </div>
  );
}

function WorkforceCard({ workforce, mobility }) {
  const workforceItems = [
    workforce?.attritionRiskScore != null
      ? `Attrition risk score: ${Number(workforce.attritionRiskScore).toFixed(1)}`
      : null,
    workforce?.mobilityOpportunities != null
      ? `Mobility opportunities: ${formatNumber(workforce.mobilityOpportunities)}`
      : null,
    workforce?.skillGapAlerts != null
      ? `Skill gap alerts: ${formatNumber(workforce.skillGapAlerts)}`
      : null,
    workforce?.planAlignment?.variance != null
      ? `Headcount variance: ${formatNumber(workforce.planAlignment.variance)}`
      : null,
  ];
  const cohortItems = Array.isArray(workforce?.cohortComparisons)
    ? workforce.cohortComparisons.slice(0, 3).map((cohort) => {
        const retention = cohort.retentionRate != null ? formatPercent(cohort.retentionRate) : '—';
        const performance = cohort.performanceIndex != null ? cohort.performanceIndex.toFixed(1) : '—';
        return `${cohort.label}: retention ${retention}, performance ${performance}`;
      })
    : [];
  const mobilityItems = [
    mobility?.openRoles != null ? `Open internal roles: ${formatNumber(mobility.openRoles)}` : null,
    mobility?.referralConversionRate != null
      ? `Referral conversion: ${formatPercent(mobility.referralConversionRate)}`
      : null,
    mobility?.rewardBudgetUsed != null
      ? `Referral rewards used: ${formatCurrency(mobility.rewardBudgetUsed)}`
      : null,
  ];
  return (
    <div className="space-y-4" id="workforce">
      <InsightList title="Workforce health" icon={UsersIcon} items={workforceItems} />
      <InsightList title="Cohort benchmarks" icon={QueueListIcon} items={cohortItems} />
      <InsightList title="Mobility programs" icon={ArrowPathIcon} items={mobilityItems} />
    </div>
  );
}

function SecurityCard({ governance, alerts }) {
  const governanceItems = [
    governance?.pendingApprovals != null
      ? `Pending approvals: ${formatNumber(governance.pendingApprovals)}`
      : null,
    governance?.criticalAlerts != null
      ? `Critical alerts: ${formatNumber(governance.criticalAlerts)}`
      : null,
    governance?.workspaceActive === false ? 'Workspace inactive — review billing status' : null,
  ];
  const alertItems = Array.isArray(alerts?.items)
    ? alerts.items.slice(0, 3).map((alert) => {
        const label = alert.title ?? alert.type ?? 'Alert';
        const detected = alert.detectedAt ? formatRelativeTime(alert.detectedAt) : 'Recently';
        return `${label} • ${detected}`;
      })
    : [];
  return (
    <div className="space-y-4">
      <InsightList title="Governance" icon={ShieldCheckIcon} items={governanceItems} />
      <InsightList title="Recent alerts" icon={ClockIcon} items={alertItems} />
    </div>
  );
}

export default function CompanyAnalyticsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const sessionContext = useSession();
  const { session, isAuthenticated } = sessionContext ?? {};
  const memberships = session?.memberships ?? [];
  const isCompanyMember = memberships.includes('company');

  const workspaceIdParam = searchParams.get('workspaceId');
  const lookbackParam = Number(searchParams.get('lookback'));
  const lookbackDays = LOOKBACK_OPTIONS.includes(lookbackParam) ? lookbackParam : 90;

  const { data, loading, error, refresh, fromCache, lastUpdated, summaryCards } = useCompanyDashboard({
    workspaceId: workspaceIdParam || undefined,
    lookbackDays,
    enabled: isCompanyMember,
  });

  const workspaceOptions = useMemo(() => {
    const options = data?.meta?.availableWorkspaces;
    if (!Array.isArray(options)) {
      return [];
    }
    return options
      .map((workspace) => ({
        id:
          workspace.id ??
          workspace.workspaceId ??
          workspace.slug ??
          workspace.externalId ??
          workspace.name ??
          null,
        name: workspace.name ?? workspace.label ?? workspace.slug ?? 'Workspace',
      }))
      .filter((workspace) => workspace.id);
  }, [data]);

  const profile = useMemo(() => buildProfile(data, summaryCards), [data, summaryCards]);

  const analyticsForecasting = data?.analyticsForecasting ?? {};
  const scenarioPlanning = analyticsForecasting.scenarios ?? {};
  const pipelineSummary = data?.pipelineSummary ?? {};
  const conversionRates = pipelineSummary.conversionRates ?? {};
  const velocity = pipelineSummary.velocity ?? {};
  const workforceAnalytics = data?.employerBrandWorkforce?.workforceAnalytics ?? {};
  const mobility = data?.employerBrandWorkforce?.internalMobility ?? {};
  const governance = data?.governance ?? {};
  const alerts = data?.alerts ?? {};
  const candidateExperience = data?.candidateExperience ?? {};

  const analyticsSummary = useMemo(() => {
    const backlogValue =
      analyticsForecasting.backlog != null && Number.isFinite(Number(analyticsForecasting.backlog))
        ? Number(analyticsForecasting.backlog)
        : null;
    const projectedDelta =
      analyticsForecasting.projectedHiresDelta != null && Number.isFinite(Number(analyticsForecasting.projectedHiresDelta))
        ? Number(analyticsForecasting.projectedHiresDelta)
        : null;
    const backlogDelta =
      analyticsForecasting.backlogDelta != null && Number.isFinite(Number(analyticsForecasting.backlogDelta))
        ? Number(analyticsForecasting.backlogDelta)
        : null;
    return [
      {
        label: 'Projected hires',
        value: formatNumber(analyticsForecasting.projectedHires),
        delta:
          projectedDelta != null
            ? `${projectedDelta > 0 ? '+' : ''}${formatNumber(projectedDelta)} vs last period`
            : null,
        tone:
          projectedDelta == null
            ? 'neutral'
            : projectedDelta >= 0
            ? 'positive'
            : 'negative',
      },
      {
        label: 'Backlog roles',
        value: formatNumber(analyticsForecasting.backlog),
        tone: backlogValue != null && backlogValue > 0 ? 'negative' : 'positive',
        delta:
          backlogDelta != null
            ? `${backlogDelta > 0 ? '+' : ''}${formatNumber(backlogDelta)} backlog change`
            : null,
      },
      {
        label: 'Attrition risk',
        value:
          workforceAnalytics.attritionRiskScore != null
            ? Number(workforceAnalytics.attritionRiskScore).toFixed(1)
            : '—',
        tone:
          workforceAnalytics.attritionRiskScore != null && Number(workforceAnalytics.attritionRiskScore) <= 6
            ? 'positive'
            : 'negative',
        delta: workforceAnalytics.trend?.length
          ? `Latest trend: ${formatNumber(workforceAnalytics.trend.slice(-1)[0]?.attritionRiskScore, {
              decimals: 1,
            })}`
          : null,
      },
      {
        label: 'Offer to hire',
        value: formatPercent(conversionRates.hireRate),
        tone:
          conversionRates.hireRate != null && Number(conversionRates.hireRate) >= 25
            ? 'positive'
            : 'neutral',
        delta:
          conversionRates.offerRate != null
            ? `Offer acceptance: ${formatPercent(conversionRates.offerRate)}`
            : null,
      },
    ];
  }, [analyticsForecasting, workforceAnalytics, conversionRates]);

  const membershipsList = useMemo(() => (Array.isArray(memberships) ? memberships : []), [memberships]);

  const handleWorkspaceChange = (event) => {
    const value = event.target.value;
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set('workspaceId', value);
    } else {
      next.delete('workspaceId');
    }
    setSearchParams(next);
  };

  const handleLookbackChange = (event) => {
    const value = Number(event.target.value);
    const next = new URLSearchParams(searchParams);
    if (LOOKBACK_OPTIONS.includes(value)) {
      next.set('lookback', String(value));
    } else {
      next.delete('lookback');
    }
    setSearchParams(next);
  };

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ redirectTo: '/dashboard/company/analytics' }} />;
  }

  if (!isCompanyMember) {
    return (
      <DashboardLayout
        currentDashboard="company"
        title="Analytics & Planning Control Room"
        subtitle="Forecast, workforce signals, and governance telemetry"
        description="Centralise analytics with enterprise-grade controls before unlocking role-based dashboards."
        availableDashboards={availableDashboards}
        menuSections={menuSections}
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
      title="Analytics & Planning Control Room"
      subtitle="Enterprise-grade insights across hiring, workforce, and compliance"
      description="Forecast hiring capacity, monitor conversion health, and activate workforce plans with role-aware guardrails."
      menuSections={menuSections}
      profile={profile}
      availableDashboards={availableDashboards}
      activeMenuItem="analytics-forecasting"
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
              className="min-w-[200px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              <option value="">All workspaces</option>
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
          <div className="rounded-3xl border border-rose-200 bg-rose-50/80 p-6 text-sm text-rose-700">
            {error.message || 'Unable to load analytics telemetry.'}
          </div>
        ) : null}

        <AnalyticsSummaryGrid metrics={analyticsSummary.filter((metric) => metric.value !== '—')} />

        <div className="grid gap-6 lg:grid-cols-2">
          <ForecastCard forecast={analyticsForecasting} scenarioPlanning={scenarioPlanning} />
          <ConversionCard
            conversionRates={conversionRates}
            velocity={velocity}
            candidateExperience={candidateExperience}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <WorkforceCard workforce={workforceAnalytics} mobility={mobility} />
          <SecurityCard governance={governance} alerts={alerts} />
        </div>
      </div>
    </DashboardLayout>
  );
}

