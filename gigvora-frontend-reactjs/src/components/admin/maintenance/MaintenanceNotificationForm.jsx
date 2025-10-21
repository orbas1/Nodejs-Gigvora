import { useState } from 'react';
import { MegaphoneIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';

const DEFAULT_MESSAGE = {
  channels: ['email', 'in-app'],
  subject: 'Scheduled maintenance window',
  body: 'We are performing scheduled maintenance to keep Gigvora reliable. Access may be limited during the window.',
  audience: 'customers',
  includeTimeline: true,
  includeStatusPage: true,
};

const CHANNEL_OPTIONS = [
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' },
  { value: 'in-app', label: 'In-app banner' },
  { value: 'push', label: 'Mobile push' },
  { value: 'slack', label: 'Slack update' },
];

export default function MaintenanceNotificationForm({ onSend, sending }) {
  const [draft, setDraft] = useState(DEFAULT_MESSAGE);
  const [preview, setPreview] = useState('');

  const handleChange = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const handleChannelsChange = (event) => {
    handleChange(
      'channels',
      Array.from(event.target.selectedOptions).map((option) => option.value),
    );
  };

  const generatePreview = () => {
    const channels = draft.channels.join(', ');
    setPreview(
      `Channels: ${channels}\nAudience: ${draft.audience}\nSubject: ${draft.subject}\n\n${draft.body}\n\nStatus page: ${draft.includeStatusPage ? '✅' : '❌'} | Timeline update: ${draft.includeTimeline ? '✅' : '❌'}`,
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onSend?.(draft);
    setDraft(DEFAULT_MESSAGE);
    setPreview('');
  };

  return (
    <section className="space-y-6" id="maintenance-notifications">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Broadcast maintenance updates</h2>
          <p className="mt-1 text-sm text-slate-600">
            Craft empathetic comms for customers, partners, and internal teams. We automatically handle localisation and channel routing.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-soft">
        <div className="flex items-start gap-4">
          <div className="rounded-3xl bg-slate-900/90 p-4 text-white">
            <MegaphoneIcon className="h-8 w-8" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Compose announcement</h3>
            <p className="text-sm text-slate-500">
              Choose channels, confirm the audience, and write copy. Legal and support teams are auto-mentioned on Slack.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Channels</span>
            <select
              multiple
              value={draft.channels}
              onChange={handleChannelsChange}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              {CHANNEL_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-sm">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Audience</span>
            <select
              value={draft.audience}
              onChange={(event) => handleChange('audience', event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              <option value="customers">Customers</option>
              <option value="partners">Partners</option>
              <option value="internal">Internal teams</option>
            </select>
          </label>

          <label className="space-y-1 text-sm">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Subject / heading</span>
            <input
              type="text"
              value={draft.subject}
              onChange={(event) => handleChange('subject', event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>
        </div>

        <label className="space-y-1 text-sm">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Message</span>
          <textarea
            rows={5}
            value={draft.body}
            onChange={(event) => handleChange('body', event.target.value)}
            className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={draft.includeStatusPage}
              onChange={(event) => handleChange('includeStatusPage', event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
            />
            <span>Post to status.gigvora.com</span>
          </label>

          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={draft.includeTimeline}
              onChange={(event) => handleChange('includeTimeline', event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
            />
            <span>Sync to admin timeline</span>
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={generatePreview}
            className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 hover:border-slate-300 hover:text-slate-900"
          >
            Preview
          </button>
          <button
            type="submit"
            disabled={sending}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-soft hover:bg-accentDark disabled:opacity-60"
          >
            <PaperAirplaneIcon className="h-4 w-4" aria-hidden="true" /> Send broadcast
          </button>
        </div>

        {preview && (
          <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-6 text-sm text-slate-600">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Preview</h4>
            <pre className="mt-3 whitespace-pre-wrap font-mono text-xs text-slate-700">{preview}</pre>
          </div>
        )}
      </form>
    </section>
  );
}
