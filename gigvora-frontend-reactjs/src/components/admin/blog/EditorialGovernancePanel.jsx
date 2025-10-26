import PropTypes from 'prop-types';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';

function formatDate(value) {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function summarizePosts(posts = []) {
  const scheduled = [];
  const drafts = [];
  posts.forEach((post) => {
    const status = (post.status ?? '').toLowerCase();
    if (status === 'scheduled') {
      scheduled.push(post);
    } else if (status === 'draft') {
      drafts.push(post);
    }
  });
  const needsReview = drafts.filter((post) => {
    if (!post.updatedAt) return true;
    const updated = new Date(post.updatedAt);
    if (Number.isNaN(updated.getTime())) return true;
    const diff = Date.now() - updated.getTime();
    return diff > 7 * 24 * 60 * 60 * 1000;
  });
  return { scheduled, drafts, needsReview };
}

export default function EditorialGovernancePanel({ posts, metrics, legalSummary, legalLoading }) {
  const { scheduled, drafts, needsReview } = summarizePosts(posts);
  const scheduledTimeline = scheduled
    .map((post) => ({
      id: post.id,
      title: post.title ?? 'Untitled',
      publishAt: post.publishAt ?? post.scheduledAt ?? post.publishedAt ?? null,
      author: post.author?.name ?? post.authorName ?? 'Editorial',
    }))
    .sort((a, b) => {
      const aTime = a.publishAt ? new Date(a.publishAt).getTime() : Number.MAX_SAFE_INTEGER;
      const bTime = b.publishAt ? new Date(b.publishAt).getTime() : Number.MAX_SAFE_INTEGER;
      return aTime - bTime;
    })
    .slice(0, 4);

  const performance = metrics?.totals ?? {};

  const legalStats = legalSummary ?? {};

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Editorial governance</p>
          <h2 className="text-xl font-semibold text-slate-900">Publishing control tower</h2>
          <p className="text-sm text-slate-500">
            Balance momentum and compliance across the marketing blog and legal surfaces. Use this snapshot to align content,
            legal, and comms teams.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Scheduled</p>
            <p className="mt-2 text-xl font-semibold text-slate-900">{scheduled.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Drafts</p>
            <p className="mt-2 text-xl font-semibold text-slate-900">{drafts.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Needs legal review</p>
            <p className="mt-2 text-xl font-semibold text-slate-900">{needsReview.length}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr,1fr]">
        <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800">Release runway</h3>
            <span className="text-xs uppercase tracking-wide text-slate-400">Next 4 launches</span>
          </div>
          <ul className="mt-4 space-y-3">
            {scheduledTimeline.length === 0 ? (
              <li className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                No scheduled posts—schedule upcoming releases to keep momentum.
              </li>
            ) : (
              scheduledTimeline.map((entry) => (
                <li key={entry.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">{entry.title}</span>
                    <span className="inline-flex items-center gap-1 text-xs uppercase tracking-wide text-slate-400">
                      <CalendarDaysIcon className="h-4 w-4" />
                      {formatDate(entry.publishAt)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{entry.author}</p>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white/95 p-5">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Performance snapshot</h3>
            <p className="text-xs text-slate-500">Rolling 30-day metrics to benchmark momentum.</p>
          </div>
          <div className="grid gap-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Views</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">{(performance.totalViews ?? 0).toLocaleString()}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Readers</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">{(performance.uniqueVisitors ?? 0).toLocaleString()}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Conversions</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">{(performance.subscriberConversions ?? 0).toLocaleString()}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Active policies</p>
            <p className="mt-2 text-xl font-semibold text-slate-900">
              {legalLoading ? 'Loading…' : legalStats.active ?? legalStats.total ?? 0}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {legalLoading
                ? 'Checking governance coverage'
                : `Locales ${Array.isArray(legalStats.locales) ? legalStats.locales.join(', ') : 'Global'}`}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

EditorialGovernancePanel.propTypes = {
  posts: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      title: PropTypes.string,
      status: PropTypes.string,
      publishAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
      scheduledAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
      author: PropTypes.shape({
        name: PropTypes.string,
      }),
      authorName: PropTypes.string,
      updatedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
    }),
  ),
  metrics: PropTypes.shape({
    totals: PropTypes.object,
  }),
  legalSummary: PropTypes.shape({
    active: PropTypes.number,
    total: PropTypes.number,
    locales: PropTypes.arrayOf(PropTypes.string),
  }),
  legalLoading: PropTypes.bool,
};

EditorialGovernancePanel.defaultProps = {
  posts: [],
  metrics: null,
  legalSummary: null,
  legalLoading: false,
};
