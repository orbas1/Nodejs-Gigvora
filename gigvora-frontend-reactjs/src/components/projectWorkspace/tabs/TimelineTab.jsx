import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';

const INITIAL_FORM = {
  title: '',
  entryType: 'milestone',
  occurredAt: '',
  notes: '',
};

const ENTRY_TYPES = [
  { value: 'milestone', label: 'Milestone' },
  { value: 'decision', label: 'Decision' },
  { value: 'risk', label: 'Risk' },
  { value: 'celebration', label: 'Celebration' },
  { value: 'retro', label: 'Retrospective' },
  { value: 'update', label: 'Status update' },
];

function toInputDateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const iso = date.toISOString();
  return iso.slice(0, 16);
}

function formatDateTime(value) {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not recorded';
  return date.toLocaleString('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function TimelineTab({ project, actions, canManage }) {
  const entries = Array.isArray(project.timelineEntries) ? project.timelineEntries : [];
  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => {
      const aDate = new Date(a.occurredAt || a.createdAt || 0).getTime();
      const bDate = new Date(b.occurredAt || b.createdAt || 0).getTime();
      return bDate - aDate;
    });
  }, [entries]);

  const groupedByType = useMemo(() => {
    return ENTRY_TYPES.map((type) => ({
      ...type,
      count: entries.filter((entry) => entry.entryType === type.value).length,
    }));
  }, [entries]);

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
    entryType: payload.entryType,
    occurredAt: payload.occurredAt ? new Date(payload.occurredAt).toISOString() : undefined,
    notes: payload.notes || undefined,
  });

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!canManage) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      await actions.createTimelineEntry(project.id, buildPayload(form));
      setForm(INITIAL_FORM);
      setFeedback({ status: 'success', message: 'Timeline entry recorded.' });
    } catch (error) {
      setFeedback({ status: 'error', message: error?.message || 'Unable to create timeline entry.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (entry) => {
    setEditingId(entry.id);
    setEditingForm({
      title: entry.title || '',
      entryType: entry.entryType || 'milestone',
      occurredAt: toInputDateTime(entry.occurredAt),
      notes: entry.notes || '',
    });
    setFeedback(null);
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    if (!canManage) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      await actions.updateTimelineEntry(project.id, editingId, buildPayload(editingForm));
      setEditingId(null);
      setFeedback({ status: 'success', message: 'Timeline entry updated.' });
    } catch (error) {
      setFeedback({ status: 'error', message: error?.message || 'Unable to update timeline entry.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (entryId) => {
    if (!canManage) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      await actions.deleteTimelineEntry(project.id, entryId);
      setFeedback({ status: 'success', message: 'Timeline entry removed.' });
    } catch (error) {
      setFeedback({ status: 'error', message: error?.message || 'Unable to remove timeline entry.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {groupedByType.map((type) => (
          <div key={type.value} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">{type.label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{type.count}</p>
          </div>
        ))}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Total entries</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{entries.length}</p>
        </div>
      </div>

      <form onSubmit={handleCreate} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h4 className="text-base font-semibold text-slate-900">Log a new milestone</h4>
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
              placeholder="Kickoff call complete"
            />
          </label>
          <label className="flex flex-col text-sm text-slate-700">
            Entry type
            <select
              name="entryType"
              value={form.entryType}
              onChange={(event) => handleChange(event, setForm)}
              disabled={!canManage || submitting}
              className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            >
              {ENTRY_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col text-sm text-slate-700">
            Occurred at
            <input
              type="datetime-local"
              name="occurredAt"
              value={form.occurredAt}
              onChange={(event) => handleChange(event, setForm)}
              disabled={!canManage || submitting}
              className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
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
              placeholder="Highlight key learnings or blockers to broadcast to the team."
            />
          </label>
        </div>
        <div className="mt-4 flex items-center justify-end gap-3">
          {feedback ? (
            <p
              className={`text-sm ${
                feedback.status === 'error' ? 'text-rose-600' : 'text-emerald-600'
              }`}
            >
              {feedback.message}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={!canManage || submitting}
            className="inline-flex items-center justify-center rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Log entry
          </button>
        </div>
      </form>

      <div className="space-y-4">
        {sortedEntries.length ? (
          sortedEntries.map((entry) => (
            <article key={entry.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              {editingId === entry.id ? (
                <form onSubmit={handleUpdate} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
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
                      Entry type
                      <select
                        name="entryType"
                        value={editingForm.entryType}
                        onChange={(event) => handleChange(event, setEditingForm)}
                        disabled={!canManage || submitting}
                        className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                      >
                        {ENTRY_TYPES.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="flex flex-col text-sm text-slate-700">
                      Occurred at
                      <input
                        type="datetime-local"
                        name="occurredAt"
                        value={editingForm.occurredAt}
                        onChange={(event) => handleChange(event, setEditingForm)}
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
                  <div className="flex items-center justify-end gap-3">
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
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h4 className="text-base font-semibold text-slate-900">{entry.title}</h4>
                      <p className="text-sm text-slate-500">
                        {entry.entryType ? entry.entryType.replace(/_/g, ' ') : 'Timeline'} • {formatDateTime(entry.occurredAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(entry)}
                        className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={!canManage || submitting}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(entry.id)}
                        className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 hover:border-rose-400 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={!canManage || submitting}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  {entry.notes ? <p className="text-sm text-slate-700">{entry.notes}</p> : null}
                </div>
              )}
            </article>
          ))
        ) : (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-center text-sm text-slate-500">
            Capture key milestones, decisions, and celebrations to share progress with your collaborators.
          </p>
        )}
      </div>
    </div>
  );
}

TimelineTab.propTypes = {
  project: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    timelineEntries: PropTypes.arrayOf(PropTypes.object),
  }).isRequired,
  actions: PropTypes.shape({
    createTimelineEntry: PropTypes.func.isRequired,
    updateTimelineEntry: PropTypes.func.isRequired,
    deleteTimelineEntry: PropTypes.func.isRequired,
  }).isRequired,
  canManage: PropTypes.bool,
};

TimelineTab.defaultProps = {
  canManage: true,
};
