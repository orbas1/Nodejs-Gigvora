import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowDownTrayIcon,
  ArrowTopRightOnSquareIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

import analytics from '../../../services/analytics.js';
import { exportAuditTrail, fetchAuditTrail } from '../../../services/adminMonitoring.js';
import classNames from '../../../utils/classNames.js';

const INITIAL_FILTERS = {
  timeframe: '14d',
  severity: '',
  actorType: '',
  resourceType: '',
  search: '',
  startDate: '',
  endDate: '',
  page: 1,
  pageSize: 10,
};

function SummaryCard({ title, value, icon: Icon, tone = 'default', description }) {
  return (
    <article
      className={classNames('rounded-3xl border p-6 shadow-sm', {
        'border-emerald-200 bg-emerald-50/70 text-emerald-900': tone === 'success',
        'border-amber-200 bg-amber-50/70 text-amber-900': tone === 'warning',
        'border-slate-200 bg-white/80 text-slate-900': tone === 'default',
      })}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/70 shadow-inner">
          <Icon className="h-6 w-6" aria-hidden />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
          <p className="mt-1 text-2xl font-semibold">{value}</p>
        </div>
      </div>
      {description ? <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p> : null}
    </article>
  );
}

SummaryCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.elementType.isRequired,
  tone: PropTypes.oneOf(['default', 'success', 'warning']),
  description: PropTypes.string,
};

function EventRow({ event, onSelect, isActive }) {
  return (
    <tr
      className={classNames('cursor-pointer border-b border-slate-100 text-sm text-slate-700 transition hover:bg-slate-50', {
        'bg-sky-50': isActive,
      })}
      onClick={() => onSelect?.(event)}
    >
      <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-900">{event.summary}</td>
      <td className="whitespace-nowrap px-4 py-3 capitalize">{event.severity}</td>
      <td className="whitespace-nowrap px-4 py-3">{event.actor?.name}</td>
      <td className="whitespace-nowrap px-4 py-3">{event.resource?.label}</td>
      <td className="whitespace-nowrap px-4 py-3 text-slate-500">{event.timestamp ? new Date(event.timestamp).toLocaleString() : '—'}</td>
    </tr>
  );
}

EventRow.propTypes = {
  event: PropTypes.object.isRequired,
  onSelect: PropTypes.func,
  isActive: PropTypes.bool,
};

function EventDetails({ event, onClose }) {
  if (!event) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white/60 p-6 text-sm text-slate-500">
        Select an audit event to review actor context, metadata, and related incidents.
      </div>
    );
  }
  return (
    <div className="space-y-4 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
      <header className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{event.severity}</p>
          <h3 className="mt-1 text-base font-semibold text-slate-900">{event.summary}</h3>
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500"
          >
            Close
          </button>
        ) : null}
      </header>
      <dl className="grid grid-cols-2 gap-4 text-sm text-slate-600">
        <div>
          <dt className="font-semibold text-slate-900">Actor</dt>
          <dd>{event.actor?.name}</dd>
          <dd className="text-xs uppercase tracking-wide text-slate-500">{event.actor?.type}</dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-900">Resource</dt>
          <dd>{event.resource?.label}</dd>
          <dd className="text-xs uppercase tracking-wide text-slate-500">{event.resource?.type}</dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-900">Action</dt>
          <dd>{event.action}</dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-900">Timestamp</dt>
          <dd>{event.timestamp ? new Date(event.timestamp).toLocaleString() : '—'}</dd>
        </div>
      </dl>
      {event.metadata ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-4">
          <h4 className="text-sm font-semibold text-slate-900">Metadata</h4>
          <pre className="mt-2 overflow-x-auto text-xs text-slate-600">{JSON.stringify(event.metadata, null, 2)}</pre>
        </section>
      ) : null}
      {event.relatedIncidents?.length ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-4">
          <h4 className="text-sm font-semibold text-slate-900">Related incidents</h4>
          <ul className="mt-2 space-y-2 text-sm text-slate-600">
            {event.relatedIncidents.map((incident) => (
              <li key={incident.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2">
                <span>{incident.title}</span>
                <ArrowTopRightOnSquareIcon className="h-4 w-4 text-slate-400" aria-hidden />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

EventDetails.propTypes = {
  event: PropTypes.object,
  onClose: PropTypes.func,
};

export default function AuditTrailViewer() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [state, setState] = useState({ status: 'idle', data: null, error: null });
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setState((prev) => ({ ...prev, status: 'loading' }));
      try {
        const payload = await fetchAuditTrail(filters);
        if (!isMounted) {
          return;
        }
        setState({ status: 'success', data: payload, error: null });
        setSelectedEvent((prev) => (prev ? payload.items?.find((item) => item.id === prev.id) ?? null : null));
        analytics.track('admin.monitoring.audit.loaded', filters);
      } catch (error) {
        console.error('Failed to load audit trail', error);
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

  const summary = state.data?.summary ?? {
    total: 0,
    critical: 0,
    medianResponseMinutes: 0,
    compliancePosture: '—',
    residualRiskNarrative: '—',
  };

  function updateFilter(key, value) {
    setFilters((prev) => ({ ...prev, page: 1, [key]: value }));
  }

  function updatePagination(page) {
    setFilters((prev) => ({ ...prev, page }));
  }

  async function handleExport() {
    try {
      setExporting(true);
      const result = await exportAuditTrail(filters);
      analytics.track('admin.monitoring.audit.exported', { rows: state.data?.items?.length ?? 0, ...filters });
      if (result.fileUrl && typeof window !== 'undefined') {
        window.open(result.fileUrl, '_blank', 'noopener');
      }
    } catch (error) {
      console.error('Failed to export audit trail', error);
    } finally {
      setExporting(false);
    }
  }

  const pagination = state.data?.pagination ?? { page: filters.page, totalPages: 1, pageSize: filters.pageSize };
  const events = state.data?.items ?? [];
  const filterOptions = state.data?.filters ?? { severities: [], actorTypes: [], resources: [] };

  const summaryCards = useMemo(
    () => [
      {
        title: 'Total events',
        value: summary.total,
        icon: ShieldCheckIcon,
        tone: 'default',
        description: summary.compliancePosture,
      },
      {
        title: 'Critical events',
        value: summary.critical,
        icon: ExclamationTriangleIcon,
        tone: 'warning',
      },
      {
        title: 'Median response',
        value: `${summary.medianResponseMinutes} minutes`,
        icon: ClockIcon,
        tone: 'success',
      },
    ],
    [summary],
  );

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Audit trail viewer</h2>
          <p className="mt-1 text-sm text-slate-600">
            Monitor governance events, policy updates, and operational changes with severity context and exportable evidence.
          </p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-wait disabled:bg-slate-500"
        >
          <ArrowDownTrayIcon className="h-4 w-4" aria-hidden /> Export CSV
        </button>
      </header>

      <div className="grid gap-6 lg:grid-cols-12">
        <section className="space-y-6 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm lg:col-span-8">
          <div className="grid gap-4 sm:grid-cols-3">
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
              Severity
              <select
                className="mt-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 focus:border-sky-400 focus:outline-none"
                value={filters.severity}
                onChange={(event) => updateFilter('severity', event.target.value)}
              >
                <option value="">All severities</option>
                {filterOptions.severities?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
              Actor
              <select
                className="mt-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 focus:border-sky-400 focus:outline-none"
                value={filters.actorType}
                onChange={(event) => updateFilter('actorType', event.target.value)}
              >
                <option value="">All actors</option>
                {filterOptions.actorTypes?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
              Resource
              <select
                className="mt-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 focus:border-sky-400 focus:outline-none"
                value={filters.resourceType}
                onChange={(event) => updateFilter('resourceType', event.target.value)}
              >
                <option value="">All resources</option>
                {filterOptions.resources?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
              Start date
              <input
                type="date"
                className="mt-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 focus:border-sky-400 focus:outline-none"
                value={filters.startDate}
                onChange={(event) => updateFilter('startDate', event.target.value)}
              />
            </label>
            <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
              End date
              <input
                type="date"
                className="mt-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 focus:border-sky-400 focus:outline-none"
                value={filters.endDate}
                onChange={(event) => updateFilter('endDate', event.target.value)}
              />
            </label>
          </div>

          <label className="relative mt-2 flex items-center">
            <UserIcon className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400" aria-hidden />
            <input
              type="search"
              value={filters.search}
              onChange={(event) => updateFilter('search', event.target.value)}
              placeholder="Search actors, resources, or summaries"
              className="w-full rounded-full border border-slate-200 bg-white px-8 py-2 text-sm text-slate-700 focus:border-sky-400 focus:outline-none"
            />
          </label>

          {state.status === 'loading' ? (
            <div className="h-64 animate-pulse rounded-3xl bg-slate-100" aria-hidden />
          ) : null}

          {state.status === 'error' ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              <div className="flex items-center gap-2">
                <ExclamationTriangleIcon className="h-5 w-5" aria-hidden />
                Unable to load audit events at this time.
              </div>
            </div>
          ) : null}

          {state.status === 'success' ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead>
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th scope="col" className="px-4 py-3">Summary</th>
                    <th scope="col" className="px-4 py-3">Severity</th>
                    <th scope="col" className="px-4 py-3">Actor</th>
                    <th scope="col" className="px-4 py-3">Resource</th>
                    <th scope="col" className="px-4 py-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <EventRow key={event.id} event={event} isActive={selectedEvent?.id === event.id} onSelect={setSelectedEvent} />
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          <footer className="flex flex-col items-center justify-between gap-3 pt-4 text-sm text-slate-600 sm:flex-row">
            <span>
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => updatePagination(Math.max(1, pagination.page - 1))}
                disabled={pagination.page <= 1}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => updatePagination(Math.min(pagination.totalPages, pagination.page + 1))}
                disabled={pagination.page >= pagination.totalPages}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </footer>
        </section>

        <aside className="space-y-6 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm lg:col-span-4">
          <div className="grid gap-4">
            {summaryCards.map((card) => (
              <SummaryCard
                key={card.title}
                title={card.title}
                value={card.value}
                icon={card.icon}
                tone={card.tone}
                description={card.description}
              />
            ))}
          </div>
          <EventDetails event={selectedEvent} onClose={() => setSelectedEvent(null)} />
        </aside>
      </div>
    </section>
  );
}
