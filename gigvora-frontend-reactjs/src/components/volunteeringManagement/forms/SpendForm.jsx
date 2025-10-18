import { useEffect, useState } from 'react';
import { SPEND_CATEGORY_OPTIONS } from '../constants.js';
import { formatDateInput, formatCurrency, safeNumber } from '../utils.js';

export default function SpendForm({ value, onSubmit, onCancel, busy }) {
  const [amount, setAmount] = useState(value?.amount != null ? String(value.amount) : '');
  const [currencyCode, setCurrencyCode] = useState(value?.currencyCode ?? 'USD');
  const [category, setCategory] = useState(value?.category ?? 'other');
  const [description, setDescription] = useState(value?.description ?? '');
  const [incurredAt, setIncurredAt] = useState(formatDateInput(value?.incurredAt));
  const [error, setError] = useState(null);

  useEffect(() => {
    setAmount(value?.amount != null ? String(value.amount) : '');
    setCurrencyCode(value?.currencyCode ?? 'USD');
    setCategory(value?.category ?? 'other');
    setDescription(value?.description ?? '');
    setIncurredAt(formatDateInput(value?.incurredAt));
    setError(null);
  }, [value]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const numeric = safeNumber(amount);
    if (numeric == null) {
      setError('Enter an amount');
      return;
    }
    setError(null);
    await onSubmit({
      amount: numeric,
      currencyCode,
      category,
      description: description || null,
      incurredAt: incurredAt || null,
    });
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Amount
          <input
            type="number"
            min="0"
            className="rounded-2xl border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            disabled={busy}
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Currency
          <select
            className="rounded-2xl border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            value={currencyCode}
            onChange={(event) => setCurrencyCode(event.target.value)}
            disabled={busy}
          >
            {['USD', 'EUR', 'GBP', 'CAD', 'AUD'].map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
        <span className="font-semibold text-slate-800">{formatCurrency(amount || 0, currencyCode)}</span>
      </div>

      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Category
        <select
          className="rounded-2xl border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          disabled={busy}
        >
          {SPEND_CATEGORY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Description
        <textarea
          className="min-h-[90px] rounded-2xl border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          disabled={busy}
        />
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Incurred
        <input
          type="date"
          className="rounded-2xl border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          value={incurredAt}
          onChange={(event) => setIncurredAt(event.target.value)}
          disabled={busy}
        />
      </label>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          onClick={onCancel}
          disabled={busy}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:bg-emerald-300"
          disabled={busy}
        >
          Save
        </button>
      </div>
    </form>
  );
}
