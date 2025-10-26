import { useMemo } from 'react';
import {
  ArrowTrendingUpIcon,
  ArrowsRightLeftIcon,
  BoltIcon,
  ChartBarSquareIcon,
  ClockIcon,
  CloudArrowDownIcon,
  DocumentArrowDownIcon,
  FunnelIcon,
  SparklesIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';
import classNames from '../../../utils/classNames.js';

const numberFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
});
const compactFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
});
const percentFormatter = new Intl.NumberFormat('en-US', {
  style: 'percent',
  maximumFractionDigits: 1,
});

function formatNumber(value) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) {
    return '0';
  }
  if (Math.abs(numeric) >= 10000) {
    return compactFormatter.format(numeric);
  }
  return numberFormatter.format(numeric);
}

function formatPercent(value) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) {
    return '0%';
  }
  const ratio = numeric > 1 ? numeric / 100 : numeric;
  return percentFormatter.format(ratio);
}

function getDeltaLabel(delta) {
  const numeric = Number(delta ?? 0);
  if (!Number.isFinite(numeric) || numeric === 0) {
    return { label: 'No change', tone: 'text-slate-500' };
  }
  const label = `${numeric > 0 ? '+' : ''}${formatPercent(Math.abs(numeric))}`;
  return {
    label,
    tone: numeric > 0 ? 'text-emerald-600' : 'text-rose-600',
  };
}

function Sparkline({ data = [], accent = '#2563eb' }) {
  const safeData = data.length ? data.map((point) => Number(point ?? 0)) : [0];
  const min = Math.min(...safeData);
  const max = Math.max(...safeData);
  const span = max - min || 1;
  const points = safeData.map((value, index) => {
    const x = safeData.length === 1 ? 0 : (index / (safeData.length - 1)) * 100;
    const normalized = (value - min) / span;
    const y = 32 - normalized * 28 - 2;
    return `${x},${Math.max(2, Math.min(30, y))}`;
  });

  const areaPath = [`M0,32`, `L0,${points[0]?.split(',')[1] ?? 32}`, ...points.map((point) => `L${point}`), 'L100,32', 'Z'].join(' ');
  const linePath = [`M${points[0] ?? '0,32'}`, ...points.slice(1).map((point) => `L${point}`)].join(' ');

  return (
    <svg viewBox="0 0 100 32" className="h-16 w-full" role="img" aria-hidden="true">
      <defs>
        <linearGradient id="sparkline-accent" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.32" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#sparkline-accent)" />
      <path d={linePath} fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function SummaryCard({ title, value, delta, caption, icon: Icon, accent }) {
  const deltaInfo = getDeltaLabel(delta);

  return (
    <article className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg">
      <div className="flex items-center gap-3">
        <span className={classNames('inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-inner', accent)}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="flex flex-col">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</span>
          <span className="text-2xl font-semibold text-slate-900">{value}</span>
        </div>
      </div>
      <p className="mt-3 text-sm text-slate-600">{caption}</p>
      <p className={classNames('mt-4 text-sm font-semibold', deltaInfo.tone)}>{deltaInfo.label}</p>
    </article>
  );
}

function SegmentPill({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={classNames(
        'rounded-full border px-4 py-1.5 text-sm font-medium transition',
        active ? 'border-blue-400 bg-blue-500/10 text-blue-700 shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-600',
      )}
    >
      {label}
    </button>
  );
}

function AnomalyCard({ anomaly }) {
  const severityTone = {
    critical: 'bg-rose-50 text-rose-600 border-rose-200',
    elevated: 'bg-amber-50 text-amber-600 border-amber-200',
    normal: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  };
  const tone = severityTone[anomaly?.severity] ?? severityTone.normal;

  return (
    <div className={classNames('rounded-2xl border p-4 text-sm shadow-sm transition hover:-translate-y-0.5 hover:shadow-md', tone)}>
      <p className="font-semibold">{anomaly?.title ?? 'Unnamed signal'}</p>
      <p className="mt-1 leading-relaxed">{anomaly?.description ?? 'No context provided.'}</p>
      <p className="mt-2 text-xs uppercase tracking-wide">Detected {anomaly?.detectedAt ? new Date(anomaly.detectedAt).toLocaleString() : 'recently'}</p>
    </div>
  );
}

function InsightNarrative({ narrative }) {
  return (
    <li className="flex gap-3">
      <span className="mt-1 h-2 w-2 rounded-full bg-blue-500" aria-hidden="true" />
      <div className="flex-1 rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm">
        <p className="text-sm font-semibold text-slate-800">{narrative?.title}</p>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">{narrative?.summary}</p>
        {narrative?.action ? (
          <p className="mt-2 text-xs uppercase tracking-wide text-blue-600">{narrative.action}</p>
        ) : null}
      </div>
    </li>
  );
}

function ChartPanel({ title, metric, series, accent }) {
  const lastValue = series?.[series.length - 1] ?? 0;
  const previousValue = series?.[series.length - 2] ?? lastValue;
  const change = lastValue - previousValue;
  const delta = previousValue === 0 ? 0 : change / Math.max(Math.abs(previousValue), 1);
  const deltaInfo = getDeltaLabel(delta);

  return (
    <section className="space-y-3 rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{metric}</p>
        </div>
        <p className={classNames('text-sm font-semibold', deltaInfo.tone)}>{deltaInfo.label}</p>
      </header>
      <Sparkline data={series} accent={accent} />
      <p className="text-sm text-slate-600">Latest reading {formatNumber(lastValue)} · {deltaInfo.label}</p>
    </section>
  );
}

export default function InsightsOverview({
  summary = [],
  narratives = [],
  anomalies = [],
  charts = [],
  segments = [],
  selectedSegment,
  onSegmentChange,
  timeRanges = [],
  selectedRange,
  onTimeRangeChange,
  refreshing = false,
  onExport,
}) {
  const activeSegment = selectedSegment ?? segments[0]?.value ?? 'all';
  const activeRange = selectedRange ?? timeRanges[0]?.value ?? '30d';

  const segmentPills = useMemo(
    () => segments.map((segment) => ({ ...segment, isActive: segment.value === activeSegment })),
    [segments, activeSegment],
  );

  const totalVolume = useMemo(() => {
    return summary.reduce((acc, item) => acc + Number(item.value ?? 0), 0);
  }, [summary]);

  return (
    <div className="space-y-8">
      <header className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 text-white shadow-xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-slate-300">Insights overview</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">Operational intelligence cockpit</h2>
            <p className="mt-3 max-w-2xl text-sm text-slate-200">
              Monitor executive-level telemetry with anomaly narratives, premium storytelling visuals, and real-time segmentation controls. Optimized for leadership reviews and war-room clarity.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm">
              <span className="font-semibold">{formatNumber(totalVolume)}</span>
              <span className="ml-2 text-slate-300">signals processed</span>
            </div>
            <button
              type="button"
              onClick={onExport}
              className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/10 px-5 py-2 text-sm font-semibold transition hover:bg-white hover:text-slate-900"
            >
              <DocumentArrowDownIcon className="h-4 w-4" aria-hidden="true" />
              Export executive brief
            </button>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-slate-300">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
            <ClockIcon className="h-4 w-4" aria-hidden="true" />
            <span>Time range</span>
            <select
              className="rounded-full border border-white/20 bg-transparent px-2 py-0.5 text-xs font-semibold focus:outline-none"
              value={activeRange}
              onChange={(event) => onTimeRangeChange?.(event.target.value)}
            >
              {timeRanges.length === 0 ? <option value={activeRange}>{activeRange}</option> : null}
              {timeRanges.map((range) => (
                <option key={range.value} value={range.value} className="text-slate-900">
                  {range.label}
                </option>
              ))}
            </select>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
            <Squares2X2Icon className="h-4 w-4" aria-hidden="true" />
            <span>Segment</span>
            <select
              className="rounded-full border border-white/20 bg-transparent px-2 py-0.5 text-xs font-semibold focus:outline-none"
              value={activeSegment}
              onChange={(event) => onSegmentChange?.(event.target.value)}
            >
              {segments.length === 0 ? <option value={activeSegment}>{activeSegment}</option> : null}
              {segments.map((segment) => (
                <option key={segment.value} value={segment.value} className="text-slate-900">
                  {segment.label}
                </option>
              ))}
            </select>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
            <SparklesIcon className="h-4 w-4" aria-hidden="true" />
            <span>{refreshing ? 'Refreshing live insights…' : 'Live telemetry stable'}</span>
          </div>
        </div>
      </header>

      <section className="grid gap-5 lg:grid-cols-4">
        {summary.length === 0 ? (
          <p className="text-sm text-slate-500 lg:col-span-4">
            No insights available for the current filters. Adjust segmentation to surface insights.
          </p>
        ) : (
          summary.map((item) => (
            <SummaryCard
              key={item.id ?? item.title}
              title={item.title}
              value={formatNumber(item.value)}
              delta={item.delta}
              caption={item.caption}
              icon={item.icon ?? ArrowTrendingUpIcon}
              accent={item.accent ?? 'from-blue-500 to-violet-500'}
            />
          ))
        )}
      </section>

      <section className="flex flex-wrap items-center gap-3">
        <FunnelIcon className="h-5 w-5 text-slate-500" aria-hidden="true" />
        <span className="text-sm font-semibold text-slate-700">Quick segment toggles</span>
        <div className="flex flex-wrap gap-2">
          {segmentPills.length === 0 ? (
            <span className="rounded-full border border-slate-200 px-4 py-1 text-sm text-slate-500">All segments</span>
          ) : (
            segmentPills.map((pill) => (
              <SegmentPill
                key={pill.value}
                label={pill.label}
                active={pill.isActive}
                onClick={() => onSegmentChange?.(pill.value)}
              />
            ))
          )}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        {charts.length === 0 ? (
          <p className="text-sm text-slate-500 lg:col-span-3">
            Upload telemetry data to activate executive storytelling charts and comparisons.
          </p>
        ) : (
          charts.map((chart) => (
            <ChartPanel
              key={chart.id ?? chart.title}
              title={chart.title}
              metric={chart.metric}
              series={chart.series}
              accent={chart.accent ?? '#2563eb'}
            />
          ))
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-4">
          <header className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Narrative intelligence</h3>
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
              <ArrowsRightLeftIcon className="h-4 w-4" aria-hidden="true" />
              Story stream
            </span>
          </header>
          <ol className="space-y-3">
            {narratives.length === 0 ? (
              <p className="text-sm text-slate-500">No narrative commentary captured yet. Connect storytelling API to unlock automated briefings.</p>
            ) : (
              narratives.map((narrative) => <InsightNarrative key={narrative.id ?? narrative.title} narrative={narrative} />)
            )}
          </ol>
        </div>
        <div className="lg:col-span-2 space-y-4">
          <header className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Anomaly radar</h3>
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
              <BoltIcon className="h-4 w-4" aria-hidden="true" />
              Auto-detected
            </span>
          </header>
          <div className="space-y-3">
            {anomalies.length === 0 ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                <p className="font-semibold">All clear</p>
                <p className="mt-1 leading-relaxed">
                  No anomalies detected in the selected window. Telemetry is performing within control limits.
                </p>
              </div>
            ) : (
              anomalies.map((anomaly) => <AnomalyCard key={anomaly.id ?? anomaly.title} anomaly={anomaly} />)
            )}
          </div>
        </div>
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm">
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <ChartBarSquareIcon className="h-5 w-5 text-slate-500" aria-hidden="true" />
          <span>Enterprise-grade insights ready for boardroom storytelling and compliance-grade audit trails.</span>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 font-semibold">
            <CloudArrowDownIcon className="h-4 w-4" aria-hidden="true" />
            CSV, PPTX &amp; Slack digest
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 font-semibold">
            <ArrowTrendingUpIcon className="h-4 w-4" aria-hidden="true" />
            AI-powered anomaly reasoning
          </span>
        </div>
      </footer>
    </div>
  );
}
