import { ChatBubbleLeftRightIcon, EyeIcon, GlobeAltIcon, PaperAirplaneIcon, PencilSquareIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

const STATUS_STYLES = {
  draft: 'bg-slate-100 text-slate-600 border-slate-200',
  scheduled: 'bg-amber-50 text-amber-600 border-amber-200',
  published: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  archived: 'bg-rose-50 text-rose-600 border-rose-200',
};

const VISIBILITY_ICONS = {
  public: GlobeAltIcon,
  connections: ChatBubbleLeftRightIcon,
  private: EyeIcon,
};

function TagList({ items }) {
  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {items.map((item) => (
        <span key={item.id ?? item} className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          {item.label ?? item}
        </span>
      ))}
    </div>
  );
}

export default function TimelinePostsView({ posts, onCreatePost, onOpenPost, onPublish, onDeletePost }) {
  const safePosts = Array.isArray(posts) ? posts : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-900">Post library</h3>
        <button
          type="button"
          onClick={onCreatePost}
          className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-blue-700"
        >
          <PlusIcon className="h-4 w-4" />
          <span>New post</span>
        </button>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {safePosts.map((post) => {
          const statusClass = STATUS_STYLES[post.status] ?? STATUS_STYLES.draft;
          const VisibilityIcon = VISIBILITY_ICONS[post.visibility] ?? GlobeAltIcon;
          return (
            <article
              key={post.id}
              className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-soft transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg"
            >
              <header className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-base font-semibold text-slate-900">{post.title}</h4>
                  <p className="mt-1 text-sm text-slate-500">{post.summary}</p>
                </div>
                <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${statusClass}`}>
                  {post.status}
                </span>
              </header>
              <div className="mt-4 space-y-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <div className="flex items-center gap-2 text-slate-500">
                  <VisibilityIcon className="h-4 w-4" />
                  <span>{post.visibility}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <PaperAirplaneIcon className="h-4 w-4" />
                  <span>
                    {post.publishedAt
                      ? new Date(post.publishedAt).toLocaleString()
                      : post.scheduledAt
                        ? `Scheduled ${new Date(post.scheduledAt).toLocaleString()}`
                        : 'No schedule'}
                  </span>
                </div>
              </div>
              <TagList items={post.tags} />
              <footer className="mt-6 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onOpenPost(post, 'edit')}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600"
                >
                  <PencilSquareIcon className="h-4 w-4" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onOpenPost(post, 'metrics')}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600"
                >
                  <ChatBubbleLeftRightIcon className="h-4 w-4" />
                  Metrics
                </button>
                {post.status !== 'published' ? (
                  <button
                    type="button"
                    onClick={() => onPublish(post)}
                    className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
                  >
                    <PaperAirplaneIcon className="h-4 w-4" />
                    Publish
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => onDeletePost(post)}
                  className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-100"
                >
                  <TrashIcon className="h-4 w-4" />
                  Delete
                </button>
              </footer>
            </article>
          );
        })}
      </div>
      {safePosts.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/60 p-12 text-center text-sm font-semibold uppercase tracking-wide text-slate-400">
          No posts yet
        </div>
      ) : null}
    </div>
  );
}
