import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BookmarkIcon, BookmarkSlashIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import DataStatus from '../components/DataStatus.jsx';
import GigLifecycleShowcase from '../components/gigs/GigLifecycleShowcase.jsx';
import useOpportunityListing from '../hooks/useOpportunityListing.js';
import analytics from '../services/analytics.js';
import { formatRelativeTime } from '../utils/date.js';
import useSession from '../hooks/useSession.js';
import useSavedGigs from '../hooks/useSavedGigs.js';
import {
  aggregateTaxonomyCounts,
  buildTaxonomyDirectory,
  resolveTaxonomyLabel,
  resolveTaxonomyLabels,
} from '../utils/taxonomy.js';

const PAGE_SIZE = 20;

const DELIVERY_SPEED_OPTIONS = [
  { id: 'any', label: 'All delivery speeds' },
  { id: 'express', label: 'Express (1–3 days)' },
  { id: 'standard', label: 'Standard (1 week)' },
  { id: 'extended', label: 'Extended engagements' },
];

function sanitiseBudgetInput(value) {
  if (typeof value !== 'string') {
    return '';
  }
  return value.replace(/[^0-9]/g, '');
}

function parseBudgetFilterValue(value) {
  if (!value) {
    return null;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function resolveBudgetAmount(gig) {
  if (!gig) {
    return null;
  }
  if (gig.budgetAmount != null && Number.isFinite(Number(gig.budgetAmount))) {
    return Number(gig.budgetAmount);
  }
  if (typeof gig.budget === 'number') {
    return gig.budget;
  }
  if (gig.budget && typeof gig.budget === 'object') {
    const numeric = gig.budget.amount ?? gig.budget.value ?? null;
    if (Number.isFinite(Number(numeric))) {
      return Number(numeric);
    }
  }
  const sources = [gig.budget, gig.price, gig.pricing, gig.startingPrice];
  const raw = sources.find((entry) => typeof entry === 'string' && entry.trim().length);
  if (!raw) {
    return null;
  }
  const digits = raw.replace(/[^0-9.]/g, '');
  const parsed = Number.parseFloat(digits);
  return Number.isFinite(parsed) ? parsed : null;
}

function resolveDeliverySpeedLabel(gig) {
  const candidates = [gig.deliverySpeed, gig.deliveryTimeline, gig.delivery, gig.turnaround, gig.timeline];
  const label = candidates.find((value) => typeof value === 'string' && value.trim().length);
  if (label) {
    return label.trim();
  }
  if (typeof gig.deliverySpeed === 'number') {
    return `${gig.deliverySpeed} days`;
  }
  return null;
}

function resolveDeliverySpeedCategory(gig) {
  if (!gig) {
    return 'unknown';
  }
  const explicit = gig.deliverySpeedCategory ?? gig.deliverySpeedTier ?? null;
  if (explicit && typeof explicit === 'string') {
    return explicit.trim().toLowerCase();
  }
  const label = (resolveDeliverySpeedLabel(gig) ?? '').toLowerCase();
  if (!label) {
    return 'unknown';
  }
  if (label.includes('hour') || (/\b(1|2|3|24|48|72)\b/.test(label) && label.includes('day'))) {
    return 'express';
  }
  if (label.includes('week') || label.includes('5-day') || label.includes('7-day')) {
    return 'standard';
  }
  if (label.includes('month') || label.includes('retainer') || label.includes('ongoing')) {
    return 'extended';
  }
  return 'standard';
}

function resolveTrustBadges(gig) {
  if (!gig) {
    return [];
  }
  const badges = [];
  if (Array.isArray(gig.trustSignals)) {
    gig.trustSignals.forEach((entry) => {
      if (typeof entry === 'string' && entry.trim().length) {
        badges.push(entry.trim());
      }
    });
  }
  if (Array.isArray(gig.trustBadges)) {
    gig.trustBadges.forEach((entry) => {
      if (typeof entry === 'string' && entry.trim().length) {
        badges.push(entry.trim());
      } else if (entry && typeof entry.label === 'string' && entry.label.trim().length) {
        badges.push(entry.label.trim());
      }
    });
  }

  if (gig.identityVerified || gig.owner?.identityVerified || gig.agency?.verified) {
    badges.push('ID verified');
  }

  const rating = gig.rating ?? gig.reviewScore ?? gig.averageRating ?? gig.ratingAverage ?? null;
  if (Number.isFinite(Number(rating)) && Number(rating) > 0) {
    badges.push(`Rated ${Number(rating).toFixed(1)}/5`);
  }

  const completedOrders = gig.completedOrders ?? gig.ordersCompleted ?? gig.deliveryCount ?? null;
  if (Number.isFinite(Number(completedOrders)) && Number(completedOrders) > 0) {
    badges.push(`${Number(completedOrders)}+ deliveries`);
  }

  if (gig.escrowReady || gig.escrowEnabled) {
    badges.push('Escrow ready');
  }

  const seen = new Set();
  return badges
    .map((badge) => badge.trim())
    .filter((badge) => {
      const key = badge.toLowerCase();
      if (!key || seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
}

function resolveItemKey(item) {
  if (!item) {
    return null;
  }
  return item.id ?? item.slug ?? item.handle ?? null;
}

function mergeOpportunityItems(existing = [], incoming = []) {
  if (!incoming.length) {
    return existing;
  }
  const map = new Map();
  existing.forEach((item) => {
    const key = resolveItemKey(item);
    map.set(key ?? Symbol('fallback'), item);
  });
  incoming.forEach((item) => {
    const key = resolveItemKey(item);
    if (key && map.has(key)) {
      map.set(key, { ...map.get(key), ...item });
    } else {
      map.set(key ?? Symbol('fallback'), item);
    }
  });
  return Array.from(map.values());
}

function computeHasMore(listing, aggregatedCount, pageSize, currentPage) {
  if (!listing) {
    return false;
  }
  if (typeof listing.hasMore === 'boolean') {
    return listing.hasMore;
  }
  if (listing.nextPage != null || listing.meta?.nextPage != null) {
    return true;
  }
  const total = listing.total ?? listing.meta?.total ?? null;
  if (Number.isFinite(Number(total))) {
    return Number(total) > aggregatedCount;
  }
  const totalPages = listing.totalPages ?? listing.pageCount ?? listing.meta?.totalPages ?? null;
  const resolvedPage = listing.page ?? listing.meta?.page ?? currentPage;
  if (Number.isFinite(Number(totalPages)) && Number.isFinite(Number(resolvedPage))) {
    return Number(resolvedPage) < Number(totalPages);
  }
  const latestLength = Array.isArray(listing.items) ? listing.items.length : 0;
  if (currentPage > 1 && latestLength === 0) {
    return false;
  }
  return latestLength >= pageSize;
}

export function formatNumber(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '0';
  }
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Number(value));
}
export default function GigsPage() {
  const [query, setQuery] = useState('');
  const [selectedTagSlugs, setSelectedTagSlugs] = useState([]);
  const [budgetFilter, setBudgetFilter] = useState({ min: '', max: '' });
  const [deliverySpeed, setDeliverySpeed] = useState('any');
  const [trustedOnly, setTrustedOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [resultsState, setResultsState] = useState({ key: '', items: [] });
  const loadMoreRef = useRef(null);
  const navigate = useNavigate();
  const { session, isAuthenticated } = useSession();
  const { items: savedGigs, toggleGig, removeGig, isGigSaved } = useSavedGigs();
  const hasFreelancerAccess = Boolean(session?.memberships?.includes('freelancer'));

  const parsedMinBudget = useMemo(() => parseBudgetFilterValue(budgetFilter.min), [budgetFilter.min]);
  const parsedMaxBudget = useMemo(() => parseBudgetFilterValue(budgetFilter.max), [budgetFilter.max]);

  const activeFilters = useMemo(() => {
    const filters = {};
    if (selectedTagSlugs.length) {
      filters.taxonomySlugs = selectedTagSlugs;
    }
    if (parsedMinBudget != null || parsedMaxBudget != null) {
      filters.budget = {
        min: parsedMinBudget ?? undefined,
        max: parsedMaxBudget ?? undefined,
      };
    }
    if (deliverySpeed !== 'any') {
      filters.deliverySpeed = deliverySpeed;
    }
    if (trustedOnly) {
      filters.trustSignals = { verifiedOnly: true };
    }
    return Object.keys(filters).length ? filters : null;
  }, [selectedTagSlugs, parsedMinBudget, parsedMaxBudget, deliverySpeed, trustedOnly]);

  const {
    data,
    error,
    loading,
    fromCache,
    lastUpdated,
    refresh,
    debouncedQuery,
  } = useOpportunityListing('gigs', query, {
    page,
    pageSize: PAGE_SIZE,
    filters: activeFilters,
    includeFacets: true,
    enabled: isAuthenticated && hasFreelancerAccess,
  });

  const listing = data ?? {};
  const filtersKey = useMemo(() => JSON.stringify(activeFilters ?? {}), [activeFilters]);
  const resultKey = useMemo(() => `${debouncedQuery || ''}::${filtersKey}`, [debouncedQuery, filtersKey]);
  const resolvedPage = listing.page ?? listing.meta?.page ?? page;

  useEffect(() => {
    setResultsState((current) => (current.key === resultKey ? current : { key: resultKey, items: [] }));
    setPage(1);
  }, [resultKey]);

  const incomingItems = useMemo(() => (Array.isArray(listing.items) ? listing.items : null), [listing.items]);

  useEffect(() => {
    if (!incomingItems) {
      return;
    }
    if (resolvedPage !== page) {
      return;
    }
    setResultsState((current) => {
      if (current.key !== resultKey) {
        return current;
      }
      if (page <= 1) {
        return { key: resultKey, items: incomingItems };
      }
      return { key: resultKey, items: mergeOpportunityItems(current.items, incomingItems) };
    });
  }, [incomingItems, page, resolvedPage, resultKey]);

  const aggregatedItems = useMemo(
    () => (resultsState.key === resultKey ? resultsState.items : []),
    [resultsState, resultKey],
  );

  const taxonomyDirectory = useMemo(() => buildTaxonomyDirectory(aggregatedItems), [aggregatedItems]);
  const facetTags = useMemo(
    () => aggregateTaxonomyCounts(aggregatedItems, listing?.facets ?? null, taxonomyDirectory),
    [aggregatedItems, listing?.facets, taxonomyDirectory],
  );
  const topTagOptions = useMemo(() => facetTags.slice(0, 10), [facetTags]);

  const activeTagDetails = useMemo(
    () =>
      selectedTagSlugs.map((slug) => ({
        slug,
        label: resolveTaxonomyLabel(slug, taxonomyDirectory),
      })),
    [selectedTagSlugs, taxonomyDirectory],
  );

  const visibleItems = useMemo(() => {
    if (!aggregatedItems.length) {
      return [];
    }
    return aggregatedItems.filter((gig) => {
      const matchesDelivery = deliverySpeed === 'any' || resolveDeliverySpeedCategory(gig) === deliverySpeed;
      const badges = resolveTrustBadges(gig);
      const matchesTrust = !trustedOnly || badges.length > 0;
      const amount = resolveBudgetAmount(gig);
      const minPass = parsedMinBudget == null || (amount != null && amount >= parsedMinBudget);
      const maxPass = parsedMaxBudget == null || (amount != null && amount <= parsedMaxBudget);
      return matchesDelivery && matchesTrust && minPass && maxPass;
    });
  }, [aggregatedItems, deliverySpeed, parsedMinBudget, parsedMaxBudget, trustedOnly]);

  const derivedSignals = useMemo(() => {
    if (!aggregatedItems.length) {
      return {
        total: 0,
        fresh: 0,
        remoteFriendly: 0,
        withBudgets: 0,
        trusted: 0,
      };
    }

    const now = Date.now();
    const sevenDaysMs = 1000 * 60 * 60 * 24 * 7;
    let fresh = 0;
    let remoteFriendly = 0;
    let withBudgets = 0;
    let trusted = 0;

    aggregatedItems.forEach((gig) => {
      if (gig?.updatedAt) {
        const updated = new Date(gig.updatedAt).getTime();
        if (!Number.isNaN(updated) && now - updated <= sevenDaysMs) {
          fresh += 1;
        }
      }

      const locationLabel = [gig?.location, gig?.workModel, gig?.engagementModel]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (locationLabel.includes('remote') || locationLabel.includes('hybrid')) {
        remoteFriendly += 1;
      }

      if (typeof gig?.budget === 'string' ? gig.budget.trim().length > 0 : Boolean(gig?.budget)) {
        withBudgets += 1;
      }

      if (resolveTrustBadges(gig).length) {
        trusted += 1;
      }
    });

    return {
      total: aggregatedItems.length,
      fresh,
      remoteFriendly,
      withBudgets,
      trusted,
    };
  }, [aggregatedItems]);

  const savedGigPreview = useMemo(() => savedGigs.slice(0, 4), [savedGigs]);
  const filtersActive = useMemo(
    () =>
      Boolean(
        selectedTagSlugs.length ||
          parsedMinBudget != null ||
          parsedMaxBudget != null ||
          deliverySpeed !== 'any' ||
          trustedOnly,
      ),
    [selectedTagSlugs.length, parsedMinBudget, parsedMaxBudget, deliverySpeed, trustedOnly],
  );

  const hasMore = useMemo(
    () => computeHasMore(listing, aggregatedItems.length, PAGE_SIZE, page),
    [listing, aggregatedItems.length, page],
  );
  const isInitialLoading = loading && page === 1 && aggregatedItems.length === 0;
  const isLoadingMore = loading && page > 1;
  const handlePitch = useCallback(
    (gig) => {
      analytics.track(
        'web_gig_pitch_cta',
        {
          id: gig.id,
          title: gig.title,
          query: debouncedQuery || null,
          seoTags: Array.isArray(gig.taxonomySlugs) ? gig.taxonomySlugs : [],
          activeFilters,
        },
        { source: 'web_app' },
      );
    },
    [activeFilters, debouncedQuery],
  );

  const handleToggleTag = useCallback((slug) => {
    if (!slug) {
      return;
    }
    setSelectedTagSlugs((current) => (current.includes(slug) ? current.filter((entry) => entry !== slug) : [...current, slug]));
  }, []);

  const handleClearTags = useCallback(() => {
    setSelectedTagSlugs([]);
  }, []);

  const handleResetFilters = useCallback(() => {
    setSelectedTagSlugs([]);
    setBudgetFilter({ min: '', max: '' });
    setDeliverySpeed('any');
    setTrustedOnly(false);
  }, []);

  const handleSignIn = useCallback(() => {
    analytics.track('web_gig_access_prompt', { state: 'signin_required' }, { source: 'web_app' });
    navigate('/login');
  }, [navigate]);

  const handleRequestAccess = useCallback(() => {
    analytics.track(
      'web_gig_access_prompt',
      { state: 'freelancer_membership_required' },
      { source: 'web_app' },
    );
    navigate('/register');
  }, [navigate]);

  const handleToggleSaved = useCallback(
    (gig) => {
      const result = toggleGig(gig);
      analytics.track(
        result.saved ? 'web_gig_saved' : 'web_gig_unsaved',
        {
          id: gig.id,
          title: gig.title,
          query: debouncedQuery || null,
        },
        { source: 'web_app' },
      );
    },
    [toggleGig, debouncedQuery],
  );

  const handleRemoveSaved = useCallback(
    (id) => {
      removeGig(id);
      analytics.track(
        'web_gig_saved_removed',
        {
          id,
        },
        { source: 'web_app' },
      );
    },
    [removeGig],
  );

  const handleChat = useCallback(
    (gig) => {
      analytics.track(
        'web_gig_chat_cta',
        {
          id: gig.id,
          title: gig.title,
          query: debouncedQuery || null,
        },
        { source: 'web_app' },
      );
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('gigvora:messagingDock', {
            detail: {
              action: 'open',
              origin: 'gigs_marketplace',
              context: {
                gigId: gig.id ?? null,
                gigTitle: gig.title ?? null,
              },
              threadId: gig.conversationId ?? null,
            },
          }),
        );
      }
    },
    [debouncedQuery],
  );

  const handleLoadMore = useCallback(() => {
    if (loading || !hasMore) {
      return;
    }
    setPage((previous) => previous + 1);
  }, [hasMore, loading]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }
    if (!hasMore) {
      return undefined;
    }
    const sentinel = loadMoreRef.current;
    if (!sentinel) {
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            handleLoadMore();
          }
        });
      },
      { rootMargin: '200px' },
    );
    observer.observe(sentinel);
    return () => {
      observer.disconnect();
    };
  }, [handleLoadMore, hasMore]);
  if (!isAuthenticated) {
    return (
      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_rgba(191,219,254,0.35),_transparent_65%)]" aria-hidden="true" />
        <div className="relative mx-auto max-w-5xl px-6">
          <PageHeader
            eyebrow="Gigs"
            title="Unlock curated missions for independents"
            description="Sign in with your freelancer workspace to pitch, shortlist, and coordinate delivery without friction."
          />
          <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
            <h2 className="text-xl font-semibold text-slate-900">Sign in to access the gigs marketplace</h2>
            <p className="mt-2 text-sm text-slate-600">
              Your personalised queue keeps briefs, responses, and delivery workflows synced across web and mobile.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleSignIn}
                className="inline-flex items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark"
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="inline-flex items-center justify-center rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
              >
                Create a freelancer profile
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!hasFreelancerAccess) {
    return (
      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_rgba(191,219,254,0.35),_transparent_65%)]" aria-hidden="true" />
        <div className="relative mx-auto max-w-5xl px-6">
          <PageHeader
            eyebrow="Gigs"
            title="Freelancer workspace required"
            description="Switch to your freelancer membership or request access to collaborate on scoped missions."
          />
          <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr),minmax(0,1fr)]">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
              <h2 className="text-lg font-semibold text-slate-900">You’re almost there</h2>
              <p className="mt-2 text-sm text-slate-600">
                Gigs are limited to verified freelancer workspaces to keep briefs secure and buyer expectations aligned.
              </p>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                <li className="flex gap-3">
                  <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
                  Switch your active membership to <span className="font-semibold">Freelancer</span> to unlock marketplace tools.
                </li>
                <li className="flex gap-3">
                  <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
                  Pitch tracking, compliance workflows, and delivery QA all live here once activated.
                </li>
              </ul>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/settings')}
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                >
                  Manage memberships
                </button>
                <button
                  type="button"
                  onClick={handleRequestAccess}
                  className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark"
                >
                  Request freelancer access
                </button>
              </div>
            </div>
            <div className="rounded-3xl border border-accent/30 bg-accentSoft p-8 shadow-soft">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-accentDark">Why restrict access?</h3>
              <p className="mt-3 text-sm text-accentDark">
                Marketplace briefs include sensitive budgets, delivery milestones, and escalation paths. We verify freelancer workspaces to safeguard both clients and talent.
              </p>
              <ul className="mt-4 space-y-3 text-sm text-accentDark">
                <li>• Two-step identity verification for every freelancer.</li>
                <li>• NDA coverage and escrow-ready payment rails.</li>
                <li>• Automatic sync with the Gigvora mobile app for on-the-go follow-ups.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    );
  }
  return (
    <section className="relative overflow-hidden py-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_rgba(191,219,254,0.35),_transparent_65%)]" aria-hidden="true" />
      <div className="relative mx-auto max-w-5xl px-6">
        <PageHeader
          eyebrow="Gigs"
          title="High-impact collaborations for independents"
          description="Short-term missions from agencies, startups, and companies ready for agile execution."
          meta={
            <DataStatus
              loading={loading}
              fromCache={fromCache}
              lastUpdated={lastUpdated}
              onRefresh={() => refresh({ force: true })}
            />
          }
        />
        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,2fr),minmax(240px,1fr)]">
          <div>
            <div className="mb-6 max-w-xl">
              <label className="sr-only" htmlFor="gig-search">
                Search gigs
              </label>
              <input
                id="gig-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by client, deliverable, or scope"
                className="w-full rounded-full border border-slate-200 bg-white px-5 py-3 text-sm shadow-sm transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </div>
            <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Marketplace filters</p>
                {filtersActive ? (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="text-xs font-semibold text-accent transition hover:text-accentDark"
                  >
                    Reset filters
                  </button>
                ) : null}
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="gig-budget-min">
                    Budget min
                  </label>
                  <input
                    id="gig-budget-min"
                    type="text"
                    inputMode="numeric"
                    value={budgetFilter.min}
                    onChange={(event) => setBudgetFilter((prev) => ({ ...prev, min: sanitiseBudgetInput(event.target.value) }))}
                    placeholder="500"
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 shadow-sm transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="gig-budget-max">
                    Budget max
                  </label>
                  <input
                    id="gig-budget-max"
                    type="text"
                    inputMode="numeric"
                    value={budgetFilter.max}
                    onChange={(event) => setBudgetFilter((prev) => ({ ...prev, max: sanitiseBudgetInput(event.target.value) }))}
                    placeholder="5000"
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 shadow-sm transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="gig-delivery-speed">
                    Delivery speed
                  </label>
                  <select
                    id="gig-delivery-speed"
                    value={deliverySpeed}
                    onChange={(event) => setDeliverySpeed(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  >
                    {DELIVERY_SPEED_OPTIONS.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <label className="mt-4 inline-flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={trustedOnly}
                  onChange={(event) => setTrustedOnly(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent/40"
                />
                Trusted sellers only
              </label>
            </div>
            {activeTagDetails.length ? (
              <div className="mb-6 flex flex-wrap items-center gap-3">
                {activeTagDetails.map((tag) => (
                  <button
                    key={tag.slug}
                    type="button"
                    onClick={() => handleToggleTag(tag.slug)}
                    className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accentSoft px-4 py-2 text-xs font-semibold text-accentDark transition hover:border-accent hover:bg-accent/10"
                  >
                    <span>{tag.label}</span>
                    <span aria-hidden="true">✕</span>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleClearTags}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                >
                  Clear tags
                </button>
              </div>
            ) : null}
            {error ? (
              <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                Unable to load the latest gigs. {error.message || 'Please refresh to pull the newest briefs.'}
              </div>
            ) : null}
            {fromCache && !loading ? (
              <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
                Showing cached results while we refresh live briefs in the background.
              </div>
            ) : null}
            {isInitialLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="animate-pulse rounded-3xl border border-slate-200 bg-white p-6">
                    <div className="h-3 w-1/4 rounded bg-slate-200" />
                    <div className="mt-3 h-4 w-1/2 rounded bg-slate-200" />
                    <div className="mt-2 h-3 w-full rounded bg-slate-200" />
                    <div className="mt-1 h-3 w-3/4 rounded bg-slate-200" />
                  </div>
                ))}
              </div>
            ) : null}
            {!loading && !visibleItems.length ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
                {debouncedQuery || filtersActive
                  ? 'No gigs currently match your filters. Try exploring adjacent skills or timelines.'
                  : 'Freshly vetted gigs will appear here as clients publish briefs.'}
              </div>
            ) : null}
            <div className="space-y-6">
              {visibleItems.map((gig) => {
                const taxonomyLabels = resolveTaxonomyLabels(gig, taxonomyDirectory);
                const trustBadges = resolveTrustBadges(gig);
                const saved = isGigSaved(gig);
                const deliveryLabel = resolveDeliverySpeedLabel(gig);
                return (
                  <article
                    key={gig.id ?? gig.slug ?? gig.title}
                    className="rounded-3xl border border-slate-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-accent/60 hover:shadow-soft"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                      <div className="flex flex-wrap items-center gap-2">
                        {gig.duration ? (
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">
                            {gig.duration}
                          </span>
                        ) : null}
                        {gig.budget ? (
                          <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-600">
                            {gig.budget}
                          </span>
                        ) : null}
                        {deliveryLabel ? (
                          <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 font-semibold text-slate-500">
                            {deliveryLabel}
                          </span>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleSaved(gig)}
                          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 font-semibold transition ${
                            saved
                              ? 'border border-accent bg-accentSoft text-accent'
                              : 'border border-slate-200 bg-white text-slate-600 hover:border-accent hover:text-accent'
                          }`}
                        >
                          {saved ? <BookmarkSlashIcon className="h-4 w-4" /> : <BookmarkIcon className="h-4 w-4" />}
                          {saved ? 'Saved' : 'Save gig'}
                        </button>
                        <span className="text-slate-400">Updated {formatRelativeTime(gig.updatedAt)}</span>
                      </div>
                    </div>
                    <h2 className="mt-3 text-xl font-semibold text-slate-900">{gig.title}</h2>
                    <p className="mt-2 text-sm text-slate-600">{gig.description}</p>
                    {taxonomyLabels.length ? (
                      <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-wide text-indigo-600">
                        {taxonomyLabels.slice(0, 4).map((label) => (
                          <span key={label} className="rounded-full bg-indigo-50 px-3 py-1 text-indigo-600">
                            {label}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    {Array.isArray(gig.skills) && gig.skills.length ? (
                      <div className="mt-4 flex flex-wrap gap-2 text-[11px] uppercase tracking-wide text-slate-400">
                        {gig.skills.slice(0, 6).map((skill) => (
                          <span key={skill} className="rounded-full border border-slate-200 px-3 py-1 text-slate-500">
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    {trustBadges.length ? (
                      <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-wide text-emerald-600">
                        {trustBadges.map((badge) => (
                          <span key={badge} className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-emerald-600">
                            <ShieldCheckIcon className="h-4 w-4" />
                            {badge}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => handlePitch(gig)}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-2 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                      >
                        Pitch this gig <span aria-hidden="true">→</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleChat(gig)}
                        className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accentSoft px-5 py-2 text-xs font-semibold text-accentDark transition hover:border-accent hover:bg-accent/10"
                      >
                        Chat with client
                      </button>
                    </div>
                  </article>
                );
              })}
              <div ref={loadMoreRef} className="h-1 w-full" aria-hidden="true" />
            </div>
            {isLoadingMore ? (
              <div className="mt-6 text-center text-xs text-slate-500">Loading more gigs…</div>
            ) : null}
            {hasMore && !loading ? (
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-2 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                >
                  Load more gigs
                </button>
              </div>
            ) : null}
          </div>
          <aside className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Marketplace signals</p>
              <dl className="mt-4 space-y-4 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-500">Live briefs</dt>
                  <dd className="text-base font-semibold text-slate-900">{formatNumber(derivedSignals.total)}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-500">Published this week</dt>
                  <dd className="text-base font-semibold text-slate-900">{formatNumber(derivedSignals.fresh)}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-500">Remote-friendly</dt>
                  <dd className="text-base font-semibold text-slate-900">{formatNumber(derivedSignals.remoteFriendly)}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-500">Transparent budgets</dt>
                  <dd className="text-base font-semibold text-slate-900">{formatNumber(derivedSignals.withBudgets)}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-500">Trusted sellers</dt>
                  <dd className="text-base font-semibold text-slate-900">{formatNumber(derivedSignals.trusted)}</dd>
                </div>
              </dl>
              <p className="mt-4 text-xs text-slate-500">
                Metrics update as new gigs sync from agencies and founders across the network.
              </p>
            </div>
            {topTagOptions.length ? (
              <div className="rounded-3xl border border-indigo-100 bg-white p-6 shadow-soft">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-indigo-600">SEO discovery tags</h3>
                <p className="mt-2 text-xs text-slate-500">
                  Optimise visibility with taxonomy signals tuned for the Gigvora search index.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {topTagOptions.map((tag) => {
                    const isActive = selectedTagSlugs.includes(tag.slug);
                    return (
                      <button
                        key={tag.slug}
                        type="button"
                        onClick={() => handleToggleTag(tag.slug)}
                        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition ${
                          isActive
                            ? 'bg-accent text-white shadow-soft hover:bg-accentDark'
                            : 'border border-slate-200 bg-slate-50 text-slate-600 hover:border-accent hover:text-accent'
                        }`}
                      >
                        <span>{tag.label}</span>
                        <span className="text-[10px] font-normal uppercase tracking-wide text-slate-400">
                          {formatNumber(tag.count)}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {selectedTagSlugs.length ? (
                  <p className="mt-4 text-xs text-slate-400">
                    Filtering by {selectedTagSlugs.length} {selectedTagSlugs.length === 1 ? 'tag' : 'tags'}.
                  </p>
                ) : null}
              </div>
            ) : null}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Saved gigs</h3>
                <span className="text-xs text-slate-400">{formatNumber(savedGigs.length)}</span>
              </div>
              {savedGigPreview.length ? (
                <ul className="mt-4 space-y-3 text-sm text-slate-600">
                  {savedGigPreview.map((gig) => (
                    <li key={gig.id} className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{gig.title}</p>
                        {gig.budget ? <p className="text-xs text-slate-500">{gig.budget}</p> : null}
                        {gig.deliverySpeed ? <p className="text-xs text-slate-400">{gig.deliverySpeed}</p> : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveSaved(gig.id)}
                        className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-500 transition hover:border-rose-400 hover:text-rose-500"
                      >
                        <BookmarkSlashIcon className="h-4 w-4" />
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-xs text-slate-500">
                  Save gigs to compare scopes, budgets, and delivery expectations before pitching.
                </p>
              )}
            </div>
            <div className="rounded-3xl border border-accent/40 bg-accentSoft p-6 shadow-soft">
              <h3 className="text-sm font-semibold text-accentDark">Best pitch practices</h3>
              <ul className="mt-3 space-y-2 text-xs text-accentDark">
                <li>• Reference similar wins with measurable outcomes.</li>
                <li>• Include timeline assumptions and collaboration cadence.</li>
                <li>• Confirm availability so clients can fast-track approvals.</li>
              </ul>
            </div>
          </aside>
        </div>
        <GigLifecycleShowcase />
      </div>
    </section>
  );
}
