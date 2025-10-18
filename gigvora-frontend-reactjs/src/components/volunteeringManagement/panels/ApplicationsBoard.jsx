import {
  ChatBubbleLeftIcon,
  CurrencyDollarIcon,
  PencilSquareIcon,
  PlusIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import { formatTimeAgo } from '../utils.js';

export default function ApplicationsBoard({
  applications,
  onCreate,
  onEdit,
  onRespond,
  onContract,
  onSpend,
  onReview,
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-600">{applications.length} records</span>
        <button
          type="button"
          onClick={onCreate}
          className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
        >
          <PlusIcon className="h-4 w-4" /> New
        </button>
      </div>
      <div className="mt-4 flex-1 overflow-hidden rounded-3xl border border-slate-200">
        {applications.length === 0 ? (
          <div className="flex h-full items-center justify-center px-6 py-20 text-sm text-slate-500">No applications yet</div>
        ) : (
          <div className="max-h-[540px] overflow-y-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Role
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Submitted
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Hours
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {applications.map((application) => (
                  <tr key={application.id} className="hover:bg-emerald-50/30">
                    <td className="px-4 py-3 align-top">
                      <div className="text-sm font-semibold text-slate-900">
                        {application.role?.title ?? 'Untitled'}
                      </div>
                      <div className="text-xs text-slate-500">
                        {application.role?.organization ?? 'Partner'}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        {application.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top text-sm text-slate-600">
                      {application.submittedAt ? formatTimeAgo(application.submittedAt) : '—'}
                    </td>
                    <td className="px-4 py-3 align-top text-sm text-slate-600">
                      {application.availabilityHoursPerWeek ?? '—'}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          className="rounded-full border border-slate-200 p-2 text-slate-600 hover:bg-white"
                          onClick={() => onEdit(application)}
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </button>
                        <button
                          type="button"
                          className="rounded-full border border-slate-200 p-2 text-slate-600 hover:bg-white"
                          onClick={() => onRespond(application)}
                        >
                          <ChatBubbleLeftIcon className="h-4 w-4" />
                          <span className="sr-only">Respond</span>
                        </button>
                        <button
                          type="button"
                          className="rounded-full border border-slate-200 p-2 text-slate-600 hover:bg-white"
                          onClick={() => onContract(application)}
                        >
                          <DocumentIcon />
                          <span className="sr-only">Contract</span>
                        </button>
                        <button
                          type="button"
                          className="rounded-full border border-slate-200 p-2 text-slate-600 hover:bg-white"
                          onClick={() => onSpend(application)}
                        >
                          <CurrencyDollarIcon className="h-4 w-4" />
                          <span className="sr-only">Spend</span>
                        </button>
                        <button
                          type="button"
                          className="rounded-full border border-slate-200 p-2 text-slate-600 hover:bg-white"
                          onClick={() => onReview(application)}
                        >
                          <StarIcon className="h-4 w-4" />
                          <span className="sr-only">Review</span>
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

function DocumentIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" strokeWidth="1.5" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.5 2.25h-9A2.25 2.25 0 0 0 5.25 4.5v15A2.25 2.25 0 0 0 7.5 21.75h9a2.25 2.25 0 0 0 2.25-2.25v-15A2.25 2.25 0 0 0 16.5 2.25z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 7.5h6M9 12h6M9 16.5h3" />
    </svg>
  );
}
