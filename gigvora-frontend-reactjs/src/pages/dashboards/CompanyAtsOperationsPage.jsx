import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ChartBarIcon,
  ClockIcon,
  SparklesIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
  SignalIcon,
  ChartPieIcon,
  ScaleIcon,
  PresentationChartLineIcon,
  FunnelIcon,
  ArrowUpTrayIcon,
  ExclamationTriangleIcon,
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
import { formatMetricNumber, formatMetricPercent } from '../../utils/metrics.js';

const LOOKBACK_OPTIONS = [30, 60, 90, 120];

function formatPercentValue(value, { decimals = 1, includeSign = false } = {}) {
  if (value == null || value === '') {
    return '—';
  }

  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return '—';
  }

  const percent = Math.abs(numeric) > 1 ? numeric : numeric * 100;
  const formatted = percent.toFixed(decimals);
  const sign = includeSign ? (numeric > 0 ? '+' : numeric < 0 ? '−' : '') : '';

  return `${sign}${Math.abs(formatted)}%`;
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
        value: formatMetricNumber(data?.jobSummary?.total ?? data?.jobSummary?.active ?? 0),
      },
      {
        label: 'Active candidates',
        value: formatMetricNumber(data?.pipelineSummary?.totals?.applications ?? 0),
      },
    ],
  };
}

function buildAtsSummary(jobLifecycle, candidateExperience, interviewOperations, fairnessSummary) {
  const atsHealth = jobLifecycle?.atsHealth ?? {};
  return [
    {
      label: 'Active requisitions',
      value: formatMetricNumber(atsHealth.activeRequisitions ?? jobLifecycle?.totalStages ?? 0),
      helper: 'Open across this workspace',
      href: '/dashboard/company/pipeline',
      icon: ChartBarIcon,
    },
    {
      label: 'Maturity score',
      value: formatMetricPercent(atsHealth.maturityScore),
      helper: atsHealth.readinessTier
        ? `${atsHealth.readinessTier.replace(/_/g, ' ')} tier`
        : 'Lifecycle readiness tier',
      href: '/dashboard/company/ats/maturity',
      icon: ChartPieIcon,
    },
    {
      label: 'Automation coverage',
      value: formatMetricPercent(atsHealth.automationCoverage),
      helper: `${formatMetricNumber(jobLifecycle?.stagePerformance?.length ?? 0)} stages instrumented`,
      href: '/dashboard/company/ats/automation',
      icon: SparklesIcon,
    },
    {
      label: 'Template coverage',
      value: formatMetricPercent(atsHealth.templateCoverage),
      helper: 'Interview templates aligned to stages',
      icon: SignalIcon,
    },
    {
      label: 'Pending approvals',
      value: formatMetricNumber(jobLifecycle?.pendingApprovals),
      helper:
        jobLifecycle?.overdueApprovals && jobLifecycle.overdueApprovals > 0
          ? `${formatMetricNumber(jobLifecycle.overdueApprovals)} overdue`
          : 'All approvals on track',
      href: '/dashboard/company/ats/approvals',
      icon: ShieldCheckIcon,
    },
    {
      label: 'Data freshness',
      value:
        atsHealth.dataFreshnessHours != null
          ? `${formatMetricNumber(atsHealth.dataFreshnessHours, { maximumFractionDigits: 1, suffix: ' hrs' })}`
          : '—',
      helper: atsHealth.lastUpdatedAt ? `Updated ${formatRelativeTime(atsHealth.lastUpdatedAt)}` : 'Awaiting recent sync',
      icon: ArrowPathIcon,
    },
    {
      label: 'Upcoming interviews',
      value: formatMetricNumber(atsHealth.upcomingInterviews ?? interviewOperations?.upcomingCount ?? 0),
      helper:
        interviewOperations?.averageLeadTimeHours != null
          ? `Lead time ${formatMetricNumber(interviewOperations.averageLeadTimeHours, {
              maximumFractionDigits: 1,
              suffix: ' hrs',
            })}`
          : 'Lead time pending',
      icon: ClockIcon,
    },
    {
      label: 'Candidate NPS',
      value: formatMetricNumber(candidateExperience?.nps, { maximumFractionDigits: 1 }),
      helper: `${formatMetricNumber(candidateExperience?.responseCount ?? 0)} responses`,
      href: '/dashboard/company/ats/candidate-experience',
      icon: SparklesIcon,
    },
    fairnessSummary?.scoreDisplay
      ? {
          label: 'Fairness score',
          value: fairnessSummary.scoreDisplay,
          helper: fairnessSummary.statusLabel ?? 'Bias monitoring status',
          icon: ScaleIcon,
          href: '/dashboard/company/ats/fairness',
        }
      : null,
  ];
}

function SummaryGrid({ metrics, onDrilldown }) {
  const resolvedMetrics = (metrics ?? []).filter(Boolean);

  if (!resolvedMetrics.length) {
    return null;
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {resolvedMetrics.map((metric) => {
        const Icon = metric.icon ?? ChartBarIcon;
        const interactive = Boolean(metric.href || metric.onClick || onDrilldown);
        const Tag = interactive ? 'button' : 'div';
        const handleClick = () => {
          if (typeof metric.onClick === 'function') {
            metric.onClick(metric);
            return;
          }
          if (onDrilldown) {
            onDrilldown(metric);
          }
        };
        return (
          <Tag
            key={metric.label}
            type={interactive ? 'button' : undefined}
            onClick={interactive ? handleClick : undefined}
            className={`group flex h-full flex-col justify-between rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-5 text-left shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 ${
              interactive ? 'transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg' : ''
            }`}
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
            {interactive ? (
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-blue-500 opacity-0 transition group-hover:opacity-100">
                Explore details
                <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1.5 6h7.5m0 0L6 3m3 3L6 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            ) : null}
          </Tag>
        );
      })}
    </div>
  );
}

function registerOption(map, rawValue, rawLabel) {
  if (rawValue == null || rawValue === '') {
    return;
  }
  const value = String(rawValue);
  if (map.has(value)) {
    return;
  }
  const labelSource = rawLabel ?? rawValue;
  const label = typeof labelSource === 'string'
    ? labelSource
    : labelSource?.name ?? labelSource?.label ?? labelSource?.title ?? value;
  map.set(value, label);
}

function collectOptionsFromSource(map, source, valueKey, labelKey) {
  if (!source) {
    return;
  }
  const normaliseEntry = (entry) => {
    if (!entry) {
      return;
    }
    const value =
      entry[valueKey] ??
      entry.id ??
      entry.slug ??
      entry.key ??
      entry[valueKey === 'department' ? 'name' : 'department'] ??
      entry[labelKey];
    const label = entry[labelKey] ?? entry.name ?? entry.label ?? entry.title ?? entry.department ?? entry[valueKey];
    registerOption(map, value, label);
  };

  if (Array.isArray(source)) {
    source.forEach((entry) => normaliseEntry(entry));
    return;
  }

  if (typeof source === 'object') {
    Object.entries(source).forEach(([key, value]) => {
      if (value && typeof value === 'object') {
        normaliseEntry({ ...value, id: value.id ?? key });
      } else {
        registerOption(map, key, value);
      }
    });
  }
}

function resolveSegmentOptions(data) {
  const departmentMap = new Map();
  const recruiterMap = new Map();

  const departmentSources = [
    data?.jobLifecycle?.segments?.departments,
    data?.jobLifecycle?.departmentMetrics,
    data?.jobLifecycle?.departmentSummaries,
    data?.candidateExperience?.segments?.departments,
    data?.candidateCare?.departments,
  ];

  departmentSources.forEach((source) => collectOptionsFromSource(departmentMap, source, 'department', 'label'));

  const recruiterSources = [
    data?.jobLifecycle?.segments?.recruiters,
    data?.jobLifecycle?.recruiterMetrics,
    data?.candidateExperience?.segments?.recruiters,
    data?.interviewOperations?.recruiters,
  ];

  recruiterSources.forEach((source) => collectOptionsFromSource(recruiterMap, source, 'recruiter', 'label'));

  const toOptions = (map, allLabel) => {
    const entries = Array.from(map.entries());
    return [
      { value: 'all', label: allLabel },
      ...entries.map(([value, label]) => ({ value, label })),
    ];
  };

  return {
    departments: toOptions(departmentMap, 'All departments'),
    recruiters: toOptions(recruiterMap, 'All recruiters'),
  };
}

function matchSegment(segment, target) {
  if (!segment || target == null) {
    return false;
  }
  const candidate = String(target);
  const keys = [segment.id, segment.slug, segment.key, segment.department, segment.recruiter, segment.owner, segment.name];
  return keys.filter((key) => key != null).map((key) => String(key)).includes(candidate);
}

function findSegmentEntry(segments, filterValue) {
  if (!segments || filterValue == null) {
    return null;
  }

  if (Array.isArray(segments)) {
    return segments.find((segment) => matchSegment(segment, filterValue)) ?? null;
  }

  if (typeof segments === 'object') {
    const direct = segments[filterValue];
    if (direct) {
      return direct;
    }
    return (
      Object.values(segments).find((segment) => matchSegment(segment, filterValue)) ?? null
    );
  }

  return null;
}

function applySegmentFilters(data, filters) {
  const baseExperience = data?.candidateExperience ?? {};
  const segments = data?.candidateExperience?.segments ?? {};
  const overrides = {};
  const activeLabels = [];

  if (filters.department && filters.department !== 'all') {
    const departmentSegment =
      findSegmentEntry(segments.departments, filters.department) ??
      findSegmentEntry(segments, filters.department);
    if (departmentSegment) {
      Object.assign(overrides, departmentSegment.metrics ?? departmentSegment);
      activeLabels.push(departmentSegment.label ?? departmentSegment.name ?? departmentSegment.department);
    }
  }

  if (filters.recruiter && filters.recruiter !== 'all') {
    const recruiterSegment =
      findSegmentEntry(segments.recruiters, filters.recruiter) ??
      findSegmentEntry(segments, filters.recruiter);
    if (recruiterSegment) {
      Object.assign(overrides, recruiterSegment.metrics ?? recruiterSegment);
      activeLabels.push(recruiterSegment.label ?? recruiterSegment.name ?? recruiterSegment.recruiter);
    }
  }

  return {
    candidateExperience: { ...baseExperience, ...overrides },
    activeLabels: activeLabels.filter(Boolean),
  };
}

function buildSegmentLabel(filters, options) {
  const labelParts = [];
  if (filters.department && filters.department !== 'all') {
    const departmentOption = options.departments.find((option) => option.value === filters.department);
    if (departmentOption) {
      labelParts.push(departmentOption.label);
    }
  }
  if (filters.recruiter && filters.recruiter !== 'all') {
    const recruiterOption = options.recruiters.find((option) => option.value === filters.recruiter);
    if (recruiterOption) {
      labelParts.push(recruiterOption.label);
    }
  }
  return labelParts.join(' • ');
}

function normaliseTrendPoint(point, index) {
  if (!point) {
    return null;
  }
  const valueCandidate =
    point.value ?? point.count ?? point.total ?? point.metric ?? point.volume ?? point.score ?? point.percentage;
  const numericValue = Number(valueCandidate);
  const value = Number.isFinite(numericValue) ? numericValue : 0;
  const labelCandidate =
    point.label ?? point.date ?? point.stage ?? point.name ?? point.bucket ?? point.period ?? `Point ${index + 1}`;

  let label = labelCandidate;
  if (labelCandidate instanceof Date) {
    label = labelCandidate.toLocaleDateString();
  } else if (typeof labelCandidate === 'number') {
    label = new Date(labelCandidate).toLocaleDateString();
  }

  return { label: label || `Point ${index + 1}`, value };
}

function buildTrendSeries(jobLifecycle, candidateExperience) {
  const sources = [
    jobLifecycle?.trend?.pipeline,
    jobLifecycle?.pipelineTrend,
    jobLifecycle?.trend,
    candidateExperience?.trend,
  ];

  let dataSeries = sources.find((series) => Array.isArray(series) && series.length);

  if (!dataSeries && Array.isArray(jobLifecycle?.stagePerformance)) {
    dataSeries = jobLifecycle.stagePerformance.map((stage) => ({
      label: stage.label ?? stage.stage ?? stage.name,
      value: stage.applications ?? stage.candidates ?? stage.total ?? stage.count ?? 0,
    }));
  }

  if (!dataSeries) {
    return [];
  }

  return dataSeries
    .map((point, index) => normaliseTrendPoint(point, index))
    .filter((point) => point != null);
}

function buildFairnessInsights(jobLifecycle, candidateExperience) {
  const fairness =
    jobLifecycle?.fairness ??
    jobLifecycle?.atsHealth?.fairness ??
    candidateExperience?.fairness ??
    {};

  const score =
    fairness.score ??
    fairness.overallScore ??
    fairness.inclusionScore ??
    candidateExperience?.inclusionScore ??
    null;
  const parityGap = fairness.parityGap ?? fairness.automationParityGap ?? fairness.biasGap ?? null;
  const automationParity = fairness.automationParity ?? fairness.automationCoverageParity ?? null;
  const flaggedStages = fairness.flaggedStages ?? fairness.flags ?? [];
  const recommendations = fairness.recommendations ?? fairness.actions ?? [];
  const statusLabel = fairness.statusLabel ?? fairness.status ?? null;

  const segmentsSource =
    fairness.segments ?? fairness.departmentBreakdown ?? fairness.groups ?? candidateExperience?.segments?.departments ?? [];

  const segments = [];
  if (Array.isArray(segmentsSource)) {
    segmentsSource.forEach((segment, index) => {
      if (!segment) {
        return;
      }
      segments.push({
        id: segment.id ?? segment.slug ?? segment.key ?? segment.department ?? segment.name ?? `segment-${index}`,
        label: segment.label ?? segment.name ?? segment.department ?? `Segment ${index + 1}`,
        score: segment.score ?? segment.inclusionScore ?? segment.value ?? null,
        delta: segment.delta ?? segment.change ?? segment.diff ?? null,
        sampleSize: segment.sampleSize ?? segment.count ?? segment.responses ?? null,
      });
    });
  } else if (typeof segmentsSource === 'object' && segmentsSource) {
    Object.entries(segmentsSource).forEach(([key, value], index) => {
      if (!value) {
        return;
      }
      segments.push({
        id: value.id ?? key ?? `segment-${index}`,
        label: value.label ?? value.name ?? key,
        score: value.score ?? value.inclusionScore ?? value.value ?? null,
        delta: value.delta ?? value.change ?? value.diff ?? null,
        sampleSize: value.sampleSize ?? value.count ?? value.responses ?? null,
      });
    });
  }

  const scoreDisplay =
    score == null
      ? '—'
      : Math.abs(Number(score)) > 1
      ? `${Number(score).toFixed(1)}%`
      : formatMetricPercent(score);

  const parityGapDisplay = formatPercentValue(parityGap, { decimals: 2, includeSign: true });
  const automationParityDisplay = formatPercentValue(automationParity, { decimals: 1, includeSign: true });

  return {
    score,
    scoreDisplay,
    parityGap,
    parityGapDisplay,
    automationParity,
    automationParityDisplay,
    flaggedStages,
    recommendations,
    statusLabel,
    segments,
  };
}

function buildSlaAlerts(jobLifecycle, candidateCare, interviewOperations) {
  const alerts = [];

  if (jobLifecycle?.pendingApprovals && jobLifecycle.pendingApprovals > 5) {
    alerts.push({
      id: 'approvals-backlog',
      severity: 'warning',
      message: `${formatMetricNumber(jobLifecycle.pendingApprovals)} approvals awaiting review`,
      action: 'Escalate to hiring managers to prevent offer delays.',
    });
  }

  if (jobLifecycle?.overdueApprovals && jobLifecycle.overdueApprovals > 0) {
    alerts.push({
      id: 'approvals-overdue',
      severity: 'critical',
      message: `${formatMetricNumber(jobLifecycle.overdueApprovals)} approvals overdue`,
      action: 'Route to executive approvers or delegate authority to maintain SLAs.',
    });
  }

  if (candidateCare?.averageResponseMinutes != null && candidateCare.averageResponseMinutes > 45) {
    alerts.push({
      id: 'candidate-response',
      severity: 'warning',
      message: `Candidate response time averaging ${formatMetricNumber(candidateCare.averageResponseMinutes, {
        maximumFractionDigits: 0,
        suffix: ' mins',
      })}`,
      action: 'Rebalance recruiter workloads or automate follow-ups.',
    });
  }

  if (candidateCare?.escalations && candidateCare.escalations > 0) {
    alerts.push({
      id: 'candidate-escalations',
      severity: 'critical',
      message: `${formatMetricNumber(candidateCare.escalations)} candidate escalations open`,
      action: 'Prioritise outreach and involve candidate experience leads.',
    });
  }

  if (interviewOperations?.averageLeadTimeHours && interviewOperations.averageLeadTimeHours > 72) {
    alerts.push({
      id: 'interview-lead-time',
      severity: 'warning',
      message: `Interview lead time at ${formatMetricNumber(interviewOperations.averageLeadTimeHours, {
        maximumFractionDigits: 1,
        suffix: ' hrs',
      })}`,
      action: 'Add interviewer capacity or enable auto-scheduling to recover SLA.',
    });
  }

  const stagePerformance = jobLifecycle?.stagePerformance ?? [];
  stagePerformance.forEach((stage, index) => {
    if (!stage) {
      return;
    }
    const slaHours = stage.slaHours ?? stage.sla ?? null;
    const actualHours = stage.actualHours ?? stage.avgHours ?? null;
    if (slaHours && actualHours && actualHours > slaHours) {
      alerts.push({
        id: `stage-${stage.id ?? stage.stage ?? index}-sla`,
        severity: 'warning',
        message: `${stage.label ?? stage.stage ?? 'Stage'} exceeding SLA by ${formatMetricNumber(
          actualHours - slaHours,
          { maximumFractionDigits: 1, suffix: ' hrs' },
        )}`,
        action: 'Review interviewer availability and automate reminders.',
      });
    }
  });

  return alerts;
}

function TrendSparkline({ points }) {
  if (!points?.length) {
    return <p className="text-sm text-slate-500">Trend data is still syncing for this workspace.</p>;
  }

  const values = points.map((point) => Number(point.value) || 0);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  const path = values
    .map((value, index) => {
      const x = points.length > 1 ? (index / (points.length - 1)) * 100 : 0;
      const y = 100 - ((value - min) / range) * 100;
      return `${index === 0 ? 'M' : 'L'}${x},${y}`;
    })
    .join(' ');

  return (
    <svg viewBox="0 0 100 100" className="h-32 w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="ats-trend" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2563eb" stopOpacity="0.65" />
          <stop offset="100%" stopColor="#2563eb" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <path
        d={`${path} L100,100 L0,100 Z`}
        fill="url(#ats-trend)"
        opacity="0.35"
      />
      <path
        d={path}
        fill="none"
        stroke="url(#ats-trend)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {values.map((value, index) => {
        const x = points.length > 1 ? (index / (points.length - 1)) * 100 : 0;
        const y = 100 - ((value - min) / range) * 100;
        const isLast = index === points.length - 1;
        return (
          <circle
            key={`${value}-${index}`}
            cx={x}
            cy={y}
            r={isLast ? 2.8 : 2}
            fill={isLast ? '#1d4ed8' : '#3b82f6'}
            stroke="#ffffff"
            strokeWidth="0.8"
          />
        );
      })}
    </svg>
  );
}

function AtsTrendPanel({ trend, onNavigate }) {
  if (!trend?.length) {
    return null;
  }

  const firstPoint = trend[0];
  const latestPoint = trend[trend.length - 1];
  const delta = latestPoint.value - firstPoint.value;
  const percentDelta = firstPoint.value ? delta / Math.max(Math.abs(firstPoint.value), 1) : null;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_-24px_rgba(30,64,175,0.35)]">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Pipeline performance trend</h2>
          <p className="mt-1 max-w-3xl text-sm text-slate-600">
            Track requisition throughput and candidate volume momentum to anticipate hiring slowdowns before they impact offers.
          </p>
        </div>
        <button
          type="button"
          onClick={onNavigate}
          className="inline-flex items-center gap-2 rounded-full border border-accent/40 px-4 py-2 text-xs font-semibold text-accent transition hover:border-accent hover:bg-accent/5"
        >
          Open pipeline analytics
        </button>
      </div>
      <div className="mt-6">
        <TrendSparkline points={trend} />
      </div>
      <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl bg-blue-50/60 p-4">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current volume</dt>
          <dd className="mt-1 text-2xl font-semibold text-slate-900">{formatMetricNumber(latestPoint.value)}</dd>
          <p className="mt-1 text-xs text-slate-500">Latest data point • {latestPoint.label}</p>
        </div>
        <div className="rounded-2xl bg-blue-50/40 p-4">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Change vs. start</dt>
          <dd className="mt-1 text-2xl font-semibold text-slate-900">{formatMetricNumber(delta, { maximumFractionDigits: 0 })}</dd>
          <p className="mt-1 text-xs text-slate-500">{percentDelta != null ? formatPercentValue(percentDelta, { includeSign: true }) : '—'} growth</p>
        </div>
        <div className="rounded-2xl bg-blue-50/40 p-4">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">First data point</dt>
          <dd className="mt-1 text-2xl font-semibold text-slate-900">{formatMetricNumber(firstPoint.value)}</dd>
          <p className="mt-1 text-xs text-slate-500">Baseline • {firstPoint.label}</p>
        </div>
      </dl>
    </section>
  );
}

function FairnessAnalyticsPanel({ fairnessInsights, onNavigate }) {
  if (!fairnessInsights) {
    return null;
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_-24px_rgba(30,64,175,0.35)]">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Fairness and automation health</h2>
          <p className="mt-1 max-w-3xl text-sm text-slate-600">
            Monitor inclusion scores, parity gaps, and automation impact so enterprise guardrails stay compliant across recruiting programs.
          </p>
        </div>
        <button
          type="button"
          onClick={onNavigate}
          className="inline-flex items-center gap-2 rounded-full border border-accent/40 px-4 py-2 text-xs font-semibold text-accent transition hover:border-accent hover:bg-accent/5"
        >
          Review fairness playbook
        </button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Fairness score</p>
            <span className="rounded-full bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-blue-600">
              <ScaleIcon className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{fairnessInsights.scoreDisplay}</p>
          <p className="mt-1 text-xs text-slate-500">{fairnessInsights.statusLabel ?? 'Monitoring parity shifts'}</p>
        </div>
        <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Parity gap</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{fairnessInsights.parityGapDisplay}</p>
          <p className="mt-1 text-xs text-slate-500">Positive numbers favour over-served groups.</p>
        </div>
        <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Automation parity</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{fairnessInsights.automationParityDisplay}</p>
          <p className="mt-1 text-xs text-slate-500">Alignment between automation and manual review outcomes.</p>
        </div>
      </div>

      {fairnessInsights.flaggedStages?.length ? (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-amber-700">
            <ExclamationTriangleIcon className="h-4 w-4" />
            {fairnessInsights.flaggedStages.length} stage{fairnessInsights.flaggedStages.length > 1 ? 's' : ''} requiring review
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-amber-700">
            {fairnessInsights.flaggedStages.map((stage) => (
              <li key={stage.id ?? stage}>{stage.label ?? stage.name ?? stage}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {fairnessInsights.segments?.length ? (
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Segment</th>
                <th className="px-4 py-3">Fairness score</th>
                <th className="px-4 py-3">Δ vs. average</th>
                <th className="px-4 py-3">Sample size</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {fairnessInsights.segments.map((segment) => (
                <tr key={segment.id} className="hover:bg-blue-50/30">
                  <td className="px-4 py-3 text-slate-700">{segment.label}</td>
                  <td className="px-4 py-3 text-slate-900">
                    {segment.score == null
                      ? '—'
                      : Math.abs(Number(segment.score)) > 1
                      ? `${Number(segment.score).toFixed(1)}%`
                      : formatMetricPercent(segment.score)}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {segment.delta == null ? '—' : formatPercentValue(segment.delta, { includeSign: true })}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {segment.sampleSize == null ? '—' : formatMetricNumber(segment.sampleSize)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {fairnessInsights.recommendations?.length ? (
        <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/60 p-4 text-sm text-slate-600">
          <p className="font-semibold text-slate-800">Recommended actions</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {fairnessInsights.recommendations.map((action, index) => (
              <li key={action.id ?? index}>{action.label ?? action.title ?? action}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function SlaAlertsPanel({ alerts }) {
  if (!alerts?.length) {
    return (
      <section className="rounded-3xl border border-emerald-200 bg-emerald-50/70 p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-emerald-800">All SLAs are healthy</h2>
        <p className="mt-2 text-sm text-emerald-700">
          Response times and approvals are operating within the configured guardrails. Keep monitoring for sudden changes as automation expands.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-rose-200 bg-rose-50/70 p-6 shadow-sm">
      <h2 className="text-2xl font-semibold text-rose-800">Service level alerts</h2>
      <p className="mt-2 text-sm text-rose-700">Investigate these bottlenecks to keep candidate journeys on schedule.</p>
      <ul className="mt-4 space-y-3">
        {alerts.map((alert) => (
          <li
            key={alert.id}
            className="rounded-2xl border border-rose-200 bg-white/80 p-4 shadow-sm"
          >
            <p className="text-sm font-semibold text-rose-700">{alert.message}</p>
            <p className="mt-1 text-xs text-rose-600">{alert.action}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ReportExportButton({ onExport, exporting, disabled }) {
  return (
    <button
      type="button"
      onClick={onExport}
      disabled={exporting || disabled}
      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-accent/40 hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
    >
      <ArrowUpTrayIcon className="h-4 w-4" />
      {exporting ? 'Exporting…' : 'Export report'}
    </button>
  );
}

function SegmentationFilterBar({ filters, options, onChange, onReset, onExport, exporting, disableExport }) {
  const disableDepartments = options.departments.length <= 1;
  const disableRecruiters = options.recruiters.length <= 1;

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          <FunnelIcon className="h-4 w-4" /> Segmentation
        </span>
        <label className="sr-only" htmlFor="department-filter">
          Department
        </label>
        <select
          id="department-filter"
          value={filters.department}
          onChange={(event) => onChange('department', event.target.value)}
          disabled={disableDepartments}
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {options.departments.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor="recruiter-filter">
          Recruiter
        </label>
        <select
          id="recruiter-filter"
          value={filters.recruiter}
          onChange={(event) => onChange('recruiter', event.target.value)}
          disabled={disableRecruiters}
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {options.recruiters.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={onReset}
          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
        >
          Reset
        </button>
      </div>
      <ReportExportButton onExport={onExport} exporting={exporting} disabled={disableExport} />
    </div>
  );
}

function CandidateExperienceHighlights({ candidateExperience, candidateCare, enterpriseReadiness, atsHealth, segmentLabel }) {
  const experienceHealth = enterpriseReadiness?.health?.experience ?? atsHealth?.overallHealthStatus;
  const inclusionScore = enterpriseReadiness?.experience?.inclusionScore ?? atsHealth?.inclusionScore;
  const metrics = [
    {
      label: 'Avg satisfaction',
      value: formatMetricNumber(candidateExperience?.averageScore, { maximumFractionDigits: 1 }),
      helper: `${formatMetricNumber(candidateExperience?.responseCount ?? 0)} surveys`,
    },
    {
      label: 'Follow-ups pending',
      value: formatMetricNumber(candidateExperience?.followUpsPending),
      helper: 'Awaiting recruiter outreach',
    },
    {
      label: 'Open care tickets',
      value: formatMetricNumber(candidateCare?.openTickets),
      helper:
        candidateCare?.averageResponseMinutes != null
          ? `Response ${formatMetricNumber(candidateCare.averageResponseMinutes, { maximumFractionDigits: 0, suffix: ' mins' })}`
          : 'Response time not captured',
    },
    {
      label: 'Escalations',
      value: formatMetricNumber(candidateCare?.escalations),
      helper: candidateCare?.escalations ? 'Resolve escalated cases promptly' : 'No escalations in queue',
    },
    inclusionScore != null
      ? {
          label: 'Inclusion score',
          value: formatPercentValue(inclusionScore),
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
          {segmentLabel ? `Experience • ${segmentLabel}` : 'Experience signals'}
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
  const [segmentFilters, setSegmentFilters] = useState({ department: 'all', recruiter: 'all' });
  const [exporting, setExporting] = useState(false);

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

  const segmentationOptions = useMemo(() => resolveSegmentOptions(data ?? {}), [data]);

  useEffect(() => {
    const validDepartment = segmentationOptions.departments.some((option) => option.value === segmentFilters.department);
    const validRecruiter = segmentationOptions.recruiters.some((option) => option.value === segmentFilters.recruiter);

    if (validDepartment && validRecruiter) {
      return;
    }

    setSegmentFilters((previous) => ({
      department: validDepartment ? previous.department : 'all',
      recruiter: validRecruiter ? previous.recruiter : 'all',
    }));
  }, [segmentationOptions, segmentFilters.department, segmentFilters.recruiter]);

  const { candidateExperience: filteredCandidateExperience } = useMemo(
    () => applySegmentFilters(data ?? {}, segmentFilters),
    [data, segmentFilters],
  );

  const segmentLabel = useMemo(
    () => buildSegmentLabel(segmentFilters, segmentationOptions),
    [segmentFilters, segmentationOptions],
  );

  const fairnessInsights = useMemo(
    () => buildFairnessInsights(data?.jobLifecycle, filteredCandidateExperience),
    [data?.jobLifecycle, filteredCandidateExperience],
  );

  const pipelineTrend = useMemo(
    () => buildTrendSeries(data?.jobLifecycle, filteredCandidateExperience),
    [data?.jobLifecycle, filteredCandidateExperience],
  );

  const slaAlerts = useMemo(
    () => buildSlaAlerts(data?.jobLifecycle, data?.candidateCare, data?.interviewOperations),
    [data?.jobLifecycle, data?.candidateCare, data?.interviewOperations],
  );

  const profile = useMemo(() => buildProfile(data), [data]);
  const workspaceOptions = data?.meta?.availableWorkspaces ?? [];
  const atsMetrics = useMemo(
    () =>
      buildAtsSummary(
        data?.jobLifecycle,
        filteredCandidateExperience,
        data?.interviewOperations,
        fairnessInsights,
      ),
    [data?.jobLifecycle, filteredCandidateExperience, data?.interviewOperations, fairnessInsights],
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

  const handleSegmentChange = useCallback((key, value) => {
    setSegmentFilters((previous) => ({ ...previous, [key]: value }));
  }, []);

  const handleSegmentReset = useCallback(() => {
    setSegmentFilters({ department: 'all', recruiter: 'all' });
  }, []);

  const handleMetricDrilldown = useCallback(
    (metric) => {
      if (metric.href) {
        navigate(metric.href, { state: { from: '/dashboard/company/ats', metric } });
      }
    },
    [navigate],
  );

  const handleTrendNavigate = useCallback(() => {
    navigate('/dashboard/company/pipeline', { state: { from: '/dashboard/company/ats' } });
  }, [navigate]);

  const handleFairnessNavigate = useCallback(() => {
    navigate('/dashboard/company/ats/fairness', { state: { from: '/dashboard/company/ats' } });
  }, [navigate]);

  const handleExport = useCallback(() => {
    if (!data) {
      return;
    }

    setExporting(true);

    try {
      const sanitizedMetrics = (atsMetrics ?? []).filter(Boolean).map((metric) => ({
        label: metric.label,
        value: metric.value,
        helper: metric.helper,
        href: metric.href ?? null,
      }));

      const exportPayload = {
        generatedAt: new Date().toISOString(),
        lookbackDays: data?.meta?.lookbackDays ?? lookbackDays,
        filters: segmentFilters,
        summaryMetrics: sanitizedMetrics,
        fairness: fairnessInsights,
        candidateExperience: filteredCandidateExperience,
        slaAlerts,
        trend: pipelineTrend,
      };

      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `gigvora-ats-ops-${Date.now()}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }, [atsMetrics, data, fairnessInsights, filteredCandidateExperience, lookbackDays, pipelineTrend, segmentFilters, slaAlerts]);

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

        <SegmentationFilterBar
          filters={segmentFilters}
          options={segmentationOptions}
          onChange={handleSegmentChange}
          onReset={handleSegmentReset}
          onExport={handleExport}
          exporting={exporting}
          disableExport={!data}
        />

        <SummaryGrid metrics={atsMetrics} onDrilldown={handleMetricDrilldown} />

        <AtsTrendPanel trend={pipelineTrend} onNavigate={handleTrendNavigate} />

        <JobLifecycleSection
          jobLifecycle={data?.jobLifecycle}
          recommendations={data?.recommendations}
          lookbackDays={data?.meta?.lookbackDays ?? lookbackDays}
        />

        <CandidateExperienceHighlights
          candidateExperience={filteredCandidateExperience}
          candidateCare={candidateCare}
          enterpriseReadiness={data?.jobLifecycle?.enterpriseReadiness}
          atsHealth={data?.jobLifecycle?.atsHealth}
          segmentLabel={segmentLabel}
        />

        <FairnessAnalyticsPanel fairnessInsights={fairnessInsights} onNavigate={handleFairnessNavigate} />

        <SlaAlertsPanel alerts={slaAlerts} />

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
