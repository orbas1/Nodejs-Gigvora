export default function RecentTransactionsTable({ transactions, formatCurrency, formatDate }) {
  const rows = Array.isArray(transactions) ? transactions : [];

  return (
    <section id="finance-transactions" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-blue-100/40 sm:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Recent escrow transactions</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            A snapshot of the latest escrow entries flowing through Gigvora, including net and gross amounts.
          </p>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50/80">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Reference</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Type</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Gross</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Net</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Account</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {rows.length ? (
              rows.map((transaction) => (
                <tr key={transaction.id ?? transaction.reference} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-semibold text-slate-900">{transaction.reference}</td>
                  <td className="px-4 py-3 text-xs uppercase tracking-wide text-slate-500">{transaction.type}</td>
                  <td className="px-4 py-3 text-xs uppercase tracking-wide text-slate-500">{transaction.status}</td>
                  <td className="px-4 py-3 text-right text-sm text-slate-700">{formatCurrency(transaction.amount, transaction.currencyCode)}</td>
                  <td className="px-4 py-3 text-right text-sm text-slate-700">{formatCurrency(transaction.netAmount, transaction.currencyCode)}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{transaction.account?.provider ?? '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{formatDate(transaction.createdAt)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-sm text-slate-500">
                  No escrow transactions recorded in this window.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
