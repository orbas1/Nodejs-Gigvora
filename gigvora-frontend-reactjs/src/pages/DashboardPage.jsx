import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import DataStatus from '../components/DataStatus.jsx';
import UserAvatar from '../components/UserAvatar.jsx';
import dashboardService from '../services/dashboard.js';
import useAuth from '../hooks/useAuth.js';
import { formatAbsolute, formatRelativeTime } from '../utils/date.js';

function formatCurrency(amount, currency = 'USD') {
  try {
    return new Intl.NumberFormat('en', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(Number(amount ?? 0));
  } catch (error) {
    return `${currency} ${Number(amount ?? 0).toFixed(0)}`;
  }
}

function StatBadge({ label, value, accent = 'text-slate-900', helper }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-soft">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${accent}`}>{value}</p>
      {helper ? <p className="mt-2 text-xs text-slate-500">{helper}</p> : null}
    </div>
  );
}

function QueueCard({ title, entries = [], cta }) {
  return (
    <div className="flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        {cta || null}
      </div>
      <ul className="mt-4 space-y-4">
        {entries.length === 0 ? (
          <li className="rounded-2xl border border-dashed border-slate-200 bg-surfaceMuted/60 p-4 text-sm text-slate-500">
            No queued assignments right now. New matches will appear here first.
          </li>
        ) : (
          entries.map((entry) => (
            <li key={entry.id} className="rounded-2xl border border-slate-200 bg-white/80 p-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold uppercase tracking-[0.18em] text-accent/70">{entry.status}</span>
                {entry.expiresAt ? <span>Expires {formatRelativeTime(entry.expiresAt)}</span> : null}
              </div>
              <p className="mt-2 text-base font-semibold text-slate-900">{entry.project?.title ?? 'Project opportunity'}</p>
              <p className="mt-1 text-sm text-slate-600">
                {entry.project?.status ? `Status: ${entry.project.status}` : 'Weighted auto-assign invitation'}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                {entry.project?.budgetAmount ? (
                  <span className="rounded-full bg-surfaceMuted px-3 py-1 font-medium text-slate-600">
                    {formatCurrency(entry.project.budgetAmount, entry.project.budgetCurrency || 'USD')}
                  </span>
                ) : null}
                <span className="rounded-full border border-slate-200 px-3 py-1 font-medium text-slate-600">
                  Score: {Number(entry.score ?? 0).toFixed(2)}
                </span>
                <span className="rounded-full border border-slate-200 px-3 py-1 font-medium text-slate-600">
                  Priority {entry.priorityBucket ?? 1}
                </span>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

export default function DashboardPage() {
  const { status, user, logout } = useAuth();
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const canLoad = status === 'authenticated';

  const loadOverview = useCallback(async () => {
    if (!canLoad) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await dashboardService.fetchDashboardOverview();
      setOverview(response);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message || 'Unable to load dashboard.');
    } finally {
      setLoading(false);
    }
  }, [canLoad]);

  useEffect(() => {
    if (!canLoad) {
      setOverview(null);
      setLastUpdated(null);
      return undefined;
    }

    loadOverview();
    const interval = setInterval(loadOverview, 1000 * 60 * 5);
    return () => clearInterval(interval);
  }, [canLoad, loadOverview]);

  const summaryStats = useMemo(() => {
    if (!overview) {
      return [];
    }
    const cards = [
      {
        label: 'Active Projects',
        value: overview.summary?.activeProjects ?? 0,
        helper: 'Open or in-progress initiatives you own.',
      },
      {
        label: 'Assignments In Flight',
        value: overview.queue?.projects?.stats?.notified ?? 0,
        helper: 'Freelancers currently evaluating invitations.',
      },
      {
        label: 'Saved Searches',
        value: overview.savedSearches?.total ?? 0,
        helper: 'Alerts running with Meilisearch relevance rules.',
      },
    ];
    if (overview.summary?.portfolioValue) {
      cards.push({
        label: 'Portfolio Value',
        value: formatCurrency(overview.summary.portfolioValue),
        helper: 'Total budget across owned projects.',
      });
    }
    return cards;
  }, [overview]);

  if (!canLoad) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center px-6">
        <div className="rounded-4xl border border-slate-200 bg-white/90 p-10 text-center shadow-soft">
          <h1 className="text-2xl font-bold text-slate-900">Sign in to access your workspace</h1>
          <p className="mt-3 text-sm text-slate-600">
            The personalised dashboard surfaces your project pipelines, saved searches, and auto-assign queue. Complete login to
            start managing your network.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              to="/login"
              className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-accent/60 hover:text-accent"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark"
            >
              Join Gigvora
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="relative overflow-hidden py-16">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(191,219,254,0.28),_transparent_65%)]" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-6">
        <PageHeader
          eyebrow="Dashboard"
          title={`Welcome back${user?.firstName ? `, ${user.firstName}` : ''}`}
          description="Monitor your projects, track fairness-driven assignments, and stay close to discovery signals across the Gigvora ecosystem."
          meta={
            <DataStatus
              loading={loading}
              lastUpdated={lastUpdated}
              onRefresh={loadOverview}
            />
          }
          actions={
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-rose-300 hover:text-rose-600"
            >
              Log out
            </button>
          }
        />

        {error ? (
          <div className="mb-6 rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {summaryStats.map((stat) => (
            <StatBadge key={stat.label} label={stat.label} value={stat.value} helper={stat.helper} />
          ))}
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
          <QueueCard
            title="Your queued assignments"
            entries={overview?.queue?.freelancer?.entries?.slice(0, 4) ?? []}
            cta={
              <Link to="/auto-assign" className="text-xs font-semibold text-accent hover:underline">
                Manage queue
              </Link>
            }
          />
          <div className="flex flex-col gap-6">
            <QueueCard
              title="Project auto-assign status"
              entries={(overview?.queue?.projects?.queues?.[0]?.entries ?? []).slice(0, 3)}
              cta={
                <Link to="/projects" className="text-xs font-semibold text-accent hover:underline">
                  View all projects
                </Link>
              }
            />
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900">Saved searches</h3>
                <Link to="/search" className="text-xs font-semibold text-accent hover:underline">
                  Open explorer
                </Link>
              </div>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                {(overview?.savedSearches?.items ?? []).length === 0 ? (
                  <li className="rounded-2xl border border-dashed border-slate-200 bg-surfaceMuted/60 p-4">
                    Create alerts from Explorer to stay ahead of new roles, gigs, and projects.
                  </li>
                ) : (
                  overview.savedSearches.items.slice(0, 4).map((item) => (
                    <li key={item.id} className="rounded-2xl border border-slate-200 bg-white/80 p-4">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="uppercase tracking-[0.2em] text-accent/70">{item.category}</span>
                        {item.lastTriggeredAt ? <span>Last alert {formatRelativeTime(item.lastTriggeredAt)}</span> : null}
                      </div>
                      <p className="mt-2 text-base font-semibold text-slate-900">{item.name}</p>
                      {item.query ? <p className="mt-1 text-sm text-slate-600">Query: “{item.query}”</p> : null}
                      <p className="mt-1 text-xs text-slate-500">Frequency: {item.frequency}</p>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[1fr,0.9fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            <h3 className="text-base font-semibold text-slate-900">Recent project activity</h3>
            <ul className="mt-4 space-y-4 text-sm">
              {(overview?.activity?.events ?? []).length === 0 ? (
                <li className="rounded-2xl border border-dashed border-slate-200 bg-surfaceMuted/60 p-4 text-slate-500">
                  Project events will appear here as collaborators update scopes or auto-assign queues regenerate.
                </li>
              ) : (
                overview.activity.events.slice(0, 6).map((event) => (
                  <li key={event.id} className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white/80 p-4">
                    <div className="mt-1 h-2 w-2 rounded-full bg-accent" />
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{event.eventType.replace(/_/g, ' ')}</p>
                      <p className="mt-1 text-slate-900">
                        {event.projectId ? <Link to={`/projects/${event.projectId}`} className="font-semibold text-accent hover:underline">Project #{event.projectId}</Link> : 'Project update'}
                      </p>
                      {event.payload ? (
                        <pre className="mt-2 whitespace-pre-wrap text-[11px] leading-relaxed text-slate-500">
                          {JSON.stringify(event.payload, null, 2)}
                        </pre>
                      ) : null}
                      <p className="mt-2 text-xs text-slate-500">{formatAbsolute(event.createdAt)}</p>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            <h3 className="text-base font-semibold text-slate-900">Owned projects</h3>
            <ul className="mt-4 space-y-4">
              {(overview?.projects?.items ?? []).length === 0 ? (
                <li className="rounded-2xl border border-dashed border-slate-200 bg-surfaceMuted/60 p-4 text-sm text-slate-500">
                  Launch a project to activate auto-assign queues, escrow milestones, and workspace analytics.
                </li>
              ) : (
                overview.projects.items.slice(0, 5).map((project) => (
                  <li key={project.id} className="rounded-2xl border border-slate-200 bg-white/80 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{project.title}</p>
                        <p className="mt-1 text-xs text-slate-500">Status: {project.status ?? 'unspecified'}</p>
                      </div>
                      <Link
                        to={`/projects/${project.id}`}
                        className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                      >
                        Manage
                      </Link>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      Auto-assign: {project.autoAssignStatus?.replace(/_/g, ' ') ?? 'inactive'}
                    </p>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[0.75fr,1fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            <h3 className="text-base font-semibold text-slate-900">Your profile</h3>
            <div className="mt-4 flex items-center gap-4">
              <UserAvatar
                name={`${user?.firstName ?? 'Team'} ${user?.lastName ?? 'Member'}`.trim()}
                seed={`${user?.id ?? 'anon'}-dashboard`}
                size="lg"
              />
              <div>
                <p className="text-lg font-semibold text-slate-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-sm text-slate-500">{overview?.user?.profile?.headline ?? 'Complete your profile to improve matching fidelity.'}</p>
              </div>
            </div>
            {overview?.user?.assignmentMetric ? (
              <div className="mt-4 grid gap-3 rounded-2xl bg-surfaceMuted/70 p-4 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-500">Rating</span>
                  <span className="text-slate-900">{Number(overview.user.assignmentMetric.rating ?? 0).toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-500">Completion Rate</span>
                  <span className="text-slate-900">
                    {Math.round(Number(overview.user.assignmentMetric.completionRate ?? 0) * 100)}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-500">Projects Completed</span>
                  <span className="text-slate-900">{overview.user.assignmentMetric.totalCompleted}</span>
                </div>
              </div>
            ) : null}
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            <h3 className="text-base font-semibold text-slate-900">Auto-assign health</h3>
            <p className="mt-2 text-sm text-slate-600">
              Monitor fairness distribution across the weighted queue. Balance recency, rating, completion, and earnings to ensure
              every freelancer has a pathway to premium briefs.
            </p>
            <div className="mt-5 grid gap-3 text-xs text-slate-600">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-500">Pending invites</span>
                <span className="text-slate-900">{overview?.queue?.projects?.stats?.pending ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-500">Notified talent</span>
                <span className="text-slate-900">{overview?.queue?.projects?.stats?.notified ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-500">Expired invitations</span>
                <span className="text-slate-900">{overview?.queue?.projects?.stats?.expired ?? 0}</span>
              </div>
              {overview?.queue?.projects?.nextActionAt ? (
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-500">Next action</span>
                  <span className="text-slate-900">{formatAbsolute(overview.queue.projects.nextActionAt)}</span>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
