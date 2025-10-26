import { useMemo } from 'react';
import PropTypes from 'prop-types';
import classNames from '../../utils/classNames.js';

const FOLLOW_STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'saved', label: 'Saved' },
  { value: 'requested', label: 'Requested' },
  { value: 'following', label: 'Following' },
  { value: 'connected', label: 'Connected' },
  { value: 'archived', label: 'Archived' },
];

function MetricPill({ label, value, tone }) {
  const toneClasses =
    tone === 'positive'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
      : tone === 'warning'
        ? 'border-amber-200 bg-amber-50 text-amber-700'
        : 'border-slate-200 bg-slate-50 text-slate-600';

  return (
    <span
      className={classNames(
        'inline-flex min-w-[88px] items-center justify-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold',
        toneClasses,
      )}
    >
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </span>
  );
}

MetricPill.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  tone: PropTypes.oneOf(['neutral', 'positive', 'warning']),
};

MetricPill.defaultProps = {
  tone: 'neutral',
};

function buildFilters(value) {
  return {
    query: value?.query ?? '',
    followStatus: value?.followStatus ?? 'all',
    sessionId: value?.sessionId ?? 'all',
    tags: Array.isArray(value?.tags) ? value.tags : [],
  };
}

export default function PeopleSearchBar({
  value,
  onChange,
  metrics,
  availableSessions,
  availableTags,
  disabled,
}) {
  const filters = buildFilters(value);
  const tagSet = useMemo(() => new Set(filters.tags.map((tag) => tag.toLowerCase())), [filters.tags]);

  const followStatusCounts = metrics?.followStatusCounts ?? {};
  const totalConnections = metrics?.total ?? 0;
  const activeFilters = [filters.followStatus !== 'all', filters.sessionId !== 'all', tagSet.size > 0]
    .filter(Boolean)
    .length;

  const sessionOptions = useMemo(() => {
    const deduped = new Map();
    (availableSessions ?? []).forEach((session) => {
      if (!session || session.id == null) return;
      const label = session.label ?? `Session #${session.id}`;
      deduped.set(String(session.id), { id: session.id, label });
    });
    return Array.from(deduped.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [availableSessions]);

  const tags = useMemo(() => {
    const unique = new Set((availableTags ?? []).map((tag) => tag.toLowerCase()));
    filters.tags.forEach((tag) => unique.add(String(tag).toLowerCase()));
    return Array.from(unique)
      .map((tag) => ({ id: tag, label: tag }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [availableTags, filters.tags]);

  const emitChange = (partial) => {
    const next = { ...filters, ...partial };
    if (!Array.isArray(next.tags)) {
      next.tags = [];
    }
    onChange(next);
  };

  const toggleTag = (tag) => {
    const normalized = String(tag).toLowerCase();
    const nextTags = new Set(tagSet);
    if (nextTags.has(normalized)) {
      nextTags.delete(normalized);
    } else {
      nextTags.add(normalized);
    }
    emitChange({ tags: Array.from(nextTags) });
  };

  const handleClear = () => {
    if (!filters.query && filters.followStatus === 'all' && filters.sessionId === 'all' && !tagSet.size) {
      return;
    }
    onChange({ query: '', followStatus: 'all', sessionId: 'all', tags: [] });
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1 space-y-3">
          <label className="flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600 shadow-inner transition focus-within:border-slate-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-accent/20">
            <span className="font-semibold text-slate-500">Search</span>
            <input
              type="search"
              value={filters.query}
              onChange={(event) => emitChange({ query: event.target.value })}
              placeholder="Search names, companies, notes"
              className="w-full border-none bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
              disabled={disabled}
            />
          </label>

          <div className="flex flex-wrap gap-2">
            {FOLLOW_STATUS_OPTIONS.map((option) => {
              const isActive = option.value === filters.followStatus;
              return (
                <button
                  key={option.value}
                  type="button"
                  className={classNames(
                    'rounded-full border px-3 py-1 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2',
                    isActive
                      ? 'border-slate-900 bg-slate-900 text-white shadow-sm focus:ring-slate-300'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 focus:ring-slate-200',
                  )}
                  onClick={() => emitChange({ followStatus: option.value })}
                  disabled={disabled}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col items-start gap-2 text-xs text-slate-500 lg:items-end">
          <MetricPill label="Connections" value={totalConnections} tone="neutral" />
          <div className="flex flex-wrap gap-2">
            {Object.entries(followStatusCounts)
              .sort((a, b) => a[0].localeCompare(b[0]))
              .map(([status, count]) => (
                <MetricPill
                  key={status}
                  label={status.charAt(0).toUpperCase() + status.slice(1)}
                  value={count}
                  tone={status === 'connected' ? 'positive' : status === 'requested' ? 'warning' : 'neutral'}
                />
              ))}
            {activeFilters ? (
              <MetricPill label="Filters" value={activeFilters} tone="warning" />
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
          <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
            <span className="font-semibold text-slate-500">Session</span>
            <select
              value={filters.sessionId}
              onChange={(event) => emitChange({ sessionId: event.target.value })}
              className="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-accent/20"
              disabled={disabled}
            >
              <option value="all">All sessions</option>
              {sessionOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {tags.length ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-slate-500">Tags</span>
              {tags.map((tag) => {
                const selected = tagSet.has(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={classNames(
                      'rounded-full px-3 py-1 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2',
                      selected
                        ? 'border-slate-900 bg-slate-900 text-white shadow-sm focus:ring-slate-300'
                        : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 focus:ring-slate-200',
                    )}
                    disabled={disabled}
                  >
                    {tag.label}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={handleClear}
            disabled={disabled}
          >
            Clear filters
          </button>
        </div>
      </div>
    </div>
  );
}

PeopleSearchBar.propTypes = {
  value: PropTypes.shape({
    query: PropTypes.string,
    followStatus: PropTypes.string,
    sessionId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    tags: PropTypes.arrayOf(PropTypes.string),
  }),
  onChange: PropTypes.func.isRequired,
  metrics: PropTypes.shape({
    total: PropTypes.number,
    followStatusCounts: PropTypes.objectOf(PropTypes.number),
  }),
  availableSessions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string,
    }),
  ),
  availableTags: PropTypes.arrayOf(PropTypes.string),
  disabled: PropTypes.bool,
};

PeopleSearchBar.defaultProps = {
  value: undefined,
  metrics: undefined,
  availableSessions: undefined,
  availableTags: undefined,
  disabled: false,
};
