import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import DataStatus from '../../DataStatus.jsx';
import {
  fetchNotificationPreferences,
  updateNotificationPreferences,
} from '../../../services/notificationCenter.js';
import { fetchUser, updateUserAccount } from '../../../services/user.js';
import {
  fetchUserAiSettings,
  updateUserAiSettings,
  testUserAiSettingsConnection,
} from '../../../services/userAiSettings.js';
import AccountSettingsForm from '../../profileSettings/preferences/AccountSettingsForm.jsx';
import NotificationPreferences from '../../profileSettings/preferences/NotificationPreferences.jsx';

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
  timezone: '',
};

const DEFAULT_NOTIFICATIONS = {
  channels: {
    email: true,
    push: true,
    sms: false,
    inApp: true,
  },
  categories: {
    opportunities: true,
    platform: true,
    compliance: true,
    community: false,
  },
  devices: {
    mobilePush: true,
    webPush: true,
    email: true,
    sms: false,
  },
  digestFrequency: 'weekly',
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  previewChannel: 'email',
  preset: 'focused',
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
    timezone: payload.timezone ?? DEFAULT_ACCOUNT.timezone,
  };
}

function mergeNotifications(payload) {
  const base = {
    channels: { ...DEFAULT_NOTIFICATIONS.channels },
    categories: { ...DEFAULT_NOTIFICATIONS.categories },
    devices: { ...DEFAULT_NOTIFICATIONS.devices },
    digestFrequency: DEFAULT_NOTIFICATIONS.digestFrequency,
    quietHoursStart: DEFAULT_NOTIFICATIONS.quietHoursStart,
    quietHoursEnd: DEFAULT_NOTIFICATIONS.quietHoursEnd,
    previewChannel: DEFAULT_NOTIFICATIONS.previewChannel,
    preset: DEFAULT_NOTIFICATIONS.preset,
  };

  if (!payload) {
    return {
      ...base,
      emailEnabled: base.channels.email,
      pushEnabled: base.channels.push,
      smsEnabled: base.channels.sms,
      inAppEnabled: base.channels.inApp,
    };
  }

  const metadata = payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : {};
  const nextChannels = {
    ...base.channels,
    email: payload.emailEnabled !== false,
    push: payload.pushEnabled !== false,
    sms: Boolean(payload.smsEnabled),
    inApp: payload.inAppEnabled !== false,
  };
  const nextCategories = {
    ...base.categories,
    ...(metadata.categories && typeof metadata.categories === 'object' ? metadata.categories : {}),
  };
  const nextDevices = {
    ...base.devices,
    ...(metadata.devices && typeof metadata.devices === 'object' ? metadata.devices : {}),
  };

  return {
    channels: nextChannels,
    categories: Object.keys(nextCategories).reduce((acc, key) => {
      acc[key] = nextCategories[key] !== false;
      return acc;
    }, {}),
    devices: Object.keys(nextDevices).reduce((acc, key) => {
      acc[key] = nextDevices[key] !== false;
      return acc;
    }, {}),
    digestFrequency: payload.digestFrequency ?? base.digestFrequency,
    quietHoursStart: payload.quietHoursStart ?? base.quietHoursStart,
    quietHoursEnd: payload.quietHoursEnd ?? base.quietHoursEnd,
    previewChannel: metadata.previewChannel ?? base.previewChannel,
    preset: metadata.preset ?? metadata.recommendedPreset ?? base.preset,
    emailEnabled: nextChannels.email,
    pushEnabled: nextChannels.push,
    smsEnabled: nextChannels.sms,
    inAppEnabled: nextChannels.inApp,
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

const NOTIFICATION_PRESETS = {
  immersive: {
    channels: { email: true, push: true, sms: true, inApp: true },
    categories: { opportunities: true, platform: true, compliance: true, community: true },
    devices: { mobilePush: true, webPush: true, email: true, sms: true },
    digestFrequency: 'daily',
    quietHoursStart: '00:00',
    quietHoursEnd: '00:00',
    previewChannel: 'push',
  },
  focused: {
    channels: { email: true, push: true, sms: true, inApp: true },
    categories: { opportunities: true, platform: true, compliance: true, community: false },
    devices: { mobilePush: true, webPush: true, email: true, sms: true },
    digestFrequency: 'weekly',
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00',
    previewChannel: 'email',
  },
  'quiet-hours': {
    channels: { email: true, push: false, sms: true, inApp: true },
    categories: { opportunities: true, platform: false, compliance: true, community: false },
    devices: { mobilePush: false, webPush: false, email: true, sms: true },
    digestFrequency: 'monthly',
    quietHoursStart: '19:00',
    quietHoursEnd: '08:00',
    previewChannel: 'sms',
  },
};

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


function normaliseSessions(sessionContext, accountPayload) {
  const baseSessions = Array.isArray(accountPayload?.sessions)
    ? accountPayload.sessions
    : Array.isArray(sessionContext?.activeSessions)
      ? sessionContext.activeSessions
      : Array.isArray(sessionContext?.sessions)
        ? sessionContext.sessions
        : [];

  const mapped = baseSessions.map((sessionEntry, index) => ({
    id: `${sessionEntry.id ?? sessionEntry.sessionId ?? sessionEntry.deviceId ?? `session-${index}`}`,
    device: sessionEntry.device ?? sessionEntry.label ?? sessionEntry.userAgent ?? 'Unknown device',
    location: sessionEntry.location ?? sessionEntry.geo ?? sessionEntry.ipLocation ?? sessionContext?.user?.location ?? null,
    lastActiveAt:
      sessionEntry.lastActiveAt ?? sessionEntry.updatedAt ?? sessionEntry.seenAt ?? sessionContext?.lastActiveAt ?? null,
    ipAddress: sessionEntry.ipAddress ?? sessionEntry.ip ?? null,
    current: Boolean(sessionEntry.current ?? sessionEntry.isCurrent ?? sessionEntry.active ?? false),
  }));

  if (!mapped.some((entry) => entry.current)) {
    mapped.unshift({
      id: 'current-session',
      device: sessionContext?.currentSession?.device ?? 'This device',
      location: sessionContext?.currentSession?.location ?? sessionContext?.user?.location ?? 'Unknown',
      lastActiveAt: sessionContext?.currentSession?.lastActiveAt ?? sessionContext?.lastActiveAt ?? new Date().toISOString(),
      ipAddress: sessionContext?.currentSession?.ipAddress ?? null,
      current: true,
    });
  }

  return mapped;
}

export default function UserSettingsSection({
  userId,
  session,
  initialNotificationPreferences,
}) {
  const mergedInitialAccount = useMemo(() => mergeAccount(session?.user), [session]);
  const mergedInitialNotifications = useMemo(
    () => mergeNotifications(initialNotificationPreferences),
    [initialNotificationPreferences],
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [accountBaseline, setAccountBaseline] = useState(mergedInitialAccount);
  const [account, setAccount] = useState(mergedInitialAccount);
  const [sessions, setSessions] = useState(() => normaliseSessions(session, null));
  const [notifications, setNotifications] = useState(mergedInitialNotifications);
  const [notificationPresetApplying, setNotificationPresetApplying] = useState(false);
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
  const [aiTestBusy, setAiTestBusy] = useState(false);
  const [aiTestFeedback, setAiTestFeedback] = useState('');
  const [aiTestError, setAiTestError] = useState('');

  useEffect(() => {
    setAccountBaseline(mergedInitialAccount);
    setAccount(mergedInitialAccount);
  }, [mergedInitialAccount]);

  useEffect(() => {
    setNotifications(mergedInitialNotifications);
  }, [mergedInitialNotifications]);

  useEffect(() => {
    setSessions(normaliseSessions(session, null));
  }, [session]);

  const refreshAll = useCallback(() => {
    if (!userId) return () => {};

    const controller = new AbortController();
    (async () => {
      setLoading(true);
      setError(null);
      setAiTestFeedback('');
      setAiTestError('');
      try {
        const [accountResponse, notificationResponse, aiResponse] = await Promise.all([
          fetchUser(userId, { signal: controller.signal }).catch(() => null),
          fetchNotificationPreferences(userId, { signal: controller.signal }).catch(() => null),
          fetchUserAiSettings(userId, { signal: controller.signal }).catch(() => null),
        ]);
        if (!controller.signal.aborted) {
          const nextAccount = mergeAccount(accountResponse);
          setAccount(nextAccount);
          setAccountBaseline(nextAccount);
          setSessions(normaliseSessions(session, accountResponse));
          const nextNotifications = mergeNotifications(notificationResponse?.preferences ?? notificationResponse);
          setNotifications(nextNotifications);
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
  }, [session, userId]);

  useEffect(() => {
    const abort = refreshAll();
    return () => abort?.();
  }, [refreshAll]);

  const handleAccountFieldChange = useCallback((field, value) => {
    setAccount((previous) => ({ ...previous, [field]: value }));
  }, []);

  const persistAccount = useCallback(
    async (draft, { silent = false } = {}) => {
      if (!userId) return;
      const payload = {
        firstName: draft.firstName?.trim() || '',
        lastName: draft.lastName?.trim() || '',
        email: draft.email?.trim() || '',
        phoneNumber: draft.phoneNumber?.trim() ? draft.phoneNumber.trim() : null,
        jobTitle: draft.jobTitle?.trim() || null,
        location: draft.location?.trim() || null,
        timezone: draft.timezone?.trim() || null,
      };
      if (!silent) {
        setAccountBusy(true);
        setAccountFeedback('');
        setAccountError('');
      }
      try {
        await updateUserAccount(userId, payload);
        const nextBaseline = mergeAccount({ ...draft, ...payload });
        setAccountBaseline(nextBaseline);
        setAccount(nextBaseline);
        if (!silent) {
          setAccountFeedback('Account profile updated successfully.');
        }
        setLastUpdated(new Date());
      } catch (err) {
        if (!silent) {
          setAccountError(err?.message ?? 'Unable to save account changes.');
        }
        throw err;
      } finally {
        if (!silent) {
          setAccountBusy(false);
        }
      }
    },
    [userId],
  );

  const handleAccountSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      try {
        await persistAccount(account);
      } catch (err) {
        console.error('Unable to save account changes', err);
      }
    },
    [account, persistAccount],
  );

  const handleAccountAutoSave = useCallback(
    async (draft) => {
      await persistAccount(draft, { silent: true });
    },
    [persistAccount],
  );

  const handleTerminateSession = useCallback((sessionId) => {
    setSessions((previous) => previous.filter((entry) => entry.id !== sessionId || entry.current));
    setAccountFeedback('Session revoked. It will sign out within 30 seconds.');
  }, []);

  const handleNotificationChannelToggle = useCallback((key, value) => {
    setNotifications((previous) => {
      const nextChannels = { ...previous.channels, [key]: value };
      return {
        ...previous,
        channels: {
          email: nextChannels.email !== false,
          push: nextChannels.push !== false,
          sms: Boolean(nextChannels.sms),
          inApp: nextChannels.inApp !== false,
        },
        emailEnabled: nextChannels.email !== false,
        pushEnabled: nextChannels.push !== false,
        smsEnabled: Boolean(nextChannels.sms),
        inAppEnabled: nextChannels.inApp !== false,
        preset: 'custom',
      };
    });
  }, []);

  const handleNotificationCategoryToggle = useCallback((key, value) => {
    setNotifications((previous) => ({
      ...previous,
      categories: { ...previous.categories, [key]: value },
      preset: 'custom',
    }));
  }, []);

  const handleNotificationDeviceToggle = useCallback((key, value) => {
    setNotifications((previous) => ({
      ...previous,
      devices: { ...previous.devices, [key]: value },
      preset: 'custom',
    }));
  }, []);

  const handleNotificationFieldChange = useCallback((field, value) => {
    setNotifications((previous) => ({
      ...previous,
      [field]: value,
      preset: field === 'previewChannel' ? previous.preset : 'custom',
    }));
  }, []);

  const handleApplyNotificationPreset = useCallback((presetKey) => {
    const definition = NOTIFICATION_PRESETS[presetKey];
    if (!definition) {
      return;
    }
    setNotificationPresetApplying(true);
    setNotifications((previous) => {
      const nextChannels = {
        email: definition.channels?.email ?? previous.channels.email,
        push: definition.channels?.push ?? previous.channels.push,
        sms: definition.channels?.sms ?? previous.channels.sms,
        inApp: definition.channels?.inApp ?? previous.channels.inApp,
      };
      const nextCategories = {
        ...previous.categories,
        ...(definition.categories ?? {}),
      };
      const nextDevices = {
        ...previous.devices,
        ...(definition.devices ?? {}),
      };
      return {
        ...previous,
        channels: {
          email: nextChannels.email !== false,
          push: nextChannels.push !== false,
          sms: Boolean(nextChannels.sms),
          inApp: nextChannels.inApp !== false,
        },
        categories: Object.keys(nextCategories).reduce((acc, key) => {
          acc[key] = nextCategories[key] !== false;
          return acc;
        }, {}),
        devices: Object.keys(nextDevices).reduce((acc, key) => {
          acc[key] = nextDevices[key] !== false;
          return acc;
        }, {}),
        digestFrequency: definition.digestFrequency ?? previous.digestFrequency,
        quietHoursStart: definition.quietHoursStart ?? previous.quietHoursStart,
        quietHoursEnd: definition.quietHoursEnd ?? previous.quietHoursEnd,
        previewChannel: definition.previewChannel ?? previous.previewChannel,
        emailEnabled: nextChannels.email !== false,
        pushEnabled: nextChannels.push !== false,
        smsEnabled: Boolean(nextChannels.sms),
        inAppEnabled: nextChannels.inApp !== false,
        preset: presetKey,
      };
    });
    setTimeout(() => setNotificationPresetApplying(false), 200);
  }, []);

  const buildNotificationPayload = useCallback((draft) => {
    const channels = draft.channels ?? DEFAULT_NOTIFICATIONS.channels;
    const categories = draft.categories ?? DEFAULT_NOTIFICATIONS.categories;
    const devices = draft.devices ?? DEFAULT_NOTIFICATIONS.devices;
    const digestFrequency = draft.digestFrequency ?? DEFAULT_NOTIFICATIONS.digestFrequency;
    const quietHoursStart = draft.quietHoursStart ?? DEFAULT_NOTIFICATIONS.quietHoursStart;
    const quietHoursEnd = draft.quietHoursEnd ?? DEFAULT_NOTIFICATIONS.quietHoursEnd;
    return {
      emailEnabled: channels.email !== false,
      pushEnabled: channels.push !== false,
      smsEnabled: Boolean(channels.sms),
      inAppEnabled: channels.inApp !== false,
      digestFrequency,
      quietHoursStart,
      quietHoursEnd,
      metadata: {
        categories,
        devices,
        preset: draft.preset ?? 'custom',
        previewChannel: draft.previewChannel ?? DEFAULT_NOTIFICATIONS.previewChannel,
        quietHours: { start: quietHoursStart, end: quietHoursEnd },
      },
    };
  }, []);

  const handleNotificationSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      if (!userId) return;
      setNotificationBusy(true);
      setNotificationFeedback('');
      setNotificationError('');
      try {
        const payload = buildNotificationPayload(notifications);
        const response = await updateNotificationPreferences(userId, payload);
        const nextPreferences = response?.preferences ?? response;
        const nextStats = response?.stats ?? null;
        const merged = mergeNotifications(nextPreferences);
        setNotifications(merged);
        setNotificationStats(nextStats);
        setNotificationFeedback('Notification preferences saved.');
        setLastUpdated(new Date());
      } catch (err) {
        setNotificationError(err?.message ?? 'Unable to update notification preferences.');
      } finally {
        setNotificationBusy(false);
      }
    },
    [buildNotificationPayload, notifications, userId],
  );

  const securityInsights = useMemo(() => {
    const insights = [];
    if (session?.user && session.user.twoFactorEnabled !== true) {
      insights.push({
        id: 'mfa',
        title: 'Enable multi-factor authentication',
        description: 'Add an authenticator app or security key to prevent unauthorised access to payouts and contracts.',
        severity: 'critical',
        cta: 'Open security centre',
      });
    }
    if (!account.phoneNumber) {
      insights.push({
        id: 'phone',
        title: 'Add a verified phone number',
        description: 'Verified phone numbers unlock SMS escalations and concierge callbacks for urgent programmes.',
        severity: 'high',
      });
    }
    if (sessions.filter((entry) => !entry.current).length >= 3) {
      insights.push({
        id: 'sessions',
        title: 'Review trusted devices',
        description: 'You have multiple active sessions. Revoke unused devices to maintain compliance posture.',
        severity: 'medium',
      });
    }
    if (session?.user && !session.user.emailVerifiedAt) {
      insights.push({
        id: 'email',
        title: 'Verify your primary email',
        description: 'Verified mailboxes ensure invoices and workflow alerts arrive without delay.',
        severity: 'high',
      });
    }
    return insights;
  }, [account.phoneNumber, session, sessions]);

  const accountMetrics = useMemo(
    () => ({
      profileCompletion: session?.metrics?.profileCompletion ?? session?.user?.profileCompletion ?? null,
      profileUpdatedAt: session?.user?.updatedAt ?? null,
      securityScore: session?.security?.score ?? null,
      recommendedActions: securityInsights.filter((insight) => insight.severity === 'critical' || insight.severity === 'high').length,
      lastLoginAt: session?.lastActiveAt ?? session?.user?.lastLoginAt ?? null,
    }),
    [securityInsights, session],
  );

  const accountDirty = useMemo(() => {
    try {
      return JSON.stringify(account) !== JSON.stringify(accountBaseline);
    } catch (comparisonError) {
      console.warn('Unable to compare account drafts', comparisonError);
      return true;
    }
  }, [account, accountBaseline]);

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
      setAiTestFeedback('');
      setAiTestError('');
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

  const handleAiTest = useCallback(async () => {
    if (!userId) return;
    setAiTestBusy(true);
    setAiTestFeedback('');
    setAiTestError('');
    if (!aiSettings.connection.baseUrl?.trim()) {
      setAiTestBusy(false);
      setAiTestError('Provide a concierge base URL before running a connection test.');
      return;
    }
    try {
      const payload = {
        provider: aiSettings.provider,
        model: aiSettings.model,
        connection: { baseUrl: aiSettings.connection.baseUrl },
      };
      if (aiApiKey.trim()) {
        payload.apiKey = aiApiKey.trim();
      }
      const response = await testUserAiSettingsConnection(userId, payload);
      const result = response?.result ?? response ?? {};
      const success =
        result?.status === 'ok' || result?.success === true || (result && result.error == null && result.message == null);
      if (!success) {
        setAiTestError(result?.message ?? result?.error ?? 'AI concierge connection test failed.');
      } else {
        const latency = result?.latencyMs ?? result?.latency ?? null;
        const fingerprint = result?.fingerprint ?? result?.apiKeyFingerprint ?? null;
        const testedAt = result?.testedAt ?? result?.connectionTestedAt ?? new Date().toISOString();
        setAiSettings((previous) => ({
          ...previous,
          apiKey: {
            ...previous.apiKey,
            configured: result?.apiKeyConfigured ?? previous.apiKey?.configured ?? Boolean(fingerprint),
            fingerprint: fingerprint ?? previous.apiKey?.fingerprint ?? null,
            updatedAt: previous.apiKey?.updatedAt ?? null,
          },
          connection: {
            ...previous.connection,
            lastTestedAt: testedAt,
          },
        }));
        setAiTestFeedback(
          latency != null ? `Connection verified in ${Number(latency).toFixed(0)}ms.` : 'Connection verified successfully.',
        );
      }
    } catch (err) {
      setAiTestError(err?.message ?? 'Unable to verify AI concierge connection.');
    } finally {
      setAiTestBusy(false);
    }
  }, [aiApiKey, aiSettings.connection.baseUrl, aiSettings.model, aiSettings.provider, userId]);

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

      <AccountSettingsForm
        value={account}
        initialValue={accountBaseline}
        busy={accountBusy}
        dirty={accountDirty}
        autoSave
        onAutoSave={handleAccountAutoSave}
        onSubmit={handleAccountSubmit}
        onFieldChange={handleAccountFieldChange}
        securityInsights={securityInsights}
        sessions={sessions}
        onTerminateSession={handleTerminateSession}
        metrics={accountMetrics}
        feedback={accountFeedback}
        error={accountError}
      />

      <NotificationPreferences
        value={notifications}
        stats={notificationStats}
        busy={notificationBusy}
        feedback={notificationFeedback}
        error={notificationError}
        onSubmit={handleNotificationSubmit}
        onChannelToggle={handleNotificationChannelToggle}
        onCategoryToggle={handleNotificationCategoryToggle}
        onDeviceToggle={handleNotificationDeviceToggle}
        onChange={handleNotificationFieldChange}
        onApplyPreset={handleApplyNotificationPreset}
        presetApplying={notificationPresetApplying}
      />

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
        {(aiBusy || aiTestBusy) ? (
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">
            {aiBusy ? 'Updating concierge preferences…' : 'Testing concierge connection…'}
          </p>
        ) : null}
        <div className="flex flex-wrap justify-between gap-3">
          <button
            type="button"
            onClick={handleAiTest}
            disabled={aiBusy || aiTestBusy}
            className="rounded-2xl border border-violet-200 px-4 py-2 text-sm font-semibold text-violet-700 shadow-sm transition hover:border-violet-300 hover:text-violet-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Test concierge connection
          </button>
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
        {aiTestFeedback ? (
          <p className="rounded-2xl border border-violet-200 bg-white px-4 py-3 text-xs text-violet-700">{aiTestFeedback}</p>
        ) : null}
        {aiTestError ? (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">{aiTestError}</p>
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
