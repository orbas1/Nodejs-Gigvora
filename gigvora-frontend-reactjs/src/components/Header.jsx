import { Fragment, useMemo, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Bars3Icon,
  BellIcon,
  ChatBubbleLeftRightIcon,
  ChevronDownIcon,
  LifebuoyIcon,
  PowerIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import { LOGO_URL } from '../constants/branding.js';
import UserAvatar from './UserAvatar.jsx';
import { DASHBOARD_LINKS } from '../constants/dashboardLinks.js';
import useSession from '../hooks/useSession.js';
import useNotificationCenter from '../hooks/useNotificationCenter.js';
import { formatRelativeTime } from '../utils/date.js';
import { hasFinanceOperationsAccess } from '../utils/permissions.js';

const AUTHENTICATED_NAV_LINKS = [
  { to: '/feed', label: 'Live Feed' },
  { to: '/search', label: 'Explorer' },
  { to: '/pages', label: 'Pages' },
  { to: '/mentors', label: 'Mentors' },
  { to: '/inbox', label: 'Inbox' },
];

function NotificationMenu({
  notifications = [],
  unreadCount = 0,
  onMarkAll,
  onMarkSingle,
}) {
  const topNotifications = notifications.slice(0, 6);

  return (
    <Menu as="div" className="relative">
      <Menu.Button
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-accent/60 hover:text-accent"
        aria-label="Open notifications"
      >
        <BellIcon className="h-5 w-5" />
        {unreadCount ? (
          <span className="absolute -top-1 -right-1 inline-flex min-h-[1.4rem] min-w-[1.4rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[0.65rem] font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </Menu.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-150"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-100"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-50 mt-3 w-80 origin-top-right rounded-3xl border border-slate-200/70 bg-white p-3 text-sm shadow-2xl focus:outline-none">
          <div className="flex items-center justify-between px-2 py-1">
            <p className="text-sm font-semibold text-slate-800">Notifications</p>
            {unreadCount ? (
              <button
                type="button"
                onClick={onMarkAll}
                className="text-xs font-semibold text-accent hover:text-accentDark"
              >
                Mark all read
              </button>
            ) : null}
          </div>
          <ul className="mt-2 space-y-2">
            {topNotifications.length ? (
              topNotifications.map((notification) => (
                <Menu.Item key={notification.id}>
                  {({ active }) => (
                    <button
                      type="button"
                      onClick={() => {
                        onMarkSingle(notification.id);
                        if (notification?.action?.href) {
                          window.location.assign(notification.action.href);
                        }
                      }}
                      className={`w-full rounded-2xl border px-3 py-2 text-left transition ${
                        active ? 'border-accent/40 bg-accentSoft text-slate-800' : 'border-slate-200 text-slate-600'
                      } ${notification.read ? '' : 'border-accent/40 bg-accentSoft text-slate-800'}`}
                    >
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {notification.type}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{notification.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{formatRelativeTime(notification.timestamp)}</p>
                    </button>
                  )}
                </Menu.Item>
              ))
            ) : (
              <li className="rounded-2xl border border-dashed border-slate-200 p-4 text-xs text-slate-500">
                You’re all caught up.
              </li>
            )}
          </ul>
          <div className="mt-3 flex justify-center">
            <Link
              to="/notifications"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
            >
              Open notification centre
            </Link>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}

function MessageMenu({ threads = [], unreadCount = 0, onMarkAll, onMarkSingle }) {
  const topThreads = threads.slice(0, 5);

  return (
    <Menu as="div" className="relative">
      <Menu.Button
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-accent/60 hover:text-accent"
        aria-label="Open messages"
      >
        <ChatBubbleLeftRightIcon className="h-5 w-5" />
        {unreadCount ? (
          <span className="absolute -top-1 -right-1 inline-flex min-h-[1.4rem] min-w-[1.4rem] items-center justify-center rounded-full bg-emerald-500 px-1 text-[0.65rem] font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </Menu.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-150"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-100"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-50 mt-3 w-80 origin-top-right rounded-3xl border border-slate-200/70 bg-white p-3 text-sm shadow-2xl focus:outline-none">
          <div className="flex items-center justify-between px-2 py-1">
            <p className="text-sm font-semibold text-slate-800">Messages</p>
            {unreadCount ? (
              <button
                type="button"
                onClick={onMarkAll}
                className="text-xs font-semibold text-accent hover:text-accentDark"
              >
                Mark all read
              </button>
            ) : null}
          </div>
          <ul className="mt-2 space-y-2">
            {topThreads.length ? (
              topThreads.map((thread) => (
                <Menu.Item key={thread.id}>
                  {({ active }) => (
                    <button
                      type="button"
                      onClick={() => {
                        onMarkSingle(thread.id);
                        if (thread?.route) {
                          window.location.assign(thread.route);
                        }
                      }}
                      className={`w-full rounded-2xl border px-3 py-2 text-left transition ${
                        active ? 'border-accent/40 bg-accentSoft text-slate-800' : 'border-slate-200 text-slate-600'
                      } ${thread.unread ? 'border-emerald-400/60 bg-emerald-50 text-slate-800' : ''}`}
                    >
                      <p className="text-sm font-semibold text-slate-900">{thread.sender}</p>
                      <p className="mt-1 text-xs text-slate-500">{thread.preview}</p>
                      <p className="mt-1 text-xs text-slate-400">{formatRelativeTime(thread.timestamp)}</p>
                    </button>
                  )}
                </Menu.Item>
              ))
            ) : (
              <li className="rounded-2xl border border-dashed border-slate-200 p-4 text-xs text-slate-500">
                Inbox is clear.
              </li>
            )}
          </ul>
          <div className="mt-3 flex justify-center">
            <Link
              to="/inbox"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
            >
              Open inbox
            </Link>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function Header() {
  const [open, setOpen] = useState(false);
  const { session, isAuthenticated, logout } = useSession();
  const navigate = useNavigate();
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

  const dashboardTarget = useMemo(() => {
    if (!isAuthenticated) {
      return null;
    }
    const primaryKey = session?.primaryDashboard ?? session?.memberships?.[0];
    if (primaryKey && DASHBOARD_LINKS[primaryKey]) {
      return DASHBOARD_LINKS[primaryKey];
    }

    return DASHBOARD_LINKS.user;
  }, [isAuthenticated, session?.memberships, session?.primaryDashboard]);

  const membershipLabels = useMemo(() => {
    if (!isAuthenticated) {
      return [];
    }

    return (session?.memberships ?? [])
      .map((key) => DASHBOARD_LINKS[key]?.label)
      .filter(Boolean);
  }, [isAuthenticated, session?.memberships]);

  const sessionSubtitle = useMemo(() => {
    if (!isAuthenticated) {
      return null;
    }

    if (membershipLabels.length > 1) {
      return membershipLabels.join(' • ');
    }

    return membershipLabels[0] ?? session?.title ?? null;
  }, [isAuthenticated, membershipLabels, session?.title]);

  const financeAccess = useMemo(() => hasFinanceOperationsAccess(session), [session]);

  const navClassName = ({ isActive }) =>
    `relative px-3 py-2 text-sm font-semibold transition-colors ${
      isActive ? 'text-accent' : 'text-slate-500 hover:text-slate-900'
    }`;

  const closeMobileNav = () => setOpen(false);

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const renderUserMenu = () => (
    <Menu as="div" className="relative">
      <Menu.Button className="flex items-center gap-2 rounded-full border border-transparent px-1 py-1 text-left transition hover:border-accent/40">
        <UserAvatar
          name={session?.name}
          seed={session?.avatarSeed ?? session?.name}
          size="sm"
          className="ring-2 ring-accent/30"
        />
        <ChevronDownIcon className="h-4 w-4 text-slate-400" />
      </Menu.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-150"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-100"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-50 mt-3 w-60 origin-top-right rounded-3xl border border-slate-200/70 bg-white p-2 shadow-2xl focus:outline-none">
          <div className="px-3 py-2">
            <p className="text-sm font-semibold text-slate-800">{session?.name ?? 'Member'}</p>
            {sessionSubtitle ? <p className="text-xs text-slate-500">{sessionSubtitle}</p> : null}
          </div>
          <Menu.Item>
            {({ active }) => (
              <Link
                to="/settings"
                className={classNames(
                  'flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium transition',
                  active ? 'bg-accentSoft text-accent' : 'text-slate-600',
                )}
              >
                Settings
              </Link>
            )}
          </Menu.Item>
          {financeAccess ? (
            <>
              <Menu.Item>
                {({ active }) => (
                  <Link
                    to="/finance"
                    className={classNames(
                      'flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium transition',
                      active ? 'bg-accentSoft text-accent' : 'text-slate-600',
                    )}
                  >
                    Financial hub
                  </Link>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <Link
                    to="/trust-center"
                    className={classNames(
                      'flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium transition',
                      active ? 'bg-accentSoft text-accent' : 'text-slate-600',
                    )}
                  >
                    Trust centre
                  </Link>
                )}
              </Menu.Item>
            </>
          ) : null}
          <Menu.Item>
            {({ active }) => (
              <a
                href="https://support.gigvora.com"
                target="_blank"
                rel="noreferrer"
                className={classNames(
                  'flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium transition',
                  active ? 'bg-accentSoft text-accent' : 'text-slate-600',
                )}
              >
                <LifebuoyIcon className="h-4 w-4" /> Support centre
              </a>
            )}
          </Menu.Item>
          <Menu.Item>
            {({ active }) => (
              <button
                type="button"
                onClick={handleLogout}
                className={classNames(
                  'flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm font-medium transition',
                  active ? 'bg-rose-50 text-rose-600' : 'text-rose-500',
                )}
              >
                <PowerIcon className="h-4 w-4" /> Logout
              </button>
            )}
          </Menu.Item>
        </Menu.Items>
      </Transition>
    </Menu>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center">
          <img src={LOGO_URL} alt="Gigvora" className="h-12 w-auto" />
        </Link>
        {isAuthenticated ? (
          <nav className="hidden items-center gap-1 md:flex">
            {AUTHENTICATED_NAV_LINKS.map((item) => (
              <NavLink key={item.to} to={item.to} className={navClassName}>
                {({ isActive }) => (
                  <span className="relative inline-flex items-center">
                    {item.label}
                    <span
                      className={`absolute -bottom-1 left-0 h-0.5 w-full transform rounded-full transition-all duration-300 ${
                        isActive ? 'scale-100 bg-accent' : 'scale-0 bg-transparent'
                      }`}
                    />
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
        ) : null}
        <div className="hidden items-center gap-4 md:flex">
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <NotificationMenu
                notifications={notifications}
                unreadCount={unreadNotificationCount}
                onMarkAll={markAllNotificationsAsRead}
                onMarkSingle={markNotificationAsRead}
              />
              <MessageMenu
                threads={messageThreads}
                unreadCount={unreadMessageCount}
                onMarkAll={markAllThreadsAsRead}
                onMarkSingle={markThreadAsRead}
              />
            </div>
          ) : null}
          {isAuthenticated && dashboardTarget ? (
            <>
              <div className="hidden text-right lg:block">
                <p className="text-sm font-semibold text-slate-700">{session.name}</p>
                {sessionSubtitle ? (
                  <p className="text-xs text-slate-500">{sessionSubtitle}</p>
                ) : null}
              </div>
              <Link
                to={dashboardTarget.path}
                className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark"
              >
                Dashboard
              </Link>
              {renderUserMenu()}
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-accent/60 hover:text-accent"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark"
              >
                Join Now
              </Link>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="rounded-full border border-slate-200 p-2 text-slate-600 md:hidden"
          aria-label="Toggle navigation"
        >
          {open ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
        </button>
      </div>
      {open && (
        <div className="border-t border-slate-200 bg-white px-6 pb-6 md:hidden">
          {isAuthenticated ? (
            <>
              <div className="flex items-center justify-between gap-3 py-4">
                <Link
                  to="/notifications"
                  onClick={closeMobileNav}
                  className="flex flex-1 items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-accent hover:text-accent"
                >
                  Notifications
                  <span className="inline-flex min-h-[1.5rem] min-w-[1.5rem] items-center justify-center rounded-full bg-rose-500 px-2 text-xs font-semibold text-white">
                    {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                  </span>
                </Link>
                <Link
                  to="/inbox"
                  onClick={closeMobileNav}
                  className="flex flex-1 items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-accent hover:text-accent"
                >
                  Messages
                  <span className="inline-flex min-h-[1.5rem] min-w-[1.5rem] items-center justify-center rounded-full bg-emerald-500 px-2 text-xs font-semibold text-white">
                    {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                  </span>
                </Link>
              </div>
              <nav className="flex flex-col gap-1 py-4 text-sm font-semibold">
                {AUTHENTICATED_NAV_LINKS.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={closeMobileNav}
                    className={({ isActive }) =>
                      `rounded-2xl px-4 py-2 transition ${
                        isActive ? 'bg-accentSoft text-accent' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>
              {dashboardTarget ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-slate-50 px-4 py-3">
                    <UserAvatar name={session?.name} seed={session?.avatarSeed ?? session?.name} size="xs" showGlow={false} />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-800">{session?.name}</p>
                      {sessionSubtitle ? <p className="text-xs text-slate-500">{sessionSubtitle}</p> : null}
                    </div>
                    <Link
                      to={dashboardTarget.path}
                      onClick={closeMobileNav}
                      className="rounded-full bg-accent px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white"
                    >
                      Dashboard
                    </Link>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      closeMobileNav();
                      handleLogout();
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-100 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:border-rose-200 hover:bg-rose-50"
                  >
                    <PowerIcon className="h-4 w-4" /> Logout
                  </button>
                </div>
              ) : null}
            </>
          ) : (
            <div className="flex gap-3 py-4">
              <Link
                to="/login"
                onClick={closeMobileNav}
                className="flex-1 rounded-full border border-slate-200 px-4 py-2 text-center text-sm font-semibold text-slate-600"
              >
                Login
              </Link>
              <Link
                to="/register"
                onClick={closeMobileNav}
                className="flex-1 rounded-full bg-accent px-4 py-2 text-center text-sm font-semibold text-white"
              >
                Join Now
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
