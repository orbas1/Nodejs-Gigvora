import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowPathIcon,
  ChatBubbleLeftRightIcon,
  FireIcon,
  FunnelIcon,
  HashtagIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { classNames } from '../../../utils/classNames.js';
import { formatRelativeTime, formatNumber } from '../../../utils/groupsFormatting.js';

function TagFilter({ tags, activeTag, onChange }) {
  if (!tags.length) {
    return null;
  }
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onChange('all')}
        className={classNames(
          'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition',
          activeTag === 'all'
            ? 'border-slate-900 bg-slate-900 text-white'
            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900',
        )}
      >
        <HashtagIcon className="h-3.5 w-3.5" />
        All topics
      </button>
      {tags.map((tag) => (
        <button
          key={tag}
          type="button"
          onClick={() => onChange(tag)}
          className={classNames(
            'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition',
            activeTag === tag
              ? 'border-slate-900 bg-slate-900 text-white'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900',
          )}
        >
          #{tag}
        </button>
      ))}
    </div>
  );
}

TagFilter.propTypes = {
  tags: PropTypes.arrayOf(PropTypes.string).isRequired,
  activeTag: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};

function PinnedThreadCard({ thread }) {
  const title = thread?.title ?? thread?.question ?? 'Pinned conversation';
  const excerpt = thread?.summary ?? thread?.excerpt ?? thread?.preview ?? thread?.description;
  const owner = thread?.author?.name ?? thread?.authorName;
  const lastActivity = thread?.updatedAt ?? thread?.lastActivityAt ?? thread?.createdAt;

  return (
    <article className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-100 p-5">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <ShieldCheckIcon className="h-4 w-4" /> Moderator spotlight
      </div>
      <h3 className="mt-3 text-lg font-semibold text-slate-900">{title}</h3>
      {excerpt ? <p className="mt-2 text-sm text-slate-600">{excerpt}</p> : null}
      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
        {owner ? <span>Started by {owner}</span> : null}
        {lastActivity ? <span>• {formatRelativeTime(lastActivity)}</span> : null}
        {typeof thread?.replyCount === 'number' ? <span>• {formatNumber(thread.replyCount)} replies</span> : null}
      </div>
    </article>
  );
}

PinnedThreadCard.propTypes = {
  thread: PropTypes.object.isRequired,
};

function ThreadRow({ thread }) {
  const title = thread?.title ?? thread?.question ?? 'Discussion thread';
  const body = thread?.summary ?? thread?.excerpt ?? thread?.preview ?? thread?.description;
  const lastActivity = thread?.lastActivityAt ?? thread?.updatedAt ?? thread?.createdAt;
  const replies = typeof thread?.replyCount === 'number' ? formatNumber(thread.replyCount) : null;
  const unread = thread?.unread ?? thread?.unresolved;
  const tagList = Array.isArray(thread?.tags) ? thread.tags : Array.isArray(thread?.topics) ? thread.topics : [];

  return (
    <li className="group flex flex-col gap-2 rounded-3xl border border-slate-200 bg-white/90 p-5 transition hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-soft">
      <div className="flex flex-wrap items-center gap-3">
        <h4 className="flex-1 text-base font-semibold text-slate-900">{title}</h4>
        {unread ? <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Needs reply</span> : null}
        {replies ? (
          <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            <ChatBubbleLeftRightIcon className="h-3.5 w-3.5" />
            {replies}
          </span>
        ) : null}
      </div>
      {body ? <p className="text-sm text-slate-600">{body}</p> : null}
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
        {lastActivity ? <span>Updated {formatRelativeTime(lastActivity)}</span> : null}
        {thread?.author?.name ? <span>• {thread.author.name}</span> : null}
        {tagList.slice(0, 3).map((tag) => (
          <span key={tag} className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-slate-600">
            #{tag}
          </span>
        ))}
      </div>
    </li>
  );
}

ThreadRow.propTypes = {
  thread: PropTypes.object.isRequired,
};

function ModeratorList({ moderators }) {
  if (!moderators?.length) {
    return null;
  }
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Moderation team</p>
      <ul className="mt-3 space-y-2 text-sm text-slate-600">
        {moderators.map((moderator) => (
          <li key={moderator.id ?? moderator.name} className="flex items-center justify-between gap-3">
            <span className="font-semibold text-slate-900">{moderator.name}</span>
            <span className="text-xs text-slate-500">{moderator.role ?? moderator.title ?? 'Moderator'}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

ModeratorList.propTypes = {
  moderators: PropTypes.arrayOf(PropTypes.object),
};

ModeratorList.defaultProps = {
  moderators: [],
};

export default function GroupDiscussionBoard({
  board,
  membership,
  onRefresh,
  loading,
  onCreateThread,
}) {
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState('all');
  const [sort, setSort] = useState('trending');
  const [visibleCount, setVisibleCount] = useState(6);

  const allTags = useMemo(() => {
    const tagSet = new Set();
    (board.tags ?? []).forEach((tag) => tag && tagSet.add(tag));
    (board.threads ?? []).forEach((thread) => {
      const tags = Array.isArray(thread?.tags) ? thread.tags : Array.isArray(thread?.topics) ? thread.topics : [];
      tags.forEach((tag) => tag && tagSet.add(tag));
    });
    return Array.from(tagSet).slice(0, 12);
  }, [board.tags, board.threads]);

  const pinnedThreads = useMemo(() => (Array.isArray(board.pinned) ? board.pinned.slice(0, 2) : []), [board.pinned]);
  const trendingThreads = useMemo(() => (Array.isArray(board.trending) ? board.trending.slice(0, 3) : []), [board.trending]);

  const filteredThreads = useMemo(() => {
    let candidates = Array.isArray(board.threads) ? board.threads : [];
    if (activeTag !== 'all') {
      candidates = candidates.filter((thread) => {
        const tags = Array.isArray(thread?.tags) ? thread.tags : Array.isArray(thread?.topics) ? thread.topics : [];
        return tags.includes(activeTag);
      });
    }
    if (search.trim()) {
      const query = search.trim().toLowerCase();
      candidates = candidates.filter((thread) => {
        const title = thread?.title ?? thread?.question ?? '';
        const body = thread?.summary ?? thread?.excerpt ?? thread?.preview ?? '';
        return title.toLowerCase().includes(query) || body.toLowerCase().includes(query);
      });
    }
    const sorted = [...candidates];
    if (sort === 'trending') {
      sorted.sort((a, b) => (b.replyCount ?? 0) - (a.replyCount ?? 0));
    } else if (sort === 'unanswered') {
      sorted.sort((a, b) => {
        const aScore = a.unread || a.unresolved ? 1 : 0;
        const bScore = b.unread || b.unresolved ? 1 : 0;
        if (aScore !== bScore) {
          return bScore - aScore;
        }
        return (new Date(b.lastActivityAt ?? b.updatedAt ?? 0) - new Date(a.lastActivityAt ?? a.updatedAt ?? 0));
      });
    } else {
      sorted.sort((a, b) => new Date(b.lastActivityAt ?? b.updatedAt ?? 0) - new Date(a.lastActivityAt ?? a.updatedAt ?? 0));
    }
    return sorted;
  }, [board.threads, activeTag, search, sort]);

  const visibleThreads = useMemo(() => filteredThreads.slice(0, visibleCount), [filteredThreads, visibleCount]);
  const hasMore = filteredThreads.length > visibleCount;

  const stats = board?.stats ?? {};
  const isMember = membership?.status === 'member';

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <FireIcon className="h-4 w-4 text-accent" /> Live discussion board
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Surface trending debates, unanswered questions, and expert breakdowns without losing context.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
            {formatNumber(stats.activeToday ?? 0)} active today
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-3 py-1 font-semibold text-rose-600">
            {formatNumber(stats.unresolved ?? 0)} unresolved
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-600">
            {formatNumber(stats.contributorsThisWeek ?? 0)} contributors
          </span>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,2fr),minmax(0,1fr)]">
        <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3">
          <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setVisibleCount(6);
            }}
            className="w-full border-none bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
            placeholder="Search conversations, mentors, or briefs"
            aria-label="Search group discussions"
          />
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <div className="relative">
            <select
              value={sort}
              onChange={(event) => {
                setSort(event.target.value);
                setVisibleCount(6);
              }}
              className="appearance-none rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 focus:border-accent focus:outline-none"
            >
              <option value="trending">Trending first</option>
              <option value="recent">Most recent</option>
              <option value="unanswered">Needs replies</option>
            </select>
            <FunnelIcon className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
          </div>
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
          >
            <ArrowPathIcon className={classNames('h-4 w-4', loading ? 'animate-spin text-accent' : 'text-slate-400')} />
            Refresh feed
          </button>
          {isMember ? (
            <button
              type="button"
              onClick={onCreateThread}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white shadow-soft transition hover:bg-accentDark"
            >
              <PencilSquareIcon className="h-4 w-4" />
              Start a thread
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-6">
        <TagFilter tags={allTags} activeTag={activeTag} onChange={(tag) => {
          setActiveTag(tag);
          setVisibleCount(6);
        }} />
      </div>

      {pinnedThreads.length ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {pinnedThreads.map((thread) => (
            <PinnedThreadCard key={thread.id ?? thread.title} thread={thread} />
          ))}
        </div>
      ) : null}

      {trendingThreads.length ? (
        <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Trending topics</p>
          <ul className="mt-3 space-y-3">
            {trendingThreads.map((thread) => (
              <li key={thread.id ?? thread.title} className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                <FireIcon className="h-4 w-4 text-accent" />
                <span className="font-semibold text-slate-900">{thread.title ?? thread.question ?? 'Live thread'}</span>
                {typeof thread?.replyCount === 'number' ? (
                  <span className="text-xs text-slate-500">· {formatNumber(thread.replyCount)} replies</span>
                ) : null}
                {thread.lastActivityAt ? (
                  <span className="text-xs text-slate-500">· {formatRelativeTime(thread.lastActivityAt)}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <ul className="mt-6 space-y-4">
        {visibleThreads.length ? (
          visibleThreads.map((thread) => <ThreadRow key={thread.id ?? thread.title} thread={thread} />)
        ) : (
          <li className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
            No conversations match that filter yet. Try another tag or refresh the feed.
          </li>
        )}
      </ul>

      {hasMore ? (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount((count) => Math.min(count + 5, filteredThreads.length))}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-6 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
          >
            Load older conversations
          </button>
        </div>
      ) : null}

      <div className="mt-8">
        <ModeratorList moderators={board.moderators} />
      </div>
    </section>
  );
}

GroupDiscussionBoard.propTypes = {
  board: PropTypes.shape({
    pinned: PropTypes.arrayOf(PropTypes.object),
    threads: PropTypes.arrayOf(PropTypes.object),
    tags: PropTypes.arrayOf(PropTypes.string),
    moderators: PropTypes.arrayOf(PropTypes.object),
    stats: PropTypes.object,
  }).isRequired,
  membership: PropTypes.object.isRequired,
  onRefresh: PropTypes.func,
  loading: PropTypes.bool,
  onCreateThread: PropTypes.func,
};

GroupDiscussionBoard.defaultProps = {
  onRefresh: undefined,
  loading: false,
  onCreateThread: undefined,
};
