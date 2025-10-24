import PropTypes from 'prop-types';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  BoltIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { formatRelativeTime } from '../../utils/date.js';
import {
  formatMetricNumber,
  formatMetricPercent,
  formatMetricChange,
} from '../../utils/metrics.js';

function clamp(value, min = 0, max = 100) {
  return Math.min(Math.max(value, min), max);
}

function normalisePercent(value) {
  if (value == null) {
    return null;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return null;
  }
  return numeric > 1 ? clamp(numeric, 0, 100) : clamp(numeric * 100, 0, 100);
}

function deriveHealthScore({ velocity, conversionRates, candidateExperience, alerts }) {
  const metrics = [];

  if (velocity?.averageDaysToDecision != null) {
    const avgDays = Number(velocity.averageDaysToDecision);
    if (Number.isFinite(avgDays)) {
      metrics.push(clamp(100 - avgDays * 2, 5, 100));
    }
  }

  if (conversionRates?.hireRate != null) {
    const hireRate = normalisePercent(conversionRates.hireRate);
    if (hireRate != null) {
      metrics.push(hireRate);
    }
  }

  if (conversionRates?.interviewRate != null) {
    const interviewRate = normalisePercent(conversionRates.interviewRate);
    if (interviewRate != null) {
      metrics.push(interviewRate);
    }
  }

  if (candidateExperience?.nps != null) {
    const nps = Number(candidateExperience.nps);
    if (Number.isFinite(nps)) {
      metrics.push(clamp((nps + 100) / 2, 0, 100));
    }
  }

  if (alerts?.open != null) {
    const openAlerts = Number(alerts.open);
    if (Number.isFinite(openAlerts)) {
      const alertScore = clamp(100 - openAlerts * 4, 10, 100);
      metrics.push(alertScore);
    }
  }

  if (!metrics.length) {
    return null;
  }

  const total = metrics.reduce((sum, value) => sum + value, 0);
  return Math.round(total / metrics.length);
}

function deriveHealthStatus(score) {
  if (score == null) {
    return { label: 'Unknown', tone: 'bg-slate-100 text-slate-700', helper: 'Awaiting telemetry' };
  }
  if (score >= 80) {
    return { label: 'Healthy', tone: 'bg-emerald-100 text-emerald-700', helper: 'On track' };
  }
  if (score >= 60) {
    return { label: 'Monitored', tone: 'bg-amber-100 text-amber-700', helper: 'Watch pipeline speed' };
  }
  return { label: 'At risk', tone: 'bg-rose-100 text-rose-700', helper: 'Needs intervention' };
}

function HealthProgress({ label, value, helper }) {
  const percentage = clamp(value ?? 0);
  return (
    <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">{label}</p>
      <div className="mt-3 flex items-end justify-between gap-4">
        <div className="flex-1">
          <div className="h-2 rounded-full bg-indigo-100">
            <div
              className="h-2 rounded-full bg-indigo-500 transition-all"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-indigo-700">{helper}</p>
        </div>
        <span className="text-xl font-semibold text-indigo-900">{percentage}%</span>
      </div>
    </div>
  );
}

HealthProgress.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.number,
  helper: PropTypes.string.isRequired,
};

HealthProgress.defaultProps = {
  value: 0,
};

function AlertList({ alerts }) {
  if (!Array.isArray(alerts) || !alerts.length) {
    return (
      <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/50 p-4 text-sm text-amber-700">
        No critical alerts detected in this window.
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {alerts.map((alert) => (
        <li
          key={alert.id ?? alert.title ?? alert.type}
          className="rounded-2xl border border-amber-200 bg-white/80 p-4 shadow-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-slate-900">{alert.title ?? alert.type ?? 'Alert'}</p>
              <p className="text-xs text-slate-600">{alert.summary ?? alert.description ?? 'Review details'}</p>
            </div>
            {alert.severity ? (
              <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
                {alert.severity}
              </span>
            ) : null}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
            {alert.owner ? <span>Owner: {alert.owner}</span> : null}
            {alert.detectedAt ? (
              <span title={formatRelativeTime(alert.detectedAt)}>
                {formatRelativeTime(alert.detectedAt)}
              </span>
            ) : null}
            {alert.status ? <span>Status: {alert.status}</span> : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

AlertList.propTypes = {
  alerts: PropTypes.arrayOf(PropTypes.object),
};

AlertList.defaultProps = {
  alerts: undefined,
};

function InsightSummary({ score, status, lookbackDays, recommendations, throughput }) {
  const icon = status.label === 'At risk' ? ExclamationTriangleIcon : status.label === 'Healthy' ? BoltIcon : InformationCircleIcon;
  const Icon = icon;

  return (
    <div className="space-y-4 rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-indigo-100 p-6 shadow-[0_18px_40px_-24px_rgba(30,64,175,0.35)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">Hiring health</p>
          <h2 className="text-2xl font-semibold text-slate-900">AI summary</h2>
        </div>
        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${status.tone}`}>
          <Icon className="h-4 w-4" />
          {status.label}
        </span>
      </div>
      <p className="text-sm text-slate-600">
        {score != null
          ? `Overall hiring health scored ${score}/100 in the last ${lookbackDays} days.`
          : 'We do not have enough telemetry for an automated assessment yet.'}
      </p>
      {throughput ? (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-white/80 px-4 py-3 text-sm font-semibold text-indigo-700">
          {throughput.change > 0 ? (
            <ArrowUpIcon className="h-5 w-5" />
          ) : throughput.change < 0 ? (
            <ArrowDownIcon className="h-5 w-5" />
          ) : (
            <InformationCircleIcon className="h-5 w-5" />
          )}
          <span>
            Pipeline throughput {throughput.label} {throughput.displayChange}. {throughput.context}
          </span>
        </div>
      ) : null}
      <ul className="space-y-2 text-sm text-slate-600">
        {(recommendations ?? []).length
          ? recommendations.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                <span>{item}</span>
              </li>
            ))
          : [
              'Feed additional ATS telemetry to unlock predictive hiring guidance.',
              'Connect candidate satisfaction surveys for richer sentiment analysis.',
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                <span>{item}</span>
              </li>
            ))}
      </ul>
    </div>
  );
}

InsightSummary.propTypes = {
  score: PropTypes.number,
  status: PropTypes.shape({
    label: PropTypes.string.isRequired,
    tone: PropTypes.string.isRequired,
    helper: PropTypes.string.isRequired,
  }).isRequired,
  lookbackDays: PropTypes.number.isRequired,
  recommendations: PropTypes.arrayOf(PropTypes.string),
  throughput: PropTypes.shape({
    change: PropTypes.number.isRequired,
    displayChange: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    context: PropTypes.string.isRequired,
  }),
};

InsightSummary.defaultProps = {
  score: null,
  recommendations: undefined,
  throughput: undefined,
};

export default function HiringHealthInsights({
  pipelineSummary,
  candidateExperience,
  alerts,
  offers,
  lookbackDays,
  recommendations,
}) {
  const velocity = pipelineSummary?.velocity ?? {};
  const conversionRates = pipelineSummary?.conversionRates ?? {};

  const score = deriveHealthScore({ velocity, conversionRates, candidateExperience, alerts });
  const status = deriveHealthStatus(score);

  const throughputChange =
    velocity?.averageDaysToDecision != null && velocity?.previousAverageDaysToDecision != null
      ? Number(velocity.averageDaysToDecision) - Number(velocity.previousAverageDaysToDecision)
      : null;

  const throughput =
    throughputChange != null
      ? {
          change: throughputChange,
          displayChange: formatMetricChange(
            velocity.averageDaysToDecision,
            velocity.previousAverageDaysToDecision,
            { decimals: 1, includeSymbol: true },
          ),
          label: throughputChange < 0 ? 'improved' : throughputChange > 0 ? 'slowed' : 'held steady',
          context:
            throughputChange < 0
              ? 'Decisions are moving faster than the prior window.'
              : throughputChange > 0
              ? 'Investigate interview handoffs to regain speed.'
              : 'Throughput matched the previous window.',
        }
      : null;

  const openAlerts = Array.isArray(alerts?.items)
    ? alerts.items.filter((item) => (item.status ?? 'open').toLowerCase() !== 'resolved').slice(0, 3)
    : [];

  const progressMetrics = [
    {
      label: 'Interview rate',
      value: normalisePercent(conversionRates.interviewRate) ?? 0,
      helper: `Interviews for ${formatMetricNumber(pipelineSummary?.totals?.applications ?? 0)} applications`,
    },
    {
      label: 'Offer to hire',
      value: normalisePercent(conversionRates.hireRate) ?? 0,
      helper: `Offers converted ${
        offers?.winRate != null ? formatMetricPercent(offers.winRate) : 'Connect offer data'
      }`,
    },
    {
      label: 'Candidate sentiment',
      value:
        candidateExperience?.nps != null
          ? clamp(Math.round(((Number(candidateExperience.nps) + 100) / 2) || 0), 0, 100)
          : 0,
      helper:
        candidateExperience?.responseCount != null
          ? `${formatMetricNumber(candidateExperience.responseCount)} survey responses`
          : 'Sync candidate surveys to unlock insights',
    },
  ];

  return (
    <section
      id="hiring-health-insights"
      className="space-y-6 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-[0_18px_40px_-24px_rgba(30,64,175,0.35)] sm:p-8"
    >
      <InsightSummary
        score={score}
        status={status}
        lookbackDays={lookbackDays}
        recommendations={recommendations}
        throughput={throughput}
      />

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Analytics overlays</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {progressMetrics.map((metric) => (
              <HealthProgress key={metric.label} label={metric.label} value={metric.value} helper={metric.helper} />
            ))}
          </div>
        </div>
        <div className="space-y-4 lg:col-span-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Alert center</h3>
          <AlertList alerts={openAlerts} />
        </div>
      </div>
    </section>
  );
}

HiringHealthInsights.propTypes = {
  pipelineSummary: PropTypes.object,
  candidateExperience: PropTypes.object,
  alerts: PropTypes.shape({
    items: PropTypes.array,
    open: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }),
  offers: PropTypes.object,
  lookbackDays: PropTypes.number.isRequired,
  recommendations: PropTypes.arrayOf(PropTypes.string),
};

HiringHealthInsights.defaultProps = {
  pipelineSummary: null,
  candidateExperience: null,
  alerts: null,
  offers: null,
  recommendations: undefined,
};
