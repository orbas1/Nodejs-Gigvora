import { useCallback, useDeferredValue, useEffect, useMemo, useState, useTransition } from 'react';
import PropTypes from 'prop-types';
import {
  AdjustmentsHorizontalIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  ChartBarIcon,
  CheckCircleIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  PlusCircleIcon,
  SquaresPlusIcon,
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

const LOCAL_STORAGE_KEY = 'gigvora:web:admin:metrics-explorer:views';

const DEFAULT_QUERY = {
  timeframe: '30d',
  metric: 'engagementRate',
  persona: 'all',
  channel: 'all',
  compareTo: 'previous_period',
  includeBenchmarks: true,
  search: '',
};

function readLocalViews() {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('Unable to read metrics explorer cached views', error);
    return [];
  }
}

function persistLocalViews(views) {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(views));
  } catch (error) {
    console.warn('Unable to persist metrics explorer cached views', error);
  }
}

function formatNumber(value, fractionDigits = 0) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) {
    return '0';
  }
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: fractionDigits }).format(numeric);
}

function formatPercent(value, fractionDigits = 1) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) {
    return '0%';
  }
  return `${(numeric * 100).toFixed(fractionDigits)}%`;
}

function metricStatusTone(status) {
  switch (status) {
    case 'improving':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'declining':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'stable':
      return 'bg-slate-50 text-slate-600 border-slate-200';
    case 'at_risk':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    default:
      return 'bg-slate-50 text-slate-600 border-slate-200';
  }
}

function MetricCard({ metric, onInspect }) {
  const trend = Number(metric.delta ?? 0);
  const trendLabel = `${trend > 0 ? '+' : ''}${(trend * 100).toFixed(1)}%`;
  const TrendIcon = trend >= 0 ? ArrowTrendingUpIcon : ArrowTrendingDownIcon;

  return (
    <button
      type="button"
      onClick={() => onInspect?.(metric)}
      className="group flex h-full flex-col justify-between rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
    >
      <div>
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{metric.label}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{formatPercent(metric.value ?? 0)}</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {metric.sampleSize ? `${formatNumber(metric.sampleSize)} samples` : 'No cohort size'}
          </span>
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-600">{metric.narrative ?? 'No narrative provided.'}</p>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
          <TrendIcon className={classNames('h-4 w-4', trend >= 0 ? 'text-emerald-500' : 'text-rose-500')} aria-hidden />
          {trendLabel}
        </div>
        <div
          className="flex h-12 w-32 items-end justify-start gap-px overflow-hidden rounded-lg bg-slate-100 p-1"
          aria-hidden
        >
          {metric.sparkline?.length
            ? metric.sparkline.map((point, index) => {
                const height = Math.max(6, Math.round(Number(point.value ?? 0) * 40));
                return (
                  <span
                    key={`${metric.key}-spark-${index}`}
                    className="w-2 rounded-full bg-gradient-to-t from-sky-400 via-indigo-500 to-violet-600 transition group-hover:from-sky-300 group-hover:via-indigo-400 group-hover:to-violet-500"
                    style={{ height }}
                  />
                );
              })
            : null}
        </div>
      </div>
    </button>
  );
}

MetricCard.propTypes = {
  metric: PropTypes.shape({
    key: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    value: PropTypes.number,
    delta: PropTypes.number,
    sampleSize: PropTypes.number,
    narrative: PropTypes.string,
    sparkline: PropTypes.arrayOf(
      PropTypes.shape({
        value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      }),
    ),
  }).isRequired,
  onInspect: PropTypes.func,
};

function AlertList({ alerts }) {
  if (!alerts?.length) {
    return (
      <p className="text-sm text-slate-500">
        All monitored metrics are trending within guardrails. Stay vigilant by pinning thresholds to keep this dashboard proactive.
      </p>
    );
  }
  return (
    <ul className="space-y-3">
      {alerts.map((alert) => (
        <li
          key={alert.id}
          className={classNames(
            'rounded-2xl border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg',
            metricStatusTone(alert.status),
          )}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">{alert.title}</p>
              <p className="mt-1 text-xs text-slate-600">{alert.description}</p>
            </div>
            <div className="text-xs text-slate-500">
              <p>Threshold {formatPercent(alert.threshold)}</p>
              <p className="mt-1 font-semibold">Current {formatPercent(alert.value)}</p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

AlertList.propTypes = {
  alerts: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      title: PropTypes.string.isRequired,
      description: PropTypes.string,
      status: PropTypes.string,
      threshold: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    }),
  ),
};

function SavedViews({ views, activeViewId, onSelect, onDelete }) {
  if (!views.length) {
    return (
      <p className="text-sm text-slate-500">Save curated perspectives for leadership to revisit and benchmark.</p>
    );
  }
  return (
    <ul className="space-y-2">
      {views.map((view) => (
        <li key={view.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/80 p-3">
          <button
            type="button"
            onClick={() => onSelect(view)}
            className={classNames(
              'flex-1 text-left text-sm font-semibold transition hover:text-sky-600',
              activeViewId === view.id ? 'text-sky-600' : 'text-slate-800',
            )}
          >
            {view.name}
            <span className="ml-2 text-xs font-normal uppercase tracking-wide text-slate-500">{view.timeframe}</span>
          </button>
          <button
            type="button"
            onClick={() => onDelete(view)}
            className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-rose-300 hover:text-rose-600"
            aria-label={`Delete saved view ${view.name}`}
          >
            <TrashIcon className="h-4 w-4" aria-hidden />
          </button>
        </li>
      ))}
    </ul>
  );
}

SavedViews.propTypes = {
  views: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      name: PropTypes.string.isRequired,
      timeframe: PropTypes.string,
      query: PropTypes.object.isRequired,
    }),
  ).isRequired,
  activeViewId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  onSelect: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

export default function MetricsExplorer({ onInspectMetric }) {
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [metrics, setMetrics] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [filters, setFilters] = useState({ metrics: [], personas: [], channels: [] });
  const [savedViews, setSavedViews] = useState(() => readLocalViews());
  const [activeViewId, setActiveViewId] = useState(null);
  const [isPending, startTransition] = useTransition();

  const deferredSearch = useDeferredValue(query.search);

  const loadData = useCallback(async (nextQuery) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchMetricsExplorer(nextQuery);
      setMetrics(response.metrics ?? []);
      setAlerts(response.alerts ?? []);
      setFilters({
        metrics: response.filters?.metrics ?? [],
        personas: response.filters?.personas ?? [],
        channels: response.filters?.channels ?? [],
      });
      analytics.track('admin.monitoring.metrics.loaded', {
        timeframe: nextQuery.timeframe,
        metric: nextQuery.metric,
        persona: nextQuery.persona,
        channel: nextQuery.channel,
        results: (response.metrics ?? []).length,
      }).catch(() => {});
    } catch (loadError) {
      setError(loadError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(query);
  }, [query, loadData]);

  useEffect(() => {
    async function loadViews() {
      try {
        const response = await fetchMetricsExplorerViews();
        if (Array.isArray(response?.views)) {
          setSavedViews((existing) => {
            const merged = [...response.views, ...existing.filter((view) => !response.views.some((item) => item.id === view.id))];
            persistLocalViews(merged);
            return merged;
          });
        }
      } catch (viewError) {
        console.warn('Unable to sync metrics explorer views from API', viewError);
      }
    }
    loadViews();
  }, []);

  const filteredMetrics = useMemo(() => {
    if (!metrics.length) {
      return [];
    }
    const keywords = deferredSearch.trim().toLowerCase();
    const filtered = metrics.filter((metric) => {
      if (!keywords) {
        return true;
      }
      const tokens = [metric.label, metric.description, ...(metric.tags ?? [])].join(' ').toLowerCase();
      return tokens.includes(keywords);
    });
    return filtered;
  }, [metrics, deferredSearch]);

  const pinnedMetrics = useMemo(() => filteredMetrics.slice(0, 12), [filteredMetrics]);

  const handleQueryChange = useCallback((key, value) => {
    startTransition(() => {
      setQuery((current) => ({ ...current, [key]: value }));
    });
  }, []);

  const handleSaveView = useCallback(async () => {
    const name = prompt('Name this perspective for your leadership team');
    if (!name) {
      return;
    }
    const payload = { name, query, timeframe: query.timeframe };
    let createdView = null;
    try {
      createdView = await createMetricsExplorerView(payload);
    } catch (apiError) {
      console.warn('Unable to persist metrics explorer view to API, falling back to local cache.', apiError);
    }
    const newView = {
      id: createdView?.id ?? `${Date.now()}`,
      name,
      timeframe: query.timeframe,
      query,
    };
    setSavedViews((existing) => {
      const next = [...existing.filter((view) => view.id !== newView.id), newView];
      persistLocalViews(next);
      return next;
    });
    setActiveViewId(newView.id);
    analytics.track('admin.monitoring.metrics.view-saved', {
      id: newView.id,
      name,
      timeframe: query.timeframe,
    }).catch(() => {});
  }, [query]);

  const handleDeleteView = useCallback(async (view) => {
    setSavedViews((existing) => {
      const filtered = existing.filter((item) => item.id !== view.id);
      persistLocalViews(filtered);
      return filtered;
    });
    setActiveViewId((current) => (current === view.id ? null : current));
    try {
      await deleteMetricsExplorerView(view.id);
    } catch (deleteError) {
      console.warn('Unable to delete metrics explorer view from API, continuing with local removal.', deleteError);
    }
    analytics.track('admin.monitoring.metrics.view-deleted', { id: view.id }).catch(() => {});
  }, []);

  const handleSelectView = useCallback((view) => {
    setActiveViewId(view.id);
    setQuery(view.query);
    analytics.track('admin.monitoring.metrics.view-selected', { id: view.id }).catch(() => {});
  }, []);

  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Monitoring &amp; analytics</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-900">Metrics explorer</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Pivot enterprise metrics with premium controls. Layer filters, saved perspectives, and intelligent alerts so analysts
              and executives uncover the why behind every move.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleSaveView}
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
            >
              <PlusCircleIcon className="h-5 w-5" aria-hidden />
              Save view
            </button>
            <button
              type="button"
              onClick={() => analytics.track('admin.monitoring.metrics.exported', query).catch(() => {})}
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-400"
            >
              <ArrowDownTrayIcon className="h-5 w-5" aria-hidden />
              Export data
            </button>
          </div>
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-6">
          <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 shadow-sm lg:col-span-2">
            <ChartBarIcon className="h-4 w-4" aria-hidden />
            <span className="sr-only">Metric</span>
            <select
              value={query.metric}
              onChange={(event) => handleQueryChange('metric', event.target.value)}
              className="w-full rounded-xl border-none bg-transparent text-sm font-semibold text-slate-900 focus:outline-none"
            >
              {filters.metrics?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 shadow-sm">
            <FunnelIcon className="h-4 w-4" aria-hidden />
            <span className="sr-only">Persona</span>
            <select
              value={query.persona}
              onChange={(event) => handleQueryChange('persona', event.target.value)}
              className="w-full rounded-xl border-none bg-transparent text-sm font-semibold text-slate-900 focus:outline-none"
            >
              {[{ value: 'all', label: 'All personas' }, ...(filters.personas ?? [])].map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 shadow-sm">
            <AdjustmentsHorizontalIcon className="h-4 w-4" aria-hidden />
            <span className="sr-only">Channel</span>
            <select
              value={query.channel}
              onChange={(event) => handleQueryChange('channel', event.target.value)}
              className="w-full rounded-xl border-none bg-transparent text-sm font-semibold text-slate-900 focus:outline-none"
            >
              {[{ value: 'all', label: 'All channels' }, ...(filters.channels ?? [])].map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 shadow-sm">
            <ArrowPathIcon className={classNames('h-4 w-4', loading || isPending ? 'animate-spin text-sky-500' : 'text-slate-500')} aria-hidden />
            <span className="sr-only">Comparison</span>
            <select
              value={query.compareTo}
              onChange={(event) => handleQueryChange('compareTo', event.target.value)}
              className="w-full rounded-xl border-none bg-transparent text-sm font-semibold text-slate-900 focus:outline-none"
            >
              <option value="previous_period">Previous period</option>
              <option value="previous_year">Previous year</option>
              <option value="benchmark">Benchmark cohort</option>
            </select>
          </label>
          <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 shadow-sm lg:col-span-2">
            <MagnifyingGlassIcon className="h-4 w-4" aria-hidden />
            <span className="sr-only">Search metrics</span>
            <input
              type="search"
              value={query.search}
              onChange={(event) => handleQueryChange('search', event.target.value)}
              placeholder="Search metrics, tags, thresholds…"
              className="w-full rounded-xl border-none bg-transparent text-sm font-semibold text-slate-900 focus:outline-none"
            />
          </label>
        </div>
      </header>

      {error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
          <p className="text-sm font-semibold text-rose-700">We couldn’t load the explorer results.</p>
          <p className="mt-1 text-sm text-rose-600">{error.message ?? 'Unknown error encountered.'}</p>
          <button
            type="button"
            onClick={() => loadData(query)}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-500"
          >
            <ArrowPathIcon className="h-4 w-4" aria-hidden />
            Retry search
          </button>
        </div>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Metric narratives</h3>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {filteredMetrics.length} metrics
            </span>
          </div>
          <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {pinnedMetrics.map((metric) => (
              <MetricCard
                key={metric.key}
                metric={metric}
                onInspect={(selectedMetric) => {
                  analytics.track('admin.monitoring.metrics.metric-opened', {
                    key: selectedMetric.key,
                  }).catch(() => {});
                  onInspectMetric?.(selectedMetric);
                }}
              />
            ))}
          </div>
          {filteredMetrics.length > pinnedMetrics.length ? (
            <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
              Showing top {pinnedMetrics.length} signals. Refine filters or search to reveal more, or export the full dataset for offline analysis.
            </div>
          ) : null}
        </div>
        <aside className="space-y-5 lg:col-span-4">
          <div className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Saved perspectives</h3>
              <SquaresPlusIcon className="h-5 w-5 text-slate-400" aria-hidden />
            </div>
            <SavedViews
              views={savedViews}
              activeViewId={activeViewId}
              onSelect={handleSelectView}
              onDelete={handleDeleteView}
            />
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Alerts</h3>
              <PencilIcon className="h-5 w-5 text-slate-400" aria-hidden />
            </div>
            <AlertList alerts={alerts} />
          </div>
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
            <div className="flex items-center gap-3 text-sm text-emerald-700">
              <CheckCircleIcon className="h-5 w-5" aria-hidden />
              <p>
                Benchmarks activated. Current dataset includes market peers to contextualise trends without sacrificing privacy.
              </p>
            </div>
            <label className="mt-3 flex items-center gap-2 text-xs font-semibold text-emerald-700">
              <input
                type="checkbox"
                checked={query.includeBenchmarks}
                onChange={(event) => handleQueryChange('includeBenchmarks', event.target.checked)}
                className="h-4 w-4 rounded border-emerald-400 text-emerald-600 focus:ring-emerald-500"
              />
              Include benchmark cohort
            </label>
          </div>
        </aside>
      </section>
    </section>
  );
}

MetricsExplorer.propTypes = {
  onInspectMetric: PropTypes.func,
};
