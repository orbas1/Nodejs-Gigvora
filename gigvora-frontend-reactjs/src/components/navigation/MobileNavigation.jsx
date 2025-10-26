import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useMemo } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { SparklesIcon } from '@heroicons/react/24/outline';
import LanguageSelector from '../LanguageSelector.jsx';
import RoleSwitcher from './RoleSwitcher.jsx';
import MobileMegaMenu from './MobileMegaMenu.jsx';
import PrimaryNavItem from './PrimaryNavItem.jsx';
import { resolveInitials } from '../../utils/user.js';

export default function MobileNavigation({
  open,
  onClose,
  isAuthenticated,
  primaryNavigation,
  marketingNavigation,
  marketingSearch,
  onLogout,
  roleOptions,
  currentRoleKey,
  onMarketingSearch,
  session,
}) {
  const resolvedPrimaryNavigation = useMemo(() => primaryNavigation ?? [], [primaryNavigation]);
  const resolvedMarketingMenus = useMemo(() => marketingNavigation ?? [], [marketingNavigation]);
  const memberships = useMemo(() => (Array.isArray(session?.memberships) ? session.memberships : []), [session]);
  const primaryDashboard = resolvedPrimaryNavigation[0]?.to ?? '/dashboard';
  const initials = resolveInitials(session?.name ?? session?.email ?? 'GV');

  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50 lg:hidden" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/40" />
        </Transition.Child>

        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="-translate-x-full"
          enterTo="translate-x-0"
          leave="ease-in duration-150"
          leaveFrom="translate-x-0"
          leaveTo="-translate-x-full"
        >
          <Dialog.Panel className="fixed inset-y-0 left-0 flex w-[min(22rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-r-3xl border border-slate-200/80 bg-white/95 p-4 shadow-2xl">
            <div className="flex items-center justify-between px-1 pb-3">
              <Dialog.Title className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                Navigate
              </Dialog.Title>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pb-8">
              {isAuthenticated ? (
                <div className="space-y-4">
                  <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-4 shadow-sm backdrop-blur">
                    <div className="flex items-center gap-3">
                      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-base font-semibold uppercase text-white">
                        {initials}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">{session?.name ?? 'Member'}</p>
                        <p className="truncate text-xs text-slate-500">{memberships.join(' • ') || 'Gigvora network'}</p>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      <Link
                        to={primaryDashboard}
                        onClick={onClose}
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200/80 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white hover:text-slate-900"
                      >
                        <SparklesIcon className="h-4 w-4 text-accent" />
                        Dashboard overview
                      </Link>
                      <Link
                        to="/profile"
                        onClick={onClose}
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200/80 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white hover:text-slate-900"
                      >
                        View profile
                      </Link>
                    </div>
                  </div>
                  {roleOptions?.length ? (
                    <RoleSwitcher options={roleOptions} currentKey={currentRoleKey} onSelect={onClose} />
                  ) : null}
                  <nav className="space-y-2">
                    {resolvedPrimaryNavigation.map((item) => (
                      <PrimaryNavItem key={item.id} item={item} variant="mobile" onNavigate={onClose} />
                    ))}
                  </nav>
                  {resolvedMarketingMenus.length ? (
                    <div className="space-y-3 rounded-3xl border border-slate-200/80 bg-white/80 p-4 shadow-sm backdrop-blur">
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Explore Gigvora</p>
                      <MobileMegaMenu
                        menus={resolvedMarketingMenus}
                        search={marketingSearch}
                        onNavigate={onClose}
                        onSearch={(value) => {
                          onClose();
                          onMarketingSearch?.(value);
                        }}
                      />
                    </div>
                  ) : null}
                  <div className="grid gap-2">
                    <Link
                      to="/dashboard/user/creation-studio"
                      onClick={onClose}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent px-5 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-accentDark"
                    >
                      <SparklesIcon className="h-4 w-4" /> Launch Creation Studio
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onLogout?.();
                      }}
                      className="inline-flex w-full items-center justify-center rounded-full border border-slate-200/80 px-5 py-3 text-base font-semibold text-slate-700 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                    >
                      Log out
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <MobileMegaMenu
                    menus={marketingNavigation}
                    search={marketingSearch}
                    onNavigate={onClose}
                    onSearch={(value) => {
                      onClose();
                      onMarketingSearch?.(value);
                    }}
                  />
                  <div className="grid gap-2">
                    <Link
                      to="/login"
                      onClick={onClose}
                      className="inline-flex w-full items-center justify-center rounded-full border border-slate-200/80 px-5 py-3 text-base font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white hover:text-slate-900"
                    >
                      Log in
                    </Link>
                    <Link
                      to="/register"
                      onClick={onClose}
                      className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-slate-700"
                    >
                      Join
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-auto border-t border-slate-200/70 pt-4">
              <LanguageSelector variant="mobile" className="w-full" />
            </div>
          </Dialog.Panel>
        </Transition.Child>
      </Dialog>
    </Transition>
  );
}

MobileNavigation.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  isAuthenticated: PropTypes.bool.isRequired,
  primaryNavigation: PropTypes.array,
  marketingNavigation: PropTypes.array,
  marketingSearch: PropTypes.object,
  onLogout: PropTypes.func,
  roleOptions: PropTypes.array,
  currentRoleKey: PropTypes.string,
  onMarketingSearch: PropTypes.func,
  session: PropTypes.shape({
    name: PropTypes.string,
    email: PropTypes.string,
    memberships: PropTypes.arrayOf(PropTypes.string),
  }),
};

MobileNavigation.defaultProps = {
  primaryNavigation: [],
  marketingNavigation: [],
  marketingSearch: null,
  onLogout: undefined,
  roleOptions: [],
  currentRoleKey: 'user',
  onMarketingSearch: undefined,
  session: null,
};
