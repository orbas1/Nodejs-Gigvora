import { useEffect, useMemo, useState, useRef } from 'react';
import PanelDialog from './PanelDialog.jsx';

function normalizeSkill(skillInput = {}) {
  const skill = skillInput ?? {};
  return {
    id: skill.id ?? null,
    name: skill.name ?? '',
    category: skill.category ?? '',
    proficiency: skill.proficiency ?? '',
    experienceYears: skill.experienceYears ?? '',
    isFeatured: Boolean(skill.isFeatured),
    position: skill.position ?? '',
  };
}

function SkillEditorDialog({ open, item, onClose, onSubmit }) {
  const [formState, setFormState] = useState(() => normalizeSkill(item));
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const initialRef = useRef(null);

  useEffect(() => {
    setFormState(normalizeSkill(item));
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
        name: formState.name?.trim() || null,
        category: formState.category?.trim() || null,
        proficiency:
          formState.proficiency === '' || formState.proficiency == null
            ? null
            : Number.isFinite(Number(formState.proficiency))
              ? Number(formState.proficiency)
              : null,
        experienceYears:
          formState.experienceYears === '' || formState.experienceYears == null
            ? null
            : Number.isFinite(Number(formState.experienceYears))
              ? Number(formState.experienceYears)
              : null,
        isFeatured: Boolean(formState.isFeatured),
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
      const message = err?.body?.message ?? err?.message ?? 'Unable to save skill.';
      setError(message);
      setSubmitting(false);
    }
  };

  return (
    <PanelDialog
      open={open}
      onClose={() => (!submitting ? onClose?.() : null)}
      title={item?.id ? 'Edit skill' : 'New skill'}
      size="md"
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
            form="skill-editor-form"
            className="inline-flex items-center justify-center rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accentDark focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={submitting}
          >
            {submitting ? 'Saving…' : 'Save'}
          </button>
        </>
      }
    >
      <form id="skill-editor-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="skill-name" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Name
            </label>
            <input
              id="skill-name"
              ref={initialRef}
              type="text"
              value={formState.name}
              onChange={handleChange('name')}
              required
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              placeholder="Add skill"
            />
          </div>
          <div>
            <label htmlFor="skill-category" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Group
            </label>
            <input
              id="skill-category"
              type="text"
              value={formState.category}
              onChange={handleChange('category')}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              placeholder="Discipline"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label htmlFor="skill-proficiency" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Proficiency (%)
            </label>
            <input
              id="skill-proficiency"
              type="number"
              min="0"
              max="100"
              value={formState.proficiency}
              onChange={handleChange('proficiency')}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div>
            <label htmlFor="skill-experience" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Years
            </label>
            <input
              id="skill-experience"
              type="number"
              min="0"
              step="0.1"
              value={formState.experienceYears}
              onChange={handleChange('experienceYears')}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div>
            <label htmlFor="skill-position" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Order
            </label>
            <input
              id="skill-position"
              type="number"
              min="0"
              value={formState.position}
              onChange={handleChange('position')}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
        </div>

        <label className="flex items-center gap-3 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={formState.isFeatured}
            onChange={handleChange('isFeatured')}
            className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent/40"
          />
          Feature this skill
        </label>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
        ) : null}
      </form>
    </PanelDialog>
  );
}

export default function SkillTagManager({ skills = [], onCreate, onUpdate, onDelete }) {
  const orderedSkills = useMemo(
    () =>
      [...skills]
        .filter((skill) => skill?.name)
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0) || (a.name || '').localeCompare(b.name || '')),
    [skills],
  );
  const [editorItem, setEditorItem] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');

  const handleCreate = () => {
    setEditorItem({ id: null });
    setError('');
  };

  const handleEdit = (skill) => {
    setEditorItem(skill);
    setError('');
  };

  const handleDelete = async (skill) => {
    if (!skill?.id || !onDelete) {
      return;
    }
    setDeletingId(skill.id);
    setError('');
    try {
      await onDelete(skill.id);
    } catch (err) {
      const message = err?.body?.message ?? err?.message ?? 'Unable to remove this skill right now.';
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
    <section id="profile-skills" className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-slate-900">Skills</h2>
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
        {orderedSkills.length === 0 ? (
          <div className="col-span-full rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
            Add the capabilities you want clients to see first.
          </div>
        ) : null}
        {orderedSkills.map((skill) => (
          <article key={skill.id} className="flex h-full flex-col justify-between rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">{skill.name}</h3>
                {skill.isFeatured ? (
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">Featured</span>
                ) : null}
              </div>
              <p className="text-xs text-slate-500">{skill.category || 'General'}</p>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-xs text-slate-500">
              <div>
                <dt className="font-semibold text-slate-400">Proficiency</dt>
                <dd className="mt-1 text-slate-700">{skill.proficiency != null ? `${skill.proficiency}%` : '—'}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-400">Experience</dt>
                <dd className="mt-1 text-slate-700">{skill.experienceYears != null ? `${Number(skill.experienceYears).toFixed(1)} yrs` : '—'}</dd>
              </div>
            </dl>
            <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
              <span className="rounded-full bg-slate-100 px-2 py-1">#{skill.position ?? 0}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleEdit(skill)}
                  className="rounded-full border border-slate-200 px-3 py-1 font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(skill)}
                  className="rounded-full border border-rose-200 px-3 py-1 font-semibold text-rose-600 transition hover:bg-rose-50"
                  disabled={deletingId === skill.id}
                >
                  {deletingId === skill.id ? 'Removing…' : 'Remove'}
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <SkillEditorDialog open={Boolean(editorItem)} item={editorItem} onClose={() => setEditorItem(null)} onSubmit={handleSubmit} />
    </section>
  );
}
