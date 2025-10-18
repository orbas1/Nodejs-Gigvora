import { useState } from 'react';

const FOLLOWER_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'blocked', label: 'Blocked' },
];

function formatDate(value) {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function CompanyFollowersManager({ followers, onAddFollower, onUpdateFollower, onRemoveFollower }) {
  const [formState, setFormState] = useState({ email: '', status: 'active', notificationsEnabled: true });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formState.email) {
      return;
    }
    try {
      setSubmitting(true);
      await onAddFollower?.({
        email: formState.email,
        status: formState.status,
        notificationsEnabled: formState.notificationsEnabled,
      });
      setFormState({ email: '', status: 'active', notificationsEnabled: true });
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = (followerId, status) => {
    onUpdateFollower?.(followerId, { status });
  };

  const handleNotificationToggle = (followerId, enabled) => {
    onUpdateFollower?.(followerId, { notificationsEnabled: enabled });
  };

  const handleRemove = (followerId) => {
    if (window.confirm('Remove this follower?')) {
      onRemoveFollower?.(followerId);
    }
  };

  return (
    <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold text-slate-900">Fans</h2>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:grid-cols-[minmax(0,1fr)_160px_auto] sm:items-end">
        <div className="space-y-1.5">
          <label htmlFor="new-follower-email" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Follower email
          </label>
          <input
            id="new-follower-email"
            type="email"
            required
            value={formState.email}
            onChange={(event) => setFormState((current) => ({ ...current, email: event.target.value }))}
            placeholder="collaborator@example.com"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="new-follower-status" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Status
            </label>
            <select
              id="new-follower-status"
              value={formState.status}
              onChange={(event) => setFormState((current) => ({ ...current, status: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              {FOLLOWER_STATUSES.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Notifications</span>
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={formState.notificationsEnabled}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, notificationsEnabled: event.target.checked }))
                }
                className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent/40"
              />
              Email updates
            </label>
          </div>
        </div>
        <button
          type="submit"
          disabled={submitting || !formState.email}
          className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Adding…' : 'Add follower'}
        </button>
      </form>

      <div className="overflow-hidden rounded-2xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Follower
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Status
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Notifications
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Added
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {followers.length ? (
              followers.map((follower) => (
                <tr key={follower.followerId} className="align-top">
                  <td className="px-4 py-3 text-sm text-slate-700">
                    <div className="font-semibold text-slate-900">{follower.follower?.name ?? follower.follower?.email}</div>
                    <div className="text-xs text-slate-500">{follower.follower?.email ?? '—'}</div>
                    {follower.follower?.profile?.headline ? (
                      <div className="text-xs text-slate-500">{follower.follower.profile.headline}</div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <select
                      value={follower.status}
                      onChange={(event) => handleStatusUpdate(follower.followerId, event.target.value)}
                      className="rounded-lg border border-slate-200 px-2 py-1 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                    >
                      {FOLLOWER_STATUSES.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={Boolean(follower.notificationsEnabled)}
                        onChange={(event) => handleNotificationToggle(follower.followerId, event.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent/40"
                      />
                      Email alerts
                    </label>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{formatDate(follower.createdAt)}</td>
                  <td className="px-4 py-3 text-right text-sm">
                    <button
                      type="button"
                      onClick={() => handleRemove(follower.followerId)}
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-rose-300 hover:text-rose-600"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                  No fans yet. Invite teammates to follow updates.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
