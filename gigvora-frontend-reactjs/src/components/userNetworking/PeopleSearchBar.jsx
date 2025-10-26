import { useMemo, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import classNames from '../../utils/classNames.js';

const STATUS_FILTERS = [
  { id: 'connected', label: 'Connected' },
  { id: 'pending', label: 'Pending' },
  { id: 'dormant', label: 'Dormant' },
  { id: 'archived', label: 'Archived' },
];

const RELATIONSHIP_FILTERS = [
  { id: 'mentor', label: 'Mentors' },
  { id: 'investor', label: 'Investors' },
  { id: 'client', label: 'Clients' },
  { id: 'talent', label: 'Talent' },
];

function TogglePill({ active, children, onClick }) {
  return (
    <button
      type="button"
      className={classNames(
        'rounded-full border px-3 py-1 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2',
        active
          ? 'border-slate-900 bg-slate-900 text-white shadow-sm focus:ring-slate-200'
          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100 focus:ring-slate-300',
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

TogglePill.propTypes = {
  active: PropTypes.bool,
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func.isRequired,
};

TogglePill.defaultProps = {
  active: false,
};

function SuggestionsList({ suggestions, onSelect }) {
  if (!suggestions.length) {
    return null;
  }

  return (
    <ul className="absolute left-0 right-0 top-full z-10 mt-2 max-h-64 overflow-y-auto rounded-3xl border border-slate-200 bg-white p-2 shadow-xl">
      {suggestions.map((suggestion) => (
        <li key={suggestion}>
          <button
            type="button"
            className="w-full rounded-2xl px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-100"
            onClick={() => onSelect(suggestion)}
          >
            {suggestion}
          </button>
        </li>
      ))}
    </ul>
  );
}

SuggestionsList.propTypes = {
  suggestions: PropTypes.arrayOf(PropTypes.string),
  onSelect: PropTypes.func.isRequired,
};

SuggestionsList.defaultProps = {
  suggestions: [],
};

function SegmentPills({ segments, activeSegmentId, onSegmentChange }) {
  if (!segments.length) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {segments.map((segment) => {
        const isActive = segment.id === activeSegmentId;
        return (
          <button
            key={segment.id}
            type="button"
            className={classNames(
              'rounded-full px-4 py-2 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2',
              isActive
                ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg focus:ring-indigo-200'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 focus:ring-slate-300',
            )}
            onClick={() => onSegmentChange(segment)}
          >
            <span>{segment.label}</span>
            {typeof segment.count === 'number' ? (
              <span className="ml-2 rounded-full bg-white/20 px-2 py-[2px] text-[10px] font-semibold text-white">
                {segment.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

SegmentPills.propTypes = {
  segments: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      count: PropTypes.number,
    }),
  ),
  activeSegmentId: PropTypes.string,
  onSegmentChange: PropTypes.func.isRequired,
};

SegmentPills.defaultProps = {
  segments: [],
  activeSegmentId: undefined,
};

function FilterSection({
  title,
  options,
  activeValues,
  onToggle,
}) {
  if (!options?.length) {
    return null;
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isActive = activeValues.includes(option.id ?? option.value ?? option);
          const label = option.label ?? option.name ?? option;
          const id = option.id ?? option.value ?? option;
          return (
            <TogglePill key={id} active={isActive} onClick={() => onToggle(id)}>
              {label}
            </TogglePill>
          );
        })}
      </div>
    </div>
  );
}

FilterSection.propTypes = {
  title: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({ id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]), label: PropTypes.string }),
    ]),
  ),
  activeValues: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
  onToggle: PropTypes.func.isRequired,
};

FilterSection.defaultProps = {
  options: [],
  activeValues: [],
};

export default function PeopleSearchBar({
  value,
  onChange,
  placeholder,
  segments,
  activeSegmentId,
  onSegmentChange,
  filters,
  onFiltersChange,
  filterOptions,
  suggestions,
  onSaveSegment,
  onRemoveSegment,
  metrics,
  isBusy,
  onVoiceSearch,
}) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [pendingSegmentName, setPendingSegmentName] = useState('');

  const filteredSuggestions = useMemo(() => {
    if (!value || !suggestions?.length) {
      return [];
    }
    const normalised = value.toLowerCase();
    return suggestions
      .filter((suggestion) => suggestion?.toLowerCase().includes(normalised))
      .slice(0, 12);
  }, [value, suggestions]);

  const handleToggleFilter = useCallback(
    (group, nextValue) => {
      const current = new Set(filters[group] ?? []);
      if (current.has(nextValue)) {
        current.delete(nextValue);
      } else {
        current.add(nextValue);
      }
      onFiltersChange({ ...filters, [group]: Array.from(current) });
    },
    [filters, onFiltersChange],
  );

  const derivedMetrics = useMemo(() => ({
    totalMatches: metrics?.totalMatches ?? 0,
    activeFilters: metrics?.activeFilters ?? Object.values(filters).reduce((sum, entries) => sum + (entries?.length ?? 0), 0),
    latency: metrics?.latency ?? 0,
  }), [metrics, filters]);

  const canSaveSegment = useMemo(() => {
    return Boolean(
      pendingSegmentName.trim() &&
        (value?.trim()?.length || Object.values(filters).some((entries) => entries?.length))
    );
  }, [filters, pendingSegmentName, value]);

  const voiceButtonLabel = onVoiceSearch ? 'Start voice search' : 'Voice search unavailable';

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative">
          <label htmlFor="people-search" className="sr-only">
            Search people
          </label>
          <div className="flex items-center rounded-full bg-slate-50 px-4 py-3 text-sm text-slate-600 shadow-inner">
            <span className="mr-3 text-slate-400">🔍</span>
            <input
              id="people-search"
              type="search"
              value={value}
              onChange={(event) => onChange(event.target.value)}
              placeholder={placeholder}
              className="flex-1 border-none bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
            />
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-slate-200 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                {derivedMetrics.totalMatches} matches
              </span>
              <span className="rounded-full bg-slate-200 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                {derivedMetrics.activeFilters} filters
              </span>
            </div>
            <button
              type="button"
              className="ml-3 flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2"
              onClick={() => setIsAdvancedOpen((open) => !open)}
            >
              {isAdvancedOpen ? '−' : '+'}
            </button>
            <button
              type="button"
              className={classNames(
                'ml-2 flex h-9 w-9 items-center justify-center rounded-full border text-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2',
                onVoiceSearch
                  ? 'border-slate-900 bg-slate-900 text-white shadow-sm hover:bg-slate-800 focus:ring-slate-200'
                  : 'border-slate-200 bg-white text-slate-400 cursor-not-allowed focus:ring-slate-300',
              )}
              onClick={onVoiceSearch ?? undefined}
              disabled={!onVoiceSearch}
              title={voiceButtonLabel}
            >
              🎙️
            </button>
          </div>
          <SuggestionsList suggestions={filteredSuggestions} onSelect={onChange} />
        </div>

        <SegmentPills
          segments={segments}
          activeSegmentId={activeSegmentId}
          onSegmentChange={(segment) => onSegmentChange(segment)}
        />

        <div className="flex flex-wrap items-center gap-3">
          {STATUS_FILTERS.map((status) => (
            <TogglePill
              key={status.id}
              active={filters.statuses?.includes(status.id)}
              onClick={() => handleToggleFilter('statuses', status.id)}
            >
              {status.label}
            </TogglePill>
          ))}

          {RELATIONSHIP_FILTERS.map((relationship) => (
            <TogglePill
              key={relationship.id}
              active={filters.relationships?.includes(relationship.id)}
              onClick={() => handleToggleFilter('relationships', relationship.id)}
            >
              {relationship.label}
            </TogglePill>
          ))}

          {filters.statuses?.length || filters.relationships?.length ? (
            <button
              type="button"
              className="ml-auto rounded-full border border-transparent bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-200 focus:ring-offset-2"
              onClick={() => onFiltersChange({ ...filters, statuses: [], relationships: [] })}
            >
              Clear quick filters
            </button>
          ) : null}
        </div>

        {isAdvancedOpen ? (
          <div className="grid gap-6 rounded-3xl bg-slate-50 p-4">
            <FilterSection
              title="Organisations"
              options={filterOptions.organisations}
              activeValues={filters.organisations ?? []}
              onToggle={(value) => handleToggleFilter('organisations', value)}
            />
            <FilterSection
              title="Industries"
              options={filterOptions.industries}
              activeValues={filters.industries ?? []}
              onToggle={(value) => handleToggleFilter('industries', value)}
            />
            <FilterSection
              title="Locations"
              options={filterOptions.locations}
              activeValues={filters.locations ?? []}
              onToggle={(value) => handleToggleFilter('locations', value)}
            />
            <FilterSection
              title="Tags"
              options={filterOptions.tags}
              activeValues={filters.tags ?? []}
              onToggle={(value) => handleToggleFilter('tags', value)}
            />
            <FilterSection
              title="Seniority"
              options={filterOptions.seniority}
              activeValues={filters.seniority ?? []}
              onToggle={(value) => handleToggleFilter('seniority', value)}
            />

            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Save current view</p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <input
                  type="text"
                  value={pendingSegmentName}
                  onChange={(event) => setPendingSegmentName(event.target.value)}
                  placeholder="Name this segment"
                  className="flex-1 rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                />
                <button
                  type="button"
                  className={classNames(
                    'rounded-full px-4 py-2 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2',
                    canSaveSegment
                      ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-sm focus:ring-indigo-200'
                      : 'cursor-not-allowed bg-slate-200 text-slate-400 focus:ring-slate-300',
                  )}
                  onClick={() => {
                    if (!canSaveSegment) {
                      return;
                    }
                    onSaveSegment({
                      id: pendingSegmentName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                      label: pendingSegmentName.trim(),
                      definition: {
                        query: value,
                        filters,
                      },
                    });
                    setPendingSegmentName('');
                  }}
                  disabled={!canSaveSegment}
                >
                  Save segment
                </button>
              </div>
              {segments.filter((segment) => segment.isCustom).length ? (
                <div className="mt-4 space-y-2 text-xs text-slate-500">
                  {segments
                    .filter((segment) => segment.isCustom)
                    .map((segment) => (
                      <div key={segment.id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2">
                        <span className="font-semibold text-slate-600">{segment.label}</span>
                        <button
                          type="button"
                          className="rounded-full border border-transparent bg-slate-900 px-3 py-1 text-[11px] font-semibold text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-200 focus:ring-offset-2"
                          onClick={() => onRemoveSegment(segment)}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {isBusy ? (
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            Syncing live results…
          </div>
        ) : null}
      </div>
    </div>
  );
}

PeopleSearchBar.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  segments: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      count: PropTypes.number,
      isCustom: PropTypes.bool,
    }),
  ),
  activeSegmentId: PropTypes.string,
  onSegmentChange: PropTypes.func.isRequired,
  filters: PropTypes.shape({
    statuses: PropTypes.arrayOf(PropTypes.string),
    relationships: PropTypes.arrayOf(PropTypes.string),
    organisations: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
    industries: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
    locations: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
    tags: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
    seniority: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
  }),
  onFiltersChange: PropTypes.func.isRequired,
  filterOptions: PropTypes.shape({
    organisations: PropTypes.array,
    industries: PropTypes.array,
    locations: PropTypes.array,
    tags: PropTypes.array,
    seniority: PropTypes.array,
  }),
  suggestions: PropTypes.arrayOf(PropTypes.string),
  onSaveSegment: PropTypes.func,
  onRemoveSegment: PropTypes.func,
  metrics: PropTypes.shape({
    totalMatches: PropTypes.number,
    activeFilters: PropTypes.number,
    latency: PropTypes.number,
  }),
  isBusy: PropTypes.bool,
  onVoiceSearch: PropTypes.func,
};

PeopleSearchBar.defaultProps = {
  value: '',
  placeholder: 'Search by name, role, organisation, or tag',
  segments: [],
  activeSegmentId: undefined,
  filters: {
    statuses: [],
    relationships: [],
    organisations: [],
    industries: [],
    locations: [],
    tags: [],
    seniority: [],
  },
  filterOptions: {
    organisations: [],
    industries: [],
    locations: [],
    tags: [],
    seniority: [],
  },
  suggestions: [],
  onSaveSegment: () => {},
  onRemoveSegment: () => {},
  metrics: undefined,
  isBusy: false,
  onVoiceSearch: null,
};
