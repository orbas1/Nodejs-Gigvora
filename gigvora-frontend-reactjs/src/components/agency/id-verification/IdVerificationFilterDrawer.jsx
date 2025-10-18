import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { RISK_LABELS, STATUS_LABELS } from './constants.js';
import { classNames } from './utils.js';

export default function IdVerificationFilterDrawer({
  open,
  onClose,
  filters,
  onFiltersChange,
  onClear,
  onApply,
  statusOptions,
  riskOptions,
}) {
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
          <div className="fixed inset-0 bg-slate-900/40" />
        </Transition.Child>

        <div className="fixed inset-0 flex justify-end">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="translate-x-full"
            enterTo="translate-x-0"
            leave="ease-in duration-150"
            leaveFrom="translate-x-0"
            leaveTo="translate-x-full"
          >
            <Dialog.Panel className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
              <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <FunnelIcon className="h-5 w-5 text-accent" />
                  Filters
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-accent/50 hover:text-accent"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </header>

              <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
                <section className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Status</p>
                  <div className="flex flex-wrap gap-2">
                    {statusOptions.map((status) => {
                      const active = filters.status.includes(status);
                      return (
                        <button
                          key={status}
                          type="button"
                          onClick={() =>
                            onFiltersChange({
                              ...filters,
                              status: toggleToken(filters.status, status),
                            })
                          }
                          className={classNames(
                            'inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition',
                            active
                              ? 'border-accent bg-accent/10 text-accent'
                              : 'border-slate-200 bg-white text-slate-500 hover:border-accent/40',
                          )}
                        >
                          {STATUS_LABELS[status] ?? status}
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Risk</p>
                  <div className="flex flex-wrap gap-2">
                    {riskOptions.map((risk) => {
                      const active = filters.riskLevel.includes(risk);
                      return (
                        <button
                          key={risk}
                          type="button"
                          onClick={() =>
                            onFiltersChange({
                              ...filters,
                              riskLevel: toggleToken(filters.riskLevel, risk),
                            })
                          }
                          className={classNames(
                            'inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition',
                            active
                              ? 'border-rose-200 bg-rose-50 text-rose-600'
                              : 'border-slate-200 bg-white text-slate-500 hover:border-rose-200',
                          )}
                        >
                          {RISK_LABELS[risk] ?? risk}
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Flags</p>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                      <span>Manual review only</span>
                      <input
                        type="checkbox"
                        checked={filters.requiresManualReview === true}
                        onChange={(event) =>
                          onFiltersChange({
                            ...filters,
                            requiresManualReview: event.target.checked ? true : null,
                          })
                        }
                        className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
                      />
                    </label>
                    <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                      <span>Reverification queue</span>
                      <input
                        type="checkbox"
                        checked={filters.requiresReverification === true}
                        onChange={(event) =>
                          onFiltersChange({
                            ...filters,
                            requiresReverification: event.target.checked ? true : null,
                          })
                        }
                        className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
                      />
                    </label>
                  </div>
                </section>

                <section className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Search</p>
                  <input
                    type="search"
                    value={filters.search}
                    onChange={(event) => onFiltersChange({ ...filters, search: event.target.value })}
                    placeholder="Name, reviewer, or doc key"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
                  />
                </section>
              </div>

              <footer className="flex gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
                <button
                  type="button"
                  onClick={onClear}
                  className="inline-flex flex-1 items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-accent/40 hover:text-accent"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={onApply}
                  className="inline-flex flex-1 items-center justify-center rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark"
                >
                  Apply
                </button>
              </footer>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

function toggleToken(source, token) {
  const set = new Set(source);
  if (set.has(token)) {
    set.delete(token);
  } else {
    set.add(token);
  }
  return Array.from(set);
}
