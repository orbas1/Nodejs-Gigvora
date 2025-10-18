import { useEffect, useMemo, useRef, useState } from 'react';
import PanelDialog from './PanelDialog.jsx';

function normalizeExperience(experience = {}) {
  return {
    id: experience.id ?? null,
    title: experience.title ?? '',
    client: experience.client ?? '',
    summary: experience.summary ?? '',
    startDate: experience.startDate ?? '',
    endDate: experience.endDate ?? '',
    isCurrent: Boolean(experience.isCurrent),
    impact: experience.impact ?? '',
    heroImageUrl: experience.heroImageUrl ?? '',
    tagsText: Array.isArray(experience.tags) ? experience.tags.join(', ') : experience.tags ?? '',
    position: experience.position ?? '',
  };
}

function ExperienceEditorDialog({ open, item, onClose, onSubmit }) {
  const [formState, setFormState] = useState(() => normalizeExperience(item));
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const initialRef = useRef(null);

  useEffect(() => {
    setFormState(normalizeExperience(item));
    setError('');
    setSubmitting(false);
  }, [item, open]);

  const handleChange = (field) => (event) => {
    const value = event?.target?.type === 'checkbox' ? event.target.checked : event.target.value;
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        title: formState.title?.trim() || null,
        client: formState.client?.trim() || null,
        summary: formState.summary?.trim() || null,
        startDate: formState.startDate?.trim() || null,
        endDate: formState.isCurrent ? null : formState.endDate?.trim() || null,
        isCurrent: Boolean(formState.isCurrent),
        impact: formState.impact?.trim() || null,
        heroImageUrl: formState.heroImageUrl?.trim() || null,
        tags: formState.tagsText
          ? formState.tagsText
              .split(',')
              .map((tag) => tag.trim())
              .filter(Boolean)
          : [],
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
      const message = err?.body?.message ?? err?.message ?? 'Unable to save project.';
      setError(message);
      setSubmitting(false);
    }
  };

  return (
    <PanelDialog
      open={open}
      onClose={() => (!submitting ? onClose?.() : null)}
      title={item?.id ? 'Edit project' : 'New project'}
      size="xl"
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
            form="experience-editor-form"
            className="inline-flex items-center justify-center rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accentDark focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={submitting}
          >
            {submitting ? 'Saving…' : 'Save'}
          </button>
        </>
      }
    >
      <form id="experience-editor-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="experience-title" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Title
            </label>
            <input
              id="experience-title"
              ref={initialRef}
              type="text"
              required
              value={formState.title}
              onChange={handleChange('title')}
              placeholder="Add title"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div>
            <label htmlFor="experience-client" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Client
            </label>
            <input
              id="experience-client"
              type="text"
              value={formState.client}
              onChange={handleChange('client')}
              placeholder="Client or team"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label htmlFor="experience-start" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Start
            </label>
            <input
              id="experience-start"
              type="date"
              value={formState.startDate}
              onChange={handleChange('startDate')}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div>
            <label htmlFor="experience-end" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              End
            </label>
            <input
              id="experience-end"
              type="date"
              value={formState.endDate}
              onChange={handleChange('endDate')}
              disabled={formState.isCurrent}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:bg-slate-100"
            />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-3 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={formState.isCurrent}
                onChange={handleChange('isCurrent')}
                className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent/40"
              />
              In progress
            </label>
          </div>
        </div>

        <div>
          <label htmlFor="experience-summary" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Summary
          </label>
          <textarea
            id="experience-summary"
            rows={3}
            value={formState.summary}
            onChange={handleChange('summary')}
            placeholder="Describe the engagement"
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>

        <div>
          <label htmlFor="experience-impact" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Highlights
          </label>
          <textarea
            id="experience-impact"
            rows={3}
            value={formState.impact}
            onChange={handleChange('impact')}
            placeholder="Share results"
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="experience-hero" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Hero image URL
            </label>
            <input
              id="experience-hero"
              type="url"
              value={formState.heroImageUrl}
              onChange={handleChange('heroImageUrl')}
              placeholder="https://..."
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div>
            <label htmlFor="experience-tags" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Tags
            </label>
            <input
              id="experience-tags"
              type="text"
              value={formState.tagsText}
              onChange={handleChange('tagsText')}
              placeholder="Design, growth"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
        </div>

        <div>
          <label htmlFor="experience-position" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Order
          </label>
          <input
            id="experience-position"
            type="number"
            min="0"
            value={formState.position}
            onChange={handleChange('position')}
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

export default function ExperienceManager({ experiences = [], onCreate, onUpdate, onDelete }) {
  const orderedExperiences = useMemo(
    () =>
      [...experiences]
        .filter((item) => item?.title)
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0) || (b.startDate || '').localeCompare(a.startDate || '')),
    [experiences],
  );
  const [editorItem, setEditorItem] = useState(null);
  const [previewItem, setPreviewItem] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');

  const handleCreate = () => {
    setEditorItem({ id: null });
    setError('');
  };

  const handleEdit = (experience) => {
    setEditorItem(experience);
    setError('');
  };

  const handleDelete = async (experience) => {
    if (!experience?.id || !onDelete) {
      return;
    }
    setDeletingId(experience.id);
    setError('');
    try {
      await onDelete(experience.id);
    } catch (err) {
      const message = err?.body?.message ?? err?.message ?? 'Unable to remove this project right now.';
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
        <h2 className="text-xl font-semibold text-slate-900">Projects</h2>
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

      <div className="space-y-4">
        {orderedExperiences.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
            Share a few case studies to highlight your delivery.
          </div>
        ) : null}
        {orderedExperiences.map((experience) => (
          <article key={experience.id} className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row">
              <button
                type="button"
                onClick={() => setPreviewItem(experience)}
                className="w-full overflow-hidden rounded-2xl bg-slate-100 lg:max-w-xs"
              >
                {experience.heroImageUrl ? (
                  <img
                    src={experience.heroImageUrl}
                    alt={experience.title}
                    className="h-40 w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-40 w-full items-center justify-center text-xs text-slate-500">Preview</div>
                )}
              </button>
              <div className="flex flex-1 flex-col justify-between">
                <div className="space-y-2">
                  <h3 className="text-base font-semibold text-slate-900">{experience.title}</h3>
                  <p className="text-sm text-slate-500">{experience.client || 'Client confidential'}</p>
                  <p className="text-sm text-slate-600">{experience.summary}</p>
                  {experience.tags?.length ? (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {experience.tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 pt-4 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-2 py-1">{experience.startDate || '—'}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-1">
                      {experience.isCurrent ? 'Present' : experience.endDate || '—'}
                    </span>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-1">#{experience.position ?? 0}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2 text-xs text-slate-500">
              <button
                type="button"
                onClick={() => handleEdit(experience)}
                className="rounded-full border border-slate-200 px-3 py-1 font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => handleDelete(experience)}
                className="rounded-full border border-rose-200 px-3 py-1 font-semibold text-rose-600 transition hover:bg-rose-50"
                disabled={deletingId === experience.id}
              >
                {deletingId === experience.id ? 'Removing…' : 'Remove'}
              </button>
            </div>
          </article>
        ))}
      </div>

      <ExperienceEditorDialog open={Boolean(editorItem)} item={editorItem} onClose={() => setEditorItem(null)} onSubmit={handleSubmit} />

      <PanelDialog
        open={Boolean(previewItem)}
        onClose={() => setPreviewItem(null)}
        title={previewItem?.title || 'Project'}
        size="xl"
      >
        {previewItem ? (
          <div className="space-y-4 text-sm text-slate-600">
            {previewItem.heroImageUrl ? (
              <img
                src={previewItem.heroImageUrl}
                alt={previewItem.title}
                className="w-full rounded-2xl object-cover"
              />
            ) : null}
            <p className="font-semibold text-slate-900">{previewItem.client || 'Client confidential'}</p>
            <p>{previewItem.summary}</p>
            {previewItem.impact ? <p className="rounded-2xl bg-slate-50 px-4 py-2 text-slate-600">{previewItem.impact}</p> : null}
            {previewItem.tags?.length ? (
              <div className="flex flex-wrap gap-2">
                {previewItem.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="rounded-full bg-slate-100 px-2 py-1">{previewItem.startDate || '—'}</span>
              <span className="rounded-full bg-slate-100 px-2 py-1">{previewItem.isCurrent ? 'Present' : previewItem.endDate || '—'}</span>
            </div>
          </div>
        ) : null}
      </PanelDialog>
    </section>
  );
}
