import { useEffect, useMemo, useState } from 'react';
import { CONTRACT_STATUS_OPTIONS } from '../constants.js';
import { formatDateInput, formatCurrency, optionLabelFor, safeNumber } from '../utils.js';

const CURRENCY_OPTIONS = ['USD', 'EUR', 'GBP', 'CAD', 'AUD'];

export default function ContractForm({ value, onSubmit, onCancel, busy }) {
  const [status, setStatus] = useState(value?.status ?? 'draft');
  const [startDate, setStartDate] = useState(formatDateInput(value?.startDate));
  const [endDate, setEndDate] = useState(formatDateInput(value?.endDate));
  const [commitmentHours, setCommitmentHours] = useState(value?.commitmentHours != null ? String(value.commitmentHours) : '');
  const [hourlyRate, setHourlyRate] = useState(value?.hourlyRate != null ? String(value.hourlyRate) : '');
  const [currencyCode, setCurrencyCode] = useState(value?.currencyCode ?? 'USD');
  const [totalValue, setTotalValue] = useState(value?.totalValue != null ? String(value.totalValue) : '');
  const [spendToDate, setSpendToDate] = useState(value?.spendToDate != null ? String(value.spendToDate) : '');
  const [notes, setNotes] = useState(value?.notes ?? '');

  useEffect(() => {
    setStatus(value?.status ?? 'draft');
    setStartDate(formatDateInput(value?.startDate));
    setEndDate(formatDateInput(value?.endDate));
    setCommitmentHours(value?.commitmentHours != null ? String(value.commitmentHours) : '');
    setHourlyRate(value?.hourlyRate != null ? String(value.hourlyRate) : '');
    setCurrencyCode(value?.currencyCode ?? 'USD');
    setTotalValue(value?.totalValue != null ? String(value.totalValue) : '');
    setSpendToDate(value?.spendToDate != null ? String(value.spendToDate) : '');
    setNotes(value?.notes ?? '');
  }, [value]);

  const totalPreview = useMemo(() => {
    if (!totalValue) {
      return '—';
    }
    return formatCurrency(totalValue, currencyCode);
  }, [totalValue, currencyCode]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onSubmit({
      status,
      startDate: startDate || null,
      endDate: endDate || null,
      commitmentHours: safeNumber(commitmentHours),
      hourlyRate: safeNumber(hourlyRate),
      currencyCode,
      totalValue: safeNumber(totalValue),
      spendToDate: safeNumber(spendToDate),
      notes: notes || null,
    });
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Status
        <select
          className="rounded-2xl border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          disabled={busy}
        >
          {CONTRACT_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Start
          <input
            type="date"
            className="rounded-2xl border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            disabled={busy}
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          End
          <input
            type="date"
            className="rounded-2xl border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            disabled={busy}
          />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Hours total
          <input
            type="number"
            min="0"
            className="rounded-2xl border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            value={commitmentHours}
            onChange={(event) => setCommitmentHours(event.target.value)}
            disabled={busy}
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Hourly rate
          <input
            type="number"
            min="0"
            className="rounded-2xl border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            value={hourlyRate}
            onChange={(event) => setHourlyRate(event.target.value)}
            disabled={busy}
          />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Currency
          <select
            className="rounded-2xl border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            value={currencyCode}
            onChange={(event) => setCurrencyCode(event.target.value)}
            disabled={busy}
          >
            {CURRENCY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <div className="rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
          <span className="font-semibold text-slate-800">{optionLabelFor(status, CONTRACT_STATUS_OPTIONS)}</span>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Contract value
          <input
            type="number"
            min="0"
            className="rounded-2xl border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            value={totalValue}
            onChange={(event) => setTotalValue(event.target.value)}
            disabled={busy}
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Spend to date
          <input
            type="number"
            min="0"
            className="rounded-2xl border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            value={spendToDate}
            onChange={(event) => setSpendToDate(event.target.value)}
            disabled={busy}
          />
        </label>
      </div>

      <div className="rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
        <span className="font-semibold text-slate-800">{totalPreview}</span>
      </div>

      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Notes
        <textarea
          className="min-h-[90px] rounded-2xl border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          disabled={busy}
        />
      </label>

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
