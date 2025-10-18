const STATUS_OPTIONS = ['connected', 'disconnected', 'pending', 'error'];

function formatProvider(provider) {
  if (!provider) return 'Integration';
  return provider
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export default function WorkspaceIntegrationsTab({ integrations = [], onUpdate }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
      <h2 className="text-lg font-semibold text-slate-900">Workspace integrations</h2>
      <p className="text-xs text-slate-500">Keep collaboration channels in sync across Slack, GitHub, and Google Drive.</p>
      <div className="mt-4 space-y-4">
        {integrations.map((integration) => (
          <div key={integration.id} className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">{formatProvider(integration.provider)}</p>
                <p className="text-xs text-slate-500">
                  {integration.metadata?.channel || integration.metadata?.repository || integration.metadata?.folder || 'No configuration'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={integration.status ?? 'connected'}
                  onChange={(event) => onUpdate?.(integration.id, { status: event.target.value })}
                  className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => onUpdate?.(integration.id, { status: integration.status, connectedAt: new Date().toISOString() })}
                  className="inline-flex items-center rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                >
                  Refresh status
                </button>
              </div>
            </div>
          </div>
        ))}
        {integrations.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs text-slate-500">
            No integrations configured.
          </div>
        ) : null}
      </div>
    </div>
  );
}
