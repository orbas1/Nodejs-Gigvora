import { Fragment, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';
import {
  ArrowTopRightOnSquareIcon,
  BellAlertIcon,
  ClockIcon,
  PencilSquareIcon,
  PlayCircleIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { formatAbsolute, formatRelativeTime } from '../../../../utils/date.js';

function formatLabel(value) {
  if (!value) return null;
  const text = `${value}`.trim();
  return text ? text : null;
}

function renderChips(values) {
  if (!Array.isArray(values) || !values.length) {
    return null;
  }
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {values.slice(0, 12).map((value) => (
        <span
          key={value}
          className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600"
        >
          {value}
        </span>
      ))}
    </div>
  );
}

export default function TopSearchDetailDrawer({ open, search, onClose, onOpen, onRun, onEdit, onDelete }) {
  const schedule = useMemo(() => {
    if (!search) return null;
    return {
      last: search.lastTriggeredAt ? formatRelativeTime(search.lastTriggeredAt) : 'Never',
      next: search.nextRunAt ? formatAbsolute(search.nextRunAt) : 'Not scheduled',
    };
  }, [search]);

  const frequency = useMemo(() => {
    if (!search?.frequency) return 'Daily';
    const normalised = `${search.frequency}`.toLowerCase();
    if (normalised === 'immediate') return 'Immediate';
    if (normalised === 'weekly') return 'Weekly';
    return 'Daily';
  }, [search]);

  const canNotifyEmail = search?.notifyByEmail;
  const canNotifyInApp = search?.notifyInApp;

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 flex justify-end">
            <Transition.Child
              as={Fragment}
              enter="transform transition ease-in-out duration-300"
              enterFrom="translate-x-full"
              enterTo="translate-x-0"
              leave="transform transition ease-in-out duration-200"
              leaveFrom="translate-x-0"
              leaveTo="translate-x-full"
            >
              <Dialog.Panel className="w-full max-w-xl border-l border-slate-200 bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                  <div>
                    <Dialog.Title className="text-lg font-semibold text-slate-900">{search?.name ?? 'Search'}</Dialog.Title>
                    {formatLabel(search?.query) ? (
                      <p className="text-sm text-slate-500">{search.query}</p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                  >
                    <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                    <span className="sr-only">Close</span>
                  </button>
                </div>

                <div className="space-y-6 px-6 py-6">
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="rounded-full border border-slate-200 px-3 py-1">{frequency}</span>
                    {schedule ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1">
                        <ClockIcon className="h-3.5 w-3.5" aria-hidden="true" />
                        {schedule.next}
                      </span>
                    ) : null}
                    {schedule ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1">
                        <ClockIcon className="h-3.5 w-3.5" aria-hidden="true" />
                        Last {schedule.last}
                      </span>
                    ) : null}
                    {canNotifyEmail ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-600">
                        <BellAlertIcon className="h-3.5 w-3.5" aria-hidden="true" /> Email
                      </span>
                    ) : null}
                    {canNotifyInApp ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-sky-600">
                        <BellAlertIcon className="h-3.5 w-3.5" aria-hidden="true" /> In-app
                      </span>
                    ) : null}
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-slate-700">Filters</h4>
                    {renderChips(search?.filters?.locations)}
                    {renderChips(search?.filters?.organizations)}
                    {search?.filters?.isRemote ? (
                      <span className="mt-3 inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs text-emerald-700">
                        Remote allowed
                      </span>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => onOpen?.(search)}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-accent/60 hover:text-accent"
                    >
                      <ArrowTopRightOnSquareIcon className="h-5 w-5" aria-hidden="true" />
                      Open
                    </button>
                    <button
                      type="button"
                      onClick={() => onRun?.(search)}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                    >
                      <PlayCircleIcon className="h-5 w-5" aria-hidden="true" />
                      Run
                    </button>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => onEdit?.(search)}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-accent/60 hover:text-accent"
                    >
                      <PencilSquareIcon className="h-5 w-5" aria-hidden="true" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete?.(search)}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-100"
                    >
                      <TrashIcon className="h-5 w-5" aria-hidden="true" />
                      Delete
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

TopSearchDetailDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  search: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    query: PropTypes.string,
    filters: PropTypes.object,
    frequency: PropTypes.string,
    notifyByEmail: PropTypes.bool,
    notifyInApp: PropTypes.bool,
    nextRunAt: PropTypes.string,
    lastTriggeredAt: PropTypes.string,
  }),
  onClose: PropTypes.func.isRequired,
  onOpen: PropTypes.func,
  onRun: PropTypes.func,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
};

TopSearchDetailDrawer.defaultProps = {
  search: null,
  onOpen: null,
  onRun: null,
  onEdit: null,
  onDelete: null,
};
