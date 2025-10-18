import {
  BoltIcon,
  DocumentMagnifyingGlassIcon,
  KeyIcon,
  PencilSquareIcon,
  ShieldExclamationIcon,
  WalletIcon,
} from '@heroicons/react/24/outline';
import { formatRelativeTime } from '../../../utils/date.js';

function formatNumber(value) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) {
    return '0';
  }
  return new Intl.NumberFormat('en-US').format(Math.round(numeric));
}

function formatCurrency(cents) {
  const numeric = Number(cents ?? 0);
  if (!Number.isFinite(numeric)) {
    return '$0.00';
  }
  return `$${(numeric / 100).toFixed(2)}`;
}

export default function ApiClientsPanel({
  clients = [],
  onEdit,
  onIssueKey,
  onRotateWebhook,
  onRevokeKey,
  onViewAudit,
  onRecordUsage,
  submitting,
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold text-slate-900">Clients</h2>
        <p className="text-sm text-slate-500">Keys, pricing, and wallet linkage for each consumer.</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {clients.map((client) => {
          const usage = client.usageSummary ?? {};
          const billing = client.billing ?? {};
          return (
            <article key={client.id} className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">{client.name}</h3>
                  <p className="text-sm text-slate-500">{client.provider?.name}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  {client.status}
                </span>
              </div>

              <dl className="grid gap-3 sm:grid-cols-3">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">30d calls</dt>
                  <dd className="mt-1 text-lg font-semibold text-slate-900">{formatNumber(usage.requestCount)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">30d errors</dt>
                  <dd className="mt-1 text-lg font-semibold text-slate-900">{formatNumber(usage.errorCount)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Billed</dt>
                  <dd className="mt-1 text-lg font-semibold text-slate-900">{formatCurrency(usage.billedAmountCents)}</dd>
                </div>
              </dl>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-600">
                  <KeyIcon className="h-4 w-4 text-blue-500" />
                  {formatCurrency(billing.effectiveCallPriceCents)} per call
                </div>
                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-600">
                  <WalletIcon className="h-4 w-4 text-emerald-500" />
                  {billing.walletAccount?.label ?? 'No wallet'}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onEdit?.(client)}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-blue-300 hover:text-blue-600"
                  disabled={submitting}
                >
                  <PencilSquareIcon className="h-4 w-4" /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => onRecordUsage?.(client)}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-emerald-300 hover:text-emerald-600"
                  disabled={submitting}
                >
                  <BoltIcon className="h-4 w-4" /> Usage
                </button>
                <button
                  type="button"
                  onClick={() => onIssueKey?.(client)}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-slate-300 hover:text-slate-700"
                  disabled={submitting}
                >
                  <KeyIcon className="h-4 w-4" /> New key
                </button>
                <button
                  type="button"
                  onClick={() => onRotateWebhook?.(client)}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-slate-300 hover:text-slate-700"
                  disabled={submitting}
                >
                  <ShieldExclamationIcon className="h-4 w-4" /> Rotate webhook
                </button>
                <button
                  type="button"
                  onClick={() => onViewAudit?.(client)}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-slate-300 hover:text-slate-700"
                >
                  <DocumentMagnifyingGlassIcon className="h-4 w-4" /> Audit
                </button>
              </div>

              <div className="space-y-2">
                {client.keys?.length ? (
                  client.keys.slice(0, 3).map((key) => (
                    <div key={key.id} className="flex items-center justify-between rounded-2xl bg-slate-100 px-3 py-2 text-xs text-slate-600">
                      <span>••••{key.secretLastFour}</span>
                      <button
                        type="button"
                        onClick={() => onRevokeKey?.(client, key.id)}
                        className="text-rose-600 transition hover:text-rose-700"
                      >
                        Revoke
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400">No keys issued yet.</p>
                )}
              </div>

              <div className="text-xs text-slate-500">
                Last activity {client.lastUsedAt ? formatRelativeTime(client.lastUsedAt) : '—'}
              </div>
            </article>
          );
        })}

        {clients.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
            No clients yet. Provision a key to connect a system.
          </div>
        ) : null}
      </div>
    </div>
  );
}
