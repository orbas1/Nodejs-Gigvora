import { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import StatusBadge from './StatusBadge.jsx';
import { formatDisplayDate } from './utils.js';

export default function HistoryDrawer({ open, onClose, history = [] }) {
  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-40" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/30" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-out duration-200"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in duration-150"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-md bg-white shadow-xl">
                  <div className="flex h-full flex-col">
                    <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                      <Dialog.Title className="text-base font-semibold text-slate-900">Review log</Dialog.Title>
                      <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                      >
                        <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                      </button>
                    </header>
                    <div className="flex-1 overflow-y-auto bg-slate-50 px-5 py-6">
                      {history.length ? (
                        <ol className="space-y-4">
                          {history.map((item) => (
                            <li key={`${item.id}-${item.updatedAt ?? item.createdAt ?? item.submittedAt ?? item.status}`}
                              className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
                            >
                              <div className="flex items-center justify-between">
                                <StatusBadge status={item.status} />
                                <span className="text-xs font-semibold text-slate-400">
                                  {formatDisplayDate(item.updatedAt ?? item.reviewedAt ?? item.createdAt)}
                                </span>
                              </div>
                              <dl className="mt-3 space-y-2 text-xs text-slate-600">
                                <div>
                                  <dt className="font-semibold text-slate-500">Submitted</dt>
                                  <dd>{formatDisplayDate(item.submittedAt)}</dd>
                                </div>
                                <div>
                                  <dt className="font-semibold text-slate-500">Reviewed</dt>
                                  <dd>{formatDisplayDate(item.reviewedAt)}</dd>
                                </div>
                                {item.reviewNotes ? (
                                  <div>
                                    <dt className="font-semibold text-slate-500">Notes</dt>
                                    <dd className="whitespace-pre-wrap text-slate-600">{item.reviewNotes}</dd>
                                  </div>
                                ) : null}
                                {item.declinedReason ? (
                                  <div>
                                    <dt className="font-semibold text-slate-500">Reason</dt>
                                    <dd className="whitespace-pre-wrap text-slate-600">{item.declinedReason}</dd>
                                  </div>
                                ) : null}
                              </dl>
                            </li>
                          ))}
                        </ol>
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <p className="text-sm font-semibold text-slate-500">No history yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

HistoryDrawer.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  history: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      status: PropTypes.string,
      reviewerId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      notes: PropTypes.string,
      createdAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
      submittedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
      reviewedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
      declinedReason: PropTypes.string,
      reviewNotes: PropTypes.string,
      updatedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    }),
  ),
};

HistoryDrawer.defaultProps = {
  open: false,
  onClose: () => {},
  history: [],
};
