import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';

const INITIAL_FORM = {
  title: '',
  description: '',
  status: 'draft',
  submittedAt: '',
  submissionUrl: '',
  notes: '',
};

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', { dateStyle: 'medium' });
}

function toDateInput(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

export default function SubmissionsTab({ project, actions, canManage }) {
  const submissions = Array.isArray(project.submissions) ? project.submissions : [];
  const statusSummary = useMemo(() => {
    return STATUS_OPTIONS.map((option) => ({
      ...option,
      count: submissions.filter((submission) => submission.status === option.value).length,
    }));
  }, [submissions]);

  const [form, setForm] = useState(INITIAL_FORM);
  const [editingId, setEditingId] = useState(null);
  const [editingForm, setEditingForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleChange = (event, setter) => {
    const { name, value } = event.target;
    setter((current) => ({ ...current, [name]: value }));
  };

  const buildPayload = (payload) => ({
    title: payload.title,
    description: payload.description || undefined,
    status: payload.status,
    submittedAt: payload.submittedAt ? new Date(payload.submittedAt).toISOString() : undefined,
    submissionUrl: payload.submissionUrl || undefined,
    notes: payload.notes || undefined,
  });

  const resetForm = () => {
    setForm(INITIAL_FORM);
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!canManage) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      await actions.createSubmission(project.id, buildPayload(form));
      resetForm();
      setFeedback({ status: 'success', message: 'Submission recorded.' });
    } catch (error) {
      setFeedback({ status: 'error', message: error?.message || 'Unable to record submission.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (submission) => {
    setEditingId(submission.id);
    setEditingForm({
      title: submission.title || '',
      description: submission.description || '',
      status: submission.status || 'draft',
      submittedAt: toDateInput(submission.submittedAt),
      submissionUrl: submission.submissionUrl || '',
      notes: submission.notes || '',
    });
    setFeedback(null);
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    if (!canManage) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      await actions.updateSubmission(project.id, editingId, buildPayload(editingForm));
      setEditingId(null);
      setFeedback({ status: 'success', message: 'Submission updated.' });
    } catch (error) {
      setFeedback({ status: 'error', message: error?.message || 'Unable to update submission.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (submissionId) => {
    if (!canManage) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      await actions.deleteSubmission(project.id, submissionId);
      setFeedback({ status: 'success', message: 'Submission removed.' });
    } catch (error) {
      setFeedback({ status: 'error', message: error?.message || 'Unable to remove submission.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {feedback ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            feedback.status === 'error'
              ? 'border-rose-200 bg-rose-50 text-rose-600'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}
        >
          {feedback.message}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {statusSummary.map((status) => (
          <div key={status.value} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">{status.label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{status.count}</p>
          </div>
        ))}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Total submissions</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{submissions.length}</p>
        </div>
      </div>

      <form onSubmit={handleCreate} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h4 className="text-base font-semibold text-slate-900">Log delivery submission</h4>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="flex flex-col text-sm text-slate-700">
            Title
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={(event) => handleChange(event, setForm)}
              required
              disabled={!canManage || submitting}
              className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              placeholder="Sprint 3 deliverables"
            />
          </label>
          <label className="flex flex-col text-sm text-slate-700">
            Status
            <select
              name="status"
              value={form.status}
              onChange={(event) => handleChange(event, setForm)}
              disabled={!canManage || submitting}
              className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col text-sm text-slate-700">
            Submitted on
            <input
              type="date"
              name="submittedAt"
              value={form.submittedAt}
              onChange={(event) => handleChange(event, setForm)}
              disabled={!canManage || submitting}
              className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </label>
          <label className="flex flex-col text-sm text-slate-700">
            Submission URL
            <input
              type="url"
              name="submissionUrl"
              value={form.submissionUrl}
              onChange={(event) => handleChange(event, setForm)}
              placeholder="https://drive.gigvora.com/deliverable.pdf"
              disabled={!canManage || submitting}
              className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </label>
          <label className="flex flex-col text-sm text-slate-700 md:col-span-2">
            Description
            <textarea
              name="description"
              value={form.description}
              onChange={(event) => handleChange(event, setForm)}
              rows={3}
              disabled={!canManage || submitting}
              className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              placeholder="Include highlights, reviewers, and acceptance criteria."
            />
          </label>
          <label className="flex flex-col text-sm text-slate-700 md:col-span-2">
            Notes
            <textarea
              name="notes"
              value={form.notes}
              onChange={(event) => handleChange(event, setForm)}
              rows={3}
              disabled={!canManage || submitting}
              className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              placeholder="Add review feedback, blockers, or rework actions."
            />
          </label>
        </div>
        <div className="mt-4 flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={!canManage || submitting}
            className="inline-flex items-center justify-center rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Save submission
          </button>
        </div>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th scope="col" className="px-4 py-3 text-left">
                Submission
              </th>
              <th scope="col" className="px-4 py-3 text-left">
                Status
              </th>
              <th scope="col" className="px-4 py-3 text-left">
                Submitted at
              </th>
              <th scope="col" className="px-4 py-3 text-left">
                Link
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {submissions.length ? (
              submissions.map((submission) => (
                <tr key={submission.id} className="bg-white">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">{submission.title}</p>
                    <p className="text-sm text-slate-600">{submission.description}</p>
                    {submission.notes ? (
                      <p className="mt-1 text-xs text-slate-500">Notes: {submission.notes}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{submission.status?.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(submission.submittedAt)}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {submission.submissionUrl ? (
                      <a
                        href={submission.submissionUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-accent hover:underline"
                      >
                        View submission
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(submission)}
                        className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={!canManage || submitting}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(submission.id)}
                        className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 hover:border-rose-400 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={!canManage || submitting}
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-4 py-6 text-center text-sm text-slate-500">
                  No submissions yet. Use the form above to log approvals and deliveries.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editingId ? (
        <form onSubmit={handleUpdate} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h5 className="text-base font-semibold text-slate-900">Edit submission</h5>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="flex flex-col text-sm text-slate-700">
              Title
              <input
                type="text"
                name="title"
                value={editingForm.title}
                onChange={(event) => handleChange(event, setEditingForm)}
                required
                disabled={!canManage || submitting}
                className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </label>
            <label className="flex flex-col text-sm text-slate-700">
              Status
              <select
                name="status"
                value={editingForm.status}
                onChange={(event) => handleChange(event, setEditingForm)}
                disabled={!canManage || submitting}
                className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col text-sm text-slate-700">
              Submitted on
              <input
                type="date"
                name="submittedAt"
                value={editingForm.submittedAt}
                onChange={(event) => handleChange(event, setEditingForm)}
                disabled={!canManage || submitting}
                className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </label>
            <label className="flex flex-col text-sm text-slate-700">
              Submission URL
              <input
                type="url"
                name="submissionUrl"
                value={editingForm.submissionUrl}
                onChange={(event) => handleChange(event, setEditingForm)}
                disabled={!canManage || submitting}
                className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </label>
            <label className="flex flex-col text-sm text-slate-700 md:col-span-2">
              Description
              <textarea
                name="description"
                value={editingForm.description}
                onChange={(event) => handleChange(event, setEditingForm)}
                rows={3}
                disabled={!canManage || submitting}
                className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </label>
            <label className="flex flex-col text-sm text-slate-700 md:col-span-2">
              Notes
              <textarea
                name="notes"
                value={editingForm.notes}
                onChange={(event) => handleChange(event, setEditingForm)}
                rows={3}
                disabled={!canManage || submitting}
                className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </label>
          </div>
          <div className="mt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setEditingId(null)}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-accent/40 hover:text-accent"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canManage || submitting}
              className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Save changes
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

SubmissionsTab.propTypes = {
  project: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    submissions: PropTypes.arrayOf(PropTypes.object),
  }).isRequired,
  actions: PropTypes.shape({
    createSubmission: PropTypes.func.isRequired,
    updateSubmission: PropTypes.func.isRequired,
    deleteSubmission: PropTypes.func.isRequired,
  }).isRequired,
  canManage: PropTypes.bool,
};

SubmissionsTab.defaultProps = {
  canManage: true,
};
