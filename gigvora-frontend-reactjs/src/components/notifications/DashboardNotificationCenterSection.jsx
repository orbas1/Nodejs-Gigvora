import { useCallback, useMemo, useState } from 'react';
import {
  BellIcon,
  BoltIcon,
  CheckCircleIcon,
  EyeIcon,
  InboxIcon,
} from '@heroicons/react/24/outline';
import AlertWorkspaceDrawer from './AlertWorkspaceDrawer.jsx';
import {
  createUserNotification,
  fetchUserNotifications,
  markAllNotificationsAsRead,
  updateNotificationPreferences,
  updateUserNotification,
} from '../../services/notificationCenter.js';
import { formatRelativeTime } from '../../utils/date.js';

const DEFAULT_STATS = {
  total: 0,
  unread: 0,
  read: 0,
  delivered: 0,
  dismissed: 0,
  pending: 0,
  lastActivityAt: null,
};

const DEFAULT_PAGINATION = { page: 1, pageSize: 20, total: 0, totalPages: 1 };

function mergeStats(stats, notifications) {
  if (stats) {
    return { ...DEFAULT_STATS, ...stats };
  }
  const merged = { ...DEFAULT_STATS };
  notifications.forEach((item) => {
    merged.total += 1;
    if (!item.readAt && item.status !== 'dismissed') {
      merged.unread += 1;
    }
    if (item.status === 'read') {
      merged.read += 1;
    }
    if (item.status === 'delivered') {
      merged.delivered += 1;
    }
    if (item.status === 'dismissed') {
      merged.dismissed += 1;
    }
    if (item.status === 'pending') {
      merged.pending += 1;
    }
    if (!merged.lastActivityAt || new Date(item.createdAt) > new Date(merged.lastActivityAt)) {
      merged.lastActivityAt = item.createdAt;
    }
  });
  return merged;
}

const FILTER_TEMPLATE = { status: 'all', category: 'all' };

export default function DashboardNotificationCenterSection({
  userId,
  initialNotifications = [],
  initialUnreadCount = 0,
  initialPreferences = null,
  initialStats = null,
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [view, setView] = useState('inbox');
  const [filters, setFilters] = useState(FILTER_TEMPLATE);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [pagination, setPagination] = useState(() => ({ ...DEFAULT_PAGINATION, total: initialNotifications.length }));
  const [stats, setStats] = useState(() => {
    const base = mergeStats(initialStats, initialNotifications);
    if (initialUnreadCount && !base.unread) {
      return { ...base, unread: initialUnreadCount };
    }
    return base;
  });
  const [preferences, setPreferences] = useState(initialPreferences);
  const [loading, setLoading] = useState(false);
  const [inboxError, setInboxError] = useState(null);
  const [preferencesError, setPreferencesError] = useState(null);
  const [actionBusy, setActionBusy] = useState(null);
  const [markAllBusy, setMarkAllBusy] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [composerError, setComposerError] = useState(null);
  const [composing, setComposing] = useState(false);
  const [initialised, setInitialised] = useState(initialNotifications.length > 0);

  const summary = useMemo(() => ({
    unread: stats.unread ?? 0,
    total: stats.total ?? notifications.length,
    lastActivity: stats.lastActivityAt,
    delivered: stats.delivered ?? 0,
  }), [stats, notifications.length]);

  const latest = useMemo(() => notifications.slice(0, 3), [notifications]);

  const ensureLoaded = useCallback(async (nextFilters = filters, options = {}) => {
    if (!userId) {
      return;
    }
    const page = options.page ?? 1;
    const append = options.append ?? false;
    setLoading(true);
    setInboxError(null);
    try {
      const response = await fetchUserNotifications(userId, {
        status: nextFilters.status,
        category: nextFilters.category,
        page,
        pageSize: 20,
      });
      const items = Array.isArray(response?.notifications) ? response.notifications : [];
      setNotifications((previous) => {
        if (append) {
          const map = new Map(previous.map((item) => [item.id, item]));
          items.forEach((item) => {
            map.set(item.id, item);
          });
          return Array.from(map.values());
        }
        return items;
      });
      setPagination(response?.pagination ? { ...DEFAULT_PAGINATION, ...response.pagination } : {
        page,
        pageSize: 20,
        total: items.length,
        totalPages: Math.max(1, Math.ceil((items.length || 1) / 20)),
      });
      if (response?.stats) {
        setStats({ ...DEFAULT_STATS, ...response.stats });
      } else {
        setStats(mergeStats(null, items));
      }
      if (response?.preferences) {
        setPreferences(response.preferences);
      }
      setInitialised(true);
    } catch (fetchError) {
      const normalised = fetchError instanceof Error ? fetchError : new Error('Failed to load alerts');
      setInboxError(normalised);
    } finally {
      setLoading(false);
    }
  }, [filters, userId]);

  const handleOpen = useCallback(() => {
    setDrawerOpen(true);
    if (!initialised) {
      ensureLoaded(filters);
    }
  }, [ensureLoaded, filters, initialised]);

  const handleRefresh = useCallback(() => {
    ensureLoaded(filters, { page: 1 });
  }, [ensureLoaded, filters]);

  const handleLoadMore = useCallback(() => {
    const nextPage = (pagination?.page ?? 1) + 1;
    if (pagination && nextPage <= (pagination.totalPages ?? 1)) {
      ensureLoaded(filters, { page: nextPage, append: true });
    }
  }, [ensureLoaded, filters, pagination]);

  const handleFiltersChange = useCallback((nextFilters) => {
    setFilters(nextFilters);
    ensureLoaded(nextFilters, { page: 1 });
  }, [ensureLoaded]);

  const handleMarkRead = useCallback(async (notificationId) => {
    if (!userId) return;
    setActionBusy(notificationId);
    try {
      const response = await updateUserNotification(userId, notificationId, 'read');
      if (response?.notification) {
        setNotifications((previous) =>
          previous.map((item) => (item.id === response.notification.id ? response.notification : item)),
        );
      }
      if (response?.stats) {
        setStats({ ...DEFAULT_STATS, ...response.stats });
      }
    } catch (updateError) {
      setInboxError(updateError instanceof Error ? updateError : new Error('Unable to update alert.'));
    } finally {
      setActionBusy(null);
    }
  }, [userId]);

  const handleArchive = useCallback(async (notificationId) => {
    if (!userId) return;
    setActionBusy(notificationId);
    try {
      const response = await updateUserNotification(userId, notificationId, 'dismiss');
      if (response?.notification) {
        setNotifications((previous) =>
          previous.map((item) => (item.id === response.notification.id ? response.notification : item)),
        );
      }
      if (response?.stats) {
        setStats({ ...DEFAULT_STATS, ...response.stats });
      }
    } catch (updateError) {
      setInboxError(updateError instanceof Error ? updateError : new Error('Unable to archive alert.'));
    } finally {
      setActionBusy(null);
    }
  }, [userId]);

  const handleMarkAll = useCallback(async () => {
    if (!userId) return;
    setMarkAllBusy(true);
    try {
      const response = await markAllNotificationsAsRead(userId);
      if (response?.stats) {
        setStats({ ...DEFAULT_STATS, ...response.stats });
      }
      setNotifications((previous) =>
        previous.map((item) => ({ ...item, status: 'read', readAt: item.readAt ?? new Date().toISOString() })),
      );
    } catch (markAllError) {
      setInboxError(markAllError instanceof Error ? markAllError : new Error('Unable to mark alerts.'));
    } finally {
      setMarkAllBusy(false);
    }
  }, [userId]);

  const handleSavePreferences = useCallback(async (payload) => {
    if (!userId) return false;
    setSavingPreferences(true);
    setPreferencesError(null);
    try {
      const response = await updateNotificationPreferences(userId, payload);
      if (response?.preferences) {
        setPreferences(response.preferences);
      }
      if (response?.stats) {
        setStats({ ...DEFAULT_STATS, ...response.stats });
      }
      return true;
    } catch (prefsError) {
      const normalised = prefsError instanceof Error ? prefsError : new Error('Unable to save settings.');
      setPreferencesError(normalised);
      return false;
    } finally {
      setSavingPreferences(false);
    }
  }, [userId]);

  const handleComposerSubmit = useCallback(async (payload) => {
    if (!userId) return false;
    setComposing(true);
    setComposerError(null);
    try {
      const response = await createUserNotification(userId, payload);
      if (response?.stats) {
        setStats({ ...DEFAULT_STATS, ...response.stats });
      }
      await ensureLoaded(filters, { page: 1 });
      return true;
    } catch (composeError) {
      const normalised = composeError instanceof Error ? composeError : new Error('Unable to send alert.');
      setComposerError(normalised);
      return false;
    } finally {
      setComposing(false);
    }
  }, [ensureLoaded, filters, userId]);

  const resetComposerError = useCallback(() => setComposerError(null), []);
  const resetInboxError = useCallback(() => setInboxError(null), []);
  const resetPreferencesError = useCallback(() => setPreferencesError(null), []);

  const quickActions = [
    { label: 'Unread', value: summary.unread, icon: BellIcon, tone: 'text-blue-600' },
    { label: 'Sent', value: summary.delivered, icon: BoltIcon, tone: 'text-amber-600' },
    {
      label: 'Updated',
      value: summary.lastActivity ? formatRelativeTime(summary.lastActivity) : '—',
      icon: CheckCircleIcon,
      tone: 'text-emerald-600',
    },
    { label: 'Total', value: summary.total, icon: InboxIcon, tone: 'text-slate-600' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Alerts</h2>
          <p className="text-sm text-slate-500">Stay current with a full-screen workspace for your queue.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleMarkAll}
            disabled={markAllBusy || summary.unread === 0}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-blue-300 hover:text-blue-600 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
          >
            {markAllBusy ? 'Working…' : 'Mark all read'}
          </button>
          <button
            type="button"
            onClick={handleOpen}
            className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500"
          >
            <EyeIcon className="h-4 w-4" />
            Open workspace
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {quickActions.map((item) => (
          <div key={item.label} className="flex items-center gap-3 rounded-3xl border border-slate-100 bg-slate-50 p-4">
            <span className={`flex h-10 w-10 items-center justify-center rounded-full bg-white shadow ${item.tone}`}>
              <item.icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">{item.label}</p>
              <p className="text-xl font-semibold text-slate-900">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white p-4">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-sm font-semibold text-slate-800">Latest</h3>
          <button
            type="button"
            onClick={handleRefresh}
            className="text-xs font-semibold text-blue-600 hover:text-blue-500"
          >
            Refresh
          </button>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {latest.length === 0 ? (
            <div className="col-span-3 flex items-center justify-center rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-400">
              No alerts in your queue.
            </div>
          ) : null}
          {latest.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={handleOpen}
              className="flex flex-col items-start gap-1 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-left transition hover:border-blue-300 hover:bg-blue-50/60"
            >
              <p className="text-sm font-semibold text-slate-900">{item.title}</p>
              <p className="text-xs text-slate-500">{formatRelativeTime(item.createdAt)}</p>
              <span className="rounded-full bg-white px-3 py-1 text-xs capitalize text-slate-600">{item.category}</span>
            </button>
          ))}
        </div>
      </div>

      <AlertWorkspaceDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        view={view}
        onViewChange={setView}
        inbox={{ items: notifications }}
        stats={summary}
        filters={filters}
        loading={loading}
        error={inboxError}
        onClearError={resetInboxError}
        pagination={pagination}
        onRefresh={handleRefresh}
        onLoadMore={handleLoadMore}
        onFiltersChange={handleFiltersChange}
        onMarkRead={handleMarkRead}
        onArchive={handleArchive}
        onMarkAll={handleMarkAll}
        markAllBusy={markAllBusy}
        actionBusy={actionBusy}
        preferences={preferences}
        onSavePreferences={handleSavePreferences}
        savingPreferences={savingPreferences}
        preferencesError={preferencesError}
        onPreferencesReset={resetPreferencesError}
        composerError={composerError}
        onComposerReset={resetComposerError}
        onComposerSubmit={handleComposerSubmit}
        composing={composing}
      />
    </div>
  );
}
