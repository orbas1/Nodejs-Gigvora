import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  BookmarkIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import analytics from '../../../services/analytics.js';
import { exportAuditTrail, fetchAuditTrail } from '../../../services/adminMonitoring.js';
import classNames from '../../../utils/classNames.js';

const DEFAULT_FILTERS = {
  timeframe: '14d',
  severity: 'all',
  actorType: 'all',
  resource: 'all',
  search: '',
};

const SEVERITY_STYLES = {
  critical: 'border-rose-200 bg-rose-50 text-rose-700',
  high: 'border-amber-200 bg-amber-50 text-amber-700',
  medium: 'border-sky-200 bg-sky-50 text-sky-700',
  low: 'border-emerald-200 bg-emerald-50 text-emerald-700',
};

function formatTimestamp(timestamp) {
  if (!timestamp) {
    return '—';
  }
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleString();
}

function formatRelative(timestamp) {
  if (!timestamp) {
    return 'moments ago';
  }
  const date = new Date(timestamp);
  const diffMs = Date.now() - date.getTime();
  if (!Number.isFinite(diffMs) || diffMs < 0) {
    return 'moments ago';
  }
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  if (diffMinutes < 1) {
    return 'moments ago';
  }
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function severityTone(severity) {
  if (!severity) {
    return 'border-slate-200 bg-slate-50 text-slate-600';
  }
  return SEVERITY_STYLES[severity] ?? 'border-slate-200 bg-slate-50 text-slate-600';
}

function TrailRow({ event, onRevealContext }) {
  return (
    <tr className="border-b border-slate-100 bg-white hover:bg-slate-50">
      <td className="px-4 py-3 align-top">
        <div className={classNames('inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold', severityTone(event.severity))}>
          {event.severity?.toUpperCase() ?? 'INFO'}
        </div>
      </td>
      <td className="px-4 py-3 align-top">
        <div className="text-sm font-semibold text-slate-800">{event.action}</div>
        <p className="mt-1 text-xs text-slate-500">{event.summary}</p>
        <button
          type="button"
          onClick={() => onRevealContext(event)}
          className="mt-2 inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-slate-300"
        >
          View context
        </button>
      </td>
      <td className="px-4 py-3 align-top text-sm text-slate-600">
        <p>{event.actor?.name ?? 'System'}</p>
        <p className="text-xs text-slate-500">{event.actor?.type ?? 'service'}</p>
      </td>
      <td className="px-4 py-3 align-top text-sm text-slate-600">
        <p>{event.resource?.label ?? event.resource?.key}</p>
        <p className="text-xs text-slate-500">{event.resource?.type}</p>
      </td>
      <td className="px-4 py-3 align-top text-right text-sm text-slate-600">
        <p>{formatTimestamp(event.timestamp)}</p>
        <p className="text-xs text-slate-500">{formatRelative(event.timestamp)}</p>
      </td>
    </tr>
  );
}

TrailRow.propTypes = {
  event: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    severity: PropTypes.string,
    action: PropTypes.string,
    summary: PropTypes.string,
    actor: PropTypes.shape({
      name: PropTypes.string,
      type: PropTypes.string,
    }),
    resource: PropTypes.shape({
      key: PropTypes.string,
      label: PropTypes.string,
      type: PropTypes.string,
    }),
    timestamp: PropTypes.string,
  }).isRequired,
  onRevealContext: PropTypes.func.isRequired,
};

function ContextDrawer({ event }) {
  if (!event) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white/70 p-6 text-sm text-slate-500">
        Select an audit event to inspect its decision context, payloads, and downstream impact.
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-lg">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Event context</h3>
          <p className="mt-1 text-lg font-semibold text-slate-900">{event.action}</p>
          <p className="mt-1 text-sm text-slate-600">{event.summary}</p>
        </div>
        <div className={classNames('rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide', severityTone(event.severity))}>
          {event.severity?.toUpperCase() ?? 'INFO'}
        </div>
      </div>
      <dl className="mt-4 grid gap-3 text-sm">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Timestamp</dt>
          <dd className="text-slate-800">{formatTimestamp(event.timestamp)}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Actor</dt>
          <dd className="text-slate-800">{event.actor?.name ?? 'System'}</dd>
          <dd className="text-xs text-slate-500">{event.actor?.type ?? 'service'}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Resource</dt>
          <dd className="text-slate-800">{event.resource?.label ?? event.resource?.key}</dd>
          <dd className="text-xs text-slate-500">{event.resource?.type}</dd>
        </div>
      </dl>
      {event.metadata ? (
        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Metadata</p>
          <pre className="mt-2 max-h-64 overflow-auto rounded-2xl bg-slate-900/90 p-4 text-xs text-emerald-200">
            {JSON.stringify(event.metadata, null, 2)}
          </pre>
        </div>
      ) : null}
      {event.relatedIncidents?.length ? (
        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Related incidents</p>
          <ul className="mt-2 space-y-2 text-sm">
            {event.relatedIncidents.map((incident) => (
              <li key={incident.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <p className="font-semibold text-slate-800">{incident.title}</p>
                <p className="text-xs text-slate-500">{incident.status} · {formatTimestamp(incident.openedAt)}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

ContextDrawer.propTypes = {
  event: PropTypes.shape({
    action: PropTypes.string,
    summary: PropTypes.string,
    severity: PropTypes.string,
    timestamp: PropTypes.string,
    actor: PropTypes.object,
    resource: PropTypes.object,
    metadata: PropTypes.object,
    relatedIncidents: PropTypes.arrayOf(PropTypes.object),
  }),
};

export default function AuditTrailViewer({ defaultFilters = {} }) {
  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS, ...defaultFilters });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [events, setEvents] = useState([]);
  const [summary, setSummary] = useState({ total: 0, critical: 0, high: 0, medianResponseMinutes: 0 });
  const [context, setContext] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 50, totalPages: 1 });
  const [availableFilters, setAvailableFilters] = useState({ severities: [], actorTypes: [], resources: [] });

  const loadEvents = useCallback(async (activeFilters, paginationState) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchAuditTrail({ ...activeFilters, page: paginationState.page, pageSize: paginationState.pageSize });
      setEvents(response.items ?? []);
      setSummary(response.summary ?? {});
      setAvailableFilters({
        severities: response.filters?.severities ?? [],
        actorTypes: response.filters?.actorTypes ?? [],
        resources: response.filters?.resources ?? [],
      });
      setPagination((current) => ({
        ...current,
        page: response.pagination?.page ?? paginationState.page,
        pageSize: response.pagination?.pageSize ?? paginationState.pageSize,
        totalPages: response.pagination?.totalPages ?? response.pagination?.page ?? 1,
      }));
      analytics.track('admin.monitoring.audit.loaded', {
        severity: activeFilters.severity,
        actorType: activeFilters.actorType,
        resource: activeFilters.resource,
        results: (response.items ?? []).length,
      }).catch(() => {});
    } catch (loadError) {
      setError(loadError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents(filters, pagination);
  }, [filters, loadEvents]);

  const severityOptions = useMemo(() => [{ value: 'all', label: 'All severities' }, ...(availableFilters.severities ?? [])], [availableFilters.severities]);
  const actorTypeOptions = useMemo(() => [{ value: 'all', label: 'All actors' }, ...(availableFilters.actorTypes ?? [])], [availableFilters.actorTypes]);
  const resourceOptions = useMemo(() => [{ value: 'all', label: 'All resources' }, ...(availableFilters.resources ?? [])], [availableFilters.resources]);

  const groupedEvents = useMemo(() => {
    const groups = new Map();
    for (const event of events) {
      const day = event.timestamp ? new Date(event.timestamp).toDateString() : 'Unknown';
      if (!groups.has(day)) {
        groups.set(day, []);
      }
      groups.get(day).push(event);
    }
    return Array.from(groups.entries()).map(([day, dayEvents]) => ({ day, events: dayEvents }));
  }, [events]);

  const handleExport = useCallback(async () => {
    try {
      const payload = await exportAuditTrail(filters);
      analytics.track('admin.monitoring.audit.exported', filters).catch(() => {});
      if (payload?.fileUrl) {
        window.open(payload.fileUrl, '_blank', 'noopener');
      }
    } catch (exportError) {
      console.warn('Unable to export audit trail', exportError);
    }
  }, [filters]);

  const handleBookmark = useCallback(() => {
    analytics.track('admin.monitoring.audit.bookmarked', filters).catch(() => {});
  }, [filters]);

  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Monitoring &amp; analytics</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-900">Audit trail</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Deliver regulator-ready transparency. Investigate every policy decision, membership change, and risk signal with premium
              filtering, context, and export tooling.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
            >
              <ArrowDownTrayIcon className="h-5 w-5" aria-hidden />
              Export CSV
            </button>
            <button
              type="button"
              onClick={handleBookmark}
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-400"
            >
              <BookmarkIcon className="h-5 w-5" aria-hidden />
              Bookmark filter
            </button>
          </div>
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-5">
          <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 shadow-sm">
            <CalendarDaysIcon className={classNames('h-4 w-4', loading ? 'animate-spin text-sky-500' : 'text-slate-500')} aria-hidden />
            <span className="sr-only">Timeframe</span>
            <select
              value={filters.timeframe}
              onChange={(event) => setFilters((current) => ({ ...current, timeframe: event.target.value }))}
              className="w-full rounded-xl border-none bg-transparent text-sm font-semibold text-slate-900 focus:outline-none"
            >
              <option value="7d">Last 7 days</option>
              <option value="14d">Last 14 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </label>
          <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 shadow-sm">
            <FunnelIcon className="h-4 w-4" aria-hidden />
            <span className="sr-only">Severity</span>
            <select
              value={filters.severity}
              onChange={(event) => setFilters((current) => ({ ...current, severity: event.target.value }))}
              className="w-full rounded-xl border-none bg-transparent text-sm font-semibold text-slate-900 focus:outline-none"
            >
              {severityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 shadow-sm">
            <ShieldCheckIcon className="h-4 w-4" aria-hidden />
            <span className="sr-only">Actor</span>
            <select
              value={filters.actorType}
              onChange={(event) => setFilters((current) => ({ ...current, actorType: event.target.value }))}
              className="w-full rounded-xl border-none bg-transparent text-sm font-semibold text-slate-900 focus:outline-none"
            >
              {actorTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 shadow-sm">
            <SparklesIcon className="h-4 w-4" aria-hidden />
            <span className="sr-only">Resource</span>
            <select
              value={filters.resource}
              onChange={(event) => setFilters((current) => ({ ...current, resource: event.target.value }))}
              className="w-full rounded-xl border-none bg-transparent text-sm font-semibold text-slate-900 focus:outline-none"
            >
              {resourceOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 shadow-sm lg:col-span-1">
            <MagnifyingGlassIcon className="h-4 w-4" aria-hidden />
            <span className="sr-only">Search</span>
            <input
              type="search"
              value={filters.search}
              onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
              placeholder="Search actor, resource, decision…"
              className="w-full rounded-xl border-none bg-transparent text-sm font-semibold text-slate-900 focus:outline-none"
            />
          </label>
        </div>
        <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Events reviewed</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{summary.total ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
            <p className="text-xs font-semibold uppercase tracking-wide">Critical incidents</p>
            <p className="mt-1 text-2xl font-semibold">{summary.critical ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
            <p className="text-xs font-semibold uppercase tracking-wide">Median response</p>
            <p className="mt-1 text-2xl font-semibold">{summary.medianResponseMinutes ?? 0} minutes</p>
          </div>
        </div>
      </header>

      {error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
          <p className="text-sm font-semibold text-rose-700">We were unable to load the audit trail.</p>
          <p className="mt-1 text-sm text-rose-600">{error.message ?? 'Unknown error encountered.'}</p>
          <button
            type="button"
            onClick={() => loadEvents(filters, pagination)}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-500"
          >
            <ArrowPathIcon className="h-4 w-4" aria-hidden />
            Retry fetch
          </button>
        </div>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <div className="overflow-hidden rounded-3xl border border-slate-200 shadow-sm">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left font-semibold">Severity</th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold">Action</th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold">Actor</th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold">Resource</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {groupedEvents.map((group) => (
                  <Fragment key={group.day}>
                    <tr className="bg-slate-900/90 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">
                      <td colSpan={5} className="px-4 py-2">
                        {group.day}
                      </td>
                    </tr>
                    {group.events.map((event) => (
                      <TrailRow key={event.id} event={event} onRevealContext={setContext} />
                    ))}
                  </Fragment>
                ))}
                {!loading && groupedEvents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                      No audit events match the selected filters yet. Adjust criteria or expand the timeframe to continue your investigation.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
            {loading ? (
              <div className="flex items-center justify-center gap-2 border-t border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                <ArrowPathIcon className="h-4 w-4 animate-spin text-sky-500" aria-hidden />
                Loading events…
              </div>
            ) : null}
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            <p>
              Page {pagination.page} of {pagination.totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setPagination((current) => {
                    const nextPage = Math.max(1, current.page - 1);
                    const next = { ...current, page: nextPage };
                    loadEvents(filters, next);
                    return next;
                  })
                }
                className="rounded-full border border-slate-200 px-3 py-1 font-semibold text-slate-600 transition hover:border-slate-300"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() =>
                  setPagination((current) => {
                    const nextPage = Math.min(current.totalPages, current.page + 1);
                    const next = { ...current, page: nextPage };
                    loadEvents(filters, next);
                    return next;
                  })
                }
                className="rounded-full border border-slate-200 px-3 py-1 font-semibold text-slate-600 transition hover:border-slate-300"
              >
                Next
              </button>
            </div>
          </div>
        </div>
        <aside className="space-y-5 lg:col-span-4">
          <ContextDrawer event={context} />
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-700">
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircleIcon className="h-5 w-5" aria-hidden />
              {summary.compliancePosture ?? 'Compliance posture: healthy'}
            </div>
            <p className="mt-2">
              Every export, bookmark, and filter change is logged. Shareable permalinks keep governance teams aligned to the same investigation trail.
            </p>
          </div>
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
            <div className="flex items-center gap-2 font-semibold">
              <ExclamationCircleIcon className="h-5 w-5" aria-hidden />
              Residual risk
            </div>
            <p className="mt-2">
              {summary.residualRiskNarrative ?? 'No outstanding risks reported. Continue scheduled reviews to maintain regulator confidence.'}
            </p>
          </div>
        </aside>
      </section>
    </section>
  );
}

AuditTrailViewer.propTypes = {
  defaultFilters: PropTypes.shape({
    timeframe: PropTypes.string,
    severity: PropTypes.string,
    actorType: PropTypes.string,
    resource: PropTypes.string,
    search: PropTypes.string,
  }),
};
