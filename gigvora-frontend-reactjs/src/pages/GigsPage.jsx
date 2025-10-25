import { useCallback, useMemo, useState } from 'react';
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

export function formatTagLabelFromSlug(slug) {
  if (!slug) {
    return '';
  }

  return `${slug}`
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

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
  const navigate = useNavigate();
  const { session, isAuthenticated } = useSession();
  const {
    page: gigSitePage,
    loading: gigSiteLoading,
    error: gigSiteError,
    usingFallback: gigSiteUsingFallback,
  } = useSitePage('gigs-marketplace', { fallback: FALLBACK_GIGS_PAGE_CONTENT });
  const gigContent = useMemo(() => resolveGigPageContent(gigSitePage), [gigSitePage]);
  const hasFreelancerAccess = Boolean(session?.memberships?.includes('freelancer'));
  const activeFilters = useMemo(
    () => (selectedTagSlugs.length ? { taxonomySlugs: selectedTagSlugs } : null),
    [selectedTagSlugs],
  );
  const {
    data,
    error,
    loading,
    fromCache,
    lastUpdated,
    refresh,
    debouncedQuery,
  } = useOpportunityListing('gigs', query, {
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
  const items = useMemo(() => (Array.isArray(listing.items) ? listing.items : []), [listing.items]);
  const tagDirectory = useMemo(() => {
    if (!items.length) {
      return new Map();
    }

    const directory = new Map();
    items.forEach((gig) => {
      if (Array.isArray(gig.taxonomies)) {
        gig.taxonomies.forEach((taxonomy) => {
          if (!taxonomy?.slug) {
            return;
          }
          const key = `${taxonomy.slug}`.toLowerCase();
          if (!directory.has(key) || !directory.get(key)) {
            const label = typeof taxonomy.label === 'string' && taxonomy.label.trim().length
              ? taxonomy.label
              : formatTagLabelFromSlug(taxonomy.slug);
            directory.set(key, label);
          }
        });
      }

      if (Array.isArray(gig.taxonomySlugs)) {
        gig.taxonomySlugs.forEach((slug, index) => {
          if (!slug) {
            return;
          }
          const key = `${slug}`.toLowerCase();
          if (!directory.has(key) || !directory.get(key)) {
            const labelCandidate = Array.isArray(gig.taxonomyLabels) ? gig.taxonomyLabels[index] : null;
            const label = typeof labelCandidate === 'string' && labelCandidate.trim().length
              ? labelCandidate
              : formatTagLabelFromSlug(slug);
            directory.set(key, label);
          }
        });
      }
    });
    return directory;
  }, [items]);

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

    items.forEach((gig) => {
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
  }, [items, listing?.facets, tagDirectory]);

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

  const handlePitch = (gig) => {
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

  const currentFiltersPayload = useMemo(
    () => (selectedTagSlugs.length ? { taxonomySlugs: selectedTagSlugs } : {}),
    [selectedTagSlugs],
  );

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
            {loading && !items.length ? (
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
            {!loading && !items.length ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
                {debouncedQuery
                  ? 'No gigs currently match your filters. Try exploring adjacent skills or timelines.'
                  : 'Freshly vetted gigs will appear here as clients publish briefs.'}
              </div>
            ) : null}
            <div className="space-y-6">
              {items.map((gig) => (
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
                  <button
                    type="button"
                    onClick={() => handlePitch(gig)}
                    className="mt-5 inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-2 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                  >
                    Pitch this gig <span aria-hidden="true">→</span>
                  </button>
                </article>
              ))}
            </div>
          </div>
          <aside className="space-y-6">
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
