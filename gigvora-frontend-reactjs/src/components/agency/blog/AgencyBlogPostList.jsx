import { formatRelativeTime } from '../../../utils/date.js';

const STATUS_LABELS = {
  draft: { label: 'Draft', tone: 'text-slate-500 bg-slate-100' },
  scheduled: { label: 'Scheduled', tone: 'text-amber-700 bg-amber-100' },
  published: { label: 'Published', tone: 'text-emerald-700 bg-emerald-100' },
  archived: { label: 'Archived', tone: 'text-slate-500 bg-slate-100' },
};

export default function AgencyBlogPostList({
  posts = [],
  onSelect,
  selectedId,
  onDelete,
  onRefresh,
  loading,
  filters,
  onFilterChange,
  onCreate,
  error,
}) {
  const handleFilterChange = (event) => {
    onFilterChange?.({ ...filters, [event.target.name]: event.target.value });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Posts</h2>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onCreate}
            className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark"
          >
            New
          </button>
          <button
            type="button"
            onClick={onRefresh}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
          >
            Reload
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          name="status"
          value={filters?.status ?? 'all'}
          onChange={handleFilterChange}
          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 focus:border-accent focus:outline-none"
        >
          <option value="all">All</option>
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
        <input
          type="search"
          name="search"
          value={filters?.search ?? ''}
          onChange={handleFilterChange}
          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 focus:border-accent focus:outline-none"
        />
      </div>

      {error ? <p className="text-xs text-rose-600">Refresh failed. Try again.</p> : null}

      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : posts.length ? (
        <div className="space-y-2">
          {posts.map((post) => {
            const status = STATUS_LABELS[post.status] ?? STATUS_LABELS.draft;
            const publishedAgo = post.publishedAt
              ? formatRelativeTime(new Date(post.publishedAt))
              : 'Draft';
            return (
              <div
                key={post.id}
                className={`flex flex-col gap-3 rounded-2xl border p-4 transition lg:flex-row lg:items-center lg:justify-between ${
                  selectedId === post.id
                    ? 'border-accent/60 bg-accentSoft shadow-soft'
                    : 'border-slate-200 bg-white hover:border-accent/40 hover:shadow-sm'
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelect?.(post)}
                  className="text-left"
                >
                  <p className="text-sm font-semibold text-slate-900">{post.title}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-wide">
                    <span className={`rounded-full px-3 py-1 ${status.tone}`}>{status.label}</span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-500">
                      {post.category?.name ?? 'Uncategorised'}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-500">{publishedAgo}</span>
                  </div>
                </button>
                <div className="flex items-center gap-2 lg:self-end">
                  <button
                    type="button"
                    onClick={() => onSelect?.(post)}
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete?.(post.id)}
                    className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-slate-500">No posts yet.</p>
      )}
    </div>
  );
}
