import { Fragment, useMemo } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, Transition } from '@headlessui/react';
import {
  Bars3Icon,
  BellIcon,
  BuildingStorefrontIcon,
  ChatBubbleLeftRightIcon,
  HomeIcon,
  RssIcon,
  SparklesIcon,
  Squares2X2Icon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { LOGO_URL } from '../constants/branding.js';
import useSession from '../hooks/useSession.js';
import { useLanguage } from '../context/LanguageContext.jsx';
import LanguageSelector from './LanguageSelector.jsx';

function resolveInitials(name = '') {
  const source = name.trim();
  if (!source) {
    return 'GV';
  }
  return source
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .join('')
    .slice(0, 2);
}

function UserMenu({ session, onLogout }) {
  const initials = resolveInitials(session?.name ?? session?.email ?? 'GV');
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

function resolveDashboardPath(session) {
  const raw =
    (session?.primaryDashboard || session?.primaryMembership || session?.memberships?.[0] || session?.userType || 'user')
      ?.toString()
      .toLowerCase();
  const mapping = {
    user: 'user',
    freelancer: 'freelancer',
    agency: 'agency',
    company: 'company',
    headhunter: 'headhunter',
    mentor: 'mentor',
    launchpad: 'launchpad',
    admin: 'admin',
  };
  const resolved = mapping[raw] ?? 'user';
  return `/dashboard/${resolved}`;
}

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function Header() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { session, isAuthenticated, logout } = useSession();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const dashboardPath = resolveDashboardPath(session);

  const navigationItems = useMemo(
    () =>
      [
        { id: 'feed', label: 'Live feed', to: '/feed', icon: RssIcon },
        { id: 'explorer', label: 'Explorer', to: '/search', icon: Squares2X2Icon },
        { id: 'dashboard', label: 'Dashboard', to: dashboardPath, icon: HomeIcon },
        { id: 'studio', label: 'Studio', to: '/dashboard/user/creation-studio', icon: SparklesIcon },
        { id: 'shopfronts', label: 'Shopfronts', to: '/pages', icon: BuildingStorefrontIcon },
        { id: 'messages', label: 'Messages', to: '/inbox', icon: ChatBubbleLeftRightIcon },
        { id: 'notifications', label: 'Notifications', to: '/notifications', icon: BellIcon },
        { id: 'profile', label: 'Profile', to: '/profile/me', icon: UserCircleIcon },
      ],
    [dashboardPath],
  );

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <Menu as="div" className="relative lg:hidden">
              <Menu.Button className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900">
                <span className="sr-only">Open navigation</span>
                <Bars3Icon className="h-5 w-5" />
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
                <Menu.Items className="absolute left-0 z-50 mt-3 w-64 origin-top-left space-y-1 rounded-3xl border border-slate-200/80 bg-white p-2 text-sm shadow-xl focus:outline-none">
                  {navigationItems.map((item) => (
                    <Menu.Item key={item.id}>
                      {({ active }) => (
                        <NavLink
                          to={item.to}
                          className={({ isActive }) =>
                            classNames(
                              'flex items-center gap-2 rounded-2xl px-3 py-2 font-medium transition',
                              isActive
                                ? 'bg-slate-900 text-white shadow-sm'
                                : active
                                  ? 'bg-slate-100 text-slate-900'
                                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                            )
                          }
                        >
                          <item.icon className="h-4 w-4" />
                          {item.label}
                        </NavLink>
                      )}
                    </Menu.Item>
                  ))}
                </Menu.Items>
              </Transition>
            </Menu>
          ) : null}
          <Link to="/" className="inline-flex items-center">
            <img src={LOGO_URL} alt="Gigvora" className="h-12 w-auto" />
          </Link>
        </div>

        {isAuthenticated ? (
          <nav className="hidden flex-1 items-center justify-center gap-1 text-sm font-medium lg:flex">
            {navigationItems.map((item) => (
              <NavLink
                key={item.id}
                to={item.to}
                className={({ isActive }) =>
                  classNames(
                    'inline-flex items-center gap-2 rounded-full border px-4 py-2 transition',
                    isActive
                      ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                      : 'border-transparent text-slate-600 hover:border-slate-300 hover:bg-white hover:text-slate-900',
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        ) : (
          <div className="flex-1" />
        )}

        <div className="ml-auto flex items-center gap-3 sm:gap-4">
          <LanguageSelector />
          {isAuthenticated ? (
            <UserMenu session={session} onLogout={handleLogout} />
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
  );
}
