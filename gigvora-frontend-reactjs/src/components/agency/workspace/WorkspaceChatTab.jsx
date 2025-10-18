import { useState } from 'react';

const CHANNEL_OPTIONS = ['general', 'client-updates', 'delivery', 'risk', 'qa'];

function formatTimestamp(value) {
  if (!value) return 'Just now';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Just now';
  return new Intl.DateTimeFormat('en-GB', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
}

export default function WorkspaceChatTab({ messages = [], onCreate, onUpdate, onDelete }) {
  const [formState, setFormState] = useState(null);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Project chat</h2>
        <button
          type="button"
          onClick={() => setFormState({ channel: 'general' })}
          className="inline-flex items-center rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accentDark"
        >
          {formState?.id ? 'Editing message…' : 'Post update'}
        </button>
      </div>
      <div className="mt-4 space-y-3">
        {messages.map((message) => (
          <div key={message.id} className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {message.authorName}{' '}
                  <span className="text-xs font-normal uppercase tracking-wide text-slate-400">{message.channel}</span>
                </p>
                <p className="text-xs text-slate-500">{formatTimestamp(message.postedAt)}</p>
                <p className="mt-2 text-sm text-slate-700">{message.body}</p>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setFormState({
                      id: message.id,
                      channel: message.channel ?? 'general',
                      authorName: message.authorName ?? '',
                      authorRole: message.authorRole ?? '',
                      body: message.body ?? '',
                      postedAt: message.postedAt ? message.postedAt.slice(0, 16) : '',
                      pinned: message.pinned ?? false,
                    })
                  }
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDelete?.(message.id)}
                  className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
        {messages.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs text-slate-500">
            No chat activity yet.
          </div>
        ) : null}
      </div>

      {formState !== null ? (
        <form
          className="mt-6 grid gap-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!formState.authorName || !formState.body) {
              return;
            }
            const payload = {
              channel: formState.channel,
              authorName: formState.authorName,
              authorRole: formState.authorRole,
              body: formState.body,
              postedAt: formState.postedAt,
              pinned: Boolean(formState.pinned),
            };
            if (formState.id) {
              onUpdate?.(formState.id, payload);
            } else {
              onCreate?.(payload);
            }
            setFormState(null);
          }}
        >
          <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Channel
            <select
              value={formState.channel ?? 'general'}
              onChange={(event) => setFormState((state) => ({ ...(state ?? {}), channel: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              {CHANNEL_OPTIONS.map((channel) => (
                <option key={channel} value={channel}>
                  {channel.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Posted at
            <input
              type="datetime-local"
              value={formState.postedAt ?? ''}
              onChange={(event) => setFormState((state) => ({ ...(state ?? {}), postedAt: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>
          <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Author name
            <input
              type="text"
              value={formState.authorName ?? ''}
              onChange={(event) => setFormState((state) => ({ ...(state ?? {}), authorName: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              required
            />
          </label>
          <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Author role
            <input
              type="text"
              value={formState.authorRole ?? ''}
              onChange={(event) => setFormState((state) => ({ ...(state ?? {}), authorRole: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>
          <label className="md:col-span-2 space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Message
            <textarea
              value={formState.body ?? ''}
              onChange={(event) => setFormState((state) => ({ ...(state ?? {}), body: event.target.value }))}
              rows={3}
              className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              required
            />
          </label>
          <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Pinned
            <select
              value={String(formState.pinned ?? false)}
              onChange={(event) => setFormState((state) => ({ ...(state ?? {}), pinned: event.target.value === 'true' }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              <option value="false">No</option>
              <option value="true">Yes</option>
            </select>
          </label>
          <div className="md:col-span-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setFormState(null)}
              className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-700"
            >
              {formState.id ? 'Save message' : 'Post message'}
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
