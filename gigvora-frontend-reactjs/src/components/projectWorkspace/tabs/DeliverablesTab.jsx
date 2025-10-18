import { useState } from 'react';
import PropTypes from 'prop-types';
import WorkspaceDialog from '../WorkspaceDialog.jsx';

const INITIAL_FORM = {
  title: '',
  description: '',
  status: 'draft',
  dueDate: '',
  submissionUrl: '',
};

export default function DeliverablesTab({ project, actions, canManage }) {
  const deliverables = project.deliverables ?? [];
  const [form, setForm] = useState(INITIAL_FORM);
  const [editingId, setEditingId] = useState(null);
  const [editingForm, setEditingForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const handleChange = (event, setter) => {
    const { name, value } = event.target;
    setter((current) => ({ ...current, [name]: value }));
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!canManage) {
      return;
    }
    setSubmitting(true);
    setFeedback(null);
    try {
      await actions.createDeliverable(project.id, {
        title: form.title,
        description: form.description,
        status: form.status,
        dueDate: form.dueDate || null,
        submissionUrl: form.submissionUrl || null,
      });
      setForm(INITIAL_FORM);
      setCreateOpen(false);
      setFeedback({ status: 'success', message: 'Deliverable added.' });
    } catch (error) {
      setFeedback({ status: 'error', message: error?.message || 'Unable to add deliverable.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (deliverable) => {
    setEditingId(deliverable.id);
    setEditingForm({
      title: deliverable.title || '',
      description: deliverable.description || '',
      status: deliverable.status || 'draft',
      dueDate: deliverable.dueDate ? deliverable.dueDate.slice(0, 10) : '',
      submissionUrl: deliverable.submissionUrl || '',
    });
    setEditOpen(true);
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    if (!canManage) {
      return;
    }
    setSubmitting(true);
    setFeedback(null);
    try {
      await actions.updateDeliverable(project.id, editingId, {
        title: editingForm.title,
        description: editingForm.description,
        status: editingForm.status,
        dueDate: editingForm.dueDate || null,
        submissionUrl: editingForm.submissionUrl || null,
      });
      setEditOpen(false);
      setEditingId(null);
      setFeedback({ status: 'success', message: 'Deliverable updated.' });
    } catch (error) {
      setFeedback({ status: 'error', message: error?.message || 'Unable to update deliverable.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (deliverableId) => {
    if (!canManage) {
      return;
    }
    setSubmitting(true);
    setFeedback(null);
    try {
      await actions.deleteDeliverable(project.id, deliverableId);
      setFeedback({ status: 'success', message: 'Deliverable removed.' });
    } catch (error) {
      setFeedback({ status: 'error', message: error?.message || 'Unable to remove deliverable.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Assets</p>
          <p className="text-sm font-semibold text-slate-700">{deliverables.length} items</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setForm(INITIAL_FORM);
            setCreateOpen(true);
          }}
          disabled={!canManage}
          className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white shadow-soft transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          New asset
        </button>
      </div>

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

      <ul className="grid gap-4 md:grid-cols-2">
        {deliverables.length ? (
          deliverables.map((deliverable) => (
            <li key={deliverable.id} className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">{deliverable.title}</p>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {deliverable.status?.replace(/_/g, ' ') || 'draft'}
                  </span>
                </div>
                <p className="text-sm text-slate-600">{deliverable.description}</p>
                <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
                  {deliverable.dueDate ? (
                    <span className="rounded-full bg-slate-100 px-3 py-1">
                      Due {new Date(deliverable.dueDate).toLocaleDateString('en-GB')}
                    </span>
                  ) : null}
                  {deliverable.submissionUrl ? (
                    <a
                      href={deliverable.submissionUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full bg-accent/10 px-3 py-1 text-accent hover:bg-accent/20"
                    >
                      Open link
                    </a>
                  ) : null}
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleEdit(deliverable)}
                  disabled={!canManage || submitting}
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(deliverable.id)}
                  disabled={!canManage || submitting}
                  className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 hover:border-rose-400 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Remove
                </button>
              </div>
            </li>
          ))
        ) : (
          <li className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-4 text-center text-sm text-slate-500">
            No assets captured.
          </li>
        )}
      </ul>

      <WorkspaceDialog
        open={createOpen}
        onClose={() => {
          if (!submitting) {
            setCreateOpen(false);
          }
        }}
        title="New asset"
        size="lg"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            Title
            <input
              name="title"
              value={form.title}
              onChange={(event) => handleChange(event, setForm)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              disabled={!canManage || submitting}
              required
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            Description
            <textarea
              name="description"
              rows={3}
              value={form.description}
              onChange={(event) => handleChange(event, setForm)}
              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              disabled={!canManage || submitting}
              required
            />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm text-slate-700">
              Status
              <select
                name="status"
                value={form.status}
                onChange={(event) => handleChange(event, setForm)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                disabled={!canManage || submitting}
              >
                <option value="draft">Draft</option>
                <option value="in_review">In review</option>
                <option value="approved">Approved</option>
                <option value="archived">Archived</option>
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-700">
              Due date
              <input
                type="date"
                name="dueDate"
                value={form.dueDate}
                onChange={(event) => handleChange(event, setForm)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                disabled={!canManage || submitting}
              />
            </label>
          </div>
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            Submission link
            <input
              type="url"
              name="submissionUrl"
              value={form.submissionUrl}
              onChange={(event) => handleChange(event, setForm)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              disabled={!canManage || submitting}
            />
          </label>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                if (!submitting) {
                  setCreateOpen(false);
                }
              }}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canManage || submitting}
              className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? 'Saving…' : 'Save asset'}
            </button>
          </div>
        </form>
      </WorkspaceDialog>

      <WorkspaceDialog
        open={editOpen && Boolean(editingId)}
        onClose={() => {
          if (!submitting) {
            setEditOpen(false);
            setEditingId(null);
          }
        }}
        title="Edit asset"
        size="lg"
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            Title
            <input
              name="title"
              value={editingForm.title}
              onChange={(event) => handleChange(event, setEditingForm)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              disabled={!canManage || submitting}
              required
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            Description
            <textarea
              name="description"
              rows={3}
              value={editingForm.description}
              onChange={(event) => handleChange(event, setEditingForm)}
              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              disabled={!canManage || submitting}
              required
            />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm text-slate-700">
              Status
              <select
                name="status"
                value={editingForm.status}
                onChange={(event) => handleChange(event, setEditingForm)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                disabled={!canManage || submitting}
              >
                <option value="draft">Draft</option>
                <option value="in_review">In review</option>
                <option value="approved">Approved</option>
                <option value="archived">Archived</option>
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-700">
              Due date
              <input
                type="date"
                name="dueDate"
                value={editingForm.dueDate}
                onChange={(event) => handleChange(event, setEditingForm)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                disabled={!canManage || submitting}
              />
            </label>
          </div>
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            Submission link
            <input
              type="url"
              name="submissionUrl"
              value={editingForm.submissionUrl}
              onChange={(event) => handleChange(event, setEditingForm)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              disabled={!canManage || submitting}
            />
          </label>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                if (!submitting) {
                  setEditOpen(false);
                  setEditingId(null);
                }
              }}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !canManage}
              className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? 'Saving…' : 'Update asset'}
            </button>
          </div>
        </form>
      </WorkspaceDialog>
    </div>
  );
}

DeliverablesTab.propTypes = {
  project: PropTypes.object.isRequired,
  actions: PropTypes.object.isRequired,
  canManage: PropTypes.bool.isRequired,
};
