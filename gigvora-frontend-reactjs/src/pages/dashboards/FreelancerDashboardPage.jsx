import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import useSession from '../../hooks/useSession.js';

const SAMPLE_METRICS = [
  { id: 'matches', label: 'New matches', value: 8, trend: '+2 this week' },
  { id: 'applications', label: 'Active applications', value: 5, trend: '2 awaiting review' },
  { id: 'saved', label: 'Saved gigs', value: 14, trend: 'Keep refining your preferences' },
];

const SAMPLE_PIPELINE = [
  { id: 'discovery', title: 'Discovery call', description: 'Schedule time with the client success partner to confirm scope.' },
  { id: 'proposal', title: 'Proposal sent', description: 'Tailor your pricing pack and highlight relevant case studies.' },
  { id: 'interview', title: 'Interview', description: 'Prepare a short demo of your recent work to stand out.' },
];

const SAMPLE_RESOURCES = [
  {
    id: 'profile',
    title: 'Refresh your profile',
    copy: 'Fine tune your expertise tags and headline so matching stays accurate.',
    to: '/profile/me',
  },
  {
    id: 'launchpad',
    title: 'Browse Launchpad gigs',
    copy: 'Explore curated, fast-moving projects looking for immediate contributors.',
    to: '/experience-launchpad',
  },
  {
    id: 'community',
    title: 'Join a guild session',
    copy: 'Share feedback and learn from other freelancers in the community.',
    to: '/groups',
  },
];

export default function FreelancerDashboardPage() {
  const { session } = useSession();

  const displayName = useMemo(() => {
    if (!session) {
      return 'Freelancer';
    }
    return session.name || session.firstName || session.email || 'Freelancer';
  }, [session]);

  return (
    <div className="min-h-screen bg-surfaceMuted pb-16">
      <div className="mx-auto max-w-6xl px-4 pt-12 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-8">
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-slate-500">Welcome back</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">{displayName}</h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-600">
              Keep momentum going by following the next actions in your pipeline and sharing progress with the Gigvora team.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {SAMPLE_METRICS.map((metric) => (
              <div
                key={metric.id}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft transition hover:-translate-y-0.5 hover:border-accent/60"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">{metric.label}</p>
                <p className="mt-3 text-3xl font-semibold text-slate-900">{metric.value}</p>
                <p className="mt-2 text-xs text-slate-500">{metric.trend}</p>
              </div>
            ))}
          </div>
        </header>

        <section className="mt-12 grid gap-8 lg:grid-cols-[1.3fr_1fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900">Pipeline focus</h2>
                <Link to="/dashboard/freelancer/pipeline" className="text-sm font-semibold text-accent hover:text-accentDark">
                  View detailed pipeline
                </Link>
              </div>
              <ol className="mt-6 space-y-4">
                {SAMPLE_PIPELINE.map((step, index) => (
                  <li key={step.id} className="flex gap-4 rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{step.title}</p>
                      <p className="text-xs text-slate-500">{step.description}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
              <h2 className="text-xl font-semibold text-slate-900">Quick wins</h2>
              <ul className="mt-6 space-y-3">
                <li className="flex items-start gap-3 rounded-2xl border border-slate-200/70 bg-slate-50 p-4">
                  <span className="mt-0.5 h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
                  <p className="text-sm text-slate-600">
                    Keep an eye on new invites—responding within the first hour improves conversion by 30%.
                  </p>
                </li>
                <li className="flex items-start gap-3 rounded-2xl border border-slate-200/70 bg-slate-50 p-4">
                  <span className="mt-0.5 h-2 w-2 rounded-full bg-sky-500" aria-hidden="true" />
                  <p className="text-sm text-slate-600">Upload a short video introduction to strengthen your applications.</p>
                </li>
                <li className="flex items-start gap-3 rounded-2xl border border-slate-200/70 bg-slate-50 p-4">
                  <span className="mt-0.5 h-2 w-2 rounded-full bg-amber-500" aria-hidden="true" />
                  <p className="text-sm text-slate-600">Share updates with your talent partner weekly so we can advocate for you.</p>
                </li>
              </ul>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
              <h2 className="text-lg font-semibold text-slate-900">Recommended resources</h2>
              <ul className="mt-4 space-y-3">
                {SAMPLE_RESOURCES.map((resource) => (
                  <li key={resource.id} className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-900">{resource.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{resource.copy}</p>
                    <Link
                      to={resource.to}
                      className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-accent transition hover:text-accentDark"
                    >
                      Explore
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-accent/10 via-white to-blue-100 p-6 shadow-soft">
              <h2 className="text-lg font-semibold text-slate-900">Need help?</h2>
              <p className="mt-2 text-sm text-slate-600">
                Your client success partner can walk through opportunities, feedback, and growth plans.
              </p>
              <Link
                to="/inbox"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
              >
                Send a message
              </Link>
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}
