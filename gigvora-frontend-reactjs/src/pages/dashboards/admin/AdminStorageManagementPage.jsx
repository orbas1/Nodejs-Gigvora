import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ShieldCheckIcon,
  ServerStackIcon,
} from '@heroicons/react/24/outline';
import DashboardLayout from '../../../layouts/DashboardLayout.jsx';
import useSession from '../../../hooks/useSession.js';
import {
  fetchStorageOverview,
  createStorageLocation,
  updateStorageLocation,
  deleteStorageLocation,
  createLifecycleRule,
  updateLifecycleRule,
  deleteLifecycleRule,
  createUploadPreset,
  updateUploadPreset,
  deleteUploadPreset,
} from '../../../services/adminStorage.js';
import StorageLocationDrawer from '../../../components/admin/storage/StorageLocationDrawer.jsx';
import LifecycleRuleDrawer from '../../../components/admin/storage/LifecycleRuleDrawer.jsx';
import UploadPresetDrawer from '../../../components/admin/storage/UploadPresetDrawer.jsx';
import StorageSummaryPanel from '../../../components/admin/storage/StorageSummaryPanel.jsx';
import StorageLocationsPanel from '../../../components/admin/storage/StorageLocationsPanel.jsx';
import StorageRulesPanel from '../../../components/admin/storage/StorageRulesPanel.jsx';
import StoragePresetsPanel from '../../../components/admin/storage/StoragePresetsPanel.jsx';
import StorageAuditPanel from '../../../components/admin/storage/StorageAuditPanel.jsx';
import { formatRelativeTime } from '../../../utils/date.js';

const TABS = [
  { id: 'summary', label: 'Summary', sectionId: 'storage-summary' },
  { id: 'sites', label: 'Sites', sectionId: 'storage-locations' },
  { id: 'rules', label: 'Rules', sectionId: 'storage-rules' },
  { id: 'presets', label: 'Presets', sectionId: 'storage-presets' },
  { id: 'audit', label: 'Audit', sectionId: 'storage-audit' },
];

const MENU_SECTIONS = [
  {
    id: 'storage',
    label: 'Storage',
    items: TABS.map((tab) => ({ id: tab.id, name: tab.label, sectionId: tab.sectionId })),
  },
  {
    id: 'nav',
    label: 'Nav',
    items: [{ id: 'back', name: 'Back', href: '/dashboard/admin' }],
  },
];

const AVAILABLE_DASHBOARDS = [
  { id: 'admin', label: 'Admin', href: '/dashboard/admin' },
  { id: 'storage', label: 'Storage', href: '/dashboard/admin/storage' },
];

const PROVIDER_LABELS = {
  cloudflare_r2: 'Cloudflare R2',
  aws_s3: 'Amazon S3',
  azure_blob: 'Azure Blob',
  gcp_storage: 'Google Cloud Storage',
  digitalocean_spaces: 'DigitalOcean Spaces',
};

const numberFormatter = new Intl.NumberFormat('en-GB');

function formatNumber(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '0';
  }
  return numberFormatter.format(Math.round(Number(value)));
}

function formatMegabytes(value) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) {
    return '0 MB';
  }
  if (numeric >= 1024) {
    return `${(numeric / 1024).toFixed(1)} GB`;
  }
  return `${numeric.toFixed(0)} MB`;
}

function formatBytes(value) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return '0 B';
  }
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const power = Math.min(Math.floor(Math.log10(numeric) / 3), units.length - 1);
  const scaled = numeric / 10 ** (power * 3);
  return `${scaled.toFixed(power === 0 ? 0 : 1)} ${units[power]}`;
}

function formatDateTime(value) {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function buildProfile(session, overview) {
  const displayName =
    session?.name || [session?.firstName, session?.lastName].filter(Boolean).join(' ').trim() || 'Storage admin';
  const badges = [];
  if (overview?.summary?.totalLocations != null) {
    badges.push(`${formatNumber(overview.summary.totalLocations)} sites`);
  }
  if (overview?.summary?.totalObjects != null) {
    badges.push(`${formatNumber(overview.summary.totalObjects)} files`);
  }
  return {
    name: displayName,
    role: session?.title ?? 'Storage admin',
    initials: displayName
      .split(' ')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('') || 'GV',
    avatarUrl: session?.avatarUrl ?? null,
    status: overview ? `Updated ${formatRelativeTime(new Date())}` : 'Loading…',
    badges,
  };
}

function decorateLocations(locations) {
  return locations.map((location) => {
    const metrics = location.metrics ?? {};
    return {
      ...location,
      providerLabel: PROVIDER_LABELS[location.provider] ?? location.provider,
      metrics: {
        ...metrics,
        usageLabel: formatMegabytes(metrics.currentUsageMb ?? 0),
        objectLabel: `${formatNumber(metrics.objectCount ?? 0)} files`,
        ingestLabel: `${formatBytes(metrics.ingestBytes24h ?? 0)} in`,
        egressLabel: `${formatBytes(metrics.egressBytes24h ?? 0)} out`,
      },
    };
  });
}

function decoratePresets(presets) {
  const formatExpiry = (minutes) => {
    const numeric = Number(minutes ?? 0);
    if (!Number.isFinite(numeric) || numeric <= 0) {
      return 'No expiry';
    }
    if (numeric >= 1440) {
      return `${(numeric / 1440).toFixed(1)} days`;
    }
    if (numeric >= 60) {
      return `${(numeric / 60).toFixed(1)} hours`;
    }
    return `${numeric.toFixed(0)} minutes`;
  };

  return presets.map((preset) => ({
    ...preset,
    maxSizeLabel: formatMegabytes(preset.maxSizeMb ?? 0),
    expiresLabel: formatExpiry(preset.expiresAfterMinutes),
  }));
}

function decorateAuditLog(events) {
  return events.map((event) => {
    const created = event.createdAt ? new Date(event.createdAt) : null;
    let metadataPreview = null;
    if (event.metadata && typeof event.metadata === 'object') {
      const entries = Object.entries(event.metadata)
        .filter(([, value]) => value != null)
        .slice(0, 4);
      if (entries.length) {
        metadataPreview = entries.map(([key, value]) => ({
          label: key,
          value:
            typeof value === 'string'
              ? value
              : Array.isArray(value)
              ? value.join(', ')
              : JSON.stringify(value),
        }));
      }
    }

    return {
      ...event,
      actorLabel: event.actorName || event.actorEmail || 'System',
      timeLabel: created ? formatRelativeTime(created) : '—',
      createdLabel: created ? formatDateTime(created) : '—',
      metadataPreview,
    };
  });
}

export default function AdminStorageManagementPage() {
  const { session } = useSession();
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [refreshIndex, setRefreshIndex] = useState(0);
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const [activeMenuItem, setActiveMenuItem] = useState(TABS[0].id);

  const [locationDrawerOpen, setLocationDrawerOpen] = useState(false);
  const [locationSaving, setLocationSaving] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);

  const [ruleDrawerOpen, setRuleDrawerOpen] = useState(false);
  const [ruleSaving, setRuleSaving] = useState(false);
  const [selectedRule, setSelectedRule] = useState(null);

  const [presetDrawerOpen, setPresetDrawerOpen] = useState(false);
  const [presetSaving, setPresetSaving] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(null);

  const refreshOverview = useCallback(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    fetchStorageOverview(controller.signal)
      .then((data) => {
        setOverview(data);
      })
      .catch((err) => {
        if (err?.name === 'AbortError') {
          return;
        }
        setError(err?.message || 'Could not load storage data.');
      })
      .finally(() => {
        setLoading(false);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const abort = refreshOverview();
    return () => {
      if (typeof abort === 'function') {
        abort();
      }
    };
  }, [refreshOverview, refreshIndex]);

  const handleManualRefresh = () => {
    setStatusMessage('');
    setRefreshIndex((value) => value + 1);
  };

  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
    setActiveMenuItem(tabId);
  }, []);

  const handleMenuSelect = useCallback(
    (itemId) => {
      if (TABS.some((tab) => tab.id === itemId)) {
        handleTabChange(itemId);
      }
    },
    [handleTabChange],
  );

  const closeLocationDrawer = () => {
    if (locationSaving) {
      return;
    }
    setLocationDrawerOpen(false);
    setSelectedLocation(null);
  };

  const handleLocationSubmit = async (payload) => {
    setLocationSaving(true);
    setError('');
    try {
      if (selectedLocation?.id) {
        await updateStorageLocation(selectedLocation.id, payload);
        setStatusMessage('Site updated.');
      } else {
        await createStorageLocation(payload);
        setStatusMessage('Site added.');
      }
      closeLocationDrawer();
      setRefreshIndex((value) => value + 1);
    } catch (err) {
      setError(err?.message || 'Could not save site.');
    } finally {
      setLocationSaving(false);
    }
  };

  const handleLocationDelete = async () => {
    if (!selectedLocation?.id) {
      return;
    }
    const confirmed = window.confirm('Delete this site?');
    if (!confirmed) {
      return;
    }
    setLocationSaving(true);
    setError('');
    try {
      await deleteStorageLocation(selectedLocation.id);
      setStatusMessage('Site removed.');
      closeLocationDrawer();
      setRefreshIndex((value) => value + 1);
    } catch (err) {
      setError(err?.message || 'Could not delete site.');
    } finally {
      setLocationSaving(false);
    }
  };

  const closeRuleDrawer = () => {
    if (ruleSaving) {
      return;
    }
    setRuleDrawerOpen(false);
    setSelectedRule(null);
  };

  const handleRuleSubmit = async (payload) => {
    setRuleSaving(true);
    setError('');
    try {
      if (selectedRule?.id) {
        await updateLifecycleRule(selectedRule.id, payload);
        setStatusMessage('Rule updated.');
      } else {
        await createLifecycleRule(payload);
        setStatusMessage('Rule added.');
      }
      closeRuleDrawer();
      setRefreshIndex((value) => value + 1);
    } catch (err) {
      setError(err?.message || 'Could not save rule.');
    } finally {
      setRuleSaving(false);
    }
  };

  const handleRuleDelete = async () => {
    if (!selectedRule?.id) {
      return;
    }
    const confirmed = window.confirm('Delete this rule?');
    if (!confirmed) {
      return;
    }
    setRuleSaving(true);
    setError('');
    try {
      await deleteLifecycleRule(selectedRule.id);
      setStatusMessage('Rule removed.');
      closeRuleDrawer();
      setRefreshIndex((value) => value + 1);
    } catch (err) {
      setError(err?.message || 'Could not delete rule.');
    } finally {
      setRuleSaving(false);
    }
  };

  const closePresetDrawer = () => {
    if (presetSaving) {
      return;
    }
    setPresetDrawerOpen(false);
    setSelectedPreset(null);
  };

  const handlePresetSubmit = async (payload) => {
    setPresetSaving(true);
    setError('');
    try {
      if (selectedPreset?.id) {
        await updateUploadPreset(selectedPreset.id, payload);
        setStatusMessage('Preset updated.');
      } else {
        await createUploadPreset(payload);
        setStatusMessage('Preset added.');
      }
      closePresetDrawer();
      setRefreshIndex((value) => value + 1);
    } catch (err) {
      setError(err?.message || 'Could not save preset.');
    } finally {
      setPresetSaving(false);
    }
  };

  const handlePresetDelete = async () => {
    if (!selectedPreset?.id) {
      return;
    }
    const confirmed = window.confirm('Delete this preset?');
    if (!confirmed) {
      return;
    }
    setPresetSaving(true);
    setError('');
    try {
      await deleteUploadPreset(selectedPreset.id);
      setStatusMessage('Preset removed.');
      closePresetDrawer();
      setRefreshIndex((value) => value + 1);
    } catch (err) {
      setError(err?.message || 'Could not delete preset.');
    } finally {
      setPresetSaving(false);
    }
  };

  const locations = overview?.locations ?? [];
  const lifecycleRules = overview?.lifecycleRules ?? [];
  const uploadPresets = overview?.uploadPresets ?? [];
  const auditLog = overview?.auditLog ?? [];
  const summary = overview?.summary ?? null;

  const decoratedLocations = useMemo(() => decorateLocations(locations), [locations]);
  const decoratedPresets = useMemo(() => decoratePresets(uploadPresets), [uploadPresets]);
  const decoratedAuditLog = useMemo(() => decorateAuditLog(auditLog), [auditLog]);
  const summaryCards = useMemo(() => {
    if (!summary) {
      return [];
    }
    return [
      {
        label: 'Footprint',
        value: formatMegabytes(summary.totalUsageMb ?? 0),
        helper: `${formatNumber(summary.totalObjects ?? 0)} files`,
        Icon: ServerStackIcon,
      },
      {
        label: 'Sites',
        value: formatNumber(summary.totalLocations ?? 0),
        helper: `${formatNumber(summary.activeLocations ?? 0)} active`,
        Icon: ShieldCheckIcon,
      },
      {
        label: 'Ingest',
        value: formatBytes(summary.ingestBytes24h ?? 0),
        helper: `Out ${formatBytes(summary.egressBytes24h ?? 0)}`,
        Icon: ArrowUpTrayIcon,
      },
      {
        label: 'Errors',
        value: formatNumber(summary.errorCount24h ?? 0),
        helper: 'Last 24h',
        Icon: ArrowDownTrayIcon,
      },
    ];
  }, [summary]);

  const primaryLocation = useMemo(
    () => decoratedLocations.find((location) => location.isPrimary) ?? null,
    [decoratedLocations],
  );

  const locationOptions = useMemo(
    () => locations.map((location) => ({ id: location.id, name: location.name })),
    [locations],
  );

  const profile = useMemo(() => buildProfile(session, overview), [session, overview]);

  const handleOpenLocation = useCallback(
    (locationId) => {
      const location = locations.find((entry) => entry.id === locationId) ?? null;
      setSelectedLocation(location);
      setLocationDrawerOpen(true);
    },
    [locations],
  );

  const handleOpenRule = useCallback(
    (ruleId) => {
      const rule = lifecycleRules.find((entry) => entry.id === ruleId) ?? null;
      setSelectedRule(rule);
      setRuleDrawerOpen(true);
    },
    [lifecycleRules],
  );

  const handleOpenPreset = useCallback(
    (presetId) => {
      const preset = uploadPresets.find((entry) => entry.id === presetId) ?? null;
      setSelectedPreset(preset);
      setPresetDrawerOpen(true);
    },
    [uploadPresets],
  );

  return (
    <DashboardLayout
      currentDashboard="admin"
      title="Storage"
      subtitle="Control storage sites, rules, and uploads."
      menuSections={MENU_SECTIONS}
      availableDashboards={AVAILABLE_DASHBOARDS}
      profile={profile}
      adSurface="admin_dashboard"
      onMenuItemSelect={handleMenuSelect}
      activeMenuItem={activeMenuItem}
    >
      <div className="flex flex-col gap-8">
        {statusMessage ? (
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-700">
            {statusMessage}
          </div>
        ) : null}
        {error ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700">{error}</div>
        ) : null}

        <nav className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1 ${
                activeTab === tab.id
                  ? 'border-transparent bg-accent text-white shadow-sm'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-accent/30 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {activeTab === 'summary' ? (
          <StorageSummaryPanel
            summaryCards={summaryCards}
            loading={loading}
            summary={summary}
            primaryLocation={primaryLocation}
            statusMessage=""
            error=""
            onRefresh={handleManualRefresh}
            onAuditNavigate={() => handleTabChange('audit')}
          />
        ) : null}

        {activeTab === 'sites' ? (
          <StorageLocationsPanel
            locations={decoratedLocations}
            onAdd={() => {
              setSelectedLocation(null);
              setLocationDrawerOpen(true);
            }}
            onOpen={(location) => handleOpenLocation(location.id)}
          />
        ) : null}

        {activeTab === 'rules' ? (
          <StorageRulesPanel
            rules={lifecycleRules}
            onAdd={() => {
              setSelectedRule(null);
              setRuleDrawerOpen(true);
            }}
            onOpen={(rule) => handleOpenRule(rule.id)}
          />
        ) : null}

        {activeTab === 'presets' ? (
          <StoragePresetsPanel
            presets={decoratedPresets}
            onAdd={() => {
              setSelectedPreset(null);
              setPresetDrawerOpen(true);
            }}
            onOpen={(preset) => handleOpenPreset(preset.id)}
          />
        ) : null}

        {activeTab === 'audit' ? <StorageAuditPanel auditLog={decoratedAuditLog} /> : null}
      </div>

      <StorageLocationDrawer
        open={locationDrawerOpen}
        location={selectedLocation}
        onClose={closeLocationDrawer}
        onSubmit={handleLocationSubmit}
        onDelete={handleLocationDelete}
        saving={locationSaving}
      />
      <LifecycleRuleDrawer
        open={ruleDrawerOpen}
        rule={selectedRule}
        locations={locationOptions}
        onClose={closeRuleDrawer}
        onSubmit={handleRuleSubmit}
        onDelete={handleRuleDelete}
        saving={ruleSaving}
      />
      <UploadPresetDrawer
        open={presetDrawerOpen}
        preset={selectedPreset}
        locations={locationOptions}
        onClose={closePresetDrawer}
        onSubmit={handlePresetSubmit}
        onDelete={handlePresetDelete}
        saving={presetSaving}
      />
    </DashboardLayout>
  );
}
