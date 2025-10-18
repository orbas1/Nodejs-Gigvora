import { useState } from 'react';

const STATUSES = ['draft', 'submitted', 'in_review', 'approved', 'returned'];

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString();
}

function toInputDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (num) => String(num).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(
    date.getMinutes(),
  )}`;
}

export default function WorkspaceSubmissionManager({ submissions = [], onSave, onDelete }) {
  const [form, setForm] = useState({
    id: null,
    title: '',
    submissionType: '',
    status: 'draft',
    submittedBy: '',
    submittedAt: '',
    reviewedBy: '',
    reviewedAt: '',
    notes: '',
    attachmentUrl: '',
  });
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState(null);

  function handleEdit(entry) {
    setForm({
      id: entry.id,
      title: entry.title ?? '',
      submissionType: entry.submissionType ?? '',
      status: entry.status ?? 'draft',
      submittedBy: entry.submittedBy ?? '',
      submittedAt: toInputDate(entry.submittedAt),
      reviewedBy: entry.reviewedBy ?? '',
      reviewedAt: toInputDate(entry.reviewedAt),
      notes: entry.notes ?? '',
      attachmentUrl: entry.attachmentUrl ?? '',
    });
    setFeedback(null);
    setError(null);
  }

  function resetForm() {
    setForm({
      id: null,
      title: '',
      submissionType: '',
      status: 'draft',
      submittedBy: '',
      submittedAt: '',
      reviewedBy: '',
      reviewedAt: '',
      notes: '',
      attachmentUrl: '',
    });
    setFeedback(null);
    setError(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!onSave) return;
    setSaving(true);
    setFeedback(null);
    setError(null);
    try {
      await onSave({
        id: form.id,
        title: form.title,
        submissionType: form.submissionType,
        status: form.status,
        submittedBy: form.submittedBy,
        submittedAt: form.submittedAt ? new Date(form.submittedAt).toISOString() : null,
        reviewedBy: form.reviewedBy,
        reviewedAt: form.reviewedAt ? new Date(form.reviewedAt).toISOString() : null,
        notes: form.notes,
        attachmentUrl: form.attachmentUrl,
      });
      setFeedback(form.id ? 'Submission updated.' : 'Submission logged.');
      resetForm();
    } catch (submitError) {
      setError(submitError);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(entry) {
    if (!onDelete) return;
    setSaving(true);
    setFeedback(null);
    setError(null);
    try {
      await onDelete(entry);
      if (form.id === entry.id) {
        resetForm();
      }
      setFeedback('Submission removed.');
    } catch (deleteError) {
      setError(deleteError);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Project submissions</h2>
          <p className="text-sm text-slate-600">Capture deliverable submissions, reviews, and approvals.</p>
        </div>
        <div className="text-sm text-slate-600">Total submissions: {submissions.length}</div>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2 text-left">Title</th>
              <th className="px-4 py-2 text-left">Type</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Submitted by</th>
              <th className="px-4 py-2 text-left">Submitted at</th>
              <th className="px-4 py-2 text-left">Reviewed by</th>
              <th className="px-4 py-2 text-left">Reviewed at</th>
              <th className="px-4 py-2" aria-label="actions">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {submissions.length ? (
              submissions.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2 font-medium text-slate-900">{entry.title}</td>
                  <td className="px-4 py-2 text-slate-600">{entry.submissionType ?? '—'}</td>
                  <td className="px-4 py-2 text-slate-600 capitalize">{entry.status}</td>
                  <td className="px-4 py-2 text-slate-500">{entry.submittedBy ?? '—'}</td>
                  <td className="px-4 py-2 text-slate-500">{formatDate(entry.submittedAt)}</td>
                  <td className="px-4 py-2 text-slate-500">{entry.reviewedBy ?? '—'}</td>
                  <td className="px-4 py-2 text-slate-500">{formatDate(entry.reviewedAt)}</td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(entry)}
                        className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(entry)}
                        className="rounded-lg border border-rose-200 px-2 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="px-4 py-4 text-center text-slate-500">
                  No submissions recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <h3 className="text-lg font-semibold text-slate-900">{form.id ? 'Edit submission' : 'Add submission'}</h3>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="submission-title">
            Title
          </label>
          <input
            id="submission-title"
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            required
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="submission-type">
            Submission type
          </label>
          <input
            id="submission-type"
            value={form.submissionType}
            onChange={(event) => setForm((prev) => ({ ...prev, submissionType: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            placeholder="e.g. Design asset"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="submission-status">
            Status
          </label>
          <select
            id="submission-status"
            value={form.status}
            onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          >
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {status.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="submission-submitted-by">
            Submitted by
          </label>
          <input
            id="submission-submitted-by"
            value={form.submittedBy}
            onChange={(event) => setForm((prev) => ({ ...prev, submittedBy: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="submission-submitted-at">
            Submitted at
          </label>
          <input
            id="submission-submitted-at"
            type="datetime-local"
            value={form.submittedAt}
            onChange={(event) => setForm((prev) => ({ ...prev, submittedAt: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="submission-reviewed-by">
            Reviewed by
          </label>
          <input
            id="submission-reviewed-by"
            value={form.reviewedBy}
            onChange={(event) => setForm((prev) => ({ ...prev, reviewedBy: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="submission-reviewed-at">
            Reviewed at
          </label>
          <input
            id="submission-reviewed-at"
            type="datetime-local"
            value={form.reviewedAt}
            onChange={(event) => setForm((prev) => ({ ...prev, reviewedAt: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="submission-attachment">
            Attachment URL
          </label>
          <input
            id="submission-attachment"
            value={form.attachmentUrl}
            onChange={(event) => setForm((prev) => ({ ...prev, attachmentUrl: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            placeholder="https://"
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="submission-notes">
            Notes
          </label>
          <textarea
            id="submission-notes"
            value={form.notes}
            onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
            rows={3}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        {feedback ? <p className="md:col-span-2 text-sm text-emerald-600">{feedback}</p> : null}
        {error ? (
          <p className="md:col-span-2 text-sm text-rose-600">{error.message ?? 'Unable to save submission.'}</p>
        ) : null}
        <div className="md:col-span-2 flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {saving ? 'Saving…' : form.id ? 'Update submission' : 'Add submission'}
          </button>
          <button
            type="button"
            onClick={resetForm}
            className="text-sm font-semibold text-slate-600 hover:text-slate-900"
          >
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}
