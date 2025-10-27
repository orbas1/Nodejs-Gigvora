import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Dialog, Menu, Transition } from '@headlessui/react';
import {
  ArrowTrendingUpIcon,
  ArrowUpRightIcon,
  Bars3Icon,
  BellIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

import MobileNavigation from './MobileNavigation.jsx';
import LanguageSelector from '../LanguageSelector.jsx';
import HeaderMegaMenu from './HeaderMegaMenu.jsx';
import MegaMenu from './MegaMenu.jsx';
import PrimaryNavItem from './PrimaryNavItem.jsx';
import NotificationBell from '../notifications/NotificationBell.jsx';
import UserAvatar from '../UserAvatar.jsx';
import { LOGO_SRCSET, LOGO_URL } from '../../constants/branding.js';
import { classNames } from '../../utils/classNames.js';
import { formatRelativeTime } from '../../utils/date.js';
import {
  deriveNavigationPulse,
  deriveNavigationTrending,
  normaliseTrendingEntries,
} from '../../utils/navigationPulse.js';
import analytics from '../../services/analytics.js';

function UserMenu({ session, onLogout, roleOptions, currentRoleKey, onRoleSelect }) {
  const memberships = Array.isArray(session?.memberships) ? session.memberships : [];
  const personaOptions = Array.isArray(roleOptions) ? roleOptions : [];
  const activePersonaKey = currentRoleKey ?? personaOptions[0]?.key ?? null;

  const handlePersonaSelect = useCallback(
    (option) => () => {
      onRoleSelect?.(option);
    },
    [onRoleSelect],
  );

  return (
    <Menu as="div" className="relative">
      <Menu.Button className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-400/80 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white">
        <UserAvatar
          name={session?.name ?? session?.email ?? 'Member'}
          imageUrl={session?.avatarUrl ?? session?.profile?.avatarUrl ?? null}
          seed={session?.id ? String(session.id) : session?.email}
          size="sm"
          showGlow={false}
          className="!border-transparent !shadow-none"
        />
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
        <Menu.Items className="absolute right-0 z-50 mt-3 w-64 origin-top-right space-y-3 rounded-3xl border border-slate-200/70 bg-white p-4 text-sm shadow-xl focus:outline-none">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-900">{session?.name ?? 'Member'}</p>
            <p className="text-xs text-slate-500">{memberships.join(' • ') || session?.email || 'Gigvora network'}</p>
          </div>

          {personaOptions.length ? (
            <div className="space-y-2">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-slate-400">Workspaces</p>
              <div className="space-y-1">
                {personaOptions.map((option) => (
                  <Menu.Item key={option.key}>
                    {({ active }) => (
                      <Link
                        to={option.to}
                        onClick={handlePersonaSelect(option)}
                        className={classNames(
                          'flex items-center justify-between rounded-2xl px-3 py-2 transition',
                          option.key === activePersonaKey
                            ? 'bg-slate-900 text-white shadow-sm'
                            : active
                              ? 'bg-slate-100 text-slate-900'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                        )}
                      >
                        <span className="text-sm font-semibold">{option.label}</span>
                        <span
                          className={classNames(
                            'text-[0.6rem] font-semibold uppercase tracking-[0.3em]',
                            option.key === activePersonaKey ? 'text-white/80' : 'text-slate-400',
                          )}
                        >
                          {option.key === activePersonaKey ? 'Active' : option.timelineEnabled ? 'Timeline' : ''}
                        </span>
                      </Link>
                    )}
                  </Menu.Item>
                ))}
              </div>
            </div>
          ) : null}

          <div className="space-y-1">
            <Menu.Item>
              {({ active }) => (
                <Link
                  to="/settings"
                  className={classNames(
                    'flex items-center gap-2 rounded-2xl px-3 py-2 transition',
                    active ? 'bg-slate-100 text-slate-900' : 'text-slate-700',
                  )}
                >
                  Account settings
                </Link>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <Link
                  to="/notifications"
                  className={classNames(
                    'flex items-center gap-2 rounded-2xl px-3 py-2 transition',
                    active ? 'bg-slate-100 text-slate-900' : 'text-slate-700',
                  )}
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
                  className={classNames(
                    'flex w-full items-center gap-2 rounded-2xl px-3 py-2 transition',
                    active ? 'bg-rose-50 text-rose-600' : 'text-rose-600 hover:bg-rose-50',
                  )}
                >
                  Log out
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}

UserMenu.propTypes = {
  session: PropTypes.shape({
    name: PropTypes.string,
    email: PropTypes.string,
    memberships: PropTypes.arrayOf(PropTypes.string),
    avatarUrl: PropTypes.string,
    profile: PropTypes.shape({
      avatarUrl: PropTypes.string,
    }),
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }),
  onLogout: PropTypes.func.isRequired,
  roleOptions: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      to: PropTypes.string.isRequired,
      timelineEnabled: PropTypes.bool,
    }),
  ),
  currentRoleKey: PropTypes.string,
  onRoleSelect: PropTypes.func,
};

UserMenu.defaultProps = {
  session: null,
  roleOptions: [],
  currentRoleKey: null,
  onRoleSelect: undefined,
};

function InboxPreview({
  threads,
  loading,
  error,
  onRefresh,
  lastFetchedAt,
  onOpen,
  onThreadClick,
  status = 'idle',
  variant = 'menu',
}) {
  const handleAfterEnter = () => {
    onOpen?.();
  };

  const handleRefresh = (event) => {
    event.preventDefault();
    onRefresh?.();
  };

  const hasThreads = threads.length > 0;
  const isDock = variant === 'dock';
  const isIcon = variant === 'icon';
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
      loading: 'bg-slate-300',
      offline: 'bg-slate-400',
      error: 'bg-rose-500',
      idle: 'bg-slate-300',
    }),
    [],
  );
  const resolvedStatus = statusLabelMap[status] ? status : 'idle';
  const indicatorClass = classNames(
    isDock
      ? 'absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full border-2 border-white transition'
      : 'h-2.5 w-2.5 rounded-full transition-all duration-150',
    statusToneMap[resolvedStatus],
    resolvedStatus === 'loading' ? 'animate-pulse' : '',
  );
  const ariaLabel = `Inbox menu, status ${statusLabelMap[resolvedStatus]}`;

  return (
    <Menu as="div" className="relative hidden lg:block">
      <Menu.Button
        className={
          isDock
            ? classNames(
                'group flex h-[4.5rem] w-20 flex-col items-center justify-center gap-1 rounded-none border-b-2 border-transparent px-2 text-[0.7rem] font-semibold text-slate-500 transition hover:border-slate-300 hover:text-slate-900',
                loading ? 'pointer-events-none opacity-70' : null,
              )
            : classNames(
                'inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
                isIcon ? 'h-11 w-11 justify-center px-0 py-0 hover:border-slate-400/80 hover:text-slate-900' : 'px-3 py-2 text-sm font-semibold hover:border-accent hover:bg-accent/10 hover:text-accent',
                loading ? 'pointer-events-none opacity-70' : null,
              )
        }
        onClick={onRefresh}
        aria-label={ariaLabel}
      >
        {isDock ? (
          <>
            <span className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm transition group-hover:border-slate-300 group-hover:shadow">
              <ChatBubbleLeftRightIcon className="h-5 w-5 text-slate-500 transition group-hover:text-slate-900" />
              <span className={indicatorClass} aria-hidden="true" />
            </span>
            <span className="leading-tight">Messaging</span>
          </>
        ) : (
          <span className="inline-flex items-center gap-1">
            <span className="relative inline-flex items-center gap-1" role="status" aria-live="polite">
              <span className={indicatorClass} aria-hidden="true" />
              {isIcon ? null : (
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                  {statusLabelMap[resolvedStatus]}
                </span>
              )}
            </span>
            {isIcon ? null : <span className="font-semibold text-slate-600">Inbox</span>}
          </span>
        )}
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
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">{error}</div>
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

InboxPreview.propTypes = {
  threads: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      title: PropTypes.string,
      snippet: PropTypes.string,
      updatedAt: PropTypes.string,
      unread: PropTypes.bool,
    }),
  ).isRequired,
  loading: PropTypes.bool,
  error: PropTypes.string,
  onRefresh: PropTypes.func,
  lastFetchedAt: PropTypes.string,
  onOpen: PropTypes.func,
  onThreadClick: PropTypes.func,
  status: PropTypes.string,
  variant: PropTypes.oneOf(['menu', 'dock', 'icon']),
};

InboxPreview.defaultProps = {
  loading: false,
  error: null,
  onRefresh: undefined,
  lastFetchedAt: null,
  onOpen: undefined,
  onThreadClick: undefined,
  status: 'idle',
  variant: 'menu',
};

function QuickSearchDialog({
  open,
  onClose,
  marketingSearch,
  trending,
  onSubmit,
  onTrendingNavigate,
  recentSearches,
  onSelectRecent,
  onClearHistory,
}) {
  const [value, setValue] = useState('');

  useEffect(() => {
    if (open) {
      setValue('');
    }
  }, [open]);

  if (!marketingSearch) {
    return null;
  }

  const placeholder = marketingSearch.placeholder ?? 'Search the network';
  const ariaLabel = marketingSearch.ariaLabel ?? 'Search the network';
  const trendingEntries = Array.isArray(trending) ? trending.slice(0, 6) : [];
  const recentEntries = Array.isArray(recentSearches) ? recentSearches.slice(0, 6) : [];

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!value.trim()) {
      return;
    }
    onSubmit?.(value);
    onClose();
  };

  const handleTrendingClick = (entry) => {
    onTrendingNavigate?.(entry);
    onClose();
  };

  const handleRecentClick = (entry) => {
    if (!entry) {
      return;
    }
    onSelectRecent?.(entry);
    onClose();
  };

  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-[60]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-150"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-start justify-center px-4 py-10 sm:items-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xl">
                <Dialog.Title className="flex items-start justify-between gap-4 text-left">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Quick search</p>
                    <p className="mt-1 text-xl font-semibold text-slate-900">Find people, opportunities, and spaces</p>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/80 text-slate-500 transition hover:border-slate-400 hover:text-slate-900"
                  >
                    <span className="sr-only">Close search</span>
                    <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                </Dialog.Title>
                <form
                  className="mt-6 flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-slate-50 px-4 py-3 shadow-inner focus-within:border-accent/60 focus-within:bg-white"
                  onSubmit={handleSubmit}
                  role="search"
                  aria-label={ariaLabel}
                >
                  <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
                  <input
                    type="search"
                    value={value}
                    onChange={(event) => setValue(event.target.value)}
                    placeholder={placeholder}
                    aria-label={ariaLabel}
                    className="flex-1 border-0 bg-transparent text-base text-slate-700 placeholder:text-slate-400 focus:ring-0"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                  >
                    Search
                  </button>
                </form>
                {recentEntries.length ? (
                  <section className="mt-6 space-y-3" aria-label="Recent searches">
                    <header className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                      <span className="inline-flex items-center gap-2 text-slate-500">
                        <ClockIcon className="h-4 w-4 text-slate-400" aria-hidden="true" />
                        Recent searches
                      </span>
                      <button
                        type="button"
                        onClick={onClearHistory}
                        className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-slate-400 transition hover:text-slate-600"
                      >
                        Clear
                      </button>
                    </header>
                    <div className="flex flex-wrap gap-2">
                      {recentEntries.map((entry) => (
                        <button
                          key={entry}
                          type="button"
                          onClick={() => handleRecentClick(entry)}
                          aria-label={`Search "${entry}" again`}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-slate-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-slate-500 transition hover:border-accent/50 hover:bg-white hover:text-accent-strong"
                        >
                          <span className="truncate">{entry}</span>
                        </button>
                      ))}
                    </div>
                  </section>
                ) : null}
                {trendingEntries.length ? (
                  <section className="mt-6 space-y-3" aria-label="Trending destinations">
                    <header className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                      <span className="inline-flex items-center gap-2 text-slate-500">
                        <ArrowTrendingUpIcon className="h-4 w-4 text-accent" aria-hidden="true" />
                        Trending now
                      </span>
                    </header>
                    <div className="space-y-2">
                      {trendingEntries.map((entry) => (
                        <Link
                          key={entry.id}
                          to={entry.to ?? '#'}
                          onClick={() => handleTrendingClick(entry)}
                          className="group flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-accent/60 hover:text-accent-strong"
                        >
                          <span className="line-clamp-2 text-left leading-snug">{entry.label}</span>
                          <ArrowTrendingUpIcon className="h-4 w-4 text-slate-300 transition group-hover:text-accent" aria-hidden="true" />
                        </Link>
                      ))}
                    </div>
                  </section>
                ) : null}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

QuickSearchDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  marketingSearch: PropTypes.shape({
    placeholder: PropTypes.string,
    ariaLabel: PropTypes.string,
  }),
  trending: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      description: PropTypes.string,
      to: PropTypes.string,
    }),
  ),
  onSubmit: PropTypes.func,
  onTrendingNavigate: PropTypes.func,
  recentSearches: PropTypes.arrayOf(PropTypes.string),
  onSelectRecent: PropTypes.func,
  onClearHistory: PropTypes.func,
};

QuickSearchDialog.defaultProps = {
  marketingSearch: null,
  trending: [],
  onSubmit: undefined,
  onTrendingNavigate: undefined,
  recentSearches: [],
  onSelectRecent: undefined,
  onClearHistory: undefined,
};

function SearchSpotlight({
  open,
  trending,
  recentSearches,
  onHistorySelect,
  onTrendingSelect,
  onClearHistory,
  onPointerEnter,
  onPointerLeave,
}) {
  const hasHistory = Array.isArray(recentSearches) && recentSearches.length > 0;
  const hasTrending = Array.isArray(trending) && trending.length > 0;

  if (!open || (!hasHistory && !hasTrending)) {
    return null;
  }

  return (
    <Transition
      show={open}
      as={Fragment}
      enter="transition ease-out duration-150"
      enterFrom="opacity-0 translate-y-2"
      enterTo="opacity-100 translate-y-0"
      leave="transition ease-in duration-100"
      leaveFrom="opacity-100 translate-y-0"
      leaveTo="opacity-0 translate-y-2"
    >
      <div
        className="absolute left-0 right-0 top-[calc(100%+0.75rem)] z-50"
        onMouseEnter={onPointerEnter}
        onMouseLeave={onPointerLeave}
      >
        <div className="space-y-4 rounded-3xl border border-slate-200/70 bg-white/95 p-4 text-sm shadow-xl backdrop-blur">
          {hasHistory ? (
            <section className="space-y-3" aria-label="Recent searches">
              <header className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                <span className="inline-flex items-center gap-2 text-slate-500">
                  <ClockIcon className="h-4 w-4 text-slate-400" aria-hidden="true" />
                  Recent searches
                </span>
                <button
                  type="button"
                  onClick={onClearHistory}
                  className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-slate-400 transition hover:text-slate-600"
                >
                  Clear
                </button>
              </header>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((entry) => (
                  <button
                    key={entry}
                    type="button"
                    onClick={() => onHistorySelect?.(entry)}
                    aria-label={`Search "${entry}" again`}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-slate-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-slate-500 transition hover:border-accent/50 hover:bg-white hover:text-accent-strong"
                  >
                    <span className="truncate">{entry}</span>
                  </button>
                ))}
              </div>
            </section>
          ) : null}
          {hasHistory && hasTrending ? <div className="h-px bg-slate-200/70" /> : null}
          {hasTrending ? (
            <section className="space-y-3" aria-label="Suggested destinations">
              <header className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                <span className="inline-flex items-center gap-2 text-slate-500">
                  <ArrowTrendingUpIcon className="h-4 w-4 text-accent" aria-hidden="true" />
                  Suggested now
                </span>
              </header>
              <div className="grid gap-2">
                {trending.map((entry) => (
                  <Link
                    key={entry.id}
                    to={entry.to ?? '#'}
                    onClick={() => onTrendingSelect?.(entry)}
                    className="group flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 font-semibold text-slate-700 transition hover:border-accent/60 hover:text-accent-strong"
                  >
                    <span className="line-clamp-2 text-left leading-snug">{entry.label}</span>
                    <ArrowUpRightIcon className="h-4 w-4 text-slate-300 group-hover:text-accent" aria-hidden="true" />
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </Transition>
  );
}

SearchSpotlight.propTypes = {
  open: PropTypes.bool,
  trending: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      to: PropTypes.string,
      description: PropTypes.string,
    }),
  ),
  recentSearches: PropTypes.arrayOf(PropTypes.string),
  onHistorySelect: PropTypes.func,
  onTrendingSelect: PropTypes.func,
  onClearHistory: PropTypes.func,
  onPointerEnter: PropTypes.func,
  onPointerLeave: PropTypes.func,
};

SearchSpotlight.defaultProps = {
  open: false,
  trending: [],
  recentSearches: [],
  onHistorySelect: undefined,
  onTrendingSelect: undefined,
  onClearHistory: undefined,
  onPointerEnter: undefined,
  onPointerLeave: undefined,
};

export default function AppTopBar({
  navOpen,
  onOpenNav,
  onCloseNav,
  isAuthenticated,
  marketingNavigation,
  marketingSearch,
  primaryNavigation,
  roleOptions,
  currentRoleKey,
  onLogout,
  inboxPreview,
  connectionState,
  onRefreshInbox,
  onInboxMenuOpen,
  onInboxThreadClick,
  t,
  session,
  onMarketingSearch,
  navigationPulse,
  navigationTrending,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isQuickSearchOpen, setIsQuickSearchOpen] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isSearchPopoverHover, setIsSearchPopoverHover] = useState(false);
  const searchBlurTimeoutRef = useRef(null);
  const sessionId = session?.id ?? null;
  const resolvedMarketingMenus = marketingNavigation ?? [];
  const resolvedPrimaryNavigation = useMemo(
    () => (Array.isArray(primaryNavigation) ? primaryNavigation : []),
    [primaryNavigation],
  );
  const mainNavigation = useMemo(
    () => resolvedPrimaryNavigation.filter((item) => item?.placement !== 'quick-action'),
    [resolvedPrimaryNavigation],
  );
  const quickNavigation = useMemo(
    () => resolvedPrimaryNavigation.filter((item) => item?.placement === 'quick-action'),
    [resolvedPrimaryNavigation],
  );
  const dockNavigation = useMemo(
    () => mainNavigation.filter((item) => item?.placement === 'dock'),
    [mainNavigation],
  );
  const toolbarNavigation = useMemo(
    () => mainNavigation.filter((item) => item?.placement !== 'dock'),
    [mainNavigation],
  );
  const personaNavigation = useMemo(
    () => toolbarNavigation.filter((item) => item?.context === 'persona'),
    [toolbarNavigation],
  );
  const workspaceNavigation = useMemo(
    () => toolbarNavigation.filter((item) => item?.context !== 'persona'),
    [toolbarNavigation],
  );
  const primaryRailNavigation = useMemo(
    () => workspaceNavigation.slice(0, 2),
    [workspaceNavigation],
  );
  const workspaceOverflowNavigation = useMemo(
    () => workspaceNavigation.slice(2),
    [workspaceNavigation],
  );
  const creationStudioNav = useMemo(
    () => quickNavigation.find((item) => item.id === 'studio'),
    [quickNavigation],
  );
  const pulseInsights = useMemo(() => {
    if (Array.isArray(navigationPulse) && navigationPulse.length > 0) {
      return navigationPulse;
    }
    return deriveNavigationPulse(session, resolvedMarketingMenus, mainNavigation);
  }, [mainNavigation, navigationPulse, resolvedMarketingMenus, session]);

  const trendingEntries = useMemo(() => {
    if (Array.isArray(navigationTrending) && navigationTrending.length > 0) {
      return navigationTrending;
    }
    return deriveNavigationTrending(resolvedMarketingMenus, 6);
  }, [navigationTrending, resolvedMarketingMenus]);

  const searchTrendingEntries = useMemo(() => {
    const searchSuggestions = normaliseTrendingEntries(
      marketingSearch?.trending ?? [],
      marketingSearch,
    );
    if (searchSuggestions.length > 0) {
      return searchSuggestions.slice(0, 6);
    }
    return trendingEntries.slice(0, 6);
  }, [marketingSearch, trendingEntries]);

  const navMegaMenus = useMemo(() => {
    if (!isAuthenticated) {
      return [];
    }

    const quickHighlights = quickNavigation
      .filter((item) => item.id !== 'notifications')
      .map((item) => ({
        id: `quick-${item.id}`,
        label: item.label,
        description: item.description ?? item.ariaLabel ?? 'Open quick action',
        to: item.to,
        badge: 'Quick action',
      }));

    const menus = [];

    if (workspaceOverflowNavigation.length) {
      menus.push({
        id: 'workspace-apps',
        label: 'Workspace apps',
        description: 'Jump into explorer, analytics, and supporting surfaces tuned to your role.',
        theme: {
          button: 'border border-transparent bg-slate-100/80 text-slate-600 hover:bg-white hover:text-slate-900',
          panel: 'bg-white/95',
          header: 'bg-gradient-to-br from-slate-50 via-white to-white',
          grid: 'md:grid-cols-2',
          item: 'hover:border-accent/50 hover:bg-accent/5',
          icon: 'text-slate-500 group-hover:text-accent',
        },
        highlights: quickHighlights,
        sections: [
          {
            title: 'Workspace destinations',
            items: workspaceOverflowNavigation.map((entry) => ({
              name: entry.label,
              description: entry.description ?? entry.ariaLabel ?? 'Open workspace surface',
              to: entry.to,
              icon: entry.icon,
            })),
          },
        ],
      });
    }

    if (personaNavigation.length) {
      menus.push({
        id: 'persona-hubs',
        label: 'Persona hubs',
        description: 'Switch between specialised dashboards tailored to your memberships.',
        theme: {
          button: 'border border-transparent bg-indigo-50/70 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700',
          panel: 'bg-white/95',
          header: 'bg-gradient-to-br from-indigo-50 via-white to-white',
          grid: 'md:grid-cols-2',
          item: 'hover:border-indigo-200 hover:bg-indigo-50',
          icon: 'text-indigo-500 group-hover:text-indigo-600',
        },
        sections: [
          {
            title: 'Role workspaces',
            items: personaNavigation.map((entry) => ({
              name: entry.label,
              description: entry.description ?? entry.ariaLabel ?? 'Open workspace surface',
              to: entry.to,
              icon: entry.icon,
            })),
          },
        ],
      });
    }

    return menus;
  }, [isAuthenticated, personaNavigation, quickNavigation, workspaceOverflowNavigation]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      const stored = window.localStorage.getItem('gigvora:marketing_search_history');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const sanitised = parsed
            .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
            .filter((entry) => entry);
          if (sanitised.length) {
            setSearchHistory(sanitised.slice(0, 10));
          }
        }
      }
    } catch (error) {
      // Ignore storage errors silently
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handler = (event) => {
      if (!marketingSearch) {
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setIsQuickSearchOpen(true);
      }
    };

    window.addEventListener('keydown', handler);
    return () => {
      window.removeEventListener('keydown', handler);
    };
  }, [marketingSearch]);

  useEffect(() => {
    return () => {
      if (searchBlurTimeoutRef.current) {
        window.clearTimeout(searchBlurTimeoutRef.current);
      }
    };
  }, []);

  const persistSearchHistory = useCallback((next) => {
    const persistValue = (value) => {
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem('gigvora:marketing_search_history', JSON.stringify(value));
        } catch (error) {
          // Ignore storage errors silently
        }
      }
      return value;
    };

    if (typeof next === 'function') {
      setSearchHistory((prevState) => {
        const resolved = next(prevState);
        if (!Array.isArray(resolved)) {
          return persistValue([]);
        }
        return persistValue(resolved);
      });
      return;
    }

    const resolvedValue = Array.isArray(next) ? next : [];
    setSearchHistory(resolvedValue);
    persistValue(resolvedValue);
  }, []);

  const recordSearchTerm = useCallback(
    (term) => {
      const trimmed = typeof term === 'string' ? term.trim() : '';
      if (!trimmed) {
        return;
      }
      persistSearchHistory((prevState) => {
        const previous = Array.isArray(prevState) ? prevState : [];
        const deduped = [
          trimmed,
          ...previous.filter((entry) => entry.toLowerCase() !== trimmed.toLowerCase()),
        ];
        return deduped.slice(0, 10);
      });
    },
    [persistSearchHistory],
  );

  const clearSearchHistory = useCallback(() => {
    persistSearchHistory([]);
  }, [persistSearchHistory]);

  const handleTrendingNavigate = useCallback(
    (entry) => {
      if (!entry) {
        return;
      }
      if (typeof analytics?.track === 'function') {
        const trackPromise = analytics.track(
          'web_header_trending_navigate',
          {
            entryId: entry.id,
            label: entry.label,
            destination: entry.to ?? null,
            persona: currentRoleKey ?? null,
            badge: entry.badge ?? null,
            source: 'web-header',
          },
          sessionId ? { userId: sessionId } : undefined,
        );
        if (trackPromise && typeof trackPromise.catch === 'function') {
          trackPromise.catch(() => {});
        }
      }
      if (entry.label) {
        recordSearchTerm(entry.label);
      }
    },
    [currentRoleKey, recordSearchTerm, sessionId],
  );

  const submitMarketingSearch = useCallback(
    (rawQuery) => {
      const trimmed = typeof rawQuery === 'string' ? rawQuery.trim() : '';
      if (!trimmed) {
        return;
      }
      if (typeof analytics?.track === 'function') {
        const trackPromise = analytics.track(
          'web_header_search_submitted',
          {
            query: trimmed,
            persona: currentRoleKey ?? null,
            source: 'web-header',
          },
          sessionId ? { userId: sessionId } : undefined,
        );
        if (trackPromise && typeof trackPromise.catch === 'function') {
          trackPromise.catch(() => {});
        }
      }
      recordSearchTerm(trimmed);
      onMarketingSearch?.(trimmed);
    },
    [currentRoleKey, onMarketingSearch, recordSearchTerm, sessionId],
  );

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    submitMarketingSearch(searchQuery);
    setSearchQuery('');
  };

  const openQuickSearch = useCallback(() => {
    setIsQuickSearchOpen(true);
  }, []);

  const closeQuickSearch = useCallback(() => {
    setIsQuickSearchOpen(false);
  }, []);

  const handleHistorySelect = useCallback(
    (value) => {
      submitMarketingSearch(value);
      setSearchQuery('');
      setIsSearchFocused(false);
      setIsSearchPopoverHover(false);
    },
    [submitMarketingSearch],
  );

  const handleSpotlightTrendingSelect = useCallback(
    (entry) => {
      handleTrendingNavigate(entry);
      setIsSearchFocused(false);
      setIsSearchPopoverHover(false);
    },
    [handleTrendingNavigate],
  );

  const handleSearchFocus = useCallback(() => {
    if (searchBlurTimeoutRef.current) {
      window.clearTimeout(searchBlurTimeoutRef.current);
    }
    setIsSearchFocused(true);
  }, []);

  const handleSearchBlur = useCallback(() => {
    if (searchBlurTimeoutRef.current) {
      window.clearTimeout(searchBlurTimeoutRef.current);
    }
    searchBlurTimeoutRef.current = window.setTimeout(() => {
      setIsSearchFocused(false);
    }, 80);
  }, []);

  const handleSearchKeyDown = useCallback((event) => {
    if (event.key === 'Escape') {
      event.currentTarget.blur();
      setIsSearchFocused(false);
      setIsSearchPopoverHover(false);
    }
  }, []);

  const handleSpotlightPointerEnter = useCallback(() => {
    if (searchBlurTimeoutRef.current) {
      window.clearTimeout(searchBlurTimeoutRef.current);
    }
    setIsSearchPopoverHover(true);
  }, []);

  const handleSpotlightPointerLeave = useCallback(() => {
    if (searchBlurTimeoutRef.current) {
      window.clearTimeout(searchBlurTimeoutRef.current);
    }
    searchBlurTimeoutRef.current = window.setTimeout(() => {
      setIsSearchPopoverHover(false);
      setIsSearchFocused(false);
    }, 80);
  }, []);

  const shouldShowSearchSpotlight = Boolean(
    marketingSearch &&
      (isSearchFocused || isSearchPopoverHover) &&
      (searchHistory.length > 0 || searchTrendingEntries.length > 0),
  );
  const shouldShowMarketingMenus = !isAuthenticated && resolvedMarketingMenus.length > 0;
  const messagingNav = useMemo(
    () => dockNavigation.find((item) => item.id === 'messaging'),
    [dockNavigation],
  );
  const alertsNav = useMemo(
    () => dockNavigation.find((item) => item.id === 'alerts'),
    [dockNavigation],
  );

  const syncPersonaMetadata = useCallback((option) => {
    if (typeof document === 'undefined') {
      return;
    }
    const root = document.documentElement;
    if (!root) {
      return;
    }
    if (option?.key) {
      root.dataset.personaKey = option.key;
    } else {
      delete root.dataset.personaKey;
    }
    if (typeof option?.timelineEnabled === 'boolean') {
      root.dataset.personaTimeline = option.timelineEnabled ? 'live' : 'pending';
    } else {
      delete root.dataset.personaTimeline;
    }
  }, []);

  const handleRoleSelect = useCallback(
    (option) => {
      if (!option) {
        return;
      }
      syncPersonaMetadata(option);

      if (typeof analytics?.track === 'function') {
        analytics.track(
          'persona_switched',
          {
            persona: option.key,
            destination: option.to,
            timelineEnabled: option.timelineEnabled ?? false,
          },
          { userId: session?.id },
        );
      }

      if (typeof window !== 'undefined') {
        try {
          if (typeof window.dispatchEvent === 'function') {
            window.dispatchEvent(
              new CustomEvent('gigvora:persona-switch', {
                detail: {
                  key: option.key,
                  label: option.label,
                  destination: option.to,
                  timelineEnabled: option.timelineEnabled ?? false,
                },
              }),
            );
          }
        } catch (error) {
          console.warn('Unable to dispatch persona switch event', error);
        }

        const payload = {
          event: 'gigvora_persona_switch',
          persona: option.key,
          destination: option.to,
          timelineEnabled: option.timelineEnabled ?? false,
        };

        if (Array.isArray(window.dataLayer)) {
          window.dataLayer.push(payload);
        }

        if (window.sessionStorage) {
          try {
            window.sessionStorage.setItem(
              'gigvora:last-persona-switch',
              JSON.stringify({ ...payload, occurredAt: new Date().toISOString() }),
            );
          } catch (error) {
            console.warn('Unable to persist persona switch payload', error);
          }
        }
      }
    },
    [session?.id, syncPersonaMetadata],
  );

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <MobileNavigation
        open={navOpen}
        onClose={onCloseNav}
        isAuthenticated={isAuthenticated}
        primaryNavigation={mainNavigation}
        quickNavigation={quickNavigation}
        marketingNavigation={resolvedMarketingMenus}
        marketingSearch={marketingSearch}
        onLogout={onLogout}
        roleOptions={roleOptions}
        currentRoleKey={currentRoleKey}
        onMarketingSearch={onMarketingSearch}
        session={session}
        navigationPulse={pulseInsights}
        trendingEntries={trendingEntries}
      />
      <div className="mx-auto w-full max-w-screen-2xl px-4 sm:px-6 2xl:px-10">
        <div className="grid grid-cols-[auto,minmax(0,1fr),auto] items-center gap-3 py-3 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onOpenNav}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-400/80 hover:text-slate-900 lg:hidden"
            >
              <span className="sr-only">Open navigation</span>
              <Bars3Icon className="h-5 w-5" />
            </button>
            <Link to="/" className="inline-flex shrink-0 items-center">
              <img src={LOGO_URL} srcSet={LOGO_SRCSET} alt="Gigvora" className="h-10 w-auto sm:h-12" />
            </Link>
            {marketingSearch ? (
              <>
                <button
                  type="button"
                  onClick={openQuickSearch}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-400/80 hover:text-slate-900 md:hidden"
                >
                  <span className="sr-only">Open quick search</span>
                  <MagnifyingGlassIcon className="h-5 w-5" aria-hidden="true" />
                </button>
                <div className="relative hidden md:block md:w-64 lg:w-72 xl:w-80">
                  <form
                    className="flex w-full items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm shadow-inner ring-1 ring-transparent transition focus-within:bg-white focus-within:ring-2 focus-within:ring-accent/20"
                    onSubmit={handleSearchSubmit}
                    role="search"
                    aria-label={marketingSearch.ariaLabel ?? marketingSearch.placeholder}
                  >
                    <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      onFocus={handleSearchFocus}
                      onBlur={handleSearchBlur}
                      onKeyDown={handleSearchKeyDown}
                      placeholder={marketingSearch.placeholder}
                      aria-label={marketingSearch.ariaLabel ?? marketingSearch.placeholder}
                      className="flex-1 border-0 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:ring-0"
                    />
                    <span className="hidden items-center gap-1 rounded-full border border-slate-200/70 px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-slate-400 lg:inline-flex">
                      ⌘K
                    </span>
                  </form>
                  <SearchSpotlight
                    open={shouldShowSearchSpotlight}
                    trending={searchTrendingEntries}
                    recentSearches={searchHistory}
                    onHistorySelect={handleHistorySelect}
                    onTrendingSelect={handleSpotlightTrendingSelect}
                    onClearHistory={clearSearchHistory}
                    onPointerEnter={handleSpotlightPointerEnter}
                    onPointerLeave={handleSpotlightPointerLeave}
                  />
                </div>
              </>
            ) : null}
          </div>

          <div className="hidden items-stretch justify-center gap-1 lg:flex">
            {isAuthenticated
              ? dockNavigation.map((item) => {
                  if (item.type === 'inbox') {
                    return (
                      <InboxPreview
                        key={item.id}
                        threads={inboxPreview.threads}
                        loading={inboxPreview.loading}
                        error={inboxPreview.error}
                        lastFetchedAt={inboxPreview.lastFetchedAt}
                        onRefresh={onRefreshInbox}
                        onOpen={onInboxMenuOpen}
                        onThreadClick={onInboxThreadClick}
                        status={connectionState}
                        variant="dock"
                      />
                    );
                  }
                  if (item.type === 'notifications') {
                    return <NotificationBell key={item.id} session={session} variant="dock" />;
                  }
                  return <PrimaryNavItem key={item.id} item={item} />;
                })
              : null}
          </div>

          <div className="flex items-center justify-end gap-2 sm:gap-3">
            {isAuthenticated ? (
              <>
                <div className="flex items-center gap-2 lg:hidden">
                  {messagingNav ? (
                    <Link
                      to={messagingNav.to}
                      aria-label={messagingNav.ariaLabel ?? messagingNav.label}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-400/80 hover:text-slate-900"
                    >
                      <ChatBubbleLeftRightIcon className="h-5 w-5" aria-hidden="true" />
                    </Link>
                  ) : null}
                  {alertsNav ? (
                    <Link
                      to={alertsNav.to}
                      aria-label={alertsNav.ariaLabel ?? alertsNav.label}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-400/80 hover:text-slate-900"
                    >
                      <BellIcon className="h-5 w-5" aria-hidden="true" />
                    </Link>
                  ) : null}
                </div>
                <LanguageSelector className="hidden sm:inline-flex" />
                <div className="hidden items-center gap-2 lg:flex">
                  <InboxPreview
                    threads={inboxPreview.threads}
                    loading={inboxPreview.loading}
                    error={inboxPreview.error}
                    lastFetchedAt={inboxPreview.lastFetchedAt}
                    onRefresh={onRefreshInbox}
                    onOpen={onInboxMenuOpen}
                    onThreadClick={onInboxThreadClick}
                    status={connectionState}
                    variant="icon"
                  />
                  <NotificationBell session={session} variant="compact" />
                </div>
                <div className="flex items-center gap-2">
                  {creationStudioNav ? (
                    <Link
                      to={creationStudioNav.to}
                      className="hidden items-center gap-2 rounded-full bg-accent px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition hover:bg-accentDark lg:inline-flex"
                    >
                      <SparklesIcon className="h-4 w-4" />
                      {creationStudioNav.label}
                    </Link>
                  ) : null}
                  <UserMenu
                    session={session}
                    onLogout={onLogout}
                    roleOptions={roleOptions}
                    currentRoleKey={currentRoleKey}
                    onRoleSelect={handleRoleSelect}
                  />
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3">
                <LanguageSelector className="hidden sm:inline-flex" />
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

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 py-3">
          {isAuthenticated ? (
            <div className="flex w-full flex-wrap items-center gap-2 text-sm font-semibold text-slate-600 sm:gap-3">
              {primaryRailNavigation.length ? (
                <nav className="flex flex-wrap items-center gap-2">
                  {primaryRailNavigation.map((item) => (
                    <PrimaryNavItem key={item.id} item={item} variant="toolbar" />
                  ))}
                </nav>
              ) : null}
              {navMegaMenus.length ? (
                <div className="flex flex-wrap items-center gap-2">
                  {navMegaMenus.map((menu) => (
                    <MegaMenu key={menu.id} item={menu} />
                  ))}
                </div>
              ) : null}
            </div>
          ) : shouldShowMarketingMenus ? (
            <div className="flex w-full flex-wrap items-center gap-2">
              {resolvedMarketingMenus.map((menu) => (
                <HeaderMegaMenu key={menu.id} menu={menu} />
              ))}
            </div>
          ) : null}
        </div>
      </div>
      <QuickSearchDialog
        open={isQuickSearchOpen}
        onClose={closeQuickSearch}
        marketingSearch={marketingSearch}
        trending={searchTrendingEntries}
        onSubmit={submitMarketingSearch}
        onTrendingNavigate={handleTrendingNavigate}
        recentSearches={searchHistory}
        onSelectRecent={handleHistorySelect}
        onClearHistory={clearSearchHistory}
      />
    </header>
  );
}

AppTopBar.propTypes = {
  navOpen: PropTypes.bool.isRequired,
  onOpenNav: PropTypes.func.isRequired,
  onCloseNav: PropTypes.func.isRequired,
  isAuthenticated: PropTypes.bool.isRequired,
  marketingNavigation: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      description: PropTypes.string,
      sections: PropTypes.arrayOf(
        PropTypes.shape({
          title: PropTypes.string.isRequired,
          items: PropTypes.arrayOf(
            PropTypes.shape({
              name: PropTypes.string.isRequired,
              description: PropTypes.string.isRequired,
              to: PropTypes.string.isRequired,
              icon: PropTypes.elementType.isRequired,
            }),
          ).isRequired,
        }),
      ).isRequired,
    }),
  ),
  marketingSearch: PropTypes.shape({
    id: PropTypes.string,
    placeholder: PropTypes.string,
    ariaLabel: PropTypes.string,
  }),
  primaryNavigation: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      to: PropTypes.string.isRequired,
      badge: PropTypes.string,
      placement: PropTypes.string,
    }),
  ).isRequired,
  roleOptions: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      to: PropTypes.string.isRequired,
      timelineEnabled: PropTypes.bool,
    }),
  ),
  currentRoleKey: PropTypes.string,
  onLogout: PropTypes.func.isRequired,
  inboxPreview: PropTypes.shape({
    threads: PropTypes.array,
    loading: PropTypes.bool,
    error: PropTypes.string,
    lastFetchedAt: PropTypes.string,
  }).isRequired,
  connectionState: PropTypes.string.isRequired,
  onRefreshInbox: PropTypes.func.isRequired,
  onInboxMenuOpen: PropTypes.func.isRequired,
  onInboxThreadClick: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
  session: PropTypes.object,
  onMarketingSearch: PropTypes.func,
  navigationPulse: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired,
      delta: PropTypes.string,
      hint: PropTypes.string,
    }),
  ),
  navigationTrending: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      description: PropTypes.string,
      to: PropTypes.string,
    }),
  ),
};

AppTopBar.defaultProps = {
  marketingNavigation: [],
  marketingSearch: null,
  roleOptions: [],
  currentRoleKey: 'user',
  session: null,
  onMarketingSearch: undefined,
  navigationPulse: null,
  navigationTrending: null,
};
