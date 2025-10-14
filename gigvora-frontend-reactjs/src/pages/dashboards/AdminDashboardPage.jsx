import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowPathIcon, CurrencyDollarIcon, LifebuoyIcon, ShieldCheckIcon, UsersIcon } from '@heroicons/react/24/outline';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import AdCouponManager from '../../components/admin/AdCouponManager.jsx';
import GigvoraAdsConsole from '../../components/ads/GigvoraAdsConsole.jsx';
import AdminGroupManagementPanel from './admin/AdminGroupManagementPanel.jsx';
import useSession from '../../hooks/useSession.js';
import { fetchAdminDashboard } from '../../services/admin.js';
import { fetchPlatformSettings, updatePlatformSettings } from '../../services/platformSettings.js';

const MENU_SECTIONS = [
  {
    label: 'Command modules',
    items: [
      {
        name: 'Member health',
        description: 'Growth, activation, and readiness scores across the Gigvora network.',
        tags: ['growth', 'activation'],
      },
      {
        name: 'Financial governance',
        description: 'Escrow flows, fee capture, and treasury risk posture.',
        tags: ['finance'],
      },
      {
        name: 'Risk & trust',
        description: 'Dispute lifecycle, escalations, and marketplace safety monitoring.',
        tags: ['compliance'],
      },
      {
        name: 'Support operations',
        description: 'Service desk load, SLAs, and sentiment guardrails.',
      },
      {
        name: 'Engagement & comms',
        description: 'Platform analytics, event telemetry, and notification delivery.',
      },
      {
        name: 'Gigvora Ads',
        description: 'Campaign coverage, targeting telemetry, and creative governance.',
        tags: ['ads', 'monetisation'],
        sectionId: 'gigvora-ads',
      },
      {
        name: 'Launchpad performance',
        description: 'Talent placements, interview runway, and employer demand.',
      },
    ],
  },
  {
    label: 'Quick tools',
    items: [
      {
        name: 'Data exports',
        description: 'Pull CSV snapshots or schedule secure S3 drops.',
        tags: ['csv', 'api'],
      },
      {
        name: 'Incident response',
        description: 'Runbooks for security, privacy, and marketplace outages.',
      },
      {
        name: 'Audit center',
        description: 'Trace admin actions, approvals, and configuration changes.',
      },
    ],
  },
  {
    label: 'Configuration stack',
    items: [
      {
        name: 'All platform settings',
        description: 'Govern application defaults, commission policies, and feature gates.',
        tags: ['settings'],
        sectionId: 'admin-settings-overview',
      },
      {
        name: 'CMS controls',
        description: 'Editorial workflow, restricted features, and monetisation toggles.',
        sectionId: 'admin-settings-cms',
      },
      {
        name: 'Environment & secrets',
        description: 'Runtime environment, storage credentials, and database endpoints.',
        sectionId: 'admin-settings-environment',
        tags: ['ops'],
      },
      {
        name: 'API & notifications',
        description: 'REST endpoints, payment gateways, and outbound email security.',
        sectionId: 'admin-settings-api',
        tags: ['api'],
      },
    ],
  },
];

const USER_TYPE_LABELS = {
  user: 'Members',
  company: 'Companies',
  freelancer: 'Freelancers',
  agency: 'Agencies',
  admin: 'Admins',
};

const numberFormatter = new Intl.NumberFormat('en-US');

const ADMIN_ACCESS_ALIASES = new Set(['admin', 'administrator', 'super-admin', 'superadmin']);

function formatNumber(value) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) {
    return '0';
  }
  return numberFormatter.format(Math.round(numeric));
}

function formatCurrency(value, currency = 'USD') {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(0);
  }
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: numeric >= 1000 ? 0 : 2,
  });
  return formatter.format(numeric);
}

function formatPercent(value, fractionDigits = 1) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) {
    return '0%';
  }
  return `${numeric.toFixed(fractionDigits)}%`;
}

function formatDurationMinutes(minutes) {
  const numeric = Number(minutes ?? 0);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return '—';
  }
  if (numeric >= 1440) {
    return `${(numeric / 1440).toFixed(1)} days`;
  }
  if (numeric >= 60) {
    return `${(numeric / 60).toFixed(1)} hrs`;
  }
  return `${numeric.toFixed(0)} mins`;
}

function humanizeLabel(value) {
  if (!value) return '—';
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatRelativeTime(value) {
  if (!value) {
    return 'moments ago';
  }
  const timestamp = new Date(value);
  const diffMs = Date.now() - timestamp.getTime();
  const diffMinutes = Math.round(diffMs / (1000 * 60));
  if (diffMinutes < 1) {
    return 'moments ago';
  }
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }
  return timestamp.toLocaleDateString();
}

function calculatePercentages(dictionary = {}) {
  const entries = Object.entries(dictionary);
  const total = entries.reduce((sum, [, value]) => sum + Number(value ?? 0), 0);
  return entries.map(([key, value]) => {
    const numeric = Number(value ?? 0);
    const percent = total > 0 ? Math.round((numeric / total) * 100) : 0;
    return { key, value: numeric, percent, label: humanizeLabel(key) };
  });
}

function normalizeToLowercaseArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (typeof item !== 'string') {
        return null;
      }
      const trimmed = item.trim();
      return trimmed ? trimmed.toLowerCase() : null;
    })
    .filter(Boolean);
}

function normalizeToLowercaseString(value) {
  if (value == null) {
    return '';
  }

  return `${value}`.trim().toLowerCase();
}

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

function getNestedValue(source, path, fallback = '') {
  if (!Array.isArray(path) || path.length === 0) {
    return fallback;
  }
  const result = path.reduce((accumulator, key) => {
    if (accumulator == null) {
      return undefined;
    }
    return accumulator[key];
  }, source);
  return result ?? fallback;
}

function setNestedValue(source, path, value) {
  if (!Array.isArray(path) || path.length === 0) {
    return value;
  }
  const [head, ...rest] = path;
  const current = source && typeof source === 'object' ? source : {};
  const clone = Array.isArray(current) ? [...current] : { ...current };
  clone[head] = rest.length ? setNestedValue(current?.[head], rest, value) : value;
  return clone;
}

function maskSecret(value) {
  if (!value) {
    return '—';
  }
  const stringValue = String(value);
  if (stringValue.length <= 4) {
    return '•'.repeat(stringValue.length);
  }
  return `${'•'.repeat(stringValue.length - 4)}${stringValue.slice(-4)}`;
}

function buildSettingsOverview(settings = {}) {
  const app = settings?.app ?? {};
  const commissions = settings?.commissions ?? {};
  const featureToggles = settings?.featureToggles ?? {};
  const subscriptions = settings?.subscriptions ?? {};
  const payments = settings?.payments ?? {};
  const stripe = payments?.stripe ?? {};
  const escrow = payments?.escrow_com ?? {};
  const smtp = settings?.smtp ?? {};
  const storage = settings?.storage ?? {};
  const storageR2 = storage?.cloudflare_r2 ?? {};
  const database = settings?.database ?? {};

  const toggleValues = Object.values(featureToggles);
  const activeToggleCount = toggleValues.filter(Boolean).length;
  const totalToggleCount = Object.keys(featureToggles).length;

  return {
    overviewMetrics: [
      {
        label: 'Workspace name',
        value: app.name || 'Gigvora',
        caption: app.clientUrl ? `Client URL ${app.clientUrl}` : null,
      },
      {
        label: 'Runtime environment',
        value: (app.environment || 'development').toUpperCase(),
        caption: app.apiUrl ? `API ${app.apiUrl}` : 'API URL not configured',
      },
      {
        label: 'Active feature toggles',
        value: activeToggleCount,
        caption: `${totalToggleCount} total toggles`,
      },
      {
        label: 'Commission policy',
        value: `${commissions.rate ?? 0}% ${commissions.currency ?? 'USD'}`,
        caption: commissions.enabled ? 'Enabled' : 'Disabled',
      },
    ],
    cms: {
      subscriptionsEnabled: Boolean(subscriptions.enabled),
      restrictedFeatures: Array.isArray(subscriptions.restrictedFeatures)
        ? subscriptions.restrictedFeatures
        : [],
      plans: Array.isArray(subscriptions.plans) ? subscriptions.plans : [],
      featureToggles,
      commissions,
    },
    environment: {
      environmentName: app.environment ?? 'development',
      clientUrl: app.clientUrl ?? '',
      appName: app.name ?? '',
      storageProvider: storage.provider ?? 'cloudflare_r2',
      storageBucket: storageR2.bucket ?? '',
      storageEndpoint: storageR2.endpoint ?? '',
      storagePublicBaseUrl: storageR2.publicBaseUrl ?? '',
      databaseHost: database.host ?? '',
      databasePort: database.port ?? '',
      databaseName: database.name ?? '',
      databaseUser: database.username ?? '',
    },
    api: {
      apiUrl: app.apiUrl ?? '',
      paymentProvider: payments.provider ?? 'stripe',
      stripePublishableKey: stripe.publishableKey ?? '',
      stripeWebhookSecret: stripe.webhookSecret ?? '',
      stripeAccountId: stripe.accountId ?? '',
      escrowSandbox: escrow.sandbox ?? true,
      escrowApiKey: escrow.apiKey ?? '',
      escrowApiSecret: escrow.apiSecret ?? '',
      smtpHost: smtp.host ?? '',
      smtpPort: smtp.port ?? '',
      smtpSecure: Boolean(smtp.secure),
      smtpUsername: smtp.username ?? '',
      smtpFromAddress: smtp.fromAddress ?? '',
      smtpFromName: smtp.fromName ?? '',
    },
  };
}

function computeInitials(name, fallback = 'GV') {
  if (!name) return fallback;
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase());
  if (letters.length === 0) {
    return fallback;
  }
  return letters.slice(0, 2).join('').padEnd(2, fallback.charAt(0) || 'G');
}

function AccessNotice({ title, message, onPrimaryAction, primaryLabel, secondaryHref, secondaryLabel }) {
  return (
    <div className="py-20">
      <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-soft">
        <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
        <p className="mt-3 text-sm text-slate-600">{message}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {primaryLabel ? (
            <button
              type="button"
              onClick={onPrimaryAction}
              className="inline-flex items-center justify-center rounded-full bg-accent px-6 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark"
            >
              {primaryLabel}
            </button>
          ) : null}
          {secondaryHref && secondaryLabel ? (
            <a
              href={secondaryHref}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-2 text-sm font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
            >
              {secondaryLabel}
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, caption, delta, icon: Icon }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-blue-100/40">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
          {delta ? <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-blue-600">{delta}</p> : null}
          {caption ? <p className="mt-2 text-xs text-slate-500">{caption}</p> : null}
        </div>
        {Icon ? (
          <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
            <Icon className="h-6 w-6" />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function StatusList({ title, items, emptyLabel = 'No data yet.' }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      <div className="mt-4 space-y-3">
        {items.length ? (
          items.map((item) => (
            <div key={item.key} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{item.label}</span>
                <span className="font-semibold text-slate-900">{formatNumber(item.value)}</span>
              </div>
              <div className="relative h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-blue-500"
                  style={{ width: `${Math.min(item.percent, 100)}%` }}
                />
              </div>
              <p className="text-right text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                {item.percent}% share
              </p>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500">{emptyLabel}</p>
        )}
      </div>
    </div>
  );
}

function RecentList({ title, rows, columns, emptyLabel }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      {rows.length ? (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-600">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-slate-400">
                {columns.map((column) => (
                  <th key={column.key} className="whitespace-nowrap px-3 py-2 font-semibold">
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-t border-slate-100">
                  {columns.map((column) => (
                    <td key={column.key} className="whitespace-nowrap px-3 py-2 text-slate-600">
                      {column.render ? column.render(row[column.key], row) : row[column.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-500">{emptyLabel}</p>
      )}
    </div>
  );
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { session, isAuthenticated } = useSession();
  const normalizedMemberships = useMemo(() => normalizeToLowercaseArray(session?.memberships), [session?.memberships]);
  const normalizedRoles = useMemo(() => normalizeToLowercaseArray(session?.roles), [session?.roles]);
  const normalizedPermissions = useMemo(
    () => normalizeToLowercaseArray(session?.permissions),
    [session?.permissions],
  );
  const normalizedCapabilities = useMemo(
    () => normalizeToLowercaseArray(session?.capabilities),
    [session?.capabilities],
  );
  const sessionRole = useMemo(
    () => normalizeToLowercaseString(session?.role ?? session?.user?.role),
    [session?.role, session?.user?.role],
  );
  const sessionUserType = useMemo(
    () => normalizeToLowercaseString(session?.user?.userType ?? session?.userType),
    [session?.user?.userType, session?.userType],
  );
  const primaryDashboard = useMemo(
    () => normalizeToLowercaseString(session?.primaryDashboard ?? session?.user?.primaryDashboard),
    [session?.primaryDashboard, session?.user?.primaryDashboard],
  );

  const hasAdminSeat = useMemo(() => {
    if (!session) {
      return false;
    }

    const permissionAccess =
      normalizedPermissions.includes('admin:full') || normalizedCapabilities.includes('admin:access');

    return (
      permissionAccess ||
      normalizedMemberships.some((membership) => ADMIN_ACCESS_ALIASES.has(membership)) ||
      normalizedRoles.some((role) => ADMIN_ACCESS_ALIASES.has(role)) ||
      ADMIN_ACCESS_ALIASES.has(sessionRole) ||
      ADMIN_ACCESS_ALIASES.has(sessionUserType)
    );
  }, [
    session,
    normalizedMemberships,
    normalizedRoles,
    normalizedPermissions,
    normalizedCapabilities,
    sessionRole,
    sessionUserType,
  ]);

  const hasAdminAccess = useMemo(() => hasAdminSeat || primaryDashboard === 'admin', [hasAdminSeat, primaryDashboard]);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshIndex, setRefreshIndex] = useState(0);
  const [settings, setSettings] = useState(null);
  const [settingsDraft, setSettingsDraft] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsError, setSettingsError] = useState(null);
  const [settingsDirty, setSettingsDirty] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsStatus, setSettingsStatus] = useState('');
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [restrictedFeaturesInput, setRestrictedFeaturesInput] = useState('');

  const canAccessDashboard = isAuthenticated && hasAdminSeat;

  useEffect(() => {
    if (!canAccessDashboard) {
      setLoading(false);
      setData(null);
      setError(null);
      setSettings(null);
      setSettingsDraft(null);
      setSettingsLoading(false);
      setSettingsError(null);
      setSettingsDirty(false);
      setSettingsSaving(false);
      setSettingsStatus('');
      setLastSavedAt(null);
      return;
    }
    if (!hasAdminAccess) {
      setData(null);
      setSettings(null);
      setSettingsDraft(null);
      setSettingsDirty(false);
      setLoading(false);
      setSettingsLoading(false);
      setError(null);
      setSettingsError(null);
      setSettingsStatus('');
      setLastSavedAt(null);
      return;
    }

    const abortController = new AbortController();
    let isActive = true;

    setLoading(true);
    setSettingsLoading(true);
    setError(null);
    setSettingsError(null);
    setSettingsSaving(false);
    setSettingsStatus('');

    const hydrate = async () => {
      try {
        const [dashboardResult, settingsResult] = await Promise.allSettled([
          fetchAdminDashboard({}, { signal: abortController.signal }),
          fetchPlatformSettings({ signal: abortController.signal }),
        ]);

        if (!isActive) {
          return;
        }

        if (dashboardResult.status === 'fulfilled') {
          setData(dashboardResult.value);
          setError(null);
        } else {
          const reason = dashboardResult.reason;
          if (reason?.name !== 'AbortError') {
            if (reason?.status === 401) {
              setError('Your session has expired. Please sign in again.');
            } else if (reason?.status === 403) {
              setError('Admin access required to view this telemetry.');
            } else {
              const message =
                reason?.message ||
                (reason instanceof Error ? reason.message : 'Unable to load admin telemetry at this time.');
              setError(message);
            }
            setData(null);
          }
        }
        setLoading(false);

        if (settingsResult.status === 'fulfilled') {
          const received = settingsResult.value;
          setSettings(received);
          const draft = cloneDeep(received);
          setSettingsDraft(draft);
          setRestrictedFeaturesInput(
            Array.isArray(received?.subscriptions?.restrictedFeatures)
              ? received.subscriptions.restrictedFeatures.join(', ')
              : '',
          );
          setSettingsDirty(false);
          setLastSavedAt(new Date().toISOString());
        } else {
          const reason = settingsResult.reason;
          if (reason?.name !== 'AbortError') {
            if (reason?.status === 401) {
              setSettingsError('Session expired while loading platform settings.');
            } else if (reason?.status === 403) {
              setSettingsError('Admin privileges are required to review platform settings.');
            } else {
              const message =
                reason?.message || (reason instanceof Error ? reason.message : 'Unable to load platform settings.');
              setSettingsError(message);
            }
            setSettings(null);
            setSettingsDraft(null);
            setSettingsDirty(false);
          }
        }
        setSettingsLoading(false);
      } catch (err) {
        if (!isActive || err?.name === 'AbortError') {
          return;
        }
        setError(err?.message || 'Unable to load admin telemetry at this time.');
        setLoading(false);
        setSettingsLoading(false);
      }
    };

    hydrate();

    return () => {
      isActive = false;
      abortController.abort();
    };
  }, [refreshIndex, canAccessDashboard, hasAdminAccess]);

  const profile = useMemo(() => {
    const totals = data?.summary?.totals ?? {};
    const support = data?.support ?? {};
    const trust = data?.trust ?? {};
    const financials = data?.financials ?? {};
    const sessionUser = session?.user ?? {};
    const displayName = [sessionUser.firstName, sessionUser.lastName]
      .filter(Boolean)
      .join(' ')
      .trim() ||
      session?.name ||
      'Jordan Kim';
    const displayRole = session?.title ?? sessionUser.title ?? 'Chief Platform Administrator';
    const baseBadges = new Set(session?.badges ?? ['Security cleared']);
    if (hasAdminSeat) {
      baseBadges.add('Super admin');
    }
    if (session?.lastLoginAt) {
      baseBadges.add(`Signed in ${formatRelativeTime(session.lastLoginAt)}`);
    }

    return {
      name: displayName,
      role: displayRole,
      initials: session?.initials ?? computeInitials(displayName, session?.email ?? sessionUser.email),
      avatarUrl: session?.avatarUrl ?? sessionUser.avatarUrl ?? null,
      status: data ? `Last refresh ${formatRelativeTime(data.refreshedAt)}` : session?.status ?? 'Loading metrics…',
      badges: Array.from(baseBadges).filter(Boolean),
      metrics: [
        { label: 'Members', value: formatNumber(totals.totalUsers ?? 0) },
        { label: 'Support backlog', value: formatNumber(support.openCases ?? 0) },
        { label: 'Open disputes', value: formatNumber(trust.openDisputes ?? 0) },
        { label: 'Gross volume', value: formatCurrency(financials.grossEscrowVolume ?? 0) },
      ],
    };
  }, [data, session, hasAdminSeat]);

  const summaryCards = useMemo(() => {
    if (!data) return [];
    const totals = data.summary?.totals ?? {};
    const growth = data.summary?.growth ?? {};
    const financials = data.financials ?? {};
    const support = data.support ?? {};
    const trust = data.trust ?? {};

    return [
      {
        label: 'Total members',
        value: formatNumber(totals.totalUsers ?? 0),
        caption: `${formatNumber(totals.activeProfiles ?? 0)} active profiles / ${formatPercent(totals.averageProfileCompletion ?? 0)} completion avg`,
        delta: `+${formatNumber(growth.totalNewUsers ?? 0)} new in ${data.lookbackDays} days`,
        icon: UsersIcon,
      },
      {
        label: 'Escrow gross volume',
        value: formatCurrency(financials.grossEscrowVolume ?? 0),
        caption: `Fees captured ${formatCurrency(financials.escrowFees ?? 0)} • Pending release ${formatCurrency(financials.pendingReleaseTotal ?? 0)}`,
        delta: `Net ${formatCurrency(financials.netEscrowVolume ?? 0)}`,
        icon: CurrencyDollarIcon,
      },
      {
        label: 'Support workload',
        value: formatNumber(support.openCases ?? 0),
        caption: `First reply ${formatDurationMinutes(support.averageFirstResponseMinutes)} • Resolution ${formatDurationMinutes(support.averageResolutionMinutes)}`,
        delta: `${formatNumber(support.casesByPriority?.urgent ?? 0)} urgent tickets`,
        icon: LifebuoyIcon,
      },
      {
        label: 'Trust & safety',
        value: formatNumber(trust.openDisputes ?? 0),
        caption: `${formatNumber(trust.disputesByPriority?.high ?? 0)} high priority • ${formatNumber(trust.disputesByStage?.mediation ?? 0)} in mediation`,
        delta: `${formatNumber(trust.disputesByPriority?.urgent ?? 0)} urgent cases`,
        icon: ShieldCheckIcon,
      },
    ];
  }, [data]);

  const normalizedSettings = useMemo(
    () => buildSettingsOverview(settingsDraft ?? settings ?? {}),
    [settingsDraft, settings],
  );

  const updateSettingsDraft = (path, value) => {
    setSettingsDraft((current) => {
      const baseline = current ?? cloneDeep(settings ?? {});
      const next = setNestedValue(baseline, path, value);
      setSettingsDirty(true);
      return next;
    });
  };

  const handleTextChange = (path) => (event) => {
    updateSettingsDraft(path, event.target.value);
  };

  const handleSelectChange = (path) => (event) => {
    updateSettingsDraft(path, event.target.value);
  };

  const handleToggleChange = (path) => (event) => {
    updateSettingsDraft(path, event.target.checked);
  };

  const handleRestrictedFeaturesChange = (value) => {
    setRestrictedFeaturesInput(value);
    const features = value
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
    updateSettingsDraft(['subscriptions', 'restrictedFeatures'], features);
  };

  const handleSaveSettings = async () => {
    if (!settingsDraft || settingsSaving) {
      return;
    }
    setSettingsSaving(true);
    setSettingsError(null);
    setSettingsStatus('');
    try {
      const payload = cloneDeep(settingsDraft);
      if (Array.isArray(payload?.subscriptions?.restrictedFeatures)) {
        payload.subscriptions.restrictedFeatures = payload.subscriptions.restrictedFeatures
          .map((item) => (typeof item === 'string' ? item.trim() : ''))
          .filter((item) => item.length > 0);
      }
      const response = await updatePlatformSettings(payload);
      setSettings(response);
      const draft = cloneDeep(response);
      setSettingsDraft(draft);
      setRestrictedFeaturesInput(
        Array.isArray(response?.subscriptions?.restrictedFeatures)
          ? response.subscriptions.restrictedFeatures.join(', ')
          : '',
      );
      setSettingsDirty(false);
      setSettingsStatus('Platform settings updated successfully.');
      setLastSavedAt(new Date().toISOString());
    } catch (err) {
      setSettingsError(err?.message || 'Failed to update platform settings.');
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleResetSettings = () => {
    if (!settings) {
      setSettingsDraft(null);
      setSettingsDirty(false);
      setRestrictedFeaturesInput('');
      return;
    }
    const baseline = cloneDeep(settings);
    setSettingsDraft(baseline);
    setRestrictedFeaturesInput(
      Array.isArray(baseline?.subscriptions?.restrictedFeatures)
        ? baseline.subscriptions.restrictedFeatures.join(', ')
        : '',
    );
    setSettingsDirty(false);
    setSettingsError(null);
    setSettingsStatus('Draft reset to last saved configuration.');
  };

  const disableSettingsInputs = settingsLoading || settingsSaving || !settingsDraft;

  const renderSettingsSection = (
    <section
      id="admin-settings-overview"
      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-blue-100/40 sm:p-8"
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Platform configuration</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Manage CMS controls, environment credentials, and API integrations from one hardened console.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-wide">
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-600">
              {settingsLoading ? 'Syncing settings…' : lastSavedAt ? `Last synced ${formatRelativeTime(lastSavedAt)}` : 'Awaiting sync'}
            </span>
            {settingsDirty ? (
              <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-700">
                Unsaved changes
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loading || settingsLoading}
          >
            <ArrowPathIcon className="mr-2 h-4 w-4" /> Re-sync data
          </button>
          <button
            type="button"
            onClick={handleResetSettings}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!settingsDirty || settingsSaving || settingsLoading}
          >
            Discard draft
          </button>
          <button
            type="button"
            onClick={handleSaveSettings}
            className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark disabled:cursor-not-allowed disabled:bg-accent/60"
            disabled={!settingsDirty || settingsSaving || settingsLoading}
          >
            {settingsSaving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
      {settingsError ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{settingsError}</div>
      ) : null}
      {settingsStatus ? (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{settingsStatus}</div>
      ) : null}
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {normalizedSettings.overviewMetrics.map((metric) => (
          <div key={metric.label} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{metric.label}</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{metric.value}</p>
            {metric.caption ? (
              <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-500">{metric.caption}</p>
            ) : null}
          </div>
        ))}
      </div>
      {settingsLoading && !settingsDraft ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-sm text-slate-500">
          Synchronising secure configuration…
        </div>
      ) : (
        <>
          <div className="mt-8 grid gap-6 xl:grid-cols-2">
            <div id="admin-settings-cms" className="rounded-2xl border border-slate-200 bg-slate-50/80 p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">CMS controls & monetisation</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Toggle editorial workflows, feature gating, and revenue programs powering the marketplace.
                  </p>
                </div>
                <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
                  {normalizedSettings.cms.plans.length} plans
                </span>
              </div>
              <div className="mt-5 space-y-4">
                <label className="flex items-start justify-between gap-4 rounded-2xl border border-white bg-white px-4 py-3 shadow-sm">
                  <span>
                    <span className="text-sm font-semibold text-slate-800">Subscriptions</span>
                    <span className="mt-1 block text-xs text-slate-500">
                      Enable paid tiers and premium content access across Explorer.
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    className="h-5 w-5 rounded border-slate-300 text-accent focus:ring-accent"
                    checked={Boolean(getNestedValue(settingsDraft, ['subscriptions', 'enabled'], normalizedSettings.cms.subscriptionsEnabled))}
                    onChange={handleToggleChange(['subscriptions', 'enabled'])}
                    disabled={disableSettingsInputs}
                  />
                </label>
                <label className="flex items-start justify-between gap-4 rounded-2xl border border-white bg-white px-4 py-3 shadow-sm">
                  <span>
                    <span className="text-sm font-semibold text-slate-800">Escrow features</span>
                    <span className="mt-1 block text-xs text-slate-500">Control job escrow, milestone protection, and compliance.</span>
                  </span>
                  <input
                    type="checkbox"
                    className="h-5 w-5 rounded border-slate-300 text-accent focus:ring-accent"
                    checked={Boolean(getNestedValue(settingsDraft, ['featureToggles', 'escrow'], settings?.featureToggles?.escrow ?? true))}
                    onChange={handleToggleChange(['featureToggles', 'escrow'])}
                    disabled={disableSettingsInputs}
                  />
                </label>
                <label className="flex items-start justify-between gap-4 rounded-2xl border border-white bg-white px-4 py-3 shadow-sm">
                  <span>
                    <span className="text-sm font-semibold text-slate-800">Marketplace subscriptions</span>
                    <span className="mt-1 block text-xs text-slate-500">
                      Lock advanced analytics and workflow automation behind paid tiers.
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    className="h-5 w-5 rounded border-slate-300 text-accent focus:ring-accent"
                    checked={Boolean(getNestedValue(settingsDraft, ['featureToggles', 'subscriptions'], settings?.featureToggles?.subscriptions ?? true))}
                    onChange={handleToggleChange(['featureToggles', 'subscriptions'])}
                    disabled={disableSettingsInputs}
                  />
                </label>
                <label className="flex items-start justify-between gap-4 rounded-2xl border border-white bg-white px-4 py-3 shadow-sm">
                  <span>
                    <span className="text-sm font-semibold text-slate-800">Commission engine</span>
                    <span className="mt-1 block text-xs text-slate-500">
                      Toggle marketplace fee capture globally.
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    className="h-5 w-5 rounded border-slate-300 text-accent focus:ring-accent"
                    checked={Boolean(getNestedValue(settingsDraft, ['featureToggles', 'commissions'], settings?.featureToggles?.commissions ?? true))}
                    onChange={handleToggleChange(['featureToggles', 'commissions'])}
                    disabled={disableSettingsInputs}
                  />
                </label>
                <div>
                  <label className="text-sm font-semibold text-slate-800" htmlFor="restrictedFeatures">
                    Restricted features (comma separated)
                  </label>
                  <textarea
                    id="restrictedFeatures"
                    value={restrictedFeaturesInput}
                    onChange={(event) => handleRestrictedFeaturesChange(event.target.value)}
                    disabled={disableSettingsInputs}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                    rows={3}
                    placeholder="analytics_pro, gig_high_value"
                  />
                  <p className="mt-2 text-xs text-slate-500">
                    These features require an active subscription. Separate values with commas.
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">Marketplace monetisation</h3>
              <p className="mt-1 text-sm text-slate-600">
                Fine-tune commission rates, currency, and minimum fees to align with treasury policy.
              </p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="commissionRate" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Commission rate (%)
                  </label>
                  <input
                    id="commissionRate"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={getNestedValue(settingsDraft, ['commissions', 'rate'], settings?.commissions?.rate ?? '')}
                    onChange={handleTextChange(['commissions', 'rate'])}
                    disabled={disableSettingsInputs}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="commissionCurrency" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Currency
                  </label>
                  <input
                    id="commissionCurrency"
                    value={getNestedValue(settingsDraft, ['commissions', 'currency'], settings?.commissions?.currency ?? 'USD')}
                    onChange={handleTextChange(['commissions', 'currency'])}
                    disabled={disableSettingsInputs}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                    placeholder="USD"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="commissionMinimum" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Minimum fee
                  </label>
                  <input
                    id="commissionMinimum"
                    type="number"
                    step="0.01"
                    min="0"
                    value={getNestedValue(settingsDraft, ['commissions', 'minimumFee'], settings?.commissions?.minimumFee ?? '')}
                    onChange={handleTextChange(['commissions', 'minimumFee'])}
                    disabled={disableSettingsInputs}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Policy snapshot</p>
                  <p className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                    {normalizedSettings.cms.commissions.enabled
                      ? 'Commission active across gigs and projects.'
                      : 'Commission policy currently disabled.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            <div id="admin-settings-environment" className="rounded-2xl border border-slate-200 bg-slate-50/80 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">Environment & runtime</h3>
              <p className="mt-1 text-sm text-slate-600">
                Ensure the application name, environment, and storage endpoints align with deployment posture.
              </p>
              <div className="mt-5 space-y-4">
                <div className="space-y-2">
                  <label htmlFor="appName" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Workspace name
                  </label>
                  <input
                    id="appName"
                    value={getNestedValue(settingsDraft, ['app', 'name'], settings?.app?.name ?? '')}
                    onChange={handleTextChange(['app', 'name'])}
                    disabled={disableSettingsInputs}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="appEnvironment" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Environment
                  </label>
                  <select
                    id="appEnvironment"
                    value={getNestedValue(settingsDraft, ['app', 'environment'], settings?.app?.environment ?? 'development')}
                    onChange={handleSelectChange(['app', 'environment'])}
                    disabled={disableSettingsInputs}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  >
                    <option value="development">Development</option>
                    <option value="staging">Staging</option>
                    <option value="production">Production</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="clientUrl" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Client URL
                  </label>
                  <input
                    id="clientUrl"
                    type="url"
                    value={getNestedValue(settingsDraft, ['app', 'clientUrl'], settings?.app?.clientUrl ?? '')}
                    onChange={handleTextChange(['app', 'clientUrl'])}
                    disabled={disableSettingsInputs}
                    placeholder="https://app.gigvora.com"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="storageProvider" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Storage provider
                  </label>
                  <select
                    id="storageProvider"
                    value={getNestedValue(settingsDraft, ['storage', 'provider'], settings?.storage?.provider ?? 'cloudflare_r2')}
                    onChange={handleSelectChange(['storage', 'provider'])}
                    disabled={disableSettingsInputs}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  >
                    <option value="cloudflare_r2">Cloudflare R2</option>
                    <option value="aws_s3">AWS S3</option>
                    <option value="azure_blob">Azure Blob Storage</option>
                  </select>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="storageBucket" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Storage bucket
                    </label>
                    <input
                      id="storageBucket"
                      value={getNestedValue(settingsDraft, ['storage', 'cloudflare_r2', 'bucket'], settings?.storage?.cloudflare_r2?.bucket ?? '')}
                      onChange={handleTextChange(['storage', 'cloudflare_r2', 'bucket'])}
                      disabled={disableSettingsInputs}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="storageEndpoint" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Endpoint
                    </label>
                    <input
                      id="storageEndpoint"
                      value={getNestedValue(settingsDraft, ['storage', 'cloudflare_r2', 'endpoint'], settings?.storage?.cloudflare_r2?.endpoint ?? '')}
                      onChange={handleTextChange(['storage', 'cloudflare_r2', 'endpoint'])}
                      disabled={disableSettingsInputs}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <label htmlFor="storagePublicUrl" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Public base URL
                    </label>
                    <input
                      id="storagePublicUrl"
                      value={getNestedValue(settingsDraft, ['storage', 'cloudflare_r2', 'publicBaseUrl'], settings?.storage?.cloudflare_r2?.publicBaseUrl ?? '')}
                      onChange={handleTextChange(['storage', 'cloudflare_r2', 'publicBaseUrl'])}
                      disabled={disableSettingsInputs}
                      placeholder="https://cdn.gigvora.com"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">Database & credentials</h3>
              <p className="mt-1 text-sm text-slate-600">
                Securely manage database endpoints and connection secrets with instant rollback support.
              </p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="databaseHost" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Database host
                  </label>
                  <input
                    id="databaseHost"
                    value={getNestedValue(settingsDraft, ['database', 'host'], settings?.database?.host ?? '')}
                    onChange={handleTextChange(['database', 'host'])}
                    disabled={disableSettingsInputs}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="databasePort" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Port
                  </label>
                  <input
                    id="databasePort"
                    type="number"
                    min="0"
                    value={getNestedValue(settingsDraft, ['database', 'port'], settings?.database?.port ?? '')}
                    onChange={handleTextChange(['database', 'port'])}
                    disabled={disableSettingsInputs}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="databaseName" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Database name
                  </label>
                  <input
                    id="databaseName"
                    value={getNestedValue(settingsDraft, ['database', 'name'], settings?.database?.name ?? '')}
                    onChange={handleTextChange(['database', 'name'])}
                    disabled={disableSettingsInputs}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="databaseUser" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Username
                  </label>
                  <input
                    id="databaseUser"
                    value={getNestedValue(settingsDraft, ['database', 'username'], settings?.database?.username ?? '')}
                    onChange={handleTextChange(['database', 'username'])}
                    disabled={disableSettingsInputs}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label htmlFor="databasePassword" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Password
                  </label>
                  <input
                    id="databasePassword"
                    type="password"
                    value={getNestedValue(settingsDraft, ['database', 'password'], settings?.database?.password ?? '')}
                    onChange={handleTextChange(['database', 'password'])}
                    disabled={disableSettingsInputs}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Secret fingerprints</p>
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                    DB password • {maskSecret(getNestedValue(settingsDraft, ['database', 'password'], settings?.database?.password ?? ''))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            <div id="admin-settings-api" className="rounded-2xl border border-slate-200 bg-slate-50/80 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">API & payment gateways</h3>
              <p className="mt-1 text-sm text-slate-600">
                Configure REST endpoints, payment providers, and webhook credentials for integrations.
              </p>
              <div className="mt-5 space-y-4">
                <div className="space-y-2">
                  <label htmlFor="apiUrl" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    API base URL
                  </label>
                  <input
                    id="apiUrl"
                    type="url"
                    value={getNestedValue(settingsDraft, ['app', 'apiUrl'], settings?.app?.apiUrl ?? '')}
                    onChange={handleTextChange(['app', 'apiUrl'])}
                    disabled={disableSettingsInputs}
                    placeholder="https://api.gigvora.com"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="paymentProvider" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Payment provider
                  </label>
                  <select
                    id="paymentProvider"
                    value={getNestedValue(settingsDraft, ['payments', 'provider'], settings?.payments?.provider ?? 'stripe')}
                    onChange={handleSelectChange(['payments', 'provider'])}
                    disabled={disableSettingsInputs}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  >
                    <option value="stripe">Stripe</option>
                    <option value="escrow_com">Escrow.com</option>
                  </select>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="stripePublishableKey" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Stripe publishable key
                    </label>
                    <input
                      id="stripePublishableKey"
                      value={getNestedValue(settingsDraft, ['payments', 'stripe', 'publishableKey'], settings?.payments?.stripe?.publishableKey ?? '')}
                      onChange={handleTextChange(['payments', 'stripe', 'publishableKey'])}
                      disabled={disableSettingsInputs}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="stripeAccountId" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Stripe account ID
                    </label>
                    <input
                      id="stripeAccountId"
                      value={getNestedValue(settingsDraft, ['payments', 'stripe', 'accountId'], settings?.payments?.stripe?.accountId ?? '')}
                      onChange={handleTextChange(['payments', 'stripe', 'accountId'])}
                      disabled={disableSettingsInputs}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="stripeWebhookSecret" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Webhook secret
                    </label>
                    <input
                      id="stripeWebhookSecret"
                      type="password"
                      value={getNestedValue(settingsDraft, ['payments', 'stripe', 'webhookSecret'], settings?.payments?.stripe?.webhookSecret ?? '')}
                      onChange={handleTextChange(['payments', 'stripe', 'webhookSecret'])}
                      disabled={disableSettingsInputs}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="escrowApiKey" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Escrow.com API key
                    </label>
                    <input
                      id="escrowApiKey"
                      type="password"
                      value={getNestedValue(settingsDraft, ['payments', 'escrow_com', 'apiKey'], settings?.payments?.escrow_com?.apiKey ?? '')}
                      onChange={handleTextChange(['payments', 'escrow_com', 'apiKey'])}
                      disabled={disableSettingsInputs}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="escrowApiSecret" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Escrow.com API secret
                    </label>
                    <input
                      id="escrowApiSecret"
                      type="password"
                      value={getNestedValue(settingsDraft, ['payments', 'escrow_com', 'apiSecret'], settings?.payments?.escrow_com?.apiSecret ?? '')}
                      onChange={handleTextChange(['payments', 'escrow_com', 'apiSecret'])}
                      disabled={disableSettingsInputs}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                    />
                  </div>
                  <label className="flex items-center gap-3 sm:col-span-2 rounded-2xl border border-white bg-white px-4 py-3 shadow-sm">
                    <input
                      type="checkbox"
                      className="h-5 w-5 rounded border-slate-300 text-accent focus:ring-accent"
                      checked={Boolean(getNestedValue(settingsDraft, ['payments', 'escrow_com', 'sandbox'], settings?.payments?.escrow_com?.sandbox ?? true))}
                      onChange={handleToggleChange(['payments', 'escrow_com', 'sandbox'])}
                      disabled={disableSettingsInputs}
                    />
                    <span className="text-sm text-slate-600">Use Escrow.com sandbox environment</span>
                  </label>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                  <p className="font-semibold text-slate-800">Secret fingerprints</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Stripe webhook • {maskSecret(getNestedValue(settingsDraft, ['payments', 'stripe', 'webhookSecret'], settings?.payments?.stripe?.webhookSecret ?? ''))}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Escrow key • {maskSecret(getNestedValue(settingsDraft, ['payments', 'escrow_com', 'apiKey'], settings?.payments?.escrow_com?.apiKey ?? ''))}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">Notifications & email</h3>
              <p className="mt-1 text-sm text-slate-600">
                Deliver transactional email reliably with secure SMTP credentials and branding controls.
              </p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="smtpHost" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    SMTP host
                  </label>
                  <input
                    id="smtpHost"
                    value={getNestedValue(settingsDraft, ['smtp', 'host'], settings?.smtp?.host ?? '')}
                    onChange={handleTextChange(['smtp', 'host'])}
                    disabled={disableSettingsInputs}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="smtpPort" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Port
                  </label>
                  <input
                    id="smtpPort"
                    type="number"
                    min="0"
                    value={getNestedValue(settingsDraft, ['smtp', 'port'], settings?.smtp?.port ?? '')}
                    onChange={handleTextChange(['smtp', 'port'])}
                    disabled={disableSettingsInputs}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </div>
                <label className="flex items-center gap-3 sm:col-span-2 rounded-2xl border border-white bg-white px-4 py-3 shadow-sm">
                  <input
                    type="checkbox"
                    className="h-5 w-5 rounded border-slate-300 text-accent focus:ring-accent"
                    checked={Boolean(getNestedValue(settingsDraft, ['smtp', 'secure'], settings?.smtp?.secure ?? false))}
                    onChange={handleToggleChange(['smtp', 'secure'])}
                    disabled={disableSettingsInputs}
                  />
                  <span className="text-sm text-slate-600">Use secure TLS/SSL</span>
                </label>
                <div className="space-y-2">
                  <label htmlFor="smtpUsername" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Username
                  </label>
                  <input
                    id="smtpUsername"
                    value={getNestedValue(settingsDraft, ['smtp', 'username'], settings?.smtp?.username ?? '')}
                    onChange={handleTextChange(['smtp', 'username'])}
                    disabled={disableSettingsInputs}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="smtpPassword" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Password
                  </label>
                  <input
                    id="smtpPassword"
                    type="password"
                    value={getNestedValue(settingsDraft, ['smtp', 'password'], settings?.smtp?.password ?? '')}
                    onChange={handleTextChange(['smtp', 'password'])}
                    disabled={disableSettingsInputs}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="smtpFromAddress" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    From address
                  </label>
                  <input
                    id="smtpFromAddress"
                    type="email"
                    value={getNestedValue(settingsDraft, ['smtp', 'fromAddress'], settings?.smtp?.fromAddress ?? '')}
                    onChange={handleTextChange(['smtp', 'fromAddress'])}
                    disabled={disableSettingsInputs}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="smtpFromName" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    From name
                  </label>
                  <input
                    id="smtpFromName"
                    value={getNestedValue(settingsDraft, ['smtp', 'fromName'], settings?.smtp?.fromName ?? '')}
                    onChange={handleTextChange(['smtp', 'fromName'])}
                    disabled={disableSettingsInputs}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current signature</p>
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                    {getNestedValue(settingsDraft, ['smtp', 'fromName'], settings?.smtp?.fromName ?? 'Gigvora')} • {getNestedValue(settingsDraft, ['smtp', 'fromAddress'], settings?.smtp?.fromAddress ?? 'ops@gigvora.com')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );


  const handleRefresh = () => {
    setRefreshIndex((index) => index + 1);
  };

  const renderAccessDenied = (
    <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8 text-amber-900">
      <h2 className="text-xl font-semibold text-amber-900">Admin role required</h2>
      <p className="mt-3 text-sm">
        This control tower is restricted to verified Gigvora administrators. Switch to an authorised account or request elevated access from the platform team.
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link
          to="/admin"
          className="inline-flex items-center justify-center rounded-full border border-amber-300 bg-white px-5 py-2 text-sm font-semibold text-amber-900 transition hover:border-amber-400 hover:bg-amber-100"
        >
          Return to admin login
        </Link>
        <button
          type="button"
          onClick={() => setRefreshIndex((index) => index + 1)}
          className="inline-flex items-center justify-center rounded-full border border-transparent bg-amber-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-amber-700"
        >
          Check access again
        </button>
      </div>
    </div>
  );

  const renderLoadingState = (
    <div className="space-y-6">
      <div className="rounded-3xl border border-dashed border-blue-200 bg-blue-50/40 p-8 text-center text-sm text-blue-700">
        Synchronising telemetry from the platform. This typically takes just a moment…
      </div>
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-1/3 rounded-full bg-slate-200" />
          <div className="h-4 w-2/3 rounded-full bg-slate-200" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="h-28 rounded-2xl bg-slate-100" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderErrorState = (
    <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
      <p className="font-semibold">We couldn’t load the admin dashboard.</p>
      <p className="mt-2">{error}</p>
      <button
        type="button"
        onClick={handleRefresh}
        className="mt-4 inline-flex items-center gap-2 rounded-full border border-red-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-red-700 transition hover:border-red-300 hover:bg-red-50"
      >
        <ArrowPathIcon className="h-4 w-4" /> Try again
      </button>
    </div>
  );

  const renderDashboardSections = data ? (
    <div className="space-y-10">
      <AdCouponManager />
      <AdminGroupManagementPanel />

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <SummaryCard key={card.label} {...card} />
        ))}
      </div>

      {/* Member health */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-blue-100/40 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Member health</h2>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">
              Monitor network growth, profile completion, and trust signals to keep the marketplace balanced and high quality.
            </p>
          </div>
          <div className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-blue-700">
            Last {data.lookbackDays} days
          </div>
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-700">Member distribution</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {Object.entries(data.summary?.totals?.userBreakdown ?? {}).map(([type, count]) => (
                <div key={type} className="rounded-xl border border-white/60 bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{USER_TYPE_LABELS[type] ?? humanizeLabel(type)}</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900">{formatNumber(count)}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-700">Profile readiness</p>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Active profiles</dt>
                <dd className="mt-1 text-xl font-semibold text-slate-900">{formatNumber(data.summary?.totals?.activeProfiles ?? 0)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">High trust (≥80)</dt>
                <dd className="mt-1 text-xl font-semibold text-slate-900">{formatNumber(data.summary?.totals?.highTrustProfiles ?? 0)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Avg completion</dt>
                <dd className="mt-1 text-xl font-semibold text-slate-900">{formatPercent(data.summary?.totals?.averageProfileCompletion ?? 0)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Verified references</dt>
                <dd className="mt-1 text-xl font-semibold text-slate-900">{formatNumber(data.summary?.totals?.verifiedReferences ?? 0)}</dd>
              </div>
            </dl>
          </div>
        </div>
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-700">New signups</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {Object.entries(data.summary?.growth?.newUsers ?? {}).map(([type, count]) => (
              <div key={type} className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">{USER_TYPE_LABELS[type] ?? humanizeLabel(type)}</p>
                <p className="mt-1 text-xl font-semibold text-blue-800">{formatNumber(count)}</p>
                <p className="text-[11px] uppercase tracking-wide text-blue-500">{`Joined in ${data.lookbackDays} days`}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Financial governance */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-blue-100/40 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Financial governance</h2>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">
              Escrow balances, fee capture, and transaction mix to monitor marketplace liquidity and treasury performance.
            </p>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-blue-700 transition hover:border-blue-300 hover:bg-white"
          >
            <ArrowPathIcon className="h-4 w-4" /> Refresh data
          </button>
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <StatusList
            title="Transactions by status"
            items={calculatePercentages(data.financials?.transactionsByStatus ?? {})}
            emptyLabel="No transactions recorded yet."
          />
          <StatusList
            title="Escrow accounts"
            items={calculatePercentages(data.financials?.accountsByStatus ?? {})}
            emptyLabel="No accounts created yet."
          />
        </div>
        <RecentList
          title="Recent escrow activity"
          rows={(data.financials?.recentTransactions ?? []).map((txn) => ({
            reference: txn.reference,
            type: humanizeLabel(txn.type),
            status: humanizeLabel(txn.status),
            amount: formatCurrency(txn.amount, txn.currencyCode ?? 'USD'),
            netAmount: formatCurrency(txn.netAmount, txn.currencyCode ?? 'USD'),
            createdAt: formatDateTime(txn.createdAt),
          }))}
          columns={[
            { key: 'reference', label: 'Reference' },
            { key: 'type', label: 'Type' },
            { key: 'status', label: 'Status' },
            { key: 'amount', label: 'Gross' },
            { key: 'netAmount', label: 'Net' },
            { key: 'createdAt', label: 'Created' },
          ]}
          emptyLabel="Escrow activity will appear here once transactions are initiated."
        />
      </section>

      {/* Trust and safety */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-blue-100/40 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Risk & trust</h2>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">
              Track dispute load, prioritisation, and lifecycle stages to keep resolution teams ahead of potential escalations.
            </p>
          </div>
          <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
            {formatNumber(data.trust?.openDisputes ?? 0)} open cases
          </div>
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <StatusList title="Disputes by stage" items={calculatePercentages(data.trust?.disputesByStage ?? {})} />
          <StatusList title="Disputes by priority" items={calculatePercentages(data.trust?.disputesByPriority ?? {})} />
        </div>
        <RecentList
          title="Latest dispute updates"
          rows={(data.trust?.recentDisputes ?? []).map((dispute) => ({
            id: `#${dispute.id}`,
            stage: humanizeLabel(dispute.stage),
            priority: humanizeLabel(dispute.priority),
            status: humanizeLabel(dispute.status),
            amount: dispute.transaction ? formatCurrency(dispute.transaction.amount, dispute.transaction.currencyCode ?? 'USD') : '—',
            updatedAt: formatDateTime(dispute.updatedAt),
          }))}
          columns={[
            { key: 'id', label: 'Dispute' },
            { key: 'stage', label: 'Stage' },
            { key: 'priority', label: 'Priority' },
            { key: 'status', label: 'Status' },
            { key: 'amount', label: 'Amount' },
            { key: 'updatedAt', label: 'Updated' },
          ]}
          emptyLabel="Resolved disputes will reduce from this feed automatically."
        />
      </section>

      {/* Support operations */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-blue-100/40 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Support operations</h2>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">
              SLA adherence, backlog shape, and latest escalations ensure every member receives timely responses.
            </p>
          </div>
          <div className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-blue-700">
            {formatNumber(data.support?.openCases ?? 0)} cases in flight
          </div>
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <StatusList title="Cases by status" items={calculatePercentages(data.support?.casesByStatus ?? {})} />
          <StatusList title="Cases by priority" items={calculatePercentages(data.support?.casesByPriority ?? {})} />
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-700">Service levels</p>
            <dl className="mt-4 space-y-3">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Average first response</dt>
                <dd className="mt-1 text-xl font-semibold text-slate-900">{formatDurationMinutes(data.support?.averageFirstResponseMinutes)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Average resolution</dt>
                <dd className="mt-1 text-xl font-semibold text-slate-900">{formatDurationMinutes(data.support?.averageResolutionMinutes)}</dd>
              </div>
            </dl>
          </div>
          <RecentList
            title="Recent escalations"
            rows={(data.support?.recentCases ?? []).map((supportCase) => ({
              id: `#${supportCase.id}`,
              status: humanizeLabel(supportCase.status),
              priority: humanizeLabel(supportCase.priority),
              escalatedAt: formatDateTime(supportCase.escalatedAt),
              firstResponseAt: formatDateTime(supportCase.firstResponseAt),
              resolvedAt: formatDateTime(supportCase.resolvedAt),
            }))}
            columns={[
              { key: 'id', label: 'Case' },
              { key: 'status', label: 'Status' },
              { key: 'priority', label: 'Priority' },
              { key: 'escalatedAt', label: 'Escalated' },
              { key: 'firstResponseAt', label: 'First reply' },
              { key: 'resolvedAt', label: 'Resolved' },
            ]}
            emptyLabel="Escalations will populate as support cases move through the queue."
          />
        </div>
      </section>

      {/* Analytics & notifications */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-blue-100/40 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Engagement & communications</h2>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">
              Real-time telemetry, actor mix, and notification delivery ensure product teams can respond quickly to usage signals.
            </p>
          </div>
          <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
            {formatNumber(data.analytics?.eventsLastWindow ?? 0)} events / {data.eventWindowDays}-day window
          </div>
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <StatusList
            title="Events by actor"
            items={calculatePercentages(data.analytics?.eventsByActorType ?? {})}
            emptyLabel="No analytics events recorded yet."
          />
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-700">Top events</p>
            <ol className="mt-4 space-y-3 text-sm text-slate-600">
              {(data.analytics?.topEvents ?? []).map((event, index) => (
                <li key={event.eventName} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2">
                  <span className="font-medium text-slate-700">
                    <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                      {index + 1}
                    </span>
                    {event.eventName}
                  </span>
                  <span className="text-slate-500">{formatNumber(event.count)}</span>
                </li>
              ))}
              {!data.analytics?.topEvents?.length ? <li className="text-sm text-slate-500">No event telemetry yet.</li> : null}
            </ol>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-700">Daily volume</p>
            <div className="mt-4 space-y-2">
              {(data.analytics?.dailyEvents ?? []).map((entry) => (
                <div key={entry.date} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">{formatDate(entry.date)}</span>
                    <span className="font-semibold text-slate-900">{formatNumber(entry.count)}</span>
                  </div>
                  <div className="relative h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-blue-500"
                      style={{ width: `${Math.min(entry.count * 5, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
              {!data.analytics?.dailyEvents?.length ? <p className="text-sm text-slate-500">Events will chart here automatically.</p> : null}
            </div>
          </div>
        </div>
        <RecentList
          title="Latest analytics events"
          rows={(data.analytics?.latestEvents ?? []).map((event) => ({
            eventName: event.eventName,
            actorType: humanizeLabel(event.actorType),
            userId: event.userId ? `User ${event.userId}` : '—',
            entityType: event.entityType ? humanizeLabel(event.entityType) : '—',
            occurredAt: formatDateTime(event.occurredAt),
          }))}
          columns={[
            { key: 'eventName', label: 'Event' },
            { key: 'actorType', label: 'Actor' },
            { key: 'userId', label: 'Subject' },
            { key: 'entityType', label: 'Entity' },
            { key: 'occurredAt', label: 'Occurred' },
          ]}
          emptyLabel="Events will appear here as soon as telemetry is captured."
        />
        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/60 p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-700">Notification delivery</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            {Object.entries(data.notifications?.byStatus ?? {}).map(([status, count]) => (
              <div key={status} className="rounded-xl border border-white/80 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{humanizeLabel(status)}</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">{formatNumber(count)}</p>
              </div>
            ))}
            <div className="rounded-xl border border-red-100 bg-red-50/80 p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-red-500">Critical pending</p>
              <p className="mt-1 text-xl font-semibold text-red-700">{formatNumber(data.notifications?.criticalOpen ?? 0)}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Launchpad performance */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-blue-100/40 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Launchpad performance</h2>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">
              Understand placements, interviews, and employer demand across the Experience Launchpad programme.
            </p>
          </div>
          <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
            Conversion {formatPercent(data.launchpad?.totals?.conversionRate ?? 0)}
          </div>
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-700">Pipeline health</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {Object.entries(data.launchpad?.pipeline ?? {}).map(([stage, count]) => (
                <div key={stage} className="rounded-xl border border-white/80 bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{humanizeLabel(stage)}</p>
                  <p className="mt-1 text-xl font-semibold text-slate-900">{formatNumber(count)}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-700">Placements</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {Object.entries(data.launchpad?.placements ?? {}).map(([status, count]) => (
                <div key={status} className="rounded-xl border border-white/80 bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{humanizeLabel(status)}</p>
                  <p className="mt-1 text-xl font-semibold text-slate-900">{formatNumber(count)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <RecentList
            title="Upcoming interviews"
            rows={(data.launchpad?.upcomingInterviews ?? []).map((interview) => ({
              id: `#${interview.id}`,
              candidate: interview.applicant ? `${interview.applicant.firstName} ${interview.applicant.lastName}` : '—',
              scheduled: formatDateTime(interview.interviewScheduledAt),
              status: humanizeLabel(interview.status),
            }))}
            columns={[
              { key: 'id', label: 'Interview' },
              { key: 'candidate', label: 'Candidate' },
              { key: 'scheduled', label: 'Scheduled' },
              { key: 'status', label: 'Status' },
            ]}
            emptyLabel="Interview schedules will appear as the programme books conversations."
          />
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-700">Employer demand</p>
            <div className="mt-4 space-y-3">
              {(data.launchpad?.employerBriefs ?? []).map((brief) => (
                <div key={brief.id} className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                  <p className="font-semibold text-blue-800">{brief.companyName ?? 'Employer brief'}</p>
                  <p className="text-sm text-blue-700">{humanizeLabel(brief.status)}</p>
                  <p className="text-xs uppercase tracking-wide text-blue-500">Updated {formatRelativeTime(brief.updatedAt)}</p>
                </div>
              ))}
              {!data.launchpad?.employerBriefs?.length ? <p className="text-sm text-slate-500">Employer briefs will populate as demand is logged.</p> : null}
            </div>
            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
              <p className="text-sm font-semibold text-slate-700">Opportunities by source</p>
              <div className="mt-3 space-y-2">
                {Object.entries(data.launchpad?.opportunities ?? {}).map(([source, count]) => (
                  <div key={source} className="flex items-center justify-between text-sm text-slate-600">
                    <span>{humanizeLabel(source)}</span>
                    <span className="font-semibold text-slate-900">{formatNumber(count)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Gigvora Ads */}
      <section id="gigvora-ads">
        <GigvoraAdsConsole initialSnapshot={data.ads} defaultContext={data.ads?.overview?.context} />
      </section>
    </div>
  ) : null;

  let gatingView = null;
  if (!isAuthenticated) {
    gatingView = (
      <AccessNotice
        title="Sign in required"
        message="Sign in with your Gigvora admin credentials to open the control tower."
        primaryLabel="Go to admin login"
        onPrimaryAction={() => navigate('/admin')}
        secondaryLabel="Contact platform ops"
        secondaryHref="mailto:ops@gigvora.com?subject=Admin%20access%20request"
      />
    );
  } else if (!hasAdminSeat) {
    gatingView = (
      <AccessNotice
        title="Admin clearance required"
        message="This workspace is restricted to platform administrators. Request elevated access from operations."
        primaryLabel="Switch account"
        onPrimaryAction={() => navigate('/admin')}
        secondaryLabel="Contact platform ops"
        secondaryHref="mailto:ops@gigvora.com?subject=Admin%20access%20request"
      />
    );
  }

  if (gatingView) {
    return (
      <DashboardLayout
        currentDashboard="admin"
        title="Gigvora Admin Control Tower"
        subtitle="Enterprise governance & compliance"
        description="Centralize every lever that powers Gigvora—from member growth and financial operations to trust, support, analytics, and the launchpad."
        menuSections={MENU_SECTIONS}
        sections={[]}
        profile={profile}
        availableDashboards={[
          'admin',
          'user',
          'freelancer',
          'company',
          'agency',
          'headhunter',
        ]}
      >
        {gatingView}
      </DashboardLayout>
    );
  }
  const renderContent = (() => {
    if (!hasAdminAccess) {
      return renderAccessDenied;
    }

    let dashboardContent = null;

    if (loading && !data) {
      dashboardContent = renderLoadingState;
    } else if (error) {
      dashboardContent = renderErrorState;
    } else if (renderDashboardSections) {
      dashboardContent = renderDashboardSections;
    }

    return (
      <div className="space-y-10">
        {renderSettingsSection}
        {dashboardContent}
      </div>
    );
  })();

  return (
    <DashboardLayout
      currentDashboard="admin"
      title="Gigvora Admin Control Tower"
      subtitle="Enterprise governance & compliance"
      description="Centralize every lever that powers Gigvora—from member growth and financial operations to trust, support, analytics, and the launchpad." 
      menuSections={MENU_SECTIONS}
      sections={[]}
      profile={profile}
      availableDashboards={[
        'admin',
        'user',
        'freelancer',
        'company',
        'agency',
        'headhunter',
      ]}
    >
      {renderContent}
    </DashboardLayout>
  );
}
