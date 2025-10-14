function formatCurrency(cents, currency = 'USD') {
  if (!Number.isFinite(Number(cents))) {
    return '—';
  }
  const amount = Number(cents) / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatPercent(value) {
  if (!Number.isFinite(Number(value))) {
    return '—';
  }
  return `${Number(value).toFixed(1)}%`;
}

export default function ProjectPaySplitTable({ splits = [] }) {
  const totalPercent = splits.reduce((total, split) => total + (Number(split.allocationPercent) || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">Contributor economics</p>
          <h4 className="text-lg font-semibold text-slate-900">Pay splits & revenue sharing</h4>
        </div>
        <div className="text-xs text-slate-500">
          Total allocation: <strong className="text-slate-700">{formatPercent(totalPercent)}</strong>
        </div>
      </div>
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white/90 shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th scope="col" className="px-4 py-3 text-left font-semibold">
                Contributor
              </th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">
                Allocation
              </th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">
                Payout cadence
              </th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-600">
            {splits.length ? (
              splits.map((split) => (
                <tr key={split.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">{split.contributorName}</div>
                    <div className="text-xs text-slate-500">{split.contributorType ?? 'Contributor'}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">
                      {formatCurrency(split.allocationAmountCents, split.currency)}
                    </div>
                    <div className="text-xs text-slate-500">{formatPercent(split.allocationPercent)}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{split.payoutCadence ?? 'Milestone'}</td>
                  <td className="px-4 py-3 text-xs font-semibold text-slate-500">{split.status ?? 'pending'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-sm text-slate-500">
                  Define contributor splits to automate payouts across freelancers, agencies, and company staff.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
