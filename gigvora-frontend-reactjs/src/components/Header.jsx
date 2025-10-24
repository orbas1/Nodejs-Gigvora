import { Fragment, useCallback, useMemo } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, Transition } from '@headlessui/react';
import {
  ArrowTopRightOnSquareIcon,
  Bars3Icon,
  BellIcon,
  BriefcaseIcon,
  BuildingOffice2Icon,
  EnvelopeOpenIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
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
import useInboxPreview from '../hooks/useInboxPreview.js';
import { NavigationThemeProvider, darkNavigationTheme, lightNavigationTheme } from '../context/NavigationThemeContext.jsx';
import usePrefersDarkMode from '../hooks/usePrefersDarkMode.js';
import { classNames } from '../utils/classNames.js';
import { getInitials } from '../utils/names.js';

function UserMenu({ session, onLogout }) {
  const initials = getInitials(session?.name ?? session?.email ?? 'GV');
  const memberships = Array.isArray(session?.memberships) ? session.memberships : [];

  return (
    <Menu as="div" className="relative">
      <Menu.Button className="flex items-center gap-3 rounded-full border border-slate-200/80 bg-white px-3 py-1.5 text-left text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900">
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

function InboxPreview({ session, isAuthenticated }) {
  const { threads, loading, error, refresh } = useInboxPreview({
    limit: 3,
    pollInterval: 60_000,
    session,
    isAuthenticated,
  });

  const hasThreads = threads.length > 0;

  const handleRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  return (
    <Menu as="div" className="relative hidden lg:block">
      <Menu.Button
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-white/90 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        aria-busy={loading}
      >
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
        <Menu.Items className="absolute right-0 z-50 mt-3 w-80 origin-top-right space-y-3 rounded-3xl border border-slate-200/80 bg-white/95 p-4 text-sm shadow-xl focus:outline-none">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Latest messages</p>
            <Link to="/inbox" className="text-xs font-semibold text-accent hover:text-accentDark">
              Open inbox ↗
            </Link>
          </div>
          {error ? (
            <div className="space-y-2">
              <div className="flex items-start gap-3 rounded-2xl border border-rose-200/80 bg-rose-50/80 px-3 py-2 text-xs text-rose-600">
                <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
                <p>{error}</p>
              </div>
              <button
                type="button"
                onClick={handleRefresh}
                className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
              >
                Retry
              </button>
            </div>
          ) : null}
          {loading ? (
            <div className="space-y-2" role="status" aria-live="polite">
              {[0, 1, 2].map((index) => (
                <div
                  // eslint-disable-next-line react/no-array-index-key
                  key={index}
                  className="animate-pulse rounded-2xl border border-slate-200/80 bg-white/70 px-3 py-3"
                >
                  <div className="h-3 w-2/3 rounded-full bg-slate-200/70" />
                  <div className="mt-2 h-3 w-full rounded-full bg-slate-200/70" />
                  <div className="mt-2 h-2 w-24 rounded-full bg-slate-200/70" />
                </div>
              ))}
            </div>
          ) : null}
          {!loading && !error && hasThreads
            ? threads.map((thread) => (
                <Menu.Item key={thread.id}>
                  {({ active }) => (
                    <Link
                      to="/inbox"
                      className={classNames(
                        'group block rounded-2xl border px-3 py-2 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
                        active
                          ? 'border-accent bg-accentSoft/70 text-slate-900 shadow-soft'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-white/95 hover:text-slate-900',
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-semibold text-slate-900 group-hover:text-slate-900">
                          {thread.title}
                        </p>
                        {thread.unreadCount > 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-white">
                            <EnvelopeOpenIcon className="h-3.5 w-3.5" aria-hidden="true" />
                            {thread.unreadCount}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-xs text-slate-500 line-clamp-2">{thread.snippet}</p>
                      <p className="mt-2 text-[0.65rem] uppercase tracking-wide text-slate-400">
                        {formatRelativeTime(thread.updatedAt)}
                      </p>
                    </Link>
                  )}
                </Menu.Item>
              ))
            : null}
          {!loading && !error && !hasThreads ? (
            <p className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-xs text-slate-500">
              You're all caught up. New conversations will appear here as soon as they arrive.
            </p>
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
  const prefersDarkMode = usePrefersDarkMode();

  const navigationTheme = useMemo(
    () => (prefersDarkMode ? darkNavigationTheme : lightNavigationTheme),
    [prefersDarkMode],
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleKey = resolvePrimaryRoleKey(session);
  const primaryNavigation = useMemo(() => resolvePrimaryNavigation(session), [session]);
  const roleOptions = useMemo(() => buildRoleOptions(session), [session]);

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
    <NavigationThemeProvider value={navigationTheme}>
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
        panelId="gigvora-mobile-navigation"
      />
      <div className="mx-auto flex w-full items-center gap-3 px-4 py-3 sm:h-20 sm:gap-4 sm:px-6 sm:py-0 lg:px-8">
        <div className="flex items-center gap-3 lg:flex-1">
          <button
            type="button"
            onClick={openNav}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-white hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white lg:hidden"
            aria-expanded={navOpen}
            aria-controls="gigvora-mobile-navigation"
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
                      'inline-flex items-center gap-2 rounded-full border px-4 py-2 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
                      isActive
                        ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                        : 'border-transparent text-slate-600 hover:border-slate-300 hover:bg-slate-100/80 hover:text-slate-900',
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
              className="hidden items-center gap-1 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 transition hover:border-slate-300 hover:text-slate-900 lg:inline-flex"
            >
              <ArrowTopRightOnSquareIcon className="h-4 w-4" />
              Demo tour
            </Link>
          ) : null}
          {isAuthenticated ? <InboxPreview session={session} isAuthenticated={isAuthenticated} /> : null}
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
                className="rounded-full border border-slate-200/80 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
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
    </NavigationThemeProvider>
  );
}
