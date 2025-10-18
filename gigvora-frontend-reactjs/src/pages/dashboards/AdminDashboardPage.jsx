import { useEffect, useMemo, useState } from 'react';
import { ArrowPathIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import AdminOverviewPanel from '../../components/admin/AdminOverviewPanel.jsx';
import useSession from '../../hooks/useSession.js';
import { fetchAdminDashboard, updateAdminOverview as persistAdminOverview } from '../../services/admin.js';

const ADMIN_ACCESS_ALIASES = new Set(['admin', 'administrator', 'super-admin', 'superadmin']);
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowPathIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  LifebuoyIcon,
  ShieldCheckIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import AdCouponManager from '../../components/admin/AdCouponManager.jsx';
import RuntimeTelemetryPanel from '../../components/admin/RuntimeTelemetryPanel.jsx';
import ConsentGovernancePanel from '../../components/admin/ConsentGovernancePanel.jsx';
import RbacMatrixPanel from '../../components/admin/RbacMatrixPanel.jsx';
import GigvoraAdsConsole from '../../components/ads/GigvoraAdsConsole.jsx';
import AdminInboxQueueSnapshot from '../../components/admin/inbox/AdminInboxQueueSnapshot.jsx';
import AdminGroupManagementPanel from './admin/AdminGroupManagementPanel.jsx';
import AdminMobileAppManagementPanel from './admin/AdminMobileAppManagementPanel.jsx';
import { ADMIN_MENU_SECTIONS } from './admin/menuSections.js';
import useSession from '../../hooks/useSession.js';
import useRuntimeHealthSnapshot from '../../hooks/useRuntimeHealthSnapshot.js';
import useDomainGovernanceSummaries from '../../hooks/useDomainGovernanceSummaries.js';
import { fetchAdminDashboard } from '../../services/admin.js';
import { fetchPlatformSettings, updatePlatformSettings } from '../../services/platformSettings.js';
import { fetchAffiliateSettings, updateAffiliateSettings } from '../../services/affiliateSettings.js';
import { ADMIN_DASHBOARD_MENU_SECTIONS } from '../../constants/adminDashboardMenu.js';
import ADMIN_MENU_SECTIONS from './admin/adminMenuConfig.js';
import ADMIN_MENU_SECTIONS from '../../constants/adminMenu.js';
import { listDatabaseConnections } from '../../services/databaseSettings.js';
import { ADMIN_DASHBOARD_MENU_SECTIONS } from '../../constants/adminDashboardMenu.js';
import { DATABASE_STATUS_STYLES } from '../../constants/databaseStatusStyles.js';

export const ADMIN_MENU_SECTIONS = [
const MENU_SECTIONS = ADMIN_DASHBOARD_MENU_SECTIONS;
import { ADMIN_MENU_SECTIONS } from '../../constants/adminMenuSections.js';

const MENU_SECTIONS = ADMIN_MENU_SECTIONS;
const MENU_SECTIONS = [
  {
    label: 'Dash',
    items: [
      { name: 'Ops', sectionId: 'admin-runtime-health' },
      { name: 'Data', sectionId: 'admin-domain-governance' },
      { name: 'Projects', href: '/dashboard/admin/projects' },
      { name: 'Ads', sectionId: 'gigvora-ads' },
    label: 'Home',
    items: [
      { name: 'Start', sectionId: 'overview-home' },
      { name: 'Profile', sectionId: 'overview-profile' },
      { name: 'Stats', sectionId: 'overview-metrics' },
    label: 'Command modules',
    items: [
      {
        name: 'Runtime health',
        description: 'Service readiness, dependency posture, and rate-limit utilisation for the API perimeter.',
        tags: ['ops', 'security'],
        sectionId: 'admin-runtime-health',
      },
      {
        name: 'Calendar',
        description: 'Manage scheduling, types, and events.',
        tags: ['ops', 'scheduling'],
        href: '/dashboard/admin/calendar',
        icon: CalendarDaysIcon,
      },
      {
        name: 'Data governance',
        description: 'PII inventory, retention policies, and audit cadence across bounded contexts.',
        tags: ['compliance', 'data'],
        sectionId: 'admin-domain-governance',
      },
      {
        name: 'Member health',
        description: 'Growth, activation, and readiness scores across the Gigvora network.',
        tags: ['growth', 'activation'],
      },
      {
        name: 'Hiring',
        description: '',
        tags: ['talent'],
        href: '/dashboard/admin/job-applications',
        name: 'Escrow',
        description: '',
        name: 'Profile management',
        description: 'Provision accounts, edit public profiles, and capture trust annotations.',
        tags: ['members'],
        href: '/dashboard/admin/profiles',
      },
      {
        name: 'Financial governance',
        description: 'Escrow flows, fee capture, and treasury risk posture.',
        tags: ['finance'],
        href: '/dashboard/admin/escrow',
      },
      {
        name: 'Wallets',
        description: 'Manage wallet accounts and ledger.',
        tags: ['finance', 'compliance'],
        href: '/dashboard/admin/wallets',
        id: 'wallet-management',
      },
      {
        name: 'Risk & trust',
        description: 'Dispute lifecycle, escalations, and marketplace safety monitoring.',
        tags: ['compliance'],
        href: '/dashboard/admin/disputes',
      },
      {
        name: 'Users',
        description: 'Manage accounts and access.',
        tags: ['identity'],
        href: '/dashboard/admin/users',
      },
      {
        name: 'Support operations',
        description: 'Service desk load, SLAs, and sentiment guardrails.',
      },
      {
        name: 'Mobile app management',
        description: 'Coordinate mobile releases, listings, and feature flags.',
        tags: ['mobile'],
        sectionId: 'admin-mobile-apps',
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
        href: '/dashboard/admin/ads-settings',
      },
      {
        name: 'Site',
        description: 'Brand, pages, menu.',
        tags: ['marketing'],
        href: '/dashboard/admin/site',
        sectionId: 'admin-site-management',
      },
      {
        name: 'Launchpad performance',
        description: 'Talent placements, interview runway, and employer demand.',
      },
    ],
  },
  {
    label: 'Config',
    items: [
      { name: 'Settings', sectionId: 'admin-settings-overview' },
      { name: 'Affiliates', sectionId: 'admin-affiliate-settings' },
    ],
  },
  {
    label: 'Tools',
    items: [{ name: 'Blog', sectionId: 'admin-blog' }],
      {
        name: 'Inbox workspace',
        description: 'Manage escalations, labels, and assignments in the dedicated inbox.',
        tags: ['support', 'messaging'],
        href: '/dashboard/admin/inbox',
        name: 'Gigs',
        description: 'Projects, orders, and assets.',
        tags: ['projects'],
        href: '/dashboard/admin/gig-management',
      },
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
        name: 'System settings',
        description: 'Global runtime defaults, security posture, and incident workflows.',
        tags: ['operations'],
        sectionId: 'admin-system-settings',
        href: '/dashboard/admin/system-settings',
        name: 'Storage management',
        description: 'Configure object storage endpoints, lifecycle automation, and upload governance.',
        tags: ['storage'],
        href: '/dashboard/admin/storage',
      },
      {
        name: 'All platform settings',
        description: 'Govern application defaults, commission policies, and feature gates.',
        tags: ['settings'],
        sectionId: 'admin-settings-overview',
      },
      {
        name: 'Affiliate economics',
        description: 'Tiered commissions, payout cadences, and partner compliance.',
        tags: ['affiliate'],
        sectionId: 'admin-affiliate-settings',
      },
      {
        name: 'CMS controls',
        description: 'Editorial workflow, restricted features, and monetisation toggles.',
      items: [
      {
        name: 'All platform settings',
        description: 'Govern application defaults, commission policies, and feature gates.',
        tags: ['settings'],
        sectionId: 'admin-settings-overview',
      },
      {
        name: 'Pages workspace',
        description: 'Edit CMS pages, hero modules, SEO, and navigation content.',
        tags: ['pages'],
        href: '/dashboard/admin/pages',
      },
      {
        name: 'Affiliate economics',
        description: 'Tiered commissions, payout cadences, and partner compliance.',
        tags: ['affiliate'],
        sectionId: 'admin-affiliate-settings',
        },
        {
          name: 'Legal',
          description: 'Policies',
          tags: ['legal', 'compliance'],
          href: '/dashboard/admin/policies',
          name: 'GDPR settings',
          description: 'Configure DPO contact, data subject workflows, retention, and processor governance.',
          tags: ['privacy', 'compliance'],
          href: '/dashboard/admin/gdpr',
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
      {
        name: 'Appearance management',
        description: 'Themes, brand assets, and layout presets.',
        href: '/dashboard/admin/appearance',
        tags: ['brand'],
        name: 'API management',
        description: 'Provision API clients, rotate secrets, and review audit trails.',
        href: '/dashboard/admin/api-management',
        tags: ['api', 'security'],
        name: 'Email',
        description: '',
        tags: ['email'],
        href: '/dashboard/admin/email',
      },
    ],
  },
];

const SECTIONS = [
  { id: 'overview-home', title: 'Start' },
  { id: 'overview-profile', title: 'Profile' },
  { id: 'overview-metrics', title: 'Stats' },
];

function normalizeRoles(roles) {
  if (!Array.isArray(roles)) {
    return [];
  }
  return roles
    .map((role) => (role == null ? null : `${role}`.trim().toLowerCase()))
    .filter(Boolean);
}

function hasAdminAccess(session) {
  if (!session) {
    return false;
  }
  const roleCandidates = [session.userType, session.primaryDashboard];
  if (Array.isArray(session.roles)) {
    roleCandidates.push(...session.roles);
  }
  if (Array.isArray(session.accountTypes)) {
    roleCandidates.push(...session.accountTypes);
  }
  if (Array.isArray(session.memberships)) {
    roleCandidates.push(...session.memberships);
  }
  const normalised = normalizeRoles(roleCandidates);
  return normalised.some((role) => ADMIN_ACCESS_ALIASES.has(role));
}

export default function AdminDashboardPage() {
  const { session, loading: sessionLoading } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [overviewStatus, setOverviewStatus] = useState('');
  const [overviewError, setOverviewError] = useState('');
  const navigate = useNavigate();
  const handleMenuItemSelect = useCallback(
    (itemId, item) => {
      if (item?.href) {
        navigate(item.href);
        return;
      }
      const targetId = item?.sectionId ?? item?.id;
      if (targetId && typeof document !== 'undefined') {
        const element = document.getElementById(targetId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    },
    [navigate],
  );
  const { session, isAuthenticated } = useSession();
  const {
    data: runtimeSnapshot,
    loading: runtimeLoading,
    refreshing: runtimeRefreshing,
    error: runtimeError,
    lastUpdated: runtimeUpdatedAt,
    refresh: refreshRuntime,
  } = useRuntimeHealthSnapshot();
  const domainGovernance = useDomainGovernanceSummaries({ refreshIntervalMs: 1000 * 60 * 10 });
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

  const handleMenuSelect = useCallback(
    (itemId, item) => {
      if (item?.href) {
        navigate(item.href);
        return;
      }
      const targetId = item?.sectionId ?? item?.targetId ?? itemId;
      if (!targetId) return;
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },
    [navigate],
  );
  const [settings, setSettings] = useState(null);
  const [settingsDraft, setSettingsDraft] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsError, setSettingsError] = useState(null);
  const [settingsDirty, setSettingsDirty] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsStatus, setSettingsStatus] = useState('');
  const [activeMenuItem, setActiveMenuItem] = useState(null);
  const [affiliateSettings, setAffiliateSettings] = useState(null);
  const [affiliateDraft, setAffiliateDraft] = useState(null);
  const [affiliateLoading, setAffiliateLoading] = useState(false);
  const [affiliateError, setAffiliateError] = useState(null);
  const [affiliateDirty, setAffiliateDirty] = useState(false);
  const [affiliateSaving, setAffiliateSaving] = useState(false);
  const [affiliateStatus, setAffiliateStatus] = useState('');
  const [affiliateLastSavedAt, setAffiliateLastSavedAt] = useState(null);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [restrictedFeaturesInput, setRestrictedFeaturesInput] = useState('');
  const [databaseOverview, setDatabaseOverview] = useState({
    loading: false,
    items: [],
    summary: null,
    error: null,
  });

  const fetchDatabaseOverview = useCallback(async () => {
    if (!canAccessDashboard) {
      return { items: [], summary: null, error: null };
    }
    try {
      const response = await listDatabaseConnections();
      return {
        items: Array.isArray(response?.items) ? response.items : [],
        summary: response?.summary ?? null,
        error: null,
      };
    } catch (fetchError) {
      return {
        items: [],
        summary: null,
        error:
          fetchError instanceof Error
            ? fetchError
            : new Error('Unable to load database overview.'),
      };
    }
  }, [canAccessDashboard]);

  const handleMenuSelect = useCallback(
    (itemId, item) => {
      if (item?.href) {
        navigate(item.href);
        return;
      }
      setActiveMenuItem(itemId);
      if (item?.sectionId && typeof document !== 'undefined') {
        const target = document.getElementById(item.sectionId);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    },
    [navigate],
  );

  const governanceRows = useMemo(
    () =>
      domainGovernance.contexts.map((context) => ({
        key: context.contextName,
        displayName: context.displayName ?? context.contextName,
        description: context.description ?? '',
        classification: context.dataClassification ?? '—',
        ownerTeam: context.ownerTeam ?? '—',
        dataSteward: context.dataSteward ?? '—',
        piiModelCount: context.piiModelCount ?? 0,
        piiFieldCount: context.piiFieldCount ?? 0,
        reviewStatus: context.reviewStatus ?? 'unknown',
        nextReviewDueAt: context.nextReviewDueAt ?? null,
        remediationItems: context.remediationItems ?? 0,
      })),
    [domainGovernance.contexts],
  );

  const adminAllowed = useMemo(() => hasAdminAccess(session), [session]);

  const loadDashboard = async () => {
    if (!adminAllowed) {
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await fetchAdminDashboard();
      setData(response);
    } catch (err) {
      const message = err?.body?.message || (err instanceof Error ? err.message : 'Unable to load admin overview.');
      setError(message);
    } finally {
      setLoading(false);
    }
    setSettingsLoading(true);
    setError(null);
    setSettingsError(null);
    setSettingsSaving(false);
    setSettingsStatus('');
    setAffiliateLoading(true);
    setAffiliateError(null);
    setAffiliateSaving(false);
    setAffiliateStatus('');

    const hydrate = async () => {
      try {
        const [dashboardResult, settingsResult, affiliateResult] = await Promise.allSettled([
          fetchAdminDashboard({}, { signal: abortController.signal }),
          fetchPlatformSettings({ signal: abortController.signal }),
          fetchAffiliateSettings({ signal: abortController.signal }),
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

        if (affiliateResult.status === 'fulfilled') {
          const receivedAffiliate = affiliateResult.value;
          setAffiliateSettings(receivedAffiliate);
          setAffiliateDraft(cloneDeep(receivedAffiliate));
          setAffiliateDirty(false);
          setAffiliateLastSavedAt(new Date().toISOString());
        } else {
          const reason = affiliateResult.reason;
          if (reason?.name !== 'AbortError') {
            if (reason?.status === 401) {
              setAffiliateError('Session expired while loading affiliate policies.');
            } else if (reason?.status === 403) {
              setAffiliateError('Admin privileges are required to configure affiliate policies.');
            } else {
              const message =
                reason?.message || (reason instanceof Error ? reason.message : 'Unable to load affiliate settings.');
              setAffiliateError(message);
            }
            setAffiliateSettings(null);
            setAffiliateDraft(null);
            setAffiliateDirty(false);
          }
        }
        setAffiliateLoading(false);
      } catch (err) {
        if (!isActive || err?.name === 'AbortError') {
          return;
        }
        setError(err?.message || 'Unable to load admin telemetry at this time.');
        setLoading(false);
        setSettingsLoading(false);
        setAffiliateLoading(false);
      }
    };

    hydrate();

    return () => {
      isActive = false;
      abortController.abort();
    };
  }, [refreshIndex, canAccessDashboard, hasAdminAccess]);

  useEffect(() => {
    let active = true;
    if (!canAccessDashboard) {
      setDatabaseOverview({ loading: false, items: [], summary: null, error: null });
      return () => {
        active = false;
      };
    }

    setDatabaseOverview((previous) => ({ ...previous, loading: true, error: null }));

    fetchDatabaseOverview().then((result) => {
      if (!active) {
        return;
      }
      setDatabaseOverview({
        loading: false,
        items: result.items,
        summary: result.summary,
        error: result.error,
      });
    });

    return () => {
      active = false;
    };
  }, [canAccessDashboard, fetchDatabaseOverview, refreshIndex]);

  const handleRefreshDatabase = useCallback(async () => {
    if (!canAccessDashboard) {
      return;
    }

    setDatabaseOverview((previous) => ({ ...previous, loading: true, error: null }));

    const result = await fetchDatabaseOverview();
    setDatabaseOverview((previous) => ({
      loading: false,
      items: result.error ? previous.items : result.items,
      summary: result.error ? previous.summary : result.summary,
      error: result.error,
    }));
  }, [canAccessDashboard, fetchDatabaseOverview]);

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

  const normalizedAffiliate = useMemo(
    () => affiliateDraft ?? affiliateSettings ?? {},
    [affiliateDraft, affiliateSettings],
  );

  const normalizedAffiliateTiers = Array.isArray(normalizedAffiliate.tiers)
    ? normalizedAffiliate.tiers
    : [];

  const databaseSummary = useMemo(() => {
    const items = Array.isArray(databaseOverview.items) ? databaseOverview.items : [];
    const summary = databaseOverview.summary ?? {};
    const byStatus = summary.byStatus ?? {};
    return {
      total: summary.total ?? items.length,
      byStatus: {
        healthy: byStatus.healthy ?? 0,
        warning: byStatus.warning ?? 0,
        error: byStatus.error ?? 0,
        unknown: byStatus.unknown ?? 0,
      },
    };
  }, [databaseOverview]);

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

  const updateAffiliateDraft = (path, value) => {
    setAffiliateDraft((current) => {
      const baseline = current ?? cloneDeep(affiliateSettings ?? {});
      const next = setNestedValue(baseline, path, value);
      setAffiliateDirty(true);
      return next;
    });
  };

  const handleAffiliateTextChange = (path) => (event) => {
    updateAffiliateDraft(path, event.target.value);
  };

  useEffect(() => {
    if (sessionLoading) {
      return;
    }
    if (!session) {
      setLoading(false);
      setError('Sign in to view the admin dashboard.');
      return;
    }
    if (!adminAllowed) {
      setLoading(false);
      setError('Admin access required.');
      return;
    }
    loadDashboard();
  }, [sessionLoading, session, adminAllowed]);

  const adminOverview = data?.overview ?? null;

  const handleRefresh = () => {
    if (loading || saving) {
      return;
    }
    loadDashboard();
  };

  const handleOverviewSave = async (payload = {}) => {
    if (!payload || typeof payload !== 'object') {
      return;
    }
    setSaving(true);
    setOverviewError('');
    setOverviewStatus('');
    try {
      const response = await persistAdminOverview(payload);
      setData((previous) => {
        if (!previous) {
          return { overview: response };
        }
        return { ...previous, overview: response };
      });
      setOverviewStatus('Profile updated.');
    } catch (err) {
      const message = err?.body?.message || (err instanceof Error ? err.message : 'Failed to update profile.');
      setOverviewError(message);
    } finally {
      setSaving(false);
    }
  };

  const renderState = () => {
    if (!adminAllowed) {
      return (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-amber-200 bg-amber-50 p-12 text-center text-amber-900">
          <LockClosedIcon className="h-10 w-10" aria-hidden="true" />
          <h2 className="mt-4 text-xl font-semibold">Restricted</h2>
          <p className="mt-2 text-sm">Switch to an admin account to open this dashboard.</p>
  const handleResetAffiliateSettings = () => {
    if (!affiliateSettings) {
      setAffiliateDraft(null);
      setAffiliateDirty(false);
      setAffiliateError(null);
      setAffiliateStatus('');
      return;
    }
    setAffiliateDraft(cloneDeep(affiliateSettings));
    setAffiliateDirty(false);
    setAffiliateError(null);
    setAffiliateStatus('Affiliate draft reset to last saved configuration.');
  };

  const disableAffiliateInputs = affiliateLoading || affiliateSaving || (!affiliateDraft && !affiliateSettings);


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
          <Link
            to="/dashboard/admin/appearance"
            className="inline-flex items-center justify-center rounded-full border border-blue-200 bg-blue-50 px-5 py-2 text-sm font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100"
          >
            Appearance console
          </Link>
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
                Fine-tune the default 2.5% platform fee while preserving provider-managed serviceman pay.
                Closed-loop wallet enforcement keeps Gigvora FCA-exempt and aligned with Apple App Store
                guideline 3.1.5.
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
                <div className="sm:col-span-2">
                  <label className="flex items-start justify-between gap-4 rounded-2xl border border-white bg-white px-4 py-3 shadow-sm">
                    <span>
                      <span className="text-sm font-semibold text-slate-800">Provider-managed serviceman pay</span>
                      <span className="mt-1 block text-xs text-slate-500">
                        Allow providers to set how much they compensate their teams per engagement.
                      </span>
                    </span>
                    <input
                      type="checkbox"
                      className="h-5 w-5 rounded border-slate-300 text-accent focus:ring-accent"
                      checked={Boolean(
                        getNestedValue(
                          settingsDraft,
                          ['commissions', 'providerControlsServicemanPay'],
                          settings?.commissions?.providerControlsServicemanPay ?? true,
                        ),
                      )}
                      onChange={handleToggleChange(['commissions', 'providerControlsServicemanPay'])}
                      disabled={disableSettingsInputs}
                    />
                  </label>
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="servicemanMinimumRate"
                    className="text-xs font-semibold uppercase tracking-wide text-slate-500"
                  >
                    Serviceman minimum payout (%)
                  </label>
                  <input
                    id="servicemanMinimumRate"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={getNestedValue(
                      settingsDraft,
                      ['commissions', 'servicemanMinimumRate'],
                      settings?.commissions?.servicemanMinimumRate ?? '',
                    )}
                    onChange={handleTextChange(['commissions', 'servicemanMinimumRate'])}
                    disabled={disableSettingsInputs}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <label
                    htmlFor="servicemanPayoutNotes"
                    className="text-xs font-semibold uppercase tracking-wide text-slate-500"
                  >
                    Serviceman payout policy notes
                  </label>
                  <textarea
                    id="servicemanPayoutNotes"
                    maxLength={1000}
                    rows={3}
                    value={getNestedValue(
                      settingsDraft,
                      ['commissions', 'servicemanPayoutNotes'],
                      settings?.commissions?.servicemanPayoutNotes ?? '',
                    )}
                    onChange={handleTextChange(['commissions', 'servicemanPayoutNotes'])}
                    disabled={disableSettingsInputs}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                    placeholder="Providers remain responsible for compensating servicemen directly in line with local labour laws."
                  />
                  <p className="text-xs text-slate-500">
                    Share clear guidance with providers about compensating servicemen. The note is included in payout
                    confirmations.
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Policy snapshot</p>
                  <p className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                    {normalizedSettings.cms.commissions.enabled
                      ? `Platform retains ${normalizedSettings.cms.commissions.rate ?? 0}% while providers manage serviceman payouts${
                          normalizedSettings.cms.commissions.servicemanMinimumRate
                            ? ` (minimum ${normalizedSettings.cms.commissions.servicemanMinimumRate}% share)`
                            : ''
                        }. Wallet ledgers remain closed-loop and App Store compliant.`
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
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Database infrastructure</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Manage connection profiles, read replicas, and credential rotation from the database console.
                  </p>
                </div>
                <div className="flex items-center gap-2 self-start">
                  <button
                    type="button"
                    onClick={handleRefreshDatabase}
                    disabled={databaseOverview.loading}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-400 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <ArrowPathIcon className={`h-4 w-4 ${databaseOverview.loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                  <Link
                    to="/dashboard/admin/database"
                    className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1"
                  >
                    Open console
                  </Link>
                </div>
              </div>
              {databaseOverview.error ? (
                <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {databaseOverview.error.message || 'Unable to load database overview. Try refreshing or check API access.'}
                </div>
              ) : null}
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  {
                    key: 'total',
                    label: 'Connections',
                    value: formatNumber(databaseSummary.total ?? 0),
                    helper: 'Profiles tracked',
                  },
                  {
                    key: 'healthy',
                    label: 'Healthy',
                    value: formatNumber(databaseSummary.byStatus.healthy ?? 0),
                    helper: 'Passing checks',
                  },
                  {
                    key: 'warning',
                    label: 'Slow',
                    value: formatNumber(databaseSummary.byStatus.warning ?? 0),
                    helper: 'Latency warnings',
                  },
                  {
                    key: 'error',
                    label: 'Errors',
                    value: formatNumber(databaseSummary.byStatus.error ?? 0),
                    helper: 'Failing checks',
                  },
                ].map((metric) => (
                  <div key={metric.key} className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{metric.label}</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-900">{metric.value}</p>
                    <p className="mt-1 text-xs text-slate-500">{metric.helper}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recent checks</p>
                {databaseOverview.loading && databaseOverview.items.length === 0 ? (
                  <div className="mt-3 animate-pulse rounded-2xl border border-slate-200 bg-white px-4 py-6 text-sm text-slate-500">
                    Checking database connections…
                  </div>
                ) : (
                  <ul className="mt-3 space-y-3">
                    {databaseOverview.items.slice(0, 4).map((connection) => {
                      const statusKey = connection.status && DATABASE_STATUS_STYLES[connection.status]
                        ? connection.status
                        : 'unknown';
                      const statusStyle = DATABASE_STATUS_STYLES[statusKey];
                      return (
                        <li
                          key={connection.id}
                          className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{connection.name}</p>
                            <p className="text-xs text-slate-500">
                              {connection.environment} • {connection.role} • {connection.host}:{connection.port}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                              {connection.lastTestedAt
                                ? `Last test ${formatDateTime(connection.lastTestedAt)}`
                                : 'Not yet tested'}
                            </p>
                          </div>
                          <span
                            className={`inline-flex w-max items-center rounded-full px-3 py-1 text-xs font-medium ${statusStyle.className}`}
                          >
                            {statusStyle.label}
                          </span>
                        </li>
                      );
                    })}
                    {databaseOverview.items.length === 0 && !databaseOverview.loading ? (
                      <li className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
                        No database connections have been configured yet.
                      </li>
                    ) : null}
                  </ul>
                )}
              </div>
            </div>
            <div
              id="admin-domain-governance"
              className="rounded-2xl border border-slate-200 bg-slate-50/80 p-6 shadow-sm xl:col-span-2"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Data governance registry</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Monitor PII coverage, retention policies, and audit cadence across bounded contexts.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => domainGovernance.refresh({ force: true })}
                  disabled={domainGovernance.loading && domainGovernance.contexts.length === 0}
                  className="inline-flex items-center gap-2 self-start rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-400 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <ArrowPathIcon
                    className={`h-4 w-4 ${
                      domainGovernance.refreshing || (domainGovernance.loading && domainGovernance.contexts.length === 0)
                        ? 'animate-spin'
                        : ''
                    }`}
                  />
                  Refresh
                </button>
              </div>
              {domainGovernance.error ? (
                <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {domainGovernance.error.message || 'Unable to load governance registry. Try refreshing or check API access.'}
                </div>
              ) : null}
              {domainGovernance.loading && domainGovernance.contexts.length === 0 ? (
                <div className="mt-5 animate-pulse rounded-xl border border-slate-200 bg-white px-4 py-6 text-sm text-slate-500">
                  Loading data governance catalogue…
                </div>
              ) : (
                <div className="mt-5 overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                    <thead className="bg-slate-100/60">
                      <tr>
                        <th scope="col" className="px-4 py-3 font-semibold text-slate-600">Context</th>
                        <th scope="col" className="px-4 py-3 font-semibold text-slate-600">Classification</th>
                        <th scope="col" className="px-4 py-3 font-semibold text-slate-600">Owner</th>
                        <th scope="col" className="px-4 py-3 font-semibold text-slate-600">PII coverage</th>
                        <th scope="col" className="px-4 py-3 font-semibold text-slate-600">Review status</th>
                        <th scope="col" className="px-4 py-3 font-semibold text-slate-600">Next review</th>
                        <th scope="col" className="px-4 py-3 font-semibold text-slate-600">Remediation items</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {governanceRows.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-6 text-center text-sm text-slate-500">
                            No governance records available. Confirm the backend has generated the domain registry snapshot.
                          </td>
                        </tr>
                      ) : (
                        governanceRows.map((row) => (
                          <tr key={row.key} className="align-top">
                            <td className="px-4 py-4 text-slate-900">
                              <div className="font-semibold">{row.displayName}</div>
                              {row.description ? (
                                <p className="mt-1 text-xs text-slate-500">{row.description}</p>
                              ) : null}
                            </td>
                            <td className="px-4 py-4 text-slate-700">{row.classification}</td>
                            <td className="px-4 py-4 text-slate-700">
                              <div>{row.ownerTeam}</div>
                              <div className="text-xs text-slate-500">Steward: {row.dataSteward}</div>
                            </td>
                            <td className="px-4 py-4 text-slate-700">
                              <div className="font-semibold text-slate-900">{row.piiModelCount} models</div>
                              <div className="text-xs text-slate-500">{row.piiFieldCount} tagged fields</div>
                            </td>
                            <td className="px-4 py-4">
                              <GovernanceStatusBadge status={row.reviewStatus} />
                            </td>
                            <td className="px-4 py-4 text-slate-700">
                              {row.nextReviewDueAt ? formatDateTime(row.nextReviewDueAt) : '—'}
                            </td>
                            <td className="px-4 py-4 text-slate-700">{row.remediationItems ?? 0}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="mt-4 flex flex-col gap-1 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                <span>
                  Last generated{' '}
                  {domainGovernance.generatedAt ? formatDateTime(domainGovernance.generatedAt) : '—'}
                </span>
                {domainGovernance.refreshing && domainGovernance.contexts.length > 0 ? (
                  <span className="flex items-center gap-2 text-slate-500">
                    <ArrowPathIcon className="h-4 w-4 animate-spin" /> Refreshing data…
                  </span>
                ) : null}
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

  const affiliateDocumentsValue = Array.isArray(normalizedAffiliate.compliance?.requiredDocuments)
    ? normalizedAffiliate.compliance.requiredDocuments.join(', ')
    : '';

  const renderAffiliateSettingsSection = (
    <section
      id="admin-affiliate-settings"
      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-emerald-100/40 sm:p-8"
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Affiliate programme configuration</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Govern referral economics, payout cadence, and compliance requirements across the Gigvora network.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-wide">
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-600">
              {affiliateLoading
                ? 'Syncing settings…'
                : affiliateLastSavedAt
                ? `Last synced ${formatRelativeTime(affiliateLastSavedAt)}`
                : 'Awaiting sync'}
            </span>
            {affiliateDirty ? (
              <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-700">
                Unsaved changes
              </span>
            ) : null}
            {normalizedAffiliate.enabled === false ? (
              <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-rose-600">
                Programme paused
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={handleResetAffiliateSettings}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={affiliateLoading || affiliateSaving}
          >
            Reset draft
          </button>
          <button
            type="button"
            onClick={handleSaveAffiliateSettings}
            className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={disableAffiliateInputs}
          >
            {affiliateSaving ? 'Saving…' : 'Save affiliate settings'}
          </button>
        </div>
      );
    }

    if (loading && !adminOverview) {
      return (
        <div className="space-y-6">
          <div className="rounded-3xl border border-dashed border-blue-200 bg-blue-50/60 p-10 text-center text-sm text-blue-700">
            Loading your overview…
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="h-32 rounded-3xl bg-slate-100" />
            <label className="flex flex-col gap-2 text-sm text-slate-700">
              <span className="font-semibold text-slate-800">Recurrence model</span>
              <select
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2"
                value={normalizedAffiliate.payouts?.recurrence?.type ?? 'infinite'}
                onChange={handleAffiliateRecurrenceChange}
                disabled={disableAffiliateInputs}
              >
                <option value="infinite">Infinite – recurring commissions</option>
                <option value="finite">Finite – limited commissions</option>
                <option value="one_time">Single – first transaction only</option>
              </select>
            </label>
            {normalizedAffiliate.payouts?.recurrence?.type === 'finite' ? (
              <label className="flex flex-col gap-2 text-sm text-slate-700">
                <span className="font-semibold text-slate-800">Recurrence limit (transactions)</span>
                <input
                  type="number"
                  min="1"
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2"
                  value={normalizedAffiliate.payouts?.recurrence?.limit ?? ''}
                  onChange={handleAffiliateRecurrenceLimitChange}
                  disabled={disableAffiliateInputs}
                />
              </label>
            ) : null}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
            <h3 className="text-base font-semibold text-slate-900">Required compliance documents</h3>
            <p className="mt-1 text-sm text-slate-600">
              Specify documentation partners must submit before payouts are released. Separate values with commas.
            </p>
            <input
              type="text"
              className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm"
              value={affiliateDocumentsValue}
              onChange={handleAffiliateDocumentsChange}
              placeholder="e.g. W-8BEN, Photo ID, Proof of address"
              disabled={disableAffiliateInputs}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">Commission tiers</h3>
              <button
                type="button"
                onClick={handleAffiliateAddTier}
                className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={disableAffiliateInputs}
              >
                Add tier
              </button>
            </div>
            {normalizedAffiliateTiers.length ? (
              <div className="space-y-3">
                {normalizedAffiliateTiers.map((tier, index) => (
                  <div key={tier.id ?? `tier-${index}`} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex-1">
                        <label className="flex flex-col gap-2 text-sm text-slate-700">
                          <span className="font-semibold text-slate-800">Tier name</span>
                          <input
                            type="text"
                            className="rounded-2xl border border-slate-200 bg-white px-4 py-2"
                            value={tier.name ?? ''}
                            onChange={handleAffiliateTierChange(index, 'name')}
                            disabled={disableAffiliateInputs}
                          />
                        </label>
                      </div>
                      <button
                        type="button"
                        onClick={handleAffiliateRemoveTier(index)}
                        className="inline-flex items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={disableAffiliateInputs}
                      >
                        Remove
                      </button>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <label className="flex flex-col gap-2 text-sm text-slate-700">
                        <span className="font-semibold text-slate-800">Rate (%)</span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-2"
                          value={tier.rate ?? ''}
                          onChange={handleAffiliateTierChange(index, 'rate')}
                          disabled={disableAffiliateInputs}
                        />
                      </label>
                      <label className="flex flex-col gap-2 text-sm text-slate-700">
                        <span className="font-semibold text-slate-800">Min value ({normalizedAffiliate.currency ?? 'USD'})</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-2"
                          value={tier.minValue ?? ''}
                          onChange={handleAffiliateTierChange(index, 'minValue')}
                          disabled={disableAffiliateInputs}
                        />
                      </label>
                      <label className="flex flex-col gap-2 text-sm text-slate-700">
                        <span className="font-semibold text-slate-800">Max value ({normalizedAffiliate.currency ?? 'USD'})</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-2"
                          value={tier.maxValue ?? ''}
                          onChange={handleAffiliateTierChange(index, 'maxValue')}
                          disabled={disableAffiliateInputs}
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-sm text-slate-500">
                No tiers configured yet. Add at least one tier to establish commission multipliers.
              </p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
            <h3 className="text-base font-semibold text-slate-900">Programme snapshot</h3>
            <dl className="mt-4 space-y-2 text-sm text-slate-700">
              <div className="flex items-center justify-between">
                <dt>Default commission</dt>
                <dd>{formatPercent(normalizedAffiliate.defaultCommissionRate ?? 0)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>Referral window</dt>
                <dd>{normalizedAffiliate.referralWindowDays ?? 0} days</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>Payout cadence</dt>
                <dd>{normalizedAffiliate.payouts?.frequency ?? 'monthly'}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>Threshold</dt>
                <dd>
                  {formatCurrency(
                    normalizedAffiliate.payouts?.minimumPayoutThreshold ?? 0,
                    normalizedAffiliate.currency ?? 'USD',
                  )}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>Tiers configured</dt>
                <dd>{normalizedAffiliateTiers.length}</dd>
              </div>
            </dl>
            <p className="mt-4 text-xs text-slate-500">
              Adjusting these settings updates partner experiences across web and mobile dashboards instantly.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900">Security posture</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>
                <span className="font-semibold text-slate-800">2FA enforcement:</span>{' '}
                {normalizedAffiliate.compliance?.twoFactorRequired ? 'Required for affiliate logins' : 'Optional for partners'}
              </li>
              <li>
                <span className="font-semibold text-slate-800">KYC verification:</span>{' '}
                {normalizedAffiliate.compliance?.payoutKyc ? 'Mandatory prior to payout' : 'Deferred to finance review'}
              </li>
              <li>
                <span className="font-semibold text-slate-800">Required documents:</span>{' '}
                {affiliateDocumentsValue || 'None configured'}
              </li>
            </ul>
            <p className="mt-4 text-xs text-slate-500">
              Align these requirements with your compliance team to ensure audit-ready payout processes.
            </p>
            <Link
              to="/dashboard/admin/security/two-factor"
              className="mt-4 inline-flex items-center justify-center rounded-full border border-blue-200 px-4 py-2 text-xs font-semibold text-blue-600 transition hover:border-blue-300 hover:text-blue-700"
            >
              Open 2FA control centre
            </Link>
          </div>
        </div>
      </div>
    </section>
  );


  const handleRefresh = () => {
    setRefreshIndex((index) => index + 1);
  };

  const handleMenuItemSelect = (itemId, item) => {
    if (item?.href) {
      navigate(item.href);
      return;
    }
    const targetId = item?.sectionId ?? item?.targetId ?? itemId;
    if (targetId && typeof document !== 'undefined') {
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
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

  const projectSummary = data?.projectManagement?.summary;
  const projectSummaryCards = projectSummary
    ? [
        {
          label: 'Projects',
          value: formatNumber(projectSummary.totalProjects ?? 0),
          caption: `${formatNumber(projectSummary.activeProjects ?? 0)} active`,
          icon: UsersIcon,
        },
        {
          label: 'At risk',
          value: formatNumber(projectSummary.atRiskProjects ?? 0),
          caption: `${formatNumber(projectSummary.completedProjects ?? 0)} completed`,
          icon: ShieldCheckIcon,
        },
        {
          label: 'Budget',
          value: formatCurrency(projectSummary.budgetAllocated ?? 0),
          caption: `Spent ${formatCurrency(projectSummary.budgetSpent ?? 0)}`,
          icon: CurrencyDollarIcon,
        },
        {
          label: 'Progress',
          value: formatPercent(projectSummary.averageProgress ?? 0),
          caption: 'Portfolio average',
          icon: LifebuoyIcon,
        },
      ]
    : [];

  const renderDashboardSections = data ? (
    <div className="space-y-10">
      <RuntimeTelemetryPanel
        snapshot={runtimeSnapshot}
        loading={runtimeLoading}
        refreshing={runtimeRefreshing}
        error={runtimeError}
        onRefresh={refreshRuntime}
        lastUpdated={runtimeUpdatedAt}
      />
      <AdCouponManager />
      <AdminGroupManagementPanel />
      <AdminMobileAppManagementPanel />
      <ConsentGovernancePanel />
      <RbacMatrixPanel />

      <section id="admin-projects" className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Projects</h2>
            <p className="mt-1 text-sm text-slate-600">Review health and jump into the workspace for full control.</p>
          </div>
          <Link
            to="/dashboard/admin/projects"
            className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark"
          >
            Open workspace
          </Link>
        </div>
        {projectSummaryCards.length ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {projectSummaryCards.map((card) => (
              <SummaryCard key={card.label} {...card} />
            ))}
          </div>
        ) : null}
      </section>

      <section id="admin-blog" className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Job post management</h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">
              Launch, govern, and monitor every role published across Gigvora. The job workspace supports full CRUD controls,
              workflow gates, attachments, distribution toggles, and publishing automation.
            </p>
          </div>
          <Link
            to="/dashboard/admin/jobs"
            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-slate-700"
          >
            Open job workspace
          </Link>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-600">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Operational coverage</p>
            <p className="mt-2">
              Manage job basics, compensation, hiring contacts, metadata, and publishing states with granular validation and audit
              trails.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-600">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Workflow automation</p>
            <p className="mt-2">
              Trigger lifecycle transitions, archive or duplicate postings, and push updates to partner surfaces instantly.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-600">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Distribution readiness</p>
            <p className="mt-2">
              Attach creative assets, set promotion flags, and prepare analytics hooks for campaign monitoring.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Blog operations</h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">
              Launch and govern Gigvora stories, release notes, and playbooks directly from the control tower. Published posts
              appear instantly across the public blog, member dashboards, and the mobile app.
            </p>
          </div>
          <Link
            to="/dashboard/admin/blog"
            className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark"
          >
            Open blog studio
          </Link>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-600">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Enterprise workflow</p>
            <p className="mt-2">
              Draft, schedule, and publish articles with tag management, hero imagery, and SEO-ready slugs in a single secured
              workspace.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-600">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Cross-platform parity</p>
            <p className="mt-2">
              Blog highlights surface automatically inside the user dashboard spotlight and the Gigvora mobile experience.
            </p>
          </div>
        </div>
      </section>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <SummaryCard key={card.label} {...card} />
        ))}
      </div>

      {/* Member health */}
      <section id="admin-risk-trust" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-blue-100/40 sm:p-8">
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
      );
    }

    if (error && !adminOverview) {
      return (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-rose-200 bg-rose-50 p-10 text-center text-rose-700">
          <p className="text-base font-semibold">{error}</p>
          <button
            type="button"
            onClick={handleRefresh}
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-rose-700 transition hover:border-rose-300 hover:bg-rose-50"
          >
            <ArrowPathIcon className="h-4 w-4" /> Try again
          </button>
        </div>
      );
      {/* Financial governance */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-blue-100/40 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Financial governance</h2>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">
              Snapshot of escrow balances, recent activity, and fee capture. Use the escrow management console for full control.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/dashboard/admin/escrow"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
            >
              Open escrow console
            </Link>
            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-blue-700 transition hover:border-blue-300 hover:bg-white"
            >
              <ArrowPathIcon className="h-4 w-4" /> Refresh data
            </button>
          </div>
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
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Support inbox</h2>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">
              Monitor escalations, ownership, and response speed. Take action on conversations directly from this dashboard.
            </p>
          </div>
          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end lg:flex-col lg:items-end">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-blue-700">
              <LifebuoyIcon className="h-4 w-4" /> {formatNumber(data.support?.openCases ?? 0)} cases active
            </div>
            <Link
              to="/dashboard/admin/inbox"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-blue-200 px-4 py-2 text-xs font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-50"
            >
              Open inbox workspace
            </Link>
          </div>
        </div>
        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.2fr),minmax(0,0.8fr)]">
          <AdminInboxQueueSnapshot />
          <div className="space-y-4">
            <StatusList title="Cases by status" items={calculatePercentages(data.support?.casesByStatus ?? {})} />
            <StatusList title="Cases by priority" items={calculatePercentages(data.support?.casesByPriority ?? {})} />
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
          </div>
        </div>
        <div className="mt-6">
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

  const handleMenuSelect = useCallback(
    (itemId, item) => {
      if (!item) {
        return;
      }
      if (item.href) {
        navigate(item.href);
        return;
      }
      const targetId = item.sectionId ?? item.targetId ?? itemId;
      if (targetId && typeof document !== 'undefined') {
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    },
    [navigate],
  );

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
        menuSections={ADMIN_DASHBOARD_MENU_SECTIONS}
        menuSections={MENU_SECTIONS}
        onMenuItemSelect={handleMenuSelect}
        menuSections={ADMIN_MENU_SECTIONS}
        sections={[]}
        profile={profile}
        availableDashboards={[
          'admin',
          { id: 'admin-appearance', label: 'Appearance', href: '/dashboard/admin/appearance' },
          { id: 'admin-gdpr', label: 'GDPR Settings', href: '/dashboard/admin/gdpr' },
          'user',
          'freelancer',
          'company',
          'agency',
          'headhunter',
        ]}
        onMenuItemSelect={handleMenuSelect}
        activeMenuItem={activeMenuItem}
        onMenuItemSelect={handleMenuSelect}
        onMenuItemSelect={handleMenuItemSelect}
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
      <AdminOverviewPanel
        overview={adminOverview}
        saving={saving}
        status={overviewStatus}
        error={overviewError || error}
        onSave={handleOverviewSave}
        onRefresh={handleRefresh}
      />
    );
  };

  return (
    <DashboardLayout
      currentDashboard="admin"
      title="Admin Overview"
      subtitle="Realtime snapshot"
      description="Stay on top of member sentiment, trust, and weather cues at a glance."
      menuSections={MENU_SECTIONS}
      sections={SECTIONS}
      availableDashboards={['admin', 'user', 'freelancer', 'company', 'agency', 'headhunter']}
      title="Gigvora Admin Control Tower"
      subtitle="Enterprise governance & compliance"
      description="Centralize every lever that powers Gigvora—from member growth and financial operations to trust, support, analytics, and the launchpad." 
      menuSections={ADMIN_DASHBOARD_MENU_SECTIONS}
      description="Centralize every lever that powers Gigvora—from member growth and financial operations to trust, support, analytics, and the launchpad."
      menuSections={MENU_SECTIONS}
      onMenuItemSelect={handleMenuSelect}
      description="Centralize every lever that powers Gigvora—from member growth and financial operations to trust, support, analytics, and the launchpad." 
      menuSections={ADMIN_MENU_SECTIONS}
      sections={[]}
      profile={profile}
      availableDashboards={[
        'admin',
        { id: 'admin-appearance', label: 'Appearance', href: '/dashboard/admin/appearance' },
        { id: 'admin-gdpr', label: 'GDPR Settings', href: '/dashboard/admin/gdpr' },
        'user',
        'freelancer',
        'company',
        'agency',
        'headhunter',
      ]}
      onMenuItemSelect={handleMenuSelect}
      activeMenuItem={activeMenuItem}
      onMenuItemSelect={handleMenuSelect}
      onMenuItemSelect={handleMenuItemSelect}
    >
      <div className="space-y-10">
        {renderState()}
      </div>
    </DashboardLayout>
  );
}
