import { useMemo, useState } from 'react';
import { AVAILABILITY_STATUSES, resolveOptionLabel } from '../../../constants/agencyWorkforce.js';

function formatDateValue(value) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
}

function AvailabilityForm({ initialData, members, onSubmit, onCancel, submitLabel, canDelete, onDelete }) {
  const [formState, setFormState] = useState(() => ({
    workspaceId: initialData?.workspaceId ?? null,
    memberId: initialData?.memberId ?? (members[0]?.id ?? ''),
    date: formatDateValue(initialData?.date) || formatDateValue(new Date()),
    status: initialData?.status ?? 'available',
    availableHours: initialData?.availableHours ?? '',
    reason: initialData?.reason ?? '',
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
        memberId: Number(formState.memberId),
        availableHours: formState.availableHours === '' ? null : Number.parseFloat(formState.availableHours),
        date: formState.date ? new Date(formState.date) : new Date(),
      };
      await onSubmit(payload);
    } catch (submissionError) {
      setError(submissionError?.message ?? 'Unable to save availability entry');
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
            <div className="grid gap-4 md:grid-cols-2">
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
              <label className="flex flex-col text-sm font-medium text-slate-700">
                Date
                <input
                  type="date"
                  name="date"
                  value={formState.date}
                  onChange={handleChange}
                  className="mt-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                />
              </label>
              <label className="flex flex-col text-sm font-medium text-slate-700">
                Status
                <select
                  name="status"
                  value={formState.status}
                  onChange={handleChange}
                  className="mt-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                >
                  {AVAILABILITY_STATUSES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col text-sm font-medium text-slate-700">
                Available hours
                <input
                  type="number"
                  name="availableHours"
                  value={formState.availableHours}
                  onChange={handleChange}
                  min="0"
                  max="24"
                  step="0.5"
                  className="mt-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                />
              </label>
              <label className="flex flex-col text-sm font-medium text-slate-700 md:col-span-2">
                Reason / notes
                <textarea
                  name="reason"
                  value={formState.reason}
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
                Remove entry
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

export default function AvailabilityPanel({
  availability = [],
  members = [],
  workspaceId,
  canEdit = false,
  onCreate,
  onUpdate,
  onDelete,
}) {
  const [modalState, setModalState] = useState({ open: false, entryId: null, mode: 'create' });

  const memberLookup = useMemo(() => {
    const map = new Map();
    members.forEach((member) => map.set(member.id, member));
    return map;
  }, [members]);

  const flattenedEntries = useMemo(() => {
    const entries = [];
    (availability ?? []).forEach((group) => {
      group.entries?.forEach((entry) => {
        entries.push(entry);
      });
    });
    return entries.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [availability]);

  const openCreate = () => setModalState({ open: true, entryId: null, mode: 'create' });
  const openEdit = (entryId) => setModalState({ open: true, entryId, mode: 'edit' });
  const closeModal = () => setModalState({ open: false, entryId: null, mode: 'create' });

  const activeEntry = useMemo(() => {
    if (!modalState.open) return null;
    if (modalState.mode === 'create') {
      return { workspaceId, memberId: members[0]?.id ?? null };
    }
    return flattenedEntries.find((entry) => entry.id === modalState.entryId) ?? null;
  }, [modalState, flattenedEntries, workspaceId, members]);

  const handleCreate = async (payload) => {
    if (!onCreate) return;
    await onCreate({ ...payload, workspaceId: workspaceId ?? payload.workspaceId });
    closeModal();
  };

  const handleUpdate = async (payload) => {
    if (!onUpdate || !modalState.entryId) return;
    await onUpdate(modalState.entryId, { ...payload, workspaceId: workspaceId ?? payload.workspaceId });
    closeModal();
  };

  const handleDelete = async () => {
    if (!onDelete || !modalState.entryId) return;
    await onDelete(modalState.entryId, { workspaceId });
    closeModal();
  };

  return (
    <section id="availability" className="space-y-4 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-slate-900">Availability</h2>
        {canEdit ? (
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center justify-center rounded-full border border-blue-500 bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Add entry
          </button>
        ) : null}
      </div>
      {!flattenedEntries.length ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white/70 p-8 text-center text-sm font-medium text-slate-600">
          No availability records.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-slate-500">Member</th>
                <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-slate-500">Date</th>
                <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-slate-500">Status</th>
                <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-slate-500">Hours</th>
                <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-slate-500">Notes</th>
                <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white/70">
              {flattenedEntries.map((entry) => {
                const member = memberLookup.get(entry.memberId);
                return (
                  <tr key={entry.id} className="hover:bg-blue-50/40">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{member?.fullName ?? '—'}</div>
                      <div className="text-xs text-slate-500">{member?.title ?? ''}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{entry.date ? new Date(entry.date).toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        {resolveOptionLabel(AVAILABILITY_STATUSES, entry.status, entry.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{entry.availableHours ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-500">{entry.reason || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(entry.id)}
                          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600"
                        >
                          View
                        </button>
                        {canEdit ? (
                          <button
                            type="button"
                            onClick={() => openEdit(entry.id)}
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
        <AvailabilityForm
          key={modalState.entryId ?? 'new-availability'}
          initialData={activeEntry}
          members={members}
          submitLabel={modalState.mode === 'create' ? 'Log availability' : 'Save changes'}
          onSubmit={modalState.mode === 'create' ? handleCreate : handleUpdate}
          onCancel={closeModal}
          canDelete={modalState.mode === 'edit' && canEdit}
          onDelete={canEdit ? handleDelete : undefined}
        />
      ) : null}
    </section>
  );
}
