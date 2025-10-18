import { useState } from 'react';
import PropTypes from 'prop-types';
import { PlusCircleIcon } from '@heroicons/react/24/outline';

const PRIORITY_OPTIONS = [
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

function toIsoString(value) {
  if (!value) {
    return undefined;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }
  return date.toISOString();
}

export default function DisputeCreateForm({ onSubmit, loading }) {
  const [form, setForm] = useState({
    escrowTransactionId: '',
    openedById: '',
    assignedToId: '',
    priority: 'medium',
    reasonCode: '',
    summary: '',
    customerDeadlineAt: '',
    providerDeadlineAt: '',
    metadataText: '',
  });
  const [error, setError] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setError(null);
    if (!form.escrowTransactionId || !form.openedById || !form.reasonCode || !form.summary) {
      setError('Escrow transaction, opened by, reason code, and summary are required.');
      return;
    }
    let parsedMetadata = null;
    if (form.metadataText.trim()) {
      try {
        parsedMetadata = JSON.parse(form.metadataText);
      } catch (parseError) {
        setError('Metadata must be valid JSON.');
        return;
      }
    }
    const payload = {
      escrowTransactionId: Number(form.escrowTransactionId),
      openedById: Number(form.openedById),
      assignedToId: form.assignedToId ? Number(form.assignedToId) : undefined,
      priority: form.priority,
      reasonCode: form.reasonCode.trim(),
      summary: form.summary.trim(),
      customerDeadlineAt: toIsoString(form.customerDeadlineAt),
      providerDeadlineAt: toIsoString(form.providerDeadlineAt),
      metadata: parsedMetadata,
    };
    onSubmit?.(payload, () => {
      setForm({
        escrowTransactionId: '',
        openedById: '',
        assignedToId: '',
        priority: 'medium',
        reasonCode: '',
        summary: '',
        customerDeadlineAt: '',
        providerDeadlineAt: '',
        metadataText: '',
      });
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-900">New dispute</h3>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-full border border-blue-500 bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <PlusCircleIcon className="h-4 w-4" aria-hidden="true" />
          {loading ? 'Creating…' : 'Create'}
        </button>
      </div>
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Escrow transaction ID
          <input
            type="number"
            name="escrowTransactionId"
            value={form.escrowTransactionId}
            onChange={handleChange}
            className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Opened by (user ID)
          <input
            type="number"
            name="openedById"
            value={form.openedById}
            onChange={handleChange}
            className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Assign to (user ID)
          <input
            type="number"
            name="assignedToId"
            value={form.assignedToId}
            onChange={handleChange}
            placeholder="Optional"
            className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Priority
          <select
            name="priority"
            value={form.priority}
            onChange={handleChange}
            className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            {PRIORITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Customer deadline
          <input
            type="datetime-local"
            name="customerDeadlineAt"
            value={form.customerDeadlineAt}
            onChange={handleChange}
            className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Provider deadline
          <input
            type="datetime-local"
            name="providerDeadlineAt"
            value={form.providerDeadlineAt}
            onChange={handleChange}
            className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Reason code
        <input
          type="text"
          name="reasonCode"
          value={form.reasonCode}
          onChange={handleChange}
          className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Summary
        <textarea
          name="summary"
          value={form.summary}
          onChange={handleChange}
          rows={3}
          className="rounded-2xl border border-slate-200 px-3 py-3 text-sm text-slate-700 shadow-inner focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Metadata (JSON)
        <textarea
          name="metadataText"
          value={form.metadataText}
          onChange={handleChange}
          rows={4}
          placeholder={'{"channel":"support"}'}
          className="font-mono rounded-2xl border border-slate-200 px-3 py-3 text-sm text-slate-700 shadow-inner focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
      </label>
    </form>
  );
}

DisputeCreateForm.propTypes = {
  onSubmit: PropTypes.func,
  loading: PropTypes.bool,
};

DisputeCreateForm.defaultProps = {
  onSubmit: undefined,
  loading: false,
};
