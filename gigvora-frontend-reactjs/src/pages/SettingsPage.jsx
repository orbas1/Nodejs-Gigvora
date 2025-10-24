import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDownTrayIcon,
  BellAlertIcon,
  BoltIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  LockClosedIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import PageHeader from '../components/PageHeader.jsx';
import useSession from '../hooks/useSession.js';
import { fetchUserConsentSnapshot, updateUserConsent } from '../services/consent.js';
import formatDateTime from '../utils/formatDateTime.js';
import ConsentHistoryTimeline from '../components/compliance/ConsentHistoryTimeline.jsx';

function Toggle({ enabled, disabled, onClick, label }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={enabled}
      aria-label={label}
      className={`inline-flex h-7 w-14 items-center rounded-full border transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent
        ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
        ${enabled ? 'border-emerald-400 bg-emerald-500/90 dark:border-emerald-300 dark:bg-emerald-500/80' : 'border-slate-300 bg-slate-200 dark:border-slate-600 dark:bg-slate-700'}
      `}
    >
      <span
        className={`ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-semibold shadow-sm transition-all
          ${enabled ? 'translate-x-6 text-emerald-600' : 'translate-x-0 text-slate-500'}
        `}
      >
        {enabled ? 'ON' : 'OFF'}
      </span>
    </button>
  );
}

function ConsentPreferenceRow({ policy, consent, auditTrail, updating, expanded, onChange, onToggleHistory }) {
  const isRequired = policy.required && !policy.revocable;
  const enabled = consent?.status === 'granted';
  const lastUpdated = consent?.grantedAt ?? consent?.withdrawnAt ?? policy.updatedAt;
  const fallbackGlossary = policy.code ? `/support/glossary/${policy.code.toLowerCase()}` : null;
  const glossaryHref = policy.glossaryUrl || policy.helpUrl || fallbackGlossary;
  const audience = policy.audience ? policy.audience.toUpperCase() : 'GLOBAL';
  const region = policy.region ? policy.region.toUpperCase() : 'ALL';
  const showWarning = policy.required && !enabled;

  return (
    <div
      className={`grid gap-4 rounded-2xl border bg-white/80 p-4 shadow-sm transition dark:border-slate-700 dark:bg-slate-800/80 sm:grid-cols-6 sm:items-start
        ${showWarning ? 'border-amber-300 ring-2 ring-amber-100 dark:border-amber-400 dark:ring-amber-500/20' : 'border-slate-200'}
      `}
    >
      <div className="sm:col-span-2">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{policy.title}</p>
          {glossaryHref ? (
            <a
              href={glossaryHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600 transition hover:border-accent hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
            >
              <InformationCircleIcon className="h-3.5 w-3.5" /> Glossary
            </a>
          ) : null}
        </div>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">Audience: {audience} • Region: {region}</p>
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-400">Legal basis: {policy.legalBasis}</p>
      </div>
      <div className="sm:col-span-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Summary</p>
        <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">{policy.description ?? 'No summary provided.'}</p>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Status</p>
        <div
          className={`mt-1 inline-flex items-center gap-2 text-sm font-medium ${
            enabled ? 'text-slate-900 dark:text-emerald-200' : 'text-amber-700 dark:text-amber-300'
          }`}
        >
          {enabled ? (
            <CheckCircleIcon className="h-4 w-4 text-emerald-500" />
          ) : (
            <ExclamationTriangleIcon className="h-4 w-4 text-amber-500" />
          )}
          {enabled ? 'Granted' : 'Withdrawn'}
        </div>
        {lastUpdated && (
          <p className="text-xs text-slate-500 dark:text-slate-400">Updated {formatDateTime(lastUpdated)}</p>
        )}
      </div>
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onToggleHistory}
          className="text-xs font-semibold uppercase tracking-wide text-accent transition hover:text-accent-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {expanded ? 'Hide history' : 'View history'}
        </button>
        <Toggle
          enabled={enabled}
          disabled={isRequired || updating}
          onClick={() => onChange(!enabled)}
          label={`Toggle consent for ${policy.title}`}
        />
      </div>
      {expanded && (
        <div className="sm:col-span-6">
          <ConsentHistoryTimeline events={auditTrail} />
        </div>
      )}
    </div>
  );
}

function PreferenceCard({ title, description, enabled, onToggle, customControl }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm transition hover:shadow-md dark:border-slate-700 dark:bg-slate-800/90">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{description}</p>
        </div>
        {customControl ? (
          customControl
        ) : (
          <Toggle
            enabled={Boolean(enabled)}
            disabled={!onToggle}
            onClick={() => onToggle?.(!enabled)}
            label={`Toggle ${title}`}
          />
        )}
      </div>
      {customControl ? null : (
        <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
          {enabled ? 'Enabled' : 'Disabled'} • Applies across web, mobile, and integrations
        </p>
      )}
    </div>
  );
}

function SupportCard({ title, description, actionLabel, href }) {
  return (
    <a
      href={href}
      className="group block rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:border-accent hover:bg-white hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent dark:border-slate-700 dark:bg-slate-800/80"
    >
      <p className="text-sm font-semibold text-slate-900 group-hover:text-accent dark:text-slate-100 dark:group-hover:text-accent-light">{title}</p>
      <p className="mt-2 text-xs text-slate-500 dark:text-slate-300">{description}</p>
      <span className="mt-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-accent group-hover:translate-x-1 group-hover:text-accent-dark dark:text-accent-light">
        {actionLabel} →
      </span>
    </a>
  );
}

export default function SettingsPage() {
  const { session } = useSession();
  const userId = session?.id;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [consentRows, setConsentRows] = useState([]);
  const [pending, setPending] = useState({});
  const [outstandingRequired, setOutstandingRequired] = useState(0);
  const [expandedRows, setExpandedRows] = useState({});
  const [toast, setToast] = useState(null);
  const toastTimeoutRef = useRef(null);
  const [selectedTab, setSelectedTab] = useState('privacy');
  const [notificationPrefs, setNotificationPrefs] = useState({
    emailDigest: true,
    smsSecurity: false,
    slackAlerts: true,
  });
  const [securityPrefs, setSecurityPrefs] = useState({
    sessionTimeout: '30',
    biometrics: false,
    deviceApprovals: true,
  });
  const [aiPrefs, setAiPrefs] = useState({
    personalisedMatches: true,
    aiSummaries: true,
    dataSharing: false,
  });

  const loadSnapshot = useCallback(async () => {
    if (!userId) {
      return { policies: [], outstandingRequired: 0 };
    }
    const snapshot = await fetchUserConsentSnapshot(userId, {});
    return {
      policies: snapshot.policies ?? [],
      outstandingRequired: snapshot.outstandingRequired ?? 0,
    };
  }, [userId]);

  useEffect(() => {
    let cancelled = false;
    async function hydrate() {
      setLoading(true);
      setError(null);
      try {
        const snapshot = await loadSnapshot();
        if (!cancelled) {
          setConsentRows(snapshot.policies);
          setOutstandingRequired(snapshot.outstandingRequired);
          setExpandedRows((state) => {
            const next = {};
            snapshot.policies.forEach(({ policy }) => {
              next[policy.code] = Boolean(state[policy.code]);
            });
            return next;
          });
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError.message ?? 'Unable to load privacy preferences.');
          setConsentRows([]);
          setOutstandingRequired(0);
          setExpandedRows({});
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    hydrate();
    return () => {
      cancelled = true;
    };
  }, [loadSnapshot]);

  const calculateOutstanding = useCallback((rows) => {
    if (!rows.length) return 0;
    return rows.reduce((count, entry) => {
      const { policy, consent } = entry;
      if (!policy?.required) {
        return count;
      }
      return consent?.status === 'granted' ? count : count + 1;
    }, 0);
  }, []);

  const summary = useMemo(() => {
    if (!consentRows.length) {
      return { granted: 0, total: 0, outstandingRequired };
    }
    const granted = consentRows.filter((entry) => entry.consent?.status === 'granted').length;
    return { granted, total: consentRows.length, outstandingRequired };
  }, [consentRows, outstandingRequired]);

  const announcePreferenceUpdate = useCallback((message, tone = 'success') => {
    setToast({ tone, message });
  }, []);

  const handleConsentChange = async (policyCode, shouldGrant) => {
    if (!userId) return;
    setError(null);
    setPending((state) => ({ ...state, [policyCode]: true }));

    const previousRows = consentRows;
    const optimisticRows = consentRows.map((entry) => {
      if (entry.policy.code !== policyCode) return entry;
      const timestamp = new Date().toISOString();
      const nextConsent = {
        ...(entry.consent || {}),
        status: shouldGrant ? 'granted' : 'withdrawn',
        grantedAt: shouldGrant ? timestamp : entry.consent?.grantedAt ?? null,
        withdrawnAt: shouldGrant ? null : timestamp,
      };
      return {
        ...entry,
        consent: nextConsent,
      };
    });

    setConsentRows(optimisticRows);
    setOutstandingRequired(calculateOutstanding(optimisticRows));

    try {
      await updateUserConsent(userId, policyCode, {
        status: shouldGrant ? 'granted' : 'withdrawn',
        source: 'web_settings',
        metadata: { surface: 'settings_privacy' },
      });
      const snapshot = await loadSnapshot();
      setConsentRows(snapshot.policies);
      setOutstandingRequired(snapshot.outstandingRequired);
      setExpandedRows((state) => {
        const next = {};
        snapshot.policies.forEach(({ policy }) => {
          next[policy.code] = Boolean(state[policy.code]);
        });
        return next;
      });
      announcePreferenceUpdate(
        shouldGrant ? 'Consent granted successfully.' : 'Consent withdrawn successfully.',
        'success',
      );
    } catch (updateError) {
      setConsentRows(previousRows);
      setOutstandingRequired(calculateOutstanding(previousRows));
      setError(updateError.message ?? 'Failed to update consent.');
      announcePreferenceUpdate('We could not update that preference. Please try again.', 'error');
    } finally {
      setPending((state) => ({ ...state, [policyCode]: false }));
    }
  };

  const toggleHistory = (policyCode) => {
    setExpandedRows((state) => ({ ...state, [policyCode]: !state[policyCode] }));
  };

  useEffect(() => {
    if (!toast?.message) return undefined;
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = setTimeout(() => setToast(null), 4000);
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, [toast]);

  const preferenceTabs = useMemo(
    () => [
      { key: 'privacy', label: 'Privacy & Consent', description: 'Manage legal agreements, trust signals, and consent history.', icon: ShieldCheckIcon },
      { key: 'notifications', label: 'Notifications', description: 'Control digests, alerts, and escalation channels across Gigvora.', icon: BellAlertIcon },
      { key: 'security', label: 'Security & Sessions', description: 'Review login protections, trusted devices, and timeouts.', icon: LockClosedIcon },
      { key: 'ai', label: 'AI & Recommendations', description: 'Decide how AI copilots personalise your experience and data usage.', icon: BoltIcon },
      { key: 'data', label: 'Data Export & Retention', description: 'Request exports, review retention timelines, and download archives.', icon: ArrowDownTrayIcon },
    ],
    [],
  );

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'notifications':
        return (
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Configure how Gigvora reaches you about new opportunities, compliance reminders, and workspace activity. Changes apply instantly across devices.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <PreferenceCard
                title="Weekly email digest"
                description="Summaries of invitations, saved jobs, and marketplace insights delivered each Monday."
                enabled={notificationPrefs.emailDigest}
                onToggle={(value) => {
                  setNotificationPrefs((prev) => ({ ...prev, emailDigest: value }));
                  announcePreferenceUpdate(value ? 'Email digest enabled.' : 'Email digest disabled.');
                }}
              />
              <PreferenceCard
                title="Security SMS alerts"
                description="Receive text messages when a new device signs in or sensitive settings change."
                enabled={notificationPrefs.smsSecurity}
                onToggle={(value) => {
                  setNotificationPrefs((prev) => ({ ...prev, smsSecurity: value }));
                  announcePreferenceUpdate(value ? 'Security SMS alerts enabled.' : 'Security SMS alerts disabled.');
                }}
              />
              <PreferenceCard
                title="Slack workspace notifications"
                description="Send high-priority project escalations into your linked Slack workspace."
                enabled={notificationPrefs.slackAlerts}
                onToggle={(value) => {
                  setNotificationPrefs((prev) => ({ ...prev, slackAlerts: value }));
                  announcePreferenceUpdate(value ? 'Slack alerts enabled.' : 'Slack alerts disabled.');
                }}
              />
            </div>
          </div>
        );
      case 'security':
        return (
          <div className="space-y-6">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Strengthen how Gigvora protects your account. Security controls sync with the trust centre and apply to all dashboards you can access.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <PreferenceCard
                title="Session timeout"
                description="Automatically sign out after periods of inactivity to prevent misuse on shared devices."
                customControl={
                  <select
                    value={securityPrefs.sessionTimeout}
                    onChange={(event) => {
                      setSecurityPrefs((prev) => ({ ...prev, sessionTimeout: event.target.value }));
                      announcePreferenceUpdate(`Session timeout set to ${event.target.value} minutes.`);
                    }}
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="60">60 minutes</option>
                  </select>
                }
              />
              <PreferenceCard
                title="Biometric approvals"
                description="Require Touch ID, Face ID, or Windows Hello confirmation before processing payouts or exporting data."
                enabled={securityPrefs.biometrics}
                onToggle={(value) => {
                  setSecurityPrefs((prev) => ({ ...prev, biometrics: value }));
                  announcePreferenceUpdate(value ? 'Biometric approvals enabled.' : 'Biometric approvals disabled.');
                }}
              />
              <PreferenceCard
                title="Trusted device approvals"
                description="Receive a push notification when unknown browsers attempt to log in."
                enabled={securityPrefs.deviceApprovals}
                onToggle={(value) => {
                  setSecurityPrefs((prev) => ({ ...prev, deviceApprovals: value }));
                  announcePreferenceUpdate(value ? 'Trusted device alerts enabled.' : 'Trusted device alerts disabled.');
                }}
              />
            </div>
          </div>
        );
      case 'ai':
        return (
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Decide how Gigvora AI copilots personalise timelines, recommendations, and analytics surfaced across your workspaces.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <PreferenceCard
                title="Personalised opportunity matches"
                description="Use your skills, goals, and consented data to pre-rank gigs, projects, and launchpad roles."
                enabled={aiPrefs.personalisedMatches}
                onToggle={(value) => {
                  setAiPrefs((prev) => ({ ...prev, personalisedMatches: value }));
                  announcePreferenceUpdate(value ? 'Personalised matches enabled.' : 'Personalised matches disabled.');
                }}
              />
              <PreferenceCard
                title="AI meeting summaries"
                description="Summaries appear after calls you join via Gigvora, helping keep your team aligned."
                enabled={aiPrefs.aiSummaries}
                onToggle={(value) => {
                  setAiPrefs((prev) => ({ ...prev, aiSummaries: value }));
                  announcePreferenceUpdate(value ? 'AI meeting summaries enabled.' : 'AI meeting summaries disabled.');
                }}
              />
              <PreferenceCard
                title="Share anonymised insights"
                description="Allow Gigvora to contribute anonymised usage signals to improve fairness and quality."
                enabled={aiPrefs.dataSharing}
                onToggle={(value) => {
                  setAiPrefs((prev) => ({ ...prev, dataSharing: value }));
                  announcePreferenceUpdate(value ? 'Anonymised insights sharing enabled.' : 'Anonymised insights sharing disabled.');
                }}
              />
            </div>
          </div>
        );
      case 'data':
        return (
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Export your data or review how long Gigvora retains artefacts linked to your account. Requests generate compliance tickets automatically.
            </p>
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/90">
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Request data export</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  Download a portable archive that includes posts, messages, invoices, and telemetry trails. We will notify you via email when the archive is ready.
                </p>
                <button
                  type="button"
                  onClick={() => announcePreferenceUpdate('Data export request submitted. Compliance will respond shortly.', 'info')}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-accent-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  <ArrowDownTrayIcon className="h-5 w-5" /> Submit request
                </button>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/90">
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Retention schedule</h3>
                <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  <li><span className="font-semibold text-slate-800 dark:text-slate-100">Invoices & escrow:</span> 7 years (financial regulations)</li>
                  <li><span className="font-semibold text-slate-800 dark:text-slate-100">Messages & calls:</span> 24 months rolling window</li>
                  <li><span className="font-semibold text-slate-800 dark:text-slate-100">AI training telemetry:</span> 18 months with anonymisation</li>
                </ul>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="space-y-6">
            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/70 dark:bg-red-500/10 dark:text-red-200">
                {error}
              </div>
            )}

            {loading ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {[...Array(4)].map((_, index) => (
                  <div key={index} className="h-24 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-700/60" />
                ))}
              </div>
            ) : consentRows.length ? (
              <div className="space-y-4">
                {consentRows.map(({ policy, consent, auditTrail }) => (
                  <ConsentPreferenceRow
                    key={policy.id}
                    policy={policy}
                    consent={consent}
                    auditTrail={auditTrail}
                    expanded={Boolean(expandedRows[policy.code])}
                    updating={Boolean(pending[policy.code])}
                    onChange={(shouldGrant) => handleConsentChange(policy.code, shouldGrant)}
                    onToggleHistory={() => toggleHistory(policy.code)}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
                Consent preferences will appear once policies are published for your persona and region. Contact support if you believe a policy is missing.
              </div>
            )}
          </div>
        );
    }
  };

  const resolveToastIcon = () => {
    if (toast?.tone === 'error') {
      return ExclamationTriangleIcon;
    }
    if (toast?.tone === 'info') {
      return InformationCircleIcon;
    }
    return CheckCircleIcon;
  };

  const ActiveToastIcon = resolveToastIcon();

  return (
    <section className="relative overflow-hidden py-20">
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(191,219,254,0.35),_transparent_65%)] dark:bg-[radial-gradient(circle_at_top,_rgba(30,41,59,0.55),_transparent_65%)]"
        aria-hidden="true"
      />
      <div className="absolute -right-16 bottom-8 h-64 w-64 rounded-full bg-accent/10 blur-[120px]" aria-hidden="true" />
      <div className="relative mx-auto max-w-5xl px-6">
        <PageHeader
          eyebrow="Workspace"
          title="Account settings"
          description="Manage security controls, notification delivery, and the privacy consents that govern how Gigvora communicates with you."
        />

        <div className="mt-6">
          {toast?.message ? (
            <div
              role="status"
              aria-live="assertive"
              className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold shadow transition ${
                toast.tone === 'error'
                  ? 'border border-red-300 bg-red-50 text-red-700 dark:border-red-500/60 dark:bg-red-500/10 dark:text-red-200'
                  : toast.tone === 'info'
                    ? 'border border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/60 dark:bg-sky-500/10 dark:text-sky-200'
                    : 'border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/60 dark:bg-emerald-500/10 dark:text-emerald-200'
              }`}
            >
              <ActiveToastIcon className="h-5 w-5" />
              <span>{toast.message}</span>
            </div>
          ) : null}
        </div>

        <div className="mt-6 grid gap-8">
          <section className="rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-soft dark:border-slate-700 dark:bg-slate-900/80">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Privacy centre</p>
                <h2 className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100">Consent & communication preferences</h2>
                <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
                  Gigvora maintains granular GDPR consents so you decide which experiences—such as marketing newsletters or beta invites—you wish to receive. Required policies stay locked to preserve contractual and security obligations.
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:border-emerald-500/60 dark:bg-emerald-500/10 dark:text-emerald-200">
                  <ShieldCheckIcon className="mr-2 inline h-4 w-4" /> {summary.granted} of {summary.total} preferences enabled
                </div>
                <div
                  className={`rounded-2xl px-4 py-3 text-xs font-semibold uppercase tracking-wide ${
                    summary.outstandingRequired
                      ? 'border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/60 dark:bg-amber-500/10 dark:text-amber-200'
                      : 'border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/60 dark:bg-emerald-500/10 dark:text-emerald-200'
                  }`}
                >
                  <ExclamationTriangleIcon className="mr-2 inline h-4 w-4" />
                  {summary.outstandingRequired
                    ? `${summary.outstandingRequired} required policies pending`
                    : 'All required policies granted'}
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <div className="flex flex-wrap gap-2" role="tablist" aria-label="Account preference categories">
                {preferenceTabs.map((tab) => {
                  const Icon = tab.icon;
                  const active = selectedTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setSelectedTab(tab.key)}
                      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                        active
                          ? 'border-accent bg-accent text-white shadow-sm'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <div role="tabpanel" className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/90">
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  {preferenceTabs.find((tab) => tab.key === selectedTab)?.label ?? ''}
                </h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  {preferenceTabs.find((tab) => tab.key === selectedTab)?.description ?? ''}
                </p>
                <div className="mt-6">{renderTabContent()}</div>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-soft dark:border-slate-700 dark:bg-slate-900/80">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Workspace support & escalation</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Need human support? Use these quick links to raise tickets, review audit trails, or connect with your customer partner for bespoke privacy requests.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <SupportCard
                title="Contact compliance team"
                description="Escalate urgent trust, safety, or legal questions."
                actionLabel="Open request"
                href="/support/compliance"
              />
              <SupportCard
                title="View audit logs"
                description="Review sign-ins, consent changes, and device approvals in real time."
                actionLabel="Open audit centre"
                href="/trust/audit"
              />
              <SupportCard
                title="Workspace access help"
                description="Request new seats, agency delegation, or recruiter licenses."
                actionLabel="Request access"
                href="/support/access"
              />
              <SupportCard
                title="Policy knowledge base"
                description="Browse documentation covering data handling, AI ethics, and retention."
                actionLabel="View docs"
                href="/docs/policy"
              />
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
