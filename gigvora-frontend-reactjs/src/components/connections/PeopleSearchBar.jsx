import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import {
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  MicrophoneIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

const MAX_SUGGESTIONS = 6;
const MAX_FILTER_PREVIEWS = 4;

function normalise(value) {
  return (value ?? '').toString().trim().toLowerCase();
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

export default function PeopleSearchBar({
  query,
  onQueryChange,
  filters,
  onFiltersChange,
  stats,
  suggestions,
  onSuggestionSelect,
  availableFilters,
  className,
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [draftQuery, setDraftQuery] = useState(query ?? '');

  useEffect(() => {
    setDraftQuery(query ?? '');
  }, [query]);

  const trendingSuggestions = useMemo(() => {
    const normalisedDraft = normalise(draftQuery);
    const pool = suggestions.filter(Boolean);
    if (!pool.length) {
      return [];
    }
    if (!normalisedDraft) {
      return pool.slice(0, MAX_SUGGESTIONS);
    }
    const matching = pool.filter((suggestion) => normalise(suggestion).includes(normalisedDraft));
    return matching.slice(0, MAX_SUGGESTIONS);
  }, [suggestions, draftQuery]);

  const filterPreview = useMemo(() => {
    const preview = [];
    const pushPreview = (label, items) => {
      if (!items || !items.length) {
        return;
      }
      preview.push({ label, items: uniqueSorted(items).slice(0, MAX_FILTER_PREVIEWS) });
    };

    pushPreview('Focus', filters.focusAreas);
    pushPreview('Location', filters.locations);
    pushPreview('Availability', filters.availability);
    return preview;
  }, [filters]);

  const handleDraftChange = (event) => {
    const value = event.target.value;
    setDraftQuery(value);
    onQueryChange?.(value);
  };

  const toggleFilter = (field, value) => {
    const next = new Set(filters[field] ?? []);
    if (next.has(value)) {
      next.delete(value);
    } else {
      next.add(value);
    }
    onFiltersChange?.({
      ...filters,
      [field]: Array.from(next),
    });
  };

  const clearFilters = () => {
    onFiltersChange?.({ focusAreas: [], locations: [], availability: [] });
  };

  const handleSuggestionClick = (suggestion) => {
    setDraftQuery(suggestion);
    onQueryChange?.(suggestion);
    onSuggestionSelect?.(suggestion);
    setIsFocused(false);
  };

  return (
    <section className={clsx('rounded-3xl border border-slate-200 bg-white p-6 shadow-soft', className)}>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-900">Search the Gigvora network</p>
          <p className="mt-1 text-xs text-slate-500">
            Discover founders, mentors, investors, and collaborators across your extended network.
          </p>
        </div>
        {stats ? (
          <dl className="grid gap-4 text-xs text-slate-500 sm:auto-cols-max sm:grid-flow-col sm:items-center">
            <div>
              <dt className="uppercase tracking-wide">Total reach</dt>
              <dd className="mt-1 text-sm font-semibold text-slate-900">{stats.total ?? '—'}</dd>
            </div>
            <div>
              <dt className="uppercase tracking-wide">New this month</dt>
              <dd className="mt-1 text-sm font-semibold text-slate-900">{stats.newConnections ?? '—'}</dd>
            </div>
            <div>
              <dt className="uppercase tracking-wide">Response rate</dt>
              <dd className="mt-1 text-sm font-semibold text-emerald-600">{stats.responseRate ?? '—'}%</dd>
            </div>
          </dl>
        ) : null}
      </header>

      <div className="mt-6 space-y-4">
        <div
          className={clsx(
            'relative flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-inner transition focus-within:border-accent focus-within:shadow-accent/10',
            draftQuery ? 'border-accent/30 bg-white' : 'border-slate-200 bg-slate-50',
          )}
        >
          <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
          <input
            type="search"
            value={draftQuery}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 150)}
            onChange={handleDraftChange}
            placeholder="Search by name, headline, industry, or mutual connection"
            className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-full border border-transparent px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 transition hover:border-slate-200 hover:text-slate-700"
            onClick={() => onQueryChange?.(draftQuery)}
          >
            <MicrophoneIcon className="h-4 w-4" aria-hidden="true" />
            Voice
          </button>
        </div>

        {trendingSuggestions.length ? (
          <div className={clsx('grid gap-3 rounded-2xl border px-4 py-3 text-xs transition', isFocused ? 'border-accent/40 bg-accentSoft' : 'border-slate-200 bg-slate-50')}>
            <div className="flex items-center justify-between">
              <p className="font-semibold text-slate-700">Trending searches</p>
              <SparklesIcon className="h-4 w-4 text-accent" aria-hidden="true" />
            </div>
            <div className="flex flex-wrap gap-2">
              {trendingSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-white px-4 py-1.5 text-[11px] font-semibold text-accent transition hover:border-accent hover:bg-accentSoft"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <AdjustmentsHorizontalIcon className="h-4 w-4" aria-hidden="true" />
              Filters
            </div>
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400 transition hover:text-slate-600"
            >
              <ArrowPathIcon className="h-4 w-4" aria-hidden="true" />
              Reset
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {(availableFilters.focusAreas ?? []).map((focus) => {
              const isActive = filters.focusAreas.includes(focus);
              return (
                <button
                  key={`focus:${focus}`}
                  type="button"
                  onClick={() => toggleFilter('focusAreas', focus)}
                  className={clsx(
                    'inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[11px] font-semibold transition',
                    isActive
                      ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-800',
                  )}
                >
                  {focus}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-2">
            {(availableFilters.locations ?? []).map((location) => {
              const isActive = filters.locations.includes(location);
              return (
                <button
                  key={`location:${location}`}
                  type="button"
                  onClick={() => toggleFilter('locations', location)}
                  className={clsx(
                    'inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[11px] font-semibold transition',
                    isActive
                      ? 'border-sky-400 bg-sky-50 text-sky-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-800',
                  )}
                >
                  {location}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-2">
            {(availableFilters.availability ?? []).map((option) => {
              const isActive = filters.availability.includes(option);
              return (
                <button
                  key={`availability:${option}`}
                  type="button"
                  onClick={() => toggleFilter('availability', option)}
                  className={clsx(
                    'inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[11px] font-semibold transition',
                    isActive
                      ? 'border-amber-400 bg-amber-50 text-amber-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-800',
                  )}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>

        {filterPreview.length ? (
          <dl className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500 sm:grid-cols-3">
            {filterPreview.map((preview) => (
              <div key={preview.label}>
                <dt className="font-semibold uppercase tracking-wide text-slate-400">{preview.label}</dt>
                <dd className="mt-2 space-y-1">
                  {preview.items.map((item) => (
                    <div key={item} className="flex items-center gap-2 text-slate-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
                      {item}
                    </div>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>

      {stats?.lastUpdated ? (
        <footer className="mt-6 flex items-center justify-between text-[11px] uppercase tracking-wide text-slate-400">
          <span>Refreshed {stats.lastUpdated}</span>
          <span className="inline-flex items-center gap-1">
            <ChevronDownIcon className="h-3.5 w-3.5" aria-hidden="true" />
            More filters landing soon
          </span>
        </footer>
      ) : null}
    </section>
  );
}

PeopleSearchBar.propTypes = {
  query: PropTypes.string,
  onQueryChange: PropTypes.func,
  filters: PropTypes.shape({
    focusAreas: PropTypes.arrayOf(PropTypes.string),
    locations: PropTypes.arrayOf(PropTypes.string),
    availability: PropTypes.arrayOf(PropTypes.string),
  }),
  onFiltersChange: PropTypes.func,
  stats: PropTypes.shape({
    total: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    newConnections: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    responseRate: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    lastUpdated: PropTypes.string,
  }),
  suggestions: PropTypes.arrayOf(PropTypes.string),
  onSuggestionSelect: PropTypes.func,
  availableFilters: PropTypes.shape({
    focusAreas: PropTypes.arrayOf(PropTypes.string),
    locations: PropTypes.arrayOf(PropTypes.string),
    availability: PropTypes.arrayOf(PropTypes.string),
  }),
  className: PropTypes.string,
};

PeopleSearchBar.defaultProps = {
  query: '',
  onQueryChange: undefined,
  filters: { focusAreas: [], locations: [], availability: [] },
  onFiltersChange: undefined,
  stats: undefined,
  suggestions: [],
  onSuggestionSelect: undefined,
  availableFilters: { focusAreas: [], locations: [], availability: [] },
  className: undefined,
};
