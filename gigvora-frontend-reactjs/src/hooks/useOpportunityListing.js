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

function stableStringify(value) {
  if (value == null) {
    return '';
  }

  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(',')}]`;
  }

  if (typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${key}:${stableStringify(value[key])}`)
      .join(',')}}`;
  }

  return `${value}`;
}

function normaliseFilters(filters) {
  if (!filters || typeof filters !== 'object') {
    return null;
  }

  return Object.entries(filters).reduce((accumulator, [key, value]) => {
    if (value == null) {
      return accumulator;
    }

    if (Array.isArray(value)) {
      const cleaned = value
        .map((entry) => `${entry}`.trim())
        .filter((entry) => entry.length > 0);
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

    const trimmed = `${value}`.trim();
    if (trimmed.length) {
      accumulator[key] = trimmed;
    }
    return accumulator;
  }, {});
}

function normaliseHeaders(headers) {
  if (!headers || typeof headers !== 'object') {
    return null;
  }

  return Object.entries(headers).reduce((accumulator, [key, value]) => {
    if (value == null) {
      return accumulator;
    }
    const trimmed = `${value}`.trim();
    if (trimmed.length) {
      accumulator[key] = trimmed;
    }
    return accumulator;
  }, {});
}

export default function useOpportunityListing(
  category,
  query,
  {
    page = 1,
    pageSize = 20,
    filters = null,
    sort = null,
    includeFacets = false,
    viewport = null,
    headers = null,
    enabled = true,
  } = {},
) {
  const trimmedQuery = (query || '').trim();
  const debouncedQuery = useDebounce(trimmedQuery, 400);
  const endpoint = endpointByCategory[category];

  if (!endpoint) {
    throw new Error(`Unsupported opportunity category: ${category}`);
  }

  const normalisedFilters = useMemo(() => normaliseFilters(filters), [filters]);
  const normalisedHeaders = useMemo(() => normaliseHeaders(headers), [headers]);

  const sortKey = useMemo(() => stableStringify(sort) || 'default-sort', [sort]);
  const filtersKey = useMemo(
    () => (normalisedFilters ? stableStringify(normalisedFilters) : 'no-filters'),
    [normalisedFilters],
  );
  const viewportKey = useMemo(
    () => (viewport == null ? 'no-viewport' : stableStringify(viewport)),
    [viewport],
  );
  const headersKey = useMemo(
    () => (normalisedHeaders ? stableStringify(normalisedHeaders) : 'no-headers'),
    [normalisedHeaders],
  );

  const cacheKey = useMemo(() => {
    const parts = [
      category,
      debouncedQuery || 'all',
      page,
      pageSize,
      filtersKey,
      sortKey,
      includeFacets ? 'with-facets' : 'no-facets',
      viewportKey,
      headersKey,
    ];
    return `opportunity:${parts.join(':')}`;
  }, [category, debouncedQuery, page, pageSize, filtersKey, sortKey, includeFacets, viewportKey, headersKey]);

  const params = useMemo(
    () => ({
      q: debouncedQuery || undefined,
      page: page > 1 ? page : undefined,
      pageSize,
      filters: normalisedFilters ? JSON.stringify(normalisedFilters) : undefined,
      sort: sort ? (typeof sort === 'string' ? sort : JSON.stringify(sort)) : undefined,
      includeFacets: includeFacets ? 'true' : undefined,
      viewport: viewport ? (typeof viewport === 'string' ? viewport : JSON.stringify(viewport)) : undefined,
    }),
    [debouncedQuery, page, pageSize, normalisedFilters, sort, includeFacets, viewport],
  );

  const requestHeaders = useMemo(() => {
    if (!normalisedHeaders) {
      return undefined;
    }
    return normalisedHeaders;
  }, [normalisedHeaders]);

  const shouldFetch = Boolean(enabled);

  const resource = useCachedResource(
    cacheKey,
    ({ signal }) =>
      apiClient.get(endpoint, {
        signal,
        params,
        headers: requestHeaders,
      }),
    {
      dependencies: [endpoint, cacheKey],
      ttl: 1000 * 60 * 5,
      enabled: shouldFetch,
    },
  );

  return { ...resource, debouncedQuery };
}
