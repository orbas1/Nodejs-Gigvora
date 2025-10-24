import { Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import JourneyProgressSummary from '../components/journey/JourneyProgressSummary.jsx';
import analytics from '../services/analytics.js';
import { ANALYTICS_EVENTS } from '../constants/analyticsEvents.js';

export default function NotFoundPage() {
  const location = useLocation();

  useEffect(() => {
    analytics.track(ANALYTICS_EVENTS.ROUTE_NOT_FOUND_VISITED.name, {
      pathname: location.pathname,
      search: location.search,
    });
  }, [location.pathname, location.search]);

  return (
    <div className="mx-auto max-w-5xl space-y-10 px-6 py-20">
      <PageHeader
        eyebrow="Page not found"
        title="We could not find that destination"
        description="Double-check the link or jump into your dashboard to continue building momentum."
      />
      <JourneyProgressSummary
        title="Stay on track"
        description="Even if a link is out of date, your progress checkpoints remain synced across the platform."
      />
      <div className="grid gap-6 rounded-3xl border border-slate-200 bg-white/90 p-10 shadow-sm md:grid-cols-2">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Popular destinations</h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            <li>
              <Link className="text-accent hover:text-accentDark" to="/feed">
                Explore the community feed
              </Link>
            </li>
            <li>
              <Link className="text-accent hover:text-accentDark" to="/dashboard/user">
                Open the client dashboard
              </Link>
            </li>
            <li>
              <Link className="text-accent hover:text-accentDark" to="/projects">
                Review live projects
              </Link>
            </li>
            <li>
              <Link className="text-accent hover:text-accentDark" to="/mentors">
                Discover mentors and programmes
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Need help?</h2>
          <p className="mt-3 text-sm text-slate-600">
            Reach out to support for personalised assistance. Share the URL you followed so we can track down what went wrong.
          </p>
          <Link
            className="mt-4 inline-flex items-center justify-center rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white transition hover:bg-accentDark"
            to="/inbox"
          >
            Contact support
          </Link>
        </div>
      </div>
    </div>
  );
}
