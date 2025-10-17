import { useMemo, useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/solid';
import { formatCurrency } from '../utils.js';

const LIST_MODES = [
  { id: 'open', label: 'Open' },
  { id: 'finished', label: 'Finished' },
  { id: 'all', label: 'All' },
];

function StatusPill({ value }) {
  if (!value) {
    return null;
  }
  const tone = /open|active|progress/i.test(value)
    ? 'bg-emerald-100 text-emerald-700'
    : /finish|closed|ended|complete/i.test(value)
    ? 'bg-slate-200 text-slate-700'
    : 'bg-sky-100 text-sky-700';
  const label = value.replace(/[_-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>{label}</span>;
}

function ContractCard({ contract, defaultCurrency, onView, onEdit, onDelete, canManage }) {
  return (
    <li className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => onView(contract)}
            className="text-left text-lg font-semibold text-slate-900 hover:text-slate-700"
          >
            {contract.title}
          </button>
          <p className="text-sm text-slate-500">{contract.partnerOrganization || 'Internal programme'}</p>
        </div>
        <StatusPill value={contract.status} />
      </div>

      <dl className="grid gap-4 text-sm text-slate-600 sm:grid-cols-2">
        <div>
          <dt className="font-semibold text-slate-500">Planned volunteers</dt>
          <dd className="mt-1 text-slate-900">{contract.volunteerCount ?? '—'}</dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-500">Spend</dt>
          <dd className="mt-1 text-slate-900">
            {formatCurrency({ amount: contract.spendToDate, currency: contract.currency }, defaultCurrency)}
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-500">Start</dt>
          <dd className="mt-1 text-slate-900">{contract.startDate ? new Date(contract.startDate).toLocaleDateString() : '—'}</dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-500">End</dt>
          <dd className="mt-1 text-slate-900">{contract.endDate ? new Date(contract.endDate).toLocaleDateString() : '—'}</dd>
        </div>
      </dl>

      {canManage ? (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => onEdit(contract)}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete(contract)}
            className="inline-flex items-center justify-center rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:border-rose-300 hover:text-rose-800"
          >
            Remove
          </button>
        </div>
      ) : null}
    </li>
  );
}

export default function ContractsPane({
  contracts = {},
  defaultCurrency = 'USD',
  canManage,
  onCreate,
  onEdit,
  onDelete,
  onView,
  loading,
}) {
  const [mode, setMode] = useState('open');

  const visibleContracts = useMemo(() => {
    if (mode === 'open') {
      return contracts.open ?? [];
    }
    if (mode === 'finished') {
      return contracts.finished ?? [];
    }
    return contracts.all ?? [];
  }, [contracts, mode]);

  return (
    <section className="flex h-full flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Deals</h2>
        </div>
        {canManage ? (
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-slate-700"
          >
            <PlusIcon className="h-4 w-4" /> New
          </button>
        ) : null}
      </header>

      <nav className="flex items-center gap-2">
        {LIST_MODES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setMode(item.id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              mode === item.id ? 'bg-slate-900 text-white shadow-soft' : 'border border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900'
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <ul className="grid gap-4">
        {visibleContracts.map((contract) => (
          <ContractCard
            key={contract.id}
            contract={contract}
            defaultCurrency={defaultCurrency}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
            canManage={canManage}
          />
        ))}
        {visibleContracts.length === 0 ? (
          <li className="rounded-3xl border border-dashed border-slate-200 p-12 text-center text-sm text-slate-500">
            {loading ? 'Loading…' : 'No contracts in this view'}
          </li>
        ) : null}
      </ul>
    </section>
  );
}
