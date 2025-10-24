import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, Transition } from '@headlessui/react';
import {
  ArrowTopRightOnSquareIcon,
  Bars3Icon,
  BellIcon,
  BriefcaseIcon,
  BuildingOffice2Icon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  HomeIcon,
  PresentationChartBarIcon,
  RssIcon,
  ShieldCheckIcon,
  SparklesIcon,
  Squares2X2Icon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { LOGO_URL } from '../constants/branding.js';
import useSession from '../hooks/useSession.js';
import { useLanguage } from '../context/LanguageContext.jsx';
import LanguageSelector from './LanguageSelector.jsx';
import MegaMenu from './navigation/MegaMenu.jsx';
import RoleSwitcher from './navigation/RoleSwitcher.jsx';
import MobileNavigation from './navigation/MobileNavigation.jsx';
import {
  marketingNavigation,
  resolvePrimaryNavigation,
  buildRoleOptions,
  resolvePrimaryRoleKey,
} from '../constants/navigation.js';
import { formatRelativeTime } from '../utils/date.js';
import { useLayout } from '../context/LayoutContext.jsx';
import { fetchInbox } from '../services/messaging.js';
import analytics from '../services/analytics.js';
import { classNames } from '../utils/classNames.js';
import { resolveInitials } from '../utils/user.js';

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

function UserMenu({ session, onLogout }) {
  const initials = resolveInitials(session?.name ?? session?.email ?? 'GV');
  const memberships = Array.isArray(session?.memberships) ? session.memberships : [];

  return (
    <Menu as="div" className="relative">
      <Menu.Button className="flex items-center gap-3 rounded-full border border-slate-200/80 bg-white px-3 py-1.5 text-left text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-400/80 hover:text-slate-900">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold uppercase text-white">
          {initials}
        </span>
        <span className="hidden text-left lg:block">
          <span className="block text-sm font-semibold text-slate-900">{session?.name ?? 'Member'}</span>
          <span className="block text-xs text-slate-500">{memberships.join(' • ') || 'Professional community'}</span>
        </span>
      </Menu.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-50 mt-3 w-56 origin-top-right rounded-3xl border border-slate-200/70 bg-white p-2 text-sm shadow-xl focus:outline-none">
          <Menu.Item>
            {({ active }) => (
              <Link
                to="/settings"
                className={`${
                  active ? 'bg-slate-100 text-slate-900' : 'text-slate-700'
                } flex items-center gap-2 rounded-2xl px-3 py-2 transition`}
              >
                Account settings
              </Link>
            )}
          </Menu.Item>
          <Menu.Item>
            {({ active }) => (
              <Link
                to="/notifications"
                className={`${
                  active ? 'bg-slate-100 text-slate-900' : 'text-slate-700'
                } flex items-center gap-2 rounded-2xl px-3 py-2 transition`}
              >
                Notifications
              </Link>
            )}
          </Menu.Item>
          <Menu.Item>
            {({ active }) => (
              <button
                type="button"
                onClick={onLogout}
                className={`${
                  active ? 'bg-rose-50 text-rose-600' : 'text-rose-600'
                } flex w-full items-center gap-2 rounded-2xl px-3 py-2 transition`}
              >
                Log out
              </button>
            )}
          </Menu.Item>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}

function InboxPreview({
  threads,
  loading,
  error,
  onRefresh,
  lastFetchedAt,
  onOpen,
  onThreadClick,
  status = 'idle',
}) {
  const handleAfterEnter = useCallback(() => {
    onOpen?.();
  }, [onOpen]);

  const handleRefresh = useCallback(
    (event) => {
      event.preventDefault();
      onRefresh?.();
    },
    [onRefresh],
  );

  const hasThreads = threads.length > 0;
  const skeletonItems = useMemo(() => Array.from({ length: 3 }), []);
  const lastUpdatedCopy = lastFetchedAt ? formatRelativeTime(lastFetchedAt) : null;
  const statusLabelMap = useMemo(
    () => ({
      connected: 'Connected',
      loading: 'Refreshing',
      offline: 'Offline',
      error: 'Connection issue',
      idle: 'Idle',
    }),
    [],
  );
  const statusToneMap = useMemo(
    () => ({
      connected: 'bg-emerald-500',
      loading: 'bg-amber-400',
      offline: 'bg-slate-400',
      error: 'bg-rose-500',
      idle: 'bg-slate-300',
    }),
    [],
  );
  const resolvedStatus = statusLabelMap[status] ? status : 'idle';
  const indicatorClass = classNames(
    'h-2.5 w-2.5 rounded-full transition-all duration-150',
    statusToneMap[resolvedStatus],
    resolvedStatus === 'loading' ? 'animate-pulse' : '',
  );
  const ariaLabel = `Inbox menu, status ${statusLabelMap[resolvedStatus]}`;

  return (
    <Menu as="div" className="relative hidden lg:block">
      <Menu.Button
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-accent hover:bg-accent/10 hover:text-accent"
        onClick={onRefresh}
        aria-label={ariaLabel}
      >
        <ChatBubbleLeftRightIcon className="h-4 w-4" />
        <span className="inline-flex items-center gap-1">
          <span className="relative inline-flex items-center gap-1" role="status" aria-live="polite">
            <span className={indicatorClass} aria-hidden="true" />
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              {statusLabelMap[resolvedStatus]}
            </span>
          </span>
          <span className="font-semibold text-slate-600">Inbox</span>
        </span>
      </Menu.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
        afterEnter={handleAfterEnter}
      >
        <Menu.Items className="absolute right-0 z-50 mt-3 w-80 origin-top-right space-y-3 rounded-3xl border border-slate-200/80 bg-white/95 p-4 text-sm shadow-xl focus:outline-none">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Latest messages</p>
            {lastUpdatedCopy ? (
              <span className="text-[0.65rem] uppercase tracking-[0.25em] text-slate-400">Updated {lastUpdatedCopy}</span>
            ) : null}
          </div>
          <div className="flex items-center justify-between">
            <Link to="/inbox" className="text-xs font-semibold text-accent hover:text-accent-strong">
              Open inbox ↗
            </Link>
            <button
              type="button"
              onClick={handleRefresh}
              className="text-xs font-semibold text-slate-500 transition hover:text-slate-900"
              disabled={loading}
            >
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
          {loading
            ? skeletonItems.map((_, index) => (
                <div key={`skeleton-${index}`} className="animate-pulse rounded-2xl border border-slate-200 bg-white p-3">
                  <div className="h-3 w-3/5 rounded-full bg-slate-200" />
                  <div className="mt-2 h-2 w-full rounded-full bg-slate-100" />
                  <div className="mt-1 h-2 w-4/5 rounded-full bg-slate-100" />
                </div>
              ))
            : null}

          {!loading && error ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              {error}
            </div>
          ) : null}

          {!loading && hasThreads
            ? threads.map((thread) => (
                <Menu.Item key={thread.id}>
                  {({ active }) => (
                    <Link
                      to={`/inbox?thread=${thread.id}`}
                      onClick={() => onThreadClick?.(thread)}
                      className={classNames(
                        'block rounded-2xl border px-3 py-2 transition',
                        thread.unread
                          ? 'border-accent bg-accent/10 text-slate-900'
                          : 'border-slate-200 bg-white text-slate-600',
                        active ? 'ring-2 ring-accent ring-offset-2 ring-offset-white' : null,
                      )}
                    >
                      <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                        {thread.title}
                        {thread.unread ? (
                          <span className="inline-flex items-center rounded-full bg-accent px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-white">
                            New
                          </span>
                        ) : null}
                      </p>
                      <p className="mt-1 text-xs text-slate-500 line-clamp-2">{thread.snippet || 'No messages yet'}</p>
                      {thread.updatedAt ? (
                        <p className="mt-2 text-[0.65rem] uppercase tracking-wide text-slate-400">
                          {formatRelativeTime(thread.updatedAt)}
                        </p>
                      ) : null}
                    </Link>
                  )}
                </Menu.Item>
              ))
            : null}

          {!loading && !hasThreads && !error ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-3 py-4 text-center text-xs text-slate-500">
              You’re all caught up. New messages will appear here.
            </div>
          ) : null}
        </Menu.Items>
      </Transition>
    </Menu>
  );
}

export default function Header() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { session, isAuthenticated, logout } = useSession();
  const { navOpen, openNav, closeNav } = useLayout();
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

  const iconMap = useMemo(
    () => ({
      timeline: RssIcon,
      explorer: Squares2X2Icon,
      studio: SparklesIcon,
      inbox: ChatBubbleLeftRightIcon,
      notifications: BellIcon,
      dashboard: HomeIcon,
      policies: ShieldCheckIcon,
      ats: BriefcaseIcon,
      analytics: ChartBarIcon,
      pipeline: PresentationChartBarIcon,
      portfolio: BriefcaseIcon,
      crm: BuildingOffice2Icon,
      finance: ChartBarIcon,
    }),
    [],
  );

  const marketingLinks = useMemo(() => {
    return marketingNavigation.flatMap((entry) =>
      entry.sections.flatMap((section) =>
        section.items.map((item) => ({
          id: `${entry.id}-${item.name}`,
          label: item.name,
          description: item.description,
          to: item.to,
        })),
      ),
    );
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <MobileNavigation
        open={navOpen}
        onClose={closeNav}
        isAuthenticated={isAuthenticated}
        primaryNavigation={primaryNavigation}
        marketingLinks={marketingLinks}
        onLogout={handleLogout}
        roleOptions={roleOptions}
        currentRoleKey={roleKey}
      />
      <div className="mx-auto flex w-full items-center gap-3 px-4 py-3 sm:h-20 sm:gap-4 sm:px-6 sm:py-0 lg:px-8">
        <div className="flex items-center gap-3 lg:flex-1">
          <button
            type="button"
            onClick={openNav}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-600 shadow-sm transition hover:border-slate-400/80 hover:text-slate-900 lg:hidden"
          >
            <span className="sr-only">Open navigation</span>
            <Bars3Icon className="h-5 w-5" />
          </button>
          <Link to="/" className="inline-flex items-center gap-2 shrink-0">
            <img src={LOGO_URL} alt="Gigvora" className="h-10 w-auto shrink-0 sm:h-12" />
          </Link>
        </div>

        {isAuthenticated ? (
          <nav className="hidden flex-1 items-center justify-center gap-1 text-sm font-medium lg:flex">
            <RoleSwitcher options={roleOptions} currentKey={roleKey} />
            {primaryNavigation.map((item) => {
              const Icon = iconMap[item.id] ?? Squares2X2Icon;
              return (
                <NavLink
                  key={item.id}
                  to={item.to}
                  className={({ isActive }) =>
                    classNames(
                      'inline-flex items-center gap-2 rounded-full border px-4 py-2 transition',
                      isActive
                        ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                        : 'border-transparent text-slate-600 hover:border-slate-400/80 hover:bg-white hover:text-slate-900',
                    )
                  }
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        ) : (
          <nav className="hidden flex-1 items-center justify-center gap-3 lg:flex">
            {marketingNavigation.map((item) => (
              <MegaMenu key={item.id} item={item} />
            ))}
          </nav>
        )}

        <div className="ml-auto hidden items-center gap-3 sm:flex sm:gap-4">
          {!isAuthenticated ? (
            <Link
              to="/pages"
              className="hidden items-center gap-1 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 transition hover:border-slate-400/80 hover:text-slate-900 lg:inline-flex"
            >
              <ArrowTopRightOnSquareIcon className="h-4 w-4" />
              Demo tour
            </Link>
          ) : null}
          {isAuthenticated ? (
            <InboxPreview
              threads={inboxPreview.threads}
              loading={inboxPreview.loading}
              error={inboxPreview.error}
              lastFetchedAt={inboxPreview.lastFetchedAt}
              onRefresh={refreshInboxPreview}
              onOpen={handleInboxMenuOpen}
              onThreadClick={handleInboxThreadClick}
              status={connectionState}
            />
          ) : null}
          <LanguageSelector className="hidden sm:inline-flex" />
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Link
                to="/dashboard/user/creation-studio"
                className="hidden items-center gap-2 rounded-full border border-accent/60 bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-strong lg:inline-flex"
              >
                <SparklesIcon className="h-4 w-4" />
                Launch Creation Studio
              </Link>
              <UserMenu session={session} onLogout={handleLogout} />
            </div>
          ) : (
            <div className="flex items-center gap-3 sm:gap-4">
              <Link
                to="/login"
                className="rounded-full border border-slate-200/80 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400/80 hover:text-slate-900"
              >
                {t('header.login', 'Log in')}
              </Link>
              <Link
                to="/register"
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
              >
                {t('header.join', 'Join')}
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
