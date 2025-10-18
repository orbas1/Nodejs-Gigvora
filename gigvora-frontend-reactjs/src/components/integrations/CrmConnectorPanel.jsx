import { useMemo, useState } from 'react';
import { ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import CrmConnectorManagerDrawer from './CrmConnectorManagerDrawer.jsx';
import { formatRelativeTime, formatAbsolute } from '../../utils/date.js';

function StatusChip({ tone, children }) {
  const toneClasses = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
  };
  return (
    <span
      className={[
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide',
        toneClasses[tone] ?? toneClasses.slate,
      ].join(' ')}
    >
      {children}
    </span>
  );
}

function MetricCell({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export default function CrmConnectorPanel({
  connector,
  defaults,
  onUpdateSettings,
  onRotateCredential,
  onUpdateFieldMappings,
  onUpdateRoleAssignments,
  onTriggerSync,
  onCreateIncident,
  onResolveIncident,
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const openIncidents = useMemo(
    () => (connector.incidents ?? []).filter((incident) => incident.status !== 'resolved'),
    [connector.incidents],
  );
  const recentRun = useMemo(() => {
    const runs = [...(connector.syncRuns ?? [])];
    runs.sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));
    return runs[0];
  }, [connector.syncRuns]);

  const statusTone = connector.status === 'connected' ? 'emerald' : 'amber';
  const statusLabel = connector.status === 'connected' ? 'Active' : 'Attention';

  const modules = connector.modules ?? [];
  const nextSync = connector.nextSyncAt
    ? `${formatRelativeTime(connector.nextSyncAt)} · ${formatAbsolute(connector.nextSyncAt)}`
    : connector.syncFrequency === 'manual'
    ? 'Manual only'
    : 'Scheduled when active';

  const metrics = [
    {
      label: 'Sync',
      value: connector.syncFrequency ? connector.syncFrequency.replace(/_/g, ' ') : 'Manual',
    },
    {
      label: 'Next run',
      value: nextSync,
    },
    {
      label: 'Last run',
      value: recentRun
        ? `${recentRun.status ?? 'queued'} · ${formatRelativeTime(recentRun.startedAt)}`
        : 'No history',
    },
  ];

  return (
    <>
      <article className="flex flex-col gap-6 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-soft">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xl font-semibold text-slate-900">{connector.name}</h3>
              <StatusChip tone={statusTone}>{statusLabel}</StatusChip>
              <StatusChip tone="slate">{connector.environment ?? 'production'}</StatusChip>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>{modules.length} modules</span>
              <span>•</span>
              <span>{connector.authType ?? 'oauth'}</span>
              <span>•</span>
              <span>{connector.owner ?? 'Team'}</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                onTriggerSync?.(connector.providerKey, {
                  integrationId: connector.id,
                })
              }
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-accent hover:text-accent"
            >
              <ArrowPathIcon className="h-4 w-4" aria-hidden="true" />
              Sync
            </button>
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Manage
            </button>
          </div>
        </header>

        <dl className="grid gap-4 sm:grid-cols-3">
          {metrics.map((metric) => (
            <MetricCell key={metric.label} label={metric.label} value={metric.value} />
          ))}
        </dl>

        {openIncidents.length ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-rose-700">
                <ExclamationTriangleIcon className="h-5 w-5" aria-hidden="true" />
                {openIncidents.length} open incident{openIncidents.length === 1 ? '' : 's'}
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="text-xs font-semibold text-rose-700 underline underline-offset-2"
              >
                Review
              </button>
            </div>
            <ul className="mt-3 space-y-2 text-xs text-rose-700">
              {openIncidents.slice(0, 2).map((incident) => (
                <li key={incident.id} className="flex justify-between gap-3">
                  <span className="truncate font-semibold">{incident.summary}</span>
                  <span className="whitespace-nowrap">{formatRelativeTime(incident.openedAt)}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </article>

      <CrmConnectorManagerDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        connector={connector}
        defaults={defaults}
        onUpdateSettings={onUpdateSettings}
        onRotateCredential={onRotateCredential}
        onUpdateFieldMappings={onUpdateFieldMappings}
        onUpdateRoleAssignments={onUpdateRoleAssignments}
        onTriggerSync={onTriggerSync}
        onCreateIncident={onCreateIncident}
        onResolveIncident={onResolveIncident}
      />
    </>
  );
}
