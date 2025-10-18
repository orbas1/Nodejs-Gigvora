import { useEffect, useMemo, useState } from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  declined: 'bg-rose-100 text-rose-700',
  posted: 'bg-blue-100 text-blue-700',
};

const DEFAULT_ADJUSTMENT = {
  reference: '',
  adjustmentType: 'correction',
  amount: '',
  currency: 'USD',
  reason: '',
  accountReference: '',
  status: 'pending',
  supportingDocumentUrl: '',
  notes: '',
  effectiveOn: '',
};

function AdjustmentModal({ open, adjustment, onClose, onSubmit, onDelete, saving, error }) {
  const [form, setForm] = useState(adjustment ?? DEFAULT_ADJUSTMENT);

  useEffect(() => {
    if (!open) {
      return;
    }
    setForm({
      ...DEFAULT_ADJUSTMENT,
      ...adjustment,
      amount: adjustment?.amount ?? '',
    });
  }, [open, adjustment]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const payload = {
      reference: form.reference || undefined,
      adjustmentType: form.adjustmentType || 'correction',
      amount: form.amount === '' ? undefined : Number(form.amount),
      currency: form.currency.trim().toUpperCase(),
      reason: form.reason || undefined,
      accountReference: form.accountReference || undefined,
      status: form.status || 'pending',
      supportingDocumentUrl: form.supportingDocumentUrl || undefined,
      notes: form.notes || undefined,
      effectiveOn: form.effectiveOn || undefined,
    };
    onSubmit(payload);
  };

  const handleDelete = () => {
    if (!onDelete) return;
    if (typeof window !== 'undefined') {
      const confirmed = window.confirm('Discard this adjustment request?');
      if (!confirmed) {
        return;
      }
    }
    onDelete();
  };

  if (!open) {
    return null;
  }

  const isPosted = adjustment?.status === 'posted';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-6">
      <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{adjustment ? `Edit ${adjustment.reference}` : 'New treasury adjustment'}</h3>
            <p className="mt-1 text-sm text-slate-600">Capture manual corrections, fee reversals, or treasury adjustments.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 bg-white p-1 text-slate-500 hover:text-slate-700"
          >
            <XMarkIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <form className="mt-4 grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col">
              <span className="text-sm font-semibold text-slate-700">Amount</span>
              <input
                type="number"
                name="amount"
                value={form.amount}
                onChange={handleChange}
                min="0"
                step="0.01"
                required
                disabled={isPosted}
                className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm disabled:bg-slate-100 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
            <label className="flex flex-col">
              <span className="text-sm font-semibold text-slate-700">Currency</span>
              <input
                type="text"
                name="currency"
                value={form.currency}
                onChange={handleChange}
                maxLength={3}
                disabled={isPosted}
                className="mt-1 uppercase tracking-wide rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm disabled:bg-slate-100 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
          </div>
          <label className="flex flex-col">
            <span className="text-sm font-semibold text-slate-700">Adjustment type</span>
            <select
              name="adjustmentType"
              value={form.adjustmentType}
              onChange={handleChange}
              disabled={isPosted}
              className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm disabled:bg-slate-100 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="correction">Correction</option>
              <option value="credit">Credit</option>
              <option value="debit">Debit</option>
              <option value="fee_reversal">Fee reversal</option>
            </select>
          </label>
          <label className="flex flex-col">
            <span className="text-sm font-semibold text-slate-700">Reason</span>
            <textarea
              name="reason"
              value={form.reason}
              onChange={handleChange}
              rows={3}
              disabled={isPosted}
              className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm disabled:bg-slate-100 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Explain why this manual adjustment is required."
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col">
              <span className="text-sm font-semibold text-slate-700">Account reference</span>
              <input
                type="text"
                name="accountReference"
                value={form.accountReference}
                onChange={handleChange}
                disabled={isPosted}
                placeholder="Escrow account or wallet ID"
                className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm disabled:bg-slate-100 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
            <label className="flex flex-col">
              <span className="text-sm font-semibold text-slate-700">Effective on</span>
              <input
                type="date"
                name="effectiveOn"
                value={form.effectiveOn ?? ''}
                onChange={handleChange}
                disabled={isPosted}
                className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm disabled:bg-slate-100 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col">
              <span className="text-sm font-semibold text-slate-700">Status</span>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="declined">Declined</option>
                <option value="posted">Posted</option>
              </select>
            </label>
            <label className="flex flex-col">
              <span className="text-sm font-semibold text-slate-700">Supporting document URL</span>
              <input
                type="url"
                name="supportingDocumentUrl"
                value={form.supportingDocumentUrl}
                onChange={handleChange}
                className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="https://..."
              />
            </label>
          </div>
          <label className="flex flex-col">
            <span className="text-sm font-semibold text-slate-700">Notes</span>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={3}
              className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </label>
          {error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}
          <div className="flex items-center justify-between gap-3">
            {onDelete && !isPosted ? (
              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-50"
              >
                <ExclamationTriangleIcon className="h-4 w-4" aria-hidden="true" /> Delete
              </button>
            ) : <span />}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {saving ? 'Saving…' : 'Save adjustment'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EscrowAdjustmentManager({ adjustments, onCreate, onUpdate, onDelete, formatCurrency, formatDate }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAdjustment, setEditingAdjustment] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!success) {
      return undefined;
    }
    const timeout = setTimeout(() => setSuccess(''), 3000);
    return () => clearTimeout(timeout);
  }, [success]);

  const normalizedAdjustments = useMemo(() => (Array.isArray(adjustments) ? adjustments : []), [adjustments]);

  const openModal = (adjustment = null) => {
    setEditingAdjustment(adjustment);
    setModalOpen(true);
    setError('');
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingAdjustment(null);
    setError('');
  };

  const handleSubmit = async (payload) => {
    setSaving(true);
    setError('');
    try {
      if (editingAdjustment) {
        await onUpdate(editingAdjustment.id, payload);
        setSuccess('Adjustment updated.');
      } else {
        await onCreate(payload);
        setSuccess('Adjustment submitted for approval.');
      }
      setModalOpen(false);
      setEditingAdjustment(null);
    } catch (err) {
      setError(err?.message ?? 'Unable to save adjustment.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingAdjustment) return;
    setSaving(true);
    setError('');
    try {
      await onDelete(editingAdjustment.id);
      setSuccess('Adjustment removed.');
      setModalOpen(false);
      setEditingAdjustment(null);
    } catch (err) {
      setError(err?.message ?? 'Unable to delete adjustment.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section id="finance-escrow-adjustments" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-blue-100/40 sm:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Escrow adjustments & approvals</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Track manual adjustments, fee reversals, and treasury corrections requiring approval.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <button
            type="button"
            onClick={() => openModal()}
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500"
          >
            <PlusIcon className="h-5 w-5" aria-hidden="true" /> New adjustment
          </button>
          {success ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
              <CheckCircleIcon className="h-4 w-4" aria-hidden="true" /> {success}
            </span>
          ) : null}
        </div>
      </div>

      {error ? <p className="mt-4 text-sm font-semibold text-rose-600">{error}</p> : null}

      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50/80">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Reference</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Amount</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Account</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Effective</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {normalizedAdjustments.length ? (
              normalizedAdjustments.map((adjustment) => {
                const badgeClass = STATUS_COLORS[adjustment.status] ?? 'bg-slate-200 text-slate-600';
                return (
                  <tr key={adjustment.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{adjustment.reference}</div>
                      <div className="text-xs text-slate-500">{adjustment.adjustmentType}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{formatCurrency(adjustment.amount, adjustment.currency)}</div>
                      {adjustment.reason ? <div className="text-xs text-slate-500">{adjustment.reason}</div> : null}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">{adjustment.accountReference || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${badgeClass}`}>
                        {adjustment.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">{adjustment.effectiveOn ? formatDate(adjustment.effectiveOn) : 'Pending'}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openModal(adjustment)}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-500"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm text-slate-500">
                  No adjustments logged.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AdjustmentModal
        open={modalOpen}
        adjustment={editingAdjustment}
        onClose={closeModal}
        onSubmit={handleSubmit}
        onDelete={editingAdjustment ? handleDelete : null}
        saving={saving}
        error={error}
      />
    </section>
  );
}
