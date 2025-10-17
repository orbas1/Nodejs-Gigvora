function initials(value) {
  return value
    .toString()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .join('')
    .slice(0, 2) || 'GV';
}

export default function NetworkPreviewCard({ followers = [], onOpenFollowers }) {
  const preview = followers.slice(0, 6);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <p className="text-sm font-semibold text-slate-900">Followers</p>
          <div className="flex flex-wrap gap-3">
            {preview.length === 0 ? (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">No followers yet</span>
            ) : (
              preview.map((follower) => (
                <span
                  key={follower.id || follower.email || follower.name}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700"
                >
                  {follower.initials || initials(follower.name || follower.email || '')}
                </span>
              ))
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenFollowers}
          className="rounded-full bg-slate-900 px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
        >
          Followers
        </button>
      </div>
    </div>
  );
}
