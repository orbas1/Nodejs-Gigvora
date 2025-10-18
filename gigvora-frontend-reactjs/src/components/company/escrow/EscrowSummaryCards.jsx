import { useMemo, useState } from 'react';
import {
  BanknotesIcon,
  ArrowTrendingUpIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
  ScaleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const SUMMARY_ICONS = [BanknotesIcon, ArrowTrendingUpIcon, ShieldCheckIcon, ArrowPathIcon, ScaleIcon];

function formatCurrency(value, currency = 'USD') {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(Number(value));
  } catch (error) {
    return `${currency} ${Number(value).toLocaleString()}`;
  }
}

function SummaryOverlay({ card, detail, onClose }) {
  if (!card || !detail) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-stretch justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40"
        onClick={onClose}
        aria-label="Close metric details"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.label}</p>
            <p className="text-2xl font-semibold text-slate-900">{card.value}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 p-1 text-slate-500 hover:border-slate-300 hover:text-slate-700"
          >
            <XMarkIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <h3 className="text-sm font-semibold text-slate-900">{detail.title}</h3>
          {detail.subtitle ? <p className="mt-1 text-xs text-slate-500">{detail.subtitle}</p> : null}

          {detail.rows?.length ? (
            <ul className="mt-4 space-y-3">
              {detail.rows.map((row) => (
                <li key={row.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center justify-between text-sm font-semibold text-slate-800">
                    <span>{row.label}</span>
                    <span>{row.value}</span>
                  </div>
                  {row.helper ? <p className="mt-1 text-xs text-slate-500">{row.helper}</p> : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-slate-600">{detail.emptyState ?? 'No data available for this metric.'}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function EscrowSummaryCards({
  summary,
  currency,
  accounts = [],
  transactions = [],
  releaseQueue = [],
  disputes = [],
}) {
  const [expandedKey, setExpandedKey] = useState(null);

  const cards = useMemo(() => {
    if (!summary) {
      return [];
    }

    return [
      {
        key: 'totalBalance',
        label: 'Escrow total',
        value: formatCurrency(summary.totalBalance, currency),
        helper: 'Safeguarded now',
      },
      {
        key: 'pendingRelease',
        label: 'Pending',
        value: formatCurrency(summary.pendingRelease, currency),
        helper: 'Queued for release',
      },
      {
        key: 'activeAccounts',
        label: 'Accounts',
        value: `${summary.activeAccounts ?? 0}/${summary.totalAccounts ?? 0}`,
        helper: 'Active vs total',
      },
      {
        key: 'openTransactions',
        label: 'Flow',
        value: summary.openTransactions ?? 0,
        helper: 'In progress',
      },
      {
        key: 'releasedInWindow',
        label: 'Released',
        value: formatCurrency(summary.releasedInWindow, currency),
        helper: 'Lookback total',
      },
      {
        key: 'openDisputes',
        label: 'Disputes',
        value: disputes.length || 0,
        helper: 'Active cases',
      },
    ];
  }, [summary, currency, disputes.length]);

  const detail = useMemo(() => {
    if (!expandedKey || !summary) {
      return null;
    }

    const accountRows = [...accounts]
      .sort((a, b) => Number(b.currentBalance ?? 0) - Number(a.currentBalance ?? 0))
      .map((account) => ({
        id: account.id,
        label: account.label ?? `Account ${account.id}`,
        value: formatCurrency(account.currentBalance, account.currencyCode ?? currency),
        helper: `${account.status?.replace(/_/g, ' ') ?? 'active'} • Pending ${formatCurrency(
          account.pendingReleaseTotal,
          account.currencyCode ?? currency,
        )}`,
      }));

    const pendingRows = [...accounts]
      .filter((account) => Number(account.pendingReleaseTotal ?? 0) > 0)
      .sort((a, b) => Number(b.pendingReleaseTotal ?? 0) - Number(a.pendingReleaseTotal ?? 0))
      .map((account) => ({
        id: `pending-${account.id}`,
        label: account.label ?? `Account ${account.id}`,
        value: formatCurrency(account.pendingReleaseTotal, account.currencyCode ?? currency),
        helper: account.status?.replace(/_/g, ' ') ?? 'active',
      }));

    const openTransactions = transactions
      .filter((txn) => ['in_escrow', 'funded', 'initiated', 'pending_release'].includes(txn.status))
      .map((txn) => ({
        id: txn.id,
        label: txn.reference,
        value: formatCurrency(txn.amount, txn.currencyCode ?? currency),
        helper: txn.status?.replace(/_/g, ' ') ?? 'in escrow',
      }));

    const releasedTransactions = transactions
      .filter((txn) => txn.status === 'released')
      .map((txn) => ({
        id: `released-${txn.id}`,
        label: txn.reference,
        value: formatCurrency(txn.netAmount ?? txn.amount, txn.currencyCode ?? currency),
        helper: txn.releasedAt ? new Date(txn.releasedAt).toLocaleString() : 'Released',
      }));

    const disputeRows = disputes.map((dispute) => ({
      id: dispute.id,
      label: `Case ${dispute.id}`,
      value: dispute.status?.replace(/_/g, ' ') ?? 'open',
      helper: dispute.summary || 'No summary provided',
    }));

    const releaseRows = releaseQueue.map((item) => ({
      id: `queue-${item.id}`,
      label: item.reference,
      value: formatCurrency(item.amount, item.currencyCode ?? currency),
      helper: item.scheduledReleaseAt
        ? new Date(item.scheduledReleaseAt).toLocaleString()
        : 'Awaiting trigger',
    }));

    switch (expandedKey) {
      case 'totalBalance':
        return {
          title: 'Account balances',
          subtitle: 'Sorted by current balance',
          rows: accountRows,
          emptyState: 'No escrow accounts yet.',
        };
      case 'pendingRelease':
        return {
          title: 'Queued releases',
          subtitle: 'Pending funds across accounts and the automation queue',
          rows: pendingRows.length ? pendingRows : releaseRows,
          emptyState: 'No funds waiting for release.',
        };
      case 'activeAccounts':
        return {
          title: 'Account roster',
          subtitle: 'Status of each custody account',
          rows: accounts.map((account) => ({
            id: `status-${account.id}`,
            label: account.label ?? `Account ${account.id}`,
            value: account.status?.replace(/_/g, ' ') ?? 'active',
            helper: account.owner?.name ? `Owner • ${account.owner.name}` : 'Unassigned',
          })),
          emptyState: 'No accounts on file.',
        };
      case 'openTransactions':
        return {
          title: 'Live transactions',
          subtitle: 'Milestones in escrow or pending release',
          rows: openTransactions,
          emptyState: 'No active transactions right now.',
        };
      case 'releasedInWindow':
        return {
          title: 'Recent releases',
          subtitle: 'Payouts cleared during the selected window',
          rows: releasedTransactions,
          emptyState: 'No releases during this lookback window.',
        };
      case 'openDisputes':
        return {
          title: 'Dispute queue',
          subtitle: 'Cases requiring follow-up',
          rows: disputeRows,
          emptyState: 'No open disputes.',
        };
      default:
        return null;
    }
  }, [expandedKey, summary, accounts, releaseQueue, transactions, disputes, currency]);

  if (!cards.length) {
    return null;
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card, index) => {
          const Icon = SUMMARY_ICONS[index % SUMMARY_ICONS.length];
          return (
            <button
              key={card.key}
              type="button"
              onClick={() => setExpandedKey(card.key)}
              className="flex h-full flex-col justify-between rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50/90 to-white px-5 py-6 text-left shadow-sm transition hover:border-blue-300 hover:shadow"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{card.value}</p>
                </div>
                <div className="rounded-2xl bg-white p-3 text-blue-600 shadow-sm">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </div>
              </div>
              <p className="mt-3 text-sm font-medium text-slate-600">{card.helper}</p>
            </button>
          );
        })}
      </div>

      <SummaryOverlay
        card={cards.find((card) => card.key === expandedKey)}
        detail={detail}
        onClose={() => setExpandedKey(null)}
      />
    </>
  );
}
