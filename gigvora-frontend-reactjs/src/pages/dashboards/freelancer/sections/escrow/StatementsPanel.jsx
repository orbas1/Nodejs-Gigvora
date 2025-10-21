import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

function normaliseTransactions(transactions) {
  return Array.isArray(transactions) ? transactions : [];
}

function monthKey(date) {
  const instance = new Date(date);
  if (Number.isNaN(instance.getTime())) {
    return null;
  }
  const year = instance.getFullYear();
  const month = String(instance.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function formatMonthLabel(key) {
  const [year, month] = key.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

function buildStatementRows(transactions) {
  const groups = new Map();
  transactions.forEach((transaction) => {
    if (!transaction?.createdAt) {
      return;
    }
    const key = monthKey(transaction.createdAt);
    if (!key) {
      return;
    }
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        label: formatMonthLabel(key),
        inflow: 0,
        outflow: 0,
        count: 0,
      });
    }
    const bucket = groups.get(key);
    const amount = Number(transaction.amount ?? 0);
    if (amount >= 0) {
      bucket.inflow += amount;
    } else {
      bucket.outflow += amount;
    }
    bucket.count += 1;
  });
  return [...groups.values()].sort((a, b) => (a.key > b.key ? -1 : 1));
}

function formatCurrency(value, currency) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value);
}

function buildCsv(transactions, currency) {
  const header = ['Reference', 'Type', 'Status', 'Amount', 'Currency', 'Created'];
  const rows = normaliseTransactions(transactions).map((transaction) => [
    transaction.reference ?? transaction.id ?? '',
    transaction.type ?? '',
    transaction.status ?? '',
    Number(transaction.amount ?? 0).toFixed(2),
    currency,
    transaction.createdAt ? new Date(transaction.createdAt).toISOString() : '',
  ]);
  const csv = [header, ...rows]
    .map((cells) => cells.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  return csv;
}

export default function StatementsPanel({ transactions, currency, loading }) {
  const [exporting, setExporting] = useState(false);
  const statementRows = useMemo(() => buildStatementRows(normaliseTransactions(transactions)), [transactions]);
  const availableYears = useMemo(() => {
    const years = new Set();
    normaliseTransactions(transactions).forEach((transaction) => {
      if (!transaction?.createdAt) {
        return;
      }
      const created = new Date(transaction.createdAt);
      if (!Number.isNaN(created.getTime())) {
        years.add(created.getFullYear().toString());
      }
    });
    return [...years].sort((first, second) => Number(second) - Number(first));
  }, [transactions]);
  const [selectedYear, setSelectedYear] = useState(() => availableYears[0] ?? 'all');

  useEffect(() => {
    if (availableYears.length === 0) {
      if (selectedYear !== 'all') {
        setSelectedYear('all');
      }
      return;
    }

    if (selectedYear === 'all') {
      return;
    }

    if (availableYears.includes(selectedYear)) {
      return;
    }

    const nextYear = availableYears[0] ?? 'all';
    if (selectedYear !== nextYear) {
      setSelectedYear(nextYear);
    }
  }, [availableYears, selectedYear]);

  const rows = useMemo(() => {
    if (selectedYear === 'all') {
      return statementRows;
    }
    return statementRows.filter((row) => row.key.startsWith(selectedYear));
  }, [statementRows, selectedYear]);

  const totals = useMemo(() => {
    return rows.reduce(
      (accumulator, row) => ({
        inflow: accumulator.inflow + row.inflow,
        outflow: accumulator.outflow + row.outflow,
        count: accumulator.count + row.count,
      }),
      { inflow: 0, outflow: 0, count: 0 },
    );
  }, [rows]);

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const csv = buildCsv(transactions, currency);
      if (typeof window === 'undefined' || typeof document === 'undefined') {
        return;
      }
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `gigvora-escrow-statements-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-lg font-semibold text-slate-900">Statements</p>
          <p className="text-sm text-slate-500">Monthly summary of funds held, released, and refunded.</p>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="statement-year" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Period
          </label>
          <select
            id="statement-year"
            value={selectedYear}
            onChange={(event) => setSelectedYear(event.target.value)}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 focus:border-blue-300 focus:outline-none"
          >
            <option value="all">All time</option>
            {availableYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting || rows.length === 0}
          className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <ArrowDownTrayIcon className={`h-4 w-4 ${exporting ? 'animate-pulse' : ''}`} />
          {exporting ? 'Preparing…' : 'Export CSV'}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {selectedYear === 'all' ? 'Total inflow' : `Inflow ${selectedYear}`}
          </p>
          <p className="mt-2 text-2xl font-semibold text-emerald-600">{formatCurrency(totals.inflow, currency)}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {selectedYear === 'all' ? 'Total outflow' : `Outflow ${selectedYear}`}
          </p>
          <p className="mt-2 text-2xl font-semibold text-rose-600">{formatCurrency(Math.abs(totals.outflow), currency)}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {selectedYear === 'all' ? 'Transactions' : `Transactions ${selectedYear}`}
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{totals.count}</p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">Loading latest ledger…</div>
      ) : null}

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-100 text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th scope="col" className="px-4 py-3 text-left">Month</th>
              <th scope="col" className="px-4 py-3 text-right">Inflow</th>
              <th scope="col" className="px-4 py-3 text-right">Outflow</th>
              <th scope="col" className="px-4 py-3 text-right">Transactions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-600">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-sm text-slate-500">
                  No escrow transactions recorded for this period yet.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.key}>
                  <td className="px-4 py-3 text-left font-medium text-slate-700">{row.label}</td>
                  <td className="px-4 py-3 text-right text-emerald-600">{formatCurrency(row.inflow, currency)}</td>
                  <td className="px-4 py-3 text-right text-rose-600">{formatCurrency(Math.abs(row.outflow), currency)}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{row.count}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

StatementsPanel.propTypes = {
  transactions: PropTypes.arrayOf(PropTypes.object),
  currency: PropTypes.string,
  loading: PropTypes.bool,
};

StatementsPanel.defaultProps = {
  transactions: [],
  currency: 'USD',
  loading: false,
};
