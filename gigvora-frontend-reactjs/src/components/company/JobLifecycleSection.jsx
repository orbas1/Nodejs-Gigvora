import {
  ArrowTopRightOnSquareIcon,
  ArrowPathIcon,
  BoltIcon,
  ChartBarIcon,
  ChartPieIcon,
  CheckCircleIcon,
  ClockIcon,
  Cog6ToothIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { formatAbsolute, formatRelativeTime } from '../../utils/date.js';
import StatusBadge from '../common/StatusBadge.jsx';

function formatNumber(value, { fallback = '—', decimals = null, style = 'number' } = {}) {
  if (value == null || Number.isNaN(Number(value))) {
    return fallback;
  }
  const numeric = Number(value);
  if (style === 'currency') {
    const fractionDigits = decimals ?? (numeric < 100 ? 2 : 0);
    return `$${numeric.toLocaleString(undefined, {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    })}`;
  }
  if (decimals != null) {
    return numeric.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }
  return numeric.toLocaleString();
}

function formatPercent(value, fallback = '—') {
  if (value == null || Number.isNaN(Number(value))) {
    return fallback;
  }
  return `${Number(value).toFixed(1)}%`;
}

const READINESS_STATUS_META = {
  healthy: {
    label: 'Healthy',
    badgeClass: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    barClass: 'bg-emerald-500',
  },
  watch: {
    label: 'Monitor',
    badgeClass: 'border-amber-200 bg-amber-50 text-amber-700',
    barClass: 'bg-amber-500',
  },
  at_risk: {
    label: 'At risk',
    badgeClass: 'border-rose-200 bg-rose-50 text-rose-700',
    barClass: 'bg-rose-500',
  },
  unknown: {
    label: 'Pending',
    badgeClass: 'border-slate-200 bg-slate-100 text-slate-600',
    barClass: 'bg-slate-400',
  },
};

function getReadinessStatusMeta(status) {
  return READINESS_STATUS_META[status] ?? READINESS_STATUS_META.unknown;
}

function formatStatusLabel(status) {
  return getReadinessStatusMeta(status).label;
}

function readinessStatusToTone(status) {
  if (status === 'at_risk') return 'alert';
  if (status === 'watch') return 'caution';
  if (status === 'healthy') return 'positive';
  if (status === 'unknown') return 'neutral';
  return 'default';
}

function formatTier(tier) {
  if (!tier || tier === 'insufficient_data') {
    return 'Insufficient data';
  }
  return tier
    .split('_')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

function ConfidenceBar({ value }) {
  if (value == null || Number.isNaN(Number(value))) {
    return <div className="h-2 w-full rounded-full bg-slate-200" />;
  }
  const numeric = Math.max(0, Math.min(Number(value), 100));
  const tone = numeric >= 80 ? 'bg-emerald-500' : numeric >= 60 ? 'bg-amber-500' : 'bg-rose-500';
  return (
    <div className="h-2 w-full rounded-full bg-slate-200">
      <div className={`h-full rounded-full ${tone}`} style={{ width: `${numeric}%` }} />
    </div>
  );
}

function ReadinessStatusBadge({ status, children, className = '' }) {
  const meta = getReadinessStatusMeta(status);
  return (
    <StatusBadge
      status={status}
      category="readiness"
      label={children ?? meta.label}
      uppercase
      size="xs"
      className={className}
    />
  );
}

function ReadinessScorecard({ items }) {
  if (!items?.length) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm">
      <h4 className="text-sm font-semibold text-slate-900">Signal health</h4>
      <p className="mt-1 text-xs text-slate-500">Instrumentation quality across readiness inputs.</p>
      <ul className="mt-4 space-y-3">
        {items.map((item) => {
          const meta = getReadinessStatusMeta(item.status);
          const progress = Math.max(0, Math.min(Number(item.value ?? 0), 100));
          return (
            <li
              key={item.id}
              className="rounded-2xl border border-slate-100 bg-white/90 p-3 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                  <p className="text-xs text-slate-500">Goal {formatPercent(item.goal)}</p>
                </div>
                <ReadinessStatusBadge status={item.status} />
              </div>
              <div className="mt-3 flex items-center gap-2">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
                  <div className={`h-full rounded-full ${meta.barClass}`} style={{ width: `${progress}%` }} />
                </div>
                <span className="text-xs font-semibold text-slate-600">{formatPercent(item.value)}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ReadinessWatchouts({ watchouts }) {
  if (!watchouts?.length) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm">
      <h4 className="text-sm font-semibold text-slate-900">Watchouts</h4>
      <p className="mt-1 text-xs text-slate-500">Risks to resolve to stay enterprise ready.</p>
      <ul className="mt-4 space-y-3">
        {watchouts.map((item, index) => (
          <li
            key={`${item}-${index}`}
            className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-white/90 p-3 shadow-sm"
          >
            <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 text-amber-500" />
            <p className="text-sm text-slate-700">{item}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ReadinessActions({ actions }) {
  if (!actions?.length) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm">
      <h4 className="text-sm font-semibold text-slate-900">Next actions</h4>
      <p className="mt-1 text-xs text-slate-500">Prioritised plays to advance ATS maturity.</p>
      <ul className="mt-4 space-y-3">
        {actions.map((action, index) => (
          <li
            key={action.id ?? action.title ?? index}
            className="rounded-2xl border border-slate-100 bg-white/90 p-3 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <CheckCircleIcon className="mt-0.5 h-4 w-4 text-emerald-500" />
              <div>
                <p className="text-sm font-semibold text-slate-900">{action.title}</p>
                {action.description ? (
                  <p className="mt-1 text-xs text-slate-500">{action.description}</p>
                ) : null}
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  {action.impact ? (
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-600">Impact {action.impact}</span>
                  ) : null}
                  {action.category ? (
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-blue-600">{action.category}</span>
                  ) : null}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StagePerformanceTable({ items }) {
  if (!items?.length) {
    return (
      <p className="text-sm text-slate-500">
        Configure your ATS stages and capture interviewer feedback to unlock lifecycle analytics.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50/60 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th scope="col" className="px-4 py-3">Stage</th>
            <th scope="col" className="px-4 py-3">SLA</th>
            <th scope="col" className="px-4 py-3">Avg duration</th>
            <th scope="col" className="px-4 py-3">Advance rate</th>
            <th scope="col" className="px-4 py-3">Pending</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {items.map((stage) => {
            const slaDelta = stage.slaDeltaHours;
            const slaBadgeTone = slaDelta != null && slaDelta > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600';
            const progress = Math.min(Math.max(stage.advanceRate ?? 0, 0), 100);
            return (
              <tr key={stage.id} className="align-top">
                <td className="px-4 py-3">
                  <div className="font-semibold text-slate-900">{stage.name}</div>
                  {stage.guideUrl ? (
                    <a
                      href={stage.guideUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
                    >
                      Stage guide
                      <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
                    </a>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {stage.slaHours != null ? `${formatNumber(stage.slaHours, { decimals: 0 })} hrs` : '—'}
                  {slaDelta != null ? (
                    <span className={`ml-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${slaBadgeTone}`}>
                      {slaDelta > 0 ? `+${formatNumber(slaDelta, { decimals: 1 })} hrs` : `${formatNumber(slaDelta, { decimals: 1 })} hrs`}
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {stage.averageDurationHours != null
                    ? `${formatNumber(stage.averageDurationHours, { decimals: 1 })} hrs`
                    : '—'}
                  {stage.medianDecisionHours != null ? (
                    <p className="text-xs text-slate-400">Median {formatNumber(stage.medianDecisionHours, { decimals: 1 })} hrs</p>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className={`h-full rounded-full ${progress >= 50 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-slate-700">{formatPercent(stage.advanceRate)}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    Rejections {formatPercent(stage.rejectionRate)} · Holds {formatPercent(stage.holdRate)}
                  </p>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {formatNumber(stage.pendingReviews)}
                  <p className="text-xs text-slate-400">Throughput {formatNumber(stage.throughput)}</p>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ApprovalQueue({ queue }) {
  if (!queue?.items?.length) {
    return (
      <p className="text-sm text-slate-500">
        No approvals are pending. Hiring managers and finance partners have cleared their review queue.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {queue.items.map((item) => {
        const statusTone = item.isOverdue ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600';
        return (
          <li key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{item.approverRole}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {item.createdAt ? `Waiting ${formatRelativeTime(item.createdAt)}` : 'Awaiting review'}
                  {item.dueAt ? ` · Due ${formatRelativeTime(item.dueAt)}` : ''}
                </p>
              </div>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${statusTone}`}
                title={item.dueAt ? formatAbsolute(item.dueAt) : undefined}
              >
                <ClockIcon className="h-3.5 w-3.5" />
                {item.isOverdue ? 'Overdue' : item.status.replace(/_/g, ' ')}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function CampaignInsights({ campaigns }) {
  if (!campaigns?.topChannels?.length) {
    return (
      <p className="text-sm text-slate-500">
        Publish requisitions to Gigvora, job boards, or referral programs to unlock channel performance analytics.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {campaigns.topChannels.map((channel) => {
        const width = Math.min(Math.max(channel.conversionRate ?? 0, 0), 100);
        return (
          <div key={channel.channel} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between text-sm">
              <p className="font-semibold text-slate-900">{channel.channel}</p>
              <p className="text-slate-500">{formatNumber(channel.applications)} applications</p>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-indigo-500" style={{ width: `${width}%` }} />
              </div>
              <span className="text-xs font-semibold text-slate-600">{formatPercent(channel.conversionRate)}</span>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {formatNumber(channel.hires)} hires · CPA {formatNumber(channel.spend / Math.max(channel.applications, 1), { style: 'currency', decimals: 2 })}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function FunnelOverview({ funnel }) {
  if (!funnel?.length) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">Pipeline conversion</h3>
      <ul className="mt-3 space-y-2 text-sm text-slate-600">
        {funnel.map((stage) => (
          <li key={stage.status} className="flex items-center justify-between gap-3">
            <span className="font-medium text-slate-700">{stage.label}</span>
            <span className="text-xs text-slate-500">
              {formatNumber(stage.count)} · {formatPercent(stage.cumulativeConversion)} overall · {formatPercent(stage.conversionFromPrevious)} stage
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RecommendationsList({ recommendations }) {
  if (!recommendations?.length) {
    return (
      <p className="text-sm text-slate-500">
        As data flows into your ATS, Gigvora Intelligence will suggest actions to accelerate hiring.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {recommendations.map((item) => (
        <li key={item.title} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">{item.title}</p>
          {item.description ? <p className="mt-1 text-sm text-slate-600">{item.description}</p> : null}
          {item.action ? <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-blue-600">{item.action}</p> : null}
        </li>
      ))}
    </ul>
  );
}

function ReadinessAreaCard({ title, icon: Icon, tone = 'bg-indigo-100 text-indigo-600', metrics = [], status = 'unknown' }) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${tone}`}>
            <Icon className="h-4 w-4" />
          </span>
          <p className="text-sm font-semibold text-slate-900 text-pretty">{title}</p>
        </div>
        <ReadinessStatusBadge status={status} />
      </div>
      <dl className="mt-4 space-y-3">
        {metrics.map((metric) => (
          <div key={metric.label}>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{metric.label}</dt>
            <dd className="mt-1 text-sm font-semibold text-slate-900 break-words">{metric.value}</dd>
            {metric.caption ? <p className="text-xs text-slate-500 text-pretty">{metric.caption}</p> : null}
          </div>
        ))}
      </dl>
    </div>
  );
}

function EnterpriseReadinessSummary({ readiness, lookbackDays = 30 }) {
  if (!readiness) {
    return null;
  }

  const instrumentation = readiness.instrumentation ?? {};
  const scorecardItems = Array.isArray(readiness.scorecard) ? readiness.scorecard : [];
  const watchouts = Array.isArray(readiness.watchouts) ? readiness.watchouts.filter(Boolean) : [];
  const actions = Array.isArray(readiness.actions)
    ? readiness.actions.filter((action) => action && (action.title || action.description))
    : [];
  const health = readiness.health ?? {};
  const overallStatus = health.overall ?? 'unknown';
  const maturityTierLabel = formatTier(readiness.maturityTier);
  const confidenceValue =
    readiness.scoreConfidence != null && !Number.isNaN(Number(readiness.scoreConfidence))
      ? Number(readiness.scoreConfidence)
      : null;
  const dataFreshnessLabel =
    readiness.dataFreshnessHours != null && !Number.isNaN(Number(readiness.dataFreshnessHours))
      ? `${formatNumber(readiness.dataFreshnessHours, { decimals: 1 })} hrs`
      : null;
  const measuredSignalsLabel =
    instrumentation.measuredSignals != null
      ? `${formatNumber(instrumentation.measuredSignals)} of ${formatNumber(
          instrumentation.expectedSignals ?? 9,
        )} signals`
      : null;
  const lastUpdatedRelative = readiness.lastUpdatedAt ? formatRelativeTime(readiness.lastUpdatedAt) : null;

  const automation = readiness.automation ?? {};
  const collaboration = readiness.collaboration ?? {};
  const compliance = readiness.compliance ?? {};
  const experience = readiness.experience ?? {};
  const highlights = Array.isArray(readiness.highlights) ? readiness.highlights.filter(Boolean).slice(0, 4) : [];

  const automationStageCaption =
    (automation.totalStages ?? 0) > 0
      ? `${formatNumber(automation.instrumentedStages ?? 0)} of ${formatNumber(automation.totalStages)} stages`
      : 'Configure stages to enable automation insights';
  const reminderCaption =
    automation.reminderCoverage != null
      ? 'Automated nudges across upcoming interviews'
      : 'Enable reminders to reduce no-shows';
  const availabilityCaption =
    automation.availabilityCoverage != null
      ? 'Scheduler capacity matched to interviewer availability'
      : 'Sync interviewer availability to unlock coverage insights';

  const calibrationCaption =
    (collaboration.calibrationsScheduled ?? 0) > 0
      ? `${formatNumber(collaboration.calibrationsScheduled)} calibration${collaboration.calibrationsScheduled === 1 ? '' : 's'} scheduled`
      : 'Schedule calibration sessions to benchmark interview quality';
  const interviewerCoverageCaption =
    Array.isArray(collaboration.interviewerLoad) && collaboration.interviewerLoad.length
      ? `${formatNumber(collaboration.interviewerLoad.length)} interviewers active`
      : 'Assign interviewer panels to extend coverage';

  const formsCaption =
    compliance.formCompletionRate != null
      ? `Forms ${formatPercent(compliance.formCompletionRate)}`
      : 'Forms instrumentation not captured yet';
  const approvalsCaption =
    compliance.approvalsPending
      ? `${formatNumber(compliance.approvalsPending)} approvals pending`
      : 'All approvals cleared';

  const experienceResponseCaption =
    experience.averageResponseMinutes != null
      ? `Response ${formatNumber(experience.averageResponseMinutes, { decimals: 0 })} mins · Escalations ${formatNumber(experience.escalations ?? 0)}`
      : `Escalations ${formatNumber(experience.escalations ?? 0)}`;

  const automationMetrics = [
    {
      label: 'Stage coverage',
      value: formatPercent(automation.stageAutomationCoverage),
      caption: automationStageCaption,
    },
    {
      label: 'Reminder coverage',
      value: formatPercent(automation.reminderCoverage),
      caption: reminderCaption,
    },
    {
      label: 'Availability coverage',
      value: formatPercent(automation.availabilityCoverage),
      caption: availabilityCaption,
    },
  ];

  const collaborationMetrics = [
    {
      label: 'Template coverage',
      value: formatPercent(collaboration.templateCoverage),
      caption: calibrationCaption,
    },
    {
      label: 'Bias-safe reviews',
      value: formatPercent(collaboration.anonymizedEvaluationsShare),
      caption: 'Anonymised scorecards submitted',
    },
    {
      label: 'Roles covered',
      value: formatNumber(
        collaboration.rolesCovered ?? (Array.isArray(collaboration.interviewerLoad) ? collaboration.interviewerLoad.length : null),
      ),
      caption: interviewerCoverageCaption,
    },
  ];

  const complianceMetrics = [
    {
      label: 'NDA completion',
      value: formatPercent(compliance.ndaCompletionRate),
      caption: formsCaption,
    },
    {
      label: 'Background checks',
      value: formatNumber(compliance.backgroundChecksInProgress ?? 0),
      caption: approvalsCaption,
    },
    {
      label: 'Stage guides',
      value: formatPercent(compliance.guideCoverage),
      caption: 'Stages with documented guides',
    },
  ];

  const experienceMetrics = [
    {
      label: 'Resource engagement',
      value: formatPercent(experience.resourceEngagementRate),
      caption:
        experience.resourceEngagementRate != null
          ? 'Portal resources actively reviewed'
          : 'Publish prep resources to unlock engagement insights',
    },
    {
      label: 'Inclusion score',
      value: formatPercent(experience.inclusionScore),
      caption:
        experience.openTickets != null
          ? `${formatNumber(experience.openTickets)} open tickets`
          : 'Support queue clear',
    },
    {
      label: 'Candidate NPS',
      value:
        experience.nps != null && !Number.isNaN(Number(experience.nps))
          ? Number(experience.nps).toFixed(1)
          : '—',
      caption: experienceResponseCaption,
    },
  ];

  return (
    <section className="mt-10 rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-blue-50 p-6 shadow-[0_22px_60px_-30px_rgba(30,64,175,0.45)]">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Enterprise readiness</p>
          <h3 className="mt-2 text-xl font-semibold text-slate-900">ATS maturity benchmark</h3>
          <p className="mt-1 text-sm text-slate-600">
            Scorecard blending automation, collaboration, compliance, and candidate experience signals captured in the past{' '}
            {lookbackDays} days.
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Overall status <span className="font-semibold text-slate-700">{formatStatusLabel(overallStatus)}</span> · Tier{' '}
            <span className="font-semibold text-slate-700">{maturityTierLabel}</span>
          </p>
        </div>
        <div className="rounded-2xl border border-white/80 bg-white px-5 py-3 text-center shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Maturity score</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{formatPercent(readiness.maturityScore)}</p>
          <p className="text-xs text-slate-500">{maturityTierLabel}</p>
          <ReadinessStatusBadge status={overallStatus} className="mx-auto mt-2" />
          <div className="mt-3 text-left text-xs text-slate-500">
            <p className="font-semibold uppercase tracking-wide text-slate-400">Score confidence</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-700">
                {confidenceValue != null ? formatPercent(confidenceValue) : '—'}
              </span>
              <div className="flex-1">
                <ConfidenceBar value={confidenceValue} />
              </div>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              {measuredSignalsLabel ? `${measuredSignalsLabel} active` : 'Connect lifecycle signals to increase confidence.'}
            </p>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            {lastUpdatedRelative
              ? `Signals refreshed ${lastUpdatedRelative} · Data freshness ${dataFreshnessLabel ?? '—'}`
              : `Data freshness ${dataFreshnessLabel ?? '—'}`}
          </p>
        </div>
      </div>
      {highlights.length ? (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {highlights.map((item, index) => (
            <li
              key={`${item}-${index}`}
              className="rounded-2xl border border-white/60 bg-white/70 px-4 py-3 text-sm text-slate-700 shadow-sm backdrop-blur"
            >
              {item}
            </li>
          ))}
        </ul>
      ) : null}
      <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        <ReadinessAreaCard
          title="Automation & orchestration"
          icon={Cog6ToothIcon}
          tone="bg-indigo-100 text-indigo-600"
          metrics={automationMetrics}
          status={health.automation}
        />
        <ReadinessAreaCard
          title="Collaboration & quality"
          icon={UserGroupIcon}
          tone="bg-blue-100 text-blue-600"
          metrics={collaborationMetrics}
          status={health.collaboration}
        />
        <ReadinessAreaCard
          title="Compliance & guardrails"
          icon={ShieldCheckIcon}
          tone="bg-emerald-100 text-emerald-600"
          metrics={complianceMetrics}
          status={health.compliance}
        />
        <ReadinessAreaCard
          title="Candidate experience"
          icon={SparklesIcon}
          tone="bg-sky-100 text-sky-600"
          metrics={experienceMetrics}
          status={health.experience}
        />
      </div>
      {scorecardItems.length || watchouts.length || actions.length ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
          {scorecardItems.length ? <ReadinessScorecard items={scorecardItems} /> : null}
          {watchouts.length || actions.length ? (
            <div className="space-y-6">
              <ReadinessWatchouts watchouts={watchouts} />
              <ReadinessActions actions={actions} />
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

export default function JobLifecycleSection({ jobLifecycle, recommendations = [], lookbackDays = 30 }) {
  const readiness = jobLifecycle?.enterpriseReadiness ?? {};
  const automation = readiness.automation ?? {};
  const collaboration = readiness.collaboration ?? {};
  const compliance = readiness.compliance ?? {};
  const health = readiness.health ?? {};
  const instrumentation = readiness.instrumentation ?? {};
  const overallStatus = health.overall ?? 'unknown';
  const maturityTierLabel = formatTier(readiness.maturityTier);
  const scoreConfidenceValue =
    readiness.scoreConfidence != null && !Number.isNaN(Number(readiness.scoreConfidence))
      ? Number(readiness.scoreConfidence)
      : null;
  const dataFreshnessHours =
    readiness.dataFreshnessHours != null && !Number.isNaN(Number(readiness.dataFreshnessHours))
      ? Number(readiness.dataFreshnessHours)
      : null;
  const scoreConfidenceStatus =
    scoreConfidenceValue == null
      ? 'unknown'
      : scoreConfidenceValue >= 70
        ? 'healthy'
        : scoreConfidenceValue >= 50
          ? 'watch'
          : 'at_risk';
  const dataFreshnessStatus =
    dataFreshnessHours == null
      ? 'watch'
      : dataFreshnessHours > 48
        ? 'at_risk'
        : dataFreshnessHours > 24
          ? 'watch'
          : 'healthy';
  const overallTone = readinessStatusToTone(overallStatus);
  const confidenceTone = readinessStatusToTone(scoreConfidenceStatus);
  const dataFreshnessTone = readinessStatusToTone(dataFreshnessStatus);
  const automationTone = readinessStatusToTone(health.automation ?? 'unknown');
  const collaborationTone = readinessStatusToTone(health.collaboration ?? 'unknown');
  const complianceTone = readinessStatusToTone(health.compliance ?? 'unknown');
  const maturityCaption =
    readiness.maturityScore != null
      ? `${maturityTierLabel} coverage across automation, collaboration, compliance.`
      : 'Instrumentation across automation, collaboration, compliance.';
  const measuredSignalsLabel =
    instrumentation.measuredSignals != null
      ? `${formatNumber(instrumentation.measuredSignals)} of ${formatNumber(
          instrumentation.expectedSignals ?? 9,
        )} signals`
      : null;
  const signalsCaption = measuredSignalsLabel ? `${measuredSignalsLabel} instrumented` : 'Connect lifecycle signals';
  const dataFreshnessCaption = readiness.lastUpdatedAt
    ? `Updated ${formatRelativeTime(readiness.lastUpdatedAt)}`
    : 'Awaiting recent signals';

  const automationStageCaption =
    (automation.totalStages ?? 0) > 0
      ? `${formatNumber(automation.instrumentedStages ?? 0)} of ${formatNumber(automation.totalStages)} stages`
      : 'Configure stages to enable automation insights';
  const calibrationCaption =
    (collaboration.calibrationsScheduled ?? 0) > 0
      ? `${formatNumber(collaboration.calibrationsScheduled)} calibration${collaboration.calibrationsScheduled === 1 ? '' : 's'} scheduled`
      : 'Schedule calibration sessions to benchmark interview quality';
  const formsCaption =
    compliance.formCompletionRate != null
      ? `Forms ${formatPercent(compliance.formCompletionRate)}`
      : 'Forms instrumentation not captured yet';
  const approvalsCaption = jobLifecycle?.overdueApprovals
    ? `${formatNumber(jobLifecycle.overdueApprovals)} overdue`
    : compliance.approvalsPending
      ? `${formatNumber(compliance.approvalsPending)} approvals pending`
      : 'All approvals on track';

  const metrics = [
    {
      label: 'Maturity score',
      value: formatPercent(readiness.maturityScore),
      caption: maturityCaption,
      tone: overallTone,
      Icon: ChartPieIcon,
    },
    {
      label: 'Readiness tier',
      value: maturityTierLabel,
      caption: `Status ${formatStatusLabel(overallStatus)}`,
      tone: overallTone,
      Icon: SparklesIcon,
    },
    {
      label: 'Score confidence',
      value: scoreConfidenceValue != null ? formatPercent(scoreConfidenceValue) : '—',
      caption: signalsCaption,
      tone: confidenceTone,
      Icon: InformationCircleIcon,
    },
    {
      label: 'Data freshness',
      value:
        dataFreshnessHours != null ? `${formatNumber(dataFreshnessHours, { decimals: 1 })} hrs` : '—',
      caption: dataFreshnessCaption,
      tone: dataFreshnessTone,
      Icon: ArrowPathIcon,
    },
    {
      label: 'Stage automation',
      value: formatPercent(automation.stageAutomationCoverage),
      caption: automationStageCaption,
      tone: automationTone,
      Icon: Cog6ToothIcon,
    },
    {
      label: 'Template coverage',
      value: formatPercent(collaboration.templateCoverage),
      caption: calibrationCaption,
      tone: collaborationTone,
      Icon: UserGroupIcon,
    },
    {
      label: 'Active requisitions',
      value: formatNumber(jobLifecycle?.atsHealth?.activeRequisitions),
      caption: `${formatNumber(jobLifecycle?.stagePerformance?.length ?? 0)} stages configured`,
      Icon: ChartBarIcon,
    },
    {
      label: 'Avg stage duration',
      value:
        jobLifecycle?.averageStageDurationHours != null
          ? `${formatNumber(jobLifecycle.averageStageDurationHours, { decimals: 1 })} hrs`
          : '—',
      caption:
        jobLifecycle?.atsHealth?.velocity?.averageDaysToDecision != null
          ? `${jobLifecycle.atsHealth.velocity.averageDaysToDecision} day decision velocity`
          : 'Capture decisions to monitor velocity',
      Icon: ClockIcon,
    },
    {
      label: 'Pending approvals',
      value: formatNumber(jobLifecycle?.pendingApprovals),
      caption: approvalsCaption,
      tone: jobLifecycle?.overdueApprovals ? 'alert' : jobLifecycle?.pendingApprovals ? 'caution' : 'default',
      Icon: ExclamationTriangleIcon,
    },
    {
      label: 'Campaign spend',
      value: formatNumber(jobLifecycle?.campaigns?.totalSpend, { style: 'currency' }),
      caption:
        jobLifecycle?.campaigns?.averageCostPerApplication != null
          ? `Avg CPA ${formatNumber(jobLifecycle.campaigns.averageCostPerApplication, { style: 'currency', decimals: 2 })}`
          : 'No spend recorded this window',
      Icon: BoltIcon,
    },
    {
      label: 'Upcoming interviews',
      value: formatNumber(jobLifecycle?.atsHealth?.upcomingInterviews),
      caption:
        jobLifecycle?.atsHealth?.rescheduleCount
          ? `${formatNumber(jobLifecycle.atsHealth.rescheduleCount)} reschedules`
          : 'Schedules stable',
      Icon: SparklesIcon,
    },
    {
      label: 'NDA completion',
      value: formatPercent(compliance.ndaCompletionRate),
      caption: formsCaption,
      tone: complianceTone,
      Icon: ShieldCheckIcon,
    },
  ];

  return (
    <section
      id="job-lifecycle-ats-intelligence"
      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_-24px_rgba(30,64,175,0.35)] sm:p-8"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Job lifecycle & ATS intelligence</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Run a collaborative applicant tracking system with visibility from requisition intake to offer acceptance.
            Insights below reflect the past {lookbackDays} days.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-600">
          <SparklesIcon className="h-4 w-4" />
          ATS intelligence
        </span>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => {
          const Icon = metric.Icon ?? ChartBarIcon;
          const toneClass =
            metric.tone === 'alert'
              ? 'border-rose-200 bg-rose-50 text-rose-700'
              : metric.tone === 'caution'
                ? 'border-amber-200 bg-amber-50 text-amber-700'
                : metric.tone === 'positive'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : metric.tone === 'neutral'
                    ? 'border-slate-200 bg-slate-100 text-slate-600'
                    : 'border-blue-100 bg-blue-50 text-blue-700';
          return (
            <div
              key={metric.label}
              className="flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{metric.label}</p>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${toneClass}`}>
                  <Icon className="h-3.5 w-3.5" />
                  Insight
                </span>
              </div>
              <p className="mt-3 text-2xl font-semibold text-slate-900 break-words text-balance">{metric.value}</p>
              <p className="mt-2 text-xs text-slate-500 text-pretty">{metric.caption}</p>
            </div>
          );
        })}
      </div>

      <EnterpriseReadinessSummary readiness={readiness} lookbackDays={lookbackDays} />

      <div className="mt-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Stage performance</h3>
          <p className="mt-1 text-sm text-slate-500">
            Monitor SLA adherence, decision velocity, and throughput for every stage in your hiring workflow.
          </p>
          <div className="mt-4">
            <StagePerformanceTable items={jobLifecycle?.stagePerformance} />
          </div>
        </div>
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Approval queue</h3>
            <p className="mt-1 text-sm text-slate-500">
              Finance and hiring manager approvals still in flight. Automated nudges keep requisitions moving.
            </p>
            <div className="mt-4">
              <ApprovalQueue queue={jobLifecycle?.approvalQueue} />
            </div>
          </div>
          <FunnelOverview funnel={jobLifecycle?.funnel} />
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Campaign intelligence</h3>
          <p className="mt-1 text-sm text-slate-500">
            Optimise sourcing spend across Gigvora, job boards, referrals, and private talent pools.
          </p>
          <div className="mt-4">
            <CampaignInsights campaigns={jobLifecycle?.campaigns} />
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Recommended actions</h3>
          <p className="mt-1 text-sm text-slate-500">
            Data-backed guidance from Gigvora Intelligence tailored to your current lifecycle signals.
          </p>
          <div className="mt-4">
            <RecommendationsList recommendations={recommendations} />
          </div>
        </div>
      </div>

      {jobLifecycle?.recentActivity ? (
        <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50/60 p-4 text-sm text-blue-700">
          <p className="font-semibold uppercase tracking-wide">Recent lifecycle activity</p>
          <div className="mt-2 grid gap-4 sm:grid-cols-3">
            <p>
              <span className="font-semibold text-blue-900">{formatNumber(jobLifecycle.recentActivity.approvalsCompleted)}</span>
              <br /> Approvals completed
            </p>
            <p>
              <span className="font-semibold text-blue-900">{formatNumber(jobLifecycle.recentActivity.campaignsTracked)}</span>
              <br /> Campaign performance reports
            </p>
            <p>
              <span className="font-semibold text-blue-900">{formatNumber(jobLifecycle.recentActivity.interviewsScheduled)}</span>
              <br /> Interviews scheduled
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
