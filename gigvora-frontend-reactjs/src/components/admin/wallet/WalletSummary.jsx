const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatCurrency(value) {
  const numeric = Number.isFinite(Number(value)) ? Number(value) : 0;
  return currencyFormatter.format(numeric);
}

function formatCount(value) {
  const numeric = Number.isFinite(Number(value)) ? Number(value) : 0;
  return numeric.toLocaleString('en-US');
}

function SummaryTile({ label, value }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export default function WalletSummary({ globalSummary, filteredSummary }) {
  const totals = filteredSummary?.totals ?? globalSummary?.totals ?? {};
  const statusBreakdown = filteredSummary?.byStatus ?? globalSummary?.byStatus ?? {};
  const typeBreakdown = filteredSummary?.byType ?? globalSummary?.byType ?? {};

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-4">
        <SummaryTile label="Balance" value={formatCurrency(totals.currentBalance ?? 0)} />
        <SummaryTile label="Ready" value={formatCurrency(totals.availableBalance ?? 0)} />
        <SummaryTile label="Hold" value={formatCurrency(totals.pendingHoldBalance ?? 0)} />
        <SummaryTile label="Wallets" value={formatCount(totals.accounts ?? 0)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">By status</p>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm text-slate-600 sm:grid-cols-4">
            {Object.entries(statusBreakdown).map(([status, count]) => (
              <div key={status} className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-center">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{status}</dt>
                <dd className="mt-1 text-base font-semibold text-slate-900">{formatCount(count)}</dd>
              </div>
            ))}
            {!Object.keys(statusBreakdown).length ? (
              <p className="col-span-4 text-center text-sm text-slate-500">No data</p>
            ) : null}
          </dl>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">By type</p>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm text-slate-600 sm:grid-cols-4">
            {Object.entries(typeBreakdown).map(([type, count]) => (
              <div key={type} className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-center">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{type}</dt>
                <dd className="mt-1 text-base font-semibold text-slate-900">{formatCount(count)}</dd>
              </div>
            ))}
            {!Object.keys(typeBreakdown).length ? (
              <p className="col-span-4 text-center text-sm text-slate-500">No data</p>
            ) : null}
          </dl>
        </div>
      </div>
    </div>
  );
}
