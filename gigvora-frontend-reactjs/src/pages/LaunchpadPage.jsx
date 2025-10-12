import { useMemo, useState, useEffect, useCallback } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import DataStatus from '../components/DataStatus.jsx';
import LaunchpadTalentApplicationForm from '../components/LaunchpadTalentApplicationForm.jsx';
import LaunchpadEmployerRequestForm from '../components/LaunchpadEmployerRequestForm.jsx';
import LaunchpadPlacementsInsights from '../components/LaunchpadPlacementsInsights.jsx';
import useOpportunityListing from '../hooks/useOpportunityListing.js';
import analytics from '../services/analytics.js';
import { fetchLaunchpadDashboard } from '../services/launchpad.js';
import { formatRelativeTime } from '../utils/date.js';

export default function LaunchpadPage() {
  const [query, setQuery] = useState('');
  const { data, error, loading, fromCache, lastUpdated, refresh, debouncedQuery } = useOpportunityListing(
    'launchpads',
    query,
    { pageSize: 25 },
  );

  const listing = data ?? {};
  const items = useMemo(() => (Array.isArray(listing.items) ? listing.items : []), [listing.items]);

  const [selectedLaunchpadId, setSelectedLaunchpadId] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState(null);

  useEffect(() => {
    if (!selectedLaunchpadId && items.length) {
      setSelectedLaunchpadId(items[0].id);
    }
  }, [items, selectedLaunchpadId]);

  const loadDashboard = useCallback(
    async (launchpadId) => {
      if (!launchpadId) {
        setDashboard(null);
        return;
      }
      setDashboardLoading(true);
      setDashboardError(null);
      try {
        const result = await fetchLaunchpadDashboard({ launchpadId });
        setDashboard(result);
      } catch (dashError) {
        setDashboardError(dashError);
      } finally {
        setDashboardLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (selectedLaunchpadId) {
      loadDashboard(selectedLaunchpadId);
    }
  }, [selectedLaunchpadId, loadDashboard]);

  const handleFocusApplicationForm = useCallback(
    (cohort) => {
      setSelectedLaunchpadId(cohort.id);
      analytics.track(
        'web_launchpad_apply_cta',
        { id: cohort.id, title: cohort.title, track: cohort.track, query: debouncedQuery || null },
        { source: 'web_app' },
      );
      window.requestAnimationFrame(() => {
        document.getElementById('launchpad-apply-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    },
    [debouncedQuery],
  );

  const handleDashboardRefresh = useCallback(() => {
    if (selectedLaunchpadId) {
      loadDashboard(selectedLaunchpadId);
    }
  }, [selectedLaunchpadId, loadDashboard]);

  const handleApplicationSubmitted = useCallback(() => {
    refresh({ force: true });
    handleDashboardRefresh();
  }, [refresh, handleDashboardRefresh]);

  const handleEmployerSubmitted = useCallback(() => {
    handleDashboardRefresh();
  }, [handleDashboardRefresh]);

  const selectedLaunchpad = useMemo(
    () => items.find((cohort) => cohort.id === selectedLaunchpadId) ?? null,
    [items, selectedLaunchpadId],
  );

  return (
    <section className="relative overflow-hidden py-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(191,219,254,0.35),_transparent_65%)]" aria-hidden="true" />
      <div className="relative mx-auto max-w-5xl px-6">
        <PageHeader
          eyebrow="Experience Launchpad"
          title="Guided programmes to ship portfolio-ready work"
          description="Co-create alongside mentors and companies with structured sprints, feedback rituals, and community support."
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
          <label className="sr-only" htmlFor="launchpad-search">
            Search cohorts
          </label>
          <input
            id="launchpad-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by track, mentor, or cohort focus"
            className="w-full rounded-full border border-slate-200 bg-white px-5 py-3 text-sm shadow-sm transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        </div>
        {error ? (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            Unable to load the latest cohorts. {error.message || 'Please refresh to sync the newest programmes.'}
          </div>
        ) : null}
        {loading && !items.length ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="animate-pulse rounded-3xl border border-slate-200 bg-white p-6">
                <div className="h-3 w-1/4 rounded bg-slate-200" />
                <div className="mt-3 h-4 w-2/3 rounded bg-slate-200" />
                <div className="mt-2 h-3 w-full rounded bg-slate-200" />
              </div>
            ))}
          </div>
        ) : null}
        {!loading && !items.length ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
            {debouncedQuery
              ? 'No launchpad cohorts match your filters yet. Try another track or time frame.'
              : 'Upcoming cohorts will appear here as mentors publish new programs.'}
          </div>
        ) : null}
        <div className="space-y-6">
          {items.map((cohort) => {
            const isSelected = cohort.id === selectedLaunchpadId;
            return (
              <article
                key={cohort.id}
                className={`rounded-3xl border bg-white p-6 transition hover:-translate-y-0.5 hover:border-accent/60 hover:shadow-soft ${
                  isSelected ? 'border-accent/70 shadow-soft' : 'border-slate-200'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                  <div className="flex items-center gap-3">
                    {cohort.track ? <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{cohort.track}</span> : null}
                    {cohort.capacity ? (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                        {cohort.capacity} spots
                      </span>
                    ) : null}
                  </div>
                  <span className="text-slate-400">Updated {formatRelativeTime(cohort.updatedAt)}</span>
                </div>
                <h2 className="mt-3 text-xl font-semibold text-slate-900">{cohort.title}</h2>
                <p className="mt-2 text-sm text-slate-600">{cohort.description}</p>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleFocusApplicationForm(cohort)}
                    className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-xs font-semibold text-white shadow-soft transition hover:bg-accentDark"
                  >
                    Apply to cohort <span aria-hidden="true">→</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedLaunchpadId(cohort.id)}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-5 py-2 text-xs font-semibold text-slate-700 transition hover:border-accent hover:text-accent"
                  >
                    {isSelected ? 'Viewing insights' : 'View insights'}
                  </button>
                  {cohort.applicationUrl ? (
                    <a
                      href={cohort.applicationUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-transparent px-4 py-2 text-xs font-semibold text-slate-500 transition hover:text-slate-900"
                    >
                      Programme outline
                    </a>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
        <div className="mt-12 space-y-8">
          <LaunchpadPlacementsInsights
            dashboard={dashboard}
            loading={dashboardLoading}
            error={dashboardError}
            onRefresh={handleDashboardRefresh}
            launchpad={selectedLaunchpad}
          />
          <div id="launchpad-apply-form" className="grid gap-6 lg:grid-cols-2">
            <LaunchpadTalentApplicationForm launchpads={items} onSubmitted={handleApplicationSubmitted} />
            <LaunchpadEmployerRequestForm launchpads={items} onSubmitted={handleEmployerSubmitted} />
          </div>
        </div>
      </div>
    </section>
  );
}
