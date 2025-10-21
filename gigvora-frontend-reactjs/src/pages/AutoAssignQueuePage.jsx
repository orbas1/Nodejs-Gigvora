import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import DataStatus from '../components/DataStatus.jsx';
import UserAvatar from '../components/UserAvatar.jsx';
import useCachedResource from '../hooks/useCachedResource.js';
import { fetchFreelancerQueue } from '../services/autoAssign.js';
import { formatRelativeTime } from '../utils/date.js';
import useSession from '../hooks/useSession.js';

export const STATUS_STYLES = {
  notified: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  pending: 'bg-slate-100 text-slate-600 border-slate-200',
  accepted: 'bg-emerald-200 text-emerald-900 border-emerald-300',
  declined: 'bg-rose-100 text-rose-600 border-rose-200',
  expired: 'bg-slate-200 text-slate-500 border-slate-300',
  reassigned: 'bg-amber-100 text-amber-700 border-amber-200',
  completed: 'bg-blue-100 text-blue-700 border-blue-200',
};

export function formatCurrency(value) {
  if (value == null) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCountdown(expiresAt) {
  if (!expiresAt) return '—';
  const diffMs = new Date(expiresAt).getTime() - Date.now();
  if (diffMs <= 0) return 'Expired';
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}h`;
}

export default function AutoAssignQueuePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { session, isAuthenticated } = useSession();

  const membershipSet = useMemo(() => new Set(session?.memberships ?? []), [session?.memberships]);
  const isFreelancer = membershipSet.has('freelancer');
  const canAdministerQueues =
    membershipSet.has('admin') || membershipSet.has('agency') || membershipSet.has('company');
  const canViewQueue = isAuthenticated && (isFreelancer || canAdministerQueues);

  const requestedFreelancerId = searchParams.get('freelancerId');
  const sessionFreelancerId = session?.id != null ? String(session.id) : '';
  const effectiveFreelancerId = isFreelancer ? sessionFreelancerId : requestedFreelancerId ?? '';
  const normalizedFreelancerId = effectiveFreelancerId ? String(effectiveFreelancerId) : '';

  const cacheKey = useMemo(
    () => `auto-assign:queue:${normalizedFreelancerId || 'unassigned'}`,
    [normalizedFreelancerId],
  );
  const shouldFetch = canViewQueue && Boolean(normalizedFreelancerId);

  const { data, error, loading, fromCache, lastUpdated, refresh } = useCachedResource(
    cacheKey,
    ({ signal }) =>
      fetchFreelancerQueue({ freelancerId: normalizedFreelancerId, pageSize: 10, signal }).then((result) => ({
        ...result,
        freelancerId: normalizedFreelancerId,
      })),
    { ttl: 1000 * 30, dependencies: [normalizedFreelancerId], enabled: shouldFetch },
  );

  const entries = useMemo(() => (data?.entries ? data.entries : []), [data]);
  const pagination = data?.pagination ?? { page: 1, totalEntries: 0 };

  const handleFreelancerChange = (event) => {
    if (!canAdministerQueues) return;
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('freelancerId', event.target.value || '');
      return next;
    });
  };

  const renderEntries = () => {
    if (!shouldFetch) {
      return (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white/80 p-10 text-center text-sm text-slate-500">
          {canAdministerQueues
            ? 'Select a freelancer ID to inspect their current auto-assign queue.'
            : 'Your queue will populate automatically once new matches are generated for you.'}
        </div>
      );
    }

    if (!entries.length) {
      return (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white/80 p-10 text-center text-sm text-slate-500">
          {loading
            ? 'Syncing your queue…'
            : 'No auto-assign matches queued yet. Opt into auto-assign to receive curated projects first.'}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {entries.map((entry) => {
          const badgeStyles = STATUS_STYLES[entry.status] ?? STATUS_STYLES.pending;
          const breakdown = entry.breakdown ?? {};
          const projectName = entry.projectName ?? `Project ${entry.targetId}`;
          return (
            <article
              key={entry.id}
              className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-accent/60 hover:shadow-soft"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <UserAvatar name={projectName} seed={`project-${entry.targetId}`} size="sm" showGlow={false} />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Match #{entry.position}</p>
                    <h3 className="text-lg font-semibold text-slate-900">{projectName}</h3>
                    <p className="text-xs text-slate-500">Score {entry.score.toFixed(2)} • priority bucket {entry.priorityBucket}</p>
                  </div>
                </div>
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${badgeStyles}`}>{entry.status}</span>
              </div>

              <div className="mt-4 grid gap-4 text-xs text-slate-600 sm:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-surfaceMuted/70 px-4 py-3">
                  <p className="font-semibold text-slate-500">Payout</p>
                  <p className="mt-1 text-base font-semibold text-slate-900">{formatCurrency(entry.projectValue)}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-surfaceMuted/70 px-4 py-3">
                  <p className="font-semibold text-slate-500">Respond before</p>
                  <p className="mt-1 text-base font-semibold text-slate-900">{formatCountdown(entry.expiresAt)}</p>
                  <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-400">
                    Created {formatRelativeTime(entry.createdAt)}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-surfaceMuted/70 px-4 py-3">
                  <p className="font-semibold text-slate-500">Last assignment wait</p>
                  <p className="mt-1 text-base font-semibold text-slate-900">
                    {breakdown.lastAssignmentDays != null ? `${Math.round(breakdown.lastAssignmentDays)} days` : 'First match'}
                  </p>
                  <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-400">Recency score {breakdown.recencyScore}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-surfaceMuted/70 px-4 py-3">
                  <p className="font-semibold text-slate-500">Completion rate</p>
                  <p className="mt-1 text-base font-semibold text-slate-900">
                    {breakdown.completionRate != null ? `${Math.round(breakdown.completionRate * 100)}%` : '—'}
                  </p>
                  <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-400">
                    Fairness boost {breakdown.newFreelancerScore}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wide text-slate-400">
                {entry.weights
                  ? Object.entries(entry.weights).map(([key, value]) => (
                      <span
                        key={key}
                        className="rounded-full border border-slate-200 bg-surfaceMuted/60 px-3 py-1 text-[10px] font-semibold text-slate-500"
                      >
                        {key.replace(/([A-Z])/g, ' $1')}: {Math.round(value * 100)}%
                      </span>
                    ))
                  : null}
                {entry.metadata?.fairness?.ensuredNewcomer ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-semibold text-emerald-700">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
                    Fairness slot reserved
                  </span>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    );
  };

  return (
    <section className="relative overflow-hidden py-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(191,219,254,0.3),_transparent_65%)]" aria-hidden="true" />
      <div className="absolute -right-24 top-24 h-72 w-72 rounded-full bg-emerald-200/50 blur-[160px]" aria-hidden="true" />
      <div className="absolute -left-16 bottom-16 h-72 w-72 rounded-full bg-accent/20 blur-[140px]" aria-hidden="true" />
      <div className="relative mx-auto max-w-6xl px-6">
        {isAuthenticated ? (
          <PageHeader
            eyebrow="Auto-assign"
            title="Freelancer opportunity queue"
            description={
              canAdministerQueues
                ? 'Operations teams can audit and rebalance queues to guarantee fairness across projects.'
                : 'Ranked matches from the fairness engine give every verified freelancer a chance to own premium work.'
            }
            actions={
              canAdministerQueues ? (
                <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                  <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 shadow-sm">
                    <span className="text-slate-500">Freelancer ID</span>
                    <input
                      type="number"
                      min="1"
                      value={normalizedFreelancerId}
                      onChange={handleFreelancerChange}
                      className="w-24 rounded-full border border-slate-200 bg-transparent px-2 py-1 text-xs focus:border-accent focus:outline-none"
                    />
                  </label>
                </div>
              ) : (
                <div className="rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-xs font-semibold text-slate-500 shadow-sm">
                  ID #{normalizedFreelancerId || sessionFreelancerId}
                </div>
              )
            }
            meta={
              shouldFetch ? (
                <DataStatus
                  loading={loading}
                  fromCache={fromCache}
                  lastUpdated={lastUpdated}
                  onRefresh={() => refresh({ force: true })}
                />
              ) : null
            }
          />
        ) : (
          <PageHeader
            eyebrow="Auto-assign"
            title="Freelancer opportunity queue"
            description="Sign in to review how fairness scoring prioritises opportunities across the network."
          />
        )}

        {!isAuthenticated ? (
          <div className="mt-6 rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-sm">
            <p className="text-sm text-slate-600">
              Please <Link to="/login" className="font-semibold text-accent hover:text-accentDark">sign in</Link> as a verified freelancer or
              operations teammate to view auto-assign queues.
            </p>
          </div>
        ) : null}

        {isAuthenticated && !canViewQueue ? (
          <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-700">
            Auto-assign queues are reserved for freelancer and operations roles. Switch your workspace context to an eligible role to continue.
          </div>
        ) : null}

        {isAuthenticated && canViewQueue && isFreelancer && !normalizedFreelancerId ? (
          <div className="mt-6 rounded-3xl border border-slate-200 bg-white/90 p-6 text-sm text-slate-600">
            Update your profile to finish onboarding. We will begin generating a personalised queue once your freelancer ID is assigned.
          </div>
        ) : null}

        {error && !loading && shouldFetch ? (
          <div className="mb-6 mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            We had trouble syncing the queue. Showing the last cached snapshot. {error.message || 'Please try again shortly.'}
          </div>
        ) : null}

        {isAuthenticated && canViewQueue ? renderEntries() : null}

        {isAuthenticated && canViewQueue ? (
          <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            <span>
              Showing {entries.length} of {pagination.totalEntries} matches. Prioritisation updates automatically when freelancers accept or decline.
            </span>
            <button
              type="button"
              onClick={() => refresh({ force: true })}
              className="rounded-full border border-slate-200 bg-white/80 px-4 py-2 font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
            >
              Refresh queue
            </button>
          </footer>
        ) : null}
      </div>
    </section>
  );
}
