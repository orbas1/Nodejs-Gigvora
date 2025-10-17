import { useEffect, useMemo, useRef, useState } from 'react';
import PanelDialog from './PanelDialog.jsx';

function normalizeSegment(segment = {}) {
  return {
    id: segment.id ?? null,
    segmentName: segment.segmentName ?? '',
    specialization: segment.specialization ?? '',
    availableCount: segment.availableCount ?? '',
    totalCount: segment.totalCount ?? '',
    deliveryModel: segment.deliveryModel ?? '',
    location: segment.location ?? '',
    availabilityNotes: segment.availabilityNotes ?? '',
    averageBillRate: segment.averageBillRate ?? '',
    currency: segment.currency ?? '',
    leadTimeDays: segment.leadTimeDays ?? '',
    position: segment.position ?? '',
  };
}

function WorkforceEditorDialog({ open, item, onClose, onSubmit }) {
  const [formState, setFormState] = useState(() => normalizeSegment(item));
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const initialRef = useRef(null);

  useEffect(() => {
    setFormState(normalizeSegment(item));
    setError('');
    setSubmitting(false);
  }, [item, open]);

  const handleChange = (field) => (event) => {
    const value = event?.target?.value ?? '';
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        segmentName: formState.segmentName?.trim() || null,
        specialization: formState.specialization?.trim() || null,
        availableCount:
          formState.availableCount === '' || formState.availableCount == null
            ? null
            : Number.isFinite(Number(formState.availableCount))
              ? Number(formState.availableCount)
              : null,
        totalCount:
          formState.totalCount === '' || formState.totalCount == null
            ? null
            : Number.isFinite(Number(formState.totalCount))
              ? Number(formState.totalCount)
              : null,
        deliveryModel: formState.deliveryModel?.trim() || null,
        location: formState.location?.trim() || null,
        availabilityNotes: formState.availabilityNotes?.trim() || null,
        averageBillRate:
          formState.averageBillRate === '' || formState.averageBillRate == null
            ? null
            : Number.isFinite(Number(formState.averageBillRate))
              ? Number(formState.averageBillRate)
              : null,
        currency: formState.currency?.trim() || null,
        leadTimeDays:
          formState.leadTimeDays === '' || formState.leadTimeDays == null
            ? null
            : Number.isFinite(Number(formState.leadTimeDays))
              ? Number(formState.leadTimeDays)
              : null,
        position:
          formState.position === '' || formState.position == null
            ? null
            : Number.isFinite(Number(formState.position))
              ? Number(formState.position)
              : null,
      };
      await onSubmit?.(payload);
      onClose?.();
    } catch (err) {
      const message = err?.body?.message ?? err?.message ?? 'Unable to save segment.';
      setError(message);
      setSubmitting(false);
    }
  };

  return (
    <PanelDialog
      open={open}
      onClose={() => (!submitting ? onClose?.() : null)}
      title={item?.id ? 'Edit segment' : 'New segment'}
      size="lg"
      initialFocus={initialRef}
      actions={
        <>
          <button
            type="button"
            onClick={() => (!submitting ? onClose?.() : null)}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800 disabled:opacity-60"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="workforce-editor-form"
            className="inline-flex items-center justify-center rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accentDark focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={submitting}
          >
            {submitting ? 'Saving…' : 'Save'}
          </button>
        </>
      }
    >
      <form id="workforce-editor-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="segment-name" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Name
            </label>
            <input
              id="segment-name"
              ref={initialRef}
              type="text"
              required
              value={formState.segmentName}
              onChange={handleChange('segmentName')}
              placeholder="Squad name"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div>
            <label htmlFor="segment-specialization" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Focus
            </label>
            <input
              id="segment-specialization"
              type="text"
              value={formState.specialization}
              onChange={handleChange('specialization')}
              placeholder="Discipline"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label htmlFor="segment-available" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Available
            </label>
            <input
              id="segment-available"
              type="number"
              min="0"
              value={formState.availableCount}
              onChange={handleChange('availableCount')}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div>
            <label htmlFor="segment-total" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Total
            </label>
            <input
              id="segment-total"
              type="number"
              min="0"
              value={formState.totalCount}
              onChange={handleChange('totalCount')}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div>
            <label htmlFor="segment-lead" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Lead time (days)
            </label>
            <input
              id="segment-lead"
              type="number"
              min="0"
              value={formState.leadTimeDays}
              onChange={handleChange('leadTimeDays')}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="segment-delivery" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Model
            </label>
            <input
              id="segment-delivery"
              type="text"
              value={formState.deliveryModel}
              onChange={handleChange('deliveryModel')}
              placeholder="Remote / onsite"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div>
            <label htmlFor="segment-location" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Region
            </label>
            <input
              id="segment-location"
              type="text"
              value={formState.location}
              onChange={handleChange('location')}
              placeholder="Location"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr_auto]">
          <div>
            <label htmlFor="segment-rate" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Avg rate
            </label>
            <input
              id="segment-rate"
              type="number"
              min="0"
              step="0.01"
              value={formState.averageBillRate}
              onChange={handleChange('averageBillRate')}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div>
            <label htmlFor="segment-currency" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Currency
            </label>
            <input
              id="segment-currency"
              type="text"
              maxLength={6}
              value={formState.currency}
              onChange={handleChange('currency')}
              placeholder="USD"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
        </div>

        <div>
          <label htmlFor="segment-position" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Order
          </label>
          <input
            id="segment-position"
            type="number"
            min="0"
            value={formState.position}
            onChange={handleChange('position')}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>

        <div>
          <label htmlFor="segment-notes" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Notes
          </label>
          <textarea
            id="segment-notes"
            rows={3}
            value={formState.availabilityNotes}
            onChange={handleChange('availabilityNotes')}
            placeholder="Add details"
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
        ) : null}
      </form>
    </PanelDialog>
  );
}

export default function WorkforceManager({ workforce = [], onCreate, onUpdate, onDelete }) {
  const orderedSegments = useMemo(
    () =>
      [...workforce]
        .filter((segment) => segment?.segmentName)
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0) || (a.segmentName || '').localeCompare(b.segmentName || '')),
    [workforce],
  );
  const [editorItem, setEditorItem] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');

  const handleCreate = () => {
    setEditorItem({ id: null });
    setError('');
  };

  const handleEdit = (segment) => {
    setEditorItem(segment);
    setError('');
  };

  const handleDelete = async (segment) => {
    if (!segment?.id || !onDelete) {
      return;
    }
    setDeletingId(segment.id);
    setError('');
    try {
      await onDelete(segment.id);
    } catch (err) {
      const message = err?.body?.message ?? err?.message ?? 'Unable to remove this segment right now.';
      setError(message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSubmit = async (payload) => {
    if (editorItem?.id && onUpdate) {
      await onUpdate(editorItem.id, payload);
    } else if (onCreate) {
      await onCreate(payload);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-slate-900">Bench</h2>
        <button
          type="button"
          onClick={handleCreate}
          className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-accent hover:text-accent"
        >
          Add
        </button>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {orderedSegments.length === 0 ? (
          <div className="col-span-full rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
            Map out your pods and available headcount.
          </div>
        ) : null}
        {orderedSegments.map((segment) => (
          <article key={segment.id} className="flex h-full flex-col justify-between rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">{segment.segmentName}</h3>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">#{segment.position ?? 0}</span>
              </div>
              <p className="text-xs text-slate-500">{segment.specialization || 'Generalist'}</p>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-xs text-slate-500">
              <div>
                <dt className="font-semibold text-slate-400">Available</dt>
                <dd className="mt-1 text-slate-700">{segment.availableCount ?? '—'}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-400">Total</dt>
                <dd className="mt-1 text-slate-700">{segment.totalCount ?? '—'}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-400">Model</dt>
                <dd className="mt-1 text-slate-700">{segment.deliveryModel || '—'}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-400">Lead</dt>
                <dd className="mt-1 text-slate-700">{segment.leadTimeDays != null ? `${segment.leadTimeDays} days` : '—'}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-400">Rate</dt>
                <dd className="mt-1 text-slate-700">
                  {segment.averageBillRate != null
                    ? `${segment.currency || 'USD'} ${Number(segment.averageBillRate).toLocaleString()}`
                    : '—'}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-400">Region</dt>
                <dd className="mt-1 text-slate-700">{segment.location || '—'}</dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-slate-500">{segment.availabilityNotes || 'No extra notes.'}</p>
            <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
              <button
                type="button"
                onClick={() => handleEdit(segment)}
                className="rounded-full border border-slate-200 px-3 py-1 font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => handleDelete(segment)}
                className="rounded-full border border-rose-200 px-3 py-1 font-semibold text-rose-600 transition hover:bg-rose-50"
                disabled={deletingId === segment.id}
              >
                {deletingId === segment.id ? 'Removing…' : 'Remove'}
              </button>
            </div>
          </article>
        ))}
      </div>

      <WorkforceEditorDialog open={Boolean(editorItem)} item={editorItem} onClose={() => setEditorItem(null)} onSubmit={handleSubmit} />
    </section>
  );
}
