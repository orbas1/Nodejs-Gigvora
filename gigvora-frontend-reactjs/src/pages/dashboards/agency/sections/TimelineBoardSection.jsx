import PropTypes from 'prop-types';
import {
  CalendarIcon,
  ClockIcon,
  EyeIcon,
  PencilIcon,
  PlayCircleIcon,
  ArrowUpTrayIcon,
  ArchiveBoxIcon,
} from '@heroicons/react/24/outline';

const STATUS_LABELS = {
  draft: 'Draft',
  scheduled: 'Queued',
  published: 'Live',
  archived: 'Done',
};

const STATUS_ACCENTS = {
  draft: 'bg-slate-100 text-slate-700 border-slate-200',
  scheduled: 'bg-amber-50 text-amber-700 border-amber-200',
  published: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  archived: 'bg-slate-50 text-slate-500 border-slate-200',
};

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

function PostCard({ post, onEdit, onStatusChange, onViewAnalytics, onArchive }) {
  const actions = [];
  if (post.status === 'draft') {
    actions.push({
      label: 'Live',
      icon: PlayCircleIcon,
      onClick: () => onStatusChange(post, { status: 'published' }),
    });
    actions.push({
      label: 'Queue',
      icon: CalendarIcon,
      onClick: () => onStatusChange(post, { status: 'scheduled' }),
    });
  } else if (post.status === 'scheduled') {
    actions.push({
      label: 'Live',
      icon: PlayCircleIcon,
      onClick: () => onStatusChange(post, { status: 'published' }),
    });
    actions.push({
      label: 'Resched',
      icon: CalendarIcon,
      onClick: () => onStatusChange(post, { status: 'scheduled', allowReschedule: true }),
    });
  } else if (post.status === 'published') {
    actions.push({
      label: 'Archive',
      icon: ArchiveBoxIcon,
      onClick: () => onArchive(post),
    });
  }

  return (
    <article className="flex h-full flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <header className="flex items-start justify-between gap-2">
        <div>
          <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] ${STATUS_ACCENTS[post.status]}`}>
            {STATUS_LABELS[post.status] || post.status}
          </span>
          <h3 className="mt-3 line-clamp-2 text-base font-semibold text-slate-900">{post.title}</h3>
          {post.excerpt ? <p className="mt-1 line-clamp-2 text-sm text-slate-600">{post.excerpt}</p> : null}
        </div>
        <button
          type="button"
          onClick={() => onEdit(post)}
          className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
        >
          <PencilIcon className="h-4 w-4" />
          Edit
        </button>
      </header>

      <div className="space-y-2 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-slate-400" />
          <span>Queue: {formatDate(post.scheduledAt)}</span>
        </div>
        <div className="flex items-center gap-2">
          <ClockIcon className="h-4 w-4 text-slate-400" />
          <span>Live: {formatDate(post.publishedAt)}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <EyeIcon className="h-4 w-4 text-slate-400" />
          <span>
            {post.analytics.impressions.toLocaleString()} views ·
            {' '}
            {post.analytics.engagementRate ? `${(post.analytics.engagementRate * 100).toFixed(1)}%` : '—'}
            {' '}eng
          </span>
        </div>
        {post.tags?.length ? (
          <div className="flex flex-wrap items-center gap-2">
            <ArrowUpTrayIcon className="h-4 w-4 text-slate-400" />
            <div className="flex flex-wrap items-center gap-1">
              {post.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <footer className="mt-auto flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onViewAnalytics(post)}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accentDark"
        >
          <EyeIcon className="h-4 w-4" />
          Insights
        </button>
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={action.onClick}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accentDark"
          >
            <action.icon className="h-4 w-4" />
            {action.label}
          </button>
        ))}
      </footer>
    </article>
  );
}

PostCard.propTypes = {
  post: PropTypes.shape({
    id: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    excerpt: PropTypes.string,
    status: PropTypes.string.isRequired,
    scheduledAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    publishedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    tags: PropTypes.arrayOf(PropTypes.string),
    analytics: PropTypes.shape({
      impressions: PropTypes.number,
      engagementRate: PropTypes.number,
    }).isRequired,
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onStatusChange: PropTypes.func.isRequired,
  onViewAnalytics: PropTypes.func.isRequired,
  onArchive: PropTypes.func.isRequired,
};

export default function TimelineBoardSection({ columns, onCreate, onEdit, onStatusChange, onViewAnalytics, onArchive, loading }) {
  return (
    <section className="space-y-6" aria-labelledby="timeline-board-heading">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="timeline-board-heading" className="text-xl font-semibold text-slate-900">
          Planner
        </h2>
        <button
          type="button"
          onClick={onCreate}
          className="inline-flex items-center gap-2 rounded-full border border-accent bg-white px-4 py-2 text-sm font-semibold text-accent transition hover:bg-accent hover:text-white"
        >
          <PencilIcon className="h-4 w-4" />
          Compose
        </button>
      </div>

      <div className="overflow-hidden rounded-4xl border border-slate-200 bg-slate-50/60">
        <div className="grid auto-cols-[minmax(18rem,1fr)] grid-flow-col gap-4 overflow-x-auto p-4">
          {columns.map((column) => (
            <div key={column.status} className="flex h-full min-h-[22rem] flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-4">
              <header className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                    {STATUS_LABELS[column.status] ?? column.status}
                  </p>
                  <p className="text-xs text-slate-400">{column.items.length} item{column.items.length === 1 ? '' : 's'}</p>
                </div>
              </header>
              <div className="flex flex-1 flex-col gap-3">
                {column.items.length ? (
                  column.items.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onEdit={onEdit}
                      onStatusChange={onStatusChange}
                      onViewAnalytics={onViewAnalytics}
                      onArchive={onArchive}
                    />
                  ))
                ) : (
                  <div className="flex flex-1 items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-400">
                    Empty stage
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      {loading ? <p className="text-xs text-slate-400">Loading…</p> : null}
    </section>
  );
}

TimelineBoardSection.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      status: PropTypes.string.isRequired,
      items: PropTypes.arrayOf(PropTypes.object).isRequired,
    }),
  ),
  onCreate: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onStatusChange: PropTypes.func.isRequired,
  onViewAnalytics: PropTypes.func.isRequired,
  onArchive: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};

TimelineBoardSection.defaultProps = {
  columns: [],
  loading: false,
};
