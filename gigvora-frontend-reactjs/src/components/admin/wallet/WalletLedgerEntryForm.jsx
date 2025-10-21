import { useEffect, useState } from 'react';

const ENTRY_TYPES = ['credit', 'debit', 'hold', 'release', 'adjustment'];

const DEFAULT_FORM = {
  entryType: 'credit',
  amount: '',
  currencyCode: 'USD',
  description: '',
  reference: '',
  externalReference: '',
};

export default function WalletLedgerEntryForm({
  onSubmit,
  loading,
  error,
  onCancel,
  variant = 'card',
  resetKey,
}) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    setForm(DEFAULT_FORM);
    setLocalError('');
  }, [resetKey]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setLocalError('');
    const numericAmount = Number(form.amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setLocalError('Amount required');
      return;
    }
    if (typeof onSubmit === 'function') {
      onSubmit({
        entryType: form.entryType,
        amount: numericAmount,
        currencyCode: form.currencyCode,
        description: form.description?.trim() || undefined,
        reference: form.reference?.trim() || undefined,
        externalReference: form.externalReference?.trim() || undefined,
      });
    }
  };

  const containerClass =
    variant === 'inline'
      ? 'space-y-4 rounded-2xl border border-slate-200 bg-white p-4'
      : 'rounded-3xl border border-slate-200 bg-white p-6 shadow-sm';

  return (
    <form className={containerClass} onSubmit={handleSubmit} noValidate>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">New entry</h3>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full px-3 py-1 text-sm font-semibold text-slate-500 hover:bg-slate-100"
          >
            Close
          </button>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="entryType" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Type
          </label>
          <select
            id="entryType"
            name="entryType"
            value={form.entryType}
            onChange={handleChange}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
          >
            {ENTRY_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="amount" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Amount
          </label>
          <input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            value={form.amount}
            onChange={handleChange}
            required
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
          />
        </div>
        <div>
          <label htmlFor="currencyCode" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Currency
          </label>
          <input
            id="currencyCode"
            name="currencyCode"
            value={form.currencyCode}
            onChange={handleChange}
            maxLength={3}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm uppercase text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
          />
        </div>
        <div>
          <label htmlFor="reference" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Reference
          </label>
          <input
            id="reference"
            name="reference"
            value={form.reference}
            onChange={handleChange}
            maxLength={160}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
            placeholder="WL-ADMIN-001"
          />
        </div>
        <div>
          <label htmlFor="externalReference" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            External ref
          </label>
          <input
            id="externalReference"
            name="externalReference"
            value={form.externalReference}
            onChange={handleChange}
            maxLength={160}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
            placeholder="TXN-123"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="description" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Notes
          </label>
          <textarea
            id="description"
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={3}
            maxLength={500}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
          />
        </div>
      </div>

      {(localError || error) && <p className="text-sm text-rose-600">{localError || error}</p>}

      <div className="flex justify-end gap-2">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-600"
          >
            Cancel
          </button>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className="rounded-full border border-blue-500 bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  );
}
