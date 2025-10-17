import { useMemo, useState } from 'react';

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
];

export default function AgencyBlogPostForm({
  formState,
  onChange,
  onSubmit,
  onReset,
  saving,
  categories = [],
  workspaceName,
  mode = 'full',
  submitLabel,
}) {
  const [step, setStep] = useState(0);

  const updateField = (field, value) => {
    onChange?.({ ...formState, [field]: value });
  };

  const sections = useMemo(() => {
    const common = [
      {
        id: 'details',
        name: 'Details',
        content: (
          <div className="space-y-5">
            <div className="flex flex-col gap-1">
              <label htmlFor="post-title" className="text-sm font-semibold text-slate-700">
                Title
              </label>
              <input
                id="post-title"
                type="text"
                required
                value={formState.title}
                onChange={(event) => updateField('title', event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label htmlFor="post-slug" className="text-sm font-semibold text-slate-700">
                  Slug
                </label>
                <input
                  id="post-slug"
                  type="text"
                  value={formState.slug}
                  onChange={(event) => updateField('slug', event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="post-status" className="text-sm font-semibold text-slate-700">
                  Status
                </label>
                <select
                  id="post-status"
                  value={formState.status}
                  onChange={(event) => updateField('status', event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="post-category" className="text-sm font-semibold text-slate-700">
                Category
              </label>
              <select
                id="post-category"
                value={formState.categoryId}
                onChange={(event) => updateField('categoryId', event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
              >
                <option value="">Uncategorised</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ),
      },
      {
        id: 'story',
        name: 'Story',
        content: (
          <div className="space-y-5">
            <div className="flex flex-col gap-1">
              <label htmlFor="post-excerpt" className="text-sm font-semibold text-slate-700">
                Summary
              </label>
              <textarea
                id="post-excerpt"
                rows={3}
                value={formState.excerpt}
                onChange={(event) => updateField('excerpt', event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="post-content" className="text-sm font-semibold text-slate-700">
                Content
              </label>
              <textarea
                id="post-content"
                rows={10}
                required
                value={formState.content}
                onChange={(event) => updateField('content', event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
              />
            </div>
          </div>
        ),
      },
      {
        id: 'assets',
        name: 'Assets',
        content: (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-1">
                <label htmlFor="post-reading-time" className="text-sm font-semibold text-slate-700">
                  Read time
                </label>
                <input
                  id="post-reading-time"
                  type="number"
                  min="1"
                  value={formState.readingTimeMinutes}
                  onChange={(event) => updateField('readingTimeMinutes', event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="post-featured" className="text-sm font-semibold text-slate-700">
                  Feature
                </label>
                <select
                  id="post-featured"
                  value={formState.featured ? 'true' : 'false'}
                  onChange={(event) => updateField('featured', event.target.value === 'true')}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
                >
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="post-cover" className="text-sm font-semibold text-slate-700">
                  Cover URL
                </label>
                <input
                  id="post-cover"
                  type="text"
                  value={formState.coverImageUrl}
                  onChange={(event) => updateField('coverImageUrl', event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label htmlFor="post-tags" className="text-sm font-semibold text-slate-700">
                  Tags
                </label>
                <input
                  id="post-tags"
                  type="text"
                  value={formState.tagsText}
                  onChange={(event) => updateField('tagsText', event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="post-media" className="text-sm font-semibold text-slate-700">
                  Gallery
                </label>
                <textarea
                  id="post-media"
                  rows={3}
                  value={formState.mediaUrls}
                  onChange={(event) => updateField('mediaUrls', event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
                />
              </div>
            </div>
          </div>
        ),
      },
    ];

    if (mode === 'wizard') {
      return common;
    }

    return [
      {
        id: 'full',
        name: workspaceName ? `Workspace: ${workspaceName}` : 'Workspace',
        content: (
          <div className="space-y-8">
            {common.map((section) => (
              <div key={section.id} className="space-y-5">
                {section.content}
              </div>
            ))}
          </div>
        ),
      },
    ];
  }, [formState, categories, mode, workspaceName]);

  const activeSection = sections[Math.min(step, sections.length - 1)];
  const isWizard = mode === 'wizard';
  const isLastStep = step >= sections.length - 1;

  const handleSubmit = (event) => {
    if (isWizard && !isLastStep) {
      event.preventDefault();
      setStep((current) => Math.min(current + 1, sections.length - 1));
      return;
    }
    onSubmit?.(event);
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {isWizard ? (
        <div className="flex items-center gap-2">
          {sections.map((section, index) => {
            const isActive = index === step;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setStep(index)}
                className={`flex-1 rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-wide transition ${
                  isActive
                    ? 'bg-accent text-white shadow-soft'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {section.name}
              </button>
            );
          })}
        </div>
      ) : null}

      <div>{activeSection?.content}</div>

      <div className="flex flex-wrap items-center gap-3">
        {isWizard && step > 0 ? (
          <button
            type="button"
            onClick={() => setStep((current) => Math.max(current - 1, 0))}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 px-6 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
          >
            Back
          </button>
        ) : null}

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center rounded-full bg-accent px-6 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark disabled:opacity-60"
        >
          {isWizard && !isLastStep ? 'Next' : submitLabel || (formState.id ? 'Save' : 'Publish')}
        </button>

        {onReset ? (
          <button
            type="button"
            onClick={() => {
              onReset();
              setStep(0);
            }}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 px-6 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
          >
            Reset
          </button>
        ) : null}

        {saving ? <span className="text-xs text-slate-500">Saving…</span> : null}
      </div>
    </form>
  );
}
