import { useEffect, useMemo, useState } from 'react';
import { TrashIcon } from '@heroicons/react/24/outline';
import TimelineDrawer from './TimelineDrawer.jsx';

const STATUS_OPTIONS = [
  { value: 'planned', label: 'Planned' },
  { value: 'in_progress', label: 'Active' },
  { value: 'completed', label: 'Done' },
  { value: 'blocked', label: 'Blocked' },
];

const TYPE_OPTIONS = [
  { value: 'milestone', label: 'Milestone' },
  { value: 'campaign', label: 'Campaign' },
  { value: 'task', label: 'Task' },
  { value: 'event', label: 'Event' },
];

function normaliseForm(entry) {
  return {
    title: entry?.title ?? '',
    entryType: entry?.entryType ?? 'milestone',
    status: entry?.status ?? 'planned',
    description: entry?.description ?? '',
    startAt: entry?.startAt ? entry.startAt.slice(0, 16) : '',
    endAt: entry?.endAt ? entry.endAt.slice(0, 16) : '',
    channel: entry?.channel ?? '',
    owner: entry?.owner ?? '',
    location: entry?.location ?? '',
    linkedPostId: entry?.linkedPostId ?? entry?.linkedPost?.id ?? '',
    tags: Array.isArray(entry?.tags) ? entry.tags.join(', ') : '',
  };
}

export default function TimelineEntryDrawer({ open, mode, entry, posts, onClose, onSubmit, onDelete, saving }) {
  const [form, setForm] = useState(() => normaliseForm(entry));

  useEffect(() => {
    if (open) {
      setForm(normaliseForm(entry));
    }
  }, [entry, open]);

  const postOptions = useMemo(() => {
    return (Array.isArray(posts) ? posts : []).map((post) => ({ id: post.id, title: post.title }));
  }, [posts]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const payload = {
      title: form.title.trim(),
      entryType: form.entryType,
      status: form.status,
      description: form.description.trim(),
      startAt: form.startAt ? new Date(form.startAt).toISOString() : null,
      endAt: form.endAt ? new Date(form.endAt).toISOString() : null,
      channel: form.channel.trim() || null,
      owner: form.owner.trim() || null,
      location: form.location.trim() || null,
      linkedPostId: form.linkedPostId || null,
      tags: form.tags
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    };
    onSubmit(payload, entry?.id ?? null);
  };

  return (
    <TimelineDrawer
      open={open}
      title={mode === 'edit' ? 'Edit entry' : 'New entry'}
      subtitle="Update your delivery timeline"
      onClose={onClose}
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          {mode === 'edit' ? (
            <button
              type="button"
              onClick={() => onDelete(entry)}
              className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-100"
            >
              <TrashIcon className="h-4 w-4" />
              Delete
            </button>
          ) : <span />}
          <button
            type="submit"
            form="timeline-entry-form"
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save entry'}
          </button>
        </div>
      }
    >
      <form id="timeline-entry-form" className="space-y-4" onSubmit={handleSubmit}>
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
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>Type</span>
            <select
              name="entryType"
              value={form.entryType}
              onChange={handleChange}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              {TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>Linked post</span>
            <select
              name="linkedPostId"
              value={form.linkedPostId}
              onChange={handleChange}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="">None</option>
              {postOptions.map((post) => (
                <option key={post.id} value={post.id}>
                  {post.title}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="space-y-2 text-sm font-medium text-slate-700">
          <span>Description</span>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={4}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>Start</span>
            <input
              type="datetime-local"
              name="startAt"
              value={form.startAt}
              onChange={handleChange}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>End</span>
            <input
              type="datetime-local"
              name="endAt"
              value={form.endAt}
              onChange={handleChange}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>Channel</span>
            <input
              type="text"
              name="channel"
              value={form.channel}
              onChange={handleChange}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>Owner</span>
            <input
              type="text"
              name="owner"
              value={form.owner}
              onChange={handleChange}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </label>
        </div>
        <label className="space-y-2 text-sm font-medium text-slate-700">
          <span>Location</span>
          <input
            type="text"
            name="location"
            value={form.location}
            onChange={handleChange}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </label>
        <label className="space-y-2 text-sm font-medium text-slate-700">
          <span>Tags</span>
          <input
            type="text"
            name="tags"
            value={form.tags}
            onChange={handleChange}
            placeholder="Design, Update"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </label>
      </form>
    </TimelineDrawer>
  );
}
