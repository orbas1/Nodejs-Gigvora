import { useEffect, useState } from 'react';

export default function LabelManagerModal({ open, labels, onClose, onCreate, onUpdate, onDelete, busy }) {
  const [draft, setDraft] = useState({ name: '', color: '#2563eb', description: '' });
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    if (!open) {
      setDraft({ name: '', color: '#2563eb', description: '' });
      setEditing(null);
    }
  }, [open]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!draft.name.trim()) {
      return;
    }
    if (editing) {
      onUpdate?.(editing.id, draft);
    } else {
      onCreate?.(draft);
    }
  };

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4 py-8">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Manage labels</h2>
            <p className="text-sm text-slate-500">Create shared labels to keep the inbox organised.</p>
          </div>
          <button type="button" onClick={onClose} className="text-sm font-semibold text-slate-500 hover:text-slate-700">
            Close
          </button>
        </div>

        <form className="mt-6 space-y-3" onSubmit={handleSubmit}>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col text-sm text-slate-600">
              Label name
              <input
                type="text"
                value={draft.name}
                onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))}
                className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                placeholder="Support triage"
                required
              />
            </label>
            <label className="flex flex-col text-sm text-slate-600">
              Color
              <input
                type="color"
                value={draft.color}
                onChange={(event) => setDraft((prev) => ({ ...prev, color: event.target.value }))}
                className="mt-1 h-10 w-20 rounded-lg border border-slate-200"
              />
            </label>
          </div>
          <label className="flex flex-col text-sm text-slate-600">
            Description
            <textarea
              rows={2}
              value={draft.description}
              onChange={(event) => setDraft((prev) => ({ ...prev, description: event.target.value }))}
              className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              placeholder="Notes about when to apply this label"
            />
          </label>
          <div className="flex items-center justify-end gap-3">
            {editing ? (
              <button
                type="button"
                className="text-sm font-semibold text-slate-500 hover:text-slate-700"
                onClick={() => {
                  setEditing(null);
                  setDraft({ name: '', color: '#2563eb', description: '' });
                }}
              >
                Cancel edit
              </button>
            ) : null}
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark disabled:opacity-60"
              disabled={busy}
            >
              {editing ? 'Save label' : 'Add label'}
            </button>
          </div>
        </form>

        <div className="mt-6 space-y-3">
          {labels.length ? (
            labels.map((label) => (
              <div key={label.id} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: label.color }} />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{label.name}</p>
                    {label.description ? <p className="text-xs text-slate-500">{label.description}</p> : null}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="text-xs font-semibold text-accent hover:underline"
                    onClick={() => {
                      setEditing(label);
                      setDraft({
                        name: label.name,
                        color: label.color,
                        description: label.description ?? '',
                      });
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="text-xs font-semibold text-rose-500 hover:underline"
                    onClick={() => onDelete?.(label.id)}
                    disabled={busy}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
              No labels yet. Create your first label to start categorising conversations.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
