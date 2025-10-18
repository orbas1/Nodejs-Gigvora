import { useMemo, useState } from 'react';

const EMPTY_CATEGORY = Object.freeze({ name: '', slug: '', description: '', accentColor: '', heroImageUrl: '' });

export default function BlogCategoryManager({
  categories,
  onCreate,
  onUpdate,
  onDelete,
  loading,
  onExpand,
  onCloseFullscreen,
  isFullscreen = false,
}) {
  const [draft, setDraft] = useState(EMPTY_CATEGORY);
  const [editingId, setEditingId] = useState(null);
  const [editingDraft, setEditingDraft] = useState(EMPTY_CATEGORY);
  const [submitting, setSubmitting] = useState(false);
  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.name.localeCompare(b.name)),
    [categories],
  );

  const resetDrafts = () => {
    setDraft(EMPTY_CATEGORY);
    setEditingId(null);
    setEditingDraft(EMPTY_CATEGORY);
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
        accentColor: draft.accentColor || undefined,
        heroImageUrl: draft.heroImageUrl || undefined,
      });
      setDraft(EMPTY_CATEGORY);
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
        accentColor: editingDraft.accentColor || undefined,
        heroImageUrl: editingDraft.heroImageUrl || undefined,
      });
      resetDrafts();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (categoryId) => {
    if (!categoryId) {
      return;
    }
    const confirmDelete = window.confirm('Delete this category?');
    if (!confirmDelete) {
      return;
    }
    await onDelete(categoryId);
    if (editingId === categoryId) {
      resetDrafts();
    }
  };

  const beginEdit = (category) => {
    setEditingId(category.id);
    setEditingDraft({
      name: category.name ?? '',
      slug: category.slug ?? '',
      description: category.description ?? '',
      accentColor: category.accentColor ?? '',
      heroImageUrl: category.heroImageUrl ?? '',
    });
  };

  const sectionClass = `rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm ${
    isFullscreen ? 'h-full max-h-full overflow-y-auto' : ''
  }`;

  return (
    <section id="categories" className={sectionClass}>
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold text-slate-900">Topics</h2>
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
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="category-name">
              {editingId ? 'Update name' : 'New name'}
            </label>
            <input
              id="category-name"
              type="text"
              value={(editingId ? editingDraft.name : draft.name) ?? ''}
              onChange={(event) =>
                editingId
                  ? setEditingDraft((current) => ({ ...current, name: event.target.value }))
                  : setDraft((current) => ({ ...current, name: event.target.value }))
              }
              required
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
              placeholder="Topic name"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="category-slug">
              Slug
            </label>
            <input
              id="category-slug"
              type="text"
              value={(editingId ? editingDraft.slug : draft.slug) ?? ''}
              onChange={(event) =>
                editingId
                  ? setEditingDraft((current) => ({ ...current, slug: event.target.value }))
                  : setDraft((current) => ({ ...current, slug: event.target.value }))
              }
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
              placeholder="topic-slug"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="category-accent">
              Accent colour
            </label>
            <input
              id="category-accent"
              type="text"
              value={(editingId ? editingDraft.accentColor : draft.accentColor) ?? ''}
              onChange={(event) =>
                editingId
                  ? setEditingDraft((current) => ({ ...current, accentColor: event.target.value }))
                  : setDraft((current) => ({ ...current, accentColor: event.target.value }))
              }
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
              placeholder="#2563EB"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="category-hero">
              Hero image URL
            </label>
            <input
              id="category-hero"
              type="url"
              value={(editingId ? editingDraft.heroImageUrl : draft.heroImageUrl) ?? ''}
              onChange={(event) =>
                editingId
                  ? setEditingDraft((current) => ({ ...current, heroImageUrl: event.target.value }))
                  : setDraft((current) => ({ ...current, heroImageUrl: event.target.value }))
              }
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
              placeholder="https://image.jpg"
            />
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="category-description">
              Description
            </label>
            <textarea
              id="category-description"
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

        {!loading && !sortedCategories.length ? (
          <p className="text-sm text-slate-500">No topics yet.</p>
        ) : null}

        {!loading && sortedCategories.length
          ? sortedCategories.map((category) => (
              <div key={category.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{category.name}</p>
                    <p className="text-xs text-slate-500">{category.slug}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => beginEdit(category)}
                      className="rounded-full border border-slate-200 px-3 py-1 font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(category.id)}
                      className="rounded-full border border-rose-200 px-3 py-1 font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                {category.description ? (
                  <p className="mt-2 text-sm text-slate-600">{category.description}</p>
                ) : null}
              </div>
            ))
          : null}
      </div>
    </section>
  );
}
