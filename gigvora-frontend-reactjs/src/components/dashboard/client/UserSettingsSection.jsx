import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import DataStatus from '../../DataStatus.jsx';
import {
  fetchNotificationPreferences,
  updateNotificationPreferences,
} from '../../../services/notificationCenter.js';
import { fetchUser, updateUserAccount } from '../../../services/user.js';
import { fetchUserAiSettings, updateUserAiSettings } from '../../../services/userAiSettings.js';

const DIGEST_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'never', label: 'Never' },
];

const CHANNEL_OPTIONS = [
  { value: 'direct', label: 'Direct messages' },
  { value: 'support', label: 'Support desk' },
  { value: 'project', label: 'Project rooms' },
  { value: 'contract', label: 'Contracts' },
  { value: 'group', label: 'Community groups' },
];

const DEFAULT_ACCOUNT = {
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
  jobTitle: '',
  location: '',
};

const DEFAULT_NOTIFICATIONS = {
  emailEnabled: true,
  pushEnabled: true,
  smsEnabled: false,
  inAppEnabled: true,
  digestFrequency: 'weekly',
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
};

const DEFAULT_AI = {
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

function mergeAccount(payload) {
  if (!payload) return { ...DEFAULT_ACCOUNT };
  return {
    ...DEFAULT_ACCOUNT,
    firstName: payload.firstName ?? DEFAULT_ACCOUNT.firstName,
    lastName: payload.lastName ?? DEFAULT_ACCOUNT.lastName,
    email: payload.email ?? DEFAULT_ACCOUNT.email,
    phoneNumber: payload.phoneNumber ?? DEFAULT_ACCOUNT.phoneNumber,
    jobTitle: payload.jobTitle ?? DEFAULT_ACCOUNT.jobTitle,
    location: payload.location ?? DEFAULT_ACCOUNT.location,
  };
}

function mergeNotifications(payload) {
  if (!payload) return { ...DEFAULT_NOTIFICATIONS };
  return {
    emailEnabled: payload.emailEnabled !== false,
    pushEnabled: payload.pushEnabled !== false,
    smsEnabled: Boolean(payload.smsEnabled),
    inAppEnabled: payload.inAppEnabled !== false,
    digestFrequency: payload.digestFrequency ?? DEFAULT_NOTIFICATIONS.digestFrequency,
    quietHoursStart: payload.quietHoursStart ?? DEFAULT_NOTIFICATIONS.quietHoursStart,
    quietHoursEnd: payload.quietHoursEnd ?? DEFAULT_NOTIFICATIONS.quietHoursEnd,
  };
}

function mergeAi(payload) {
  if (!payload) return { ...DEFAULT_AI };
  const base = { ...DEFAULT_AI, ...payload };
  const replies = {
    ...DEFAULT_AI.autoReplies,
    ...(payload.autoReplies && typeof payload.autoReplies === 'object' ? payload.autoReplies : {}),
  };
  replies.channels = Array.isArray(replies.channels) && replies.channels.length
    ? Array.from(new Set(replies.channels.map((entry) => `${entry}`.trim()).filter(Boolean)))
    : [...DEFAULT_AI.autoReplies.channels];
  replies.temperature = Number.isFinite(Number(replies.temperature))
    ? Math.min(2, Math.max(0, Number(replies.temperature)))
    : DEFAULT_AI.autoReplies.temperature;
  replies.instructions = replies.instructions ?? '';

  return {
    ...base,
    autoReplies: replies,
    provider: base.provider || 'openai',
    model: base.model || DEFAULT_AI.model,
    apiKey: {
      configured: Boolean(payload.apiKey?.configured),
      fingerprint: payload.apiKey?.fingerprint ?? null,
      updatedAt: payload.apiKey?.updatedAt ?? null,
    },
    connection: {
      baseUrl: payload.connection?.baseUrl || DEFAULT_AI.connection.baseUrl,
      lastTestedAt: payload.connection?.lastTestedAt ?? null,
    },
    workspaceId: payload.workspaceId ?? null,
  };
}

function SectionHeader({ eyebrow, title, description, actions }) {
  return (
    <header className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">{eyebrow}</p>
        <h2 className="mt-1 text-3xl font-semibold text-slate-900">{title}</h2>
        {description ? <p className="mt-2 max-w-3xl text-sm text-slate-500">{description}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
    </header>
  );
}

SectionHeader.propTypes = {
  eyebrow: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.node,
  actions: PropTypes.node,
};

SectionHeader.defaultProps = {
  description: null,
  actions: null,
};

function Toggle({ label, name, checked, onChange, description }) {
  return (
    <label className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 shadow-sm">
      <div>
        <p className="text-sm font-medium text-slate-900">{label}</p>
        {description ? <p className="mt-1 text-xs text-slate-500">{description}</p> : null}
      </div>
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={(event) => onChange?.(event.target.checked, name)}
        className="mt-1 h-5 w-5 rounded border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
      />
    </label>
  );
}

Toggle.propTypes = {
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  checked: PropTypes.bool,
  onChange: PropTypes.func,
  description: PropTypes.node,
};

Toggle.defaultProps = {
  checked: false,
  onChange: null,
  description: null,
};

function ChannelCheckbox({ value, label, checked, onChange }) {
  return (
    <label className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition ${
      checked
        ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
        : 'border-slate-200 bg-white text-slate-500 hover:border-emerald-200'
    }`}
    >
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
        checked={checked}
        onChange={(event) => onChange?.(value, event.target.checked)}
      />
      {label}
    </label>
  );
}

ChannelCheckbox.propTypes = {
  value: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  checked: PropTypes.bool,
  onChange: PropTypes.func,
};

ChannelCheckbox.defaultProps = {
  checked: false,
  onChange: null,
};

function DigestSummary({ weeklyDigest }) {
  const subscription = weeklyDigest?.subscription ?? null;
  if (!subscription) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-xs text-slate-500">
        Weekly digest is not active. Enable in notification preferences to receive curated updates.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-xs text-slate-600">
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-slate-900 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
          Digest active
        </span>
        <span>Frequency: {subscription.frequency}</span>
        <span>Channels: {subscription.channels?.join(', ') || 'n/a'}</span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Last sent</p>
          <p className="text-sm text-slate-900">
            {subscription.lastSentAt ? new Date(subscription.lastSentAt).toLocaleString() : 'Awaiting first send'}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Next scheduled</p>
          <p className="text-sm text-slate-900">
            {subscription.nextScheduledAt ? new Date(subscription.nextScheduledAt).toLocaleString() : 'On demand'}
          </p>
        </div>
      </div>
    </div>
  );
}

DigestSummary.propTypes = {
  weeklyDigest: PropTypes.object,
};

DigestSummary.defaultProps = {
  weeklyDigest: null,
};

export default function UserSettingsSection({
  userId,
  session,
  initialNotificationPreferences,
  weeklyDigest,
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [account, setAccount] = useState(() => mergeAccount(session?.user));
  const [notifications, setNotifications] = useState(() => mergeNotifications(initialNotificationPreferences));
  const [aiSettings, setAiSettings] = useState(() => mergeAi(null));

  const [accountBusy, setAccountBusy] = useState(false);
  const [accountFeedback, setAccountFeedback] = useState('');
  const [accountError, setAccountError] = useState('');

  const [notificationBusy, setNotificationBusy] = useState(false);
  const [notificationFeedback, setNotificationFeedback] = useState('');
  const [notificationError, setNotificationError] = useState('');
  const [notificationStats, setNotificationStats] = useState(null);

  const [aiBusy, setAiBusy] = useState(false);
  const [aiFeedback, setAiFeedback] = useState('');
  const [aiError, setAiError] = useState('');
  const [aiApiKey, setAiApiKey] = useState('');

  const refreshAll = useCallback(() => {
    if (!userId) return () => {};

    const controller = new AbortController();
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [accountResponse, notificationResponse, aiResponse] = await Promise.all([
          fetchUser(userId, { signal: controller.signal }).catch(() => null),
          fetchNotificationPreferences(userId, { signal: controller.signal }).catch(() => null),
          fetchUserAiSettings(userId, { signal: controller.signal }).catch(() => null),
        ]);
        if (!controller.signal.aborted) {
          setAccount(mergeAccount(accountResponse));
          setNotifications(mergeNotifications(notificationResponse?.preferences ?? notificationResponse));
          setNotificationStats(notificationResponse?.stats ?? null);
          setAiSettings(mergeAi(aiResponse));
          setLastUpdated(new Date());
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    })();
    return () => controller.abort();
  }, [userId]);

  useEffect(() => {
    const abort = refreshAll();
    return () => abort?.();
  }, [refreshAll]);

  const handleAccountChange = useCallback((event) => {
    const { name, value } = event.target;
    setAccount((previous) => ({ ...previous, [name]: value }));
  }, []);

  const handleAccountSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      if (!userId) return;
      setAccountBusy(true);
      setAccountFeedback('');
      setAccountError('');
      try {
        const payload = {
          firstName: account.firstName.trim(),
          lastName: account.lastName.trim(),
          email: account.email.trim(),
          phoneNumber: account.phoneNumber || null,
          jobTitle: account.jobTitle || null,
          location: account.location || null,
        };
        await updateUserAccount(userId, payload);
        setAccountFeedback('Account profile updated successfully.');
        setLastUpdated(new Date());
      } catch (err) {
        setAccountError(err?.message ?? 'Unable to save account changes.');
      } finally {
        setAccountBusy(false);
      }
    },
    [account, userId],
  );

  const handleNotificationToggle = useCallback((checked, name) => {
    setNotifications((previous) => ({ ...previous, [name]: checked }));
  }, []);

  const handleNotificationSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      if (!userId) return;
      setNotificationBusy(true);
      setNotificationFeedback('');
      setNotificationError('');
      try {
        const payload = {
          emailEnabled: Boolean(notifications.emailEnabled),
          pushEnabled: Boolean(notifications.pushEnabled),
          smsEnabled: Boolean(notifications.smsEnabled),
          inAppEnabled: Boolean(notifications.inAppEnabled),
          digestFrequency: notifications.digestFrequency,
          quietHoursStart: notifications.quietHoursStart,
          quietHoursEnd: notifications.quietHoursEnd,
        };
        const response = await updateNotificationPreferences(userId, payload);
        const nextPreferences = response?.preferences ?? response;
        const nextStats = response?.stats ?? null;
        setNotifications(mergeNotifications(nextPreferences));
        setNotificationStats(nextStats);
        setNotificationFeedback('Notification preferences saved.');
        setLastUpdated(new Date());
      } catch (err) {
        setNotificationError(err?.message ?? 'Unable to update notification preferences.');
      } finally {
        setNotificationBusy(false);
      }
    },
    [notifications, userId],
  );

  const handleAiChannelChange = useCallback((channel, checked) => {
    setAiSettings((previous) => {
      const current = new Set(previous.autoReplies.channels);
      if (checked) {
        current.add(channel);
      } else {
        current.delete(channel);
      }
      return {
        ...previous,
        autoReplies: { ...previous.autoReplies, channels: Array.from(current) },
      };
    });
  }, []);

  const handleAiChange = useCallback((event) => {
    const { name, value, type, checked } = event.target;
    if (name === 'autoReplies.enabled') {
      setAiSettings((previous) => ({
        ...previous,
        autoReplies: { ...previous.autoReplies, enabled: checked },
      }));
      return;
    }
    if (name === 'autoReplies.temperature') {
      const numeric = Number(value);
      setAiSettings((previous) => ({
        ...previous,
        autoReplies: {
          ...previous.autoReplies,
          temperature: Number.isFinite(numeric) ? Math.min(2, Math.max(0, numeric)) : previous.autoReplies.temperature,
        },
      }));
      return;
    }
    if (name === 'connection.baseUrl') {
      setAiSettings((previous) => ({
        ...previous,
        connection: { ...previous.connection, baseUrl: value },
      }));
      return;
    }
    if (name === 'workspaceId') {
      setAiSettings((previous) => ({
        ...previous,
        workspaceId: value ? Number(value) || value : null,
      }));
      return;
    }
    setAiSettings((previous) => ({ ...previous, [name]: type === 'checkbox' ? checked : value }));
  }, []);

  const handleAiSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      if (!userId) return;
      setAiBusy(true);
      setAiFeedback('');
      setAiError('');
      try {
        const payload = {
          provider: aiSettings.provider,
          model: aiSettings.model,
          autoReplies: {
            enabled: Boolean(aiSettings.autoReplies.enabled),
            instructions: aiSettings.autoReplies.instructions?.trim() ?? '',
            channels: aiSettings.autoReplies.channels,
            temperature: aiSettings.autoReplies.temperature,
          },
          connection: { baseUrl: aiSettings.connection.baseUrl },
          workspaceId: aiSettings.workspaceId || null,
        };
        if (aiApiKey.trim()) {
          payload.apiKey = aiApiKey.trim();
        }
        const response = await updateUserAiSettings(userId, payload);
        setAiSettings(mergeAi(response));
        setAiApiKey('');
        setAiFeedback('AI concierge preferences updated.');
        setLastUpdated(new Date());
      } catch (err) {
        setAiError(err?.message ?? 'Unable to update AI concierge settings.');
      } finally {
        setAiBusy(false);
      }
    },
    [aiApiKey, aiSettings, userId],
  );

  const digestIntegrations = useMemo(() => weeklyDigest?.integrations ?? [], [weeklyDigest]);

  return (
    <section id="user-settings" className="space-y-8 rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-white p-6 shadow-sm">
      <SectionHeader
        eyebrow="Account settings"
        title="Operating profile & concierge controls"
        description="Manage the human settings your client partners rely on: account identity, message delivery preferences, and AI concierge behaviour."
        actions={
          <button
            type="button"
            onClick={() => refreshAll()}
            className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-slate-400 hover:text-slate-800"
          >
            Quick refresh
          </button>
        }
      />

      <DataStatus
        loading={loading}
        error={error}
        fromCache={false}
        lastUpdated={lastUpdated}
        statusLabel="Settings synchronisation"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={handleAccountSubmit} className="space-y-5 rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-inner">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-slate-900">Account profile</h3>
            <p className="text-sm text-slate-500">Update your personal details so invoices, notifications, and programme managers are aligned.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">First name</span>
              <input
                type="text"
                name="firstName"
                value={account.firstName}
                onChange={handleAccountChange}
                required
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500/20"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Last name</span>
              <input
                type="text"
                name="lastName"
                value={account.lastName}
                onChange={handleAccountChange}
                required
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500/20"
              />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Email</span>
              <input
                type="email"
                name="email"
                value={account.email}
                onChange={handleAccountChange}
                required
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500/20"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Phone</span>
              <input
                type="tel"
                name="phoneNumber"
                value={account.phoneNumber}
                onChange={handleAccountChange}
                placeholder="+44 20 7946 0958"
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500/20"
              />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Role / Title</span>
              <input
                type="text"
                name="jobTitle"
                value={account.jobTitle}
                onChange={handleAccountChange}
                placeholder="Client programmes lead"
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500/20"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Location</span>
              <input
                type="text"
                name="location"
                value={account.location}
                onChange={handleAccountChange}
                placeholder="London, United Kingdom"
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500/20"
              />
            </label>
          </div>
          {accountBusy ? (
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Saving account…</p>
          ) : null}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={accountBusy}
              className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Save profile
            </button>
          </div>
          {accountFeedback ? (
            <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700">{accountFeedback}</p>
          ) : null}
          {accountError ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">{accountError}</p>
          ) : null}
        </form>

        <div className="space-y-5 rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-inner">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-slate-900">Weekly digest</h3>
            <p className="text-sm text-slate-500">Keep stakeholders in the loop with curated updates across bookings, orders, and interviews.</p>
          </div>
          <DigestSummary weeklyDigest={weeklyDigest} />
          {digestIntegrations.length ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Connected integrations</p>
              <ul className="mt-2 space-y-2 text-sm text-slate-600">
                {digestIntegrations.map((integration) => (
                  <li key={integration.id ?? integration.provider} className="flex items-center justify-between rounded-2xl border border-slate-200 px-3 py-2">
                    <span>{integration.provider ?? 'Integration'} — {integration.status ?? 'active'}</span>
                    <span className="text-xs text-slate-400">{integration.lastSyncAt ? new Date(integration.lastSyncAt).toLocaleString() : 'Awaiting sync'}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-3 text-xs text-slate-500">No automation integrations connected. Link your calendar or CRM from the integrations workspace to enrich digests.</p>
          )}
        </div>
      </div>

      <form onSubmit={handleNotificationSubmit} className="space-y-5 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-inner">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-slate-900">Notification preferences</h3>
          <p className="text-sm text-slate-500">Choose how the platform keeps you and your partners informed across devices.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Toggle
            name="emailEnabled"
            label="Email delivery"
            description="Programme alerts, contract updates, and AI concierge transcripts delivered to your inbox."
            checked={notifications.emailEnabled}
            onChange={handleNotificationToggle}
          />
          <Toggle
            name="pushEnabled"
            label="Push notifications"
            description="Realtime nudges for interviews, deliverables, and escalations."
            checked={notifications.pushEnabled}
            onChange={handleNotificationToggle}
          />
          <Toggle
            name="smsEnabled"
            label="SMS alerts"
            description="Priority events such as payment releases or compliance actions."
            checked={notifications.smsEnabled}
            onChange={handleNotificationToggle}
          />
          <Toggle
            name="inAppEnabled"
            label="Inbox & in-app"
            description="Keep the notification centre populated with mission critical updates."
            checked={notifications.inAppEnabled}
            onChange={handleNotificationToggle}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-slate-700">Digest cadence</span>
            <select
              value={notifications.digestFrequency}
              onChange={(event) => setNotifications((previous) => ({ ...previous, digestFrequency: event.target.value }))}
              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              {DIGEST_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-slate-700">Quiet hours start</span>
            <input
              type="time"
              value={notifications.quietHoursStart}
              onChange={(event) => setNotifications((previous) => ({ ...previous, quietHoursStart: event.target.value }))}
              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-slate-700">Quiet hours end</span>
            <input
              type="time"
              value={notifications.quietHoursEnd}
              onChange={(event) => setNotifications((previous) => ({ ...previous, quietHoursEnd: event.target.value }))}
              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </label>
        </div>
        {notificationStats ? (
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 text-xs text-slate-600">
              <p className="font-semibold uppercase tracking-wide text-slate-500">Unread</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{notificationStats.unread}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 text-xs text-slate-600">
              <p className="font-semibold uppercase tracking-wide text-slate-500">Delivered</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{notificationStats.delivered}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 text-xs text-slate-600">
              <p className="font-semibold uppercase tracking-wide text-slate-500">Dismissed</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{notificationStats.dismissed}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 text-xs text-slate-600">
              <p className="font-semibold uppercase tracking-wide text-slate-500">Last activity</p>
              <p className="mt-1 text-sm text-slate-900">
                {notificationStats.lastActivityAt ? new Date(notificationStats.lastActivityAt).toLocaleString() : 'n/a'}
              </p>
            </div>
          </div>
        ) : null}
        {notificationBusy ? (
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Saving notification preferences…</p>
        ) : null}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={notificationBusy}
            className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-300"
          >
            Save notification preferences
          </button>
        </div>
        {notificationFeedback ? (
          <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700">{notificationFeedback}</p>
        ) : null}
        {notificationError ? (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">{notificationError}</p>
        ) : null}
      </form>

      <form onSubmit={handleAiSubmit} className="space-y-5 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-inner">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-slate-900">AI concierge</h3>
          <p className="text-sm text-slate-500">Control how the Launchpad concierge drafts replies, triages channels, and integrates with your workspace.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-slate-700">Provider</span>
            <select
              name="provider"
              value={aiSettings.provider}
              onChange={handleAiChange}
              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="azure_openai">Azure OpenAI</option>
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-slate-700">Model</span>
            <input
              type="text"
              name="model"
              value={aiSettings.model}
              onChange={handleAiChange}
              placeholder="gpt-4o-mini"
              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-slate-700">Workspace ID</span>
            <input
              type="number"
              name="workspaceId"
              value={aiSettings.workspaceId ?? ''}
              onChange={handleAiChange}
              placeholder="Internal workspace mapping"
              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            />
          </label>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-slate-700">System instructions</span>
            <textarea
              name="autoReplies.instructions"
              value={aiSettings.autoReplies.instructions}
              onChange={(event) =>
                setAiSettings((previous) => ({
                  ...previous,
                  autoReplies: { ...previous.autoReplies, instructions: event.target.value },
                }))
              }
              rows={4}
              placeholder="Tone, escalation rules, and guardrails for AI replies."
              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            />
          </label>
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white/80 p-4">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name="autoReplies.enabled"
                checked={aiSettings.autoReplies.enabled}
                onChange={handleAiChange}
                className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
              />
              Enable automatic replies across selected channels
            </label>
            <div className="flex flex-wrap gap-2">
              {CHANNEL_OPTIONS.map((channel) => (
                <ChannelCheckbox
                  key={channel.value}
                  value={channel.value}
                  label={channel.label}
                  checked={aiSettings.autoReplies.channels.includes(channel.value)}
                  onChange={handleAiChannelChange}
                />
              ))}
            </div>
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Creativity</span>
              <input
                type="range"
                min="0"
                max="2"
                step="0.05"
                name="autoReplies.temperature"
                value={aiSettings.autoReplies.temperature}
                onChange={handleAiChange}
                className="h-2 rounded-full bg-slate-200 accent-violet-500"
              />
              <span className="text-xs text-slate-500">{aiSettings.autoReplies.temperature.toFixed(2)} temperature</span>
            </label>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-slate-700">API endpoint</span>
            <input
              type="url"
              name="connection.baseUrl"
              value={aiSettings.connection.baseUrl}
              onChange={handleAiChange}
              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-slate-700">Rotate API key</span>
            <input
              type="password"
              name="apiKey"
              value={aiApiKey}
              onChange={(event) => setAiApiKey(event.target.value)}
              placeholder={aiSettings.apiKey.configured ? '••••••••' : 'Paste secure token'}
              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            />
          </label>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 text-xs text-slate-600">
            <p className="font-semibold uppercase tracking-wide text-slate-500">Key fingerprint</p>
            <p className="mt-1 text-sm text-slate-900">{aiSettings.apiKey.fingerprint ?? '—'}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 text-xs text-slate-600">
            <p className="font-semibold uppercase tracking-wide text-slate-500">Key updated</p>
            <p className="mt-1 text-sm text-slate-900">
              {aiSettings.apiKey.updatedAt ? new Date(aiSettings.apiKey.updatedAt).toLocaleString() : 'Not configured'}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 text-xs text-slate-600">
            <p className="font-semibold uppercase tracking-wide text-slate-500">Connection tested</p>
            <p className="mt-1 text-sm text-slate-900">
              {aiSettings.connection.lastTestedAt
                ? new Date(aiSettings.connection.lastTestedAt).toLocaleString()
                : 'Pending test'}
            </p>
          </div>
        </div>
        {aiBusy ? (
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">Updating concierge preferences…</p>
        ) : null}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={aiBusy}
            className="rounded-2xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:bg-violet-300"
          >
            Save AI concierge settings
          </button>
        </div>
        {aiFeedback ? (
          <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700">{aiFeedback}</p>
        ) : null}
        {aiError ? (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">{aiError}</p>
        ) : null}
      </form>
    </section>
  );
}

UserSettingsSection.propTypes = {
  userId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  session: PropTypes.object,
  initialNotificationPreferences: PropTypes.object,
  weeklyDigest: PropTypes.object,
};

UserSettingsSection.defaultProps = {
  session: null,
  initialNotificationPreferences: null,
  weeklyDigest: null,
};
