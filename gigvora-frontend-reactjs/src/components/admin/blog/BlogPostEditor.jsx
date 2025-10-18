import { useMemo } from 'react';

export default function BlogPostEditor({
  formState,
  onChange,
  onSubmit,
  onDelete,
  onStartNew,
  saving,
  categories,
  selectedPost,
  onExpand,
  onCloseFullscreen,
  isFullscreen = false,
}) {
  const metricsSummary = useMemo(() => {
    const metrics = selectedPost?.metrics ?? null;
    if (!metrics) {
      return null;
    }
    return [
      { label: 'Views', value: metrics.totalViews ?? 0 },
      { label: 'Readers', value: metrics.uniqueVisitors ?? 0 },
      { label: 'Read time (s)', value: metrics.averageReadTimeSeconds ?? 0 },
      { label: 'Comments', value: metrics.commentCount ?? 0 },
    ].map((entry) => ({
      ...entry,
      value:
        typeof entry.value === 'number' && Number.isFinite(entry.value)
          ? entry.value.toLocaleString()
          : entry.value ?? '0',
    }));
  }, [selectedPost]);

  const handleFieldChange = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    onChange(field, value);
  };

  const formWrapperClass = isFullscreen
    ? 'flex h-full flex-col gap-6 overflow-y-auto'
    : 'flex flex-col gap-6';

  return (
    <section
      id="editor"
      className={`rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm ${
        isFullscreen ? 'h-full max-h-full' : ''
      }`}
    >
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-slate-900">Write</h2>
          <p className="text-sm text-slate-500">
            {selectedPost ? `Editing: ${selectedPost.title}` : 'New article'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {selectedPost ? (
            <button
              type="button"
              onClick={onStartNew}
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-accent hover:text-accent"
            >
              New draft
            </button>
          ) : null}
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

      {metricsSummary ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {metricsSummary.map((metric) => (
            <div key={metric.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{metric.label}</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">{metric.value}</p>
            </div>
          ))}
        </div>
      ) : null}

      <form className={`${formWrapperClass} mt-4`} onSubmit={onSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="title" className="block text-sm font-semibold text-slate-700">
              Title
            </label>
            <input
              id="title"
              type="text"
              required
              value={formState.title}
              onChange={handleFieldChange('title')}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
              placeholder="Title"
            />
          </div>
          <div>
            <label htmlFor="slug" className="block text-sm font-semibold text-slate-700">
              Slug
            </label>
            <input
              id="slug"
              type="text"
              value={formState.slug}
              onChange={handleFieldChange('slug')}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
              placeholder="slug"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label htmlFor="status" className="block text-sm font-semibold text-slate-700">
              Status
            </label>
            <select
              id="status"
              value={formState.status}
              onChange={handleFieldChange('status')}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
            >
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div>
            <label htmlFor="categoryId" className="block text-sm font-semibold text-slate-700">
              Category
            </label>
            <select
              id="categoryId"
              value={formState.categoryId}
              onChange={handleFieldChange('categoryId')}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
            >
              <option value="">Uncategorised</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="readingTimeMinutes" className="block text-sm font-semibold text-slate-700">
              Read minutes
            </label>
            <input
              id="readingTimeMinutes"
              type="number"
              min="1"
              value={formState.readingTimeMinutes}
              onChange={handleFieldChange('readingTimeMinutes')}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="featured" className="block text-sm font-semibold text-slate-700">
              Placement
            </label>
            <select
              id="featured"
              value={formState.featured ? 'true' : 'false'}
              onChange={(event) => onChange('featured', event.target.value === 'true')}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
            >
              <option value="false">Standard</option>
              <option value="true">Pinned</option>
            </select>
          </div>
          <div>
            <label htmlFor="coverImageUrl" className="block text-sm font-semibold text-slate-700">
              Cover image URL
            </label>
            <input
              id="coverImageUrl"
              type="url"
              value={formState.coverImageUrl}
              onChange={handleFieldChange('coverImageUrl')}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
              placeholder="https://"
            />
          </div>
        </div>

        <div>
          <label htmlFor="excerpt" className="block text-sm font-semibold text-slate-700">
            Summary
          </label>
          <textarea
            id="excerpt"
            rows={3}
            value={formState.excerpt}
            onChange={handleFieldChange('excerpt')}
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
            placeholder="Short summary"
          />
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-semibold text-slate-700">
            Body
          </label>
          <textarea
            id="content"
            rows={12}
            required
            value={formState.content}
            onChange={handleFieldChange('content')}
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
            placeholder="Content"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="tagsText" className="block text-sm font-semibold text-slate-700">
              Tags
            </label>
            <input
              id="tagsText"
              type="text"
              value={formState.tagsText}
              onChange={handleFieldChange('tagsText')}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
              placeholder="tag-one, tag-two"
            />
          </div>
          <div>
            <label htmlFor="mediaUrls" className="block text-sm font-semibold text-slate-700">
              Media URLs
            </label>
            <textarea
              id="mediaUrls"
              rows={3}
              value={formState.mediaUrls}
              onChange={handleFieldChange('mediaUrls')}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
              placeholder="https://image.jpg"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center rounded-full bg-accent px-6 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {formState.id ? 'Save' : 'Publish'}
          </button>
          {formState.id ? (
            <button
              type="button"
              onClick={onDelete}
              className="inline-flex items-center justify-center rounded-full border border-rose-200 px-6 py-2 text-sm font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-50"
            >
              Delete
            </button>
          ) : null}
          {saving ? <span className="text-xs text-slate-500">Saving…</span> : null}
        </div>
      </form>
    </section>
  );
}
