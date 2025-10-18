import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import SlideOverPanel from './SlideOverPanel.jsx';

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
];

const VISIBILITY_OPTIONS = [
  { value: 'workspace', label: 'Workspace' },
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Private' },
];

function formatInputDateTime(value) {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
}

export default function PostDrawer({ open, mode, initialValue, saving, error, onClose, onSubmit }) {
  const [form, setForm] = useState({
    title: '',
    status: 'draft',
    visibility: 'workspace',
    summary: '',
    body: '',
    heroImageUrl: '',
    ctaUrl: '',
    scheduledFor: '',
    publishedAt: '',
    expiresAt: '',
    authorId: '',
    tags: '',
  });

  useEffect(() => {
    if (open) {
      setForm({
        title: initialValue?.title ?? '',
        status: initialValue?.status ?? 'draft',
        visibility: initialValue?.visibility ?? 'workspace',
        summary: initialValue?.summary ?? '',
        body: initialValue?.body ?? '',
        heroImageUrl: initialValue?.heroImageUrl ?? '',
        ctaUrl: initialValue?.ctaUrl ?? '',
        scheduledFor: formatInputDateTime(initialValue?.scheduledFor),
        publishedAt: formatInputDateTime(initialValue?.publishedAt),
        expiresAt: formatInputDateTime(initialValue?.expiresAt),
        authorId: initialValue?.authorId ? String(initialValue.authorId) : '',
        tags: Array.isArray(initialValue?.tags) ? initialValue.tags.join(', ') : initialValue?.tags ?? '',
      });
    }
  }, [open, initialValue]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const tags = form.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
    onSubmit({
      title: form.title.trim(),
      status: form.status,
      visibility: form.visibility,
      summary: form.summary.trim() || null,
      body: form.body.trim() || null,
      heroImageUrl: form.heroImageUrl.trim() || null,
      ctaUrl: form.ctaUrl.trim() || null,
      scheduledFor: form.scheduledFor || null,
      publishedAt: form.publishedAt || null,
      expiresAt: form.expiresAt || null,
      authorId: form.authorId ? Number(form.authorId) : null,
      tags,
    });
  };

  return (
    <SlideOverPanel
      open={open}
      title={mode === 'create' ? 'New post' : 'Edit post'}
      onClose={onClose}
      width="40rem"
      footer={
        <div className="flex justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="timeline-post-form"
            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save post'}
          </button>
        </div>
      }
    >
      <form id="timeline-post-form" className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="post-title" className="text-sm font-medium text-slate-700">
            Title
          </label>
          <input
            id="post-title"
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            placeholder="Hiring update"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="post-status" className="text-sm font-medium text-slate-700">
              Status
            </label>
            <select
              id="post-status"
              name="status"
              value={form.status}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="post-visibility" className="text-sm font-medium text-slate-700">
              Visibility
            </label>
            <select
              id="post-visibility"
              name="visibility"
              value={form.visibility}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            >
              {VISIBILITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="post-author" className="text-sm font-medium text-slate-700">
              Author ID
            </label>
            <input
              id="post-author"
              name="authorId"
              value={form.authorId}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              placeholder="123"
              inputMode="numeric"
              pattern="[0-9]*"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="post-scheduled" className="text-sm font-medium text-slate-700">
              Schedule
            </label>
            <input
              id="post-scheduled"
              name="scheduledFor"
              type="datetime-local"
              value={form.scheduledFor}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            />
          </div>
          <div>
            <label htmlFor="post-published" className="text-sm font-medium text-slate-700">
              Publish
            </label>
            <input
              id="post-published"
              name="publishedAt"
              type="datetime-local"
              value={form.publishedAt}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            />
          </div>
          <div>
            <label htmlFor="post-expires" className="text-sm font-medium text-slate-700">
              Expires
            </label>
            <input
              id="post-expires"
              name="expiresAt"
              type="datetime-local"
              value={form.expiresAt}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="post-hero" className="text-sm font-medium text-slate-700">
              Hero image URL
            </label>
            <input
              id="post-hero"
              name="heroImageUrl"
              value={form.heroImageUrl}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              placeholder="https://"
            />
          </div>
          <div>
            <label htmlFor="post-cta" className="text-sm font-medium text-slate-700">
              Button link
            </label>
            <input
              id="post-cta"
              name="ctaUrl"
              value={form.ctaUrl}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              placeholder="https://"
            />
          </div>
        </div>

        <div>
          <label htmlFor="post-summary" className="text-sm font-medium text-slate-700">
            Summary
          </label>
          <textarea
            id="post-summary"
            name="summary"
            value={form.summary}
            onChange={handleChange}
            rows={3}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            placeholder="One line overview"
          />
        </div>

        <div>
          <label htmlFor="post-body" className="text-sm font-medium text-slate-700">
            Body
          </label>
          <textarea
            id="post-body"
            name="body"
            value={form.body}
            onChange={handleChange}
            rows={6}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            placeholder="Full message"
          />
        </div>

        <div>
          <label htmlFor="post-tags" className="text-sm font-medium text-slate-700">
            Tags
          </label>
          <input
            id="post-tags"
            name="tags"
            value={form.tags}
            onChange={handleChange}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            placeholder="growth, hiring"
          />
        </div>

        {error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}
      </form>
    </SlideOverPanel>
  );
}

PostDrawer.propTypes = {
  open: PropTypes.bool,
  mode: PropTypes.oneOf(['create', 'edit']).isRequired,
  initialValue: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    title: PropTypes.string,
    status: PropTypes.string,
    visibility: PropTypes.string,
    summary: PropTypes.string,
    body: PropTypes.string,
    heroImageUrl: PropTypes.string,
    ctaUrl: PropTypes.string,
    scheduledFor: PropTypes.string,
    publishedAt: PropTypes.string,
    expiresAt: PropTypes.string,
    authorId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    tags: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.string), PropTypes.string]),
  }),
  saving: PropTypes.bool,
  error: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

PostDrawer.defaultProps = {
  open: false,
  initialValue: null,
  saving: false,
  error: null,
};
