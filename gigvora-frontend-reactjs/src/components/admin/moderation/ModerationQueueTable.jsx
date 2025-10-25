import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

import AdminDataTable from '../ui/AdminDataTable.jsx';

const SEVERITY_STYLES = {
  critical: 'bg-rose-100 text-rose-800 border-rose-200',
  high: 'bg-amber-100 text-amber-800 border-amber-200',
  medium: 'bg-blue-100 text-blue-800 border-blue-200',
  low: 'bg-slate-100 text-slate-700 border-slate-200',
};

function formatDate(value) {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleString();
}

function formatSignals(signals) {
  if (!Array.isArray(signals) || !signals.length) {
    return 'No signals recorded';
  }
  return signals
    .slice(0, 3)
    .map((signal) => signal.message || signal.code)
    .join(' • ');
}

export default function ModerationQueueTable({ items, loading, onResolve }) {
  const columns = useMemo(
    () => [
      {
        key: 'createdAt',
        header: 'Created',
        className: 'text-xs text-slate-500',
        render: (item) => <time dateTime={item.createdAt}>{formatDate(item.createdAt)}</time>,
      },
      {
        key: 'channelSlug',
        header: 'Channel',
        className: 'font-medium text-slate-800',
        render: (item) => <span>#{item.channelSlug}</span>,
      },
      {
        key: 'severity',
        header: 'Severity',
        className: 'whitespace-nowrap',
        render: (item) => {
          const severityStyle = SEVERITY_STYLES[item.severity] || SEVERITY_STYLES.low;
          return (
            <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${severityStyle}`}>
              {item.severity}
            </span>
          );
        },
      },
      {
        key: 'status',
        header: 'Status',
        className: 'capitalize text-slate-600',
      },
      {
        key: 'reason',
        header: 'Reason',
        className: 'text-slate-600',
      },
      {
        key: 'signals',
        header: 'Signals',
        className: 'text-slate-600',
        render: (item) => formatSignals(item.metadata?.signals ?? []),
      },
      {
        key: 'score',
        header: 'Score',
        className: 'font-semibold text-slate-900',
        render: (item) => {
          const rawScore = item.metadata?.score ?? item.metadata?.moderationScore;
          const numericScore = Number.parseFloat(rawScore);
          return Number.isFinite(numericScore) ? Math.round(numericScore) : '—';
        },
      },
      {
        key: 'actions',
        header: 'Actions',
        className: 'text-right',
        headerClassName: 'text-right',
        render: (item) => (
          <button
            type="button"
            className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-100"
            onClick={() => onResolve?.(item)}
          >
            Resolve
          </button>
        ),
      },
    ],
    [onResolve],
  );

  const emptyState = useMemo(
    () => (
      <div className="flex flex-col items-center gap-3 text-sm text-slate-500">
        <ExclamationCircleIcon className="h-10 w-10 text-slate-300" aria-hidden="true" />
        <p>All clear! There are no community messages waiting for review.</p>
      </div>
    ),
    [],
  );

  return (
    <AdminDataTable
      columns={columns}
      rows={items}
      loading={loading}
      emptyState={emptyState}
      dense
      getRowKey={(item) => item.id}
    />
  );
}

ModerationQueueTable.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      createdAt: PropTypes.string,
      channelSlug: PropTypes.string,
      severity: PropTypes.string,
      status: PropTypes.string,
      reason: PropTypes.string,
      metadata: PropTypes.shape({
        score: PropTypes.number,
        signals: PropTypes.arrayOf(
          PropTypes.shape({
            code: PropTypes.string,
            message: PropTypes.string,
          }),
        ),
      }),
    }),
  ),
  loading: PropTypes.bool,
  onResolve: PropTypes.func,
};

ModerationQueueTable.defaultProps = {
  items: [],
  loading: false,
  onResolve: undefined,
};
