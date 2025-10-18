import { useMemo, useState } from 'react';

const EMPTY_TAG = Object.freeze({ name: '', slug: '', description: '', colour: '' });

export default function BlogTagManager({
  tags,
  onCreate,
  onUpdate,
  onDelete,
  loading,
  onExpand,
  onCloseFullscreen,
  isFullscreen = false,
}) {
  const [draft, setDraft] = useState(EMPTY_TAG);
  const [editingId, setEditingId] = useState(null);
  const [editingDraft, setEditingDraft] = useState(EMPTY_TAG);
  const [submitting, setSubmitting] = useState(false);

  const sortedTags = useMemo(() => [...tags].sort((a, b) => a.name.localeCompare(b.name)), [tags]);

  const resetDrafts = () => {
    setDraft(EMPTY_TAG);
    setEditingId(null);
    setEditingDraft(EMPTY_TAG);
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!draft.name) {
      return;
    }
    setSubmitting(true);
    try {
      await onCreate({
        name: draft.name,
        slug: draft.slug || undefined,
        description: draft.description || undefined,
        colour: draft.colour || undefined,
      });
      setDraft(EMPTY_TAG);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();
    if (!editingId) {
      return;
    }
    setSubmitting(true);
    try {
      await onUpdate(editingId, {
        name: editingDraft.name,
        slug: editingDraft.slug || undefined,
        description: editingDraft.description || undefined,
        colour: editingDraft.colour || undefined,
      });
      resetDrafts();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (tagId) => {
    const confirmed = window.confirm('Delete this tag?');
    if (!confirmed) {
      return;
    }
    await onDelete(tagId);
    if (editingId === tagId) {
      resetDrafts();
    }
  };

  const beginEdit = (tag) => {
    setEditingId(tag.id);
    setEditingDraft({
      name: tag.name ?? '',
      slug: tag.slug ?? '',
      description: tag.description ?? '',
      colour: tag.colour ?? '',
    });
  };

  const sectionClass = `rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm ${
    isFullscreen ? 'h-full max-h-full overflow-y-auto' : ''
  }`;

  return (
    <section id="tags" className={sectionClass}>
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold text-slate-900">Tags</h2>
        <div className="flex flex-wrap items-center gap-2">
          {isFullscreen ? (
            <button
              type="button"
              onClick={onCloseFullscreen}
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-accent hover:text-accent"
            >
              Close view
            </button>
          ) : (
            <button
              type="button"
              onClick={onExpand}
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-accent hover:text-accent"
            >
              Full view
            </button>
          )}
        </div>
      </header>

      <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={editingId ? handleEditSubmit : handleCreate}>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="tag-name">
              {editingId ? 'Update name' : 'New name'}
            </label>
            <input
              id="tag-name"
              type="text"
              value={(editingId ? editingDraft.name : draft.name) ?? ''}
              onChange={(event) =>
                editingId
                  ? setEditingDraft((current) => ({ ...current, name: event.target.value }))
                  : setDraft((current) => ({ ...current, name: event.target.value }))
              }
              required
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
              placeholder="Tag name"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="tag-slug">
              Slug
            </label>
            <input
              id="tag-slug"
              type="text"
              value={(editingId ? editingDraft.slug : draft.slug) ?? ''}
              onChange={(event) =>
                editingId
                  ? setEditingDraft((current) => ({ ...current, slug: event.target.value }))
                  : setDraft((current) => ({ ...current, slug: event.target.value }))
              }
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
              placeholder="tag-slug"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="tag-colour">
              Accent colour
            </label>
            <input
              id="tag-colour"
              type="text"
              value={(editingId ? editingDraft.colour : draft.colour) ?? ''}
              onChange={(event) =>
                editingId
                  ? setEditingDraft((current) => ({ ...current, colour: event.target.value }))
                  : setDraft((current) => ({ ...current, colour: event.target.value }))
              }
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
              placeholder="#F97316"
            />
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="tag-description">
              Description
            </label>
            <textarea
              id="tag-description"
              rows={5}
              value={(editingId ? editingDraft.description : draft.description) ?? ''}
              onChange={(event) =>
                editingId
                  ? setEditingDraft((current) => ({ ...current, description: event.target.value }))
                  : setDraft((current) => ({ ...current, description: event.target.value }))
              }
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
              placeholder="Short description"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {editingId ? 'Save' : 'Add'}
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={resetDrafts}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
              >
                Cancel
              </button>
            ) : null}
          </div>
        </div>
      </form>

      <div className="mt-6 space-y-3">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="animate-pulse rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="h-4 w-2/3 rounded-full bg-slate-200" />
              </div>
            ))}
          </div>
        ) : null}

        {!loading && !sortedTags.length ? (
          <p className="text-sm text-slate-500">No tags yet.</p>
        ) : null}

        {!loading && sortedTags.length
          ? sortedTags.map((tag) => (
              <div key={tag.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{tag.name}</p>
                    <p className="text-xs text-slate-500">{tag.slug}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => beginEdit(tag)}
                      className="rounded-full border border-slate-200 px-3 py-1 font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(tag.id)}
                      className="rounded-full border border-rose-200 px-3 py-1 font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                {tag.description ? <p className="mt-2 text-sm text-slate-600">{tag.description}</p> : null}
              </div>
            ))
          : null}
      </div>
    </section>
  );
}
