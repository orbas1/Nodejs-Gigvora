import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  ChatBubbleLeftRightIcon,
  FireIcon,
  HashtagIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
  CheckCircleIcon,
  BellAlertIcon,
  BookmarkIcon,
} from '@heroicons/react/24/outline';
import { formatGroupRelativeTime } from '../../utils/groupFormatting.js';
import { classNames } from '../../utils/classNames.js';

function Badge({ children, tone = 'default' }) {
  const styles = {
    default: 'bg-slate-100 text-slate-600 border-slate-200',
    accent: 'bg-accent/10 text-accent border-accent/20',
    warning: 'bg-amber-100 text-amber-700 border-amber-200',
  };

  return (
    <span
      className={classNames(
        'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold',
        styles[tone] ?? styles.default,
      )}
    >
      {children}
    </span>
  );
}

Badge.propTypes = {
  children: PropTypes.node.isRequired,
  tone: PropTypes.oneOf(['default', 'accent', 'warning']),
};

Badge.defaultProps = {
  tone: 'default',
};

function ThreadCard({ thread, onSelect }) {
  const unresolved = thread.isUnresolved ?? (!thread.isAnswered && thread.status !== 'resolved');
  return (
    <button
      type="button"
      onClick={() => onSelect?.(thread)}
      className={classNames(
        'group flex w-full flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-soft transition hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-lg',
        thread.unread ? 'ring-1 ring-accent/30' : '',
      )}
    >
      <div className="flex items-center gap-3">
        <Badge tone="accent">{thread.category ?? 'Discussion'}</Badge>
        {thread.isAnswered ? <Badge tone="accent">Answered</Badge> : null}
        {!thread.isAnswered && unresolved ? <Badge tone="warning">Needs reply</Badge> : null}
        {thread.unread ? <Badge tone="accent">New</Badge> : null}
        {thread.pinned ? <Badge tone="default">Pinned</Badge> : null}
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-lg font-semibold text-slate-900 group-hover:text-slate-950">{thread.title}</p>
        <p className="text-sm text-slate-600 line-clamp-3">{thread.excerpt}</p>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <span className="inline-flex items-center gap-2">
          <UserGroupIcon className="h-4 w-4" />
          {thread.author?.name ?? 'Community member'}
        </span>
        <span>{formatGroupRelativeTime(thread.lastActivityAt ?? thread.lastReplyAt)}</span>
        <span>{thread.replies ?? 0} replies</span>
        {thread.participants ? <span>{thread.participants} contributors</span> : null}
        {thread.upvotes ? <span>{thread.upvotes} appreciations</span> : null}
        {(thread.tags ?? []).map((tag) => (
          <Badge key={tag}>{tag}</Badge>
        ))}
      </div>
    </button>
  );
}

ThreadCard.propTypes = {
  thread: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string.isRequired,
    excerpt: PropTypes.string,
    category: PropTypes.string,
    author: PropTypes.shape({
      name: PropTypes.string,
    }),
    replies: PropTypes.number,
    participants: PropTypes.number,
    upvotes: PropTypes.number,
    tags: PropTypes.arrayOf(PropTypes.string),
    lastActivityAt: PropTypes.string,
    lastReplyAt: PropTypes.string,
    isAnswered: PropTypes.bool,
    isUnresolved: PropTypes.bool,
    unread: PropTypes.bool,
    pinned: PropTypes.bool,
  }).isRequired,
  onSelect: PropTypes.func,
};

ThreadCard.defaultProps = {
  onSelect: undefined,
};

function ModeratorList({ moderators }) {
  if (!moderators.length) {
    return null;
  }
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Moderation circle</p>
      <ul className="mt-4 space-y-3 text-sm text-slate-600">
        {moderators.map((moderator) => (
          <li key={moderator.name} className="flex flex-col gap-1 rounded-2xl border border-slate-200 px-4 py-3">
            <span className="text-sm font-semibold text-slate-900">{moderator.name}</span>
            <span className="text-xs text-slate-500">{moderator.title}</span>
            {moderator.focus ? <span className="text-xs text-slate-400">Focus: {moderator.focus}</span> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

ModeratorList.propTypes = {
  moderators: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      title: PropTypes.string,
      focus: PropTypes.string,
    }),
  ),
};

ModeratorList.defaultProps = {
  moderators: [],
};

export default function GroupDiscussionBoard({
  board,
  loading,
  onRefresh,
  onCreateThread,
  onSelectThread,
}) {
  const [query, setQuery] = useState('');
  const [tag, setTag] = useState('all');
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState('recent');

  const threads = board?.threads ?? [];
  const pinned = board?.pinned ?? [];
  const tags = useMemo(() => {
    const source = board?.tags ?? board?.trendingTags ?? [];
    return Array.from(new Set(source.map((value) => value?.toString().trim()).filter(Boolean)));
  }, [board?.tags, board?.trendingTags]);
  const moderators = board?.moderators ?? [];
  const stats = board?.stats ?? {};

  const filteredThreads = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return threads
      .filter((thread) => {
        if (!normalizedQuery) {
          return true;
        }
        const haystack = `${thread.title} ${thread.excerpt ?? ''} ${(thread.tags ?? []).join(' ')}`.toLowerCase();
        return haystack.includes(normalizedQuery);
      })
      .filter((thread) => {
        if (tag === 'all') {
          return true;
        }
        return (thread.tags ?? []).map((value) => value.toLowerCase()).includes(tag);
      })
      .filter((thread) => {
        if (status === 'all') {
          return true;
        }
        if (status === 'unanswered') {
          return !thread.isAnswered && (thread.isUnresolved ?? true);
        }
        if (status === 'answered') {
          return Boolean(thread.isAnswered);
        }
        if (status === 'unread') {
          return Boolean(thread.unread);
        }
        return true;
      })
      .sort((a, b) => {
        if (sort === 'popular') {
          const aScore = (a.upvotes ?? 0) + (a.replies ?? 0);
          const bScore = (b.upvotes ?? 0) + (b.replies ?? 0);
          return bScore - aScore;
        }
        const aDate = new Date(a.lastActivityAt ?? a.lastReplyAt ?? 0).getTime();
        const bDate = new Date(b.lastActivityAt ?? b.lastReplyAt ?? 0).getTime();
        return bDate - aDate;
      });
  }, [threads, query, tag, status, sort]);

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <ChatBubbleLeftRightIcon className="h-4 w-4" /> Discussion board
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Collaborative intelligence hub</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Curated debates, playbooks, and in-flight problem solving to accelerate every member journey.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <Badge tone="accent">{stats.activeContributors ?? 0} active today</Badge>
            <Badge tone="warning">{stats.unresolvedCount ?? 0} unresolved</Badge>
            <Badge>{stats.newThreads ?? 0} new threads this week</Badge>
            <button
              type="button"
              onClick={loading ? undefined : () => onRefresh?.()}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
              disabled={loading}
            >
              <BellAlertIcon className="h-4 w-4" /> Refresh signals
            </button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr),minmax(0,1fr)]">
          <label className="relative">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search threads, tags, or contributors"
              className="w-full rounded-full border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm text-slate-700 shadow-sm focus:border-accent/40 focus:outline-none focus:ring-4 focus:ring-accent/10"
            />
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={tag}
              onChange={(event) => setTag(event.target.value)}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm focus:border-accent/40 focus:outline-none focus:ring-2 focus:ring-accent/10"
            >
              <option value="all">All topics</option>
              {tags.map((value) => (
                <option key={value} value={value.toLowerCase()}>
                  {value}
                </option>
              ))}
            </select>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm focus:border-accent/40 focus:outline-none focus:ring-2 focus:ring-accent/10"
            >
              <option value="all">All statuses</option>
              <option value="unanswered">Needs replies</option>
              <option value="answered">Answered</option>
              <option value="unread">Unread</option>
            </select>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm focus:border-accent/40 focus:outline-none focus:ring-2 focus:ring-accent/10"
            >
              <option value="recent">Most recent</option>
              <option value="popular">Most appreciated</option>
            </select>
            <button
              type="button"
              onClick={() => onCreateThread?.()}
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow transition hover:bg-slate-800"
            >
              <FireIcon className="h-4 w-4" /> Start a thread
            </button>
          </div>
        </div>
      </header>

      {pinned.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {pinned.map((thread) => (
            <ThreadCard key={thread.id} thread={{ ...thread, pinned: true }} onSelect={onSelectThread} />
          ))}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2.3fr),minmax(0,1fr)]">
        <div className="space-y-4">
          {loading ? (
            <div className="space-y-3">
              <div className="h-32 animate-pulse rounded-3xl bg-slate-100" />
              <div className="h-32 animate-pulse rounded-3xl bg-slate-100" />
              <div className="h-32 animate-pulse rounded-3xl bg-slate-100" />
            </div>
          ) : filteredThreads.length ? (
            filteredThreads.map((thread) => (
              <ThreadCard key={thread.id} thread={thread} onSelect={onSelectThread} />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-slate-200 bg-slate-50 py-16 text-center">
              <HashtagIcon className="h-8 w-8 text-slate-400" />
              <p className="text-sm font-semibold text-slate-700">No threads match the current filters.</p>
              <p className="text-xs text-slate-500">Reset filters or start a fresh conversation for the community.</p>
            </div>
          )}
        </div>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <BookmarkIcon className="h-4 w-4" /> Trending tags
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {(tags.length ? tags : ['Announcements', 'Ops', 'AI']).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTag(value.toLowerCase())}
                  className={classNames(
                    'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition',
                    tag === value.toLowerCase()
                      ? 'border-accent/40 bg-accent/10 text-accent'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900',
                  )}
                >
                  <HashtagIcon className="h-4 w-4" />
                  {value}
                </button>
              ))}
            </div>
          </div>

          <ModeratorList moderators={moderators} />

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Board health</p>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li className="flex items-start gap-3">
                <CheckCircleIcon className="mt-0.5 h-5 w-5 text-emerald-500" />
                <div>
                  <p className="font-semibold text-slate-900">Response time</p>
                  <p className="text-xs text-slate-500">Median mentor response in {board?.health?.responseTime ?? '4h'}.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <UserGroupIcon className="mt-0.5 h-5 w-5 text-accent" />
                <div>
                  <p className="font-semibold text-slate-900">Participation</p>
                  <p className="text-xs text-slate-500">{board?.health?.participation ?? '68%'} of members engaged this month.</p>
                </div>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </section>
  );
}

GroupDiscussionBoard.propTypes = {
  board: PropTypes.shape({
    threads: PropTypes.arrayOf(PropTypes.object),
    pinned: PropTypes.arrayOf(PropTypes.object),
    tags: PropTypes.arrayOf(PropTypes.string),
    trendingTags: PropTypes.arrayOf(PropTypes.string),
    moderators: PropTypes.arrayOf(PropTypes.object),
    stats: PropTypes.shape({
      activeContributors: PropTypes.number,
      unresolvedCount: PropTypes.number,
      newThreads: PropTypes.number,
    }),
    health: PropTypes.shape({
      responseTime: PropTypes.string,
      participation: PropTypes.string,
    }),
  }),
  loading: PropTypes.bool,
  onRefresh: PropTypes.func,
  onCreateThread: PropTypes.func,
  onSelectThread: PropTypes.func,
};

GroupDiscussionBoard.defaultProps = {
  board: null,
  loading: false,
  onRefresh: undefined,
  onCreateThread: undefined,
  onSelectThread: undefined,
};
