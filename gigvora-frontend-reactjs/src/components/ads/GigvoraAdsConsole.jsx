import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowPathIcon,
  BoltIcon,
  ClockIcon,
  MegaphoneIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { getAdsDashboard, listAdsPlacements } from '../../services/ads.js';

const numberFormatter = new Intl.NumberFormat('en-US');

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
