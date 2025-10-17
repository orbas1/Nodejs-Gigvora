import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { BanknotesIcon, PlusIcon } from '@heroicons/react/24/outline';

function formatCurrency(amount, currency = 'USD') {
  const value = Number.isFinite(Number(amount)) ? Number(amount) : 0;
  return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 2 }).format(value);
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleString();
}

export default function WalletLedgerDrawer({ account, ledgerResource, open, onClose, onCreateEntry }) {
  const { data, loading, error, refresh } = ledgerResource;
  const entries = data?.items ?? [];
  const [formState, setFormState] = useState({ entryType: 'credit', amount: '', description: '', reference: '', occurredAt: '' });
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError(null);
    setBusy(true);
    try {
      await onCreateEntry({
        entryType: formState.entryType,
        amount: formState.amount,
        description: formState.description,
        reference: formState.reference,
        occurredAt: formState.occurredAt || undefined,
      });
      setFormState({ entryType: 'credit', amount: '', description: '', reference: '', occurredAt: '' });
      await refresh?.({ force: true });
    } catch (err) {
      const message = err?.message || 'Unable to create ledger entry. Please try again.';
      setFormError(message);
    } finally {
      setBusy(false);
    }
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
          <div className="fixed inset-0 bg-slate-900/40" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-200"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-xl">
                  <div className="flex h-full flex-col overflow-y-auto bg-white shadow-2xl">
                    <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
                      <div>
                        <Dialog.Title className="text-xl font-semibold text-slate-900">{account?.displayName ?? 'Wallet ledger'}</Dialog.Title>
                      </div>
                      <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-blue-200 hover:text-blue-600"
                        aria-label="Close ledger drawer"
                      >
                        ×
                      </button>
                    </div>

                    <div className="flex-1 space-y-6 px-6 py-6">
                      <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex h-11 w-11 items-center justify-center rounded-3xl bg-blue-600 text-white">
                            <BanknotesIcon className="h-5 w-5" />
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">Current balance</p>
                            <p className="text-lg font-semibold text-slate-900">
                              {formatCurrency(account?.currentBalance ?? 0, account?.currencyCode)}
                            </p>
                            <p className="text-xs text-slate-500">
                              Free: {formatCurrency(account?.availableBalance ?? 0, account?.currencyCode)} · Hold:{' '}
                              {formatCurrency(account?.pendingHoldBalance ?? 0, account?.currencyCode)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <section className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-slate-500">Entries</h3>
                          <button
                            type="button"
                            onClick={() => refresh?.({ force: true })}
                            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-600"
                          >
                            Refresh
                          </button>
                        </div>

                        {error ? (
                          <div className="rounded-3xl border border-rose-200 bg-rose-50/70 p-3 text-sm text-rose-700">Entries unavailable.</div>
                        ) : null}

                        <div className="max-h-80 overflow-y-auto rounded-3xl border border-slate-200">
                          <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                              <tr>
                                <th className="px-4 py-2">Reference</th>
                                <th className="px-4 py-2">Type</th>
                                <th className="px-4 py-2">Amount</th>
                                <th className="px-4 py-2">Balance</th>
                                <th className="px-4 py-2">Occurred</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                              {loading ? (
                                <tr>
                                  <td colSpan={5} className="px-4 py-4 text-center text-sm text-slate-500">
                                    Loading entries…
                                  </td>
                                </tr>
                              ) : entries.length ? (
                                entries.map((entry) => (
                                  <tr key={entry.id}>
                                    <td className="px-4 py-3">
                                      <div className="font-semibold text-slate-900">{entry.reference}</div>
                                      <div className="text-xs text-slate-500">{entry.description || '—'}</div>
                                    </td>
                                    <td className="px-4 py-3 text-xs uppercase tracking-wide text-slate-500">{entry.entryType}</td>
                                    <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                                      {formatCurrency(entry.amount, entry.currencyCode)}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-700">
                                      {formatCurrency(entry.balanceAfter, entry.currencyCode)}
                                    </td>
                                    <td className="px-4 py-3 text-xs text-slate-500">{formatDate(entry.occurredAt)}</td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={5} className="px-4 py-4 text-center text-sm text-slate-500">
                                    No ledger entries yet.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </section>

                      <section className="rounded-3xl border border-slate-200 bg-white p-5">
                        <h3 className="text-sm font-semibold text-slate-500">New entry</h3>
                        {formError ? (
                          <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50/70 p-3 text-xs text-rose-700">
                            {formError}
                          </div>
                        ) : null}

                        <form onSubmit={handleSubmit} className="mt-4 grid gap-3 sm:grid-cols-2">
                          <div className="space-y-1">
                            <label htmlFor="entryType" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Entry type
                            </label>
                            <select
                              id="entryType"
                              name="entryType"
                              value={formState.entryType}
                              onChange={handleChange}
                              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                            >
                              <option value="credit">Credit</option>
                              <option value="debit">Debit</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label htmlFor="amount" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Amount
                            </label>
                            <input
                              id="amount"
                              name="amount"
                              type="number"
                              step="0.01"
                              required
                              value={formState.amount}
                              onChange={handleChange}
                              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                            />
                          </div>

                          <div className="space-y-1">
                            <label htmlFor="reference" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Reference
                            </label>
                            <input
                              id="reference"
                              name="reference"
                              value={formState.reference}
                              onChange={handleChange}
                              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                              placeholder="Reference"
                            />
                          </div>

                          <div className="space-y-1">
                            <label htmlFor="occurredAt" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Occurred at
                            </label>
                            <input
                              id="occurredAt"
                              name="occurredAt"
                              type="datetime-local"
                              value={formState.occurredAt}
                              onChange={handleChange}
                              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                            />
                          </div>

                          <div className="space-y-1 sm:col-span-2">
                            <label htmlFor="description" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Description
                            </label>
                            <textarea
                              id="description"
                              name="description"
                              rows={2}
                              value={formState.description}
                              onChange={handleChange}
                              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                              placeholder="Notes"
                            />
                          </div>

                          <div className="sm:col-span-2 flex justify-end gap-2">
                            <button
                              type="submit"
                              disabled={busy}
                              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <PlusIcon className="h-4 w-4" /> {busy ? 'Saving…' : 'Create entry'}
                            </button>
                          </div>
                        </form>
                      </section>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
