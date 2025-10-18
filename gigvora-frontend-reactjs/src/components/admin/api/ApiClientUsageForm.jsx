import { useMemo, useState } from 'react';

function centsToDollars(cents) {
  if (!Number.isFinite(cents)) {
    return '0.00';
  }
  return (Number(cents) / 100).toFixed(2);
}

export default function ApiClientUsageForm({ client, onSubmit, onCancel, submitting = false }) {
  const defaults = useMemo(() => {
    const metricDate = new Date().toISOString().slice(0, 10);
    return {
      requestCount: '',
      errorCount: '',
      metricDate,
      avgLatencyMs: '',
      peakLatencyMs: '',
      lastRequestAt: '',
      callPrice: '',
    };
  }, []);

  const [form, setForm] = useState(defaults);
  const [error, setError] = useState(null);

  const effectiveCallPriceCents = client?.billing?.effectiveCallPriceCents ?? 0;

  const handleChange = (field) => (event) => {
    setForm((previous) => ({ ...previous, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    const payload = {
      requestCount: form.requestCount ? Number(form.requestCount) : 0,
      errorCount: form.errorCount ? Number(form.errorCount) : 0,
      metricDate: form.metricDate || undefined,
      avgLatencyMs: form.avgLatencyMs ? Number(form.avgLatencyMs) : undefined,
      peakLatencyMs: form.peakLatencyMs ? Number(form.peakLatencyMs) : undefined,
      lastRequestAt: form.lastRequestAt || undefined,
      callPrice: form.callPrice ? Number(form.callPrice) : undefined,
    };

    try {
      await onSubmit?.(payload);
      setForm(defaults);
    } catch (submitError) {
      const message =
        submitError?.response?.data?.message ?? submitError?.message ?? 'Unable to record usage.';
      setError(message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-semibold text-slate-900">Log usage</h3>
        <div className="text-sm text-slate-600">{client?.name}</div>
        <div className="text-xs text-slate-500">
          Price per call ${centsToDollars(effectiveCallPriceCents)}{' '}
          {client?.billing?.walletAccount?.label ? `• ${client.billing.walletAccount.label}` : ''}
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-slate-700">Requests</span>
          <input
            type="number"
            min="0"
            step="1"
            value={form.requestCount}
            onChange={handleChange('requestCount')}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-slate-700">Errors</span>
          <input
            type="number"
            min="0"
            step="1"
            value={form.errorCount}
            onChange={handleChange('errorCount')}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-slate-700">Metric date</span>
          <input
            type="date"
            value={form.metricDate}
            onChange={handleChange('metricDate')}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-slate-700">Last request</span>
          <input
            type="datetime-local"
            value={form.lastRequestAt}
            onChange={handleChange('lastRequestAt')}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-slate-700">Avg latency (ms)</span>
          <input
            type="number"
            min="0"
            step="1"
            value={form.avgLatencyMs}
            onChange={handleChange('avgLatencyMs')}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-slate-700">Peak latency (ms)</span>
          <input
            type="number"
            min="0"
            step="1"
            value={form.peakLatencyMs}
            onChange={handleChange('peakLatencyMs')}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm sm:col-span-2">
          <span className="font-medium text-slate-700">Override price ($)</span>
          <input
            type="number"
            min="0"
            step="0.0001"
            value={form.callPrice}
            onChange={handleChange('callPrice')}
            placeholder="Leave blank to use client pricing"
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </label>
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Saving…' : 'Save usage'}
        </button>
      </div>
    </form>
  );
}
