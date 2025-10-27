import { Fragment, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Popover, Transition } from '@headlessui/react';
import { BellIcon } from '@heroicons/react/24/outline';
import useNotificationCenter from '../../hooks/useNotificationCenter.js';
import analytics from '../../services/analytics.js';
import NotificationCenter from './NotificationCenter.jsx';
import { classNames } from '../../utils/classNames.js';

function formatBadgeCount(count) {
  if (!count) {
    return null;
  }
  if (count > 99) {
    return '99+';
  }
  if (count > 9) {
    return `${Math.floor(count / 10)}${count % 10}+`;
  }
  return `${count}`;
}

export default function NotificationBell({ session, feedPosts, onOpen, variant = 'compact' }) {
  const {
    notifications,
    unreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  } = useNotificationCenter(session, { feedPosts });

  const sortedNotifications = useMemo(() => {
    return [...notifications]
      .map((item) => ({
        ...item,
        timestamp: item?.timestamp ?? item?.createdAt ?? item?.occurredAt ?? item?.sentAt ?? item?.updatedAt ?? null,
      }))
      .sort((a, b) => {
        const aTime = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const bTime = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return bTime - aTime;
      });
  }, [notifications]);

  const previewNotifications = useMemo(() => sortedNotifications.slice(0, 4), [sortedNotifications]);
  const badgeLabel = formatBadgeCount(unreadNotificationCount);

  const handlePanelOpen = () => {
    analytics.track(
      'web_header_notifications_popover_opened',
      {
        unread: unreadNotificationCount,
        previewCount: previewNotifications.length,
      },
      { userId: session?.id },
    );
    onOpen?.();
  };

  const handleNotificationAction = (notification, safeAction) => {
    if (!notification) {
      return;
    }
    markNotificationAsRead(notification.id);
    analytics.track(
      'web_header_notification_selected',
      {
        notificationId: notification.id,
        actionHref: safeAction?.href ?? null,
        category: notification.type ?? 'Alert',
      },
      { userId: session?.id },
    );
    if (safeAction?.href && typeof window !== 'undefined') {
      window.location.assign(safeAction.href);
    }
  };

  const isDock = variant === 'dock';
  const wrapperClass = classNames('relative', 'hidden lg:block');
  const buttonClass = isDock
    ? 'group flex h-[4.5rem] w-20 flex-col items-center justify-center gap-1 rounded-none border-b-2 border-transparent px-2 text-[0.7rem] font-semibold text-slate-500 transition hover:border-slate-300 hover:text-slate-900'
    : 'relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-accent hover:text-accent';
  const iconWrapperClass = isDock
    ? 'relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm transition group-hover:border-slate-300 group-hover:shadow'
    : 'relative inline-flex h-5 w-5 items-center justify-center';
  const badgeClass = isDock
    ? 'absolute -top-1 -right-1 inline-flex min-h-[1.25rem] min-w-[1.25rem] items-center justify-center rounded-full bg-accent px-1 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-white shadow-lg'
    : 'absolute -top-1 -right-1 inline-flex min-h-[1.4rem] min-w-[1.4rem] items-center justify-center rounded-full bg-accent px-1 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-white shadow-lg';
  const ariaLabel = badgeLabel ? `${badgeLabel} unread notifications` : 'Notifications';

  return (
    <Popover className={wrapperClass}>
      <Popover.Button className={buttonClass} aria-label={ariaLabel}>
        <span className={iconWrapperClass}>
          <BellIcon
            className={classNames(
              isDock ? 'h-5 w-5 text-slate-500 transition group-hover:text-slate-900' : 'h-5 w-5',
            )}
            aria-hidden="true"
          />
          {badgeLabel ? <span className={badgeClass}>{badgeLabel}</span> : null}
        </span>
        {isDock ? <span className="leading-tight">Notifications</span> : null}
      </Popover.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-150"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-100"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
        afterEnter={handlePanelOpen}
      >
        <Popover.Panel className="absolute right-0 z-50 mt-3 w-[24rem] origin-top-right">
          <NotificationCenter
            notifications={previewNotifications}
            unreadCount={unreadNotificationCount}
            onNotificationAction={handleNotificationAction}
            onNotificationMarkRead={markNotificationAsRead}
            onMarkAllRead={markAllNotificationsAsRead}
            variant="popover"
            viewAllHref="/notifications"
            viewAllLabel="Open full centre ↗"
          />
        </Popover.Panel>
      </Transition>
    </Popover>
  );
}

NotificationBell.propTypes = {
  session: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }),
  feedPosts: PropTypes.arrayOf(PropTypes.object),
  onOpen: PropTypes.func,
  variant: PropTypes.oneOf(['compact', 'dock']),
};

NotificationBell.defaultProps = {
  session: null,
  feedPosts: [],
  onOpen: undefined,
  variant: 'compact',
};
