import { useCallback, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { FunnelIcon, MagnifyingGlassIcon, ClockIcon } from '@heroicons/react/24/outline';
import DataStatus from '../../components/DataStatus.jsx';
import useComplianceAuditLogs from '../../hooks/useComplianceAuditLogs.js';
import { formatDateLabel, formatRelativeTime } from '../../utils/date.js';

const SEVERITY_TONES = {
  low: 'bg-slate-100 text-slate-700 border-slate-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  high: 'bg-orange-50 text-orange-700 border-orange-200',
  critical: 'bg-rose-50 text-rose-700 border-rose-200',
};

function SeverityBadge({ severity }) {
  const tone = SEVERITY_TONES[severity] ?? SEVERITY_TONES.low;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-semibold uppercase tracking-wide ${tone}`}>
      {severity}
    </span>
  );
}

SeverityBadge.propTypes = {
  severity: PropTypes.string,
};

function SummaryBanner({ summary }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Open cases</p>
        <p className="mt-1 text-xl font-semibold text-slate-900">{summary.open ?? 0}</p>
      </div>
      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-rose-600">Critical</p>
        <p className="mt-1 text-xl font-semibold text-rose-700">{summary.critical ?? 0}</p>
      </div>
      <div className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-orange-600">High severity</p>
        <p className="mt-1 text-xl font-semibold text-orange-700">{summary.high ?? 0}</p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm text-xs text-slate-600">
        <p className="font-semibold uppercase tracking-wide text-slate-500">Last event</p>
        <p className="mt-1 text-sm text-slate-700">
          {summary.latestEventAt ? formatRelativeTime(summary.latestEventAt) : 'No events recorded'}
        </p>
      </div>
    </div>
  );
}

SummaryBanner.propTypes = {
  summary: PropTypes.shape({
    open: PropTypes.number,
    critical: PropTypes.number,
    high: PropTypes.number,
    latestEventAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  }).isRequired,
};

export default function AuditLogViewer({ workspaceId }) {
  const { data, loading, error, refresh, filters, setFilters, clearFilters } = useComplianceAuditLogs({ workspaceId });
  const [search, setSearch] = useState('');

  const events = useMemo(() => {
    const source = data?.events ?? [];
    if (!search) {
      return source;
    }
    const query = search.toLowerCase();
    return source.filter((event) =>
      [event.auditType, event.escalationLevel, event.region]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(query)),
    );
  }, [data?.events, search]);

  const toggleSeverity = useCallback(
    (severity) => {
      const current = filters.severity ?? [];
      const next = current.includes(severity)
        ? current.filter((item) => item !== severity)
        : [...current, severity];
      setFilters({ severity: next });
    },
    [filters.severity, setFilters],
  );

  const toggleStatus = useCallback(
    (status) => {
      const current = filters.status ?? [];
      const next = current.includes(status)
        ? current.filter((item) => item !== status)
        : [...current, status];
      setFilters({ status: next });
    },
    [filters.status, setFilters],
  );

  const severityOptions = data?.filters?.severities ?? [];
  const statusOptions = data?.filters?.statuses ?? [];

  return (
    <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Audit telemetry</p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-900">Monitor high-risk compliance events</h2>
          <p className="mt-2 text-sm text-slate-600">
            Filter security-critical changes, wallet overrides, and review escalations to keep stakeholders informed and audit
            evidence ready.
          </p>
        </div>
        <button
          type="button"
          onClick={clearFilters}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 hover:border-blue-200 hover:text-blue-600"
        >
          <FunnelIcon className="h-4 w-4" aria-hidden="true" /> Reset filters
        </button>
      </header>

      <SummaryBanner summary={data?.summary ?? {}} />

      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
            {severityOptions.map((severity) => (
              <button
                key={severity}
                type="button"
                onClick={() => toggleSeverity(severity)}
                className={`rounded-full border px-3 py-1 ${
                  filters.severity.includes(severity)
                    ? 'border-blue-300 bg-blue-50 text-blue-700'
                    : 'border-slate-200 text-slate-500'
                }`}
              >
                {severity}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(event) => {
                const value = event.target.value;
                setSearch(value);
                setFilters({ search: value });
              }}
              placeholder="Search audit type or region"
              className="w-full rounded-full border border-slate-200 bg-white px-3 py-1 text-sm shadow-inner lg:w-72"
            />
          </label>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
          {statusOptions.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => toggleStatus(status)}
              className={`rounded-full border px-3 py-1 ${
                filters.status.includes(status)
                  ? 'border-blue-300 bg-blue-50 text-blue-700'
                  : 'border-slate-200 text-slate-500'
              }`}
            >
              {status.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      <DataStatus
        loading={loading}
        error={error}
        lastUpdated={data?.summary?.latestEventAt}
        onRefresh={refresh}
        statusLabel="Audit events"
      >
        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th scope="col" className="px-4 py-3">Audit type</th>
                <th scope="col" className="px-4 py-3">Severity</th>
                <th scope="col" className="px-4 py-3">Status</th>
                <th scope="col" className="px-4 py-3">Opened</th>
                <th scope="col" className="px-4 py-3">Findings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-sm text-slate-700">
              {events.map((event) => (
                <tr key={event.id}>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-800">{event.auditType.replace(/_/g, ' ')}</div>
                    <div className="text-xs text-slate-500">{event.escalationLevel ?? 'standard escalation'}</div>
                  </td>
                  <td className="px-4 py-3">
                    <SeverityBadge severity={event.severity} />
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full border border-slate-200 px-2 py-1 text-xs font-semibold uppercase tracking-wide">
                      {event.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <ClockIcon className="h-4 w-4" aria-hidden="true" />
                      {formatDateLabel(event.openedAt, { includeTime: true })}
                    </div>
                    {event.closedAt ? <p className="text-[11px]">Closed {formatRelativeTime(event.closedAt)}</p> : null}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">{event.findingsCount ?? 0}</td>
                </tr>
              ))}
              {!events.length ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-500">
                    No audit events match the current filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </DataStatus>
    </section>
  );
}

AuditLogViewer.propTypes = {
  workspaceId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};
