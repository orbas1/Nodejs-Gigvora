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
import { fetchNavigationPulse } from '../services/navigation.js';
import { deriveNavigationPulse, deriveNavigationTrending } from '../utils/navigationPulse.js';

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

export default function Header() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { session, isAuthenticated, logout } = useSession();
  const { navOpen, openNav, closeNav, setShellTheme, resetShellTheme } = useLayout();
  const isMountedRef = useRef(true);
  const appliedShellTheme = useRef(null);
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
  const navigationRequestController = useRef(null);
  const [navigationInsights, setNavigationInsights] = useState({
    status: 'idle',
    pulse: null,
    trending: null,
    error: null,
    generatedAt: null,
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
  const marketingMenus = useMemo(
    () => (isAuthenticated ? PRIMARY_NAVIGATION.menus : []),
    [isAuthenticated],
  );
  const marketingSearch = isAuthenticated ? PRIMARY_NAVIGATION.search : null;

  const preferredShellTheme =
    session?.preferences?.shellTheme ?? session?.branding?.shellTheme ?? session?.shellTheme ?? null;

  useEffect(() => {
    if (!isAuthenticated) {
      setNavigationInsights({ status: 'idle', pulse: null, trending: null, error: null, generatedAt: null });
      if (navigationRequestController.current) {
        navigationRequestController.current.abort();
        navigationRequestController.current = null;
      }
      return undefined;
    }

    let cancelled = false;

    const fetchPulse = async () => {
      if (navigationRequestController.current) {
        navigationRequestController.current.abort();
      }
      const controller = new AbortController();
      navigationRequestController.current = controller;
      setNavigationInsights((previous) => ({
        ...previous,
        status: previous.status === 'success' ? 'refreshing' : 'loading',
        error: null,
      }));

      try {
        const response = await fetchNavigationPulse({
          limit: 6,
          persona: roleKey,
          signal: controller.signal,
        });
        if (cancelled) {
          return;
        }
        const payload = response?.data ?? response;
        setNavigationInsights({
          status: 'success',
          pulse: Array.isArray(payload?.pulse) ? payload.pulse : null,
          trending: Array.isArray(payload?.trending) ? payload.trending : null,
          generatedAt: payload?.generatedAt ?? null,
          error: null,
        });
      } catch (error) {
        if (cancelled) {
          return;
        }
        setNavigationInsights((previous) => ({
          ...previous,
          status: 'error',
          error: error?.body?.message ?? error?.message ?? 'Unable to load navigation insights.',
        }));
      } finally {
        if (navigationRequestController.current === controller) {
          navigationRequestController.current = null;
        }
      }
    };

    fetchPulse();

    const intervalId = typeof window !== 'undefined' ? window.setInterval(fetchPulse, 120_000) : null;

    return () => {
      cancelled = true;
      if (intervalId) {
        window.clearInterval(intervalId);
      }
      if (navigationRequestController.current) {
        navigationRequestController.current.abort();
        navigationRequestController.current = null;
      }
    };
  }, [isAuthenticated, roleKey]);

  const navigationPulse = useMemo(
    () => deriveNavigationPulse(session, marketingMenus, primaryNavigation, navigationInsights.pulse),
    [marketingMenus, navigationInsights.pulse, primaryNavigation, session],
  );

  const navigationTrending = useMemo(
    () => deriveNavigationTrending(marketingMenus, 6, navigationInsights.trending),
    [marketingMenus, navigationInsights.trending],
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
        pageSize: 4,
      });
      const rawThreads = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
      const threads = rawThreads.map(normaliseThreadPreview).filter(Boolean).slice(0, 4);

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

  useEffect(() => {
    if (!setShellTheme || !resetShellTheme) {
      return undefined;
    }

    if (!preferredShellTheme) {
      if (appliedShellTheme.current) {
        resetShellTheme();
        appliedShellTheme.current = null;
      }
      return undefined;
    }

    appliedShellTheme.current = preferredShellTheme;
    setShellTheme(preferredShellTheme);

    return () => {
      resetShellTheme();
      appliedShellTheme.current = null;
    };
  }, [preferredShellTheme, resetShellTheme, setShellTheme]);

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
      navigationPulse={navigationPulse}
      navigationTrending={navigationTrending}
    />
  );
}
