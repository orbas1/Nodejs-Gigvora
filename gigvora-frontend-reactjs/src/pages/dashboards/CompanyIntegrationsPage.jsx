import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  KeyIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  SignalIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import useIntegrationControlTower from '../../hooks/useIntegrationControlTower.js';
import useSession from '../../hooks/useSession.js';

const CATEGORY_METADATA = {
  crm: {
    title: 'Revenue intelligence',
    description: 'Keep customer truth and hiring impact aligned with CRM grade auditing and syncs.',
    accent: 'border-amber-100 bg-amber-50/80',
  },
  work_management: {
    title: 'Delivery orchestration',
    description: 'Operationalise hiring pods, onboarding cadences, and rituals across execution platforms.',
    accent: 'border-sky-100 bg-sky-50/80',
  },
  communication: {
    title: 'Signal routing',
    description: 'Broadcast events to Slack and social channels with granular scopes and safety rails.',
    accent: 'border-indigo-100 bg-indigo-50/80',
  },
  content: {
    title: 'Knowledge vault',
    description: 'Securely distribute playbooks, offers, and collateral with enterprise-grade permissions.',
    accent: 'border-emerald-100 bg-emerald-50/80',
  },
  ai: {
    title: 'Bring-your-own-model intelligence',
    description: 'Activate Claude, OpenAI, DeepSeek, and X automations with zero-retained credentials.',
    accent: 'border-violet-100 bg-violet-50/80',
  },
};

const MENU_SECTIONS = [
  {
    label: 'Integration estate',
    items: [
      {
        name: 'Executive summary',
        sectionId: 'integration-summary',
        description: 'Live health, sync recency, and open incidents.',
      },
      {
        name: 'Connector catalogue',
        sectionId: 'integration-catalogue',
        description: 'Deep dive into every connector with statuses and actions.',
      },
    ],
  },
  {
    label: 'Automation & AI',
    items: [
      {
        name: 'Bring your own key',
        sectionId: 'integration-byok',
        description: 'Securely rotate credentials without storing secrets.',
      },
      {
        name: 'Audit & controls',
        sectionId: 'integration-audit',
        description: 'Immutable activity feed, controls, and compliance attestation.',
      },
    ],
  },
];

const STATUS_STYLES = {
  connected: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  action_required: 'bg-amber-50 text-amber-700 border border-amber-200',
  not_connected: 'bg-slate-100 text-slate-700 border border-slate-200',
  degraded: 'bg-rose-50 text-rose-700 border border-rose-200',
};

function formatRelativeTime(timestamp) {
  if (!timestamp) {
    return 'never';
  }
  try {
    const delta = Date.now() - timestamp;
    if (delta < 1000 * 60) {
      return 'just now';
    }
    const minutes = Math.floor(delta / (1000 * 60));
    if (minutes < 60) {
      return `${minutes}m ago`;
    }
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `${hours}h ago`;
    }
    const days = Math.floor(hours / 24);
    if (days < 7) {
      return `${days}d ago`;
    }
    const weeks = Math.floor(days / 7);
    return `${weeks}w ago`;
  } catch (error) {
    console.error('Unable to format relative time', error);
    return 'recently';
  }
}

function StatusBadge({ status }) {
  const label =
    status === 'connected'
      ? 'Connected'
      : status === 'action_required'
      ? 'Action required'
      : status === 'degraded'
      ? 'Degraded'
      : 'Not connected';
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.not_connected;
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${style}`}>
      <SignalIcon className="h-4 w-4" aria-hidden="true" />
      {label}
    </span>
  );
}

function ConnectorCard({ connector, onToggle, onResolveIncident, onRotateKey }) {
  const [apiKeyValue, setApiKeyValue] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleToggle = async () => {
    const nextStatus = connector.status === 'connected' ? 'not_connected' : 'connected';
    await onToggle(connector.key, nextStatus);
  };

  const handleRotate = async (event) => {
    event.preventDefault();
    setProcessing(true);
    setError(null);
    try {
      await onRotateKey(connector.key, apiKeyValue);
      setApiKeyValue('');
    } catch (err) {
      console.error('Unable to rotate BYOK credential', err);
      setError('We could not hash that key. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-4 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{connector.name}</h3>
          <p className="mt-1 max-w-xl text-sm text-slate-600">{connector.description}</p>
        </div>
        <StatusBadge status={connector.status} />
      </div>

      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Last sync</dt>
          <dd className="mt-1 text-sm font-semibold text-slate-900">{formatRelativeTime(connector.lastSyncedAt)}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Owner</dt>
          <dd className="mt-1 text-sm text-slate-700">{connector.owner}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Regions</dt>
          <dd className="mt-1 text-sm text-slate-700">{connector.regions.join(', ') || '—'}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Compliance</dt>
          <dd className="mt-1 text-sm text-slate-700">{connector.compliance.join(', ') || '—'}</dd>
        </div>
      </dl>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Scopes</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {connector.scopes.map((scope) => (
            <span
              key={scope}
              className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
            >
              {scope}
            </span>
          ))}
        </div>
      </div>

      {connector.incidents.length ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-700">
            <ExclamationTriangleIcon className="h-5 w-5" aria-hidden="true" />
            {connector.incidents.length} open {connector.incidents.length > 1 ? 'incidents' : 'incident'}
          </div>
          <ul className="mt-3 space-y-2 text-sm text-amber-700">
            {connector.incidents.map((incident) => (
              <li key={incident.id} className="rounded-xl bg-white/70 p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="font-semibold">{incident.summary}</span>
                  <span className="text-xs uppercase tracking-wide">{incident.severity}</span>
                </div>
                <p className="mt-1 text-xs text-amber-600">Opened {formatRelativeTime(incident.openedAt)}</p>
                <button
                  type="button"
                  className="mt-2 inline-flex items-center gap-2 rounded-full border border-amber-300 px-3 py-1 text-xs font-semibold text-amber-700 transition hover:border-amber-400 hover:text-amber-800"
                  onClick={() => onResolveIncident(connector.key, incident.id)}
                >
                  <CheckCircleIcon className="h-4 w-4" aria-hidden="true" />
                  Mark resolved
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleToggle}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-accent hover:text-accent"
        >
          <ArrowPathIcon className="h-5 w-5" aria-hidden="true" />
          {connector.status === 'connected' ? 'Disable connection' : 'Enable connection'}
        </button>
        {connector.requiresApiKey ? (
          <form className="flex flex-wrap items-center gap-2" onSubmit={handleRotate}>
            <label htmlFor={`api-key-${connector.key}`} className="sr-only">
              {connector.name} API key
            </label>
            <input
              id={`api-key-${connector.key}`}
              type="password"
              autoComplete="off"
              value={apiKeyValue}
              onChange={(event) => setApiKeyValue(event.target.value)}
              placeholder="Paste secure key"
              className="w-full min-w-[220px] rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 sm:w-auto"
            />
            <button
              type="submit"
              disabled={processing || !apiKeyValue}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accentDark disabled:cursor-not-allowed disabled:opacity-60"
            >
              <KeyIcon className="h-5 w-5" aria-hidden="true" />
              {processing ? 'Hashing…' : 'Secure upload'}
            </button>
            {connector.apiKeyFingerprint ? (
              <span className="text-xs text-slate-500">
                Fingerprint: {connector.apiKeyFingerprint}
              </span>
            ) : (
              <span className="text-xs text-amber-600">No key stored</span>
            )}
            {error ? <p className="w-full text-xs text-rose-600">{error}</p> : null}
          </form>
        ) : null}
      </div>
    </div>
  );
}

function AuditTrail({ auditLog }) {
  if (!auditLog.length) {
    return (
      <p className="rounded-3xl border border-slate-200 bg-white/90 p-6 text-sm text-slate-600">
        No integration activity has been recorded yet.
      </p>
    );
  }

  return (
    <ol className="space-y-3">
      {auditLog.slice(0, 10).map((entry) => (
        <li key={entry.id} className="rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs uppercase tracking-wide text-slate-500">
            <span>{entry.connector}</span>
            <span>{formatRelativeTime(entry.createdAt)}</span>
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-900">{entry.action.replace(/_/g, ' ')}</p>
          <p className="mt-1 text-sm text-slate-600">{entry.context || 'No additional context provided.'}</p>
          <p className="mt-1 text-xs text-slate-500">Recorded by {entry.actor ?? 'system'}</p>
        </li>
      ))}
    </ol>
  );
}

export default function CompanyIntegrationsPage() {
  const { session } = useSession();
  const {
    loading,
    connectorsByCategory,
    connectors,
    summary,
    auditLog,
    lastSyncedAt,
    refresh,
    toggleConnection,
    rotateApiKey,
    markIncidentResolved,
  } = useIntegrationControlTower();

  const profile = useMemo(
    () => ({
      name: session?.workspaceName ?? 'Integration control tower',
      role: 'Company integrations',
      initials: 'CI',
      badges: [
        { label: `${summary.connected}/${summary.total} live`, tone: 'emerald' },
        summary.openIncidents
          ? { label: `${summary.openIncidents} incident${summary.openIncidents > 1 ? 's' : ''}`, tone: 'amber' }
          : { label: 'Healthy estate', tone: 'sky' },
      ],
      metrics: [
        { label: 'Health score', value: `${summary.healthScore}%` },
        { label: 'BYOK configured', value: `${summary.byokConfigured}/${summary.byok}` },
      ],
    }),
    [session?.workspaceName, summary],
  );

  const sections = useMemo(() => {
    const result = [];
    connectorsByCategory.forEach((items, category) => {
      const meta = CATEGORY_METADATA[category] ?? {
        title: category,
        description: '',
        accent: 'border-slate-200 bg-slate-50/80',
      };
      result.push({
        id: `category-${category}`,
        category,
        ...meta,
        connectors: items,
      });
    });
    return result;
  }, [connectorsByCategory]);

  const availableDashboards = useMemo(() => ['company', 'user', 'freelancer', 'agency'], []);

  return (
    <DashboardLayout
      currentDashboard="company"
      title="Integration command center"
      subtitle="Orchestrate CRM, automation, and AI across the Gigvora ecosystem"
      description="Harden credentials, monitor sync health, and deploy secure automations for Salesforce, monday.com, Slack, HubSpot, Google Drive, Claude, OpenAI, DeepSeek, and X."
      menuSections={MENU_SECTIONS}
      sections={sections.map((section) => ({ id: section.id, label: section.title }))}
      profile={profile}
      availableDashboards={availableDashboards}
    >
      <div className="mx-auto w-full max-w-6xl space-y-12 px-6 py-10">
        <div id="integration-summary" className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-accent/20 bg-white/95 px-6 py-4 shadow-soft">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Live sync fabric</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">{summary.connected} of {summary.total} connectors healthy</h2>
              <p className="mt-1 text-sm text-slate-600">
                Last refreshed {formatRelativeTime(lastSyncedAt)}. Run manual refresh to validate downstream automations.
              </p>
            </div>
            <button
              type="button"
              onClick={refresh}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accentDark disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ArrowPathIcon className="h-5 w-5" aria-hidden="true" />
              {loading ? 'Refreshing…' : 'Refresh now'}
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-soft">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Connected</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{summary.connected}</p>
              <p className="mt-1 text-sm text-slate-600">Live, verified tokens with SLAs enforced.</p>
            </div>
            <div className="rounded-3xl border border-amber-200 bg-amber-50/80 p-5 shadow-soft">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Action required</p>
              <p className="mt-2 text-3xl font-semibold text-amber-700">{summary.actionRequired}</p>
              <p className="mt-1 text-sm text-amber-700">Re-authentication or incident triage required.</p>
            </div>
            <div className="rounded-3xl border border-violet-200 bg-violet-50/80 p-5 shadow-soft">
              <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">BYOK configured</p>
              <p className="mt-2 text-3xl font-semibold text-violet-700">{summary.byokConfigured}</p>
              <p className="mt-1 text-sm text-violet-700">Secrets hashed client-side and stored as fingerprints only.</p>
            </div>
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50/80 p-5 shadow-soft">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Health score</p>
              <p className="mt-2 text-3xl font-semibold text-emerald-700">{summary.healthScore}%</p>
              <p className="mt-1 text-sm text-emerald-700">Weighted uptime across the integration fabric.</p>
            </div>
          </div>
        </div>

        <div id="integration-catalogue" className="space-y-8">
          {sections.map((section) => (
            <section key={section.id} id={section.id} className="space-y-5">
              <div className={`rounded-3xl border px-6 py-5 ${section.accent}`}>
                <h3 className="text-lg font-semibold text-slate-900">{section.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{section.description}</p>
              </div>
              <div className="space-y-5">
                {section.connectors.map((connector) => (
                  <ConnectorCard
                    key={connector.key}
                    connector={connector}
                    onToggle={toggleConnection}
                    onResolveIncident={markIncidentResolved}
                    onRotateKey={rotateApiKey}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>

        <div id="integration-byok" className="space-y-5 rounded-3xl border border-violet-200 bg-gradient-to-br from-white via-violet-50 to-violet-100/60 p-6 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-violet-700">Bring your own key</p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900">Client-side hashing with no credential retention</h3>
              <p className="mt-1 max-w-2xl text-sm text-slate-600">
                Keys are hashed in-browser using SHA-256 and persisted only as fingerprints. Raw secrets never transit or persist on Gigvora infrastructure.
              </p>
            </div>
            <SparklesIcon className="h-10 w-10 text-violet-400" aria-hidden="true" />
          </div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {connectors
              .filter((connector) => connector.requiresApiKey)
              .map((connector) => (
                <li key={`byok-${connector.key}`} className="rounded-3xl border border-violet-200 bg-white/90 p-5 shadow-soft">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-semibold text-slate-900">{connector.name}</h4>
                      <p className="mt-1 text-sm text-slate-600">
                        {connector.apiKeyFingerprint ? 'Active fingerprint' : 'Awaiting secure upload'}
                      </p>
                    </div>
                    <KeyIcon className="h-6 w-6 text-violet-500" aria-hidden="true" />
                  </div>
                  <p className="mt-3 text-xs text-slate-500">
                    Fingerprint {connector.apiKeyFingerprint ?? '—'}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    Rotate keys quarterly. Gigvora enforces automatic purge when toggled off to maintain zero-retention guarantees.
                  </p>
                </li>
              ))}
          </ul>
        </div>

        <section id="integration-security" className="space-y-4 rounded-3xl border border-emerald-200 bg-emerald-50/70 p-6 shadow-soft">
          <div className="flex items-start gap-3">
            <ShieldCheckIcon className="mt-1 h-8 w-8 text-emerald-600" aria-hidden="true" />
            <div>
              <h3 className="text-lg font-semibold text-emerald-900">Security posture</h3>
              <ul className="mt-2 space-y-2 text-sm text-emerald-800">
                <li className="flex items-start gap-2">
                  <LockClosedIcon className="mt-1 h-4 w-4" aria-hidden="true" />
                  <span>Role-based access control restricts this command center to company operators only.</span>
                </li>
                <li className="flex items-start gap-2">
                  <LockClosedIcon className="mt-1 h-4 w-4" aria-hidden="true" />
                  <span>Secrets hashed in browser and rotated with immutable audit events. No plaintext keys persisted.</span>
                </li>
                <li className="flex items-start gap-2">
                  <LockClosedIcon className="mt-1 h-4 w-4" aria-hidden="true" />
                  <span>Webhook signing, IP allow lists, and anomaly detection instrumented on every connector.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section id="integration-audit" className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Audit readiness</p>
              <h3 className="text-xl font-semibold text-slate-900">Immutable activity trail</h3>
            </div>
            <Link
              to="/dashboard/company"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-accent hover:text-accent"
            >
              Return to company dashboard
            </Link>
          </div>
          <AuditTrail auditLog={auditLog} />
        </section>
      </div>
    </DashboardLayout>
  );
}
