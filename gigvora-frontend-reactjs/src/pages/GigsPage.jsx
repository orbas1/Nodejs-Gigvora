import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookmarkIcon, ChatBubbleLeftRightIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import PageHeader from '../components/PageHeader.jsx';
import DataStatus from '../components/DataStatus.jsx';
import OpportunityFilterPill from '../components/opportunity/OpportunityFilterPill.jsx';
import GigLifecycleShowcase from '../components/gigs/GigLifecycleShowcase.jsx';
import useOpportunityListing from '../hooks/useOpportunityListing.js';
import analytics from '../services/analytics.js';
import { formatRelativeTime } from '../utils/date.js';
import useSession from '../hooks/useSession.js';
import { formatCurrencyRange } from '../utils/currency.js';
import useSavedGigs from '../hooks/useSavedGigs.js';
import { classNames } from '../utils/classNames.js';
import {
  aggregateFacetTags,
  buildTaxonomyDirectory,
  formatTagLabelFromSlug,
} from '../utils/taxonomy.js';

const PAGE_SIZE = 20;
const BUDGET_MIN = 0;
const BUDGET_MAX = 25000;
const BUDGET_STEP = 250;
const DELIVERY_SPEED_OPTIONS = [
  { value: '48h', label: '48 hour turnaround' },
  { value: '7d', label: 'Within 1 week' },
  { value: '14d', label: 'Within 2 weeks' },
  { value: 'flex', label: 'Flexible timeline' },
];
const TRUST_BADGE_STYLES = {
  emerald: 'border border-emerald-200 bg-emerald-50 text-emerald-700',
  sky: 'border border-sky-200 bg-sky-50 text-sky-700',
  indigo: 'border border-indigo-200 bg-indigo-50 text-indigo-700',
  amber: 'border border-amber-200 bg-amber-50 text-amber-700',
  accent: 'border border-accent/40 bg-accentSoft text-accentDark',
  default: 'border border-slate-200 bg-slate-100 text-slate-600',
};

function resolveGigKey(gig, fallbackIndex = 0) {
  if (!gig) {
    return `gig:${fallbackIndex}`;
  }
  if (gig.id != null) {
    return `${gig.id}`;
  }
  if (gig.slug) {
    return `slug:${gig.slug}`;
  }
  if (gig.title) {
    return `title:${gig.title}:${gig.updatedAt ?? fallbackIndex}`;
  }
  return `gig:${fallbackIndex}`;
}

function computeTrustBadges(gig) {
  if (!gig) {
    return [];
  }
  if (Array.isArray(gig.trustBadges) && gig.trustBadges.length) {
    return gig.trustBadges
      .map((badge) => {
        if (!badge) {
          return null;
        }
        if (typeof badge === 'string') {
          return { label: badge, tone: 'accent' };
        }
        if (typeof badge === 'object') {
          return {
            label: badge.label ?? badge.name ?? 'Trusted buyer',
            tone: badge.tone ?? badge.variant ?? 'accent',
          };
        }
        return null;
      })
      .filter(Boolean)
      .slice(0, 3);
  }

  const badges = [];
  if (gig.poster?.verified || gig.poster?.isVerified || gig.poster?.status === 'verified' || gig.verifiedBuyer) {
    badges.push({ label: 'Verified client', tone: 'emerald' });
  }
  if (gig.escrowProtected || gig.paymentProtected || gig.paymentProtection === 'escrow') {
    badges.push({ label: 'Escrow protected', tone: 'sky' });
  }
  if (Array.isArray(gig.reviews) && gig.reviews.length) {
    badges.push({ label: 'Rated by freelancers', tone: 'indigo' });
  }
  if (gig.deliverySla || gig.deliveryWindow) {
    badges.push({ label: `${gig.deliverySla ?? gig.deliveryWindow} SLA`, tone: 'amber' });
  }

  return badges.slice(0, 3);
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
  const [page, setPage] = useState(1);
  const [mergedItems, setMergedItems] = useState([]);
  const [isAppending, setIsAppending] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState(null);
  const loadMoreRef = useRef(null);
  const [budgetEnabled, setBudgetEnabled] = useState(false);
  const [budgetRange, setBudgetRange] = useState([1500, 7500]);
  const [selectedDeliverySpeeds, setSelectedDeliverySpeeds] = useState([]);
  const navigate = useNavigate();
  const { session, isAuthenticated } = useSession();
  const hasFreelancerAccess = Boolean(session?.memberships?.includes('freelancer'));
  const defaultCurrency =
    session?.preferences?.currencyCode ??
    session?.preferences?.currency ??
    session?.workspace?.currency ??
    'USD';

  const searchSignature = useMemo(
    () =>
      JSON.stringify({
        query: (query || '').trim().toLowerCase(),
        tags: [...selectedTagSlugs].sort(),
        budget: budgetEnabled ? budgetRange : null,
        delivery: [...selectedDeliverySpeeds].sort(),
      }),
    [query, selectedTagSlugs, budgetEnabled, budgetRange, selectedDeliverySpeeds],
  );

  useEffect(() => {
    setPage(1);
    setMergedItems([]);
    setIsAppending(false);
    setLoadMoreError(null);
  }, [searchSignature]);

  const activeFilters = useMemo(() => {
    const filters = {};
    if (selectedTagSlugs.length) {
      filters.taxonomySlugs = selectedTagSlugs;
    }
    if (budgetEnabled) {
      filters.budget = {
        min: budgetRange[0],
        max: budgetRange[1],
        currency: defaultCurrency,
      };
    }
    if (selectedDeliverySpeeds.length) {
      filters.deliverySpeeds = selectedDeliverySpeeds;
    }
    return Object.keys(filters).length ? filters : null;
  }, [selectedTagSlugs, budgetEnabled, budgetRange, selectedDeliverySpeeds, defaultCurrency]);

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
  const listingItems = useMemo(
    () => (Array.isArray(listing.items) ? listing.items : []),
    [listing.items],
  );

  useEffect(() => {
    if (!isAuthenticated || !hasFreelancerAccess) {
      setMergedItems([]);
      return;
    }

    if (page === 1) {
      if (!loading) {
        setMergedItems(listingItems);
      }
      return;
    }

    if (!listingItems.length) {
      return;
    }

    setMergedItems((previous) => {
      const merged = Array.isArray(previous) && previous.length ? [...previous] : [];
      const seen = new Map();
      merged.forEach((gig, index) => {
        seen.set(resolveGigKey(gig, index), index);
      });
      listingItems.forEach((gig, index) => {
        const key = resolveGigKey(gig, index);
        if (seen.has(key)) {
          merged.splice(seen.get(key), 1, gig);
        } else {
          seen.set(key, merged.length);
          merged.push(gig);
        }
      });
      return merged;
    });
  }, [listingItems, page, loading, hasFreelancerAccess, isAuthenticated]);

  useEffect(() => {
    if (!isAppending) {
      return;
    }
    if (!loading) {
      if (page > 1 && error) {
        setLoadMoreError(error);
      } else {
        setLoadMoreError(null);
      }
      setIsAppending(false);
    }
  }, [isAppending, loading, error, page]);

  useEffect(() => {
    if (page === 1) {
      setLoadMoreError(null);
    }
  }, [page]);

  const items = mergedItems;
  const tagDirectory = useMemo(() => buildTaxonomyDirectory(items), [items]);
  const facetTags = useMemo(
    () => aggregateFacetTags({ items, facets: listing?.facets ?? null, directory: tagDirectory }),
    [items, listing?.facets, tagDirectory],
  );
  const topTagOptions = useMemo(() => facetTags.slice(0, 10), [facetTags]);
  const activeTagDetails = useMemo(
    () =>
      selectedTagSlugs.map((slug) => {
        const label = tagDirectory.get(`${slug}`.toLowerCase()) ?? formatTagLabelFromSlug(slug);
        return { slug, label };
      }),
    [selectedTagSlugs, tagDirectory],
  );
  const derivedSignals = useMemo(() => {
    if (!items.length) {
      return {
        total: 0,
        fresh: 0,
        remoteFriendly: 0,
        withBudgets: 0,
      };
    }

    const now = Date.now();
    const sevenDaysMs = 1000 * 60 * 60 * 24 * 7;
    let fresh = 0;
    let remoteFriendly = 0;
    let withBudgets = 0;

    items.forEach((gig) => {
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
    });

    return {
      total: items.length,
      fresh,
      remoteFriendly,
      withBudgets,
    };
  }, [items]);

  const paginationMeta = useMemo(() => {
    const currentPage = Number(listing.page ?? page ?? 1);
    const totalPages = Number.isFinite(Number(listing.totalPages)) ? Number(listing.totalPages) : null;
    const total = Number.isFinite(Number(listing.total)) ? Number(listing.total) : null;
    const hasMoreFlag =
      typeof listing.hasMore === 'boolean'
        ? listing.hasMore
        : totalPages != null
        ? currentPage < totalPages
        : total != null
        ? currentPage * PAGE_SIZE < total
        : listing.nextPage != null;
    const nextPage = listing.nextPage != null ? Number(listing.nextPage) : null;
    return {
      currentPage,
      totalPages,
      total,
      hasMore: Boolean(hasMoreFlag),
      nextPage,
    };
  }, [listing, page]);

  const handleLoadMore = useCallback(() => {
    if (!paginationMeta.hasMore || loading || isAppending) {
      return;
    }
    const nextPageCandidate = paginationMeta.nextPage ?? page + 1;
    if (paginationMeta.totalPages && nextPageCandidate > paginationMeta.totalPages) {
      return;
    }
    if (nextPageCandidate === page) {
      return;
    }
    setIsAppending(true);
    setLoadMoreError(null);
    setPage(nextPageCandidate);
  }, [paginationMeta.hasMore, paginationMeta.nextPage, paginationMeta.totalPages, loading, isAppending, page]);

  useEffect(() => {
    if (!loadMoreRef.current) {
      return;
    }
    if (!paginationMeta.hasMore || loading || isAppending) {
      return;
    }
    if (typeof IntersectionObserver === 'undefined') {
      return;
    }
    const node = loadMoreRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
          handleLoadMore();
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [paginationMeta.hasMore, loading, isAppending, handleLoadMore]);

  const { items: savedGigs, toggleGig, clear: clearSavedGigs, isSaved } = useSavedGigs();
  const savedGigCount = savedGigs.length;

  const handleToggleSavedGig = useCallback(
    (gig) => {
      const saved = toggleGig(gig);
      analytics.track(
        saved ? 'web_gig_saved' : 'web_gig_unsaved',
        {
          gigId: gig?.id ?? null,
          title: gig?.title ?? null,
          query: debouncedQuery || null,
          filters: activeFilters,
        },
        { source: 'web_app' },
      );
      return saved;
    },
    [toggleGig, debouncedQuery, activeFilters],
  );

  const handleLoadSavedGig = useCallback(
    (saved) => {
      if (!saved) {
        return;
      }
      if (saved.title) {
        setQuery(saved.title);
      }
      if (Array.isArray(saved.taxonomySlugs) && saved.taxonomySlugs.length) {
        setSelectedTagSlugs(Array.from(new Set(saved.taxonomySlugs)));
      }
      analytics.track(
        'web_gig_saved_applied',
        {
          gigId: saved.id ?? null,
          title: saved.title ?? null,
        },
        { source: 'web_app' },
      );
    },
    [setQuery, setSelectedTagSlugs],
  );

  const handleClearSavedGigs = useCallback(() => {
    if (!savedGigCount) {
      return;
    }
    clearSavedGigs();
    analytics.track('web_gig_saved_cleared', { total: savedGigCount }, { source: 'web_app' });
  }, [clearSavedGigs, savedGigCount]);

  const handleToggleDeliverySpeed = useCallback((value) => {
    setSelectedDeliverySpeeds((current) => {
      if (current.includes(value)) {
        return current.filter((entry) => entry !== value);
      }
      return [...current, value];
    });
  }, []);

  const handleBudgetChange = useCallback((index, rawValue) => {
    const numeric = Number(rawValue);
    if (Number.isNaN(numeric)) {
      return;
    }
    const clamped = Math.min(Math.max(numeric, BUDGET_MIN), BUDGET_MAX);
    setBudgetRange((current) => {
      const next = [...current];
      next[index] = clamped;
      if (index === 0 && clamped > next[1]) {
        next[1] = clamped;
      }
      if (index === 1 && clamped < next[0]) {
        next[0] = clamped;
      }
      return next;
    });
  }, []);

  const budgetRangeLabel = useMemo(
    () =>
      formatCurrencyRange(budgetRange[0], budgetRange[1], defaultCurrency, {
        maximumFractionDigits: 0,
      }),
    [budgetRange, defaultCurrency],
  );

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
    [debouncedQuery, activeFilters],
  );

  const handleChat = useCallback(
    (gig) => {
      analytics.track(
        'web_gig_chat_cta',
        {
          gigId: gig.id,
          title: gig.title,
          buyerId: gig.poster?.id ?? gig.clientId ?? null,
          query: debouncedQuery || null,
          filters: activeFilters,
        },
        { source: 'web_app' },
      );
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('gigvora:messaging:open', {
            detail: {
              surface: 'gigs',
              gigId: gig.id ?? null,
              gigTitle: gig.title ?? null,
              buyerId: gig.poster?.id ?? gig.clientId ?? null,
            },
          }),
        );
      }
    },
    [debouncedQuery, activeFilters],
  );

  const handleToggleTag = (slug) => {
    if (!slug) {
      return;
    }
    setSelectedTagSlugs((current) => {
      if (current.includes(slug)) {
        return current.filter((entry) => entry !== slug);
      }
      return [...current, slug];
    });
  };

  const handleClearTags = () => {
    setSelectedTagSlugs([]);
  };

  const handleSignIn = () => {
    analytics.track('web_gig_access_prompt', { state: 'signin_required' }, { source: 'web_app' });
    navigate('/login');
  };

  const handleRequestAccess = () => {
    analytics.track(
      'web_gig_access_prompt',
      { state: 'freelancer_membership_required' },
      { source: 'web_app' },
    );
    navigate('/register');
  };

  const isInitialLoading = loading && page === 1 && !items.length;
  const showEmptyState = !loading && !items.length;

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
            <div className="mb-6 grid gap-4 lg:grid-cols-[minmax(0,1fr),minmax(0,1fr)]">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900">Budget range</p>
                  <label className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    <input
                      type="checkbox"
                      checked={budgetEnabled}
                      onChange={(event) => setBudgetEnabled(event.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
                    />
                    Filter by budget
                  </label>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Focus on briefs that align with your minimum investment.
                </p>
                <p className="mt-3 text-sm font-semibold text-slate-800">{budgetRangeLabel}</p>
                <div className="mt-4 flex items-center gap-3">
                  <input
                    type="range"
                    min={BUDGET_MIN}
                    max={BUDGET_MAX}
                    step={BUDGET_STEP}
                    value={budgetRange[0]}
                    onChange={(event) => handleBudgetChange(0, event.target.value)}
                    disabled={!budgetEnabled}
                    className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-slate-200 accent-accent disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <input
                    type="range"
                    min={BUDGET_MIN}
                    max={BUDGET_MAX}
                    step={BUDGET_STEP}
                    value={budgetRange[1]}
                    onChange={(event) => handleBudgetChange(1, event.target.value)}
                    disabled={!budgetEnabled}
                    className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-slate-200 accent-accent disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
                <p className="text-sm font-semibold text-slate-900">Delivery speed</p>
                <p className="mt-2 text-xs text-slate-500">Highlight missions that fit your bandwidth.</p>
                <div className="mt-4 space-y-2">
                  {DELIVERY_SPEED_OPTIONS.map((option) => (
                    <label key={option.value} className="flex items-center gap-2 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        checked={selectedDeliverySpeeds.includes(option.value)}
                        onChange={() => handleToggleDeliverySpeed(option.value)}
                        className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </div>
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
            {error && page === 1 ? (
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
            {showEmptyState ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
                {debouncedQuery
                  ? 'No gigs currently match your filters. Try exploring adjacent skills or timelines.'
                  : 'Freshly vetted gigs will appear here as clients publish briefs.'}
              </div>
            ) : null}
            <div className="space-y-6">
              {items.map((gig, index) => {
                const saved = isSaved(gig.id);
                const trustBadges = computeTrustBadges(gig);
                const taxonomyLabels = Array.isArray(gig.taxonomyLabels) ? gig.taxonomyLabels : [];
                const skills = Array.isArray(gig.skills) ? gig.skills : [];
                return (
                  <article
                    key={resolveGigKey(gig, index)}
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
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-slate-400">Updated {formatRelativeTime(gig.updatedAt)}</span>
                        <button
                          type="button"
                          onClick={() => handleToggleSavedGig(gig)}
                          className={classNames(
                            'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide transition',
                            saved
                              ? 'border-accent bg-accent text-white shadow-soft'
                              : 'border-slate-200 bg-white text-slate-500 hover:border-accent hover:text-accent',
                          )}
                          aria-pressed={saved}
                        >
                          <BookmarkIcon className="h-4 w-4" aria-hidden="true" />
                          {saved ? 'Saved' : 'Save gig'}
                        </button>
                      </div>
                    </div>
                    <h2 className="mt-3 text-xl font-semibold text-slate-900">{gig.title}</h2>
                    <p className="mt-2 text-sm text-slate-600">{gig.description}</p>
                    {trustBadges.length ? (
                      <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-wide">
                        {trustBadges.map((badge) => (
                          <span
                            key={`${resolveGigKey(gig, index)}-${badge.label}`}
                            className={classNames(
                              'inline-flex items-center gap-1 rounded-full px-3 py-1',
                              TRUST_BADGE_STYLES[badge.tone] ?? TRUST_BADGE_STYLES.default,
                            )}
                          >
                            <ShieldCheckIcon className="h-3.5 w-3.5" aria-hidden="true" />
                            {badge.label}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    {taxonomyLabels.length ? (
                      <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-wide text-indigo-600">
                        {taxonomyLabels.slice(0, 4).map((label) => (
                          <span key={label} className="rounded-full bg-indigo-50 px-3 py-1 text-indigo-600">
                            {label}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    {skills.length ? (
                      <div className="mt-4 flex flex-wrap gap-2 text-[11px] uppercase tracking-wide text-slate-400">
                        {skills.slice(0, 6).map((skill) => (
                          <span key={skill} className="rounded-full border border-slate-200 px-3 py-1 text-slate-500">
                            {skill}
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
                        <ChatBubbleLeftRightIcon className="h-4 w-4" aria-hidden="true" />
                        Message buyer
                      </button>
                    </div>
                  </article>
                );
              })}
              <div ref={loadMoreRef} aria-hidden="true" className="h-1 w-full" />
              {isAppending ? (
                <div className="space-y-4">
                  {Array.from({ length: 2 }).map((_, index) => (
                    <div key={`loading-${index}`} className="animate-pulse rounded-3xl border border-slate-200 bg-white p-6">
                      <div className="h-3 w-1/4 rounded bg-slate-200" />
                      <div className="mt-3 h-4 w-1/2 rounded bg-slate-200" />
                      <div className="mt-2 h-3 w-full rounded bg-slate-200" />
                      <div className="mt-1 h-3 w-3/4 rounded bg-slate-200" />
                    </div>
                  ))}
                </div>
              ) : null}
              {loadMoreError ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
                  {loadMoreError?.message || 'We could not load more gigs. Try again soon.'}
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    className="ml-3 inline-flex items-center gap-2 rounded-full border border-amber-200 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-amber-700 transition hover:border-amber-300 hover:text-amber-600"
                  >
                    Retry
                  </button>
                </div>
              ) : null}
              {paginationMeta.hasMore ? (
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    className="rounded-full border border-slate-200 px-5 py-2 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                    disabled={loading || isAppending}
                  >
                    {loading || isAppending ? 'Loading more…' : 'Load more gigs'}
                  </button>
                </div>
              ) : items.length ? (
                <p className="text-center text-[0.7rem] font-semibold uppercase tracking-wide text-slate-400">
                  You’re all caught up.
                </p>
              ) : null}
            </div>
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
                      <OpportunityFilterPill
                        key={tag.slug}
                        active={isActive}
                        label={tag.label}
                        badge={formatNumber(tag.count)}
                        onClick={() => handleToggleTag(tag.slug)}
                        tone="accent"
                      />
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
            {savedGigCount ? (
              <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-soft">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-600">Saved gigs</h3>
                <p className="mt-2 text-xs text-slate-500">Pick up shortlisted missions in a single click.</p>
                <ul className="mt-4 space-y-3">
                  {savedGigs.slice(0, 5).map((saved) => (
                    <li key={saved.id} className="rounded-2xl border border-slate-200 px-4 py-3">
                      <p className="text-sm font-semibold text-slate-800">{saved.title}</p>
                      {saved.clientName ? <p className="text-xs text-slate-500">{saved.clientName}</p> : null}
                      <button
                        type="button"
                        onClick={() => handleLoadSavedGig(saved)}
                        className="mt-2 inline-flex items-center gap-2 rounded-full border border-emerald-200 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-emerald-600 transition hover:border-emerald-300 hover:text-emerald-700"
                      >
                        Load filters
                      </button>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={handleClearSavedGigs}
                  className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 px-4 py-2 text-xs font-semibold text-emerald-600 transition hover:border-emerald-300 hover:text-emerald-700"
                >
                  Clear saved gigs
                </button>
              </div>
            ) : (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Saved gigs</h3>
                <p className="mt-2 text-xs text-slate-500">
                  Tap the save button on any brief to build a shortlist for weekly review.
                </p>
              </div>
            )}
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
