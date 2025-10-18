import { useMemo, useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/solid';
import { formatCurrency } from '../utils.js';

function SpendRow({ entry, defaultCurrency, onView, onEdit, onDelete, canManage }) {
  return (
    <li className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => onView(entry)}
            className="text-left text-lg font-semibold text-slate-900 hover:text-slate-700"
          >
            {entry.category || 'Entry'}
          </button>
          <p className="text-sm text-slate-500">{entry.contractTitle || 'Workspace'}</p>
          <p className="text-xs text-slate-500 line-clamp-2">{entry.memo}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold text-slate-900">
            {formatCurrency({ amount: entry.amount, currency: entry.currency }, defaultCurrency)}
          </p>
          <p className="text-xs text-slate-500">{entry.recordedAt ? new Date(entry.recordedAt).toLocaleString() : '—'}</p>
        </div>
      </div>
      {canManage ? (
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={() => onEdit(entry)}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete(entry)}
            className="inline-flex items-center justify-center rounded-full border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:border-rose-300 hover:text-rose-800"
          >
            Remove
          </button>
        </div>
      ) : null}
    </li>
  );
}

export default function SpendPane({
  entries = [],
  totals = {},
  defaultCurrency = 'USD',
  canManage,
  onCreate,
  onEdit,
  onDelete,
  onView,
  loading,
}) {
  const [search, setSearch] = useState('');
  const filteredEntries = useMemo(() => {
    if (!search) {
      return entries;
    }
    const lower = search.toLowerCase();
    return entries.filter((entry) =>
      [entry.category, entry.memo, entry.contractTitle]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(lower)),
    );
  }, [entries, search]);

  return (
    <section className="flex h-full flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Spend</h2>
          <p className="text-sm text-slate-500">
            Total {formatCurrency(totals.total, defaultCurrency)} · Month {formatCurrency(totals.month, defaultCurrency)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search entries"
            className="w-48 rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-0"
          />
          {canManage ? (
            <button
              type="button"
              onClick={onCreate}
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-slate-700"
            >
              <PlusIcon className="h-4 w-4" /> New
            </button>
          ) : null}
        </div>
      </header>

      <ul className="grid gap-4">
        {filteredEntries.map((entry) => (
          <SpendRow
            key={entry.id}
            entry={entry}
            defaultCurrency={defaultCurrency}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
            canManage={canManage}
          />
        ))}
        {filteredEntries.length === 0 ? (
          <li className="rounded-3xl border border-dashed border-slate-200 p-12 text-center text-sm text-slate-500">
            {loading ? 'Loading…' : 'No spend entries'}
          </li>
        ) : null}
      </ul>
    </section>
  );
}
