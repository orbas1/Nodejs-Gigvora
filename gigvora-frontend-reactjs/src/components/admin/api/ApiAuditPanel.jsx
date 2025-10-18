import { ArrowPathIcon } from '@heroicons/react/24/outline';
import ApiAuditTimeline from './ApiAuditTimeline.jsx';

export default function ApiAuditPanel({ client, events = [], loading, error, onRefresh }) {
  if (!client) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
        Select a client to view activity.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Audit</h2>
            <p className="text-sm text-slate-500">Credential and webhook history for {client.name}.</p>
          </div>
          <button
            type="button"
            onClick={() => onRefresh?.(client)}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-blue-300 hover:text-blue-600 disabled:cursor-not-allowed"
          >
            <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
          <div className="font-semibold text-slate-900">{client.provider?.name}</div>
          <div className="text-xs text-slate-500">{client.description || 'No description.'}</div>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      ) : null}

      {loading ? (
        <div className="rounded-3xl border border-dashed border-blue-200 bg-blue-50/60 p-6 text-sm text-blue-700">Loading…</div>
      ) : (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <ApiAuditTimeline events={events} />
        </div>
      )}
    </div>
  );
}
