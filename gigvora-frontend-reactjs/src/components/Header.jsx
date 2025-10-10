import { Link, NavLink } from 'react-router-dom';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import logo from '../assets/logo.svg';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/feed', label: 'Live Feed' },
  { to: '/search', label: 'Explorer' },
  { to: '/jobs', label: 'Jobs' },
  { to: '/gigs', label: 'Gigs' },
  { to: '/projects', label: 'Projects' },
  { to: '/experience-launchpad', label: 'Launchpad' },
  { to: '/volunteering', label: 'Volunteering' },
  { to: '/groups', label: 'Groups' },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  const navClassName = ({ isActive }) =>
    `relative px-3 py-2 text-sm font-semibold transition-colors ${
      isActive ? 'text-accent' : 'text-white/70 hover:text-white'
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo} alt="Gigvora" className="h-10 w-auto" />
          <span className="text-xl font-semibold tracking-tight">Gigvora</span>
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
        <div className="hidden items-center gap-3 md:flex">
          <Link
            to="/login"
            className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/80 transition hover:text-white"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-accent/30 transition hover:shadow-accent/40"
          >
            Join Now
          </Link>
        </div>
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="rounded-full border border-white/15 p-2 text-white md:hidden"
          aria-label="Toggle navigation"
        >
          {open ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
        </button>
      </div>
      {open && (
        <div className="border-t border-white/10 bg-slate-950/95 px-6 pb-6 md:hidden">
          <nav className="flex flex-col gap-1 py-4 text-sm font-semibold">
            {navLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `rounded-2xl px-4 py-2 transition ${
                    isActive ? 'bg-accent/20 text-accent' : 'text-white/70 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex gap-3">
            <Link
              to="/login"
              onClick={() => setOpen(false)}
              className="flex-1 rounded-full border border-white/15 px-4 py-2 text-center text-sm font-semibold text-white/80"
            >
              Login
            </Link>
            <Link
              to="/register"
              onClick={() => setOpen(false)}
              className="flex-1 rounded-full bg-accent px-4 py-2 text-center text-sm font-semibold text-slate-950"
            >
              Join Now
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
