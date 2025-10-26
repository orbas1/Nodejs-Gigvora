import { useMemo } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import { BoltIcon, ChartBarIcon, ClockIcon, UsersIcon } from '@heroicons/react/24/outline';
import ConnectionProfileCard from './ConnectionProfileCard.jsx';

function normaliseDate(value) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.getTime();
}

function sortConnections(connections, order) {
  const list = [...connections];
  const safeScore = (value) => {
    if (value === null || value === undefined) {
      return 0;
    }
    return Number(value) || 0;
  };
  const safeMutual = (value) => (typeof value === 'number' ? value : Number(value) || 0);

  switch (order) {
    case 'mutual':
      return list.sort((a, b) => safeMutual(b.mutualConnections) - safeMutual(a.mutualConnections));
    case 'recent':
      return list.sort((a, b) => {
        const first = normaliseDate(b.lastInteractionAt) ?? 0;
        const second = normaliseDate(a.lastInteractionAt) ?? 0;
        return first - second;
      });
    case 'new':
      return list.sort((a, b) => {
        const first = normaliseDate(b.connectedAt ?? b.createdAt) ?? 0;
        const second = normaliseDate(a.connectedAt ?? a.createdAt) ?? 0;
        return first - second;
      });
    default:
      return list.sort((a, b) => safeScore(b.score ?? b.trustScore) - safeScore(a.score ?? a.trustScore));
  }
}

function computeNetworkStats(segments) {
  const totals = segments.reduce(
    (accumulator, segment) => {
      const connections = segment.connections ?? [];
      const recentConnections = connections.filter((connection) => {
        const timestamp = normaliseDate(connection.connectedAt ?? connection.createdAt);
        if (!timestamp) {
          return false;
        }
        const thirtyDays = 1000 * 60 * 60 * 24 * 30;
        return Date.now() - timestamp <= thirtyDays;
      });
      const responseRates = connections
        .map((connection) => Number(connection.responseRate))
        .filter((rate) => !Number.isNaN(rate));

      accumulator.total += connections.length;
      accumulator.newThisMonth += recentConnections.length;
      if (responseRates.length) {
        const sum = responseRates.reduce((total, rate) => total + rate, 0);
        accumulator.responseRateSamples.push(sum / responseRates.length);
      }
      return accumulator;
    },
    { total: 0, newThisMonth: 0, responseRateSamples: [] },
  );

  const averageResponse = totals.responseRateSamples.length
    ? Math.round(
        (totals.responseRateSamples.reduce((sum, sample) => sum + sample, 0) /
          totals.responseRateSamples.length) *
          10,
      ) / 10
    : '—';

  return {
    total: totals.total,
    newThisMonth: totals.newThisMonth,
    averageResponse,
  };
}

export default function ConnectionsGrid({
  segments,
  activeSegment,
  onSegmentChange,
  sortOrder,
  onSortChange,
  onConnect,
  onMessage,
  onBookmark,
  submittingId,
  bookmarkedIds,
}) {
  const preparedSegments = useMemo(
    () =>
      segments.map((segment) => ({
        ...segment,
        connections: sortConnections(segment.connections ?? [], sortOrder),
      })),
    [segments, sortOrder],
  );

  const stats = useMemo(() => computeNetworkStats(preparedSegments), [preparedSegments]);
  const active = preparedSegments.find((segment) => segment.id === activeSegment) ?? preparedSegments[0];
  const connections = active?.connections ?? [];

  return (
    <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
      <header className="grid gap-4 sm:grid-cols-[minmax(0,1fr),auto] sm:items-start">
        <div>
          <p className="text-sm font-semibold text-slate-900">Relationship intelligence</p>
          <p className="mt-1 text-xs text-slate-500">
            Track high-value partners, mutual allies, and introduction paths across every degree of your network.
          </p>
        </div>
        <dl className="grid gap-4 text-xs text-slate-500 sm:auto-cols-max sm:grid-flow-col sm:items-center">
          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <dt className="flex items-center gap-2 font-semibold text-slate-600">
              <UsersIcon className="h-4 w-4 text-accent" aria-hidden="true" /> Total reach
            </dt>
            <dd className="mt-1 text-sm font-semibold text-slate-900">{stats.total}</dd>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <dt className="flex items-center gap-2 font-semibold text-slate-600">
              <BoltIcon className="h-4 w-4 text-amber-500" aria-hidden="true" /> New last 30 days
            </dt>
            <dd className="mt-1 text-sm font-semibold text-slate-900">{stats.newThisMonth}</dd>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <dt className="flex items-center gap-2 font-semibold text-slate-600">
              <ChartBarIcon className="h-4 w-4 text-emerald-500" aria-hidden="true" /> Avg. response
            </dt>
            <dd className="mt-1 text-sm font-semibold text-emerald-600">{stats.averageResponse}{stats.averageResponse !== '—' ? '%' : ''}</dd>
          </div>
        </dl>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          {preparedSegments.map((segment) => {
            const isActive = segment.id === (active?.id ?? activeSegment);
            return (
              <button
                key={segment.id}
                type="button"
                onClick={() => onSegmentChange?.(segment.id)}
                className={clsx(
                  'inline-flex items-center gap-2 rounded-full border px-4 py-2 transition focus:outline-none focus:ring-2 focus:ring-offset-2',
                  isActive
                    ? 'border-accent bg-accent text-white focus:ring-accent/40'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:text-slate-800 focus:ring-slate-200',
                )}
              >
                <span>{segment.title}</span>
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px]">{segment.connections?.length ?? 0}</span>
              </button>
            );
          })}
        </nav>
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          <ClockIcon className="h-4 w-4" aria-hidden="true" />
          <label className="inline-flex items-center gap-2">
            Sort
            <select
              value={sortOrder}
              onChange={(event) => onSortChange?.(event.target.value)}
              className="rounded-full border border-transparent bg-white px-3 py-1 text-[11px] text-slate-600 focus:border-accent focus:outline-none"
            >
              <option value="recommended">Recommended</option>
              <option value="mutual">Most mutual</option>
              <option value="recent">Recent touchpoints</option>
              <option value="new">Newest added</option>
            </select>
          </label>
        </div>
      </div>

      {active?.description ? (
        <p className="text-xs text-slate-500">{active.description}</p>
      ) : null}

      {connections.length ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {connections.map((connection) => (
            <ConnectionProfileCard
              key={connection.id}
              connection={connection}
              onConnect={onConnect}
              onMessage={onMessage}
              onBookmark={onBookmark}
              isSubmitting={submittingId === connection.id}
              isBookmarked={Boolean(bookmarkedIds?.has?.(connection.id))}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
          <p className="font-semibold text-slate-700">No matches yet</p>
          <p className="mt-2 text-slate-500">
            Expand your search filters or reach out to shared collaborators to unlock this tier of your network.
          </p>
        </div>
      )}
    </section>
  );
}

ConnectionsGrid.propTypes = {
  segments: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      description: PropTypes.string,
      connections: PropTypes.arrayOf(PropTypes.object),
    }),
  ),
  activeSegment: PropTypes.string,
  onSegmentChange: PropTypes.func,
  sortOrder: PropTypes.string,
  onSortChange: PropTypes.func,
  onConnect: PropTypes.func,
  onMessage: PropTypes.func,
  onBookmark: PropTypes.func,
  submittingId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  bookmarkedIds: PropTypes.instanceOf(Set),
};

ConnectionsGrid.defaultProps = {
  segments: [],
  activeSegment: undefined,
  onSegmentChange: undefined,
  sortOrder: 'recommended',
  onSortChange: undefined,
  onConnect: undefined,
  onMessage: undefined,
  onBookmark: undefined,
  submittingId: undefined,
  bookmarkedIds: undefined,
};
