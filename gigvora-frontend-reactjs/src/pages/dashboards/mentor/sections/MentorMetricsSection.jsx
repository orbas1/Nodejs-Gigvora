import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowPathIcon,
  ChartBarIcon,
  ChartPieIcon,
  DocumentArrowDownIcon,
  SparklesIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline';

const DEFAULT_WIDGET = {
  name: '',
  value: '',
  goal: '',
  unit: '',
  timeframe: 'Last 30 days',
  insight: '',
};

const TIMEFRAMES = ['Last 7 days', 'Last 30 days', 'Last quarter', 'Last 12 months'];

function normaliseWidget(widget = {}) {
  return {
    name: widget.name ?? '',
    value: widget.value ?? '',
    goal: widget.goal ?? '',
    unit: widget.unit ?? '',
    timeframe: widget.timeframe ?? 'Last 30 days',
    insight: widget.insight ?? '',
  };
}

function toNumberOrNull(value) {
  if (value === '' || value === null || value === undefined) {
    return null;
  }
  const numberValue = Number(value);
  return Number.isNaN(numberValue) ? null : numberValue;
}

function MetricCard({ widget, onEdit, onDelete }) {
  const progress = useMemo(() => {
    if (!widget.goal || Number.isNaN(Number(widget.goal))) {
      return null;
    }
    const goal = Number(widget.goal);
    const value = Number(widget.value);
    if (!goal || Number.isNaN(goal) || Number.isNaN(value)) {
      return null;
    }
    return Math.min(100, Math.max(0, Math.round((value / goal) * 100)));
  }, [widget.goal, widget.value]);

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{widget.timeframe}</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-900">{widget.name}</h3>
        </div>
        <span className="text-xl font-semibold text-slate-900">
          {widget.unit}
          {widget.value}
        </span>
      </div>
      <p className="text-sm text-slate-600">{widget.insight ?? 'Add a narrative insight to coach future you.'}</p>
      <div className="flex items-center justify-between text-xs font-semibold">
        {widget.trend !== undefined ? (
          <span className={widget.trend >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
            {widget.trend >= 0 ? '+' : ''}
            {widget.trend}% trend
          </span>
        ) : (
          <span className="text-slate-400">Trend pending</span>
        )}
        {widget.variance !== undefined ? (
          <span className={widget.variance >= 0 ? 'text-emerald-600' : 'text-amber-600'}>
            {widget.variance >= 0 ? '+' : ''}
            {widget.variance} variance
          </span>
        ) : null}
      </div>
      <div className="h-12 w-full overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-100">
        <svg viewBox="0 0 120 40" className="h-full w-full">
          <polyline
            fill="none"
            stroke="url(#metricGradient)"
            strokeWidth="3"
            points={(widget.samples ?? [20, 24, 18, 28, 32, 30, 38])
              .map((value, index, arr) => {
                const x = (index / Math.max(arr.length - 1, 1)) * 120;
                const y = 40 - (Number(value) / Math.max(...arr, 1)) * 32 - 4;
                return `${x},${Number.isFinite(y) ? y : 20}`;
              })
              .join(' ')}
          />
          <defs>
            <linearGradient id="metricGradient" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      {progress !== null ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Goal {widget.unit}{widget.goal}</span>
            <span>{progress}% of goal</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-gradient-to-r from-accent to-emerald-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
        <button type="button" onClick={() => onEdit(widget)} className="text-slate-500 hover:text-accent">
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(widget)}
          className="inline-flex items-center gap-1 text-rose-500 hover:text-rose-600"
        >
          Remove
        </button>
      </div>
    </div>
  );
}

MetricCard.propTypes = {
  widget: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    goal: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    unit: PropTypes.string,
    timeframe: PropTypes.string,
    insight: PropTypes.string,
    trend: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    variance: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    samples: PropTypes.arrayOf(PropTypes.number),
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

export default function MentorMetricsSection({
  metrics,
  cohorts,
  reporting,
  saving,
  onCreateWidget,
  onUpdateWidget,
  onDeleteWidget,
  onGenerateReport,
}) {
  const [widgetForm, setWidgetForm] = useState(DEFAULT_WIDGET);
  const [editingWidgetId, setEditingWidgetId] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [reportGenerating, setReportGenerating] = useState(false);
  const [timeframeFilter, setTimeframeFilter] = useState('all');
  const [metricSearch, setMetricSearch] = useState('');
  const [cohortFocus, setCohortFocus] = useState('all');

  useEffect(() => {
    if (!editingWidgetId) {
      return;
    }
    const activeWidget = metrics?.find((widget) => widget.id === editingWidgetId);
    if (!activeWidget) {
      setEditingWidgetId(null);
      setWidgetForm(DEFAULT_WIDGET);
      return;
    }
    setWidgetForm(normaliseWidget(activeWidget));
  }, [editingWidgetId, metrics]);

  const handleReset = () => {
    setWidgetForm(DEFAULT_WIDGET);
    setEditingWidgetId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFeedback(null);
    const payload = {
      ...widgetForm,
      value: toNumberOrNull(widgetForm.value),
      goal: toNumberOrNull(widgetForm.goal),
    };
    try {
      if (editingWidgetId) {
        await onUpdateWidget?.(editingWidgetId, payload);
      } else {
        await onCreateWidget?.(payload);
      }
      setFeedback({ type: 'success', message: 'Metric widget saved successfully.' });
      handleReset();
    } catch (error) {
      setFeedback({ type: 'error', message: error.message ?? 'Unable to save metric widget.' });
    }
  };

  const handleEdit = (widget) => {
    setEditingWidgetId(widget.id);
    setWidgetForm(normaliseWidget(widget));
  };

  const handleDelete = async (widget) => {
    setFeedback(null);
    try {
      await onDeleteWidget?.(widget.id);
      setFeedback({ type: 'success', message: 'Metric widget removed.' });
    } catch (error) {
      setFeedback({ type: 'error', message: error.message ?? 'Unable to delete widget.' });
    }
  };

  const handleGenerateReport = async () => {
    setReportGenerating(true);
    setFeedback(null);
    try {
      await onGenerateReport?.();
      setFeedback({ type: 'success', message: 'Report queued. Check your inbox and Slack within minutes.' });
    } catch (error) {
      setFeedback({ type: 'error', message: error.message ?? 'Unable to generate report.' });
    } finally {
      setReportGenerating(false);
    }
  };

  const filteredMetrics = useMemo(() => {
    const list = metrics ?? [];
    return list
      .filter((widget) => (timeframeFilter === 'all' ? true : widget.timeframe === timeframeFilter))
      .filter((widget) => {
        if (!metricSearch) return true;
        const haystack = `${widget.name} ${widget.insight ?? ''}`.toLowerCase();
        return haystack.includes(metricSearch.toLowerCase());
      });
  }, [metrics, timeframeFilter, metricSearch]);

  const filteredCohorts = useMemo(() => {
    const list = cohorts ?? [];
    if (cohortFocus === 'all') return list;
    if (cohortFocus === 'growing') {
      return list.filter((cohort) => cohort.change >= 0);
    }
    return list.filter((cohort) => cohort.change < 0);
  }, [cohortFocus, cohorts]);

  return (
    <section className="space-y-10 rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-100 p-8 shadow-sm">
      <header className="flex flex-wrap items-start justify-between gap-6">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Metrics</p>
          <h2 className="text-2xl font-semibold text-slate-900">Know your mentorship momentum at a glance</h2>
          <p className="text-sm text-slate-600">
            Track revenue, conversion, and programme health with bespoke scorecards. Automate exports and share trends with your operations squad.
          </p>
        </div>
        <div className="rounded-3xl border border-accent/40 bg-white px-5 py-4 text-sm text-slate-600 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reporting cadence</p>
          <p className="text-lg font-semibold text-slate-900">{reporting?.cadence ?? '—'}</p>
          <p className="text-xs">Delivery: {reporting?.delivery ?? 'Email & Slack'}</p>
          <p className="text-xs">Recipients: {(reporting?.recipients ?? []).join(', ') || 'Add recipients below'}</p>
        </div>
      </header>

      {feedback ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            feedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-rose-200 bg-rose-50 text-rose-700'
          }`}
        >
          {feedback.message}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-5">
        <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Configure scorecard</h3>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
            Name
            <input
              type="text"
              required
              value={widgetForm.name}
              onChange={(event) => setWidgetForm((current) => ({ ...current, name: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              placeholder="Explorer conversion"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Value
              <input
                type="number"
                required
                value={widgetForm.value}
                onChange={(event) => setWidgetForm((current) => ({ ...current, value: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Goal
              <input
                type="number"
                value={widgetForm.goal}
                onChange={(event) => setWidgetForm((current) => ({ ...current, goal: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Unit / currency
              <input
                type="text"
                value={widgetForm.unit}
                onChange={(event) => setWidgetForm((current) => ({ ...current, unit: event.target.value }))}
                placeholder="£ or %"
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Timeframe
              <select
                value={widgetForm.timeframe}
                onChange={(event) => setWidgetForm((current) => ({ ...current, timeframe: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                {TIMEFRAMES.map((timeframe) => (
                  <option key={timeframe}>{timeframe}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
            Insight
            <textarea
              rows={3}
              value={widgetForm.insight}
              onChange={(event) => setWidgetForm((current) => ({ ...current, insight: event.target.value }))}
              placeholder="Highlight the signal behind the number"
              className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accentDark disabled:cursor-not-allowed disabled:opacity-70"
            >
              <SparklesIcon className="h-4 w-4" />
              {saving ? 'Saving…' : editingWidgetId ? 'Update widget' : 'Add widget'}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="text-xs font-semibold text-slate-500 hover:text-accent"
            >
              Reset
            </button>
          </div>
        </form>
        <div className="space-y-4 lg:col-span-3">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2">
                Timeframe
                <select
                  value={timeframeFilter}
                  onChange={(event) => setTimeframeFilter(event.target.value)}
                  className="rounded-full border border-slate-200 px-3 py-1 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
                >
                  <option value="all">All</option>
                  {TIMEFRAMES.map((timeframe) => (
                    <option key={timeframe} value={timeframe}>
                      {timeframe}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <input
              type="search"
              value={metricSearch}
              onChange={(event) => setMetricSearch(event.target.value)}
              placeholder="Search metrics"
              className="rounded-full border border-slate-200 px-3 py-1 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
            />
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {filteredMetrics.length === 0 ? (
              <div className="col-span-3 rounded-3xl border border-dashed border-slate-200 px-6 py-10 text-center text-sm text-slate-500">
                {metrics?.length ? 'No widgets match the filters. Adjust timeframe or search terms.' : 'No scorecards yet. Add metrics on the left to unlock automated reporting.'}
              </div>
            ) : (
              filteredMetrics.map((widget) => (
                <MetricCard key={widget.id ?? widget.name} widget={widget} onEdit={handleEdit} onDelete={handleDelete} />
              ))
            )}
          </div>
          <div className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Funnel cohorts</p>
              <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-500">
                <span>View:</span>
                <button
                  type="button"
                  onClick={() => setCohortFocus('all')}
                  className={`rounded-full px-3 py-1 ${cohortFocus === 'all' ? 'bg-accent text-white' : 'border border-slate-200 bg-white text-slate-600'}`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setCohortFocus('growing')}
                  className={`rounded-full px-3 py-1 ${cohortFocus === 'growing' ? 'bg-emerald-500 text-white' : 'border border-slate-200 bg-white text-slate-600'}`}
                >
                  Growing
                </button>
                <button
                  type="button"
                  onClick={() => setCohortFocus('declining')}
                  className={`rounded-full px-3 py-1 ${cohortFocus === 'declining' ? 'bg-rose-500 text-white' : 'border border-slate-200 bg-white text-slate-600'}`}
                >
                  Needs attention
                </button>
              </div>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                {filteredCohorts.map((cohort) => (
                  <li key={cohort.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
                    <div>
                      <p className="font-semibold text-slate-800">{cohort.label}</p>
                      <p className="text-xs text-slate-500">Conversion {cohort.conversion}%</p>
                    </div>
                    <span className={`text-xs font-semibold ${cohort.change >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {cohort.change >= 0 ? '+' : ''}
                      {cohort.change}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-5 text-sm text-slate-600">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <ChartPieIcon className="h-5 w-5 text-accent" />
                Weekly performance digest
              </h4>
              <p>
                Generate insights packs summarising revenue, conversion, and operational alerts. Delivered instantly to Slack and email.
              </p>
              <button
                type="button"
                onClick={handleGenerateReport}
                disabled={reportGenerating}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <DocumentArrowDownIcon className="h-4 w-4" />
                {reportGenerating ? 'Generating…' : 'Generate report now'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:grid-cols-3">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <ChartBarIcon className="h-5 w-5 text-accent" />
            Momentum dashboard
          </div>
          <p className="text-sm text-slate-600">
            Layer Explorer, referrals, and volunteering pipelines to spot upcoming plateaus before they happen.
          </p>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <TrophyIcon className="h-5 w-5 text-accent" />
            Stretch goals
          </div>
          <p className="text-sm text-slate-600">
            Set bold targets and track the rituals that unlock them. Every widget can power automated nudges to mentees or your ops crew.
          </p>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <ArrowPathIcon className="h-5 w-5 text-accent" />
            Sync everywhere
          </div>
          <p className="text-sm text-slate-600">
            Metrics feed company dashboards, advisor updates, and marketing funnels automatically after each refresh.
          </p>
        </div>
      </div>
    </section>
  );
}

MentorMetricsSection.propTypes = {
  metrics: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string,
      value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      goal: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      unit: PropTypes.string,
      timeframe: PropTypes.string,
      insight: PropTypes.string,
      trend: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      variance: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      samples: PropTypes.arrayOf(PropTypes.number),
    }),
  ),
  cohorts: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      conversion: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      change: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    }),
  ),
  reporting: PropTypes.shape({
    cadence: PropTypes.string,
    delivery: PropTypes.string,
    recipients: PropTypes.arrayOf(PropTypes.string),
  }),
  saving: PropTypes.bool,
  onCreateWidget: PropTypes.func,
  onUpdateWidget: PropTypes.func,
  onDeleteWidget: PropTypes.func,
  onGenerateReport: PropTypes.func,
};

MentorMetricsSection.defaultProps = {
  metrics: [],
  cohorts: [],
  reporting: undefined,
  saving: false,
  onCreateWidget: undefined,
  onUpdateWidget: undefined,
  onDeleteWidget: undefined,
  onGenerateReport: undefined,
};
