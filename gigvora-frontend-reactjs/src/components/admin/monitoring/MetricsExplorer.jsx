import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  BookmarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

import analytics from '../../../services/analytics.js';
import {
  createMetricsExplorerView,
  deleteMetricsExplorerView,
  fetchMetricsExplorer,
  fetchMetricsExplorerViews,
} from '../../../services/adminMonitoring.js';
import classNames from '../../../utils/classNames.js';

const COMPARE_OPTIONS = [
  { value: 'previous_period', label: 'Previous period' },
  { value: 'previous_year', label: 'Previous year' },
  { value: 'target', label: 'Target' },
];

const INITIAL_FILTERS = {
  timeframe: '14d',
  metric: '',
  persona: '',
  channel: '',
  compareTo: 'previous_period',
  includeBenchmarks: true,
  search: '',
};

function MetricCard({ metric }) {
  const deltaTone = metric.delta > 0 ? 'positive' : metric.delta < 0 ? 'negative' : 'neutral';
  return (
    <article className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
      <div>
        <header className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{metric.label}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {metric.value != null ? `${(metric.value * 100).toFixed(1)}%` : '—'}
            </p>
          </div>
          <span
            className={classNames('rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide', {
              'bg-emerald-100 text-emerald-700': deltaTone === 'positive',
              'bg-rose-100 text-rose-700': deltaTone === 'negative',
              'bg-slate-100 text-slate-600': deltaTone === 'neutral',
            })}
          >
            {(metric.delta * 100).toFixed(1)}%
          </span>
        </header>
        <dl className="mt-4 grid grid-cols-2 gap-4 text-xs text-slate-600">
          <div>
            <dt className="font-semibold text-slate-900">Persona</dt>
            <dd>{metric.personaLabel ?? metric.persona ?? 'All'}</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-900">Channel</dt>
            <dd>{metric.channelLabel ?? metric.channel ?? 'All'}</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-900">Sample size</dt>
            <dd>{metric.sampleSize ? new Intl.NumberFormat().format(metric.sampleSize) : '—'}</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-900">Benchmark mode</dt>
            <dd>{metric.includeBenchmarks ? 'Benchmarks on' : 'Benchmarks off'}</dd>
          </div>
        </dl>
        <p className="mt-4 text-sm leading-6 text-slate-600">{metric.narrative}</p>
      </div>
      <footer className="mt-4 flex items-center justify-between gap-4 text-xs text-slate-500">
        <div className="flex flex-wrap gap-2">
          {metric.tags?.map((tag) => (
            <span key={tag} className="rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-600">
              {tag}
            </span>
          ))}
        </div>
        <span>{metric.timeframe?.toUpperCase?.()}</span>
      </footer>
    </article>
  );
}

MetricCard.propTypes = {
  metric: PropTypes.shape({
    label: PropTypes.string.isRequired,
    value: PropTypes.number,
    delta: PropTypes.number,
    persona: PropTypes.string,
    personaLabel: PropTypes.string,
    channel: PropTypes.string,
    channelLabel: PropTypes.string,
    narrative: PropTypes.string,
    sampleSize: PropTypes.number,
    includeBenchmarks: PropTypes.bool,
    tags: PropTypes.arrayOf(PropTypes.string),
    timeframe: PropTypes.string,
  }).isRequired,
};

function AlertsPanel({ alerts }) {
  if (!alerts?.length) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white/60 p-6 text-sm text-slate-500">
        All monitored metrics are within guardrails. Alerting will highlight any excursions instantly.
      </div>
    );
  }
  return (
    <ul className="space-y-4">
      {alerts.map((alert) => (
        <li key={alert.id} className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-500">{alert.status}</p>
              <h4 className="text-base font-semibold text-amber-900">{alert.title}</h4>
            </div>
            <span className="text-xs text-amber-600">{alert.timeframe?.toUpperCase?.()}</span>
          </div>
          <p className="mt-2 text-sm leading-6 text-amber-800">{alert.description}</p>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-amber-700">
            <div>
              <dt className="font-semibold">Metric</dt>
              <dd>{alert.metricKey}</dd>
            </div>
            <div>
              <dt className="font-semibold">Threshold</dt>
              <dd>{alert.threshold != null ? `${(alert.threshold * 100).toFixed(1)}%` : '—'}</dd>
            </div>
            <div>
              <dt className="font-semibold">Current value</dt>
              <dd>{alert.value != null ? `${(alert.value * 100).toFixed(1)}%` : '—'}</dd>
            </div>
          </dl>
        </li>
      ))}
    </ul>
  );
}

AlertsPanel.propTypes = {
  alerts: PropTypes.arrayOf(PropTypes.object),
};

function SavedViews({ views, onApply, onDelete }) {
  if (!views?.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-white/60 p-6 text-sm text-slate-500">
        Save frequently used filters to reapply them in one click.
      </div>
    );
  }
  return (
    <ul className="space-y-3">
      {views.map((view) => (
        <li key={view.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3">
          <button
            type="button"
            onClick={() => onApply?.(view)}
            className="flex flex-col text-left"
          >
            <span className="text-sm font-semibold text-slate-900">{view.name}</span>
            <span className="text-xs text-slate-500">
              Persona {view.query?.persona ? view.query.persona : 'All'} • Channel {view.query?.channel ? view.query.channel : 'All'}
            </span>
          </button>
          <button
            type="button"
            onClick={() => onDelete?.(view)}
            className="rounded-full border border-rose-200 p-1 text-rose-500 hover:border-rose-300 hover:text-rose-600"
            aria-label={`Delete view ${view.name}`}
          >
            <TrashIcon className="h-4 w-4" aria-hidden />
          </button>
        </li>
      ))}
    </ul>
  );
}

SavedViews.propTypes = {
  views: PropTypes.arrayOf(PropTypes.object),
  onApply: PropTypes.func,
  onDelete: PropTypes.func,
};

export default function MetricsExplorer() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [state, setState] = useState({ status: 'idle', data: null, error: null });
  const [views, setViews] = useState([]);
  const [saving, setSaving] = useState(false);
  const [viewName, setViewName] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setState((prev) => ({ ...prev, status: 'loading' }));
      try {
        const payload = await fetchMetricsExplorer(filters);
        if (!isMounted) {
          return;
        }
        setState({ status: 'success', data: payload, error: null });
        analytics.track('admin.monitoring.metrics.loaded', filters);
      } catch (error) {
        console.error('Failed to load metrics explorer', error);
        if (!isMounted) {
          return;
        }
        setState({ status: 'error', data: null, error });
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [filters]);

  useEffect(() => {
    let isMounted = true;
    async function loadViews() {
      try {
        const response = await fetchMetricsExplorerViews();
        if (!isMounted) {
          return;
        }
        setViews(response.views ?? []);
      } catch (error) {
        console.error('Failed to load saved metrics views', error);
      }
    }
    loadViews();
    return () => {
      isMounted = false;
    };
  }, []);

  function updateFilter(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSaveView(event) {
    event.preventDefault();
    const trimmed = viewName.trim();
    if (!trimmed) {
      return;
    }
    try {
      setSaving(true);
      const view = await createMetricsExplorerView({ name: trimmed, query: filters });
      setViews((prev) => [view, ...prev]);
      setViewName('');
      analytics.track('admin.monitoring.metrics.view.saved', { name: trimmed, ...filters });
    } catch (error) {
      console.error('Failed to save metrics explorer view', error);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteView(view) {
    try {
      await deleteMetricsExplorerView(view.id);
      setViews((prev) => prev.filter((candidate) => candidate.id !== view.id));
      analytics.track('admin.monitoring.metrics.view.deleted', { viewId: view.id });
    } catch (error) {
      console.error('Failed to delete metrics explorer view', error);
    }
  }

  function applyView(view) {
    setFilters((prev) => ({ ...prev, ...(view.query ?? {}), timeframe: view.timeframe ?? prev.timeframe }));
    analytics.track('admin.monitoring.metrics.view.applied', { viewId: view.id });
  }

  const filterOptions = state.data?.filters ?? { metrics: [], personas: [], channels: [] };
  const metrics = state.data?.metrics ?? [];
  const alerts = state.data?.alerts ?? [];

  const appliedFilters = useMemo(
    () => ({
      timeframe: filters.timeframe,
      metric: filters.metric || 'All metrics',
      persona: filters.persona || 'All personas',
      channel: filters.channel || 'All channels',
      compareTo: filters.compareTo,
    }),
    [filters],
  );

  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Metrics explorer</h2>
            <p className="mt-1 text-sm text-slate-600">
              Filter premium performance signals, compare segments, and snapshot executive-ready saved views.
            </p>
          </div>
          <form className="flex items-center gap-2" onSubmit={handleSaveView}>
            <div className="relative">
              <input
                type="text"
                value={viewName}
                onChange={(event) => setViewName(event.target.value)}
                placeholder="Name this view"
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 focus:border-sky-400 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-wait disabled:bg-sky-400"
            >
              <PlusIcon className="h-4 w-4" aria-hidden /> Save view
            </button>
          </form>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-12">
        <section className="space-y-6 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm lg:col-span-8">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
              Timeframe
              <select
                className="mt-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 focus:border-sky-400 focus:outline-none"
                value={filters.timeframe}
                onChange={(event) => updateFilter('timeframe', event.target.value)}
              >
                {['7d', '14d', '30d', '90d'].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
              Metric
              <select
                className="mt-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 focus:border-sky-400 focus:outline-none"
                value={filters.metric}
                onChange={(event) => updateFilter('metric', event.target.value)}
              >
                <option value="">All metrics</option>
                {filterOptions.metrics?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
              Persona
              <select
                className="mt-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 focus:border-sky-400 focus:outline-none"
                value={filters.persona}
                onChange={(event) => updateFilter('persona', event.target.value)}
              >
                <option value="">All personas</option>
                {filterOptions.personas?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
              Channel
              <select
                className="mt-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 focus:border-sky-400 focus:outline-none"
                value={filters.channel}
                onChange={(event) => updateFilter('channel', event.target.value)}
              >
                <option value="">All channels</option>
                {filterOptions.channels?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
              Compare to
              <select
                className="mt-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 focus:border-sky-400 focus:outline-none"
                value={filters.compareTo}
                onChange={(event) => updateFilter('compareTo', event.target.value)}
              >
                {COMPARE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                checked={filters.includeBenchmarks}
                onChange={(event) => updateFilter('includeBenchmarks', event.target.checked)}
              />
              Include benchmarks
            </label>
            <label className="relative flex items-center">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400" aria-hidden />
              <input
                type="search"
                value={filters.search}
                onChange={(event) => updateFilter('search', event.target.value)}
                placeholder="Search metrics"
                className="w-full rounded-full border border-slate-200 bg-white px-8 py-2 text-sm text-slate-700 focus:border-sky-400 focus:outline-none"
              />
            </label>
          </div>

          {state.status === 'loading' ? (
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 2 }).map((_, index) => (
                <div key={index} className="h-48 animate-pulse rounded-3xl bg-slate-100" aria-hidden />
              ))}
            </div>
          ) : null}

          {state.status === 'error' ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              <div className="flex items-center gap-2">
                <ExclamationTriangleIcon className="h-5 w-5" aria-hidden />
                Unable to load metrics at this time.
              </div>
            </div>
          ) : null}

          {state.status === 'success' ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <CheckCircleIcon className="h-4 w-4 text-emerald-500" aria-hidden />
                <span>
                  Showing {metrics.length} metric{metrics.length === 1 ? '' : 's'} for {appliedFilters.timeframe}, {appliedFilters.metric}, {appliedFilters.persona}
                  , {appliedFilters.channel}
                </span>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {metrics.map((metric) => (
                  <MetricCard key={metric.id ?? metric.key} metric={metric} />
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <aside className="space-y-6 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm lg:col-span-4">
          <section>
            <header className="flex items-center justify-between text-sm font-semibold uppercase tracking-wide text-slate-500">
              <span>Saved views</span>
              <BookmarkIcon className="h-5 w-5" aria-hidden />
            </header>
            <div className="mt-4">
              <SavedViews views={views} onApply={applyView} onDelete={handleDeleteView} />
            </div>
          </section>
          <section>
            <header className="flex items-center justify-between text-sm font-semibold uppercase tracking-wide text-slate-500">
              <span>Alerts</span>
              <ExclamationTriangleIcon className="h-5 w-5 text-amber-500" aria-hidden />
            </header>
            <div className="mt-4">
              <AlertsPanel alerts={alerts} />
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
}
