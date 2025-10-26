import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useSession from '../hooks/useSession.js';
import { useLanguage } from '../context/LanguageContext.jsx';
import AppTopBar from './navigation/AppTopBar.jsx';
import {
  PRIMARY_NAVIGATION,
  resolvePrimaryNavigation,
  buildRoleOptions,
  resolvePrimaryRoleKey,
} from '../constants/navigation.js';
import { useLayout } from '../context/LayoutContext.jsx';
import { fetchInbox } from '../services/messaging.js';
import analytics from '../services/analytics.js';
import useNotificationCenter from '../hooks/useNotificationCenter.js';

function normaliseThreadPreview(thread) {
  if (!thread) {
    return null;
  }

  const title = thread.subject || thread.participantsLabel || 'Conversation';
  const snippet =
    thread.lastMessagePreview ||
    thread.lastMessageBody ||
    thread.preview ||
    thread.lastMessage?.body ||
    '';
  const updatedAt = thread.updatedAt || thread.lastMessageAt || thread.lastActivityAt || thread.createdAt;
  const unread = Boolean(thread.unreadCount > 0 || thread.isUnread || thread.unread);

  return {
    id: thread.id,
    title,
    snippet,
    updatedAt,
    unread,
  };
}

const noop = () => {};

export default function Header() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { session, isAuthenticated, logout } = useSession();
  const { navOpen, openNav, closeNav } = useLayout();
  const {
    notifications: trayNotifications,
    unreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    messageThreads: trayThreads,
    unreadMessageCount,
    markThreadAsRead,
    markAllThreadsAsRead,
  } = useNotificationCenter(session);
  const isMountedRef = useRef(true);
  const [inboxPreview, setInboxPreview] = useState({
    threads: [],
    loading: false,
    error: null,
    lastFetchedAt: null,
  });
  const [connectionState, setConnectionState] = useState(() => {
    if (typeof navigator === 'undefined') {
      return 'idle';
    }
    return navigator.onLine ? 'idle' : 'offline';
  });

  const isNavigatorOnline = useCallback(() => {
    if (typeof navigator === 'undefined') {
      return true;
    }
    return navigator.onLine !== false;
  }, []);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handleOnline = () => {
      setConnectionState('connected');
    };
    const handleOffline = () => {
      setConnectionState('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleKey = resolvePrimaryRoleKey(session);
  const primaryNavigation = useMemo(() => resolvePrimaryNavigation(session), [session]);
  const roleOptions = useMemo(() => buildRoleOptions(session), [session]);
  const marketingMenus = useMemo(() => PRIMARY_NAVIGATION.menus, []);
  const marketingSearch = PRIMARY_NAVIGATION.search;
  const headerNotifications = useMemo(
    () => (Array.isArray(trayNotifications) ? trayNotifications : []),
    [trayNotifications],
  );
  const headerThreads = useMemo(() => (Array.isArray(trayThreads) ? trayThreads : []), [trayThreads]);
  const safeMarkNotification = typeof markNotificationAsRead === 'function' ? markNotificationAsRead : noop;
  const safeMarkAllNotifications =
    typeof markAllNotificationsAsRead === 'function' ? markAllNotificationsAsRead : noop;
  const safeMarkThread = typeof markThreadAsRead === 'function' ? markThreadAsRead : noop;
  const safeMarkAllThreads = typeof markAllThreadsAsRead === 'function' ? markAllThreadsAsRead : noop;
  const unreadBellNotifications = Number.isFinite(unreadNotificationCount) ? unreadNotificationCount : 0;
  const unreadBellThreads = Number.isFinite(unreadMessageCount) ? unreadMessageCount : 0;

  const handleNotificationBellOpen = useCallback(() => {
    analytics.track('web_header_notification_popover_opened', {
      unread: unreadBellNotifications,
      unreadThreads: unreadBellThreads,
    });
  }, [unreadBellNotifications, unreadBellThreads]);

  const handleNotificationBellSelect = useCallback(
    (notification) => {
      if (!notification) {
        return;
      }
      analytics.track('web_header_notification_preview_selected', {
        notificationId: notification.id,
        type: notification.type || notification.category || 'activity',
      });
      if (notification?.id != null) {
        safeMarkNotification(notification.id);
      }
      if (notification.action?.href && typeof window !== 'undefined') {
        try {
          const url = new URL(notification.action.href, window.location.origin);
          if (url.protocol === 'https:' || url.origin === window.location.origin) {
            window.location.assign(url.toString());
          }
        } catch (error) {
          console.warn('Unable to open header notification action', error);
        }
      }
    },
    [safeMarkNotification],
  );

  const handleNotificationPreferences = useCallback(() => {
    analytics.track('web_header_notification_preferences_shortcut', {});
    navigate('/settings/notifications');
  }, [navigate]);

  const handleBellThreadOpen = useCallback(
    (thread) => {
      if (!thread) {
        return;
      }
      analytics.track('web_header_notification_thread_selected', {
        threadId: thread.id,
      });
      if (thread.id != null) {
        safeMarkThread(thread.id);
      }
      navigate(`/inbox?thread=${encodeURIComponent(thread.id)}`);
    },
    [navigate, safeMarkThread],
  );

  const handleBellMarkAll = useCallback(() => {
    safeMarkAllNotifications();
    safeMarkAllThreads();
  }, [safeMarkAllNotifications, safeMarkAllThreads]);

  const notificationTray = useMemo(
    () => ({
      notifications: headerNotifications,
      messageThreads: headerThreads,
      unreadNotificationCount: unreadBellNotifications,
      unreadMessageCount: unreadBellThreads,
      onNotificationOpen: handleNotificationBellSelect,
      onNotificationRead: safeMarkNotification,
      onThreadOpen: handleBellThreadOpen,
      onMarkAllNotifications: handleBellMarkAll,
      onOpenPreferences: handleNotificationPreferences,
      onBellOpen: handleNotificationBellOpen,
    }),
    [
      headerNotifications,
      headerThreads,
      unreadBellNotifications,
      unreadBellThreads,
      handleNotificationBellSelect,
      safeMarkNotification,
      handleBellThreadOpen,
      handleBellMarkAll,
      handleNotificationPreferences,
      handleNotificationBellOpen,
    ],
  );

  const refreshInboxPreview = useCallback(async () => {
    if (!isAuthenticated) {
      if (isMountedRef.current) {
        setInboxPreview({ threads: [], loading: false, error: null, lastFetchedAt: null });
        setConnectionState('idle');
      }
      return;
    }

    if (!isNavigatorOnline()) {
      if (isMountedRef.current) {
        setConnectionState('offline');
        setInboxPreview((previous) => ({
          ...previous,
          loading: false,
          error: previous.error ?? 'Offline mode: reconnect to refresh inbox.',
        }));
      }
      return;
    }

    if (isMountedRef.current) {
      setInboxPreview((previous) => ({ ...previous, loading: true, error: null }));
      setConnectionState('loading');
    }

    try {
      const response = await fetchInbox({
        userId: session?.id,
        includeParticipants: true,
        includeSupport: true,
        pageSize: 5,
      });
      const rawThreads = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
      const threads = rawThreads.map(normaliseThreadPreview).filter(Boolean);

      if (!isMountedRef.current) {
        return;
      }

      setInboxPreview({
        threads,
        loading: false,
        error: null,
        lastFetchedAt: new Date().toISOString(),
      });
      setConnectionState('connected');
    } catch (error) {
      if (!isMountedRef.current) {
        return;
      }
      setInboxPreview((previous) => ({
        ...previous,
        loading: false,
        error: error?.body?.message ?? error?.message ?? 'Unable to load inbox preview.',
      }));
      setConnectionState(isNavigatorOnline() ? 'error' : 'offline');
    }
  }, [isAuthenticated, session?.id, isNavigatorOnline]);

  useEffect(() => {
    if (!isAuthenticated) {
      setInboxPreview({ threads: [], loading: false, error: null, lastFetchedAt: null });
      setConnectionState('idle');
      return undefined;
    }

    refreshInboxPreview();
    const interval = window.setInterval(refreshInboxPreview, 60_000);
    return () => {
      window.clearInterval(interval);
    };
  }, [isAuthenticated, refreshInboxPreview]);

  const handleInboxMenuOpen = useCallback(() => {
    analytics.track('web_header_inbox_preview_opened', {
      threads: inboxPreview.threads.length,
      unreadThreads: inboxPreview.threads.filter((thread) => thread.unread).length,
    });
  }, [inboxPreview.threads]);

  const handleInboxThreadClick = useCallback((thread) => {
    analytics.track('web_header_inbox_preview_selected', {
      threadId: thread.id,
      unread: thread.unread,
    });
  }, []);

  const handleMarketingSearch = useCallback(
    (value) => {
      const query = typeof value === 'string' ? value.trim() : '';
      if (query) {
        navigate(`/search?q=${encodeURIComponent(query)}`);
      } else {
        navigate('/search');
      }
    },
    [navigate],
  );

  return (
    <AppTopBar
      navOpen={navOpen}
      onOpenNav={openNav}
      onCloseNav={closeNav}
      isAuthenticated={isAuthenticated}
      marketingNavigation={marketingMenus}
      marketingSearch={marketingSearch}
      primaryNavigation={primaryNavigation}
      roleOptions={roleOptions}
      currentRoleKey={roleKey}
      onLogout={handleLogout}
      inboxPreview={inboxPreview}
      connectionState={connectionState}
      onRefreshInbox={refreshInboxPreview}
      onInboxMenuOpen={handleInboxMenuOpen}
      onInboxThreadClick={handleInboxThreadClick}
      t={t}
      session={session}
      onMarketingSearch={handleMarketingSearch}
      notificationTray={notificationTray}
    />
  );
}
