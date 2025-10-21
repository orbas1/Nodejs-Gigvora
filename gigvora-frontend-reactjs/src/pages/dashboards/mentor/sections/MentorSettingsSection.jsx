import { useState } from 'react';
import PropTypes from 'prop-types';
import {
  BoltIcon,
  CloudArrowUpIcon,
  GlobeAltIcon,
  PaperClipIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

const DEFAULT_ATTACHMENT = {
  label: '',
  url: '',
  type: 'PDF',
};

export default function MentorSettingsSection({ settings, saving, onSaveSettings }) {
  const [formState, setFormState] = useState(settings ?? {});
  const [attachmentForm, setAttachmentForm] = useState(DEFAULT_ATTACHMENT);
  const [feedback, setFeedback] = useState(null);

  const handleToggle = (field) => {
    setFormState((current) => ({ ...current, [field]: !current?.[field] }));
  };

  const handleAttachmentAdd = () => {
    if (!attachmentForm.label || !attachmentForm.url) {
      setFeedback({ type: 'error', message: 'Attachment label and URL are required.' });
      return;
    }
    setFormState((current) => ({
      ...current,
      attachments: [...(current.attachments ?? []), { ...attachmentForm, id: `${Date.now()}` }],
    }));
    setAttachmentForm(DEFAULT_ATTACHMENT);
  };

  const handleAttachmentRemove = (attachmentId) => {
    setFormState((current) => ({
      ...current,
      attachments: (current.attachments ?? []).filter((attachment) => attachment.id !== attachmentId),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFeedback(null);
    try {
      await onSaveSettings?.(formState);
      setFeedback({ type: 'success', message: 'Settings saved successfully.' });
    } catch (error) {
      setFeedback({ type: 'error', message: error.message ?? 'Unable to save settings.' });
    }
  };

  return (
    <section className="space-y-10 rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-sm">
      <header className="flex flex-wrap items-start justify-between gap-6">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Settings</p>
          <h2 className="text-2xl font-semibold text-slate-900">Tune the mentor experience and automations</h2>
          <p className="text-sm text-slate-600">
            Manage contact details, booking windows, and the onboarding kit your mentees receive. All updates sync with Explorer listings and automation flows instantly.
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-600 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Automation summary</p>
          <p className="text-lg font-semibold text-slate-900">
            {settings?.autoAcceptReturning ? 'Returning mentees auto-accepted' : 'Manual review for returning mentees'}
          </p>
          <p className="text-xs">
            Double opt-in introductions {settings?.doubleOptInIntroductions ? 'enabled' : 'disabled'}
          </p>
        </div>
      </header>

      {feedback ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            feedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-rose-200 bg-rose-50 text-rose-700'
          }`}
        >
          {feedback.message}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-8">
        <section className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50/80 p-6">
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
            <GlobeAltIcon className="h-5 w-5 text-accent" />
            Contact & presence
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Contact email
              <input
                type="email"
                value={formState.contactEmail ?? ''}
                onChange={(event) => setFormState((current) => ({ ...current, contactEmail: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Support email
              <input
                type="email"
                value={formState.supportEmail ?? ''}
                onChange={(event) => setFormState((current) => ({ ...current, supportEmail: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Website / landing page
              <input
                type="url"
                value={formState.website ?? ''}
                onChange={(event) => setFormState((current) => ({ ...current, website: event.target.value }))}
                placeholder="https://"
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Timezone
              <input
                type="text"
                value={formState.timezone ?? ''}
                onChange={(event) => setFormState((current) => ({ ...current, timezone: event.target.value }))}
                placeholder="Europe/London"
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
          </div>
        </section>

        <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6">
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
            <BoltIcon className="h-5 w-5 text-accent" />
            Automation rules
          </h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Availability lead time (hours)
              <input
                type="number"
                value={formState.availabilityLeadTimeHours ?? ''}
                onChange={(event) => setFormState((current) => ({ ...current, availabilityLeadTimeHours: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Booking window (days)
              <input
                type="number"
                value={formState.bookingWindowDays ?? ''}
                onChange={(event) => setFormState((current) => ({ ...current, bookingWindowDays: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-600">
              <label className="flex items-center justify-between gap-3">
                <span>Auto accept returning mentees</span>
                <input
                  type="checkbox"
                  checked={Boolean(formState.autoAcceptReturning)}
                  onChange={() => handleToggle('autoAcceptReturning')}
                  className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
                />
              </label>
              <label className="flex items-center justify-between gap-3">
                <span>Double opt-in introductions</span>
                <input
                  type="checkbox"
                  checked={Boolean(formState.doubleOptInIntroductions)}
                  onChange={() => handleToggle('doubleOptInIntroductions')}
                  className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
                />
              </label>
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50/80 p-6">
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
            <CloudArrowUpIcon className="h-5 w-5 text-accent" />
            Onboarding kit & media
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Calendly link
              <input
                type="url"
                value={formState.calendlyLink ?? ''}
                onChange={(event) => setFormState((current) => ({ ...current, calendlyLink: event.target.value }))}
                placeholder="https://calendly.com/..."
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Zoom room
              <input
                type="url"
                value={formState.zoomRoom ?? ''}
                onChange={(event) => setFormState((current) => ({ ...current, zoomRoom: event.target.value }))}
                placeholder="https://zoom.us/j/..."
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Welcome video URL
              <input
                type="url"
                value={formState.videoGreeting ?? ''}
                onChange={(event) => setFormState((current) => ({ ...current, videoGreeting: event.target.value }))}
                placeholder="https://www.youtube.com/embed/..."
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Email signature
              <textarea
                rows={3}
                value={formState.signature ?? ''}
                onChange={(event) => setFormState((current) => ({ ...current, signature: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-700">Attachments</p>
              <button
                type="button"
                onClick={handleAttachmentAdd}
                className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-1.5 text-xs font-semibold text-white shadow-sm"
              >
                <PaperClipIcon className="h-3.5 w-3.5" />
                Add attachment
              </button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Label
                <input
                  type="text"
                  value={attachmentForm.label}
                  onChange={(event) => setAttachmentForm((current) => ({ ...current, label: event.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </label>
              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                URL
                <input
                  type="url"
                  value={attachmentForm.url}
                  onChange={(event) => setAttachmentForm((current) => ({ ...current, url: event.target.value }))}
                  placeholder="https://"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </label>
              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Type
                <input
                  type="text"
                  value={attachmentForm.type}
                  onChange={(event) => setAttachmentForm((current) => ({ ...current, type: event.target.value }))}
                  placeholder="PDF, Notion, Loom"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </label>
            </div>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              {(formState.attachments ?? []).length === 0 ? (
                <li className="rounded-2xl border border-dashed border-slate-200 px-4 py-5 text-xs text-slate-500">
                  No attachments yet. Upload welcome packs, frameworks, or rituals.
                </li>
              ) : (
                (formState.attachments ?? []).map((attachment) => (
                  <li key={attachment.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
                    <div>
                      <p className="font-semibold text-slate-800">{attachment.label}</p>
                      <p className="text-xs text-slate-500">{attachment.type}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAttachmentRemove(attachment.id)}
                      className="text-xs font-semibold text-rose-500 hover:text-rose-600"
                    >
                      Remove
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </section>

        <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6">
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
            <ShieldCheckIcon className="h-5 w-5 text-accent" />
            Integrations
          </h3>
          <p className="text-sm text-slate-600">
            Integrations keep your mentor desk connected across Slack, Notion, billing, and beyond.
          </p>
          <ul className="space-y-3">
            {(formState.integrations ?? []).map((integration) => (
              <li key={integration.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
                <div>
                  <p className="font-semibold text-slate-800">{integration.name}</p>
                  <p className="text-xs text-slate-500">{integration.description}</p>
                </div>
                <span className="text-xs font-semibold text-emerald-600">{integration.status}</span>
              </li>
            ))}
          </ul>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-500">Changes sync with Explorer listings, onboarding sequences, and nurture journeys.</p>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accentDark disabled:cursor-not-allowed disabled:opacity-70"
          >
            Save settings
          </button>
        </div>
      </form>
    </section>
  );
}

MentorSettingsSection.propTypes = {
  settings: PropTypes.shape({
    contactEmail: PropTypes.string,
    supportEmail: PropTypes.string,
    timezone: PropTypes.string,
    website: PropTypes.string,
    calendlyLink: PropTypes.string,
    zoomRoom: PropTypes.string,
    videoGreeting: PropTypes.string,
    signature: PropTypes.string,
    availabilityLeadTimeHours: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    bookingWindowDays: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    autoAcceptReturning: PropTypes.bool,
    doubleOptInIntroductions: PropTypes.bool,
    attachments: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        label: PropTypes.string,
        url: PropTypes.string,
        type: PropTypes.string,
      }),
    ),
    integrations: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        name: PropTypes.string,
        status: PropTypes.string,
        description: PropTypes.string,
      }),
    ),
  }),
  saving: PropTypes.bool,
  onSaveSettings: PropTypes.func,
};

MentorSettingsSection.defaultProps = {
  settings: undefined,
  saving: false,
  onSaveSettings: undefined,
};
