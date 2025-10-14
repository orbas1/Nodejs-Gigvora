import { useMemo } from 'react';
import useDebounce from './useDebounce.js';
import useCachedResource from './useCachedResource.js';
import { apiClient } from '../services/apiClient.js';

const endpointByCategory = {
  jobs: '/discovery/jobs',
  gigs: '/discovery/gigs',
  projects: '/discovery/projects',
  launchpads: '/discovery/launchpads',
  volunteering: '/discovery/volunteering',
  mentors: '/discovery/mentors',
};

function normaliseFilters(filters) {
  if (!filters || typeof filters !== 'object') {
    return null;
  }

  return Object.entries(filters).reduce((accumulator, [key, value]) => {
    if (value == null) {
      return accumulator;
    }

    if (Array.isArray(value)) {
      const cleaned = value.map((entry) => `${entry}`.trim()).filter(Boolean);
      if (cleaned.length) {
        accumulator[key] = cleaned;
      }
      return accumulator;
    }

    if (typeof value === 'object') {
      const nested = normaliseFilters(value);
      if (nested && Object.keys(nested).length) {
        accumulator[key] = nested;
      }
      return accumulator;
    }

    const stringValue = `${value}`.trim();
    if (stringValue.length) {
      accumulator[key] = value;
    }
    return accumulator;
  }, {});
}

function stableSerialise(value) {
  if (value == null) {
    return null;
  }

  const normalise = (input) => {
    if (Array.isArray(input)) {
      return input
        .map((item) => normalise(item))
        .filter((item) => item !== undefined)
        .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
    }

    if (input && typeof input === 'object') {
      return Object.keys(input)
        .sort()
        .reduce((accumulator, key) => {
          const normalisedValue = normalise(input[key]);
          if (normalisedValue !== undefined && normalisedValue !== null) {
            accumulator[key] = normalisedValue;
          }
          return accumulator;
        }, {});
    }

    if (input === undefined || input === '') {
      return undefined;
    }

    return input;
  };

  const normalised = normalise(value);
  if (normalised == null) {
    return null;
  }

  if (typeof normalised === 'object' && !Array.isArray(normalised) && !Object.keys(normalised).length) {
    return null;
  }

  return JSON.stringify(normalised);
}

export default function useOpportunityListing(
  category,
  query,
  {
    pageSize = 20,
    filters = null,
    sort = null,
    includeFacets = false,
    viewport = null,
    headers = null,
    enabled = true,
  } = {},
) {
  const endpoint = endpointByCategory[category];
  if (!endpoint) {
    throw new Error(`Unsupported opportunity category: ${category}`);
  }

  const trimmedQuery = (query || '').trim();
  const debouncedQuery = useDebounce(trimmedQuery, 400);

  const normalisedFilters = useMemo(() => normaliseFilters(filters), [filters]);
  const filterKey = useMemo(() => stableSerialise(normalisedFilters) ?? 'none', [normalisedFilters]);
  const sortKey = useMemo(() => stableSerialise(sort) ?? 'default', [sort]);
  const viewportKey = useMemo(() => stableSerialise(viewport) ?? 'none', [viewport]);
  const headersKey = useMemo(() => stableSerialise(headers) ?? 'none', [headers]);

  const params = useMemo(
    () => ({
      q: debouncedQuery || undefined,
      pageSize,
      filters: normalisedFilters ? JSON.stringify(normalisedFilters) : undefined,
      sort: sort ? (typeof sort === 'string' ? sort : JSON.stringify(sort)) : undefined,
      includeFacets: includeFacets ? 'true' : undefined,
      viewport: viewport ? (typeof viewport === 'string' ? viewport : JSON.stringify(viewport)) : undefined,
    }),
    [debouncedQuery, pageSize, normalisedFilters, sort, includeFacets, viewport],
  );

  const requestHeaders = useMemo(() => {
    if (!headers) {
      return undefined;
    }

    return Object.entries(headers).reduce((accumulator, [key, value]) => {
      if (value == null) {
        return accumulator;
      }
      const stringValue = `${value}`.trim();
      if (stringValue.length) {
        accumulator[key] = stringValue;
      }
      return accumulator;
    }, {});
  }, [headers, headersKey]);

  const cacheKey = useMemo(() => {
    const queryKey = debouncedQuery || 'all';
    return `opportunity:${category}:${queryKey}:${filterKey}:${sortKey}:${viewportKey}:${includeFacets ? 'facets' : 'no-facets'}:${pageSize}:${headersKey}`;
  }, [category, debouncedQuery, filterKey, sortKey, viewportKey, includeFacets, pageSize, headersKey]);

  const resource = useCachedResource(
    cacheKey,
    ({ signal }) =>
      apiClient.get(endpoint, {
        signal,
        params,
        headers: requestHeaders,
      }),
    {
      dependencies: [debouncedQuery, filterKey, sortKey, viewportKey, includeFacets, pageSize, headersKey],
      ttl: 1000 * 60 * 5,
      enabled: Boolean(enabled),
    },
  );

  return { ...resource, debouncedQuery };
}
