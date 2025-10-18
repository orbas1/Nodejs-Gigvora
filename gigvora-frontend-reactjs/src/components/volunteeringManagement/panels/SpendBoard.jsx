import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import { formatCurrency, formatDate } from '../utils.js';

export default function SpendBoard({ entries, totals, onEdit, onDelete, onCreate }) {
  const currencies = Object.entries(totals ?? {});
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-600">{entries.length} lines</span>
        {onCreate ? (
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
          >
            Add
          </button>
        ) : null}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {currencies.map(([currency, amount]) => (
          <span key={currency} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            {currency}: {formatCurrency(amount, currency)}
          </span>
        ))}
      </div>
      <div className="mt-4 flex-1 overflow-hidden rounded-3xl border border-slate-200">
        {entries.length === 0 ? (
          <div className="flex h-full items-center justify-center px-6 py-20 text-sm text-slate-500">No spend recorded</div>
        ) : (
          <div className="max-h-[540px] overflow-y-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Application</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Incurred</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-emerald-50/30">
                    <td className="px-4 py-3 align-top text-sm font-semibold text-slate-900">
                      {entry.application?.role?.title ?? `Application #${entry.applicationId}`}
                    </td>
                    <td className="px-4 py-3 align-top text-sm text-slate-600">{entry.category.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3 align-top text-sm text-slate-600">
                      {formatCurrency(entry.amount, entry.currencyCode ?? 'USD')}
                    </td>
                    <td className="px-4 py-3 align-top text-sm text-slate-600">{formatDate(entry.incurredAt)}</td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          className="rounded-full border border-slate-200 p-2 text-slate-600 hover:bg-white"
                          onClick={() => onEdit(entry)}
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </button>
                        <button
                          type="button"
                          className="rounded-full border border-slate-200 p-2 text-rose-600 hover:bg-white"
                          onClick={() => onDelete(entry)}
                        >
                          <TrashIcon className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
