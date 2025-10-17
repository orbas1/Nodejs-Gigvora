import { useMemo, useState } from 'react';
import {
  PAY_FREQUENCIES,
  PAY_STATUSES,
  resolveOptionLabel,
} from '../../../constants/agencyWorkforce.js';

function formatDateValue(value) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
}

function PayDelegationForm({ initialData, members, onSubmit, onCancel, submitLabel, canDelete, onDelete }) {
  const [formState, setFormState] = useState(() => ({
    workspaceId: initialData?.workspaceId ?? null,
    memberId: initialData?.memberId ?? (members[0]?.id ?? ''),
    frequency: initialData?.frequency ?? 'monthly',
    amount: initialData?.amount ?? 0,
    currency: initialData?.currency ?? 'USD',
    status: initialData?.status ?? 'scheduled',
    nextPayDate: formatDateValue(initialData?.nextPayDate),
    payoutMethod: initialData?.payoutMethod ?? '',
    memo: initialData?.memo ?? '',
  }));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!onSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        ...formState,
        amount: Number.parseFloat(formState.amount ?? 0),
        memberId: Number(formState.memberId),
        workspaceId: initialData?.workspaceId ?? formState.workspaceId,
        nextPayDate: formState.nextPayDate ? new Date(formState.nextPayDate) : null,
      };
      await onSubmit(payload);
    } catch (submissionError) {
      setError(submissionError?.message ?? 'Unable to save pay delegation');
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 py-8">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <form onSubmit={handleSubmit} className="flex h-full flex-col">
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{submitLabel}</h3>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="rounded-full border border-slate-200 px-3 py-1 text-sm font-semibold text-slate-500 transition hover:border-blue-200 hover:text-blue-600"
            >
              Close
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <div className="grid gap-4">
              <label className="flex flex-col text-sm font-medium text-slate-700">
                Member
                <select
                  name="memberId"
                  value={formState.memberId}
                  onChange={handleChange}
                  className="mt-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                >
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.fullName}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col text-sm font-medium text-slate-700">
                  Amount
                  <input
                    type="number"
                    name="amount"
                    value={formState.amount}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="mt-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                  />
                </label>
                <label className="flex flex-col text-sm font-medium text-slate-700">
                  Currency
                  <input
                    name="currency"
                    value={formState.currency}
                    onChange={handleChange}
                    maxLength={3}
                    className="mt-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm uppercase focus:border-blue-400 focus:outline-none"
                  />
                </label>
              </div>
              <label className="flex flex-col text-sm font-medium text-slate-700">
                Frequency
                <select
                  name="frequency"
                  value={formState.frequency}
                  onChange={handleChange}
                  className="mt-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                >
                  {PAY_FREQUENCIES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col text-sm font-medium text-slate-700">
                Status
                <select
                  name="status"
                  value={formState.status}
                  onChange={handleChange}
                  className="mt-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                >
                  {PAY_STATUSES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col text-sm font-medium text-slate-700">
                Next pay date
                <input
                  type="date"
                  name="nextPayDate"
                  value={formState.nextPayDate}
                  onChange={handleChange}
                  className="mt-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                />
              </label>
              <label className="flex flex-col text-sm font-medium text-slate-700">
                Payout method
                <input
                  name="payoutMethod"
                  value={formState.payoutMethod}
                  onChange={handleChange}
                  placeholder="Wire, ACH, Transferwise"
                  className="mt-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                />
              </label>
              <label className="flex flex-col text-sm font-medium text-slate-700">
                Notes
                <textarea
                  name="memo"
                  value={formState.memo}
                  onChange={handleChange}
                  rows={3}
                  className="mt-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                />
              </label>
            </div>
            {error ? <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p> : null}
          </div>
          <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            {canDelete ? (
              <button
                type="button"
                onClick={onDelete}
                className="inline-flex items-center justify-center rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700"
              >
                Remove schedule
              </button>
            ) : (
              <span className="text-xs text-slate-400">&nbsp;</span>
            )}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={onCancel}
                className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-500 transition hover:border-blue-200 hover:text-blue-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center rounded-full border border-blue-500 bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
              >
                {submitting ? 'Saving…' : submitLabel}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PayDelegationsPanel({
  delegations = [],
  members = [],
  workspaceId,
  canEdit = false,
  onCreate,
  onUpdate,
  onDelete,
}) {
  const [modalState, setModalState] = useState({ open: false, delegationId: null, mode: 'create' });
  const [statusFilter, setStatusFilter] = useState('all');

  const memberLookup = useMemo(() => {
    const map = new Map();
    members.forEach((member) => {
      map.set(member.id, member);
    });
    return map;
  }, [members]);

  const filteredDelegations = useMemo(() => {
    let records = Array.isArray(delegations) ? [...delegations] : [];
    if (statusFilter !== 'all') {
      records = records.filter((delegation) => delegation.status === statusFilter);
    }
    return records.sort((a, b) => (a.nextPayDate || '').localeCompare(b.nextPayDate || ''));
  }, [delegations, statusFilter]);

  const openCreate = () => setModalState({ open: true, delegationId: null, mode: 'create' });
  const openEdit = (delegationId) => setModalState({ open: true, delegationId, mode: 'edit' });
  const closeModal = () => setModalState({ open: false, delegationId: null, mode: 'create' });

  const activeDelegation = useMemo(() => {
    if (!modalState.open) return null;
    if (modalState.mode === 'create') {
      return { workspaceId, memberId: members[0]?.id ?? null };
    }
    return delegations.find((delegation) => delegation.id === modalState.delegationId) ?? null;
  }, [modalState, delegations, workspaceId, members]);

  const handleCreate = async (payload) => {
    if (!onCreate) return;
    await onCreate({ ...payload, workspaceId: workspaceId ?? payload.workspaceId });
    closeModal();
  };

  const handleUpdate = async (payload) => {
    if (!onUpdate || !modalState.delegationId) return;
    await onUpdate(modalState.delegationId, { ...payload, workspaceId: workspaceId ?? payload.workspaceId });
    closeModal();
  };

  const handleDelete = async () => {
    if (!onDelete || !modalState.delegationId) return;
    await onDelete(modalState.delegationId, { workspaceId });
    closeModal();
  };

  return (
    <section id="pay" className="space-y-4 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-slate-900">Pay</h2>
        {canEdit ? (
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center justify-center rounded-full border border-blue-500 bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Add payout
          </button>
        ) : null}
      </div>
      <div className="flex items-center gap-3 rounded-2xl bg-slate-50/80 p-4 text-sm">
        <span className="text-slate-500">Status</span>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-full border border-slate-200 px-3 py-1 text-sm focus:border-blue-300 focus:outline-none"
        >
          <option value="all">All</option>
          {PAY_STATUSES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      {!filteredDelegations.length ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white/70 p-8 text-center text-sm font-medium text-slate-600">
          No pay items.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-slate-500">Member</th>
                <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-slate-500">Amount</th>
                <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-slate-500">Frequency</th>
                <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-slate-500">Next pay date</th>
                <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-slate-500">Status</th>
                <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white/70">
              {filteredDelegations.map((delegation) => {
                const member = memberLookup.get(delegation.memberId);
                return (
                  <tr key={delegation.id} className="hover:bg-blue-50/40">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{member?.fullName ?? '—'}</div>
                      <div className="text-xs text-slate-500">{delegation.payoutMethod || 'No payout method'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-slate-900">
                        {delegation.amount != null
                          ? `${delegation.currency ?? 'USD'} ${Number(delegation.amount).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}`
                          : '—'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {resolveOptionLabel(PAY_FREQUENCIES, delegation.frequency, delegation.frequency)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {delegation.nextPayDate ? new Date(delegation.nextPayDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                        {resolveOptionLabel(PAY_STATUSES, delegation.status, delegation.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(delegation.id)}
                          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600"
                        >
                          View
                        </button>
                        {canEdit ? (
                          <button
                            type="button"
                            onClick={() => openEdit(delegation.id)}
                            className="rounded-full border border-blue-500 bg-blue-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-blue-700"
                          >
                            Edit
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {modalState.open ? (
        <PayDelegationForm
          key={modalState.delegationId ?? 'new-delegation'}
          initialData={activeDelegation}
          members={members}
          submitLabel={modalState.mode === 'create' ? 'Create payout plan' : 'Save changes'}
          onSubmit={modalState.mode === 'create' ? handleCreate : handleUpdate}
          onCancel={closeModal}
          canDelete={modalState.mode === 'edit' && canEdit}
          onDelete={canEdit ? handleDelete : undefined}
        />
      ) : null}
    </section>
  );
}
