import { useCallback, useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import DataStatus from '../components/DataStatus.jsx';
import useOpportunityListing from '../hooks/useOpportunityListing.js';
import analytics from '../services/analytics.js';
import MentorProfileCard from '../components/mentor/MentorProfileCard.jsx';
import MentorOnboardingForm from '../components/mentor/MentorOnboardingForm.jsx';
import MentorShowcaseManager from '../components/mentors/MentorShowcaseManager.jsx';

export const MENTOR_LISTING_RESOURCE = 'mentors';

export default function MentorsPage() {
  const [query, setQuery] = useState('');
  const { data, error, loading, fromCache, lastUpdated, refresh, debouncedQuery } = useOpportunityListing(
    MENTOR_LISTING_RESOURCE,
    query,
    {
      pageSize: 30,
    },
  );

  const mentors = useMemo(() => (Array.isArray(data?.items) ? data.items : []), [data?.items]);

  const handleBookMentor = useCallback((mentor) => {
    analytics.track('web_mentor_book_cta', { mentorId: mentor.id, name: mentor.name }, { source: 'web_app' });
  }, []);

  const handleViewMentor = useCallback((mentor) => {
    analytics.track('web_mentor_profile_viewed', { mentorId: mentor.id, name: mentor.name }, { source: 'web_app' });
  }, []);

  const handleFormSubmitted = useCallback(() => {
    refresh({ force: true });
  }, [refresh]);

  return (
    <section className="relative overflow-hidden py-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(221,232,255,0.45),_transparent_65%)]" aria-hidden="true" />
      <div className="relative mx-auto max-w-6xl px-6">
        <PageHeader
          eyebrow="Mentor marketplace"
          title="Work with leaders who accelerate your next leap"
          description="Book 1:1 sessions, cohort clinics, and mentorship packages with operators across product, design, revenue, and operations."
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
          <label className="sr-only" htmlFor="mentor-search">
            Search mentors
          </label>
          <input
            id="mentor-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search mentors by craft, industry, or outcomes"
            className="w-full rounded-full border border-slate-200 bg-white px-5 py-3 text-sm shadow-sm transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        </div>
        {error ? (
          <div className="mb-6 rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
            Unable to load mentors right now. {error.message || 'Refresh to try again.'}
          </div>
        ) : null}
        {loading && !mentors.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="animate-pulse rounded-3xl border border-slate-200 bg-white p-6">
                <div className="h-3 w-1/4 rounded bg-slate-200" />
                <div className="mt-3 h-4 w-2/3 rounded bg-slate-200" />
                <div className="mt-4 h-3 w-full rounded bg-slate-200" />
                <div className="mt-2 h-3 w-2/5 rounded bg-slate-200" />
              </div>
            ))}
          </div>
        ) : null}
        {!loading && !mentors.length ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
            {debouncedQuery
              ? 'No mentors match your filters yet. Try searching by a broader craft or outcome.'
              : 'Our mentor guild is onboarding now. Share your practice to be featured in Explorer.'}
          </div>
        ) : null}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr),minmax(0,1fr)]">
          <div className="space-y-5">
            {mentors.map((mentor) => (
              <MentorProfileCard
                key={mentor.id}
                mentor={mentor}
                onBook={handleBookMentor}
                onView={handleViewMentor}
              />
            ))}
          </div>
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-slate-900 p-6 text-white shadow-soft">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">Featured formats</p>
              <ul className="mt-4 space-y-3 text-sm">
                <li>
                  <span className="font-semibold text-white">Leadership pods</span> • 6-week sprints combining live sessions and async feedback.
                </li>
                <li>
                  <span className="font-semibold text-white">Revenue labs</span> • Diagnose pipeline blockers with GTM mentors and co-create playbooks.
                </li>
                <li>
                  <span className="font-semibold text-white">Portfolio clinics</span> • Intensive storytelling reviews to prep for promotions and interviews.
                </li>
              </ul>
              <p className="mt-5 text-xs text-slate-300">
                Mentor packages sync with Explorer alerts and the new mentor dashboard so you can manage demand centrally.
              </p>
            </div>
            <MentorOnboardingForm onSubmitted={handleFormSubmitted} ctaLabel="List my mentorship" />
          </div>
        </div>
        <MentorShowcaseManager />
      </div>
    </section>
  );
}
