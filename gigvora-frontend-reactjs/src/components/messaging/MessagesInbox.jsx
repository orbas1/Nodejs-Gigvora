import { useCallback, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowPathIcon,
  BoltIcon,
  ChartBarIcon,
  EnvelopeOpenIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { classNames } from '../../utils/classNames.js';
import {
  buildThreadTitle,
  describeLastActivity,
  formatThreadParticipants,
  isThreadUnread,
} from '../../utils/messaging.js';
import { formatRelativeTime } from '../../utils/date.js';

const CHANNEL_LABELS = {
  direct: 'Direct',
  mentor: 'Mentorship',
  support: 'Support',
  hiring: 'Hiring',
  marketing: 'Campaign',
  investor_relations: 'Investor',
  product: 'Product',
};

function resolveChannelLabel(channel) {
  if (!channel) {
    return CHANNEL_LABELS.direct;
  }
  return CHANNEL_LABELS[channel] ?? channel.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function normaliseChannelType(thread) {
  return thread?.channelType ?? 'direct';
}

function normaliseLabels(thread) {
  const labels = thread?.labels;
  if (Array.isArray(labels)) {
    return labels;
  }
  if (labels && typeof labels === 'object') {
    return Object.keys(labels).filter((key) => labels[key]);
  }
  if (Array.isArray(thread?.tags)) {
    return thread.tags;
  }
  return [];
}

function StatSummary({ icon: Icon, label, helper, value }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-accent/10 text-accent">
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="text-lg font-semibold text-slate-900">{value}</p>
          {helper ? <p className="text-[11px] text-slate-400">{helper}</p> : null}
        </div>
      </div>
    </div>
  );
}

StatSummary.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  helper: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};

StatSummary.defaultProps = {
  helper: null,
};

export function ThreadPreviewCard({
  thread,
  actorId,
  active,
  onSelect,
  onTogglePin,
  pinning,
}) {
  const title = buildThreadTitle(thread, actorId);
  const participants = formatThreadParticipants(thread, actorId);
  const unread = isThreadUnread(thread);
  const lastActivity = describeLastActivity(thread);
  const channel = resolveChannelLabel(normaliseChannelType(thread));
  const labels = normaliseLabels(thread);
  const unreadCount = typeof thread?.unreadCount === 'number' ? thread.unreadCount : unread ? 1 : 0;

  const handleSelect = useCallback(() => {
    if (thread?.id && onSelect) {
      onSelect(thread.id);
    }
  }, [onSelect, thread?.id]);

  const handleKeyDown = useCallback(
    (event) => {
      if ((event.key === 'Enter' || event.key === ' ') && !pinning) {
        event.preventDefault();
        handleSelect();
      }
    },
    [handleSelect, pinning],
  );

  const togglePin = useCallback(
    (event) => {
      event.stopPropagation();
      if (!onTogglePin || !thread?.id || pinning) {
        return;
      }
      onTogglePin(thread, !thread.pinned);
    },
    [onTogglePin, pinning, thread],
  );

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleSelect}
      onKeyDown={handleKeyDown}
      className={classNames(
        'group relative w-full rounded-3xl border px-5 py-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        active
          ? 'border-accent bg-accentSoft shadow-soft'
          : unread
            ? 'border-slate-200 bg-white shadow-sm hover:border-accent/70 hover:shadow-soft'
            : 'border-slate-200 bg-white hover:border-accent/60',
        pinning ? 'cursor-wait opacity-70' : 'cursor-pointer',
      )}
      aria-pressed={active}
      aria-label={`Open conversation ${title}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-slate-900 group-hover:text-accent">{title}</p>
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              {channel}
            </span>
            {thread?.priority === 'high' || thread?.state === 'escalated' ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                <BoltIcon className="h-3.5 w-3.5" /> Escalated
              </span>
            ) : null}
            {thread?.pinned ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                <StarSolidIcon className="h-3.5 w-3.5" /> Pinned
              </span>
            ) : null}
          </div>
          {participants.length ? (
            <p className="text-xs text-slate-500">{participants.join(', ')}</p>
          ) : null}
          {thread?.lastMessagePreview ? (
            <p className="text-sm text-slate-600 line-clamp-2">{thread.lastMessagePreview}</p>
          ) : null}
          {labels.length ? (
            <div className="flex flex-wrap gap-1 pt-1">
              {labels.slice(0, 4).map((label) => (
                <span
                  key={label}
                  className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700"
                >
                  {label}
                </span>
              ))}
              {labels.length > 4 ? (
                <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  +{labels.length - 4}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="text-xs text-slate-400">{lastActivity}</span>
          <div className="flex items-center gap-2">
            {unreadCount > 0 ? (
              <span className="inline-flex min-w-[1.75rem] justify-center rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                {unreadCount}
              </span>
            ) : null}
            {onTogglePin ? (
              <button
                type="button"
                aria-label={thread?.pinned ? `Unpin ${title}` : `Pin ${title}`}
                className={classNames(
                  'rounded-full border px-2 py-1 text-slate-500 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                  thread?.pinned
                    ? 'border-amber-400 bg-amber-100 text-amber-700 hover:bg-amber-200'
                    : 'border-slate-200 bg-white hover:border-accent/60 hover:text-accent',
                  pinning ? 'cursor-wait opacity-70' : '',
                )}
                onClick={togglePin}
                disabled={pinning}
              >
                {thread?.pinned ? <StarSolidIcon className="h-4 w-4" /> : <StarOutlineIcon className="h-4 w-4" />}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

ThreadPreviewCard.propTypes = {
  thread: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    pinned: PropTypes.bool,
    priority: PropTypes.string,
    state: PropTypes.string,
    channelType: PropTypes.string,
    unreadCount: PropTypes.number,
    lastMessagePreview: PropTypes.string,
    labels: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
    tags: PropTypes.array,
  }).isRequired,
  actorId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  active: PropTypes.bool,
  onSelect: PropTypes.func,
  onTogglePin: PropTypes.func,
  pinning: PropTypes.bool,
};

ThreadPreviewCard.defaultProps = {
  actorId: null,
  active: false,
  onSelect: null,
  onTogglePin: null,
  pinning: false,
};

export default function MessagesInbox({
  actorId,
  threads,
  loading,
  error,
  lastSyncedAt,
  onRefresh,
  onSelectThread,
  selectedThreadId,
  onTogglePin,
  pinningThreadIds,
}) {
  const [query, setQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState(() => new Set());
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);

  const pinningSet = useMemo(() => {
    if (pinningThreadIds instanceof Set) {
      return pinningThreadIds;
    }
    if (Array.isArray(pinningThreadIds)) {
      return new Set(pinningThreadIds);
    }
    return new Set();
  }, [pinningThreadIds]);

  const metrics = useMemo(() => {
    const total = threads.length;
    const pinned = threads.filter((thread) => thread?.pinned).length;
    const unread = threads.filter((thread) => isThreadUnread(thread)).length;
    const escalated = threads.filter((thread) => thread?.priority === 'high' || thread?.state === 'escalated').length;
    const collaborators = new Set();
    threads.forEach((thread) => {
      thread?.participants?.forEach((participant) => {
        if (participant?.userId) {
          collaborators.add(participant.userId);
        }
      });
    });
    const responseDurations = threads
      .map((thread) => thread?.metrics?.avgResponseMinutes ?? thread?.metadata?.avgResponseMinutes)
      .filter((value) => Number.isFinite(value) && value > 0);
    const avgResponse =
      responseDurations.length > 0
        ? Math.round(responseDurations.reduce((sum, value) => sum + value, 0) / responseDurations.length)
        : null;
    return {
      total,
      pinned,
      unread,
      escalated,
      collaborators: collaborators.size,
      avgResponse,
    };
  }, [threads]);

  const channelCatalog = useMemo(() => {
    const catalog = new Map();
    threads.forEach((thread) => {
      const channel = normaliseChannelType(thread);
      catalog.set(channel, (catalog.get(channel) ?? 0) + 1);
    });
    return Array.from(catalog.entries())
      .map(([channel, count]) => ({ channel, count, label: resolveChannelLabel(channel) }))
      .sort((a, b) => b.count - a.count);
  }, [threads]);

  const filteredThreads = useMemo(() => {
    const lowerQuery = query.trim().toLowerCase();
    return threads.filter((thread) => {
      if (showPinnedOnly && !thread?.pinned) {
        return false;
      }
      if (showUnreadOnly && !isThreadUnread(thread)) {
        return false;
      }
      if (channelFilter.size) {
        const channel = normaliseChannelType(thread);
        if (!channelFilter.has(channel)) {
          return false;
        }
      }
      if (!lowerQuery) {
        return true;
      }
      const subject = thread?.subject?.toLowerCase() ?? '';
      if (subject.includes(lowerQuery)) {
        return true;
      }
      const preview = thread?.lastMessagePreview?.toLowerCase() ?? '';
      if (preview.includes(lowerQuery)) {
        return true;
      }
      const participants = formatThreadParticipants(thread, actorId).join(' ').toLowerCase();
      if (participants.includes(lowerQuery)) {
        return true;
      }
      const labels = normaliseLabels(thread)
        .map((label) => `${label}`.toLowerCase())
        .join(' ');
      return labels.includes(lowerQuery);
    });
  }, [actorId, channelFilter, query, showPinnedOnly, showUnreadOnly, threads]);

  const pinnedThreads = useMemo(
    () => filteredThreads.filter((thread) => thread?.pinned),
    [filteredThreads],
  );
  const regularThreads = useMemo(
    () => filteredThreads.filter((thread) => !thread?.pinned),
    [filteredThreads],
  );

  const handleChannelToggle = useCallback((channel) => {
    setChannelFilter((current) => {
      const next = new Set(current);
      if (next.has(channel)) {
        next.delete(channel);
      } else {
        next.add(channel);
      }
      return next;
    });
  }, []);

  return (
    <div className="space-y-4 rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-soft backdrop-blur">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">Inbox intelligence</p>
          <p className="text-xs text-slate-500">
            Curated threads, premium filters, and instant visibility into what needs your voice.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          {lastSyncedAt ? <span>Synced {formatRelativeTime(lastSyncedAt)}</span> : null}
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 font-semibold text-slate-500 transition hover:border-accent/60 hover:text-accent"
            disabled={loading}
          >
            <ArrowPathIcon className={classNames('h-4 w-4', loading ? 'animate-spin' : '')} /> Sync
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <StatSummary icon={ChartBarIcon} label="Total conversations" value={metrics.total} helper={`${metrics.collaborators} collaborators`} />
        <StatSummary icon={EnvelopeOpenIcon} label="Unread" value={metrics.unread} helper={metrics.unread ? 'Prioritise follow-ups' : 'All threads are read'} />
        <StatSummary icon={StarOutlineIcon} label="Pinned" value={metrics.pinned} helper="Keep partners front and centre" />
        <StatSummary icon={BoltIcon} label="Escalations" value={metrics.escalated} helper={metrics.avgResponse ? `Avg response ${metrics.avgResponse}m` : 'No active escalations'} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[14rem]">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, topic, or label"
            className="w-full rounded-full border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm text-slate-700 transition focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowUnreadOnly((value) => !value)}
          className={classNames(
            'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition',
            showUnreadOnly
              ? 'border-accent bg-accent text-white shadow-soft'
              : 'border-slate-200 bg-white text-slate-600 hover:border-accent/60 hover:text-accent',
          )}
        >
          <EnvelopeOpenIcon className="h-4 w-4" /> Unread
        </button>
        <button
          type="button"
          onClick={() => setShowPinnedOnly((value) => !value)}
          className={classNames(
            'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition',
            showPinnedOnly
              ? 'border-amber-400 bg-amber-100 text-amber-700 shadow-soft'
              : 'border-slate-200 bg-white text-slate-600 hover:border-amber-400/70 hover:text-amber-600',
          )}
        >
          <StarOutlineIcon className="h-4 w-4" /> Pinned
        </button>
        <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          <UserGroupIcon className="h-4 w-4" /> {metrics.collaborators} collaborators
        </span>
      </div>

      {channelCatalog.length ? (
        <div className="flex flex-wrap gap-2">
          {channelCatalog.map((channel) => {
            const active = channelFilter.has(channel.channel);
            return (
              <button
                key={channel.channel}
                type="button"
                onClick={() => handleChannelToggle(channel.channel)}
                className={classNames(
                  'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                  active
                    ? 'border-accent bg-accent text-white shadow-soft'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-accent/60 hover:text-accent',
                )}
              >
                <FunnelIcon className="h-4 w-4" />
                <span>{channel.label}</span>
                <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                  {channel.count}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}

      {error ? (
        <p className="rounded-3xl bg-rose-50 px-4 py-3 text-xs text-rose-600" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-20 rounded-3xl bg-slate-100" />
          ))}
        </div>
      ) : filteredThreads.length ? (
        <div className="space-y-4">
          {pinnedThreads.length ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Pinned</p>
                <span className="text-[11px] text-slate-400">{pinnedThreads.length} conversations</span>
              </div>
              <div className="space-y-3">
                {pinnedThreads.map((thread) => (
                  <ThreadPreviewCard
                    key={thread.id}
                    thread={thread}
                    actorId={actorId}
                    active={selectedThreadId === thread?.id}
                    onSelect={onSelectThread}
                    onTogglePin={onTogglePin}
                    pinning={pinningSet.has(thread?.id)}
                  />
                ))}
              </div>
            </div>
          ) : null}
          <div className="space-y-3">
            {regularThreads.map((thread) => (
              <ThreadPreviewCard
                key={thread.id}
                thread={thread}
                actorId={actorId}
                active={selectedThreadId === thread?.id}
                onSelect={onSelectThread}
                onTogglePin={onTogglePin}
                pinning={pinningSet.has(thread?.id)}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
          No conversations match your filters yet. Reset filters or invite partners to kickstart collaboration.
        </div>
      )}
    </div>
  );
}

MessagesInbox.propTypes = {
  actorId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  threads: PropTypes.arrayOf(PropTypes.object),
  loading: PropTypes.bool,
  error: PropTypes.string,
  lastSyncedAt: PropTypes.string,
  onRefresh: PropTypes.func,
  onSelectThread: PropTypes.func,
  selectedThreadId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onTogglePin: PropTypes.func,
  pinningThreadIds: PropTypes.oneOfType([PropTypes.instanceOf(Set), PropTypes.array]),
};

MessagesInbox.defaultProps = {
  actorId: null,
  threads: [],
  loading: false,
  error: null,
  lastSyncedAt: null,
  onRefresh: () => {},
  onSelectThread: () => {},
  selectedThreadId: null,
  onTogglePin: null,
  pinningThreadIds: undefined,
};
