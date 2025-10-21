import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import DataStatus from '../../../../components/DataStatus.jsx';
import ProjectGigManagementContainer from '../../../../components/projectGigManagement/ProjectGigManagementContainer.jsx';
import GigOrderComposer from '../../../../components/projectGigManagement/GigOrderComposer.jsx';

function formatNumber(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '0';
  }
  return new Intl.NumberFormat('en-GB').format(Number(value));
}

function formatCurrency(value, currency = 'USD') {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(Number(value));
  } catch (error) {
    return `${currency} ${formatNumber(value)}`;
  }
}

function MetricCard({ label, value, hint }) {
  return (
    <div className="rounded-3xl border border-indigo-100 bg-white/90 p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500/80">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

MetricCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  hint: PropTypes.string,
};

MetricCard.defaultProps = {
  hint: null,
};

export default function AgencyGigWorkspaceSection({ resource, statusLabel, currency, onRefresh }) {
  const { data, loading, error, reload, actions } = resource ?? {};
  const [orderComposerOpen, setOrderComposerOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    if (!statusMessage) {
      return undefined;
    }
    const timeout = setTimeout(() => setStatusMessage(null), 4000);
    return () => clearTimeout(timeout);
  }, [statusMessage]);

  useEffect(() => {
    if (!errorMessage) {
      return undefined;
    }
    const timeout = setTimeout(() => setErrorMessage(null), 5000);
    return () => clearTimeout(timeout);
  }, [errorMessage]);

  const summary = data?.summary ?? {};
  const orderStats = data?.purchasedGigs?.stats ?? {};
  const catalog = data?.catalog ?? {};
  const autoMatch = data?.autoMatch ?? {};
  const boardMetrics = data?.board?.metrics ?? {};
  const lastUpdated = data?.summaryUpdatedAt ?? data?.lastSyncedAt ?? null;
  const fromCache = Boolean(data?.fromCache);

  const packagesLive = summary.gigPackagesLive ?? catalog.active ?? catalog.live ?? 0;
  const gigsActive = summary.gigsInDelivery ?? orderStats.active ?? 0;
  const awaitingReview = orderStats.awaitingReview ?? orderStats.pendingClient ?? 0;
  const valueInPlay = summary.openGigValue ?? orderStats.escrowInFlight ?? summary.budgetInPlay ?? 0;
  const primaryCurrency = summary.currency ?? currency ?? 'USD';
  const readyCount = autoMatch.readyCount ?? (Array.isArray(autoMatch?.candidates) ? autoMatch.candidates.length : 0);
  const atRiskCount = boardMetrics.atRisk ?? boardMetrics.riskHigh ?? 0;
  const averageTurnaroundHours = orderStats.averageTurnaroundHours ?? orderStats.averageTurnaround ?? null;
  const satisfactionScore = summary.gigSatisfaction ?? orderStats.satisfactionScore ?? null;

  const metrics = useMemo(
    () =>
      [
        {
          label: 'Live gig packages',
          value: formatNumber(packagesLive),
          hint: 'Marketplace listings currently live.',
        },
        {
          label: 'Gigs in delivery',
          value: formatNumber(gigsActive),
          hint: 'Orders being fulfilled across squads.',
        },
        {
          label: 'Value in play',
          value: formatCurrency(valueInPlay, primaryCurrency),
          hint: 'Escrow-backed revenue being delivered.',
        },
        {
          label: 'Awaiting review',
          value: formatNumber(awaitingReview),
          hint: 'Deliveries pending agency approval.',
        },
        {
          label: 'Auto-match ready',
          value: formatNumber(readyCount),
          hint: 'Pre-vetted specialists awaiting invites.',
        },
        {
          label: 'Risks flagged',
          value: formatNumber(atRiskCount),
          hint: 'Orders requiring mitigation.',
        },
        averageTurnaroundHours
          ? {
              label: 'Avg. turnaround',
              value: `${formatNumber(averageTurnaroundHours)} hrs`,
              hint: 'Median delivery time for completed orders.',
            }
          : null,
        satisfactionScore
          ? {
              label: 'Satisfaction score',
              value: Number(satisfactionScore).toFixed(1),
              hint: 'Client feedback across recent engagements.',
            }
          : null,
      ].filter(Boolean),
    [
      atRiskCount,
      averageTurnaroundHours,
      awaitingReview,
      gigsActive,
      packagesLive,
      primaryCurrency,
      readyCount,
      satisfactionScore,
      valueInPlay,
    ],
  );

  const handleOrderSubmit = async (payload) => {
    try {
      setErrorMessage(null);
      await actions?.createGigOrder?.(payload);
      setStatusMessage('Gig order created and queued for delivery.');
      await onRefresh?.();
    } catch (err) {
      const message = err?.message ?? 'Unable to create gig order.';
      setErrorMessage(message);
      throw err;
    }
  };

  return (
    <section
      id="agency-gig-workspace"
      className="space-y-6 rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-white p-6 shadow-sm"
    >
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-500">Gig workspace</p>
          <h2 className="text-3xl font-semibold text-slate-900">Marketplace gig orchestration</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-500">
            Operate your gig catalogue, vendor SLAs, escrow guardrails, and delivery rituals with production-grade oversight.
          </p>
        </div>
        <div className="flex flex-col items-start gap-3">
          <DataStatus
            loading={loading}
            error={error}
            lastUpdated={lastUpdated}
            fromCache={fromCache}
            onRefresh={() => {
              if (typeof reload === 'function') {
                reload();
              }
              onRefresh?.();
            }}
            statusLabel={statusLabel}
          />
          <button
            type="button"
            onClick={() => setOrderComposerOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
          >
            New gig order
          </button>
        </div>
      </header>

      {statusMessage ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {statusMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>

      <div className="rounded-3xl border border-white/60 bg-white/90 p-4 shadow-inner">
        <ProjectGigManagementContainer resource={resource} />
      </div>

      <GigOrderComposer
        open={orderComposerOpen}
        onClose={() => setOrderComposerOpen(false)}
        order={null}
        onSubmit={async (payload) => {
          const result = await handleOrderSubmit(payload);
          if (result !== false) {
            setOrderComposerOpen(false);
          }
          return result;
        }}
      />
    </section>
  );
}

AgencyGigWorkspaceSection.propTypes = {
  resource: PropTypes.shape({
    data: PropTypes.object,
    loading: PropTypes.bool,
    error: PropTypes.oneOfType([PropTypes.bool, PropTypes.object, PropTypes.string]),
    reload: PropTypes.func,
    actions: PropTypes.object,
  }).isRequired,
  statusLabel: PropTypes.string,
  currency: PropTypes.string,
  onRefresh: PropTypes.func,
};

AgencyGigWorkspaceSection.defaultProps = {
  statusLabel: 'Gig marketplace sync',
  currency: 'USD',
  onRefresh: null,
};

