import { useCallback, useMemo } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import SectionShell from '../SectionShell.jsx';
import DataStatus from '../../../../components/DataStatus.jsx';
import useFreelancerOrderPipelineSummary from '../../../../hooks/useFreelancerOrderPipelineSummary.js';
import useFreelancerCatalogInsights from '../../../../hooks/useFreelancerCatalogInsights.js';

const STAGE_LABELS = {
  inquiry: 'New inquiries',
  qualification: 'Qualifying',
  kickoff_scheduled: 'Kickoff scheduled',
  production: 'In production',
  delivery: 'Awaiting delivery',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

function formatStageLabel(stage) {
  if (!stage) {
    return 'Other';
  }
  if (STAGE_LABELS[stage]) {
    return STAGE_LABELS[stage];
  }
  return stage
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function formatPercent(value, digits = 1) {
  if (value == null) {
    return '—';
  }
  const numeric = Number(value) || 0;
  return `${new Intl.NumberFormat('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(numeric)}%`;
}

function formatNumber(value) {
  const numeric = Number(value) || 0;
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(numeric);
}

function formatCurrency(value, currency = 'USD') {
  if (value == null) {
    return '—';
  }
  const numeric = Number(value) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: numeric % 1 === 0 ? 0 : 2,
    minimumFractionDigits: numeric % 1 === 0 ? 0 : 2,
  }).format(numeric);
}

function formatDelta(value, unit = '') {
  if (value == null) {
    return null;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric === 0) {
    return '±0';
  }
  const symbol = numeric > 0 ? '▲' : '▼';
  const magnitude = Math.abs(numeric);
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: magnitude < 1 ? 1 : 0,
    maximumFractionDigits: magnitude < 1 ? 1 : 0,
  }).format(magnitude);
  return `${symbol} ${formatted}${unit}`;
}

function formatRetainerDelta(change) {
  if (change == null) {
    return null;
  }
  const numeric = Number(change);
  if (!Number.isFinite(numeric) || numeric === 0) {
    return '0 new retainers';
  }
  const prefix = numeric > 0 ? '+' : '−';
  return `${prefix}${Math.abs(numeric)} new retainers`;
}

export default function GigMarketplaceOperationsSection({ freelancerId, lookbackDays }) {
  const pipeline = useFreelancerOrderPipelineSummary({ freelancerId, lookbackDays });
  const catalog = useFreelancerCatalogInsights({ freelancerId });

  const loading = pipeline.loading || catalog.loading;
  const error = pipeline.error ?? catalog.error ?? null;
  const fromCache = pipeline.fromCache || catalog.fromCache;
  const lastUpdated = pipeline.lastUpdated ?? catalog.lastUpdated ?? null;

  const handleRefresh = useCallback(() => {
    const refreshes = [];
    if (pipeline.refresh) {
      refreshes.push(pipeline.refresh({ force: true }));
    }
    if (catalog.refresh) {
      refreshes.push(catalog.refresh({ force: true }));
    }
    if (!refreshes.length) {
      return Promise.resolve();
    }
    return Promise.allSettled(refreshes);
  }, [catalog.refresh, pipeline.refresh]);

  const conversionRate = catalog.insights.summary.conversionRate.value;
  const conversionDelta = catalog.insights.summary.conversionRate.change;
  const conversionLabel = catalog.insights.summary.conversionRate.label ?? 'vs prior 30 days';

  const repeatClientRate = catalog.repeatClientSummary.rate;
  const repeatClientDelta = catalog.repeatClientSummary.change;

  const attachRate = catalog.attachRate.rate;
  const attachDelta = catalog.attachRate.change;
  const openOpportunities = catalog.attachRate.openOpportunities;

  const bundles = useMemo(() => catalog.topBundles.slice(0, 3), [catalog.topBundles]);
  const hasBundles = bundles.length > 0;

  const requirementHighlights = useMemo(
    () => pipeline.requirementBreakdown.filter((item) => item.count > 0),
    [pipeline.requirementBreakdown],
  );

  const revisionHighlights = useMemo(
    () => pipeline.revisionBreakdown.filter((item) => item.count > 0),
    [pipeline.revisionBreakdown],
  );

  return (
    <SectionShell
      id="gig-marketplace"
      title="Gig marketplace operations"
      description="Monitor live gig pipelines, conversion analytics, and bundle performance without leaving mission control."
      actions={
        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <ArrowPathIcon className="h-4 w-4" aria-hidden="true" />
          {loading ? 'Refreshing…' : 'Refresh insights'}
        </button>
      }
    >
      <DataStatus
        loading={loading}
        error={error}
        fromCache={fromCache}
        lastUpdated={lastUpdated}
        onRefresh={handleRefresh}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {pipeline.highlights.map((card) => (
          <div
            key={card.id}
            className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.name}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{card.primary}</p>
            <p className="mt-1 text-sm text-slate-500">{card.secondary}</p>
          </div>
        ))}
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Conversion rate</p>
          <div className="mt-2 flex items-baseline gap-3">
            <p className="text-2xl font-semibold text-slate-900">{formatPercent(conversionRate)}</p>
            {conversionDelta != null ? (
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-500">
                {formatDelta(conversionDelta, ' pts')}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-slate-500">{conversionLabel}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">Pipeline focus</h3>
            <p className="mt-1 text-sm text-slate-500">Prioritise the stages holding the most value this week.</p>
            <ul className="mt-4 space-y-3">
              {pipeline.stageDistribution.slice(0, 6).map((stage) => (
                <li key={stage.stage} className="flex items-center justify-between gap-3">
                  <span className="text-sm text-slate-600">{formatStageLabel(stage.stage)}</span>
                  <span className="text-sm font-semibold text-slate-900">{formatNumber(stage.count)}</span>
                </li>
              ))}
              {pipeline.stageDistribution.length === 0 ? (
                <li className="text-sm text-slate-500">No gig orders in the selected lookback window.</li>
              ) : null}
            </ul>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900">Client requirements</h3>
              <p className="mt-1 text-sm text-slate-500">Follow up on overdue forms to keep production unblocked.</p>
              <ul className="mt-4 space-y-2">
                {(requirementHighlights.length ? requirementHighlights : pipeline.requirementBreakdown).map((item) => (
                  <li key={item.id} className="flex items-center justify-between text-sm text-slate-600">
                    <span>{item.label}</span>
                    <span className="font-semibold text-slate-900">{formatNumber(item.count)}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900">Revision queue</h3>
              <p className="mt-1 text-sm text-slate-500">Spot review bottlenecks before timelines slip.</p>
              <ul className="mt-4 space-y-2">
                {(revisionHighlights.length ? revisionHighlights : pipeline.revisionBreakdown).map((item) => (
                  <li key={item.id} className="flex items-center justify-between text-sm text-slate-600">
                    <span>{item.label}</span>
                    <span className="font-semibold text-slate-900">{formatNumber(item.count)}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-slate-500">
                Escrow outstanding: {formatCurrency(pipeline.summary.escrow.amounts.outstanding, pipeline.summary.escrow.amounts.currency)}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">Conversion analytics</h3>
            <p className="mt-1 text-sm text-slate-500">End-to-end funnel for the last 30 days.</p>
            <dl className="mt-4 grid gap-2 sm:grid-cols-3">
              {catalog.conversionFunnel.map((step) => (
                <div key={step.id} className="rounded-2xl bg-slate-50 p-3">
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{step.label}</dt>
                  <dd className="mt-1 text-sm font-semibold text-slate-900">{step.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">Repeat clients & retainers</h3>
            <p className="mt-1 text-sm text-slate-500">Grow lifetime value by nurturing high-trust accounts.</p>
            <div className="mt-3 flex items-baseline gap-3">
              <p className="text-3xl font-semibold text-slate-900">{repeatClientRate}</p>
              {repeatClientDelta != null ? (
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-500">
                  {formatRetainerDelta(repeatClientDelta)}
                </span>
              ) : null}
            </div>
            <dl className="mt-4 space-y-2 text-sm text-slate-600">
              <div className="flex items-center justify-between">
                <dt>Total clients</dt>
                <dd className="font-semibold text-slate-900">{catalog.repeatClientSummary.totalClients}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>Repeat clients</dt>
                <dd className="font-semibold text-slate-900">{catalog.repeatClientSummary.repeatClients}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>Active retainers</dt>
                <dd className="font-semibold text-slate-900">{catalog.repeatClientSummary.activeRetainers}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">Attach rate & cross-sell</h3>
            <p className="mt-1 text-sm text-slate-500">Track how often buyers add strategic upgrades.</p>
            <div className="mt-3 flex items-baseline gap-3">
              <p className="text-2xl font-semibold text-slate-900">{attachRate}</p>
              {attachDelta != null ? (
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-500">
                  {formatDelta(attachDelta, ' pts')}
                </span>
              ) : null}
            </div>
            <p className="mt-2 text-xs text-slate-500">{formatNumber(openOpportunities)} open opportunities</p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Top performing bundles</h3>
            <p className="text-sm text-slate-500">Revenue, conversion, and repeat client lift across your catalogue.</p>
          </div>
        </div>
        <div className="mt-4 space-y-4">
          {hasBundles ? (
            bundles.map((bundle) => (
              <div key={bundle.id ?? bundle.name} className="rounded-2xl border border-slate-100 bg-white/70 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{bundle.name}</p>
                    {bundle.description ? (
                      <p className="mt-1 text-sm text-slate-500">{bundle.description}</p>
                    ) : null}
                  </div>
                  <div className="text-sm font-semibold text-slate-900">
                    {formatCurrency(bundle.revenue, bundle.currencyCode ?? 'USD')}
                  </div>
                </div>
                <div className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-3">
                  <div>
                    <p className="font-semibold text-slate-900">{formatPercent(bundle.conversionRate)}</p>
                    <p className="mt-0.5">Conversion</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{formatNumber(bundle.repeatClients)}</p>
                    <p className="mt-0.5">Repeat clients</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">
                      {bundle.attachRate == null ? '—' : formatPercent(bundle.attachRate)}
                    </p>
                    <p className="mt-0.5">Attach rate</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">We’ll surface bundle performance once orders start flowing through this workspace.</p>
          )}
        </div>
      </div>
    </SectionShell>
  );
}
