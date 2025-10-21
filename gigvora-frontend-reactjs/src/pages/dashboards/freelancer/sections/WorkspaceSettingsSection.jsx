import { useEffect, useMemo, useState } from 'react';
import {
  ArrowPathIcon,
  BellAlertIcon,
  ShieldCheckIcon,
  SwatchIcon,
} from '@heroicons/react/24/outline';
import SectionShell from '../SectionShell.jsx';
import useSession from '../../../../hooks/useSession.js';
import useWorkspaceExperienceSettings from '../../../../hooks/useWorkspaceExperienceSettings.js';

const THEME_OPTIONS = [
  { value: 'gigvora-light', label: 'Gigvora Light' },
  { value: 'midnight-ops', label: 'Midnight Ops' },
  { value: 'solar-burst', label: 'Solar Burst' },
];

const DIGEST_OPTIONS = [
  { value: 'daily', label: 'Daily summary' },
  { value: 'weekly', label: 'Weekly highlights' },
  { value: 'realtime', label: 'Real-time alerts' },
];

export default function WorkspaceSettingsSection() {
  const { session } = useSession();
  const workspaceId = session?.workspace?.id ?? session?.workspaceId ?? null;

  const {
    features,
    safety,
    personalization,
    updateSettings,
    toggleFeature,
    saving,
    updatingFeatureId,
    refresh,
    loading,
    error,
  } = useWorkspaceExperienceSettings({ workspaceId, enabled: Boolean(workspaceId) });

  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!toast || typeof window === 'undefined') {
      return undefined;
    }
    const timer = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const safetyControls = useMemo(
    () => [
      {
        key: 'requireTwoFactor',
        label: 'Require 2FA for all sign-ins',
        enabled: Boolean(safety?.requireTwoFactor),
      },
      {
        key: 'maskSensitiveData',
        label: 'Mask sensitive client data in shared views',
        enabled: Boolean(safety?.maskSensitiveData),
      },
      {
        key: 'auditLogsEnabled',
        label: 'Enable advanced audit logs',
        enabled: Boolean(safety?.auditLogsEnabled),
      },
    ],
    [safety],
  );

  const handleToggleFeature = (feature) => {
    toggleFeature(feature.id, !feature.enabled)
      .then((result) => {
        if (result?.fallback) {
          setToast({ tone: 'error', message: 'Workspace connection required to update features.' });
          return;
        }
        setToast({ tone: 'success', message: `${feature.label} updated.` });
      })
      .catch((err) => {
        console.error('Unable to toggle feature', err);
        setToast({ tone: 'error', message: err?.message ?? 'Unable to update feature toggle.' });
      });
  };

  const handleToggleSafety = (item) => {
    updateSettings({ [item.key]: !item.enabled })
      .then((result) => {
        if (result?.fallback) {
          setToast({ tone: 'error', message: 'Workspace connection required to update safety controls.' });
          return;
        }
        setToast({ tone: 'success', message: 'Safety settings updated.' });
      })
      .catch((err) => {
        console.error('Unable to update safety setting', err);
        setToast({ tone: 'error', message: err?.message ?? 'Unable to update safety setting.' });
      });
  };

  const handleSelectTheme = (event) => {
    updateSettings({ theme: event.target.value })
      .then((result) => {
        if (result?.fallback) {
          setToast({ tone: 'error', message: 'Workspace connection required to update theme.' });
          return;
        }
        setToast({ tone: 'success', message: 'Theme updated.' });
      })
      .catch((err) => {
        console.error('Unable to update theme', err);
        setToast({ tone: 'error', message: err?.message ?? 'Unable to update theme.' });
      });
  };

  const handleSelectDigest = (event) => {
    updateSettings({ notificationDigest: event.target.value })
      .then((result) => {
        if (result?.fallback) {
          setToast({ tone: 'error', message: 'Workspace connection required to update notifications.' });
          return;
        }
        setToast({ tone: 'success', message: 'Notification preferences updated.' });
      })
      .catch((err) => {
        console.error('Unable to update notification digest', err);
        setToast({ tone: 'error', message: err?.message ?? 'Unable to update notification digest.' });
      });
  };

  const actions = (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => refresh({ force: true })}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        Refresh settings
      </button>
    </div>
  );

  return (
    <SectionShell
      id="workspace-settings"
      title="Workspace settings"
      description="Control advanced systems, governance, and personalization preferences."
      actions={actions}
    >
      {!workspaceId ? (
        <div className="mb-4 rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-700">
          Connect a workspace profile to manage shared feature toggles and compliance controls.
        </div>
      ) : null}

      {error ? (
        <div className="mb-4 rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {error?.message ?? 'Unable to load workspace settings.'}
        </div>
      ) : null}

      {toast ? (
        <div
          className={`mb-4 rounded-3xl border px-5 py-3 text-sm ${
            toast.tone === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-rose-200 bg-rose-50 text-rose-700'
          }`}
        >
          {toast.message}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">Feature toggles</p>
              <p className="mt-1 text-sm text-slate-600">
                Enable modular capabilities tailored to the engagements you run.
              </p>
            </div>
            {saving ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
                <ArrowPathIcon className="h-4 w-4 animate-spin" /> Saving…
              </span>
            ) : null}
          </div>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            {features.map((feature) => (
              <li
                key={feature.id}
                className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">{feature.label}</p>
                  <p className="mt-1 text-xs text-slate-500">{feature.description}</p>
                </div>
                <label className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <span>{feature.enabled ? 'Enabled' : 'Disabled'}</span>
                  <input
                    type="checkbox"
                    checked={feature.enabled}
                    onChange={() => handleToggleFeature(feature)}
                    disabled={updatingFeatureId === feature.id}
                    className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-400"
                  />
                </label>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-900">Safety controls</p>
              <ShieldCheckIcon className="h-5 w-5 text-slate-400" />
            </div>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              {safetyControls.map((item) => (
                <li
                  key={item.key}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <span>{item.label}</span>
                  <input
                    type="checkbox"
                    checked={item.enabled}
                    onChange={() => handleToggleSafety(item)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-400"
                  />
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">Personalization</p>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <label className="block space-y-2">
                <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <SwatchIcon className="h-4 w-4" /> Theme
                </span>
                <select
                  value={personalization?.theme ?? 'gigvora-light'}
                  onChange={handleSelectTheme}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:border-blue-300 focus:outline-none"
                >
                  {THEME_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-2">
                <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <BellAlertIcon className="h-4 w-4" /> Notification digest
                </span>
                <select
                  value={personalization?.notificationDigest ?? 'daily'}
                  onChange={handleSelectDigest}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:border-blue-300 focus:outline-none"
                >
                  {DIGEST_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
