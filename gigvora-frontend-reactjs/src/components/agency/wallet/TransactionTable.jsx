import { Fragment, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ShieldExclamationIcon,
} from '@heroicons/react/24/outline';
import { formatCurrency, formatDateTime, formatStatus } from '../../wallet/walletFormatting.js';

const SORT_FIELDS = ['occurredAt', 'amount'];

function deriveValue(value, fallback = '') {
  if (value == null) {
    return fallback;
  }
  if (typeof value === 'string') {
    return value;
  }
  if (value && typeof value === 'object') {
    return value.name ?? value.label ?? fallback;
  }
  return String(value);
}

function buildFilterOptions(transactions, key) {
  const set = new Set();
  transactions.forEach((transaction) => {
    const raw = transaction[key];
    if (raw == null) {
      return;
    }
    const normalized = Array.isArray(raw) ? raw : [raw];
    normalized.forEach((value) => {
      if (value == null || value === '') {
        return;
      }
      set.add(String(value));
    });
  });
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

function sortTransactions(transactions, field, direction) {
  const modifier = direction === 'asc' ? 1 : -1;
  return [...transactions].sort((a, b) => {
    const left = a[field];
    const right = b[field];
    if (field === 'occurredAt') {
      const leftTime = left ? new Date(left).getTime() : 0;
      const rightTime = right ? new Date(right).getTime() : 0;
      return (leftTime - rightTime) * modifier;
    }
    const leftValue = Number(left);
    const rightValue = Number(right);
    if (Number.isFinite(leftValue) && Number.isFinite(rightValue)) {
      if (leftValue === rightValue) {
        return 0;
      }
      return leftValue > rightValue ? modifier : -modifier;
    }
    return deriveValue(left).localeCompare(deriveValue(right)) * modifier;
  });
}

function StatusBadge({ status }) {
  const tone = String(status ?? '').toLowerCase();
  const palette =
    tone === 'completed' || tone === 'approved'
      ? 'bg-emerald-50/70 text-emerald-700 border-emerald-200'
      : tone === 'failed' || tone === 'cancelled'
      ? 'bg-rose-50/70 text-rose-700 border-rose-200'
      : tone === 'pending' || tone === 'processing'
      ? 'bg-amber-50/70 text-amber-700 border-amber-200'
      : 'bg-slate-50 text-slate-700 border-slate-200';
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${palette}`}>
      {formatStatus(status)}
    </span>
  );
}

StatusBadge.propTypes = {
  status: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};

function EmptyState({ loading, onRetry }) {
  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-8 text-center text-sm text-slate-500">
        Loading transactions…
      </div>
    );
  }
  return (
    <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
      <p className="font-semibold text-slate-700">No transactions found.</p>
      <p className="mt-2 text-xs text-slate-500">Adjust filters or refresh the ledger to discover more activity.</p>
      <button
        type="button"
        onClick={() => onRetry?.()}
        className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-600"
      >
        <ArrowPathIcon className="h-4 w-4" aria-hidden="true" /> Refresh
      </button>
    </div>
  );
}

EmptyState.propTypes = {
  loading: PropTypes.bool,
  onRetry: PropTypes.func,
};

EmptyState.defaultProps = {
  loading: false,
  onRetry: undefined,
};

function TransactionRow({ transaction, onSelect, currency, isExpanded }) {
  const amount = formatCurrency(transaction.amount ?? transaction.total ?? 0, transaction.currencyCode ?? currency);
  const anomalyScore = transaction.anomalyScore ?? transaction.anomaly ?? null;
  return (
    <tr className="border-b border-slate-100 text-sm text-slate-700 transition hover:bg-slate-50">
      <td className="px-4 py-4">
        <div className="font-semibold text-slate-900">{transaction.reference ?? transaction.id}</div>
        <div className="text-xs text-slate-500">{formatStatus(transaction.type ?? transaction.entryType ?? 'transfer')}</div>
      </td>
      <td className="px-4 py-4">
        <StatusBadge status={transaction.status ?? transaction.state ?? transaction.entryStatus ?? 'pending'} />
        {transaction.flagged ? (
          <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
            <ShieldExclamationIcon className="h-3 w-3" aria-hidden="true" /> Flagged
          </span>
        ) : null}
      </td>
      <td className="px-4 py-4 text-sm font-semibold text-slate-900">{amount}</td>
      <td className="px-4 py-4 text-xs text-slate-500">{formatDateTime(transaction.occurredAt ?? transaction.createdAt)}</td>
      <td className="px-4 py-4">
        <div className="text-sm font-medium text-slate-900">{deriveValue(transaction.counterparty ?? transaction.destination, '—')}</div>
        <div className="text-xs text-slate-500">{formatStatus(transaction.channel ?? transaction.method ?? 'ledger')}</div>
      </td>
      <td className="px-4 py-4 text-xs text-slate-500">
        {anomalyScore != null ? `${Math.round(anomalyScore * 100)}% risk` : '—'}
      </td>
      <td className="px-4 py-4 text-right">
        <button
          type="button"
          onClick={() => onSelect?.(transaction)}
          className="text-xs font-semibold text-blue-600 transition hover:text-blue-800"
        >
          {isExpanded ? 'Hide details' : 'View details'}
        </button>
      </td>
    </tr>
  );
}

TransactionRow.propTypes = {
  transaction: PropTypes.object.isRequired,
  onSelect: PropTypes.func,
  currency: PropTypes.string.isRequired,
  isExpanded: PropTypes.bool.isRequired,
};

TransactionRow.defaultProps = {
  onSelect: undefined,
};

function TransactionDetails({ transaction }) {
  const metadataEntries = Object.entries(transaction.metadata ?? {}).slice(0, 6);
  return (
    <tr className="border-b border-slate-100 bg-slate-50/60 text-xs text-slate-600">
      <td colSpan={7} className="px-4 pb-6 pt-2">
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <p className="font-semibold text-slate-500">Source account</p>
            <p className="mt-1 text-slate-700">{deriveValue(transaction.walletAccount ?? transaction.sourceAccount, '—')}</p>
          </div>
          <div>
            <p className="font-semibold text-slate-500">Funding source</p>
            <p className="mt-1 text-slate-700">{deriveValue(transaction.fundingSource ?? transaction.methodDetails, '—')}</p>
          </div>
          <div>
            <p className="font-semibold text-slate-500">Notes</p>
            <p className="mt-1 text-slate-700">{transaction.notes ?? transaction.description ?? '—'}</p>
          </div>
        </div>
        {metadataEntries.length ? (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white/60 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Metadata</p>
            <dl className="mt-2 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
              {metadataEntries.map(([key, value]) => (
                <div key={key} className="flex items-center justify-between gap-3">
                  <dt className="font-medium text-slate-500">{formatStatus(key)}</dt>
                  <dd className="text-right text-slate-700">{deriveValue(value, '—')}</dd>
                </div>
              ))}
            </dl>
          </div>
        ) : null}
      </td>
    </tr>
  );
}

TransactionDetails.propTypes = {
  transaction: PropTypes.object.isRequired,
};

export default function TransactionTable({
  transactions,
  loading,
  error,
  onRetry,
  onExport,
  onSelectTransaction,
  defaultPageSize = 12,
  workspaceCurrency = 'USD',
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [sortField, setSortField] = useState('occurredAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [page, setPage] = useState(0);
  const [expandedIds, setExpandedIds] = useState(() => new Set());

  const safeTransactions = Array.isArray(transactions) ? transactions.filter(Boolean) : [];
  const statusOptions = useMemo(() => buildFilterOptions(safeTransactions, 'status'), [safeTransactions]);
  const typeOptions = useMemo(
    () => buildFilterOptions(safeTransactions, 'type').concat(buildFilterOptions(safeTransactions, 'entryType')),
    [safeTransactions],
  );
  const channelOptions = useMemo(
    () => buildFilterOptions(safeTransactions, 'channel').concat(buildFilterOptions(safeTransactions, 'method')),
    [safeTransactions],
  );

  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return safeTransactions.filter((transaction) => {
      if (flaggedOnly && !transaction.flagged && !(transaction.anomalyScore > 0.7)) {
        return false;
      }
      if (statusFilter !== 'all') {
        const status = String(transaction.status ?? transaction.state ?? transaction.entryStatus ?? '').toLowerCase();
        if (status !== statusFilter) {
          return false;
        }
      }
      if (typeFilter !== 'all') {
        const type = String(transaction.type ?? transaction.entryType ?? '').toLowerCase();
        if (type !== typeFilter) {
          return false;
        }
      }
      if (channelFilter !== 'all') {
        const channel = String(transaction.channel ?? transaction.method ?? '').toLowerCase();
        if (channel !== channelFilter) {
          return false;
        }
      }
      if (normalizedSearch) {
        const haystack = [
          transaction.reference,
          transaction.id,
          transaction.destination,
          transaction.counterparty,
          transaction.notes,
        ]
          .filter(Boolean)
          .map((value) => String(value).toLowerCase())
          .join(' ');
        if (!haystack.includes(normalizedSearch)) {
          return false;
        }
      }
      return true;
    });
  }, [safeTransactions, flaggedOnly, statusFilter, typeFilter, channelFilter, search]);

  const sorted = useMemo(() => {
    const base = sortTransactions(filtered, sortField, sortDirection);
    return base;
  }, [filtered, sortField, sortDirection]);

  const pageSize = defaultPageSize;
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages - 1);
  const paginated = sorted.slice(currentPage * pageSize, currentPage * pageSize + pageSize);

  const totalAmount = filtered.reduce((acc, transaction) => acc + Number(transaction.amount ?? 0), 0);
  const flaggedCount = filtered.reduce((acc, transaction) => (transaction.flagged ? acc + 1 : acc), 0);

  const handleSortChange = (field) => {
    if (!SORT_FIELDS.includes(field)) {
      return;
    }
    if (sortField === field) {
      setSortDirection((previous) => (previous === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortField(field);
    setSortDirection('desc');
  };

  const handleToggleExpand = (transaction) => {
    setExpandedIds((previous) => {
      const next = new Set(previous);
      const id = transaction.id ?? transaction.reference;
      if (!id) {
        return next;
      }
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    onSelectTransaction?.(transaction);
  };

  return (
    <section className="space-y-6" aria-labelledby="wallet-transaction-table">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ledger intelligence</p>
          <h3 id="wallet-transaction-table" className="text-2xl font-semibold text-slate-900">
            Transaction activity
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Filter, audit, and export detailed wallet movements to keep finance, ops, and compliance in lockstep.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <div className="rounded-full border border-slate-200 bg-white px-3 py-1 font-semibold text-slate-600">
            {filtered.length} records
          </div>
          <div className="rounded-full border border-slate-200 bg-white px-3 py-1 font-semibold text-slate-600">
            Total {formatCurrency(totalAmount, workspaceCurrency)}
          </div>
          {flaggedCount ? (
            <div className="rounded-full border border-amber-200 bg-amber-50/70 px-3 py-1 font-semibold text-amber-700">
              {flaggedCount} flagged
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-6">
          <label className="lg:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Search</span>
            <div className="mt-2 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
              <MagnifyingGlassIcon className="h-4 w-4 text-slate-400" aria-hidden="true" />
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(0);
                }}
                placeholder="Reference, counterparty, notes"
                className="w-full bg-transparent text-sm text-slate-700 focus:outline-none"
              />
            </div>
          </label>
          <label>
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</span>
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setPage(0);
              }}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="all">All</option>
              {statusOptions.map((option) => (
                <option key={option} value={option.toLowerCase()}>
                  {formatStatus(option)}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Type</span>
            <select
              value={typeFilter}
              onChange={(event) => {
                setTypeFilter(event.target.value);
                setPage(0);
              }}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="all">All</option>
              {typeOptions.map((option) => (
                <option key={option} value={option.toLowerCase()}>
                  {formatStatus(option)}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Channel</span>
            <select
              value={channelFilter}
              onChange={(event) => {
                setChannelFilter(event.target.value);
                setPage(0);
              }}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="all">All</option>
              {channelOptions.map((option) => (
                <option key={option} value={option.toLowerCase()}>
                  {formatStatus(option)}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-col justify-end">
            <label className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <input
                type="checkbox"
                checked={flaggedOnly}
                onChange={(event) => {
                  setFlaggedOnly(event.target.checked);
                  setPage(0);
                }}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-200"
              />
              <span className="text-[11px] font-semibold text-slate-600">Anomalies only</span>
            </label>
          </div>
          <div className="flex items-end justify-end gap-2">
            <button
              type="button"
              onClick={() => onExport?.(filtered)}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-600"
            >
              <ArrowDownTrayIcon className="h-4 w-4" aria-hidden="true" /> Export CSV
            </button>
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
                setTypeFilter('all');
                setChannelFilter('all');
                setFlaggedOnly(false);
                setPage(0);
                onRetry?.();
              }}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-600"
            >
              <FunnelIcon className="h-4 w-4" aria-hidden="true" /> Reset filters
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50/80">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => handleSortChange('amount')}
                    className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500"
                  >
                    Amount
                    {sortField === 'amount' ? (
                      <span className="text-[10px] font-bold">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    ) : null}
                  </button>
                </th>
                <th className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => handleSortChange('occurredAt')}
                    className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500"
                  >
                    Timestamp
                    {sortField === 'occurredAt' ? (
                      <span className="text-[10px] font-bold">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    ) : null}
                  </button>
                </th>
                <th className="px-4 py-3">Counterparty</th>
                <th className="px-4 py-3">Anomaly</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.length ? (
                paginated.map((transaction) => {
                  const id = transaction.id ?? transaction.reference ?? `${transaction.type}-${transaction.occurredAt}`;
                  const expanded = id ? expandedIds.has(id) : false;
                  return (
                    <Fragment key={id}>
                      <TransactionRow
                        transaction={transaction}
                        currency={transaction.currencyCode ?? workspaceCurrency}
                        onSelect={handleToggleExpand}
                        isExpanded={expanded}
                      />
                      {expanded ? <TransactionDetails transaction={transaction} /> : null}
                    </Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-6">
                    <EmptyState loading={loading} onRetry={onRetry} />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {paginated.length ? (
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            <div>Page {currentPage + 1} of {totalPages}</div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((value) => Math.max(0, value - 1))}
                disabled={currentPage === 0}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() => setPage((value) => Math.min(totalPages - 1, value + 1))}
                disabled={currentPage >= totalPages - 1}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50/70 p-4 text-sm text-rose-700 shadow-sm">
          Transactions unavailable. Retry shortly.
        </div>
      ) : null}
    </section>
  );
}

TransactionTable.propTypes = {
  transactions: PropTypes.arrayOf(PropTypes.object),
  loading: PropTypes.bool,
  error: PropTypes.oneOfType([PropTypes.bool, PropTypes.object]),
  onRetry: PropTypes.func,
  onExport: PropTypes.func,
  onSelectTransaction: PropTypes.func,
  defaultPageSize: PropTypes.number,
  workspaceCurrency: PropTypes.string,
};

TransactionTable.defaultProps = {
  transactions: [],
  loading: false,
  error: null,
  onRetry: undefined,
  onExport: undefined,
  onSelectTransaction: undefined,
  defaultPageSize: 12,
  workspaceCurrency: 'USD',
};
