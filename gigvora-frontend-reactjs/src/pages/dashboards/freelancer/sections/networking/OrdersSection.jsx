import { useEffect, useMemo, useState } from 'react';
import SectionShell from '../../SectionShell.jsx';
import OrdersPanel from './OrdersPanel.jsx';

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch (error) {
    return value;
  }
}

export default function OrdersSection({
  orders,
  summary,
  loading,
  onCreate,
  onUpdate,
  onDelete,
  onRefresh,
  statuses = [],
  busy = false,
  error = null,
}) {
  const [panelState, setPanelState] = useState({ open: false, order: null });
  const [pending, setPending] = useState(false);
  const [banner, setBanner] = useState(null);
  const [dismissedError, setDismissedError] = useState(false);
  const rows = useMemo(() => orders ?? [], [orders]);

  useEffect(() => {
    setDismissedError(false);
  }, [error]);

  const handleCreate = async (payload) => {
    setPending(true);
    setBanner(null);
    setDismissedError(false);
    try {
      await onCreate?.(payload);
      setBanner({ tone: 'success', message: 'Order recorded.' });
    } catch (actionError) {
      const message = actionError?.message ?? 'Unable to record order.';
      setBanner({ tone: 'error', message });
      throw actionError;
    } finally {
      setPending(false);
    }
  };

  const handleUpdate = async (orderId, payload) => {
    setPending(true);
    setBanner(null);
    setDismissedError(false);
    try {
      await onUpdate?.(orderId, payload);
      setBanner({ tone: 'success', message: 'Order updated.' });
    } catch (actionError) {
      const message = actionError?.message ?? 'Unable to update order.';
      setBanner({ tone: 'error', message });
      throw actionError;
    } finally {
      setPending(false);
    }
  };

  const combinedBusy = busy || pending;

  const handleDelete = async (orderId) => {
    if (!onDelete) {
      return;
    }
    const confirmed = window.confirm('Delete this networking order? This cannot be undone.');
    if (!confirmed) {
      return;
    }
    setPending(true);
    setBanner(null);
    setDismissedError(false);
    try {
      await onDelete(orderId);
      setBanner({ tone: 'success', message: 'Order deleted.' });
    } catch (actionError) {
      const message = actionError?.message ?? 'Unable to delete order.';
      setBanner({ tone: 'error', message });
      throw actionError;
    } finally {
      setPending(false);
    }
  };

  const renderBanner = () => {
    const errorBanner = error && !dismissedError ? { tone: 'error', message: error } : null;
    const activeBanner = banner ?? errorBanner;
    if (!activeBanner) {
      return null;
    }
    const palette = {
      success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      error: 'border-rose-200 bg-rose-50 text-rose-700',
      info: 'border-blue-200 bg-blue-50 text-blue-700',
    };
    return (
      <div
        className={`flex items-center justify-between gap-4 rounded-3xl border px-4 py-3 text-sm ${
          palette[activeBanner.tone] ?? palette.info
        }`}
      >
        <span>{activeBanner.message}</span>
        <button
          type="button"
          className="text-xs font-semibold uppercase tracking-wide"
          onClick={() => {
            setBanner(null);
            if (activeBanner === errorBanner) {
              setDismissedError(true);
            }
          }}
        >
          Dismiss
        </button>
      </div>
    );
  };

  return (
    <SectionShell
      id="network-orders"
      title="Orders & payments"
      description="Track spend, reconcile payments, and keep financial records in sync with your networking activity."
      actions={[
        onRefresh
          ? (
            <button
              key="refresh"
              type="button"
              onClick={() => onRefresh?.()}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
              disabled={combinedBusy}
            >
              Refresh
            </button>
          )
          : null,
        <button
          key="add"
          type="button"
          onClick={() => setPanelState({ open: true, order: null })}
          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-500"
          disabled={combinedBusy}
        >
          Record order
        </button>,
      ].filter(Boolean)}
    >
      {renderBanner()}

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">Total orders</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{summary?.totals?.total ?? 0}</p>
        </div>
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-emerald-700">Paid</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-800">{summary?.totals?.paid ?? 0}</p>
        </div>
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-amber-700">Pending</p>
          <p className="mt-2 text-3xl font-semibold text-amber-800">{summary?.totals?.pending ?? 0}</p>
        </div>
        <div className="rounded-3xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-blue-700">Lifetime spend</p>
          <p className="mt-2 text-3xl font-semibold text-blue-900">{summary?.spend?.totalSpendFormatted ?? '—'}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Reference</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Amount</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Purchased</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {!rows.length && !loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-500">
                  No orders recorded yet. Track paid networking sessions to unlock revenue insights.
                </td>
              </tr>
            ) : null}
            {rows.map((order) => (
              <tr key={order.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-900">{order.reference || 'Unreferenced order'}</p>
                  <p className="text-xs text-slate-500">Session #{order.sessionId || '—'}</p>
                </td>
                <td className="px-4 py-3 text-slate-700">{order.amountFormatted}</td>
                <td className="px-4 py-3 text-slate-700 capitalize">{order.status?.replace(/_/g, ' ')}</td>
                <td className="px-4 py-3 text-slate-500">{formatDate(order.purchasedAt)}</td>
                <td className="px-4 py-3 space-x-2">
                  <button
                    type="button"
                    onClick={() => setPanelState({ open: true, order })}
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                    disabled={combinedBusy}
                  >
                    Edit
                  </button>
                  {onDelete ? (
                    <button
                      type="button"
                      onClick={() => handleDelete(order.id)}
                      className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700"
                      disabled={combinedBusy}
                    >
                      Delete
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <OrdersPanel
        open={panelState.open}
        order={panelState.order}
        onClose={() => setPanelState({ open: false, order: null })}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        onDelete={onDelete && panelState.order ? () => handleDelete(panelState.order.id) : undefined}
        busy={combinedBusy}
        statuses={statuses}
      />
    </SectionShell>
  );
}
