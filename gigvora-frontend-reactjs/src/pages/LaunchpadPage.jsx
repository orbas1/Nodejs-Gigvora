import { useMemo, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import DataStatus from '../components/DataStatus.jsx';
import LaunchpadTalentApplicationForm from '../components/LaunchpadTalentApplicationForm.jsx';
import LaunchpadEmployerRequestForm from '../components/LaunchpadEmployerRequestForm.jsx';
import LaunchpadPlacementsInsights from '../components/LaunchpadPlacementsInsights.jsx';
import LaunchpadCandidatePipeline from '../components/LaunchpadCandidatePipeline.jsx';
import useOpportunityListing from '../hooks/useOpportunityListing.js';
import analytics from '../services/analytics.js';
import { fetchLaunchpadDashboard } from '../services/launchpad.js';
import { formatRelativeTime } from '../utils/date.js';
import useSession from '../hooks/useSession.js';
import AccessRestricted from '../components/AccessRestricted.jsx';
import { canAccessLaunchpad, getLaunchpadMemberships } from '../constants/access.js';

export default function LaunchpadPage() {
  const [query, setQuery] = useState('');
  const { data, error, loading, fromCache, lastUpdated, refresh, debouncedQuery } = useOpportunityListing(
    'launchpads',
    query,
    { pageSize: 25 },
  );

  const { session, isAuthenticated } = useSession();
  const hasLaunchpadAccess = useMemo(() => canAccessLaunchpad(session), [session]);
  const launchpadMemberships = useMemo(() => getLaunchpadMemberships(session), [session]);
  const launchpadAccessLabel = useMemo(() => {
    if (!launchpadMemberships.length) {
      return null;
    }
    return launchpadMemberships
      .map((membership) => membership.replace(/_/g, ' '))
      .map((label) => label.charAt(0).toUpperCase() + label.slice(1))
      .join(' • ');
  }, [launchpadMemberships]);
  const membershipSet = useMemo(
    () => new Set(Array.isArray(session?.memberships) ? session.memberships : []),
    [session?.memberships],
  );
  const canViewOperations = useMemo(
    () => membershipSet.has('mentor') || membershipSet.has('admin') || membershipSet.has('company'),
    [membershipSet],
  );
  const canApplyAsTalent = useMemo(
    () => membershipSet.has('freelancer') || membershipSet.has('mentor'),
    [membershipSet],
  );
  const canSubmitEmployer = useMemo(
    () => membershipSet.has('company') || membershipSet.has('agency') || membershipSet.has('admin'),
    [membershipSet],
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
    if (!canViewOperations) {
      setDashboard(null);
      setDashboardError(null);
      setDashboardLoading(false);
      return;
    }
    if (selectedLaunchpadId) {
      loadDashboard(selectedLaunchpadId);
    }
  }, [selectedLaunchpadId, loadDashboard, canViewOperations]);

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
    if (canViewOperations && selectedLaunchpadId) {
      loadDashboard(selectedLaunchpadId);
    }
  }, [canViewOperations, selectedLaunchpadId, loadDashboard]);

  const handleApplicationSubmitted = useCallback(() => {
    refresh({ force: true });
    if (canViewOperations) {
      handleDashboardRefresh();
    }
  }, [refresh, handleDashboardRefresh, canViewOperations]);

  const handleEmployerSubmitted = useCallback(() => {
    if (canViewOperations) {
      handleDashboardRefresh();
    }
  }, [handleDashboardRefresh, canViewOperations]);

  const selectedLaunchpad = useMemo(
    () => items.find((cohort) => cohort.id === selectedLaunchpadId) ?? null,
    [items, selectedLaunchpadId],
  );

  if (isAuthenticated && !hasLaunchpadAccess) {
    return (
      <section className="relative overflow-hidden bg-surfaceMuted py-20">
        <div className="absolute inset-x-0 top-0 h-60 bg-gradient-to-b from-sky-200/30 via-transparent to-transparent" aria-hidden="true" />
        <div className="absolute -left-24 top-24 h-64 w-64 rounded-full bg-accent/10 blur-3xl" aria-hidden="true" />
        <div className="relative mx-auto max-w-4xl px-6">
          <AccessRestricted
            tone="sky"
            badge={launchpadAccessLabel ? `Active: ${launchpadAccessLabel}` : 'Experience Launchpad'}
            title="Launchpad workspace is safeguarded"
            description="Only verified fellows, mentors, agencies, and partner companies can collaborate inside Experience Launchpad. This keeps pilot programmes, placement data, and company briefs secure."
            actionLabel="Request Launchpad access"
            actionHref="mailto:launchpad@gigvora.com?subject=Launchpad%20access%20request"
          />
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden py-20">
      <div className="absolute inset-0 bg-gradient-to-br from-sky-50 via-white to-white" aria-hidden="true" />
      <div className="absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-accent/10 blur-3xl" aria-hidden="true" />
      <div className="relative mx-auto max-w-5xl px-6">
        <PageHeader
          eyebrow="Experience Launchpad"
          title="Guided programmes to ship portfolio-ready work"
          description="Join structured cohorts with partner companies, shared rituals, and measurable outcomes for your next leap."
          meta={
            <DataStatus
              loading={loading}
              fromCache={fromCache}
              lastUpdated={lastUpdated}
              onRefresh={() => refresh({ force: true })}
            />
          }
        />
        {launchpadAccessLabel ? (
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-accent">
            Access granted · {launchpadAccessLabel}
          </div>
        ) : null}
        <div className="mb-6 max-w-xl">
          <label className="sr-only" htmlFor="launchpad-search">
            Search cohorts
          </label>
          <input
            id="launchpad-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by track, cohort focus, or partner company"
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
          {canViewOperations ? (
            <>
              <LaunchpadPlacementsInsights
                dashboard={dashboard}
                loading={dashboardLoading}
                error={dashboardError}
                onRefresh={handleDashboardRefresh}
                launchpad={selectedLaunchpad}
              />
              {selectedLaunchpadId ? <LaunchpadCandidatePipeline launchpadId={selectedLaunchpadId} /> : null}
            </>
          ) : (
            <section className="rounded-3xl border border-dashed border-slate-300 bg-white/90 p-8 text-center shadow-soft">
              <h3 className="text-lg font-semibold text-slate-900">Launchpad mission control access required</h3>
              <p className="mt-2 text-sm text-slate-600">
                Detailed pipeline telemetry is limited to Launchpad mentors, company programme leads, and administrators. Request
                access to collaborate on cohort orchestration.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-3">
                <Link
                  to="/dashboard/launchpad"
                  className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-xs font-semibold text-white shadow-soft transition hover:bg-accentDark"
                >
                  Open operations workspace
                </Link>
                <a
                  href="mailto:launchpad@gigvora.com"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-5 py-2 text-xs font-semibold text-slate-700 transition hover:border-accent hover:text-accent"
                >
                  Request access
                </a>
              </div>
            </section>
          )}
          <div id="launchpad-apply-form" className="grid gap-6 lg:grid-cols-2">
            {canApplyAsTalent ? (
              <LaunchpadTalentApplicationForm launchpads={items} onSubmitted={handleApplicationSubmitted} />
            ) : (
              <article className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-soft">
                <h3 className="text-lg font-semibold text-slate-900">Activate your freelancer profile</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Experience Launchpad applications are reserved for approved freelancer and mentor memberships. Sign in to your
                  account or complete your onboarding to share your portfolio.
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-3">
                  {isAuthenticated ? null : (
                    <Link
                      to="/login"
                      className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-5 py-2 text-xs font-semibold text-slate-700 transition hover:border-accent hover:text-accent"
                    >
                      Sign in
                    </Link>
                  )}
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-xs font-semibold text-white shadow-soft transition hover:bg-accentDark"
                  >
                    Complete freelancer onboarding
                  </Link>
                </div>
              </article>
            )}
            {canSubmitEmployer ? (
              <LaunchpadEmployerRequestForm launchpads={items} onSubmitted={handleEmployerSubmitted} />
            ) : (
              <article className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
                <h3 className="text-lg font-semibold text-slate-900">Partner with the Launchpad</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Sign in with a company or agency membership to submit employer briefs and align mentor pods to your briefs.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {isAuthenticated ? null : (
                    <Link
                      to="/login"
                      className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-5 py-2 text-xs font-semibold text-slate-700 transition hover:border-accent hover:text-accent"
                    >
                      Sign in
                    </Link>
                  )}
                  <Link
                    to="/register/company"
                    className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-xs font-semibold text-white shadow-soft transition hover:bg-accentDark"
                  >
                    Create company workspace
                  </Link>
                </div>
              </article>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
