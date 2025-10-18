import {
  ArrowPathIcon,
  BanknotesIcon,
  BoltIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';

const currencyCache = new Map();

function getCurrencyFormatter(currencyCode) {
  const code = currencyCode || 'USD';
  if (!currencyCache.has(code)) {
    currencyCache.set(
      code,
      new Intl.NumberFormat(undefined, { style: 'currency', currency: code, maximumFractionDigits: 2 }),
    );
  }
  return currencyCache.get(code);
}

function formatCurrency(amount, currencyCode = 'USD') {
  const formatter = getCurrencyFormatter(currencyCode);
  const value = Number.isFinite(Number(amount)) ? Number(amount) : 0;
  return formatter.format(value);
}

function formatDate(value) {
  if (!value) return '—';
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '—';
    }
    return date.toLocaleString();
  } catch (error) {
    return '—';
  }
}

function SummaryCard({ label, value, helper, icon: Icon, accent = 'border-slate-200 bg-white' }) {
  return (
    <div className={`rounded-3xl border ${accent} p-6 shadow-soft`}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
          {helper ? <p className="mt-2 text-xs text-slate-500">{helper}</p> : null}
        </div>
        {Icon ? (
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900/5 text-slate-700">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
        ) : null}
      </div>
    </div>
  );
}

function LedgerTable({ entries }) {
  if (!entries?.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
        No ledger entries yet.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50/80">
          <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <th className="px-4 py-3">Entry</th>
            <th className="px-4 py-3">Account</th>
            <th className="px-4 py-3">Amount</th>
            <th className="px-4 py-3">Balance</th>
            <th className="px-4 py-3">Time</th>
            <th className="px-4 py-3">By</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
          {entries.map((entry) => (
            <tr key={entry.id} className="hover:bg-slate-50/60">
              <td className="px-4 py-3">
                <div className="font-semibold text-slate-900">{entry.reference}</div>
                <div className="text-xs text-slate-500">{entry.entryType === 'debit' ? 'Debit' : 'Credit'}</div>
              </td>
              <td className="px-4 py-3">
                <div className="font-medium text-slate-900">{entry.walletAccount?.displayName ?? entry.walletAccount?.id}</div>
                <div className="text-xs text-slate-500">{entry.walletAccount?.accountType}</div>
              </td>
              <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                {formatCurrency(entry.amount, entry.currencyCode)}
              </td>
              <td className="px-4 py-3 text-sm text-slate-700">
                {formatCurrency(entry.balanceAfter, entry.currencyCode)}
              </td>
              <td className="px-4 py-3 text-xs text-slate-500">{formatDate(entry.occurredAt)}</td>
              <td className="px-4 py-3 text-xs text-slate-500">
                {entry.initiatedBy ? `${entry.initiatedBy.firstName ?? ''} ${entry.initiatedBy.lastName ?? ''}`.trim() || '—' : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function WalletSummary({ overview, loading, error, onRefresh }) {
  const totals = overview?.totals ?? {};
  const pending = overview?.pendingPayouts ?? { count: 0, amount: 0 };
  const cards = [
    {
      id: 'total-balance',
      label: 'Total',
      value: formatCurrency(totals.totalBalance ?? 0, 'USD'),
      helper: `${totals.accountCount ?? 0} accounts` + (totals.latestReconciledAt ? ` · ${formatDate(totals.latestReconciledAt)}` : ''),
      icon: BanknotesIcon,
    },
    {
      id: 'available',
      label: 'Available',
      value: formatCurrency(totals.availableBalance ?? 0, 'USD'),
      helper: `${pending.count} pending (${formatCurrency(pending.amount ?? 0, 'USD')})`,
      icon: BoltIcon,
      accent: 'border-emerald-100 bg-emerald-50/70',
    },
    {
      id: 'holds',
      label: 'On hold',
      value: formatCurrency(totals.pendingHoldBalance ?? 0, 'USD'),
      helper: 'Awaiting release',
      icon: ClipboardDocumentListIcon,
      accent: 'border-amber-100 bg-amber-50/70',
    },
  ];

  return (
    <section className="space-y-8" aria-labelledby="wallet-summary-title">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 id="wallet-summary-title" className="text-2xl font-semibold text-slate-900">
            Snapshot
          </h2>
        </div>
        <button
          type="button"
          onClick={() => onRefresh?.()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50/70 p-4 text-sm text-rose-700">
          Snapshot unavailable. Retry.
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <SummaryCard key={card.id} {...card} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-500">Recent ledger</h3>
          <div className="mt-3">
            <LedgerTable entries={overview?.recentLedger ?? []} />
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-500">Currencies</h3>
          <div className="mt-3 space-y-3">
            {(overview?.currencyBreakdown ?? []).map((bucket) => (
              <div
                key={bucket.currency}
                className="rounded-3xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-soft"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">{bucket.currency}</span>
                  <span className="text-xs text-slate-500">{bucket.accounts} accounts</span>
                </div>
                <div className="mt-2 text-sm">
                  <p>Total: {formatCurrency(bucket.totalBalance ?? 0, bucket.currency)}</p>
                  <p className="text-xs text-slate-500">
                    Free: {formatCurrency(bucket.availableBalance ?? 0, bucket.currency)} · Hold:{' '}
                    {formatCurrency(bucket.pendingHoldBalance ?? 0, bucket.currency)}
                  </p>
                </div>
              </div>
            ))}
            {!(overview?.currencyBreakdown?.length ?? 0) ? (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500">
                No balances yet.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
