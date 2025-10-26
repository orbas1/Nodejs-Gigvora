import { useCallback, useEffect, useMemo, useState } from 'react';
import { Disclosure } from '@headlessui/react';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ExclamationTriangleIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import {
  fetchAdminMobileApps,
  createAdminMobileApp,
  updateAdminMobileApp,
  createAdminMobileAppVersion,
  updateAdminMobileAppVersion,
  createAdminMobileAppFeature,
  updateAdminMobileAppFeature,
  deleteAdminMobileAppFeature,
} from '../../../services/mobileApps.js';
import { listFeatureFlags } from '../../../services/featureFlags.js';
import FeatureFlagToggle from '../../../components/system/FeatureFlagToggle.jsx';

const PLATFORM_OPTIONS = [
  { value: 'ios', label: 'iOS (App Store)' },
  { value: 'android', label: 'Android (Play Store)' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'retired', label: 'Retired' },
];

const CHANNEL_OPTIONS = [
  { value: 'production', label: 'Production' },
  { value: 'beta', label: 'Beta' },
  { value: 'internal', label: 'Internal' },
];

const COMPLIANCE_OPTIONS = [
  { value: 'ok', label: 'Compliant' },
  { value: 'review', label: 'Needs review' },
  { value: 'blocked', label: 'Blocked' },
];

const VERSION_STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'in_review', label: 'In review' },
  { value: 'released', label: 'Released' },
  { value: 'deprecated', label: 'Deprecated' },
];

const VERSION_TYPE_OPTIONS = [
  { value: 'major', label: 'Major' },
  { value: 'minor', label: 'Minor' },
  { value: 'patch', label: 'Patch' },
  { value: 'hotfix', label: 'Hotfix' },
];

const FEATURE_ROLLOUT_OPTIONS = [
  { value: 'global', label: 'Global' },
  { value: 'percentage', label: 'Percentage rollout' },
  { value: 'cohort', label: 'Role cohort' },
];

const DEFAULT_NEW_APP = {
  displayName: '',
  slug: '',
  platform: 'ios',
  status: 'active',
  releaseChannel: 'production',
  complianceStatus: 'ok',
  currentVersion: '',
  latestBuildNumber: '',
  minimumSupportedVersion: '',
  storeUrl: '',
  supportEmail: '',
  supportUrl: '',
  marketingUrl: '',
  iconUrl: '',
  heroImageUrl: '',
  rolloutNotes: '',
};

function buildAppForm(app) {
  return {
    displayName: app.displayName ?? '',
    slug: app.slug ?? '',
    platform: app.platform ?? 'ios',
    status: app.status ?? 'active',
    releaseChannel: app.releaseChannel ?? 'production',
    complianceStatus: app.complianceStatus ?? 'ok',
    currentVersion: app.currentVersion ?? '',
    latestBuildNumber: app.latestBuildNumber ?? '',
    minimumSupportedVersion: app.minimumSupportedVersion ?? '',
    storeUrl: app.storeUrl ?? '',
    supportEmail: app.supportEmail ?? '',
    supportUrl: app.supportUrl ?? '',
    marketingUrl: app.marketingUrl ?? '',
    iconUrl: app.iconUrl ?? '',
    heroImageUrl: app.heroImageUrl ?? '',
    rolloutNotes: app.rolloutNotes ?? '',
  };
}

function buildVersionForm(version) {
  return {
    version: version.version ?? '',
    buildNumber: version.buildNumber ?? '',
    status: version.status ?? 'draft',
    releaseType: version.releaseType ?? 'patch',
    releaseChannel: version.releaseChannel ?? 'production',
    rolloutPercentage: version.rolloutPercentage != null ? String(version.rolloutPercentage) : '',
    downloadUrl: version.downloadUrl ?? '',
    releaseNotes: version.releaseNotes ?? '',
    releaseNotesUrl: version.releaseNotesUrl ?? '',
    checksum: version.checksum ?? '',
    minOsVersion: version.minOsVersion ?? '',
    sizeBytes: version.sizeBytes != null ? String(version.sizeBytes) : '',
    scheduledAt: formatDateTimeInput(version.scheduledAt),
    releasedAt: formatDateTimeInput(version.releasedAt),
  };
}

function buildFeatureForm(feature) {
  const rolloutPercentage = feature.rolloutType === 'percentage' && feature.rolloutValue?.percentage != null
    ? String(feature.rolloutValue.percentage)
    : '';
  return {
    name: feature.name ?? '',
    description: feature.description ?? '',
    enabled: Boolean(feature.enabled),
    rolloutType: feature.rolloutType ?? 'global',
    rolloutPercentage,
    minAppVersion: feature.minAppVersion ?? '',
    maxAppVersion: feature.maxAppVersion ?? '',
    audienceRoles: Array.isArray(feature.audienceRoles) ? feature.audienceRoles.join(', ') : '',
  };
}

function buildNewVersionForm(app) {
  return {
    version: '',
    buildNumber: '',
    status: 'in_review',
    releaseType: 'minor',
    releaseChannel: app?.releaseChannel ?? 'production',
    rolloutPercentage: '100',
    downloadUrl: '',
    releaseNotes: '',
    releaseNotesUrl: '',
    checksum: '',
    minOsVersion: '',
    sizeBytes: '',
    scheduledAt: '',
    releasedAt: '',
  };
}

function buildNewFeatureForm() {
  return {
    key: '',
    name: '',
    description: '',
    enabled: false,
    rolloutType: 'global',
    rolloutPercentage: '',
    minAppVersion: '',
    maxAppVersion: '',
    audienceRoles: '',
  };
}

function formatDateTimeInput(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const iso = date.toISOString();
  return iso.slice(0, 16);
}

function parseDateTimeInput(value) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }
  return date.toISOString();
}

function isShallowEqual(a, b) {
  if (a === b) return true;
  if (!a || !b) return false;
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) {
    return false;
  }
  return aKeys.every((key) => a[key] === b[key]);
}

function formatNumber(value) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) return '0';
  return new Intl.NumberFormat('en-US').format(Math.round(numeric));
}

function SummaryTile({ title, value, subtitle }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{formatNumber(value)}</p>
      <p className="text-xs text-slate-500">{subtitle}</p>
    </div>
  );
}

function StatusMessage({ status }) {
  if (!status || status.status === 'idle') {
    return null;
  }
  if (status.status === 'loading') {
    return (
      <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-blue-600">
        <ArrowPathIcon className="h-4 w-4 animate-spin" /> Processing…
      </span>
    );
  }
  if (status.status === 'error') {
    return <span className="text-xs text-rose-600">{status.message}</span>;
  }
  if (status.status === 'success') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
        <CheckCircleIcon className="h-4 w-4" /> {status.message}
      </span>
    );
  }
  return null;
}

function formatSummaryLabel(label, value) {
  return (
    <span key={label} className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
      {label}: {formatNumber(value)}
    </span>
  );
}

function buildSummaryBadges(summary, appsCount) {
  return [
    formatSummaryLabel('Total apps', summary.totalApps ?? appsCount ?? 0),
    formatSummaryLabel('Pending reviews', summary.pendingReviews ?? 0),
    formatSummaryLabel('Scheduled releases', summary.upcomingReleases ?? 0),
    formatSummaryLabel('Active features', summary.activeFeatures ?? 0),
  ];
}

export default function AdminMobileAppManagementPanel({ standalone = false }) {
  const [state, setState] = useState({ loading: true, error: null, apps: [], summary: {} });
  const [appForms, setAppForms] = useState({});
  const [appDrafts, setAppDrafts] = useState({});
  const [appStatus, setAppStatus] = useState({});
  const [newAppForm, setNewAppForm] = useState(DEFAULT_NEW_APP);
  const [newAppStatus, setNewAppStatus] = useState({ status: 'idle', message: null });
  const [versionForms, setVersionForms] = useState({});
  const [versionDrafts, setVersionDrafts] = useState({});
  const [versionStatus, setVersionStatus] = useState({});
  const [newVersionForms, setNewVersionForms] = useState({});
  const [newVersionStatus, setNewVersionStatus] = useState({});
  const [featureForms, setFeatureForms] = useState({});
  const [featureDrafts, setFeatureDrafts] = useState({});
  const [featureStatus, setFeatureStatus] = useState({});
  const [newFeatureForms, setNewFeatureForms] = useState({});
  const [newFeatureStatus, setNewFeatureStatus] = useState({});

  const loadApps = useCallback(async () => {
    setState((previous) => ({ ...previous, loading: true }));
    try {
      const [appsResult, flagsResult] = await Promise.allSettled([
        fetchAdminMobileApps({ includeInactive: true }),
        listFeatureFlags({ status: 'active' }),
      ]);

      if (appsResult.status !== 'fulfilled') {
        throw appsResult.reason;
      }

      const response = appsResult.value ?? {};
      const apps = response?.apps ?? [];
      const nextAppForms = {};
      const nextAppDrafts = {};
      const nextVersionForms = {};
      const nextVersionDrafts = {};
      const nextNewVersionForms = {};
      const nextFeatureForms = {};
      const nextFeatureDrafts = {};
      const nextNewFeatureForms = {};

      apps.forEach((app) => {
        const form = buildAppForm(app);
        nextAppForms[app.id] = form;
        nextAppDrafts[app.id] = { ...form };
        nextNewVersionForms[app.id] = buildNewVersionForm(app);
        nextNewFeatureForms[app.id] = buildNewFeatureForm();

        (app.versions ?? []).forEach((version) => {
          const key = `${app.id}:${version.id}`;
          const versionForm = buildVersionForm(version);
          nextVersionForms[key] = versionForm;
          nextVersionDrafts[key] = { ...versionForm };
        });

        (app.features ?? []).forEach((feature) => {
          const key = `${app.id}:${feature.id}`;
          const featureForm = buildFeatureForm(feature);
          nextFeatureForms[key] = featureForm;
          nextFeatureDrafts[key] = { ...featureForm };
        });
      });

      const flags =
        flagsResult.status === 'fulfilled' && Array.isArray(flagsResult.value?.flags)
          ? flagsResult.value.flags
          : [];
      const activeFlagCount = flags.filter((flag) => {
        if (!flag || typeof flag !== 'object') {
          return false;
        }
        if (flag.enabled != null) {
          return Boolean(flag.enabled);
        }
        if (flag.status) {
          return `${flag.status}`.toLowerCase() === 'active';
        }
        return false;
      }).length;

      if (flagsResult.status === 'rejected') {
        console.warn('Unable to load feature flag summary for mobile apps.', flagsResult.reason);
      }

      const summaryPayload = {
        ...(response?.summary ?? {}),
        activeFeatures: activeFlagCount,
      };

      setState({ loading: false, error: null, apps, summary: summaryPayload });
      setAppForms(nextAppForms);
      setAppDrafts(nextAppDrafts);
      setVersionForms(nextVersionForms);
      setVersionDrafts(nextVersionDrafts);
      setNewVersionForms(nextNewVersionForms);
      setFeatureForms(nextFeatureForms);
      setFeatureDrafts(nextFeatureDrafts);
      setNewFeatureForms(nextNewFeatureForms);
    } catch (error) {
      setState({ loading: false, error: error?.message ?? 'Unable to load mobile apps.', apps: [], summary: {} });
    }
  }, []);

  useEffect(() => {
    loadApps();
  }, [loadApps]);

  const summary = state.summary ?? {};
  const summaryBadges = useMemo(() => buildSummaryBadges(summary, state.apps?.length ?? 0), [summary, state.apps?.length]);

  const handleAppFieldChange = (appId, field, value) => {
    setAppForms((previous) => ({
      ...previous,
      [appId]: {
        ...(previous[appId] ?? {}),
        [field]: value,
      },
    }));
    setAppStatus((previous) => ({
      ...previous,
      [appId]: { status: 'idle', message: null },
    }));
  };

  const handleSaveApp = async (appId) => {
    const form = appForms[appId];
    if (!form) return;
    setAppStatus((previous) => ({ ...previous, [appId]: { status: 'loading' } }));
    try {
      const payload = {
        ...form,
        currentVersion: form.currentVersion || undefined,
        latestBuildNumber: form.latestBuildNumber || undefined,
        minimumSupportedVersion: form.minimumSupportedVersion || undefined,
        storeUrl: form.storeUrl || undefined,
        supportEmail: form.supportEmail || undefined,
        supportUrl: form.supportUrl || undefined,
        marketingUrl: form.marketingUrl || undefined,
        iconUrl: form.iconUrl || undefined,
        heroImageUrl: form.heroImageUrl || undefined,
        rolloutNotes: form.rolloutNotes || undefined,
      };
      await updateAdminMobileApp(appId, payload);
      setAppStatus((previous) => ({ ...previous, [appId]: { status: 'success', message: 'Settings saved.' } }));
      await loadApps();
    } catch (error) {
      setAppStatus((previous) => ({
        ...previous,
        [appId]: { status: 'error', message: error?.message ?? 'Unable to save app settings.' },
      }));
    }
  };

  const handleResetApp = (appId) => {
    if (!appDrafts[appId]) return;
    setAppForms((previous) => ({ ...previous, [appId]: { ...appDrafts[appId] } }));
    setAppStatus((previous) => ({ ...previous, [appId]: { status: 'idle', message: null } }));
  };

  const handleNewAppChange = (field) => (event) => {
    const value = event.target.value;
    setNewAppForm((previous) => {
      const next = { ...previous, [field]: value };
      if (field === 'displayName' && !previous.slug) {
        next.slug = value ? value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 120) : '';
      }
      return next;
    });
    setNewAppStatus({ status: 'idle', message: null });
  };

  const handleCreateApp = async (event) => {
    event.preventDefault();
    if (!newAppForm.displayName || !newAppForm.slug) {
      setNewAppStatus({ status: 'error', message: 'App name and slug are required.' });
      return;
    }
    setNewAppStatus({ status: 'loading', message: null });
    try {
      const payload = {
        ...newAppForm,
        currentVersion: newAppForm.currentVersion || undefined,
        latestBuildNumber: newAppForm.latestBuildNumber || undefined,
        minimumSupportedVersion: newAppForm.minimumSupportedVersion || undefined,
        storeUrl: newAppForm.storeUrl || undefined,
        supportEmail: newAppForm.supportEmail || undefined,
        supportUrl: newAppForm.supportUrl || undefined,
        marketingUrl: newAppForm.marketingUrl || undefined,
        iconUrl: newAppForm.iconUrl || undefined,
        heroImageUrl: newAppForm.heroImageUrl || undefined,
        rolloutNotes: newAppForm.rolloutNotes || undefined,
      };
      await createAdminMobileApp(payload);
      setNewAppStatus({ status: 'success', message: 'Mobile app created.' });
      setNewAppForm(DEFAULT_NEW_APP);
      await loadApps();
    } catch (error) {
      setNewAppStatus({
        status: 'error',
        message: error?.message ?? 'Unable to create the mobile app.',
      });
    }
  };

  const handleVersionFieldChange = (appId, versionId, field, value) => {
    const key = `${appId}:${versionId}`;
    setVersionForms((previous) => {
      const nextForm = {
        ...(previous[key] ?? {}),
        [field]: value,
      };
      return {
        ...previous,
        [key]: nextForm,
      };
    });
    setVersionStatus((previous) => ({
      ...previous,
      [key]: { status: 'idle', message: null },
    }));
  };

  const handleResetVersion = (appId, versionId) => {
    const key = `${appId}:${versionId}`;
    const draft = versionDrafts[key];
    if (!draft) return;
    setVersionForms((previous) => ({
      ...previous,
      [key]: { ...draft },
    }));
    setVersionStatus((previous) => ({
      ...previous,
      [key]: { status: 'idle', message: null },
    }));
  };

  const handleNewVersionFieldChange = (appId, field) => (event) => {
    const value = event?.target?.value ?? '';
    setNewVersionForms((previous) => {
      const current = previous[appId] ?? buildNewVersionForm(appForms[appId]);
      const nextForm = {
        ...current,
        [field]: value,
      };
      if (field === 'rolloutPercentage' && value === '') {
        nextForm.rolloutPercentage = '';
      }
      return {
        ...previous,
        [appId]: nextForm,
      };
    });
    setNewVersionStatus((previous) => ({
      ...previous,
      [appId]: { status: 'idle', message: null },
    }));
  };

  const handleSaveVersion = async (appId, versionId) => {
    const key = `${appId}:${versionId}`;
    const form = versionForms[key];
    if (!form) return;
    setVersionStatus((previous) => ({ ...previous, [key]: { status: 'loading' } }));
    try {
      const payload = {
        ...form,
        rolloutPercentage: form.rolloutPercentage ? Number(form.rolloutPercentage) : undefined,
        sizeBytes: form.sizeBytes ? Number(form.sizeBytes) : undefined,
        scheduledAt: parseDateTimeInput(form.scheduledAt),
        releasedAt: parseDateTimeInput(form.releasedAt),
      };
      await updateAdminMobileAppVersion(appId, versionId, payload);
      setVersionStatus((previous) => ({ ...previous, [key]: { status: 'success', message: 'Version updated.' } }));
      await loadApps();
    } catch (error) {
      setVersionStatus((previous) => ({
        ...previous,
        [key]: { status: 'error', message: error?.message ?? 'Unable to update the version.' },
      }));
    }
  };

  const handleCreateVersion = async (appId) => {
    const form = newVersionForms[appId];
    if (!form?.version) {
      setNewVersionStatus((previous) => ({
        ...previous,
        [appId]: { status: 'error', message: 'Version number is required.' },
      }));
      return;
    }
    setNewVersionStatus((previous) => ({ ...previous, [appId]: { status: 'loading' } }));
    try {
      const payload = {
        ...form,
        rolloutPercentage: form.rolloutPercentage ? Number(form.rolloutPercentage) : undefined,
        sizeBytes: form.sizeBytes ? Number(form.sizeBytes) : undefined,
        scheduledAt: parseDateTimeInput(form.scheduledAt),
        releasedAt: parseDateTimeInput(form.releasedAt),
      };
      await createAdminMobileAppVersion(appId, payload);
      setNewVersionStatus((previous) => ({ ...previous, [appId]: { status: 'success', message: 'Version created.' } }));
      setNewVersionForms((previous) => ({ ...previous, [appId]: buildNewVersionForm(appForms[appId]) }));
      await loadApps();
    } catch (error) {
      setNewVersionStatus((previous) => ({
        ...previous,
        [appId]: { status: 'error', message: error?.message ?? 'Unable to create the version.' },
      }));
    }
  };

  const handleFeatureFieldChange = (appId, featureId, field, value) => {
    const key = `${appId}:${featureId}`;
    setFeatureForms((previous) => {
      const nextValue = field === 'enabled' ? Boolean(value) : value;
      const nextForm = {
        ...(previous[key] ?? {}),
        [field]: nextValue,
      };
      if (field === 'rolloutType' && nextValue !== 'percentage') {
        nextForm.rolloutPercentage = '';
      }
      return {
        ...previous,
        [key]: nextForm,
      };
    });
    setFeatureStatus((previous) => ({
      ...previous,
      [key]: { status: 'idle', message: null },
    }));
  };

  const handleResetFeature = (appId, featureId) => {
    const key = `${appId}:${featureId}`;
    const draft = featureDrafts[key];
    if (!draft) return;
    setFeatureForms((previous) => ({
      ...previous,
      [key]: { ...draft },
    }));
    setFeatureStatus((previous) => ({
      ...previous,
      [key]: { status: 'idle', message: null },
    }));
  };

  const handleNewFeatureFieldChange = (appId, field) => (event) => {
    const target = event?.target;
    const value = field === 'enabled' ? Boolean(target?.checked) : target?.value ?? '';
    setNewFeatureForms((previous) => {
      const current = previous[appId] ?? buildNewFeatureForm();
      const nextForm = {
        ...current,
        [field]: value,
      };
      if (field === 'rolloutType' && value !== 'percentage') {
        nextForm.rolloutPercentage = '';
      }
      return {
        ...previous,
        [appId]: nextForm,
      };
    });
    setNewFeatureStatus((previous) => ({
      ...previous,
      [appId]: { status: 'idle', message: null },
    }));
  };

  const handleSaveFeature = async (appId, featureId) => {
    const key = `${appId}:${featureId}`;
    const form = featureForms[key];
    if (!form) return;
    setFeatureStatus((previous) => ({ ...previous, [key]: { status: 'loading' } }));
    try {
      const payload = {
        name: form.name,
        description: form.description || undefined,
        enabled: Boolean(form.enabled),
        rolloutType: form.rolloutType,
        rolloutValue:
          form.rolloutType === 'percentage' && form.rolloutPercentage
            ? { percentage: Number(form.rolloutPercentage) }
            : undefined,
        minAppVersion: form.minAppVersion || undefined,
        maxAppVersion: form.maxAppVersion || undefined,
        audienceRoles: form.audienceRoles
          ? form.audienceRoles
              .split(',')
              .map((role) => role.trim())
              .filter(Boolean)
          : undefined,
      };
      await updateAdminMobileAppFeature(appId, featureId, payload);
      setFeatureStatus((previous) => ({ ...previous, [key]: { status: 'success', message: 'Feature updated.' } }));
      await loadApps();
    } catch (error) {
      setFeatureStatus((previous) => ({
        ...previous,
        [key]: { status: 'error', message: error?.message ?? 'Unable to update the feature.' },
      }));
    }
  };

  const handleCreateFeature = async (appId) => {
    const form = newFeatureForms[appId];
    if (!form?.name || !form?.key) {
      setNewFeatureStatus((previous) => ({
        ...previous,
        [appId]: { status: 'error', message: 'Feature name and key are required.' },
      }));
      return;
    }
    setNewFeatureStatus((previous) => ({ ...previous, [appId]: { status: 'loading' } }));
    try {
      const payload = {
        key: form.key,
        name: form.name,
        description: form.description || undefined,
        enabled: Boolean(form.enabled),
        rolloutType: form.rolloutType,
        rolloutValue:
          form.rolloutType === 'percentage' && form.rolloutPercentage
            ? { percentage: Number(form.rolloutPercentage) }
            : undefined,
        minAppVersion: form.minAppVersion || undefined,
        maxAppVersion: form.maxAppVersion || undefined,
        audienceRoles: form.audienceRoles
          ? form.audienceRoles
              .split(',')
              .map((role) => role.trim())
              .filter(Boolean)
          : undefined,
      };
      await createAdminMobileAppFeature(appId, payload);
      setNewFeatureStatus((previous) => ({ ...previous, [appId]: { status: 'success', message: 'Feature created.' } }));
      setNewFeatureForms((previous) => ({ ...previous, [appId]: buildNewFeatureForm() }));
      await loadApps();
    } catch (error) {
      setNewFeatureStatus((previous) => ({
        ...previous,
        [appId]: { status: 'error', message: error?.message ?? 'Unable to create the feature.' },
      }));
    }
  };

  const handleDeleteFeature = async (appId, featureId) => {
    // eslint-disable-next-line no-alert
    const confirmed = window.confirm('Remove this feature flag?');
    if (!confirmed) return;
    const key = `${appId}:${featureId}`;
    setFeatureStatus((previous) => ({ ...previous, [key]: { status: 'loading' } }));
    try {
      await deleteAdminMobileAppFeature(appId, featureId);
      setFeatureStatus((previous) => ({ ...previous, [key]: { status: 'success', message: 'Feature removed.' } }));
      await loadApps();
    } catch (error) {
      setFeatureStatus((previous) => ({
        ...previous,
        [key]: { status: 'error', message: error?.message ?? 'Unable to delete the feature.' },
      }));
    }
  };

  const apps = state.apps ?? [];

  return (
    <section
      id="admin-mobile-apps"
      className={`rounded-3xl border border-slate-200 bg-white/95 ${standalone ? 'p-8' : 'p-6'} shadow-lg shadow-blue-100/40`}
    >
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Mobile app command centre</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Mobile phone app management</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Manage releases, listings, and feature toggles for Gigvora mobile apps across iOS and Android.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">{summaryBadges}</div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            to="/dashboard/admin/mobile-apps"
            className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark"
          >
            Open workspace
          </Link>
          <button
            type="button"
            onClick={loadApps}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600"
          >
            <ArrowPathIcon className="mr-2 h-4 w-4" /> Refresh data
          </button>
        </div>
      </div>

      {state.error ? (
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <ExclamationTriangleIcon className="mt-0.5 h-5 w-5" />
          <span>{state.error}</span>
        </div>
      ) : null}

      {state.loading ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
          <ArrowPathIcon className="h-4 w-4 animate-spin" /> Loading mobile app data…
        </div>
      ) : null}

      <div className="mt-8 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        <SummaryTile title="Live apps" value={summary.totalApps ?? apps.length ?? 0} subtitle="Across platforms" />
        <SummaryTile title="In review" value={summary.pendingReviews ?? 0} subtitle="Store submissions" />
        <SummaryTile title="Scheduled releases" value={summary.upcomingReleases ?? 0} subtitle="Upcoming deploys" />
        <SummaryTile title="Active feature flags" value={summary.activeFeatures ?? 0} subtitle="Enabled cohorts" />
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <FeatureFlagToggle
          flagKey="mobile-app-beta"
          label="Mobile companion beta"
          description="Control beta companion distribution before a general app store rollout, aligning rollout pace with support readiness."
          audience="Founders & mentors"
          rollout="25% staged"
        />
        <FeatureFlagToggle
          flagKey="mobile-profiles-ai-insights"
          label="AI-driven profile insights"
          description="Enable personalised AI annotations in the mobile profile hub while compliance validates messaging and audit trails."
          audience="Executive admins"
          rollout="Ops review"
        />
      </div>

      <form
        onSubmit={handleCreateApp}
        className="mt-8 grid gap-4 rounded-3xl border border-slate-200 bg-slate-50/60 p-5 shadow-inner sm:grid-cols-2"
      >
        <div className="sm:col-span-2 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">Create new mobile app</h3>
          <StatusMessage status={newAppStatus} />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">App name</label>
          <input
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            value={newAppForm.displayName}
            onChange={handleNewAppChange('displayName')}
            placeholder="Gigvora Companion"
            required
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Slug</label>
          <input
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            value={newAppForm.slug}
            onChange={handleNewAppChange('slug')}
            placeholder="gigvora-companion"
            required
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Platform</label>
          <select
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            value={newAppForm.platform}
            onChange={handleNewAppChange('platform')}
          >
            {PLATFORM_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Release channel</label>
          <select
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            value={newAppForm.releaseChannel}
            onChange={handleNewAppChange('releaseChannel')}
          >
            {CHANNEL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</label>
          <select
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            value={newAppForm.status}
            onChange={handleNewAppChange('status')}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Compliance status</label>
          <select
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            value={newAppForm.complianceStatus}
            onChange={handleNewAppChange('complianceStatus')}
          >
            {COMPLIANCE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Store URL</label>
          <input
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            value={newAppForm.storeUrl}
            onChange={handleNewAppChange('storeUrl')}
            placeholder="https://apps.apple.com/..."
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Support email</label>
          <input
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            value={newAppForm.supportEmail}
            onChange={handleNewAppChange('supportEmail')}
            placeholder="support@gigvora.com"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Support URL</label>
          <input
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            value={newAppForm.supportUrl}
            onChange={handleNewAppChange('supportUrl')}
            placeholder="https://help.gigvora.com"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Marketing URL</label>
          <input
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            value={newAppForm.marketingUrl}
            onChange={handleNewAppChange('marketingUrl')}
            placeholder="https://gigvora.com/mobile"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Icon URL</label>
          <input
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            value={newAppForm.iconUrl}
            onChange={handleNewAppChange('iconUrl')}
            placeholder="https://cdn.gigvora.com/app-icon.png"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Hero image URL</label>
          <input
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            value={newAppForm.heroImageUrl}
            onChange={handleNewAppChange('heroImageUrl')}
            placeholder="https://cdn.gigvora.com/app-hero.jpg"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Release notes</label>
          <textarea
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            rows={2}
            value={newAppForm.rolloutNotes}
            onChange={handleNewAppChange('rolloutNotes')}
            placeholder="Notes about rollout risk, marketing assets, or compliance requirements."
          />
        </div>
        <div className="sm:col-span-2 flex items-center justify-end">
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={newAppStatus.status === 'loading'}
          >
            <PlusIcon className="mr-2 h-4 w-4" /> Add mobile app
          </button>
        </div>
      </form>

      <div className="mt-10 space-y-6">
        {apps.map((app) => {
          const form = appForms[app.id] ?? buildAppForm(app);
          const draft = appDrafts[app.id] ?? form;
          const dirty = !isShallowEqual(form, draft);
          const status = appStatus[app.id] ?? { status: 'idle', message: null };
          const versions = Array.isArray(app.versions) ? app.versions : [];
          const features = Array.isArray(app.features) ? app.features : [];
          const newVersionForm = newVersionForms[app.id] ?? buildNewVersionForm(app);
          const newVersionState = newVersionStatus[app.id] ?? { status: 'idle', message: null };
          const newFeatureForm = newFeatureForms[app.id] ?? buildNewFeatureForm();
          const newFeatureState = newFeatureStatus[app.id] ?? { status: 'idle', message: null };

          return (
            <Disclosure key={app.id} defaultOpen>
              {({ open }) => (
                <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <Disclosure.Button className="flex w-full items-center justify-between gap-3 rounded-3xl px-6 py-4 text-left text-sm font-semibold text-slate-800 transition hover:bg-slate-50">
                    <div>
                      <p className="text-base font-semibold text-slate-900">{app.displayName}</p>
                      <p className="text-xs text-slate-500">
                        {app.platform?.toUpperCase()} • {app.releaseChannel} • {app.status}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {dirty ? (
                        <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                          Unsaved changes
                        </span>
                      ) : null}
                      <ChevronDownIcon className={`h-5 w-5 transition ${open ? 'rotate-180 text-blue-500' : 'text-slate-400'}`} />
                    </div>
                  </Disclosure.Button>
                  <Disclosure.Panel className="border-t border-slate-100 px-6 py-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                      {[
                        ['displayName', 'App name', 'Gigvora Companion'],
                        ['slug', 'Slug', 'gigvora-companion'],
                        ['currentVersion', 'Current version', '2.5.0'],
                        ['latestBuildNumber', 'Latest build', '205'],
                        ['minimumSupportedVersion', 'Minimum supported', '2.0.0'],
                        ['storeUrl', 'Store URL', 'https://apps.apple.com/...'],
                        ['supportEmail', 'Support email', 'support@gigvora.com'],
                        ['supportUrl', 'Support URL', 'https://help.gigvora.com'],
                        ['marketingUrl', 'Marketing URL', 'https://gigvora.com/mobile'],
                        ['iconUrl', 'Icon URL', 'https://cdn.gigvora.com/app-icon.png'],
                        ['heroImageUrl', 'Hero image URL', 'https://cdn.gigvora.com/app-hero.jpg'],
                      ].map(([field, label, placeholder]) => (
                        <div key={field}>
                          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</label>
                          <input
                            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                            value={form[field] ?? ''}
                            onChange={(event) => handleAppFieldChange(app.id, field, event.target.value)}
                            placeholder={placeholder}
                          />
                        </div>
                      ))}
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Platform</label>
                        <select
                          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                          value={form.platform}
                          onChange={(event) => handleAppFieldChange(app.id, 'platform', event.target.value)}
                        >
                          {PLATFORM_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Release channel</label>
                        <select
                          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                          value={form.releaseChannel}
                          onChange={(event) => handleAppFieldChange(app.id, 'releaseChannel', event.target.value)}
                        >
                          {CHANNEL_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</label>
                        <select
                          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                          value={form.status}
                          onChange={(event) => handleAppFieldChange(app.id, 'status', event.target.value)}
                        >
                          {STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Compliance status</label>
                        <select
                          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                          value={form.complianceStatus}
                          onChange={(event) => handleAppFieldChange(app.id, 'complianceStatus', event.target.value)}
                        >
                          {COMPLIANCE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Rollout notes</label>
                        <textarea
                          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                          rows={2}
                          value={form.rolloutNotes}
                          onChange={(event) => handleAppFieldChange(app.id, 'rolloutNotes', event.target.value)}
                          placeholder="Notes for support and compliance teams"
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <StatusMessage status={status} />
                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => handleResetApp(app.id)}
                          className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600"
                        >
                          Reset changes
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveApp(app.id)}
                          className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={status.status === 'loading' || (!dirty && status.status !== 'error')}
                        >
                          {status.status === 'loading' ? 'Saving…' : 'Save settings'}
                        </button>
                      </div>
                    </div>

                    <div className="mt-8 space-y-8">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
                        <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <h3 className="text-base font-semibold text-slate-900">Version history</h3>
                            <p className="text-sm text-slate-600">Track releases, build metadata, and rollout timing.</p>
                          </div>
                          <StatusMessage status={newVersionState} />
                        </div>

                        <div className="mt-4 space-y-4">
                          {versions.length ? (
                            versions.map((version) => {
                              const versionKey = `${app.id}:${version.id}`;
                              const versionForm = versionForms[versionKey] ?? buildVersionForm(version);
                              const versionDraft = versionDrafts[versionKey] ?? versionForm;
                              const versionDirty = !isShallowEqual(versionForm, versionDraft);
                              const versionState = versionStatus[versionKey] ?? { status: 'idle', message: null };

                              return (
                                <div key={versionKey} className="rounded-2xl border border-white bg-white p-5 shadow-sm">
                                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                      <p className="text-base font-semibold text-slate-900">
                                        Version {versionForm.version || version.version}
                                      </p>
                                      <p className="text-xs text-slate-500">
                                        Build {versionForm.buildNumber || '—'} • {versionForm.status || 'draft'} •{' '}
                                        {versionForm.releaseChannel || app.releaseChannel}
                                      </p>
                                    </div>
                                    {versionDirty ? (
                                      <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                                        Unsaved changes
                                      </span>
                                    ) : null}
                                  </div>

                                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                                    <div>
                                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Version</label>
                                      <input
                                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                        value={versionForm.version}
                                        onChange={(event) => handleVersionFieldChange(app.id, version.id, 'version', event.target.value)}
                                      />
                                    </div>
                                    <div>
                                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Build number</label>
                                      <input
                                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                        value={versionForm.buildNumber}
                                        onChange={(event) => handleVersionFieldChange(app.id, version.id, 'buildNumber', event.target.value)}
                                      />
                                    </div>
                                    <div>
                                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</label>
                                      <select
                                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                        value={versionForm.status}
                                        onChange={(event) => handleVersionFieldChange(app.id, version.id, 'status', event.target.value)}
                                      >
                                        {VERSION_STATUS_OPTIONS.map((option) => (
                                          <option key={option.value} value={option.value}>
                                            {option.label}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                    <div>
                                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Release type</label>
                                      <select
                                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                        value={versionForm.releaseType}
                                        onChange={(event) => handleVersionFieldChange(app.id, version.id, 'releaseType', event.target.value)}
                                      >
                                        {VERSION_TYPE_OPTIONS.map((option) => (
                                          <option key={option.value} value={option.value}>
                                            {option.label}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                    <div>
                                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Release channel</label>
                                      <select
                                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                        value={versionForm.releaseChannel}
                                        onChange={(event) => handleVersionFieldChange(app.id, version.id, 'releaseChannel', event.target.value)}
                                      >
                                        {CHANNEL_OPTIONS.map((option) => (
                                          <option key={option.value} value={option.value}>
                                            {option.label}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                    <div>
                                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Rollout %</label>
                                      <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="1"
                                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                        value={versionForm.rolloutPercentage}
                                        onChange={(event) => handleVersionFieldChange(app.id, version.id, 'rolloutPercentage', event.target.value)}
                                      />
                                    </div>
                                    <div>
                                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Min OS version</label>
                                      <input
                                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                        value={versionForm.minOsVersion}
                                        onChange={(event) => handleVersionFieldChange(app.id, version.id, 'minOsVersion', event.target.value)}
                                      />
                                    </div>
                                    <div>
                                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Binary size (bytes)</label>
                                      <input
                                        type="number"
                                        min="0"
                                        step="1"
                                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                        value={versionForm.sizeBytes}
                                        onChange={(event) => handleVersionFieldChange(app.id, version.id, 'sizeBytes', event.target.value)}
                                      />
                                    </div>
                                    <div className="md:col-span-2">
                                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Download URL</label>
                                      <input
                                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                        value={versionForm.downloadUrl}
                                        onChange={(event) => handleVersionFieldChange(app.id, version.id, 'downloadUrl', event.target.value)}
                                        placeholder="https://cdn.gigvora.com/mobile/app-v2.5.0.ipa"
                                      />
                                    </div>
                                    <div className="md:col-span-2">
                                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Release notes</label>
                                      <textarea
                                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                        rows={3}
                                        value={versionForm.releaseNotes}
                                        onChange={(event) => handleVersionFieldChange(app.id, version.id, 'releaseNotes', event.target.value)}
                                      />
                                    </div>
                                    <div>
                                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Release notes URL</label>
                                      <input
                                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                        value={versionForm.releaseNotesUrl}
                                        onChange={(event) => handleVersionFieldChange(app.id, version.id, 'releaseNotesUrl', event.target.value)}
                                      />
                                    </div>
                                    <div>
                                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Checksum</label>
                                      <input
                                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                        value={versionForm.checksum}
                                        onChange={(event) => handleVersionFieldChange(app.id, version.id, 'checksum', event.target.value)}
                                      />
                                    </div>
                                    <div>
                                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Scheduled launch</label>
                                      <input
                                        type="datetime-local"
                                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                        value={versionForm.scheduledAt}
                                        onChange={(event) => handleVersionFieldChange(app.id, version.id, 'scheduledAt', event.target.value)}
                                      />
                                    </div>
                                    <div>
                                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Released at</label>
                                      <input
                                        type="datetime-local"
                                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                        value={versionForm.releasedAt}
                                        onChange={(event) => handleVersionFieldChange(app.id, version.id, 'releasedAt', event.target.value)}
                                      />
                                    </div>
                                  </div>

                                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                                    <StatusMessage status={versionState} />
                                    <div className="flex flex-wrap gap-3">
                                      <button
                                        type="button"
                                        onClick={() => handleResetVersion(app.id, version.id)}
                                        className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600"
                                      >
                                        Reset version
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleSaveVersion(app.id, version.id)}
                                        className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                                        disabled={versionState.status === 'loading' || (!versionDirty && versionState.status !== 'error')}
                                      >
                                        {versionState.status === 'loading' ? 'Saving…' : 'Save version'}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <p className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                              No versions yet. Create one below to start tracking releases.
                            </p>
                          )}
                        </div>

                        <form
                          onSubmit={(event) => {
                            event.preventDefault();
                            handleCreateVersion(app.id);
                          }}
                          className="mt-6 grid gap-4 border-t border-slate-200 pt-6 md:grid-cols-2"
                        >
                          <div className="md:col-span-2 flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-slate-800">Add version</h4>
                            <StatusMessage status={newVersionState} />
                          </div>
                          <div>
                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Version</label>
                            <input
                              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                              value={newVersionForm.version}
                              onChange={handleNewVersionFieldChange(app.id, 'version')}
                              required
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Build number</label>
                            <input
                              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                              value={newVersionForm.buildNumber}
                              onChange={handleNewVersionFieldChange(app.id, 'buildNumber')}
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</label>
                            <select
                              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                              value={newVersionForm.status}
                              onChange={handleNewVersionFieldChange(app.id, 'status')}
                            >
                              {VERSION_STATUS_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Release type</label>
                            <select
                              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                              value={newVersionForm.releaseType}
                              onChange={handleNewVersionFieldChange(app.id, 'releaseType')}
                            >
                              {VERSION_TYPE_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Release channel</label>
                            <select
                              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                              value={newVersionForm.releaseChannel}
                              onChange={handleNewVersionFieldChange(app.id, 'releaseChannel')}
                            >
                              {CHANNEL_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Rollout %</label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="1"
                              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                              value={newVersionForm.rolloutPercentage}
                              onChange={handleNewVersionFieldChange(app.id, 'rolloutPercentage')}
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Min OS version</label>
                            <input
                              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                              value={newVersionForm.minOsVersion}
                              onChange={handleNewVersionFieldChange(app.id, 'minOsVersion')}
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Binary size (bytes)</label>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                              value={newVersionForm.sizeBytes}
                              onChange={handleNewVersionFieldChange(app.id, 'sizeBytes')}
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Download URL</label>
                            <input
                              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                              value={newVersionForm.downloadUrl}
                              onChange={handleNewVersionFieldChange(app.id, 'downloadUrl')}
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Release notes</label>
                            <textarea
                              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                              rows={3}
                              value={newVersionForm.releaseNotes}
                              onChange={handleNewVersionFieldChange(app.id, 'releaseNotes')}
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Release notes URL</label>
                            <input
                              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                              value={newVersionForm.releaseNotesUrl}
                              onChange={handleNewVersionFieldChange(app.id, 'releaseNotesUrl')}
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Checksum</label>
                            <input
                              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                              value={newVersionForm.checksum}
                              onChange={handleNewVersionFieldChange(app.id, 'checksum')}
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Scheduled launch</label>
                            <input
                              type="datetime-local"
                              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                              value={newVersionForm.scheduledAt}
                              onChange={handleNewVersionFieldChange(app.id, 'scheduledAt')}
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Release at</label>
                            <input
                              type="datetime-local"
                              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                              value={newVersionForm.releasedAt}
                              onChange={handleNewVersionFieldChange(app.id, 'releasedAt')}
                            />
                          </div>
                          <div className="md:col-span-2 flex justify-end">
                            <button
                              type="submit"
                              className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                              disabled={newVersionState.status === 'loading'}
                            >
                              {newVersionState.status === 'loading' ? 'Adding…' : 'Create version'}
                            </button>
                          </div>
                        </form>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
                        <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <h3 className="text-base font-semibold text-slate-900">Feature flags</h3>
                            <p className="text-sm text-slate-600">Configure rollouts, cohorts, and guardrails.</p>
                          </div>
                          <StatusMessage status={newFeatureState} />
                        </div>

                        <div className="mt-4 space-y-4">
                          {features.length ? (
                            features.map((feature) => {
                              const featureKey = `${app.id}:${feature.id}`;
                              const featureForm = featureForms[featureKey] ?? buildFeatureForm(feature);
                              const featureDraft = featureDrafts[featureKey] ?? featureForm;
                              const featureDirty = !isShallowEqual(featureForm, featureDraft);
                              const featureState = featureStatus[featureKey] ?? { status: 'idle', message: null };

                              return (
                                <div key={featureKey} className="rounded-2xl border border-white bg-white p-5 shadow-sm">
                                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                      <p className="text-base font-semibold text-slate-900">{featureForm.name || feature.name || feature.key}</p>
                                      <p className="text-xs text-slate-500">Key: {feature.key}</p>
                                    </div>
                                    {featureDirty ? (
                                      <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                                        Unsaved changes
                                      </span>
                                    ) : null}
                                  </div>

                                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                                    <div className="md:col-span-2">
                                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Display name</label>
                                      <input
                                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                        value={featureForm.name}
                                        onChange={(event) => handleFeatureFieldChange(app.id, feature.id, 'name', event.target.value)}
                                      />
                                    </div>
                                    <div className="md:col-span-2">
                                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Description</label>
                                      <textarea
                                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                        rows={3}
                                        value={featureForm.description}
                                        onChange={(event) => handleFeatureFieldChange(app.id, feature.id, 'description', event.target.value)}
                                      />
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <input
                                        id={`${featureKey}-enabled`}
                                        type="checkbox"
                                        className="h-4 w-4 rounded border border-slate-300 text-blue-600 focus:ring-blue-500"
                                        checked={Boolean(featureForm.enabled)}
                                        onChange={(event) => handleFeatureFieldChange(app.id, feature.id, 'enabled', event.target.checked)}
                                      />
                                      <label htmlFor={`${featureKey}-enabled`} className="text-sm font-semibold text-slate-700">
                                        Enabled
                                      </label>
                                    </div>
                                    <div>
                                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Rollout type</label>
                                      <select
                                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                        value={featureForm.rolloutType}
                                        onChange={(event) => handleFeatureFieldChange(app.id, feature.id, 'rolloutType', event.target.value)}
                                      >
                                        {FEATURE_ROLLOUT_OPTIONS.map((option) => (
                                          <option key={option.value} value={option.value}>
                                            {option.label}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                    {featureForm.rolloutType === 'percentage' ? (
                                      <div>
                                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Rollout %</label>
                                        <input
                                          type="number"
                                          min="0"
                                          max="100"
                                          step="1"
                                          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                          value={featureForm.rolloutPercentage}
                                          onChange={(event) => handleFeatureFieldChange(app.id, feature.id, 'rolloutPercentage', event.target.value)}
                                        />
                                      </div>
                                    ) : null}
                                    <div>
                                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Min app version</label>
                                      <input
                                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                        value={featureForm.minAppVersion}
                                        onChange={(event) => handleFeatureFieldChange(app.id, feature.id, 'minAppVersion', event.target.value)}
                                      />
                                    </div>
                                    <div>
                                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Max app version</label>
                                      <input
                                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                        value={featureForm.maxAppVersion}
                                        onChange={(event) => handleFeatureFieldChange(app.id, feature.id, 'maxAppVersion', event.target.value)}
                                      />
                                    </div>
                                    <div className="md:col-span-2">
                                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Audience roles</label>
                                      <input
                                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                        value={featureForm.audienceRoles}
                                        onChange={(event) => handleFeatureFieldChange(app.id, feature.id, 'audienceRoles', event.target.value)}
                                        placeholder="admin, support, beta"
                                      />
                                    </div>
                                  </div>

                                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                                    <StatusMessage status={featureState} />
                                    <div className="flex flex-wrap gap-3">
                                      <button
                                        type="button"
                                        onClick={() => handleResetFeature(app.id, feature.id)}
                                        className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600"
                                      >
                                        Reset feature
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleSaveFeature(app.id, feature.id)}
                                        className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                                        disabled={featureState.status === 'loading' || (!featureDirty && featureState.status !== 'error')}
                                      >
                                        {featureState.status === 'loading' ? 'Saving…' : 'Save feature'}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteFeature(app.id, feature.id)}
                                        className="inline-flex items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-100"
                                        disabled={featureState.status === 'loading'}
                                      >
                                        Remove
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <p className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                              No feature flags yet. Create one below to target cohorts or roles.
                            </p>
                          )}
                        </div>

                        <form
                          onSubmit={(event) => {
                            event.preventDefault();
                            handleCreateFeature(app.id);
                          }}
                          className="mt-6 grid gap-4 border-t border-slate-200 pt-6 md:grid-cols-2"
                        >
                          <div className="md:col-span-2 flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-slate-800">Add feature flag</h4>
                            <StatusMessage status={newFeatureState} />
                          </div>
                          <div>
                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Key</label>
                            <input
                              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                              value={newFeatureForm.key}
                              onChange={handleNewFeatureFieldChange(app.id, 'key')}
                              placeholder="companion.payments"
                              required
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Display name</label>
                            <input
                              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                              value={newFeatureForm.name}
                              onChange={handleNewFeatureFieldChange(app.id, 'name')}
                              placeholder="Payments revamp"
                              required
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Description</label>
                            <textarea
                              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                              rows={3}
                              value={newFeatureForm.description}
                              onChange={handleNewFeatureFieldChange(app.id, 'description')}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              id={`new-feature-enabled-${app.id}`}
                              type="checkbox"
                              className="h-4 w-4 rounded border border-slate-300 text-blue-600 focus:ring-blue-500"
                              checked={Boolean(newFeatureForm.enabled)}
                              onChange={handleNewFeatureFieldChange(app.id, 'enabled')}
                            />
                            <label htmlFor={`new-feature-enabled-${app.id}`} className="text-sm font-semibold text-slate-700">
                              Enabled
                            </label>
                          </div>
                          <div>
                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Rollout type</label>
                            <select
                              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                              value={newFeatureForm.rolloutType}
                              onChange={handleNewFeatureFieldChange(app.id, 'rolloutType')}
                            >
                              {FEATURE_ROLLOUT_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          {newFeatureForm.rolloutType === 'percentage' ? (
                            <div>
                              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Rollout %</label>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="1"
                                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                value={newFeatureForm.rolloutPercentage}
                                onChange={handleNewFeatureFieldChange(app.id, 'rolloutPercentage')}
                              />
                            </div>
                          ) : null}
                          <div>
                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Min app version</label>
                            <input
                              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                              value={newFeatureForm.minAppVersion}
                              onChange={handleNewFeatureFieldChange(app.id, 'minAppVersion')}
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Max app version</label>
                            <input
                              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                              value={newFeatureForm.maxAppVersion}
                              onChange={handleNewFeatureFieldChange(app.id, 'maxAppVersion')}
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Audience roles</label>
                            <input
                              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                              value={newFeatureForm.audienceRoles}
                              onChange={handleNewFeatureFieldChange(app.id, 'audienceRoles')}
                              placeholder="admin, support, beta"
                            />
                          </div>
                          <div className="md:col-span-2 flex justify-end">
                            <button
                              type="submit"
                              className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                              disabled={newFeatureState.status === 'loading'}
                            >
                              {newFeatureState.status === 'loading' ? 'Adding…' : 'Create feature'}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </Disclosure.Panel>
                </div>
              )}
            </Disclosure>
          );
        })}
      </div>
    </section>
  );
}
