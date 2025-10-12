import { Link, NavLink } from 'react-router-dom';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { useMemo, useState } from 'react';
import { LOGO_URL } from '../constants/branding.js';
import UserAvatar from './UserAvatar.jsx';
import { DASHBOARD_LINKS } from '../constants/dashboardLinks.js';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/feed', label: 'Live Feed' },
  { to: '/search', label: 'Explorer' },
  { to: '/jobs', label: 'Jobs' },
  { to: '/gigs', label: 'Gigs' },
  { to: '/projects', label: 'Projects' },
  { to: '/projects/new', label: 'Launch Project' },
  { to: '/experience-launchpad', label: 'Launchpad' },
  { to: '/volunteering', label: 'Volunteering' },
  { to: '/groups', label: 'Groups' },
  { to: '/auto-assign', label: 'Auto-Assign' },
  { to: '/trust-center', label: 'Trust Center' },
];

const MOCK_SESSION = {
  isAuthenticated: true,
  name: 'Lena Fields',
  title: 'Product Designer',
  avatarSeed: 'Lena Fields',
  memberships: ['user', 'freelancer', 'agency'],
  primaryDashboard: 'user',
};

export default function Header() {
  const [open, setOpen] = useState(false);
  const session = MOCK_SESSION;
  const isAuthenticated = Boolean(session?.isAuthenticated);

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

  const navClassName = ({ isActive }) =>
    `relative px-3 py-2 text-sm font-semibold transition-colors ${
      isActive ? 'text-accent' : 'text-slate-500 hover:text-slate-900'
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center">
          <img src={LOGO_URL} alt="Gigvora" className="h-12 w-auto" />
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((item) => (
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
        <div className="hidden items-center gap-4 md:flex">
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
              <Link to="/profile/me" className="block rounded-full border border-transparent transition hover:border-accent/40">
                <UserAvatar
                  name={session.name}
                  seed={session.avatarSeed}
                  size="sm"
                  className="ring-2 ring-accent/30"
                />
              </Link>
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
          <nav className="flex flex-col gap-1 py-4 text-sm font-semibold">
            {navLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
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
          {isAuthenticated && dashboardTarget ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-slate-50 px-4 py-3">
                <UserAvatar name={session.name} seed={session.avatarSeed} size="xs" showGlow={false} />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800">{session.name}</p>
                  {sessionSubtitle ? (
                    <p className="text-xs text-slate-500">{sessionSubtitle}</p>
                  ) : null}
                </div>
                <Link
                  to={dashboardTarget.path}
                  onClick={() => setOpen(false)}
                  className="rounded-full bg-accent px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white"
                >
                  Dashboard
                </Link>
              </div>
              <Link
                to="/profile/me"
                onClick={() => setOpen(false)}
                className="block rounded-2xl border border-slate-200/70 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-accent/40 hover:text-accent"
              >
                View Profile
              </Link>
            </div>
          ) : (
            <div className="flex gap-3">
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-full border border-slate-200 px-4 py-2 text-center text-sm font-semibold text-slate-600"
              >
                Login
              </Link>
              <Link
                to="/register"
                onClick={() => setOpen(false)}
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
