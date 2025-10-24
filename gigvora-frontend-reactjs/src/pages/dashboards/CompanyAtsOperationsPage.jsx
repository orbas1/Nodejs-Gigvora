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
  ArrowRightIcon,
  ArrowDownTrayIcon,
  UserGroupIcon,
  FunnelIcon,
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
import { formatNumber, formatPercent, formatDelta, normaliseTrend } from '../../utils/numberFormat.js';

function normaliseNarrative(entry) {
  if (!entry) {
    return null;
  }
  if (typeof entry === 'string') {
    return entry;
  }
  if (typeof entry === 'object') {
    return entry.description ?? entry.note ?? entry.summary ?? entry.title ?? null;
  }
  return null;
}

function deriveFairnessAnalytics(data) {
  const jobLifecycle = data?.jobLifecycle ?? {};
  const atsHealth = jobLifecycle.atsHealth ?? {};
  const fairnessSource =
    jobLifecycle.fairnessAnalytics ?? jobLifecycle.fairness ?? jobLifecycle.enterpriseReadiness?.fairness ?? {};
  const stagePerformance = Array.isArray(jobLifecycle.stagePerformance) ? jobLifecycle.stagePerformance : [];

  const fairnessTrendSource =
    fairnessSource.trend ??
    fairnessSource.trendline ??
    jobLifecycle.recentActivity?.fairnessTrend ??
    atsHealth.fairnessTrend ??
    stagePerformance.map((stage) => stage.inclusionScore).filter((value) => Number.isFinite(Number(value)));

  const automationTrendSource =
    fairnessSource.automationTrend ??
    jobLifecycle.automation?.trend ??
    atsHealth.automationTrend ??
    stagePerformance.map((stage) => stage.instrumentation?.automationCoverage ?? stage.automationCoverage);

  const notes = [
    ...(Array.isArray(fairnessSource.notes) ? fairnessSource.notes : fairnessSource.notes ? [fairnessSource.notes] : []),
    ...(Array.isArray(fairnessSource.highlights)
      ? fairnessSource.highlights
      : fairnessSource.highlights
      ? [fairnessSource.highlights]
      : []),
    ...(Array.isArray(data?.recommendations?.fairness)
      ? data.recommendations.fairness
      : data?.recommendations?.fairness
      ? [data.recommendations.fairness]
      : []),
  ]
    .map(normaliseNarrative)
    .filter(Boolean);

  return {
    fairnessScore:
      fairnessSource.score ??
      fairnessSource.fairnessScore ??
      atsHealth.inclusionScore ??
      jobLifecycle.enterpriseReadiness?.experience?.inclusionScore,
    fairnessTrend: normaliseTrend(fairnessTrendSource, { clampMinimum: 0 }),
    automationCoverage: fairnessSource.automationCoverage ?? atsHealth.automationCoverage,
    automationTrend: normaliseTrend(automationTrendSource, { clampMinimum: 0 }),
    newcomerShare: fairnessSource.newcomerShare ?? atsHealth.newcomerShare,
    rotationHealth: fairnessSource.rotationHealth ?? atsHealth.rotationHealth,
    biasAlerts:
      fairnessSource.biasAlerts ??
      stagePerformance.reduce((sum, stage) => sum + (Number(stage.biasAlerts ?? stage.fairnessAlerts) || 0), 0),
    flaggedStages:
      fairnessSource.flaggedStages ??
      stagePerformance.filter((stage) => (stage.biasAlerts ?? stage.fairnessAlerts ?? 0) > 0).length,
    notes,
  };
}

function FairnessAnalyticsPanel({ fairness, onNavigateAutoMatch }) {
  const fairnessScore = formatRate(fairness.fairnessScore, { decimals: 1 });
  const automationCoverage = formatRate(fairness.automationCoverage, { decimals: 1 });
  const newcomerShare = formatRate(fairness.newcomerShare, { decimals: 1 });
  const fairnessDelta = computeTrendDelta(fairness.fairnessTrend, { decimals: 1, suffix: ' pts' });
  const automationDelta = computeTrendDelta(fairness.automationTrend, { decimals: 1, suffix: ' pts' });
  const rotationLabel =
    typeof fairness.rotationHealth === 'string'
      ? fairness.rotationHealth.replace(/_/g, ' ')
      : fairness.rotationHealth?.label ?? 'Rotation steady';

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_-24px_rgba(30,64,175,0.35)]">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Fairness & automation intelligence</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Track fairness guardrails, automation coverage, and newcomer rotation health to keep auto-match and interview
            operations aligned.
          </p>
        </div>
        <button
          type="button"
          onClick={onNavigateAutoMatch}
          className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/5 px-4 py-2 text-xs font-semibold text-accent transition hover:border-accent hover:bg-accent/10"
        >
          Open auto-match fairness
          <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <TrendStatCard
          title="Fairness score"
          value={fairnessScore}
          helper={`${formatNumber(fairness.biasAlerts ?? 0)} bias alerts logged`}
          delta={fairnessDelta ?? undefined}
          trend={fairness.fairnessTrend}
          tone="emerald"
        />
        <TrendStatCard
          title="Automation coverage"
          value={automationCoverage}
          helper={`${formatNumber(fairness.flaggedStages ?? 0)} stages flagged`}
          delta={automationDelta ?? undefined}
          trend={fairness.automationTrend}
          tone="accent"
        />
      </div>

      <dl className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-slate-50 p-4">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Newcomer rotation share</dt>
          <dd className="mt-2 text-lg font-semibold text-slate-900">{newcomerShare}</dd>
          <p className="mt-1 text-xs text-slate-500">Reserved seats for first-time candidates</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Rotation health</dt>
          <dd className="mt-2 text-lg font-semibold text-slate-900">{rotationLabel}</dd>
          <p className="mt-1 text-xs text-slate-500">Keep cohorts balanced across departments</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bias oversight</dt>
          <dd className="mt-2 text-lg font-semibold text-slate-900">{formatNumber(fairness.biasAlerts ?? 0)}</dd>
          <p className="mt-1 text-xs text-slate-500">Alerts funnel directly into audit queue</p>
        </div>
      </dl>

      {fairness.notes?.length ? (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-sm font-semibold text-slate-700">Focus actions</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            {fairness.notes.slice(0, 4).map((note, index) => (
              <li key={`fairness-note-${index}`} className="flex items-start gap-2">
                <SparklesIcon className="mt-0.5 h-4 w-4 text-accent" aria-hidden="true" />
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function deriveStageAlerts(jobLifecycle) {
  const stagePerformance = Array.isArray(jobLifecycle?.stagePerformance) ? jobLifecycle.stagePerformance : [];
  return stagePerformance
    .map((stage, index) => {
      const sla = Number(stage.slaHours ?? stage.slaTargetHours ?? stage.targetSlaHours);
      const average = Number(stage.averageDurationHours ?? stage.averageDuration ?? stage.durationHours);
      if (!Number.isFinite(sla) || !Number.isFinite(average)) {
        return null;
      }
      const variance = average - sla;
      if (variance <= 0.5) {
        return null;
      }
      return {
        id: stage.id ?? stage.slug ?? `stage-${index}`,
        label: stage.name ?? stage.stage ?? stage.stageName ?? `Stage ${index + 1}`,
        sla,
        average,
        variance,
        biasAlerts: Number(stage.biasAlerts ?? stage.fairnessAlerts ?? 0) || 0,
        stageKey: stage.slug ?? stage.id ?? stage.stage ?? null,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.variance - a.variance);
}

function SlaAlertsPanel({ alerts, onNavigate }) {
  const hasAlerts = alerts.length > 0;

  return (
    <section className="rounded-3xl border border-amber-200 bg-amber-50/70 p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Stage SLA alerts</h2>
          <p className="mt-1 text-sm text-slate-600">
            {hasAlerts
              ? 'Investigate the stages exceeding agreed response windows to prevent offer delays.'
              : 'All tracked stages are currently within configured SLA windows.'}
          </p>
        </div>
      </div>

      {hasAlerts ? (
        <ul className="mt-5 space-y-3">
          {alerts.map((alert) => (
            <li
              key={alert.id}
              className="group flex flex-col rounded-2xl bg-white/80 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{alert.label}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Target {formatNumber(alert.sla, { decimals: 1, suffix: ' hrs' })} · Actual{' '}
                    {formatNumber(alert.average, { decimals: 1, suffix: ' hrs' })}
                  </p>
                </div>
                <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-600">
                  {formatNumber(alert.variance, { decimals: 1 })} hrs over SLA
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span>
                  {alert.biasAlerts
                    ? `${formatNumber(alert.biasAlerts)} fairness flags`
                    : 'No fairness flags recorded'}
                </span>
                <button
                  type="button"
                  onClick={() => onNavigate(alert)}
                  className="inline-flex items-center gap-1 text-accent transition hover:text-accent/80"
                >
                  View pipeline
                  <ArrowRightIcon className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-5 rounded-2xl bg-white/70 p-4 text-sm text-emerald-700">
          Great work—your interview SLAs are on track. Keep monitoring automation recommendations to stay proactive.
        </div>
      )}
    </section>
  );
}

function normaliseSegmentOptions(segments) {
  if (!Array.isArray(segments)) {
    return [];
  }
  return segments
    .map((segment, index) => {
      const id = segment?.id ?? segment?.slug ?? segment?.code ?? segment?.key ?? `segment-${index}`;
      const label = segment?.label ?? segment?.name ?? segment?.title ?? `Segment ${index + 1}`;
      const metrics = segment?.metrics ?? segment?.stats ?? segment?.summary ?? {};
      const helper = segment?.helper ?? segment?.caption ?? segment?.description ?? '';
      return { id: `${id}`, label, metrics, helper };
    })
    .filter((segment) => segment.id);
}

function presentSegmentValue(value) {
  if (value == null) {
    return '—';
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      return '—';
    }
    if (value <= 1 && value >= 0) {
      return formatRate(value, { decimals: 1 });
    }
    return formatNumber(value);
  }
  return `${value}`;
}

function extractSegmentMetrics(segment) {
  if (!segment) {
    return [];
  }
  const { metrics } = segment;
  if (Array.isArray(metrics)) {
    return metrics
      .map((entry, index) => {
        if (entry == null) {
          return null;
        }
        if (typeof entry === 'string') {
          return { label: entry, value: '—' };
        }
        if (typeof entry === 'number') {
          return { label: `Metric ${index + 1}`, value: entry };
        }
        return {
          label: entry.label ?? entry.name ?? entry.key ?? `Metric ${index + 1}`,
          value:
            entry.value ?? entry.count ?? entry.total ?? entry.percentage ?? entry.rate ?? entry.metric ?? entry.score ?? '—',
          helper: entry.helper ?? entry.caption ?? entry.description ?? '',
        };
      })
      .filter(Boolean)
      .map((metric) => ({
        label: metric.label,
        value: presentSegmentValue(metric.value),
        helper: metric.helper,
      }));
  }

  return Object.entries(metrics ?? {})
    .map(([key, value]) => ({
      label: key.replace(/[_-]/g, ' '),
      value: presentSegmentValue(value),
    }))
    .filter((metric) => metric.value !== undefined);
}

function SegmentBreakdownPanel({ departmentSegment, recruiterSegment, onClearFilters }) {
  const segments = [
    departmentSegment ? { type: 'Department', ...departmentSegment, metrics: extractSegmentMetrics(departmentSegment) } : null,
    recruiterSegment ? { type: 'Recruiter', ...recruiterSegment, metrics: extractSegmentMetrics(recruiterSegment) } : null,
  ].filter(Boolean);

  if (!segments.length) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Segmentation insights</h2>
            <p className="mt-1 text-sm text-slate-600">
              Use the department or recruiter filters to analyse pipeline health and fairness by owner group.
            </p>
          </div>
          {onClearFilters ? (
            <button
              type="button"
              onClick={onClearFilters}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600"
            >
              Reset filters
            </button>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Segment performance</h2>
          <p className="mt-1 text-sm text-slate-600">
            Drill into specific teams or owners to understand throughput, fairness, and candidate care workload.
          </p>
        </div>
        {onClearFilters ? (
          <button
            type="button"
            onClick={onClearFilters}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600"
          >
            Reset filters
          </button>
        ) : null}
      </div>

      <div className="mt-6 space-y-6">
        {segments.map((segment) => (
          <div key={`${segment.type}-${segment.id}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{segment.type}</p>
                <h3 className="text-lg font-semibold text-slate-900">{segment.label}</h3>
                {segment.helper ? <p className="text-xs text-slate-500">{segment.helper}</p> : null}
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                {segment.metrics.length} metrics
              </span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {segment.metrics.map((metric) => (
                <div key={`${segment.id}-${metric.label}`} className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{metric.label}</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{metric.value}</p>
                  {metric.helper ? <p className="mt-1 text-xs text-slate-500">{metric.helper}</p> : null}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function AvatarStack({ members }) {
  const safeMembers = Array.isArray(members) ? members.filter(Boolean) : [];
  if (!safeMembers.length) {
    return null;
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex -space-x-3">
        {safeMembers.slice(0, 4).map((member, index) => {
          const key = member.id ?? member.email ?? member.slug ?? `member-${index}`;
          const name = member.name ?? member.label ?? member.displayName ?? 'Team member';
          const initials =
            member.initials ??
            (typeof name === 'string'
              ? name
                  .split(' ')
                  .map((part) => part[0])
                  .filter(Boolean)
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()
              : 'TM');

          if (member.avatarUrl) {
            return (
              <img
                key={key}
                src={member.avatarUrl}
                alt={name}
                className="h-8 w-8 rounded-full border-2 border-white object-cover"
              />
            );
          }

          return (
            <span
              key={key}
              className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-accent/10 text-xs font-semibold text-accent"
            >
              {initials || 'TM'}
            </span>
          );
        })}
      </div>
      {safeMembers.length > 4 ? (
        <span className="text-xs font-semibold text-slate-500">+{safeMembers.length - 4} more</span>
      ) : null}
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
          value: formatRate(inclusionScore, { decimals: 1 }),
          helper: experienceHealth ? `Experience status ${experienceHealth.replace(/_/g, ' ')}` : 'Monitor inclusion metrics',
        }
      : null,
  ].filter((metric) => metric && metric.value !== '—');

  if (!metrics.length) {
    return null;
  }

  const teamMembers = Array.isArray(candidateCare?.team?.members)
    ? candidateCare.team.members
    : Array.isArray(candidateCare?.team)
    ? candidateCare.team
    : [];

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_-24px_rgba(30,64,175,0.35)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Candidate experience guardrails</h2>
          <p className="mt-1 text-sm text-slate-600">
            Monitor satisfaction, response times, and escalations to deliver enterprise-ready hiring journeys.
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-600">
            Experience signals
          </span>
          <AvatarStack members={teamMembers} />
        </div>
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




const LOOKBACK_OPTIONS = [30, 60, 90, 120];

function formatRate(value, options) {
  if (value == null || Number.isNaN(Number(value))) {
    return options?.fallback ?? '—';
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return options?.fallback ?? '—';
  }
  const percentValue = numeric <= 1 && numeric >= -1 ? numeric * 100 : numeric;
  return formatPercent(percentValue, options);
}

function computeTrendDelta(trend, options = {}) {
  if (!Array.isArray(trend) || trend.length < 2) {
    return null;
  }
  const first = Number(trend[0]);
  const last = Number(trend[trend.length - 1]);
  if (!Number.isFinite(first) || !Number.isFinite(last)) {
    return null;
  }
  return formatDelta(last, first, options);
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
      href: '/dashboard/company/job-management',
    },
    {
      label: 'Maturity score',
      value: formatRate(atsHealth.maturityScore),
      helper: atsHealth.readinessTier
        ? `${atsHealth.readinessTier.replace(/_/g, ' ')} tier`
        : 'Lifecycle readiness tier',
      icon: ChartPieIcon,
      href: '/dashboard/company/ats?panel=maturity',
    },
    {
      label: 'Automation coverage',
      value: formatRate(atsHealth.automationCoverage),
      helper: `${formatNumber(jobLifecycle?.stagePerformance?.length ?? 0)} stages instrumented`,
      icon: SparklesIcon,
      href: '/dashboard/company/ats?panel=automation',
    },
    {
      label: 'Template coverage',
      value: formatRate(atsHealth.templateCoverage),
      helper: 'Interview templates aligned to stages',
      icon: SignalIcon,
      href: '/dashboard/company/interviews#templates',
    },
    {
      label: 'Pending approvals',
      value: formatNumber(jobLifecycle?.pendingApprovals),
      helper:
        jobLifecycle?.overdueApprovals && jobLifecycle.overdueApprovals > 0
          ? `${formatNumber(jobLifecycle.overdueApprovals)} overdue`
          : 'All approvals on track',
      icon: ShieldCheckIcon,
      tone: jobLifecycle?.overdueApprovals > 0 ? 'critical' : 'default',
      href: '/dashboard/company/offers?view=approvals',
    },
    {
      label: 'Data freshness',
      value:
        atsHealth.dataFreshnessHours != null
          ? `${formatNumber(atsHealth.dataFreshnessHours, { decimals: 1 })} hrs`
          : '—',
      helper: atsHealth.lastUpdatedAt ? `Updated ${formatRelativeTime(atsHealth.lastUpdatedAt)}` : 'Awaiting recent sync',
      icon: ArrowPathIcon,
      tone: atsHealth.dataFreshnessHours != null && atsHealth.dataFreshnessHours > 12 ? 'warning' : 'default',
      href: '/dashboard/company/analytics',
    },
    {
      label: 'Upcoming interviews',
      value: formatNumber(atsHealth.upcomingInterviews ?? interviewOperations?.upcomingCount ?? 0),
      helper:
        interviewOperations?.averageLeadTimeHours != null
          ? `Lead time ${formatNumber(interviewOperations.averageLeadTimeHours, { decimals: 1, suffix: ' hrs' })}`
          : 'Lead time pending',
      icon: ClockIcon,
      href: '/dashboard/company/interviews',
    },
    {
      label: 'Candidate NPS',
      value: formatNumber(candidateExperience?.nps, { decimals: 1 }),
      helper: `${formatNumber(candidateExperience?.responseCount ?? 0)} responses`,
      icon: SparklesIcon,
      href: '/dashboard/company/interviews#experience',
    },
  ];
}

function SparkLine({ values, tone = 'accent' }) {
  const trend = normaliseTrend(values, { clampMinimum: 0 });
  const max = Math.max(...trend);
  const min = Math.min(...trend);
  const range = Math.max(max - min, 1);
  const coordinates = trend
    .map((value, index) => {
      const x = trend.length === 1 ? 100 : (index / Math.max(trend.length - 1, 1)) * 100;
      const y = 35 - ((value - min) / range) * 30;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
  const polygonPoints = `${coordinates} 100,40 0,40`;
  const strokeClass =
    tone === 'rose'
      ? 'text-rose-500'
      : tone === 'amber'
      ? 'text-amber-500'
      : tone === 'emerald'
      ? 'text-emerald-600'
      : 'text-accent';
  const fillClass =
    tone === 'rose'
      ? 'fill-rose-200/70'
      : tone === 'amber'
      ? 'fill-amber-200/70'
      : tone === 'emerald'
      ? 'fill-emerald-200/70'
      : 'fill-sky-200/70';

  return (
    <svg viewBox="0 0 100 40" className="h-16 w-full" preserveAspectRatio="none" aria-hidden="true">
      <polygon points={polygonPoints} className={fillClass} />
      <polyline points={coordinates} className={`${strokeClass} stroke-[2.5] fill-none`} />
    </svg>
  );
}

function TrendStatCard({ title, value, helper, delta, trend, tone = 'accent' }) {
  const deltaTone = delta?.startsWith('-') ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600';

  return (
    <div className="group flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-accent/60 hover:shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
          <p className="mt-2 text-xl font-semibold text-slate-900">{value}</p>
          {helper ? <p className="mt-1 text-xs text-slate-500">{helper}</p> : null}
        </div>
        {delta ? <span className={`rounded-full px-3 py-1 text-xs font-semibold ${deltaTone}`}>{delta} vs start</span> : null}
      </div>
      <div className="mt-4">
        <SparkLine values={trend} tone={tone} />
      </div>
    </div>
  );
}

function SummaryGrid({ metrics, onSelectMetric }) {
  if (!metrics?.length) {
    return null;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {metrics.map((metric) => {
        const Icon = metric.icon ?? ChartBarIcon;
        const Component = metric.href || onSelectMetric ? 'button' : 'div';
        const toneClass =
          metric.tone === 'critical'
            ? 'border-rose-200 bg-rose-50/70'
            : metric.tone === 'warning'
            ? 'border-amber-200 bg-amber-50/70'
            : 'border-blue-100 bg-blue-50/60';
        const handleClick = () => {
          if (onSelectMetric) {
            onSelectMetric(metric);
          } else if (metric.href) {
            window.location.assign(metric.href);
          }
        };

        return (
          <Component
            key={metric.label}
            type={Component === 'button' ? 'button' : undefined}
            onClick={Component === 'button' ? handleClick : undefined}
            className={`group flex h-full flex-col justify-between rounded-2xl px-4 py-5 text-left shadow-sm ${toneClass} ${
              Component === 'button'
                ? 'transition hover:-translate-y-1 hover:border-accent/60 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-accent/40'
                : ''
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{metric.label}</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{metric.value}</p>
                {metric.helper ? <p className="mt-1 text-xs text-slate-500">{metric.helper}</p> : null}
              </div>
              <div
                className={`rounded-2xl bg-white p-3 shadow-sm ${
                  metric.tone === 'critical'
                    ? 'text-rose-600'
                    : metric.tone === 'warning'
                    ? 'text-amber-600'
                    : 'text-blue-600'
                }`}
              >
                <Icon className="h-6 w-6" aria-hidden="true" />
              </div>
            </div>
            {Component === 'button' ? (
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-accent">
                Open details
                <ArrowRightIcon className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
            ) : null}
          </Component>
        );
      })}
    </div>
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
  const fairnessAnalytics = useMemo(() => deriveFairnessAnalytics(data), [data]);
  const stageAlerts = useMemo(() => deriveStageAlerts(data?.jobLifecycle), [data?.jobLifecycle]);
  const segmentationSource = data?.jobLifecycle?.segments ?? data?.jobLifecycle?.segmentations ?? {};
  const departmentSegments = useMemo(
    () => normaliseSegmentOptions(segmentationSource.departments ?? segmentationSource.department ?? []),
    [segmentationSource],
  );
  const recruiterSegments = useMemo(
    () => normaliseSegmentOptions(segmentationSource.recruiters ?? segmentationSource.recruiter ?? []),
    [segmentationSource],
  );
  const departmentParam = searchParams.get('department');
  const recruiterParam = searchParams.get('recruiter');
  const selectedDepartment = departmentSegments.find((segment) => segment.id === departmentParam);
  const selectedRecruiter = recruiterSegments.find((segment) => segment.id === recruiterParam);

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

  const handleDepartmentChange = (event) => {
    const nextDepartment = event.target.value;
    const next = new URLSearchParams(searchParams);
    if (nextDepartment) {
      next.set('department', nextDepartment);
    } else {
      next.delete('department');
    }
    setSearchParams(next);
  };

  const handleRecruiterChange = (event) => {
    const nextRecruiter = event.target.value;
    const next = new URLSearchParams(searchParams);
    if (nextRecruiter) {
      next.set('recruiter', nextRecruiter);
    } else {
      next.delete('recruiter');
    }
    setSearchParams(next);
  };

  const handleClearSegments = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('department');
    next.delete('recruiter');
    setSearchParams(next);
  };

  const handleMetricDrilldown = (metric) => {
    if (metric.href) {
      navigate(metric.href);
      return;
    }
    if (metric.sectionId) {
      navigate(metric.sectionId);
    }
  };

  const handleStageNavigate = (alert) => {
    const stageQuery = alert.stageKey ? `?stage=${encodeURIComponent(alert.stageKey)}` : '';
    navigate(`/dashboard/company/job-management${stageQuery}`, {
      state: { focusStage: alert.stageKey ?? alert.label },
    });
  };

  const handleExportReport = () => {
    const rows = [['Section', 'Label', 'Value', 'Helper']];
    atsMetrics.forEach((metric) => {
      rows.push(['ATS Summary', metric.label, metric.value, metric.helper ?? '']);
    });
    rows.push([
      'Fairness',
      'Fairness score',
      formatRate(fairnessAnalytics.fairnessScore, { decimals: 1 }),
      `${formatNumber(fairnessAnalytics.biasAlerts ?? 0)} bias alerts`,
    ]);
    rows.push([
      'Fairness',
      'Automation coverage',
      formatRate(fairnessAnalytics.automationCoverage, { decimals: 1 }),
      `${formatNumber(fairnessAnalytics.flaggedStages ?? 0)} stages flagged`,
    ]);
    stageAlerts.forEach((alert) => {
      rows.push([
        'SLA Alerts',
        alert.label,
        `${formatNumber(alert.average, { decimals: 1 })} hrs`,
        `${formatNumber(alert.variance, { decimals: 1 })} hrs over SLA`,
      ]);
    });
    const segmentMetrics = extractSegmentMetrics(selectedDepartment)
      .concat(extractSegmentMetrics(selectedRecruiter))
      .filter(Boolean);
    segmentMetrics.forEach((metric) => {
      rows.push(['Segments', metric.label, metric.value, metric.helper ?? '']);
    });
    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gigvora-ats-report-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleAutoMatchNavigate = () => {
    navigate('/dashboard/company/auto-match');
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
        <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:flex-row xl:items-center xl:justify-between">
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
            <span className="hidden text-xs font-semibold uppercase tracking-wide text-slate-400 lg:inline">
              Segments
            </span>
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={departmentParam ?? ''}
                onChange={handleDepartmentChange}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                <option value="">All departments</option>
                {departmentSegments.map((segment) => (
                  <option key={segment.id} value={segment.id}>
                    {segment.label}
                  </option>
                ))}
              </select>
              <select
                value={recruiterParam ?? ''}
                onChange={handleRecruiterChange}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                <option value="">All recruiters</option>
                {recruiterSegments.map((segment) => (
                  <option key={segment.id} value={segment.id}>
                    {segment.label}
                  </option>
                ))}
              </select>
            </div>
            {(departmentParam || recruiterParam) && (
              <button
                type="button"
                onClick={handleClearSegments}
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-300"
              >
                <FunnelIcon className="h-3.5 w-3.5" aria-hidden="true" /> Reset
              </button>
            )}
          </div>
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={handleExportReport}
              className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/5 px-4 py-2 text-xs font-semibold text-accent transition hover:border-accent hover:bg-accent/10"
            >
              <ArrowDownTrayIcon className="h-4 w-4" aria-hidden="true" /> Export report
            </button>
            <DataStatus
              loading={loading}
              fromCache={fromCache}
              lastUpdated={lastUpdated}
              onRefresh={() => refresh({ force: true })}
            />
          </div>
        </div>

        {error ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50/70 p-6 text-sm text-rose-700">
            {error.message || 'Unable to load ATS operations data.'}
          </div>
        ) : null}

        <SummaryGrid metrics={atsMetrics} onSelectMetric={handleMetricDrilldown} />

        <div className="grid gap-8 xl:grid-cols-[minmax(0,2fr)_minmax(0,1.1fr)]">
          <FairnessAnalyticsPanel fairness={fairnessAnalytics} onNavigateAutoMatch={handleAutoMatchNavigate} />
          <SlaAlertsPanel alerts={stageAlerts} onNavigate={handleStageNavigate} />
        </div>

        <JobLifecycleSection
          jobLifecycle={data?.jobLifecycle}
          recommendations={data?.recommendations}
          lookbackDays={data?.meta?.lookbackDays ?? lookbackDays}
        />

        <div className="grid gap-8 xl:grid-cols-[minmax(0,2fr)_minmax(0,1.1fr)]">
          <CandidateExperienceHighlights
            candidateExperience={data?.candidateExperience}
            candidateCare={candidateCare}
            enterpriseReadiness={data?.jobLifecycle?.enterpriseReadiness}
            atsHealth={data?.jobLifecycle?.atsHealth}
          />
          <SegmentBreakdownPanel
            departmentSegment={selectedDepartment}
            recruiterSegment={selectedRecruiter}
            onClearFilters={departmentParam || recruiterParam ? handleClearSegments : undefined}
          />
        </div>

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
