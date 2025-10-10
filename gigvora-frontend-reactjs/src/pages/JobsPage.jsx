import { useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import DataStatus from '../components/DataStatus.jsx';
import useOpportunityListing from '../hooks/useOpportunityListing.js';
import analytics from '../services/analytics.js';
import { formatRelativeTime } from '../utils/date.js';

export default function JobsPage() {
  const [query, setQuery] = useState('');
  const { data, error, loading, fromCache, lastUpdated, refresh, debouncedQuery } = useOpportunityListing('jobs', query, {
    pageSize: 25,
  });

  const listing = data ?? {};
  const items = useMemo(() => (Array.isArray(listing.items) ? listing.items : []), [listing.items]);

  const handleApply = (job) => {
    analytics.track(
      'web_job_apply_cta',
      { id: job.id, title: job.title, query: debouncedQuery || null },
      { source: 'web_app' },
    );
  };

  return (
    <section className="relative overflow-hidden py-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(191,219,254,0.35),_transparent_65%)]" aria-hidden="true" />
      <div className="relative mx-auto max-w-5xl px-6">
        <PageHeader
          eyebrow="Jobs"
          title="Roles designed for Gigvora talent"
          description="Full-time and long-term opportunities curated for the marketplace community with transparent salary bands."
          meta={
            <DataStatus
              loading={loading}
              fromCache={fromCache}
              lastUpdated={lastUpdated}
              onRefresh={() => refresh({ force: true })}
            />
          }
        />
        <div className="mb-6 max-w-xl">
          <label className="sr-only" htmlFor="job-search">
            Search jobs
          </label>
          <input
            id="job-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by title, location, or keywords"
            className="w-full rounded-full border border-slate-200 bg-white px-5 py-3 text-sm shadow-sm transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        </div>
        {error ? (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            Unable to load the latest roles. {error.message || 'Try refreshing to sync again.'}
          </div>
        ) : null}
        {loading && !items.length ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="animate-pulse rounded-3xl border border-slate-200 bg-white p-6">
                <div className="h-3 w-1/3 rounded bg-slate-200" />
                <div className="mt-3 h-4 w-1/2 rounded bg-slate-200" />
                <div className="mt-2 h-3 w-full rounded bg-slate-200" />
                <div className="mt-1 h-3 w-5/6 rounded bg-slate-200" />
              </div>
            ))}
          </div>
        ) : null}
        {!loading && !items.length ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
            {debouncedQuery
              ? 'No jobs matched your filters yet. Try broadening your search.'
              : 'Jobs curated from trusted teams will appear here as we sync the marketplace.'}
          </div>
        ) : null}
        <div className="space-y-6">
          {items.map((job) => (
            <article
              key={job.id}
              className="rounded-3xl border border-slate-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-accent/60 hover:shadow-soft"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                {job.location ? <span>{job.location}</span> : null}
                {job.employmentType ? <span>{job.employmentType}</span> : null}
                <span className="text-slate-400">Updated {formatRelativeTime(job.updatedAt)}</span>
              </div>
              <h2 className="mt-3 text-xl font-semibold text-slate-900">{job.title}</h2>
              <p className="mt-2 text-sm text-slate-600">{job.description}</p>
              <button
                type="button"
                onClick={() => handleApply(job)}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-xs font-semibold text-white shadow-soft transition hover:bg-accentDark"
              >
                Apply now <span aria-hidden="true">→</span>
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
