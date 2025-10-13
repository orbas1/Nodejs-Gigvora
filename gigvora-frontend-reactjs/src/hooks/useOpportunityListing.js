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

function stableSerialize(value) {
  if (value == null) {
    return '';
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(',')}]`;
  }

  if (typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${key}:${stableSerialize(value[key])}`)
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
    if (`${value}`.trim().length) {
      accumulator[key] = value;
    }
    return accumulator;
  }, {});
}

export default function useOpportunityListing(
  category,
  query,
  { pageSize = 20, filters = null, sort = null, includeFacets = false, viewport = null, enabled = true } = {},
) {
  const debouncedQuery = useDebounce((query || '').trim(), 400);
  const endpoint = endpointByCategory[category];

  const normalisedFilters = useMemo(() => normaliseFilters(filters), [filters]);
  const filterKey = useMemo(() => stableSerialize(normalisedFilters), [normalisedFilters]);
  const sortKey = useMemo(() => stableSerialize(sort), [sort]);
  const viewportKey = useMemo(() => stableSerialize(viewport), [viewport]);

  const cacheKey = useMemo(() => {
    const parts = [
      category,
      debouncedQuery || 'all',
      filterKey || 'no-filters',
      sortKey || 'default-sort',
      includeFacets ? 'facets' : 'no-facets',
      viewportKey || 'no-viewport',
      pageSize,
    ];
    return `opportunity:${parts.join(':')}`;
  }, [category, debouncedQuery, filterKey, sortKey, includeFacets, viewportKey, pageSize]);

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

  const resource = useCachedResource(
    cacheKey,
    ({ signal }) =>
      apiClient.get(endpoint, {
        signal,
        params,
      }),
    {
      dependencies: [debouncedQuery, filterKey, sortKey, includeFacets, viewportKey, pageSize],
      ttl: 1000 * 60 * 5,
      enabled,
    },
  );

  return { ...resource, debouncedQuery };
}
