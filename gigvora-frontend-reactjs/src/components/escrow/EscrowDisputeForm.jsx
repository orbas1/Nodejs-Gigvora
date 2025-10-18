import { useState } from 'react';
import PropTypes from 'prop-types';

const DEFAULT_REASONS = ['quality_issue', 'scope_disagreement', 'delivery_delay', 'fraud'];

export default function EscrowDisputeForm({
  transaction,
  priorities,
  onSubmit,
  submitting,
  userId,
}) {
  const [form, setForm] = useState(() => ({
    reasonCode: DEFAULT_REASONS[0],
    summary: '',
    priority: priorities.includes('medium') ? 'medium' : priorities[0] ?? 'medium',
    assignedToId: '',
    customerDeadlineAt: '',
    providerDeadlineAt: '',
  }));
  const [error, setError] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      if (!form.summary) {
        throw new Error('Add a summary.');
      }
      const payload = {
        escrowTransactionId: transaction.id,
        openedById: userId,
        assignedToId: form.assignedToId ? Number.parseInt(form.assignedToId, 10) : undefined,
        reasonCode: form.reasonCode,
        summary: form.summary,
        priority: form.priority,
        customerDeadlineAt: form.customerDeadlineAt ? new Date(form.customerDeadlineAt).toISOString() : undefined,
        providerDeadlineAt: form.providerDeadlineAt ? new Date(form.providerDeadlineAt).toISOString() : undefined,
      };
      await onSubmit(payload);
    } catch (err) {
      setError(err.message ?? 'Unable to open dispute.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4 text-sm text-amber-700">
        <p className="font-semibold">Escrow transaction #{transaction.id}</p>
        <p className="mt-1 text-xs text-amber-600">{transaction.reference}</p>
      </div>
      <label className="flex flex-col gap-2 text-sm text-slate-700">
        Reason
        <select
          name="reasonCode"
          value={form.reasonCode}
          onChange={handleChange}
          className="rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          {DEFAULT_REASONS.map((reason) => (
            <option key={reason} value={reason}>
              {reason.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-2 text-sm text-slate-700">
        Summary
        <textarea
          name="summary"
          value={form.summary}
          onChange={handleChange}
          rows={5}
          placeholder="Outline the issue"
          className="rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm text-slate-700">
          Priority
          <select
            name="priority"
            value={form.priority}
            onChange={handleChange}
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            {priorities.map((priority) => (
              <option key={priority} value={priority}>
                {priority.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm text-slate-700">
          Assign to
          <input
            type="number"
            name="assignedToId"
            value={form.assignedToId}
            onChange={handleChange}
            placeholder="Team member ID"
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-slate-700">
          Customer deadline
          <input
            type="datetime-local"
            name="customerDeadlineAt"
            value={form.customerDeadlineAt}
            onChange={handleChange}
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-slate-700">
          Provider deadline
          <input
            type="datetime-local"
            name="providerDeadlineAt"
            value={form.providerDeadlineAt}
            onChange={handleChange}
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </label>
      </div>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center rounded-2xl border border-amber-200 bg-amber-500 px-6 py-2 text-sm font-semibold text-white transition hover:border-amber-300 hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Submitting…' : 'Open dispute'}
        </button>
      </div>
    </form>
  );
}

EscrowDisputeForm.propTypes = {
  transaction: PropTypes.object.isRequired,
  priorities: PropTypes.arrayOf(PropTypes.string),
  onSubmit: PropTypes.func.isRequired,
  submitting: PropTypes.bool,
  userId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
};

EscrowDisputeForm.defaultProps = {
  priorities: ['medium'],
  submitting: false,
};
