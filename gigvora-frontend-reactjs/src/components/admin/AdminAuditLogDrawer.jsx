import { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';
import { ClockIcon } from '@heroicons/react/24/outline';
import { describeTimeSince } from '../../utils/date.js';

function AuditLogEntry({ entry }) {
  return (
    <li className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {entry.actor ?? 'System automation'}
          </p>
          <p className="text-sm font-semibold text-slate-900">{entry.title}</p>
          {entry.description ? (
            <p className="text-xs text-slate-600">{entry.description}</p>
          ) : null}
        </div>
        <div className="flex flex-shrink-0 items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          <ClockIcon className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{describeTimeSince(entry.timestamp)}</span>
        </div>
      </div>
      {entry.metadata ? (
        <dl className="mt-4 grid grid-cols-2 gap-3 text-[11px] text-slate-500">
          {Object.entries(entry.metadata).map(([key, value]) => (
            <div key={key}>
              <dt className="font-semibold uppercase tracking-wide text-slate-400">{key}</dt>
              <dd className="mt-1 text-slate-600">{Array.isArray(value) ? value.join(', ') : String(value)}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </li>
  );
}

AuditLogEntry.propTypes = {
  entry: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    actor: PropTypes.string,
    timestamp: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]).isRequired,
    metadata: PropTypes.object,
  }).isRequired,
};

export default function AdminAuditLogDrawer({
  open,
  title,
  description,
  logs,
  loading,
  emptyState,
  onClose,
}) {
  const hasLogs = Array.isArray(logs) && logs.length > 0;
  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={loading ? () => {} : onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/30" aria-hidden="true" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 flex max-w-full justify-end">
            <Transition.Child
              as={Fragment}
              enter="transform transition ease-out duration-200"
              enterFrom="translate-x-full"
              enterTo="translate-x-0"
              leave="transform transition ease-in duration-150"
              leaveFrom="translate-x-0"
              leaveTo="translate-x-full"
            >
              <Dialog.Panel className="pointer-events-auto w-screen max-w-xl bg-slate-50 shadow-xl">
                <div className="flex h-full flex-col">
                  <div className="border-b border-slate-200 bg-white/90 px-6 py-5">
                    <Dialog.Title className="text-lg font-semibold text-slate-900">{title}</Dialog.Title>
                    {description ? <p className="mt-2 text-sm text-slate-600">{description}</p> : null}
                  </div>
                  <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
                    {loading ? (
                      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 shadow-soft">
                        Fetching audit log…
                      </div>
                    ) : null}
                    {!loading && hasLogs ? (
                      <ul className="space-y-4">
                        {logs.map((log) => (
                          <AuditLogEntry key={log.id} entry={log} />
                        ))}
                      </ul>
                    ) : null}
                    {!loading && !hasLogs ? (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-white/80 p-6 text-center text-sm text-slate-500">
                        {emptyState || 'No audit events recorded yet.'}
                      </div>
                    ) : null}
                  </div>
                  <div className="border-t border-slate-200 bg-white/90 px-6 py-4 text-right">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={loading}
                      className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

AdminAuditLogDrawer.propTypes = {
  open: PropTypes.bool,
  title: PropTypes.string,
  description: PropTypes.string,
  logs: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    actor: PropTypes.string,
    timestamp: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]).isRequired,
    metadata: PropTypes.object,
  })),
  loading: PropTypes.bool,
  emptyState: PropTypes.node,
  onClose: PropTypes.func,
};

AdminAuditLogDrawer.defaultProps = {
  open: false,
  title: 'Audit log',
  description: '',
  logs: [],
  loading: false,
  emptyState: null,
  onClose: undefined,
};
