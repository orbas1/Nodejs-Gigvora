import { ArrowPathIcon } from '@heroicons/react/24/outline';

function formatStatus(status) {
  if (!status) {
    return 'Unknown';
  }
  const normalised = `${status}`.toLowerCase();
  switch (normalised) {
    case 'draft':
      return 'Draft';
    case 'scheduled':
      return 'Scheduled';
    case 'published':
      return 'Published';
    case 'archived':
      return 'Archived';
    default:
      return normalised.charAt(0).toUpperCase() + normalised.slice(1);
  }
}

export default function BlogPostLibrary({
  posts,
  selectedPostId,
  onSelect,
  onRefresh,
  loading,
  onExpand,
  onCloseFullscreen,
  isFullscreen = false,
}) {
  const sectionClass = `rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm ${
    isFullscreen ? 'h-full max-h-full overflow-y-auto' : ''
  }`;

  return (
    <section id="library" className={sectionClass}>
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold text-slate-900">Posts</h2>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin text-accent' : ''}`} />
            Refresh
          </button>
          {isFullscreen ? (
            <button
              type="button"
              onClick={onCloseFullscreen}
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-accent hover:text-accent"
            >
              Close view
            </button>
          ) : (
            <button
              type="button"
              onClick={onExpand}
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-accent hover:text-accent"
            >
              Full view
            </button>
          )}
        </div>
      </header>

      {loading ? (
        <div className="mt-6 space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="animate-pulse rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div className="h-4 w-2/3 rounded-full bg-slate-200" />
              <div className="mt-2 h-3 w-1/3 rounded-full bg-slate-200" />
            </div>
          ))}
        </div>
      ) : null}

      {!loading && posts.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">No posts yet.</p>
      ) : null}

      {!loading && posts.length ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {posts.map((post) => {
            const isSelected = Number(selectedPostId) === Number(post.id);
            const publishedDate = post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : 'Not published';
            return (
              <button
                key={post.id}
                type="button"
                onClick={() => onSelect(post)}
                className={`rounded-2xl border px-4 py-3 text-left transition ${
                  isSelected ? 'border-accent/60 bg-accentSoft shadow-soft' : 'border-slate-200 bg-white hover:border-accent/40 hover:shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{post.title}</p>
                    <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
                      {formatStatus(post.status)} · {post.category?.name ?? 'Uncategorised'}
                    </p>
                  </div>
                  {post.metrics?.totalViews ? (
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                      {post.metrics.totalViews.toLocaleString()} views
                    </span>
                  ) : null}
                </div>
                {post.excerpt ? (
                  <p className="mt-2 line-clamp-2 text-xs text-slate-500">{post.excerpt}</p>
                ) : null}
                <p className="mt-2 text-xs text-slate-400">{publishedDate}</p>
              </button>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
