import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowPathIcon,
  ArrowUturnLeftIcon,
  CheckCircleIcon,
  ClockIcon,
  PlusCircleIcon,
} from '@heroicons/react/24/outline';
import DashboardLayout from '../../../layouts/DashboardLayout.jsx';
import GdprDpoCard from '../../../components/admin/gdpr/GdprDpoCard.jsx';
import GdprDataSubjectRequestsCard from '../../../components/admin/gdpr/GdprDataSubjectRequestsCard.jsx';
import GdprRetentionPoliciesCard from '../../../components/admin/gdpr/GdprRetentionPoliciesCard.jsx';
import GdprProcessorsCard from '../../../components/admin/gdpr/GdprProcessorsCard.jsx';
import GdprBreachResponseCard from '../../../components/admin/gdpr/GdprBreachResponseCard.jsx';
import GdprConsentFrameworkCard from '../../../components/admin/gdpr/GdprConsentFrameworkCard.jsx';
import { fetchGdprSettings, updateGdprSettings } from '../../../services/gdprSettings.js';
import { cloneDeep, setNestedValue } from '../../../utils/object.js';

const MENU_SECTIONS = [
  {
    label: 'Privacy governance',
    items: [
      {
        name: 'DPO profile',
        description: 'Contact, availability, and office coverage for the appointed DPO.',
        sectionId: 'gdpr-dpo',
      },
      {
        name: 'Data subject requests',
        description: 'Intake channels, SLAs, and escalation paths for GDPR requests.',
        sectionId: 'gdpr-dsr',
      },
    ],
  },
  {
    label: 'Data lifecycle',
    items: [
      {
        name: 'Retention policies',
        description: 'Lifecycle controls for each personal data category.',
        sectionId: 'gdpr-retention',
      },
      {
        name: 'Processors',
        description: 'Approved processors, transfer mechanisms, and DPA status.',
        sectionId: 'gdpr-processors',
      },
    ],
  },
  {
    label: 'Incident & consent',
    items: [
      {
        name: 'Breach response',
        description: 'Notification windows, incident runbooks, and on-call contacts.',
        sectionId: 'gdpr-breach',
      },
      {
        name: 'Consent & preferences',
        description: 'Opt-in defaults, withdrawal channels, and cookie governance.',
        sectionId: 'gdpr-consent',
      },
    ],
  },
  {
    label: 'Other consoles',
    items: [
      {
        name: 'Admin control tower',
        description: 'Return to the main admin operations dashboard.',
        href: '/dashboard/admin',
      },
    ],
  },
];

const FALLBACK_SETTINGS = {
  dpo: {
    name: 'Jane Calder',
    email: 'privacy@gigvora.com',
    phone: '+44 20 7123 4567',
    officeLocation: 'London, United Kingdom',
    address: 'Gigvora Privacy Office, 20 Bishopsgate, London EC2N 4AG',
    timezone: 'Europe/London',
    availability: 'Monday to Friday, 09:00-17:00 GMT',
  },
  dataSubjectRequests: {
    contactEmail: 'privacy@gigvora.com',
    escalationEmail: 'legal@gigvora.com',
    slaDays: 30,
    automatedIntake: true,
    intakeChannels: ['in-app portal', 'email'],
    privacyPortalUrl: 'https://gigvora.com/privacy-portal',
    exportFormats: ['JSON', 'CSV'],
    statusDashboardUrl: 'https://status.gigvora.com/privacy',
  },
  retentionPolicies: [
    {
      id: 'account-data',
      name: 'Account data',
      dataCategories: ['profile information', 'account security'],
      retentionDays: 730,
      notes: 'Account records are removed 24 months after account closure unless statutory obligations require extension.',
      legalBasis: 'Contractual necessity',
      appliesTo: ['members', 'companies'],
      reviewer: 'Privacy Operations',
      autoDelete: true,
    },
    {
      id: 'analytics-events',
      name: 'Product analytics',
      dataCategories: ['usage telemetry'],
      retentionDays: 365,
      notes: 'Telemetry is aggregated after 12 months and raw events are deleted.',
      legalBasis: 'Legitimate interest',
      appliesTo: ['members'],
      reviewer: 'Data Platform',
      autoDelete: true,
    },
  ],
  processors: [
    {
      id: 'aws',
      name: 'Amazon Web Services',
      purpose: 'Infrastructure hosting',
      dataCategories: ['all data classes'],
      dataTransferMechanism: 'UK IDTA',
      region: 'eu-west-2',
      dpaSigned: true,
      securityReviewDate: '2024-01-12',
      status: 'active',
      contactEmail: 'aws-security@amazon.com',
      subprocessor: false,
    },
    {
      id: 'sendgrid',
      name: 'SendGrid',
      purpose: 'Transactional email delivery',
      dataCategories: ['contact information'],
      dataTransferMechanism: 'SCCs',
      region: 'United States',
      dpaSigned: true,
      securityReviewDate: '2023-11-02',
      status: 'active',
      contactEmail: 'privacy@sendgrid.com',
      subprocessor: true,
    },
  ],
  breachResponse: {
    notificationWindowHours: 72,
    onCallContact: 'security@gigvora.com',
    incidentRunbookUrl: 'https://gigvora.com/runbooks/gdpr-breach',
    tabletopLastRun: '2024-03-18',
    tooling: ['PagerDuty', 'Jira', 'Slack'],
    legalCounsel: 'counsel@gigvora.com',
    communicationsContact: 'press@gigvora.com',
  },
  consentFramework: {
    marketingOptInDefault: false,
    cookieBannerEnabled: true,
    cookieRefreshMonths: 12,
    consentLogRetentionDays: 1095,
    withdrawalChannels: ['privacy portal', 'account settings'],
    guardianContactEmail: 'guardian@gigvora.com',
    cookiePolicyUrl: 'https://gigvora.com/cookie-policy',
    preferenceCenterUrl: 'https://gigvora.com/preferences',
  },
};

function formatRelativeTime(value) {
  if (!value) {
    return 'moments ago';
  }
  const timestamp = new Date(value);
  const diffMs = Date.now() - timestamp.getTime();
  const diffMinutes = Math.round(diffMs / (1000 * 60));
  if (Number.isNaN(diffMinutes) || diffMinutes <= 0) {
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

function createIdentifier(prefix) {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}

export default function AdminGdprSettingsPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(null);
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('');
  const [lastSavedAt, setLastSavedAt] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchGdprSettings();
        if (cancelled) return;
        setSettings(response);
        setDraft(cloneDeep(response));
        setLastSavedAt(response?.updatedAt ?? null);
      } catch (err) {
        if (cancelled) return;
        console.warn('Failed to load GDPR settings, using fallback defaults.', err);
        setError(null);
        setStatus('Loaded fallback GDPR defaults. Connect the API to sync live data.');
        setSettings(FALLBACK_SETTINGS);
        setDraft(cloneDeep(FALLBACK_SETTINGS));
        setLastSavedAt(null);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const dirty = useMemo(() => {
    if (!settings || !draft) {
      return false;
    }
    try {
      return JSON.stringify(settings) !== JSON.stringify(draft);
    } catch (err) {
      console.warn('Failed to compare drafts', err);
      return true;
    }
  }, [settings, draft]);

  const updateDraft = (updater) => {
    setDraft((previous) => {
      const baseSource = previous ?? settings ?? {};
      const base = cloneDeep(baseSource) ?? {};
      return typeof updater === 'function' ? updater(base) : updater;
    });
  };

  const handleFieldChange = (path, value) => {
    updateDraft((current) => setNestedValue(current, path, value));
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);
    setStatus('');
    try {
      const response = await fetchGdprSettings();
      setSettings(response);
      setDraft(cloneDeep(response));
      setLastSavedAt(response?.updatedAt ?? null);
    } catch (err) {
      setError(err?.message || 'Failed to refresh GDPR settings.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleReset = () => {
    if (!settings) {
      return;
    }
    setDraft(cloneDeep(settings));
    setStatus('Draft reset to the last saved GDPR configuration.');
  };

  const handleSave = async () => {
    if (!draft) {
      return;
    }
    setSaving(true);
    setError(null);
    setStatus('');
    try {
      const payload = cloneDeep(draft);
      const response = await updateGdprSettings(payload);
      setSettings(response);
      setDraft(cloneDeep(response));
      setLastSavedAt(response?.updatedAt ?? new Date().toISOString());
      setStatus('GDPR settings saved successfully.');
    } catch (err) {
      setError(err?.message || 'Failed to save GDPR settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddRetentionPolicy = () => {
    updateDraft((current) => {
      const policies = Array.isArray(current.retentionPolicies) ? [...current.retentionPolicies] : [];
      policies.push({
        id: createIdentifier('policy'),
        name: '',
        dataCategories: [],
        retentionDays: 365,
        notes: '',
        legalBasis: '',
        appliesTo: [],
        reviewer: '',
        autoDelete: true,
      });
      return { ...current, retentionPolicies: policies };
    });
  };

  const handleUpdateRetentionPolicy = (policyId, changes) => {
    if (!policyId) return;
    updateDraft((current) => {
      const policies = Array.isArray(current.retentionPolicies) ? current.retentionPolicies.map((policy) =>
          (policy.id === policyId ? { ...policy, ...changes } : policy),
        ) : [];
      return { ...current, retentionPolicies: policies };
    });
  };

  const handleRemoveRetentionPolicy = (policyId) => {
    updateDraft((current) => {
      const policies = Array.isArray(current.retentionPolicies)
        ? current.retentionPolicies.filter((policy) => policy.id !== policyId)
        : [];
      return { ...current, retentionPolicies: policies };
    });
  };

  const handleAddProcessor = () => {
    updateDraft((current) => {
      const processors = Array.isArray(current.processors) ? [...current.processors] : [];
      processors.push({
        id: createIdentifier('processor'),
        name: '',
        purpose: '',
        dataCategories: [],
        dataTransferMechanism: '',
        region: '',
        dpaSigned: true,
        securityReviewDate: '',
        status: 'active',
        contactEmail: '',
        subprocessor: false,
      });
      return { ...current, processors };
    });
  };

  const handleUpdateProcessor = (processorId, changes) => {
    if (!processorId) return;
    updateDraft((current) => {
      const processors = Array.isArray(current.processors)
        ? current.processors.map((processor) =>
            processor.id === processorId ? { ...processor, ...changes } : processor,
          )
        : [];
      return { ...current, processors };
    });
  };

  const handleRemoveProcessor = (processorId) => {
    updateDraft((current) => {
      const processors = Array.isArray(current.processors)
        ? current.processors.filter((processor) => processor.id !== processorId)
        : [];
      return { ...current, processors };
    });
  };

  const disableInputs = loading || saving;

  const summaryMetrics = useMemo(() => {
    const source = draft ?? settings ?? {};
    return [
      {
        label: 'Retention policies',
        value: Array.isArray(source.retentionPolicies) ? source.retentionPolicies.length : 0,
      },
      {
        label: 'Processors',
        value: Array.isArray(source.processors) ? source.processors.length : 0,
      },
      {
        label: 'DSR SLA',
        value: source?.dataSubjectRequests?.slaDays ? `${source.dataSubjectRequests.slaDays} days` : 'Not set',
      },
      {
        label: 'Breach notification',
        value: source?.breachResponse?.notificationWindowHours
          ? `${source.breachResponse.notificationWindowHours} hours`
          : 'Not set',
      },
    ];
  }, [draft, settings]);

  const availableDashboards = useMemo(
    () => [
      { id: 'admin', label: 'Admin Control Tower', href: '/dashboard/admin' },
      { id: 'admin-gdpr', label: 'GDPR Settings', href: '/dashboard/admin/gdpr' },
    ],
    [],
  );

  const handleMenuSelect = (itemId, item) => {
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

  return (
    <DashboardLayout
      currentDashboard="admin-gdpr"
      title="GDPR controls"
      subtitle="Operational privacy governance"
      description="Manage GDPR responsibilities across DPO coverage, data subject workflows, retention policies, processors, and consent orchestration."
      menuSections={MENU_SECTIONS}
      sections={[]}
      availableDashboards={availableDashboards}
      onMenuItemSelect={handleMenuSelect}
    >
      <section className="space-y-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-blue-100/40">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                <CheckCircleIcon className="h-4 w-4" /> GDPR-ready workspace
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-slate-900">GDPR operations cockpit</h1>
                <p className="mt-2 max-w-3xl text-sm text-slate-600">
                  Bring every privacy control together: confirm the DPO record, honour data subject rights within SLA, govern retention, and maintain a live register of processors and breach playbooks.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-wide">
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-600">
                  <ClockIcon className="h-4 w-4" />
                  {loading
                    ? 'Syncing GDPR configuration…'
                    : lastSavedAt
                      ? `Last saved ${formatRelativeTime(lastSavedAt)}`
                      : 'Awaiting first save'}
                </span>
                {dirty ? (
                  <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-700">
                    <PlusCircleIcon className="h-4 w-4" /> Unsaved changes
                  </span>
                ) : null}
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={loading || refreshing}
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" hidden={!refreshing} />
                <ArrowPathIcon className="mr-2 h-4 w-4" aria-hidden="true" hidden={refreshing} />
                {refreshing ? 'Refreshing…' : 'Re-sync data'}
              </button>
              <button
                type="button"
                onClick={handleReset}
                disabled={!dirty || saving || loading}
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <ArrowUturnLeftIcon className="mr-2 h-4 w-4" /> Discard draft
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!dirty || saving || loading}
                className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark disabled:cursor-not-allowed disabled:bg-accent/60"
              >
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
          {error ? (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          ) : null}
          {status ? (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{status}</div>
          ) : null}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {summaryMetrics.map((metric) => (
              <div key={metric.label} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{metric.label}</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{metric.value}</p>
              </div>
            ))}
          </div>
        </div>

        {loading && !draft ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-sm text-slate-500">
            Loading GDPR settings…
          </div>
        ) : (
          <div className="space-y-8">
            <GdprDpoCard
              data={draft?.dpo ?? settings?.dpo ?? {}}
              onChange={(field, value) => handleFieldChange(['dpo', field], value)}
              disabled={disableInputs}
            />
            <div className="grid gap-8 xl:grid-cols-2">
              <GdprDataSubjectRequestsCard
                data={draft?.dataSubjectRequests ?? settings?.dataSubjectRequests ?? {}}
                onChange={(field, value) => handleFieldChange(['dataSubjectRequests', field], value)}
                disabled={disableInputs}
              />
              <GdprBreachResponseCard
                data={draft?.breachResponse ?? settings?.breachResponse ?? {}}
                onChange={(field, value) => handleFieldChange(['breachResponse', field], value)}
                disabled={disableInputs}
              />
            </div>
            <GdprRetentionPoliciesCard
              policies={draft?.retentionPolicies ?? settings?.retentionPolicies ?? []}
              onAddPolicy={handleAddRetentionPolicy}
              onUpdatePolicy={handleUpdateRetentionPolicy}
              onRemovePolicy={handleRemoveRetentionPolicy}
              disabled={disableInputs}
            />
            <GdprProcessorsCard
              processors={draft?.processors ?? settings?.processors ?? []}
              onAddProcessor={handleAddProcessor}
              onUpdateProcessor={handleUpdateProcessor}
              onRemoveProcessor={handleRemoveProcessor}
              disabled={disableInputs}
            />
            <GdprConsentFrameworkCard
              data={draft?.consentFramework ?? settings?.consentFramework ?? {}}
              onChange={(field, value) => handleFieldChange(['consentFramework', field], value)}
              disabled={disableInputs}
            />
          </div>
        )}
      </section>
    </DashboardLayout>
  );
}
