import { useState } from 'react';
import SectionShell from '../../SectionShell.jsx';

const PREFERENCE_FIELDS = [
  {
    key: 'shareAvailability',
    label: 'Share live availability',
    description: 'Expose available slots to pre-qualified clients and partners.',
  },
  {
    key: 'autoShareCard',
    label: 'Auto-share business card',
    description: 'Send your card to every accepted booking without manual steps.',
  },
  {
    key: 'allowMentorIntroductions',
    label: 'Mentor introductions',
    description: 'Allow Gigvora mentors to intro you to relevant hiring managers.',
  },
  {
    key: 'followUpReminders',
    label: 'Follow-up reminders',
    description: 'Receive reminders when contacts haven’t heard from you in 3 days.',
  },
  {
    key: 'autoAcceptInvites',
    label: 'Auto-accept trusted invites',
    description: 'Skip manual approval for workspaces you’ve pre-approved.',
  },
  {
    key: 'notifyOnOrders',
    label: 'Order notifications',
    description: 'Send Slack + email notifications when new networking orders close.',
  },
];

const CALENDAR_OPTIONS = [
  { value: 'google', label: 'Google Calendar sync' },
  { value: 'outlook', label: 'Outlook sync' },
  { value: 'apple', label: 'Apple Calendar export' },
  { value: 'manual', label: 'Manual updates' },
];

const DIGEST_OPTIONS = [
  { value: 'daily', label: 'Daily digest' },
  { value: 'weekly', label: 'Weekly summary' },
  { value: 'monthly', label: 'Monthly roll-up' },
  { value: 'off', label: 'Disable digest' },
];

export default function SystemPreferencesSection({ preferences, saving, onUpdate }) {
  const [feedback, setFeedback] = useState(null);
  const canUpdatePreferences = typeof onUpdate === 'function';

  const handleToggle = async (key, nextValue) => {
    if (!canUpdatePreferences) {
      setFeedback({ tone: 'error', message: 'You do not have permission to update these preferences.' });
      return;
    }
    if (preferences?.[key] === nextValue) {
      return;
    }
    try {
      setFeedback(null);
      await onUpdate({ ...preferences, [key]: nextValue });
      setFeedback({ tone: 'success', message: 'Preferences updated.' });
    } catch (error) {
      const message = error?.message ?? 'Unable to update preferences.';
      setFeedback({ tone: 'error', message });
    }
  };

  const renderFeedback = () => {
    if (!feedback) {
      return null;
    }
    const toneClasses = {
      success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      error: 'border-rose-200 bg-rose-50 text-rose-700',
      info: 'border-blue-200 bg-blue-50 text-blue-700',
    };
    return (
      <div
        className={`flex items-center justify-between gap-4 rounded-3xl border px-4 py-3 text-xs font-semibold ${
          toneClasses[feedback.tone] ?? 'border-blue-200 bg-blue-50 text-blue-700'
        }`}
        role="status"
        aria-live="polite"
      >
        <span>{feedback.message}</span>
        <button
          type="button"
          className="uppercase tracking-wide"
          onClick={() => setFeedback(null)}
        >
          Dismiss
        </button>
      </div>
    );
  };

  return (
    <SectionShell
      id="network-preferences"
      title="System preferences"
      description="Fine tune automation, calendar sync, and communication touch points for your networking workspace."
    >
      {renderFeedback()}

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-4">
          {PREFERENCE_FIELDS.map((field) => {
            const current = Boolean(preferences?.[field.key]);
            return (
              <label
                key={field.key}
                className="flex items-start gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200"
              >
                <input
                  type="checkbox"
                  checked={current}
                  disabled={saving}
                  onChange={(event) => handleToggle(field.key, event.target.checked)}
                  className="mt-1 h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-400"
                />
                <span>
                  <span className="text-sm font-semibold text-slate-900">{field.label}</span>
                  <span className="block text-xs text-slate-500">{field.description}</span>
                </span>
              </label>
            );
          })}
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">Calendar sync</h3>
            <p className="mt-2 text-xs text-slate-500">
              Choose how networking bookings sync into your personal calendar infrastructure.
            </p>
            <select
              value={preferences?.calendarSync ?? 'google'}
              disabled={saving}
              onChange={(event) => handleToggle('calendarSync', event.target.value)}
              className="mt-3 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
            >
              {CALENDAR_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">Digest frequency</h3>
            <p className="mt-2 text-xs text-slate-500">
              Control how often you receive inbox and order summaries from Gigvora.
            </p>
            <select
              value={preferences?.digestFrequency ?? 'weekly'}
              disabled={saving}
              onChange={(event) => handleToggle('digestFrequency', event.target.value)}
              className="mt-3 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
            >
              {DIGEST_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
