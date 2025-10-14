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

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed.length) {
        accumulator[key] = trimmed;
      }
      return accumulator;
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      accumulator[key] = value;
      return accumulator;
    }

    if (Array.isArray(value)) {
      const cleaned = value
        .map((entry) => {
          if (entry == null) {
            return null;
          }
          if (typeof entry === 'string') {
            const trimmed = entry.trim();
            return trimmed.length ? trimmed : null;
          }
          return entry;
        })
        .filter((entry) => entry !== null);
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

    return accumulator;
  }, {});
}

function normaliseSort(sort) {
  if (sort == null) {
    return null;
  }
  if (typeof sort === 'string') {
    const trimmed = sort.trim();
    return trimmed.length ? trimmed : null;
  }
  if (typeof sort === 'object') {
    return normaliseFilters(sort);
  }
  return sort;
}

function normaliseViewport(viewport) {
  if (viewport == null) {
    return null;
  }
  if (typeof viewport === 'string') {
    const trimmed = viewport.trim();
    return trimmed.length ? trimmed : null;
  }
  if (typeof viewport === 'object') {
    return normaliseFilters(viewport);
  }
  return viewport;
}

function normaliseHeaders(headers) {
  if (!headers || typeof headers !== 'object') {
    return null;
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
}

function stableSerialise(value) {
  if (value == null) {
    return null;
  }

  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableSerialise(entry) ?? 'null').join(',')}]`;
  }

  if (typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${key}:${stableSerialise(value[key]) ?? 'null'}`)
      .join(',')}}`;
  }

  return `${value}`;
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
  const normalisedSort = useMemo(() => normaliseSort(sort), [sort]);
  const normalisedViewport = useMemo(() => normaliseViewport(viewport), [viewport]);
  const normalisedHeaders = useMemo(() => normaliseHeaders(headers), [headers]);

  const filtersKey = useMemo(() => stableSerialise(normalisedFilters) ?? 'no-filters', [normalisedFilters]);
  const sortKey = useMemo(() => stableSerialise(normalisedSort) ?? 'default-sort', [normalisedSort]);
  const viewportKey = useMemo(() => stableSerialise(normalisedViewport) ?? 'no-viewport', [normalisedViewport]);
  const headersKey = useMemo(() => stableSerialise(normalisedHeaders) ?? 'default-headers', [normalisedHeaders]);

  const cacheKey = useMemo(
    () =>
      [
        'opportunity',
        category,
        debouncedQuery || 'all',
        `page-${page}`,
        `size-${pageSize}`,
        filtersKey,
        sortKey,
        viewportKey,
        includeFacets ? 'facets' : 'no-facets',
        headersKey,
      ].join(':'),
    [category, debouncedQuery, page, pageSize, filtersKey, sortKey, viewportKey, includeFacets, headersKey],
  );

  const params = useMemo(
    () => ({
      page,
      pageSize,
      q: debouncedQuery || undefined,
      filters: normalisedFilters ? JSON.stringify(normalisedFilters) : undefined,
      sort:
        typeof normalisedSort === 'string'
          ? normalisedSort
          : normalisedSort
          ? JSON.stringify(normalisedSort)
          : undefined,
      includeFacets: includeFacets ? 'true' : undefined,
      viewport:
        typeof normalisedViewport === 'string'
          ? normalisedViewport
          : normalisedViewport
          ? JSON.stringify(normalisedViewport)
          : undefined,
    }),
    [page, pageSize, debouncedQuery, normalisedFilters, normalisedSort, includeFacets, normalisedViewport],
  );

  const resource = useCachedResource(
    cacheKey,
    ({ signal }) =>
      apiClient.get(endpoint, {
        signal,
        params,
        headers: normalisedHeaders || undefined,
      }),
    {
      dependencies: [cacheKey],
      ttl: 1000 * 60 * 5,
      enabled: Boolean(enabled),
    },
  );

  return { ...resource, debouncedQuery };
}
