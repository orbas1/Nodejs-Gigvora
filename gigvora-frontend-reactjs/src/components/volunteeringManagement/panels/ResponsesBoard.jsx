import {
  ArrowPathIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { formatTimeAgo } from '../utils.js';

export default function ResponsesBoard({ responses, onEdit, onDelete, onCreate }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-600">{responses.length} logs</span>
        {onCreate ? (
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            <ArrowPathIcon className="h-4 w-4" /> New
          </button>
        ) : null}
      </div>
      <div className="mt-4 flex-1 overflow-hidden rounded-3xl border border-slate-200">
        {responses.length === 0 ? (
          <div className="flex h-full items-center justify-center px-6 py-20 text-sm text-slate-500">No responses yet</div>
        ) : (
          <div className="max-h-[540px] overflow-y-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Application</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Message</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">When</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {responses.map((response) => (
                  <tr key={response.id} className="hover:bg-emerald-50/30">
                    <td className="px-4 py-3 align-top text-sm font-semibold text-slate-900">
                      {response.application?.role?.title ?? `Application #${response.applicationId}`}
                    </td>
                    <td className="px-4 py-3 align-top text-sm text-slate-600">{response.responseType.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3 align-top text-sm text-slate-600">
                      <Truncated>{response.message}</Truncated>
                    </td>
                    <td className="px-4 py-3 align-top text-sm text-slate-600">
                      {response.respondedAt ? formatTimeAgo(response.respondedAt) : '—'}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          className="rounded-full border border-slate-200 p-2 text-slate-600 hover:bg-white"
                          onClick={() => onEdit(response)}
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </button>
                        <button
                          type="button"
                          className="rounded-full border border-slate-200 p-2 text-rose-600 hover:bg-white"
                          onClick={() => onDelete(response)}
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

function Truncated({ children }) {
  if (!children) {
    return <span className="text-slate-400">—</span>;
  }
  const text = typeof children === 'string' ? children : String(children);
  return <span className="line-clamp-2 text-slate-700">{text}</span>;
}
