import { useCallback, useMemo } from 'react';
import useCachedResource from './useCachedResource.js';
import { fetchCatalogInsights } from '../services/catalogInsights.js';

const DEFAULT_INSIGHTS = Object.freeze({
  summary: {
    conversionRate: {
      value: 0,
      change: 0,
      label: 'Conversion rate',
      totals: {
        impressions: 0,
        clicks: 0,
        conversions: 0,
      },
    },
    repeatClientRate: {
      value: 0,
      change: 0,
      label: 'Repeat client rate',
      totals: {
        totalClients: 0,
        repeatClients: 0,
        activeRetainers: 0,
      },
    },
    crossSellAcceptance: {
      value: null,
      change: null,
      label: 'Attach rate',
      openOpportunities: 0,
    },
  },
  bundles: [],
  crossSell: [],
  keywords: [],
  margin: {
    revenue: 0,
    softwareCosts: 0,
    subcontractorCosts: 0,
    fulfillmentCosts: 0,
    grossMarginDollar: 0,
    grossMarginPercent: 0,
    notes: null,
    month: null,
    history: [],
  },
  metadata: {
    generatedAt: null,
    period: null,
  },
});

function normaliseInsights(raw) {
  if (!raw || typeof raw !== 'object') {
    return DEFAULT_INSIGHTS;
  }

  const summary = raw.summary ?? {};
  const conversionRate = { ...DEFAULT_INSIGHTS.summary.conversionRate, ...(summary.conversionRate ?? {}) };
  const repeatClientRate = {
    ...DEFAULT_INSIGHTS.summary.repeatClientRate,
    ...(summary.repeatClientRate ?? {}),
  };
  const crossSellAcceptance = {
    ...DEFAULT_INSIGHTS.summary.crossSellAcceptance,
    ...(summary.crossSellAcceptance ?? {}),
  };

  return {
    summary: {
      conversionRate,
      repeatClientRate,
      crossSellAcceptance,
    },
    bundles: Array.isArray(raw.bundles) ? raw.bundles : [],
    crossSell: Array.isArray(raw.crossSell) ? raw.crossSell : [],
    keywords: Array.isArray(raw.keywords) ? raw.keywords : [],
    margin: { ...DEFAULT_INSIGHTS.margin, ...(raw.margin ?? {}) },
    metadata: { ...DEFAULT_INSIGHTS.metadata, ...(raw.metadata ?? {}) },
  };
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

function buildConversionFunnel(conversionRate) {
  const totals = conversionRate?.totals ?? DEFAULT_INSIGHTS.summary.conversionRate.totals;
  return [
    { id: 'impressions', label: 'Impressions', value: formatNumber(totals.impressions) },
    { id: 'clicks', label: 'Listing clicks', value: formatNumber(totals.clicks) },
    { id: 'conversions', label: 'Orders won', value: formatNumber(totals.conversions) },
  ];
}

function buildRepeatClientSummary(repeatClientRate) {
  const totals = repeatClientRate?.totals ?? DEFAULT_INSIGHTS.summary.repeatClientRate.totals;
  return {
    rate: formatPercent(repeatClientRate?.value ?? 0),
    change: repeatClientRate?.change ?? 0,
    totalClients: formatNumber(totals.totalClients),
    repeatClients: formatNumber(totals.repeatClients),
    activeRetainers: formatNumber(totals.activeRetainers),
  };
}

export default function useFreelancerCatalogInsights({ freelancerId, enabled = true } = {}) {
  const cacheKey = freelancerId
    ? `freelancer:catalog-insights:${freelancerId}`
    : 'freelancer:catalog-insights:demo';
  const shouldFetch = Boolean(freelancerId) && enabled;

  const fetcher = useCallback(
    ({ signal } = {}) => {
      if (!shouldFetch) {
        return Promise.resolve(DEFAULT_INSIGHTS);
      }
      return fetchCatalogInsights(freelancerId, { signal });
    },
    [freelancerId, shouldFetch],
  );

  const resource = useCachedResource(cacheKey, fetcher, {
    enabled,
    dependencies: [cacheKey],
    ttl: 1000 * 45,
  });

  const insights = useMemo(() => normaliseInsights(resource.data), [resource.data]);

  const conversionFunnel = useMemo(
    () => buildConversionFunnel(insights.summary.conversionRate),
    [insights.summary.conversionRate],
  );

  const repeatClientSummary = useMemo(
    () => buildRepeatClientSummary(insights.summary.repeatClientRate),
    [insights.summary.repeatClientRate],
  );

  const attachRate = useMemo(
    () => ({
      rate: insights.summary.crossSellAcceptance.value == null
        ? '—'
        : formatPercent(insights.summary.crossSellAcceptance.value),
      change: insights.summary.crossSellAcceptance.change,
      openOpportunities: insights.summary.crossSellAcceptance.openOpportunities ?? 0,
    }),
    [insights.summary.crossSellAcceptance],
  );

  return {
    insights,
    conversionFunnel,
    repeatClientSummary,
    attachRate,
    topBundles: insights.bundles,
    crossSell: insights.crossSell,
    keywords: insights.keywords,
    margin: insights.margin,
    loading: resource.loading,
    error: resource.error,
    refresh: resource.refresh,
    fromCache: resource.fromCache,
    lastUpdated: resource.lastUpdated,
  };
}
