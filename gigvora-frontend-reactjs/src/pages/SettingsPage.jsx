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
import { fetchNotificationPreferences, updateNotificationPreferences } from '../services/notificationCenter.js';
import { fetchSecurityPreferences, updateSecurityPreferences } from '../services/securityPreferences.js';
import { fetchUserAiSettings, updateUserAiSettings } from '../services/userAiSettings.js';
import { listDataExportRequests, createDataExportRequest } from '../services/privacy.js';
import formatDateTime from '../utils/formatDateTime.js';
import ConsentHistoryTimeline from '../components/compliance/ConsentHistoryTimeline.jsx';

const identityStatusLabels = {
  verified: 'Verified',
  submitted: 'Submitted',
  in_review: 'In review',
  pending: 'Not started',
  expired: 'Expired',
  rejected: 'Declined',
};

const documentBadgeStyles = {
  complete: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  missing: 'bg-amber-50 text-amber-700 border border-amber-200',
};

function formatIdentityStatus(status) {
  if (!status) {
    return identityStatusLabels.pending;
  }
  const normalised = identityStatusLabels[status] ?? status.replace(/_/g, ' ');
  return normalised.charAt(0).toUpperCase() + normalised.slice(1);
}

function buildDocumentBadge(label, available) {
  return (
    <span
      key={label}
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
        available ? documentBadgeStyles.complete : documentBadgeStyles.missing
      }`}
    >
      {available ? '✓' : '!'} {label}
    </span>
  );
}

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

function PreferenceCard({ title, description, enabled, onToggle, customControl, disabled = false }) {
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
            disabled={disabled || !onToggle}
            onClick={() => {
              if (!disabled) {
                onToggle?.(!enabled);
              }
            }}
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
    emailDigest: false,
    smsSecurity: false,
    slackAlerts: false,
    digestFrequency: 'immediate',
    metadata: {},
  });
  const [notificationSaving, setNotificationSaving] = useState(false);
  const [securityPrefs, setSecurityPrefs] = useState({
    sessionTimeoutMinutes: 30,
    biometricApprovalsEnabled: false,
    deviceApprovalsEnabled: true,
    identity: null,
    insights: { score: 50, label: 'Fair', identityStatus: 'pending', recommendations: [] },
  });
  const [securitySaving, setSecuritySaving] = useState(false);
  const [aiPrefs, setAiPrefs] = useState({
    personalisedMatches: true,
    meetingSummaries: true,
    anonymisedInsights: true,
  });
  const [aiSaving, setAiSaving] = useState(false);
  const [dataExports, setDataExports] = useState([]);
  const [exportPending, setExportPending] = useState(false);
  const [exportError, setExportError] = useState(null);

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

  const loadAccountPreferences = useCallback(async () => {
    if (!userId) {
      return {
        notifications: null,
        notificationError: null,
        security: null,
        securityError: null,
        ai: null,
        aiError: null,
        exports: [],
        exportError: null,
      };
    }

    const [notificationResult, securityResult, aiResult, exportResult] = await Promise.allSettled([
      fetchNotificationPreferences(userId),
      fetchSecurityPreferences(userId),
      fetchUserAiSettings(userId),
      listDataExportRequests(userId),
    ]);

    const normaliseError = (result, fallback) => {
      if (result.status !== 'rejected') {
        return null;
      }
      const reason = result.reason;
      if (reason?.name === 'AbortError') {
        return null;
      }
      return reason?.message ?? fallback;
    };

    const notifications = notificationResult.status === 'fulfilled' ? notificationResult.value : null;
    const notificationError = normaliseError(notificationResult, 'Unable to load notification preferences.');
    const security = securityResult.status === 'fulfilled' ? securityResult.value : null;
    const securityError = normaliseError(securityResult, 'Unable to load security preferences.');
    const ai = aiResult.status === 'fulfilled' ? aiResult.value : null;
    const aiError = normaliseError(aiResult, 'Unable to load AI preferences.');
    const exportsPayload = exportResult.status === 'fulfilled' ? exportResult.value ?? {} : {};
    const exports = Array.isArray(exportsPayload?.items) ? exportsPayload.items : [];
    const exportError = normaliseError(exportResult, 'Unable to load data export history.');

    return {
      notifications,
      notificationError,
      security,
      securityError,
      ai,
      aiError,
      exports,
      exportError,
    };
  }, [userId]);

  const normaliseNotificationState = (payload) => {
    if (!payload || typeof payload !== 'object') {
      return {
        emailDigest: false,
        smsSecurity: false,
        slackAlerts: false,
        digestFrequency: 'immediate',
        metadata: {},
      };
    }
    const metadata = payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : {};
    const slackAlerts =
      metadata.slackAlerts != null
        ? Boolean(metadata.slackAlerts)
        : Array.isArray(metadata.channels)
          ? metadata.channels.includes('slack')
          : false;
    return {
      emailDigest: String(payload.digestFrequency ?? '').toLowerCase() === 'weekly',
      smsSecurity: payload.smsEnabled === true,
      slackAlerts,
      digestFrequency: payload.digestFrequency ?? 'immediate',
      metadata,
    };
  };

  const normaliseSecurityState = (payload) => {
    const identityPayload = payload?.identity ?? null;
    const identity = identityPayload
      ? {
          status: identityPayload.status ?? 'pending',
          submitted: Boolean(identityPayload.submitted),
          verificationProvider: identityPayload.verificationProvider ?? 'manual_review',
          submittedAt: identityPayload.submittedAt ?? null,
          reviewedAt: identityPayload.reviewedAt ?? null,
          expiresAt: identityPayload.expiresAt ?? null,
          lastUpdated: identityPayload.lastUpdated ?? null,
          reviewerId: identityPayload.reviewerId ?? null,
          declinedReason: identityPayload.declinedReason ?? null,
          complianceFlags: Array.isArray(identityPayload.complianceFlags)
            ? identityPayload.complianceFlags
            : [],
          documents: {
            frontUploaded: Boolean(identityPayload.documents?.frontUploaded),
            backUploaded: Boolean(identityPayload.documents?.backUploaded),
            selfieUploaded: Boolean(identityPayload.documents?.selfieUploaded),
          },
          nextActions: Array.isArray(identityPayload.nextActions) ? identityPayload.nextActions : [],
          reviewSlaHours: identityPayload.reviewSlaHours ?? null,
          supportContact: identityPayload.supportContact ?? null,
        }
      : null;

    const insightsPayload = payload?.insights ?? null;
    const insights = insightsPayload
      ? {
          score: Number.isFinite(Number(insightsPayload.score))
            ? Number(insightsPayload.score)
            : 0,
          label: insightsPayload.label ?? 'Fair',
          identityStatus: insightsPayload.identityStatus ?? identity?.status ?? 'pending',
          recommendations: Array.isArray(insightsPayload.recommendations)
            ? insightsPayload.recommendations
            : [],
        }
      : {
          score: 50,
          label: 'Fair',
          identityStatus: identity?.status ?? 'pending',
          recommendations: [],
        };

    return {
      sessionTimeoutMinutes: Number.isFinite(payload?.sessionTimeoutMinutes)
        ? payload.sessionTimeoutMinutes
        : 30,
      biometricApprovalsEnabled: Boolean(payload?.biometricApprovalsEnabled),
      deviceApprovalsEnabled: payload?.deviceApprovalsEnabled !== false,
      identity,
      insights,
    };
  };

  const normaliseAiState = (payload) => {
    const experience = payload?.experiencePreferences && typeof payload.experiencePreferences === 'object'
      ? payload.experiencePreferences
      : {};
    return {
      personalisedMatches: experience.personalisedMatches !== false,
      meetingSummaries: experience.meetingSummaries !== false,
      anonymisedInsights: experience.anonymisedInsights !== false,
    };
  };

  useEffect(() => {
    let cancelled = false;
    async function hydrate() {
      setLoading(true);
      setError(null);
      try {
        const [snapshot, preferencePayload] = await Promise.all([
          loadSnapshot(),
          loadAccountPreferences(),
        ]);
        if (cancelled) {
          return;
        }

        setConsentRows(snapshot.policies);
        setOutstandingRequired(snapshot.outstandingRequired);
        setExpandedRows((state) => {
          const next = {};
          snapshot.policies.forEach(({ policy }) => {
            next[policy.code] = Boolean(state[policy.code]);
          });
          return next;
        });

        if (preferencePayload.notifications) {
          setNotificationPrefs(normaliseNotificationState(preferencePayload.notifications));
        }
        if (preferencePayload.security) {
          setSecurityPrefs(normaliseSecurityState(preferencePayload.security));
        }
        if (preferencePayload.ai) {
          setAiPrefs(normaliseAiState(preferencePayload.ai));
        }
        setDataExports(preferencePayload.exports ?? []);
        setExportError(preferencePayload.exportError);

        const aggregatedErrors = [
          preferencePayload.notificationError,
          preferencePayload.securityError,
          preferencePayload.aiError,
        ].filter(Boolean);
        if (aggregatedErrors.length) {
          setError((prev) => prev ?? aggregatedErrors[0]);
        }
        if (preferencePayload.exportError && !aggregatedErrors.length) {
          setError((prev) => prev ?? preferencePayload.exportError);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError.message ?? 'Unable to load privacy preferences.');
          setConsentRows([]);
          setOutstandingRequired(0);
          setExpandedRows({});
          setDataExports([]);
          setExportError(loadError.message ?? 'Unable to load data export history.');
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
  }, [loadSnapshot, loadAccountPreferences]);

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

  const buildNotificationPayload = (state) => ({
    digestFrequency: state.emailDigest ? 'weekly' : 'immediate',
    smsEnabled: state.smsSecurity,
    metadata: {
      ...(state.metadata ?? {}),
      slackAlerts: state.slackAlerts,
    },
  });

  const handleNotificationToggle = async (key, nextValue, successMessage) => {
    if (!userId) return;
    const previous = notificationPrefs;
    const updated = { ...previous, [key]: nextValue };
    setNotificationPrefs(updated);
    setNotificationSaving(true);
    try {
      const response = await updateNotificationPreferences(userId, buildNotificationPayload(updated));
      setNotificationPrefs(normaliseNotificationState(response));
      if (successMessage) {
        announcePreferenceUpdate(successMessage, 'success');
      }
    } catch (prefError) {
      setNotificationPrefs(previous);
      setError(prefError.message ?? 'Unable to update notification preferences.');
      announcePreferenceUpdate('We could not update notification preferences. Try again shortly.', 'error');
    } finally {
      setNotificationSaving(false);
    }
  };

  const handleSecurityPreferenceChange = async (changes, successMessage) => {
    if (!userId) return;
    const previous = securityPrefs;
    const updated = { ...previous, ...changes };
    setSecurityPrefs(updated);
    setSecuritySaving(true);
    try {
      const response = await updateSecurityPreferences(userId, {
        sessionTimeoutMinutes: updated.sessionTimeoutMinutes,
        biometricApprovalsEnabled: updated.biometricApprovalsEnabled,
        deviceApprovalsEnabled: updated.deviceApprovalsEnabled,
      });
      setSecurityPrefs(normaliseSecurityState(response));
      if (successMessage) {
        announcePreferenceUpdate(successMessage, 'success');
      }
    } catch (securityError) {
      setSecurityPrefs(previous);
      setError(securityError.message ?? 'Unable to update security preferences.');
      announcePreferenceUpdate('We could not update that security preference. Try again.', 'error');
    } finally {
      setSecuritySaving(false);
    }
  };

  const handleAiToggle = async (key, nextValue, successMessage) => {
    if (!userId) return;
    const previous = aiPrefs;
    const updated = { ...previous, [key]: nextValue };
    setAiPrefs(updated);
    setAiSaving(true);
    try {
      const response = await updateUserAiSettings(userId, {
        experiencePreferences: {
          personalisedMatches: updated.personalisedMatches,
          meetingSummaries: updated.meetingSummaries,
          anonymisedInsights: updated.anonymisedInsights,
        },
      });
      setAiPrefs(normaliseAiState(response));
      if (successMessage) {
        announcePreferenceUpdate(successMessage, 'success');
      }
    } catch (aiError) {
      setAiPrefs(previous);
      setError(aiError.message ?? 'Unable to update AI preferences.');
      announcePreferenceUpdate('We could not update that AI preference. Try again later.', 'error');
    } finally {
      setAiSaving(false);
    }
  };

  const handleCreateExport = async () => {
    if (!userId) return;
    setExportPending(true);
    setExportError(null);
    try {
      const request = await createDataExportRequest(userId, {
        format: 'zip',
        includeInvoices: true,
        includeMessages: true,
      });
      setDataExports((previousRequests) => [request, ...previousRequests]);
      announcePreferenceUpdate(
        'Data export request submitted. We will email you when the archive is ready.',
        'info',
      );
    } catch (exportErr) {
      const message = exportErr?.message ?? 'Unable to request a data export right now.';
      setExportError(message);
      announcePreferenceUpdate('We could not queue a data export right now.', 'error');
    } finally {
      setExportPending(false);
    }
  };

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

  const identitySummary = securityPrefs.identity;
  const securityInsights = securityPrefs.insights ?? {
    score: 50,
    label: 'Fair',
    identityStatus: identitySummary?.status ?? 'pending',
    recommendations: [],
  };

  const identityDocuments = identitySummary
    ? [
        { label: 'Front ID', available: identitySummary.documents?.frontUploaded },
        { label: 'Back ID', available: identitySummary.documents?.backUploaded },
        { label: 'Selfie', available: identitySummary.documents?.selfieUploaded },
      ]
    : [];

  const identityTimeline = identitySummary
    ? [
        identitySummary.submittedAt
          ? { label: 'Submitted', value: formatDateTime(identitySummary.submittedAt) }
          : null,
        identitySummary.reviewedAt
          ? { label: 'Reviewed', value: formatDateTime(identitySummary.reviewedAt) }
          : null,
        identitySummary.expiresAt
          ? { label: 'Expires', value: formatDateTime(identitySummary.expiresAt) }
          : null,
        identitySummary.lastUpdated && !identitySummary.reviewedAt
          ? { label: 'Last updated', value: formatDateTime(identitySummary.lastUpdated) }
          : null,
      ].filter(Boolean)
    : [];

  const identityDescription = (() => {
    if (!identitySummary) {
      return 'Identity verification has not been initiated. Upload documents to unlock premium trust signals and compliance-ready workspaces.';
    }
    if (identitySummary.status === 'verified') {
      return "Identity checks are verified and synced with Gigvora's trust centre across all workspaces.";
    }
    if (identitySummary.status === 'rejected') {
      return identitySummary.declinedReason
        ? `Action required: ${identitySummary.declinedReason}`
        : 'Compliance flagged issues. Update your documents and resubmit to proceed.';
    }
    if (identitySummary.submitted) {
      return 'Submission received. Compliance specialists typically review within the agreed SLA window.';
    }
    return 'Provide personal details and upload your ID, address proof, and selfie to start verification.';
  })();

  const identityStatusLabel = formatIdentityStatus(identitySummary?.status);

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
                disabled={notificationSaving}
                onToggle={(value) =>
                  handleNotificationToggle(
                    'emailDigest',
                    value,
                    value ? 'Email digest enabled.' : 'Email digest disabled.',
                  )
                }
              />
              <PreferenceCard
                title="Security SMS alerts"
                description="Receive text messages when a new device signs in or sensitive settings change."
                enabled={notificationPrefs.smsSecurity}
                disabled={notificationSaving}
                onToggle={(value) =>
                  handleNotificationToggle(
                    'smsSecurity',
                    value,
                    value ? 'Security SMS alerts enabled.' : 'Security SMS alerts disabled.',
                  )
                }
              />
              <PreferenceCard
                title="Slack workspace notifications"
                description="Send high-priority project escalations into your linked Slack workspace."
                enabled={notificationPrefs.slackAlerts}
                disabled={notificationSaving}
                onToggle={(value) =>
                  handleNotificationToggle(
                    'slackAlerts',
                    value,
                    value ? 'Slack alerts enabled.' : 'Slack alerts disabled.',
                  )
                }
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
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
              <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/80">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Security health</p>
                    <div className="mt-3 flex items-baseline gap-3">
                      <span className="text-5xl font-semibold text-slate-900 dark:text-slate-100">
                        {Math.round(securityInsights.score)}
                      </span>
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:border-slate-600 dark:bg-slate-700/60 dark:text-slate-200">
                        {securityInsights.label}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                      {securityInsights.identityStatus === 'verified'
                        ? 'Enterprise-ready controls are active. Continue monitoring login activity and document renewals.'
                        : 'Review these recommendations to unlock full trust signals and reduce account takeover risk.'}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-600 dark:border-slate-600 dark:bg-slate-700/60 dark:text-slate-200">
                      {formatIdentityStatus(securityInsights.identityStatus)}
                    </span>
                    <span>
                      Session timeout: {securityPrefs.sessionTimeoutMinutes}m
                    </span>
                  </div>
                </div>
                {securityInsights.recommendations.length ? (
                  <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                    {securityInsights.recommendations.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/60"
                      >
                        <span className="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-accent" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/60 dark:bg-emerald-500/10 dark:text-emerald-200">
                    All critical safeguards are active and monitored.
                  </p>
                )}
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/80">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Identity verification</p>
                <h4 className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">{identityStatusLabel}</h4>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{identityDescription}</p>
                {identityTimeline.length ? (
                  <dl className="mt-4 space-y-2 text-xs text-slate-500 dark:text-slate-300">
                    {identityTimeline.map((entry) => (
                      <div key={`${entry.label}-${entry.value}`} className="flex items-center justify-between">
                        <dt className="font-semibold uppercase tracking-wide">{entry.label}</dt>
                        <dd>{entry.value}</dd>
                      </div>
                    ))}
                  </dl>
                ) : null}
                {identityDocuments.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {identityDocuments.map((doc) => buildDocumentBadge(doc.label, doc.available))}
                  </div>
                ) : null}
                {identitySummary?.nextActions?.length ? (
                  <div className="mt-4 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Next steps</p>
                    <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                      {identitySummary.nextActions.map((action) => (
                        <li
                          key={action.id}
                          className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/60"
                        >
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{action.label}</p>
                          <p className="mt-1 text-xs">{action.description}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {identitySummary?.supportContact?.email ? (
                  <p className="mt-4 text-xs text-slate-500 dark:text-slate-300">
                    Need help? Email{' '}
                    <a className="text-accent underline" href={`mailto:${identitySummary.supportContact.email}`}>
                      {identitySummary.supportContact.email}
                    </a>{' '}
                    or visit the trust centre.
                  </p>
                ) : null}
              </section>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <PreferenceCard
                title="Session timeout"
                description="Automatically sign out after periods of inactivity to prevent misuse on shared devices."
                customControl={
                  <select
                    value={String(securityPrefs.sessionTimeoutMinutes)}
                    onChange={(event) => {
                      const nextValue = Number(event.target.value);
                      handleSecurityPreferenceChange(
                        { sessionTimeoutMinutes: Number.isFinite(nextValue) ? nextValue : 30 },
                        `Session timeout set to ${event.target.value} minutes.`,
                      );
                    }}
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    disabled={securitySaving}
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
                enabled={securityPrefs.biometricApprovalsEnabled}
                disabled={securitySaving}
                onToggle={(value) =>
                  handleSecurityPreferenceChange(
                    { biometricApprovalsEnabled: value },
                    value ? 'Biometric approvals enabled.' : 'Biometric approvals disabled.',
                  )
                }
              />
              <PreferenceCard
                title="Trusted device approvals"
                description="Receive a push notification when unknown browsers attempt to log in."
                enabled={securityPrefs.deviceApprovalsEnabled}
                disabled={securitySaving}
                onToggle={(value) =>
                  handleSecurityPreferenceChange(
                    { deviceApprovalsEnabled: value },
                    value ? 'Trusted device alerts enabled.' : 'Trusted device alerts disabled.',
                  )
                }
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
                disabled={aiSaving}
                onToggle={(value) =>
                  handleAiToggle(
                    'personalisedMatches',
                    value,
                    value ? 'Personalised matches enabled.' : 'Personalised matches disabled.',
                  )
                }
              />
              <PreferenceCard
                title="AI meeting summaries"
                description="Summaries appear after calls you join via Gigvora, helping keep your team aligned."
                enabled={aiPrefs.meetingSummaries}
                disabled={aiSaving}
                onToggle={(value) =>
                  handleAiToggle(
                    'meetingSummaries',
                    value,
                    value ? 'AI meeting summaries enabled.' : 'AI meeting summaries disabled.',
                  )
                }
              />
              <PreferenceCard
                title="Share anonymised insights"
                description="Allow Gigvora to contribute anonymised usage signals to improve fairness and quality."
                enabled={aiPrefs.anonymisedInsights}
                disabled={aiSaving}
                onToggle={(value) =>
                  handleAiToggle(
                    'anonymisedInsights',
                    value,
                    value
                      ? 'Anonymised insights sharing enabled.'
                      : 'Anonymised insights sharing disabled.',
                  )
                }
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
            {exportError ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/60 dark:bg-red-500/10 dark:text-red-200">
                {exportError}
              </div>
            ) : null}
            <div className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/90">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Request data export</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Download a portable archive that includes posts, messages, invoices, and telemetry trails. We will notify you via email when the archive is ready.
              </p>
              <button
                type="button"
                onClick={handleCreateExport}
                disabled={exportPending}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-accent-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60"
              >
                <ArrowDownTrayIcon className="h-5 w-5" /> {exportPending ? 'Submitting…' : 'Submit request'}
              </button>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/90">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Recent export requests</h3>
              {dataExports.length ? (
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-sm dark:divide-slate-700">
                    <thead className="bg-slate-50 dark:bg-slate-800/60">
                      <tr>
                        <th scope="col" className="px-4 py-3 font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Status</th>
                        <th scope="col" className="px-4 py-3 font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Format</th>
                        <th scope="col" className="px-4 py-3 font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Requested</th>
                        <th scope="col" className="px-4 py-3 font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Completed</th>
                        <th scope="col" className="px-4 py-3 font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Download</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {dataExports.map((request) => {
                        const statusLabel = request.status
                          ? `${request.status.charAt(0).toUpperCase()}${request.status.slice(1).replace(/_/g, ' ')}`
                          : 'Pending';
                        const statusTone = request.status;
                        let badgeClass = 'bg-slate-100 text-slate-600 dark:bg-slate-700/60 dark:text-slate-300';
                        if (statusTone === 'ready') {
                          badgeClass = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200';
                        } else if (statusTone === 'failed') {
                          badgeClass = 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-200';
                        } else if (statusTone === 'processing' || statusTone === 'queued') {
                          badgeClass = 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200';
                        }

                        return (
                          <tr key={`${request.id}-${request.requestedAt}`}>
                            <td className="whitespace-nowrap px-4 py-3">
                              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${badgeClass}`}>
                                {statusLabel}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                              {(request.format ?? 'zip').toUpperCase()}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                              {request.requestedAt ? formatDateTime(request.requestedAt) : '—'}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                              {request.completedAt ? formatDateTime(request.completedAt) : 'Pending'}
                              {request.expiresAt ? (
                                <span className="block text-xs text-slate-400 dark:text-slate-500">
                                  Expires {formatDateTime(request.expiresAt)}
                                </span>
                              ) : null}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-sm font-medium">
                              {request.downloadUrl ? (
                                <a
                                  href={request.downloadUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-accent transition hover:text-accent-dark"
                                >
                                  Download
                                </a>
                              ) : (
                                <span className="text-slate-400 dark:text-slate-500">Not ready</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-300">You have not requested any exports yet.</p>
              )}
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/90">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Retention schedule</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <li>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">Invoices & escrow:</span> 7 years (financial regulations)
                </li>
                <li>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">Messages & calls:</span> 24 months rolling window
                </li>
                <li>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">AI training telemetry:</span> 18 months with anonymisation
                </li>
              </ul>
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
