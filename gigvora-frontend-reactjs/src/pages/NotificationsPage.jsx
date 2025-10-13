import { useEffect, useMemo, useState } from 'react';
import { BellAlertIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import useSession from '../hooks/useSession.js';
import useNotificationCenter from '../hooks/useNotificationCenter.js';
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
      className={`rounded-3xl border px-5 py-4 transition ${
        notification.read
          ? 'border-slate-200 bg-white'
          : 'border-accent/40 bg-accentSoft shadow-sm shadow-accent/10'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{notification.type}</p>
          <h3 className="mt-1 text-base font-semibold text-slate-900">{notification.title}</h3>
          <p className="mt-2 text-sm text-slate-600">{notification.body}</p>
          <p className="mt-3 text-xs text-slate-400">{formatRelativeTime(notification.timestamp)}</p>
        </div>
        {notification.action ? (
          <button
            type="button"
            onClick={handleClick}
            className="rounded-full border border-accent/30 bg-white px-4 py-2 text-xs font-semibold text-accent transition hover:border-accent hover:bg-accent/10"
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
  const {
    notifications,
    unreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  } = useNotificationCenter(session);
  const [pushStatus, setPushStatus] = useState('idle');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const sortedNotifications = useMemo(
    () => notifications.slice().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
    [notifications],
  );

  const handleEnablePush = async () => {
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
      case 'requesting':
        return <p className="text-xs font-semibold text-slate-500">Requesting permission…</p>;
      default:
        return null;
    }
  };

  if (!isAuthenticated) {
    return null;
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
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
            >
              Mark all read
            </button>
          }
          meta={
            <span className="inline-flex items-center gap-2 rounded-full bg-accentSoft px-3 py-1 text-xs font-semibold text-accent">
              <BellAlertIcon className="h-4 w-4" /> {unreadNotificationCount} unread
            </span>
          }
        />

        <div className="mt-10 grid gap-6">
          <div className="rounded-3xl border border-accent/40 bg-white p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">Enable push alerts</p>
                <p className="mt-1 text-xs text-slate-500">
                  Receive instant invites, follows, comments, and activity notifications even when the app is closed.
                </p>
                <div className="mt-2">{renderPushStatus()}</div>
              </div>
              <button
                type="button"
                onClick={handleEnablePush}
                className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white shadow-soft transition hover:bg-accentDark"
              >
                Enable browser alerts
              </button>
            </div>
          </div>

          {sortedNotifications.length ? (
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
