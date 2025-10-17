import { useState } from 'react';

export default function AgencyBlogTaxonomyPanel({
  categories = [],
  tags = [],
  onCreateCategory,
  onCreateTag,
  onCreateMedia,
  creating,
  loading,
}) {
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });
  const [tagForm, setTagForm] = useState({ name: '', description: '' });
  const [mediaForm, setMediaForm] = useState({ url: '', caption: '' });

  const handleCategorySubmit = (event) => {
    event.preventDefault();
    if (!categoryForm.name) return;
    onCreateCategory?.(categoryForm);
    setCategoryForm({ name: '', description: '' });
  };

  const handleTagSubmit = (event) => {
    event.preventDefault();
    if (!tagForm.name) return;
    onCreateTag?.(tagForm);
    setTagForm({ name: '', description: '' });
  };

  const handleMediaSubmit = (event) => {
    event.preventDefault();
    if (!mediaForm.url) return;
    onCreateMedia?.(mediaForm);
    setMediaForm({ url: '', caption: '' });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <h2 className="text-base font-semibold text-slate-900">Categories</h2>
          <form className="mt-4 space-y-3" onSubmit={handleCategorySubmit}>
            <input
              type="text"
              value={categoryForm.name}
              onChange={(event) => setCategoryForm((current) => ({ ...current, name: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
              required
            />
            <textarea
              rows={2}
              value={categoryForm.description}
              onChange={(event) => setCategoryForm((current) => ({ ...current, description: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
            />
            <button
              type="submit"
              disabled={creating}
              className="w-full rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark disabled:opacity-60"
            >
              Save
            </button>
          </form>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            {categories.length ? (
              categories.map((category) => (
                <li key={category.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                  <span>{category.name}</span>
                  <span className="text-xs text-slate-400">{category.slug}</span>
                </li>
              ))
            ) : (
              <li className="rounded-xl border border-dashed border-slate-200 px-3 py-2 text-xs text-slate-500">Empty</li>
            )}
          </ul>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <h2 className="text-base font-semibold text-slate-900">Tags</h2>
          <form className="mt-4 space-y-3" onSubmit={handleTagSubmit}>
            <input
              type="text"
              value={tagForm.name}
              onChange={(event) => setTagForm((current) => ({ ...current, name: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
              required
            />
            <textarea
              rows={2}
              value={tagForm.description}
              onChange={(event) => setTagForm((current) => ({ ...current, description: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
            />
            <button
              type="submit"
              disabled={creating}
              className="w-full rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark disabled:opacity-60"
            >
              Save
            </button>
          </form>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            {tags.length ? (
              tags.map((tag) => (
                <li key={tag.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                  <span>#{tag.name}</span>
                  <span className="text-xs text-slate-400">{tag.slug}</span>
                </li>
              ))
            ) : (
              <li className="rounded-xl border border-dashed border-slate-200 px-3 py-2 text-xs text-slate-500">Empty</li>
            )}
          </ul>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <h2 className="text-base font-semibold text-slate-900">Media</h2>
        <form className="mt-4 space-y-3" onSubmit={handleMediaSubmit}>
          <input
            type="url"
            value={mediaForm.url}
            onChange={(event) => setMediaForm((current) => ({ ...current, url: event.target.value }))}
            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
            required
          />
          <input
            type="text"
            value={mediaForm.caption}
            onChange={(event) => setMediaForm((current) => ({ ...current, caption: event.target.value }))}
            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
          />
          <button
            type="submit"
            disabled={creating}
            className="w-full rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-accent hover:text-accent disabled:opacity-60"
          >
            Upload
          </button>
        </form>
        {loading ? <p className="mt-3 text-xs text-slate-500">Syncing…</p> : null}
      </div>
    </div>
  );
}
