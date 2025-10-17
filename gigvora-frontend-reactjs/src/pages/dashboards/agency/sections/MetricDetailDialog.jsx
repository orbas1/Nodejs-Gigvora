import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { formatAbsolute } from '../../../../utils/date.js';

function formatRaw(metric) {
  if (!metric) {
    return '—';
  }
  if (metric.rawValue == null || Number.isNaN(Number(metric.rawValue))) {
    return '—';
  }
  const numeric = Number(metric.rawValue);
  return `${numeric}${metric.detailSuffix ?? ''}`;
}

export default function MetricDetailDialog({ open, onClose, metric, lastUpdated, onEdit }) {
  const displayValue = metric?.value ?? '—';
  const status = metric?.status?.label ?? 'No data';
  const statusTone = metric?.status?.tone ?? 'text-slate-400';
  const updatedLabel = lastUpdated ? formatAbsolute(lastUpdated, { dateStyle: 'medium', timeStyle: 'short' }) : null;

  const handleEditClick = () => {
    onClose?.();
    onEdit?.();
  };

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
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center px-4 py-8">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative w-full max-w-md transform overflow-hidden rounded-4xl bg-white p-6 text-left shadow-xl transition-all">
                <button
                  type="button"
                  className="absolute right-4 top-4 rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                  onClick={onClose}
                >
                  <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                  <span className="sr-only">Close metric</span>
                </button>

                <div className="space-y-6">
                  <div>
                    <Dialog.Title className="text-xl font-semibold text-slate-900">{metric?.label || 'Metric'}</Dialog.Title>
                    <p className={`mt-2 text-xs font-semibold uppercase tracking-[0.25em] ${statusTone}`}>{status}</p>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Current</p>
                    <p className="mt-2 text-3xl font-semibold text-slate-900">{displayValue}</p>
                  </div>

                  <dl className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Raw</dt>
                      <dd className="mt-1 font-semibold text-slate-900">{formatRaw(metric)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Updated</dt>
                      <dd className="mt-1 text-slate-600">{updatedLabel || '—'}</dd>
                    </div>
                  </dl>

                  {onEdit ? (
                    <button
                      type="button"
                      onClick={handleEditClick}
                      className="w-full rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                    >
                      Edit metric
                    </button>
                  ) : null}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
