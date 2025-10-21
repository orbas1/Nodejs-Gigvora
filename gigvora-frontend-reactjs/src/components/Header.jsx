import { Fragment, useMemo } from 'react';
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
import {
  marketingNavigation,
  resolvePrimaryNavigation,
  buildRoleOptions,
  resolvePrimaryRoleKey,
} from '../constants/navigation.js';
import { formatRelativeTime } from '../utils/date.js';

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

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const INBOX_PREVIEW_THREADS = [
  {
    id: 'thread-impact-ops',
    title: 'Impact Ops · Volunteer mission intake',
    snippet: 'Mae: “We have 4 new mission briefs ready for mentors. Need allocation today.”',
    updatedAt: '2024-05-21T15:40:00Z',
  },
  {
    id: 'thread-mentor-guild',
    title: 'Mentor Guild Lounge',
    snippet: 'Linh: “Dropped the new growth sprint template — keen for feedback.”',
    updatedAt: '2024-05-21T12:10:00Z',
  },
  {
    id: 'thread-support',
    title: 'Support · Chatwoot desk',
    snippet: 'Helena: “Your help centre access has been upgraded to steward tier.”',
    updatedAt: '2024-05-20T18:05:00Z',
  },
];

function InboxPreview() {
  return (
    <Menu as="div" className="relative hidden lg:block">
      <Menu.Button className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-accent hover:text-accent">
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
          {INBOX_PREVIEW_THREADS.map((thread) => (
            <Menu.Item key={thread.id}>
              {({ active }) => (
                <Link
                  to="/inbox"
                  className={classNames(
                    'block rounded-2xl border px-3 py-2 transition',
                    active
                      ? 'border-accent bg-accentSoft/70 text-slate-900 shadow-soft'
                      : 'border-slate-200 bg-white text-slate-600',
                  )}
                >
                  <p className="text-sm font-semibold text-slate-900">{thread.title}</p>
                  <p className="mt-1 text-xs text-slate-500 line-clamp-2">{thread.snippet}</p>
                  <p className="mt-2 text-[0.65rem] uppercase tracking-wide text-slate-400">
                    {formatRelativeTime(thread.updatedAt)}
                  </p>
                </Link>
              )}
            </Menu.Item>
          ))}
        </Menu.Items>
      </Transition>
    </Menu>
  );
}

export default function Header() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { session, isAuthenticated, logout } = useSession();

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
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex flex-wrap items-center gap-3 px-4 py-3 sm:h-20 sm:flex-nowrap sm:gap-4 sm:px-6 sm:py-0 lg:px-8">
        <div className="flex items-center gap-3">
          <Menu as="div" className="relative lg:hidden">
            <Menu.Button className="inline-flex shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white/95 p-2 text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900">
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
              <Menu.Items className="absolute left-0 z-50 mt-3 w-72 origin-top-left space-y-1 rounded-3xl border border-slate-200/80 bg-white/95 p-3 text-sm shadow-xl focus:outline-none">
                {isAuthenticated ? (
                  primaryNavigation.map((item) => {
                    const Icon = iconMap[item.id] ?? Squares2X2Icon;
                    return (
                      <Menu.Item key={item.id}>
                        {({ active }) => (
                          <NavLink
                            to={item.to}
                            className={({ isActive }) =>
                              classNames(
                                'flex items-center gap-3 rounded-2xl px-3 py-2 font-medium transition',
                                isActive
                                  ? 'bg-slate-900 text-white shadow-sm'
                                  : active
                                    ? 'bg-slate-100 text-slate-900'
                                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                              )
                            }
                          >
                            <Icon className="h-4 w-4" />
                            {item.label}
                          </NavLink>
                        )}
                      </Menu.Item>
                    );
                  })
                ) : (
                  marketingLinks.map((item) => (
                    <Menu.Item key={item.id}>
                      {({ active }) => (
                        <Link
                          to={item.to}
                          className={classNames(
                            'block rounded-2xl px-3 py-2 transition',
                            active ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                          )}
                        >
                          <p className="font-semibold">{item.label}</p>
                          <p className="text-xs text-slate-500">{item.description}</p>
                        </Link>
                      )}
                    </Menu.Item>
                  ))
                )}
                <div className="space-y-3 border-t border-slate-200/70 pt-3">
                  <LanguageSelector variant="mobile" />
                  {isAuthenticated ? (
                    <div className="grid gap-2">
                      <Link
                        to="/dashboard/user/creation-studio"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accentDark"
                      >
                        <SparklesIcon className="h-4 w-4" />
                        Launch Creation Studio
                      </Link>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="inline-flex w-full items-center justify-center rounded-full border border-slate-200/80 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                      >
                        Log out
                      </button>
                    </div>
                  ) : (
                    <div className="grid gap-2">
                      <Link
                        to="/login"
                        className="inline-flex w-full items-center justify-center rounded-full border border-slate-200/80 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white hover:text-slate-900"
                      >
                        {t('header.login', 'Log in')}
                      </Link>
                      <Link
                        to="/register"
                        className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
                      >
                        {t('header.join', 'Join')}
                      </Link>
                    </div>
                  )}
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
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
              className="hidden items-center gap-1 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 transition hover:border-slate-300 hover:text-slate-900 lg:inline-flex"
            >
              <ArrowTopRightOnSquareIcon className="h-4 w-4" />
              Demo tour
            </Link>
          ) : null}
          {isAuthenticated ? <InboxPreview /> : null}
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
  );
}
