import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import DataStatus from '../components/DataStatus.jsx';
import OpportunityFilterPill from '../components/opportunity/OpportunityFilterPill.jsx';
import GigLifecycleShowcase from '../components/gigs/GigLifecycleShowcase.jsx';
import useOpportunityListing from '../hooks/useOpportunityListing.js';
import analytics from '../services/analytics.js';
import { formatRelativeTime } from '../utils/date.js';
import useSession from '../hooks/useSession.js';
import useSitePage from '../hooks/useSitePage.js';
import useSavedSearches from '../hooks/useSavedSearches.js';
import SavedSearchList from '../components/explorer/SavedSearchList.jsx';
import { formatInteger } from '../utils/number.js';
import useSavedGigs from '../hooks/useSavedGigs.js';
import { formatTaxonomyLabelFromSlug, buildTaxonomyDirectoryFromItems } from '../utils/taxonomy.js';
import { MESSAGING_DOCK_OPEN_EVENT } from '../constants/events.js';
import { classNames } from '../utils/classNames.js';

export { formatTaxonomyLabelFromSlug as formatTagLabelFromSlug };
export { formatInteger as formatNumber };

const FALLBACK_GIGS_PAGE_CONTENT = {
  hero: {
    eyebrow: 'Gigs',
    title: 'High-impact collaborations for independents',
    description: 'Short-term missions from agencies, startups, and companies ready for agile execution.',
  },
  metrics: {
    caption: 'Metrics update as new gigs sync from agencies and founders across the network.',
  },
  pitchGuidance: {
    title: 'Best pitch practices',
    description: 'Differentiate your proposal with data-rich delivery evidence and proactive communication.',
    items: [
      'Reference similar wins with measurable outcomes.',
      'Include timeline assumptions and collaboration cadence.',
      'Confirm availability so clients can fast-track approvals.',
    ],
  },
};

const BUDGET_MIN_VALUE = 0;
const BUDGET_MAX_VALUE = 20000;
const BUDGET_STEP = 100;

const INITIAL_FILTER_STATE = Object.freeze({
  durationCategory: [],
  budgetValueMin: null,
  budgetValueMax: null,
});

const DELIVERY_SPEED_OPTIONS = [
  {
    id: 'short_term',
    label: 'Fast (1-2 weeks)',
    description: 'Perfect for sprints, audits, and rapid experimentation.',
  },
  {
    id: 'medium_term',
    label: 'Standard (3-6 weeks)',
    description: 'Ideal for multi-phase launches with measurable outcomes.',
  },
  {
    id: 'long_term',
    label: 'Extended (Quarter+)',
    description: 'Designed for retainers and strategic delivery programmes.',
  },
];

const TRUST_BADGE_RULES = [
  {
    id: 'verified-buyer',
    predicate: (gig) => Number(gig?.aiSignals?.reputation ?? gig?.aiSignals?.trustScore ?? 0) >= 0.6,
    label: 'Buyer verified',
    tone: 'emerald',
  },
  {
    id: 'fresh-brief',
    predicate: (gig) => Number(gig?.aiSignals?.freshness ?? 0) >= 0.6,
    label: 'Recently vetted',
    tone: 'sky',
  },
  {
    id: 'skill-match',
    predicate: (gig) => Number(gig?.aiSignals?.taxonomy ?? 0) >= 0.6,
    label: 'Strong skill match',
    tone: 'indigo',
  },
  {
    id: 'remote-ready',
    predicate: (gig) => Boolean(gig?.isRemote),
    label: 'Remote-friendly',
    tone: 'purple',
  },
];

function getTrustBadgeClasses(tone = 'slate') {
  switch (tone) {
    case 'emerald':
      return 'inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700';
    case 'sky':
      return 'inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700';
    case 'indigo':
      return 'inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700';
    case 'purple':
      return 'inline-flex items-center rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700';
    default:
      return 'inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600';
  }
}

function resolveTrustBadges(gig) {
  if (!gig) {
    return [];
  }
  const badges = TRUST_BADGE_RULES.filter((rule) => {
    try {
      return rule.predicate(gig);
    } catch (error) {
      return false;
    }
  });
  return badges.slice(0, 3);
}

function deriveGigFilterState(filters = {}) {
  const nextState = { ...INITIAL_FILTER_STATE };
  const toNumber = (value) => {
    if (value == null || value === '') {
      return null;
    }
    const numeric = Number.parseFloat(`${value}`.replace(/[^0-9.]/g, ''));
    if (!Number.isFinite(numeric)) {
      return null;
    }
    return Math.round(numeric);
  };

  const durations = filters.durationCategory ?? filters.durationCategories ?? filters.deliverySpeed ?? filters.deliverySpeeds;
  const durationList = Array.isArray(durations)
    ? durations
    : durations != null
      ? [`${durations}`]
      : [];
  nextState.durationCategory = durationList
    .map((value) => `${value}`.trim())
    .filter((value, index, array) => value.length && array.indexOf(value) === index);

  const minCandidate = filters.budgetValueMin ?? filters.budgetMin;
  const maxCandidate = filters.budgetValueMax ?? filters.budgetMax;
  const minValue = toNumber(minCandidate);
  const maxValue = toNumber(maxCandidate);
  nextState.budgetValueMin =
    minValue != null ? Math.min(Math.max(minValue, BUDGET_MIN_VALUE), BUDGET_MAX_VALUE) : null;
  nextState.budgetValueMax =
    maxValue != null ? Math.min(Math.max(maxValue, BUDGET_MIN_VALUE), BUDGET_MAX_VALUE) : null;

  const resolvedMin = nextState.budgetValueMin ?? BUDGET_MIN_VALUE;
  const resolvedMax = nextState.budgetValueMax ?? BUDGET_MAX_VALUE;
  const clampedMin = Math.min(resolvedMin, resolvedMax);
  const clampedMax = Math.max(resolvedMin, resolvedMax);

  return {
    filterState: {
      ...nextState,
      budgetValueMin: clampedMin === BUDGET_MIN_VALUE ? null : clampedMin,
      budgetValueMax: clampedMax === BUDGET_MAX_VALUE ? null : clampedMax,
    },
    budgetRange: [clampedMin, clampedMax],
  };
}

function findFirstDefined(...candidates) {
  return candidates.find((candidate) => candidate !== undefined && candidate !== null) ?? null;
}

function findPageBlock(page, keys) {
  if (!page) {
    return null;
  }
  const keyList = (Array.isArray(keys) ? keys : [keys]).map((key) => `${key}`.toLowerCase());
  const collections = ['blocks', 'sections', 'contentBlocks', 'cards'];
  for (const collectionKey of collections) {
    const collection = page?.[collectionKey];
    if (!Array.isArray(collection)) {
      continue;
    }
    const match = collection.find((entry) => {
      if (!entry || typeof entry !== 'object') {
        return false;
      }
      const descriptors = [entry.key, entry.id, entry.slug, entry.sectionId, entry.type, entry.name, entry.handle]
        .filter(Boolean)
        .map((descriptor) => `${descriptor}`.toLowerCase());
      return descriptors.some((descriptor) => keyList.includes(descriptor));
    });
    if (match) {
      return match;
    }
  }
  return null;
}

function extractPitchItems(source) {
  if (!source) {
    return [];
  }
  const possibleLists = [
    Array.isArray(source) ? source : null,
    Array.isArray(source?.items) ? source.items : null,
    Array.isArray(source?.tips) ? source.tips : null,
    Array.isArray(source?.bullets) ? source.bullets : null,
    Array.isArray(source?.points) ? source.points : null,
    Array.isArray(source?.value) ? source.value : null,
  ].filter(Boolean);

  const entries = possibleLists.length ? possibleLists.flat() : [];
  const resolved = entries
    .map((entry) => {
      if (!entry) {
        return null;
      }
      if (typeof entry === 'string') {
        const trimmed = entry.trim();
        return trimmed.length ? trimmed : null;
      }
      if (typeof entry === 'object') {
        const text = findFirstDefined(
          entry.description,
          entry.text,
          entry.body,
          entry.content,
          entry.label,
          entry.title,
        );
        if (typeof text === 'string') {
          const trimmed = text.trim();
          return trimmed.length ? trimmed : null;
        }
      }
      return null;
    })
    .filter(Boolean);

  if (!resolved.length) {
    return [];
  }

  return Array.from(new Set(resolved));
}

function resolveGigPageContent(page) {
  const heroSource = findFirstDefined(
    page?.hero,
    page?.content?.hero,
    page?.settings?.hero,
    findPageBlock(page, ['gigs-hero', 'gig-hero', 'hero']),
  );
  const heroFallbackSource = heroSource ?? {
    eyebrow: page?.heroEyebrow ?? page?.heroMeta ?? page?.summary ?? null,
    title: page?.heroTitle ?? page?.title ?? null,
    description: page?.heroSubtitle ?? page?.summary ?? null,
  };
  const hero = {
    eyebrow:
      typeof heroFallbackSource?.eyebrow === 'string' && heroFallbackSource.eyebrow.trim().length
        ? heroFallbackSource.eyebrow.trim()
        : FALLBACK_GIGS_PAGE_CONTENT.hero.eyebrow,
    title:
      typeof heroFallbackSource?.title === 'string' && heroFallbackSource.title.trim().length
        ? heroFallbackSource.title.trim()
        : typeof heroSource?.heading === 'string' && heroSource.heading.trim().length
        ? heroSource.heading.trim()
        : FALLBACK_GIGS_PAGE_CONTENT.hero.title,
    description:
      typeof heroFallbackSource?.description === 'string' && heroFallbackSource.description.trim().length
        ? heroFallbackSource.description.trim()
        : typeof heroSource?.description === 'string' && heroSource.description.trim().length
        ? heroSource.description.trim()
        : typeof heroSource?.subtitle === 'string' && heroSource.subtitle.trim().length
        ? heroSource.subtitle.trim()
        : FALLBACK_GIGS_PAGE_CONTENT.hero.description,
  };

  const metricsSource = findFirstDefined(
    page?.metrics,
    page?.content?.metrics,
    page?.settings?.metrics,
    findPageBlock(page, ['gig-metrics', 'marketplace-metrics']),
  );
  const metricsCaptionCandidate = findFirstDefined(
    metricsSource?.caption,
    metricsSource?.description,
    page?.metricsCaption,
    page?.content?.metricsCaption,
    page?.meta?.metricsCaption,
    page?.heroMeta,
    page?.summary,
  );
  const metricsCaption =
    typeof metricsCaptionCandidate === 'string' && metricsCaptionCandidate.trim().length
      ? metricsCaptionCandidate.trim()
      : FALLBACK_GIGS_PAGE_CONTENT.metrics.caption;

  const pitchSource = findFirstDefined(
    page?.pitchGuidance,
    page?.content?.pitchGuidance,
    page?.settings?.pitchGuidance,
    findPageBlock(page, ['pitch-guidance', 'pitchGuidance', 'pitch-tips', 'bestPitchPractices']),
    Array.isArray(page?.featureHighlights) && page.featureHighlights.length
      ? { items: page.featureHighlights }
      : null,
    page?.body ? { description: page.body } : null,
  );

  const pitchTitleCandidate = findFirstDefined(
    pitchSource?.title,
    pitchSource?.heading,
    pitchSource?.name,
    page?.ctaLabel,
    page?.title,
  );
  const pitchDescriptionCandidate = findFirstDefined(
    pitchSource?.description,
    pitchSource?.subtitle,
    pitchSource?.summary,
    page?.heroMeta,
    page?.summary,
  );

  const pitchItems = extractPitchItems(pitchSource);

  return {
    hero,
    metrics: {
      caption: metricsCaption,
    },
    pitchGuidance: {
      title:
        typeof pitchTitleCandidate === 'string' && pitchTitleCandidate.trim().length
          ? pitchTitleCandidate.trim()
          : FALLBACK_GIGS_PAGE_CONTENT.pitchGuidance.title,
      description:
        typeof pitchDescriptionCandidate === 'string' && pitchDescriptionCandidate.trim().length
          ? pitchDescriptionCandidate.trim()
          : FALLBACK_GIGS_PAGE_CONTENT.pitchGuidance.description,
      items: pitchItems.length ? pitchItems : FALLBACK_GIGS_PAGE_CONTENT.pitchGuidance.items,
    },
  };
}

function normaliseGigSavedSearchFilters(filters) {
  if (!filters) {
    return [];
  }
  if (Array.isArray(filters)) {
    return filters.filter((entry) => typeof entry === 'string' && entry.trim().length);
  }
  const taxonomy = filters.taxonomySlugs ?? filters['taxonomy-slugs'] ?? null;
  if (Array.isArray(taxonomy)) {
    return taxonomy.filter((entry) => typeof entry === 'string' && entry.trim().length);
  }
  if (taxonomy && typeof taxonomy === 'object') {
    const maybeIn = taxonomy.$in ?? taxonomy.in ?? taxonomy.values ?? null;
    if (Array.isArray(maybeIn)) {
      return maybeIn.filter((entry) => typeof entry === 'string' && entry.trim().length);
    }
  }
  return [];
}

export default function GigsPage() {
  const [query, setQuery] = useState('');
  const [selectedTagSlugs, setSelectedTagSlugs] = useState([]);
  const [savedSearchName, setSavedSearchName] = useState('');
  const [activeSavedSearchId, setActiveSavedSearchId] = useState(null);
  const [filterState, setFilterState] = useState(() => ({ ...INITIAL_FILTER_STATE }));
  const [budgetRange, setBudgetRange] = useState([BUDGET_MIN_VALUE, BUDGET_MAX_VALUE]);
  const [page, setPage] = useState(1);
  const [accumulatedItems, setAccumulatedItems] = useState([]);
  const filterSignatureRef = useRef('');
  const navigate = useNavigate();
  const { session, isAuthenticated } = useSession();
  const { items: savedGigs, toggleGig: toggleSavedGig, removeGig, isSaved: isGigSaved } = useSavedGigs();
  const {
    page: gigSitePage,
    loading: gigSiteLoading,
    error: gigSiteError,
    usingFallback: gigSiteUsingFallback,
  } = useSitePage('gigs-marketplace', { fallback: FALLBACK_GIGS_PAGE_CONTENT });
  const gigContent = useMemo(() => resolveGigPageContent(gigSitePage), [gigSitePage]);
  const hasFreelancerAccess = Boolean(session?.memberships?.includes('freelancer'));
  const activeFilters = useMemo(() => {
    const payload = {};
    if (selectedTagSlugs.length) {
      payload.taxonomySlugs = selectedTagSlugs;
    }
    if (filterState.durationCategory.length) {
      payload.durationCategory = filterState.durationCategory;
    }
    if (filterState.budgetValueMin != null) {
      payload.budgetValueMin = filterState.budgetValueMin;
    }
    if (filterState.budgetValueMax != null) {
      payload.budgetValueMax = filterState.budgetValueMax;
    }
    return Object.keys(payload).length ? payload : null;
  }, [selectedTagSlugs, filterState]);
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
    pageSize: 25,
    filters: activeFilters,
    includeFacets: true,
    enabled: isAuthenticated && hasFreelancerAccess,
  });

  const {
    items: savedSearches,
    loading: savedSearchesLoading,
    error: savedSearchesError,
    canUseServer: canSyncSavedSearches,
    createSavedSearch,
    deleteSavedSearch,
    runSavedSearch,
  } = useSavedSearches({ enabled: isAuthenticated && hasFreelancerAccess });

  const listing = data ?? {};
  useEffect(() => {
    const signature = JSON.stringify({
      query: debouncedQuery || '',
      tags: [...selectedTagSlugs].sort(),
      durations: [...filterState.durationCategory].sort(),
      budgetMin: filterState.budgetValueMin ?? null,
      budgetMax: filterState.budgetValueMax ?? null,
    });
    if (filterSignatureRef.current !== signature) {
      filterSignatureRef.current = signature;
      setPage(1);
      setAccumulatedItems([]);
    }
  }, [debouncedQuery, selectedTagSlugs, filterState]);

  useEffect(() => {
    if (!data) {
      return;
    }
    const listingItems = Array.isArray(data.items) ? data.items : [];
    setAccumulatedItems((previous) => {
      const currentPage = data.page ?? 1;
      if (currentPage <= 1) {
        return listingItems;
      }
      const merged = new Map(previous.map((item) => [item.id, item]));
      listingItems.forEach((item) => {
        if (item?.id != null) {
          merged.set(item.id, item);
        }
      });
      return Array.from(merged.values());
    });
  }, [data]);

  const visibleItems = useMemo(
    () => (Array.isArray(accumulatedItems) ? accumulatedItems : []),
    [accumulatedItems],
  );
  const tagDirectory = useMemo(() => buildTaxonomyDirectoryFromItems(visibleItems), [visibleItems]);

  useEffect(() => {
    setFilterState((previous) => {
      const [minValue, maxValue] = budgetRange;
      const nextMin = minValue > BUDGET_MIN_VALUE ? minValue : null;
      const nextMax = maxValue < BUDGET_MAX_VALUE ? maxValue : null;
      if (previous.budgetValueMin === nextMin && previous.budgetValueMax === nextMax) {
        return previous;
      }
      return { ...previous, budgetValueMin: nextMin, budgetValueMax: nextMax };
    });
  }, [budgetRange]);

  const facetTags = useMemo(() => {
    const tagMap = new Map();

    const registerTag = (slug, label, increment = 1) => {
      if (!slug) {
        return;
      }
      const key = `${slug}`.toLowerCase();
      const current = tagMap.get(key);
      const resolvedLabel =
        (label && label.trim().length ? label : null) || current?.label || tagDirectory.get(key) || formatTagLabelFromSlug(slug);
      const currentCount = current?.count ?? 0;
      tagMap.set(key, {
        slug,
        label: resolvedLabel,
        count: currentCount + increment,
      });
    };

    if (listing?.facets && typeof listing.facets === 'object' && listing.facets !== null) {
      const taxonomyFacet = listing.facets.taxonomySlugs;
      if (taxonomyFacet && typeof taxonomyFacet === 'object') {
        Object.entries(taxonomyFacet).forEach(([slug, rawCount]) => {
          const count = Number(rawCount);
          if (!slug || Number.isNaN(count)) {
            return;
          }
          registerTag(slug, tagDirectory.get(`${slug}`.toLowerCase()) ?? null, Math.max(count, 1));
        });
      }
    }

    visibleItems.forEach((gig) => {
      if (Array.isArray(gig.taxonomies) && gig.taxonomies.length) {
        gig.taxonomies.forEach((taxonomy) => {
          if (!taxonomy?.slug) {
            return;
          }
          registerTag(taxonomy.slug, taxonomy.label ?? null, 1);
        });
      } else if (Array.isArray(gig.taxonomySlugs)) {
        gig.taxonomySlugs.forEach((slug, index) => {
          if (!slug) {
            return;
          }
          const labelCandidate = Array.isArray(gig.taxonomyLabels) ? gig.taxonomyLabels[index] : null;
          registerTag(slug, labelCandidate ?? null, 1);
        });
      }
    });

    return Array.from(tagMap.values())
      .filter((entry) => entry.label && entry.label.trim().length)
      .sort((a, b) => {
        if (b.count !== a.count) {
          return b.count - a.count;
        }
        return a.label.localeCompare(b.label);
      });
  }, [visibleItems, listing?.facets, tagDirectory]);

  const topTagOptions = useMemo(() => facetTags.slice(0, 10), [facetTags]);
  const activeTagDetails = useMemo(
    () =>
      selectedTagSlugs.map((slug) => {
        const label = tagDirectory.get(`${slug}`.toLowerCase()) ?? formatTaxonomyLabelFromSlug(slug);
        return { slug, label };
      }),
    [selectedTagSlugs, tagDirectory],
  );

  const derivedSignals = useMemo(() => {
    if (!visibleItems.length) {
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

    visibleItems.forEach((gig) => {
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
      total: visibleItems.length,
      fresh,
      remoteFriendly,
      withBudgets,
    };
  }, [visibleItems]);

  const handlePitch = (gig) => {
    analytics.track(
      'web_gig_pitch_cta',
      {
        id: gig.id,
        title: gig.title,
        query: debouncedQuery || null,
        seoTags: Array.isArray(gig.taxonomySlugs) ? gig.taxonomySlugs : [],
        filters: currentFiltersPayload,
      },
      { source: 'web_app' },
    );
  };

  const handleToggleTag = useCallback(
    (slug) => {
      if (!slug) {
        return;
      }
      setActiveSavedSearchId(null);
      setSelectedTagSlugs((current) => {
        if (current.includes(slug)) {
          return current.filter((entry) => entry !== slug);
        }
        return [...current, slug];
      });
    },
    [],
  );

  const handleClearTags = useCallback(() => {
    setActiveSavedSearchId(null);
    setSelectedTagSlugs([]);
  }, []);

  const handleSearchInputChange = useCallback((event) => {
    setActiveSavedSearchId(null);
    setQuery(event.target.value);
  }, []);

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

  const handleToggleDeliverySpeed = useCallback((id) => {
    if (!id) {
      return;
    }
    setActiveSavedSearchId(null);
    setFilterState((current) => {
      const exists = current.durationCategory.includes(id);
      const nextDurations = exists
        ? current.durationCategory.filter((value) => value !== id)
        : [...current.durationCategory, id];
      return { ...current, durationCategory: nextDurations };
    });
  }, []);

  const handleBudgetRangeChange = useCallback((index, value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return;
    }
    setActiveSavedSearchId(null);
    setBudgetRange((current) => {
      if (index === 0) {
        const nextMin = Math.max(BUDGET_MIN_VALUE, Math.min(Math.round(numeric), current[1]));
        return [nextMin, current[1]];
      }
      const nextMax = Math.min(BUDGET_MAX_VALUE, Math.max(Math.round(numeric), current[0]));
      return [current[0], nextMax];
    });
  }, []);

  const handleResetMarketplaceFilters = useCallback(() => {
    setActiveSavedSearchId(null);
    setFilterState(() => ({ ...INITIAL_FILTER_STATE }));
    setBudgetRange([BUDGET_MIN_VALUE, BUDGET_MAX_VALUE]);
  }, []);

  const handleResetFilters = useCallback(() => {
    setSelectedTagSlugs([]);
    handleResetMarketplaceFilters();
  }, [handleResetMarketplaceFilters]);

  const currentFiltersPayload = useMemo(() => {
    if (!activeFilters) {
      return {};
    }
    const payload = {};
    if (Array.isArray(activeFilters.taxonomySlugs) && activeFilters.taxonomySlugs.length) {
      payload.taxonomySlugs = [...activeFilters.taxonomySlugs];
    }
    if (Array.isArray(activeFilters.durationCategory) && activeFilters.durationCategory.length) {
      payload.durationCategory = [...activeFilters.durationCategory];
    }
    if (activeFilters.budgetValueMin != null) {
      payload.budgetValueMin = activeFilters.budgetValueMin;
    }
    if (activeFilters.budgetValueMax != null) {
      payload.budgetValueMax = activeFilters.budgetValueMax;
    }
    return payload;
  }, [activeFilters]);

  const hasBudgetFilter = filterState.budgetValueMin != null || filterState.budgetValueMax != null;
  const appliedFilterCount = useMemo(() => {
    let count = selectedTagSlugs.length + filterState.durationCategory.length;
    if (hasBudgetFilter) {
      count += 1;
    }
    return count;
  }, [selectedTagSlugs, filterState.durationCategory, hasBudgetFilter]);

  const handleSaveCurrentSearch = useCallback(
    async (event) => {
      event.preventDefault();
      const trimmedName = savedSearchName.trim();
      const trimmedQuery = query.trim();
      const payload = {
        name: trimmedName || (trimmedQuery ? `Gigs • ${trimmedQuery}` : 'Gigs saved search'),
        category: 'gig',
        query: trimmedQuery || '',
        filters: currentFiltersPayload,
        notifyInApp: true,
      };

      try {
        const created = await createSavedSearch(payload);
        analytics.track(
          'web_gig_saved_search_created',
          {
            savedSearchId: created?.id ?? null,
            query: payload.query || null,
            filters: payload.filters,
          },
          { source: 'web_app' },
        );
        setActiveSavedSearchId(created?.id ?? null);
        setSavedSearchName('');
      } catch (saveError) {
        console.error('Unable to create gig saved search', saveError);
      }
    },
    [savedSearchName, query, currentFiltersPayload, createSavedSearch],
  );

  const handleApplySavedSearch = useCallback(
    (search) => {
      if (!search) {
        return;
      }
      const resolvedSlugs = normaliseGigSavedSearchFilters(search.filters ?? {});
      setSelectedTagSlugs(resolvedSlugs);
      setQuery(search.query ?? '');
      setActiveSavedSearchId(search.id ?? null);
      const savedFilterState = deriveGigFilterState(search.filters ?? {});
      setFilterState(() => ({ ...savedFilterState.filterState }));
      setBudgetRange(savedFilterState.budgetRange);
      analytics.track(
        'web_gig_saved_search_applied',
        {
          savedSearchId: search.id ?? null,
          query: search.query ?? null,
          filters: search.filters ?? null,
        },
        { source: 'web_app' },
      );
      runSavedSearch(search).catch((runError) => {
        console.warn('Failed to trigger gig saved search', runError);
      });
    },
    [runSavedSearch],
  );

  const handleDeleteSavedSearch = useCallback(
    async (search) => {
      if (!search) {
        return;
      }
      try {
        await deleteSavedSearch(search);
        analytics.track(
          'web_gig_saved_search_deleted',
          {
            savedSearchId: search.id ?? null,
          },
          { source: 'web_app' },
        );
        setActiveSavedSearchId((current) => (current === search.id ? null : current));
      } catch (deleteError) {
        console.error('Unable to delete gig saved search', deleteError);
      }
    },
    [deleteSavedSearch],
  );

  const handleToggleSaveGig = useCallback(
    (gig) => {
      if (!gig) {
        return;
      }
      const saved = toggleSavedGig(gig);
      analytics.track(
        saved ? 'web_gig_saved' : 'web_gig_unsaved',
        {
          gigId: gig.id,
          title: gig.title,
          query: debouncedQuery || null,
          filters: currentFiltersPayload,
        },
        { source: 'web_app' },
      );
    },
    [toggleSavedGig, debouncedQuery, currentFiltersPayload],
  );

  const handleChat = useCallback(
    (gig) => {
      if (!gig) {
        return;
      }
      analytics.track(
        'web_gig_chat_cta',
        {
          id: gig.id,
          title: gig.title,
          query: debouncedQuery || null,
          filters: currentFiltersPayload,
        },
        { source: 'web_app' },
      );
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent(MESSAGING_DOCK_OPEN_EVENT, {
            detail: {
              source: 'gigs-marketplace',
              category: 'gig',
              gigId: gig.id,
              gigTitle: gig.title,
            },
          }),
        );
      }
    },
    [debouncedQuery, currentFiltersPayload],
  );

  const handleRemoveSavedGig = useCallback(
    (gigId) => {
      removeGig(gigId);
      analytics.track(
        'web_gig_saved_removed',
        {
          gigId,
        },
        { source: 'web_app' },
      );
    },
    [removeGig],
  );

  const totalPages = listing?.totalPages ?? null;
  const totalResults = listing?.total ?? null;
  const hasMorePages = totalPages != null ? page < totalPages : false;
  const isFetchingMore = page > 1 && loading;

  const handleLoadMore = useCallback(() => {
    if (loading || !hasMorePages) {
      return;
    }
    setPage((current) => current + 1);
  }, [loading, hasMorePages]);

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
          eyebrow={gigContent.hero.eyebrow}
          title={gigContent.hero.title}
          description={gigContent.hero.description}
          meta={
            <DataStatus
              loading={loading || gigSiteLoading}
              fromCache={fromCache}
              lastUpdated={lastUpdated}
              onRefresh={() => refresh({ force: true })}
              error={gigSiteError}
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
                onChange={handleSearchInputChange}
                placeholder="Search by client, deliverable, or scope"
                className="w-full rounded-full border border-slate-200 bg-white px-5 py-3 text-sm shadow-sm transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </div>
            <div className="mb-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span>
                {appliedFilterCount
                  ? `${appliedFilterCount} ${appliedFilterCount === 1 ? 'filter active' : 'filters active'}`
                  : 'Tune filters to surface briefs tailored to your portfolio.'}
              </span>
              {appliedFilterCount ? (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-1.5 font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                >
                  Clear filters
                </button>
              ) : null}
            </div>
            <div className="mb-4 text-xs text-slate-500">
              Showing {formatInteger(visibleItems.length)} of{' '}
              {totalResults != null ? formatInteger(totalResults) : formatInteger(visibleItems.length)} live gigs.
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
            {loading && !visibleItems.length ? (
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
                {debouncedQuery
                  ? 'No gigs currently match your filters. Try exploring adjacent skills or timelines.'
                  : 'Freshly vetted gigs will appear here as clients publish briefs.'}
              </div>
            ) : null}
            <div className="space-y-6">
              {visibleItems.map((gig) => {
                const trustBadges = resolveTrustBadges(gig);
                const saved = isGigSaved(gig.id);
                return (
                  <article
                    key={gig.id}
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
                    <span className="text-slate-400">Updated {formatRelativeTime(gig.updatedAt)}</span>
                  </div>
                  <h2 className="mt-3 text-xl font-semibold text-slate-900">{gig.title}</h2>
                  <p className="mt-2 text-sm text-slate-600">{gig.description}</p>
                  {Array.isArray(gig.taxonomyLabels) && gig.taxonomyLabels.length ? (
                    <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-wide text-indigo-600">
                      {gig.taxonomyLabels.slice(0, 4).map((label) => (
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
                    <div className="mt-4 flex flex-wrap gap-2">
                      {trustBadges.map((badge) => (
                        <span key={badge.id} className={getTrustBadgeClasses(badge.tone)}>
                          {badge.label}
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
                      onClick={() => handleToggleSaveGig(gig)}
                      aria-pressed={saved}
                      className={classNames(
                        'inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs font-semibold transition',
                        saved
                          ? 'bg-emerald-500 text-white shadow-soft hover:bg-emerald-600'
                          : 'border border-slate-200 text-slate-600 hover:border-accent hover:text-accent',
                      )}
                    >
                      {saved ? 'Saved' : 'Save gig'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChat(gig)}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-2 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                    >
                      Chat with buyer
                    </button>
                  </div>
                </article>
                );
              })}
            </div>
            {hasMorePages ? (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={isFetchingMore}
                  className="w-full rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isFetchingMore ? 'Loading more gigs…' : 'Load more gigs'}
                </button>
              </div>
            ) : null}
          </div>
          <aside className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Budget &amp; delivery filters</h3>
              <p className="mt-2 text-xs text-slate-500">
                Focus discovery on briefs that match your scope and turnaround.
              </p>
              <div className="mt-4 space-y-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Budget range (approx.)</p>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Min {budgetRange[0] === BUDGET_MIN_VALUE ? 'Any' : formatInteger(budgetRange[0])}</span>
                    <span>Max {budgetRange[1] === BUDGET_MAX_VALUE ? 'Any' : formatInteger(budgetRange[1])}</span>
                  </div>
                  <div className="mt-3 space-y-2">
                    <input
                      type="range"
                      min={BUDGET_MIN_VALUE}
                      max={BUDGET_MAX_VALUE}
                      step={BUDGET_STEP}
                      value={budgetRange[0]}
                      onChange={(event) => handleBudgetRangeChange(0, event.target.value)}
                      className="w-full"
                    />
                    <input
                      type="range"
                      min={BUDGET_MIN_VALUE}
                      max={BUDGET_MAX_VALUE}
                      step={BUDGET_STEP}
                      value={budgetRange[1]}
                      onChange={(event) => handleBudgetRangeChange(1, event.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Delivery speed</p>
                  <div className="mt-3 space-y-2">
                    {DELIVERY_SPEED_OPTIONS.map((option) => {
                      const checked = filterState.durationCategory.includes(option.id);
                      return (
                        <label key={option.id} className="flex cursor-pointer items-start gap-3">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleToggleDeliverySpeed(option.id)}
                            className="mt-1 h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent/40"
                          />
                          <span>
                            <span className="block text-sm font-semibold text-slate-700">{option.label}</span>
                            <span className="text-xs text-slate-500">{option.description}</span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
              {(hasBudgetFilter || filterState.durationCategory.length) && (
                <button
                  type="button"
                  onClick={handleResetMarketplaceFilters}
                  className="mt-5 w-full rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                >
                  Reset delivery filters
                </button>
              )}
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Saved gigs</h3>
              <p className="mt-2 text-xs text-slate-500">
                Quickly revisit briefs you have bookmarked for follow-up.
              </p>
              {savedGigs.length ? (
                <ul className="mt-4 space-y-3">
                  {savedGigs.slice(0, 5).map((savedGig) => (
                    <li key={savedGig.id} className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-700 line-clamp-2">{savedGig.title}</p>
                        {savedGig.savedAt ? (
                          <p className="text-xs text-slate-500">Saved {formatRelativeTime(savedGig.savedAt)}</p>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveSavedGig(savedGig.id)}
                        className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-500 transition hover:border-rose-300 hover:text-rose-500"
                        aria-label={`Remove ${savedGig.title} from saved gigs`}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-xs text-slate-500">
                  No saved gigs yet. Use the save action on any brief to keep it handy.
                </p>
              )}
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Marketplace signals</p>
              <dl className="mt-4 space-y-4 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-500">Live briefs</dt>
                  <dd className="text-base font-semibold text-slate-900">{formatInteger(derivedSignals.total)}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-500">Published this week</dt>
                  <dd className="text-base font-semibold text-slate-900">{formatInteger(derivedSignals.fresh)}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-500">Remote-friendly</dt>
                  <dd className="text-base font-semibold text-slate-900">{formatInteger(derivedSignals.remoteFriendly)}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-500">Transparent budgets</dt>
                  <dd className="text-base font-semibold text-slate-900">{formatInteger(derivedSignals.withBudgets)}</dd>
                </div>
              </dl>
              <p className="mt-4 text-xs text-slate-500">{gigContent.metrics.caption}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Saved search alerts</h3>
              <p className="mt-2 text-xs text-slate-500">
                Stay ahead of new briefs by saving your favourite filters for instant notifications.
              </p>
              {savedSearchesError ? (
                <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-700">
                  Unable to sync saved searches right now. Using local workspace data.
                </div>
              ) : null}
              <form onSubmit={handleSaveCurrentSearch} className="mt-4 flex flex-wrap gap-3">
                <label htmlFor="gig-saved-search-name" className="sr-only">
                  Name this search
                </label>
                <input
                  id="gig-saved-search-name"
                  type="text"
                  value={savedSearchName}
                  onChange={(event) => setSavedSearchName(event.target.value)}
                  placeholder="Give it a name"
                  className="flex-1 min-w-[8rem] rounded-full border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
                <button
                  type="submit"
                  className="inline-flex items-center rounded-full bg-accent px-5 py-2 text-xs font-semibold text-white shadow-soft transition hover:bg-accentDark disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={savedSearchesLoading}
                >
                  Save search
                </button>
              </form>
              <div className="mt-4">
                <SavedSearchList
                  savedSearches={savedSearches}
                  onApply={handleApplySavedSearch}
                  onDelete={handleDeleteSavedSearch}
                  loading={savedSearchesLoading}
                  activeSearchId={activeSavedSearchId}
                  canManageServerSearches={canSyncSavedSearches}
                />
              </div>
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
                        badge={formatInteger(tag.count)}
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
            <div className="rounded-3xl border border-accent/40 bg-accentSoft p-6 shadow-soft">
              <h3 className="text-sm font-semibold text-accentDark">{gigContent.pitchGuidance.title}</h3>
              <p className="mt-2 text-xs text-accentDark/80">{gigContent.pitchGuidance.description}</p>
              <ul className="mt-3 space-y-2 text-xs text-accentDark">
                {gigContent.pitchGuidance.items.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
              {gigSiteError && gigSiteUsingFallback ? (
                <p className="mt-3 text-[11px] text-accentDark/70">
                  Showing cached pitch guidance while the content hub reloads.
                </p>
              ) : null}
            </div>
          </aside>
        </div>
        <GigLifecycleShowcase />
      </div>
    </section>
  );
}
