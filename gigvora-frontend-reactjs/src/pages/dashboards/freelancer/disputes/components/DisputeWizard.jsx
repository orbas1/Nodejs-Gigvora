import { useMemo, useState } from 'react';

const INITIAL_DRAFT = {
  escrowTransactionId: '',
  reasonCode: '',
  summary: '',
  priority: 'medium',
  customerDeadlineAt: '',
  providerDeadlineAt: '',
  metadataNotes: '',
};

function formatAmount(amount, currency) {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(Number(amount || 0));
  } catch (error) {
    return `$${Number(amount || 0).toFixed(2)}`;
  }
}

export default function DisputeWizard({
  open,
  onClose,
  onCreate,
  transactions,
  reasons,
  priorities,
}) {
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState(INITIAL_DRAFT);
  const [filter, setFilter] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const filteredTransactions = useMemo(() => {
    if (!filter) {
      return transactions;
    }
    const value = filter.toLowerCase();
    return transactions.filter((item) =>
      [item.reference, item.milestoneLabel, item.metadata?.title]
        .filter(Boolean)
        .some((entry) => `${entry}`.toLowerCase().includes(value)) || `${item.amount}`.includes(filter),
    );
  }, [filter, transactions]);

  const handleTransactionSelect = (transactionId) => {
    setDraft((prev) => ({ ...prev, escrowTransactionId: transactionId }));
    setStep(2);
  };

  const handleChange = (field) => (event) => {
    setDraft((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const resetState = () => {
    setStep(1);
    setDraft(INITIAL_DRAFT);
    setFilter('');
    setSubmitting(false);
    setError(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!draft.escrowTransactionId || !draft.reasonCode || !draft.summary.trim()) {
      setError(new Error('Please complete the required fields.'));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onCreate({
        escrowTransactionId: draft.escrowTransactionId,
        reasonCode: draft.reasonCode,
        summary: draft.summary.trim(),
        priority: draft.priority,
        customerDeadlineAt: draft.customerDeadlineAt || undefined,
        providerDeadlineAt: draft.providerDeadlineAt || undefined,
        metadata: draft.metadataNotes ? { notes: draft.metadataNotes } : undefined,
      });
      resetState();
    } catch (cause) {
      setError(cause instanceof Error ? cause : new Error('Unable to create dispute.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <button type="button" className="h-full flex-1 bg-slate-900/40" onClick={handleClose} aria-label="Close wizard" />
      <section className="h-full w-full max-w-3xl overflow-y-auto bg-white shadow-2xl">
        <header className="border-b border-slate-200 px-8 py-6">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">New dispute</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Open dispute</h2>
          <p className="mt-2 text-sm text-slate-500">Pick the escrow record and provide the essentials. Everything stays editable later.</p>
        </header>

        <div className="px-8 py-8">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <span className={`rounded-full px-3 py-1 ${step === 1 ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>1</span>
            <span>Transaction</span>
            <span className="text-slate-300">/</span>
            <span className={`rounded-full px-3 py-1 ${step === 2 ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>2</span>
            <span>Details</span>
          </div>

          {step === 1 ? (
            <div className="mt-6 space-y-6">
              <div className="flex items-center justify-between gap-4">
                <input
                  type="search"
                  value={filter}
                  onChange={(event) => setFilter(event.target.value)}
                  placeholder="Search reference"
                  className="flex-1 rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                />
                <button
                  type="button"
                  className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-800"
                  onClick={handleClose}
                >
                  Cancel
                </button>
              </div>

              <div className="grid max-h-[28rem] gap-3 overflow-y-auto pr-1">
                {filteredTransactions.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-slate-200 py-12 text-center text-xs uppercase tracking-widest text-slate-400">
                    No eligible transactions
                  </p>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <button
                      key={transaction.id}
                      type="button"
                      onClick={() => handleTransactionSelect(transaction.id)}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{transaction.reference || `#${transaction.id}`}</p>
                        <p className="text-xs text-slate-500">{transaction.milestoneLabel || 'Escrow payment'}</p>
                      </div>
                      <div className="text-right text-sm font-semibold text-slate-700">
                        {formatAmount(transaction.amount, transaction.currencyCode)}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div className="flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-800"
                >
                  Back
                </button>
                <div className="flex gap-3">
                  <button
                    type="button"
                    className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-800"
                    onClick={handleClose}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? 'Creating…' : 'Create'}
                  </button>
                </div>
              </div>

              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Reason
                <select
                  value={draft.reasonCode}
                  onChange={handleChange('reasonCode')}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                  required
                >
                  <option value="" disabled>
                    Select reason
                  </option>
                  {reasons.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Summary
                <textarea
                  rows={4}
                  value={draft.summary}
                  onChange={handleChange('summary')}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                  placeholder="Short description"
                  required
                />
              </label>

              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Priority
                <select
                  value={draft.priority}
                  onChange={handleChange('priority')}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                >
                  {priorities.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Client deadline
                  <input
                    type="datetime-local"
                    value={draft.customerDeadlineAt}
                    onChange={handleChange('customerDeadlineAt')}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                  />
                </label>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Your deadline
                  <input
                    type="datetime-local"
                    value={draft.providerDeadlineAt}
                    onChange={handleChange('providerDeadlineAt')}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                  />
                </label>
              </div>

              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Notes for record
                <textarea
                  rows={3}
                  value={draft.metadataNotes}
                  onChange={handleChange('metadataNotes')}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                  placeholder="Optional"
                />
              </label>

              {error ? (
                <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-600">{error.message}</p>
              ) : null}
            </form>
          ) : null}
        </div>
      </section>
    </div>
  );
}
