import { useId, useMemo } from 'react';
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

function buildNarrativeStatements({
  analyticsForecasting,
  conversionRates,
  workforceAnalytics,
  candidateExperience,
  alerts,
  lookbackDays,
}) {
  const statements = [];

  if (analyticsForecasting?.projectedHires != null) {
    const projectedHires = formatNumber(analyticsForecasting.projectedHires);
    const backlogRaw =
      analyticsForecasting.backlog != null && Number.isFinite(Number(analyticsForecasting.backlog))
        ? Number(analyticsForecasting.backlog)
        : null;
    const backlog = backlogRaw != null ? formatNumber(backlogRaw) : null;
    const backlogDeltaRaw =
      analyticsForecasting.backlogDelta != null && Number.isFinite(Number(analyticsForecasting.backlogDelta))
        ? Number(analyticsForecasting.backlogDelta)
        : null;
    let backlogContext = null;
    if (backlog != null) {
      backlogContext = `Backlog sits at ${backlog}${
        backlogRaw > 0 && backlogDeltaRaw != null
          ? ` (${backlogDeltaRaw > 0 ? '+' : ''}${formatNumber(backlogDeltaRaw)} period shift)`
          : ''
      }`;
    }
    statements.push(
      `Plan for ${projectedHires} hires over the last ${lookbackDays} days window${
        backlogContext ? ` while ${backlogContext}` : ''
      }.`
    );
  }

  if (conversionRates?.hireRate != null || conversionRates?.offerRate != null) {
    const hireRate = conversionRates?.hireRate != null ? formatPercent(conversionRates.hireRate) : null;
    const offerRate = conversionRates?.offerRate != null ? formatPercent(conversionRates.offerRate) : null;
    const interviewRate =
      conversionRates?.interviewRate != null ? formatPercent(conversionRates.interviewRate) : null;
    const fragments = [];
    if (hireRate) {
      fragments.push(`offer-to-hire is ${hireRate}`);
    }
    if (offerRate) {
      fragments.push(`offer acceptance holds at ${offerRate}`);
    }
    if (interviewRate) {
      fragments.push(`application to interview converts at ${interviewRate}`);
    }
    if (fragments.length) {
      statements.push(`Talent funnel ${fragments.join(', ')}.`);
    }
  }

  if (workforceAnalytics?.attritionRiskScore != null) {
    const attrition = Number(workforceAnalytics.attritionRiskScore).toFixed(1);
    const mobility =
      workforceAnalytics?.mobilityOpportunities != null
        ? formatNumber(workforceAnalytics.mobilityOpportunities)
        : null;
    statements.push(
      `Workforce attrition risk reads ${attrition}${
        mobility ? ` with ${mobility} internal mobility openings to absorb movement` : ''
      }.`
    );
  }

  if (candidateExperience?.nps != null || candidateExperience?.responseCount != null) {
    const nps = candidateExperience?.nps != null ? Number(candidateExperience.nps).toFixed(1) : null;
    const responses =
      candidateExperience?.responseCount != null
        ? `${formatNumber(candidateExperience.responseCount)} survey responses`
        : null;
    statements.push(
      `Candidate experience signals${nps ? ` score ${nps} NPS` : ''}${
        responses ? ` from ${responses}` : ''
      }.`
    );
  }

  const openAlerts = Array.isArray(alerts?.items) ? alerts.items.filter(Boolean).length : 0;
  if (openAlerts > 0) {
    statements.push(`There are ${formatNumber(openAlerts)} active governance alerts requiring follow-up.`);
  }

  return statements.filter(Boolean);
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

function InsightList({ title, items, icon: Icon, description }) {
  const safeItems = Array.isArray(items) ? items.filter(Boolean) : [];
  if (!safeItems.length) {
    return null;
  }
  const listId = useId();
  const descriptionId = description ? `${listId}-description` : undefined;
  const normalizedItems = safeItems
    .map((item) => {
      if (typeof item === 'string') {
        return { label: null, value: item, context: null };
      }
      if (item && typeof item === 'object') {
        const label = item.label ?? null;
        const value = item.value ?? null;
        const context = item.context ?? null;
        if (!label && !value && !context) {
          return null;
        }
        return { label, value, context };
      }
      return null;
    })
    .filter(Boolean);

  if (!normalizedItems.length) {
    return null;
  }
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm" aria-labelledby={listId}>
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-blue-50 p-2 text-blue-600">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <h3 id={listId} className="text-base font-semibold text-slate-900">
            {title}
          </h3>
          {description ? (
            <p id={descriptionId} className="mt-1 text-sm text-slate-500">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      <ul className="mt-4 space-y-3" aria-describedby={descriptionId}>
        {normalizedItems.map((item, index) => (
          <li key={index} className="flex items-start gap-3">
            <span className="mt-2 inline-flex h-2 w-2 flex-shrink-0 rounded-full bg-blue-400" aria-hidden="true" />
            <div>
              {item.label ? (
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.label}</p>
              ) : null}
              {item.value ? <p className="text-sm font-medium text-slate-900">{item.value}</p> : null}
              {item.context ? <p className="text-xs text-slate-500">{item.context}</p> : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ForecastCard({ forecast, scenarioPlanning }) {
  const highlights = [
    forecast?.projectedHires != null
      ? {
          label: 'Projected hires',
          value: formatNumber(forecast.projectedHires),
          context:
            forecast?.projectedHiresDelta != null
              ? `${forecast.projectedHiresDelta > 0 ? '+' : ''}${formatNumber(
                  forecast.projectedHiresDelta
                )} vs prior period`
              : null,
        }
      : null,
    forecast?.timeToFillDays != null
      ? {
          label: 'Time to fill',
          value: formatNumber(forecast.timeToFillDays, { suffix: ' days' }),
          context:
            forecast?.timeToFillTrend != null
              ? `Trend: ${forecast.timeToFillTrend}`
              : 'Monitor requisitions nearing SLA.',
        }
      : null,
    forecast?.backlog != null
      ? {
          label: 'Backlog roles',
          value: formatNumber(forecast.backlog),
          context:
            forecast?.backlogDelta != null
              ? `${forecast.backlogDelta > 0 ? '+' : ''}${formatNumber(forecast.backlogDelta)} change`
              : null,
        }
      : null,
    forecast?.atRiskProjects != null
      ? {
          label: 'Projects at risk',
          value: formatNumber(forecast.atRiskProjects),
          context: 'Prioritise mitigation plans for high-impact workstreams.',
        }
      : null,
  ];
  const scenarioHighlights = [
    scenarioPlanning?.total != null
      ? {
          label: 'Draft scenarios',
          value: formatNumber(scenarioPlanning.total),
          context: 'Active scenario plans covering hiring outcomes.',
        }
      : null,
    scenarioPlanning?.accelerationPlans != null
      ? {
          label: 'Acceleration plans',
          value: formatNumber(scenarioPlanning.accelerationPlans),
          context: 'Growth initiatives ready for activation.',
        }
      : null,
    scenarioPlanning?.freezePlans != null
      ? {
          label: 'Hiring freezes',
          value: formatNumber(scenarioPlanning.freezePlans),
          context: 'Contingencies available for downturn protection.',
        }
      : null,
    scenarioPlanning?.nextReviewAt
      ? {
          label: 'Next review',
          value: formatAbsolute(scenarioPlanning.nextReviewAt),
          context: 'Ensure executive steering committee is prepared.',
        }
      : null,
  ];
  return (
    <div className="space-y-4" id="analytics-forecasting">
      <InsightList
        title="Forecast signals"
        icon={ArrowTrendingUpIcon}
        items={highlights}
        description="Forward-looking hiring health indicators for the selected workspace."
      />
      <div id="scenarios">
        <InsightList
          title="Scenario planning"
          icon={Squares2X2Icon}
          items={scenarioHighlights}
          description="Scenario coverage ensures leadership can pivot without sacrificing momentum."
        />
      </div>
    </div>
  );
}

function ConversionCard({ conversionRates, velocity, candidateExperience }) {
  const conversionItems = [
    conversionRates?.interviewRate != null
      ? {
          label: 'Application → interview',
          value: formatPercent(conversionRates.interviewRate),
          context: 'Velocity of early funnel screening.',
        }
      : null,
    conversionRates?.offerRate != null
      ? {
          label: 'Interview → offer',
          value: formatPercent(conversionRates.offerRate),
          context: 'Close alignment between interview teams and hiring managers.',
        }
      : null,
    conversionRates?.hireRate != null
      ? {
          label: 'Offer → hire',
          value: formatPercent(conversionRates.hireRate),
          context: 'Signals health of compensation and candidate experience.',
        }
      : null,
    velocity?.averageDaysToDecision != null
      ? {
          label: 'Average days to decision',
          value: formatNumber(velocity.averageDaysToDecision, { suffix: ' days' }),
          context: 'Tracks time to consensus after final interviews.',
        }
      : null,
  ];
  const experienceItems = [
    candidateExperience?.nps != null
      ? {
          label: 'Candidate NPS',
          value: Number(candidateExperience.nps).toFixed(1),
          context: 'Quality of experience from application to offer.',
        }
      : null,
    candidateExperience?.responseCount != null
      ? {
          label: 'Survey responses',
          value: formatNumber(candidateExperience.responseCount),
          context: 'Volume of recent qualitative feedback.',
        }
      : null,
    candidateExperience?.followUpsPending != null
      ? {
          label: 'Follow-ups pending',
          value: formatNumber(candidateExperience.followUpsPending),
          context: 'Outstanding actions for recruitment operations.',
        }
      : null,
  ];
  return (
    <div className="space-y-4">
      <InsightList
        title="Conversion health"
        icon={ChartBarIcon}
        items={conversionItems}
        description="Monitor pipeline efficiency across each talent funnel milestone."
      />
      <InsightList
        title="Experience telemetry"
        icon={SparklesIcon}
        items={experienceItems}
        description="Sentiment and survey throughput from recent candidates."
      />
    </div>
  );
}

function WorkforceCard({ workforce, mobility }) {
  const workforceItems = [
    workforce?.attritionRiskScore != null
      ? {
          label: 'Attrition risk score',
          value: Number(workforce.attritionRiskScore).toFixed(1),
          context: 'Probability of regrettable departures across the organisation.',
        }
      : null,
    workforce?.mobilityOpportunities != null
      ? {
          label: 'Mobility opportunities',
          value: formatNumber(workforce.mobilityOpportunities),
          context: 'Roles surfaced for re-deployment and growth.',
        }
      : null,
    workforce?.skillGapAlerts != null
      ? {
          label: 'Skill gap alerts',
          value: formatNumber(workforce.skillGapAlerts),
          context: 'Skills requiring enablement or hiring support.',
        }
      : null,
    workforce?.planAlignment?.variance != null
      ? {
          label: 'Headcount variance',
          value: formatNumber(workforce.planAlignment.variance),
          context: 'Difference between committed plan and actual headcount.',
        }
      : null,
  ];
  const cohortItems = Array.isArray(workforce?.cohortComparisons)
    ? workforce.cohortComparisons.slice(0, 3).map((cohort) => {
        const retention = cohort.retentionRate != null ? formatPercent(cohort.retentionRate) : '—';
        const performance = cohort.performanceIndex != null ? cohort.performanceIndex.toFixed(1) : '—';
        return {
          label: cohort.label,
          value: `${retention} retention`,
          context: `Performance index ${performance}`,
        };
      })
    : [];
  const mobilityItems = [
    mobility?.openRoles != null
      ? {
          label: 'Open internal roles',
          value: formatNumber(mobility.openRoles),
          context: 'Opportunities available for current team members.',
        }
      : null,
    mobility?.referralConversionRate != null
      ? {
          label: 'Referral conversion',
          value: formatPercent(mobility.referralConversionRate),
          context: 'Conversion rate of internal referrals to hires.',
        }
      : null,
    mobility?.rewardBudgetUsed != null
      ? {
          label: 'Referral rewards used',
          value: formatCurrency(mobility.rewardBudgetUsed),
          context: 'Budget consumed to incentivise internal mobility.',
        }
      : null,
  ];
  return (
    <div className="space-y-4" id="workforce">
      <InsightList
        title="Workforce health"
        icon={UsersIcon}
        items={workforceItems}
        description="Signals that inform retention, enablement, and workforce planning."
      />
      <InsightList
        title="Cohort benchmarks"
        icon={QueueListIcon}
        items={cohortItems}
        description="Compare retention and performance across critical cohorts."
      />
      <InsightList
        title="Mobility programs"
        icon={ArrowPathIcon}
        items={mobilityItems}
        description="Activation points for re-skilling and lateral movement."
      />
    </div>
  );
}

function SecurityCard({ governance, alerts }) {
  const governanceItems = [
    governance?.pendingApprovals != null
      ? {
          label: 'Pending approvals',
          value: formatNumber(governance.pendingApprovals),
          context: 'Awaiting review from compliance or finance leads.',
        }
      : null,
    governance?.criticalAlerts != null
      ? {
          label: 'Critical alerts',
          value: formatNumber(governance.criticalAlerts),
          context: 'High priority items requiring same-day attention.',
        }
      : null,
    governance?.workspaceActive === false
      ? {
          label: 'Workspace status',
          value: 'Inactive',
          context: 'Review billing and license configuration.',
        }
      : null,
  ];
  const alertItems = Array.isArray(alerts?.items)
    ? alerts.items.slice(0, 3).map((alert) => {
        const label = alert.title ?? alert.type ?? 'Alert';
        const detected = alert.detectedAt ? formatRelativeTime(alert.detectedAt) : 'Recently';
        return {
          label,
          value: detected,
          context: alert.summary ?? 'Review incident details in governance workspace.',
        };
      })
    : [];
  return (
    <div className="space-y-4">
      <InsightList
        title="Governance"
        icon={ShieldCheckIcon}
        items={governanceItems}
        description="Compliance and approval checkpoints safeguarding the workspace."
      />
      <InsightList
        title="Recent alerts"
        icon={ClockIcon}
        items={alertItems}
        description="Latest escalations to triage with legal, finance, or security teams."
      />
    </div>
  );
}

function AnalyticsNarrative({ statements, lookbackDays, lastUpdated }) {
  const titleId = useId();
  if (!Array.isArray(statements) || statements.length === 0) {
    return null;
  }
  return (
    <section
      className="rounded-3xl bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-6 text-slate-100 shadow-xl"
      aria-labelledby={titleId}
    >
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-200">Executive summary</p>
          <h2 id={titleId} className="mt-1 text-2xl font-semibold">
            What changed in the last {lookbackDays} days
          </h2>
        </div>
        <ul className="space-y-3 text-sm leading-6 text-slate-100">
          {statements.map((statement, index) => (
            <li key={index} className="flex items-start gap-3">
              <span className="mt-2 inline-flex h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-300" aria-hidden="true" />
              <span>{statement}</span>
            </li>
          ))}
        </ul>
        {lastUpdated ? (
          <p className="text-xs text-slate-300">Synced {formatRelativeTime(lastUpdated)}.</p>
        ) : null}
      </div>
    </section>
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

  const narrativeStatements = useMemo(
    () =>
      buildNarrativeStatements({
        analyticsForecasting,
        conversionRates,
        workforceAnalytics,
        candidateExperience,
        alerts,
        lookbackDays,
      }),
    [analyticsForecasting, conversionRates, workforceAnalytics, candidateExperience, alerts, lookbackDays]
  );

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

        <AnalyticsNarrative statements={narrativeStatements} lookbackDays={lookbackDays} lastUpdated={lastUpdated} />

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

