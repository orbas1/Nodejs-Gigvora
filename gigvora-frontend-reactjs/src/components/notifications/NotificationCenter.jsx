import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  BellAlertIcon,
  BoltIcon,
  ChatBubbleLeftRightIcon,
  CheckIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  NoSymbolIcon,
} from '@heroicons/react/24/outline';
import { classNames } from '../../utils/classNames.js';
import { formatRelativeTime } from '../../utils/date.js';

const VIEW_FILTERS = [
  { key: 'priority', label: 'Priority' },
  { key: 'updates', label: 'Updates' },
  { key: 'community', label: 'Community' },
  { key: 'messages', label: 'Messages' },
  { key: 'all', label: 'All' },
];

const CATEGORY_META = {
  priority: {
    icon: BellAlertIcon,
    badgeClass: 'bg-rose-100 text-rose-600',
    description: 'Critical invites, escalations, and financial checkpoints.',
  },
  updates: {
    icon: BoltIcon,
    badgeClass: 'bg-amber-100 text-amber-600',
    description: 'Product updates, launches, and spotlight activity.',
  },
  community: {
    icon: ChatBubbleLeftRightIcon,
    badgeClass: 'bg-blue-100 text-blue-600',
    description: 'Threads, comments, and group momentum.',
  },
};

const QUIET_HOURS_TEMPLATE = { start: null, end: null, timezone: 'UTC' };

function normaliseNotification(notification) {
  if (!notification) {
    return null;
  }

  const createdAt = notification.timestamp || notification.createdAt || new Date().toISOString();
  const category = (notification.category || notification.type || 'updates').toString().toLowerCase();
  const priority = notification.priority ? notification.priority.toString().toLowerCase() : null;

  let view = 'updates';
  if (priority === 'high' || ['invite', 'security', 'financial', 'alert'].includes(category)) {
    view = 'priority';
  } else if (['comment', 'activity', 'community'].includes(category)) {
    view = 'community';
  }

  return {
    ...notification,
    createdAt,
    view,
    category,
    priority,
    read: Boolean(notification.read || notification.readAt),
  };
}

function normaliseThread(thread) {
  if (!thread) {
    return null;
  }
  return {
    ...thread,
    timestamp: thread.timestamp || thread.updatedAt || thread.lastMessageAt || new Date().toISOString(),
    preview: thread.preview || thread.snippet || thread.lastMessagePreview || 'Conversation update is on standby.',
    sender: thread.sender || thread.title || 'Conversation',
    unread: Boolean(thread.unread ?? thread.unreadCount > 0),
  };
}

function NotificationRow({ notification, onOpen, onMarkRead }) {
  const Icon = CATEGORY_META[notification.view]?.icon ?? BoltIcon;
  const badgeClass = CATEGORY_META[notification.view]?.badgeClass ?? 'bg-slate-100 text-slate-600';
  const timestampLabel = formatRelativeTime(notification.createdAt) || 'Just now';
  const unread = !notification.read;

  const handleOpen = () => {
    onOpen?.(notification);
    if (unread) {
      onMarkRead?.(notification.id);
    }
  };

  return (
    <article
      className={classNames(
        'group relative overflow-hidden rounded-3xl border px-5 py-4 transition',
        unread
          ? 'border-accent/40 bg-accent/10 shadow-sm shadow-accent/10'
          : 'border-slate-200 bg-white hover:border-slate-300',
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            <span className={classNames('inline-flex items-center gap-2 rounded-full px-2 py-0.5 text-[0.65rem]', badgeClass)}>
              <Icon className="h-3.5 w-3.5" />
              {notification.view}
            </span>
            <span>{timestampLabel}</span>
          </div>
          <h3 className="text-base font-semibold text-slate-900 [text-wrap:balance]">{notification.title}</h3>
          <p className="text-sm text-slate-600 line-clamp-3">{notification.body}</p>
          {notification.action?.label ? (
            <p className="text-xs font-semibold text-accent">{notification.action.label}</p>
          ) : null}
        </div>
        <div className="flex flex-col items-end gap-2">
          <button
            type="button"
            onClick={handleOpen}
            className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-white px-4 py-1.5 text-xs font-semibold text-accent shadow-sm transition hover:border-accent hover:bg-accent/10"
          >
            View
          </button>
          {unread ? (
            <button
              type="button"
              onClick={() => onMarkRead?.(notification.id)}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-slate-500 transition hover:border-accent hover:text-accent"
            >
              <CheckIcon className="h-3.5 w-3.5" />
              Mark read
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

NotificationRow.propTypes = {
  notification: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string,
    body: PropTypes.string,
    view: PropTypes.string,
    createdAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
    read: PropTypes.bool,
    action: PropTypes.shape({ label: PropTypes.string }),
  }).isRequired,
  onOpen: PropTypes.func,
  onMarkRead: PropTypes.func,
};

NotificationRow.defaultProps = {
  onOpen: undefined,
  onMarkRead: undefined,
};

function ThreadRow({ thread, onOpen, onMarkRead }) {
  const timestampLabel = formatRelativeTime(thread.timestamp) || 'Just now';
  const unread = Boolean(thread.unread);

  const handleOpen = () => {
    onOpen?.(thread);
    if (unread) {
      onMarkRead?.(thread.id);
    }
  };

  return (
    <article
      className={classNames(
        'rounded-3xl border px-5 py-4 transition',
        unread
          ? 'border-purple-300 bg-purple-50/90 shadow-sm shadow-purple-200'
          : 'border-slate-200 bg-white hover:border-slate-300',
      )}
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-slate-900">{thread.sender}</p>
          {unread ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-500 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-white">
              Unread
            </span>
          ) : null}
        </div>
        <p className="text-xs text-slate-600 line-clamp-3">{thread.preview}</p>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[0.65rem] uppercase tracking-[0.3em] text-slate-400">{timestampLabel}</p>
          <button
            type="button"
            onClick={handleOpen}
            className="inline-flex items-center gap-2 rounded-full border border-purple-300 bg-white px-3 py-1 text-xs font-semibold text-purple-600 transition hover:border-purple-400 hover:text-purple-700"
          >
            View thread
          </button>
        </div>
      </div>
    </article>
  );
}

ThreadRow.propTypes = {
  thread: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    sender: PropTypes.string,
    preview: PropTypes.string,
    timestamp: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
    unread: PropTypes.bool,
  }).isRequired,
  onOpen: PropTypes.func,
  onMarkRead: PropTypes.func,
};

ThreadRow.defaultProps = {
  onOpen: undefined,
  onMarkRead: undefined,
};

export default function NotificationCenter({
  notifications,
  messageThreads,
  unreadNotificationCount,
  unreadMessageCount,
  quietHours,
  digestFrequency,
  loading,
  onNotificationOpen,
  onNotificationRead,
  onThreadOpen,
  onThreadRead,
  onMarkAllNotifications,
  onMarkAllThreads,
  markAllNotificationsBusy,
  markAllThreadsBusy,
}) {
  const [view, setView] = useState('priority');
  const [searchQuery, setSearchQuery] = useState('');

  const normalisedNotifications = useMemo(() => {
    return Array.isArray(notifications)
      ? notifications
          .map(normaliseNotification)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      : [];
  }, [notifications]);

  const normalisedThreads = useMemo(() => {
    return Array.isArray(messageThreads)
      ? messageThreads.map(normaliseThread).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      : [];
  }, [messageThreads]);

  const appliedQuietHours = useMemo(() => ({
    ...QUIET_HOURS_TEMPLATE,
    ...(quietHours && typeof quietHours === 'object' ? quietHours : {}),
  }), [quietHours]);

  const filteredNotifications = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return normalisedNotifications.filter((notification) => {
      const matchesView =
        view === 'all' || view === notification.view || (view === 'messages' && false);
      if (!matchesView) {
        return false;
      }
      if (!query) {
        return true;
      }
      const haystack = `${notification.title} ${notification.body}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [normalisedNotifications, view, searchQuery]);

  const filteredThreads = useMemo(() => {
    if (view !== 'messages' && view !== 'all') {
      return [];
    }
    const query = searchQuery.trim().toLowerCase();
    return normalisedThreads.filter((thread) => {
      if (!query) {
        return true;
      }
      const haystack = `${thread.sender} ${thread.preview}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [normalisedThreads, view, searchQuery]);

  const unreadSummary = useMemo(() => {
    const priorityCount = normalisedNotifications.filter(
      (notification) => notification.view === 'priority' && !notification.read,
    ).length;
    const updateCount = normalisedNotifications.filter(
      (notification) => notification.view === 'updates' && !notification.read,
    ).length;
    const communityCount = normalisedNotifications.filter(
      (notification) => notification.view === 'community' && !notification.read,
    ).length;
    const messageCount = normalisedThreads.filter((thread) => thread.unread).length;

    return {
      priority: priorityCount,
      updates: updateCount,
      community: communityCount,
      messages: messageCount,
      all: priorityCount + updateCount + communityCount + messageCount,
    };
  },
    [normalisedNotifications, normalisedThreads],
  );

  const totalUnread = (Number.isFinite(unreadNotificationCount) ? unreadNotificationCount : 0) +
    (Number.isFinite(unreadMessageCount) ? unreadMessageCount : 0);

  const handleMarkAllNotifications = () => {
    if (!markAllNotificationsBusy) {
      onMarkAllNotifications?.();
    }
  };

  const handleMarkAllThreads = () => {
    if (!markAllThreadsBusy) {
      onMarkAllThreads?.();
    }
  };

  const showNotifications = view !== 'messages';
  const showThreads = view === 'messages' || view === 'all';
  const emptyNotifications = !loading && showNotifications && filteredNotifications.length === 0;
  const emptyThreads = !loading && showThreads && filteredThreads.length === 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
      <section className="space-y-5">
        <header className="rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Notification center</p>
              <h2 className="text-2xl font-semibold text-slate-900">Curate your momentum</h2>
              <p className="text-sm text-slate-500">
                {totalUnread ? `${totalUnread} items need your attention.` : 'You are fully caught up—great work!'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500">
                <FunnelIcon className="h-4 w-4" />
                <span>{view === 'messages' ? 'Conversations' : view.charAt(0).toUpperCase() + view.slice(1)}</span>
              </div>
              <div className="relative">
                <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="search"
                  placeholder="Search alerts or people"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="w-64 rounded-full border border-slate-200 bg-white px-9 py-2 text-sm text-slate-700 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {VIEW_FILTERS.map((filter) => {
              const active = view === filter.key;
              const badgeValue = unreadSummary[filter.key] ?? 0;
              return (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => setView(filter.key)}
                  className={classNames(
                    'rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] transition',
                    active
                      ? 'border-accent bg-accent text-white shadow-sm shadow-accent/30'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-accent/40 hover:text-accent',
                  )}
                >
                  {filter.label}
                  {badgeValue ? (
                    <span className="ml-1 rounded-full bg-white/20 px-1.5 py-0.5 text-[0.6rem] text-white">
                      {badgeValue}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </header>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={`skeleton-${index}`} className="animate-pulse rounded-3xl border border-slate-200 bg-white/80 p-5">
                <div className="h-4 w-32 rounded-full bg-slate-200" />
                <div className="mt-3 h-5 w-3/4 rounded-full bg-slate-100" />
                <div className="mt-2 h-4 w-full rounded-full bg-slate-100" />
                <div className="mt-2 h-4 w-2/3 rounded-full bg-slate-100" />
              </div>
            ))}
          </div>
        ) : null}

        {showNotifications && !loading ? (
          <div className="space-y-4">
            {filteredNotifications.map((notification) => (
              <NotificationRow
                key={notification.id}
                notification={notification}
                onOpen={onNotificationOpen}
                onMarkRead={onNotificationRead}
              />
            ))}
            {emptyNotifications ? (
              <div className="flex flex-col items-center gap-3 rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                <NoSymbolIcon className="h-8 w-8 text-slate-300" />
                <p>No alerts in this view. Explore other filters or relax knowing everything is covered.</p>
              </div>
            ) : null}
          </div>
        ) : null}

        {showThreads && !loading ? (
          <div className="space-y-4">
            {filteredThreads.map((thread) => (
              <ThreadRow key={thread.id} thread={thread} onOpen={onThreadOpen} onMarkRead={onThreadRead} />
            ))}
            {emptyThreads ? (
              <div className="flex flex-col items-center gap-3 rounded-3xl border border-purple-200 bg-purple-50/70 p-8 text-center text-sm text-purple-600">
                <ChatBubbleLeftRightIcon className="h-8 w-8" />
                <p>Conversations are quiet for now. Start a new thread or invite collaborators to spark activity.</p>
              </div>
            ) : null}
          </div>
        ) : null}
      </section>

      <aside className="space-y-4">
        <div className="grid gap-4 rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">Today&apos;s pulse</h3>
          <dl className="grid gap-3 text-sm text-slate-600">
            <div className="flex items-center justify-between">
              <dt className="flex items-center gap-2 text-slate-500">
                <BellAlertIcon className="h-4 w-4 text-rose-500" /> Priority
              </dt>
              <dd className="text-base font-semibold text-slate-900">{unreadSummary.priority}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="flex items-center gap-2 text-slate-500">
                <BoltIcon className="h-4 w-4 text-amber-500" /> Updates
              </dt>
              <dd className="text-base font-semibold text-slate-900">{unreadSummary.updates}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="flex items-center gap-2 text-slate-500">
                <ChatBubbleLeftRightIcon className="h-4 w-4 text-blue-500" /> Community
              </dt>
              <dd className="text-base font-semibold text-slate-900">{unreadSummary.community}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="flex items-center gap-2 text-slate-500">
                <ChatBubbleLeftRightIcon className="h-4 w-4 text-purple-500" /> Messages
              </dt>
              <dd className="text-base font-semibold text-slate-900">{unreadSummary.messages}</dd>
            </div>
          </dl>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={handleMarkAllNotifications}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-accent/40 bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-200"
              disabled={
                markAllNotificationsBusy ||
                !(unreadSummary.priority || unreadSummary.updates || unreadSummary.community)
              }
            >
              <CheckIcon className={classNames('h-4 w-4', markAllNotificationsBusy ? 'animate-spin' : '')} />
              Mark alerts read
            </button>
            <button
              type="button"
              onClick={handleMarkAllThreads}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-purple-200 bg-white px-4 py-2 text-sm font-semibold text-purple-600 transition hover:border-purple-300 hover:text-purple-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
              disabled={markAllThreadsBusy || !unreadSummary.messages}
            >
              <CheckIcon className={classNames('h-4 w-4', markAllThreadsBusy ? 'animate-spin' : '')} />
              Mark conversations read
            </button>
          </div>
        </div>

        <div className="space-y-3 rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">Quiet hours</h3>
          <p className="text-xs text-slate-500">
            Snoozing between{' '}
            <span className="font-semibold text-slate-700">{appliedQuietHours.start || '—'}</span>
            {' and '}
            <span className="font-semibold text-slate-700">{appliedQuietHours.end || '—'}</span>{' '}
            {appliedQuietHours.timezone ? `(${appliedQuietHours.timezone})` : null}. Urgent alerts will override when marked critical.
          </p>
        </div>

        <div className="space-y-3 rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">Digest cadence</h3>
          <p className="text-xs text-slate-500">
            Daily digest scheduled for <span className="font-semibold text-slate-700">{digestFrequency || 'immediate dispatch'}</span>. Adjust cadence from preferences to match your workflow.
          </p>
        </div>
      </aside>
    </div>
  );
}

NotificationCenter.propTypes = {
  notifications: PropTypes.arrayOf(PropTypes.object),
  messageThreads: PropTypes.arrayOf(PropTypes.object),
  unreadNotificationCount: PropTypes.number,
  unreadMessageCount: PropTypes.number,
  quietHours: PropTypes.shape({
    start: PropTypes.string,
    end: PropTypes.string,
    timezone: PropTypes.string,
  }),
  digestFrequency: PropTypes.string,
  loading: PropTypes.bool,
  onNotificationOpen: PropTypes.func,
  onNotificationRead: PropTypes.func,
  onThreadOpen: PropTypes.func,
  onThreadRead: PropTypes.func,
  onMarkAllNotifications: PropTypes.func,
  onMarkAllThreads: PropTypes.func,
  markAllNotificationsBusy: PropTypes.bool,
  markAllThreadsBusy: PropTypes.bool,
};

NotificationCenter.defaultProps = {
  notifications: [],
  messageThreads: [],
  unreadNotificationCount: 0,
  unreadMessageCount: 0,
  quietHours: QUIET_HOURS_TEMPLATE,
  digestFrequency: 'immediate',
  loading: false,
  onNotificationOpen: undefined,
  onNotificationRead: undefined,
  onThreadOpen: undefined,
  onThreadRead: undefined,
  onMarkAllNotifications: undefined,
  onMarkAllThreads: undefined,
  markAllNotificationsBusy: false,
  markAllThreadsBusy: false,
};
