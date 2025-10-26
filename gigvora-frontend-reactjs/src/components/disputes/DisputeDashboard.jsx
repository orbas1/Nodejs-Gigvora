import { useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowPathIcon,
  ArrowUpRightIcon,
  BellAlertIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import DisputeMetrics from './workspace/DisputeMetrics.jsx';
import DisputeCaseList from './workspace/DisputeCaseList.jsx';
import { formatAbsolute } from '../../utils/date.js';

function toArray(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  return [value];
}

function toSentence(value) {
  if (!value) return '';
  return value
    .toString()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function computeInsights(summary = {}, cases = []) {
  const total = summary.total ?? cases.length;
  const escalated = summary.escalatedCount ?? cases.filter((item) => item.status === 'escalated').length;
  const breaches = cases.filter((item) => item.alert?.type === 'deadline' && item.alert?.severity === 'critical').length;
  const onTrack = total > 0 ? Math.max(total - breaches, 0) : 0;
  const collaboration = cases.reduce((acc, item) => acc + (item.participants?.length ?? 0), 0);
  const averageParticipants = total > 0 ? Math.round(collaboration / total) : 0;
  return {
    total,
    escalated,
    breaches,
    onTrack,
    averageParticipants,
  };
}

function median(values) {
  if (!Array.isArray(values) || values.length === 0) {
    return null;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

function computePerformanceStats(cases = [], summary = {}) {
  if (!Array.isArray(cases) || cases.length === 0) {
    return {
      topReason: summary.topReasonCode ? toSentence(summary.topReasonCode) : '—',
      medianResponse: '—',
      automationCoverage: '—',
    };
  }

  const reasonCounts = new Map();
  const responseTimes = [];
  let automatedCases = 0;

  cases.forEach((dispute) => {
    const reason = dispute.reasonCode ? toSentence(dispute.reasonCode) : null;
    if (reason) {
      reasonCounts.set(reason, (reasonCounts.get(reason) ?? 0) + 1);
    }
    const responseHours = Number(dispute.metrics?.firstResponseHours);
    if (Number.isFinite(responseHours)) {
      responseTimes.push(responseHours);
    }
    if (dispute.events?.some((event) => event.actorType === 'system' || event.actionType === 'system_notice')) {
      automatedCases += 1;
    }
  });

  const topReason = [...reasonCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';
  const medianResponseHours = median(responseTimes);
  const automationRate = Math.round((automatedCases / cases.length) * 100);

  return {
    topReason,
    medianResponse: Number.isFinite(medianResponseHours) ? `${medianResponseHours.toFixed(1)} hrs` : '—',
    automationCoverage: `${automationRate}% of cases auto-triaged`,
  };
}

function FilterPills({
  filters,
  metadata,
  onChange,
  onReset,
}) {
  const statusFilters = toArray(metadata?.statuses).slice(0, 5);
  const stageFilters = toArray(metadata?.stages).slice(0, 5);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Quick filters:</span>
      {statusFilters.map((option) => {
        const value = option.value ?? option;
        const label = option.label ?? option.name ?? toSentence(value);
        const isActive = filters.status === value;
        return (
          <button
            key={`status-${value}`}
            type="button"
            onClick={() => onChange({ ...filters, status: isActive ? '' : value })}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition ${
              isActive
                ? 'border-slate-900 bg-slate-900 text-white shadow-lg'
                : 'border-slate-200 bg-white/70 text-slate-600 hover:border-slate-300 hover:text-slate-900'
            }`}
          >
            <ShieldCheckIcon className="h-4 w-4" aria-hidden="true" />
            {label}
          </button>
        );
      })}
      {stageFilters.map((option) => {
        const value = option.value ?? option;
        const label = option.label ?? option.name ?? toSentence(value);
        const isActive = filters.stage === value;
        return (
          <button
            key={`stage-${value}`}
            type="button"
            onClick={() => onChange({ ...filters, stage: isActive ? '' : value })}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition ${
              isActive
                ? 'border-amber-500 bg-amber-500 text-white shadow-lg'
                : 'border-slate-200 bg-white/70 text-slate-600 hover:border-slate-300 hover:text-slate-900'
            }`}
          >
            <SparklesIcon className="h-4 w-4" aria-hidden="true" />
            {label}
          </button>
        );
      })}
      <button
        type="button"
        onClick={() => onReset?.()}
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
      >
        Clear
      </button>
    </div>
  );
}

FilterPills.propTypes = {
  filters: PropTypes.shape({ stage: PropTypes.string, status: PropTypes.string }).isRequired,
  metadata: PropTypes.shape({ stages: PropTypes.array, statuses: PropTypes.array }),
  onChange: PropTypes.func.isRequired,
  onReset: PropTypes.func,
};

FilterPills.defaultProps = {
  metadata: null,
  onReset: undefined,
};

export default function DisputeDashboard({
  summary,
  cases,
  metadata,
  filters,
  loading,
  lastUpdated,
  onFiltersChange,
  onResetFilters,
  onRefresh,
  onCreateCase,
  onSelectCase,
  selectedCaseId,
  permissions,
}) {
  const insights = useMemo(() => computeInsights(summary, cases), [summary, cases]);
  const lastUpdatedLabel = lastUpdated ? formatAbsolute(lastUpdated) : summary?.lastUpdatedAt ? formatAbsolute(summary.lastUpdatedAt) : '—';
  const performanceStats = useMemo(() => computePerformanceStats(cases, summary), [cases, summary]);

  return (
    <section className="space-y-6 rounded-4xl border border-white/40 bg-white/70 p-6 shadow-xl backdrop-blur">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-slate-900">Trust operations cockpit</h2>
          <p className="text-sm text-slate-500">
            Monitor escalations, uphold SLAs, and unite teams around customer advocacy.
          </p>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Last synced {lastUpdatedLabel}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm font-semibold">
          <button
            type="button"
            onClick={() => onRefresh?.({ force: true })}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
          >
            <ArrowPathIcon className="h-5 w-5" aria-hidden="true" /> Refresh data
          </button>
          <button
            type="button"
            onClick={onCreateCase}
            disabled={!permissions?.canCreate}
            className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-white shadow-lg transition ${
              permissions?.canCreate
                ? 'bg-slate-900 hover:bg-slate-800'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
            }`}
          >
            <SparklesIcon className="h-5 w-5" aria-hidden="true" /> New case
          </button>
        </div>
      </header>

      <DisputeMetrics summary={summary} />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50/70 p-4 text-sm text-emerald-800 shadow-sm">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
            <ShieldCheckIcon className="h-4 w-4" aria-hidden="true" /> SLA health
          </p>
          <p className="mt-2 text-2xl font-semibold">{insights.onTrack}/{insights.total}</p>
          <p className="text-xs text-emerald-700">Cases remain on track.</p>
        </div>
        <div className="rounded-3xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-800 shadow-sm">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
            <BellAlertIcon className="h-4 w-4" aria-hidden="true" /> Breaches & risks
          </p>
          <p className="mt-2 text-2xl font-semibold">{insights.breaches}</p>
          <p className="text-xs text-amber-700">Require immediate follow-up.</p>
        </div>
        <div className="rounded-3xl border border-blue-200 bg-blue-50/70 p-4 text-sm text-blue-800 shadow-sm">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
            <UserGroupIcon className="h-4 w-4" aria-hidden="true" /> Avg collaborators
          </p>
          <p className="mt-2 text-2xl font-semibold">{insights.averageParticipants}</p>
          <p className="text-xs text-blue-700">People actively engaged per case.</p>
        </div>
      </div>

      <div className="rounded-4xl border border-slate-200 bg-white/80 p-5 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-slate-900">Live caseboard</h3>
            <p className="text-sm text-slate-500">
              Prioritize escalations and keep pulse on commitments. {loading ? 'Updating…' : ''}
            </p>
          </div>
          <FilterPills
            filters={filters}
            metadata={metadata}
            onChange={(nextFilters) => onFiltersChange?.(nextFilters)}
            onReset={onResetFilters}
          />
        </div>
        <div className="mt-4">
          <DisputeCaseList disputes={cases} onSelect={onSelectCase} selectedId={selectedCaseId} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded-3xl border border-slate-200 bg-white/70 p-4 text-sm shadow-sm">
          <header className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Escalation watch</p>
              <p className="text-sm text-slate-600">
                {insights.escalated > 0
                  ? `${insights.escalated} cases flagged for leadership visibility.`
                  : 'No escalations pending. Maintain cadence.'}
              </p>
            </div>
            <ExclamationTriangleIcon className="h-5 w-5 text-rose-400" aria-hidden="true" />
          </header>
          <ul className="mt-3 space-y-2 text-xs text-slate-500">
            {cases
              .filter((item) => item.status === 'escalated' || item.severity === 'critical')
              .slice(0, 3)
              .map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-slate-700">{item.transaction?.displayName ?? `Case #${item.id}`}</span>
                  <button
                    type="button"
                    onClick={() => onSelectCase?.(item)}
                    className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-3 py-1 text-white shadow-sm transition hover:bg-slate-800"
                  >
                    Open
                    <ArrowUpRightIcon className="h-4 w-4" aria-hidden="true" />
                  </button>
                </li>
              ))}
          </ul>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white/70 p-4 text-sm shadow-sm">
          <header className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Performance insights</p>
              <p className="text-sm text-slate-600">Use patterns to power next best actions.</p>
            </div>
            <ChartBarIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
          </header>
          <ul className="mt-3 space-y-2 text-xs text-slate-500">
            <li>Top reason code: {performanceStats.topReason}</li>
            <li>Median response time: {performanceStats.medianResponse}</li>
            <li>Automation coverage: {performanceStats.automationCoverage}</li>
          </ul>
        </article>
      </div>
    </section>
  );
}

DisputeDashboard.propTypes = {
  summary: PropTypes.object,
  cases: PropTypes.arrayOf(PropTypes.object),
  metadata: PropTypes.object,
  filters: PropTypes.shape({ stage: PropTypes.string, status: PropTypes.string }),
  loading: PropTypes.bool,
  lastUpdated: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
  onFiltersChange: PropTypes.func,
  onResetFilters: PropTypes.func,
  onRefresh: PropTypes.func,
  onCreateCase: PropTypes.func,
  onSelectCase: PropTypes.func,
  selectedCaseId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  permissions: PropTypes.shape({ canCreate: PropTypes.bool }),
};

DisputeDashboard.defaultProps = {
  summary: {},
  cases: [],
  metadata: {},
  filters: { stage: '', status: '' },
  loading: false,
  lastUpdated: null,
  onFiltersChange: undefined,
  onResetFilters: undefined,
  onRefresh: undefined,
  onCreateCase: undefined,
  onSelectCase: undefined,
  selectedCaseId: null,
  permissions: null,
};
