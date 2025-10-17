import { useMemo, useState } from 'react';

function formatDateValue(value) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
}

function CapacitySnapshotForm({ initialData, onSubmit, onCancel, submitLabel, canDelete, onDelete }) {
  const [formState, setFormState] = useState(() => ({
    workspaceId: initialData?.workspaceId ?? null,
    recordedFor: formatDateValue(initialData?.recordedFor) || formatDateValue(new Date()),
    totalHeadcount: initialData?.totalHeadcount ?? 0,
    activeAssignments: initialData?.activeAssignments ?? 0,
    availableHours: initialData?.availableHours ?? 0,
    allocatedHours: initialData?.allocatedHours ?? 0,
    benchHours: initialData?.benchHours ?? 0,
    utilizationPercent: initialData?.utilizationPercent ?? 0,
    notes: initialData?.notes ?? '',
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
        recordedFor: formState.recordedFor ? new Date(formState.recordedFor) : new Date(),
        totalHeadcount: Number.parseInt(formState.totalHeadcount ?? 0, 10),
        activeAssignments: Number.parseInt(formState.activeAssignments ?? 0, 10),
        availableHours: Number.parseFloat(formState.availableHours ?? 0),
        allocatedHours: Number.parseFloat(formState.allocatedHours ?? 0),
        benchHours: Number.parseFloat(formState.benchHours ?? 0),
        utilizationPercent: Number.parseFloat(formState.utilizationPercent ?? 0),
      };
      await onSubmit(payload);
    } catch (submissionError) {
      setError(submissionError?.message ?? 'Unable to save capacity snapshot');
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
                Snapshot date
                <input
                  type="date"
                  name="recordedFor"
                  value={formState.recordedFor}
                  onChange={handleChange}
                  className="mt-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                />
              </label>
              <label className="flex flex-col text-sm font-medium text-slate-700">
                Total headcount
                <input
                  type="number"
                  name="totalHeadcount"
                  value={formState.totalHeadcount}
                  onChange={handleChange}
                  min="0"
                  step="1"
                  className="mt-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                />
              </label>
              <label className="flex flex-col text-sm font-medium text-slate-700">
                Active assignments
                <input
                  type="number"
                  name="activeAssignments"
                  value={formState.activeAssignments}
                  onChange={handleChange}
                  min="0"
                  step="1"
                  className="mt-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                />
              </label>
              <label className="flex flex-col text-sm font-medium text-slate-700">
                Utilisation (%)
                <input
                  type="number"
                  name="utilizationPercent"
                  value={formState.utilizationPercent}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  step="0.5"
                  className="mt-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                />
              </label>
              <label className="flex flex-col text-sm font-medium text-slate-700">
                Available hours
                <input
                  type="number"
                  name="availableHours"
                  value={formState.availableHours}
                  onChange={handleChange}
                  min="0"
                  step="0.5"
                  className="mt-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                />
              </label>
              <label className="flex flex-col text-sm font-medium text-slate-700">
                Allocated hours
                <input
                  type="number"
                  name="allocatedHours"
                  value={formState.allocatedHours}
                  onChange={handleChange}
                  min="0"
                  step="0.5"
                  className="mt-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                />
              </label>
              <label className="flex flex-col text-sm font-medium text-slate-700">
                Bench hours
                <input
                  type="number"
                  name="benchHours"
                  value={formState.benchHours}
                  onChange={handleChange}
                  min="0"
                  step="0.5"
                  className="mt-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                />
              </label>
              <label className="flex flex-col text-sm font-medium text-slate-700 md:col-span-2">
                Notes / commentary
                <textarea
                  name="notes"
                  value={formState.notes}
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
                Remove snapshot
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

export default function CapacitySnapshotsPanel({
  snapshots = [],
  workspaceId,
  canEdit = false,
  onCreate,
  onUpdate,
  onDelete,
}) {
  const [modalState, setModalState] = useState({ open: false, snapshotId: null, mode: 'create' });

  const sortedSnapshots = useMemo(() => {
    return [...(snapshots ?? [])].sort((a, b) => (b.recordedFor || '').localeCompare(a.recordedFor || ''));
  }, [snapshots]);

  const openCreate = () => setModalState({ open: true, snapshotId: null, mode: 'create' });
  const openEdit = (snapshotId) => setModalState({ open: true, snapshotId, mode: 'edit' });
  const closeModal = () => setModalState({ open: false, snapshotId: null, mode: 'create' });

  const activeSnapshot = useMemo(() => {
    if (!modalState.open) return null;
    if (modalState.mode === 'create') {
      return { workspaceId };
    }
    return snapshots.find((snapshot) => snapshot.id === modalState.snapshotId) ?? null;
  }, [modalState, snapshots, workspaceId]);

  const handleCreate = async (payload) => {
    if (!onCreate) return;
    await onCreate({ ...payload, workspaceId: workspaceId ?? payload.workspaceId });
    closeModal();
  };

  const handleUpdate = async (payload) => {
    if (!onUpdate || !modalState.snapshotId) return;
    await onUpdate(modalState.snapshotId, { ...payload, workspaceId: workspaceId ?? payload.workspaceId });
    closeModal();
  };

  const handleDelete = async () => {
    if (!onDelete || !modalState.snapshotId) return;
    await onDelete(modalState.snapshotId, { workspaceId });
    closeModal();
  };

  return (
    <section id="capacity" className="space-y-4 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-slate-900">Capacity</h2>
        {canEdit ? (
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center justify-center rounded-full border border-blue-500 bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            New snapshot
          </button>
        ) : null}
      </div>
      {!sortedSnapshots.length ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white/70 p-8 text-center text-sm font-medium text-slate-600">
          No capacity records.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sortedSnapshots.map((snapshot) => (
            <article
              key={snapshot.id}
              className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-slate-50/80 p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md"
            >
              <div className="flex items-center justify-between text-sm text-slate-500">
                <span>{snapshot.recordedFor ? new Date(snapshot.recordedFor).toLocaleDateString() : '—'}</span>
                {canEdit ? (
                  <button
                    type="button"
                    onClick={() => openEdit(snapshot.id)}
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600"
                  >
                    Manage
                  </button>
                ) : null}
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm text-slate-600">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Headcount</p>
                  <p className="mt-1 text-base font-semibold text-slate-900">{snapshot.totalHeadcount}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Active assignments</p>
                  <p className="mt-1 text-base font-semibold text-slate-900">{snapshot.activeAssignments}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Available hours</p>
                  <p className="mt-1 text-base font-semibold text-slate-900">{snapshot.availableHours}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Allocated hours</p>
                  <p className="mt-1 text-base font-semibold text-slate-900">{snapshot.allocatedHours}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Bench hours</p>
                  <p className="mt-1 text-base font-semibold text-slate-900">{snapshot.benchHours}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Utilisation</p>
                  <p className="mt-1 text-base font-semibold text-slate-900">{snapshot.utilizationPercent}%</p>
                </div>
              </div>
              {snapshot.notes ? (
                <p className="rounded-2xl bg-white px-3 py-2 text-xs text-slate-500">{snapshot.notes}</p>
              ) : null}
            </article>
          ))}
        </div>
      )}
      {modalState.open ? (
        <CapacitySnapshotForm
          key={modalState.snapshotId ?? 'new-capacity'}
          initialData={activeSnapshot}
          submitLabel={modalState.mode === 'create' ? 'Record capacity snapshot' : 'Save changes'}
          onSubmit={modalState.mode === 'create' ? handleCreate : handleUpdate}
          onCancel={closeModal}
          canDelete={modalState.mode === 'edit' && canEdit}
          onDelete={canEdit ? handleDelete : undefined}
        />
      ) : null}
    </section>
  );
}
