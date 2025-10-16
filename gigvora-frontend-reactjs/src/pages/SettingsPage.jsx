import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import PageHeader from '../components/PageHeader.jsx';
import useSession from '../hooks/useSession.js';
import { fetchUserConsentSnapshot, updateUserConsent } from '../services/consent.js';
import formatDateTime from '../utils/formatDateTime.js';
import ConsentHistoryTimeline from '../components/compliance/ConsentHistoryTimeline.jsx';

function Toggle({ enabled, disabled, onClick }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={enabled}
      className={`inline-flex h-7 w-14 items-center rounded-full border transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent
        ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
        ${enabled ? 'border-emerald-400 bg-emerald-500/90' : 'border-slate-300 bg-slate-200'}
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

  return (
    <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm sm:grid-cols-6 sm:items-start">
      <div className="sm:col-span-2">
        <p className="text-sm font-semibold text-slate-900">{policy.title}</p>
        <p className="mt-1 text-xs text-slate-500">Audience: {policy.audience.toUpperCase()} • Region: {policy.region.toUpperCase()}</p>
        <p className="mt-1 text-xs text-slate-400">Legal basis: {policy.legalBasis}</p>
      </div>
      <div className="sm:col-span-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Summary</p>
        <p className="mt-1 text-sm text-slate-700">{policy.description ?? 'No summary provided.'}</p>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</p>
        <div className="mt-1 inline-flex items-center gap-2 text-sm font-medium text-slate-900">
          {enabled ? (
            <CheckCircleIcon className="h-4 w-4 text-emerald-500" />
          ) : (
            <ExclamationTriangleIcon className="h-4 w-4 text-amber-500" />
          )}
          {enabled ? 'Granted' : 'Withdrawn'}
        </div>
        {lastUpdated && (
          <p className="text-xs text-slate-500">Updated {formatDateTime(lastUpdated)}</p>
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

export default function SettingsPage() {
  const { session } = useSession();
  const userId = session?.id;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [consentRows, setConsentRows] = useState([]);
  const [pending, setPending] = useState({});
  const [outstandingRequired, setOutstandingRequired] = useState(0);
  const [expandedRows, setExpandedRows] = useState({});

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

  const summary = useMemo(() => {
    if (!consentRows.length) {
      return { granted: 0, total: 0, outstandingRequired };
    }
    const granted = consentRows.filter((entry) => entry.consent?.status === 'granted').length;
    return { granted, total: consentRows.length, outstandingRequired };
  }, [consentRows, outstandingRequired]);

  const handleConsentChange = async (policyCode, shouldGrant) => {
    if (!userId) return;
    setPending((state) => ({ ...state, [policyCode]: true }));
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
    } catch (updateError) {
      setError(updateError.message ?? 'Failed to update consent.');
    } finally {
      setPending((state) => ({ ...state, [policyCode]: false }));
    }
  };

  const toggleHistory = (policyCode) => {
    setExpandedRows((state) => ({ ...state, [policyCode]: !state[policyCode] }));
  };

  return (
    <section className="relative overflow-hidden py-20">
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(191,219,254,0.35),_transparent_65%)]"
        aria-hidden="true"
      />
      <div className="absolute -right-16 bottom-8 h-64 w-64 rounded-full bg-accent/10 blur-[120px]" aria-hidden="true" />
      <div className="relative mx-auto max-w-5xl px-6">
        <PageHeader
          eyebrow="Workspace"
          title="Account settings"
          description="Manage security controls, notification delivery, and the privacy consents that govern how Gigvora communicates with you."
        />

        <div className="mt-10 grid gap-8">
          <section className="rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-soft">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Privacy centre</p>
                <h2 className="mt-1 text-xl font-semibold text-slate-900">Consent & communication preferences</h2>
                <p className="mt-2 max-w-2xl text-sm text-slate-600">
                  Gigvora maintains granular GDPR consents so you decide which experiences—such as marketing newsletters or beta
                  invites—you wish to receive. Required policies stay locked to preserve contractual and security obligations.
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  <ShieldCheckIcon className="mr-2 inline h-4 w-4" /> {summary.granted} of {summary.total} preferences enabled
                </div>
                <div
                  className={`rounded-2xl px-4 py-3 text-xs font-semibold uppercase tracking-wide ${
                    summary.outstandingRequired
                      ? 'border border-amber-200 bg-amber-50 text-amber-700'
                      : 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                  }`}
                >
                  <ExclamationTriangleIcon className="mr-2 inline h-4 w-4" />
                  {summary.outstandingRequired
                    ? `${summary.outstandingRequired} required policies pending`
                    : 'All required policies granted'}
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            {loading ? (
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {[...Array(4)].map((_, index) => (
                  <div key={index} className="h-24 animate-pulse rounded-2xl bg-slate-100" />
                ))}
              </div>
            ) : consentRows.length ? (
              <div className="mt-6 space-y-4">
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
              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
                Consent preferences will appear once policies are published for your persona and region. Contact support if you
                believe a policy is missing.
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-soft">
            <h2 className="text-lg font-semibold text-slate-900">Security, notifications & workspace access</h2>
            <p className="mt-2 text-sm text-slate-600">
              These controls are rolling out across Gigvora properties. Until the dedicated settings hub is live you can reach out
              to support or your customer partner to adjust the items below.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-800">Security</p>
                <p className="mt-1 text-xs text-slate-500">
                  Multi-factor authentication, device approvals, and session management are handled via the security operations
                  centre.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-800">Notifications</p>
                <p className="mt-1 text-xs text-slate-500">
                  Configure inbox digests, Slack alerts, and trust escalations from the communications hub.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-800">Workspace access</p>
                <p className="mt-1 text-xs text-slate-500">
                  Invite teammates, agencies, or headhunters by raising an access request with operations.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-800">Data exports</p>
                <p className="mt-1 text-xs text-slate-500">
                  Need a Subject Access Request or data export? Submit a ticket and our compliance team will respond within 72
                  hours.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
