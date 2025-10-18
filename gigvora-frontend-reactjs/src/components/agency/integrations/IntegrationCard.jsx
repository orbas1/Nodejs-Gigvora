import { useMemo, useState } from 'react';
import { ArrowPathIcon, CheckCircleIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

const STATUS_LABELS = {
  connected: 'Connected',
  pending: 'Pending',
  disconnected: 'Disconnected',
  error: 'Error',
};

const STATUS_STYLES = {
  connected: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  disconnected: 'bg-slate-100 text-slate-600 border-slate-200',
  error: 'bg-rose-100 text-rose-700 border-rose-200',
};

function formatDate(value) {
  if (!value) {
    return '—';
  }
  try {
    return new Date(value).toLocaleString();
  } catch (error) {
    return value;
  }
}

export default function IntegrationCard({ integration, availableProviders, onOpen, onTestConnection }) {
  const provider = useMemo(
    () => availableProviders?.find((item) => item.key === integration.providerKey) ?? null,
    [availableProviders, integration.providerKey],
  );
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState(null);

  const handleTest = async () => {
    setTesting(true);
    try {
      const response = await onTestConnection(integration.id);
      setResult({
        status: response?.status ?? 'unknown',
        latency: response?.latencyMs ?? null,
        error: null,
        checkedAt: Date.now(),
      });
    } catch (error) {
      setResult({ status: 'error', error: error?.message ?? 'Unable to test connection.', checkedAt: Date.now() });
    } finally {
      setTesting(false);
    }
  };

  const statusStyle = STATUS_STYLES[integration.status] ?? STATUS_STYLES.pending;

  return (
    <article className="flex h-full flex-col justify-between rounded-4xl border border-slate-200 bg-white/95 p-5 shadow-soft">
      <div className="space-y-4">
        <header className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-slate-900">{integration.displayName}</h3>
            <p className="text-sm text-slate-500">{provider?.name ?? integration.providerKey}</p>
          </div>
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${statusStyle}`}
          >
            <ShieldCheckIcon className="h-4 w-4" aria-hidden="true" />
            {STATUS_LABELS[integration.status] ?? integration.status}
          </span>
        </header>

        <dl className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Sync</dt>
            <dd className="mt-1 font-semibold text-slate-800">{integration.syncFrequency}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Secrets</dt>
            <dd className="mt-1 font-semibold text-slate-800">{integration.secrets?.length ?? 0}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Webhooks</dt>
            <dd className="mt-1 font-semibold text-slate-800">{integration.webhooks?.length ?? 0}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Last sync</dt>
            <dd className="mt-1 font-semibold text-slate-800">{formatDate(integration.lastSyncedAt)}</dd>
          </div>
        </dl>

        {integration.metadata?.owner ? (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs uppercase tracking-wide text-slate-500">
            Owner {integration.metadata.owner}
          </div>
        ) : null}

        {result ? (
          <div
            className={`flex items-center gap-2 rounded-3xl border px-4 py-3 text-sm ${
              result.error
                ? 'border-rose-200 bg-rose-50 text-rose-700'
                : result.status === 'connected'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-amber-200 bg-amber-50 text-amber-700'
            }`}
          >
            <CheckCircleIcon className="h-5 w-5" aria-hidden="true" />
            {result.error
              ? result.error
              : `Status ${result.status}${result.latency != null ? ` · ${result.latency}ms` : ''}`}
          </div>
        ) : null}
      </div>

      <footer className="mt-6 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleTest}
          className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
          disabled={testing}
        >
          <ArrowPathIcon className={`h-5 w-5 ${testing ? 'animate-spin' : ''}`} aria-hidden="true" />
          {testing ? 'Testing…' : 'Test'}
        </button>
        <button
          type="button"
          onClick={() => onOpen?.(integration)}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accentDark"
        >
          Manage
        </button>
      </footer>
    </article>
  );
}
