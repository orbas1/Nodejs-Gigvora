import { useEffect, useMemo, useState } from 'react';
import {
  AdjustmentsHorizontalIcon,
  ArrowDownTrayIcon,
  ArrowsPointingOutIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  SquaresPlusIcon,
  SparklesIcon,
  SwatchIcon,
} from '@heroicons/react/24/outline';
import classNames from '../../../utils/classNames.js';

const percentFormatter = new Intl.NumberFormat('en-US', {
  style: 'percent',
  maximumFractionDigits: 1,
});
const numberFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
});

function formatPercent(value) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) {
    return '0%';
  }
  const ratio = numeric > 1 ? numeric / 100 : numeric;
  return percentFormatter.format(ratio);
}

function formatNumber(value) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) {
    return '0';
  }
  return numberFormatter.format(numeric);
}

function calculateDelta(value, previous) {
  const current = Number(value ?? 0);
  const prior = Number(previous ?? 0);
  if (!Number.isFinite(current) || !Number.isFinite(prior) || prior === 0) {
    return 0;
  }
  return (current - prior) / Math.abs(prior);
}

function generatePath(data = []) {
  if (data.length === 0) {
    return 'M0,48 L100,48';
  }
  const safeData = data.map((point) => Number(point ?? 0));
  const min = Math.min(...safeData);
  const max = Math.max(...safeData);
  const span = max - min || 1;
  const points = safeData.map((value, index) => {
    const x = safeData.length === 1 ? 0 : (index / (safeData.length - 1)) * 100;
    const normalized = (value - min) / span;
    const y = 52 - normalized * 44;
    return `${x.toFixed(2)},${Math.max(4, Math.min(52, y)).toFixed(2)}`;
  });
  return [`M${points[0]}`, ...points.slice(1).map((point) => `L${point}`)].join(' ');
}

function MetricSparkline({ series, accent = '#2563eb' }) {
  const path = generatePath(series);
  return (
    <svg viewBox="0 0 100 56" className="h-24 w-full" role="img" aria-hidden="true">
      <defs>
        <linearGradient id="metrics-explorer-accent" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.32" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${path} L100,56 L0,56 Z`} fill="url(#metrics-explorer-accent)" />
      <path d={path} fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function SavedViewChip({ view, active, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(view)}
      className={classNames(
        'rounded-full border px-3 py-1 text-xs font-semibold transition',
        active ? 'border-indigo-400 bg-indigo-500/10 text-indigo-600 shadow-sm' : 'border-slate-200 bg-white text-slate-500 hover:border-indigo-300 hover:text-indigo-600',
      )}
    >
      {view.label}
    </button>
  );
}

function BreakdownTable({ breakdowns }) {
  if (!breakdowns?.length) {
    return <p className="text-sm text-slate-500">No breakdown data available for the selected filters.</p>;
  }
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th scope="col" className="px-4 py-2 text-left font-semibold">
              Dimension
            </th>
            <th scope="col" className="px-4 py-2 text-right font-semibold">
              Share
            </th>
            <th scope="col" className="px-4 py-2 text-right font-semibold">
              Volume
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {breakdowns.map((item) => (
            <tr key={item.id ?? item.label}>
              <td className="px-4 py-2">
                <p className="font-semibold text-slate-800">{item.label}</p>
                {item.caption ? <p className="text-xs text-slate-500">{item.caption}</p> : null}
              </td>
              <td className="px-4 py-2 text-right font-semibold text-slate-700">{formatPercent(item.share)}</td>
              <td className="px-4 py-2 text-right font-semibold text-slate-700">{formatNumber(item.volume)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ThresholdAlert({ alert, onUpdate }) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{alert?.title ?? 'Threshold breach'}</p>
          <p className="mt-1 leading-relaxed">{alert?.description ?? 'No details provided.'}</p>
          {alert?.currentValue != null ? (
            <p className="mt-2 text-xs uppercase tracking-wide text-rose-600">
              Current {alert.metricLabel ?? 'value'}: {formatNumber(alert.currentValue)}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => onUpdate?.(alert)}
          className="inline-flex items-center gap-1 rounded-full border border-rose-300 bg-white px-3 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-100"
        >
          <AdjustmentsHorizontalIcon className="h-4 w-4" aria-hidden="true" />
          Adjust
        </button>
      </div>
    </div>
  );
}

function AnnotationMarker({ annotation }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white/80 p-4 text-sm shadow-sm">
      <div className="mt-1 h-2 w-2 rounded-full bg-indigo-500" aria-hidden="true" />
      <div>
        <p className="font-semibold text-slate-800">{annotation?.title}</p>
        <p className="mt-1 leading-relaxed text-slate-600">{annotation?.note}</p>
        <p className="mt-2 text-xs uppercase tracking-wide text-slate-400">
          {annotation?.timestamp ? new Date(annotation.timestamp).toLocaleString() : 'No timestamp'}
        </p>
      </div>
    </div>
  );
}

function createMetricIndex(metrics = []) {
  return metrics.reduce((acc, metric) => {
    if (metric?.value == null) {
      return acc;
    }
    acc[metric.id ?? metric.metric] = metric;
    return acc;
  }, {});
}

export default function MetricsExplorer({
  availableMetrics = [],
  series = [],
  breakdowns = [],
  savedViews = [],
  thresholdAlerts = [],
  onThresholdUpdate,
  annotations = [],
  segments = [],
  selectedSegment,
  onSegmentChange,
  timeRanges = [],
  selectedRange,
  onTimeRangeChange,
  selectedMetric,
  onMetricSelect,
  comparisonMetric,
  onComparisonMetricChange,
  onSavedViewSelect,
  onCreateView,
  onExport,
  loading = false,
}) {
  const metricIndex = useMemo(() => createMetricIndex(availableMetrics), [availableMetrics]);
  const [activeMetric, setActiveMetric] = useState(selectedMetric ?? availableMetrics[0]?.id);
  const [activeComparison, setActiveComparison] = useState(comparisonMetric ?? null);
  const [searchTerm, setSearchTerm] = useState('');

  const activeMetricDetails = activeMetric ? metricIndex[activeMetric] : null;
  const comparisonMetricDetails = activeComparison ? metricIndex[activeComparison] : null;
  const activeSegment = selectedSegment ?? segments[0]?.value ?? 'all';
  const activeRange = selectedRange ?? timeRanges[0]?.value ?? '30d';

  useEffect(() => {
    if (selectedMetric) {
      setActiveMetric(selectedMetric);
    }
  }, [selectedMetric]);

  useEffect(() => {
    if (comparisonMetric) {
      setActiveComparison(comparisonMetric);
    }
  }, [comparisonMetric]);

  const filteredMetrics = useMemo(() => {
    if (!searchTerm) {
      return availableMetrics;
    }
    const query = searchTerm.toLowerCase();
    return availableMetrics.filter((metric) => metric.label?.toLowerCase().includes(query));
  }, [availableMetrics, searchTerm]);

  const chartSeries = useMemo(() => {
    if (!activeMetricDetails) {
      return [];
    }
    return series.find((item) => item.metricId === activeMetricDetails.id)?.points ?? [];
  }, [series, activeMetricDetails]);

  const comparisonSeries = useMemo(() => {
    if (!comparisonMetricDetails) {
      return [];
    }
    return series.find((item) => item.metricId === comparisonMetricDetails.id)?.points ?? [];
  }, [series, comparisonMetricDetails]);

  const delta = useMemo(() => {
    if (!activeMetricDetails) {
      return 0;
    }
    const { value, previous } = activeMetricDetails;
    return calculateDelta(value, previous);
  }, [activeMetricDetails]);

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="space-y-5 rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Metrics explorer</h2>
          <SparklesIcon className="h-5 w-5 text-indigo-500" aria-hidden="true" />
        </div>
        <div className="space-y-3">
          <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 focus-within:border-indigo-300 focus-within:text-slate-700">
            <MagnifyingGlassIcon className="h-4 w-4" aria-hidden="true" />
            <input
              type="search"
              placeholder="Search metrics"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full border-0 bg-transparent text-sm font-medium text-slate-700 placeholder-slate-400 focus:outline-none"
            />
          </label>
          <div className="grid gap-2">
            {filteredMetrics.length === 0 ? (
              <p className="text-sm text-slate-500">No metrics match this query.</p>
            ) : (
              filteredMetrics.map((metric) => {
                const isActive = metric.id === activeMetric;
                return (
                  <button
                    type="button"
                    key={metric.id}
                    onClick={() => {
                      setActiveMetric(metric.id);
                      onMetricSelect?.(metric.id);
                    }}
                    className={classNames(
                      'flex items-center justify-between rounded-2xl border px-3 py-2 text-left text-sm transition',
                      isActive
                        ? 'border-indigo-400 bg-indigo-500/10 text-indigo-600 shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-600',
                    )}
                  >
                    <span className="font-semibold">{metric.label}</span>
                    <span className="text-xs font-semibold text-slate-400">{formatNumber(metric.value)}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Segment focus</p>
          <div className="space-y-2">
            {segments.length === 0 ? (
              <p className="text-sm text-slate-500">No segments configured.</p>
            ) : (
              segments.map((segment) => (
                <button
                  key={segment.value}
                  type="button"
                  onClick={() => onSegmentChange?.(segment.value)}
                  className={classNames(
                    'flex w-full items-center justify-between rounded-2xl border px-3 py-2 text-sm font-semibold transition',
                    segment.value === activeSegment
                      ? 'border-indigo-400 bg-indigo-500/10 text-indigo-600 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-600',
                  )}
                >
                  <span>{segment.label}</span>
                  <span className="text-xs font-medium text-slate-400">{segment.count ? formatNumber(segment.count) : '—'}</span>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Time range</p>
          <div className="flex flex-wrap gap-2">
            {timeRanges.length === 0 ? (
              <span className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-500">{activeRange}</span>
            ) : (
              timeRanges.map((range) => (
                <button
                  key={range.value}
                  type="button"
                  onClick={() => onTimeRangeChange?.(range.value)}
                  className={classNames(
                    'rounded-full border px-3 py-1 text-xs font-semibold transition',
                    range.value === activeRange
                      ? 'border-indigo-400 bg-indigo-500/10 text-indigo-600 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-indigo-300 hover:text-indigo-600',
                  )}
                >
                  {range.label}
                </button>
              ))
            )}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Saved analytical views</p>
          <div className="flex flex-wrap gap-2">
            {savedViews.length === 0 ? (
              <span className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-500">No saved views yet</span>
            ) : (
              savedViews.map((view) => (
                <SavedViewChip
                  key={view.id ?? view.label}
                  view={view}
                  active={Boolean(view.isActive)}
                  onSelect={onSavedViewSelect}
                />
              ))
            )}
          </div>
          <button
            type="button"
            onClick={onCreateView}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-indigo-300 hover:text-indigo-600"
          >
            <SquaresPlusIcon className="h-4 w-4" aria-hidden="true" />
            Capture new view
          </button>
        </div>
      </aside>

      <main className="space-y-6">
        <header className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{loading ? 'Refreshing datasets…' : 'Executive signal'}</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              {activeMetricDetails?.label ?? 'Select a metric'}
            </h2>
            {activeMetricDetails?.description ? (
              <p className="mt-2 text-sm text-slate-600">{activeMetricDetails.description}</p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600">
              <span className="font-semibold text-slate-900">{formatNumber(activeMetricDetails?.value)}</span>
              <span className="ml-2 text-xs uppercase tracking-wide text-slate-400">Current</span>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-600">
              {formatPercent(delta)} vs. prior
            </div>
            <button
              type="button"
              onClick={onExport}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-indigo-300 hover:text-indigo-600"
            >
              <ArrowDownTrayIcon className="h-4 w-4" aria-hidden="true" />
              Export data
            </button>
          </div>
        </header>

        <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <ChartBarIcon className="h-5 w-5 text-indigo-500" aria-hidden="true" />
              <p className="text-sm font-semibold text-slate-700">Performance timeline</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <label className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1">
                <span>Compare</span>
                <select
                  value={activeComparison ?? ''}
                  onChange={(event) => {
                    const next = event.target.value || null;
                    setActiveComparison(next);
                    onComparisonMetricChange?.(next);
                  }}
                  className="rounded-full border-0 bg-transparent text-xs font-semibold text-slate-600 focus:outline-none"
                >
                  <option value="">None</option>
                  {availableMetrics
                    .filter((metric) => metric.id !== activeMetric)
                    .map((metric) => (
                      <option key={metric.id} value={metric.id} className="text-slate-900">
                        {metric.label}
                      </option>
                    ))}
                </select>
              </label>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 font-semibold">
                <ClockIcon className="h-4 w-4" aria-hidden="true" />
                {timeRanges.find((range) => range.value === activeRange)?.label ?? activeRange}
              </span>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_240px]">
            <div className="rounded-3xl bg-slate-50 p-6">
              <MetricSparkline series={chartSeries} accent="#4f46e5" />
              {comparisonSeries.length ? (
                <div className="mt-4 rounded-2xl bg-white/80 p-4 text-xs text-slate-600">
                  <p className="font-semibold text-slate-700">Comparison overlay</p>
                  <p className="mt-1">
                    {comparisonMetricDetails?.label ?? 'Comparison metric'} delta{' '}
                    {formatPercent(
                      calculateDelta(comparisonMetricDetails?.value, comparisonMetricDetails?.previous),
                    )}
                  </p>
                </div>
              ) : null}
            </div>
            <div className="space-y-3">
              {thresholdAlerts.length === 0 ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                  <p className="font-semibold">No active threshold breaches</p>
                  <p className="mt-1 leading-relaxed">
                    Metrics are performing within configured guardrails. Adjust automation to tighten guardrails when ready.
                  </p>
                </div>
              ) : (
                thresholdAlerts.map((alert) => (
                  <ThresholdAlert key={alert.id ?? alert.title} alert={alert} onUpdate={onThresholdUpdate} />
                ))
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
            <header className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Dimension deep dive</h3>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500">
                <FunnelIcon className="h-4 w-4" aria-hidden="true" />
                {segments.find((segment) => segment.value === activeSegment)?.label ?? 'All segments'}
              </div>
            </header>
            <p className="mt-2 text-sm text-slate-600">
              Understand which segments drive performance with premium table experiences and share-ready formatting.
            </p>
            <div className="mt-5">
              <BreakdownTable breakdowns={breakdowns} />
            </div>
          </div>
          <div className="space-y-3 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <SwatchIcon className="h-5 w-5 text-indigo-500" aria-hidden="true" />
              <p className="text-sm font-semibold text-slate-700">Analyst annotations</p>
            </div>
            <div className="space-y-3">
              {annotations.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Analysts can leave annotation trails to call out launches, incidents, or campaigns. Nothing logged for this range yet.
                </p>
              ) : (
                annotations.map((annotation) => <AnnotationMarker key={annotation.id ?? annotation.title} annotation={annotation} />)
              )}
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
              <p className="font-semibold text-slate-700">Collaboration tips</p>
              <p className="mt-1">
                Share the active view with <strong>Shift + S</strong> and bookmark slices. Auto-syncs to leadership dashboards.
              </p>
            </div>
          </div>
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <ArrowsPointingOutIcon className="h-5 w-5 text-slate-500" aria-hidden="true" />
            <span>Enterprise analytics tuned for ops, finance, and product teams with premium polish.</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 font-semibold">
              <CheckCircleIcon className="h-4 w-4" aria-hidden="true" />
              Version controlled views
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 font-semibold">
              <SparklesIcon className="h-4 w-4" aria-hidden="true" />
              AI pattern surfacing
            </span>
          </div>
        </footer>
      </main>
    </div>
  );
}
