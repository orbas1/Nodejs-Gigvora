import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { ArrowPathIcon, BellAlertIcon, CheckIcon, ClockIcon } from '@heroicons/react/24/outline';
import { formatRelativeTime } from '../../utils/date.js';
import { classNames } from '../../utils/classNames.js';

const ACCENT_CLASS_MAP = {
  accent: 'border-accent/40 bg-accent/10',
  success: 'border-emerald-200 bg-emerald-50',
  warning: 'border-amber-200 bg-amber-50',
  danger: 'border-rose-200 bg-rose-50',
  info: 'border-blue-200 bg-blue-50',
};

function resolveAction(action) {
  if (!action || typeof action !== 'object') {
    return null;
  }

  const label = typeof action.label === 'string' && action.label.trim() ? action.label.trim() : 'Open';
  const rawHref = typeof action.href === 'string' && action.href.trim() ? action.href.trim() : '';

  if (!rawHref) {
    return null;
  }

  if (typeof window === 'undefined') {
    return { label, href: rawHref };
  }

  try {
    const url = new URL(rawHref, window.location.origin);
    const isSameOrigin = url.origin === window.location.origin;
    const isSecure = url.protocol === 'https:';

    if (!isSameOrigin && !isSecure) {
      return null;
    }

    return { label, href: url.toString() };
  } catch (error) {
    console.warn('Blocked invalid notification action href', error);
    return null;
  }
}

function NotificationRow({
  notification,
  onAction,
  onMarkRead,
}) {
  const {
    id,
    title = 'Notification update',
    body = 'No additional details provided yet.',
    type = 'Alert',
    read = false,
    timestamp,
    accent,
  } = notification;

  const timestampLabel = formatRelativeTime(timestamp) || 'Just now';
  const safeAction = resolveAction(notification?.action);

  const handleMarkRead = () => {
    if (read) return;
    onMarkRead?.(id);
  };

  const handleAction = () => {
    onAction?.(notification, safeAction);
  };

  const accentClass = accent ? ACCENT_CLASS_MAP[accent] ?? null : null;

  return (
    <article
      className={classNames(
        'group relative overflow-hidden rounded-3xl border px-5 py-4 transition focus-within:ring-2 focus-within:ring-accent/40',
        read ? 'border-slate-200 bg-white' : 'border-accent/40 bg-accentSoft shadow-sm shadow-accent/10',
        accentClass,
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{type}</p>
          <h3 className="text-base font-semibold text-slate-900 [text-wrap:balance]">{title}</h3>
          <p className="text-sm text-slate-600 [overflow-wrap:anywhere]">{body}</p>
          <p className="pt-1 text-xs font-medium text-slate-400">{timestampLabel}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          {safeAction ? (
            <button
              type="button"
              onClick={handleAction}
              className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-white px-4 py-2 text-xs font-semibold text-accent transition hover:border-accent hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              {safeAction.label}
            </button>
          ) : null}
          {!read ? (
            <button
              type="button"
              onClick={handleMarkRead}
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 transition hover:text-slate-900"
            >
              <CheckIcon className="h-4 w-4" aria-hidden="true" />
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
    type: PropTypes.string,
    read: PropTypes.bool,
    timestamp: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    action: PropTypes.shape({
      label: PropTypes.string,
      href: PropTypes.string,
    }),
    accent: PropTypes.string,
  }).isRequired,
  onAction: PropTypes.func,
  onMarkRead: PropTypes.func,
};

NotificationRow.defaultProps = {
  onAction: undefined,
  onMarkRead: undefined,
};

export default function NotificationCenter({
  notifications,
  unreadCount,
  onNotificationAction,
  onNotificationMarkRead,
  onMarkAllRead,
  markAllBusy,
  variant,
  onRefresh,
  refreshing,
  lastUpdatedAt,
  viewAllHref,
  viewAllLabel,
  emptyState,
}) {
  const sortedNotifications = useMemo(() => {
    return [...notifications]
      .map((item) => ({
        ...item,
        timestamp: item?.timestamp ?? item?.createdAt ?? item?.updatedAt ?? item?.occurredAt ?? item?.sentAt ?? null,
      }))
      .sort((a, b) => {
        const aTime = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const bTime = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return bTime - aTime;
      });
  }, [notifications]);

  const items = useMemo(() => {
    if (variant === 'popover') {
      return sortedNotifications.slice(0, 4);
    }
    return sortedNotifications;
  }, [sortedNotifications, variant]);

  const headerTimestamp = lastUpdatedAt ?? sortedNotifications[0]?.timestamp ?? null;
  const headerTimestampLabel = headerTimestamp ? formatRelativeTime(headerTimestamp) : null;
  const hasNotifications = items.length > 0;
  const resolvedEmptyState = emptyState ?? {
    title: 'You’re all caught up',
    description: 'New alerts from your network, teams, and automations will appear here instantly.',
  };

  const handleMarkAll = () => {
    if (!unreadCount || markAllBusy) {
      return;
    }
    onMarkAllRead?.();
  };

  const handleAction = (notification, safeAction) => {
    if (!notification) {
      return;
    }
    if (!notification.read) {
      onNotificationMarkRead?.(notification.id);
    }
    onNotificationAction?.(notification, safeAction);
  };

  return (
    <section
      className={classNames(
        'rounded-[32px] border border-slate-200 bg-white/95 shadow-lg shadow-blue-100/30',
        variant === 'popover' ? 'p-4' : 'p-6 sm:p-8',
      )}
      aria-label="Notification centre"
    >
      <div className="flex flex-col gap-4 border-b border-slate-200/70 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">Notifications</p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-900">
            {variant === 'popover' ? 'Latest alerts' : 'Stay in sync with your world'}
          </h2>
          <p className="mt-2 max-w-xl text-sm text-slate-500">
            Effortlessly triage invites, approvals, and mentions from across Gigvora with rich context and instant actions.
          </p>
          {headerTimestampLabel ? (
            <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-slate-500">
              <ClockIcon className="h-3.5 w-3.5" aria-hidden="true" />
              Updated {headerTimestampLabel}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 text-xs font-semibold">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-accent">
            <BellAlertIcon className="h-4 w-4" aria-hidden="true" />
            {unreadCount} unread
          </span>
          {onRefresh ? (
            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <ArrowPathIcon
                className={classNames('h-4 w-4', refreshing ? 'animate-spin text-slate-400' : 'text-slate-500')}
                aria-hidden="true"
              />
              Refresh
            </button>
          ) : null}
          {onMarkAllRead ? (
            <button
              type="button"
              onClick={handleMarkAll}
              disabled={!unreadCount || markAllBusy}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-70"
            >
              Mark all read
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {hasNotifications
          ? items.map((notification) => (
              <NotificationRow
                key={notification.id}
                notification={notification}
                onAction={handleAction}
                onMarkRead={onNotificationMarkRead}
              />
            ))
          : (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 px-6 py-12 text-center">
                <h3 className="text-lg font-semibold text-slate-900">{resolvedEmptyState.title}</h3>
                <p className="mt-3 text-sm text-slate-500">{resolvedEmptyState.description}</p>
              </div>
            )}
      </div>

      {variant === 'popover' && viewAllHref ? (
        <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4">
          <a
            href={viewAllHref}
            className="text-sm font-semibold text-accent transition hover:text-accent-strong"
          >
            {viewAllLabel || 'Open full centre ↗'}
          </a>
          <p className="text-xs text-slate-400">
            History, analytics, and preferences live in the full centre.
          </p>
        </div>
      ) : null}
    </section>
  );
}

NotificationCenter.propTypes = {
  notifications: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      title: PropTypes.string,
      body: PropTypes.string,
      type: PropTypes.string,
      read: PropTypes.bool,
      timestamp: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
      action: PropTypes.shape({
        label: PropTypes.string,
        href: PropTypes.string,
      }),
      accent: PropTypes.string,
    }),
  ),
  unreadCount: PropTypes.number,
  onNotificationAction: PropTypes.func,
  onNotificationMarkRead: PropTypes.func,
  onMarkAllRead: PropTypes.func,
  markAllBusy: PropTypes.bool,
  variant: PropTypes.oneOf(['page', 'popover']),
  onRefresh: PropTypes.func,
  refreshing: PropTypes.bool,
  lastUpdatedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  viewAllHref: PropTypes.string,
  viewAllLabel: PropTypes.string,
  emptyState: PropTypes.shape({
    title: PropTypes.string,
    description: PropTypes.string,
  }),
};

NotificationCenter.defaultProps = {
  notifications: [],
  unreadCount: 0,
  onNotificationAction: undefined,
  onNotificationMarkRead: undefined,
  onMarkAllRead: undefined,
  markAllBusy: false,
  variant: 'page',
  onRefresh: undefined,
  refreshing: false,
  lastUpdatedAt: null,
  viewAllHref: undefined,
  viewAllLabel: undefined,
  emptyState: undefined,
};
