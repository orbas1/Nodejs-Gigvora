import { useState } from 'react';
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import { classNames } from '../../../utils/classNames.js';

const INITIAL_DRAFT = { name: '', color: '#2563eb', description: '' };

export default function AdminInboxLabelManager({ labels, onCreate, onUpdate, onDelete, busy }) {
  const [draft, setDraft] = useState(INITIAL_DRAFT);
  const [editingId, setEditingId] = useState(null);

  const resetDraft = () => {
    setDraft(INITIAL_DRAFT);
    setEditingId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!draft.name.trim()) return;
    if (editingId) {
      await onUpdate(editingId, draft);
    } else {
      await onCreate(draft);
    }
    resetDraft();
  };

  const handleEdit = (label) => {
    setEditingId(label.id);
    setDraft({
      name: label.name ?? '',
      color: label.color ?? '#2563eb',
      description: label.description ?? '',
    });
  };

  return (
    <div className="space-y-5">
      <form className="space-y-3" onSubmit={handleSubmit}>
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr),120px]">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="admin-label-name">
              Name
            </label>
            <input
              id="admin-label-name"
              type="text"
              value={draft.name}
              onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Label"
              className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="admin-label-color">
              Color
            </label>
            <input
              id="admin-label-color"
              type="color"
              value={draft.color}
              onChange={(event) => setDraft((prev) => ({ ...prev, color: event.target.value }))}
              className="mt-1 h-11 w-full cursor-pointer rounded-2xl border border-slate-200"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="admin-label-description">
            Notes
          </label>
          <textarea
            id="admin-label-description"
            rows={2}
            value={draft.description}
            onChange={(event) => setDraft((prev) => ({ ...prev, description: event.target.value }))}
            placeholder="Optional"
            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="submit"
            disabled={busy || !draft.name.trim()}
            className={classNames(
              'inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white shadow-soft transition',
              busy || !draft.name.trim() ? 'cursor-not-allowed opacity-60' : 'hover:bg-accentDark',
            )}
          >
            {busy ? 'Saving…' : editingId ? 'Update' : 'Create'}
          </button>
          {editingId ? (
            <button
              type="button"
              onClick={resetDraft}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
            >
              Cancel
            </button>
          ) : null}
        </div>
      </form>

      <div className="space-y-2">
        {labels.length ? (
          labels.map((label) => (
            <div key={label.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{label.name}</p>
                {label.description ? (
                  <p className="text-xs text-slate-500">{label.description}</p>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-200"
                  style={{ backgroundColor: label.color ?? '#2563eb' }}
                />
                <button
                  type="button"
                  onClick={() => handleEdit(label)}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 transition hover:border-accent/60 hover:text-accent"
                >
                  <PencilSquareIcon className="h-4 w-4" /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(label.id)}
                  className="inline-flex items-center gap-1 rounded-full border border-rose-200 px-2.5 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                >
                  <TrashIcon className="h-4 w-4" /> Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-xs text-slate-500">
            No labels yet.
          </p>
        )}
      </div>
    </div>
  );
}
