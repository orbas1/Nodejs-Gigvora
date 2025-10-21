import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import UserAvatar from '../../UserAvatar.jsx';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'muted', label: 'Muted' },
  { value: 'blocked', label: 'Blocked' },
];

function formatFollowerName(follower) {
  return follower?.user?.name ?? follower?.user?.email ?? `User ${follower?.followerId}`;
}

function formatFollowedAt(value) {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleDateString();
}

export default function AgencyFollowersPanel({
  followers,
  loading = false,
  error,
  onRefresh,
  onPageChange,
  onUpdateFollower,
  onRemoveFollower,
  pendingUpdates = {},
}) {
  const items = followers?.items ?? [];
  const pagination = followers?.pagination ?? { limit: 25, offset: 0, total: items.length };
  const hasMore = pagination.offset + items.length < (pagination.total ?? items.length);

  const handleStatusChange = (followerId, status) => {
    if (!status || typeof onUpdateFollower !== 'function') {
      return;
    }
    onUpdateFollower(followerId, { status });
  };

  const handleNotificationToggle = (followerId, checked) => {
    if (typeof onUpdateFollower !== 'function') {
      return;
    }
    onUpdateFollower(followerId, { notificationsEnabled: checked });
  };

  const handleRemove = (followerId) => {
    if (typeof onRemoveFollower !== 'function') {
      return;
    }
    const confirmRemoval =
      typeof window !== 'undefined'
        ? window.confirm('Remove this follower? They will need to follow again to receive updates.')
        : true;
    if (confirmRemoval) {
      onRemoveFollower(followerId);
    }
  };

  return (
    <section
      id="agency-followers"
      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
      aria-labelledby="agency-followers-heading"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 id="agency-followers-heading" className="text-xl font-semibold text-slate-900">
            Followers
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Refresh
          </button>
        </div>
      </div>
      {error ? (
        <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</p>
      ) : null}
      <div className="mt-6 space-y-4">
        {items.length === 0 && !loading ? (
          <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
            No followers yet.
          </p>
        ) : null}
        {items.map((follower) => {
          const followerId = follower.followerId ?? follower.id;
          const busy = Boolean(pendingUpdates[followerId]);
          return (
            <article
              key={`follower-${followerId}`}
              className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex flex-1 items-center gap-4">
                <UserAvatar
                  name={formatFollowerName(follower)}
                  imageUrl={follower?.user?.avatarUrl}
                  seed={follower?.user?.avatarSeed ?? formatFollowerName(follower)}
                  size="md"
                />
                <div>
                  <p className="text-sm font-semibold text-slate-900">{formatFollowerName(follower)}</p>
                  <p className="text-xs text-slate-500">Following since {formatFollowedAt(follower.followedAt)}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="rounded-full bg-white/80 px-2 py-0.5">{follower.status ?? 'active'}</span>
                    {follower?.user?.email ? <span>{follower.user.email}</span> : null}
                    {follower?.user?.location ? <span>{follower.user.location}</span> : null}
                    <Link
                      to={`/profile/${followerId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-transparent px-2 py-0.5 font-semibold text-accent transition hover:border-accent hover:bg-accent/10"
                    >
                      View profile
                    </Link>
                  </div>
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Notifications
                  <input
                    type="checkbox"
                    checked={Boolean(follower.notificationsEnabled)}
                    onChange={(event) => handleNotificationToggle(followerId, event.target.checked)}
                    disabled={busy || loading}
                    className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent/30"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                  <select
                    value={follower.status ?? 'active'}
                    onChange={(event) => handleStatusChange(followerId, event.target.value)}
                    disabled={busy || loading}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  onClick={() => handleRemove(followerId)}
                  disabled={busy || loading}
                  className="inline-flex items-center justify-center rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Remove
                </button>
              </div>
            </article>
          );
        })}
      </div>
      <div className="mt-6 flex items-center justify-between">
        <p className="text-xs text-slate-500">
          Showing {pagination.offset + Math.min(items.length, pagination.limit)} of {pagination.total ?? items.length} followers.
        </p>
        {hasMore ? (
          <button
            type="button"
            onClick={() => onPageChange?.(pagination.offset + pagination.limit)}
            disabled={loading}
            className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Load more
          </button>
        ) : null}
      </div>
    </section>
  );
}

AgencyFollowersPanel.propTypes = {
  followers: PropTypes.shape({
    items: PropTypes.array,
    pagination: PropTypes.shape({
      limit: PropTypes.number,
      offset: PropTypes.number,
      total: PropTypes.number,
    }),
  }),
  loading: PropTypes.bool,
  error: PropTypes.string,
  onRefresh: PropTypes.func,
  onPageChange: PropTypes.func,
  onUpdateFollower: PropTypes.func,
  onRemoveFollower: PropTypes.func,
  pendingUpdates: PropTypes.object,
};

AgencyFollowersPanel.defaultProps = {
  followers: undefined,
  loading: false,
  error: undefined,
  onRefresh: undefined,
  onPageChange: undefined,
  onUpdateFollower: undefined,
  onRemoveFollower: undefined,
  pendingUpdates: undefined,
};
