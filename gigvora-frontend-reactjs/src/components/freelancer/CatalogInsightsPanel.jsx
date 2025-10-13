import { useEffect, useMemo, useRef, useState } from 'react';
import useCachedResource from '../../hooks/useCachedResource.js';
import { fetchCatalogInsights } from '../../services/catalogInsights.js';

function formatCurrency(amount) {
  if (amount == null) {
    return '—';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

function formatPercent(value, fractionDigits = 1) {
  if (value == null || Number.isNaN(value)) {
    return '—';
  }
  return `${Number(value).toFixed(fractionDigits)}%`;
}

function formatChange(value, { suffix = 'pts', fractionDigits = 1 } = {}) {
  if (value == null || Number.isNaN(value)) {
    return '0 ' + suffix;
  }
  const numeric = Number(value);
  if (Math.abs(numeric) < 0.01) {
    return `0 ${suffix}`;
  }
  const prefix = numeric > 0 ? '+' : '';
  return `${prefix}${numeric.toFixed(fractionDigits)} ${suffix}`;
}

function formatRelativeTime(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return 'just now';
  }
  const deltaMs = Date.now() - date.getTime();
  const minutes = Math.round(deltaMs / (1000 * 60));
  if (minutes < 1) return 'moments ago';
  if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function clampSliderValue(value, { min, max }) {
  if (value == null || Number.isNaN(value)) {
    return min;
  }
  return Math.min(max, Math.max(min, Math.round(value)));
}

export default function CatalogInsightsPanel({ freelancerId }) {
  const marginInitializedRef = useRef(false);
  const [marginInputs, setMarginInputs] = useState({
    revenue: 0,
    softwareCosts: 0,
    subcontractorCosts: 0,
    fulfillmentCosts: 0,
  });

  const {
    data,
    error,
    loading,
    fromCache,
    lastUpdated,
    refresh,
  } = useCachedResource(
    `catalog-insights:${freelancerId}`,
    ({ signal }) => fetchCatalogInsights(freelancerId, { signal }),
    { ttl: 1000 * 60, enabled: Boolean(freelancerId), dependencies: [freelancerId] },
  );

  useEffect(() => {
    if (!data?.margin) {
      return;
    }
    if (marginInitializedRef.current) {
      return;
    }
    setMarginInputs({
      revenue: clampSliderValue(data.margin.revenue, { min: 8000, max: 60000 }),
      softwareCosts: clampSliderValue(data.margin.softwareCosts, { min: 300, max: 8000 }),
      subcontractorCosts: clampSliderValue(data.margin.subcontractorCosts, { min: 500, max: 16000 }),
      fulfillmentCosts: clampSliderValue(data.margin.fulfillmentCosts, { min: 300, max: 8000 }),
    });
    marginInitializedRef.current = true;
  }, [data]);

  const marginThresholds = data?.margin?.thresholds ?? { healthy: 45, watch: 30 };

  const marginReport = useMemo(() => {
    const revenue = Number(marginInputs.revenue) || 0;
    const software = Number(marginInputs.softwareCosts) || 0;
    const subcontractor = Number(marginInputs.subcontractorCosts) || 0;
    const fulfillment = Number(marginInputs.fulfillmentCosts) || 0;
    const totalCosts = software + subcontractor + fulfillment;
    const grossMarginDollar = revenue - totalCosts;
    const grossMarginPercent = revenue > 0 ? (grossMarginDollar / revenue) * 100 : 0;
    let marginRange = 'Critical';
    if (grossMarginPercent >= marginThresholds.healthy) {
      marginRange = 'Healthy';
    } else if (grossMarginPercent >= marginThresholds.watch) {
      marginRange = 'Watch';
    }
    return {
      totalCosts,
      grossMarginDollar,
      grossMarginPercent,
      marginRange,
    };
  }, [marginInputs, marginThresholds]);

  const summary = data?.summary ?? {};
  const conversionSummary = summary.conversionRate ?? {};
  const repeatSummary = summary.repeatClientRate ?? {};
  const crossSellSummary = summary.crossSellAcceptance ?? {};

  const summaryCards = useMemo(
    () => [
      {
        label: 'Overall conversion rate',
        value: formatPercent(conversionSummary.value),
        trend:
          conversionSummary.change == null
            ? 'Stable'
            : formatChange(conversionSummary.change, { suffix: 'pts' }),
        trendLabel: conversionSummary.label ?? 'Last 30 days',
      },
      {
        label: 'Repeat client ratio',
        value: formatPercent(repeatSummary.value),
        trend:
          repeatSummary.change == null
            ? 'No new retainers'
            : `${repeatSummary.change >= 0 ? '+' : ''}${repeatSummary.change} new retainers`,
        trendLabel: repeatSummary.label ?? 'Growth focus',
      },
      {
        label: 'Cross-sell acceptance',
        value: crossSellSummary.value == null ? '—' : formatPercent(crossSellSummary.value),
        trend:
          crossSellSummary.change == null
            ? 'Stable attach rate'
            : formatChange(crossSellSummary.change, { suffix: 'pts' }),
        trendLabel:
          crossSellSummary.openOpportunities != null
            ? `${crossSellSummary.openOpportunities} active motions`
            : crossSellSummary.label ?? 'Attach momentum',
      },
    ],
    [conversionSummary, repeatSummary, crossSellSummary],
  );

  const bundles = Array.isArray(data?.bundles) ? data.bundles : [];
  const crossSellOpportunities = Array.isArray(data?.crossSell) ? data.crossSell : [];
  const keywords = Array.isArray(data?.keywords) ? data.keywords : [];
  const maxKeywordImpressions = keywords.reduce(
    (accumulator, keyword) => Math.max(accumulator, keyword.impressions ?? 0),
    0,
  );

  const marginHistory = Array.isArray(data?.margin?.history) ? data.margin.history : [];
  const latestMarginMonth = data?.margin?.month ?? null;

  const hasError = Boolean(error);

  if (loading && !data) {
    return (
      <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">Loading catalog insights…</p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600/80">
            Catalog signals
          </p>
          {lastUpdated ? (
            <p className="text-[11px] text-slate-500">
              Refreshed {formatRelativeTime(lastUpdated)}
              {fromCache ? ' (from cache)' : ''}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {hasError ? (
            <span className="text-[11px] font-medium text-rose-600">
              {error?.message ?? 'Failed to refresh insights.'}
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => refresh({ force: true })}
            className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 transition hover:border-blue-300 hover:bg-blue-100"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {summaryCards.map((metric) => (
          <div
            key={metric.label}
            className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4 shadow-inner"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-blue-600/80">{metric.label}</p>
            <p className="mt-2 text-2xl font-semibold text-blue-900">{metric.value}</p>
            <p className="mt-2 text-xs text-blue-700/80">
              <span className="font-semibold text-blue-700">{metric.trend}</span> {metric.trendLabel}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold text-slate-900">Top performing bundles</h4>
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">30 day view</span>
          </div>
          {bundles.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">
              Publish your first gig bundles to unlock conversion tracking and cross-sell analytics.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              {bundles.map((bundle) => (
                <div
                  key={bundle.id ?? bundle.name}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-blue-200 hover:bg-blue-50"
                >
                  <p className="text-sm font-semibold text-slate-800">{bundle.name}</p>
                  {bundle.description ? (
                    <p className="mt-1 text-xs text-slate-500">{bundle.description}</p>
                  ) : null}
                  <dl className="mt-3 grid grid-cols-2 gap-3 text-xs text-slate-600 sm:grid-cols-4">
                    <div>
                      <dt className="uppercase tracking-wide text-slate-400">Conversion</dt>
                      <dd className="text-sm font-medium text-slate-700">
                        {formatPercent(bundle.conversionRate)}
                      </dd>
                    </div>
                    <div>
                      <dt className="uppercase tracking-wide text-slate-400">Revenue</dt>
                      <dd className="text-sm font-medium text-slate-700">{formatCurrency(bundle.revenue)}</dd>
                    </div>
                    <div>
                      <dt className="uppercase tracking-wide text-slate-400">Repeat</dt>
                      <dd className="text-sm font-medium text-slate-700">{bundle.repeatClients ?? 0}</dd>
                    </div>
                    <div>
                      <dt className="uppercase tracking-wide text-slate-400">Cross-sell</dt>
                      <dd className="text-sm font-medium text-slate-700">
                        {bundle.attachRate == null ? '—' : formatPercent(bundle.attachRate)}
                      </dd>
                    </div>
                  </dl>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h4 className="text-lg font-semibold text-slate-900">Margin calculator</h4>
          <p className="mt-2 text-sm text-slate-600">
            Adjust software and subcontractor expenses to model profitability on active gig bundles.
          </p>

          <dl className="mt-6 space-y-4 text-sm text-slate-600">
            <div>
              <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-400">
                <span>Monthly revenue</span>
                <span>{formatCurrency(marginInputs.revenue)}</span>
              </div>
              <input
                type="range"
                min="8000"
                max="60000"
                step="500"
                value={marginInputs.revenue}
                onChange={(event) =>
                  setMarginInputs((prev) => ({ ...prev, revenue: Number(event.target.value) }))
                }
                className="mt-2 w-full accent-blue-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-400">
                <span>Software stack</span>
                <span>{formatCurrency(marginInputs.softwareCosts)}</span>
              </div>
              <input
                type="range"
                min="300"
                max="8000"
                step="100"
                value={marginInputs.softwareCosts}
                onChange={(event) =>
                  setMarginInputs((prev) => ({ ...prev, softwareCosts: Number(event.target.value) }))
                }
                className="mt-2 w-full accent-blue-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-400">
                <span>Subcontractors</span>
                <span>{formatCurrency(marginInputs.subcontractorCosts)}</span>
              </div>
              <input
                type="range"
                min="500"
                max="16000"
                step="250"
                value={marginInputs.subcontractorCosts}
                onChange={(event) =>
                  setMarginInputs((prev) => ({ ...prev, subcontractorCosts: Number(event.target.value) }))
                }
                className="mt-2 w-full accent-blue-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-400">
                <span>Fulfillment</span>
                <span>{formatCurrency(marginInputs.fulfillmentCosts)}</span>
              </div>
              <input
                type="range"
                min="300"
                max="8000"
                step="100"
                value={marginInputs.fulfillmentCosts}
                onChange={(event) =>
                  setMarginInputs((prev) => ({ ...prev, fulfillmentCosts: Number(event.target.value) }))
                }
                className="mt-2 w-full accent-blue-500"
              />
            </div>
          </dl>

          <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm">
            <div className="flex items-center justify-between text-blue-700">
              <span className="font-semibold uppercase tracking-wide text-xs">Gross margin</span>
              <span className="text-lg font-semibold">
                {formatPercent(marginReport.grossMarginPercent)}
              </span>
            </div>
            <p className="mt-2 text-xs text-blue-700/80">
              {formatCurrency(marginReport.grossMarginDollar)} retained after {formatCurrency(marginReport.totalCosts)}
              {' '}in delivery costs. Status: <span className="font-semibold">{marginReport.marginRange}</span>
              {latestMarginMonth
                ? ` · Last actuals captured ${new Date(latestMarginMonth).toLocaleDateString()}`
                : ''}
            </p>
            {marginHistory.length > 1 ? (
              <p className="mt-2 text-[11px] text-blue-700/70">
                Trailing gross margin average: {formatPercent(
                  marginHistory
                    .slice(0, 3)
                    .reduce((sum, month) => sum + (month.grossMarginPercent ?? 0), 0) /
                    Math.min(3, marginHistory.length),
                )}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h4 className="text-lg font-semibold text-slate-900">Cross-sell opportunities</h4>
          <p className="mt-2 text-sm text-slate-600">
            Signals from gigs with high conversion indicate where to package additional value.
          </p>
          {crossSellOpportunities.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">
              Once you collect upsell data, we\'ll surface attach-ready campaigns here.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              {crossSellOpportunities.map((opportunity) => (
                <div key={opportunity.id ?? opportunity.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-800">{opportunity.title}</p>
                    {opportunity.priority ? (
                      <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-600">
                        {opportunity.priority}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-xs text-slate-500">{opportunity.signal}</p>
                  <p className="mt-3 text-xs font-medium uppercase tracking-wide text-blue-600">Next step</p>
                  <p className="text-sm text-slate-700">{opportunity.recommendedAction}</p>
                  <dl className="mt-3 grid grid-cols-3 gap-2 text-[11px] text-slate-500">
                    {opportunity.expectedUpliftPercentage != null ? (
                      <div>
                        <dt>Uplift</dt>
                        <dd className="font-medium text-slate-700">
                          {formatPercent(opportunity.expectedUpliftPercentage)}
                        </dd>
                      </div>
                    ) : null}
                    {opportunity.expectedRevenue != null ? (
                      <div>
                        <dt>Pipeline</dt>
                        <dd className="font-medium text-slate-700">{formatCurrency(opportunity.expectedRevenue)}</dd>
                      </div>
                    ) : null}
                    {opportunity.confidence != null ? (
                      <div>
                        <dt>Confidence</dt>
                        <dd className="font-medium text-slate-700">
                          {formatPercent(opportunity.confidence)}
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold text-slate-900">Search keyword heatmap</h4>
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Impressions</span>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Highest-intent searches fueling gig discovery. Darker cells signal stronger gig visibility.
          </p>
          {keywords.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No keyword telemetry available yet.</p>
          ) : (
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {keywords.map((keyword) => {
                const intensity = maxKeywordImpressions
                  ? Math.min(1, (keyword.impressions ?? 0) / maxKeywordImpressions)
                  : 0.2;
                const background = `rgba(59, 130, 246, ${0.18 + intensity * 0.45})`;
                const borderColor = `rgba(37, 99, 235, ${0.25 + intensity * 0.3})`;
                const topRegion = Array.isArray(keyword.regions) && keyword.regions.length > 0
                  ? keyword.regions[0]
                  : null;

                return (
                  <div
                    key={keyword.keyword}
                    className="rounded-2xl p-4 text-sm text-blue-900 shadow-inner"
                    style={{ backgroundColor: background, border: `1px solid ${borderColor}` }}
                  >
                    <p className="font-semibold">{keyword.keyword}</p>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="uppercase tracking-wide text-blue-900/70">Impressions</p>
                        <p className="text-sm font-semibold">
                          {(keyword.impressions ?? 0).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="uppercase tracking-wide text-blue-900/70">Conversions</p>
                        <p className="text-sm font-semibold">{keyword.conversions ?? 0}</p>
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-blue-900/70">
                      Trend {keyword.trendPercentage == null ? '—' : formatPercent(keyword.trendPercentage)}
                    </p>
                    {topRegion ? (
                      <p className="mt-1 text-[11px] text-blue-900/70">
                        Top region: {topRegion.region} · {(topRegion.impressions ?? 0).toLocaleString()} impressions
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
