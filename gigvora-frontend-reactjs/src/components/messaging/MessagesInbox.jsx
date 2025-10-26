import { Fragment, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Menu, Switch, Transition } from '@headlessui/react';
import {
  BoltIcon,
  BookmarkIcon,
  ClockIcon,
  EllipsisHorizontalIcon,
  EnvelopeIcon,
  EnvelopeOpenIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  MoonIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

import UserAvatar from '../UserAvatar.jsx';
import { classNames } from '../../utils/classNames.js';
import {
  buildThreadTitle,
  describeLastActivity,
  formatThreadParticipants,
  isThreadUnread,
} from '../../utils/messaging.js';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread', icon: EnvelopeIcon },
  { id: 'priority', label: 'Priority', icon: BoltIcon },
  { id: 'mentors', label: 'Mentors', icon: UsersIcon },
  { id: 'projects', label: 'Projects', icon: BookmarkIcon },
  { id: 'snoozed', label: 'Snoozed', icon: MoonIcon },
];

const SECTION_ORDER = ['priority', 'mentors', 'projects', 'inbox'];

const SECTION_LABELS = {
  priority: 'Priority',
  mentors: 'Mentors & Advisors',
  projects: 'Projects & Deals',
  inbox: 'General Inbox',
};

const SNOOZE_PRESETS = [
  { label: 'Later today (1 hr)', minutes: 60 },
  { label: 'Tonight (4 hr)', minutes: 240 },
  { label: 'Tomorrow morning', minutes: 60 * 14 },
  { label: 'Next week', minutes: 60 * 24 * 7 },
];

function deriveThreadSection(thread) {
  const metadata = thread?.metadata ?? {};
  const labels = new Set(
    [
      thread?.priority,
      metadata?.priority,
      metadata?.channelCategory,
      ...(Array.isArray(thread?.labels) ? thread.labels : []),
      ...(Array.isArray(metadata?.tags) ? metadata.tags : []),
    ]
      .filter(Boolean)
      .map((value) => `${value}`.toLowerCase()),
  );

  const channelType = `${thread?.channelType ?? ''}`.toLowerCase();
  if (thread?.pinned || labels.has('priority') || labels.has('critical') || channelType === 'escalation') {
    return 'priority';
  }
  if (labels.has('mentor') || channelType === 'mentor') {
    return 'mentors';
  }
  if (
    labels.has('project') ||
    metadata?.projectId ||
    metadata?.project?.name ||
    metadata?.opportunityId ||
    channelType === 'project'
  ) {
    return 'projects';
  }
  return 'inbox';
}

function deriveSnooze(threadId, snoozedThreads = {}) {
  const entry = snoozedThreads?.[threadId];
  if (!entry) {
    return { isSnoozed: false, snoozedUntil: null };
  }
  const until = entry?.until ?? entry;
  if (!until) {
    return { isSnoozed: false, snoozedUntil: null };
  }
  const expiresAt = new Date(until);
  if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) {
    return { isSnoozed: false, snoozedUntil: null };
  }
  return { isSnoozed: true, snoozedUntil: expiresAt.toISOString() };
}

function enrichThread(thread, actorId, { unreadOverrides = {}, snoozedThreads = {} } = {}) {
  const title = buildThreadTitle(thread, actorId);
  const participants = formatThreadParticipants(thread, actorId);
  const unread = unreadOverrides[thread?.id] ? true : isThreadUnread(thread);
  const lastActivity = describeLastActivity(thread);
  const preview = typeof thread?.lastMessagePreview === 'string' ? thread.lastMessagePreview : '';
  const section = deriveThreadSection(thread);
  const { isSnoozed, snoozedUntil } = deriveSnooze(thread?.id, snoozedThreads);
  const unreadCount = Number.isFinite(thread?.unreadCount)
    ? Number(thread.unreadCount)
    : unread
    ? 1
    : 0;
  const presence = Boolean(
    Array.isArray(thread?.participants) &&
      thread.participants.some((participant) => `${participant?.presence?.status ?? ''}`.toLowerCase() === 'online'),
  );
  const badgeLabels = new Set();
  if (thread?.pinned) {
    badgeLabels.add('Pinned');
  }
  if (section === 'priority') {
    badgeLabels.add('Priority');
  }
  if (section === 'mentors') {
    badgeLabels.add('Mentor');
  }
  if (section === 'projects') {
    badgeLabels.add('Project');
  }
  if (thread?.supportCase?.status) {
    badgeLabels.add(thread.supportCase.status);
  }
  if (thread?.state && typeof thread.state === 'string') {
    badgeLabels.add(thread.state);
  }

  return {
    ...thread,
    title,
    participants,
    unread,
    lastActivity,
    preview,
    section,
    unreadCount,
    isSnoozed,
    snoozedUntil,
    presence,
    badgeLabels: Array.from(badgeLabels),
  };
}

function formatSnoozeLabel(until) {
  if (!until) {
    return null;
  }
  try {
    const expiresAt = new Date(until);
    if (Number.isNaN(expiresAt.getTime())) {
      return null;
    }
    return `Snoozed until ${expiresAt.toLocaleString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      month: 'short',
      day: 'numeric',
    })}`;
  } catch (error) {
    return null;
  }
}

function buildSearchTokens(thread) {
  const tokens = [];
  if (thread.title) {
    tokens.push(thread.title);
  }
  if (thread.preview) {
    tokens.push(thread.preview);
  }
  if (Array.isArray(thread.participants)) {
    tokens.push(thread.participants.join(' '));
  }
  if (Array.isArray(thread.labels)) {
    tokens.push(thread.labels.join(' '));
  }
  if (thread.metadata?.project?.name) {
    tokens.push(thread.metadata.project.name);
  }
  return tokens
    .join(' ')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function useCompactPreference(key = 'gigvora:web:messaging:compact') {
  const [compact, setCompact] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    try {
      return window.localStorage.getItem(key) === 'true';
    } catch (error) {
      return false;
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      window.localStorage.setItem(key, compact ? 'true' : 'false');
    } catch (error) {
      // Ignore persistence errors silently.
    }
  }, [compact, key]);

  return [compact, setCompact];
}

function SnoozeMenu({ onSelect, onUnsnooze, isSnoozed }) {
  return (
    <Menu as="div" className="relative inline-flex">
      <Menu.Button
        type="button"
        className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-500 transition hover:border-accent/60 hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        aria-label="Snooze conversation"
      >
        <ClockIcon className="h-4 w-4" />
        Snooze
        <EllipsisHorizontalIcon className="h-4 w-4" />
      </Menu.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform scale-95 opacity-0"
        enterTo="transform scale-100 opacity-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform scale-100 opacity-100"
        leaveTo="transform scale-95 opacity-0"
      >
        <Menu.Items className="absolute right-0 z-20 mt-2 w-52 origin-top-right rounded-2xl border border-slate-200 bg-white p-2 shadow-soft focus:outline-none">
          {SNOOZE_PRESETS.map((preset) => (
            <Menu.Item key={preset.minutes}>
              {({ active }) => (
                <button
                  type="button"
                  onClick={() => onSelect?.(preset.minutes)}
                  className={classNames(
                    'flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-medium transition',
                    active ? 'bg-accent/10 text-accent' : 'text-slate-600',
                  )}
                >
                  <span>{preset.label}</span>
                  <ClockIcon className="h-4 w-4" />
                </button>
              )}
            </Menu.Item>
          ))}
          {isSnoozed ? (
            <Menu.Item>
              {({ active }) => (
                <button
                  type="button"
                  onClick={() => onUnsnooze?.()}
                  className={classNames(
                    'mt-2 flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold transition',
                    active ? 'bg-emerald-50 text-emerald-600' : 'text-emerald-600',
                  )}
                >
                  End snooze
                  <MoonIcon className="h-4 w-4" />
                </button>
              )}
            </Menu.Item>
          ) : null}
        </Menu.Items>
      </Transition>
    </Menu>
  );
}

SnoozeMenu.propTypes = {
  onSelect: PropTypes.func,
  onUnsnooze: PropTypes.func,
  isSnoozed: PropTypes.bool,
};

SnoozeMenu.defaultProps = {
  onSelect: null,
  onUnsnooze: null,
  isSnoozed: false,
};

function ThreadPreviewRow({
  thread,
  actorId,
  selected,
  onSelect,
  onTogglePin,
  pinning,
  onMarkRead,
  onMarkUnread,
  onSnooze,
  onUnsnooze,
  compact,
}) {
  const handleSelect = useCallback(() => {
    onSelect?.(thread.id);
  }, [onSelect, thread.id]);

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleSelect();
      }
    },
    [handleSelect],
  );

  const snoozeLabel = formatSnoozeLabel(thread.snoozedUntil);
  const avatarParticipants = Array.isArray(thread.participants)
    ? thread.participants.slice(0, 2)
    : [];

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={handleSelect}
      onKeyDown={handleKeyDown}
      className={classNames(
        'group relative flex gap-3 rounded-3xl border px-4 py-3 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        selected
          ? 'border-accent bg-accentSoft shadow-soft'
          : thread.unread
          ? 'border-accent/40 bg-white shadow-sm'
          : 'border-slate-200 bg-white hover:border-accent/40',
        compact ? 'py-2' : 'py-3',
      )}
      aria-pressed={selected}
      aria-label={`Open conversation ${thread.title}`}
    >
      <div className="flex flex-none flex-col items-center gap-1 pt-1">
        <div className="relative">
          <UserAvatar
            name={thread.participants?.[0] ?? thread.title}
            size={compact ? 'sm' : 'md'}
            className={thread.unread ? 'ring-2 ring-accent ring-offset-2 ring-offset-white' : ''}
          />
          {thread.presence ? (
            <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" />
          ) : null}
        </div>
        {avatarParticipants.length > 1 ? (
          <div className="-mt-2 hidden items-center -space-x-2 sm:flex">
            {avatarParticipants.slice(1).map((participant) => (
              <UserAvatar
                key={participant}
                name={participant}
                size="xs"
                className="border border-white"
                showGlow={false}
              />
            ))}
          </div>
        ) : null}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900 group-hover:text-accent">{thread.title}</p>
            <p className="truncate text-xs text-slate-500">{thread.participants?.join(', ')}</p>
          </div>
          <div className="flex items-center gap-1">
            {thread.badgeLabels.map((label) => (
              <span
                key={label}
                className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500"
              >
                {label}
              </span>
            ))}
            {thread.unreadCount > 0 ? (
              <span className="inline-flex min-w-[1.75rem] justify-center rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                {thread.unreadCount}
              </span>
            ) : null}
          </div>
        </div>
        {thread.preview ? (
          <p className={classNames('text-xs text-slate-500', compact ? 'line-clamp-1' : 'line-clamp-2')}>
            {thread.preview}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span>{thread.lastActivity}</span>
            {snoozeLabel ? <span className="text-amber-600">{snoozeLabel}</span> : null}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="inline-flex items-center rounded-full border border-slate-200 p-1 text-slate-400 transition hover:border-accent/60 hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              onClick={(event) => {
                event.stopPropagation();
                onTogglePin?.(thread, !thread.pinned);
              }}
              aria-label={thread.pinned ? 'Unpin conversation' : 'Pin conversation'}
              disabled={pinning}
            >
              {thread.pinned ? <StarSolidIcon className="h-4 w-4 text-amber-500" /> : <BookmarkIcon className="h-4 w-4" />}
            </button>
            <button
              type="button"
              className="inline-flex items-center rounded-full border border-slate-200 p-1 text-slate-400 transition hover:border-accent/60 hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              onClick={(event) => {
                event.stopPropagation();
                if (thread.unread) {
                  onMarkRead?.(thread.id);
                } else {
                  onMarkUnread?.(thread.id);
                }
              }}
              aria-label={thread.unread ? 'Mark as read' : 'Mark as unread'}
            >
              {thread.unread ? <EnvelopeOpenIcon className="h-4 w-4" /> : <EnvelopeIcon className="h-4 w-4" />}
            </button>
            <SnoozeMenu
              onSelect={(minutes) => {
                onSnooze?.(thread.id, minutes);
              }}
              onUnsnooze={() => {
                onUnsnooze?.(thread.id);
              }}
              isSnoozed={Boolean(thread.isSnoozed)}
            />
          </div>
        </div>
      </div>
    </article>
  );
}

ThreadPreviewRow.propTypes = {
  thread: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string,
    participants: PropTypes.arrayOf(PropTypes.string),
    preview: PropTypes.string,
    lastActivity: PropTypes.string,
    unread: PropTypes.bool,
    unreadCount: PropTypes.number,
    pinned: PropTypes.bool,
    isSnoozed: PropTypes.bool,
    snoozedUntil: PropTypes.string,
    badgeLabels: PropTypes.arrayOf(PropTypes.string),
    presence: PropTypes.bool,
  }).isRequired,
  actorId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  selected: PropTypes.bool,
  onSelect: PropTypes.func,
  onTogglePin: PropTypes.func,
  pinning: PropTypes.bool,
  onMarkRead: PropTypes.func,
  onMarkUnread: PropTypes.func,
  onSnooze: PropTypes.func,
  onUnsnooze: PropTypes.func,
  compact: PropTypes.bool,
};

ThreadPreviewRow.defaultProps = {
  actorId: null,
  selected: false,
  onSelect: null,
  onTogglePin: null,
  pinning: false,
  onMarkRead: null,
  onMarkUnread: null,
  onSnooze: null,
  onUnsnooze: null,
  compact: false,
};

export default function MessagesInbox({
  threads,
  actorId,
  loading,
  error,
  onRefresh,
  selectedThreadId,
  onSelectThread,
  onTogglePin,
  pinningThreadIds,
  markThreadAsRead,
  markThreadAsUnread,
  snoozeThread,
  unsnoozeThread,
  snoozedThreads,
  unreadOverrides,
  lastSyncedAt,
  viewerName,
  membershipLabels,
}) {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());
  const [compact, setCompact] = useCompactPreference();
  const [visibleCount, setVisibleCount] = useState(24);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    setVisibleCount(24);
  }, [deferredSearch, activeFilter]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) {
      return () => {};
    }
    const handleScroll = () => {
      if (container.scrollTop + container.clientHeight >= container.scrollHeight - 120) {
        setVisibleCount((count) => Math.min(count + 20, threads.length));
      }
    };
    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [threads.length]);

  const pinningSet = useMemo(() => {
    if (pinningThreadIds instanceof Set) {
      return pinningThreadIds;
    }
    if (Array.isArray(pinningThreadIds)) {
      return new Set(pinningThreadIds);
    }
    return new Set();
  }, [pinningThreadIds]);

  const enrichedThreads = useMemo(
    () =>
      threads.map((thread) =>
        enrichThread(thread, actorId, { unreadOverrides: unreadOverrides ?? {}, snoozedThreads: snoozedThreads ?? {} }),
      ),
    [threads, actorId, snoozedThreads, unreadOverrides],
  );

  const stats = useMemo(() => {
    const total = enrichedThreads.length;
    const unread = enrichedThreads.filter((thread) => thread.unread).length;
    const priority = enrichedThreads.filter((thread) => thread.section === 'priority').length;
    const snoozed = enrichedThreads.filter((thread) => thread.isSnoozed).length;
    return { total, unread, priority, snoozed };
  }, [enrichedThreads]);

  const filteredThreads = useMemo(() => {
    const query = deferredSearch;
    return enrichedThreads.filter((thread) => {
      if (thread.isSnoozed && activeFilter !== 'snoozed') {
        return false;
      }
      switch (activeFilter) {
        case 'unread':
          if (!thread.unread) {
            return false;
          }
          break;
        case 'priority':
          if (thread.section !== 'priority') {
            return false;
          }
          break;
        case 'mentors':
          if (thread.section !== 'mentors') {
            return false;
          }
          break;
        case 'projects':
          if (thread.section !== 'projects') {
            return false;
          }
          break;
        case 'snoozed':
          if (!thread.isSnoozed) {
            return false;
          }
          break;
        default:
          break;
      }
      if (!query) {
        return true;
      }
      const tokens = buildSearchTokens(thread);
      return tokens.includes(query);
    });
  }, [enrichedThreads, deferredSearch, activeFilter]);

  const orderedThreads = useMemo(() => {
    const pinned = filteredThreads.filter((thread) => thread.pinned && activeFilter !== 'snoozed');
    const rest = filteredThreads.filter((thread) => !thread.pinned || activeFilter === 'snoozed');
    const grouped = SECTION_ORDER.map((section) => rest.filter((thread) => thread.section === section));
    return [...pinned, ...grouped.flat()];
  }, [filteredThreads, activeFilter]);

  const visibleThreadSet = useMemo(() => {
    return new Set(orderedThreads.slice(0, visibleCount).map((thread) => thread.id));
  }, [orderedThreads, visibleCount]);

  const groupedThreads = useMemo(() => {
    const entries = new Map();
    orderedThreads.forEach((thread) => {
      if (!visibleThreadSet.has(thread.id)) {
        return;
      }
      const key = thread.pinned && activeFilter !== 'snoozed' ? 'pinned' : thread.section;
      if (!entries.has(key)) {
        entries.set(key, []);
      }
      entries.get(key).push(thread);
    });
    return entries;
  }, [orderedThreads, visibleThreadSet, activeFilter]);

  const handleSearchChange = useCallback((event) => {
    setSearch(event.target.value);
  }, []);

  const renderSectionHeader = (key) => {
    if (key === 'pinned') {
      return 'Pinned conversations';
    }
    return SECTION_LABELS[key] ?? 'Inbox';
  };

  const handleSnooze = useCallback(
    (threadId, minutes) => {
      if (!threadId || !minutes) {
        return;
      }
      snoozeThread?.(threadId, minutes);
    },
    [snoozeThread],
  );

  const handleUnsnooze = useCallback(
    (threadId) => {
      if (!threadId) {
        return;
      }
      unsnoozeThread?.(threadId);
    },
    [unsnoozeThread],
  );

  return (
    <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{viewerName ?? 'Messaging inbox'}</p>
          <p className="text-xs text-slate-500">
            {lastSyncedAt ? `Synced ${describeLastActivity({ lastMessageAt: lastSyncedAt })}` : 'Live sync enabled'}
          </p>
          {membershipLabels?.length ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {membershipLabels.map((label) => (
                <span
                  key={label}
                  className="inline-flex items-center rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent"
                >
                  {label}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-semibold text-slate-500">
            <span>Total {stats.total}</span>
            <span className="text-accent">Unread {stats.unread}</span>
            <span>Priority {stats.priority}</span>
            <span>Snoozed {stats.snoozed}</span>
          </div>
          <Switch
            checked={compact}
            onChange={setCompact}
            className={classNames(
              compact ? 'bg-accent' : 'bg-slate-200',
              'relative inline-flex h-8 w-16 flex-shrink-0 items-center rounded-full transition'
            )}
          >
            <span className="sr-only">Toggle compact mode</span>
            <span
              className={classNames(
                compact ? 'translate-x-9' : 'translate-x-1',
                'inline-block h-6 w-6 transform rounded-full bg-white shadow transition'
              )}
            />
            <span className="absolute left-2 text-[10px] font-semibold text-slate-500">Cozy</span>
            <span className="absolute right-2 text-[10px] font-semibold text-white">Compact</span>
          </Switch>
          <button
            type="button"
            onClick={() => onRefresh?.()}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white shadow-soft transition hover:bg-accentDark"
          >
            <FunnelIcon className="h-4 w-4" /> Refresh
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={handleSearchChange}
              placeholder="Search people, projects, or keywords"
              className="w-full rounded-full border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm text-slate-700 shadow-sm transition focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((filter) => {
              const Icon = filter.icon;
              const active = activeFilter === filter.id;
              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setActiveFilter(filter.id)}
                  className={classNames(
                    'inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                    active
                      ? 'border-accent bg-accent text-white shadow-soft'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-accent/40 hover:text-accent',
                  )}
                >
                  {Icon ? <Icon className="h-4 w-4" /> : null}
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>
        {error ? (
          <p className="rounded-2xl bg-rose-50 px-4 py-3 text-xs text-rose-600" role="alert">
            {error}
          </p>
        ) : null}
      </div>
      <div
        ref={scrollContainerRef}
        className="max-h-[32rem] space-y-5 overflow-y-auto pr-1"
        aria-busy={loading}
        aria-live="polite"
      >
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-24 animate-pulse rounded-3xl bg-slate-100" />
            ))}
          </div>
        ) : groupedThreads.size ? (
          Array.from(groupedThreads.entries()).map(([key, items]) => (
            <section key={key} className="space-y-3">
              <header className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {renderSectionHeader(key)}
                </h3>
                <span className="text-[11px] text-slate-400">{items.length} threads</span>
              </header>
              <div className="space-y-3">
                {items.map((thread) => (
                  <ThreadPreviewRow
                    key={thread.id}
                    thread={thread}
                    actorId={actorId}
                    selected={selectedThreadId === thread.id}
                    onSelect={onSelectThread}
                    onTogglePin={onTogglePin}
                    pinning={pinningSet.has(thread.id)}
                    onMarkRead={markThreadAsRead}
                    onMarkUnread={markThreadAsUnread}
                    onSnooze={handleSnooze}
                    onUnsnooze={handleUnsnooze}
                    compact={compact}
                  />
                ))}
              </div>
            </section>
          ))
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">
            {activeFilter === 'snoozed'
              ? 'No snoozed conversations. Snooze threads to temporarily hide them from your inbox.'
              : 'No conversations match the current filters. Try adjusting filters or start a new thread from a project.'}
          </div>
        )}
      </div>
      {orderedThreads.length > visibleCount ? (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount((count) => Math.min(count + 20, orderedThreads.length))}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-accent/60 hover:text-accent"
          >
            Load more conversations
          </button>
        </div>
      ) : null}
    </div>
  );
}

MessagesInbox.propTypes = {
  threads: PropTypes.arrayOf(PropTypes.object).isRequired,
  actorId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  loading: PropTypes.bool,
  error: PropTypes.string,
  onRefresh: PropTypes.func,
  selectedThreadId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onSelectThread: PropTypes.func,
  onTogglePin: PropTypes.func,
  pinningThreadIds: PropTypes.oneOfType([
    PropTypes.instanceOf(Set),
    PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
  ]),
  markThreadAsRead: PropTypes.func,
  markThreadAsUnread: PropTypes.func,
  snoozeThread: PropTypes.func,
  unsnoozeThread: PropTypes.func,
  snoozedThreads: PropTypes.object,
  unreadOverrides: PropTypes.object,
  lastSyncedAt: PropTypes.string,
  viewerName: PropTypes.string,
  membershipLabels: PropTypes.arrayOf(PropTypes.string),
};

MessagesInbox.defaultProps = {
  actorId: null,
  loading: false,
  error: null,
  onRefresh: null,
  selectedThreadId: null,
  onSelectThread: null,
  onTogglePin: null,
  pinningThreadIds: undefined,
  markThreadAsRead: null,
  markThreadAsUnread: null,
  snoozeThread: null,
  unsnoozeThread: null,
  snoozedThreads: null,
  unreadOverrides: null,
  lastSyncedAt: null,
  viewerName: null,
  membershipLabels: null,
};

export function ThreadCard(props) {
  return <ThreadPreviewRow {...props} />;
}

ThreadCard.propTypes = ThreadPreviewRow.propTypes;
