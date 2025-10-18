import { useMemo, useState } from 'react';
import { FunnelIcon, PlusIcon } from '@heroicons/react/24/outline';

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString();
}

function currencyFormatter(amount, currency = 'USD') {
  if (!amount) return '$0';
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(Number(amount));
  } catch (error) {
    return `${currency} ${Number(amount).toLocaleString()}`;
  }
}

export default function VolunteeringSpendTracker({
  contracts = [],
  spendEntries = [],
  busy = false,
  onAddSpend,
  onDeleteSpend,
  onSelectApplication,
}) {
  const [contractFilter, setContractFilter] = useState('all');
  const [form, setForm] = useState({
    contractId: '',
    amount: '',
    currency: 'USD',
    spentAt: '',
    note: '',
  });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const contractOptions = useMemo(
    () =>
      contracts.map((contract) => ({
        value: contract.id,
        label: contract.title || 'Volunteer contract',
        candidate: contract.application?.candidateName ?? 'Unnamed candidate',
      })),
    [contracts],
  );

  const filteredEntries = useMemo(() => {
    return spendEntries.filter((entry) => contractFilter === 'all' || entry.contractId === contractFilter);
  }, [spendEntries, contractFilter]);

  const totals = useMemo(() => {
    return filteredEntries.reduce(
      (acc, entry) => {
        acc.total += Number(entry.amount) || 0;
        acc.byCurrency[entry.currency || 'USD'] =
          (acc.byCurrency[entry.currency || 'USD'] || 0) + (Number(entry.amount) || 0);
        return acc;
      },
      { total: 0, byCurrency: {} },
    );
  }, [filteredEntries]);

  const handleFormChange = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.contractId || !form.amount) {
      setError('Pick a contract and amount.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await onAddSpend?.(form.contractId, {
        amount: Number(form.amount),
        currency: form.currency,
        spentAt: form.spentAt || undefined,
        note: form.note || undefined,
      });
      setForm({ contractId: '', amount: '', currency: 'USD', spentAt: '', note: '' });
    } catch (submissionError) {
      setError(submissionError?.message || 'Could not record spend.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (spendId) => {
    if (!spendId) return;
    try {
      await onDeleteSpend?.(spendId);
    } catch (deleteError) {
      console.error(deleteError);
    }
  };

  return (
    <div className="flex h-full flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold text-slate-900">Spend</h2>
        <p className="text-sm text-slate-500">Log reimbursements and stipends tied to volunteer contracts.</p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">New entry</h3>
            <form onSubmit={handleSubmit} className="mt-4 space-y-3 text-sm text-slate-600">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Contract</span>
                <select
                  value={form.contractId}
                  onChange={handleFormChange('contractId')}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-none"
                >
                  <option value="" disabled>
                    Select contract
                  </option>
                  {contractOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label} · {option.candidate}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-[2fr_1fr] gap-2">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Amount</span>
                  <input
                    type="number"
                    min="0"
                    value={form.amount}
                    onChange={handleFormChange('amount')}
                    placeholder="0"
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-none"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Currency</span>
                  <input
                    value={form.currency}
                    onChange={handleFormChange('currency')}
                    placeholder="USD"
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-none"
                  />
                </label>
              </div>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Date</span>
                <input
                  type="date"
                  value={form.spentAt}
                  onChange={handleFormChange('spentAt')}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Note</span>
                <textarea
                  value={form.note}
                  onChange={handleFormChange('note')}
                  rows={2}
                  placeholder="Purpose"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-none"
                />
              </label>
              {error ? <p className="text-xs font-semibold text-rose-600">{error}</p> : null}
              <button
                type="submit"
                disabled={submitting || busy}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <PlusIcon className="h-4 w-4" aria-hidden="true" />
                Record
              </button>
            </form>
          </div>

          <div className="space-y-2 text-sm text-slate-600">
            <h3 className="text-sm font-semibold text-slate-900">Totals</h3>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Overall</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{currencyFormatter(totals.total)}</p>
            </div>
            <ul className="space-y-1 text-xs text-slate-500">
              {Object.entries(totals.byCurrency).map(([currency, value]) => (
                <li key={currency} className="flex items-center justify-between rounded-xl px-3 py-2">
                  <span>{currency}</span>
                  <span className="font-semibold text-slate-700">{currencyFormatter(value, currency)}</span>
                </li>
              ))}
              {!Object.keys(totals.byCurrency).length ? (
                <li className="rounded-xl bg-slate-50 px-3 py-2 text-center text-xs text-slate-400">No entries yet</li>
              ) : null}
            </ul>
          </div>
        </div>

        <div className="flex h-full flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
            <label className="inline-flex items-center gap-2">
              <FunnelIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
              <select
                value={contractFilter}
                onChange={(event) =>
                  setContractFilter(event.target.value === 'all' ? 'all' : Number(event.target.value))
                }
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none"
              >
                <option value="all">All contracts</option>
                {contractOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="max-h-[640px] overflow-y-auto pr-1">
            <table className="w-full table-fixed border-separate border-spacing-y-3 text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="rounded-l-2xl bg-slate-50 px-4 py-2">Contract</th>
                  <th className="bg-slate-50 px-4 py-2">Amount</th>
                  <th className="bg-slate-50 px-4 py-2">Date</th>
                  <th className="bg-slate-50 px-4 py-2">Note</th>
                  <th className="rounded-r-2xl bg-slate-50 px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.length ? (
                  filteredEntries.map((entry) => {
                    const contract = contracts.find((item) => item.id === entry.contractId);
                    const application = contract?.application;
                    return (
                      <tr key={entry.id} className="rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm">
                        <td className="rounded-l-2xl px-4 py-3">
                          <button
                            type="button"
                            onClick={() => onSelectApplication?.(contract?.applicationId)}
                            className="text-left text-sm font-semibold text-blue-600 hover:underline"
                          >
                            {contract?.title || 'Volunteer contract'}
                          </button>
                          <p className="text-xs text-slate-500">{application?.candidateName ?? 'Unnamed candidate'}</p>
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-slate-700">
                          {currencyFormatter(entry.amount, entry.currency)}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">{formatDate(entry.spentAt)}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">{entry.note || '—'}</td>
                        <td className="rounded-r-2xl px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleDelete(entry.id)}
                            className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-12 text-center text-sm text-slate-500">
                      No spend entries match these filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
