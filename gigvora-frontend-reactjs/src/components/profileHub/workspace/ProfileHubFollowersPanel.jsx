import { UserPlusIcon, EllipsisHorizontalCircleIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import UserAvatar from '../../UserAvatar.jsx';

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function ProfileHubFollowersPanel({
  stats,
  followers,
  addForm,
  onChangeAddForm,
  onAdd,
  onOpenFollower,
  onRemove,
  busyId,
  layout = 'default',
}) {
  const fieldClass = clsx(
    'mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none',
    layout === 'modal' ? 'bg-white' : 'bg-white/80',
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-3 rounded-3xl border border-slate-200 bg-white/80 p-4 text-center text-sm text-slate-600 shadow-sm md:grid-cols-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">Total</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{stats.total ?? 0}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">Active</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-600">{stats.active ?? 0}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">Muted</p>
          <p className="mt-1 text-2xl font-semibold text-amber-600">{stats.muted ?? 0}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">Blocked</p>
          <p className="mt-1 text-2xl font-semibold text-rose-600">{stats.blocked ?? 0}</p>
        </div>
      </div>

      <form
        className="rounded-3xl border border-dashed border-slate-200 bg-white/60 p-4 shadow-inner"
        onSubmit={(event) => {
          event.preventDefault();
          if (!addForm.identifier?.trim()) {
            return;
          }
          onAdd();
        }}
      >
        <div className="flex items-center gap-3">
          <UserPlusIcon className="h-6 w-6 text-accent" />
          <p className="text-sm font-semibold text-slate-700">Add follower</p>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="text-sm font-medium text-slate-600">
            Email or ID
            <input
              type="text"
              value={addForm.identifier}
              onChange={(event) => onChangeAddForm({ ...addForm, identifier: event.target.value })}
              className={fieldClass}
              placeholder="email@example.com"
              required
            />
          </label>
          <label className="text-sm font-medium text-slate-600">
            Display name
            <input
              type="text"
              value={addForm.displayName}
              onChange={(event) => onChangeAddForm({ ...addForm, displayName: event.target.value })}
              className={fieldClass}
              placeholder="Optional"
            />
          </label>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="text-sm font-medium text-slate-600">
            Tags
            <input
              type="text"
              value={addForm.tags}
              onChange={(event) => onChangeAddForm({ ...addForm, tags: event.target.value })}
              className={fieldClass}
              placeholder="Comma separated"
            />
          </label>
          <label className="text-sm font-medium text-slate-600">
            Notes
            <input
              type="text"
              value={addForm.notes}
              onChange={(event) => onChangeAddForm({ ...addForm, notes: event.target.value })}
              className={fieldClass}
              placeholder="Optional"
            />
          </label>
        </div>
        <button
          type="submit"
          className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accent/90"
        >
          Add
        </button>
      </form>

      <div className="rounded-3xl border border-slate-200 bg-white/80 shadow-sm">
        <div className="hidden grid-cols-[minmax(0,1fr)_80px_80px] gap-3 border-b border-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid">
          <div>Name</div>
          <div>Status</div>
          <div>Last touch</div>
        </div>
        <div className="divide-y divide-slate-100">
          {followers.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-slate-500">No followers yet.</p>
          ) : (
            followers.map((follower) => {
              const isBusy = busyId === follower.followerId;
              return (
                <div
                  key={follower.id ?? follower.followerId}
                  className="grid gap-3 px-4 py-3 md:grid-cols-[minmax(0,1fr)_80px_80px_auto] md:items-center"
                >
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      name={follower.summary?.name}
                      imageUrl={follower.summary?.avatarUrl}
                      seed={follower.summary?.avatarSeed}
                      size="sm"
                      showGlow={false}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {follower.summary?.name ?? `Follower #${follower.followerId}`}
                      </p>
                      <p className="truncate text-xs text-slate-500">{follower.summary?.headline ?? follower.summary?.userType ?? 'Member'}</p>
                    </div>
                  </div>
                  <div className="text-sm font-medium capitalize text-slate-600">{follower.status}</div>
                  <div className="text-sm text-slate-500">{formatDate(follower.lastInteractedAt)}</div>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenFollower(follower)}
                      className="inline-flex items-center gap-1 rounded-2xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-accent hover:text-accent"
                    >
                      <EllipsisHorizontalCircleIcon className="h-4 w-4" /> Open
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemove(follower.followerId)}
                      disabled={isBusy}
                      className="inline-flex items-center gap-1 rounded-2xl border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
