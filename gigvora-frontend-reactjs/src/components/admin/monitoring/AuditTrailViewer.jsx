import { useEffect, useMemo, useState } from 'react';
import {
  AdjustmentsHorizontalIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  BookmarkIcon,
  CheckBadgeIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  TagIcon,
} from '@heroicons/react/24/outline';
import classNames from '../../../utils/classNames.js';

const severityTone = {
  critical: 'border-rose-200 bg-rose-50 text-rose-700',
  high: 'border-amber-200 bg-amber-50 text-amber-700',
  medium: 'border-sky-200 bg-sky-50 text-sky-700',
  low: 'border-emerald-200 bg-emerald-50 text-emerald-700',
};

const severityBadgeTone = {
  critical: 'bg-rose-500/10 text-rose-600 ring-1 ring-inset ring-rose-200',
  high: 'bg-amber-500/10 text-amber-600 ring-1 ring-inset ring-amber-200',
  medium: 'bg-sky-500/10 text-sky-600 ring-1 ring-inset ring-sky-200',
  low: 'bg-emerald-500/10 text-emerald-600 ring-1 ring-inset ring-emerald-200',
  info: 'bg-slate-500/10 text-slate-600 ring-1 ring-inset ring-slate-200',
};

function formatDateTime(timestamp) {
  if (!timestamp) {
    return { date: '—', time: '' };
  }
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return { date: '—', time: '' };
  }
  return {
    date: date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }),
    time: date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
  };
}

function TimelineEvent({ event }) {
  const { date, time } = formatDateTime(event.occurredAt);
  const tone = severityTone[event.severity] ?? severityTone.low;

  return (
    <div className={classNames('relative rounded-2xl border p-4 text-sm shadow-sm transition hover:-translate-y-0.5 hover:shadow-md', tone)}>
      <div className="absolute -left-3 top-5 h-6 w-6 rounded-full border-2 border-white bg-slate-900" aria-hidden="true" />
      <div className="flex flex-col gap-1">
        <p className="font-semibold">{event.title ?? event.action}</p>
        <p className="text-xs uppercase tracking-wide">{date} · {time}</p>
        <p className="leading-relaxed">{event.description ?? 'No event narrative provided.'}</p>
      </div>
    </div>
  );
}

function SeverityFilter({ option, active, onSelect }) {
  const tone = severityBadgeTone[option.value] ?? severityBadgeTone.info;
  return (
    <button
      type="button"
      onClick={() => onSelect?.(option.value)}
      className={classNames(
        'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold transition',
        active ? classNames(tone, 'shadow-sm') : 'border border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700',
      )}
    >
      <span className="inline-flex h-2 w-2 rounded-full bg-current" aria-hidden="true" />
      {option.label}
    </button>
  );
}

function ActionFilterPill({ option, active, onToggle }) {
  return (
    <button
      type="button"
      onClick={() => onToggle?.(option.value)}
      className={classNames(
        'rounded-full border px-3 py-1 text-xs font-semibold transition',
        active ? 'border-indigo-400 bg-indigo-500/10 text-indigo-600 shadow-sm' : 'border-slate-200 bg-white text-slate-500 hover:border-indigo-300 hover:text-indigo-600',
      )}
    >
      {option.label}
    </button>
  );
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-600">
      <ShieldCheckIcon className="mx-auto h-10 w-10 text-slate-400" aria-hidden="true" />
      <p className="mt-3 text-base font-semibold text-slate-800">No audit entries in this window</p>
      <p className="mt-2">
        Adjust filters or widen the date range. When compliance events fire, they will appear here with severity badges and downloadable evidence.
      </p>
    </div>
  );
}

function AuditTable({ rows, onBookmarkToggle, bookmarks = new Set() }) {
  if (!rows.length) {
    return <EmptyState />;
  }
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="sticky top-0 z-10 bg-white text-xs uppercase tracking-wide text-slate-500 shadow-sm">
          <tr>
            <th scope="col" className="px-4 py-3 text-left font-semibold">Event</th>
            <th scope="col" className="px-4 py-3 text-left font-semibold">Actor</th>
            <th scope="col" className="px-4 py-3 text-left font-semibold">Surface</th>
            <th scope="col" className="px-4 py-3 text-left font-semibold">Severity</th>
            <th scope="col" className="px-4 py-3 text-left font-semibold">Timestamp</th>
            <th scope="col" className="px-4 py-3 text-right font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {rows.map((row) => {
            const { date, time } = formatDateTime(row.occurredAt);
            const badgeTone = severityBadgeTone[row.severity] ?? severityBadgeTone.info;
            const rowIdentifier = row.id ?? row.eventId ?? `${row.action}-${row.occurredAt}`;
            const isBookmarked = bookmarks.has(rowIdentifier);
            return (
              <tr key={rowIdentifier} className="hover:bg-slate-50">
                <td className="max-w-md px-4 py-3">
                  <p className="font-semibold text-slate-800">{row.action}</p>
                  <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">{row.eventId ?? '—'}</p>
                  <p className="mt-1 text-sm text-slate-600">{row.description ?? 'No description provided.'}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-800">{row.actor?.name ?? 'System'}</p>
                  <p className="text-xs text-slate-500">{row.actor?.role ?? row.actor?.email ?? 'Automated'}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-800">{row.surface ?? row.platform ?? '—'}</p>
                  {row.ipAddress ? <p className="text-xs text-slate-500">IP {row.ipAddress}</p> : null}
                </td>
                <td className="px-4 py-3">
                  <span className={classNames('inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold', badgeTone)}>
                    <ExclamationTriangleIcon className="h-4 w-4" aria-hidden="true" />
                    {row.severity ?? 'info'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  <p className="font-semibold text-slate-800">{date}</p>
                  <p className="text-xs text-slate-500">{time}</p>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onBookmarkToggle?.(row, rowIdentifier)}
                      className={classNames(
                        'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold transition',
                        isBookmarked
                          ? 'border-indigo-400 bg-indigo-500/10 text-indigo-600'
                          : 'border-slate-200 bg-white text-slate-500 hover:border-indigo-300 hover:text-indigo-600',
                      )}
                    >
                      <BookmarkIcon className="h-4 w-4" aria-hidden="true" />
                      {isBookmarked ? 'Saved' : 'Bookmark'}
                    </button>
                    {row.evidenceUrl ? (
                      <a
                        href={row.evidenceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-indigo-300 hover:text-indigo-600"
                      >
                        <ArrowDownTrayIcon className="h-4 w-4" aria-hidden="true" />
                        Evidence
                      </a>
                    ) : null}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function computeSummary(events) {
  const total = events.length;
  const critical = events.filter((event) => event.severity === 'critical').length;
  const automated = events.filter((event) => event.actor?.type === 'system').length;
  return [
    {
      id: 'total',
      label: 'Logged events',
      value: total,
      icon: ShieldCheckIcon,
      accent: 'from-slate-900 to-slate-700',
    },
    {
      id: 'critical',
      label: 'Critical incidents',
      value: critical,
      icon: ExclamationTriangleIcon,
      accent: 'from-rose-500 to-rose-600',
    },
    {
      id: 'automated',
      label: 'Automations',
      value: automated,
      icon: TagIcon,
      accent: 'from-indigo-500 to-indigo-600',
    },
  ];
}

function SummaryTile({ tile }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <span className={classNames('inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-inner', tile.accent)}>
          <tile.icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{tile.label}</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{tile.value}</p>
        </div>
      </div>
    </div>
  );
}

export default function AuditTrailViewer({
  events = [],
  severities = [
    { value: 'all', label: 'All severities' },
    { value: 'critical', label: 'Critical' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' },
  ],
  actions = [],
  selectedSeverity = 'all',
  selectedActions = [],
  onSeverityChange,
  onActionChange,
  searchTerm = '',
  onSearchTermChange,
  onRefresh,
  onExport,
  loading = false,
  onBookmarkToggle,
  bookmarkedEventIds = [],
  pageSize = 40,
}) {
  const bookmarkSet = useMemo(() => new Set(bookmarkedEventIds), [bookmarkedEventIds]);
  const [expanded, setExpanded] = useState(false);
  const [localSeverity, setLocalSeverity] = useState(selectedSeverity);
  const [localActions, setLocalActions] = useState(selectedActions);
  const [localSearch, setLocalSearch] = useState(searchTerm);

  useEffect(() => {
    if (onSeverityChange) {
      setLocalSeverity(selectedSeverity);
    }
  }, [selectedSeverity, onSeverityChange]);

  useEffect(() => {
    if (onActionChange) {
      setLocalActions(selectedActions);
    }
  }, [selectedActions, onActionChange]);

  useEffect(() => {
    if (onSearchTermChange) {
      setLocalSearch(searchTerm);
    }
  }, [searchTerm, onSearchTermChange]);

  const severityValue = onSeverityChange ? selectedSeverity : localSeverity;
  const actionValues = onActionChange ? selectedActions : localActions;
  const searchValue = onSearchTermChange ? searchTerm : localSearch;

  const handleSeverityChange = (value) => {
    if (!onSeverityChange) {
      setLocalSeverity(value);
    }
    onSeverityChange?.(value);
  };

  const handleActionChange = (value) => {
    const current = actionValues ?? [];
    const exists = current.includes(value);
    const next = exists ? current.filter((item) => item !== value) : [...current, value];
    if (!onActionChange) {
      setLocalActions(next);
    }
    onActionChange?.(next, value);
  };

  const handleSearchChange = (value) => {
    if (!onSearchTermChange) {
      setLocalSearch(value);
    }
    onSearchTermChange?.(value);
  };

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      if (severityValue !== 'all' && event.severity !== severityValue) {
        return false;
      }
      if ((actionValues?.length ?? 0) && !actionValues.includes(event.action)) {
        return false;
      }
      if (searchValue) {
        const haystack = `${event.action ?? ''} ${event.description ?? ''} ${event.actor?.name ?? ''}`.toLowerCase();
        if (!haystack.includes(searchValue.toLowerCase())) {
          return false;
        }
      }
      return true;
    });
  }, [events, severityValue, actionValues, searchValue]);

  const visibleEvents = expanded ? filteredEvents : filteredEvents.slice(0, pageSize);
  const timelineEvents = filteredEvents.slice(0, 5);
  const summaryTiles = useMemo(() => computeSummary(filteredEvents), [filteredEvents]);

  return (
    <div className="space-y-8">
      <header className="rounded-3xl border border-slate-200 bg-slate-900 p-8 text-white shadow-xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-slate-400">Audit trail</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">Compliance-grade observability</h2>
            <p className="mt-3 max-w-2xl text-sm text-slate-200">
              Investigate every administrative change, security action, or governance decision with luxury-grade evidence trails, inline bookmarks, and export-ready packets.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/10 px-5 py-2 text-sm font-semibold transition hover:bg-white hover:text-slate-900"
            >
              <ArrowPathIcon className={classNames('h-4 w-4', loading ? 'animate-spin' : '')} aria-hidden="true" />
              Refresh now
            </button>
            <button
              type="button"
              onClick={onExport}
              className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/10 px-5 py-2 text-sm font-semibold transition hover:bg-white hover:text-slate-900"
            >
              <ArrowDownTrayIcon className="h-4 w-4" aria-hidden="true" />
              Export ledger
            </button>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-slate-300">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
            <CheckBadgeIcon className="h-4 w-4" aria-hidden="true" />
            Evidence certified snapshots
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
            <ClockIcon className="h-4 w-4" aria-hidden="true" />
            Real-time ingestion
          </div>
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-3">
        {summaryTiles.map((tile) => (
          <SummaryTile key={tile.id} tile={tile} />
        ))}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <FunnelIcon className="h-5 w-5 text-slate-500" aria-hidden="true" />
            <span className="text-sm font-semibold text-slate-700">Active filters</span>
            <div className="flex flex-wrap gap-2">
              {severities.map((option) => (
                <SeverityFilter
                  key={option.value}
                  option={option}
                  active={option.value === severityValue}
                  onSelect={handleSeverityChange}
                />
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-500 focus-within:border-indigo-300 focus-within:text-slate-700">
            <MagnifyingGlassIcon className="h-4 w-4" aria-hidden="true" />
            <input
              type="search"
              placeholder="Search by actor, action, or context"
              value={searchValue}
              onChange={(event) => handleSearchChange(event.target.value)}
              className="w-64 border-0 bg-transparent text-sm font-medium text-slate-700 placeholder-slate-400 focus:outline-none"
            />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <AdjustmentsHorizontalIcon className="h-4 w-4 text-slate-400" aria-hidden="true" />
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Action filters</span>
          <div className="flex flex-wrap gap-2">
            {actions.length === 0 ? (
              <span className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-500">All actions</span>
            ) : (
              actions.map((option) => (
                <ActionFilterPill
                  key={option.value}
                  option={option}
                  active={actionValues.includes(option.value)}
                  onToggle={handleActionChange}
                />
              ))
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <AuditTable rows={visibleEvents} onBookmarkToggle={onBookmarkToggle} bookmarks={bookmarkSet} />
          {filteredEvents.length > pageSize ? (
            <button
              type="button"
              onClick={() => setExpanded((previous) => !previous)}
              className="mx-auto flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-indigo-300 hover:text-indigo-600"
            >
              {expanded ? 'Collapse view' : `Load ${filteredEvents.length - visibleEvents.length} more events`}
            </button>
          ) : null}
        </div>
        <aside className="space-y-4 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-rose-500" aria-hidden="true" />
            <p className="text-sm font-semibold text-slate-700">Recent criticals</p>
          </div>
          <div className="space-y-3">
            {timelineEvents.length === 0 ? (
              <p className="text-sm text-slate-500">No critical activity detected. Security posture stable.</p>
            ) : (
              timelineEvents.map((event) => (
                <TimelineEvent key={event.id ?? event.eventId ?? event.occurredAt} event={event} />
              ))
            )}
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
            <p className="font-semibold text-slate-700">Playbooks</p>
            <p className="mt-1">Attach remediation runbooks to recurring events so responders know what to do. Use the bookmark action to build curated war rooms.</p>
          </div>
        </aside>
      </section>
    </div>
  );
}
