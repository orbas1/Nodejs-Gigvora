import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BellAlertIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import useSession from '../hooks/useSession.js';
import useNotificationCenter from '../hooks/useNotificationCenter.js';
import useAuthorization from '../hooks/useAuthorization.js';
import NotificationCenter from '../components/notifications/NotificationCenter.jsx';
import AlertPreferences from '../components/notifications/AlertPreferences.jsx';
import analytics from '../services/analytics.js';

const noop = () => {};

const PREFERENCES_STORAGE_KEY = 'gigvora:notification-preferences:v1';

function loadStoredPreferences() {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(PREFERENCES_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch (error) {
    console.warn('Unable to parse stored notification preferences', error);
    return null;
  }
}

function persistStoredPreferences(preferences) {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.warn('Unable to persist notification preferences', error);
  }
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
    messageThreads,
    unreadMessageCount,
    markThreadAsRead,
    markAllThreadsAsRead,
  } = useNotificationCenter(session);
  const [pushStatus, setPushStatus] = useState('idle');
  const [preferences, setPreferences] = useState(() => loadStoredPreferences());
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [preferencesError, setPreferencesError] = useState(null);
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

  const notificationList = useMemo(
    () => (Array.isArray(notifications) ? notifications : []),
    [notifications],
  );

  const safeMarkNotificationAsRead =
    typeof markNotificationAsRead === 'function' ? markNotificationAsRead : noop;
  const safeMarkAllNotificationsAsRead =
    typeof markAllNotificationsAsRead === 'function' ? markAllNotificationsAsRead : noop;
  const safeMarkThreadAsRead = typeof markThreadAsRead === 'function' ? markThreadAsRead : noop;
  const safeMarkAllThreadsAsRead =
    typeof markAllThreadsAsRead === 'function' ? markAllThreadsAsRead : noop;

  const sortedNotifications = useMemo(
    () =>
      isAuthorizedForCenter
        ? notificationList.slice().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        : [],
    [notificationList, isAuthorizedForCenter],
  );

  const numericUnreadCount = Number.isFinite(unreadNotificationCount) ? unreadNotificationCount : 0;
  const numericUnreadThreads = Number.isFinite(unreadMessageCount) ? unreadMessageCount : 0;
  const displayUnreadCount = isAuthorizedForCenter ? numericUnreadCount + numericUnreadThreads : 0;
  const hasNotifications = sortedNotifications.length > 0 || (Array.isArray(messageThreads) && messageThreads.length > 0);
  const quietHours = preferences?.quietHours ?? null;
  const digestFrequency = preferences?.digest?.frequency ?? 'daily';

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

  const handleSavePreferences = useCallback(
    async (nextPreferences) => {
      setSavingPreferences(true);
      setPreferencesError(null);
      try {
        persistStoredPreferences(nextPreferences);
        setPreferences(nextPreferences);
        analytics.track('web_notifications_preferences_saved', {
          activeChannels: Object.entries(nextPreferences.channels || {})
            .filter(([, value]) => Boolean(value))
            .map(([key]) => key),
          priorityStreams: Object.entries(nextPreferences.categories || {})
            .filter(([, value]) => value?.cadence === 'priority')
            .map(([key]) => key),
        });
        return true;
      } catch (error) {
        const normalised = error instanceof Error ? error : new Error('Unable to save preferences.');
        setPreferencesError(normalised);
        return false;
      } finally {
        setSavingPreferences(false);
      }
    },
    [],
  );

  const handleResetPreferencesError = useCallback(() => {
    setPreferencesError(null);
  }, []);

  const handleTestPreferences = useCallback(async (payload) => {
    analytics.track('web_notifications_preferences_test_triggered', {
      channels: Object.entries(payload.channels || {})
        .filter(([, value]) => Boolean(value))
        .map(([key]) => key),
      digest: payload.digest?.frequency || 'daily',
    });
    if (typeof window !== 'undefined') {
      console.info('Test notification payload', payload);
    }
    return true;
  }, []);

  const handleNotificationOpen = useCallback(
    (notification) => {
      if (!notification) {
        return;
      }
      analytics.track('web_notifications_center_notification_opened', {
        notificationId: notification.id,
        type: notification.type || notification.category || 'activity',
      });
      if (notification?.id != null) {
        safeMarkNotificationAsRead(notification.id);
      }
      if (notification.action?.href && typeof window !== 'undefined') {
        try {
          const url = new URL(notification.action.href, window.location.origin);
          if (url.protocol === 'https:' || url.origin === window.location.origin) {
            window.location.assign(url.toString());
          }
        } catch (error) {
          console.warn('Unable to open notification action', error);
        }
      }
    },
    [safeMarkNotificationAsRead],
  );

  const handleThreadOpen = useCallback(
    (thread) => {
      if (!thread) {
        return;
      }
      analytics.track('web_notifications_center_thread_opened', {
        threadId: thread.id,
      });
      if (thread.id != null) {
        safeMarkThreadAsRead(thread.id);
      }
      navigate(`/inbox?thread=${encodeURIComponent(thread.id)}`);
    },
    [navigate, safeMarkThreadAsRead],
  );

  const handleMarkAll = useCallback(() => {
    safeMarkAllNotificationsAsRead();
    safeMarkAllThreadsAsRead();
  }, [safeMarkAllNotificationsAsRead, safeMarkAllThreadsAsRead]);

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
              onClick={handleMarkAll}
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

        <div className="mt-10 grid gap-8">
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
          <NotificationCenter
            notifications={sortedNotifications}
            messageThreads={messageThreads}
            unreadNotificationCount={numericUnreadCount}
            unreadMessageCount={numericUnreadThreads}
            quietHours={quietHours}
            digestFrequency={digestFrequency}
            onNotificationOpen={handleNotificationOpen}
            onNotificationRead={safeMarkNotificationAsRead}
            onThreadOpen={handleThreadOpen}
            onThreadRead={safeMarkThreadAsRead}
            onMarkAllNotifications={safeMarkAllNotificationsAsRead}
            onMarkAllThreads={safeMarkAllThreadsAsRead}
          />

          <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-soft">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Personalise alerts</h2>
                <p className="text-xs text-slate-500">
                  Fine-tune channels, cadence, and escalation rules to match your leadership rhythm.
                </p>
              </div>
            </div>
            <div className="mt-6">
              <AlertPreferences
                initialPreferences={preferences}
                onSave={handleSavePreferences}
                saving={savingPreferences}
                error={preferencesError}
                onResetError={handleResetPreferencesError}
                onTestNotification={handleTestPreferences}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
