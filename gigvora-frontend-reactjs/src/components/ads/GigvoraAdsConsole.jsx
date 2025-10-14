import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowPathIcon,
  ArrowTrendingUpIcon,
  BanknotesIcon,
  BoltIcon,
  ChartBarIcon,
  ClockIcon,
  CursorArrowRaysIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  MegaphoneIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { getAdsDashboard, listAdsPlacements } from '../../services/ads.js';

const numberFormatter = new Intl.NumberFormat('en-US');
const compactNumberFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
});
const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});
const preciseCurrencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});
const percentFormatter = new Intl.NumberFormat('en-US', {
  style: 'percent',
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});
const precisePercentFormatter = new Intl.NumberFormat('en-US', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 2,
});

function formatNumber(value) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) {
    return '0';
  }
  return numberFormatter.format(Math.round(numeric));
}

function formatScore(value) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) {
    return '0.0';
  }
  return numeric.toFixed(1);
}

function formatMinutes(minutes) {
  const numeric = Number(minutes ?? 0);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return '—';
  }
  if (numeric >= 1440) {
    return `${Math.round(numeric / 1440)}d`;
  }
  if (numeric >= 60) {
    return `${Math.round(numeric / 60)}h`;
  }
  return `${numeric}m`;
}

function formatDateTime(value) {
  if (!value) {
    return '—';
  }
  try {
    const date = new Date(value);
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    return value;
  }
}

function formatCompactNumber(value) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) {
    return '0';
  }
  return compactNumberFormatter.format(numeric);
}

function formatCurrency(value) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) {
    return '$0';
  }
  return currencyFormatter.format(numeric);
}

function formatCurrencyPrecise(value) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) {
    return '$0.00';
  }
  return preciseCurrencyFormatter.format(numeric);
}

function formatPercent(value, { fromPercentage = false, precise = false } = {}) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) {
    return precise ? precisePercentFormatter.format(0) : percentFormatter.format(0);
  }
  const ratio = fromPercentage ? numeric / 100 : numeric;
  return (precise ? precisePercentFormatter : percentFormatter).format(ratio);
}

function formatLabel(value) {
  if (!value) {
    return 'Unknown';
  }
  return `${value}`
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatDate(value) {
  if (!value) {
    return '—';
  }
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch (error) {
    return value;
  }
}

function Badge({ children, tone = 'blue' }) {
  const tones = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${tones[tone] ?? tones.blue}`}
    >
      {children}
    </span>
  );
}

function MetricTile({ label, value, caption, icon: Icon, tone = 'blue' }) {
  const toneStyles = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    slate: 'bg-slate-50 text-slate-700 border-slate-200',
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
          {caption ? <p className="mt-2 text-xs text-slate-500">{caption}</p> : null}
        </div>
        {Icon ? (
          <span className={`rounded-2xl border px-3 py-2 ${toneStyles[tone] ?? toneStyles.blue}`}>
            <Icon className="h-6 w-6" />
          </span>
        ) : null}
      </div>
    </div>
  );
}

function ForecastSummaryCard({ label, value, caption, icon: Icon, tone = 'blue' }) {
  const toneStyles = {
    blue: {
      container: 'border-blue-100 bg-blue-50/70',
      icon: 'bg-blue-100 text-blue-600',
      label: 'text-blue-700',
    },
    emerald: {
      container: 'border-emerald-100 bg-emerald-50/70',
      icon: 'bg-emerald-100 text-emerald-600',
      label: 'text-emerald-700',
    },
    slate: {
      container: 'border-slate-200 bg-slate-50',
      icon: 'bg-slate-200 text-slate-600',
      label: 'text-slate-600',
    },
  };

  const styles = toneStyles[tone] ?? toneStyles.blue;

  return (
    <div className={`rounded-2xl border ${styles.container} p-4 shadow-sm transition`}> 
      <div className="flex items-start gap-3">
        {Icon ? (
          <span className={`flex h-10 w-10 items-center justify-center rounded-full ${styles.icon}`}>
            <Icon className="h-5 w-5" />
          </span>
        ) : null}
        <div>
          <p className={`text-xs font-semibold uppercase tracking-wide ${styles.label}`}>{label}</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
          {caption ? <p className="mt-1 text-xs text-slate-500">{caption}</p> : null}
        </div>
      </div>
    </div>
  );
}

function RecommendationCard({ recommendation }) {
  return (
    <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-sm text-blue-800 shadow-sm">
      <div className="flex items-start gap-3">
        <ShieldCheckIcon className="mt-0.5 h-5 w-5 flex-none text-blue-500" />
        <p>{recommendation}</p>
      </div>
    </div>
  );
}

function KeywordPill({ keyword, weight }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm">
      <SparklesIcon className="h-4 w-4 text-blue-500" />
      <span>{keyword}</span>
      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{formatNumber(weight)}</span>
    </span>
  );
}

function TaxonomyPill({ slug, weight }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-3 py-1 text-xs font-medium text-emerald-700 shadow-sm">
      <BoltIcon className="h-4 w-4" />
      <span className="capitalize">{slug.replace(/[-_]+/g, ' ')}</span>
      <span className="text-[11px] font-semibold uppercase tracking-wide text-emerald-600">{formatNumber(weight)}</span>
    </span>
  );
}

function ForecastSection({ forecast }) {
  if (!forecast || !forecast.summary) {
    return null;
  }

  const summary = forecast.summary ?? {};
  const traffic = forecast.traffic ?? {};
  const scenarios = Array.isArray(forecast.scenarios) ? forecast.scenarios : [];
  const assumptions = Array.isArray(forecast.assumptions) ? forecast.assumptions : [];
  const safetyChecks = Array.isArray(forecast.safetyChecks) ? forecast.safetyChecks : [];
  const trend = Array.isArray(traffic.trend) ? traffic.trend.slice(-7) : [];

  return (
    <div className="mt-8 grid gap-6 xl:grid-cols-3">
      <div className="space-y-6 xl:col-span-2">
        <div className="rounded-3xl border border-blue-200 bg-white p-6 shadow-lg shadow-blue-100/50">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">Forecast horizon</p>
              <h3 className="mt-1 text-xl font-semibold text-slate-900">
                {summary.horizonDays ?? 14}-day performance outlook
              </h3>
              <p className="mt-2 max-w-2xl text-sm text-slate-500">
                Blends live placement scoring, coupon readiness, and traffic momentum to power campaign planning.
              </p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-300 bg-blue-50 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
              <ArrowTrendingUpIcon className="h-4 w-4" /> Forecast ready
            </span>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <ForecastSummaryCard
              label="Projected sessions"
              value={formatCompactNumber(summary.projectedSessions)}
              caption={`Coverage ${summary.coverageScore ?? 0}% • ${summary.creativeVariants ?? 0} variants`}
              icon={ChartBarIcon}
              tone="blue"
            />
            <ForecastSummaryCard
              label="Impressions"
              value={formatCompactNumber(summary.expectedImpressions)}
              caption={`CTR ${formatPercent(summary.ctr ?? 0, { fromPercentage: true, precise: true })}`}
              icon={ArrowTrendingUpIcon}
              tone="blue"
            />
            <ForecastSummaryCard
              label="Clicks"
              value={formatCompactNumber(summary.expectedClicks)}
              caption={`Active coverage ${formatPercent(summary.activePlacementRatio ?? 0, { precise: true })}`}
              icon={CursorArrowRaysIcon}
              tone="slate"
            />
            <ForecastSummaryCard
              label="Leads"
              value={formatCompactNumber(summary.expectedLeads)}
              caption={`Conversion ${formatPercent(summary.conversionRate ?? 0, { fromPercentage: true, precise: true })}`}
              icon={SparklesIcon}
              tone="emerald"
            />
            <ForecastSummaryCard
              label="Revenue forecast"
              value={formatCurrency(summary.expectedRevenue)}
              caption={`Spend ${formatCurrencyPrecise(summary.expectedSpend)} • ROI ${
                summary.projectedRoi != null ? formatPercent(summary.projectedRoi, { precise: true }) : '—'
              }`}
              icon={BanknotesIcon}
              tone="emerald"
            />
            <ForecastSummaryCard
              label="Incentive coverage"
              value={`${summary.couponCoverage ?? 0}% of placements`}
              caption={`Quality score ${summary.averageScore ?? 0}`}
              icon={BoltIcon}
              tone="slate"
            />
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-700">Scenario planning</p>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Confidence anchored by live telemetry
            </p>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {scenarios.map((scenario) => (
              <div
                key={scenario.label}
                className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-600 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">{scenario.label}</p>
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    {formatPercent(scenario.confidence ?? 0, { precise: true })}
                  </span>
                </div>
                <div className="mt-3 space-y-2">
                  <p>
                    <span className="font-semibold text-slate-900">
                      {formatCompactNumber(scenario.impressions)}
                    </span>{' '}
                    impressions
                  </p>
                  <p>
                    <span className="font-semibold text-slate-900">
                      {formatCompactNumber(scenario.clicks)}
                    </span>{' '}
                    clicks ·{' '}
                    <span className="font-semibold text-slate-900">
                      {formatCompactNumber(scenario.leads)}
                    </span>{' '}
                    leads
                  </p>
                  <p>
                    {formatCurrencyPrecise(scenario.revenue)} revenue vs {formatCurrencyPrecise(scenario.spend)} spend
                  </p>
                  <p>ROI {scenario.roi != null ? formatPercent(scenario.roi, { precise: true }) : '—'}</p>
                </div>
              </div>
            ))}
            {!scenarios.length ? (
              <p className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-500">
                Scenario modelling will unlock after placements generate initial telemetry.
              </p>
            ) : null}
          </div>
        </div>
      </div>
      <div className="space-y-6">
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50/80 p-6 shadow-md shadow-emerald-100/60">
          <p className="text-sm font-semibold text-emerald-900">Traffic signals</p>
          <div className="mt-3 grid gap-3 text-sm text-emerald-800">
            <div className="flex items-center justify-between">
              <span>Avg daily sessions</span>
              <span className="font-semibold text-emerald-900">
                {formatCompactNumber(traffic.averageDailySessions)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Projected lift</span>
              <span className="font-semibold text-emerald-900">
                {formatPercent(traffic.growthRate ?? 0, { precise: true })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Returning visitors</span>
              <span className="font-semibold text-emerald-900">
                {formatPercent(traffic.returningVisitorRate ?? 0, { fromPercentage: true, precise: true })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Mobile share</span>
              <span className="font-semibold text-emerald-900">
                {formatPercent(traffic.mobileShare ?? 0, { fromPercentage: true, precise: true })}
              </span>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Source mix</p>
            <div className="mt-2 space-y-2 text-xs text-emerald-700">
              {(traffic.sourceBreakdown ?? []).map((entry) => (
                <div
                  key={entry.source}
                  className="flex items-center justify-between rounded-lg bg-white/70 px-3 py-2 shadow-sm"
                >
                  <span className="font-medium text-emerald-800">{formatLabel(entry.source)}</span>
                  <span className="font-semibold text-emerald-700">
                    {formatPercent(entry.share ?? 0, { precise: true })}
                  </span>
                </div>
              ))}
              {!traffic.sourceBreakdown?.length ? (
                <p className="rounded-lg bg-white/70 px-3 py-2 text-emerald-700">
                  Source insights will appear once analytics rollups sync traffic origins.
                </p>
              ) : null}
            </div>
          </div>
          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
              Trend (last {Math.min(trend.length, 7) || 7} days)
            </p>
            <ul className="mt-2 space-y-1 text-xs text-emerald-700">
              {trend.length ? (
                trend.map((point) => (
                  <li
                    key={point.date}
                    className="flex items-center justify-between rounded-lg bg-white/70 px-3 py-1.5"
                  >
                    <span>{formatDate(point.date)}</span>
                    <span className="font-semibold">{formatCompactNumber(point.sessions)}</span>
                  </li>
                ))
              ) : (
                <li className="rounded-lg bg-white/70 px-3 py-1.5 text-emerald-600">
                  Trend data will populate after analytics rollups capture sessions.
                </li>
              )}
            </ul>
          </div>
        </div>
        <div className="rounded-3xl border border-blue-200 bg-blue-50/70 p-6 shadow-sm">
          <p className="text-sm font-semibold text-blue-900">Key assumptions</p>
          <ul className="mt-3 space-y-2 text-sm text-blue-800">
            {assumptions.map((assumption, index) => (
              <li key={`${index}-${assumption}`} className="flex items-start gap-2">
                <InformationCircleIcon className="mt-0.5 h-5 w-5 flex-none text-blue-500" />
                <span>{assumption}</span>
              </li>
            ))}
            {!assumptions.length ? (
              <li className="text-blue-700/80">
                Forecast assumptions will surface once campaign telemetry stabilises.
              </li>
            ) : null}
          </ul>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-slate-700">Operational guardrails</p>
          <div className="mt-3 space-y-3 text-sm">
            {safetyChecks.map((alert, index) => {
              const toneClass =
                alert.level === 'warning'
                  ? 'border-amber-200 bg-amber-50 text-amber-800'
                  : alert.level === 'critical'
                  ? 'border-rose-200 bg-rose-50 text-rose-800'
                  : 'border-blue-200 bg-blue-50 text-blue-800';
              const Icon =
                alert.level === 'warning' || alert.level === 'critical'
                  ? ExclamationTriangleIcon
                  : InformationCircleIcon;
              return (
                <div
                  key={`${index}-${alert.message}`}
                  className={`rounded-2xl border ${toneClass} px-4 py-3 shadow-sm`}
                >
                  <div className="flex items-start gap-3">
                    <Icon className="mt-0.5 h-5 w-5 flex-none" />
                    <div className="space-y-1">
                      <p className="font-semibold">{alert.message}</p>
                      {alert.suggestion ? (
                        <p className="text-xs opacity-80">{alert.suggestion}</p>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
            {!safetyChecks.length ? (
              <p className="rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3 text-sm text-emerald-800 shadow-sm">
                No operational risks detected. Keep refreshing creatives to maintain healthy performance.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

const initialState = {
  snapshot: null,
  loading: false,
  error: null,
  lastUpdated: null,
};

export default function GigvoraAdsConsole({ initialSnapshot, defaultContext }) {
  const [state, setState] = useState(() => ({
    ...initialState,
    snapshot: initialSnapshot ?? null,
    lastUpdated: initialSnapshot?.generatedAt ? new Date(initialSnapshot.generatedAt) : null,
  }));
  const [selectedSurface, setSelectedSurface] = useState(() => initialSnapshot?.surfaces?.[0]?.surface ?? null);
  const [placementsState, setPlacementsState] = useState({ cache: new Map(), loading: false, error: null });

  const contextPayload = useMemo(() => {
    if (defaultContext && typeof defaultContext === 'object') {
      return defaultContext;
    }
    return initialSnapshot?.overview?.context ?? {};
  }, [defaultContext, initialSnapshot]);

  useEffect(() => {
    if (!initialSnapshot) {
      return;
    }
    setState({
      snapshot: initialSnapshot,
      loading: false,
      error: null,
      lastUpdated: initialSnapshot.generatedAt ? new Date(initialSnapshot.generatedAt) : new Date(),
    });
    setSelectedSurface((previous) => previous ?? initialSnapshot.surfaces?.[0]?.surface ?? null);
  }, [initialSnapshot]);

  const surfaces = state.snapshot?.surfaces ?? [];
  const overview = state.snapshot?.overview ?? null;
  const keywordHighlights = overview?.keywordHighlights ?? [];
  const taxonomyHighlights = overview?.taxonomyHighlights ?? [];
  const forecast = state.snapshot?.forecast ?? null;

  const handleRefresh = useCallback(
    async (options = {}) => {
      setState((previous) => ({ ...previous, loading: true, error: null }));
      try {
        const snapshot = await getAdsDashboard({
          surfaces: surfaces.length ? surfaces.map((surface) => surface.surface) : undefined,
          context: contextPayload,
          bypassCache: options.bypassCache ?? true,
        });
        setState({
          snapshot,
          loading: false,
          error: null,
          lastUpdated: snapshot.generatedAt ? new Date(snapshot.generatedAt) : new Date(),
        });
        setSelectedSurface(snapshot?.surfaces?.[0]?.surface ?? null);
        setPlacementsState({ cache: new Map(), loading: false, error: null });
      } catch (error) {
        setState((previous) => ({ ...previous, loading: false, error }));
      }
    },
    [contextPayload, surfaces],
  );

  const loadPlacementsForSurface = useCallback(async (surface) => {
    if (!surface) {
      return;
    }
    setPlacementsState((previous) => ({ ...previous, loading: true, error: null }));
    try {
      const response = await listAdsPlacements({ surfaces: [surface] });
      const placements = response.placements ?? response.surface?.placements ?? [];
      setPlacementsState((previous) => {
        const nextCache = new Map(previous.cache);
        nextCache.set(surface, placements);
        return { cache: nextCache, loading: false, error: null };
      });
    } catch (error) {
      setPlacementsState((previous) => ({ ...previous, loading: false, error }));
    }
  }, []);

  useEffect(() => {
    if (!selectedSurface) {
      return;
    }
    if (placementsState.cache.has(selectedSurface)) {
      return;
    }
    loadPlacementsForSurface(selectedSurface);
  }, [selectedSurface, loadPlacementsForSurface, placementsState.cache]);

  const activePlacements = useMemo(() => {
    if (!selectedSurface) {
      return [];
    }
    return placementsState.cache.get(selectedSurface) ?? [];
  }, [placementsState.cache, selectedSurface]);

  const renderPlacement = (placement) => {
    const creative = placement.creative ?? {};
    const campaign = creative.campaign ?? {};
    return (
      <div
        key={placement.id}
        className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm transition hover:shadow-md"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">{creative.headline ?? campaign.name ?? 'Untitled placement'}</p>
            <p className="text-xs text-slate-500">{creative.subheadline ?? creative.body ?? 'Awaiting creative copy.'}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge tone={placement.isActive ? 'emerald' : 'slate'}>
                {placement.isActive ? 'Active' : placement.isUpcoming ? 'Upcoming' : 'Paused'}
              </Badge>
              {campaign.objective ? <Badge tone="blue">{campaign.objective}</Badge> : null}
              {placement.opportunityType ? <Badge tone="slate">{placement.opportunityType}</Badge> : null}
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-semibold text-slate-900">{formatScore(placement.score)}</p>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Score</p>
            <p className="mt-2 text-xs text-slate-500">
              Starts in {formatMinutes(placement.timeUntilStartMinutes)} • Ends in {formatMinutes(placement.timeUntilEndMinutes)}
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {(placement.keywords ?? []).slice(0, 4).map((keyword) => (
            <KeywordPill key={`${placement.id}-${keyword.id}`} keyword={keyword.keyword} weight={keyword.weight} />
          ))}
          {(placement.taxonomies ?? []).slice(0, 3).map((taxonomy) => (
            <TaxonomyPill key={`${placement.id}-${taxonomy.id}`} slug={taxonomy.slug} weight={taxonomy.weight} />
          ))}
        </div>
      </div>
    );
  };

  const renderSurfaceButton = (surface) => {
    const isActive = surface.surface === selectedSurface;
    return (
      <button
        key={surface.surface}
        type="button"
        onClick={() => setSelectedSurface(surface.surface)}
        className={`rounded-full border px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          isActive
            ? 'border-blue-500 bg-blue-100 text-blue-800 shadow-sm'
            : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-600'
        }`}
      >
        <span className="block text-left">
          <span className="font-semibold">{surface.label}</span>
          <span className="ml-2 text-xs text-slate-500">
            {formatNumber(surface.totalPlacements)} placements
          </span>
        </span>
      </button>
    );
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg shadow-blue-100/40">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Gigvora Ads Console</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Monitor campaign coverage, surface readiness, and creative health across the Gigvora network. Insights
            update every time placements sync with the marketing API.
          </p>
        </div>
        <div className="flex flex-col items-start gap-3 lg:items-end">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Last updated {state.lastUpdated ? formatDateTime(state.lastUpdated) : '—'}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleRefresh({ bypassCache: false })}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-blue-200 hover:text-blue-600"
            >
              <ArrowPathIcon className="h-4 w-4" />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => handleRefresh({ bypassCache: true })}
              className="inline-flex items-center gap-2 rounded-full border border-blue-500 bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500"
            >
              <SparklesIcon className="h-4 w-4" />
              Force sync
            </button>
          </div>
        </div>
      </div>

      {state.error ? (
        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50/70 p-4 text-sm text-rose-700">
          <p className="font-semibold">We could not refresh Gigvora ads data.</p>
          <p className="mt-1 text-rose-600/80">
            {(state.error?.body?.message ?? state.error?.message ?? 'Try again in a few moments.')}
          </p>
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          label="Total placements"
          value={formatNumber(overview?.totalPlacements)}
          caption="Across all Gigvora surfaces"
          icon={MegaphoneIcon}
          tone="blue"
        />
        <MetricTile
          label="Active placements"
          value={formatNumber(overview?.activePlacements)}
          caption="Live right now"
          icon={ShieldCheckIcon}
          tone="emerald"
        />
        <MetricTile
          label="Upcoming"
          value={formatNumber(overview?.upcomingPlacements)}
          caption="Scheduled within the window"
          icon={ClockIcon}
          tone="slate"
        />
        <MetricTile
          label="Campaigns"
          value={formatNumber(overview?.totalCampaigns)}
          caption="Distinct marketing initiatives"
          icon={SparklesIcon}
          tone="blue"
        />
      </div>

      {forecast ? <ForecastSection forecast={forecast} /> : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <p className="text-sm font-semibold text-slate-700">Network surfaces</p>
          <div className="mt-3 flex flex-wrap gap-3">
            {surfaces.length ? surfaces.map((surface) => renderSurfaceButton(surface)) : <p className="text-sm text-slate-500">Surfaces will populate as placements are configured.</p>}
          </div>
          <div className="mt-5 space-y-4">
            {state.loading && !activePlacements.length ? (
              <div className="animate-pulse rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-400">
                Syncing placements…
              </div>
            ) : placementsState.loading && !activePlacements.length ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                Loading placements for this surface…
              </div>
            ) : activePlacements.length ? (
              activePlacements.map((placement) => renderPlacement(placement))
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6 text-sm text-slate-500">
                There are no placements configured for this surface yet.
              </div>
            )}
            {placementsState.error ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-700">
                We were unable to load placement details. {placementsState.error?.message ?? 'Try refreshing the console.'}
              </div>
            ) : null}
          </div>
        </div>
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
            <p className="text-sm font-semibold text-slate-700">Insights</p>
            <div className="mt-3 space-y-3 text-sm text-slate-600">
              <p>
                Keyword targeting syncs with <span className="font-semibold text-slate-800">{formatNumber(keywordHighlights.length)}</span>{' '}
                active interest clusters.
              </p>
              <p>
                {formatNumber(taxonomyHighlights.length)} taxonomy focus areas are highlighted for personalisation journeys.
              </p>
              {contextPayload?.keywordHints?.length ? (
                <p>
                  Context hints include{' '}
                  <span className="font-medium text-slate-800">{contextPayload.keywordHints.join(', ')}</span>.
                </p>
              ) : null}
            </div>
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Top keywords</p>
              <div className="flex flex-wrap gap-2">
                {keywordHighlights.length ? (
                  keywordHighlights.map((entry) => (
                    <KeywordPill key={entry.keyword} keyword={entry.keyword} weight={entry.weight} />
                  ))
                ) : (
                  <p className="text-xs text-slate-500">Keyword intelligence will appear after campaigns run.</p>
                )}
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Priority taxonomies</p>
              <div className="flex flex-wrap gap-2">
                {taxonomyHighlights.length ? (
                  taxonomyHighlights.map((entry) => (
                    <TaxonomyPill key={entry.slug} slug={entry.slug} weight={entry.weight} />
                  ))
                ) : (
                  <p className="text-xs text-slate-500">Taxonomy highlights will populate with campaign data.</p>
                )}
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
            <p className="text-sm font-semibold text-blue-900">Recommendations</p>
            <div className="mt-3 space-y-3">
              {(state.snapshot?.recommendations ?? []).map((recommendation, index) => (
                <RecommendationCard key={`${index}-${recommendation}`} recommendation={recommendation} />
              ))}
              {!state.snapshot?.recommendations?.length ? (
                <p className="text-sm text-blue-800/80">No recommendations right now. Keep campaigns rotating fresh creatives.</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
