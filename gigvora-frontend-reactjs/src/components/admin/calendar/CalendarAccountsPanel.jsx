import { PencilSquareIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat('en', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch (error) {
    return '—';
  }
}

export default function CalendarAccountsPanel({ accounts, onCreate, onEdit, onDelete, onManageSlots }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Accounts</h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:-translate-y-0.5 hover:shadow-xl"
          >
            <PlusIcon className="h-4 w-4" />
            New account
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {accounts.length === 0 ? (
          <div className="col-span-full rounded-3xl border border-dashed border-slate-300 bg-slate-100 px-6 py-10 text-center text-sm text-slate-500">
            No accounts yet
          </div>
        ) : (
          accounts.map((account) => (
            <div key={account.id} className="flex flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">{account.provider}</p>
                  <h3 className="mt-1 text-lg font-semibold text-slate-900">{account.displayName || account.accountEmail}</h3>
                  <p className="text-sm text-slate-500">{account.accountEmail}</p>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase ${
                    account.syncStatus === 'connected'
                      ? 'bg-emerald-100 text-emerald-600'
                      : account.syncStatus === 'syncing'
                      ? 'bg-sky-100 text-sky-600'
                      : 'bg-amber-100 text-amber-600'
                  }`}
                >
                  {account.syncStatus?.replace(/_/g, ' ') ?? 'unknown'}
                </span>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-500">
                <div>
                  <dt className="font-semibold text-slate-400">Time zone</dt>
                  <dd className="mt-1 text-sm text-slate-600">{account.timezone || 'UTC'}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-400">Last sync</dt>
                  <dd className="mt-1 text-sm text-slate-600">{formatDate(account.lastSyncedAt)}</dd>
                </div>
              </dl>

              <div className="mt-6 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onManageSlots(account)}
                  className="flex-1 rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                >
                  Slots
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(account)}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                >
                  <PencilSquareIcon className="h-4 w-4" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(account)}
                  className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-rose-600 transition hover:border-rose-300 hover:text-rose-700"
                >
                  <TrashIcon className="h-4 w-4" />
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
