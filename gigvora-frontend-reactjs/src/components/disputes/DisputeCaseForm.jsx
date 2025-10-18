import { useEffect, useMemo, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { DISPUTE_PRIORITY_OPTIONS, DISPUTE_REASON_CODES } from '../../constants/disputes.js';

function buildDefaultState(defaults = {}) {
  return {
    escrowTransactionId: defaults.escrowTransactionId ?? '',
    reasonCode: defaults.reasonCode ?? 'quality_issue',
    summary: defaults.summary ?? '',
    priority: defaults.priority ?? 'medium',
    assignedToId: defaults.assignedToId ?? '',
    customerDeadlineAt: defaults.customerDeadlineAt ?? '',
    providerDeadlineAt: defaults.providerDeadlineAt ?? '',
  };
}

export default function DisputeCaseForm({ open, onClose, onSubmit, submitting = false, defaultValues = {} }) {
  const [formState, setFormState] = useState(() => buildDefaultState(defaultValues));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      setFormState(buildDefaultState(defaultValues));
      setError(null);
    }
  }, [open, defaultValues]);

  const priorityOptions = useMemo(() => DISPUTE_PRIORITY_OPTIONS, []);
  const reasonOptions = useMemo(() => DISPUTE_REASON_CODES, []);

  if (!open) {
    return null;
  }

  const handleFieldChange = (field) => (event) => {
    const value = event?.target?.value ?? '';
    setFormState((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    const payload = {
      escrowTransactionId: Number.parseInt(formState.escrowTransactionId, 10),
      reasonCode: formState.reasonCode,
      summary: formState.summary.trim(),
      priority: formState.priority,
      assignedToId: formState.assignedToId ? Number.parseInt(formState.assignedToId, 10) : null,
      customerDeadlineAt: formState.customerDeadlineAt ? new Date(formState.customerDeadlineAt).toISOString() : null,
      providerDeadlineAt: formState.providerDeadlineAt ? new Date(formState.providerDeadlineAt).toISOString() : null,
    };

    if (!Number.isFinite(payload.escrowTransactionId) || payload.escrowTransactionId <= 0) {
      setError('Escrow transaction ID must be a positive number.');
      return;
    }

    if (!payload.summary) {
      setError('Add a short summary for the dispute.');
      return;
    }

    if (Number.isNaN(Date.parse(payload.customerDeadlineAt)) && formState.customerDeadlineAt) {
      setError('Customer deadline must be a valid date.');
      return;
    }

    if (Number.isNaN(Date.parse(payload.providerDeadlineAt)) && formState.providerDeadlineAt) {
      setError('Provider deadline must be a valid date.');
      return;
    }

    try {
      await onSubmit?.(payload);
    } catch (submitError) {
      setError(submitError?.message ?? 'Failed to create dispute case.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 py-10">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">New dispute</h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-blue-200 hover:text-blue-600"
          >
            <XMarkIcon className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </button>
        </div>

        <form className="space-y-5 overflow-y-auto px-6 py-6" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-slate-700">
              Escrow transaction ID
              <input
                type="number"
                inputMode="numeric"
                min="1"
                value={formState.escrowTransactionId}
                onChange={handleFieldChange('escrowTransactionId')}
                className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                placeholder="11872"
                required
              />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Assigned to (user ID)
              <input
                type="number"
                inputMode="numeric"
                min="1"
                value={formState.assignedToId}
                onChange={handleFieldChange('assignedToId')}
                className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                placeholder="Optional"
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-slate-700">
              Reason
              <select
                value={formState.reasonCode}
                onChange={handleFieldChange('reasonCode')}
                className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                {reasonOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <span className="mt-1 block text-xs text-slate-500">
                {reasonOptions.find((option) => option.value === formState.reasonCode)?.description}
              </span>
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Priority
              <select
                value={formState.priority}
                onChange={handleFieldChange('priority')}
                className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                {priorityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block text-sm font-semibold text-slate-700">
            Summary
            <textarea
              value={formState.summary}
              onChange={handleFieldChange('summary')}
              rows={4}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="Describe the issue briefly"
              required
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-slate-700">
              Customer deadline
              <input
                type="datetime-local"
                value={formState.customerDeadlineAt}
                onChange={handleFieldChange('customerDeadlineAt')}
                className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Provider deadline
              <input
                type="datetime-local"
                value={formState.providerDeadlineAt}
                onChange={handleFieldChange('providerDeadlineAt')}
                className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </label>
          </div>

          {error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-full border border-blue-500 bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={submitting}
            >
              {submitting ? 'Creating…' : 'Create case'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
