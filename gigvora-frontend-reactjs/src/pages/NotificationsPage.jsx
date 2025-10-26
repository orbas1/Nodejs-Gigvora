import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import NotificationCenter from '../components/notifications/NotificationCenter.jsx';
import AlertPreferences from '../components/notifications/AlertPreferences.jsx';
import useSession from '../hooks/useSession.js';
import useNotificationCenter from '../hooks/useNotificationCenter.js';
import useAuthorization from '../hooks/useAuthorization.js';
import {
  fetchNotificationPreferences,
  updateNotificationPreferences,
} from '../services/notificationCenter.js';

const DEFAULT_ALERT_PREFERENCES = {
  email: true,
  inApp: true,
  push: false,
  sms: false,
  digestFrequency: 'daily',
  quietHoursStart: '21:00',
  quietHoursEnd: '07:00',
};

function normaliseAlertPreferences(payload) {
  if (!payload || typeof payload !== 'object') {
    return { ...DEFAULT_ALERT_PREFERENCES };
  }

  const channels = payload.channels ?? payload.preferences ?? payload;
  const quietHours = payload.quietHours ?? payload.quietTime ?? {};

  return {
    email: Boolean(channels.email ?? channels.receiveEmail ?? payload.email ?? DEFAULT_ALERT_PREFERENCES.email),
    inApp: Boolean(channels.inApp ?? channels.web ?? payload.inApp ?? DEFAULT_ALERT_PREFERENCES.inApp),
    push: Boolean(channels.push ?? payload.push ?? DEFAULT_ALERT_PREFERENCES.push),
    sms: Boolean(channels.sms ?? payload.sms ?? DEFAULT_ALERT_PREFERENCES.sms),
    digestFrequency: `${payload.digestFrequency ?? payload.frequency ?? DEFAULT_ALERT_PREFERENCES.digestFrequency}`,
    quietHoursStart: quietHours.start ?? quietHours.begin ?? DEFAULT_ALERT_PREFERENCES.quietHoursStart,
    quietHoursEnd: quietHours.end ?? quietHours.finish ?? DEFAULT_ALERT_PREFERENCES.quietHoursEnd,
  };
}

function buildAlertPreferencePayload(preferences) {
  return {
    channels: {
      email: Boolean(preferences.email),
      inApp: Boolean(preferences.inApp),
      push: Boolean(preferences.push),
      sms: Boolean(preferences.sms),
    },
    digestFrequency: preferences.digestFrequency ?? DEFAULT_ALERT_PREFERENCES.digestFrequency,
    quietHours: {
      start: preferences.quietHoursStart ?? DEFAULT_ALERT_PREFERENCES.quietHoursStart,
      end: preferences.quietHoursEnd ?? DEFAULT_ALERT_PREFERENCES.quietHoursEnd,
    },
  };
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
  const [alertPreferences, setAlertPreferences] = useState(DEFAULT_ALERT_PREFERENCES);
  const [preferencesLoading, setPreferencesLoading] = useState(false);
  const [preferencesSaving, setPreferencesSaving] = useState(false);
  const [preferencesFeedback, setPreferencesFeedback] = useState('');
  const [preferencesError, setPreferencesError] = useState('');
  const [preferencesLoadedAt, setPreferencesLoadedAt] = useState(null);
  const [markAllBusy, setMarkAllBusy] = useState(false);

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

  useEffect(() => {
    if (!isAuthorizedForCenter || !session?.id) {
      return;
    }
    const controller = new AbortController();
    (async () => {
      setPreferencesLoading(true);
      try {
        const response = await fetchNotificationPreferences(session.id, { signal: controller.signal });
        const resolved = response?.preferences ?? response;
        setAlertPreferences(normaliseAlertPreferences(resolved));
        setPreferencesError('');
        setPreferencesLoadedAt(new Date().toISOString());
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        if (error?.status === 403) {
          setPreferencesError('You do not have permission to view alert preferences.');
        } else if (error instanceof Error) {
          setPreferencesError(error.message);
        } else {
          setPreferencesError('Unable to load alert preferences.');
        }
      } finally {
        setPreferencesLoading(false);
      }
    })();
    return () => controller.abort();
  }, [isAuthorizedForCenter, session?.id]);

  useEffect(() => {
    if (!preferencesFeedback && !preferencesError) {
      return undefined;
    }
    const timer = (typeof window !== 'undefined' ? window : globalThis).setTimeout(() => {
      setPreferencesFeedback('');
      setPreferencesError('');
    }, 5000);
    return () => (typeof window !== 'undefined' ? window : globalThis).clearTimeout(timer);
  }, [preferencesFeedback, preferencesError]);

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

  useEffect(() => {
    if (pushStatus === 'granted') {
      setAlertPreferences((current) => (current.push ? current : { ...current, push: true }));
    }
    if (['denied', 'unsupported', 'dismissed', 'error', 'forbidden'].includes(pushStatus)) {
      setAlertPreferences((current) => (current.push ? { ...current, push: false } : current));
    }
  }, [pushStatus]);

  useEffect(() => {
    if (!canManagePush) {
      setAlertPreferences((current) => (current.push ? { ...current, push: false } : current));
    }
  }, [canManagePush]);

  const displayUnreadCount = isAuthorizedForCenter ? unreadNotificationCount : 0;

  const handleEnablePush = useCallback(async () => {
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
  }, [canManagePush]);

  const handleNotificationAction = useCallback(
    (notification, safeAction) => {
      if (!notification) {
        return;
      }
      markNotificationAsRead(notification.id);
      if (safeAction?.href && typeof window !== 'undefined') {
        window.location.assign(safeAction.href);
      }
    },
    [markNotificationAsRead],
  );

  const handlePreferenceChange = useCallback((field, value) => {
    setAlertPreferences((current) => ({ ...current, [field]: value }));
  }, []);

  const handlePreferenceSubmit = useCallback(async () => {
    if (!session?.id) {
      return;
    }
    setPreferencesSaving(true);
    try {
      const payload = buildAlertPreferencePayload(alertPreferences);
      const response = await updateNotificationPreferences(session.id, payload);
      const resolved = response?.preferences ?? response;
      setAlertPreferences(normaliseAlertPreferences(resolved));
      setPreferencesFeedback('Alert preferences updated.');
      setPreferencesLoadedAt(new Date().toISOString());
      setPreferencesError('');
    } catch (error) {
      if (error?.status === 403) {
        setPreferencesError('You do not have permission to update alert preferences.');
      } else if (error instanceof Error) {
        setPreferencesError(error.message);
      } else {
        setPreferencesError('Unable to update alert preferences.');
      }
    } finally {
      setPreferencesSaving(false);
    }
  }, [alertPreferences, session?.id]);

  const handleMarkAllRead = useCallback(() => {
    setMarkAllBusy(true);
    try {
      markAllNotificationsAsRead();
    } finally {
      setTimeout(() => setMarkAllBusy(false), 200);
    }
  }, [markAllNotificationsAsRead]);

  const latestActivityAt = useMemo(() => {
    const latest = notifications.reduce((accumulator, notification) => {
      const candidate =
        notification?.timestamp ??
        notification?.createdAt ??
        notification?.occurredAt ??
        notification?.sentAt ??
        notification?.updatedAt ??
        null;
      if (!candidate) {
        return accumulator;
      }
      const time = new Date(candidate).getTime();
      if (!Number.isFinite(time)) {
        return accumulator;
      }
      return Math.max(accumulator, time);
    }, 0);
    return latest ? new Date(latest).toISOString() : null;
  }, [notifications]);

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
              ask an administrator to grant you access or enable push alerts from the mobile app after selecting the correct membership.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden py-16">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(191,219,254,0.35),_transparent_65%)]" aria-hidden="true" />
      <div className="relative mx-auto max-w-5xl px-6">
        <PageHeader
          eyebrow="Notifications"
          title="Command centre for alerts & mentions"
          description="Audit new invites, approvals, and community signals from across Gigvora with instant context and premium presentation."
          actions={
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={!displayUnreadCount || markAllBusy}
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
            >
              Mark all read
            </button>
          }
          meta={
            latestActivityAt ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-slate-500">
                Latest activity {new Date(latestActivityAt).toLocaleString()}
              </span>
            ) : null
          }
        />
        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <NotificationCenter
            notifications={notifications}
            unreadCount={displayUnreadCount}
            onNotificationAction={handleNotificationAction}
            onNotificationMarkRead={markNotificationAsRead}
            onMarkAllRead={handleMarkAllRead}
            markAllBusy={markAllBusy}
            lastUpdatedAt={latestActivityAt}
          />
          <AlertPreferences
            preferences={alertPreferences}
            onChange={handlePreferenceChange}
            onSubmit={handlePreferenceSubmit}
            saving={preferencesSaving}
            feedback={preferencesFeedback}
            error={preferencesError}
            pushStatus={pushStatus}
            onRequestPushPermission={handleEnablePush}
            canManagePush={canManagePush}
            loading={preferencesLoading}
            lastUpdatedAt={preferencesLoadedAt}
          />
        </div>
      </div>
    </section>
  );
}
