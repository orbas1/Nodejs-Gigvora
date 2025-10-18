import { useMemo, useState } from 'react';

const CATEGORY_OPTIONS = [
  { value: 'system', label: 'System' },
  { value: 'project', label: 'Projects' },
  { value: 'message', label: 'Messages' },
  { value: 'financial', label: 'Finance' },
  { value: 'marketing', label: 'Marketing' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

const DEFAULT_FORM = {
  title: '',
  message: '',
  category: 'system',
  priority: 'normal',
  ctaLabel: '',
  ctaUrl: '',
  thumbnailUrl: '',
  imageAlt: '',
  sendDuringQuietHours: false,
};

function trimPayload(form) {
  return {
    title: form.title.trim(),
    message: form.message.trim(),
    category: form.category,
    priority: form.priority,
    ctaLabel: form.ctaLabel.trim() || undefined,
    ctaUrl: form.ctaUrl.trim() || undefined,
    thumbnailUrl: form.thumbnailUrl.trim() || undefined,
    imageAlt: form.imageAlt.trim() || undefined,
    sendDuringQuietHours: form.sendDuringQuietHours,
  };
}

export default function AlertComposer({ onSubmit, busy = false, error = null, onResetError, onSuccess }) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [touched, setTouched] = useState(false);

  const canSubmit = useMemo(() => {
    return form.title.trim().length > 0 && form.message.trim().length > 0 && !busy;
  }, [form, busy]);

  const handleChange = (field) => (event) => {
    if (!touched) {
      setTouched(true);
    }
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setForm((previous) => ({ ...previous, [field]: value }));
    if (error && onResetError) {
      onResetError();
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }
    const payload = trimPayload(form);
    const result = await onSubmit(payload);
    if (result !== false) {
      setForm(DEFAULT_FORM);
      setTouched(false);
      if (onSuccess) {
        onSuccess();
      }
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-700">Title</span>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange('title')}
            required
            className="rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            placeholder="Alert title"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-700">Category</span>
          <select
            name="category"
            value={form.category}
            onChange={handleChange('category')}
            className="rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-700">Message</span>
          <textarea
            name="message"
            value={form.message}
            onChange={handleChange('message')}
            required
            rows={5}
            className="min-h-[140px] rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            placeholder="Short body copy"
          />
        </label>
        <div className="grid gap-4">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-slate-700">Priority</span>
            <select
              name="priority"
              value={form.priority}
              onChange={handleChange('priority')}
              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {PRIORITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-2 rounded-2xl border border-slate-200 p-3">
            <span className="text-sm font-medium text-slate-700">Link</span>
            <label className="flex flex-col gap-1 text-xs text-slate-600">
              <span>Label</span>
              <input
                type="text"
                name="ctaLabel"
                value={form.ctaLabel}
                onChange={handleChange('ctaLabel')}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="View"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-slate-600">
              <span>URL</span>
              <input
                type="url"
                name="ctaUrl"
                value={form.ctaUrl}
                onChange={handleChange('ctaUrl')}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="https://"
              />
            </label>
          </div>

          <div className="grid gap-2 rounded-2xl border border-slate-200 p-3">
            <span className="text-sm font-medium text-slate-700">Media</span>
            <label className="flex flex-col gap-1 text-xs text-slate-600">
              <span>Image</span>
              <input
                type="url"
                name="thumbnailUrl"
                value={form.thumbnailUrl}
                onChange={handleChange('thumbnailUrl')}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="https://"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-slate-600">
              <span>Alt text</span>
              <input
                type="text"
                name="imageAlt"
                value={form.imageAlt}
                onChange={handleChange('imageAlt')}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="Image description"
              />
            </label>
          </div>
        </div>
      </div>

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          name="sendDuringQuietHours"
          checked={form.sendDuringQuietHours}
          onChange={handleChange('sendDuringQuietHours')}
          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
        />
        <span className="text-sm text-slate-600">Bypass quiet hours</span>
      </label>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error.message || 'Could not send alert.'}
        </div>
      ) : null}

      <div className="flex flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={() => {
            setForm(DEFAULT_FORM);
            setTouched(false);
            if (onResetError) {
              onResetError();
            }
          }}
          className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:border-slate-300 hover:text-slate-800"
          disabled={busy}
        >
          Clear
        </button>
        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {busy ? 'Sending…' : 'Send'}
        </button>
      </div>
    </form>
  );
}
