import { Fragment, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Popover, Transition } from '@headlessui/react';
import { BellIcon } from '@heroicons/react/24/outline';
import useNotificationCenter from '../../hooks/useNotificationCenter.js';
import analytics from '../../services/analytics.js';
import NotificationCenter from './NotificationCenter.jsx';

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

export default function NotificationBell({ session, feedPosts, onOpen }) {
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

  return (
    <Popover className="relative hidden lg:block">
      <Popover.Button
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-accent hover:text-accent"
        aria-label={badgeLabel ? `${badgeLabel} unread notifications` : 'Notifications'}
      >
        <BellIcon className="h-5 w-5" aria-hidden="true" />
        {badgeLabel ? (
          <span className="absolute -top-1 -right-1 inline-flex min-h-[1.4rem] min-w-[1.4rem] items-center justify-center rounded-full bg-accent px-1 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-white shadow-lg">
            {badgeLabel}
          </span>
        ) : null}
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
};

NotificationBell.defaultProps = {
  session: null,
  feedPosts: [],
  onOpen: undefined,
};
