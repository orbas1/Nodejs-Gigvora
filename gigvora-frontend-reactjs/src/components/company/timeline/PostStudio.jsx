import PropTypes from 'prop-types';
import {
  BoltIcon,
  ChartBarIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import StatusPill from './StatusPill.jsx';
import { formatAbsolute, formatRelativeTime } from '../../../utils/date.js';

const STATUS_TONES = {
  draft: 'slate',
  scheduled: 'amber',
  published: 'green',
  archived: 'rose',
};

const VISIBILITY_TONES = {
  workspace: 'blue',
  public: 'violet',
  private: 'slate',
};

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
];

function formatNumber(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '0';
  }
  return Number(value).toLocaleString();
}

function PostCard({ post, onOpen, onDelete, onStatusChange, onRecordMetrics }) {
  const totals = post.metricsSummary?.totals ?? {};
  const status = post.status ?? 'draft';
  const visibility = post.visibility ?? 'workspace';
  const lastMetric = post.metricsSummary?.lastMetricAt;
  const publishedAt = post.publishedAt ?? post.scheduledFor;

  return (
    <article
      className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-white px-4 py-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <header className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">{post.title}</h3>
            {publishedAt ? (
              <p className="mt-1 text-xs text-slate-500">
                {status === 'draft' ? 'Drafted' : 'Live'} {formatRelativeTime(publishedAt)}
                <span className="ml-1 text-[11px] text-slate-400">({formatAbsolute(publishedAt)})</span>
              </p>
            ) : null}
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusPill tone={STATUS_TONES[status] ?? 'slate'}>{status}</StatusPill>
            <StatusPill tone={VISIBILITY_TONES[visibility] ?? 'slate'}>{visibility}</StatusPill>
          </div>
        </div>
        {post.summary ? <p className="text-sm text-slate-600">{post.summary}</p> : null}
        {Array.isArray(post.tags) && post.tags.length ? (
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
                #{tag}
              </span>
            ))}
          </div>
        ) : null}
      </header>

      <dl className="mt-4 grid gap-3 rounded-2xl bg-slate-50/60 p-3 text-xs text-slate-600">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-500">Impressions</span>
          <span className="text-slate-900">{formatNumber(totals.impressions)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-500">Engagements</span>
          <span className="text-slate-900">{formatNumber(totals.engagements)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-500">Engagement rate</span>
          <span className="text-slate-900">{totals.engagementRate != null ? `${totals.engagementRate}%` : '—'}</span>
        </div>
        {lastMetric ? (
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-500">Last update</span>
            <span className="text-slate-900">{formatAbsolute(lastMetric, { dateStyle: 'medium' })}</span>
          </div>
        ) : null}
      </dl>

      <footer className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onOpen(post)}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
        >
          <PencilSquareIcon className="h-4 w-4" aria-hidden="true" />
          Edit
        </button>
        <button
          type="button"
          onClick={() => onRecordMetrics(post)}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-600 transition hover:border-blue-300 hover:text-blue-700"
        >
          <ChartBarIcon className="h-4 w-4" aria-hidden="true" />
          Metrics
        </button>
        <select
          value={status}
          onChange={(event) => onStatusChange(post, event.target.value)}
          className="inline-flex h-9 items-center rounded-full border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => onDelete(post)}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700"
        >
          <TrashIcon className="h-4 w-4" aria-hidden="true" />
          Remove
        </button>
      </footer>
    </article>
  );
}

PostCard.propTypes = {
  post: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string.isRequired,
    status: PropTypes.string,
    visibility: PropTypes.string,
    summary: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string),
    metricsSummary: PropTypes.object,
    publishedAt: PropTypes.string,
    scheduledFor: PropTypes.string,
  }).isRequired,
  onOpen: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onStatusChange: PropTypes.func.isRequired,
  onRecordMetrics: PropTypes.func.isRequired,
};

export default function PostStudio({
  posts,
  statusCounts,
  tagFrequency,
  onNew,
  onOpen,
  onDelete,
  onStatusChange,
  onRecordMetrics,
}) {
  const sortedPosts = [...posts].sort((a, b) => new Date(b.publishedAt ?? b.createdAt ?? 0) - new Date(a.publishedAt ?? a.createdAt ?? 0));

  const statusSummary = [
    { id: 'draft', label: 'Drafts', value: statusCounts?.draft ?? 0 },
    { id: 'scheduled', label: 'Queued', value: statusCounts?.scheduled ?? 0 },
    { id: 'published', label: 'Live', value: statusCounts?.published ?? 0 },
    { id: 'archived', label: 'Archived', value: statusCounts?.archived ?? 0 },
  ];

  const topTags = Object.entries(tagFrequency ?? {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,2.5fr)_minmax(0,1fr)]">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">Posts</h2>
          <button
            type="button"
            onClick={onNew}
            className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
          >
            New post
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {statusSummary.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
            >
              <span>{item.label}</span>
              <span className="text-slate-900">{item.value}</span>
            </div>
          ))}
        </div>

        {sortedPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center">
            <BoltIcon className="h-10 w-10 text-slate-300" aria-hidden="true" />
            <p className="mt-4 text-sm font-semibold text-slate-600">No posts yet</p>
            <p className="mt-1 text-sm text-slate-500">Write your first hiring update.</p>
            <button
              type="button"
              onClick={onNew}
              className="mt-5 inline-flex items-center rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
            >
              New post
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {sortedPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onOpen={onOpen}
                onDelete={onDelete}
                onStatusChange={onStatusChange}
                onRecordMetrics={onRecordMetrics}
              />
            ))}
          </div>
        )}
      </div>

      <aside className="space-y-4">
        <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700">Top tags</h3>
          <ul className="mt-3 space-y-2">
            {topTags.map(([tag, count]) => (
              <li key={tag} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
                <span className="font-semibold text-slate-700">#{tag}</span>
                <span className="text-slate-900">{count}</span>
              </li>
            ))}
            {topTags.length === 0 ? (
              <li className="rounded-xl border border-dashed border-slate-200 px-3 py-4 text-center text-xs text-slate-400">
                No tags yet
              </li>
            ) : null}
          </ul>
        </section>
      </aside>
    </div>
  );
}

PostStudio.propTypes = {
  posts: PropTypes.arrayOf(PropTypes.object).isRequired,
  statusCounts: PropTypes.object,
  tagFrequency: PropTypes.object,
  onNew: PropTypes.func.isRequired,
  onOpen: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onStatusChange: PropTypes.func.isRequired,
  onRecordMetrics: PropTypes.func.isRequired,
};

PostStudio.defaultProps = {
  statusCounts: {},
  tagFrequency: {},
};
