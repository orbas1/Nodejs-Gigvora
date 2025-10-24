import { Dialog, Transition } from '@headlessui/react';
import PropTypes from 'prop-types';
import { Fragment, useMemo } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { SparklesIcon } from '@heroicons/react/24/outline';
import LanguageSelector from '../LanguageSelector.jsx';
import RoleSwitcher from './RoleSwitcher.jsx';
import { classNames } from '../../utils/classNames.js';

export default function MobileNavigation({
  open,
  onClose,
  isAuthenticated,
  primaryNavigation,
  marketingLinks,
  onLogout,
  roleOptions,
  currentRoleKey,
  panelId,
}) {
  const resolvedMarketingLinks = useMemo(() => marketingLinks ?? [], [marketingLinks]);
  const resolvedPrimaryNavigation = useMemo(() => primaryNavigation ?? [], [primaryNavigation]);

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
          <Dialog.Panel
            id={panelId}
            className="fixed inset-y-0 left-0 flex w-[min(22rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-r-3xl border border-slate-200/80 bg-white/95 p-4 shadow-2xl"
          >
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
                  {roleOptions?.length ? (
                    <RoleSwitcher options={roleOptions} currentKey={currentRoleKey} onSelect={onClose} />
                  ) : null}
                  <nav className="space-y-2">
                    {resolvedPrimaryNavigation.map((item) => (
                      <NavLink
                        key={item.id}
                        to={item.to}
                        onClick={onClose}
                        className={({ isActive }) =>
                          classNames(
                            'flex items-center justify-between rounded-2xl border px-3 py-2 text-sm font-medium transition',
                            isActive ? 'border-slate-900 bg-slate-900 text-white shadow-sm' : 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-white hover:text-slate-900',
                          )
                        }
                      >
                        <span>{item.label}</span>
                        {item.badge ? (
                          <span className="rounded-full bg-slate-900/90 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-white">
                            {item.badge}
                          </span>
                        ) : null}
                      </NavLink>
                    ))}
                  </nav>
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
                  <nav className="space-y-2">
                    {resolvedMarketingLinks.map((item) => (
                      <Link
                        key={item.id}
                        to={item.to}
                        onClick={onClose}
                        className="block rounded-2xl px-3 py-2 transition hover:bg-slate-100 hover:text-slate-900"
                      >
                        <p className="font-semibold text-slate-800">{item.label}</p>
                        <p className="text-xs text-slate-500">{item.description}</p>
                      </Link>
                    ))}
                  </nav>
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
              <LanguageSelector variant="mobile" />
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
  primaryNavigation: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      to: PropTypes.string.isRequired,
      badge: PropTypes.string,
    }),
  ).isRequired,
  marketingLinks: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      to: PropTypes.string.isRequired,
    }),
  ),
  onLogout: PropTypes.func,
  roleOptions: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      to: PropTypes.string.isRequired,
    }),
  ),
  currentRoleKey: PropTypes.string,
  panelId: PropTypes.string,
};

MobileNavigation.defaultProps = {
  marketingLinks: [],
  onLogout: undefined,
  roleOptions: [],
  currentRoleKey: undefined,
  panelId: undefined,
};
