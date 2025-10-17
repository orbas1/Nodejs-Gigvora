import { Fragment, useEffect, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  DEFAULT_RESPONSE,
  parseAttachmentList,
  serialiseAttachments,
  toDateInput,
} from './helpers.js';

function ResponseFormModal({
  open,
  mode,
  metadata,
  applications,
  initialValue,
  submitting,
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState(DEFAULT_RESPONSE);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      setForm({
        ...DEFAULT_RESPONSE,
        ...initialValue,
        applicationId: initialValue?.applicationId ?? initialValue?.application?.id ?? '',
        respondedAt: toDateInput(initialValue?.respondedAt),
        attachments: serialiseAttachments(initialValue?.attachments),
      });
      setError(null);
    }
  }, [initialValue, open]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.applicationId) {
      setError('Select an application.');
      return;
    }
    setError(null);
    try {
      await onSubmit({
        ...form,
        attachments: parseAttachmentList(form.attachments),
        respondedAt: form.respondedAt || null,
      });
      onClose();
    } catch (err) {
      const message = err?.message ?? 'Unable to save response.';
      setError(message);
    }
  };

  const title = mode === 'edit' ? 'Edit response' : 'New response';

  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-30" onClose={submitting ? () => {} : onClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-slate-900/40" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-6">
            <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="w-full max-w-2xl rounded-3xl bg-white p-8 shadow-xl">
                <div className="flex items-center justify-between">
                  <Dialog.Title className="text-lg font-semibold text-slate-900">{title}</Dialog.Title>
                  <button type="button" onClick={onClose} disabled={submitting} className="rounded-full px-3 py-1 text-sm font-semibold text-slate-500 hover:bg-slate-100 disabled:opacity-50">
                    Close
                  </button>
                </div>
                <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                  <label className="space-y-1 text-sm text-slate-600">
                    <span className="font-medium text-slate-900">Application</span>
                    <select
                      name="applicationId"
                      value={form.applicationId}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-2 focus:border-blue-500 focus:outline-none"
                    >
                      <option value="">Select</option>
                      {applications.map((application) => (
                        <option key={application.id} value={application.id}>
                          {application.title}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-1 text-sm text-slate-600">
                      <span className="font-medium text-slate-900">Contact</span>
                      <input
                        name="responderName"
                        value={form.responderName}
                        onChange={handleChange}
                        className="w-full rounded-2xl border border-slate-200 px-4 py-2 focus:border-blue-500 focus:outline-none"
                      />
                    </label>
                    <label className="space-y-1 text-sm text-slate-600">
                      <span className="font-medium text-slate-900">Email</span>
                      <input
                        name="responderEmail"
                        type="email"
                        value={form.responderEmail}
                        onChange={handleChange}
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
                        {(metadata?.responseStatusOptions ?? []).map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1 text-sm text-slate-600">
                      <span className="font-medium text-slate-900">Date</span>
                      <input
                        type="date"
                        name="respondedAt"
                        value={form.respondedAt}
                        onChange={handleChange}
                        className="w-full rounded-2xl border border-slate-200 px-4 py-2 focus:border-blue-500 focus:outline-none"
                      />
                    </label>
                  </div>
                  <label className="space-y-1 text-sm text-slate-600">
                    <span className="font-medium text-slate-900">Next steps</span>
                    <input
                      name="nextSteps"
                      value={form.nextSteps}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-2 focus:border-blue-500 focus:outline-none"
                    />
                  </label>
                  <label className="space-y-1 text-sm text-slate-600">
                    <span className="font-medium text-slate-900">Notes</span>
                    <textarea
                      name="message"
                      value={form.message}
                      onChange={handleChange}
                      rows={3}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-2 focus:border-blue-500 focus:outline-none"
                    />
                  </label>
                  <label className="space-y-1 text-sm text-slate-600">
                    <span className="font-medium text-slate-900">Attachments</span>
                    <textarea
                      name="attachments"
                      value={form.attachments}
                      onChange={handleChange}
                      rows={2}
                      placeholder="One URL per line"
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

function ResponseDetailModal({ open, record, onClose, onEdit }) {
  if (!record) {
    return null;
  }
  const attachments = Array.isArray(record.attachments) ? record.attachments : [];

  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-20" onClose={onClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-slate-900/40" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-6">
            <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="w-full max-w-3xl rounded-3xl bg-white p-8 shadow-xl">
                <div className="flex items-center justify-between">
                  <Dialog.Title className="text-lg font-semibold text-slate-900">{record.application?.title ?? 'Response'}</Dialog.Title>
                  <button type="button" onClick={onClose} className="rounded-full px-3 py-1 text-sm font-semibold text-slate-500 hover:bg-slate-100">
                    Close
                  </button>
                </div>
                <div className="mt-6 grid gap-6 md:grid-cols-2 text-sm text-slate-600">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</p>
                    <p className="mt-1 text-base font-medium text-slate-900">{record.status}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Date</p>
                    <p className="mt-1 text-slate-700">{toDateInput(record.respondedAt) || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Contact</p>
                    <p className="mt-1 text-slate-700">{record.responderName || '—'}</p>
                    <p className="text-xs text-slate-500">{record.responderEmail || ''}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Next steps</p>
                    <p className="mt-1 text-slate-700">{record.nextSteps || '—'}</p>
                  </div>
                </div>
                <div className="mt-6 space-y-4 text-sm text-slate-600">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Notes</p>
                    <p className="mt-1 text-slate-700">{record.message || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Attachments</p>
                    {attachments.length === 0 ? (
                      <p className="mt-1 text-slate-500">None</p>
                    ) : (
                      <ul className="mt-2 space-y-2 text-xs text-blue-600">
                        {attachments.map((link) => (
                          <li key={link}>
                            <a href={link} target="_blank" rel="noreferrer" className="hover:underline">
                              {link}
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
                <div className="mt-8 flex justify-end">
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

export default function ResponsesPanel({
  applications = [],
  metadata,
  mutating,
  onCreate,
  onUpdate,
  onDelete,
  queuedApplicationId,
  onQueueConsumed,
}) {
  const [formState, setFormState] = useState({ open: false, mode: 'create', record: DEFAULT_RESPONSE });
  const [detail, setDetail] = useState({ open: false, record: null });
  const [filterApplicationId, setFilterApplicationId] = useState('all');

  const responseList = useMemo(
    () =>
      applications.flatMap((application) =>
        (application.responses ?? []).map((response) => ({
          ...response,
          application,
          applicationId: response.applicationId ?? application.id,
        })),
      ),
    [applications],
  );

  const filteredResponses = useMemo(() => {
    if (filterApplicationId === 'all') {
      return responseList;
    }
    return responseList.filter((response) => `${response.applicationId}` === `${filterApplicationId}`);
  }, [filterApplicationId, responseList]);

  const openCreate = (applicationId) => {
    setFormState({
      open: true,
      mode: 'create',
      record: { ...DEFAULT_RESPONSE, applicationId: applicationId ?? '' },
    });
  };

  useEffect(() => {
    if (queuedApplicationId) {
      openCreate(queuedApplicationId);
      onQueueConsumed?.();
    }
  }, [queuedApplicationId, onQueueConsumed]);

  const openEdit = (record) => {
    setFormState({ open: true, mode: 'edit', record });
  };

  const closeForm = () => setFormState((state) => ({ ...state, open: false }));

  const closeDetail = () => setDetail({ open: false, record: null });

  const handleSubmit = async (payload) => {
    if (formState.mode === 'edit' && formState.record?.id) {
      await onUpdate(formState.record.id, payload);
    } else {
      await onCreate(payload.applicationId, payload);
    }
  };

  const handleDelete = async (record) => {
    if (!record?.id) return;
    const confirmDelete = window.confirm('Delete this response?');
    if (!confirmDelete) return;
    await onDelete(record.id);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="text-lg font-semibold text-slate-900">Responses</h3>
          <select
            value={filterApplicationId}
            onChange={(event) => setFilterApplicationId(event.target.value)}
            className="rounded-2xl border border-slate-200 px-3 py-1 text-sm text-slate-600 focus:border-blue-500 focus:outline-none"
          >
            <option value="all">All</option>
            {applications.map((application) => (
              <option key={application.id} value={application.id}>
                {application.title}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={() => openCreate(filterApplicationId === 'all' ? '' : filterApplicationId)}
          className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
        >
          New
        </button>
      </div>
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Application</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredResponses.map((response) => (
              <tr key={response.id} className="hover:bg-blue-50/40">
                <td className="px-4 py-3 font-medium text-slate-900">{response.application?.title ?? '—'}</td>
                <td className="px-4 py-3 text-slate-600">{response.status}</td>
                <td className="px-4 py-3 text-slate-600">{response.responderName || '—'}</td>
                <td className="px-4 py-3 text-slate-600">{toDateInput(response.respondedAt) || '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setDetail({ open: true, record: response })}
                      className="rounded-full px-3 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50"
                    >
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => openEdit(response)}
                      className="rounded-full px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(response)}
                      className="rounded-full px-3 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                      disabled={mutating}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredResponses.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-sm text-slate-500" colSpan={5}>
                  No responses yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <ResponseFormModal
        open={formState.open}
        mode={formState.mode}
        metadata={metadata}
        applications={applications}
        initialValue={formState.record}
        submitting={mutating}
        onClose={closeForm}
        onSubmit={handleSubmit}
      />
      <ResponseDetailModal
        open={detail.open}
        record={detail.record}
        onClose={closeDetail}
        onEdit={openEdit}
      />
    </div>
  );
}
