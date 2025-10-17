import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

export default function OverviewStatModal({ open, stat, onClose, onEdit }) {
  return (
    <Transition.Root show={open} as={Fragment}>
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
          <div className="fixed inset-0 bg-slate-900/50" />
        </Transition.Child>

        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 sm:p-6">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enterTo="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <Dialog.Panel className="w-full max-w-xl transform overflow-hidden rounded-3xl bg-white p-6 shadow-2xl transition-all sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Dialog.Title className="text-lg font-semibold text-slate-900">{stat?.label ?? 'Detail'}</Dialog.Title>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{stat?.value ?? '—'}</p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:bg-slate-200"
                >
                  Close
                </button>
              </div>

              {stat?.details?.length ? (
                <ul className="mt-6 space-y-2 text-sm text-slate-600">
                  {stat.details.map((line, index) => (
                    <li key={index} className="rounded-2xl bg-slate-50 px-4 py-3 font-medium text-slate-700">
                      {line}
                    </li>
                  ))}
                </ul>
              ) : null}

              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    onClose?.();
                    onEdit?.(stat);
                  }}
                  className="inline-flex items-center rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
                >
                  Adjust in settings
                </button>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
