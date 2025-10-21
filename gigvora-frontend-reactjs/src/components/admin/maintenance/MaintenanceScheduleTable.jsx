import { useMemo, useState } from 'react';
import { CalendarIcon, PencilSquareIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

const DEFAULT_WINDOW = {
  title: '',
  startAt: '',
  endAt: '',
  impact: 'Platform',
  channels: ['status-page'],
  owner: 'SRE',
  notificationLeadMinutes: 60,
  rollbackPlan: '',
};

const CHANNEL_OPTIONS = [
  { value: 'status-page', label: 'Status page' },
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' },
  { value: 'in-app', label: 'In-app banner' },
  { value: 'slack', label: 'Slack #gigvora-ops' },
];

function WindowRow({ window, editing, onEdit, onCancel, onSave, onDelete, busy }) {
  const [draft, setDraft] = useState(window ?? DEFAULT_WINDOW);

  const handleArrayChange = (field) => (event) => {
    const value = Array.from(event.target.selectedOptions).map((option) => option.value);
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const handleChange = (field) => (event) => {
    setDraft((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave?.({
      ...draft,
      notificationLeadMinutes: Number(draft.notificationLeadMinutes) || 60,
    });
  };

  if (editing) {
    return (
      <tr className="bg-white/80">
        <td colSpan={7} className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Title</span>
                <input
                  type="text"
                  required
                  value={draft.title}
                  onChange={handleChange('title')}
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Impact area</span>
                <input
                  type="text"
                  value={draft.impact}
                  onChange={handleChange('impact')}
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Start</span>
                <input
                  type="datetime-local"
                  required
                  value={draft.startAt ? draft.startAt.slice(0, 16) : ''}
                  onChange={handleChange('startAt')}
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">End</span>
                <input
                  type="datetime-local"
                  value={draft.endAt ? draft.endAt.slice(0, 16) : ''}
                  onChange={handleChange('endAt')}
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Owner</span>
                <input
                  type="text"
                  value={draft.owner}
                  onChange={handleChange('owner')}
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Notify before (minutes)</span>
                <input
                  type="number"
                  min="0"
                  value={draft.notificationLeadMinutes}
                  onChange={handleChange('notificationLeadMinutes')}
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </label>
            </div>
            <label className="space-y-1 text-sm">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Channels</span>
              <select
                multiple
                value={draft.channels}
                onChange={handleArrayChange('channels')}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                {CHANNEL_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Rollback plan</span>
              <textarea
                rows={3}
                value={draft.rollbackPlan}
                onChange={handleChange('rollbackPlan')}
                placeholder="Restore database snapshot, revert release, communicate on-call handoff…"
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <div className="flex items-center justify-end gap-3 text-xs">
              <button
                type="button"
                onClick={onCancel}
                className="rounded-full border border-slate-200 px-4 py-2 font-semibold uppercase tracking-wide text-slate-600 hover:border-slate-300 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="rounded-full bg-accent px-4 py-2 font-semibold uppercase tracking-wide text-white shadow-soft hover:bg-accentDark disabled:opacity-60"
              >
                Save window
              </button>
            </div>
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr className="bg-white/70 text-sm text-slate-600">
      <td className="px-4 py-3 font-semibold text-slate-900">{window.title}</td>
      <td className="px-4 py-3">{window.owner}</td>
      <td className="px-4 py-3">{window.impact}</td>
      <td className="px-4 py-3">{window.startAt ? new Date(window.startAt).toLocaleString() : 'TBC'}</td>
      <td className="px-4 py-3">{window.endAt ? new Date(window.endAt).toLocaleString() : 'TBC'}</td>
      <td className="px-4 py-3">{(window.channels ?? []).join(', ') || 'Status page'}</td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-3 text-xs">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 font-semibold uppercase tracking-wide text-slate-600 hover:border-slate-300 hover:text-slate-900"
          >
            <PencilSquareIcon className="h-4 w-4" aria-hidden="true" /> Edit
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex items-center gap-1 rounded-full border border-rose-200 px-3 py-1 font-semibold uppercase tracking-wide text-rose-600 hover:border-rose-300 hover:text-rose-700"
          >
            <TrashIcon className="h-4 w-4" aria-hidden="true" /> Delete
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function MaintenanceScheduleTable({ windows = [], onCreate, onUpdate, onDelete, creating, busyWindowId }) {
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const sorted = useMemo(() => {
    return [...windows].sort((a, b) => new Date(a.startAt || 0) - new Date(b.startAt || 0));
  }, [windows]);

  const [draft, setDraft] = useState(DEFAULT_WINDOW);

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onCreate?.({
      ...draft,
      notificationLeadMinutes: Number(draft.notificationLeadMinutes) || 60,
    });
    setDraft(DEFAULT_WINDOW);
    setShowCreate(false);
  };

  return (
    <section className="space-y-6" id="maintenance-schedule">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Maintenance calendar</h2>
          <p className="mt-1 text-sm text-slate-600">
            Plan infrastructure upgrades, release freezes, and hotfix windows with automated comms.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-soft hover:bg-slate-800"
        >
          <PlusIcon className="h-4 w-4" aria-hidden="true" /> New window
        </button>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 shadow-soft">
        <table className="min-w-full divide-y divide-slate-200 text-left">
          <thead className="bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">Impact</th>
              <th className="px-4 py-3">Starts</th>
              <th className="px-4 py-3">Ends</th>
              <th className="px-4 py-3">Channels</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sorted.map((window) => (
              <WindowRow
                key={window.id}
                window={window}
                editing={editingId === window.id}
                busy={busyWindowId === window.id}
                onEdit={() => setEditingId(window.id)}
                onCancel={() => setEditingId(null)}
                onSave={(payload) => {
                  onUpdate?.(window.id, payload);
                  setEditingId(null);
                }}
                onDelete={() => onDelete?.(window.id)}
              />
            ))}

            {!sorted.length && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-500">
                  <div className="mx-auto max-w-md space-y-3">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                      <CalendarIcon className="h-8 w-8 text-slate-400" aria-hidden="true" />
                    </div>
                    <p className="text-base font-semibold text-slate-900">No upcoming windows</p>
                    <p>
                      Schedule maintenance to prevent surprise outages. Subscribers are notified across channels automatically.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-soft">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">New window</h3>
              <p className="mt-1 text-sm text-slate-500">
                Define impact, schedule, and rollback plan. We sync to PagerDuty and the status page automatically.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowCreate(false);
                setDraft(DEFAULT_WINDOW);
              }}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 hover:border-slate-300 hover:text-slate-900"
            >
              Close
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Title</span>
              <input
                type="text"
                required
                value={draft.title}
                onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Owner</span>
              <input
                type="text"
                value={draft.owner}
                onChange={(event) => setDraft((current) => ({ ...current, owner: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Impact</span>
              <input
                type="text"
                value={draft.impact}
                onChange={(event) => setDraft((current) => ({ ...current, impact: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Notify before (minutes)</span>
              <input
                type="number"
                min="0"
                value={draft.notificationLeadMinutes}
                onChange={(event) => setDraft((current) => ({ ...current, notificationLeadMinutes: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Start</span>
              <input
                type="datetime-local"
                required
                value={draft.startAt}
                onChange={(event) => setDraft((current) => ({ ...current, startAt: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">End</span>
              <input
                type="datetime-local"
                value={draft.endAt}
                onChange={(event) => setDraft((current) => ({ ...current, endAt: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
          </div>
          <label className="space-y-1 text-sm">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Channels</span>
            <select
              multiple
              value={draft.channels}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  channels: Array.from(event.target.selectedOptions).map((option) => option.value),
                }))
              }
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              {CHANNEL_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Rollback plan</span>
            <textarea
              rows={3}
              value={draft.rollbackPlan}
              onChange={(event) => setDraft((current) => ({ ...current, rollbackPlan: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>

          <div className="flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setShowCreate(false);
                setDraft(DEFAULT_WINDOW);
              }}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 hover:border-slate-300 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-soft hover:bg-accentDark disabled:opacity-60"
            >
              Schedule window
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
