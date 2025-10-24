import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Dialog, Menu, Transition } from '@headlessui/react';
import {
  ArrowTopRightOnSquareIcon,
  Bars3Icon,
  BellIcon,
  BriefcaseIcon,
  BuildingOffice2Icon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  HomeIcon,
  PresentationChartBarIcon,
  RssIcon,
  ShieldCheckIcon,
  SparklesIcon,
  Squares2X2Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { LOGO_URL } from '../constants/branding.js';
import useSession from '../hooks/useSession.js';
import { useLanguage } from '../context/LanguageContext.jsx';
import LanguageSelector from './LanguageSelector.jsx';
import MegaMenu from './navigation/MegaMenu.jsx';
import RoleSwitcher from './navigation/RoleSwitcher.jsx';
import {
  marketingNavigation,
  resolvePrimaryNavigation,
  buildRoleOptions,
  resolvePrimaryRoleKey,
} from '../constants/navigation.js';
import { fetchInbox } from '../services/messaging.js';
import { classNames } from '../utils/classNames.js';
import { resolveActorId } from '../utils/session.js';
import { getInitials } from '../utils/profile.js';
import {
  buildThreadTitle,
  describeLastActivity,
  formatThreadParticipants,
  isThreadUnread,
} from '../utils/messaging.js';

function mapThreadPreview(thread, actorId) {
  if (!thread) {
    return null;
  }

  const participants = formatThreadParticipants(thread, actorId);
  const snippet =
    thread.lastMessagePreview ??
    thread.lastMessage?.body ??
    thread.preview ??
    (participants.length ? participants.join(', ') : 'View conversation');

  const id = thread.id ?? thread.threadId ?? thread.uuid ?? thread.subject ?? snippet;

  return {
    id,
    title: buildThreadTitle(thread, actorId),
    snippet,
    lastActivityLabel: describeLastActivity(thread),
    unread: isThreadUnread(thread),
  };
}

function InboxPreview({ loading, threads, error, onRefresh }) {
  return (
    <Menu as="div" className="relative hidden lg:block">
      <Menu.Button className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-white">
        <ChatBubbleLeftRightIcon className="h-4 w-4" /> Inbox
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
        <Menu.Items className="absolute right-0 z-50 mt-3 w-80 origin-top-right space-y-3 rounded-3xl border border-slate-200/80 bg-white/95 p-4 text-sm shadow-xl backdrop-blur focus:outline-none">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Latest messages</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onRefresh}
                disabled={loading}
                className="text-xs font-semibold text-slate-500 transition hover:text-slate-900 disabled:cursor-not-allowed disabled:text-slate-300"
              >
                {loading ? 'Refreshing…' : 'Refresh'}
              </button>
              <Link to="/inbox" className="text-xs font-semibold text-accent transition hover:text-accentDark">
                Open inbox ↗
              </Link>
            </div>
          </div>
          {loading ? (
            <div className="space-y-2" aria-live="polite">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={`inbox-skeleton-${index}`}
                  className="animate-pulse rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3"
                >
                  <div className="h-3 w-2/3 rounded-full bg-slate-200" />
                  <div className="mt-2 h-3 w-full rounded-full bg-slate-200" />
                  <div className="mt-2 h-3 w-1/3 rounded-full bg-slate-200" />
                </div>
              ))}
            </div>
          ) : null}
          {!loading && error ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              <p>{error}</p>
              <button
                type="button"
                onClick={onRefresh}
                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-amber-700 underline"
              >
                Try again
              </button>
            </div>
          ) : null}
          {!loading && !error && threads.length === 0 ? (
            <p className="rounded-2xl border border-slate-200/80 bg-slate-50/70 px-3 py-2 text-xs text-slate-500">
              You&apos;re all caught up. New conversations will appear here.
            </p>
          ) : null}
          {!loading && !error
            ? threads.map((thread) => (
                <Menu.Item key={thread.id}>
                  {({ active }) => (
                    <Link
                      to="/inbox"
                      className={classNames(
                        'block rounded-2xl border px-3 py-2 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-white',
                        active
                          ? 'border-accent bg-accentSoft/70 text-slate-900 shadow-soft'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900',
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-semibold text-slate-900">{thread.title}</p>
                        {thread.unread ? (
                          <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-accent">
                            • Unread
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-xs text-slate-500 line-clamp-2">{thread.snippet}</p>
                      <p className="mt-2 text-[0.65rem] uppercase tracking-wide text-slate-400">
                        {thread.lastActivityLabel}
                      </p>
                    </Link>
                  )}
                </Menu.Item>
              ))
            : null}
        </Menu.Items>
      </Transition>
    </Menu>
  );
}

function UserMenu({ session, onLogout }) {
  const initials = getInitials(session?.name, session?.email, 'GV');
  const memberships = Array.isArray(session?.memberships) ? session.memberships : [];

  return (
    <Menu as="div" className="relative">
      <Menu.Button className="flex items-center gap-3 rounded-full border border-slate-200/80 bg-white px-3 py-1.5 text-left text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-white">
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
                className={classNames(
                  'flex items-center gap-2 rounded-2xl px-3 py-2 transition',
                  active ? 'bg-slate-100 text-slate-900' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900',
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
                  active ? 'bg-slate-100 text-slate-900' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900',
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
        </Menu.Items>
      </Transition>
    </Menu>
  );
}

function MobileNavigationDialog({
  open,
  onClose,
  isAuthenticated,
  primaryNavigation,
  iconMap,
  marketingItems,
  roleOptions,
  currentRoleKey,
  onLogout,
  t,
}) {
  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50 lg:hidden" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="transition-opacity ease-linear duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity ease-linear duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 flex">
          <Transition.Child
            as={Fragment}
            enter="transition ease-in-out duration-200 transform"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="transition ease-in-out duration-200 transform"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
            <Dialog.Panel className="relative flex h-full w-full max-w-md flex-col overflow-y-auto bg-white px-4 pb-8 pt-6 shadow-2xl">
              <div className="flex items-center justify-between gap-3">
                <Link to="/" onClick={() => onClose(false)} className="inline-flex items-center gap-2">
                  <img src={LOGO_URL} alt="Gigvora" className="h-10 w-auto" />
                </Link>
                <button
                  type="button"
                  onClick={() => onClose(false)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
                >
                  <span className="sr-only">Close navigation</span>
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-6 space-y-8">
                {isAuthenticated ? (
                  <>
                    {roleOptions.length ? (
                      <section>
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Workspaces</p>
                        <ul className="mt-3 space-y-2">
                          {roleOptions.map((option) => {
                            const Icon = option.icon ?? Squares2X2Icon;
                            return (
                              <li key={option.key}>
                                <Link
                                  to={option.to}
                                  onClick={() => onClose(false)}
                                  className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                                >
                                  <Icon className="mt-0.5 h-5 w-5 text-slate-500" />
                                  <div className="flex-1">
                                    <p className="font-semibold text-slate-900">{option.label}</p>
                                    <p className="text-xs text-slate-500">
                                      {option.timelineEnabled
                                        ? 'Timeline live and syncing updates.'
                                        : 'Activate timeline from workspace settings to notify your teams.'}
                                    </p>
                                  </div>
                                  {option.key === currentRoleKey ? (
                                    <CheckCircleIcon className="h-5 w-5 text-accent" aria-hidden="true" />
                                  ) : null}
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </section>
                    ) : null}

                    <section>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Navigation</p>
                      <ul className="mt-3 space-y-2">
                        {primaryNavigation.map((item) => {
                          const Icon = iconMap[item.id] ?? Squares2X2Icon;
                          return (
                            <li key={item.id}>
                              <NavLink
                                to={item.to}
                                onClick={() => onClose(false)}
                                className={({ isActive }) =>
                                  classNames(
                                    'flex items-center gap-3 rounded-2xl border px-3 py-2 text-sm transition',
                                    isActive
                                      ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                                      : 'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900',
                                  )
                                }
                              >
                                <Icon className="h-5 w-5" />
                                <span>{item.label}</span>
                              </NavLink>
                            </li>
                          );
                        })}
                      </ul>
                    </section>

                    <div className="space-y-3">
                      <LanguageSelector variant="mobile" />
                      <Link
                        to="/dashboard/user/creation-studio"
                        onClick={() => onClose(false)}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent px-5 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-accentDark"
                      >
                        <SparklesIcon className="h-4 w-4" />
                        Launch Creation Studio
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          onLogout();
                          onClose(false);
                        }}
                        className="inline-flex w-full items-center justify-center rounded-full border border-slate-200/80 px-5 py-3 text-base font-semibold text-slate-700 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                      >
                        Log out
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {marketingItems.map((entry) => (
                      <section key={entry.id} className="space-y-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">{entry.label}</p>
                          <p className="mt-1 text-sm text-slate-600">{entry.description}</p>
                        </div>
                        <ul className="space-y-2">
                          {entry.sections.flatMap((section) =>
                            section.items.map((item) => (
                              <li key={`${section.title}-${item.name}`}>
                                <Link
                                  to={item.to}
                                  onClick={() => onClose(false)}
                                  className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                                >
                                  <item.icon className="mt-0.5 h-5 w-5 text-accent" />
                                  <div>
                                    <p className="font-semibold text-slate-900">{item.name}</p>
                                    <p className="text-xs text-slate-500">{item.description}</p>
                                  </div>
                                </Link>
                              </li>
                            )),
                          )}
                        </ul>
                      </section>
                    ))}
                    <div className="space-y-3">
                      <LanguageSelector variant="mobile" />
                      <Link
                        to="/login"
                        onClick={() => onClose(false)}
                        className="inline-flex w-full items-center justify-center rounded-full border border-slate-200/80 px-5 py-3 text-base font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white hover:text-slate-900"
                      >
                        {t('header.login', 'Log in')}
                      </Link>
                      <Link
                        to="/register"
                        onClick={() => onClose(false)}
                        className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-slate-700"
                      >
                        {t('header.join', 'Join')}
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}

export default function Header() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { session, isAuthenticated, logout } = useSession();

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [inboxPreview, setInboxPreview] = useState({ threads: [], loading: false, error: null });
  const inboxRequestRef = useRef(null);

  const handleLogout = useCallback(() => {
    logout();
    navigate('/login');
  }, [logout, navigate]);

  const roleKey = resolvePrimaryRoleKey(session);
  const primaryNavigation = useMemo(() => resolvePrimaryNavigation(session), [session]);
  const roleOptions = useMemo(() => buildRoleOptions(session), [session]);
  const actorId = useMemo(() => resolveActorId(session), [session]);

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

  const marketingItems = useMemo(() => marketingNavigation, []);

  const loadInboxPreview = useCallback(async () => {
    if (!isAuthenticated || !actorId) {
      setInboxPreview({ threads: [], loading: false, error: null });
      return;
    }

    if (inboxRequestRef.current) {
      inboxRequestRef.current.abort();
    }

    const controller = new AbortController();
    inboxRequestRef.current = controller;
    setInboxPreview((previous) => ({ ...previous, loading: true, error: null }));

    try {
      const response = await fetchInbox({
        userId: actorId,
        includeParticipants: true,
        includeSupport: true,
        pageSize: 5,
        signal: controller.signal,
      });
      const rawThreads = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
      const threads = rawThreads.map((thread) => mapThreadPreview(thread, actorId)).filter(Boolean);
      setInboxPreview({ threads, loading: false, error: null });
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }
      const message = error?.body?.message ?? error?.message ?? 'Unable to load inbox.';
      setInboxPreview({ threads: [], loading: false, error: message });
    } finally {
      if (inboxRequestRef.current === controller) {
        inboxRequestRef.current = null;
      }
    }
  }, [actorId, isAuthenticated]);

  useEffect(() => {
    loadInboxPreview();
    return () => {
      if (inboxRequestRef.current) {
        inboxRequestRef.current.abort();
      }
    };
  }, [loadInboxPreview]);

  return (
    <>
      <MobileNavigationDialog
        open={mobileNavOpen}
        onClose={setMobileNavOpen}
        isAuthenticated={isAuthenticated}
        primaryNavigation={primaryNavigation}
        iconMap={iconMap}
        marketingItems={marketingItems}
        roleOptions={roleOptions}
        currentRoleKey={roleKey}
        onLogout={handleLogout}
        t={t}
      />
      <header className="sticky top-0 z-40 border-b border-slate-200/90 bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full items-center gap-3 px-4 py-3 sm:h-20 sm:gap-4 sm:px-6 sm:py-0 lg:px-8">
          <div className="flex items-center gap-3 lg:flex-1">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-white lg:hidden"
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
                        'inline-flex items-center gap-2 rounded-full border px-4 py-2 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-white',
                        isActive
                          ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                          : 'border-transparent text-slate-600 hover:border-slate-300 hover:bg-white hover:text-slate-900',
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
                className="hidden items-center gap-1 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 transition hover:border-slate-300 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-white lg:inline-flex"
              >
                <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                Demo tour
              </Link>
            ) : null}
            {isAuthenticated ? (
              <InboxPreview
                loading={inboxPreview.loading}
                threads={inboxPreview.threads}
                error={inboxPreview.error}
                onRefresh={loadInboxPreview}
              />
            ) : null}
            <LanguageSelector className="hidden sm:inline-flex" />
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/dashboard/user/creation-studio"
                  className="hidden items-center gap-2 rounded-full border border-accent/60 bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accentDark focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-white lg:inline-flex"
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
                  className="rounded-full border border-slate-200/80 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                >
                  {t('header.login', 'Log in')}
                </Link>
                <Link
                  to="/register"
                  className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                >
                  {t('header.join', 'Join')}
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
