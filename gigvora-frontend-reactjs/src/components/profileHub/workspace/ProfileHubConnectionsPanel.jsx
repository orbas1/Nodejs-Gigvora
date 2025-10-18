import { StarIcon, EllipsisHorizontalCircleIcon } from '@heroicons/react/24/outline';
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

export default function ProfileHubConnectionsPanel({
  connections,
  pending,
  onOpenConnection,
  onToggleFavourite,
  busyId,
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-3 rounded-3xl border border-slate-200 bg-white/80 p-4 text-center text-sm text-slate-600 shadow-sm md:grid-cols-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">Connections</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{connections.length}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">Pending</p>
          <p className="mt-1 text-2xl font-semibold text-amber-600">{pending.length}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">Favourite</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-600">
            {connections.filter((connection) => connection.favourite).length}
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white/80 shadow-sm">
        <div className="hidden grid-cols-[minmax(0,1.5fr)_120px_80px_auto] gap-3 border-b border-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 lg:grid">
          <div>Name</div>
          <div>Tag</div>
          <div>Last</div>
          <div className="text-right">Actions</div>
        </div>
        <div className="divide-y divide-slate-100">
          {connections.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-slate-500">No connections yet.</p>
          ) : (
            connections.map((connection) => {
              const isBusy = busyId === connection.id;
              return (
                <div
                  key={connection.id}
                  className="grid gap-3 px-4 py-3 lg:grid-cols-[minmax(0,1.5fr)_120px_80px_auto] lg:items-center"
                >
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      name={connection.counterpart?.name}
                      imageUrl={connection.counterpart?.avatarUrl}
                      seed={connection.counterpart?.avatarSeed}
                      size="sm"
                      showGlow={false}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {connection.counterpart?.name ?? 'Connection'}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {connection.counterpart?.headline ?? connection.counterpart?.userType ?? 'Member'}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-500">{connection.relationshipTag ?? '—'}</p>
                  <p className="text-sm text-slate-500">{formatDate(connection.lastInteractedAt)}</p>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => onToggleFavourite(connection)}
                      disabled={isBusy}
                      className={clsx(
                        'inline-flex items-center gap-1 rounded-2xl border px-3 py-1.5 text-xs font-medium transition',
                        connection.favourite
                          ? 'border-amber-200 bg-amber-50 text-amber-700'
                          : 'border-slate-200 text-slate-600 hover:border-amber-200 hover:text-amber-600',
                      )}
                    >
                      <StarIcon className="h-4 w-4" />
                      {connection.favourite ? 'Starred' : 'Star'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenConnection(connection)}
                      className="inline-flex items-center gap-1 rounded-2xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-accent hover:text-accent"
                    >
                      <EllipsisHorizontalCircleIcon className="h-4 w-4" /> Open
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
