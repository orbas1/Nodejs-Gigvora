import { PencilSquareIcon } from '@heroicons/react/24/outline';
import { formatCurrency, formatDate } from '../utils.js';

export default function ContractsBoard({ contracts, emptyLabel, onManage }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-600">{contracts.length} contracts</span>
      </div>
      <div className="mt-4 flex-1 overflow-hidden rounded-3xl border border-slate-200">
        {contracts.length === 0 ? (
          <div className="flex h-full items-center justify-center px-6 py-20 text-sm text-slate-500">{emptyLabel}</div>
        ) : (
          <div className="max-h-[540px] overflow-y-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Application</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Dates</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Value</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Manage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {contracts.map((contract) => (
                  <tr key={contract.id} className="hover:bg-emerald-50/30">
                    <td className="px-4 py-3 align-top text-sm font-semibold text-slate-900">
                      {contract.application?.role?.title ?? `Application #${contract.applicationId}`}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        {contract.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top text-sm text-slate-600">
                      {formatDate(contract.startDate)} → {formatDate(contract.endDate)}
                    </td>
                    <td className="px-4 py-3 align-top text-sm text-slate-600">
                      {contract.totalValue != null
                        ? formatCurrency(contract.totalValue, contract.currencyCode ?? 'USD')
                        : '—'}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                          onClick={() => onManage(contract)}
                        >
                          <PencilSquareIcon className="h-4 w-4" /> Edit
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
