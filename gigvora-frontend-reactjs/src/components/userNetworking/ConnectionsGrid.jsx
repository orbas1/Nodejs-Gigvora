import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import classNames from '../../utils/classNames.js';
import { formatRelativeTime } from '../../utils/date.js';
import PeopleSearchBar from './PeopleSearchBar.jsx';
import { formatStatusLabel, resolveConnectionName, resolveSessionLabel } from './utils.js';

const BULK_OPTIONS = [
  { value: 'following', label: 'Mark as following' },
  { value: 'connected', label: 'Mark as connected' },
  { value: 'archived', label: 'Archive' },
];

function SummaryCard({ label, value, hint, tone }) {
  const toneClasses =
    tone === 'positive'
      ? 'border-emerald-200 bg-emerald-50'
      : tone === 'warning'
        ? 'border-amber-200 bg-amber-50'
        : 'border-slate-200 bg-white';

  return (
    <div
      className={classNames(
        'flex flex-col gap-1 rounded-3xl border p-4 shadow-sm transition hover:-translate-y-0.5',
        toneClasses,
      )}
    >
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <span className="text-2xl font-semibold text-slate-900">{value}</span>
      {hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
    </div>
  );
}

SummaryCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  hint: PropTypes.node,
  tone: PropTypes.oneOf(['neutral', 'positive', 'warning']),
};

SummaryCard.defaultProps = {
  hint: null,
  tone: 'neutral',
};

function initialsFromName(name) {
  if (!name) return '•';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) {
    return name.charAt(0).toUpperCase();
  }
  const first = parts[0].charAt(0);
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
  return `${first}${last}`.toUpperCase();
}

function ConnectionCard({ connection, selected, onToggle, onOpen, onEdit }) {
  const name = resolveConnectionName(connection);
  const headline = connection.connectionHeadline ?? '';
  const company = connection.connectionCompany ?? '';
  const email = connection.connectionEmail ?? connection.contact?.email ?? '';
  const sessionLabel = connection.sessionId
    ? resolveSessionLabel(connection.session, connection.sessionId)
    : connection.session?.title ?? '';
  const tags = Array.isArray(connection.tags) ? connection.tags : [];
  const connectedAt = connection.connectedAt ? formatRelativeTime(connection.connectedAt) : 'Not recorded';
  const lastContact = connection.lastContactedAt ? formatRelativeTime(connection.lastContactedAt) : 'No follow-up yet';

  return (
    <article className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-start gap-4">
        <button
          type="button"
          onClick={() => onToggle(connection.id)}
          className={classNames(
            'mt-1 inline-flex h-5 w-5 items-center justify-center rounded border transition focus:outline-none focus:ring-2 focus:ring-offset-2',
            selected
              ? 'border-slate-900 bg-slate-900 text-white focus:ring-slate-300'
              : 'border-slate-300 bg-white text-slate-500 hover:bg-slate-100 focus:ring-slate-200',
          )}
          aria-label={selected ? `Deselect ${name}` : `Select ${name}`}
        >
          {selected ? '✓' : ''}
        </button>
        <div className="flex flex-1 items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-sm font-semibold text-slate-600">
              {initialsFromName(name)}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-base font-semibold text-slate-900">{name}</p>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                  {formatStatusLabel(connection.followStatus)}
                </span>
              </div>
              {headline ? <p className="text-sm text-slate-500">{headline}</p> : null}
              {company ? <p className="text-xs text-slate-400">{company}</p> : null}
            </div>
          </div>
          <div className="text-right text-xs text-slate-500">
            <p>Added {connectedAt}</p>
            <p>Last contact {lastContact}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 text-xs text-slate-600 md:grid-cols-2">
        <div>
          <span className="block font-semibold text-slate-500">Email</span>
          <span className="break-all text-slate-700">{email || '—'}</span>
        </div>
        <div>
          <span className="block font-semibold text-slate-500">Session</span>
          <span className="text-slate-700">{sessionLabel || '—'}</span>
        </div>
        <div>
          <span className="block font-semibold text-slate-500">Notes</span>
          <span className="text-slate-700">{connection.notes ? connection.notes.slice(0, 120) : '—'}</span>
        </div>
        <div>
          <span className="block font-semibold text-slate-500">Tags</span>
          {tags.length ? (
            <div className="mt-1 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span key={tag} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                  {tag}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-slate-400">—</span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-200"
          onClick={() => onOpen?.(connection)}
        >
          View details
        </button>
        <button
          type="button"
          className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
          onClick={() => onEdit?.(connection)}
        >
          Edit connection
        </button>
      </div>
    </article>
  );
}

ConnectionCard.propTypes = {
  connection: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    connectionName: PropTypes.string,
    connectionHeadline: PropTypes.string,
    connectionCompany: PropTypes.string,
    connectionEmail: PropTypes.string,
    followStatus: PropTypes.string,
    connectedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    lastContactedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    notes: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string),
    sessionId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    session: PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      title: PropTypes.string,
    }),
    contact: PropTypes.shape({
      email: PropTypes.string,
      firstName: PropTypes.string,
      lastName: PropTypes.string,
    }),
  }).isRequired,
  selected: PropTypes.bool,
  onToggle: PropTypes.func.isRequired,
  onOpen: PropTypes.func,
  onEdit: PropTypes.func,
};

ConnectionCard.defaultProps = {
  selected: false,
  onOpen: undefined,
  onEdit: undefined,
};

function computeMetrics(connections) {
  const followStatusCounts = {};
  const tagSet = new Set();
  const sessionMap = new Map();
  const now = Date.now();
  const thirtyDays = 1000 * 60 * 60 * 24 * 30;
  const sixtyDays = 1000 * 60 * 60 * 24 * 60;
  let recentCount = 0;
  let staleCount = 0;
  let untouchedCount = 0;

  connections.forEach((connection) => {
    const status = connection.followStatus ?? 'unknown';
    followStatusCounts[status] = (followStatusCounts[status] ?? 0) + 1;

    const tags = Array.isArray(connection.tags) ? connection.tags : [];
    tags.forEach((tag) => tagSet.add(String(tag).toLowerCase()));

    const sessionId = connection.sessionId ?? connection.session?.id;
    if (sessionId != null) {
      sessionMap.set(String(sessionId), {
        id: sessionId,
        label: resolveSessionLabel(connection.session, sessionId),
      });
    }

    const connectedAt = connection.connectedAt ? new Date(connection.connectedAt) : null;
    if (connectedAt && !Number.isNaN(connectedAt.getTime()) && now - connectedAt.getTime() <= thirtyDays) {
      recentCount += 1;
    }

    const lastContactedAt = connection.lastContactedAt ? new Date(connection.lastContactedAt) : null;
    if (!lastContactedAt || Number.isNaN(lastContactedAt.getTime())) {
      untouchedCount += 1;
    } else if (now - lastContactedAt.getTime() > sixtyDays) {
      staleCount += 1;
    }
  });

  return {
    total: connections.length,
    followStatusCounts,
    tags: Array.from(tagSet),
    sessions: Array.from(sessionMap.values()),
    insights: {
      recentCount,
      staleCount,
      untouchedCount,
    },
  };
}

function normalizeString(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase();
}

function matchesFilters(connection, filters) {
  const followStatus = connection.followStatus ?? 'unknown';
  if (filters.followStatus !== 'all' && filters.followStatus !== followStatus) {
    return false;
  }

  if (filters.sessionId !== 'all') {
    const sessionId = connection.sessionId ?? connection.session?.id;
    if (sessionId == null || String(sessionId) !== String(filters.sessionId)) {
      return false;
    }
  }

  const normalizedTags = new Set((connection.tags ?? []).map((tag) => normalizeString(tag)));
  for (const tag of filters.tags ?? []) {
    if (!normalizedTags.has(normalizeString(tag))) {
      return false;
    }
  }

  const query = normalizeString(filters.query);
  if (query) {
    const haystack = [
      resolveConnectionName(connection),
      connection.connectionHeadline,
      connection.connectionCompany,
      connection.connectionEmail,
      connection.notes,
      connection.contact?.email,
      connection.contact?.firstName,
      connection.contact?.lastName,
      connection.session ? resolveSessionLabel(connection.session, connection.sessionId ?? connection.session?.id) : '',
      ...(Array.isArray(connection.tags) ? connection.tags : []),
    ]
      .map((entry) => normalizeString(entry))
      .join(' ');
    if (!haystack.includes(query)) {
      return false;
    }
  }

  return true;
}

function sortConnections(connections) {
  return [...connections].sort((a, b) => {
    const dateA = a.connectedAt ? new Date(a.connectedAt).getTime() : 0;
    const dateB = b.connectedAt ? new Date(b.connectedAt).getTime() : 0;
    if (dateA === dateB) {
      return String(resolveConnectionName(a)).localeCompare(resolveConnectionName(b));
    }
    return dateB - dateA;
  });
}

export default function ConnectionsGrid({
  connections,
  sessions,
  loading,
  onRefresh,
  onOpenConnection,
  onEditConnection,
  onBulkUpdateFollowStatus,
}) {
  const [filters, setFilters] = useState({ query: '', followStatus: 'all', sessionId: 'all', tags: [] });
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  const metrics = useMemo(() => computeMetrics(connections), [connections]);
  const availableSessions = useMemo(() => {
    const combined = new Map();
    (sessions ?? []).forEach((session) => {
      if (!session || session.id == null) return;
      const label = session.label ?? resolveSessionLabel(session, session.id);
      combined.set(String(session.id), { id: session.id, label });
    });
    metrics.sessions.forEach((session) => {
      combined.set(String(session.id), session);
    });
    return Array.from(combined.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [metrics.sessions, sessions]);

  const filteredConnections = useMemo(() => {
    const filtered = connections.filter((connection) => matchesFilters(connection, filters));
    return sortConnections(filtered);
  }, [connections, filters]);

  const availableIds = useMemo(() => new Set(connections.map((connection) => String(connection.id))), [connections]);

  useEffect(() => {
    setSelectedIds((current) => {
      if (!current.size) {
        return current;
      }
      const next = new Set();
      current.forEach((id) => {
        if (availableIds.has(id)) {
          next.add(id);
        }
      });
      return next;
    });
  }, [availableIds]);

  const toggleSelection = useCallback((connectionId) => {
    const key = String(connectionId);
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelectedIds((current) => {
      const allVisible = filteredConnections.map((connection) => String(connection.id));
      const everySelected = allVisible.every((id) => current.has(id));
      if (everySelected) {
        return new Set();
      }
      return new Set(allVisible);
    });
  }, [filteredConnections]);

  const handleBulkUpdate = useCallback(
    async (status) => {
      if (!onBulkUpdateFollowStatus || !selectedIds.size) {
        return;
      }
      setBulkBusy(true);
      try {
        await onBulkUpdateFollowStatus(Array.from(selectedIds), status);
        setSelectedIds(new Set());
      } finally {
        setBulkBusy(false);
      }
    },
    [onBulkUpdateFollowStatus, selectedIds],
  );

  const selectionCount = selectedIds.size;
  const connectedCount = metrics.followStatusCounts.connected ?? 0;
  const connectedRatio = metrics.total ? `${Math.round((connectedCount / metrics.total) * 100)}%` : '0%';

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Total" value={metrics.total} hint={`${filteredConnections.length} shown`} tone="neutral" />
        <SummaryCard
          label="Connected"
          value={connectedCount}
          hint={`${connectedRatio} of network`}
          tone="positive"
        />
        <SummaryCard
          label="Needs follow-up"
          value={metrics.insights.staleCount}
          hint="Last contact > 60 days"
          tone={metrics.insights.staleCount ? 'warning' : 'neutral'}
        />
        <SummaryCard
          label="Awaiting outreach"
          value={metrics.insights.untouchedCount}
          hint="No contact recorded"
          tone={metrics.insights.untouchedCount ? 'warning' : 'neutral'}
        />
      </div>

      <PeopleSearchBar
        value={filters}
        onChange={setFilters}
        metrics={{ total: metrics.total, followStatusCounts: metrics.followStatusCounts }}
        availableSessions={availableSessions}
        availableTags={metrics.tags}
      />

      {selectionCount ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">{selectionCount} selected</span>
            <button
              type="button"
              className="text-xs font-semibold text-slate-600 underline"
              onClick={() => setSelectedIds(new Set())}
            >
              Clear
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {BULK_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleBulkUpdate(option.value)}
                className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:cursor-not-allowed disabled:bg-slate-500"
                disabled={bulkBusy}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <span>{filteredConnections.length} of {connections.length} connections</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-full border border-slate-200 bg-white px-3 py-1 font-semibold text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-200"
            onClick={toggleAll}
          >
            {selectionCount === filteredConnections.length && selectionCount ? 'Deselect all' : 'Select all'}
          </button>
          {onRefresh ? (
            <button
              type="button"
              className="rounded-full border border-slate-200 bg-white px-3 py-1 font-semibold text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-200"
              onClick={onRefresh}
            >
              Refresh
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {loading
          ? Array.from({ length: Math.max(1, filteredConnections.length || 4) }).map((_, index) => (
              <div
                // eslint-disable-next-line react/no-array-index-key
                key={index}
                className="h-48 animate-pulse rounded-3xl border border-slate-200 bg-slate-100"
              />
            ))
          : filteredConnections.length
            ? filteredConnections.map((connection) => (
                <ConnectionCard
                  key={connection.id}
                  connection={connection}
                  selected={selectedIds.has(String(connection.id))}
                  onToggle={toggleSelection}
                  onOpen={onOpenConnection}
                  onEdit={onEditConnection}
                />
              ))
            : (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/60 p-12 text-center text-sm text-slate-500">
                No connections match the filters yet. Adjust your filters or add a new contact.
              </div>
            )}
      </div>
    </div>
  );
}

ConnectionsGrid.propTypes = {
  connections: PropTypes.arrayOf(ConnectionCard.propTypes.connection).isRequired,
  sessions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string,
      title: PropTypes.string,
    }),
  ),
  loading: PropTypes.bool,
  onRefresh: PropTypes.func,
  onOpenConnection: PropTypes.func,
  onEditConnection: PropTypes.func,
  onBulkUpdateFollowStatus: PropTypes.func,
};

ConnectionsGrid.defaultProps = {
  sessions: undefined,
  loading: false,
  onRefresh: undefined,
  onOpenConnection: undefined,
  onEditConnection: undefined,
  onBulkUpdateFollowStatus: undefined,
};
