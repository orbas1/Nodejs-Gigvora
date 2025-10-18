import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import CrmConnectorPanel from '../../components/integrations/CrmConnectorPanel.jsx';
import useCrmIntegrationManager from '../../hooks/useCrmIntegrationManager.js';
import useSession from '../../hooks/useSession.js';
import { formatRelativeTime, formatAbsolute } from '../../utils/date.js';

const MENU_SECTIONS = [
  {
    label: 'CRM',
    items: [
      { name: 'Home', sectionId: 'crm-home' },
      { name: 'Connectors', sectionId: 'crm-connectors' },
      { name: 'Logs', sectionId: 'crm-logs' },
    ],
  },
];

const availableDashboards = ['company', 'headhunter', 'user', 'agency'];

function SummaryCard({ title, value }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-soft">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-3 text-3xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function AuditLog({ entries }) {
  if (!entries?.length) {
    return (
      <p className="rounded-3xl border border-dashed border-slate-200 bg-white/95 p-8 text-center text-sm text-slate-500">
        No activity yet.
      </p>
    );
  }

  return (
    <ol className="space-y-3">
      {entries.map((entry) => (
        <li key={`${entry.id}-${entry.connector}`} className="rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs uppercase tracking-wide text-slate-500">
            <span>{entry.connectorName ?? entry.connector}</span>
            <span>{formatAbsolute(entry.createdAt)}</span>
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-900">{entry.action.replace(/_/g, ' ')}</p>
          {entry.details ? (
            <div className="mt-2 flex flex-wrap gap-2 text-[11px] uppercase tracking-wide text-slate-500">
              {Object.entries(entry.details).map(([key, value]) => (
                <span key={key} className="rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-600">
                  {key}: {String(value)}
                </span>
              ))}
            </div>
          ) : null}
          {entry.actorName ? <p className="mt-2 text-xs text-slate-400">{entry.actorName}</p> : null}
        </li>
      ))}
    </ol>
  );
}

export default function CompanyCrmIntegrationsPage() {
  const [searchParams] = useSearchParams();
  const workspaceId = searchParams.get('workspaceId') ?? undefined;
  const workspaceQuery = workspaceId ? `?workspaceId=${workspaceId}` : '';
  const { session } = useSession();

  const {
    loading,
    summary,
    managedConnectors,
    connectors,
    auditLog,
    defaults,
    refresh,
    updateConnectorSettings,
    rotateApiKey,
    updateFieldMappings,
    updateRoleAssignments,
    triggerSync,
    createIncidentRecord,
    markIncidentResolved,
  } = useCrmIntegrationManager({ workspaceId });

  const supportingConnectors = useMemo(
    () => (connectors ?? []).filter((connector) => !connector?.isManaged),
    [connectors],
  );

  const profile = useMemo(() => {
    const workspaceLabel = session?.workspaceName ?? session?.name ?? 'Workspace';
    const initials = workspaceLabel
      .split(' ')
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();

    return {
      name: workspaceLabel,
      role: 'CRM workspace',
      initials,
      badges:
        summary.openIncidents > 0
          ? [
              {
                label: `${summary.openIncidents} incident${summary.openIncidents === 1 ? '' : 's'}`,
                tone: 'amber',
              },
            ]
          : [{ label: 'Stable', tone: 'emerald' }],
      metrics: [
        { label: 'Connectors', value: summary.total },
        { label: 'Active', value: summary.connected },
        {
          label: 'Last sync',
          value: summary.lastSyncedAt ? formatRelativeTime(summary.lastSyncedAt) : 'No sync',
        },
      ],
    };
  }, [session?.workspaceName, session?.name, summary.total, summary.connected, summary.openIncidents, summary.lastSyncedAt]);

  const summaryCards = useMemo(
    () => [
      {
        title: 'Active connectors',
        value: `${summary.connected}/${summary.total}`,
      },
      {
        title: 'Open incidents',
        value: summary.openIncidents,
      },
      {
        title: 'Last sync',
        value: summary.lastSyncedAt ? formatRelativeTime(summary.lastSyncedAt) : 'No sync',
      },
    ],
    [summary.connected, summary.total, summary.openIncidents, summary.lastSyncedAt],
  );

  const environments = useMemo(
    () =>
      Object.entries(summary.environments ?? {}).map(([key, value]) => ({
        key,
        value,
      })),
    [summary.environments],
  );

  const crmSummaryHref = `/dashboard/company/integrations${workspaceQuery}`;

  return (
    <DashboardLayout
      currentDashboard="company"
      title="CRM Control"
      subtitle="Salesforce, HubSpot, monday.com"
      description=""
      menuSections={MENU_SECTIONS}
      sections={[
        { id: 'crm-home', label: 'Home' },
        { id: 'crm-connectors', label: 'Connectors' },
        { id: 'crm-logs', label: 'Logs' },
      ]}
      profile={profile}
      availableDashboards={availableDashboards}
    >
      <div className="mx-auto w-full max-w-7xl space-y-12 px-6 py-10">
        <section id="crm-home" className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold text-slate-900">Workspace</h2>
            <div className="flex flex-wrap gap-2">
              <a
                href={crmSummaryHref}
                className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-accent hover:text-accent"
              >
                Summary
              </a>
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
          <div className="grid gap-4 sm:grid-cols-3">
            {summaryCards.map((card) => (
              <SummaryCard key={card.title} {...card} />
            ))}
          </div>
          {environments.length ? (
            <div className="flex flex-wrap gap-2 text-xs uppercase tracking-wide text-slate-500">
              {environments.map((environment) => (
                <span
                  key={environment.key}
                  className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700"
                >
                  {environment.key}: {environment.value}
                </span>
              ))}
            </div>
          ) : null}
        </section>

        <section id="crm-connectors" className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold text-slate-900">Connectors</h2>
            <p className="text-xs uppercase tracking-wide text-slate-500">{managedConnectors.length} managed</p>
          </div>
          <div className="grid gap-6 xl:grid-cols-2">
            {managedConnectors.map((connector) => (
              <CrmConnectorPanel
                key={connector.providerKey}
                connector={connector}
                defaults={defaults}
                onUpdateSettings={updateConnectorSettings}
                onRotateCredential={rotateApiKey}
                onUpdateFieldMappings={updateFieldMappings}
                onUpdateRoleAssignments={updateRoleAssignments}
                onTriggerSync={triggerSync}
                onCreateIncident={createIncidentRecord}
                onResolveIncident={markIncidentResolved}
              />
            ))}
          </div>
          {!managedConnectors.length ? (
            <p className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-10 text-center text-sm text-slate-500">
              Add a CRM connector from the integration summary.
            </p>
          ) : null}

          {supportingConnectors.length ? (
            <div className="rounded-3xl border border-slate-200 bg-slate-50/60 p-5 shadow-soft">
              <h3 className="text-sm font-semibold text-slate-800">Linked connectors</h3>
              <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                {supportingConnectors.map((connector) => (
                  <li key={connector.providerKey} className="rounded-2xl border border-slate-200 bg-white/90 p-3">
                    <p className="text-sm font-semibold text-slate-800">{connector.name}</p>
                    <p className="mt-1 text-xs text-slate-500">Read only</p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>

        <section id="crm-logs" className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold text-slate-900">Logs</h2>
            <p className="text-xs uppercase tracking-wide text-slate-500">Latest {auditLog.length}</p>
          </div>
          <AuditLog entries={auditLog} />
        </section>
      </div>
    </DashboardLayout>
  );
}
