import { useMemo, useState } from 'react';

const ENTRY_TYPES = ['milestone', 'phase', 'task', 'checkpoint'];
const STATUSES = ['planned', 'in_progress', 'at_risk', 'blocked', 'completed'];

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

export default function WorkspaceTimelineManager({ timeline = [], objects = [], onSave, onDelete }) {
  const [form, setForm] = useState({
    id: null,
    title: '',
    entryType: 'milestone',
    status: 'planned',
    startAt: '',
    endAt: '',
    ownerName: '',
    relatedObjectId: '',
    lane: '',
    progressPercent: '',
  });
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState(null);

  const chartEntries = useMemo(() => {
    if (!timeline.length) {
      return [];
    }
    const parsed = timeline
      .map((entry) => {
        const start = new Date(entry.startAt);
        if (Number.isNaN(start.getTime())) {
          return null;
        }
        const end = entry.endAt ? new Date(entry.endAt) : new Date(start.getTime() + 1000 * 60 * 60 * 24);
        const endValue = Number.isNaN(end.getTime()) ? new Date(start.getTime() + 1000 * 60 * 60 * 24) : end;
        return { ...entry, start, end: endValue };
      })
      .filter(Boolean);
    if (!parsed.length) {
      return [];
    }
    const minStart = Math.min(...parsed.map((entry) => entry.start.getTime()));
    const maxEnd = Math.max(...parsed.map((entry) => entry.end.getTime()));
    const span = Math.max(maxEnd - minStart, 1000 * 60 * 60 * 24);
    return parsed.map((entry, index) => {
      const left = ((entry.start.getTime() - minStart) / span) * 100;
      const width = Math.max(((entry.end.getTime() - entry.start.getTime()) / span) * 100, 4);
      const laneIndex = Number.isFinite(Number(entry.lane)) ? Number(entry.lane) : index;
      return {
        ...entry,
        left: Math.min(Math.max(left, 0), 100),
        width: Math.min(Math.max(width, 4), 100),
        laneIndex,
      };
    });
  }, [timeline]);

  function handleEdit(entry) {
    setForm({
      id: entry.id,
      title: entry.title ?? '',
      entryType: entry.entryType ?? 'milestone',
      status: entry.status ?? 'planned',
      startAt: toInputDate(entry.startAt),
      endAt: toInputDate(entry.endAt),
      ownerName: entry.ownerName ?? '',
      relatedObjectId: entry.relatedObjectId ?? '',
      lane: entry.lane ?? '',
      progressPercent: entry.progressPercent ?? '',
    });
    setFeedback(null);
    setError(null);
  }

  function resetFormState(options = {}) {
    const preserveFeedback = Boolean(options.preserveFeedback);
    setForm({
      id: null,
      title: '',
      entryType: 'milestone',
      status: 'planned',
      startAt: '',
      endAt: '',
      ownerName: '',
      relatedObjectId: '',
      lane: '',
      progressPercent: '',
    });
    if (!preserveFeedback) {
      setFeedback(null);
    }
    setError(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!onSave) {
      return;
    }
    setSaving(true);
    setFeedback(null);
    setError(null);
    try {
      await onSave({
        id: form.id,
        title: form.title,
        entryType: form.entryType,
        status: form.status,
        startAt: form.startAt ? new Date(form.startAt).toISOString() : null,
        endAt: form.endAt ? new Date(form.endAt).toISOString() : null,
        ownerName: form.ownerName,
        relatedObjectId: form.relatedObjectId ? Number(form.relatedObjectId) : null,
        lane: form.lane === '' ? null : Number(form.lane),
        progressPercent: form.progressPercent === '' ? null : Number(form.progressPercent),
      });
      setFeedback(form.id ? 'Timeline entry updated.' : 'Timeline entry added.');
      resetFormState({ preserveFeedback: true });
    } catch (submitError) {
      setError(submitError);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(entry) {
    if (!onDelete) {
      return;
    }
    setSaving(true);
    setFeedback(null);
    setError(null);
    try {
      await onDelete(entry);
      if (form.id === entry.id) {
        resetFormState();
      }
      setFeedback('Timeline entry removed.');
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
          <h2 className="text-2xl font-semibold text-slate-900">Timeline & gantt view</h2>
          <p className="text-sm text-slate-600">
            Plot milestones, phases, and tasks to maintain delivery momentum and transparency.
          </p>
        </div>
        <div className="text-sm text-slate-600">
          <p>Total entries: {timeline.length}</p>
        </div>
      </div>

      <div className="mt-6">
        <div className="relative h-48 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
          <div className="absolute inset-0 grid grid-cols-12 divide-x divide-slate-200">
            {Array.from({ length: 12 }).map((_, index) => (
              <div key={index} className="h-full" />
            ))}
          </div>
          {chartEntries.length ? (
            <div className="absolute inset-0">
              {chartEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="absolute rounded-xl border border-accent bg-accent/20 px-3 py-2 text-xs text-accent"
                  data-testid={`timeline-chart-entry-${entry.id}`}
                  style={{ left: `${entry.left}%`, width: `${entry.width}%`, top: `${entry.laneIndex * 48}px` }}
                >
                  <p className="font-semibold">{entry.title}</p>
                  <p>{formatDate(entry.start)} → {formatDate(entry.end)}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-500">
              Add timeline entries to visualise progress.
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2 text-left">Title</th>
              <th className="px-4 py-2 text-left">Type</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Owner</th>
              <th className="px-4 py-2 text-left">Start</th>
              <th className="px-4 py-2 text-left">End</th>
              <th className="px-4 py-2 text-left">Progress</th>
              <th className="px-4 py-2 text-left">Linked object</th>
              <th className="px-4 py-2" aria-label="actions">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {timeline.length ? (
              timeline.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2 font-medium text-slate-900">{entry.title}</td>
                  <td className="px-4 py-2 text-slate-600 capitalize">{entry.entryType}</td>
                  <td className="px-4 py-2 text-slate-600 capitalize">{entry.status}</td>
                  <td className="px-4 py-2 text-slate-600">{entry.ownerName ?? '—'}</td>
                  <td className="px-4 py-2 text-slate-500">{formatDate(entry.startAt)}</td>
                  <td className="px-4 py-2 text-slate-500">{formatDate(entry.endAt)}</td>
                  <td className="px-4 py-2 text-slate-600">{entry.progressPercent == null ? '—' : `${entry.progressPercent}%`}</td>
                  <td className="px-4 py-2 text-slate-500">
                    {objects.find((obj) => obj.id === entry.relatedObjectId)?.name ?? '—'}
                  </td>
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
                <td colSpan={9} className="px-4 py-4 text-center text-slate-500">
                  No timeline entries yet. Add milestones to build the roadmap.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <h3 className="text-lg font-semibold text-slate-900">{form.id ? 'Edit timeline entry' : 'Add timeline entry'}</h3>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="timeline-title">
            Title
          </label>
          <input
            id="timeline-title"
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            required
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            placeholder="Kickoff workshop"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="timeline-type">
            Type
          </label>
          <select
            id="timeline-type"
            value={form.entryType}
            onChange={(event) => setForm((prev) => ({ ...prev, entryType: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          >
            {ENTRY_TYPES.map((type) => (
              <option key={type} value={type}>
                {type.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="timeline-status">
            Status
          </label>
          <select
            id="timeline-status"
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
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="timeline-start">
            Start
          </label>
          <input
            id="timeline-start"
            type="datetime-local"
            value={form.startAt}
            onChange={(event) => setForm((prev) => ({ ...prev, startAt: event.target.value }))}
            required
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="timeline-end">
            End
          </label>
          <input
            id="timeline-end"
            type="datetime-local"
            value={form.endAt}
            onChange={(event) => setForm((prev) => ({ ...prev, endAt: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="timeline-owner">
            Owner
          </label>
          <input
            id="timeline-owner"
            value={form.ownerName}
            onChange={(event) => setForm((prev) => ({ ...prev, ownerName: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            placeholder="Milestone owner"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="timeline-object">
            Linked object
          </label>
          <select
            id="timeline-object"
            value={form.relatedObjectId}
            onChange={(event) => setForm((prev) => ({ ...prev, relatedObjectId: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          >
            <option value="">No link</option>
            {objects.map((object) => (
              <option key={object.id} value={object.id}>
                {object.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="timeline-lane">
            Lane (0 for top)
          </label>
          <input
            id="timeline-lane"
            type="number"
            min="0"
            value={form.lane}
            onChange={(event) => setForm((prev) => ({ ...prev, lane: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="timeline-progress">
            Progress %
          </label>
          <input
            id="timeline-progress"
            type="number"
            step="1"
            min="0"
            max="100"
            value={form.progressPercent}
            onChange={(event) => setForm((prev) => ({ ...prev, progressPercent: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        {feedback ? <p className="md:col-span-2 text-sm text-emerald-600">{feedback}</p> : null}
        {error ? (
          <p className="md:col-span-2 text-sm text-rose-600">{error.message ?? 'Unable to save timeline entry.'}</p>
        ) : null}
        <div className="md:col-span-2 flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {saving ? 'Saving…' : form.id ? 'Update entry' : 'Add entry'}
          </button>
          <button
            type="button"
            onClick={() => resetFormState()}
            className="text-sm font-semibold text-slate-600 hover:text-slate-900"
          >
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}
