import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpCircleIcon,
  ArrowUturnLeftIcon,
  CalendarDaysIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import ConfirmDialog from './components/ConfirmDialog.jsx';
import { formatAbsolute, formatRelativeTime } from '../../../../../utils/date.js';

function formatMoney(amount, currencyCode = 'USD') {
  if (amount == null) {
    return '—';
  }
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: 2,
  }).format(Number(amount));
}

function normaliseQueue(queue) {
  if (!Array.isArray(queue)) {
    return [];
  }
  return [...queue].sort((a, b) => {
    const first = new Date(a?.scheduledReleaseAt ?? a?.createdAt ?? 0).getTime();
    const second = new Date(b?.scheduledReleaseAt ?? b?.createdAt ?? 0).getTime();
    return first - second;
  });
}

export default function ReleaseQueuePanel({
  queue,
  onRelease,
  onRefund,
  loading,
  actionState,
}) {
  const [selected, setSelected] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [pendingId, setPendingId] = useState(null);
  const [panelError, setPanelError] = useState(null);

  const items = useMemo(() => normaliseQueue(queue), [queue]);
  const busy = loading || actionState?.status === 'pending' || pendingId != null;

  const summary = useMemo(() => {
    const next = items[0] ?? null;
    const totalValue = items.reduce(
      (sum, item) => sum + (Number.isFinite(Number(item?.netAmount)) ? Number(item.netAmount) : Number(item?.amount ?? 0)),
      0,
    );
    const dueSoon = items.filter((item) => {
      const scheduled = new Date(item?.scheduledReleaseAt ?? item?.createdAt ?? Date.now());
      const diffDays = Math.floor((scheduled.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return diffDays <= 3;
    }).length;
    const uniqueAccounts = new Set(items.map((item) => item.accountId)).size;
    return { next, totalValue, dueSoon, uniqueAccounts };
  }, [items]);

  useEffect(() => {
    setPanelError(null);
  }, [queue]);

  const closeDialog = () => {
    if (pendingId) {
      return;
    }
    setDialog(null);
    setSelected(null);
  };

  const openAction = (item, type) => {
    setSelected(item);
    setDialog(type);
    setPanelError(null);
  };

  const confirmAction = async () => {
    if (!selected || !dialog) {
      return;
    }
    setPendingId(selected.id);
    setPanelError(null);
    try {
      if (dialog === 'release') {
        await onRelease(selected.id, {});
      } else {
        await onRefund(selected.id, {});
      }
      setDialog(null);
      setSelected(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to complete escrow action.';
      setPanelError(message);
    } finally {
      setPendingId(null);
    }
  };

  if (!items.length) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-600">
          <ShieldCheckIcon className="h-5 w-5 text-emerald-500" aria-hidden="true" />
          <p>There are no releases scheduled. Funds will appear here once payouts are queued.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Upcoming release</p>
          <p className="mt-3 text-xl font-semibold text-slate-900">
            {summary.next ? formatMoney(summary.next.netAmount ?? summary.next.amount, summary.next.currencyCode) : '—'}
          </p>
          <p className="mt-2 flex items-center gap-2 text-xs text-slate-500">
            <CalendarDaysIcon className="h-4 w-4" aria-hidden="true" />
            {summary.next
              ? `Scheduled ${formatRelativeTime(summary.next.scheduledReleaseAt ?? summary.next.createdAt)}`
              : 'No date scheduled'}
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total queued</p>
          <p className="mt-3 text-xl font-semibold text-slate-900">
            {formatMoney(summary.totalValue, summary.next?.currencyCode ?? 'USD')}
          </p>
          <p className="mt-2 text-xs text-slate-500">Across {items.length} scheduled releases</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Due soon</p>
          <p className="mt-3 text-xl font-semibold text-slate-900">{summary.dueSoon}</p>
          <p className="mt-2 text-xs text-slate-500">Within the next 3 days across {summary.uniqueAccounts} accounts</p>
        </div>
      </div>

      {panelError ? (
        <div className="flex items-center gap-2 rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
          <ExclamationTriangleIcon className="h-4 w-4" aria-hidden="true" />
          <span>{panelError}</span>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th scope="col" className="px-4 py-3 text-left">Reference</th>
              <th scope="col" className="px-4 py-3 text-left">Client</th>
              <th scope="col" className="px-4 py-3 text-right">Amount</th>
              <th scope="col" className="px-4 py-3 text-left">Release on</th>
              <th scope="col" className="px-4 py-3 text-left">Status</th>
              <th scope="col" className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {items.map((item) => {
              const scheduled = item.scheduledReleaseAt ?? item.createdAt;
              const currency = item.currencyCode ?? 'USD';
              return (
                <tr key={item.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-medium text-slate-900">{item.reference ?? `#${item.id}`}</td>
                  <td className="px-4 py-3 text-slate-600">{item.counterpartyId ?? '—'}</td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-900">
                    {formatMoney(item.netAmount ?? item.amount, currency)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    <div className="flex flex-col">
                      <span>{formatAbsolute(scheduled)}</span>
                      <span className="text-xs text-slate-400">{formatRelativeTime(scheduled)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-700">
                      {item.status?.replace(/_/g, ' ') ?? 'in escrow'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openAction(item, 'release')}
                        className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-300"
                        disabled={busy}
                      >
                        <ArrowUpCircleIcon className="h-4 w-4" aria-hidden="true" /> Release
                      </button>
                      <button
                        type="button"
                        onClick={() => openAction(item, 'refund')}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={busy}
                      >
                        <ArrowUturnLeftIcon className="h-4 w-4" aria-hidden="true" /> Refund
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={Boolean(dialog)}
        onClose={closeDialog}
        title={dialog === 'release' ? 'Release escrow funds' : 'Refund escrow funds'}
        message={
          dialog === 'release'
            ? 'Confirm the funds have been delivered. This will move the balance from escrow to the client account.'
            : 'Confirm you want to return these funds to the client. This action will mark the transaction as refunded.'
        }
        confirmLabel={dialog === 'release' ? 'Release now' : 'Refund now'}
        onConfirm={confirmAction}
        loading={pendingId != null}
      />
    </div>
  );
}

