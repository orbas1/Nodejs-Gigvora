import { useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

const PRIMARY_METRICS = [
  { key: 'grossVolume', label: 'Gross', format: 'currency' },
  { key: 'outstanding', label: 'Held', format: 'currency' },
  { key: 'released', label: 'Released', format: 'currency' },
  { key: 'disputedCount', label: 'Disputes', format: 'number' },
];

const DETAIL_METRICS = [
  { key: 'netVolume', label: 'Net volume', format: 'currency' },
  { key: 'refunded', label: 'Refunded', format: 'currency' },
  { key: 'averageReleaseDays', label: 'Avg release (days)', format: 'number' },
  { key: 'longestReleaseDays', label: 'Longest release (days)', format: 'number' },
];

function formatValue(value, format) {
  if (value == null) {
    return '—';
  }
  if (format === 'currency') {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
      Number(value) || 0,
    );
  }
  if (format === 'number') {
    return Number(value).toLocaleString();
  }
  return value;
}

export default function MetricBoard({ metrics = {} }) {
  const [expanded, setExpanded] = useState(false);
  const cards = useMemo(
    () =>
      PRIMARY_METRICS.map((metric) => ({
        ...metric,
        value: formatValue(metrics[metric.key], metric.format),
      })),
    [metrics],
  );

  return (
    <>
      <div className="grid grid-cols-2 gap-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 md:grid-cols-4">
        {cards.map((card) => (
          <button
            key={card.key}
            type="button"
            onClick={() => setExpanded(true)}
            className="group rounded-2xl border border-transparent bg-slate-50/40 px-4 py-5 text-left transition hover:border-slate-200 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20"
          >
            <p className="text-sm font-medium text-slate-500">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{card.value}</p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Tap for details</p>
          </button>
        ))}
      </div>

      <Transition.Root show={expanded} as={Fragment}>
        <Dialog as="div" className="relative z-40" onClose={() => setExpanded(false)}>
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

          <div className="fixed inset-0 flex items-center justify-center p-6">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-3xl rounded-3xl bg-white p-8 shadow-2xl">
                <Dialog.Title className="text-xl font-semibold text-slate-900">Escrow performance</Dialog.Title>
                <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {[...PRIMARY_METRICS, ...DETAIL_METRICS].map((metric) => (
                    <div key={metric.key} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{metric.label}</p>
                      <p className="mt-2 text-lg font-semibold text-slate-900">
                        {formatValue(metrics[metric.key], metric.format)}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setExpanded(false)}
                    className="rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20"
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
}
