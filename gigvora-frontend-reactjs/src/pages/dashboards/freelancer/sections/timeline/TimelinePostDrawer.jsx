import { useEffect, useMemo, useState } from 'react';
import { PaperAirplaneIcon, TrashIcon } from '@heroicons/react/24/outline';
import TimelineDrawer from './TimelineDrawer.jsx';

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
];

const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public' },
  { value: 'connections', label: 'Connections' },
  { value: 'private', label: 'Private' },
];

function normalisePost(post) {
  return {
    title: post?.title ?? '',
    summary: post?.summary ?? '',
    content: post?.content ?? '',
    status: post?.status ?? 'draft',
    visibility: post?.visibility ?? 'public',
    scheduledAt: post?.scheduledAt ? post.scheduledAt.slice(0, 16) : '',
    timezone: post?.timezone ?? 'UTC',
    heroImageUrl: post?.heroImageUrl ?? '',
    allowComments: Boolean(post?.allowComments ?? true),
    tags: Array.isArray(post?.tags) ? post.tags.join(', ') : '',
    campaign: post?.campaign ?? '',
    targetAudience: Array.isArray(post?.targetAudience)
      ? post.targetAudience.map((item) => item.label ?? item).join(', ')
      : '',
    callToActionLabel: post?.callToAction?.label ?? '',
    callToActionUrl: post?.callToAction?.url ?? '',
    attachments: Array.isArray(post?.attachments)
      ? post.attachments.map((item) => `${item.label ?? item.url ?? ''}|${item.url ?? ''}`).join('\n')
      : '',
  };
}

function normaliseMetrics(post) {
  const totals = post?.metrics?.totals ?? {};
  return {
    capturedAt: new Date().toISOString().slice(0, 16),
    impressions: totals.impressions ?? 0,
    views: totals.views ?? 0,
    clicks: totals.clicks ?? 0,
    comments: totals.comments ?? 0,
    reactions: totals.reactions ?? 0,
    saves: totals.saves ?? 0,
    shares: totals.shares ?? 0,
    profileVisits: totals.profileVisits ?? 0,
    leads: totals.leads ?? 0,
  };
}

function parseAudience(value) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((label) => ({ id: label.toLowerCase().replace(/[^a-z0-9]+/g, '-'), label }));
}

function parseAttachments(value) {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, url] = line.split('|').map((part) => part.trim());
      return { label: label || url, url };
    })
    .filter((item) => item.url);
}

export default function TimelinePostDrawer({
  open,
  mode,
  post,
  onClose,
  onSubmit,
  onDelete,
  onPublish,
  onRecordMetrics,
  savingPost,
  savingMetrics,
}) {
  const [tab, setTab] = useState(mode === 'metrics' ? 'metrics' : 'content');
  const [form, setForm] = useState(() => normalisePost(post));
  const [metricsForm, setMetricsForm] = useState(() => normaliseMetrics(post));

  useEffect(() => {
    if (open) {
      setForm(normalisePost(post));
      setMetricsForm(normaliseMetrics(post));
      setTab(mode === 'metrics' ? 'metrics' : 'content');
    }
  }, [mode, open, post]);

  const headerTitle = useMemo(() => {
    if (mode === 'edit') {
      return 'Edit post';
    }
    if (mode === 'metrics') {
      return 'Post metrics';
    }
    return 'New post';
  }, [mode]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((previous) => ({ ...previous, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleMetricsChange = (event) => {
    const { name, value } = event.target;
    setMetricsForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const payload = {
      title: form.title.trim(),
      summary: form.summary.trim(),
      content: form.content.trim(),
      status: form.status,
      visibility: form.visibility,
      scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : null,
      timezone: form.timezone,
      heroImageUrl: form.heroImageUrl.trim() || null,
      allowComments: Boolean(form.allowComments),
      tags: form.tags
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      campaign: form.campaign.trim() || null,
      targetAudience: parseAudience(form.targetAudience),
      callToAction: form.callToActionLabel || form.callToActionUrl
        ? { label: form.callToActionLabel.trim() || 'View more', url: form.callToActionUrl.trim() }
        : null,
      attachments: parseAttachments(form.attachments),
    };
    onSubmit(payload, post?.id ?? null);
  };

  const handleMetricsSubmit = (event) => {
    event.preventDefault();
    const payload = {
      capturedAt: metricsForm.capturedAt ? new Date(metricsForm.capturedAt).toISOString() : new Date().toISOString(),
      impressions: Number(metricsForm.impressions ?? 0),
      views: Number(metricsForm.views ?? 0),
      clicks: Number(metricsForm.clicks ?? 0),
      comments: Number(metricsForm.comments ?? 0),
      reactions: Number(metricsForm.reactions ?? 0),
      saves: Number(metricsForm.saves ?? 0),
      shares: Number(metricsForm.shares ?? 0),
      profileVisits: Number(metricsForm.profileVisits ?? 0),
      leads: Number(metricsForm.leads ?? 0),
    };
    onRecordMetrics(post?.id, payload);
  };

  return (
    <TimelineDrawer
      open={open}
      title={headerTitle}
      subtitle="Manage your update"
      onClose={onClose}
      width="max-w-3xl"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTab('content')}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                tab === 'content' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              Content
            </button>
            <button
              type="button"
              onClick={() => setTab('metrics')}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                tab === 'metrics' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              Metrics
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {mode !== 'create' && post?.status !== 'published' ? (
              <button
                type="button"
                onClick={() => onPublish(post)}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
              >
                <PaperAirplaneIcon className="h-4 w-4" />
                Publish
              </button>
            ) : null}
            {mode === 'edit' ? (
              <button
                type="button"
                onClick={() => onDelete(post)}
                className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-100"
              >
                <TrashIcon className="h-4 w-4" />
                Delete
              </button>
            ) : null}
            {tab === 'metrics' ? (
              <button
                type="submit"
                form="timeline-post-metrics"
                className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                disabled={savingMetrics}
              >
                {savingMetrics ? 'Saving…' : 'Save metrics'}
              </button>
            ) : (
              <button
                type="submit"
                form="timeline-post-form"
                className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                disabled={savingPost}
              >
                {savingPost ? 'Saving…' : 'Save post'}
              </button>
            )}
          </div>
        </div>
      }
    >
      {tab === 'metrics' ? (
        <form id="timeline-post-metrics" className="space-y-4" onSubmit={handleMetricsSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            {['capturedAt', 'impressions', 'views', 'clicks', 'comments', 'reactions', 'saves', 'shares', 'profileVisits', 'leads'].map((field) => (
              <label key={field} className="space-y-2 text-sm font-medium text-slate-700">
                <span className="capitalize">{field.replace(/([A-Z])/g, ' $1')}</span>
                <input
                  type={field === 'capturedAt' ? 'datetime-local' : 'number'}
                  name={field}
                  value={metricsForm[field] ?? ''}
                  onChange={handleMetricsChange}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </label>
            ))}
          </div>
        </form>
      ) : (
        <form id="timeline-post-form" className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Title</span>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                required
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Summary</span>
              <input
                type="text"
                name="summary"
                value={form.summary}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
          </div>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>Content</span>
            <textarea
              name="content"
              value={form.content}
              onChange={handleChange}
              rows={5}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Status</span>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Visibility</span>
              <select
                name="visibility"
                value={form.visibility}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                {VISIBILITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Schedule</span>
              <input
                type="datetime-local"
                name="scheduledAt"
                value={form.scheduledAt}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Timezone</span>
              <input
                type="text"
                name="timezone"
                value={form.timezone}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
          </div>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>Hero image</span>
            <input
              type="url"
              name="heroImageUrl"
              value={form.heroImageUrl}
              onChange={handleChange}
              placeholder="https://"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              name="allowComments"
              checked={Boolean(form.allowComments)}
              onChange={handleChange}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Allow comments</span>
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Tags</span>
              <input
                type="text"
                name="tags"
                value={form.tags}
                onChange={handleChange}
                placeholder="Product, Update"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Campaign</span>
              <input
                type="text"
                name="campaign"
                value={form.campaign}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
          </div>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>Audience</span>
            <input
              type="text"
              name="targetAudience"
              value={form.targetAudience}
              onChange={handleChange}
              placeholder="Clients, Investors"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>CTA label</span>
              <input
                type="text"
                name="callToActionLabel"
                value={form.callToActionLabel}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>CTA link</span>
              <input
                type="url"
                name="callToActionUrl"
                value={form.callToActionUrl}
                onChange={handleChange}
                placeholder="https://"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
          </div>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>Assets</span>
            <textarea
              name="attachments"
              value={form.attachments}
              onChange={handleChange}
              rows={3}
              placeholder="Launch deck|https://files.example.com/deck.pdf"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </label>
        </form>
      )}
    </TimelineDrawer>
  );
}
