import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ArrowUpTrayIcon,
  BellAlertIcon,
  PlusIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import DashboardLayout from '../../../layouts/DashboardLayout.jsx';
import useSession from '../../../hooks/useSession.js';
import { fetchSystemSettings, updateSystemSettings } from '../../../services/systemSettings.js';

const MENU_SECTIONS = [
  {
    label: 'System controls',
    items: [
      { id: 'system-actions', name: 'Sync & actions', sectionId: 'system-actions' },
      { id: 'system-general', name: 'General', sectionId: 'system-general' },
      { id: 'system-security', name: 'Security & access', sectionId: 'system-security' },
      { id: 'system-notifications', name: 'Notifications', sectionId: 'system-notifications' },
      { id: 'system-storage', name: 'Storage & backups', sectionId: 'system-storage' },
      { id: 'system-integrations', name: 'Integrations', sectionId: 'system-integrations' },
      { id: 'system-maintenance', name: 'Maintenance windows', sectionId: 'system-maintenance' },
    ],
  },
  {
    label: 'Other consoles',
    items: [
      { id: 'admin-dashboard', name: 'Admin overview', href: '/dashboard/admin' },
    ],
  },
];

const EMPTY_SETTINGS = Object.freeze({
  general: {
    appName: '',
    companyName: '',
    supportEmail: '',
    supportPhone: '',
    legalEntity: '',
    timezone: 'UTC',
    defaultLocale: 'en-US',
    logoUrl: '',
    incidentContact: '',
    allowedDomains: [],
  },
  security: {
    requireTwoFactor: true,
    passwordMinimumLength: 12,
    passwordRequireSymbols: true,
    passwordRotationDays: 90,
    sessionTimeoutMinutes: 60,
    allowedIpRanges: [],
    auditLogRetentionDays: 365,
    sso: {
      enabled: false,
      provider: '',
      entityId: '',
      entryPoint: '',
      certificate: '',
    },
  },
  notifications: {
    emailProvider: 'resend',
    emailFromName: '',
    emailFromAddress: '',
    smsProvider: 'twilio',
    smsFromNumber: '',
    incidentWebhookUrl: '',
    broadcastChannels: [],
  },
  storage: {
    provider: 'cloudflare_r2',
    bucket: '',
    region: '',
    assetCdnUrl: '',
    assetMaxSizeMb: 50,
    backupRetentionDays: 30,
    encryptionKeyAlias: '',
  },
  integrations: {
    slackWebhookUrl: '',
    pagerdutyIntegrationKey: '',
    segmentWriteKey: '',
    mixpanelToken: '',
    statusPageUrl: '',
  },
  maintenance: {
    autoBroadcast: true,
    statusPageUrl: '',
    supportChannel: '',
    upcomingWindows: [],
  },
  updatedAt: null,
});

function cloneDeep(value) {
  if (value == null) {
    return value;
  }
  try {
    return JSON.parse(JSON.stringify(value));
  } catch (error) {
    console.warn('Unable to clone value', error);
    return value;
  }
}

function setNestedValue(source, path, value) {
  if (!Array.isArray(path) || path.length === 0) {
    return value;
  }
  const [head, ...rest] = path;
  const base = source && typeof source === 'object' ? source : {};
  const clone = Array.isArray(base) ? [...base] : { ...base };
  clone[head] = rest.length ? setNestedValue(base?.[head], rest, value) : value;
  return clone;
}

function formatRelativeTime(value) {
  if (!value) {
    return '—';
  }
  const timestamp = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(timestamp.getTime())) {
    return '—';
  }
  const now = new Date();
  const diffMs = now.getTime() - timestamp.getTime();
  if (diffMs < 60 * 1000) {
    return 'just now';
  }
  const diffMinutes = Math.floor(diffMs / (60 * 1000));
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }
  return timestamp.toLocaleDateString();
}

function toDateTimeInputValue(value) {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const iso = date.toISOString();
  return iso.slice(0, 16);
}

function fromDateTimeInputValue(value) {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toISOString();
}

function generateIdentifier(prefix = 'id') {
  const random = Math.random().toString(36).slice(2, 10);
  const timestamp = Date.now().toString(36);
  return `${prefix}-${timestamp}-${random}`;
}

function normalizeSettings(source) {
  const payload = source ?? {};
  const general = { ...EMPTY_SETTINGS.general, ...(payload.general ?? {}) };
  general.allowedDomains = Array.isArray(general.allowedDomains) ? general.allowedDomains : [];

  const security = { ...EMPTY_SETTINGS.security, ...(payload.security ?? {}) };
  security.allowedIpRanges = Array.isArray(security.allowedIpRanges) ? security.allowedIpRanges : [];
  security.sso = { ...EMPTY_SETTINGS.security.sso, ...(payload.security?.sso ?? {}) };

  const notifications = { ...EMPTY_SETTINGS.notifications, ...(payload.notifications ?? {}) };
  notifications.broadcastChannels = Array.isArray(notifications.broadcastChannels)
    ? notifications.broadcastChannels
    : [];

  const storage = { ...EMPTY_SETTINGS.storage, ...(payload.storage ?? {}) };
  const integrations = { ...EMPTY_SETTINGS.integrations, ...(payload.integrations ?? {}) };

  const maintenance = { ...EMPTY_SETTINGS.maintenance, ...(payload.maintenance ?? {}) };
  maintenance.upcomingWindows = Array.isArray(maintenance.upcomingWindows)
    ? maintenance.upcomingWindows
    : [];

  return {
    general,
    security,
    notifications,
    storage,
    integrations,
    maintenance,
    updatedAt: payload.updatedAt ?? null,
  };
}
export default function SystemSettingsPage() {
  const { session } = useSession();
  const [settings, setSettings] = useState(null);
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('');
  const [importError, setImportError] = useState('');
  const [dirty, setDirty] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [domainInput, setDomainInput] = useState('');
  const [ipInput, setIpInput] = useState('');
  const [channelInput, setChannelInput] = useState('');
  const [downloadState, setDownloadState] = useState('');
  const fileInputRef = useRef(null);

  const normalizedSettings = useMemo(() => normalizeSettings(draft ?? settings ?? EMPTY_SETTINGS), [draft, settings]);

  const profile = useMemo(() => {
    const sessionUser = session?.user ?? {};
    const displayName = [sessionUser.firstName, sessionUser.lastName].filter(Boolean).join(' ').trim() || session?.name || 'Platform Administrator';
    const displayRole = session?.title ?? sessionUser.title ?? 'System administrator';
    const badges = new Set(session?.badges ?? []);
    badges.add('Admin access');
    if (session?.lastLoginAt) {
      badges.add(`Signed in ${formatRelativeTime(session.lastLoginAt)}`);
    }
    return {
      name: displayName,
      title: displayRole,
      avatarUrl: sessionUser.avatarUrl ?? session?.avatarUrl ?? null,
      badges: Array.from(badges),
    };
  }, [session]);

  const summaryCards = useMemo(() => {
    const domainCount = normalizedSettings.general.allowedDomains.length;
    const ipCount = normalizedSettings.security.allowedIpRanges.length;
    const channelCount = normalizedSettings.notifications.broadcastChannels.length;
    const integrationCount = ['slackWebhookUrl', 'pagerdutyIntegrationKey', 'segmentWriteKey', 'mixpanelToken', 'statusPageUrl']
      .map((key) => normalizedSettings.integrations[key])
      .filter((value) => value && `${value}`.trim().length > 0).length;
    return [
      {
        label: 'Trusted domains',
        value: domainCount,
        description: domainCount === 0 ? 'No domain restrictions' : `${domainCount} domains enforced`,
        icon: ShieldCheckIcon,
      },
      {
        label: 'IP allowlist entries',
        value: ipCount,
        description: ipCount === 0 ? 'Open access' : `${ipCount} CIDR ranges`,
        icon: ShieldCheckIcon,
      },
      {
        label: 'Broadcast channels',
        value: channelCount,
        description: channelCount === 0 ? 'Default email only' : `${channelCount} channels configured`,
        icon: BellAlertIcon,
      },
      {
        label: 'Active integrations',
        value: integrationCount,
        description: integrationCount === 0 ? 'No external systems' : `${integrationCount} systems connected`,
        icon: SparklesIcon,
      },
    ];
  }, [normalizedSettings]);

  const loadSettings = useCallback(async () => {
    setError(null);
    setStatus('');
    setLoading(true);
    try {
      const response = await fetchSystemSettings();
      setSettings(response);
      setDraft(cloneDeep(response));
      setDirty(false);
      setLastSyncedAt(response?.updatedAt ?? new Date().toISOString());
      setDomainInput('');
      setIpInput('');
      setChannelInput('');
    } catch (err) {
      setError(err?.message || 'Unable to load system settings.');
      setSettings(null);
      setDraft(null);
      setDirty(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await loadSettings();
      } catch (err) {
        if (!active) return;
        setError(err?.message || 'Unable to load system settings.');
      }
    })();
    return () => {
      active = false;
    };
  }, [loadSettings]);

  useEffect(() => {
    if (!downloadState && !importError) {
      return undefined;
    }
    const timeout = setTimeout(() => {
      if (downloadState) {
        setDownloadState('');
      }
      if (importError) {
        setImportError('');
      }
    }, 3500);
    return () => clearTimeout(timeout);
  }, [downloadState, importError]);

  const updateDraft = useCallback(
    (path, value) => {
      setDraft((current) => {
        const baseline = cloneDeep(current ?? settings ?? EMPTY_SETTINGS);
        const next = setNestedValue(baseline, path, value);
        setDirty(true);
        setStatus('');
        return next;
      });
    },
    [settings],
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const response = await fetchSystemSettings();
      setSettings(response);
      setDraft(cloneDeep(response));
      setDirty(false);
      setStatus('Settings re-synchronised.');
      setLastSyncedAt(response?.updatedAt ?? new Date().toISOString());
      setDomainInput('');
      setIpInput('');
      setChannelInput('');
      setError(null);
    } catch (err) {
      setError(err?.message || 'Failed to refresh system settings.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleReset = () => {
    if (!settings) {
      setDraft(null);
      setDirty(false);
      setStatus('');
      return;
    }
    setDraft(cloneDeep(settings));
    setDirty(false);
    setStatus('Changes discarded.');
    setDomainInput('');
    setIpInput('');
    setChannelInput('');
  };

  const handleSave = async () => {
    if (!draft || saving) {
      return;
    }
    setSaving(true);
    setStatus('');
    setError(null);
    try {
      const payload = cloneDeep(draft);
      if (payload) {
        delete payload.updatedAt;
      }
      const response = await updateSystemSettings(payload);
      setSettings(response);
      setDraft(cloneDeep(response));
      setDirty(false);
      setStatus('System settings updated successfully.');
      setLastSyncedAt(response?.updatedAt ?? new Date().toISOString());
    } catch (err) {
      setError(err?.message || 'Failed to update system settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadSettings = () => {
    try {
      const payload = cloneDeep(normalizedSettings);
      if (payload) {
        delete payload.updatedAt;
      }
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      const timestamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19);
      anchor.download = `gigvora-system-settings-${timestamp}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
      setDownloadState('Settings exported to JSON.');
    } catch (err) {
      console.error('Unable to export system settings', err);
      setImportError('Unable to export configuration. Please retry.');
    }
  };

  const handleTriggerImport = () => {
    setImportError('');
    fileInputRef.current?.click();
  };

  const handleImportSettings = (event) => {
    const [file] = event.target.files ?? [];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = reader.result ? reader.result.toString() : '';
        const parsed = JSON.parse(text);
        const normalized = normalizeSettings(parsed);
        setDraft(normalized);
        setDirty(true);
        setStatus('Imported configuration – review and save to apply.');
        setImportError('');
      } catch (err) {
        console.error('Invalid system settings file', err);
        setImportError('Uploaded file is not valid JSON.');
      } finally {
        event.target.value = '';
      }
    };
    reader.onerror = () => {
      setImportError('Failed to read configuration file.');
      event.target.value = '';
    };
    reader.readAsText(file);
  };

  const disableInputs = loading || saving;

  const handleAddDomain = () => {
    const value = domainInput.trim().toLowerCase();
    if (!value) {
      return;
    }
    const domains = normalizedSettings.general.allowedDomains;
    if (domains.includes(value)) {
      setDomainInput('');
      return;
    }
    updateDraft(['general', 'allowedDomains'], [...domains, value]);
    setDomainInput('');
  };

  const handleRemoveDomain = (domain) => {
    const domains = normalizedSettings.general.allowedDomains.filter((item) => item !== domain);
    updateDraft(['general', 'allowedDomains'], domains);
  };

  const handleAddIpRange = () => {
    const value = ipInput.trim();
    if (!value) {
      return;
    }
    const ranges = normalizedSettings.security.allowedIpRanges;
    if (ranges.includes(value)) {
      setIpInput('');
      return;
    }
    updateDraft(['security', 'allowedIpRanges'], [...ranges, value]);
    setIpInput('');
  };

  const handleRemoveIpRange = (range) => {
    const ranges = normalizedSettings.security.allowedIpRanges.filter((item) => item !== range);
    updateDraft(['security', 'allowedIpRanges'], ranges);
  };

  const handleAddChannel = () => {
    const value = channelInput.trim().toLowerCase();
    if (!value) {
      return;
    }
    const channels = normalizedSettings.notifications.broadcastChannels;
    if (channels.includes(value)) {
      setChannelInput('');
      return;
    }
    updateDraft(['notifications', 'broadcastChannels'], [...channels, value]);
    setChannelInput('');
  };

  const handleRemoveChannel = (channel) => {
    const channels = normalizedSettings.notifications.broadcastChannels.filter((item) => item !== channel);
    updateDraft(['notifications', 'broadcastChannels'], channels);
  };

  const handleMaintenanceWindowChange = (index, field) => (event) => {
    const value = event.target.value;
    setDraft((current) => {
      const baseline = cloneDeep(current ?? settings ?? EMPTY_SETTINGS);
      const existing = Array.isArray(baseline.maintenance?.upcomingWindows)
        ? [...baseline.maintenance.upcomingWindows]
        : [];
      if (!existing[index]) {
        existing[index] = {
          id: generateIdentifier('maintenance'),
          title: '',
          startAt: '',
          endAt: '',
          impact: '',
          description: '',
        };
      }
      const entry = { ...existing[index] };
      if (field === 'startAt' || field === 'endAt') {
        entry[field] = fromDateTimeInputValue(value);
      } else {
        entry[field] = value;
      }
      existing[index] = entry;
      baseline.maintenance = {
        ...(baseline.maintenance ?? {}),
        upcomingWindows: existing,
      };
      setDirty(true);
      setStatus('');
      return baseline;
    });
  };

  const handleRemoveMaintenanceWindow = (id) => () => {
    const windows = normalizedSettings.maintenance.upcomingWindows.filter((window) => window.id !== id);
    updateDraft(['maintenance', 'upcomingWindows'], windows);
  };

  const handleAddMaintenanceWindow = () => {
    const now = new Date();
    const start = new Date(now.getTime() + 60 * 60 * 1000);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const windows = [
      ...normalizedSettings.maintenance.upcomingWindows,
      {
        id: generateIdentifier('maintenance'),
        title: 'Scheduled maintenance',
        startAt: start.toISOString(),
        endAt: end.toISOString(),
        impact: 'Read-only mode',
        description: '',
      },
    ];
    updateDraft(['maintenance', 'upcomingWindows'], windows);
  };

  const maintenanceWindows = normalizedSettings.maintenance.upcomingWindows;
  const actionDisabled = loading || saving || refreshing;
  const showLoader = loading && !draft;
  const pageTitle = 'System settings';
  const pageSubtitle = 'Govern platform defaults, security posture, and operational runbooks.';
  const content = showLoader ? (
    <div className="rounded-3xl border border-dashed border-slate-200 bg-white/60 p-10 text-center text-sm text-slate-500">
      Synchronising secure configuration…
    </div>
  ) : (
    <div className="space-y-10">
      <section
        id="system-actions"
        className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-blue-100/40 sm:p-8"
      >
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">System control plane</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">
              Administer identity enforcement, notification pipelines, storage boundaries, and maintenance orchestration from a
              hardened console.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-wide">
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-600">
                {saving
                  ? 'Saving changes…'
                  : refreshing
                  ? 'Refreshing…'
                  : lastSyncedAt
                  ? `Last synced ${formatRelativeTime(lastSyncedAt)}`
                  : 'Awaiting sync'}
              </span>
              {dirty ? (
                <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-700">
                  Unsaved changes
                </span>
              ) : null}
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleDownloadSettings}
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={loading}
              >
                <ArrowDownTrayIcon className="mr-2 h-4 w-4" /> Export JSON
              </button>
              <button
                type="button"
                onClick={handleTriggerImport}
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={loading}
              >
                <ArrowUpTrayIcon className="mr-2 h-4 w-4" /> Import JSON
              </button>
            </div>
            <div className="flex flex-wrap gap-2 sm:ml-2">
              <button
                type="button"
                onClick={handleRefresh}
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={actionDisabled}
              >
                <ArrowPathIcon className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Re-sync data
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={actionDisabled || !dirty}
              >
                Discard draft
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark disabled:cursor-not-allowed disabled:bg-accent/60"
                disabled={actionDisabled || !dirty}
              >
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={handleImportSettings}
          />
        </div>
        {error ? (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
        ) : null}
        {importError ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{importError}</div>
        ) : null}
        {status ? (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{status}</div>
        ) : null}
        {downloadState ? (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {downloadState}
          </div>
        ) : null}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 shadow-sm"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{card.label}</p>
                  <p className="text-lg font-semibold text-slate-900">{card.value}</p>
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">{card.description}</p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-[2fr,1fr]">
          <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="aspect-video w-full bg-slate-900/80">
              <iframe
                title="Operational readiness walkthrough"
                src="https://www.youtube.com/embed/6Dh-RL__uN4"
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="space-y-3 px-6 py-5">
              <h3 className="text-lg font-semibold text-slate-900">Operational readiness playbook</h3>
              <p className="text-sm text-slate-600">
                Walk through the incident response choreography used by Gigvora’s command centre, including alert fan-out,
                runbook automation, and comms templates.
              </p>
              <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">Alerts</span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">On-call</span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">SSO</span>
              </div>
            </div>
          </article>
          <aside className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-200 bg-slate-50/80 p-5 shadow-inner">
            <div>
              <h4 className="text-sm font-semibold text-slate-900">Escalation roster</h4>
              <p className="mt-2 text-xs text-slate-500">
                Rotate these leaders into the hot seat for severity-1 incidents. Update the roster monthly and pair with the on-call
                Slack channel.
              </p>
            </div>
            <ul className="space-y-3 text-sm text-slate-700">
              <li className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                <span>Platform operations</span>
                <span className="text-xs font-semibold uppercase text-emerald-600">Primary</span>
              </li>
              <li className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                <span>Security engineering</span>
                <span className="text-xs font-semibold uppercase text-blue-600">Secondary</span>
              </li>
              <li className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                <span>Communications</span>
                <span className="text-xs font-semibold uppercase text-amber-600">Comms</span>
              </li>
            </ul>
          </aside>
        </div>
      </section>
      <section id="system-general" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-slate-900">General workspace profile</h2>
          <p className="text-sm text-slate-600">
            Update the metadata exposed across marketing surfaces, transactional emails, and the trust centre.
          </p>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            <span className="font-semibold text-slate-800">App name</span>
            <input
              type="text"
              value={normalizedSettings.general.appName}
              onChange={(event) => updateDraft(['general', 'appName'], event.target.value)}
              disabled={disableInputs}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            <span className="font-semibold text-slate-800">Company name</span>
            <input
              type="text"
              value={normalizedSettings.general.companyName}
              onChange={(event) => updateDraft(['general', 'companyName'], event.target.value)}
              disabled={disableInputs}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            <span className="font-semibold text-slate-800">Support email</span>
            <input
              type="email"
              value={normalizedSettings.general.supportEmail}
              onChange={(event) => updateDraft(['general', 'supportEmail'], event.target.value)}
              disabled={disableInputs}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            <span className="font-semibold text-slate-800">Support phone</span>
            <input
              type="tel"
              value={normalizedSettings.general.supportPhone}
              onChange={(event) => updateDraft(['general', 'supportPhone'], event.target.value)}
              disabled={disableInputs}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            <span className="font-semibold text-slate-800">Legal entity</span>
            <input
              type="text"
              value={normalizedSettings.general.legalEntity}
              onChange={(event) => updateDraft(['general', 'legalEntity'], event.target.value)}
              disabled={disableInputs}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            <span className="font-semibold text-slate-800">Primary timezone</span>
            <input
              type="text"
              value={normalizedSettings.general.timezone}
              onChange={(event) => updateDraft(['general', 'timezone'], event.target.value)}
              disabled={disableInputs}
              placeholder="UTC"
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            <span className="font-semibold text-slate-800">Default locale</span>
            <input
              type="text"
              value={normalizedSettings.general.defaultLocale}
              onChange={(event) => updateDraft(['general', 'defaultLocale'], event.target.value)}
              disabled={disableInputs}
              placeholder="en-US"
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            <span className="font-semibold text-slate-800">Incident contact</span>
            <input
              type="text"
              value={normalizedSettings.general.incidentContact}
              onChange={(event) => updateDraft(['general', 'incidentContact'], event.target.value)}
              disabled={disableInputs}
              placeholder="ops@gigvora.com"
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-700 sm:col-span-2">
            <span className="font-semibold text-slate-800">Logo URL</span>
            <input
              type="url"
              value={normalizedSettings.general.logoUrl}
              onChange={(event) => updateDraft(['general', 'logoUrl'], event.target.value)}
              disabled={disableInputs}
              placeholder="https://cdn.gigvora.com/assets/logo.svg"
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2"
            />
          </label>
        </div>
        <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Allowed email domains</h3>
              <p className="text-xs text-slate-500">
                Restrict workspace sign-ups and invitations to specific corporate domains.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={domainInput}
                onChange={(event) => setDomainInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    handleAddDomain();
                  }
                }}
                disabled={disableInputs}
                placeholder="gigvora.com"
                className="w-40 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={handleAddDomain}
                className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={disableInputs || !domainInput.trim()}
              >
                <PlusIcon className="mr-1 h-4 w-4" /> Add
              </button>
            </div>
          </div>
          {normalizedSettings.general.allowedDomains.length ? (
            <ul className="mt-4 flex flex-wrap gap-2">
              {normalizedSettings.general.allowedDomains.map((domain) => (
                <li
                  key={domain}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm"
                >
                  <span>{domain}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveDomain(domain)}
                    className="text-slate-400 transition hover:text-rose-500"
                    aria-label={`Remove domain ${domain}`}
                    disabled={disableInputs}
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-xs text-slate-500">No domain restrictions configured.</p>
          )}
        </div>
      </section>
      <section id="system-security" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-slate-900">Security & access controls</h2>
          <p className="text-sm text-slate-600">
            Harden authentication requirements, govern session duration, and enforce admin SSO.
          </p>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="flex items-center justify-between gap-4 rounded-3xl border border-white bg-slate-50 px-4 py-3 shadow-sm">
            <span className="text-sm font-semibold text-slate-800">Require two-factor authentication</span>
            <input
              type="checkbox"
              className="h-5 w-5 rounded border-slate-300 text-accent focus:ring-accent"
              checked={Boolean(normalizedSettings.security.requireTwoFactor)}
              onChange={(event) => updateDraft(['security', 'requireTwoFactor'], event.target.checked)}
              disabled={disableInputs}
            />
          </label>
          <label className="flex items-center justify-between gap-4 rounded-3xl border border-white bg-slate-50 px-4 py-3 shadow-sm">
            <span className="text-sm font-semibold text-slate-800">Require symbols in passwords</span>
            <input
              type="checkbox"
              className="h-5 w-5 rounded border-slate-300 text-accent focus:ring-accent"
              checked={Boolean(normalizedSettings.security.passwordRequireSymbols)}
              onChange={(event) => updateDraft(['security', 'passwordRequireSymbols'], event.target.checked)}
              disabled={disableInputs}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            <span className="font-semibold text-slate-800">Password minimum length</span>
            <input
              type="number"
              min="6"
              max="128"
              value={normalizedSettings.security.passwordMinimumLength ?? ''}
              onChange={(event) =>
                updateDraft(
                  ['security', 'passwordMinimumLength'],
                  event.target.value === '' ? '' : Number(event.target.value),
                )
              }
              disabled={disableInputs}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            <span className="font-semibold text-slate-800">Password rotation (days)</span>
            <input
              type="number"
              min="0"
              max="365"
              value={normalizedSettings.security.passwordRotationDays ?? ''}
              onChange={(event) =>
                updateDraft(['security', 'passwordRotationDays'], event.target.value === '' ? '' : Number(event.target.value))
              }
              disabled={disableInputs}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            <span className="font-semibold text-slate-800">Session timeout (minutes)</span>
            <input
              type="number"
              min="5"
              max="1440"
              value={normalizedSettings.security.sessionTimeoutMinutes ?? ''}
              onChange={(event) =>
                updateDraft(['security', 'sessionTimeoutMinutes'], event.target.value === '' ? '' : Number(event.target.value))
              }
              disabled={disableInputs}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            <span className="font-semibold text-slate-800">Audit log retention (days)</span>
            <input
              type="number"
              min="30"
              max="3650"
              value={normalizedSettings.security.auditLogRetentionDays ?? ''}
              onChange={(event) =>
                updateDraft(['security', 'auditLogRetentionDays'], event.target.value === '' ? '' : Number(event.target.value))
              }
              disabled={disableInputs}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2"
            />
          </label>
        </div>
        <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">IP allowlist</h3>
              <p className="text-xs text-slate-500">Optional CIDR ranges for admin dashboards.</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={ipInput}
                onChange={(event) => setIpInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    handleAddIpRange();
                  }
                }}
                disabled={disableInputs}
                placeholder="203.0.113.0/24"
                className="w-48 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={handleAddIpRange}
                className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={disableInputs || !ipInput.trim()}
              >
                <PlusIcon className="mr-1 h-4 w-4" /> Add
              </button>
            </div>
          </div>
          {normalizedSettings.security.allowedIpRanges.length ? (
            <ul className="mt-4 flex flex-wrap gap-2">
              {normalizedSettings.security.allowedIpRanges.map((range) => (
                <li
                  key={range}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm"
                >
                  <span>{range}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveIpRange(range)}
                    className="text-slate-400 transition hover:text-rose-500"
                    aria-label={`Remove range ${range}`}
                    disabled={disableInputs}
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-xs text-slate-500">No IP restrictions configured.</p>
          )}
        </div>
        <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
          <h3 className="text-sm font-semibold text-slate-900">Single Sign-On</h3>
          <p className="text-xs text-slate-500">Configure SAML or OIDC details for admin accounts.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="flex items-center justify-between gap-4 rounded-3xl border border-white bg-white px-4 py-3 shadow-sm">
              <span className="text-sm font-semibold text-slate-800">Enable SSO for admins</span>
              <input
                type="checkbox"
                className="h-5 w-5 rounded border-slate-300 text-accent focus:ring-accent"
                checked={Boolean(normalizedSettings.security.sso.enabled)}
                onChange={(event) => updateDraft(['security', 'sso', 'enabled'], event.target.checked)}
                disabled={disableInputs}
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-700">
              <span className="font-semibold text-slate-800">Provider</span>
              <input
                type="text"
                value={normalizedSettings.security.sso.provider}
                onChange={(event) => updateDraft(['security', 'sso', 'provider'], event.target.value)}
                disabled={disableInputs}
                placeholder="okta"
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-700">
              <span className="font-semibold text-slate-800">Entity ID</span>
              <input
                type="text"
                value={normalizedSettings.security.sso.entityId}
                onChange={(event) => updateDraft(['security', 'sso', 'entityId'], event.target.value)}
                disabled={disableInputs}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-700">
              <span className="font-semibold text-slate-800">SSO entry point</span>
              <input
                type="url"
                value={normalizedSettings.security.sso.entryPoint}
                onChange={(event) => updateDraft(['security', 'sso', 'entryPoint'], event.target.value)}
                disabled={disableInputs}
                placeholder="https://company.okta.com/app/..."
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-700 sm:col-span-2">
              <span className="font-semibold text-slate-800">X.509 certificate</span>
              <textarea
                rows={3}
                value={normalizedSettings.security.sso.certificate}
                onChange={(event) => updateDraft(['security', 'sso', 'certificate'], event.target.value)}
                disabled={disableInputs}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2"
                placeholder="-----BEGIN CERTIFICATE-----"
              />
            </label>
          </div>
        </div>
      </section>
      <section id="system-notifications" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-slate-900">Notification delivery</h2>
          <p className="text-sm text-slate-600">
            Control transactional email defaults, SMS routing, and incident broadcast channels.
          </p>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            <span className="font-semibold text-slate-800">Email provider</span>
            <select
              value={normalizedSettings.notifications.emailProvider}
              onChange={(event) => updateDraft(['notifications', 'emailProvider'], event.target.value)}
              disabled={disableInputs}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2"
            >
              <option value="resend">Resend</option>
              <option value="sendgrid">SendGrid</option>
              <option value="postmark">Postmark</option>
              <option value="ses">Amazon SES</option>
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            <span className="font-semibold text-slate-800">Email from name</span>
            <input
              type="text"
              value={normalizedSettings.notifications.emailFromName}
              onChange={(event) => updateDraft(['notifications', 'emailFromName'], event.target.value)}
              disabled={disableInputs}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            <span className="font-semibold text-slate-800">Email from address</span>
            <input
              type="email"
              value={normalizedSettings.notifications.emailFromAddress}
              onChange={(event) => updateDraft(['notifications', 'emailFromAddress'], event.target.value)}
              disabled={disableInputs}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            <span className="font-semibold text-slate-800">SMS provider</span>
            <select
              value={normalizedSettings.notifications.smsProvider}
              onChange={(event) => updateDraft(['notifications', 'smsProvider'], event.target.value)}
              disabled={disableInputs}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2"
            >
              <option value="twilio">Twilio</option>
              <option value="messagebird">MessageBird</option>
              <option value="nexmo">Vonage</option>
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            <span className="font-semibold text-slate-800">SMS from number</span>
            <input
              type="text"
              value={normalizedSettings.notifications.smsFromNumber}
              onChange={(event) => updateDraft(['notifications', 'smsFromNumber'], event.target.value)}
              disabled={disableInputs}
              placeholder="+1 415-555-0100"
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            <span className="font-semibold text-slate-800">Incident webhook URL</span>
            <input
              type="url"
              value={normalizedSettings.notifications.incidentWebhookUrl}
              onChange={(event) => updateDraft(['notifications', 'incidentWebhookUrl'], event.target.value)}
              disabled={disableInputs}
              placeholder="https://hooks.slack.com/..."
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2"
            />
          </label>
        </div>
        <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Broadcast channels</h3>
              <p className="text-xs text-slate-500">List the channels that receive maintenance and incident alerts.</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={channelInput}
                onChange={(event) => setChannelInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    handleAddChannel();
                  }
                }}
                disabled={disableInputs}
                placeholder="email"
                className="w-36 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={handleAddChannel}
                className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={disableInputs || !channelInput.trim()}
              >
                <PlusIcon className="mr-1 h-4 w-4" /> Add
              </button>
            </div>
          </div>
          {normalizedSettings.notifications.broadcastChannels.length ? (
            <ul className="mt-4 flex flex-wrap gap-2">
              {normalizedSettings.notifications.broadcastChannels.map((channel) => (
                <li
                  key={channel}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm"
                >
                  <span>{channel}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveChannel(channel)}
                    className="text-slate-400 transition hover:text-rose-500"
                    aria-label={`Remove channel ${channel}`}
                    disabled={disableInputs}
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-xs text-slate-500">Alerts currently broadcast via email only.</p>
          )}
        </div>
      </section>
      <section id="system-storage" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-slate-900">Storage & data retention</h2>
          <p className="text-sm text-slate-600">
            Configure the object store, CDN boundary, and retention guardrails for off-platform backups.
          </p>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            <span className="font-semibold text-slate-800">Storage provider</span>
            <select
              value={normalizedSettings.storage.provider}
              onChange={(event) => updateDraft(['storage', 'provider'], event.target.value)}
              disabled={disableInputs}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2"
            >
              <option value="cloudflare_r2">Cloudflare R2</option>
              <option value="aws_s3">Amazon S3</option>
              <option value="gcs">Google Cloud Storage</option>
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            <span className="font-semibold text-slate-800">Bucket</span>
            <input
              type="text"
              value={normalizedSettings.storage.bucket}
              onChange={(event) => updateDraft(['storage', 'bucket'], event.target.value)}
              disabled={disableInputs}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            <span className="font-semibold text-slate-800">Region</span>
            <input
              type="text"
              value={normalizedSettings.storage.region}
              onChange={(event) => updateDraft(['storage', 'region'], event.target.value)}
              disabled={disableInputs}
              placeholder="auto"
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            <span className="font-semibold text-slate-800">Asset CDN URL</span>
            <input
              type="url"
              value={normalizedSettings.storage.assetCdnUrl}
              onChange={(event) => updateDraft(['storage', 'assetCdnUrl'], event.target.value)}
              disabled={disableInputs}
              placeholder="https://cdn.gigvora.com"
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            <span className="font-semibold text-slate-800">Asset size limit (MB)</span>
            <input
              type="number"
              min="1"
              max="2048"
              value={normalizedSettings.storage.assetMaxSizeMb ?? ''}
              onChange={(event) =>
                updateDraft(['storage', 'assetMaxSizeMb'], event.target.value === '' ? '' : Number(event.target.value))
              }
              disabled={disableInputs}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            <span className="font-semibold text-slate-800">Backup retention (days)</span>
            <input
              type="number"
              min="7"
              max="3650"
              value={normalizedSettings.storage.backupRetentionDays ?? ''}
              onChange={(event) =>
                updateDraft(['storage', 'backupRetentionDays'], event.target.value === '' ? '' : Number(event.target.value))
              }
              disabled={disableInputs}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-700 sm:col-span-2">
            <span className="font-semibold text-slate-800">Encryption key alias</span>
            <input
              type="text"
              value={normalizedSettings.storage.encryptionKeyAlias}
              onChange={(event) => updateDraft(['storage', 'encryptionKeyAlias'], event.target.value)}
              disabled={disableInputs}
              placeholder="kms/gigvora/platform"
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2"
            />
          </label>
        </div>
      </section>
      <section id="system-integrations" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-slate-900">Operational integrations</h2>
          <p className="text-sm text-slate-600">
            Wire up incident escalation, analytics telemetry, and status page destinations.
          </p>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            <span className="font-semibold text-slate-800">Slack webhook</span>
            <input
              type="url"
              value={normalizedSettings.integrations.slackWebhookUrl}
              onChange={(event) => updateDraft(['integrations', 'slackWebhookUrl'], event.target.value)}
              disabled={disableInputs}
              placeholder="https://hooks.slack.com/..."
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            <span className="font-semibold text-slate-800">PagerDuty integration key</span>
            <input
              type="text"
              value={normalizedSettings.integrations.pagerdutyIntegrationKey}
              onChange={(event) => updateDraft(['integrations', 'pagerdutyIntegrationKey'], event.target.value)}
              disabled={disableInputs}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            <span className="font-semibold text-slate-800">Segment write key</span>
            <input
              type="text"
              value={normalizedSettings.integrations.segmentWriteKey}
              onChange={(event) => updateDraft(['integrations', 'segmentWriteKey'], event.target.value)}
              disabled={disableInputs}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            <span className="font-semibold text-slate-800">Mixpanel token</span>
            <input
              type="text"
              value={normalizedSettings.integrations.mixpanelToken}
              onChange={(event) => updateDraft(['integrations', 'mixpanelToken'], event.target.value)}
              disabled={disableInputs}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-700 sm:col-span-2">
            <span className="font-semibold text-slate-800">Status page URL</span>
            <input
              type="url"
              value={normalizedSettings.integrations.statusPageUrl}
              onChange={(event) => updateDraft(['integrations', 'statusPageUrl'], event.target.value)}
              disabled={disableInputs}
              placeholder="https://status.gigvora.com"
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2"
            />
          </label>
        </div>
      </section>
      <section id="system-maintenance" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-slate-900">Maintenance orchestration</h2>
          <p className="text-sm text-slate-600">
            Coordinate maintenance windows, automate notifications, and direct customers to the right status feed.
          </p>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="flex items-center justify-between gap-4 rounded-3xl border border-white bg-slate-50 px-4 py-3 shadow-sm">
            <span className="text-sm font-semibold text-slate-800">Auto-broadcast upcoming maintenance</span>
            <input
              type="checkbox"
              className="h-5 w-5 rounded border-slate-300 text-accent focus:ring-accent"
              checked={Boolean(normalizedSettings.maintenance.autoBroadcast)}
              onChange={(event) => updateDraft(['maintenance', 'autoBroadcast'], event.target.checked)}
              disabled={disableInputs}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            <span className="font-semibold text-slate-800">Public status page</span>
            <input
              type="url"
              value={normalizedSettings.maintenance.statusPageUrl}
              onChange={(event) => updateDraft(['maintenance', 'statusPageUrl'], event.target.value)}
              disabled={disableInputs}
              placeholder="https://status.gigvora.com"
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-700 sm:col-span-2">
            <span className="font-semibold text-slate-800">Support channel</span>
            <input
              type="text"
              value={normalizedSettings.maintenance.supportChannel}
              onChange={(event) => updateDraft(['maintenance', 'supportChannel'], event.target.value)}
              disabled={disableInputs}
              placeholder="ops@gigvora.com"
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2"
            />
          </label>
        </div>
        <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Upcoming maintenance windows</h3>
              <p className="text-xs text-slate-500">Track impact, timing, and customer messaging for each window.</p>
            </div>
            <button
              type="button"
              onClick={handleAddMaintenanceWindow}
              className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={disableInputs}
            >
              <PlusIcon className="mr-1 h-4 w-4" /> Add window
            </button>
          </div>
          {maintenanceWindows.length ? (
            <div className="mt-4 space-y-4">
              {maintenanceWindows.map((window, index) => (
                <div key={window.id ?? index} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1 space-y-4">
                      <label className="flex flex-col gap-2 text-sm text-slate-700">
                        <span className="font-semibold text-slate-800">Title</span>
                        <input
                          type="text"
                          value={window.title ?? ''}
                          onChange={handleMaintenanceWindowChange(index, 'title')}
                          disabled={disableInputs}
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-2"
                        />
                      </label>
                      <label className="flex flex-col gap-2 text-sm text-slate-700">
                        <span className="font-semibold text-slate-800">Impact</span>
                        <input
                          type="text"
                          value={window.impact ?? ''}
                          onChange={handleMaintenanceWindowChange(index, 'impact')}
                          disabled={disableInputs}
                          placeholder="Read-only mode"
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-2"
                        />
                      </label>
                      <label className="flex flex-col gap-2 text-sm text-slate-700">
                        <span className="font-semibold text-slate-800">Description</span>
                        <textarea
                          rows={2}
                          value={window.description ?? ''}
                          onChange={handleMaintenanceWindowChange(index, 'description')}
                          disabled={disableInputs}
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-2"
                          placeholder="Detail customer messaging, contact, and rollback plan."
                        />
                      </label>
                    </div>
                    <div className="flex w-full flex-col gap-4 sm:w-64">
                      <label className="flex flex-col gap-2 text-sm text-slate-700">
                        <span className="font-semibold text-slate-800">Start</span>
                        <input
                          type="datetime-local"
                          value={toDateTimeInputValue(window.startAt)}
                          onChange={handleMaintenanceWindowChange(index, 'startAt')}
                          disabled={disableInputs}
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-2"
                        />
                      </label>
                      <label className="flex flex-col gap-2 text-sm text-slate-700">
                        <span className="font-semibold text-slate-800">End</span>
                        <input
                          type="datetime-local"
                          value={toDateTimeInputValue(window.endAt)}
                          onChange={handleMaintenanceWindowChange(index, 'endAt')}
                          disabled={disableInputs}
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-2"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={handleRemoveMaintenanceWindow(window.id)}
                        className="inline-flex items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={disableInputs}
                      >
                        <TrashIcon className="mr-1 h-4 w-4" /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-xs text-slate-500">No maintenance windows scheduled.</p>
          )}
        </div>
      </section>
    </div>
  );
  return (
    <DashboardLayout
      currentDashboard="admin"
      title={pageTitle}
      subtitle="Operational configuration"
      description={pageSubtitle}
      menuSections={MENU_SECTIONS}
      sections={[]}
      availableDashboards={['admin', 'user', 'freelancer', 'company', 'agency', 'headhunter']}
      profile={profile}
      activeMenuItem="system-actions"
    >
      {content}
    </DashboardLayout>
  );
}
