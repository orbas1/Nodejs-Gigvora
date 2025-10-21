import PropTypes from 'prop-types';
import { useState } from 'react';

const OBJECT_TYPES = ['asset', 'deliverable', 'dependency', 'risk', 'note'];

export default function WorkspaceObjectsTab({ objects = [], onCreate, onUpdate, onDelete }) {
  const [formState, setFormState] = useState(null);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Project objects & assets</h2>
        <button
          type="button"
          onClick={() => setFormState({ objectType: 'asset' })}
          className="inline-flex items-center rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accentDark"
        >
          {formState?.id ? 'Editing record…' : 'Add record'}
        </button>
      </div>
      <div className="mt-4 space-y-3">
        {objects.map((object) => (
          <div key={object.id} className="flex flex-col gap-2 rounded-2xl border border-slate-200/70 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">{object.label}</p>
              <p className="text-xs text-slate-500">
                {object.objectType?.replace(/_/g, ' ') ?? 'asset'} · {object.ownerName || 'Unassigned'} · {object.quantity ?? '—'} {object.unit || ''}
              </p>
              {object.description ? <p className="mt-1 text-xs text-slate-500">{object.description}</p> : null}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  setFormState({
                    id: object.id,
                    objectType: object.objectType ?? 'asset',
                    label: object.label ?? '',
                    description: object.description ?? '',
                    ownerName: object.ownerName ?? '',
                    quantity: object.quantity ?? '',
                    unit: object.unit ?? '',
                    status: object.status ?? '',
                  })
                }
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => onDelete?.(object.id)}
                className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
        {objects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs text-slate-500">
            No workspace objects catalogued yet.
          </div>
        ) : null}
      </div>

      {formState !== null ? (
        <form
          noValidate
          className="mt-6 grid gap-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            const label = formState.label?.trim();
            if (!label) {
              return;
            }
            const quantityValue = Number.parseFloat(formState.quantity);
            const payload = {
              objectType: (formState.objectType ?? 'asset').trim(),
              label,
              description: formState.description?.trim() || '',
              ownerName: formState.ownerName?.trim() || '',
              quantity: Number.isFinite(quantityValue) ? quantityValue : null,
              unit: formState.unit?.trim() || '',
              status: formState.status?.trim() || '',
            };
            if (formState.id) {
              onUpdate?.(formState.id, payload);
            } else {
              onCreate?.(payload);
            }
            setFormState(null);
          }}
        >
          <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Type
            <select
              value={formState.objectType ?? 'asset'}
              onChange={(event) => setFormState((state) => ({ ...(state ?? {}), objectType: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              {OBJECT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Label
            <input
              type="text"
              value={formState.label ?? ''}
              onChange={(event) => setFormState((state) => ({ ...(state ?? {}), label: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              required
            />
          </label>
          <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Owner name
            <input
              type="text"
              value={formState.ownerName ?? ''}
              onChange={(event) => setFormState((state) => ({ ...(state ?? {}), ownerName: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>
          <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Quantity
            <input
              type="number"
              min="0"
              step="0.1"
              value={formState.quantity ?? ''}
              onChange={(event) => setFormState((state) => ({ ...(state ?? {}), quantity: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>
          <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Unit
            <input
              type="text"
              value={formState.unit ?? ''}
              onChange={(event) => setFormState((state) => ({ ...(state ?? {}), unit: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>
          <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Status
            <input
              type="text"
              value={formState.status ?? ''}
              onChange={(event) => setFormState((state) => ({ ...(state ?? {}), status: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>
          <label className="md:col-span-2 space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Description
            <textarea
              value={formState.description ?? ''}
              onChange={(event) => setFormState((state) => ({ ...(state ?? {}), description: event.target.value }))}
              rows={2}
              className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>
          <div className="md:col-span-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setFormState(null)}
              className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-700"
            >
              {formState.id ? 'Save record' : 'Add record'}
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

WorkspaceObjectsTab.propTypes = {
  objects: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      objectType: PropTypes.string,
      label: PropTypes.string,
      description: PropTypes.string,
      ownerName: PropTypes.string,
      quantity: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      unit: PropTypes.string,
      status: PropTypes.string,
    }),
  ),
  onCreate: PropTypes.func,
  onUpdate: PropTypes.func,
  onDelete: PropTypes.func,
};

WorkspaceObjectsTab.defaultProps = {
  objects: [],
  onCreate: undefined,
  onUpdate: undefined,
  onDelete: undefined,
};
