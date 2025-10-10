import { useEffect, useMemo, useRef, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import DataStatus from '../components/DataStatus.jsx';
import useCachedResource from '../hooks/useCachedResource.js';
import useDebounce from '../hooks/useDebounce.js';
import { apiClient } from '../services/apiClient.js';
import analytics from '../services/analytics.js';
import { formatAbsolute, formatRelativeTime } from '../utils/date.js';

const categories = [
  { id: 'jobs', label: 'Jobs' },
  { id: 'gigs', label: 'Gigs' },
  { id: 'projects', label: 'Projects' },
  { id: 'launchpads', label: 'Experience Launchpad' },
  { id: 'volunteering', label: 'Volunteering' },
  { id: 'people', label: 'People' },
];

function getSnapshotBuckets(snapshot) {
  if (!snapshot) {
    return {};
  }
  return {
    jobs: snapshot.jobs?.items ?? [],
    gigs: snapshot.gigs?.items ?? [],
    projects: snapshot.projects?.items ?? [],
    launchpads: snapshot.launchpads?.items ?? [],
    volunteering: snapshot.volunteering?.items ?? [],
  };
}

function renderMeta(item, category) {
  switch (category) {
    case 'jobs':
      return [item.location, item.employmentType].filter(Boolean);
    case 'gigs':
      return [item.budget, item.duration].filter(Boolean);
    case 'projects':
      return [item.status].filter(Boolean);
    case 'launchpads':
      return [item.track].filter(Boolean);
    case 'volunteering':
      return [item.organization].filter(Boolean);
    case 'people':
      return [item.userType, item.email].filter(Boolean);
    default:
      return [];
  }
}

export default function SearchPage() {
  const [selectedCategory, setSelectedCategory] = useState('jobs');
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query.trim(), 400);
  const trackedQueriesRef = useRef(new Set());

  const snapshotState = useCachedResource(
    'discovery:snapshot',
    ({ signal }) => apiClient.get('/discovery/snapshot', { signal, params: { limit: 8 } }),
    { ttl: 1000 * 60 * 3 },
  );

  const searchState = useCachedResource(
    `search:${debouncedQuery.toLowerCase() || 'empty'}`,
    ({ signal }) => apiClient.get('/search', { signal, params: { q: debouncedQuery, limit: 12 } }),
    {
      enabled: Boolean(debouncedQuery),
      dependencies: [debouncedQuery],
      ttl: 1000 * 60,
    },
  );

  useEffect(() => {
    if (!debouncedQuery || !searchState.data) {
      return;
    }
    const signature = `${debouncedQuery}:${selectedCategory}`;
    if (trackedQueriesRef.current.has(signature)) {
      return;
    }
    const resultsForCategory = searchState.data[selectedCategory] ?? [];
    analytics.track(
      'web_search_performed',
      {
        query: debouncedQuery,
        category: selectedCategory,
        results: resultsForCategory.length,
      },
      { source: 'web_app' },
    );
    trackedQueriesRef.current.add(signature);
  }, [debouncedQuery, searchState.data, selectedCategory]);

  const snapshotBuckets = useMemo(() => getSnapshotBuckets(snapshotState.data), [snapshotState.data]);
  const activeResults = useMemo(() => {
    if (debouncedQuery) {
      const dataset = searchState.data || {};
      return dataset[selectedCategory] ?? [];
    }
    return snapshotBuckets[selectedCategory] ?? [];
  }, [debouncedQuery, searchState.data, selectedCategory, snapshotBuckets]);

  const isLoading = debouncedQuery ? searchState.loading : snapshotState.loading;
  const error = debouncedQuery ? searchState.error : snapshotState.error;
  const fromCache = debouncedQuery ? searchState.fromCache : snapshotState.fromCache;
  const lastUpdated = debouncedQuery ? searchState.lastUpdated : snapshotState.lastUpdated;

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    analytics.track('web_search_filter_selected', { category }, { source: 'web_app' });
  };

  const handleResultCTA = (item) => {
    analytics.track(
      'web_search_result_opened',
      {
        category: selectedCategory,
        id: item.id,
        title: item.title || `${item.firstName ?? ''} ${item.lastName ?? ''}`.trim(),
        query: debouncedQuery || null,
      },
      { source: 'web_app' },
    );
  };

  const renderResultCard = (item) => {
    if (selectedCategory === 'people') {
      const name = `${item.firstName ?? ''} ${item.lastName ?? ''}`.trim();
      return (
        <article
          key={`people-${item.id}`}
          className="rounded-3xl border border-slate-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-accent/60 hover:shadow-soft"
        >
          <span className="text-xs font-semibold uppercase tracking-[0.35em] text-accentDark">People</span>
          <h2 className="mt-3 text-lg font-semibold text-slate-900">{name || 'Gigvora member'}</h2>
          <p className="mt-2 text-sm text-slate-600">{item.email}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
            {renderMeta(item, 'people').map((meta) => (
              <span key={meta} className="rounded-full border border-slate-200 px-3 py-1">
                {meta}
              </span>
            ))}
          </div>
          <button
            type="button"
            onClick={() => handleResultCTA(item)}
            className="mt-5 inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
          >
            View profile <span aria-hidden="true">→</span>
          </button>
        </article>
      );
    }

    return (
      <article
        key={`${selectedCategory}-${item.id}`}
        className="rounded-3xl border border-slate-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-accent/60 hover:shadow-soft"
      >
        <span className="text-xs font-semibold uppercase tracking-[0.35em] text-accentDark">
          {categories.find((cat) => cat.id === selectedCategory)?.label ?? selectedCategory}
        </span>
        <h2 className="mt-3 text-lg font-semibold text-slate-900">{item.title}</h2>
        <p className="mt-2 text-sm text-slate-600">{item.description}</p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
          {renderMeta(item, selectedCategory).map((meta) => (
            <span key={meta} className="rounded-full border border-slate-200 px-3 py-1">
              {meta}
            </span>
          ))}
        </div>
        <div className="mt-3 text-xs text-slate-400">
          Updated {formatRelativeTime(item.updatedAt)}
        </div>
        <button
          type="button"
          onClick={() => handleResultCTA(item)}
          className="mt-5 inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
        >
          View details <span aria-hidden="true">→</span>
        </button>
      </article>
    );
  };

  return (
    <section className="relative overflow-hidden py-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(191,219,254,0.35),_transparent_65%)]" aria-hidden="true" />
      <div className="relative mx-auto max-w-6xl px-6">
        <PageHeader
          eyebrow="Explorer"
          title="Search across the entire Gigvora ecosystem"
          description="Find opportunities, collaborators, and communities across jobs, gigs, projects, launchpad cohorts, volunteering, and people."
          meta={
            <DataStatus
              loading={isLoading}
              fromCache={fromCache}
              lastUpdated={lastUpdated}
              onRefresh={() => (debouncedQuery ? searchState.refresh({ force: true }) : snapshotState.refresh({ force: true }))}
            />
          }
        />
        <form className="mt-4 max-w-xl" onSubmit={(event) => event.preventDefault()}>
          <label className="sr-only" htmlFor="explorer-search">
            Search keyword
          </label>
          <input
            id="explorer-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search jobs, gigs, projects, or people"
            className="w-full rounded-full border border-slate-200 bg-white px-5 py-3 text-sm shadow-sm transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        </form>
        <div className="mt-6 flex flex-wrap gap-3 text-xs font-semibold">
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => handleCategoryChange(category.id)}
              className={`rounded-full px-4 py-2 transition ${
                selectedCategory === category.id
                  ? 'bg-accent text-white shadow-soft'
                  : 'border border-slate-200 text-slate-600 hover:border-accent hover:text-accent'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
        {error ? (
          <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            We could not load the latest results. {error.message || 'Try searching again in a few seconds.'}
          </div>
        ) : null}
        <div className="mt-10 grid gap-5">
          {isLoading && !activeResults.length ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="animate-pulse rounded-3xl border border-slate-200 bg-white p-6">
                  <div className="h-3 w-24 rounded bg-slate-200" />
                  <div className="mt-3 h-4 w-2/3 rounded bg-slate-200" />
                  <div className="mt-2 h-3 w-full rounded bg-slate-200" />
                  <div className="mt-1 h-3 w-5/6 rounded bg-slate-200" />
                </div>
              ))}
            </div>
          ) : null}
          {!isLoading && !activeResults.length ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
              {debouncedQuery
                ? 'No matching results yet. Refine your query or try a different category.'
                : 'Trending items will appear here as data syncs from the marketplace.'}
            </div>
          ) : null}
          {activeResults.map((item) => renderResultCard(item))}
        </div>
        {lastUpdated ? (
          <p className="mt-6 text-xs text-slate-400">
            Snapshot captured {formatRelativeTime(lastUpdated)} • {formatAbsolute(lastUpdated)}
          </p>
        ) : null}
      </div>
    </section>
  );
}
