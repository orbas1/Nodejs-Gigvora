import { ArrowPathIcon, PencilSquareIcon, PlusIcon } from '@heroicons/react/24/outline';

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

export default function ApiProvidersPanel({ providers = [], onEdit, onCreateClient, onSelect }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold text-slate-900">Providers</h2>
        <p className="text-sm text-slate-500">Statuses, pricing, and usage for every integration.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {providers.map((provider) => (
          <article key={provider.id} className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xl font-semibold text-slate-900">{provider.name}</h3>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  {provider.status}
                </span>
              </div>
              <p className="text-sm text-slate-500">{provider.description || 'No description provided.'}</p>
            </div>

            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Clients</dt>
                <dd className="mt-1 text-lg font-semibold text-slate-900">{formatNumber(provider.summary?.activeClients)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">30d calls</dt>
                <dd className="mt-1 text-lg font-semibold text-slate-900">{formatNumber(provider.summary?.requestCount30d)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">30d revenue</dt>
                <dd className="mt-1 text-lg font-semibold text-slate-900">{formatCurrency(provider.summary?.billedAmountCents30d)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Call price</dt>
                <dd className="mt-1 text-lg font-semibold text-slate-900">{formatCurrency(provider.callPriceCents)}</dd>
              </div>
            </dl>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onEdit?.(provider)}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-blue-300 hover:text-blue-600"
              >
                <PencilSquareIcon className="h-4 w-4" /> Edit
              </button>
              <button
                type="button"
                onClick={() => onCreateClient?.(provider.id)}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-emerald-300 hover:text-emerald-600"
              >
                <PlusIcon className="h-4 w-4" /> New client
              </button>
              {onSelect ? (
                <button
                  type="button"
                  onClick={() => onSelect(provider)}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-slate-300 hover:text-slate-700"
                >
                  <ArrowPathIcon className="h-4 w-4" /> Details
                </button>
              ) : null}
            </div>
          </article>
        ))}

        {providers.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
            No providers yet. Add one to start issuing credentials.
          </div>
        ) : null}
      </div>
    </div>
  );
}
