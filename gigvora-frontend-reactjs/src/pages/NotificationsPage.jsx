import { useEffect, useMemo, useRef, useState } from 'react';
import { BellAlertIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import useSession from '../hooks/useSession.js';
import useNotificationCenter from '../hooks/useNotificationCenter.js';
import useAuthorization from '../hooks/useAuthorization.js';
import { formatRelativeTime } from '../utils/date.js';

function NotificationCard({ notification, onOpen }) {
  const handleClick = () => {
    if (typeof onOpen === 'function') {
      onOpen(notification);
    }
    if (notification?.action?.href) {
      window.location.assign(notification.action.href);
    }
  };

  return (
    <article
      className={`group relative overflow-hidden rounded-3xl border px-5 py-4 transition focus-within:ring-2 focus-within:ring-accent/40 ${
        notification.read
          ? 'border-slate-200 bg-white'
          : 'border-accent/40 bg-accentSoft shadow-sm shadow-accent/10'
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{notification.type}</p>
          <h3 className="text-base font-semibold text-slate-900 [text-wrap:balance]">{notification.title}</h3>
          <p className="text-sm text-slate-600 [overflow-wrap:anywhere]">{notification.body}</p>
          <p className="pt-1 text-xs font-medium text-slate-400">{formatRelativeTime(notification.timestamp)}</p>
        </div>
        {notification.action ? (
          <button
            type="button"
            onClick={handleClick}
            className="inline-flex shrink-0 items-center justify-center rounded-full border border-accent/30 bg-white px-4 py-2 text-xs font-semibold text-accent transition hover:border-accent hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            {notification.action.label}
          </button>
        ) : null}
      </div>
    </article>
  );
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { session, isAuthenticated } = useSession();
  const { canAccess } = useAuthorization();
  const {
    notifications,
    unreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  } = useNotificationCenter(session);
  const [pushStatus, setPushStatus] = useState('idle');
  const redirectGuardRef = useRef(false);
  const isAuthorizedForCenter = canAccess('notifications:center');
  const canManagePush = canAccess('notifications:push');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (isAuthorizedForCenter) {
      redirectGuardRef.current = false;
      return;
    }
    if (isAuthenticated && !redirectGuardRef.current) {
      redirectGuardRef.current = true;
      navigate('/feed', {
        replace: true,
        state: { reason: 'notifications-access-denied' },
      });
    }
  }, [isAuthenticated, isAuthorizedForCenter, navigate]);

  const sortedNotifications = useMemo(
    () =>
      isAuthorizedForCenter
        ? notifications.slice().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        : [],
    [notifications, isAuthorizedForCenter],
  );

  const displayUnreadCount = isAuthorizedForCenter ? unreadNotificationCount : 0;
  const hasNotifications = sortedNotifications.length > 0;

  useEffect(() => {
    if (!isAuthorizedForCenter) {
      return;
    }
    if (!canManagePush) {
      setPushStatus((status) => (status === 'forbidden' ? status : 'forbidden'));
    } else if (pushStatus === 'forbidden') {
      setPushStatus('idle');
    }
  }, [canManagePush, isAuthorizedForCenter, pushStatus]);

  const handleEnablePush = async () => {
    if (!canManagePush) {
      setPushStatus('forbidden');
      return;
    }
    if (typeof window === 'undefined') {
      return;
    }
    if (!('Notification' in window)) {
      setPushStatus('unsupported');
      return;
    }
    try {
      setPushStatus('requesting');
      const permission = await window.Notification.requestPermission();
      if (permission === 'granted') {
        setPushStatus('granted');
      } else if (permission === 'denied') {
        setPushStatus('denied');
      } else {
        setPushStatus('dismissed');
      }
    } catch (error) {
      setPushStatus('error');
      console.error('Unable to request notification permission', error);
    }
  };

  const renderPushStatus = () => {
    switch (pushStatus) {
      case 'granted':
        return <p className="text-xs font-semibold text-emerald-600">Push alerts enabled for this browser.</p>;
      case 'denied':
        return (
          <p className="text-xs font-semibold text-rose-600">
            Browser blocked notifications. Enable them in settings to receive real-time alerts.
          </p>
        );
      case 'unsupported':
        return <p className="text-xs font-semibold text-amber-600">Push notifications are not supported in this browser.</p>;
      case 'dismissed':
        return <p className="text-xs font-semibold text-slate-500">Permission request dismissed. Try again when ready.</p>;
      case 'error':
        return <p className="text-xs font-semibold text-rose-600">Something went wrong while enabling push alerts.</p>;
      case 'forbidden':
        return (
          <p className="text-xs font-semibold text-rose-600">
            Your current workspace role cannot register for push notifications. Switch to an eligible membership to continue.
          </p>
        );
      case 'requesting':
        return <p className="text-xs font-semibold text-slate-500">Requesting permission…</p>;
      default:
        return null;
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  if (!isAuthorizedForCenter) {
    return (
      <section className="relative overflow-hidden py-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(191,219,254,0.35),_transparent_65%)]" aria-hidden="true" />
        <div className="relative mx-auto max-w-3xl px-6">
          <PageHeader
            eyebrow="Notifications"
            title="Access requires an eligible membership"
            description="Switch to a talent, company, or mentor workspace to open the notification centre and manage push alerts."
            actions={
              <button
                type="button"
                onClick={() => navigate('/feed')}
                className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
              >
                Return to feed
              </button>
            }
            meta={<span className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600">Restricted</span>}
          />
          <div className="mt-10 rounded-3xl border border-rose-200/70 bg-white/90 p-8 shadow-soft">
            <h2 className="text-base font-semibold text-slate-900">Why am I seeing this?</h2>
            <p className="mt-3 text-sm text-slate-600">
              Notifications are scoped to active Gigvora workspaces. If you recently joined a new organisation or switched roles,
              ask an administrator to grant you access or enable push alerts from the mobile app after selecting the correct
              membership.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden py-16">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(191,219,254,0.35),_transparent_65%)]" aria-hidden="true" />
      <div className="relative mx-auto max-w-4xl px-6">
        <PageHeader
          eyebrow="Notifications"
          title="Stay in sync with your network"
          description="Track invites, follows, comments, and live activity from across Gigvora."
          actions={
            <button
              type="button"
              onClick={markAllNotificationsAsRead}
              disabled={!hasNotifications || displayUnreadCount === 0}
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
            >
              Mark all read
            </button>
          }
          meta={
            <span className="inline-flex items-center gap-2 rounded-full bg-accentSoft px-3 py-1 text-xs font-semibold text-accent">
              <BellAlertIcon className="h-4 w-4" /> {displayUnreadCount} unread
            </span>
          }
        />

        <div className="mt-10 grid gap-6">
          <div className="rounded-3xl border border-accent/40 bg-white p-6 shadow-soft">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-xl">
                <p className="text-sm font-semibold text-slate-900">Enable push alerts</p>
                <p className="mt-1 text-xs text-slate-500">
                  Receive instant invites, follows, comments, and activity notifications even when the app is closed.
                </p>
                <div className="mt-2" aria-live="polite">{renderPushStatus()}</div>
              </div>
              <button
                type="button"
                onClick={handleEnablePush}
                disabled={!canManagePush || pushStatus === 'requesting'}
                className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white shadow-soft transition hover:bg-accentDark disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {canManagePush ? 'Enable browser alerts' : 'Unavailable for this role'}
              </button>
            </div>
          </div>

          {hasNotifications ? (
            sortedNotifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onOpen={() => markNotificationAsRead(notification.id)}
              />
            ))
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500">
              You’re all caught up. New activity will land here first.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
