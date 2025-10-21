import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
  AdjustmentsHorizontalIcon,
  BellAlertIcon,
  ComputerDesktopIcon,
  CpuChipIcon,
  KeyIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';

const THEMES = ['Aurora', 'Solar', 'Midnight', 'Slate'];
const LANGUAGES = ['en-GB', 'en-US', 'fr-FR', 'de-DE'];

function normalisePreferences(preferences = {}) {
  return {
    ...preferences,
    notifications: { ...(preferences.notifications ?? {}) },
    aiAssistant: { ...(preferences.aiAssistant ?? {}) },
    security: { ...(preferences.security ?? {}) },
    api: { ...(preferences.api ?? {}) },
  };
}

export default function MentorSystemPreferencesSection({
  preferences,
  saving,
  onSavePreferences,
  onRotateApiKey,
}) {
  const [formState, setFormState] = useState(normalisePreferences(preferences ?? {}));
  const [feedback, setFeedback] = useState(null);
  const [rotating, setRotating] = useState(false);

  useEffect(() => {
    setFormState(normalisePreferences(preferences ?? {}));
  }, [preferences]);

  const handleNotificationToggle = (field) => {
    setFormState((current) => ({
      ...current,
      notifications: { ...current.notifications, [field]: !current.notifications?.[field] },
    }));
  };

  const handleAiToggle = (field) => {
    setFormState((current) => ({
      ...current,
      aiAssistant: { ...current.aiAssistant, [field]: !current.aiAssistant?.[field] },
    }));
  };

  const handleInputChange = (field, value) => {
    setFormState((current) => ({ ...current, [field]: value }));
  };

  const handleSecurityChange = (field, value) => {
    setFormState((current) => ({
      ...current,
      security: { ...current.security, [field]: value },
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFeedback(null);
    try {
      await onSavePreferences?.(formState);
      setFeedback({ type: 'success', message: 'Preferences updated successfully.' });
    } catch (error) {
      setFeedback({ type: 'error', message: error.message ?? 'Unable to update preferences.' });
    }
  };

  const handleRotateApiKey = async () => {
    setFeedback(null);
    setRotating(true);
    try {
      const response = await onRotateApiKey?.();
      if (response?.apiKey) {
        setFormState((current) => ({
          ...current,
          api: { ...(current.api ?? {}), keyPreview: response.apiKey, lastRotatedAt: new Date().toISOString() },
        }));
      }
      setFeedback({ type: 'success', message: 'New API key generated.' });
    } catch (error) {
      setFeedback({ type: 'error', message: error.message ?? 'Unable to rotate API key.' });
    } finally {
      setRotating(false);
    }
  };

  return (
    <section className="space-y-10 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <header className="flex flex-wrap items-start justify-between gap-6">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">System preferences</p>
          <h2 className="text-2xl font-semibold text-slate-900">Personalise your workspace & control security</h2>
          <p className="text-sm text-slate-600">
            Configure notifications, themes, AI assistance, and API access. Preferences sync across devices instantly.
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-600 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Theme</p>
          <p className="text-lg font-semibold text-slate-900">{formState.theme ?? 'Aurora'}</p>
          <p className="text-xs">Language: {formState.language ?? 'en-GB'}</p>
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
            <BellAlertIcon className="h-5 w-5 text-accent" />
            Notifications
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {Object.entries(formState.notifications ?? {}).map(([key, value]) => (
              <label key={key} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
                <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
                <input
                  type="checkbox"
                  checked={Boolean(value)}
                  onChange={() => handleNotificationToggle(key)}
                  className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
                />
              </label>
            ))}
          </div>
        </section>

        <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6">
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
            <ComputerDesktopIcon className="h-5 w-5 text-accent" />
            Appearance
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Theme
              <select
                value={formState.theme ?? THEMES[0]}
                onChange={(event) => handleInputChange('theme', event.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                {THEMES.map((theme) => (
                  <option key={theme}>{theme}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Language
              <select
                value={formState.language ?? LANGUAGES[0]}
                onChange={(event) => handleInputChange('language', event.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                {LANGUAGES.map((language) => (
                  <option key={language}>{language}</option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50/80 p-6">
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
            <ShieldCheckIcon className="h-5 w-5 text-accent" />
            Security
          </h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Session timeout (minutes)
              <input
                type="number"
                value={formState.security?.sessionTimeoutMinutes ?? ''}
                onChange={(event) => handleSecurityChange('sessionTimeoutMinutes', Number(event.target.value))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Approved devices
              <input
                type="number"
                value={formState.security?.deviceApprovals ?? ''}
                onChange={(event) => handleSecurityChange('deviceApprovals', Number(event.target.value))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
              <span>MFA enabled</span>
              <input
                type="checkbox"
                checked={Boolean(formState.security?.mfaEnabled)}
                onChange={() => handleSecurityChange('mfaEnabled', !formState.security?.mfaEnabled)}
                className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
              />
            </label>
          </div>
        </section>

        <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6">
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
            <CpuChipIcon className="h-5 w-5 text-accent" />
            AI assistant
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
              <span>Enable AI co-pilot</span>
              <input
                type="checkbox"
                checked={Boolean(formState.aiAssistant?.enabled)}
                onChange={() => handleAiToggle('enabled')}
                className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
              />
            </label>
            <label className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
              <span>Autopilot rituals</span>
              <input
                type="checkbox"
                checked={Boolean(formState.aiAssistant?.autopilot)}
                onChange={() => handleAiToggle('autopilot')}
                className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
              />
            </label>
          </div>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
            Tone
            <input
              type="text"
              value={formState.aiAssistant?.tone ?? ''}
              onChange={(event) => setFormState((current) => ({
                ...current,
                aiAssistant: { ...current.aiAssistant, tone: event.target.value },
              }))}
              placeholder="Warm & actionable"
              className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>
        </section>

        <section className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50/80 p-6">
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
            <KeyIcon className="h-5 w-5 text-accent" />
            API access
          </h3>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1 text-sm text-slate-600">
              <p className="font-semibold text-slate-800">Live key preview</p>
              <p className="font-mono text-xs text-slate-500">{formState.api?.keyPreview ?? 'sk_live_xxx'}</p>
              <p className="text-xs text-slate-500">
                Rotated {formState.api?.lastRotatedAt ? formatDistanceToNow(new Date(formState.api.lastRotatedAt), { addSuffix: true }) : 'recently'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleRotateApiKey}
              disabled={rotating}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-accentDark disabled:cursor-not-allowed disabled:opacity-70"
            >
              {rotating ? 'Rotating…' : 'Rotate key'}
            </button>
          </div>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-500">Preferences sync instantly across dashboards and devices.</p>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <AdjustmentsHorizontalIcon className="h-4 w-4" />
            Save preferences
          </button>
        </div>
      </form>
    </section>
  );
}

MentorSystemPreferencesSection.propTypes = {
  preferences: PropTypes.shape({
    notifications: PropTypes.object,
    theme: PropTypes.string,
    language: PropTypes.string,
    security: PropTypes.shape({
      sessionTimeoutMinutes: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      deviceApprovals: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      mfaEnabled: PropTypes.bool,
    }),
    aiAssistant: PropTypes.shape({
      enabled: PropTypes.bool,
      autopilot: PropTypes.bool,
      tone: PropTypes.string,
    }),
    api: PropTypes.shape({
      keyPreview: PropTypes.string,
      lastRotatedAt: PropTypes.string,
    }),
  }),
  saving: PropTypes.bool,
  onSavePreferences: PropTypes.func,
  onRotateApiKey: PropTypes.func,
};

MentorSystemPreferencesSection.defaultProps = {
  preferences: undefined,
  saving: false,
  onSavePreferences: undefined,
  onRotateApiKey: undefined,
};
