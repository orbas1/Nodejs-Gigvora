import PropTypes from 'prop-types';
import { useMemo } from 'react';
import { ArrowPathIcon, ExclamationTriangleIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import DataStatus from '../../../../components/DataStatus.jsx';

function formatPercent(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }
  return `${Math.round(Number(value) * 100)}%`;
}

function formatCurrency(amount, currency = 'USD') {
  if (amount == null || Number.isNaN(Number(amount))) {
    return '—';
  }
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(Number(amount));
  } catch (error) {
    return `${currency} ${Math.round(Number(amount))}`;
  }
}

function formatNumber(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Number(value));
}

export default function AgencyOperationsAlertRail({
  finance,
  overview,
  gigOrders,
  loading,
  error,
  fromCache,
  lastUpdated,
  onRefresh,
}) {
  const summary = useMemo(() => {
    const revenueRunRate = finance?.runRate ?? null;
    const margin = finance?.margin ?? null;
    const riskAlerts = overview?.operations?.overview?.alerts ?? [];
    const activeClients = overview?.operations?.overview?.clientHealth?.activeClients ?? null;
    const atRiskEngagements = overview?.operations?.overview?.clientHealth?.atRiskEngagements ?? null;
    const activeOrders = gigOrders.filter((order) => !['completed', 'cancelled'].includes(order.status));
    const overdueOrders = activeOrders.filter((order) => {
      if (!order?.dueAt) {
        return false;
      }
      const due = new Date(order.dueAt);
      return !Number.isNaN(due.getTime()) && due.getTime() < Date.now();
    });
    const nextDueOrder = activeOrders
      .map((order) => ({
        id: order.id,
        dueAt: order.dueAt ? new Date(order.dueAt).getTime() : null,
        name: order.serviceName,
      }))
      .filter((entry) => entry.dueAt && !Number.isNaN(entry.dueAt))
      .sort((a, b) => a.dueAt - b.dueAt)[0] ?? null;

    return {
      revenueRunRate,
      margin,
      riskAlerts,
      activeClients,
      atRiskEngagements,
      overdueOrders,
      nextDueOrder,
      activeOrderCount: activeOrders.length,
    };
  }, [finance, overview, gigOrders]);

  const badgeTone = summary.overdueOrders.length > 0 ? 'text-rose-500' : 'text-emerald-500';
  const currency = finance?.currency ?? overview?.workspace?.currency ?? 'USD';

  return (
    <div className="sticky top-20 z-20 space-y-4 rounded-4xl border border-slate-200 bg-white/95 p-6 shadow-lg shadow-blue-100/50 backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className={clsx('text-xs font-semibold uppercase tracking-[0.35em]', badgeTone)}>
            Operations pulse
          </p>
          <h2 className="text-2xl font-semibold text-slate-900">Pipeline & finance health</h2>
        </div>
        <DataStatus
          loading={loading}
          error={error}
          fromCache={fromCache}
          lastUpdated={lastUpdated}
          onRefresh={onRefresh}
          statusLabel="Operations data"
          icon={ArrowPathIcon}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Revenue run-rate</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(summary.revenueRunRate, currency)}</p>
          <p className="mt-1 text-xs text-slate-500">Margin: {formatPercent(summary.margin)}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Clients active</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{formatNumber(summary.activeClients)}</p>
          <p className="mt-1 text-xs text-slate-500">
            {formatNumber(summary.atRiskEngagements)} engagements flagged
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Active orders</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{formatNumber(summary.activeOrderCount)}</p>
          <p className="mt-1 text-xs text-slate-500">{formatNumber(summary.overdueOrders.length)} overdue</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Next due</p>
          <p className="mt-2 text-sm font-semibold text-slate-900">
            {summary.nextDueOrder?.name ?? 'Assign owners to upcoming deliveries.'}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {summary.nextDueOrder?.dueAt
              ? `Due ${new Date(summary.nextDueOrder.dueAt).toLocaleDateString()}`
              : 'No scheduled deadlines.'}
          </p>
        </div>
      </div>

      {summary.riskAlerts.length ? (
        <div className="rounded-3xl border border-amber-200 bg-amber-50/60 p-4 text-sm text-amber-700">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 flex-none" aria-hidden="true" />
            <div className="space-y-1">
              <p className="font-semibold uppercase tracking-wide">Alerts</p>
              <ul className="space-y-1">
                {summary.riskAlerts.slice(0, 3).map((alert) => (
                  <li key={alert.referenceId ?? alert.title}>
                    <span className="font-semibold">{alert.title ?? 'Operational alert'}:</span>{' '}
                    {alert.message ?? alert.summary ?? 'Review the issue to keep delivery running smoothly.'}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50/60 p-4 text-sm text-emerald-700">
          <div className="flex items-start gap-3">
            <ShieldCheckIcon className="mt-0.5 h-5 w-5 flex-none" aria-hidden="true" />
            <div>
              <p className="font-semibold uppercase tracking-wide">Clear signal</p>
              <p>Delivery health looks steady. Keep tracking fairness and staffing metrics below.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

AgencyOperationsAlertRail.propTypes = {
  finance: PropTypes.object,
  overview: PropTypes.object,
  gigOrders: PropTypes.arrayOf(PropTypes.object),
  loading: PropTypes.bool,
  error: PropTypes.oneOfType([PropTypes.bool, PropTypes.string, PropTypes.object]),
  fromCache: PropTypes.bool,
  lastUpdated: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
  onRefresh: PropTypes.func,
};

AgencyOperationsAlertRail.defaultProps = {
  finance: null,
  overview: null,
  gigOrders: [],
  loading: false,
  error: null,
  fromCache: false,
  lastUpdated: null,
  onRefresh: undefined,
};
