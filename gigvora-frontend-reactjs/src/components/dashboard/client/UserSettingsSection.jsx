import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  fetchNotificationPreferences,
  updateNotificationPreferences,
} from '../../../services/notificationCenter.js';
import { fetchUser, updateUserAccount } from '../../../services/user.js';
import {
  fetchUserAiSettings,
  updateUserAiSettings,
} from '../../../services/userAiSettings.js';
import AlertSettings from '../../notifications/AlertSettings.jsx';
import DataStatus from '../../DataStatus.jsx';

const CHANNEL_OPTIONS = [
  { value: 'direct', label: 'Direct messages' },
  { value: 'support', label: 'Support desk' },
  { value: 'project', label: 'Project rooms' },
  { value: 'contract', label: 'Contracts' },
  { value: 'group', label: 'Group spaces' },
];

const DEFAULT_ACCOUNT_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
  jobTitle: '',
  location: '',
  address: '',
};

const DEFAULT_AI_SETTINGS = {
  provider: 'openai',
  model: 'gpt-4o-mini',
  autoReplies: {
    enabled: false,
    instructions: '',
    channels: ['direct', 'support'],
    temperature: 0.35,
  },
  apiKey: { configured: false, fingerprint: null, updatedAt: null },
  connection: { baseUrl: 'https://api.openai.com/v1', lastTestedAt: null },
  workspaceId: null,
};

function normaliseAccountForm(account) {
  if (!account) {
    return { ...DEFAULT_ACCOUNT_FORM };
  }
  return {
    firstName: account.firstName ?? '',
    lastName: account.lastName ?? '',
    email: account.email ?? '',
    phoneNumber: account.phoneNumber ?? '',
    jobTitle: account.jobTitle ?? '',
    location: account.location ?? '',
    address: account.address ?? '',
  };
}

function normaliseAiSettings(value) {
  if (!value) {
    return { ...DEFAULT_AI_SETTINGS };
  }
  const base = { ...DEFAULT_AI_SETTINGS, ...value };
  const autoReplies = {
    ...DEFAULT_AI_SETTINGS.autoReplies,
    ...(value.autoReplies && typeof value.autoReplies === 'object' ? value.autoReplies : {}),
  };
  return {
    ...base,
    autoReplies: {
      ...autoReplies,
      channels: Array.isArray(autoReplies.channels)
        ? Array.from(new Set(autoReplies.channels.filter(Boolean)))
        : DEFAULT_AI_SETTINGS.autoReplies.channels,
      temperature:
        typeof autoReplies.temperature === 'number'
          ? Math.min(2, Math.max(0, Number(autoReplies.temperature)))
          : DEFAULT_AI_SETTINGS.autoReplies.temperature,
      instructions: autoReplies.instructions ?? '',
      enabled: Boolean(autoReplies.enabled),
    },
    model: base.model || DEFAULT_AI_SETTINGS.model,
    provider: base.provider || 'openai',
    apiKey: {
      configured: Boolean(value.apiKey?.configured),
      fingerprint: value.apiKey?.fingerprint ?? null,
      updatedAt: value.apiKey?.updatedAt ?? null,
    },
    connection: {
      baseUrl: value.connection?.baseUrl || DEFAULT_AI_SETTINGS.connection.baseUrl,
      lastTestedAt: value.connection?.lastTestedAt ?? null,
    },
    workspaceId: value.workspaceId ?? null,
  };
}

function AccountForm({ form, onChange, onSubmit, busy, feedback, error }) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-slate-700">First name</span>
          <input
            type="text"
            name="firstName"
            value={form.firstName}
            onChange={onChange}
            className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            required
          />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-slate-700">Last name</span>
          <input
            type="text"
            name="lastName"
            value={form.lastName}
            onChange={onChange}
            className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            required
          />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-slate-700">Email</span>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={onChange}
            className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            required
          />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-slate-700">Phone</span>
          <input
            type="tel"
            name="phoneNumber"
            value={form.phoneNumber}
            onChange={onChange}
            placeholder="+44 20 7946 0958"
            className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-slate-700">Job title</span>
          <input
            type="text"
            name="jobTitle"
            value={form.jobTitle}
            onChange={onChange}
            placeholder="Product operations lead"
            className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-slate-700">Location</span>
          <input
            type="text"
            name="location"
            value={form.location}
            onChange={onChange}
            placeholder="London, UK"
            className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </label>
      </div>
      <label className="flex flex-col gap-2 text-sm">
        <span className="font-medium text-slate-700">Address</span>
        <textarea
          name="address"
          value={form.address}
          onChange={onChange}
          rows={3}
          placeholder="Workspace mailing address for invoices and compliance."
          className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </label>
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      ) : null}
      {feedback ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {feedback}
        </div>
      ) : null}
      <div className="flex justify-end">
        <button
          type="submit"
          className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-300"
          disabled={busy}
        >
          {busy ? 'Saving…' : 'Save account settings'}
        </button>
      </div>
    </form>
  );
}

AccountForm.propTypes = {
  form: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  busy: PropTypes.bool,
  feedback: PropTypes.string,
  error: PropTypes.string,
};

AccountForm.defaultProps = {
  busy: false,
  feedback: null,
  error: null,
};

function AiSettingsForm({ value, busy, error, onSubmit, onResetError }) {
  const [form, setForm] = useState(() => normaliseAiSettings(value));
  const [apiKeyMode, setApiKeyMode] = useState('hidden');

  useEffect(() => {
    setForm(normaliseAiSettings(value));
  }, [value]);

  const toggleChannel = useCallback((channel) => {
    setForm((previous) => {
      const channels = new Set(previous.autoReplies.channels);
      if (channels.has(channel)) {
        channels.delete(channel);
      } else {
        channels.add(channel);
      }
      return {
        ...previous,
        autoReplies: { ...previous.autoReplies, channels: Array.from(channels) },
      };
    });
    onResetError?.();
  }, [onResetError]);

  const handleChange = useCallback((event) => {
    const { name, value: rawValue, type, checked } = event.target;
    setForm((previous) => {
      if (name.startsWith('autoReplies.')) {
        const field = name.split('.')[1];
        let value = rawValue;
        if (field === 'enabled') {
          value = type === 'checkbox' ? checked : rawValue === 'true';
        } else if (field === 'temperature') {
          value = Number(rawValue);
        }
        return {
          ...previous,
          autoReplies: { ...previous.autoReplies, [field]: value },
        };
      }
      if (name === 'workspaceId') {
        return { ...previous, workspaceId: rawValue ? Number(rawValue) || rawValue : null };
      }
      if (name === 'apiKey') {
        return { ...previous, apiKey: { ...previous.apiKey, pending: rawValue } };
      }
      if (name === 'baseUrl') {
        return { ...previous, connection: { ...previous.connection, baseUrl: rawValue } };
      }
      return { ...previous, [name]: rawValue };
    });
    onResetError?.();
  }, [onResetError]);

  const handleSubmit = useCallback((event) => {
    event.preventDefault();
    const payload = {
      provider: form.provider || 'openai',
      model: form.model,
      autoReplies: {
        enabled: Boolean(form.autoReplies.enabled),
        instructions: form.autoReplies.instructions ?? '',
        temperature: Number.isFinite(Number(form.autoReplies.temperature))
          ? Number(form.autoReplies.temperature)
          : DEFAULT_AI_SETTINGS.autoReplies.temperature,
        channels: form.autoReplies.channels.length
          ? form.autoReplies.channels
          : DEFAULT_AI_SETTINGS.autoReplies.channels,
      },
      connection: { baseUrl: form.connection?.baseUrl || DEFAULT_AI_SETTINGS.connection.baseUrl },
      workspaceId:
        form.workspaceId == null || form.workspaceId === '' ? null : Number(form.workspaceId) || form.workspaceId,
    };
    if (form.apiKey?.pending !== undefined) {
      payload.apiKey = form.apiKey.pending;
    }
    onSubmit(payload).then(() => {
      setApiKeyMode('hidden');
    });
  }, [form, onSubmit]);

  const fingerprint = value?.apiKey?.fingerprint;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-slate-700">Model</span>
          <input
            type="text"
            name="model"
            value={form.model}
            onChange={handleChange}
            className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-slate-700">API base URL</span>
          <input
            type="url"
            name="baseUrl"
            value={form.connection?.baseUrl ?? ''}
            onChange={handleChange}
            className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </label>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">Auto replies</p>
          <label className="mt-4 flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-medium text-slate-700">
            <span>Enabled</span>
            <input
              type="checkbox"
              name="autoReplies.enabled"
              checked={Boolean(form.autoReplies.enabled)}
              onChange={handleChange}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
          </label>
          <div className="mt-4 space-y-3">
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Guidance</span>
              <textarea
                name="autoReplies.instructions"
                value={form.autoReplies.instructions}
                onChange={handleChange}
                rows={4}
                placeholder="Tone, escalation triggers, and brand guardrails."
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Creativity</span>
              <input
                type="range"
                min="0"
                max="2"
                step="0.05"
                name="autoReplies.temperature"
                value={form.autoReplies.temperature}
                onChange={handleChange}
                className="accent-indigo-600"
              />
              <span className="text-xs text-slate-500">
                {Number(form.autoReplies.temperature).toFixed(2)} temperature — lower keeps replies precise; higher adds flair.
              </span>
            </label>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">Active channels</p>
          <div className="mt-4 grid gap-3">
            {CHANNEL_OPTIONS.map((option) => {
              const checked = form.autoReplies.channels.includes(option.value);
              return (
                <label
                  key={option.value}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-medium text-slate-700"
                >
                  <span>{option.label}</span>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleChannel(option.value)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </label>
              );
            })}
          </div>
          <label className="mt-4 flex flex-col gap-2 text-sm">
            <span className="font-medium text-slate-700">Workspace routing (optional)</span>
            <input
              type="text"
              name="workspaceId"
              value={form.workspaceId ?? ''}
              onChange={handleChange}
              placeholder="Workspace ID for auto-replies"
              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </label>
        </div>
      </div>
      <div className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">API key</p>
            {fingerprint ? (
              <p className="text-xs text-slate-500">Fingerprint {fingerprint}</p>
            ) : (
              <p className="text-xs text-slate-500">No key configured — replies will remain in manual mode.</p>
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setApiKeyMode('update');
                setForm((previous) => ({ ...previous, apiKey: { ...previous.apiKey, pending: '' } }));
              }}
              className="rounded-2xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-indigo-300 hover:text-indigo-600"
            >
              {fingerprint ? 'Rotate key' : 'Add key'}
            </button>
            {fingerprint ? (
              <button
                type="button"
                onClick={() => {
                  setApiKeyMode('clear');
                  setForm((previous) => ({ ...previous, apiKey: { ...previous.apiKey, pending: '' } }));
                }}
                className="rounded-2xl border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700"
              >
                Remove
              </button>
            ) : null}
          </div>
        </div>
        {apiKeyMode !== 'hidden' ? (
          <label className="mt-4 flex flex-col gap-2 text-sm">
            <span className="font-medium text-slate-700">
              {apiKeyMode === 'clear' ? 'Confirm removal' : 'API key'}
            </span>
            <input
              type="password"
              name="apiKey"
              value={form.apiKey?.pending ?? ''}
              onChange={handleChange}
              placeholder={apiKeyMode === 'clear' ? 'Type REMOVE to confirm' : 'Paste the secret key'}
              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </label>
        ) : null}
      </div>
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      ) : null}
      <div className="flex justify-end">
        <button
          type="submit"
          className="rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-300"
          disabled={busy}
        >
          {busy ? 'Saving…' : 'Save AI workspace settings'}
        </button>
      </div>
    </form>
  );
}

AiSettingsForm.propTypes = {
  value: PropTypes.object,
  busy: PropTypes.bool,
  error: PropTypes.string,
  onSubmit: PropTypes.func.isRequired,
  onResetError: PropTypes.func,
};

AiSettingsForm.defaultProps = {
  value: null,
  busy: false,
  error: null,
  onResetError: null,
};

export default function UserSettingsSection({
  userId,
  session,
  initialNotificationPreferences,
  initialAiSettings,
  weeklyDigest,
}) {
  const [accountForm, setAccountForm] = useState(DEFAULT_ACCOUNT_FORM);
  const [accountBusy, setAccountBusy] = useState(false);
  const [accountFeedback, setAccountFeedback] = useState('');
  const [accountError, setAccountError] = useState('');
  const [accountLoaded, setAccountLoaded] = useState(false);

  const [notificationPrefs, setNotificationPrefs] = useState(initialNotificationPreferences);
  const [notificationBusy, setNotificationBusy] = useState(false);
  const [notificationError, setNotificationError] = useState(null);

  const [aiSettings, setAiSettings] = useState(initialAiSettings ?? DEFAULT_AI_SETTINGS);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadedAt, setLoadedAt] = useState(null);

  const fullName = useMemo(() => {
    if (session?.user?.fullName) {
      return session.user.fullName;
    }
    const first = accountForm.firstName || session?.user?.firstName || '';
    const last = accountForm.lastName || session?.user?.lastName || '';
    return [first, last].filter(Boolean).join(' ');
  }, [accountForm.firstName, accountForm.lastName, session?.user?.firstName, session?.user?.fullName, session?.user?.lastName]);

  const loadInitialData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const [accountResponse, preferencesResponse, aiResponse] = await Promise.all([
        fetchUser(userId).catch(() => null),
        fetchNotificationPreferences(userId).catch(() => initialNotificationPreferences ?? null),
        fetchUserAiSettings(userId).catch(() => initialAiSettings ?? null),
      ]);
      if (accountResponse) {
        setAccountForm(normaliseAccountForm(accountResponse));
        setAccountLoaded(true);
      }
      if (preferencesResponse) {
        setNotificationPrefs(preferencesResponse);
      }
      if (aiResponse) {
        setAiSettings(normaliseAiSettings(aiResponse));
      }
      setLoadedAt(new Date());
    } catch (err) {
      setError(err?.message ?? 'Unable to load settings.');
    } finally {
      setLoading(false);
    }
  }, [userId, initialNotificationPreferences, initialAiSettings]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const handleAccountChange = useCallback((event) => {
    const { name, value } = event.target;
    setAccountForm((previous) => ({ ...previous, [name]: value }));
  }, []);

  const handleAccountSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      if (!userId) return;
      setAccountBusy(true);
      setAccountError('');
      setAccountFeedback('');
      try {
        await updateUserAccount(userId, accountForm);
        setAccountFeedback('Account settings saved.');
        setLoadedAt(new Date());
      } catch (err) {
        setAccountError(err?.message ?? 'Unable to update account settings.');
      } finally {
        setAccountBusy(false);
      }
    },
    [userId, accountForm],
  );

  const handleNotificationSubmit = useCallback(
    async (payload) => {
      if (!userId) {
        return false;
      }
      setNotificationBusy(true);
      setNotificationError(null);
      try {
        const response = await updateNotificationPreferences(userId, payload);
        setNotificationPrefs(response);
        setLoadedAt(new Date());
        return true;
      } catch (err) {
        setNotificationError(err);
        return false;
      } finally {
        setNotificationBusy(false);
      }
    },
    [userId],
  );

  const handleAiSubmit = useCallback(
    async (payload) => {
      if (!userId) return;
      setAiBusy(true);
      setAiError(null);
      try {
        const response = await updateUserAiSettings(userId, payload);
        setAiSettings(normaliseAiSettings(response));
        setLoadedAt(new Date());
      } catch (err) {
        setAiError(err?.message ?? 'Unable to update AI settings.');
        throw err;
      } finally {
        setAiBusy(false);
      }
    },
    [userId],
  );

  const digestSummary = useMemo(() => {
    if (!weeklyDigest) {
      return null;
    }
    const subscription = weeklyDigest.subscription ?? null;
    const integrations = weeklyDigest.integrations ?? [];
    return {
      cadence: subscription?.frequency ?? 'not scheduled',
      channels: Array.isArray(subscription?.channels) && subscription.channels.length
        ? subscription.channels.join(', ')
        : 'Email',
      nextSend: subscription?.nextScheduledAt ?? null,
      integrationsCount: integrations.length,
    };
  }, [weeklyDigest]);

  return (
    <section
      id="user-settings"
      className="space-y-8 rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-white p-6 shadow-sm"
    >
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Settings</p>
          <h2 className="text-3xl font-semibold text-slate-900">Personal and automation controls</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-500">
            Keep account, notification, and AI concierge preferences aligned with your operating rhythm. Every change updates the
            production workspace instantly.
          </p>
        </div>
        <DataStatus
          loading={loading}
          error={error}
          lastUpdated={loadedAt}
          statusLabel="Settings sync"
          onRefresh={loadInitialData}
        />
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Account profile</h3>
              <p className="mt-1 text-sm text-slate-500">These details appear on invoices, invites, and compliance notices.</p>
            </div>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-600">
              {fullName || 'Account'}
            </span>
          </div>
          <div className="mt-6">
            <AccountForm
              form={accountForm}
              onChange={handleAccountChange}
              onSubmit={handleAccountSubmit}
              busy={accountBusy}
              feedback={accountFeedback}
              error={accountError}
            />
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Notification preferences</h3>
              <p className="mt-1 text-sm text-slate-500">
                Choose delivery channels and quiet hours. Alerts stay aligned with your calendar and compliance policies.
              </p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-600">
              Signal hygiene
            </span>
          </div>
          <div className="mt-6 space-y-6">
            <AlertSettings
              preferences={notificationPrefs}
              busy={notificationBusy}
              error={notificationError}
              onSubmit={handleNotificationSubmit}
              onResetError={() => setNotificationError(null)}
            />
            {digestSummary ? (
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3 text-sm text-slate-600">
                <p className="font-semibold text-slate-800">Weekly digest</p>
                <p className="mt-1">Cadence: {digestSummary.cadence}</p>
                <p className="mt-1">Channels: {digestSummary.channels}</p>
                <p className="mt-1">
                  {digestSummary.nextSend ? `Next send ${new Date(digestSummary.nextSend).toLocaleString()}` : 'Scheduling on demand.'}
                </p>
                <p className="mt-1">Calendar integrations: {digestSummary.integrationsCount}</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
        <div className="flex flex-col gap-2">
          <h3 className="text-lg font-semibold text-slate-900">AI concierge</h3>
          <p className="text-sm text-slate-500">
            Configure how the Gigvora co-pilot drafts responses across conversations. Keys are stored encrypted and requests stay
            inside your workspace boundary.
          </p>
        </div>
        <div className="mt-6">
          <AiSettingsForm
            value={aiSettings}
            busy={aiBusy}
            error={aiError}
            onSubmit={handleAiSubmit}
            onResetError={() => setAiError(null)}
          />
        </div>
      </div>

      {accountLoaded ? null : (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          We could not load some account fields from the profile service. Updates made here will still be saved to the primary
          account record.
        </div>
      )}
    </section>
  );
}

UserSettingsSection.propTypes = {
  userId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  session: PropTypes.object,
  initialNotificationPreferences: PropTypes.object,
  initialAiSettings: PropTypes.object,
  weeklyDigest: PropTypes.object,
};

UserSettingsSection.defaultProps = {
  session: null,
  initialNotificationPreferences: null,
  initialAiSettings: null,
  weeklyDigest: null,
};
