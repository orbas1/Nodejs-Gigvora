import { Fragment, useEffect, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  DEFAULT_APPLICATION,
  toDateInput,
  parseSkills,
  serialiseSkills,
} from './helpers.js';

function ApplicationFormModal({
  open,
  mode,
  metadata,
  initialValue,
  onClose,
  onSubmit,
  submitting,
}) {
  const [form, setForm] = useState(DEFAULT_APPLICATION);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      setForm({
        ...DEFAULT_APPLICATION,
        ...initialValue,
        skills: serialiseSkills(initialValue?.skills),
        appliedAt: toDateInput(initialValue?.appliedAt),
        targetStartDate: toDateInput(initialValue?.targetStartDate),
      });
      setError(null);
    }
  }, [initialValue, open]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    try {
      await onSubmit({
        ...form,
        skills: parseSkills(form.skills),
        appliedAt: form.appliedAt || null,
        targetStartDate: form.targetStartDate || null,
        hoursPerWeek: form.hoursPerWeek || null,
      });
      onClose();
    } catch (err) {
      const message = err?.message ?? 'Unable to save application.';
      setError(message);
    }
  };

  const title = mode === 'edit' ? 'Edit application' : 'New application';

  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-30" onClose={submitting ? () => {} : onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/40" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-6">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-3xl rounded-3xl bg-white p-8 shadow-xl">
                <div className="flex items-center justify-between">
                  <Dialog.Title className="text-lg font-semibold text-slate-900">{title}</Dialog.Title>
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={submitting}
                    className="rounded-full px-3 py-1 text-sm font-semibold text-slate-500 hover:bg-slate-100 disabled:opacity-50"
                  >
                    Close
                  </button>
                </div>
                <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-1 text-sm text-slate-600">
                      <span className="font-medium text-slate-900">Title</span>
                      <input
                        required
                        name="title"
                        value={form.title}
                        onChange={handleChange}
                        className="w-full rounded-2xl border border-slate-200 px-4 py-2 focus:border-blue-500 focus:outline-none"
                      />
                    </label>
                    <label className="space-y-1 text-sm text-slate-600">
                      <span className="font-medium text-slate-900">Organisation</span>
                      <input
                        required
                        name="organizationName"
                        value={form.organizationName}
                        onChange={handleChange}
                        className="w-full rounded-2xl border border-slate-200 px-4 py-2 focus:border-blue-500 focus:outline-none"
                      />
                    </label>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <label className="space-y-1 text-sm text-slate-600">
                      <span className="font-medium text-slate-900">Focus</span>
                      <input
                        name="focusArea"
                        value={form.focusArea}
                        onChange={handleChange}
                        className="w-full rounded-2xl border border-slate-200 px-4 py-2 focus:border-blue-500 focus:outline-none"
                      />
                    </label>
                    <label className="space-y-1 text-sm text-slate-600">
                      <span className="font-medium text-slate-900">Location</span>
                      <input
                        name="location"
                        value={form.location}
                        onChange={handleChange}
                        className="w-full rounded-2xl border border-slate-200 px-4 py-2 focus:border-blue-500 focus:outline-none"
                      />
                    </label>
                    <label className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-600">
                      <span className="font-medium text-slate-900">Remote</span>
                      <input
                        name="remoteFriendly"
                        type="checkbox"
                        checked={Boolean(form.remoteFriendly)}
                        onChange={handleChange}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </label>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <label className="space-y-1 text-sm text-slate-600">
                      <span className="font-medium text-slate-900">Applied</span>
                      <input
                        type="date"
                        name="appliedAt"
                        value={form.appliedAt}
                        onChange={handleChange}
                        className="w-full rounded-2xl border border-slate-200 px-4 py-2 focus:border-blue-500 focus:outline-none"
                      />
                    </label>
                    <label className="space-y-1 text-sm text-slate-600">
                      <span className="font-medium text-slate-900">Start</span>
                      <input
                        type="date"
                        name="targetStartDate"
                        value={form.targetStartDate}
                        onChange={handleChange}
                        className="w-full rounded-2xl border border-slate-200 px-4 py-2 focus:border-blue-500 focus:outline-none"
                      />
                    </label>
                    <label className="space-y-1 text-sm text-slate-600">
                      <span className="font-medium text-slate-900">Hours / week</span>
                      <input
                        type="number"
                        name="hoursPerWeek"
                        value={form.hoursPerWeek}
                        onChange={handleChange}
                        min="0"
                        step="0.5"
                        className="w-full rounded-2xl border border-slate-200 px-4 py-2 focus:border-blue-500 focus:outline-none"
                      />
                    </label>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-1 text-sm text-slate-600">
                      <span className="font-medium text-slate-900">Status</span>
                      <select
                        name="status"
                        value={form.status}
                        onChange={handleChange}
                        className="w-full rounded-2xl border border-slate-200 px-4 py-2 focus:border-blue-500 focus:outline-none"
                      >
                        {(metadata?.statusOptions ?? []).map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1 text-sm text-slate-600">
                      <span className="font-medium text-slate-900">Cover image</span>
                      <input
                        name="coverImageUrl"
                        value={form.coverImageUrl}
                        onChange={handleChange}
                        placeholder="https://"
                        className="w-full rounded-2xl border border-slate-200 px-4 py-2 focus:border-blue-500 focus:outline-none"
                      />
                    </label>
                  </div>
                  <label className="space-y-1 text-sm text-slate-600">
                    <span className="font-medium text-slate-900">Impact</span>
                    <textarea
                      name="impactSummary"
                      value={form.impactSummary}
                      onChange={handleChange}
                      rows={3}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-2 focus:border-blue-500 focus:outline-none"
                    />
                  </label>
                  <label className="space-y-1 text-sm text-slate-600">
                    <span className="font-medium text-slate-900">Skills</span>
                    <input
                      name="skills"
                      value={form.skills}
                      onChange={handleChange}
                      placeholder="Design, Strategy"
                      className="w-full rounded-2xl border border-slate-200 px-4 py-2 focus:border-blue-500 focus:outline-none"
                    />
                  </label>
                  <label className="space-y-1 text-sm text-slate-600">
                    <span className="font-medium text-slate-900">Notes</span>
                    <textarea
                      name="notes"
                      value={form.notes}
                      onChange={handleChange}
                      rows={3}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-2 focus:border-blue-500 focus:outline-none"
                    />
                  </label>
                  {error ? <p className="text-sm text-rose-600">{error}</p> : null}
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={submitting}
                      className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="rounded-2xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
                    >
                      {submitting ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

function ApplicationDetailModal({ open, record, onClose, onEdit, onViewResponses }) {
  if (!record) {
    return null;
  }

  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-20" onClose={onClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-slate-900/40" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-6">
            <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="w-full max-w-4xl rounded-3xl bg-white p-8 shadow-xl">
                <div className="flex items-center justify-between">
                  <Dialog.Title className="text-lg font-semibold text-slate-900">{record.title}</Dialog.Title>
                  <button type="button" onClick={onClose} className="rounded-full px-3 py-1 text-sm font-semibold text-slate-500 hover:bg-slate-100">
                    Close
                  </button>
                </div>
                <div className="mt-6 grid gap-6 md:grid-cols-2">
                  <div className="space-y-4 text-sm text-slate-600">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Organisation</p>
                      <p className="mt-1 text-base font-medium text-slate-900">{record.organizationName}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Focus</p>
                      <p>{record.focusArea || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Location</p>
                      <p>{record.location || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</p>
                      <p>{record.status}</p>
                    </div>
                  </div>
                  <div className="space-y-4 text-sm text-slate-600">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Timeline</p>
                      <p className="mt-1">Applied {toDateInput(record.appliedAt) || '—'} · Start {toDateInput(record.targetStartDate) || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Remote</p>
                      <p>{record.remoteFriendly ? 'Yes' : 'No'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Hours / week</p>
                      <p>{record.hoursPerWeek ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Skills</p>
                      <p>{(record.skills ?? []).join(', ') || '—'}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-6 space-y-4 text-sm text-slate-600">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Impact</p>
                    <p className="mt-1 text-slate-700">{record.impactSummary || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Notes</p>
                    <p className="mt-1 text-slate-700">{record.notes || '—'}</p>
                  </div>
                </div>
                <div className="mt-8 flex flex-wrap justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => onViewResponses(record)}
                    className="rounded-2xl border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50"
                  >
                    Responses
                  </button>
                  <button
                    type="button"
                    onClick={() => onEdit(record)}
                    className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Edit
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

export default function ApplicationsPanel({ applications = [], metadata, mutating, onCreate, onUpdate, onDelete, onOpenResponses }) {
  const [formState, setFormState] = useState({ open: false, mode: 'create', record: DEFAULT_APPLICATION });
  const [detail, setDetail] = useState({ open: false, record: null });

  const orderedApplications = useMemo(
    () => [...applications].sort((a, b) => {
      const aTime = new Date(b.appliedAt ?? b.createdAt ?? 0).getTime();
      const bTime = new Date(a.appliedAt ?? a.createdAt ?? 0).getTime();
      return aTime - bTime;
    }),
    [applications],
  );

  const openCreate = () => {
    setFormState({ open: true, mode: 'create', record: DEFAULT_APPLICATION });
  };

  const openEdit = (record) => {
    setFormState({ open: true, mode: 'edit', record });
  };

  const closeForm = () => setFormState((state) => ({ ...state, open: false }));

  const closeDetail = () => setDetail({ open: false, record: null });

  const handleSubmit = async (payload) => {
    if (formState.mode === 'edit' && formState.record?.id) {
      await onUpdate(formState.record.id, payload);
    } else {
      await onCreate(payload);
    }
  };

  const handleDelete = async (record) => {
    if (!record?.id) return;
    const confirmDelete = window.confirm('Delete this application?');
    if (!confirmDelete) return;
    await onDelete(record.id);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-900">Applications</h3>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
        >
          New
        </button>
      </div>
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Organisation</th>
              <th className="px-4 py-3">Stage</th>
              <th className="px-4 py-3">Start</th>
              <th className="px-4 py-3">Hours</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {orderedApplications.map((application) => (
              <tr key={application.id} className="hover:bg-blue-50/40">
                <td className="px-4 py-3 font-medium text-slate-900">{application.title}</td>
                <td className="px-4 py-3 text-slate-600">{application.organizationName}</td>
                <td className="px-4 py-3 text-slate-600">{application.status}</td>
                <td className="px-4 py-3 text-slate-600">{toDateInput(application.targetStartDate) || '—'}</td>
                <td className="px-4 py-3 text-slate-600">{application.hoursPerWeek ?? '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setDetail({ open: true, record: application })}
                      className="rounded-full px-3 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50"
                    >
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => openEdit(application)}
                      className="rounded-full px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(application)}
                      className="rounded-full px-3 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                      disabled={mutating}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {orderedApplications.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-sm text-slate-500" colSpan={6}>
                  Nothing here yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <ApplicationFormModal
        open={formState.open}
        mode={formState.mode}
        metadata={metadata}
        initialValue={formState.record}
        onClose={closeForm}
        onSubmit={handleSubmit}
        submitting={mutating}
      />
      <ApplicationDetailModal
        open={detail.open}
        record={detail.record}
        onClose={closeDetail}
        onEdit={openEdit}
        onViewResponses={(record) => {
          closeDetail();
          onOpenResponses?.(record);
        }}
      />
    </div>
  );
}
