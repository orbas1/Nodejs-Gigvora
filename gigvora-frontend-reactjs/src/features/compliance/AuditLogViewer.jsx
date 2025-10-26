import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  Bars3BottomLeftIcon,
  BoltIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ShieldExclamationIcon,
  SparklesIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { classNames } from '../../utils/classNames.js';
import DataStatus from '../../components/DataStatus.jsx';
import { formatDateLabel, formatRelativeTime } from '../../utils/date.js';

const SEVERITY_TONES = {
  low: 'bg-emerald-50 border-emerald-200 text-emerald-600',
  medium: 'bg-amber-50 border-amber-200 text-amber-700',
  high: 'bg-rose-50 border-rose-200 text-rose-600',
  critical: 'bg-rose-100 border-rose-200 text-rose-700',
};

const ACTION_TONES = {
  login: 'bg-blue-50 text-blue-600 border-blue-200',
  permission: 'bg-violet-50 text-violet-600 border-violet-200',
  payout: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  compliance: 'bg-amber-50 text-amber-700 border-amber-200',
};

const FALLBACK_LOG = {
  summary: {
    totalEvents: 482,
    criticalEvents: 3,
    actors: 42,
    last24h: 97,
    updatedAt: new Date(),
  },
  filters: {
    severities: ['low', 'medium', 'high', 'critical'],
    actions: ['login', 'permission', 'payout', 'compliance'],
  },
  events: [
    {
      id: 'evt-1',
      action: 'permission',
      resource: 'Role assignment',
      actor: 'Alicia Gomez',
      actorAvatar: null,
      severity: 'critical',
      occurredAt: new Date(Date.now() - 1000 * 60 * 20),
      location: 'Madrid, ES',
      device: 'Chrome · macOS',
      description: 'Admin role granted to contractor profile',
      ipAddress: '185.91.22.41',
      metadata: {
        before: 'member',
        after: 'admin',
      },
    },
    {
      id: 'evt-2',
      action: 'login',
      resource: 'Gigvora Admin',
      actor: 'API token: payroll-service',
      severity: 'medium',
      occurredAt: new Date(Date.now() - 1000 * 60 * 45),
      location: 'US-East-1',
      device: 'Service account',
      description: 'Successful JWT refresh',
      ipAddress: '54.23.100.12',
      metadata: {
        sessionId: 'sess_3478234',
      },
    },
    {
      id: 'evt-3',
      action: 'payout',
      resource: 'Wallet release',
      actor: 'Rahul Menon',
      severity: 'high',
      occurredAt: new Date(Date.now() - 1000 * 60 * 90),
      location: 'Bengaluru, IN',
      device: 'Safari · iOS',
      description: 'Manual override triggered payout release of $4,800',
      ipAddress: '106.51.44.201',
      metadata: {
        amount: '$4,800',
        reason: 'Client escalation',
      },
    },
    {
      id: 'evt-4',
      action: 'compliance',
      resource: 'Identity review',
      actor: 'Gigvora Trust Bot',
      severity: 'low',
      occurredAt: new Date(Date.now() - 1000 * 60 * 120),
      location: 'System',
      device: 'Automation',
      description: 'Identity case #558 approved after biometric match',
      ipAddress: '127.0.0.1',
      metadata: {
        caseId: 'ID-558',
        reviewTime: '12m',
      },
    },
  ],
};

function MetricCard({ value, label, tone }) {
  return (
    <div className={classNames('rounded-2xl border p-4 shadow-subtle', tone ?? 'border-slate-200 bg-white/85 text-slate-600')}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

MetricCard.propTypes = {
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  label: PropTypes.string.isRequired,
  tone: PropTypes.string,
};

function FilterChip({ active, label, onClick, icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={classNames(
        'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition',
        active ? 'border-blue-300 bg-blue-50 text-blue-700 shadow-sm' : 'border-slate-200 text-slate-500 hover:border-blue-200 hover:text-blue-600'
      )}
    >
      {icon}
      {label}
    </button>
  );
}

FilterChip.propTypes = {
  active: PropTypes.bool,
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  icon: PropTypes.node,
};

function EventRow({ event, onSelect, active }) {
  const severityTone = SEVERITY_TONES[event.severity] ?? SEVERITY_TONES.low;
  const actionTone = ACTION_TONES[event.action] ?? 'bg-slate-100 text-slate-600 border-slate-200';

  return (
    <button
      type="button"
      onClick={() => onSelect(event)}
      className={classNames(
        'flex w-full flex-col gap-3 rounded-3xl border border-slate-200 bg-white/80 p-4 text-left shadow-subtle transition hover:border-blue-200 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-200',
        active ? 'border-blue-300 shadow-lg' : ''
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className={classNames('inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide', actionTone)}>
            <Bars3BottomLeftIcon className="h-4 w-4" aria-hidden="true" />
            {event.action}
          </span>
          <span className={classNames('inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide', severityTone)}>
            <BoltIcon className="h-4 w-4" aria-hidden="true" />
            {event.severity}
          </span>
        </div>
        <span className="text-xs text-slate-400">{formatRelativeTime(event.occurredAt)}</span>
      </div>
      <div className="flex flex-col gap-2 text-sm text-slate-600">
        <p className="font-semibold text-slate-900">{event.resource}</p>
        <p>{event.description}</p>
      </div>
      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1">
          <UserCircleIcon className="h-4 w-4" aria-hidden="true" />
          {event.actor}
        </span>
        <span className="inline-flex items-center gap-1">
          <ClockIcon className="h-4 w-4" aria-hidden="true" />
          {formatDateLabel(event.occurredAt, { includeTime: true })}
        </span>
        <span>{event.location}</span>
        <span>{event.device}</span>
      </div>
    </button>
  );
}

EventRow.propTypes = {
  event: PropTypes.shape({
    id: PropTypes.string.isRequired,
    action: PropTypes.string.isRequired,
    resource: PropTypes.string,
    actor: PropTypes.string,
    severity: PropTypes.string,
    occurredAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
    location: PropTypes.string,
    device: PropTypes.string,
    description: PropTypes.string,
  }).isRequired,
  onSelect: PropTypes.func.isRequired,
  active: PropTypes.bool,
};

function EventDetail({ event, onExport }) {
  const severityTone = SEVERITY_TONES[event.severity] ?? SEVERITY_TONES.low;
  const actionTone = ACTION_TONES[event.action] ?? 'bg-slate-100 text-slate-600 border-slate-200';

  return (
    <aside className="space-y-5 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Event detail</p>
          <h3 className="text-xl font-semibold text-slate-900">{event.resource}</h3>
          <div className="flex flex-wrap items-center gap-2">
            <span className={classNames('inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide', actionTone)}>
              <SparklesIcon className="h-4 w-4" aria-hidden="true" />
              {event.action}
            </span>
            <span className={classNames('inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide', severityTone)}>
              <ShieldExclamationIcon className="h-4 w-4" aria-hidden="true" />
              {event.severity}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onExport?.(event)}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500 transition hover:border-blue-200 hover:text-blue-600"
        >
          <ArrowDownTrayIcon className="h-4 w-4" aria-hidden="true" /> Export JSON
        </button>
      </div>
      <dl className="grid gap-4 text-sm text-slate-600">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Actor</dt>
          <dd className="mt-1">{event.actor}</dd>
        </div>
        <div className="grid gap-2 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{formatDateLabel(event.occurredAt, { includeTime: true })}</span>
            <span>{event.location}</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span>Device: {event.device}</span>
            <span>IP: {event.ipAddress}</span>
          </div>
        </div>
        {event.metadata ? (
          <div className="space-y-2">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Context</dt>
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
              <pre className="whitespace-pre-wrap break-words text-xs text-slate-600">{JSON.stringify(event.metadata, null, 2)}</pre>
            </div>
          </div>
        ) : null}
      </dl>
      <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 text-xs text-blue-700">
        <p className="font-semibold uppercase tracking-wide">Recommended follow-up</p>
        <p className="mt-2 text-sm">Trigger an incident review if similar high-severity events recur more than twice within 24 hours.</p>
      </div>
    </aside>
  );
}

EventDetail.propTypes = {
  event: PropTypes.shape({
    id: PropTypes.string.isRequired,
    action: PropTypes.string.isRequired,
    resource: PropTypes.string,
    actor: PropTypes.string,
    severity: PropTypes.string,
    occurredAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
    location: PropTypes.string,
    device: PropTypes.string,
    description: PropTypes.string,
    ipAddress: PropTypes.string,
    metadata: PropTypes.object,
  }).isRequired,
  onExport: PropTypes.func,
};

export default function AuditLogViewer({
  data = FALLBACK_LOG,
  loading,
  error,
  onRefresh,
  onExportEvent,
}) {
  const [search, setSearch] = useState('');
  const [activeSeverity, setActiveSeverity] = useState('all');
  const [activeAction, setActiveAction] = useState('all');
  const [selectedEventId, setSelectedEventId] = useState(data.events?.[0]?.id ?? FALLBACK_LOG.events[0].id);

  const summary = data.summary ?? FALLBACK_LOG.summary;
  const events = data.events ?? FALLBACK_LOG.events;
  const filters = data.filters ?? FALLBACK_LOG.filters;

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchSeverity = activeSeverity === 'all' || event.severity === activeSeverity;
      const matchAction = activeAction === 'all' || event.action === activeAction;
      const matchSearch = search
        ? [event.resource, event.actor, event.description, event.ipAddress]
            .filter(Boolean)
            .some((field) => field.toLowerCase().includes(search.toLowerCase()))
        : true;
      return matchSeverity && matchAction && matchSearch;
    });
  }, [events, activeSeverity, activeAction, search]);

  const selectedEvent = useMemo(
    () => filteredEvents.find((event) => event.id === selectedEventId) ?? filteredEvents[0] ?? events[0],
    [filteredEvents, selectedEventId, events]
  );

  return (
    <section className="space-y-8 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-soft">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">Audit log</p>
          <h2 className="text-2xl font-semibold text-slate-900">Enterprise-grade visibility across every action</h2>
          <p className="mt-2 text-sm text-slate-500">Monitor login attempts, permission changes, and payout overrides with real-time severity insights.</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-xs text-slate-500">
          <p className="font-semibold text-slate-600">{summary.totalEvents} events indexed</p>
          <p>Last 24h: {summary.last24h}</p>
        </div>
      </header>

      <DataStatus
        loading={loading}
        error={error}
        lastUpdated={summary.updatedAt}
        fromCache={data.fromCache}
        onRefresh={onRefresh}
        statusLabel="Audit telemetry"
      >
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard value={summary.totalEvents} label="Events tracked" />
          <MetricCard value={summary.criticalEvents} label="Critical" tone="border-rose-200 bg-rose-50 text-rose-600" />
          <MetricCard value={summary.actors} label="Active actors" />
          <MetricCard value={summary.last24h} label="Last 24 hours" tone="border-blue-200 bg-blue-50 text-blue-700" />
        </div>

        <div className="grid gap-4 lg:grid-cols-[2.2fr,1fr]">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <FilterChip
                active={activeSeverity === 'all'}
                label="All severities"
                onClick={() => setActiveSeverity('all')}
                icon={<FunnelIcon className="h-4 w-4" aria-hidden="true" />}
              />
              {filters.severities?.map((severity) => (
                <FilterChip
                  key={severity}
                  active={activeSeverity === severity}
                  label={severity}
                  onClick={() => setActiveSeverity(severity)}
                  icon={<ExclamationTriangleIcon className="h-4 w-4" aria-hidden="true" />}
                />
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <FilterChip
                active={activeAction === 'all'}
                label="All actions"
                onClick={() => setActiveAction('all')}
                icon={<SparklesIcon className="h-4 w-4" aria-hidden="true" />}
              />
              {filters.actions?.map((action) => (
                <FilterChip
                  key={action}
                  active={activeAction === action}
                  label={action}
                  onClick={() => setActiveAction(action)}
                  icon={<BoltIcon className="h-4 w-4" aria-hidden="true" />}
                />
              ))}
            </div>
            <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-slate-50/80 p-4 shadow-subtle">
              <label htmlFor="audit-search" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Search log
              </label>
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/90 px-3 py-2 shadow-subtle">
                <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
                <input
                  id="audit-search"
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search actor, IP, or description"
                  className="w-full border-none bg-transparent text-sm text-slate-600 outline-none placeholder:text-slate-400"
                />
                {search ? (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="rounded-full border border-slate-200 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400 transition hover:border-blue-200 hover:text-blue-600"
                  >
                    Clear
                  </button>
                ) : null}
              </div>
              <p className="text-xs text-slate-500">Need deeper insights? Stream these events to your SIEM via the Gigvora compliance API.</p>
            </div>
            <div className="space-y-3">
              {filteredEvents.map((event) => (
                <EventRow
                  key={event.id}
                  event={event}
                  onSelect={(item) => setSelectedEventId(item.id)}
                  active={selectedEvent?.id === event.id}
                />
              ))}
              {filteredEvents.length === 0 ? (
                <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 text-center">
                  <p className="text-sm font-semibold text-slate-600">No events match your filters.</p>
                  <p className="mt-1 text-xs text-slate-500">Try widening the time range or clearing filters to see archived records.</p>
                </div>
              ) : null}
            </div>
          </div>
          {selectedEvent ? <EventDetail event={selectedEvent} onExport={onExportEvent} /> : null}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Automation playbook</p>
              <h3 className="mt-2 text-lg font-semibold text-slate-900">Escalate high-severity activity automatically</h3>
              <p className="mt-2 text-sm text-slate-500">Route suspicious actions to Slack, PagerDuty, or Jira in real time with conditional policies.</p>
            </div>
            <button
              type="button"
              onClick={() => onExportEvent?.({ type: 'playbook' })}
              className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500"
            >
              <ArrowPathIcon className="h-4 w-4" aria-hidden="true" />
              Generate policy
            </button>
          </div>
        </div>
      </DataStatus>
    </section>
  );
}

AuditLogViewer.propTypes = {
  data: PropTypes.shape({
    summary: PropTypes.shape({
      totalEvents: PropTypes.number,
      criticalEvents: PropTypes.number,
      actors: PropTypes.number,
      last24h: PropTypes.number,
      updatedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
    }),
    filters: PropTypes.shape({
      severities: PropTypes.arrayOf(PropTypes.string),
      actions: PropTypes.arrayOf(PropTypes.string),
    }),
    events: PropTypes.arrayOf(EventRow.propTypes.event),
    fromCache: PropTypes.bool,
  }),
  loading: PropTypes.bool,
  error: PropTypes.shape({
    message: PropTypes.string,
  }),
  onRefresh: PropTypes.func,
  onExportEvent: PropTypes.func,
};

AuditLogViewer.defaultProps = {
  onExportEvent: () => {},
};
