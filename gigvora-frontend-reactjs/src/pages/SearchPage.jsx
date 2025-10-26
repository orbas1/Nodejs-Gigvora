import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dialog, Switch, Transition } from '@headlessui/react';
import {
  AdjustmentsHorizontalIcon,
  BellIcon,
  BookmarkIcon,
  ExclamationCircleIcon,
  LockClosedIcon,
  ListBulletIcon,
  MapIcon,
  PlusIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import DataStatus from '../components/DataStatus.jsx';
import ExplorerMap from '../components/explorer/ExplorerMap.jsx';
import ExplorerFilterDrawer from '../components/explorer/ExplorerFilterDrawer.jsx';
import ExplorerResultCard from '../components/explorer/ExplorerResultCard.jsx';
import SavedSearchList from '../components/explorer/SavedSearchList.jsx';
import ExplorerManagementPanel from '../components/explorer/ExplorerManagementPanel.jsx';
import SuggestionRail from '../components/discovery/SuggestionRail.jsx';
import TrendingTopicsPanel from '../components/discovery/TrendingTopicsPanel.jsx';
import ConnectionCard from '../components/discovery/ConnectionCard.jsx';
import useCachedResource from '../hooks/useCachedResource.js';
import useDebounce from '../hooks/useDebounce.js';
import useSavedSearches from '../hooks/useSavedSearches.js';
import { apiClient } from '../services/apiClient.js';
import analytics from '../services/analytics.js';
import { formatAbsolute, formatRelativeTime } from '../utils/date.js';
import useSession from '../hooks/useSession.js';
import { getExplorerAllowedMemberships, hasExplorerAccess } from '../utils/accessControl.js';
import { createConnectionRequest } from '../services/connections.js';

const DEFAULT_CATEGORY = 'job';

const MANAGED_EXPLORER_CATEGORIES = new Set(['job', 'gig', 'project', 'launchpad', 'mentor', 'volunteering', 'talent']);

const CATEGORIES = [
  {
    id: 'job',
    label: 'Jobs',
    tagline: 'Permanent, contract, and interim roles across the Gigvora network.',
    placeholder: 'Search roles, companies, or keywords',
  },
  {
    id: 'gig',
    label: 'Gigs',
    tagline: 'Short-term engagements with transparent budgets and timelines.',
    placeholder: 'Search gig keywords or delivery focus',
  },
  {
    id: 'project',
    label: 'Projects',
    tagline: 'Multi-disciplinary projects with status tracking and collaborators.',
    placeholder: 'Search project objectives or skills',
  },
  {
    id: 'launchpad',
    label: 'Experience Launchpad',
    tagline: 'Cohort-driven launchpad placements and growth programmes.',
    placeholder: 'Search tracks or launchpad cohorts',
  },
  {
    id: 'mentor',
    label: 'Mentors',
    tagline: 'Book mentorship sessions, clinics, and packages with industry leaders.',
    placeholder: 'Search mentors, focus areas, or outcomes',
  },
  {
    id: 'volunteering',
    label: 'Volunteering',
    tagline: 'Purpose-led missions from nonprofits and community partners.',
    placeholder: 'Search missions or causes',
  },
  {
    id: 'talent',
    label: 'Freelancers',
    tagline: 'Curated independent talent ready to collaborate.',
    placeholder: 'Search skills, disciplines, or locations',
  },
  {
    id: 'companies',
    label: 'Companies',
    tagline: 'Hiring teams and organisations across the Gigvora ecosystem.',
    placeholder: 'Search company names, sectors, or geographies',
  },
  {
    id: 'people',
    label: 'People',
    tagline: 'Find people in your wider network to connect with.',
    placeholder: 'Search names, specialties, or keywords',
  },
  {
    id: 'groups',
    label: 'Groups',
    tagline: 'Communities and collectives hosting specialised discussions.',
    placeholder: 'Search groups or focus areas',
  },
  {
    id: 'pages',
    label: 'Pages',
    tagline: 'Company and agency destinations curated for Explorer.',
    placeholder: 'Search company, agency, or initiative pages',
  },
  {
    id: 'headhunter',
    label: 'Headhunters',
    tagline: 'Specialist partners for executive and niche searches.',
    placeholder: 'Search headhunter firms or expertise areas',
  },
  {
    id: 'agency',
    label: 'Agencies',
    tagline: 'Agency partners and collectives to co-deliver programmes.',
    placeholder: 'Search agency names, services, or regions',
  },
];

function normalisePersonaKey(value) {
  if (!value) {
    return null;
  }
  return `${value}`.trim().toLowerCase().replace(/\s+/g, '_');
}

function formatPersonaLabel(value) {
  if (!value || value === 'all') {
    return 'All audiences';
  }
  return value
    .split('_')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

function normaliseTimeframeKey(value) {
  if (!value) {
    return null;
  }
  return `${value}`.trim().toLowerCase();
}

function formatTimeframeLabel(value) {
  if (!value) {
    return 'Any time';
  }
  if (value === '24h') {
    return 'Past day';
  }
  if (value.endsWith('d')) {
    const days = Number.parseInt(value.replace('d', ''), 10);
    if (Number.isFinite(days)) {
      return days === 1 ? 'Past day' : `Past ${days} days`;
    }
  }
  if (value.endsWith('h')) {
    const hours = Number.parseInt(value.replace('h', ''), 10);
    if (Number.isFinite(hours)) {
      return hours === 1 ? 'Past hour' : `Past ${hours} hours`;
    }
  }
  return value.toUpperCase();
}

function resolveAbsoluteUrl(candidate) {
  if (!candidate || typeof candidate !== 'string') {
    return null;
  }
  const trimmed = candidate.trim();
  if (!trimmed) {
    return null;
  }
  if (typeof window === 'undefined') {
    return trimmed;
  }
  try {
    const url = new URL(trimmed, trimmed.startsWith('http') ? undefined : window.location.origin);
    if (['http:', 'https:'].includes(url.protocol)) {
      return url.toString();
    }
  } catch (error) {
    console.warn('Unable to resolve absolute URL for discovery destination', error);
  }
  return null;
}

const QUICK_FILTER_PRESETS = {
  job: [
    {
      id: 'remote',
      label: 'Remote friendly',
      filters: { isRemote: true },
    },
    {
      id: 'recent',
      label: 'Fresh in 7 days',
      filters: { updatedWithin: '7d' },
    },
    {
      id: 'contract',
      label: 'Contract roles',
      filters: { employmentTypes: ['contract', 'fixed_term'] },
    },
  ],
  gig: [
    {
      id: 'remote',
      label: 'Remote delivery',
      filters: { isRemote: true },
    },
    {
      id: 'budget',
      label: 'High budget',
      filters: { budgetCurrencies: ['USD', 'GBP', 'EUR'] },
    },
    {
      id: 'recent',
      label: 'Updated 30 days',
      filters: { updatedWithin: '30d' },
    },
  ],
  project: [
    {
      id: 'inflight',
      label: 'In-flight',
      filters: { statuses: ['active', 'in_progress'] },
    },
    {
      id: 'longterm',
      label: 'Long term',
      filters: { durationCategories: ['long_term'] },
    },
    {
      id: 'remote',
      label: 'Remote team',
      filters: { isRemote: true },
    },
  ],
  mentor: [
    {
      id: 'top_rated',
      label: 'Top rated',
      filters: { statuses: ['featured', 'verified'], sort: 'rating' },
    },
    {
      id: 'growth',
      label: 'Growth clinics',
      filters: { tracks: ['growth', 'product'] },
    },
    {
      id: 'availability',
      label: 'Available now',
      filters: { availability: 'immediate' },
    },
  ],
  talent: [
    {
      id: 'platform',
      label: 'Platform engineering',
      filters: { employmentCategories: ['platform engineering'] },
    },
    {
      id: 'remote',
      label: 'Remote talent',
      filters: { isRemote: true },
    },
    {
      id: 'available',
      label: 'Available this week',
      filters: { availability: 'immediate' },
    },
  ],
  volunteering: [
    {
      id: 'stemed',
      label: 'STEM causes',
      filters: { tags: ['STEM', 'STEM education'] },
    },
    {
      id: 'remote',
      label: 'Remote friendly',
      filters: { isRemote: true },
    },
    {
      id: 'weekend',
      label: 'Weekend missions',
      filters: { durationCategories: ['short_term'], availability: 'weekend' },
    },
  ],
  launchpad: [
    {
      id: 'product',
      label: 'Product tracks',
      filters: { tracks: ['product leadership', 'product'] },
    },
    {
      id: 'remote',
      label: 'Remote cohorts',
      filters: { isRemote: true },
    },
    {
      id: 'soon',
      label: 'Starting soon',
      filters: { statuses: ['enrolling', 'upcoming'], updatedWithin: '30d' },
    },
  ],
};

const SORT_OPTIONS = {
  job: [
    { id: 'default', label: 'Relevance' },
    { id: 'newest', label: 'Newest' },
    { id: 'alphabetical', label: 'A–Z' },
  ],
  gig: [
    { id: 'default', label: 'Relevance' },
    { id: 'budget', label: 'Budget (high → low)' },
    { id: 'newest', label: 'Newest' },
  ],
  project: [
    { id: 'default', label: 'Relevance' },
    { id: 'status', label: 'Status' },
    { id: 'alphabetical', label: 'A–Z' },
  ],
  launchpad: [
    { id: 'default', label: 'Relevance' },
    { id: 'alphabetical', label: 'A–Z' },
  ],
  mentor: [
    { id: 'default', label: 'Match score' },
    { id: 'rating', label: 'Rating' },
    { id: 'price_low_high', label: 'Price (low → high)' },
  ],
  volunteering: [
    { id: 'default', label: 'Relevance' },
    { id: 'alphabetical', label: 'A–Z' },
  ],
  talent: [
    { id: 'default', label: 'Match score' },
    { id: 'availability', label: 'Availability' },
    { id: 'alphabetical', label: 'A–Z' },
  ],
  companies: [
    { id: 'default', label: 'Relevance' },
    { id: 'alphabetical', label: 'A–Z' },
    { id: 'activity', label: 'Recent activity' },
  ],
  people: [
    { id: 'default', label: 'Relevance' },
    { id: 'alphabetical', label: 'A–Z' },
    { id: 'recent', label: 'Recently active' },
  ],
  groups: [
    { id: 'default', label: 'Relevance' },
    { id: 'members', label: 'Member count' },
    { id: 'recent', label: 'Recently active' },
  ],
  pages: [
    { id: 'default', label: 'Relevance' },
    { id: 'followers', label: 'Follower count' },
    { id: 'recent', label: 'Recently updated' },
  ],
  headhunter: [
    { id: 'default', label: 'Relevance' },
    { id: 'alphabetical', label: 'A–Z' },
  ],
  agency: [
    { id: 'default', label: 'Relevance' },
    { id: 'alphabetical', label: 'A–Z' },
    { id: 'impact', label: 'Programme impact' },
  ],
};

const DEFAULT_FILTERS = {
  employmentTypes: [],
  employmentCategories: [],
  durationCategories: [],
  budgetCurrencies: [],
  locations: [],
  countries: [],
  regions: [],
  cities: [],
  tracks: [],
  organizations: [],
  statuses: [],
  isRemote: null,
  availability: null,
  updatedWithin: '30d',
};

const FRESHNESS_LABELS = {
  '24h': 'Last 24 hours',
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
};

function normaliseFilters(state = {}) {
  return { ...DEFAULT_FILTERS, ...state };
}

function cleanFilters(filters) {
  const normalised = normaliseFilters(filters);
  return Object.entries(normalised).reduce((acc, [key, value]) => {
    if (Array.isArray(value)) {
      if (value.length) {
        acc[key] = value;
      }
      return acc;
    }
    if (value === true || value === false) {
      acc[key] = value;
      return acc;
    }
    if (value) {
      acc[key] = value;
    }
    return acc;
  }, {});
}

function hasFiltersApplied(filters) {
  const cleaned = cleanFilters(filters);
  return Object.keys(cleaned).length > 0;
}

function getCategoryById(id) {
  return CATEGORIES.find((category) => category.id === id) ?? CATEGORIES[0];
}

function buildCacheKey({ category, query, page, sort, filters, viewport, pageSize }) {
  return [
    'explorer',
    category,
    query || '∅',
    sort || 'default',
    page,
    filters ? JSON.stringify(filters) : '∅',
    viewport ? JSON.stringify(viewport) : '∅',
    pageSize ?? '∅',
  ].join('::');
}

function isPresetActive(currentFilters, preset) {
  if (!preset?.filters) {
    return false;
  }
  const normalised = normaliseFilters(currentFilters);
  return Object.entries(preset.filters).every(([key, value]) => {
    if (Array.isArray(value)) {
      const current = Array.isArray(normalised[key]) ? normalised[key] : [];
      if (current.length !== value.length) {
        return false;
      }
      const lookup = new Set(current.map((entry) => `${entry}`.toLowerCase()));
      return value.every((entry) => lookup.has(`${entry}`.toLowerCase()));
    }
    if (typeof value === 'boolean') {
      return normalised[key] === value;
    }
    return `${normalised[key] ?? ''}`.toLowerCase() === `${value ?? ''}`.toLowerCase();
  });
}

function toResultMeta(item) {
  const tokens = [];
  if (item.location) {
    tokens.push(item.location);
  }
  if (item.employmentType) {
    tokens.push(item.employmentType);
  }
  if (item.duration) {
    tokens.push(item.duration);
  }
  if (item.status) {
    tokens.push(item.status);
  }
  if (item.track) {
    tokens.push(item.track);
  }
  if (item.organization) {
    tokens.push(item.organization);
  }
  if (item.isRemote) {
    tokens.push('Remote friendly');
  }
  return tokens;
}

const DEFAULT_PAGE_SIZE = 20;
const MAP_PAGE_SIZE = 12;

function resolveResultUrl(item) {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const candidates = [
    item.detailUrl,
    item.url,
    item.href,
    item.link,
    item.permalink,
    item.profileUrl,
    item.externalUrl,
    item.website,
    item.applicationUrl,
  ];

  const candidate = candidates.find((value) => typeof value === 'string' && value.trim().length);
  if (!candidate) {
    return null;
  }

  const trimmed = candidate.trim();

  if (typeof window === 'undefined') {
    return trimmed;
  }

  try {
    const url = new URL(trimmed, trimmed.startsWith('http') ? undefined : window.location.origin);
    if (['http:', 'https:'].includes(url.protocol)) {
      return url.toString();
    }
    return null;
  } catch (error) {
    console.warn('Invalid explorer destination URL', error);
    return null;
  }
}

function openExternalLink(url) {
  if (typeof window === 'undefined' || !url) {
    return;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}

function escapeAttributeValue(value) {
  return `${value}`.replace(/"/g, '\\"');
}

function resolveSuggestedName({ category, query }) {
  const categoryLabel = getCategoryById(category).label;
  if (query) {
    return `${categoryLabel}: ${query}`;
  }
  return `${categoryLabel} explorer`;
}

export default function SearchPage() {
  const location = useLocation();
  const { session, isAuthenticated } = useSession();
  const [selectedCategory, setSelectedCategory] = useState(DEFAULT_CATEGORY);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('default');
  const [filters, setFilters] = useState(() => normaliseFilters());
  const [viewMode, setViewMode] = useState('list');
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [viewportBounds, setViewportBounds] = useState(null);
  const [isManagementPanelOpen, setIsManagementPanelOpen] = useState(false);
  const [saveModalState, setSaveModalState] = useState({ open: false, mode: 'create', draft: null });
  const [activeSavedSearchId, setActiveSavedSearchId] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [isSubmittingSavedSearch, setIsSubmittingSavedSearch] = useState(false);
  const [resultDialogState, setResultDialogState] = useState({ open: false, item: null, externalUrl: null });
  const debouncedQuery = useDebounce(query.trim(), 400);
  const lastTrackedQueryRef = useRef(null);
  const resultsContainerRef = useRef(null);
  const shouldFocusResultsRef = useRef(false);
  const focusTargetIdRef = useRef(null);
  const lastFocusedResultIdRef = useRef(null);

  const explorerAccessEnabled = isAuthenticated && hasExplorerAccess(session);
  const isManagedCategory = useMemo(
    () => MANAGED_EXPLORER_CATEGORIES.has(selectedCategory),
    [selectedCategory],
  );
  const canManageExplorerDataset = useMemo(() => {
    if (!isManagedCategory || !session) {
      return false;
    }
    const memberships = Array.isArray(session.memberships)
      ? session.memberships.map((membership) => `${membership}`.toLowerCase())
      : [];
    return memberships.some((membership) => ['admin', 'agency', 'company'].includes(membership));
  }, [isManagedCategory, session]);

  const { items: savedSearches, loading: savedSearchesLoading, createSavedSearch, updateSavedSearch, deleteSavedSearch, canUseServer } =
    useSavedSearches({ enabled: explorerAccessEnabled });
  const discoveryPersona = useMemo(() => {
    if (!session) {
      return undefined;
    }
    if (session.primaryDashboard) {
      return session.primaryDashboard;
    }
    if (Array.isArray(session.memberships) && session.memberships.length) {
      return session.memberships[0];
    }
    if (session.userType) {
      return session.userType;
    }
    return undefined;
  }, [session]);
  const discoveryCacheKey = useMemo(
    () => `discovery:experience:v1:${discoveryPersona ? discoveryPersona.toLowerCase() : 'anon'}`,
    [discoveryPersona],
  );
  const discoveryExperienceState = useCachedResource(
    discoveryCacheKey,
    ({ signal }) =>
      apiClient.get('/discovery/experience', {
        signal,
        params: discoveryPersona ? { persona: discoveryPersona } : undefined,
      }),
    {
      ttl: 120_000,
      dependencies: [discoveryPersona],
      enabled: true,
    },
  );
  const [suggestionCards, setSuggestionCards] = useState([]);
  const [suggestionMeta, setSuggestionMeta] = useState({ filters: [], personalizationSummary: null });
  const [activeDiscoveryFilter, setActiveDiscoveryFilter] = useState('all');
  const [trendingTopics, setTrendingTopics] = useState([]);
  const [connectionSpotlights, setConnectionSpotlights] = useState([]);
  const [activeTrendingPersona, setActiveTrendingPersona] = useState('all');
  const [activeTrendingTimeframe, setActiveTrendingTimeframe] = useState(null);
  const [topicFollows, setTopicFollows] = useState(() => new Map());
  const activeSavedSearch = useMemo(
    () => savedSearches.find((search) => search.id === activeSavedSearchId) ?? null,
    [savedSearches, activeSavedSearchId],
  );

  useEffect(() => {
    if (!discoveryExperienceState.data) {
      return;
    }

    const {
      suggestions = [],
      suggestionMeta: incomingSuggestionMeta,
      trendingTopics: incomingTrendingTopics,
      connectionSpotlights: incomingConnections,
      trendingMeta: incomingTrendingMeta,
      persona: payloadPersona,
    } = discoveryExperienceState.data;

    setSuggestionCards(Array.isArray(suggestions) ? suggestions : []);
    setSuggestionMeta({
      filters: Array.isArray(incomingSuggestionMeta?.filters) ? incomingSuggestionMeta.filters : [],
      personalizationSummary: incomingSuggestionMeta?.personalizationSummary ?? null,
    });
    setTrendingTopics(Array.isArray(incomingTrendingTopics) ? incomingTrendingTopics : []);
    setConnectionSpotlights(Array.isArray(incomingConnections) ? incomingConnections : []);

    setActiveDiscoveryFilter((current) => {
      const availableFilters = Array.isArray(incomingSuggestionMeta?.filters)
        ? incomingSuggestionMeta.filters
        : [];
      if (availableFilters.some((filter) => filter.id === current)) {
        return current;
      }
      if (availableFilters.length) {
        return availableFilters[0].id;
      }
      return 'all';
    });

    const personaCandidates = new Set(
      (Array.isArray(incomingTrendingTopics) ? incomingTrendingTopics : [])
        .map((topic) => normalisePersonaKey(topic.persona))
        .filter(Boolean),
    );
    const resolvedPersona =
      normalisePersonaKey(incomingTrendingMeta?.persona) ?? normalisePersonaKey(payloadPersona);
    setActiveTrendingPersona((current) => {
      if (current && (current === 'all' || personaCandidates.has(current))) {
        return current;
      }
      if (resolvedPersona && personaCandidates.has(resolvedPersona)) {
        return resolvedPersona;
      }
      if (personaCandidates.size) {
        return personaCandidates.values().next().value;
      }
      return 'all';
    });

    const timeframeCandidates = new Set(
      (Array.isArray(incomingTrendingTopics) ? incomingTrendingTopics : [])
        .map((topic) => normaliseTimeframeKey(topic.timeframe))
        .filter(Boolean),
    );
    const resolvedTimeframe = normaliseTimeframeKey(incomingTrendingMeta?.timeframe) ?? null;
    setActiveTrendingTimeframe((current) => {
      if (current && timeframeCandidates.has(current)) {
        return current;
      }
      if (resolvedTimeframe && timeframeCandidates.has(resolvedTimeframe)) {
        return resolvedTimeframe;
      }
      if (timeframeCandidates.size) {
        return timeframeCandidates.values().next().value;
      }
      return resolvedTimeframe ?? null;
    });

    setTopicFollows((prev) => {
      if (!Array.isArray(incomingTrendingTopics)) {
        return prev;
      }
      const next = new Map(prev);
      incomingTrendingTopics.forEach((topic) => {
        const key = `${topic.id}`;
        if (!next.has(key) && topic.following != null) {
          next.set(key, Boolean(topic.following));
        }
      });
      return next;
    });
  }, [discoveryExperienceState.data]);

  const cleanedFilters = useMemo(() => cleanFilters(filters), [filters]);
  const filtersParam = useMemo(
    () => (Object.keys(cleanedFilters).length ? JSON.stringify(cleanedFilters) : undefined),
    [cleanedFilters],
  );
  const viewportParam = useMemo(
    () => (viewportBounds ? JSON.stringify({ boundingBox: viewportBounds }) : undefined),
    [viewportBounds],
  );
  const pageSize = useMemo(() => (viewMode === 'map' ? MAP_PAGE_SIZE : DEFAULT_PAGE_SIZE), [viewMode]);
  const suggestionFilters = useMemo(() => {
    const base = Array.isArray(suggestionMeta.filters) ? suggestionMeta.filters : [];
    const entries = new Map();
    base.forEach((filter) => {
      if (!filter?.id) {
        return;
      }
      entries.set(filter.id, filter);
    });
    if (!entries.has('all')) {
      entries.set('all', { id: 'all', label: 'All suggestions', type: null });
    }
    const ordered = ['all', ...Array.from(entries.keys()).filter((key) => key !== 'all')];
    return ordered
      .map((key) => entries.get(key))
      .filter(Boolean)
      .map((filter) => {
        const predicate =
          typeof filter.predicate === 'function'
            ? filter.predicate
            : filter?.type
              ? (suggestion) => suggestion?.type === filter.type
              : () => true;
        return { ...filter, predicate };
      });
  }, [suggestionMeta.filters]);
  const activeSuggestionFilter = useMemo(
    () => suggestionFilters.find((filter) => filter.id === activeDiscoveryFilter) ?? suggestionFilters[0] ?? null,
    [suggestionFilters, activeDiscoveryFilter],
  );
  const filteredSuggestions = useMemo(() => {
    const predicate = activeSuggestionFilter?.predicate ?? (() => true);
    return suggestionCards.filter((suggestion) => predicate(suggestion));
  }, [suggestionCards, activeSuggestionFilter]);
  const suggestionPersonalizationSummary = suggestionMeta.personalizationSummary;
  const discoveryLoading = Boolean(discoveryExperienceState.loading);
  const discoveryError = Boolean(discoveryExperienceState.error);
  const refreshDiscoveryExperience = discoveryExperienceState.refresh;
  const handleDiscoveryRefresh = useCallback(() => {
    refreshDiscoveryExperience?.({ force: true });
  }, [refreshDiscoveryExperience]);
  const handleDiscoveryFilterChange = useCallback(
    (filterId) => {
      const allowed = suggestionFilters.map((filter) => filter.id);
      const next = allowed.includes(filterId) ? filterId : suggestionFilters[0]?.id ?? 'all';
      setActiveDiscoveryFilter(next);
    },
    [suggestionFilters],
  );
  const categoryLabelMap = useMemo(() => {
    const map = new Map();
    CATEGORIES.forEach((category) => {
      map.set(category.label.toLowerCase(), category.id);
    });
    return map;
  }, []);
  const trendingPersonaOptions = useMemo(() => {
    const options = [{ id: 'all', label: formatPersonaLabel('all') }];
    const seen = new Set();
    trendingTopics.forEach((topic) => {
      const key = normalisePersonaKey(topic.persona);
      if (key && !seen.has(key)) {
        seen.add(key);
        options.push({ id: key, label: formatPersonaLabel(key) });
      }
    });
    return options;
  }, [trendingTopics]);
  const trendingTimeframeOptions = useMemo(() => {
    const seen = new Set();
    trendingTopics.forEach((topic) => {
      const key = normaliseTimeframeKey(topic.timeframe) ?? '7d';
      seen.add(key);
    });
    if (activeTrendingTimeframe) {
      seen.add(activeTrendingTimeframe);
    }
    if (!seen.size) {
      seen.add('7d');
    }
    return Array.from(seen).map((key) => ({ id: key, label: formatTimeframeLabel(key) }));
  }, [trendingTopics, activeTrendingTimeframe]);
  const filteredTrendingTopics = useMemo(() => {
    return trendingTopics.filter((topic) => {
      const personaKey = normalisePersonaKey(topic.persona) ?? 'all';
      const timeframeKey = normaliseTimeframeKey(topic.timeframe) ?? '7d';
      const matchesPersona = activeTrendingPersona === 'all' || personaKey === activeTrendingPersona;
      const matchesTimeframe = !activeTrendingTimeframe || timeframeKey === activeTrendingTimeframe;
      return matchesPersona && matchesTimeframe;
    });
  }, [trendingTopics, activeTrendingPersona, activeTrendingTimeframe]);
  const trendingTopicRows = useMemo(() => {
    return filteredTrendingTopics.map((topic) => {
      const key = `${topic.id}`;
      const metrics = topic.metrics && typeof topic.metrics === 'object' ? topic.metrics : {};
      const growthRate = topic.growthRate != null ? Number(topic.growthRate) : metrics.growthRate != null ? Number(metrics.growthRate) : null;
      const growthLabel = metrics.growthLabel ?? (growthRate != null ? `${growthRate > 0 ? '+' : ''}${growthRate}% momentum` : null);
      const mentions = topic.mentionCount ?? metrics.mentions ?? metrics.conversations ?? null;
      const sentiment = metrics.sentimentLabel ?? (topic.sentimentScore != null ? `${Number(topic.sentimentScore).toFixed(1)}/5 sentiment` : null);
      const geo = metrics.geoFocus ?? metrics.geo ?? null;
      const following = topicFollows.has(key) ? topicFollows.get(key) : Boolean(topic.following);
      return {
        id: topic.id,
        title: topic.topic,
        summary: topic.summary,
        category: topic.category,
        growth: growthRate,
        growthLabel,
        mentions,
        sentiment,
        geo,
        following,
        highlighted: (topic.rank ?? 0) <= 3,
        href: topic.metadata?.href ?? topic.href ?? null,
        shareUrl: topic.metadata?.shareUrl ?? topic.shareUrl ?? topic.href ?? null,
      };
    });
  }, [filteredTrendingTopics, topicFollows]);
  const trendingDescription = useMemo(() => {
    const personaLabel = formatPersonaLabel(activeTrendingPersona);
    const timeframeKey = activeTrendingTimeframe ?? trendingTimeframeOptions[0]?.id ?? '7d';
    const timeframeLabel = formatTimeframeLabel(timeframeKey);
    return `${personaLabel} • ${timeframeLabel}`;
  }, [activeTrendingPersona, activeTrendingTimeframe, trendingTimeframeOptions]);
  const sessionUserId = session?.id ?? session?.userId ?? null;
  const ensureAuthenticated = useCallback(() => {
    if (isAuthenticated) {
      return true;
    }
    navigate('/login', { state: { from: `${location.pathname}${location.search}` } });
    return false;
  }, [isAuthenticated, navigate, location.pathname, location.search]);
  const focusResultCard = useCallback((preferredId = null) => {
    const container = resultsContainerRef.current;
    if (!container) {
      return false;
    }

    let target = null;
    if (preferredId) {
      target = container.querySelector(
        `[data-explorer-card-id="${escapeAttributeValue(preferredId)}"]`,
      );
    }

    if (!target) {
      target = container.querySelector('[data-explorer-card]');
    }

    if (target && typeof target.focus === 'function') {
      target.focus();
      return true;
    }

    return false;
  }, []);

  const scheduleFocus = useCallback((preferredId = null) => {
    shouldFocusResultsRef.current = true;
    focusTargetIdRef.current = preferredId ?? null;
  }, []);

  useEffect(() => {
    setPage(1);
    setViewportBounds(null);
    setSort((current) => {
      const allowed = SORT_OPTIONS[selectedCategory] ?? [];
      const fallback = allowed[0]?.id ?? 'default';
      if (allowed.some((option) => option.id === current)) {
        return current;
      }
      return fallback;
    });
  }, [selectedCategory]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, filtersParam, sort, viewportParam, pageSize]);

  useEffect(() => {
    setIsManagementPanelOpen(false);
  }, [selectedCategory]);

  useEffect(() => {
    setPage(1);
  }, [viewMode]);

  const searchKey = useMemo(
    () =>
      buildCacheKey({
        category: selectedCategory,
        query: debouncedQuery,
        page,
        sort,
        filters: cleanedFilters,
        viewport: viewportBounds,
        pageSize,
      }),
    [selectedCategory, debouncedQuery, page, sort, cleanedFilters, viewportBounds, pageSize],
  );

  const searchState = useCachedResource(
    searchKey,
    ({ signal }) => {
      if (!explorerAccessEnabled) {
        return {
          items: [],
          total: 0,
          totalPages: 1,
          page,
          pageSize,
          facets: {},
          metrics: { source: 'explorer', processingTimeMs: 0 },
        };
      }

      const params = {
        q: debouncedQuery || undefined,
        page,
        pageSize,
        sort,
        filters: filtersParam,
      };

      if (!isManagedCategory) {
        return apiClient.get('/search/opportunities', {
          signal,
          params: {
            category: selectedCategory,
            includeFacets: true,
            viewport: viewportParam,
            ...params,
          },
        });
      }

      return apiClient.get(`/explorer/${selectedCategory}`, {
        signal,
        params,
      });
    },
    {
      dependencies: [
        selectedCategory,
        debouncedQuery,
        page,
        sort,
        filtersParam,
        viewportParam,
        pageSize,
        isManagedCategory,
        explorerAccessEnabled,
      ],
      ttl: 60_000,
      enabled: explorerAccessEnabled,
    },
  );

  useEffect(() => {
    if (!explorerAccessEnabled || viewMode === 'map') {
      return undefined;
    }

    const cacheKey = buildCacheKey({
      category: selectedCategory,
      query: debouncedQuery,
      page,
      sort,
      filters: cleanedFilters,
      viewport: viewportBounds,
      pageSize: MAP_PAGE_SIZE,
    });

    if (apiClient.readCache(cacheKey)) {
      return undefined;
    }

    const controller = new AbortController();
    const params = {
      q: debouncedQuery || undefined,
      page,
      pageSize: MAP_PAGE_SIZE,
      sort,
      filters: filtersParam,
      viewport: viewportParam,
    };

    const request = isManagedCategory
      ? apiClient.get(`/explorer/${selectedCategory}`, { signal: controller.signal, params })
      : apiClient.get('/search/opportunities', {
          signal: controller.signal,
          params: { ...params, category: selectedCategory, includeFacets: true },
        });

    request
      .then((payload) => {
        apiClient.writeCache(cacheKey, payload, 60_000);
      })
      .catch((error) => {
        if (controller.signal.aborted || error?.name === 'AbortError') {
          return;
        }
        console.warn('Failed to prefetch explorer map dataset', error);
      });

    return () => controller.abort();
  }, [
    explorerAccessEnabled,
    viewMode,
    selectedCategory,
    debouncedQuery,
    page,
    sort,
    cleanedFilters,
    filtersParam,
    viewportBounds,
    viewportParam,
    isManagedCategory,
  ]);

  useEffect(() => {
    if (!debouncedQuery || !searchState.data) {
      return;
    }
    const signature = `${selectedCategory}:${debouncedQuery}`;
    if (lastTrackedQueryRef.current === signature) {
      return;
    }
    analytics.track(
      'web_explorer_search_performed',
      {
        query: debouncedQuery,
        category: selectedCategory,
        filtersApplied: Object.keys(cleanedFilters).length,
        sort,
        totalResults: searchState.data.total ?? 0,
        page,
      },
      { source: 'web_app' },
    );
    lastTrackedQueryRef.current = signature;
  }, [debouncedQuery, searchState.data, selectedCategory, cleanedFilters, sort, page]);

  const results = searchState.data?.items ?? [];
  const totalResults = searchState.data?.total ?? results.length;
  const totalPages = useMemo(() => {
    const reported = searchState.data?.totalPages;
    if (typeof reported === 'number' && Number.isFinite(reported)) {
      return Math.max(1, reported);
    }
    return Math.max(1, Math.ceil((totalResults || 0) / Math.max(pageSize, 1)));
  }, [searchState.data?.totalPages, totalResults, pageSize]);
  const facets = searchState.data?.facets ?? null;
  const metrics = searchState.data?.metrics ?? null;

  const activeResultId = resultDialogState.item?.id;

  useEffect(() => {
    if (!lastFocusedResultIdRef.current) {
      return;
    }
    const stillVisible = results.some((item) => item.id === lastFocusedResultIdRef.current);
    if (!stillVisible) {
      lastFocusedResultIdRef.current = null;
    }
  }, [results]);

  useEffect(() => {
    if (!shouldFocusResultsRef.current) {
      return;
    }
    if (!results.length) {
      return;
    }
    const targetId = focusTargetIdRef.current;
    shouldFocusResultsRef.current = false;
    focusTargetIdRef.current = null;
    const runFocus = () => {
      focusResultCard(targetId);
    };
    if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(runFocus);
    } else {
      runFocus();
    }
  }, [results, focusResultCard, viewMode]);

  useEffect(() => {
    if (!explorerAccessEnabled) {
      setResultDialogState({ open: false, item: null, externalUrl: null });
      return;
    }
    if (!activeResultId) {
      return;
    }
    const stillExists = results.some((item) => item.id === activeResultId);
    if (!stillExists) {
      setResultDialogState({ open: false, item: null, externalUrl: null });
    }
  }, [explorerAccessEnabled, results, activeResultId]);
  const handleCategoryChange = useCallback((categoryId) => {
    analytics.track('web_explorer_category_selected', { category: categoryId }, { source: 'web_app' });
    setSelectedCategory(categoryId);
    setActiveSavedSearchId(null);
    setFilters(normaliseFilters());
    setQuery('');
    lastTrackedQueryRef.current = null;
    scheduleFocus(null);
  }, [scheduleFocus]);

  const handleApplyFilters = useCallback((nextFilters) => {
    setFilters(normaliseFilters(nextFilters));
    setActiveSavedSearchId(null);
    scheduleFocus(null);
    analytics.track('web_explorer_filters_applied', { category: selectedCategory, filters: cleanFilters(nextFilters) });
  }, [selectedCategory, scheduleFocus]);

  const handleResetFilters = useCallback(() => {
    setFilters(normaliseFilters());
    setViewportBounds(null);
    setActiveSavedSearchId(null);
    scheduleFocus(null);
    analytics.track('web_explorer_filters_reset', { category: selectedCategory });
  }, [selectedCategory, scheduleFocus]);

  const updateSuggestionCard = useCallback((nextSuggestion) => {
    if (!nextSuggestion?.id) {
      return;
    }
    setSuggestionCards((prev) => {
      const index = prev.findIndex((item) => item.id === nextSuggestion.id);
      if (index === -1) {
        return prev;
      }
      const clone = [...prev];
      clone[index] = { ...prev[index], ...nextSuggestion };
      return clone;
    });
  }, []);

  const removeSuggestionCard = useCallback((suggestionId) => {
    setSuggestionCards((prev) => prev.filter((item) => item.id !== suggestionId));
  }, []);

  const handleSuggestionFollowToggle = useCallback(
    async (suggestion) => {
      if (!suggestion?.id) {
        return;
      }
      if (!ensureAuthenticated()) {
        return;
      }
      try {
        const response = await apiClient.post(`/discovery/suggestions/${suggestion.id}/follow`);
        const updated = response?.suggestion ?? null;
        if (updated) {
          updateSuggestionCard(updated);
        } else {
          updateSuggestionCard({ ...suggestion, followed: !suggestion.followed });
        }
      } catch (error) {
        console.warn('Failed to toggle discovery suggestion follow status', error);
      }
    },
    [ensureAuthenticated, updateSuggestionCard],
  );

  const handleSuggestionSave = useCallback(
    async (suggestion) => {
      if (!suggestion?.id) {
        return;
      }
      if (!ensureAuthenticated()) {
        return;
      }
      try {
        const response = await apiClient.post(`/discovery/suggestions/${suggestion.id}/save`);
        const updated = response?.suggestion ?? null;
        if (updated) {
          updateSuggestionCard(updated);
        }
      } catch (error) {
        console.warn('Failed to save discovery suggestion', error);
      }
    },
    [ensureAuthenticated, updateSuggestionCard],
  );

  const handleSuggestionDismiss = useCallback(
    async (suggestion) => {
      if (!suggestion?.id) {
        return;
      }
      if (!ensureAuthenticated()) {
        return;
      }
      try {
        const response = await apiClient.post(`/discovery/suggestions/${suggestion.id}/dismiss`);
        const updated = response?.suggestion ?? null;
        removeSuggestionCard(updated?.id ?? suggestion.id);
        handleDiscoveryRefresh();
      } catch (error) {
        console.warn('Failed to dismiss discovery suggestion', error);
      }
    },
    [ensureAuthenticated, removeSuggestionCard, handleDiscoveryRefresh],
  );

  const handleSuggestionView = useCallback(
    async (suggestion) => {
      if (!suggestion?.id) {
        return;
      }
      try {
        await apiClient.post(`/discovery/suggestions/${suggestion.id}/view`, {
          metadata: { source: 'search_page' },
        });
      } catch (error) {
        console.warn('Failed to record discovery suggestion view', error);
      }
      const destination = resolveAbsoluteUrl(suggestion.href ?? suggestion.shareUrl ?? '');
      if (!destination || typeof window === 'undefined') {
        return;
      }
      if (destination.startsWith(window.location.origin)) {
        navigate(destination.replace(window.location.origin, ''));
      } else {
        openExternalLink(destination);
      }
    },
    [navigate],
  );

  const handleSuggestionShare = useCallback(async (suggestion) => {
    if (!suggestion?.id) {
      return;
    }
    try {
      await apiClient.post(`/discovery/suggestions/${suggestion.id}/share`, {
        metadata: { source: 'search_page' },
      });
    } catch (error) {
      console.warn('Failed to record discovery suggestion share', error);
    }
    const shareUrl = resolveAbsoluteUrl(suggestion.shareUrl ?? suggestion.href ?? '');
    if (!shareUrl || typeof window === 'undefined') {
      return;
    }
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: suggestion.title, url: shareUrl });
        return;
      } catch (error) {
        console.warn('Navigator share failed', error);
      }
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        return;
      } catch (error) {
        console.warn('Clipboard write failed', error);
      }
    }
    openExternalLink(shareUrl);
  }, []);

  const handleTrendingPersonaChange = useCallback((personaId) => {
    setActiveTrendingPersona(personaId || 'all');
  }, []);

  const handleTrendingTimeframeChange = useCallback((timeframeId) => {
    setActiveTrendingTimeframe(timeframeId || null);
  }, []);

  const handleTrendingFollow = useCallback(
    async (topic) => {
      if (!topic?.id) {
        return;
      }
      if (!ensureAuthenticated()) {
        return;
      }
      const topicId = `${topic.id}`;
      const alreadyFollowing = topicFollows.get(topicId) ?? Boolean(topic.following);
      if (alreadyFollowing) {
        setTopicFollows((prev) => {
          const next = new Map(prev);
          next.set(topicId, false);
          return next;
        });
        return;
      }
      const categoryKey = typeof topic.category === 'string' ? topic.category.trim().toLowerCase() : '';
      const targetCategory = categoryLabelMap.get(categoryKey) ?? selectedCategory;
      try {
        const payload = {
          name: `Trending · ${topic.topic}`.slice(0, 80),
          category: targetCategory,
          query: topic.topic,
          filters: {},
          sort: 'default',
          notifyByEmail: false,
          notifyInApp: true,
        };
        const existing = savedSearches.find(
          (search) =>
            search.query?.toLowerCase() === payload.query.toLowerCase() &&
            (search.category ?? DEFAULT_CATEGORY) === targetCategory,
        );
        if (existing) {
          setActiveSavedSearchId(existing.id);
        } else {
          const record = await createSavedSearch(payload);
          if (record?.id) {
            setActiveSavedSearchId(record.id);
          }
        }
        setTopicFollows((prev) => {
          const next = new Map(prev);
          next.set(topicId, true);
          return next;
        });
      } catch (error) {
        console.warn('Failed to follow trending topic', error);
      }
    },
    [ensureAuthenticated, topicFollows, categoryLabelMap, selectedCategory, savedSearches, createSavedSearch],
  );

  const handleTrendingView = useCallback(
    (topic) => {
      if (!topic) {
        return;
      }
      const categoryKey = typeof topic.category === 'string' ? topic.category.trim().toLowerCase() : '';
      const categoryId = categoryLabelMap.get(categoryKey) ?? selectedCategory;
      if (categoryId !== selectedCategory) {
        setSelectedCategory(categoryId);
      }
      setQuery(topic.topic ?? '');
      setFilters(normaliseFilters());
      setActiveSavedSearchId(null);
      setPage(1);
      scheduleFocus(null);
    },
    [categoryLabelMap, selectedCategory, scheduleFocus],
  );

  const handleTrendingShare = useCallback((topic) => {
    if (!topic) {
      return;
    }
    const shareUrl = resolveAbsoluteUrl(topic.shareUrl ?? topic.href ?? '');
    if (!shareUrl || typeof window === 'undefined') {
      return;
    }
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({ title: topic.topic, url: shareUrl }).catch((error) => {
        console.warn('Navigator share failed', error);
      });
      return;
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(shareUrl).catch((error) => {
        console.warn('Clipboard write failed', error);
      });
      return;
    }
    openExternalLink(shareUrl);
  }, []);

  const handleConnectionConnect = useCallback(
    async (connection) => {
      if (!connection) {
        return;
      }
      if (!ensureAuthenticated() || !sessionUserId) {
        return;
      }
      const targetId = connection.userId ?? connection.id;
      if (!targetId) {
        return;
      }
      try {
        await createConnectionRequest({ actorId: sessionUserId, targetId });
        setConnectionSpotlights((prev) =>
          prev.map((item) => (item.id === connection.id ? { ...item, status: 'pending' } : item)),
        );
      } catch (error) {
        console.warn('Failed to initiate connection request', error);
      }
    },
    [ensureAuthenticated, sessionUserId],
  );

  const handleConnectionMessage = useCallback(
    (connection) => {
      if (!connection) {
        return;
      }
      if (!ensureAuthenticated()) {
        return;
      }
      const targetId = connection.userId ?? connection.id;
      if (!targetId) {
        return;
      }
      navigate(`/connections?suggested=${encodeURIComponent(targetId)}`);
    },
    [ensureAuthenticated, navigate],
  );

  const handleConnectionSave = useCallback(
    (connection) => {
      if (!connection) {
        return;
      }
      if (!ensureAuthenticated()) {
        return;
      }
      setConnectionSpotlights((prev) =>
        prev.map((item) => (item.id === connection.id ? { ...item, saved: true } : item)),
      );
    },
    [ensureAuthenticated],
  );

  const handleRemoveFilterValue = useCallback(
    (key, value) => {
      setFilters((prev) => {
        const draft = normaliseFilters(prev);
        if (Array.isArray(draft[key])) {
          return { ...draft, [key]: draft[key].filter((item) => item !== value) };
        }
        return { ...draft, [key]: null };
      });
      setActiveSavedSearchId(null);
      scheduleFocus(null);
    },
    [scheduleFocus],
  );

  const handleRemoveRemoteFilter = useCallback(() => {
    setFilters((prev) => ({ ...normaliseFilters(prev), isRemote: null }));
    setActiveSavedSearchId(null);
    scheduleFocus(null);
  }, [scheduleFocus]);

  const handleRemoveFreshnessFilter = useCallback(() => {
    setFilters((prev) => ({ ...normaliseFilters(prev), updatedWithin: null }));
    setActiveSavedSearchId(null);
    scheduleFocus(null);
  }, [scheduleFocus]);

  const handleClearViewport = useCallback(() => {
    setViewportBounds(null);
    setActiveSavedSearchId(null);
    scheduleFocus(null);
  }, [scheduleFocus]);

  const activeFilterChips = useMemo(() => {
    const chips = [];
    const currentFilters = normaliseFilters(filters);

    const arrayKeys = [
      ['employmentTypes', 'Employment type'],
      ['employmentCategories', 'Category'],
      ['durationCategories', 'Duration'],
      ['budgetCurrencies', 'Currency'],
      ['locations', 'Location'],
      ['countries', 'Country'],
      ['regions', 'Region'],
      ['cities', 'City'],
      ['tracks', 'Track'],
      ['organizations', 'Organisation'],
      ['statuses', 'Status'],
    ];

    arrayKeys.forEach(([key, label]) => {
      currentFilters[key].forEach((value) => {
        chips.push({ key, label, value, onRemove: () => handleRemoveFilterValue(key, value) });
      });
    });

    if (currentFilters.isRemote === true) {
      chips.push({ key: 'isRemote', label: 'Remote', value: 'Remote friendly', onRemove: handleRemoveRemoteFilter });
    } else if (currentFilters.isRemote === false) {
      chips.push({ key: 'isRemote', label: 'Remote', value: 'On-site', onRemove: handleRemoveRemoteFilter });
    }

    if (currentFilters.updatedWithin) {
      chips.push({
        key: 'updatedWithin',
        label: 'Freshness',
        value: FRESHNESS_LABELS[currentFilters.updatedWithin] ?? currentFilters.updatedWithin,
        onRemove: handleRemoveFreshnessFilter,
      });
    }

    if (viewportBounds) {
      chips.push({
        key: 'viewport',
        label: 'Map view',
        value: 'Within current map',
        onRemove: handleClearViewport,
      });
    }

    return chips;
  }, [filters, handleRemoveFilterValue, handleRemoveRemoteFilter, handleRemoveFreshnessFilter, viewportBounds, handleClearViewport]);

  const navigate = useNavigate();

  const handleResultClick = useCallback(
    (item) => {
      analytics.track(
        'web_explorer_result_opened',
        {
          id: item.id,
          category: item.category,
          title: item.title,
          query: debouncedQuery || null,
          filters: cleanedFilters,
          mode: 'preview',
        },
        { source: 'web_app' },
      );

      lastFocusedResultIdRef.current = item?.id ?? null;
      setResultDialogState({
        open: true,
        item,
        externalUrl: resolveResultUrl(item),
      });
    },
    [debouncedQuery, cleanedFilters],
  );

  const handleOpenRecordPage = useCallback(
    (item) => {
      analytics.track(
        'web_explorer_result_opened',
        {
          id: item.id,
          category: item.category,
          title: item.title,
          query: debouncedQuery || null,
          filters: cleanedFilters,
          mode: 'detail_page',
        },
        { source: 'web_app' },
      );
      lastFocusedResultIdRef.current = item?.id ?? null;
      navigate(`/explorer/${item.category}/${item.id}`);
    },
    [debouncedQuery, cleanedFilters, navigate],
  );

  const handleCloseResultDialog = useCallback(() => {
    scheduleFocus(lastFocusedResultIdRef.current);
    setResultDialogState({ open: false, item: null, externalUrl: null });
  }, [scheduleFocus]);

  const handleOpenResultExternal = useCallback(() => {
    if (!resultDialogState.externalUrl || !resultDialogState.item) {
      return;
    }
    openExternalLink(resultDialogState.externalUrl);
    analytics.track(
      'web_explorer_result_external_opened',
      {
        id: resultDialogState.item.id,
        category: resultDialogState.item.category,
        url: resultDialogState.externalUrl,
      },
      { source: 'web_app' },
    );
  }, [resultDialogState]);

  const handleViewportChange = useCallback((bounds) => {
    setViewportBounds(bounds);
    analytics.track('web_explorer_map_bounds_updated', { category: selectedCategory, bounds });
  }, [selectedCategory]);

  const openSaveModal = useCallback(
    (mode = 'create', draftOverrides = {}) => {
      const draft = {
        name: resolveSuggestedName({ category: selectedCategory, query: debouncedQuery }),
        notifyByEmail: false,
        notifyInApp: true,
        ...draftOverrides,
      };
      setSaveModalState({ open: true, mode, draft });
      setSaveError(null);
    },
    [selectedCategory, debouncedQuery],
  );

  const handleSaveSearch = useCallback(async () => {
    if (!saveModalState.open || !saveModalState.draft?.name?.trim()) {
      setSaveError('Name is required to save a search.');
      return;
    }
    setIsSubmittingSavedSearch(true);
    setSaveError(null);
    const payload = {
      name: saveModalState.draft.name.trim(),
      category: selectedCategory,
      query: debouncedQuery || '',
      filters: cleanedFilters,
      sort,
      notifyByEmail: saveModalState.draft.notifyByEmail,
      notifyInApp: saveModalState.draft.notifyInApp,
      mapViewport: viewportBounds ?? null,
    };

    try {
      let record;
      if (saveModalState.mode === 'update' && saveModalState.draft.id) {
        record = await updateSavedSearch(saveModalState.draft.id, payload);
      } else {
        record = await createSavedSearch(payload);
      }
      setActiveSavedSearchId(record?.id ?? null);
      setSaveModalState({ open: false, mode: 'create', draft: null });
      analytics.track('web_explorer_search_saved', { category: selectedCategory, ...payload, id: record?.id });
    } catch (error) {
      setSaveError(error?.message || 'Unable to save search. Please try again.');
    } finally {
      setIsSubmittingSavedSearch(false);
    }
  }, [saveModalState, selectedCategory, debouncedQuery, cleanedFilters, sort, updateSavedSearch, createSavedSearch]);

  const handleCloseSaveModal = useCallback(() => {
    setSaveModalState({ open: false, mode: 'create', draft: null });
    setSaveError(null);
    setIsSubmittingSavedSearch(false);
  }, []);

  const handleApplySavedSearch = useCallback(
    (search) => {
      if (!search) {
        return;
      }
      setSelectedCategory(search.category ?? DEFAULT_CATEGORY);
      setQuery(search.query ?? '');
      setFilters(normaliseFilters(search.filters));
      setSort(search.sort ?? 'default');
      setActiveSavedSearchId(search.id);
      if (search.mapViewport) {
        setViewportBounds(search.mapViewport);
        setViewMode('map');
      } else {
        setViewportBounds(null);
        setViewMode('list');
      }
      setPage(1);
      lastTrackedQueryRef.current = null;
      analytics.track('web_explorer_saved_search_applied', { id: search.id, category: search.category });
      scheduleFocus(null);
    },
    [scheduleFocus],
  );

  const handleDeleteSavedSearch = useCallback(async (search) => {
    await deleteSavedSearch(search);
    if (activeSavedSearchId === search.id) {
      setActiveSavedSearchId(null);
    }
    analytics.track('web_explorer_saved_search_deleted', { id: search.id });
  }, [deleteSavedSearch, activeSavedSearchId]);

  const handleEditSavedSearch = useCallback(
    (search) => {
      if (!search) {
        return;
      }
      openSaveModal('update', {
        id: search.id,
        name: search.name,
        notifyByEmail: search.notifyByEmail ?? false,
        notifyInApp: search.notifyInApp ?? true,
      });
    },
    [openSaveModal],
  );

  const handleSortChange = useCallback((event) => {
    const nextSort = event.target.value;
    setSort(nextSort);
    setActiveSavedSearchId(null);
    scheduleFocus(null);
    analytics.track('web_explorer_sort_changed', { category: selectedCategory, sort: nextSort });
  }, [selectedCategory, scheduleFocus]);

  const handleViewModeChange = useCallback(
    (mode) => {
      if (mode === viewMode) {
        return;
      }
      const triggeredByKeyboard =
        typeof document !== 'undefined' && document.activeElement?.dataset?.explorerViewToggle === 'true';
      if (triggeredByKeyboard) {
        scheduleFocus(lastFocusedResultIdRef.current);
      }
      setViewMode(mode);
      analytics.track('web_explorer_view_mode_changed', { mode });
    },
    [viewMode, scheduleFocus],
  );

  const handlePageChange = useCallback(
    (nextPage) => {
      const clamped = Math.max(1, Math.min(totalPages, nextPage));
      setPage(clamped);
      scheduleFocus(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [totalPages, scheduleFocus],
  );

  const currentCategory = getCategoryById(selectedCategory);

  if (!isAuthenticated) {
    const loginState = { from: `${location.pathname}${location.search}` };
    return (
      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(191,219,254,0.35),_transparent_65%)]" aria-hidden="true" />
        <div className="relative mx-auto max-w-3xl px-6">
          <PageHeader
            eyebrow="Explorer"
            title="Sign in to unlock Explorer"
            description="Explorer consolidates roles, gigs, launchpads, and volunteering missions into a single enterprise-grade search experience. Sign in to access personalised filters and saved alerts."
          />

          <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-soft">
            <p className="text-sm text-slate-600">
              Use your Gigvora credentials to access multi-channel search, saved filters, and proactive opportunity alerts across the network.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                to="/login"
                state={loginState}
                className="inline-flex items-center justify-center rounded-full bg-accent px-6 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center justify-center rounded-full border border-slate-200 px-6 py-2 text-sm font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
              >
                Create an account
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!explorerAccessEnabled) {
    const eligibleRoles = getExplorerAllowedMemberships()
      .map((role) => role.charAt(0).toUpperCase() + role.slice(1))
      .join(', ');

    return (
      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(191,219,254,0.35),_transparent_65%)]" aria-hidden="true" />
        <div className="relative mx-auto max-w-4xl px-6">
          <PageHeader
            eyebrow="Explorer"
            title="Explorer access requires activation"
            description="Your current workspace membership does not include Explorer search. Switch to an eligible role or request activation from your administrator."
          />

          <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-10 shadow-soft">
            <div className="flex flex-col items-center text-center">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
                <LockClosedIcon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-lg font-semibold text-slate-900">Explorer is limited to eligible memberships</h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-600">
                Explorer surfaces cross-channel intelligence for sensitive hiring pipelines. Eligible roles include: {eligibleRoles}. Switch roles from your dashboard or contact support to request onboarding.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link
                  to="/settings"
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 px-6 py-2 text-sm font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                >
                  Manage memberships
                </Link>
                <a
                  href="mailto:support@gigvora.com"
                  className="inline-flex items-center justify-center rounded-full bg-accent px-6 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark"
                >
                  Contact support
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden py-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(191,219,254,0.35),_transparent_65%)]" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-6">
        <PageHeader
          eyebrow="Explorer"
          title="Search across the Gigvora ecosystem"
          description="Discover roles, gigs, projects, launchpad cohorts, and volunteer missions in one place. Saved searches and alerts keep you ahead of new opportunities."
          meta={
            <DataStatus
              loading={searchState.loading}
              fromCache={searchState.fromCache}
              lastUpdated={searchState.lastUpdated}
              onRefresh={() => searchState.refresh({ force: true })}
            />
          }
        />

        <div className="mt-8 grid gap-8 lg:grid-cols-[320px,minmax(0,1fr)]">
          <aside className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
              <p className="text-sm font-semibold text-slate-900">Saved searches</p>
              <p className="mt-1 text-xs text-slate-500">Sync filters across devices and receive proactive alerts.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => openSaveModal('create')}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                >
                  <PlusIcon className="h-4 w-4" aria-hidden="true" /> Save current search
                </button>
                {activeSavedSearch ? (
                  <button
                    type="button"
                    onClick={() => handleEditSavedSearch(activeSavedSearch)}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                  >
                    <BookmarkIcon className="h-4 w-4" aria-hidden="true" /> Edit active search
                  </button>
                ) : null}
              </div>
              <div className="mt-5">
                <SavedSearchList
                  savedSearches={savedSearches}
                  onApply={handleApplySavedSearch}
                  onDelete={handleDeleteSavedSearch}
                  loading={savedSearchesLoading}
                  activeSearchId={activeSavedSearchId}
                  canManageServerSearches={canUseServer}
                />
              </div>
            </div>

            <SuggestionRail
              title="Curated for you"
              suggestions={filteredSuggestions}
              loading={discoveryLoading && !suggestionCards.length}
              error={discoveryError && !suggestionCards.length}
              personalizationSummary={suggestionPersonalizationSummary}
              filters={suggestionFilters}
              activeFilter={activeDiscoveryFilter}
              onFilterChange={handleDiscoveryFilterChange}
              onRefresh={handleDiscoveryRefresh}
              onFollowToggle={handleSuggestionFollowToggle}
              onDismiss={handleSuggestionDismiss}
              onSave={handleSuggestionSave}
              onView={handleSuggestionView}
              onShare={handleSuggestionShare}
              analyticsSource="search_page"
            />

            <TrendingTopicsPanel
              title="Trending across the network"
              description={trendingDescription}
              topics={trendingTopicRows}
              loading={discoveryLoading && !trendingTopics.length}
              error={discoveryError && !trendingTopics.length}
              timeframes={trendingTimeframeOptions}
              activeTimeframe={activeTrendingTimeframe ?? trendingTimeframeOptions[0]?.id ?? '7d'}
              onTimeframeChange={handleTrendingTimeframeChange}
              personas={trendingPersonaOptions}
              activePersona={activeTrendingPersona}
              onPersonaChange={handleTrendingPersonaChange}
              onFollow={handleTrendingFollow}
              onView={handleTrendingView}
              onShare={handleTrendingShare}
              analyticsSource="search_page"
            />

            <section className="space-y-6 rounded-[26px] border border-slate-100/80 bg-gradient-to-br from-indigo-50 via-white to-slate-50 p-6 shadow-2xl">
              <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-indigo-500">
                    <SparklesIcon className="h-4 w-4" aria-hidden="true" />
                    Warm introductions
                  </div>
                  <h2 className="mt-2 text-xl font-semibold text-slate-900">People to meet next</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Curated intros informed by your discovery persona and recent activity.
                  </p>
                </div>
                <Link
                  to="/connections"
                  className="hidden rounded-full border border-indigo-200 bg-white/80 px-4 py-2 text-xs font-semibold text-indigo-600 transition hover:border-indigo-300 hover:text-indigo-700 lg:inline-flex"
                >
                  Open network centre
                </Link>
              </header>
              {discoveryError && !connectionSpotlights.length ? (
                <div className="rounded-3xl border border-rose-200 bg-rose-50/80 p-4 text-sm text-rose-600">
                  We couldn’t refresh your introductions. Try again shortly.
                </div>
              ) : null}
              {discoveryLoading && !connectionSpotlights.length ? (
                <div className="space-y-4">
                  {Array.from({ length: 2 }).map((_, index) => (
                    <div key={index} className="h-48 animate-pulse rounded-3xl bg-white/80 shadow-inner" />
                  ))}
                </div>
              ) : null}
              {!discoveryLoading && connectionSpotlights.length ? (
                <div className="space-y-4">
                  {connectionSpotlights.map((connection) => (
                    <ConnectionCard
                      key={connection.id}
                      connection={connection}
                      onConnect={handleConnectionConnect}
                      onMessage={handleConnectionMessage}
                      onSave={handleConnectionSave}
                      analyticsSource="search_page"
                    />
                  ))}
                </div>
              ) : null}
              {!discoveryLoading && !connectionSpotlights.length && !discoveryError ? (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-white/80 p-6 text-center text-sm text-slate-500">
                  We’ll surface personalised introductions as soon as new signals are available. Update your profile interests to accelerate matches.
                </div>
              ) : null}
              <div className="text-right lg:hidden">
                <Link
                  to="/connections"
                  className="inline-flex items-center justify-center rounded-full border border-indigo-200 bg-white/80 px-4 py-2 text-xs font-semibold text-indigo-600 transition hover:border-indigo-300 hover:text-indigo-700"
                >
                  Open network centre
                </Link>
              </div>
            </section>
          </aside>

          <div>
            <form className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft" onSubmit={(event) => event.preventDefault()}>
              <label className="sr-only" htmlFor="explorer-search">
                Search keyword
              </label>
              <input
                id="explorer-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={currentCategory.placeholder}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm transition focus:border-accent focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent/30"
              />

              <div className="mt-6 flex flex-wrap gap-2">
                {CATEGORIES.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => handleCategoryChange(category.id)}
                    className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                      selectedCategory === category.id
                        ? 'bg-accent text-white shadow-soft'
                        : 'border border-slate-200 text-slate-600 hover:border-accent hover:text-accent'
                    }`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>

              <p className="mt-6 text-xs text-slate-500">{currentCategory.tagline}</p>

              {quickFilterPresets.length ? (
                <div className="mt-5 flex flex-wrap gap-2" aria-label="Quick filter presets">
                  {quickFilterPresets.map((preset) => {
                    const isActive = activeQuickFilters.includes(preset.id);
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleQuickFilterToggle(preset)}
                        className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                          isActive
                            ? 'bg-accent text-white shadow-soft'
                            : 'border border-slate-200 text-slate-600 hover:border-accent hover:text-accent'
                        }`}
                        aria-pressed={isActive}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              ) : null}

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsFilterDrawerOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                >
                  <AdjustmentsHorizontalIcon className="h-4 w-4" aria-hidden="true" />
                  Refine filters
                  {hasFiltersApplied(filters) ? (
                    <span className="inline-flex h-5 min-w-[1.75rem] items-center justify-center rounded-full bg-accent/10 px-2 text-[0.6rem] font-semibold text-accent">
                      {activeFilterChips.length}
                    </span>
                  ) : null}
                </button>

                <div className="flex items-center gap-2 rounded-full border border-slate-200 px-2 py-1 text-xs text-slate-600">
                  <button
                    type="button"
                    onClick={() => handleViewModeChange('map')}
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-1 transition ${
                      viewMode === 'map' ? 'bg-accent/10 text-accent' : 'text-slate-500 hover:text-accent'
                    }`}
                    data-explorer-view-toggle="true"
                    aria-pressed={viewMode === 'map'}
                    aria-label="Display explorer results on the map"
                  >
                    <MapIcon className="h-4 w-4" aria-hidden="true" />
                    <span className="sr-only">Map view</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleViewModeChange('list')}
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-1 transition ${
                      viewMode === 'list' ? 'bg-accent/10 text-accent' : 'text-slate-500 hover:text-accent'
                    }`}
                    data-explorer-view-toggle="true"
                    aria-pressed={viewMode === 'list'}
                    aria-label="Display explorer results in a list"
                  >
                    <ListBulletIcon className="h-4 w-4" aria-hidden="true" />
                    <span className="sr-only">List view</span>
                  </button>
                </div>

                <label className="ml-auto flex items-center gap-2 text-xs text-slate-600">
                  Sort by
                  <select
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                    value={sort}
                    onChange={handleSortChange}
                  >
                    {(SORT_OPTIONS[selectedCategory] ?? []).map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {activeFilterChips.length ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  {activeFilterChips.map((chip) => (
                    <button
                      key={`${chip.key}-${chip.value}`}
                      type="button"
                      onClick={chip.onRemove}
                      className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-[0.65rem] font-semibold text-accent transition hover:bg-accent hover:text-white"
                    >
                      {chip.label}: {chip.value}
                      <span aria-hidden="true">×</span>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="inline-flex items-center gap-2 rounded-full border border-transparent bg-slate-100 px-3 py-1 text-[0.65rem] font-semibold text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
                  >
                    Reset all
                  </button>
                </div>
              ) : null}
            </form>

            {canManageExplorerDataset ? (
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsManagementPanelOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-slate-700"
                >
                  Manage {currentCategory.label}
                </button>
              </div>
            ) : null}

            <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span className="font-semibold text-slate-900">
                  Showing {Math.min(results.length, totalResults)} of {totalResults.toLocaleString()} results
                </span>
                {metrics?.processingTimeMs ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-[0.65rem] text-slate-500">
                    <BellIcon className="h-3.5 w-3.5" aria-hidden="true" /> {metrics.processingTimeMs} ms via {metrics.source ?? 'search'}
                  </span>
                ) : null}
                {searchState.error ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-[0.65rem] text-amber-700">
                    <ExclamationCircleIcon className="h-3.5 w-3.5" aria-hidden="true" /> Unable to refresh live data
                  </span>
                ) : null}
              </div>

              {searchState.loading && !results.length ? (
                <div className="mt-8 space-y-4">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="h-36 animate-pulse rounded-3xl bg-slate-100" />
                  ))}
                </div>
              ) : null}

              {!searchState.loading && !results.length ? (
                <div className="mt-8 rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-500">
                  No results match these filters yet. Adjust the filters or pan the map to broaden your search.
                </div>
              ) : null}

              {results.length ? (
                <div ref={resultsContainerRef} className="mt-8">
                  {viewMode === 'map' ? (
                    <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
                      <ExplorerMap items={results} onViewportChange={handleViewportChange} className="h-[520px]" />
                      <div className="max-h-[520px] space-y-4 overflow-y-auto pr-1">
                        {results.map((item) => {
                          const category = getCategoryById(item.category);
                          return (
                            <ExplorerResultCard
                              key={`${item.category}-${item.id}`}
                              item={item}
                              categoryLabel={category.label}
                              metaTokens={toResultMeta(item)}
                              onPreview={handleResultClick}
                              onOpen={handleOpenRecordPage}
                              previewLabel="Preview"
                              openLabel="Open profile →"
                              variant="compact"
                            />
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-5 lg:grid-cols-2">
                      {results.map((item) => {
                        const category = getCategoryById(item.category);
                        return (
                          <ExplorerResultCard
                            key={`${item.category}-${item.id}`}
                            item={item}
                            categoryLabel={category.label}
                            metaTokens={toResultMeta(item)}
                            onPreview={handleResultClick}
                            onOpen={handleOpenRecordPage}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : null}

              {totalPages > 1 && results.length ? (
                <div className="mt-8 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
                  <button
                    type="button"
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    className={`rounded-full border px-4 py-2 font-semibold transition ${
                      page === 1
                        ? 'cursor-not-allowed border-slate-200 text-slate-300'
                        : 'border-slate-200 text-slate-600 hover:border-accent hover:text-accent'
                    }`}
                  >
                    Previous
                  </button>
                  <span className="font-semibold text-slate-900">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === totalPages}
                    className={`rounded-full border px-4 py-2 font-semibold transition ${
                      page === totalPages
                        ? 'cursor-not-allowed border-slate-200 text-slate-300'
                        : 'border-slate-200 text-slate-600 hover:border-accent hover:text-accent'
                    }`}
                  >
                    Next
                  </button>
                </div>
              ) : null}

              {searchState.lastUpdated ? (
                <p className="mt-6 text-[0.65rem] uppercase tracking-[0.35em] text-slate-400">
                  Snapshot {formatRelativeTime(searchState.lastUpdated)} • {formatAbsolute(searchState.lastUpdated)}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <ExplorerManagementPanel
        category={selectedCategory}
        categoryLabel={currentCategory.label}
        isOpen={isManagementPanelOpen}
        onClose={() => setIsManagementPanelOpen(false)}
        onMutate={() => searchState.refresh({ force: true })}
      />

      <ExplorerFilterDrawer
        category={selectedCategory}
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        filters={filters}
        facets={facets}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
      />

      <Transition.Root show={saveModalState.open} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={handleCloseSaveModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-900/50" />
          </Transition.Child>

          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="translate-y-4 opacity-0 sm:translate-y-0 sm:scale-95"
                enterTo="translate-y-0 opacity-100 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="translate-y-0 opacity-100 sm:scale-100"
                leaveTo="translate-y-4 opacity-0 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-3xl bg-white p-6 shadow-xl transition-all">
                  <Dialog.Title className="text-lg font-semibold text-slate-900">
                    {saveModalState.mode === 'update' ? 'Update saved search' : 'Save this search'}
                  </Dialog.Title>
                  <p className="mt-1 text-sm text-slate-500">
                    Saved searches sync to your account. Enable alerts to receive email and in-app notifications when new matches arrive.
                  </p>

                  <div className="mt-5 space-y-5">
                    <div>
                      <label htmlFor="saved-search-name" className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
                        Name
                      </label>
                      <input
                        id="saved-search-name"
                        type="text"
                        value={saveModalState.draft?.name ?? ''}
                        onChange={(event) =>
                          setSaveModalState((prev) => ({
                            ...prev,
                            draft: { ...prev.draft, name: event.target.value },
                          }))
                        }
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm transition focus:border-accent focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent/30"
                        placeholder="e.g. Remote product design roles"
                      />
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Alert me when</p>
                      <Switch.Group as="div" className="mt-4 flex items-center justify-between">
                        <div>
                          <Switch.Label className="text-sm font-semibold text-slate-900">In-app notifications</Switch.Label>
                          <Switch.Description className="text-xs text-slate-500">
                            Receive alerts in the Gigvora notification centre.
                          </Switch.Description>
                        </div>
                        <Switch
                          checked={saveModalState.draft?.notifyInApp ?? true}
                          onChange={(value) =>
                            setSaveModalState((prev) => ({
                              ...prev,
                              draft: { ...prev.draft, notifyInApp: value },
                            }))
                          }
                          className={`${
                            saveModalState.draft?.notifyInApp ? 'bg-accent' : 'bg-slate-200'
                          } relative inline-flex h-6 w-11 items-center rounded-full transition focus:outline-none focus:ring-2 focus:ring-accent/30`}
                        >
                          <span
                            className={`${
                              saveModalState.draft?.notifyInApp ? 'translate-x-6' : 'translate-x-1'
                            } inline-block h-4 w-4 transform rounded-full bg-white transition`}
                          />
                        </Switch>
                      </Switch.Group>

                      <Switch.Group as="div" className="mt-4 flex items-center justify-between">
                        <div>
                          <Switch.Label className="text-sm font-semibold text-slate-900">Email alerts</Switch.Label>
                          <Switch.Description className="text-xs text-slate-500">
                            Send a summary email when new matches are published.
                          </Switch.Description>
                        </div>
                        <Switch
                          checked={saveModalState.draft?.notifyByEmail ?? false}
                          onChange={(value) =>
                            setSaveModalState((prev) => ({
                              ...prev,
                              draft: { ...prev.draft, notifyByEmail: value },
                            }))
                          }
                          className={`${
                            saveModalState.draft?.notifyByEmail ? 'bg-accent' : 'bg-slate-200'
                          } relative inline-flex h-6 w-11 items-center rounded-full transition focus:outline-none focus:ring-2 focus:ring-accent/30`}
                        >
                          <span
                            className={`${
                              saveModalState.draft?.notifyByEmail ? 'translate-x-6' : 'translate-x-1'
                            } inline-block h-4 w-4 transform rounded-full bg-white transition`}
                          />
                        </Switch>
                      </Switch.Group>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
                      <p className="font-semibold text-slate-900">Summary</p>
                      <p className="mt-1">Category: {currentCategory.label}</p>
                      <p className="mt-1">Query: {debouncedQuery || '—'}</p>
                      <p className="mt-1">Filters: {activeFilterChips.length || 0}</p>
                    </div>

                    {saveError ? (
                      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-600">{saveError}</div>
                    ) : null}
                  </div>

                  <div className="mt-6 flex justify-between">
                    <button
                      type="button"
                      onClick={handleCloseSaveModal}
                      className="text-sm font-semibold text-slate-500 transition hover:text-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveSearch}
                      disabled={isSubmittingSavedSearch}
                      className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      {isSubmittingSavedSearch ? 'Saving…' : 'Save search'}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>

      <Transition.Root show={resultDialogState.open} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={handleCloseResultDialog}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-900/50" />
          </Transition.Child>

          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="translate-y-4 opacity-0 sm:translate-y-0 sm:scale-95"
                enterTo="translate-y-0 opacity-100 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="translate-y-0 opacity-100 sm:scale-100"
                leaveTo="translate-y-4 opacity-0 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-3xl bg-white p-6 shadow-xl transition-all">
                  {resultDialogState.item ? (
                    <>
                      <Dialog.Title className="text-lg font-semibold text-slate-900">
                        {resultDialogState.item.title || 'Explorer result'}
                      </Dialog.Title>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.35em] text-accentDark">
                        {getCategoryById(resultDialogState.item.category).label}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
                        {toResultMeta(resultDialogState.item).map((meta) => (
                          <span key={meta} className="rounded-full border border-slate-200 px-3 py-1">
                            {meta}
                          </span>
                        ))}
                      </div>
                      <p className="mt-4 whitespace-pre-line text-sm text-slate-600">
                        {resultDialogState.item.longDescription || resultDialogState.item.description || 'Detailed information will be available shortly.'}
                      </p>
                      <div className="mt-4 grid gap-3 text-xs text-slate-500 sm:grid-cols-2">
                        {resultDialogState.item.organization ? (
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                            <p className="font-semibold text-slate-900">Organisation</p>
                            <p className="mt-1">{resultDialogState.item.organization}</p>
                          </div>
                        ) : null}
                        {resultDialogState.item.location ? (
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                            <p className="font-semibold text-slate-900">Primary location</p>
                            <p className="mt-1">{resultDialogState.item.location}</p>
                          </div>
                        ) : null}
                        {resultDialogState.item.employmentType ? (
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                            <p className="font-semibold text-slate-900">Engagement type</p>
                            <p className="mt-1">{resultDialogState.item.employmentType}</p>
                          </div>
                        ) : null}
                        {resultDialogState.item.updatedAt ? (
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                            <p className="font-semibold text-slate-900">Last updated</p>
                            <p className="mt-1 text-slate-500">{formatRelativeTime(resultDialogState.item.updatedAt)}</p>
                          </div>
                        ) : null}
                      </div>

                      <div className="mt-6 flex flex-wrap justify-between gap-3">
                        <button
                          type="button"
                          onClick={handleCloseResultDialog}
                          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                        >
                          Close
                        </button>
                        <div className="flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={handleOpenResultExternal}
                            disabled={!resultDialogState.externalUrl}
                            className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition ${
                              resultDialogState.externalUrl
                                ? 'bg-accent text-white shadow-soft hover:bg-accentDark'
                                : 'cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400'
                            }`}
                          >
                            Open full details
                          </button>
                        </div>
                      </div>
                      {!resultDialogState.externalUrl ? (
                        <p className="mt-4 text-xs text-slate-400">
                          This record does not yet include an external destination. We will notify you once the publisher completes synchronisation.
                        </p>
                      ) : null}
                    </>
                  ) : null}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </section>
  );
}
