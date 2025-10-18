import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  LinkIcon,
  SignalIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import useCrmIntegrationManager from '../../hooks/useCrmIntegrationManager.js';
import useSession from '../../hooks/useSession.js';
import { formatRelativeTime, formatAbsolute } from '../../utils/date.js';

const MENU_SECTIONS = [
  {
    label: 'Integrations overview',
    items: [
      { name: 'Summary', sectionId: 'integration-summary' },
      { name: 'Managed connectors', sectionId: 'integration-connectors' },
      { name: 'Activity log', sectionId: 'integration-audit' },
    ],
  },
];

const availableDashboards = ['company', 'headhunter', 'user', 'agency'];

function classNames(...values) {
  return values.filter(Boolean).join(' ');
}

function StatusBadge({ status, lastSyncStatus }) {
  const tone =
    status === 'connected'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : status === 'error'
      ? 'bg-rose-50 text-rose-700 border-rose-200'
      : status === 'pending'
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : 'bg-slate-100 text-slate-700 border-slate-200';
  const label = status === 'connected' ? 'Connected' : status === 'error' ? 'Error' : status === 'pending' ? 'Pending' : 'Disconnected';
  return (
    <span
      className={classNames(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold',
        tone,
      )}
    >
      <SignalIcon className="h-4 w-4" aria-hidden="true" />
      {label}
      {lastSyncStatus && status === 'connected' ? ` · ${lastSyncStatus}` : null}
    </span>
  );
}

function SummaryCard({ title, value, helper, tone = 'bg-white', icon: Icon }) {
  return (
    <div className={classNames('rounded-3xl border border-slate-200 p-5 shadow-soft', tone)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
          {helper ? <p className="mt-1 text-xs text-slate-500">{helper}</p> : null}
        </div>
        {Icon ? (
          <div className="rounded-2xl bg-white p-3 text-slate-600 shadow-sm">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ConnectorCard({
  connector,
  onToggle,
  onResolveIncident,
  onTriggerSync,
}) {
  const openIncidents = (connector.incidents ?? []).filter((incident) => incident.status !== 'resolved');
  const lastSyncDescription = connector.lastSyncedAt
    ? `${formatRelativeTime(connector.lastSyncedAt)} · ${formatAbsolute(connector.lastSyncedAt)}`
    : 'No sync yet';

  const integrationDetailHref = connector.isManaged
    ? `/dashboard/company/integrations/crm${connector.workspaceQuery ?? ''}#connector-${connector.providerKey}`
    : null;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{connector.name}</h3>
          <p className="mt-1 text-sm text-slate-600">{connector.description}</p>
        </div>
        <StatusBadge status={connector.status} lastSyncStatus={connector.lastSyncStatus} />
      </div>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <dt className="font-semibold text-slate-500">Last sync</dt>
          <dd className="mt-1 text-slate-900">{lastSyncDescription}</dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-500">Environment</dt>
          <dd className="mt-1 text-slate-900 capitalize">{connector.environment ?? 'production'}</dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-500">Scopes</dt>
          <dd className="mt-1 text-slate-900">{(connector.scopes ?? []).join(', ') || '—'}</dd>
        </div>
      </dl>

      {openIncidents.length ? (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-800">
          <div className="flex items-start gap-2">
            <ExclamationTriangleIcon className="h-5 w-5" aria-hidden="true" />
            <div>
              <p className="font-semibold">{openIncidents.length} open incident{openIncidents.length > 1 ? 's' : ''}</p>
              <ul className="mt-2 space-y-1">
                {openIncidents.slice(0, 2).map((incident) => (
                  <li key={incident.id} className="flex items-start justify-between gap-2">
                    <span className="text-xs text-amber-700">{incident.summary}</span>
                    <button
                      type="button"
                      onClick={() => onResolveIncident(connector.providerKey, incident.id, connector)}
                      className="inline-flex items-center gap-1 rounded-full border border-amber-300 px-2 py-1 text-[11px] font-semibold text-amber-700 transition hover:border-amber-400 hover:text-amber-800"
                    >
                      <CheckCircleIcon className="h-4 w-4" aria-hidden="true" />
                      Resolve
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        {connector.isManaged ? (
          <button
            type="button"
            onClick={() => onToggle(connector.providerKey, connector.status === 'connected' ? 'disconnected' : 'connected')}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-accent hover:text-accent"
          >
            {connector.status === 'connected' ? 'Disconnect' : 'Connect'}
          </button>
        ) : null}

        {connector.isManaged ? (
          <button
            type="button"
            onClick={() => onTriggerSync(connector.providerKey, { integrationId: connector.id })}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-accent hover:text-accent"
          >
            <ArrowPathIcon className="h-4 w-4" aria-hidden="true" />
            Sync now
          </button>
        ) : null}

        {integrationDetailHref ? (
          <Link
            to={integrationDetailHref}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-accent hover:text-accent"
          >
            <LinkIcon className="h-4 w-4" aria-hidden="true" />
            Manage connector
          </Link>
        ) : null}
      </div>
    </div>
  );
}

function AuditLog({ entries }) {
  if (!entries?.length) {
    return (
      <p className="rounded-3xl border border-slate-200 bg-white/95 p-6 text-sm text-slate-600">
        No integration activity recorded yet.
      </p>
    );
  }

  return (
    <ol className="space-y-3">
      {entries.map((entry) => (
        <li key={`${entry.id}-${entry.connector}`} className="rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs uppercase tracking-wide text-slate-500">
            <span>{entry.connectorName ?? entry.connector}</span>
            <span>{formatAbsolute(entry.createdAt)}</span>
          </div>
          <p className="mt-1 text-sm font-semibold text-slate-900">{entry.action.replace(/_/g, ' ')}</p>
          {entry.details ? (
            <p className="mt-1 text-xs text-slate-500">{JSON.stringify(entry.details)}</p>
          ) : null}
          {entry.actorName ? (
            <p className="mt-1 text-xs text-slate-400">{entry.actorName}</p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

export default function CompanyIntegrationsPage() {
  const [searchParams] = useSearchParams();
  const workspaceId = searchParams.get('workspaceId') ?? undefined;
  const workspaceQuery = workspaceId ? `?workspaceId=${workspaceId}` : '';
  const { session } = useSession();

  const {
    loading,
    summary,
    connectors,
    managedConnectors,
    auditLog,
    refresh,
    toggleConnection,
    markIncidentResolved,
    triggerSync,
  } = useCrmIntegrationManager({ workspaceId });

  const supportingConnectors = useMemo(
    () => (connectors ?? []).filter((connector) => !connector?.isManaged),
    [connectors],
  );

  const profile = useMemo(
    () => ({
      name: session?.workspaceName ?? session?.name ?? 'Integration control tower',
      role: 'Company integrations',
      initials: (session?.workspaceName ?? 'IC')
        .split(' ')
        .map((part) => part[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase(),
      badges: summary.openIncidents
        ? [
            {
              label: `${summary.openIncidents} incident${summary.openIncidents === 1 ? '' : 's'}`,
              tone: summary.openIncidents ? 'amber' : 'emerald',
            },
          ]
        : [{ label: 'Healthy estate', tone: 'emerald' }],
      metrics: [
        { label: 'Connectors', value: summary.total },
        { label: 'Connected', value: summary.connected },
      ],
    }),
    [session?.workspaceName, session?.name, summary.total, summary.connected, summary.openIncidents],
  );

  const summaryCards = [
    {
      title: 'Connected',
      value: summary.connected,
      helper: `${summary.total} total connectors`,
      icon: CheckCircleIcon,
    },
    {
      title: 'Needs attention',
      value: summary.requiresAttention,
      helper: `${summary.openIncidents} open incidents`,
      icon: ExclamationTriangleIcon,
      tone: 'bg-amber-50/60',
    },
    {
      title: 'Last sync',
      value: summary.lastSyncedAt ? formatRelativeTime(summary.lastSyncedAt) : 'No sync yet',
      helper: summary.lastSyncedAt ? formatAbsolute(summary.lastSyncedAt) : undefined,
      icon: ClockIcon,
    },
  ];

  const crmDetailLink = `/dashboard/company/integrations/crm${workspaceQuery}`;

  return (
    <DashboardLayout
      currentDashboard="company"
      title="Integration control center"
      subtitle="Monitor CRM and work management connectors"
      description="Track connection health, incidents, and sync activity across Salesforce, HubSpot, and monday.com."
      menuSections={MENU_SECTIONS}
      sections={[
        { id: 'integration-summary', label: 'Summary' },
        { id: 'integration-connectors', label: 'Managed connectors' },
        { id: 'integration-audit', label: 'Audit log' },
      ]}
      profile={profile}
      availableDashboards={availableDashboards}
    >
      <div className="mx-auto w-full max-w-5xl space-y-10 px-6 py-10">
        <section id="integration-summary" className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Integration health snapshot</h2>
              <p className="mt-1 text-sm text-slate-600">
                Review connection status and incidents across managed connectors. Use the CRM workspace for detailed settings.
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                to={crmDetailLink}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-accent hover:text-accent"
              >
                <LinkIcon className="h-4 w-4" aria-hidden="true" />
                Open CRM workspace
              </Link>
              <button
                type="button"
                onClick={refresh}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accentDark disabled:cursor-not-allowed disabled:opacity-60"
              >
                <ArrowPathIcon className="h-4 w-4" aria-hidden="true" />
                {loading ? 'Refreshing…' : 'Refresh'}
              </button>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {summaryCards.map((card) => (
              <SummaryCard key={card.title} {...card} />
            ))}
          </div>
        </section>

        <section id="integration-connectors" className="space-y-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-slate-900">Managed connectors</h3>
            <p className="text-xs uppercase tracking-wide text-slate-500">
              {managedConnectors.length} managed
            </p>
          </div>
          <div className="space-y-5">
            {managedConnectors.map((connector) => (
              <ConnectorCard
                key={connector.providerKey}
                connector={{ ...connector, workspaceQuery }}
                onToggle={toggleConnection}
                onResolveIncident={(providerKey, incidentId) =>
                  markIncidentResolved(providerKey, incidentId, { integrationId: connector.id })
                }
                onTriggerSync={(providerKey, options) =>
                  triggerSync(providerKey, { ...options, integrationId: connector.id })
                }
              />
            ))}
          </div>

          {supportingConnectors.length ? (
            <div className="rounded-3xl border border-slate-200 bg-slate-50/60 p-5 shadow-soft">
              <h4 className="text-sm font-semibold text-slate-800">Supporting integrations</h4>
              <p className="mt-1 text-xs text-slate-500">
                These connections are managed elsewhere but surface data in the hiring workspace.
              </p>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {supportingConnectors.map((connector) => (
                  <li key={connector.providerKey} className="rounded-2xl border border-slate-200 bg-white/90 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-800">{connector.name}</span>
                      <StatusBadge status={connector.status} lastSyncStatus={connector.lastSyncStatus} />
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{connector.description}</p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>

        <section id="integration-audit" className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-slate-900">Recent activity</h3>
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Latest {auditLog.length} events
            </p>
          </div>
          <AuditLog entries={auditLog} />
        </section>
      </div>
    </DashboardLayout>
  );
}
