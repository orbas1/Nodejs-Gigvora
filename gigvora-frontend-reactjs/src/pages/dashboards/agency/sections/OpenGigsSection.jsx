import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

const ORDER_STATUS_OPTIONS = [
  { value: 'requirements', label: 'Requirements' },
  { value: 'in_delivery', label: 'In delivery' },
  { value: 'in_revision', label: 'In revision' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

function formatDate(value) {
  if (!value) {
    return '';
  }
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    return date.toISOString().slice(0, 10);
  } catch (error) {
    return '';
  }
}

export default function OpenGigsSection({ orders, onUpdateOrder, updatingOrderId }) {
  const openOrders = useMemo(
    () =>
      (orders ?? []).filter((order) => order && !['completed', 'cancelled'].includes(order.status)).map((order) => ({
        id: order.id,
        serviceName: order.serviceName,
        vendorName: order.vendorName,
        status: order.status,
        dueAt: order.dueAt,
        progressPercent: order.progressPercent ?? 0,
      })),
    [orders],
  );

  const [drafts, setDrafts] = useState(new Map());

  useEffect(() => {
    const next = new Map();
    openOrders.forEach((order) => {
      next.set(order.id, {
        status: order.status ?? 'in_delivery',
        dueAt: formatDate(order.dueAt),
        progressPercent: Number(order.progressPercent ?? 0),
      });
    });
    setDrafts(next);
  }, [openOrders]);

  const updateDraft = (orderId, patch) => {
    setDrafts((current) => {
      const next = new Map(current);
      const existing = next.get(orderId) ?? { status: 'in_delivery', dueAt: '', progressPercent: 0 };
      next.set(orderId, { ...existing, ...patch });
      return next;
    });
  };

  const handleSave = async (orderId) => {
    const draft = drafts.get(orderId);
    if (!draft) return;
    await onUpdateOrder?.(orderId, {
      status: draft.status,
      dueAt: draft.dueAt || undefined,
      progressPercent: draft.progressPercent,
    });
  };

  return (
    <section id="agency-open-gigs" className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">Gig · Open</p>
          <h2 className="text-3xl font-semibold text-slate-900">Open gigs</h2>
        </div>
        <span className="rounded-full bg-slate-100 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
          {openOrders.length}
        </span>
      </header>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {openOrders.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-8 text-center text-sm text-slate-500">
            Nothing in delivery.
          </div>
        ) : (
          openOrders.map((order) => {
            const draft = drafts.get(order.id) ?? { status: order.status ?? 'in_delivery', dueAt: '', progressPercent: 0 };
            return (
              <div key={order.id} className="flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{order.serviceName}</p>
                      <p className="text-xs text-slate-500">{order.vendorName}</p>
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">#{order.id}</span>
                  </div>
                  <div className="mt-4 grid gap-3 text-xs text-slate-500">
                    <label className="flex flex-col gap-2">
                      <span className="uppercase tracking-wide">Status</span>
                      <select
                        value={draft.status}
                        onChange={(event) => updateDraft(order.id, { status: event.target.value })}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      >
                        {ORDER_STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="flex flex-col gap-2">
                      <span className="uppercase tracking-wide">Due</span>
                      <input
                        type="date"
                        value={draft.dueAt}
                        onChange={(event) => updateDraft(order.id, { dueAt: event.target.value })}
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      />
                    </label>
                    <label className="flex flex-col gap-2">
                      <span className="uppercase tracking-wide">Progress</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={draft.progressPercent ?? 0}
                        onChange={(event) => updateDraft(order.id, { progressPercent: Number(event.target.value) })}
                        className="accent-accent"
                      />
                      <span className="text-sm font-semibold text-slate-600">{draft.progressPercent ?? 0}%</span>
                    </label>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleSave(order.id)}
                  disabled={updatingOrderId === order.id}
                  className="mt-5 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {updatingOrderId === order.id ? 'Saving…' : 'Save'}
                </button>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

OpenGigsSection.propTypes = {
  orders: PropTypes.arrayOf(PropTypes.object),
  onUpdateOrder: PropTypes.func,
  updatingOrderId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

OpenGigsSection.defaultProps = {
  orders: [],
  onUpdateOrder: undefined,
  updatingOrderId: null,
};
