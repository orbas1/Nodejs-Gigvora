import { useMemo, useState } from 'react';
import { ClockIcon } from '@heroicons/react/24/outline';

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

export default function ActivityPanel({ activity, transactions }) {
  const [transactionFilter, setTransactionFilter] = useState('all');

  const transactionOptions = useMemo(() => {
    const options = new Map();
    transactions.forEach((txn) => {
      options.set(String(txn.id), txn.reference || `#${txn.id}`);
    });
    return Array.from(options.entries());
  }, [transactions]);

  const filteredActivity = useMemo(() => {
    if (transactionFilter === 'all') {
      return activity;
    }
    return activity.filter((item) => String(item.transactionId) === transactionFilter);
  }, [activity, transactionFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setTransactionFilter('all')}
          className={`rounded-full px-4 py-2 text-sm font-medium ${
            transactionFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
          }`}
        >
          All events
        </button>
        {transactionOptions.map(([id, reference]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTransactionFilter(id)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              transactionFilter === id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {reference}
          </button>
        ))}
      </div>
      <div className="space-y-4">
        {filteredActivity.map((entry) => (
          <div
            key={`${entry.transactionId}-${entry.occurredAt}-${entry.action}`}
            className="flex items-start gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white">
              <ClockIcon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-400">
                <span>{entry.reference ?? `Txn ${entry.transactionId}`}</span>
                <span>{formatDate(entry.occurredAt)}</span>
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-900">{entry.action?.replace('_', ' ')}</p>
              <p className="text-sm text-slate-600">{entry.notes || 'System event'}</p>
              <p className="mt-2 text-xs text-slate-400">Amount: {entry.amount}</p>
            </div>
          </div>
        ))}
        {!filteredActivity.length ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
            No activity logged yet.
          </div>
        ) : null}
      </div>
    </div>
  );
}
