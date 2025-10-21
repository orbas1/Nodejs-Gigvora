import { Dialog, Transition } from '@headlessui/react';
import PropTypes from 'prop-types';
import { Fragment } from 'react';

function initials(value) {
  return value
    .toString()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .join('')
    .slice(0, 2) || 'GV';
}

export default function FollowersDialog({ open, followers = [], onClose }) {
  const safeFollowers = Array.isArray(followers) ? followers : [];
  const handleClose = typeof onClose === 'function' ? onClose : () => {};

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-40" onClose={handleClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-slate-900/40" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-3xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                  <Dialog.Title className="text-lg font-semibold text-slate-900">Followers</Dialog.Title>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="rounded-full border border-slate-200 px-4 py-1.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
                  >
                    Close
                  </button>
                </div>
                <div className="max-h-[60vh] overflow-y-auto px-6 py-6">
                  <ul className="space-y-3">
                    {safeFollowers.length === 0 ? (
                      <li className="rounded-3xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-400">
                        No followers yet
                      </li>
                    ) : (
                      safeFollowers.map((follower) => (
                        <li
                          key={follower.id || follower.email || follower.name}
                          className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                        >
                          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
                            {follower.initials || initials(follower.name || follower.email || '')}
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{follower.name || follower.email || 'Follower'}</p>
                            {follower.headline || follower.location?.summary ? (
                              <p className="text-xs text-slate-500">
                                {follower.headline || follower.location?.summary}
                              </p>
                            ) : null}
                          </div>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

FollowersDialog.propTypes = {
  open: PropTypes.bool,
  followers: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      email: PropTypes.string,
      name: PropTypes.string,
      initials: PropTypes.string,
      headline: PropTypes.string,
      location: PropTypes.shape({
        summary: PropTypes.string,
      }),
    }),
  ),
  onClose: PropTypes.func,
};

FollowersDialog.defaultProps = {
  open: false,
  followers: [],
  onClose: () => {},
};
