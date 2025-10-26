import { Fragment, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Menu, Transition } from '@headlessui/react';
import {
  BellAlertIcon,
  BellIcon,
  BoltIcon,
  CheckIcon,
  Cog6ToothIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';
import { classNames } from '../../utils/classNames.js';
import { formatRelativeTime } from '../../utils/date.js';

function NotificationPreviewItem({
  notification,
  onOpen,
  onMarkRead,
}) {
  if (!notification) {
    return null;
  }

  const {
    id,
    title,
    body,
    timestamp,
    read,
    type,
    action,
  } = notification;

  const tag = type ? type.toString().toUpperCase() : 'ALERT';
  const timestampLabel = formatRelativeTime(timestamp) || 'Just now';
  const handleOpen = () => {
    onOpen?.(notification);
    if (!read && id) {
      onMarkRead?.(id);
    }
    if (action?.href && typeof window !== 'undefined') {
      window.location.assign(action.href);
    }
  };

  return (
    <button
      type="button"
      onClick={handleOpen}
      className={classNames(
        'group flex w-full flex-col gap-1.5 rounded-2xl border px-4 py-3 text-left transition',
        read
          ? 'border-slate-200 bg-white hover:border-accent/40 hover:bg-accent/10'
          : 'border-accent/60 bg-accent/10 shadow-sm shadow-accent/20 hover:bg-accent/20',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{tag}</p>
        {!read ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-white">
            New
          </span>
        ) : null}
      </div>
      <p className="text-sm font-semibold text-slate-900 [text-wrap:balance]">{title}</p>
      <p className="text-xs text-slate-600 line-clamp-2">{body}</p>
      <p className="pt-1 text-[0.65rem] uppercase tracking-[0.25em] text-slate-400">{timestampLabel}</p>
    </button>
  );
}

NotificationPreviewItem.propTypes = {
  notification: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    title: PropTypes.string,
    body: PropTypes.string,
    timestamp: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
    read: PropTypes.bool,
    type: PropTypes.string,
    action: PropTypes.shape({
      href: PropTypes.string,
    }),
  }),
  onOpen: PropTypes.func,
  onMarkRead: PropTypes.func,
};

NotificationPreviewItem.defaultProps = {
  notification: null,
  onOpen: undefined,
  onMarkRead: undefined,
};

function MessagePreview({ thread, onOpen }) {
  if (!thread) {
    return null;
  }

  const { sender, preview, timestamp, unread } = thread;
  const timestampLabel = formatRelativeTime(timestamp) || 'Moments ago';

  return (
    <button
      type="button"
      onClick={() => onOpen?.(thread)}
      className={classNames(
        'flex w-full flex-col gap-1 rounded-2xl border px-4 py-3 text-left transition',
        unread
          ? 'border-purple-200 bg-purple-50 hover:border-purple-300 hover:bg-purple-100'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-slate-500">{sender || 'Conversation'}</p>
        {unread ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-500 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-white">
            Unread
          </span>
        ) : null}
      </div>
      <p className="text-xs text-slate-600 line-clamp-2">{preview || 'No recent updates yet.'}</p>
      <p className="pt-1 text-[0.65rem] uppercase tracking-[0.25em] text-slate-400">{timestampLabel}</p>
    </button>
  );
}

MessagePreview.propTypes = {
  thread: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    sender: PropTypes.string,
    preview: PropTypes.string,
    timestamp: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
    unread: PropTypes.bool,
  }),
  onOpen: PropTypes.func,
};

MessagePreview.defaultProps = {
  thread: null,
  onOpen: undefined,
};

const PRIORITY_TYPES = new Set(['invite', 'system', 'alert', 'security', 'financial']);

export default function NotificationBell({
  notifications,
  messageThreads,
  unreadNotificationCount,
  unreadMessageCount,
  onMarkAllNotifications,
  onNotificationOpen,
  onNotificationRead,
  onThreadOpen,
  onOpenPreferences,
  markAllBusy,
  onBellOpen,
}) {
  const totalUnread = (Number.isFinite(unreadNotificationCount) ? unreadNotificationCount : 0) +
    (Number.isFinite(unreadMessageCount) ? unreadMessageCount : 0);

  const sortedNotifications = useMemo(() => {
    return Array.isArray(notifications)
      ? notifications
          .slice()
          .sort((a, b) => new Date(b.timestamp || b.createdAt || 0) - new Date(a.timestamp || a.createdAt || 0))
      : [];
  }, [notifications]);

  const priorityNotifications = useMemo(() => {
    return sortedNotifications
      .filter((item) => {
        if (item.priority && item.priority.toString().toLowerCase() === 'high') {
          return true;
        }
        return PRIORITY_TYPES.has((item.type || '').toString().toLowerCase());
      })
      .slice(0, 3);
  }, [sortedNotifications]);

  const recentNotifications = useMemo(() => sortedNotifications.slice(0, 5), [sortedNotifications]);

  const recentThreads = useMemo(() => {
    if (!Array.isArray(messageThreads)) {
      return [];
    }
    return messageThreads
      .slice()
      .sort((a, b) => new Date(b.timestamp || b.updatedAt || 0) - new Date(a.timestamp || a.updatedAt || 0))
      .slice(0, 3);
  }, [messageThreads]);

  const hasUnread = totalUnread > 0;
  const unreadLabel = hasUnread ? `${totalUnread} unread alerts` : 'All caught up';

  const handleMarkAll = () => {
    if (markAllBusy) {
      return;
    }
    onMarkAllNotifications?.();
  };

  const handleAfterEnter = () => {
    onBellOpen?.();
  };

  return (
    <Menu as="div" className="relative">
      <Menu.Button
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-600 shadow-sm transition hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        aria-label={unreadLabel}
      >
        <BellIcon className="h-5 w-5" aria-hidden="true" />
        {hasUnread ? (
          <span className="absolute -right-1 -top-1 inline-flex min-h-[1.25rem] min-w-[1.25rem] items-center justify-center rounded-full bg-accent px-1 text-[0.65rem] font-semibold text-white shadow-lg shadow-accent/40">
            {totalUnread > 99 ? '99+' : totalUnread}
          </span>
        ) : null}
      </Menu.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
        afterEnter={handleAfterEnter}
      >
        <Menu.Items className="absolute right-0 z-50 mt-3 w-96 origin-top-right space-y-4 rounded-3xl border border-slate-200/80 bg-white/95 p-5 shadow-2xl backdrop-blur focus:outline-none">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Notifications</p>
              <p className="text-base font-semibold text-slate-900">{hasUnread ? 'Stay ahead of every pulse' : 'You are in sync'}</p>
              <p className="text-xs text-slate-500">{hasUnread ? `${totalUnread} new items waiting` : 'We will nudge you as soon as something needs you.'}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <button
                type="button"
                onClick={handleMarkAll}
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:border-slate-100 disabled:text-slate-400"
                disabled={!hasUnread || markAllBusy}
              >
                <CheckIcon className={classNames('h-4 w-4', markAllBusy ? 'animate-spin' : '')} />
                Mark all read
              </button>
              <Link
                to="/notifications"
                className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent px-3 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-accent-strong"
              >
                <BoltIcon className="h-4 w-4" />
                Open center
              </Link>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-3xl border border-accent/30 bg-accent/10 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-accent">
                <BellAlertIcon className="h-4 w-4" /> Priority signals
              </div>
              {priorityNotifications.length ? (
                <div className="mt-3 grid gap-3">
                  {priorityNotifications.map((notification) => (
                    <NotificationPreviewItem
                      key={notification.id}
                      notification={notification}
                      onOpen={onNotificationOpen}
                      onMarkRead={onNotificationRead}
                    />
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-xs text-slate-500">No urgent alerts. We will surface critical updates instantly.</p>
              )}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white/90 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                  <BoltIcon className="h-4 w-4 text-amber-500" /> Latest updates
                </div>
                {onOpenPreferences ? (
                  <button
                    type="button"
                    onClick={onOpenPreferences}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-slate-500 transition hover:border-accent hover:text-accent"
                  >
                    <Cog6ToothIcon className="h-3.5 w-3.5" /> Preferences
                  </button>
                ) : null}
              </div>
              {recentNotifications.length ? (
                <div className="mt-3 grid gap-2">
                  {recentNotifications.map((notification) => (
                    <NotificationPreviewItem
                      key={`recent-${notification.id}`}
                      notification={notification}
                      onOpen={onNotificationOpen}
                      onMarkRead={onNotificationRead}
                    />
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-xs text-slate-500">You have read every update. Fresh activity will appear here.</p>
              )}
            </div>

            <div className="rounded-3xl border border-purple-200/80 bg-purple-50/80 p-4">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-purple-500">
                <EnvelopeIcon className="h-4 w-4" /> Conversations
              </div>
              {recentThreads.length ? (
                <div className="mt-3 grid gap-2">
                  {recentThreads.map((thread) => (
                    <MessagePreview key={thread.id} thread={thread} onOpen={onThreadOpen} />
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-xs text-purple-600">Inbox is quiet. Collaborators will appear here the moment they reach out.</p>
              )}
            </div>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}

NotificationBell.propTypes = {
  notifications: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      title: PropTypes.string,
      body: PropTypes.string,
      timestamp: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
      createdAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
      read: PropTypes.bool,
      type: PropTypes.string,
      priority: PropTypes.string,
      action: PropTypes.shape({ href: PropTypes.string, label: PropTypes.string }),
    }),
  ),
  messageThreads: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      sender: PropTypes.string,
      preview: PropTypes.string,
      timestamp: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
      updatedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
      unread: PropTypes.bool,
    }),
  ),
  unreadNotificationCount: PropTypes.number,
  unreadMessageCount: PropTypes.number,
  onMarkAllNotifications: PropTypes.func,
  onNotificationOpen: PropTypes.func,
  onNotificationRead: PropTypes.func,
  onThreadOpen: PropTypes.func,
  onOpenPreferences: PropTypes.func,
  markAllBusy: PropTypes.bool,
  onBellOpen: PropTypes.func,
};

NotificationBell.defaultProps = {
  notifications: [],
  messageThreads: [],
  unreadNotificationCount: 0,
  unreadMessageCount: 0,
  onMarkAllNotifications: undefined,
  onNotificationOpen: undefined,
  onNotificationRead: undefined,
  onThreadOpen: undefined,
  onOpenPreferences: undefined,
  markAllBusy: false,
  onBellOpen: undefined,
};
