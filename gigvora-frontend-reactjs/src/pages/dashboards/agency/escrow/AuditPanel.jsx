import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import DataStatus from '../../../../components/DataStatus.jsx';
import { formatRelativeTime } from '../../../../utils/date.js';
import { useEscrow } from './EscrowContext.jsx';
import { formatCurrency } from './formatters.js';

function toCsvRow(values = []) {
  return values
    .map((value) => {
      if (value == null) return '';
      const stringValue = String(value).replace(/"/g, '""');
      if (stringValue.search(/([",\n])/g) >= 0) {
        return `"${stringValue}"`;
      }
      return stringValue;
    })
    .join(',');
}

function exportTransactions(transactions = []) {
  if (!transactions.length) {
    return;
  }
  const headers = toCsvRow(['id', 'reference', 'status', 'amount', 'currency', 'createdAt', 'releasedAt', 'refundedAt']);
  const rows = transactions.map((transaction) =>
    toCsvRow([
      transaction.id,
      transaction.reference,
      transaction.status,
      transaction.amount,
      transaction.currencyCode,
      transaction.createdAt,
      transaction.releasedAt,
      transaction.refundedAt,
    ]),
  );
  const csv = [headers, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', `escrow-audit-${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export default function AuditPanel() {
  const { state, openActivityDrawer } = useEscrow();
  const { transactions } = state;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col items-start justify-between gap-4 rounded-3xl border border-slate-200 bg-white px-6 py-6 shadow-sm lg:flex-row">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Audit</h1>
          <p className="mt-1 text-sm text-slate-500">Trace every release and refund.</p>
        </div>
        <button
          type="button"
          onClick={() => exportTransactions(transactions.list)}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
        >
          <ArrowDownTrayIcon className="h-4 w-4" />
          Export CSV
        </button>
      </header>

      <DataStatus loading={transactions.loading} empty={!transactions.loading && transactions.list.length === 0}>
        <ol className="space-y-4">
          {transactions.list.map((transaction) => (
            <li key={transaction.id} className="relative rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <button
                    type="button"
                    onClick={() => openActivityDrawer('Move details', { type: 'move', item: transaction })}
                    className="text-left text-base font-semibold text-slate-900 hover:underline"
                  >
                    {transaction.reference}
                  </button>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span>{transaction.status}</span>
                    <span>•</span>
                    <span>{formatRelativeTime(transaction.createdAt)}</span>
                    {transaction.releasedAt ? (
                      <>
                        <span>•</span>
                        <span>released {formatRelativeTime(transaction.releasedAt)}</span>
                      </>
                    ) : null}
                    {transaction.refundedAt ? (
                      <>
                        <span>•</span>
                        <span>refunded {formatRelativeTime(transaction.refundedAt)}</span>
                      </>
                    ) : null}
                  </div>
                </div>
                <div className="text-right text-sm">
                  <p className="font-semibold text-slate-900">
                    {formatCurrency(transaction.amount, transaction.currencyCode)}
                  </p>
                  <p className="text-xs text-slate-500">Fee {formatCurrency(transaction.feeAmount, transaction.currencyCode)}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </DataStatus>
    </div>
  );
}
