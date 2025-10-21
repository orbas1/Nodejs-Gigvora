import { useCallback, useEffect, useState } from 'react';
import { Switch } from '@headlessui/react';
import { ArrowPathIcon, CloudIcon, ShieldCheckIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline';
import { fetchSystemSettings, updateSystemSettings } from '../../../services/systemSettings.js';

function classNames(...values) {
  return values.filter(Boolean).join(' ');
}

export default function AdminSettingsSection() {
  const [settings, setSettings] = useState(null);
  const [draft, setDraft] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!feedback && !error) return undefined;
    const timeout = setTimeout(() => {
      setFeedback('');
      setError('');
    }, 4000);
    return () => clearTimeout(timeout);
  }, [feedback, error]);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchSystemSettings();
      setSettings(response);
      setDraft({
        supportEmail: response?.general?.supportEmail ?? '',
        supportPhone: response?.general?.supportPhone ?? '',
        timezone: response?.general?.timezone ?? 'UTC',
        defaultLocale: response?.general?.defaultLocale ?? 'en-US',
        requireTwoFactor: response?.security?.requireTwoFactor ?? true,
        sessionTimeoutMinutes: response?.security?.sessionTimeoutMinutes ?? 60,
        incidentWebhookUrl: response?.notifications?.incidentWebhookUrl ?? '',
        maintenanceAutoBroadcast: response?.maintenance?.autoBroadcast ?? true,
        maintenanceChannel: response?.maintenance?.supportChannel ?? '',
      });
      setError('');
    } catch (loadError) {
      if (loadError?.status === 403) {
        setError('You do not have permission to view system controls. Ask a platform administrator to grant platform:admin access.');
      } else if (loadError instanceof Error) {
        setError(loadError.message);
      } else {
        setError('Unable to load system settings.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleChange = (field) => (event) => {
    const value = event?.target?.type === 'checkbox' ? event.target.checked : event.target.value;
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const handleToggle = (field) => (value) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        general: {
          ...settings?.general,
          supportEmail: draft.supportEmail,
          supportPhone: draft.supportPhone,
          timezone: draft.timezone,
          defaultLocale: draft.defaultLocale,
        },
        security: {
          ...settings?.security,
          requireTwoFactor: draft.requireTwoFactor,
          sessionTimeoutMinutes: Number(draft.sessionTimeoutMinutes) || 60,
        },
        notifications: {
          ...settings?.notifications,
          incidentWebhookUrl: draft.incidentWebhookUrl,
        },
        maintenance: {
          ...settings?.maintenance,
          autoBroadcast: draft.maintenanceAutoBroadcast,
          supportChannel: draft.maintenanceChannel,
        },
      };
      const response = await updateSystemSettings(payload);
      setSettings(response);
      setFeedback('System controls updated successfully.');
    } catch (saveError) {
      if (saveError?.status === 403) {
        setError('You do not have permission to update system controls. Ask a platform administrator to grant platform:admin access.');
      } else if (saveError instanceof Error) {
        setError(saveError.message);
      } else {
        setError('Unable to save settings.');
      }
    } finally {
      setSaving(false);
    }
  };

  const maintenanceCountdown = settings?.maintenance?.upcomingWindows?.[0]?.scheduledAt
    ? new Date(settings.maintenance.upcomingWindows[0].scheduledAt)
    : null;

  const maintenanceLabel = maintenanceCountdown
    ? maintenanceCountdown.toLocaleString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'No maintenance scheduled';

  return (
    <section id="admin-settings" className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">Settings</p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-900">Platform controls</h2>
          <p className="mt-3 max-w-2xl text-sm text-slate-500">
            Operate Gigvora with confidence: update support touchpoints, enforce security, and coordinate maintenance messaging
            from a single panel.
          </p>
        </div>
        <button
          type="button"
          onClick={loadSettings}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 shadow-sm transition hover:border-slate-300"
        >
          <ArrowPathIcon className="h-4 w-4" aria-hidden="true" /> Refresh
        </button>
      </div>

      {feedback ? (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 shadow-sm">
          {feedback}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm">{error}</div>
      ) : null}

      <form
        onSubmit={handleSave}
        className="space-y-8 rounded-[32px] border border-slate-200 bg-white p-8 shadow-lg shadow-blue-100/20"
      >
        <fieldset className="grid gap-6 lg:grid-cols-2">
          <legend className="col-span-full flex items-center gap-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            <CloudIcon className="h-5 w-5" aria-hidden="true" /> Support & identity
          </legend>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Support email
            <input
              required
              type="email"
              value={draft.supportEmail ?? ''}
              onChange={handleChange('supportEmail')}
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              disabled={loading}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Support phone
            <input
              value={draft.supportPhone ?? ''}
              onChange={handleChange('supportPhone')}
              placeholder="+1 888 000 0000"
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              disabled={loading}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Default timezone
            <input
              value={draft.timezone ?? 'UTC'}
              onChange={handleChange('timezone')}
              placeholder="UTC"
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              disabled={loading}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Default locale
            <input
              value={draft.defaultLocale ?? 'en-US'}
              onChange={handleChange('defaultLocale')}
              placeholder="en-US"
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              disabled={loading}
            />
          </label>
        </fieldset>

        <fieldset className="space-y-4 rounded-[24px] border border-slate-200 bg-slate-50/60 p-6">
          <legend className="flex items-center gap-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            <ShieldCheckIcon className="h-5 w-5" aria-hidden="true" /> Security
          </legend>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-900">Require two-factor authentication</p>
              <p className="text-xs text-slate-500">
                Enforce OTP or hardware tokens for all administrators and organisations.
              </p>
            </div>
            <Switch
              checked={draft.requireTwoFactor ?? true}
              onChange={handleToggle('requireTwoFactor')}
              disabled={loading}
              aria-label="Require two-factor authentication"
              className={classNames(
                draft.requireTwoFactor ? 'bg-emerald-500' : 'bg-slate-200',
                'relative inline-flex h-7 w-14 items-center rounded-full transition'
              )}
            >
              <span
                className={classNames(
                  draft.requireTwoFactor ? 'translate-x-8' : 'translate-x-1',
                  'inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition'
                )}
              />
            </Switch>
          </div>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Session timeout (minutes)
            <input
              type="number"
              min="15"
              value={draft.sessionTimeoutMinutes ?? 60}
              onChange={handleChange('sessionTimeoutMinutes')}
              className="w-32 rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              disabled={loading}
            />
          </label>
        </fieldset>

        <fieldset className="grid gap-6 lg:grid-cols-2">
          <legend className="col-span-full flex items-center gap-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            <WrenchScrewdriverIcon className="h-5 w-5" aria-hidden="true" /> Maintenance & incidents
          </legend>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Incident webhook URL
            <input
              value={draft.incidentWebhookUrl ?? ''}
              onChange={handleChange('incidentWebhookUrl')}
              placeholder="https://hooks.slack.com/services/..."
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              disabled={loading}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Support channel
            <input
              value={draft.maintenanceChannel ?? ''}
              onChange={handleChange('maintenanceChannel')}
              placeholder="#gigvora-support"
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              disabled={loading}
            />
          </label>
          <div className="col-span-full flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-slate-900">Auto broadcast maintenance</p>
              <p className="text-xs text-slate-500">Automatically publish status updates to the status page and support channel.</p>
            </div>
            <Switch
              checked={draft.maintenanceAutoBroadcast ?? true}
              onChange={handleToggle('maintenanceAutoBroadcast')}
              disabled={loading}
              aria-label="Automatically broadcast maintenance updates"
              className={classNames(
                draft.maintenanceAutoBroadcast ? 'bg-blue-600' : 'bg-slate-200',
                'relative inline-flex h-7 w-14 items-center rounded-full transition'
              )}
            >
              <span
                className={classNames(
                  draft.maintenanceAutoBroadcast ? 'translate-x-8' : 'translate-x-1',
                  'inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition'
                )}
              />
            </Switch>
          </div>
          <div className="col-span-full rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Next maintenance window: {maintenanceLabel}
          </div>
        </fieldset>

        <div className="flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={saving || loading}
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save settings'}
          </button>
        </div>
      </form>
    </section>
  );
}
